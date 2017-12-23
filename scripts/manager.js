var RECORDS_PER_PAGE = 100,
    JSON_SITEINFO_DB = 'http://wedata.net/databases/AutoPagerize/items.json',
    pageIndex = 0;

(function(){
    var html = document.querySelector('html');
    html.setAttribute('lang', window.navigator.language);
    html.setAttribute('xml:lang', window.navigator.language);
}());

(function siteinfo_manager(bgProcess) {
    // Init browser-specific messaging
    switch (browser_type) {
        case BROWSER_SAFARI:
            if (bgProcess) break;
            safari.self.tab.dispatchMessage('siteinfo_init');
            safari.self.addEventListener('message', function(evt) { siteinfo_manager(evt.message); }, false);
            return;
        case BROWSER_OPERA:
            bgProcess = bgProcess || opera.extension.bgProcess;
            break;
        case BROWSER_CHROME:
            bgProcess = bgProcess || browser.extension.getBackgroundPage();
    }

    if (!bgProcess) {
        var error = 'Can\'t fing background process!';
        alert(error);
        throw new APWException(error);
        return;
    }

    if (typeof storagebase.AutoPatchWorkConfig !== 'undefined')
        debug = !!JSON.parse(storagebase.AutoPatchWorkConfig).debug_mode;

    var custom_info = bgProcess.custom_info,
        site_stats = bgProcess.site_stats,
        site_fail_stats = bgProcess.site_fail_stats,
        allow_ext_styles = bgProcess.AutoPatchWorkBG.config.allow_ext_styles,
        entry_editor_running = false;

    JSON_SITEINFO_DB = bgProcess.JSON_SITEINFO_DB || JSON_SITEINFO_DB;
    var getWedataId = bgProcess.getWedataId ||
                        function getWedataId(inf) {
                            return parseInt(inf.resource_url ? inf.resource_url.replace('http://wedata.net/items/', '0') : '', 10);
                        };

    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('loader').style.display = 'none';

        window.addEventListener('AutoPatchWork.request', function(e) {
            profile('AutoPatchWork.request');
            if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
            var infos = filtered_info.length ? filtered_info : siteinfo_data;
            if (!!infos && infos.length > RECORDS_PER_PAGE * (pageIndex + 1) && pageIndex < Math.ceil(infos.length/RECORDS_PER_PAGE)) {
                pageIndex++;
                SiteInfoView(infos.slice(RECORDS_PER_PAGE * pageIndex, RECORDS_PER_PAGE * (pageIndex + 1)), RECORDS_PER_PAGE * pageIndex);
            } else {
                dispatch_event('AutoPatchWork.state', {state:'off'});
            }
            dispatch_event('AutoPatchWork.pageloaded');
            profile('AutoPatchWork.request', 'end');
        }, true);

        var local_siteinfo = bgProcess.siteinfo,
            successful = 'number_of_successful',
            failed = 'number_of_failed',
            siteinfos_array = {},
            re_http = /^https?:\/\/[^"'`]+$/ig;

        local_siteinfo.forEach(function (v) {
            if(v['wedata.net.id']) siteinfos_array[v['wedata.net.id']] = v;
        });

        var siteinfo_data, filtered_info = [];

        var except_info = {
            'database_resource_url': true,
            'resource_url': true
        };

        var template_element = document.getElementById('tmpl_siteinfo_body').firstChild;
        while (template_element && (template_element.nodeType !== 1)) template_element = template_element.nextSibling;

        var siteinfo_search_input = document.getElementById('siteinfo_search_input');
        siteinfo_search_input.value = ~window.location.hash.indexOf('=') ? window.location.hash.substr(1).split('=')[1] || '' : '';

        /* jshint ignore:start */
        var siteinfo_table = document.getElementById('siteinfo_table'),
            siteinfo_nav = document.getElementById('siteinfo_nav'),
            siteinfo_view = document.getElementById('siteinfo_view'),
            siteinfo_head = document.getElementById('siteinfo_head'),
            siteinfo_body = siteinfo_table.querySelector('tbody');
        /* jshint ignore:end */

        var types = {
            'number': {
                number: true,
                key: 'disabled'
            },
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
                title: 'Hits',
                key: 'number_of_successful'
            },
            'number_of_failed': {
                number: true,
                title: 'Misses',
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
                InitSiteInfoView(infos);
                sorted = e.target;
            }
        };

        siteinfo_view.onclick = function (e) {
            if (e.target && e.target === siteinfo_view) {
                entry_editor_running = false;
                siteinfo_view.style.top = -window.innerHeight + 'px';
                siteinfo_view.style.bottom = window.innerHeight + 'px';
                while (siteinfo_view.firstChild) siteinfo_view.removeChild(siteinfo_view.firstChild);
            }
        };

        function process_search_input() {
            if (!siteinfo_data || !siteinfo_data.length) return;
            profile('process_search_input');
            var fullword = siteinfo_search_input.value,
                fullwords = [];
            if (fullword.trim() !== '') {
                var ret = [],
                    word = fullword.replace(/"([^"]+)"/g, function ($0, $1) {
                        if ($1) ret.push($1);
                        return '';
                    });
                fullwords = word.split(/[\+\s\.:\|#]/).concat(ret).filter(function (w) {
                    return w;
                });
            } else {
                filtered_info = [];
                InitSiteInfoView(siteinfo_data);
                return;
            }
            filtered_info = siteinfo_data.filter(function (sinfo) {
                var ret = [];
                for (var k in sinfo) {
                    if (sinfo.hasOwnProperty(k)) {
                        if (except_info[k]) continue;
                        var info = sinfo[k];
                        if (typeof info === 'object') {
                            for (var k2 in info) {
                                if (info.hasOwnProperty(k2)) {
                                    ret.push(info[k2]);
                                }
                            }
                        } else {
                            ret.push(info);
                        }
                    }
                }
                var dat = ret.join('\n');
                if (fullwords.map(function (k) {return new RegExp(k.replace(/\W/g, '\\$&'), 'im');}).every(function (r) {
                    return r.test(dat);
                })) return true;
                return false;
            });

            InitSiteInfoView(filtered_info);
            profile('process_search_input', 'end');
        }

        var timer = null;
        siteinfo_search_input.addEventListener('input', function() {
            clearTimeout(timer);
            timer = setTimeout(process_search_input, 400);
        }, false);

        function url2anchor(url) {
            var a = document.createElement('a');
            if (typeof  url !== 'string' || url.trim() === '') return a;
            if (!url.match(re_http)) {
                a.href = '#';
                return a;
            }
            a.textContent = url.replace(/https?:\/\/wedata\.net\/(items\/|databases\/)?/, '');
            a.href = url;
            a.target = '_blank';
            return a;
        }

        function urls2anchors(urls) {
            var df = document.createDocumentFragment();
            if (typeof  urls !== 'string') return df;
            urls = urls.trim();
            if (urls.length > 5) urls.split(/[\s\n\r]+/).map(url2anchor).forEach(function (a, i) {
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
            'database_resource_url': url2anchor,
            'resource_url': url2anchor,
            'created_at': string2date,
            'updated_at': string2date,
            'exampleUrl': urls2anchors
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

        /*function btn(opt, listener) {
            var btn = document.createElement('input');
            btn.id = opt.id;
            btn.type = opt.type;
            if (opt.hasOwnProperty('value')) btn.value = opt.value;
            opt.parent.appendChild(btn);
            if (opt.text) {
                var label = document.createElement('label');
                label.htmlFor = opt.id;
                label.textContent = opt.text;
                opt.parent.appendChild(label);
            }
            btn.onclick = listener;
            return btn;
        }*/

        function apply_fixes(siteinfo) {
            siteinfo.forEach(function (info) {
                var id = getWedataId(info);
                info[successful] = site_stats[id] || 0;
                info[failed] = site_fail_stats[id] || 0;
                if (!info.data) return;
                var t = info.data['cssPatch'] || info.data['Stylish'] || null;
                delete info.data['cssPatch'];
                delete info.data['Stylish'];
                //don't need those from an external db
                delete info.data['jsPatch'];
                delete info.data['SERVICE'];
                delete info.data['domEvents'];
                delete info.data['buttonElement'];
                delete info.data['buttonElementSelector'];
                delete info.data['removeElement'];
                delete info.data['removeElementSelector'];
                info.data['prevLink'] = info.data['prevLink'] || ''; // show the field if absent
                info.data['insertBefore'] = info.data['insertBefore'] || ''; // show the field if absent
                if (allow_ext_styles) {
                    if (t && !t.match(/java/i && !t.match(/url[^\(]*\(/i)) &&
                        t.replace(/\s/g,'').length > 5) {
                        t = t.replace(/url[^\(]*\([^\)]+\)/ig,'');
                        t = t.match(/@-moz-document[^{]+{\s*([^@]+)\s*}/)[1] || t;
                        info.data['cssPatch'] = t;
                    }
                }
            });
        }


        function InitSiteInfoView(inf) {
            SiteInfoView(inf.slice(0, RECORDS_PER_PAGE));
            SiteInfoNavi(inf);
            if (inf.length > RECORDS_PER_PAGE) {
                dispatch_event('AutoPatchWork.state', {state: 'on'});
            } else {
                dispatch_event('AutoPatchWork.state', {state: 'off'});
            }
        }

        function SiteInfoView(siteinfo, append) {
            profile('SiteInfoView');
            entry_editor_running = false;
            toggle_popup('loader', true);
            var df = document.createDocumentFragment();
            var custom_fields = {'disabled':1,'length':1,'jsPatch':1,'cssPatch':1,'prevLink':1,'removeElement':1,'allowScripts':1,'forceIframe':1,'disableSeparator':1,'forceAddressChange':1};
            var essential_fields = {'url':1 , 'pageElement':1,'nextLink':1};

            siteinfo.forEach(function (info, i) {
                var id = getWedataId(info),
                    current_siteinfo = siteinfos_array[id];

                var line = template_element.cloneNode(true),
                    disabled_btn = line.querySelector('input.onoff'),
                    scripts_enabled_btn = line.querySelector('input.scripts_enable'),
                    force_iframe_btn = line.querySelector('input.force_iframe'),
                    disable_separator_btn = line.querySelector('input.disable_separator'),
                    addr_change_btn = line.querySelector('input.address_change');

                if (custom_info && custom_info[id]) {
                    var ci = custom_info[id];
                    if (ci.keys().some(function (k) {
                            if (k in custom_fields) {
                                return false;
                            }
                            return ci[k] !== info.data[k];
                        })){
                            line.setAttribute('data-modified', 'modified');
                        }

                    disabled_btn.checked = ci.disabled || false;
                    scripts_enabled_btn.checked = ci.allowScripts || false;
                    force_iframe_btn.checked = ci.forceIframe || false;
                    disable_separator_btn.checked = ci.disableSeparator || false;
                    addr_change_btn.checked = ci.forceAddressChange || false;

                    if (ci.disabled) line.setAttribute('data-disabled', 'disabled' ); else line.removeAttribute('data-disabled');
                    if (ci.allowScripts) line.setAttribute('data-scripts', 'enabled' ); else line.removeAttribute('data-scripts');
                    if (ci.forceIframe) line.setAttribute('data-iframe', 'enabled' ); else line.removeAttribute('data-iframe');
                    if (ci.disableSeparator) line.setAttribute('data-separator', 'disabled' ); else line.removeAttribute('data-separator');
                    if (ci.forceAddressChange) line.setAttribute('data-addrchange', 'enabled' ); else line.removeAttribute('data-addrchange');
                    if (ci.removeElement) line.setAttribute('data-remove', 'enabled' ); else line.removeAttribute('data-remove');
                    if (ci.cssPatch) line.setAttribute('data-csspatch', 'enabled' ); else line.removeAttribute('data-csspatch');
                    if (ci.jsPatch) line.setAttribute('data-jspatch', 'enabled' ); else line.removeAttribute('data-jspatch');
                }

                var cb_handler = function(name, type, state, value){
                    var val, type_full = 'data-' + type;
                    if (typeof value === 'string') {
                        if (value.replace(/[\s\r\n]/g,'').length) {
                            val = value;
                        } else
                            return;
                    } else {
                        val = true;
                    }
                    return function() { // memory-friendly version
                        if (typeof custom_info[id] === 'undefined') {
                            custom_info[id] = {};
                            custom_info[id][name] = val;
                            custom_info[id].length = 1;
                            current_siteinfo[name] = val;
                        } else {
                            if (typeof custom_info[id][name] === 'undefined') {
                                custom_info[id][name] = val;
                                custom_info[id].length++;
                                current_siteinfo[name] = val;
                            } else {
                                if (--custom_info[id].length < 1) {
                                    delete custom_info[id];
                                } else {
                                    delete custom_info[id][name];
                                }
                                delete current_siteinfo[name];
                            }
                        }

                        if (current_siteinfo[name]) line.setAttribute(type_full, state); else line.removeAttribute(type_full);

                        bgProcess.saveCustomInfo();
                        bgProcess.applyCustomInfo();
                    };
                };

                disabled_btn.onchange = cb_handler('disabled', 'disabled', 'disabled');
                scripts_enabled_btn.onchange = cb_handler('allowScripts', 'scripts', 'enabled');
                force_iframe_btn.onchange = cb_handler('forceIframe', 'iframe', 'enabled');
                disable_separator_btn.onchange = cb_handler('disableSeparator', 'separator', 'disabled');
                addr_change_btn.onchange = cb_handler('forceAddressChange', 'addrchange', 'enabled');

                df.appendChild(line);
                line.querySelector('td.index').textContent = 1 + i + (append || 0);
                info.keys().forEach(function (title, i, info_keys) {
                    var data = info[title];
                    var td = line.querySelector('td.' + title);
                    if (!td) return;
                    if (title === 'name') {
                        var name_btn = td.firstChild;
                        name_btn.onclick = function () {
                            if (entry_editor_running) return;
                            entry_editor_running = true;
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
                                    data['removeElement'] = typeof custom_info[id] !== 'undefined' ? (custom_info[id]['removeElement'] || '') : '';
                                    data['jsPatch'] = typeof custom_info[id] !== 'undefined' ? (custom_info[id]['jsPatch'] || '') : '';
                                    if (!allow_ext_styles)
                                        data['cssPatch'] = typeof custom_info[id] !== 'undefined' ? (custom_info[id]['cssPatch'] || '') : '';

                                    var dl2 = document.createElement('dl');
                                    dd1.appendChild(dl2);

                                    data.keys().forEach(function (si_key) {
                                        var inf = '', is_custom = si_key in custom_fields, is_essential = si_key in essential_fields;
                                        if (typeof custom_info[id] !== 'undefined') {
                                            inf = custom_info[id][si_key];
                                            if (!inf && !is_custom) inf = data[si_key];
                                        } else if (!is_custom) {
                                            inf = data[si_key];
                                        }
                                        if (inf || is_custom || si_key === 'insertBefore') {
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
                                                switch (si_key) {
                                                    case 'jsPatch':
                                                        node2.rows = 5;
                                                        break;
                                                    case 'url':
                                                    case 'cssPatch':
                                                    case 'removeElement':
                                                    case 'insertBefore':
                                                        node2.rows = 1;
                                                        break;
                                                    case 'comment':
                                                        node2.setAttribute('readonly', '');
                                                        node2.rows = 1;
                                                        break;
                                                    default:
                                                        node2.rows = 2;
                                                } //switch
                                                node2.value = inf || '';
                                                if (!current_siteinfo) {
                                                    node2.setAttribute('readonly', ''); // remote DB differs from local
                                                }
                                                node2.onchange = function() {
                                                    //log(current_siteinfo,current_siteinfo[si_key], node2.value);
                                                    var nval = node2.value.trim(),
                                                        is_not_empty = nval.length;

                                                    if (typeof custom_info[id] === 'undefined') {
                                                        custom_info[id] = {};
                                                        custom_info[id].length = 0;
                                                    }
                                                    if (nval === info.data[si_key]) { // remote SI equals local SI
                                                        // only way to remove `insertBefore` from storagebase is to set it equal to remote SI's
                                                        if (--custom_info[id].length < 1) {
                                                            delete custom_info[id];
                                                        } else {
                                                            delete custom_info[id][si_key];
                                                        }
                                                        current_siteinfo[si_key] = nval;
                                                    } else { // remote SI differs from local SI
                                                        if (is_not_empty || si_key === 'insertBefore') {
                                                            // we save empty `insertBefore` value for when we want to override wedata's one
                                                            if (typeof custom_info[id][si_key] === 'undefined') {
                                                                custom_info[id].length++;
                                                            }
                                                            custom_info[id][si_key] = nval; // set siteinfo field in custom_info
                                                            current_siteinfo[si_key] = nval; // set runtime siteinfo field
                                                        } else {
                                                            if (--custom_info[id].length < 1) {
                                                                delete custom_info[id];
                                                            } else {
                                                                delete custom_info[id][si_key];
                                                            }
                                                            if (!is_essential) {
                                                                delete current_siteinfo[si_key];
                                                            } else {
                                                                current_siteinfo[si_key] = info.data[si_key];
                                                            }
                                                        }
                                                    }

                                                    // highlight changed lines
                                                    var ci = custom_info[id];
                                                    if (ci) {
                                                        if (ci.keys().some(function (k) { if (k in custom_fields) return false; if (ci[k] === '') return false; return (ci[k] !== info.data[k]); })) {
                                                            line.setAttribute('data-modified', 'modified');
                                                        } else {
                                                            line.removeAttribute('data-modified');
                                                        }

                                                        if (ci.removeElement) line.setAttribute('data-remove', 'enabled' ); else line.removeAttribute('data-remove');
                                                        if (ci.cssPatch) line.setAttribute('data-csspatch', 'enabled' ); else line.removeAttribute('data-csspatch');
                                                        if (ci.jsPatch) line.setAttribute('data-jspatch', 'enabled' ); else line.removeAttribute('data-jspatch');
                                                    } else {
                                                        line.removeAttribute('data-modified');
                                                        node2.removeAttribute('data-modified', 'modified');
                                                    }

                                                    if (nval !== info.data[si_key]) {
                                                        node2.setAttribute('data-modified', 'modified');
                                                    }

                                                    bgProcess.saveCustomInfo(custom_info);
                                                    bgProcess.initCustomInfo();
                                                }; //onchange
                                                if (!is_custom) {
                                                    if (inf !== data[si_key]) {
                                                        node2.setAttribute('data-modified', 'modified');
                                                        line.setAttribute('data-modified', 'modified');
                                                    }
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
                                        if (~key.indexOf('_url') && data) {
                                            node = document.createElement('a');
                                            if (data.match(re_http))
                                                node.href = data;
                                            node.target = '_blank';
                                        } else {
                                            node = document.createElement('span');
                                        }
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
            profile('SiteInfoView', 'end');
        }

        /* jshint ignore:start */
        function SiteInfoNavi(siteinfo) {
            profile('SiteInfoNavi');
            var nav = siteinfo_nav;
            pageIndex = 0;
            while (nav.firstChild) nav.removeChild(nav.firstChild);

            for (var i = 0, len = siteinfo.length / RECORDS_PER_PAGE; i < len; i++)(function (i) {
                var a = document.createElement('a');
                a.textContent = i + 1;
                a.href = '#a' + i;
                a.id = 'a' + i;
                nav.appendChild(a);
                a.addEventListener('click', function (e) {
                    SiteInfoView(siteinfo.slice(RECORDS_PER_PAGE * i, RECORDS_PER_PAGE * (i + 1)));
                    pageIndex = i;
                    window.scrollTo(0, 0);
                    e.preventDefault();
                }, false);
            })(i);

            var r = nav.parentNode.getBoundingClientRect();
            siteinfo_table.style.marginTop = r.height + 10 + 'px';
            profile('SiteInfoNavi', 'end');
        }
        /* jshint ignore:end */

        function UpdateSiteInfo(callback) {
            var url = JSON_SITEINFO_DB,
                xhr = new XMLHttpRequest(),
                progressbar = document.getElementById('progressbar'),
                progress = document.getElementById('progress'),
                progress_percent = document.getElementById('progress_percent');

            progressbar.style.display = 'block';
            progress.style.width = '0%';

            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4 /*XMLHttpRequest.DONE*/) {
                if (xhr.status === 200) {
                  var d;
                  try {
                      d = JSON.parse(xhr.responseText);
                  } catch (bug) {
                      log('Error parsing JSON DB: ' + bug.message);
                      return;
                  }

                  progress.style.width = '100%';
                  progress_percent.textContent = 'Done!';
                  setTimeout(function(){ progressbar.style.display = 'none'; }, 600);

                  callback(d);
                } else {
                  log('Error requesting JSON DB: ' + xhr.statusText);
                }
              }
            };

            xhr.onprogress = function(evt) {
                if (!evt.lengthComputable) {
                    xhr.onprogress = null;
                    return;
                }
                var percent = Math.min(parseInt(100 * evt.loaded / evt.total, 10), 100);
                if (isNaN(percent)) return;
                progress_percent.textContent = percent + '%';
                progress.style.width = percent + '%';
            };

            xhr.open('GET', url, true); // URL can be updated to +?time in preferences in case something happens
            xhr.send(null);
        }

        function toggle_popup(id , state) {
            var popup = document.getElementById(id);
            if ((state === true) && popup.style.display !== 'none') return;
            setTimeout(function () {
                popup.style.display = (state === true) ? 'inline-block' : 'none';
            }, state ? 0 : 1500);
        }

        window.onresize = function () {
            if (entry_editor_running) {
                siteinfo_view.style.top = -window.innerHeight + 'px';
                siteinfo_view.style.bottom = window.innerHeight + 'px';
                entry_editor_running = false;
            }
            while (siteinfo_view.firstChild)
                siteinfo_view.removeChild(siteinfo_view.firstChild);
        };

        profile('UpdateSiteInfo');
        if (sessionStorage.siteinfo_wedata) {
            siteinfo_data = JSON.parse(sessionStorage.siteinfo_wedata);
            apply_fixes(siteinfo_data);
            sort_by(siteinfo_data, { number: true, key: failed });
            if (siteinfo_search_input.value == '') {
                InitSiteInfoView(siteinfo_data);
            } else {
                dispatch_html_event(siteinfo_search_input, 'input');
            }
            window.onresize();
            dispatch_event('AutoPatchWork.siteinfo', {
                siteinfo: {
                    url: '.',
                    nextLink: '//*',
                    pageElement: '//*',
                    SERVICE: true
                }
            });/**/
            profile('UpdateSiteInfo', 'end');
        } else {
            UpdateSiteInfo(function (siteinfo) {
                siteinfo_data = siteinfo;
                sessionStorage.siteinfo_wedata = JSON.stringify(siteinfo);
                apply_fixes(siteinfo_data);
                sort_by(siteinfo_data, { number: true, key: failed });
                if (document.getElementById('siteinfo_search_input').value == '') {
                    InitSiteInfoView(siteinfo_data);
                } else {
                    dispatch_html_event(document.getElementById('siteinfo_search_input'), 'input');
                }
                window.onresize();
                dispatch_event('AutoPatchWork.siteinfo', {
                    siteinfo: {
                        url: '.',
                        nextLink: '//*',
                        pageElement: '//*',
                        SERVICE: true
                    }
                });/**/
                profile('UpdateSiteInfo', 'end');
            });
        }
    }, false);
})();
