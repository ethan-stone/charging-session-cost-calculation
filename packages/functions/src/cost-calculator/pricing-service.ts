import { Context, Effect, Layer } from "effect";
import type { Rate } from "./types";
import { RateNotFoundError } from "./errors";

export class PricingService extends Context.Tag("PricingService")<
  PricingService,
  {
    readonly getRate: (
      rateId: string
    ) => Effect.Effect<Rate, RateNotFoundError>;
  }
>() {}

export const PricingServiceLive = Layer.succeed(PricingService, {
  getRate: (rateId: string) =>
    // In production, this would query a database or external API
    Effect.fail(new RateNotFoundError({ rateId })),
});

export const makePricingServiceTest = (rates: Map<string, Rate>) =>
  Layer.succeed(PricingService, {
    getRate: (rateId: string) => {
      const rate = rates.get(rateId);
      if (rate === undefined) {
        return Effect.fail(new RateNotFoundError({ rateId }));
      }
      return Effect.succeed(rate);
    },
  });
