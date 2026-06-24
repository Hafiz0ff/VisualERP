import { ErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>[];

  constructor(code: ErrorCode, statusCode: number, message: string, details: Record<string, unknown>[] = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, unknown>[] = []) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details: Record<string, unknown>[] = []) {
    super('FORBIDDEN', 403, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details: Record<string, unknown>[] = []) {
    super('NOT_FOUND', 404, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details: Record<string, unknown>[] = []) {
    super('CONFLICT', 409, message, details);
  }
}

export class OrganizationScopeViolationError extends AppError {
  constructor(message: string = 'Organization scope violation') {
    super('ORGANIZATION_SCOPE_VIOLATION', 403, message);
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(message: string = 'Idempotency conflict. Key already used with different parameters.') {
    super('IDEMPOTENCY_CONFLICT', 409, message);
  }
}

export class ModuleDisabledError extends AppError {
  constructor(moduleKey: string) {
    super('MODULE_DISABLED', 403, `Module ${moduleKey} is disabled`, [{ module: moduleKey }]);
  }
}
