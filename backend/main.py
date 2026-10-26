# This file runs the Fast API and handles stuf between front end and back end.

import logging
import re
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from model import PhishingModel


# ------------------- Rate limiting -------------------
limiter = Limiter(key_func=get_remote_address)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("phishing_api")


# --------------------Request / response models--------------------
class PredictionRequest(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={"examples": [
            {"url": "http://secure-paypal-login.verify-account.xyz/signin.php?id=48213"},
            {"url": "https://www.wikipedia.org/"},
        ]},
    )

    url: str = Field(..., min_length=4, max_length=8192, description="The URL to check.")

    @field_validator("url")
    @classmethod
    def check_url(cls, value):
        if re.search(r"\s", value):
            raise ValueError("URL must not contain spaces or other whitespace.")
        if "." not in value:
            raise ValueError("URL must contain a domain name, for example example.com.")
        return value


class PredictionResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{
        "url": "http://secure-paypal-login.verify-account.xyz/signin.php?id=48213",
        "prediction": "phishing",
        "label": 1,
        "phishing_probability": 0.9731,
        "confidence": 0.9731,
    }]})

    url: str
    prediction: Literal["phishing", "benign"]
    label: int = Field(..., description="1 = phishing, 0 = benign")
    phishing_probability: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1, description="Probability of the predicted class")


class StatusResponse(BaseModel):
    message: str
    model_loaded: bool


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    status: int
    type: str
    message: str
    details: list[ErrorDetail] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


# --------------------One error format for everything--------------------
def error_response(status_code, error_type, message, details=None, headers=None):
    body = {"status": status_code, "type": error_type, "message": message}
    if details:
        body["details"] = details
    return JSONResponse(status_code=status_code, content={"error": body}, headers=headers)


# --------------------App + model loaded once at startup--------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = None
    try:
        app.state.model = PhishingModel.load()
        logger.info("Model loaded: " + str(app.state.model.metadata["metrics"]))
    except FileNotFoundError:
        logger.error("Model file not found. Run 'python model.py' first.")
    except Exception:
        logger.exception("Model failed to load")
    yield


app = FastAPI(
    title="Phishing URL Detection API",
    description=(
        "Send a URL, get back whether it looks like phishing, plus a confidence score.\n\n"
        "Every error uses the same JSON shape: "
        "`{\"error\": {\"status\": 422, \"type\": \"validation_error\", \"message\": \"...\"}}`"
    ),
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Catches anything unexpected (e.g. the model call failing) and returns it in the shared
# format with no stack trace. It is added BEFORE the CORS middleware so it sits inside it;
# otherwise the browser would block the 500 response and the frontend couldn't read it.
@app.middleware("http")
async def catch_unexpected_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception(f"Unhandled error on {request.method} {request.url.path}")
        return error_response(500, "internal_error", "An unexpected error occurred. Please try again later.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        location = err.get("loc", ())
        if err.get("type") == "json_invalid":
            field, message = "body", "Request body is not valid JSON."
        elif err.get("type") == "missing" and tuple(location) == ("body",):
            field, message = "body", "Request body is required."
        else:
            field = ".".join(str(part) for part in location if part != "body") or "body"
            message = err.get("msg", "Invalid value.").removeprefix("Value error, ")
        details.append({"field": field, "message": message})
    return error_response(422, "validation_error", "The request contains invalid input.", details)


HTTP_ERRORS = {
    404: ("not_found", "The requested endpoint does not exist."),
    405: ("method_not_allowed", "This HTTP method is not allowed for this endpoint."),
}


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    error_type, message = HTTP_ERRORS.get(exc.status_code, ("http_error", str(exc.detail)))
    return error_response(exc.status_code, error_type, message, headers=getattr(exc, "headers", None))


# --------------------Endpoints--------------------
@app.get("/", response_model=StatusResponse, summary="Check the API is running")
def root(request: Request):
    """Returns a welcome message and whether the prediction model has been loaded."""
    return {"message": "Phishing URL Detection API is running", "model_loaded": request.app.state.model is not None}


@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Check whether a URL is phishing",
    responses={
        422: {"model": ErrorResponse, "description": "Missing, malformed or invalid URL.",
              "content": {"application/json": {"example": {"error": {
                  "status": 422, "type": "validation_error", "message": "The request contains invalid input.",
                  "details": [{"field": "url", "message": "URL must not contain spaces or other whitespace."}]}}}}},
        500: {"model": ErrorResponse, "description": "Unexpected server error.",
              "content": {"application/json": {"example": {"error": {
                  "status": 500, "type": "internal_error",
                  "message": "An unexpected error occurred. Please try again later."}}}}},
        503: {"model": ErrorResponse, "description": "The model file was not found or failed to load.",
              "content": {"application/json": {"example": {"error": {
                  "status": 503, "type": "model_unavailable",
                  "message": "The prediction model is not loaded. Run 'python model.py' and restart the server."}}}}},
    },
)
@limiter.limit("5/minute")
def predict(payload: PredictionRequest, request: Request):
    """
    Turns the URL into the 40 features used in training and returns the model's prediction,
    the probability that it is phishing, and the confidence of the prediction.
    """
    model = request.app.state.model
    if model is None:
        return error_response(
            503, "model_unavailable",
            "The prediction model is not loaded. Run 'python model.py' and restart the server.",
        )

    result = model.predict(payload.url)

    shown = payload.url if len(payload.url) <= 120 else payload.url[:120] + "..."
    logger.info(f"{result['prediction']} ({result['phishing_probability']}) <- {shown}")

    return {"url": payload.url, **result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)