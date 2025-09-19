const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const salonRoutes = require('./routes/salonRoutes');
const branchRoutes = require('./routes/branchRoutes');
const customerRoutes = require('./routes/customerRoutes');


// --- Initial Setup ---

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// --- Middleware ---

// Enable CORS (Cross-Origin Resource Sharing) for your React frontend
app.use(cors({
  origin: 'http://localhost:5173', // Your client's URL
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

// --- Server Listener ---

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));