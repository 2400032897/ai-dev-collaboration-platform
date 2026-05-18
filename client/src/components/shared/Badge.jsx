export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-500/20 text-gray-400',
    primary: 'bg-primary-500/20 text-primary-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    P0: 'bg-red-500/20 text-red-400 border border-red-500/30',
    P1: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    P2: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    todo: 'bg-gray-500/20 text-gray-400',
    inprogress: 'bg-blue-500/20 text-blue-400',
    inreview: 'bg-amber-500/20 text-amber-400',
    done: 'bg-green-500/20 text-green-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
