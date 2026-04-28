'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { 
    Settings,
    Building2,
    Compass,
    Lightbulb,
    UserSearch,
    Sparkles,
    Bot,
    TrendingUp,
    CircleDollarSign,
    Target,
    CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';

const toolSections = [
    { title: "Selector Creativo", href: "/dashboard/tools/creative-selector", icon: Sparkles },
    { title: "Automatización", href: "/dashboard/tools/automation", icon: Bot },
    { title: "Predicción de Resultados", href: "/dashboard/tools/results-prediction", icon: TrendingUp },
    { title: "Cálculo de ROI", href: "/dashboard/tools/roi", icon: CircleDollarSign },
];

export function ToolsPanel() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <SidebarMenuButton tooltip={{ children: 'Herramientas Avanzadas' }}>
                    <Settings />
                    <span>Herramientas</span>
                </SidebarMenuButton>
            </SheetTrigger>
            <SheetContent className="w-[380px] sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>Herramientas de Marketing</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <ul className="flex flex-col gap-1">
                    {toolSections.map(section => (
                        <li key={section.href}>
                            <Link 
                                href={section.href} 
                                className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-accent"
                            >
                                <section.icon className="h-5 w-5 text-primary" />
                                <span className="font-medium">{section.title}</span>
                            </Link>
                        </li>
                    ))}
                    </ul>
                </div>
            </SheetContent>
        </Sheet>
    );
}
