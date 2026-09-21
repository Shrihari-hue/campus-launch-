'use strict';

const { escapeHtml } = require('../lib/http');

function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function navFor(user) {
  if (!user) {
    return `
      <div class="nav-links">
        <a href="/#how-it-works">How it works</a>
        <a href="/#for-founders">For Founders</a>
        <a href="/#for-colleges">For Colleges</a>
      </div>
      <div class="nav-cta">
        <a class="btn btn-ghost btn-sm" href="/login/college">College Login</a>
        <a class="btn btn-primary btn-sm" href="/login/founder">Founder Login</a>
      </div>`;
  }
  const base = user.role === 'FOUNDER' ? '/founder' : '/college';
  const links =
    user.role === 'FOUNDER'
      ? [
          [`${base}/dashboard`, 'Dashboard'],
          [`${base}/listings/new`, 'Post Opportunity'],
          [`${base}/requests`, 'Requests'],
        ]
      : [
          [`${base}/dashboard`, 'Browse'],
          [`${base}/requests`, 'My Requests'],
          [`${base}/students`, 'Students'],
        ];
  return `
    <div class="nav-links">
      ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
    </div>
    <div class="nav-cta">
      <span class="pill">${escapeHtml(user.role === 'FOUNDER' ? 'Founder' : 'College')}</span>
      <div class="avatar" title="${escapeHtml(user.name)}">${escapeHtml(initials(user.name))}</div>
      <button class="btn btn-ghost btn-sm" data-action="/api/auth/logout" data-method="POST" data-redirect="/">Log out</button>
    </div>`;
}

function page({ title, user, body, activeNav }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} · CampusLaunch</title>
<meta name="description" content="CampusLaunch connects startup founders with vetted college talent through their placement cells." />
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%231f2d5c%22/><text x=%2250%25%22 y=%2262%25%22 font-size=%2255%22 text-anchor=%22middle%22 fill=%22%23f8efdd%22 font-family=%22Georgia,serif%22>C</text></svg>" />
<link rel="stylesheet" href="/static/styles.css" />
</head>
<body>
<div id="toast-root"></div>
<header class="topnav">
  <div class="container topnav-inner">
    <a class="brand" href="/">
      <span class="brand-mark">C</span>
      CampusLaunch
    </a>
    ${navFor(user)}
  </div>
</header>
<main>
${body}
</main>
<footer>
  <div class="container footer-row">
    <div><strong style="color:var(--ink)">CampusLaunch</strong> — where campus talent meets startup ambition.</div>
    <div>&copy; ${new Date().getFullYear()} CampusLaunch. Built for trust, not just transactions.</div>
  </div>
</footer>
<script src="/static/app.js"></script>
</body>
</html>`;
}

module.exports = { page, initials };
