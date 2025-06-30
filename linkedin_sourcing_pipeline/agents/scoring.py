"""
ScoringAgent

This agent implements the fit score rubric to rate candidates 1-10 based on job match.
It provides detailed scoring breakdowns and confidence levels.
"""

from crewai import Agent
from typing import Dict, List, Any, Tuple
import logging
import math

logger = logging.getLogger(__name__)

class ScoringAgent:
    """
    Agent responsible for scoring candidates based on job requirements.
    
    This agent:
    1. Analyzes candidate profiles against job requirements
    2. Applies the fit score rubric (1-10 scale)
    3. Provides detailed scoring breakdowns
    4. Calculates confidence levels for incomplete data
    """
    
    def __init__(self, llm_model=None):
        self.llm_model = llm_model or "gpt-4"
        
        # Scoring weights for different criteria
        self.scoring_weights = {
            "skills_match": 0.30,
            "experience_relevance": 0.25,
            "education": 0.15,
            "company_prestige": 0.15,
            "location_fit": 0.10,
            "profile_completeness": 0.05
        }
        
    def create_agent(self) -> Agent:
        """Create the Candidate Scoring Agent"""
        
        return Agent(
            role="Candidate Assessment Specialist",
            goal="Score candidates 1-10 based on job fit using comprehensive evaluation criteria and provide detailed breakdowns",
            backstory="""You are a senior technical recruiter with expertise in evaluating candidate fit. 
            You have developed sophisticated scoring methodologies that consider multiple factors including 
            technical skills, experience relevance, education, company background, and cultural fit. 
            You provide detailed, transparent scoring with confidence levels.""",
            
            verbose=True,
            allow_delegation=False,
            
            tools=[
                self._evaluate_skills_match,
                self._assess_experience_relevance,
                self._evaluate_education,
                self._assess_company_prestige,
                self._evaluate_location_fit,
                self._calculate_profile_completeness,
                self._calculate_final_score,
                self._determine_confidence_level
            ]
        )
    
    def _evaluate_skills_match(self, candidate_skills: List[str], required_skills: List[str], preferred_skills: List[str] = None) -> Dict[str, Any]:
        """
        Evaluate how well candidate skills match job requirements.
        
        Args:
            candidate_skills: List of candidate's skills
            required_skills: List of required job skills
            preferred_skills: List of preferred job skills
            
        Returns:
            Dictionary with score and breakdown
        """
        if not required_skills:
            return {"score": 5.0, "breakdown": "No required skills specified"}
        
        # Calculate required skills match
        required_match = len(set(candidate_skills) & set(required_skills)) / len(required_skills)
        
        # Calculate preferred skills bonus
        preferred_bonus = 0
        if preferred_skills:
            preferred_match = len(set(candidate_skills) & set(preferred_skills)) / len(preferred_skills)
            preferred_bonus = preferred_match * 0.2
        
        # Calculate final skills score (1-10 scale)
        base_score = required_match * 8.0  # Max 8 for required skills
        total_score = min(10.0, base_score + preferred_bonus)
        
        breakdown = {
            "required_skills_match": f"{required_match:.2%}",
            "preferred_skills_bonus": f"{preferred_bonus:.2f}",
            "candidate_skills": candidate_skills,
            "missing_required": list(set(required_skills) - set(candidate_skills))
        }
        
        return {
            "score": round(total_score, 2),
            "breakdown": breakdown
        }
    
    def _assess_experience_relevance(self, candidate_experience: List[Dict], job_title: str, required_years: int = 0) -> Dict[str, Any]:
        """
        Assess relevance of candidate's work experience.
        
        Args:
            candidate_experience: List of work experience entries
            job_title: Target job title
            required_years: Required years of experience
            
        Returns:
            Dictionary with score and breakdown
        """
        if not candidate_experience:
            return {"score": 1.0, "breakdown": "No experience data available"}
        
        total_years = 0
        relevant_experience = 0
        title_relevance_scores = []
        
        for exp in candidate_experience:
            # Calculate years (simplified)
            duration = exp.get("duration", "1 year")
            years = self._parse_duration(duration)
            total_years += years
            
            # Assess title relevance
            title_relevance = self._calculate_title_relevance(exp.get("title", ""), job_title)
            title_relevance_scores.append(title_relevance)
            
            if title_relevance > 0.6:  # Consider relevant if >60% match
                relevant_experience += years
        
        # Calculate experience score
        years_score = min(10.0, (total_years / max(required_years, 1)) * 8.0)
        relevance_score = (relevant_experience / max(total_years, 1)) * 2.0
        total_score = min(10.0, years_score + relevance_score)
        
        breakdown = {
            "total_years": total_years,
            "relevant_years": relevant_experience,
            "years_score": round(years_score, 2),
            "relevance_score": round(relevance_score, 2),
            "title_relevance_avg": round(sum(title_relevance_scores) / len(title_relevance_scores), 2)
        }
        
        return {
            "score": round(total_score, 2),
            "breakdown": breakdown
        }
    
    def _evaluate_education(self, education: List[Dict], required_degree: str = None) -> Dict[str, Any]:
        """
        Evaluate candidate's education background.
        
        Args:
            education: List of education entries
            required_degree: Required degree level
            
        Returns:
            Dictionary with score and breakdown
        """
        if not education:
            return {"score": 5.0, "breakdown": "No education data available"}
        
        # Score based on highest degree
        degree_scores = {
            "phd": 10.0,
            "doctorate": 10.0,
            "masters": 8.5,
            "ms": 8.5,
            "ma": 8.0,
            "bachelors": 7.0,
            "bs": 7.0,
            "ba": 6.5,
            "associate": 5.0,
            "high school": 3.0
        }
        
        highest_score = 0
        best_degree = ""
        
        for edu in education:
            degree = edu.get("degree", "").lower()
            for degree_type, score in degree_scores.items():
                if degree_type in degree:
                    if score > highest_score:
                        highest_score = score
                        best_degree = edu.get("degree", "")
                    break
        
        # Bonus for prestigious schools
        school_bonus = 0
        prestigious_schools = ["stanford", "mit", "harvard", "berkeley", "cmu", "caltech"]
        for edu in education:
            school = edu.get("school", "").lower()
            if any(prestigious in school for prestigious in prestigious_schools):
                school_bonus = 1.0
                break
        
        total_score = min(10.0, highest_score + school_bonus)
        
        breakdown = {
            "highest_degree": best_degree,
            "degree_score": highest_score,
            "school_bonus": school_bonus,
            "education_entries": len(education)
        }
        
        return {
            "score": round(total_score, 2),
            "breakdown": breakdown
        }
    
    def _assess_company_prestige(self, companies: List[Dict]) -> Dict[str, Any]:
        """
        Assess prestige of companies where candidate has worked.
        
        Args:
            companies: List of company experience
            
        Returns:
            Dictionary with score and breakdown
        """
        if not companies:
            return {"score": 5.0, "breakdown": "No company data available"}
        
        # Prestigious companies (simplified list)
        prestigious_companies = [
            "google", "microsoft", "apple", "amazon", "meta", "facebook",
            "netflix", "uber", "airbnb", "stripe", "square", "palantir",
            "salesforce", "oracle", "ibm", "intel", "nvidia", "amd"
        ]
        
        company_scores = []
        for company in companies:
            company_name = company.get("name", "").lower()
            
            # Score based on company prestige
            if any(prestigious in company_name for prestigious in prestigious_companies):
                company_scores.append(9.0)
            elif "startup" in company_name or "inc" in company_name:
                company_scores.append(7.0)
            else:
                company_scores.append(6.0)
        
        avg_score = sum(company_scores) / len(company_scores) if company_scores else 5.0
        
        breakdown = {
            "company_scores": company_scores,
            "prestigious_companies": len([s for s in company_scores if s >= 9.0]),
            "total_companies": len(companies)
        }
        
        return {
            "score": round(avg_score, 2),
            "breakdown": breakdown
        }
    
    def _evaluate_location_fit(self, candidate_location: str, job_location: str, remote_allowed: bool = False) -> Dict[str, Any]:
        """
        Evaluate location fit between candidate and job.
        
        Args:
            candidate_location: Candidate's location
            job_location: Job location
            remote_allowed: Whether remote work is allowed
            
        Returns:
            Dictionary with score and breakdown
        """
        if not candidate_location or not job_location:
            return {"score": 5.0, "breakdown": "Location data incomplete"}
        
        # Exact location match
        if candidate_location.lower() == job_location.lower():
            return {"score": 10.0, "breakdown": "Exact location match"}
        
        # Same city/region
        candidate_city = candidate_location.split(",")[0].lower()
        job_city = job_location.split(",")[0].lower()
        
        if candidate_city == job_city:
            return {"score": 9.0, "breakdown": "Same city"}
        
        # Same state/country
        candidate_parts = [p.strip().lower() for p in candidate_location.split(",")]
        job_parts = [p.strip().lower() for p in job_location.split(",")]
        
        if len(candidate_parts) > 1 and len(job_parts) > 1:
            if candidate_parts[1] == job_parts[1]:  # Same state
                return {"score": 7.0, "breakdown": "Same state/region"}
        
        # Remote work consideration
        if remote_allowed:
            return {"score": 6.0, "breakdown": "Remote work allowed"}
        
        return {"score": 3.0, "breakdown": "Location mismatch"}
    
    def _calculate_profile_completeness(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate profile completeness score.
        
        Args:
            candidate_data: Complete candidate profile data
            
        Returns:
            Dictionary with score and breakdown
        """
        required_fields = [
            "name", "headline", "location", "experience", 
            "education", "skills", "summary"
        ]
        
        optional_fields = [
            "certifications", "volunteer", "publications", 
            "patents", "awards", "languages"
        ]
        
        # Calculate required fields completeness
        required_complete = sum(1 for field in required_fields if candidate_data.get(field)) / len(required_fields)
        
        # Calculate optional fields bonus
        optional_bonus = sum(1 for field in optional_fields if candidate_data.get(field)) / len(optional_fields) * 0.5
        
        total_score = min(10.0, required_complete * 8.0 + optional_bonus * 2.0)
        
        breakdown = {
            "required_fields_complete": f"{required_complete:.2%}",
            "optional_fields_bonus": f"{optional_bonus:.2f}",
            "missing_required": [field for field in required_fields if not candidate_data.get(field)]
        }
        
        return {
            "score": round(total_score, 2),
            "breakdown": breakdown
        }
    
    def _calculate_final_score(self, scores: Dict[str, Dict]) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate final weighted score from all criteria.
        
        Args:
            scores: Dictionary of scores from each criterion
            
        Returns:
            Tuple of (final_score, detailed_breakdown)
        """
        final_score = 0
        breakdown = {}
        
        for criterion, weight in self.scoring_weights.items():
            if criterion in scores:
                score_data = scores[criterion]
                criterion_score = score_data.get("score", 0)
                final_score += criterion_score * weight
                breakdown[criterion] = {
                    "score": criterion_score,
                    "weight": weight,
                    "contribution": criterion_score * weight,
                    "details": score_data.get("breakdown", {})
                }
        
        return round(final_score, 2), breakdown
    
    def _determine_confidence_level(self, candidate_data: Dict[str, Any]) -> float:
        """
        Determine confidence level based on data completeness.
        
        Args:
            candidate_data: Complete candidate profile data
            
        Returns:
            Confidence level between 0.0 and 1.0
        """
        confidence_factors = {
            "has_linkedin_url": 0.2,
            "has_experience": 0.2,
            "has_education": 0.15,
            "has_skills": 0.15,
            "has_summary": 0.1,
            "has_location": 0.1,
            "has_headline": 0.1
        }
        
        confidence = 0.0
        for factor, weight in confidence_factors.items():
            if self._has_data_for_factor(candidate_data, factor):
                confidence += weight
        
        return min(1.0, confidence)
    
    def _parse_duration(self, duration: str) -> float:
        """Parse duration string to years"""
        try:
            if "year" in duration.lower():
                return float(duration.split()[0])
            elif "month" in duration.lower():
                return float(duration.split()[0]) / 12
            else:
                return 1.0
        except:
            return 1.0
    
    def _calculate_title_relevance(self, candidate_title: str, job_title: str) -> float:
        """Calculate relevance between job titles"""
        # Simple keyword matching (could be enhanced with NLP)
        candidate_words = set(candidate_title.lower().split())
        job_words = set(job_title.lower().split())
        
        if not job_words:
            return 0.0
        
        intersection = candidate_words & job_words
        return len(intersection) / len(job_words)
    
    def _has_data_for_factor(self, candidate_data: Dict[str, Any], factor: str) -> bool:
        """Check if candidate has data for a specific factor"""
        factor_mapping = {
            "has_linkedin_url": "linkedin_url",
            "has_experience": "experience",
            "has_education": "education",
            "has_skills": "skills",
            "has_summary": "summary",
            "has_location": "location",
            "has_headline": "headline"
        }
        
        field = factor_mapping.get(factor)
        if not field:
            return False
        
        data = candidate_data.get(field)
        if isinstance(data, list):
            return len(data) > 0
        elif isinstance(data, str):
            return len(data.strip()) > 0
        else:
            return bool(data)

    def run(self, candidates: List[Dict[str, Any]], job: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Score each candidate with a mock fit score and breakdown.
        """
        # TODO: Implement real scoring logic
        print(f"[ScoringAgent] Scoring {len(candidates)} candidates for job: {job.get('title')}")
        for c in candidates:
            c["score"] = 8.5 if "FastAPI" in c.get("skills", []) else 7.0
            c["breakdown"] = {"skills": "Good match" if "FastAPI" in c.get("skills", []) else "Partial match"}
        return candidates 

# --- Public helper for pipeline ---
def score_profiles(candidate: Dict[str, Any], job: Dict[str, Any]) -> Tuple[float, Dict[str, Any], float]:
    """Compute fit score, breakdown, and confidence for a single candidate.

    Parameters
    ----------
    candidate : Dict[str, Any]
        Candidate profile dictionary.
    job : Dict[str, Any]
        Job requirement dictionary.

    Returns
    -------
    Tuple[float, Dict[str, Any], float]
        (final_score, detailed_breakdown, confidence_level)
    """
    scorer = ScoringAgent()

    # Gather individual criterion scores
    scores = {
        "skills_match": scorer._evaluate_skills_match(
            candidate.get("skills", []),
            job.get("skills", []),
        ),
        "experience_relevance": scorer._assess_experience_relevance(
            candidate.get("companies", []),
            job.get("title", ""),
            job.get("required_years", 0),
        ),
        "education": scorer._evaluate_education(candidate.get("education", [])),
        "company_prestige": scorer._assess_company_prestige(candidate.get("companies", [])),
        "location_fit": scorer._evaluate_location_fit(
            candidate.get("location", ""),
            job.get("location", ""),
            job.get("remote", False),
        ),
        "profile_completeness": scorer._calculate_profile_completeness(candidate),
    }

    # Final weighted score & breakdown
    final_score, detailed_breakdown = scorer._calculate_final_score(scores)
    confidence = scorer._determine_confidence_level(candidate)

    return final_score, detailed_breakdown, confidence 