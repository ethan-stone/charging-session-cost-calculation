import { describe, it, expect } from "vitest";
import { Rate, Session } from "./types";
import { SessionInterval } from "./session-interval";
import { getPricingElementIdx } from "./cost-calculator";

describe("getPricingElementIdx tests", () => {
  it("should return first pricing element if no restrictions exist", () => {
    const startTime = new Date("2021-01-01T00:00:00.000Z");

    const session = {
      id: "1",
      cost: 0,
      createdAt: new Date(),
      endTime: new Date(),
      rateId: "1",
      startTime: new Date(),
      timezone: "America/Los_Angeles",
      updatedAt: new Date(),
    } satisfies Session;

    const rate = {
      id: "1",
      maxCost: 100,
      minCost: 0,
      pricingElements: [
        {
          id: "1",
          rateId: "1",
          restrictions: {},
          components: [
            {
              id: "1",
              type: "energy",
              ratePricingElementId: "1",
              value: 10,
            },
          ],
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

    const pricingElementIdx = getPricingElementIdx(
      session,
      rate,
      sessionIntervals[0],
      sessionIntervals
    );

    expect(pricingElementIdx).toEqual(0);
  });
});
