// Supplier Controller
const { db } = require("../config/db");

async function getSuppliers(req, res, next) {
  try {
    const { q } = req.query;
    let where = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { contactPerson: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ];
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
}

async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          include: { items: true }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

async function createSupplier(req, res, next) {
  try {
    const { name, contactPerson, email, phone, taxId, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Supplier name and phone number are required."
      });
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone,
        taxId: taxId || null,
        address: address || null
      }
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, taxId, address } = req.body;

    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    const updated = await db.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(taxId !== undefined && { taxId }),
        ...(address !== undefined && { address })
      }
    });

    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    await db.supplier.delete({ where: { id } });
    res.json({
      success: true,
      message: "Supplier deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
