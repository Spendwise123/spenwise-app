const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add new expense
// @route   POST /api/expenses
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

router.post('/', async (req, res) => {
    const { description, amount, category, date } = req.body;

    const expense = new Expense({
        description,
        amount,
        category,
        date
    });

    try {
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
