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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import { useState } from "react";
import { AlertCircle, FileText, Loader2, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

// Zod schemas for validation
const marketingTaskFormSchema = z.object({
  action: z.string().min(5, { message: "La acción debe tener al menos 5 caracteres." }),
  channel: z.string().min(3, { message: "El canal debe tener al menos 3 caracteres." }),
  responsible: z.string().min(2, { message: "El responsable debe tener al menos 2 caracteres." }),
  budget: z.coerce.number().positive({ message: "El presupuesto debe ser un número positivo." }),
  expectedKpi: z.string().min(3, { message: "El KPI debe tener al menos 3 caracteres." }),
});
type MarketingTaskFormValues = z.infer<typeof marketingTaskFormSchema>;

// Firestore data types
type Company = { id: string; userId: string; name: string; };
type MarketingPlan = {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  generatedDate: string;
  description: string;
  status: string;
};
type MarketingTask = { id: string; marketingPlanId: string; userId: string; companyId: string; } & MarketingTaskFormValues;

export default function MarketingPlanPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // --- DATA FETCHING ---
  const companiesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
  const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
  const company = companies?.[0];

  const marketingPlansQuery = useMemoFirebase(() => (user && company) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'marketingPlans') : null, [firestore, user, company]);
  const { data: marketingPlans, isLoading: isLoadingPlans } = useCollection<MarketingPlan>(marketingPlansQuery);
  const marketingPlan = marketingPlans?.[0]; // For simplicity, we use the first plan

  const marketingTasksQuery = useMemoFirebase(() => (user && company && marketingPlan) ? collection(firestore, 'users', user.uid, 'companies', company.id, 'marketingPlans', marketingPlan.id, 'marketingTasks') : null, [firestore, user, company, marketingPlan]);
  const { data: marketingTasks, isLoading: isLoadingTasks } = useCollection<MarketingTask>(marketingTasksQuery);

  // --- FORM SETUP ---
  const taskForm = useForm<MarketingTaskFormValues>({
    resolver: zodResolver(marketingTaskFormSchema),
    defaultValues: { action: "", channel: "", responsible: "", budget: 0, expectedKpi: "" },
  });

  // --- HANDLERS ---
  async function handleCreatePlan() {
    if (!user || !company || !firestore) return;
    const planCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'marketingPlans');
    const newPlanData = {
      companyId: company.id,
      userId: user.uid,
      title: `Plan de Marketing para ${company.name}`,
      description: "Plan de ejecución de marketing inicial.",
      generatedDate: new Date().toISOString(),
      status: 'Draft',
    };
    await addDocumentNonBlocking(planCollectionRef, newPlanData);
    toast({ title: "¡Plan creado!", description: "Ahora puedes empezar a añadir tareas." });
  }

  async function onTaskSubmit(data: MarketingTaskFormValues) {
    setIsTaskSubmitting(true);
    if (!user || !company || !marketingPlan || !firestore) return;

    const taskData = {
      ...data,
      marketingPlanId: marketingPlan.id,
      companyId: company.id,
      userId: user.uid,
      status: 'Pending',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(), // Placeholder
    };

    const taskCollectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'marketingPlans', marketingPlan.id, 'marketingTasks');
    addDocumentNonBlocking(taskCollectionRef, taskData);

    toast({ title: "¡Tarea añadida!", description: "La nueva tarea ha sido añadida al plan." });
    taskForm.reset();
    setIsTaskDialogOpen(false);
    setIsTaskSubmitting(false);
  }

  function handleDeleteTask(taskId: string) {
    if (!user || !company || !marketingPlan || !firestore) return;
    const taskRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'marketingPlans', marketingPlan.id, 'marketingTasks', taskId);
    deleteDocumentNonBlocking(taskRef);
    toast({ title: "Tarea eliminada", variant: "destructive" });
  }

  // --- RENDER LOGIC ---
  if (isLoadingCompanies || isLoadingPlans) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!company) {
    return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Define tu empresa primero</AlertTitle>
          <AlertDescription>
            Para crear un plan de marketing, primero debes <Link href="/dashboard/company" className="font-bold underline">definir tu empresa</Link>.
          </AlertDescription>
        </Alert>
    );
  }

  if (!marketingPlan) {
    return (
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <FileText className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="mt-4">No hay un plan de marketing activo</CardTitle>
          <CardDescription>
            Crea tu primer plan de marketing para empezar a organizar tus tareas y estrategias.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={handleCreatePlan}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Plan de Marketing
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle>{marketingPlan.title}</CardTitle>
          <CardDescription>{marketingPlan.description}</CardDescription>
        </div>
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Tarea de Marketing</DialogTitle>
              <DialogDescription>Completa los detalles de la nueva acción a realizar.</DialogDescription>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4 py-4">
                <FormField control={taskForm.control} name="action" render={({ field }) => (
                  <FormItem><FormLabel>Acción</FormLabel><FormControl><Textarea placeholder="Describe la tarea específica. Ej: Crear una campaña de anuncios en Facebook para el lanzamiento del producto X." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={taskForm.control} name="channel" render={({ field }) => (
                        <FormItem><FormLabel>Canal</FormLabel><FormControl><Input placeholder="Ej: Redes Sociales, SEO" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={taskForm.control} name="responsible" render={({ field }) => (
                        <FormItem><FormLabel>Responsable</FormLabel><FormControl><Input placeholder="Ej: Equipo de Marketing" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={taskForm.control} name="budget" render={({ field }) => (
                        <FormItem><FormLabel>Presupuesto (€)</FormLabel><FormControl><Input type="number" placeholder="Ej: 500" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={taskForm.control} name="expectedKpi" render={({ field }) => (
                        <FormItem><FormLabel>KPI Esperado</FormLabel><FormControl><Input placeholder="Ej: 1000 clics, 50 leads" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isTaskSubmitting}>
                    {isTaskSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Tarea
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingTasks && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!isLoadingTasks && marketingTasks && marketingTasks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Acción</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Presupuesto (€)</TableHead>
                <TableHead>KPI Esperado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.action}</TableCell>
                  <TableCell>{task.channel}</TableCell>
                  <TableCell>{task.responsible}</TableCell>
                  <TableCell>{task.budget.toLocaleString('es-ES')}</TableCell>
                  <TableCell>{task.expectedKpi}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoadingTasks && (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Aún no has añadido ninguna tarea a este plan.</p>
                <p className="text-sm text-muted-foreground">Haz clic en "Añadir Tarea" para empezar.</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

    