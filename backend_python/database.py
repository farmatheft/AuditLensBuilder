from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from google.cloud.sql.connector import Connector, IPTypes
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Initialize connector globally to keep background refresh threads alive
connector = Connector()

def getconn():
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        ip_type=IPTypes.PUBLIC
    )
    return conn

if INSTANCE_CONNECTION_NAME and DB_USER and DB_PASS and DB_NAME:
    # Use Cloud SQL Connector
    engine = create_engine(
        "postgresql+pg8000://",
        creator=getconn,
    )
elif SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
     # Standard Postgres connection string
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL
    )
else:
    raise ValueError("No PostgreSQL database configuration found. Please set DATABASE_URL or Cloud SQL environment variables.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
