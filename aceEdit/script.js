/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true */
/*global app, fs, ace*/
(function(){
  "use strict";
  var editor,
      modelist = ace.require("ace/ext/modelist"),
      originalTxt = "";
  
  function main() {
    ace.require("ace/ext/language_tools");
    editor = ace.edit("editor");
    
    
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true
    });
    editor.setTheme("ace/theme/monokai");
    editor.setShowInvisibles(false);
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setTabSize(2);
    
    // insistant autocomplete
    document.getElementById("editor").addEventListener("keydown", function(e) {
      if (editor.completer && !(e.altGraphKey||e.altKey||e.ctrlKey||e.metaKey)
        && e.which >=65 && e.which <= 90) {
        editor.completer.showPopup(editor);
      }
    });
    
    editor.getSession().on("change", function(){
      if ( editor.getValue() !== originalTxt) {
        app.setModified();
      } else {
        app.setLoaded();
      }
    });
    app.on("load", load);
    app.on("save", save);
  }
  document.addEventListener("DOMContentLoaded", main);
  
  function load(file) {
    editor.getSession().setMode(modelist.getModeForPath(file).mode);
    fs.readTextFile(file, function(result){
      if (result.success) {
        editor.setValue(result.data);
        originalTxt = editor.getValue();
        editor.navigateFileStart();
        app.setLoaded();
        setTimeout(function() {
          editor.getSession().getUndoManager().reset();
        }, 10);
      } else if (result.err.code === "EISDIR") {
        app.on("open", function(url){
          location.replace(url);
        });
        app.openFile(app.file+"/");
      } else {
        alert(result.status);
      }
    });
  }
  
  function save() {
    originalTxt = editor.getValue();
    fs.writeTextFile(app.file, originalTxt, function(result){
      if (result.success) {
        app.setSaved();
      } else {
        alert(result.status);
      }
    });
  }
}());