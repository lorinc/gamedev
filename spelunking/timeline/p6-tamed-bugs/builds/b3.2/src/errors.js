// Errors you can see (R15). A classic script, loaded before any module, so it also catches a module
// that fails to load or parse. Every uncaught error, failed load and unhandled rejection goes to
// console.error (which tools/smoke.sh fails on) and onto the screen, so a tester can report it
// instead of staring at a black page. Plain ES2020, no imports.
;(function () {
  /** @type {HTMLPreElement | null} */
  let box = null
  /** @param {string} msg */
  function show(msg) {
    console.error('[page error] ' + msg)
    if (!box) {
      box = document.createElement('pre')
      box.style.cssText =
        'position:fixed;left:0;right:0;top:0;z-index:99;margin:0;padding:8px;max-height:40%;overflow:auto;' +
        'background:#600;color:#fff;font:12px monospace;white-space:pre-wrap;-webkit-user-select:text;user-select:text'
      ;(document.body || document.documentElement).appendChild(box)
    }
    box.textContent += `${location.pathname.split('/').pop()}: ${msg}\n`
  }
  addEventListener(
    'error',
    (e) => {
      const el = /** @type {any} */ (e.target)
      if (el && el.tagName) show(`failed to load ${el.src || el.href || `an inline <${el.tagName.toLowerCase()}> (one of its imports)`}`)
      else show(`${e.message} (${String(e.filename).split('/').pop()}:${e.lineno})`)
    },
    true, // capture: load errors on <script> / <img> don't bubble
  )
  addEventListener('unhandledrejection', (e) => show(`unhandled rejection: ${e.reason?.stack || e.reason}`))
})()
