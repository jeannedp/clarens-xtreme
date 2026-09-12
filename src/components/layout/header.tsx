'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/logout.action";

const TABS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
];

const tabClass = 'grid place-content-center w-[100px] h-[35px] text-gray-500 text-sm font-bold text-center pt-[3px] border-b-[3px] border-white';

export function Header() {
  const pathname = usePathname();

  return (
    <div className="relative z-10 flex flex-col shadow-md">
      <div className="flex flex-row items-center justify-between h-[70px] bg-[#153f34] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/CX-Email-Signature.png" alt="Clarens Xtreme" className="h-full py-2.5 w-auto object-contain" />
        <form action={logout} className="text-white text-sm font-bold">
          <button className="cursor-pointer" type="submit">Sign out</button>
        </form>
      </div>

      <nav className="flex flex-row items-center gap-x-1 w-full h-[35px] bg-white px-4">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={pathname === t.href ? `${tabClass} border-b-[#E0561C]` : tabClass}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
