const mongoose = require('mongoose');

const savingsTransactionSchema = mongoose.Schema({
    savingsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Savings',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    note: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
});

const SavingsTransaction = mongoose.model('SavingsTransaction', savingsTransactionSchema);

module.exports = SavingsTransaction;
