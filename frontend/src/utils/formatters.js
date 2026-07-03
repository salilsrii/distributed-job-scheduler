import { formatDistanceToNow, format, parseISO, differenceInSeconds } from 'date-fns'

// ── Date / Time ─────────────────────────────────────────────────
export function formatDate(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, yyyy HH:mm')
  } catch {
    return '—'
  }
}

export function formatRelative(iso) {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true })
  } catch {
    return '—'
  }
}

// ── Duration ────────────────────────────────────────────────────
export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '—'
  if (seconds < 60)  return `${seconds}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function durationBetween(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  try {
    const secs = differenceInSeconds(parseISO(endIso), parseISO(startIso))
    return formatDuration(secs)
  } catch {
    return '—'
  }
}

// ── Numbers ──────────────────────────────────────────────────────
export function formatNumber(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat().format(n)
}

export function formatCompact(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(n)
}

// ── Priority ─────────────────────────────────────────────────────
export function priorityLabel(p) {
  if (p >= 100) return 'Critical'
  if (p >= 10)  return 'High'
  if (p >= 5)   return 'Medium'
  return 'Normal'
}

// ── Truncate ──────────────────────────────────────────────────────
export function truncate(str, len = 40) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

// ── JSON pretty ──────────────────────────────────────────────────
export function prettyJson(obj) {
  try {
    return JSON.stringify(obj ?? {}, null, 2)
  } catch {
    return '{}'
  }
}
