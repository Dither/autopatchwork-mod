// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude chrome:*
// @exclude about:*
// @exclude widget:*
// @exclude *.js
// @exclude *.txt
// @exclude *.pdf
// @exclude *.apng
// @exclude *.gif
// @exclude *.swf
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// ==/UserScript==

// https://gist.github.com/762108
function FastCRC32() {
    this.table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];
    return this;
}

FastCRC32.prototype = {
    crc: function (string) {
        var crc = 0 ^ (-1);
        for(var i=0, l=string.length; i<l; i++) {
          crc = (crc >>> 8) ^ this.table[(crc ^ string.charCodeAt(i)) & 0xFF];
        }
        return crc ^ (-1);
    }
};

/* 
 * Normal AutoPatchWork event flow:
 *  AutoPatchWork.init (internal) - we are on some site, requestiong siteinfo for it.
 *  AutoPatchWork.ready - extension is configured and ready to work.
 *  AutoPatchWork.siteinfo - receive SITEINFOs for the current site.
 *  AutoPatchWork.initialized (internal) - initialized APW data.
 *  scroll (internal) - got some scrolling on the page.
 *  AutoPatchWork.request - sending request for the next page. 
 *  AutoPatchWork.load - got new page data and ready to process it.
 *  AutoPatchWork.append - appending page to the current.
 *  AutoPatchWork.DOMNodeInserted - firing Node changing event.
 *  AutoPatchWork.pageloaded - page loaded successfully.
 *  AutoPatchWork.error - page not loaded, error can be generated on every previous stage. 
 *  AutoPatchWork.terminated - page not loaded, stopping extension.
 *  AutoPatchWork.reset (internal) - resetting extension on changes within location.
 * 
 * Service events:
 *  resize - on window resize
 *  AutoPatchWork.state - set statusbar state.
 *  AutoPatchWork.toggle - toggle statusbar state.
*/

(function APW(self, XPathResult, XMLHttpRequest, Node, history, location, sessionStorage) {
    //"use strict";  enable strict mode within this function
    if (window.name === 'autopatchwork-request-iframe') return;
    var checksum = new FastCRC32;

    var browser, debug = false, dump_request = false,
        BROWSER_CHROME = 1,
        BROWSER_SAFARI = 2,
        BROWSER_OPERA = 3;
    var options = {
        BASE_REMAIN_HEIGHT: 1000,
        FORCE_TARGET_WINDOW: true,
        DEFAULT_STATE: true,
        TARGET_WINDOW_NAME: '_blank',
        CRC_CHECKING: false,
        INSERT_ACCELERATION: false,
        BAR_STATUS: true,
        CHANGE_ADDRESS: false,
        PAGES_TO_KEEP: 3,
        css: ''
    };
    var status = {
        state: true,
        loading: false,
        ajax_enabled: false,
        scripts_allowed: false,
        separator_disabled: false,
        use_iframe_req: false,
        change_address: false,
        page_number: 1,
        next_link: null,
        page_elem: null,
        remove_elem: null,
        button_elem: null,
        retry_count: 1,
        last_element: null,
        content_last: null,
        content_parent: null,
        bottom: null,
        remain_height: null,
        accelerate: false
    };

    /*if(~window.navigator.userAgent.indexOf('Chrome')) browser = BROWSER_CHROME;
    else if(~window.navigator.userAgent.indexOf('Apple')) browser = BROWSER_SAFARI;
    else */browser = BROWSER_OPERA;

    function APWException(message) {
        this.message = message;
        this.name = "[AutoPatchWork]";
    }
    /** 
     * Logging function.
     * @param {Array|String} arguments Data to put to debug output.
     * */
    function log() {
        if (!debug) return;
        if (browser === BROWSER_OPERA) {
            window.opera.postError('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        } else if (window.console) {
            console.log('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        }
    }
    /** 
     * Checks variable and explictly converts string to corresponding boolean.
     * Possible data values are: undefined, null, unknown text or number (treated as false here),
     *                           'on', 'off', '1', '0', 1, 0, 'true', 'false', true, false).
     * @param {Boolean|String|Number|undefined|null} s Data to check.
     * @return {Boolean} Boolean result.
     * */
    function s2b(s) { return ((typeof s !== 'undefined') && s && (s === true || s === 'true' || s === 'on' || s == 1)) ? true : false; }

    /** 
     * Dispatches standard event on the document.
     * @param {String} type Event name string.
     * @param {Array} opt Array of event's parameters.
     * */
    function dispatch_event(type, opt) {
        var ev = document.createEvent('Event');
        ev.initEvent(type, true, false);
        if (opt) {
        var ret = [];
            for(var x in opt) if(opt.hasOwnProperty(x)) ret.push(x);
            ret.forEach(function (k) {
                if (!ev[k]) ev[k] = opt[k];
            });
        }
        document.dispatchEvent(ev);
    }
    /** 
     * Dispatches modification event on the target node.
     * @param {Array} opt Array of event's parameters.
     * */
    function dispatch_mutation_event(opt) {
        var mue = document.createEvent('MutationEvent');
        mue.initMutationEvent(opt.eventName, opt.bubbles, opt.cancelable, opt.relatedNode, opt.prevValue, opt.newValue, opt.attrName, opt.attrChange);
        opt.targetNode.dispatchEvent(mue);
    }
    /**
     * Dispatches custom notification event on the document.
     * @param {Object} opt Object of event's message data.
     * */
    function dispatch_notify_event(opt) {
        var noe = document.createEvent('CustomEvent');
        noe.initCustomEvent('Notify.It', false, false, opt);
        document.dispatchEvent(noe);
    }

    // Cute AJAX loader gif.
    var imgAPWLoader = "data:image/gif;base64,R0lGODlhEAALAPQAAP///wAAANra2tDQ0Orq6gYGBgAAAC4uLoKCgmBgYLq6uiIiIkpKSoqKimRkZL6+viYmJgQEBE5OTubm5tjY2PT09Dg4ONzc3PLy8ra2tqCgoMrKyu7u7gAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7AAAAAAAAAAAA";

    if (browser === BROWSER_OPERA && !APW.loaded) {
        var args = arguments;
        document.addEventListener('DOMContentLoaded', function (e) {
            APW.loaded = true;
            APW.apply(window, args);
        }, false);
        return;
    }

    var sendRequest;
    switch (browser) {
        case BROWSER_CHROME:
            sendRequest = function (data, callback) {
                if (callback) chrome.extension.sendRequest(data, callback);
                else chrome.extension.sendRequest(data);
            };
            break;
        case BROWSER_SAFARI:
            sendRequest = (function () {
                var eventData = {};
                safari.self.addEventListener('message', function (evt) {
                    (evt.name in eventData) && eventData[evt.name](evt.message);
                }, false);
                return function (data, callback, name) {
                    name = (name || '') + (Date.now() + Math.random().toString(36));
                    callback && (eventData[name] = callback);
                    safari.self.tab.dispatchMessage(name, data);
                };
            })();
            break;
        case BROWSER_OPERA:
            sendRequest = (function (data, callback) {
                Object.keys || (Object.keys = function (k) {
                    var r = [];
                    for (var i in k) r.push(i);
                    return r;
                });
                var eventData = {};
                opera.extension.onmessage = function (evt) {
                    (evt.data.name in eventData) && eventData[evt.data.name](evt.data.data);
                };
                return function (data, callback, name) {
                    name = (name || '') + (Date.now() + Math.random().toString(36));
                    callback && (eventData[name] = callback);
                    opera.extension.postMessage({ name: name, data: data });
                };
            })();
            break;
        default:
            sendRequest = null;
            throw new APWException('Browser not detected!');
    } // switch(browser)

    var bar, img, matched_siteinfo,
        rootNode = /BackCompat/.test(document.compatMode) ? document.body : document.documentElement;
    document.apwpagenumber = 1;

    // Begin listening for init messages and request configuration if got one
    window.addEventListener('AutoPatchWork.init', init, false);
    // Begin listening and processing SITEINFO messages; send reset event if got one while active
    window.addEventListener('AutoPatchWork.siteinfo', siteinfo, false);

    /** 
     * APW configuration sync with the background process handler
     * */
    function init() {
        sendRequest({ url: location.href, isFrame: window.top !== window.self }, begin_init, 'AutoPatchWorkInit' );
    }

    dispatch_event('AutoPatchWork.init');

    window.addEventListener('hashchange', function (e) {
        if (window.AutoPatchWorked && AutoPatchWorked.siteinfo) {
            var status = AutoPatchWorked.status;
            if (status.button_elem) return;
            var first_element = (AutoPatchWorked.get_main_content(document) || [])[0];
            if (status.first_element !== first_element) {
                //forceIframe = true; // probably bugged method
                var ev = document.createEvent('Event');
                ev.initEvent('AutoPatchWork.reset', true, true);
                AutoPatchWorked.siteinfo.forceIframe = true;
                ev.siteinfo = AutoPatchWorked.siteinfo;
                document.dispatchEvent(ev);
            }
        } else if (matched_siteinfo) {
            matched_siteinfo.some(function (s) { return AutoPatchWork(s); });
        }
    }, false);

    /** 
     * APW initialisation, config reading and fail registration.
      * @param {Object} info Contains APW paramenters.
     * */
    function begin_init(info) {
        matched_siteinfo = info.siteinfo;
        if (info.config) {
            options.CRC_CHECKING =  info.config.check_crc;
            options.BASE_REMAIN_HEIGHT = info.config.remain_height;
            options.DEFAULT_STATE = info.config.auto_start;
            options.FORCE_TARGET_WINDOW = info.config.target_blank;
            options.CHANGE_ADDRESS = info.config.change_address;
            options.BAR_STATUS = info.config.bar_status;
            options.INSERT_ACCELERATION = info.config.enable_acceleration,
            options.css = info.css;
            debug = info.config.debug_mode;
        }
        if (!info.siteinfo || !info.siteinfo.length) return dispatch_event('AutoPatchWork.ready');
        var fails = [];
        var ready = info.siteinfo.some(function (s) {
            return AutoPatchWork(s) || (fails.push(s), false);
        });
        (ready === false) && sendRequest({ failed_siteinfo: fails });
        return dispatch_event('AutoPatchWork.ready');
    }
    /** 
     * Event handler for receiving SITEINFO.
     * @param {Event} evt Event data.
     * */
    function siteinfo(evt) {
        if (evt.siteinfo) {
            if (!window.AutoPatchWorked) {
                AutoPatchWork(evt.siteinfo);
            } else {
                var ev = document.createEvent('Event');
                ev.initEvent('AutoPatchWork.reset', true, true);
                for (var k in evt.siteinfo) {
                    ev[k] = evt.siteinfo[k];
                }
                document.dispatchEvent(ev);
            }
        }
    }
    /** 
     * AutoPatchWork main.
     * @param {Object} SITEINFO structure for the current site.
     * */
    function AutoPatchWork(siteinfo) {
        if (window.AutoPatchWorked) return true;

        var location_href = location.href,
            downloaded_pages = [],
            scroll = false;

        status.next_link = (siteinfo.nextLink || siteinfo.nextLinkSelector || siteinfo.nextMask || null);
        status.page_elem = (siteinfo.pageElement || siteinfo.pageElementSelector || null);
        status.button_elem = (siteinfo.buttonElement || siteinfo.buttonElementSelector || null);
        status.remove_elem = siteinfo.removeElement || null;
        status.separator_disabled = s2b(siteinfo.disableSeparator);
        //status.retry_count = (siteinfo.retryCount || 1);
        status.scripts_allowed = s2b(siteinfo.allowScripts);
        //status.ajax_enabled = s2b(siteinfo.useAjax);
        status.use_iframe_req = s2b(siteinfo.forceIframe);
        status.change_address = typeof siteinfo.forceAddressChange !== 'undefined' ? s2b(siteinfo.forceAddressChange) : options.CHANGE_ADDRESS;
        status.accelerate = typeof siteinfo.accelerate !== 'undefined' ? s2b(siteinfo.accelerate) : options.INSERT_ACCELERATION;

        if (status.next_link && status.next_link.substr(0,4) === 'http') {
            var arr = status.next_link.split('|'),
                matches = /\d{1,}/.exec(window.location.href.replace(arr[0],'').replace(arr[2],'')),
                pagen = parseInt(arr[1], 10);
            if (isNaN(pagen) || !matches) {
                status.page_number = 1;
            } else {
                status.page_number = parseInt(matches[0], 10) / pagen;
            }
        } else {
            status.page_number = 1;
        }

        if (!s2b(siteinfo.MICROFORMAT)) log('detected SITEINFO = ' + JSON.stringify(siteinfo, null, 4));

        var not_service = !s2b(siteinfo.SERVICE),
            next = get_next_link(document);

        if (status.button_elem) {
            try {
                if (!get_node(document, status.button_elem)) return;
            } catch (bug) { return; }
        }

        if (!get_href(next) && not_service && !status.button_elem) {
            if (s2b(siteinfo.MICROFORMAT)) return;
            return log('next link ' + status.next_link + ' not found.');
        }

        var page_elements = get_main_content(document);
        if ((!page_elements || !page_elements.length) && not_service && !status.button_elem) {
            if (s2b(siteinfo.MICROFORMAT)) return;
            return log('page content like ' + status.page_elem  + ' not found.');
        }

        if (history.replaceState && !/google/.test(location.host)) {
            var _createHTML = createHTML;
            createHTML = function createHTML_history() {
                var current = location.href;
                if (state.nextURL) history.replaceState('', '', state.nextURL);
                var doc = _createHTML.apply(this, arguments);
                if (state.nextURL) history.replaceState('', '', current);
                return doc;
            };
        }
        // Individual site fixes.
        // DON'T MODIFY! Use external scripts API to handle them instead.
        if (/^http:\/\/(www|images)\.google\.(?:[^.]+\.)?[^.\/]+\/images\?./.test(location.href)) {
            request = request_iframe;
            status.use_iframe_req = true;
        }
        else if ('www.tumblr.com' === location.host) {
            status.scripts_allowed = true;
        } 
        else if ('matome.naver.jp' === location.host) {
            /*var _get_next = get_next_link;
            get_next_link = function (doc) {
                var next = _get_next(doc);
                if (!next || !next.hasAttribute('onclick')) return;
                var nextpage = next.getAttribute('onclick').match(/goPage\(\s*(\d+)\s*\)/)[1];
                var form = document.getElementsByName('missionViewForm')[0];
                var param = [].slice.call(form).map(function (i) {
                    return i.name + '=' + (i.name === 'page' ? nextpage : i.value);
                }).join('&');
                next.href = location.pathname + '?' + param;
                return next;
            };
            next = get_next_link(document);*/
        }       
        else {
            if (typeof next !== 'undefined' && next)
                if ((next.host && next.host.length && next.host !== location.host) || 
                    (next.protocol && next.protocol.length && !~next.protocol.indexOf('javascript') &&
                     next.protocol !== location.protocol)
                ){
                    status.use_iframe_req = true;
                    log('next page has different adresss: using iframe requests');
                }
            if (status.use_iframe_req)
                request = request_iframe; 
        }

        if (!status.button_elem) {
            status.first_element = page_elements[0];
            status.last_element = page_elements.pop();
            //page_elements = null;
            var insert_before = siteinfo.insertBefore || null;
            if (insert_before) {
                try {
                    status.content_last = get_node(document, insert_before);
                    status.content_parent = status.content_last.parentNode;
                } catch (bug) {
                    status.content_last = status.last_element.nextSibling;
                    status.content_parent = status.last_element.parentNode;
                }
            } else {
                status.content_last = status.last_element.nextSibling; // btw, this will fail(?) if there are no elements aftr last... like </last></parent>
                status.content_parent = status.last_element.parentNode;
            }
        }

        var htmlDoc, loaded_url,
            requested_urls = {},
            loaded_crcs = {},
            location_pushed = false,
            session_object = {};

        requested_urls[location.href] = true;
        status.remain_height || (status.remain_height = calc_remain_height());

        window.addEventListener('scroll', check_scroll, false);
        window.addEventListener('resize', check_scroll, false);
        window.addEventListener('AutoPatchWork.request', request, false);
        window.addEventListener('AutoPatchWork.load', load, false);
        window.addEventListener('AutoPatchWork.append', append, false);
        window.addEventListener('AutoPatchWork.error', error_event, false);
        window.addEventListener('AutoPatchWork.reset', reset, false);
        window.addEventListener('AutoPatchWork.state', state, false);
        window.addEventListener('AutoPatchWork.terminated', terminated, false);
        window.addEventListener('AutoPatchWork.toggle', toggle, false);

        /* Removes intermediate IFRAME from the current page. */
        function pageloaded_iframe() {
            pageloaded();
            var i = document.getElementById('autopatchwork-request-iframe');
            if (i && i.parentNode) i.parentNode.removeChild(i);
        }
        /* Sets status bar to ready state. */
        function pageloaded() {
            // pause to do things before next page load and flood prevention
            setTimeout( function(){ status.loading = false; }, 500);

            var b = document.getElementById('autopatchwork_bar');
            if (b) b.className = status.state ? 'autopager_on' : 'autopager_off';

            /*///////////////////
            dispatch_notify_event({
                extension: 'autopatchwork',
                text: 'Page ' + document.apwpagenumber + ' loaded...',
                width: '200px'
            });
            ///////////////////*/
        }

        window.addEventListener('AutoPatchWork.pageloaded', status.use_iframe_req ? pageloaded_iframe : pageloaded, false);

        if (options.BAR_STATUS) {
            bar = document.createElement('div');
            bar.id = 'autopatchwork_bar';
            bar.className = 'autopager_on';
            bar.onmouseover = function () {
                var onoff = document.createElement('button');
                onoff.textContent = 'TGL';
                onoff.onclick = _toggle;
                var option = document.createElement('button');
                option.textContent = 'OPT';
                option.onclick = function () {
                    sendRequest({ options: true });
                };
                var manager = document.createElement('button');
                manager.textContent = 'SI';
                manager.onclick = function () {
                    sendRequest({ manage: true });
                };
                bar.appendChild(onoff);
                bar.appendChild(option);
                bar.appendChild(manager);
                bar.onmouseover = null;
            };
            /* Toggles status bar ready state. */
            var _toggle = function() {
                if (bar.className === 'autopager_on') {
                    bar.className = 'autopager_off';
                    state_off();
                } else if (bar.className === 'autopager_off') {
                    bar.className = 'autopager_on';
                    state_on();
                }
            }
            img = document.createElement('img');
            img.id = 'autopatchwork_loader';
            img.src = imgAPWLoader;
            bar.appendChild(img);

            document.body.appendChild(bar);
            bar.addEventListener('click', function (e) {
                if (e.target === bar) {
                    this._toggle();
                }
            }, false);
            status.bar = bar;
        }

        var style = document.createElement('style');
        style.textContent = options.css;
        style.id = 'autopatchwork_style';
        style.type = 'text/css';
        document.head.appendChild(style);

        var pageHeight = rootNode.offsetHeight;
        if (window.innerHeight >= pageHeight) check_scroll();

        // Replace all target attributes to user defined on all appended pages.
        if (options.FORCE_TARGET_WINDOW) {
            window.addEventListener('AutoPatchWork.DOMNodeInserted', target_rewrite, false);
        } else {
            window.addEventListener('AutoPatchWork.DOMNodeInserted', restore_setup, false);
            restoreText();
            window.addEventListener('beforeunload', savePosition, false);
        }

        // We are ready to send AutoPatchWork.initialized (and to bgProcess too).
        dispatch_event('AutoPatchWork.initialized', status);
        if (!options.DEFAULT_STATE) state_off();
        sendRequest({ message: 'AutoPatchWork.initialized', siteinfo: siteinfo });
        window.AutoPatchWorked = {
            init: AutoPatchWork,
            siteinfo: siteinfo,
            get_next_link: get_next_link,
            get_main_content: get_main_content,
            status: status
        };

        return true;
        /** 
         * Reinitialize APW handler: removes listeners and restarts class
         * @param {Event} evt Event data.
         * */
        function reset(evt) {
            if (evt.siteinfo) {
                Object.keys(evt.siteinfo).forEach(function (k) {
                    status[k] = evt.siteinfo[k];
                });
            }
            document.apwpagenumber = 1;
            window.removeEventListener('scroll', check_scroll, false);
            window.removeEventListener('resize', check_scroll, false);
            window.removeEventListener('AutoPatchWork.init', init, false);
            window.removeEventListener('AutoPatchWork.request', request, false);
            window.removeEventListener('AutoPatchWork.load', load, false);
            window.removeEventListener('AutoPatchWork.append', append, false);
            window.removeEventListener('AutoPatchWork.error', error_event, false);
            window.removeEventListener('AutoPatchWork.reset', reset, false);
            window.removeEventListener('AutoPatchWork.DOMNodeInserted', target_rewrite, false);
            window.removeEventListener('AutoPatchWork.DOMNodeInserted', restore_setup, false);
            window.removeEventListener('AutoPatchWork.state', state, false);
            if (status.use_iframe_req) {
                window.removeEventListener('AutoPatchWork.pageloaded', pageloaded_iframe, false);
            } else {
                window.removeEventListener('AutoPatchWork.pageloaded', pageloaded, false);
            }
            window.removeEventListener('beforeunload', savePosition, false);
            if (status.bottom && status.bottom.parentNode) {
                status.bottom.parentNode.removeChild(status.bottom);
            }
            if (bar && bar.parentNode) {
                bar.parentNode.removeChild(bar);
            }
            delete window.AutoPatchWorked;

            //FIXME: add new features
            AutoPatchWork({
                nextLink: status.next_link,
                pageElement: status.page_elem,
                forceIframe: (status.use_iframe_req || false)
            });

        }
        /** 
         * Error event handler.
         * @param {Event} evt Event data. *
         */
        function error_event(evt) {
            ///////////////////
              dispatch_notify_event({
                extension: 'autopatchwork',
                text: evt.message
             });
             ///////////////////
            error(evt.message);
        }
        /** 
         * Changes statusbar state according to the event.
         * @param {Event} evt Event data. 
         * */
        function state(evt) {
            s2b(evt.status) ? state_on() : state_off();
        }
        /** 
         * Toggles statusbar state. */
        function toggle() {
            status.state ? state_off() : state_on();
        }
        /** 
         * Cleanup after stopping;
         *  */
        function cleanup() {
            window.removeEventListener('scroll', check_scroll, false);
            window.removeEventListener('resize', check_scroll, false);

            if (status.change_address) {
                while (downloaded_pages.length) change_address(downloaded_pages.shift());

                var elems = document.querySelectorAll('[data-apw-offview]');
                for (var i = 0; i < elems.length; i++) elems[i].removeAttribute('data-apw-offview');
            }

            if (status.bottom && status.bottom.parentNode) {
                status.bottom.parentNode.removeChild(status.bottom);
            }
        }
        /** 
         * Termination event handler. 
         * Stops scroll processing and removes statusbar.
         * @param {Event} evt Event data. 
         * */
        function terminated(evt) {
            status.state = false;
            status.loading = false;
            cleanup();
            ///////////////////
            dispatch_notify_event({
                extension: 'autopatchwork',
                text: evt.message
            });
            ///////////////////
            bar && (bar.className = 'autopager_terminated');
            setTimeout(function () {
                bar && bar.parentNode && bar.parentNode.removeChild(bar);
                bar = null;
            }, 3000);

        }
        /** 
         * Error handler. 
         * Stops scroll processing prints error, sets error statusbar.
         * */
        function error(message) {
            status.state = false;
            status.loading = false;
            cleanup();
            bar && (bar.className = 'autopager_error');
            log(message);
            return false;
        }
        /** 
         * Gets current height of viewport.
         * @return {Number} Height of viewport
         * */
        function get_viewport_height() {
            var height = window.innerHeight; // Safari, Opera
            var mode = document.compatMode;

            if ((mode || (browser !== BROWSER_OPERA && browser !== BROWSER_SAFARI))) { // IE, Gecko
                height = (mode == 'CSS1Compat') ? document.documentElement.clientHeight : // Standards
                document.body.clientHeight; // Quirks
            }

            return height;
        }
        /** 
         * Filters scroll processing requests.
         * */
        var processed = false, timer = 0;
        function check_scroll() {
            if(!processed) {       
                timer = setInterval(function() {
                    if(processed) {
                        processed = false;
                        clearTimeout(timer);
                        do_scroll();
                    }
                }, 300);
            }
            processed = true;
        }
        /** 
         * Checks if document is scrolled enough to begin loading next page 
         * and dispatches event for a new page request.
         * */
        function do_scroll() {
            var viewporth, scrolltop, top, height, elems, elem = null;
            if (status.change_address && !status.button_elem) {
                viewporth = get_viewport_height()/2;
                scrolltop = (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
                elems = document.querySelectorAll('[data-apw-offview]');

                if (elems.length) {
                    for (var i = 0; i < elems.length; i++) {
                        elem = elems[i];
                        top = elem.offsetTop;
                        height = elem.clientHeight;

                        //if (scrolltop > (top + height) || scrolltop + viewporth < top) {} // to do something on hide; unused now
                        //else 
                        if (scrolltop + viewporth > top && scrolltop < top + height) {
                            elem.removeAttribute('data-apw-offview');
                            // we always have first loaded page on the other end of the array
                            if (downloaded_pages.length) change_address(downloaded_pages.shift());
                        } else {
                            //is the nodelist always gets ordered with depth-first pre-order?
                            //break;
                        }
                    }
                }
            }

            if (status.loading || !status.state) return;

            if (status.button_elem) {
                //viewporth = get_viewport_height();
                //scrolltop = (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);

                try {
                    elem = get_node(document, status.button_elem);
                } catch (bug) {
                    dispatch_event('AutoPatchWork.terminated', { message: 'Error finding next page button' });
                }
                if (elem) { // && status.busy_string && !~elem.innerText.indexOf(status.busy_string)) {
                    //top = elem.offsetTop;
                    //height = elem.clientHeight;
                    if ((rootNode.scrollHeight - window.innerHeight - window.pageYOffset) < status.remain_height) {//((scrolltop + viewporth) > top && scrolltop < (top + height)) {
                        status.loading = true;
                        elem.click();
                        // should timeout be a variable depending on page loading speed or as SITEINFO field?
                        window.setTimeout( function() { status.loading = false; dispatch_event('AutoPatchWork.pageloaded'); }, 2000 ); //parseInt((status.busy_time || 2000), 10);
                    }
                } else {
                    dispatch_event('AutoPatchWork.terminated', { message: 'Error finding next page button' });
                }

                return;
            }

            if ((rootNode.scrollHeight - window.innerHeight - window.pageYOffset) < status.remain_height) {
                if (bar) bar.className = 'autopager_loading';
                status.loading = true;
                dispatch_event('AutoPatchWork.request', {link: next});
            }
        }
        /** 
         * Rewrite event handler. Replaces link's target attribute.
         * @param {Event} evt Event data.
         * */
        function target_rewrite(evt) {
            if (evt && evt.target) {
                var as = evt.target.getElementsByTagName('a');
                for (var i = 0, l = as.length; i < l; i++) {
                    var a = as[i],
                        _a = a.getAttribute('href');
                    if (_a && !/^(?:javascript|mailto|data|skype)\s*:\s*/.test(_a) && !/^#/.test(_a) && !a.target) {
                        a.setAttribute('target', options.TARGET_WINDOW_NAME);
                    }
                }
            }
        }
        /** 
         * Restore event handler. Restores onclick methods.
         * @param {Event} evt Event data.
         * */
        function restore_setup(evt) {
            if (evt && evt.target) {
                var target = evt.target;
                target.addEventListener('click', function (evt) {
                    var _target = evt.target;
                    do {
                        if (_target.href) {
                            sessionStorage['AutoPatchWork.restore.' + location_href] = 1;
                            break;
                        } else if (target === _target) {
                            break;
                        }
                        _target = _target.parentNode;
                    } while (_target);
                }, false);
            }
        }
        /* Saves current scroll position. */
        function savePosition() {
            sessionStorage['AutoPatchWork.scroll.' + location_href] = window.pageYOffset;
        }
        /* Restores current scroll position. */
        function restorePosition() {
            window.scrollTo(window.pageXOffset, parseInt(sessionStorage['AutoPatchWork.scroll.' + location_href], 10));
        }
        /* Checks if we can restore onclick methods. */
        function check_restore() {
            return !!sessionStorage['AutoPatchWork.restore.' + location_href];
        }
        /** 
         * Saves text in a given context.
         * @param {String} url Pages URL.
         * @param {String} page Target page.
         * @param {String} text Text to be saved.
         * */
        function saveText(url, page, text) {
            session_object[page] = { page: page, text: text };
            sessionStorage['AutoPatchWork.text.' + location_href] = JSON.stringify(session_object);
        }
        /* Restores text in a given context and clears buffers. */
        function restoreText() {
            if (check_restore()) {
                var cache_str = sessionStorage['AutoPatchWork.text.' + location_href];
                if (cache_str) {
                    var cache = JSON.parse(cache_str);
                    Object.keys(cache).forEach(function (num) {
                        var page = cache[num];
                        dispatch_event('AutoPatchWork.load', { response: {responseText: page.text}, url: page.url });
                    });
                    restorePosition();
                }
            } else {
                delete sessionStorage['AutoPatchWork.text.' + location_href];
                delete sessionStorage['AutoPatchWork.scroll.' + location_href];
            }
            delete sessionStorage['AutoPatchWork.restore.' + location_href];
        }
        /* Sets statusbar to ready state. */
        function state_on() {
            status.state = true;
            bar && (bar.className = 'autopager_on');
        }
        /* Sets statusbar to disabled state. */
        function state_off() {
            status.state = false;
            bar && (bar.className = 'autopager_off');
        }
        /* Requests next page via XMLHttpRequest method. */
        function request(event) {
            status.loading = true;
            var url = state.nextURL = get_href(event.link);
            delete event.link;

            //log('requesting ' + url);
            if (!url || url === '') {
                // we shouldn't be here
                log('Invalid next link requested: ' + url);
                return dispatch_event('AutoPatchWork.terminated', { message: 'Invalid next link requested' });
            }

            if (typeof event.norequest !== 'undefined' && event.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: createHTML('<!DOCTYPE html><html><head><meta charset="utf-8"><title>auto</title></head><body></body></html>', url),
                    url: url
                });
            }

            // if we ever do retries should do it inside the request function
            // otherwise can be sure that requested = loaded (or failed)
            if (!requested_urls[url]) {
                requested_urls[url] = true;
            } else {
                log('Next page ' + url + ' is already requested');
                return dispatch_event('AutoPatchWork.error', { message: 'Next page is already requested' });
            }

            var req = 'GET',
                x = new XMLHttpRequest();
            x.onload = function () {
                if (dump_request) console.log(x.responseText);
                dispatch_event('AutoPatchWork.load', {
                    htmlDoc: createHTML(x.responseText, url),
                    url: url
                });
            };
            x.onerror = function () {
                dispatch_event('AutoPatchWork.error', { message: 'XMLHttpRequest failed. Status: ' + x.status });
            };
            //if (req === 'POST') {
            //    x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            //    x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            //}
            x.open(req, url, true);
            x.overrideMimeType('text/html; charset=' + document.characterSet);
            try {
               x.send();
            } catch (bug) {
                return dispatch_event('AutoPatchWork.error', { message: 'Network access error' });
            }
        }
        /* Requests next page via IFRAME-load method. */
        function request_iframe(event) {
            status.loading = true;
            var url = state.nextURL = get_href(event.link);
            delete event.link;

            //log('requesting ' + url);
            if (!url || url === '') {
                // we shouldn't be here
                return dispatch_event('AutoPatchWork.error', { message: 'Invalid next link requested' });
            }

            if (typeof event.norequest !== 'undefined' && event.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: createHTML('<!DOCTYPE html><html><head><meta charset="utf-8"><title>auto</title></head><body></body></html>', url),
                    url: url
                });
            }

            if (!requested_urls[url]) {
                requested_urls[url] = true;
            } else {
                return dispatch_event('AutoPatchWork.error', { message: 'next page is already requested' });
            }

            var iframe = document.createElement('iframe');
            //iframe.style.display = 'none';
            iframe.setAttribute('style', 'display: none !important;'); //failsafe
            iframe.id = iframe.name = 'autopatchwork-request-iframe';
            iframe.onload = function () {
                var doc = iframe.contentDocument;
                if (dump_request) console.log(doc.innerHTML);
                dispatch_event('AutoPatchWork.load', { htmlDoc: doc, url: url });
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            };
            iframe.onerror = function () {
                dispatch_event('AutoPatchWork.error', { message: 'IFRAME request failed. Status:' + x.status });
            };
            iframe.src = url;
            document.body.appendChild(iframe);
        }
        /** 
         * Returns link node reference.
         * @param {Node} node The input node.
         * */
        function get_href(node) {
            if (!node) return null;
            if (typeof node.getAttribute == 'function') {
                if (node.getAttribute('href')) return node.getAttribute('href');
                else if (node.getAttribute('action')) return node.getAttribute('action');
                else if (node.getAttribute('value')) return node.getAttribute('value');
            }
            return node.href || node.action || node.value;
        }
        /** 
         * [test] Evaluates included scripts.
         * @param {Node} node Node to run scripts of.
         * */
        function eval_scripts(node){
            if (!node) return;
            for (var i = 0, strExec = '', st = node.querySelectorAll('SCRIPT'); i < st.length; i++) {
                strExec = st[i].text;
                if (st[i].parentNode) st[i].parentNode.removeChild(st[i]);
                else st[i].text = '';

                var x = document.createElement('script');
                x.type = 'text/javascript';
                x.text = strExec;

                try {
                    (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(x);
                    setTimeout( (function(){ x.parentNode.removeChild(x); })(x), 100)
                } catch (bug) {}
            }
        }
        /** 
         * Event hadler for parsing new page data.
         * @param {Event} evt Event data.
         * */
        function load(evt) {
            if (!evt.htmlDoc)
                return dispatch_event('AutoPatchWork.error', { message: 'no response from server' });

            loaded_url = evt.url;
            htmlDoc = evt.htmlDoc;
            delete evt.htmlDoc;

            if (!options.FORCE_TARGET_WINDOW)
                saveText(loaded_url, document.apwpagenumber, htmlDoc.outerHTML || htmlDoc.documentElement.outerHTML);
            dispatch_event('AutoPatchWork.append');
        }
        /** 
         * Event handler for browser location rewriting on each new page.
         * @param {String} to_url New url to set.
         * */
        function change_address(to_url) {
            history.pushState('', '', location.href);
            history.replaceState('', '', to_url);
        }
        /** 
         * Dectenct if string is XPath format.
         * @param {String} test String to detect.
         * */
        function is_xpath(test) {
            if (test.indexOf('http') === 0 && ~test.indexOf('|')) return false;
            return (~test.indexOf('/') || test.substr(0,2) === 'id' || test[0] === '(');
        }
        /** 
         * Event handler for appending new pages.
         * @param {Event} evt Event data.
         * */
        function append(evt) {
            if (!status.loading || !htmlDoc) return;

            var inserted_node, i,
                content_last = status.content_last,
                content_parent = status.content_parent,
                change_location = status.change_address;

            status.page_number++;
            document.apwpagenumber++;
            if (change_location) downloaded_pages.push(loaded_url);
            
            // filter elements
            if (status.remove_elem) {
                var r, l;
                if (is_xpath(status.remove_elem)) {
                    r = htmlDoc.evaluate(status.remove_elem, htmlDoc, status.resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    l = r.snapshotLength;
                    for (i = 0; i < l; i++)
                        if (r.snapshotItem(i).parentNode) 
                            r.snapshotItem(i).parentNode.removeChild(r.snapshotItem(i));
                } else {
                    r = htmlDoc.querySelectorAll(status.remove_elem);
                    l = r.length;
                    for (i = 0; i < l; i++)
                        if (r[i].parentNode)
                            r[i].parentNode.removeChild(r[i]);
                }
            }

            // filter scripts
            if (!status.scripts_allowed) {
                for (var i = 0, st = htmlDoc.querySelectorAll('script'); i < st.length; i++)
                    if (st[i].parentNode)
                        st[i].parentNode.removeChild(st[i]);
            }

            var nodes = get_main_content(htmlDoc),
                //first = nodes[0],
                title = htmlDoc.querySelector('title') ? htmlDoc.querySelector('title').textContent.trim() : '';
                
            next = get_next_link(htmlDoc);

            htmlDoc = null;
            if (!nodes || !nodes.length) {
                dispatch_event('AutoPatchWork.error', { message: 'page content not found.' });
                return;
            }
            
            //setTimeout(function(){

            // we can't check for repeating nodes in the same document because
            // they can have some function also can't check responseText (earlier) as there
            // is a high probability of non-paging content changes like random ad names
            if (options.CRC_CHECKING && nodes.length === 1) {
                var inserted_node_crc = checksum.crc(nodes[0].parentNode.innerHTML);
                if (!loaded_crcs[inserted_node_crc]) loaded_crcs[inserted_node_crc] = true;
                else return dispatch_event('AutoPatchWork.terminated', { message: 'next page has same crc' });
            }

            if (!status.separator_disabled) {
                // Checking where to add divider. In case of a table/list we'll add inside it, otherwise after.
                var root, node;
                if (/^tbody$/i.test(content_parent.localName)) {
                    var colNodes = document.evaluate('child::tr[1]/child::*[self::td or self::th]', content_parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    var colums = 0;
                    for (i = 0, l = colNodes.snapshotLength; i < l; i++) {
                        var col = colNodes.snapshotItem(i).getAttribute('colspan');
                        colums += parseInt(col, 10) || 1;
                    }
                    node = document.createElement('td');
                    root = document.createElement('tr');
                    node.setAttribute('colspan', colums);
                    root.appendChild(node);
                } else if (/^(?:ol|ul)$/i.test(content_parent.localName)) {
                    root = node = document.createElement('li');
                } else {
                    root = node = document.createElement('div');
                }

                // Adding the page separator.
                node.className = 'autopagerize_page_separator_blocks';
                //node.setAttribute('data-apw-page', document.apwpagenumber);
                var h4 = node.appendChild(document.createElement('h4'));
                h4.className = 'autopagerize_page_separator';
                var span = h4.appendChild(document.createElement('span'));
                span.className = 'autopagerize_page_info';
                var a = span.appendChild(document.createElement('a'));
                a.className = 'autopagerize_link';
                a.href = loaded_url;
                a.setAttribute('number', document.apwpagenumber);
                if (title.length) a.setAttribute('title', title);

                content_parent.insertBefore(root, content_last);
            }

            if (status.accelerate && nodes.length > 2) {
                var fragment = document.createDocumentFragment();
                // Merge nodes to fragment to avoid slowdowns but drop AutoPatchWork.DOMNodeInserted support
                for (i = 0; i < nodes.length; i++) {
                    inserted_node = fragment.appendChild(document.importNode(nodes[i], true));
    
                    if (inserted_node && (typeof inserted_node.setAttribute === 'function')) {
                        // service data for external page processing
                        inserted_node['data-apw-url'] = loaded_url;
                        if (i === 0) {
                            inserted_node.setAttribute('data-apw-page', document.apwpagenumber);
                            if (change_location)
                                inserted_node.setAttribute('data-apw-offview', 'true');
                        }
                    }
                }
                content_parent.insertBefore(document.importNode(fragment, true), content_last);
            } else {
                // Adding nodes and firing node change event on each of them
                for (i = 0; i < nodes.length; i++) {
                    inserted_node = content_parent.insertBefore(document.importNode(nodes[i], true), content_last);
                    //if (status.scripts_allowed) eval_scripts(inserted_node);
                    if (inserted_node && (typeof inserted_node.setAttribute === 'function')) {
                        // service data for external page processing
                        inserted_node['data-apw-url'] = loaded_url;
                        if (i === 0) {
                            inserted_node.setAttribute('data-apw-page', document.apwpagenumber);
                            if (change_location)
                                inserted_node.setAttribute('data-apw-offview', 'true');
                        }
                    }
                    var mutation = {
                        targetNode: inserted_node,
                        eventName: 'AutoPatchWork.DOMNodeInserted',
                        bubbles: true,
                        cancelable: false,
                        relatedNode: content_parent,
                        prevValue: null,
                        newValue: loaded_url,
                        attrName: 'url',
                        attrChange: 2 // MutationEvent.ADDITION
                    };
                    dispatch_mutation_event(mutation);
                };
            }

            nodes = null;
            dispatch_event('AutoPatchWork.pageloaded');

            if (status.bottom) status.bottom.style.height = rootNode.scrollHeight + 'px';

            if (rootNode.offsetHeight <= window.innerHeight) check_scroll();
            //},0);
        }
        /** 
         * Creates HTML document object from a string.
         * @param {String} source String with HTML-formatted text.
         * @param {String} url String with URL of original page.
         * @return {HTMLDocument} DOM-document.
         * */
        function createHTML(source, url) {
            // Chrome 4, Opera 10, Firefox 4, Internet Explorer 9, Safari 4 have createHTMLDocument
            var doc = document.implementation.createHTMLDocument('HTMLParser');
            doc.documentElement.innerHTML = source;
            return doc;
        }
        /** 
         * Evaluates XPath to find node containing next page link.
         * @param {Node} doc Node to perform XPath search on.
         * @return {Node} Matched node.
         * */
        function get_node(doc, path) {
            if (is_xpath(path))
                return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            else
                return doc.querySelector(path);
            return null;
        }
        /** 
         * Evaluates expression to find node containing next page link.
         * @param {Node} doc Node to perform search on.
         * @return {Node} Matched node.
         * */
        function get_next_link(doc) {
            if (!doc || !status.next_link) return null;
            if (is_xpath(status.next_link)) {
                return doc.evaluate(status.next_link, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } else if (status.next_link.substr(0,4) === 'http') {
                // format link-up-to-page-number|step[|link-after-page-number]
                var arr = status.next_link.split('|');
                return {href: arr[0] + ((status.page_number + 1) * parseInt(arr[1], 10)) + (arr[2] || '')};
            } else {
                return doc.querySelector(status.next_link);
            }
            return null;
        }
        /** 
         * Evaluates expression to find nodes containing main page content.
         * @param {Node} doc Node to perform search on.
         * @return {NodeList} Matched nodes.
         * */
        function get_main_content(doc) {
            if (!doc || !status.page_elem) return null;
            var i, r, l, res;
            if (is_xpath(status.page_elem)) {
                r = doc.evaluate(status.page_elem, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                l = r.snapshotLength;
                res = (l && new Array(l)) || [];
                for (i = 0; i < l; i++) res[i] = r.snapshotItem(i);
            } else{
                r = doc.querySelectorAll(status.page_elem);
                l = r.length;
                res = (l && new Array(l)) || [];
                for (i = 0; i < l; i++) res[i] = r[i];
            }
            return element_filter(res);
        }
        /** 
         * Keeps only elements on the same level.
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
        /* Calculates height delta between end of page and botoom of last content block. */
        function calc_remain_height() {
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
                bottom = rect.top + window.pageYOffset;
            } else if (status.content_parent && typeof status.content_parent.getBoundingClientRect === 'function') {
                rect = status.content_parent.getBoundingClientRect();
                bottom = rect.top + rect.height + window.pageYOffset;
            }
            if (!bottom) {
                bottom = Math.round(rootNode.scrollHeight * 0.8);
            }
            return rootNode.scrollHeight - bottom + options.BASE_REMAIN_HEIGHT;
        }
    }
})(this, window.XPathResult, window.XMLHttpRequest, window.Node, window.history, window.location, window.sessionStorage);