Object.keys || (Object.keys = function(k) { var r = []; for(var i in k) r.push(i); return r; });
var debug = false, 
    self = this, siteinfo = [], timestamp, site_stats = {}, site_fail_stats = {}, 
    custom_info = {
        "400":{"disabled":true,"length":1},
        "430":{"disabled":true,"length":1},
        "447":{"disabled":true,"length":1},
        "649":{"disabled":true,"length":1},
        "27331":{"disabled":true,"length":1},
        "27333":{"disabled":true,"length":1},
        "39059":{"disabled":true,"length":1},
        "41434":{"disabled":true,"length":1},
        "55771":{"disabled":true,"length":1},
        "65332":{"disabled":true,"length":1},
        "74668":{"disabled":true,"length":1}
    }, /*{}; /* Disabling overzealous formats. Re-enable them manually on your own risk. */
    MICROFORMATs = [],
    ENABLE_STYLISH_FIELD = false,
    ENABLE_MICROFORMATS = false,
    JSON_SITEINFO_DB_MIN = 'http://ss-o.net/json/wedataAutoPagerizeSITEINFO.json',
    JSON_SITEINFO_DB = 'http://ss-o.net/json/wedataAutoPagerize.json';

if (ENABLE_MICROFORMATS) MICROFORMATs = [{
    MICROFORMAT: true,
    url: '^https?://.',
    nextLink: '//a[@rel="next"] | //link[@rel="next"]',
    insertBefore: '//*[contains(concat(" ",@class," "), " autopagerize_insert_before ")]',
    pageElement: '//*[contains(concat(" ",@class," "), " autopagerize_page_element ")]'
}, {
    MICROFORMAT: true,
    url: '^https?://.',
    nextLink: '//link[@rel="next"] | //a[contains(concat(" ",@rel," "), " next ")] | //a[contains(concat(" ",@class," "), " next ")]',
    pageElement: '//*[contains(concat(" ",@class," "), " hfeed ") or contains(concat(" ",@class," "), " story ") or contains(concat(" ",@class," "), " instapaper_body ") or contains(concat(" ",@class," "), " xfolkentry ")]'
}];

var browser_type, 
    BROWSER_CHROME = 1,
    BROWSER_SAFARI = 2,
    BROWSER_OPERA = 3;

if((!!window.chrome && !!window.chrome.runtime) || (typeof InstallTrigger !== 'undefined')) { browser_type = BROWSER_CHROME; if (typeof browser === 'undefined') browser = chrome; }
else if(Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) browser_type = BROWSER_SAFARI;
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

var H = location.href.replace('index.html', '');

window.AutoPatchWorkBG = {
    state: true,
    css: '',
    custom_patterns: [],
    config: {
        auto_start: true,
        target_blank: true,
        remaining_height: 800,
        disable_in_frames: true,
        change_address: false,
        debug_mode: false,
        check_crc: false,
        bar_status: true,
        force_abs_hrefs: false,
        force_abs_srcs: false,
        enable_notifications: false
    },
    save_custom_patterns: function(patterns) {
        storagebase.AutoPatchWorkPatterns = patterns;
        initDatabase();
    },
    reload_database: function() {
        initDatabase();
    },
    reset_custom_patterns: function() {
        AutoPatchWorkBG.custom_patterns = [];
        storagebase.AutoPatchWorkPatterns = '';
    },
    init_css: function(css) {
        if (css && css.replace(/[\s\n]*/, '') !== '') {
            AutoPatchWorkBG.css = storagebase.AutoPatchWorkCSS = css;
        } else {
            storagebase.AutoPatchWorkCSS = AutoPatchWorkBG.css = getCSS();
        }
    },
    update: function() {
        storagebase.AutoPatchWorkConfig = JSON.stringify(AutoPatchWorkBG.config);
    },
    disabled_sites: [],
    blacklist_check: function(url) {
        if(url.indexOf('http') !== 0)
            return true;
        return AutoPatchWorkBG.disabled_sites.some(function(site) {
            if(site.type === 'regexp')
                return new RegExp(site.matcher).test(url);
            else if(site.type === 'prefix')
                return url.indexOf(site.matcher) === 0;
            else if(site.type === 'domain')
                return new RegExp('^https?://' + site.matcher + '/').test(url);
        });
    },
    add_disabled_site: function(site) {
        AutoPatchWorkBG.disabled_sites.push(site);
        storagebase.disabled_sites = JSON.stringify(AutoPatchWorkBG.disabled_sites);
    },
    save_disabled_site: function() {
        storagebase.disabled_sites = JSON.stringify(AutoPatchWorkBG.disabled_sites);
    },
    delete_disabled_site: function(site) {
        var site_s = JSON.stringify(site);
        for(var i = 0; i < AutoPatchWorkBG.disabled_sites.length; i++) {
            var str = JSON.stringify(AutoPatchWorkBG.disabled_sites[i]);
            if(str === site_s) {
                AutoPatchWorkBG.disabled_sites.splice(i, 1);
                storagebase.disabled_sites = JSON.stringify(AutoPatchWorkBG.disabled_sites);
                break;
            }
        }
    }
};

//// main //////

if(browser_type === BROWSER_SAFARI) {
    safari.extension.settings.addEventListener('change', function(evt) {
        if(evt.key in AutoPatchWorkBG.config) {
            AutoPatchWorkBG.config[evt.key] = evt.newValue;
        } else if(evt.key === 'excludes') {
            var urls = evt.newValue.trim().split(' ');
            AutoPatchWorkBG.disabled_sites = urls.map(function(url) {
                return { type: 'prefix', matcher: url };
            });
            AutoPatchWorkBG.save_disabled_site();
        }
    }, false);
}

function getCSS() {
    var url = './css/main.css';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
}

function getWedataId(inf) {
    return parseInt(inf.resource_url ? inf.resource_url.replace('http://wedata.net/items/', '') : '0', 10);
}

function applyCustomFields(info) {
    siteinfo.forEach(function(i) {
        var id = i['wedata.net.id'];
        if (!id) return;
        var ci = custom_info[id];
        if (!ci) return;
        Object.keys(ci).forEach(function(k) { 
            if(typeof ci[k] === 'string' ? ci[k].trim() !== '' : !!ci[k]) i[k] = ci[k]; else delete i[k]; // deletes `insertBefore` in case we null it
        });
    });
}

function checkExists(url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function resetDBLocation (full) {
    if (typeof full === 'undefined' || (typeof full === 'boolean' && !full)) {
        storagebase.removeItem('db_location');
        JSON_SITEINFO_DB_MIN =  'http://ss-o.net/json/wedataAutoPagerizeSITEINFO.json';
    }
    if (typeof full === 'undefined' || (typeof full === 'boolean' && full)) {
        storagebase.removeItem('db_full_location');
        JSON_SITEINFO_DB = 'http://ss-o.net/json/wedataAutoPagerize.json';
    }
}

function updateMiniDatabaseURL(url) {
    storagebase.db_location = url;
    JSON_SITEINFO_DB_MIN = url;
}

function updateFullDatabaseURL(url) {
    storagebase.db_full_location = url;
    JSON_SITEINFO_DB = url;
}

function reimoveUnusedSI() {
    try {
        if (!Store.has('siteinfo_wedata')) throw 'SITEINFO DB expired';
        var data = Store.get('siteinfo_wedata');
        var filtered_siteinfo = data.siteinfo.filter(function(si, i) {
            var id = si['wedata.net.id'];
            if (id && (typeof site_stats[id] === 'undefined' || site_stats[id] < 1)) {
                delete site_fail_stats[id];
                delete site_stats[id];
                return false;
            }
            return true;
        });
        storagebase.site_stats = JSON.stringify(site_stats);
        storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
        Store.set('siteinfo_wedata', {
            siteinfo: filtered_siteinfo,
            timestamp: (new Date).toLocaleString()
        }, { day: 90 });
    } catch (bug) {}
}

function initDatabase() {
    if (storagebase.db_location) JSON_SITEINFO_DB_MIN = storagebase.db_location;
    if (storagebase.db_full_location) JSON_SITEINFO_DB = storagebase.db_full_location;
    if (storagebase.custom_info) custom_info = JSON.parse(storagebase.custom_info);
    if (storagebase.AutoPatchWorkPatterns) AutoPatchWorkBG.custom_patterns = JSON.parse(storagebase.AutoPatchWorkPatterns);
    try {
        if(!Store.has('siteinfo_wedata')) throw 'SITEINFO DB expired';
        var data = Store.get('siteinfo_wedata');
        siteinfo = data.siteinfo;
        timestamp = new Date(data.timestamp);
        applyCustomFields();
        siteinfo.unshift.apply(siteinfo, AutoPatchWorkBG.custom_patterns);
    } catch (bug) {
        downloadDatabase();
    }
}

function createDatabase(info) {
    var tmp_log = 'There were following errors in SITEINFO DB:\n',
        allowed_fields = ['nextLink', 'pageElement', 'url', 'insertBefore'],
        is_default_db = !!~JSON_SITEINFO_DB_MIN.indexOf('ss-o.net');

    siteinfo = [];
    if (ENABLE_STYLISH_FIELD) allowed_fields.push('cssPatch');

    info.forEach(function(i) {
        var d = i.data || i, r = {};
        if (ENABLE_STYLISH_FIELD && d) {
            var t = null;
            if (typeof d['Stylish'] === 'string' && d['Stylish'].replace(/\s/g,'').length > 5) t = d['Stylish']; // Stylish CSS
            else if (typeof d['cssPatch'] === 'string' && d['cssPatch'].replace(/\s/g,'').length > 5) t = d['cssPatch']; // Plain CSS
            delete d['cssPatch'];
            if (t && !t.match(/\burl[^\(\{]*\(/ig)) {
                d['cssPatch'] = (t.match(/@-moz-document[^{]+{\s*([^@\}]+)\s*}/) || [])[1] || t; // Stylish CSS -> Plain CSS
            }
        }
        allowed_fields.forEach(function(k) {
            if(!d[k]) return;
            if (is_default_db) d[k] = d[k].replace(/\s*\b(rn)+$/g,''); //server bug?
            r[k] = d[k];
        });
        r['wedata.net.id'] = i['wedata.net.id'] || getWedataId(i);
        try { new RegExp(r.url); } catch (bug) { 
        	tmp_log += '[' + r['wedata.net.id'] + '] Invalid url RegExp ' + r.url + ': ' +  (bug.message || bug) + '\n'; 
            return;
        }
        try { document.evaluate(r.nextLink, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); } catch (bug) { 
            tmp_log += '[' + r['wedata.net.id'] + '] Invalid next XPath '  + r.nextLink + ': ' +  (bug.message || bug) + '\n'; 
            return;
        }
        try { document.evaluate(r.pageElement, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); } catch (bug)  { 
            tmp_log += '[' + r['wedata.net.id'] + '] Invalid content XPath '  + r.pageElement + ': ' + (bug.message || bug) + '\n'; 
            return;
        }
        siteinfo.push(r);
    });
    log(tmp_log);
    siteinfo.sort(function(a, b) { return (b.url.length - a.url.length); });
    siteinfo.push.apply(siteinfo, MICROFORMATs);

    timestamp = new Date;
    Store.set('siteinfo_wedata', {
            siteinfo: siteinfo,
            timestamp: timestamp.toLocaleString()
        },{ day: 60 });
    applyCustomFields();
    siteinfo.unshift.apply(siteinfo, AutoPatchWorkBG.custom_patterns);
}

function downloadDatabase(callback, error_back) {
    var xhr = new XMLHttpRequest();
    siteinfo = [];
    xhr.onload = function() {
        var info;
        try {
            info = JSON.parse(xhr.responseText);
            createDatabase(info);
            if (typeof callback === 'function') {
                callback();
            }
        } catch (bug) {
            if (typeof error_back === 'function') {
                error_back(bug);
                return;
            } else {
                throw bug;
            }
        }
    };
    xhr.onerror = function(err) {
        if( typeof error_back === 'function') {
            error_back(err);
        }
    };
    try {
       xhr.open('GET', JSON_SITEINFO_DB_MIN, true);
       xhr.send(null);
   } catch (bug) { 
       log(bug.message || bug);
   }
}

function resetSettings() {
    if (typeof storagebase === 'undefined') {
        return setTimeout(function() { resetSettings(); }, 200);
    }
    resetDBLocation();
    storagebase.disabled_sites = JSON.stringify(AutoPatchWorkBG.disabled_sites);
    storagebase.AutoPatchWorkConfig = JSON.stringify(AutoPatchWorkBG.config);
    storagebase.site_stats = JSON.stringify(site_stats);
    storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
    storagebase.custom_info = JSON.stringify(custom_info);
    AutoPatchWorkBG.init_css();
    AutoPatchWorkBG.reset_custom_patterns();
}

if (!storagebase.AutoPatchWorkConfig) resetSettings();

if(storagebase.disabled_sites) AutoPatchWorkBG.disabled_sites = JSON.parse(storagebase.disabled_sites);
if(storagebase.AutoPatchWorkConfig) {
    AutoPatchWorkBG.config = JSON.parse(storagebase.AutoPatchWorkConfig);
    debug = AutoPatchWorkBG.config.debug_mode;
}
if(storagebase.site_stats) site_stats = JSON.parse(storagebase.site_stats);
if(storagebase.site_fail_stats) site_fail_stats = JSON.parse(storagebase.site_fail_stats);
if(storagebase.AutoPatchWorkCSS) AutoPatchWorkBG.css = storagebase.AutoPatchWorkCSS;

var version = '', manifest, IconData = {};
function getManifest(callback) {
    var url = './manifest.json';
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        callback(JSON.parse(xhr.responseText));
    };
    xhr.open('GET', url += ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime(), true);
    xhr.send(null);
}

getManifest(function(_manifest) { manifest = _manifest; version = _manifest.version; });

initDatabase();

window.onload = function() {
    if (1 || browser_type !== BROWSER_CHROME) return;
    var CHROME_GESTURES = 'jpkfjicglakibpenojifdiepckckakgk';
    var CHROME_KEYCONFIG = 'okneonigbfnolfkmfgjmaeniipdjkgkl';
    var action = {
        group: 'AutoPatchWork',
        actions: [{ name: 'AutoPatchWork.toggle' }, { name: 'AutoPatchWork.request' }]
    };
    browser.runtime.sendMessage(CHROME_GESTURES, action);
    browser.runtime.sendMessage(CHROME_KEYCONFIG, action);
};

var toggleCode = '(' + (function() {
    var ev = new window.CustomEvent('AutoPatchWork.toggle');
    document.dispatchEvent(ev);
}).toString() + ')();';

switch(browser_type) {
    case BROWSER_CHROME:
            browser.runtime.onMessage.addListener(handleMessage);
            break;
    case BROWSER_SAFARI:
        safari.application.addEventListener("message", function(evt) {
            var name = evt.name;
            if(name === 'option_init') {
                evt.target.page.dispatchMessage(name, AutoPatchWorkBG);
            } else if(name === 'invoke_action') {
                if(evt.message.action === 'update') {
                    AutoPatchWorkBG.config = evt.message.config;
                    AutoPatchWorkBG.update();
                } else if(evt.message.action === 'save_disabled_site') {
                    AutoPatchWorkBG.disabled_sites = evt.message.disabled_sites;
                    AutoPatchWorkBG.save_disabled_site();
                } else if(evt.message.action === 'downloadDatabase') {
                    downloadDatabase(function() {
                        evt.target.page.dispatchMessage('updated_siteinfo');
                    });
                } else {
                    AutoPatchWorkBG[evt.message.action].apply(AutoPatchWorkBG, evt.message.args);
                }
            } else if(name === 'siteinfo_init') {
                evt.target.page.dispatchMessage(name, {
                    siteinfo: siteinfo,
                    custom_info: custom_info,
                    site_stats: site_stats,
                    site_fail_stats: site_fail_stats,
                    AutoPatchWorkBG: AutoPatchWorkBG
                });
            } else {
                try {
                    handleMessage(evt.message, {}, function(data) {
                        evt.target.page.dispatchMessage(name, data);
                    });
                } catch (bug) {}
            }
        }, false);
        break;
    case BROWSER_OPERA:
        self.opera.extension.onmessage = function(evt) {
            var name = evt.data.name;
            var message = evt.data.data;
            if (!evt.source && name !== 'invoke_action') return;
            switch(name) {
                case 'option_init': // WTF??
                    evt.source.postMessage({
                        name: name,
                        data: JSON.parse(JSON.stringify(AutoPatchWorkBG))
                    });
                    break;
                case 'siteinfo_init':
                    evt.source.postMessage({
                        name: name,
                        data: {
                            siteinfo: siteinfo,
                            custom_info: custom_info,
                            site_stats: site_stats,
                            site_fail_stats: site_fail_stats,
                            AutoPatchWorkBG: JSON.parse(JSON.stringify(AutoPatchWorkBG))
                        }
                    });
                    break;
                case 'invoke_action':
                    switch(message.action) {
                        case 'update':
                            AutoPatchWorkBG.config = message.config;
                            AutoPatchWorkBG.update();
                            break;
                        case 'save_disabled_site':
                            AutoPatchWorkBG.disabled_sites = message.disabled_sites;
                            AutoPatchWorkBG.save_disabled_site();
                            break;
                        case 'download_database':
                            downloadDatabase(function() { evt.source.postMessage({ name: 'updated_siteinfo' }); });
                            break;
                        default:
                            AutoPatchWorkBG[message.action].apply(AutoPatchWorkBG, message.args);
                    }
                    break;
                default:
                    try {
                        handleMessage(message, {}, function(data) {
                            evt.source.postMessage({ name: name, data: data });
                        });
                    } catch (bug) {}
            }
        };
}

function handleMessage(request, sender, sendResponse) {
    if(request.message === 'AutoPatchWork.initialized') {
        var id = request.siteinfo['wedata.net.id'] || 'microformats';
        site_stats[id] = ++site_stats[id] || 1;
        storagebase.site_stats = JSON.stringify(site_stats);
        return;
    }
    
    if(request.failed_siteinfo) {
        request.failed_siteinfo.forEach(function(s) {
            var id = s['wedata.net.id'];
            if(!id) return;
            site_fail_stats[id] = ++site_fail_stats[id] || 1;
        });
        storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
        return;
    }

    if(request.pause) {
        if (typeof request.id === 'number' && request.id !== -1) {
            var len = siteinfo.length;
            function set_pause (id, val) {
                for (var i = 0; i < len; i++)
                    if (siteinfo[i]['wedata.net.id']  === id) {
                        siteinfo[i].pause = val;
                        break;
                    }
            }
            if (request.pause === 'off') {
                set_pause(request.id, false);
            } else if (request.pause === 'on') {
                set_pause(request.id, true);
            }
        }
        return;
    }
    
    if(request.manage) {
        if (request.hash) openOrFocusTab('siteinfo_manager.html#siteinfo_search_input='+request.hash);
        else openOrFocusTab('siteinfo_manager.html');
        return;
    }
    
    if(request.options) {
        openOrFocusTab('options.html');
        return;
    }
    
    if(!AutoPatchWorkBG.state || (request.isFrame && AutoPatchWorkBG.config.disable_in_frames))
        return;

    var infos = [], url = request.url;

    if(!url || AutoPatchWorkBG.blacklist_check(url) || url.index)
        return;

    for(var i = 0, len = siteinfo.length, s; i < len; i++) {
        s = siteinfo[i];
        try {
            if(!s.disabled && (new RegExp(siteinfo[i].url)).test(url)) {
                delete s.length;
                infos.push(s);
            }
        } catch (bug) { log((bug.message || bug) + ' ' + siteinfo[i].url); }
    }

    sendResponse({ siteinfo: infos, config: AutoPatchWorkBG.config, css: AutoPatchWorkBG.css });
}

function openOrFocusTab(uri) {
    switch (browser_type) {
        case BROWSER_CHROME:
            browser.windows.getAll({ populate: true}, function(windows) {
                if (!windows.some(function(w) {
                    if (w.type === 'normal') {
                        return w.tabs.some(function(t) {
                            if (t.url === H + uri) {
                                browser.tabs.update(t.id, { 'selected': true });
                                return true;
                            }
                        });
                    }
                })) { browser.tabs.query({active: true}, function(t) {
                        browser.tabs.create({ 'url': uri, index: (t[0] ? t[0].index : 0) + 1 });
                    });
                }
            });
            break;
        case BROWSER_SAFARI:
            if(!safari.application.browserWindows.some(function(w) {
                return w.tabs.some(function(t) {
                    if(t.url.indexOf(H + uri) === 0) {
                        t.activate();
                        return true;
                    }
                });
            })) { safari.application.activeBrowserWindow.openTab().url = H + uri; }
            break;
        case BROWSER_OPERA:
            opera.extension.tabs.create({ url: uri, focused: true });
            break;
    }
}