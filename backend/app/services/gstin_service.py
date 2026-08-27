"""GSTIN / PAN cross-validation — all local math, no API needed."""

import re

# GSTIN state codes: 01–37 plus special territories
GSTIN_STATE_CODES: dict[str, str] = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
    "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
    "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman & Nicobar", "36": "Telangana",
    "37": "Andhra Pradesh (New)",
}

# Luhn mod-36 character set for GSTIN check digit validation
_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _char_value(c: str) -> int:
    return _CHARS.index(c.upper())


def gstin_check_digit(gstin_14: str) -> str:
    """Calculate the GSTIN check digit using the Luhn mod-36 algorithm."""
    total = 0
    for i, char in enumerate(gstin_14):
        val = _char_value(char)
        if i % 2 != 0:
            val *= 2
        quotient, remainder = divmod(val, 36)
        total += quotient + remainder
    check = (36 - (total % 36)) % 36
    return _CHARS[check]


def validate_gstin(gstin: str) -> tuple[bool, list[str]]:
    """Validate GSTIN format, state code, and check digit. Returns (valid, issues)."""
    issues: list[str] = []
    gstin = gstin.strip().upper()

    if not re.fullmatch(r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]", gstin):
        issues.append("GSTIN format invalid — expected 15-character alphanumeric")
        return False, issues

    state_code = gstin[:2]
    if state_code not in GSTIN_STATE_CODES:
        issues.append(f"GSTIN state code '{state_code}' is not a valid Indian state/UT code")

    # Check digit validation
    expected_check = gstin_check_digit(gstin[:14])
    if gstin[14] != expected_check:
        issues.append(f"GSTIN check digit mismatch — expected '{expected_check}', got '{gstin[14]}'")

    return len(issues) == 0, issues


def validate_pan(pan: str) -> tuple[bool, list[str]]:
    """Validate PAN format. Returns (valid, issues)."""
    issues: list[str] = []
    pan = pan.strip().upper()

    if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan):
        issues.append("PAN format invalid — expected AAAAA9999A pattern")
        return False, issues

    # 4th character indicates holder type
    holder_types = {"P": "Individual", "C": "Company", "H": "HUF", "A": "AOP",
                    "B": "BOI", "G": "Government", "J": "AJP", "L": "Local Authority",
                    "F": "Firm/LLP", "T": "Trust"}
    fourth = pan[3]
    if fourth not in holder_types:
        issues.append(f"PAN 4th character '{fourth}' is not a recognized holder type")

    return len(issues) == 0, issues


def cross_validate_pan_gstin(pan: str, gstin: str) -> tuple[bool, list[str]]:
    """Characters 3-12 of GSTIN should match the PAN exactly."""
    issues: list[str] = []
    pan = pan.strip().upper()
    gstin = gstin.strip().upper()

    if len(gstin) < 15 or len(pan) < 10:
        issues.append("Cannot cross-validate — PAN or GSTIN length insufficient")
        return False, issues

    embedded_pan = gstin[2:12]
    if embedded_pan != pan:
        issues.append(f"PAN-GSTIN mismatch — GSTIN contains '{embedded_pan}' but PAN is '{pan}'")
        return False, issues

    return True, []


def get_gstin_state(gstin: str) -> str:
    """Extract state name from GSTIN."""
    code = gstin[:2]
    return GSTIN_STATE_CODES.get(code, "Unknown")


def get_pan_holder_type(pan: str) -> str:
    """Get the entity type from PAN's 4th character."""
    holder_types = {"P": "Individual", "C": "Company", "H": "HUF", "A": "AOP",
                    "B": "BOI", "G": "Government", "J": "AJP", "L": "Local Authority",
                    "F": "Firm/LLP", "T": "Trust"}
    return holder_types.get(pan[3].upper(), "Unknown") if len(pan) >= 4 else "Unknown"


def validate_cin(cin: str) -> tuple[bool, list[str]]:
    """Validate CIN format for companies."""
    issues: list[str] = []
    cin = cin.strip().upper()
    if not cin:
        return True, []  # CIN is optional for non-companies
    if not re.fullmatch(r"[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}", cin):
        issues.append("CIN format invalid — expected 21-character format like U12345MH2020PTC123456")
        return False, issues
    return True, []


def validate_llpin(llpin: str) -> tuple[bool, list[str]]:
    """Validate Indian Limited Liability Partnership Identification Number (LLPIN)."""
    issues: list[str] = []
    llpin = llpin.strip().upper()
    if not llpin:
        return True, []
    if not re.fullmatch(r"^[A-Z]{3}-[0-9]{4}$", llpin):
        issues.append("LLPIN format invalid — expected 8-character format like AAA-1234")
        return False, issues
    return True, []


def validate_ifsc(ifsc: str) -> tuple[bool, list[str], str]:
    """Validate IFSC format and extract bank code. Returns (valid, issues, bank_code)."""
    issues: list[str] = []
    ifsc = ifsc.strip().upper()
    if not re.fullmatch(r"[A-Z]{4}0[A-Z0-9]{6}", ifsc):
        issues.append("IFSC format invalid — expected AAAA0XXXXXX pattern")
        return False, issues, ""

    bank_code = ifsc[:4]
    # Common Indian bank codes
    bank_names = {
        "HDFC": "HDFC Bank", "ICIC": "ICICI Bank", "SBIN": "State Bank of India",
        "KKBK": "Kotak Mahindra Bank", "UTIB": "Axis Bank", "PUNB": "Punjab National Bank",
        "YESB": "Yes Bank", "IDFB": "IDFC First Bank", "BARB": "Bank of Baroda",
        "CNRB": "Canara Bank", "UBIN": "Union Bank of India", "BKID": "Bank of India",
        "RATN": "RBL Bank", "INDB": "IndusInd Bank", "FDRL": "Federal Bank",
        "CBIN": "Central Bank of India", "MAHB": "Bank of Maharashtra",
    }
    return True, [], bank_names.get(bank_code, f"Bank ({bank_code})")
