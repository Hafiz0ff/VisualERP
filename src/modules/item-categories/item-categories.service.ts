import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateItemCategoryInput, ItemCategoryQuery, UpdateItemCategoryInput } from './item-categories.schemas';

export class ItemCategoriesService {
  public static async create(organizationId: string, data: CreateItemCategoryInput) {
    return prisma.itemCategory.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  public static async findById(organizationId: string, id: string) {
    const category = await prisma.itemCategory.findFirst({
      where: { id, organizationId },
    });
    if (!category) {
      throw new NotFoundError(`Item category not found with ID ${id}`, [{ entity: 'ItemCategory', id }]);
    }
    return category;
  }

  public static async update(organizationId: string, id: string, data: UpdateItemCategoryInput) {
    await this.findById(organizationId, id);

    return prisma.itemCategory.update({
      where: { id },
      data,
    });
  }

  public static async list(organizationId: string, query: ItemCategoryQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder } = query;

    const where: Prisma.ItemCategoryWhereInput = { organizationId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      prisma.itemCategory.count({ where }),
      prisma.itemCategory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { total, data };
  }
}
export default ItemCategoriesService;
