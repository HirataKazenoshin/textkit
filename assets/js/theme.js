/* ── Theme toggle (light / dark) ──────────────────────────
   Runs synchronously in <head> → no flash on load
   Preference stored in localStorage key "theme"
   ──────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  function updateButton(t) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var isDark = t === 'dark';
    var label = isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    var sun  = btn.querySelector('.ti-sun');
    var moon = btn.querySelector('.ti-moon');
    if (sun)  sun.style.display  = isDark ? '' : 'none';
    if (moon) moon.style.display = isDark ? 'none' : '';
  }

  function toggle() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateButton(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var t = document.documentElement.getAttribute('data-theme');
    updateButton(t);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  });
}());
