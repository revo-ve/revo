import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {PrismaModule} from './database/prisma.module';
import {AuthModule} from './modules/auth/auth.module';
import {TenantModule} from './modules/tenant/tenant.module';
import {MenuModule} from './modules/menu/menu.module';
import {TableModule} from './modules/table/table.module';
import {OrderModule} from './modules/order/order.module';
import {DashboardModule} from './modules/dashboard/dashboard.module';
import {PosModule} from './modules/pos/pos.module';
import {KdsModule} from './modules/kds/kds.module';
import {ReportsModule} from './modules/reports/reports.module';
import {UsersModule} from './modules/users/users.module';
import {MenuPublicModule} from './modules/menu-public/menu-public.module';
import {InventoryModule} from './modules/inventory/inventory.module';
import {RolesModule} from './modules/roles/roles.module';
import {MailModule} from './modules/mail/mail.module';
import {SuperAdminModule} from './modules/superadmin/superadmin.module';
import {HealthModule} from './modules/health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),
        PrismaModule,
        AuthModule,
        TenantModule,
        MenuModule,
        TableModule,
        OrderModule,
        DashboardModule,
        PosModule,
        KdsModule,
        ReportsModule,
        UsersModule,
        MenuPublicModule,
        InventoryModule,
        RolesModule,
        MailModule,
        SuperAdminModule,
        HealthModule,
    ],
})
export class AppModule {
}
