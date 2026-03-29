const express = require('express');
const router = express.Router();
const Savings = require('../models/Savings');
const SavingsTransaction = require('../models/SavingsTransaction');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all savings goals for current user
// @route   GET /api/savings
router.get('/', async (req, res) => {
    try {
        const savings = await Savings.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(savings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get savings summary
// @route   GET /api/savings/summary
router.get('/summary', async (req, res) => {
    try {
        const savings = await Savings.find({ userId: req.user.id });
        const totalSaved = savings.reduce((sum, s) => sum + s.currentAmount, 0);
        const totalTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
        const activeGoals = savings.filter(s => s.status === 'active').length;
        const completedGoals = savings.filter(s => s.status === 'completed').length;

        res.json({
            totalSaved: Math.round(totalSaved * 100) / 100,
            totalTarget: Math.round(totalTarget * 100) / 100,
            activeGoals,
            completedGoals,
            totalGoals: savings.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new savings goal
// @route   POST /api/savings
router.post('/', async (req, res) => {
    const { goalName, targetAmount, deadline, icon, color } = req.body;

    if (!goalName || !targetAmount) {
        return res.status(400).json({ message: 'Please provide goalName and targetAmount' });
    }

    try {
        const savings = await Savings.create({
            userId: req.user.id,
            goalName,
            targetAmount: Number(targetAmount),
            deadline: deadline || null,
            icon: icon || '💰',
            color: color || '#10B981'
        });

        res.status(201).json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Deposit or withdraw from savings
// @route   POST /api/savings/:id/transaction
router.post('/:id/transaction', async (req, res) => {
    const { type, amount, note } = req.body;

    if (!type || !amount || !['deposit', 'withdrawal'].includes(type)) {
        return res.status(400).json({ message: 'Please provide valid type (deposit/withdrawal) and amount' });
    }

    try {
        const savings = await Savings.findOne({ _id: req.params.id, userId: req.user.id });
        if (!savings) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        if (type === 'withdrawal' && savings.currentAmount < Number(amount)) {
            return res.status(400).json({ message: 'Insufficient savings balance' });
        }

        const transaction = await SavingsTransaction.create({
            savingsId: savings._id,
            userId: req.user.id,
            type,
            amount: Number(amount),
            note: note || ''
        });

        if (type === 'deposit') {
            savings.currentAmount += Number(amount);
        } else {
            savings.currentAmount -= Number(amount);
        }

        if (savings.currentAmount >= savings.targetAmount) {
            savings.status = 'completed';
        }

        await savings.save();

        res.status(201).json({ savings, transaction });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get transactions for a savings goal
// @route   GET /api/savings/:id/transactions
router.get('/:id/transactions', async (req, res) => {
    try {
        const transactions = await SavingsTransaction.find({
            savingsId: req.params.id,
            userId: req.user.id
        }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update savings goal
// @route   PUT /api/savings/:id
router.put('/:id', async (req, res) => {
    try {
        const savings = await Savings.findOne({ _id: req.params.id, userId: req.user.id });
        if (!savings) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        const { goalName, targetAmount, deadline, icon, color, status } = req.body;
        if (goalName) savings.goalName = goalName;
        if (targetAmount) savings.targetAmount = Number(targetAmount);
        if (deadline) savings.deadline = deadline;
        if (icon) savings.icon = icon;
        if (color) savings.color = color;
        if (status) savings.status = status;

        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
router.delete('/:id', async (req, res) => {
    try {
        const savings = await Savings.findOne({ _id: req.params.id, userId: req.user.id });
        if (!savings) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }
        await SavingsTransaction.deleteMany({ savingsId: savings._id });
        await savings.deleteOne();
        res.json({ message: 'Savings goal removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
