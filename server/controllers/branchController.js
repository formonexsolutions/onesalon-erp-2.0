const Branch = require('../models/Branch');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

const setLoginCookieAndRespond = (res, staff) => {
  const token = generateToken(staff.id);

  // 1. Set the secure HttpOnly cookie for the session
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  // 2. ✅ SET THE NEW XSRF-TOKEN COOKIE (this one is NOT HttpOnly)
  res.cookie('XSRF-TOKEN', 'your_csrf_secret_placeholder', { // In production, this should be a random, unguessable string
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
  
  res.status(200).json({
    _id: staff.id,
    name: staff.name,
    role: staff.role,
    salonId: staff.salonId,
  });
};

/**
 * @desc    Create a new branch and a branch admin
 * @route   POST /api/branches
 * @access  Private (salonadmin only)
 */
exports.createBranch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // The form now only sends branch details
  const { branchName, address, city, state, phoneNumber } = req.body;

  try {
    const newBranch = new Branch({
      branchName,
      address,
      city,
      state,
      phoneNumber,
      salonId: req.staff.salonId, // Get salonId from the logged-in salonadmin
      createdBy: req.staff.id,
    });

    await newBranch.save();
    res.status(201).json(newBranch);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


/**
 * @desc    Get all branches for the logged-in salon
 * @route   GET /api/branches
 * @access  Private
 */
exports.getBranchesForSalon = async (req, res) => {
  try {
    const branches = await Branch.find({ salonId: req.staff.salonId });
    res.json(branches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get a single branch by its ID
 * @route   GET /api/branches/:branchId
 * @access  Private
 */
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId);

    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    // Security check: Ensure the branch belongs to the logged-in user's salon
    if (branch.salonId.toString() !== req.staff.salonId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to access this branch' });
    }

    res.json(branch);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update an existing branch
 * @route   PUT /api/branches/:branchId
 * @access  Private (salonadmin only)
 */
exports.updateBranch = async (req, res) => {
  // We don't need validation here since the logic is flexible
  const { branchName, address, city, state, phoneNumber, status } = req.body;
  const { branchId } = req.params;

  try {
    let branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    // Security check (remains the same)
    if (branch.salonId.toString() !== req.staff.salonId._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this branch' });
    }

    // ✅ NEW LOGIC: Only update the fields that were provided in the request
    if (branchName) branch.branchName = branchName;
    if (address) branch.address = address;
    if (city) branch.city = city;
    if (state) branch.state = state;
    if (phoneNumber) branch.phoneNumber = phoneNumber;
    if (status) branch.status = status;
    
    branch.modifiedBy = req.staff.id;

    const updatedBranch = await branch.save();
    res.json(updatedBranch);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};