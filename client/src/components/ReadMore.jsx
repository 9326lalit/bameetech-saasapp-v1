import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ReadMore = ({ 
  children, 
  maxLength = 150, 
  className = "", 
  showLessText = "Show less",
  showMoreText = "Read more",
  expandButtonClassName = "text-blue-600 hover:text-blue-700 font-medium",
  collapseButtonClassName = "text-gray-600 hover:text-gray-700 font-medium"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const text = typeof children === 'string' ? children : '';
  
  if (text.length <= maxLength) {
    return <span className={className}>{children}</span>;
  }

  const displayText = isExpanded ? text : text.slice(0, maxLength) + '...';

  return (
    <div className={className}>
      <span>{displayText}</span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`ml-2 inline-flex items-center text-sm transition-colors ${
          isExpanded ? collapseButtonClassName : expandButtonClassName
        }`}
      >
        {isExpanded ? (
          <>
            {showLessText}
            <ChevronUp className="h-4 w-4 ml-1" />
          </>
        ) : (
          <>
            {showMoreText}
            <ChevronDown className="h-4 w-4 ml-1" />
          </>
        )}
      </button>
    </div>
  );
};

export default ReadMore;