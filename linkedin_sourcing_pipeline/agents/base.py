"""
Base agent class with common functionality for rate limiting, retries, and caching
"""
import time
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Callable
from functools import wraps
from dataclasses import dataclass
import json
import hashlib
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Cache entry with timestamp and data"""
    data: Any
    timestamp: datetime
    ttl_seconds: int = 3600  # 1 hour default
    
    @property
    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        return datetime.now() > self.timestamp + timedelta(seconds=self.ttl_seconds)

class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired"""
        entry = self._cache.get(key)
        if entry and not entry.is_expired:
            logger.debug(f"Cache hit for key: {key}")
            return entry.data
        elif entry:
            # Remove expired entry
            del self._cache[key]
            logger.debug(f"Cache expired for key: {key}")
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set cached value with TTL"""
        self._cache[key] = CacheEntry(
            data=value,
            timestamp=datetime.now(),
            ttl_seconds=ttl_seconds
        )
        logger.debug(f"Cache set for key: {key}")
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        logger.debug("Cache cleared")

class RateLimiter:
    """Simple rate limiter using token bucket algorithm"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.tokens = requests_per_minute
        self.last_refill = time.time()
        self.lock = asyncio.Lock() if asyncio.iscoroutinefunction else None
    
    async def acquire_async(self) -> None:
        """Acquire rate limit token (async)"""
        async with self.lock:
            await self._acquire()
    
    def acquire(self) -> None:
        """Acquire rate limit token (sync)"""
        self._acquire()
    
    def _acquire(self) -> None:
        """Internal acquire logic"""
        now = time.time()
        time_passed = now - self.last_refill
        
        # Refill tokens based on time passed
        self.tokens = min(
            self.requests_per_minute,
            self.tokens + time_passed * (self.requests_per_minute / 60.0)
        )
        self.last_refill = now
        
        if self.tokens < 1:
            sleep_time = (1 - self.tokens) / (self.requests_per_minute / 60.0)
            logger.info(f"Rate limit hit, sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
            self.tokens = 0
        else:
            self.tokens -= 1

def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed operations with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {current_delay:.2f}s...")
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed")
            
            raise last_exception
        return wrapper
    return decorator

class BaseAgent(ABC):
    """Base class for all agents with common functionality"""
    
    def __init__(self, 
                 name: str,
                 requests_per_minute: int = 60,
                 max_retries: int = 3,
                 retry_delay: float = 1.0,
                 cache_ttl: int = 3600):
        self.name = name
        self.cache = SimpleCache()
        self.rate_limiter = RateLimiter(requests_per_minute)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.cache_ttl = cache_ttl
        self.logger = logging.getLogger(f"{__name__}.{name}")
        
        # Metrics
        self.metrics = {
            'requests_made': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': 0,
            'total_processing_time': 0.0
        }
    
    def _generate_cache_key(self, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        # Create a deterministic hash from arguments
        key_data = {
            'args': str(args),
            'kwargs': sorted(kwargs.items()) if kwargs else {}
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _log_metrics(self) -> None:
        """Log current metrics"""
        cache_total = self.metrics['cache_hits'] + self.metrics['cache_misses']
        hit_rate = (self.metrics['cache_hits'] / cache_total * 100) if cache_total > 0 else 0
        
        self.logger.info(f"Agent {self.name} metrics:")
        self.logger.info(f"  Requests: {self.metrics['requests_made']}")
        self.logger.info(f"  Cache hit rate: {hit_rate:.1f}%")
        self.logger.info(f"  Errors: {self.metrics['errors']}")
        self.logger.info(f"  Total processing time: {self.metrics['total_processing_time']:.2f}s")
    
    def cached_operation(self, cache_key: str = None, ttl: int = None):
        """Decorator for caching operation results"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key if not provided
                if cache_key:
                    key = cache_key
                else:
                    key = f"{self.name}_{func.__name__}_{self._generate_cache_key(*args, **kwargs)}"
                
                # Check cache first
                cached_result = self.cache.get(key)
                if cached_result is not None:
                    self.metrics['cache_hits'] += 1
                    self.logger.debug(f"Cache hit for {func.__name__}")
                    return cached_result
                
                # Cache miss - execute function
                self.metrics['cache_misses'] += 1
                self.logger.debug(f"Cache miss for {func.__name__}, executing...")
                
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    self.cache.set(key, result, ttl or self.cache_ttl)
                    return result
                finally:
                    self.metrics['total_processing_time'] += time.time() - start_time
            
            return wrapper
        return decorator
    
    def rate_limited_operation(self, func: Callable) -> Callable:
        """Decorator for rate-limited operations"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            self.rate_limiter.acquire()
            self.metrics['requests_made'] += 1
            try:
                return func(*args, **kwargs)
            except Exception as e:
                self.metrics['errors'] += 1
                raise
        return wrapper
    
    @retry_on_failure(max_retries=3, delay=1.0)
    def _make_api_request(self, url: str, **kwargs) -> Any:
        """Make an API request with retry logic (override in subclasses)"""
        raise NotImplementedError("Subclasses must implement _make_api_request")
    
    def validate_input(self, data: Any) -> None:
        """Validate input data (override in subclasses)"""
        if not data:
            raise ValueError(f"{self.name}: Input data cannot be empty")
    
    def preprocess_data(self, data: Any) -> Any:
        """Preprocess input data (override in subclasses)"""
        return data
    
    def postprocess_data(self, data: Any) -> Any:
        """Postprocess output data (override in subclasses)"""
        return data
    
    @abstractmethod
    def _execute(self, *args, **kwargs) -> Any:
        """Core execution logic - must be implemented by subclasses"""
        pass
    
    def run(self, *args, **kwargs) -> Any:
        """
        Main entry point for agent execution
        Handles validation, preprocessing, execution, and postprocessing
        """
        start_time = time.time()
        self.logger.info(f"Starting {self.name} agent")
        
        try:
            # Validate input
            if args:
                self.validate_input(args[0])
            
            # Preprocess
            processed_args = []
            for arg in args:
                processed_args.append(self.preprocess_data(arg))
            
            # Execute core logic
            result = self._execute(*processed_args, **kwargs)
            
            # Postprocess
            final_result = self.postprocess_data(result)
            
            execution_time = time.time() - start_time
            self.logger.info(f"Completed {self.name} agent in {execution_time:.2f}s")
            
            return final_result
            
        except Exception as e:
            self.metrics['errors'] += 1
            execution_time = time.time() - start_time
            self.logger.error(f"Failed {self.name} agent after {execution_time:.2f}s: {e}")
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics"""
        return self.metrics.copy()
    
    def reset_metrics(self) -> None:
        """Reset agent metrics"""
        self.metrics = {
            'requests_made': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': 0,
            'total_processing_time': 0.0
        }
        self.logger.info(f"Reset metrics for {self.name} agent") 