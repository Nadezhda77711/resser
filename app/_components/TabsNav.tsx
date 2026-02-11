'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/entities', label: 'Entities' },
  { href: '/affiliations', label: 'Affiliations' },
  { href: '/incidents', label: 'Incidents' },
];

export function TabsNav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {tabs.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link key={t.href} className={active ? 'tab active' : 'tab'} href={t.href}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
