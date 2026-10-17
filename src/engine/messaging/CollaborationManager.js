/**
 * CollabWrite - Collaboration Manager (Phase 8)
 *
 * CONCEPT
 *   The consumer half of the producer-consumer pair. It owns the session
 *   table (who is connected to which document) and forwards every event the
 *   message queue delivers to the clients that care about it.
 *
 * DESIGN NOTE
 *   The transport is injected rather than imported. In production it is a
 *   Socket.IO server; in tests it is a recording double. Keeping the
 *   dependency at arm's length is what lets the ordering guarantees be tested
 *   without opening a socket.
 *
 * DATA STRUCTURES (design.md section 2, Session entity)
 *   sessions  : Map<sessionId, {sessionId, userId, username, docIds:Set}>
 *   byDocument: Map<docId, Set<sessionId>>  - reverse index for broadcast and
 *               for the presence list the editor shows.
 */

'use strict';

const { createLogger } = require('../../config/logger');

const log = createLogger('CollaborationManager');

class CollaborationManager {
  /**
   * @param {object} deps
   * @param {import('./MessageQueue').MessageQueue} deps.messageQueue
   * @param {{broadcast: (docId:any, event:string, payload:object) => void}} [deps.transport]
   */
  constructor({ messageQueue, transport = null }) {
    this.messageQueue = messageQueue;
    this.transport = transport;
    /** @type {Map<string, {sessionId:string, userId:number, username:string, docIds:Set<number>}>} */
    this.sessions = new Map();
    /** @type {Map<number, Set<string>>} */
    this.byDocument = new Map();
    this.stats = { broadcasts: 0, joins: 0, leaves: 0 };

    this.unsubscribe = this.messageQueue.subscribe((event) => this.handleEvent(event));
  }

  /** @param {{broadcast: Function}} transport */
  setTransport(transport) {
    this.transport = transport;
  }

  /**
   * Registers a client session against a document.
   *
   * @param {object} session
   * @param {string} session.sessionId
   * @param {number} session.userId
   * @param {string} session.username
   * @param {number} session.docId
   * @returns {object[]} The presence list for that document.
   */
  join({ sessionId, userId, username, docId }) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { sessionId, userId, username, docIds: new Set() };
      this.sessions.set(sessionId, session);
    }
    session.docIds.add(docId);

    if (!this.byDocument.has(docId)) this.byDocument.set(docId, new Set());
    this.byDocument.get(docId).add(sessionId);
    this.stats.joins += 1;

    log.debug('Session joined document', { sessionId, userId, docId });
    this.messageQueue.publish({
      docId,
      type: 'presence',
      payload: { action: 'join', userId, username, participants: this.getParticipants(docId) }
    });
    return this.getParticipants(docId);
  }

  /**
   * Removes a session from one document, or from all of them when docId is
   * omitted (which is what a socket disconnect means).
   *
   * @param {string} sessionId
   * @param {number} [docId]
   */
  leave(sessionId, docId = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const documents = docId === null ? [...session.docIds] : [docId];
    for (const id of documents) {
      session.docIds.delete(id);
      const members = this.byDocument.get(id);
      if (members) {
        members.delete(sessionId);
        if (members.size === 0) this.byDocument.delete(id);
      }
      this.stats.leaves += 1;
      this.messageQueue.publish({
        docId: id,
        type: 'presence',
        payload: {
          action: 'leave',
          userId: session.userId,
          username: session.username,
          participants: this.getParticipants(id)
        }
      });
    }
    if (session.docIds.size === 0) this.sessions.delete(sessionId);
  }

  /**
   * @param {number} docId
   * @returns {Array<{sessionId:string, userId:number, username:string}>}
   */
  getParticipants(docId) {
    const members = this.byDocument.get(docId);
    if (!members) return [];
    return [...members]
      .map((sessionId) => this.sessions.get(sessionId))
      .filter(Boolean)
      .map(({ sessionId, userId, username }) => ({ sessionId, userId, username }));
  }

  /**
   * Consumer callback. Forwards one queued event to the transport.
   * @param {object} event
   */
  handleEvent(event) {
    this.stats.broadcasts += 1;
    if (!this.transport) return;
    this.transport.broadcast(event.docId, event.type, {
      sequence: event.sequence,
      publishedAt: event.publishedAt,
      docId: event.docId,
      ...event.payload
    });
  }

  /** @returns {object} Session and broadcast counters. */
  getStats() {
    return {
      ...this.stats,
      sessions: this.sessions.size,
      documents: this.byDocument.size
    };
  }

  /** Detaches from the message queue. */
  close() {
    if (this.unsubscribe) this.unsubscribe();
    this.sessions.clear();
    this.byDocument.clear();
  }
}

module.exports = { CollaborationManager };
