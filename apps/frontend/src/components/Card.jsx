// reusable card component
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        rounded-2xl 
        shadow-sm hover:shadow-md
        border border-gray-100 dark:border-gray-700
        transition-shadow duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
