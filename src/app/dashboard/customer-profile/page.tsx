'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Updated schema to make all fields part of the manual form
const profileFormSchema = z.object({
  personaName: z.string().min(3, "El nombre de la persona es requerido."),
  ageRange: z.string().min(3, "El rango de edad es requerido."),
  occupation: z.string().min(3, "La ocupación es requerida."),
  demographics: z.string().min(10, "La información demográfica es requerida."),
  psychographics: z.string().min(10, "La información psicográfica es requerida."),
  painPoints: z.string().min(10, "Los puntos de dolor son requeridos."),
  goals: z.string().min(10, "Las metas son requeridas."),
  needs: z.string().min(10, "Las necesidades son requeridas."),
  objections: z.string().min(10, "Las objeciones son requeridas."),
  preferredChannels: z.string().min(3, "Los canales de contacto son requeridos."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Firestore data types
type Company = {
    id: string;
    userId: string;
    name: string;
    description: string;
    objectives: string;
};

// Merged IdealCustomerProfile type
type IdealCustomerProfile = ProfileFormValues & {
    id: string;
    companyId: string;
    userId: string;
};

function ProfileForm({ idealCustomerProfile, company }: { idealCustomerProfile: IdealCustomerProfile | undefined, company: Company }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: idealCustomerProfile || {
            personaName: "",
            ageRange: "",
            occupation: "",
            demographics: "",
            psychographics: "",
            painPoints: "",
            goals: "",
            needs: "",
            objections: "",
            preferredChannels: "",
        }
    });

    useEffect(() => {
        form.reset(idealCustomerProfile || {
            personaName: "",
            ageRange: "",
            occupation: "",
            demographics: "",
            psychographics: "",
            painPoints: "",
            goals: "",
            needs: "",
            objections: "",
            preferredChannels: "",
        });
    }, [idealCustomerProfile, form]);

    async function onSubmit(data: ProfileFormValues) {
        if (!user || !firestore || !company) return;
        setIsSubmitting(true);
        
        const profileData = {
            ...data,
            userId: user.uid,
            companyId: company.id,
        };

        try {
            if (idealCustomerProfile?.id) {
                const profileRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'idealCustomerProfiles', idealCustomerProfile.id);
                setDocumentNonBlocking(profileRef, profileData, { merge: true });
                toast({ title: "¡Perfil actualizado!" });
            } else {
                const profileCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'idealCustomerProfiles');
                await addDocumentNonBlocking(profileCollectionRef, profileData);
                toast({ title: "¡Perfil creado!" });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el perfil.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Perfil del Cliente Ideal</CardTitle>
                        <CardDescription>
                            Define los rasgos demográficos, psicográficos y de comportamiento de tu cliente perfecto.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="personaName" render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Buyer Persona</FormLabel><FormControl><Input placeholder="Ej: Marketing Manager María" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid md:grid-cols-2 gap-6">
                             <FormField control={form.control} name="ageRange" render={({ field }) => (
                                <FormItem><FormLabel>Rango de Edad</FormLabel><FormControl><Input placeholder="Ej: 25-45 años" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="occupation" render={({ field }) => (
                                <FormItem><FormLabel>Ocupación</FormLabel><FormControl><Input placeholder="Ej: Profesionales jóvenes, Emprendedores" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="demographics" render={({ field }) => (
                            <FormItem><FormLabel>Información Demográfica</FormLabel><FormControl><Textarea placeholder="Describe su nivel educativo, rango de ingresos, ubicación, etc." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="psychographics" render={({ field }) => (
                            <FormItem><FormLabel>Información Psicográfica</FormLabel><FormControl><Textarea placeholder="Describe sus intereses, estilo de vida, valores y rasgos de personalidad." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Motivaciones y Retos</CardTitle>
                        <CardDescription>Entiende qué necesita, qué le preocupa y cuáles son sus objetivos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="painPoints" render={({ field }) => (
                             <FormItem><FormLabel>Puntos de Dolor</FormLabel><FormControl><Textarea placeholder="¿Cuáles son sus frustraciones o problemas principales?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="goals" render={({ field }) => (
                             <FormItem><FormLabel>Metas y Aspiraciones</FormLabel><FormControl><Textarea placeholder="¿Qué objetivos personales o profesionales quiere alcanzar?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="needs" render={({ field }) => (
                            <FormItem><FormLabel>Necesidades Principales</FormLabel><FormControl><Textarea placeholder="¿Qué necesita tu cliente ideal que tu producto/servicio puede satisfacer?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="objections" render={({ field }) => (
                            <FormItem><FormLabel>Objeciones Comunes</FormLabel><FormControl><Textarea placeholder="¿Qué dudas o impedimentos podría tener antes de comprar?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="preferredChannels" render={({ field }) => (
                            <FormItem><FormLabel>Canales de Contacto Preferidos</FormLabel><FormControl><Input placeholder="Ej: Email, LinkedIn, Instagram, Blogs" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {idealCustomerProfile ? 'Actualizar Perfil' : 'Guardar Perfil'}
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}


export default function CustomerProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    // --- DATA FETCHING ---
    const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const company = companies?.[0];

    const profilesQuery = useMemoFirebase(() => (user && company) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'idealCustomerProfiles') : null, [firestore, user, company]);
    const { data: profiles, isLoading: isLoadingProfiles } = useCollection<IdealCustomerProfile>(profilesQuery);
    const idealCustomerProfile = profiles?.[0];

    // --- RENDER LOGIC ---
    if (isLoadingCompanies || isLoadingProfiles) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Define tu empresa primero</AlertTitle>
                <AlertDescription>
                    Para crear el perfil de tu cliente ideal, necesitamos que primero <Link href="/dashboard/company" className="font-bold underline">completes la información de tu empresa</Link>.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-6">
            <ProfileForm idealCustomerProfile={idealCustomerProfile} company={company} />
        </div>
    );
}
