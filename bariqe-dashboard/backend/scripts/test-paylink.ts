/**
 * PayLink Connectivity Test Script
 * Run with: npx ts-node scripts/test-paylink.ts
 *
 * Tests whether the VPS can reach PayLink and authenticate successfully.
 */
import dotenv from "dotenv";
import path from "path";
import axios from "axios";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PAYLINK_APP_ID = process.env.PAYLINK_APP_ID;
const PAYLINK_SECRET_KEY = process.env.PAYLINK_SECRET_KEY;
const PAYLINK_BASE_URL =
    process.env.PAYLINK_BASE_URL || "https://restpilot.paylink.sa";
const TIMEOUT_MS = 15000;

async function testPayLink() {
    console.log("\n========================================");
    console.log("       PayLink Connectivity Test");
    console.log("========================================\n");
    console.log(`Base URL    : ${PAYLINK_BASE_URL}`);
    console.log(`App ID      : ${PAYLINK_APP_ID?.slice(0, 15)}…`);
    console.log(`Secret Key  : ${PAYLINK_SECRET_KEY?.slice(0, 8)}…`);
    console.log(`Timeout     : ${TIMEOUT_MS}ms\n`);

    if (!PAYLINK_APP_ID || !PAYLINK_SECRET_KEY) {
        console.error("❌ ERROR: PAYLINK_APP_ID or PAYLINK_SECRET_KEY is not set in .env");
        process.exit(1);
    }

    const start = Date.now();
    try {
        console.log(`🔄 Sending POST to ${PAYLINK_BASE_URL}/api/auth …`);

        const response = await axios.post(
            `${PAYLINK_BASE_URL}/api/auth`,
            {
                apiId: PAYLINK_APP_ID,
                secretKey: PAYLINK_SECRET_KEY,
                persistToken: false,
            },
            {
                timeout: TIMEOUT_MS,
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
            }
        );

        const latency = Date.now() - start;
        const token = response.data?.id_token;

        if (token) {
            console.log(`\n✅ SUCCESS! Auth token received in ${latency}ms`);
            console.log(`   Token (first 20 chars): ${token.slice(0, 20)}…`);
        } else {
            console.warn(`\n⚠️  Auth call succeeded (${latency}ms) but no id_token in response.`);
            console.log("   Response data:", JSON.stringify(response.data, null, 2));
        }
    } catch (err: any) {
        const latency = Date.now() - start;

        if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
            console.error(`\n❌ TIMEOUT after ${latency}ms`);
            console.error("   The VPS IP is likely blocked by PayLink, or the endpoint is unreachable.");
            console.error("   Solutions:");
            console.error("     1. Contact PayLink support to whitelist your VPS IP:", getServerIP());
            console.error("     2. Or switch to the sandbox URL: https://restpilot.paylink.sa");
        } else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
            console.error(`\n❌ NETWORK ERROR (${err.code}) after ${latency}ms`);
            console.error("   The PayLink host could not be reached from this VPS.");
            console.error("   Check: DNS resolution, firewall outbound rules, or PAYLINK_BASE_URL in .env");
        } else if (err.response?.status === 401 || err.response?.status === 403) {
            console.error(`\n❌ AUTH REJECTED (HTTP ${err.response.status}) after ${latency}ms`);
            console.error("   Credentials are invalid. Check PAYLINK_APP_ID and PAYLINK_SECRET_KEY.");
            console.error("   Also confirm you are using the correct URL:");
            console.error("     - Sandbox: https://restpilot.paylink.sa");
            console.error("     - Production: https://orderpilot.paylink.sa");
            console.error("   Response:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(`\n❌ UNEXPECTED ERROR (HTTP ${err.response?.status}) after ${latency}ms`);
            console.error("   Message:", err.message);
            console.error("   Response:", JSON.stringify(err.response?.data, null, 2));
        }

        process.exit(1);
    }
}

function getServerIP() {
    try {
        const os = require("os");
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === "IPv4" && !net.internal) return net.address;
            }
        }
    } catch (_) { }
    return "unknown";
}

testPayLink().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
