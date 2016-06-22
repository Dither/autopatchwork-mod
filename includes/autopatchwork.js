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
// @exclude *www.youtube.com/embed*
// @run-at document-start
// ==/UserScript==

/*
 * Normal AutoPatchWork event flow:
 *  AutoPatchWork.init (internal) - we are on some site, requesting siteinfo for it;
 *  AutoPatchWork.ready - extension configured and ready to work;
 *  AutoPatchWork.siteinfo - received SITEINFO for the current site;
 *  AutoPatchWork.initialized (internal) - APW data initialized;
 *  scroll (internal) - got some page scrolling;
 *  AutoPatchWork.request - sending request for the next page;
 *  AutoPatchWork.load - got new page data and ready to process it;
 *  AutoPatchWork.append - appending page to the current;
 *  AutoPatchWork.DOMNodeInserted - firing Node Inserted event;
 *  AutoPatchWork.pageloaded - page loaded successfully;
 *  AutoPatchWork.error - page failed to load, recoverable error;
 *  AutoPatchWork.terminated - stopping extension, unrecoverable error or end-condition;
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

    var browser, checksum = new FastCRC32, debug = false, dump_request = false,
          BROWSER_CHROME = 1,
          BROWSER_SAFARI = 2,
          BROWSER_OPERA = 3;

    var options = {
        BASE_REMAINING_HEIGHT: 1000,
        BASE_INTERPAGE_DELAY: 500,
        FORCE_TARGET_WINDOW: true,
        FORCE_ABSOLUTE_HREFS: true,
        FORCE_ABSOLUTE_IMG_SRCS: false,
        TRY_CORRECT_LAZY: false,
        DEFAULT_STATE: true,
        TARGET_WINDOW_NAME: '_blank',
        CRC_CHECKING: false,
        BAR_STATUS: true,
        CHANGE_ADDRESS: false,
        APW_CSS: ''
    };

    var status = {
        state: false,
        loading: false,
        scripts_allowed: false,
        separator_disabled: false,
        use_iframe_req: false,
        change_address: false,
        page_number: 1,
        css_patch: null,
        js_patch: null,
        next_link: null,
        next_link_selector: null,
        next_link_mask: null,
        page_elem: null,
        page_elem_selector: null,
        remove_elem: null,
        remove_elem_selector: null,
        button_elem: null,
        button_elem_selector: null,
        load_delay: 500,
        load_count: 0,
        load_start_time: 0,
        last_element: null,
        content_last: null,
        content_parent: null,
        bottom: null,
        remaining_height: null,
        service: false,
        id: -1
    };

    if((!!window.chrome && !!window.chrome.webstore) || (typeof InstallTrigger !== 'undefined')) browser = BROWSER_CHROME;
    else if(Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) browser = BROWSER_SAFARI;
    else browser = BROWSER_OPERA;

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
        if (window.console) {
            console.log('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        } else if (browser === BROWSER_OPERA) {
            window.opera.postError('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        }
    }

    /**
     * Addds CSS to the current page.
     * @param {String} css CSS string.
     * */
    function add_css(css) {
        var style = document.createElement('style');
        style.textContent = css;
        style.type = 'text/css';
        document.head.appendChild(style);
    }

    /**
     * Checks variable and explictly converts string to the corresponding boolean.
     * Possible data values are: undefined, null, unknown text or a number (treated as false here except 1),
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
        var ev = new window.CustomEvent(type, { 'detail': opt });
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
        var noe = new window.CustomEvent('Notify.It', { 'detail': opt });
        document.dispatchEvent(noe);
    }

    if (/*browser === BROWSER_OPERA &&*/ !APW.loaded) {
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
                if (callback) chrome.runtime.sendMessage(data, callback);
                else chrome.runtime.sendMessage(data);
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

    var bar = null, matched_siteinfo,
          rootNode = /BackCompat/.test(document.compatMode) ? document.body : document.documentElement;
    document.apwpagenumber = 1;

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

    window.addEventListener('hashchange', function (e) {
        if (window.AutoPatchWorked && AutoPatchWorked.siteinfo) {
            var status = AutoPatchWorked.status;
            if (status.button_elem || status.button_elem_selector) return;
            var first_element = (AutoPatchWorked.get_main_content(document) || [])[0];
            if (status.first_element !== first_element) {
                //forceIframe = true; // probably bugged method
                AutoPatchWorked.siteinfo.forceIframe = true;
                dispatch_event('AutoPatchWork.reset', {'siteinfo': AutoPatchWorked.siteinfo});
            }
        } else if (matched_siteinfo) {
            matched_siteinfo.some(function (s) { return AutoPatchWork(s); });
        }
    }, false);


    //function hashChanged (e) { setTimeout(reInit, 100, e);  };
    //window.addEventListener('hashchange', hashChanged, false);

    /**
     * APW initialisation, config reading and fail registration.
      * @param {Object} info Contains APW paramenters.
     * */
    function begin_init(info) {
        if (typeof info == 'undefined') return dispatch_event('AutoPatchWork.ready');
        matched_siteinfo = info.siteinfo;
        if (info.config) {
            options.FORCE_ABSOLUTE_HREFS =  info.config.force_abs_hrefs;
            options.FORCE_ABSOLUTE_IMG_SRCS =  info.config.force_abs_srcs;
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
        var fails = [];
        var ready = info.siteinfo.some(function (s) {
            return AutoPatchWork(s) || (fails.push(s), false);
        });
        (ready === false) && sendRequest({ failed_siteinfo: fails });
        return dispatch_event('AutoPatchWork.ready');
    }
    /**
     * Event handler for receiving SITEINFO.
     * @param {Event} event Event data.
     * */
    function siteinfo(event) {
        if (event.detail && event.detail.siteinfo) {
            if (!window.AutoPatchWorked) {
                AutoPatchWork(event.detail.siteinfo);
            } else {
                dispatch_event('AutoPatchWork.reset', {'siteinfo': event.detail.siteinfo});
            }
        }
    }
    /**
     * AutoPatchWork main.
     * @param {Object} SITEINFO structure for the current site.
     * */
    function AutoPatchWork(siteinfo) {
        if (window.AutoPatchWorked) return true;

        var base_url,
            downloaded_pages = [],
            page_titles = [],
            scroll = false;

        status.next_link = siteinfo.nextLink || null;
        status.next_link_selector = siteinfo.nextLinkSelector || null;
        status.next_link_mask = siteinfo.nextMask || null;
        status.css_patch = siteinfo.cssPatch || null;
        status.js_patch = siteinfo.jsPatch || null;
        if (status.js_patch)
            run_script(status.js_patch);

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

        status.id = parseInt(siteinfo['wedata.net.id'], 10) || -1;

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

        status.separator_disabled = s2b(siteinfo.disableSeparator);
        status.scripts_allowed = s2b(siteinfo.allowScripts);
        status.use_iframe_req = s2b(siteinfo.forceIframe);
        status.service = s2b(siteinfo.SERVICE);
        if(!status.service) {
            status.change_address = typeof siteinfo.forceAddressChange !== 'undefined' ? !s2b(siteinfo.forceAddressChange) ^ !options.CHANGE_ADDRESS : options.CHANGE_ADDRESS;
        }

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

        if (!s2b(siteinfo.MICROFORMAT)) log('detected SITEINFO = ' + JSON.stringify(siteinfo, null, 4));

        var not_service = !s2b(siteinfo.SERVICE),
            next = get_next_link(document);

        if (status.button_elem) {
            if (!get_node_xpath(document, status.button_elem)) return;
        } else if (status.button_elem_selector){
            if (!get_node(document, status.button_elem_selector)) return;
        }

        if (!get_href(next) && not_service && !status.button_elem && !status.button_elem_selector) {
            if (s2b(siteinfo.MICROFORMAT)) return;
            return log('next link ' + (status.next_link || status.next_link_selector || status.next_link_mask)  + ' not found.');
        }

        var page_elements = get_main_content(document);
        if ((!page_elements || !page_elements.length) && not_service && !status.button_elem && !status.button_elem_selector) {
            if (s2b(siteinfo.MICROFORMAT)) return;
            return log('Page content ' + (status.page_elem || status.page_elem_selector)  + ' not found.');
        }

        // Individual site fixes.
        // DON'T MODIFY! Use external scripts API to handle them instead.
        if (/^https?:\/\/(www|images)\.google\.(?:[^.]+\.)?[^.\/]+\/images\?./.test(location.href)) {
            request = request_iframe;
            status.use_iframe_req = true;
        }
        else if (~location.host.indexOf('tumblr.com')) {
            request = request_iframe;
            status.use_iframe_req = true;
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
                    log('Next page has different base address: using IFrame requests...');
                }
            if (status.use_iframe_req)
                request = request_iframe;
        }

        if (!status.button_elem && !status.button_elem_selector) {
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

        var loaded_url,
            requested_urls = {},
            loaded_crcs = {},
            location_pushed = false,
            session_object = {};

        requested_urls[location.href] = true;
        status.remaining_height || (status.remaining_height = calc_remaining_height());

        add_css(options.APW_CSS);
        if (status.css_patch) add_css(status.css_patch);

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
            bar = document.createElement('div');
            bar.id = 'autopatchwork_bar';
            bar.className = 'autopager_off';
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
                manager.textContent = 'SIM';
                manager.onclick = function () {
                    sendRequest({ manage: true, hash: location.hostname.replace(/ww[w\d]+\./i,'')});
                };
                bar.appendChild(onoff);
                bar.appendChild(option);
                bar.appendChild(manager);
                bar.onmouseover = null;
            };

            /* Toggles status bar ready state. */
            var _toggle = function() {
                if (bar.className === 'autopager_on') {
                    state_off();
                    sendRequest({ pause: 'on', id: status.id });
                } else if (bar.className === 'autopager_off') {
                    state_on();
                    verify_scroll();
                    sendRequest({ pause: 'off', id: status.id});
                }
            }

            //if (browser === BROWSER_OPERA) { // test :before + background-image: url(animated SVG) in CSS for other browsers
                var img = document.createElement('img');
                img.id = 'autopatchwork_loader';
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 32" width="60" height="32" fill="lightgray"><circle transform="translate(10 0)" cx="0" cy="16" r="0"><animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle><circle transform="translate(30 0)" cx="0" cy="16" r="0"><animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.3" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle><circle transform="translate(50 0)" cx="0" cy="16" r="0"> <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.6" keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" /></circle></svg>';
                bar.appendChild(img);
            //}

            document.body.appendChild(bar);
            bar.addEventListener('click', function (e) {
                if (e.target === bar) {
                    this._toggle();
                }
            }, false);
            status.bar = bar;
        }

        // We are ready to send AutoPatchWork.initialized (and to bgProcess too).
        dispatch_event('AutoPatchWork.initialized', status);
        sendRequest({ message: 'AutoPatchWork.initialized', siteinfo: siteinfo });
        window.AutoPatchWorked = {
            init: AutoPatchWork,
            siteinfo: siteinfo,
            get_next_link: get_next_link,
            get_main_content: get_main_content,
            status: status,
            dispatch_event: dispatch_event
        };

        if (typeof siteinfo.pause === 'undefined'  && options.DEFAULT_STATE) state_on();
        if (typeof siteinfo.pause !== 'undefined' && !siteinfo.pause) state_on();

        remove_nodes(document);
        verify_scroll();

        return true;

        /*============================== end of main entry point ==============================*/

        /**
         * Reinitialize APW handler: removes listeners and restarts class
         * @param {Event} event Event data.
         * */
        function reset(event) {
            if (event.detail && event.detail.siteinfo) {
                Object.keys(event.detail.siteinfo).forEach(function (k) {
                    status[k] = event.detail.siteinfo[k];
                });
            }
            document.apwpagenumber = 1;
            window.removeEventListener('scroll', on_scroll, false);
            window.removeEventListener('resize', on_scroll, false);
            document.removeEventListener('AutoPatchWork.init', init, false);
            document.removeEventListener('AutoPatchWork.request', request, false);
            document.removeEventListener('AutoPatchWork.load', load, false);
            document.removeEventListener('AutoPatchWork.append', append, false);
            document.removeEventListener('AutoPatchWork.error', error_event, false);
            document.removeEventListener('AutoPatchWork.reset', reset, false);
            document.removeEventListener('AutoPatchWork.state', state, false);
            document.removeEventListener('AutoPatchWork.pageloaded', pageloaded, false);
            window.removeEventListener('beforeunload', savePosition, false);

            //if (status.bottom && status.bottom.parentNode) {
            //    status.bottom.parentNode.removeChild(status.bottom);
            //}
            if (bar && bar.parentNode) {
                bar.parentNode.removeChild(bar);
            }
            delete window.AutoPatchWorked;

            //FIXME: add new features
            AutoPatchWork({
                nextLink: status.next_link || status.next_link_selector || status.next_link_mask,
                pageElement: status.page_elem || status.page_elem_selector,
                forceIframe: (status.use_iframe_req || false)
            });

        }
        /**
         * Changes statusbar state according to the event.
         * @param {Event} event Event data.
         * */
        function state(event) {
            event.detail && s2b(event.detail.state) ? state_on() : state_off();
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
            window.removeEventListener('scroll', on_scroll, false);
            window.removeEventListener('resize', on_scroll, false);

            if (status.change_address) {
                while (downloaded_pages.length) change_address(downloaded_pages.shift());
                while (page_titles.length) document.title = page_titles.shift();

                var elems = document.querySelectorAll('[data-apw-offview]');
                for (var i = 0; i < elems.length; i++) elems[i].removeAttribute('data-apw-offview');
            }

            //status.bottom && status.bottom.parentNode && status.bottom.parentNode.removeChild(status.bottom);
            //status.bottom = null;
            bar && bar.parentNode && bar.parentNode.removeChild(bar);
            bar = null;
        }
        /**
         * Termination event handler.
         * Stops scroll processing and removes statusbar.
         * @param {Event} event Event data.
         * */
        function terminated(event) {
            status.state = false;
            status.loading = false;
            ///////////////////
            dispatch_notify_event({
                extension: 'autopatchwork',
                text: event.detail ? event.detail.message : ''
            });
            ///////////////////
            bar && (bar.className = 'autopager_terminated');
            if (event.detail && event.detail.message) log(event.detail.message);
            setTimeout(cleanup, 5000);

        }
        /**
         * Error (recoverable) event handler.
         * Stops scroll processing, prints error, sets error statusbar.
         * @param {Event} event Event data.
         * */
        function error(event) {
            status.state = false;
            status.loading = false;
            ///////////////////
              dispatch_notify_event({
                extension: 'autopatchwork',
                text: (event.detail ? event.detail.message : '')
             });
             ///////////////////
            bar && (bar.className = 'autopager_error');
            if (event.detail && event.detail.message) log(event.detail.message);
            setTimeout(cleanup, 5000);
        }
        /**
         * Gets current height of viewport.
         * @return {Number} Height of viewport
         * */
        function get_viewport_height() {
            return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        }
        /**
         * Reduces scroll processing request count.
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
        /**
         * Checks if document is scrolled enough to begin loading next page
         * and dispatches event for a new page request.
         * */
        function verify_scroll() {
            var viewporth, scrolltop, top, height, elems, elem = null;
            if (status.change_address && !status.button_elem && !status.button_elem_selector) {
                viewporth = get_viewport_height()/2;
                scrolltop = (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
                elems = document.querySelectorAll('[data-apw-offview]');

                if (elems && elems.length) {
                    for (var i = 0; i < elems.length; i++) {
                        elem = elems[i];
                        top = elem.offsetTop;
                        height = elem.clientHeight;

                        //if (scrolltop > (top + height) || scrolltop + viewporth < top) {} // to do something on hide; unused now
                        //else
                        if (scrolltop + viewporth > top/* && scrolltop < top + height*/) {
                            elem.removeAttribute('data-apw-offview');
                            // we always have first loaded page on the other end of the array
                            if (downloaded_pages.length) {
                                if (page_titles.length) document.title = page_titles.shift();
                                change_address(downloaded_pages.shift());
                            }
                        } else {
                            //is the nodelist always gets ordered with depth-first pre-order?
                            //break;
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
                if (elem) { // && status.busy_string && !~elem.innerHTML.indexOf(status.busy_string)) {
                    if ((rootNode.scrollHeight - window.innerHeight - window.pageYOffset) < status.remaining_height) {
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

            if ((rootNode.scrollHeight - window.innerHeight - window.pageYOffset) < status.remaining_height) {
                state_loading();                
                dispatch_event('AutoPatchWork.request', {link: next});
            }
        }
        /* Sets statusbar to loading state. */
        function state_loading() {
            status.loading = true;
            bar && (bar.className = 'autopager_loading');
        }
        /* Sets statusbar to loaded state. */
        function state_loaded() {
            status.loading = false;
            var b = document.getElementById('autopatchwork_bar');
            if (b) b.className = status.state ? 'autopager_on' : 'autopager_off';
        }
        /* Sets statusbar to ready state. */
        function state_on() {
            status.state = true;
            bar && !status.loading && (bar.className = 'autopager_on');
        }
        /* Sets statusbar to disabled state. */
        function state_off() {
            status.state = false;
            bar && !status.loading && (bar.className = 'autopager_off');
        }

        /* Requests next page via XMLHttpRequest method. */
        function request(event) {
            status.loading = true;
             // in service == true mode we just use request event as corresponding scroll detection for external script
            if (status.service) return;

            var url = state.nextURL = get_href(event.detail && event.detail.link ? event.detail.link : next);
            //log('requesting ' + url);
            // in norequest == true mode we just return empty html on each reuest, external script should fill that
            if (event.detail && event.detail.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: createHTML('<!DOCTYPE html><html><head><meta charset="utf-8"><title></title></head><body></body></html>', url),
                    url: url || null
                });
            }

            if (!url || url === '') {
                return dispatch_event('AutoPatchWork.terminated', { message: 'empty link requested: ' + url });
            }

            // if we ever do retries should do it inside the request function
            // otherwise can be sure that requested = loaded (or failed)
            if (!requested_urls[url]) {
                requested_urls[url] = true;
            } else {
                return dispatch_event('AutoPatchWork.terminated', { message: 'next page ' + url + ' already requested' });
            }

            var req = 'GET',
                x = new XMLHttpRequest();
            x.onload = function () {
                if (dump_request) console.log(x.responseText);
                if (!x.getResponseHeader('Access-Control-Allow-Origin'))
                    dispatch_event('AutoPatchWork.load', {
                        htmlDoc: createHTML(x.responseText, url),
                        url: url
                    });
                else dispatch_event('AutoPatchWork.terminated', { message: 'request failed on ' + url + ' because of CORS validation error.'});
            };
            x.onerror = function () {
                dispatch_event('AutoPatchWork.error', { message: 'XMLHttpRequest failed on ' + url + '. Reason: ' + x.statusText });
            };
            //if (req === 'POST') {
            //    x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            //    x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            //}
            status.load_start_time = new Date().getTime();
            x.open(req, url, true);
            x.overrideMimeType('text/html; charset=' + document.characterSet);
            try {
               x.send();
            } catch (bug) {
               return dispatch_event('AutoPatchWork.error', { message: 'Network access error on ' + url});
            }
        }
        /* Requests next page via IFRAME-load method. */
        function request_iframe(event) {
            status.loading = true;

            if (status.service) return;

            var url = state.nextURL = get_href(event.detail && event.detail.link ? event.detail.link : next);

            if (event.detail && event.detail.norequest) {
                return dispatch_event('AutoPatchWork.load', {
                    htmlDoc: createHTML('<!DOCTYPE html><html><head><meta charset="utf-8"><title>autopatchwork</title></head><body></body></html>', url),
                    url: url || null
                });
            }

            //log('requesting ' + url);
            if (!url || url === '') {
                return dispatch_event('AutoPatchWork.terminated', { message: 'empty link requested' });
            }

            if (!requested_urls[url]) {
                requested_urls[url] = true;
            } else {
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
                dispatch_event('AutoPatchWork.error', { message: 'IFRAME request failed.' });
                remove_iframe();
            };
            iframe.onload = function () {
                var doc = iframe.contentDocument;
                if (!doc) return iframe.onerror();
                if (dump_request) console.log(doc.innerHTML);
                dispatch_event('AutoPatchWork.load', { htmlDoc: doc, url: url });
                remove_iframe();
            };
            iframe.src = url;
            status.load_start_time = new Date().getTime();
            document.body.appendChild(iframe);
        }
        /**
         * Returns link node reference.
         * @param {Node} node The input node.
         * */
        function get_href(node) {
            if (!node) return null;
            if (typeof node.getAttribute === 'function') {
                if (node.getAttribute('href')) return node.getAttribute('href');
                else if (node.getAttribute('action')) return node.getAttribute('action');
                else if (node.getAttribute('value')) return node.getAttribute('value');
            }
            return node.href || node.action || node.value;
        }
        /**
         * Runs script in current context .
         * @param {String} text Text to run scripts of.
         * */
        function run_script(text) {
            try {
                if (text && text.length > 1)
                    window.eval(text);
            } catch (bug) {
                log(bug.message);
            }
        }
        /**
         * Evaluates included scripts.
         * @param {Node} node Node to run scripts of.
         * */
        function run_node_scripts(node) {
            if (!node) return;
            for (var i = 0, strExec = '', st = node.querySelectorAll('script'), len = st.length; i < len; i++) {
                strExec = st[i].text;
                //st[i].parentNode ? st[i].parentNode.removeChild(st[i]) : (st[i].text = '');

                run_script(strExec);
            }
        }

        /**
         * Gets base of any URL.
         * @param {String} url Location.
         * */
        function get_base_url(url) {
            if (typeof url !== 'string' || !url.length)
                url = location.href;
            var link = document.createElement('a');
            link.href = url;
            var path_arr = link.pathname.split('/');
            if (~path_arr.pop().indexOf('.'))
                return link.protocol + '//' + link.host + path_arr.join('/') + '/';
            else
                return link.protocol + '//' + link.host + (link.pathname + '/').replace(/\/+$/,'/')
        }

        /**
         * Checks if URL is relative.
         * @param {String} url Location.
         * */
        function is_url_relative(url) {
            if (typeof url !== 'string' || !url.length || (/^(?:[a-z]+\:)?\/\//i).test(url)) // ignoring protocol change between pages
                return false;   
            else if (url[0] !== '/')
                return true;
            return false;
        }

        // - Replace lazyloading src's to normal although better solution would be
        //   using per-site js patches.
        // - Make links to images absolute.
        function parse_images(node) {
            if (!node || node.nodeType !== 1) return; // 1 -> Node.ELEMENT_NODE
            for (var i = 0, img = (node.tagName && node.tagName.toLowerCase() === 'img')?[node]:node.getElementsByTagName('img'), len = img.length; i < len; i++) {
                if (options.TRY_CORRECT_LAZY) {
                    for (var j = 0, atts = img[i].attributes, n = atts.length, match = null; j < n; j++) {
                       if (~atts[j].localName.toLowerCase().indexOf('data-')) {
                           match = atts[j].textContent.toLowerCase().match(/\.(?:jpe?g|a?png|gif|svg)/g);
                           if (match && match.length === 1) { // in case of image list variable we ignore it
                               img[i].setAttribute('src', atts[j].textContent);
                               break;
                           }
                       }
                    }
                }

                if (!options.FORCE_ABSOLUTE_IMG_SRCS) continue;
                var src = img[i].getAttribute('src');
                if (src && is_url_relative(src))
                    img[i].setAttribute('src', base_url + src);
            }
        }/**/

        // - Make target attribute as specified.
        // - Fix next page-relative link HREFs to absolute.
        function parse_links(node, target) {
            // we are ignoring links inside links, i.e a>a
            if (!node || node.nodeType !== 1) return; // 1 -> Node.ELEMENT_NODE
            for (var lnki = 0, lnks = (node.tagName && node.tagName.toLowerCase() === 'a')?[node]:node.getElementsByTagName('a'), lnlen = lnks.length; lnki < lnlen; lnki++) {
                var href = lnks[lnki].getAttribute('href');
                if (typeof target !== 'undefined') {
                    if (href && !/^(?:javascript|mailto|data|skype)\s*:\s*/.test(href) && !/^#/.test(href) && !lnks[lnki].target) {
                        lnks[lnki].setAttribute('target', options.TARGET_WINDOW_NAME);
                    }
                }

                if (options.FORCE_ABSOLUTE_HREFS && href && href.length && is_url_relative(href)) {
                    lnks[lnki].setAttribute('href', base_url + href);
                }
            }
        }

        /**
         * Filters undesired elements from a document.
         * @param {DocumentElement} doc Document to remove nodes from.
         * */
        function remove_nodes (doc) {
            // filter undesired elements
            if (!status.remove_elem && !status.remove_elem_selector) return;
            var r, l;
            if (status.remove_elem) {
                r = doc.evaluate(status.remove_elem, doc, status.resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                l = r.snapshotLength;
                for (i = 0; i < l; i++)
                    if (r.snapshotItem(i).parentNode)
                        r.snapshotItem(i).parentNode.removeChild(r.snapshotItem(i));
            } else {
                r = doc.querySelectorAll(status.remove_elem_selector);
                l = r.length;
                for (var i = 0; i < l; i++)
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

            loaded_url = event.detail.url;
            base_url = get_base_url(loaded_url);
            next = get_next_link(event.detail.htmlDoc);
            parse_links(next);
            remove_nodes(event.detail.htmlDoc); // filter nodes
            if (!status.scripts_allowed) { // filter scripts
               for (var i = 0, st = event.detail.htmlDoc.querySelectorAll('script'), len = st.length; i < len; i++)
                   if (st[i].parentNode)
                       st[i].parentNode.removeChild(st[i]);
            }

            status.page_number++;
            document.apwpagenumber++;

            var nodes = get_main_content(event.detail.htmlDoc),
                title = event.detail.htmlDoc.querySelector('title') ? event.detail.htmlDoc.querySelector('title').textContent.trim() : '';
            delete event.detail.htmlDoc;

            if (!nodes || !nodes.length) return dispatch_event('AutoPatchWork.error', { message: 'page content ' + (status.page_elem || status.page_elem_selector)  + ' not found.' });
            else dispatch_event('AutoPatchWork.append', { nodes: nodes, title: title });
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
         * Returns max scrollheight of a document.
         * */
        function document_height() {
            return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        }
        /**
         * Event handler for appending new pages.
         * @param {Event} event Event data.
         * */
        function append(event) {
            if (!status.loading || !event.detail.nodes) return;

            var inserted_node, tmp_title,
                content_last = status.content_last,
                content_parent = status.content_parent,
                change_location = status.change_address;

            var nodes = event.detail.nodes,
                title = event.detail.title;

            delete event.detail.nodes;
            delete event.detail.title;

            // We can't check for repeating nodes in the same document because they can have some function 
            // also can't check responseText (earlier) as there is a higher probability of non-paging content changes like random ad id's
            if (options.CRC_CHECKING && nodes.length === 1) {
                var inserted_node_crc = checksum.crc(nodes[0].outerHTML);
                if (!loaded_crcs[inserted_node_crc]) loaded_crcs[inserted_node_crc] = true;
                else return dispatch_event('AutoPatchWork.terminated', { message: 'next page has same CRC' });
            }

            if (!status.separator_disabled) {
                // Checking where to add divider. In case of a table/list we'll add inside it, otherwise after.
                var root, node;
                if (/^tbody$/i.test(content_parent.localName)) {
                    var colNodes = document.evaluate('child::tr[1]/child::*[self::td or self::th]', content_parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    var columns = 0;
                    for (var i = 0, l = colNodes.snapshotLength; i < l; i++) {
                        columns += (parseInt(colNodes.snapshotItem(i).getAttribute('colspan'), 10) || 1);
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
                    node.setAttribute('data-apw-offview', 'true'); // Opera has bugs with some offsetTop calcs so better do it on predefined divs
                }
                //node.setAttribute('data-apw-page', document.apwpagenumber);
                var h4 = node.appendChild(document.createElement('h4'));
                h4.className = 'autopagerize_page_separator';
                var span = h4.appendChild(document.createElement('span'));
                span.className = 'autopagerize_page_info';
                var a = span.appendChild(document.createElement('a'));
                a.className = 'autopagerize_link';
                a.href = loaded_url && (loaded_url.indexOf('http') === 0 || ~loaded_url.indexOf('/') || ~loaded_url.indexOf('.'))  ? loaded_url : 'javascript:void(0)';
                a.setAttribute('number', document.apwpagenumber);
                if (title.length) a.setAttribute('title', title);

                content_parent.insertBefore(root, content_last);
            }

            //var height = document_height();
            var fix_links = options.FORCE_ABSOLUTE_HREFS || options.FORCE_TARGET_WINDOW,
                fix_imgs = options.FORCE_ABSOLUTE_IMG_SRCS || options.TRY_CORRECT_LAZY,
                force_target = options.FORCE_TARGET_WINDOW;

            var fragment = document.createDocumentFragment();
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
            for (var n = last_prev.nextSibling; n; n = n.nextSibling ) {
                if (n === content_last) break;
                if (n.nodeType !== 1) continue;
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

            // This is bugged because if page has only one big image (with no direct dimensions mentioned in either style or height attribute) 
            // and it's not yet loaded it'll be 0 in both scroll and client heights when the check is performed. So either this be disabled or optional.
            //if (height === document_height())
            //    return dispatch_event('AutoPatchWork.terminated', { message: 'new page has zero height' });

            nodes = null;

            if (change_location && loaded_url && loaded_url.length) {
                downloaded_pages.push(loaded_url);
                if (title.length > 2) 
                    page_titles.push(title);
            }
            status.load_count++;
            setTimeout(function(){dispatch_event('AutoPatchWork.pageloaded');}, get_load_delay());
        }
        /* Calculates delay before next page loading. */
        function get_load_delay() {
            var current_delay =  options.BASE_INTERPAGE_DELAY + Math.abs((new Date().getTime()) - status.load_start_time),
                  smooth = status.load_count < 11 ? 1 - (1/ status.load_count) : -1.0;

            if (smooth >= 0 && Math.abs(current_delay - status.load_delay) < 2000 && current_delay < 4000) {
                status.load_delay = Math.ceil((current_delay * smooth + status.load_delay * (1.0 - smooth))/100)*100;
                //log('Next delay will be: ' + status.load_delay + '; real delay: ' + current_delay);
            }

            return status.load_delay;
        }
        /* Sets status bar to ready state. */
        function pageloaded() {
            state_loaded();
            /*///////////////////
            dispatch_notify_event({
                extension: 'autopatchwork',
                text: 'Page ' + document.apwpagenumber + ' loaded...',
                width: '200px'
            });
            ///////////////////*/
            //if (status.bottom) status.bottom.style.height = rootNode.scrollHeight + 'px';
            verify_scroll();
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
            return doc.querySelector(path);
        }
        /**
         * Evaluates XPath to find node containing next page link.
         * @param {Node} doc Node to perform XPath search on.
         * @return {Node} Matched node.
         * */
        function get_node_xpath(doc, path) {
            return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        /**
         * Evaluates expression to find node containing next page link.
         * @param {Node} doc Node to perform search on.
         * @return {Node} Matched node.
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
         * @param {Node} doc Node to perform search on.
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
        function calc_remaining_height() {
            var rect = null, bottom = null, _point = status.content_last;
            while (_point) {
                if (typeof _point.getBoundingClientRect === 'function') {
                    rect = _point.getBoundingClientRect();
                    if (rect && !(rect.top === 0 && rect.right === 0 && rect.bottom === 0 && rect.left === 0)) break;
                    else rect = null;
                } else break;
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
            return rootNode.scrollHeight - bottom + options.BASE_REMAINING_HEIGHT;
        }
    }
})(this, window.XPathResult, window.XMLHttpRequest, window.Node, window.history, window.location, window.sessionStorage);