const mongoose = require('mongoose');

const savingsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    goalName: {
        type: String,
        required: true,
    },
    targetAmount: {
        type: Number,
        required: true,
    },
    currentAmount: {
        type: Number,
        default: 0,
    },
    deadline: {
        type: Date,
    },
    icon: {
        type: String,
        default: '💰',
    },
    color: {
        type: String,
        default: '#10B981',
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
    }
}, {
    timestamps: true
});

savingsSchema.virtual('progress').get(function () {
    if (this.targetAmount === 0) return 0;
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

savingsSchema.set('toJSON', { virtuals: true });

const Savings = mongoose.model('Savings', savingsSchema);

module.exports = Savings;
