'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#3b82f6',
          logo: undefined,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Auto-create wallet for new users only
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

