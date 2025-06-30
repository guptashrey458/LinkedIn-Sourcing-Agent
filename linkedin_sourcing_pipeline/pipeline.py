# linkedin_sourcing_pipeline/pipeline.py
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from .agents.search import search_candidates
from .agents.enrichment import EnrichmentAgent
from .agents.scoring import ScoringAgent
from .agents.messaging import MessagingAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_job_pipeline(
    job_description: Dict[str, Any],
    max_candidates: int = 10,
    score_threshold: float = 7.0,
) -> Dict[str, Any]:
    """Orchestrates the end-to-end candidate sourcing pipeline.

    Args:
        job_description: Dictionary containing job requirements.
        max_candidates: Maximum number of candidates to pull from search step.
        score_threshold: Minimum score required to be considered a qualified candidate.

    Returns:
        A dictionary summarising the pipeline execution and final candidate list.
    """

    start_time = datetime.now()
    pipeline_metadata = {
        "start_time": start_time.isoformat(),
        "steps_completed": [],
        "errors": [],
        "candidate_counts": {}
    }

    try:
        # ------------------------------------------------------------------
        # 1️⃣ Search
        # ------------------------------------------------------------------
        logger.info("[Pipeline] Starting candidate search …")
        search_payload = dict(job_description)  # avoid mutating caller dict
        search_payload["limit"] = max_candidates
        try:
            candidates = await search_candidates(search_payload)
            pipeline_metadata["candidate_counts"]["searched"] = len(candidates)
            pipeline_metadata["steps_completed"].append("search")
        except Exception as exc:
            logger.exception("Search step failed: %s", exc)
            pipeline_metadata["errors"].append(f"search_error: {exc}")
            return {
                "success": False,
                "error": str(exc),
                "candidates": []
            }

        if not candidates:
            return {
                "success": False,
                "error": "No candidates found",
                "candidates": []
            }

        # ------------------------------------------------------------------
        # 2️⃣ Enrichment
        # ------------------------------------------------------------------
        logger.info("[Pipeline] Enriching %d candidates …", len(candidates))
        try:
            enrichment_agent = EnrichmentAgent()
            enriched_candidates = enrichment_agent.run(candidates)
            pipeline_metadata["candidate_counts"]["enriched"] = len(enriched_candidates)
            pipeline_metadata["steps_completed"].append("enrichment")
        except Exception as exc:
            logger.exception("Enrichment step failed: %s", exc)
            pipeline_metadata["errors"].append(f"enrichment_error: {exc}")
            enriched_candidates = candidates  # fallback

        # ------------------------------------------------------------------
        # 3️⃣ Scoring
        # ------------------------------------------------------------------
        logger.info("[Pipeline] Scoring candidates …")
        scoring_agent = ScoringAgent()
        scored_candidates: List[Dict[str, Any]] = scoring_agent.run(enriched_candidates, job_description)

        qualified_candidates: List[Dict[str, Any]] = []
        for cand in scored_candidates:
            cand_score = cand.get("score", 0)
            if cand_score >= score_threshold:
                qualified_candidates.append(cand)

        pipeline_metadata["candidate_counts"]["qualified"] = len(qualified_candidates)
        pipeline_metadata["steps_completed"].append("scoring")

        # ------------------------------------------------------------------
        # 4️⃣ Messaging
        # ------------------------------------------------------------------
        logger.info("[Pipeline] Generating outreach messages for %d qualified candidates …", len(qualified_candidates))
        messaging_agent = MessagingAgent()
        final_candidates: List[Dict[str, Any]] = []
        for cand in qualified_candidates:
            try:
                cand["outreach_message"] = messaging_agent.run(cand, job_description)
            except Exception as exc:
                logger.warning("Message generation failed for %s: %s", cand.get("name", "unknown"), exc)
                cand["outreach_message"] = ""
            final_candidates.append(cand)

        # Sort by score desc
        final_candidates.sort(key=lambda x: x.get("score", 0), reverse=True)

        pipeline_metadata["steps_completed"].append("messaging")

        # ------------------------------------------------------------------
        # Wrap-up
        # ------------------------------------------------------------------
        end_time = datetime.now()
        pipeline_metadata.update(
            {
                "end_time": end_time.isoformat(),
                "execution_time_seconds": (end_time - start_time).total_seconds(),
                "score_threshold": score_threshold,
            }
        )

        return {
            "job_id": job_description.get("job_id"),
            "success": True,
            "job_title": job_description.get("title", "Unknown Position"),
            "total_searched": len(candidates),
            "qualified_candidates": len(final_candidates),
            "candidates": final_candidates,
            "pipeline_stats": pipeline_metadata,
        }

    except Exception as exc:
        logger.exception("[Pipeline] Critical error: %s", exc)
        return {
            "success": False,
            "error": str(exc),
            "candidates": [],
        }

# ------------------------------------------------------------------
# Synchronous wrapper (helpful for notebooks / non-async callers)
# ------------------------------------------------------------------

def run_job_pipeline_sync(job_description: Dict[str, Any], **kwargs) -> Dict[str, Any]:
    """Synchronous convenience wrapper around *run_job_pipeline*."""
    return asyncio.run(run_job_pipeline(job_description, **kwargs))

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
