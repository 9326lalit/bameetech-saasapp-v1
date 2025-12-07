# 🚀 BameeTech Lead Management Platform

<div align="center">
  <img src="client/src/assets/Bamee-Tech-Logo-Menu.png" alt="BameeTech Logo" width="200"/>
  
  ### Professional Lead Management & Subscription Platform
  
  A complete subscription-based lead management system with Admin and User panels, Razorpay payment integration, and secure database connectivity.
</div>

---

## 🎉 LATEST UPDATE - All Issues Fixed!

**✅ WordPress Content Access - WORKING**  
**✅ Login Persistence After Refresh - WORKING**  
**✅ All Backend Errors Resolved - WORKING**

### 📚 Quick Navigation
- **🚀 [START HERE](START_HERE.md)** - Quick start guide (3 steps)
- **✅ [FIXES APPLIED](FIXES_APPLIED.md)** - Complete list of fixes
- **🔧 [FIX ISSUES](fix-issues.md)** - Troubleshooting guide
- **📖 [SETUP GUIDE](SETUP_GUIDE.md)** - Detailed setup instructions
- **☑️ [VERIFICATION CHECKLIST](VERIFICATION_CHECKLIST.md)** - Test everything

---

## Features

### Admin Panel
- Dashboard summary showing total users, active plans, and revenue overview
- CRUD operations for subscription plans
- View all users, their subscription status, and payment history
- Export data as CSV / Excel reports

### Subscriber Panel
- Login / Register
- View and manage active subscription
- Upgrade or renew plan
- Access purchased leads or dataset list
- Profile & billing history view

### Payment Integration
- Razorpay integration for subscription payments
- Webhooks to verify payments
- Auto-update user subscription after successful payment

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Axios, React Router
- **Backend**: Node.js (Express.js), JWT authentication, Razorpay integration, Sequelize ORM
- **Database**: MySQL/PostgreSQL (Hostinger)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL or PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/bamee-dashboard.git
cd bamee-dashboard
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Configure environment variables
   - Create a `.env` file in the server directory based on the `.env.example` file
   - Add your database credentials, JWT secret, and Razorpay API keys

4. Install client dependencies
```bash
cd ../client
npm install
```

5. Start the development servers

Server:
```bash
cd ../server
npm run dev
```

Client:
```bash
cd ../client
npm run dev
```

## API Endpoints

### Auth
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `GET /auth/profile` - Get user profile

### Subscription Plans
- `POST /admin/plans` - Create a new plan (admin only)
- `GET /plans` - Get all active plans
- `PUT /admin/plans/:id` - Update a plan (admin only)
- `DELETE /admin/plans/:id` - Delete a plan (admin only)

### Payment
- `POST /payment/create-order` - Create a Razorpay order
- `POST /payment/verify` - Verify payment
- `POST /payment/webhook` - Handle Razorpay webhook

### Leads
- `GET /user/leads` - Get leads for user
- `GET /admin/leads` - Get all leads (admin only)
- `GET /admin/users` - Get all users (admin only)

## Deployment

1. Build the client
```bash
cd client
npm run build
```

2. Set up environment variables on your hosting provider
3. Deploy the server and client to Hostinger

## Branding

### Logo & Assets
- Logo: `client/src/assets/Bamee-Tech-Logo-Menu.png`
- Favicon: `client/public/Bamee-Tech-Logo-Menu.png`
- Reusable Logo Component: `client/src/components/Logo.jsx`

### Brand Colors
- Primary Orange: `#ea580c` (orange-600)
- Secondary Orange: `#f97316` (orange-500)
- Accent Yellow: `#fbbf24` (yellow-400)
- Background: Gradient from orange-50 via yellow-50 to orange-100

### Usage
```jsx
import Logo from '../components/Logo';

// Available sizes: sm, md, lg, xl
<Logo size="md" className="custom-class" />
```

## License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ by BameeTech</p>
  <p>© 2024 BameeTech. All rights reserved.</p>
</div>