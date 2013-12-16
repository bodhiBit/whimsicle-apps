/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true */
/*global whim, ace*/
(function(){
  "use strict";
  var editor,
      undoFile,
      modelist = ace.require("ace/ext/modelist");
  
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
      whim.app.editorContent = editor.getValue();
    });
    whim.app.on("loaded", load);
    whim.app.startFileWatcher();
  }
  document.addEventListener("DOMContentLoaded", main);
  
  function load(result) {
    editor.getSession().setMode(modelist.getModeForPath(whim.app.filePath).mode);
    editor.setValue(whim.app.editorContent);
    editor.navigateFileStart();
    if (undoFile !== whim.app.filePath) {
      setTimeout(function() {
        editor.getSession().getUndoManager().reset();
      }, 10);
      undoFile = whim.app.filePath;
    }
  }
}());