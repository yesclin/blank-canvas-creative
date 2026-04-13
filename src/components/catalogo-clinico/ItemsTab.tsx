import { Package, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMaterialsList } from "@/hooks/useMaterialsCRUD";

export function CatalogoClinicoItemsTab() {
  const navigate = useNavigate();
  const { data: items, isLoading } = useMaterialsList();
  const [search, setSearch] = useState("");

  const filtered = (items || []).filter(
    (item) => item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Esta é uma visualização dos itens com perfil assistencial/clínico cadastrados no estoque.
          Para criar ou editar itens, acesse <strong>Gestão → Estoque</strong>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itens Assistenciais</CardTitle>
              <CardDescription>
                {filtered.length} {filtered.length === 1 ? "item" : "itens"} com perfil clínico
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/app/gestao/estoque")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Estoque
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item assistencial..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {search
                      ? "Nenhum item encontrado com esse termo"
                      : "Nenhum item assistencial cadastrado. Cadastre itens em Gestão → Estoque com tipo \"Consumo Clínico\"."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category || "Sem categoria"}</Badge>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      {item.cost_price != null
                        ? `R$ ${Number(item.cost_price).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
