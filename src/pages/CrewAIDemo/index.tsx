import React, { useState } from 'react';
import { Play, Users, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Button, Card, Modal, Toast } from '../../components/ui';
import { crewaiService } from '../../services/crewaiService';
import type { Job, Candidate } from '../../types';

interface DemoState {
  isProcessing: boolean;
  results: {
    candidates: Candidate[];
    topCandidate?: Candidate;
    message?: string;
  } | null;
  error: string | null;
  showResults: boolean;
}

const CrewAIDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    isProcessing: false,
    results: null,
    error: null,
    showResults: false,
  });

  // Demo job data
  const demoJob: Job = {
    id: 'demo-job-1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    description: `We are seeking a highly skilled Senior Full Stack Developer to join our innovative team. 
    The ideal candidate will have extensive experience in modern web technologies and a passion for creating 
    exceptional user experiences. You will be responsible for developing and maintaining our core platform, 
    working closely with product managers and designers to deliver high-quality solutions.`,
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
    salaryRange: '$140k - $200k',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleStartPipeline = async () => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await crewaiService.processJob(demoJob);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        results: result,
        showResults: true,
      }));

      Toast.success('Pipeline completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      Toast.error(`Pipeline failed: ${errorMessage}`);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await crewaiService.healthCheck();
      Toast.success(`API Status: ${health.status}, Pipeline: ${health.pipeline}`);
    } catch (error) {
      Toast.error('Health check failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              LinkedIn Sourcing Agent
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            AI-powered candidate discovery using CrewAI multi-agent system. 
            Watch as our intelligent agents work together to find, analyze, and rank the perfect candidates.
          </p>
        </div>

        {/* Demo Job Card */}
        <Card className="mb-8 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {demoJob.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {demoJob.company} • {demoJob.location} • {demoJob.remote ? 'Remote' : 'On-site'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {demoJob.salaryRange}
              </p>
              <p className="text-sm text-gray-500">Salary Range</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {demoJob.description}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
              {demoJob.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Skills</h3>
            <div className="flex flex-wrap gap-2">
              {demoJob.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleStartPipeline}
              disabled={state.isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {state.isProcessing ? (
                <>
                  <Clock className="h-5 w-5 animate-spin" />
                  Processing with CrewAI...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start AI Pipeline
                </>
              )}
            </Button>
            
            <Button
              onClick={handleHealthCheck}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Health Check
            </Button>
          </div>
        </Card>

        {/* Processing Status */}
        {state.isProcessing && (
          <Card className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  CrewAI Pipeline Running
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Our AI agents are discovering, enriching, scoring, and crafting personalized messages...
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {state.error && (
          <Card className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Pipeline Error
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  {state.error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Results Modal */}
        <Modal
          isOpen={state.showResults}
          onClose={() => setState(prev => ({ ...prev, showResults: false }))}
          title="CrewAI Pipeline Results"
          size="xl"
        >
          {state.results && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      Candidates Found
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {state.results.candidates.length}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900 dark:text-green-100">
                      Top Score
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {state.results.topCandidate?.score?.toFixed(1) || 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      Message Generated
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {state.results.message ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Top Candidate */}
              {state.results.topCandidate && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    🏆 Top Candidate
                  </h3>
                  <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {state.results.topCandidate.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {state.results.topCandidate.title} at {state.results.topCandidate.company}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {state.results.topCandidate.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {state.results.topCandidate.score?.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Match Score</div>
                      </div>
                    </div>
                    
                    {state.results.topCandidate.skills && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {state.results.topCandidate.skills.slice(0, 6).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <a
                      href={state.results.topCandidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View LinkedIn Profile →
                    </a>
                  </Card>
                </div>
              )}

              {/* Generated Message */}
              {state.results.message && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    💬 Personalized Message
                  </h3>
                  <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {state.results.message}
                    </p>
                  </Card>
                </div>
              )}

              {/* All Candidates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  👥 All Candidates ({state.results.candidates.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {state.results.candidates.map((candidate, index) => (
                    <Card key={candidate.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {index + 1}. {candidate.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {candidate.title} • {candidate.company}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Smart Discovery
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              AI agents search and discover relevant candidates from LinkedIn data
            </p>
          </Card>

          <Card className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Intelligent Scoring
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Advanced algorithms rank candidates based on job requirements
            </p>
          </Card>

          <Card className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Personal Messages
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Generate customized outreach messages for each candidate
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Zap className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              CrewAI Powered
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Multi-agent system working together for optimal results
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrewAIDemo;