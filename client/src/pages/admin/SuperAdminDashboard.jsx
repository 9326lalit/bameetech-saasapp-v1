import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
    getDashboardStats,
    getAllPlans,
    getAllRazorpayPayments,
    getAllRazorpayOrders,
    getAllRazorpaySubscriptions,
    getAllUsers,
} from '../../services/api';
import { Users, CreditCard, DollarSign, TrendingUp, Calendar, Tag, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// --- Caching Constants ---
const CACHE_KEY = 'superAdminDashboardCache';
// Cache Time-To-Live: 5 minutes (300,000 milliseconds)
const CACHE_TTL = 5 * 60 * 1000; 

// --- Caching Utilities ---
const getCache = () => {
    try {
        const cachedItem = localStorage.getItem(CACHE_KEY);
        if (!cachedItem) return null;

        const { data, timestamp } = JSON.parse(cachedItem);
        // Check if cache has expired
        if (Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Error reading cache:', e);
        return null;
    }
};

const setCache = (data) => {
    try {
        const item = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(item));
    } catch (e) {
        console.error('Error writing cache:', e);
    }
};

// 🚨 Utility function to correctly calculate total revenue from Razorpay captured payments
const calculateTotalRevenueFromPayments = (payments) => {
    const capturedPayments = payments.filter(p => p.status === 'captured');
    // Razorpay amounts are in the smallest unit (paise), so divide by 100 for INR
    return capturedPayments.reduce((acc, p) => acc + (p.amount / 100), 0);
};

// Calculate revenue from active subscriptions only
const calculateActiveSubscribersRevenue = (users) => {
    let activeRevenue = 0;
    users.forEach(user => {
        const activeSubscriptions = user.Subscriptions?.filter(s => s.status === 'active') || [];
        activeSubscriptions.forEach(sub => {
            activeRevenue += sub.amount || 0;
        });
    });
    return activeRevenue;
};

// --- Main Component ---
const SuperAdminDashboard = () => {
    // 1. Check cache for initial state
    const cachedData = getCache();

    // Initial state setup (either from cache or default values)
    const [stats, setStats] = useState(cachedData?.stats || {
        totalUsers: 0,
        activePlans: 0,
        totalRevenue: 0,
        activeSubscribersRevenue: 0,
        recentPayments: [], 
        totalOrders: 0,
        totalSubscriptions: 0,
    });
    const [plans, setPlans] = useState(cachedData?.plans || []);
    
    // Set loading to TRUE only if NO CACHE found, otherwise start as false (stale-while-revalidate)
    const [loading, setLoading] = useState(!cachedData); 
    const [error, setError] = useState('');

    // --- Data Fetching Logic (Optimized for Cache) ---
    const fetchDashboardData = useCallback(async () => {
        // Only show a loading indicator if data is empty OR if the cache has expired
        setLoading(true); 
        setError('');

        try {
            const [statsRes, plansRes, paymentsRes, ordersRes, subscriptionsRes, usersRes] = await Promise.all([
                getDashboardStats(),
                getAllPlans(),
                getAllRazorpayPayments(),
                getAllRazorpayOrders(),
                getAllRazorpaySubscriptions(),
                getAllUsers(),
            ]);

            const payments = paymentsRes?.data?.items || [];
            const orders = ordersRes?.data?.items || [];
            const subscriptions = subscriptionsRes?.data?.items || [];
            const users = usersRes?.data || [];

            // 1. Determine Total Revenue
            const totalRevenueFromAPI = paymentsRes?.data?.totalRevenue || 0;
            const totalRevenueCalculated = calculateTotalRevenueFromPayments(payments);
            const finalTotalRevenue = totalRevenueFromAPI || totalRevenueCalculated;

            // 2. Calculate Active Subscribers Revenue
            const activeRevenue = calculateActiveSubscribersRevenue(users);

            // 3. Sort payments
            const sortedPayments = [...payments].sort((a, b) => b.created_at - a.created_at);

            // 4. Prepare new state
            const newStats = {
                totalUsers: statsRes?.data?.totalUsers || 0,
                activePlans: statsRes?.data?.activePlans || 0,
                totalRevenue: finalTotalRevenue,
                activeSubscribersRevenue: activeRevenue,
                recentPayments: sortedPayments,
                totalOrders: orders.length,
                totalSubscriptions: subscriptions.length,
            };
            const newPlans = plansRes?.data || [];

            // 5. Update state
            setStats(newStats);
            setPlans(newPlans);

            // 6. Update Cache
            setCache({ stats: newStats, plans: newPlans });

        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            // Only set error if no data (cache) is currently being displayed
            if (!stats.totalUsers) {
                setError('Failed to load dashboard data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [stats.totalUsers]);

    // --- useEffect: Fetch data on mount ---
    useEffect(() => {
        // If cached data exists, we show it instantly and then trigger a fetch 
        // in the background (stale-while-revalidate).
        // If no cache exists, the initial state sets loading=true, and this fetches data.
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Currency Formatter ---
    const formatCurrency = amount => {
        if (typeof amount !== 'number' || isNaN(amount)) return '₹0'; 
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0, 
        }).format(amount);
    };

    // --- Optimized Loading and Error Handling ---
    // Only show the full blocking loading screen if data is empty AND we are fetching.
    const showBlockingLoader = loading && stats.totalUsers === 0;

    if (showBlockingLoader) {
        return (
            <Layout title="Super Admin Dashboard">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-4" /> 
                        <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Super Admin Dashboard">
                <div className="text-center text-red-500 py-20">{error}</div>
            </Layout>
        );
    }

    // --- Main Render (Shows instantly if data is present) ---
    return (
        <Layout title="Super Admin Dashboard">
            <div className="space-y-8">
                {/* Welcome */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white p-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome to BameeTech Control Center 🚀</h1>
                    <p className="text-purple-100">
                        Manage plans, monitor users, and track payments/orders/subscriptions
                    </p>
                </div>

                {/* Status Indicator for Background Fetch (Visible if cached data is stale) */}
                {loading && stats.totalUsers > 0 && (
                    <div className="flex items-center text-purple-600 font-medium justify-end">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Updating data in background...</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<Users className="h-10 w-10 text-blue-500" />}
                        color="blue" 
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value={stats.activePlans}
                        icon={<CreditCard className="h-10 w-10 text-green-500" />}
                        color="green" 
                    />
                    <StatCard
                        title="Active Revenue"
                        value={formatCurrency(stats.activeSubscribersRevenue)} 
                        icon={<DollarSign className="h-10 w-10 text-emerald-500" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats.totalRevenue)} 
                        icon={<DollarSign className="h-10 w-10 text-purple-500" />}
                        color="purple"
                    />
                    <StatCard
                        title="Available Plans"
                        value={plans.length}
                        icon={<Tag className="h-10 w-10 text-orange-500" />}
                        color="orange" 
                    />
                </div>

                {/* Quick Actions */}
                <QuickActions />

                {/* Subscription Plans */}
                <SubscriptionPlans plans={plans} />

                {/* Razorpay Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Razorpay Payments"
                        value={stats.recentPayments.length}
                        icon={<DollarSign className="h-10 w-10 text-indigo-500" />}
                        color="indigo"
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={<CreditCard className="h-10 w-10 text-teal-500" />}
                        color="teal"
                    />
                    <StatCard
                        title="Total Subscriptions"
                        value={stats.totalSubscriptions}
                        icon={<Tag className="h-10 w-10 text-yellow-500" />}
                        color="yellow"
                    />
                </div>

                {/* Recent Payments Table - NOW ENABLED */}
                {/* <RecentPaymentsTable payments={stats.recentPayments} /> */}

                {/* Recent Orders Table (Summary Placeholder) */}
                <RecentOrdersTable ordersCount={stats.totalOrders} />
            </div>
        </Layout>
    );
};

// --- Reusable Components (StatCard, QuickActions, SubscriptionPlans, RecentPaymentsTable, RecentOrdersTable) ---

const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white shadow-md rounded-lg p-4 flex justify-between items-center border-l-4 border-${color}-500`}>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
    </div>
);

const QuickActions = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
                to="/super-admin/plan-management"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Tag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">Manage Plans</h3>
                    <p className="text-sm text-gray-600">Create and edit subscription plans</p>
                </div>
            </Link>
            <Link
                to="/super-admin/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">View Users</h3>
                    <p className="text-sm text-gray-600">Monitor user accounts and subscriptions</p>
                </div>
            </Link>
            <div
                onClick={() => alert('Analytics coming soon!')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">View business reports and metrics</p>
                </div>
            </div>
        </div>
    </div>
);

const SubscriptionPlans = ({ plans }) => (
    <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Subscription Plans
            </h2>
            <Link to="/super-admin/plan-management" className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition duration-150">
                <Plus className="h-4 w-4 mr-2" /> Add Plan
            </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.slice(0, 3).map(plan => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="mb-4">
                        <span className="text-2xl font-bold">₹{plan.price?.toFixed(0) || 0}</span>
                        <span className="text-gray-600 ml-1">/{plan.duration} days</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <div className="text-sm text-gray-500">
                        {Array.isArray(plan.features) ? plan.features.length : 1} features included
                    </div>
                </div>
            ))}
            {plans.length === 0 && <p className="text-center col-span-3 text-gray-500">No subscription plans found.</p>}
        </div>
    </div>
);

// const RecentPaymentsTable = ({ payments }) => (
//     <div className="bg-white shadow-md rounded-lg p-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
//             <TrendingUp className="h-5 w-5 text-indigo-600" /> Recent Payments (Top 10)
//         </h2>
//         {payments.length > 0 ? (
//             <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-100">
//                         <tr>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Payment ID</th>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Plan</th>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">User Info</th>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
//                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
//                         {payments.slice(0, 10).map(payment => (
//                             <tr key={payment.id} className="hover:bg-gray-50">
//                                 <td className="px-4 py-2 truncate max-w-[100px] font-medium">{payment.id.substring(0, 8)}...</td>
//                                 <td className="px-4 py-2 font-semibold text-green-700">₹{((payment.amount || 0) / 100).toLocaleString('en-IN')}</td>
//                                 <td className="px-4 py-2">{payment.notes?.plan_name || 'N/A'}</td>
//                                 <td className="px-4 py-2 truncate max-w-[150px]">{payment.email || payment.contact || 'N/A'}</td>
//                                 <td className="px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1">
//                                     <Calendar className="h-4 w-4 text-gray-400" />
//                                     {/* Convert Unix timestamp (seconds) to Date object (milliseconds) */}
//                                     {format(new Date(payment.created_at * 1000), 'dd/MM/yyyy HH:mm')}
//                                 </td>
//                                 <td className="px-4 py-2">
//                                     <span
//                                         className={`px-2 py-1 rounded-full text-white text-xs font-medium capitalize ${
//                                             payment.status === 'captured' ? 'bg-green-500' : 
//                                             payment.status === 'created' ? 'bg-yellow-500' : 'bg-red-500'
//                                         }`}
//                                     >
//                                         {payment.status}
//                                     </span>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         ) : (
//             <div className="text-center py-12 text-gray-500">
//                 <p>No payments yet. Transactions will appear here when users subscribe.</p>
//             </div>
//         )}
//     </div>
// );

const RecentOrdersTable = ({ ordersCount }) => (
    <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-600" /> Razorpay Orders Summary
        </h2>
        <p className="text-lg text-gray-700">Total Orders Created: <span className="font-bold text-teal-600">{ordersCount}</span></p>
        <p className="text-sm text-gray-500 mt-2">Note: This is a summary. Complete order details would require a dedicated table component.</p>
    </div>
);

export default SuperAdminDashboard;