/** 
 * Returns Array of first level keys of the passed Object.
 * @return {Array} Array of keys in 'this' object.
 * */
if(Object.prototype.keys === undefined) {
    Object.prototype.keys = function() {
        var ret = [];
        for(x in this) if(this.hasOwnProperty(x)) ret.push(x);
        return ret;
    };
}

var RECORDS_PER_PAGE = 100;
var PageIndex = 0;
var isReady = false;

(function siteinfo_manager(bgProcess) {
    var self = this;

    function APWException(message) {
        this.message = message;
        this.name = "[AutoPatchWork]";
    }
    
    function dispatch_event(type, opt) {
        var ev = document.createEvent('Event');
        ev.initEvent(type, true, false);
        if (opt) {
            opt.keys().forEach(function (k) {
                if (!ev[k]) ev[k] = opt[k];
            });
        }
        document.dispatchEvent(ev);
    }
    
    var browser, 
        BROWSER_CHROME = 1,
        BROWSER_SAFARI = 2,
        BROWSER_OPERA = 3;
        
    var debug = JSON.parse(storagebase.AutoPatchWorkConfig).debug_mode,
        custom_info = JSON.parse(storagebase.custom_info),
        site_stats = JSON.parse(storagebase.site_stats),
        site_fail_stats = JSON.parse(storagebase.site_fail_stats);
        
    /*if(~window.navigator.userAgent.indexOf('Chrome')) browser = BROWSER_CHROME;
    else if(~window.navigator.userAgent.indexOf('Apple')) browser = BROWSER_SAFARI;
    else */browser = BROWSER_OPERA;
    
    function log() {
        if (!debug) return;
        if (browser === BROWSER_OPERA) {
            window.opera.postError('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        } else if (window.console) {
            console.log('[AutoPatchWork] ' + Array.prototype.slice.call(arguments));
        }
    }
    
    // Init browser-specific messaging
    switch (browser) {
        case BROWSER_SAFARI:
            if (bgProcess) break;
            safari.self.tab.dispatchMessage('siteinfo_init');
            safari.self.addEventListener('message', function(evt) { siteinfo_manager(evt.message); }, false);
            return;
        case BROWSER_OPERA:
            if (bgProcess) break;
            //console.log(self.opera);
            opera.extension.onmessage = function(evt) {
                if(evt && evt.data) {
                    siteinfo_manager(evt.data.data);
                }
            };
            opera.extension.postMessage({ name: 'siteinfo_init' });
            return;
        case BROWSER_CHROME:
            bgProcess = bgProcess || chrome.extension.getBackgroundPage();
    }

    if (!bgProcess) {
        throw new APWException('Can\'t fing background process!');
    }
    
    var getWedataId = bgProcess.getWedataId || // WTF???
                        function getWedataId(inf) {
                            return parseInt(inf.resource_url ? inf.resource_url.replace('http://wedata.net/items/', '0') : '', 10);
                        };

    window.addEventListener('AutoPatchWork.request', function(e) {
        e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
        dispatch_event('AutoPatchWork.append');
    }, true);

    document.addEventListener('DOMContentLoaded', function () {
        var html = document.querySelector('html');
        html.setAttribute('lang', window.navigator.language);
        html.setAttribute('xml:lang', window.navigator.language);
        
        document.getElementById('loader').src = window.imgAPWLoader;
        document.getElementById('loader').style.display = 'none';       
        
        window.addEventListener('AutoPatchWork.append', function (e) {
            e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
            var infos = filtered_info.length ? filtered_info : siteinfo_data;
            if (infos && infos.length > RECORDS_PER_PAGE * (PageIndex + 1)) {
                PageIndex++;
                SiteInfoView(infos.slice(RECORDS_PER_PAGE * PageIndex, RECORDS_PER_PAGE * (PageIndex + 1)), RECORDS_PER_PAGE * PageIndex);
            } else {
                 dispatch_event('AutoPatchWork.pageloaded');
            }     
        }, true);

        var local_siteinfo = bgProcess.siteinfo;
        var successful = 'number_of_successful';
        var failed = 'number_of_failed';
        var siteinfos_array = {};

        local_siteinfo.forEach(function (v) {
            if(v['wedata.net.id']) siteinfos_array[v['wedata.net.id']] = v;
        });
        //if (!this.chrome || !chrome.tabs) return;
        var siteinfo_data, timestamp, filtered_info = [];

        var except_info = {
            "database_resource_url": true,
            "resource_url": true
        };

        var template_element = document.getElementById('tmpl_siteinfo_body').firstChild;
        while (template_element && (template_element.nodeType !== 1)) template_element = template_element.nextSibling;
        
        var siteinfo_search_input = document.getElementById('siteinfo_search_input');
        var siteinfo_table = document.getElementById('siteinfo_table');
        var siteinfo_nav = document.getElementById('siteinfo_nav');
        var siteinfo_view = document.getElementById('siteinfo_view');
        var siteinfo_head = document.getElementById('siteinfo_head');
        var siteinfo_body = siteinfo_table.querySelector('tbody');
        
        var types = {
            //'on/off':{number:true, key:'disabled'},
            'name': {
                string: true,
                title: 'Name',
                key: 'name'
            },
            'data': {
                string: false,
                title: 'SITEINFO',
                key: 'data'
            },
            'created_at': {
                string: true,
                title: 'Created',
                key: 'created_at'
            },
            'updated_at': {
                string: true,
                title: 'Updated',
                key: 'updated_at'
            },
            'created_by': {
                string: true,
                title: 'Author',
                key: 'created_by'
            },
            'resource_url': {
                string: true,
                title: 'Database entry',
                key: 'resource_url',
                filter: function (v) {
                    v = wedata_filter(v);
                    return ('_0000000000' + v).slice(-10);
                }
            },
            'database_resource_url': {
                string: true,
                title: 'Database',
                key: 'database_resource_url',
                filter: wedata_filter
            },
            'number_of_successful': {
                number: true,
                title: 'Worked',
                key: 'number_of_successful'
            },
            'number_of_failed': {
                number: true,
                title: 'Failed',
                key: 'number_of_failed'
            }
        };

        function wedata_filter(v) {
            return v.replace(/http:\/\/wedata\.net\/(items\/|databases\/)?/, '');
        }

        var sorted = null;
        siteinfo_head.onclick = function (e) {
            var key = e.target.id;
            if (types[key]) {
                var infos = filtered_info.length ? filtered_info : siteinfo_data;
                sort_by(infos, types[key]);
                if (e.target.className === 'c-down') {
                    e.target.className = 'c-up';
                    infos.reverse();
                } else {
                    e.target.className = 'c-down';
                }
                if (sorted && e.target !== sorted) {
                    sorted.className = '';
                }
                SiteInfoView(infos.slice(0, RECORDS_PER_PAGE));
                SiteInfoNavi(infos);
                sorted = e.target;
            }
        };
        
        siteinfo_view.onclick = function (e) {
            if (e.target && e.target === siteinfo_view) {
                document.locked = false;
                siteinfo_view.style.top = -window.innerHeight + 'px';
                siteinfo_view.style.bottom = window.innerHeight + 'px';
                while (siteinfo_view.firstChild) siteinfo_view.removeChild(siteinfo_view.firstChild);
            }
        };

        siteinfo_search_input.addEventListener('input', function (evt) {
            if (!siteinfo_data.length) return;
            // show ajax loader here
            toggle_popup('loader', true);
            var fullword = siteinfo_search_input.value,
                fullwords = [];
            var s = new Date * 1;
            if (fullword) {
                var ret = [],
                    word = fullword.replace(/"([^"]+)"/g, function ($0, $1) {
                        if ($1) ret.push($1);
                        return '';
                    });
                fullwords = word.split(/[\+\s\.:\|#]/).concat(ret).filter(function (w) {
                    return w;
                });
            } else {}
            var keys = fullwords.map(function (k) {
                return new RegExp(k.replace(/\W/g, '\\$&'), 'im');
            });
            var siteinfo = siteinfo_data.filter(function (sinfo) {
                var ret = [];
                for (var k in sinfo) {
                    if (except_info[k]) continue;
                    var info = sinfo[k];
                    if (typeof info === 'object') {
                        for (var k2 in info) {
                            ret.push(info[k2]);
                        }
                    } else {
                        ret.push(info);
                    }
                }
                var dat = ret.join('\n');
                if (keys.every(function (r) {
                    return r.test(dat);
                })) return true;
                return false;
            });
            debug && log('search completed in ' + (new Date - s) + 'ms');
            var v = new Date * 1;
            SiteInfoView(siteinfo.slice(0, RECORDS_PER_PAGE));
            filtered_info = siteinfo;
            SiteInfoNavi(siteinfo);
            debug && log('view completed in ' + (new Date - v) + 'ms');
            // hide ajax loader here
            toggle_popup('loader', false);
        }, false);

        function url2anchor(url) {
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.textContent = url.replace(/http:\/\/wedata\.net\/(items\/|databases\/)?/, '');
            return a;
        }

        function urls2anchors(urls) {
            var df = document.createDocumentFragment();
            urls.split(/[\s\n\r]+/).map(url2anchor).forEach(function (a, i) {
                if (i) df.appendChild(document.createElement('br'));
                df.appendChild(a);
            });
            return df;
        }

        function string2date(date) {
            var t = document.createElement('time');
            t.setAttribute('datetime', date);
            t.setAttribute('title', date);
            t.textContent = date.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+(\d{2}):(\d{2})/, '$1/$2/$3');
            return t;
        }

        var text_to_html = {
            "database_resource_url": url2anchor,
            "resource_url": url2anchor,
            "created_at": string2date,
            "updated_at": string2date,
            "exampleUrl": urls2anchors
        };

        function sort_by(siteinfo, opt) {
            if (opt.number) {
                siteinfo.sort(function (a, b) {
                    return b[opt.key] - a[opt.key];
                });
            } else if (opt.string) {
                Object.prototype.toString = opt.filter ? filter2string : normal2string;
                siteinfo.sort();
                delete Object.prototype.toString;
            }

            function filter2string() {
                return opt.filter(this[opt.key]);
            }

            function normal2string() {
                return this[opt.key];
            }

        }

        function btn(opt, listener) {
            var btn = document.createElement('input');
            btn.id = opt.id;
            btn.type = opt.type;
            opt.hasOwnProperty('value') && (btn.value = opt.value);
            opt.parent.appendChild(btn);
            if (opt.text) {
                var label = document.createElement('label');
                label.htmlFor = opt.id;
                label.textContent = opt.text;
                opt.parent.appendChild(label);
            }
            btn.onclick = listener;
            return btn;
        }

        function applyStatistics(siteinfo) {
            siteinfo.forEach(function (info, i) {
                var id = getWedataId(info);
                info[successful] = site_stats[id] || 0;
                info[failed] = site_fail_stats[id] || 0;
            });
        }

        function SiteInfoView(siteinfo, append) {
            document.locked = false;
            toggle_popup('loader', true);
            var df = document.createDocumentFragment();
            siteinfo.forEach(function (info, i) {
                var id = getWedataId(info);
                var current_siteinfo = siteinfos_array[id];
                //var editBox = [];
                var line = template_element.cloneNode(true);
                var disabled_btn = line.querySelector('input.onoff');
                if (custom_info && custom_info[id]) {
                    var ci = custom_info[id];
                    if (ci.keys().some(function (k) { if (k === 'disabled') return false; return ci[k] !== info.data[k]; })){
                           line.setAttribute('data-modified', 'modified');
                    }
                    disabled_btn.checked = ci.disabled;
                    ci.disabled ? line.setAttribute('data-disabled', 'disabled' ) : line.removeAttribute('data-disabled');
                }

                disabled_btn.onchange = function (e) {
                    current_siteinfo.disabled = !current_siteinfo.disabled;
                    if (!custom_info[id]) {
                        custom_info[id] = {};
                    }
                    custom_info[id].disabled = current_siteinfo.disabled;
                    storagebase.custom_info = JSON.stringify(custom_info);
                    current_siteinfo.disabled ? line.setAttribute('data-disabled', 'disabled' ) : line.removeAttribute('data-disabled');
                };
                df.appendChild(line);
                line.querySelector('td.index').textContent = 1 + i + (append || 0);
                info.keys().forEach(function (title, i, info_keys) {
                    var data = info[title];
                    var td = line.querySelector('td.' + title);
                    if (!td) return;
                    if (title === 'name') {
                        var name_btn = td.firstChild;
                        name_btn.onclick = function () {
                            if (document.locked) return;
                            document.locked = true;
                            var dl = document.createElement('dl');
                            info_keys.forEach(function (key) {
                                var data = info[key];
                                var dt1 = document.createElement('dt');
                                dt1.className = key;
                                dt1.textContent = types[key].title;
                                dl.appendChild(dt1);
                                var dd1 = document.createElement('dd');
                                dd1.className = key;
                                dl.appendChild(dd1);
                                if (typeof data === 'object') {
                                    var dl2 = document.createElement('dl');
                                    dd1.appendChild(dl2);
                                    data.keys().forEach(function (si_key) {
                                        var inf = (current_siteinfo && current_siteinfo[si_key]) ? current_siteinfo[si_key] : data[si_key];
                                        if (inf) {
                                            var dt2 = document.createElement('dt');
                                            var dd2 = document.createElement('dd');
                                            dl2.appendChild(dt2);
                                            dl2.appendChild(dd2);
                                            dt2.textContent = si_key;
                                            var node2;
                                            if (text_to_html[si_key]) {
                                                node2 = text_to_html[si_key](inf);
                                            } else {
                                                node2 = document.createElement('textarea');
                                                node2.value = inf;
                                                if (!current_siteinfo) {
                                                    node2.setAttribute('readonly', 'readonly');
                                                }
                                                node2.onchange = function () {
                                                    //console.log(current_siteinfo,current_siteinfo[si_key],node2.value);
                                                    current_siteinfo[si_key] = node2.value;
                                                    if (!custom_info[id]) { custom_info[id] = {}; }
                                                    if (current_siteinfo[si_key] === info.data[si_key]) {
                                                        delete custom_info[id][si_key];
                                                        var ci = custom_info[id];
                                                        if (ci.keys().some(function (k) {
                                                            if (k === 'disabled') return false;
                                                            return ci[k] !== info.data[k];
                                                        })) {} else {
                                                            line.removeAttribute('data-modified');
                                                        }
                                                    } else {
                                                        custom_info[id][si_key] = node2.value;
                                                        line.setAttribute('data-modified', 'modified');
                                                    }
                                                    storagebase.custom_info = JSON.stringify(custom_info);
                                                };
                                                if (inf !== data[si_key]) {
                                                    node2.setAttribute('data-modified', 'modified');
                                                    line.setAttribute('data-modified', 'modified');
                                                }
                                            }
                                            dd2.appendChild(node2);
                                        }
                                    });
                                } else {
                                    var node;
                                    if (text_to_html[title]) {
                                        node = text_to_html[title](data);
                                    } else {
                                        node = document.createElement('span');
                                        node.textContent = data;
                                    }
                                    dd1.appendChild(node);
                                }
                            });
                            siteinfo_view.appendChild(dl);
                            siteinfo_view.style.top = '0px';
                            siteinfo_view.style.bottom = '0px';
                            siteinfo_view.firstElementChild.style.top = 
                                (window.innerHeight - siteinfo_view.firstElementChild.offsetHeight) / 2 + 'px';
                        };
                        name_btn.textContent = data;
                    } else if (text_to_html[title]) {
                        td.appendChild(text_to_html[title](data));
                    } else {
                        td.textContent = data;
                    }
                });
            });
            if (!append) {
                var n = siteinfo_body.cloneNode(false);
                siteinfo_table.replaceChild(n, siteinfo_body);
                siteinfo_body = n;
                sorted = null;
            }
            siteinfo_body.appendChild(df);
            toggle_popup('loader', false);
            dispatch_event('AutoPatchWork.pageloaded');
        }

        function SiteInfoNavi(siteinfo) {
            var nav = siteinfo_nav;
            PageIndex = 0;
            while (nav.firstChild)
            nav.removeChild(nav.firstChild);
            for (var i = 0, len = siteinfo.length / RECORDS_PER_PAGE; i < len; i++)(function (i) {
                var a = document.createElement('a');
                a.textContent = i + 1;
                a.href = '#a' + i;
                a.id = 'a' + i;
                nav.appendChild(a);
                a.addEventListener('click', function (e) {
                    SiteInfoView(siteinfo.slice(RECORDS_PER_PAGE * i, RECORDS_PER_PAGE * (i + 1)));
                    PageIndex = i;
                    window.scrollTo(0, 0);
                    e.preventDefault();
                }, false);
            })(i);
            var r = nav.parentNode.getBoundingClientRect();
            siteinfo_table.style.marginTop = r.height + 10 + 'px';
        }

        function UpdateSiteInfo(callback) {
            var url = 'http://ss-o.net/json/wedataAutoPagerize.json',
                xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (evt) {  
              if (xhr.readyState === 4 /*XMLHttpRequest.DONE*/) {
                if (xhr.status === 200) {
                  var d;
                  try { 
                      d = JSON.parse(xhr.responseText);
                  } catch (bug) {
                      console.log("JSON.parse error: ", bug.message);
                      return;
                  }
                  callback(d);
                } else {  
                  console.log("XMLHttpRequest error: ", xhr.statusText);  
                }  
              }  
            }; 
            xhr.open('GET', url, true);
            xhr.send(null);
        }

        function toggle_popup(id , state) {
            setTimeout(function () {
                var popup = document.getElementById(id);
                popup.style.display = state ? 'inline-block' : 'none';
            }, state ? 0 : 1500);
        }

        window.onresize = function () {
            // do we need onresize event at all?
            siteinfo_view.style.top = -window.innerHeight + 'px';
            siteinfo_view.style.bottom = window.innerHeight + 'px';
            while (siteinfo_view.firstChild) siteinfo_view.removeChild(siteinfo_view.firstChild);
            document.locked = false;
        };
        if (sessionStorage.siteinfo_wedata) {
            siteinfo_data = JSON.parse(sessionStorage.siteinfo_wedata);
            applyStatistics(siteinfo_data);
            sort_by(siteinfo_data, { number: true, key: failed });
            SiteInfoView(siteinfo_data.slice(0, RECORDS_PER_PAGE));
            SiteInfoNavi(siteinfo_data);
            window.onresize();
        } else {
            UpdateSiteInfo(function (siteinfo) {
                siteinfo_data = siteinfo;
                sessionStorage.siteinfo_wedata = JSON.stringify(siteinfo);
                applyStatistics(siteinfo_data);
                sort_by(siteinfo_data, {
                    number: true,
                    key: failed
                });
                SiteInfoView(siteinfo_data.slice(0, RECORDS_PER_PAGE));
                SiteInfoNavi(siteinfo);
                window.onresize();
            });
        }
        
        dispatch_event('AutoPatchWork.siteinfo', {
            siteinfo: {
                url: '.',
                nextLink: '//*',
                pageElement: '//*'
            }
        });

    }, false);
})();