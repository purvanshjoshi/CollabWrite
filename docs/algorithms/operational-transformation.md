# Operational Transformation (OT) Deep Dive

## 1. Mathematical Foundations

Operational Transformation (OT) is a concurrency control algorithm enabling distributed, optimistic co-editing over an arbitrary text sequence without locking.

### 1.1 Formal Definitions
- An **Operation** $O = \langle \text{type}, \text{pos}, \text{data}, \text{len}, \text{uid} \rangle$ represents a mutation to the document string $S$.
- **$\text{apply}(S, O)$**: A deterministic function returning the mutated string $S'$.
- **$T(O_a, O_b) \to (O_a', O_b')$**: The transformation function taking two concurrent operations executed against the same base state $S$ and returning pair $(O_a', O_b')$ such that:
  - $O_a'$ is $O_a$ modified to execute *after* $O_b$.
  - $O_b'$ is $O_b$ modified to execute *after* $O_a$.

### 1.2 Transformation Properties

#### Property 1 (TP1): Convergence
For any two concurrent operations $O_1$ and $O_2$ against state $S$:
$$\text{apply}(\text{apply}(S, O_1), O_2') = \text{apply}(\text{apply}(S, O_2), O_1')$$

```
          S
        /   \
    O1 /     \ O2
      v       v
     S1       S2
      |       |
  O2' |       | O1'
      v       v
         S'   <--- Converged State
```

---

## 2. Transformation Matrix & Implementation

### 2.1 Complete Case Matrix

```javascript
class OTEngine {
  /**
   * Transforms two concurrent operations op1 and op2.
   * @returns {[Operation, Operation]} [op1Transformed, op2Transformed]
   */
  static transform(op1, op2) {
    // -------------------------------------------------------------
    // Case 1: Insert vs. Insert
    // -------------------------------------------------------------
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + op1.content.length }
        ];
      } else if (op1.position > op2.position) {
        return [
          { ...op1, position: op1.position + op2.content.length },
          op2
        ];
      } else {
        // Equal positions: Deterministic tie-breaking by userId
        if (op1.userId < op2.userId) {
          return [
            op1,
            { ...op2, position: op2.position + op1.content.length }
          ];
        } else {
          return [
            { ...op1, position: op1.position + op2.content.length },
            op2
          ];
        }
      }
    }

    // -------------------------------------------------------------
    // Case 2: Insert vs. Delete
    // -------------------------------------------------------------
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + op1.content.length }
        ];
      } else if (op1.position >= op2.position + op2.length) {
        return [
          { ...op1, position: op1.position - op2.length },
          op2
        ];
      } else {
        // Insert falls inside the delete region
        return [
          { ...op1, position: op2.position },
          { ...op2, length: op2.length + op1.content.length }
        ];
      }
    }

    // -------------------------------------------------------------
    // Case 3: Delete vs. Insert (Symmetric)
    // -------------------------------------------------------------
    if (op1.type === 'delete' && op2.type === 'insert') {
      const [transformedOp2, transformedOp1] = this.transform(op2, op1);
      return [transformedOp1, transformedOp2];
    }

    // -------------------------------------------------------------
    // Case 4: Delete vs. Delete
    // -------------------------------------------------------------
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position + op1.length <= op2.position) {
        // op1 entirely before op2
        return [
          op1,
          { ...op2, position: op2.position - op1.length }
        ];
      } else if (op2.position + op2.length <= op1.position) {
        // op2 entirely before op1
        return [
          { ...op1, position: op1.position - op2.length },
          op2
        ];
      } else {
        // Overlapping deletions: Adjust lengths and positions
        const overlapStart = Math.max(op1.position, op2.position);
        const overlapEnd = Math.min(op1.position + op1.length, op2.position + op2.length);
        const overlapLength = Math.max(0, overlapEnd - overlapStart);

        return [
          { ...op1, length: op1.length - overlapLength },
          { ...op2, length: op2.length - overlapLength }
        ];
      }
    }

    return [op1, op2];
  }
}
```

---

## 3. Remote Cursor Translation

When a remote operation $O$ is received from the server, any active local cursor positions $C = \langle \text{pos}, \text{selectionLength} \rangle$ must be adjusted dynamically so that the user's cursor does not jump unexpectedly:

```javascript
function transformCursor(cursorPos, remoteOp) {
  if (remoteOp.type === 'insert') {
    if (remoteOp.position <= cursorPos) {
      return cursorPos + remoteOp.content.length;
    }
  } else if (remoteOp.type === 'delete') {
    if (remoteOp.position + remoteOp.length <= cursorPos) {
      return cursorPos - remoteOp.length;
    } else if (remoteOp.position < cursorPos) {
      return remoteOp.position;
    }
  }
  return cursorPos;
}
```
