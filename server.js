const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Register User / Employee Logic
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, adminId, securityAnswer1, securityAnswer2 } = req.body;

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
            role, 
            adminId: role === 'employee' ? adminId : null,
            securityAnswer1,
            securityAnswer2
        });
        await newUser.save();

        res.status(201).json({ 
            message: 'User registered successfully!',
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

// 2. Login User Logic
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

        // Case 1: If account is pending approval from Super Admin
        if (!user.isApproved) {
            return res.status(403).json({ 
                status: 'PENDING_APPROVAL',
                message: 'Your account is pending approval. Please wait for the Super Admin to approve your account.' 
            });
        }

        // Case 2: If account is approved but payment is pending/unpaid
        if (user.paymentStatus === 'Unpaid' || user.paymentStatus === 'Pending') {
            return res.status(402).json({ 
                status: 'PAYMENT_PENDING',
                message: 'Your payment is pending. Please complete the payment to access the dashboard.' 
            });
        }

        // Case 3: Active User - Token Generation
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

// 3. Get User Profile Details Logic
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

// 4. Update Business / Company Name Logic
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

module.exports = { registerUser, loginUser, getUserProfile, updateCompanyName };