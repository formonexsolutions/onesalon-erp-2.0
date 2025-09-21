const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const salonRoutes = require('./routes/salonRoutes');
const branchRoutes = require('./routes/branchRoutes');
const customerRoutes = require('./routes/customerRoutes');
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const staffRoutes = require('./routes/staffRoutes');
const financialRoutes = require('./routes/financialRoutes');
const staffAvailabilityRoutes = require('./routes/staffAvailabilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');


// --- Initial Setup ---

// Load environment variables from .env file
dotenv.config({ silent: true });

// Connect to MongoDB database
connectDB();

const app = express();

// --- Middleware ---

// Enable CORS (Cross-Origin Resource Sharing) for your React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'], // Your client's URL
  credentials: true, // This allows cookies to be sent and received
}));

// Body parser middleware to handle JSON data
app.use(express.json());

// Cookie parser middleware to handle secure cookies
app.use(cookieParser());

// Rate limiting middleware to prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply the rate limiter to all routes starting with /api
app.use('/api', limiter);

// --- API Routes ---

// Mount the salon-related routes
app.use('/api/salons', salonRoutes);

// Mount the branch-related routes
app.use('/api/branches', branchRoutes);

app.use('/api/customers', customerRoutes);

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount super admin routes
app.use('/api/super-admin', superAdminRoutes);

// Mount employee routes
app.use('/api/employees', employeeRoutes);

// Mount service routes
app.use('/api/services', serviceRoutes);

// Mount appointment routes
app.use('/api/appointments', appointmentRoutes);

// Mount inventory routes (main inventory management)
app.use('/api/inventory', inventoryRoutes);

// Mount purchase order routes (advanced procurement)
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Mount stock movement routes (inventory transactions)
app.use('/api/stock-movements', stockMovementRoutes);

// Mount supplier routes (vendor management)
app.use('/api/suppliers', supplierRoutes);

// Mount staff routes
app.use('/api/staff', staffRoutes);

// Mount financial routes
app.use('/api/financial', financialRoutes);

// Mount staff availability routes
app.use('/api/staff-availability', staffAvailabilityRoutes);

// Mount admin routes
app.use('/api/admin', adminRoutes);

// Mount schedule routes
app.use('/api/schedule', scheduleRoutes);

// --- Server Listener ---

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 OneSalon ERP Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:5173`);
  console.log(`🔧 API Base: http://localhost:${PORT}/api`);
});