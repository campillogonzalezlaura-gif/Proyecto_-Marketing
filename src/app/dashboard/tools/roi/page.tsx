'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calculator, Percent } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Zod Schema & Type ---
const roiSchema = z.object({
  investment: z.coerce.number().min(0.01, "La inversión debe ser mayor que cero."),
  revenue: z.coerce.number().min(0, "Los ingresos no pueden ser negativos."),
});
type RoiFormValues = z.infer<typeof roiSchema>;

// --- ROI Calculator Component ---
function RoiCalculator() {
  const [roi, setRoi] = useState<number | null>(null);

  const form = useForm<RoiFormValues>({
    resolver: zodResolver(roiSchema),
    defaultValues: {
      investment: undefined,
      revenue: undefined,
    },
  });

  function onSubmit(data: RoiFormValues) {
    const { investment, revenue } = data;
    const calculatedRoi = ((revenue - investment) / investment) * 100;
    setRoi(calculatedRoi);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="investment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inversión Total (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingresos Generados (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 2500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit">
            <Calculator className="mr-2 h-4 w-4" />
            Calcular ROI
          </Button>
        </form>
      </Form>

      {roi !== null && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Resultado del ROI</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center text-center">
            <div className="space-y-2">
                <div className={`text-6xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {roi.toFixed(2)}%
                </div>
                 <p className="text-muted-foreground">
                    Por cada euro invertido, has {roi >= 0 ? 'ganado' : 'perdido'} {(Math.abs(roi) / 100).toFixed(2)} euros.
                </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// --- Main Page Component ---
export default function RoiPage() {
  const { user, isUserLoading } = useUser();

  // For this page, we only need to know if the user is logged in.
  // A full implementation might require fetching company data to ensure it's set up.

  if (isUserLoading) {
    return null; // Or a loader
  }

  if (!user) {
    // This case should be handled by the layout, but as a fallback:
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acceso denegado</AlertTitle>
        <AlertDescription>
          Debes <Link href="/login" className="font-bold underline">iniciar sesión</Link> para usar esta herramienta.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Retorno de la Inversión (ROI)</CardTitle>
        <CardDescription>
          Calcula el ROI estimado y real para tus campañas o acciones de marketing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="estimated" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estimated">ROI Estimado</TabsTrigger>
                <TabsTrigger value="real">ROI Real</TabsTrigger>
            </TabsList>
            <TabsContent value="estimated" className="pt-6">
                <h3 className="font-semibold mb-2">Calcular ROI Estimado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Introduce las cifras que esperas obtener para estimar la rentabilidad de una futura campaña.
                </p>
                <RoiCalculator />
            </TabsContent>
             <TabsContent value="real" className="pt-6">
                <h3 className="font-semibold mb-2">Calcular ROI Real</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Introduce los costes e ingresos reales de una campaña ya finalizada para medir su rendimiento.
                </p>
                <RoiCalculator />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
