"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSetAtom } from "jotai";
import { signInAtom } from "../../../lib/auth-atoms";
import type { SignInResponse } from "../../../lib/types";

function AuthCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useSetAtom(signInAtom);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Procesando autenticación...");

  useEffect(() => {
    const handleCallback = () => {
      try {
        const userData = searchParams.get("user_data");
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => router.push("/"), 3000);
          return;
        }

        if (userData) {
          const decodedUserData = decodeURIComponent(userData);
          const parsedUserData = JSON.parse(decodedUserData);
          
          const signInResponse: SignInResponse = {
            success: true,
            access_token: parsedUserData.authData.accessToken,
            wallet_address: parsedUserData.wallet.address,
            network: parsedUserData.wallet.network || "sepolia",
          };
          
          signIn(signInResponse);
          
          setStatus("success");
          // setMessage("Authentication successful! Redirecting...");
          setTimeout(() => router.push("/"), 1000);
        } else {
          setStatus("error");
          setMessage("No authentication data received");
          setTimeout(() => router.push("/"), 3000);
        }
      } catch (error) {
        console.error("Callback processing error:", error);
        setStatus("error");
        setMessage("An error occurred during authentication");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams, signIn]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {status === "processing" && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        {status === "success" && (
          <div className="rounded-full h-8 w-8 bg-green-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === "error" && (
          <div className="rounded-full h-8 w-8 bg-red-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <p className={`${
          status === "success" ? "text-green-600" : 
          status === "error" ? "text-red-600" : 
          "text-gray-600"
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackComponent />
    </Suspense>
  );
}
