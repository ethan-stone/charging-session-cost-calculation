import { describe, it, expect } from "vitest";

import { isValidPricingElement } from "./cost-calculator";

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
