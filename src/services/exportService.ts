import { 
  ExportConfig, 
  ExportProgress, 
  ExportRequest, 
  Candidate, 
  JobDescription, 
  PipelineRun,
  Message 
} from '../types';
import { apiClient } from './api';

class ExportService {
  private activeExports = new Map<string, ExportProgress>();

  // Start export process
  async startExport(request: ExportRequest): Promise<string> {
    const exportId = this.generateExportId();
    
    const progress: ExportProgress = {
      id: exportId,
      status: 'pending',
      progress: 0,
      total: 0,
      processed: 0,
      startTime: new Date()
    };

    this.activeExports.set(exportId, progress);

    // Start export process in background
    this.processExport(exportId, request).catch(error => {
      this.updateProgress(exportId, {
        status: 'failed',
        error: error.message,
        endTime: new Date()
      });
    });

    return exportId;
  }

  // Get export progress
  getExportProgress(exportId: string): ExportProgress | null {
    return this.activeExports.get(exportId) || null;
  }

  // Cancel export
  async cancelExport(exportId: string): Promise<void> {
    const progress = this.activeExports.get(exportId);
    if (progress && progress.status === 'processing') {
      this.updateProgress(exportId, {
        status: 'cancelled',
        endTime: new Date()
      });
    }
  }

  // Process export
  private async processExport(exportId: string, request: ExportRequest): Promise<void> {
    try {
      this.updateProgress(exportId, { status: 'processing' });

      // Fetch data based on type
      const data = await this.fetchData(request.type, request.filters);
      
      this.updateProgress(exportId, { 
        total: data.length,
        progress: 10 
      });

      // Transform data based on selected fields
      const transformedData = this.transformData(data, request.config);
      
      this.updateProgress(exportId, { progress: 50 });

      // Generate file based on format
      const fileBlob = await this.generateFile(transformedData, request.config);
      
      this.updateProgress(exportId, { progress: 80 });

      // Create download URL
      const downloadUrl = URL.createObjectURL(fileBlob);
      
      this.updateProgress(exportId, {
        status: 'completed',
        progress: 100,
        processed: data.length,
        downloadUrl,
        endTime: new Date()
      });

    } catch (error) {
      throw error;
    }
  }

  // Fetch data based on type
  private async fetchData(type: string, filters?: Record<string, any>): Promise<any[]> {
    switch (type) {
      case 'candidates':
        return await this.fetchCandidates(filters);
      case 'jobs':
        return await this.fetchJobs(filters);
      case 'pipelines':
        return await this.fetchPipelines(filters);
      case 'messages':
        return await this.fetchMessages(filters);
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  private async fetchCandidates(filters?: Record<string, any>): Promise<Candidate[]> {
    const response = await apiClient.get('/candidates', { params: filters });
    return response.data.data;
  }

  private async fetchJobs(filters?: Record<string, any>): Promise<JobDescription[]> {
    const response = await apiClient.get('/jobs', { params: filters });
    return response.data.data;
  }

  private async fetchPipelines(filters?: Record<string, any>): Promise<PipelineRun[]> {
    const response = await apiClient.get('/pipelines', { params: filters });
    return response.data.data;
  }

  private async fetchMessages(filters?: Record<string, any>): Promise<Message[]> {
    const response = await apiClient.get('/messages', { params: filters });
    return response.data.data;
  }

  // Transform data based on selected fields
  private transformData(data: any[], config: ExportConfig): any[] {
    const selectedFields = config.fields.filter(field => field.selected);
    
    return data.map(item => {
      const transformedItem: Record<string, any> = {};
      
      selectedFields.forEach(field => {
        const value = this.getNestedValue(item, field.key);
        transformedItem[field.label] = this.formatValue(value, field.type);
      });
      
      return transformedItem;
    });
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Format value based on type
  private formatValue(value: any, type: string): any {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value) : value;
      case 'boolean':
        return Boolean(value).toString();
      case 'number':
        return Number(value);
      default:
        return String(value);
    }
  }

  // Generate file based on format
  private async generateFile(data: any[], config: ExportConfig): Promise<Blob> {
    switch (config.format) {
      case 'csv':
        return this.generateCSV(data, config);
      case 'excel':
        return this.generateExcel(data, config);
      case 'json':
        return this.generateJSON(data, config);
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  // Generate CSV file
  private generateCSV(data: any[], config: ExportConfig): Blob {
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    let csvContent = '';

    // Add headers if requested
    if (config.includeHeaders !== false) {
      csvContent += headers.join(',') + '\n';
    }

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    return new Blob([csvContent], { type: 'text/csv' });
  }

  // Generate Excel file (simplified - would use a library like xlsx in production)
  private generateExcel(data: any[], config: ExportConfig): Blob {
    // For now, generate CSV with Excel MIME type
    // In production, use libraries like xlsx or exceljs
    const csvBlob = this.generateCSV(data, config);
    return new Blob([csvBlob], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  // Generate JSON file
  private generateJSON(data: any[], config: ExportConfig): Blob {
    const jsonContent = JSON.stringify(data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  // Update progress
  private updateProgress(exportId: string, updates: Partial<ExportProgress>): void {
    const current = this.activeExports.get(exportId);
    if (current) {
      const updated = { ...current, ...updates };
      this.activeExports.set(exportId, updated);
    }
  }

  // Generate unique export ID
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up completed exports
  cleanupCompletedExports(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [id, progress] of this.activeExports.entries()) {
      if (progress.endTime && progress.endTime < cutoffTime) {
        if (progress.downloadUrl) {
          URL.revokeObjectURL(progress.downloadUrl);
        }
        this.activeExports.delete(id);
      }
    }
  }
}

export const exportService = new ExportService();