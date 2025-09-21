const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const FinancialSummary = require('../models/FinancialSummary');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

// --- BILL MANAGEMENT ---

// @desc    Get all bills for a salon
// @route   GET /api/financial/bills
// @access  Private (Salon Admin)
const getAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, fromDate, toDate } = req.query;
    const salonId = req.user.salonId;

    // Build filter
    const filter = { salonId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (fromDate || toDate) {
      filter.billDate = {};
      if (fromDate) filter.billDate.$gte = new Date(fromDate);
      if (toDate) filter.billDate.$lte = new Date(toDate);
    }

    const bills = await Bill.find(filter)
      .populate('customerId', 'name phoneNumber email')
      .populate('appointmentId', 'appointmentDate status')
      .populate('services.serviceId', 'name category')
      .populate('services.stylistId', 'name')
      .populate('createdBy', 'name')
      .sort({ billDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bill.countDocuments(filter);

    res.json({
      bills,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBills: total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get bill by ID
// @route   GET /api/financial/bills/:id
// @access  Private (Salon Admin)
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ 
      _id: req.params.id, 
      salonId: req.user.salonId 
    })
      .populate('customerId', 'name phoneNumber email address')
      .populate('appointmentId', 'appointmentDate status')
      .populate('services.serviceId', 'name category duration')
      .populate('services.stylistId', 'name')
      .populate('products.productId', 'name category')
      .populate('createdBy', 'name');

    if (!bill) {
      return res.status(404).json({ msg: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create new bill
// @route   POST /api/financial/bills
// @access  Private (Salon Admin)
const createBill = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const billData = {
      ...req.body,
      salonId: req.user.salonId,
      createdBy: req.user._id
    };

    const bill = new Bill(billData);
    await bill.save();

    const populatedBill = await Bill.findById(bill._id)
      .populate('customerId', 'name phoneNumber email')
      .populate('services.serviceId', 'name')
      .populate('services.stylistId', 'name')
      .populate('createdBy', 'name');

    res.status(201).json(populatedBill);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update bill payment status
// @route   PATCH /api/financial/bills/:id/payment
// @access  Private (Salon Admin)
const updateBillPayment = async (req, res) => {
  try {
    const { paymentMethod, paidAmount, paymentStatus } = req.body;
    
    const bill = await Bill.findOne({ 
      _id: req.params.id, 
      salonId: req.user.salonId 
    });

    if (!bill) {
      return res.status(404).json({ msg: 'Bill not found' });
    }

    bill.paymentMethod = paymentMethod;
    bill.paidAmount = paidAmount;
    bill.paymentStatus = paymentStatus;
    bill.modifiedBy = req.user._id;

    await bill.save();

    res.json(bill);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// --- PAYMENT MANAGEMENT ---

// @desc    Get all payments
// @route   GET /api/financial/payments
// @access  Private (Salon Admin)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentMethod, status, fromDate, toDate } = req.query;
    const salonId = req.user.salonId;

    const filter = { salonId };
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.paymentDate = {};
      if (fromDate) filter.paymentDate.$gte = new Date(fromDate);
      if (toDate) filter.paymentDate.$lte = new Date(toDate);
    }

    const payments = await Payment.find(filter)
      .populate('billId', 'billNumber totalAmount')
      .populate('customerId', 'name phoneNumber')
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPayments: total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create new payment
// @route   POST /api/financial/payments
// @access  Private (Salon Admin)
const createPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const paymentData = {
      ...req.body,
      salonId: req.user.salonId,
      receivedBy: req.user._id,
      createdBy: req.user._id
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Update the corresponding bill
    const bill = await Bill.findById(req.body.billId);
    if (bill) {
      bill.paidAmount += req.body.amount;
      if (bill.paidAmount >= bill.totalAmount) {
        bill.paymentStatus = 'paid';
      } else if (bill.paidAmount > 0) {
        bill.paymentStatus = 'partial';
      }
      await bill.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('billId', 'billNumber totalAmount')
      .populate('customerId', 'name phoneNumber')
      .populate('receivedBy', 'name');

    res.status(201).json(populatedPayment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// --- EXPENSE MANAGEMENT ---

// @desc    Get all expenses
// @route   GET /api/financial/expenses
// @access  Private (Salon Admin)
const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, fromDate, toDate } = req.query;
    const salonId = req.user.salonId;

    const filter = { salonId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.expenseDate = {};
      if (fromDate) filter.expenseDate.$gte = new Date(fromDate);
      if (toDate) filter.expenseDate.$lte = new Date(toDate);
    }

    const expenses = await Expense.find(filter)
      .populate('reportedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('supplierId', 'name')
      .sort({ expenseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalExpenses: total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create new expense
// @route   POST /api/financial/expenses
// @access  Private (Salon Admin)
const createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const expenseData = {
      ...req.body,
      salonId: req.user.salonId,
      reportedBy: req.user._id,
      createdBy: req.user._id
    };

    const expense = new Expense(expenseData);
    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('reportedBy', 'name')
      .populate('supplierId', 'name');

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get expense statistics
// @route   GET /api/financial/expenses/stats
// @access  Private (Salon Admin)
const getExpenseStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { period = 'monthly' } = req.query;
    
    let dateRange = {};
    const now = new Date();
    
    switch (period) {
      case 'daily':
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateRange = {
          $gte: weekStart,
          $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'monthly':
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
        break;
      case 'yearly':
        dateRange = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear() + 1, 0, 1)
        };
        break;
    }

    const stats = await Expense.aggregate([
      {
        $match: {
          salonId: req.user.salonId,
          expenseDate: dateRange,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          salonId: req.user.salonId,
          expenseDate: dateRange,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      categoryBreakdown: stats,
      totalExpenses: totalExpenses[0] || { totalAmount: 0, count: 0 },
      period
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// --- FINANCIAL DASHBOARD ---

// @desc    Get financial dashboard data
// @route   GET /api/financial/dashboard
// @access  Private (Salon Admin)
const getFinancialDashboard = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { period = 'monthly' } = req.query;
    
    let dateRange = {};
    const now = new Date();
    
    switch (period) {
      case 'daily':
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateRange = {
          $gte: weekStart,
          $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'monthly':
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
        break;
    }

    // Revenue from bills
    const revenueData = await Bill.aggregate([
      {
        $match: {
          salonId: req.user.salonId,
          billDate: dateRange,
          paymentStatus: { $in: ['paid', 'partial'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          serviceRevenue: { $sum: '$serviceSubtotal' },
          productRevenue: { $sum: '$productSubtotal' },
          totalBills: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Expenses
    const expenseData = await Expense.aggregate([
      {
        $match: {
          salonId: req.user.salonId,
          expenseDate: dateRange,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalExpenseCount: { $sum: 1 }
        }
      }
    ]);

    // Payment method breakdown
    const paymentMethods = await Payment.aggregate([
      {
        $match: {
          salonId: req.user.salonId,
          paymentDate: dateRange,
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = revenueData[0] || { 
      totalRevenue: 0, 
      serviceRevenue: 0, 
      productRevenue: 0, 
      totalBills: 0, 
      averageOrderValue: 0 
    };
    const expenses = expenseData[0] || { totalExpenses: 0, totalExpenseCount: 0 };
    
    const netProfit = revenue.totalRevenue - expenses.totalExpenses;
    const profitMargin = revenue.totalRevenue > 0 ? 
      ((netProfit / revenue.totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      revenue,
      expenses,
      netProfit,
      profitMargin,
      paymentMethods,
      period
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBillPayment,
  getAllPayments,
  createPayment,
  getAllExpenses,
  createExpense,
  getExpenseStats,
  getFinancialDashboard
};