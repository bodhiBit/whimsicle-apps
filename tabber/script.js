/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, devel:true, indent:2,
maxerr:50, newcap:true, browser:true, jquery:true */
/*global whim */
(function(){
  "use strict";
  var tabCounter = 0,
      tabs,
      tabTemplate = "<li id='tab_#{id}'><a href='#frame_#{id}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
  
  $(function() {
    tabs = $("#tabs").tabs({
      active: -1,
      heightStyle: "fill"
    });
    tabs.find( ".ui-tabs-nav" ).sortable({
      axis: "x",
      stop: function() {
        tabs.tabs( "refresh" );
      }
    });
    tabs.delegate( "span.ui-icon-close", "click", function() {
      var id = $( this ).closest( "li" ).get(0).id;
      id = id.substr(id.indexOf("_")+1);
      var ok = $("#frame_"+id+".modified").length === 0;
      if (!ok) {
        ok = confirm("This window contains unsaved changes!\nDiscard these?");
      }
      if (ok) {
        $("#frame_"+id).remove();
        $("li#tab_"+id).remove();
        tabs.tabs( "refresh" );
      }
    });
    whim.app.on("open", openTab);
    whim.app.on("frameUpdate", appInfo);
    whim.app.on("close", closeTab);
    window.addEventListener("resize", function(e) {
      tabs.tabs("refresh");
    });
  });
    
  function openTab(url, cb) {
    var a = document.createElement("a");
    a.href = url;
    if ($("#tabs iframe[src='"+a.href+"']").length === 0) {
      var label = url,
          id = tabCounter,
          li = $( tabTemplate.replace( /#\{id\}/g, id ).replace( /#\{label\}/g, label ) ),
          tabContentHtml = '<iframe id="frame_'+id+'" width="100%" height="100%"></iframe>';
      tabs.find( ".ui-tabs-nav" ).append( li );
      tabs.append( tabContentHtml );
      tabs.tabs( "refresh" );
      tabs.tabs( "option", "active", -1 );
      $("#frame_"+id).attr("src", a.href);
      tabCounter++;
    } else {
      var i = 0;
      var tabbar = $("#tabs li a");
      var id = tabbar.get(i).href;
      id = id.substr(id.indexOf("#"));
      while (i<tabbar.length && $(id).get(0).src !== a.href) {
        i++;
        id = tabbar.get(i).href;
        id = id.substr(id.indexOf("#"));
      }
      tabs.tabs( "option", "active", i );
    }
    cb({ success: true, status: "ok" });
  }
  
  function appInfo(frame, data) {
    var id = frame.id;
    id = id.substr(id.indexOf("_")+1);
    var title, label;
    if (data.path) {
      var file = data.path;
      var tail = file.substr(-1);
      file = file.substr(0, file.length-1);
      var s = data.isModified?"*":"";
      label = file.substr(file.lastIndexOf("/")+1) + tail + s;
      title = data.path + s + " - " + data.title;
    } else {
      label = title = data.title;
    }
    $("a[href='#frame_"+id+"']").text(label);
    $("a[href='#frame_"+id+"']").attr("title", title);
    tabs.tabs( "refresh" );
  }
  
  function closeTab(frame, cb) {
    var id = frame.id;
    id = id.substr(id.indexOf("_")+1);
    $("#frame_"+id).remove();
    $("li#tab_"+id).remove();
    tabs.tabs( "refresh" );
    cb({ success: true, status: "ok" });
  }
}());