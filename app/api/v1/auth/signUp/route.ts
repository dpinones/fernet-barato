import { NextRequest, NextResponse } from "next/server";
import { CavosAuth } from "cavos-service-sdk";

export async function POST(request: NextRequest) {
  console.log("🚀 Signup request received");

  try {
    const body = await request.json();
    const { email, password, network } = body;

    console.log("📝 Request data:", {
      email,
      network,
      passwordLength: password?.length,
    });

    const orgSecret = process.env.CAVOS_ORG_SECRET;
    const appId = process.env.CAVOS_APP_ID;

    console.log("🔧 Environment variables:", {
      hasOrgSecret: !!orgSecret,
      hasAppId: !!appId,
      network,
    });

    // Validate required fields
    if (!email || !password || !network) {
      console.log("❌ Missing required fields:", {
        email: !!email,
        password: !!password,
        network: !!network,
      });
      return NextResponse.json(
        {
          error: "Missing required fields: email, password, network",
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!orgSecret) {
      console.log("❌ CAVOS_ORG_SECRET not configured");
      return NextResponse.json(
        { error: "CAVOS_ORG_SECRET environment variable is not configured" },
        { status: 500 }
      );
    }

    if (!appId) {
      console.log("❌ CAVOS_APP_ID not configured");
      return NextResponse.json(
        { error: "CAVOS_APP_ID environment variable is not configured" },
        { status: 500 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      console.log("❌ Password too short:", password.length);
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate network
    const validNetworks = ["sepolia", "mainnet"];
    if (!validNetworks.includes(network)) {
      console.log("❌ Invalid network:", network);
      return NextResponse.json(
        {
          error: "Invalid network. Must be one of: sepolia, mainnet",
        },
        { status: 400 }
      );
    }

    console.log("✅ All validations passed, initializing CavosAuth...");

    // Initialize CavosAuth instance
    const cavosAuth = new CavosAuth(network, appId);
    console.log("🔐 CavosAuth initialized for network:", network);

    console.log("📤 Calling CavosAuth.signUp...");
    const result = await cavosAuth.signUp(email, password, orgSecret);

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: {
        email: result.data.email,
        wallet_address: result.data.wallet.address,
        created_at: result.data.created_at,
      },
    });
  } catch (error: unknown) {
    console.error("💥 Signup error:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("📋 Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return NextResponse.json(
      {
        error: "Registration failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
