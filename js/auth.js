window.ramdaniAuth = {
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
  async signUpPassword(email, password, fullName) {
    return sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: fullName || '' } }
    });
  },
  async social(provider) {
    return sb.auth.signInWithOAuth({
      provider: provider,
      options: { redirectTo: window.location.origin + '/admin/' }
    });
  },
  async resetPassword(email) {
    return sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/admin/'
    });
  },
  async signOut() {
    return sb.auth.signOut();
  }
};
