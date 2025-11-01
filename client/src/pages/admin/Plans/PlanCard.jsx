import React from 'react';
import {
  Tag,
  DollarSign,
  Calendar,
  Check,
  X,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';

const PlanCard = ({ plan, onEdit, onDelete }) => {
  let features = [];
  try {
    features = Array.isArray(plan.features)
      ? plan.features
      : JSON.parse(plan.features || '[]');
  } catch (err) {
    console.warn('Invalid features JSON:', plan.features);
    features = [plan.features]; // fallback
  }

  return (
    <div className="card hover:shadow-lg transition-shadow p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
        </div>
        <span
          className={`status-badge ${
            plan.isActive ? 'status-success' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {plan.isActive ? (
            <>
              <Check className="h-3 w-3 mr-1" /> Active
            </>
          ) : (
            <>
              <X className="h-3 w-3 mr-1" /> Inactive
            </>
          )}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600 mt-1">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{plan.duration} days duration</span>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{plan.description}</p>

      {features.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
          <ul className="space-y-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.documents && plan.documents.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-1" /> Documents
          </h4>
          <ul className="text-sm text-gray-600">
            {plan.documents.map((doc, idx) => (
              <li key={idx}>
                • {doc.originalName} ({(doc.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(plan)}
          className="btn btn-secondary flex-1 flex items-center justify-center"
        >
          <Edit className="h-4 w-4 mr-1" /> Edit
        </button>
        <button
          onClick={() => onDelete(plan.id)}
          className="btn btn-danger flex-1 flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
