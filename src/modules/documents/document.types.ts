export type CommonDocumentStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COUNTED'
  | 'POSTED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'APPROVED'
  | 'CANCELLED';

export interface DocumentLike {
  status: CommonDocumentStatus | string;
  [key: string]: unknown;
}
