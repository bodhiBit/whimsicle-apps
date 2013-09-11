/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true, jquery: true */
/*global app, fs*/
(function(){
  "use strict";
  var originalTxt = "";
  
  $(function() {
    app.on("load", load);
    app.on("save", save);
    $("textarea").keydown(function(e){
      if (e.which === 9) {
        e.preventDefault();
      }
    });
    $("textarea").keyup(function(e){
      if ($("textarea").val() !== originalTxt) {
        app.setModified();
      } else {
        app.setLoaded();
      }
      switch(e.which) {
      case 9:
        indent();
        break;
      case 13:
        newLine();
        break;
      }
    });
  });
  
  function load(file) {
    fs.readTextFile(file, function(result){
      if (result.success) {
        $("textarea").val(result.data);
        originalTxt = $("textarea").val();
        app.setLoaded();
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
    originalTxt = $("textarea").val();
    fs.writeTextFile(app.file, $("textarea").val(), function(result){
      if (result.success) {
        app.setSaved();
      } else {
        alert(result.status);
      }
    });
  }
  
  function newLine() {
    var cursor = $("textarea").get(0).selectionStart,
        text = $("textarea").val(),
        lastLine = text.substr(0, cursor).trim().split("\n").pop(),
        indentation = lastLine.substr(0, lastLine.indexOf(lastLine.trim()));
    $("textarea").val(text.substr(0, cursor)+indentation+text.substr(cursor));
    $("textarea").get(0).selectionStart = cursor + indentation.length;
    $("textarea").get(0).selectionEnd = cursor + indentation.length;
  }
  
  function indent() {
    var cursor = $("textarea").get(0).selectionStart,
        text = $("textarea").val(),
        lines = text.split("\n"),
        indentation = "",
        i = 0;
    while(i<lines.length && indentation === ""){
      var line = lines[i];
      if (line.trim().length > 0) {
        indentation = line.substr(0, line.indexOf(line.trim()));
      }
      i++;
    }
    if (indentation === "") {
      indentation = "\t";
    }
    $("textarea").val(text.substr(0, cursor)+indentation+text.substr(cursor));
    $("textarea").get(0).selectionStart = cursor + indentation.length;
    $("textarea").get(0).selectionEnd = cursor + indentation.length;
    $("textarea").focus();
  }
}());