// Database configuration with transparent Prisma / In-memory Mock fallback
const { PrismaClient } = require("@prisma/client");
const { MockStore } = require("./mockStore");

let isUsingMockStore = process.env.USE_MOCK_DB === "true";
let mockStoreInstance = null;
let prismaInstance = null;
let hasLoggedFallback = false;

function getMockStore() {
  if (!mockStoreInstance) {
    mockStoreInstance = new MockStore();
  }
  return mockStoreInstance;
}

try {
  prismaInstance = new PrismaClient({
    log: ["error"]
  });
} catch (err) {
  console.warn("⚠️ Failed to initialize PrismaClient, falling back to mock store:", err.message);
  isUsingMockStore = true;
}

function handlePrismaErrorAndFallback(err) {
  const isConnError =
    err.name === "PrismaClientInitializationError" ||
    (err.message && (err.message.includes("Can't reach database server") || err.message.includes("ECONNREFUSED"))) ||
    err.code === "P1001";

  if (isConnError) {
    if (!hasLoggedFallback) {
      console.warn("⚠️ PostgreSQL connection unavailable. Automatically switching to in-memory Mock Store.");
      hasLoggedFallback = true;
    }
    isUsingMockStore = true;
    return true;
  }
  return false;
}

// Check database connectivity
async function verifyDbConnection() {
  if (isUsingMockStore || !prismaInstance) {
    isUsingMockStore = true;
    return false;
  }

  try {
    await Promise.race([
      prismaInstance.$connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout after 10000ms")), 10000)
      )
    ]);
    console.log("✅ Successfully connected to PostgreSQL via Prisma!");
    isUsingMockStore = false;
    return true;
  } catch (error) {
    handlePrismaErrorAndFallback(error);
    return false;
  }
}

// Helper to wrap a Prisma model so that any connection error auto-falls back to mock
function createModelProxy(modelName) {
  return new Proxy(
    {},
    {
      get(target, method) {
        return async (...args) => {
          if (isUsingMockStore || !prismaInstance || !prismaInstance[modelName]) {
            const store = getMockStore();
            const collection = store[modelName];
            if (!collection || typeof collection[method] !== "function") {
              throw new Error(`Method ${method} not supported on mock collection ${modelName}`);
            }
            return collection[method](...args);
          }

          try {
            return await prismaInstance[modelName][method](...args);
          } catch (err) {
            if (handlePrismaErrorAndFallback(err)) {
              const store = getMockStore();
              const collection = store[modelName];
              if (collection && typeof collection[method] === "function") {
                return collection[method](...args);
              }
            }
            throw err;
          }
        };
      }
    }
  );
}

const knownModels = [
  "customer",
  "supplier",
  "inventoryItem",
  "purchaseOrder",
  "purchaseOrderItem",
  "quotation",
  "quotationItem",
  "stockMovement"
];

const modelProxies = {};
for (const model of knownModels) {
  modelProxies[model] = createModelProxy(model);
}

// Top-level db proxy
const dbProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === "isUsingMock") {
        return () => isUsingMockStore;
      }
      if (prop === "verifyConnection") {
        return verifyDbConnection;
      }
      if (prop === "getMockStore") {
        return getMockStore;
      }
      if (prop === "prisma") {
        return prismaInstance;
      }
      if (prop === "$transaction") {
        return async (arg) => {
          if (isUsingMockStore || !prismaInstance) {
            return getMockStore().$transaction(arg);
          }
          try {
            return await prismaInstance.$transaction(arg);
          } catch (err) {
            if (handlePrismaErrorAndFallback(err)) {
              return getMockStore().$transaction(arg);
            }
            throw err;
          }
        };
      }
      if (prop === "$connect") {
        return verifyDbConnection;
      }
      if (prop === "$disconnect") {
        return async () => {
          if (prismaInstance) {
            try {
              await prismaInstance.$disconnect();
            } catch (_) {}
          }
        };
      }

      // Check if it's one of the known models
      if (modelProxies[prop]) {
        return modelProxies[prop];
      }

      if (isUsingMockStore) {
        const store = getMockStore();
        return store[prop];
      }

      if (prismaInstance && prop in prismaInstance) {
        return prismaInstance[prop];
      }

      return undefined;
    }
  }
);

module.exports = {
  db: dbProxy,
  prisma: dbProxy,
  verifyDbConnection,
  isUsingMock: () => isUsingMockStore,
  getMockStore
};
