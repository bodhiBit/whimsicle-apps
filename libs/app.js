/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true */
/*global fs*/
/*exported app*/
var app = (function(){
  "use strict";
  alert("fs.js is depricated! use whim.js instead..");
  var app = {
    config: {
      "editor": "textEdit",
      "filemanager": "fileMan"
    },
    title: null,
    file: null,
    _state: 1,
    lastSaved: null,
    
    _init: function(){
      this.title = document.title;
      window.addEventListener("message", this._getMessage);
      window.addEventListener("hashchange", this._hashchange);
      window.addEventListener("keydown", this._keydown);
      window.addEventListener("beforeunload", this._beforeunload);
      if (typeof(fs) === "object") {
        setInterval(this._fsWatcher, 10000);
      }
      window.top.postMessage(JSON.stringify({ syscall: "config" }), "*");
    },
    
    _hashchange: function(event){
      if (app.file && app.isModified()) {
        if (confirm("Unsaved changes has been made!\nDiscard these changes?")) {
          app.setLoaded();
          app._hashchange(event);
        }
      } else if (location.hash.length > 1) {
        app.load(location.hash.substr(1));
      } else {
        app.file = null;
        app.setLoaded();
      }
    },
    _keydown: function(event){
      if (event.ctrlKey) {
        switch (event.which) {
        case 83:
          app.save();
          event.preventDefault();
          break;
        case 87:
          app.close();
          event.preventDefault();
          break;
        }
      }
    },
    _beforeunload: function(event){
      if (app.isModified()) {
        event.preventDefault();
        return "Unsaved changes has been made!";
      }
    },
    _getMessage: function(event){
      var data = JSON.parse(event.data);
      if (data.cmd) {
        switch(data.cmd) {
        case "load":
          app.load(data.file);
          break;
        case "save":
          app.save();
          break;
        case "saveAll":
          app.saveAll();
          break;
        case "open":
          app.open(data.url);
          break;
        case "close":
          app.close(event);
          break;
        case "appInfo":
          app._getAppInfo(event);
          break;
        }
      } else if (data.syscall) {
        switch(data.syscall) {
        case "config":
          app.config = data.config;
          break;
        }
      }
    },
    _getAppInfo: function(event){
      var data = JSON.parse(event.data);
      event.source.frameElement.setAttribute("title", data.title);
      event.source.frameElement.setAttribute("data-file", data.file);
      if (data.isModified) {
        event.source.frameElement.classList.add("modified");
      } else {
        event.source.frameElement.classList.remove("modified");
      }
      if (document.querySelectorAll("iframe.modified").length > 0) {
        app.setModified();
      } else {
        app.setLoaded();
      }
      app._sendAppInfo();
      return app.onappinfo && app.onappinfo(event);
    },
    _sendAppInfo: function(){
      if (window.self === window.top) {
        if (this.file) {
          var s = this.isModified()?"* - ":" - ";
          document.title = this.file + s + this.title;
        } else {
          document.title = this.title;
        }
      } else if (window.parent !== window.top) {
        window.parent.postMessage(JSON.stringify({
          cmd: "appInfo",
          title: this.title,
          file: this.file,
          isModified: this.isModified()
        }), "*");
      }
    },
    _fsWatcher: function(){
      if (app.file) {
        fs.getProps(app.file, function(result){
          if (result.success) {
            if (app.lastSaved && result.props.mtime > app.lastSaved) {
              if (app.isModified()) {
                if (confirm("I think the file just changed.. Reload?")) {
                  app.setLoaded();
                  app.load(app.file);
                }
              } else {
                app.load(app.file);
              }
            }
            app.lastSaved = result.props.mtime;
          }
        });
      }
    },
    
    on: function(command, cb){
      this["on"+command.toLowerCase()] = cb;
      if (this.file === null && command.toLowerCase() === "load") {
        setTimeout(this._hashchange, 10);
      }
    },
    setModified: function(){
      if (this._state !== 2) {
        this._state = 2;
        this._sendAppInfo();
      }
    },
    setLoaded: function(){
      this.lastSaved = new Date();
      if (this._state !== 0) {
        this._state = 0;
        this._sendAppInfo();
      }
    },
    setSaved: function(){
      this.lastSaved = new Date();
      if (this._state > 0) {
        this._state--;
        this._sendAppInfo();
      }
      if (this.isSaved() && location.hash.substr(1) !== this.file) {
        this._hashchange();
      }
    },
    isModified: function(){ return this._state > 0; },
    isSaved: function(){ return this._state === 0; },
    load: function(file){
      if (location.hash.substr(1) === file && this.onload) {
        this.lastSaved = null;
        this._state = 1;
        this.file = file;
        this.onload(file);
        var _this = this;
        setTimeout(function(){
          if (_this._state === 1) {
            console.log("Remember to call app.setLoaded() once resource is loaded..");
          }
        }, 3000);
      } else {
        location.hash = "#"+file;
      }
    },
    save: function(){
      if (this.onsave) {
        this.lastSaved = null;
        this._state = 1;
        this.onsave();
        var _this = this;
        setTimeout(function(){
          if (_this._state === 1) {
            console.log("Remember to call app.setSaved() once resource is saved..");
          }
        }, 3000);
      } else {
        return this.saveAll(true);
      }
    },
    saveAs: function(file){
      this.file = file;
      return this.save();
    },
    saveAll: function(fromHere){
      if (window.self === window.top || fromHere) {
        var unsaved = document.querySelectorAll("iframe.modified");
        for(var i=0;i<unsaved.length;i++){
          unsaved[i].postMessage(JSON.stringify({ cmd: "save" }), "*");
        }
      } else if (window.parent !== window.top) {
        window.parent.postMessage(JSON.stringify({ cmd: "saveAll" }), "*");
      }
    },
    defaultApp: function(file){
      var ext = file.substr(file.lastIndexOf(".")+1).toLowerCase();
      if (ext.substr(-1) === "/") {
        return this.config.filemanager;
      } else if (this.config.defaultApps[ext]) {
        return this.config.defaultApps[ext];
      } else {
        return this.config.editor;
      }
    },
    close: function(event){
      if (this.onclose) {
        this.onclose(event);
      } else if (window.parent === window.top) {
        window.close();
      } else {
        window.parent.postMessage(JSON.stringify({ cmd: "close" }), "*");
      }
    },
    open: function(url){
      if (this.onopen) {
        this.onopen(url);
      } else if (window.parent !== window.top) {
        window.parent.postMessage(JSON.stringify({ cmd: "open", url: url }), "*");
      }
    },
    openWith: function(app, file){
      return this.open(this.config.appsUrl+app+"/index.html#"+file);
    },
    openFile: function(file){
      return this.openWith(this.defaultApp(file), file);
    }
  };
  app._init();
  return app;
}());
