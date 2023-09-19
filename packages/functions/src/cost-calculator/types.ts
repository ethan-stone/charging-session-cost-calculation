export type Session = {
  id: string;
  cost: number | null;
  rateId: string;
  startTime: Date;
  endTime: Date | null;
  timezone: string;
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
  restrictions: RatePricingElementRestrictions;
};

export type RatePricingElementComponent = {
  id: string;
  ratePricingElementId: string;
  type: "energy" | "flat" | "idle" | "time";
  value: number;
};

export type RatePricingElementRestrictions = {
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  minKwh?: number;
  maxKwh?: number;
  minCurrent?: number;
  maxCurrent?: number;
  minPower?: number;
  maxPower?: number;
  minDuration?: number;
  maxDuration?: number;
  dayOfWeek?: (
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY"
  )[];
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
