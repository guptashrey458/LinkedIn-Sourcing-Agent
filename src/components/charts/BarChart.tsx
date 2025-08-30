import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BaseChart, { BaseChartProps } from './BaseChart';

export interface BarChartProps extends Omit<BaseChartProps, 'children'> {
  dataKey: string;
  xAxisKey: string;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  orientation?: 'horizontal' | 'vertical';
  multiple?: {
    dataKey: string;
    color: string;
    name?: string;
  }[];
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  color = '#3B82F6',
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  orientation = 'vertical',
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
      <RechartsBarChart
        data={data}
        layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        
        {orientation === 'horizontal' ? (
          <>
            <XAxis type="number" stroke="#6B7280" />
            <YAxis type="category" dataKey={xAxisKey} stroke="#6B7280" />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
          </>
        )}
        
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        
        {multiple ? (
          multiple.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.color}
              name={bar.name || bar.dataKey}
              radius={[2, 2, 0, 0]}
            />
          ))
        ) : (
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[2, 2, 0, 0]}
          />
        )}
      </RechartsBarChart>
    </BaseChart>
  );
};

export default BarChart;