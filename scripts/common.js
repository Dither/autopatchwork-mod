/**
 * Returns Array of first level keys of the passed Object.
 * @return {Array} Array of keys in 'this' object.
 * */
if (!Object.prototype.keys) {
    Object.prototype.keys = (function() {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
            dontEnumsLength = dontEnums.length;
        return function() {
            var obj = this;
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) throw new TypeError('Object.keys called on non-object');
            var result = [], prop, i;
            for (prop in obj) if (hasOwnProperty.call(obj, prop)) result.push(prop);
            if (hasDontEnumBug) for (i = 0; i < dontEnumsLength; i++) if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
            return result;
        };
    }());
}

var debug = false, profiler = false, prof_first_run = true;

var browser_type,
    BROWSER_CHROME = 1,
    BROWSER_SAFARI = 2,
    BROWSER_OPERA = 3;

if (typeof browser === 'undefined' && typeof chrome !== 'undefined') browser = chrome;
if ((!!window.browser && !!window.browser.runtime) || (typeof InstallTrigger !== 'undefined')) browser_type = BROWSER_CHROME
else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) browser_type = BROWSER_SAFARI;
else browser_type = BROWSER_OPERA;

/**
 * Logging function.
 * @param {Array|String} arguments Data to put to debug output.
 * */
function log() {
    if (!debug) return;
    if (browser_type === BROWSER_OPERA) {
        window.opera.postError('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
    } else if (window.console) {
        window.console.log('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
    }
}

/**
 * Profiling function.
 * @param {String} name Profiled function name.
 * @param {Any} end Any variable to mark function end.
 * @example profile('function_name'); some code; profile('function_name', 'end');
 * */
function profile(name, end) {
    if (!debug || !profiler) return;
    if (prof_first_run) { prof_first_run = false; console.log('============================'); }
    if (typeof end === 'undefined') {
        console.time(name);
    } else {
        console.timeEnd(name);
    }
}

/* jshint ignore:start */
/**
* Checks variable and explictly converts string to the corresponding boolean.
* Possible data values are: undefined, null, unknown text or a number (treated as false here except 1),
*                           'on', 'off', '1', '0', 1, 0, 'true', 'false', true, false).
* @param {*} s Data to check.
* @return {boolean} Boolean result.
* */
function s2b(s) { return ((typeof s !== 'undefined') && s && (s === true || s === 'true' || s === 'on' || s == 1)) ? true : false; }
/* jshint ignore:end */

/**
 * APW exception object.
 * @param {String} message Event string.
 * */
function APWException(message) {
    this.message = message;
    this.name = '[AutoPatchWork]';
}

/**
 * Dispatches standard event on the document.
 * @param {String} type Event name string.
 * @param {Array} opt Array of event's parameters.
 * */
function dispatch_event(type, opt) {
    var ev = new window.CustomEvent(type, { 'detail': opt });
    document.dispatchEvent(ev);
}

/**
 * Dispatches HTML event on specific node.
 * @param {Node} element Node to fire event on.
 * @param {String} event Event name string.
 * */
function dispatch_html_event(element, event) {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent(event, true, true ); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
}
