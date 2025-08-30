const API_BASE_URL = 'http://localhost:8000'

export interface JobDescription {
  title: string
  company: string
  description: string
  requirements: string[]
  location?: string
  salary_range?: string
}

export interface Candidate {
  id?: string
  name: string
  title?: string
  headline?: string
  current_title?: string
  company?: string
  current_company?: string
  location: string
  score?: number
  skills: string[]
  linkedin_url: string
  email?: string
  phone?: string
  summary?: string
  experience_years?: number
  experiences?: any[]
  education?: any[]
  github_url?: string
  twitter_url?: string
  websites?: string[]
  enriched_at?: string
  last_updated?: string
  scoring_details?: Record<string, number>
}

export interface PipelineResult {
  job: JobDescription
  candidates: Candidate[]
  top_candidate?: Candidate
  message?: string
  errors: string[]
  warnings: string[]
  metrics: {
    pipeline_id?: string
    total_duration?: number
    candidates_found?: number
    candidates_enriched?: number
    candidates_scored?: number
    messages_generated?: number
    api_calls_made?: number
    api_errors?: number
    average_score?: number
    top_score?: number
  }
  export_files?: string[]
}

export interface PerformanceSummary {
  period_days: number
  total_executions: number
  successful_executions: number
  success_rate: number
  average_duration_seconds: number
  average_candidates_found: number
  average_candidate_score: number
  total_api_calls: number
  total_api_errors: number
  api_error_rate: number
  estimated_total_cost: number
  cost_per_execution: number
}

class LinkedInSourcingService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async runPipeline(jobDescription: JobDescription, exportFormat?: 'json' | 'csv' | 'excel'): Promise<PipelineResult> {
    try {
      const response = await fetch(`${this.baseUrl}/run-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          export_format: exportFormat
        })
      })

      if (!response.ok) {
        throw new Error(`Pipeline request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Pipeline execution failed:', error)
      throw error
    }
  }

  async searchCandidates(filters: {
    title?: string
    location?: string
    skills?: string[]
    company?: string
    experience_years_min?: number
    experience_years_max?: number
    limit?: number
  }): Promise<Candidate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.candidates || []
    } catch (error) {
      console.error('Candidate search failed:', error)
      throw error
    }
  }

  async enrichCandidate(candidateId: string): Promise<Candidate> {
    try {
      const response = await fetch(`${this.baseUrl}/enrich-candidate/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Enrichment request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.candidate
    } catch (error) {
      console.error('Candidate enrichment failed:', error)
      throw error
    }
  }

  async generateMessage(candidate: Candidate, jobDescription: JobDescription): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate,
          job_description: jobDescription
        })
      })

      if (!response.ok) {
        throw new Error(`Message generation failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.message
    } catch (error) {
      console.error('Message generation failed:', error)
      throw error
    }
  }

  async getPerformanceMetrics(days: number = 7): Promise<PerformanceSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/performance-summary?days=${days}`)

      if (!response.ok) {
        throw new Error(`Metrics request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
      throw error
    }
  }

  async exportCandidates(candidates: Candidate[], format: 'json' | 'csv' | 'excel'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/export-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidates,
          format
        })
      })

      if (!response.ok) {
        throw new Error(`Export request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.filename
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  async validateApiKeys(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/validate-api-keys`)

      if (!response.ok) {
        throw new Error(`Validation request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('API key validation failed:', error)
      return { valid: false, errors: [error.message] }
    }
  }

  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Health check failed:', error)
      return { status: 'error' }
    }
  }
}

export const linkedinSourcingService = new LinkedInSourcingService()