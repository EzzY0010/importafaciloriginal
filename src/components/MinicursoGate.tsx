import { BookOpen, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MinicursoGate = () => {
  const navigate = useNavigate();
  return (
    <Card className="max-w-2xl mx-auto border-gold/40 shadow-lg">
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gold" />
        </div>
        <CardTitle className="text-2xl">Área de mentoria bloqueada</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-5">
        <p className="text-muted-foreground">Seu minicurso está liberado, mas esta área exige um plano de mentoria ou acesso ativo ao site.</p>
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold" onClick={() => navigate("/acesso-minicurso")}>
          <BookOpen className="w-4 h-4 mr-2" /> Clique aqui para receber o minicurso
        </Button>
      </CardContent>
    </Card>
  );
};

export default MinicursoGate;
