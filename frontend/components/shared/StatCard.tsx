import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray';
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    trend: 'text-gray-600',
  },
};

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue',
  onClick,
}: StatCardProps) {
  const colors = colorClasses[color];
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };
  
  const TrendIcon = getTrendIcon();

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>
      <div className="text-gray-600 text-sm">{title}</div>
      {trend && (
        <div className="text-xs text-gray-500 mt-2">{trend.label}</div>
      )}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}
