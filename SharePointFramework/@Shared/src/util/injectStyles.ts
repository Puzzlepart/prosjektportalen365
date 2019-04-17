/**
 * Inject styles
 * 
 * @param {string} css CSS 
 */
export default function injectStyles(css: string) {
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    head.appendChild(style);
    style.type = 'text/css';
    if (style['styleSheet']) {
        style['styleSheet'].cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
}