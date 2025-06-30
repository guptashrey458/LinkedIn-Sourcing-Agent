"""
Coresignal API Client Module

This module provides a clean interface for interacting with the Coresignal API,
including candidate search, profile enrichment, and company data retrieval.
Supports both real API calls and mock data for development/testing.
"""

import os
import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

import httpx
from httpx import AsyncClient, TimeoutException, HTTPStatusError

# Configure logging
logger = logging.getLogger(__name__)

class CoresignalEndpoint(Enum):
    """Coresignal API endpoints"""
    CANDIDATE_SEARCH = "/v1/candidates/search"
    PROFILE_ENRICHMENT = "/v1/profiles/enrich"
    COMPANY_SEARCH = "/v1/companies/search"
    CONTACT_SEARCH = "/v1/contacts/search"

@dataclass
class CoresignalConfig:
    """Configuration for Coresignal API client"""
    api_key: str
    base_url: str = "https://api.coresignal.com"
    timeout: int = 30
    max_retries: int = 3
    rate_limit_delay: float = 1.0  # seconds between requests
    use_mock_data: bool = False

@dataclass
class SearchFilters:
    """Search filters for candidate search"""
    title: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    company: Optional[str] = None
    education: Optional[str] = None
    experience_years_min: Optional[int] = None
    experience_years_max: Optional[int] = None
    limit: int = 10
    offset: int = 0

class CoresignalRateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    pass

class CoresignalAPIError(Exception):
    """Raised when API returns an error"""
    def __init__(self, message: str, status_code: int, response_data: Dict[str, Any]):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)

class CoresignalClient:
    """
    Client for interacting with Coresignal API
    
    Provides methods for searching candidates, enriching profiles,
    and retrieving company information with proper error handling
    and rate limiting.
    """
    
    def __init__(self, config: Optional[CoresignalConfig] = None):
        """
        Initialize Coresignal client
        
        Args:
            config: Configuration object. If None, will use environment variables
        """
        if config is None:
            config = self._load_config_from_env()
        
        self.config = config
        self._last_request_time = 0
        self._session: Optional[AsyncClient] = None
        
        logger.info(f"Coresignal client initialized with base URL: {config.base_url}")
        if config.use_mock_data:
            logger.info("Using mock data mode")
    
    def _load_config_from_env(self) -> CoresignalConfig:
        """Load configuration from environment variables"""
        return CoresignalConfig(
            api_key=os.getenv("CORESIGNAL_API_KEY", ""),
            base_url=os.getenv("CORESIGNAL_BASE_URL", "https://api.coresignal.com"),
            timeout=int(os.getenv("CORESIGNAL_TIMEOUT", "30")),
            max_retries=int(os.getenv("CORESIGNAL_MAX_RETRIES", "3")),
            rate_limit_delay=float(os.getenv("CORESIGNAL_RATE_LIMIT_DELAY", "1.0")),
            use_mock_data=os.getenv("CORESIGNAL_USE_MOCK", "false").lower() == "true"
        )
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def _ensure_session(self):
        """Ensure HTTP session is created"""
        if self._session is None:
            self._session = AsyncClient(
                base_url=self.config.base_url,
                timeout=self.config.timeout,
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "User-Agent": "LinkedIn-Sourcing-Agent/1.0",
                    "Content-Type": "application/json"
                }
            )
    
    async def close(self):
        """Close the HTTP session"""
        if self._session:
            await self._session.aclose()
            self._session = None
    
    async def _rate_limit_delay(self):
        """Implement rate limiting between requests"""
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self._last_request_time
        
        if time_since_last < self.config.rate_limit_delay:
            delay = self.config.rate_limit_delay - time_since_last
            await asyncio.sleep(delay)
        
        self._last_request_time = asyncio.get_event_loop().time()
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Coresignal API with retry logic
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            data: Request body data
            
        Returns:
            API response data
            
        Raises:
            CoresignalAPIError: When API returns an error
            CoresignalRateLimitError: When rate limit is exceeded
        """
        await self._ensure_session()
        await self._rate_limit_delay()
        
        for attempt in range(self.config.max_retries):
            try:
                logger.debug(f"Making {method} request to {endpoint} (attempt {attempt + 1})")
                
                response = await self._session.request(
                    method=method,
                    url=endpoint,
                    params=params,
                    json=data
                )
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    logger.warning(f"Rate limit exceeded. Waiting {retry_after} seconds")
                    await asyncio.sleep(retry_after)
                    continue
                
                # Handle other errors
                response.raise_for_status()
                
                return response.json()
                
            except TimeoutException as e:
                logger.warning(f"Request timeout on attempt {attempt + 1}: {e}")
                if attempt == self.config.max_retries - 1:
                    raise CoresignalAPIError("Request timeout", 408, {})
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                
            except HTTPStatusError as e:
                logger.error(f"HTTP error {e.response.status_code}: {e}")
                if e.response.status_code == 429:
                    raise CoresignalRateLimitError(f"Rate limit exceeded: {e}")
                else:
                    raise CoresignalAPIError(
                        f"API error: {e}",
                        e.response.status_code,
                        e.response.json() if e.response.content else {}
                    )
                
            except Exception as e:
                logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt == self.config.max_retries - 1:
                    raise CoresignalAPIError(f"Request failed: {e}", 500, {})
                await asyncio.sleep(2 ** attempt)
        
        raise CoresignalAPIError("Max retries exceeded", 500, {})
    
    async def search_candidates(self, filters: SearchFilters) -> List[Dict[str, Any]]:
        """
        Search for candidates using Coresignal API
        
        Args:
            filters: Search filters and criteria
            
        Returns:
            List of candidate profiles
        """
        if self.config.use_mock_data:
            return await self._get_mock_candidates(filters)
        
        # Build API parameters
        params = {
            "limit": filters.limit,
            "offset": filters.offset
        }
        
        if filters.title:
            params["title"] = filters.title
        if filters.location:
            params["location"] = filters.location
        if filters.skills:
            params["skills"] = ",".join(filters.skills)
        if filters.company:
            params["company"] = filters.company
        if filters.education:
            params["education"] = filters.education
        if filters.experience_years_min:
            params["experience_years_min"] = filters.experience_years_min
        if filters.experience_years_max:
            params["experience_years_max"] = filters.experience_years_max
        
        try:
            response_data = await self._make_request(
                method="GET",
                endpoint=CoresignalEndpoint.CANDIDATE_SEARCH.value,
                params=params
            )
            
            candidates = []
            for item in response_data.get("results", []):
                candidate = self._parse_candidate_data(item)
                candidates.append(candidate)
            
            logger.info(f"Found {len(candidates)} candidates for search criteria")
            return candidates
            
        except Exception as e:
            logger.error(f"Error searching candidates: {e}")
            raise
    
    async def enrich_profile(self, linkedin_url: str) -> Dict[str, Any]:
        """
        Enrich a candidate profile with additional data
        
        Args:
            linkedin_url: LinkedIn profile URL
            
        Returns:
            Enriched profile data
        """
        if self.config.use_mock_data:
            return await self._get_mock_enrichment(linkedin_url)
        
        try:
            response_data = await self._make_request(
                method="POST",
                endpoint=CoresignalEndpoint.PROFILE_ENRICHMENT.value,
                data={"linkedin_url": linkedin_url}
            )
            
            enriched_data = self._parse_enrichment_data(response_data)
            logger.info(f"Enriched profile for {linkedin_url}")
            return enriched_data
            
        except Exception as e:
            logger.error(f"Error enriching profile {linkedin_url}: {e}")
            raise
    
    async def search_companies(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for companies using Coresignal API
        
        Args:
            query: Company search query
            limit: Maximum number of results
            
        Returns:
            List of company profiles
        """
        if self.config.use_mock_data:
            return await self._get_mock_companies(query, limit)
        
        try:
            response_data = await self._make_request(
                method="GET",
                endpoint=CoresignalEndpoint.COMPANY_SEARCH.value,
                params={"query": query, "limit": limit}
            )
            
            companies = []
            for item in response_data.get("results", []):
                company = self._parse_company_data(item)
                companies.append(company)
            
            logger.info(f"Found {len(companies)} companies for query: {query}")
            return companies
            
        except Exception as e:
            logger.error(f"Error searching companies: {e}")
            raise
    
    def _parse_candidate_data(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Parse candidate data from API response"""
        return {
            "name": item.get("name"),
            "linkedin_url": item.get("linkedinUrl"),
            "headline": item.get("headline"),
            "location": item.get("location"),
            "education": item.get("education", []),
            "companies": item.get("companies", []),
            "skills": item.get("skills", []),
            "avg_tenure_years": item.get("avgTenureYears", 0),
            "profile_completeness": item.get("profileCompleteness", 0),
            "connection_count": item.get("connectionCount", 0),
            "endorsements": item.get("endorsements", 0),
            "last_updated": item.get("lastUpdated"),
            "raw_data": item  # Keep original data for debugging
        }
    
    def _parse_enrichment_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse enrichment data from API response"""
        return {
            "github_data": data.get("github", {}),
            "twitter_data": data.get("twitter", {}),
            "blog_data": data.get("blog", {}),
            "additional_skills": data.get("additionalSkills", []),
            "certifications": data.get("certifications", []),
            "publications": data.get("publications", []),
            "enrichment_score": data.get("enrichmentScore", 0),
            "raw_data": data
        }
    
    def _parse_company_data(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Parse company data from API response"""
        return {
            "name": item.get("name"),
            "linkedin_url": item.get("linkedinUrl"),
            "website": item.get("website"),
            "industry": item.get("industry"),
            "size": item.get("size"),
            "location": item.get("location"),
            "description": item.get("description"),
            "founded_year": item.get("foundedYear"),
            "raw_data": item
        }
    
    # Mock data methods for development/testing
    async def _get_mock_candidates(self, filters: SearchFilters) -> List[Dict[str, Any]]:
        """Generate mock candidate data"""
        # Import mock data from search agent
        from .agents.search import _generate_mock_candidates
        
        # Convert SearchFilters to job dict format
        job = {
            "title": filters.title,
            "location": filters.location,
            "skills": filters.skills or [],
            "company": filters.company
        }
        
        candidates = _generate_mock_candidates(job)
        return candidates[:filters.limit]
    
    async def _get_mock_enrichment(self, linkedin_url: str) -> Dict[str, Any]:
        """Generate mock enrichment data"""
        return {
            "github_data": {
                "username": "mock_user",
                "repos": 15,
                "top_languages": ["Python", "JavaScript", "Go"],
                "stars": 45,
                "followers": 120
            },
            "twitter_data": {
                "username": "mock_twitter",
                "followers": 850,
                "tweets": 1200,
                "verified": True
            },
            "blog_data": {
                "url": "https://mock-blog.com",
                "posts": 25,
                "keywords": ["tech", "programming", "leadership"]
            },
            "additional_skills": ["Docker", "Kubernetes", "AWS"],
            "certifications": ["AWS Certified Developer", "Google Cloud Professional"],
            "publications": ["Building Scalable Systems", "Modern Web Development"],
            "enrichment_score": 0.85
        }
    
    async def _get_mock_companies(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Generate mock company data"""
        mock_companies = [
            {
                "name": "TechCorp",
                "linkedin_url": "https://linkedin.com/company/techcorp",
                "website": "https://techcorp.com",
                "industry": "Technology",
                "size": "500-1000",
                "location": "San Francisco, CA",
                "description": "Leading technology company",
                "founded_year": 2015
            },
            {
                "name": "InnovateSoft",
                "linkedin_url": "https://linkedin.com/company/innovatesoft",
                "website": "https://innovatesoft.com",
                "industry": "Software",
                "size": "100-500",
                "location": "Austin, TX",
                "description": "Innovative software solutions",
                "founded_year": 2018
            }
        ]
        
        # Filter by query if provided
        if query:
            filtered = [c for c in mock_companies if query.lower() in c["name"].lower()]
            return filtered[:limit]
        
        return mock_companies[:limit]

# Convenience function for creating client
def create_coresignal_client(
    api_key: Optional[str] = None,
    use_mock_data: bool = False,
    **kwargs
) -> CoresignalClient:
    """
    Create a Coresignal client with the given configuration
    
    Args:
        api_key: API key (if None, will use environment variable)
        use_mock_data: Whether to use mock data instead of real API calls
        **kwargs: Additional configuration options
        
    Returns:
        Configured CoresignalClient instance
    """
    if api_key is None:
        api_key = os.getenv("CORESIGNAL_API_KEY", "")
    
    config = CoresignalConfig(
        api_key=api_key,
        use_mock_data=use_mock_data,
        **kwargs
    )
    
    return CoresignalClient(config) 