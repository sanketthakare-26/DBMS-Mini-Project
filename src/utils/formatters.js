// Utility functions for Customer Analytics
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

export function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

export function getRiskColor(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
}
