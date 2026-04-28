'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { generateCreativeContent } from '@/ai/flows/generate-creative-content-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// Firestore data types
type Company = {
    id: string;
    name: string;
    description: string;
    objectives: string;
};
type IdealCustomerProfile = {
    id: string;
    demographics: string;
    psychographics: string;
    painPoints: string;
    goals: string;
};
type AICreativeOutput = {
    id: string;
    outputType: string;
    generatedContent: string;
    generatedAt: string;
}

export default function CreativeSelectorPage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    // --- State Management ---
    const [sloganInput, setSloganInput] = useState("");
    const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false);
    
    const [newsletterTheme, setNewsletterTheme] = useState("");
    const [newsletterAudience, setNewsletterAudience] = useState("");
    const [isGeneratingNewsletter, setIsGeneratingNewsletter] = useState(false);

    const [brochureValue, setBrochureValue] = useState("");
    const [brochurePoints, setBrochurePoints] = useState("");
    const [isGeneratingBrochure, setIsGeneratingBrochure] = useState(false);

    const [generatedContent, setGeneratedContent] = useState<{type: 'slogan' | 'newsletter' | 'brochure', content: string} | null>(null);

    // --- DATA FETCHING ---
    const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const company = companies?.[0];

    const profilesQuery = useMemoFirebase(() => (user && company) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'idealCustomerProfiles') : null, [firestore, user, company]);
    const { data: profiles, isLoading: isLoadingProfiles } = useCollection<IdealCustomerProfile>(profilesQuery);
    const idealCustomerProfile = profiles?.[0];

    const creativeOutputsQuery = useMemoFirebase(() => (user && company) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'aiCreativeOutputs') : null, [firestore, user, company]);
    const { data: creativeOutputs, isLoading: isLoadingCreativeOutputs } = useCollection<AICreativeOutput>(creativeOutputsQuery);


    // --- HANDLERS ---
    async function handleGenerate(
        creativeType: 'slogan' | 'newsletter' | 'brochure',
        input: string,
        input2?: string
    ) {
        if (!company || !user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Primero debes definir la información de tu empresa.',
            });
            return;
        }

        const targetAudience = idealCustomerProfile 
                ? `Demographics: ${idealCustomerProfile.demographics}. Psychographics: ${idealCustomerProfile.psychographics}. Pain points: ${idealCustomerProfile.painPoints}. Goals: ${idealCustomerProfile.goals}`
                : 'Público general';

        let description = "";
        switch (creativeType) {
            case 'slogan':
                setIsGeneratingSlogan(true);
                description = input;
                break;
            case 'newsletter':
                setIsGeneratingNewsletter(true);
                description = `Tema: ${input}. Audiencia: ${input2}`;
                break;
            case 'brochure':
                setIsGeneratingBrochure(true);
                description = `Propuesta de Valor: ${input}. Puntos Clave: ${input2}`;
                break;
        }
        setGeneratedContent(null);

        try {
            const result = await generateCreativeContent({
                creativeType,
                companyName: company.name,
                companyDescription: description,
                targetAudience,
            });

            setGeneratedContent({ type: creativeType, content: result.generatedContent });
            
            // Save to Firestore
            const creativeOutputData = {
                companyId: company.id,
                userId: user.uid,
                outputType: creativeType,
                inputPrompt: description,
                generatedContent: result.generatedContent,
                generatedAt: new Date().toISOString()
            };
            const collectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'aiCreativeOutputs');
            addDocumentNonBlocking(collectionRef, creativeOutputData);


            toast({ title: '¡Contenido generado!', description: 'Hemos creado nuevo contenido para ti.' });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error al generar contenido',
                description: 'Hubo un problema con la IA. Por favor, inténtalo de nuevo.',
            });
        } finally {
            setIsGeneratingSlogan(false);
            setIsGeneratingNewsletter(false);
            setIsGeneratingBrochure(false);
        }
    }
    
    if (isLoadingCompanies || isLoadingProfiles) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Define tu empresa primero</AlertTitle>
                <AlertDescription>
                    Para usar el selector creativo, primero debes <Link href="/dashboard/company" className="font-bold underline">completar la información de tu empresa</Link>.
                </AlertDescription>
            </Alert>
        );
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Selector Creativo con IA</CardTitle>
                    <CardDescription>Utiliza la IA para generar ideas y contenido para tus campañas de marketing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="slogan" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="slogan">Generador de Eslóganes</TabsTrigger>
                            <TabsTrigger value="newsletter">Generador de Newsletter</TabsTrigger>
                            <TabsTrigger value="brochure">Generador de Folletos</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="slogan" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="slogan-input">Describe tu producto/servicio</Label>
                                <Textarea id="slogan-input" placeholder="Ej: Una plataforma SaaS para automatizar tareas de marketing..." value={sloganInput} onChange={(e) => setSloganInput(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={() => handleGenerate('slogan', sloganInput)} disabled={isGeneratingSlogan}>
                                {isGeneratingSlogan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isGeneratingSlogan ? "Generando..." : "Generar Eslóganes"}
                            </Button>
                        </TabsContent>

                        <TabsContent value="newsletter" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="newsletter-theme">Tema del boletín</Label>
                                <Textarea id="newsletter-theme" placeholder="Ej: Lanzamiento de nueva funcionalidad, oferta especial de verano..." value={newsletterTheme} onChange={(e) => setNewsletterTheme(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newsletter-audience">Audiencia objetivo</Label>
                                <Textarea id="newsletter-audience" placeholder="Ej: Clientes existentes, leads que no han comprado, etc." value={newsletterAudience} onChange={(e) => setNewsletterAudience(e.target.value)} />
                            </div>
                             <Button className="w-full" onClick={() => handleGenerate('newsletter', newsletterTheme, newsletterAudience)} disabled={isGeneratingNewsletter}>
                                {isGeneratingNewsletter ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isGeneratingNewsletter ? "Redactando..." : "Redactar Newsletter"}
                            </Button>
                        </TabsContent>

                        <TabsContent value="brochure" className="space-y-4 pt-4">
                             <div className="space-y-2">
                                <Label htmlFor="brochure-value">Propuesta de valor</Label>
                                <Textarea id="brochure-value" placeholder="¿Cuál es el principal beneficio que ofreces?" value={brochureValue} onChange={(e) => setBrochureValue(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brochure-points">Puntos clave a destacar</Label>
                                <Textarea id="brochure-points" placeholder="Enumera 2-3 características o beneficios importantes." value={brochurePoints} onChange={(e) => setBrochurePoints(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={() => handleGenerate('brochure', brochureValue, brochurePoints)} disabled={isGeneratingBrochure}>
                                {isGeneratingBrochure ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isGeneratingBrochure ? "Diseñando..." : "Diseñar Estructura de Folleto"}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {generatedContent && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contenido Generado Recientemente</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}

            {creativeOutputs && creativeOutputs.length > 0 && !isLoadingCreativeOutputs && (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Contenido Generado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {creativeOutputs.map(item => (
                            <Card key={item.id} className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-base capitalize">{item.outputType.replace(/([A-Z])/g, ' $1')}</CardTitle>
                                    <CardDescription>Generado el {new Date(item.generatedAt).toLocaleString('es-ES')}</CardDescription>
                                </CardHeader>
                                <CardContent className="prose dark:prose-invert max-w-none text-sm">
                                    <ReactMarkdown>{item.generatedContent}</ReactMarkdown>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            {isLoadingCreativeOutputs && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Historial de Contenido Generado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
