import { db } from "src/db/client";
import * as schema from "src/db/schema";
import { ulid } from "ulid";

type NewRate = typeof schema.rates.$inferInsert;
type NewPricingElement = typeof schema.ratePricingElements.$inferInsert;
type NewPricingElementComponent =
  typeof schema.ratePricingElementComponents.$inferInsert;
type NewPricingElementRestrictions =
  typeof schema.ratePricingElementRestrictions.$inferInsert;

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

  await db.transaction(async (tx) => {
    await tx.insert(schema.rates).values({
      id: rate.id,
    });

    await tx.insert(schema.ratePricingElements).values({
      id: pricingElement.id,
      rateId: rate.id,
    });

    await tx.insert(schema.ratePricingElementComponents).values({
      id: pricingElementComponent.id,
      ratePricingElementId: pricingElement.id,
      type: pricingElementComponent.type,
      value: pricingElementComponent.value,
    });
  });
}

main();
