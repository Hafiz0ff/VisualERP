const ORG_STORAGE_KEY = 'visual_erp_active_org_id';
const DEFAULT_ORG_ID = import.meta.env.VITE_ORGANIZATION_ID || '93322c71-d524-41d6-ac41-99b7acbcfd5c';

export function getActiveOrganizationId(): string {
  const saved = localStorage.getItem(ORG_STORAGE_KEY);
  if (saved && saved.trim().length === 36) {
    return saved.trim();
  }
  return DEFAULT_ORG_ID;
}

export function setActiveOrganizationId(orgId: string): void {
  localStorage.setItem(ORG_STORAGE_KEY, orgId);
  // Dispatch a custom event to notify the client application to reload context
  window.dispatchEvent(new Event('organization-changed'));
}
