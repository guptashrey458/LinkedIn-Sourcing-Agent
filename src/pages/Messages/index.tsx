import React, { useState } from 'react';
import { 
  Mail, 
  Template, 
  BarChart3, 
  Users, 
  Plus,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  MessageEditor,
  MessageTemplateManager,
  MessageHistory,
  BulkMessageInterface,
  MessageAnalytics,
} from '../../components/messaging';
import {
  useMessageTemplates,
  useMessages,
  useMessageAnalytics,
  useScheduledMessages,
} from '../../hooks/useMessaging';
import { useCandidates } from '../../hooks/useCandidates';
import { useJobs } from '../../hooks/useJobs';

type TabType = 'compose' | 'templates' | 'history' | 'bulk' | 'analytics' | 'scheduled';

const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('compose');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  // Data hooks
  const { templates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useMessageTemplates();
  const { messages, sendMessage, sendBulkMessage, saveDraft } = useMessages();
  const { analytics, exportReport } = useMessageAnalytics();
  const { scheduledMessages, cancelScheduled } = useScheduledMessages();
  const { candidates } = useCandidates();
  const { jobs } = useJobs();

  const tabs = [
    { id: 'compose' as const, label: 'Compose', icon: Mail, count: null },
    { id: 'templates' as const, label: 'Templates', icon: Template, count: templates.length },
    { id: 'history' as const, label: 'History', icon: Calendar, count: messages.length },
    { id: 'bulk' as const, label: 'Bulk Messaging', icon: Users, count: null },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, count: null },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Settings, count: scheduledMessages.length },
  ];

  const handleSendMessage = (data: { subject: string; content: string; candidateId: string }) => {
    sendMessage({
      candidateId: data.candidateId,
      subject: data.subject,
      content: data.content,
    });
    setShowComposeModal(false);
  };

  const handleSaveDraft = (data: { subject: string; content: string; candidateId?: string }) => {
    if (data.candidateId) {
      saveDraft({
        candidateId: data.candidateId,
        subject: data.subject,
        content: data.content,
      });
    }
    setShowComposeModal(false);
  };

  const handleBulkMessage = (request: any) => {
    sendBulkMessage(request);
  };

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Manage candidate communication and outreach campaigns
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowComposeModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Compose Message
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics?.totalSent?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics ? `${Math.round(analytics.openRate * 100)}%` : '0%'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics ? `${Math.round(analytics.responseRate * 100)}%` : '0%'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-xl font-bold text-gray-900">
                {scheduledMessages.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== null && (
                  <Badge variant="secondary" size="sm">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'compose' && (
          <Card>
            <div className="p-6">
              <MessageEditor
                templates={templates}
                onSave={handleSaveDraft}
                onSend={handleSendMessage}
              />
            </div>
          </Card>
        )}

        {activeTab === 'templates' && (
          <MessageTemplateManager
            templates={templates}
            onCreateTemplate={createTemplate}
            onUpdateTemplate={updateTemplate}
            onDeleteTemplate={deleteTemplate}
            onDuplicateTemplate={duplicateTemplate}
          />
        )}

        {activeTab === 'history' && (
          <MessageHistory
            messages={messages}
            showFilters={true}
            showStats={true}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkMessageInterface
            candidates={candidates}
            templates={templates}
            jobs={jobs}
            onSendBulkMessage={handleBulkMessage}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <MessageAnalytics
            analytics={analytics}
            onExportReport={exportReport}
          />
        )}

        {activeTab === 'scheduled' && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Scheduled Messages</h3>
                <Badge variant="info" size="sm">
                  {scheduledMessages.length} scheduled
                </Badge>
              </div>
              
              {scheduledMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled messages</h3>
                  <p className="text-gray-600">
                    Messages scheduled for future delivery will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledMessages.map((message) => (
                    <div key={message.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Scheduled for: {message.metadata?.scheduledAt ? 
                            new Date(message.metadata.scheduledAt).toLocaleString() : 
                            'Unknown'
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelScheduled(message.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title="Compose Message"
        size="lg"
      >
        <MessageEditor
          candidate={selectedCandidate}
          templates={templates}
          onSave={handleSaveDraft}
          onSend={handleSendMessage}
          onCancel={() => setShowComposeModal(false)}
        />
      </Modal>
    </div>
  );
};

export default MessagesPage;