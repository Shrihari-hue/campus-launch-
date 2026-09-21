'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { URL } = require('node:url');

const { Router } = require('./src/lib/router');
const { parseBody, sendJSON, sendHTML, redirect, escapeHtml } = require('./src/lib/http');
const { getCurrentUser, createSession, destroySession } = require('./src/lib/session');
const { hashPassword, verifyPassword } = require('./src/lib/auth');
const {
  Users,
  FounderProfiles,
  CollegeProfiles,
  Listings,
  Requests,
  Messages,
  Students,
  Assignments,
} = require('./src/db/repo');

const { page } = require('./src/render/layout');
const { landingPage } = require('./src/render/pages/landing');
const { loginPage, signupPage } = require('./src/render/pages/auth');
const { founderDashboard, listingNewPage, founderListingDetail, founderRequestsList } = require('./src/render/pages/founder');
const { collegeDashboard, collegeListingDetail, collegeRequestsList, collegeStudentsPage } = require('./src/render/pages/college');
const { requestDetailPage } = require('./src/render/pages/requestDetail');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const router = new Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireUser(req) {
  const user = getCurrentUser(req);
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  return user;
}

function requireRole(req, role) {
  const user = requireUser(req);
  if (user.role !== role) throw new HttpError(403, 'You do not have access to this area.');
  return user;
}

function notFoundHtml(user) {
  return page({
    title: 'Not found',
    user,
    body: `<div class="dash-shell"><div class="container-narrow text-center" style="padding:80px 0;">
      <h1>404</h1><p>That page doesn't exist.</p><a class="btn btn-primary" href="/">Go home</a>
    </div></div>`,
  });
}

// ---------------------------------------------------------------------------
// Public pages
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  const user = getCurrentUser(req);
  if (user) {
    return redirect(res, user.role === 'FOUNDER' ? '/founder/dashboard' : '/college/dashboard');
  }
  sendHTML(res, 200, page({ title: 'Connecting startups with campus talent', user: null, body: landingPage() }));
});

router.get('/login/:role', async (req, res, params) => {
  const roleKey = params.role;
  if (roleKey !== 'founder' && roleKey !== 'college') return notFound(req, res);
  const user = getCurrentUser(req);
  if (user) return redirect(res, user.role === 'FOUNDER' ? '/founder/dashboard' : '/college/dashboard');
  const role = roleKey.toUpperCase();
  sendHTML(res, 200, page({ title: `${role === 'FOUNDER' ? 'Founder' : 'College'} Login`, user: null, body: loginPage({ role, error: null }) }));
});

router.get('/signup/:role', async (req, res, params) => {
  const roleKey = params.role;
  if (roleKey !== 'founder' && roleKey !== 'college') return notFound(req, res);
  const user = getCurrentUser(req);
  if (user) return redirect(res, user.role === 'FOUNDER' ? '/founder/dashboard' : '/college/dashboard');
  const role = roleKey.toUpperCase();
  sendHTML(res, 200, page({ title: `${role === 'FOUNDER' ? 'Founder' : 'College'} Sign Up`, user: null, body: signupPage({ role, error: null }) }));
});

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

router.post('/api/auth/signup', async (req, res) => {
  const body = await parseBody(req);
  const { role, name, email, password } = body;
  if (!['FOUNDER', 'COLLEGE'].includes(role)) throw new HttpError(400, 'Invalid role.');
  if (!name || !email || !password) throw new HttpError(400, 'Please fill in all required fields.');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  if (Users.findByEmail(email)) throw new HttpError(400, 'An account with this email already exists.');

  const user = Users.create({ email, passwordHash: hashPassword(password), role, name });

  if (role === 'FOUNDER') {
    if (!body.companyName) throw new HttpError(400, 'Company name is required.');
    FounderProfiles.create({
      userId: user.id,
      companyName: body.companyName,
      website: body.website,
      industry: body.industry,
    });
  } else {
    if (!body.collegeName) throw new HttpError(400, 'College name is required.');
    CollegeProfiles.create({
      userId: user.id,
      collegeName: body.collegeName,
      city: body.city,
      placementContact: body.placementContact,
    });
  }

  createSession(res, user.id);
  sendJSON(res, 200, { ok: true });
});

router.post('/api/auth/login', async (req, res) => {
  const body = await parseBody(req);
  const { email, password, role } = body;
  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');
  const user = Users.findByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(400, 'Incorrect email or password.');
  }
  if (role && user.role !== role) {
    throw new HttpError(400, `This account is registered as a ${user.role === 'FOUNDER' ? 'Founder' : 'College'}. Please use the correct login.`);
  }
  createSession(res, user.id);
  sendJSON(res, 200, { ok: true });
});

router.post('/api/auth/logout', async (req, res) => {
  destroySession(req, res);
  sendJSON(res, 200, { ok: true });
});

// ---------------------------------------------------------------------------
// Founder pages
// ---------------------------------------------------------------------------

router.get('/founder/dashboard', async (req, res) => {
  const user = requireRole(req, 'FOUNDER');
  const listings = Listings.byFounder(user.id);
  const requests = Requests.byFounder(user.id);
  sendHTML(res, 200, page({ title: 'Founder Dashboard', user, body: founderDashboard({ listings, requests }) }));
});

router.get('/founder/listings/new', async (req, res) => {
  const user = requireRole(req, 'FOUNDER');
  sendHTML(res, 200, page({ title: 'Post an opportunity', user, body: listingNewPage({ error: null }) }));
});

router.get('/founder/listings/:id', async (req, res, params) => {
  const user = requireRole(req, 'FOUNDER');
  const listing = Listings.byId(params.id);
  if (!listing || listing.founder_id !== user.id) throw new HttpError(404, 'Listing not found.');
  const requests = Requests.byFounder(user.id).filter((r) => r.listing_id === listing.id);
  sendHTML(res, 200, page({ title: listing.title, user, body: founderListingDetail({ listing, requests }) }));
});

router.get('/founder/requests', async (req, res) => {
  const user = requireRole(req, 'FOUNDER');
  const requests = Requests.byFounder(user.id);
  sendHTML(res, 200, page({ title: 'Requests', user, body: founderRequestsList({ requests }) }));
});

router.get('/founder/requests/:id', async (req, res, params) => {
  const user = requireRole(req, 'FOUNDER');
  const request = Requests.byId(params.id);
  if (!request || request.founder_id !== user.id) throw new HttpError(404, 'Request not found.');
  const messages = Messages.byRequest(request.id);
  const assignments = Assignments.byRequest(request.id);
  sendHTML(res, 200, page({ title: request.listing_title, user, body: requestDetailPage({ user, request, messages, assignments, students: [] }) }));
});

// ---------------------------------------------------------------------------
// Founder API
// ---------------------------------------------------------------------------

router.post('/api/listings', async (req, res) => {
  const user = requireRole(req, 'FOUNDER');
  const body = await parseBody(req);
  if (!body.title || !body.workType || !body.description) throw new HttpError(400, 'Title, type and description are required.');
  if (!['JOB', 'PART_TIME', 'TASK'].includes(body.workType)) throw new HttpError(400, 'Invalid work type.');
  const listing = Listings.create({
    founderId: user.id,
    title: body.title,
    workType: body.workType,
    description: body.description,
    skills: body.skills,
    budgetHint: body.budgetHint,
    headcount: body.headcount ? parseInt(body.headcount, 10) : 1,
    deadline: body.deadline,
  });
  sendJSON(res, 200, { ok: true, id: listing.id });
});

router.post('/api/listings/:id/close', async (req, res, params) => {
  const user = requireRole(req, 'FOUNDER');
  const listing = Listings.byId(params.id);
  if (!listing || listing.founder_id !== user.id) throw new HttpError(404, 'Listing not found.');
  Listings.setStatus(listing.id, 'CLOSED');
  sendJSON(res, 200, { ok: true });
});

// ---------------------------------------------------------------------------
// College pages
// ---------------------------------------------------------------------------

router.get('/college/dashboard', async (req, res) => {
  const user = requireRole(req, 'COLLEGE');
  const listings = Listings.allOpen();
  const myRequests = Requests.byCollege(user.id);
  const requestedListingIds = new Set(myRequests.map((r) => r.listing_id));
  sendHTML(res, 200, page({ title: 'Browse Opportunities', user, body: collegeDashboard({ listings, requestedListingIds }) }));
});

router.get('/college/listings/:id', async (req, res, params) => {
  const user = requireRole(req, 'COLLEGE');
  const listing = Listings.byId(params.id);
  if (!listing) throw new HttpError(404, 'Listing not found.');
  const existingRequest = Requests.findByListingAndCollege(listing.id, user.id);
  sendHTML(res, 200, page({ title: listing.title, user, body: collegeListingDetail({ listing, existingRequest, error: null }) }));
});

router.get('/college/requests', async (req, res) => {
  const user = requireRole(req, 'COLLEGE');
  const requests = Requests.byCollege(user.id);
  sendHTML(res, 200, page({ title: 'My Requests', user, body: collegeRequestsList({ requests }) }));
});

router.get('/college/requests/:id', async (req, res, params) => {
  const user = requireRole(req, 'COLLEGE');
  const request = Requests.byId(params.id);
  if (!request || request.college_id !== user.id) throw new HttpError(404, 'Request not found.');
  const messages = Messages.byRequest(request.id);
  const assignments = Assignments.byRequest(request.id);
  const students = Students.byCollege(user.id);
  sendHTML(res, 200, page({ title: request.listing_title, user, body: requestDetailPage({ user, request, messages, assignments, students }) }));
});

router.get('/college/students', async (req, res) => {
  const user = requireRole(req, 'COLLEGE');
  const students = Students.byCollege(user.id);
  sendHTML(res, 200, page({ title: 'Student Roster', user, body: collegeStudentsPage({ students, error: null }) }));
});

// ---------------------------------------------------------------------------
// College API
// ---------------------------------------------------------------------------

router.post('/api/listings/:id/requests', async (req, res, params) => {
  const user = requireRole(req, 'COLLEGE');
  const listing = Listings.byId(params.id);
  if (!listing || listing.status !== 'OPEN') throw new HttpError(404, 'Listing not available.');
  const existing = Requests.findByListingAndCollege(listing.id, user.id);
  if (existing) throw new HttpError(400, 'You already sent a request for this opportunity.');
  const body = await parseBody(req);
  const request = Requests.create({
    listingId: listing.id,
    collegeId: user.id,
    proposedFee: body.proposedFee,
    note: body.note,
  });
  sendJSON(res, 200, { ok: true, id: request.id });
});

// ---------------------------------------------------------------------------
// Shared request (negotiation) API — usable by either party
// ---------------------------------------------------------------------------

function loadRequestForUser(user, id) {
  const request = Requests.byId(id);
  if (!request) throw new HttpError(404, 'Request not found.');
  const owns = (user.role === 'FOUNDER' && request.founder_id === user.id) || (user.role === 'COLLEGE' && request.college_id === user.id);
  if (!owns) throw new HttpError(403, 'You do not have access to this request.');
  return request;
}

router.post('/api/requests/:id/messages', async (req, res, params) => {
  const user = requireUser(req);
  const request = loadRequestForUser(user, params.id);
  const body = await parseBody(req);
  if (!body.body || !body.body.trim()) throw new HttpError(400, 'Message cannot be empty.');
  Messages.create({ requestId: request.id, senderId: user.id, body: body.body.trim(), kind: 'MESSAGE' });
  if (request.status === 'PENDING') Requests.updateStatus(request.id, 'NEGOTIATING');
  sendJSON(res, 200, { ok: true });
});

router.post('/api/requests/:id/agree', async (req, res, params) => {
  const user = requireUser(req);
  const request = loadRequestForUser(user, params.id);
  const body = await parseBody(req);
  if (!body.finalFee) throw new HttpError(400, 'Please enter the final fee.');
  Requests.agree(request.id, { finalFee: body.finalFee, finalTerms: body.finalTerms });
  Messages.create({
    requestId: request.id,
    senderId: user.id,
    body: `Agreement finalized — ${body.finalFee}${body.finalTerms ? ' · ' + body.finalTerms : ''}`,
    kind: 'SYSTEM',
  });
  sendJSON(res, 200, { ok: true });
});

router.post('/api/requests/:id/decline', async (req, res, params) => {
  const user = requireUser(req);
  const request = loadRequestForUser(user, params.id);
  Requests.updateStatus(request.id, 'DECLINED');
  Messages.create({ requestId: request.id, senderId: user.id, body: 'Request declined.', kind: 'SYSTEM' });
  sendJSON(res, 200, { ok: true });
});

router.post('/api/requests/:id/assignments', async (req, res, params) => {
  const user = requireRole(req, 'COLLEGE');
  const request = loadRequestForUser(user, params.id);
  if (request.status !== 'AGREED') throw new HttpError(400, 'Finalize the agreement before assigning students.');
  const body = await parseBody(req);
  if (!body.studentId || !body.taskDesc) throw new HttpError(400, 'Select a student and describe the task.');
  const student = Students.byId(body.studentId);
  if (!student || student.college_id !== user.id) throw new HttpError(403, 'Invalid student.');
  Assignments.create({ requestId: request.id, studentId: student.id, taskDesc: body.taskDesc });
  sendJSON(res, 200, { ok: true });
});

router.post('/api/assignments/:id/status', async (req, res, params) => {
  const user = requireRole(req, 'COLLEGE');
  const assignment = Assignments.byId(params.id);
  if (!assignment) throw new HttpError(404, 'Assignment not found.');
  const request = loadRequestForUser(user, assignment.request_id);
  const body = await parseBody(req);
  if (!['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'].includes(body.status)) throw new HttpError(400, 'Invalid status.');
  Assignments.setStatus(assignment.id, body.status);
  sendJSON(res, 200, { ok: true });
});

router.post('/api/students', async (req, res) => {
  const user = requireRole(req, 'COLLEGE');
  const body = await parseBody(req);
  if (!body.name || !body.email) throw new HttpError(400, 'Name and email are required.');
  Students.create({ collegeId: user.id, name: body.name, email: body.email, year: body.year, skills: body.skills });
  sendJSON(res, 200, { ok: true });
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

function serveStatic(req, res, pathname) {
  const rel = pathname.replace(/^\/static\//, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

function notFound(req, res) {
  const user = getCurrentUser(req);
  sendHTML(res, 404, notFoundHtml(user));
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsed.pathname);

    if (pathname.startsWith('/static/')) {
      return serveStatic(req, res, pathname);
    }

    const match = router.match(req.method, pathname);
    if (!match) return notFound(req, res);

    await match.handler(req, res, match.params);
  } catch (err) {
    if (err instanceof HttpError) {
      const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
      const isApi = req.url.startsWith('/api/');
      if (isApi || wantsJson) {
        return sendJSON(res, err.status, { error: err.message });
      }
      const user = getCurrentUser(req);
      return sendHTML(
        res,
        err.status,
        page({
          title: 'Error',
          user,
          body: `<div class="dash-shell"><div class="container-narrow text-center" style="padding:80px 0;">
            <h1>${err.status}</h1><p>${escapeHtml(err.message)}</p>
            <a class="btn btn-primary" href="/">Go home</a>
          </div></div>`,
        })
      );
    }
    console.error(err);
    if (req.url.startsWith('/api/')) {
      return sendJSON(res, 500, { error: 'Something went wrong on our end.' });
    }
    sendHTML(res, 500, `<h1>500</h1><p>Something went wrong.</p>`);
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✦ CampusLaunch is running');
  console.log(`  → http://localhost:${PORT}`);
  console.log('');
});
