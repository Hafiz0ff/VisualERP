import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateItemInput, ItemQuery, UpdateItemInput } from './items.schemas';

export class ItemsService {
  public static async create(organizationId: string, data: CreateItemInput) {
    return prisma.item.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const item = await prisma.item.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        unit: true,
      },
    });
    if (!item) {
      throw new NotFoundError(`Item not found with ID ${id}`, [{ entity: 'Item', id }]);
    }
    return item;
  }

  public static async update(organizationId: string, id: string, data: UpdateItemInput) {
    await this.findById(organizationId, id);

    return prisma.item.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: ItemQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder, itemType, isActive } = query;

    const where: Prisma.ItemWhereInput = {
      organizationId,
    };

    if (itemType) {
      where.itemType = itemType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          category: true,
          unit: true,
        },
      }),
    ]);

    return { total, data };
  }
}
export default ItemsService;
