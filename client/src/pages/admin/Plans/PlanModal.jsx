  // src/pages/Plans/PlanModal.jsx
  import { useState, useEffect } from 'react';
  import { X, Tag, Database, FileText, Upload, CheckCircle, Save, XCircle } from 'lucide-react';
  import { getAvailableLeadTables } from '../../../services/api';
  import axios from 'axios';

  const initialFormData = {
    name: '',
    description: '',
    price: '',
    duration: '',
    features: '', // Stored as newline-separated string in form
    leadTables: [], // Array of selected lead tables
    leadTableFields: {}, // Field configuration for each table
    htmlContent: '',
    contentUrls: [], // WordPress protected content URLs
    isActive: true,
  };

  const PlanModal = ({ show, onClose, onSubmit, plan, isSubmitting }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [availableLeadTables, setAvailableLeadTables] = useState([]);
    const [tableFieldsData, setTableFieldsData] = useState({}); // Store available fields for each table

    // Fetch available lead tables on mount
    useEffect(() => {
      if (show) {
        fetchLeadTables();
      }
    }, [show]);

    const fetchLeadTables = async () => {
      try {
        const response = await getAvailableLeadTables();
        setAvailableLeadTables(response.data.tables || []);
      } catch (error) {
        console.error('Error fetching lead tables:', error);
      }
    };

    // Fetch fields for a specific table
    const fetchTableFields = async (tableName) => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/lead-tables/${tableName}/fields`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setTableFieldsData(prev => ({
            ...prev,
            [tableName]: response.data.fields || []
          }));
        }
      } catch (error) {
        console.error(`Error fetching fields for ${tableName}:`, error);
      }
    };

    // Sync modal state with the plan prop
    useEffect(() => {
      if (plan) {
        
        // Parse leadTables if it's a string
        let parsedLeadTables = [];
        if (typeof plan.leadTables === 'string') {
          try {
            parsedLeadTables = JSON.parse(plan.leadTables);
          } catch (e) {
            console.error('Error parsing leadTables:', e);
            parsedLeadTables = [];
          }
        } else if (Array.isArray(plan.leadTables)) {
          parsedLeadTables = plan.leadTables;
        }
        
        // Parse leadTableFields if it's a string
        let parsedLeadTableFields = {};
        if (typeof plan.leadTableFields === 'string') {
          try {
            parsedLeadTableFields = JSON.parse(plan.leadTableFields);
          } catch (e) {
            console.error('Error parsing leadTableFields:', e);
            parsedLeadTableFields = {};
          }
        } else if (typeof plan.leadTableFields === 'object' && plan.leadTableFields !== null) {
          parsedLeadTableFields = plan.leadTableFields;
        }

        setFormData({
          name: plan.name || '',
          description: plan.description || '',
          price: plan.price || '',
          duration: plan.duration || '',
          // Convert array of features to newline-separated string for textarea
          features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '',
          leadTables: parsedLeadTables,
          leadTableFields: parsedLeadTableFields,
          htmlContent: plan.htmlContent || '',
          contentUrls: Array.isArray(plan.contentUrls) ? plan.contentUrls : [],
          isActive: plan.isActive ?? true,
        });
        
        
        // Optionally handle existing documents here if the API provides them
        setSelectedFiles([]); 
      } else {
        setFormData(initialFormData);
      }
    }, [plan]);

    if (!show) return null;

    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    };

    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      // Basic validation (can be more robust on the server)
      if (files.length > 5) {
          alert('You can upload a maximum of 5 files.');
          return;
      }
      setSelectedFiles(files);
    };

    const handleLeadTableToggle = (tableValue) => {
      
      setFormData(prev => {
        const currentTables = Array.isArray(prev.leadTables) ? prev.leadTables : [];
        const isSelected = currentTables.includes(tableValue);
        const newTables = isSelected
          ? currentTables.filter(t => t !== tableValue)
          : [...currentTables, tableValue];
        
        // If selecting a new table, fetch its fields
        if (!isSelected) {
          fetchTableFields(tableValue);
        }
        
        // If deselecting, remove field configuration for this table
        const newLeadTableFields = { ...prev.leadTableFields };
        if (isSelected) {
          delete newLeadTableFields[tableValue];
        }
      
        
        const newState = {
          ...prev,
          leadTables: newTables,
          leadTableFields: newLeadTableFields
        };
        
        
        return newState;
      });
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent any parent form submission

      // 1. Process Features String to Array
      const featuresArray = formData.features.split('\n')
          .map(f => f.trim())
          .filter(f => f !== '');

      // 2. Prepare final data object for submission
      const finalFormData = {
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          features: featuresArray, // Send as array of strings
          leadTables: Array.isArray(formData.leadTables) ? formData.leadTables : [], // Ensure it's an array
          leadTableFields: formData.leadTableFields || {}, // Include field configuration
          contentUrls: Array.isArray(formData.contentUrls) ? formData.contentUrls : [], // Include content URLs
          isActive: formData.isActive
      };


      onSubmit(finalFormData, selectedFiles);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
          <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-8" onClick={(e) => {
            // Prevent form submission when clicking inside the form
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
              e.stopPropagation();
            }
          }}>
            
            {/* Section: Basic Information */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/70">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center"><Tag className="h-5 w-5 mr-2" /> Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input" placeholder="e.g., Premium Pro" required disabled={isSubmitting} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="input" placeholder="Brief description of the plan" required disabled={isSubmitting} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input" min="0" step="1" placeholder="999" required disabled={isSubmitting} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input" min="1" placeholder="30" required disabled={isSubmitting} />
                </div>
              </div>
            </div>

            {/* Section: Features */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center"><CheckCircle className="h-5 w-5 mr-2" /> Features</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Features (One per line)</label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  className="input"
                  rows="4"
                  placeholder="Enter each feature on a new line (e.g., Unlimited Calls)"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">These will be displayed as bullet points on the plan card.</p>
              </div>
            </div>

            {/* Section: Advanced Configuration */}
            <div className="space-y-6 p-4 border rounded-lg bg-gray-50/70">
              <h3 className="text-lg font-semibold text-indigo-700">Advanced Configuration</h3>
              
              {/* Lead Database Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-1 flex items-center"><Database className="h-4 w-4 mr-1 text-gray-600" /> Lead Access</h4>
                
                {/* New: Supabase Lead Tables Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Lead Tables (Supabase)</label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                    {availableLeadTables.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No lead tables found. Create tables via Elementor webhook.</p>
                    ) : (
                      <div className="space-y-2">
                        {availableLeadTables.map((table) => (
                          <label key={table.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={(formData.leadTables || []).includes(table.value)}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent event bubbling
                               
                                handleLeadTableToggle(table.value);
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent event bubbling on click too
                              }}
                              disabled={isSubmitting}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{table.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {(formData.leadTables || []).length} table(s). Subscribers will have access to leads from these tables.
                  </p>
                  {formData.leadTables && formData.leadTables.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">Selected Tables:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.leadTables.map(table => (
                          <span key={table} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field Selection for Each Table */}
                {formData.leadTables && formData.leadTables.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Configure Fields for Each Table</h5>
                    <div className="space-y-4">
                      {formData.leadTables.map(tableName => {
                        const availableFields = tableFieldsData[tableName] || [];
                        const selectedFields = formData.leadTableFields[tableName] || [];
                        
                        return (
                          <div key={tableName} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-800 flex items-center">
                                <Database className="h-4 w-4 mr-2 text-indigo-600" />
                                {tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h6>
                              <button
                                type="button"
                                onClick={() => {
                                  // Select all fields
                                  setFormData(prev => ({
                                    ...prev,
                                    leadTableFields: {
                                      ...prev.leadTableFields,
                                      [tableName]: availableFields.length === selectedFields.length ? [] : availableFields
                                    }
                                  }));
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                disabled={isSubmitting || availableFields.length === 0}
                              >
                                {selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            
                            {availableFields.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">Loading fields...</p>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                                  {availableFields.map(field => (
                                    <label key={field} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                                      <input
                                        type="checkbox"
                                        checked={selectedFields.includes(field)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const isChecked = e.target.checked;
                                          setFormData(prev => ({
                                            ...prev,
                                            leadTableFields: {
                                              ...prev.leadTableFields,
                                              [tableName]: isChecked
                                                ? [...selectedFields, field]
                                                : selectedFields.filter(f => f !== field)
                                            }
                                          }));
                                        }}
                                        disabled={isSubmitting}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                      <span className="text-gray-700">{field}</span>
                                    </label>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {selectedFields.length === 0 ? (
                                    <span className="text-amber-600 font-medium">⚠️ No fields selected - subscribers will see all fields</span>
                                  ) : (
                                    <span>Selected {selectedFields.length} of {availableFields.length} fields</span>
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
              
              {/* HTML Content */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 border-b pb-1 flex items-center"><FileText className="h-4 w-4 mr-1 text-gray-600" /> Member Content (HTML)</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content iFrame HTML</label>
                  <textarea name="htmlContent" value={formData.htmlContent} onChange={handleInputChange} className="input" rows="6" placeholder="Paste your secure member HTML content here (e.g., embedded resource links)." disabled={isSubmitting} />
                  <p className="text-xs text-gray-500 mt-1">This content is shown exclusively to active subscribers of this plan.</p>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 border-b pb-1 flex items-center"><Upload className="h-4 w-4 mr-1 text-gray-600" /> Documents</h4>
                
                <input type="file" onChange={handleFileChange} className="input file:btn-secondary file:border-0 file:mr-4 file:py-1 file:px-3" multiple accept=".pdf,.xlsx,.xls,.csv,.doc,.docx" disabled={isSubmitting} />
                <p className="text-xs text-gray-500">
                  Current Files: {plan?.documents?.length || 0} existing. Uploading new files will **replace** existing documents (API dependent).
                </p>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    **New Files to Upload:**
                    <ul className="list-disc pl-5">
                      {selectedFiles.map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* WordPress Protected Content URLs */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 border-b pb-1 flex items-center">
                  <svg className="h-4 w-4 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Protected Content (WordPress)
                </h4>
                
                <div className="space-y-3">
                  {(formData.contentUrls || []).map((content, index) => (
                    <div key={content.id || index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">Content #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newContentUrls = formData.contentUrls.filter((_, i) => i !== index);
                            setFormData({ ...formData, contentUrls: newContentUrls });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={content.title || ''}
                            onChange={(e) => {
                              const newContentUrls = [...formData.contentUrls];
                              newContentUrls[index] = { ...content, title: e.target.value };
                              setFormData({ ...formData, contentUrls: newContentUrls });
                            }}
                            className="input text-sm"
                            placeholder="e.g., Module 1: Introduction"
                            disabled={isSubmitting}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                          <input
                            type="number"
                            value={content.order || index + 1}
                            onChange={(e) => {
                              const newContentUrls = [...formData.contentUrls];
                              newContentUrls[index] = { ...content, order: parseInt(e.target.value) || index + 1 };
                              setFormData({ ...formData, contentUrls: newContentUrls });
                            }}
                            className="input text-sm"
                            min="1"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">WordPress URL</label>
                        <input
                          type="url"
                          value={content.url || ''}
                          onChange={(e) => {
                            const newContentUrls = [...formData.contentUrls];
                            newContentUrls[index] = { ...content, url: e.target.value };
                            setFormData({ ...formData, contentUrls: newContentUrls });
                          }}
                          className="input text-sm"
                          placeholder="https://yourwordpress.com/protected-page"
                          disabled={isSubmitting}
                        />
                        {content.url && (content.url.includes('linkedin.com') || content.url.includes('facebook.com') || content.url.includes('instagram.com') || content.url.includes('twitter.com')) && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            ⚠️ Warning: Social media URLs (LinkedIn, Facebook, etc.) may not work. Please use WordPress pages instead.
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">WordPress Password (Optional)</label>
                        <input
                          type="text"
                          value={content.password || ''}
                          onChange={(e) => {
                            const newContentUrls = [...formData.contentUrls];
                            newContentUrls[index] = { ...content, password: e.target.value };
                            setFormData({ ...formData, contentUrls: newContentUrls });
                          }}
                          className="input text-sm font-mono"
                          placeholder="Leave empty if page is not password-protected"
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {content.password && content.password.trim() !== '' 
                            ? '🔒 Password-protected: Set this password in WordPress (Edit Page → Visibility → Password Protected)'
                            : '🌐 Public page: Leave empty if the WordPress page is not password-protected'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description (Optional)</label>
                        <textarea
                          value={content.description || ''}
                          onChange={(e) => {
                            const newContentUrls = [...formData.contentUrls];
                            newContentUrls[index] = { ...content, description: e.target.value };
                            setFormData({ ...formData, contentUrls: newContentUrls });
                          }}
                          className="input text-sm"
                          rows="2"
                          placeholder="Brief description of this content"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = {
                        id: `content-${Date.now()}`,
                        title: '',
                        url: '',
                        password: '',
                        description: '',
                        order: (formData.contentUrls || []).length + 1
                      };
                      setFormData({
                        ...formData,
                        contentUrls: [...(formData.contentUrls || []), newContent]
                      });
                    }}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                    disabled={isSubmitting}
                  >
                    + Add Protected Content URL
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>How it works:</strong> Create password-protected pages in WordPress, then add their URLs here. 
                    Subscribers will access content through your SaaS app without seeing the password.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700">Settings</h3>
              
              <div className="flex items-center">
                <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" disabled={isSubmitting} />
                <label htmlFor="isActive" className="ml-3 block text-base font-medium text-gray-900">
                  Plan is Active
                </label>
                <p className='text-sm text-gray-500 ml-4'>{formData.isActive ? 'Active plans are available for new subscriptions.' : 'Inactive plans are hidden from the public list.'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex items-center"
                disabled={isSubmitting}
              >
                <XCircle className='h-4 w-4 mr-2' /> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Save className='h-4 w-4 mr-2 animate-pulse' /> Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' /> {plan ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default PlanModal;

  // src/pages/Plans/PlanModal.jsx



  // import { useEffect, useState } from 'react';
  // import { X } from 'lucide-react';

  // const PlanModal = ({ show, onClose, onSubmit, plan, leadDatabases = [], isSubmitting }) => {
  //   const [form, setForm] = useState({
  //     name: '',
  //     price: '',
  //     leadLimit: '',
  //     description: '',
  //     duration: '',
  //     leadDatabaseId: '', // id of LeadDatabase
  //     features: []
  //   });

  //   const [files, setFiles] = useState([]);

  //   useEffect(() => {
  //     if (plan) {
  //       setForm({
  //         name: plan.name || '',
  //         price: plan.price ?? '',
  //         leadLimit: plan.leadLimit ?? '',
  //         description: plan.description || '',
  //         duration: plan.duration ?? '',
  //         leadDatabaseId: plan.leadDatabaseId ? plan.leadDatabaseId : (plan.leadDatabase?.id || ''),
  //         features: Array.isArray(plan.features)
  //           ? plan.features
  //           : (typeof plan.features === 'string'
  //             ? JSON.parse(plan.features || '[]')
  //             : (plan.features || []))
  //       });
  //     } else {
  //       setForm({
  //         name: '',
  //         price: '',
  //         leadLimit: '',
  //         description: '',
  //         duration: '',
  //         leadDatabaseId: '',
  //         features: []
  //       });
  //     }
  //     setFiles([]);
  //   }, [plan, show]);

  //   const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  //   const handleFeatureAdd = () => updateField('features', [...form.features, '']);
  //   const handleFeatureChange = (idx, val) => {
  //     const f = [...form.features];
  //     f[idx] = val;
  //     updateField('features', f);
  //   };
  //   const handleFeatureRemove = (idx) => {
  //     const f = [...form.features];
  //     f.splice(idx, 1);
  //     updateField('features', f);
  //   };

  //   const handleFileChange = (e) => {
  //     setFiles(Array.from(e.target.files || []));
  //   };

  //   const submit = async (e) => {
  //     e.preventDefault();
  //     if (!form.name) return alert('Plan name is required');
  //     if (!form.duration) return alert('Plan duration is required');
  //     await onSubmit(form, files);
  //   };

  //   if (!show) return null;

  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
  //       <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 relative">
  //         <button onClick={onClose} className="absolute top-4 right-4">
  //           <X />
  //         </button>

  //         <h2 className="text-xl font-semibold mb-4">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>

  //         <form onSubmit={submit} className="space-y-4">
  //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Name</label>
  //               <input
  //                 className="input"
  //                 value={form.name}
  //                 onChange={e => updateField('name', e.target.value)}
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
  //               <input
  //                 type="number"
  //                 className="input"
  //                 value={form.price}
  //                 onChange={e => updateField('price', e.target.value)}
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Lead limit</label>
  //               <input
  //                 type="number"
  //                 className="input"
  //                 value={form.leadLimit}
  //                 onChange={e => updateField('leadLimit', e.target.value)}
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-1">
  //                 Duration (in months)
  //               </label>
  //               <input
  //                 type="number"
  //                 min="1"
  //                 placeholder="Enter plan duration (e.g., 1, 3, 6)"
  //                 value={form.duration || ''}
  //                 onChange={e => updateField('duration', e.target.value)}
  //                 className="input"
  //                 required
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Linked Lead Database</label>
  //               <select
  //                 className="input"
  //                 value={form.leadDatabaseId}
  //                 onChange={e => updateField('leadDatabaseId', e.target.value)}
  //               >
  //                 <option value="">-- Select Database --</option>
  //                 {leadDatabases.map(db => (
  //                   <option key={db.id} value={db.id}>
  //                     {db.name}
  //                   </option>
  //                 ))}
  //               </select>
  //             </div>
  //           </div>

  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Description</label>
  //             <textarea
  //               className="input"
  //               rows="3"
  //               value={form.description}
  //               onChange={e => updateField('description', e.target.value)}
  //             />
  //           </div>

  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
  //             <div className="space-y-2">
  //               {form.features.map((f, idx) => (
  //                 <div key={idx} className="flex gap-2">
  //                   <input
  //                     className="input flex-1"
  //                     value={f}
  //                     onChange={e => handleFeatureChange(idx, e.target.value)}
  //                   />
  //                   <button
  //                     type="button"
  //                     className="btn btn-secondary"
  //                     onClick={() => handleFeatureRemove(idx)}
  //                   >
  //                     Remove
  //                   </button>
  //                 </div>
  //               ))}
  //               <div>
  //                 <button
  //                   type="button"
  //                   onClick={handleFeatureAdd}
  //                   className="btn btn-primary"
  //                 >
  //                   + Add feature
  //                 </button>
  //               </div>
  //             </div>
  //           </div>

  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Upload documents (optional)</label>
  //             <input type="file" multiple onChange={handleFileChange} />
  //             {files.length > 0 && (
  //               <p className="text-sm text-gray-600 mt-1">{files.length} file(s) selected</p>
  //             )}
  //           </div>

  //           <div className="flex justify-end gap-2">
  //             <button
  //               type="button"
  //               className="btn btn-secondary"
  //               onClick={onClose}
  //               disabled={isSubmitting}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               className="btn btn-primary"
  //               disabled={isSubmitting}
  //             >
  //               {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     </div>
  //   );
  // };

  // export default PlanModal;
