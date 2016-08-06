// ==UserScript==
// @include http*
// @exclude *//localhost*
// @exclude *//127.0.0.*
// @exclude *//192.168.*
// @exclude *.com/embed*
// @run-at document-start
// @grant none
// ==/UserScript==

/*
 * Normal AutoPatchWork event flow:
 *  AutoPatchWork.init (internal) - we are on some site, requesting SITEINFO for it;
 *  AutoPatchWork.siteinfo - received SITEINFO for the current site;
 *  AutoPatchWork.initialized - extension initialized;
 *  AutoPatchWork.ready - extension ready;
 *  scroll (internal) - got some page scrolling;
 *  AutoPatchWork.request - sending request for the next page;
 *  AutoPatchWork.load - got new page data and ready to pre-process it for content and title;
 *  AutoPatchWork.append - appending next page content to the current page;
 *  AutoPatchWork.DOMNodeInserted - firing custom DOMNodeInserted event on appending actual content nodes;
 *  AutoPatchWork.pageloaded - page loaded successfully;
 *  AutoPatchWork.error - page failed to load, (possibly) recoverable error;
 *  AutoPatchWork.terminated - stopping extension, unrecoverable error or end-condition.
 *
 * Service events:
 *  resize (internal) - on window resize
 *  AutoPatchWork.reset - reset extension;
 *  AutoPatchWork.state - set disabled/enabled state;
 *  AutoPatchWork.toggle - toggle between disabled/enabled states.
*/

/**
 * @throws {APWException}
 */
(function APW(XPathResult, XMLHttpRequest, Node, history, location, sessionStorage, Notification) {
    //"use strict";  enable strict mode within this function
    if (window.name === 'autopatchwork-request-iframe') return;

    var browser_type, checksum, text_enc,
        debug = false,
        /*profiler = false,
         prof_first_run = true,*/
        dump_request = false;

    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        text_enc = new window.TextEncoder('utf-8');
        checksum = function (str) {
            return window.crypto.subtle.digest('MD5', text_enc.encode(str));
        };
    } else {
        /**
         * @class FastCRC32
         * @constructor
         * */
        var FastCRC32 = function FastCRC32() {
            /** @const {array} _table*/
            this._table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];
            /** @property {number} _crc Last computed CRC. */
            this._crc = 0;

            return this;
        };

        FastCRC32.prototype = {
            /** @property {function} crc Computes CRC. */
            crc: function (string) {
                var crc = 0 ^ (-1);
                for(var i=0, l=string.length; i<l; i++) {
                  crc = (crc >>> 8) ^ this._table[(crc ^ string.charCodeAt(i)) & 0xFF];
                }
                this._crc = crc ^ (-1);
                return this;
            },
            /** @property {function} then Handler accepting function(number){}
             *                            that is called with computed CRC as argument.*/
            then: function(callback) {
                if (callback) {
                    callback(this._crc);
                }
                return this;
            }
        };

        checksum = new FastCRC32;
        checksum = checksum.crc.bind(checksum);
    }

    /**
     * @const
     */
    var BROWSER_CHROME = 1,
        BROWSER_SAFARI = 2,
        BROWSER_OPERA = 3;

    /**
     * @struct
     */
    var options = {
        APW_CSS: '',
        BAR_STATUS: true,
        BASE_INTERPAGE_DELAY: 500,
        BASE_REMAINING_HEIGHT: 800,
        CHANGE_ADDRESS: false,
        CRC_CHECKING: false,
        DEFAULT_STATE: true,
        FORCE_ABSOLUTE_HREFS: true,
        FORCE_ABSOLUTE_IMG_SRCS: false,
        FORCE_TARGET_WINDOW: true,
        IGNORE_CORS: true,
        NOTIFICATIONS_ENABLED: false,
        TARGET_WINDOW_NAME: '_blank',
        TRY_CORRECT_LAZY: false
    };

    /**
     * @struct
     */
    var status = {
        button_elem: null,
        button_elem_selector: null,
        change_address: false,
        content_last: null,
        content_parent: null,
        css_patch: null,
        js_patch: null,
        last_element: null,
        loading: false,
        next_link: null,
        next_link_mask: null,
        next_link_selector: null,
        page_elem: null,
        page_elem_selector: null,
        page_number: 1,
        prev_link: null,
        prev_link_mask: null,
        prev_link_selector: null,
        remaining_height: null,
        remove_elem: null,
        remove_elem_selector: null,
        reversed: false,
        scripts_allowed: false,
        separator_disabled: false,
        service: false,
        state: false,
        use_iframe_req: null,
        dom_modification_events: false,
        id: -1,
        /**
         * @struct
         */
        ajax: {
            load_delay: 500,
            load_count: 0,
            start_time: Date.now(),
            retry_base: 2.3, // retry_base^attempt
            zero_shift: 0.25, // (1 - .25)*1000ms base delay
            retry_max: 1,
            last_url: ''
        }
    };

    if (typeof browser === 'undefined' && typeof chrome !== 'undefined') browser = chrome;
    if ((!!window.browser && !!window.browser.runtime) || (typeof InstallTrigger !== 'undefined')) browser_type = BROWSER_CHROME
    else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) browser_type = BROWSER_SAFARI;
    else browser_type = BROWSER_OPERA;

    /** @constructor */
    function APWException(message) {
        this.message = message;
        this.name = '[AutoPatchWork]';
    }

    /**
     * Profiling function.
     * @param {string} name Profiled function name.
     * @param {*} end Any variable to mark function end.
     * @example profile('function_name'); some code; profile('function_name', 'end');
     * */
    /*function profile(name, end) {
        if (!debug || !profiler) return;
        if (prof_first_run) { prof_first_run = false; console.log('============================'); }
        if (typeof end === 'undefined') {
            console.time(name);
        } else {
            console.timeEnd(name);
        }
    }*/

    /**
     * Logging function.
     * @param {...Array|string} arguments Data to put to debug output.
     * */
    function log() {
        if (!debug) return;
        if (window.console) {
            console.log('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        } else if (browser_type === BROWSER_OPERA) {
            window.opera.postError('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        }
    }

    /**
     * Addds CSS to the current page once per type.
     * @param {string} css CSS string.
     * @param {string} type Type of style.
     * */
    function add_css(css, type) {
        if (typeof css !== 'string' || css === '' || (type && document.head.querySelector('[data-apw-css="'+(type || 'default')+'"]'))) return;
        var style = document.createElement('style');
        style.textContent = css;
        style.setAttribute('data-apw-css', (type || 'default'));
        style.type = 'text/css';
        document.head.appendChild(style);
    }

    /**
     * Removes CSS added by the extension by type.
     * @param {string} type Type of style.
     * */
    function remove_css(type) {
        for (var i = 0, r = document.head.querySelectorAll('[data-apw-css'+(type?('="'+type+'"'):'')+']'), l = r.length; i < l; i++)
            if (r[i].parentNode)
                r[i].parentNode.removeChild(r[i]);
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
     * Dispatches standard event on the document.
     * @param {string} type Event name string.
     * @param {Object} opt Object of event's parameters.
     * */
    function dispatch_event(type, opt) {
        var ev = new window.CustomEvent(type, { 'detail': opt });
        document.dispatchEvent(ev);
    }

    /**
     * Dispatches modification event on the target node.
     * @param {Object} opt Object of event's parameters.
     * */
    function dispatch_mutation_event(opt) {
        var mue = document.createEvent('MutationEvent');
        mue.initMutationEvent(opt.eventName, opt.bubbles, opt.cancelable, opt.relatedNode, opt.prevValue, opt.newValue, opt.attrName, opt.attrChange);
        opt.targetNode.dispatchEvent(mue);
    }

    /**
     * Dispatches notification.
     * @param {Object} opt Object of event's message data.
     * */
    function dispatch_notification(opt) {
        if (!options.NOTIFICATIONS_ENABLED || !Notification) return;
        var notify = function notify() {
            var n = new Notification((opt.extension || '') + ' ' + (opt.type || ''), { body: (opt.text || '') });
            setTimeout(n.close.bind(n), 4000);
        };
        if (Notification.permission)
            switch (Notification.permission) {
                case 'granted':
                    notify();
                    break;
                case 'denied':
                    break;
                default:
                    Notification.requestPermission(function (permission) {
                        if (permission === 'granted') notify();
                    });
            }
    }

    /**
     * Creates HTML document object from a string.
     * @param {string} source String with HTML-formatted text.
     * @return {HTMLDocument} DOM-document.
     * */
    function create_html(source) {
        // Chrome 4, Opera 10, Firefox 4, Internet Explorer 9, Safari 4 have createHTMLDocument
        var doc = document.implementation.createHTMLDocument('HTMLParser');
        doc.documentElement.innerHTML = source;
        return doc;
    }

    /**
     * Evaluates CSS selector to find a node.
     * @param {Element} doc Node to perform selector search on.
     * @return {Element} Matched node.
     * */
    function get_node(doc, path) {
        if (typeof doc === 'string') {
            return document.querySelector(doc);
        }
        return doc.querySelector(path);
    }

    /**
     * Evaluates XPath to find a node.
     * @param {Element} doc Node to perform XPath search on.
     * @return {Element} Matched node.
     * */
    function get_node_xpath(doc, path) {
        if (typeof doc === 'string') {
            return document.evaluate(doc, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        //if (typeof doc.selectSingleNode === 'undefined')
        return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        //else return doc.selectSingleNode(path);
    }

    if (!APW.loaded) {
        var args = arguments;
        document.addEventListener('DOMContentLoaded', function () {
            APW.loaded = true;
            APW.apply(window, args);
        }, false);
        return;
    }

    var sendRequest;
    switch (browser_type) {
        case BROWSER_CHROME:
            sendRequest = function (data, callback) {
                if (callback) chrome.runtime.sendMessage(data, callback);
                else chrome.runtime.sendMessage(data);
            };
            break;
        case BROWSER_SAFARI:
            sendRequest = (function () {
                var eventData = {};
                safari.self.addEventListener('message', function (evt) {
                    if (evt.name in eventData) eventData[evt.name](evt.message);
                }, false);
                return function (data, callback, name) {
                    name = (name || '') + (Date.now() + Math.random().toString(36));
                    if (callback) eventData[name] = callback;
                    safari.self.tab.dispatchMessage(name, data);
                };
            })();
            break;
        case BROWSER_OPERA:
            sendRequest = (function () {
                if (!Object.keys) Object.keys = function (k) { var r = []; for (var i in k) if (k.hasOwnProperty(i)) r.push(i); return r; };
                var eventData = {};
                opera.extension.onmessage = function (evt) {
                    if (evt.data.name in eventData) eventData[evt.data.name](evt.data.data);
                };
                return function (data, callback, name) {
                    name = (name || '') + (Date.now() + Math.random().toString(36));
                    if (callback) eventData[name] = callback;
                    opera.extension.postMessage({ name: name, data: data });
                };
            })();
            break;
        default:
            sendRequest = null;
            throw new APWException('Browser not detected!');
    } // switch(browser_type)

    var matched_siteinfo = [],
          rootNode = /BackCompat/.test(document.compatMode) ? document.body : document.documentElement;

    /**
     * Sets event listener for external scripts (once per name).
     * @param {string} name Event shorthand name.
     * @param {function} callback Event callback.
     * */
    var event_handlers = {};
    function on(name, callback) {
        if (!callback || !name) return;
        if (event_handlers[name]) {
            document.removeEventListener('AutoPatchWork.' + name, event_handlers[name], false);
        }
        event_handlers[name] = callback;
        document.addEventListener('AutoPatchWork.' + name, event_handlers[name], false);
    }

    /**
     * Removes event listener for external scripts.
     * @param {string} name Event shorthand name.
     * */
    function off(name) {
        if (!name || !event_handlers[name]) return;
        document.removeEventListener('AutoPatchWork.' + name, event_handlers[name], false);
        delete event_handlers[name];
    }

    /**
     * Dispatches shorthand event on the document.
     * @param {string} type Shorthand event name string.
     * @param {Array} opt Array of event's parameters.
     * */
    function trigger(type, opt) {
        dispatch_event('AutoPatchWork.' + type, opt);
    }

    window.AutoPatchWorked = {on: on, off: off, trigger: trigger, create_html: create_html, get_node: get_node, get_node_x: get_node_xpath};

    // Begin listening for init messages and request configuration if got one
    document.addEventListener('AutoPatchWork.init', init, false);
    // Begin listening and processing SITEINFO messages; send reset event if got one while active
    document.addEventListener('AutoPatchWork.siteinfo', siteinfo, false);

    /**
     * APW configuration sync with the background process handler
     * */
    function init() {
        sendRequest({ url: location.href, isFrame: window.top !== window.self }, begin_init, 'AutoPatchWorkInit' );
    }

    dispatch_event('AutoPatchWork.init');

    /* Hash changes affecting content can be handled by external scripts and forceIframe can be manually set in preferences or by SITEINFO field now. */

    /**
     * APW initialisation, config reading and fail registration.
     * @param {Object} info Contains APW paramenters.
     * */
    function begin_init(info) {
        if (typeof info === 'undefined') return dispatch_event('AutoPatchWork.ready');
        if (info.config) {
            options.FORCE_ABSOLUTE_HREFS =  info.config.force_abs_hrefs;
            options.FORCE_ABSOLUTE_IMG_SRCS =  info.config.force_abs_srcs;
            options.NOTIFICATIONS_ENABLED = info.config.enable_notifications;
            options.CRC_CHECKING =  info.config.check_crc;
            options.BASE_REMAINING_HEIGHT = info.config.remaining_height;
            options.DEFAULT_STATE = info.config.auto_start;
            options.FORCE_TARGET_WINDOW = info.config.target_blank;
            options.CHANGE_ADDRESS = info.config.change_address;
            options.BAR_STATUS = info.config.bar_status;
            options.APW_CSS = info.css;
            debug = info.config.debug_mode;
        }
        if (!info.siteinfo || !info.siteinfo.length) return dispatch_event('AutoPatchWork.ready');
        matched_siteinfo = info.siteinfo;
        var fails = [];
        var ready = matched_siteinfo.some(function (s) {
            return new AutoPatchWork(s) || (fails.push(s), false);
        });
        if (ready === false) sendRequest({ failed_siteinfo: fails });
        dispatch_event('AutoPatchWork.ready');
    }

    /**
     * Event handler for receiving SITEINFO.
     * @param {Event} event Event data.
     * */
    function siteinfo(event) {
        if (event.detail && event.detail.siteinfo) {
            if (!window.AutoPatchWorked.already) {
                new AutoPatchWork(event.detail.siteinfo);
            } else {
                dispatch_event('AutoPatchWork.reset', {'siteinfo': event.detail.siteinfo});
            }
        }
    }

    /**
     * AutoPatchWork main.
     * @param {Object} SITEINFO structure for the current site.
     * @constructor
     * */
    function AutoPatchWork(siteinfo) {
        if (window.AutoPatchWorked.already) return true;

        var base_url = get_base_url(),
            downloaded_pages = [],
            page_titles = [],
            requested_urls = {},
            loaded_crcs = {},
            error_timeout = 0,
            request = request_xhr;

        status.service = s2b(siteinfo.SERVICE);
        if(!status.service) {
            status.change_address = typeof siteinfo.forceAddressChange !== 'undefined' ? !s2b(siteinfo.forceAddressChange) ^ !options.CHANGE_ADDRESS : options.CHANGE_ADDRESS;
        }

        status.dom_modification_events = siteinfo.domEvents || false;
        status.css_patch = siteinfo.cssPatch || null;
        status.js_patch = siteinfo.jsPatch || null;
        if (status.js_patch) run_script(status.js_patch);

        status.page_elem = siteinfo.pageElement || null;
        status.page_elem_selector = siteinfo.pageElementSelector || null;
        if (status.page_elem) try {
            document.querySelector(status.page_elem);
            status.page_elem_selector = status.page_elem;
            status.page_elem = null;
        } catch (bug) {
            status.page_elem_selector = null;
        }

        status.button_elem = siteinfo.buttonElement || null;
        status.button_elem_selector = siteinfo.buttonElementSelector || null;
        if (status.button_elem) try {
            document.querySelector(status.button_elem);
            status.button_elem_selector = status.button_elem;
            status.button_elem = null;
        } catch (bug) {
            status.button_elem_selector = null;
        }

        status.remove_elem = siteinfo.removeElement || null;
        status.remove_elem_selector = siteinfo.removeElementSelector || null;
        if (status.remove_elem) try {
            document.querySelector(status.remove_elem);
            status.remove_elem_selector = status.remove_elem;
            status.remove_elem = null;
        } catch (bug) {
            status.remove_elem_selector = null;
        }

        if (!status.page_elem && !status.page_elem_selector && !status.button_elem && !status.button_elem_selector && status.service) return true;

        status.next_link = siteinfo.nextLink || null;
        status.next_link_selector = siteinfo.nextLinkSelector || null;
        if (status.next_link) {
            if (status.next_link.indexOf('http') === 0 && ~status.next_link.indexOf('|')) {
                status.next_link_mask = status.next_link;
                status.next_link = null;
            } else try {
                document.querySelector(status.next_link);
                status.next_link_selector = status.next_link;
                status.next_link = null;
            } catch (bug) {
                status.next_link_selector = null;
            }
        }

        status.prev_link = siteinfo.prevLink || null;
        status.prev_link_selector = siteinfo.prevLinkSelector || null;
        if (status.prev_link) {
            if (status.prev_link.indexOf('http') === 0 && ~status.prev_link.indexOf('|')) {
                status.prev_link_mask = status.prev_link;
                status.prev_link = null;
            } else try {
                document.querySelector(status.prev_link);
                status.prev_link_selector = status.prev_link;
                status.prev_link = null;
            } catch (bug) {
                status.prev_link_selector = null;
            }
        }

        status.next_link_mask = siteinfo.nextMask || null;
        if (status.next_link_mask) {
            var arr = status.next_link_mask.split('|'),
                matches = /\d{1,}/.exec(location.href.replace(arr[0],'').replace(arr[2],'')),
                pagen = parseInt(arr[1], 10);
            if (isNaN(pagen) || !matches) {
                status.page_number = 1;
            } else {
                status.page_number = parseInt(matches[0], 10) / pagen;
            }
        } else {
            status.page_number = 1;
        }

        status.id = parseInt(siteinfo['wedata.net.id'], 10) || -1;
        status.separator_disabled = s2b(siteinfo.disableSeparator);
        status.scripts_allowed = s2b(siteinfo.allowScripts);
        status.use_iframe_req = typeof siteinfo.forceIframe !== 'undefined' ? s2b(siteinfo.forceIframe) : null;

        if (!s2b(siteinfo.MICROFORMAT)) log('detected SITEINFO = ' + JSON.stringify(siteinfo, null, 4));

        var not_button_mode = (!status.button_elem && !status.button_elem_selector),
            next = not_button_mode ? get_next_link(document) : null,
            page_elements = not_button_mode ? get_main_content(document) : null;

        if (not_button_mode) parse_links(next);

        if (!status.service) {
            if (status.button_elem) {
                if (!get_node_xpath(document, status.button_elem)) { log('next page button ' + status.button_elem + ' not found'); return false; }
            } else if (status.button_elem_selector) {
                if (!get_node(document, status.button_elem_selector)) { log('next page button ' + status.button_elem_selector + ' not found'); return false; }
            } else {
                if (!get_href(next)) {
                    if (s2b(siteinfo.MICROFORMAT)) return false;
                    log('next page link ' + (status.next_link || status.next_link_selector || status.next_link_mask)  + ' not found');
                    return false;
                }
                if (!page_elements || !page_elements.length) {
                    if (s2b(siteinfo.MICROFORMAT)) return false;
                    log('page content ' + (status.page_elem || status.page_elem_selector)  + ' not found');
                    return false;
                }
            }

            /* External event handlers can be used to fix individual sites instead of doing it here. */

            if (next && status.use_iframe_req === null)
                if ((next.host && next.host.length && next.host !== location.host) ||
                    (next.protocol && next.protocol.length && !~next.protocol.indexOf('javascript') &&
                     next.protocol !== location.protocol)
                ) {
                    log('next page has different base address: switching to IFrame requests...');
                    status.use_iframe_req = true;
                }
        }

        if (status.use_iframe_req) request = request_iframe;

        if (not_button_mode) {
            status.first_element = page_elements[0];
            status.last_element = page_elements.pop();

            var insert_before = siteinfo.insertBefore || null,
                insert_before_selector = siteinfo.insertBeforeSelector || null;

            if (insert_before) try {
                document.querySelector(insert_before);
                insert_before_selector = insert_before;
                insert_before = null;
            } catch (bug) {
                insert_before_selector = null;
            }

            if (insert_before || insert_before_selector) {
                try {
                    if (insert_before) status.content_last = get_node_xpath(document, insert_before);
                    else status.content_last = get_node(document, insert_before_selector);
                    status.content_parent = status.content_last.parentNode;
                } catch (bug) {
                    status.content_last = status.last_element.nextSibling;
                    status.content_parent = status.last_element.parentNode;
                }
            } else {
                status.content_last = status.last_element.nextSibling; // null if there are no elements after
                status.content_parent = status.last_element.parentNode;
            }
        }

        requested_urls[location.href] = 1;
        document.apwpagenumber = 1;
        if (!status.remaining_height) update_remaining_height();

        add_css(options.APW_CSS, 'main');
        add_css(status.css_patch, 'user');

        window.addEventListener('scroll', on_scroll, false);
        window.addEventListener('resize', on_scroll, false);
        document.addEventListener('AutoPatchWork.request', request, false);
        document.addEventListener('AutoPatchWork.load', load, false);
        document.addEventListener('AutoPatchWork.append', append, false);
        document.addEventListener('AutoPatchWork.error', error, false);
        document.addEventListener('AutoPatchWork.reset', reset, false);
        document.addEventListener('AutoPatchWork.state', state, false);
        document.addEventListener('AutoPatchWork.terminated', terminated, false);
        document.addEventListener('AutoPatchWork.toggle', toggle, false);
        document.addEventListener('AutoPatchWork.pageloaded', pageloaded, false);

        if (options.BAR_STATUS) {
            var bar = document.createElement('div');
            var lang = window.navigator.language.substr(0,2);
            if (lang !== 'en') {
                bar.setAttribute('lang', lang);
                bar.setAttribute('xml:lang', lang);
            }
            bar.id = 'autopatchwork_bar';
            bar.className = 'autopager_off';
            bar.style.display = 'none';

            var new_img_url = function(src) {
                var hash = (src.match(/#.+/gi) || ['#'])[0].slice(1); // if there is hash, save it
                src = src.replace(/#.+/gi,'');
                if (~src.indexOf('?') && !~src.indexOf('&')) { //have 1 parameter
                    src = src.replace(/\?\d+$/g, '');
                    if (~src.indexOf('?')) return src + '&' + Date.now() + hash;
                    else return src + '?' + Date.now();
                } else if (~src.indexOf('?')) { //have >1 parameter
                    return src.replace(/&\d+$/g, '') + '&' + Date.now() + hash;
                } else { //have 0 parameters
                    return src + '?' + Date.now() + hash;
                }
            };

            var is_image_ok = function(img) {
                if (img.src && img.src.indexOf('data:') === 0) return true;
                if (!img.complete)
                    return false;
                if (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0)
                    return false;
                return true;
            };

            var refresh_incomplete_imgs = function(event){
                var images = document.querySelectorAll('img[src]:not(#autopatchwork_loader)');
                for (var i = 0; i < images.length; i++) {
                    if (!is_image_ok(images[i]) || event.shiftKey) {
                        images[i].src = new_img_url(images[i].src);
                    }
                }
            };

            // Font-Awesome Icons: https://github.com/encharm/Font-Awesome-SVG-PNG (License: SIL OFL 1.1 -> MIT)
            bar.onmouseover = function () {
                var onoff = document.createElement('button');
                onoff.id = 'bar_onoff';
                //onoff.textContent = 'TGL';
                onoff.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M1664 896q0 156-61 298t-164 245-245 164-298 61-298-61-245-164-164-245-61-298q0-182 80.5-343t226.5-270q43-32 95.5-25t83.5 50q32 42 24.5 94.5t-49.5 84.5q-98 74-151.5 181t-53.5 228q0 104 40.5 198.5t109.5 163.5 163.5 109.5 198.5 40.5 198.5-40.5 163.5-109.5 109.5-163.5 40.5-198.5q0-121-53.5-228t-151.5-181q-42-32-49.5-84.5t24.5-94.5q31-43 84-50t95 25q146 109 226.5 270t80.5 343zm-640-768v640q0 52-38 90t-90 38-90-38-38-90v-640q0-52 38-90t90-38 90 38 38 90z" fill="#fff"/></svg>';
                //onoff.title = 'Toggle';
                onoff.onclick = _toggle;

                var option = document.createElement('button');
                option.id = 'bar_option';
                //option.textContent = 'OPT';
                option.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z" fill="#fff"/></svg>';
                //option.title = 'Options';
                option.onclick = function () {
                    sendRequest({ options: true });
                };

                var reverse = document.createElement('button');
                reverse.id = 'bar_reverse';
                //reverse.textContent = 'REV';
                reverse.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M1683 141q19-19 32-13t13 32v1472q0 26-13 32t-32-13l-710-710q-8-9-13-19v710q0 26-13 32t-32-13l-710-710q-19-19-19-45t19-45l710-710q19-19 32-13t13 32v710q5-11 13-19z" fill="#fff"/></svg>';
                //reverse.title = 'Reverse';
                reverse.onclick = swap_directions;

                var retry = document.createElement('button');
                retry.id = 'bar_retry';
                //retry.textContent = 'RTR';
                retry.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M1639 1056q0 5-1 7-64 268-268 434.5t-478 166.5q-146 0-282.5-55t-243.5-157l-129 129q-19 19-45 19t-45-19-19-45v-448q0-26 19-45t45-19h448q26 0 45 19t19 45-19 45l-137 137q71 66 161 102t187 36q134 0 250-65t186-179q11-17 53-117 8-23 30-23h192q13 0 22.5 9.5t9.5 22.5zm25-800v448q0 26-19 45t-45 19h-448q-26 0-45-19t-19-45 19-45l138-138q-148-137-349-137-134 0-250 65t-186 179q-11 17-53 117-8 23-30 23h-199q-13 0-22.5-9.5t-9.5-22.5v-7q65-268 270-434.5t480-166.5q146 0 284 55.5t245 156.5l130-129q19-19 45-19t45 19 19 45z" fill="#fff"/></svg>';
                //retry.title = 'Retry';
                retry.onclick = clear_error;

                var img_refresh = document.createElement('button');
                img_refresh.id = 'bar_img_refresh';
                //img_refresh.textContent = 'REF';
                img_refresh.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M576 576q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1024 384v448h-1408v-192l320-320 160 160 512-512zm96-704h-1600q-13 0-22.5 9.5t-9.5 22.5v1216q0 13 9.5 22.5t22.5 9.5h1600q13 0 22.5-9.5t9.5-22.5v-1216q0-13-9.5-22.5t-22.5-9.5zm160 32v1216q0 66-47 113t-113 47h-1600q-66 0-113-47t-47-113v-1216q0-66 47-113t113-47h1600q66 0 113 47t47 113z" fill="#fff"/></svg>';
                //img_refresh.title = 'Reload images';
                img_refresh.onclick = refresh_incomplete_imgs;

                var manager = document.createElement('button');
                manager.id = 'bar_manager';
                //manager.textContent = 'SIE';
                manager.innerHTML = '<svg viewBox="0 0 1792 1792"><path d="M1664 1344v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45z" fill="#fff"/></svg>';
                //manager.title = 'SI Editor';
                manager.onclick = function () {
                    sendRequest({ manage: true, hash: location.hostname.replace(/ww[w\d]+\./i,'')});
                };

                bar.appendChild(onoff);
                bar.appendChild(img_refresh);
                bar.appendChild(reverse);
                bar.appendChild(retry);
                bar.appendChild(option);
                bar.appendChild(manager);
                bar.onmouseover = null;
            };

            /* Toggles status bar ready state. */
            var _toggle = function(event) {
                if (!event.shiftKey) sendRequest({ paused: (status.state ? 'on' : 'off'), id: status.id });
                dispatch_event('AutoPatchWork.toggle');
            };

            if (browser_type === BROWSER_OPERA) { // :before + background-image: url(animated SVG) in CSS for other browsers
                var img = document.createElement('img');
                img.id = 'autopatchwork_loader';
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 32" fill="lightgray"><circle transform="translate(10 0)" cx="0" cy="16" r="0"><animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle><circle transform="translate(30 0)" cx="0" cy="16" r="0"><animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.3" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle><circle transform="translate(50 0)" cx="0" cy="16" r="0"> <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.6" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle></svg>';
                bar.appendChild(img);
            }

            document.body.appendChild(bar);
            bar.addEventListener('click', function (e) {
                if (e.target === bar) this._toggle();
            }, false);

            status.bar = bar;
        }

        window.AutoPatchWorked.init = AutoPatchWork;
        window.AutoPatchWorked.siteinfo = siteinfo;
        window.AutoPatchWorked.get_next_link = get_next_link;
        window.AutoPatchWorked.get_main_content = get_main_content;
        window.AutoPatchWorked.status = status;
        window.AutoPatchWorked.already = true;

        // We are ready to send AutoPatchWork.initialized (and to bgProcess too).
        dispatch_event('AutoPatchWork.initialized', status);
        sendRequest({ message: 'AutoPatchWork.initialized', siteinfo: siteinfo });

        if (typeof siteinfo.paused === 'undefined' && options.DEFAULT_STATE) state_on();
        if (typeof siteinfo.paused !== 'undefined' && !siteinfo.paused) state_on();
        if (typeof siteinfo.reversed !== 'undefined' && siteinfo.reversed) swap_directions();

        if (status.bar) status.bar.removeAttribute('style');

        remove_nodes();

        verify_scroll();

        return true;

        /*============================== end of main entry point ==============================*/

        /**
         * Reinitialize APW handler: removes listeners and restarts class
         * @param {Event} event Event data.
         * */
        function reset(event) {
            log('reset requested');

            cleanup();
            remove_css('user');

            window.removeEventListener('scroll', on_scroll, false);
            window.removeEventListener('resize', on_scroll, false);
            document.removeEventListener('AutoPatchWork.request', request, false);
            document.removeEventListener('AutoPatchWork.load', load, false);
            document.removeEventListener('AutoPatchWork.append', append, false);
            document.removeEventListener('AutoPatchWork.error', error, false);
            document.removeEventListener('AutoPatchWork.reset', reset, false);
            document.removeEventListener('AutoPatchWork.state', state, false);
            document.removeEventListener('AutoPatchWork.terminated', terminated, false);
            document.removeEventListener('AutoPatchWork.toggle', toggle, false);
            document.removeEventListener('AutoPatchWork.pageloaded', pageloaded, false);

            delete window.AutoPatchWorked.init;
            delete window.AutoPatchWorked.siteinfo;
            delete window.AutoPatchWorked.get_next_link;
            delete window.AutoPatchWorked.get_main_content;
            delete window.AutoPatchWorked.status;
            delete window.AutoPatchWorked.already;
            delete document.apwpagenumber;

            status.state = false;
            status.loading = false;
            status.page_number = 1;
            status.ajax.load_count = 0;
            status.remaining_height = null;
            status.last_element = null;
            status.content_last = null;
            status.content_parent = null;

            new AutoPatchWork(event.detail.siteinfo || {
                nextLink: (status.next_link || status.next_link_selector || status.next_link_mask),
                prevLink: (status.prev_link || status.prev_link_selector || status.prev_link_mask),
                pageElement: (status.page_elem || status.page_elem_selector),
                buttonElement: (status.button_elem || status.button_elem_selector),
                removeElement: status.remove_elem,
                forceIframe: (status.use_iframe_req || null),
                disableSeparator: status.separator_disabled,
                allowScripts: status.scripts_allowed,
                jsPatch: status.js_patch,
                cssPatch: status.css_patch,
                SERVICE: status.service,
                'wedata.net.id': (status.id || -1)
            });
        }

        /**
         * Changes autopager state according to the event.
         * @param {Event} event Event data.
         * */
        function state(event) {
            if (event.detail){
                if (s2b(event.detail.state)) state_on();
                else state_off();
            }
        }

        /**
         * Toggles autopager state. */
        function toggle() {
            if (status.state) {
                state_off();
            } else {
                state_on();
                verify_scroll();
            }
        }

        /**
         * Cleanup after stopping;
         *  */
        function cleanup() {
            //remove_css('main'); /* Not removing 'user' CSS as it can affect separators and paginated pages styling.
                                  /* Commented out because this causes visual twitch in Opera 12 on remove.*/

            if (status.change_address) {
                var title = page_titles.pop(),
                    url = downloaded_pages.pop();

                if (title && title !== '') document.title = title;
                if (url && url !== '') change_address(url);

                downloaded_pages = [];
                page_titles = [];

                for (var i = 0, elems = document.querySelectorAll('[data-apw-offview]'), l = elems.length; i < l; i++)
                    elems[i].removeAttribute('data-apw-offview');
            }

            if (status.bar && status.bar.parentNode)  bar.parentNode.removeChild(status.bar);
            status.bar = null;
        }

        /**
         * Termination event handler.
         * Stops all event processing, removes statusbar.
         * @param {Event} event Event data.
         * */
        function terminated(event) {

            status.state = false;
            status.loading = false;

            window.removeEventListener('scroll', on_scroll, false);
            window.removeEventListener('resize', on_scroll, false);
            document.removeEventListener('AutoPatchWork.request', request, false);
            document.removeEventListener('AutoPatchWork.load', load, false);
            document.removeEventListener('AutoPatchWork.append', append, false);
            document.removeEventListener('AutoPatchWork.error', error, false);
            document.removeEventListener('AutoPatchWork.reset', reset, false);
            document.removeEventListener('AutoPatchWork.state', state, false);
            document.removeEventListener('AutoPatchWork.terminated', terminated, false);
            document.removeEventListener('AutoPatchWork.toggle', toggle, false);
            document.removeEventListener('AutoPatchWork.pageloaded', pageloaded, false);

            if (status.bar) status.bar.className = 'autopager_terminated';

            ///////////////////
            dispatch_notification({
                extension: 'autopatchwork',
                text: (event.detail && event.detail.message) ? event.detail.message : '',
                type: (event.detail && event.detail.type) ? event.detail.type : 'terminated'
            });
            ///////////////////
            if (event.detail && event.detail.message) log(event.detail.message);
            setTimeout(cleanup, 5000);

        }


        /**
         * Swap paging directions.
         * @summary Changes direction of pagination until browser restart.
         * */
        function swap_directions(){
            if (!(status.prev_link && status.next_link )|| !(status.prev_link_selector && status.next_link_selector))
                return;
            var p = status.prev_link, ps = status.prev_link_selector;
            status.reversed = !status.reversed;
            status.prev_link = status.next_link;
            status.next_link = p;
            status.prev_link_selector = status.next_link_selector;
            status.next_link_selector = ps;
            sendRequest({ reversed: (status.reversed ? 'on' : 'off'), id: status.id });
        }

        /**
         * Clear error state.
         * @summary Clears timeout to termination event if no user action performed.
         * */
        function clear_error(){
            if (!error_timeout) return;
            clearTimeout(error_timeout);
            error_timeout = null;
            requested_urls[status.ajax.last_url]--;
            state_loading();
            dispatch_event('AutoPatchWork.request', {link: next});
        }

        /**
         * Recoverable error event handler.
         * @summary Sets timeout to termination event if no user action performed.
         * @param {Event} event Event data.
         * */
        function error(event) {
            if (status.bar) status.bar.className = 'autopager_error';
            error_timeout = setTimeout(function(){
                terminated({'detail': { message: ((event.detail && event.detail.message) ? event.detail.message : ''), type: 'error' }});
            }, 10000);
        }

        /**
         * Gets height of the current viewport.
         * @return {Number} Height of viewport
         * */
        function get_viewport_height() {
            return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        }

        /**
         * Reduces scroll processing requests count.
         * */
        var processed = false, timer = 0;
        function on_scroll() {
            if(!processed) {
                timer = setInterval(function() {
                    if (!processed) return;
                    processed = false;
                    clearTimeout(timer);
                    verify_scroll();
                }, 300);
            }
            processed = true;
        }

        function update_url_and_title(){
            if (!downloaded_pages.length) return;

            var title = page_titles.shift(),
                url = downloaded_pages.shift();

            if (title && title !== '') document.title = title;
            if (url && url !== '') change_address(url);
        }

        /**
         * @summary Checks if document is scrolled enough to begin loading next page
         * and dispatches request for a new page.
         * */
        function verify_scroll() {
            var viewporth, scrolltop, top, height, elems, elem;

            if (status.change_address && !status.button_elem && !status.button_elem_selector) {
                viewporth = get_viewport_height()/2;
                scrolltop = (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
                elems = document.querySelectorAll('[data-apw-offview]');

                if (elems && elems.length) {
                    for (var i = 0; i < elems.length; i++) {
                        elem = elems[i];
                        top = elem.offsetTop;
                        height = elem.clientHeight;

                        if (scrolltop + viewporth > top/* && scrolltop < top + height*/) {
                            elem.removeAttribute('data-apw-offview');
                            update_url_and_title();
                        }
                    }
                }
            }

            if (status.loading || !status.state) return;

            if (status.button_elem || status.button_elem_selector) {
                try {
                    if (status.button_elem) elem = get_node_xpath(document, status.button_elem);
                    else elem = get_node(document, status.button_elem_selector);
                } catch (bug) {
                    dispatch_event('AutoPatchWork.terminated', { message: 'can\'t find next page button' });
                }
                if (elem) { // && (status.busy_string ? !~elem.innerHTML.indexOf(status.busy_string) : true)) {
                    if ((rootNode.scrollHeight - window.innerHeight - window.scrollY) < status.remaining_height) {
                        status.loading = true;
                        elem.click();
                        // should timeout be a variable depending on page loading speed or as SITEINFO field?
                        setTimeout( function() { status.loading = false; dispatch_event('AutoPatchWork.pageloaded'); }, 2000 ); //parseInt((status.busy_time || 2000), 10);
                    }
                } else {
                    dispatch_event('AutoPatchWork.terminated', { message: 'can\'t find next page button' });
                }
                return;
            }

            if ((rootNode.scrollHeight - window.innerHeight - window.scrollY) < status.remaining_height) {
                state_loading();
                dispatch_event('AutoPatchWork.request', {link: next});
            }
        }

        /* Sets statusbar to loading state. */
        function state_loading() {
            status.loading = true;
            if (status.bar) status.bar.className = 'autopager_loading';
        }

        /* Sets statusbar to loaded state. */
        function state_loaded() {
            status.loading = false;
            if (status.bar) status.bar.className = status.state ? 'autopager_on' : 'autopager_off';
        }

        /* Sets statusbar to ready state. */
        function state_on() {
            status.state = true;
            if (status.loading) return;
            if (status.bar) status.bar.className = 'autopager_on';
        }

        /* Sets statusbar to disabled state. */
        function state_off() {
            status.state = false;
            if (status.loading) return;
            if (status.bar) status.bar.className = 'autopager_off';
        }


        /**
         * Event handler for browser location rewriting on each new page.
         * @param {string} to_url New url to set.
         * */
        function change_address(to_url) {
            history.pushState('', '', location.href);
            history.replaceState('', '', to_url);
        }

        /**
         * Returns max document scrollheight.
         * */
        /*function document_height() {
            return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        }*/

        /**
         * Returns new retry delay in milliseconds.
         * @param {Number} attempt Attempt number.
         * */
        function get_retry_delay(attempt) {
            return (Math.pow(status.ajax.retry_base, attempt) - status.ajax.zero_shift) * 1000;
        }

        /**
         * Requests next page via XMLHttpRequest method.
         * @param {Event} event Event object.
         * */
        function request_xhr(event) {
            status.loading = true;
             // in (service === true) we just use request event as corresponding scroll trigger for an external script
            if (status.service) return;

            var url = state.nextURL = get_href(event.detail && event.detail.link ? event.detail.link : next);
            //log('requesting ' + url);
            // in norequest == true mode we just return empty html on each reuest, external script should fill that
            if (event.detail && event.detail.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: create_html('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>', url),
                    url: url || null
                });
            }

            if (!url || url === '') {
                return dispatch_event('AutoPatchWork.terminated', { message: 'empty link requested'  });
            }

            // if we ever do retries should do it inside the request function
            // otherwise can be sure that requested = loaded (or failed)
            if (!requested_urls[url]) {
                requested_urls[url] = 1;
            } else if (requested_urls[url] < status.ajax.retry_max) {
                requested_urls[url]++;
            } else {
                return dispatch_event('AutoPatchWork.terminated', { message: 'next page ' + url + ' already requested' });
            }

            var req = 'GET',
                x = new XMLHttpRequest();
            x.onload = function () {
                if (dump_request) console.log(x.responseText);
                if (options.IGNORE_CORS || !x.getResponseHeader('Access-Control-Allow-Origin'))
                    dispatch_event('AutoPatchWork.load', {
                        htmlDoc: create_html(x.responseText, url),
                        url: url
                    });
                else dispatch_event('AutoPatchWork.terminated', { message: 'request failed on ' + url + ' because of CORS access'});
            };
            x.onerror = function () {
                if (requested_urls[url] >= status.ajax.retry_max || (x && x.status < 500)) {
                    return dispatch_event('AutoPatchWork.terminated', { message: 'request failed on ' + url + ' (' + x.statusText + ')' });
                } else if (requested_urls[url] < status.ajax.retry_max) {
                    return setTimeout(function () { request({detail:{link: url}}); }, get_retry_delay(requested_urls[url]));
                }
                dispatch_event('AutoPatchWork.error', { message: 'request failed on ' + url + ' (' + x.statusText + ')' });
            };
            //if (req === 'POST') {
            //    x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            //    x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            //}
            status.ajax.start_time = Date.now();
            status.ajax.last_url = url;
            x.open(req, url, true);
            x.overrideMimeType('text/html; charset=' + document.characterSet);
            try {
                x.send();
            } catch (bug) {
                dispatch_event('AutoPatchWork.error', { message: 'network access error on ' + url});
            }
        }

        /**
         * Requests next page via IFRAME-load method.
         * @param {Event} event Event object.
         * */
        function request_iframe(event) {
            status.loading = true;
            if (status.service) return;

            var url = state.nextURL = get_href(event.detail && event.detail.link ? event.detail.link : next);

            if (event.detail && event.detail.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: create_html('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>', url),
                    url: url || null
                });
            }

            //log('requesting ' + url);
            if (!url || url === '') {
                return dispatch_event('AutoPatchWork.terminated', { message: 'empty link requested' });
            }

            if (!requested_urls[url]) {
                requested_urls[url] = 1;
            } else { // No retries in this mode for now
                return dispatch_event('AutoPatchWork.terminated', { message: 'next page already requested' });
            }

            var iframe = document.createElement('iframe');
            iframe.setAttribute('style', 'display: none !important;'); //failsafe
            iframe.id = iframe.name = 'autopatchwork-request-iframe';
            iframe.sandbox = 'allow-same-origin';
            /* Removes intermediate IFRAME from the current page. */
            function remove_iframe() {
                var i = document.getElementById('autopatchwork-request-iframe');
                if (i && i.parentNode) i.parentNode.removeChild(i);
            }
            iframe.onerror = function () {
                dispatch_event('AutoPatchWork.error', { message: 'IFRAME request failed' });
                remove_iframe();
            };
            iframe.onload = function () {
                var doc = iframe.contentDocument;
                if (!doc) return iframe.onerror();
                if (dump_request) console.log(doc.innerHTML);
                dispatch_event('AutoPatchWork.load', { htmlDoc: doc, url: url });
                remove_iframe();
            };
            status.ajax.start_time = Date.now();
            status.ajax.last_url = url;
            iframe.src = url;
            document.body.appendChild(iframe);
        }

        /**
         * Returns link node reference.
         * @param {Element} node The input node.
         * */
        function get_href(node) {
            if (!node) return null;
            if (typeof node === 'string') return node;
            if (typeof node.getAttribute === 'function') {
                if (node.getAttribute('href')) return node.getAttribute('href');
                else if (node.getAttribute('action')) return node.getAttribute('action');
                else if (node.getAttribute('value')) return node.getAttribute('value');
            }
            return node.href || node.action || node.value || null;
        }


        /**
         * Evaluates expression to find node containing next page link.
         * @param {Element} doc Node to perform search on.
         * @return {Element} Matched node.
         * */
        function get_next_link(doc) {
            if (!doc || (!status.next_link && !status.next_link_selector && !status.next_link_mask)) return null;
            if (status.next_link) {
                return doc.evaluate(status.next_link, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } else if (status.next_link_mask) {
                // format link-up-to-page-number|step[|link-after-page-number]
                var arr = status.next_link_mask.split('|');
                return {href: arr[0] + ((status.page_number + 1) * parseInt(arr[1], 10)) + (arr[2] || '')};
            } else {
                return doc.querySelector(status.next_link_selector);
            }
            return null;
        }

        /**
         * Evaluates expression to find nodes containing main page content.
         * @param {Element} doc Node to perform search on.
         * @return {NodeList} Matched nodes.
         * */
        function get_main_content(doc) {
            if (!doc || (!status.page_elem && !status.page_elem_selector)) return null;
            var i, r, l, res;
            if (status.page_elem) {
                r = doc.evaluate(status.page_elem, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                l = r.snapshotLength;
                res = (l && new Array(l)) || [];
                for (i = 0; i < l; i++) res[i] = r.snapshotItem(i);
            } else {
                r = doc.querySelectorAll(status.page_elem_selector);
                l = r.length;
                res = (l && new Array(l)) || [];
                for (i = 0; i < l; i++) res[i] = r[i];
            }
            return element_filter(res);
        }

        /**
         * Keeps only following elements on the same level.
         * @param {NodeList} nodes The nodelist to filter.
         * @return {NodeList} Filtered list.
         * */
        function element_filter(nodes) {
            if (!nodes || !nodes.length) return null;
            var first = nodes[0];
            return nodes.filter(function (node) {
                if (first === node || first.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING) return true;
                else return false;
            });
        }

        /* Calculates height delta between the bottom of content block and the page end. */
        function calc_remaining_height() {
            var rect = null, bottom = null, _point = status.content_last;
            while (_point) {
                if (typeof _point.getBoundingClientRect === 'function') {
                    rect = _point.getBoundingClientRect();
                    if (rect && !(rect.top === 0 && rect.right === 0 && rect.bottom === 0 && rect.left === 0)) break;
                    else rect = null;
                }
                if (_point.nextSibling) _point = _point.nextSibling;
                else break;
            }
            if (rect) {
                bottom = rect.top + window.scrollY;
            } else if (status.last_element && typeof status.last_element.getBoundingClientRect === 'function') {
                rect = status.last_element.getBoundingClientRect();
                if (rect) bottom = rect.top + rect.height + window.scrollY;
            } else if (status.content_parent && typeof status.content_parent.getBoundingClientRect === 'function') {
                rect = status.content_parent.getBoundingClientRect();
                if (rect) bottom = rect.top + rect.height + window.scrollY;
            }
            if (!bottom) bottom = Math.round(rootNode.scrollHeight * 0.8);
            return rootNode.scrollHeight - bottom + options.BASE_REMAINING_HEIGHT;
        }

        /* Updates height delta between the bottom of content block and the page end. */
        function update_remaining_height() {
            status.remaining_height = calc_remaining_height();
        }

        /**
         * Runs script in current context.
         * @param {string} text Text to run script from.
         * */
        function run_script(text) {
            if (typeof text !== 'string' || text.length < 2) return;
            text = 'if (!AutoPatchWorked.js_patched) { AutoPatchWorked.js_patched = true; ' + text + '}';
            try {
                var script = document.createElement('script');
                script.textContent = text;
                (document.head || document.documentElement).appendChild(script);
                if (script.remove)
                    script.remove();
                else {
                    if (script.parentNode) script.parentNode.removeChild(script);
                    else script.text = '';
                }
                if (!AutoPatchWorked.js_patched) window.eval(text); // Opera 36+
            } catch (bug) {
                log(bug.message);
            }
        }

        /**
         * Evaluates included scripts.
         * @param {Element} node HTMLElement to run scripts of.
         * */
        function run_node_scripts(node) {
            if (!node || typeof node.nodeType !== 'number' || node.nodeType !== 1) return;
            for (var i = 0, st = node.querySelectorAll('script'), len = st.length; i < len; i++) {
                run_script(st[i].text);
            }
        }

        /**
         * Gets base of any URL.
         * @param {string} url Location.
         * */
        function get_base_url(url) {
            if (typeof url !== 'string' || !url.length)
                url = location.href;
            var link = document.createElement('a');
            link.href = url;
            var path_arr = link.pathname.split('/'),
                last = path_arr.pop();
            if (~last.indexOf('.') || (link.search.length && last !== ''))
                return link.protocol + '//' + link.host + path_arr.join('/') + '/';
            else
                return link.protocol + '//' + link.host + (link.pathname + '/').replace(/\/+$/,'/');
        }


        /**
         * Checks if URL is relative and fixes it.
         * @param {string} url Location.
         * */
        function rel_to_abs(url){
            var start = url.charAt(0);
            if(/^\w+:\/\//.test(url) || start === '#')
                return url;
            else if(url.substring(0,2) === '//') // protocol relative urls
                return location.protocol + url;
            else if(start === '/') // domain relative urls
                return (location.protocol + '//' + location.host + url).replace(/([^:])\/+/g,'$1/');
            else if(start === '?') // parameters
                return location.protocol + '//' + location.host + location.pathname + url;
            else if(/^\s*$/.test(url))
                return '';
            else
                url = '/' + url;

            url = base_url + url;

            url = url.replace(/\/\.\/+/g,'/'); // ignore current dirs
            url = url.replace(/([^:])\/+/g,'$1/'); // remove excessive slashes

            var backup = url,
                domain = (base_url.match(/https?:\/\/[^/]+/i) || [])[0] || (location.protocol + '//' + location.host);
            while(/\/\.\.\//.test(url = url.replace(/[^\/]+\/+\.\.\//g,''))); // resolve paths
            if (url.indexOf(domain) !== 0) url = backup; // if unresolved leave it up to server

            return url;
        }

        // - Replace lazyloading src's to normal. Although better solution would be using per-site js patches.
        // - Make links to images absolute.
        function parse_images(node) {
            if (!node || typeof node.nodeType !== 'number' || node.nodeType !== 1) return; // 1 -> Node.ELEMENT_NODE
            for (var i = 0, img = (node.tagName && node.tagName.toLowerCase() === 'img')?[node]:node.getElementsByTagName('img'), len = img.length; i < len; i++) {
                if (options.TRY_CORRECT_LAZY) {
                    for (var j = 0, atts = img[i].attributes, n = atts.length, match = null; j < n; j++) {
                       if (~atts[j].localName.toLowerCase().indexOf('data-')) {
                           match = atts[j].textContent.toLowerCase().match(/\.(?:jpe?g|a?png|gif|svg|webp)/g);
                           if (match && match.length === 1) { // in case of image list variable we ignore it
                               img[i].setAttribute('src', atts[j].textContent);
                               break;
                           }
                       }
                    }
                }

                if (!options.FORCE_ABSOLUTE_IMG_SRCS) continue;
                var src = img[i].getAttribute('src');
                if (src)
                    img[i].setAttribute('src', rel_to_abs(src));
            }
        }

        // - Make target attribute as specified.
        // - Fix relative link URL to absolute.
        function parse_links(node, target) {
            // we are ignoring links inside links, i.e a>a
            if (!node || typeof node.nodeType !== 'number' || node.nodeType !== 1) return; // 1 -> Node.ELEMENT_NODE
            for (var lnki = 0, lnks = (node.tagName && node.tagName.toLowerCase() === 'a')?[node]:node.getElementsByTagName('a'), lnlen = lnks.length; lnki < lnlen; lnki++) {
                var href = lnks[lnki].getAttribute('href');
                if (typeof target !== 'undefined')
                    if (href && !/^(?:javascript|mailto|data|skype)\s*:\s*/.test(href) && !/^#/.test(href) && !lnks[lnki].target)
                        lnks[lnki].setAttribute('target', options.TARGET_WINDOW_NAME);

                if (options.FORCE_ABSOLUTE_HREFS && href && href.length)
                    lnks[lnki].setAttribute('href', rel_to_abs(href));
            }
        }

        /**
         * Filters undesired elements from a DOM tree using either XPath or CSS selectors.
         * @param {documentElement} doc Base DOM element to remove nodes from.
         * */
        function remove_nodes(doc) {
            if (typeof doc === 'undefined') doc = document;
            // filter undesired elements
            if (!status.remove_elem && !status.remove_elem_selector) return;
            var i, r, l;
            if (status.remove_elem) {
                r = doc.evaluate(status.remove_elem, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                l = r.snapshotLength;
                for (i = 0; i < l; i++)
                    if (r.snapshotItem(i).parentNode)
                        r.snapshotItem(i).parentNode.removeChild(r.snapshotItem(i));
            } else {
                r = doc.querySelectorAll(status.remove_elem_selector);
                l = r.length;
                for (i = 0; i < l; i++)
                    if (r[i].parentNode)
                        r[i].parentNode.removeChild(r[i]);
            }
        }

        /**
         * Event hadler for parsing new page data.
         * @param {Event} event Event data.
         * */
        function load(event) {
            if (!event.detail || !event.detail.htmlDoc)
                return dispatch_event('AutoPatchWork.error', { message: 'no response from server' });

            var loaded_url = null;
            if (typeof event.detail.url === 'string' && event.detail.url.length) {
                loaded_url = event.detail.url;
                base_url = get_base_url(loaded_url);
            }

            if (!status.service) {
                next = get_next_link(event.detail.htmlDoc);
                parse_links(next);
                remove_nodes(event.detail.htmlDoc);
                if (!status.scripts_allowed) { // filter scripts
                   for (var i = 0, st = event.detail.htmlDoc.querySelectorAll('script'), len = st.length; i < len; i++)
                       if (st[i].parentNode)
                           st[i].parentNode.removeChild(st[i]);
                }
            }

            var nodes = get_main_content(event.detail.htmlDoc);
            if (!nodes || !nodes.length) {
                if (requested_urls[loaded_url] < status.ajax.retry_max) {
                    next = null;
                    var url = loaded_url.replace(/[?&]retry=\d+/, '');
                    url = url + (~url.indexOf('?') ? '&' : '?') + 'retry=' + Date.now();
                    return dispatch_event('AutoPatchWork.request', {link: url});
                } else {
                    return dispatch_event('AutoPatchWork.error', { message: 'page content ' + (status.page_elem || status.page_elem_selector)  + ' not found' });
                }
            }

            var title_node = event.detail.htmlDoc.querySelector('title'),
                title =  title_node ? title_node.textContent.trim() : '';

            status.page_number++;
            document.apwpagenumber++;
            delete event.detail.htmlDoc;

            dispatch_event('AutoPatchWork.append', { nodes: nodes, title: title, url: loaded_url });
        }

        /* Calculates delay before next page loading. */
        function get_load_delay() {
            var current_delay =  options.BASE_INTERPAGE_DELAY + Math.abs(Date.now() - status.ajax.start_time),
                  smooth = status.ajax.load_count < 11 ? 1 - (1/ status.ajax.load_count) : -1.0;

            if (smooth >= 0 && Math.abs(current_delay - status.ajax.load_delay) < 2000 && current_delay < 4000) {
                status.ajax.load_delay = Math.ceil((current_delay * smooth + status.ajax.load_delay * (1.0 - smooth))/100)*100;
                //log('Next delay will be: ' + status.ajax.load_delay + '; real delay: ' + current_delay);
            }

            return status.ajax.load_delay;
        }

        /**
         * Event handler for appending new pages.
         * @param {Event} event Event data.
         * */
        function append(event) {
            if (!status.loading || !event.detail.nodes)
                return dispatch_event('AutoPatchWork.error', { message: 'page content is not specified' });

            var inserted_node,
                content_last = status.content_last,
                content_parent = status.content_parent,
                change_location = status.change_address;

            var nodes = event.detail.nodes || [],
                title = event.detail.title || '',
                loaded_url = event.detail.url || null;

            delete event.detail.nodes;
            delete event.detail.title;

            var onAfterChecked = function onAfterChecked() {
                var fragment = document.createDocumentFragment();

                if (!status.separator_disabled) {
                    // Checking where to add divider. In case of a table/list we'll add inside it, otherwise after.
                    var root, node;
                    if (/^tbody$/i.test(content_parent.localName)) {
                        var colNodes = document.evaluate('child::tr[1]/child::*[self::td or self::th]', content_parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        var columns = 0;
                        for (var col = 0, l = colNodes.snapshotLength; col < l; col++) {
                            columns += (parseInt(colNodes.snapshotItem(col).getAttribute('colspan'), 10) || 1);
                        }
                        node = document.createElement('td');
                        root = document.createElement('tr');
                        node.setAttribute('colspan', columns);
                        root.appendChild(node);
                    } else if (/^(?:ol|ul)$/i.test(content_parent.localName)) {
                        root = node = document.createElement('li');
                    } else {
                        root = node = document.createElement('div');
                    }

                    // Adding the page separator.
                    node.className = 'autopagerize_page_separator_blocks';
                    if (change_location) {
                        node.setAttribute('data-apw-offview', 'true');
                    }
                    //node.setAttribute('data-apw-page', document.apwpagenumber);
                    var h4 = node.appendChild(document.createElement('h4'));
                    h4.className = 'autopagerize_page_separator';
                    var span = h4.appendChild(document.createElement('span'));
                    span.className = 'autopagerize_page_info';
                    var a = span.appendChild(document.createElement('a'));
                    a.className = 'autopagerize_link';
                    /* jshint ignore:start */
                    a.href = loaded_url && (loaded_url.indexOf('http') === 0 || ~loaded_url.indexOf('/') || ~loaded_url.indexOf('.'))  ? loaded_url : 'javascript:void(0)';
                    /* jshint ignore:end */
                    a.setAttribute('number', document.apwpagenumber);
                    if (typeof title === 'string' && title.length) a.setAttribute('title', title);

                    fragment.appendChild(root);
                }

                if (!nodes.length) {
                    fragment = null;
                    return dispatch_event('AutoPatchWork.error', { message: 'page content ' + (status.page_elem || status.page_elem_selector)  + ' not found' });
                }

                var fix_links = options.FORCE_ABSOLUTE_HREFS || options.FORCE_TARGET_WINDOW,
                    fix_imgs = options.FORCE_ABSOLUTE_IMG_SRCS || options.TRY_CORRECT_LAZY,
                    force_target = options.FORCE_TARGET_WINDOW;

                for (var i = 0, len = nodes.length; i < len; i++) {
                    if (fix_links) parse_links(nodes[i], force_target);
                    if (fix_imgs) parse_images(nodes[i]);

                    inserted_node = fragment.appendChild(document.importNode(nodes[i], true));

                    if (status.scripts_allowed) run_node_scripts(inserted_node);
                    if (inserted_node && (typeof inserted_node.setAttribute === 'function')) {
                        // service data for external page processing
                        inserted_node['data-apw-url'] = loaded_url;
                        if (i === 0) {
                            inserted_node.setAttribute('data-apw-page', document.apwpagenumber);
                            if (change_location && status.separator_disabled)
                                inserted_node.setAttribute('data-apw-offview', 'true');
                        }
                    }
                }

                var last_prev = (content_last && content_last.previousSibling) ? content_last.previousSibling : content_parent.lastChild;

                content_parent.insertBefore(document.importNode(fragment, true), content_last);

                if (status.dom_modification_events)
                    for (var n = last_prev.nextElementSibling; n; n = n.nextElementSibling ) {
                        if (n === content_last) break;
                        dispatch_mutation_event({
                            targetNode: n,
                            eventName: 'AutoPatchWork.DOMNodeInserted',
                            bubbles: true,
                            cancelable: false,
                            relatedNode: content_parent,
                            prevValue: null,
                            newValue: loaded_url,
                            attrName: 'url',
                            attrChange: 2 // MutationEvent.ADDITION
                        });
                    }

                fragment = null;
                nodes = null;

                if (change_location && loaded_url && loaded_url.length) {
                    downloaded_pages.push(loaded_url);
                    page_titles.push(title);
                }

                title = null;
                status.ajax.load_count++;

                setTimeout(function(){ dispatch_event('AutoPatchWork.pageloaded'); }, get_load_delay());
            }

            // We can't check for repeating nodes in the same document because they can have some function
            // also can't check responseText (earlier) as there is a higher probability of non-paging content
            // changes like random ad id's
            if (options.CRC_CHECKING && nodes[0] && nodes[0].parentNode) {
                checksum(nodes[0].parentNode.innerHTML).then(function(content_hash){
                    if (!loaded_crcs[content_hash]) loaded_crcs[content_hash] = true;
                    else return dispatch_event('AutoPatchWork.terminated', { message: 'next page has same hash' });
                    onAfterChecked();
                });
            } else {
                onAfterChecked();
            }
        }

        /* Sets status bar to ready state and checks for scrolling. */
        function pageloaded() {
            state_loaded();
            verify_scroll();
        }
    }
})(window.XPathResult, window.XMLHttpRequest, window.Node, window.history, window.location, window.sessionStorage, window.Notification);
