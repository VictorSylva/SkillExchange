import React from 'react';

const Card = ({ 
  children, 
  className = '',
  padding = 'default',
  hover = true,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-5',
    default: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClass = hover ? 'card-hover' : '';
  
  const classes = `
    bg-white rounded-2xl shadow-soft border border-gray-100
    transition-all duration-300 ease-in-out
    ${paddingClasses[padding]}
    ${hoverClass}
    ${className}
  `;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-100 pb-5 mb-5 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-semibold text-gray-900 leading-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`text-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-100 pt-5 mt-5 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
