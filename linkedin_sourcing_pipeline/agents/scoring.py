# agents/scoring.py

def score_profiles(candidate, job):
    breakdown = {}

    # Education
    if "stanford" in candidate["education"].lower():
        breakdown["education"] = 9.5
    else:
        breakdown["education"] = 7.0

    # Trajectory
    if candidate["avg_tenure_years"] >= 2:
        breakdown["trajectory"] = 8.0
    else:
        breakdown["trajectory"] = 6.0

    # Company
    if any("stripe" in c.lower() for c in candidate["companies"]):
        breakdown["company"] = 9.0
    else:
        breakdown["company"] = 6.5

    # Skills overlap
    job_skills = set(job["skills"])
    candidate_skills = set(candidate["skills"])
    overlap = len(job_skills & candidate_skills) / len(job_skills)
    if overlap > 0.75:
        breakdown["skills"] = 9.0
    elif overlap > 0.4:
        breakdown["skills"] = 7.0
    else:
        breakdown["skills"] = 5.0

    # Location
    if job["location"].lower() in candidate["location"].lower():
        breakdown["location"] = 10.0
    elif job["remote"]:
        breakdown["location"] = 6.0
    else:
        breakdown["location"] = 5.0

    # Tenure
    tenure = candidate.get("avg_tenure_years", 0)
    if 2 <= tenure <= 3:
        breakdown["tenure"] = 9.0
    elif 1 <= tenure < 2:
        breakdown["tenure"] = 7.0
    else:
        breakdown["tenure"] = 5.0

    weights = {
        "education": 0.20,
        "trajectory": 0.20,
        "company": 0.15,
        "skills": 0.25,
        "location": 0.10,
        "tenure": 0.10
    }

    fit_score = sum(breakdown[k] * weights[k] for k in breakdown)

    # Confidence Score (simplified)
    confidence = sum(0.2 for k in ["education", "companies", "skills", "location", "avg_tenure_years"]
                     if candidate.get(k)) + 0.1  # Add GitHub/blog presence later

    return round(fit_score, 2), breakdown, round(min(confidence, 1.0), 2)
