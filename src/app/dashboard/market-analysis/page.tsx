'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, PlusCircle, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Zod schemas for validation
const nicheFormSchema = z.object({
  nicheDefinition: z.string().min(20, { message: "La definición debe tener al menos 20 caracteres." }),
});
type NicheFormValues = z.infer<typeof nicheFormSchema>;

const competitorFormSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    pricingModel: z.string().min(3, { message: "El modelo de precios debe tener al menos 3 caracteres." }),
    channel: z.string().min(3, { message: "El canal debe tener al menos 3 caracteres." }),
    strengths: z.string().min(10, { message: "Describe las fortalezas (mínimo 10 caracteres)." }),
    weaknesses: z.string().min(10, { message: "Describe las debilidades (mínimo 10 caracteres)." }),
});
type CompetitorFormValues = z.infer<typeof competitorFormSchema>;

// Firestore data types
type Company = { id: string; userId: string; name: string; };
type NicheAnalysis = { id: string; companyId: string; userId: string; nicheDefinition: string; analysisDate: string; };
type Competitor = { id: string; nicheAnalysisId: string; userId: string; companyId: string; } & CompetitorFormValues;

export default function MarketAnalysisPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isNicheSubmitting, setIsNicheSubmitting] = useState(false);
  const [isCompetitorSubmitting, setIsCompetitorSubmitting] = useState(false);
  const [isCompetitorDialogOpen, setIsCompetitorDialogOpen] = useState(false);

  // --- DATA FETCHING ---
  const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
  const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
  const company = companies?.[0];

  const nicheAnalysesQuery = useMemoFirebase(() => (user && company) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses') : null, [firestore, user, company]);
  const { data: nicheAnalyses, isLoading: isLoadingNiche } = useCollection<NicheAnalysis>(nicheAnalysesQuery);
  const nicheAnalysis = nicheAnalyses?.[0];

  const competitorsQuery = useMemoFirebase(() => (user && company && nicheAnalysis) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysis.id, 'competitors') : null, [firestore, user, company, nicheAnalysis]);
  const { data: competitors, isLoading: isLoadingCompetitors } = useCollection<Competitor>(competitorsQuery);

  // --- FORM SETUP ---
  const nicheForm = useForm<NicheFormValues>({
    resolver: zodResolver(nicheFormSchema),
    defaultValues: { nicheDefinition: "" },
    mode: "onChange",
  });

  const competitorForm = useForm<CompetitorFormValues>({
    resolver: zodResolver(competitorFormSchema),
    defaultValues: { name: "", pricingModel: "", channel: "", strengths: "", weaknesses: "" },
  });

  useEffect(() => {
    if (nicheAnalysis) {
      nicheForm.reset({ nicheDefinition: nicheAnalysis.nicheDefinition });
    }
  }, [nicheAnalysis, nicheForm]);

  // --- SUBMIT HANDLERS ---
  async function onNicheSubmit(data: NicheFormValues) {
    setIsNicheSubmitting(true);
    if (!user || !company || !firestore) return;

    const nicheData = {
      ...data,
      companyId: company.id,
      userId: user.uid,
      analysisDate: new Date().toISOString(),
    };

    if (nicheAnalysis) { // Update existing
      const nicheRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysis.id);
      setDocumentNonBlocking(nicheRef, nicheData, { merge: true });
    } else { // Create new
      const nicheCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses');
      addDocumentNonBlocking(nicheCollectionRef, nicheData);
    }
    
    toast({ title: "¡Análisis guardado!", description: "Tu definición de nicho ha sido guardada." });
    setIsNicheSubmitting(false);
  }

  async function onCompetitorSubmit(data: CompetitorFormValues) {
    setIsCompetitorSubmitting(true);
    if (!user || !company || !nicheAnalysis || !firestore) return;

    const competitorData = {
      ...data,
      nicheAnalysisId: nicheAnalysis.id,
      companyId: company.id,
      userId: user.uid,
    };
    const competitorCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysis.id, 'competitors');
    addDocumentNonBlocking(competitorCollectionRef, competitorData);
    
    toast({ title: "¡Competidor añadido!", description: `${data.name} ha sido añadido a tu análisis.` });
    competitorForm.reset();
    setIsCompetitorDialogOpen(false);
    setIsCompetitorSubmitting(false);
  }

  function handleDeleteCompetitor(competitorId: string) {
    if (!user || !company || !nicheAnalysis || !firestore) return;
    const competitorRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysis.id, 'competitors', competitorId);
    deleteDocumentNonBlocking(competitorRef);
    toast({ title: "Competidor eliminado", variant: "destructive" });
  }

  // --- RENDER LOGIC ---
  if (isLoadingCompanies) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!company) {
    return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Define tu empresa primero</AlertTitle>
          <AlertDescription>
            Para analizar tu nicho de mercado, primero debes <Link href="/dashboard/company" className="font-bold underline">definir tu empresa</Link>.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Define tu Nicho de Mercado</CardTitle>
          <CardDescription>
            Describe el segmento específico del mercado al que te diriges. Sé lo más detallado posible.
          </CardDescription>
        </CardHeader>
        <Form {...nicheForm}>
          <form onSubmit={nicheForm.handleSubmit(onNicheSubmit)}>
            <CardContent>
              <FormField
                control={nicheForm.control}
                name="nicheDefinition"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Madres primerizas en áreas urbanas de España, con un nivel socioeconómico medio-alto, que buscan productos para bebés ecológicos, seguros y de diseño minimalista..."
                        className="resize-none"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isNicheSubmitting || isLoadingNiche}>
                {isNicheSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {nicheAnalysis ? 'Actualizar Definición' : 'Guardar Definición'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>2. Analiza tu Competencia</CardTitle>
            <CardDescription>
              Añade a tus competidores directos e indirectos para evaluar el panorama.
            </CardDescription>
          </div>
          <Dialog open={isCompetitorDialogOpen} onOpenChange={setIsCompetitorDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!nicheAnalysis} >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Competidor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Competidor</DialogTitle>
                <DialogDescription>Completa los detalles de tu competidor.</DialogDescription>
              </DialogHeader>
              <Form {...competitorForm}>
                <form onSubmit={competitorForm.handleSubmit(onCompetitorSubmit)} className="space-y-4 py-4">
                  <FormField control={competitorForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre del Competidor</FormLabel><FormControl><Input placeholder="Ej: EcoBaby" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={competitorForm.control} name="pricingModel" render={({ field }) => (
                    <FormItem><FormLabel>Modelo de Precios</FormLabel><FormControl><Input placeholder="Ej: Precios premium, suscripción, freemium..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={competitorForm.control} name="channel" render={({ field }) => (
                    <FormItem><FormLabel>Canales de Marketing</FormLabel><FormControl><Input placeholder="Ej: Instagram, SEO, Tiendas físicas..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={competitorForm.control} name="strengths" render={({ field }) => (
                    <FormItem><FormLabel>Fortalezas</FormLabel><FormControl><Textarea placeholder="Ej: Marca reconocida, comunidad fuerte, alta calidad..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={competitorForm.control} name="weaknesses" render={({ field }) => (
                    <FormItem><FormLabel>Debilidades</FormLabel><FormControl><Textarea placeholder="Ej: Precios altos, mal servicio al cliente, poca presencia online..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCompetitorDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isCompetitorSubmitting}>
                      {isCompetitorSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Competidor
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Wand2 className="h-4 w-4" />
            <AlertTitle>¿Necesitas inspiración?</AlertTitle>
            <AlertDescription>
              Usa nuestra <Link href="/dashboard/tools/niche-analysis" className="font-semibold underline">herramienta de análisis con IA</Link> para identificar a tus competidores automáticamente.
            </AlertDescription>
          </Alert>
          {isLoadingCompetitors && <div className="text-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!isLoadingCompetitors && competitors && competitors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Nombre</TableHead>
                  <TableHead>Modelo de Precios</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Fortalezas</TableHead>
                  <TableHead>Debilidades</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>{competitor.pricingModel}</TableCell>
                    <TableCell>{competitor.channel}</TableCell>
                    <TableCell><p className="max-w-xs truncate">{competitor.strengths}</p></TableCell>
                    <TableCell><p className="max-w-xs truncate">{competitor.weaknesses}</p></TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteCompetitor(competitor.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             !isLoadingCompetitors && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                    {nicheAnalysis ? "Aún no has añadido ningún competidor." : "Guarda primero la definición de tu nicho para poder añadir competidores."}
                    </p>
                </div>
             )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
