# Environment Setup

## Required Environment Variables

For the application to work correctly, you need to create a `.env` file in the project root directory with the following variables:

```bash
# Cavos Configuration
CAVOS_ORG_SECRET=your_org_secret_here
CAVOS_APP_ID=your_app_id_here

# Cavos Configuration (Client-side - Next.js Public)
NEXT_PUBLIC_CAVOS_APP_ID=your_app_id_here
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
```

## Setup Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```bash
   # From the project root directory
   touch .env
   ```

3. **Add the variables:**

   - `CAVOS_ORG_SECRET`: Your Cavos organization secret
   - `CAVOS_APP_ID`: Your Cavos application ID
   - `NEXT_PUBLIC_CAVOS_APP_ID`: Same as CAVOS_APP_ID (for client-side use)
   - `NEXT_PUBLIC_STARKNET_NETWORK`: Network to use (e.g., "sepolia")

   > **�� Where to get these credentials:** You can find your organization secret and app ID in the [Cavos Aegis Dashboard](https://aegis.cavos.xyz/dashboard)

4. **Restart the development server:**

   ```bash
   npm run dev
   ```

5. **Test your setup:**

   Use the provided Postman collection `Auth Flow - SignUp → SignIn → Execute.postman_collection.json` to test all endpoints and verify everything is working correctly.
