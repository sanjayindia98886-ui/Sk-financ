const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, required: true },
    loanType: { type: String, enum: ['Daily', 'Fixed'], default: 'Daily' },
    totalLoanAmount: { type: Number, required: true },
    totalReturnAmount: { type: Number, default: 0 }, 
    dailyInstallment: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    dueDate: { type: Date },
    collectedAmount: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    penaltyHistory: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            reason: { type: String, default: 'Late payment penalty' }
        }
    ],
    startDate: { type: Date, default: Date.now },
    history: [
        {
            type: { type: String, enum: ['Payment', 'TopUp', 'Penalty'] },
            amount: Number,
            date: { type: Date, default: Date.now },
            note: String
        }
    ]
});

module.exports = mongoose.model('Client', clientSchema);