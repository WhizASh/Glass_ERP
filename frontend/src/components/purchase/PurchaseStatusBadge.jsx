import React from 'react';
import Badge from '../common/Badge';

export default function PurchaseStatusBadge({ status }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success" dot size="sm">Received / Stored</Badge>;
    case 'CONFIRMED':
    case 'ISSUED':
      return <Badge variant="primary" dot size="sm">In Transit</Badge>;
    case 'DRAFT':
      return <Badge variant="warning" dot size="sm">Draft PO</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger" size="sm">Cancelled</Badge>;
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
}
