"""
Enhanced pipeline.py with proper error handling, logging, and validation
"""
from fastapi import FastAPI
from pydantic import BaseModel
import logging
from typing import Dict, List, Optional
from pprint import pprint

from linkedin_sourcing_pipeline.agents import (
    DiscoveryAgent, 
    EnrichmentAgent, 
    ScoringAgent, 
    MessagingAgent
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PipelineError(Exception):
    """Custom exception for pipeline errors"""
    pass

class LinkedInSourcingPipeline:
    """Main pipeline orchestrator with error handling and validation"""
    
    def __init__(self):
        self.discovery_agent = DiscoveryAgent()
        self.enrichment_agent = EnrichmentAgent()
        self.scoring_agent = ScoringAgent()
        self.messaging_agent = MessagingAgent()
        
    def validate_job_description(self, job: Dict) -> None:
        """Validate job description has required fields"""
        required_fields = ['title', 'company', 'description', 'requirements']
        missing_fields = [field for field in required_fields if not job.get(field)]
        
        if missing_fields:
            raise PipelineError(f"Missing required job fields: {missing_fields}")
            
    def validate_candidates(self, candidates: List[Dict]) -> None:
        """Validate candidates have required fields"""
        if not candidates:
            raise PipelineError("No candidates found")
            
        required_fields = ['name', 'linkedin_url']
        for i, candidate in enumerate(candidates):
            missing_fields = [field for field in required_fields if not candidate.get(field)]
            if missing_fields:
                logger.warning(f"Candidate {i} missing fields: {missing_fields}")
    
    def run(self, job_description: Dict) -> Dict:
        """
        Run the complete sourcing pipeline with error handling
        
        Args:
            job_description: Dict containing job requirements
            
        Returns:
            Dict with pipeline results and metadata
        """
        pipeline_results = {
            'job': job_description,
            'candidates': [],
            'top_candidate': None,
            'message': None,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Validate input
            logger.info("Starting LinkedIn sourcing pipeline")
            self.validate_job_description(job_description)
            
            # Step 1: Discovery
            logger.info("Step 1: Running candidate discovery")
            try:
                candidates = self.discovery_agent.run(job_description)
                self.validate_candidates(candidates)
                pipeline_results['candidates'] = candidates
                logger.info(f"Found {len(candidates)} candidates")
            except Exception as e:
                error_msg = f"Discovery failed: {str(e)}"
                logger.error(error_msg)
                pipeline_results['errors'].append(error_msg)
                return pipeline_results
            
            # Step 2: Enrichment
            logger.info("Step 2: Running candidate enrichment")
            try:
                enriched_candidates = self.enrichment_agent.run(candidates)
                pipeline_results['candidates'] = enriched_candidates
                logger.info(f"Enriched {len(enriched_candidates)} candidates")
            except Exception as e:
                error_msg = f"Enrichment failed: {str(e)}"
                logger.error(error_msg)
                pipeline_results['errors'].append(error_msg)
                # Continue with original candidates
                enriched_candidates = candidates
            
            # Step 3: Scoring
            logger.info("Step 3: Running candidate scoring")
            try:
                scored_candidates = self.scoring_agent.run(enriched_candidates, job_description)
                pipeline_results['candidates'] = scored_candidates
                logger.info(f"Scored {len(scored_candidates)} candidates")
            except Exception as e:
                error_msg = f"Scoring failed: {str(e)}"
                logger.error(error_msg)
                pipeline_results['errors'].append(error_msg)
                return pipeline_results
            
            # Step 4: Select top candidate
            logger.info("Step 4: Selecting top candidate")
            try:
                if scored_candidates:
                    top_candidate = max(scored_candidates, key=lambda x: x.get('score', 0))
                    pipeline_results['top_candidate'] = top_candidate
                    logger.info(f"Top candidate: {top_candidate.get('name')} (score: {top_candidate.get('score')})")
                else:
                    raise PipelineError("No candidates available for selection")
            except Exception as e:
                error_msg = f"Candidate selection failed: {str(e)}"
                logger.error(error_msg)
                pipeline_results['errors'].append(error_msg)
                return pipeline_results
            
            # Step 5: Generate message
            logger.info("Step 5: Generating personalized message")
            try:
                message = self.messaging_agent.run(top_candidate, job_description)
                pipeline_results['message'] = message
                logger.info("Message generated successfully")
            except Exception as e:
                error_msg = f"Message generation failed: {str(e)}"
                logger.error(error_msg)
                pipeline_results['errors'].append(error_msg)
            
            logger.info("Pipeline completed successfully")
            return pipeline_results
            
        except Exception as e:
            error_msg = f"Pipeline failed: {str(e)}"
            logger.error(error_msg)
            pipeline_results['errors'].append(error_msg)
            return pipeline_results

def main():
    """Demo the enhanced pipeline"""
    # Mock job description with all required fields
    job_description = {
        "title": "Senior Python Developer",
        "company": "Tech Innovations Inc.",
        "description": "We are looking for a Senior Python Developer to join our team...",
        "requirements": [
            "5+ years Python experience",
            "Experience with Django/Flask",
            "Strong problem-solving skills",
            "Team collaboration experience"
        ],
        "location": "San Francisco, CA",
        "salary_range": "$120k - $180k"
    }
    
    # Run pipeline
    pipeline = LinkedInSourcingPipeline()
    results = pipeline.run(job_description)
    
    # Display results
    print("\n" + "="*50)
    print("PIPELINE RESULTS")
    print("="*50)
    
    if results['errors']:
        print(f"\n❌ ERRORS ({len(results['errors'])}):")
        for error in results['errors']:
            print(f"  • {error}")
    
    if results['warnings']:
        print(f"\n⚠️  WARNINGS ({len(results['warnings'])}):")
        for warning in results['warnings']:
            print(f"  • {warning}")
    
    print(f"\n📊 CANDIDATES FOUND: {len(results['candidates'])}")
    if results['candidates']:
        print("Candidates:")
        for i, candidate in enumerate(results['candidates'], 1):
            score = candidate.get('score', 'N/A')
            print(f"  {i}. {candidate['name']} (Score: {score})")
    
    if results['top_candidate']:
        print(f"\n🏆 TOP CANDIDATE:")
        print(f"  Name: {results['top_candidate']['name']}")
        print(f"  Score: {results['top_candidate'].get('score', 'N/A')}")
        print(f"  LinkedIn: {results['top_candidate']['linkedin_url']}")
    
    if results['message']:
        print(f"\n💬 GENERATED MESSAGE:")
        print(f"  {results['message']}")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    main()