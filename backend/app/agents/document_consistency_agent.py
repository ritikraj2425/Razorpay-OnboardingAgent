from app.agents.base import BaseAgent


class DocumentConsistencyAgent(BaseAgent):
    """
    Agent responsible for cross-referencing merchant entity documents
    against registered corporate registry names.
    Inherits from BaseAgent (OOP: Inheritance & Polymorphism).
    """
    def __init__(self):
        super().__init__(
            name="DocumentConsistencyAgent",
            description="Verifies business name consistency across submitted KYB documents"
        )

    def _execute(self, business_name: str, document_name: str) -> bool:
        if not business_name or not document_name:
            return False
        first_token = business_name.split()[0].lower()
        return first_token in document_name.lower()


# Backward-compatible singleton and helper function
_instance = DocumentConsistencyAgent()

def document_name_matches(business_name: str, document_name: str) -> bool:
    res = _instance.run(business_name, document_name)
    return bool(res.output) if res.success else False


__all__ = ["DocumentConsistencyAgent", "document_name_matches"]
