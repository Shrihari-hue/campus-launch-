'use strict';

const db = require('./index');

function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}
function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}
function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

// ---------- Users ----------
const Users = {
  create({ email, passwordHash, role, name }) {
    const info = run(
      `INSERT INTO users (email, password_hash, role, name) VALUES (?,?,?,?)`,
      [email.toLowerCase().trim(), passwordHash, role, name]
    );
    return get(`SELECT * FROM users WHERE id = ?`, [info.lastInsertRowid]);
  },
  findByEmail(email) {
    return get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
  },
  findById(id) {
    return get(`SELECT * FROM users WHERE id = ?`, [id]);
  },
};

const FounderProfiles = {
  create({ userId, companyName, website, bio, industry }) {
    run(
      `INSERT INTO founder_profiles (user_id, company_name, website, bio, industry) VALUES (?,?,?,?,?)`,
      [userId, companyName, website || null, bio || null, industry || null]
    );
    return FounderProfiles.byUserId(userId);
  },
  byUserId(userId) {
    return get(`SELECT * FROM founder_profiles WHERE user_id = ?`, [userId]);
  },
};

const CollegeProfiles = {
  create({ userId, collegeName, city, bio, placementContact }) {
    run(
      `INSERT INTO college_profiles (user_id, college_name, city, bio, placement_contact) VALUES (?,?,?,?,?)`,
      [userId, collegeName, city || null, bio || null, placementContact || null]
    );
    return CollegeProfiles.byUserId(userId);
  },
  byUserId(userId) {
    return get(`SELECT * FROM college_profiles WHERE user_id = ?`, [userId]);
  },
};

// ---------- Sessions ----------
const Sessions = {
  create({ token, userId, expiresAt }) {
    run(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)`, [
      token,
      userId,
      expiresAt,
    ]);
  },
  find(token) {
    return get(
      `SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')`,
      [token]
    );
  },
  destroy(token) {
    run(`DELETE FROM sessions WHERE token = ?`, [token]);
  },
};

// ---------- Listings ----------
const Listings = {
  create({ founderId, title, workType, description, skills, budgetHint, headcount, deadline }) {
    const info = run(
      `INSERT INTO listings (founder_id, title, work_type, description, skills, budget_hint, headcount, deadline)
       VALUES (?,?,?,?,?,?,?,?)`,
      [founderId, title, workType, description, skills || null, budgetHint || null, headcount || 1, deadline || null]
    );
    return Listings.byId(info.lastInsertRowid);
  },
  byId(id) {
    return get(
      `SELECT l.*, u.name as founder_name, fp.company_name, fp.industry
       FROM listings l
       JOIN users u ON u.id = l.founder_id
       LEFT JOIN founder_profiles fp ON fp.user_id = l.founder_id
       WHERE l.id = ?`,
      [id]
    );
  },
  allOpen() {
    return all(
      `SELECT l.*, u.name as founder_name, fp.company_name, fp.industry
       FROM listings l
       JOIN users u ON u.id = l.founder_id
       LEFT JOIN founder_profiles fp ON fp.user_id = l.founder_id
       WHERE l.status = 'OPEN'
       ORDER BY l.created_at DESC`
    );
  },
  byFounder(founderId) {
    return all(
      `SELECT * FROM listings WHERE founder_id = ? ORDER BY created_at DESC`,
      [founderId]
    );
  },
  setStatus(id, status) {
    run(`UPDATE listings SET status = ? WHERE id = ?`, [status, id]);
  },
};

// ---------- Requests ----------
const Requests = {
  create({ listingId, collegeId, proposedFee, note }) {
    const info = run(
      `INSERT INTO requests (listing_id, college_id, proposed_fee, status) VALUES (?,?,?, 'PENDING')`,
      [listingId, collegeId, proposedFee || null]
    );
    const reqId = info.lastInsertRowid;
    if (note) {
      Messages.create({ requestId: reqId, senderId: collegeId, body: note, kind: 'MESSAGE' });
    }
    return Requests.byId(reqId);
  },
  byId(id) {
    return get(
      `SELECT r.*, l.title as listing_title, l.work_type, l.founder_id, l.description as listing_description,
              cu.name as college_user_name, cp.college_name,
              fu.name as founder_user_name, fp.company_name
       FROM requests r
       JOIN listings l ON l.id = r.listing_id
       JOIN users cu ON cu.id = r.college_id
       LEFT JOIN college_profiles cp ON cp.user_id = r.college_id
       JOIN users fu ON fu.id = l.founder_id
       LEFT JOIN founder_profiles fp ON fp.user_id = l.founder_id
       WHERE r.id = ?`,
      [id]
    );
  },
  findByListingAndCollege(listingId, collegeId) {
    return get(`SELECT * FROM requests WHERE listing_id = ? AND college_id = ?`, [listingId, collegeId]);
  },
  byCollege(collegeId) {
    return all(
      `SELECT r.*, l.title as listing_title, l.work_type, l.founder_id, fu.name as founder_user_name, fp.company_name
       FROM requests r
       JOIN listings l ON l.id = r.listing_id
       JOIN users fu ON fu.id = l.founder_id
       LEFT JOIN founder_profiles fp ON fp.user_id = l.founder_id
       WHERE r.college_id = ?
       ORDER BY r.updated_at DESC`,
      [collegeId]
    );
  },
  byFounder(founderId) {
    return all(
      `SELECT r.*, l.title as listing_title, l.work_type, cu.name as college_user_name, cp.college_name
       FROM requests r
       JOIN listings l ON l.id = r.listing_id
       JOIN users cu ON cu.id = r.college_id
       LEFT JOIN college_profiles cp ON cp.user_id = r.college_id
       WHERE l.founder_id = ?
       ORDER BY r.updated_at DESC`,
      [founderId]
    );
  },
  updateStatus(id, status) {
    run(`UPDATE requests SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id]);
  },
  agree(id, { finalFee, finalTerms }) {
    run(
      `UPDATE requests SET status = 'AGREED', final_fee = ?, final_terms = ?,
         offer_fee = NULL, offer_terms = NULL, offer_by = NULL, updated_at = datetime('now')
       WHERE id = ?`,
      [finalFee, finalTerms || null, id]
    );
  },
  // Propose (or counter-propose) terms. Either party can call this; it always
  // records who made the offer, so only the OTHER party can accept it —
  // nobody can unilaterally finalize an agreement.
  makeOffer(id, { fee, terms, byUserId }) {
    run(
      `UPDATE requests SET offer_fee = ?, offer_terms = ?, offer_by = ?, updated_at = datetime('now') WHERE id = ?`,
      [fee, terms || null, byUserId, id]
    );
  },
  clearOffer(id) {
    run(`UPDATE requests SET offer_fee = NULL, offer_terms = NULL, offer_by = NULL WHERE id = ?`, [id]);
  },
};

// ---------- Messages ----------
const Messages = {
  create({ requestId, senderId, body, kind }) {
    run(`INSERT INTO messages (request_id, sender_id, body, kind) VALUES (?,?,?,?)`, [
      requestId,
      senderId,
      body,
      kind || 'MESSAGE',
    ]);
    run(`UPDATE requests SET updated_at = datetime('now') WHERE id = ?`, [requestId]);
  },
  byRequest(requestId) {
    return all(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.request_id = ? ORDER BY m.created_at ASC`,
      [requestId]
    );
  },
  byId(id) {
    return get(`SELECT * FROM messages WHERE id = ?`, [id]);
  },
  deleteById(id) {
    run(`DELETE FROM messages WHERE id = ?`, [id]);
  },
};

// ---------- Students ----------
const Students = {
  create({ collegeId, name, email, year, skills }) {
    const info = run(
      `INSERT INTO students (college_id, name, email, year, skills) VALUES (?,?,?,?,?)`,
      [collegeId, name, email, year || null, skills || null]
    );
    return get(`SELECT * FROM students WHERE id = ?`, [info.lastInsertRowid]);
  },
  byCollege(collegeId) {
    return all(`SELECT * FROM students WHERE college_id = ? ORDER BY name ASC`, [collegeId]);
  },
  byId(id) {
    return get(`SELECT * FROM students WHERE id = ?`, [id]);
  },
};

// ---------- Assignments ----------
const Assignments = {
  create({ requestId, studentId, taskDesc }) {
    const info = run(
      `INSERT INTO assignments (request_id, student_id, task_desc) VALUES (?,?,?)`,
      [requestId, studentId, taskDesc]
    );
    return get(`SELECT * FROM assignments WHERE id = ?`, [info.lastInsertRowid]);
  },
  byRequest(requestId) {
    return all(
      `SELECT a.*, s.name as student_name, s.email as student_email
       FROM assignments a JOIN students s ON s.id = a.student_id
       WHERE a.request_id = ? ORDER BY a.created_at DESC`,
      [requestId]
    );
  },
  setStatus(id, status) {
    run(`UPDATE assignments SET status = ? WHERE id = ?`, [status, id]);
  },
  byId(id) {
    return get(`SELECT * FROM assignments WHERE id = ?`, [id]);
  },
};

module.exports = {
  Users,
  FounderProfiles,
  CollegeProfiles,
  Sessions,
  Listings,
  Requests,
  Messages,
  Students,
  Assignments,
};
