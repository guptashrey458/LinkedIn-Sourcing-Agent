"""
Enhanced config.py with validation, type hints, and better structure
"""
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class APIConfig:
    """Configuration for external APIs"""
    linkedin_api_key: Optional[str] = None
    github_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Rate limiting
    requests_per_minute: int = 60
    max_retries: int = 3
    retry_delay: float = 1.0
    
    # Timeouts
    request_timeout: float = 30.0
    
    def __post_init__(self):
        """Load API keys from environment variables"""
        self.linkedin_api_key = os.getenv('LINKEDIN_API_KEY')
        self.github_api_key = os.getenv('GITHUB_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        
        # Override defaults from environment if provided
        self.requests_per_minute = int(os.getenv('REQUESTS_PER_MINUTE', self.requests_per_minute))
        self.max_retries = int(os.getenv('MAX_RETRIES', self.max_retries))
        self.retry_delay = float(os.getenv('RETRY_DELAY', self.retry_delay))
        self.request_timeout = float(os.getenv('REQUEST_TIMEOUT', self.request_timeout))

@dataclass
class PipelineConfig:
    """Configuration for pipeline behavior"""
    max_candidates: int = 50
    min_score_threshold: float = 0.7
    enable_enrichment: bool = True
    enable_scoring: bool = True
    enable_messaging: bool = True
    
    # Parallel processing
    max_workers: int = 4
    
    def __post_init__(self):
        """Load pipeline config from environment variables"""
        self.max_candidates = int(os.getenv('MAX_CANDIDATES', self.max_candidates))
        self.min_score_threshold = float(os.getenv('MIN_SCORE_THRESHOLD', self.min_score_threshold))
        self.enable_enrichment = os.getenv('ENABLE_ENRICHMENT', 'true').lower() == 'true'
        self.enable_scoring = os.getenv('ENABLE_SCORING', 'true').lower() == 'true'
        self.enable_messaging = os.getenv('ENABLE_MESSAGING', 'true').lower() == 'true'
        self.max_workers = int(os.getenv('MAX_WORKERS', self.max_workers))

@dataclass
class DatabaseConfig:
    """Configuration for database connections"""
    host: str = 'localhost'
    port: int = 5432
    database: str = 'linkedin_sourcing'
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: str = 'prefer'
    
    def __post_init__(self):
        """Load database config from environment variables"""
        self.host = os.getenv('DB_HOST', self.host)
        self.port = int(os.getenv('DB_PORT', self.port))
        self.database = os.getenv('DB_NAME', self.database)
        self.username = os.getenv('DB_USERNAME')
        self.password = os.getenv('DB_PASSWORD')
        self.ssl_mode = os.getenv('DB_SSL_MODE', self.ssl_mode)
    
    @property
    def connection_string(self) -> str:
        """Generate database connection string"""
        if not self.username or not self.password:
            raise ValueError("Database username and password are required")
        
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}?sslmode={self.ssl_mode}"

class Config:
    """Main configuration class"""
    
    def __init__(self):
        self.api = APIConfig()
        self.pipeline = PipelineConfig()
        self.database = DatabaseConfig()
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.debug = os.getenv('DEBUG', 'false').lower() == 'true'
        self.log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    def validate(self) -> Dict[str, Any]:
        """
        Validate configuration and return status
        
        Returns:
            Dict with validation results
        """
        issues = []
        warnings = []
        
        # Check required API keys based on enabled features
        if not self.api.openai_api_key and not self.api.anthropic_api_key:
            issues.append("At least one AI API key (OpenAI or Anthropic) is required")
        
        # Check LinkedIn API key if discovery is enabled
        if not self.api.linkedin_api_key:
            warnings.append("LinkedIn API key not found - using mock data")
        
        # Validate pipeline settings
        if self.pipeline.max_candidates <= 0:
            issues.append("max_candidates must be greater than 0")
        
        if not 0 <= self.pipeline.min_score_threshold <= 1:
            issues.append("min_score_threshold must be between 0 and 1")
        
        if self.pipeline.max_workers <= 0:
            issues.append("max_workers must be greater than 0")
        
        # Check database config if needed
        if self.environment == 'production':
            try:
                connection_string = self.database.connection_string
            except ValueError as e:
                issues.append(f"Database configuration error: {e}")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get configuration summary for logging"""
        return {
            'environment': self.environment,
            'debug': self.debug,
            'log_level': self.log_level,
            'api_keys_configured': {
                'linkedin': bool(self.api.linkedin_api_key),
                'github': bool(self.api.github_api_key),
                'openai': bool(self.api.openai_api_key),
                'anthropic': bool(self.api.anthropic_api_key),
            },
            'pipeline_settings': {
                'max_candidates': self.pipeline.max_candidates,
                'min_score_threshold': self.pipeline.min_score_threshold,
                'max_workers': self.pipeline.max_workers,
                'features_enabled': {
                    'enrichment': self.pipeline.enable_enrichment,
                    'scoring': self.pipeline.enable_scoring,
                    'messaging': self.pipeline.enable_messaging,
                }
            }
        }

# Global config instance
config = Config()

# Validate configuration on import
validation_result = config.validate()
if not validation_result['valid']:
    import logging
    logger = logging.getLogger(__name__)
    logger.error("Configuration validation failed:")
    for issue in validation_result['issues']:
        logger.error(f"  - {issue}")
    
    if validation_result['warnings']:
        logger.warning("Configuration warnings:")
        for warning in validation_result['warnings']:
            logger.warning(f"  - {warning}")