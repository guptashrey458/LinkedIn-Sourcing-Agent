import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  MailOpen, 
  Reply, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { Message, MessageHistory as MessageHistoryType, Candidate } from '../../types';
import MessagePreview from './MessagePreview';

export interface MessageHistoryProps {
  candidateId?: string;
  candidate?: Candidate;
  messages: Message[];
  messageHistory?: MessageHistoryType;
  onViewMessage?: (message: Message) => void;
  onResendMessage?: (message: Message) => void;
  onExportHistory?: (candidateId: string) => void;
  className?: string;
  showFilters?: boolean;
  showStats?: boolean;
}

const MessageHistory: React.FC<MessageHistoryProps> = ({
  candidateId,
  candidate,
  messages,
  messageHistory,
  onViewMessage,
  onResendMessage,
  onExportHistory,
  className,
  showFilters = true,
  showStats = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           message.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || message.status === statusFilter;
      
      const matchesDate = !dateFilter || (() => {
        const messageDate = new Date(message.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            return messageDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return messageDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return messageDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [messages, searchTerm, statusFilter, dateFilter]);

  // Sort messages by date (newest first)
  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredMessages]);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'opened', label: 'Opened' },
    { value: 'replied', label: 'Replied' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'failed', label: 'Failed' },
  ];

  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
  ];

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened':
        return <MailOpen className="h-4 w-4 text-green-600" />;
      case 'replied':
        return <Reply className="h-4 w-4 text-purple-500" />;
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Message['status']) => {
    const variants = {
      draft: 'default' as const,
      sent: 'info' as const,
      delivered: 'success' as const,
      opened: 'success' as const,
      replied: 'success' as const,
      bounced: 'error' as const,
      failed: 'error' as const,
    };

    return (
      <Badge variant={variants[status]} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    onViewMessage?.(message);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Message History</h3>
          {candidate && (
            <p className="text-sm text-gray-600 mt-1">
              Communication history with {candidate.name}
            </p>
          )}
        </div>
        
        {candidateId && onExportHistory && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportHistory(candidateId)}
            icon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
        )}
      </div>

      {/* Statistics */}
      {showStats && messageHistory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {messageHistory.totalSent}
              </div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {messageHistory.totalOpened}
              </div>
              <div className="text-sm text-gray-600">Opened</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {messageHistory.totalReplied}
              </div>
              <div className="text-sm text-gray-600">Replied</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(messageHistory.responseRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Filter by status"
            className="w-full sm:w-48"
          />
          
          <Select
            value={dateFilter}
            onChange={setDateFilter}
            options={dateOptions}
            placeholder="Filter by date"
            className="w-full sm:w-48"
          />
        </div>
      )}

      {/* Messages List */}
      {sortedMessages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter || dateFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'No messages have been sent to this candidate yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMessages.map((message) => (
            <Card
              key={message.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewMessage(message)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {getStatusIcon(message.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {message.subject}
                        </h4>
                        {getStatusBadge(message.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {message.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Sent {formatDate(message.createdAt)}</span>
                        </div>
                        
                        {message.sentAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Delivered {formatDate(message.sentAt)}</span>
                          </div>
                        )}
                        
                        {message.openedAt && (
                          <div className="flex items-center gap-1">
                            <MailOpen className="h-3 w-3" />
                            <span>Opened {formatDate(message.openedAt)}</span>
                          </div>
                        )}
                        
                        {message.repliedAt && (
                          <div className="flex items-center gap-1">
                            <Reply className="h-3 w-3" />
                            <span>Replied {formatDate(message.repliedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMessage(message);
                      }}
                      className="h-8 w-8 p-0"
                      title="View message"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {onResendMessage && message.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendMessage(message);
                        }}
                        className="h-8 w-8 p-0"
                        title="Resend message"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Message Preview Modal */}
      <Modal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title="Message Details"
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedMessage.status)}
                <span className="font-medium">{selectedMessage.subject}</span>
                {getStatusBadge(selectedMessage.status)}
              </div>
              
              <div className="text-sm text-gray-500">
                {formatDate(selectedMessage.createdAt)}
              </div>
            </div>
            
            <MessagePreview
              subject={selectedMessage.subject}
              content={selectedMessage.content}
              candidate={candidate}
              showActions={false}
              showMetadata={false}
            />
            
            {/* Message Timeline */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Message Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Created: {formatDate(selectedMessage.createdAt)}</span>
                </div>
                
                {selectedMessage.sentAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Sent: {formatDate(selectedMessage.sentAt)}</span>
                  </div>
                )}
                
                {selectedMessage.deliveredAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Delivered: {formatDate(selectedMessage.deliveredAt)}</span>
                  </div>
                )}
                
                {selectedMessage.openedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <MailOpen className="h-4 w-4 text-green-600" />
                    <span>Opened: {formatDate(selectedMessage.openedAt)}</span>
                  </div>
                )}
                
                {selectedMessage.repliedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Reply className="h-4 w-4 text-purple-500" />
                    <span>Replied: {formatDate(selectedMessage.repliedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MessageHistory;