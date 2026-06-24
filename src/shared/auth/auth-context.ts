export interface AuthContext {
  userId: string | null;
  organizationId: string;
  permissions: string[];
}

export function buildAnonymousAuthContext(organizationId: string): AuthContext {
  return {
    userId: null,
    organizationId,
    permissions: [],
  };
}
