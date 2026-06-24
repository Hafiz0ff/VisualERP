export const Permissions = {
  OrganizationsRead: 'organizations:read',
  OrganizationsWrite: 'organizations:write',
  IndustryProfilesRead: 'industry-profiles:read',
  IndustryProfilesWrite: 'industry-profiles:write',
  UnitsRead: 'units:read',
  UnitsWrite: 'units:write',
  ItemCategoriesRead: 'item-categories:read',
  ItemCategoriesWrite: 'item-categories:write',
  ItemsRead: 'items:read',
  ItemsWrite: 'items:write',
  LocationsRead: 'locations:read',
  LocationsWrite: 'locations:write',
  SuppliersRead: 'suppliers:read',
  SuppliersWrite: 'suppliers:write',
  CustomersRead: 'customers:read',
  CustomersWrite: 'customers:write',
} as const;

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];
