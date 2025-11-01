import { format } from 'date-fns';
import { TrendingUp, Calendar } from 'lucide-react';

// Reusable component to display the recent payments
const RecentPaymentsTable = ({ payments }) => (
    <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" /> Recent Payments (Top 10)
        </h2>
        {payments.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Payment ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Plan</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">User Info</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                        {/* Payments are already sorted (newest first) in the parent component. */}
                        {payments.slice(0, 10).map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                {/* Truncate Payment ID */}
                                <td className="px-4 py-2 truncate max-w-[100px] font-medium">{payment.id.substring(0, 8)}...</td>
                                {/* Convert amount from paise (smallest unit) to INR and format */}
                                <td className="px-4 py-2 font-semibold text-green-700">
                                    ₹{((payment.amount || 0) / 100).toLocaleString('en-IN')}
                                </td>
                                {/* Access plan name from notes/metadata */}
                                <td className="px-4 py-2">{payment.notes?.plan_name || 'N/A'}</td>
                                {/* Display email or contact if available */}
                                <td className="px-4 py-2 truncate max-w-[150px]">{payment.email || payment.contact || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {/* Convert Unix timestamp (seconds) to Date object (milliseconds) */}
                                    {format(new Date(payment.created_at * 1000), 'dd/MM/yyyy HH:mm')}
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-white text-xs font-medium capitalize ${
                                            payment.status === 'captured' ? 'bg-green-500' : 
                                            payment.status === 'created' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    >
                                        {payment.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-12 text-gray-500">
                <p>No payments yet. Transactions will appear here when users subscribe.</p>
            </div>
        )}
    </div>
);
