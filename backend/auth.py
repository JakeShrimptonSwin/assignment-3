# Jake S - Auth backend for login page

import hashlib
import hmac
import os
import secrets
import sqlite3  # Need to use SQLite for SQL injection testing

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

#this lets us turn on insecure mode
from dotenv import load_dotenv
load_dotenv()

DB_PATH = "users.db"
router = APIRouter()
sessions = {}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# start database and create basic user table
def init_db():
    conn = get_db()
    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS users (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   username TEXT UNIQUE NOT NULL,
                   password_hash TEXT NOT NULL,
                   salt TEXT NOT NULL
               )"""
        )
        conn.commit()
    finally:
        conn.close() #always close connection to db after finishing a command

# Hide password in db so it cant be read
def hash_password(password: str, salt:bytes) -> str:
    return hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1).hex()

#create a user
def create_user(username: str, password: str):
    salt = os.urandom(16)
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
            (username, hash_password(password, salt), salt.hex()),
        )
        conn.commit()
    finally:
        conn.close() #always close connection to db after finishing a command

class LoginRequest(BaseModel):
    username: str = Field(
        ..., min_length=1, max_length=50,
        description="Account username (1-50 characters).",
    )
    password: str = Field(
        ..., min_length=1, max_length=128,
        description="Account password (1-128 characters).",
    )
 
    model_config = {
        "json_schema_extra": {
            "examples": [{"username": "testuser", "password": "TestPassword123!"}]
        }
    }

class LoginResponse(BaseModel):
    token: str = Field(..., description="Session token to send with later requests.")
    username: str = Field(..., description="The username that was logged in.")
 
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "token": "kZ3x9Qm1vB7yT0pLw2sN8dHfRjUeAcXoG5iVtYb4MqE",
                "username": "testuser",
            }]
        }
    }
 
 
class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable error message.")

#Send login request to database
@router.post(
    "/login",
    response_model=LoginResponse,
    tags=["Auth"],
    summary="Log in (secure)",
    description=(
        "Checks a username and password against the users table and returns a session token.\n\n"
        "This is the **secure** version: the SQL query uses a `?` placeholder, so user input is "
        "passed as data and can never change the query (this blocks SQL injection). Passwords are "
        "stored as salted scrypt hashes and compared in constant time. The same 401 message is "
        "returned for an unknown username and a wrong password, so attackers can't tell which "
        "usernames exist."
    ),
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unknown username or wrong password.",
            "content": {"application/json": {
                "example": {"detail": "Invalid username or password"}
            }},
        },
        422: {
            "description": "Validation error: a field is missing, empty or too long.",
            "content": {"application/json": {
                "example": {"detail": [
                    {"loc": ["body", "password"], "msg": "Field required", "type": "missing"}
                ]}
            }},
        },
    },
)

@router.post("/login")
def login(body: LoginRequest):
    conn = get_db()
    try:
        # The ? placeholder is what stops SQL injection: user input is passed
        # as data and is never concatenated into the SQL string.
        row = conn.execute(
            "SELECT password_hash, salt FROM users WHERE username = ?",
            (body.username,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        hash_password(body.password, os.urandom(16))   # dummy work so timing doesn't reveal valid usernames
        raise HTTPException(status_code=401, detail="Invalid username or password")

    candidate = hash_password(body.password, bytes.fromhex(row["salt"]))
    if not hmac.compare_digest(candidate, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = secrets.token_urlsafe(32)
    sessions[token] = body.username
    return {"token": token, "username": body.username}

#This is the insecure version 
ENABLE_INSECURE = os.getenv("ENABLE_INSECURE_DEMO") == "1"

def init_insecure_db():
    conn = get_db()
    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS insecure_users (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   username TEXT UNIQUE NOT NULL,
                   password TEXT NOT NULL
               )"""
        )
        conn.execute(
            "INSERT OR IGNORE INTO insecure_users (username, password) VALUES (?, ?)",
            ("testuser", "TestPassword123!"),
        )
        conn.commit()
    finally:
        conn.close()


class InsecureLoginRequest(BaseModel):
    username: str = Field(..., description="Account username (no length or character limits).")
    password: str = Field(..., description="Account password (no length or character limits).")
 

class InsecureLoginResponse(BaseModel):
    message: str = Field(..., description="Status message.")
    username: str = Field(..., description="The username of the row that matched.")

if ENABLE_INSECURE:
    init_insecure_db()

    @router.post(
            "/login-insecure",
            response_model=InsecureLoginResponse,
            tags=["Auth (insecure demo)"],
            summary="Log in (intentionally vulnerable)",
            description=(
                "**For the SQL injection demo only.** Only available when "
                "`ENABLE_INSECURE_DEMO=1` is set.\n\n"
                "The username and password are pasted straight into the SQL string with an f-string, "
                "so crafted input can change the query."
                "Passwords here are stored in plain text, and SQL errors are returned to the caller."
            ),
            responses={
                401: {
                    "model": ErrorResponse,
                    "description": "No row matched the username and password.",
                    "content": {"application/json": {
                        "example": {"detail": "Invalid username or password"}
                    }},
                },
                500: {
                    "model": ErrorResponse,
                    "description": "The query was malformed (this leaks the database error).",
                    "content": {"application/json": {
                        "example": {"detail": "SQL error: unrecognized token: \"'\""}
                    }},
                },
            },
        )

    def login_insecure(
            body: InsecureLoginRequest = Body(
                ...,
                # Needs FastAPI 0.103+. Shows a dropdown of examples in /docs.
                openapi_examples={
                    "normal": {
                        "summary": "Normal login",
                        "value": {"username": "testuser", "password": "TestPassword123!"},
                    },
                    "injection": {
                        "summary": "SQL injection attempt (bypasses the password check)",
                        "value": {"username": "testuser' --", "password": "anything"},
                    },
                },
            )
        ):
            conn = get_db()
            try:
                #Vulnerability: user input is concatenated straight into the SQL string
                query = (
                    f"SELECT * FROM insecure_users "
                    f"WHERE username = '{body.username}' AND password = '{body.password}'"
                )
                try:
                    row = conn.execute(query).fetchone()
                except sqlite3.Error as e:
                    raise HTTPException(status_code=500, detail=f"SQL error: {e}")
            finally:
                conn.close()
    
            if row is None:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            return {"message": "Logged in", "username": row["username"]}