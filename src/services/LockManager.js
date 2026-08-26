/**
 * CollabWrite - Lock Manager Service
 * Manages 2-Phase Locking (2PL), section reservations, and deadlock prevention.
 */

const DeadlockDetector = require('./DeadlockDetector');

class LockManager {
  constructor(options = {}) {
    this.lockTimeoutMs = options.lockTimeoutMs || 30000;
    this.locks = new Map(); // sectionKey -> { ownerId, lockToken, expiresAt, lockType }
    this.detector = new DeadlockDetector();
  }

  /**
   * Generates a composite key for document sections.
   */
  _getKey(documentId, sectionId = 'doc') {
    return `${documentId}:${sectionId}`;
  }

  /**
   * Attempts to acquire an exclusive write lock.
   * @param {number|string} documentId
   * @param {number|string} sectionId
   * @param {number|string} userId
   * @returns {{ success: boolean, lockToken?: string, reason?: string }}
   */
  acquireLock(documentId, sectionId, userId) {
    this.cleanupExpiredLocks();
    const key = this._getKey(documentId, sectionId);
    const existing = this.locks.get(key);

    if (!existing) {
      const lockToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + this.lockTimeoutMs;

      this.locks.set(key, {
        ownerId: userId,
        lockToken,
        expiresAt,
        lockType: 'write'
      });

      return { success: true, lockToken, expiresAt };
    }

    if (existing.ownerId === userId) {
      // Re-entrant renewal
      existing.expiresAt = Date.now() + this.lockTimeoutMs;
      return { success: true, lockToken: existing.lockToken, expiresAt: existing.expiresAt };
    }

    // Contention: Check for deadlock cycle
    this.detector.addEdge(userId, existing.ownerId);

    if (this.detector.detectCycle(userId)) {
      // Abort edge to prevent permanent stall
      this.detector.removeEdge(userId, existing.ownerId);
      return { success: false, reason: 'deadlock_detected' };
    }

    return { success: false, reason: 'locked_by_other_user', heldBy: existing.ownerId };
  }

  /**
   * Releases an acquired lock.
   */
  releaseLock(documentId, sectionId, lockToken) {
    const key = this._getKey(documentId, sectionId);
    const existing = this.locks.get(key);

    if (existing && existing.lockToken === lockToken) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Purges all expired locks from memory.
   */
  cleanupExpiredLocks() {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (lock.expiresAt <= now) {
        this.locks.delete(key);
      }
    }
  }
}

module.exports = LockManager;
