from database import engine, SessionLocal
import models
import os

def init_db():
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

    # Create the hardcoded user if it doesn't exist
    db = SessionLocal()
    try:
        # Create the hardcoded user if it doesn't exist
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

        # Seed builtin packagings
        builtin_dir = os.path.join(os.path.dirname(__file__), "assets", "packages", "builtin")
        if os.path.exists(builtin_dir):
            print(f"Scanning for builtin packagings in {builtin_dir}...")
            for filename in os.listdir(builtin_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    pkg_id = f"builtin:{filename}"
                    existing_pkg = db.query(models.Packaging).filter(models.Packaging.id == pkg_id).first()
                    
                    if not existing_pkg:
                        print(f"Creating builtin packaging: {pkg_id}")
                        name = os.path.splitext(filename)[0].capitalize()
                        new_pkg = models.Packaging(
                            id=pkg_id,
                            user_id=None, # System/builtin packaging
                            name=name,
                            color=filename # Storing filename as 'color' based on router logic
                        )
                        db.add(new_pkg)
            db.commit()
            print("Builtin packagings seeded.")
        else:
            print(f"Builtin packages directory not found at {builtin_dir}")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
