/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true */
/*global app, fs*/
(function(){
  "use strict";
  app.on("load", function(file) {
    fs.getProps(file, function(r) {
      app.setLoaded();
      location.replace(r.properties.url);
    });
  });
}());