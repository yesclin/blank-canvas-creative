/**
 * YESCLIN Email Templates
 * 
 * Shared email template system for professional SaaS-style emails.
 * All templates follow YESCLIN brand guidelines.
 */

// Brand colors
const COLORS = {
  primary: '#0f766e',       // Teal primary
  primaryDark: '#0d655c',   // Darker teal for hover
  background: '#f9fafb',    // Light gray background
  cardBg: '#ffffff',        // White card background
  text: '#0f172a',          // Dark text
  textMuted: '#64748b',     // Muted text
  textLight: '#94a3b8',     // Light text
  border: '#e2e8f0',        // Border color
  success: '#16a34a',       // Success green
  warning: '#f59e0b',       // Warning amber
  error: '#dc2626',         // Error red
  infoBg: '#f1f5f9',        // Info background
};

// Common styles
const STYLES = {
  container: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${COLORS.background};`,
  card: `background-color: ${COLORS.cardBg}; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);`,
  header: `text-align: center; margin-bottom: 24px;`,
  logo: `color: ${COLORS.text}; font-size: 24px; margin: 0; font-weight: bold;`,
  tagline: `color: ${COLORS.textMuted}; margin: 8px 0 0; font-size: 14px;`,
  h2: `color: ${COLORS.text}; font-size: 20px; margin-bottom: 16px;`,
  paragraph: `color: ${COLORS.textMuted}; line-height: 1.6; margin: 16px 0;`,
  infoBox: `background-color: ${COLORS.infoBg}; border-radius: 8px; padding: 16px; margin: 24px 0;`,
  infoText: `margin: 0; color: ${COLORS.textMuted};`,
  button: `display: inline-block; background-color: ${COLORS.primary}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;`,
  buttonContainer: `text-align: center; margin: 32px 0;`,
  divider: `border: none; border-top: 1px solid ${COLORS.border}; margin: 24px 0;`,
  footer: `color: ${COLORS.textLight}; font-size: 12px; text-align: center; margin: 0;`,
  footerLink: `color: ${COLORS.primary}; word-break: break-all;`,
  smallText: `color: ${COLORS.textLight}; font-size: 14px; margin-top: 24px;`,
  code: `display: inline-block; padding: 12px 20px; background-color: ${COLORS.infoBg}; border-radius: 6px; font-family: monospace; font-size: 24px; letter-spacing: 4px; font-weight: bold; color: ${COLORS.text};`,
};

export interface EmailTemplateData {
  recipientName: string;
  clinicName?: string;
  clinicLogoUrl?: string;
}

export interface InviteEmailData extends EmailTemplateData {
  inviterName: string;
  role: string;
  roleLabel: string;
  acceptUrl: string;
  expiresInDays: number;
}

export interface PasswordResetEmailData extends EmailTemplateData {
  resetUrl: string;
  expiresInMinutes: number;
}

export interface WelcomeEmailData extends EmailTemplateData {
  loginUrl: string;
  role?: string;
}

/**
 * Generates the email header with YESCLIN branding
 */
function generateHeader(clinicLogoUrl?: string): string {
  const logoSection = clinicLogoUrl 
    ? `<img src="${clinicLogoUrl}" alt="Logo" style="max-width: 80px; max-height: 60px; margin-bottom: 16px; border-radius: 8px;" />`
    : '';
  
  return `
    <div style="${STYLES.header}">
      ${logoSection}
      <h1 style="${STYLES.logo}">YESCLIN</h1>
      <p style="${STYLES.tagline}">Sistema de Gestão para Clínicas</p>
    </div>
  `;
}

/**
 * Generates the email footer
 */
function generateFooter(fallbackUrl?: string): string {
  const fallbackSection = fallbackUrl 
    ? `<p style="${STYLES.footer}; margin-bottom: 16px;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${fallbackUrl}" style="${STYLES.footerLink}">${fallbackUrl}</a>
      </p>`
    : '';
  
  return `
    <hr style="${STYLES.divider}">
    ${fallbackSection}
    <p style="${STYLES.footer}">
      © ${new Date().getFullYear()} YESCLIN. Todos os direitos reservados.
    </p>
  `;
}

/**
 * Generates the email wrapper
 */
function wrapEmail(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>YESCLIN</title>
    </head>
    <body style="${STYLES.container}">
      <div style="${STYLES.card}">
        ${content}
      </div>
    </body>
    </html>
  `;
}

/**
 * Invitation Email Template
 * Used when an admin invites a new user to the clinic
 */
export function generateInviteEmail(data: InviteEmailData): string {
  const content = `
    ${generateHeader(data.clinicLogoUrl)}
    
    <h2 style="${STYLES.h2}">Olá, ${data.recipientName} 👋</h2>
    
    <p style="${STYLES.paragraph}">
      Você foi convidado para acessar o <strong>Yesclin</strong>, o sistema de gestão utilizado pela 
      <strong>${data.clinicName || 'clínica'}</strong>.
    </p>
    
    <div style="${STYLES.infoBox}">
      <p style="${STYLES.infoText}">
        🔐 <strong>Seu acesso foi criado com o perfil:</strong><br>
        <span style="font-size: 16px; color: ${COLORS.primary}; font-weight: 600;">${data.roleLabel}</span>
      </p>
    </div>
    
    <p style="${STYLES.paragraph}">
      Para começar, é só clicar no botão abaixo e definir sua senha:
    </p>
    
    <div style="${STYLES.buttonContainer}">
      <a href="${data.acceptUrl}" style="${STYLES.button}">
        👉 Aceitar convite e criar senha
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ Este convite é pessoal e possui validade de <strong>${data.expiresInDays === 1 ? '24 horas' : data.expiresInDays + ' dias'}</strong>.<br>
        Caso o link expire, solicite um novo convite ao administrador da clínica.
      </p>
    </div>
    
    <div style="${STYLES.infoBox}">
      <p style="${STYLES.infoText}">
        <strong>💡 O que você pode fazer no Yesclin?</strong>
      </p>
      <ul style="margin: 12px 0 0 0; padding-left: 20px; color: ${COLORS.textMuted}; line-height: 1.8;">
        <li>Gerenciar agenda e atendimentos</li>
        <li>Acessar informações conforme suas permissões</li>
        <li>Trabalhar com mais organização e segurança</li>
      </ul>
    </div>
    
    <p style="${STYLES.smallText}">
      Se você não reconhece este convite, pode ignorar este e-mail com segurança.
    </p>
    
    <hr style="${STYLES.divider}">
    
    <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0;">
      Atenciosamente,<br>
      <strong style="color: ${COLORS.text};">Equipe Yesclin</strong><br>
      <span style="font-size: 12px;">Sistema de gestão para clínicas e consultórios</span>
    </p>
    
    <p style="color: ${COLORS.textLight}; font-size: 11px; margin-top: 16px; text-align: center;">
      🔒 Este é um e-mail automático. Não responda.
    </p>
    
    ${generateFooter(data.acceptUrl)}
  `;

  return wrapEmail(content);
}

/**
 * Password Reset Email Template
 * Used when a user requests a password reset
 */
export function generatePasswordResetEmail(data: PasswordResetEmailData): string {
  const content = `
    ${generateHeader(data.clinicLogoUrl)}
    
    <h2 style="${STYLES.h2}">Redefinição de Senha</h2>
    
    <p style="${STYLES.paragraph}">
      Olá${data.recipientName ? `, ${data.recipientName}` : ''}!
    </p>
    
    <p style="${STYLES.paragraph}">
      Recebemos uma solicitação para redefinir a senha da sua conta no YESCLIN.
      Se você fez essa solicitação, clique no botão abaixo:
    </p>
    
    <div style="${STYLES.buttonContainer}">
      <a href="${data.resetUrl}" style="${STYLES.button}">
        Redefinir Minha Senha
      </a>
    </div>
    
    <div style="${STYLES.infoBox}">
      <p style="${STYLES.infoText}">
        ⚠️ Este link expira em <strong>${data.expiresInMinutes} minutos</strong> e só pode ser usado uma vez.
      </p>
    </div>
    
    <p style="${STYLES.smallText}">
      Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.
    </p>
    
    ${generateFooter(data.resetUrl)}
  `;

  return wrapEmail(content);
}

/**
 * Get role-specific tips for welcome email
 */
function getRoleTips(role?: string): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return `
        <li>⚙️ Revise as <strong>configurações da clínica</strong> no menu de configurações</li>
        <li>👥 Gerencie a equipe na seção <strong>Usuários</strong></li>
        <li>📅 Visualize e organize a <strong>agenda</strong> de atendimentos</li>
        <li>📊 Acompanhe os <strong>relatórios</strong> e indicadores</li>
      `;
    case 'recepcionista':
      return `
        <li>📅 Crie e gerencie <strong>agendamentos</strong> de pacientes</li>
        <li>✅ <strong>Confirme consultas</strong> pelo WhatsApp ou telefone</li>
        <li>👤 Cadastre novos <strong>pacientes</strong> no sistema</li>
        <li>💳 Registre <strong>pagamentos</strong> de consultas</li>
      `;
    case 'profissional':
      return `
        <li>📅 Acesse sua <strong>agenda</strong> de atendimentos</li>
        <li>📋 Preencha o <strong>prontuário</strong> dos pacientes</li>
        <li>📝 Registre <strong>evoluções clínicas</strong></li>
        <li>📄 Emita <strong>atestados e receitas</strong></li>
      `;
    default:
      return `
        <li>📅 Acesse a <strong>agenda</strong> para ver os atendimentos</li>
        <li>👤 Explore a seção de <strong>pacientes</strong></li>
        <li>⚙️ Configure suas <strong>preferências</strong> no menu</li>
      `;
  }
}

/**
 * Welcome Email Template
 * Sent after a user successfully creates their account
 */
export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const roleLabel = data.role ? getRoleLabel(data.role) : undefined;
  const roleTips = getRoleTips(data.role);
  
  const content = `
    ${generateHeader(data.clinicLogoUrl)}
    
    <h2 style="${STYLES.h2}">Bem-vindo ao Yesclin! 🚀</h2>
    
    <p style="${STYLES.paragraph}">
      Olá, <strong>${data.recipientName}</strong>!
    </p>
    
    <p style="${STYLES.paragraph}">
      Sua conta foi criada com sucesso${data.clinicName ? ` na clínica <strong>${data.clinicName}</strong>` : ''}.
      ${roleLabel ? `Você está cadastrado como <strong>${roleLabel}</strong>.` : ''}
    </p>
    
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✅ <strong>Tudo pronto!</strong> Seu acesso está ativo e você já pode começar a usar o sistema.
      </p>
    </div>
    
    <div style="${STYLES.buttonContainer}">
      <a href="${data.loginUrl}" style="${STYLES.button}">
        🚀 Acessar o Yesclin
      </a>
    </div>
    
    <div style="${STYLES.infoBox}">
      <p style="${STYLES.infoText}">
        <strong>💡 Primeiros passos${roleLabel ? ` para ${roleLabel}` : ''}:</strong>
      </p>
      <ul style="margin: 12px 0 0 0; padding-left: 20px; color: ${COLORS.textMuted}; line-height: 2;">
        ${roleTips}
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        💬 <strong>Precisa de ajuda?</strong><br>
        <span style="font-size: 13px;">Entre em contato com o administrador da sua clínica ou acesse nosso suporte.</span>
      </p>
    </div>
    
    <hr style="${STYLES.divider}">
    
    <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0;">
      Atenciosamente,<br>
      <strong style="color: ${COLORS.text};">Equipe Yesclin</strong><br>
      <span style="font-size: 12px;">Sistema de gestão para clínicas e consultórios</span>
    </p>
    
    <p style="color: ${COLORS.textLight}; font-size: 11px; margin-top: 16px; text-align: center;">
      🔒 Este é um e-mail automático. Não responda.
    </p>
    
    ${generateFooter(data.loginUrl)}
  `;

  return wrapEmail(content);
}

/**
 * Generic Notification Email Template
 * For general system notifications
 */
export interface NotificationEmailData extends EmailTemplateData {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function generateNotificationEmail(data: NotificationEmailData): string {
  const actionButton = data.actionUrl && data.actionLabel
    ? `<div style="${STYLES.buttonContainer}">
        <a href="${data.actionUrl}" style="${STYLES.button}">
          ${data.actionLabel}
        </a>
      </div>`
    : '';

  const content = `
    ${generateHeader(data.clinicLogoUrl)}
    
    <h2 style="${STYLES.h2}">${data.title}</h2>
    
    <p style="${STYLES.paragraph}">
      Olá${data.recipientName ? `, ${data.recipientName}` : ''}!
    </p>
    
    <p style="${STYLES.paragraph}">
      ${data.message}
    </p>
    
    ${actionButton}
    
    ${generateFooter(data.actionUrl)}
  `;

  return wrapEmail(content);
}

/**
 * Role labels for display
 */
export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  profissional: 'Profissional',
  recepcionista: 'Recepção',
};

/**
 * Get role label with fallback
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}
