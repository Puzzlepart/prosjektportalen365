/**
 * Resolves once no menu has the focus and SharePoint has had time to tidy up after it: at once
 * when no menu has it, and at the latest after `timeout` milliseconds.
 *
 * A list view command run from SharePoint's "Mer" menu runs while that menu is still open. As the
 * menu closes, SharePoint's own focus manager (Tabster, in its list bundle) hides what was added to
 * the page meanwhile from assistive technology (`aria-hidden="true"`) and never shows it again:
 * the template package catalog, opened from there, was a dialog screen readers could not find
 * (#1788, 2026-10-19). Opened once this has resolved, it is not hidden, and the focus is back on
 * SharePoint's button for the menu, which is then what to give it back to.
 *
 * @param timeout The longest wait, in milliseconds
 * @param settle How long to wait after the menu has closed, for SharePoint's own update
 */
export function whenHostMenuHasClosed(timeout = 1_000, settle = 150): Promise<void> {
  const inMenu = () => Boolean(document.activeElement?.closest('[role="menu"]'))
  if (!inMenu()) return Promise.resolve()
  const started = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      if (Date.now() - started >= timeout) resolve()
      else if (inMenu()) setTimeout(check, 50)
      else setTimeout(resolve, settle)
    }
    setTimeout(check, 50)
  })
}
