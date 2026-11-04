// Jake S - history page storage helper
const STORAGE_KEY = 'phishingHistory';
const MAX_ENTRIES = 100;

//get JSON if it exists
export function getHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return[];
    }
}

//adds result to history
export function addToHistory(result) {
    const entry = {
        id: Date.now(), //use time as ID so everything is unique
        checkedAt: new Date().toISOString(),
        result,
    };
 const updated = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // storage full or blocked - add delete oldest here
  }
}


//remove an item from history
export function removeFromHistory(id) {
  const updated = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}


//remove all from history
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}