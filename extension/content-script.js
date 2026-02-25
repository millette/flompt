;(function () {
  'use strict'

  // Guard against double injection
  if (window.__flomptInjected) return
  window.__flomptInjected = true

  // ── Config ─────────────────────────────────────────────────────────────────
  // DEV_MODE: mettre à true pour pointer sur localhost:5173 en développement
  const DEV_MODE      = false
  const FLOMPT_URL    = DEV_MODE
    ? 'http://localhost:5173/app/?extension=1'
    : 'https://flompt.dev/app/?extension=1'
  const FLOMPT_ORIGIN = DEV_MODE
    ? 'http://localhost:5173'
    : 'https://flompt.dev'
  const SIDEBAR_W     = 440

  // ── Platform detection ─────────────────────────────────────────────────────
  const hostname = location.hostname

  /**
   * Each platform defines:
   *  - name: display name
   *  - getInput(): returns the DOM element to inject into
   *  - inject(el, text): sets the text on that element and fires change events
   */
  const PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      test: () => hostname.includes('chatgpt.com') || hostname.includes('openai.com'),
      getInput () {
        // #prompt-textarea est désormais un div[contenteditable] (React/ProseMirror-like)
        return (
          document.querySelector('#prompt-textarea[contenteditable]') ||
          document.querySelector('#prompt-textarea') ||
          document.querySelector('div[contenteditable="true"][data-virtualized="false"]')
        )
      },
      inject (el, text) {
        setContentEditable(el, text)
      },
    },
    claude: {
      name: 'Claude',
      test: () => hostname.includes('claude.ai'),
      getInput () {
        return (
          document.querySelector('[data-testid="composer-text-input"] div[contenteditable]') ||
          document.querySelector('div[contenteditable="true"].ProseMirror') ||
          document.querySelector('div[contenteditable="true"]')
        )
      },
      inject (el, text) { setContentEditable(el, text) },
    },
    gemini: {
      name: 'Gemini',
      test: () => hostname.includes('gemini.google.com'),
      getInput () {
        // Gemini utilise un web component <rich-textarea> — pas de Quill.js
        return (
          document.querySelector('rich-textarea div[contenteditable]') ||
          document.querySelector('rich-textarea [contenteditable="true"]') ||
          document.querySelector('div[contenteditable="true"]')
        )
      },
      inject (el, text) { setContentEditable(el, text) },
    },
  }

  const platform = Object.values(PLATFORMS).find(p => p.test()) || null

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setContentEditable (el, text) {
    el.focus()

    // Sélectionner tout le contenu via la Selection API (remplace execCommand('selectAll'))
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)

    // execCommand('insertText') remplace la sélection ET fire beforeinput+input dans Chrome
    // ProseMirror (Claude) intercepte beforeinput — c'est le chemin recommandé
    const inserted = document.execCommand('insertText', false, text)

    // Fallback si execCommand a no-opé (certains navigateurs, certaines configs)
    if (!inserted || el.textContent.trim() !== text.trim()) {
      // Dispatch beforeinput explicitement pour ProseMirror
      const beforeInput = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertReplacementText',
        data: text,
      })
      el.dispatchEvent(beforeInput)

      if (!beforeInput.defaultPrevented) {
        el.textContent = text
      }

      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }))
    }

    // Gemini / Angular / Lit ont besoin d'un event 'change' pour activer le bouton Envoyer
    setTimeout(() => el.dispatchEvent(new Event('change', { bubbles: true })), 50)
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let sidebarOpen = false
  let sidebarEl   = null
  let iframeEl    = null

  // ── DOM: Sidebar ───────────────────────────────────────────────────────────
  function buildSidebar () {
    const sidebar = document.createElement('div')
    sidebar.id = 'flompt-sidebar'

    // ── Header mobile ──────────────────────────────────────────────────────────
    // Logo depuis icons/logo.svg (le logo du README) : éclair rose + "Flompt"
    const header = document.createElement('div')
    header.id = 'flompt-header'

    const logoImg = document.createElement('img')
    logoImg.id  = 'flompt-logo'
    logoImg.src = chrome.runtime.getURL('icons/logo.svg')
    logoImg.alt = 'Flompt'

    const closeBtn = document.createElement('button')
    closeBtn.id = 'flompt-close'
    closeBtn.title = 'Fermer Flompt'
    closeBtn.setAttribute('aria-label', 'Fermer')
    closeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `
    closeBtn.addEventListener('click', closeSidebar)

    header.appendChild(logoImg)
    header.appendChild(closeBtn)

    // ── Splash screen — titre visible dans la zone iframe pendant le chargement ─
    // Apparaît immédiatement, disparaît en fondu quand l'iframe est prête
    const splash = document.createElement('div')
    splash.id = 'flompt-splash'
    splash.innerHTML = `
      <div id="flompt-splash-inner">
        <svg id="flompt-splash-bolt" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="48" height="48" aria-hidden="true">
          <path d="M10 2L3 12h5.5L7 18l10-10h-6L10 2z" fill="#FF3570"/>
        </svg>
        <span id="flompt-splash-title">Flompt</span>
      </div>
    `

    // ── Iframe — charge l'app Flompt ──────────────────────────────────────────
    const iframe = document.createElement('iframe')
    iframe.id  = 'flompt-iframe'
    iframe.src = FLOMPT_URL
    iframe.allow = 'clipboard-write'
    // allow-same-origin lets postMessage work with origin check
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads')

    // Fade out + suppression du splash quand l'iframe a chargé
    iframe.addEventListener('load', () => {
      const s = document.getElementById('flompt-splash')
      if (s) {
        s.classList.add('flompt-splash-hidden')
        setTimeout(() => s.remove(), 450)
      }
    })

    sidebar.appendChild(header)
    sidebar.appendChild(splash)
    sidebar.appendChild(iframe)
    document.body.appendChild(sidebar)

    sidebarEl = sidebar
    iframeEl  = iframe
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  function openSidebar () {
    if (!sidebarEl) buildSidebar()
    sidebarOpen = true
    sidebarEl.classList.add('flompt-open')
    document.body.classList.add('flompt-body-shifted')
    toggleBtn.classList.add('flompt-active')
  }

  function closeSidebar () {
    sidebarOpen = false
    sidebarEl?.classList.remove('flompt-open')
    document.body.classList.remove('flompt-body-shifted')
    toggleBtn?.classList.remove('flompt-active')
  }

  function toggleSidebar () {
    if (sidebarOpen) closeSidebar()
    else openSidebar()
  }

  // ── DOM: Floating button ───────────────────────────────────────────────────
  const toggleBtn = document.createElement('button')
  toggleBtn.id = 'flompt-toggle'
  toggleBtn.title = 'Open Flompt — Visual Prompt Builder'
  // Logo officiel (favicon du README) — dark background, éclair blanc, bords arrondis
  toggleBtn.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/icon.svg')}" alt="Flompt" width="52" height="52">
  `
  toggleBtn.addEventListener('click', toggleSidebar)
  document.body.appendChild(toggleBtn)

  // ── Listen for messages from flompt iframe ─────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.origin !== FLOMPT_ORIGIN) return

    const { type, prompt } = event.data ?? {}

    if (type === 'FLOMPT_INJECT' && typeof prompt === 'string') {
      injectPrompt(prompt)
    }

    if (type === 'FLOMPT_CLOSE') {
      closeSidebar()
    }
  })

  // ── Listen for toggle from background service worker ──────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'FLOMPT_TOGGLE') toggleSidebar()
  })

  // ── Prompt injection ───────────────────────────────────────────────────────
  function injectPrompt (text) {
    if (!platform) {
      showToast('❌ Platform not detected. Try refreshing.', 'error')
      return
    }

    // Retry up to 3 times if input not found yet (some SPAs render late)
    let attempts = 0
    const tryInject = () => {
      const el = platform.getInput()
      if (!el) {
        if (++attempts < 3) {
          setTimeout(tryInject, 500)
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(text).then(() => {
            showToast(`Couldn't find ${platform.name} input — copied to clipboard ✓`)
          }).catch(() => {
            showToast('❌ Injection failed. Please paste manually.', 'error')
          })
        }
        return
      }

      try {
        platform.inject(el, text)
        closeSidebar()
        showToast(`Prompt injected into ${platform.name} ✓`)
      } catch (err) {
        console.error('[Flompt] Injection error:', err)
        navigator.clipboard.writeText(text).then(() => {
          showToast('Copied to clipboard — paste manually ✓')
        })
      }
    }

    tryInject()
  }

  // ── Toast notification ─────────────────────────────────────────────────────
  function showToast (message, type = 'success') {
    const existing = document.getElementById('flompt-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.id = 'flompt-toast'
    if (type === 'error') toast.classList.add('flompt-toast-error')
    toast.textContent = message
    document.body.appendChild(toast)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('flompt-toast-visible'))
    })

    setTimeout(() => {
      toast.classList.remove('flompt-toast-visible')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

})()
