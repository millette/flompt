// background.js — Service worker
// Toggle the flompt sidebar when the extension icon is clicked

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'FLOMPT_TOGGLE' }).catch(() => {
    // Content script not yet injected on this tab — ignore
  })
})
