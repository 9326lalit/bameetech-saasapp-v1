import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (profileData) => api.put('/auth/profile', profileData);

// Plan services
export const getAllPlans = () => api.get('/plans');
export const createPlan = (planData) => {
  const config = planData instanceof FormData ? 
    { headers: { 'Content-Type': 'multipart/form-data' } } : 
    {};
  return api.post('/plans', planData, config);
};
export const updatePlan = (id, planData) => {
  const config = planData instanceof FormData ? 
    { headers: { 'Content-Type': 'multipart/form-data' } } : 
    {};
  return api.put(`/plans/${id}`, planData, config);
};
export const deletePlan = (id) => api.delete(`/plans/${id}`);

// Payment services
export const createOrder = (planId) => api.post('/subscription/create-order',  planId );
export const verifyPayment = (paymentData) => api.post('/subscription/verify-payment', paymentData);

// Lead services
export const getUserLeads = () => api.get('/user/leads');
export const getAdminLeads = () => api.get('/admin/leads');
export const exportLeads = () => api.get('/admin/leads/export', { responseType: 'blob' });

// User services (admin)
export const getAllUsers = () => api.get('/super-admin/users');
export const getDashboardStats = () => api.get('/super-admin/dashboard');

// Lead Database services
export const getAllLeadDatabases = () => api.get('/admin/lead-databases');
export const createLeadDatabase = (databaseData) => api.post('/admin/lead-databases', databaseData);
export const updateLeadDatabase = (id, databaseData) => api.put(`/admin/lead-databases/${id}`, databaseData);
export const deleteLeadDatabase = (id) => api.delete(`/admin/lead-databases/${id}`);
export const testDatabaseConnection = (connectionData) => api.post('/admin/lead-databases/test-connection', connectionData);

// Subscription services
export const createDirectSubscription = (planId) => api.post('/subscription/subscribe-direct', { planId });
export const getUserSubscription = () => api.get('/subscription/my-subscription');
export const getAllUserSubscriptions = () => api.get('/subscription/my-subscriptions');
export const cancelSubscription = (subscriptionId) => api.post('/subscription/cancel', { subscriptionId });


//razorpay services (admin)
// services/api.js
export const getAllRazorpayPayments = () => api.get('/api/razorpay/payments');
export const getAllRazorpayOrders = () => api.get('/api/razorpay/orders');
export const getAllRazorpaySubscriptions = () => api.get('/api/razorpay/subscriptions');


export default api;