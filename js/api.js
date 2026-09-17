window.ramdaniApi = {
  async listPublished(table, orderCol) {
    if (!window.sb) return [];
    var q = sb.from(table).select('*').eq('status', 'published');
    if (orderCol) q = q.order(orderCol, { ascending: true });
    else q = q.order('published_at', { ascending: false });
    var res = await q;
    if (res.error) {
      console.warn('Ramdani list', table, res.error.message);
      return [];
    }
    return res.data || [];
  },
  async getBySlug(table, slug) {
    if (!window.sb || !slug) return null;
    var res = await sb.from(table).select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    if (res.error) return null;
    return res.data;
  },
  async submitInquiry(payload) {
    if (!window.sb) throw new Error('Client not ready');
    var res = await sb.from('inquiries').insert(payload);
    if (res.error) throw res.error;
  }
};
