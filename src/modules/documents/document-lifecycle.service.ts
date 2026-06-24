import { ConflictError } from '../../shared/errors/app-error';
import { DocumentLike } from './document.types';

/**
 * Reusable lifecycle validation rules for document-like entities.
 * Ensures state transition consistency across all business documents.
 */
export class DocumentLifecycleService {
  /**
   * Checks if status is a draft/planned state.
   */
  public static isDraft(status: string): boolean {
    return ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COUNTED'].includes(status.toUpperCase());
  }

  /**
   * Checks if status is posted/completed/shipped state.
   */
  public static isPosted(status: string): boolean {
    return ['POSTED', 'SHIPPED', 'COMPLETED', 'APPROVED'].includes(status.toUpperCase());
  }

  /**
   * Checks if status is cancelled.
   */
  public static isCancelled(status: string): boolean {
    return status.toUpperCase() === 'CANCELLED';
  }

  /**
   * Asserts that a document is in an editable draft state.
   */
  public static assertCanUpdateDraft(doc: DocumentLike): void {
    if (!this.isDraft(doc.status)) {
      throw new ConflictError(`Cannot update document: current state is "${doc.status}" (must be in a draft state)`);
    }
  }

  /**
   * Asserts that a document can transition to a posted/effective state.
   */
  public static assertCanPost(doc: DocumentLike): void {
    if (this.isCancelled(doc.status)) {
      throw new ConflictError('Cannot post a cancelled document');
    }
    if (this.isPosted(doc.status)) {
      throw new ConflictError('Document is already posted');
    }
  }

  /**
   * Asserts that a document can transition to a cancelled state.
   */
  public static assertCanCancel(doc: DocumentLike): void {
    if (this.isCancelled(doc.status)) {
      throw new ConflictError('Document is already cancelled');
    }
  }

  /**
   * Asserts that a document is not cancelled.
   */
  public static assertNotCancelled(doc: DocumentLike): void {
    if (this.isCancelled(doc.status)) {
      throw new ConflictError('Document is cancelled and cannot be processed');
    }
  }

  /**
   * Asserts that a posted document is immutable for standard mutations.
   */
  public static assertPostedDocumentImmutable(doc: DocumentLike): void {
    if (this.isPosted(doc.status)) {
      throw new ConflictError('Posted documents are immutable and cannot be updated or deleted');
    }
  }
}
export default DocumentLifecycleService;
