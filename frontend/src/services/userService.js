// MongoDB
const MONGO_API = "http://localhost:3001/api/v2/users";

// Supabase
const SUPABASE_API = "http://localhost:3001/api/v2/users/pg";

async function handleResponse(response, fallbackError) {
  if (!response.ok) {
    let errorMsg = fallbackError;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMsg = errorData.message;
      } else if (errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // response was not json
    }
    throw new Error(errorMsg);
  }
  return response.json();
}


// MongoDB CRUD


export async function getMongoUsers() {
  const response = await fetch(MONGO_API);
  return handleResponse(response, "Failed to fetch MongoDB users");
}

export async function createMongoUser(user) {
  const response = await fetch(MONGO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return handleResponse(response, "Failed to create MongoDB user");
}

export async function updateMongoUser(id, user) {
  const response = await fetch(`${MONGO_API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return handleResponse(response, "Failed to update MongoDB user");
}

export async function deleteMongoUser(id) {
  const response = await fetch(`${MONGO_API}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response, "Failed to delete MongoDB user");
}


// Supabase CRUD


export async function getSupabaseUsers() {
  const response = await fetch(SUPABASE_API);
  return handleResponse(response, "Failed to fetch Supabase users");
}

export async function createSupabaseUser(user) {
  const response = await fetch(SUPABASE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return handleResponse(response, "Failed to create Supabase user");
}

export async function updateSupabaseUser(id, user) {
  const response = await fetch(`${SUPABASE_API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return handleResponse(response, "Failed to update Supabase user");
}

export async function deleteSupabaseUser(id) {
  const response = await fetch(`${SUPABASE_API}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response, "Failed to delete Supabase user");
}