'use strict';

const { badge, workTypeLabel, fmtDate, fmtDateTime, escapeHtml } = require('../helpers');

function messageBubble(m, currentUserId, requestId) {
  if (m.kind === 'SYSTEM') {
    return `<div class="msg msg-system">${escapeHtml(m.body)}</div>`;
  }
  const mine = m.sender_id === currentUserId;
  // Only the sender can delete, and only their own plain chat messages —
  // OFFER messages stay put since they're part of the negotiation record.
  const canDelete = mine && m.kind === 'MESSAGE';
  return `
    <div class="msg ${mine ? 'msg-me' : 'msg-them'}">
      <div class="msg-body-row">
        <div class="msg-body">${m.kind === 'OFFER' ? `<strong>${escapeHtml(m.body)}</strong>` : escapeHtml(m.body)}</div>
        ${canDelete ? `<button type="button" class="msg-delete" title="Delete message" aria-label="Delete message" data-action="/api/requests/${requestId}/messages/${m.id}/delete" data-method="POST" data-confirm="Delete this message?" data-reload>&times;</button>` : ''}
      </div>
      <div class="msg-meta">${escapeHtml(m.sender_name)} · ${fmtDateTime(m.created_at)}</div>
    </div>`;
}

function requestDetailPage({ user, request, messages, assignments, students }) {
  const isFounder = user.role === 'FOUNDER';
  const counterpartName = isFounder ? request.college_name || request.college_user_name : request.company_name || request.founder_user_name;
  const canAct = request.status === 'PENDING' || request.status === 'NEGOTIATING';
  const backHref = isFounder ? '/founder/requests' : '/college/requests';

  // Nobody can finalize a deal on their own: whoever proposes terms sets
  // offer_by, and only the OTHER party sees an "Accept" button. The person
  // who made the offer only sees a "waiting" state until then.
  const hasPendingOffer = !!(request.offer_by && request.offer_fee);
  const iMadeTheOffer = hasPendingOffer && request.offer_by === user.id;

  const agreementPanel =
    request.status === 'AGREED'
      ? `
      <div class="card" style="background:var(--success-soft); border-color:#cdeadb;">
        <div class="flex items-center gap-8" style="margin-bottom:8px;">
          ${badge('AGREED')}
          <strong style="color:var(--success);">Terms finalized</strong>
        </div>
        <div class="info-row"><span class="k">Final fee</span><span class="v">${escapeHtml(request.final_fee || '—')}</span></div>
        ${request.final_terms ? `<div class="info-row"><span class="k">Terms</span><span class="v">${escapeHtml(request.final_terms)}</span></div>` : ''}
      </div>`
      : canAct
      ? `
      <div class="card">
        ${hasPendingOffer
          ? iMadeTheOffer
            ? `
              <h4 class="mt-0">Offer sent</h4>
              <p class="muted" style="font-size:0.85rem;">Waiting for <strong>${escapeHtml(counterpartName)}</strong> to accept — they'll need to confirm before this is final.</p>
              <div class="info-row"><span class="k">Proposed fee</span><span class="v">${escapeHtml(request.offer_fee)}</span></div>
              ${request.offer_terms ? `<div class="info-row"><span class="k">Terms</span><span class="v">${escapeHtml(request.offer_terms)}</span></div>` : ''}
            `
            : `
              <h4 class="mt-0">Offer received</h4>
              <p class="muted" style="font-size:0.85rem;"><strong>${escapeHtml(counterpartName)}</strong> proposed:</p>
              <div class="info-row"><span class="k">Fee</span><span class="v">${escapeHtml(request.offer_fee)}</span></div>
              ${request.offer_terms ? `<div class="info-row"><span class="k">Terms</span><span class="v">${escapeHtml(request.offer_terms)}</span></div>` : ''}
              <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="/api/requests/${request.id}/offer/accept" data-method="POST" data-reload data-success-msg="Agreement finalized.">Accept this offer</button>
            `
          : `
              <h4 class="mt-0">Propose terms</h4>
              <p class="muted" style="font-size:0.85rem;">Once you're aligned on scope, propose a fee — <strong>${escapeHtml(counterpartName)}</strong> will need to accept it before it's final.</p>
            `}
        <form data-api="/api/requests/${request.id}/offer" data-method="POST" data-reload data-success-msg="Offer sent.">
          <div class="field" style="margin-top:${hasPendingOffer ? '14px' : '0'};">
            <label>${hasPendingOffer ? 'Propose different terms instead' : 'Fee'}</label>
            <input type="text" name="finalFee" required placeholder="e.g. ₹18,000" />
          </div>
          <div class="field">
            <label>Terms <span class="muted">(optional)</span></label>
            <textarea name="finalTerms" placeholder="Timeline, deliverables, payment schedule…"></textarea>
          </div>
          <button class="btn ${hasPendingOffer ? 'btn-outline' : 'btn-primary'} btn-block" type="submit">${hasPendingOffer ? 'Send counter-offer' : 'Send offer'}</button>
        </form>
        <button class="btn btn-danger btn-block" style="margin-top:10px;" data-action="/api/requests/${request.id}/decline" data-method="POST" data-confirm="Decline this request?" data-reload>Decline request</button>
      </div>`
      : `<div class="card">${badge(request.status)}</div>`;

  const assignmentSection =
    !isFounder && request.status === 'AGREED'
      ? `
      <div class="card">
        <h4 class="mt-0">Assign this work to students</h4>
        ${students.length === 0
          ? `<p class="muted">You haven't added any students yet. <a href="/college/students">Add students to your roster →</a></p>`
          : `
          <form data-api="/api/requests/${request.id}/assignments" data-method="POST" data-reload data-success-msg="Task assigned.">
            <div class="form-row">
              <div class="field">
                <label>Student</label>
                <select name="studentId" required>
                  <option value="">Select a student…</option>
                  ${students.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.email)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Task for this student</label>
                <input type="text" name="taskDesc" required placeholder="e.g. Build the hero section" />
              </div>
            </div>
            <button class="btn btn-outline" type="submit">Assign task</button>
          </form>`
        }
        ${assignments.length > 0 ? `
        <hr class="divider" />
        <table>
          <thead><tr><th>Student</th><th>Task</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${assignments.map((a) => `
              <tr>
                <td>${escapeHtml(a.student_name)}</td>
                <td>${escapeHtml(a.task_desc)}</td>
                <td>${badge(a.status)}</td>
                <td>
                  <select data-status-action="/api/assignments/${a.id}/status" data-reload style="width:auto; padding:6px 8px; font-size:0.78rem;">
                    ${['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'].map((s) => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}
      </div>`
      : isFounder && request.status === 'AGREED' && assignments.length > 0
      ? `
      <div class="card">
        <h4 class="mt-0">Work distribution (read-only)</h4>
        <table>
          <thead><tr><th>Student</th><th>Task</th><th>Status</th></tr></thead>
          <tbody>
            ${assignments.map((a) => `<tr><td>${escapeHtml(a.student_name)}</td><td>${escapeHtml(a.task_desc)}</td><td>${badge(a.status)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`
      : '';

  return `
<div class="dash-shell">
  <div class="container-narrow">
    <a href="${backHref}" class="muted" style="font-size:0.85rem;">← Back to requests</a>
    <div class="dash-head" style="margin-top:14px;">
      <div>
        <h1>${escapeHtml(request.listing_title)}</h1>
        <div class="dash-sub">${isFounder ? 'Request from' : 'Your request to'} <strong>${escapeHtml(counterpartName)}</strong> · ${badge(request.work_type, workTypeLabel(request.work_type))} ${badge(request.status)}</div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-col-main">
        <div class="card chat-card">
          <h4 class="mt-0">Negotiation thread</h4>
          <div class="chat-thread">
            ${messages.length ? messages.map((m) => messageBubble(m, user.id, request.id)).join('') : '<p class="muted">No messages yet. Say hello and outline what you need.</p>'}
          </div>
          ${canAct ? `
          <hr class="divider" />
          <form data-api="/api/requests/${request.id}/messages" data-method="POST" data-reload>
            <div class="flex gap-8">
              <input type="text" name="body" required placeholder="Write a message…" style="flex:1;" />
              <button class="btn btn-primary" type="submit">Send</button>
            </div>
          </form>` : ''}
        </div>
        ${assignmentSection}
      </div>
      <div class="list-stack">
        ${agreementPanel}
        <div class="card">
          <h4 class="mt-0">Opportunity details</h4>
          <p class="muted" style="font-size:0.88rem;">${escapeHtml(request.listing_description)}</p>
          ${request.proposed_fee ? `<div class="info-row"><span class="k">Proposed fee</span><span class="v">${escapeHtml(request.proposed_fee)}</span></div>` : ''}
          <div class="info-row"><span class="k">Requested on</span><span class="v">${fmtDate(request.created_at)}</span></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

module.exports = { requestDetailPage };
