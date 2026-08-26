/**
 * CollabWrite - Deadlock Detection Service
 * Builds a dynamic Wait-For Graph and evaluates directed cycles using DFS.
 */

class DeadlockDetector {
  constructor() {
    this.waitForGraph = new Map(); // userId -> Set<userId>
  }

  /**
   * Adds a wait dependency: waitingUser is blocked by holdingUser.
   * @param {number|string} waitingUser
   * @param {number|string} holdingUser
   */
  addEdge(waitingUser, holdingUser) {
    if (waitingUser === holdingUser) return; // Self-lock handled separately

    if (!this.waitForGraph.has(waitingUser)) {
      this.waitForGraph.set(waitingUser, new Set());
    }
    this.waitForGraph.get(waitingUser).add(holdingUser);
  }

  /**
   * Removes a wait dependency once lock is released or request aborted.
   * @param {number|string} waitingUser
   * @param {number|string} holdingUser
   */
  removeEdge(waitingUser, holdingUser) {
    if (this.waitForGraph.has(waitingUser)) {
      this.waitForGraph.get(waitingUser).delete(holdingUser);
      if (this.waitForGraph.get(waitingUser).size === 0) {
        this.waitForGraph.delete(waitingUser);
      }
    }
  }

  /**
   * Checks if starting a traversal at `startUser` encounters a cycle.
   * @param {number|string} startUser
   * @returns {boolean} True if cycle is found
   */
  detectCycle(startUser) {
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (node) => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = this.waitForGraph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(node);
      return false;
    };

    return dfs(startUser);
  }

  /**
   * Scans all active nodes in the graph for any circular dependencies.
   * @returns {boolean}
   */
  hasAnyDeadlock() {
    for (const node of this.waitForGraph.keys()) {
      if (this.detectCycle(node)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resets all graph edges.
   */
  clear() {
    this.waitForGraph.clear();
  }
}

module.exports = DeadlockDetector;
