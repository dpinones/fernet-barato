"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { SignInWithGoogle } from "cavos-service-sdk";
import type { SignInResponse, ApiResponse } from "../lib/types";

interface LoginFormProps {
  onSignIn: (userData: SignInResponse) => void;
}

export default function LoginForm({ onSignIn }: LoginFormProps) {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check if any authentication method is loading
  const isAnyLoading = isLoading || isGoogleLoading;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (isLoginForm) {
        const response = await axios.post<SignInResponse>(
          "/api/v1/auth/signIn",
          {
            email: formData.email,
            password: formData.password,
            network: process.env.NEXT_PUBLIC_STARKNET_NETWORK,
          }
        );

        if (response.data.success) {
          onSignIn(response.data);
          setFormData({ email: "", password: "" });
        }
      } else {
        const response = await axios.post<ApiResponse>("/api/v1/auth/signUp", {
          email: formData.email,
          password: formData.password,
          network: process.env.NEXT_PUBLIC_STARKNET_NETWORK,
        });

        if (response.data.success) {
          setMessage("Cuenta creada correctamente! Por favor, inicia sesión.");
          setIsLoginForm(true);
          setFormData({ email: "", password: "" });
        }
      }
    } catch (error) {
      let errorMessage = "An error occurred";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.details ||
          (isLoginForm ? "Inicio de sesión fallido" : "Registro fallido");
      }
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-fernet-beige p-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Image
                src="/titulo.png"
                alt="Fernet Barato"
                width={280}
                height={84}
                className="h-16 w-auto"
              />
              <Image
                src="/FernetBarato.png"
                alt="Fernet Barato"
                width={60}
                height={93}
                className="w-14 h-auto"
              />
            </div>
          </div>
        {/* <h2 className="text-xl font-semibold text-center mb-6">
          {isLoginForm ? "Iniciar sesión" : "Crear cuenta"}
        </h2> */}

        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.includes("Cuenta creada") 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fernet-dark mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-fernet-beige rounded-md text-fernet-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fernet-gold focus:border-transparent"
              placeholder="Ingresa tu email"
              required
              disabled={isAnyLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fernet-dark mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-fernet-beige rounded-md text-fernet-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fernet-gold focus:border-transparent"
              placeholder="Ingresa tu contraseña"
              required
              disabled={isAnyLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isAnyLoading}
            className="w-full bg-fernet-gold text-fernet-dark py-2 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-fernet-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? "Loading..." : (isLoginForm ? "Iniciar sesión" : "Crear cuenta")}
          </button>
        </form>

        {/* Social Login Buttons - Only show on sign in form */}
        {isLoginForm && (
          <>
            <div className="mt-6 mb-4 flex items-center">
              <div className="flex-1 border-t border-fernet-beige"></div>
              <div className="px-3 text-sm text-fernet-dark opacity-70">O continua con</div>
              <div className="flex-1 border-t border-fernet-beige"></div>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <div 
                onClick={() => !isAnyLoading && setIsGoogleLoading(true)}
                className={`${isAnyLoading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <SignInWithGoogle
                  appId={process.env.NEXT_PUBLIC_CAVOS_APP_ID || ""}
                  network={process.env.NEXT_PUBLIC_STARKNET_NETWORK || ""}
                  finalRedirectUri={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                  text="Continuar con Google"
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => {
              setIsLoginForm(!isLoginForm);
              setMessage("");
              setFormData({ email: "", password: "" });
            }}
            disabled={isAnyLoading}
            className="text-fernet-gold hover:text-yellow-600 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-fernet-gold"
          >
            {isLoginForm ? "¿No tienes una cuenta? Regístrate" : "¿Ya tienes una cuenta? Inicia sesión"}
          </button>
          
          {/* <a
            href="https://docs.cavos.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs block underline"
          >
            Documentation
          </a> */}
        </div>
      </div>
    </div>
  );
}