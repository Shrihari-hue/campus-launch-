'use strict';

const { badge, workTypeLabel, fmtDate, skillChips, alert, escapeHtml } = require('../helpers');

function collegeDashboard({ listings, requestedListingIds }) {
  return `
<div class="dash-shell">
  <div class="container">
    <div class="dash-head">
      <div>
        <h1>Browse opportunities</h1>
        <div class="dash-sub">Open jobs, part-time roles and tasks posted by startup founders.</div>
      </div>
    </div>
    ${listings.length === 0
      ? `<div class="empty-state"><h3>No open opportunities right now</h3><p>Check back soon — founders post new work regularly.</p></div>`
      : `<div class="list-stack">
          ${listings.map((l) => {
            const already = requestedListingIds.has(l.id);
            return `
            <div class="card card-hover listing-row">
              <div style="flex:1;">
                <div class="listing-meta">${badge(l.work_type, workTypeLabel(l.work_type))} <span class="chip">${escapeHtml(l.company_name || l.founder_name)}</span></div>
                <h3 style="margin-bottom:4px;"><a href="/college/listings/${l.id}" style="color:inherit;">${escapeHtml(l.title)}</a></h3>
                <p class="muted" style="margin-bottom:0; font-size:0.88rem;">${escapeHtml((l.description || '').slice(0, 140))}${l.description.length > 140 ? '…' : ''}</p>
                <div class="listing-skills">${skillChips(l.skills)}</div>
              </div>
              <div class="text-center" style="min-width:140px;">
                <div class="muted" style="font-size:0.78rem;">${l.budget_hint ? escapeHtml(l.budget_hint) : 'Budget: TBD'}</div>
                ${already
                  ? `<span class="btn btn-ghost btn-sm" style="margin-top:10px; pointer-events:none;">Already requested</span>`
                  : `<a class="btn btn-primary btn-sm" style="margin-top:10px;" href="/college/listings/${l.id}">View &amp; request →</a>`}
              </div>
            </div>`;
          }).join('')}
        </div>`
    }
  </div>
</div>`;
}

function collegeListingDetail({ listing, existingRequest, error }) {
  return `
<div class="dash-shell">
  <div class="container-narrow">
    <a href="/college/dashboard" class="muted" style="font-size:0.85rem;">← Back to browse</a>
    <div style="margin-top:14px;">
      <div class="listing-meta">${badge(listing.work_type, workTypeLabel(listing.work_type))} <span class="chip">${escapeHtml(listing.company_name || listing.founder_name)}</span></div>
      <h1>${escapeHtml(listing.title)}</h1>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <p style="white-space:pre-wrap;">${escapeHtml(listing.description)}</p>
      <div class="listing-skills" style="margin-bottom:16px;">${skillChips(listing.skills)}</div>
      <div class="info-row"><span class="k">Budget indication</span><span class="v">${escapeHtml(listing.budget_hint || '—')}</span></div>
      <div class="info-row"><span class="k">Students needed</span><span class="v">${listing.headcount || 1}</span></div>
      <div class="info-row"><span class="k">Deadline</span><span class="v">${listing.deadline ? fmtDate(listing.deadline) : '—'}</span></div>
    </div>

    ${existingRequest
      ? `<div class="card" style="background:var(--info-soft); border-color:#d7e4f5;">
          <strong>You've already requested this opportunity.</strong>
          <p class="muted" style="margin:6px 0 0;">${badge(existingRequest.status)}</p>
          <a class="btn btn-outline btn-sm" style="margin-top:14px;" href="/college/requests/${existingRequest.id}">View negotiation →</a>
        </div>`
      : `<div class="card">
          <h4 class="mt-0">Send a request</h4>
          <p class="muted" style="font-size:0.85rem;">Introduce your college and propose a starting fee — you'll be able to negotiate details afterwards.</p>
          ${alert(error, 'error')}
          <form data-api="/api/listings/${listing.id}/requests" data-method="POST" data-redirect="/college/requests" data-success-msg="Request sent.">
            <div class="field">
              <label>Proposed fee <span class="muted">(optional, negotiable)</span></label>
              <input type="text" name="proposedFee" placeholder="e.g. ₹15,000" />
            </div>
            <div class="field">
              <label>Note to the founder</label>
              <textarea name="note" placeholder="Tell them why your students are a great fit…"></textarea>
            </div>
            <button class="btn btn-primary btn-block" type="submit">Send request</button>
          </form>
        </div>`
    }
  </div>
</div>`;
}

function collegeRequestsList({ requests }) {
  return `
<div class="dash-shell">
  <div class="container">
    <div class="dash-head">
      <div><h1>My requests</h1><div class="dash-sub">Track negotiations and agreements with founders.</div></div>
    </div>
    ${requests.length === 0
      ? `<div class="empty-state"><h3>No requests sent yet</h3><p>Browse open opportunities and send your first request.</p><a class="btn btn-primary" href="/college/dashboard">Browse opportunities</a></div>`
      : `<div class="list-stack">
          ${requests.map((r) => `
            <a href="/college/requests/${r.id}" class="card card-hover listing-row" style="color:inherit;">
              <div>
                <div class="listing-meta">${badge(r.status)} ${badge(r.work_type, workTypeLabel(r.work_type))}</div>
                <h4 style="margin-bottom:2px;">${escapeHtml(r.listing_title)}</h4>
                <div class="muted" style="font-size:0.85rem;">with ${escapeHtml(r.company_name || r.founder_user_name)}</div>
              </div>
              <div class="muted" style="font-size:0.8rem;">${fmtDate(r.updated_at)}</div>
            </a>`).join('')}
        </div>`
    }
  </div>
</div>`;
}

function collegeStudentsPage({ students, error }) {
  return `
<div class="dash-shell">
  <div class="container">
    <div class="dash-head">
      <div><h1>Student roster</h1><div class="dash-sub">Add students so you can assign them tasks once an agreement is reached.</div></div>
    </div>
    <div class="detail-grid">
      <div>
        ${students.length === 0
          ? `<div class="empty-state"><h3>No students added yet</h3><p>Add your first student using the form.</p></div>`
          : `<div class="card">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Year</th><th>Skills</th></tr></thead>
                <tbody>
                  ${students.map((s) => `
                    <tr>
                      <td>${escapeHtml(s.name)}</td>
                      <td>${escapeHtml(s.email)}</td>
                      <td>${escapeHtml(s.year || '—')}</td>
                      <td>${escapeHtml(s.skills || '—')}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>
      <div class="card">
        <h4 class="mt-0">Add a student</h4>
        ${alert(error, 'error')}
        <form data-api="/api/students" data-method="POST" data-reload data-success-msg="Student added.">
          <div class="field">
            <label>Full name</label>
            <input type="text" name="name" required placeholder="e.g. Rohan Mehta" />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" required placeholder="student@college.edu" />
          </div>
          <div class="field">
            <label>Year / Branch <span class="muted">(optional)</span></label>
            <input type="text" name="year" placeholder="e.g. 3rd Year, CSE" />
          </div>
          <div class="field">
            <label>Skills <span class="muted">(comma-separated)</span></label>
            <input type="text" name="skills" placeholder="e.g. React, Python" />
          </div>
          <button class="btn btn-outline btn-block" type="submit">Add student</button>
        </form>
      </div>
    </div>
  </div>
</div>`;
}

module.exports = { collegeDashboard, collegeListingDetail, collegeRequestsList, collegeStudentsPage };
