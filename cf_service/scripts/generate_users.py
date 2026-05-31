import os
import random
import bcrypt
import psycopg2
from dotenv import load_dotenv

load_dotenv()

NUM_USERS = 200
NUM_WITH_CONSENT = 15         
DEFAULT_PASSWORD = "DemoUser123!"  

FIRST_NAMES = [
    "Alex", "Maria", "John", "Olena", "Max", "Sofia", "Daniel", "Anna",
    "Ivan", "Kate", "Leo", "Nina", "Mark", "Vera", "Paul", "Lana",
    "Oleg", "Dasha", "Yan", "Mila", "Roman", "Yulia", "Denys", "Inna",
]
LAST_NAMES = [
    "Smith", "Kovalenko", "Brown", "Shevchenko", "Davis", "Bondar",
    "Wilson", "Tkachenko", "Moore", "Melnyk", "Taylor", "Kravets",
    "Anderson", "Boyko", "Thomas", "Lysenko",
]


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require" if os.getenv("DB_SSL") == "true" else "disable",
    )


def make_password_hash() -> str:
    return bcrypt.hashpw(DEFAULT_PASSWORD.encode("utf-8"),
                         bcrypt.gensalt(rounds=12)).decode("utf-8")


def main():
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()

    password_hash = make_password_hash()

    consent_indices = set(random.sample(range(NUM_USERS), NUM_WITH_CONSENT))

    created = 0
    skipped = 0

    for i in range(NUM_USERS):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        username = f"bot_{first.lower()}_{i:03d}"
        email = f"bot_{i:03d}@moviecrush.local"
        consent = i in consent_indices

        try:
            cur.execute(
                """
                INSERT INTO users
                    (email, password_hash, username, first_name, last_name,
                     language, account_status, email_verified, soulmate_consent)
                VALUES (%s, %s, %s, %s, %s, 'en', 'active', TRUE, %s)
                ON CONFLICT (email) DO NOTHING
                """,
                (email, password_hash, username, first, last, consent),
            )
            if cur.rowcount == 1:
                created += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"Error on user {i}: {e}", flush=True)
            conn.rollback()
            raise

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM users")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users WHERE soulmate_consent = TRUE")
    with_consent = cur.fetchone()[0]

    print(f"Created: {created}, skipped (already existed): {skipped}", flush=True)
    print(f"Total users in DB: {total}", flush=True)
    print(f"Users with soulmate_consent=TRUE: {with_consent}", flush=True)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()