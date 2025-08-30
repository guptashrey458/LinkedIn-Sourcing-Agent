import React, { useState } from 'react';

interface DemoState {
  isProcessing: boolean;
  results: any | null;
  error: string | null;
  showResults: boolean;
  currentStage: string | null;
  progress: number;
  stageDescription: string | null;
  pipelineId: string | null;
  fromCache: boolean;
  logs: Array<{
    timestamp: string;
    type: string;
    message: string;
  }>;
}

const CrewAIDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    isProcessing: false,
    results: null,
    error: null,
    showResults: false,
    currentStage: null,
    progress: 0,
    stageDescription: null,
    pipelineId: null,
    fromCache: false,
    logs: [],
  });

  const handleStartPipeline = async () => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      currentStage: null,
      progress: 0,
      stageDescription: null,
      logs: [],
      fromCache: false
    }));

    try {
      // Generate a unique pipeline ID
      const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setState(prev => ({ ...prev, pipelineId }));

      // Set up WebSocket connection for real-time updates
      const wsUrl = `${(import.meta.env.VITE_WS_URL || 'ws://localhost:8000').replace('http', 'ws')}/ws/${pipelineId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            timestamp: new Date().toISOString(),
            type: 'info',
            message: 'Connected to pipeline updates'
          }]
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        setState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            timestamp: data.timestamp || new Date().toISOString(),
            type: data.type,
            message: data.description || data.error || `${data.type} event`
          }]
        }));

        switch (data.type) {
          case 'pipeline_started':
            setState(prev => ({
              ...prev,
              currentStage: 'Initializing',
              stageDescription: 'Starting AI pipeline...',
              progress: 0
            }));
            break;
          case 'stage_started':
            setState(prev => ({
              ...prev,
              currentStage: data.stage,
              stageDescription: data.description,
              progress: data.progress || 0
            }));
            break;
          case 'pipeline_completed':
            setState(prev => ({
              ...prev,
              isProcessing: false,
              results: data.result,
              showResults: true,
              currentStage: 'Completed',
              progress: 100,
              fromCache: data.result?.from_cache || false
            }));
            ws.close();
            break;
          case 'pipeline_error':
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: data.error,
              currentStage: 'Error',
              progress: 0
            }));
            ws.close();
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            timestamp: new Date().toISOString(),
            type: 'error',
            message: 'WebSocket connection error'
          }]
        }));
      };

      // Call the CrewAI API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/process_job_crewai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: 'demo-job-1',
          title: 'Senior Full Stack Developer',
          company: 'TechCorp Inc.',
          description: 'We are seeking a highly skilled Senior Full Stack Developer to join our innovative team.',
          requirements: [
            '5+ years of experience in full-stack development',
            'Proficiency in React, Node.js, and TypeScript',
            'Experience with cloud platforms (AWS, Azure, or GCP)',
            'Strong understanding of database design and optimization',
            'Experience with CI/CD pipelines and DevOps practices',
            'Excellent problem-solving and communication skills'
          ],
          location: 'San Francisco, CA',
          skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL', 'Docker'],
          remote: true,
          salary_range: '$140k - $200k',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // If WebSocket didn't handle completion, handle it here
      if (!state.showResults) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          results: result,
          showResults: true,
          fromCache: result.from_cache || false,
          progress: 100
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        currentStage: 'Error',
        progress: 0,
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          type: 'error',
          message: errorMessage
        }]
      }));
    }
  };

  const handleHealthCheck = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/health`);
      const health = await response.json();
      alert(`API Status: ${health.status}, Pipeline: ${health.pipeline}`);
    } catch (error) {
      alert('Health check failed');
    }
  };

  const handleCacheStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/cache/status`);
      const cacheStatus = await response.json();
      alert(`Cache Status:\n- Cached Jobs: ${cacheStatus.cached_jobs}\n- Cache Duration: ${cacheStatus.cache_duration_hours} hours\n- Keys: ${cacheStatus.cache_keys.join(', ')}`);
    } catch (error) {
      alert('Failed to get cache status');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the cache? This will remove all cached results.')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/cache/clear`, {
        method: 'DELETE'
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert('Failed to clear cache');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-xl font-bold">⚡</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              LinkedIn Sourcing Agent
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered candidate discovery using CrewAI multi-agent system. 
            Watch as our intelligent agents work together to find, analyze, and rank the perfect candidates.
          </p>
        </div>

        {/* Demo Job Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Senior Full Stack Developer
              </h2>
              <p className="text-lg text-gray-600">
                TechCorp Inc. • San Francisco, CA • Remote
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-600">
                $140k - $200k
              </p>
              <p className="text-sm text-gray-500">Salary Range</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              We are seeking a highly skilled Senior Full Stack Developer to join our innovative team. 
              The ideal candidate will have extensive experience in modern web technologies and a passion for creating 
              exceptional user experiences.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>5+ years of experience in full-stack development</li>
              <li>Proficiency in React, Node.js, and TypeScript</li>
              <li>Experience with cloud platforms (AWS, Azure, or GCP)</li>
              <li>Strong understanding of database design and optimization</li>
              <li>Experience with CI/CD pipelines and DevOps practices</li>
              <li>Excellent problem-solving and communication skills</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Key Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL', 'Docker'].map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleStartPipeline}
              disabled={state.isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing with CrewAI...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Start AI Pipeline
                </>
              )}
            </button>
            
            <button
              onClick={handleHealthCheck}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <span>✓</span>
              Health Check
            </button>
            
            <button
              onClick={handleCacheStatus}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <span>📊</span>
              Cache Status
            </button>
            
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 border border-red-300 text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <span>🗑️</span>
              Clear Cache
            </button>
          </div>
        </div>

        {/* Processing Status */}
        {state.isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  CrewAI Pipeline Running
                </h3>
                <p className="text-blue-700">
                  {state.stageDescription || 'Our AI agents are working on your request...'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(state.progress)}%
                </div>
                <div className="text-sm text-blue-500">
                  {state.currentStage || 'Processing'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>

            {/* Real-time Logs */}
            {state.logs.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-blue-900 mb-2">Pipeline Activity:</h4>
                <div className="bg-white rounded border max-h-32 overflow-y-auto">
                  {state.logs.slice(-5).map((log, index) => (
                    <div key={index} className="px-3 py-1 text-sm border-b last:border-b-0">
                      <span className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`ml-2 ${
                        log.type === 'error' ? 'text-red-600' : 
                        log.type === 'info' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">
                  Pipeline Error
                </h3>
                <p className="text-red-700">
                  {state.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {state.showResults && state.results && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                🎉 Pipeline Results
              </h3>
              {state.fromCache && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span>⚡</span>
                  <span>Cached Result</span>
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span>👥</span>
                  <span className="font-semibold text-blue-900">Candidates Found</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {state.results.candidates?.length || 0}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span>📈</span>
                  <span className="font-semibold text-green-900">Top Score</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {state.results.top_candidate?.score?.toFixed(1) || 'N/A'}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span>💬</span>
                  <span className="font-semibold text-purple-900">Message Generated</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {state.results.message ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Top Candidate */}
            {state.results.top_candidate && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  🏆 Top Candidate
                </h4>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        {state.results.top_candidate.name}
                      </h5>
                      <p className="text-gray-600">
                        {state.results.top_candidate.title} at {state.results.top_candidate.company}
                      </p>
                      <p className="text-sm text-gray-500">
                        {state.results.top_candidate.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {state.results.top_candidate.score?.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Match Score</div>
                    </div>
                  </div>
                  
                  {state.results.top_candidate.skills && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {state.results.top_candidate.skills.slice(0, 6).map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={state.results.top_candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View LinkedIn Profile →
                  </a>
                </div>
              </div>
            )}

            {/* Generated Message */}
            {state.results.message && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  💬 Personalized Message
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {state.results.message}
                  </p>
                </div>
              </div>
            )}

            {/* All Candidates */}
            {state.results.candidates && state.results.candidates.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  👥 All Candidates ({state.results.candidates.length})
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {state.results.candidates.map((candidate: any, index: number) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {index + 1}. {candidate.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {candidate.title} • {candidate.company}
                          </p>
                          <p className="text-xs text-gray-500">
                            {candidate.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {candidate.score?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setState(prev => ({ ...prev, showResults: false }))}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close Results
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Smart Discovery
            </h3>
            <p className="text-gray-600 text-sm">
              AI agents search and discover relevant candidates from LinkedIn data
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">📈</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Intelligent Scoring
            </h3>
            <p className="text-gray-600 text-sm">
              Advanced algorithms rank candidates based on job requirements
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">💬</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Personal Messages
            </h3>
            <p className="text-gray-600 text-sm">
              Generate customized outreach messages for each candidate
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="h-12 w-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              CrewAI Powered
            </h3>
            <p className="text-gray-600 text-sm">
              Multi-agent system working together for optimal results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewAIDemo;