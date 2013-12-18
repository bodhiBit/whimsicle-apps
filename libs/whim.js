/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true */
/*exported whim*/
var whim = (function(){
  "use strict";
  function Config(configFile) {
    this._configFile = configFile;
    this._saved = true;
    this._saveTimeout = null;
    this._config = null;
  }
  Config.prototype.load = function(cb) {
    var _this = this;
    if (this._saved) {
      return whim.fs.read(this._configFile, "utf8", function(result) {
        if (result.data) {
          _this._config = JSON.parse(result.data);
        } else {
          _this._config = {};
        }
        cb && cb();
      });
    } else {
      cb && cb();
    }
  };
  Config.prototype.get = function(key) {
    if (this._config) {
      return this._config[key];
    }
  };
  Config.prototype.set = function(key, value) {
    if (this._config) {
      this._saved = false;
      this._config[key] = value;
      if (!this._saveTimeout) {
        this._saveTimeout = setTimeout(function() {
          this._saveTimeout = null;
          whim.fs.write(this._configFile, JSON.stringify(this._config, null, 2), "utf8", function(result) {
            if (result.success) {
              this._saved = true;
            }
          });
        }, 1000);
      }
    }
  };

  var whim = {
    _callbacks: [],
    _cbTimeouts: [],
    config: new Config("[apps]/config.json"),
    
    _init: function() {
      window.addEventListener("message", this._onMessage);
      this.app._init();
    },
    _onMessage: function(event) {
      var data = JSON.parse(event.data);
      if (data.success !== undefined) {
        if (data.callbackId !== undefined) {
          clearTimeout(whim._cbTimeouts[data.callbackId]);
          whim._callbacks[data.callbackId](data);
          whim._callbacks[data.callbackId] = null;
        }
      } else {
        var cb = function(data) {
          whim._respondToRequest(event, data);
        };
        switch (data.intent) {
        case "load":
          whim.app.load(data.path, cb);
          break;
        case "save":
          whim.app.save(data.path, cb);
          break;
        case "quit":
          whim.app.quit(cb);
          break;
        case "open":
          whim.app.open(data.url, cb);
          break;
        case "openPath":
          whim.app.openPath(data.path, cb);
          break;
        case "openPathWith":
          whim.app.openPathWith(data.path, data.app, cb);
          break;
        case "close":
          whim.app.close(event.source.frameElement, cb);
          break;
        case "closeAll":
          whim.app.closeAll(cb);
          break;
        case "appInfo":
          if (event.source !== window.parent) {
            whim.app._receiveAppInfo(event.source.frameElement, data);
          }
          break;
        }
      }
    },
    _respondToRequest: function(event, data) {
      var attrname, _data = JSON.parse(event.data);
      if (data) {
        for (attrname in data) {
          if (data.hasOwnProperty(attrname)) {
            _data[attrname] = data[attrname];
          }
        }
      }
      event.source && event.source.postMessage(JSON.stringify(_data), "*");
    },
    _postRequest: function(frame, data, cb) {
      if (cb) {
        var cbId = 0;
        while (this._callbacks[cbId]) {
          cbId++;
        }
        this._callbacks[cbId] = cb;
        this._cbTimeouts[cbId] = setTimeout(function() {
          whim._callbacks[cbId] = function(data) {
            console.log("Response came too late...", data);
          };
          cb({
            success: false,
            status: "callback timeout"
          });
        }, 10000);
        data.callbackId = cbId;
      }
      delete data.success;
      delete data.status;
      frame.postMessage(JSON.stringify(data), "*");
    },
    
    sysRequest: function(data, cb) {
      return this._postRequest(window.top, data, cb);
    },
    postToParent: function(data, cb) {
      return this._postRequest(window.parent, data, cb);
    },
    postToChildren: function(data, cb) {
      var frames = document.querySelectorAll("iframe"),
        response = {
          success: true,
          status: "ok",
          responses: []
        },
        responsesLeft = frames.length;
      
      if (!cb) {
        cb = function(r) {
          console.log("Response from child frame", r);
        };
      }
      if (responsesLeft === 0) {
        cb(response);
      } else {
        var each = function(r) {
          responsesLeft--;
          response.responses.push(r);
          if (!r.success) {
            response.success = r.success;
            response.status = r.status;
          }
          if (responsesLeft === 0) {
            cb(response);
          }
        };
        for(var i=0;i<frames.length;i++) {
          this._postRequest(frames[i], data, each);
        }
      }
    },
    

    app: {
      name: null,
      title: "I'm not giving my name to a machine!",
      type: null,
      icon: null,
      fileEncoding: "utf8",
      get dirSorting() { return this.fileEncoding; },
      set dirSorting(val) { this.fileEncoding = val; },
      _filePath: null,
      get filePath() { return this._filePath; },
      _fileModified: new Date(),
      _fileContent: null,
      get fileContent() { return this._fileContent; },
      _editorContent: null,
      get editorContent() { return this._editorContent; },
      set editorContent(val) {
        if (this._editorContent !== val) {
          this._editorContent = val;
          this._sendAppInfo();
        }
      },
      get contentModified() {
        return typeof this._fileContent !== "object" &&
            this._fileContent !== this._editorContent;
      },
      _fileWatcherTO: null,
      
      _init: function() {
        var name = location.pathname;
        name = name.substr(0, name.lastIndexOf("/"));
        name = name.substr(name.lastIndexOf("/")+1);
        this.name = name;
        this.title = document.title;
        if (document.querySelector('meta[name="appType"]')) {
          this.type = document.querySelector('meta[name="appType"]').getAttribute("content");
        }
        if (document.querySelector('link[rel="icon"]')) {
          this.icon = document.querySelector('link[rel="icon"]').href;
        }
        this.config = new Config("[apps]/"+this.name+"/config.json");
        window.addEventListener("keydown", this._keydown);
      },
      _keydown: function(event) {
        if (event.ctrlKey) {
          switch (event.which) {
          case 82: // R
            whim.app.reload();
            event.preventDefault();
            break;
          case 83: // S
            whim.app.save();
            event.preventDefault();
            break;
          case 87: // W
            whim.app.quit();
            event.preventDefault();
            break;
          }
        } else {
          switch (event.which) {
          case 116: // F5
            whim.app.preview();
            event.preventDefault();
            break;
          case 117: // F6
            whim.app.start();
            event.preventDefault();
            break;
          }
        }
      },
      _sendAppInfo: function() {
        whim.postToParent({
          intent: "appInfo",
          title: this.title,
          appName: this.name,
          appType: this.type,
          icon: this.icon,
          path: this.filePath,
          isModified: this.contentModified
        });
      },
      _receiveAppInfo: function(frame, data) {
        frame.setAttribute("title", data.title);
        frame.setAttribute("data-path", data.path);
        frame.setAttribute("data-appName", data.appName);
        frame.setAttribute("data-appType", data.appType);
        frame.setAttribute("data-icon", data.icon);
        if (data.isModified) {
          frame.classList.add("modified");
        } else {
          frame.classList.remove("modified");
        }
        this._fileContent = 0;
        this.editorContent = document.querySelectorAll("iframe.modified").length;
        if (this.onframeupdate) {
          this.onframeupdate(frame, data);
        }
      },
      _fileWatcher: function() {
        whim.fs.probe(whim.app.filePath, function(result) {
          if (result.success) {
            var diff = result.properties.mtime - whim.app._fileModified;
            if (diff !== 0) {
              whim.fs.read(whim.app.filePath, whim.app.fileEncoding, function(result) {
                if (result.entries || (result.data && result.data !== whim.app.fileContent)) {
                  if (whim.app.contentModified) {
                    if (confirm("File has been modified!\nReload?")) {
                      whim.app.load();
                    }
                  } else {
                    whim.app.load();
                  }
                }
              });
              whim.app._fileModified = result.properties.mtime;
            }
          }
        });
      },
      
      ifSaved: function(allow, deny) {
        if (this.contentModified) {
          if (confirm("There are unsaved changes!\nDiscard?")) {
            allow();
          } else {
            deny && deny();
          }
        } else {
          allow();
        }
      },
      on: function(command, cb){
        this["on"+command.toLowerCase()] = cb;
        if (command.toLowerCase() === "loaded") {
          this.load(window.unescape(location.hash.substr(1)));
        }
        if (command.toLowerCase() === "open") {
          var urls = location.hash.substr(1).split("#");
          for (var i = 0; i < urls.length; i++) {
            urls[i] && this.open(window.unescape(urls[i]));
          }
        }
      },
      reload: function() {
        this.ifSaved(function() {
          location.reload(true);
        });
      },
      load: function(path, cb) {
        if (this.onload) {
          this.onload(path || this.filePath);
        }
        if (path) {
          this._filePath = path;
        }
        if (this.filePath) {
          this._fileContent = null;
          this._editorContent = null;
          whim.fs.read(this.filePath, this.fileEncoding, function(result) {
            if (typeof result.data === "string") {
              whim.app._fileContent = result.data;
              whim.app._editorContent = result.data;
            }
            if (typeof result.entries === "object") {
              whim.app._fileContent = result.entries;
            }
            if (whim.app.onloaded) {
              whim.app.onloaded(result);
            }
            if (cb) {
              cb(result);
            }
            whim.app._sendAppInfo();
          });
        } else if(this.onopen) {
          whim.postToChildren({
            intent: "load"
          }, cb);
        } else if(cb) {
          cb({
            success: false,
            status: "no path"
          });
        }
      },
      save: function(path, cb) {
        if (this.onsave) {
          this.onsave(path || this.filePath);
        }
        if (path) {
          this._filePath = path;
        }
        if (this.filePath) {
          var data = this.editorContent;
          whim.fs.write(this.filePath, data, this.fileEncoding, function(result) {
            if (result.success) {
              whim.app._fileContent = data;
            }
            if (whim.app.onsaved) {
              whim.app.onsaved(result);
            }
            if (cb) {
              cb(result);
            }
            whim.app._sendAppInfo();
          });
        } else if(this.onopen) {
          whim.postToChildren({
            intent: "save"
          }, cb);
        } else if(cb) {
          cb({
            success: false,
            status: "no path"
          });
        }
      },
      quit: function(cb) {
        this.ifSaved(function() {
          whim.postToParent({
            intent: "close",
            url: location
          }, cb);
        }, function() {
          cb({
            success: false,
            status: "canceled"
          });
        });
      },
      open: function(url, cb) {
        if (url.substr(0,1) === "/" || url.substr(0,1) === "[") {
          return this.openPath(url, cb);
        } else if (url.indexOf("@")>0 && url.indexOf("/")>url.indexOf("@")) {
          var app = url.substr(0, url.indexOf("@"));
          var path = url.substr(url.indexOf("@")+1);
          return this.openPathWith(path, app, cb);
        } else if (this.onopen) {
          return this.onopen(url, cb);
        } else {
          whim.postToParent({
            intent: "open",
            url: url
          }, cb);
        }
      },
      openPath: function(path, cb) {
        var app = "textEdit";
        whim.config.load(function() {
          whim.fs.probe(path, function(result) {
            if (result.success) {
              if (result.properties.isDir) {
                if (path.substr(-1) !== "/") { path = path+"/"; }
              } else if (result.properties.isBinary) {
                app = whim.config.get("defaultApps")[".bin"];
              } else {
                app = whim.config.get("defaultApps")[".txt"];
              }
              for (var end in whim.config.get("defaultApps")) {
                if (whim.config.get("defaultApps").hasOwnProperty(end)) {
                  if (path.substr(-end.length) === end) {
                    app = whim.config.get("defaultApps")[end];
                  }
                }
              }
              whim.app.openPathWith(path, app, cb);
            } else {
              cb(result);
            }
          });
        });
      },
      openPathWith: function(path, app, cb) {
        whim.config.load(function() {
          whim.app.open(whim.config.get("appsUrl")+app+"/index.html#"+window.escape(path), cb);
        });
      },
      close: function(frame, cb) {
        if (this.onclose) {
          return this.onclose(frame, cb);
        } else {
          cb({
            success: false,
            status: "no handler"
          });
        }
      },
      closeAll: function(cb) {
        this.ifSaved(function() {
          whim.postToChildren({
            intent: "quit"
          }, cb);
        }, function() {
          cb({
            success: false,
            status: "canceled"
          });
        });
      },
      preview: function() {
        var url;
        whim.config.load(function() {
          for(var server in whim.config.get("servers")) {
            if (whim.config.get("servers").hasOwnProperty(server)) {
              if (whim.app.filePath.substr(0, server.length) === server) {
                url = whim.config.get("servers")[server] + whim.app.filePath.substr(server.length);
              }
            }
          }
          if (url) {
            whim.os.open(url);
          } else {
            whim.fs.probe(whim.app.filePath, function(result) {
              if (result.properties && result.properties.url) {
                whim.os.open(result.properties.url);
              }
            });
          }
        });
      },
      start: function() {
        whim.os.open(whim.app.filePath);
      },
      startFileWatcher: function(interval) {
        this.stopFileWatcher();
        this._fileWatcherTO = setInterval(this._fileWatcher, interval || 5000);
      },
      stopFileWatcher: function() {
        clearInterval(this._fileWatcherTO);
      }
    },
    fs: {
      _prepareProperties: function(properties) {
        properties.lowerCaseName = properties.name.toLowerCase();
        if (properties.name.indexOf(".") > 0) {
          properties.extName = properties.lowerCaseName.substr(properties.name.lastIndexOf(".")+1);
        } else {
          properties.extName = "";
        }
        properties.atime = new Date(properties.atime);
        properties.ctime = new Date(properties.ctime);
        properties.mtime = new Date(properties.mtime);
        return properties;
      },
      
      read: function(path, encodingOrSortBy, cb) {
        return whim.sysRequest({
          syscall: "read",
          path: path,
          encoding: encodingOrSortBy
        }, function(data) {
          if (data.entries) {
            for (var i = 0; i < data.entries.length; i++) {
              data.entries[i] = whim.fs._prepareProperties(data.entries[i]);
            }
            data.entries.sort(function(a, b){
              var k = 0, c = 0, reverse;
              while (c === 0 && k < encodingOrSortBy.length) {
                var key = encodingOrSortBy[k];
                reverse = key.charAt(0)==="-"?-1:1;
                if (key.charAt(0)==="-") { key = key.substr(1); }
                if (a[key] < b[key]) { c = -1; }
                if (a[key] > b[key]) { c = 1; }
                k++;
              }
              return c * reverse;
            });
          }
          cb(data);
        });
      },
      write: function(path, data, encoding, cb) {
        return whim.sysRequest({
          syscall: "write",
          path: path,
          data: data,
          encoding: encoding
        }, cb);
      },
      delete: function(path, cb) {
        return whim.sysRequest({
          syscall: "delete",
          path: path
        }, cb);
      },
      probe: function(path, cb) {
        return whim.sysRequest({
          syscall: "probe",
          path: path
        }, function(data) {
          if (data.properties) {
            data.properties = whim.fs._prepareProperties(data.properties);
          }
          cb(data);
        });
      },
      rename: function(path, destination, cb) {
        return whim.sysRequest({
          syscall: "rename",
          path: path,
          destination: destination
        }, cb);
      },
      copy: function(path, destination, cb) {
        return whim.sysRequest({
          syscall: "copy",
          path: path,
          destination: destination
        }, cb);
      }
    },
    os: {
      run: function(command, cb) {
        return whim.sysRequest({
          syscall: "run",
          command: command
        }, cb);
      },
      open: function(url, cb) {
        return whim.sysRequest({
          syscall: "open",
          url: url
        }, cb);
      }
    }
  };
  whim._init();
  return whim;
}());