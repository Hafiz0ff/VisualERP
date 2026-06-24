import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateSupplierInput, SupplierQuery, UpdateSupplierInput } from './suppliers.schemas';

export class SuppliersService {
  public static async create(organizationId: string, data: CreateSupplierInput) {
    if (data.code) {
      const existing = await prisma.supplier.findFirst({
        where: { organizationId, code: data.code },
      });
      if (existing) {
        throw new ConflictError(`Supplier with code ${data.code} already exists in this organization`);
      }
    }

    return prisma.supplier.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId },
    });
    if (!supplier) {
      throw new NotFoundError(`Supplier not found with ID ${id}`, [{ entity: 'Supplier', id }]);
    }
    return supplier;
  }

  public static async update(organizationId: string, id: string, data: UpdateSupplierInput) {
    await this.findById(organizationId, id);

    if (data.code) {
      const existing = await prisma.supplier.findFirst({
        where: {
          organizationId,
          code: data.code,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictError(`Supplier with code ${data.code} already exists in this organization`);
      }
    }

    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: SupplierQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;

    const where: Prisma.SupplierWhereInput = {
      organizationId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
    ]);

    return { total, data };
  }
}
export default SuppliersService;
