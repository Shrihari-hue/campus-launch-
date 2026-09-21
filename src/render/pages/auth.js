'use strict';

const { escapeHtml, alert } = require('../helpers');

function authToggle(role, mode) {
  const loginHref = `/login/${role}`;
  const signupHref = `/signup/${role}`;
  return `
    <div class="auth-toggle">
      <a href="${loginHref}" class="${mode === 'login' ? 'active' : ''}">Log in</a>
      <a href="${signupHref}" class="${mode === 'signup' ? 'active' : ''}">Sign up</a>
    </div>`;
}

function roleSwitcher(role) {
  const other = role === 'FOUNDER' ? 'college' : 'founder';
  const otherLabel = role === 'FOUNDER' ? 'College' : 'Startup Founder';
  return `<p class="text-center muted" style="margin-top:22px; font-size:0.85rem;">Not a ${role === 'FOUNDER' ? 'founder' : 'college rep'}? <a href="/login/${other}">${otherLabel} login →</a></p>`;
}

function loginPage({ role, error }) {
  const roleKey = role.toLowerCase();
  const title = role === 'FOUNDER' ? 'Founder Login' : 'College Login';
  return `
<div class="auth-shell">
  <div class="auth-card">
    ${authToggle(roleKey, 'login')}
    <h2 class="text-center">${title}</h2>
    <p class="text-center muted" style="margin-top:-8px;">${role === 'FOUNDER' ? 'Welcome back — manage your postings and requests.' : 'Welcome back — browse opportunities for your students.'}</p>
    ${alert(error, 'error')}
    <form data-api="/api/auth/login" data-method="POST" data-redirect="${role === 'FOUNDER' ? '/founder/dashboard' : '/college/dashboard'}">
      <input type="hidden" name="role" value="${role}" />
      <div class="field">
        <label>Email address</label>
        <input type="email" name="email" required placeholder="you@example.com" autofocus />
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" name="password" required placeholder="••••••••" />
      </div>
      <button class="btn btn-primary btn-block" type="submit">Log in</button>
    </form>
    <p class="text-center muted" style="margin-top:18px; font-size:0.85rem;">New here? <a href="/signup/${roleKey}">Create an account</a></p>
    ${roleSwitcher(role)}
  </div>
</div>`;
}

function signupPage({ role, error }) {
  const roleKey = role.toLowerCase();
  const title = role === 'FOUNDER' ? 'Founder Sign Up' : 'College Sign Up';
  const extraFields =
    role === 'FOUNDER'
      ? `
      <div class="field">
        <label>Company / startup name</label>
        <input type="text" name="companyName" required placeholder="e.g. Loopwave Labs" />
      </div>
      <div class="form-row">
        <div class="field">
          <label>Industry <span class="muted">(optional)</span></label>
          <input type="text" name="industry" placeholder="e.g. Fintech, EdTech" />
        </div>
        <div class="field">
          <label>Website <span class="muted">(optional)</span></label>
          <input type="url" name="website" placeholder="https://" />
        </div>
      </div>`
      : `
      <div class="field">
        <label>College / institute name</label>
        <input type="text" name="collegeName" required placeholder="e.g. Sri Venkateswara College of Engineering" />
      </div>
      <div class="form-row">
        <div class="field">
          <label>City</label>
          <input type="text" name="city" placeholder="e.g. Bengaluru" />
        </div>
        <div class="field">
          <label>Placement contact <span class="muted">(optional)</span></label>
          <input type="text" name="placementContact" placeholder="Name / phone" />
        </div>
      </div>`;

  return `
<div class="auth-shell">
  <div class="auth-card">
    ${authToggle(roleKey, 'signup')}
    <h2 class="text-center">${title}</h2>
    <p class="text-center muted" style="margin-top:-8px;">${role === 'FOUNDER' ? 'Post work and connect with vetted college talent.' : 'Register your placement cell to start receiving opportunities.'}</p>
    ${alert(error, 'error')}
    <form data-api="/api/auth/signup" data-method="POST" data-redirect="${role === 'FOUNDER' ? '/founder/dashboard' : '/college/dashboard'}">
      <input type="hidden" name="role" value="${role}" />
      <div class="field">
        <label>Your full name</label>
        <input type="text" name="name" required placeholder="e.g. Ananya Rao" autofocus />
      </div>
      <div class="field">
        <label>Email address</label>
        <input type="email" name="email" required placeholder="you@example.com" />
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" name="password" required minlength="6" placeholder="At least 6 characters" />
      </div>
      ${extraFields}
      <button class="btn btn-primary btn-block" type="submit">Create account</button>
    </form>
    <p class="text-center muted" style="margin-top:18px; font-size:0.85rem;">Already registered? <a href="/login/${roleKey}">Log in</a></p>
    ${roleSwitcher(role)}
  </div>
</div>`;
}

module.exports = { loginPage, signupPage };
