// =============================================================================
// API SERVICE LAYER - src/services/api.js
// =============================================================================
// Connects React dashboard → FastAPI backend → MySQL database
// Backend: http://127.0.0.1:8000
// =============================================================================

const API_BASE_URL = "http://127.0.0.1:8000/api";

// =============================================================================
// GET ALL STUDENTS
// =============================================================================

export async function getAllStudents() {
  const response = await fetch(`${API_BASE_URL}/students`);

  if (!response.ok) {
    throw new Error(`Failed to fetch students: HTTP ${response.status}`);
  }

  return await response.json();
}

// Keep this alias if any existing frontend component uses getStudents()
export async function getStudents() {
  return await getAllStudents();
}

// =============================================================================
// GET ONE STUDENT
// =============================================================================

export async function getStudent(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch student: HTTP ${response.status}`);
  }

  return await response.json();
}

// =============================================================================
// ADD STUDENT
// =============================================================================

export async function addStudent(data) {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to add student: HTTP ${response.status} ${errorText}`
    );
  }

  return await response.json();
}

// =============================================================================
// UPDATE STUDENT
// =============================================================================

export async function updateStudent(id, data) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update student: HTTP ${response.status} ${errorText}`
    );
  }

  return await response.json();
}

// =============================================================================
// DELETE STUDENT
// =============================================================================

export async function deleteStudent(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to delete student: HTTP ${response.status} ${errorText}`
    );
  }

  return await response.json();
}

// =============================================================================
// GET ANALYTICS
// =============================================================================

export async function getAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics`);

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: HTTP ${response.status}`);
  }

  return await response.json();
}

// =============================================================================
// GET DATABASE ACTIVITY
// =============================================================================
// Use this only if your FastAPI backend has /api/activity.
// Currently your backend code does NOT have this endpoint.
// =============================================================================

export async function getActivity() {
  const response = await fetch(`${API_BASE_URL}/activity`);

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp),
  }));
}

// =============================================================================
// BACKEND / DATABASE HEALTH CHECK
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