// Generates a consistent color from a string
const COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-amber-600',
  'bg-red-600', 'bg-pink-600', 'bg-cyan-600', 'bg-teal-600',
];

function colorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const color = colorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-dark-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center
        font-semibold text-white ring-2 ring-dark-800 flex-shrink-0 ${className}`}
      title={name}
    >
      {initials || '?'}
    </div>
  );
}
