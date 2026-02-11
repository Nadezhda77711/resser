import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { TabsNav } from './_components/TabsNav';

export const metadata: Metadata = {
  title: 'Ressert',
  description: 'Internal registry for entities, affiliations, incidents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <Link href="/entities">Ressert</Link>
              <span className="brand-sub">Internal</span>
            </div>
            <TabsNav />
            <div className="topbar-actions">
              <Link className="settings-link" href="/settings">Settings</Link>
              <Link className="settings-link" href="/admin">Admin</Link>
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
