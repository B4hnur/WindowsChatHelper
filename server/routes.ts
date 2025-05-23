import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCategorySchema, insertSupplierSchema, insertCustomerSchema,
  insertProductSchema, insertSaleSchema, insertPurchaseSchema,
  insertCreditPaymentSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) return res.sendStatus(404);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deleteCategory(id);
    if (!success) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      if (!supplier) return res.sendStatus(404);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deleteSupplier(id);
    if (!success) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) return res.sendStatus(404);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deleteCustomer(id);
    if (!success) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // Products
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { search } = req.query;
    let products;
    
    if (search && typeof search === 'string') {
      products = await storage.searchProducts(search);
    } else {
      products = await storage.getProducts();
    }
    
    res.json(products);
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const product = await storage.getProductByBarcode(req.params.barcode);
    if (!product) return res.sendStatus(404);
    res.json(product);
  });

  app.get("/api/products/low-stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const products = await storage.getLowStockProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) return res.sendStatus(404);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deleteProduct(id);
    if (!success) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.get("/api/sales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const sale = await storage.getSale(id);
    if (!sale) return res.sendStatus(404);
    const items = await storage.getSaleItems(id);
    res.json({ ...sale, items });
  });

  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { sale: saleData, items } = req.body;
      const saleSchema = insertSaleSchema.extend({
        saleNumber: z.string().optional()
      });
      
      // Generate sale number if not provided
      if (!saleData.saleNumber) {
        const timestamp = Date.now();
        saleData.saleNumber = `SAL${timestamp}`;
      }
      
      const validatedSale = saleSchema.parse({
        ...saleData,
        userId: req.user!.id
      });
      
      const sale = await storage.createSale(validatedSale, items);
      res.status(201).json(sale);
    } catch (error) {
      res.status(400).json({ error: "Invalid sale data" });
    }
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.post("/api/purchases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { purchase: purchaseData, items } = req.body;
      const purchaseSchema = insertPurchaseSchema.extend({
        purchaseNumber: z.string().optional()
      });
      
      // Generate purchase number if not provided
      if (!purchaseData.purchaseNumber) {
        const timestamp = Date.now();
        purchaseData.purchaseNumber = `PUR${timestamp}`;
      }
      
      const validatedPurchase = purchaseSchema.parse({
        ...purchaseData,
        userId: req.user!.id
      });
      
      const purchase = await storage.createPurchase(validatedPurchase, items);
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  // Credit Payments
  app.get("/api/credit-payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { customerId } = req.query;
    const payments = await storage.getCreditPayments(
      customerId ? parseInt(customerId as string) : undefined
    );
    res.json(payments);
  });

  app.post("/api/credit-payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const paymentData = insertCreditPaymentSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const payment = await storage.createCreditPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Sales Stats
  app.get("/api/sales/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { startDate, endDate } = req.query;
    const stats = await storage.getSalesStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(stats);
  });

  // Store Settings
  app.get("/api/store-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const settings = await storage.getStoreSettings();
    res.json(settings);
  });

  app.put("/api/store-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updatedSettings = await storage.updateStoreSettings(req.body);
    res.json(updatedSettings);
  });

  const httpServer = createServer(app);
  return httpServer;
}
