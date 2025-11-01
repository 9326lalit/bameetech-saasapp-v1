import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllUsers, getAllRazorpayPayments } from '../../services/api';
import Layout from '../../components/Layout';
import { format } from 'date-fns';
import { DollarSign, Loader2, Users as UsersIcon, CreditCard, TrendingDown } from 'lucide-react';

// --- Caching Constants ---
const CACHE_KEY = 'usersDashboardCache';
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

// --- Skeleton Component for smooth loading ---
const SkeletonCard = () => (
    <div className="bg-white shadow-xl rounded-xl p-5 border-l-4 border-gray-300 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
    </div>
);

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    </tr>
);
// --- End Skeleton Components ---

const Users = () => {
    // 1. Check cache for initial state
    const cachedData = getCache();

    // 2. Initialize state from cache or defaults
    const [users, setUsers] = useState(cachedData?.users || []);
    const [payments, setPayments] = useState(cachedData?.payments || []);
    
    // isFetching is true if NO CACHE exists, otherwise it starts as false (stale-while-revalidate)
    const [isFetching, setIsFetching] = useState(!cachedData); 

    // Filters and Sorting states
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('endDate');

    // Stats state initialized
    const [stats, setStats] = useState(cachedData?.stats || {
        totalUsers: 0,
        activeSubscriptions: 0,
        nonActiveUsers: 0,
        totalRevenue: 0.00,
    });

    // Currency Formatter (Memoized)
    const formatCurrency = useMemo(() => amount => {
        if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount);
    }, []);

    // --- Core Logic: Calculate All Stats (Memoized) ---
    const calculateStats = useCallback((usersData, paymentsData, apiTotalRevenue = 0) => {
        const totalUsers = usersData.length;
        let activeSubscriptionsCount = 0;
        let nonActiveUsersCount = 0;

        // 1. Calculate Subscription Counts and Non-Active Users
        usersData.forEach(u => {
            const hasActiveSub = u.Subscriptions?.some(s => s.status === 'active');
            
            if (hasActiveSub) {
                activeSubscriptionsCount += u.Subscriptions.filter(s => s.status === 'active').length;
            } else {
                nonActiveUsersCount++;
            }
        });

        // 2. Determine Revenue
        let finalRevenue = apiTotalRevenue;

        // Fallback Revenue Calculation (if API totalRevenue is not provided/invalid)
        if (typeof finalRevenue !== 'number' || finalRevenue <= 0) {
            const validPaymentsData = Array.isArray(paymentsData) ? paymentsData : [];
            const capturedPayments = validPaymentsData.filter(p => p.status === 'captured');
            // Razorpay amounts are in paise, so divide by 100 for INR
            finalRevenue = capturedPayments.reduce((acc, p) => acc + (p.amount / 100), 0);
        }

        return { 
            totalUsers, 
            activeSubscriptions: activeSubscriptionsCount, 
            nonActiveUsers: nonActiveUsersCount,
            totalRevenue: finalRevenue
        };
    }, []);

    // --- Data Fetching (Optimized for Cache) ---
    const fetchData = useCallback(async () => {
        // Set loading to true to show the subtle indicator, even if stale data is present
        setIsFetching(true); 
        try {
            const [usersRes, paymentsRes] = await Promise.all([
                getAllUsers(),
                getAllRazorpayPayments(),
            ]);

            const usersData = usersRes.data || [];
            const paymentsData = paymentsRes.data?.items || (Array.isArray(paymentsRes.data) ? paymentsRes.data : []); 
            const apiTotalRevenue = paymentsRes.data?.totalRevenue;

            // Calculate new stats
            const newStats = calculateStats(usersData, paymentsData, apiTotalRevenue);

            // Update state
            setUsers(usersData);
            setPayments(paymentsData);
            setStats(newStats);
            
            // Update Cache
            setCache({ users: usersData, payments: paymentsData, stats: newStats });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            // Optionally, set an error state here if needed
        } finally {
            setIsFetching(false);
        }
    }, [calculateStats]);

    useEffect(() => {
        // Fetch data on mount. If cache exists, this runs in the background.
        fetchData();
    }, [fetchData]);

    // --- Filtering and Sorting Logic (Optimized with useMemo) ---
    const filteredUsers = useMemo(() => {
        let currentUsers = [...users];

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            currentUsers = currentUsers.filter(
                user =>
                    user.name.toLowerCase().includes(lowerSearch) ||
                    user.email.toLowerCase().includes(lowerSearch)
            );
        }

        // Filter by Subscription Status
        if (filter !== 'all') {
            currentUsers = currentUsers.filter(user => {
                const hasActive = user.Subscriptions?.some(sub => sub.status === 'active');
                if (filter === 'active') {
                    return hasActive;
                } else { 
                    // This covers 'inactive'
                    return !hasActive;
                }
            });
        }
        
        // Sort Subscriptions within each user object for table display
        currentUsers.forEach(user => {
            if (user.Subscriptions && user.Subscriptions.length > 0) {
                user.Subscriptions.sort((a, b) => {
                    // Sorting logic: always put active subscriptions first if possible
                    if (sortBy === 'endDate') {
                        // Prioritize active subscriptions ending sooner, or simply sort by end date
                        return new Date(a.endDate) - new Date(b.endDate);
                    }
                    if (sortBy === 'amount') return b.amount - a.amount;
                    return 0;
                });
            }
        });

        return currentUsers;
    }, [users, search, filter, sortBy]);
    // --- END Filtering and Sorting Logic ---


    // --- Main Render ---
    return (
        <Layout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Subscription & User Overview 🚀</h1>
                    {isFetching && (
                        <div className="flex items-center text-indigo-600">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            <span className="text-sm">Updating data...</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards (4-column grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {/* Only use skeletons if no data is available (first load without cache) */}
                    {isFetching && users.length === 0 ? (
                        <>
                            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </>
                    ) : (
                        <>
                            <StatCard title="Total Users" value={stats.totalUsers} icon={UsersIcon} color="indigo" />
                            <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} color="green" />
                            <StatCard 
                                title="Non-Active Users" 
                                value={stats.nonActiveUsers} 
                                icon={TrendingDown} 
                                color="red" 
                            />
                            <StatCard 
                                title="Total Revenue" 
                                value={formatCurrency(stats.totalRevenue)} 
                                icon={DollarSign} 
                                color="purple" 
                            />
                        </>
                    )}
                </div>
                
                {/* Filters and Search - Disabled only if no data is present */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white shadow-lg rounded-xl">
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        className="p-3 border border-gray-300 rounded-lg flex-1 min-w-[200px] focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        disabled={isFetching && users.length === 0}
                    />
                    <select
                        className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        disabled={isFetching && users.length === 0}
                    >
                        <option value="all">All Users</option>
                        <option value="active">Active Subscriptions</option>
                        <option value="inactive">No Active Subscription</option>
                    </select>
                    <select
                        className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        disabled={isFetching && users.length === 0}
                    >
                        <option value="endDate">Sort by Sub. End Date</option>
                        <option value="amount">Sort by Sub. Amount</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto bg-white shadow-xl rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isFetching && users.length === 0 ? (
                                // Show 5 skeleton rows if initially fetching
                                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user =>
                                    user.Subscriptions && user.Subscriptions.length > 0 ? (
                                        user.Subscriptions.map((sub, idx) => (
                                            <tr key={`${user.id}-${idx}`} className="hover:bg-indigo-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                                <td className="px-4 py-3 text-sm capitalize">{user.role}</td>
                                                <td className="px-4 py-3 text-sm font-medium">{sub.Plan?.name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(sub.amount)}</td>
                                                <td className="px-4 py-3 text-sm">{sub.startDate ? format(new Date(sub.startDate), 'dd/MM/yyyy') : 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm">{sub.endDate ? format(new Date(sub.endDate), 'dd/MM/yyyy') : 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                            sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Row for users with no subscriptions
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-4 py-3 text-sm capitalize">{user.role}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400" colSpan="5">
                                                <span className="px-2 py-1 rounded-full text-white text-xs bg-gray-400">
                                                    No Subscription Found
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-10 text-gray-500 text-lg">
                                        No users found matching the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

// --- Reusable Components (StatCard is unchanged) ---

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white shadow-xl rounded-xl p-5 border-l-4 border-${color}-500 flex items-center justify-between`}>
        <div>
            <h2 className="text-sm font-medium text-gray-500">{title}</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-8 w-8 text-${color}-500 opacity-70`} />
    </div>
);

export default Users;