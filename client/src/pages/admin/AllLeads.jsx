import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getAdminLeads, exportLeads } from '../../services/api';
import { Database, Search, Filter, Download, Users, Calendar } from 'lucide-react';

const AllLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await getAdminLeads();
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportLeads();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting leads:', error);
    } finally {
      setExporting(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.User?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Layout title="All Leads">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="All Leads">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
            <p className="text-gray-600 mt-1">Monitor leads across all subscribers</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 flex items-center">
              <Database className="h-4 w-4 mr-1" />
              {filteredLeads.length} leads
            </span>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-outline flex items-center"
            >
              {exporting ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, company, or owner..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="input w-auto"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card">
          {filteredLeads.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Lead</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Company</th>
                      <th className="table-header-cell">Owner</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">{lead.name}</div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-gray-900">{lead.email}</div>
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-gray-900">{lead.company}</div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {lead.User?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {lead.User?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`status-badge ${
                            lead.status === 'new' ? 'status-success' : 
                            lead.status === 'contacted' ? 'status-info' : 
                            lead.status === 'qualified' ? 'status-warning' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center text-gray-900">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No leads found' : 'No leads yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Leads will appear here once subscribers start adding them'
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-200 rounded-full mr-4">
                <Database className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">New Leads</p>
                <p className="text-2xl font-bold text-green-900">
                  {leads.filter(lead => lead.status === 'new').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-200 rounded-full mr-4">
                <Database className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Contacted</p>
                <p className="text-2xl font-bold text-blue-900">
                  {leads.filter(lead => lead.status === 'contacted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-200 rounded-full mr-4">
                <Database className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">Qualified</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {leads.filter(lead => lead.status === 'qualified').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-200 rounded-full mr-4">
                <Database className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Total Leads</p>
                <p className="text-2xl font-bold text-purple-900">{leads.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllLeads;