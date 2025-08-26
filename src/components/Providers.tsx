"use client";

import { NhostReactProvider } from '@nhost/react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import nhost from '@/lib/nhost';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NhostReactProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </NhostReactProvider>
  );
}
