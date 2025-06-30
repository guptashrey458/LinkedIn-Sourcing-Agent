"""
EnrichmentAgent

This agent enhances candidate profiles by gathering additional data from multiple sources
including GitHub, Twitter, personal websites, and other professional platforms.
"""

from crewai import Agent
from typing import Dict, List, Any, Optional
import logging
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class EnrichmentAgent:
    """
    Agent responsible for enriching candidate profiles with additional data.
    
    This agent:
    1. Searches for candidate's GitHub profile
    2. Finds Twitter/social media presence
    3. Discovers personal websites and blogs
    4. Gathers additional professional information
    5. Enhances scoring with enriched data
    """
    
    def __init__(self, llm_model=None):
        self.llm_model = llm_model or "gpt-4"
        
    def create_agent(self) -> Agent:
        """Create the EnrichmentAgent"""
        
        return Agent(
            role="Data Enrichment Specialist",
            goal="Enhance candidate profiles by gathering comprehensive data from multiple sources including GitHub, Twitter, and professional platforms to improve scoring accuracy",
            backstory="""You are a data scientist and research specialist with expertise in gathering 
            comprehensive candidate information from multiple sources. You understand how to find 
            GitHub profiles, social media presence, personal websites, and other professional data 
            that can provide deeper insights into a candidate's technical abilities, interests, 
            and professional reputation.""",
            
            verbose=True,
            allow_delegation=False,
            
            tools=[
                self._find_github_profile,
                self._search_twitter_presence,
                self._discover_personal_websites,
                self._analyze_github_activity,
                self._extract_social_insights,
                self._calculate_enrichment_score,
                self._merge_enrichment_data
            ]
        )
    
    def _find_github_profile(self, candidate_name: str, candidate_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Find candidate's GitHub profile using various search strategies.
        
        Args:
            candidate_name: Candidate's full name
            candidate_data: Existing candidate data
            
        Returns:
            GitHub profile data or None
        """
        github_data = {
            "username": None,
            "profile_url": None,
            "repos_count": 0,
            "followers": 0,
            "top_languages": [],
            "recent_activity": [],
            "contribution_graph": {},
            "found": False
        }
        
        # Search strategies
        search_queries = self._generate_github_search_queries(candidate_name, candidate_data)
        
        # TODO: Implement GitHub API search
        # For now, return mock data
        if "john" in candidate_name.lower() or "sarah" in candidate_name.lower():
            github_data.update({
                "username": f"{candidate_name.lower().replace(' ', '')}",
                "profile_url": f"https://github.com/{candidate_name.lower().replace(' ', '')}",
                "repos_count": 15,
                "followers": 45,
                "top_languages": ["Python", "JavaScript", "Go"],
                "recent_activity": ["Updated repo: ml-project", "Created: api-service"],
                "found": True
            })
        
        logger.info(f"GitHub search for {candidate_name}: {'Found' if github_data['found'] else 'Not found'}")
        return github_data if github_data['found'] else None
    
    def _search_twitter_presence(self, candidate_name: str, candidate_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Search for candidate's Twitter/social media presence.
        
        Args:
            candidate_name: Candidate's full name
            candidate_data: Existing candidate data
            
        Returns:
            Twitter data or None
        """
        twitter_data = {
            "username": None,
            "profile_url": None,
            "followers": 0,
            "following": 0,
            "tweets_count": 0,
            "recent_tweets": [],
            "topics": [],
            "found": False
        }
        
        # Search strategies
        search_queries = self._generate_twitter_search_queries(candidate_name, candidate_data)
        
        # TODO: Implement Twitter API search
        # For now, return mock data
        if "john" in candidate_name.lower() or "sarah" in candidate_name.lower():
            twitter_data.update({
                "username": f"@{candidate_name.lower().replace(' ', '')}",
                "profile_url": f"https://twitter.com/{candidate_name.lower().replace(' ', '')}",
                "followers": 1200,
                "following": 450,
                "tweets_count": 850,
                "recent_tweets": ["Excited about the new ML project!", "Great conference on AI today"],
                "topics": ["AI", "Machine Learning", "Tech"],
                "found": True
            })
        
        logger.info(f"Twitter search for {candidate_name}: {'Found' if twitter_data['found'] else 'Not found'}")
        return twitter_data if twitter_data['found'] else None
    
    def _discover_personal_websites(self, candidate_name: str, candidate_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Discover candidate's personal websites and blogs.
        
        Args:
            candidate_name: Candidate's full name
            candidate_data: Existing candidate data
            
        Returns:
            List of discovered websites
        """
        websites = []
        
        # Search strategies
        search_queries = self._generate_website_search_queries(candidate_name, candidate_data)
        
        # TODO: Implement web search
        # For now, return mock data
        if "john" in candidate_name.lower() or "sarah" in candidate_name.lower():
            websites = [
                {
                    "url": f"https://{candidate_name.lower().replace(' ', '')}.com",
                    "type": "personal_blog",
                    "title": f"{candidate_name}'s Tech Blog",
                    "description": "Personal blog about software engineering and AI",
                    "last_updated": "2024-01-15"
                },
                {
                    "url": f"https://medium.com/@{candidate_name.lower().replace(' ', '')}",
                    "type": "medium_blog",
                    "title": "Medium Articles",
                    "description": "Technical articles and tutorials",
                    "last_updated": "2024-01-10"
                }
            ]
        
        logger.info(f"Website discovery for {candidate_name}: Found {len(websites)} sites")
        return websites
    
    def _analyze_github_activity(self, github_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze GitHub activity and contributions.
        
        Args:
            github_data: GitHub profile data
            
        Returns:
            Analysis results
        """
        if not github_data or not github_data.get("found"):
            return {"score": 0, "insights": []}
        
        analysis = {
            "activity_score": 0,
            "contribution_quality": 0,
            "technical_expertise": 0,
            "community_engagement": 0,
            "insights": []
        }
        
        # Analyze repos count
        repos_count = github_data.get("repos_count", 0)
        if repos_count > 20:
            analysis["activity_score"] = 9
            analysis["insights"].append("Very active GitHub user with many repositories")
        elif repos_count > 10:
            analysis["activity_score"] = 7
            analysis["insights"].append("Active GitHub user with good repository count")
        elif repos_count > 5:
            analysis["activity_score"] = 5
            analysis["insights"].append("Moderate GitHub activity")
        else:
            analysis["activity_score"] = 3
            analysis["insights"].append("Limited GitHub activity")
        
        # Analyze followers
        followers = github_data.get("followers", 0)
        if followers > 100:
            analysis["community_engagement"] = 9
            analysis["insights"].append("Strong community presence")
        elif followers > 50:
            analysis["community_engagement"] = 7
            analysis["insights"].append("Good community engagement")
        elif followers > 20:
            analysis["community_engagement"] = 5
            analysis["insights"].append("Moderate community engagement")
        else:
            analysis["community_engagement"] = 3
            analysis["insights"].append("Limited community engagement")
        
        # Analyze programming languages
        languages = github_data.get("top_languages", [])
        if languages:
            analysis["technical_expertise"] = min(10, len(languages) * 2)
            analysis["insights"].append(f"Proficient in {', '.join(languages)}")
        
        # Calculate overall score
        analysis["overall_score"] = (
            analysis["activity_score"] * 0.3 +
            analysis["contribution_quality"] * 0.3 +
            analysis["technical_expertise"] * 0.2 +
            analysis["community_engagement"] * 0.2
        )
        
        return analysis
    
    def _extract_social_insights(self, twitter_data: Dict[str, Any], websites: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract insights from social media and website data.
        
        Args:
            twitter_data: Twitter profile data
            websites: List of discovered websites
            
        Returns:
            Social insights
        """
        insights = {
            "professional_presence": 0,
            "content_quality": 0,
            "industry_engagement": 0,
            "thought_leadership": 0,
            "insights": []
        }
        
        # Analyze Twitter presence
        if twitter_data and twitter_data.get("found"):
            followers = twitter_data.get("followers", 0)
            tweets_count = twitter_data.get("tweets_count", 0)
            
            if followers > 1000:
                insights["professional_presence"] = 8
                insights["insights"].append("Strong professional social media presence")
            elif followers > 500:
                insights["professional_presence"] = 6
                insights["insights"].append("Good professional social media presence")
            elif followers > 100:
                insights["professional_presence"] = 4
                insights["insights"].append("Moderate social media presence")
            
            # Analyze tweet topics
            topics = twitter_data.get("topics", [])
            if topics:
                insights["industry_engagement"] = min(10, len(topics) * 2)
                insights["insights"].append(f"Engages with topics: {', '.join(topics)}")
        
        # Analyze website content
        if websites:
            insights["content_quality"] = min(10, len(websites) * 3)
            insights["insights"].append(f"Maintains {len(websites)} professional websites/blogs")
            
            # Check for technical content
            technical_keywords = ["tech", "software", "ai", "ml", "programming", "engineering"]
            for website in websites:
                description = website.get("description", "").lower()
                if any(keyword in description for keyword in technical_keywords):
                    insights["thought_leadership"] = 8
                    insights["insights"].append("Shares technical knowledge and insights")
                    break
        
        # Calculate overall score
        insights["overall_score"] = (
            insights["professional_presence"] * 0.3 +
            insights["content_quality"] * 0.3 +
            insights["industry_engagement"] * 0.2 +
            insights["thought_leadership"] * 0.2
        )
        
        return insights
    
    def _calculate_enrichment_score(self, github_analysis: Dict[str, Any], social_insights: Dict[str, Any]) -> float:
        """
        Calculate overall enrichment score.
        
        Args:
            github_analysis: GitHub activity analysis
            social_insights: Social media insights
            
        Returns:
            Overall enrichment score (0-10)
        """
        github_score = github_analysis.get("overall_score", 0)
        social_score = social_insights.get("overall_score", 0)
        
        # Weight GitHub more heavily for technical roles
        overall_score = (github_score * 0.7) + (social_score * 0.3)
        
        return round(overall_score, 2)
    
    def _merge_enrichment_data(self, candidate_data: Dict[str, Any], enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge enrichment data with existing candidate data.
        
        Args:
            candidate_data: Original candidate data
            enrichment_data: Enriched data from various sources
            
        Returns:
            Merged candidate data
        """
        merged_data = candidate_data.copy()
        
        # Add GitHub data
        if enrichment_data.get("github"):
            merged_data["github_data"] = enrichment_data["github"]
            merged_data["github_analysis"] = enrichment_data.get("github_analysis", {})
        
        # Add Twitter data
        if enrichment_data.get("twitter"):
            merged_data["twitter_data"] = enrichment_data["twitter"]
        
        # Add website data
        if enrichment_data.get("websites"):
            merged_data["websites"] = enrichment_data["websites"]
        
        # Add social insights
        if enrichment_data.get("social_insights"):
            merged_data["social_insights"] = enrichment_data["social_insights"]
        
        # Add enrichment score
        if enrichment_data.get("enrichment_score"):
            merged_data["enrichment_score"] = enrichment_data["enrichment_score"]
        
        return merged_data
    
    def _generate_github_search_queries(self, candidate_name: str, candidate_data: Dict[str, Any]) -> List[str]:
        """Generate search queries for GitHub profile discovery"""
        queries = []
        
        # Name-based searches
        name_parts = candidate_name.split()
        if len(name_parts) >= 2:
            queries.append(f"{name_parts[0]} {name_parts[1]}")
            queries.append(f"{name_parts[0]}{name_parts[1]}")
            queries.append(f"{name_parts[1]}{name_parts[0]}")
        
        # Company-based searches
        companies = candidate_data.get("experience", [])
        for company in companies:
            company_name = company.get("name", "")
            if company_name:
                queries.append(f"{candidate_name} {company_name}")
        
        return queries
    
    def _generate_twitter_search_queries(self, candidate_name: str, candidate_data: Dict[str, Any]) -> List[str]:
        """Generate search queries for Twitter profile discovery"""
        queries = []
        
        # Name-based searches
        name_parts = candidate_name.split()
        if len(name_parts) >= 2:
            queries.append(f"{name_parts[0]} {name_parts[1]}")
            queries.append(f"@{name_parts[0]}{name_parts[1]}")
            queries.append(f"@{name_parts[1]}{name_parts[0]}")
        
        # Company-based searches
        companies = candidate_data.get("experience", [])
        for company in companies:
            company_name = company.get("name", "")
            if company_name:
                queries.append(f"{candidate_name} {company_name}")
        
        return queries
    
    def _generate_website_search_queries(self, candidate_name: str, candidate_data: Dict[str, Any]) -> List[str]:
        """Generate search queries for website discovery"""
        queries = []
        
        # Name-based searches
        name_parts = candidate_name.split()
        if len(name_parts) >= 2:
            queries.append(f'"{candidate_name}" personal website')
            queries.append(f'"{candidate_name}" blog')
            queries.append(f'"{candidate_name}" portfolio')
        
        # Company-based searches
        companies = candidate_data.get("experience", [])
        for company in companies:
            company_name = company.get("name", "")
            if company_name:
                queries.append(f'"{candidate_name}" {company_name}')
        
        return queries

    def run(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich each candidate with mock GitHub data.
        """
        # TODO: Integrate with GitHub/Twitter APIs
        print(f"[EnrichmentAgent] Enriching {len(candidates)} candidates...")
        for c in candidates:
            c["github"] = {"repos": 3, "followers": 42}
        return candidates 

# --- Public helper for pipeline ---
async def enrich_profiles(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Asynchronous wrapper that enriches candidate profiles.

    This thin helper is used by the main pipeline so that it can simply
    `await enrich_profiles(candidates)` regardless of whether the underlying
    enrichment implementation is synchronous or asynchronous.
    """
    # The current `EnrichmentAgent.run` implementation is synchronous, so run
    # it in a thread-pool executor to avoid blocking the event loop.
    loop = asyncio.get_event_loop()
    agent = EnrichmentAgent()
    return await loop.run_in_executor(None, agent.run, candidates) 