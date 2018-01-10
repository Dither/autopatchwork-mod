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

    JSON_SITEINFO_DB = bgProcess.JSON_SITEINFO_DB || JSON_SITEINFO_DB;

    var site_stats = bgProcess.site_stats,
        site_fail_stats = bgProcess.site_fail_stats,
        allow_ext_styles = bgProcess.AutoPatchWorkBG.config.allow_ext_styles,
        entry_editor_running = false,
        getWedataId = bgProcess.getWedataId || function getWedataId(wditem) {
                            return parseInt(wditem.resource_url ? wditem.resource_url.replace('http://wedata.net/items/', '0') : '', 10) || 0;
                        };

    document.addEventListener('DOMContentLoaded', function () {
        var successful = 'number_of_successful',
            failed = 'number_of_failed',
            siteinfos_array = {},
            wedata_array, filtered_wedata_array = [],
            re_http = /^https?:\/\/[^"'`]+$/ig,
            except_info = {
                'database_resource_url': true,
                'resource_url': true
            };

        document.getElementById('loader').style.display = 'none';

        window.addEventListener('AutoPatchWork.request', function(e) {
            profile('AutoPatchWork.request');
            if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;

            var infos = filtered_wedata_array.length ? filtered_wedata_array : wedata_array;
            if (!!infos && infos.length > RECORDS_PER_PAGE * (pageIndex + 1) && pageIndex < Math.ceil(infos.length/RECORDS_PER_PAGE)) {
                pageIndex++;
                SiteInfoView(infos.slice(RECORDS_PER_PAGE * pageIndex, RECORDS_PER_PAGE * (pageIndex + 1)), RECORDS_PER_PAGE * pageIndex);
            } else {
                dispatch_event('AutoPatchWork.state', {state:'off'});
            }

            dispatch_event('AutoPatchWork.pageloaded');
            profile('AutoPatchWork.request', 'end');
        }, true);

        bgProcess.siteinfo.forEach(function (v) {
            var id = parseInt(v['wedata.net.id'], 10) || 0;
            if (id) siteinfos_array[id] = v;
        });

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

        var allowed_fields = {
            'nextLink':1,
            'nextLinkSelector':1,
            'prevLink':1,
            'prevLinkSelector':1,
            'pageElement':1,
            'pageElementSelector':1,
            'url':1,
            'insertBefore':1,
            'comment':1,
            'exampleUrl':1
        };

        var custom_ext_fields = {
            'forceIframe':1,
            'allowScripts':1,
            'prevLink':1,
            'prevLinkSelector':1,
            'disableSeparator':1
        };

        var custom_fields = {
            'disabled': 1,
            'length': 1,
            'jsPatch': 1,
            'cssPatch': 1,
            'removeElement': 1,
            'forceAddressChange': 1
        };

        var essential_fields = {'url':1 , 'pageElement':1,'nextLink':1};

        var types = {
            'number': {
                number: true,
                key: 'disabled'
            },
            'name': {
                string: true,
                title: 'Item name',
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
                var infos = filtered_wedata_array.length ? filtered_wedata_array : wedata_array;
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
            if (!wedata_array || !wedata_array.length) return;
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
                filtered_wedata_array = [];
                InitSiteInfoView(wedata_array);
                return;
            }

            filtered_wedata_array = wedata_array.filter(function (sinfo) {
                var ret = [];
                for (var k in sinfo) {
                    if (sinfo.hasOwnProperty(k)) {
                        if (except_info[k]) continue;
                        var wedata_item = sinfo[k];
                        if (typeof wedata_item === 'object') {
                            for (var k2 in wedata_item) {
                                if (wedata_item.hasOwnProperty(k2)) {
                                    ret.push(wedata_item[k2]);
                                }
                            }
                        } else {
                            ret.push(wedata_item);
                        }
                    }
                }

                var dat = ret.join('\n');
                if (fullwords.map(function (k) {return new RegExp(k.replace(/\W/g, '\\$&'), 'im');}).every(function (r) {
                        return r.test(dat);
                    })) return true;

                return false;
            });

            InitSiteInfoView(filtered_wedata_array);
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

        function apply_fixes(wedata_arr) {
            //var logtext = '';
            wedata_arr.forEach(function (wedata_item) {
                var id = getWedataId(wedata_item);
                wedata_item[successful] = site_stats[id] || 0;
                wedata_item[failed] = site_fail_stats[id] || 0;
                if (!wedata_item.data) return;
                var t = wedata_item.data['cssPatch'] || wedata_item.data['Stylish'] || null;

                //clean-up unknown fields
                for (var k in wedata_item.data) {
                    if (wedata_item.data.hasOwnProperty(k) && !(k in allowed_fields)) {
                        //logtext += 'removed field from wedata[' + id +']: ' + k + '\n';
                        delete wedata_item.data[k];
                    }
                }

                wedata_item.data['prevLink'] = wedata_item.data['prevLink'] || ''; // show the field if absent
                wedata_item.data['insertBefore'] = wedata_item.data['insertBefore'] || ''; // show the field if absent
                if (allow_ext_styles) {
                    if (t && !t.match(/java/i && !t.match(/url[^\(]*\(/i)) &&
                        t.replace(/\s/g,'').length > 5) {
                        t = t.replace(/url[^\(]*\([^\)]+\)/ig,'');
                        t = t.match(/@-moz-document[^{]+{\s*([^@]+)\s*}/)[1] || t;
                        wedata_item.data['cssPatch'] = t;
                    }
                }
            });
            //log(logtext);
        }


        function InitSiteInfoView(wedata_arr) {
            SiteInfoView(wedata_arr.slice(0, RECORDS_PER_PAGE));
            SiteInfoNavi(wedata_arr);
            if (wedata_arr.length > RECORDS_PER_PAGE) {
                dispatch_event('AutoPatchWork.state', {state: 'on'});
            } else {
                dispatch_event('AutoPatchWork.state', {state: 'off'});
            }
        }

        function SiteInfoView(wedata_arr, append) {
            profile('SiteInfoView');
            entry_editor_running = false;
            toggle_popup('loader', true);
            var df = document.createDocumentFragment();

            wedata_arr.forEach(function (wedata_item, i) {
                var id = getWedataId(wedata_item),
                    current_siteinfo = siteinfos_array[id];

                var line = template_element.cloneNode(true),
                    disabled_btn = line.querySelector('input.onoff'),
                    scripts_enabled_btn = line.querySelector('input.scripts_enable'),
                    force_iframe_btn = line.querySelector('input.force_iframe'),
                    disable_separator_btn = line.querySelector('input.disable_separator'),
                    addr_change_btn = line.querySelector('input.address_change');

                var ci = bgProcess.getCustomInfo(id);
                if (ci) {
                    if (ci.keys().some(function (k) {
                            if (k in custom_fields || k in custom_ext_fields) return false;
                            return ci[k] !== wedata_item.data[k];
                        })) {
                            line.setAttribute('data-modified', 'modified');
                        }

                    disabled_btn.checked = typeof ci.disabled !== 'undefined' ? ci.disabled : false;
                    scripts_enabled_btn.checked = typeof ci.allowScripts !== 'undefined' ? ci.allowScripts : false;
                    force_iframe_btn.checked = typeof ci.forceIframe !== 'undefined' ? ci.forceIframe : false;
                    disable_separator_btn.checked = typeof ci.disableSeparator !== 'undefined' ? ci.disableSeparator : false;
                    addr_change_btn.checked = typeof ci.forceAddressChange !== 'undefined' ? ci.forceAddressChange : false;

                    if (ci.disabled) line.setAttribute('data-disabled', 'disabled' ); else line.removeAttribute('data-disabled');
                    if (ci.allowScripts) line.setAttribute('data-scripts', 'enabled' ); else line.removeAttribute('data-scripts');
                    if (ci.forceIframe) line.setAttribute('data-iframe', 'enabled' ); else line.removeAttribute('data-iframe');
                    if (ci.disableSeparator) line.setAttribute('data-separator', 'disabled' ); else line.removeAttribute('data-separator');
                    if (ci.forceAddressChange) line.setAttribute('data-addrchange', 'enabled' ); else line.removeAttribute('data-addrchange');
                    if (ci.removeElement) line.setAttribute('data-remove', 'enabled' ); else line.removeAttribute('data-remove');
                    if (ci.cssPatch) line.setAttribute('data-csspatch', 'enabled' ); else line.removeAttribute('data-csspatch');
                    if (ci.jsPatch) line.setAttribute('data-jspatch', 'enabled' ); else line.removeAttribute('data-jspatch');
                }

                var cb_handler = function(name, type, state, default_value){
                    var def_val = false, type_full = 'data-' + type;
                    if (typeof default_value !== 'undefined')
                        def_val = s2b(default_value);
                    return function() {
                        var val = this.checked;
                        if (val) line.setAttribute(type_full, state); else line.removeAttribute(type_full);
                        current_siteinfo[name] = val;
                        bgProcess.setCustomInfo(id, name, val, def_val);
                        bgProcess.saveCustomInfo();
                        bgProcess.applyCustomInfo();
                    };
                };

                disabled_btn.onchange = cb_handler('disabled', 'disabled', 'disabled');
                scripts_enabled_btn.onchange = cb_handler('allowScripts', 'scripts', 'enabled'/*, wedata_item.data['allowScripts']*/);
                force_iframe_btn.onchange = cb_handler('forceIframe', 'iframe', 'enabled'/*, wedata_item.data['forceIframe']*/);
                disable_separator_btn.onchange = cb_handler('disableSeparator', 'separator', 'disabled'/*, wedata_item.data['disableSeparator']*/);
                addr_change_btn.onchange = cb_handler('forceAddressChange', 'addrchange', 'enabled');

                df.appendChild(line);
                line.querySelector('td.index').textContent = 1 + i + (append || 0);
                wedata_item.keys().forEach(function (wedata_key, i, wedata_item_keys) {
                    var data = wedata_item[wedata_key];
                    var td = line.querySelector('td.' + wedata_key);
                    if (!td) return;
                    if (wedata_key === 'name') {
                        var name_btn = td.firstChild;
                        name_btn.onclick = function () {
                            if (entry_editor_running) return;
                            entry_editor_running = true;
                            var dl = document.createElement('dl');
                            wedata_item_keys.forEach(function (item_key) {
                                var data = wedata_item[item_key];
                                if ((item_key === 'data' && typeof data !== 'object') ||
                                    (item_key !== 'data' && typeof data === 'object'))
                                        return;
                                var dt1 = document.createElement('dt');
                                dt1.className = item_key;
                                dt1.textContent = types[item_key].title;
                                dl.appendChild(dt1);
                                var dd1 = document.createElement('dd');
                                dd1.className = item_key;
                                dl.appendChild(dd1);
                                if (item_key === 'data') {
                                    data['removeElement'] = typeof ci !== 'undefined' ? (ci['removeElement'] || '') : '';
                                    data['jsPatch'] = typeof ci !== 'undefined' ? (ci['jsPatch'] || '') : '';
                                    if (!allow_ext_styles)
                                        data['cssPatch'] = typeof ci !== 'undefined' ? (ci['cssPatch'] || '') : '';

                                    var dl2 = document.createElement('dl');
                                    dd1.appendChild(dl2);

                                    data.keys().forEach(function (si_key) {
                                        var content = '',
                                            def_val = wedata_item.data[si_key],
                                            is_custom = si_key in custom_fields || si_key in custom_ext_fields,
                                            is_essential = si_key in essential_fields;

                                        ci = bgProcess.getCustomInfo(id);
                                        if (ci) {
                                            content = ci[si_key];
                                            if (!content && !is_custom) content = data[si_key];
                                        } else if (!is_custom) {
                                            content = data[si_key];
                                        }

                                        if (content || is_custom || si_key === 'insertBefore') {
                                            var dt2 = document.createElement('dt');
                                            var dd2 = document.createElement('dd');
                                            dl2.appendChild(dt2);
                                            dl2.appendChild(dd2);
                                            dt2.textContent = si_key;
                                            var node2;
                                            if (text_to_html[si_key]) {
                                                node2 = text_to_html[si_key](content);
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
                                                node2.value = content || '';
                                                if (!current_siteinfo) node2.setAttribute('readonly', ''); // no corresponding item in local DB
                                                node2.onchange = function() {
                                                    //log(current_siteinfo,current_siteinfo[si_key], node2.value);
                                                    var val = node2.value.trim(),
                                                        is_not_empty = !!val.length;

                                                    if (val === def_val) { // remote SI equals local SI
                                                        // only way to remove `insertBefore` from storagebase is to set it equal to remote SI's
                                                        bgProcess.removeCustomInfo(id, si_key);
                                                        current_siteinfo[si_key] = def_val;
                                                    } else { // remote SI differs from local SI
                                                        if (is_not_empty || si_key === 'insertBefore') {
                                                            // we save empty `insertBefore` value for when we want to override wedata's one
                                                            bgProcess.setCustomInfo(id, si_key, val);
                                                            current_siteinfo[si_key] = val; // set runtime siteinfo field
                                                        } else {
                                                            bgProcess.removeCustomInfo(id, si_key);
                                                            if (!is_essential) delete current_siteinfo[si_key];
                                                            else {
                                                                node2.value = val = def_val;
                                                                current_siteinfo[si_key] = def_val;
                                                            }
                                                        }
                                                    }

                                                    bgProcess.saveCustomInfo();
                                                    bgProcess.initCustomInfo();

                                                    // highlight changed lines
                                                    ci = bgProcess.getCustomInfo(id);
                                                    if (ci) {
                                                        if (ci.keys().some(function (k) { if (k in custom_fields || k in custom_ext_fields) return false; if (ci[k] === '') return false; return (ci[k] !== wedata_item.data[k]); }))
                                                            line.setAttribute('data-modified', 'modified');
                                                        else
                                                            line.removeAttribute('data-modified');

                                                        if (ci.removeElement) line.setAttribute('data-remove', 'enabled' ); else line.removeAttribute('data-remove');
                                                        if (ci.cssPatch) line.setAttribute('data-csspatch', 'enabled' ); else line.removeAttribute('data-csspatch');
                                                        if (ci.jsPatch) line.setAttribute('data-jspatch', 'enabled' ); else line.removeAttribute('data-jspatch');
                                                    } else {
                                                        line.removeAttribute('data-remove');
                                                        line.removeAttribute('data-csspatch');
                                                        line.removeAttribute('data-jspatch');
                                                        line.removeAttribute('data-modified');
                                                        node2.removeAttribute('data-modified');
                                                    }

                                                    if (val !== def_val) node2.setAttribute('data-modified', 'modified');
                                                    else node2.removeAttribute('data-modified');
                                                }; //onchange

                                                if (!is_custom) {
                                                    if (content !== data[si_key]) {
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
                                    if (text_to_html[item_key]) {
                                        node = text_to_html[item_key](data);
                                    } else {
                                        if (~item_key.indexOf('_url') && data) {
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
                    } else if (text_to_html[wedata_key]) {
                        td.appendChild(text_to_html[wedata_key](data));
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
        function SiteInfoNavi(wedata_arr) {
            profile('SiteInfoNavi');
            var nav = siteinfo_nav;
            pageIndex = 0;
            while (nav.firstChild) nav.removeChild(nav.firstChild);

            for (var i = 0, len = wedata_arr.length / RECORDS_PER_PAGE; i < len; i++)(function (i) {
                var a = document.createElement('a');
                a.textContent = i + 1;
                a.href = '#a' + i;
                a.id = 'a' + i;
                nav.appendChild(a);
                a.addEventListener('click', function (e) {
                    SiteInfoView(wedata_arr.slice(RECORDS_PER_PAGE * i, RECORDS_PER_PAGE * (i + 1)));
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
                            progress.style.width = '100%';
                            progress_percent.textContent = 'JSON Error!';
                            log('Error parsing JSON DB: ' + bug.message);
                            return;
                        }

                        progress.style.width = '100%';
                        progress_percent.textContent = 'Done!';
                        setTimeout(function(){ progressbar.style.display = 'none'; }, 600);

                        callback(d);
                    } else {
                        progress.style.width = '100%';
                        progress_percent.textContent = 'HTTP Error!';
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
            wedata_array = JSON.parse(sessionStorage.siteinfo_wedata);
            apply_fixes(wedata_array);
            sort_by(wedata_array, { number: true, key: failed });
            if (siteinfo_search_input.value == '') {
                InitSiteInfoView(wedata_array);
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
            UpdateSiteInfo(function (dl_array) {
                wedata_array = dl_array;
                sessionStorage.siteinfo_wedata = JSON.stringify(dl_array);
                apply_fixes(wedata_array);
                sort_by(wedata_array, { number: true, key: failed });
                if (document.getElementById('siteinfo_search_input').value == '') {
                    InitSiteInfoView(wedata_array);
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
