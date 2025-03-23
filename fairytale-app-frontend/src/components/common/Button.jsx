import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false,
  className = '',
  fullWidth = false
}) => {
  const getButtonClass = () => {
    const baseClass = "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none";
    const widthClass = fullWidth ? "w-full" : "";
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-90";
    
    let variantClass = "";
    switch (variant) {
      case 'primary':
        variantClass = "bg-primary text-white";
        break;
      case 'secondary':
        variantClass = "bg-secondary text-white";
        break;
      case 'accent':
        variantClass = "bg-accent text-white";
        break;
      case 'outline':
        variantClass = "bg-transparent border border-primary text-primary hover:bg-primary hover:bg-opacity-10";
        break;
      default:
        variantClass = "bg-primary text-white";
    }
    
    return `${baseClass} ${variantClass} ${widthClass} ${disabledClass} ${className}`;
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={getButtonClass()}
    >
      {children}
    </button>
  );
};

export default Button;