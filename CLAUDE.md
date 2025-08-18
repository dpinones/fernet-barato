# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Environment Setup
1. Install dependencies: `npm install`
2. Create `.env` file with required variables:
   - `CAVOS_ORG_SECRET` - Organization secret from Cavos Aegis Dashboard
   - `CAVOS_APP_ID` - Application ID from Cavos Aegis Dashboard
   - `NEXT_PUBLIC_CAVOS_APP_ID` - Same as CAVOS_APP_ID (client-side)
   - `NEXT_PUBLIC_STARKNET_NETWORK` - Network (sepolia/mainnet)
3. Reference: See `ENVIRONMENT_SETUP.md` for detailed setup instructions

## Architecture Overview

This is a Next.js 15 application demonstrating Cavos Service SDK integration for blockchain authentication and transaction execution on Starknet.

### Core Components

**Authentication Flow**
- `/app/api/v1/auth/signUp/route.ts` - User registration endpoint
- `/app/api/v1/auth/signIn/route.ts` - User authentication endpoint  
- `/lib/auth-atoms.ts` - Jotai state management for user authentication

**Transaction Execution**
- `/app/api/v1/execute/route.ts` - Smart contract execution endpoint
- Supports Starknet Sepolia and Mainnet networks

**Frontend**
- `/app/page.tsx` - Main application interface with auth forms and contract execution UI
- `/lib/types.ts` - TypeScript interfaces for API responses and data structures

### Key Dependencies
- `cavos-service-sdk` (^1.2.33) - Core Cavos blockchain integration
- `jotai` (^2.13.1) - State management for user authentication
- `axios` (^1.11.0) - HTTP client for API calls
- `next` (15.4.6) - React framework with App Router
- `tailwindcss` (^4) - Styling framework
- `react` (19.1.0) & `react-dom` (19.1.0) - Latest React version
- `starknet` (^7.6.4) - Starknet blockchain integration

### State Management Pattern
Uses Jotai atoms for authentication state:
- `userAtom` - Stores user data with localStorage persistence
- `isAuthenticatedAtom` - Derived atom for authentication status
- `signInAtom` & `signOutAtom` - Action atoms for auth operations

### API Route Structure
All API routes follow REST conventions and include:
- Comprehensive input validation
- Environment variable checks
- Detailed error handling with console logging
- Consistent response format

### Network Support
- Sepolia (default/testnet)
- Mainnet (production)

### Testing & Development Tools
- Use provided Postman collection: `Auth Flow - SignUp → SignIn → Execute.postman_collection.json`
- No test framework configured - add testing setup if needed
- ESLint configured via `eslint.config.mjs` for code quality

### Smart Contract Development
- **Cairo Testing**: `scarb test` or `snforge test` - Run Cairo smart contract tests
- **Contract Build**: `scarb build` - Build Cairo contracts
- **Contract Declaration**: Use `sncast declare` with Starknet RPC endpoints
- **Contract Deployment**: Use `sncast deploy` with class hash and constructor arguments
- **Network URLs**: 
  - Sepolia: `https://starknet-sepolia.public.blastapi.io/rpc/v0_7`
  - Mainnet: `https://starknet-mainnet.public.blastapi.io/rpc/v0_7`

### Dual Application Architecture
This codebase contains two applications:
1. **Cavos SDK Demo** - Basic authentication and transaction execution example
2. **Fernet Barato** - Production-ready price comparison app for Argentine consumers

**Project Structure**:
- `components/` - Fernet Barato UI components (LoginForm, AdminPanel, ReportModal)
- `contracts/` - Cairo smart contracts with Scarb configuration
- Real Starknet contract integration with production data

## Development Notes

### Error Handling Pattern
All API routes implement consistent error handling:
- Input validation with descriptive error messages
- Environment variable verification
- Try-catch blocks with detailed logging
- Standardized error response format

### Security Considerations
- Environment variables for sensitive data (org secret, app ID)
- Access token validation for protected endpoints
- No sensitive data logged in production

### UI Architecture  
- Single-page application with conditional rendering
- Authentication state drives UI display
- Modular components for forms, modals, and contract execution
- Responsive design with Tailwind CSS

### Smart Contract Integration
**Cairo Contract**: `contracts/src/lib.cairo` - FernetBarato contract with Cairo structs for Store, Price, and Report
**Frontend Integration**: 
- Contract interactions abstracted in `lib/contract.ts`
- Direct Starknet integration using starknet.js for read operations
- Cavos SDK for write operations and transactions
- Transaction hash return with block explorer integration
- Error handling for contract failures with detailed logging

**Fernet Barato Application Features**:
- Price comparison system with store management
- Thanks system for community engagement  
- Reporting system for data quality
- Admin panel for price updates and store management
- Mobile-first UI with responsive design

### Starknet Integration Status

**✅ COMPLETED**: Full Starknet integration implemented

**Contract Information**:
- Contract Address: `0x06b1ea5990a839008e7abb84b971fd667a4f537cb73dfa8a18a572ce02982a1a`
- Network Support: Sepolia (testnet) and Mainnet
- ABI: Fully configured in `lib/contract-config.ts`

**Integration Details**:
- ✅ **View Functions**: Using starknet.js library for read operations
  - `get_all_stores()` - Returns array of Store structs
  - `get_current_price(store_id)` - Returns Price struct  
  - `get_all_current_prices()` - Returns array of (store_id, Price) tuples
  - `get_reports(store_id)` - Returns array of Report structs
  - `get_thanks_count(store_id)` - Returns u64 count
  - `has_user_thanked(store_id, user)` - Returns boolean

- ✅ **Write Functions**: Using Cavos SDK for transactions
  - `add_store()` - Create new store (external function)
  - `update_price()` - Update store price (external function) 
  - `give_thanks()` - Thank store (external function)
  - `submit_report()` - Report issues (external function)

**Data Structure Mapping**:
```typescript
// Contract Store struct
Store {
  id: felt252,
  name: ByteArray,
  address: ByteArray, 
  phone: ByteArray,
  hours: ByteArray,
  URI: ByteArray
}

// Contract Price struct  
Price {
  price: u256,      // Price in cents
  timestamp: u64    // Unix timestamp
}

// Contract Report struct
Report {
  store_id: felt252,
  description: ByteArray,
  submitted_at: u64,
  submitted_by: ContractAddress
}
```

**Frontend Integration**:
- Real contract data integration completed
- Real-time contract data fetching
- Price conversion utilities (u256 ↔ display format)
- Error handling for contract failures
- ByteArray to string conversion helpers

**Files Updated**:
- `lib/contract-config.ts` - Contract ABI and address
- `lib/contract.ts` - Full Starknet integration
- `lib/types.ts` - Updated type definitions
- `app/page.tsx` - Real contract data usage
- `components/` - Updated for new data structure

## Important Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User