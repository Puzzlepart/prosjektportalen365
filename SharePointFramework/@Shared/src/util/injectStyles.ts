/**
 * Inject styles
 * 
 * @param {string} css CSS 
 * 
 * @returns {HTMLStyleElement} The style element
 */
export default function injectStyles(css: string): HTMLStyleElement {
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    head.appendChild(style);
    style.type = 'text/css';
    if (style['styleSheet']) {
        style['styleSheet'].cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    return style;
}