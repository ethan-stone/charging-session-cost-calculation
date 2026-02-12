import { describe, it, expect } from "vitest";
import { Effect, Exit, Layer } from "effect";
import { calculateSessionCost } from "./cost-calculation-workflow";
import { makePricingServiceTest } from "./pricing-service";
import { makeBillingServiceTest, type BillingRecord } from "./billing-service";
import type {
  Rate,
  Session,
  EnergyReading,
  ConnectorStatusEvent,
} from "./types";
import { RateNotFoundError, InsufficientDataError } from "./errors";

const startTime = new Date("2021-01-01T00:00:00.000Z");

const makeSession = (overrides?: Partial<Session>): Session => ({
  id: "session-1",
  cost: null,
  rateId: "rate-1",
  startTime,
  endTime: null,
  timezone: "America/Los_Angeles",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeRate = (overrides?: Partial<Rate>): Rate => ({
  id: "rate-1",
  minCost: null,
  maxCost: null,
  pricingElements: [
    {
      id: "pe-1",
      rateId: "rate-1",
      components: [
        {
          id: "c-1",
          ratePricingElementId: "pe-1",
          type: "energy",
          value: 20,
        },
      ],
      restrictions: {},
    },
  ],
  ...overrides,
});

// Energy readings that increase over time (charging)
const makeEnergyReadings = (): EnergyReading[] => [
  {
    id: "er-1",
    sessionId: "session-1",
    value: 100,
    timestamp: new Date(startTime.getTime() + 1000 * 60),
  },
  {
    id: "er-2",
    sessionId: "session-1",
    value: 200,
    timestamp: new Date(startTime.getTime() + 1000 * 60 * 2),
  },
  {
    id: "er-3",
    sessionId: "session-1",
    value: 300,
    timestamp: new Date(startTime.getTime() + 1000 * 60 * 3),
  },
];

// Connector was charging before the first energy reading
const makeConnectorStatusEvents = (): ConnectorStatusEvent[] => [
  {
    id: "cse-1",
    sessionId: "session-1",
    status: "charging",
    timestamp: new Date(startTime.getTime()),
  },
];

describe("calculateSessionCost", () => {
  it("calculates cost and submits billing for a valid session", async () => {
    const session = makeSession();
    const rate = makeRate();
    const submitted: BillingRecord[] = [];

    const TestLayer = Layer.merge(
      makePricingServiceTest(new Map([["rate-1", rate]])),
      makeBillingServiceTest(submitted)
    );

    const result = await Effect.runPromise(
      calculateSessionCost({
        session,
        energyReadings: makeEnergyReadings(),
        connectorStatusEvents: makeConnectorStatusEvents(),
        maxEnergyPerInterval: 1000,
        gracePeriodSeconds: 300,
      }).pipe(Effect.provide(TestLayer))
    );

    expect(result.sessionId).toBe("session-1");
    expect(result.energyCost).toBeGreaterThan(0);
    expect(result.totalCost).toBe(result.energyCost + result.idleCost);
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toBe(result);
  });

  it("fails with RateNotFoundError when rate does not exist", async () => {
    const session = makeSession({ rateId: "nonexistent" });

    const TestLayer = Layer.merge(
      makePricingServiceTest(new Map()), // empty — no rates
      makeBillingServiceTest()
    );

    const exit = await Effect.runPromiseExit(
      calculateSessionCost({
        session,
        energyReadings: makeEnergyReadings(),
        connectorStatusEvents: makeConnectorStatusEvents(),
        maxEnergyPerInterval: 1000,
        gracePeriodSeconds: 300,
      }).pipe(Effect.provide(TestLayer))
    );

    expect(Exit.isFailure(exit)).toBe(true);

    if (Exit.isFailure(exit)) {
      const error = exit.cause;
      // The cause wraps our tagged error — extract it
      expect(error._tag).toBe("Fail");
      if (error._tag === "Fail") {
        expect(error.error).toBeInstanceOf(RateNotFoundError);
        expect((error.error as RateNotFoundError).rateId).toBe("nonexistent");
      }
    }
  });

  it("fails with InsufficientDataError when no energy readings", async () => {
    const session = makeSession();
    const rate = makeRate();

    const TestLayer = Layer.merge(
      makePricingServiceTest(new Map([["rate-1", rate]])),
      makeBillingServiceTest()
    );

    const exit = await Effect.runPromiseExit(
      calculateSessionCost({
        session,
        energyReadings: [], // no readings
        connectorStatusEvents: makeConnectorStatusEvents(),
        maxEnergyPerInterval: 1000,
        gracePeriodSeconds: 300,
      }).pipe(Effect.provide(TestLayer))
    );

    expect(Exit.isFailure(exit)).toBe(true);

    if (Exit.isFailure(exit)) {
      const error = exit.cause;
      expect(error._tag).toBe("Fail");
      if (error._tag === "Fail") {
        expect(error.error).toBeInstanceOf(InsufficientDataError);
      }
    }
  });

  it("fails with InsufficientDataError when no connector status events", async () => {
    const session = makeSession();
    const rate = makeRate();

    const TestLayer = Layer.merge(
      makePricingServiceTest(new Map([["rate-1", rate]])),
      makeBillingServiceTest()
    );

    const exit = await Effect.runPromiseExit(
      calculateSessionCost({
        session,
        energyReadings: makeEnergyReadings(),
        connectorStatusEvents: [], // no events
        maxEnergyPerInterval: 1000,
        gracePeriodSeconds: 300,
      }).pipe(Effect.provide(TestLayer))
    );

    expect(Exit.isFailure(exit)).toBe(true);

    if (Exit.isFailure(exit)) {
      const error = exit.cause;
      expect(error._tag).toBe("Fail");
      if (error._tag === "Fail") {
        expect(error.error).toBeInstanceOf(InsufficientDataError);
      }
    }
  });

  it("applies rate minCost when calculated cost is lower", async () => {
    const session = makeSession();
    const rate = makeRate({ minCost: 99999 }); // very high minimum

    const TestLayer = Layer.merge(
      makePricingServiceTest(new Map([["rate-1", rate]])),
      makeBillingServiceTest()
    );

    const result = await Effect.runPromise(
      calculateSessionCost({
        session,
        energyReadings: makeEnergyReadings(),
        connectorStatusEvents: makeConnectorStatusEvents(),
        maxEnergyPerInterval: 1000,
        gracePeriodSeconds: 300,
      }).pipe(Effect.provide(TestLayer))
    );

    expect(result.totalCost).toBe(99999);
  });
});
