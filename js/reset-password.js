(function () {
  function setStatus(text, ok) {
    var el = document.getElementById('resetStatus');
    if (!el) return;
    el.className = 'form-status ' + (ok ? 'ok' : 'err');
    el.textContent = text || '';
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var form = document.getElementById('resetForm');
    var waiting = document.getElementById('resetWaiting');
    if (!form || !window.ramdaniAuth) {
      setStatus('Auth is not available.');
      return;
    }

    var result = await ramdaniAuth.waitForRecoverySession();
    if (waiting) waiting.hidden = true;
    if (result.error || !result.session) {
      form.hidden = true;
      setStatus(result.error || 'Recovery link is invalid or expired. Please request a new password reset link.');
      return;
    }

    form.hidden = false;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var password = document.getElementById('newPassword').value;
      var confirm = document.getElementById('confirmPassword').value;
      if (!password || password.length < 8) {
        setStatus('Use at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setStatus('Passwords do not match.');
        return;
      }
      var res = await ramdaniAuth.updatePassword(password);
      if (res.error) {
        setStatus(res.error.message);
        return;
      }
      form.hidden = true;
      setStatus('Password updated successfully', true);
    });
  });
})();