import { describe, it, expect } from "vitest";

import { energyCostCalculator, isValidPricingElement } from "./cost-calculator";
import { Rate, Session } from "./types";
import {
  SessionInterval,
  interpolateSessionIntervalsPerSecond,
} from "./session-interval";

describe("isValidPricingElement tests", () => {
  it("should return true if restrictions is empty object", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {},
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeTruthy();
  });

  it("should return false if date is before start date", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        startDate: "2021-01-02",
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if date is after end date", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        endDate: "2020-12-31",
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if duration is less than min duration", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        minDuration: 200,
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if duration is greater than max duration", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        maxDuration: 50,
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if date time is less than start time", () => {
    const date = new Date("2021-01-01T12:00:00.000Z"); // this is 04:00 in Los Angeles

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        startTime: "05:00",
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if date time is greater than end time", () => {
    const date = new Date("2021-01-01T12:00:00.000Z"); // this is 04:00 in Los Angeles

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        endTime: "03:00",
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if energyConsumed is less than min kWh", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        minKwh: 200,
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false if energyConsumed is greater than max kWh", () => {
    const date = new Date("2021-01-01T12:00:00.000Z");

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        maxKwh: 50,
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });

  it("should return false duration date is wrong day of week", () => {
    const date = new Date("2021-01-01T12:00:00.000Z"); // this is a friday

    const isValid = isValidPricingElement({
      date: date,
      duration: 100,
      energyConsumed: 100,
      restrictions: {
        dayOfWeek: ["MONDAY"],
      },
      timezone: "America/Los_Angeles",
    });

    expect(isValid).toBeFalsy();
  });
});

describe("energyCostCalculator tests", () => {
  it.todo(
    "should work for simple rate with single element with no restrictions",
    () => {
      const startTime = new Date("2021-01-01T00:00:00.000Z");

      const session = {
        cost: null,
        createdAt: new Date(),
        endTime: null,
        id: "1",
        rateId: "1",
        startTime: startTime,
        timezone: "America/Los_Angeles",
        updatedAt: new Date(),
      } satisfies Session;

      const rate = {
        id: "1",
        maxCost: null,
        minCost: null,
        pricingElements: [
          {
            id: "1",
            rateId: "1",
            components: [
              {
                id: "1",
                ratePricingElementId: "1",
                type: "energy",
                value: 20,
              },
            ],
            restrictions: {},
          },
        ],
      } satisfies Rate;

      const sessionIntervals: SessionInterval[] = [
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
      ];

      const energyCost = energyCostCalculator(session, rate, sessionIntervals);

      expect(energyCost).toEqual(6000);
    }
  );

  it("should work for simple rate with multiple elements with restrictions", () => {
    const startTime = new Date("2021-01-01T00:00:00.000Z");

    const session = {
      cost: null,
      createdAt: new Date(),
      endTime: null,
      id: "1",
      rateId: "1",
      startTime: startTime,
      timezone: "America/Los_Angeles",
      updatedAt: new Date(),
    } satisfies Session;

    const rate = {
      id: "1",
      maxCost: null,
      minCost: null,
      pricingElements: [
        {
          id: "1",
          rateId: "1",
          components: [
            {
              id: "1",
              ratePricingElementId: "1",
              type: "energy",
              value: 20,
            },
          ],
          restrictions: {
            startTime: "16:01",
            endTime: "16:02",
          },
        },
        {
          id: "1",
          rateId: "1",
          components: [
            {
              id: "1",
              ratePricingElementId: "1",
              type: "energy",
              value: 30,
            },
          ],
          restrictions: {
            startTime: "16:02",
          },
        },
      ],
    } satisfies Rate;

    const sessionIntervals: SessionInterval[] = [
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
    ];

    const interpolated = interpolateSessionIntervalsPerSecond(sessionIntervals);

    // console.log(JSON.stringify(interpolated, null, 2));

    const energyCost = energyCostCalculator(session, rate, interpolated);

    expect(energyCost).toEqual(8000);
  });
});
