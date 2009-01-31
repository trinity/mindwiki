// Server synchronization

// Get means getting information FROM the server.
// Set means informing the server about a change in the client.

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
      // TODO: Insert connection checking here?
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

Sync.prototype.getGraphColor = function(){
  var thissync = this;
  $.ajax({
    url: "/graphs/get_color/" + thissync.graph.id,
    success: function(data){ 
      thissync.graph.color = data;
      $("#mindwiki_world").css({"backgroundColor" : data});
    }
  });

  // TEMPORARY for performance testing:
  // How long does it take for an empty ajax request to come back from the server?
  // On my local testing desktop, it takes about 0.8 seconds, which sounds pretty slow.
  $.ajax({ url: "/graphs/request_empty/" + thissync.graph.id });
}


/****************************************************************************
  Inform the server about a note color change.
 ****************************************************************************/

Sync.prototype.setNoteColor = function(noteId, newColor){
  $.ajax({
    url: "/notes/update/"+noteId,
    data: { "note[color]" : newColor },
    dataType: "html"
  });
}


/****************************************************************************
  Get all the notes associated with the current viewport position and size.
  Also gets the directly associated notes, so we do not have to worry about 
  edges suddenly appearing while scrolling.

  TODO: Get only the notes that we already do not have in the client, or notes
        that have changed since the last update.
 ****************************************************************************/

Sync.prototype.getViewportNotes = function(){
  var thissync = this;
  var thisgraph = this.graph;
  $.ajax({
    url: "/graphs/get_notes_in_vport/" + thisgraph.id,
    dataType: "xml",
    data: {
      "vport_x": $("#vport").scrollLeft(),
      "vport_y": $("#vport").scrollTop(), 
      "vport_width": $("#vport").width(), 
      "vport_height": $("#vport").height()
    },
    success: function(data){
      $("note",data).each(function(i){
          var tmp = new Note();
          tmp.id = parseInt($(this).find("id:first").text());
          tmp.name = $(this).find("name:first").text();
          tmp.x = parseInt($(this).find("x:first").text());
          tmp.y = parseInt($(this).find("y:first").text());
          tmp.width = parseInt($(this).find("width:first").text());  
          tmp.height = parseInt($(this).find("height:first").text());
          tmp.color = $(this).find("color:first").text();

          $("article",this).each(function(j){ // There's really only one :)
            tmp.content = $(this).find("content_rendered:first").text();
            var contentType = parseInt($(this).find("content_type:first").text());
            if(contentType == 1) // RedCloth-parse included
              tmp.editableContent = $(this).find("content:first").text();
          });

          // Only add the note to the graph if it is not already in.
          // TODO: Check timestamps to see if update is in order.
          if(!thisgraph.getNoteById(tmp.id)){
            thisgraph.notes.push(tmp);
            tmp.redraw();
          }

          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-to",$(this).find("edges-to:first")).each(function(k){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(), 
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text())
            );
          });
          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-from",$(this).find("edges-from:first")).each(function(l){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(),
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text()) 
            );
          }); 
      });

    },
    error: function(a,b,c){
      alert("Cannot load notes: "+a+" "+b+" "+c);
    }
  });
}