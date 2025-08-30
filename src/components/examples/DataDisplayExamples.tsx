import React, { useState } from 'react';
import {
  DataTable,
  Badge,
  Tag,
  Loading,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  Button,
  Card
} from '../ui';
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart
} from '../charts';

// Sample data for examples
const sampleTableData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    score: 95,
    joinDate: '2023-01-15'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'inactive',
    score: 87,
    joinDate: '2023-02-20'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Moderator',
    status: 'active',
    score: 92,
    joinDate: '2023-03-10'
  },
];

const sampleChartData = [
  { name: 'Jan', value: 400, users: 240 },
  { name: 'Feb', value: 300, users: 139 },
  { name: 'Mar', value: 200, users: 980 },
  { name: 'Apr', value: 278, users: 390 },
  { name: 'May', value: 189, users: 480 },
];

const samplePieData = [
  { name: 'Active', value: 400 },
  { name: 'Inactive', value: 300 },
  { name: 'Pending', value: 200 },
  { name: 'Suspended', value: 100 },
];

const DataDisplayExamples: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const tableColumns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name' as const,
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email' as const,
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role' as const,
      render: (value: string) => (
        <Badge 
          variant={value === 'Admin' ? 'error' : value === 'Moderator' ? 'warning' : 'default'}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status' as const,
      render: (value: string) => (
        <Tag 
          color={value === 'active' ? 'green' : 'red'}
          variant="filled"
        >
          {value}
        </Tag>
      ),
    },
    {
      key: 'score',
      title: 'Score',
      dataIndex: 'score' as const,
      sortable: true,
      align: 'right' as const,
    },
  ];

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Data Display Components</h1>
      
      {/* DataTable Example */}
      <Card title="DataTable Component" subtitle="Interactive table with sorting, filtering, and pagination">
        <DataTable
          data={sampleTableData}
          columns={tableColumns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: 2,
            total: sampleTableData.length,
            showSizeChanger: true,
            onChange: (page, pageSize) => setCurrentPage(page),
          }}
          selection={{
            selectedRowKeys: selectedRows,
            onChange: (keys, rows) => setSelectedRows(keys),
          }}
          sorting={{
            onChange: (field, direction) => {
              console.log('Sort:', field, direction);
            },
          }}
        />
        
        <div className="mt-4 flex gap-2">
          <Button onClick={handleLoadingDemo}>
            Toggle Loading State
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedRows([])}
          >
            Clear Selection
          </Button>
        </div>
      </Card>

      {/* Charts Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bar Chart" subtitle="Monthly performance data">
          <BarChart
            data={sampleChartData}
            dataKey="value"
            xAxisKey="name"
            color="#3B82F6"
            height={300}
          />
        </Card>

        <Card title="Line Chart" subtitle="User growth over time">
          <LineChart
            data={sampleChartData}
            dataKey="users"
            xAxisKey="name"
            color="#10B981"
            height={300}
          />
        </Card>

        <Card title="Pie Chart" subtitle="User status distribution">
          <PieChart
            data={samplePieData}
            dataKey="value"
            nameKey="name"
            height={300}
          />
        </Card>

        <Card title="Area Chart" subtitle="Revenue trends">
          <AreaChart
            data={sampleChartData}
            dataKey="value"
            xAxisKey="name"
            color="#8B5CF6"
            height={300}
          />
        </Card>
      </div>

      {/* Badge and Tag Examples */}
      <Card title="Badges & Tags" subtitle="Status indicators and labels">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Badges</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="secondary">Secondary</Badge>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              <Tag color="blue">React</Tag>
              <Tag color="green">TypeScript</Tag>
              <Tag color="purple" removable onRemove={() => console.log('Remove tag')}>
                Removable
              </Tag>
              <Tag variant="outline" color="red">Outline</Tag>
              <Tag variant="filled" color="yellow">Filled</Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading States */}
      <Card title="Loading States" subtitle="Different loading indicators">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Spinner</h4>
            <Loading variant="spinner" size="lg" />
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Dots</h4>
            <Loading variant="dots" size="lg" />
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Pulse</h4>
            <Loading variant="pulse" size="lg" />
          </div>
        </div>
      </Card>

      {/* Skeleton Examples */}
      <Card title="Skeleton Loaders" subtitle="Placeholder content while loading">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Card Skeleton</h4>
            <SkeletonCard />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">List Skeleton</h4>
            <SkeletonList items={3} />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Table Skeleton</h4>
            <SkeletonTable rows={3} columns={3} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataDisplayExamples;