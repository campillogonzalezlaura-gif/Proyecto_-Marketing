'use client';

import { useState } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Mail, Users, Bot, Clock, Trash2, Loader2, AlertCircle } from "lucide-react";


// --- Zod Schemas & Types ---
const sequenceSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});
type SequenceFormValues = z.infer<typeof sequenceSchema>;

const leadSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("El email no es válido."),
    status: z.enum(['Nuevo', 'Contactado', 'Interesado', 'No Interesado', 'Convertido']),
});
type LeadFormValues = z.infer<typeof leadSchema>;

const ruleSchema = z.object({
    name: z.string().min(3, "El nombre de la regla es requerido."),
    trigger: z.string().min(5, "El disparador es requerido."),
    action: z.string().min(5, "La acción es requerida."),
});
type RuleFormValues = z.infer<typeof ruleSchema>;

// --- Firestore Data Types ---
type Company = { id: string; name: string; };
type EmailSequence = { id: string; name: string; description: string; createdAt: string; };
type Lead = { id: string; name: string; email: string; status: 'Nuevo' | 'Contactado' | 'Interesado' | 'No Interesado' | 'Convertido'; lastContact: string; };
type AutomationRule = { id: string; name: string; trigger: string; action: string; };


export default function AutomationPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    // --- State ---
    const [sequenceDialogOpen, setSequenceDialogOpen] = useState(false);
    const [leadDialogOpen, setLeadDialogOpen] = useState(false);
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- Data Fetching ---
    const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
    const company = companies?.[0];

    const sequencesQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/emailSequences`) : null, [firestore, user, company]);
    const { data: emailSequences, isLoading: isLoadingSequences } = useCollection<EmailSequence>(sequencesQuery);

    const leadsQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/leads`) : null, [firestore, user, company]);
    const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

    const rulesQuery = useMemoFirebase(() => company ? collection(firestore, `users/${user!.uid}/companies/${company.id}/automationRules`) : null, [firestore, user, company]);
    const { data: automationRules, isLoading: isLoadingRules } = useCollection<AutomationRule>(rulesQuery);
    
    // --- Forms ---
    const sequenceForm = useForm<SequenceFormValues>({ resolver: zodResolver(sequenceSchema) });
    const leadForm = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema) });
    const ruleForm = useForm<RuleFormValues>({ resolver: zodResolver(ruleSchema) });

    // --- Handlers ---
    async function handleSubmission<T>(
        form: any, 
        data: T, 
        collectionName: string, 
        successMessage: string, 
        closeDialog: () => void
    ) {
        if (!user || !company || !firestore) return;
        setIsSubmitting(true);
        const docData = { ...data, companyId: company.id, userId: user.uid, createdAt: new Date().toISOString() };

        if(collectionName === 'leads') {
            (docData as any).lastContact = new Date().toISOString();
        }

        const collectionRef = collection(firestore, `users/${user.uid}/companies/${company.id}/${collectionName}`);
        await addDocumentNonBlocking(collectionRef, docData);

        toast({ title: "¡Éxito!", description: successMessage });
        setIsSubmitting(false);
        closeDialog();
        form.reset();
    }

    const onSequenceSubmit = (data: SequenceFormValues) => handleSubmission(sequenceForm, data, 'emailSequences', 'Nueva secuencia de email creada.', () => setSequenceDialogOpen(false));
    const onLeadSubmit = (data: LeadFormValues) => handleSubmission(leadForm, data, 'leads', 'Nuevo lead añadido.', () => setLeadDialogOpen(false));
    const onRuleSubmit = (data: RuleFormValues) => handleSubmission(ruleForm, data, 'automationRules', 'Nueva regla de automatización creada.', () => setRuleDialogOpen(false));
    
    async function handleDelete(collectionName: string, id: string, name: string) {
        if (!user || !company || !firestore || !window.confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) return;
        
        const docRef = doc(firestore, `users/${user.uid}/companies/${company.id}/${collectionName}`, id);
        await deleteDocumentNonBlocking(docRef);
        toast({ title: 'Elemento eliminado', description: `"${name}" ha sido eliminado.`, variant: 'destructive' });
    }

    if (isLoadingCompanies) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return (
            <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Define tu empresa primero</AlertTitle>
            <AlertDescription>
                Para usar el centro de automatización, primero debes <Link href="/dashboard/company" className="font-bold underline">completar la información de tu empresa</Link>.
            </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Centro de Automatización</CardTitle>
                <CardDescription>
                Crea secuencias de email, gestiona tus leads y automatiza tareas para potenciar tu marketing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="sequences" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sequences"><Mail className="mr-2 h-4 w-4" />Secuencias</TabsTrigger>
                    <TabsTrigger value="leads"><Users className="mr-2 h-4 w-4" />Leads</TabsTrigger>
                    <TabsTrigger value="rules"><Bot className="mr-2 h-4 w-4" />Reglas</TabsTrigger>
                    <TabsTrigger value="reminders"><Clock className="mr-2 h-4 w-4" />Recordatorios</TabsTrigger>
                </TabsList>
                
                {/* Email Sequences */}
                <TabsContent value="sequences" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div><h3 className="text-lg font-semibold">Tus Secuencias</h3><p className="text-sm text-muted-foreground">Gestiona tus cadenas de correos automáticos.</p></div>
                        <Dialog open={sequenceDialogOpen} onOpenChange={setSequenceDialogOpen}>
                            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Crear Secuencia</Button></DialogTrigger>
                            <DialogContent><DialogHeader><DialogTitle>Nueva Secuencia de Email</DialogTitle><DialogDescription>Define el nombre y el propósito de tu nueva secuencia.</DialogDescription></DialogHeader>
                                <Form {...sequenceForm}><form onSubmit={sequenceForm.handleSubmit(onSequenceSubmit)} className="space-y-4 py-2">
                                    <FormField control={sequenceForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Bienvenida a nuevos usuarios" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={sequenceForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Ej: Secuencia para dar la bienvenida y mostrar las funciones clave." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <DialogFooter><Button type="button" variant="outline" onClick={() => setSequenceDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button></DialogFooter>
                                </form></Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Card>{isLoadingSequences ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : emailSequences?.length ? (<Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>{emailSequences.map((seq) => (<TableRow key={seq.id}><TableCell className="font-medium">{seq.name}</TableCell><TableCell>{seq.description}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete('emailSequences', seq.id, seq.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
                    </Table>) : <div className="p-8 text-center text-muted-foreground">No has creado ninguna secuencia todavía.</div>}</Card>
                </TabsContent>

                {/* Lead Tracking */}
                <TabsContent value="leads" className="space-y-4 pt-4">
                     <div className="flex items-center justify-between">
                        <div><h3 className="text-lg font-semibold">Tus Leads</h3><p className="text-sm text-muted-foreground">Haz un seguimiento de tus clientes potenciales.</p></div>
                         <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
                            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Añadir Lead</Button></DialogTrigger>
                             <DialogContent><DialogHeader><DialogTitle>Nuevo Lead</DialogTitle><DialogDescription>Añade un nuevo cliente potencial a tu lista.</DialogDescription></DialogHeader>
                                 <Form {...leadForm}><form onSubmit={leadForm.handleSubmit(onLeadSubmit)} className="space-y-4 py-2">
                                     <FormField control={leadForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Ana García" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={leadForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="ej: ana.g@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={leadForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Nuevo">Nuevo</SelectItem><SelectItem value="Contactado">Contactado</SelectItem><SelectItem value="Interesado">Interesado</SelectItem><SelectItem value="No Interesado">No Interesado</SelectItem><SelectItem value="Convertido">Convertido</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                     <DialogFooter><Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button></DialogFooter>
                                 </form></Form>
                             </DialogContent>
                         </Dialog>
                    </div>
                     <Card>{isLoadingLeads ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : leads?.length ? (<Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Estado</TableHead><TableHead>Último Contacto</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>{leads.map((lead) => (<TableRow key={lead.id}><TableCell className="font-medium">{lead.name}</TableCell><TableCell>{lead.email}</TableCell><TableCell><Badge variant={lead.status === 'Interesado' ? 'default' : lead.status === 'Nuevo' ? 'secondary' : lead.status === 'No Interesado' ? 'destructive' : 'outline'}>{lead.status}</Badge></TableCell><TableCell>{new Date(lead.lastContact).toLocaleDateString('es-ES')}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete('leads', lead.id, lead.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
                     </Table>) : <div className="p-8 text-center text-muted-foreground">No has añadido ningún lead todavía.</div>}</Card>
                </TabsContent>

                {/* Automation Rules */}
                <TabsContent value="rules" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div><h3 className="text-lg font-semibold">Reglas de Automatización</h3><p className="text-sm text-muted-foreground">Configura disparadores y acciones automáticas.</p></div>
                        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
                            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Crear Regla</Button></DialogTrigger>
                            <DialogContent><DialogHeader><DialogTitle>Nueva Regla de Automatización</DialogTitle><DialogDescription>Define un disparador y una acción para automatizar una tarea.</DialogDescription></DialogHeader>
                                <Form {...ruleForm}><form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-4 py-2">
                                    <FormField control={ruleForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre de la Regla</FormLabel><FormControl><Input placeholder="Ej: Asignar tarea al añadir lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={ruleForm.control} name="trigger" render={({ field }) => (<FormItem><FormLabel>Disparador (Trigger)</FormLabel><FormControl><Input placeholder="CUANDO... Ej: Se añade un nuevo lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={ruleForm.control} name="action" render={({ field }) => (<FormItem><FormLabel>Acción</FormLabel><FormControl><Input placeholder="ENTONCES... Ej: Enviar email de bienvenida" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <DialogFooter><Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button></DialogFooter>
                                </form></Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <div className="space-y-4">{isLoadingRules ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : automationRules?.length ? automationRules.map(rule => (<Card key={rule.id} className="flex items-center justify-between p-4 bg-muted/50"><div className="w-full"><p className="font-semibold">{rule.name}</p><p className="text-sm text-muted-foreground"><span className="font-medium">CUANDO:</span> {rule.trigger} ➔ <span className="font-medium">ENTONCES:</span> {rule.action}</p></div><Button variant="ghost" size="icon" onClick={() => handleDelete('automationRules', rule.id, rule.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></Card>)) : <Card className="p-8 text-center text-muted-foreground border-dashed">No has creado ninguna regla de automatización.</Card>}</div>
                </TabsContent>
                
                {/* Reminders */}
                <TabsContent value="reminders" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div><h3 className="text-lg font-semibold">Recordatorios</h3><p className="text-sm text-muted-foreground">Gestiona tus recordatorios y los de tu equipo.</p></div>
                        <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Crear Recordatorio</Button>
                    </div>
                    <Card className="text-center py-12 border-dashed">
                        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h4 className="mt-4 font-semibold">Función en desarrollo</h4>
                        <p className="mt-2 text-sm text-muted-foreground">Próximamente podrás configurar recordatorios para tareas y seguimientos importantes.</p>
                    </Card>
                </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
