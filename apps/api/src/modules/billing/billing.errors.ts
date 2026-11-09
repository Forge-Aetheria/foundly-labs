import { GraphQLError } from 'graphql';

export function billingStateError(message = 'Billing is not configured'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'STATE_ERROR' } });
}

export function paymentProviderError(message = 'Payment provider error'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'PAYMENT_PROVIDER_ERROR' } });
}

export function paymentNotPending(message = 'Payment is not pending'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'PAYMENT_NOT_PENDING' } });
}

export function paymentDuplicateReference(
  message = 'Payment reference already registered',
): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'PAYMENT_DUPLICATE_REFERENCE' } });
}

export function paymentAmountMismatch(
  message = 'Payment amount does not match the expected amount',
): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'PAYMENT_AMOUNT_MISMATCH' } });
}
