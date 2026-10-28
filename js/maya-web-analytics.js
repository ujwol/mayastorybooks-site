/* Maya's Storybooks — anonymous first-party web usage counters.
 *
 * Mirrors the Maya's Storybook app's analytics (same endpoint, same event
 * names, same anonymous posture). What is sent: event name + feature id +
 * a random browser id + platform + language. No names, no personal data,
 * no location, no third parties. Events batch to the Hub endpoint and
 * fail silently — analytics must never break the page.
 *
 * Events used (from the server allowlist only):
 *   story_opened — a reader opened the story player for a book.
 * feature_id is "web:book-N" so web plays stay separate from app plays
 * in the admin dashboard. The tracker only fires when a link marked with
 * data-track-book is clicked; it never observes anything inside the
 * story player itself.
 */
(function () {
  'use strict';
  try {
    var ENDPOINT = 'https://app.bayn9.com/api/public/maya-analytics';
    var TOKEN = 'zP5GJwobStJybETfHWF_isgWZGddnzgLzQXUNwBZQOc';
    var ALLOWED = { story_opened: 1 };
    var ID_KEY = 'maya_web_id';
    var QUEUE_KEY = 'maya_web_queue';
    var FLUSH_AT = 10;
    var FLUSH_EVERY_MS = 15000;
    var BATCH_SIZE = 50;

    function randomId() {
      var h = '0123456789abcdef';
      function s(n) {
        var out = '';
        for (var i = 0; i < n; i++) out += h[(Math.random() * 16) | 0];
        return out;
      }
      return s(8) + '-' + s(4) + '-4' + s(3) + '-' +
        (((Math.random() * 4) | 0) + 8).toString(16) + s(3) + '-' + s(12);
    }

    function getBrowserId() {
      try {
        var id = window.localStorage.getItem(ID_KEY);
        if (!id) {
          id = randomId();
          window.localStorage.setItem(ID_KEY, id);
        }
        return id;
      } catch (e) {
        return 'unknown';
      }
    }

    function loadQueue() {
      try {
        var raw = window.localStorage.getItem(QUEUE_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        return arr.filter(function (e) { return e && typeof e.event === 'string'; });
      } catch (e) {
        return [];
      }
    }

    function saveQueue(q) {
      try {
        window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200)));
      } catch (e) { /* storage full or unavailable — drop silently */ }
    }

    var queue = loadQueue();
    var flushing = false;
    var timer = null;

    function flush() {
      if (flushing || queue.length === 0) return;
      if (typeof fetch !== 'function') return;
      flushing = true;
      try {
        var batch = queue.slice(0, BATCH_SIZE);
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: TOKEN, events: batch }),
          keepalive: true
        }).then(function (res) {
          if (res && res.ok) {
            queue = queue.slice(batch.length);
            saveQueue(queue);
          }
          flushing = false;
        }).catch(function () { flushing = false; });
      } catch (e) {
        flushing = false;
      }
    }

    function scheduleFlush() {
      if (queue.length >= FLUSH_AT) {
        flush();
        return;
      }
      if (timer === null) {
        timer = setTimeout(function () { timer = null; flush(); }, FLUSH_EVERY_MS);
      }
    }

    function track(event, featureId, lang) {
      try {
        if (!ALLOWED[event]) return;
        queue.push({
          event: event,
          feature_id: String(featureId || '').slice(0, 64),
          install_id: getBrowserId(),
          app_version: 'web-1.0',
          platform: 'web',
          lang: String(lang || 'en').slice(0, 8)
        });
        saveQueue(queue);
        scheduleFlush();
      } catch (e) { /* analytics must never break the page */ }
    }

    // Flush when the page hides so clicks that navigate away are not lost.
    try {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') flush();
      });
      window.addEventListener('pagehide', function () { flush(); });
    } catch (e) { /* non-DOM environment */ }

    // Wire every player-open link on the page.
    try {
      var links = document.querySelectorAll('a[data-track-book]');
      for (var i = 0; i < links.length; i++) {
        (function (link) {
          link.addEventListener('click', function () {
            track('story_opened', 'web:book-' + link.getAttribute('data-track-book'),
              link.getAttribute('data-track-lang') || 'en');
            flush();
          });
        })(links[i]);
      }
    } catch (e) { /* never break the page */ }

    window.MayaWebAnalytics = { track: track };
  } catch (e) { /* analytics must never break the page */ }
})();
