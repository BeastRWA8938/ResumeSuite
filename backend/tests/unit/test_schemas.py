import time
from uuid import UUID
from app.core.uuid import generate_uuid7
from app.domain.schemas import ProfileCreate
from app.persistence.models import ProfileTable

def test_uuid7_generation():
    """Verify that generate_uuid7 creates valid, distinct, and time-ordered version 7 UUIDs."""
    u1 = generate_uuid7()
    time.sleep(0.002)  # Sleep 2ms to guarantee distinct timestamps
    u2 = generate_uuid7()
    
    assert isinstance(u1, UUID)
    assert isinstance(u2, UUID)
    assert u1 != u2
    
    # Verify version 7 metadata bit
    assert u1.version == 7
    assert u2.version == 7
    
    # Verify lexicographical timeline ordering (u1 is created before u2)
    assert str(u1) < str(u2)

def test_profile_create_validation():
    """Verify that ProfileCreate Pydantic schema parses and validates fields correctly."""
    valid_data = {
        "name": "Rushikesh",
        "email": "rushikesh@example.com",
        "phone": "+1234567890",
        "location": "Boston, MA"
    }
    profile_in = ProfileCreate(**valid_data)
    assert profile_in.name == "Rushikesh"
    assert profile_in.email == "rushikesh@example.com"
    assert profile_in.phone == "+1234567890"
    assert profile_in.location == "Boston, MA"

def test_profile_table_instantiation():
    """Verify that SQLModel tables generate a time-ordered UUIDv7 default ID upon creation."""
    profile_db = ProfileTable(
        name="Rushikesh",
        email="rush@example.com",
        phone="+1234567890",
        location="Boston, MA"
    )
    assert isinstance(profile_db.id, UUID)
    assert profile_db.id.version == 7
    assert profile_db.name == "Rushikesh"
