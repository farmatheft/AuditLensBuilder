from .database import engine, SessionLocal
from . import models

def init_db():
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

    # Create the hardcoded user if it doesn't exist
    db = SessionLocal()
    try:
        user_id = 1
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            print(f"Creating default user with ID {user_id}...")
            # We must use 'telegram_id' as it's a required field (though unique).
            # We'll just give it a dummy value for this system/dev user.
            new_user = models.User(
                id=user_id,
                telegram_id="hardcoded_dev_user",
                first_name="Developer",
                last_name="User",
                username="dev_user",
                is_bot=False
            )
            db.add(new_user)
            db.commit()
            print("Default user created.")
        else:
            print("Default user already exists.")
    except Exception as e:
        print(f"Error seeding user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
