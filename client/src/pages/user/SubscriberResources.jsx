import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
    getSubscriberResources,
    getPlanResources,
    downloadPlanDocument
} from '../../services/api';
import {
    Download, FileText, Globe, Database, Calendar,
    CheckCircle, AlertCircle, Loader, Package,
    ArrowLeft, ExternalLink, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriberResources = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const [resources, setResources] = useState(null);
    const [allResources, setAllResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingDoc, setDownloadingDoc] = useState(null);

    useEffect(() => {
        if (planId) {
            fetchPlanResources();
        } else {
            fetchAllResources();
        }
    }, [planId]);

    const fetchAllResources = async () => {
        try {
            setLoading(true);
            const response = await getSubscriberResources();
            setAllResources(response.data.resources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlanResources = async () => {
        try {
            setLoading(true);
            const response = await getPlanResources(planId);
            setResources(response.data.resources);
        } catch (error) {
            console.error('Error fetching plan resources:', error);
            toast.error('Failed to load plan resources');
            navigate('/resources');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDocument = async (docIndex, document) => {
        try {
            setDownloadingDoc(docIndex);
            const response = await downloadPlanDocument(planId, docIndex);

            // Create blob and download
            const blob = new Blob([response.data], { type: document.mimetype });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = document.originalName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Document downloaded successfully');
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        } finally {
            setDownloadingDoc(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDaysRemaining = (endDate) => {
        const diffTime = new Date(endDate) - new Date();
        return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    };

    if (loading) {
        return (
            <Layout title="Resources">
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <Loader className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading your resources...</p>
                </div>
            </Layout>
        );
    }

    // Single plan view
    if (planId && resources) {
        const daysLeft = calculateDaysRemaining(resources.endDate);

        return (
            <Layout title={`${resources.planName} - Resources`}>
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/resources')}
                            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to All Resources
                        </button>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{resources.planName}</h1>
                                    <p className="text-gray-600 mb-4">{resources.planDescription}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center text-green-600 mb-2">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <span className="font-semibold">Active</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div className="flex items-center mb-1">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Valid until {formatDate(resources.endDate)}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {daysLeft} days remaining
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HTML Content */}
                    {resources.htmlContent && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <Globe className="h-5 w-5 mr-2" />
                                Plan Content
                            </h2>
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div 
                                    className="p-6"
                                    dangerouslySetInnerHTML={{ __html: resources.htmlContent }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {resources.documents && resources.documents.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Documents ({resources.documents.length})
                            </h2>
                            <div className="bg-white rounded-lg border border-gray-200">
                                {resources.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center">
                                            <div className="bg-blue-50 p-2 rounded-lg mr-3">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{doc.originalName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.mimetype}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadDocument(index, doc)}
                                            disabled={downloadingDoc === index}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {downloadingDoc === index ? (
                                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4 mr-2" />
                                            )}
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lead Database Info */}
                    {resources.leadDatabase && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <Database className="h-5 w-5 mr-2" />
                                Lead Database Access
                            </h2>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{resources.leadDatabase.name}</h3>
                                        <p className="text-gray-600 mt-1">{resources.leadDatabase.description}</p>
                                        {resources.leadLimit && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                Lead Limit: {resources.leadLimit.toLocaleString()} leads
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate('/leads')}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Access Leads
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Resources Message */}
                    {!resources.htmlContent && (!resources.documents || resources.documents.length === 0) && !resources.leadDatabase && (
                        <div className="text-center py-12">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Additional Resources</h3>
                            <p className="text-gray-600">This plan doesn't include additional resources at the moment.</p>
                        </div>
                    )}
                </div>
            </Layout>
        );
    }

    // All resources view
    return (
        <Layout title="My Resources">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Resources</h1>
                    <p className="text-gray-600">Access all your subscribed plan resources</p>
                </div>

                {allResources.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscriptions</h3>
                        <p className="text-gray-600 mb-6">Subscribe to a plan to access resources</p>
                        <button
                            onClick={() => navigate('/subscription-plans')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Browse Plans
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allResources.map((resource) => {
                            const daysLeft = calculateDaysRemaining(resource.endDate);
                            const hasResources = resource.htmlContent ||
                                (resource.documents && resource.documents.length > 0) ||
                                resource.leadDatabase;

                            return (
                                <div key={resource.subscriptionId} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{resource.planName}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{resource.planDescription}</p>
                                        </div>
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            <span className="text-xs font-medium">ACTIVE</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        {resource.htmlContent && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Globe className="h-4 w-4 mr-2" />
                                                Interactive content available
                                            </div>
                                        )}

                                        {resource.documents && resource.documents.length > 0 && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <FileText className="h-4 w-4 mr-2" />
                                                {resource.documents.length} document{resource.documents.length > 1 ? 's' : ''}
                                            </div>
                                        )}

                                        {resource.leadDatabase && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Database className="h-4 w-4 mr-2" />
                                                {resource.leadDatabase.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-sm text-gray-500 mb-4">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Valid until {formatDate(resource.endDate)}
                                        </div>
                                        <div className="flex items-center mt-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {daysLeft} days remaining
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/resources/plan/${resource.planId}`)}
                                        disabled={!hasResources}
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${hasResources
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {hasResources ? 'Access Resources' : 'No Resources Available'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SubscriberResources;