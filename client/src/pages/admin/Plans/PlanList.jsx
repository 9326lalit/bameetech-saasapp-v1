// src/pages/Plans/PlanList.jsx
import React from 'react';
import ReadMore from '../../../components/ReadMore';

const PlanList = ({ plans = [], onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto p-4">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Lead Limit</th>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Lead Database</th>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Features</th>
              <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-3 font-medium">{plan.name}</td>
                <td className="py-3 px-3">₹{plan.price ?? '-'}</td>
                <td className="py-3 px-3">{plan.leadLimit ?? '-'}</td>
                <td className="py-3 px-3">{plan.LeadDatabase?.name || plan.leadDatabaseName || '-'}</td>
                <td className="py-3 px-3">
                  {(() => {
                    let features = [];
                    if (typeof plan.features === 'string') {
                      try {
                        features = JSON.parse(plan.features);
                      } catch {
                        features = plan.features.split(',').map(f => f.trim());
                      }
                    } else {
                      features = plan.features || [];
                    }
                    return features.length === 0 ? <span className="text-sm text-gray-500">No features</span> : (
                      <ul className="list-disc ml-4">
                        {features.slice(0, 2).map((f, i) => <li key={i} className="text-sm">{f}</li>)}
                        {features.length > 2 && <li className="text-sm text-gray-500">+{features.length - 2} more</li>}
                      </ul>
                    );
                  })()}
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(plan)} className="btn btn-secondary text-sm">Edit</button>
                    <button onClick={() => onDelete(plan.id)} className="btn btn-danger text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-gray-200">
        {plans.map(plan => {
          let features = [];
          if (typeof plan.features === 'string') {
            try {
              features = JSON.parse(plan.features);
            } catch {
              features = plan.features.split(',').map(f => f.trim());
            }
          } else {
            features = plan.features || [];
          }

          return (
            <div key={plan.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                <span className="text-lg font-bold text-blue-600">₹{plan.price ?? '-'}</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lead Limit:</span>
                  <span className="font-medium">{plan.leadLimit ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Database:</span>
                  <span className="font-medium truncate ml-2">{plan.LeadDatabase?.name || plan.leadDatabaseName || '-'}</span>
                </div>
              </div>

              {features.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500 block mb-2">Features:</span>
                  <ReadMore maxLength={100} className="text-sm text-gray-700">
                    {features.join(', ')}
                  </ReadMore>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(plan)} 
                  className="flex-1 mobile-button btn btn-secondary text-center"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(plan.id)} 
                  className="flex-1 mobile-button btn btn-danger text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No plans available. Create your first plan to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PlanList;
