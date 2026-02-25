;(function () {
  'use strict'

  // Guard against double injection
  if (window.__flomptInjected) return
  window.__flomptInjected = true

  // ── Config ─────────────────────────────────────────────────────────────────
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
   *  - name          : display name
   *  - test()        : hostname check
   *  - getInput()    : returns the contenteditable element to inject into
   *  - inject(el, t) : injects text into the element
   *  - getSendBtn()  : (optional) platform-specific send button selector
   */
  const PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      test: () => hostname.includes('chatgpt.com') || hostname.includes('openai.com'),
      getInput () {
        return (
          document.querySelector('#prompt-textarea[contenteditable]') ||
          document.querySelector('#prompt-textarea') ||
          document.querySelector('div[contenteditable="true"][data-virtualized="false"]')
        )
      },
      inject (el, text) { setContentEditable(el, text) },
      // Sélecteurs spécifiques ChatGPT (en plus de la traversal générique)
      getSendBtn () {
        return (
          document.querySelector('button[data-testid="send-button"]') ||
          document.querySelector('button[aria-label="Send prompt"]') ||
          document.querySelector('button[aria-label="Send message"]')
        )
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
      getSendBtn () {
        return (
          document.querySelector('button[aria-label="Send Message"]') ||
          document.querySelector('button[aria-label="Send message"]') ||
          document.querySelector('[data-testid="send-button"]')
        )
      },
    },
    gemini: {
      name: 'Gemini',
      test: () => hostname.includes('gemini.google.com'),
      getInput () {
        return (
          document.querySelector('rich-textarea div[contenteditable]') ||
          document.querySelector('rich-textarea [contenteditable="true"]') ||
          document.querySelector('div[contenteditable="true"]')
        )
      },
      inject (el, text) { setContentEditable(el, text) },
      getSendBtn () {
        return (
          document.querySelector('button.send-button') ||
          document.querySelector('button[aria-label="Send message"]') ||
          document.querySelector('button[mattooltip="Send message"]')
        )
      },
    },
  }

  const platform = Object.values(PLATFORMS).find(p => p.test()) || null

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setContentEditable (el, text) {
    el.focus()

    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)

    const inserted = document.execCommand('insertText', false, text)

    if (!inserted || el.textContent.trim() !== text.trim()) {
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

    setTimeout(() => el.dispatchEvent(new Event('change', { bubbles: true })), 50)
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let sidebarOpen = false
  let sidebarEl   = null
  let iframeEl    = null

  // ── DOM: Sidebar — pas de header custom, iframe plein hauteur ──────────────
  function buildSidebar () {
    const sidebar = document.createElement('div')
    sidebar.id = 'flompt-sidebar'

    // Splash screen — visible pendant le chargement de l'iframe
    const splash = document.createElement('div')
    splash.id = 'flompt-splash'
    splash.innerHTML = `
      <div id="flompt-splash-inner">
        <img id="flompt-splash-icon"
          src="${chrome.runtime.getURL('icons/icon.svg')}"
          width="72" height="72" alt="" aria-hidden="true">
        <span id="flompt-splash-title">Flompt</span>
      </div>
    `

    // Iframe — plein hauteur, l'app affiche son propre header
    const iframe = document.createElement('iframe')
    iframe.id  = 'flompt-iframe'
    iframe.src = FLOMPT_URL
    iframe.allow = 'clipboard-write'
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads')

    // Fade out du splash quand l'iframe est prête
    iframe.addEventListener('load', () => {
      const s = document.getElementById('flompt-splash')
      if (s) {
        s.classList.add('flompt-splash-hidden')
        setTimeout(() => s.remove(), 450)
      }
    })

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

  // ── DOM: Toggle button ─────────────────────────────────────────────────────
  const toggleBtn = document.createElement('button')
  toggleBtn.id    = 'flompt-toggle'
  toggleBtn.title = 'Flompt — Visual Prompt Builder'
  toggleBtn.setAttribute('aria-label', 'Open Flompt')
  toggleBtn.innerHTML = `
    <img id="flompt-toggle-icon"
      src="${chrome.runtime.getURL('icons/icon.svg')}"
      width="28" height="28" alt="" aria-hidden="true">
  `
  toggleBtn.addEventListener('click', toggleSidebar)

  // ── Insertion du toggle button — traversal générique depuis l'input ─────────
  //
  // Stratégie robuste :
  //   1. Essayer le sélecteur spécifique à la plateforme (getSendBtn)
  //   2. Sinon traverser le DOM depuis l'input connu jusqu'à trouver un
  //      bouton "send-like" (aria-label, data-testid, type=submit contenant "send")
  //   3. Fallback : bouton flottant bas-droite

  /**
   * Remonte depuis l'élément input jusqu'à trouver un bouton "send".
   * Indépendant des classes CSS et attributs spécifiques à chaque version.
   */
  function findSendBtnByTraversal () {
    const input = platform?.getInput()
    if (!input) return null

    let ancestor = input.parentElement
    for (let depth = 0; depth < 12 && ancestor && ancestor !== document.body; depth++) {
      const buttons = Array.from(ancestor.querySelectorAll('button'))
      const sendBtn = buttons.find(b => {
        const label   = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase()
        const testid  = (b.getAttribute('data-testid') || '').toLowerCase()
        const tooltip = (b.getAttribute('mattooltip') || '').toLowerCase()
        return (
          label.includes('send') ||
          testid.includes('send') ||
          tooltip.includes('send') ||
          b.type === 'submit'
        )
      })
      if (sendBtn) return sendBtn
      ancestor = ancestor.parentElement
    }
    return null
  }

  function tryInsertInToolbar () {
    if (toggleBtn.isConnected) return true

    // 1. Sélecteur spécifique à la plateforme
    // 2. Traversal générique depuis l'input (robuste aux changements de DOM)
    const sendBtn = platform?.getSendBtn?.() || findSendBtnByTraversal()
    if (!sendBtn?.parentElement) return false

    sendBtn.parentElement.insertBefore(toggleBtn, sendBtn)
    return true
  }

  // Retry avec un seul timer actif à la fois (pas de race condition)
  let mountTimer    = null
  let mountAttempts = 0

  function scheduleMount (delay = 500) {
    clearTimeout(mountTimer)
    mountTimer = setTimeout(mountToggleBtn, delay)
  }

  function mountToggleBtn () {
    if (tryInsertInToolbar()) return

    if (++mountAttempts >= 20) {
      // Fallback définitif : bouton flottant bas-droite
      if (!toggleBtn.isConnected) {
        toggleBtn.classList.add('flompt-floating')
        document.body.appendChild(toggleBtn)
      }
      return
    }

    scheduleMount(500)
  }

  // Lancement immédiat
  scheduleMount(0)

  // Ré-insertion si le bouton est retiré du DOM (navigation SPA)
  setInterval(() => {
    if (!toggleBtn.isConnected) {
      mountAttempts = 0
      scheduleMount(200) // petite pause pour laisser le DOM se stabiliser
    }
  }, 3000)

  // ── Messages depuis l'iframe Flompt ────────────────────────────────────────
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

  // ── Message depuis le service worker (clic icône toolbar) ─────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'FLOMPT_TOGGLE') toggleSidebar()
  })

  // ── Injection du prompt dans l'input de la plateforme ─────────────────────
  function injectPrompt (text) {
    if (!platform) {
      showToast('❌ Platform not detected. Try refreshing.', 'error')
      return
    }

    let attempts = 0
    const tryInject = () => {
      const el = platform.getInput()
      if (!el) {
        if (++attempts < 3) {
          setTimeout(tryInject, 500)
        } else {
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
