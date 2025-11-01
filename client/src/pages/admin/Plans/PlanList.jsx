// src/pages/Plans/PlanList.jsx
import { Edit, Trash2, Check, X, DollarSign, Calendar, Database, FileText, Zap } from 'lucide-react';

const PlanList = ({ plans, onEdit, onDelete }) => {
    // Utility for formatting currency (assuming INR/₹)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => {
                // Safely convert leadDatabaseId to string for display, or default to an empty string
                const dbIdString = plan.leadDatabaseId ? String(plan.leadDatabaseId) : '';
                const displayDbId = dbIdString.length > 5 
                    ? `${dbIdString.substring(0, 5)}...` // Use substring if it's long
                    : dbIdString; // Use full ID if it's short or empty

                return (
                    <div key={plan.id} className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5">
                        
                        {/* Header & Status (Lines 9-22) - No change needed here */}
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                                <Zap className="h-6 w-6 text-indigo-500" />
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                                plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Price & Duration (Lines 24-33) - No change needed here */}
                        <div className="mb-4">
                            <div className="flex items-baseline space-x-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(plan.price)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 mt-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-medium">{plan.duration} days</span>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-5 text-sm">{plan.description}</p>
                        
                        {/* Features List (Lines 38-54) - No change needed here */}
                        <div className="mb-6 flex-grow">
                            <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">Key Features:</h4>
                            <ul className="space-y-2">
                                {Array.isArray(plan.features) && plan.features.length > 0 ? (
                                    plan.features.slice(0, 5).map((feature, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <Check className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 italic text-sm">No features defined.</li>
                                )}
                            </ul>
                        </div>
                        
                        {/* Lead/Content Footer - FIX APPLIED HERE */}
                        <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-2">
                            <div className="flex items-center">
                                <Database className="h-4 w-4 mr-2 text-blue-500" />
                                {/* CORRECTED LINE */}
                                <span>Leads: {plan.leadDatabaseId ? `${plan.leadLimit || 'Unlimited'} from DB ${displayDbId}` : 'No lead access'}</span>
                            </div>
                            <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-purple-500" />
                                <span>Content: {plan.htmlContent ? 'Custom HTML Provided' : 'No Custom Content'}</span>
                            </div>
                        </div>

                        {/* Actions (Lines 72-88) - No change needed here */}
                        <div className="flex space-x-3 pt-6 border-t mt-6 border-gray-200">
                            <button
                                onClick={() => onEdit(plan)}
                                className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex-1 flex items-center justify-center text-sm"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(plan.id)}
                                className="btn bg-red-50 text-red-600 hover:bg-red-100 flex-1 flex items-center justify-center text-sm"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default PlanList;