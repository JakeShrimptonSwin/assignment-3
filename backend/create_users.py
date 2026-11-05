#Jake - S use this to create users - save some time trying to make a Create Users Page
from auth import init_db, create_user

init_db()
create_user("testuser", "TestPassword123!")
print("User created")