import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, Database, Globe, Mail, Phone, Building,
  CheckCircle, XCircle, AlertCircle, Loader, Package, TrendingUp,
  ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Calendar,
  Activity, Target, Clock, BarChart3, ArrowLeft
} from 'lucide-react';
import Layout from '../../components/Layout';
import { getUserLeadsOverview, getPlanLeads } from '../../services/api';
import toast from 'react-hot-toast';

const UserLeads = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [allLeadsOverview, setAllLeadsOverview] = useState([]);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [leadStats, setLeadStats] = useState(null);
  const [availableLeadTables, setAvailableLeadTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  // Load data from API
  useEffect(() => {
    if (planId) {
      fetchPlanLeads();
    } else {
      fetchAllLeadsOverview();
    }
  }, [planId]);

  const fetchAllLeadsOverview = async () => {
    try {
      setLoading(true);
      const response = await getUserLeadsOverview();
      setAllLeadsOverview(response.data.leadsOverview);
    } catch (error) {
      console.error('Error fetching leads overview:', error);
      toast.error('Failed to load leads overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanLeads = async (tableName = null) => {
    try {
      setLoading(true);
      
      // First get the overview to get plan details
      const overviewResponse = await getUserLeadsOverview();
      const planOverview = overviewResponse.data.leadsOverview.find(p => p.planId === parseInt(planId));
      
      if (planOverview) {
        setSelectedPlanData(planOverview);
      }
      
      // Then get the actual leads
      const response = await getPlanLeads(planId, tableName);
      const leadsData = response.data;
      
      console.log('📊 Leads data received:', leadsData);
      
      // Check if plan has multiple lead tables (new approach)
      if (leadsData.leadTables && leadsData.leadTables.length > 0) {
        console.log('✅ Plan has dynamic lead tables:', leadsData.leadTables);
        setAvailableLeadTables(leadsData.leadTables);
        
        // If no table selected yet, auto-select first table
        if (!tableName && leadsData.leadTables.length > 0) {
          setSelectedTable(leadsData.leadTables[0]);
          fetchPlanLeads(leadsData.leadTables[0]);
          return;
        }
        
        // Display leads from selected table
        if (leadsData.leads) {
          // Transform leads data to extract all fields
          const transformedLeads = leadsData.leads.map(lead => {
            // If lead has nested data structure, flatten it
            if (lead.data && typeof lead.data === 'object') {
              return {
                id: lead.id,
                created_at: lead.created_at,
                ...lead.data // Spread all data fields
              };
            }
            return lead;
          });
          
          setLeads(transformedLeads);
          setLeadStats({
            planName: leadsData.planName,
            currentTable: leadsData.currentTable,
            leadTables: leadsData.leadTables,
            leadLimit: leadsData.leadLimit,
            totalLeads: leadsData.totalLeads,
            allowedFields: leadsData.allowedFields || [] // Fields admin selected for this table
          });
          toast.success(`Loaded ${transformedLeads.length} leads from ${leadsData.currentTable}`);
        }
      } else if (leadsData.leads) {
        // Legacy: single lead database
        setLeads(leadsData.leads);
        setLeadStats({
          planName: leadsData.planName,
          leadDatabase: leadsData.leadDatabase,
          leadLimit: leadsData.leadLimit,
          totalLeads: leadsData.totalLeads,
          usingMockData: leadsData.usingMockData
        });
        
        if (leadsData.usingMockData) {
          toast(`Loaded ${leadsData.leads.length} demo leads (external database unavailable)`, {
            icon: 'ℹ️',
            duration: 4000
          });
        } else {
          toast.success(`Loaded ${leadsData.leads.length} leads successfully`);
        }
      } else {
        setLeads([]);
        toast(`${leadsData.message || 'No leads available'}`, {
          icon: 'ℹ️'
        });
      }
    } catch (error) {
      console.error('Error fetching plan leads:', error);
      toast.error('Failed to load plan leads');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    fetchPlanLeads(tableName);
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

  // Get dynamic columns from leads data
  const getDynamicColumns = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    
    // Get all unique keys from the first lead (excluding system fields)
    const sampleLead = leads[0];
    const allFields = Object.keys(sampleLead).filter(key => 
      !['id', 'created_at', 'updated_at'].includes(key.toLowerCase())
    );
    
    // If admin has selected specific fields, filter to show only those
    if (leadStats?.allowedFields && leadStats.allowedFields.length > 0) {
      return allFields.filter(field => leadStats.allowedFields.includes(field));
    }
    
    // Otherwise show all fields
    return allFields;
  }, [leads, leadStats]);

  // Format field name for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get icon for field type
  const getFieldIcon = (fieldName) => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('email')) return <Mail className="h-4 w-4 mr-2 text-gray-400" />;
    if (lowerField.includes('phone') || lowerField.includes('mobile')) return <Phone className="h-4 w-4 mr-2 text-gray-400" />;
    if (lowerField.includes('company') || lowerField.includes('business')) return <Building className="h-4 w-4 mr-2 text-gray-400" />;
    if (lowerField.includes('website') || lowerField.includes('url')) return <Globe className="h-4 w-4 mr-2 text-gray-400" />;
    return null;
  };

  // Render cell value based on field type
  const renderCellValue = (fieldName, value) => {
    if (!value || value === 'N/A') return <span className="text-gray-400">N/A</span>;
    
    const lowerField = fieldName.toLowerCase();
    
    // Email
    if (lowerField.includes('email')) {
      return (
        <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-700 flex items-center">
          {getFieldIcon(fieldName)}
          {value}
        </a>
      );
    }
    
    // Phone
    if (lowerField.includes('phone') || lowerField.includes('mobile')) {
      return (
        <a href={`tel:${value}`} className="text-blue-600 hover:text-blue-700 flex items-center">
          {getFieldIcon(fieldName)}
          {value}
        </a>
      );
    }
    
    // Website/URL
    if (lowerField.includes('website') || lowerField.includes('url')) {
      const url = value.startsWith('http') ? value : `https://${value}`;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center">
          {getFieldIcon(fieldName)}
          <span className="truncate max-w-[140px]">{value}</span>
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      );
    }
    
    // Default
    return (
      <span className="flex items-center">
        {getFieldIcon(fieldName)}
        {value}
      </span>
    );
  };

  // Memoized filtered + sorted leads
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(l => {
      // Search across all visible fields
      const searchableFields = getDynamicColumns.map(col => l[col]).filter(Boolean);
      const matchSearch = searchableFields.some(field =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [leads, searchTerm, filterStatus, sortField, sortOrder, getDynamicColumns]);

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
      <Layout title="Leads Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-800">Loading Leads...</h3>
            <p className="text-gray-600 text-sm">Please wait a moment</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Single plan view
  if (planId && leadStats) {
    const daysLeft = calculateDaysRemaining(selectedPlanData?.endDate);

    return (
      <Layout title={`${leadStats.planName} - Leads`}>
        <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Plans
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Leads Management</h1>
          <p className="text-gray-600">Manage and track your business opportunities</p>
        </div>

        {/* Lead Tables Tabs */}
        {availableLeadTables.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Select Lead Database
              </h3>
              <span className="text-xs text-gray-500">
                {availableLeadTables.length} table(s) available
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLeadTables.map((table) => (
                <button
                  key={table}
                  onClick={() => handleTableChange(table)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTable === table
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 rounded-lg p-2"><Users className="h-5 w-5 text-blue-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Total</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Available Leads</p>
            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 rounded-lg p-2"><Target className="h-5 w-5 text-green-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Fresh</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.status === 'new').length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 rounded-lg p-2"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Quality</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Qualified</p>
            <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.status === 'qualified').length}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-50 rounded-lg p-2"><Clock className="h-5 w-5 text-orange-600" /></div>
              <span className="text-xs text-gray-500 font-medium">Days</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Plan Expires</p>
            <p className="text-2xl font-bold text-gray-900">{daysLeft || 0}</p>
          </div>
        </div>

        {/* Lead Database Info */}
        {leadStats && (
          <div className={`border rounded-lg p-4 mb-6 ${leadStats.usingMockData ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center">
              <Database className={`h-5 w-5 mr-2 ${leadStats.usingMockData ? 'text-amber-600' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm font-medium ${leadStats.usingMockData ? 'text-amber-900' : 'text-blue-900'}`}>
                  Lead Database: {leadStats.leadDatabase} • Plan: {leadStats.planName}
                  {leadStats.usingMockData && ' • Demo Data'}
                </p>
                {leadStats.leadLimit && (
                  <p className={`text-xs ${leadStats.usingMockData ? 'text-amber-700' : 'text-blue-700'}`}>
                    Limit: {leadStats.leadLimit.toLocaleString()} leads • Available: {leadStats.totalLeads}
                    {leadStats.usingMockData && ' (External database unavailable - showing demo data)'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Field Access Info */}
        {leadStats?.allowedFields && leadStats.allowedFields.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Restricted Field Access</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Your plan allows access to {leadStats.allowedFields.length} specific fields from this database.
                </p>
                <div className="flex flex-wrap gap-1">
                  {leadStats.allowedFields.map(field => (
                    <span key={field} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {formatFieldName(field)}
                    </span>
                  ))}
                </div>
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
              placeholder="Search across all visible fields..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Showing {getDynamicColumns.length} field{getDynamicColumns.length !== 1 ? 's' : ''}
            </span>
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
                      {getDynamicColumns.map(field => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{formatFieldName(field)}</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLeads.map((lead, index) => (
                      <tr key={lead.id || index} className="hover:bg-gray-50 transition-colors">
                        {getDynamicColumns.map(field => (
                          <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {field.toLowerCase().includes('name') && lead[field] ? (
                              <div className="flex items-center">
                                <div className="h-9 w-9 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-700 font-semibold text-sm">
                                    {String(lead[field]).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-semibold text-gray-900">{lead[field]}</p>
                                </div>
                              </div>
                            ) : (
                              renderCellValue(field, lead[field])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
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
  }

  // All plans overview
  return (
    <Layout title="Leads Management">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads Management</h1>
          <p className="text-gray-600">Select a plan to access its leads</p>
        </div>

        {allLeadsOverview.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscriptions</h3>
            <p className="text-gray-600 mb-6">Subscribe to a plan to access leads</p>
            <button
              onClick={() => navigate('/subscription-plans')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Plans
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allLeadsOverview.map((overview) => {
              const daysLeft = calculateDaysRemaining(overview.endDate);
              const hasLeadAccess = overview.hasLeadAccess;

              return (
                <div key={overview.subscriptionId} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{overview.planName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{overview.planDescription}</p>
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">ACTIVE</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {overview.leadDatabase && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Database className="h-4 w-4 mr-2" />
                        {overview.leadDatabase.name}
                      </div>
                    )}

                    {overview.leadLimit && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Lead Limit: {overview.leadLimit.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Valid until {formatDate(overview.endDate)}
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {daysLeft} days remaining
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/leads/plan/${overview.planId}`)}
                    disabled={!hasLeadAccess}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${hasLeadAccess
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {hasLeadAccess ? 'Access Leads' : 'No Lead Database'}
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

export default UserLeads;
