-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeCode" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40),
    "address" VARCHAR(500),
    "joinedOn" DATE NOT NULL,
    "leftOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_salaries" (
    "employeeId" TEXT NOT NULL,
    "effectiveOn" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "employee_salaries_pkey" PRIMARY KEY ("employeeId","effectiveOn")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "month" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("month")
);

-- CreateTable
CREATE TABLE "payroll_entries" (
    "month" VARCHAR(7) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeCode" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "eligibleDays" INTEGER NOT NULL,
    "unpaidDays" INTEGER NOT NULL,
    "paidDays" INTEGER NOT NULL,
    "basePay" DECIMAL(12,2) NOT NULL,
    "additions" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL,
    "grossPay" DECIMAL(13,2) NOT NULL,
    "netPay" DECIMAL(13,2) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("month","employeeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE INDEX "payroll_entries_employeeId_idx" ON "payroll_entries"("employeeId");

-- AddForeignKey
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_month_fkey" FOREIGN KEY ("month") REFERENCES "payroll_runs"("month") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep employee information private if these tables are exposed by a database REST API.
-- The ERP accesses the tables through Prisma using the database owner.
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_salaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_entries" ENABLE ROW LEVEL SECURITY;
