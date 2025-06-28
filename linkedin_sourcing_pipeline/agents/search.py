import httpx
import os

CORESIGNAL_API_KEY = os.getenv("CORESIGNAL_API_KEY")

async def search_candidates(job):
    url = "https://api.coresignal.com/v1/candidates/search"
    headers = {
        "Authorization": f"Bearer {CORESIGNAL_API_KEY}"
    }
    params = {
        "title": job["title"],
        "location": job["location"],
        "skills": ",".join(job["skills"]),
        "limit": 10
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        candidates = []
        for item in data.get("results", []):
            candidates.append({
                "name": item.get("name"),
                "linkedin_url": item.get("linkedinUrl"),
                "headline": item.get("headline"),
                "location": item.get("location"),
                "education": item.get("education"),
                "companies": item.get("companies", []),
                "skills": item.get("skills", []),
                "avg_tenure_years": item.get("avgTenureYears", 0)
            })
        return candidates
