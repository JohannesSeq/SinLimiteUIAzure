import React, { ReactNode } from 'react';
import { AuthProvider } from "../contexts/AuthContext";
import AppWrappers from './AppWrappers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body id={'root'}>
        <AppWrappers>
          <AuthProvider>{children}</AuthProvider>
        </AppWrappers>
      </body>
    </html>
  );
}
