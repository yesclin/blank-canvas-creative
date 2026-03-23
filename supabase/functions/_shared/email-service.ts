/**
 * YESCLIN Email Service
 * 
 * Centralized email sending service using Resend.
 * Handles all email operations with proper error handling and logging.
 */

import { Resend } from "https://esm.sh/resend@2.0.0";

// Email configuration
const EMAIL_CONFIG = {
  // Default sender - will use Resend's default domain initially
  defaultFrom: "YESCLIN <noreply@resend.dev>",
  
  // For production, use your verified domain
  // productionFrom: "YESCLIN <noreply@yesclin.com>",
};

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email Service class for sending emails via Resend
 */
export class EmailService {
  private resend: Resend;
  private fromAddress: string;

  constructor() {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    
    this.resend = new Resend(apiKey);
    this.fromAddress = EMAIL_CONFIG.defaultFrom;
  }

  /**
   * Send an email using Resend
   */
  async send(params: SendEmailParams): Promise<EmailResult> {
    const { to, subject, html, from, replyTo } = params;

    try {
      // Normalize recipients to array
      const recipients = Array.isArray(to) ? to : [to];

      console.log(`[EmailService] Sending email to ${recipients.length} recipient(s)`);
      console.log(`[EmailService] Subject: ${subject}`);

      const response = await this.resend.emails.send({
        from: from || this.fromAddress,
        to: recipients,
        subject,
        html,
        reply_to: replyTo,
      });

      // Check for errors in response
      if (response.error) {
        console.error(`[EmailService] Resend API error:`, response.error);
        return {
          success: false,
          error: response.error.message || "Unknown email sending error",
        };
      }

      // Success response
      const messageId = response.data?.id || 'unknown';
      console.log(`[EmailService] Email sent successfully. ID: ${messageId}`);
      
      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      // Log error without sensitive data
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[EmailService] Failed to send email:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send email with retry logic
   */
  async sendWithRetry(
    params: SendEmailParams,
    maxRetries: number = 2
  ): Promise<EmailResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      console.log(`[EmailService] Attempt ${attempt}/${maxRetries + 1}`);
      
      const result = await this.send(params);
      
      if (result.success) {
        return result;
      }

      lastError = result.error;
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries + 1) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[EmailService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError || "Failed after all retries",
    };
  }
}

/**
 * Create and return a singleton email service instance
 */
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

/**
 * Utility function to validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email address (lowercase and trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
