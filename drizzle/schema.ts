import {
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "staff", "user"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    contactName: varchar("contactName", { length: 160 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 64 }),
    address: text("address"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("suppliers_name_idx").on(table.name)],
);

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    sku: varchar("sku", { length: 80 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    quantity: int("quantity").notNull().default(0),
    supplierId: int("supplierId").references(() => suppliers.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("products_sku_unique").on(table.sku),
    index("products_category_idx").on(table.category),
    index("products_supplier_idx").on(table.supplierId),
  ],
);

export const inventorySettings = mysqlTable("inventorySettings", {
  id: int("id").autoincrement().primaryKey(),
  lowStockThreshold: int("lowStockThreshold").notNull().default(10),
  updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const stockMovements = mysqlTable(
  "stockMovements",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
    quantity: int("quantity").notNull(),
    quantityBefore: int("quantityBefore").notNull(),
    quantityAfter: int("quantityAfter").notNull(),
    reason: varchar("reason", { length: 200 }).notNull(),
    notes: text("notes"),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  },
  table => [
    index("stock_movements_product_idx").on(table.productId),
    index("stock_movements_occurred_idx").on(table.occurredAt),
  ],
);

export const sales = mysqlTable(
  "sales",
  {
    id: int("id").autoincrement().primaryKey(),
    reference: varchar("reference", { length: 40 }).notNull(),
    customerName: varchar("customerName", { length: 160 }),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    saleDate: timestamp("saleDate").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("sales_reference_unique").on(table.reference),
    index("sales_date_idx").on(table.saleDate),
    index("sales_staff_idx").on(table.createdByUserId),
  ],
);

export const saleItems = mysqlTable(
  "saleItems",
  {
    id: int("id").autoincrement().primaryKey(),
    saleId: int("saleId").notNull().references(() => sales.id, { onDelete: "cascade" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "restrict" }),
    productName: varchar("productName", { length: 200 }).notNull(),
    sku: varchar("sku", { length: 80 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  },
  table => [index("sale_items_sale_idx").on(table.saleId), index("sale_items_product_idx").on(table.productId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InventorySettings = typeof inventorySettings.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
