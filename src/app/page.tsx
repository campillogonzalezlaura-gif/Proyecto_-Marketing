'use client';

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Building2, PieChart, UserSearch, Bot, Target, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";


export default function Home() {
  const heroImages = [
    PlaceHolderImages.find(p => p.id === 'hero-main'),
    PlaceHolderImages.find(p => p.id === 'dashboard-card-1'),
    PlaceHolderImages.find(p => p.id === 'dashboard-card-2'),
    PlaceHolderImages.find(p => p.id === 'dashboard-card-3'),
  ].filter((p): p is NonNullable<typeof p> => p !== undefined);

  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )
 
  useEffect(() => {
    if (!api) {
      return
    }
 
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  const onDotButtonClick = (index: number) => {
    api?.scrollTo(index);
  }

  const features = [
      {
        icon: Building2,
        title: "Define tu Empresa",
        description: "Establece las bases de tu negocio, misión, visión y valores.",
      },
      {
        icon: PieChart,
        title: "Analiza tu Nicho",
        description: "Identifica tu público y competidores para encontrar tu lugar en el mercado.",
      },
      {
        icon: UserSearch,
        title: "Crea tu Cliente Ideal",
        description: "Genera perfiles detallados de tus clientes para enfocar tus esfuerzos.",
      },
      {
        icon: Bot,
        title: "Generación con IA",
        description: "Usa la IA para crear eslóganes, contenido para redes, y mucho más.",
      },
      {
        icon: Target,
        title: "Estrategias Claras",
        description: "Obtén un plan de marketing con acciones y estrategias concretas.",
      },
      {
        icon: FileText,
        title: "Plan de Marketing Completo",
        description: "Descarga un documento profesional listo para ser ejecutado por tu equipo.",
      },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b z-10 sticky top-0 bg-background/80 backdrop-blur-sm">
        <Logo />
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Registrarse</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                   <div className="inline-block rounded-lg bg-secondary text-secondary-foreground px-3 py-1 text-sm">Planes de Marketing Inteligentes</div>
                  <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Transforma tu Negocio con Estrategias de IA
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    MarketFlow es tu copiloto de marketing. Define tu negocio, y nuestra IA generará un plan de marketing estratégico y accionable en minutos.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">Comenzar Gratis</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="#">Ver Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Carousel
                    setApi={setApi}
                    plugins={[plugin.current]}
                    className="w-full"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent>
                        {heroImages.map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10"/>
                                    {img && (
                                        <Image
                                            src={img.imageUrl}
                                            alt={img.description}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            data-ai-hint={img.imageHint}
                                            priority={index === 0}
                                        />
                                    )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => onDotButtonClick(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${current === index + 1 ? 'bg-primary' : 'bg-white/50'}`}
                        >
                            <span className="sr-only">Ir a la diapositiva {index + 1}</span>
                        </button>
                    ))}
                </div>
            </div>
            </div>
          </div>
        </section>

         <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Cómo Funciona: Tu Plan en 3 Pasos</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Nuestra plataforma simplifica la complejidad del marketing en un proceso claro y guiado.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 border border-primary/20">
                    <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-bold font-headline">Define tu Negocio</h3>
                <p className="text-sm text-muted-foreground">Proporciona los detalles clave de tu empresa, productos y objetivos. Esta es la base para crear tu estrategia.</p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 border border-primary/20">
                    <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-bold font-headline">Analiza con IA</h3>
                <p className="text-sm text-muted-foreground">Nuestra IA investiga tu nicho, analiza a tus competidores y define el perfil de tu cliente ideal.</p>
              </div>
               <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 border border-primary/20">
                    <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-bold font-headline">Obtén tu Plan</h3>
                <p className="text-sm text-muted-foreground">Recibe un plan de marketing completo con estrategias, acciones, KPIs y presupuesto.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Una Herramienta para Cada Necesidad</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           MarketFlow te ofrece un conjunto de herramientas inteligentes para potenciar cada aspecto de tu marketing.
                        </p>
                    </div>
                </div>
                <div className="mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                    {features.map((feature) => (
                        <div key={feature.title} className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                           <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold font-headline mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 MarketFlow. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Términos de Servicio
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Política de Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  );
}
