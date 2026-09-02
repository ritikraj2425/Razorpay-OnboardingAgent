import asyncio
import json
import os
import httpx
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.types as types
import mcp.server.stdio

# Initialize the MCP Server
server = Server("sentinelpay-onboarding")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available tools.
    """
    return [
        types.Tool(
            name="submit_merchant_application",
            description="Submit a merchant onboarding application to SentinelPay.",
            inputSchema={
                "type": "object",
                "properties": {
                    "business_type": {"type": "string", "description": "Type of business (e.g. private_limited, proprietorship, llp)"},
                    "legal_business_name": {"type": "string", "description": "The legal name of the business"},
                    "customer_facing_business_name": {"type": "string", "description": "The brand or customer-facing name"},
                    "contact_name": {"type": "string", "description": "Name of the primary contact person"},
                    "category": {"type": "string", "description": "Business category (e.g. ecommerce, education, gaming)"},
                    "pan": {"type": "string", "description": "10-digit PAN number"},
                    "gst": {"type": "string", "description": "15-digit GSTIN number"},
                    "bank_account": {"type": "string", "description": "Bank account number"},
                    "ifsc": {"type": "string", "description": "Bank IFSC code"},
                    "website_url": {"type": "string", "description": "Primary business website URL"},
                    "support_email": {"type": "string", "description": "Customer support email"},
                    "support_phone": {"type": "string", "description": "Customer support phone number"},
                },
                "required": [
                    "business_type", "legal_business_name", "contact_name", "category",
                    "pan", "gst", "bank_account", "ifsc", "website_url", "support_email", "support_phone"
                ]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Handle tool execution requests.
    """
    if name != "submit_merchant_application":
        raise ValueError(f"Unknown tool: {name}")

    if not arguments:
        raise ValueError("Missing arguments")

    try:
        api_url = os.environ.get("SENTINELPAY_API_URL", "http://localhost:8000")
        # Call the local SentinelPay API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/api/merchants/register",
                json=arguments,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            return [
                types.TextContent(
                    type="text",
                    text=f"Successfully submitted merchant application! Merchant ID: {data.get('merchant', {}).get('id', 'N/A')}\nStatus: {data.get('merchant', {}).get('status', 'N/A')}\nFull response: {json.dumps(data)}"
                )
            ]
    except httpx.HTTPStatusError as e:
        return [
            types.TextContent(
                type="text",
                text=f"API Error: {e.response.text}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error submitting application: {str(e)}"
            )
        ]

async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="sentinelpay-onboarding",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
