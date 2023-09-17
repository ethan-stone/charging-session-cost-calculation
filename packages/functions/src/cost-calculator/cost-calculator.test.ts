import { describe, it } from "vitest";
import { Rate } from "./types";
import { SessionInterval } from "./session-intervals";

describe("energyCostCalculator tests", () => {
  it.todo(
    "should calculate the cost with rate with single element at 10 cents per kWh",
    () => {
      const startTime = new Date("2021-01-01T00:00:00.000Z");

      const rate = {
        id: "1",
        maxCost: 100,
        minCost: 0,
        pricingElements: [
          {
            id: "1",
            rateId: "1",
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

      const sessionChargingIntervals: SessionInterval[] = [
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
      ];
    }
  );
});
