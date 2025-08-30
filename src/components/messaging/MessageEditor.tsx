import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  Send, 
  Eye, 
  Edit3, 
  Template, 
  Variable, 
  User, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RichTextEditor from '../ui/RichTextEditor';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { MessageTemplate, MessageVariable, Candidate, JobDescription } from '../../types';

export interface MessageEditorProps {
  candidate?: Candidate;
  job?: JobDescription;
  template?: MessageTemplate;
  initialSubject?: string;
  initialContent?: string;
  templates?: MessageTemplate[];
  onSave?: (data: { subject: string; content: string; templateId?: string }) => void;
  onSend?: (data: { subject: string; content: string; candidateId: string }) => void;
  onCancel?: () => void;
  className?: string;
  mode?: 'create' | 'edit' | 'preview';
  disabled?: boolean;
}

const MessageEditor: React.FC<MessageEditorProps> = ({
  candidate,
  job,
  template,
  initialSubject = '',
  initialContent = '',
  templates = [],
  onSave,
  onSend,
  onCancel,
  className,
  mode = 'create',
  disabled = false,
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [selectedTemplateId, setSelectedTemplateId] = useState(template?.id || '');
  const [isPreview, setIsPreview] = useState(mode === 'preview');
  const [showVariables, setShowVariables] = useState(false);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available variables for substitution
  const availableVariables = useMemo(() => {
    const variables: MessageVariable[] = [
      // Candidate variables
      { name: 'candidate_name', label: 'Candidate Name', type: 'candidate_field', required: false },
      { name: 'candidate_title', label: 'Current Title', type: 'candidate_field', required: false },
      { name: 'candidate_company', label: 'Current Company', type: 'candidate_field', required: false },
      { name: 'candidate_location', label: 'Location', type: 'candidate_field', required: false },
      { name: 'candidate_experience', label: 'Years of Experience', type: 'candidate_field', required: false },
      { name: 'candidate_skills', label: 'Top Skills', type: 'candidate_field', required: false },
    ];

    if (job) {
      variables.push(
        { name: 'job_title', label: 'Job Title', type: 'job_field', required: false },
        { name: 'job_company', label: 'Company', type: 'job_field', required: false },
        { name: 'job_location', label: 'Job Location', type: 'job_field', required: false },
        { name: 'job_salary', label: 'Salary Range', type: 'job_field', required: false }
      );
    }

    // Add template variables if template is selected
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      variables.push(...selectedTemplate.variables);
    }

    return variables;
  }, [candidate, job, selectedTemplateId, templates]);

  // Load template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        setSubject(selectedTemplate.subject);
        setContent(selectedTemplate.content);
      }
    }
  }, [selectedTemplateId, templates]);

  // Variable substitution
  const substituteVariables = (text: string): string => {
    let result = text;

    // Substitute candidate variables
    if (candidate) {
      result = result
        .replace(/\{\{candidate_name\}\}/g, candidate.name)
        .replace(/\{\{candidate_title\}\}/g, candidate.title)
        .replace(/\{\{candidate_company\}\}/g, candidate.company)
        .replace(/\{\{candidate_location\}\}/g, candidate.location)
        .replace(/\{\{candidate_experience\}\}/g, candidate.experience.toString())
        .replace(/\{\{candidate_skills\}\}/g, candidate.skills.slice(0, 3).join(', '));
    }

    // Substitute job variables
    if (job) {
      result = result
        .replace(/\{\{job_title\}\}/g, job.title)
        .replace(/\{\{job_company\}\}/g, job.company)
        .replace(/\{\{job_location\}\}/g, job.location)
        .replace(/\{\{job_salary\}\}/g, job.salaryRange);
    }

    // Substitute custom variables
    Object.entries(customVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  };

  // Get preview content with variables substituted
  const previewSubject = useMemo(() => substituteVariables(subject), [subject, candidate, job, customVariables]);
  const previewContent = useMemo(() => substituteVariables(content), [content, candidate, job, customVariables]);

  // Validate message
  const validateMessage = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Message content is required';
    }

    // Check for unsubstituted required variables
    const requiredVars = availableVariables.filter(v => v.required);
    requiredVars.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      if (subject.match(regex) || content.match(regex)) {
        if (!customVariables[variable.name] && !getVariableValue(variable.name)) {
          newErrors[variable.name] = `${variable.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getVariableValue = (variableName: string): string => {
    if (candidate) {
      switch (variableName) {
        case 'candidate_name': return candidate.name;
        case 'candidate_title': return candidate.title;
        case 'candidate_company': return candidate.company;
        case 'candidate_location': return candidate.location;
        case 'candidate_experience': return candidate.experience.toString();
        case 'candidate_skills': return candidate.skills.slice(0, 3).join(', ');
      }
    }

    if (job) {
      switch (variableName) {
        case 'job_title': return job.title;
        case 'job_company': return job.company;
        case 'job_location': return job.location;
        case 'job_salary': return job.salaryRange;
      }
    }

    return customVariables[variableName] || '';
  };

  const handleSave = () => {
    if (!validateMessage()) return;
    
    onSave?.({
      subject,
      content,
      templateId: selectedTemplateId || undefined,
    });
  };

  const handleSend = () => {
    if (!validateMessage() || !candidate) return;
    
    onSend?.({
      subject: previewSubject,
      content: previewContent,
      candidateId: candidate.id,
    });
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setContent(prev => prev + variable);
  };

  const templateOptions = templates.map(t => ({
    value: t.id,
    label: t.name,
    description: t.category,
  }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Compose Message' : mode === 'edit' ? 'Edit Message' : 'Message Preview'}
          </h3>
          {candidate && (
            <p className="text-sm text-gray-500 mt-1">
              To: {candidate.name} ({candidate.title} at {candidate.company})
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVariables(true)}
            disabled={disabled || isPreview}
            icon={<Variable className="h-4 w-4" />}
          >
            Variables
          </Button>
          
          <Button
            variant={isPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            disabled={disabled}
            icon={isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      {!isPreview && templates.length > 0 && (
        <div>
          <Select
            label="Message Template"
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            options={[
              { value: '', label: 'No template' },
              ...templateOptions,
            ]}
            placeholder="Choose a template..."
            disabled={disabled}
          />
        </div>
      )}

      {/* Subject */}
      <div>
        {isPreview ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-900">{previewSubject || 'No subject'}</p>
            </div>
          </div>
        ) : (
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter message subject..."
            error={errors.subject}
            disabled={disabled}
          />
        )}
      </div>

      {/* Content */}
      <div>
        {isPreview ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[200px]">
              <div 
                className="prose prose-sm max-w-none text-gray-900"
                dangerouslySetInnerHTML={{ __html: previewContent || 'No content' }}
              />
            </div>
          </div>
        ) : (
          <RichTextEditor
            label="Message Content"
            value={content}
            onChange={setContent}
            placeholder="Enter your message content..."
            error={errors.content}
            disabled={disabled}
            minHeight="200px"
          />
        )}
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {candidate && (
            <Badge variant="info" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              {candidate.name}
            </Badge>
          )}
          {job && (
            <Badge variant="secondary" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1" />
              {job.title}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={disabled}
            >
              Cancel
            </Button>
          )}
          
          {onSave && !isPreview && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={disabled}
              icon={<Save className="h-4 w-4" />}
            >
              Save Draft
            </Button>
          )}
          
          {onSend && candidate && (
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={disabled || !candidate}
              icon={<Send className="h-4 w-4" />}
            >
              Send Message
            </Button>
          )}
        </div>
      </div>

      {/* Variables Modal */}
      <Modal
        isOpen={showVariables}
        onClose={() => setShowVariables(false)}
        title="Available Variables"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Click on a variable to insert it into your message. Variables will be automatically replaced with actual values.
          </p>
          
          <div className="space-y-3">
            {availableVariables.map((variable) => (
              <div
                key={variable.name}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => insertVariable(variable.name)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                    {variable.required && (
                      <Badge variant="error" size="sm">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{variable.label}</p>
                  {variable.description && (
                    <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {getVariableValue(variable.name) && (
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => setShowVariables(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessageEditor;