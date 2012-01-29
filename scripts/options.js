Object.keys || (Object.keys = function(k) {
    var r = [];
    for(var i in k) r.push(i);
    return r;
});
var imageTick = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC';
var imageCross = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIhSURBVDjLlZPrThNRFIWJicmJz6BWiYbIkYDEG0JbBiitDQgm0PuFXqSAtKXtpE2hNuoPTXwSnwtExd6w0pl2OtPlrphKLSXhx07OZM769qy19wwAGLhM1ddC184+d18QMzoq3lfsD3LZ7Y3XbE5DL6Atzuyilc5Ciyd7IHVfgNcDYTQ2tvDr5crn6uLSvX+Av2Lk36FFpSVENDe3OxDZu8apO5rROJDLo30+Nlvj5RnTlVNAKs1aCVFr7b4BPn6Cls21AWgEQlz2+Dl1h7IdA+i97A/geP65WhbmrnZZ0GIJpr6OqZqYAd5/gJpKox4Mg7pD2YoC2b0/54rJQuJZdm6Izcgma4TW1WZ0h+y8BfbyJMwBmSxkjw+VObNanp5h/adwGhaTXF4NWbLj9gEONyCmUZmd10pGgf1/vwcgOT3tUQE0DdicwIod2EmSbwsKE1P8QoDkcHPJ5YESjgBJkYQpIEZ2KEB51Y6y3ojvY+P8XEDN7uKS0w0ltA7QGCWHCxSWWpwyaCeLy0BkA7UXyyg8fIzDoWHeBaDN4tQdSvAVdU1Aok+nsNTipIEVnkywo/FHatVkBoIhnFisOBoZxcGtQd4B0GYJNZsDSiAEadUBCkstPtN3Avs2Msa+Dt9XfxoFSNYF/Bh9gP0bOqHLAm2WUF1YQskwrVFYPWkf3h1iXwbvqGfFPSGW9Eah8HSS9fuZDnS32f71m8KFY7xs/QZyu6TH2+2+FAAAAABJRU5ErkJggg==';
//var imgRefresh = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqwQtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimwwf3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3nGEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJggg==';
//var imgSave = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAH+SURBVBgZBcE9i11VGAbQtc/sO0OCkqhghEREAwpWAWUg8aMVf4KFaJEqQtAipTZWViKiCGOh2Ap2gmJhlSIWFsFOxUK0EsUM3pl79n4f12qHb3z3Fh7D83gC95GOJsDe0ixLk5Qq/+xv/Lw9Xd+78/HLX3Y8fXTr2nWapy4eCFKxG7Fby97SnDlYtMbxthyfzHO//nl85fNvfvnk8MbX5xa8IHx1518Vkrj54Q+qQms2vVmWZjdiu5ZR2rT01166/NCZg/2PFjwSVMU6yjoC1oq+x6Y3VbHdlXWExPd379nf7Nmejv2Os6OC2O4KLK0RNn3RNCdr2Z5GJSpU4o+/TkhaJ30mEk5HwNuvX7Hpi76wzvjvtIwqVUSkyjqmpHS0mki8+9mPWmuWxqYvGkbFGCUAOH/+QevYI9GFSqmaHr5wkUYTAlGhqiRRiaqiNes6SOkwJwnQEqBRRRJEgkRLJGVdm6R0GLMQENE0EkmkSkQSVVMqopyuIaUTs0J455VLAAAAAODW0U/GiKT0pTWziEj44PZ1AAAAcPPqkTmH3QiJrlEVDXDt0qsAAAAAapa5BqUnyaw0Am7//gUAAAB49tEXzTmtM5KkV/y2G/X4M5fPao03n/sUAAAAwIX7y5yBv9vhjW/fT/IkuSp5gJKElKRISYoUiSRIyD1tufs/IXxui20QsKIAAAAASUVORK5CYII=';
var imgLoad = 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=='; 
// main
(function option_init(opt) {
    var g = this;
    
    if(this.chrome) {
        bgProcess = chrome.extension.getBackgroundPage();
        AutoPatchWork = bgProcess.AutoPatchWork;
    } else if(this.safari && !opt) {
        safari.self.tab.dispatchMessage('option_init');
        safari.self.addEventListener('message', function(evt) {
            if(evt.name === 'option_init') {
                option_init(evt.message);
            } else if(evt.name === 'updated_siteinfo') {
                bgProcess.callback();
            }
        }, false);
        return;
    } else if(this.opera && !opt) {
        opera.extension.onmessage = function(evt) {
            if(evt.data.name === 'option_init') {
                option_init(evt.data.data);
            } else if(evt.data.name === 'updated_siteinfo') {
                bgProcess.callback();
            }
        };
        opera.extension.postMessage({name: 'option_init'});
        return;
    } else if(opt && g.safari) {
        AutoPatchWork = opt;
        ['save_css', 'reset_css', 'save_custom_patterns', 'reset_custom_patterns' ,'add_disabled_site', 'delete_disabled_site'].forEach(function(action) {
            AutoPatchWork[action] = function() {
                safari.self.tab.dispatchMessage('invoke_action', {
                    action: action,
                    args: Array.prototype.slice.call(arguments)
                });
            };
        });
        AutoPatchWork.update = function() {
            safari.self.tab.dispatchMessage('invoke_action', {
                action: 'update',
                config: AutoPatchWork.config
            });
        };
        AutoPatchWork.save_disabled_site = function() {
            safari.self.tab.dispatchMessage('invoke_action', {
                action: 'save_disabled_site',
                disabled_sites: AutoPatchWork.disabled_sites
            });
        };
        bgProcess = {
            UpdateSiteinfo: function(callback) {
                bgProcess.callback = callback;
                safari.self.tab.dispatchMessage('invoke_action', {action: 'UpdateSiteinfo'});
            }
        };
    } else if(opt && g.opera) {
        AutoPatchWork = opt;
        ['save_css', 'reset_css', 'save_custom_patterns', 'reset_custom_patterns', 'add_disabled_site', 'delete_disabled_site'].forEach(function(action) {
            AutoPatchWork[action] = function() {
                opera.extension.postMessage({
                    name: 'invoke_action', data: {
                        action: action, 
                        args: Array.prototype.slice.call(arguments)
                    }
                });
            };
        });
        AutoPatchWork.update = function() {
            opera.extension.postMessage({
                name: 'invoke_action', data: {
                    action: 'update',
                    config: AutoPatchWork.config
                }
            });
        };
        AutoPatchWork.save_disabled_site = function() {
            opera.extension.postMessage({
                name: 'invoke_action', data: {
                    action: 'save_disabled_site',
                    disabled_sites: AutoPatchWork.disabled_sites
                }
            });
        };
        bgProcess = {
            UpdateSiteinfo: function(callback) {
                bgProcess.callback = callback;
                opera.extension.postMessage({
                    name: 'invoke_action', data: {action: 'UpdateSiteinfo'}
                });
            }
        };
    }

    var WIDTH = 800;
    var HEIGHT = Math.max(window.innerHeight - 100, 500);

    var i18n = this.chrome ? chrome.i18n : this.safari ? {
        getAcceptLanguages: function() {},
        getMessage: function() {}
    } : {
        getAcceptLanguages: function() {},
        getMessage: function() {}
    };

    function L10N() {
        i18n.getAcceptLanguages(function(langs) {
            if(langs.indexOf('ja') < 0) {
                // We should probably load history from language JSONs via embedded AJAX
                document.querySelector('#menu-tabs > li.history').style.display = 'none';
            }
        });
        var elems = document.querySelectorAll('*[class^="MSG_"]');
        Array.prototype.forEach.call(elems, function(node) {
            var key = node.className.match(/MSG_(\w+)/)[1];
            var message = i18n.getMessage(key);
            if(message)
                node.textContent = message;
        });
    }

    L10N();
    // General settings tab
    var open_siteinfo_manager = document.getElementById('open_siteinfo_manager');
    open_siteinfo_manager.addEventListener('click', function(e) {
        if(window.chrome) {
            window.chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.update(tab.id, {url: "siteinfo_manager.html"});
            });
        } else if(window.safari) {
            safari.self.tab.dispatchMessage('options', { manage: true });
        } else if(window.opera) {
            opera.extension.postMessage({ name: 'options', data: {manage: true} });
        }
    }, false);
    var update_siteinfo = document.getElementById('update_siteinfo');
    var update_siteinfo_output = document.getElementById('update_siteinfo');
    update_siteinfo.addEventListener('click', function(e) {
        update_siteinfo.disabled = true;
        update_siteinfo_output.innerHTML = '<img src="'+imgLoad+'"> Updating...';;
        bgProcess.UpdateSiteinfo(function() {
            update_siteinfo_output.innerHTML = '<img src="'+imageTick+'"> SITEINFO updated';;
            update_siteinfo.disabled = false;
        }, function() {
            update_siteinfo_output.innerHTML = '<img src="'+imageCross+'"> SITEINFO unchanged';
        })
    }, false);

    $X('//input[@type="radio"]').forEach(function(box) {
        var id = box.id;
        var name = box.name;
        var val = AutoPatchWork.config[name] || 'on';
        if(val == box.value) {
            box.checked = true;
        } else {
        }
        box.addEventListener('click', function() {
            AutoPatchWork.config[name] = box.value;
            AutoPatchWork.update();
        }, false);
    });
    $X('/html/body/div/div/section/div/input[@type="checkbox"]').forEach(function(box) {
        var id = box.id;
        var val = AutoPatchWork.config[id];
        if(val === true || val === false) {
            box.checked = val;
        } else {
            //return;
        }
        box.addEventListener('click', function() {
            if(box.checked) {
                AutoPatchWork.config[id] = true;
            } else {
                AutoPatchWork.config[id] = false;
            }
            AutoPatchWork.update();
        }, false);
    });
    $X('/html/body/div/div/section/div/input[@type="range"]').forEach(function(box) {
        var id = box.id;
        var output = document.querySelector('#' + id + '_value');
        var val = AutoPatchWork.config[id];
        box.value = val;
        output.textContent = box.value;
        box.addEventListener('change', function() {
            AutoPatchWork.config[id] = +this.value;
            output.textContent = box.value;
            AutoPatchWork.update();
        }, false);
    });
    
    // Custom CSS for separator tab
    var css_text = document.getElementById('css_text');
    css_text.value = AutoPatchWork.css;
    var apply_css = document.getElementById('apply_css');
    apply_css.addEventListener('click', function() {
        AutoPatchWork.save_css(css_text.value);
    }, false);
    var reset_css = document.getElementById('reset_css');
    reset_css.addEventListener('click', function() {
        AutoPatchWork.reset_css();
        setTimeout(function() {
            css_text.value = AutoPatchWork.css = storagebase.AutoPatchWorkCSS;
        }, 0);
    }, false);
    
    // Custom SITEINFO patterns tab
    var custom_patterns = document.getElementById('custom_patterns');
    custom_patterns.value = storagebase.AutoPatchWorkPatterns;
    var apply_custom_patterns = document.getElementById('apply_custom_patterns');
    apply_custom_patterns.addEventListener('click', function() {
        try {
            JSON.parse(custom_patterns.value);
        } catch (bug) {
            alert('[AutoPatchWork] Invalid JSON format. Check original SITEINFO for the reference.');
            return;
        }
        AutoPatchWork.save_custom_patterns(custom_patterns.value);
    }, false);
    var reset_custom_patterns = document.getElementById('reset_custom_patterns');
    reset_custom_patterns.addEventListener('click', function() {
        AutoPatchWork.reset_custom_patterns();
        setTimeout(function() {
            custom_patterns.value = storagebase.AutoPatchWorkPatterns;
        }, 0);
    }, false);
    
    // Black
    var filter_list = document.getElementById('filter_list');
    var filter_text = document.getElementById('filter_text');
    var filter_type = document.getElementById('filter_type');
    var add_filter = document.getElementById('add_filter');
    AutoPatchWork.disabled_sites.forEach(create_filter);

    function create_filter(site) {
        var li = document.createElement('li');
        var types = filter_type.cloneNode(true);
        types.id = '';
        li.appendChild(types);
        types.value = site.type;
        types.addEventListener('change', function() {
            site.type = types.value;
            AutoPatchWork.save_disabled_site();
        }, false);
        var input = document.createElement('input');
        input.type = 'text';
        input.value = site.matcher;
        input.addEventListener('input', function() {
            site.matcher = input.value;
            AutoPatchWork.save_disabled_site();
        }, false);
        li.appendChild(input);
        var del = document.createElement('button');
        del.textContent = i18n.getMessage('del') || 'Del';
        del.addEventListener('click', function() {
            input.disabled = !input.disabled;
            if(input.disabled) {
                AutoPatchWork.delete_disabled_site(site);
                del.textContent = i18n.getMessage('undo') || 'Undo';
            } else {
                AutoPatchWork.add_disabled_site(site);
                del.textContent = i18n.getMessage('del') || 'Del';
            }
        }, false);
        li.appendChild(del);
        filter_list.appendChild(li);
    }

    add_filter.addEventListener('click', function() {
        var site = filter_text.value;
        if(!site)
            return;
        var type = filter_type.value;
        if(type === 'regexp') {
            try {
                new RegExp(site);
            } catch (bug) { return; }
        }
        site = { matcher: site, type: type };
        create_filter(site);
        AutoPatchWork.add_disabled_site(site);
        filter_text.value = '';
    }, false);
    var sections = $X('//section[contains(@class, "content")]');
    var inner_container = document.getElementById('inner-container');
    var container = document.getElementById('base');
    inner_container.style.width = sections.length * (WIDTH + 20) + 'px';
    //inner_container.style.height = HEIGHT + 'px';
    //container.style.height = HEIGHT + 'px';
    container.style.marginTop = '-2px';
    sections.forEach(function(section, _i) {
        section.style.visibility = 'hidden';
        section.style.height = '100px';
    });
    var btns = $X('id("menu-tabs")/li/a');
    var default_title = document.title;
    btns.forEach(function(btn, i, btns) {
        btn.addEventListener('click', function(evt) {
            evt.preventDefault();
            btns.forEach(function(btn) {
                btn.parentNode.className = '';
            })
            btn.parentNode.className = 'selected';
            sections[i].style.visibility = 'visible';
            sections[i].style.height = 'auto';
            new Tween(inner_container.style, {
                marginLeft: {
                    to: i * -WIDTH, tmpl: '$#px'
                }, time: 0.2, onComplete: function() {
                    document.title = default_title + btn.hash; !window.opera && (location.hash = btn.hash);
                    window.scrollBy(0, -1000);
                    sections.forEach(function(section, _i) {
                        if(i !== _i) {
                            section.style.visibility = 'hidden';
                            section.style.height = '100px';
                        }
                    });
                }
            });
        }, false);
    });
    if(location.hash) {
        sections.some(function(section, i) {
            if('#' + section.id === location.hash) {
                btns.forEach(function(btn) {
                    btn.parentNode.className = '';
                })
                btns[i].parentNode.className = 'selected';
                inner_container.style.marginLeft = -WIDTH * i + 'px';
                section.style.visibility = 'visible';
                section.style.height = 'auto';
                document.title = default_title + location.hash;
            }
        });
    } else {
        sections[0].style.height = 'auto';
        sections[0].style.visibility = 'visible';
        document.title = default_title + '#' + sections[0].id;
    }
})();
