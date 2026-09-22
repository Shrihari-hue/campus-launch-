(function () {
  'use strict';

  function toast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s ease';
      setTimeout(function () { el.remove(); }, 250);
    }, 3200);
  }
  window.CL = { toast: toast };

  async function apiCall(method, url, body) {
    const res = await fetch(url, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const msg = (data && data.error) || 'Something went wrong. Please try again.';
      throw new Error(msg);
    }
    return data;
  }
  window.CL.api = apiCall;

  // Generic data-form handler: any <form data-api data-method="POST" data-redirect="/x">
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!form.matches('[data-api]')) return;
    e.preventDefault();
    const url = form.getAttribute('action') || form.dataset.api;
    const method = (form.dataset.method || 'POST').toUpperCase();
    const redirect = form.dataset.redirect;
    // NOTE: a bare `data-reload` attribute (no ="value") sets dataset.reload
    // to an empty string, which is falsy — reading it directly here silently
    // skipped every reload. Use hasAttribute, same as the data-action and
    // data-status-action handlers below already correctly do.
    const reload = form.hasAttribute('data-reload');
    const fd = new FormData(form);
    const body = {};
    fd.forEach(function (v, k) { body[k] = v; });
    const btn = form.querySelector('[type="submit"]');
    const original = btn ? btn.textContent : null;
    if (btn) { btn.disabled = true; btn.textContent = form.dataset.loadingText || 'Please wait…'; }

    apiCall(method, url, body)
      .then(function (data) {
        if (form.dataset.successMsg) toast(form.dataset.successMsg, 'success');
        if (redirect) {
          window.location.href = redirect;
        } else if (reload) {
          window.location.reload();
        } else if (btn) {
          btn.disabled = false;
          btn.textContent = original;
          form.reset();
        }
      })
      .catch(function (err) {
        toast(err.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
  });

  // Generic data-action buttons: <button data-action="/api/x" data-method="POST" data-confirm="...">
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    const confirmMsg = btn.getAttribute('data-confirm');
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const url = btn.getAttribute('data-action');
    const method = (btn.getAttribute('data-method') || 'POST').toUpperCase();
    const redirect = btn.getAttribute('data-redirect');
    const reload = btn.hasAttribute('data-reload');
    let body = null;
    if (btn.dataset.payload) {
      try { body = JSON.parse(btn.dataset.payload); } catch (e2) { body = null; }
    }
    const original = btn.textContent;
    btn.disabled = true;
    apiCall(method, url, body)
      .then(function () {
        if (btn.dataset.successMsg) toast(btn.dataset.successMsg, 'success');
        if (redirect) window.location.href = redirect;
        else if (reload) window.location.reload();
        else btn.disabled = false;
      })
      .catch(function (err) {
        toast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = original;
      });
  });

  // Status <select> that posts on change: <select data-status-action="/api/x" data-reload>
  document.addEventListener('change', function (e) {
    const sel = e.target.closest('[data-status-action]');
    if (!sel) return;
    const url = sel.getAttribute('data-status-action');
    const reload = sel.hasAttribute('data-reload');
    apiCall('POST', url, { status: sel.value })
      .then(function () {
        toast('Status updated.', 'success');
        if (reload) window.location.reload();
      })
      .catch(function (err) { toast(err.message, 'error'); });
  });

  // Auto-scroll chat thread to bottom on load
  document.addEventListener('DOMContentLoaded', function () {
    const thread = document.querySelector('.chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  });

  // Live character counter: any <textarea maxlength> followed by a
  // <div class="char-count"> in the same .field updates as the user types.
  document.addEventListener('input', function (e) {
    const el = e.target;
    if (el.tagName !== 'TEXTAREA' || !el.hasAttribute('maxlength')) return;
    const field = el.closest('.field');
    const counter = field && field.querySelector('.char-count');
    if (!counter) return;
    const max = Number(el.getAttribute('maxlength'));
    const len = el.value.length;
    counter.textContent = len + ' / ' + max;
    counter.classList.toggle('char-count-near-limit', len >= max * 0.9);
  });
})();
