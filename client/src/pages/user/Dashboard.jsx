// src/pages/dashboard/UserDashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, Clock, CreditCard, TrendingUp } from 'lucide-react';
import { getProfile, getUserSubscription, getAllUserSubscriptions, cancelSubscription } from '../../services/api';
import { format, differenceInDays, differenceInMilliseconds } from 'date-fns';
import Layout from '../../components/Layout';
import formatDateTime from '../../utils/formatDateTime';
import ReadMore from '../../components/ReadMore';
import axios from 'axios';


// Days remaining until expiry
const daysRemaining = (endDate) => {
  if (!endDate) return 0;
  const diff = differenceInDays(new Date(endDate), new Date());
  return diff > 0 ? diff : 0;
};

const UserDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Loading your dashboard...');
  const [error, setError] = useState(null);
  const [nextExpiryCountdown, setNextExpiryCountdown] = useState(null);

  const countdownRef = useRef(null);
  const navigate = useNavigate();


  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
    return () => clearInterval(countdownRef.current); // cleanup
  }, []);

  // Build normalized subscriptions array
  const buildSubscriptionsArray = (activeResp, allResp) => {
    const arr = [];

    if (activeResp?.data) {
      const payload = activeResp.data.subscription ?? activeResp.data;
      if (Array.isArray(payload)) arr.push(...payload);
      else if (payload && payload.id) arr.push(payload);
    }

    if (allResp?.data) {
      const subs = Array.isArray(allResp.data.subscriptions)
        ? allResp.data.subscriptions
        : Array.isArray(allResp.data)
        ? allResp.data
        : allResp.data.subscriptions ?? [];
      subs.forEach(s => {
        if (!arr.some(x => x.id === s.id)) arr.push(s);
      });
    }

    return arr;
  };

  // Fetch profile and subscriptions
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Fetching profile and subscriptions...');
    try {
      const [profileResp, activeSubResp, allSubResp] = await Promise.allSettled([
        getProfile(),
        getUserSubscription(),
        getAllUserSubscriptions(),
      ]);

      // Profile
      if (profileResp.status === 'fulfilled') setProfile(profileResp.value.data);
      else toast.error('Failed to load profile');

      // Subscriptions
      const subs = buildSubscriptionsArray(
        activeSubResp.status === 'fulfilled' ? activeSubResp.value : null,
        allSubResp.status === 'fulfilled' ? allSubResp.value : null
      );

      setSubscriptions(subs);

      if (subs.length > 0) toast.success(`You have ${subs.length} subscription${subs.length > 1 ? 's' : ''}`);

      setupNextExpiryCountdown(subs);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while loading dashboard.');
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Setup countdown for nearest subscription expiry
  const setupNextExpiryCountdown = (subs) => {
    clearInterval(countdownRef.current);
    if (!subs || subs.length === 0) {
      setNextExpiryCountdown(null);
      return;
    }

    const futureSubs = subs
      .map(s => ({ ...s, endDateObj: new Date(s.endDate ?? s.end_date ?? s.end) }))
      .filter(s => s.endDateObj > new Date());

    if (!futureSubs.length) {
      setNextExpiryCountdown(null);
      return;
    }

    futureSubs.sort((a, b) => a.endDateObj - b.endDateObj);
    const nearest = futureSubs[0];

    const update = () => {
      const msLeft = differenceInMilliseconds(new Date(nearest.endDate), new Date());
      if (msLeft <= 0) {
        setNextExpiryCountdown('Expired');
        clearInterval(countdownRef.current);
      } else {
        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
        setNextExpiryCountdown(`${days}d ${hours}h ${minutes}m`);
      }
    };

    update();
    countdownRef.current = setInterval(update, 60 * 1000); // update every minute
  };

  const handleRetry = () => fetchUserData();
  const logout = () => {
    localStorage.clear();
    // localStorage.removeItem('token');
    toast.success('Logged out');
    navigate('/login');
  };

  const activeCount = subscriptions.filter(s => new Date(s.endDate ?? s.end_date ?? s.end) > new Date()).length;
  const nextExpiryDays = subscriptions.length ? Math.min(...subscriptions.map(s => daysRemaining(s.endDate ?? s.end_date ?? s.end))) : 0;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <Toaster position="top-right" />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-gray-600">{loadingMsg}</p>
          <div className="loader" />
          <button onClick={handleRetry} className="btn btn-ghost mt-4">Retry</button>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <Toaster position="top-right" />
        <div className="card p-6 text-center">
          <h3 className="text-lg font-semibold">Unable to load dashboard</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button className="btn" onClick={handleRetry}>Retry</button>
            <button className="btn btn-outline" onClick={logout}>Logout</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Welcome back, ${profile?.name || 'User'}`}>
      <Toaster position="top-right" />
      <div className="space-y-6 sm:space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="mobile-card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg"><CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" /></div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Active Plans</p>
                <p className="text-xl sm:text-2xl font-semibold truncate">{activeCount}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{subscriptions.length} total</p>
              </div>
            </div>
          </div>
          <div className="mobile-card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-50 rounded-lg"><TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" /></div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Plan Access</p>
                <p className="text-lg sm:text-2xl font-semibold truncate">{activeCount > 0 ? 'Full Access' : 'Limited'}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate-mobile">{activeCount > 0 ? 'Premium features active' : 'Upgrade for more features'}</p>
              </div>
            </div>
          </div>
          <div className="mobile-card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg"><Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" /></div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Next Expiry</p>
                <p className="text-lg sm:text-2xl font-semibold truncate">{nextExpiryCountdown ?? (nextExpiryDays > 0 ? `${nextExpiryDays} days` : '—')}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate-mobile">{subscriptions.length > 0 ? 'Nearest expiry' : 'No active subscriptions'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="mobile-spacing">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <h2 className="mobile-heading">Your Subscriptions</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Link to="/subscription-plans" className="mobile-button btn-primary text-center">Browse Plans</Link>
              <button className="mobile-button btn btn-secondary" onClick={fetchUserData}>Refresh</button>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="mobile-card text-center mobile-padding">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold">No Active Subscriptions</h3>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Subscribe to a plan to access leads and premium features.</p>
              <div className="mt-4 sm:mt-6">
                <Link to="/subscription-plans" className="mobile-button btn-primary">View Plans</Link>
              </div>
            </div>
          ) : (
            <div className="mobile-grid">
              {subscriptions.map((s) => {
                const plan = s.Plan ?? s.plan ?? {};
                const endDate = s.endDate ?? s.end_date ?? s.end;
                const startDate = s.startDate ?? s.start_date ?? s.start;
                const remaining = daysRemaining(endDate);
                const status = new Date(endDate) > new Date() ? (s.status ?? 'active') : 'expired';
                return (
                  <div key={s.id} className="mobile-card hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full flex-shrink-0 ${status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                          <span className="truncate">{plan.name || 'Unnamed Plan'}</span>
                        </h3>
                        {plan.description && (
                          <div className="mt-1">
                            <ReadMore 
                              maxLength={80}
                              className="text-xs sm:text-sm text-gray-500"
                            >
                              {plan.description}
                            </ReadMore>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Valid until <strong>{formatDateTime(endDate)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {status === 'active' ? <span className="text-orange-600">{remaining} day(s) remaining</span> : <span className="text-gray-500">Expired</span>}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                      <Link to={`/resources/plan/${plan.id || s.planId}`} className="mobile-button btn-primary text-center">Access Resources</Link>
                      <Link to="/leads" className="mobile-button btn btn-secondary text-center">View Leads</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {subscriptions.length > 0 && (
          <div className="mobile-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Quick Actions</h3>
                <p className="text-xs sm:text-sm text-gray-500">Common tasks for your account</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/resources" className="mobile-button btn text-center">My Resources</Link>
                <Link to="/leads" className="mobile-button btn btn-outline text-center">View Leads</Link>
                <Link to="/profile" className="mobile-button btn btn-outline text-center">Manage Profile</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
