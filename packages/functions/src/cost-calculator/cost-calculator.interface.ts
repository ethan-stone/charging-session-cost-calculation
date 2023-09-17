import * as schema from "src/db/schema";

type Session = typeof schema.sessions.$inferSelect;
type EnergyReading = typeof schema.energyReadings.$inferSelect;
type RatePricingElementComponents =
  typeof schema.ratePricingElementComponents.$inferSelect;
type RatePricingElementRestrictions =
  typeof schema.ratePricingElementRestrictions.$inferSelect;
type RatePricingElement = typeof schema.ratePricingElements.$inferSelect & {
  components: RatePricingElementComponents[];
  restrictions?: RatePricingElementRestrictions;
};
type Rate = typeof schema.rates.$inferSelect & {
  pricingElements: RatePricingElement[];
};

interface CostCalculator {
  calculate: (
    session: Session,
    rate: Rate,
    energyReadings: EnergyReading[]
  ) => number;
}
