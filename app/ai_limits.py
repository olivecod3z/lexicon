"""Bound the size and number of billable attempts in hosted generation."""
import os
import logging

logger = logging.getLogger("uvicorn.error.ai_usage")


def client_limits():
    return {"max_retries": 0, "timeout": 60.0} if os.getenv("K_SERVICE") else {}


def output_limits():
    return {"max_output_tokens": 4096} if os.getenv("K_SERVICE") else {}


def record_usage(response, resource, model):
    """Log billable usage without lecture text, email addresses or generated content."""
    usage = getattr(response, "usage", None)
    if usage is not None:
        logger.info("ai_usage resource=%s model=%s input_tokens=%s output_tokens=%s",
                    resource, model, usage.input_tokens, usage.output_tokens)
