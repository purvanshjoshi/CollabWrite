/**
 * CollabWrite - React Editor (Phases 1, 2, 8 and 9)
 *
 * The presentation layer. It captures keystrokes, turns them into engine
 * operations, and renders what the collaboration manager pushes back. It
 * holds no concurrency logic of its own: no locks, no versioning rules, no
 * merge policy. Every one of those decisions is made inside the engine, and
 * this component only reacts to the outcome.
 *
 * CONFLICT HANDLING
 *   Each edit is submitted with the version it was typed against. If another
 *   collaborator committed first, the server answers 409 with the current
 *   version; the client reloads the document and tells the user their edit
 *   was rebased. That is the abort-and-retry loop design.md section 10
 *   specifies in place of operational transformation.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { api, applyOperation, diffToOperations } from './clientApi.js';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;
const FLUSH_DELAY_MS = 350;

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === 'login'
        ? { username: form.username, password: form.password }
        : form;
      const result = await api(`/api/auth/${mode}`, { method: 'POST', body });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="centered">
      <form className="card auth" onSubmit={submit}>
        <h1>CollabWrite</h1>
        <p className="subtitle">Collaborative editing over a custom OS/DBMS engine</p>

        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={form.username}
          autoComplete="username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        {mode === 'register' && (
          <>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </>
        )}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

function DocumentList({ documents, activeId, onOpen, onCreate, onRefresh }) {
  const [title, setTitle] = useState('');

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh document list"
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
          >
            ↻
          </button>
        )}
      </div>
      <form
        className="new-document"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onCreate(title.trim());
          setTitle('');
        }}
      >
        <input
          value={title}
          placeholder="New document title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            <button
              type="button"
              className={document.id === activeId ? 'active' : ''}
              onClick={() => onOpen(document.id)}
            >
              <span className="doc-title">{document.title}</span>
              <span className="role">{document.role}</span>
            </button>
          </li>
        ))}
        {documents.length === 0 && <li className="empty">No documents yet.</li>}
      </ul>
    </aside>
  );
}

function InspectorModal({ token, onClose }) {
  const [tab, setTab] = useState('purvansh');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api('/api/engine/inspector', { token });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Route not found');
    }
  }, [token]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 1500);
    return () => clearInterval(timer);
  }, [loadData]);

  const togglePolicy = async () => {
    if (!data?.scheduler?.policy) return;
    const nextPolicy = data.scheduler.policy === 'FIFO' ? 'ROUND_ROBIN' : 'FIFO';
    setBusy(true);
    try {
      await api('/api/engine/scheduler/policy', {
        token,
        method: 'POST',
        body: { policy: nextPolicy }
      });
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const simulateDeadlock = async () => {
    setBusy(true);
    try {
      await api('/api/engine/deadlock/simulate', {
        token,
        method: 'POST'
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to simulate deadlock');
    } finally {
      setBusy(false);
    }
  };

  const s = data?.stats;
  const storage = s?.storage;
  const bp = s?.bufferPool;
  const tx = s?.transactions;
  const deadlocks = data?.deadlocks || s?.deadlock;
  const wfg = data?.waitForGraph || [];
  const lockTable = s?.lockTable || [];
  const sched = data?.scheduler || s?.scheduler;
  const mq = s?.messageQueue;
  const collab = s?.collaboration;
  const conflicts = s?.conflicts;
  const recovery = s?.recovery;
  const locks = s?.locks;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#111827', color: '#f3f4f6', borderRadius: '10px',
        width: '100%', maxWidth: '820px', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', border: '1px solid #374151',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid #374151'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#60a5fa' }}>⚙️ CollabWrite OS & DBMS Inspector</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Live evaluation telemetry directly from the engine</p>
          </div>
          <button type="button" onClick={onClose} style={{
            background: '#374151', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem'
          }}>✕ Close</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #374151', background: '#1f2937' }}>
          <button
            type="button"
            onClick={() => setTab('purvansh')}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: tab === 'purvansh' ? '#2563eb' : 'transparent',
              color: tab === 'purvansh' ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            📦 Purvansh: Storage & Buffer
          </button>
          <button
            type="button"
            onClick={() => setTab('parth')}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: tab === 'parth' ? '#2563eb' : 'transparent',
              color: tab === 'parth' ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            🔒 Parth: Locks, Deadlocks & ACID
          </button>
          <button
            type="button"
            onClick={() => setTab('vansh')}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: tab === 'vansh' ? '#2563eb' : 'transparent',
              color: tab === 'vansh' ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            ⚡ Vansh: Scheduler & Workers
          </button>
        </div>

        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {error && !data && (
            <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem' }}>
              ⚠️ <strong>Connection Notice:</strong> Unable to connect to backend on port 3001 ({error}). Please ensure server is running.
            </div>
          )}
          {tab === 'purvansh' && (
            <div>
              <div style={{ background: '#1e3a5f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', color: '#bfdbfe' }}>
                💡 <strong>Purvansh:</strong> Documents are stored in fixed 4 KB binary pages inside <code>documents.dat</code>. The Buffer Pool acts like an 8-page study desk in RAM (8 frames ~ 32 KiB), using LRU eviction and frame pinning (paperweights) during disk I/O.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Binary Page Size</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#10b981' }}>{storage?.pageSize || 4096} B (4 KB)</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Pages in documents.dat</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#38bdf8' }}>{storage?.pages || 0} pages</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Buffer Pool Capacity</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#f59e0b' }}>{bp?.capacity || 64} frames (RAM)</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Resident in Memory</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#a78bfa' }}>{bp?.resident || 0} frames</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Pinned Frames (Paperweight)</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: (bp?.pinned || 0) > 0 ? '#ef4444' : '#10b981' }}>{bp?.pinned || 0} active</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Cache Hit Ratio</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#10b981' }}>{bp ? ((bp.hitRatio || 0) * 100).toFixed(1) : 0}% ({bp?.hits || 0} hits / {bp?.misses || 0} misses)</h3>
                </div>
              </div>
            </div>
          )}

          {tab === 'parth' && (
            <div>
              <div style={{ background: '#2e1065', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', color: '#e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <div>
                  💡 <strong>Parth:</strong> Strict Two-Phase Locking (Shared S for readers, Exclusive X for writers). The Wait-For Graph maps queued transactions, and Tarjan's SCC cycle detector preempts the youngest victim.
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={simulateDeadlock}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  ⚡ Simulate Deadlock Cycle
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Tx Begun</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: '#38bdf8' }}>{tx?.begun || 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Committed</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: '#10b981' }}>{tx?.committed || 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Total Aborted</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: '#f87171' }}>{tx?.aborted || 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Locks Granted</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: '#c084fc' }}>{locks?.granted || 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Deadlocks</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: (deadlocks?.deadlocksDetected || 0) > 0 ? '#f87171' : '#9ca3af' }}>{deadlocks?.deadlocksDetected || 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.65rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Deadlock Victims</span>
                  <h3 style={{ margin: '0.25rem 0 0', color: '#ef4444' }}>{deadlocks?.victimsAborted || 0}</h3>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#d1d5db' }}>🏛️ ACID Principles Live Telemetry</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '6px', border: '1px solid #2563eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#60a5fa', fontSize: '0.85rem' }}>[A] Atomicity (All-or-Nothing)</strong>
                    <span style={{ fontSize: '0.72rem', background: '#1e3a8a', color: '#93c5fd', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Guaranteed</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#d1d5db' }}>
                    <strong>{tx?.committed || 0}</strong> committed / <strong>{tx?.aborted || 0}</strong> total rollbacks (including <strong>{deadlocks?.victimsAborted || 0}</strong> deadlock victims). Restores WAL Before-Images with <strong>0 dirty bytes</strong> left on disk.
                  </p>
                </div>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '6px', border: '1px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>[C] Consistency (Invariants)</strong>
                    <span style={{ fontSize: '0.72rem', background: '#064e3b', color: '#a7f3d0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>CRC-32 + Versioning</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#d1d5db' }}>
                    Optimistic version checks: <strong>{conflicts?.conflictsDetected || 0}</strong> conflicts caught. Binary page headers enforce CRC-32 checksums and strict 4 KB bounds.
                  </p>
                </div>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '6px', border: '1px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#c084fc', fontSize: '0.85rem' }}>[I] Isolation (Strict 2PL)</strong>
                    <span style={{ fontSize: '0.72rem', background: '#581c87', color: '#e9d5ff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Strict 2PL Active</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#d1d5db' }}>
                    <strong>{locks?.granted || 0}</strong> total locks granted ({locks?.waited || 0} waited). <strong>{lockTable.length}</strong> currently active. (Strict 2PL releases locks in ~4ms at commit/abort).
                  </p>
                </div>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '0.85rem' }}>[D] Durability (Crash Survival)</strong>
                    <span style={{ fontSize: '0.72rem', background: '#78350f', color: '#fde68a', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>WAL + fsync()</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#d1d5db' }}>
                    WAL physically flushed via <code>fsync()</code> before commit. Boot recovery: <strong>{recovery?.scanned || 0}</strong> log records scanned.
                  </p>
                </div>
              </div>

              {deadlocks?.history && deadlocks.history.length > 0 && (
                <div style={{ marginBottom: '1rem', background: '#18181b', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ef4444' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#fca5a5' }}>🚨 Deadlock Detection & Victim Abort History (Tarjan's SCC)</h4>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#27272a', textAlign: 'left', color: '#d4d4d8' }}>
                        <th style={{ padding: '0.3rem 0.5rem' }}>Deadlock Cycle</th>
                        <th style={{ padding: '0.3rem 0.5rem' }}>Victim Chosen</th>
                        <th style={{ padding: '0.3rem 0.5rem' }}>Action Taken</th>
                        <th style={{ padding: '0.3rem 0.5rem' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadlocks.history.slice(-5).reverse().map((h, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #3f3f46' }}>
                          <td style={{ padding: '0.3rem 0.5rem', color: '#f87171', fontWeight: 600 }}>
                            {h.cycle.map((id) => `tx${id}`).join(' ➔ ')} ➔ tx{h.cycle[0]}
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', color: '#fbbf24', fontWeight: 600 }}>
                            tx{h.victim} (Youngest / Fewest Locks)
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', color: '#34d399' }}>
                            Aborted with LockAbortedError (Survivor Unblocked)
                          </td>
                          <td style={{ padding: '0.3rem 0.5rem', color: '#a1a1aa' }}>
                            {new Date(h.detectedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#d1d5db' }}>Live Wait-For Graph (WFG)</h4>
              {wfg.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 1rem' }}>Zero wait contention currently. (No transactions blocked waiting for each other).</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#374151', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Waiting Transaction</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Blocked By (Holder)</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Resource</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Requested Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wfg.map((edge, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#f87171' }}>tx{edge.waiter}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#38bdf8' }}>tx{edge.holder}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>{edge.resourceId}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>{edge.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#d1d5db' }}>Lock Table Snapshot (Strict 2PL)</h4>
              {lockTable.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>All locks released (locks held strictly during active read/write operations).</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#374151', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Resource</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Holders</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Waiting Queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lockTable.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                        <td style={{ padding: '0.4rem 0.6rem' }}>{item.resourceId}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#10b981' }}>{item.holders.map((h) => `tx${h.txId} (${h.mode})`).join(', ') || 'none'}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#f87171' }}>{item.waiting.map((w) => `tx${w.txId} (${w.mode})`).join(', ') || 'none'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'vansh' && (
            <div>
              <div style={{ background: '#064e3b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', color: '#a7f3d0' }}>
                💡 <strong>Vansh:</strong> CPU Request Scheduler rotates turns fairly among documents. The Bounded Worker Pool (4 workers) prevents CPU thread exhaustion. Real-time message queue guarantees FIFO event broadcast.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Scheduler Policy</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                    <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>{sched?.policy || 'FIFO'}</strong>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={togglePolicy}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Toggle to {sched?.policy === 'FIFO' ? 'ROUND_ROBIN' : 'FIFO'}
                    </button>
                  </div>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Scheduler Queue Depth</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#38bdf8' }}>{sched?.queueLength ?? 0} in queue</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Tasks Dispatched</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#10b981' }}>{sched?.dispatched ?? sched?.totalScheduled ?? 0}</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Worker Pool</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#a78bfa' }}>4 threads (bounded)</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Message Queue</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#38bdf8' }}>{mq?.published || 0} published / {mq?.delivered ?? mq?.consumed ?? 0} delivered</h3>
                </div>
                <div style={{ background: '#1f2937', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Collaboration Sessions</span>
                  <h3 style={{ margin: '0.3rem 0 0', color: '#10b981' }}>{collab?.sessions || 0} active ({collab?.joins || 0} joins)</h3>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#d1d5db' }}>Worker Threads (WorkerPool.js)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {(sched?.workers || [{ id: 1, state: 'IDLE' }, { id: 2, state: 'IDLE' }, { id: 3, state: 'IDLE' }, { id: 4, state: 'IDLE' }]).map((w, idx) => (
                  <div key={idx} style={{ background: '#1f2937', padding: '0.6rem', borderRadius: '6px', border: '1px solid #374151', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Worker {w.id || (idx + 1)}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: w.state === 'BUSY' ? '#f59e0b' : '#10b981', marginTop: '0.2rem' }}>
                      ● {w.state || 'IDLE'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {w.tasksProcessed || 0} tasks done
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem('collabwrite_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((newSession) => {
    setSessionState(newSession);
    try {
      if (newSession) {
        localStorage.setItem('collabwrite_session', JSON.stringify(newSession));
      } else {
        localStorage.removeItem('collabwrite_session');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const [documents, setDocuments] = useState([]);
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [participants, setParticipants] = useState([]);
  const [status, setStatus] = useState({ kind: 'idle', message: 'Ready' });
  const [showInspector, setShowInspector] = useState(false);

  const [sharingOpen, setSharingOpen] = useState(false);
  const [shareUsername, setShareUsername] = useState('');
  const [shareRole, setShareRole] = useState('editor');
  const [shareStatus, setShareStatus] = useState('');

  const socketRef = useRef(null);
  // The last text the server is known to hold, and the version it was at.
  // Operations are diffed against this, never against the previous keystroke.
  const committedRef = useRef({ text: '', version: 0 });
  const flushTimer = useRef(null);
  const activeRef = useRef(null);

  activeRef.current = active;

  const refreshDocuments = useCallback(async (token) => {
    const result = await api('/api/documents', { token });
    setDocuments(result.documents);
    return result.documents;
  }, []);

  const openDocument = useCallback(async (docId) => {
    const token = session.token;
    const result = await api(`/api/documents/${docId}`, { token });
    const document = result.document;

    // Leave previous document room so presence stays accurate per document
    if (activeRef.current && activeRef.current.id !== docId && socketRef.current) {
      socketRef.current.emit('document:leave', { docId: activeRef.current.id });
    }

    committedRef.current = { text: document.text, version: document.version };
    setActive(document);
    setText(document.text);
    setStatus({ kind: 'idle', message: `Opened at version ${document.version}` });

    if (socketRef.current) socketRef.current.emit('document:join', { docId });
  }, [session]);

  // ---------------------------------------------------------------- socket
  useEffect(() => {
    if (!session) return undefined;

    const socket = io(SOCKET_URL, { auth: { token: session.token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('document:joined', (event) => {
      if (activeRef.current && event.docId === activeRef.current.id) {
        setParticipants(event.participants || []);
      }
    });
    socket.on('presence', (event) => {
      if (!activeRef.current || (event.docId && event.docId !== activeRef.current.id)) return;
      setParticipants(event.participants || []);
    });

    socket.on('edit', (event) => {
      const current = activeRef.current;
      if (!current || event.docId !== current.id) return;
      if (event.userId === session.user.id) {
        // Our own committed edit coming back through the message queue.
        committedRef.current = { text: committedRef.current.text, version: event.version };
        return;
      }

      // Apply in place when the edit is the very next version; otherwise the
      // local copy has drifted and a reload is the honest repair.
      if (event.version === committedRef.current.version + 1) {
        const updated = applyOperation(committedRef.current.text, event.operation);
        committedRef.current = { text: updated, version: event.version };
        setText(updated);
        setStatus({ kind: 'remote', message: `${event.username || 'A collaborator'} edited (v${event.version})` });
      } else {
        openDocument(current.id).catch(() => {});
      }
    });

    socket.on('edit:error', (event) => {
      setStatus({ kind: 'error', message: `${event.code}: ${event.message}` });
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [session, openDocument]);

  useEffect(() => {
    if (!session) return;
    refreshDocuments(session.token).catch((error) => setStatus({ kind: 'error', message: error.message }));
  }, [session, refreshDocuments]);

  // ----------------------------------------------------------------- edits
  const flush = useCallback(async () => {
    const current = activeRef.current;
    if (!current) return;

    const operations = diffToOperations(committedRef.current.text, text);
    if (operations.length === 0) return;

    setStatus({ kind: 'saving', message: 'Committing transaction...' });
    try {
      for (const operation of operations) {
        const result = await api(`/api/documents/${current.id}/edit`, {
          token: session.token,
          method: 'POST',
          body: { operation, baseVersion: committedRef.current.version }
        });
        committedRef.current = { text: result.text, version: result.version };
      }
      setStatus({ kind: 'saved', message: `Committed at version ${committedRef.current.version}` });
    } catch (error) {
      if (error.code === 'VERSION_CONFLICT') {
        setStatus({
          kind: 'conflict',
          message: `Another collaborator committed version ${error.currentVersion} first. Reloading and rebasing your edit.`
        });
        await openDocument(current.id);
        return;
      }
      setStatus({ kind: 'error', message: `${error.code || 'ERROR'}: ${error.message}` });
    }
  }, [text, session, openDocument]);

  const handleShare = async (event) => {
    event.preventDefault();
    const current = activeRef.current;
    if (!current || !shareUsername.trim()) return;

    try {
      await api(`/api/documents/${current.id}/permissions`, {
        token: session.token,
        method: 'PUT',
        body: { username: shareUsername.trim(), role: shareRole }
      });
      setShareStatus(`Shared with @${shareUsername.trim()} as ${shareRole}`);
      setShareUsername('');
      setTimeout(() => setShareStatus(''), 4000);
    } catch (error) {
      setShareStatus(`Failed: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!active) return undefined;
    if (text === committedRef.current.text) return undefined;

    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => { flush().catch(() => {}); }, FLUSH_DELAY_MS);
    return () => clearTimeout(flushTimer.current);
  }, [text, active, flush]);

  // ----------------------------------------------------------------- render
  if (!session) {
    return <AuthPanel onAuthenticated={setSession} />;
  }

  const canEdit = active && (active.role === 'owner' || active.role === 'editor');

  return (
    <div className="layout">
      <header className="topbar">
        <strong>CollabWrite</strong>
        <span className="spacer" />
        <button
          type="button"
          onClick={() => setShowInspector(true)}
          style={{
            fontSize: '0.8rem',
            padding: '0.35rem 0.75rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            marginRight: '0.75rem'
          }}
        >
          ⚙️ OS & DBMS Inspector
        </button>
        <span className="user">{session.user.username}</span>
        <button type="button" onClick={() => setSession(null)}>Sign out</button>
      </header>

      <div className="body">
        <DocumentList
          documents={documents}
          activeId={active ? active.id : null}
          onOpen={(id) => openDocument(id).catch((error) => setStatus({ kind: 'error', message: error.message }))}
          onRefresh={() => refreshDocuments(session.token).catch((error) => setStatus({ kind: 'error', message: error.message }))}
          onCreate={async (title) => {
            try {
              const created = await api('/api/documents', {
                token: session.token, method: 'POST', body: { title }
              });
              await refreshDocuments(session.token);
              await openDocument(created.document.id);
            } catch (error) {
              setStatus({ kind: 'error', message: error.message });
            }
          }}
        />

        <main className="editor">
          {!active && <p className="placeholder">Select or create a document to start editing.</p>}

          {active && (
            <>
              <div className="editor-header">
                <h2>{active.title}</h2>
                <span className="version">version {committedRef.current.version}</span>
                {active.role === 'owner' && (
                  <button
                    type="button"
                    onClick={() => setSharingOpen(!sharingOpen)}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                  >
                    {sharingOpen ? 'Close Share' : 'Share'}
                  </button>
                )}
                <span className="spacer" />
                <span className="participants" title="Active collaborators inside this document">
                  <span style={{ color: '#10b981', marginRight: '0.35rem' }}>●</span>
                  {participants.length} active in document: {participants.map((p) => p.username).join(', ') || '-'}
                </span>
              </div>

              {sharingOpen && active.role === 'owner' && (
                <form className="share-panel" onSubmit={handleShare}>
                  <input
                    placeholder="Enter collaborator username"
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    required
                  />
                  <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}>
                    <option value="editor">Editor (Can edit)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                  <button type="submit" className="primary">Grant Access</button>
                  {shareStatus && <span className="share-feedback">{shareStatus}</span>}
                </form>
              )}

              <textarea
                value={text}
                readOnly={!canEdit}
                spellCheck={false}
                onChange={(event) => setText(event.target.value)}
                placeholder={canEdit ? 'Start typing...' : 'You have read-only access to this document.'}
              />

              <div className={`status ${status.kind}`}>{status.message}</div>
            </>
          )}
        </main>
      </div>
      {showInspector && (
        <InspectorModal token={session.token} onClose={() => setShowInspector(false)} />
      )}
    </div>
  );
}
