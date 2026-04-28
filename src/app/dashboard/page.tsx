'use client';

import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, Building2, PieChart, UserSearch, Target, CheckCircle, TrendingUp, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';

type MarketingTask = {
    status: string;
}

type TrackspotMetric = {
    metricType: string;
    value: number;
    unit: string;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
  const { data: companies, isLoading: isLoadingCompanies } = useCollection(companiesQuery);
  const company = companies?.[0];

  const tasksQuery = useMemoFirebase(() => 
    (user && company) ? collection(firestore, `users/${user.uid}/companies/${company.id}/marketingTasks`) : null
  , [firestore, user, company]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<MarketingTask>(tasksQuery);
  
  const metricsQuery = useMemoFirebase(() => 
    (user && company) ? collection(firestore, `users/${user.uid}/companies/${company.id}/trackspotMetrics`) : null
  , [firestore, user, company]);
  const { data: metrics, isLoading: isLoadingMetrics } = useCollection<TrackspotMetric>(metricsQuery);

  const completedTasks = useMemo(() => tasks?.filter(t => t.status === 'Completed').length || 0, [tasks]);
  const totalLeads = useMemo(() => metrics?.find(m => m.metricType === 'Leads')?.value || 0, [metrics]);
  const conversionRate = useMemo(() => metrics?.find(m => m.metricType === 'Conversions')?.value || 0, [metrics]);
  const estimatedSales = useMemo(() => metrics?.find(m => m.metricType === 'Ventas Estimadas')?.value || 0, [metrics]);
  
  const isLoading = isUserLoading || isLoadingCompanies || isLoadingTasks || isLoadingMetrics;

  const card1Image = PlaceHolderImages.find(p => p.id === 'dashboard-card-1');
  const card2Image = PlaceHolderImages.find(p => p.id === 'dashboard-card-2');
  const card3Image = PlaceHolderImages.find(p => p.id === 'dashboard-card-3');

  const actionCards = [
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Define tu Empresa",
      description: "Ingresa la información clave sobre tu negocio, productos y objetivos.",
      link: "/dashboard/company",
      image: card1Image,
      hint: "business planning"
    },
    {
      icon: <PieChart className="h-8 w-8 text-primary" />,
      title: "Analiza tu Nicho",
      description: "Identifica tu nicho de mercado y analiza a tus principales competidores.",
      link: "/dashboard/market-analysis",
      image: card2Image,
      hint: "market analysis"
    },
    {
      icon: <UserSearch className="h-8 w-8 text-primary" />,
      title: "Crea tu Cliente Ideal",
      description: "Genera un perfil detallado de tu cliente ideal para enfocar tus estrategias.",
      link: "/dashboard/customer-profile",
      image: card3Image,
      hint: "target audience"
    }
  ];

  const summaryCards = [
      {
          icon: <Target className="h-6 w-6 text-primary" />,
          title: "Leads Totales",
          value: totalLeads,
          unit: ""
      },
      {
          icon: <TrendingUp className="h-6 w-6 text-primary" />,
          title: "Conversión %",
          value: conversionRate,
          unit: "%"
      },
      {
          icon: <Wallet className="h-6 w-6 text-primary" />,
          title: "Ventas Estimadas",
          value: estimatedSales,
          unit: "€"
      },
      {
          icon: <CheckCircle className="h-6 w-6 text-primary" />,
          title: "Tareas Completadas",
          value: completedTasks,
          unit: ""
      }
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold font-headline tracking-tight">¡Bienvenido a MarketFlow!</h1>
        <p className="text-muted-foreground mt-2">Tu asistente inteligente para la creación de planes de marketing.</p>
      </div>

       <div className="bg-card border rounded-xl p-6">
        <h2 className="text-xl font-semibold font-headline mb-1">Métricas Clave</h2>
        <p className="text-muted-foreground mb-6">Un resumen del rendimiento de tus acciones de marketing.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(card => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-2xl font-bold">{card.unit === '€' ? card.unit : ''}{card.value.toLocaleString('es-ES')}{card.unit !== '€' ? card.unit : ''}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-xl font-semibold font-headline mb-1">Primeros Pasos</h2>
        <p className="text-muted-foreground mb-6">Completa estos pasos para generar tu plan de marketing.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((card) => (
            <Card key={card.title} className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
              {card.image && (
                <div className="relative h-40 w-full overflow-hidden">
                   <Image
                    src={card.image.imageUrl}
                    alt={card.image.description}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={card.hint}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">{card.icon}</div>
                  <CardTitle className="font-headline text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={card.link}>
                    Comenzar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
