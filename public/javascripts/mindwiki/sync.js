// Server synchronization

function Sync() {

 /****************************************************************************
   Default values
  ****************************************************************************/

  var thissync = this;     // For submethods
  this.graph = null;       // Remember to set in graph
  this.refreshTime = 4000; // How ofter do we poll the server for updates? (in milliseconds)


 /****************************************************************************
   Loading spinner
  ****************************************************************************/

  this.loadingDiv = document.createElement("div");
  $(this.loadingDiv).addClass("loadingDiv");
  $("#world").append(this.loadingDiv);

  // Makes all ajax calls automatically call the loading()-method of the graph,
  // so we do not necessarily need to manually call them all over the code
  $(function() {
    $(document).ajaxSend(function(e, request, options){
      thissync.graph.loading(true);
    });
    $(document).ajaxStop(function(e, request, options){
      thissync.graph.loading(false);
    });
  });


 /****************************************************************************
   Automatic refreshing launcher
  ****************************************************************************/

  setTimeout(checkServerForUpdates, this.refreshTime, this);

} // end constructor


/****************************************************************************
  Automatic refreshing method

// To have checkServerForUpdates within Sync needs different workarounds for different browsers, 
// because setTimeout changes scope. Therefore global.

 ****************************************************************************/

function checkServerForUpdates(syncObject){
  var sync = syncObject;
  $.ajax({
    url: "/graphs/request_empty/1",
    success: function() {
      // no need
    }
  });
  setTimeout(checkServerForUpdates, sync.refreshTime, sync); // reference to global :(
}


/****************************************************************************
  Get color from the server. 
  TODO: Have just one init-call to handle all graph initialization, including color.
 ****************************************************************************/

Sync.prototype.getColor = function(){
  var thissync = this;
  $.ajax({
    url: "/graphs/get_color/" + thissync.graph.id,
    success: function(data){ 
      thissync.graph.color = data;
      $("#mindwiki_world").css({"backgroundColor" : data});
    }
  });
}

