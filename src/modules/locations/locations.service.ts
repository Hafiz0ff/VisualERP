import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateLocationInput, LocationQuery, UpdateLocationInput } from './locations.schemas';

export class LocationsService {
  public static async create(organizationId: string, data: CreateLocationInput) {
    return prisma.stockLocation.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const location = await prisma.stockLocation.findFirst({
      where: { id, organizationId },
    });
    if (!location) {
      throw new NotFoundError(`Stock location not found with ID ${id}`, [{ entity: 'StockLocation', id }]);
    }
    return location;
  }

  public static async update(organizationId: string, id: string, data: UpdateLocationInput) {
    await this.findById(organizationId, id);

    return prisma.stockLocation.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: LocationQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder, type, isActive } = query;

    const where: Prisma.StockLocationWhereInput = {
      organizationId,
    };

    if (type) {
      where.type = type;
    }

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
      prisma.stockLocation.count({ where }),
      prisma.stockLocation.findMany({
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
export default LocationsService;
