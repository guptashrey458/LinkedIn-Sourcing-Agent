# linkedin_sourcing_pipeline/pipeline.py
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from .agents.search import search_candidates
from .agents.enrichment import enrich_profiles
from .agents.scoring import score_profiles
from .agents.messaging import generate_outreach_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_job_pipeline(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main pipeline for LinkedIn candidate sourcing
    
    Args:
        job: Dictionary containing job requirements with keys:
             - job_id: Unique job identifier
             - title: Job title
             - location: Job location
             - skills: List of required skills
             - remote: Boolean indicating if remote work is allowed
             - company: Company name
             - description: Job description (optional)
    
    Returns:
        Dictionary containing pipeline results with:
             - job_id: Job identifier
             - top_candidates: List of scored and ranked candidates
             - pipeline_metadata: Execution metadata
    """
    
    start_time = datetime.now()
    pipeline_metadata = {
        "start_time": start_time.isoformat(),
        "steps_completed": [],
        "errors": [],
        "candidate_counts": {}
    }
    
    try:
        logger.info(f"Starting pipeline for job: {job.get('job_id', 'unknown')}")
        
        # 1. Step: Search Candidates using Coresignal mock data
        logger.info("Step 1: Searching candidates...")
        try:
            candidates = await search_candidates(job)
            pipeline_metadata["candidate_counts"]["initial_search"] = len(candidates)
            pipeline_metadata["steps_completed"].append("search")
            logger.info(f"Found {len(candidates)} candidates in initial search")
        except Exception as e:
            logger.error(f"Error in search step: {str(e)}")
            pipeline_metadata["errors"].append(f"Search error: {str(e)}")
            candidates = []

        # 2. Step: Enrich Profiles (GitHub, blogs, etc.)
        logger.info("Step 2: Enriching candidate profiles...")
        try:
            
            enriched_candidates = await enrich_profiles(candidates)
            pipeline_metadata["candidate_counts"]["after_enrichment"] = len(enriched_candidates)
            pipeline_metadata["steps_completed"].append("enrichment")
            logger.info(f"Enriched {len(enriched_candidates)} candidate profiles")
        except Exception as e:
            logger.error(f"Error in enrichment step: {str(e)}")
            pipeline_metadata["errors"].append(f"Enrichment error: {str(e)}")
            enriched_candidates = candidates  # Fallback to original candidates

        # 3. Step: Score Candidates
        logger.info("Step 3: Scoring candidates...")
        scored_candidates = []
        try:
            for candidate in enriched_candidates:
                try:
                    score, breakdown, confidence = score_profiles(candidate, job)
                    candidate.update({
                        "fit_score": score,
                        "score_breakdown": breakdown,
                        "confidence": confidence,
                        "scored_at": datetime.now().isoformat()
                    })
                    scored_candidates.append(candidate)
                except Exception as e:
                    logger.warning(f"Error scoring candidate {candidate.get('name', 'unknown')}: {str(e)}")
                    # Add default scores for failed candidates
                    candidate.update({
                        "fit_score": 5.0,
                        "score_breakdown": {"error": "Scoring failed"},
                        "confidence": 0.5,
                        "scored_at": datetime.now().isoformat()
                    })
                    scored_candidates.append(candidate)
            
            pipeline_metadata["candidate_counts"]["after_scoring"] = len(scored_candidates)
            pipeline_metadata["steps_completed"].append("scoring")
            logger.info(f"Scored {len(scored_candidates)} candidates")
        except Exception as e:
            logger.error(f"Error in scoring step: {str(e)}")
            pipeline_metadata["errors"].append(f"Scoring error: {str(e)}")

        # 4. Step: Generate Outreach Messages for top N
        logger.info("Step 4: Generating outreach messages...")
        try:
            # Sort by fit score and get top candidates
            top_candidates = sorted(scored_candidates, key=lambda c: c.get("fit_score", 0), reverse=True)[:10]
            
            for candidate in top_candidates:
                try:
                    candidate["outreach_message"] = generate_outreach_message(candidate, job)
                    candidate["message_generated_at"] = datetime.now().isoformat()
                except Exception as e:
                    logger.warning(f"Error generating message for {candidate.get('name', 'unknown')}: {str(e)}")
                    candidate["outreach_message"] = f"Hi {candidate.get('name', 'there')}, I'd like to connect regarding a {job.get('title', 'opportunity')} at {job.get('company', 'our company')}."
                    candidate["message_generated_at"] = datetime.now().isoformat()
            
            pipeline_metadata["candidate_counts"]["final_top_candidates"] = len(top_candidates)
            pipeline_metadata["steps_completed"].append("messaging")
            logger.info(f"Generated outreach messages for {len(top_candidates)} top candidates")
        except Exception as e:
            logger.error(f"Error in messaging step: {str(e)}")
            pipeline_metadata["errors"].append(f"Messaging error: {str(e)}")
            top_candidates = scored_candidates[:10]  # Fallback to top 10 scored candidates

        # Calculate pipeline statistics
        end_time = datetime.now()
        pipeline_metadata.update({
            "end_time": end_time.isoformat(),
            "execution_time_seconds": (end_time - start_time).total_seconds(),
            "success_rate": len(pipeline_metadata["steps_completed"]) / 4,  # 4 total steps
            "avg_fit_score": sum(c.get("fit_score", 0) for c in top_candidates) / len(top_candidates) if top_candidates else 0
        })

        logger.info(f"Pipeline completed successfully. Found {len(top_candidates)} top candidates with average fit score of {pipeline_metadata['avg_fit_score']:.2f}")

        return {
            "job_id": job.get("job_id"),
            "job_title": job.get("title"),
            "company": job.get("company"),
            "top_candidates": top_candidates,
            "pipeline_metadata": pipeline_metadata,
            "total_candidates_processed": len(candidates),
            "success": len(pipeline_metadata["errors"]) == 0
        }

    except Exception as e:
        logger.error(f"Critical pipeline error: {str(e)}")
        pipeline_metadata["errors"].append(f"Critical error: {str(e)}")
        pipeline_metadata["end_time"] = datetime.now().isoformat()
        
        return {
            "job_id": job.get("job_id"),
            "top_candidates": [],
            "pipeline_metadata": pipeline_metadata,
            "total_candidates_processed": 0,
            "success": False,
            "error": str(e)
        }

async def run_batch_pipeline(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Run pipeline for multiple jobs concurrently
    
    Args:
        jobs: List of job dictionaries
    
    Returns:
        List of pipeline results for each job
    """
    logger.info(f"Starting batch pipeline for {len(jobs)} jobs")
    
    # Run pipelines concurrently with semaphore to limit concurrent executions
    semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent pipelines
    
    async def run_single_pipeline(job):
        async with semaphore:
            return await run_job_pipeline(job)
    
    # Execute all pipelines concurrently
    tasks = [run_single_pipeline(job) for job in jobs]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions that occurred
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Pipeline {i} failed with exception: {str(result)}")
            processed_results.append({
                "job_id": jobs[i].get("job_id"),
                "top_candidates": [],
                "pipeline_metadata": {"errors": [str(result)]},
                "total_candidates_processed": 0,
                "success": False,
                "error": str(result)
            })
        else:
            processed_results.append(result)
    
    logger.info(f"Batch pipeline completed. {len([r for r in processed_results if r['success']])}/{len(processed_results)} jobs successful")
    return processed_results
