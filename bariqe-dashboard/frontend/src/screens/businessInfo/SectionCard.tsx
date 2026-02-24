import React from 'react';
import { type LucideIcon } from 'lucide-react';

type SectionCardVariant = 'default' | 'elevated' | 'bordered' | 'flat';

type Props = {
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: SectionCardVariant;
  className?: string;
  headerAction?: React.ReactNode;
  description?: string;
}

export default function SectionCard({ 
  title, 
  children, 
  icon: Icon,
  variant = 'default',
  className = '',
  headerAction,
  description
}: Props) {

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300';
      case 'bordered':
        return 'bg-white border-2 border-gray-200 hover:border-primary/30 transition-colors duration-200';
      case 'flat':
        return 'bg-gray-50 border border-gray-100';
      default:
        return 'bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200';
    }
  };

  return (
    <section className={`
      ${getVariantStyles()}
      rounded-lg overflow-hidden
      ${className}
    `}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            {Icon && (
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-500 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {headerAction && (
            <div className="flex items-center space-x-2 space-x-reverse">
              {headerAction}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="app-container text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

// مكون مساعد للأكشن السريعة
export function SectionCardAction({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      {children}
    </div>
  );
}

// مكون للإحصائيات السريعة
export function SectionCardStats({ 
  stats 
}: { 
  stats: { label: string; value: string | number; color?: string }[] 
}) {
  return (
    <div className="flex items-center space-x-6 space-x-reverse text-sm">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-2 h-2 rounded-full ${stat.color || 'bg-primary'}`} />
          <span className="text-gray-500">{stat.label}:</span>
          <span className="font-medium text-gray-900">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}