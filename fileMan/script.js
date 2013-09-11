/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true, jquery: true */
/*global app, fs*/
(function(){
  "use strict";
  $(function() {
    app.on("load", load);
    setTimeout(function(){
      if (!app.file) {
        app.load("/");
      }
    }, 1000);
    $("#newFolderBtn").click(newFolder);
    $("#newFileBtn").click(newFile);
    $("#closeBtn").click(function(){
      app.close();
    });
  });
  
  function load(dir) {
    fs.listDir(dir, ["-isDir", "extName", "lowerCaseName"], function(result){
      if (result.success) {
        var html = "";
        for(var i=0;i<result.entries.length;i++){
          var entry = result.entries[i];
          if (entry.isDir) { entry.name += "/"; }
          html += '<li><a href="javascript:void(app.openFile(&quot;'+dir+entry.name+'&quot;))">'+entry.name+'</a>'+
            ' [<a href="javascript:void(doRename(&quot;'+dir+entry.name+'&quot;))">rename</a> |'+
            ' <a href="javascript:void(doCopy(&quot;'+dir+entry.name+'&quot;))">copy</a> |'+
            ' <a href="javascript:void(doDelete(&quot;'+dir+entry.name+'&quot;))">delete</a>]</li>';
        }
        $("ul").html(html);
        app.setLoaded();
      } else {
        alert(result.status);
      }
    });
  }
  
  function newFolder() {
    var name = prompt("Folder name");
    if (name) {
      var path = app.file + name;
      fs.makeDir(path, function(result){
        if (result.success) {
          app.load(app.file);
        } else {
          alert(result.status);
        }
      });
    }
  }
  
  function newFile() {
    var name = prompt("File name");
    if (name) {
      var path = app.file + name;
      fs.writeTextFile(path, "", function(result){
        if (result.success) {
          app.load(app.file);
        } else {
          alert(result.status);
        }
      });
    }
  }
  
  window.doRename = function(path) {
    var newName = prompt("New name", path);
    if (newName) {
      fs.rename(path, newName, function(r){
        if (r.success) {
          app.load(app.file);
        } else {
          alert(r.status);
        }
      });
    }
  };
  
  window.doCopy = function(path) {
    var newName = prompt("New name", path);
    if (newName) {
      fs.copy(path, newName, function(r){
        if (r.success) {
          app.load(app.file);
        } else {
          alert(r.status);
        }
      });
    }
  };
  
  window.doDelete = function(path) {
    var dir = path.substr(-1)==="/"?true:false;
    if (confirm("Are you absolutely sure you want to delete this "+(dir?"folder":"file")+" and all its content??")) {
      fs.delete(path, function(r){
        if (r.success) {
          app.load(app.file);
        } else {
          alert(r.status);
        }
      });
    }
  };
}());