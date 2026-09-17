(function () {
  var TABLES = [
    { id: 'people', label: 'People', fields: ['full_name', 'slug', 'role_title', 'short_bio', 'status'] },
    { id: 'practice_areas', label: 'Practice areas', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'services', label: 'Services', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'matters', label: 'Matters', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'articles', label: 'Insights', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'news', label: 'News', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'resources', label: 'Resources', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'careers', label: 'Careers', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'internships', label: 'Internships', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'quizzes', label: 'Quizzes', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'books', label: 'Library', fields: ['title', 'slug', 'summary', 'status'] },
    { id: 'modules', label: 'Modules', fields: ['title', 'slug', 'code', 'category', 'status'] },
    { id: 'cases', label: 'Case notes', fields: ['title', 'slug', 'citation', 'citation_status', 'status'] },
    { id: 'statutes', label: 'Statutes', fields: ['title', 'slug', 'year', 'status'] },
    { id: 'societies', label: 'Societies', fields: ['title', 'slug', 'category', 'city', 'status'] },
    { id: 'chapters', label: 'Chapters', fields: ['title', 'slug', 'city', 'province', 'status'] },
    { id: 'lectures', label: 'Lectures', fields: ['title', 'slug', 'youtube_url', 'status'] },
    { id: 'social_posts', label: 'Social posts', fields: ['title', 'slug', 'platform', 'status'] },
    { id: 'cabinets', label: 'Cabinets', fields: ['title', 'slug', 'parent_kind', 'seat_limit', 'status'] },
    { id: 'certificates', label: 'Certificates', fields: ['title', 'slug', 'category', 'status'] }
  ];

  async function boot() {
    var login = document.getElementById('loginPanel');
    var app = document.getElementById('adminApp');
    var err = document.getElementById('authError');
    try {
      var profile = await ramdaniAuth.requireStaff();
      login.classList.add('hidden');
      app.classList.remove('hidden');
      document.getElementById('staffName').textContent = profile.full_name || profile.role;
      await loadTable('people');
      await loadInquiries();
      await loadInternshipApps();
      await loadJoinRequests();
    } catch (e) {
      login.classList.remove('hidden');
      app.classList.add('hidden');
    }

    document.getElementById('passwordForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      err.textContent = '';
      var email = document.getElementById('email').value.trim();
      var password = document.getElementById('password').value;
      var res = await ramdaniAuth.signInPassword(email, password);
      if (res.error) { err.textContent = res.error.message; return; }
      location.reload();
    });

    document.getElementById('signupForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      err.textContent = '';
      var email = document.getElementById('suEmail').value.trim();
      var password = document.getElementById('suPassword').value;
      var name = document.getElementById('suName').value.trim();
      var res = await ramdaniAuth.signUpPassword(email, password, name);
      if (res.error) { err.textContent = res.error.message; return; }
      err.textContent = 'Account created. An administrator must set your role to editor or admin before CMS access is granted.';
    });

    document.getElementById('forgotForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = document.getElementById('forgotEmail').value.trim();
      var res = await ramdaniAuth.resetPassword(email);
      err.textContent = res.error ? res.error.message : 'If the email exists, a reset link was sent.';
    });

    document.querySelectorAll('[data-oauth]').forEach(function (btn) {
      btn.addEventListener('click', function () { ramdaniAuth.social(btn.getAttribute('data-oauth')); });
    });

    var out = document.getElementById('signOutBtn');
    if (out) out.addEventListener('click', async function () { await ramdaniAuth.signOut(); location.reload(); });

    document.querySelectorAll('[data-table]').forEach(function (btn) {
      btn.addEventListener('click', function () { loadTable(btn.getAttribute('data-table')); });
    });

    document.getElementById('createForm').addEventListener('submit', saveRow);
  }

  async function loadTable(name) {
    var meta = TABLES.find(function (t) { return t.id === name; });
    if (!meta) return;
    document.getElementById('tableTitle').textContent = meta.label;
    document.getElementById('createForm').dataset.table = name;
    var res = await sb.from(name).select('*').order('updated_at', { ascending: false });
    var rows = res.data || [];
    var head = '<tr>' + meta.fields.map(function (f) { return '<th>' + ramdaniUi.escape(f) + '</th>'; }).join('') + '<th></th></tr>';
    var body = rows.map(function (row) {
      return '<tr>' + meta.fields.map(function (f) {
        return '<td>' + ramdaniUi.escape(row[f]) + '</td>';
      }).join('') + '<td><button type="button" data-del="' + ramdaniUi.escape(row.id) + '">Delete</button></td></tr>';
    }).join('');
    document.getElementById('dataHead').innerHTML = head;
    document.getElementById('dataBody').innerHTML = body || '<tr><td colspan="8">No rows yet.</td></tr>';
    document.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await sb.from(name).delete().eq('id', btn.getAttribute('data-del'));
        loadTable(name);
      });
    });
  }

  async function saveRow(e) {
    e.preventDefault();
    var form = e.target;
    var table = form.dataset.table;
    var payload = {
      title: (form.querySelector('[name="title"]') || {}).value,
      full_name: (form.querySelector('[name="full_name"]') || {}).value,
      slug: form.querySelector('[name="slug"]').value.trim(),
      summary: (form.querySelector('[name="summary"]') || {}).value,
      short_bio: (form.querySelector('[name="short_bio"]') || {}).value,
      role_title: (form.querySelector('[name="role_title"]') || {}).value,
      location: (form.querySelector('[name="location"]') || {}).value,
      mode: (form.querySelector('[name="mode"]') || {}).value,
      duration: (form.querySelector('[name="duration"]') || {}).value,
      stipend_note: (form.querySelector('[name="stipend_note"]') || {}).value,
      deadline: (form.querySelector('[name="deadline"]') || {}).value,
      category: (form.querySelector('[name="category"]') || {}).value,
      city: (form.querySelector('[name="city"]') || {}).value,
      province: (form.querySelector('[name="province"]') || {}).value,
      youtube_url: (form.querySelector('[name="youtube_url"]') || {}).value,
      youtube_id: (form.querySelector('[name="youtube_id"]') || {}).value,
      platform: (form.querySelector('[name="platform"]') || {}).value,
      permalink: (form.querySelector('[name="permalink"]') || {}).value,
      parent_kind: (form.querySelector('[name="parent_kind"]') || {}).value,
      seat_limit: (form.querySelector('[name="seat_limit"]') || {}).value,
      status: form.querySelector('[name="status"]').value
    };
    Object.keys(payload).forEach(function (k) { if (payload[k] === undefined || payload[k] === '') delete payload[k]; });
    if (table === 'cabinets') {
      var limit = Number(payload.seat_limit || 10);
      if (!limit || limit < 1) limit = 1;
      if (limit > 10) limit = 10;
      payload.seat_limit = limit;
      var parentKind = payload.parent_kind;
      var socSlug = (form.querySelector('[name="society_slug"]') || {}).value;
      var chSlug = (form.querySelector('[name="chapter_slug"]') || {}).value;
      if (parentKind === 'society' && socSlug) {
        var s = await sb.from('societies').select('id').eq('slug', socSlug.trim()).maybeSingle();
        payload.society_id = s.data && s.data.id;
        delete payload.chapter_id;
      }
      if (parentKind === 'chapter' && chSlug) {
        var c = await sb.from('chapters').select('id').eq('slug', chSlug.trim()).maybeSingle();
        payload.chapter_id = c.data && c.data.id;
        delete payload.society_id;
      }
    }
    if (table === 'certificates') {
      var code = ((form.querySelector('[name="module_code"]') || {}).value || '').trim();
      if (code) {
        var m = await sb.from('modules').select('id').eq('code', code).maybeSingle();
        if (m.data) payload.module_id = m.data.id;
      }
    }
    if (table === 'people' && !payload.full_name) return;
    if (table !== 'people' && !payload.title) return;
    var res = await sb.from(table).insert(payload);
    var note = document.getElementById('saveNote');
    note.textContent = res.error ? res.error.message : 'Saved.';
    if (!res.error) { form.reset(); loadTable(table); }
  }

  async function loadInquiries() {
    var res = await sb.from('inquiries').select('id, kind, full_name, email, subject, status, created_at').order('created_at', { ascending: false }).limit(50);
    var rows = res.data || [];
    document.getElementById('inqBody').innerHTML = rows.map(function (r) {
      return '<tr><td>' + ramdaniUi.escape(r.kind) + '</td><td>' + ramdaniUi.escape(r.full_name) + '</td><td>' + ramdaniUi.escape(r.email) + '</td><td>' + ramdaniUi.escape(r.subject) + '</td><td>' + ramdaniUi.escape(r.status) + '</td></tr>';
    }).join('') || '<tr><td colspan="5">No inquiries.</td></tr>';
  }

  async function loadInternshipApps() {
    var body = document.getElementById('internAppBody');
    if (!body) return;
    var res = await sb.from('internship_applications').select('id, full_name, email, phone, education, status, created_at, internships(title)').order('created_at', { ascending: false }).limit(50);
    var rows = res.data || [];
    body.innerHTML = rows.map(function (r) {
      var listing = r.internships && r.internships.title ? r.internships.title : 'General';
      return '<tr><td>' + ramdaniUi.escape(listing) + '</td><td>' + ramdaniUi.escape(r.full_name) +
        '</td><td>' + ramdaniUi.escape(r.email) + '</td><td>' + ramdaniUi.escape(r.education) +
        '</td><td><select data-app="' + ramdaniUi.escape(r.id) + '">' +
        ['new','reviewed','shortlisted','closed'].map(function (s) {
          return '<option value="' + s + '"' + (r.status === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('') + '</select></td></tr>';
    }).join('') || '<tr><td colspan="5">No applications.</td></tr>';
    body.querySelectorAll('[data-app]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        await sb.from('internship_applications').update({ status: sel.value }).eq('id', sel.getAttribute('data-app'));
      });
    });
  }

  async function loadJoinRequests() {
    var body = document.getElementById('joinReqBody');
    if (!body) return;
    var res = await sb.from('join_requests').select('id, kind, listing_slug, full_name, email, message, created_at').order('created_at', { ascending: false }).limit(50);
    var rows = res.data || [];
    body.innerHTML = rows.map(function (r) {
      return '<tr><td>' + ramdaniUi.escape(r.kind) + '</td><td>' + ramdaniUi.escape(r.listing_slug) + '</td><td>' + ramdaniUi.escape(r.full_name) + '</td><td>' + ramdaniUi.escape(r.email) + '</td><td>' + ramdaniUi.escape(r.message) + '</td></tr>';
    }).join('') || '<tr><td colspan="5">No join inquiries.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
