import { Effect } from "effect";
import {
  getSessionChargingIntervals,
  getSessionIdleIntervals,
  interpolateSessionIntervalsPerSecond,
  getValidSessionIntervals,
  createTooMuchEnergyConsumedValidator,
} from "./session-interval";
import {
  energyCostCalculator,
  idleCostCalculator,
  createGracePeriodCostCalculator,
} from "./cost-calculator";
import { PricingService } from "./pricing-service";
import { BillingService, type BillingRecord } from "./billing-service";
import type { Session, EnergyReading, ConnectorStatusEvent } from "./types";

export interface CostCalculationInput {
  readonly session: Session;
  readonly energyReadings: EnergyReading[];
  readonly connectorStatusEvents: ConnectorStatusEvent[];
  readonly maxEnergyPerInterval: number;
  readonly gracePeriodSeconds: number;
}

export const calculateSessionCost = (input: CostCalculationInput) =>
  Effect.gen(function* () {
    const {
      session,
      energyReadings,
      connectorStatusEvents,
      maxEnergyPerInterval,
      gracePeriodSeconds,
    } = input;

    // 1. Extract charging and idle intervals from raw readings
    const chargingIntervals = yield* getSessionChargingIntervals(
      energyReadings,
      connectorStatusEvents
    );
    const idleIntervals = yield* getSessionIdleIntervals(
      energyReadings,
      connectorStatusEvents
    );

    // 2. Validate intervals (remove anomalous ones)
    const validator = createTooMuchEnergyConsumedValidator(maxEnergyPerInterval);
    const { validSessionIntervals: validCharging } =
      yield* getValidSessionIntervals(chargingIntervals, validator);

    // 3. Combine, sort by time, and interpolate to per-second precision
    const allIntervals = [...validCharging, ...idleIntervals].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    const interpolated = yield* interpolateSessionIntervalsPerSecond(
      allIntervals
    );

    // 4. Fetch the rate via PricingService
    const pricingService = yield* PricingService;
    const rate = yield* pricingService.getRate(session.rateId);

    // 5. Calculate costs using the existing calculators
    const energyCost = yield* energyCostCalculator(session, rate, interpolated);
    const idleCost = yield* idleCostCalculator(session, rate, interpolated);

    const gracePeriodCalculator =
      createGracePeriodCostCalculator(gracePeriodSeconds);
    const gracePeriodCost = yield* gracePeriodCalculator(
      session,
      rate,
      interpolated
    );

    // Grace period adjustment: subtract from idle cost (it represents free idle time)
    const adjustedIdleCost = Math.max(0, idleCost - gracePeriodCost);
    const totalCost = energyCost + adjustedIdleCost;

    // Apply min/max cost bounds from the rate
    let clampedCost = totalCost;
    if (rate.minCost !== null) {
      clampedCost = Math.max(rate.minCost, clampedCost);
    }
    if (rate.maxCost !== null) {
      clampedCost = Math.min(rate.maxCost, clampedCost);
    }

    // 6. Submit billing via BillingService
    const billingService = yield* BillingService;
    const record: BillingRecord = {
      sessionId: session.id,
      totalCost: clampedCost,
      energyCost,
      idleCost: adjustedIdleCost,
      gracePeriodAdjustment: gracePeriodCost,
      calculatedAt: new Date(),
    };

    return yield* billingService.submitBilling(record);
  });
