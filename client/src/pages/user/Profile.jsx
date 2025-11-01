import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getProfile, updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Phone, Building, Save, Edit, X, 
  Shield, CreditCard, Bell, Trash2, Lock, 
  Check, AlertCircle, Camera, Calendar 
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        company: response.data.company || '',
      });
    } catch (error) {
      setError('Failed to load profile. Please try again.');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');
      await updateProfile(formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile Settings">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16">
              <div className="flex items-end space-x-5">
                <div className="relative group">
                  <div className="h-32 w-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
                    <User className="h-16 w-16 text-blue-600" />
                  </div>
                  <button className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
                  <p className="text-gray-600 mt-1">{profile?.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      {user?.role === 'admin' ? 'Administrator' : 'Active User'}
                    </span>
                    {profile?.activeSubscription && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:mb-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{profile?.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    Email Address
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{profile?.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{profile?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    Company
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your company name"
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{profile?.company || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your account preferences and security</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Lock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
                      <p className="text-xs text-gray-600">Update your account password</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    Update
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-xs text-gray-600">Receive updates about your account</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">Delete Account</h3>
                      <p className="text-xs text-red-600">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Information */}
            {profile?.activeSubscription && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Subscription</h2>
                  <CreditCard className="h-6 w-6 opacity-80" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-purple-200 text-xs mb-1">Current Plan</p>
                    <p className="text-xl font-bold">{profile.activeSubscription.Plan.name}</p>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-purple-100">Valid Until</span>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {new Date(profile.activeSubscription.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <button className="w-full bg-white text-purple-700 font-semibold py-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
                    Manage Subscription
                  </button>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Account Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Member Since</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Profile Status</span>
                  <span className="text-sm font-semibold text-green-700">Complete</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Account Type</span>
                  <span className="text-sm font-semibold text-purple-700 capitalize">{user?.role || 'User'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;