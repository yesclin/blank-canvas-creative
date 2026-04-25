import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface Props { title: string; description: string; }

export default function SuperAdminStub({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Construction className="h-4 w-4" /> Em construção</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta seção do painel Super Admin já tem o backend pronto (tabelas, RLS e funções).
            A interface dedicada será adicionada em uma próxima iteração.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
