import { ConnectorStatusEvent, EnergyReading } from "./types";

export type SessionInterval = {
  sessionId: string;
  type: "charging" | "idle";
  energyConsumed: number;
  startEnergy: number;
  endEnergy: number;
  startTime: Date;
  endTime: Date;
};

type GetSessionIntervals = (
  energyReadings: EnergyReading[],
  connectorStatusEvents: ConnectorStatusEvent[]
) => SessionInterval[];

export const getSessionChargingIntervals: GetSessionIntervals = (
  energyReadings,
  connectorStatusEvents
) => {
  if (energyReadings.length === 0 || connectorStatusEvents.length === 0) {
    return [];
  }

  const chargingIntervals: SessionInterval[] = [];

  for (let i = 0; i < energyReadings.length; i++) {
    if (i === energyReadings.length - 1) continue; // we can't compare the last reading to the next reading

    const currentReading = energyReadings[i];
    const nextReading = energyReadings[i + 1];

    if (currentReading.value < nextReading.value) {
      chargingIntervals.push({
        sessionId: currentReading.sessionId,
        type: "charging",
        energyConsumed: nextReading.value - currentReading.value,
        startTime: currentReading.timestamp,
        endTime: nextReading.timestamp,
        startEnergy: currentReading.value,
        endEnergy: nextReading.value,
      });
    }
  }

  return chargingIntervals;
};

export const getSessionIdleIntervals: GetSessionIntervals = (
  energyReadings,
  connectorStatusEvents
) => {
  if (energyReadings.length === 0 || connectorStatusEvents.length === 0) {
    return [];
  }

  const idleIntervals: SessionInterval[] = [];

  for (let i = 0; i < energyReadings.length; i++) {
    if (i === energyReadings.length - 1) continue; // we can't compare the last reading to the next reading

    const currentReading = energyReadings[i];
    const nextReading = energyReadings[i + 1];

    if (currentReading.value === nextReading.value) {
      const connectorStatusesBeforeCurrentReading = connectorStatusEvents
        .filter((c) => {
          return c.timestamp < currentReading.timestamp;
        })
        .sort((a, b) => {
          if (a.timestamp > b.timestamp) return 1;
          if (a.timestamp < b.timestamp) return -1;
          return 0;
        });

      const mostRecentConnectorStatusBeforeCurrentReading =
        connectorStatusesBeforeCurrentReading[
          connectorStatusesBeforeCurrentReading.length - 1
        ];

      if (mostRecentConnectorStatusBeforeCurrentReading.status === "idle") {
        idleIntervals.push({
          sessionId: currentReading.sessionId,
          energyConsumed: 0,
          endTime: nextReading.timestamp,
          startTime: currentReading.timestamp,
          type: "idle",
          endEnergy: nextReading.value,
          startEnergy: currentReading.value,
        });
      }
    }
  }

  return idleIntervals;
};

function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

export function interpolateSessionIntervalsPerSecond(
  sessionIntervals: SessionInterval[]
): SessionInterval[] {
  const interpolatedSessionIntervals: SessionInterval[] = [];

  for (let i = 0; i < sessionIntervals.length; i++) {
    const interval = sessionIntervals[i];

    const diffInSeconds =
      (interval.endTime.getTime() - interval.startTime.getTime()) / 1000;

    const t = 1 / diffInSeconds;

    for (let j = 0; j < diffInSeconds; j++) {
      const newStartEnergy = lerp(
        interval.startEnergy,
        interval.endEnergy,
        j * t
      );

      const newEndEnergy = lerp(
        interval.startEnergy,
        interval.endEnergy,
        (j + 1) * t
      );

      interpolatedSessionIntervals.push({
        sessionId: interval.sessionId,
        type: interval.type,
        energyConsumed: newEndEnergy - newStartEnergy,
        startEnergy: newStartEnergy,
        endEnergy: newEndEnergy,
        startTime: new Date(interval.startTime.getTime() + j * 1000),
        endTime: new Date(interval.startTime.getTime() + (j + 1) * 1000),
      });
    }
  }

  return interpolatedSessionIntervals;
}
