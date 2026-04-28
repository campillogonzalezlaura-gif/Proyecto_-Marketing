'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Schemas ---
const companyFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  industry: z.string().min(2, { message: "El sector debe tener al menos 2 caracteres." }),
  location: z.string().min(2, { message: "La ubicación debe tener al menos 2 caracteres." }),
  size: z.string({ required_error: "Por favor, selecciona el tamaño de la empresa." }),
  budget: z.coerce.number().positive({ message: "El presupuesto debe ser un número positivo." }),
  objectives: z.string().min(10, { message: "Los objetivos deben tener al menos 10 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

const productFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
  description: z.string().min(10, { message: "La descripción del producto debe tener al menos 10 caracteres." }),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }).optional(),
  targetAudience: z.string().min(10, { message: "El público objetivo debe tener al menos 10 caracteres." }).optional(),
});

// --- Types ---
type CompanyFormValues = z.infer<typeof companyFormSchema>;
type Company = CompanyFormValues & { id: string };

type ProductFormValues = z.infer<typeof productFormSchema>;
type Product = ProductFormValues & { id: string };

// --- Component ---
export default function CompanyPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);

  // --- Data Fetching ---
  const companiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'companies');
  }, [firestore, user]);

  const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);
  const company = companies?.[0];

  const productsQuery = useMemoFirebase(() => {
    if (!user || !company) return null;
    return collection(firestore, 'users', user.uid, 'companies', company.id, 'products');
  }, [firestore, user, company]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  // For this simplified version, we'll just manage the first product.
  const product = products?.[0];

  // --- Forms Setup ---
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: "", industry: "", location: "", budget: 0, objectives: "", description: "" },
    mode: "onChange",
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "", price: 0, targetAudience: "" },
    mode: "onChange",
  });

  // --- Effects to sync form with data from Firestore ---
  useEffect(() => {
    if (company) {
      companyForm.reset(company);
    }
  }, [company, companyForm]);

  useEffect(() => {
    if (product) {
      productForm.reset(product);
    } else {
      productForm.reset({ name: "", description: "", price: 0, targetAudience: "" });
    }
  }, [product, productForm]);


  // --- Submit Handlers ---
  async function onCompanySubmit(data: CompanyFormValues) {
    setIsCompanySubmitting(true);
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error de autenticación" });
      setIsCompanySubmitting(false);
      return;
    }

    const companyData = { ...data, userId: user.uid };

    try {
      if (company?.id) {
        const companyRef = doc(firestore, 'users', user.uid, 'companies', company.id);
        setDocumentNonBlocking(companyRef, companyData, { merge: true });
        toast({ title: "¡Empresa actualizada!" });
      } else {
        const collectionRef = collection(firestore, 'users', user.uid, 'companies');
        await addDocumentNonBlocking(collectionRef, companyData);
        toast({ title: "¡Empresa guardada!" });
      }
    } catch (error: any) {
        console.error("Error saving company data: ", error);
    } finally {
      setIsCompanySubmitting(false);
    }
  }

  async function onProductSubmit(data: ProductFormValues) {
    setIsProductSubmitting(true);
    if (!user || !firestore || !company) {
        toast({ variant: "destructive", title: "Error", description: "Primero debes guardar los datos de la empresa." });
        setIsProductSubmitting(false);
        return;
    }

    const productData = { ...data, userId: user.uid, companyId: company.id };

    try {
        if (product?.id) {
            const productRef = doc(firestore, 'users', user.uid, 'companies', company.id, 'products', product.id);
            setDocumentNonBlocking(productRef, productData, { merge: true });
            toast({ title: "¡Producto actualizado!" });
        } else {
            const collectionRef = collection(firestore, 'users', user.uid, 'companies', company.id, 'products');
            await addDocumentNonBlocking(collectionRef, productData);
            toast({ title: "¡Producto guardado!" });
        }
    } catch (error: any) {
        console.error("Error saving product data: ", error);
    } finally {
        setIsProductSubmitting(false);
    }
  }


  if (isUserLoading || isLoadingCompanies) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div className="space-y-8">
          <Card>
              <CardHeader>
                  <CardTitle>Define tu Empresa</CardTitle>
                  <CardDescription>
                  Ingresa la información clave sobre tu negocio. Estos datos nos ayudarán a generar un plan de marketing a tu medida.
                  </CardDescription>
              </CardHeader>
              <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)}>
                      <CardContent className="space-y-6">
                          {/* Company form fields are unchanged */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={companyForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="Ej: MarketFlow AI" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={companyForm.control} name="industry" render={({ field }) => (<FormItem><FormLabel>Sector</FormLabel><FormControl><Input placeholder="Ej: Software, Marketing, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                              <FormField control={companyForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Ej: Madrid, España" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={companyForm.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Tamaño de la Empresa</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tamaño" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Small (1-50 employees)">Pequeña (1-50 empleados)</SelectItem><SelectItem value="Medium (51-250 employees)">Mediana (51-250 empleados)</SelectItem><SelectItem value="Large (250+ employees)">Grande (250+ empleados)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                          </div>
                          <FormField control={companyForm.control} name="budget" render={({ field }) => (<FormItem><FormLabel>Presupuesto de Marketing Mensual (€)</FormLabel><FormControl><Input type="number" placeholder="Ej: 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={companyForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción del Negocio</FormLabel><FormControl><Textarea placeholder="Describe tu empresa, qué hace, a quién sirve y cuál es su misión." className="resize-none" rows={4} {...field}/></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={companyForm.control} name="objectives" render={({ field }) => (<FormItem><FormLabel>Objetivos Clave</FormLabel><FormControl><Textarea placeholder="Describe los principales objetivos que quieres alcanzar con tu marketing." className="resize-none" rows={3} {...field}/></FormControl><FormMessage /></FormItem>)} />
                      </CardContent>
                      <CardFooter>
                          <Button type="submit" disabled={isCompanySubmitting}>
                              {isCompanySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {company ? 'Actualizar Empresa' : 'Guardar Empresa'}
                          </Button>
                      </CardFooter>
                  </form>
              </Form>
          </Card>

          {/* --- Product Form Card --- */}
          <Card>
              <CardHeader>
                  <CardTitle>Define tu Producto o Servicio</CardTitle>
                  <CardDescription>
                      Ahora, describe el producto o servicio principal que ofreces. Debes guardar la empresa para poder guardar el producto.
                  </CardDescription>
              </CardHeader>
              <Form {...productForm}>
                 <form onSubmit={productForm.handleSubmit(onProductSubmit)}>
                  <fieldset disabled={!company || isLoadingCompanies} className="group">
                     <CardContent className="space-y-6">
                          <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Producto/Servicio</FormLabel><FormControl><Input placeholder="Ej: Suscripción Pro a MarketFlow" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción del Producto/Servicio</FormLabel><FormControl><Textarea placeholder="Describe qué es, qué problema soluciona y para quién es." className="resize-none" rows={4} {...field}/></FormControl><FormMessage /></FormItem>)}/>
                         <div className="grid md:grid-cols-2 gap-6">
                             <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (€) <span className="text-muted-foreground">(opcional)</span></FormLabel><FormControl><Input type="number" placeholder="Ej: 49.99" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormField control={productForm.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Público Objetivo <span className="text-muted-foreground">(opcional)</span></FormLabel><FormControl><Textarea placeholder="Describe específicamente a quién se dirige este producto." className="resize-none" rows={1} {...field}/></FormControl><FormMessage /></FormItem>)}/>
                         </div>
                     </CardContent>
                     <CardFooter>
                         <Button type="submit" disabled={!company || isProductSubmitting}>
                             {isProductSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             {product ? 'Actualizar Producto' : 'Guardar Producto'}
                         </Button>
                     </CardFooter>
                    </fieldset>
                 </form>
              </Form>
          </Card>
      </div>
  );
}
