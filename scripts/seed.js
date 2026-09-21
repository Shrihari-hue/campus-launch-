'use strict';

// Seeds demo data so you can explore CampusLaunch immediately.
// Run with: npm run seed

const db = require('../src/db');
const { hashPassword } = require('../src/lib/auth');
const {
  Users,
  FounderProfiles,
  CollegeProfiles,
  Listings,
  Requests,
  Messages,
  Students,
  Assignments,
} = require('../src/db/repo');

function reset() {
  db.exec(`
    DELETE FROM assignments;
    DELETE FROM messages;
    DELETE FROM requests;
    DELETE FROM students;
    DELETE FROM listings;
    DELETE FROM college_profiles;
    DELETE FROM founder_profiles;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
}

function seed() {
  reset();

  const founder1 = Users.create({ email: 'ananya@loopwave.io', passwordHash: hashPassword('founder123'), role: 'FOUNDER', name: 'Ananya Rao' });
  FounderProfiles.create({ userId: founder1.id, companyName: 'Loopwave Labs', industry: 'Consumer SaaS', website: 'https://loopwave.io' });

  const founder2 = Users.create({ email: 'karthik@finpilot.in', passwordHash: hashPassword('founder123'), role: 'FOUNDER', name: 'Karthik Iyer' });
  FounderProfiles.create({ userId: founder2.id, companyName: 'FinPilot', industry: 'Fintech', website: 'https://finpilot.in' });

  const college1 = Users.create({ email: 'placements@svce.edu', passwordHash: hashPassword('college123'), role: 'COLLEGE', name: 'Dr. Priya Menon' });
  CollegeProfiles.create({ userId: college1.id, collegeName: 'Sri Venkateswara College of Engineering', city: 'Bengaluru', placementContact: 'Dr. Priya Menon · +91 98450 12345' });

  const college2 = Users.create({ email: 'tpo@nitc-alumni.edu', passwordHash: hashPassword('college123'), role: 'COLLEGE', name: 'Arjun Nair' });
  CollegeProfiles.create({ userId: college2.id, collegeName: 'National Institute of Technology, Calicut', city: 'Kozhikode', placementContact: 'Arjun Nair, TPO' });

  const l1 = Listings.create({
    founderId: founder1.id,
    title: 'Landing page redesign for our SaaS product',
    workType: 'TASK',
    description: 'We need our marketing landing page redesigned — modern, conversion-focused, mobile-first. Figma files provided; implementation in plain HTML/CSS is enough for now.',
    skills: 'Figma, HTML/CSS, UI Design',
    budgetHint: '₹15,000–₹25,000',
    headcount: 2,
    deadline: null,
  });

  const l2 = Listings.create({
    founderId: founder1.id,
    title: 'Part-time social media & content intern',
    workType: 'PART_TIME',
    description: 'Manage our Instagram and LinkedIn content calendar, write 3 posts/week, and track basic engagement metrics. Great fit for a student interested in marketing.',
    skills: 'Content Writing, Canva, Social Media',
    budgetHint: '₹8,000/month',
    headcount: 1,
    deadline: null,
  });

  const l3 = Listings.create({
    founderId: founder2.id,
    title: 'React Native developer — 3 month contract',
    workType: 'JOB',
    description: 'Help us build two new screens in our personal-finance app: a budgeting dashboard and a goals tracker. Existing codebase in React Native + TypeScript.',
    skills: 'React Native, TypeScript, REST APIs',
    budgetHint: '₹40,000/month',
    headcount: 1,
    deadline: null,
  });

  // Students for college1
  const s1 = Students.create({ collegeId: college1.id, name: 'Rohan Mehta', email: 'rohan.mehta@svce.edu', year: '3rd Year, CSE', skills: 'React, Figma, HTML/CSS' });
  const s2 = Students.create({ collegeId: college1.id, name: 'Sneha Kulkarni', email: 'sneha.kulkarni@svce.edu', year: '4th Year, CSE', skills: 'UI Design, Figma' });
  Students.create({ collegeId: college1.id, name: 'Aditya Verma', email: 'aditya.verma@svce.edu', year: '2nd Year, ISE', skills: 'Content Writing, Canva' });

  // Students for college2
  Students.create({ collegeId: college2.id, name: 'Meera Pillai', email: 'meera.pillai@nitc.ac.in', year: '4th Year, CSE', skills: 'React Native, TypeScript' });

  // A request already negotiated & agreed (college1 -> l1), with assignments, to showcase the full flow.
  const r1 = Requests.create({
    listingId: l1.id,
    collegeId: college1.id,
    proposedFee: '₹18,000',
    note: "We have two final-year design students who've shipped similar redesigns before — happy to share portfolios.",
  });
  Requests.updateStatus(r1.id, 'NEGOTIATING');
  Messages.create({ requestId: r1.id, senderId: founder1.id, body: 'Sounds great — could you share the portfolios? Also, can we do it in 2 weeks?', kind: 'MESSAGE' });
  Messages.create({ requestId: r1.id, senderId: college1.id, body: 'Yes, 2 weeks works. Sharing portfolios over email shortly.', kind: 'MESSAGE' });
  Requests.agree(r1.id, { finalFee: '₹18,000', finalTerms: '2-week turnaround, 1 revision round included' });
  Messages.create({ requestId: r1.id, senderId: college1.id, body: 'Agreement finalized — ₹18,000 · 2-week turnaround, 1 revision round included', kind: 'SYSTEM' });
  Assignments.create({ requestId: r1.id, studentId: s1.id, taskDesc: 'Build the hero section and navigation' });
  Assignments.create({ requestId: r1.id, studentId: s2.id, taskDesc: 'Design and build the pricing + footer sections' });

  // A pending request (college2 -> l3) to showcase the negotiation-not-yet-started state.
  Requests.create({
    listingId: l3.id,
    collegeId: college2.id,
    proposedFee: '₹35,000/month',
    note: 'We have a strong React Native student who interned at a fintech startup last summer.',
  });

  console.log('');
  console.log('  ✦ Demo data seeded.');
  console.log('');
  console.log('  Founder logins:');
  console.log('    ananya@loopwave.io / founder123   (Loopwave Labs)');
  console.log('    karthik@finpilot.in / founder123  (FinPilot)');
  console.log('');
  console.log('  College logins:');
  console.log('    placements@svce.edu / college123  (SVCE, Bengaluru)');
  console.log('    tpo@nitc-alumni.edu / college123  (NIT Calicut)');
  console.log('');
}

seed();
