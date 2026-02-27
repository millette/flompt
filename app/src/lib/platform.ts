/** True when flompt is running inside the browser extension sidebar. */
export const isExtension = new URLSearchParams(window.location.search).get('extension') === '1'
