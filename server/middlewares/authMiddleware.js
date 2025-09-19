const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

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

module.exports = { protect };