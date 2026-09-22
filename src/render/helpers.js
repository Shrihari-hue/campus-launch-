'use strict';

const { escapeHtml } = require('../lib/http');

function badge(value, labelOverride) {
  if (!value) return '';
  const cls = String(value).toLowerCase();
  const label = labelOverride || String(value).replace(/_/g, ' ');
  return `<span class="badge badge-${cls}">${escapeHtml(label)}</span>`;
}

function workTypeLabel(t) {
  return { JOB: 'Full-time Job', PART_TIME: 'Part-time', TASK: 'One-off Task' }[t] || t;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes(' ') ? iso.replace(' ', 'T') + 'Z' : iso);
  if (isNaN(d.getTime())) return escapeHtml(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return escapeHtml(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function skillChips(skillsCsv) {
  if (!skillsCsv) return '';
  return skillsCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<span class="chip">${escapeHtml(s)}</span>`)
    .join('');
}

function alert(message, type) {
  if (!message) return '';
  return `<div class="alert alert-${type || 'info'}">${escapeHtml(message)}</div>`;
}

module.exports = { badge, workTypeLabel, fmtDate, fmtDateTime, skillChips, alert, escapeHtml };
