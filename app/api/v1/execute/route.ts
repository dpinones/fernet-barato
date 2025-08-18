import { NextRequest, NextResponse } from "next/server";
import { CavosAuth } from "cavos-service-sdk";

export async function POST(request: NextRequest) {
  console.log("🚀 Execute transaction request received");

  try {
    const body = await request.json();
    const { walletAddress, calls, accessToken, network } = body;

    console.log("Request data:", {
      walletAddress,
      network,
      callsCount: calls?.length,
      hasAccessToken: !!accessToken,
    });

    const appId = process.env.CAVOS_APP_ID;

    console.log("🔧 Environment variables:", {
      hasAppId: !!appId,
      network,
    });

    // Validate required fields
    if (!walletAddress || !calls || !accessToken || !network) {
      console.log("❌ Missing required fields:", {
        walletAddress: !!walletAddress,
        calls: !!calls,
        accessToken: !!accessToken,
        network: !!network,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: walletAddress, calls, accessToken, network",
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!appId) {
      console.log("❌ CAVOS_APP_ID not configured");
      return NextResponse.json(
        { error: "CAVOS_APP_ID environment variable is not configured" },
        { status: 500 }
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

    // Validate calls structure
    if (!Array.isArray(calls)) {
      console.log("❌ Calls must be an array");
      return NextResponse.json(
        { error: "Calls must be an array" },
        { status: 400 }
      );
    }

    // Validate each call has required fields
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (!call.contractAddress || !call.entrypoint || !call.calldata) {
        console.log(`❌ Invalid call at index ${i}:`, call);
        return NextResponse.json(
          {
            error: `Invalid call at index ${i}. Must have contractAddress, entrypoint, and calldata`,
          },
          { status: 400 }
        );
      }
    }

    console.log("✅ All validations passed, initializing CavosAuth...");

    // Initialize CavosAuth instance
    const cavosAuth = new CavosAuth(network, appId);
    console.log("🔐 CavosAuth initialized for network:", network);

    console.log("📤 Calling CavosAuth.executeCalls...");
    const result = await cavosAuth.executeCalls(
      walletAddress,
      calls,
      accessToken
    );
    console.log("🔐 result", result);

    if (result?.error) {
      return NextResponse.json(
        {
          error: "Transaction failed",
          details: "Unknown error occurred",
        },
        { status: 500 }
      );
    }

    console.log("✅ Transaction executed successfully:", {
      txHash: result.txHash,
      hasNewAccessToken: !!result.accessToken,
    });

    return NextResponse.json({
      success: true,
      message: "Transaction executed successfully",
      data: {
        txHash: result.txHash,
        accessToken: result.accessToken, // Automatically refreshed
      },
    });
  } catch (error: unknown) {
    console.error("💥 Execute transaction error:", error);

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
        error: "Transaction failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
