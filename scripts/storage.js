var storagebase = typeof window.opera !== 'undefined' ? widget.preferences : localStorage;
(function () {
if (this.Store) return;
// Storage module that supports expiring
var Storage = this.Store = {
    get_data:function(key){
        var val = storagebase.getItem(key);
        if (val) return JSON.parse(val);
        return null;
    },
    get:function(key){
        var data = Storage.get_data(key);
        if (data.expire) {
            var expire = new Date(data.expire);
            if (expire.getTime() > new Date().getTime()) return data.value;
            else storagebase.removeItem(key);
        } else if (data.hasOwnProperty('value')) {
            return data.value;
        } else 
            return data;
        return null;
    },
    has:function(key){
        if (storagebase[key] === void 0) return false;
        var data = Storage.get_data(key);
        if (data.expire) {
            var expire = new Date(data.expire);
            if (expire.getTime() > new Date().getTime()) return true;
            else storagebase.removeItem(key);
        } else
            return true;
        return false;
    },
    set:function(key, value, expire){
        var data = {value:value};
        if (expire) {
            if (expire instanceof Date) {
                data.expire = expire.toString();
            } else {
                if (typeof expire === 'object') {
                    expire = duration(expire);
                }
                var time = new Date();
                time.setTime(time.getTime() + expire);
                data.expire = time.toString();
            }
        }
        storagebase.setItem(key, JSON.stringify(data));
    }
};
Storage.duration = duration;
function duration (dat) {
    var ret = 0, map = {
        sec:1, min:60, hour:3600, day:86400, week:604800, month:2592000, year:31536000
    };
    Object.keys(dat).forEach(function(k){ if(map[k] > 0) ret += dat[k] * map[k]; });
    return ret * 1000;
}
})();