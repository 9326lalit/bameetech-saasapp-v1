import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  getAllPlans,
  createAdminSubscriber,
  grantAccessToExistingUser,
  searchExistingUsers,
  getAdminGrantedSubscribers,
  updateSubscriberAccess,
  deleteAdminSubscriber
} from '../../services/api';
import {
  Plus, Users, Edit, Trash2, CheckCircle, XCircle,
  Calendar, Package, Loader, UserPlus, Shield, Search,
  UserCheck, AlertTriangle, ArrowRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingUserError, setExistingUserError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    planIds: [],
    planDurations: {} // Store duration per plan: { planId: days }
  });
  const [grantData, setGrantData] = useState({
    userId: null,
    planIds: [],
    planDurations: {} // Store duration per plan: { planId: days }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscribersResponse, plansResponse] = await Promise.allSettled([
        getAdminGrantedSubscribers(),
        getAllPlans()
      ]);

      if (subscribersResponse.status === 'fulfilled') {
        setSubscribers(subscribersResponse.value.data.subscribers);
      } else {
        console.error('Failed to fetch subscribers:', subscribersResponse.reason);
        toast.error('Failed to load subscribers');
      }

      if (plansResponse.status === 'fulfilled') {
        setPlans(plansResponse.value.data);
      } else {
        console.error('Failed to fetch plans:', plansResponse.reason);
        toast.error('Failed to load plans');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscriber = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || formData.planIds.length === 0) {
      toast.error('Please fill all fields and select at least one plan');
      return;
    }

    try {
      await createAdminSubscriber(formData);
      toast.success('Subscriber created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', planIds: [], planDurations: {} });
      setExistingUserError(null);
      fetchData();
    } catch (error) {
      console.error('Error creating subscriber:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.existingUser) {
        // User already exists, show option to grant access instead
        setExistingUserError(error.response.data);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create subscriber');
      }
    }
  };

  const handleGrantAccessToExisting = async () => {
    if (!existingUserError?.existingUser || formData.planIds.length === 0) {
      toast.error('Please select at least one plan');
      return;
    }

    try {
      await grantAccessToExistingUser({
        userId: existingUserError.existingUser.id,
        planIds: formData.planIds,
        planDurations: formData.planDurations
      });
      toast.success('Access granted successfully to existing user');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', planIds: [], planDurations: {} });
      setExistingUserError(null);
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error(error.response?.data?.message || 'Failed to grant access');
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchExistingUsers(query);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    
    if (!grantData.userId || grantData.planIds.length === 0) {
      toast.error('Please select a user and at least one plan');
      return;
    }

    try {
      await grantAccessToExistingUser(grantData);
      toast.success('Access granted successfully');
      setShowGrantModal(false);
      setGrantData({ userId: null, planIds: [], planDurations: {} });
      setSearchQuery('');
      setSearchResults([]);
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error(error.response?.data?.message || 'Failed to grant access');
    }
  };

  const handleUpdateSubscriber = async (e) => {
    e.preventDefault();
    
    if (!selectedSubscriber) {
      toast.error('No subscriber selected');
      return;
    }

    // Allow empty planIds to remove all access
    try {
      await updateSubscriberAccess(selectedSubscriber.id, {
        planIds: formData.planIds,
        planDurations: formData.planDurations,
        isActive: formData.isActive
      });
      
      if (formData.planIds.length === 0) {
        toast.success('All access removed from subscriber');
      } else {
        toast.success('Subscriber access updated successfully');
      }
      
      setShowEditModal(false);
      setSelectedSubscriber(null);
      setFormData({ name: '', email: '', password: '', planIds: [], planDurations: {} });
      fetchData();
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error(error.response?.data?.message || 'Failed to update subscriber');
    }
  };

  const handleDeleteSubscriber = async (subscriberId, subscriberName) => {
    if (!window.confirm(`Are you sure you want to delete subscriber "${subscriberName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAdminSubscriber(subscriberId);
      toast.success('Subscriber deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error(error.response?.data?.message || 'Failed to delete subscriber');
    }
  };

  const openEditModal = (subscriber) => {
    setSelectedSubscriber(subscriber);
    // Filter out any plan IDs that no longer exist
    const validPlanIds = (subscriber.grantedPlanIds || []).filter(id => 
      plans.some(plan => plan.id === id)
    );
    
    // Initialize planDurations with default 30 days for each plan
    const initialDurations = {};
    validPlanIds.forEach(planId => {
      initialDurations[planId] = 30; // Default 30 days
    });
    
    setFormData({
      name: subscriber.name,
      email: subscriber.email,
      password: '',
      planIds: validPlanIds,
      planDurations: initialDurations,
      isActive: subscriber.isActive
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanNames = (planIds) => {
    return planIds.map(id => {
      const plan = plans.find(p => p.id === id);
      return plan ? plan.name : `Plan ${id}`;
    }).join(', ');
  };

  if (loading) {
    return (
      <Layout title="Subscriber Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
            <p className="text-gray-600">Loading subscribers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscriber Management">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriber Management</h1>
            <p className="text-gray-600">Create new subscribers or grant access to existing users</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGrantModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Grant Access
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create New
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Subscribers</p>
                <p className="text-2xl font-semibold text-gray-900">{subscribers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {subscribers.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Available Plans</p>
                <p className="text-2xl font-semibold text-gray-900">{plans.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Admin-Granted Subscribers</h2>
          </div>

          {subscribers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscribers Yet</h3>
              <p className="text-gray-600 mb-4">Create your first admin-granted subscriber</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Subscriber
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Granted Plans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              {subscriber.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{subscriber.name}</div>
                            <div className="text-sm text-gray-500">{subscriber.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscriber.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getPlanNames(subscriber.grantedPlanIds)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subscriber.activeSubscriptions} active subscriptions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(subscriber.grantedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(subscriber)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit subscriber"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete subscriber"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grant Access Modal */}
        {showGrantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Access to Existing User</h3>
              
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchQuery.length >= 2 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {searchLoading ? (
                        <div className="p-3 text-center">
                          <Loader className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setGrantData({ ...grantData, userId: user.id });
                              setSearchQuery(`${user.name} (${user.email})`);
                              setSearchResults([]);
                            }}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              grantData.userId === user.id ? 'bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              {user.hasAdminGrant && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Has Access
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No users found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grant Access to Plans</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={grantData.planIds.includes(plan.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGrantData({ 
                                  ...grantData, 
                                  planIds: [...grantData.planIds, plan.id],
                                  planDurations: { ...grantData.planDurations, [plan.id]: 30 }
                                });
                              } else {
                                const newPlanIds = grantData.planIds.filter(id => id !== plan.id);
                                const newDurations = { ...grantData.planDurations };
                                delete newDurations[plan.id];
                                setGrantData({ ...grantData, planIds: newPlanIds, planDurations: newDurations });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                        </label>
                        {grantData.planIds.includes(plan.id) && (
                          <div className="ml-6">
                            <label className="block text-xs text-gray-600 mb-1">Duration (days)</label>
                            <input
                              type="number"
                              value={grantData.planDurations[plan.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setGrantData({
                                  ...grantData,
                                  planDurations: {
                                    ...grantData.planDurations,
                                    [plan.id]: value === '' ? '' : parseInt(value) || 1
                                  }
                                });
                              }}
                              onBlur={(e) => {
                                // Set to 1 if empty on blur
                                if (e.target.value === '') {
                                  setGrantData({
                                    ...grantData,
                                    planDurations: {
                                      ...grantData.planDurations,
                                      [plan.id]: 1
                                    }
                                  });
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              min="1"
                              placeholder="Enter days"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Set individual duration for each plan</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGrantModal(false);
                      setGrantData({ userId: null, planIds: [], planDurations: {} });
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!grantData.userId || grantData.planIds.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Grant Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Subscriber Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Subscriber</h3>
              
              {/* Existing User Error */}
              {existingUserError && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800">User Already Exists</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        <strong>{existingUserError.existingUser.name}</strong> ({existingUserError.existingUser.email}) already exists.
                      </p>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={handleGrantAccessToExisting}
                          className="flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Grant Access Instead
                        </button>
                        <button
                          onClick={() => setExistingUserError(null)}
                          className="px-3 py-1 text-yellow-800 text-sm border border-yellow-300 rounded hover:bg-yellow-100"
                        >
                          Try Different Email
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setExistingUserError(null)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleCreateSubscriber} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grant Access to Plans</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={formData.planIds.includes(plan.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  planIds: [...formData.planIds, plan.id],
                                  planDurations: { ...formData.planDurations, [plan.id]: 30 }
                                });
                              } else {
                                const newPlanIds = formData.planIds.filter(id => id !== plan.id);
                                const newDurations = { ...formData.planDurations };
                                delete newDurations[plan.id];
                                setFormData({ ...formData, planIds: newPlanIds, planDurations: newDurations });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                        </label>
                        {formData.planIds.includes(plan.id) && (
                          <div className="ml-6">
                            <label className="block text-xs text-gray-600 mb-1">Duration (days)</label>
                            <input
                              type="number"
                              value={formData.planDurations[plan.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({
                                  ...formData,
                                  planDurations: {
                                    ...formData.planDurations,
                                    [plan.id]: value === '' ? '' : parseInt(value) || 1
                                  }
                                });
                              }}
                              onBlur={(e) => {
                                // Set to 1 if empty on blur
                                if (e.target.value === '') {
                                  setFormData({
                                    ...formData,
                                    planDurations: {
                                      ...formData.planDurations,
                                      [plan.id]: 1
                                    }
                                  });
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                              placeholder="Enter days"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Set individual duration for each plan</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', email: '', password: '', planIds: [], planDurations: {} });
                      setExistingUserError(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={existingUserError !== null}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Subscriber
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subscriber Modal */}
        {showEditModal && selectedSubscriber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Subscriber: {selectedSubscriber.name}
              </h3>
              
              <form onSubmit={handleUpdateSubscriber} className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Subscriber</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grant Access to Plans</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={formData.planIds.includes(plan.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  planIds: [...formData.planIds, plan.id],
                                  planDurations: { ...formData.planDurations, [plan.id]: 30 }
                                });
                              } else {
                                const newPlanIds = formData.planIds.filter(id => id !== plan.id);
                                const newDurations = { ...formData.planDurations };
                                delete newDurations[plan.id];
                                setFormData({ ...formData, planIds: newPlanIds, planDurations: newDurations });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                        </label>
                        {formData.planIds.includes(plan.id) && (
                          <div className="ml-6">
                            <label className="block text-xs text-gray-600 mb-1">Duration (days)</label>
                            <input
                              type="number"
                              value={formData.planDurations[plan.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({
                                  ...formData,
                                  planDurations: {
                                    ...formData.planDurations,
                                    [plan.id]: value === '' ? '' : parseInt(value) || 1
                                  }
                                });
                              }}
                              onBlur={(e) => {
                                // Set to 1 if empty on blur
                                if (e.target.value === '') {
                                  setFormData({
                                    ...formData,
                                    planDurations: {
                                      ...formData.planDurations,
                                      [plan.id]: 1
                                    }
                                  });
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                              placeholder="Enter days"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Set individual duration for each plan</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSubscriber(null);
                      setFormData({ name: '', email: '', password: '', planIds: [], planDurations: {} });
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriberManagement;