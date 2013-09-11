/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true, jquery: true */
/*global app*/
(function(){
  "use strict";
  var dialogs = [],
      cascadeX = 0,
      cascadeY = 0;
  
  $(function() {
    app.on("open", openWindow);
    app.on("appinfo", function(event){
      var id = event.source.frameElement.id;
      id = parseInt(id.substr(id.indexOf("_")+1), 10);
      var title;
      if (event.data.file) {
        var file = event.data.file;
        if (file.substr(-1) === "/") { file = file.substr(0, file.length-1); }
        var s = event.data.isModified?"* - ":" - ";
        title = file.substr(file.lastIndexOf("/")+1) + s + event.data.title;
      } else {
        title = event.data.title;
      }
      dialogs[id].dialog("option", "title", title);
    });
    app.on("close", function(event){
      var id = event.source.frameElement.id;
      id = parseInt(id.substr(id.indexOf("_")+1), 10);
      dialogs[id].dialog("close");
    });
    app.openFile("/");
  });
  
  function openWindow(url) {
    var id = dialogs.length;
    $("body").append('<div class="window" id="window_'+id+'"></div>');
    $("#window_"+id).attr("title", url);
    $("#window_"+id).append('<iframe id="frame_'+id+'" width="100%" height="100%"></iframe>');
    $("#frame_"+id).attr("src", url);
    dialogs.push($("#window_"+id).dialog({
      position: {
        my: "left top",
        at: "left+"+cascadeX +" top+"+cascadeY,
        of: window
      },
      width: 800,
      height: 600,
      beforeClose: function(event) {
        if ($("iframe.modified", this).length > 0) {
          if (!confirm("This window contains unsaved changes!\nDiscard these?")) {
            event.preventDefault();
          }
        }
      },
      close: function() {
        $("iframe", this).remove();
        $(this).destroy();
      }
    }));
    cascadeX += 32;
    cascadeY += 32;
  }
}());