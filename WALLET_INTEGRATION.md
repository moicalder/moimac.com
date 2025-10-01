# 💰 Wallet Integration Guide

Your MoiMac platform now automatically creates an embedded wallet for each user!

## How It Works

### Automatic Wallet Creation
When a user signs in for the first time, Privy automatically:
1. ✅ Creates a secure embedded wallet
2. ✅ Stores it encrypted in Privy's infrastructure
3. ✅ Makes it accessible to the user without them needing to manage keys

### No Duplication
The configuration `createOnLogin: 'users-without-wallets'` ensures:
- ✅ New users get a wallet automatically
- ✅ Existing users keep their existing wallet
- ✅ No duplicate wallets are ever created

## Accessing Wallet in Your Code

### In React Components (Client-Side)

```tsx
import { usePrivy } from '@privy-io/react-auth'

export default function GamePage() {
  const { user } = usePrivy()
  
  // Access wallet address
  const walletAddress = user?.wallet?.address
  
  console.log('User wallet:', walletAddress)
  // Output: "0x1234567890abcdef..."
  
  return (
    <div>
      <p>Your wallet: {walletAddress}</p>
    </div>
  )
}
```

### Wallet Data Available

```tsx
const { user } = usePrivy()

// Wallet address
user?.wallet?.address // "0x..."

// Wallet type
user?.wallet?.walletClientType // "privy"

// Chain ID (Ethereum = 1, Base = 8453, etc.)
user?.wallet?.chainId // "eip155:1"
```

## Database Storage

Wallet addresses are automatically saved to your database:
- Table: `users`
- Column: `wallet_address`
- Updated on every login (if changed)

## Use Cases

### 1. **Future NFT Rewards**
```tsx
// Give user an NFT for high score
async function awardNFT(walletAddress: string) {
  // Mint NFT to user's wallet
  // (requires smart contract integration)
}
```

### 2. **Token Rewards**
```tsx
// Give user tokens for playing
async function awardTokens(walletAddress: string, amount: number) {
  // Transfer tokens to user's wallet
}
```

### 3. **Unique User Identity**
```tsx
// Use wallet as unique identifier
const uniqueId = user.wallet?.address
```

### 4. **Future Blockchain Leaderboard**
Store scores on-chain using user's wallet for transparency and immutability.

## Sending Transactions (Advanced)

If you want users to sign transactions:

```tsx
import { useWallets } from '@privy-io/react-auth'

export default function GamePage() {
  const { wallets } = useWallets()
  const wallet = wallets[0] // User's embedded wallet
  
  async function sendTransaction() {
    if (!wallet) return
    
    // Send a transaction
    const tx = await wallet.sendTransaction({
      to: '0x...', // Recipient
      value: '0x0', // Amount (in wei)
      data: '0x...' // Contract call data
    })
    
    console.log('Transaction:', tx)
  }
}
```

## Migration for Existing Databases

If you already initialized your database before adding wallet support:

1. Visit: `/api/migrate-wallet` (one time only)
2. This adds the `wallet_address` column
3. Delete `/app/api/migrate-wallet/route.ts` after running

## Security Notes

🔒 **Wallets are secured by Privy:**
- Private keys never leave Privy's secure infrastructure
- Users don't need to manage seed phrases
- Keys are encrypted and backed up automatically

🔒 **In your database:**
- Only public wallet addresses are stored
- No private keys or sensitive data

## Disabling Wallets

If you want to disable automatic wallet creation:

Edit `lib/providers.tsx`:
```tsx
embeddedWallets: {
  createOnLogin: 'off', // Disable wallet creation
}
```

## Resources

- [Privy Embedded Wallets](https://docs.privy.io/guide/react/wallets/embedded)
- [Sending Transactions](https://docs.privy.io/guide/react/wallets/embedded/usage/sending-transactions)
- [Wallet Hooks](https://docs.privy.io/guide/react/wallets/embedded/usage/wallet-hooks)

---

Your users now have wallets ready for future Web3 features! 🚀

