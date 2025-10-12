import React from 'react';

const SkillTag = ({ 
  skill, 
  variant = 'default', 
  removable = false, 
  onRemove,
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-primary-100 text-primary-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };
  
  const classes = `
    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
    ${variants[variant]}
    ${className}
  `;
  
  return (
    <span className={classes}>
      {skill}
      {removable && (
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
          onClick={() => onRemove && onRemove(skill)}
        >
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
            <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
};

export default SkillTag;
