/* Maya's Storybooks — shared site behavior: app-launch notify forms.
 *
 * Posts to the Hub public form endpoint. No test submissions are ever
 * made from this code path by developers — it only runs on real visitor
 * input. All failures show a plain message; nothing here throws.
 */
(function () {
  'use strict';
  try {
    var ENDPOINT = 'https://app.bayn9.com/api/public/submit';
    var SLUG = 'maya-app-launch-notify';
    var USERNAME = 'ujwol';
    var EMAIL_FIELD = 'parent-s-email-address';
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setText(el, text) {
      if (el) el.textContent = text;
    }

    function wire(form) {
      var email = form.querySelector('input[type="email"]');
      var hp = form.querySelector('input[name="website_hp"]');
      var btn = form.querySelector('button[type="submit"]');
      var msg = form.querySelector('[data-notify-msg]');
      if (!email || !btn) return;
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var value = (email.value || '').trim();
        if (!EMAIL_RE.test(value)) {
          setText(msg, 'Please enter a valid email address.');
          email.focus();
          return;
        }
        var orig = btn.textContent;
        btn.textContent = 'Sending…';
        btn.disabled = true;
        setText(msg, '');
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: SLUG,
            username: USERNAME,
            answers: (function () {
              var a = {};
              a[EMAIL_FIELD] = value;
              return a;
            })(),
            hp: hp ? (hp.value || '') : ''
          })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.ok) {
            form.innerHTML = '';
            var ok = document.createElement('div');
            ok.className = 'notify-done';
            var h = document.createElement('strong');
            h.textContent = d.title || "You're in!";
            var p = document.createElement('p');
            p.textContent = d.message || 'Thanks — we will be in touch shortly.';
            ok.appendChild(h);
            ok.appendChild(p);
            form.appendChild(ok);
          } else {
            var errs = (d && d.errors) || ['Something went wrong — please try again.'];
            setText(msg, errs.join(' '));
            btn.textContent = orig;
            btn.disabled = false;
          }
        }).catch(function () {
          setText(msg, 'Could not send — check your connection and try again.');
          btn.textContent = orig;
          btn.disabled = false;
        });
      });
    }

    var forms = document.querySelectorAll('form[data-notify-form]');
    for (var i = 0; i < forms.length; i++) wire(forms[i]);
  } catch (e) { /* never break the page */ }
})();
