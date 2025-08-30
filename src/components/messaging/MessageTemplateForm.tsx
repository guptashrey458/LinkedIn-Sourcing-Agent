import React, { useState, useEffect } from 'react';
import { Plus, X, Variable, Save, Eye, Edit3 } from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import RichTextEditor from '../ui/RichTextEditor';
import TagInput from '../ui/TagInput';
import { MessageTemplate, MessageVariable } from '../../types';

export interface MessageTemplateFormProps {
  initialData?: Partial<MessageTemplate>;
  onSubmit: (data: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  className?: string;
}

const MessageTemplateForm: React.FC<MessageTemplateFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  className,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    category: initialData?.category || 'outreach' as const,
    tags: initialData?.tags || [],
    variables: initialData?.variables || [],
    isDefault: initialData?.isDefault || false,
    createdBy: initialData?.createdBy || 'current-user', // This should come from auth context
  });

  const [isPreview, setIsPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { value: 'outreach', label: 'Initial Outreach' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'custom', label: 'Custom' },
  ];

  const variableTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'candidate_field', label: 'Candidate Field' },
    { value: 'job_field', label: 'Job Field' },
    { value: 'custom', label: 'Custom' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    // Validate variables
    formData.variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors[`variable_${index}_name`] = 'Variable name is required';
      }
      if (!variable.label.trim()) {
        newErrors[`variable_${index}_label`] = 'Variable label is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      ...formData,
    });
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          name: '',
          label: '',
          type: 'text',
          required: false,
          defaultValue: '',
          description: '',
        },
      ],
    }));
  };

  const updateVariable = (index: number, updates: Partial<MessageVariable>) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) =>
        i === index ? { ...variable, ...updates } : variable
      ),
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  // Sample data for preview
  const sampleData = {
    candidate_name: 'John Doe',
    candidate_title: 'Senior Software Engineer',
    candidate_company: 'Tech Corp',
    candidate_location: 'San Francisco, CA',
    job_title: 'Lead Developer',
    job_company: 'Our Company',
    job_location: 'Remote',
  };

  const getPreviewContent = (text: string): string => {
    let result = text;
    
    // Replace built-in variables with sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });

    // Replace custom variables with their default values or placeholders
    formData.variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      result = result.replace(regex, variable.defaultValue || `[${variable.label}]`);
    });

    return result;
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Template Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Initial Outreach - Software Engineer"
          error={errors.name}
          required
        />
        
        <Select
          label="Category"
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
          options={categoryOptions}
          required
        />
      </div>

      {/* Subject */}
      <div>
        {isPreview ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Preview
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-900">
                {getPreviewContent(formData.subject) || 'No subject'}
              </p>
            </div>
          </div>
        ) : (
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="e.g., Exciting opportunity at {{job_company}}"
            error={errors.subject}
            required
          />
        )}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Message Content
          </label>
          <Button
            type="button"
            variant={isPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            icon={isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        
        {isPreview ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[200px]">
            <div 
              className="prose prose-sm max-w-none text-gray-900"
              dangerouslySetInnerHTML={{ 
                __html: getPreviewContent(formData.content) || 'No content' 
              }}
            />
          </div>
        ) : (
          <RichTextEditor
            value={formData.content}
            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
            placeholder="Enter your message template content..."
            error={errors.content}
            minHeight="200px"
          />
        )}
      </div>

      {/* Variables */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Variables
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Define custom variables that can be personalized for each message
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariable}
            icon={<Plus className="h-4 w-4" />}
            disabled={isPreview}
          >
            Add Variable
          </Button>
        </div>

        {formData.variables.length > 0 && (
          <div className="space-y-4">
            {formData.variables.map((variable, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Variable {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(index)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isPreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Variable Name"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, { name: e.target.value })}
                    placeholder="e.g., custom_field"
                    error={errors[`variable_${index}_name`]}
                    disabled={isPreview}
                  />
                  
                  <Input
                    label="Display Label"
                    value={variable.label}
                    onChange={(e) => updateVariable(index, { label: e.target.value })}
                    placeholder="e.g., Custom Field"
                    error={errors[`variable_${index}_label`]}
                    disabled={isPreview}
                  />
                  
                  <Select
                    label="Type"
                    value={variable.type}
                    onChange={(value) => updateVariable(index, { type: value as any })}
                    options={variableTypeOptions}
                    disabled={isPreview}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Default Value"
                    value={variable.defaultValue || ''}
                    onChange={(e) => updateVariable(index, { defaultValue: e.target.value })}
                    placeholder="Optional default value"
                    disabled={isPreview}
                  />
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={variable.required}
                      onChange={(e) => updateVariable(index, { required: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isPreview}
                    />
                    <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
                      Required
                    </label>
                  </div>
                </div>

                <Input
                  label="Description"
                  value={variable.description || ''}
                  onChange={(e) => updateVariable(index, { description: e.target.value })}
                  placeholder="Optional description for this variable"
                  disabled={isPreview}
                />

                {!isPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                    icon={<Variable className="h-4 w-4" />}
                    disabled={!variable.name}
                  >
                    Insert into Content
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
          placeholder="Add tags to organize templates..."
          disabled={isPreview}
        />
      </div>

      {/* Default Template */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={isPreview}
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700">
          Set as default template for this category
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          variant="primary"
          icon={<Save className="h-4 w-4" />}
          disabled={isPreview}
        >
          Save Template
        </Button>
      </div>
    </form>
  );
};

export default MessageTemplateForm;