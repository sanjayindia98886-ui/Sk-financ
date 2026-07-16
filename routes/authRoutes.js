const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authmiddleware');
const bcrypt = require('bcryptjs'); 
const User = require('../models/User'); 

const { registerUser, loginUser, getUserProfile, updateCompanyName } = authController;

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/me', protect, getUserProfile);

router.put('/update-company', protect, updateCompanyName);

router.put('/forgot-password', async (req, res) => {
    try {
        const { email, securityAnswer1, securityAnswer2, newPassword } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'This email is not registered!' });
        }

        if (
            user.securityAnswer1.toLowerCase().trim() !== securityAnswer1.toLowerCase().trim() ||
            user.securityAnswer2.toLowerCase().trim() !== securityAnswer2.toLowerCase().trim()
        ) {
            return res.status(400).json({ message: 'Security answers do not match!' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password reset successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

router.get('/admin/users', protect, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser || adminUser.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access! You are not a super admin.' });
        }

        const users = await User.find({ role: { $ne: 'super_admin' } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

router.put('/admin/update-status/:id', protect, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser || adminUser.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access!' });
        }

        const { isApproved, paymentStatus, role } = req.body;
        
        const updateData = {};
        if (isApproved !== undefined) updateData.isApproved = isApproved;
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        if (role !== undefined) updateData.role = role;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        res.json({ message: 'User status updated successfully!', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

module.exports = router;