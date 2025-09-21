# 🎯 OneSalon ERP Demo Guide

## 📋 Demo Login Credentials

### 🔥 Super Admin
- **Login URL**: `/api/auth/super-admin/login`
- **Email**: `admin@onesalon.com`
- **Password**: `admin123`
- **Role**: Full system administration
- **Access**: All system features, salon management, user creation

### 🏢 Salon Admin (Glamour Studio)
- **Login URL**: `/api/salons/login/password`
- **Phone**: `9876543210`
- **Password**: `salon123`
- **Name**: John Smith
- **Role**: Salon Administrator
- **Access**: Full salon management, staff management, financial reports

### 👥 Staff Members

#### 💇 Stylist
- **Login URL**: `/api/staff/login`
- **Phone**: `8765432109`
- **Password**: `stylist123`
- **Name**: Sarah Johnson
- **Role**: Senior Stylist
- **Access**: Service management, customer appointments, inventory viewing

#### 📞 Receptionist
- **Phone**: `7654321098`
- **Password**: `reception123`
- **Name**: Emily Davis
- **Role**: Front desk operations
- **Access**: Appointment booking, customer management, basic billing

#### 👨‍💼 Manager
- **Phone**: `6543210987`
- **Password**: `manager123`
- **Name**: Michael Brown
- **Role**: Operations Manager
- **Access**: Staff management, inventory, reports (limited financial access)

---

## 🧪 Testing Scenarios by Role

### 🔥 Super Admin Testing

#### 1. Login Test
```bash
curl -X POST http://localhost:5001/api/auth/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@onesalon.com",
    "password": "admin123"
  }'
```

#### 2. View All Salons
```bash
curl -X GET http://localhost:5001/api/super-admin/salons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Create New Super Admin
```bash
curl -X POST http://localhost:5001/api/auth/super-admin/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assistant Admin",
    "email": "assistant@onesalon.com",
    "password": "admin456"
  }'
```

### 🏢 Salon Admin Testing

#### 1. Login Test
```bash
curl -X POST http://localhost:5001/api/salons/login/password \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "password": "salon123"
  }'
```

#### 2. View Salon Profile
```bash
curl -X GET http://localhost:5001/api/salons/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Manage Staff
```bash
# Get all staff
curl -X GET http://localhost:5001/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new staff
curl -X POST http://localhost:5001/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Stylist",
    "phoneNumber": "5551234567",
    "email": "newstylist@glamourstudio.com",
    "password": "newstaff123",
    "role": "stylist",
    "gender": "female"
  }'
```

#### 4. Financial Management
```bash
# View financial dashboard
curl -X GET http://localhost:5001/api/financial/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# View all bills
curl -X GET http://localhost:5001/api/financial/bills \
  -H "Authorization: Bearer YOUR_TOKEN"

# View payments
curl -X GET http://localhost:5001/api/financial/payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Inventory Management
```bash
# View all products
curl -X GET http://localhost:5001/api/inventory/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# View inventory stats
curl -X GET http://localhost:5001/api/inventory/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# View low stock products
curl -X GET http://localhost:5001/api/inventory/low-stock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 👥 Staff Testing

#### 1. Staff Login Test
```bash
# Stylist login
curl -X POST http://localhost:5001/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "8765432109",
    "password": "stylist123"
  }'

# Receptionist login
curl -X POST http://localhost:5001/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "7654321098",
    "password": "reception123"
  }'

# Manager login
curl -X POST http://localhost:5001/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "6543210987",
    "password": "manager123"
  }'
```

#### 2. Appointment Management (Receptionist/Stylist)
```bash
# View appointments
curl -X GET http://localhost:5001/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new appointment
curl -X POST http://localhost:5001/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "services": ["SERVICE_ID"],
    "appointmentDate": "2025-09-21T10:00:00Z",
    "notes": "Regular customer appointment"
  }'
```

#### 3. Customer Management
```bash
# View customers
curl -X GET http://localhost:5001/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new customer
curl -X POST http://localhost:5001/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "5559876543",
    "email": "jane.doe@email.com",
    "gender": "female"
  }'
```

---

## 🚀 Complete System Demo Flow

### Step 1: Environment Setup
1. Ensure MongoDB is running
2. Ensure Redis is running
3. Start the OneSalon ERP server

### Step 2: Database Initialization
```bash
cd /Users/sanketmane/onesalon-erp-2.0/server
node scripts/createDemoData.js
```

### Step 3: Server Startup
```bash
cd /Users/sanketmane/onesalon-erp-2.0/server
node server.js
```

### Step 4: Role-based Testing Sequence

1. **Super Admin Flow**
   - Login → View system overview → Manage salons → Create admins

2. **Salon Admin Flow**
   - Login → View dashboard → Manage staff → Check finances → Review inventory

3. **Manager Flow**
   - Login → View staff performance → Manage inventory → Review reports

4. **Stylist Flow**
   - Login → View appointments → Check customer history → Update service records

5. **Receptionist Flow**
   - Login → Book appointments → Register customers → Process payments

---

## 📊 Sample Data Included

### 🏢 Salon Information
- **Name**: Glamour Studio
- **Location**: Hollywood, Los Angeles
- **Services**: 6 premium services
- **Staff**: 4 team members
- **Customers**: 3 regular clients

### 💼 Business Operations
- **Active Appointments**: 2 scheduled
- **Inventory**: 4 product categories
- **Suppliers**: 2 verified vendors
- **Financial Records**: Sample bills and payments

### 🔧 System Features Demonstrated
- ✅ Multi-role authentication
- ✅ Role-based access control
- ✅ Complete CRUD operations
- ✅ Financial management
- ✅ Inventory tracking
- ✅ Appointment scheduling
- ✅ Customer relationship management
- ✅ Staff management
- ✅ Reporting and analytics

---

## 🔍 Verification Checklist

- [ ] Super Admin can login and access all features
- [ ] Salon Admin can manage salon operations
- [ ] Staff members have appropriate access levels
- [ ] All API endpoints respond correctly
- [ ] Database relationships work properly
- [ ] Authentication and authorization function
- [ ] CRUD operations work for all entities
- [ ] Financial calculations are accurate
- [ ] Inventory tracking updates correctly
- [ ] Appointment system handles conflicts

---

## 🛠️ Troubleshooting

### Common Issues:
1. **"Not authorized" errors**: Ensure JWT token is included in Authorization header
2. **Database connection errors**: Verify MongoDB is running
3. **Redis connection errors**: Ensure Redis server is active
4. **404 errors**: Check if server is running on correct port (5001)

### Quick Fixes:
```bash
# Restart MongoDB
brew services restart mongodb-community

# Restart Redis
brew services restart redis

# Clear and recreate demo data
node scripts/createDemoData.js
```

---

## 📞 Support Information
- **Server Port**: 5001
- **Database**: MongoDB (default port 27017)
- **Cache**: Redis (default port 6379)
- **Environment**: Development
- **API Base**: http://localhost:5001/api

---

*Last Updated: September 20, 2025*