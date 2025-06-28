# linkedin_sourcing_pipeline/pipeline.py
from .agents.search import search_candidates
from .agents.enrichment import enrich_profiles
from .agents.scoring import score_profiles
from .agents.messaging import generate_outreach_message
async def run_job_pipeline(job: dict):
    # 1. Step: Search Candidates (stubbed)
    candidates = await search_candidates(job)

    # 2. Step: Enrich Profiles (GitHub, blogs, etc.)
    enriched_candidates = await enrich_profiles(candidates)

    # 3. Step: Score Candidates
    scored_candidates = []
    for candidate in enriched_candidates:
        score, breakdown, confidence = score_profiles(candidate, job)
        candidate.update({
            "fit_score": score,
            "score_breakdown": breakdown,
            "confidence": confidence
        })
        scored_candidates.append(candidate)

    # 4. Step: Generate Outreach Messages for top N
    top_candidates = sorted(scored_candidates, key=lambda c: c["fit_score"], reverse=True)[:10]
    for candidate in top_candidates:
        candidate["outreach_message"] = generate_outreach_message(candidate, job)

    return {
        "job_id": job.get("job_id"),
        "top_candidates": top_candidates
    }
