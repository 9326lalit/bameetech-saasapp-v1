import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Building2 } from 'lucide-react';

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await apiLogin(formData);
      
      // Check if user is actually a super admin
      if (response.data.user.role !== 'super_admin') {
        setError('Access denied. This login is only for BameeTech administrators.');
        setLoading(false);
        return;
      }
      
      login(response.data.user, response.data.token);
      navigate('/super-admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building2 className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">BameeTech</h1>
            </div>
            <p className="text-gray-600">Administrator Access Portal</p>
          </div>
          
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Administrator Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder="Enter your admin email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Regular user?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700 text-center">
              <Shield className="h-3 w-3 inline mr-1" />
              Secure administrator access for BameeTech personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;