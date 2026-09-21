'use strict';

const { parseCookies, setCookie, clearCookie } = require('./http');
const { newToken } = require('./auth');
const { Sessions, Users } = require('../db/repo');

const COOKIE_NAME = 'cl_session';
const SESSION_DAYS = 14;

function createSession(res, userId) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  Sessions.create({ token, userId, expiresAt: expires.toISOString() });
  setCookie(res, COOKIE_NAME, token, { expires });
  return token;
}

function destroySession(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) Sessions.destroy(token);
  clearCookie(res, COOKIE_NAME);
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const session = Sessions.find(token);
  if (!session) return null;
  return Users.findById(session.user_id);
}

module.exports = { createSession, destroySession, getCurrentUser, COOKIE_NAME };
