const { Prisma } = require('@prisma/client');

// In-memory Prisma delegates for testing HTTP behavior and transaction rollback.
function inventoryDatabase() {
  const items = [];
  const purchases = [];
  let sequence = 0;
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(filter => matches(row, filter));
    if (value && typeof value === 'object') {
      if ('contains' in value) return (row[key] || '').toLowerCase().includes(value.contains.toLowerCase());
      if ('gte' in value && new Prisma.Decimal(row[key]).lt(value.gte)) return false;
      if ('lte' in value && new Prisma.Decimal(row[key]).gt(value.lte)) return false;
      return true;
    }
    return row[key] === value;
  });
  const apply = (row, data) => {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'increment' in value) {
        row[key] = key === 'quantity' ? new Prisma.Decimal(row[key]).plus(value.increment) : row[key] + value.increment;
      } else row[key] = value;
    }
    row.updatedAt = new Date();
    return { ...row };
  };
  const missing = () => { throw Object.assign(new Error('Not found'), { code: 'P2025' }); };
  const delegate = (records, inventory) => {
    const shape = (row, include) => row ? { ...row, ...(include?._count ? { _count: { purchases: purchases.filter(p => p.inventoryItemId === row.id).length } } : {}) } : null;
    const unique = data => {
      if (inventory && items.some(row => row.id !== data.id && row.nameKey === data.nameKey && row.unitOfMeasure === data.unitOfMeasure)) {
        throw Object.assign(new Error('Duplicate'), { code: 'P2002' });
      }
    };
    return {
      findUnique: async ({ where, include }) => shape(records.find(row => row.id === where.id), include),
      create: async ({ data }) => {
        if (db.failDatabase) throw new Error('Test database unavailable');
        const row = { ...(inventory ? { quantity: new Prisma.Decimal(0), revision: 0, notes: null } : {}), createdAt: new Date(), updatedAt: new Date(), ...data, id: data.id || String(++sequence) };
        unique(row);
        records.push(row);
        return { ...row };
      },
      update: async ({ where, data }) => {
        const row = records.find(row => matches(row, where));
        if (!row) return missing();
        unique({ ...row, ...data });
        return apply(row, data);
      },
      updateMany: async ({ where, data }) => {
        const rows = records.filter(row => matches(row, where));
        rows.forEach(row => apply(row, data));
        return { count: rows.length };
      },
      delete: async ({ where }) => {
        const index = records.findIndex(row => matches(row, where));
        if (index < 0) return missing();
        return records.splice(index, 1)[0];
      },
      findMany: async ({ where, skip = 0, take = records.length, include, orderBy = [] }) => {
        if (db.failDatabase) throw new Error('Test database unavailable');
        const sorted = records.filter(row => matches(row, where)).slice().sort((a, b) => {
          for (const order of orderBy) {
            const [key, direction] = Object.entries(order)[0];
            const comparison = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
            if (comparison) return direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });
        return sorted.slice(skip, skip + take).map(row => shape(row, include));
      },
      count: async ({ where }) => records.filter(row => matches(row, where)).length
    };
  };
  const db = { items, purchases, failDatabase: false };
  db.inventoryItem = delegate(items, true);
  db.purchase = delegate(purchases, false);
  db.inventoryItem.upsert = async ({ where, create }) => {
    const item = items.find(row => matches(row, where.nameKey_unitOfMeasure));
    return item ? { ...item } : db.inventoryItem.create({ data: create });
  };
  db.$transaction = async operations => {
    if (Array.isArray(operations)) return Promise.all(operations);
    const previousItems = items.map(row => ({ ...row }));
    const previousPurchases = purchases.map(row => ({ ...row }));
    try { return await operations(db); }
    catch (error) {
      items.splice(0, items.length, ...previousItems);
      purchases.splice(0, purchases.length, ...previousPurchases);
      throw error;
    }
  };
  return db;
}

module.exports = { inventoryDatabase };
