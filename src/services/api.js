// =============================================================================
// API SERVICE LAYER - src/services/api.js
// Connects React Frontend → FastAPI Backend → MySQL Database (churn_prediction)
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// Helper for standardized error handling - NO MOCK FALLBACK
async function handleResponse(response, errorMessage) {
  if (!response.ok) {
    let detail = "";
    try {
      const errJson = await response.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = await response.text();
    }
    throw new Error(`${errorMessage} (HTTP ${response.status}): ${detail}`);
  }
  return await response.json();
}

// =============================================================================
// 1. CUSTOMERS CRUD
// =============================================================================

export async function getCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/customers${query ? `?${query}` : ""}`;
  const response = await fetch(url);
  return await handleResponse(response, "Failed to fetch customers");
}

export async function getCustomer(customerId) {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}`);
  return await handleResponse(response, `Failed to fetch customer ${customerId}`);
}

export async function getCustomerProfile(customerId) {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}/profile`);
  return await handleResponse(response, `Failed to fetch customer profile ${customerId}`);
}

export async function addCustomer(data) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await handleResponse(response, "Failed to add customer");
}

export async function updateCustomer(customerId, data) {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await handleResponse(response, `Failed to update customer ${customerId}`);
}

export async function deleteCustomer(customerId) {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
    method: "DELETE",
  });
  return await handleResponse(response, `Failed to delete customer ${customerId}`);
}

// Backward compatibility aliases for existing UI components
export async function getAllStudents() {
  return await getCustomers();
}
export async function getStudents() {
  return await getCustomers();
}
export async function getStudent(id) {
  return await getCustomer(id);
}
export async function addStudent(data) {
  return await addCustomer(data);
}
export async function updateStudent(id, data) {
  return await updateCustomer(id, data);
}
export async function deleteStudent(id) {
  return await deleteCustomer(id);
}

// =============================================================================
// 2. SUBSCRIPTIONS, USAGE, PAYMENTS, COMPLAINTS
// =============================================================================

export async function getSubscriptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/subscriptions${query ? `?${query}` : ""}`);
  return await handleResponse(response, "Failed to fetch subscriptions");
}

export async function getUsage(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/usage${query ? `?${query}` : ""}`);
  return await handleResponse(response, "Failed to fetch usage metrics");
}

export async function getPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/payments${query ? `?${query}` : ""}`);
  return await handleResponse(response, "Failed to fetch payments");
}

export async function getComplaints(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/complaints${query ? `?${query}` : ""}`);
  return await handleResponse(response, "Failed to fetch complaints");
}

// =============================================================================
// 3. ANALYTICS (SQL VIEWS & AGGREGATIONS)
// =============================================================================

export async function getAnalyticsOverview() {
  const response = await fetch(`${API_BASE_URL}/analytics/overview`);
  return await handleResponse(response, "Failed to fetch overview analytics");
}

export async function getChurnAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics/churn`);
  return await handleResponse(response, "Failed to fetch churn analytics");
}

export async function getSubscriptionAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics/subscriptions`);
  return await handleResponse(response, "Failed to fetch subscription summary");
}

export async function getPaymentAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics/payments`);
  return await handleResponse(response, "Failed to fetch payment summary");
}

export async function getComplaintAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics/complaints`);
  return await handleResponse(response, "Failed to fetch complaint summary");
}

// Legacy alias mapping
export async function getAnalytics() {
  return await getAnalyticsOverview();
}

// =============================================================================
// 4. PREDICTIONS
// =============================================================================

export async function getPredictions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/predictions${query ? `?${query}` : ""}`);
  return await handleResponse(response, "Failed to fetch predictions");
}

export async function getCustomerPredictions(customerId) {
  const response = await fetch(`${API_BASE_URL}/predictions/${customerId}`);
  return await handleResponse(response, `Failed to fetch prediction history for customer ${customerId}`);
}

export async function getHighRiskPredictions() {
  const response = await fetch(`${API_BASE_URL}/predictions/high-risk`);
  return await handleResponse(response, "Failed to fetch high-risk predictions");
}

export async function predictChurn(data) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await handleResponse(response, "Failed to predict churn");
}

export async function runAllPredictions() {
  const response = await fetch(`${API_BASE_URL}/predictions/run-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return await handleResponse(response, "Failed to run batch predictions");
}

export async function getModelInfo() {
  const response = await fetch(`${API_BASE_URL}/model/info`);
  return await handleResponse(response, "Failed to fetch model info");
}

export async function getFeatureImportance() {
  const response = await fetch(`${API_BASE_URL}/model/feature-importance`);
  return await handleResponse(response, "Failed to fetch feature importance");
}

// =============================================================================
// 5. DATABASE ACTIVITY AUDIT LOG (FROM TRIGGERS)
// =============================================================================

export async function getActivity(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/activity?limit=${limit}`);
  const data = await handleResponse(response, "Failed to fetch activity logs");

  return data.map((item) => ({
    ...item,
    timestamp: new Date(item.created_at || item.timestamp),
  }));
}

// =============================================================================
// 6. BACKEND HEALTH & DATABASE TEST
// =============================================================================

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/test-db`);
    if (!response.ok) {
      return {
        connected: false,
        error: `HTTP ${response.status}`,
      };
    }
    const data = await response.json();
    return {
      connected: true,
      ...data,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}