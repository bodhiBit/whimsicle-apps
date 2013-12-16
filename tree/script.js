/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true, jquery:true */
/*global whim*/
(function(){
  "use strict";

  var branches = [];
  var dblClick = false;
  var toggling = false;
  
  $(function() {
    whim.config.load();
    whim.app.on("loaded", load);
    setTimeout(function(){
      if (!whim.app.filePath) {
        whim.app.load("/");
      }
    }, 1000);
  });
  
  function getBranch(path) {
    var i = branches.indexOf(path);
    if (i<0) {
      branches.push(path);
      i = branches.indexOf(path);
    }
    return i;
  }
  
  function load(r) {
    branches = [];
    $("#branch_"+getBranch(whim.app.filePath)).html('<a href="javascript:gotoParent()">&uArr;</a> '+whim.app.filePath);
    window.toggleFolder(whim.app.filePath);
  }
  
  window.openFile = function(path) {
    toggling = true;
    setTimeout(function() { toggling = false; }, 10);
    whim.app.openPath(path);
  }
  
  window.toggleFolder = function(path) {
    if (toggling) {
      return false;
    } else {
      toggling = true;
      setTimeout(function() { toggling = false; }, 10);
    }
    if (dblClick === path) {
      setTimeout(function() {
        whim.app.load(path);
      }, 10);
    } else if ($("#branch_"+getBranch(path)+" ul").size()>0) {
      dblClick = path;
      var branch = getBranch(path);
      $("#branch_"+branch+" ul").slideUp("slow", function(){
        $("#branch_"+branch+" ul").remove();
        dblClick = false;
      });
    } else {
      dblClick = path;
      whim.fs.read(path, ["-isDir", "extName", "lowerCaseName"], function(r) {
        if (r.success) {
          var html = $("#branch_"+getBranch(path)).html() + "<ul>";
          var props, file;
          if (path === "/") {
            for(var ws in whim.config.get("workspaces")) {
              if (whim.config.get("workspaces").hasOwnProperty(ws)) {
                props = {
                  isDir: true,
                  name: "["+ws+"]"
                };
                file = props.name;
                if (props.isDir) {
                  file += "/";
                }
                html += '<li class="'+(props.isDir?"dir":"file")
                +'" id="branch_'+getBranch(file)
                +'" onclick="toggleFolder(\''+file
                +'\')"><a href="javascript:void()" onclick="openFile(\''+file+'\')">'
                +file+'</a></li>';
              }
            }
          }
          for(var i=0;i<r.entries.length;i++) {
            props = r.entries[i];
            file = props.name;
            if (props.isDir) {
              file += "/";
            }
            html += '<li class="'+(props.isDir?"dir":"file")
            +'" id="branch_'+getBranch(path+file)
            +'" onclick="toggleFolder(\''+path+file
            +'\')"><a href="javascript:void()" onclick="openFile(\''+path+file+'\')">'
            +file+'</a></li>';
          }
          html += "</ul>";
          $("#branch_"+getBranch(path)).html(html);
          $("#branch_"+getBranch(path)+" ul").hide().slideDown("slow", function(){
            dblClick = false;
          });
        } else {
          dblClick = false;
          whim.fs.read(path, "utf8", function(r){
            var html = $("#branch_"+getBranch(path)).html() + "<ul>";
            html += '<li id="branch_'+getBranch(path+file)+'"><pre></pre></li>';
            html += "</ul>";
            $("#branch_"+getBranch(path)).html(html);
            $("#branch_"+getBranch(path)+" pre").text(r.data || r.status);
            $("#branch_"+getBranch(path)+" ul").hide().slideDown("slow");
          });
        }
      });
    }
  };
  
  window.gotoParent = function() {
    var f = whim.app.filePath;
    if (f.match(/\//g).length > 1) {
      whim.app.load(f.substr(0, f.substr(0, f.length-1).lastIndexOf("/")+1));
    } else {
      whim.app.load("/");
    }
  }
}());