import { Data } from "effect";

export class RateNotFoundError extends Data.TaggedError(
  "RateNotFoundError"
)<{
  readonly rateId: string;
}> {}

export class BillingError extends Data.TaggedError("BillingError")<{
  readonly sessionId: string;
  readonly cause: unknown;
}> {}

export class InsufficientDataError extends Data.TaggedError(
  "InsufficientDataError"
)<{
  readonly sessionId: string;
  readonly reason: string;
}> {}
