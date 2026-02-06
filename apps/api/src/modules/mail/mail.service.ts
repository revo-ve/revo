// ============================================
// REVO — Mail Service (Resend)
// ============================================
// Location: apps/api/src/modules/mail/mail.service.ts
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly appUrl: string;
  private readonly isDev: boolean;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    this.fromEmail = this.configService.get('MAIL_FROM') || 'REVO <equipo@holarevo.com>';
    this.appUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    this.isDev = this.configService.get('NODE_ENV') !== 'production';

    if (resendApiKey && resendApiKey !== 'your_resend_api_key_here') {
      this.resend = new Resend(resendApiKey);
      this.logger.log('📧 Mail service initialized with Resend');
    } else {
      this.logger.warn('📧 Mail service running in DEV mode - emails will be logged to console');
    }
  }

  // ─── Send Password Reset Email ───
  async sendPasswordResetEmail(
      email: string,
      name: string,
      token: string,
      tenantName: string,
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    const html = this.getEmailTemplate({
      title: 'Recupera tu contraseña',
      preheader: 'Solicitud para restablecer tu contraseña de REVO',
      greeting: `Hola ${name},`,
      content: `
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${tenantName}</strong>.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      `,
      buttonText: 'Restablecer Contraseña',
      buttonUrl: resetUrl,
      footer: `
        <p>Este enlace expirará en <strong>1 hora</strong>.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.</p>
      `,
    });

    await this.sendMail({
      to: email,
      subject: 'Recupera tu contraseña - REVO',
      html,
    });
  }

  // ─── Send Invitation Email ───
  async sendInvitationEmail(
      email: string,
      name: string,
      token: string,
      tenantName: string,
      roleName: string,
  ): Promise<void> {
    const setupUrl = `${this.appUrl}/setup-password?token=${token}`;

    const html = this.getEmailTemplate({
      title: '¡Bienvenido a REVO!',
      preheader: `Has sido invitado a unirte a ${tenantName}`,
      greeting: `¡Hola ${name}!`,
      content: `
        <p>Has sido invitado a unirte a <strong>${tenantName}</strong> en REVO como <strong>${roleName}</strong>.</p>
        <p>REVO es la plataforma que utilizan para gestionar pedidos, mesas, inventario y mucho más.</p>
        <p>Para comenzar, configura tu contraseña haciendo clic en el siguiente botón:</p>
      `,
      buttonText: 'Configurar mi cuenta',
      buttonUrl: setupUrl,
      footer: `
        <p>Esta invitación expirará en <strong>7 días</strong>.</p>
        <p>Si tienes alguna pregunta, contacta al administrador de ${tenantName}.</p>
      `,
    });

    await this.sendMail({
      to: email,
      subject: `¡Bienvenido a ${tenantName}! - REVO`,
      html,
    });
  }

  // ─── Send Welcome Email (after account setup) ───
  async sendWelcomeEmail(
      email: string,
      name: string,
      tenantName: string,
  ): Promise<void> {
    const loginUrl = `${this.appUrl}/login`;

    const html = this.getEmailTemplate({
      title: '¡Tu cuenta está lista!',
      preheader: 'Ya puedes acceder a REVO',
      greeting: `¡Felicidades ${name}!`,
      content: `
        <p>Tu cuenta en <strong>${tenantName}</strong> ha sido configurada correctamente.</p>
        <p>Ya puedes acceder a REVO y comenzar a trabajar.</p>
      `,
      buttonText: 'Iniciar Sesión',
      buttonUrl: loginUrl,
      footer: `
        <p>¿Necesitas ayuda? Contacta al administrador de tu restaurante.</p>
      `,
    });

    await this.sendMail({
      to: email,
      subject: '¡Tu cuenta está lista! - REVO',
      html,
    });
  }

  // ─── Send Restaurant Created Email (Super Admin) ───
  async sendRestaurantCreatedEmail(
      email: string,
      ownerName: string,
      restaurantName: string,
      token: string,
  ): Promise<void> {
    const setupUrl = `${this.appUrl}/setup-password?token=${token}`;

    const html = this.getEmailTemplate({
      title: '¡Tu restaurante está listo!',
      preheader: `${restaurantName} ha sido creado en REVO`,
      greeting: `¡Hola ${ownerName}!`,
      content: `
        <p>¡Excelentes noticias! Tu restaurante <strong>${restaurantName}</strong> ha sido creado exitosamente en REVO.</p>
        <p>Como dueño, tendrás acceso completo para:</p>
        <ul style="color: #6B8F71; padding-left: 20px;">
          <li>Configurar tu menú digital</li>
          <li>Gestionar mesas y pedidos</li>
          <li>Administrar tu equipo de trabajo</li>
          <li>Ver reportes y estadísticas</li>
        </ul>
        <p>Para comenzar, configura tu contraseña:</p>
      `,
      buttonText: 'Activar mi cuenta',
      buttonUrl: setupUrl,
      footer: `
        <p>Este enlace expirará en <strong>7 días</strong>.</p>
        <p>¿Tienes preguntas? Responde a este correo y te ayudaremos.</p>
      `,
    });

    await this.sendMail({
      to: email,
      subject: `¡${restaurantName} está listo en REVO! 🎉`,
      html,
    });
  }

  // ─── Generic Send Mail ───
  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      if (this.resend) {
        // Production: Send via Resend
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        });

        if (error) {
          this.logger.error(`Failed to send email: ${error.message}`);
          throw new Error(error.message);
        }

        this.logger.log(`📧 Email sent to ${options.to} (ID: ${data?.id})`);
      } else {
        // Development: Log to console
        this.logEmailToConsole(options);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  // ─── Dev Mode: Log Email to Console ───
  private logEmailToConsole(options: {
    to: string;
    subject: string;
    html: string;
  }): void {
    // Extract URL from HTML for easy copy-paste
    const urlMatch = options.html.match(/href="([^"]*token=[^"]*)"/);

    this.logger.log('');
    this.logger.log('╔══════════════════════════════════════════════════════════════╗');
    this.logger.log('║                    📧 EMAIL (dev mode)                       ║');
    this.logger.log('╠══════════════════════════════════════════════════════════════╣');
    this.logger.log(`║ To:      ${options.to}`);
    this.logger.log(`║ Subject: ${options.subject}`);
    if (urlMatch) {
      this.logger.log('╠══════════════════════════════════════════════════════════════╣');
      this.logger.log(`║ 🔗 ACTION URL:`);
      this.logger.log(`║ ${urlMatch[1]}`);
    }
    this.logger.log('╚══════════════════════════════════════════════════════════════╝');
    this.logger.log('');
  }

  // ─── Email Template ───
  private getEmailTemplate(options: {
    title: string;
    preheader: string;
    greeting: string;
    content: string;
    buttonText: string;
    buttonUrl: string;
    footer: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 12px 30px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${options.preheader}
  </div>
  
  <!-- Email Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F3EF;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #C4785A; border-radius: 12px; padding: 12px 16px;">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
                      <span style="color: #3D4F2F;">RE</span><span style="color: #FFFFFF;">VO</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              
              <!-- Greeting -->
              <h1 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; color: #3D4F2F;">
                ${options.greeting}
              </h1>
              
              <!-- Content -->
              <div style="font-size: 15px; line-height: 1.6; color: #6B8F71; margin-bottom: 30px;">
                ${options.content}
              </div>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${options.buttonUrl}" 
                       class="button"
                       style="display: inline-block; background-color: #C4785A; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                      ${options.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Footer Content -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8E4DC; font-size: 13px; color: #8B9B7E;">
                ${options.footer}
              </div>
              
            </td>
          </tr>
          
          <!-- Email Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p style="margin: 0; font-size: 12px; color: #8B9B7E;">
                © ${new Date().getFullYear()} REVO. Todos los derechos reservados.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #8B9B7E;">
                Tu negocio, evolucionado.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}