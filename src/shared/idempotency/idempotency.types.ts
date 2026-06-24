export interface IdempotencyRecord {
  id: string;
  organizationId: string;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  responseStatus: number | null;
  responseBody: unknown | null;
  status: 'PENDING' | 'RESOLVED';
  createdAt: Date;
  expiresAt: Date;
}
