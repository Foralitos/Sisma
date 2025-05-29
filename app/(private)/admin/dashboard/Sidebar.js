"use client";

import Link from "next/link";
import { HomeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

// Admin sidebar navigation options
const sidebarOptions = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
  },
  {
    href: "/admin/dashboard/users",
    label: "Users",
    icon: UsersIcon,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="drawer-side">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <ul className="menu p-4 w-64 min-h-full bg-base-200 text-base-content">
        {/* Sidebar content here */}
        {sidebarOptions.map((option) => {
          const isActive = pathname === option.href;
          return (
            <li key={option.href}>
              <Link href={option.href} className={isActive ? "active" : ""}>
                <option.icon className="w-5 h-5" />
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
