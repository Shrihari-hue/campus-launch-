'use strict';

const { badge, workTypeLabel, fmtDate, skillChips, escapeHtml } = require('../helpers');

function founderDashboard({ listings, requests }) {
  const openCount = listings.filter((l) => l.status === 'OPEN').length;
  const pendingCount = requests.filter((r) => r.status === 'PENDING' || r.status === 'NEGOTIATING').length;
  const agreedCount = requests.filter((r) => r.status === 'AGREED').length;

  return `
<div class="dash-shell">
  <div class="container">
    <div class="dash-head">
      <div>
        <h1>Your postings</h1>
        <div class="dash-sub">Manage opportunities and track interest from colleges.</div>
      </div>
      <a class="btn btn-primary" href="/founder/listings/new">+ Post new opportunity</a>
    </div>

    <div class="grid-3" style="margin-bottom:36px;">
      <div class="card"><div class="dash-sub">Open postings</div><h2 style="margin:4px 0 0;">${openCount}</h2></div>
      <div class="card"><div class="dash-sub">Requests awaiting you</div><h2 style="margin:4px 0 0; color:var(--warning);">${pendingCount}</h2></div>
      <div class="card"><div class="dash-sub">Agreements reached</div><h2 style="margin:4px 0 0; color:var(--success);">${agreedCount}</h2></div>
    </div>

    <div class="section-title-row">
      <h3 class="mb-0">Your listings</h3>
    </div>
    ${listings.length === 0
      ? `<div class="empty-state"><h3>No opportunities posted yet</h3><p>Post your first job, part-time role or task to start hearing from colleges.</p><a class="btn btn-primary" href="/founder/listings/new">Post an opportunity</a></div>`
      : `<div class="list-stack">
          ${listings.map((l) => `
            <div class="card card-hover listing-row">
              <div style="flex:1;">
                <div class="listing-meta">${badge(l.work_type, workTypeLabel(l.work_type))} ${badge(l.status)}</div>
                <h3 style="margin-bottom:4px;"><a href="/founder/listings/${l.id}" style="color:inherit;">${escapeHtml(l.title)}</a></h3>
                <p class="muted" style="margin-bottom:0; font-size:0.88rem;">${escapeHtml((l.description || '').slice(0, 140))}${l.description.length > 140 ? '…' : ''}</p>
                <div class="listing-skills">${skillChips(l.skills)}</div>
              </div>
              <div class="text-center" style="min-width:120px;">
                <div class="muted" style="font-size:0.78rem;">Posted ${fmtDate(l.created_at)}</div>
                <a class="btn btn-outline btn-sm" style="margin-top:10px;" href="/founder/listings/${l.id}">Manage →</a>
              </div>
            </div>`).join('')}
        </div>`
    }
  </div>
</div>`;
}

function listingNewPage({ error }) {
  const { alert } = require('../helpers');
  return `
<div class="dash-shell">
  <div class="container-narrow">
    <a href="/founder/dashboard" class="muted" style="font-size:0.85rem;">← Back to dashboard</a>
    <h1 style="margin-top:14px;">Post a new opportunity</h1>
    <p class="dash-sub" style="margin-bottom:28px;">Describe the work clearly — colleges will use this to decide whether to request it for their students.</p>
    ${alert(error, 'error')}
    <div class="card">
      <form data-api="/api/listings" data-method="POST" data-redirect="/founder/dashboard" data-success-msg="Opportunity posted.">
        <div class="field">
          <label>Title</label>
          <input type="text" name="title" required placeholder="e.g. Frontend developer — 3 month contract" />
        </div>
        <div class="field">
          <label>Type of work</label>
          <select name="workType" required>
            <option value="JOB">Full-time Job</option>
            <option value="PART_TIME">Part-time</option>
            <option value="TASK" selected>One-off Task</option>
          </select>
        </div>
        <div class="field">
          <label>Description</label>
          <textarea name="description" required placeholder="What needs to be done, expected outcomes, tools used…"></textarea>
        </div>
        <div class="field">
          <label>Required skills <span class="muted">(comma-separated)</span></label>
          <input type="text" name="skills" placeholder="e.g. React, Figma, Content Writing" />
        </div>
        <div class="form-row">
          <div class="field">
            <label>Budget indication <span class="muted">(optional)</span></label>
            <input type="text" name="budgetHint" placeholder="e.g. ₹15,000–₹25,000" />
          </div>
          <div class="field">
            <label>Students needed</label>
            <input type="number" name="headcount" min="1" value="1" />
          </div>
        </div>
        <div class="field">
          <label>Deadline <span class="muted">(optional)</span></label>
          <input type="date" name="deadline" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">Publish opportunity</button>
      </form>
    </div>
  </div>
</div>`;
}

function founderListingDetail({ listing, requests }) {
  return `
<div class="dash-shell">
  <div class="container">
    <a href="/founder/dashboard" class="muted" style="font-size:0.85rem;">← Back to dashboard</a>
    <div class="dash-head" style="margin-top:14px;">
      <div>
        <div class="listing-meta">${badge(listing.work_type, workTypeLabel(listing.work_type))} ${badge(listing.status)}</div>
        <h1>${escapeHtml(listing.title)}</h1>
      </div>
      ${listing.status === 'OPEN'
        ? `<button class="btn btn-danger" data-action="/api/listings/${listing.id}/close" data-method="POST" data-confirm="Close this listing to new requests?" data-reload>Close listing</button>`
        : ''}
    </div>

    <div class="detail-grid">
      <div>
        <div class="card">
          <h4 class="mt-0">Description</h4>
          <p style="white-space:pre-wrap;">${escapeHtml(listing.description)}</p>
          <div class="listing-skills">${skillChips(listing.skills)}</div>
        </div>

        <div class="section-title-row" style="margin-top:28px;">
          <h3 class="mb-0">Requests from colleges (${requests.length})</h3>
        </div>
        ${requests.length === 0
          ? `<div class="empty-state"><h3>No requests yet</h3><p>Colleges interested in this opportunity will appear here.</p></div>`
          : `<div class="list-stack">
              ${requests.map((r) => `
                <a href="/founder/requests/${r.id}" class="card card-hover listing-row" style="color:inherit;">
                  <div>
                    <div class="listing-meta">${badge(r.status)}</div>
                    <h4 style="margin-bottom:2px;">${escapeHtml(r.college_name || r.college_user_name)}</h4>
                    <div class="muted" style="font-size:0.85rem;">${r.proposed_fee ? `Proposed: ${escapeHtml(r.proposed_fee)}` : 'No fee proposed yet'}</div>
                  </div>
                  <div class="muted" style="font-size:0.8rem;">${fmtDate(r.created_at)}</div>
                </a>`).join('')}
            </div>`
        }
      </div>
      <div class="card">
        <h4 class="mt-0">Posting details</h4>
        <div class="info-row"><span class="k">Budget indication</span><span class="v">${escapeHtml(listing.budget_hint || '—')}</span></div>
        <div class="info-row"><span class="k">Students needed</span><span class="v">${listing.headcount || 1}</span></div>
        <div class="info-row"><span class="k">Deadline</span><span class="v">${listing.deadline ? fmtDate(listing.deadline) : '—'}</span></div>
        <div class="info-row"><span class="k">Posted</span><span class="v">${fmtDate(listing.created_at)}</span></div>
      </div>
    </div>
  </div>
</div>`;
}

function founderRequestsList({ requests }) {
  return `
<div class="dash-shell">
  <div class="container">
    <div class="dash-head">
      <div><h1>All requests</h1><div class="dash-sub">Every request received across your postings.</div></div>
    </div>
    ${requests.length === 0
      ? `<div class="empty-state"><h3>No requests yet</h3><p>Once colleges request your opportunities, they'll show up here.</p></div>`
      : `<div class="list-stack">
          ${requests.map((r) => `
            <a href="/founder/requests/${r.id}" class="card card-hover listing-row" style="color:inherit;">
              <div>
                <div class="listing-meta">${badge(r.status)} ${badge(r.work_type, workTypeLabel(r.work_type))}</div>
                <h4 style="margin-bottom:2px;">${escapeHtml(r.listing_title)}</h4>
                <div class="muted" style="font-size:0.85rem;">from ${escapeHtml(r.college_name || r.college_user_name)}</div>
              </div>
              <div class="muted" style="font-size:0.8rem;">${fmtDate(r.updated_at)}</div>
            </a>`).join('')}
        </div>`
    }
  </div>
</div>`;
}

module.exports = { founderDashboard, listingNewPage, founderListingDetail, founderRequestsList };
