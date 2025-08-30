import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageTemplate, 
  Message, 
  MessageHistory, 
  BulkMessageRequest, 
  MessageAnalytics 
} from '../types';
import MessagingService from '../services/messagingService';
import { useToast } from './useToast';

// Query Keys
export const messagingKeys = {
  all: ['messaging'] as const,
  templates: () => [...messagingKeys.all, 'templates'] as const,
  template: (id: string) => [...messagingKeys.templates(), id] as const,
  messages: () => [...messagingKeys.all, 'messages'] as const,
  candidateMessages: (candidateId: string) => [...messagingKeys.messages(), candidateId] as const,
  messageHistory: (candidateId: string) => [...messagingKeys.all, 'history', candidateId] as const,
  analytics: (filters?: any) => [...messagingKeys.all, 'analytics', filters] as const,
  scheduled: () => [...messagingKeys.all, 'scheduled'] as const,
};

// Templates Hook
export const useMessageTemplates = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: messagingKeys.templates(),
    queryFn: MessagingService.getTemplates,
  });

  const createTemplateMutation = useMutation({
    mutationFn: MessagingService.createTemplate,
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.templates() });
      showToast('Template created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create template', 'error');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: Partial<MessageTemplate> }) =>
      MessagingService.updateTemplate(id, template),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.templates() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.template(updatedTemplate.id) });
      showToast('Template updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update template', 'error');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: MessagingService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.templates() });
      showToast('Template deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete template', 'error');
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: MessagingService.duplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.templates() });
      showToast('Template duplicated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to duplicate template', 'error');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    duplicateTemplate: duplicateTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending,
  };
};

// Single Template Hook
export const useMessageTemplate = (id: string) => {
  return useQuery({
    queryKey: messagingKeys.template(id),
    queryFn: () => MessagingService.getTemplate(id),
    enabled: !!id,
  });
};

// Messages Hook
export const useMessages = (candidateId?: string) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: candidateId ? messagingKeys.candidateMessages(candidateId) : messagingKeys.messages(),
    queryFn: () => MessagingService.getMessages(candidateId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: MessagingService.sendMessage,
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      if (message.candidateId) {
        queryClient.invalidateQueries({ 
          queryKey: messagingKeys.candidateMessages(message.candidateId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: messagingKeys.messageHistory(message.candidateId) 
        });
      }
      showToast('Message sent successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to send message', 'error');
    },
  });

  const sendBulkMessageMutation = useMutation({
    mutationFn: MessagingService.sendBulkMessage,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.analytics() });
      showToast(
        `Bulk message sent: ${result.successCount} successful, ${result.failureCount} failed`,
        result.failureCount > 0 ? 'warning' : 'success'
      );
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to send bulk messages', 'error');
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: MessagingService.saveDraft,
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      if (message.candidateId) {
        queryClient.invalidateQueries({ 
          queryKey: messagingKeys.candidateMessages(message.candidateId) 
        });
      }
      showToast('Draft saved successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to save draft', 'error');
    },
  });

  const resendMessageMutation = useMutation({
    mutationFn: MessagingService.resendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      showToast('Message resent successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to resend message', 'error');
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
    sendBulkMessage: sendBulkMessageMutation.mutate,
    saveDraft: saveDraftMutation.mutate,
    resendMessage: resendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isSendingBulk: sendBulkMessageMutation.isPending,
    isSavingDraft: saveDraftMutation.isPending,
    isResending: resendMessageMutation.isPending,
  };
};

// Message History Hook
export const useMessageHistory = (candidateId: string) => {
  const { showToast } = useToast();

  const historyQuery = useQuery({
    queryKey: messagingKeys.messageHistory(candidateId),
    queryFn: () => MessagingService.getMessageHistory(candidateId),
    enabled: !!candidateId,
  });

  const exportHistoryMutation = useMutation({
    mutationFn: ({ format }: { format: 'csv' | 'json' }) =>
      MessagingService.exportMessageHistory(candidateId, format),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-history-${candidateId}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Message history exported successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to export message history', 'error');
    },
  });

  return {
    history: historyQuery.data,
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    exportHistory: exportHistoryMutation.mutate,
    isExporting: exportHistoryMutation.isPending,
  };
};

// Analytics Hook
export const useMessageAnalytics = (filters?: {
  dateRange?: string;
  templateId?: string;
  category?: string;
}) => {
  const { showToast } = useToast();

  const analyticsQuery = useQuery({
    queryKey: messagingKeys.analytics(filters),
    queryFn: () => MessagingService.getAnalytics(filters),
  });

  const exportReportMutation = useMutation({
    mutationFn: MessagingService.exportAnalyticsReport,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Analytics report exported successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to export analytics report', 'error');
    },
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
    exportReport: exportReportMutation.mutate,
    isExporting: exportReportMutation.isPending,
  };
};

// Message Preview Hook
export const useMessagePreview = () => {
  const [previewData, setPreviewData] = useState<{
    subject: string;
    content: string;
    unresolvedVariables: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewMessage = useCallback(async (data: {
    candidateId: string;
    templateId: string;
    customVariables?: Record<string, string>;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await MessagingService.previewMessage(data);
      setPreviewData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to preview message');
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewData(null);
    setError(null);
  }, []);

  return {
    previewData,
    isLoading,
    error,
    previewMessage,
    clearPreview,
  };
};

// Scheduled Messages Hook
export const useScheduledMessages = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const scheduledQuery = useQuery({
    queryKey: messagingKeys.scheduled(),
    queryFn: MessagingService.getScheduledMessages,
  });

  const cancelScheduledMutation = useMutation({
    mutationFn: MessagingService.cancelScheduledMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.scheduled() });
      showToast('Scheduled message cancelled', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to cancel scheduled message', 'error');
    },
  });

  const updateScheduledMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: Date }) =>
      MessagingService.updateScheduledMessage(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.scheduled() });
      showToast('Scheduled message updated', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update scheduled message', 'error');
    },
  });

  return {
    scheduledMessages: scheduledQuery.data || [],
    isLoading: scheduledQuery.isLoading,
    error: scheduledQuery.error,
    cancelScheduled: cancelScheduledMutation.mutate,
    updateScheduled: updateScheduledMutation.mutate,
    isCancelling: cancelScheduledMutation.isPending,
    isUpdating: updateScheduledMutation.isPending,
  };
};

// Toast hook (assuming it exists)
const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Implementation would depend on your toast system
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  return { showToast };
};