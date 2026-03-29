const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Investment = require('../models/Investment');
const Savings = require('../models/Savings');
const Loan = require('../models/Loan');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/authMiddleware');

// Admin middleware
const adminOnly = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

router.use(protect);
router.use(adminOnly);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalInvestments = await Investment.countDocuments();
        const totalSavings = await Savings.countDocuments();
        const totalLoans = await Loan.countDocuments();
        const pendingLoans = await Loan.countDocuments({ status: 'pending' });
        const activeLoans = await Loan.countDocuments({ status: 'active' });

        const investmentAgg = await Investment.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$currentPrice'] } } } }
        ]);
        const totalInvestmentValue = investmentAgg.length > 0 ? investmentAgg[0].totalValue : 0;

        const savingsAgg = await Savings.aggregate([
            { $group: { _id: null, totalSaved: { $sum: '$currentAmount' } } }
        ]);
        const totalSavedAmount = savingsAgg.length > 0 ? savingsAgg[0].totalSaved : 0;

        const loanAgg = await Loan.aggregate([
            { $match: { status: { $in: ['active', 'approved'] } } },
            { $group: { _id: null, totalLoanAmount: { $sum: '$amount' }, totalRemaining: { $sum: '$remainingBalance' } } }
        ]);
        const totalLoanAmount = loanAgg.length > 0 ? loanAgg[0].totalLoanAmount : 0;
        const totalLoanRemaining = loanAgg.length > 0 ? loanAgg[0].totalRemaining : 0;

        res.json({
            totalUsers,
            totalInvestments,
            totalSavings,
            totalLoans,
            pendingLoans,
            activeLoans,
            totalInvestmentValue: Math.round(totalInvestmentValue * 100) / 100,
            totalSavedAmount: Math.round(totalSavedAmount * 100) / 100,
            totalLoanAmount: Math.round(totalLoanAmount * 100) / 100,
            totalLoanRemaining: Math.round(totalLoanRemaining * 100) / 100
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user details with their financial data
// @route   GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const investments = await Investment.find({ userId: req.params.id });
        const savings = await Savings.find({ userId: req.params.id });
        const loans = await Loan.find({ userId: req.params.id });
        const budgets = await Budget.find({ userId: req.params.id });

        res.json({ user, investments, savings, loans, budgets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all pending loans
// @route   GET /api/admin/loans/pending
router.get('/loans/pending', async (req, res) => {
    try {
        const loans = await Loan.find({ status: 'pending' })
            .sort({ createdAt: -1 });

        // Populate user info manually
        const loansWithUsers = await Promise.all(loans.map(async (loan) => {
            const user = await User.findById(loan.userId).select('name email');
            return { ...loan.toJSON(), user };
        }));

        res.json(loansWithUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all loans
// @route   GET /api/admin/loans
router.get('/loans', async (req, res) => {
    try {
        const loans = await Loan.find().sort({ createdAt: -1 });
        const loansWithUsers = await Promise.all(loans.map(async (loan) => {
            const user = await User.findById(loan.userId).select('name email');
            return { ...loan.toJSON(), user };
        }));
        res.json(loansWithUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve or reject a loan
// @route   PUT /api/admin/loans/:id
router.put('/loans/:id', async (req, res) => {
    const { status, adminNote } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Please provide valid status (approved/rejected)' });
    }

    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ message: 'Loan has already been processed' });
        }

        loan.status = status === 'approved' ? 'active' : 'rejected';
        loan.adminNote = adminNote || '';
        if (status === 'approved') {
            loan.approvedDate = new Date();
        }

        await loan.save();
        res.json(loan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
