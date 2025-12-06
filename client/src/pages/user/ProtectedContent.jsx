import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ExternalLink, Lock, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';

const ProtectedContent = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessingContent, setAccessingContent] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/subscription/my-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter active subscriptions with content URLs
      const activeWithContent = response.data.subscriptions.filter(sub => 
        sub.status === 'active' && 
        sub.Plan?.contentUrls && 
        sub.Plan.contentUrls.length > 0
      );

      setSubscriptions(activeWithContent);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load your subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessContent = async (planId, contentId, contentTitle) => {
    try {
      setAccessingContent(contentId);
      const token = localStorage.getItem('token');

      // Generate access token
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_URL}/api/content/generate-token`,
        { planId, contentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Open content in new tab
        window.open(response.data.proxyUrl, '_blank');
      }
    } catch (err) {
      console.error('Error accessing content:', err);
      alert(err.response?.data?.message || 'Failed to access content. Please try again.');
    } finally {
      setAccessingContent(null);
    }
  };

  if (loading) {
    return (
      <Layout title="Protected Content">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Protected Content">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Layout title="Protected Content">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Protected Content Available</h2>
            <p className="text-gray-600 mb-6">
              You don't have any active subscriptions with protected content.
            </p>
            <a
              href="/plans"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Plans
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Protected Content">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-600">
            Access exclusive content from your active subscriptions
          </p>
        </div>

      <div className="space-y-8">
        {subscriptions.map((subscription) => {
          const plan = subscription.Plan;
          const contentUrls = [...plan.contentUrls].sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div key={subscription.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                    <p className="text-indigo-100">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-300 mb-1">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Active</span>
                    </div>
                    <p className="text-sm text-indigo-200">
                      Expires: {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content List */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Content ({contentUrls.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentUrls.map((content) => (
                    <div
                      key={content.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {content.title}
                          </h4>
                          {content.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {content.description}
                            </p>
                          )}
                        </div>
                        <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                          #{content.order}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAccessContent(plan.id, content.id, content.title)}
                        disabled={accessingContent === content.id}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {accessingContent === content.id ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Content
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click "View Content" to open protected pages in a new tab</li>
                <li>• Content is accessible only while your subscription is active</li>
                <li>• Each access link is temporary and expires after 1 hour</li>
                <li>• Your email will be watermarked on the content for security</li>
                <li>• Links are tied to your device and cannot be shared</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProtectedContent;
