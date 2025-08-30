import React, { useMemo } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Send,
  Edit3,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { Candidate, JobDescription, MessageTemplate } from '../../types';

export interface MessagePreviewProps {
  subject: string;
  content: string;
  candidate?: Candidate;
  job?: JobDescription;
  template?: MessageTemplate;
  onEdit?: () => void;
  onSend?: () => void;
  onCopy?: () => void;
  className?: string;
  showActions?: boolean;
  showMetadata?: boolean;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({
  subject,
  content,
  candidate,
  job,
  template,
  onEdit,
  onSend,
  onCopy,
  className,
  showActions = true,
  showMetadata = true,
}) => {
  // Substitute variables in the content
  const processedContent = useMemo(() => {
    let result = content;

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

    return result;
  }, [content, candidate, job]);

  const processedSubject = useMemo(() => {
    let result = subject;

    // Substitute candidate variables
    if (candidate) {
      result = result
        .replace(/\{\{candidate_name\}\}/g, candidate.name)
        .replace(/\{\{candidate_title\}\}/g, candidate.title)
        .replace(/\{\{candidate_company\}\}/g, candidate.company);
    }

    // Substitute job variables
    if (job) {
      result = result
        .replace(/\{\{job_title\}\}/g, job.title)
        .replace(/\{\{job_company\}\}/g, job.company);
    }

    return result;
  }, [subject, candidate, job]);

  // Check for unresolved variables
  const unresolvedVariables = useMemo(() => {
    const variables: string[] = [];
    const variableRegex = /\{\{([^}]+)\}\}/g;
    
    let match;
    const fullText = processedSubject + ' ' + processedContent;
    
    while ((match = variableRegex.exec(fullText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }, [processedSubject, processedContent]);

  const handleCopyToClipboard = async () => {
    try {
      const textContent = `Subject: ${processedSubject}\n\n${processedContent.replace(/<[^>]*>/g, '')}`;
      await navigator.clipboard.writeText(textContent);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showMetadata && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Message Preview</h3>
            {template && (
              <Badge variant="secondary" size="sm">
                {template.name}
              </Badge>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  icon={<Edit3 className="h-4 w-4" />}
                >
                  Edit
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                icon={<Copy className="h-4 w-4" />}
              >
                Copy
              </Button>
              
              {onSend && candidate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSend}
                  icon={<Send className="h-4 w-4" />}
                  disabled={unresolvedVariables.length > 0}
                >
                  Send
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation Warnings */}
      {unresolvedVariables.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Unresolved Variables
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                The following variables need to be resolved before sending:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {unresolvedVariables.map((variable) => (
                  <li key={variable}>
                    <code className="bg-yellow-100 px-1 rounded">{`{{${variable}}}`}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Information */}
      {candidate && (
        <Card className="bg-gray-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                  <Badge variant="info" size="sm">
                    Score: {candidate.score}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {candidate.title} at {candidate.company}
                </p>
                <p className="text-sm text-gray-500">
                  {candidate.location} • {candidate.experience} years experience
                </p>
              </div>
              {candidate.linkedinUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(candidate.linkedinUrl, '_blank')}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  LinkedIn
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Message Content */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Email Header */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Mail className="h-4 w-4" />
              <span>Email Message</span>
              <Calendar className="h-4 w-4 ml-2" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-700 min-w-[60px]">To:</span>
                <span className="text-sm text-gray-900">
                  {candidate ? `${candidate.name} <${candidate.email || 'email@example.com'}>` : 'Recipient'}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-700 min-w-[60px]">Subject:</span>
                <span className="text-sm text-gray-900 font-medium">
                  {processedSubject || 'No subject'}
                </span>
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-gray-900 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: processedContent || '<p class="text-gray-500 italic">No content</p>' 
              }}
            />
          </div>

          {/* Message Footer */}
          <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
            <p>Best regards,</p>
            <p className="mt-1">Your Recruiting Team</p>
          </div>
        </div>
      </Card>

      {/* Metadata */}
      {showMetadata && (job || template) && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {job && (
            <div className="flex items-center gap-1">
              <span>Job:</span>
              <Badge variant="outline" size="sm">
                {job.title}
              </Badge>
            </div>
          )}
          
          {template && (
            <div className="flex items-center gap-1">
              <span>Template:</span>
              <Badge variant="outline" size="sm">
                {template.name}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Ready to send</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePreview;