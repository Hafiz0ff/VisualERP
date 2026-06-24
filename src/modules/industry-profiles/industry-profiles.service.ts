import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { getPagination } from '../../shared/api/pagination';
import { CreateIndustryProfileInput, IndustryProfileQuery, UpdateIndustryProfileInput } from './industry-profiles.schemas';

export class IndustryProfilesService {
  public static async create(data: CreateIndustryProfileInput) {
    return prisma.industryProfile.create({
      data,
    });
  }

  public static async findByCode(code: string) {
    const profile = await prisma.industryProfile.findUnique({
      where: { code },
    });
    if (!profile) {
      throw new NotFoundError(`Industry profile not found with code ${code}`, [{ entity: 'IndustryProfile', code }]);
    }
    return profile;
  }

  public static async update(code: string, data: UpdateIndustryProfileInput) {
    await this.findByCode(code);

    return prisma.industryProfile.update({
      where: { code },
      data,
    });
  }

  public static async list(query: IndustryProfileQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder } = query;

    const where: Prisma.IndustryProfileWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.industryProfile.count({ where }),
      prisma.industryProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { total, data };
  }
}
export default IndustryProfilesService;
