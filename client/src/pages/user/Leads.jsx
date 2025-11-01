import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Filter, Database, Globe, Mail, Phone, Building,
  CheckCircle, XCircle, AlertCircle, Loader, Package, TrendingUp,
  ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Calendar,
  Activity, Target, Clock, BarChart3
} from 'lucide-react';
import Layout from '../../components/Layout';

const MOCK_SUBSCRIPTIONS = [
  {
    id: 1,
    Plan: {
      name: 'Premium Business',
      leadLimit: 5000,
      description: 'Complete business intelligence suite'
    },
    endDate: '2026-03-15',
    status: 'active'
  }
];

const MOCK_LEADS = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  name: ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emma Wilson', 'David Brown', 'Lisa Anderson', 'James Taylor', 'Maria Garcia', 'Robert Martinez', 'Jennifer Lee', 'William Davis', 'Sophia Rodriguez'][i % 12],
  email: ['john.smith', 'sarah.j', 'michael.chen', 'emma.wilson', 'david.brown', 'lisa.anderson', 'james.taylor', 'maria.garcia', 'robert.m', 'jennifer.lee', 'william.d', 'sophia.r'][i % 12] + '@company.com',
  mobile: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  company: ['Tech Solutions Inc', 'Digital Innovations', 'Global Enterprises', 'Smart Systems Ltd', 'Future Tech Corp', 'Business Dynamics', 'Alpha Industries', 'Prime Solutions', 'Elite Services', 'Nexus Group', 'Quantum Labs', 'Apex Systems'][i % 12],
  website: ['techsolutions.com', 'digitalinno.io', 'globalent.com', 'smartsys.co', 'futuretech.net', 'bizdy.com', 'alphaindustries.io', 'primesol.com', 'eliteservices.co', 'nexusgroup.com', 'quantumlabs.io', 'apexsys.com'][i % 12],
  business: ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Consulting', 'E-commerce', 'Media', 'Logistics', 'Telecom'][i % 12],
  status: ['new', 'contacted', 'qualified', 'closed', 'lost'][i % 5],
  lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
}));

const UserLeads = () => {
  const [leads, setLeads] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [toast, setToast] = useState(null);

  // Load data (simulate API)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSubscriptions(MOCK_SUBSCRIPTIONS);
      setSelectedPlan(MOCK_SUBSCRIPTIONS[0] || null);
      setLeads(MOCK_LEADS);
      setLoading(false);
      showToast(`Loaded ${MOCK_LEADS.length} leads successfully`, 'success');
    }, 800); // faster load for UX
  }, []);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const diffTime = new Date(endDate) - new Date();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  };

  // Memoized filtered + sorted leads
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(l => {
      const matchSearch = [l.name, l.email, l.company, l.business, l.mobile].some(field =>
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchFilter = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchFilter;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField]?.toString().toLowerCase() || '';
      const bVal = b[sortField]?.toString().toLowerCase() || '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return filtered;
  }, [leads, searchTerm, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusConfig = (status) => {
    const configs = {
      new: { label: 'New', class: 'bg-blue-50 text-blue-700 border-blue-200', dotClass: 'bg-blue-500' },
      contacted: { label: 'Contacted', class: 'bg-purple-50 text-purple-700 border-purple-200', dotClass: 'bg-purple-500' },
      qualified: { label: 'Qualified', class: 'bg-green-50 text-green-700 border-green-200', dotClass: 'bg-green-500' },
      closed: { label: 'Closed', class: 'bg-gray-50 text-gray-700 border-gray-200', dotClass: 'bg-gray-500' },
      lost: { label: 'Lost', class: 'bg-red-50 text-red-700 border-red-200', dotClass: 'bg-red-500' }
    };
    return configs[status] || configs.new;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-800">Loading Dashboard...</h3>
          <p className="text-gray-600 text-sm">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!subscriptions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl w-full bg-white p-10 rounded-lg shadow-lg text-center">
          <Package className="h-10 w-10 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Plan</h2>
          <p className="text-gray-600 mb-6">Subscribe to unlock lead management features</p>
          <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Leads Management">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center px-5 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-white border-l-4 border-green-500' :
            toast.type === 'error' ? 'bg-white border-l-4 border-red-500' :
            'bg-white border-l-4 border-blue-500'
          }`}>
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mr-3" />}
            {toast.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />}
            <span className="text-sm font-medium text-gray-900">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Leads Management</h1>
          <p className="text-gray-600">Manage and track your business opportunities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 rounded-lg p-2"><Users className="h-5 w-5 text-blue-600" /></div>
              <span className="text-xs text-gray-500 font-medium">+12%</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 rounded-lg p-2"><Target className="h-5 w-5 text-green-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Active</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.status === 'new').length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 rounded-lg p-2"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Qualified</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Conversion</p>
            <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.status === 'qualified').length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-50 rounded-lg p-2"><Clock className="h-5 w-5 text-orange-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Days</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Plan Expires</p>
            <p className="text-2xl font-bold text-gray-900">{calculateDaysRemaining(selectedPlan?.endDate)}</p>
          </div>
        </div>

        {/* Plan Info */}
        {selectedPlan && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-lg"><CheckCircle className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPlan.Plan?.name}</h3>
                <p className="text-sm text-gray-600">{selectedPlan.Plan?.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-right">
              <div>
                <p className="text-xs text-gray-500">Valid Until</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPlan.endDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Days Left</p>
                <p className="text-sm font-semibold text-blue-600">{calculateDaysRemaining(selectedPlan.endDate)} days</p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-gray-700 bg-white min-w-[180px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status ({leads.length})</option>
              {['new', 'contacted', 'qualified', 'closed', 'lost'].map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({leads.filter(l => l.status === status).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Lead Directory</h2>
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length}
            </p>
          </div>

          {currentLeads.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['name', 'email', 'company', 'status'].map(field => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Website</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Business</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLeads.map(lead => {
                      const statusConfig = getStatusConfig(lead.status);
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-9 w-9 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-700 font-semibold text-sm">{lead.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <a href={`tel:${lead.mobile}`} className="hover:text-blue-600">{lead.mobile}</a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap flex items-center text-sm text-gray-900">
                            <Building className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">{lead.company}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {lead.website ? (
                              <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                                <Globe className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-[140px]">{lead.website}</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ) : <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.business}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.class}`}>
                              <span className={`h-1.5 w-1.5 rounded-full mr-2 ${statusConfig.dotClass}`}></span>
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pageNum === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >{pageNum}</button>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-gray-400">...</span>;
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Found</h3>
              <p className="text-sm text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserLeads;
