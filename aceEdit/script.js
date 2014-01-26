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
    editor.setTheme("ace/theme/ambiance");
    editor.setShowInvisibles(true);
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setTabSize(2);

    editor.commands.addCommand({
      name: 'toggleSoftTabs',
      bindKey: {win: 'Ctrl-I',  mac: 'Command-I'},
      exec: toggleSoftTabs,
      readOnly: false
    });

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
    whim.app.on("save", saveState);
    whim.app.startFileWatcher();
  }
  document.addEventListener("DOMContentLoaded", main);
  
  function load(result) {
    editor.getSession().setMode(modelist.getModeForPath(whim.app.filePath).mode);
    editor.setValue(whim.app.editorContent.replace(/\r\n/g, "\n"));
    editor.navigateFileStart();
    setTimeout(function() {
      detectIndentation();
      applyFolds(whim.app.fileState.foldedLines);
      if (undoFile !== whim.app.filePath) {
        editor.getSession().getUndoManager().reset();
        undoFile = whim.app.filePath;
      }
    }, 10);
  }
  
  function saveState() {
    whim.app.fileState.foldedLines = getFoldedLines();
  }
  
  function getFoldedLines(folds) {
    var foldLines = [];
    if (!folds) {
      folds = editor.getSession().getAllFolds();
    }
    for (var i = 0; i < folds.length; i++) {
      foldLines.push(folds[i].start.row);
      if (folds[i].subFolds.length > 0) {
        var subFoldLines = getFoldedLines(folds[i].subFolds);
        for (var j = 0; j < subFoldLines.length; j++) {
          foldLines.push(subFoldLines[j]+folds[i].start.row);
        }
      }
    }
    console.log(foldLines);
    return foldLines;
  }
  
  function applyFolds(foldLines) {
    for (var i = 0; i < foldLines.length; i++) {
      var row = foldLines[i],
          range = editor.getSession().getFoldWidgetRange(row, true);
      editor.getSession().addFold("...", range);
    }
  }
  
  function detectIndentation() {
    var text = editor.getValue(),
        indentation = "\n  ",
        firstIndentation = text.indexOf(indentation),
        tabSize = 1;
    
    if (text.indexOf("\n\t") > -1) {
      editor.getSession().setUseSoftTabs(false);
    } else if (firstIndentation > -1) {
      while(firstIndentation === text.indexOf(indentation)) {
        tabSize++;
        indentation += " ";
      }
      editor.getSession().setUseSoftTabs(true);
      editor.getSession().setTabSize(tabSize);
    }
  }
  
  function toggleSoftTabs(editor) {
    var text = editor.getValue(),
        indentation,
        tabSize = editor.getSession().getTabSize(),
        match = "\\n",
        replace = "\n",
        softTab = "";
    
    for (var i = 0; i < tabSize; i++) {
      softTab += " ";
    }
    if (editor.getSession().getUseSoftTabs()) {
      while(text.match(new RegExp(match))) {
        match += softTab;
        replace += "\t";
      }
      while(replace.length > 1) {
        text = text.replace(new RegExp(match, "g"), replace);
        match = match.substr(0, match.length-tabSize);
        replace = replace.substr(0, replace.length-1);
        console.log(">"+replace+"<");
      }
      editor.getSession().setUseSoftTabs(false);
    } else {
      while(text.match(new RegExp(match))) {
        match += "\\t";
        replace += softTab;
      }
      while(replace.length > 1) {
        text = text.replace(new RegExp(match, "g"), replace);
        match = match.substr(0, match.length-2);
        replace = replace.substr(0, replace.length-tabSize);
        console.log(">"+replace+"<");
      }
      editor.getSession().setUseSoftTabs(true);
    }
    editor.setValue(text);
    editor.navigateFileStart();
  }
}());