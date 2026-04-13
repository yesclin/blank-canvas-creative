import { useState } from "react";
import { Search, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcedureCostSummaryCard } from "@/components/cadastros-clinicos/ProcedureCostSummaryCard";

export function CatalogoClincioCostTab() {
  const [search, setSearch] = useState("");

  const { data: procedures, isLoading } = useQuery({
    queryKey: ["procedures-for-cost"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const filtered = (procedures || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Custo por Procedimento
              </CardTitle>
              <CardDescription>
                Custo operacional com base nos itens e kits vinculados a cada procedimento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimento..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search
                ? "Nenhum procedimento encontrado"
                : "Nenhum procedimento ativo cadastrado."}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((procedure) => (
                <ProcedureCostSummaryCard
                  key={procedure.id}
                  procedureId={procedure.id}
                  procedureName={procedure.name}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
