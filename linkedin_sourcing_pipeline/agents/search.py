import asyncio
from typing import List, Dict, Any

from ..coresignal_client import CoresignalClient, SearchFilters, create_coresignal_client

async def search_candidates(job: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Search for candidates using Coresignal API client
    
    Args:
        job: Dictionary containing job requirements with keys like:
             - title: Job title
             - location: Job location
             - skills: List of required skills
             - company: Company name (optional)
             - remote: Boolean indicating if remote work is allowed (optional)
    
    Returns:
        List of candidate dictionaries with profile information
    """
    
    # Create search filters from job requirements
    filters = SearchFilters(
        title=job.get("title"),
        location=job.get("location"),
        skills=job.get("skills"),
        company=job.get("company"),
        limit=job.get("limit", 10),
        offset=job.get("offset", 0)
    )
    
    # Create Coresignal client (will use mock data if configured)
    client = create_coresignal_client()
    
    try:
        # Use async context manager for proper resource management
        async with client:
            candidates = await client.search_candidates(filters)
            
            # Add search metadata
            search_metadata = {
                "total_results": len(candidates),
                "search_criteria": {
                    "title": job.get("title", "Software Engineer"),
                    "location": job.get("location", "United States"),
                    "skills": job.get("skills", []),
                    "company": job.get("company"),
                    "limit": filters.limit
                },
                "search_timestamp": asyncio.get_event_loop().time()
            }
            
            # Add metadata to each candidate
            for candidate in candidates:
                candidate["search_metadata"] = search_metadata
            
            return candidates
            
    except Exception as e:
        # Log error and return empty list as fallback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error searching candidates: {e}")
        return []

def _generate_mock_candidates(job: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate mock candidate data based on job requirements"""
    
    # Mock candidate templates based on different roles
    mock_candidates = [
        {
            "name": "Sarah Johnson",
            "linkedin_url": "https://linkedin.com/in/sarah-johnson-123",
            "headline": "Senior Software Engineer at TechCorp",
            "location": "San Francisco, CA",
            "education": [
                {"school": "Stanford University", "degree": "MS Computer Science", "year": 2018},
                {"school": "UC Berkeley", "degree": "BS Computer Science", "year": 2016}
            ],
            "companies": [
                {"name": "TechCorp", "title": "Senior Software Engineer", "duration": "2 years"},
                {"name": "StartupXYZ", "title": "Software Engineer", "duration": "3 years"},
                {"name": "BigTech Inc", "title": "Junior Developer", "duration": "1 year"}
            ],
            "skills": ["Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "Kubernetes"],
            "avg_tenure_years": 2.0,
            "profile_completeness": 0.95,
            "connection_count": 850,
            "endorsements": 45
        },
        {
            "name": "Michael Chen",
            "linkedin_url": "https://linkedin.com/in/michael-chen-456",
            "headline": "Full Stack Developer | React | Node.js | Python",
            "location": "New York, NY",
            "education": [
                {"school": "MIT", "degree": "BS Computer Science", "year": 2017}
            ],
            "companies": [
                {"name": "FinTech Solutions", "title": "Full Stack Developer", "duration": "3 years"},
                {"name": "Digital Innovations", "title": "Frontend Developer", "duration": "2 years"}
            ],
            "skills": ["React", "Node.js", "Python", "TypeScript", "MongoDB", "PostgreSQL", "GraphQL"],
            "avg_tenure_years": 2.5,
            "profile_completeness": 0.88,
            "connection_count": 650,
            "endorsements": 32
        },
        {
            "name": "Emily Rodriguez",
            "linkedin_url": "https://linkedin.com/in/emily-rodriguez-789",
            "headline": "Software Engineer specializing in Backend Development",
            "location": "Austin, TX",
            "education": [
                {"school": "University of Texas", "degree": "BS Computer Science", "year": 2019}
            ],
            "companies": [
                {"name": "CloudTech", "title": "Backend Engineer", "duration": "2 years"},
                {"name": "DataFlow Inc", "title": "Software Engineer", "duration": "1 year"}
            ],
            "skills": ["Python", "Java", "Spring Boot", "PostgreSQL", "Redis", "Kafka", "Docker"],
            "avg_tenure_years": 1.5,
            "profile_completeness": 0.92,
            "connection_count": 420,
            "endorsements": 28
        },
        {
            "name": "David Kim",
            "linkedin_url": "https://linkedin.com/in/david-kim-101",
            "headline": "Senior Frontend Developer | React | Vue.js | UI/UX",
            "location": "Seattle, WA",
            "education": [
                {"school": "University of Washington", "degree": "BS Computer Science", "year": 2016}
            ],
            "companies": [
                {"name": "WebSolutions", "title": "Senior Frontend Developer", "duration": "4 years"},
                {"name": "DesignStudio", "title": "Frontend Developer", "duration": "2 years"}
            ],
            "skills": ["React", "Vue.js", "JavaScript", "TypeScript", "CSS3", "SASS", "Webpack"],
            "avg_tenure_years": 3.0,
            "profile_completeness": 0.85,
            "connection_count": 720,
            "endorsements": 56
        },
        {
            "name": "Lisa Thompson",
            "linkedin_url": "https://linkedin.com/in/lisa-thompson-202",
            "headline": "DevOps Engineer | AWS | Kubernetes | CI/CD",
            "location": "Denver, CO",
            "education": [
                {"school": "Colorado State University", "degree": "BS Information Technology", "year": 2018}
            ],
            "companies": [
                {"name": "CloudOps", "title": "DevOps Engineer", "duration": "3 years"},
                {"name": "InfraTech", "title": "System Administrator", "duration": "2 years"}
            ],
            "skills": ["AWS", "Kubernetes", "Docker", "Jenkins", "Terraform", "Ansible", "Linux"],
            "avg_tenure_years": 2.5,
            "profile_completeness": 0.90,
            "connection_count": 380,
            "endorsements": 41
        },
        {
            "name": "Alex Martinez",
            "linkedin_url": "https://linkedin.com/in/alex-martinez-303",
            "headline": "Machine Learning Engineer | Python | TensorFlow | Data Science",
            "location": "Boston, MA",
            "education": [
                {"school": "Harvard University", "degree": "MS Data Science", "year": 2020},
                {"school": "Boston University", "degree": "BS Mathematics", "year": 2018}
            ],
            "companies": [
                {"name": "AITech", "title": "ML Engineer", "duration": "2 years"},
                {"name": "DataCorp", "title": "Data Scientist", "duration": "1 year"}
            ],
            "skills": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "SQL"],
            "avg_tenure_years": 1.5,
            "profile_completeness": 0.87,
            "connection_count": 290,
            "endorsements": 23
        },
        {
            "name": "Rachel Green",
            "linkedin_url": "https://linkedin.com/in/rachel-green-404",
            "headline": "Product Manager | Agile | User Experience | Strategy",
            "location": "Chicago, IL",
            "education": [
                {"school": "Northwestern University", "degree": "MBA", "year": 2019},
                {"school": "University of Illinois", "degree": "BS Engineering", "year": 2017}
            ],
            "companies": [
                {"name": "ProductHub", "title": "Senior Product Manager", "duration": "3 years"},
                {"name": "InnovateCorp", "title": "Product Manager", "duration": "2 years"}
            ],
            "skills": ["Product Strategy", "Agile", "User Research", "Data Analysis", "SQL", "Figma", "Jira"],
            "avg_tenure_years": 2.5,
            "profile_completeness": 0.93,
            "connection_count": 890,
            "endorsements": 67
        },
        {
            "name": "James Wilson",
            "linkedin_url": "https://linkedin.com/in/james-wilson-505",
            "headline": "Backend Engineer | Java | Microservices | Cloud Architecture",
            "location": "Portland, OR",
            "education": [
                {"school": "Oregon State University", "degree": "BS Computer Science", "year": 2017}
            ],
            "companies": [
                {"name": "MicroTech", "title": "Backend Engineer", "duration": "4 years"},
                {"name": "CodeCraft", "title": "Software Developer", "duration": "2 years"}
            ],
            "skills": ["Java", "Spring Boot", "Microservices", "AWS", "Docker", "Kafka", "MongoDB"],
            "avg_tenure_years": 3.0,
            "profile_completeness": 0.89,
            "connection_count": 540,
            "endorsements": 38
        },
        {
            "name": "Sophia Lee",
            "linkedin_url": "https://linkedin.com/in/sophia-lee-606",
            "headline": "Full Stack Developer | React | Node.js | TypeScript",
            "location": "Miami, FL",
            "education": [
                {"school": "University of Miami", "degree": "BS Computer Science", "year": 2020}
            ],
            "companies": [
                {"name": "WebDev Studio", "title": "Full Stack Developer", "duration": "2 years"},
                {"name": "StartupMiami", "title": "Junior Developer", "duration": "1 year"}
            ],
            "skills": ["React", "Node.js", "TypeScript", "MongoDB", "Express", "Git", "Heroku"],
            "avg_tenure_years": 1.5,
            "profile_completeness": 0.82,
            "connection_count": 320,
            "endorsements": 19
        },
        {
            "name": "Kevin O'Brien",
            "linkedin_url": "https://linkedin.com/in/kevin-obrien-707",
            "headline": "Senior Software Engineer | C++ | Systems Programming | Performance",
            "location": "San Diego, CA",
            "education": [
                {"school": "UC San Diego", "degree": "MS Computer Science", "year": 2018},
                {"school": "UC Irvine", "degree": "BS Computer Science", "year": 2016}
            ],
            "companies": [
                {"name": "SystemTech", "title": "Senior Software Engineer", "duration": "3 years"},
                {"name": "PerformanceCorp", "title": "Software Engineer", "duration": "2 years"}
            ],
            "skills": ["C++", "Python", "Linux", "Git", "CMake", "GDB", "Performance Optimization"],
            "avg_tenure_years": 2.5,
            "profile_completeness": 0.91,
            "connection_count": 480,
            "endorsements": 34
        }
    ]
    
    # Filter candidates based on job requirements if provided
    if job.get("skills"):
        required_skills = set(skill.lower() for skill in job["skills"])
        filtered_candidates = []
        
        for candidate in mock_candidates:
            candidate_skills = set(skill.lower() for skill in candidate["skills"])
            # Check if candidate has at least 2 matching skills
            if len(required_skills.intersection(candidate_skills)) >= 2:
                filtered_candidates.append(candidate)
        
        return filtered_candidates[:10]  # Return top 10 matches
    
    return mock_candidates[:10]
