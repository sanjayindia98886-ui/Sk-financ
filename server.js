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

// 🔐 Token Verification Middleware (ताकि 500 Internal Server Error न आए)
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

// Auth Routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.get('/api/profile', protect, getUserProfile); 
app.put('/api/update-company', protect, updateCompanyName);

// Admin Routes
app.get('/api/admin/pending', protect, getPendingUsers);
app.post('/api/admin/action', protect, approveOrBlockUser);

// 📝 नया खाता / क्लाइंट सेव करने का राउट (ताकि 404 Not Found एरर ठीक हो जाए)
// (नोट: फ्रंटेंड जिस एंडपॉइंट पर डेटा भेज रहा है, उसके हिसाब से यहाँ नाम बदला जा सकता है)
app.post('/api/clients', protect, async (req, res) => {
    try {
        // यहाँ फ्रंटेंड से भेजा गया डेटा (जैसे Client Name, Loan Amount) मिलेगा
        console.log("Client Data Received:", req.body);
        
        // अभी टेस्टिंग के लिए डायरेक्ट सक्सेस रिस्पॉन्स भेज रहे हैं
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