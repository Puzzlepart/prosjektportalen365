/**
 * Inject styles
 *
 * @param {string} css CSS
 */
export default function injectStyles(css) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    head.appendChild(style);
    style.type = 'text/css';
    if (style['styleSheet']) {
        style['styleSheet'].cssText = css;
    }
    else {
        style.appendChild(document.createTextNode(css));
    }
}
//# sourceMappingURL=injectStyles.js.map