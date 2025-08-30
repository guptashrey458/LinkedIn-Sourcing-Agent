import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Badge,
  DataTable,
  Loading,
} from '../ui';
import { JobTemplateForm } from '../forms';
import { 
  useJobTemplates, 
  useCreateJobTemplate, 
  useUpdateJobTemplate, 
  useDeleteJobTemplate,
  useCreateJobFromTemplate
} from '../../hooks/useJobs';
import { JobTemplate } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils';
import type { JobTemplateData } from '../../schemas/jobSchema';

export interface JobTemplateManagerProps {
  onCreateJob?: (jobId: string) => void;
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

const JobTemplateManager: React.FC<JobTemplateManagerProps> = ({
  onCreateJob,
  className,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // API hooks
  const { data: templates, isLoading, error } = useJobTemplates();
  const createTemplateMutation = useCreateJobTemplate();
  const updateTemplateMutation = useUpdateJobTemplate();
  const deleteTemplateMutation = useDeleteJobTemplate();
  const createJobFromTemplateMutation = useCreateJobFromTemplate();
  
  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => template.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [templates, searchQuery, selectedTags]);
  
  // Get all unique tags
  const allTags = React.useMemo(() => {
    if (!templates) return [];
    const tagSet = new Set<string>();
    templates.forEach(template => {
      template.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [templates]);
  
  // Handle template creation
  const handleCreateTemplate = async (data: JobTemplateData) => {
    try {
      await createTemplateMutation.mutateAsync(data);
      setViewMode('list');
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };
  
  // Handle template update
  const handleUpdateTemplate = async (data: JobTemplateData) => {
    if (!selectedTemplate) return;
    
    try {
      await updateTemplateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        updates: data,
      });
      setViewMode('list');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };
  
  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };
  
  // Handle creating job from template
  const handleCreateJobFromTemplate = async (templateId: string) => {
    try {
      const newJob = await createJobFromTemplateMutation.mutateAsync({ templateId });
      if (onCreateJob) {
        onCreateJob(newJob.id);
      }
    } catch (error) {
      console.error('Failed to create job from template:', error);
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Template Name',
      render: (template: JobTemplate) => (
        <div>
          <div className="font-medium text-gray-900">{template.name}</div>
          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
            {template.description}
          </div>
        </div>
      ),
    },
    {
      key: 'tags',
      title: 'Tags',
      render: (template: JobTemplate) => (
        <div className="flex flex-wrap gap-1">
          {template.tags?.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
          {template.tags && template.tags.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'template',
      title: 'Job Info',
      render: (template: JobTemplate) => (
        <div className="text-sm text-gray-600">
          {template.template.title && (
            <div className="font-medium">{template.template.title}</div>
          )}
          {template.template.company && (
            <div>{template.template.company}</div>
          )}
          {template.template.location && (
            <div>{template.template.location}</div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (template: JobTemplate) => (
        <div className="text-sm text-gray-500">
          {formatRelativeTime(template.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (template: JobTemplate) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateJobFromTemplate(template.id)}
            icon={<Plus className="h-4 w-4" />}
            title="Create Job from Template"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(template);
              setViewMode('edit');
            }}
            icon={<Edit className="h-4 w-4" />}
            title="Edit Template"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTemplate(template.id)}
            icon={<Trash2 className="h-4 w-4" />}
            title="Delete Template"
          />
        </div>
      ),
    },
  ];
  
  // Render different views
  if (viewMode === 'create') {
    return (
      <div className={className}>
        <JobTemplateForm
          mode="create"
          onSubmit={handleCreateTemplate}
          onCancel={() => setViewMode('list')}
          loading={createTemplateMutation.isPending}
        />
      </div>
    );
  }
  
  if (viewMode === 'edit' && selectedTemplate) {
    return (
      <div className={className}>
        <JobTemplateForm
          mode="edit"
          initialData={selectedTemplate}
          onSubmit={handleUpdateTemplate}
          onCancel={() => {
            setViewMode('list');
            setSelectedTemplate(null);
          }}
          loading={updateTemplateMutation.isPending}
        />
      </div>
    );
  }
  
  // Main list view
  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Job Templates</h2>
              <p className="text-gray-600">
                Manage reusable job templates for faster job creation
              </p>
            </div>
            
            <Button
              onClick={() => setViewMode('create')}
              icon={<Plus className="h-4 w-4" />}
            >
              Create Template
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search templates by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
            </div>
            
            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTags.length === 0 ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTags([])}
                  >
                    All
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Templates Table */}
          {isLoading ? (
            <div className="p-8">
              <Loading size="lg" text="Loading templates..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Failed to load templates. Please try again.</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedTags.length > 0 ? 'No templates found' : 'No templates yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first job template to get started'
                }
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <Button
                  onClick={() => setViewMode('create')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Create Template
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              data={filteredTemplates}
              columns={columns}
              loading={isLoading}
              pagination={{
                current: 1,
                pageSize: 10,
                total: filteredTemplates.length,
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default JobTemplateManager;