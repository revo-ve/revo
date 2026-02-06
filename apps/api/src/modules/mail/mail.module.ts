// ============================================
// REVO — Mail Module
// ============================================
// Location: apps/api/src/modules/mail/mail.module.ts
// ============================================

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}