import { forwardRef } from 'react';

// Mobile-friendly form input component
export const MobileInput = forwardRef(({ 
  label, 
  error, 
  className = "", 
  containerClassName = "",
  labelClassName = "",
  ...props 
}, ref) => {
  return (
    <div className={`space-y-1 sm:space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input text-base ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

// Mobile-friendly textarea component
export const MobileTextarea = forwardRef(({ 
  label, 
  error, 
  className = "", 
  containerClassName = "",
  labelClassName = "",
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className={`space-y-1 sm:space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`input text-base resize-none ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

MobileTextarea.displayName = 'MobileTextarea';

// Mobile-friendly select component
export const MobileSelect = forwardRef(({ 
  label, 
  error, 
  options = [], 
  placeholder = "Select an option",
  className = "", 
  containerClassName = "",
  labelClassName = "",
  ...props 
}, ref) => {
  return (
    <div className={`space-y-1 sm:space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`input text-base ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

MobileSelect.displayName = 'MobileSelect';

// Mobile-friendly button component
export const MobileButton = ({ 
  children, 
  variant = "primary", 
  size = "md",
  fullWidth = false,
  className = "", 
  ...props 
}) => {
  const baseClasses = "mobile-button font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    danger: "btn-danger",
    success: "btn-success",
    outline: "btn-outline"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-friendly form container
export const MobileForm = ({ 
  children, 
  onSubmit, 
  className = "",
  spacing = "default",
  ...props 
}) => {
  const spacingClasses = {
    tight: "space-y-3",
    default: "space-y-4 sm:space-y-6",
    loose: "space-y-6 sm:space-y-8"
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`${spacingClasses[spacing]} ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

// Mobile-friendly form section
export const MobileFormSection = ({ 
  title, 
  description, 
  children, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};