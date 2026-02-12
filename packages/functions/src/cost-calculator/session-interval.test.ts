import { describe, expect, it } from "vitest";
import { Effect, Exit } from "effect";
import {
  SessionInterval,
  getSessionChargingIntervals,
  getSessionIdleIntervals,
  interpolateSessionIntervalsPerSecond,
} from "./session-interval";
import { ConnectorStatusEvent, EnergyReading } from "./types";
import { InsufficientDataError } from "./errors";

describe("getSessionChargingIntervals tests", () => {
  it("should fail with InsufficientDataError if energy readings or connector status events are empty", () => {
    const exit = Effect.runSyncExit(getSessionChargingIntervals([], []));

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(InsufficientDataError);
    }
  });

  it("should identify charging intervals by looking at energy readings and finding where value_m+1 - value_m > 0", () => {
    const startTime = new Date("2021-01-01T00:00:00.000Z");

    const energyReadings: EnergyReading[] = [
      {
        id: "1",
        sessionId: "1",
        value: 100,
        timestamp: new Date(startTime.getTime() + 1000 * 60),
      },
      {
        id: "2",
        sessionId: "1",
        value: 200,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 2),
      },
      {
        id: "3",
        sessionId: "1",
        value: 300,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 3),
      },
      {
        id: "4",
        sessionId: "1",
        value: 300,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 4),
      },
      {
        id: "5",
        sessionId: "1",
        value: 400,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 5),
      },
    ];

    const connectorStatusEvents: ConnectorStatusEvent[] = [
      {
        id: "1",
        sessionId: "1",
        status: "charging",
        timestamp: new Date(startTime.getTime() + 1000 * 60),
      },
    ];

    const result = Effect.runSync(
      getSessionChargingIntervals(energyReadings, connectorStatusEvents)
    );

    expect(result).toEqual([
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        startEnergy: 100,
        endEnergy: 200,
        duration: 60,
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 3),
        startEnergy: 200,
        endEnergy: 300,
        duration: 60,
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 4),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 5),
        startEnergy: 300,
        endEnergy: 400,
        duration: 60,
      },
    ]);
  });
});

describe("getSessionIdleIntervals", () => {
  it("should fail with InsufficientDataError if energy readings or connector status events are empty", () => {
    const exit = Effect.runSyncExit(getSessionIdleIntervals([], []));

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(InsufficientDataError);
    }
  });

  it('should identify idle intervals by looking at periods of time where the connector status is "idle" AND value_m+1 - value_m = 0', () => {
    const startTime = new Date("2021-01-01T00:00:00.000Z");

    const energyReadings: EnergyReading[] = [
      {
        id: "1",
        sessionId: "1",
        value: 100,
        timestamp: new Date(startTime.getTime() + 1000 * 60),
      },
      {
        id: "2",
        sessionId: "1",
        value: 200,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 2),
      },
      {
        id: "3",
        sessionId: "1",
        value: 300,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 3),
      },
      {
        id: "4",
        sessionId: "1",
        value: 300,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 4),
      },
      {
        id: "5",
        sessionId: "1",
        value: 400,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 5),
      },
      {
        id: "6",
        sessionId: "1",
        value: 400,
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 6),
      },
    ];

    const connectorStatusEvents: ConnectorStatusEvent[] = [
      {
        id: "1",
        sessionId: "1",
        status: "charging",
        timestamp: new Date(startTime.getTime() + 1000 * 60),
      },
      {
        id: "1",
        sessionId: "1",
        status: "idle",
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 2.5),
      },
      {
        id: "1",
        sessionId: "1",
        status: "charging",
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 4.2),
      },
      {
        id: "1",
        sessionId: "1",
        status: "idle",
        timestamp: new Date(startTime.getTime() + 1000 * 60 * 4.8),
      },
    ];

    const result = Effect.runSync(
      getSessionIdleIntervals(energyReadings, connectorStatusEvents)
    );

    expect(result).toEqual([
      {
        sessionId: "1",
        type: "idle",
        energyConsumed: 0,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 3),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 4),
        startEnergy: 300,
        endEnergy: 300,
        duration: 60,
      },
      {
        sessionId: "1",
        type: "idle",
        energyConsumed: 0,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 5),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 6),
        startEnergy: 400,
        endEnergy: 400,
        duration: 60,
      },
    ]);
  });
});

describe("sliceSessionIntervalsPerSecond", () => {
  it("slice intervals correctly", () => {
    const startTime = new Date("2021-01-01T00:00:00.000Z");

    const sessionIntervals: SessionInterval[] = [
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        startEnergy: 100,
        endEnergy: 200,
        duration: 60,
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 3),
        startEnergy: 200,
        endEnergy: 300,
        duration: 60,
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 4),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 5),
        startEnergy: 300,
        endEnergy: 400,
        duration: 60,
      },
    ];

    const interpolatedSessionIntervals = Effect.runSync(
      interpolateSessionIntervalsPerSecond(sessionIntervals)
    );

    expect(interpolatedSessionIntervals.length).toEqual(180);
  });
});
