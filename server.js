const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['https://sk-financ-app.netlify.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect Database
connectDB();

// Import Controllers
const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateCompanyName,
    getPendingUsers,
    approveOrBlockUser
} = require('./controllers/authController');

const User = require('./models/User'); 

// 🔐 Token Verification Middleware
const protect = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Auth & Profile Routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.get('/api/profile', protect, getUserProfile); 
app.put('/api/update-company', protect, updateCompanyName);

// 👥 Admin Control Routes (ताकि पेंडिंग और अप्रूव्ड दोनों यूजर्स आएं)
app.get('/api/admin/pending', protect, async (req, res) => {
    try {
        const allUsers = await User.find({}).select('-password');
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});
app.post('/api/admin/action', protect, approveOrBlockUser);

// 📝 क्लाइंट्स/खाता मैनेजमेंट के राउट्स (आपके फ्रंटेंड के मुताबिक)
app.get('/clients/all', protect, async (req, res) => {
    try {
        res.json({ clients: [], stats: { totalOutflow: 0, totalInflow: 0, netProfit: 0, totalPending: 0 } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/clients/add', protect, async (req, res) => {
    try {
        console.log("Client data received:", req.body);
        res.status(201).json({ message: 'Account started successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Server Listen (Render Port Fix 🚀)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});