// ============================================
// REVO — Auth Controller (with Password Reset)
// ============================================
// Location: apps/api/src/modules/auth/auth.controller.ts
// ============================================

import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards,} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthService} from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Login ───
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);
    return { success: true, data: result };
  }

  // ─── Get current user ───
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    return req.user;
  }

  // ─── Request Password Reset ───
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return await this.authService.requestPasswordReset(body.email);
  }

  // ─── Verify Reset Token ───
  @Post('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  async verifyResetToken(@Body() body: { token: string }) {
    const result = await this.authService.verifyResetToken(body.token);
    return { success: true, ...result };
  }

  // ─── Reset Password ───
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return await this.authService.resetPassword(body.token, body.password);
  }

  // ─── Verify Invite Token ───
  @Post('verify-invite')
  @HttpCode(HttpStatus.OK)
  async verifyInvite(@Body() body: { token: string }) {
    const result = await this.authService.verifyInviteToken(body.token);
    return { success: true, ...result };
  }

  // ─── Setup Password (for invited users) ───
  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  async setupPassword(@Body() body: { token: string; password: string }) {
    return await this.authService.setupPassword(body.token, body.password);
  }
}
