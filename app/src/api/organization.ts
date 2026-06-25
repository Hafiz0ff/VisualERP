const ORG_STORAGE_KEY = 'visual_erp_active_org_id';
const DEFAULT_ORG_ID = import.meta.env.VITE_ORGANIZATION_ID || '';

export function getActiveOrganizationId(): string {
  const saved = localStorage.getItem(ORG_STORAGE_KEY);
  if (saved && saved.trim().length === 36) {
    return saved.trim();
  }
  return DEFAULT_ORG_ID.trim();
}

export function setActiveOrganizationId(orgId: string): void {
  localStorage.setItem(ORG_STORAGE_KEY, orgId);
  // Dispatch a custom event to notify the client application to reload context
  window.dispatchEvent(new Event('organization-changed'));
}
