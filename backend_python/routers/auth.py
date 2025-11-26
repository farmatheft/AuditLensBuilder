from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import hmac
import hashlib
import json
from urllib.parse import parse_qs, unquote
import os

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

class TelegramAuth(BaseModel):
    initData: str

# In a real application, you should store the BOT_TOKEN in environment variables
# For now, we will assume it is set in the environment or handle it appropriately
BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")

def validate_telegram_data(init_data: str, bot_token: str) -> dict:
    """
    Validates the initData received from Telegram Web App.
    Returns the parsed user data if valid, raises ValueError otherwise.
    """
    try:
        parsed_data = parse_qs(init_data)
        data_check_string = []
        hash_value = None
        
        for key, value in parsed_data.items():
            if key == 'hash':
                hash_value = value[0]
            else:
                data_check_string.append(f"{key}={value[0]}")
        
        if not hash_value:
            raise ValueError("No hash provided")
            
        data_check_string.sort()
        data_check_string_str = "\n".join(data_check_string)
        
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string_str.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash != hash_value:
             # For development purposes, if the validation fails (e.g. dummy token), we might want to skip this check 
             # OR we strictly enforce it. Given we might not have a real bot token during dev:
             if bot_token == "YOUR_BOT_TOKEN_HERE":
                 print("WARNING: Skipping hash validation due to dummy BOT_TOKEN")
                 pass 
             else:
                 raise ValueError("Data integrity check failed")
        
        user_data_json = parsed_data.get('user', [None])[0]
        if not user_data_json:
            raise ValueError("No user data found")
            
        return json.loads(user_data_json)
        
    except Exception as e:
        print(f"Validation Error: {e}")
        # Fallback for development/testing if validation fails entirely (e.g. improper format)
        # In production this should RAISE
        raise ValueError(f"Invalid initData: {e}")

@router.post("/telegram", response_model=schemas.User)
def authenticate_telegram_user(auth_data: TelegramAuth, db: Session = Depends(get_db)):
    init_data = auth_data.initData
    
    # Allow a bypass for local development if initData is just a string "dev"
    if init_data == "dev":
         # Return the hardcoded dev user
         user = crud.get_user(db, 1)
         if not user:
             # Should satisfy the model if seed ran, but just in case
             raise HTTPException(status_code=500, detail="Dev user not found")
         return user

    try:
        user_data = validate_telegram_data(init_data, BOT_TOKEN)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    telegram_id = str(user_data['id'])
    
    # Check if user exists
    user = crud.get_user_by_telegram_id(db, telegram_id)
    
    if not user:
        # Create new user
        user_create = schemas.UserCreate(
            telegram_id=telegram_id,
            first_name=user_data.get('first_name', ""),
            last_name=user_data.get('last_name', ""),
            username=user_data.get('username', ""),
            language_code=user_data.get('language_code', "en"),
            is_bot=user_data.get('is_bot', False)
        )
        user = crud.create_user(db, user_create)
    else:
        # Update existing user info if changed (optional, but good practice)
        # For simplicity, we just return the user for now
        pass
        
    return user
