import { NextRequest, NextResponse } from "next/server";
import { CavosAuth } from "cavos-service-sdk";
import { CONTRACT_ADDRESS } from "./../../../../../lib/contract-config";

export async function POST(request: NextRequest) {
  console.log("🚀 Signin request received");

  try {
    const body = await request.json();
    const { email, password, network } = body;

    console.log(" Request data:", {
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
        { error: "Missing required fields: email, password, network" },
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

    console.log("📤 Calling CavosAuth.signIn...");
    const result = await cavosAuth.signIn(email, password, orgSecret);
    console.log("✅ Signin successful:", {
      walletAddress: result.data.wallet?.address,
      hasAccessToken: !!result.data.access_token,
    });

    // // After successful signin, call update_last_connected on the contract
    // try {
    //   console.log("🔄 Updating last connected on contract...");
      
    //   const updateLastConnectedCall = {
    //     contractAddress: CONTRACT_ADDRESS,
    //     entrypoint: "update_last_connected",
    //     calldata: []
    //   };

    //   const executeResult = await cavosAuth.executeCalls(
    //     result.data.wallet.address,
    //     [updateLastConnectedCall],
    //     result.data.authData.accessToken
    //   );

    //   console.log("✅ Last connected updated on contract successfully:", executeResult.txHash);
    // } catch (contractError) {
    //   console.error("⚠️ Failed to update last connected on contract:", contractError);
    //   // Don't fail the signin process if contract call fails
    // }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      access_token: result.data.authData.accessToken,
      wallet_address: result.data.wallet.address,
      email: result.data.email,
    });
  } catch (error: unknown) {
    console.error("💥 Signin error:", error);

    let errorMessage = "Invalid credentials or unknown error";
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
        error: "Login failed",
        details: errorMessage,
      },
      { status: 401 }
    );
  }
}
