import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BaseChart, { BaseChartProps } from './BaseChart';

export interface LineChartProps extends Omit<BaseChartProps, 'children'> {
  dataKey: string;
  xAxisKey: string;
  color?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showDots?: boolean;
  curved?: boolean;
  multiple?: {
    dataKey: string;
    color: string;
    name?: string;
    strokeWidth?: number;
  }[];
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  color = '#3B82F6',
  strokeWidth = 2,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  showDots = true,
  curved = true,
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
      <RechartsLineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis dataKey={xAxisKey} stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        
        {multiple ? (
          multiple.map((line, index) => (
            <Line
              key={index}
              type={curved ? 'monotone' : 'linear'}
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || strokeWidth}
              name={line.name || line.dataKey}
              dot={showDots}
              activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
            />
          ))
        ) : (
          <Line
            type={curved ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={showDots}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        )}
      </RechartsLineChart>
    </BaseChart>
  );
};

export default LineChart;