import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Toast } from '../ui/Toast'
import { linkedinSourcingService, JobDescription, PipelineResult } from '../../services/linkedinSourcingService'

interface LinkedInPipelineRunnerProps {
  onPipelineComplete?: (result: PipelineResult) => void
}

export const LinkedInPipelineRunner: React.FC<LinkedInPipelineRunnerProps> = ({
  onPipelineComplete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStage, setCurrentStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState<JobDescription>({
    title: '',
    company: '',
    description: '',
    requirements: [],
    location: '',
    salary_range: ''
  })
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel' | undefined>(undefined)

  const stages = [
    'Validating job description',
    'Searching for candidates',
    'Enriching candidate profiles',
    'Scoring candidates',
    'Generating personalized messages'
  ]

  const runPipeline = async () => {
    if (!jobDescription.title || !jobDescription.company || !jobDescription.description) {
      setError('Please fill in all required fields')
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)
    setProgress(0)

    try {
      // Simulate stage progression
      for (let i = 0; i < stages.length; i++) {
        setCurrentStage(stages[i])
        setProgress((i / stages.length) * 100)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Run the actual pipeline
      const pipelineResult = await linkedinSourcingService.runPipeline(jobDescription, exportFormat)
      
      setResult(pipelineResult)
      setProgress(100)
      setCurrentStage('Pipeline completed successfully!')
      
      if (onPipelineComplete) {
        onPipelineComplete(pipelineResult)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline execution failed')
    } finally {
      setIsRunning(false)
    }
  }

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...jobDescription.requirements]
    newRequirements[index] = value
    setJobDescription({ ...jobDescription, requirements: newRequirements })
  }

  const addRequirement = () => {
    setJobDescription({
      ...jobDescription,
      requirements: [...jobDescription.requirements, '']
    })
  }

  const removeRequirement = (index: number) => {
    const newRequirements = jobDescription.requirements.filter((_, i) => i !== index)
    setJobDescription({ ...jobDescription, requirements: newRequirements })
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
      >
        🚀 Run LinkedIn Sourcing Pipeline
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="LinkedIn Sourcing Pipeline"
        size="large"
      >
        <div className="space-y-6">
          {!isRunning && !result && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobDescription.title}
                  onChange={(e) => setJobDescription({ ...jobDescription, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Python Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={jobDescription.company}
                  onChange={(e) => setJobDescription({ ...jobDescription, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tech Innovations Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription.description}
                  onChange={(e) => setJobDescription({ ...jobDescription, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                {jobDescription.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5+ years Python experience"
                    />
                    <Button
                      onClick={() => removeRequirement(index)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button onClick={addRequirement} variant="outline" size="sm">
                  Add Requirement
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobDescription.location}
                    onChange={(e) => setJobDescription({ ...jobDescription, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={jobDescription.salary_range}
                    onChange={(e) => setJobDescription({ ...jobDescription, salary_range: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., $120k - $180k"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format (Optional)
                </label>
                <select
                  value={exportFormat || ''}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'excel' || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No export</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={runPipeline}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Run Pipeline
                </Button>
              </div>
            </div>
          )}

          {isRunning && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h3 className="text-lg font-medium">{currentStage}</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  ✅ Pipeline Completed Successfully!
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Candidates Found:</span> {result.candidates.length}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {result.metrics.total_duration?.toFixed(1)}s
                  </div>
                  <div>
                    <span className="font-medium">API Calls:</span> {result.metrics.api_calls_made}
                  </div>
                  <div>
                    <span className="font-medium">Average Score:</span> {result.metrics.average_score?.toFixed(2)}
                  </div>
                </div>
              </div>

              {result.top_candidate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">🏆 Top Candidate</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {result.top_candidate.name}</div>
                    <div><span className="font-medium">Title:</span> {result.top_candidate.current_title || result.top_candidate.headline}</div>
                    <div><span className="font-medium">Company:</span> {result.top_candidate.current_company || result.top_candidate.company}</div>
                    <div><span className="font-medium">Score:</span> {result.top_candidate.score?.toFixed(2)}/10</div>
                    <div><span className="font-medium">Skills:</span> {result.top_candidate.skills.join(', ')}</div>
                  </div>
                </div>
              )}

              {result.message && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">💬 Generated Message</h4>
                  <p className="text-sm text-gray-700">{result.message}</p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">❌ Errors</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warnings</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setResult(null)
                    setIsModalOpen(false)
                  }}
                  variant="outline"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setResult(null)
                    setProgress(0)
                    setCurrentStage('')
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Run Another Pipeline
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">❌ Pipeline Failed</h3>
              <p className="text-sm text-red-700">{error}</p>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}
    </>
  )
}