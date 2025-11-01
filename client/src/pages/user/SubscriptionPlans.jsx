import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  getAllPlans, 
  createOrder, 
  verifyPayment, 
  getUserSubscription 
} from '../../services/api';
import { 
  Check, Star, Zap, Crown, Shield, Rocket, 
  CheckCircle, XCircle, AlertCircle, Loader, Package, Calendar, TrendingUp 
} from 'lucide-react';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Load data and Razorpay SDK
  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch plans and subscriptions
  const fetchData = async () => {
    try {
      setLoading(true);

      const [plansResponse, subscriptionsResponse] = await Promise.all([
        getAllPlans(),
        getUserSubscription().catch(() => ({ data: [] }))
      ]);

      setPlans(plansResponse.data || []);

      // Normalize subscriptions to always be an array
      let subsData = [];
      const subDataRaw = subscriptionsResponse.data;
      if (Array.isArray(subDataRaw)) {
        subsData = subDataRaw;
      } else if (subDataRaw?.subscription) {
        subsData = [subDataRaw.subscription];
      } else if (subDataRaw) {
        subsData = [subDataRaw];
      }
      setUserSubscriptions(subsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load subscription plans. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const isPlanActive = (planId) => {
    return userSubscriptions.some(sub => 
      (sub.planId === planId || sub.Plan?.id === planId) && new Date(sub.endDate) > new Date()
    );
  };

  const getSubscriptionDetails = (planId) => {
    return userSubscriptions.find(sub => 
      (sub.planId === planId || sub.Plan?.id === planId) && new Date(sub.endDate) > new Date()
    );
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    end.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    };
    return date.toLocaleDateString('en-IN', options);
  };

  // Razorpay subscription
  const handleSubscribe = async (planId, planName, planPrice) => {
    if (isPlanActive(planId)) {
      showToast('You already have an active subscription for this plan!', 'info');
      return;
    }

    try {
      setProcessing(planId);
      showToast('Initiating payment...', 'info');

      const response = await createOrder({ planId });
      const { order, key_id } = response.data;

      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Please refresh the page.');

      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Your Company Name",
        description: `Subscription: ${planName}`,
        order_id: order.id,
        handler: async (res) => {
          try {
            showToast('Verifying payment...', 'info');
            await verifyPayment({
              planId,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_order_id: res.razorpay_order_id,
              razorpay_signature: res.razorpay_signature,
            });
            showToast('Payment successful! Subscription activated.', 'success');
            setTimeout(() => {
              fetchData();
              navigate('/user-dashboard');
            }, 1500);
          } catch (error) {
            console.error('Payment verification error:', error);
            showToast('Payment received but verification failed. Please contact support.', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(null);
            showToast('Payment cancelled', 'info');
          }
        },
        theme: { color: "#3B82F6" },
        prefill: {
          name: userProfile.name || "User",
          email: userProfile.email || "",
          contact: userProfile.phone || "",
        },
        notes: { plan_id: planId, plan_name: planName }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        showToast(`Payment failed: ${response.error.description}`, 'error');
        setProcessing(null);
      });

      rzp.open();
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getPlanIcon = (index, isActive) => {
    const icons = [
      { Icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { Icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100' },
      { Icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
      { Icon: Rocket, color: 'text-green-600', bg: 'bg-green-100' },
      { Icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
    ];
    const iconData = icons[index % icons.length];
    return {
      Icon: iconData.Icon,
      color: isActive ? 'text-green-600' : iconData.color,
      bg: isActive ? 'bg-green-100' : iconData.bg
    };
  };

  if (loading) {
    return (
      <Layout title="Subscription Plans">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <Loader className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading subscription plans...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscription Plans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-md">
          <div className={`flex items-center px-5 py-4 rounded-lg shadow-xl ${
            toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}>
            {toast.type === 'success' && <CheckCircle className="h-6 w-6 text-green-600 mr-3" />}
            {toast.type === 'error' && <XCircle className="h-6 w-6 text-red-600 mr-3" />}
            {toast.type === 'info' && <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />}
            <span className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' :
              toast.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock powerful features and grow your business with flexible subscription options.
          </p>
        </div>

        {/* Active Subscriptions */}
        {userSubscriptions.length > 0 && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  Active Subscriptions ({userSubscriptions.length})
                </h3>
                <div className="space-y-2">
                  {userSubscriptions.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-green-700 font-medium">
                        {sub.Plan?.name || 'Subscription'} - Valid until {formatDate(sub.endDate)}
                      </span>
                      <span className="text-green-600 font-semibold">
                        {calculateDaysRemaining(sub.endDate)} days left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-600">Check back later for available subscription plans.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const isPopular = index === 1; 
              const isActive = isPlanActive(plan.id);
              const subscriptionDetails = getSubscriptionDetails(plan.id);
              const iconData = getPlanIcon(index, isActive);
              const { Icon, color, bg } = iconData;

              return (
                <div 
                  key={plan.id} 
                  className={`relative card p-3 transition-all duration-300 hover:shadow-2xl ${
                    isPopular ? 'ring-2 ring-blue-500 lg:scale-105' : ''
                  } ${isActive ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' : ''}`}
                >
                  {/* Badges */}
                  {isPopular && !isActive && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                        ⭐ Most Popular
                      </span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Active
                      </span>
                    </div>
                  )}

                  {/* Plan Info */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${bg}`}>
                      <Icon className={`h-8 w-8 ${color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">₹{plan.price?.toLocaleString('en-IN')}</span>
                      <span className="text-gray-600 ml-2 text-lg
                      ">
                        / {plan.duration} {plan.duration === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Active Subscription Details */}
                  {isActive && subscriptionDetails && (
                    <div className="mb-6 p-4 bg-white rounded-lg border-2 border-green-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-green-600 mr-2" />
                          <span>Valid until: <strong>{formatDate(subscriptionDetails.endDate)}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                          <span>Days remaining: <strong>{calculateDaysRemaining(subscriptionDetails.endDate)} days</strong></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-4 ">What's included:</h4>
                    <ul className="space-y-3">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start group">
                            <div className="flex-shrink-0">
                              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <span className="text-gray-700 ml-3 leading-relaxed">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Full access to all features</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id, plan.name, plan.price)}
                    disabled={processing === plan.id || isActive}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : processing === plan.id
                        ? 'bg-gray-400 text-white cursor-wait'
                        : isPopular
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {processing === plan.id ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        Processing Payment...
                      </>
                    ) : isActive ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Currently Active
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Subscribe Now
                      </>
                    )}
                  </button>

                  {/* Renew Option */}
                  {isActive && subscriptionDetails && calculateDaysRemaining(subscriptionDetails.endDate) <= 7 && (
                    <button
                      onClick={() => handleSubscribe(plan.id, plan.name, plan.price)}
                      disabled={processing === plan.id}
                      className="w-full mt-3 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                    >
                      Renew Subscription
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Support Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help Choosing?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help you select the perfect plan for your business needs.
            </p>
            <button 
              onClick={() => navigate('/contact')}
              className="btn btn-primary inline-flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </Layout>
  );
};

export default SubscriptionPlans;
