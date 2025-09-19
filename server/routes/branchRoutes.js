const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { createBranch, getBranchesForSalon, getBranchById,updateBranch } = require('../controllers/branchController');

// All routes in this file are protected and require a user to be logged in
router.use(protect);

// @route   GET /api/branches
router.get('/', getBranchesForSalon);

// @route   GET /api/branches/:branchId
router.get('/:branchId', getBranchById);

// @route   POST /api/branches
router.post(
  '/',
  [
    check('branchName', 'Branch name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
    check('phoneNumber', 'A valid branch phone number is required').isLength({ min: 10 }),
  ],
  createBranch
);

// --- ADD THIS NEW ROUTE ---
/**
 * @route   PUT /api/branches/:branchId
 * @desc    Update a branch
 * @access  Private
 */
router.put(
  '/:branchId',
  [ // Validation for the update fields
    check('branchName', 'Branch name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('status', 'Status must be active or inactive').isIn(['active', 'inactive']),
  ],
  updateBranch
);

module.exports = router;