import { listPaymentMethods } from './actions';
import { PaymentsConfig } from './components/PaymentsConfig';

/** Configuration view (server): resolves the tenant's payment methods. */
export async function ConfigurationView() {
  const result = await listPaymentMethods();
  const methods = result.ok ? result.data : [];
  const error = result.ok ? null : result.error.message;
  return <PaymentsConfig methods={methods} error={error} />;
}
