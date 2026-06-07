import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
  prefix?: string;
  suffix?: string;
  color?: 'orange' | 'teal' | 'blue' | 'purple';
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  growth,
  prefix = '',
  suffix = '',
  color = 'orange',
}: KpiCardProps) {
  const colorClasses = {
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const isPositive = growth !== undefined && growth >= 0;

  return (
    <div className="stat-card animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {growth !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {growth.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400 ml-1">较昨日</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-md`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
