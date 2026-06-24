import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../shared/errors/app-error';
import { AuditLogService } from '../../shared/audit/audit-log.service';
import { getPagination } from '../../shared/api/pagination';
import { CreateOrganizationInput, OrganizationQuery, UpdateOrganizationInput } from './organizations.schemas';

export class OrganizationsService {
  public static async create(data: CreateOrganizationInput) {
    const org = await prisma.organization.create({
      data,
    });

    await AuditLogService.recordAction({
      organizationId: org.id,
      action: 'ORGANIZATION_CREATE',
      entityType: 'Organization',
      entityId: org.id,
      newValue: org,
    });

    return org;
  }

  public static async findById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
    });
    if (!org) {
      throw new NotFoundError(`Organization not found with ID ${id}`, [{ entity: 'Organization', id }]);
    }
    return org;
  }

  public static async update(id: string, data: UpdateOrganizationInput) {
    const existing = await this.findById(id);

    const updated = await prisma.organization.update({
      where: { id },
      data,
    });

    await AuditLogService.recordAction({
      organizationId: id,
      action: 'ORGANIZATION_UPDATE',
      entityType: 'Organization',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  public static async list(query: OrganizationQuery) {
    const { pageSize, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;

    const where: Prisma.OrganizationWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { total, data };
  }
}
export default OrganizationsService;
