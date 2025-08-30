import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BaseChart, { BaseChartProps } from './BaseChart';

export interface PieChartProps extends Omit<BaseChartProps, 'children'> {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  innerRadius = 0,
  outerRadius = 80,
  startAngle = 90,
  endAngle = -270,
  ...baseProps
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data[nameKey]}</p>
          <p className="text-sm text-gray-600">
            Value: {data[dataKey]}
          </p>
          {data.percentage && (
            <p className="text-sm text-gray-600">
              Percentage: {data.percentage.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calculate percentages for the data
  const total = data.reduce((sum, item) => sum + item[dataKey], 0);
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: (item[dataKey] / total) * 100
  }));

  return (
    <BaseChart data={data} {...baseProps}>
      <RechartsPieChart>
        <Pie
          data={dataWithPercentages}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? CustomLabel : false}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          startAngle={startAngle}
          endAngle={endAngle}
        >
          {dataWithPercentages.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        )}
      </RechartsPieChart>
    </BaseChart>
  );
};

export default PieChart;