import { pgTable, text, serial, integer, boolean, decimal, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "seller"] }).notNull().default("seller"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  totalDebt: decimal("total_debt", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode").unique(),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  sellPrice: decimal("sell_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(5),
  brand: text("brand"),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleNumber: text("sale_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  paymentType: text("payment_type", { enum: ["cash", "credit", "installment"] }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status", { enum: ["completed", "pending", "cancelled"] }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status", { enum: ["completed", "pending", "cancelled"] }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase items table
export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Credit payments table
export const creditPayments = pgTable("credit_payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  userId: integer("user_id").references(() => users.id).notNull(),
  note: text("note"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  purchases: many(purchases),
  creditPayments: many(creditPayments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  purchases: many(purchases),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  creditPayments: many(creditPayments),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  saleItems: many(saleItems),
  purchaseItems: many(purchaseItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  saleItems: many(saleItems),
  creditPayments: many(creditPayments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  purchaseItems: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
}));

export const creditPaymentsRelations = relations(creditPayments, ({ one }) => ({
  sale: one(sales, {
    fields: [creditPayments.saleId],
    references: [sales.id],
  }),
  customer: one(customers, {
    fields: [creditPayments.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [creditPayments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, totalDebt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true });
export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({ id: true });
export const insertCreditPaymentSchema = createInsertSchema(creditPayments).omit({ id: true, paymentDate: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type CreditPayment = typeof creditPayments.$inferSelect;
export type InsertCreditPayment = z.infer<typeof insertCreditPaymentSchema>;
