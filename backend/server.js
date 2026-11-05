// HTTP Server Entry Point
require("dotenv").config();
const app = require("./src/app");
const { verifyDbConnection, prisma, isUsingMock } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log("--------------------------------------------------");
  console.log("🏭 Starting Glass Production Facility ERP Backend...");
  console.log("--------------------------------------------------");

  // Check database connectivity
  await verifyDbConnection();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📊 Mode: ${isUsingMock() ? "In-Memory Mock Store (No PostgreSQL required)" : "Connected to PostgreSQL"}`);
    console.log("--------------------------------------------------");
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Gracefully shutting down server...");
    server.close(async () => {
      try {
        await prisma.$disconnect();
      } catch (_) {}
      console.log("👋 Server stopped.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("❌ Fatal error starting server:", err);
  process.exit(1);
});
