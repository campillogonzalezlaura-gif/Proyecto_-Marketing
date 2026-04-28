'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, AlertCircle, TrendingUp, Target, Users, Wallet, Save } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { predictResults, type PredictResultsOutput } from '@/ai/flows/predict-results-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Firestore data types
type Company = {
    id: string;
    name: string;
    description: string;
    objectives: string;
    budget: number;
};

type Product = {
    id: string;
    name: string;
    description: string;
    price?: number;
};

type NicheAnalysis = {
    id: string;
    nicheDefinition: string;
};

type IdealCustomerProfile = {
    id: string;
    demographics: string;
    psychographics: string;
    painPoints: string;
    goals: string;
    needs: string;
};

const MetricCard = ({ icon, title, value, explanation }: { icon: React.ReactNode, title: string, value: string, explanation: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{explanation}</p>
        </CardContent>
    </Card>
);

export default function ResultsPredictionPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [prediction, setPrediction] = useState<PredictResultsOutput | null>(null);

    // --- DATA FETCHING ---
    const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const company = companies?.[0];

    const productsQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/products`) : null, [firestore, user, company]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const product = products?.[0];

    const nicheAnalysesQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/nicheAnalyses`) : null, [firestore, user, company]);
    const { data: nicheAnalyses, isLoading: isLoadingNiche } = useCollection<NicheAnalysis>(nicheAnalysesQuery);
    const nicheAnalysis = nicheAnalyses?.[0];

    const profilesQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/idealCustomerProfiles`) : null, [firestore, user, company]);
    const { data: profiles, isLoading: isLoadingProfiles } = useCollection<IdealCustomerProfile>(profilesQuery);
    const idealCustomerProfile = profiles?.[0];
    
    const isLoading = isLoadingCompanies || isLoadingProducts || isLoadingNiche || isLoadingProfiles;

    const prerequisites = useMemo(() => {
        const missing = [];
        if (!company) missing.push({ name: 'Información de la Empresa', link: '/dashboard/company' });
        if (!product) missing.push({ name: 'Definición del Producto', link: '/dashboard/company' });
        if (!nicheAnalysis) missing.push({ name: 'Análisis de Nicho', link: '/dashboard/market-analysis' });
        if (!idealCustomerProfile) missing.push({ name: 'Perfil del Cliente Ideal', link: '/dashboard/customer-profile' });
        return missing;
    }, [company, product, nicheAnalysis, idealCustomerProfile]);

    // --- HANDLERS ---
    async function handleGeneratePrediction() {
        if (!company || !product || !nicheAnalysis || !idealCustomerProfile) return;

        setIsGenerating(true);
        setPrediction(null);

        try {
            const aiInput = {
                companyDescription: `La empresa ${company.name} se dedica a: ${company.description}. Sus objetivos son: ${company.objectives}.`,
                productDescription: `El producto principal es ${product.name}: ${product.description}. Su precio es ${product.price || 'no especificado'}.`,
                marketingBudget: company.budget || 0,
                nicheAnalysis: nicheAnalysis.nicheDefinition,
                idealCustomerProfile: `Demografía: ${idealCustomerProfile.demographics}. Psicografía: ${idealCustomerProfile.psychographics}. Necesidades: ${idealCustomerProfile.needs}. Puntos de dolor: ${idealCustomerProfile.painPoints}.`,
            };

            const result = await predictResults(aiInput);
            setPrediction(result);
            toast({ title: '¡Predicción Generada!', description: 'Hemos estimado los posibles resultados de tus esfuerzos de marketing.' });

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al generar la predicción', description: 'Hubo un problema con la IA. Por favor, inténtalo de nuevo.' });
        } finally {
            setIsGenerating(false);
        }
    }
    
    async function handleSaveChanges() {
        if (!prediction || !user || !company || !firestore) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            const metricsCollectionRef = collection(firestore, `users/${user.uid}/companies/${company.id}/trackspotMetrics`);
            
            const metrics = [
                { metricType: 'Ventas Estimadas', value: prediction.estimatedSales.value, unit: 'EUR' },
                { metricType: 'Conversions', value: prediction.estimatedConversionRate.value, unit: '%' },
                { metricType: 'Leads', value: prediction.estimatedReach.value, unit: 'count' },
            ];

            // This is a simplified approach: for each metric type, we'd ideally remove old ones before adding new ones.
            // For now, we'll just add them. In a real app, you might query and delete existing metrics of the same type.
            metrics.forEach(metric => {
                const metricRef = doc(metricsCollectionRef); // Auto-generate ID
                batch.set(metricRef, {
                    ...metric,
                    companyId: company.id,
                    userId: user.uid,
                    recordedAt: new Date().toISOString(),
                    period: 'Monthly Estimation'
                });
            });

            await batch.commit();
            toast({ title: '¡Predicción guardada!', description: 'Las métricas estimadas se han actualizado en tu dashboard.' });
            setPrediction(null);
        } catch (error) {
             console.error("Error saving prediction:", error);
            toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudieron guardar las métricas.' });
        } finally {
            setIsSaving(false);
        }
    }


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (prerequisites.length > 0) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Faltan datos para la predicción</AlertTitle>
                <AlertDescription>
                    Para poder generar una predicción de resultados, primero debes completar las siguientes secciones:
                    <ul className="list-disc pl-5 mt-2">
                        {prerequisites.map(req => (
                            <li key={req.name}>
                                <Link href={req.link} className="font-bold underline">{req.name}</Link>
                            </li>
                        ))}
                    </ul>
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
                            <CardTitle>Predicción de Resultados con IA</CardTitle>
                            <CardDescription>Estima ventas, conversiones, alcance y coste por lead basándote en la información de tu empresa.</CardDescription>
                        </div>
                        <Button onClick={handleGeneratePrediction} disabled={isGenerating} className="w-full sm:w-auto">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Generando...' : 'Predecir Resultados'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {prediction && (
                 <Card>
                    <CardHeader className="flex-row items-center justify-between">
                         <div>
                            <CardTitle>Resultados de la Predicción</CardTitle>
                            <CardDescription>Estas son las estimaciones generadas por la IA. Guárdalas para verlas en tu dashboard principal.</CardDescription>
                        </div>
                        <Button onClick={handleSaveChanges} disabled={isSaving} size="sm">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Predicción
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <MetricCard 
                                icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
                                title="Ventas Estimadas (Mensual)"
                                value={`€${prediction.estimatedSales.value.toLocaleString('es-ES')}`}
                                explanation={prediction.estimatedSales.explanation}
                            />
                             <MetricCard 
                                icon={<Target className="h-5 w-5 text-muted-foreground" />}
                                title="Tasa de Conversión Estimada (Mensual)"
                                value={`${prediction.estimatedConversionRate.value.toLocaleString('es-ES')}%`}
                                explanation={prediction.estimatedConversionRate.explanation}
                            />
                             <MetricCard 
                                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                                title="Alcance Estimado (Mensual)"
                                value={prediction.estimatedReach.value.toLocaleString('es-ES')}
                                explanation={prediction.estimatedReach.explanation}
                            />
                             <MetricCard 
                                icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
                                title="Coste por Lead Estimado"
                                value={`€${prediction.estimatedCostPerLead.value.toLocaleString('es-ES')}`}
                                explanation={prediction.estimatedCostPerLead.explanation}
                            />
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-semibold">Análisis de Escenarios de Mercado</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                     {prediction.marketScenarios.map(scenario => (
                                        <div key={scenario.scenario}>
                                            <h4 className={`font-semibold text-base ${
                                                scenario.scenario === 'Optimista' ? 'text-green-500' : 
                                                scenario.scenario === 'Pesimista' ? 'text-red-500' : 'text-amber-500'
                                            }`}>{scenario.scenario}</h4>
                                            <p className="text-muted-foreground text-sm">{scenario.description}</p>
                                        </div>
                                     ))}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {!isGenerating && !prediction && (
                 <Card className="text-center flex flex-col items-center justify-center py-16 border-dashed">
                     <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <CardTitle className="text-xl">Listo para la predicción</CardTitle>
                    <CardDescription className="mt-2 max-w-md">
                        Has completado todos los pasos. Haz clic en "Predecir Resultados" para que la IA genere una estimación del rendimiento de tu marketing.
                    </CardDescription>
                </Card>
            )}
        </div>
    );
}
