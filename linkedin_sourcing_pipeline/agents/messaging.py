"""
MessagingAgent

This agent creates personalized LinkedIn messages using AI, referencing specific candidate details
and maintaining a professional tone.
"""

from crewai import Agent
from typing import Dict, List, Any
import logging
import re

logger = logging.getLogger(__name__)

class MessagingAgent:
    """
    Agent responsible for generating personalized outreach messages.
    
    This agent:
    1. Analyzes candidate profiles and job requirements
    2. Creates personalized LinkedIn messages using AI
    3. References specific candidate details and achievements
    4. Maintains professional tone and best practices
    5. Optimizes for response rates
    """
    
    def __init__(self, llm_model=None):
        self.llm_model = llm_model or "gpt-4"
        
    def create_agent(self) -> Agent:
        """Create the Outreach Generation Agent"""
        
        return Agent(
            role="LinkedIn Outreach Specialist",
            goal="Create highly personalized, professional LinkedIn messages that reference specific candidate details and optimize for response rates",
            backstory="""You are a senior recruiter with expertise in LinkedIn outreach and candidate engagement. 
            You have a proven track record of high response rates through personalized messaging. 
            You understand how to reference specific candidate achievements, skills, and experiences 
            to create compelling, authentic outreach that stands out from generic messages.""",
            
            verbose=True,
            allow_delegation=False,
            
            tools=[
                self._analyze_candidate_profile,
                self._extract_personalization_hooks,
                self._generate_message_template,
                self._personalize_message,
                self._optimize_for_response_rate,
                self._validate_message_quality
            ]
        )
    
    def _analyze_candidate_profile(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze candidate profile to identify personalization opportunities.
        
        Args:
            candidate_data: Complete candidate profile data
            
        Returns:
            Dictionary with analysis results
        """
        analysis = {
            "key_achievements": [],
            "notable_companies": [],
            "impressive_skills": [],
            "education_highlights": [],
            "career_progression": [],
            "personalization_hooks": []
        }
        
        # Extract key achievements from experience
        experience = candidate_data.get("experience", [])
        for exp in experience:
            company = exp.get("name", "")
            title = exp.get("title", "")
            duration = exp.get("duration", "")
            
            if company and title:
                analysis["notable_companies"].append({
                    "company": company,
                    "title": title,
                    "duration": duration
                })
        
        # Extract impressive skills
        skills = candidate_data.get("skills", [])
        if skills:
            # Identify technical skills that stand out
            technical_skills = [skill for skill in skills if self._is_technical_skill(skill)]
            analysis["impressive_skills"] = technical_skills[:3]  # Top 3
        
        # Extract education highlights
        education = candidate_data.get("education", [])
        for edu in education:
            school = edu.get("school", "")
            degree = edu.get("degree", "")
            if school and degree:
                analysis["education_highlights"].append({
                    "school": school,
                    "degree": degree
                })
        
        # Identify personalization hooks
        analysis["personalization_hooks"] = self._identify_personalization_hooks(candidate_data)
        
        logger.info(f"Analyzed profile for {candidate_data.get('name', 'Unknown')}")
        return analysis
    
    def _extract_personalization_hooks(self, candidate_data: Dict[str, Any]) -> List[str]:
        """
        Extract specific details that can be used for personalization.
        
        Args:
            candidate_data: Candidate profile data
            
        Returns:
            List of personalization hooks
        """
        hooks = []
        
        # Company-specific hooks
        companies = candidate_data.get("experience", [])
        for company in companies:
            company_name = company.get("name", "")
            if self._is_prestigious_company(company_name):
                hooks.append(f"experience at {company_name}")
        
        # Skill-specific hooks
        skills = candidate_data.get("skills", [])
        if skills:
            top_skills = skills[:3]
            hooks.append(f"expertise in {', '.join(top_skills)}")
        
        # Education hooks
        education = candidate_data.get("education", [])
        for edu in education:
            school = edu.get("school", "")
            if self._is_prestigious_school(school):
                hooks.append(f"background from {school}")
        
        # Career progression hooks
        if len(companies) > 1:
            hooks.append("impressive career progression")
        
        return hooks
    
    def _generate_message_template(self, job_data: Dict[str, Any], candidate_analysis: Dict[str, Any]) -> str:
        """
        Generate a base message template based on job and candidate analysis.
        
        Args:
            job_data: Job requirements and details
            candidate_analysis: Analysis of candidate profile
            
        Returns:
            Base message template
        """
        job_title = job_data.get("title", "this role")
        company_name = job_data.get("company", "our company")
        
        # Choose template based on available hooks
        hooks = candidate_analysis.get("personalization_hooks", [])
        
        if hooks:
            # Personalized template
            hook = hooks[0]  # Use the strongest hook
            template = f"""Hi [NAME],

I came across your profile and was particularly impressed by your {hook}. Your background seems like a great fit for our {job_title} position at {company_name}.

[PERSONALIZATION_DETAILS]

Would you be interested in learning more about this opportunity? I'd love to connect and discuss how your experience could contribute to our team.

Best regards,
[YOUR_NAME]"""
        else:
            # Generic but professional template
            template = f"""Hi [NAME],

I hope this message finds you well. I came across your profile and was impressed by your professional background. We're currently hiring for a {job_title} position at {company_name}, and I believe your experience could be a great fit.

[PERSONALIZATION_DETAILS]

Would you be interested in learning more about this opportunity? I'd be happy to share details about the role and our company.

Best regards,
[YOUR_NAME]"""
        
        return template
    
    def _personalize_message(self, template: str, candidate_data: Dict[str, Any], candidate_analysis: Dict[str, Any]) -> str:
        """
        Personalize the message template with specific candidate details.
        
        Args:
            template: Base message template
            candidate_data: Candidate profile data
            candidate_analysis: Analysis results
            
        Returns:
            Personalized message
        """
        name = candidate_data.get("name", "there")
        
        # Replace placeholders
        message = template.replace("[NAME]", name)
        
        # Generate personalization details
        personalization_details = self._generate_personalization_details(candidate_data, candidate_analysis)
        
        # Replace personalization placeholder
        message = message.replace("[PERSONALIZATION_DETAILS]", personalization_details)
        
        return message
    
    def _generate_personalization_details(self, candidate_data: Dict[str, Any], candidate_analysis: Dict[str, Any]) -> str:
        """
        Generate specific personalization details for the message.
        
        Args:
            candidate_data: Candidate profile data
            candidate_analysis: Analysis results
            
        Returns:
            Personalization details text
        """
        details = []
        
        # Add company experience details
        notable_companies = candidate_analysis.get("notable_companies", [])
        if notable_companies:
            company = notable_companies[0]
            details.append(f"Your experience as {company['title']} at {company['company']} particularly caught my attention.")
        
        # Add skills details
        impressive_skills = candidate_analysis.get("impressive_skills", [])
        if impressive_skills:
            skills_text = ", ".join(impressive_skills)
            details.append(f"Your expertise in {skills_text} aligns perfectly with what we're looking for.")
        
        # Add education details
        education_highlights = candidate_analysis.get("education_highlights", [])
        if education_highlights:
            edu = education_highlights[0]
            details.append(f"Your {edu['degree']} from {edu['school']} demonstrates the strong foundation we value.")
        
        # Combine details
        if details:
            return " ".join(details)
        else:
            return "Your professional background and experience seem like a great match for our team."
    
    def _optimize_for_response_rate(self, message: str) -> str:
        """
        Optimize message for higher response rates.
        
        Args:
            message: Original message
            
        Returns:
            Optimized message
        """
        # Apply best practices for LinkedIn outreach
        
        # 1. Keep it concise (under 150 words)
        if len(message.split()) > 150:
            message = self._shorten_message(message)
        
        # 2. Add a clear call-to-action
        if "Would you be interested" not in message:
            message = message.replace("Best regards,", "Would you be interested in learning more about this opportunity?\n\nBest regards,")
        
        # 3. Make it personal and specific
        if "I came across your profile" in message and "was impressed" not in message:
            message = message.replace("I came across your profile", "I came across your profile and was impressed")
        
        # 4. Add urgency or exclusivity
        if "opportunity" in message and "exciting" not in message:
            message = message.replace("this opportunity", "this exciting opportunity")
        
        return message
    
    def _validate_message_quality(self, message: str) -> Dict[str, Any]:
        """
        Validate message quality and provide feedback.
        
        Args:
            message: Message to validate
            
        Returns:
            Validation results
        """
        validation = {
            "is_valid": True,
            "issues": [],
            "suggestions": [],
            "word_count": len(message.split()),
            "character_count": len(message)
        }
        
        # Check length
        if validation["word_count"] > 200:
            validation["issues"].append("Message is too long (over 200 words)")
            validation["suggestions"].append("Consider shortening to improve readability")
        
        if validation["word_count"] < 50:
            validation["issues"].append("Message is too short (under 50 words)")
            validation["suggestions"].append("Add more personalization details")
        
        # Check for personalization
        if "your" not in message.lower():
            validation["issues"].append("Message lacks personalization")
            validation["suggestions"].append("Include specific details about the candidate")
        
        # Check for call-to-action
        if not any(phrase in message.lower() for phrase in ["interested", "connect", "discuss", "learn more"]):
            validation["issues"].append("No clear call-to-action")
            validation["suggestions"].append("Add a specific next step or question")
        
        # Check for professional tone
        if any(word in message.lower() for word in ["urgent", "quick", "immediate", "asap"]):
            validation["suggestions"].append("Consider removing urgency language for a more professional tone")
        
        validation["is_valid"] = len(validation["issues"]) == 0
        
        return validation
    
    def _shorten_message(self, message: str) -> str:
        """Shorten message while maintaining key elements"""
        # Simple shortening strategy
        sentences = message.split(". ")
        if len(sentences) > 3:
            # Keep first 2 sentences and last sentence
            shortened = ". ".join(sentences[:2] + [sentences[-1]])
            return shortened
        return message
    
    def _is_technical_skill(self, skill: str) -> bool:
        """Check if a skill is technical"""
        technical_keywords = [
            "python", "java", "javascript", "react", "node", "aws", "docker", "kubernetes",
            "machine learning", "ai", "data science", "sql", "nosql", "api", "microservices",
            "devops", "cloud", "azure", "gcp", "tensorflow", "pytorch", "scala", "go", "rust"
        ]
        return any(keyword in skill.lower() for keyword in technical_keywords)
    
    def _is_prestigious_company(self, company_name: str) -> bool:
        """Check if company is considered prestigious"""
        prestigious_companies = [
            "google", "microsoft", "apple", "amazon", "meta", "facebook", "netflix",
            "uber", "airbnb", "stripe", "square", "palantir", "salesforce", "oracle"
        ]
        return any(prestigious in company_name.lower() for prestigious in prestigious_companies)
    
    def _is_prestigious_school(self, school_name: str) -> bool:
        """Check if school is considered prestigious"""
        prestigious_schools = [
            "stanford", "mit", "harvard", "berkeley", "cmu", "caltech", "princeton",
            "yale", "columbia", "upenn", "cornell", "brown", "dartmouth"
        ]
        return any(prestigious in school_name.lower() for prestigious in prestigious_schools)

    def run(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> str:
        """
        Generate a mock personalized message for the candidate.
        """
        # TODO: Integrate with OpenAI or other LLM
        print(f"[MessagingAgent] Generating message for {candidate.get('name')}")
        return f"Hi {candidate.get('name')}, I was impressed by your experience with {', '.join(candidate.get('skills', []))}. We have a {job.get('title')} opening that matches your background!" 

# --- Public helper for pipeline ---
def generate_outreach_message(candidate: Dict[str, Any], job: Dict[str, Any]) -> str:
    """Generate outreach message for a candidate given a job description."""
    agent = MessagingAgent()
    return agent.run(candidate, job) 