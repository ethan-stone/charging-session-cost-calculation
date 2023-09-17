import { SessionInterval } from "./session-intervals";
import { Rate, Session } from "./types";

export type CostCalculator = (
  session: Session,
  rate: Rate,
  sessionIntervals: SessionInterval[]
) => number;

export const energyCostCalculator: CostCalculator = (
  session,
  rate,
  sessionIntervals
) => {
  return 0;
};
