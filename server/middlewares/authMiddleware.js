const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const User = require('../models/User');

// Middleware to protect staff routes
const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    try {
      // 1. Verify the token
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

      // 2. Find the staff member and populate their salon information
      req.staff = await Staff.findById(decoded.id)
        .select('-password')
        .populate('salonId'); // Populates the linked Salon document

      // If no staff is found for that token, deny access
      if (!req.staff) {
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      // 3. Proceed to the next step (the controller)
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

// Middleware to protect super admin routes
const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.superAdminToken) {
    try {
      // 1. Verify the token
      const decoded = jwt.verify(req.cookies.superAdminToken, process.env.JWT_SECRET);

      // 2. Find the super admin user
      req.user = await User.findById(decoded.id).select('-password');

      // If no user is found or not a super admin, deny access
      if (!req.user || req.user.role !== 'superadmin') {
        return res.status(401).json({ msg: 'Not authorized, super admin access required' });
      }

      // 3. Proceed to the next step
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

// Role-based access control for staff
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({ msg: 'Access denied - insufficient permissions' });
    }

    next();
  };
};

// Check if staff is active
const checkActiveStaff = (req, res, next) => {
  if (!req.staff || !req.staff.isActive) {
    return res.status(403).json({ msg: 'Access denied - account is deactivated' });
  }
  next();
};

// Check if salon is approved
const checkApprovedSalon = (req, res, next) => {
  if (!req.staff || !req.staff.salonId || req.staff.salonId.status !== 'approved') {
    return res.status(403).json({ msg: 'Access denied - salon not approved' });
  }
  next();
};

// Middleware to protect salon admin routes
const protectSalonAdmin = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    try {
      // 1. Verify the token
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

      // 2. Find the staff member and populate their salon information
      req.user = await Staff.findById(decoded.id)
        .select('-password')
        .populate('salonId'); // Populates the linked Salon document

      // If no staff is found for that token, deny access
      if (!req.user) {
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      // Check if the staff member has admin role
      if (req.user.role !== 'salonadmin' && req.user.role !== 'branchadmin' && req.user.role !== 'manager') {
        return res.status(403).json({ msg: 'Access denied - salon admin access required' });
      }

      // Add salonId to request for easy access
      req.user.salonId = req.user.salonId._id;

      // 3. Proceed to the next step (the controller)
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

module.exports = { 
  protect, 
  protectSuperAdmin,
  protectSalonAdmin,
  authorize, 
  checkActiveStaff, 
  checkApprovedSalon 
};