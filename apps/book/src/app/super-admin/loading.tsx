import { Container } from '@foundly/ui';
import { DashboardSkeleton } from '../../modules/super-admin/components/SuperAdminStates';

/** Route-level loading UI for `/super-admin`. */
export default function SuperAdminLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <DashboardSkeleton />
    </Container>
  );
}
