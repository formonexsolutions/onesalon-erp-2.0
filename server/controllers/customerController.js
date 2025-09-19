const Customer = require('../models/Customer');
const { validationResult } = require('express-validator');

// Create a new customer
exports.createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phoneNumber, email, address, notes } = req.body;
  try {
    const newCustomer = new Customer({
      name, phoneNumber, email, address, notes,
      salonId: req.staff.salonId, // Link to the logged-in staff's salon
      createdBy: req.staff.id,
    });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'A customer with this phone number already exists in your salon.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all customers for a salon
exports.getCustomersForSalon = async (req, res) => {
  try {
    const customers = await Customer.find({ salonId: req.staff.salonId }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update a customer
/**
 * @desc    Update a customer
 * @route   PUT /api/customers/:customerId
 * @access  Private
 */
exports.updateCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phoneNumber, email, address, notes } = req.body;
  const { customerId } = req.params;

  try {
    let customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Security check: Ensure the customer belongs to the logged-in user's salon
    if (customer.salonId.toString() !== req.staff.salonId._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this customer' });
    }

    // Update fields
    customer.name = name;
    customer.phoneNumber = phoneNumber;
    customer.email = email;
    customer.address = address;
    customer.notes = notes;
    customer.modifiedBy = req.staff.id;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all customers for a salon with pagination and search
exports.getCustomersForSalon = async (req, res) => {
  try {
    // Pagination parameters from query string, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Base query to always filter by the logged-in user's salon
    let query = { salonId: req.staff.salonId };

    // If a search term is provided, add search conditions
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } }, // Case-insensitive search on name
          { phoneNumber: { $regex: search, $options: 'i' } }, // Case-insensitive search on phone
        ],
      };
    }

    // Get the total count of customers matching the query for pagination
    const totalCustomers = await Customer.countDocuments(query);

    // Fetch the paginated list of customers
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      customers,
      currentPage: page,
      totalPages: Math.ceil(totalCustomers / limit),
      totalCustomers,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
    // ... (logic to find and delete a customer)
};