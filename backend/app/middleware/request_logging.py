"""
Middleware for Request Auditing, Correlation IDs, and Safe Error Handling.
"""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("api.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
        start_time = time.perf_counter()

        # Attach request_id to request state
        request.state.request_id = request_id

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time-Ms"] = str(duration_ms)

            # Log request details (no body or secret tokens)
            logger.info(
                f"{request.method} {request.url.path} completed with {response.status_code} in {duration_ms}ms [ReqID: {request_id}]"
            )
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled Exception on {request.method} {request.url.path} [ReqID: {request_id}]: {str(exc)}",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred. Please contact the security operations team.",
                    "request_id": request_id,
                },
                headers={"X-Request-ID": request_id},
            )
