import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import httpx
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
    available: bool = True
    status_code: int = 200
    fetched_urls: list[str] = field(default_factory=list)
    findings: list[dict[str, str]] = field(default_factory=list)


def _normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme:
        return f"https://{url}"
    return url


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return soup.get_text(" ", strip=True)


def _extract_internal_links(base_url: str, html: str, limit: int = 8) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    base_host = urlparse(base_url).netloc
    seen: set[str] = set()
    links: list[str] = []
    priority_words = ("refund", "return", "shipping", "privacy", "terms", "contact", "about", "shop", "product", "catalog")
    for anchor in soup.find_all("a", href=True):
        url = urljoin(base_url, anchor["href"]).split("#")[0]
        parsed = urlparse(url)
        if parsed.netloc != base_host or url in seen:
            continue
        seen.add(url)
        label = f"{anchor.get_text(' ', strip=True)} {parsed.path}".lower()
        if any(word in label for word in priority_words):
            links.append(url)
        if len(links) >= limit:
            break
    return links


def _looks_like_spa(html: str, text: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    script_count = len(soup.find_all("script"))
    return script_count >= 5 and len(text) < 350


def _summarize_products(text: str) -> str:
    product_words = re.findall(r"\b(?:course|shirt|watch|phone|supplement|tablet|oil|service|plan|kit|bag|shoe|jewellery|jewelry|loan|crypto)\b", text, flags=re.I)
    if not product_words:
        return "No clear product nouns detected from crawled text."
    unique = sorted({word.lower() for word in product_words})
    return ", ".join(unique[:12])


def _summarize_prices(text: str) -> str:
    prices = re.findall(r"(?:₹|Rs\.?|INR)\s?[\d,]+|[\d,]+\s?(?:rupees|INR)", text, flags=re.I)
    return ", ".join(prices[:12]) if prices else "No explicit prices detected."


def _summarize_support(text: str) -> str:
    emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phones = re.findall(r"(?:\+91[\s-]?)?[6-9]\d{9}", text)
    parts = []
    if emails:
        parts.append(f"emails: {', '.join(sorted(set(emails))[:4])}")
    if phones:
        parts.append(f"phones: {', '.join(sorted(set(phones))[:4])}")
    return " | ".join(parts) if parts else "No support email or phone detected in crawled text."


def _policy_text(url_text_pairs: list[tuple[str, str]]) -> str:
    policy_chunks = [
        text[:1200]
        for url, text in url_text_pairs
        if any(word in url.lower() for word in ("refund", "return", "shipping", "privacy", "terms"))
    ]
    return "\n\n".join(policy_chunks) if policy_chunks else "No policy pages were discovered or fetched."


def crawl_merchant_site(website_url: str, extra_urls: list[str] | None = None) -> WebsiteIntel:
    start_url = _normalize_url(website_url)
    headers = {
        "User-Agent": "SentinelPayRiskBot/1.0 (+merchant-risk-audit)",
        "Accept": "text/html,application/xhtml+xml",
    }
    fetched: list[tuple[str, str]] = []
    findings: list[dict[str, str]] = []
    status_code = 0

    try:
        with httpx.Client(headers=headers, follow_redirects=True, timeout=12.0) as client:
            response = client.get(start_url)
            status_code = response.status_code
            response.raise_for_status()
            homepage_html = response.text
            fetched.append((str(response.url), homepage_html))
            candidate_urls = _extract_internal_links(str(response.url), homepage_html)
            for url in extra_urls or []:
                if url:
                    candidate_urls.insert(0, _normalize_url(url))
            seen = {str(response.url)}
            for url in candidate_urls[:10]:
                if url in seen:
                    continue
                seen.add(url)
                try:
                    page = client.get(url)
                    if page.status_code < 400 and "text/html" in page.headers.get("content-type", ""):
                        fetched.append((str(page.url), page.text))
                    else:
                        findings.append({"step": "Fetch page", "status": "warning", "detail": f"{url} returned HTTP {page.status_code}"})
                except httpx.HTTPError as exc:
                    findings.append({"step": "Fetch page", "status": "warning", "detail": f"{url} could not be fetched: {exc.__class__.__name__}"})
    except httpx.HTTPError as exc:
        return WebsiteIntel(
            html="",
            text="",
            policy_text="",
            product_summary="",
            price_summary="",
            support_summary="",
            is_spa=False,
            available=False,
            status_code=status_code,
            fetched_urls=[],
            findings=[{"step": "Website availability", "status": "failed", "detail": f"{start_url} could not be fetched: {exc.__class__.__name__}"}],
        )

    texts = [(url, _extract_text(html)) for url, html in fetched]
    combined_text = "\n\n".join(text for _, text in texts if text)
    combined_html = "\n".join(html for _, html in fetched)
    is_spa = _looks_like_spa(fetched[0][1], texts[0][1] if texts else "")
    if is_spa:
        findings.append({"step": "SPA detection", "status": "warning", "detail": "Homepage appears JavaScript-heavy. Configure Playwright for rendered crawling in production."})

    return WebsiteIntel(
        html=combined_html,
        text=combined_text[:12000],
        policy_text=_policy_text(texts),
        product_summary=_summarize_products(combined_text),
        price_summary=_summarize_prices(combined_text),
        support_summary=_summarize_support(combined_text),
        is_spa=is_spa,
        available=True,
        status_code=status_code,
        fetched_urls=[url for url, _ in fetched],
        findings=findings,
    )
