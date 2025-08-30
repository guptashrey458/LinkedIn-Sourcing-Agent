import React, { useState } from 'react';
import { 
  Activity, 
  History, 
  BarChart3, 
  Play,
  Settings
} from 'lucide-react';
import { 
  PipelineMonitor, 
  PipelineHistory, 
  PipelineAnalytics 
} from '../../components/pipeline';
import { Button, Card, Badge } from '../../components/ui';

type TabType = 'monitor' | 'history' | 'analytics';

const Pipeline: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');
  
  const tabs = [
    {
      id: 'monitor' as TabType,
      label: 'Live Monitor',
      icon: <Activity className="w-4 h-4" />,
      description: 'Real-time pipeline monitoring'
    },
    {
      id: 'history' as TabType,
      label: 'History',
      icon: <History className="w-4 h-4" />,
      description: 'Pipeline execution history'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Performance metrics and insights'
    }
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitor':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pipeline Monitor
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor active pipelines in real-time
                </p>
              </div>
              <Button
                variant="primary"
                icon={<Play className="w-4 h-4" />}
              >
                Start New Pipeline
              </Button>
            </div>
            <PipelineMonitor 
              realTime={true}
              onError={(error) => {
                console.error('Pipeline error:', error);
                // Handle error notification
              }}
              onStageComplete={(stage) => {
                console.log('Stage completed:', stage);
                // Handle stage completion notification
              }}
            />
          </div>
        );
        
      case 'history':
        return (
          <PipelineHistory />
        );
        
      case 'analytics':
        return (
          <PipelineAnalytics />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pipeline Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor, analyze, and manage your LinkedIn sourcing pipelines
              </p>
            </div>
            <Button
              variant="outline"
              icon={<Settings className="w-4 h-4" />}
            >
              Settings
            </Button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <Card className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'monitor' && (
                    <Badge variant="info" size="sm">Live</Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </Card>
        
        {/* Tab Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;