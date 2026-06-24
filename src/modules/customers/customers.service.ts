import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateCustomerInput, CustomerQuery, UpdateCustomerInput } from './customers.schemas';

export class CustomersService {
  public static async create(organizationId: string, data: CreateCustomerInput) {
    if (data.code) {
      const existing = await prisma.customer.findFirst({
        where: { organizationId, code: data.code },
      });
      if (existing) {
        throw new ConflictError(`Customer with code ${data.code} already exists in this organization`);
      }
    }

    return prisma.customer.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
    });
    if (!customer) {
      throw new NotFoundError(`Customer not found with ID ${id}`, [{ entity: 'Customer', id }]);
    }
    return customer;
  }

  public static async update(organizationId: string, id: string, data: UpdateCustomerInput) {
    await this.findById(organizationId, id);

    if (data.code) {
      const existing = await prisma.customer.findFirst({
        where: {
          organizationId,
          code: data.code,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictError(`Customer with code ${data.code} already exists in this organization`);
      }
    }

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: CustomerQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;

    const where: Prisma.CustomerWhereInput = {
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
      prisma.customer.count({ where }),
      prisma.customer.findMany({
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
export default CustomersService;
