'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo a tu panel...",
        });
      })
      .catch((error: AuthError) => {
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: "Tus credenciales son incorrectas. Por favor, inténtalo de nuevo.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">¿No tienes cuenta?</span>
          <Button variant="outline" asChild>
              <Link href="/signup">Regístrate</Link>
          </Button>
      </div>
      <main className="flex h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm border-2">
          <CardHeader className="items-center text-center">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <CardTitle className="font-headline text-2xl">¡Bienvenido de vuelta!</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
