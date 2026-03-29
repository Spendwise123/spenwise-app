const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all investments for current user
// @route   GET /api/investments
router.get('/', async (req, res) => {
    try {
        const investments = await Investment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(investments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get portfolio summary
// @route   GET /api/investments/summary
router.get('/summary', async (req, res) => {
    try {
        const investments = await Investment.find({ userId: req.user.id, status: 'active' });
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
        const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
        const totalProfitLoss = totalValue - totalInvested;
        const percentChange = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0;

        // Group by asset type
        const byType = {};
        investments.forEach(inv => {
            if (!byType[inv.assetType]) {
                byType[inv.assetType] = { count: 0, value: 0, invested: 0 };
            }
            byType[inv.assetType].count++;
            byType[inv.assetType].value += inv.quantity * inv.currentPrice;
            byType[inv.assetType].invested += inv.quantity * inv.purchasePrice;
        });

        res.json({
            totalInvested: Math.round(totalInvested * 100) / 100,
            totalValue: Math.round(totalValue * 100) / 100,
            totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
            percentChange: Math.round(percentChange * 100) / 100,
            assetCount: investments.length,
            byType
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add new investment
// @route   POST /api/investments
router.post('/', async (req, res) => {
    const { assetName, assetType, quantity, purchasePrice, currentPrice, notes } = req.body;

    if (!assetName || !assetType || !quantity || !purchasePrice) {
        return res.status(400).json({ message: 'Please provide assetName, assetType, quantity, and purchasePrice' });
    }

    try {
        const investment = await Investment.create({
            userId: req.user.id,
            assetName,
            assetType,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            currentPrice: Number(currentPrice || purchasePrice),
            notes: notes || ''
        });

        res.status(201).json(investment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update investment
// @route   PUT /api/investments/:id
router.put('/:id', async (req, res) => {
    try {
        const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        const { currentPrice, quantity, status, notes } = req.body;
        if (currentPrice != null) investment.currentPrice = Number(currentPrice);
        if (quantity != null) investment.quantity = Number(quantity);
        if (status) investment.status = status;
        if (notes != null) investment.notes = notes;

        await investment.save();
        res.json(investment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete investment
// @route   DELETE /api/investments/:id
router.delete('/:id', async (req, res) => {
    try {
        const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }
        await investment.deleteOne();
        res.json({ message: 'Investment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
