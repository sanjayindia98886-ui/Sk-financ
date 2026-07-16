[3:23 am, 16/7/2026] P: const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, adminId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'This email is already registered!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'user', 
            isApproved: false,
            paymentStatus: 'Pen…
[3:24 am, 16/7/2026] P: const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, adminId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'This email is already registered!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'user', 
            isApproved: false,
            paymentStatus: 'Pending',
            adminId: role === 'employee' ? adminId : null
        });
        await newUser.save();

        res.status(201).json({ 
            message: 'User registered successfully! Pending admin approval.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        if (!user.isApproved) {
            return res.status(403).json({ 
                status: 'PENDING_APPROVAL',
                message: 'Your account is pending approval. Please wait for the Super Admin to approve your account.' 
            });
        }

        if (user.paymentStatus === 'Unpaid' || user.paymentStatus === 'Pending') {
            return res.status(402).json({ 
                status: 'PAYMENT_PENDING',
                message: 'Your payment is pending. Please complete the payment to access the dashboard.' 
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                paymentStatus: user.paymentStatus
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const updateCompanyName = async (req, res) => {
    try {
        const { companyName } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }
        
        user.companyName = companyName; 
        await user.save();
        res.json({ message: 'Company name updated successfully', companyName: user.companyName });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false }).select('-password');
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const approveOrBlockUser = async (req, res) => {
    try {
        const { userId, action } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        if (action === 'approve') {
            user.isApproved = true;
            user.paymentStatus = 'Paid';
            await user.save();
            return res.json({ message: 'User approved successfully!', user });
        } else if (action === 'block') {
            await User.findByIdAndDelete(userId);
            return res.json({ message: 'User request rejected successfully!' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email, securityAnswer1, securityAnswer2, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email!' });
        }

        if (user.securityAnswer1 !== securityAnswer1 || user.securityAnswer2 !== securityAnswer2) {
            return res.status(400).json({ message: 'Security answers do not match!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successful! You can now log in.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateCompanyName,
    getPendingUsers,
    approveOrBlockUser,
    forgotPassword
};