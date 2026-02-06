import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ZONES
  // ============================================

  async getZones(tenantId: string) {
    return this.prisma.zone.findMany({
      where: { tenantId },
      include: {
        tables: {
          orderBy: { number: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createZone(tenantId: string, data: { name: string; sortOrder?: number }) {
    return this.prisma.zone.create({
      data: {
        tenantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { tables: true },
    });
  }

  async updateZone(tenantId: string, id: string, data: { name?: string; sortOrder?: number }) {
    const zone = await this.prisma.zone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Zona no encontrada');

    return this.prisma.zone.update({
      where: { id },
      data,
      include: { tables: true },
    });
  }

  async deleteZone(tenantId: string, id: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id, tenantId },
      include: { tables: true },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    if (zone.tables.length > 0) {
      throw new ConflictException('No puedes eliminar una zona con mesas. Mueve o elimina las mesas primero.');
    }

    return this.prisma.zone.delete({ where: { id } });
  }

  // ============================================
  // TABLES
  // ============================================

  async getTables(tenantId: string, zoneId?: string) {
    return this.prisma.restaurantTable.findMany({
      where: {
        tenantId,
        ...(zoneId ? { zoneId } : {}),
      },
      include: { zone: true },
      orderBy: { number: 'asc' },
    });
  }

  async getTableById(tenantId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id, tenantId },
      include: {
        zone: true,
        orders: {
          where: { status: { notIn: ['PAID', 'CANCELLED'] } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!table) throw new NotFoundException('Mesa no encontrada');
    return table;
  }

  async createTable(
    tenantId: string,
    data: { zoneId?: string; number: string; capacity?: number },
  ) {
    // Check unique number within tenant
    const existing = await this.prisma.restaurantTable.findFirst({
      where: { tenantId, number: data.number },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una mesa con el número "${data.number}"`);
    }

    return this.prisma.restaurantTable.create({
      data: {
        tenantId,
        zoneId: data.zoneId,
        number: data.number,
        capacity: data.capacity ?? 4,
      },
      include: { zone: true },
    });
  }

  async updateTable(
    tenantId: string,
    id: string,
    data: { zoneId?: string; number?: string; capacity?: number },
  ) {
    const table = await this.prisma.restaurantTable.findFirst({ where: { id, tenantId } });
    if (!table) throw new NotFoundException('Mesa no encontrada');

    if (data.number && data.number !== table.number) {
      const existing = await this.prisma.restaurantTable.findFirst({
        where: { tenantId, number: data.number, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una mesa con el número "${data.number}"`);
      }
    }

    return this.prisma.restaurantTable.update({
      where: { id },
      data,
      include: { zone: true },
    });
  }

  async updateTableStatus(tenantId: string, id: string, status: string) {
    const table = await this.prisma.restaurantTable.findFirst({ where: { id, tenantId } });
    if (!table) throw new NotFoundException('Mesa no encontrada');

    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status: status as any },
      include: { zone: true },
    });
  }

  async deleteTable(tenantId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id, tenantId },
      include: { orders: { where: { status: { notIn: ['PAID', 'CANCELLED'] } } } },
    });
    if (!table) throw new NotFoundException('Mesa no encontrada');
    if (table.orders.length > 0) {
      throw new ConflictException('No puedes eliminar una mesa con pedidos activos');
    }

    return this.prisma.restaurantTable.delete({ where: { id } });
  }
}
