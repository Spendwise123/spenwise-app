const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all budgets for current user
// @route   GET /api/budgets
router.get('/', async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get budget summary
// @route   GET /api/budgets/summary
router.get('/summary', async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.id });
        const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
        const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
        const overBudget = budgets.filter(b => b.spentAmount > b.limitAmount).length;

        res.json({
            totalLimit: Math.round(totalLimit * 100) / 100,
            totalSpent: Math.round(totalSpent * 100) / 100,
            totalRemaining: Math.round((totalLimit - totalSpent) * 100) / 100,
            totalBudgets: budgets.length,
            overBudget
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new budget
// @route   POST /api/budgets
router.post('/', async (req, res) => {
    const { name, category, limitAmount, period, startDate, endDate, icon, color } = req.body;

    if (!name || !category || !limitAmount) {
        return res.status(400).json({ message: 'Please provide name, category, and limitAmount' });
    }

    try {
        const budget = await Budget.create({
            userId: req.user.id,
            name,
            category,
            limitAmount: Number(limitAmount),
            period: period || 'monthly',
            startDate: startDate || new Date(),
            endDate: endDate || null,
            icon: icon || '📊',
            color: color || '#6366F1'
        });

        res.status(201).json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Add expense to budget
// @route   POST /api/budgets/:id/expense
router.post('/:id/expense', async (req, res) => {
    const { description, amount, date } = req.body;

    if (!description || !amount) {
        return res.status(400).json({ message: 'Please provide description and amount' });
    }

    try {
        const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const expense = await Expense.create({
            userId: req.user.id,
            description,
            amount: Number(amount),
            category: budget.category,
            date: date || new Date()
        });

        budget.spentAmount += Number(amount);
        await budget.save();

        res.status(201).json({ budget, expense });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update budget
// @route   PUT /api/budgets/:id
router.put('/:id', async (req, res) => {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const { name, category, limitAmount, period, icon, color } = req.body;
        if (name) budget.name = name;
        if (category) budget.category = category;
        if (limitAmount) budget.limitAmount = Number(limitAmount);
        if (period) budget.period = period;
        if (icon) budget.icon = icon;
        if (color) budget.color = color;

        await budget.save();
        res.json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        await budget.deleteOne();
        res.json({ message: 'Budget removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
