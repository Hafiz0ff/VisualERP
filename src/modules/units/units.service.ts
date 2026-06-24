import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateUnitInput, UnitQuery, UpdateUnitInput } from './units.schemas';

export class UnitsService {
  public static async create(organizationId: string, data: CreateUnitInput) {
    return prisma.unit.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const unit = await prisma.unit.findFirst({
      where: {
        id,
        OR: [
          { organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!unit) {
      throw new NotFoundError(`Unit not found with ID ${id}`, [{ entity: 'Unit', id }]);
    }
    return unit;
  }

  public static async update(organizationId: string, id: string, data: UpdateUnitInput) {
    const existing = await this.findById(organizationId, id);
    if (existing.organizationId === null) {
      throw new ForbiddenError('Global system units are read-only.');
    }

    return prisma.unit.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: UnitQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder } = query;

    const where: Prisma.UnitWhereInput = {
      OR: [
        { organizationId },
        { organizationId: null },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { symbol: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.unit.count({ where }),
      prisma.unit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { total, data };
  }
}
export default UnitsService;
