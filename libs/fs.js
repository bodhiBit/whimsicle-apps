/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true */
/*exported fs*/
var fs = (function(){
  "use strict";
  var fs = {
    _callbacks: [ true ],
    
    _init: function() {
      window.addEventListener("message", this._onMessage);
      console.log("fs.js initialized!");
    },
    _syscall: function(data, cb) {
      if (cb) {
        var cbId = 0;
        while (this._callbacks[cbId]) {
          cbId++;
        }
        this._callbacks[cbId] = cb;
        data.callbackId = cbId;
      }
      window.top.postMessage(JSON.stringify(data), "*");
    },
    _onMessage: function(event) {
      console.log("fs.js got a message!", event.data);
      var data = JSON.parse(event.data);
      if (event.source === window.top && data.callbackId) {
        if (data.properties) {
          fs._prepProps(data.properties);
          data.props = data.properties;
        }
        fs._callbacks[data.callbackId](data);
        fs._callbacks[data.callbackId] = null;
      }
    },
    _ajax: function(path, postObj, cb) {
      postObj.path = path;
      postObj.destination = postObj.dest;
      postObj.syscall = postObj.cmd;
      return this._syscall(postObj, cb);
      
      var r = new XMLHttpRequest();
      r.open("POST", "/fs"+path);
      r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      var formStr = "";
      for (var key in postObj) {
        if (postObj.hasOwnProperty(key)) {
          formStr += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(postObj[key]);
        }
      }
      r.send(formStr.substr(1));
      r.onreadystatechange = function () {
        if (r.readyState === 4 && cb) {
          if (r.status === 200) {
            var result = JSON.parse(r.responseText);
            if (result.props) {
              fs._prepProps(result.props);
            }
            cb(result);
          } else {
            cb({
              success: false,
              status: "http error",
              request: r
            });
          }
        }
      };
      return r;
    },
    _prepProps: function(props) {
      props.lowerCaseName = props.name.toLowerCase();
      if (props.name.indexOf(".") > 0) {
        props.extName = props.lowerCaseName.substr(props.name.lastIndexOf(".")+1);
      } else {
        props.extName = "";
      }
      props.atime = new Date(props.atime);
      props.ctime = new Date(props.ctime);
      props.mtime = new Date(props.mtime);
    },
    defaultTextEncoding: "utf8",
    defaultBinaryEncoding: "base64",
    getFileUrl: function(path) {
      return "file://" + path;
    },
    readTextFile: function(path, cb) {
      if (path.substr(-1) === "/") { path = path.substr(0, path.length-1); }
      return this._ajax(path, { cmd: "read", encoding: this.defaultTextEncoding }, cb);
    },
    readBinaryFile: function(path, cb) {
      if (path.substr(-1) === "/") { path = path.substr(0, path.length-1); }
      return this._ajax(path, { cmd: "read", encoding: this.defaultBinaryEncoding }, cb);
    },
    writeTextFile: function(path, data, cb) {
      if (path.substr(-1) === "/") { path = path.substr(0, path.length-1); }
      return this._ajax(path, { cmd: "write", encoding: this.defaultTextEncoding, data: data }, cb);
    },
    writeBinaryFile: function(path, data, cb) {
      if (path.substr(-1) === "/") { path = path.substr(0, path.length-1); }
      return this._ajax(path, { cmd: "write", encoding: this.defaultBinaryEncoding, data: data }, cb);
    },
    deleteFile: function(path, cb) {
      if (path.substr(-1) === "/") { path = path.substr(0, path.length-1); }
      return this._ajax(path, { cmd: "delete" }, cb);
    },
    getProps: function(path, cb) {
      return this._ajax(path, { cmd: "probe" }, cb);
    },
    listDir: function(path, sortBy, cb) {
      if (path.substr(-1) !== "/") { path = path+"/"; }
      if (!cb) { // sortBy is optional
        cb = sortBy;
        sortBy = undefined;
      }
      return this._ajax(path, { cmd: "read" }, function(r){
        if (!r.hasOwnProperty("entries")) {
          r.success = false;
          r.status = "not a directory";
        }
        if (r.success) {
          for(var i=0;i<r.entries.length;i++) {
            fs._prepProps(r.entries[i]);
          }
          if (sortBy) {
            r.entries.sort(function(a, b){
              var k = 0, c = 0, reverse;
              while (c === 0 && k < sortBy.length) {
                var key = sortBy[k];
                reverse = key.charAt(0)==="-"?-1:1;
                if (key.charAt(0)==="-") { key = key.substr(1); }
                if (a[key] < b[key]) { c = -1; }
                if (a[key] > b[key]) { c = 1; }
                k++;
              }
              return c * reverse;
            });
          }
        }
        if (cb) {
          cb(r);
        }
      });
    },
    makeDir: function(path, cb) {
      if (path.substr(-1) !== "/") { path = path+"/"; }
      return this._ajax(path, { cmd: "write" }, cb);
    },
    removeDir: function(path, cb) {
      if (path.substr(-1) !== "/") { path = path+"/"; }
      return this._ajax(path, { cmd: "delete" }, cb);
    },
    delete: function(path, cb) {
      if (path.substr(-1) === "/") {
        return this.removeDir(path, cb);
      } else {
        return this.deleteFile(path, function(r){
          if (r.status === "err" && r.err.code === "EISDIR") {
            this.removeDir(path, cb);
          } else {
            if (cb) {
              cb(r);
            }
          }
        });
      }
    },
    rename: function(path, dest, cb) {
      return this._ajax(path, { cmd: "rename", dest: dest }, cb);
    },
    copy: function(path, dest, cb) {
      return this._ajax(path, { cmd: "copy", dest: dest }, cb);
    }
  };
  fs._init();
  return fs;
}());