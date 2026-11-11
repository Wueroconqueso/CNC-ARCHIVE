const STORAGE_KEY = "cnc_archive_name";

export function getActiveName() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setActiveName(name) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // localStorage unavailable (private browsing, etc.) -- name just won't
    // persist across reloads, which is a degraded experience, not a crash.
  }
}
