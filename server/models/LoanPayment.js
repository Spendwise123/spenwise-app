const mongoose = require('mongoose');

const loanPaymentSchema = mongoose.Schema({
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    note: {
        type: String,
        default: '',
    }
}, {
    timestamps: true
});

const LoanPayment = mongoose.model('LoanPayment', loanPaymentSchema);

module.exports = LoanPayment;
