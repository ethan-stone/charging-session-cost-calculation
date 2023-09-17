import { relations } from "drizzle-orm";
import {
  double,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    cost: int("cost").notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAt: index("created_at_idx").on(table.createdAt),
      updatedAt: index("updated_at_idx").on(table.updatedAt),
    };
  }
);

export const energyReadings = mysqlTable("energy_readings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull(),
  value: double("value").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const rates = mysqlTable("rates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  minCost: int("min_cost"),
  maxCost: int("max_cost"),
});

export const ratePricingElements = mysqlTable("rate_pricing_elements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  rateId: varchar("rate_id", { length: 36 }).notNull(),
});

export const ratePricingElementComponents = mysqlTable(
  "rate_pricing_element_components",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    value: int("value").notNull(),
    type: mysqlEnum("type", ["energy", "flat", "idle", "time"]).notNull(),
    ratePricingElementId: varchar("rate_pricing_element_id", {
      length: 36,
    }).notNull(),
  }
);

export const ratePricingElementRestrictions = mysqlTable(
  "rate_pricing_element_restrictions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ratePricingElementId: varchar("rate_pricing_element_id", {
      length: 36,
    }).notNull(),
  }
);

// relations
export const sessionsRelations = relations(sessions, ({ one, many }) => {
  return {
    energyReadings: many(energyReadings),
  };
});

export const energyReadingsRelations = relations(energyReadings, ({ one }) => {
  return {
    session: one(sessions, {
      fields: [energyReadings.sessionId],
      references: [sessions.id],
    }),
  };
});

export const ratesRelations = relations(rates, ({ many }) => {
  return {
    pricingElements: many(ratePricingElements),
  };
});

export const ratePricingElementsRelations = relations(
  ratePricingElements,
  ({ one, many }) => {
    return {
      rate: one(rates, {
        fields: [ratePricingElements.rateId],
        references: [rates.id],
      }),
      components: many(ratePricingElementComponents),
      restrictions: one(ratePricingElementRestrictions, {
        fields: [ratePricingElements.id],
        references: [ratePricingElementRestrictions.ratePricingElementId],
      }),
    };
  }
);

export const ratePricingElementComponentsRelations = relations(
  ratePricingElementComponents,
  ({ one }) => {
    return {
      pricingElement: one(ratePricingElements, {
        fields: [ratePricingElementComponents.ratePricingElementId],
        references: [ratePricingElements.id],
      }),
    };
  }
);

export const ratePricingElementRestrictionsRelations = relations(
  ratePricingElementRestrictions,
  ({ one }) => {
    return {
      pricingElement: one(ratePricingElements, {
        fields: [ratePricingElementRestrictions.ratePricingElementId],
        references: [ratePricingElements.id],
      }),
    };
  }
);
