export const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-12 w-full rounded-xl',
  };

  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700 
        rounded 
        animate-pulse
        ${variants[variant]}
        ${className}
      `}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="default" />
    </div>
  );
};
