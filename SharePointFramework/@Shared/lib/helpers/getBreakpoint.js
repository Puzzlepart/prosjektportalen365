var BREAKPOINTS = {
    sm: [320, 479],
    md: [480, 639],
    lg: [640, 1023],
    xl: [1024, 1365],
    xxl: [1366, 1919],
    xxxl: [1920, 4000],
};
export default function () {
    var windowWidth = window.innerWidth;
    var breakpoint = Object.keys(BREAKPOINTS).filter(function (key) {
        var _a = BREAKPOINTS[key], f = _a[0], t = _a[1];
        if (windowWidth < f) {
            return false;
        }
        if (t) {
            return windowWidth <= t;
        }
        return true;
    })[0];
    return breakpoint;
};
//# sourceMappingURL=getBreakpoint.js.map