import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Users, 
  Template, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  X,
  Plus,
  Edit3,
  Eye,
  Clock,
  User,
  Mail
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import DataTable from '../ui/DataTable';
import { 
  Candidate, 
  MessageTemplate, 
  BulkMessageRequest, 
  JobDescription 
} from '../../types';
import MessageEditor from './MessageEditor';
import MessagePreview from './MessagePreview';

export interface BulkMessageInterfaceProps {
  candidates: Candidate[];
  templates: MessageTemplate[];
  jobs?: JobDescription[];
  onSendBulkMessage?: (request: BulkMessageRequest) => void;
  onPreviewMessage?: (candidateId: string, template: MessageTemplate) => void;
  className?: string;
}

interface CandidateCustomization {
  candidateId: string;
  variables: Record<string, string>;
  excluded: boolean;
  preview?: string;
}

const BulkMessageInterface: React.FC<BulkMessageInterfaceProps> = ({
  candidates,
  templates,
  jobs = [],
  onSendBulkMessage,
  onPreviewMessage,
  className,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [customizations, setCustomizations] = useState<Record<string, CandidateCustomization>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewCandidateId, setPreviewCandidateId] = useState<string>('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string>('');

  // Initialize customizations for all candidates
  React.useEffect(() => {
    const initialCustomizations: Record<string, CandidateCustomization> = {};
    candidates.forEach(candidate => {
      if (!customizations[candidate.id]) {
        initialCustomizations[candidate.id] = {
          candidateId: candidate.id,
          variables: {},
          excluded: false,
        };
      }
    });
    
    if (Object.keys(initialCustomizations).length > 0) {
      setCustomizations(prev => ({ ...prev, ...initialCustomizations }));
    }
  }, [candidates]);

  // Get selected candidates (not excluded)
  const selectedCandidates = useMemo(() => {
    return candidates.filter(candidate => !customizations[candidate.id]?.excluded);
  }, [candidates, customizations]);

  // Get excluded candidates
  const excludedCandidates = useMemo(() => {
    return candidates.filter(candidate => customizations[candidate.id]?.excluded);
  }, [candidates, customizations]);

  const templateOptions = templates.map(template => ({
    value: template.id,
    label: template.name,
    description: template.category,
  }));

  const jobOptions = [
    { value: '', label: 'No specific job' },
    ...jobs.map(job => ({
      value: job.id,
      label: job.title,
      description: job.company,
    })),
  ];

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };

  const handleToggleCandidateExclusion = (candidateId: string) => {
    setCustomizations(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        excluded: !prev[candidateId]?.excluded,
      },
    }));
  };

  const handleCustomizeCandidate = (candidateId: string) => {
    setEditingCandidateId(candidateId);
    setShowCustomization(true);
  };

  const handleSaveCustomization = (candidateId: string, variables: Record<string, string>) => {
    setCustomizations(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        variables,
      },
    }));
    setShowCustomization(false);
    setEditingCandidateId('');
  };

  const handlePreviewCandidate = (candidateId: string) => {
    setPreviewCandidateId(candidateId);
    setShowPreview(true);
    
    if (selectedTemplate) {
      onPreviewMessage?.(candidateId, selectedTemplate);
    }
  };

  const handleSendBulkMessage = () => {
    if (!selectedTemplate || selectedCandidates.length === 0) return;

    const request: BulkMessageRequest = {
      candidateIds: selectedCandidates.map(c => c.id),
      templateId: selectedTemplate.id,
      customizations: Object.fromEntries(
        Object.entries(customizations)
          .filter(([_, customization]) => !customization.excluded)
          .map(([candidateId, customization]) => [candidateId, customization.variables])
      ),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      jobId: selectedJobId || undefined,
    };

    onSendBulkMessage?.(request);
  };

  const canSend = selectedTemplate && selectedCandidates.length > 0;

  const candidateColumns = [
    {
      header: 'Candidate',
      accessorKey: 'name',
      cell: ({ row }: any) => {
        const candidate = row.original as Candidate;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{candidate.name}</div>
              <div className="text-sm text-gray-500">{candidate.title}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Company',
      accessorKey: 'company',
      cell: ({ row }: any) => {
        const candidate = row.original as Candidate;
        return (
          <div>
            <div className="text-sm text-gray-900">{candidate.company}</div>
            <div className="text-xs text-gray-500">{candidate.location}</div>
          </div>
        );
      },
    },
    {
      header: 'Score',
      accessorKey: 'score',
      cell: ({ row }: any) => {
        const candidate = row.original as Candidate;
        return (
          <Badge variant="info" size="sm">
            {candidate.score}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => {
        const candidate = row.original as Candidate;
        const customization = customizations[candidate.id];
        
        if (customization?.excluded) {
          return <Badge variant="error" size="sm">Excluded</Badge>;
        }
        
        const hasCustomization = Object.keys(customization?.variables || {}).length > 0;
        return (
          <Badge variant={hasCustomization ? 'success' : 'default'} size="sm">
            {hasCustomization ? 'Customized' : 'Default'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: any) => {
        const candidate = row.original as Candidate;
        const isExcluded = customizations[candidate.id]?.excluded;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePreviewCandidate(candidate.id)}
              disabled={!selectedTemplate}
              className="h-8 w-8 p-0"
              title="Preview message"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCustomizeCandidate(candidate.id)}
              disabled={!selectedTemplate}
              className="h-8 w-8 p-0"
              title="Customize message"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleCandidateExclusion(candidate.id)}
              className={cn(
                "h-8 w-8 p-0",
                isExcluded ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"
              )}
              title={isExcluded ? "Include candidate" : "Exclude candidate"}
            >
              {isExcluded ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const selectedJob = jobs.find(job => job.id === selectedJobId);
  const previewCandidate = candidates.find(c => c.id === previewCandidateId);
  const editingCandidate = candidates.find(c => c.id === editingCandidateId);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Bulk Messaging</h2>
          <p className="text-sm text-gray-600 mt-1">
            Send personalized messages to multiple candidates at once
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {selectedCandidates.length} selected
          </Badge>
          
          {excludedCandidates.length > 0 && (
            <Badge variant="error" className="text-sm">
              {excludedCandidates.length} excluded
            </Badge>
          )}
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Message Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Message Template"
              value={selectedTemplate?.id || ''}
              onChange={handleTemplateChange}
              options={[
                { value: '', label: 'Select a template...' },
                ...templateOptions,
              ]}
              placeholder="Choose a message template"
              required
            />
            
            <Select
              label="Job Position (Optional)"
              value={selectedJobId}
              onChange={setSelectedJobId}
              options={jobOptions}
              placeholder="Associate with a job"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Schedule Send Time (Optional)"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              helperText="Leave empty to send immediately"
            />
            
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleSendBulkMessage}
                disabled={!canSend}
                icon={scheduledAt ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                className="w-full"
              >
                {scheduledAt ? 'Schedule Messages' : 'Send Messages'}
              </Button>
            </div>
          </div>
          
          {selectedTemplate && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Template className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    {selectedTemplate.name}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Subject: {selectedTemplate.subject}
                  </p>
                  {selectedTemplate.variables.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      This template has {selectedTemplate.variables.length} custom variables that can be personalized per candidate.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Candidates Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recipients</h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{selectedCandidates.length} will receive messages</span>
              
              {excludedCandidates.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <X className="h-4 w-4 text-red-500" />
                  <span>{excludedCandidates.length} excluded</span>
                </>
              )}
            </div>
          </div>
          
          <DataTable
            data={candidates}
            columns={candidateColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
          />
        </div>
      </Card>

      {/* Validation Warnings */}
      {!selectedTemplate && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Template Required
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please select a message template to continue.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedCandidates.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                No Recipients Selected
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                All candidates have been excluded. Please include at least one candidate to send messages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Message Preview"
        size="lg"
      >
        {selectedTemplate && previewCandidate && (
          <MessagePreview
            subject={selectedTemplate.subject}
            content={selectedTemplate.content}
            candidate={previewCandidate}
            job={selectedJob}
            template={selectedTemplate}
            showActions={false}
          />
        )}
      </Modal>

      {/* Customization Modal */}
      <Modal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        title="Customize Message"
        size="lg"
      >
        {selectedTemplate && editingCandidate && (
          <MessageEditor
            candidate={editingCandidate}
            job={selectedJob}
            template={selectedTemplate}
            initialSubject={selectedTemplate.subject}
            initialContent={selectedTemplate.content}
            mode="edit"
            onSave={(data) => {
              // Extract custom variables from the template
              const customVars: Record<string, string> = {};
              selectedTemplate.variables.forEach(variable => {
                // This would need to be implemented based on how variables are handled
                customVars[variable.name] = ''; // Default or extracted value
              });
              
              handleSaveCustomization(editingCandidate.id, customVars);
            }}
            onCancel={() => setShowCustomization(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default BulkMessageInterface;