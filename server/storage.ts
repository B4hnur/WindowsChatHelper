import { 
  users, customers, suppliers, categories, products, sales, saleItems, 
  purchases, purchaseItems, creditPayments, storeSettings,
  type User, type InsertUser, type Customer, type InsertCustomer,
  type Supplier, type InsertSupplier, type Category, type InsertCategory,
  type Product, type InsertProduct, type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem, type Purchase, type InsertPurchase,
  type PurchaseItem, type InsertPurchaseItem, type CreditPayment, type InsertCreditPayment,
  type StoreSettings, type InsertStoreSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, count, sql, and, gte, lte, like, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  updateCustomerDebt(id: number, amount: string): Promise<Customer | undefined>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  updateProductStock(id: number, quantity: number): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Sales
  getSales(limit?: number): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  getSalesStats(startDate?: Date, endDate?: Date): Promise<any>;
  getTodaySales(): Promise<{ count: number; total: string }>;
  
  // Purchases
  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]>;
  
  // Credit Payments
  getCreditPayments(customerId?: number): Promise<CreditPayment[]>;
  createCreditPayment(payment: InsertCreditPayment): Promise<CreditPayment>;
  
  // Dashboard
  getDashboardStats(): Promise<any>;
  
  // Store Settings
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updatedSupplier] = await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning();
    return updatedSupplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount > 0;
  }

  async updateCustomerDebt(id: number, amount: string): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers)
      .set({ totalDebt: sql`${customers.totalDebt} + ${amount}` })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set({ stock: sql`${products.stock} + ${quantity}` })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(sql`${products.stock} <= ${products.minStock}`);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(or(
        like(products.name, `%${query}%`),
        like(products.barcode, `%${query}%`),
        like(products.brand, `%${query}%`)
      ));
  }

  // Sales
  async getSales(limit = 50): Promise<Sale[]> {
    return await db.select().from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.createdAt))
      .limit(limit);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    return await db.transaction(async (tx) => {
      // Create sale
      const [newSale] = await tx.insert(sales).values(sale).returning();
      
      // Create sale items and update stock
      for (const item of items) {
        await tx.insert(saleItems).values({
          ...item,
          saleId: newSale.id
        });
        
        // Update product stock
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      
      // Update customer debt if credit sale
      if (sale.paymentType !== 'cash' && sale.customerId && sale.remainingAmount) {
        await tx.update(customers)
          .set({ totalDebt: sql`${customers.totalDebt} + ${sale.remainingAmount}` })
          .where(eq(customers.id, sale.customerId));
      }
      
      return newSale;
    });
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId));
  }

  async getSalesStats(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db.select({
      totalSales: sum(sales.total),
      salesCount: count(sales.id),
    }).from(sales);

    if (startDate && endDate) {
      query = query.where(and(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      ));
    }

    const [stats] = await query;
    return stats;
  }

  async getTodaySales(): Promise<{ count: number; total: string }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [stats] = await db.select({
      count: count(sales.id),
      total: sum(sales.total),
    }).from(sales)
    .where(and(
      gte(sales.createdAt, today),
      lte(sales.createdAt, tomorrow)
    ));

    return {
      count: stats.count || 0,
      total: stats.total || "0.00"
    };
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .leftJoin(users, eq(purchases.userId, users.id))
      .orderBy(desc(purchases.createdAt));
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    return await db.transaction(async (tx) => {
      // Create purchase
      const [newPurchase] = await tx.insert(purchases).values(purchase).returning();
      
      // Create purchase items and update stock
      for (const item of items) {
        await tx.insert(purchaseItems).values({
          ...item,
          purchaseId: newPurchase.id
        });
        
        // Update product stock
        await tx.update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      
      return newPurchase;
    });
  }

  async getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
    return await db.select().from(purchaseItems)
      .leftJoin(products, eq(purchaseItems.productId, products.id))
      .where(eq(purchaseItems.purchaseId, purchaseId));
  }

  // Credit Payments
  async getCreditPayments(customerId?: number): Promise<CreditPayment[]> {
    let query = db.select().from(creditPayments)
      .leftJoin(customers, eq(creditPayments.customerId, customers.id))
      .leftJoin(sales, eq(creditPayments.saleId, sales.id));

    if (customerId) {
      query = query.where(eq(creditPayments.customerId, customerId));
    }

    return await query.orderBy(desc(creditPayments.paymentDate));
  }

  async createCreditPayment(payment: InsertCreditPayment): Promise<CreditPayment> {
    return await db.transaction(async (tx) => {
      // Create payment
      const [newPayment] = await tx.insert(creditPayments).values(payment).returning();
      
      // Update customer debt
      await tx.update(customers)
        .set({ totalDebt: sql`${customers.totalDebt} - ${payment.amount}` })
        .where(eq(customers.id, payment.customerId));
      
      // Update sale remaining amount
      await tx.update(sales)
        .set({ 
          paidAmount: sql`${sales.paidAmount} + ${payment.amount}`,
          remainingAmount: sql`${sales.remainingAmount} - ${payment.amount}`
        })
        .where(eq(sales.id, payment.saleId));
      
      return newPayment;
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    const todaySales = await this.getTodaySales();
    
    const [inventoryStats] = await db.select({
      totalValue: sum(sql`${products.stock} * ${products.costPrice}`),
      totalProducts: count(products.id),
      lowStockCount: count(sql`case when ${products.stock} <= ${products.minStock} then 1 end`),
    }).from(products);

    const [debtStats] = await db.select({
      totalDebt: sum(customers.totalDebt),
    }).from(customers);

    return {
      todaySales: todaySales.total,
      todayOrders: todaySales.count,
      inventoryValue: inventoryStats.totalValue || "0.00",
      totalProducts: inventoryStats.totalProducts || 0,
      lowStockCount: inventoryStats.lowStockCount || 0,
      totalDebt: debtStats.totalDebt || "0.00",
    };
  }
}

export const storage = new DatabaseStorage();
