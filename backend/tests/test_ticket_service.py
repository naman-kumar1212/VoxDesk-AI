import re
from app.services.ticket_service import _generate_ticket_number

def test_ticket_number_format():
    ticket_num = _generate_ticket_number()
    # Format: VD- + 8 uppercase hex characters
    assert ticket_num.startswith("VD-")
    assert len(ticket_num) == 11
    hex_part = ticket_num[3:]
    assert re.match(r"^[0-9A-F]{8}$", hex_part)

def test_ticket_number_uniqueness():
    numbers = {_generate_ticket_number() for _ in range(100)}
    assert len(numbers) == 100
