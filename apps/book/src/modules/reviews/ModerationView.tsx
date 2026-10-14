import { listMyReviews } from './actions';
import { ReviewModerationList } from './components/ReviewModerationList';

/** Reviews moderation view (server): real reviews for the tenant, any state. */
export async function ModerationView() {
  const result = await listMyReviews();
  const reviews = result.ok ? result.data : [];
  const error = result.ok ? null : result.error.message;
  return <ReviewModerationList reviews={reviews} error={error} />;
}
