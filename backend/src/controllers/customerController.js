// Customer Controller
const { db } = require("../config/db");

async function getCustomers(req, res, next) {
  try {
    const { q, type } = req.query;
    let where = {};

    if (type) {
      where.type = type.toUpperCase();
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ];
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        quotations: {
          take: 5,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          orderBy: { createdAt: "desc" },
          include: { items: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

async function createCustomer(req, res, next) {
  try {
    const {
      type = "INDIVIDUAL",
      name,
      companyName,
      gstin,
      email,
      phone,
      billingAddress,
      shippingAddress
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone number are required."
      });
    }

    const customer = await db.customer.create({
      data: {
        type: type === "ORGANIZATION" ? "ORGANIZATION" : "INDIVIDUAL",
        name,
        companyName: type === "ORGANIZATION" ? companyName : null,
        gstin: type === "ORGANIZATION" ? gstin : null,
        email: email || null,
        phone,
        billingAddress: billingAddress || null,
        shippingAddress: shippingAddress || null
      }
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const {
      type,
      name,
      companyName,
      gstin,
      email,
      phone,
      billingAddress,
      shippingAddress
    } = req.body;

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const updated = await db.customer.update({
      where: { id },
      data: {
        ...(type !== undefined && { type: type === "ORGANIZATION" ? "ORGANIZATION" : "INDIVIDUAL" }),
        ...(name !== undefined && { name }),
        ...(companyName !== undefined && { companyName }),
        ...(gstin !== undefined && { gstin }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(shippingAddress !== undefined && { shippingAddress })
      }
    });

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    await db.customer.delete({ where: { id } });
    res.json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
