import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DataTable } from '../ui/DataTable';
import { Loading } from '../ui/Loading';
import { IntegrationConfigDialog } from './IntegrationConfigDialog';
import { IntegrationLogs } from './IntegrationLogs';
import { IntegrationConfig, IntegrationLog } from '../../types';
import { integrationService } from '../../services/integrationService';
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  TestTube, 
  Activity,
  AlertCircle,
  Check,
  Clock,
  Sync
} from 'lucide-react';

interface IntegrationDashboardProps {
  className?: string;
}

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({
  className = ''
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setShowConfigDialog(true);
  };

  const handleEditIntegration = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setShowConfigDialog(true);
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      setActionLoading(integrationId);
      await integrationService.deleteIntegration(integrationId);
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to delete integration:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleIntegration = async (integration: IntegrationConfig) => {
    try {
      setActionLoading(integration.id);
      
      if (integration.enabled) {
        await integrationService.disableIntegration(integration.id);
      } else {
        await integrationService.enableIntegration(integration.id);
      }
      
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestIntegration = async (integration: IntegrationConfig) => {
    try {
      setActionLoading(integration.id);
      const result = await integrationService.testIntegration(integration.id);
      
      if (result.success) {
        alert('Integration test successful!');
      } else {
        alert(`Integration test failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncIntegration = async (integration: IntegrationConfig) => {
    try {
      setActionLoading(integration.id);
      const result = await integrationService.bulkSync(integration.id, {
        candidates: [], // Sync all candidates
        jobs: [], // Sync all jobs
        pipelines: [] // Sync all pipelines
      });
      
      const totalSynced = result.candidates.synced + result.jobs.synced + result.pipelines.synced;
      const totalErrors = result.candidates.errors.length + result.jobs.errors.length + result.pipelines.errors.length;
      
      if (totalErrors === 0) {
        alert(`Successfully synced ${totalSynced} records`);
      } else {
        alert(`Synced ${totalSynced} records with ${totalErrors} errors. Check logs for details.`);
      }
    } catch (error) {
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setShowLogsDialog(true);
  };

  const handleSaveIntegration = async (integration: IntegrationConfig) => {
    await loadIntegrations();
    setShowConfigDialog(false);
  };

  const getStatusBadge = (integration: IntegrationConfig) => {
    if (!integration.enabled) {
      return <Badge variant="secondary" size="sm">Disabled</Badge>;
    }

    switch (integration.status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">Error</Badge>;
      case 'inactive':
        return <Badge variant="warning" size="sm">Inactive</Badge>;
      default:
        return <Badge variant="default" size="sm">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'webhook':
        return <Activity className="w-4 h-4" />;
      case 'api':
        return <Sync className="w-4 h-4" />;
      case 'database':
        return <Settings className="w-4 h-4" />;
      case 'file':
        return <Settings className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Integration',
      render: (integration: IntegrationConfig) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(integration.type)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{integration.name}</div>
            <div className="text-sm text-gray-500 capitalize">{integration.type}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (integration: IntegrationConfig) => getStatusBadge(integration)
    },
    {
      key: 'lastSync',
      title: 'Last Sync',
      render: (integration: IntegrationConfig) => (
        <div className="text-sm text-gray-500">
          {integration.lastSync ? (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(integration.lastSync).toLocaleString()}</span>
            </div>
          ) : (
            'Never'
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (integration: IntegrationConfig) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditIntegration(integration)}
            icon={<Settings className="w-3 h-3" />}
            title="Configure"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleIntegration(integration)}
            loading={actionLoading === integration.id}
            icon={integration.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            title={integration.enabled ? 'Disable' : 'Enable'}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTestIntegration(integration)}
            loading={actionLoading === integration.id}
            icon={<TestTube className="w-3 h-3" />}
            title="Test"
            disabled={!integration.enabled}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSyncIntegration(integration)}
            loading={actionLoading === integration.id}
            icon={<Sync className="w-3 h-3" />}
            title="Sync Now"
            disabled={!integration.enabled}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewLogs(integration)}
            icon={<Activity className="w-3 h-3" />}
            title="View Logs"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteIntegration(integration.id)}
            loading={actionLoading === integration.id}
            icon={<Trash2 className="w-3 h-3" />}
            title="Delete"
          />
        </div>
      )
    }
  ];

  const getHealthSummary = () => {
    const total = integrations.length;
    const active = integrations.filter(i => i.enabled && i.status === 'active').length;
    const errors = integrations.filter(i => i.status === 'error').length;
    const disabled = integrations.filter(i => !i.enabled).length;

    return { total, active, errors, disabled };
  };

  const health = getHealthSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-gray-600">
            Manage external system integrations and data synchronization
          </p>
        </div>
        
        <Button
          onClick={handleCreateIntegration}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Integration
        </Button>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{health.total}</p>
            </div>
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{health.active}</p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{health.errors}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-gray-600">{health.disabled}</p>
            </div>
            <Pause className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Integrations Table */}
      <Card>
        {loading ? (
          <div className="p-8">
            <Loading size="lg" text="Loading integrations..." />
          </div>
        ) : (
          <DataTable
            data={integrations}
            columns={columns}
            loading={loading}
          />
        )}
      </Card>

      {/* Configuration Dialog */}
      <IntegrationConfigDialog
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        integration={selectedIntegration}
        onSave={handleSaveIntegration}
      />

      {/* Logs Dialog */}
      {selectedIntegration && (
        <IntegrationLogs
          isOpen={showLogsDialog}
          onClose={() => setShowLogsDialog(false)}
          integration={selectedIntegration}
        />
      )}
    </div>
  );
};