export type Session = {
  id: string;
  cost: number;
  rateId: string;
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Rate = {
  id: string;
  minCost: number | null;
  maxCost: number | null;
  pricingElements: RatePricingElement[];
};

export type RatePricingElement = {
  id: string;
  rateId: string;
  components: RatePricingElementComponent[];
};

export type RatePricingElementComponent = {
  id: string;
  ratePricingElementId: string;
  type: "energy" | "flat" | "idle" | "time";
};

export type EnergyReading = {
  id: string;
  sessionId: string;
  value: number;
  timestamp: Date;
};

export type ConnectorStatusEvent = {
  id: string;
  sessionId: string;
  status: "charging" | "idle";
  timestamp: Date;
};

export type CostCalculator = (
  session: Session,
  rate: Rate,
  energyReadings: EnergyReading[]
) => number;

export type SessionInterval = {
  sessionId: string;
  type: "charging" | "idle";
  energyConsumed: number;
  startTime: Date;
  endTime: Date;
};

export function getSessionIntervals(
  energyReadings: EnergyReading[],
  connectorStatusEvents: ConnectorStatusEvent[]
): SessionInterval[] {
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
      });
    }
  }

  return chargingIntervals;
}
