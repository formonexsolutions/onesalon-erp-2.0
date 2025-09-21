const Salon = require('../models/Salon');
const Branch = require('../models/Branch');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

/**
 * @desc    Get comprehensive business analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
exports.getBusinessAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { timeframe = '30d' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, previousStartDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now - 14 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now - 180 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now - 730 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now - 60 * 24 * 60 * 60 * 1000);
    }

    // Get current period appointments
    const currentAppointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: startDate, $lte: now },
      status: { $in: ['completed', 'confirmed', 'cancelled'] }
    }).populate('services.serviceId', 'price');

    // Get previous period appointments for comparison
    const previousAppointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: previousStartDate, $lt: startDate },
      status: { $in: ['completed', 'confirmed', 'cancelled'] }
    }).populate('services.serviceId', 'price');

    // Calculate revenue
    const currentRevenue = currentAppointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

    const previousRevenue = previousAppointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Get appointment statistics
    const completedAppointments = currentAppointments.filter(apt => apt.status === 'completed');
    const cancelledAppointments = currentAppointments.filter(apt => apt.status === 'cancelled');
    const pendingAppointments = currentAppointments.filter(apt => apt.status === 'confirmed');

    const completionRate = currentAppointments.length > 0 
      ? (completedAppointments.length / currentAppointments.length) * 100 
      : 0;

    // Get customer statistics
    const totalCustomers = await Customer.countDocuments({ salonId });
    const newCustomers = await Customer.countDocuments({
      salonId,
      createdAt: { $gte: startDate, $lte: now }
    });
    const returningCustomers = totalCustomers - newCustomers;
    const customerRetention = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Get staff performance
    const staffPerformance = await Staff.aggregate([
      { $match: { salonId: salonId, isActive: true } },
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'staffId',
          as: 'appointments'
        }
      },
      {
        $project: {
          staffId: '$_id',
          name: 1,
          appointments: {
            $filter: {
              input: '$appointments',
              cond: {
                $and: [
                  { $gte: ['$$this.appointmentDate', startDate] },
                  { $lte: ['$$this.appointmentDate', now] },
                  { $eq: ['$$this.status', 'completed'] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          revenue: { $sum: '$appointments.totalAmount' },
          appointmentCount: { $size: '$appointments' },
          rating: 4.5 // Mock rating - would come from reviews
        }
      }
    ]);

    // Get branch performance
    const branches = await Branch.find({ salonId, status: 'active' });
    const branchPerformance = await Promise.all(
      branches.map(async (branch) => {
        const branchAppointments = await Appointment.find({
          branchId: branch._id,
          appointmentDate: { $gte: startDate, $lte: now },
          status: 'completed'
        });

        const branchRevenue = branchAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
        const branchStaffCount = await Staff.countDocuments({ branchId: branch._id, isActive: true });

        return {
          _id: branch._id,
          name: branch.branchName,
          revenue: branchRevenue,
          appointments: branchAppointments.length,
          staff: branchStaffCount,
          performance: branchAppointments.length > 0 ? 85 + Math.random() * 15 : 0 // Mock performance score
        };
      })
    );

    // Generate daily revenue data for the period
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayAppointments = await Appointment.find({
        salonId,
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
        status: 'completed'
      });

      const dayRevenue = dayAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

      dailyRevenue.push({
        date: dayStart.toISOString(),
        amount: dayRevenue
      });
    }

    // Generate monthly revenue data
    const monthlyRevenue = [];
    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthAppointments = await Appointment.find({
        salonId,
        appointmentDate: { $gte: monthStart, $lte: monthEnd },
        status: 'completed'
      });

      const monthRevenue = monthAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthRevenue
      });
    }

    const analyticsData = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: revenueGrowth,
        daily: dailyRevenue,
        monthly: monthlyRevenue
      },
      appointments: {
        total: currentAppointments.length,
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        pending: pendingAppointments.length,
        completionRate: completionRate
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomers,
        retention: customerRetention
      },
      staff: {
        performance: staffPerformance
      },
      branches: branchPerformance
    };

    res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Error fetching business analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Get financial reports
 * @route   GET /api/admin/financial-reports
 * @access  Private (Admin only)
 */
exports.getFinancialReports = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { period = 'current' } = req.query;

    // Calculate date ranges based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'previous':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default: // current
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    // Get completed appointments for revenue calculation
    const appointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).populate('services.serviceId', 'price category');

    // Calculate revenue breakdown
    const serviceRevenue = appointments.reduce((sum, apt) => {
      return sum + (apt.services || []).reduce((serviceSum, service) => {
        return serviceSum + (service.price || 0);
      }, 0);
    }, 0);

    // Mock product and membership revenue (would come from actual sales data)
    const productRevenue = serviceRevenue * 0.15; // Assume 15% of revenue from products
    const membershipRevenue = serviceRevenue * 0.08; // Assume 8% from memberships

    const totalRevenue = serviceRevenue + productRevenue + membershipRevenue;

    // Mock expense data (would come from actual expense tracking)
    const expenses = {
      staffSalaries: totalRevenue * 0.4, // 40% of revenue
      rent: totalRevenue * 0.1, // 10% of revenue
      utilities: totalRevenue * 0.03, // 3% of revenue
      supplies: totalRevenue * 0.07, // 7% of revenue
      marketing: totalRevenue * 0.05, // 5% of revenue
      other: totalRevenue * 0.02 // 2% of revenue
    };

    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Generate monthly data for the year
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthAppointments = await Appointment.find({
        salonId,
        appointmentDate: { $gte: monthStart, $lte: monthEnd },
        status: 'completed'
      });

      const monthRevenue = monthAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
      const monthExpenses = monthRevenue * 0.67; // 67% expense ratio
      const monthProfit = monthRevenue - monthExpenses;

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthProfit
      });
    }

    // Get branch performance
    const branches = await Branch.find({ salonId, status: 'active' });
    const branchPerformance = await Promise.all(
      branches.map(async (branch) => {
        const branchAppointments = await Appointment.find({
          branchId: branch._id,
          appointmentDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        });

        const branchRevenue = branchAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
        const branchExpenses = branchRevenue * 0.67;
        const branchProfit = branchRevenue - branchExpenses;
        const branchMargin = branchRevenue > 0 ? (branchProfit / branchRevenue) * 100 : 0;

        return {
          branchId: branch._id,
          branchName: branch.branchName,
          revenue: branchRevenue,
          expenses: branchExpenses,
          profit: branchProfit,
          profitMargin: branchMargin
        };
      })
    );

    const financialData = {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        revenueGrowth: 15.3 // Mock growth rate
      },
      revenueBreakdown: {
        serviceRevenue,
        productRevenue,
        membershipRevenue
      },
      expenses,
      monthlyData,
      branchPerformance,
      taxInformation: {
        taxableIncome: netProfit,
        taxOwed: netProfit * 0.3, // 30% tax rate
        taxRate: 30,
        quarterlyTax: (netProfit * 0.3) / 4
      }
    };

    res.status(200).json(financialData);
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial reports',
      error: error.message
    });
  }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin only)
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    // Get salon settings
    const salon = await Salon.findById(salonId);
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Return current settings (with defaults if not set)
    const settings = {
      businessHours: salon.businessHours || {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '10:00', close: '19:00', isOpen: true },
        sunday: { open: '11:00', close: '17:00', isOpen: false }
      },
      notifications: salon.notificationSettings || {
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        lowStockAlerts: true,
        staffUpdates: true
      },
      appointment: salon.appointmentSettings || {
        bookingWindowDays: 30,
        cancellationPolicyHours: 24,
        noShowPolicyEnabled: true,
        reminderTimeHours: 24,
        bufferTimeBetweenAppointments: 15
      },
      payments: salon.paymentSettings || {
        acceptCash: true,
        acceptCard: true,
        acceptUPI: true,
        advancePaymentPercentage: 25,
        refundPolicyDays: 7
      },
      staff: salon.staffSettings || {
        commissionRates: {
          stylist: 40,
          colorist: 45,
          therapist: 35
        },
        overtimeRateMultiplier: 1.5,
        maximumWorkingHoursPerDay: 10
      },
      security: salon.securitySettings || {
        sessionTimeoutMinutes: 120,
        passwordMinLength: 8,
        requireTwoFactor: false,
        dataRetentionDays: 1095
      }
    };

    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message
    });
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin only)
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const settings = req.body;

    // Update salon with new settings
    const updatedSalon = await Salon.findByIdAndUpdate(
      salonId,
      {
        businessHours: settings.businessHours,
        notificationSettings: settings.notifications,
        appointmentSettings: settings.appointment,
        paymentSettings: settings.payments,
        staffSettings: settings.staff,
        securitySettings: settings.security,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings: {
        businessHours: updatedSalon.businessHours,
        notifications: updatedSalon.notificationSettings,
        appointment: updatedSalon.appointmentSettings,
        payments: updatedSalon.paymentSettings,
        staff: updatedSalon.staffSettings,
        security: updatedSalon.securitySettings
      }
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message
    });
  }
};

/**
 * @desc    Get dashboard metrics summary
 * @route   GET /api/admin/dashboard-metrics
 * @access  Private (Admin only)
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    // Get basic counts
    const totalBranches = await Branch.countDocuments({ salonId, status: 'active' });
    const totalStaff = await Staff.countDocuments({ salonId, isActive: true });
    const totalCustomers = await Customer.countDocuments({ salonId });

    // Get today's appointments
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayAppointments = await Appointment.countDocuments({
      salonId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    // Get this month's revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyAppointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: monthStart, $lte: new Date() },
      status: 'completed'
    });

    const monthlyRevenue = monthlyAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

    const metrics = {
      totalBranches,
      totalStaff,
      totalCustomers,
      todayAppointments,
      monthlyRevenue
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
};