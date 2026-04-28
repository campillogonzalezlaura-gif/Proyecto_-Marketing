'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Building2, FileText, LayoutDashboard, PieChart, UserSearch } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/company', label: 'Mi Empresa', icon: Building2 },
  { href: '/dashboard/market-analysis', label: 'Análisis de Mercado', icon: PieChart },
  { href: '/dashboard/customer-profile', label: 'Cliente Ideal', icon: UserSearch },
  { href: '/dashboard/marketing-plan', label: 'Plan de Marketing', icon: FileText },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map(item => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true) }
            tooltip={{ children: item.label, side: 'right', align: 'center' }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
