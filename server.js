const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: ['https://sk-financ-app.netlify.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

connectDB();

const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateCompanyName,
    getPendingUsers,
    approveOrBlockUser
} = require('./controllers/authController');

const User = require('./models/User'); 
const Client = require('./models/Client'); 

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

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.get('/api/profile', protect, getUserProfile); 
app.put('/api/update-company', protect, updateCompanyName);

app.get('/api/admin/pending', protect, getPendingUsers);
app.post('/api/admin/action', protect, approveOrBlockUser);

app.get('/clients/all', protect, async (req, res) => {
    try {
        const allClients = await Client.find({ userId: req.user.id });
        
        let totalOutflow = 0;
        let totalInflow = 0;
        let totalPending = 0;

        const processedClients = allClients.map(c => {
            const loanAmt = Number(c.totalLoanAmount) || 0;
            const returnAmt = Number(c.totalReturnAmount) || loanAmt;
            const collected = Number(c.collectedAmount) || 0;
            const penaltyAmt = Number(c.penalty) || 0;

            const pendingBalance = (returnAmt + penaltyAmt) - collected;

            const daysPassed = Math.floor((new Date() - new Date(c.startDate)) / (1000 * 60 * 60 * 24));
            const pendingDays = (Number(c.totalDays) || 0) - daysPassed;

            totalOutflow += loanAmt;
            totalInflow += collected;
            totalPending += pendingBalance > 0 ? pendingBalance : 0;

            return {
                ...c._doc,
                id: c._id,
                pendingBalance,
                pendingDays
            };
        });
        
        res.json({ 
            clients: processedClients, 
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

app.put('/clients/collect/:id', protect, async (req, res) => {
    try {
        const { amountReceived } = req.body;
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        client.collectedAmount += Number(amountReceived);
        
        client.history.push({
            type: 'Payment',
            amount: Number(amountReceived),
            date: new Date(),
            note: 'Amount collected'
        });
        
        await client.save();
        res.json({ message: 'Amount collected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/clients/add-penalty/:id', protect, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        client.penalty += Number(amount);
        
        client.penaltyHistory.push({
            amount: Number(amount),
            date: new Date(),
            reason: reason || 'Late payment penalty'
        });
        
        await client.save();
        res.json({ message: 'Penalty added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/clients/delete/:id', protect, async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json({ message: 'Client account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});