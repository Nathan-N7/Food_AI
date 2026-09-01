// Backwards-compatible re-export. The singleton presence socket now lives in
// PresenceContext (see src/context/PresenceContext.jsx). It connects with the
// session cookie (no ?token=) and is gated on auth state.
export { PresenceProvider, usePresence } from '../context/PresenceContext.jsx'
