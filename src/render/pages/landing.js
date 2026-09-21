'use strict';

function landingPage() {
  return `
<section class="hero">
  <div class="container hero-inner">
    <span class="eyebrow">✦ Campus talent, startup pace</span>
    <h1>Connect your college's best students with startup founders who need them.</h1>
    <p class="lead">CampusLaunch is the trusted bridge between startup founders and college placement cells — post real work, vet it through the college, agree on fair terms, and let the college distribute tasks to the right students.</p>
    <div class="hero-ctas">
      <a class="btn btn-primary" href="/signup/founder">I'm a Startup Founder →</a>
      <a class="btn btn-outline" href="/signup/college">I represent a College →</a>
    </div>
    <div class="stats-row">
      <div class="stat"><div class="num">2</div><div class="label">Dedicated Logins</div></div>
      <div class="stat"><div class="num">100%</div><div class="label">College-Vetted</div></div>
      <div class="stat"><div class="num">0</div><div class="label">Middlemen</div></div>
    </div>
  </div>
</section>

<section class="section" id="how-it-works">
  <div class="container">
    <div class="section-head">
      <h2>How CampusLaunch works</h2>
      <p>A simple, transparent path from a posted opportunity to real work getting done — with the college as a trusted intermediary at every step.</p>
    </div>
    <div class="grid-3">
      <div class="feature-card">
        <div class="feature-icon">①</div>
        <h3>Founders post the work</h3>
        <p>Startup founders publish jobs, part-time roles or one-off tasks with the skills, scope and budget they have in mind.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">②</div>
        <h3>Colleges request &amp; negotiate</h3>
        <p>Interested colleges send a request, discuss requirements in a shared thread, and agree on the final fee and terms together.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">③</div>
        <h3>Colleges assign students</h3>
        <p>Once agreed, the college distributes the work to specific students from its own roster and tracks it through to completion.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="for-founders" style="background:var(--bg-alt); border-top:1px solid var(--line); border-bottom:1px solid var(--line);">
  <div class="container">
    <div class="detail-grid" style="align-items:center;">
      <div>
        <h2>For Startup Founders</h2>
        <p>Skip the noise of open freelance marketplaces. Reach pre-organized, college-vetted student talent through a placement cell that already knows its students' strengths.</p>
        <ul style="color:var(--ink-soft); padding-left:20px; line-height:1.9;">
          <li>Post jobs, part-time roles or scoped tasks in minutes</li>
          <li>Review interest from colleges and negotiate fee &amp; scope directly</li>
          <li>Work with a single accountable college contact, not scattered individuals</li>
        </ul>
        <a class="btn btn-primary" href="/signup/founder">Post your first opportunity →</a>
      </div>
      <div class="card">
        <h4 class="mt-0">Sample posting</h4>
        <div class="listing-meta"><span class="badge badge-task">One-off Task</span></div>
        <h3 style="margin-bottom:6px;">Landing page redesign for our SaaS</h3>
        <p class="muted" style="font-size:0.88rem;">Need 2–3 students comfortable with Figma + basic HTML/CSS to redesign our marketing site in 2 weeks.</p>
        <div class="listing-skills">${['Figma', 'HTML/CSS', 'UI Design'].map((s) => `<span class="chip">${s}</span>`).join('')}</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="for-colleges">
  <div class="container">
    <div class="detail-grid" style="align-items:center;">
      <div class="card" style="order:2;">
        <h4 class="mt-0">Negotiation, made simple</h4>
        <div class="chat-thread" style="max-height:none;">
          <div class="msg msg-them">We'd like to take this on. Our students have shipped 3 similar redesigns.<div class="msg-meta">College</div></div>
          <div class="msg msg-me">Great — can we settle on ₹18,000 for the full scope, 2-week turnaround?<div class="msg-meta">Founder</div></div>
          <div class="msg msg-system">Agreement reached · ₹18,000 · 2 weeks</div>
        </div>
      </div>
      <div style="order:1;">
        <h2>For Colleges &amp; Placement Cells</h2>
        <p>Give your students real startup experience while keeping full oversight. You decide which requests to pursue, what terms are fair, and which students get each task.</p>
        <ul style="color:var(--ink-soft); padding-left:20px; line-height:1.9;">
          <li>Browse live opportunities from vetted startup founders</li>
          <li>Negotiate scope and fee before committing your students</li>
          <li>Maintain a student roster and assign tasks with full traceability</li>
        </ul>
        <a class="btn btn-outline" href="/signup/college">Register your college →</a>
      </div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0;">
  <div class="container">
    <div class="card" style="background:linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border:none; text-align:center; padding:56px 32px;">
      <h2 style="color:#fff;">Ready to build the bridge between campus and startup?</h2>
      <p style="color:rgba(255,255,255,0.78); max-width:520px; margin:0 auto 28px;">Whether you're hiring or placing, CampusLaunch keeps the whole process transparent, fair and fast.</p>
      <div class="hero-ctas">
        <a class="btn btn-accent" href="/signup/founder">Founder sign up</a>
        <a class="btn" style="background:#fff; color:var(--primary-dark);" href="/signup/college">College sign up</a>
      </div>
    </div>
  </div>
</section>
`;
}

module.exports = { landingPage };
