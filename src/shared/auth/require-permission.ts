import { onRequestHookHandler } from 'fastify';

/**
 * Hook to require a specific permission for a route.
 * In Phase 4 Backend MVP, this is a permissive placeholder that logs permission checks
 * but allows execution to proceed. In future phases, it will match against user permissions.
 */
export function requirePermission(permissionCode: string): onRequestHookHandler {
  return async (request) => {
    request.log.info({ permissionCode }, `Checking permission guard placeholder for route.`);
    
    // Stub for future authorization validation:
    // const userPermissions = getUserPermissions(request.userId);
    // if (!userPermissions.includes(permissionCode)) {
    //   throw new ForbiddenError(`Missing required permission: ${permissionCode}`, [{ permission: permissionCode }]);
    // }
  };
}
