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
      code: q.get('code') || h.get('code'),
      tokenHash: q.get('token_hash') || h.get('token_hash'),
      accessToken: q.get('access_token') || h.get('access_token'),
      refreshToken: q.get('refresh_token') || h.get('refresh_token')
    };
  },
  isRecoveryCallback: function () {
    var p = this.authCallbackParams();
    return !!(p.type === 'recovery' || p.code || p.tokenHash || p.accessToken || p.error);
  },
  recoveryErrorMessage: function (p) {
    p = p || this.authCallbackParams();
    if (!p.error && !p.errorCode) return '';
    if (p.errorCode === 'otp_expired' || /otp_expired|expired/i.test(p.error || '')) {
      return 'Recovery link is invalid or expired. Please request a new password reset link.';
    }
    if (/access_denied/i.test(p.error || '') || p.errorCode === 'access_denied') {
      return 'Recovery link is invalid or expired. Please request a new password reset link.';
    }
    return p.error;
  },
  invalidRecoveryMessage: 'Recovery link is invalid or expired. Please request a new password reset link.',
  _recoverySession: null,
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
  async ensureRecoverySession() {
    if (!window.sb) return null;
    if (this._recoverySession && this._recoverySession.access_token && this._recoverySession.refresh_token) {
      var restored = await sb.auth.setSession({
        access_token: this._recoverySession.access_token,
        refresh_token: this._recoverySession.refresh_token
      });
      if (!restored.error && restored.data && restored.data.session) {
        this._recoverySession = restored.data.session;
        return restored.data.session;
      }
    }
    var current = await sb.auth.getSession();
    return current.data && current.data.session;
  },
  async updatePassword(password) {
    var session = await this.ensureRecoverySession();
    if (!session) {
      return { data: { user: null }, error: { message: this.invalidRecoveryMessage } };
    }
    return sb.auth.updateUser({ password: password });
  },
  rememberRecoverySession: function (session) {
    if (session && session.access_token) this._recoverySession = session;
    return session;
  },
  cleanRecoveryUrl: function () {
    try { history.replaceState({}, '', '/reset-password'); } catch (e) {}
  },
  async waitForRecoverySession() {
    if (!window.sb) return { session: null, error: 'Auth is not available.' };

    var p = this.authCallbackParams();
    var urlErr = this.recoveryErrorMessage(p);
    if (urlErr) return { session: null, error: urlErr };

    var self = this;
    var pending = null;
    var sub = sb.auth.onAuthStateChange(function (event, session) {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        self.rememberRecoverySession(session);
        if (pending) pending(session);
      }
    });

    function waitForRecoveryEvent(ms) {
      return new Promise(function (resolve) {
        var timer = setTimeout(function () { resolve(null); }, ms);
        pending = function (session) {
          clearTimeout(timer);
          pending = null;
          resolve(session);
        };
      });
    }

    try {
      if (p.code) {
        var exchanged = await sb.auth.exchangeCodeForSession(p.code);
        if (exchanged.error) {
          var fromEvent = this._recoverySession || (await waitForRecoveryEvent(800));
          if (fromEvent) {
            this.cleanRecoveryUrl();
            return { session: fromEvent, error: null };
          }
          return { session: null, error: this.invalidRecoveryMessage };
        }
        var exchangedSession = (exchanged.data && exchanged.data.session) || this._recoverySession;
        if (!exchangedSession) exchangedSession = await waitForRecoveryEvent(1200);
        if (!exchangedSession) return { session: null, error: this.invalidRecoveryMessage };
        if (exchangedSession.access_token && exchangedSession.refresh_token) {
          var locked = await sb.auth.setSession({
            access_token: exchangedSession.access_token,
            refresh_token: exchangedSession.refresh_token
          });
          if (!locked.error && locked.data && locked.data.session) {
            exchangedSession = locked.data.session;
          }
        }
        this.rememberRecoverySession(exchangedSession);
        this.cleanRecoveryUrl();
        return { session: exchangedSession, error: null };
      }

      if (p.accessToken && p.refreshToken) {
        var setRes = await sb.auth.setSession({
          access_token: p.accessToken,
          refresh_token: p.refreshToken
        });
        if (setRes.error || !(setRes.data && setRes.data.session)) {
          return { session: null, error: this.invalidRecoveryMessage };
        }
        this.rememberRecoverySession(setRes.data.session);
        this.cleanRecoveryUrl();
        return { session: setRes.data.session, error: null };
      }

      if (p.tokenHash) {
        var verified = await sb.auth.verifyOtp({ type: 'recovery', token_hash: p.tokenHash });
        if (verified.error || !(verified.data && verified.data.session)) {
          return { session: null, error: this.invalidRecoveryMessage };
        }
        this.rememberRecoverySession(verified.data.session);
        this.cleanRecoveryUrl();
        return { session: verified.data.session, error: null };
      }

      if (p.type === 'recovery') {
        var recovered = this._recoverySession || (await waitForRecoveryEvent(2000));
        if (recovered) {
          this.rememberRecoverySession(recovered);
          this.cleanRecoveryUrl();
          return { session: recovered, error: null };
        }
      }

      return { session: null, error: this.invalidRecoveryMessage };
    } finally {
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    }
  },
  async signOut() {
    this._recoverySession = null;
    return sb.auth.signOut();
  }
};
