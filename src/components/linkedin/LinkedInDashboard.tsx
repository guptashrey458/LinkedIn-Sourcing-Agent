import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { linkedinSourcingService, PerformanceSummary, Candidate } from '../../services/linkedinSourcingService'
import { LinkedInPipelineRunner } from './LinkedInPipelineRunner'

export const LinkedInDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceSummary | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    loadDashboardData()
    checkApiStatus()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [metricsData] = await Promise.all([
        linkedinSourcingService.getPerformanceMetrics(30)
      ])
      
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const checkApiStatus = async () => {
    try {
      const validation = await linkedinSourcingService.validateApiKeys()
      setApiStatus(validation.valid ? 'valid' : 'invalid')
    } catch (err) {
      setApiStatus('invalid')
    }
  }

  const handlePipelineComplete = (result: any) => {
    if (result.candidates) {
      setCandidates(prev => [...result.candidates, ...prev])
    }
    // Refresh metrics
    loadDashboardData()
  }

  const candidateColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (candidate: Candidate) => (
        <div>
          <div className="font-medium">{candidate.name}</div>
          <div className="text-sm text-gray-500">{candidate.current_title || candidate.headline}</div>
        </div>
      )
    },
    {
      key: 'company',
      header: 'Company',
      render: (candidate: Candidate) => candidate.current_company || candidate.company || 'N/A'
    },
    {
      key: 'location',
      header: 'Location',
      render: (candidate: Candidate) => candidate.location
    },
    {
      key: 'score',
      header: 'Score',
      render: (candidate: Candidate) => (
        <div className="flex items-center">
          <div className={`px-2 py-1 rounded text-sm font-medium ${
            (candidate.score || 0) >= 8 ? 'bg-green-100 text-green-800' :
            (candidate.score || 0) >= 7 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {candidate.score?.toFixed(1) || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (candidate: Candidate) => (
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (candidate: Candidate) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(candidate.linkedin_url, '_blank')}
          >
            LinkedIn
          </Button>
          {candidate.github_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(candidate.github_url, '_blank')}
            >
              GitHub
            </Button>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Sourcing Dashboard</h1>
          <p className="text-gray-600">AI-powered candidate discovery and outreach</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            apiStatus === 'valid' ? 'bg-green-100 text-green-800' :
            apiStatus === 'invalid' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {apiStatus === 'valid' ? '✅ API Keys Valid' :
             apiStatus === 'invalid' ? '❌ API Keys Invalid' :
             '⏳ Checking API Keys...'}
          </div>
          <LinkedInPipelineRunner onPipelineComplete={handlePipelineComplete} />
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_executions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.success_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.average_candidates_found.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cost per Run</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.cost_per_execution.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Average Duration</p>
            <p className="text-lg font-semibold">{metrics?.average_duration_seconds.toFixed(1)}s</p>
          </div>
          <div>
            <p className="text-gray-600">Average Score</p>
            <p className="text-lg font-semibold">{metrics?.average_candidate_score.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">API Calls</p>
            <p className="text-lg font-semibold">{metrics?.total_api_calls}</p>
          </div>
          <div>
            <p className="text-gray-600">Error Rate</p>
            <p className="text-lg font-semibold">{metrics?.api_error_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Candidates</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCandidates([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={loadDashboardData}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {candidates.length > 0 ? (
          <DataTable
            data={candidates}
            columns={candidateColumns}
            searchable
            sortable
            pagination
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">No candidates yet</p>
            <p className="text-sm">Run a pipeline to start discovering candidates</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}