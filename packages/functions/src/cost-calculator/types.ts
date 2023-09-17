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
  value: number;
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
