/**
 * Composants d'authentification et de protection des routes
 */

export { AuthGuard, withAuth, usePermissions, RoleBasedContent } from './AuthGuard';
export { default as CandidateAuthWrapper } from './CandidateAuthWrapper';
export {
  CandidateGuard,
  CompanyGuard,
  AdminGuard,
  withCandidateAuth,
  withCompanyAuth,
  withAdminAuth,
} from './RoleGuards';
export { default as ProtectedRoute } from './ProtectedRoute';
