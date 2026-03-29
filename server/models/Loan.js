const mongoose = require('mongoose');

const loanSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    interestRate: {
        type: Number,
        required: true,
    },
    termMonths: {
        type: Number,
        required: true,
    },
    monthlyPayment: {
        type: Number,
        required: true,
    },
    purpose: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'paid'],
        default: 'pending',
    },
    remainingBalance: {
        type: Number,
    },
    totalPaid: {
        type: Number,
        default: 0,
    },
    approvedDate: {
        type: Date,
    },
    adminNote: {
        type: String,
        default: '',
    }
}, {
    timestamps: true
});

// Calculate monthly payment before saving
loanSchema.pre('save', function () {
    if (this.isNew || this.isModified('amount') || this.isModified('interestRate') || this.isModified('termMonths')) {
        const monthlyRate = this.interestRate / 100 / 12;
        if (monthlyRate === 0) {
            this.monthlyPayment = this.amount / this.termMonths;
        } else {
            this.monthlyPayment = (this.amount * monthlyRate * Math.pow(1 + monthlyRate, this.termMonths)) /
                (Math.pow(1 + monthlyRate, this.termMonths) - 1);
        }
        this.monthlyPayment = Math.round(this.monthlyPayment * 100) / 100;
        if (this.remainingBalance == null) {
            this.remainingBalance = this.amount;
        }
    }
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
