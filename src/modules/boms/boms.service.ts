import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { getPagination } from '../../shared/api/pagination';
import { NotFoundError } from '../../shared/errors/app-error';
import { BOMQuery } from './boms.schemas';

const bomInclude = {
  outputItem: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  lines: {
    include: {
      inputItem: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          symbol: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.BOMInclude;

export class BOMsService {
  public static async list(organizationId: string, query: BOMQuery) {
    const { pageSize, skip } = getPagination(query);

    const where: Prisma.BOMWhereInput = {
      organizationId,
    };

    if (query.outputItemId) {
      where.outputItemId = query.outputItemId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { version: { contains: query.search, mode: 'insensitive' } },
        { outputItem: { name: { contains: query.search, mode: 'insensitive' } } },
        { outputItem: { code: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.bOM.count({ where }),
      prisma.bOM.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: bomInclude,
      }),
    ]);

    return { total, data };
  }

  public static async findById(organizationId: string, id: string) {
    const bom = await prisma.bOM.findFirst({
      where: { id, organizationId },
      include: bomInclude,
    });

    if (!bom) {
      throw new NotFoundError(`BOM not found with ID ${id}`);
    }

    return bom;
  }
}

export default BOMsService;
