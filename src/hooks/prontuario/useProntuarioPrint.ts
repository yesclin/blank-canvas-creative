import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Convert external images (e.g. signed Supabase URLs) inside an element to
 * inline base64 data URIs so html2canvas can capture them without CORS errors.
 */
async function inlineExternalImages(container: HTMLElement): Promise<() => void> {
  const images = container.querySelectorAll('img[crossorigin], img[crossOrigin]');
  const originals: { img: HTMLImageElement; src: string }[] = [];

  await Promise.all(
    Array.from(images).map(async (imgEl) => {
      const img = imgEl as HTMLImageElement;
      const src = img.src;
      if (!src || src.startsWith('data:')) return;

      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        originals.push({ img, src });
        img.src = dataUrl;
      } catch {
        // If fetch fails, leave original — html2canvas may still capture it
      }
    })
  );

  // Return a restore function
  return () => {
    originals.forEach(({ img, src }) => {
      img.src = src;
    });
  };
}

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
        console.error('PDF Export: #print-area element not found');
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Pre-convert external images to base64 to avoid CORS issues
      const restoreImages = await inlineExternalImages(element);

      // Save original styles that block html2canvas from capturing full content
      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;
      const originalMinHeight = element.style.minHeight;
      const originalHeight = element.style.height;
      const originalFlex = element.style.flex;

      // Temporarily remove layout constraints so html2canvas captures everything
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.minHeight = 'auto';
      element.style.height = 'auto';
      element.style.flex = 'none';

      // Also handle the scrollable child (main > div)
      const scrollableChild = element.querySelector('main');
      let childOriginalOverflow = '';
      let childOriginalHeight = '';
      if (scrollableChild) {
        childOriginalOverflow = scrollableChild.style.overflow;
        childOriginalHeight = scrollableChild.style.height;
        scrollableChild.style.overflow = 'visible';
        scrollableChild.style.height = 'auto';
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: element.scrollHeight,
          height: element.scrollHeight,
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
      } finally {
        // Restore original styles
        element.style.overflow = originalOverflow;
        element.style.maxHeight = originalMaxHeight;
        element.style.minHeight = originalMinHeight;
        element.style.height = originalHeight;
        element.style.flex = originalFlex;

        if (scrollableChild) {
          scrollableChild.style.overflow = childOriginalOverflow;
          scrollableChild.style.height = childOriginalHeight;
        }

        // Restore original image sources
        restoreImages();
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar prontuário. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { handlePrint, handleExport, printing, exporting };
}
