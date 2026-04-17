import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useProntuarioPrint() {
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handlePrint = useCallback(() => {
    setPrinting(true);
    try {
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Erro ao imprimir');
    } finally {
      setPrinting(false);
    }
  }, []);

  const handleExport = useCallback(async (
    patientId: string,
    appointmentId?: string,
    patientName?: string,
  ) => {
    setExporting(true);
    try {
      const element = document.getElementById('print-area');
      if (!element) {
        toast.error('Área de impressão não encontrada');
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = (patientName || 'paciente').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fileName = `prontuario_${safeName}_${dateStr}.pdf`;

      pdf.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar prontuário. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { handlePrint, handleExport, printing, exporting };
}
