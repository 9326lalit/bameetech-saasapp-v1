// src/pages/Plans/PlanList.jsx
import React from 'react';

const PlanList = ({ plans = [], onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <table className="min-w-full text-left">
        <thead>
          <tr>
            <th className="py-2 px-3">Name</th>
            <th className="py-2 px-3">Price</th>
            <th className="py-2 px-3">Lead Limit</th>
            <th className="py-2 px-3">Lead Database</th>
            <th className="py-2 px-3">Features</th>
            <th className="py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr key={plan.id} className="border-t">
              <td className="py-3 px-3">{plan.name}</td>
              <td className="py-3 px-3">{plan.price ?? '-'}</td>
              <td className="py-3 px-3">{plan.leadLimit ?? '-'}</td>
              <td className="py-3 px-3">{plan.LeadDatabase?.name || plan.leadDatabaseName || '-'}</td>
              <td className="py-3 px-3">
                {(() => {
let features = [];
if (typeof plan.features === 'string') {
  try {
    features = JSON.parse(plan.features);
  } catch {
    // fallback for plain text
    features = plan.features.split(',').map(f => f.trim());
  }
} else {
  features = plan.features || [];
}
                  return features.length === 0 ? <span className="text-sm text-gray-500">No features</span> : (
                    <ul className="list-disc ml-4">
                      {features.map((f, i) => <li key={i} className="text-sm">{f}</li>)}
                    </ul>
                  );
                })()}
              </td>
              <td className="py-3 px-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(plan)} className="btn btn-secondary">Edit</button>
                  <button onClick={() => onDelete(plan.id)} className="btn btn-primary">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanList;
