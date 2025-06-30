from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
from .pipeline import LinkedInSourcingPipeline
from .crewai_pipeline import run_crewai_pipeline  # ← ADD THIS LINE

app = FastAPI(title="LinkedIn Sourcing Agent API")

# Initialize pipeline once (singleton pattern)
pipeline = LinkedInSourcingPipeline()

class JobDescription(BaseModel):
    job_id: str
    title: str
    company: str
    description: str
    requirements: List[str]
    location: str = ""
    skills: List[str] = []
    remote: bool = False
    salary_range: str = ""

class JobResponse(BaseModel):
    job: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    top_candidate: Dict[str, Any] = None
    message: str = None
    errors: List[str] = []
    warnings: List[str] = []

@app.post("/process_job", response_model=JobResponse)
async def process_job(job: JobDescription):
    """Process a single job and return candidate recommendations"""
    try:
        # Convert Pydantic model to dict
        job_dict = job.dict()
        
        # Run pipeline in thread pool since it's synchronous
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, pipeline.run, job_dict)
        
        if result.get('errors'):
            # Still return results even with errors, but log them
            app.logger.warning(f"Pipeline errors for job {job.job_id}: {result['errors']}")
        
        return JobResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

@app.post("/batch_jobs")
async def batch_jobs(jobs: List[JobDescription]):
    """Process multiple jobs concurrently"""
    try:
        # Create async tasks for each job
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(None, pipeline.run, job.dict()) 
            for job in jobs
        ]
        
        # Run all jobs concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "job_id": jobs[i].job_id,
                    "error": str(result),
                    "success": False
                })
            else:
                processed_results.append({
                    "job_id": jobs[i].job_id,
                    "success": True,
                    **result
                })
        
        return {"results": processed_results, "total_jobs": len(jobs)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")
@app.post("/process_job_crewai")
async def process_job_crewai(job: JobDescription):
    """Process job using CrewAI multi-agent system"""
    try:
        # Run CrewAI pipeline in thread pool since it's synchronous
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_crewai_pipeline, job.dict())
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CrewAI pipeline execution failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "pipeline": "ready"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LinkedIn Sourcing Agent API",
        "version": "1.0.0",
        "endpoints": {
            "process_job": "POST /process_job - Process a single job",
            "batch_jobs": "POST /batch_jobs - Process multiple jobs",
            "health": "GET /health - Health check"
        }
    }
