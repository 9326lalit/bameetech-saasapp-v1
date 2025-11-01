# BameeTech Lead Management System

A complete subscription-based lead management system for BameeTech, including Admin and User panels, Razorpay integration, and secure database connectivity.

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

## License

This project is licensed under the MIT License.