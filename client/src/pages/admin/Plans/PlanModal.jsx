import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const PlanModal = ({ show, onClose, onSubmit, plan, leadDatabases = [], isSubmitting }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    leadLimit: '',
    description: '',
    duration: '',
    leadDatabaseId: '', // id of LeadDatabase
    features: []
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name || '',
        price: plan.price ?? '',
        leadLimit: plan.leadLimit ?? '',
        description: plan.description || '',
        duration: plan.duration ?? '',
        leadDatabaseId: plan.leadDatabaseId ? plan.leadDatabaseId : (plan.leadDatabase?.id || ''),
        features: Array.isArray(plan.features)
          ? plan.features
          : (typeof plan.features === 'string'
            ? JSON.parse(plan.features || '[]')
            : (plan.features || []))
      });
    } else {
      setForm({
        name: '',
        price: '',
        leadLimit: '',
        description: '',
        duration: '',
        leadDatabaseId: '',
        features: []
      });
    }
    setFiles([]);
  }, [plan, show]);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFeatureAdd = () => updateField('features', [...form.features, '']);
  const handleFeatureChange = (idx, val) => {
    const f = [...form.features];
    f[idx] = val;
    updateField('features', f);
  };
  const handleFeatureRemove = (idx) => {
    const f = [...form.features];
    f.splice(idx, 1);
    updateField('features', f);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert('Plan name is required');
    if (!form.duration) return alert('Plan duration is required');
    await onSubmit(form, files);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lead limit</label>
              <input
                type="number"
                className="input"
                value={form.leadLimit}
                onChange={e => updateField('leadLimit', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (in months)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter plan duration (e.g., 1, 3, 6)"
                value={form.duration || ''}
                onChange={e => updateField('duration', e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Linked Lead Database</label>
              <select
                className="input"
                value={form.leadDatabaseId}
                onChange={e => updateField('leadDatabaseId', e.target.value)}
              >
                <option value="">-- Select Database --</option>
                {leadDatabases.map(db => (
                  <option key={db.id} value={db.id}>
                    {db.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="input"
              rows="3"
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="space-y-2">
              {form.features.map((f, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={f}
                    onChange={e => handleFeatureChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleFeatureRemove(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  onClick={handleFeatureAdd}
                  className="btn btn-primary"
                >
                  + Add feature
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Upload documents (optional)</label>
            <input type="file" multiple onChange={handleFileChange} />
            {files.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">{files.length} file(s) selected</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanModal;
