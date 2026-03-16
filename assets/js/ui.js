/**
 * TextKit – ui.js
 * Shared DOM utilities: copy button, clear button, swap, toast notifications.
 * No external dependencies.
 */

'use strict';

/* -------------------------------------------------------
   Toast notification
------------------------------------------------------- */
(function initToast() {
  const el = document.createElement('div');
  el.id = 'tk-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'left:50%',
    'transform:translateX(-50%) translateY(20px)',
    'background:var(--color-text)',
    'color:var(--color-bg)',
    'padding:10px 20px',
    'border-radius:8px',
    'font-size:0.875rem',
    'font-weight:500',
    'box-shadow:0 4px 16px rgba(0,0,0,.2)',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity .2s ease, transform .2s ease',
    'z-index:9999',
    'white-space:nowrap',
  ].join(';');
  document.body.appendChild(el);
})();

let _toastTimer = null;

/**
 * Show a short toast notification.
 * @param {string} message
 * @param {number} [duration=2000]
 */
function showToast(message, duration = 2000) {
  const el = document.getElementById('tk-toast');
  if (!el) return;
  el.textContent = message;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

/* -------------------------------------------------------
   Copy to clipboard
------------------------------------------------------- */

/**
 * Copy text to clipboard and show feedback on a button.
 * @param {string} text – text to copy
 * @param {HTMLElement} [btn] – optional button element to show feedback on
 */
function copyToClipboard(text, btn) {
  if (!text) {
    showToast('コピーするテキストがありません');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('クリップボードにコピーしました ✓');
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline></svg>`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('copied');
      }, 2000);
    }
  }).catch(() => {
    // Fallback for older browsers
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('クリップボードにコピーしました ✓');
    } catch {
      showToast('コピーに失敗しました');
    }
  });
}

/* -------------------------------------------------------
   Init copy button
------------------------------------------------------- */

/**
 * Attach click handler to a copy button.
 * @param {string|HTMLElement} btn – selector string or element
 * @param {string|HTMLElement} source – selector string or element whose value/textContent to copy
 */
function initCopyButton(btn, source) {
  const btnEl    = typeof btn    === 'string' ? document.querySelector(btn)    : btn;
  const sourceEl = typeof source === 'string' ? document.querySelector(source) : source;
  if (!btnEl || !sourceEl) return;
  btnEl.addEventListener('click', () => {
    const text = sourceEl.value !== undefined ? sourceEl.value : sourceEl.textContent;
    copyToClipboard(text, btnEl);
  });
}

/* -------------------------------------------------------
   Init clear button
------------------------------------------------------- */

/**
 * Attach click handler to a clear button that clears one or more targets.
 * @param {string|HTMLElement} btn
 * @param {Array<string|HTMLElement>} targets
 * @param {Function} [onClear] – optional callback after clearing
 */
function initClearButton(btn, targets, onClear) {
  const btnEl = typeof btn === 'string' ? document.querySelector(btn) : btn;
  if (!btnEl) return;
  btnEl.addEventListener('click', () => {
    targets.forEach(t => {
      const el = typeof t === 'string' ? document.querySelector(t) : t;
      if (!el) return;
      if (el.value !== undefined) el.value = '';
      else el.textContent = '';
    });
    if (onClear) onClear();
    showToast('クリアしました');
  });
}

/* -------------------------------------------------------
   Swap two textarea values
------------------------------------------------------- */

/**
 * Swap the values of two textarea/input elements.
 * @param {HTMLElement} a
 * @param {HTMLElement} b
 */
function swapValues(a, b) {
  const tmp = a.value;
  a.value = b.value;
  b.value = tmp;
}

/* -------------------------------------------------------
   Auto-grow textarea
------------------------------------------------------- */

/**
 * Make a textarea auto-grow to fit its content.
 * @param {HTMLTextAreaElement} ta
 * @param {number} [maxPx=480]
 */
function autoGrow(ta, maxPx = 480) {
  function resize() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, maxPx) + 'px';
  }
  ta.addEventListener('input', resize);
  resize();
}

/* -------------------------------------------------------
   Character counter badge
------------------------------------------------------- */

/**
 * Show a live character count badge below a textarea.
 * @param {HTMLTextAreaElement} ta
 * @param {HTMLElement} badge
 */
function liveCharCount(ta, badge) {
  function update() {
    badge.textContent = ta.value.length.toLocaleString('ja-JP') + ' 文字';
  }
  ta.addEventListener('input', update);
  update();
}

/* -------------------------------------------------------
   Expose to global
------------------------------------------------------- */
window.TextKitUI = {
  showToast,
  copyToClipboard,
  initCopyButton,
  initClearButton,
  swapValues,
  autoGrow,
  liveCharCount,
};
