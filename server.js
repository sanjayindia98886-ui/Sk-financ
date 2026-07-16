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
const Client = require('./models/Client'); // Imported your original Client model here

// Token Verification Middleware
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

// Admin Control Routes
app.get('/api/admin/pending', protect, async (req, res) => {
    try {
        const allUsers = await User.find({}).select('-password');
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});
app.post('/api/admin/action', protect, approveOrBlockUser);

// Client Management Routes - Fetch all accounts and calculate live dashboard statistics
app.get('/clients/all', protect, async (req, res) => {
    try {
        const allClients = await Client.find({ userId: req.user.id });
        
        let totalOutflow = 0;
        let totalInflow = 0;
        let totalPending = 0;
        
        allClients.forEach(c => {
            totalOutflow += (Number(c.totalLoanAmount) || 0);
            totalInflow += (Number(c.collectedAmount) || 0);
            totalPending += ((Number(c.totalReturnAmount) || Number(c.totalLoanAmount)) - (Number(c.collectedAmount) || 0));
        });
        
        res.json({ 
            clients: allClients, 
            stats: { 
                totalOutflow, 
                totalInflow, 
                netProfit: totalInflow - totalOutflow > 0 ? totalInflow - totalOutflow : 0, 
                totalPending 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Client Management Routes - Save new client tied to specific logged-in user
app.post('/clients/add', protect, async (req, res) => {
    try {
        const { clientName, loanType, totalLoanAmount, totalReturnAmount, dailyInstallment, totalDays } = req.body;
        
        const newClient = new Client({
            userId: req.user.id,
            clientName,
            loanType,
            totalLoanAmount: Number(totalLoanAmount),
            totalReturnAmount: Number(totalReturnAmount) || Number(totalLoanAmount),
            dailyInstallment: Number(dailyInstallment) || 0,
            totalDays: Number(totalDays) || 0
        });
        
        await newClient.save();
        res.status(201).json({ message: 'Account started successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Server Listen (Render Port Fix)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});