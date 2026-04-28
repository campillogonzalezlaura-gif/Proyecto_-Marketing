'use client';

import { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, AlertCircle, Wand2, Save } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { analyzeMarketNiche, type AnalyzeMarketNicheOutput } from '@/ai/flows/analyze-market-niche-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"


// Firestore data types
type Company = {
    id: string;
    name: string;
    description: string;
    objectives: string;
    industry: string;
    location: string;
};
type IdealCustomerProfile = {
    id: string;
    demographics: string;
    psychographics: string;
    painPoints: string;
    goals: string;
};
type NicheAnalysis = {
    id: string;
};

const chartConfig = {
  score: {
    label: "Puntuación",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function NicheAnalysisToolPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeMarketNicheOutput | null>(null);

    // --- DATA FETCHING ---
    const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const company = companies?.[0];
    
    const profilesQuery = useMemoFirebase(() => company ? collection(firestore, 'users', user!.uid, 'companies', company.id, 'idealCustomerProfiles') : null, [firestore, user, company]);
    const { data: profiles, isLoading: isLoadingProfiles } = useCollection<IdealCustomerProfile>(profilesQuery);
    const idealCustomerProfile = profiles?.[0];

    const nicheAnalysesQuery = useMemoFirebase(() => company ? collection(firestore, 'users', user!.uid, 'companies', company.id, 'nicheAnalyses') : null, [firestore, user, company]);
    const { data: nicheAnalyses, isLoading: isLoadingNiche } = useCollection<NicheAnalysis>(nicheAnalysesQuery);
    const nicheAnalysis = nicheAnalyses?.[0];

    // --- HANDLERS ---
    async function handleGenerateAnalysis() {
        if (!company) {
            toast({ variant: 'destructive', title: 'Error', description: 'Primero debes definir la información de tu empresa.' });
            return;
        }

        setIsGenerating(true);
        setAnalysisResult(null);

        try {
            const targetAudience = idealCustomerProfile 
                ? `Demographics: ${idealCustomerProfile.demographics}. Psychographics: ${idealCustomerProfile.psychographics}. Pain points: ${idealCustomerProfile.painPoints}. Goals: ${idealCustomerProfile.goals}`
                : 'No ideal customer profile has been generated yet.';

            const aiInput = {
                companyDescription: company.description,
                productServiceDescription: `Industry: ${company.industry}. Objectives: ${company.objectives}`,
                targetAudience: targetAudience,
                location: company.location,
            };

            const result = await analyzeMarketNiche(aiInput);
            setAnalysisResult(result);
            toast({ title: '¡Análisis Completado!', description: 'Hemos analizado el nicho y la competencia para tu empresa.' });

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al generar el análisis', description: 'Hubo un problema con la IA. Por favor, inténtalo de nuevo.' });
        } finally {
            setIsGenerating(false);
        }
    }
    
    async function handleSaveChanges() {
        if (!analysisResult || !user || !company || !firestore) return;

        setIsSaving(true);
        try {
            const nicheData = {
                companyId: company.id,
                nicheDefinition: analysisResult.nicheAnalysis,
                analysisDate: new Date().toISOString(),
                userId: user.uid, // Denormalized for rules
            };

            let nicheAnalysisId: string;

            if (nicheAnalysis) { // Update existing NicheAnalysis document
                const nicheRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysis.id);
                setDocumentNonBlocking(nicheRef, nicheData, { merge: true });
                nicheAnalysisId = nicheAnalysis.id;
            } else { // Create new NicheAnalysis document
                const nicheCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses');
                const newNicheDocRef = await addDocumentNonBlocking(nicheCollectionRef, nicheData);
                if(!newNicheDocRef) throw new Error("Could not create niche analysis document.");
                nicheAnalysisId = newNicheDocRef.id;
            }
            
            // Batch write competitors
            const batch = writeBatch(firestore);
            const competitorsCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'nicheAnalyses', nicheAnalysisId, 'competitors');
            
            analysisResult.keyCompetitors.forEach(competitor => {
                const competitorRef = doc(competitorsCollectionRef); // Create a new doc ref for each competitor
                batch.set(competitorRef, {
                    ...competitor,
                    nicheAnalysisId: nicheAnalysisId,
                    userId: user.uid, // Denormalized for rules
                    companyId: company.id, // Denormalized for rules
                });
            });

            await batch.commit();

            toast({ title: '¡Guardado!', description: 'El análisis de nicho y los competidores han sido guardados.' });
            setAnalysisResult(null); // Clear results after saving
        } catch (error) {
            console.error("Error saving analysis:", error);
            toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el análisis en la base de datos.' });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoadingCompanies || isLoadingProfiles || isLoadingNiche) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Define tu empresa primero</AlertTitle>
                <AlertDescription>
                    Para usar esta herramienta, necesitamos que primero <Link href="/dashboard/company" className="font-bold underline">completes la información de tu empresa</Link>.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle>Análisis de Nicho y Competencia con IA</CardTitle>
                            <CardDescription>Genera un análisis de tu nicho de mercado, identifica competidores clave y descubre tus ventajas únicas.</CardDescription>
                        </div>
                        <Button onClick={handleGenerateAnalysis} disabled={isGenerating} className="w-full sm:w-auto">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Analizando...' : 'Analizar con IA'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {analysisResult && (
                 <Card>
                    <CardHeader className="flex-row items-center justify-between">
                         <div>
                            <CardTitle>Resultados del Análisis</CardTitle>
                            <CardDescription>Revisa los resultados generados por la IA. Puedes guardarlos para usarlos en tu plan de marketing.</CardDescription>
                        </div>
                        <Button onClick={handleSaveChanges} disabled={isSaving} size="sm">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-semibold">Análisis del Nicho de Mercado</AccordionTrigger>
                                <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground pt-2">
                                    {analysisResult.nicheAnalysis}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-lg font-semibold">Competidores Clave ({analysisResult.keyCompetitors.length})</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    {analysisResult.keyCompetitors.map(comp => (
                                        <Card key={comp.name} className="bg-muted/50">
                                            <CardHeader>
                                                <CardTitle className="text-base">{comp.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-2">
                                                <p><strong>Modelo de Precios:</strong> {comp.pricingModel}</p>
                                                <p><strong>Canales:</strong> {comp.channel}</p>
                                                <p><strong>Fortalezas:</strong> {comp.strengths}</p>
                                                <p><strong>Debilidades:</strong> {comp.weaknesses}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger className="text-lg font-semibold">Sugerencias de Propuesta Única de Venta (USP)</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                     <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                        {analysisResult.uniqueSellingPropositionSuggestions.map((usp, i) => <li key={i}>{usp}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                             {analysisResult.marketOpportunities && analysisResult.marketOpportunities.length > 0 && (
                                <AccordionItem value="item-4">
                                    <AccordionTrigger className="text-lg font-semibold">Visualización de Oportunidades</AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                                            <BarChart accessibilityLayer data={analysisResult.marketOpportunities} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="opportunity"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickFormatter={(value) => value.slice(0, 12) + (value.length > 12 ? '...' : '')}
                                                />
                                                <YAxis dataKey="score" domain={[0, 10]} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dot" />}
                                                />
                                                <Bar dataKey="score" fill="var(--color-score)" radius={8} />
                                            </BarChart>
                                        </ChartContainer>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {!isGenerating && !analysisResult && (
                 <Card className="text-center flex flex-col items-center justify-center py-16 border-dashed">
                     <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <CardTitle className="text-xl">Listo para empezar</CardTitle>
                    <CardDescription className="mt-2 max-w-md">
                        Haz clic en "Analizar con IA" para que nuestra inteligencia artificial examine tu nicho, encuentre a tus competidores y te dé sugerencias para destacar.
                    </CardDescription>
                </Card>
            )}

        </div>
    );
}
