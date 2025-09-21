const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protectSalonAdmin } = require('../middlewares/authMiddleware');

// --- BUSINESS ANALYTICS ROUTES ---

/**
 * @route   GET /api/admin/analytics
 * @desc    Get comprehensive business analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', protectSalonAdmin, adminController.getBusinessAnalytics);

// --- FINANCIAL REPORTS ROUTES ---

/**
 * @route   GET /api/admin/financial-reports
 * @desc    Get financial reports and statements
 * @access  Private (Admin only)
 */
router.get('/financial-reports', protectSalonAdmin, adminController.getFinancialReports);

// --- SYSTEM SETTINGS ROUTES ---

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Private (Admin only)
 */
router.get('/settings', protectSalonAdmin, adminController.getSystemSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update system settings
 * @access  Private (Admin only)
 */
router.put('/settings', protectSalonAdmin, adminController.updateSystemSettings);

// --- DASHBOARD METRICS ---

/**
 * @route   GET /api/admin/dashboard-metrics
 * @desc    Get admin dashboard metrics summary
 * @access  Private (Admin only)
 */
router.get('/dashboard-metrics', protectSalonAdmin, adminController.getDashboardMetrics);

module.exports = router;