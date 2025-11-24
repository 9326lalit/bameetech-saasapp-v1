import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllUsers, getAllRazorpayPayments } from '../../services/api';
import Layout from '../../components/Layout';
import { format } from 'date-fns';
import { DollarSign, Loader2, Users as UsersIcon, CreditCard, TrendingDown, TrendingUp } from 'lucide-react';

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
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'thisMonth', 'lastMonth', 'custom'
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

    // Stats state initialized
    const [stats, setStats] = useState(cachedData?.stats || {
        totalUsers: 0,
        activeSubscriptions: 0,
        nonActiveUsers: 0,
        totalRevenue: 0.00,
        activeSubscribersRevenue: 0.00,
        monthlyRecurringRevenue: 0.00,
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
        let activeSubscribersRevenue = 0;
        let totalRevenue = 0;
        let monthlyRecurringRevenue = 0;

        // 1. Calculate Subscription Counts, Revenue from Active Subscribers, and MRR
        usersData.forEach(u => {
            const activeSubscriptions = u.Subscriptions?.filter(s => s.status === 'active') || [];
            
            if (activeSubscriptions.length > 0) {
                activeSubscriptionsCount += activeSubscriptions.length;
                
                // Calculate revenue from active subscriptions only
                activeSubscriptions.forEach(sub => {
                    const amount = sub.amount || 0;
                    activeSubscribersRevenue += amount;
                    
                    // Calculate MRR (Monthly Recurring Revenue)
                    // Assuming duration is in days, convert to monthly
                    const duration = sub.Plan?.duration || 30;
                    const monthlyAmount = (amount / duration) * 30;
                    monthlyRecurringRevenue += monthlyAmount;
                });
            } else {
                nonActiveUsersCount++;
            }
        });

        // 2. Calculate Total Revenue from all captured payments
        const validPaymentsData = Array.isArray(paymentsData) ? paymentsData : [];
        const capturedPayments = validPaymentsData.filter(p => p.status === 'captured');
        totalRevenue = capturedPayments.reduce((acc, p) => acc + (p.amount / 100), 0);

        // Use API total revenue if available, otherwise use calculated
        if (typeof apiTotalRevenue === 'number' && apiTotalRevenue > 0) {
            totalRevenue = apiTotalRevenue;
        }

        return { 
            totalUsers, 
            activeSubscriptions: activeSubscriptionsCount, 
            nonActiveUsers: nonActiveUsersCount,
            activeSubscribersRevenue, // Revenue from currently active subscriptions
            totalRevenue, // Total revenue from all payments
            monthlyRecurringRevenue // MRR
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
                } else if (filter === 'inactive') {
                    return !hasActive;
                } else if (filter === 'expired') {
                    return user.Subscriptions?.some(sub => 
                        sub.status === 'expired' || 
                        (sub.endDate && new Date(sub.endDate) < new Date())
                    );
                }
                return true;
            });
        }

        // Filter by Date Range
        if (dateFilter !== 'all') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            currentUsers = currentUsers.filter(user => {
                if (!user.Subscriptions || user.Subscriptions.length === 0) return false;

                return user.Subscriptions.some(sub => {
                    const startDate = sub.startDate ? new Date(sub.startDate) : null;
                    if (!startDate) return false;

                    if (dateFilter === 'thisMonth') {
                        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
                    } else if (dateFilter === 'lastMonth') {
                        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                        return startDate.getMonth() === lastMonth && startDate.getFullYear() === lastMonthYear;
                    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
                        const rangeStart = new Date(customDateRange.start);
                        const rangeEnd = new Date(customDateRange.end);
                        return startDate >= rangeStart && startDate <= rangeEnd;
                    }
                    return true;
                });
            });
        }
        
        // Sort Subscriptions within each user object for table display
        currentUsers.forEach(user => {
            if (user.Subscriptions && user.Subscriptions.length > 0) {
                user.Subscriptions.sort((a, b) => {
                    let comparison = 0;
                    
                    if (sortBy === 'endDate') {
                        comparison = new Date(a.endDate) - new Date(b.endDate);
                    } else if (sortBy === 'startDate') {
                        comparison = new Date(a.startDate) - new Date(b.startDate);
                    } else if (sortBy === 'amount') {
                        comparison = (a.amount || 0) - (b.amount || 0);
                    } else if (sortBy === 'planName') {
                        const nameA = a.Plan?.name || '';
                        const nameB = b.Plan?.name || '';
                        comparison = nameA.localeCompare(nameB);
                    }
                    
                    return sortOrder === 'asc' ? comparison : -comparison;
                });
            }
        });

        return currentUsers;
    }, [users, search, filter, sortBy, sortOrder, dateFilter, customDateRange]);
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

                {/* Stats Cards (6-column grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {/* Only use skeletons if no data is available (first load without cache) */}
                    {isFetching && users.length === 0 ? (
                        <>
                            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
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
                                title="Active Revenue" 
                                value={formatCurrency(stats.activeSubscribersRevenue)} 
                                icon={DollarSign} 
                                color="emerald"
                                subtitle="From active subs"
                            />
                            {/* <StatCard 
                                title="Total Revenue" 
                                value={formatCurrency(stats.totalRevenue)} 
                                icon={DollarSign} 
                                color="purple"
                                subtitle="All payments"
                            /> */}
                            <StatCard 
                                title="MRR" 
                                value={formatCurrency(stats.monthlyRecurringRevenue)} 
                                icon={TrendingUp} 
                                color="blue"
                                subtitle="Monthly recurring"
                            />
                        </>
                    )}
                </div>
                
                {/* Enhanced Filters and Search Section */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden mb-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters & Search
                        </h3>
                    </div>

                    <div className="p-6">
                        {/* Row 1: Search and Status Filter */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                            {/* Search Input */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Users
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        disabled={isFetching && users.length === 0}
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subscription Status
                                </label>
                                <select
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm bg-white"
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    disabled={isFetching && users.length === 0}
                                >
                                    <option value="all">All Users</option>
                                    <option value="active">Active Subscriptions</option>
                                    <option value="inactive">No Active Subscription</option>
                                    <option value="expired">Expired Subscriptions</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Date Filter */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Range
                                </label>
                                <select
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm bg-white"
                                    value={dateFilter}
                                    onChange={e => setDateFilter(e.target.value)}
                                    disabled={isFetching && users.length === 0}
                                >
                                    <option value="all">All Time</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="lastMonth">Last Month</option>
                                    <option value="custom">Custom Date Range</option>
                                </select>
                            </div>

                            {/* Custom Date Range Inputs */}
                            {dateFilter === 'custom' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
                                            value={customDateRange.start}
                                            onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            disabled={isFetching && users.length === 0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
                                            value={customDateRange.end}
                                            onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            disabled={isFetching && users.length === 0}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="lg:col-span-2"></div>
                            )}
                        </div>

                        {/* Row 3: Sorting Options */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {/* Sort By */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm bg-white"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    disabled={isFetching && users.length === 0}
                                >
                                    <option value="endDate">Sort by End Date</option>
                                    <option value="startDate">Sort by Start Date</option>
                                    <option value="amount">Sort by Amount</option>
                                    <option value="planName">Sort by Plan Name</option>
                                </select>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order
                                </label>
                                <select
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm bg-white"
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value)}
                                    disabled={isFetching && users.length === 0}
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilter('all');
                                        setDateFilter('all');
                                        setSortBy('endDate');
                                        setSortOrder('desc');
                                        setCustomDateRange({ start: '', end: '' });
                                    }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition duration-150 font-medium shadow-sm flex items-center justify-center"
                                    disabled={isFetching && users.length === 0}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* Results Count with Enhanced Styling */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    Showing <span className="font-semibold text-indigo-600 mx-1">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900 mx-1">{users.length}</span> users
                                </div>
                                {(search || filter !== 'all' || dateFilter !== 'all') && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                        </svg>
                                        Filters Active
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
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

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className={`bg-white shadow-xl rounded-xl p-4 border-l-4 border-${color}-500 flex flex-col`}>
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase">{title}</h2>
            <Icon className={`h-6 w-6 text-${color}-500 opacity-70`} />
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
);

export default Users;