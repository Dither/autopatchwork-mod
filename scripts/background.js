Object.keys || (Object.keys = function(k) {
    var r = [];
    for(var i in k)
    r.push(i);
    return r;
});

var self = this;
var siteinfo = [], timestamp, manifest, site_stats = {}, site_fail_stats = {}, custom_info = {};
var MICROFORMATs = [{
    url: '^https?://.',
    nextLink: '//a[@rel="next"] | //link[@rel="next"]',
    insertBefore: '//*[contains(concat(" ",@class," "), " autopagerize_insert_before ")]',
    pageElement: '//*[contains(concat(" ",@class," "), " autopagerize_page_element ")]'
}, {
    url: '^https?://.',
    nextLink: '//link[@rel="next"] | //a[contains(concat(" ",@rel," "), " next ")] | //a[contains(concat(" ",@class," "), " next ")]',
    pageElement: '//*[contains(concat(" ",@class," "), " hfeed ") or contains(concat(" ",@class," "), " story ") or contains(concat(" ",@class," "), " instapaper_body ") or contains(concat(" ",@class," "), " xfolkentry ")]'
}];

var H = location.href.replace('index.html', '');
window.AutoPatchWork = {
    state: true,
    css: '',
    custompatterns: [],
    config: {
        auto_start: true,
        target_blank: true,
        remain_height: 400,
        disable_iframe: false,
        debug_mode: false,
        bar_status: 'on'
    },
    save_custom_patterns: function(patterns) {
        storagebase.AutoPatchWorkPatterns = patterns;
        AutoPatchWork.custompatterns = JSON.parse(patterns);
    },
    reset_custom_patterns: function() {
        AutoPatchWork.custompatterns = [];
        storagebase.AutoPatchWorkPatterns = '';
    },
    init_css: function(css) {
        if (css && css.replace(/[\s\n]*/, '') !== '') {
            AutoPatchWork.css = storagebase.AutoPatchWorkCSS = css;
        } else {
            storagebase.AutoPatchWorkCSS = AutoPatchWork.css = get_css();
        }
    },
    update: function() {
        storagebase.AutoPatchWorkConfig = JSON.stringify(AutoPatchWork.config);
    },
    disabled_sites: [],
    blacklist_check: function(url) {
        if(url.indexOf('http') !== 0)
            return true;
        return AutoPatchWork.disabled_sites.some(function(site) {
            if(site.type === 'regexp')
                return new RegExp(site.matcher).test(url);
            else if(site.type === 'prefix')
                return url.indexOf(site.matcher) === 0;
            else if(site.type === 'domain')
                return new RegExp('^https?://' + site.matcher + '/').test(url);
        });
    },
    add_disabled_site: function(site) {
        AutoPatchWork.disabled_sites.push(site);
        storagebase.disabled_sites = JSON.stringify(AutoPatchWork.disabled_sites);
    },
    save_disabled_site: function() {
        storagebase.disabled_sites = JSON.stringify(AutoPatchWork.disabled_sites);
    },
    delete_disabled_site: function(site) {
        var site_s = JSON.stringify(site);
        for(var i = 0; i < AutoPatchWork.disabled_sites.length; i++) {
            var str = JSON.stringify(AutoPatchWork.disabled_sites[i]);
            if(str === site_s) {
                AutoPatchWork.disabled_sites.splice(i, 1);
                storagebase.disabled_sites = JSON.stringify(AutoPatchWork.disabled_sites);
                break;
            }
        }
    }
};
if(self.safari) {
    safari.extension.settings.addEventListener('change', function(evt) {
        if(evt.key in AutoPatchWork.config) {
            AutoPatchWork.config[evt.key] = evt.newValue;
        } else if(evt.key === 'excludes') {
            var urls = evt.newValue.trim().split(' ');
            AutoPatchWork.disabled_sites = urls.map(function(url) {
                return {
                    type: 'prefix',
                    matcher: url
                };
            });
            AutoPatchWork.save_disabled_site();
        }
    }, false);
}

if(storagebase.disabled_sites)
    AutoPatchWork.disabled_sites = JSON.parse(storagebase.disabled_sites);
else
    storagebase.disabled_sites = JSON.stringify(AutoPatchWork.disabled_sites);

if(storagebase.AutoPatchWorkConfig)
    AutoPatchWork.config = JSON.parse(storagebase.AutoPatchWorkConfig);
else
    storagebase.AutoPatchWorkConfig = JSON.stringify(AutoPatchWork.config);

if(storagebase.site_stats)
    site_stats = JSON.parse(storagebase.site_stats);
else
    storagebase.site_stats = JSON.stringify(site_stats);

if(storagebase.site_fail_stats)
    site_fail_stats = JSON.parse(storagebase.site_fail_stats);
else
    storagebase.site_fail_stats = JSON.stringify(site_fail_stats);

if(storagebase.custom_info)
    custom_info = JSON.parse(storagebase.custom_info);
else
    storagebase.custom_info = JSON.stringify(custom_info);

if(storagebase.AutoPatchWorkCSS)
    AutoPatchWork.css = storagebase.AutoPatchWorkCSS;
else
    AutoPatchWork.init_css();

if(storagebase.AutoPatchWorkPatterns)
    AutoPatchWork.custompatterns = JSON.parse(storagebase.AutoPatchWorkPatterns);
else
    AutoPatchWork.reset_custom_patterns();

var version = '', Manifest;
IconData = {};

get_manifest(function(_manifest) {
    Manifest = _manifest;
    version = _manifest.version;
});
if(Store.has('siteinfo_wedata')) {
    var data = Store.get('siteinfo_wedata');
    siteinfo = data.siteinfo;
    siteinfo = AutoPatchWork.custompatterns.concat(siteinfo);
    timestamp = new Date(data.timestamp);
    applyCustomFields();
} else {
    UpdateSiteinfo();
}
window.onload = function() {
    var CHROME_GESTURES = 'jpkfjicglakibpenojifdiepckckakgk';
    var CHROME_KEYCONFIG = 'okneonigbfnolfkmfgjmaeniipdjkgkl';
    var action = {
        group: 'AutoPatchWork',
        actions: [{
            name: 'AutoPatchWork.toggle'
        }, {
            name: 'AutoPatchWork.request'
        }]
    };
    self.chrome && chrome.extension.sendRequest(CHROME_GESTURES, action);
    self.chrome && chrome.extension.sendRequest(CHROME_KEYCONFIG, action);
};
var ToggleCode = '(' + (function() {
    var ev = document.createEvent('Event');
    ev.initEvent('AutoPatchWork.toggle', true, false);
    document.dispatchEvent(ev);
}).toString() + ')();';

self.chrome && chrome.extension.onRequest.addListener(handleMessage);

self.safari && safari.application.addEventListener("message", function(evt) {
    var name = evt.name;
    if(name === 'option_init') {
        evt.target.page.dispatchMessage(name, AutoPatchWork);
    } else if(name === 'invoke_action') {
        if(evt.message.action === 'update') {
            AutoPatchWork.config = evt.message.config;
            AutoPatchWork.update();
        } else if(evt.message.action === 'save_disabled_site') {
            AutoPatchWork.disabled_sites = evt.message.disabled_sites;
            AutoPatchWork.save_disabled_site();
        } else if(evt.message.action === 'UpdateSiteinfo') {
            UpdateSiteinfo(function() {
                evt.target.page.dispatchMessage('updated_siteinfo');
            });
        } else {
            AutoPatchWork[evt.message.action].apply(AutoPatchWork, evt.message.args);
        }
    } else if(name === 'siteinfo_init') {
        evt.target.page.dispatchMessage(name, {
            siteinfo: siteinfo,
            custom_info: custom_info,
            site_stats: site_stats,
            site_fail_stats: site_fail_stats,
            AutoPatchWork: AutoPatchWork
        });
    } else {
        handleMessage(evt.message, {}, function(data) {
            evt.target.page.dispatchMessage(name, data);
        });
    }
}, false);
self.opera && (self.opera.extension.onmessage = function(evt) {
    var name = evt.data.name;
    var message = evt.data.data;
    if(name === 'option_init') {
        evt.source.postMessage({
            name: name,
            data: JSON.parse(JSON.stringify(AutoPatchWork))
        });
    } else if(name === 'invoke_action') {
        if(message.action === 'update') {
            AutoPatchWork.config = message.config;
            AutoPatchWork.update();
        } else if(message.action === 'save_disabled_site') {
            AutoPatchWork.disabled_sites = message.disabled_sites;
            AutoPatchWork.save_disabled_site();
        } else if(message.action === 'UpdateSiteinfo') {
            UpdateSiteinfo(function() {
                evt.source.postMessage({
                    name: 'updated_siteinfo'
                });
            });
        } else {
            AutoPatchWork[message.action].apply(AutoPatchWork, message.args);
        }
    } else if(name === 'siteinfo_init') {
        evt.source.postMessage({
            name: name,
            data: {
                siteinfo: siteinfo,
                custom_info: custom_info,
                site_stats: site_stats,
                site_fail_stats: site_fail_stats,
                AutoPatchWork: JSON.parse(JSON.stringify(AutoPatchWork))
            }
        });
    } else {
        handleMessage(message, {}, function(data) {
            evt.source.postMessage({
                name: name,
                data: data
            });
        });
    }
});
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
            if(!id)
                return;
            site_fail_stats[id] = ++site_fail_stats[id] || 1;
        });
        storagebase.site_fail_stats = JSON.stringify(site_fail_stats);
        return;
    }
    if(request.manage) {
        openOrFocusTab('siteinfo_manager.html');
        return;
    }
    if(request.options) {
        openOrFocusTab('options.html');
        return;
    }
    if(!AutoPatchWork.state || (request.isFrame && AutoPatchWork.config.disable_iframe))
        return;

    var infos = [], url = request.url;

    if(!url || AutoPatchWork.blacklist_check(url) || url.index)
        return;
    for(var i = 0, len = siteinfo.length, s; i < len; i++) {
        s = siteinfo[i];
        if(!s.disabled && new RegExp(siteinfo[i].url).test(url))
            infos.push(siteinfo[i]);
    }
    sendResponse({
        siteinfo: infos,
        config: AutoPatchWork.config,
        css: AutoPatchWork.css
    });
}

function openOrFocusTab(uri) {
    if(self.chrome) {
        chrome.windows.getAll({
            populate: true
        }, function(windows) {
            if(!windows.some(function(w) {
                if(w.type === 'normal') {
                    return w.tabs.some(function(t) {
                        if(t.url === H + uri) {
                            chrome.tabs.update(t.id, {
                                'selected': true
                            });
                            return true;
                        }
                    });
                }
            })) {
                chrome.tabs.getSelected(null, function(t) {
                    chrome.tabs.create({
                        'url': uri,
                        'selected': true,
                        index: t.index + 1
                    });
                });
            }
        });
    } else if(self.safari) {
        if(!safari.application.browserWindows.some(function(w) {
            return w.tabs.some(function(t) {
                if(t.url.indexOf(H + uri) === 0) {
                    t.activate();
                    return true;
                }
            });
        })) {
            safari.application.activeBrowserWindow.openTab().url = H + uri;
        }
    } else if(self.opera) {
        opera.extension.tabs.create({
            url: uri,
            focused: true
        });
    }
}

function getWedataId(inf) {
    return parseInt(inf.resource_url ? inf.resource_url.replace('http://wedata.net/items/', '') : '0', 10);
}

function applyCustomFields(info) {
    siteinfo.forEach(function(i) {
        var id = i['wedata.net.id'];
        var ci = custom_info[id];
        if(ci) {
            Object.keys(ci).forEach(function(k) {
                i[k] = ci[k];
            });
        }
    });
}

function Siteinfo(info) {
    var keys = ['nextLink', 'pageElement', 'url', 'insertBefore'];
    siteinfo = [];
    info.forEach(function(i) {
        var d = i.data || i, r = {};
        keys.forEach(function(k) {
            if(d[k])
                r[k] = d[k];
        });
        try {
            new RegExp(r.url);
        } catch (bug) {
            return;
        }
        r['wedata.net.id'] = i['wedata.net.id'] || getWedataId(i);
        siteinfo.push(r);
    });
    siteinfo.sort(function(a, b) {
        return (b.url.length - a.url.length);
    });
    siteinfo.push.apply(siteinfo, MICROFORMATs);
    siteinfo.push({
        "url": "^http://matome\\.naver\\.jp/",
        "nextLink": "id(\"_pageNavigation\")//a[contains(@class, \"mdPagination01Next\")]",
        "pageElement": "//div[contains(@class, \"blMain00Body\")]/*",
        //exampleUrl:  'http://matome.naver.jp/odai/2124461146762161898',
        "wedata.net.id": "matome.naver"
    });
    window.opera && siteinfo.push({
        url: '^http://www\\.google\\.(?:[^.]+\\.)?[^./]+/images\\?.',
        nextLink: 'id("nav")//td[@class="cur"]/following-sibling::td/a',
        pageElement: '//table[tbody/tr/td/a[contains(@href, "/imgres")]]'
        //,exampleUrl:
        // 'http://images.google.com/images?gbv=2&hl=ja&q=%E3%83%9A%E3%83%BC%E3%82%B8'
    });
    timestamp = new Date;
    Store.set('siteinfo_wedata', {
            siteinfo: siteinfo,
            timestamp: timestamp.toLocaleString()
        },{ day: 60 });
    applyCustomFields();
}

function get_manifest(callback) {
    var url = './manifest.json';
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        callback(JSON.parse(xhr.responseText));
    };
    xhr.open('GET', url, true);
    xhr.send(null);
}

function get_css() {
    var url = './css/main.css';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
}

function UpdateSiteinfo(callback, error_back) {
    var url = 'http://ss-o.net/json/wedataAutoPagerizeSITEINFO.json';
    //
    var xhr = new XMLHttpRequest();
    siteinfo = [];
    xhr.onload = function() {
        var info;
        try {
            info = JSON.parse(xhr.responseText);
            Siteinfo(info);
            if( typeof callback === 'function') {
                callback();
            }
        } catch (bug) {
            if( typeof error_back === 'function') {
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
    xhr.open('GET', url, true);
    xhr.send(null);
}