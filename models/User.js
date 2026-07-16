const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'employee'],
        default: 'employee'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isApproved: {
        type: Boolean,
        default: function() {
            return this.role === 'super_admin'; 
        }
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Pending'],
        default: function() {
            return this.role === 'super_admin' ? 'Paid' : 'Unpaid';
        }
    },
    licenseStatus: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    licenseValidUntil: {
        type: Date,
        default: () => {
            let date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date;
        }
    },
    securityQuestion1: {
        type: String,
        default: 'What is the name of your favorite person?'
    },
    securityAnswer1: {
        type: String,
        required: false
    },
    securityQuestion2: {
        type: String,
        default: 'What is the name of your favorite teacher?'
    },
    securityAnswer2: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);