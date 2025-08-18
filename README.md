# Cavos SDK Example

A Next.js application demonstrating the integration with Cavos Service SDK for blockchain authentication and transaction execution.

## 🚀 Quick Start

**First step: Read the [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) file to configure your environment variables before running the application.**

## 🏗️ Project Structure

This is a consolidated Next.js application with integrated API routes:

```
/
├── app/
│   ├── api/v1/                    # API endpoints
│   │   ├── auth/
│   │   │   ├── signIn/route.ts    # User authentication
│   │   │   └── signUp/route.ts    # User registration
│   │   └── execute/route.ts       # Transaction execution
│   ├── page.tsx                   # Main application page
│   └── layout.tsx                 # Application layout
├── lib/                           # Utility functions and types
├── public/                        # Static assets
└── .env.local                     # Environment variables
```

## 📡 API Endpoints

### Authentication

#### POST `/api/v1/auth/signUp`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "network": "sepolia"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "email": "user@example.com",
    "wallet_address": "0x...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/v1/auth/signIn`

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "network": "sepolia"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJ...",
  "wallet_address": "0x...",
  "email": "user@example.com"
}
```

### Transaction Execution

#### POST `/api/v1/execute`

Execute smart contract calls through Cavos.

**Request Body:**

```json
{
  "walletAddress": "0x...",
  "network": "sepolia",
  "accessToken": "eyJ...",
  "calls": [
    {
      "contractAddress": "0x...",
      "entrypoint": "transfer",
      "calldata": ["0x...", "1000000"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction executed successfully",
  "data": {
    "txHash": "0x...",
    "accessToken": "eyJ..." // Refreshed token
  }
}
```

### Network Support

- **Sepolia**: Ethereum testnet (recommended for development)
- **Mainnet**: Ethereum mainnet (for production)

## 🆘 Support

For issues related to:

- **Cavos SDK**: Check the [Cavos documentation](https://docs.cavos.com)
