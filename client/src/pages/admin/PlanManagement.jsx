// src/pages/PlanManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../../services/api';
import { Plus, Loader2 } from 'lucide-react';
import Layout from '../../components/Layout';
import PlanModal from './Plans/PlanModal';
import PlanList from './Plans/PlanList';

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plansRes = await getAllPlans();
      const plansData = plansRes?.data || [];
      setPlans(plansData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load plans. Please check the API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (plan) => {
    // make sure features is an array when passing to modal
    const prepared = {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : plan.features || []
    };
    setCurrentPlan(prepared);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    try {
      await deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan.');
    }
  };

  const handleModalSubmit = async (formData, files) => {
    setIsSubmitting(true);
    setError(null);


    // Build FormData for file upload / multipart endpoints
    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'features' || key === 'leadTables' || key === 'contentUrls') {
        // Serialize arrays as JSON
        dataToSend.append(key, JSON.stringify(value || []));
      } else if (key === 'leadDatabaseIds' || key === 'selectedFields' || key === 'leadLimits' || key === 'leadTableFields') {
        // Serialize complex objects/arrays as JSON
        dataToSend.append(key, JSON.stringify(value || (key === 'leadDatabaseIds' ? [] : {})));
      } else {
        dataToSend.append(key, value ?? '');
      }
    });
    
    // append files if present
    (files || []).forEach(file => dataToSend.append('documents', file));

  

    try {
      if (currentPlan) {
        await updatePlan(currentPlan.id, dataToSend);
      } else {
        await createPlan(dataToSend);
      }
      setShowModal(false);
      setCurrentPlan(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(`Failed to save plan: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Plan Management">
      <style>{`
        .input { @apply block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 p-3; }
        .btn { @apply px-4 py-2 rounded-lg font-medium shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed; }
        .btn-primary { @apply bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500; }
        .btn-secondary { @apply bg-gray-200 text-gray-800 hover:bg-gray-300; }
      `}</style>

      <div className="space-y-8 p-6 bg-gray-50 min-h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Subscription Plans 💎</h1>
            <p className="text-gray-600 mt-1">Create, configure, and manage subscription tiers for your service.</p>
          </div>
          <button
            onClick={() => { setCurrentPlan(null); setShowModal(true); }}
            className="btn btn-primary flex items-center min-w-[180px] justify-center"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Plan
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-gray-600 ml-3 text-lg">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-medium text-gray-700">No Plans Created Yet</h3>
            <p className="mt-1 text-gray-500">Get started by clicking 'Add New Plan' above.</p>
          </div>
        ) : (
          <PlanList plans={plans} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        <PlanModal
          show={showModal}
          onClose={() => { setShowModal(false); setCurrentPlan(null); setError(null); }}
          onSubmit={handleModalSubmit}
          plan={currentPlan}
          isSubmitting={isSubmitting}
        />
      </div>
    </Layout>
  );
};

export default PlanManagement;  
