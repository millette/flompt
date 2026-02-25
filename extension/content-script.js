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

  const SIDEBAR_W_DEFAULT = 440
  const SIDEBAR_W_MIN     = 300
  const SIDEBAR_W_MAX     = 900

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

  /** Lit le texte courant de l'input de la plateforme */
  function getInputText () {
    const el = platform?.getInput()
    if (!el) return ''
    return el.textContent || el.value || ''
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let sidebarOpen         = false
  let sidebarEl           = null
  let iframeEl            = null
  let iframeReady         = false
  let currentSidebarWidth = SIDEBAR_W_DEFAULT
  let inputSyncObserver   = null
  let inputSyncDebounce   = null

  // ── Bidirectional sync: platform input → iframe ────────────────────────────
  function sendPlatformInputToIframe () {
    if (!iframeEl?.contentWindow || !iframeReady) return
    const text = getInputText()
    iframeEl.contentWindow.postMessage({
      type: 'FLOMPT_PLATFORM_INPUT',
      text,
      platform: platform?.name || 'Unknown',
    }, FLOMPT_ORIGIN)
  }

  /** Active l'observation de l'input plateforme pour sync en temps réel */
  function setupInputSync () {
    if (inputSyncObserver) return
    const el = platform?.getInput()
    if (!el) return

    const debouncedSend = () => {
      clearTimeout(inputSyncDebounce)
      inputSyncDebounce = setTimeout(sendPlatformInputToIframe, 400)
    }

    el.addEventListener('input', debouncedSend)

    inputSyncObserver = new MutationObserver(debouncedSend)
    inputSyncObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  function teardownInputSync () {
    if (inputSyncObserver) {
      inputSyncObserver.disconnect()
      inputSyncObserver = null
    }
    clearTimeout(inputSyncDebounce)
  }

  // ── DOM: Resize handle (bord gauche de la sidebar) ─────────────────────────
  function buildResizeHandle () {
    const handle = document.createElement('div')
    handle.id = 'flompt-resize-handle'

    let startX    = 0
    let startWidth = 0

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      startX     = e.clientX
      startWidth = sidebarEl.offsetWidth

      document.body.style.userSelect = 'none'
      sidebarEl.classList.add('flompt-resizing')
      document.body.classList.add('flompt-resizing')

      const onMouseMove = (e) => {
        // Drag vers la gauche = augmenter la largeur
        const dx       = startX - e.clientX
        const newWidth = Math.max(
          SIDEBAR_W_MIN,
          Math.min(SIDEBAR_W_MAX, Math.min(startWidth + dx, window.innerWidth * 0.9))
        )
        currentSidebarWidth = newWidth
        sidebarEl.style.setProperty('width', newWidth + 'px', 'important')

        if (sidebarOpen) {
          document.body.style.setProperty('margin-right', newWidth + 'px', 'important')
        }

        // Mettre à jour le bouton flottant actif
        if (toggleBtn.classList.contains('flompt-floating') && toggleBtn.classList.contains('flompt-active')) {
          toggleBtn.style.setProperty('right', (newWidth + 20) + 'px', 'important')
        }
      }

      const onMouseUp = () => {
        document.body.style.userSelect = ''
        sidebarEl.classList.remove('flompt-resizing')
        document.body.classList.remove('flompt-resizing')
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })

    return handle
  }

  // ── DOM: Close tab (onglet de fermeture sur le bord gauche) ───────────────
  function buildCloseTab () {
    const tab = document.createElement('button')
    tab.id = 'flompt-close-tab'
    tab.setAttribute('aria-label', 'Close Flompt')
    tab.title = 'Close Flompt'
    tab.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `
    tab.addEventListener('click', closeSidebar)
    return tab
  }

  // ── DOM: Sidebar — iframe plein hauteur, onglet close + resize ─────────────
  function buildSidebar () {
    const sidebar = document.createElement('div')
    sidebar.id = 'flompt-sidebar'

    // Splash screen — visible pendant le chargement
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

    // Iframe
    const iframe = document.createElement('iframe')
    iframe.id  = 'flompt-iframe'
    iframe.src = FLOMPT_URL
    iframe.allow = 'clipboard-write'
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads')

    iframe.addEventListener('load', () => {
      iframeReady = true
      const s = document.getElementById('flompt-splash')
      if (s) {
        s.classList.add('flompt-splash-hidden')
        setTimeout(() => s.remove(), 450)
      }
      // Sync initial après chargement de l'iframe
      setTimeout(sendPlatformInputToIframe, 300)
    })

    // Composants UI
    const resizeHandle = buildResizeHandle()
    const closeTab     = buildCloseTab()

    sidebar.appendChild(resizeHandle)
    sidebar.appendChild(closeTab)
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
    // Appliquer la largeur dynamique au body
    document.body.style.setProperty('margin-right', currentSidebarWidth + 'px', 'important')
    document.body.classList.add('flompt-body-shifted')
    toggleBtn.classList.add('flompt-active')

    // Bouton flottant : déplacer à gauche de la sidebar
    if (toggleBtn.classList.contains('flompt-floating')) {
      toggleBtn.style.setProperty('right', (currentSidebarWidth + 20) + 'px', 'important')
    }

    // Activer la sync bidirectionnelle
    setupInputSync()

    // Envoyer le contenu actuel si l'iframe est déjà prête
    if (iframeReady) {
      setTimeout(sendPlatformInputToIframe, 200)
    }
  }

  function closeSidebar () {
    sidebarOpen = false
    sidebarEl?.classList.remove('flompt-open')
    document.body.classList.remove('flompt-body-shifted')
    document.body.style.removeProperty('margin-right')
    toggleBtn?.classList.remove('flompt-active')

    // Restaurer la position du bouton flottant
    if (toggleBtn?.classList.contains('flompt-floating')) {
      toggleBtn.style.removeProperty('right')
    }
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

  // ── Insertion du toggle — extrême gauche de la toolbar ────────────────────
  //
  // Stratégie :
  //   1. Trouver le bouton "Send" (via sélecteur spécifique ou traversal DOM)
  //   2. Récupérer son conteneur parent (la toolbar)
  //   3. Insérer le bouton Flompt en PREMIER dans ce conteneur (extrême gauche)
  //   4. Fallback : bouton flottant bas-droite

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

    const sendBtn = platform?.getSendBtn?.() || findSendBtnByTraversal()
    if (!sendBtn?.parentElement) return false

    const container = sendBtn.parentElement
    // Insérer en PREMIER (extrême gauche) de la barre d'outils
    container.insertBefore(toggleBtn, container.firstChild)
    return true
  }

  // Retry avec timer unique (pas de race condition)
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

  // Ré-insertion si le bouton disparaît (navigation SPA)
  setInterval(() => {
    if (!toggleBtn.isConnected) {
      mountAttempts = 0
      scheduleMount(200)
    }
  }, 3000)

  // ── Messages depuis l'iframe Flompt ────────────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.origin !== FLOMPT_ORIGIN) return

    const { type, prompt } = event.data ?? {}

    // Injection du prompt compilé dans la plateforme
    if (type === 'FLOMPT_INJECT' && typeof prompt === 'string') {
      injectPrompt(prompt)
    }

    // Fermeture de la sidebar depuis l'app
    if (type === 'FLOMPT_CLOSE') {
      closeSidebar()
    }

    // L'app demande la valeur actuelle de l'input plateforme
    if (type === 'FLOMPT_SYNC_REQUEST') {
      sendPlatformInputToIframe()
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
