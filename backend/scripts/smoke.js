const app = require('../app');
const http = require('http');
const { makeRegisterPayload } = require('./testData');

function fmt(name, status, note = '') {
  const suffix = note ? ` | ${note}` : '';
  console.log(`${name} | ${status}${suffix}`);
}

function request(base, path, method = 'GET', body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = {};
          }
          resolve({ status: res.statusCode || 0, data });
        });
      },
    );
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function run() {
  const server = app.listen(5060, '127.0.0.1', async () => {
    const base = 'http://127.0.0.1:5060';
    const ts = Date.now();
    let failed = false;

    try {
      const health = await request('http://127.0.0.1:5060', '/health');
      fmt('health', health.status);

      const business = makeRegisterPayload({
        name: 'Smoke Business',
        email: `smoke.biz.${ts}@test.com`,
        password: 'Password123',
        role: 'business',
        seed: ts + 1,
      });
      const freelancer = makeRegisterPayload({
        name: 'Smoke Freelancer',
        email: `smoke.free.${ts}@test.com`,
        password: 'Password123',
        role: 'freelancer',
        seed: ts + 2,
      });
      const freelancer2 = makeRegisterPayload({
        name: 'Smoke Freelancer 2',
        email: `smoke.free2.${ts}@test.com`,
        password: 'Password123',
        role: 'freelancer',
        seed: ts + 3,
      });

      let r = await request(base, '/api/auth/register', 'POST', business);
      fmt('register_business', r.status);
      if (r.status !== 201) failed = true;

      r = await request(base, '/api/auth/register', 'POST', freelancer);
      fmt('register_freelancer', r.status);
      if (r.status !== 201) failed = true;

      r = await request(base, '/api/auth/register', 'POST', freelancer2);
      fmt('register_freelancer2', r.status);
      if (r.status !== 201) failed = true;

      const bLogin = await request(base, '/api/auth/login', 'POST', {
        email: business.email,
        password: business.password,
      });
      fmt('login_business', bLogin.status);
      if (bLogin.status !== 200) failed = true;
      const businessToken = bLogin.data.token;

      const fLogin = await request(base, '/api/auth/login', 'POST', {
        email: freelancer.email,
        password: freelancer.password,
      });
      fmt('login_freelancer', fLogin.status);
      if (fLogin.status !== 200) failed = true;
      const freelancerToken = fLogin.data.token;

      const f2Login = await request(base, '/api/auth/login', 'POST', {
        email: freelancer2.email,
        password: freelancer2.password,
      });
      fmt('login_freelancer2', f2Login.status);
      if (f2Login.status !== 200) failed = true;
      const freelancer2Token = f2Login.data.token;

      const created = await request(
        base,
        '/api/projects',
        'POST',
        {
          title: 'Smoke Project',
          description:
            'Smoke test fixed-price project for Open to Assigned to Submitted to Completed.',
          budget: 1200,
          skillsRequired: 'react,nodejs',
          deadline: '2026-04-01',
        },
        businessToken,
      );
      fmt('create_project', created.status);
      if (created.status !== 201) failed = true;
      const projectId = created.data.project?.id;

      const openList = await request(base, '/api/projects?status=Open', 'GET', undefined, freelancerToken);
      fmt('list_open_projects', openList.status, `count:${openList.data.projects?.length ?? 0}`);
      if (openList.status !== 200) failed = true;

      const businessApplyForbidden = await request(
        base,
        `/api/projects/${projectId}/apply`,
        'POST',
        { coverLetter: 'Trying to apply as business' },
        businessToken,
      );
      fmt('business_apply_forbidden', businessApplyForbidden.status);
      if (businessApplyForbidden.status !== 403) failed = true;

      const applied = await request(
        base,
        `/api/projects/${projectId}/apply`,
        'POST',
        { coverLetter: 'I can deliver this project with quality and speed.' },
        freelancerToken,
      );
      fmt('apply_project', applied.status, applied.data.application?.status);
      if (applied.status !== 201 || applied.data.application?.status !== 'Pending') failed = true;

      const duplicateApply = await request(
        base,
        `/api/projects/${projectId}/apply`,
        'POST',
        { coverLetter: 'Duplicate apply should fail.' },
        freelancerToken,
      );
      fmt('duplicate_apply_blocked', duplicateApply.status);
      if (duplicateApply.status !== 409) failed = true;

      const secondApplied = await request(
        base,
        `/api/projects/${projectId}/apply`,
        'POST',
        { coverLetter: 'Another freelancer applied.' },
        freelancer2Token,
      );
      fmt('second_apply_project', secondApplied.status);
      if (secondApplied.status !== 201) failed = true;

      const businessViewApplications = await request(
        base,
        `/api/projects/${projectId}/applications`,
        'GET',
        undefined,
        businessToken,
      );
      fmt('list_applications_business', businessViewApplications.status, `count:${businessViewApplications.data.applications?.length ?? 0}`);
      if (businessViewApplications.status !== 200 || (businessViewApplications.data.applications?.length ?? 0) < 2) failed = true;

      const chosenApplicationId = businessViewApplications.data.applications?.find((app) => app.freelancerEmail === freelancer.email)?.id;
      const acceptApplication = await request(
        base,
        `/api/projects/${projectId}/applications/${chosenApplicationId}/accept`,
        'PUT',
        {},
        businessToken,
      );
      fmt('accept_application', acceptApplication.status, acceptApplication.data.project?.status);
      if (acceptApplication.status !== 200 || acceptApplication.data.project?.status !== 'Assigned') failed = true;

      const businessNotifications = await request(base, '/api/notifications', 'GET', undefined, businessToken);
      fmt('business_notifications_after_apply', businessNotifications.status, `unread:${businessNotifications.data.unreadCount ?? 0}`);
      if (businessNotifications.status !== 200 || (businessNotifications.data.unreadCount ?? 0) < 1) failed = true;

      const unassignedSubmit = await request(
        base,
        `/api/projects/${projectId}/submit`,
        'PUT',
        { submissionText: 'Unauthorized submit attempt' },
        freelancer2Token,
      );
      fmt('unassigned_submit_forbidden', unassignedSubmit.status);
      if (unassignedSubmit.status !== 403) failed = true;

      const submitted = await request(
        base,
        `/api/projects/${projectId}/submit`,
        'PUT',
        { submissionText: 'Delivered all assets and deployment notes.' },
        freelancerToken,
      );
      fmt('submit_project', submitted.status, submitted.data.project?.status);
      if (submitted.status !== 200 || submitted.data.project?.status !== 'Submitted') failed = true;

      const freelancerFundForbidden = await request(base, `/api/projects/${projectId}/fund`, 'PUT', {}, freelancerToken);
      fmt('freelancer_fund_forbidden', freelancerFundForbidden.status);
      if (freelancerFundForbidden.status !== 403) failed = true;

      const funded = await request(base, `/api/projects/${projectId}/fund`, 'PUT', {}, businessToken);
      fmt('fund_escrow', funded.status, funded.data.payment?.status);
      if (funded.status !== 200 || funded.data.payment?.status !== 'Funded') failed = true;

      const businessCompleteBeforeRelease = await request(base, `/api/projects/${projectId}/complete`, 'PUT', {}, businessToken);
      fmt('complete_before_release_blocked', businessCompleteBeforeRelease.status);
      if (businessCompleteBeforeRelease.status !== 400) failed = true;

      const released = await request(base, `/api/projects/${projectId}/release`, 'PUT', {}, businessToken);
      fmt('release_escrow', released.status, released.data.payment?.status);
      if (released.status !== 200 || released.data.payment?.status !== 'Released') failed = true;

      const tipped = await request(
        base,
        `/api/projects/${projectId}/tip`,
        'PUT',
        { tipAmount: 250, note: 'Great communication and polish' },
        businessToken,
      );
      fmt('add_tip', tipped.status, `${tipped.data.payment?.tipTotal ?? 0}`);
      if (tipped.status !== 200 || Number(tipped.data.payment?.tipTotal || 0) < 250) failed = true;

      const paymentDetail = await request(base, `/api/projects/${projectId}/payment`, 'GET', undefined, businessToken);
      fmt('payment_detail', paymentDetail.status, `tx:${paymentDetail.data.transactions?.length ?? 0}`);
      if (paymentDetail.status !== 200 || (paymentDetail.data.transactions?.length ?? 0) < 3) failed = true;

      const forbiddenMessages = await request(
        base,
        `/api/messages/projects/${projectId}`,
        'GET',
        undefined,
        freelancer2Token,
      );
      fmt('outsider_messages_forbidden', forbiddenMessages.status);
      if (forbiddenMessages.status !== 403) failed = true;

      const messageByFreelancer = await request(
        base,
        `/api/messages/projects/${projectId}`,
        'POST',
        { messageText: 'Work submitted. Please review and confirm.' },
        freelancerToken,
      );
      fmt('send_message_freelancer', messageByFreelancer.status);
      if (messageByFreelancer.status !== 201) failed = true;

      const messagesForBusiness = await request(
        base,
        `/api/messages/projects/${projectId}`,
        'GET',
        undefined,
        businessToken,
      );
      fmt('list_messages_business', messagesForBusiness.status, `count:${messagesForBusiness.data.messages?.length ?? 0}`);
      if (messagesForBusiness.status !== 200 || !messagesForBusiness.data.messages?.length) failed = true;

      const firstNotificationId = businessNotifications.data.notifications?.[0]?.id;
      if (firstNotificationId) {
        const markOne = await request(base, `/api/notifications/${firstNotificationId}/read`, 'PUT', {}, businessToken);
        fmt('mark_one_notification_read', markOne.status);
        if (markOne.status !== 200) failed = true;
      }

      const markAll = await request(base, '/api/notifications/read-all', 'PUT', {}, businessToken);
      fmt('mark_all_notifications_read', markAll.status);
      if (markAll.status !== 200) failed = true;

      const forbiddenComplete = await request(
        base,
        `/api/projects/${projectId}/complete`,
        'PUT',
        {},
        freelancerToken,
      );
      fmt('freelancer_complete_forbidden', forbiddenComplete.status);
      if (forbiddenComplete.status !== 403) failed = true;

      const completed = await request(base, `/api/projects/${projectId}/complete`, 'PUT', {}, businessToken);
      fmt('complete_project', completed.status, completed.data.project?.status);
      if (completed.status !== 200 || completed.data.project?.status !== 'Completed') failed = true;

      const businessRateFreelancer = await request(
        base,
        `/api/ratings/projects/${projectId}`,
        'POST',
        { rating: 5, reviewText: 'Great delivery and communication.' },
        businessToken,
      );
      fmt('business_submit_rating', businessRateFreelancer.status);
      if (businessRateFreelancer.status !== 201) failed = true;

      const duplicateBusinessRating = await request(
        base,
        `/api/ratings/projects/${projectId}`,
        'POST',
        { rating: 4, reviewText: 'Second rating should fail.' },
        businessToken,
      );
      fmt('duplicate_rating_blocked', duplicateBusinessRating.status);
      if (duplicateBusinessRating.status !== 409) failed = true;

      const freelancerRateBusiness = await request(
        base,
        `/api/ratings/projects/${projectId}`,
        'POST',
        { rating: 5, reviewText: 'Smooth collaboration.' },
        freelancerToken,
      );
      fmt('freelancer_submit_rating', freelancerRateBusiness.status);
      if (freelancerRateBusiness.status !== 403) failed = true;

      const ratingsList = await request(base, `/api/ratings/projects/${projectId}`, 'GET', undefined, businessToken);
      fmt('list_ratings', ratingsList.status, `count:${ratingsList.data.ratings?.length ?? 0}`);
      if (ratingsList.status !== 200 || (ratingsList.data.ratings?.length ?? 0) < 1) failed = true;

      const finalProject = await request(base, `/api/projects/${projectId}`, 'GET', undefined, businessToken);
      fmt('final_status', finalProject.status, finalProject.data.project?.status);
      if (finalProject.status !== 200 || finalProject.data.project?.status !== 'Completed') failed = true;

      process.exitCode = failed ? 1 : 0;
    } catch (error) {
      console.error('smoke_failed |', error.message);
      process.exitCode = 1;
    } finally {
      server.close(() => process.exit(process.exitCode ?? 1));
    }
  });
}

run();
