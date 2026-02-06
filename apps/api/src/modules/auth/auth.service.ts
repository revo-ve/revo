// ============================================
// REVO — Auth Service (with Password Reset)
// ============================================
// Location: apps/api/src/modules/auth/auth.service.ts
// ============================================

import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {MailService} from '../mail/mail.service';
import {PrismaService} from "../../database/prisma.service";
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) {
    }

    // ─── Login ───
    async login(email: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: {email: email.toLowerCase(), isActive: true},
            include: {
                tenant: true,
                role: {
                    include: {
                        permissions: {
                            include: {permission: true},
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role?.name,
        };

        const accessToken = this.jwtService.sign(payload, {expiresIn: '8h'});
        const refreshToken = this.jwtService.sign(payload, {expiresIn: '7d'});

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant: user.tenant,
            },
        };
    }

    // ─── Get current user ───
    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            include: {
                tenant: true,
                role: {
                    include: {
                        permissions: {
                            include: {permission: true},
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenant: user.tenant,
        };
    }

    // ─── Request Password Reset ───
    async requestPasswordReset(email: string) {
        const user = await this.prisma.user.findFirst({
            where: {email: email.toLowerCase(), isActive: true},
            include: {tenant: true},
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return {success: true, message: 'Si el email existe, recibirás instrucciones'};
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token to database
        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                resetToken: resetTokenHash,
                resetTokenExpiry,
            },
        });

        // Send email
        await this.mailService.sendPasswordResetEmail(
            user.email,
            user.name,
            resetToken,
            user.tenant?.name || 'REVO',
        );

        return {success: true, message: 'Si el email existe, recibirás instrucciones'};
    }

    // ─── Verify Reset Token ───
    async verifyResetToken(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: {gt: new Date()},
                isActive: true,
            },
        });

        if (!user) {
            throw new BadRequestException('Token inválido o expirado');
        }

        return {valid: true, email: this.maskEmail(user.email)};
    }

    // ─── Reset Password ───
    async resetPassword(token: string, newPassword: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: {gt: new Date()},
                isActive: true,
            },
        });

        if (!user) {
            throw new BadRequestException('Token inválido o expirado');
        }

        // Validate password
        if (newPassword.length < 8) {
            throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear token
        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return {success: true, message: 'Contraseña actualizada correctamente'};
    }

    // ─── Setup Password (for invited users) ───
    async setupPassword(token: string, newPassword: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                inviteToken: tokenHash,
                inviteTokenExpiry: {gt: new Date()},
            },
        });

        if (!user) {
            throw new BadRequestException('Invitación inválida o expirada');
        }

        // Validate password
        if (newPassword.length < 8) {
            throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password, activate user, and clear invite token
        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                password: hashedPassword,
                isActive: true,
                inviteToken: null,
                inviteTokenExpiry: null,
            },
        });

        return {success: true, message: 'Cuenta activada correctamente'};
    }

    // ─── Verify Invite Token ───
    async verifyInviteToken(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                inviteToken: tokenHash,
                inviteTokenExpiry: {gt: new Date()},
            },
            include: {tenant: true},
        });

        if (!user) {
            throw new BadRequestException('Invitación inválida o expirada');
        }

        return {
            valid: true,
            email: user.email,
            name: user.name,
            tenantName: user.tenant?.name,
        };
    }

    // ─── Create Invited User (called by admin) ───
    async createInvitedUser(
        tenantId: string,
        creatorId: string,
        data: { name: string; email: string; roleId: string },
    ) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {email: data.email.toLowerCase()},
        });

        if (existingUser) {
            throw new BadRequestException('El email ya está registrado');
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
        const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create user with temporary password (won't be used)
        const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email.toLowerCase(),
                password: tempPassword,
                tenantId,
                roleId: data.roleId,
                isActive: false, // Will be activated when they set password
                inviteToken: inviteTokenHash,
                inviteTokenExpiry,
                createdBy: creatorId,
            },
            include: {
                role: true,
                tenant: true,
            },
        });

        // Send invitation email
        await this.mailService.sendInvitationEmail(
            user.email,
            user.name,
            inviteToken,
            user.tenant?.name || 'REVO',
            user.role?.name || 'Usuario',
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            inviteSent: true,
        };
    }

    // ─── Resend Invitation ───
    async resendInvitation(userId: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: {id: userId, tenantId, isActive: false},
            include: {role: true, tenant: true},
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado o ya está activo');
        }

        // Generate new invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
        const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.prisma.user.update({
            where: {id: userId},
            data: {
                inviteToken: inviteTokenHash,
                inviteTokenExpiry,
            },
        });

        // Send email
        await this.mailService.sendInvitationEmail(
            user.email,
            user.name,
            inviteToken,
            user.tenant?.name || 'REVO',
            user.role?.name || 'Usuario',
        );

        return {success: true, message: 'Invitación reenviada'};
    }

    // ─── Helper: Mask email ───
    private maskEmail(email: string): string {
        const [user, domain] = email.split('@');
        const maskedUser = user.charAt(0) + '***' + user.charAt(user.length - 1);
        return `${maskedUser}@${domain}`;
    }
}
