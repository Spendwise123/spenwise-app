const mongoose = require('mongoose');

const investmentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assetName: {
        type: String,
        required: true,
    },
    assetType: {
        type: String,
        enum: ['stocks', 'crypto', 'bonds', 'mutual-funds', 'real-estate'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    purchasePrice: {
        type: Number,
        required: true,
    },
    currentPrice: {
        type: Number,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'sold'],
        default: 'active',
    },
    notes: {
        type: String,
        default: '',
    }
}, {
    timestamps: true
});

investmentSchema.virtual('totalValue').get(function () {
    return this.quantity * this.currentPrice;
});

investmentSchema.virtual('totalCost').get(function () {
    return this.quantity * this.purchasePrice;
});

investmentSchema.virtual('profitLoss').get(function () {
    return (this.currentPrice - this.purchasePrice) * this.quantity;
});

investmentSchema.set('toJSON', { virtuals: true });

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
