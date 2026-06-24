import { ValidationError, OrganizationScopeViolationError, ConflictError } from '../errors/app-error';

// Regex for validating standard UUIDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that a value is positive (> 0).
 */
export function assertPositive(value: number | string | unknown, field: string): void {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`${field} must be a positive number`, [{ field, value }]);
  }
}

/**
 * Validates that a value is non-zero.
 */
export function assertNonZero(value: number | string | unknown, field: string): void {
  const num = Number(value);
  if (isNaN(num) || num === 0) {
    throw new ValidationError(`${field} must be a non-zero number`, [{ field, value }]);
  }
}

/**
 * Validates that a string is a valid UUID.
 */
export function assertUuid(value: string, field: string): void {
  if (!value || !UUID_REGEX.test(value)) {
    throw new ValidationError(`${field} must be a valid UUID`, [{ field, value }]);
  }
}

/**
 * Asserts that two organization IDs are the same.
 */
export function assertSameOrganization(orgId1: string, orgId2: string, errorMsg?: string): void {
  if (orgId1 !== orgId2) {
    throw new OrganizationScopeViolationError(errorMsg || `Organization context mismatch: expected ${orgId1} but got ${orgId2}`);
  }
}

/**
 * Asserts that source and target locations differ.
 */
export function assertDifferentLocations(locId1: string, locId2: string): void {
  if (locId1 === locId2) {
    throw new ValidationError('Source and target locations must be different', [
      { sourceLocationId: locId1, targetLocationId: locId2 },
    ]);
  }
}

/**
 * Asserts that a master record (Item) is active.
 */
export function assertActiveItem(item: { isActive: boolean; name: string }): void {
  if (!item.isActive) {
    throw new ValidationError(`Item "${item.name}" is inactive and cannot be used in transactions`);
  }
}

/**
 * Asserts that a location is active.
 */
export function assertActiveLocation(location: { isActive: boolean; name: string }): void {
  if (!location.isActive) {
    throw new ValidationError(`Location "${location.name}" is inactive and cannot be used in transactions`);
  }
}

/**
 * Asserts that document lines are provided.
 */
export function assertRequiredLines(lines: readonly unknown[], field = 'lines'): void {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError(`At least one transaction line is required in ${field}`, [{ field }]);
  }
}

/**
 * Asserts that a status transition is permitted.
 */
export function assertValidStatusTransition(
  oldStatus: string,
  newStatus: string,
  allowedTransitions: Record<string, string[]>
): void {
  if (oldStatus === newStatus) {
    return;
  }
  const allowed = allowedTransitions[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new ConflictError(`Illegal status transition from "${oldStatus}" to "${newStatus}"`, [
      { from: oldStatus, to: newStatus, allowed },
    ]);
  }
}
