import { describe, expect, it } from "vitest";
import {
  SessionInterval,
  getSessionChargingIntervals,
  getSessionIdleIntervals,
  sliceSessionIntervalsPerSecond,
} from "./session-interval";
import { ConnectorStatusEvent, EnergyReading } from "./types";

describe("getSessionChargingIntervals tests", () => {
  it("return empty array if energy readings or connector status events are empty", () => {
    const result = getSessionChargingIntervals([], []);

    expect(result).toEqual([]);
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

    const result = getSessionChargingIntervals(
      energyReadings,
      connectorStatusEvents
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
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 3),
        startEnergy: 200,
        endEnergy: 300,
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 4),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 5),
        startEnergy: 300,
        endEnergy: 400,
      },
    ]);
  });
});

describe("getSessionIdleIntervals", () => {
  it("return empty array if energy readings or connector status events are empty", () => {
    const result = getSessionIdleIntervals([], []);

    expect(result).toEqual([]);
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

    const result = getSessionIdleIntervals(
      energyReadings,
      connectorStatusEvents
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
      },
      {
        sessionId: "1",
        type: "idle",
        energyConsumed: 0,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 5),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 6),
        startEnergy: 400,
        endEnergy: 400,
      },
    ]);
  });
});

describe("sliceSessionIntervalsPerSecond", () => {
  it.todo("slice intervals correctly", () => {});
});
