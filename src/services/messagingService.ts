import { 
  MessageTemplate, 
  Message, 
  MessageHistory, 
  BulkMessageRequest, 
  MessageAnalytics,
  ApiResponse 
} from '../types';
import { apiClient } from './api';

export class MessagingService {
  // Message Templates
  static async getTemplates(): Promise<MessageTemplate[]> {
    const response = await apiClient.get<ApiResponse<MessageTemplate[]>>('/messaging/templates');
    return response.data.data;
  }

  static async getTemplate(id: string): Promise<MessageTemplate> {
    const response = await apiClient.get<ApiResponse<MessageTemplate>>(`/messaging/templates/${id}`);
    return response.data.data;
  }

  static async createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    const response = await apiClient.post<ApiResponse<MessageTemplate>>('/messaging/templates', template);
    return response.data.data;
  }

  static async updateTemplate(id: string, template: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const response = await apiClient.put<ApiResponse<MessageTemplate>>(`/messaging/templates/${id}`, template);
    return response.data.data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/messaging/templates/${id}`);
  }

  static async duplicateTemplate(id: string): Promise<MessageTemplate> {
    const response = await apiClient.post<ApiResponse<MessageTemplate>>(`/messaging/templates/${id}/duplicate`);
    return response.data.data;
  }

  // Messages
  static async getMessages(candidateId?: string): Promise<Message[]> {
    const params = candidateId ? { candidateId } : {};
    const response = await apiClient.get<ApiResponse<Message[]>>('/messaging/messages', { params });
    return response.data.data;
  }

  static async getMessage(id: string): Promise<Message> {
    const response = await apiClient.get<ApiResponse<Message>>(`/messaging/messages/${id}`);
    return response.data.data;
  }

  static async sendMessage(data: {
    candidateId: string;
    templateId?: string;
    subject: string;
    content: string;
    jobId?: string;
  }): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>('/messaging/messages/send', data);
    return response.data.data;
  }

  static async sendBulkMessage(request: BulkMessageRequest): Promise<{ 
    messages: Message[];
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    const response = await apiClient.post<ApiResponse<{
      messages: Message[];
      successCount: number;
      failureCount: number;
      errors: string[];
    }>>('/messaging/messages/bulk-send', request);
    return response.data.data;
  }

  static async saveDraft(data: {
    candidateId: string;
    templateId?: string;
    subject: string;
    content: string;
    jobId?: string;
  }): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>('/messaging/messages/draft', data);
    return response.data.data;
  }

  static async updateDraft(id: string, data: {
    subject?: string;
    content?: string;
  }): Promise<Message> {
    const response = await apiClient.put<ApiResponse<Message>>(`/messaging/messages/${id}`, data);
    return response.data.data;
  }

  static async deleteDraft(id: string): Promise<void> {
    await apiClient.delete(`/messaging/messages/${id}`);
  }

  static async resendMessage(id: string): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>(`/messaging/messages/${id}/resend`);
    return response.data.data;
  }

  // Message History
  static async getMessageHistory(candidateId: string): Promise<MessageHistory> {
    const response = await apiClient.get<ApiResponse<MessageHistory>>(`/messaging/history/${candidateId}`);
    return response.data.data;
  }

  static async exportMessageHistory(candidateId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/messaging/history/${candidateId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  static async exportBulkHistory(candidateIds: string[], format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.post('/messaging/history/bulk-export', 
      { candidateIds, format },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Analytics
  static async getAnalytics(filters?: {
    dateRange?: string;
    templateId?: string;
    category?: string;
    candidateIds?: string[];
  }): Promise<MessageAnalytics> {
    const response = await apiClient.get<ApiResponse<MessageAnalytics>>('/messaging/analytics', {
      params: filters,
    });
    return response.data.data;
  }

  static async getTemplateAnalytics(templateId: string, dateRange?: string): Promise<{
    template: MessageTemplate;
    analytics: {
      totalSent: number;
      openRate: number;
      responseRate: number;
      bounceRate: number;
      timeSeriesData: Array<{
        date: string;
        sent: number;
        opened: number;
        replied: number;
      }>;
    };
  }> {
    const response = await apiClient.get<ApiResponse<any>>(`/messaging/templates/${templateId}/analytics`, {
      params: { dateRange },
    });
    return response.data.data;
  }

  static async exportAnalyticsReport(filters?: {
    dateRange?: string;
    templateId?: string;
    category?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/messaging/analytics/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Message Preview and Validation
  static async previewMessage(data: {
    candidateId: string;
    templateId: string;
    customVariables?: Record<string, string>;
  }): Promise<{
    subject: string;
    content: string;
    unresolvedVariables: string[];
  }> {
    const response = await apiClient.post<ApiResponse<{
      subject: string;
      content: string;
      unresolvedVariables: string[];
    }>>('/messaging/preview', data);
    return response.data.data;
  }

  static async validateTemplate(template: {
    subject: string;
    content: string;
    variables: Array<{ name: string; required: boolean }>;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await apiClient.post<ApiResponse<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }>>('/messaging/validate-template', template);
    return response.data.data;
  }

  // Integration and Export
  static async getIntegrationOptions(): Promise<Array<{
    id: string;
    name: string;
    type: 'email' | 'crm' | 'ats';
    enabled: boolean;
    configuration: Record<string, any>;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/messaging/integrations');
    return response.data.data;
  }

  static async exportToIntegration(data: {
    integrationId: string;
    messageIds: string[];
    options?: Record<string, any>;
  }): Promise<{
    success: boolean;
    exportedCount: number;
    errors: string[];
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/messaging/integrations/export', data);
    return response.data.data;
  }

  // Scheduled Messages
  static async getScheduledMessages(): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>('/messaging/scheduled');
    return response.data.data;
  }

  static async cancelScheduledMessage(id: string): Promise<void> {
    await apiClient.delete(`/messaging/scheduled/${id}`);
  }

  static async updateScheduledMessage(id: string, scheduledAt: Date): Promise<Message> {
    const response = await apiClient.put<ApiResponse<Message>>(`/messaging/scheduled/${id}`, {
      scheduledAt: scheduledAt.toISOString(),
    });
    return response.data.data;
  }
}

export default MessagingService;