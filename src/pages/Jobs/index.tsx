import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Copy, 
  Trash2, 
  FileText
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  DataTable,
  Loading,
} from '../../components/ui';
import { JobForm, JobTemplateForm } from '../../components/forms';
import { JobTemplateManager, BulkJobActions } from '../../components/jobs';
import { ExportButton, ExportDialog } from '../../components/export';
import { useExport } from '../../hooks/useExport';
import { 
  useJobs, 
  useCreateJob, 
  useUpdateJob, 
  useDeleteJob, 
  useDuplicateJob,
  useBulkUpdateJobs,
  useBulkDeleteJobs,
  useJobTemplates,
  useCreateJobTemplate,
  useCreateJobFromTemplate
} from '../../hooks/useJobs';
import { JobDescription, JobTemplate } from '../../types';
import { formatRelativeTime } from '../../utils';
import type { JobFormData, JobTemplateData } from '../../schemas/jobSchema';

type ViewMode = 'list' | 'create' | 'edit';

const Jobs: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);

  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { 
    isExportDialogOpen, 
    exportType, 
    exportFilters, 
    openExportDialog, 
    closeExportDialog, 
    handleExportComplete,
    getExportFields 
  } = useExport({
    onExportComplete: (downloadUrl) => {
      // Auto-download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'jobs_export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });
  
  // API hooks
  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useJobs({
    search: searchQuery,
    status: statusFilter ? [statusFilter as JobDescription['status']] : undefined,
  });
  
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const duplicateJobMutation = useDuplicateJob();
  
  const jobs = jobsData?.jobs || [];
  
  // Filter jobs based on search and status
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);
  
  // Handle job creation
  const handleCreateJob = async (data: JobFormData) => {
    try {
      await createJobMutation.mutateAsync(data);
      setViewMode('list');
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };
  
  // Handle job update
  const handleUpdateJob = async (data: JobFormData) => {
    if (!selectedJob) return;
    
    try {
      await updateJobMutation.mutateAsync({
        jobId: selectedJob.id,
        updates: data,
      });
      setViewMode('list');
      setSelectedJob(null);
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };
  
  // Handle job deletion
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await deleteJobMutation.mutateAsync(jobId);
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };
  
  // Handle job duplication
  const handleDuplicateJob = async (jobId: string) => {
    try {
      await duplicateJobMutation.mutateAsync({ jobId });
    } catch (error) {
      console.error('Failed to duplicate job:', error);
    }
  };
  

  
  // Table columns
  const columns = [
    {
      key: 'title',
      title: 'Job Title',
      render: (job: JobDescription) => (
        <div>
          <div className="font-medium text-gray-900">{job.title}</div>
          <div className="text-sm text-gray-500">{job.company}</div>
        </div>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      render: (job: JobDescription) => (
        <div className="flex items-center gap-2">
          <span>{job.location}</span>
          {job.remote && (
            <Badge variant="secondary" size="sm">Remote</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (job: JobDescription) => {
        const statusColors = {
          draft: 'default',
          active: 'success',
          paused: 'warning',
          completed: 'info',
        } as const;
        
        return (
          <Badge variant={statusColors[job.status]} size="sm">
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'skills',
      title: 'Skills',
      render: (job: JobDescription) => (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{job.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (job: JobDescription) => (
        <div className="text-sm text-gray-500">
          {formatRelativeTime(job.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (job: JobDescription) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedJob(job);
              setViewMode('edit');
            }}
            icon={<Edit className="h-4 w-4" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicateJob(job.id)}
            icon={<Copy className="h-4 w-4" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteJob(job.id)}
            icon={<Trash2 className="h-4 w-4" />}
          />
        </div>
      ),
    },
  ];
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ];
  
  // Render different views
  if (viewMode === 'create') {
    return (
      <div className="p-6">
        <JobForm
          mode="create"
          onSubmit={handleCreateJob}
          onCancel={() => setViewMode('list')}
          loading={createJobMutation.isPending}
        />
      </div>
    );
  }
  
  if (viewMode === 'edit' && selectedJob) {
    return (
      <div className="p-6">
        <JobForm
          mode="edit"
          initialData={selectedJob}
          onSubmit={handleUpdateJob}
          onCancel={() => {
            setViewMode('list');
            setSelectedJob(null);
          }}
          loading={updateJobMutation.isPending}
        />
      </div>
    );
  }
  

  
  // Main list view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600">
            Manage job postings and templates for candidate sourcing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton
            type="jobs"
            variant="dropdown"
            size="md"
            filters={selectedJobs.length > 0 ? { ids: selectedJobs } : { search: searchQuery, status: statusFilter }}
            onExportComplete={handleExportComplete}
          />
          
          <Button
            onClick={() => setViewMode('create')}
            icon={<Plus className="h-4 w-4" />}
          >
            Create Job
          </Button>
        </div>
      </div>
      
      {/* Templates Section */}
      <JobTemplateManager 
        onCreateJob={(jobId) => {
          // Optionally navigate to edit the created job
          const job = jobs.find(j => j.id === jobId);
          if (job) {
            setSelectedJob(job);
            setViewMode('edit');
          }
        }}
      />
      
      {/* Filters and Search */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Bulk Actions */}
      <BulkJobActions
        selectedJobs={selectedJobs}
        jobs={filteredJobs}
        onClearSelection={() => setSelectedJobs([])}
        onJobsUpdated={() => {
          // Optionally refetch jobs or handle updates
        }}
      />
      
      {/* Jobs Table */}
      <Card>
        {jobsLoading ? (
          <div className="p-8">
            <Loading size="lg" text="Loading jobs..." />
          </div>
        ) : jobsError ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load jobs. Please try again.</p>
          </div>
        ) : (
          <DataTable
            data={filteredJobs}
            columns={columns}
            loading={jobsLoading}
            selection={{
              selectedRowKeys: selectedJobs,
              onChange: (keys) => setSelectedJobs(keys as string[]),
            }}
            pagination={{
              current: 1,
              pageSize: 20,
              total: filteredJobs.length,
            }}
          />
        )}
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={closeExportDialog}
        type={exportType}
        title="Jobs"
        availableFields={getExportFields(exportType)}
        filters={exportFilters}
        onExportComplete={handleExportComplete}
      />
    </div>
  );
};

export default Jobs;