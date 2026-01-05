import { API_BASE } from "./constants.js";

export async function fetchResorts() {
  try {
    const res = await fetch(`${API_BASE}/resorts`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Fetch resorts failed:", err);
    return [];
  }
}

export async function fetchResort(resort) {
  try {
    const res = await fetch(`${API_BASE}/lifts/${resort}`);
    const json = await res.json();

    if (json.error) {
      return {
        name: resort,
        status: "unavailable",
        note: json.error,
      };
    }

    return {
      ...json,
      status: "ok",
    };
  } catch (err) {
    return {
      name: resort,
      status: "unavailable",
      note: "Netzwerkfehler",
    };
  }
}
