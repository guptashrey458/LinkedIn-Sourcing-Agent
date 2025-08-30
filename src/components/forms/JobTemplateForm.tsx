import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, FileText, Tag as TagIcon } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Textarea,
  TagInput,
} from '../ui';
import { 
  jobTemplateSchema, 
  type JobTemplateData, 
  defaultJobTemplateValues 
} from '../../schemas/jobSchema';
import { JobTemplate } from '../../types';
import JobForm from './JobForm';

export interface JobTemplateFormProps {
  initialData?: Partial<JobTemplate>;
  onSubmit: (data: JobTemplateData) => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
  loading?: boolean;
  className?: string;
}

// Common template tags
const commonTemplateTags = [
  'Engineering', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps',
  'Data Science', 'Machine Learning', 'Product', 'Design', 'Marketing',
  'Sales', 'Remote', 'Senior', 'Junior', 'Lead', 'Manager', 'Startup',
  'Enterprise', 'Contract', 'Internship'
];

const JobTemplateForm: React.FC<JobTemplateFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode,
  loading = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'template'>('details');
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<JobTemplateData>({
    resolver: zodResolver(jobTemplateSchema),
    defaultValues: {
      ...defaultJobTemplateValues,
      ...initialData,
    },
    mode: 'onChange',
  });
  
  const watchedTemplate = watch('template');
  
  const handleFormSubmit = (data: JobTemplateData) => {
    onSubmit(data);
  };
  
  const handleReset = () => {
    reset({
      ...defaultJobTemplateValues,
      ...initialData,
    });
  };
  
  const handleTemplateChange = (templateData: any) => {
    setValue('template', templateData, { shouldValidate: true });
  };
  
  const tabs = [
    { id: 'details', label: 'Template Details', icon: FileText },
    { id: 'template', label: 'Job Template', icon: TagIcon },
  ];
  
  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Create Job Template' : 'Edit Job Template'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create' 
                  ? 'Create a reusable template for similar job postings'
                  : 'Update the template details and job information'
                }
              </p>
            </div>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                icon={<X className="h-4 w-4" />}
              >
                Cancel
              </Button>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 'details' | 'template')}
                    className={`
                      flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Template Details */}
                <div className="grid grid-cols-1 gap-6">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Template Name *"
                        placeholder="e.g., Senior Frontend Developer Template"
                        error={errors.name?.message}
                        disabled={loading}
                      />
                    )}
                  />
                  
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Template Description *"
                        placeholder="Describe what this template is for and when to use it..."
                        rows={4}
                        error={errors.description?.message}
                        helperText="Help others understand when to use this template"
                        disabled={loading}
                      />
                    )}
                  />
                  
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TagInput
                        label="Template Tags"
                        value={value || []}
                        onChange={onChange}
                        placeholder="Add tags to categorize this template..."
                        suggestions={commonTemplateTags}
                        error={errors.tags?.message}
                        helperText="Tags help organize and find templates easily"
                        maxTags={10}
                        disabled={loading}
                      />
                    )}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'template' && (
              <div className="space-y-6">
                {/* Job Template Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Job Information Template
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Fill in the fields that should be pre-populated when using this template. 
                    Leave fields empty if they should be filled in each time.
                  </p>
                  
                  <JobForm
                    initialData={watchedTemplate}
                    onSubmit={handleTemplateChange}
                    mode="template"
                    loading={loading}
                  />
                </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={loading || !isDirty}
                >
                  Reset
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
                
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!isValid || loading}
                  icon={<Save className="h-4 w-4" />}
                >
                  {mode === 'create' ? 'Create Template' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default JobTemplateForm;