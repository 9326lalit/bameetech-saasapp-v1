// src/pages/Plans/PlanModal.jsx
import { useState, useEffect } from 'react';
import { X, Tag, DollarSign, Calendar, Database, FileText, Upload, CheckCircle, Save, XCircle } from 'lucide-react';

const initialFormData = {
  name: '',
  description: '',
  price: '',
  duration: '',
  features: '', // Stored as newline-separated string in form
  leadDatabaseId: '',
  leadLimit: '',
  htmlContent: '',
  isActive: true,
};

const PlanModal = ({ show, onClose, onSubmit, plan, leadDatabases, isSubmitting }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Sync modal state with the plan prop
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || '',
        duration: plan.duration || '',
        // Convert array of features to newline-separated string for textarea
        features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '',
        leadDatabaseId: plan.leadDatabaseId || '',
        leadLimit: plan.leadLimit || '',
        htmlContent: plan.htmlContent || '',
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

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // 1. Process Features String to Array
    const featuresArray = formData.features.split('\n')
        .map(f => f.trim())
        .filter(f => f !== '');

    // 2. Prepare final data object for submission
    const finalFormData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        leadLimit: formData.leadLimit ? parseInt(formData.leadLimit) : null,
        features: featuresArray, // Send as array of strings
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

        <form onSubmit={handleFormSubmit} className="p-6 space-y-8">
          
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead Database</label>
                <select name="leadDatabaseId" value={formData.leadDatabaseId} onChange={handleInputChange} className="input" disabled={isSubmitting}>
                  <option value="">No Database Access</option>
                  {leadDatabases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name} (ID: {db.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Link this plan to a specific lead source.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Limit</label>
                <input type="number" name="leadLimit" value={formData.leadLimit} onChange={handleInputChange} className="input" min="0" placeholder="500" disabled={isSubmitting} />
                <p className="text-xs text-gray-500 mt-1">Max leads accessible (leave empty for unlimited access to the selected database).</p>
              </div>
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
