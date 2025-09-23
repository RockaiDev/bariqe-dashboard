import type { LucideIcon } from "lucide-react";
import * as React from "react";

interface DashCardProps {
  title?: string;
  value?: string | number;
  change?: string;
  period?: string;
  changeColor?: string;
  icon?: LucideIcon;
  bgIcon?: string; // This should be the full Tailwind class, e.g., 'bg-blue-500' or 'bg-[#0D52F2]'
}

export default function DashCard({
  title,
  value,
  change,
  period,
  icon,
  changeColor = 'text-gray-500',
  bgIcon = 'bg-gray-500', // Default full background class
}: DashCardProps) {
  return (
    <div className="flex flex-col items-start p-5 bg-white rounded-lg shadow-sm border border-gray-200">
      {icon && (
        <div className={`mb-3 p-2 rounded-md flex items-center justify-center ${bgIcon}`}>
          {React.createElement(icon, { className: "h-5 w-5 text-white" })}
        </div>
      )}
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {change && period && (
        <p className="text-xs text-gray-400 mt-2">
          <span className={`font-semibold ${changeColor}`}>{change}</span>
          <span> {period}</span>
        </p>
      )}
    </div>
  );
}