import BameeTechLogo from '../assets/Bamee-Tech-Logo-Menu.png';

const Logo = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20',
  };

  return (
    <img 
      src={BameeTechLogo} 
      alt="BameeTech Logo" 
      className={`w-auto object-contain ${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
