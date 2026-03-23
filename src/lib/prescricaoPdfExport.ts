import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Prescricao } from '@/hooks/prontuario/clinica-geral/usePrescricoesData';

interface PdfOptions {
  patientName?: string;
  clinicName?: string;
  clinicAddress?: string;
}

const tipoReceitaLabels: Record<string, string> = {
  simples: 'RECEITA SIMPLES',
  controle_especial: 'RECEITA DE CONTROLE ESPECIAL',
  antimicrobiano: 'RECEITA ANTIMICROBIANO',
  entorpecente: 'RECEITA ENTORPECENTE',
};

const viaAdministracaoLabels: Record<string, string> = {
  oral: 'Via Oral',
  topica: 'Uso Tópico',
  injetavel: 'Injetável',
  inalatoria: 'Inalatória',
  sublingual: 'Sublingual',
  retal: 'Retal',
  oftalmico: 'Oftálmico',
  nasal: 'Nasal',
  otologico: 'Otológico',
  transdermico: 'Transdérmico',
  outra: 'Outra',
};

/**
 * Generate a PDF for a prescription and trigger download.
 * Uses the browser's print functionality for PDF generation.
 */
export function generatePrescricaoPDF(
  prescricao: Prescricao,
  options: PdfOptions = {}
): void {
  const {
    patientName = 'Paciente',
    clinicName = 'Clínica',
    clinicAddress = '',
  } = options;

  const dataPrescricao = format(
    new Date(prescricao.data_prescricao),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  const tipoReceita = tipoReceitaLabels[prescricao.tipo_receita] || 'RECEITA';

  // Build medication items HTML
  const medicamentosHtml = prescricao.itens
    .map((item, idx) => {
      const concentracao = item.medicamento_concentracao ? ` ${item.medicamento_concentracao}` : '';
      const forma = item.medicamento_forma_farmaceutica ? ` - ${item.medicamento_forma_farmaceutica}` : '';
      const via = viaAdministracaoLabels[item.via_administracao] || '';
      const usoContinuo = item.uso_continuo ? ' <span class="uso-continuo">(Uso Contínuo)</span>' : '';
      const duracao = item.duracao_dias ? ` por ${item.duracao_dias} dias` : '';
      const instrucoes = item.instrucoes_especiais 
        ? `<div class="instrucoes">${item.instrucoes_especiais}</div>` 
        : '';

      return `
        <div class="medicamento">
          <div class="medicamento-header">
            <span class="numero">${idx + 1}.</span>
            <span class="nome">${item.medicamento_nome}${concentracao}${forma}</span>
            ${usoContinuo}
          </div>
          <div class="posologia">
            <strong>Dose:</strong> ${item.dose} ${item.unidade_dose || ''} - ${via}
          </div>
          <div class="posologia">
            <strong>Posologia:</strong> ${item.posologia}${duracao}
          </div>
          ${item.frequencia ? `<div class="posologia"><strong>Frequência:</strong> ${item.frequencia}</div>` : ''}
          ${instrucoes}
        </div>
      `;
    })
    .join('');

  // Build complete HTML document
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Receita - ${patientName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          background: #fff;
          padding: 20mm;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        
        .clinic-name {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .clinic-address {
          font-size: 10pt;
          color: #333;
        }
        
        .tipo-receita {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background: #f5f5f5;
          border: 1px solid #ccc;
        }
        
        .patient-info {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          background: #fafafa;
        }
        
        .patient-name {
          font-size: 14pt;
          font-weight: bold;
        }
        
        .date {
          font-size: 10pt;
          color: #666;
          margin-top: 5px;
        }
        
        .medicamentos {
          margin: 30px 0;
        }
        
        .medicamento {
          margin-bottom: 25px;
          padding-left: 20px;
          border-left: 3px solid #333;
        }
        
        .medicamento-header {
          font-size: 13pt;
          margin-bottom: 8px;
        }
        
        .numero {
          font-weight: bold;
          margin-right: 10px;
        }
        
        .nome {
          font-weight: bold;
        }
        
        .uso-continuo {
          font-size: 10pt;
          color: #666;
          font-style: italic;
          margin-left: 10px;
        }
        
        .posologia {
          font-size: 11pt;
          margin: 5px 0;
          padding-left: 20px;
        }
        
        .instrucoes {
          font-size: 10pt;
          font-style: italic;
          color: #444;
          margin-top: 8px;
          padding-left: 20px;
        }
        
        .observacoes {
          margin-top: 30px;
          padding: 15px;
          background: #f9f9f9;
          border: 1px dashed #ccc;
        }
        
        .observacoes-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
        }
        
        .assinatura {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #000;
          width: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .profissional {
          font-weight: bold;
        }
        
        .validade {
          margin-top: 30px;
          font-size: 10pt;
          color: #666;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">${clinicName}</div>
        ${clinicAddress ? `<div class="clinic-address">${clinicAddress}</div>` : ''}
      </div>
      
      <div class="tipo-receita">${tipoReceita}</div>
      
      <div class="patient-info">
        <div class="patient-name">Paciente: ${patientName}</div>
        <div class="date">${dataPrescricao}</div>
      </div>
      
      <div class="medicamentos">
        ${medicamentosHtml}
      </div>
      
      ${prescricao.observacoes ? `
        <div class="observacoes">
          <div class="observacoes-title">Observações:</div>
          <div>${prescricao.observacoes}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        <div class="assinatura">
          <div class="profissional">${prescricao.profissional_nome}</div>
          <div>Profissional Responsável</div>
        </div>
        
        <div class="validade">
          Validade: ${prescricao.validade_dias} dias a partir da data de emissão
        </div>
      </div>

      <div style="margin-top: 40px; padding: 10px; border-top: 1px solid #ccc; text-align: center;">
        <p style="font-size: 8pt; color: #666; font-style: italic; margin: 0;">
          As informações exibidas são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional de saúde.
        </p>
      </div>
    </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}
