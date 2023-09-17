import { db } from "./src/db/client";
import * as schema from "./src/db/schema";
import { ulid } from "ulid";

type NewRate = typeof schema.rates.$inferInsert;
type NewPricingElement = typeof schema.ratePricingElements.$inferInsert;
type NewPricingElementComponent =
  typeof schema.ratePricingElementComponents.$inferInsert;
type NewEnergyReading = typeof schema.energyReadings.$inferInsert;
type NewSession = typeof schema.sessions.$inferInsert;

async function main() {
  const rate = {
    id: ulid(),
  } satisfies NewRate;

  const pricingElement = {
    id: ulid(),
    rateId: rate.id,
  } satisfies NewPricingElement;

  const pricingElementComponent = {
    id: ulid(),
    ratePricingElementId: pricingElement.id,
    type: "energy",
    value: 100,
  } satisfies NewPricingElementComponent;

  const session = {
    id: ulid(),
    rateId: rate.id,
    startTime: new Date(),
  } satisfies NewSession;

  await db.transaction(async (tx) => {
    await tx.insert(schema.rates).values(rate);

    await tx.insert(schema.ratePricingElements).values(pricingElement);

    await tx
      .insert(schema.ratePricingElementComponents)
      .values(pricingElementComponent);

    await tx.insert(schema.sessions).values(session);

    const firstEnergyReading = 100;

    const energyReadings: NewEnergyReading[] = [];

    for (let i = 0; i < 100; i++) {
      const value = firstEnergyReading + i * 100;

      const energyReading = {
        id: ulid(),
        sessionId: session.id,
        value,
        timestamp: new Date(session.startTime.getTime() + i * 60 * 1000),
      } satisfies NewEnergyReading;

      energyReadings.push(energyReading);
    }

    await tx.insert(schema.energyReadings).values(energyReadings);
  });

  console.log(session.id);
}

main();
