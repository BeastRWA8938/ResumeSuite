import time
import secrets
import uuid

def generate_uuid7() -> uuid.UUID:
    """
    Generates a spec-compliant RFC 9562 UUIDv7.
    UUIDv7 format:
    - 48 bits: Unix timestamp in milliseconds
    - 4 bits: Version (value 7)
    - 12 bits: Random entropy / sequence
    - 2 bits: Variant (value 2, binary 10)
    - 62 bits: Random entropy
    Structure: xxxxxxxx-xxxx-7xxx-[89ab]xxx-xxxxxxxxxxxx
    """
    # Get current timestamp in milliseconds (48 bits -> 12 hex characters)
    timestamp_ms = int(time.time() * 1000)
    timestamp_hex = f"{timestamp_ms:012x}"

    # Generate 10 random bytes for entropy (80 bits -> 20 hex characters)
    random_hex = secrets.token_hex(10)

    # Variant characters for RFC 9562 variant 1 (binary 10xx -> hex 8, 9, a, b)
    var_char = secrets.choice(["8", "9", "a", "b"])

    # Construct standard 36-character UUIDv7 string
    uuid_str = (
        f"{timestamp_hex[0:8]}-"          # 32 bits timestamp
        f"{timestamp_hex[8:12]}-"         # 16 bits timestamp
        f"7{random_hex[0:3]}-"            # 4 bits version + 12 bits random
        f"{var_char}{random_hex[3:6]}-"   # 2 bits variant + 14 bits random
        f"{random_hex[6:18]}"             # 48 bits random
    )
    
    return uuid.UUID(uuid_str)
