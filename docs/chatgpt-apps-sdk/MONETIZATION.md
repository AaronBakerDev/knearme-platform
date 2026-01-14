# Monetization

OpenAI supports two payment approaches for ChatGPT apps.

## External checkout (recommended)

- Send users to your own checkout.
- Use `openExternal` to open your checkout URL.
- Allow return to ChatGPT by configuring `redirect_domains` in widget CSP.

## Instant Checkout (limited)

Instant Checkout lets users pay without leaving ChatGPT, but has restrictions:

- Limited to physical goods.
- Requires a Stripe account and supported currency.
- Must provide a cancellation and refund policy.
- Must display a clear product description.

Tools in this flow can include `payment_mode` to enable test mode, use a `requestCheckout` tool to create the purchase, and `complete_checkout` for fulfillment.
