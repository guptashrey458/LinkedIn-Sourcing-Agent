import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  Template,
  Star,
  StarOff,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '../../utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { MessageTemplate } from '../../types';
import MessageTemplateForm from './MessageTemplateForm';

export interface MessageTemplateManagerProps {
  templates: MessageTemplate[];
  onCreateTemplate?: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate?: (id: string, template: Partial<MessageTemplate>) => void;
  onDeleteTemplate?: (id: string) => void;
  onDuplicateTemplate?: (id: string) => void;
  onSelectTemplate?: (template: MessageTemplate) => void;
  className?: string;
  selectable?: boolean;
  selectedTemplateId?: string;
}

const MessageTemplateManager: React.FC<MessageTemplateManagerProps> = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onSelectTemplate,
  className,
  selectable = false,
  selectedTemplateId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'outreach', label: 'Initial Outreach' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'custom', label: 'Custom' },
  ];

  const handleCreateTemplate = (templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    onCreateTemplate?.(templateData);
    setShowCreateModal(false);
  };

  const handleUpdateTemplate = (templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTemplate) {
      onUpdateTemplate?.(editingTemplate.id, templateData);
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    onDeleteTemplate?.(id);
    setDeleteConfirm(null);
  };

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    onDuplicateTemplate?.(template.id);
  };

  const handleToggleDefault = (template: MessageTemplate) => {
    onUpdateTemplate?.(template.id, { isDefault: !template.isDefault });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'outreach': return '👋';
      case 'follow_up': return '📧';
      case 'interview': return '🎯';
      case 'rejection': return '❌';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'outreach': return 'blue';
      case 'follow_up': return 'green';
      case 'interview': return 'purple';
      case 'rejection': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage reusable message templates for candidate outreach
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          placeholder="Filter by category"
          className="w-48"
        />
      </div>

      {/* Templates Grid */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <div className="text-center py-12">
          <Template className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first message template to get started'
            }
          </p>
          {!searchTerm && !categoryFilter && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{getCategoryIcon(category)}</span>
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {category.replace('_', ' ')} Templates
                </h3>
                <Badge variant="secondary" size="sm">
                  {categoryTemplates.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-md',
                      selectable && selectedTemplateId === template.id && 'ring-2 ring-blue-500 border-blue-500'
                    )}
                    onClick={() => selectable && onSelectTemplate?.(template)}
                  >
                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {template.name}
                            </h4>
                            {template.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {template.subject}
                          </p>
                        </div>
                        
                        {!selectable && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDefault(template);
                              }}
                              className="h-8 w-8 p-0"
                              title={template.isDefault ? 'Remove from defaults' : 'Set as default'}
                            >
                              {template.isDefault ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(template);
                              }}
                              className="h-8 w-8 p-0"
                              title="Edit template"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTemplate(template);
                              }}
                              className="h-8 w-8 p-0"
                              title="Duplicate template"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(template.id);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Content Preview */}
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {template.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                      </div>

                      {/* Tags */}
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" size="sm" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {template.createdBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Message Template"
        size="lg"
      >
        <MessageTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Edit Message Template"
        size="lg"
      >
        {editingTemplate && (
          <MessageTemplateForm
            initialData={editingTemplate}
            onSubmit={handleUpdateTemplate}
            onCancel={() => setEditingTemplate(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Template"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this template? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDeleteTemplate(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessageTemplateManager;