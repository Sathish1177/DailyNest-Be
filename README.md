# DailyNest Backend 🚀

DailyNest Backend is a scalable and secure ecommerce backend API built using Node.js, Express.js, and MongoDB. It powers authentication, product management, category systems, order processing, payment integration, customer management, and role-based dashboards for the DailyNest ecommerce platform.

This backend is designed with clean architecture, reusable APIs, secure authentication, and production-ready structure.

---

##  Features

###  Authentication & Authorization
- JWT Authentication
- Manual Login & Signup
- Mobile Number + Password Login
- Google OAuth Login
- Forgot Password
- Reset Password
- Protected APIs
- Role-Based Access Control

###  User Roles
- Customer
- Admin
- Super Admin

###  Ecommerce Features
- Main Category Management
- Sub Category Management
- Product Management
- Featured Products
- Trending Products
- Coming Soon Products
- Product Filters
- Wishlist Management
- Shopping Cart
- Order Management
- Coupon System

###  Payment Integration
- Razorpay Integration
- Stripe Integration
- UPI Support
- Cash On Delivery (COD)
- Payment Verification
- Transaction Management

###  Order Management
- Order Placement
- Order Tracking
- Order Status Update
- Return Request
- Refund Request
- Invoice Support

###  Admin Features
- Product CRUD APIs
- Category CRUD APIs
- Subcategory CRUD APIs
- Customer Management
- Order Management
- Analytics APIs
- Banner Management
- Homepage CMS APIs

###  Super Admin Features
- Admin Management
- Role Permission Management
- Payment Settings
- Website Settings
- Logs & Analytics

---

## 🏗 Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication
- JWT
- bcryptjs
- Google OAuth

### Payment
- Razorpay
- Stripe

### Utilities
- Nodemon
- dotenv
- cors
- express-validator

---



##  Environment Variables

Create a `.env` file in the root directory.

```env
PORT=8000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret

STRIPE_SECRET_KEY=your_stripe_secret
```

---

##  Installation

### Clone Repository

```bash
git clone https://github.com/your-username/DailyNest-Backend.git
```

### Move to Project Folder

```bash
cd DailyNest-Backend
```

### Install Dependencies

```bash
npm install
```

---

## ▶ Run Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Server runs on:

```txt
http://localhost:8000
```

---

##  API Modules

### Authentication APIs
- Register
- Login
- Google Login
- Forgot Password
- Reset Password

### User APIs
- Profile Management
- Address Management
- Wishlist
- Cart

### Category APIs
- Create Category
- Update Category
- Delete Category
- Get Categories

### Subcategory APIs
- Create Subcategory
- Update Subcategory
- Delete Subcategory
- Get Subcategories

### Product APIs
- Create Product
- Update Product
- Delete Product
- Get Products
- Search Products
- Filter Products

### Order APIs
- Create Order
- Update Status
- Order History
- Track Orders

### Payment APIs
- Razorpay
- Stripe
- Payment Verification
- Refund Management

---

##  Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Role-Based Access Control
- Protected APIs
- Input Validation
- Error Handling Middleware
- Secure Payment Verification

---

##  Scripts

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```

---

##  Future Improvements

- Multi Vendor Ecommerce
- AI Product Recommendation
- Real-time Notifications
- Advanced Analytics
- Subscription System

---

##  Contributing

Contributions are welcome.

1. Fork repository
2. Create new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```





##  DailyNest Backend

Secure, scalable, and production-ready ecommerce backend for powering modern shopping experiences.