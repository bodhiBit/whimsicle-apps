/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true, jquery:true */
/*global whim*/
(function(){
  "use strict";
  $(function() {
    whim.app.dirSorting = ["-isDir", "extName", "lowerCaseName"];
    whim.app.on("loaded", load);
    setTimeout(function(){
      if (!whim.app.filePath) {
        whim.app.load("/");
      }
    }, 1000);
    whim.app.startFileWatcher();
    $("#newFolderBtn").click(newFolder);
    $("#newFileBtn").click(newFile);
    $("#closeBtn").click(function(){
      whim.app.quit();
    });
  });
  
  function load(result) {
    var dir = whim.app.filePath;
    if (result.success) {
      var html = "";
      for(var i=0;i<result.entries.length;i++){
        var entry = result.entries[i];
        if (entry.isDir) { entry.name += "/"; }
        html += '<li><a href="javascript:void(whim.app.openPath(&quot;'+dir+entry.name+'&quot;))">'+entry.name+'</a>'+
          ' [<a href="javascript:void(doRename(&quot;'+dir+entry.name+'&quot;))">rename</a> |'+
          ' <a href="javascript:void(doCopy(&quot;'+dir+entry.name+'&quot;))">copy</a> |'+
          ' <a href="javascript:void(doDelete(&quot;'+dir+entry.name+'&quot;))">delete</a>]</li>';
      }
      $("ul").html(html);
    } else {
      alert(result.status);
    }
  }
  
  function newFolder() {
    var name = prompt("Folder name");
    if (name) {
      var path = whim.app.filePath + name;
      whim.fs.write(path, null, null, function(result){
        if (result.success) {
          whim.app.load(whim.app.file);
        } else {
          alert(result.status);
        }
      });
    }
  }
  
  function newFile() {
    var name = prompt("File name");
    if (name) {
      var path = whim.app.filePath + name;
      whim.fs.write(path, "", "utf8", function(result){
        if (result.success) {
          whim.app.load(whim.app.file);
        } else {
          alert(result.status);
        }
      });
    }
  }
  
  window.doRename = function(path) {
    var newName = prompt("New name", path);
    if (newName) {
      whim.fs.rename(path, newName, function(r){
        if (r.success) {
          whim.app.load(whim.app.filePath);
        } else {
          alert(r.status);
        }
      });
    }
  };
  
  window.doCopy = function(path) {
    var newName = prompt("New name", path);
    if (newName) {
      whim.fs.copy(path, newName, function(r){
        if (r.success) {
          whim.app.load(whim.app.filePath);
        } else {
          alert(r.status);
        }
      });
    }
  };
  
  window.doDelete = function(path) {
    var dir = path.substr(-1)==="/"?true:false;
    if (confirm("Are you absolutely sure you want to delete this "+(dir?"folder":"file")+" and all its content??")) {
      whim.fs.delete(path, function(r){
        if (r.success) {
          whim.app.load(whim.app.filePath);
        } else {
          alert(r.status);
        }
      });
    }
  };
}());