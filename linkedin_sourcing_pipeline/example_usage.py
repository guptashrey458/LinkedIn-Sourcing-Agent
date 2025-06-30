"""
Example usage of the LinkedIn Sourcing Pipeline with Coresignal Client

This script demonstrates how to use the Coresignal client and pipeline
for candidate sourcing with both mock and real data.
"""

import asyncio
import os
import logging
from typing import Dict, Any

from .coresignal_client import create_coresignal_client, SearchFilters
from .pipeline import run_job_pipeline, run_batch_pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def example_single_job():
    """Example of running pipeline for a single job"""
    
    # Sample job requirements
    job = {
        "job_id": "job_001",
        "title": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "skills": ["Python", "React", "AWS", "Docker"],
        "company": "TechCorp",
        "remote": True,
        "description": "We're looking for a senior software engineer to join our team..."
    }
    
    logger.info("Running pipeline for single job...")
    result = await run_job_pipeline(job)
    
    print(f"\n=== Pipeline Results ===")
    print(f"Job ID: {result['job_id']}")
    print(f"Success: {result['success']}")
    print(f"Total candidates processed: {result['total_candidates_processed']}")
    print(f"Top candidates found: {len(result['top_candidates'])}")
    
    if result['top_candidates']:
        print(f"\n=== Top 3 Candidates ===")
        for i, candidate in enumerate(result['top_candidates'][:3], 1):
            print(f"{i}. {candidate['name']} - {candidate['headline']}")
            print(f"   Fit Score: {candidate['fit_score']}")
            print(f"   Location: {candidate['location']}")
            print(f"   Skills: {', '.join(candidate['skills'][:3])}")
            print()
    
    return result

async def example_batch_jobs():
    """Example of running pipeline for multiple jobs"""
    
    # Sample batch of jobs
    jobs = [
        {
            "job_id": "job_001",
            "title": "Senior Software Engineer",
            "location": "San Francisco, CA",
            "skills": ["Python", "React", "AWS"],
            "company": "TechCorp"
        },
        {
            "job_id": "job_002",
            "title": "DevOps Engineer",
            "location": "Remote",
            "skills": ["Docker", "Kubernetes", "AWS"],
            "company": "CloudTech"
        },
        {
            "job_id": "job_003",
            "title": "Product Manager",
            "location": "New York, NY",
            "skills": ["Product Strategy", "Agile", "Data Analysis"],
            "company": "ProductHub"
        }
    ]
    
    logger.info("Running batch pipeline...")
    results = await run_batch_pipeline(jobs)
    
    print(f"\n=== Batch Pipeline Results ===")
    successful_jobs = [r for r in results if r['success']]
    print(f"Successful jobs: {len(successful_jobs)}/{len(results)}")
    
    for result in results:
        print(f"\nJob {result['job_id']}: {result['job_title']}")
        print(f"  Success: {result['success']}")
        print(f"  Candidates found: {len(result['top_candidates'])}")
        if result['top_candidates']:
            top_candidate = result['top_candidates'][0]
            print(f"  Top candidate: {top_candidate['name']} (Score: {top_candidate['fit_score']})")
    
    return results

async def example_coresignal_client():
    """Example of using Coresignal client directly"""
    
    # Create client with mock data
    client = create_coresignal_client(use_mock_data=True)
    
    async with client:
        # Search for candidates
        filters = SearchFilters(
            title="Software Engineer",
            location="San Francisco",
            skills=["Python", "React"],
            limit=5
        )
        
        logger.info("Searching candidates with Coresignal client...")
        candidates = await client.search_candidates(filters)
        
        print(f"\n=== Coresignal Client Results ===")
        print(f"Found {len(candidates)} candidates")
        
        for i, candidate in enumerate(candidates, 1):
            print(f"{i}. {candidate['name']}")
            print(f"   {candidate['headline']}")
            print(f"   Location: {candidate['location']}")
            print(f"   Skills: {', '.join(candidate['skills'][:3])}")
            print()
        
        # Enrich a profile
        if candidates:
            linkedin_url = candidates[0]['linkedin_url']
            logger.info(f"Enriching profile: {linkedin_url}")
            enriched_data = await client.enrich_profile(linkedin_url)
            
            print(f"\n=== Profile Enrichment ===")
            print(f"GitHub repos: {enriched_data['github_data'].get('repos', 0)}")
            print(f"Twitter followers: {enriched_data['twitter_data'].get('followers', 0)}")
            print(f"Enrichment score: {enriched_data['enrichment_score']}")
        
        # Search for companies
        logger.info("Searching companies...")
        companies = await client.search_companies("Tech", limit=3)
        
        print(f"\n=== Company Search ===")
        for company in companies:
            print(f"- {company['name']} ({company['industry']})")
            print(f"  Location: {company['location']}")
            print(f"  Size: {company['size']}")

async def example_with_real_api():
    """Example of using real Coresignal API (requires API key)"""
    
    api_key = os.getenv("CORESIGNAL_API_KEY")
    if not api_key:
        logger.warning("No CORESIGNAL_API_KEY found. Using mock data instead.")
        return await example_coresignal_client()
    
    # Create client with real API
    client = create_coresignal_client(api_key=api_key, use_mock_data=False)
    
    async with client:
        filters = SearchFilters(
            title="Software Engineer",
            location="San Francisco",
            skills=["Python"],
            limit=3
        )
        
        logger.info("Searching candidates with real Coresignal API...")
        try:
            candidates = await client.search_candidates(filters)
            print(f"Found {len(candidates)} candidates from real API")
        except Exception as e:
            logger.error(f"API error: {e}")
            print("Falling back to mock data...")
            return await example_coresignal_client()

async def main():
    """Run all examples"""
    
    print("🚀 LinkedIn Sourcing Pipeline Examples")
    print("=" * 50)
    
    # Example 1: Single job pipeline
    print("\n1. Single Job Pipeline Example")
    print("-" * 30)
    await example_single_job()
    
    # Example 2: Batch job pipeline
    print("\n2. Batch Job Pipeline Example")
    print("-" * 30)
    await example_batch_jobs()
    
    # Example 3: Direct Coresignal client usage
    print("\n3. Coresignal Client Example")
    print("-" * 30)
    await example_coresignal_client()
    
    # Example 4: Real API usage (if available)
    print("\n4. Real API Example")
    print("-" * 30)
    await example_with_real_api()
    
    print("\n✅ All examples completed!")

if __name__ == "__main__":
    asyncio.run(main()) 