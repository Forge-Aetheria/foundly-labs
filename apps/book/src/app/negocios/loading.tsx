import { Container, Stack } from '@foundly/ui';
import { DirectorySkeleton } from '../../modules/directory/components/DirectoryStates';

/** Route-level loading UI for `/negocios` (skeleton grid while the read resolves). */
export default function NegociosLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <DirectorySkeleton />
      </Stack>
    </Container>
  );
}
