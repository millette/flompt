;(function () {
  'use strict'

  // Guard against double injection
  if (window.__flomptInjected) return
  window.__flomptInjected = true

  // ── Config ─────────────────────────────────────────────────────────────────
  const FLOMPT_URL    = 'https://flompt.dev/?extension=1'
  const FLOMPT_ORIGIN = 'https://flompt.dev'
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
        return (
          document.querySelector('#prompt-textarea') ||
          document.querySelector('textarea[data-id]') ||
          document.querySelector('div[contenteditable="true"][data-virtualized="false"]')
        )
      },
      inject (el, text) {
        el.focus()
        if (el.tagName === 'TEXTAREA') {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
          setter.call(el, text)
          el.dispatchEvent(new Event('input', { bubbles: true }))
        } else {
          setContentEditable(el, text)
        }
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
        return (
          document.querySelector('div[contenteditable="true"].ql-editor') ||
          document.querySelector('rich-textarea div[contenteditable]') ||
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
    // Clear existing content
    document.execCommand('selectAll', false, null)
    document.execCommand('delete', false, null)
    // Insert new text
    document.execCommand('insertText', false, text)
    // Fallback if execCommand didn't work
    if (!el.textContent.trim()) {
      el.textContent = text
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }))
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let sidebarOpen = false
  let sidebarEl   = null
  let iframeEl    = null

  // ── DOM: Sidebar ───────────────────────────────────────────────────────────
  function buildSidebar () {
    const sidebar = document.createElement('div')
    sidebar.id = 'flompt-sidebar'

    const header = document.createElement('div')
    header.id = 'flompt-sidebar-header'
    header.innerHTML = `
      <img class="flompt-logo" src="${chrome.runtime.getURL('icons/logo.svg')}" alt="Flompt">
      <button id="flompt-close" title="Close">✕</button>
    `

    const iframe = document.createElement('iframe')
    iframe.id  = 'flompt-iframe'
    iframe.src = FLOMPT_URL
    iframe.allow = 'clipboard-write'
    // allow-same-origin lets postMessage work with origin check
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads')

    sidebar.appendChild(header)
    sidebar.appendChild(iframe)
    document.body.appendChild(sidebar)

    header.querySelector('#flompt-close').addEventListener('click', closeSidebar)

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
  toggleBtn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 12h5.5L7 18l10-10h-6L10 2z" fill="white"/>
    </svg>
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
