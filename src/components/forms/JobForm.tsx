import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Eye, Copy, FileText } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  TagInput,
  RichTextEditor,
  Loading,
} from '../ui';
import { 
  jobFormSchema, 
  type JobFormData, 
  defaultJobFormValues,
  fieldValidators 
} from '../../schemas/jobSchema';
import { JobDescription, JobTemplate } from '../../types';
import { useJobTemplates } from '../../hooks/useJobs';

export interface JobFormProps {
  initialData?: Partial<JobDescription>;
  onSubmit: (data: JobFormData) => void;
  onCancel?: () => void;
  templates?: JobTemplate[];
  mode: 'create' | 'edit' | 'template';
  loading?: boolean;
  className?: string;
}

// Common skills suggestions for autocomplete
const commonSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'PHP',
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'HTML', 'CSS', 'SASS', 'Vue.js',
  'Angular', 'Express.js', 'Spring Boot', 'Django', 'Flask', 'Laravel', 'Ruby on Rails',
  'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'iOS', 'Android',
  'Machine Learning', 'Data Science', 'AI', 'DevOps', 'CI/CD', 'Jenkins', 'Terraform',
  'Linux', 'Windows', 'macOS', 'Microservices', 'Redis', 'Elasticsearch', 'Kafka'
];

// Common requirements suggestions
const commonRequirements = [
  'Bachelor\'s degree in Computer Science or related field',
  '3+ years of professional software development experience',
  'Strong problem-solving and analytical skills',
  'Excellent communication and teamwork abilities',
  'Experience with version control systems (Git)',
  'Knowledge of software development best practices',
  'Ability to work in an Agile/Scrum environment',
  'Strong attention to detail and quality',
  'Self-motivated and able to work independently',
  'Continuous learning mindset and adaptability'
];

const JobForm: React.FC<JobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode,
  loading = false,
  className,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  const { data: templates, isLoading: templatesLoading } = useJobTemplates();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset,
    getValues,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      ...defaultJobFormValues,
      ...initialData,
    },
    mode: 'onChange',
  });
  
  const watchedValues = watch();
  
  // Apply template when selected
  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template?.template) {
      Object.entries(template.template).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as keyof JobFormData, value as any, { shouldValidate: true });
        }
      });
    }
  };
  
  useEffect(() => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);
  
  const handleFormSubmit = (data: JobFormData) => {
    // Sanitize HTML content
    const sanitizedData = {
      ...data,
      description: fieldValidators.sanitizeHtml(data.description),
    };
    onSubmit(sanitizedData);
  };
  
  const handleReset = () => {
    reset({
      ...defaultJobFormValues,
      ...initialData,
    });
    setSelectedTemplate('');
  };
  
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ];
  
  const templateOptions = templates?.map(template => ({
    value: template.id,
    label: template.name,
  })) || [];
  
  if (templatesLoading) {
    return (
      <Card className="p-6">
        <Loading size="lg" text="Loading form..." />
      </Card>
    );
  }
  
  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' && 'Create New Job'}
                {mode === 'edit' && 'Edit Job'}
                {mode === 'template' && 'Create from Template'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create' && 'Fill in the details to create a new job posting'}
                {mode === 'edit' && 'Update the job details as needed'}
                {mode === 'template' && 'Create a new job based on an existing template'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                icon={<Eye className="h-4 w-4" />}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              
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
          </div>
          
          {/* Template Selection */}
          {mode === 'create' && templates && templates.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Start from Template
                </span>
              </div>
              <Select
                placeholder="Choose a template to get started..."
                options={[
                  { value: '', label: 'Start from scratch' },
                  ...templateOptions,
                ]}
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}
          
          {showPreview ? (
            /* Preview Mode */
            <div className="space-y-6">
              <div className="prose max-w-none">
                <h1 className="text-2xl font-bold text-gray-900">
                  {watchedValues.title || 'Job Title'}
                </h1>
                <p className="text-lg text-gray-600">
                  {watchedValues.company || 'Company Name'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>📍 {watchedValues.location || 'Location'}</span>
                  <span>💰 {watchedValues.salaryRange || 'Salary Range'}</span>
                  {watchedValues.remote && <span>🏠 Remote</span>}
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                  <div 
                    className="prose prose-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: watchedValues.description || 'No description provided' 
                    }}
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {watchedValues.requirements?.map((req, index) => (
                      <li key={index} className="text-sm">{req}</li>
                    )) || <li className="text-gray-500">No requirements specified</li>}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    )) || <span className="text-gray-500">No skills specified</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Form Mode */
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Job Title *"
                      placeholder="e.g., Senior Frontend Developer"
                      error={errors.title?.message}
                      disabled={loading}
                    />
                  )}
                />
                
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Company Name *"
                      placeholder="e.g., Tech Corp Inc."
                      error={errors.company?.message}
                      disabled={loading}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Location *"
                      placeholder="e.g., San Francisco, CA"
                      error={errors.location?.message}
                      disabled={loading}
                    />
                  )}
                />
                
                <Controller
                  name="salaryRange"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Salary Range *"
                      placeholder="e.g., $80,000 - $120,000 per year"
                      error={errors.salaryRange?.message}
                      helperText="Include currency and time period"
                      disabled={loading}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Status *"
                      options={statusOptions}
                      error={errors.status?.message}
                      disabled={loading}
                    />
                  )}
                />
                
                <div className="flex items-center pt-8">
                  <Controller
                    name="remote"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={onChange}
                          disabled={loading}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Remote work available
                        </span>
                      </label>
                    )}
                  />
                </div>
              </div>
              
              {/* Job Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    {...field}
                    label="Job Description *"
                    placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                    error={errors.description?.message}
                    disabled={loading}
                    minHeight="200px"
                    maxHeight="400px"
                  />
                )}
              />
              
              {/* Skills and Requirements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TagInput
                      label="Required Skills *"
                      value={value}
                      onChange={onChange}
                      placeholder="Type skills and press Enter..."
                      suggestions={commonSkills}
                      error={errors.skills?.message}
                      helperText="Add the key technical and soft skills required"
                      maxTags={30}
                      disabled={loading}
                    />
                  )}
                />
                
                <Controller
                  name="requirements"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TagInput
                      label="Job Requirements *"
                      value={value}
                      onChange={onChange}
                      placeholder="Type requirements and press Enter..."
                      suggestions={commonRequirements}
                      error={errors.requirements?.message}
                      helperText="List education, experience, and other requirements"
                      maxTags={20}
                      disabled={loading}
                    />
                  )}
                />
              </div>
              
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
                  
                  {mode === 'edit' && (
                    <Button
                      type="button"
                      variant="outline"
                      icon={<Copy className="h-4 w-4" />}
                      disabled={loading}
                    >
                      Duplicate
                    </Button>
                  )}
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
                    {mode === 'create' ? 'Create Job' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default JobForm;