def mock_document_match(business_name: str, document_name: str) -> bool:
    return business_name.split()[0].lower() in document_name.lower()
