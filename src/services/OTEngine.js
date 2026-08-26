/**
 * CollabWrite - Operational Transformation (OT) Engine
 * Implements TP1-compliant character-wise transformation for concurrent operations.
 */

class OTEngine {
  /**
   * Applies an operation to a base text string.
   * @param {string} text - Initial text state
   * @param {Object} op - Operation to apply
   * @returns {string} Mutated text state
   */
  static apply(text, op) {
    const currentText = text || '';
    if (!op || !op.type) return currentText;

    if (op.type === 'insert') {
      const pos = Math.max(0, Math.min(op.position, currentText.length));
      const content = op.content || '';
      return currentText.slice(0, pos) + content + currentText.slice(pos);
    }

    if (op.type === 'delete') {
      const pos = Math.max(0, Math.min(op.position, currentText.length));
      const len = Math.max(0, op.length || 0);
      return currentText.slice(0, pos) + currentText.slice(pos + len);
    }

    return currentText;
  }

  /**
   * Transforms two concurrent operations op1 and op2 against each other.
   * @param {Object} op1 - First operation
   * @param {Object} op2 - Second operation
   * @returns {[Object, Object]} [op1Prime, op2Prime]
   */
  static transform(op1, op2) {
    if (!op1 || !op2) return [op1, op2];

    // Case 1: Insert vs Insert
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [
          { ...op1 },
          { ...op2, position: op2.position + (op1.content ? op1.content.length : 0) }
        ];
      } else if (op1.position > op2.position) {
        return [
          { ...op1, position: op1.position + (op2.content ? op2.content.length : 0) },
          { ...op2 }
        ];
      } else {
        // Equal position: Tie-break deterministically using userId or default
        const u1 = op1.userId !== undefined ? op1.userId : 0;
        const u2 = op2.userId !== undefined ? op2.userId : 0;

        if (u1 < u2) {
          return [
            { ...op1 },
            { ...op2, position: op2.position + (op1.content ? op1.content.length : 0) }
          ];
        } else {
          return [
            { ...op1, position: op1.position + (op2.content ? op2.content.length : 0) },
            { ...op2 }
          ];
        }
      }
    }

    // Case 2: Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
      const insLen = op1.content ? op1.content.length : 0;
      const delLen = op2.length || 0;

      if (op1.position <= op2.position) {
        return [
          { ...op1 },
          { ...op2, position: op2.position + insLen }
        ];
      } else if (op1.position >= op2.position + delLen) {
        return [
          { ...op1, position: op1.position - delLen },
          { ...op2 }
        ];
      } else {
        // Insert is inside delete span
        return [
          { ...op1, position: op2.position },
          { ...op2, length: delLen + insLen }
        ];
      }
    }

    // Case 3: Delete vs Insert
    if (op1.type === 'delete' && op2.type === 'insert') {
      const [op2Prime, op1Prime] = this.transform(op2, op1);
      return [op1Prime, op2Prime];
    }

    // Case 4: Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
      const len1 = op1.length || 0;
      const len2 = op2.length || 0;

      if (op1.position + len1 <= op2.position) {
        return [
          { ...op1 },
          { ...op2, position: op2.position - len1 }
        ];
      } else if (op2.position + len2 <= op1.position) {
        return [
          { ...op1, position: op1.position - len2 },
          { ...op2 }
        ];
      } else {
        // Overlapping deletions
        const overlapStart = Math.max(op1.position, op2.position);
        const overlapEnd = Math.min(op1.position + len1, op2.position + len2);
        const overlapLen = Math.max(0, overlapEnd - overlapStart);

        return [
          { ...op1, length: Math.max(0, len1 - overlapLen) },
          { ...op2, length: Math.max(0, len2 - overlapLen) }
        ];
      }
    }

    return [{ ...op1 }, { ...op2 }];
  }

  /**
   * Adjusts a cursor position when a remote operation arrives.
   * @param {number} cursorPos
   * @param {Object} remoteOp
   * @returns {number}
   */
  static transformCursor(cursorPos, remoteOp) {
    if (!remoteOp) return cursorPos;

    if (remoteOp.type === 'insert') {
      const len = remoteOp.content ? remoteOp.content.length : 0;
      if (remoteOp.position <= cursorPos) {
        return cursorPos + len;
      }
    } else if (remoteOp.type === 'delete') {
      const len = remoteOp.length || 0;
      if (remoteOp.position + len <= cursorPos) {
        return cursorPos - len;
      } else if (remoteOp.position < cursorPos) {
        return remoteOp.position;
      }
    }
    return cursorPos;
  }
}

module.exports = OTEngine;
