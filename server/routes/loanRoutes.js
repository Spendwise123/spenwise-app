const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all loans for current user
// @route   GET /api/loans
router.get('/', async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get loan summary
// @route   GET /api/loans/summary
router.get('/summary', async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.id });
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'approved');
        const totalBorrowed = activeLoans.reduce((sum, l) => sum + l.amount, 0);
        const totalRemaining = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
        const totalPaid = loans.reduce((sum, l) => sum + l.totalPaid, 0);
        const pendingLoans = loans.filter(l => l.status === 'pending').length;

        res.json({
            totalBorrowed: Math.round(totalBorrowed * 100) / 100,
            totalRemaining: Math.round(totalRemaining * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            activeLoans: activeLoans.length,
            pendingLoans,
            totalLoans: loans.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Apply for a new loan
// @route   POST /api/loans
router.post('/', async (req, res) => {
    const { amount, interestRate, termMonths, purpose } = req.body;

    if (!amount || !interestRate || !termMonths || !purpose) {
        return res.status(400).json({ message: 'Please provide amount, interestRate, termMonths, and purpose' });
    }

    try {
        const loan = await Loan.create({
            userId: req.user.id,
            amount: Number(amount),
            interestRate: Number(interestRate),
            termMonths: Number(termMonths),
            purpose,
            monthlyPayment: 0 // Will be calculated by pre-save hook
        });

        res.status(201).json(loan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Make a loan payment
// @route   POST /api/loans/:id/payment
router.post('/:id/payment', async (req, res) => {
    const { amount, note } = req.body;

    if (!amount) {
        return res.status(400).json({ message: 'Please provide payment amount' });
    }

    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        if (loan.status !== 'active') {
            return res.status(400).json({ message: 'Loan is not active. Cannot make payment.' });
        }

        const paymentAmount = Math.min(Number(amount), loan.remainingBalance);

        const payment = await LoanPayment.create({
            loanId: loan._id,
            userId: req.user.id,
            amount: paymentAmount,
            note: note || ''
        });

        loan.remainingBalance -= paymentAmount;
        loan.totalPaid += paymentAmount;

        if (loan.remainingBalance <= 0) {
            loan.remainingBalance = 0;
            loan.status = 'paid';
        }

        await loan.save();

        res.status(201).json({ loan, payment });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get payments for a loan
// @route   GET /api/loans/:id/payments
router.get('/:id/payments', async (req, res) => {
    try {
        const payments = await LoanPayment.find({
            loanId: req.params.id,
            userId: req.user.id
        }).sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single loan details
// @route   GET /api/loans/:id
router.get('/:id', async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
