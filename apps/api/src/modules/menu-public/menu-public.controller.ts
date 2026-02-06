// ============================================
// REVO — Public Menu Controller
// ============================================
// Location: apps/api/src/modules/menu-public/menu-public.controller.ts
// ============================================

import {
    Controller,
    Get,
    Post,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuPublicService } from './menu-public.service';
import {TenantGuard} from "../../common/guards";

// ─── PUBLIC endpoints (no auth) ───
@Controller('public/menu')
export class MenuPublicController {
    constructor(private readonly menuPublicService: MenuPublicService) {}

    // GET /api/v1/public/menu/slug/:slug → Full menu by restaurant slug
    @Get('slug/:slug')
    getMenuBySlug(@Param('slug') slug: string) {
        return this.menuPublicService.getMenuBySlug(slug);
    }

    // GET /api/v1/public/menu/qr/:qrCode → Full menu by QR code (includes table info)
    @Get('qr/:qrCode')
    getMenuByQr(@Param('qrCode') qrCode: string) {
        return this.menuPublicService.getMenuByQr(qrCode);
    }
}

// ─── PROTECTED endpoints (QR management in dashboard) ───
@Controller('qr-management')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class QrManagementController {
    constructor(private readonly menuPublicService: MenuPublicService) {}

    // GET /api/v1/qr-management/tables → List tables with QR codes
    @Get('tables')
    getTables(@Req() req: any) {
        return this.menuPublicService.getTablesWithQr(req.user.tenantId);
    }

    // POST /api/v1/qr-management/tables/:id/regenerate → Regenerate QR
    @Post('tables/:id/regenerate')
    regenerateQr(@Req() req: any, @Param('id') id: string) {
        return this.menuPublicService.regenerateQr(req.user.tenantId, id);
    }
}