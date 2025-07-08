import React, { useState, useEffect } from 'react';
import { Search, Users, Target, MessageSquare, Star, MapPin, Building, Clock, Award, TrendingUp, Mail, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = 'https://linkedin-sourcing-agent.onrender.com';

const LinkedInSourcingPipeline = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobData, setJobData] = useState({
    job_id: "ml-research-windsurf-001",
    title: "Software Engineer, ML Research",
    company: "Windsurf (Codeium)",
    description: "Train LLMs for code generation at Forbes AI 50 company",
    requirements: [
      "Experience with generative models (GANs, VAEs, Diffusion)",
      "Strong background in PyTorch/TensorFlow",
      "Published research in ML conferences",
      "5+ years ML experience"
    ],
    location: "Mountain View, CA",
    skills: ["PyTorch", "TensorFlow", "GANs", "LLMs", "Python"],
    salary_range: "$140k - $300k + equity"
  });
  
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const candidateData = [
    {
      name: "Ryan Weideman",
      linkedin_url: "https://www.linkedin.com/in/ryan-weideman",
      current_role: "Senior Software Engineer at Wealthfront",
      location: "San Francisco Bay Area",
      experience: "5 years backend/infrastructure across fintech, robotics",
      background: "Amazon Lab126 robotics, Meta FinTech experience",
      overall_score: 8.7,
      score_breakdown: {
        technical_skills: 9.0,
        experience_relevance: 8.5,
        career_trajectory: 8.0,
        location_match: 10.0,
        company_quality: 9.0
      },
      key_strengths: [
        "Amazon Astro robotics autonomy experience",
        "Fintech backend systems at Wealthfront",
        "Motion planning algorithms background"
      ],
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Calvin Wang",
      linkedin_url: "https://www.linkedin.com/in/yaning-wang-calvin",
      current_role: "Software Engineer @ Meta FinTech",
      location: "San Francisco, CA",
      experience: "3+ years at Meta FinTech",
      background: "University of Illinois CS, Meta FinTech specialist",
      overall_score: 8.2,
      score_breakdown: {
        technical_skills: 8.0,
        experience_relevance: 8.5,
        career_trajectory: 7.5,
        location_match: 10.0,
        company_quality: 9.0
      },
      key_strengths: [
        "Meta FinTech platform development",
        "Distributed systems expertise",
        "University of Illinois CS foundation"
      ],
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Angad Matharoo",
      linkedin_url: "https://www.linkedin.com/in/matharoo-angad",
      current_role: "Pro Database Engineer | AWS certified",
      location: "San Francisco Bay Area",
      experience: "4+ years distributed systems, cloud technologies",
      background: "SaaS & Fintech Solutions Architect",
      overall_score: 7.8,
      score_breakdown: {
        technical_skills: 8.5,
        experience_relevance: 7.0,
        career_trajectory: 8.0,
        location_match: 10.0,
        company_quality: 7.5
      },
      key_strengths: [
        "AWS certified cloud architect",
        "Distributed systems expertise",
        "SaaS and FinTech solutions"
      ],
      avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const personalizedMessage = {
    "Ryan Weideman": {
      subject: "Your Astro Robotics Work + ML Research at Windsurf",
      message: `Hi Ryan,

I was impressed by your work on Amazon Astro's robotics autonomy platform - the motion planning algorithms you developed show exactly the kind of AI/ML thinking we need at Windsurf.

Your transition from robotics AI at Amazon Lab126 to fintech backend systems at Wealthfront demonstrates the perfect blend of technical depth and practical application we're looking for in our ML Research Engineer role.

At Windsurf (Codeium), you'd be training LLMs for code generation - applying your autonomy and motion planning experience to help developers write better code faster. The role offers $140k-$300k + equity and the chance to work on cutting-edge generative models.

Given your background in both AI systems and backend infrastructure, I'd love to discuss how this role could be the perfect next step in your career.

Are you available for a 15-minute call this week?

Best regards,
Sarah Chen`,
      personalization_elements: [
        "Specific mention of Amazon Astro robotics work",
        "Career progression from Amazon → Wealthfront",
        "Connection between motion planning and LLM training",
        "Fintech background relevance"
      ]
    }
  };

  const steps = [
    { icon: Search, title: "Job Discovery", description: "Define requirements and search criteria" },
    { icon: Users, title: "Candidate Sourcing", description: "Find qualified candidates across platforms" },
    { icon: Target, title: "AI Scoring", description: "Intelligent matching and ranking" },
    { icon: MessageSquare, title: "Personalized Outreach", description: "Generate tailored messages" }
  ];

  const callRealAPI = async (jobData) => {
    try {
      const response = await fetch(`${API_BASE}/process_job_crewai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      return null;
    }
  };

  const processPipeline = async () => {
    setIsProcessing(true);
    setCurrentStep(0);
    setCandidates([]);
    
    const processingSteps = [
      "Analyzing job requirements...",
      "Searching LinkedIn profiles...",
      "Enriching candidate data...",
      "Calculating fit scores...",
      "Generating personalized messages..."
    ];

    // Show processing animation
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(processingSteps[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (i < 4) setCurrentStep(i + 1);
    }

    // Call your real API
    const apiResult = await callRealAPI(jobData);
    
    if (apiResult && apiResult.top_candidates) {
      // Use real API data
      setCandidates(apiResult.top_candidates);
      setSelectedCandidate(apiResult.top_candidates[0]);
    } else {
      // Fallback to mock data if API fails
      setCandidates(candidateData);
      setSelectedCandidate(candidateData[0]);
    }
    
    setIsProcessing(false);
  };

  const ScoreBar = ({ label, score, color = "bg-gradient-to-r from-blue-500 to-blue-600" }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="font-bold text-gray-900">{score}/10</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
        <div 
          className={`${color} h-3 rounded-full transition-all duration-700 shadow-sm`}
          style={{ width: `${score * 10}%` }}
        ></div>
      </div>
    </div>
  );

  const CandidateCard = ({ candidate, isSelected, onClick }) => (
    <div 
      className={`p-4 md:p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img 
            src={candidate.avatar} 
            alt={candidate.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{candidate.name}</h3>
            <p className="text-sm text-gray-600">{candidate.current_role}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-bold text-lg text-gray-900">{candidate.overall_score}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span>{candidate.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-500" />
          <span>{candidate.experience}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {candidate.key_strengths.slice(0, 2).map((strength, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-sm text-gray-700 leading-relaxed">{strength}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              🤖 AI LinkedIn Sourcing Pipeline
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Intelligent candidate discovery, scoring, and outreach automation powered by AI
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Job Overview Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{jobData.title}</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-600 mb-3">{jobData.company}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {jobData.location}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {jobData.salary_range}
                </span>
              </div>
            </div>
            <button
              onClick={processPipeline}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Start Pipeline</span>
                </>
              )}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Key Requirements
              </h3>
              <ul className="space-y-3">
                {jobData.requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Skills & Details
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {jobData.skills.map((skill, index) => (
                  <span key={index} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium border border-blue-200">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  📍 {jobData.location}
                </p>
                <p className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  💰 {jobData.salary_range}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Pipeline Progress</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCompleted = index < currentStep || (!isProcessing && candidates.length > 0);
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`flex flex-col items-center space-y-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-110' : 
                      isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105' : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'} max-w-[120px]`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block">
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {isProcessing && (
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-3 text-blue-600 bg-blue-50 rounded-xl p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium text-lg">{processingStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {candidates.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Candidates List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Top Candidates ({candidates.length})
              </h3>
              <div className="space-y-4">
                {candidates.map((candidate, index) => (
                  <CandidateCard
                    key={index}
                    candidate={candidate}
                    isSelected={selectedCandidate?.name === candidate.name}
                    onClick={() => setSelectedCandidate(candidate)}
                  />
                ))}
              </div>
            </div>

            {/* Candidate Details */}
            {selectedCandidate && (
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Details */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={selectedCandidate.avatar} 
                        alt={selectedCandidate.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedCandidate.name}</h2>
                        <p className="text-lg text-gray-600 mb-3">{selectedCandidate.current_role}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedCandidate.location}</span>
                          </span>
                          <a 
                            href={selectedCandidate.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>LinkedIn Profile</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
                        <Star className="w-8 h-8 text-yellow-500 fill-current" />
                        <span className="text-4xl font-bold text-gray-900">{selectedCandidate.overall_score}</span>
                        <span className="text-gray-500 text-lg">/10</span>
                      </div>
                      <p className="text-sm text-gray-600">Overall Match Score</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Score Breakdown
                      </h3>
                      <div className="space-y-4">
                        <ScoreBar label="Technical Skills" score={selectedCandidate.score_breakdown.technical_skills} color="bg-gradient-to-r from-blue-500 to-blue-600" />
                        <ScoreBar label="Experience Relevance" score={selectedCandidate.score_breakdown.experience_relevance} color="bg-gradient-to-r from-green-500 to-green-600" />
                        <ScoreBar label="Career Trajectory" score={selectedCandidate.score_breakdown.career_trajectory} color="bg-gradient-to-r from-purple-500 to-purple-600" />
                        <ScoreBar label="Location Match" score={selectedCandidate.score_breakdown.location_match} color="bg-gradient-to-r from-orange-500 to-orange-600" />
                        <ScoreBar label="Company Quality" score={selectedCandidate.score_breakdown.company_quality} color="bg-gradient-to-r from-red-500 to-red-600" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        Key Strengths
                      </h3>
                      <div className="space-y-4">
                        {selectedCandidate.key_strengths.map((strength, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                              <Award className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700 leading-relaxed">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Message */}
                {personalizedMessage[selectedCandidate.name] && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">Personalized Outreach Message</h3>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
                      <p className="font-semibold text-gray-900 mb-3 text-lg">
                        Subject: {personalizedMessage[selectedCandidate.name].subject}
                      </p>
                      <div className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                        {personalizedMessage[selectedCandidate.name].message}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Personalization Elements:
                      </h4>
                      <ul className="space-y-2">
                        {personalizedMessage[selectedCandidate.name].personalization_elements.map((element, index) => (
                          <li key={index} className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{element}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Mail className="w-5 h-5" />
                        <span>Send Message</span>
                      </button>
                      <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-gray-50">
                        <span>Edit Message</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInSourcingPipeline;