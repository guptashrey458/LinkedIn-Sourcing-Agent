import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BaseChart, { BaseChartProps } from './BaseChart';

export interface AreaChartProps extends Omit<BaseChartProps, 'children'> {
  dataKey: string;
  xAxisKey: string;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;
  stacked?: boolean;
  multiple?: {
    dataKey: string;
    color: string;
    name?: string;
    fillOpacity?: number;
  }[];
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  color = '#3B82F6',
  fillOpacity = 0.3,
  strokeWidth = 2,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  curved = true,
  stacked = false,
  multiple,
  ...baseProps
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name || dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <BaseChart data={data} {...baseProps}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          {multiple ? (
            multiple.map((area, index) => (
              <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={area.fillOpacity || fillOpacity} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0} />
              </linearGradient>
            ))
          ) : (
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={fillOpacity} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis dataKey={xAxisKey} stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        
        {multiple ? (
          multiple.map((area, index) => (
            <Area
              key={index}
              type={curved ? 'monotone' : 'linear'}
              dataKey={area.dataKey}
              stackId={stacked ? '1' : undefined}
              stroke={area.color}
              fill={`url(#gradient-${index})`}
              strokeWidth={strokeWidth}
              name={area.name || area.dataKey}
            />
          ))
        ) : (
          <Area
            type={curved ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={color}
            fill="url(#gradient)"
            strokeWidth={strokeWidth}
          />
        )}
      </RechartsAreaChart>
    </BaseChart>
  );
};

export default AreaChart;