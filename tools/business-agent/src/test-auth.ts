/**
 * Test script to verify Claude Agent SDK works with Max subscription authentication.
 *
 * This test does NOT set ANTHROPIC_API_KEY - it relies on the Claude Code CLI's
 * OAuth authentication (your Max subscription).
 *
 * If this works, we can use the Agent SDK without paying per-token API costs!
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function testMaxAuth() {
  console.log("=".repeat(60));
  console.log("Testing Claude Agent SDK with Max Subscription Auth");
  console.log("=".repeat(60));
  console.log("");

  // Check if API key is set (we want it to NOT be set for this test)
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`ANTHROPIC_API_KEY set: ${hasApiKey ? "YES (will use API)" : "NO (should use Max OAuth)"}`);
  console.log("");

  try {
    console.log("Sending test query to Claude...");
    console.log("-".repeat(40));

    let sessionId: string | undefined;
    let result: string | undefined;
    let accountInfo: any;

    const q = query({
      prompt: "Say 'Hello from Claude Max!' and tell me what model you are. Keep it brief (one sentence).",
      options: {
        // Minimal tools - just need to test auth works
        allowedTools: [],
        // Don't load any settings files
        settingSources: [],
      }
    });

    // Try to get account info first
    try {
      accountInfo = await q.accountInfo();
      console.log("\nAccount Info:");
      console.log(`  Email: ${accountInfo.email || "N/A"}`);
      console.log(`  Subscription: ${accountInfo.subscriptionType || "N/A"}`);
      console.log(`  Token Source: ${accountInfo.tokenSource || "N/A"}`);
      console.log(`  API Key Source: ${accountInfo.apiKeySource || "N/A"}`);
      console.log("");
    } catch (e) {
      console.log("Could not get account info (will continue with test)");
    }

    // Stream messages
    for await (const message of q) {
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        sessionId = message.session_id;
        console.log(`Session ID: ${sessionId}`);
        console.log(`Model: ${message.model}`);
        console.log(`Permission Mode: ${message.permissionMode}`);
      }

      if (message.type === "result" && "result" in message) {
        result = message.result;
        console.log("");
        console.log("-".repeat(40));
        console.log("Response from Claude:");
        console.log(result);
        console.log("-".repeat(40));
        console.log("");
        console.log(`Cost: $${message.total_cost_usd?.toFixed(6) || "0.000000"}`);
        console.log(`Duration: ${message.duration_ms}ms`);
      }
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("SUCCESS! Agent SDK works with Max subscription!");
    console.log("=".repeat(60));

    return true;
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("FAILED - Error occurred:");
    console.error("=".repeat(60));
    console.error(error);

    if (error instanceof Error && error.message.includes("API key")) {
      console.error("");
      console.error("The SDK requires an API key. Max subscription auth may not be supported.");
      console.error("We'll need to build an adapter (Approach 2).");
    }

    return false;
  }
}

// Run the test
testMaxAuth().then(success => {
  process.exit(success ? 0 : 1);
});
