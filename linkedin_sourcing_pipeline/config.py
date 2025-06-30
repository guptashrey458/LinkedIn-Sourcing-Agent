"""
config.py

Centralized configuration loader for the LinkedIn Sourcing Agent.
Loads environment variables from .env using python-dotenv.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """
    Access configuration values from environment variables.
    """
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    CORESIGNAL_API_KEY = os.getenv("CORESIGNAL_API_KEY")
    REDIS_URL = os.getenv("REDIS_URL")
    DATABASE_URL = os.getenv("DATABASE_URL")
    # Add more as needed

    @staticmethod
    def get(key: str, default=None):
        return os.getenv(key, default)
