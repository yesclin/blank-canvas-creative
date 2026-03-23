import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's clinic_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.clinic_id) {
      return new Response(JSON.stringify({ error: 'No clinic found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clinicId = profile.clinic_id;

    const { patientId, appointmentId } = await req.json();

    if (!patientId) {
      return new Response(JSON.stringify({ error: 'patientId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify patient belongs to clinic
    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, birth_date, gender, phone, cpf')
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (!patient) {
      return new Response(JSON.stringify({ error: 'Patient not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch clinic info
    const { data: clinic } = await supabase
      .from('clinics')
      .select('name, phone, email, cnpj, address_street, address_number, address_city, address_state')
      .eq('id', clinicId)
      .maybeSingle();

    // Fetch clinical data
    const [evolutions, alerts] = await Promise.all([
      supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true),
    ]);

    // Build PDF HTML content
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const age = patient.birth_date
      ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const clinicAddress = clinic
      ? [clinic.address_street, clinic.address_number, clinic.address_city, clinic.address_state].filter(Boolean).join(', ')
      : '';

    let evolutionsHtml = '';
    if (evolutions.data && evolutions.data.length > 0) {
      for (const evo of evolutions.data) {
        const content = evo.content as Record<string, unknown> | null;
        const evoDate = new Date(evo.created_at);
        const evoDateStr = `${evoDate.getDate().toString().padStart(2, '0')}/${(evoDate.getMonth() + 1).toString().padStart(2, '0')}/${evoDate.getFullYear()}`;
        
        evolutionsHtml += `<div style="border-left:3px solid #99f6e4;padding-left:10px;margin-bottom:10px;">`;
        evolutionsHtml += `<div style="font-size:9pt;color:#777;">${evoDateStr} - ${evo.evolution_type || 'Consulta'}</div>`;
        if (content) {
          if (content.subjective) evolutionsHtml += `<div><strong>S:</strong> ${content.subjective}</div>`;
          if (content.objective) evolutionsHtml += `<div><strong>O:</strong> ${content.objective}</div>`;
          if (content.assessment) evolutionsHtml += `<div><strong>A:</strong> ${content.assessment}</div>`;
          if (content.plan) evolutionsHtml += `<div><strong>P:</strong> ${content.plan}</div>`;
        }
        if (evo.notes) evolutionsHtml += `<div><strong>Notas:</strong> ${evo.notes}</div>`;
        evolutionsHtml += `</div>`;
      }
    }

    let alertsHtml = '';
    if (alerts.data && alerts.data.length > 0) {
      alertsHtml = '<div style="margin-bottom:14px;"><h2 style="font-size:12pt;color:#dc2626;border-bottom:1px solid #fecaca;padding-bottom:4px;margin-bottom:8px;">Alertas Clínicos</h2>';
      for (const alert of alerts.data) {
        alertsHtml += `<div style="margin-bottom:4px;">⚠️ <strong>${alert.title}</strong>${alert.description ? ` — ${alert.description}` : ''}</div>`;
      }
      alertsHtml += '</div>';
    }

    // Generate a simple PDF using HTML-to-text approach
    // Since we can't use complex PDF libs in edge functions, we generate a structured HTML
    // that the client will convert to PDF via the browser's print-to-PDF
    // Actually, let's use a simpler approach: generate the PDF content as base64

    // Use a minimal PDF generator approach
    const pdfContent = generateMinimalPDF({
      clinicName: clinic?.name || '',
      clinicCnpj: clinic?.cnpj || '',
      clinicPhone: clinic?.phone || '',
      clinicEmail: clinic?.email || '',
      clinicAddress,
      patientName: patient.full_name,
      patientAge: age,
      patientGender: patient.gender,
      patientCpf: patient.cpf,
      patientPhone: patient.phone,
      date: dateStr,
      evolutions: evolutions.data || [],
      alerts: alerts.data || [],
    });

    return new Response(JSON.stringify({ pdf: pdfContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Minimal PDF generator - creates a valid PDF 1.4 document
function generateMinimalPDF(data: {
  clinicName: string;
  clinicCnpj: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  patientCpf: string | null;
  patientPhone: string | null;
  date: string;
  evolutions: Array<Record<string, unknown>>;
  alerts: Array<Record<string, unknown>>;
}): string {
  // Build text content lines
  const lines: string[] = [];
  
  lines.push(data.clinicName.toUpperCase());
  if (data.clinicCnpj) lines.push(`CNPJ: ${data.clinicCnpj}`);
  if (data.clinicPhone) lines.push(`Tel: ${data.clinicPhone}`);
  if (data.clinicAddress) lines.push(data.clinicAddress);
  lines.push('');
  lines.push('========================================');
  lines.push('         PRONTUARIO CLINICO');
  lines.push('========================================');
  lines.push('');
  lines.push(`Data: ${data.date}`);
  lines.push('');
  lines.push(`Paciente: ${data.patientName}`);
  if (data.patientAge) lines.push(`Idade: ${data.patientAge} anos`);
  if (data.patientGender) lines.push(`Sexo: ${data.patientGender === 'M' || data.patientGender === 'male' ? 'Masculino' : data.patientGender === 'F' || data.patientGender === 'female' ? 'Feminino' : data.patientGender}`);
  if (data.patientCpf) lines.push(`CPF: ${data.patientCpf}`);
  if (data.patientPhone) lines.push(`Telefone: ${data.patientPhone}`);
  lines.push('');

  // Alerts
  if (data.alerts.length > 0) {
    lines.push('--- ALERTAS CLINICOS ---');
    for (const alert of data.alerts) {
      lines.push(`! ${(alert as Record<string, string>).title}${(alert as Record<string, string>).description ? ` - ${(alert as Record<string, string>).description}` : ''}`);
    }
    lines.push('');
  }

  // Evolutions
  if (data.evolutions.length > 0) {
    lines.push('--- EVOLUCOES CLINICAS ---');
    for (const evo of data.evolutions) {
      const createdAt = new Date(evo.created_at as string);
      const evoDate = `${createdAt.getDate().toString().padStart(2, '0')}/${(createdAt.getMonth() + 1).toString().padStart(2, '0')}/${createdAt.getFullYear()}`;
      lines.push('');
      lines.push(`[${evoDate}] ${(evo.evolution_type as string) || 'Consulta'}`);
      const content = evo.content as Record<string, string> | null;
      if (content) {
        if (content.subjective) lines.push(`S: ${content.subjective}`);
        if (content.objective) lines.push(`O: ${content.objective}`);
        if (content.assessment) lines.push(`A: ${content.assessment}`);
        if (content.plan) lines.push(`P: ${content.plan}`);
      }
      if (evo.notes) lines.push(`Notas: ${evo.notes}`);
    }
    lines.push('');
  }

  lines.push('========================================');
  lines.push(`Documento gerado em ${data.date}`);
  lines.push(data.clinicName);

  // Generate minimal valid PDF
  const textContent = lines.join('\n');
  const encoder = new TextEncoder();
  
  // Build PDF manually (PDF 1.4 spec)
  const pdfLines: string[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const addLine = (line: string) => {
    pdfLines.push(line);
    currentOffset += encoder.encode(line + '\n').length;
  };

  const recordOffset = () => {
    offsets.push(currentOffset);
  };

  addLine('%PDF-1.4');

  // Object 1: Catalog
  recordOffset();
  addLine('1 0 obj');
  addLine('<< /Type /Catalog /Pages 2 0 R >>');
  addLine('endobj');

  // Object 2: Pages
  recordOffset();
  addLine('2 0 obj');
  addLine('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addLine('endobj');

  // Object 3: Page
  recordOffset();
  addLine('3 0 obj');
  addLine('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  addLine('endobj');

  // Build stream content - text rendering
  const streamLines: string[] = [];
  streamLines.push('BT');
  streamLines.push('/F1 10 Tf');
  
  let yPos = 800;
  const lineHeight = 14;
  
  for (const line of textContent.split('\n')) {
    if (yPos < 40) break; // Stop at bottom margin
    // Escape special PDF chars
    const safeLine = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      // Replace accented characters with ASCII equivalents for PDF compatibility
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ÁÀÂÃ]/g, 'A')
      .replace(/[ÉÈÊ]/g, 'E')
      .replace(/[ÍÌÎ]/g, 'I')
      .replace(/[ÓÒÔÕ]/g, 'O')
      .replace(/[ÚÙÛ]/g, 'U')
      .replace(/[Ç]/g, 'C')
      .replace(/[ñ]/g, 'n')
      .replace(/[Ñ]/g, 'N');
    streamLines.push(`1 0 0 1 40 ${yPos} Tm`);
    streamLines.push(`(${safeLine}) Tj`);
    yPos -= lineHeight;
  }
  
  streamLines.push('ET');
  const streamContent = streamLines.join('\n');

  // Object 4: Content Stream
  recordOffset();
  addLine('4 0 obj');
  addLine(`<< /Length ${streamContent.length} >>`);
  addLine('stream');
  addLine(streamContent);
  addLine('endstream');
  addLine('endobj');

  // Object 5: Font
  recordOffset();
  addLine('5 0 obj');
  addLine('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addLine('endobj');

  // Cross-reference table
  const xrefOffset = currentOffset;
  addLine('xref');
  addLine(`0 ${offsets.length + 1}`);
  addLine('0000000000 65535 f ');
  for (const offset of offsets) {
    addLine(`${offset.toString().padStart(10, '0')} 00000 n `);
  }

  addLine('trailer');
  addLine(`<< /Size ${offsets.length + 1} /Root 1 0 R >>`);
  addLine('startxref');
  addLine(xrefOffset.toString());
  addLine('%%EOF');

  const pdfString = pdfLines.join('\n');
  const pdfBytes = encoder.encode(pdfString);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < pdfBytes.length; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  return btoa(binary);
}
