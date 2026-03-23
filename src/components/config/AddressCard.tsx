import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { maskCEP, validateCEP, fetchAddressFromCEP } from "@/lib/validators";
import { useToast } from "@/hooks/use-toast";

interface AddressData {
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_zip: string;
  address_city: string;
  address_state: string;
}

interface AddressCardProps {
  address: AddressData;
  onAddressChange: (field: keyof AddressData, value: string) => void;
}

export function AddressCard({ address, onAddressChange }: AddressCardProps) {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleCepChange = (value: string) => {
    const masked = maskCEP(value);
    onAddressChange("address_zip", masked);
  };

  const handleCepBlur = async () => {
    const cleanCEP = address.address_zip.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return;
    }

    await searchCEP();
  };

  const searchCEP = async () => {
    const cleanCEP = address.address_zip.replace(/\D/g, '');
    
    if (!validateCEP(cleanCEP)) {
      toast({
        title: "CEP inválido",
        description: "Informe um CEP válido com 8 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const result = await fetchAddressFromCEP(cleanCEP);

      if (result) {
        onAddressChange("address_street", result.logradouro || address.address_street);
        onAddressChange("address_neighborhood", result.bairro || address.address_neighborhood);
        onAddressChange("address_city", result.localidade || address.address_city);
        onAddressChange("address_state", result.uf || address.address_state);
        
        toast({
          title: "Endereço encontrado!",
          description: "Os campos foram preenchidos automaticamente.",
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP ou preencha o endereço manualmente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o endereço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereço
        </CardTitle>
        <CardDescription>
          Localização da clínica para pacientes e documentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="zip">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="zip"
              value={address.address_zip}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              maxLength={9}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={searchCEP}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Digite o CEP para preencher o endereço automaticamente
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="street">Rua/Avenida</Label>
            <Input
              id="street"
              value={address.address_street}
              onChange={(e) => onAddressChange("address_street", e.target.value)}
              placeholder="Nome da rua"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={address.address_number}
              onChange={(e) => onAddressChange("address_number", e.target.value)}
              placeholder="123"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={address.address_complement}
            onChange={(e) => onAddressChange("address_complement", e.target.value)}
            placeholder="Sala, andar, bloco..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={address.address_neighborhood}
              onChange={(e) => onAddressChange("address_neighborhood", e.target.value)}
              placeholder="Bairro"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={address.address_city}
              onChange={(e) => onAddressChange("address_city", e.target.value)}
              placeholder="Cidade"
            />
          </div>
        </div>

        <div className="grid gap-2 max-w-[100px]">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={address.address_state}
            onChange={(e) => onAddressChange("address_state", e.target.value.toUpperCase())}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
