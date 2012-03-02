// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude chrome:*
// @exclude about:*
// @exclude widget:*
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// ==/UserScript==

/* 
 * Normal AutoPatchWork event flow:
 *  AutoPatchWork.init - we are on some site, requestiong siteinfo for it.
 *  AutoPatchWork.siteinfo - got SITEINFOs for the current site.
 *  AutoPatchWork.initialized - initialized APW data.
 *  scroll - got some scrolling on the page.
 *  AutoPatchWork.request - sending request for the next page. 
 *  AutoPatchWork.load - getting new page data and processing it.
 *  AutoPatchWork.append - appending page to the current.
 *  AutoPatchWork.DOMNodeInserted - firing Node changing event.
 *  AutoPatchWork.pageloaded - page loaded successfully.
 *  AutoPatchWork.error - page not loaded, error can be generated on every previous stage. 
 *  AutoPatchWork.terminated - page not loaded, stopping extension.
 *  AutoPatchWork.reset - resetting extension on changes within location.
 * 
 * Service events:
 *  resize - on window resize
 *  AutoPatchWork.state - set statusbar state.
 *  AutoPatchWork.toggle - toggle statusbar state.
*/

(function APW(self, XPathResult, XMLHttpRequest, Node, history, location, sessionStorage) {
    if (window.name === 'autopatchwork-request-iframe') return;

    var browser, debug = false, dump_request = false,
        BROWSER_CHROME = 1,
        BROWSER_SAFARI = 2,
        BROWSER_OPERA = 3;
    var options = {
        BASE_REMAIN_HEIGHT: 400,
        FORCE_TARGET_WINDOW: true,
        DEFAULT_STATE: true,
        TARGET_WINDOW_NAME: '_blank',
        BAR_STATUS: true,
        CHANGE_ADDRESS: false,
        PAGES_TO_KEEP: 5,
        css: ''
    };
    var status = {
        state: true,
        loaded: false,
        ajax_enabled: false,
        scripts_allowed: false,
        separator_disabled: false,
        in_iframe: false,
        page_number: 1,
        nextLink: null,
        nextMask: null,
        nextLinkSelector: null,
        clickLink: null,
        pageElement: null,
        pageElementSelector: null,
        retry_count: 1,
        last_element: null,
        insert_point: null,
        append_point: null,
        bottom: null,
        remain_height: null
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
     * Checks variable and converts string to corresponding boolean.
     * @param {Boolean|String} s Data to check.
     * */
    function s2b(s) { return (s && (s === 'true' || s === true)) ? true : false; }

    // Cute AJAX loader gif.
    if (!window.imgAPWLoader) window.imgAPWLoader = "data:image/gif;base64,R0lGODlhEAALAPQAAP///wAAANra2tDQ0Orq6gYGBgAAAC4uLoKCgmBgYLq6uiIiIkpKSoqKimRkZL6+viYmJgQEBE5OTubm5tjY2PT09Dg4ONzc3PLy8ra2tqCgoMrKyu7u7gAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7AAAAAAAAAAAA";

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
        rootNode = /BackCompat/.test(document.compatMode) ? document.body : document.documentElement,
        isXHTML = document.documentElement.nodeName !== 'HTML' && 
                  document.createElement('p').nodeName !== document.createElement('P').nodeName;
    document.apwpagenumber = 1;

    // Begin listening for SITEINFO messages and send reset event if got one while active
    window.addEventListener('AutoPatchWork.siteinfo', siteinfo, false);
    
    sendRequest({ url: location.href, isFrame: window.top !== window.self }, init, 'AutoPatchWork.init' );

    window.addEventListener('hashchange', function (e) {
        if (window.AutoPatchWorked && AutoPatchWorked.siteinfo) {
            var first_element = (AutoPatchWorked.get_main_content(document) || [])[0];
            var status = AutoPatchWorked.status;
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
     * Will be replaced by AutoPatchWork function later.
     * @param {Object} info Contains APW paramenters.
     * */
    function init(info) {
        matched_siteinfo = info.siteinfo;
        if (info.config) {
            options.BASE_REMAIN_HEIGHT = info.config.remain_height;
            options.DEFAULT_STATE = info.config.auto_start;
            options.FORCE_TARGET_WINDOW = info.config.target_blank;
            options.CHANGE_ADDRESS = info.config.change_address;
            options.BAR_STATUS = info.config.bar_status;
            options.css = info.css;
            debug = info.config.debug_mode;
        }
        var fails = [];
        var ready = info.siteinfo.some(function (s) {
            return AutoPatchWork(s) || (fails.push(s), false);
        });
        (ready === false) && sendRequest({ failed_siteinfo: fails });
    }
    /** 
     * Event handler for receiving SITEINFO.
     * @param {Event} evt Event data.
     * */
    function siteinfo(evt) {
        if (evt.siteinfo && !window.AutoPatchWorked) {
            AutoPatchWork(evt.siteinfo);
        } else if (evt.siteinfo) {
            var ev = document.createEvent('Event');
            ev.initEvent('AutoPatchWork.reset', true, true);
            for (var k in evt.siteinfo) {
                ev[k] = evt.siteinfo[k];
            }
            document.dispatchEvent(ev);
        }
    }
    /** 
     * AutoPatchWork main.
     * @param {Object} SITEINFO structure for the current site.
     * */
    function AutoPatchWork(siteinfo) {
        if (window.AutoPatchWorked) return true;
        if (isXHTML) {
            status.resolver = function () {
                return document.documentElement.namespaceURI;
            };
            get_next_link = x_get_next_link;
            get_main_content = x_get_main_content;
            createHTML = createXHTML;
            siteinfo.nextLink = addDefaultPrefix(siteinfo.nextLink);
            siteinfo.pageElement = addDefaultPrefix(siteinfo.pageElement);
        }

        var location_href = location.href,
            loading = false,
            scroll = false,
            nextLink = status.nextLink = siteinfo.nextLink,
            nextLinkSelector = status.nextLinkSelector = siteinfo.nextLinkSelector,
            pageElementSelector = status.pageElementSelector = siteinfo.pageElementSelector,
            pageElement = status.pageElement = siteinfo.pageElement,
            disableSeparator = status.separator_disabled = s2b(siteinfo.disableSeparator),
            clickLink = status.clickLink = (siteinfo.clickLink || null),
            retryCount = status.retry_count = (siteinfo.retryCount || 1),
            nextMask = status.nextMask = (siteinfo.nextMask || null),
            allowScripts = status.scripts_allowed = s2b(siteinfo.allowScripts),
            //useAjax = status.ajax_enabled = s2b(siteinfo.useAjax),
            forceIframe = status.in_iframe = s2b(siteinfo.forceIframe),
            changeAddress = siteinfo.forceAddressChange ? s2b(siteinfo.forceAddressChange) : options.CHANGE_ADDRESS;

        if (status.nextMask) {
            var arr = status.nextMask.split('|'),
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

        if (!siteinfo.MICROFORMAT) log('detected SITEINFO = ' + JSON.stringify(siteinfo, null, 4));

        var next = get_next_link(document);
        if (!get_node_href(next)) {
            if (siteinfo.MICROFORMAT) return;
            return log('next link ' + nextLink + ' not found.');
        }

        var page_elements = get_main_content(document);
        if (!page_elements.length) {
            if (siteinfo.MICROFORMAT) return;
            return log('page content like ' + pageElement + ' not found.');
        }

        if (history.replaceState) {
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
        if (/^http:\/\/(www|images)\.google\.(?:[^.]+\.)?[^.\/]+\/images\?./.test(location.href)) {
            request = request_iframe;
            forceIframe = status.in_iframe = true;
        }
        else if ('www.tumblr.com' === location.host) {
            allowScripts = true;
        } 
        else if ('matome.naver.jp' === location.host) {
            var _get_next = get_next_link;
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
            next = get_next_link(document);
        }       
        else if ((next.host && next.host !== location.host) || 
            (next.protocol && next.protocol !== location.protocol) ||
            forceIframe ){
                request = request_iframe;
        }
        
        if (allowScripts) {
            script_filter = dont_filter;
        }

        var first_element = status.first_element = page_elements[0],
            last_element = status.last_element = page_elements.pop(),
            insert_point = status.insert_point = last_element.nextSibling,
            append_point = status.append_point = last_element.parentNode;
        
        var htmlDoc, url,
            loaded_urls = {},
            location_pushed = false,
            session_object = {};

        loaded_urls[location.href] = true;
        loaded_urls[get_node_href(next)] = true;
        status.remain_height || (status.remain_height = calc_remain_height());

        window.addEventListener('scroll', check_scroll, false);
        window.addEventListener('resize', check_scroll, false);
        window.addEventListener('AutoPatchWork.request', request, false);
        window.addEventListener('AutoPatchWork.load', load, false);
        window.addEventListener('AutoPatchWork.append', append, false);
        if (changeAddress) window.addEventListener('AutoPatchWork.append', change_address, false);
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

        window.addEventListener('AutoPatchWork.pageloaded', forceIframe ? pageloaded_iframe : pageloaded, false);

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
            function _toggle() {
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
            img.src = window.imgAPWLoader;
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
            Object.keys(evt.siteinfo).forEach(function (k) {
                status[k] = evt.siteinfo[k];
            });
            document.apwpagenumber = 1;
            window.removeEventListener('scroll', check_scroll, false);
            window.removeEventListener('AutoPatchWork.request', request, false);
            window.removeEventListener('AutoPatchWork.load', load, false);
            window.removeEventListener('AutoPatchWork.append', append, false);
            if (changeAddress) window.removeEventListener('AutoPatchWork.append', change_address, false);
            window.removeEventListener('AutoPatchWork.error', error_event, false);
            window.removeEventListener('AutoPatchWork.reset', reset, false);
            window.removeEventListener('AutoPatchWork.DOMNodeInserted', target_rewrite, false);
            window.removeEventListener('AutoPatchWork.DOMNodeInserted', restore_setup, false);
            window.removeEventListener('AutoPatchWork.state', state, false);
            if (forceIframe) {
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
            AutoPatchWork({ nextLink: status.nextLink, pageElement: status.pageElement, forceIframe: (status.forceIframe || false) });
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
            switch (evt.status) {
            case 'on':
                state_on();
                break;
            case 'off':
                state_off();
                break;
            }
        }
        /** 
         * Toggles statusbar state. */
        function toggle() {
            status.state ? state_off() : state_on();
        }
        /** 
         * Termination event handler. 
         * Stops scroll processing and removes statusbar.
         * @param {Event} evt Event data. 
         * */
        function terminated(evt) {
            status.state = false;
            window.removeEventListener('scroll', check_scroll, false);
            
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
            if (status.bottom && status.bottom.parentNode) {
                status.bottom.parentNode.removeChild(status.bottom);
            }
        }
        /** 
         * Error handler. 
         * Stops scroll processing prints error, sets error statusbar.
         * */
        function error(message) {
            status.state = false;
            window.removeEventListener('scroll', check_scroll, false);
            if (status.bottom && status.bottom.parentNode) {
                status.bottom.parentNode.removeChild(status.bottom);
            }
            bar && (bar.className = 'autopager_error');
            log(message);
            return false;
        }
        /** 
         * Dispatches standard event on the document.
         * @param {String} type Event name string.
         * @param {Array} opt Array of event's parameters.
         * */
        function dispatch_event(type, opt) {
            var ev = document.createEvent('Event');
            ev.initEvent(type, true, false);
            if (opt) {
                Object.keys(opt).forEach(function (k) {
                    if (!ev[k]) {
                        ev[k] = opt[k];
                    }
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
            with(opt) {
                mue.initMutationEvent(eventName, bubbles, cancelable, relatedNode, prevValue, newValue, attrName, attrChange);
                targetNode.dispatchEvent(mue);
            }
        }
        /**
         * Dispatches custom notification event on the document node.
         * @param {Object} opt Object of event's message data.
         * */
        function dispatch_notify_event(opt) {
            var noe = document.createEvent('CustomEvent');
            noe.initCustomEvent('Notify.It', false, false, opt);
            document.dispatchEvent(noe);
        }
        /** 
         * Checks if document is scrolled enough to begin loading next page 
         * and dispatches event for a new page request.
         * */
        function check_scroll() {
            if (loading || !status.state) return;
            if ((rootNode.scrollHeight - window.innerHeight - window.pageYOffset) < status.remain_height) {
                if (bar) bar.className = 'autopager_loading';
                loading = true;
                dispatch_event('AutoPatchWork.request');
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
                    if (_a && !/^javascript:/.test(_a) && !/^#/.test(_a) && !a.target) {
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
        function request() {
            loading = true;
            var url = state.nextURL = get_node_href(next);
            //log('requesting ' + url);
            if (!url) {
                // we shouldn't be here
                dispatch_event('AutoPatchWork.error', { message: 'Invalid next link requested' });
                return;
            }

            // TODO:
            // If AJAX -> 'POST' -> load -> AutoPatchWork.load
            // New request_ func:
            // If button auto-click -> click and return -> delay or wait for DOMNodeInserted
            //  => AutoPatchWork.pageloaded

            var req = 'GET';
            var x = new XMLHttpRequest();
            x.onload = function () {
                if (dump_request) console.log(x.responseText);
                dispatch_event('AutoPatchWork.load', { response: x, url: url });
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
            x.send(null);
        }
        /* Requests next page via IFRAME load method. */
        function request_iframe() {
            loading = true;
            var url = state.nextURL = get_node_href(next);
            //log('requesting ' + url);
            if (!url) {
                // we shouldn't be here
                dispatch_event('AutoPatchWork.error', { message: 'Invalid next link requested' });
                return;
            }
            var iframe = document.createElement('iframe');
            //iframe.style.display = 'none';
            iframe.setAttribute('style', 'display: none !important;'); //failsafe
            iframe.id = iframe.name = 'autopatchwork-request-iframe';
            iframe.onload = function () {
                var doc = iframe.contentDocument;
                if (dump_request) console.log(doc.innerHTML);
                dispatch_event('AutoPatchWork.load', { htmlDoc: doc, url: url });
                iframe.parentNode && iframe.parentNode.removeChild(iframe);
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
        function get_node_href(node) {
            if (!node) return null;
            if (typeof node.getAttribute == 'function' && node.getAttribute('href')) return node.getAttribute('href');
            return node.href || node.action || node.value;
        }
        /** 
         * Removes scripts from a page text.
         * @param {String} text The input string.
         * */
        function script_filter(text) {
            return text.replace(/<script(?:[ \t\r\n][^>]*)?>[\S\s]*?<\/script[ \t\r\n]*>/gi, ' ');
        }
        /** 
         * Returns page text as it is.
         * @param {String} text The input string.
         * */
        function dont_filter(text) {
            return text;
        }
        /** 
         * [test] Evaluates included scripts.
         * @param {Node} node Node to run scripts of.
         * */
        /*function eval_scripts(node){
            if (!node) return;

            var st = node.getElementsByTagName('SCRIPT');
            var strExec;

            for (var i = 0; i < st.length; i++) {
                strExec = st[i].text;
                //st[i].parentNode.removeChild(st[i]);
                st[i].text = '';

                try {
                    var x = document.createElement('script');
                    x.type = 'text/javascript';
                    x.innerHTML = strExec;
                   
                    document.getElementsByTagName('head')[0].appendChild(x);
                } 
                catch (bug) {}
            }
        };*/
        /** 
         * Event hadler for parsing new page data.
         * @param {Event} evt Event data.
         * */
        function load(evt) {
            loading = false;
            if (!evt.response && !evt.htmlDoc) return;
            loaded_url = evt.url;
            //log('loaded ' + loaded_url);
            
            if (evt.response) {
                htmlDoc = createHTML(script_filter(evt.response.responseText), evt.url);
            } else if (evt.htmlDoc) {
                htmlDoc = evt.htmlDoc;
            } else {
                return;
            }
            status.loaded = true;
            if (!options.FORCE_TARGET_WINDOW) {
                if (evt.response) {
                    saveText(loaded_url, document.apwpagenumber, evt.response.responseText);
                } else if (evt.htmlDoc) {
                    saveText(loaded_url, document.apwpagenumber, htmlDoc.outerHTML || htmlDoc.documentElement.outerHTML);
                }
            }
            dispatch_event('AutoPatchWork.append');
        }
        /** 
         * Event handler for browser location rewriting on each new page.
         * @param {Event} evt Event data.
         * */
        function change_address(evt) {
            if (!location_pushed) {
                location_pushed = true;
                history.pushState('', '', location.href);
            }
            history.replaceState('', '', loaded_url);
        }
        /** 
         * Event handler for appending new pages.
         * @param {Event} evt Event data.
         * */
        function append(evt) {
            if (!status.loaded || !htmlDoc) return;

            var insert_point = status.insert_point,
                append_point = status.append_point;
            
            status.loaded = false;
            status.page_number++
            document.apwpagenumber++;
            
            /*if (document.apwpagenumber % options.PAGES_TO_KEEP === 0 && document.apwpagenumber > 3) { //
                // TODO:
                    move to initialisation
                    fix scrolling
                var i, sel = [];
                for (i = 1; i < options.PAGES_TO_KEEP; i++) {
                    sel.push('[apw-page="' + (document.apwpagenumber - i) + '"]');
                }
                var nodes = document.querySelectorAll(sel.join(','));
                for (i = 0; i < nodes.length; i++) {
                    nodes[i].parentNode.removeChild(nodes[i]);
                }
            }*/

            var nodes = get_main_content(htmlDoc),
                //first = nodes[0],
                title = htmlDoc.querySelector('title') ? htmlDoc.querySelector('title').textContent.trim() : '';
                
            next = get_next_link(htmlDoc);

            htmlDoc = null;
            if (!nodes.length) {
                dispatch_event('AutoPatchWork.error', { message: 'page content like ' + pageElement + ' not found.' });
                return;
            }

            if (!status.separator_disabled) {
                // Checking where to add new content. 
                // In case of table we'll add inside it, otherwise after.
                var root, node;
                if (/^tbody$/i.test(append_point.localName)) {
                    var colNodes = document.evaluate('child::tr[1]/child::*[self::td or self::th]', append_point, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    var colums = 0;
                    for (var i = 0, l = colNodes.snapshotLength; i < l; i++) {
                        var col = colNodes.snapshotItem(i).getAttribute('colspan');
                        colums += parseInt(col, 10) || 1;
                    }
                    node = document.createElement('td');
                    root = document.createElement('tr');
                    node.setAttribute('colspan', colums);
                    root.appendChild(node);
                } else {
                    root = node = document.createElement('div');
                }

                // Adding page separator.
                node.className = 'autopagerize_page_separator_blocks';
                node.setAttribute('apw-page', document.apwpagenumber);
                var h4 = node.appendChild(document.createElement('h4'));
                h4.className = 'autopagerize_page_separator';
                var span = h4.appendChild(document.createElement('span'));
                span.className = 'autopagerize_page_info';
                var a = span.appendChild(document.createElement('a'));
                a.className = 'autopagerize_link';
                a.href = loaded_url;
                a.setAttribute('number', document.apwpagenumber);
                if (title !== '') a.setAttribute('title', title);
    
                append_point.insertBefore(root, insert_point);
            }
            
            // Firing node change event on each target node
            nodes.forEach(function (element, i, nodes) {
                var insert_node = append_point.insertBefore(document.importNode(element, true), insert_point);
                if (insert_node && typeof insert_node.setAttribute == 'function') {
                    // service data for external page processing
                    insert_node['apw-data-url'] = loaded_url;
                    insert_node.setAttribute('apw-page', document.apwpagenumber);
                }
                var mutation = {
                    targetNode: insert_node,
                    eventName: 'AutoPatchWork.DOMNodeInserted',
                    bubbles: true,
                    cancelable: false,
                    relatedNode: append_point,
                    prevValue: null,
                    newValue: loaded_url,
                    attrName: 'url',
                    attrChange: 2 // MutationEvent.ADDITION
                };
                dispatch_mutation_event(mutation);
                //nodes[i] = insert_node;
            });
            nodes = null;
            dispatch_event('AutoPatchWork.pageloaded');

            if (status.bottom) status.bottom.style.height = rootNode.scrollHeight + 'px';

            if (!next) {
                return dispatch_event('AutoPatchWork.terminated', { message: 'next page link not found.' });
            } else {
                next_href = get_node_href(next);
                if (next_href && !loaded_urls[next_href]) {
                    loaded_urls[next_href] = true;
                } else {
                    return dispatch_event('AutoPatchWork.error', { message: 'next page ' + next_href + ' already loaded.' });
                }
                //if (status.state) 
                //    setTimeout(function () { check_scroll(); }, 1000);
            }
        }
        /** 
         * Creates XHTML document object from a string.
         * @param {String} str String with XHTML-formatted text.
         * */
        function createXHTML(str) {
            return new DOMParser().parseFromString(str, 'application/xhtml+xml');
        }
        /** 
         * Creates HTML document object from a string.
         * @param {String} str String with HTML-formatted text.
         * @param {String} url String with URL of original page.
         * */
        function createHTML(source, url) {
            // http://gist.github.com/198443
            var doc = document.implementation.createHTMLDocument ? 
                        document.implementation.createHTMLDocument('HTMLParser') : 
                        document.implementation.createDocument(null, 'html', null);
            if (doc.documentElement) {
                doc.documentElement.innerHTML = source;
            } else {
                var range = document.createRange();
                range.selectNodeContents(document.documentElement);
                var fragment = range.createContextualFragment(source);
                var headChildNames = {
                    title: true,
                    meta: true,
                    link: true,
                    script: true,
                    style: true,
                    /*object: true,*/
                    base: true /*,
                    isindex: true,*/
                };
                var child,
                    head = doc.querySelector('head') || doc.createElement('head'),
                    body = doc.querySelector('body') || doc.createElement('body');
                while ((child = fragment.firstChild)) {
                    if ((child.nodeType === Node.ELEMENT_NODE && 
                          !(child.nodeName.toLowerCase() in headChildNames)) || 
                          (child.nodeType === Node.TEXT_NODE && /\S/.test(child.nodeValue))
                        ) break;
                    head.appendChild(child);
                }
                body.appendChild(fragment);
                doc.documentElement.appendChild(head);
                doc.documentElement.appendChild(body);
            }
            return doc;
        }
        /** 
         * Evaluates XPath to find node containing next page link.
         * @param {Node} doc Node to perform XPath search on.
         * @return {Node} Matched node.
         * */
        function get_next_link(doc) {
            if (status.nextLink) {
                return doc.evaluate(status.nextLink, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } else if (status.nextMask) {
                // format link-up-to-page-number|step[|link-after-page-number]
                var arr = status.nextMask.split('|');
                return {href: arr[0] + ((status.page_number + 1) * parseInt(arr[1], 10)) + (arr[2] || '')};
            } else if (status.nextLinkSelector) {
                return doc.querySelectorAll(status.nextLinkSelector);
            }
            return null;
        }
        /** 
         * Evaluates XPath to find nodes containing main page content.
         * @param {Node} doc Node to perform XPath search on.
         * @return {NodeList} Matched nodes.
         * */
        function get_main_content(doc) {
            if (status.pageElement) {
                var r = doc.evaluate(status.pageElement, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
                    l = r.snapshotLength,
                    res = (l && new Array(l)) || [];
                for (var i = 0; i < l; i++) res[i] = r.snapshotItem(i);
                return element_filter(res);
            } else if (status.pageElementSelector) {
                return element_filter(doc.querySelectorAll(status.pageElementSelector));
            }
            return null;
        }
        /** 
         * Evaluates XPath to find node containing next page link in XHTML.
         * @param {Node} doc Node to perform XPath search on.
         * @return {Node} Matched node.
         * */
        function x_get_next_link(doc) {
            return doc.evaluate(status.nextLink, doc, status.resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        /** 
         * Evaluates XPath to find nodes containing main page content in XHTML.
         * @param {Node} doc Node to perform XPath search on.
         * @return {NodeList} Matched nodes.
         * */
        function x_get_main_content(doc) {
            var r = doc.evaluate(status.pageElement, doc, status.resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
                l = r.snapshotLength
                res = (l && new Array(l)) || [];
            for (var i = 0; i < l; i++) res[i] = r.snapshotItem(i);
            return element_filter(res);
        }
        /** 
         * Keeps elements only on the same level the first one in list.
         * @param {NodeList} nodes The nodelist to filter.
         * @return {NodeList} Filtered list.
         * */
        function element_filter(nodes) {
            var first = nodes[0];
            return nodes.filter(function (node) {
                if (first === node || first.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING) return true;
                else return false;
            });
        }
        /* Calculates remaining height when scrolling page. */
        function calc_remain_height() {
            var bottom;
            var _point = insert_point;
            while (_point && !_point.getBoundingClientRect) {
                _point = _point.nextSibling;
            }
            if (_point) {
                var rect = _point.getBoundingClientRect();
                bottom = rect.top + window.pageYOffset;
            } else if (append_point && append_point.getBoundingClientRect) {
                var rect = append_point.getBoundingClientRect();
                bottom = rect.top + rect.height + window.pageYOffset;
            }
            if (!bottom) {
                bottom = Math.round(rootNode.scrollHeight * 0.8);
            }
            return rootNode.scrollHeight - bottom + options.BASE_REMAIN_HEIGHT;
        }
        /** 
         * Adds default prefix to XPath
         * @param {String} xpath XPath to add prefix to.
         * @param {String} prefix Prefix to add.
         * */
        function addDefaultPrefix(xpath, prefix) {
            var tokenPattern = /([A-Za-z_\u00c0-\ufffd][\w\-.\u00b7-\ufffd]*|\*)\s*(::?|\()?|(".*?"|'.*?'|\d+(?:\.\d*)?|\.(?:\.|\d+)?|[\)\]])|(\/\/?|!=|[<>]=?|[\(\[|,=+-])|([@$])/g;
            var TERM = 1,
                OPERATOR = 2,
                MODIFIER = 3;
            var tokenType = OPERATOR;
            prefix += ':';
            /** 
             * Replaces XPath tokens.
             * @param {String} token 
             * @param {String} identifier 
             * @param {String} suffix 
             * @param {String} term 
             * @param {String} operator 
             * @param {String} modifier
             * */
            function replacer(token, identifier, suffix, term, operator, modifier) {
                if (suffix) {
                    tokenType = (suffix == ':' || (suffix == '::' && (identifier == 'attribute' || identifier == 'namespace'))) ? MODIFIER : OPERATOR;
                } else if (identifier) {
                    if (tokenType == OPERATOR && identifier != '*') {
                        token = prefix + token;
                    }
                    tokenType = (tokenType == TERM) ? OPERATOR : TERM;
                } else {
                    tokenType = term ? TERM : operator ? OPERATOR : MODIFIER;
                }
                return token;
            }
            return xpath.replace(tokenPattern, replacer);
        }
    }
})(this, window.XPathResult, window.XMLHttpRequest, window.Node, window.history, window.location, window.sessionStorage);