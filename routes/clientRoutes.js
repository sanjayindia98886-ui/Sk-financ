const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { protect } = require('../middleware/authMiddleware');

// 1. Add New Client / Loan
router.post('/add', protect, async (req, res) => {
    try {
        const { clientName, loanType, totalLoanAmount, totalReturnAmount, dailyInstallment, totalDays } = req.body;
        const newLoan = new Client({
            userId: req.user.id,
            clientName,
            loanType,
            totalLoanAmount: Number(totalLoanAmount) || 0,
            totalReturnAmount: Number(totalReturnAmount) || Number(totalLoanAmount) || 0, 
            dailyInstallment: Number(dailyInstallment || 0),
            totalDays: Number(totalDays || 0),
            collectedAmount: 0,
            penalty: 0,
            penaltyHistory: [],
            history: []
        });
        await newLoan.save();
        res.status(201).json(newLoan);
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

// 2. Get All Data with Calculations and Master Stats
router.get('/all', protect, async (req, res) => {
    try {
        const loans = await Client.find({ userId: req.user.id });
        
        let totalOutflow = 0;
        let totalInflow = 0;
        let netProfit = 0;
        let grandTotalPending = 0;

        const processedLoans = loans.map(loan => {
            const startDate = loan.startDate ? new Date(loan.startDate) : new Date();
            const today = new Date();
            const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            
            const totalDays = Number(loan.totalDays) || 0;
            const pendingDays = Math.max(0, totalDays - daysPassed);
            
            const returnAmt = Number(loan.totalReturnAmount) || Number(loan.totalLoanAmount) || 0;
            const collectedAmt = Number(loan.collectedAmount) || 0;
            const loanAmt = Number(loan.totalLoanAmount) || 0;
            
            const savedPenalty = Number(loan.penalty) || 0;
            
            const pendingBalance = (returnAmt + savedPenalty) - collectedAmt;
            
            totalOutflow += loanAmt;
            totalInflow += collectedAmt;
            netProfit += (returnAmt - loanAmt);
            grandTotalPending += pendingBalance;

            return { 
                ...loan._doc, 
                totalReturnAmount: returnAmt,
                pendingDays, 
                pendingBalance, 
                penalty: savedPenalty
            };
        });

        res.json({
            clients: processedLoans,
            stats: { 
                totalOutflow, 
                totalInflow, 
                netProfit, 
                totalPending: grandTotalPending 
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

// 3. Delete Client
router.delete('/delete/:id', protect, async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Account deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

// 4. Collect Amount and Add to History
router.put('/collect/:id', protect, async (req, res) => {
    try {
        const loan = await Client.findById(req.params.id);
        if (!loan) return res.status(404).json({ message: 'Client not found!' });
        
        const amountToAdd = Number(req.body.amountReceived) || 0;
        
        loan.collectedAmount = (Number(loan.collectedAmount) || 0) + amountToAdd;
        
        loan.history.push({
            type: 'Payment',
            amount: amountToAdd,
            date: new Date(),
            note: 'Installment collected'
        });
        
        await loan.save();
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

// 5. Add Penalty and Keep History
router.put('/add-penalty/:id', protect, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const loan = await Client.findById(req.params.id);

        if (!loan) {
            return res.status(404).json({ message: 'Client not found!' });
        }

        const penaltyAmount = Number(amount) || 0;

        if (!loan.penaltyHistory) {
            loan.penaltyHistory = [];
        }

        loan.penaltyHistory.push({
            amount: penaltyAmount,
            date: new Date(),
            reason: reason || 'Late payment penalty'
        });

        loan.penalty = (Number(loan.penalty) || 0) + penaltyAmount;

        await loan.save();
        res.json({ message: 'Penalty added successfully!', loan });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

module.exports = router;