/**
 * CollabWrite - Client API helpers (Phase 1)
 *
 * A thin fetch wrapper plus the text-difference routine that turns what the
 * user typed into the insert and delete operations the engine understands.
 */

const BASE = import.meta.env.VITE_API_URL || '';

/**
 * Performs an authenticated API call.
 *
 * @param {string} pathname
 * @param {object} [options]
 * @param {string} [options.token]
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @returns {Promise<any>}
 * @throws {Error} Carrying `code` and, for a conflict, `currentVersion`.
 */
export async function api(pathname, { token = null, method = 'GET', body = null } = {}) {
  const response = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.error || {};
    const error = new Error(detail.message || `Request failed with ${response.status}`);
    error.code = detail.code;
    error.status = response.status;
    error.currentVersion = detail.currentVersion;
    error.retryable = detail.retryable;
    throw error;
  }
  return payload;
}

/**
 * Derives edit operations from a before and after snapshot of the text.
 *
 * The common prefix and suffix are skipped, so the changed region is the only
 * thing described. A replacement becomes a delete followed by an insert at
 * the same position, which is exactly the pair the engine's conflict resolver
 * reasons about.
 *
 * @param {string} before
 * @param {string} after
 * @returns {Array<{type:'insert'|'delete', position:number, content?:string, length?:number}>}
 */
export function diffToOperations(before, after) {
  if (before === after) return [];

  let start = 0;
  const shortest = Math.min(before.length, after.length);
  while (start < shortest && before[start] === after[start]) start += 1;

  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore -= 1;
    endAfter -= 1;
  }

  const operations = [];
  if (endBefore > start) operations.push({ type: 'delete', position: start, length: endBefore - start });
  if (endAfter > start) operations.push({ type: 'insert', position: start, content: after.slice(start, endAfter) });
  return operations;
}

/**
 * Applies one operation to a string. Mirrors ConflictResolver.applyOperation
 * on the server so that a remote edit can be applied locally without a
 * refetch when it arrives in order.
 *
 * @param {string} text
 * @param {object} operation
 * @returns {string}
 */
export function applyOperation(text, operation) {
  const base = text || '';
  if (!operation || !operation.type) return base;

  if (operation.type === 'insert') {
    const position = Math.max(0, Math.min(operation.position, base.length));
    return base.slice(0, position) + (operation.content || '') + base.slice(position);
  }
  if (operation.type === 'delete') {
    const position = Math.max(0, Math.min(operation.position, base.length));
    return base.slice(0, position) + base.slice(position + (operation.length || 0));
  }
  return base;
}
