import { Effect } from "effect";
import { SessionInterval } from "./session-interval";
import { Rate, RatePricingElementRestrictions, Session } from "./types";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dayjs from "dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CostCalculator = (
  session: Session,
  rate: Rate,
  sessionIntervals: SessionInterval[]
) => Effect.Effect<number>;

const DayOfWeekToNumber = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function isValidDayOfWeek(
  date: Date,
  timezone: string,
  validDaysOfWeeks: (
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY"
  )[]
): boolean {
  const day = dayjs(date).tz(timezone).day();

  return validDaysOfWeeks.some(
    (dayString) => DayOfWeekToNumber[dayString] === day
  );
}

function isValidStartDate(date: Date, validStartDate: Date): boolean {
  return dayjs(date).isAfter(validStartDate);
}

function isValidEndDate(date: Date, validEndDate: Date): boolean {
  return dayjs(date).isBefore(validEndDate);
}

/**
 *  Checks if the time in the date is after the validStartTime.
 *  Valid start time is in the format HH:mm
 * @param {Date} date the date to check
 * @param {string} timezone the timezone of the date
 * @param {string} validStartTime the valid start time in the format HH:mm
 */
function isValidStartTime(
  date: Date,
  timezone: string,
  validStartTime: string
): boolean {
  const day = dayjs(date).tz(timezone);

  const hour = day.hour();
  const minute = day.minute();
  const second = day.second();

  const [validStartHour, validStartMinute] = validStartTime.split(":");
  const validStartHourNumber = parseInt(validStartHour);
  const validStartMinuteNumber = parseInt(validStartMinute);

  const timeInSeconds = 60 * (hour * 60 + minute) + second;
  const validTimeInSeconds =
    60 * (validStartHourNumber * 60 + validStartMinuteNumber);

  return timeInSeconds >= validTimeInSeconds;
}

/**
 *  Checks if the time in the date is before the validEndTime.
 *  Valid end time is in the format HH:mm
 * @param {Date} date the date to check
 * @param {string} timezone the timezone of the date
 * @param {string} validEndTime the valid start time in the format HH:mm
 */
function isValidEndTime(
  date: Date,
  timezone: string,
  validEndTime: string
): boolean {
  const day = dayjs(date).tz(timezone);

  const hour = day.hour();
  const minute = day.minute();
  const second = day.second();

  const [validEndHour, validEndMinute] = validEndTime.split(":");
  const validEndHourNumber = parseInt(validEndHour);
  const validEndMinuteNumber = parseInt(validEndMinute);

  const timeInSeconds = 60 * (hour * 60 + minute) + second;
  const validTimeInSeconds =
    60 * (validEndHourNumber * 60 + validEndMinuteNumber);

  return timeInSeconds <= validTimeInSeconds;
}

/**
 * Checks if the time between the startDate and endDate is greater than the minDuration
 * @param startDate
 * @param endDate
 * @param minDuration the minimum duration in seconds
 */
function isValidMinDuration(duration: number, minDuration: number) {
  return duration >= minDuration;
}

/**
 * Checks if the time between the startDate and endDate is less than the maxDuration
 * @param startDate
 * @param endDate
 * @param maxDuration the maximum duration in seconds
 */
function isValidMaxDuration(duration: number, maxDuration: number) {
  return duration <= maxDuration;
}

function isValidMinKwh(energyConsumed: number, minKwh: number) {
  return energyConsumed >= minKwh;
}

function isValidMaxKwh(energyConsumed: number, maxKwh: number) {
  return energyConsumed <= maxKwh;
}

export function isValidPricingElement({
  restrictions,
  timezone,
  date,
  duration,
  energyConsumed,
}: {
  restrictions: RatePricingElementRestrictions;
  timezone: string;
  date: Date;
  energyConsumed: number;
  duration: number;
}) {
  if (
    restrictions.dayOfWeek !== undefined &&
    !isValidDayOfWeek(date, timezone, restrictions.dayOfWeek)
  ) {
    return false;
  }

  if (
    restrictions.startDate !== undefined &&
    !isValidStartDate(date, new Date(restrictions.startDate))
  ) {
    return false;
  }

  if (
    restrictions.endDate !== undefined &&
    !isValidEndDate(date, new Date(restrictions.endDate))
  ) {
    return false;
  }

  if (
    restrictions.startTime !== undefined &&
    !isValidStartTime(date, timezone, restrictions.startTime)
  ) {
    return false;
  }

  if (
    restrictions.endTime !== undefined &&
    !isValidEndTime(date, timezone, restrictions.endTime)
  ) {
    return false;
  }

  if (
    restrictions.minDuration !== undefined &&
    !isValidMinDuration(duration, restrictions.minDuration)
  ) {
    return false;
  }

  if (
    restrictions.maxDuration !== undefined &&
    !isValidMaxDuration(duration, restrictions.maxDuration)
  ) {
    return false;
  }

  if (
    restrictions.minKwh !== undefined &&
    !isValidMinKwh(energyConsumed, restrictions.minKwh)
  ) {
    return false;
  }

  if (
    restrictions.maxKwh !== undefined &&
    !isValidMaxKwh(energyConsumed, restrictions.maxKwh)
  ) {
    return false;
  }

  return true;
}

export function getPricingElementIdx(
  session: Session,
  rate: Rate,
  currentSessionInterval: SessionInterval,
  sessionIntervals: SessionInterval[]
): number | undefined {
  if (sessionIntervals.length === 0) return undefined;

  const firstSessionInterval = sessionIntervals[0];

  for (let i = 0; i < rate.pricingElements.length; i++) {
    const pricingElement = rate.pricingElements[i];

    const restrictions = pricingElement.restrictions;

    const isValidPricingElementForIntervalStart = isValidPricingElement({
      date: currentSessionInterval.startTime,
      duration:
        currentSessionInterval.startTime.getTime() / 1000 -
        firstSessionInterval.startTime.getTime() / 1000,
      energyConsumed:
        currentSessionInterval.startEnergy - firstSessionInterval.startEnergy,
      restrictions,
      timezone: session.timezone,
    });

    const isValidPricingElementForIntervalEnd = isValidPricingElement({
      date: currentSessionInterval.endTime,
      duration:
        currentSessionInterval.endTime.getTime() / 1000 -
        firstSessionInterval.startTime.getTime() / 1000,
      energyConsumed:
        currentSessionInterval.endEnergy - firstSessionInterval.startEnergy,
      restrictions,
      timezone: session.timezone,
    });

    if (
      isValidPricingElementForIntervalStart &&
      isValidPricingElementForIntervalEnd
    ) {
      return i;
    }
  }

  return undefined;
}

export const energyCostCalculator: CostCalculator = (
  session,
  rate,
  sessionIntervals
) =>
  Effect.sync(() => {
    let total = 0;

    for (const sessionInterval of sessionIntervals) {
      const pricingElementIdx = getPricingElementIdx(
        session,
        rate,
        sessionInterval,
        sessionIntervals
      );

      if (pricingElementIdx === undefined) {
        continue;
      }

      const pricingElement = rate.pricingElements[pricingElementIdx];

      const energyComponent = pricingElement.components.find(
        (c) => c.type === "energy"
      );

      if (energyComponent === undefined) continue;

      total += energyComponent.value * sessionInterval.energyConsumed;
    }

    return Math.floor(total);
  });

export const idleCostCalculator: CostCalculator = (
  session,
  rate,
  sessionIntervals
) =>
  Effect.sync(() => {
    let total = 0;

    for (const sessionInterval of sessionIntervals) {
      const pricingElementIdx = getPricingElementIdx(
        session,
        rate,
        sessionInterval,
        sessionIntervals
      );

      if (pricingElementIdx === undefined) {
        continue;
      }

      const pricingElement = rate.pricingElements[pricingElementIdx];

      const idleComponent = pricingElement.components.find(
        (c) => c.type === "idle"
      );

      if (idleComponent === undefined) continue;

      if (sessionInterval.type !== "idle") continue;

      total += idleComponent.value * sessionInterval.duration;
    }

    return Math.floor(total);
  });

/**
 * creates a cost calculator to calculate the cost of the idle time during the grace period
 * @param gracePeriod the amount of desired grace period in seconds
 * @returns a cost calculator
 */
export const createGracePeriodCostCalculator = (
  gracePeriod: number
): CostCalculator => {
  return (session, rate, sessionIntervals) =>
    Effect.sync(() => {
      let total = 0;
      let currentIdlePeriodDuration = 0;

      for (const sessionInterval of sessionIntervals) {
        const pricingElementIdx = getPricingElementIdx(
          session,
          rate,
          sessionInterval,
          sessionIntervals
        );

        if (pricingElementIdx === undefined) {
          continue;
        }

        const pricingElement = rate.pricingElements[pricingElementIdx];

        const idleComponent = pricingElement.components.find(
          (c) => c.type === "idle"
        );

        if (idleComponent === undefined) continue;

        // if the session interval is not idle, reset the idle period duration
        if (sessionInterval.type !== "idle") {
          currentIdlePeriodDuration = 0;
          continue;
        }

        // we only want to add to the grace period cost if the idle period duration is less than the grace period
        if (currentIdlePeriodDuration >= gracePeriod) {
          continue;
        }

        currentIdlePeriodDuration += sessionInterval.duration;

        total += idleComponent.value * sessionInterval.duration;
      }

      return Math.floor(total);
    });
};
