import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MobileTable = ({ 
  data, 
  columns, 
  renderCell, 
  keyField = 'id',
  className = "",
  showMobileCards = true 
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row[keyField] || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderCell ? renderCell(column.key, row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      {showMobileCards && (
        <div className="lg:hidden space-y-4">
          {data.map((row, index) => {
            const isExpanded = expandedRows.has(row[keyField] || index);
            const primaryColumns = columns.slice(0, 2); // Show first 2 columns by default
            const secondaryColumns = columns.slice(2);

            return (
              <div key={row[keyField] || index} className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Primary Info */}
                <div className="space-y-2">
                  {primaryColumns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                      <span className="text-sm text-gray-900 text-right ml-2 flex-1">
                        {renderCell ? renderCell(column.key, row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expandable Secondary Info */}
                {secondaryColumns.length > 0 && (
                  <>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                            <span className="text-sm text-gray-900 text-right ml-2 flex-1">
                              {renderCell ? renderCell(column.key, row[column.key], row) : row[column.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => toggleRow(row[keyField] || index)}
                      className="mt-3 flex items-center justify-center w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isExpanded ? (
                        <>
                          Show Less <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Show More <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Table (Horizontal Scroll) */}
      {!showMobileCards && (
        <div className="lg:hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '600px' }}>
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={row[keyField] || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-3 text-xs text-gray-900">
                      {renderCell ? renderCell(column.key, row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MobileTable;