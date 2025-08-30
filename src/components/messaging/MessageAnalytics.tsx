import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  MailOpen, 
  Reply, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Target,
  Clock
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { LineChart, BarChart, PieChart as PieChartComponent } from '../charts';
import { MessageAnalytics as MessageAnalyticsType } from '../../types';

export interface MessageAnalyticsProps {
  analytics: MessageAnalyticsType;
  onExportReport?: () => void;
  onFilterChange?: (filters: AnalyticsFilters) => void;
  className?: string;
}

interface AnalyticsFilters {
  dateRange: string;
  templateId?: string;
  category?: string;
}

const MessageAnalytics: React.FC<MessageAnalyticsProps> = ({
  analytics,
  onExportReport,
  onFilterChange,
  className,
}) => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
  });

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  // Calculate trends (mock calculation for demo)
  const trends = useMemo(() => {
    const previousPeriod = {
      sent: Math.floor(analytics.totalSent * 0.8),
      opened: Math.floor(analytics.totalOpened * 0.75),
      replied: Math.floor(analytics.totalReplied * 0.9),
    };

    return {
      sent: {
        value: analytics.totalSent - previousPeriod.sent,
        percentage: ((analytics.totalSent - previousPeriod.sent) / previousPeriod.sent) * 100,
      },
      opened: {
        value: analytics.totalOpened - previousPeriod.opened,
        percentage: ((analytics.totalOpened - previousPeriod.opened) / previousPeriod.opened) * 100,
      },
      replied: {
        value: analytics.totalReplied - previousPeriod.replied,
        percentage: ((analytics.totalReplied - previousPeriod.replied) / previousPeriod.replied) * 100,
      },
    };
  }, [analytics]);

  // Prepare chart data
  const timeSeriesData = analytics.timeSeriesData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Messages Sent': item.sent,
    'Messages Opened': item.opened,
    'Messages Replied': item.replied,
  }));

  const templatePerformanceData = analytics.templatePerformance.map(template => ({
    name: template.templateName,
    'Open Rate': Math.round(template.openRate * 100),
    'Response Rate': Math.round(template.responseRate * 100),
    'Messages Sent': template.sent,
  }));

  const engagementData = [
    { name: 'Delivered', value: analytics.totalDelivered, color: '#10B981' },
    { name: 'Opened', value: analytics.totalOpened, color: '#3B82F6' },
    { name: 'Replied', value: analytics.totalReplied, color: '#8B5CF6' },
    { name: 'Bounced', value: Math.floor(analytics.totalSent * (analytics.bounceRate / 100)), color: '#EF4444' },
  ];

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    trend, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    trend?: { value: number; percentage: number };
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center",
          color === 'blue' && "bg-blue-100",
          color === 'green' && "bg-green-100",
          color === 'purple' && "bg-purple-100",
          color === 'red' && "bg-red-100"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            color === 'blue' && "text-blue-600",
            color === 'green' && "text-green-600",
            color === 'purple' && "text-purple-600",
            color === 'red' && "text-red-600"
          )} />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
          {trend.percentage >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={cn(
            "text-sm font-medium",
            trend.percentage >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend.percentage >= 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">
            ({trend.value >= 0 ? '+' : ''}{trend.value})
          </span>
        </div>
      )}
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Message Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track the performance of your outreach campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={filters.dateRange}
            onChange={(value) => handleFilterChange({ dateRange: value })}
            options={dateRangeOptions}
            className="w-40"
          />
          
          {onExportReport && (
            <Button
              variant="outline"
              onClick={onExportReport}
              icon={<Download className="h-4 w-4" />}
            >
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Messages Sent"
          value={analytics.totalSent.toLocaleString()}
          subtitle="Total outreach messages"
          trend={trends.sent}
          icon={Mail}
          color="blue"
        />
        
        <MetricCard
          title="Open Rate"
          value={`${Math.round(analytics.openRate * 100)}%`}
          subtitle={`${analytics.totalOpened.toLocaleString()} opened`}
          trend={trends.opened}
          icon={MailOpen}
          color="green"
        />
        
        <MetricCard
          title="Response Rate"
          value={`${Math.round(analytics.responseRate * 100)}%`}
          subtitle={`${analytics.totalReplied.toLocaleString()} replied`}
          trend={trends.replied}
          icon={Reply}
          color="purple"
        />
        
        <MetricCard
          title="Delivery Rate"
          value={`${Math.round(analytics.deliveryRate * 100)}%`}
          subtitle={`${analytics.totalDelivered.toLocaleString()} delivered`}
          icon={Target}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Message Activity Over Time</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <LineChart
              data={timeSeriesData}
              xAxisKey="date"
              lines={[
                { key: 'Messages Sent', color: '#3B82F6' },
                { key: 'Messages Opened', color: '#10B981' },
                { key: 'Messages Replied', color: '#8B5CF6' },
              ]}
              height={300}
            />
          </div>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Message Engagement</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            
            <PieChartComponent
              data={engagementData}
              height={300}
            />
          </div>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Template Performance</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analytics.templatePerformance.map((template, index) => (
              <div key={template.templateId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.templateName}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.sent.toLocaleString()} messages sent
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {Math.round(template.openRate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Open Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {Math.round(template.responseRate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Response Rate</div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {template.openRate > 0.3 ? (
                      <Badge variant="success" size="sm">High Performance</Badge>
                    ) : template.openRate > 0.15 ? (
                      <Badge variant="default" size="sm">Average</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Needs Improvement</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(analytics.bounceRate * 100)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-xl font-bold text-gray-900">2.3 days</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(analytics.responseRate * 0.6 * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessageAnalytics;