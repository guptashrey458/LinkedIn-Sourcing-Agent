# agents/enrichment.py

async def enrich_profiles(candidates):
    for c in candidates:
        # Stub: Add GitHub or Twitter data if needed
        c["github_data"] = {
            "repos": 5,
            "top_languages": ["python", "go"]
        }
        c["blog_keywords"] = ["microservices", "cloud", "fintech"]
    return candidates
