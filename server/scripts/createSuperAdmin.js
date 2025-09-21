const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create the first super admin
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'admin@onesalon.com',
      password: 'Admin@123456', // This will be hashed by the pre-save middleware
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('Super Admin created successfully:');
    console.log('Email: admin@onesalon.com');
    console.log('Password: Admin@123456');
    console.log('Please change the password after first login!');

  } catch (err) {
    console.error('Error creating Super Admin:', err.message);
  } finally {
    mongoose.connection.close();
  }
};

createSuperAdmin();