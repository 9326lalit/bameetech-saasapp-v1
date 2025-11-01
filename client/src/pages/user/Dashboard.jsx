// src/pages/dashboard/UserDashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, Clock, CreditCard, TrendingUp } from 'lucide-react';
import { getProfile, getUserSubscription, getAllUserSubscriptions, cancelSubscription } from '../../services/api';
import { format, differenceInDays, differenceInMilliseconds } from 'date-fns';
import Layout from '../../components/Layout';
import formatDateTime from '../../utils/formatDateTime';
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


const handleCancel = async (id) => {
  console.log("🟡 Sending subscription id:", id);

  if (!id) {
    return toast.error("Subscription ID missing!");
  }

  try {
    const res = await cancelSubscription(id);
    toast.success("Cancelled Successfully");
  } catch (err) {
    toast.error("Error cancelling subscription");
  }
};


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
    localStorage.removeItem('token');
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
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg"><CreditCard className="h-6 w-6 text-blue-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Plans</p>
                <p className="text-2xl font-semibold">{activeCount}</p>
                <p className="text-sm text-gray-400 mt-1">{subscriptions.length} total</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg"><TrendingUp className="h-6 w-6 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Plan Access</p>
                <p className="text-2xl font-semibold">{activeCount > 0 ? 'Full Access' : 'Limited Access'}</p>
                <p className="text-sm text-gray-400 mt-1">{activeCount > 0 ? 'Your premium features are active' : 'Upgrade to access more features'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg"><Calendar className="h-6 w-6 text-purple-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Next Expiry</p>
                <p className="text-2xl font-semibold">{nextExpiryCountdown ?? (nextExpiryDays > 0 ? `${nextExpiryDays} days` : '—')}</p>
                <p className="text-sm text-gray-400 mt-1">{subscriptions.length > 0 ? 'Nearest subscription expiry' : 'No active subscriptions'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Subscriptions</h2>
            <div className="flex items-center gap-3">
              <Link to="/subscription-plans" className="btn btn-primary">Browse Plans</Link>
              <button className="btn btn-ghost" onClick={fetchUserData}>Refresh</button>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold">No Active Subscriptions</h3>
              <p className="text-gray-600 mt-2">Subscribe to a plan to access leads and premium features.</p>
              <div className="mt-6">
                <Link to="/subscription-plans" className="btn btn-primary">View Plans</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((s) => {
                const plan = s.Plan ?? s.plan ?? {};
                const endDate = s.endDate ?? s.end_date ?? s.end;
                const startDate = s.startDate ?? s.start_date ?? s.start;
                const remaining = daysRemaining(endDate);
                const status = new Date(endDate) > new Date() ? (s.status ?? 'active') : 'expired';
                return (
                  <div key={s.id} className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                          {plan.name || 'Unnamed Plan'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{plan.description ?? ''}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Valid until <strong>{formatDateTime(endDate)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {status === 'active' ? <span className="text-orange-600">{remaining} day(s) remaining</span> : <span className="text-gray-500">Expired</span>}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <Link to={`/leads?plan=${plan.id || s.planId}`} className="btn btn-primary flex-1">Access Resources</Link>
                      <Link to={`/subscription/${s.id}`} className="btn btn-ghost">Details</Link>
                      <button onClick={() => handleCancel(s?.id)}>
  Cancel Plan
</button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {subscriptions.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Quick Actions</h3>
                <p className="text-sm text-gray-500">Common tasks for your account</p>
              </div>
              <div className="flex gap-2">
                <Link to="/leads" className="btn">View Leads</Link>
                <Link to="/profile" className="btn btn-outline">Manage Profile</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
