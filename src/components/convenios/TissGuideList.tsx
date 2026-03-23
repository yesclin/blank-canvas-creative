import { useState } from "react";
import { FileText, Plus, Search, Eye, Send, CheckCircle, XCircle, Clock, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TissGuide, Insurance, TissGuideStatus, TissGuideType } from "@/types/convenios";
import { guideTypeLabels, guideStatusLabels, guideStatusColors } from "@/types/convenios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TissGuideDialog } from "./TissGuideDialog";

interface TissGuideListProps {
  guides: TissGuide[];
  insurances: Insurance[];
  patients: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string }>;
  onViewGuide?: (guide: TissGuide) => void;
}

export function TissGuideList({ guides, insurances, patients, professionals, onViewGuide }: TissGuideListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<TissGuide | null>(null);

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch = 
      guide.guide_number.toLowerCase().includes(search.toLowerCase()) ||
      guide.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      guide.insurance_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || guide.status === statusFilter;
    const matchesType = typeFilter === "all" || guide.guide_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusIcon = (status: TissGuideStatus) => {
    switch (status) {
      case 'rascunho':
        return <FileText className="h-3 w-3" />;
      case 'aberta':
        return <Clock className="h-3 w-3" />;
      case 'enviada':
        return <Send className="h-3 w-3" />;
      case 'aprovada':
        return <CheckCircle className="h-3 w-3" />;
      case 'aprovada_parcial':
        return <AlertTriangle className="h-3 w-3" />;
      case 'negada':
        return <XCircle className="h-3 w-3" />;
      case 'cancelada':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleNewGuide = () => {
    setSelectedGuide(null);
    setIsDialogOpen(true);
  };

  const handleViewGuide = (guide: TissGuide) => {
    setSelectedGuide(guide);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar guia, paciente..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="aberta">Em Aberto</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="aprovada_parcial">Aprovada Parcial</SelectItem>
              <SelectItem value="negada">Negada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="consulta">Consulta</SelectItem>
              <SelectItem value="sp_sadt">SP/SADT</SelectItem>
              <SelectItem value="internacao">Internação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleNewGuide}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Guia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guias TISS
          </CardTitle>
          <CardDescription>
            Gerencie as guias de atendimento do convênio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Guia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Solicitado</TableHead>
                <TableHead>Valor Aprovado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhuma guia encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuides.map((guide) => (
                  <TableRow key={guide.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewGuide(guide)}>
                    <TableCell className="font-mono font-medium">{guide.guide_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {guideTypeLabels[guide.guide_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{guide.patient_name}</TableCell>
                    <TableCell>{guide.insurance_name}</TableCell>
                    <TableCell>{guide.professional_name || '-'}</TableCell>
                    <TableCell>
                      {format(parseISO(guide.service_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{formatCurrency(guide.total_requested)}</TableCell>
                    <TableCell>
                      <span className={guide.total_approved > 0 ? 'text-green-600 font-medium' : ''}>
                        {formatCurrency(guide.total_approved)}
                      </span>
                      {guide.total_glosa > 0 && (
                        <div className="text-xs text-red-600">
                          Glosa: {formatCurrency(guide.total_glosa)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={guideStatusColors[guide.status]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(guide.status)}
                          {guideStatusLabels[guide.status]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewGuide(guide);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TissGuideDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        guide={selectedGuide}
        insurances={insurances}
        patients={patients}
        professionals={professionals}
      />
    </div>
  );
}
