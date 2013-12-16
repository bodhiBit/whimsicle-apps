/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true */
/*global whim */
(function(){
  "use strict";
  whim.app.on("loaded", function(r1) {
    whim.fs.probe(whim.app.filePath, function(r2) {
      document.getElementsByTagName("iframe")[0].src = r2.properties.url;
    });
  });
  whim.app.startFileWatcher();
}());