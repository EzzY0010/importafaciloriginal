import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada!",
      description: "Bem-vindo ao ImportaFacil",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-strong animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-medium">
            <ShoppingBag className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ImportaFacil
          </h1>
          <p className="text-muted-foreground mt-2">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Nome completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 transition-all focus:shadow-soft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 transition-all focus:shadow-soft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 transition-all focus:shadow-soft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground font-medium">
              Confirmar senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 transition-all focus:shadow-soft"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all shadow-soft hover:shadow-medium font-semibold text-base"
          >
            Criar conta
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            to="/"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
