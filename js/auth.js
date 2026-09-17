window.ramdaniAuth = {
  publicOrigin: function () {
    var origin = (window.location && window.location.origin) || '';
    if (!origin || /localhost|127\.0\.0\.1/i.test(origin)) {
      return 'https://ramdani-law-firm.vercel.app';
    }
    return origin;
  },
  recoveryRedirectTo: function () {
    return this.publicOrigin() + '/reset-password';
  },
  authCallbackParams: function () {
    var q = new URLSearchParams(location.search || '');
    var h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    return {
      error: q.get('error_description') || q.get('error') || h.get('error_description') || h.get('error'),
      errorCode: q.get('error_code') || h.get('error_code'),
      type: q.get('type') || h.get('type'),
      code: q.get('code'),
      accessToken: h.get('access_token')
    };
  },
  isRecoveryCallback: function () {
    var p = this.authCallbackParams();
    return !!(p.type === 'recovery' || p.code || p.accessToken || p.error);
  },
  recoveryErrorMessage: function (p) {
    p = p || this.authCallbackParams();
    if (!p.error && !p.errorCode) return '';
    if (p.errorCode === 'otp_expired' || /otp_expired|expired/i.test(p.error || '')) {
      return 'This reset link has expired. Request a new one from Staff sign in.';
    }
    if (/access_denied/i.test(p.error || '') || p.errorCode === 'access_denied') {
      return 'This reset link could not be used. Request a new one from Staff sign in.';
    }
    return p.error;
  },
  async session() {
    if (!window.sb) return null;
    var res = await sb.auth.getSession();
    return res.data && res.data.session;
  },
  async profile() {
    var session = await this.session();
    if (!session) return null;
    var res = await sb.from('profiles').select('id, full_name, role, status').eq('id', session.user.id).maybeSingle();
    return res.data || null;
  },
  async requireStaff() {
    var p = await this.profile();
    if (!p || p.status !== 'active' || (p.role !== 'admin' && p.role !== 'editor')) {
      throw new Error('Staff access required');
    }
    return p;
  },
  async signInPassword(email, password) {
    return sb.auth.signInWithPassword({ email: email, password: password });
  },
  async resetPassword(email) {
    return sb.auth.resetPasswordForEmail(email, {
      redirectTo: this.recoveryRedirectTo()
    });
  },
  async updatePassword(password) {
    return sb.auth.updateUser({ password: password });
  },
  async waitForRecoverySession() {
    if (!window.sb) return { session: null, error: 'Auth is not available.' };
    var p = this.authCallbackParams();
    var urlErr = this.recoveryErrorMessage(p);
    if (urlErr) return { session: null, error: urlErr };
    var hasCallback = !!(p.type === 'recovery' || p.code || p.accessToken);

    if (p.code) {
      var exchanged = await sb.auth.exchangeCodeForSession(p.code);
      if (exchanged.error) return { session: null, error: exchanged.error.message };
      try { history.replaceState({}, '', '/reset-password'); } catch (e) {}
      return { session: exchanged.data && exchanged.data.session, error: null };
    }

    var existing = await sb.auth.getSession();
    if (existing.data && existing.data.session && (hasCallback || p.type === 'recovery')) {
      try { history.replaceState({}, '', '/reset-password'); } catch (e) {}
      return { session: existing.data.session, error: null };
    }

    if (!hasCallback) {
      if (existing.data && existing.data.session) {
        try { history.replaceState({}, '', '/reset-password'); } catch (e) {}
        return { session: existing.data.session, error: null };
      }
      return { session: null, error: 'Open this page from the reset link in your email, or request a new link from Staff sign in.' };
    }

    return await new Promise(function (resolve) {
      var done = false;
      var finish = function (session, error) {
        if (done) return;
        done = true;
        if (session) {
          try { history.replaceState({}, '', '/reset-password'); } catch (e) {}
        }
        resolve({ session: session || null, error: error || null });
      };
      var timer = setTimeout(function () {
        sb.auth.getSession().then(function (res) {
          var session = res.data && res.data.session;
          finish(session, session ? null : 'This reset link is invalid or has expired. Request a new one from Staff sign in.');
        });
      }, 1600);
      var sub = sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          clearTimeout(timer);
          if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
          finish(session, null);
        }
      });
    });
  },
  async signOut() {
    return sb.auth.signOut();
  }
};
