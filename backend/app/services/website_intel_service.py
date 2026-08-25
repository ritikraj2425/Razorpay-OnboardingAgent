from dataclasses import dataclass

from bs4 import BeautifulSoup


@dataclass
class WebsiteIntel:
    html: str
    text: str
    policy_text: str
    product_summary: str
    price_summary: str
    support_summary: str
    is_spa: bool


def mock_site_for(name: str, category: str, drift: bool = False) -> WebsiteIntel:
    lower = name.lower()
    if "quickcash" in lower:
        text = "Education courses with guaranteed investment returns and fast wealth programs."
        policies = "Terms available. Refund policy missing."
        products = "Stock mastery course, wealth accelerator"
        prices = "Course Rs 14999"
    elif "stylebazaar" in lower and drift:
        text = "Replica luxury watches, premium first-copy accessories, imported brand clones."
        policies = "No returns on replica watches."
        products = "Replica watches, luxury clones"
        prices = "Watch Rs 2999"
    elif "gadgetflash" in lower:
        text = "Consumer electronics store with flash checkout and phone accessories."
        policies = "Seven day replacement. Refunds exclude promotional phones."
        products = "iPhone listing, earbuds, power banks"
        prices = "iPhone Rs 7999"
    elif "ayurveda" in lower:
        text = "Ayurvedic supplements for wellness and immunity support."
        policies = "Shipping in 5 days. Privacy policy present."
        products = "Herbal tablets, oils"
        prices = "Supplements Rs 799"
    else:
        text = f"{name} sells legitimate {category} products with clear support and catalog pages."
        policies = "Refunds within 7 days. Shipping in 3-5 days. Privacy and terms are published."
        products = f"{category} catalog, seasonal products"
        prices = "Average product Rs 999"
    html = f"<html><body><main>{text} {policies} {products} {prices}</main></body></html>"
    soup = BeautifulSoup(html, "html.parser")
    return WebsiteIntel(
        html=html,
        text=soup.get_text(" ", strip=True),
        policy_text=policies,
        product_summary=products,
        price_summary=prices,
        support_summary="support@example.com +91 9876543210",
        is_spa=False,
    )
