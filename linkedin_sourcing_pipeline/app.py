from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import asyncio
from .pipeline import run_job_pipeline

app = FastAPI(title="LinkedIn Sourcing Agent API")

class JobDescription(BaseModel):
    job_id: str
    title: str
    location: str
    skills: List[str]
    remote: bool = False

@app.post("/process_job")
async def process_job(job: JobDescription):
    result = await run_job_pipeline(job.dict())
    return result

@app.post("/batch_jobs")
async def batch_jobs(jobs: List[JobDescription]):
    tasks = [run_job_pipeline(job.dict()) for job in jobs]
    results = await asyncio.gather(*tasks)
    return {"results": results}
