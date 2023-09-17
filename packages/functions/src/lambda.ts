import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { rates } from "./db/schema";

export async function handler() {
  const result = await db.query.rates.findFirst({
    where: eq(rates.id, "01HAGK58NJY4CPV29DHQN7T345"),
    with: {
      pricingElements: {
        with: {
          components: true,
          restrictions: true,
        },
      },
    },
  });

  console.log(JSON.stringify(result, undefined, 4));
}

handler();
