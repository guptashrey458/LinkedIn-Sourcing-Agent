# linkedin_sourcing_pipeline/crewai_pipeline.py
try:
    from crewai import Agent, Task, Crew, Process
except ImportError:
    # Fallback for when crewai is not installed
    print("Warning: crewai package not found. Please install it with: pip install crewai")
    # Create dummy classes to prevent import errors
    class Agent:
        def __init__(self, **kwargs):
            pass
    class Task:
        def __init__(self, **kwargs):
            pass
    class Crew:
        def __init__(self, **kwargs):
            pass
        def kickoff(self):
            return "CrewAI not available"
    class Process:
        sequential = "sequential"
from typing import Dict, List
import logging
import os

# Configure logging to match your existing pipeline
logger = logging.getLogger(__name__)

class CrewAILinkedInPipeline:
    """CrewAI-powered LinkedIn sourcing pipeline with specialized agents"""
    
    def __init__(self):
        # Set up OpenAI model (or use local models)
        os.environ['OPENAI_MODEL_NAME'] = 'gpt-4o-mini'
        
        # Create specialized agents with distinct roles
        self.discovery_agent = Agent(
            role="LinkedIn Talent Scout",
            goal="Discover qualified candidates based on specific job requirements",
            backstory="""You are an expert LinkedIn recruiter with 10+ years of experience 
            in technical recruiting. You excel at finding candidates who match specific job 
            requirements and understand technical skills, company cultures, and career trajectories.
            You use advanced search techniques and boolean operators to find the best talent.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.enrichment_agent = Agent(
            role="Profile Research Specialist",
            goal="Enrich candidate profiles with comprehensive additional data",
            backstory="""You specialize in deep candidate research beyond basic LinkedIn profiles. 
            You find GitHub repositories, technical portfolios, social media presence, and 
            validate information across platforms. You're skilled at identifying red flags 
            and highlighting unique strengths that make candidates stand out.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.scoring_agent = Agent(
            role="Technical Talent Assessor",
            goal="Evaluate and score candidates using comprehensive multi-criteria analysis",
            backstory="""You are a senior technical recruiter and hiring manager with expertise 
            in evaluating software engineering talent. You assess technical skills, experience 
            relevance, cultural fit, career trajectory, and potential. You provide detailed 
            scoring breakdowns with confidence levels and specific reasoning.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.messaging_agent = Agent(
            role="Personalized Outreach Specialist",
            goal="Create compelling, highly personalized outreach messages that get responses",
            backstory="""You are a master of recruitment communication with a track record 
            of 40%+ response rates. You craft engaging messages that feel personal, not 
            templated. You understand what motivates different types of candidates and 
            tailor your approach based on their background, interests, and career stage.""",
            verbose=True,
            allow_delegation=False
        )

    def create_tasks(self, job_description: Dict) -> List[Task]:
        """Create sequential tasks for the CrewAI pipeline"""
        
        # Task 1: Candidate Discovery
        discovery_task = Task(
            description=f"""
            Find qualified candidates for the {job_description.get('title')} position at {job_description.get('company')}.
            
            Job Requirements:
            - Title: {job_description.get('title')}
            - Skills: {', '.join(job_description.get('skills', []))}
            - Location: {job_description.get('location')}
            - Requirements: {job_description.get('requirements', [])}
            - Salary Range: {job_description.get('salary_range', 'Not specified')}
            
            Search for candidates who match these criteria and return a list of 3-5 high-quality 
            potential matches with their basic information including names, LinkedIn URLs, 
            current roles, and key skills.
            
            Focus on finding quality over quantity - each candidate should be a strong potential fit.
            """,
            expected_output="""A list of 3-5 qualified candidates with:
            - Full name
            - LinkedIn profile URL
            - Current job title and company
            - Key relevant skills (matching job requirements)
            - Years of experience
            - Location
            - Brief note on why they're a good fit""",
            agent=self.discovery_agent
        )
        
        # Task 2: Profile Enrichment
        enrichment_task = Task(
            description="""
            Enrich the discovered candidate profiles with additional information to get a 
            complete picture of each candidate:
            
            For each candidate found in the previous task:
            1. Research their GitHub profile and notable repositories
            2. Find their technical blog, portfolio website, or personal projects
            3. Look for conference talks, publications, or open source contributions
            4. Identify any mutual connections or shared experiences
            5. Note any recent career moves, promotions, or achievements
            6. Check for any red flags or concerns
            
            Add this enrichment data to each candidate profile to create a comprehensive view.
            """,
            expected_output="""Enhanced candidate profiles including:
            - All original discovery data
            - GitHub profile URL and repository highlights
            - Portfolio/blog links and notable projects
            - Professional achievements or contributions
            - Mutual connections or shared experiences
            - Recent career highlights or changes
            - Any potential concerns or red flags""",
            agent=self.enrichment_agent,
            context=[discovery_task]
        )
        
        # Task 3: Candidate Scoring
        scoring_task = Task(
            description=f"""
            Score each enriched candidate for the {job_description.get('title')} role using 
            these comprehensive criteria:
            
            1. Technical Skills Match (30%): How well do their skills align with {job_description.get('skills')}
            2. Experience Relevance (25%): Relevance of their work experience to the role
            3. Career Trajectory (20%): Growth pattern and career progression
            4. Cultural Fit (15%): Alignment with company values and work style
            5. Availability Indicators (10%): Likelihood they're open to new opportunities
            
            For each candidate:
            - Provide scores from 1-10 for each criterion
            - Calculate a weighted final score
            - Include detailed reasoning for each score
            - Assess confidence level (High/Medium/Low)
            - Rank candidates from best to worst fit
            
            Be thorough and objective in your assessment.
            """,
            expected_output="""Scored candidates with:
            - Overall score (1-10) for each candidate
            - Detailed breakdown by each criterion (Technical Skills, Experience, etc.)
            - Specific reasoning for each score
            - Confidence level assessment
            - Final ranking from best to worst fit
            - Recommendation on which candidates to prioritize""",
            agent=self.scoring_agent,
            context=[enrichment_task]
        )
        
        # Task 4: Personalized Messaging
        messaging_task = Task(
            description=f"""
            Create a highly personalized outreach message for the TOP-RANKED candidate 
            from the scoring results.
            
            The message should:
            1. Reference specific details from their background (projects, achievements, experience)
            2. Explain why this {job_description.get('title')} role at {job_description.get('company')} 
               is perfect for their career trajectory
            3. Highlight unique aspects of the opportunity (salary range: {job_description.get('salary_range', 'Competitive')})
            4. Include a compelling call-to-action
            5. Feel personal and authentic, not templated
            6. Be concise but engaging (150-200 words)
            
            Also create an engaging subject line that will get the message opened.
            """,
            expected_output="""Personalized outreach package including:
            - Compelling subject line (under 50 characters)
            - Personalized message body (150-200 words)
            - List of key personalization elements used
            - Explanation of why this approach will resonate with the candidate
            - Follow-up strategy recommendations""",
            agent=self.messaging_agent,
            context=[scoring_task]
        )
        
        return [discovery_task, enrichment_task, scoring_task, messaging_task]

    def run(self, job_description: Dict) -> Dict:
        """Execute the CrewAI pipeline"""
        try:
            logger.info("Starting CrewAI LinkedIn sourcing pipeline")
            
            # Create tasks
            tasks = self.create_tasks(job_description)
            
            # Create crew with sequential process
            crew = Crew(
                agents=[self.discovery_agent, self.enrichment_agent, 
                       self.scoring_agent, self.messaging_agent],
                tasks=tasks,
                process=Process.sequential,
                verbose=True,
                memory=True  # Enable crew memory for better collaboration
            )
            
            # Execute pipeline
            logger.info("Executing CrewAI crew...")
            result = crew.kickoff()
            
            logger.info("CrewAI pipeline completed successfully")
            
            return {
                "success": True,
                "job": job_description,
                "crewai_result": str(result),
                "pipeline_type": "CrewAI Multi-Agent System",
                "agents_used": 4,
                "process": "Sequential with Memory"
            }
            
        except Exception as e:
            logger.error(f"CrewAI pipeline failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "job": job_description,
                "pipeline_type": "CrewAI Multi-Agent System"
            }

# Wrapper function for FastAPI integration
def run_crewai_pipeline(job_description: Dict) -> Dict:
    """Wrapper function for FastAPI integration"""
    pipeline = CrewAILinkedInPipeline()
    return pipeline.run(job_description)
