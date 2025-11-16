import axios from 'axios';

const API_URL = 'http://147.79.71.235/';

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
export const getUserLeads = () => api.get('/api/user/leads'); // Legacy endpoint
export const getUserLeadsOverview = () => api.get('/api/user/leads-overview'); // Get all subscriptions with lead access
export const getPlanLeads = (planId, tableName = null) => {
  const url = tableName ? `/api/user/plan/${planId}/leads?tableName=${tableName}` : `/api/user/plan/${planId}/leads`;
  return api.get(url);
}; // Get leads for specific plan
export const getAdminLeads = () => api.get('/api/admin/leads');
export const exportLeads = () => api.get('/api/admin/leads/export', { responseType: 'blob' });
export const getAvailableLeadTables = () => api.get('/api/admin/lead-tables'); // Get all Supabase lead tables
export const getLeadsFromTable = (tableName) => api.get(`/api/admin/lead-tables/${tableName}`); // Get leads from specific table

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

// Subscriber resource services
export const getSubscriberResources = () => api.get('/subscriber/my-resources');
export const getPlanResources = (planId) => api.get(`/subscriber/plan/${planId}/resources`);
export const downloadPlanDocument = (planId, documentIndex) => 
  api.get(`/subscriber/plan/${planId}/document/${documentIndex}`, { responseType: 'blob' });

// Admin subscriber management services
export const createAdminSubscriber = (subscriberData) => api.post('/admin/subscribers', subscriberData);
export const grantAccessToExistingUser = (grantData) => api.post('/admin/grant-access', grantData);
export const searchExistingUsers = (query) => api.get(`/admin/search-users?query=${encodeURIComponent(query)}`);
export const getAdminGrantedSubscribers = () => api.get('/admin/subscribers');
export const getSubscriberDetails = (subscriberId) => api.get(`/admin/subscribers/${subscriberId}`);
export const updateSubscriberAccess = (subscriberId, updateData) => api.put(`/admin/subscribers/${subscriberId}`, updateData);
export const deleteAdminSubscriber = (subscriberId) => api.delete(`/admin/subscribers/${subscriberId}`);

export default api;