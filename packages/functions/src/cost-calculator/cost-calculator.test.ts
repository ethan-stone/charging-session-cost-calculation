import { describe, expect, it } from "vitest";
import {
  getSessionIntervals,
  EnergyReading,
  ConnectorStatusEvent,
} from "./index";

describe("getSessionIntervals tests", () => {
  it("return empty array if energy readings or connector status events are empty", () => {
    const result = getSessionIntervals([], []);

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

    const result = getSessionIntervals(energyReadings, connectorStatusEvents);

    expect(result).toEqual([
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 2),
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 2),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 3),
      },
      {
        sessionId: "1",
        type: "charging",
        energyConsumed: 100,
        startTime: new Date(startTime.getTime() + 1000 * 60 * 4),
        endTime: new Date(startTime.getTime() + 1000 * 60 * 5),
      },
    ]);
  });
});
