import { z } from 'zod';

// Job form validation schema
export const jobFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Job title is required')
    .min(3, 'Job title must be at least 3 characters')
    .max(100, 'Job title must be less than 100 characters'),
  
  company: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  
  description: z
    .string()
    .min(1, 'Job description is required')
    .min(50, 'Job description must be at least 50 characters')
    .max(5000, 'Job description must be less than 5000 characters'),
  
  requirements: z
    .array(z.string().min(1, 'Requirement cannot be empty'))
    .min(1, 'At least one requirement is required')
    .max(20, 'Maximum 20 requirements allowed'),
  
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  
  skills: z
    .array(z.string().min(1, 'Skill cannot be empty'))
    .min(1, 'At least one skill is required')
    .max(30, 'Maximum 30 skills allowed'),
  
  remote: z.boolean(),
  
  salaryRange: z
    .string()
    .min(1, 'Salary range is required')
    .max(50, 'Salary range must be less than 50 characters')
    .regex(
      /^[\d,\-\s$€£¥₹]+(?:\s*-\s*[\d,\-\s$€£¥₹]+)?(?:\s*(?:per|\/)\s*(?:hour|day|month|year|annum))?$/i,
      'Please enter a valid salary range (e.g., "$80,000 - $120,000 per year")'
    ),
  
  status: z.enum(['draft', 'active', 'paused', 'completed']).refine(
    (val) => ['draft', 'active', 'paused', 'completed'].includes(val),
    { message: 'Invalid status selected' }
  ),
});

// Job template validation schema
export const jobTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters'),
  
  description: z
    .string()
    .min(1, 'Template description is required')
    .min(10, 'Template description must be at least 10 characters')
    .max(500, 'Template description must be less than 500 characters'),
  
  tags: z
    .array(z.string().min(1, 'Tag cannot be empty'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  
  template: jobFormSchema.partial(),
});

// Bulk job operations schema
export const bulkJobOperationSchema = z.object({
  jobIds: z
    .array(z.string().uuid('Invalid job ID'))
    .min(1, 'At least one job must be selected')
    .max(100, 'Maximum 100 jobs can be processed at once'),
  
  operation: z.enum(['delete', 'activate', 'pause', 'complete', 'draft']).refine(
    (val) => ['delete', 'activate', 'pause', 'complete', 'draft'].includes(val),
    { message: 'Invalid operation selected' }
  ),
  
  updates: z.object({
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    location: z.string().max(100).optional(),
    remote: z.boolean().optional(),
  }).optional(),
});

// Job search/filter schema
export const jobSearchSchema = z.object({
  search: z.string().max(200, 'Search query too long').optional(),
  
  status: z
    .array(z.enum(['draft', 'active', 'paused', 'completed']))
    .optional(),
  
  location: z
    .array(z.string().max(100))
    .max(10, 'Maximum 10 locations allowed')
    .optional(),
  
  skills: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
  
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .refine(
      (data) => data.start <= data.end,
      'End date must be after start date'
    )
    .optional(),
  
  sortBy: z
    .enum(['title', 'company', 'location', 'createdAt', 'updatedAt', 'status'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
  
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .optional()
    .default(1),
  
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

// Export types inferred from schemas
export type JobFormData = z.infer<typeof jobFormSchema>;
export type JobTemplateData = z.infer<typeof jobTemplateSchema>;
export type BulkJobOperationData = z.infer<typeof bulkJobOperationSchema>;
export type JobSearchData = z.infer<typeof jobSearchSchema>;

// Validation helper functions
export const validateJobForm = (data: unknown) => {
  return jobFormSchema.safeParse(data);
};

export const validateJobTemplate = (data: unknown) => {
  return jobTemplateSchema.safeParse(data);
};

export const validateBulkJobOperation = (data: unknown) => {
  return bulkJobOperationSchema.safeParse(data);
};

export const validateJobSearch = (data: unknown) => {
  return jobSearchSchema.safeParse(data);
};

// Default values for forms
export const defaultJobFormValues: Partial<JobFormData> = {
  title: '',
  company: '',
  description: '',
  requirements: [],
  location: '',
  skills: [],
  remote: false,
  salaryRange: '',
  status: 'draft',
};

export const defaultJobTemplateValues: Partial<JobTemplateData> = {
  name: '',
  description: '',
  tags: [],
  template: defaultJobFormValues,
};

// Common validation patterns
export const validationPatterns = {
  salary: /^[\d,\-\s$€£¥₹]+(?:\s*-\s*[\d,\-\s$€£¥₹]+)?(?:\s*(?:per|\/)\s*(?:hour|day|month|year|annum))?$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
};

// Field validation helpers
export const fieldValidators = {
  isValidSalaryRange: (value: string): boolean => {
    return validationPatterns.salary.test(value);
  },
  
  isValidEmail: (value: string): boolean => {
    return validationPatterns.email.test(value);
  },
  
  isValidUrl: (value: string): boolean => {
    return validationPatterns.url.test(value);
  },
  
  isValidPhone: (value: string): boolean => {
    return validationPatterns.phone.test(value);
  },
  
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/gi, '');
  },
  
  validateArrayLength: (array: unknown[], min: number, max: number): boolean => {
    return array.length >= min && array.length <= max;
  },
};