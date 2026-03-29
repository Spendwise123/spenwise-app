const mongoose = require('mongoose');

const budgetSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    limitAmount: {
        type: Number,
        required: true,
    },
    spentAmount: {
        type: Number,
        default: 0,
    },
    period: {
        type: String,
        enum: ['weekly', 'monthly', 'yearly'],
        default: 'monthly',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    icon: {
        type: String,
        default: '📊',
    },
    color: {
        type: String,
        default: '#6366F1',
    }
}, {
    timestamps: true
});

budgetSchema.virtual('remaining').get(function () {
    return this.limitAmount - this.spentAmount;
});

budgetSchema.virtual('percentUsed').get(function () {
    if (this.limitAmount === 0) return 0;
    return Math.min((this.spentAmount / this.limitAmount) * 100, 100);
});

budgetSchema.set('toJSON', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
