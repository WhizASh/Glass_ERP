// In-memory mock store providing Prisma-compatible interface for Glass ERP
const crypto = require("crypto");
const {
  initialCustomers,
  initialSuppliers,
  initialInventory,
  initialPurchaseOrders,
  initialQuotations,
  initialStockMovements
} = require("./initialData");

// Helper to deep clone objects
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Generate unique id
function generateId(prefix = "id") {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

class MockCollection {
  constructor(name, initialRecords = []) {
    this.name = name;
    this.records = clone(initialRecords);
  }

  // Matches a record against Prisma-style where clause
  matchesWhere(record, where = {}) {
    if (!where || Object.keys(where).length === 0) return true;

    for (const [key, value] of Object.entries(where)) {
      if (key === "OR" && Array.isArray(value)) {
        const matchesAny = value.some((subWhere) => this.matchesWhere(record, subWhere));
        if (!matchesAny) return false;
        continue;
      }

      if (key === "AND" && Array.isArray(value)) {
        const matchesAll = value.every((subWhere) => this.matchesWhere(record, subWhere));
        if (!matchesAll) return false;
        continue;
      }

      const recordVal = record[key];

      if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        if ("equals" in value && recordVal !== value.equals) return false;
        if ("contains" in value) {
          const needle = String(value.contains).toLowerCase();
          const hay = String(recordVal || "").toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if ("mode" in value && value.mode === "insensitive" && "contains" in value) {
          const needle = String(value.contains).toLowerCase();
          const hay = String(recordVal || "").toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if ("in" in value && Array.isArray(value.in) && !value.in.includes(recordVal)) return false;
        if ("notIn" in value && Array.isArray(value.notIn) && value.notIn.includes(recordVal)) return false;
        if ("lt" in value && !(recordVal < value.lt)) return false;
        if ("lte" in value && !(recordVal <= value.lte)) return false;
        if ("gt" in value && !(recordVal > value.gt)) return false;
        if ("gte" in value && !(recordVal >= value.gte)) return false;
      } else {
        if (recordVal !== value) return false;
      }
    }
    return true;
  }

  async findMany(args = {}) {
    let result = this.records.filter((r) => this.matchesWhere(r, args.where));

    // Sorting
    if (args.orderBy) {
      const orderKeys = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
      result.sort((a, b) => {
        for (const order of orderKeys) {
          for (const [col, direction] of Object.entries(order)) {
            const valA = a[col];
            const valB = b[col];
            const dir = String(direction).toLowerCase() === "desc" ? -1 : 1;
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
          }
        }
        return 0;
      });
    }

    // Pagination
    if (typeof args.skip === "number") {
      result = result.slice(args.skip);
    }
    if (typeof args.take === "number") {
      result = result.slice(0, args.take);
    }

    const clonedResult = clone(result);

    // Relation inclusion
    if (args.include && this.includeRelations) {
      for (const item of clonedResult) {
        await this.includeRelations(item, args.include);
      }
    }

    return clonedResult;
  }

  async findUnique(args = {}) {
    const record = this.records.find((r) => this.matchesWhere(r, args.where));
    if (!record) return null;
    const cloned = clone(record);
    if (args.include && this.includeRelations) {
      await this.includeRelations(cloned, args.include);
    }
    return cloned;
  }

  async findFirst(args = {}) {
    const records = await this.findMany({ ...args, take: 1 });
    return records.length > 0 ? records[0] : null;
  }

  async create(args = {}) {
    const now = new Date().toISOString();
    const newRecord = {
      id: args.data.id || generateId(this.name.slice(0, 4)),
      createdAt: now,
      updatedAt: now,
      ...clone(args.data)
    };

    // If data contains nested writes (like items: { create: [...] })
    if (this.handleNestedCreate) {
      await this.handleNestedCreate(newRecord, args.data);
    }

    this.records.push(newRecord);

    const cloned = clone(newRecord);
    if (args.include && this.includeRelations) {
      await this.includeRelations(cloned, args.include);
    }
    return cloned;
  }

  async update(args = {}) {
    const index = this.records.findIndex((r) => this.matchesWhere(r, args.where));
    if (index === -1) {
      const err = new Error(`Record to update not found in ${this.name}`);
      err.code = "P2025";
      throw err;
    }

    const now = new Date().toISOString();
    const updated = {
      ...this.records[index],
      ...clone(args.data),
      updatedAt: now
    };

    // If update contains numeric operations like { increment: 5 }
    for (const [key, val] of Object.entries(args.data || {})) {
      if (val && typeof val === "object" && "increment" in val) {
        updated[key] = (this.records[index][key] || 0) + val.increment;
      } else if (val && typeof val === "object" && "decrement" in val) {
        updated[key] = (this.records[index][key] || 0) - val.decrement;
      }
    }

    this.records[index] = updated;

    const cloned = clone(updated);
    if (args.include && this.includeRelations) {
      await this.includeRelations(cloned, args.include);
    }
    return cloned;
  }

  async delete(args = {}) {
    const index = this.records.findIndex((r) => this.matchesWhere(r, args.where));
    if (index === -1) {
      const err = new Error(`Record to delete not found in ${this.name}`);
      err.code = "P2025";
      throw err;
    }
    const [removed] = this.records.splice(index, 1);
    return clone(removed);
  }

  async deleteMany(args = {}) {
    const beforeCount = this.records.length;
    this.records = this.records.filter((r) => !this.matchesWhere(r, args.where));
    return { count: beforeCount - this.records.length };
  }

  async createMany(args = {}) {
    const items = Array.isArray(args.data) ? args.data : [args.data];
    const created = [];
    for (const item of items) {
      created.push(await this.create({ data: item }));
    }
    return { count: created.length };
  }

  async count(args = {}) {
    const matched = this.records.filter((r) => this.matchesWhere(r, args.where));
    return matched.length;
  }

  async aggregate(args = {}) {
    const matched = this.records.filter((r) => this.matchesWhere(r, args.where));
    const result = {};

    if (args._sum) {
      result._sum = {};
      for (const field of Object.keys(args._sum)) {
        result._sum[field] = matched.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
      }
    }

    if (args._count) {
      result._count = matched.length;
    }

    return result;
  }
}

class MockStore {
  constructor() {
    this.customer = new MockCollection("customer", initialCustomers);
    this.supplier = new MockCollection("supplier", initialSuppliers);
    this.inventoryItem = new MockCollection("inventoryItem", initialInventory);
    this.purchaseOrder = new MockCollection("purchaseOrder", initialPurchaseOrders);
    this.quotation = new MockCollection("quotation", initialQuotations);
    this.stockMovement = new MockCollection("stockMovement", initialStockMovements);

    // Separate collection for purchaseOrderItems and quotationItems
    const poiRecords = [];
    initialPurchaseOrders.forEach((po) => {
      if (po.items) {
        po.items.forEach((item) => poiRecords.push(clone(item)));
      }
    });
    this.purchaseOrderItem = new MockCollection("purchaseOrderItem", poiRecords);

    const qiRecords = [];
    initialQuotations.forEach((q) => {
      if (q.items) {
        q.items.forEach((item) => qiRecords.push(clone(item)));
      }
    });
    this.quotationItem = new MockCollection("quotationItem", qiRecords);

    this.setupRelationHandlers();
  }

  setupRelationHandlers() {
    // Customer relations
    this.customer.includeRelations = async (record, include) => {
      if (include.quotations) {
        record.quotations = await this.quotation.findMany({
          where: { customerId: record.id },
          include: typeof include.quotations === "object" ? include.quotations.include : undefined
        });
      }
    };

    // Supplier relations
    this.supplier.includeRelations = async (record, include) => {
      if (include.purchaseOrders) {
        record.purchaseOrders = await this.purchaseOrder.findMany({
          where: { supplierId: record.id },
          include: typeof include.purchaseOrders === "object" ? include.purchaseOrders.include : undefined
        });
      }
    };

    // InventoryItem relations
    this.inventoryItem.includeRelations = async (record, include) => {
      if (include.movements) {
        record.movements = await this.stockMovement.findMany({
          where: { itemId: record.id }
        });
      }
      if (include.purchaseItems) {
        record.purchaseItems = await this.purchaseOrderItem.findMany({
          where: { itemId: record.id }
        });
      }
      if (include.quotationItems) {
        record.quotationItems = await this.quotationItem.findMany({
          where: { itemId: record.id }
        });
      }
    };

    // PurchaseOrder relations & nested creates
    this.purchaseOrder.includeRelations = async (record, include) => {
      if (include.supplier) {
        record.supplier = await this.supplier.findUnique({
          where: { id: record.supplierId }
        });
      }
      if (include.items) {
        record.items = await this.purchaseOrderItem.findMany({
          where: { purchaseOrderId: record.id },
          include: typeof include.items === "object" ? include.items.include : undefined
        });
      }
    };

    this.purchaseOrder.handleNestedCreate = async (record, data) => {
      if (data.items && data.items.create) {
        const itemsToCreate = Array.isArray(data.items.create) ? data.items.create : [data.items.create];
        const createdItems = [];
        for (const itemData of itemsToCreate) {
          const created = await this.purchaseOrderItem.create({
            data: {
              ...itemData,
              purchaseOrderId: record.id
            }
          });
          createdItems.push(created);
        }
        delete record.items; // Clean up so it matches relations
      }
    };

    this.purchaseOrderItem.includeRelations = async (record, include) => {
      if (include.item) {
        record.item = await this.inventoryItem.findUnique({
          where: { id: record.itemId }
        });
      }
      if (include.purchaseOrder) {
        record.purchaseOrder = await this.purchaseOrder.findUnique({
          where: { id: record.purchaseOrderId }
        });
      }
    };

    // Quotation relations & nested creates
    this.quotation.includeRelations = async (record, include) => {
      if (include.customer) {
        record.customer = await this.customer.findUnique({
          where: { id: record.customerId }
        });
      }
      if (include.items) {
        record.items = await this.quotationItem.findMany({
          where: { quotationId: record.id },
          include: typeof include.items === "object" ? include.items.include : undefined
        });
      }
    };

    this.quotation.handleNestedCreate = async (record, data) => {
      if (data.items && data.items.create) {
        const itemsToCreate = Array.isArray(data.items.create) ? data.items.create : [data.items.create];
        const createdItems = [];
        for (const itemData of itemsToCreate) {
          const created = await this.quotationItem.create({
            data: {
              ...itemData,
              quotationId: record.id
            }
          });
          createdItems.push(created);
        }
        delete record.items;
      }
    };

    this.quotationItem.includeRelations = async (record, include) => {
      if (include.item) {
        record.item = record.itemId
          ? await this.inventoryItem.findUnique({ where: { id: record.itemId } })
          : null;
      }
      if (include.quotation) {
        record.quotation = await this.quotation.findUnique({
          where: { id: record.quotationId }
        });
      }
    };

    // StockMovement relations
    this.stockMovement.includeRelations = async (record, include) => {
      if (include.item) {
        record.item = await this.inventoryItem.findUnique({
          where: { id: record.itemId }
        });
      }
    };
  }

  async $transaction(fnOrArray) {
    if (typeof fnOrArray === "function") {
      return fnOrArray(this);
    }
    if (Array.isArray(fnOrArray)) {
      return Promise.all(fnOrArray);
    }
    return null;
  }

  async $connect() {
    return true;
  }

  async $disconnect() {
    return true;
  }
}

module.exports = {
  MockStore,
  generateId
};
