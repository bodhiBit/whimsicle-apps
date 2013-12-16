/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true, jquery:true */
/*global whim*/
(function(){
  "use strict";

  $(function() {
    whim.app.on("loaded", load);
    $("textarea").keydown(function(e){
      if (e.which === 9) {
        e.preventDefault();
      }
    });
    $("textarea").keyup(function(e){
      switch(e.which) {
      case 9:
        indent();
        break;
      case 13:
        newLine();
        break;
      }
      whim.app.editorContent = $("textarea").val();
    });
  });
  
  function load(result) {
    if (result.success) {
      $("textarea").val(whim.app.editorContent);
    } else {
      alert(result.status);
    }
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