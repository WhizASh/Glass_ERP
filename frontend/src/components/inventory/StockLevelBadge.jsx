import React from 'react';
import Badge from '../common/Badge';

export default function StockLevelBadge({ quantity, reorderLevel = 10, unit = 'Units' }) {
  const qty = Number(quantity) || 0;
  const reorder = Number(reorderLevel) || 10;

  if (qty <= 0) {
    return <Badge variant="danger" dot size="sm">Out of Stock</Badge>;
  }

  if (qty <= reorder) {
    return (
      <Badge variant="warning" dot size="sm">
        Low ({qty} {unit})
      </Badge>
    );
  }

  return (
    <Badge variant="success" size="sm">
      {qty} {unit}
    </Badge>
  );
}
