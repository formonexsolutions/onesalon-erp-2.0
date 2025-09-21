const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Salon = require('../models/Salon');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const PurchaseOrder = require('../models/PurchaseOrder');
const StockMovement = require('../models/StockMovement');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Demo Data Creation...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Demo credentials for easy testing
const DEMO_CREDENTIALS = {
  superAdmin: {
    email: 'admin@onesalon.com',
    password: 'admin123',
    name: 'Super Administrator'
  },
  salonAdmin: {
    phoneNumber: '9876543210',
    password: 'salon123',
    name: 'John Smith'
  },
  staff: {
    stylist: {
      phoneNumber: '8765432109',
      password: 'stylist123',
      name: 'Sarah Johnson'
    },
    receptionist: {
      phoneNumber: '7654321098',
      password: 'reception123',
      name: 'Emily Davis'
    },
    manager: {
      phoneNumber: '6543210987',
      password: 'manager123',
      name: 'Michael Brown'
    }
  }
};

const createDemoData = async () => {
  try {
    console.log('🧹 Cleaning existing demo data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Salon.deleteMany({});
    await Staff.deleteMany({});
    await Customer.deleteMany({});
    await Service.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await Appointment.deleteMany({});
    await Bill.deleteMany({});
    await Payment.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await StockMovement.deleteMany({});

    console.log('✅ Cleaned existing data');

    // 1. Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = await User.create({
      name: DEMO_CREDENTIALS.superAdmin.name,
      email: DEMO_CREDENTIALS.superAdmin.email,
      password: DEMO_CREDENTIALS.superAdmin.password,
      role: 'superadmin',
      isActive: true
    });
    console.log(`✅ Super Admin created: ${DEMO_CREDENTIALS.superAdmin.email} / ${DEMO_CREDENTIALS.superAdmin.password}`);

    // 2. Create Demo Salon
    console.log('🏢 Creating Demo Salon...');
    const salon = await Salon.create({
      salonName: 'Glamour Studio',
      adminName: DEMO_CREDENTIALS.salonAdmin.name,
      phoneNumber: DEMO_CREDENTIALS.salonAdmin.phoneNumber,
      email: 'admin@glamourstudio.com',
      gst: 'GST123456789',
      state: 'California',
      city: 'Los Angeles',
      area: 'Hollywood',
      address: '123 Sunset Boulevard, Hollywood',
      pincode: '90028',
      timingsFrom: '09:00',
      timingsTo: '20:00',
      numberOfChairs: 8,
      holidays: ['Sunday'],
      aboutBranch: 'Premium beauty salon offering luxury hair, beauty, and wellness services.',
      status: 'approved',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active'
    });
    console.log(`✅ Salon created: ${salon.salonName}`);

    // 3. Create Salon Admin Staff
    console.log('👨‍💼 Creating Salon Admin...');
    const salonAdmin = await Staff.create({
      employeeId: 'EMP001',
      name: DEMO_CREDENTIALS.salonAdmin.name,
      phoneNumber: DEMO_CREDENTIALS.salonAdmin.phoneNumber,
      email: 'john.smith@glamourstudio.com',
      username: 'johnadmin',
      password: DEMO_CREDENTIALS.salonAdmin.password,
      role: 'salonadmin',
      gender: 'male',
      dateOfBirth: new Date('1985-06-15'),
      address: '456 Admin Street, LA',
      salonId: salon._id,
      isActive: true,
      salary: {
        baseSalary: 80000,
        allowances: 10000,
        currency: 'USD'
      },
      permissions: {
        canManageStaff: true,
        canManageFinances: true,
        canManageInventory: true,
        canViewReports: true,
        canManageCustomers: true,
        canManageAppointments: true
      }
    });
    console.log(`✅ Salon Admin created: ${DEMO_CREDENTIALS.salonAdmin.phoneNumber} / ${DEMO_CREDENTIALS.salonAdmin.password}`);

    // 4. Create Staff Members
    console.log('👥 Creating Staff Members...');
    
    const stylist = await Staff.create({
      employeeId: 'EMP002',
      name: DEMO_CREDENTIALS.staff.stylist.name,
      phoneNumber: DEMO_CREDENTIALS.staff.stylist.phoneNumber,
      email: 'sarah.johnson@glamourstudio.com',
      username: 'sarahstylist',
      password: DEMO_CREDENTIALS.staff.stylist.password,
      role: 'stylist',
      gender: 'female',
      dateOfBirth: new Date('1990-03-22'),
      address: '789 Stylist Avenue, LA',
      salonId: salon._id,
      isActive: true,
      salary: {
        baseSalary: 45000,
        allowances: 5000,
        currency: 'USD'
      },
      skills: ['Hair Cutting', 'Hair Coloring', 'Hair Styling', 'Makeup'],
      experience: 5,
      certifications: ['Advanced Hair Cutting Certificate', 'Color Specialist']
    });

    const receptionist = await Staff.create({
      employeeId: 'EMP003',
      name: DEMO_CREDENTIALS.staff.receptionist.name,
      phoneNumber: DEMO_CREDENTIALS.staff.receptionist.phoneNumber,
      email: 'emily.davis@glamourstudio.com',
      username: 'emilyreception',
      password: DEMO_CREDENTIALS.staff.receptionist.password,
      role: 'receptionist',
      gender: 'female',
      dateOfBirth: new Date('1992-08-10'),
      address: '321 Reception Road, LA',
      salonId: salon._id,
      isActive: true,
      salary: {
        baseSalary: 35000,
        allowances: 3000,
        currency: 'USD'
      },
      permissions: {
        canManageAppointments: true,
        canManageCustomers: true,
        canViewReports: false
      }
    });

    const manager = await Staff.create({
      employeeId: 'EMP004',
      name: DEMO_CREDENTIALS.staff.manager.name,
      phoneNumber: DEMO_CREDENTIALS.staff.manager.phoneNumber,
      email: 'michael.brown@glamourstudio.com',
      username: 'michaelmanager',
      password: DEMO_CREDENTIALS.staff.manager.password,
      role: 'manager',
      gender: 'male',
      dateOfBirth: new Date('1980-12-05'),
      address: '654 Manager Way, LA',
      salonId: salon._id,
      isActive: true,
      salary: {
        baseSalary: 65000,
        allowances: 8000,
        currency: 'USD'
      },
      permissions: {
        canManageStaff: true,
        canManageFinances: false,
        canManageInventory: true,
        canViewReports: true,
        canManageCustomers: true,
        canManageAppointments: true
      }
    });

    console.log(`✅ Staff Members created:`);
    console.log(`   Stylist: ${DEMO_CREDENTIALS.staff.stylist.phoneNumber} / ${DEMO_CREDENTIALS.staff.stylist.password}`);
    console.log(`   Receptionist: ${DEMO_CREDENTIALS.staff.receptionist.phoneNumber} / ${DEMO_CREDENTIALS.staff.receptionist.password}`);
    console.log(`   Manager: ${DEMO_CREDENTIALS.staff.manager.phoneNumber} / ${DEMO_CREDENTIALS.staff.manager.password}`);

    // 5. Create Sample Customers
    console.log('👤 Creating Sample Customers...');
    const customers = await Customer.create([
      {
        name: 'Alice Williams',
        phoneNumber: '5551234567',
        email: 'alice.williams@email.com',
        gender: 'female',
        dateOfBirth: new Date('1988-04-15'),
        address: '123 Customer Lane, LA',
        salonId: salon._id,
        preferences: {
          preferredServices: ['Hair Cut', 'Hair Color'],
          preferredStaff: [stylist._id],
          allergies: ['None'],
          notes: 'Prefers natural hair colors'
        },
        loyaltyPoints: 150,
        totalVisits: 8,
        totalSpent: 850
      },
      {
        name: 'Jessica Brown',
        phoneNumber: '5552345678',
        email: 'jessica.brown@email.com',
        gender: 'female',
        dateOfBirth: new Date('1985-09-22'),
        address: '456 Client Street, LA',
        salonId: salon._id,
        preferences: {
          preferredServices: ['Facial', 'Manicure'],
          allergies: ['Sensitive skin'],
          notes: 'Regular monthly facial appointments'
        },
        loyaltyPoints: 320,
        totalVisits: 15,
        totalSpent: 1450
      },
      {
        name: 'David Johnson',
        phoneNumber: '5553456789',
        email: 'david.johnson@email.com',
        gender: 'male',
        dateOfBirth: new Date('1979-11-08'),
        address: '789 Patron Avenue, LA',
        salonId: salon._id,
        preferences: {
          preferredServices: ['Men\'s Haircut', 'Beard Trim'],
          preferredStaff: [stylist._id],
          notes: 'Business professional styling'
        },
        loyaltyPoints: 85,
        totalVisits: 5,
        totalSpent: 425
      }
    ]);
    console.log(`✅ Created ${customers.length} sample customers`);

    // 6. Create Services
    console.log('💇 Creating Services...');
    const services = await Service.create([
      {
        serviceName: 'Women\'s Haircut',
        description: 'Professional women\'s haircut with styling',
        duration: 60,
        price: 65,
        category: 'haircut',
        salonId: salon._id,
        isActive: true,
        staffRequired: [stylist._id],
        commission: { type: 'percentage', value: 20 }
      },
      {
        serviceName: 'Men\'s Haircut',
        description: 'Classic men\'s haircut and styling',
        duration: 45,
        price: 35,
        category: 'haircut',
        salonId: salon._id,
        isActive: true,
        staffRequired: [stylist._id],
        commission: { type: 'percentage', value: 20 }
      },
      {
        serviceName: 'Hair Coloring',
        description: 'Full hair coloring service',
        duration: 120,
        price: 150,
        category: 'hair_coloring',
        salonId: salon._id,
        isActive: true,
        staffRequired: [stylist._id],
        commission: { type: 'percentage', value: 25 }
      },
      {
        serviceName: 'Facial Treatment',
        description: 'Deep cleansing facial with moisturizing',
        duration: 90,
        price: 85,
        category: 'facial',
        salonId: salon._id,
        isActive: true,
        commission: { type: 'percentage', value: 30 }
      },
      {
        serviceName: 'Manicure',
        description: 'Complete nail care and polish',
        duration: 45,
        price: 35,
        category: 'manicure',
        salonId: salon._id,
        isActive: true,
        commission: { type: 'percentage', value: 25 }
      },
      {
        serviceName: 'Pedicure',
        description: 'Foot care and nail treatment',
        duration: 60,
        price: 45,
        category: 'pedicure',
        salonId: salon._id,
        isActive: true,
        commission: { type: 'percentage', value: 25 }
      }
    ]);
    console.log(`✅ Created ${services.length} services`);

    // 7. Create Suppliers
    console.log('🏭 Creating Suppliers...');
    const suppliers = await Supplier.create([
      {
        supplierCode: 'SUP001',
        supplierName: 'Beauty Products Inc.',
        contactPersonName: 'Robert Wilson',
        email: 'sales@beautyproducts.com',
        phoneNumber: '5554567890',
        address: '123 Supplier Street, Los Angeles, CA 90001, USA',
        detailedAddress: {
          street: '123 Supplier Street',
          city: 'Los Angeles',
          state: 'California',
          zipCode: '90001',
          country: 'USA'
        },
        businessType: 'manufacturer',
        gstNumber: 'GST987654321',
        panNumber: 'PAN123456789',
        salonId: salon._id,
        isActive: true,
        rating: 4,
        reliability: 5,
        qualityScore: 5,
        deliveryScore: 4,
        paymentTerms: 'net_30',
        deliveryTime: 7,
        minimumOrderValue: 500,
        deliveryCharges: 25
      },
      {
        supplierCode: 'SUP002',
        supplierName: 'Professional Hair Supplies',
        contactPersonName: 'Linda Martinez',
        email: 'orders@prohairsupplies.com',
        phoneNumber: '5555678901',
        address: '456 Hair Supply Ave, Los Angeles, CA 90002, USA',
        detailedAddress: {
          street: '456 Hair Supply Ave',
          city: 'Los Angeles',
          state: 'California',
          zipCode: '90002',
          country: 'USA'
        },
        businessType: 'distributor',
        gstNumber: 'GST876543210',
        panNumber: 'PAN987654321',
        salonId: salon._id,
        isActive: true,
        rating: 5,
        reliability: 5,
        qualityScore: 5,
        deliveryScore: 5,
        paymentTerms: 'net_15',
        deliveryTime: 3,
        minimumOrderValue: 200,
        deliveryCharges: 15
      }
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 8. Create Products
    console.log('📦 Creating Products...');
    const products = await Product.create([
      {
        sku: 'SHP001',
        barcode: '1234567890123',
        productName: 'Premium Shampoo',
        description: 'Professional grade moisturizing shampoo',
        category: 'hair_care',
        brand: 'Beauty Pro',
        unit: 'bottles',
        costPrice: 12.50,
        unitPrice: 18.75,
        sellingPrice: 25.00,
        margin: 33.33,
        currentStock: 50,
        reservedStock: 5,
        availableStock: 45,
        minStock: 10,
        maxStock: 100,
        reorderLevel: 15,
        reorderQuantity: 25,
        supplier: suppliers[0]._id,
        salonId: salon._id,
        isActive: true,
        storageLocation: 'A1-001',
        expiryDate: new Date('2026-12-31'),
        batchNumber: 'BATCH001'
      },
      {
        sku: 'CON001',
        barcode: '2345678901234',
        productName: 'Hair Conditioner',
        description: 'Deep conditioning treatment',
        category: 'hair_care',
        brand: 'Beauty Pro',
        unit: 'bottles',
        costPrice: 15.00,
        unitPrice: 22.50,
        sellingPrice: 30.00,
        margin: 33.33,
        currentStock: 35,
        reservedStock: 3,
        availableStock: 32,
        minStock: 8,
        maxStock: 80,
        reorderLevel: 12,
        reorderQuantity: 20,
        supplier: suppliers[0]._id,
        salonId: salon._id,
        isActive: true,
        storageLocation: 'A1-002',
        expiryDate: new Date('2026-11-30'),
        batchNumber: 'BATCH002'
      },
      {
        sku: 'COL001',
        barcode: '3456789012345',
        productName: 'Hair Color - Brown',
        description: 'Professional hair coloring cream',
        category: 'hair_care',
        brand: 'Color Master',
        unit: 'tubes',
        costPrice: 8.00,
        unitPrice: 12.00,
        sellingPrice: 16.00,
        margin: 33.33,
        currentStock: 25,
        reservedStock: 2,
        availableStock: 23,
        minStock: 5,
        maxStock: 50,
        reorderLevel: 8,
        reorderQuantity: 15,
        supplier: suppliers[1]._id,
        salonId: salon._id,
        isActive: true,
        storageLocation: 'B2-001',
        expiryDate: new Date('2025-08-31'),
        batchNumber: 'BATCH003'
      },
      {
        sku: 'TOW001',
        barcode: '4567890123456',
        productName: 'Salon Towels',
        description: 'Premium cotton salon towels',
        category: 'accessories',
        brand: 'Salon Essentials',
        unit: 'pieces',
        costPrice: 5.00,
        unitPrice: 7.50,
        sellingPrice: 10.00,
        margin: 33.33,
        currentStock: 100,
        reservedStock: 10,
        availableStock: 90,
        minStock: 20,
        maxStock: 200,
        reorderLevel: 30,
        reorderQuantity: 50,
        supplier: suppliers[0]._id,
        salonId: salon._id,
        isActive: true,
        storageLocation: 'C3-001'
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    console.log('\n🎉 Demo data creation completed successfully!');
    console.log('\n📋 DEMO LOGIN CREDENTIALS:');
    console.log('=' .repeat(50));
    console.log('🔥 SUPER ADMIN:');
    console.log(`   Email: ${DEMO_CREDENTIALS.superAdmin.email}`);
    console.log(`   Password: ${DEMO_CREDENTIALS.superAdmin.password}`);
    console.log('\n🏢 SALON ADMIN (Glamour Studio):');
    console.log(`   Phone: ${DEMO_CREDENTIALS.salonAdmin.phoneNumber}`);
    console.log(`   Password: ${DEMO_CREDENTIALS.salonAdmin.password}`);
    console.log('\n👥 STAFF MEMBERS:');
    console.log(`   💇 Stylist (${DEMO_CREDENTIALS.staff.stylist.name}):`);
    console.log(`      Phone: ${DEMO_CREDENTIALS.staff.stylist.phoneNumber}`);
    console.log(`      Password: ${DEMO_CREDENTIALS.staff.stylist.password}`);
    console.log(`   📞 Receptionist (${DEMO_CREDENTIALS.staff.receptionist.name}):`);
    console.log(`      Phone: ${DEMO_CREDENTIALS.staff.receptionist.phoneNumber}`);
    console.log(`      Password: ${DEMO_CREDENTIALS.staff.receptionist.password}`);
    console.log(`   👨‍💼 Manager (${DEMO_CREDENTIALS.staff.manager.name}):`);
    console.log(`      Phone: ${DEMO_CREDENTIALS.staff.manager.phoneNumber}`);
    console.log(`      Password: ${DEMO_CREDENTIALS.staff.manager.password}`);
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  }
};

const runDemo = async () => {
  await connectDB();
  await createDemoData();
  console.log('\n✅ Demo database setup complete!');
  process.exit(0);
};

// Run the demo data creation
if (require.main === module) {
  runDemo().catch((error) => {
    console.error('Demo data creation failed:', error);
    process.exit(1);
  });
}

module.exports = { createDemoData, DEMO_CREDENTIALS };