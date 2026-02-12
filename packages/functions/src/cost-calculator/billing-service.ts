import { Context, Effect, Layer } from "effect";
import { BillingError } from "./errors";

export type BillingRecord = {
  readonly sessionId: string;
  readonly totalCost: number;
  readonly energyCost: number;
  readonly idleCost: number;
  readonly gracePeriodAdjustment: number;
  readonly calculatedAt: Date;
};

export class BillingService extends Context.Tag("BillingService")<
  BillingService,
  {
    readonly submitBilling: (
      record: BillingRecord
    ) => Effect.Effect<BillingRecord, BillingError>;
  }
>() {}

export const BillingServiceLive = Layer.succeed(BillingService, {
  submitBilling: (record: BillingRecord) =>
    // In production, this would persist to a database or publish to a queue
    Effect.succeed(record),
});

export const makeBillingServiceTest = (submitted: BillingRecord[] = []) =>
  Layer.succeed(BillingService, {
    submitBilling: (record: BillingRecord) =>
      Effect.sync(() => {
        submitted.push(record);
        return record;
      }),
  });
