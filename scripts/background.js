var siteinfo = [], custom_info = {}, timestamp, site_stats = {}, site_fail_stats = {},
    H = location.href.replace('index.html', ''),
    MICROFORMATs = [{
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
    }],
    JSON_SITEINFO_DB_MIN = 'http://wedata.net/databases/AutoPagerize/items.json', // 'http://os0x.heteml.jp/json/wedataAutoPagerizeSITEINFO.json',
    JSON_SITEINFO_DB = 'http://wedata.net/databases/AutoPagerize/items.json', //'http://os0x.heteml.jp/json/wedataAutoPagerize.json',
    DAYS_TO_KEEP_DB = 60,
    BLOCK_GENERICS = false,
    BLOCK_MICROFORMATS = true;

if (BLOCK_GENERICS) {
    custom_info = { /* Disabling overzealous formats. Re-enable them manually on your own risk. */
        '400':{'disabled':true,'length':1},
        '430':{'disabled':true,'length':1},
        '447':{'disabled':true,'length':1},
        '649':{'disabled':true,'length':1},
        '27331':{'disabled':true,'length':1},
        '27333':{'disabled':true,'length':1},
        '39059':{'disabled':true,'length':1},
        '41434':{'disabled':true,'length':1},
        '55771':{'disabled':true,'length':1},
        '65332':{'disabled':true,'length':1},
        '74668':{'disabled':true,'length':1}
    };
}

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
        check_hash: false,
        bar_status: true,
        force_abs_hrefs: false,
        force_abs_srcs: false,
        enable_notifications: false,
        cleanup_on_load: false,
        allow_ext_styles: false,
        try_correct_lazy: true
    },
    save_custom_patterns: function(patterns) {
        storagebase.AutoPatchWorkPatterns = patterns;
        initDatabase();
    },
    reload_database: function() {
        initDatabase();
    },
    reset_custom_patterns: function() {
        resetCustomPatterns();
        initDatabase();
    },
    init_css: function(css) {
        initCSS(css);
    },
    update: function() {
        saveConfig();
    },
    disabled_sites: [],
    blacklist_check: function(url) {
        if (url.indexOf('http') !== 0)
            return true;
        return AutoPatchWorkBG.disabled_sites.some(function(site) {
            if (site.type === 'regexp')
                return new RegExp(site.matcher).test(url);
            else if (site.type === 'prefix')
                return url.indexOf(site.matcher) === 0;
            else if (site.type === 'domain')
                return new RegExp('^https?://' + site.matcher + '/').test(url);
        });
    },
    add_disabled_site: function(site) {
        AutoPatchWorkBG.disabled_sites.push(site);
        saveDisabledSites();
    },
    save_disabled_site: function() {
        saveDisabledSites();
    },
    delete_disabled_site: function(site) {
        var site_s = JSON.stringify(site);
        for (var i = 0, len = AutoPatchWorkBG.disabled_sites.length; i < len; i++) {
            if (JSON.stringify(AutoPatchWorkBG.disabled_sites[i]) === site_s) {
                AutoPatchWorkBG.disabled_sites.splice(i, 1);
                saveDisabledSites();
                break;
            }
        }
    }
};

//// main //////

if(browser_type === BROWSER_SAFARI) {
    safari.extension.settings.addEventListener('change', function(evt) {
        if (evt.key in AutoPatchWorkBG.config) {
            AutoPatchWorkBG.config[evt.key] = evt.newValue;
        } else if (evt.key === 'excludes') {
            var urls = evt.newValue.trim().split(' ');
            AutoPatchWorkBG.disabled_sites = urls.map(function(url) { return { type: 'prefix', matcher: url }; });
            saveDisabledSites();
        }
    }, false);
}

function initCSS(css) {
    if (css && css.replace(/[\s\n]*/, '') !== '') {
        AutoPatchWorkBG.css = storagebase.AutoPatchWorkCSS = css;
    } else {
        getCSS(function(css) {storagebase.AutoPatchWorkCSS = AutoPatchWorkBG.css = css;});
    }
}

function getCSS(callback) {
    var css = 'css/main.css';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', css, true);
    xhr.send(null);
    xhr.onload = function () {
        callback(xhr.responseText);
    };
}

function getWedataId(wditem) {
    return parseInt(wditem.resource_url ? wditem.resource_url.replace('http://wedata.net/items/', '') : '0', 10) || 0;
}

function initCustomPatterns() {
    if (storagebase.AutoPatchWorkPatterns)
        AutoPatchWorkBG.custom_patterns = JSON.parse(storagebase.AutoPatchWorkPatterns);
    applyCustomPatterns();
}

function resetCustomPatterns() {
    AutoPatchWorkBG.custom_patterns = [];
    storagebase.AutoPatchWorkPatterns = '';
}

function applyCustomPatterns() {
    siteinfo.unshift.apply(siteinfo, AutoPatchWorkBG.custom_patterns);
}

function saveDisabledSites() {
    storagebase.disabled_sites = JSON.stringify(AutoPatchWorkBG.disabled_sites);
}

function saveConfig() {
    storagebase.AutoPatchWorkConfig = JSON.stringify(AutoPatchWorkBG.config);
}

function applyMicroformats() {
    if(!BLOCK_MICROFORMATS)
        siteinfo.push.apply(siteinfo, MICROFORMATs);
}

function applyCustomInfo() {
    siteinfo.forEach(function(i) {
        var id = i['wedata.net.id'];
        if (!id) return;
        var ci = getCustomInfo(id);
        if (!ci) return;
        Object.keys(ci).forEach(function(k) {
            if(typeof ci[k] === 'string' ? ci[k].trim() !== '' : !!ci[k]) i[k] = ci[k]; else delete i[k]; // deletes `insertBefore` in case we null it
        });
    });
}

function getCustomInfo(id) {
    return custom_info[id];
}

function removeCustomInfo(id, name) {
    if (typeof custom_info[id] === 'undefined') return;
    //log('removed custom info ('+id+') ['+name+']');
    if (--custom_info[id].length < 1) {
        delete custom_info[id];
    } else {
        if (typeof custom_info[id][name] === 'undefined') return;
        delete custom_info[id][name];
    }
}

function setCustomInfo(id, name, value, default_value) {
    if (typeof custom_info[id] === 'undefined') {
        if (typeof default_value !== 'undefined' && default_value === value)
            return;
        //log('created custom info ('+id+')['+name+'] = '+value);
        custom_info[id] = {};
        custom_info[id][name] = value;
        custom_info[id].length = 1;
    } else {
        if (typeof default_value !== 'undefined' && default_value === value) {
            removeCustomInfo(id, name);
            return;
        }
        if (typeof custom_info[id][name] === 'undefined') {
            //log('created custom info ('+id+')['+name+'] = '+value);
            custom_info[id][name] = value;
            custom_info[id].length++;
        } else {
            //log('set custom info ('+id+')['+name+'] = '+value);
            custom_info[id][name] = value;
        }
    }
}

function saveCustomInfo(new_custom_info) {
    if (typeof new_custom_info !== 'undefined') custom_info = new_custom_info;
    storagebase.custom_info = JSON.stringify(custom_info);
}

function initCustomInfo() {
    if (storagebase.custom_info)
        custom_info = JSON.parse(storagebase.custom_info);
    applyCustomInfo();
}

/* jshint ignore:start */
function checkExists(url, callback) {
    var http = new XMLHttpRequest();
    http.onload = function() {
        callback(http.status < 400);
    };
    http.onerror = function() {
        callback(false);
    };
    http.open('HEAD', url, true);
    http.send();
}
/* jshint ignore:end */

function initDBLocation() {
    if (storagebase.db_location) JSON_SITEINFO_DB_MIN = storagebase.db_location;
    if (storagebase.db_full_location) JSON_SITEINFO_DB = storagebase.db_full_location;
}

function resetDBLocation(full) {
    if (typeof full === 'undefined' || (typeof full === 'boolean' && !full)) {
        storagebase.removeItem('db_location');
        JSON_SITEINFO_DB_MIN =  'http://wedata.net/databases/AutoPagerize/items.json';
    }
    if (typeof full === 'undefined' || (typeof full === 'boolean' && full)) {
        storagebase.removeItem('db_full_location');
        JSON_SITEINFO_DB = 'http://wedata.net/databases/AutoPagerize/items.json';
    }
}

function updateMiniDatabaseURL(url) {
    storagebase.db_location = JSON_SITEINFO_DB_MIN = url;
}

function updateFullDatabaseURL(url) {
    storagebase.db_full_location = JSON_SITEINFO_DB = url;
}

function initDatabase() {
    initDBLocation();
    try {
        if (!Store.has('siteinfo_wedata')) {
            log('SITEINFO DB expired');
            throw new APWException('SITEINFO DB expired');
        }
        var data = Store.get('siteinfo_wedata');
        if (!data || !data.siteinfo) log('No SITEINFO DB present');
        siteinfo = data.siteinfo || [];
        timestamp = new Date(data.timestamp);
        initCustomInfo();
        initCustomPatterns();
        applyMicroformats();
    } catch (bug) {
        downloadDatabase();
    }
}

function createDatabase(info) {
    var tmp_log = 'There were errors in SITEINFO DB:\n',
        allowed_fields = [
            'nextLink',
            'nextLinkSelector',
            'prevLink',
            'prevLinkSelector',
            'pageElement',
            'pageElementSelector',
            'url',
            'insertBefore'
        ],
        allowed_bool_fields = [
            'forceIframe',
            'allowScripts', //this ony influences iframe loading method now
            'disableSeparator'
        ],
        is_sso_db = !!~JSON_SITEINFO_DB_MIN.indexOf('os0x.heteml.jp');

    siteinfo = [];
    if (AutoPatchWorkBG.config.allow_ext_styles) allowed_fields.push('cssPatch');
    var clean = AutoPatchWorkBG.config.cleanup_on_load;

    info.forEach(function(i) {
        var d = i.data || i, r = {}, id = parseInt(i['wedata.net.id'], 10) || getWedataId(i);
        if (AutoPatchWorkBG.config.allow_ext_styles && d) {
            var t = null;
            if (typeof d['Stylish'] === 'string' && d['Stylish'].replace(/\s/g,'').length > 5) t = d['Stylish']; // Stylish CSS
            else if (typeof d['cssPatch'] === 'string' && d['cssPatch'].replace(/\s/g,'').length > 5) t = d['cssPatch']; // Plain CSS
            delete d['cssPatch'];
            if (t && !t.match(/\burl[^\(\{]*\(/i) && !t.match(/\bjavascript\b/i)) {
                d['cssPatch'] = (t.match(/@-moz-document[^{]+{\s*([^@\}]+)\s*}/) || [])[1] || t; // Stylish CSS -> Plain CSS
            }
        }
        allowed_fields.forEach(function(k) {
            if(!d[k] || !d.hasOwnProperty(k)) return;
            if (is_sso_db) d[k] = d[k].replace(/\s*\b(rn)+$/g,''); //server bug?
            r[k] = d[k];
        });
        /*allowed_bool_fields.forEach(function(k) {
            if (info.data.hasOwnProperty(k) && typeof custom_info[id][k] === 'undefined') //don't overwrite existing preset
                setCustomInfo(id, k, s2b(d[k]), false);
        });*/
        r['wedata.net.id'] = id;
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

        if (clean && id && (typeof site_stats[id] === 'undefined' || site_stats[id] < 1)) {
            delete site_fail_stats[id];
            delete site_stats[id];
            return;
        }

        siteinfo.push(r);
    });

    log(tmp_log);

    siteinfo.sort(function(a, b) { return (b.url.length - a.url.length); });

    timestamp = new Date;
    Store.set(
        'siteinfo_wedata', {
            siteinfo: siteinfo,
            timestamp: timestamp.toLocaleString()
        },{ day: DAYS_TO_KEEP_DB }
    );

    initCustomInfo();
    initCustomPatterns();
    applyMicroformats();
}

function downloadDatabase(callback, errorback) {
    var xhr = new XMLHttpRequest();
    siteinfo = [];
    xhr.onload = function() {
        try {
            var info = JSON.parse(xhr.responseText);
            createDatabase(info);
            if (typeof callback === 'function') callback();
        } catch (bug) {
            if (typeof errorback === 'function') return errorback(bug);
            else throw new APWException(bug);
        }
    };
    xhr.onerror = function(err) {
        if (typeof errorback === 'function') errorback(err);
    };
    try {
       xhr.open('GET', JSON_SITEINFO_DB_MIN, true);
       xhr.send(null);
   } catch (bug) {
       log(bug.message || bug);
   }
}

function saveStats() {
    storagebase.site_stats = JSON.stringify(site_stats);
    storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
}

function resetSettings() {
    resetDBLocation();
    resetCustomPatterns();
    saveCustomInfo();
    saveConfig();
    saveDisabledSites();
    saveStats();
    initCSS();
}

/*window.addEventListener('storage', function(e) {
    if (e.key === 'custom_info' && e.oldValue !== e.newValue) applyCustomFields();
});*/

function runExtension() {
    if (typeof storagebase === 'undefined') {
        return setTimeout(function() { runExtension(); }, 200); // wait for storage to load
    }

    if(!storagebase.AutoPatchWorkConfig) resetSettings();

    if(storagebase.disabled_sites) AutoPatchWorkBG.disabled_sites = JSON.parse(storagebase.disabled_sites);
    if(storagebase.AutoPatchWorkConfig) {
        AutoPatchWorkBG.config = JSON.parse(storagebase.AutoPatchWorkConfig);
        debug = !!AutoPatchWorkBG.config.debug_mode;
        if(storagebase.site_stats) site_stats = JSON.parse(storagebase.site_stats);
        if(storagebase.site_fail_stats) site_fail_stats = JSON.parse(storagebase.site_fail_stats);
        if(storagebase.AutoPatchWorkCSS) AutoPatchWorkBG.css = storagebase.AutoPatchWorkCSS;
    }

    var version = '', manifest;
    function getManifest(callback) {
        var url = 'manifest.json';
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            callback(JSON.parse(xhr.responseText));
        };
        xhr.open('GET', url += ((/\?/).test(url) ? '&' : '?') + Date.now(), true);
        xhr.send(null);
    }
    getManifest(function(_manifest) { manifest = _manifest; version = _manifest.version; });

    initDatabase();
}

/*window.onload = function() {
    if (browser_type !== BROWSER_CHROME) return;
    var CHROME_GESTURES = 'jpkfjicglakibpenojifdiepckckakgk';
    var CHROME_KEYCONFIG = 'okneonigbfnolfkmfgjmaeniipdjkgkl';
    var action = {
        group: 'AutoPatchWork',
        actions: [{ name: 'AutoPatchWork.toggle' }, { name: 'AutoPatchWork.request' }]
    };
    browser.runtime.sendMessage(CHROME_GESTURES, action);
    browser.runtime.sendMessage(CHROME_KEYCONFIG, action);
};*/

/* jshint ignore:start */
var toggleCode = '(' + (function() {
    var ev = new window.CustomEvent('AutoPatchWork.toggle');
    document.dispatchEvent(ev);
}).toString() + ')();';
/* jshint ignore:end */

switch(browser_type) {
    case BROWSER_CHROME:
            browser.runtime.onMessage.addListener(handleMessage);
            break;
    case BROWSER_SAFARI:
        safari.application.addEventListener('message', function(evt) {
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
        window.opera.extension.onmessage = function(evt) {
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

function setMode(id, mode, val) {
    for (var i = 0, silen = siteinfo.length; i < silen; i++)
        if (siteinfo[i]['wedata.net.id'] && siteinfo[i]['wedata.net.id']  === id) {
            //TODO: should this persist between sessions?
            //setCustomInfo(id, mode, val, false);
            siteinfo[i][mode] = val;
            break;
        }
}

function handleMessage(request, sender, sendResponse) {
    if (request.message === 'AutoPatchWork.initialized') {
        var id = request.siteinfo['wedata.net.id'] || 'microformats';
        site_stats[id] = ++site_stats[id] || 1;
        storagebase.site_stats = JSON.stringify(site_stats);
        return;
    }

    if (request.failed_siteinfo) {
        request.failed_siteinfo.forEach(function(s) {
            var id = s['wedata.net.id'];
            if(!id) return;
            site_fail_stats[id] = ++site_fail_stats[id] || 1;
        });
        storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
        return;
    }

    if (request.paused) {
        if (typeof request.id === 'number' && request.id !== -1)
            setMode(request.id, 'paused', s2b(request.paused));
        return;
    }

    if (request.reversed) {
        if (typeof request.id === 'number' && request.id !== -1)
            setMode(request.id, 'reversed', s2b(request.reversed));
        return;
    }

    if (request.manage) {
        if (request.hash) openOrFocusTab('siteinfo_manager.html#siteinfo_search_input='+request.hash);
        else openOrFocusTab('siteinfo_manager.html');
        return;
    }

    if (request.options) {
        openOrFocusTab('options.html');
        return;
    }

    if (!AutoPatchWorkBG.state || (request.isFrame && AutoPatchWorkBG.config.disable_in_frames))
        return;

    var infos = [], url = request.url;

    if (!url || AutoPatchWorkBG.blacklist_check(url) || url.index)
        return;

    for (var i = 0, len = siteinfo.length, s; i < len; i++) {
        s = siteinfo[i];
        try {
            if (!s.disabled && (new RegExp(s.url)).test(url)) {
                delete s.length;
                infos.push(s);
            }
        } catch (bug) { log((bug.message || bug) + ' ' + s.url); }
    }

    sendResponse({ siteinfo: infos, config: AutoPatchWorkBG.config, css: AutoPatchWorkBG.css });
}

function openOrFocusTab(uri) {
    switch (browser_type) {
        case BROWSER_CHROME:
            browser.windows.getAll({ populate: true }, function(windows) {
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

runExtension();
