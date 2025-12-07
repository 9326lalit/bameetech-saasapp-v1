import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ExternalLink, Lock, Loader, AlertCircle, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProtectedContent = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessingContent, setAccessingContent] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.get(`${API_URL}/subscription/my-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activeWithContent = data.subscriptions.filter(
        (sub) =>
          sub.status === "active" &&
          sub.Plan?.contentUrls?.length > 0
      );

      setSubscriptions(activeWithContent);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleAccessContent = async (planId, contentId, content) => {
    try {
      setAccessingContent(contentId);
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API_URL}/api/content/generate-token`,
        { planId, contentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        let url = data.proxyUrl;
        if (!url.includes("?uid=")) url += `?uid=${user.id}`;
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Access error:", err);
      alert(err.response?.data?.message || "Unable to open content.");
    } finally {
      setAccessingContent(null);
    }
  };

  if (loading)
    return (
      <Layout title="Protected Content">
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your content...</p>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout title="Protected Content">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </Layout>
    );

  if (subscriptions.length === 0)
    return (
      <Layout title="Protected Content">
        <div className="max-w-4xl mx-auto bg-gray-50 p-12 border border-gray-200 rounded-lg text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No content available</h2>
          <p className="text-gray-600 mb-6">You currently have no active subscriptions with premium content.</p>
          <a href="/plans" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">Explore Plans</a>
        </div>
      </Layout>
    );

  return (
    <Layout title="Protected Content">
      <div className="max-w-6xl mx-auto">
        <p className="text-gray-600 mb-6">Access your exclusive, subscriber-only content.</p>

        <div className="space-y-8">
          {subscriptions.map((subscription) => {
            const plan = subscription.Plan;
            const contentUrls = [...plan.contentUrls].sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div key={subscription.id} className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                    <p className="text-indigo-100">{plan.description}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center text-green-300 mb-1">
                      <CheckCircle className="h-5 w-5 mr-2" /> Active
                    </div>
                    <p className="text-sm text-indigo-200">
                      Expires: {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content ({contentUrls.length})</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentUrls.map((content) => (
                      <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{content.title}</h4>
                            {content.description && (
                              <p className="text-sm text-gray-600 mb-3">{content.description}</p>
                            )}
                          </div>

                          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                            #{content.order}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAccessContent(plan.id, content.id, content)}
                          disabled={accessingContent === content.id}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                        >
                          {accessingContent === content.id ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" /> Opening...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" /> View Content
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

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Links open in a new tab and expire after 1 hour.</li>
              <li>• Access is restricted to your active subscription period.</li>
              <li>• Each link is tied to your identity and device.</li>
              <li>• Your email may appear as a watermark for security.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProtectedContent;
