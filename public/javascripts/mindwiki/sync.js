// Server synchronization

// Get means getting information FROM the server.
// Set means informing the server about a change in the client.

function Sync(graph) {

 /****************************************************************************
   Default values
  ****************************************************************************/

  var thissync = this;     // For submethods
  this.graph = graph;
  this.refreshTime = 4000; // How ofter do we poll the server for updates? (in milliseconds)
  this.timestamp = "";     // The latest timestamp from the server


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
  
  jQuery.ajaxSetup({ async: thissync.graph.asyncAjax });

} // end constructor


/****************************************************************************
  Automatic refreshing method

  Initial call of this function is at the end of the graph constructor.

  To have checkServerForUpdates within Sync needs different workarounds for different browsers, 
  because setTimeout changes scope. Therefore global.

 ****************************************************************************/

function checkServerForUpdates(syncObject){
  var sync = syncObject;
  var thisgraph = syncObject.graph;
/*
  $.ajax({
    url: "/graphs/updated_since/" + sync.graph.id,
    data: { "timestamp" : sync.timestamp },
    dataType: "xml",
    success: function(data){
      var update = false;
      sync.updateTimestamp(data);
      $("note",data).each(function(i){
          update = true;
	  
          var tmp = new Note(thisgraph);
          tmp.id = parseInt($(this).find("id:first").text());
          tmp.name = $(this).find("name:first").text();
          tmp.x = parseInt($(this).find("x:first").text());
          tmp.y = parseInt($(this).find("y:first").text());
          tmp.width = parseInt($(this).find("width:first").text());  
          tmp.height = parseInt($(this).find("height:first").text());
          tmp.color = $(this).find("color:first").text();
          tmp.zorder = parseInt($(this).find("zorder:first").text());

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
            thisgraph.runningZ = thisgraph.runningZ < tmp.zorder ? tmp.zorder : thisgraph.runningZ;
          }

          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-to",$(this).find("edges-to:first")).each(function(k){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(), 
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text()),
              $(this).find("directed:first").text() == "true"
            );
          });
          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-from",$(this).find("edges-from:first")).each(function(l){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(),
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text()),
              $(this).find("directed:first").text() == "true"
            );
          }); 
      });
      //if (update == true) alert("it is true"); // update is never set to true for some reason.
        sync.updateExtents();
    }
  });
*/

  // Please do not delete: This will eventually replace the ajax call above.
  $.ajax({
    global: false, // Disables the spinner and all other possible global functions
    url: "/check_for_updates/" + sync.graph.id,
    data: { "timestamp" : sync.timestamp },
    dataType: "json",
    success: function(data){
      // Update the timestamp
      if(data.time) sync.timestamp = data.time;


      // Handle the updates      
      var len = data.updates.length;
      for(var i=0;i<len;i++) {
        //alert(data.updates[i].sync_log.params);
        var params = JSON.parse(data.updates[i].sync_log.params);
        //alert(params.note.name);
        var old = thisgraph.getNoteById(params.note.id);
        if(old != null) {
          old.name = params.note.name;
          old.x = params.note.x;
          old.y = params.note.y;
          old.width = params.note.width;
          old.height = params.note.height;
          old.zorder = params.note.zorder;
          old.update();
        }
      }


      // Update the possibly new extents
      if(data.extents) {
        var e = data.extents;
        thisgraph.extents.min.x = e.minX;
        thisgraph.extents.min.y = e.minY;
        thisgraph.extents.max.x = e.maxX;
        thisgraph.extents.max.y = e.maxY;
        thisgraph.vp.setScale(thisgraph.vp.callerScale);
        thisgraph.extents.mid.x = Math.round((thisgraph.extents.min.x+thisgraph.extents.max.x)/2);
        thisgraph.extents.mid.y = Math.round((thisgraph.extents.min.y+thisgraph.extents.max.y)/2);
      }

    }
  });


  setTimeout(function(){checkServerForUpdates(sync);}, sync.refreshTime, sync);
}


/****************************************************************************
  Update sync-object's timestamp from server returned data
 ****************************************************************************/

Sync.prototype.updateTimestamp = function(data){
  var sync = this;
 

  $("note",data).each(function(i){
      sync.updateTimestampIfBigger( $(this).find("updated-at:first").text() );
      sync.updateTimestampIfBigger( $(this).find("created-at:first").text() );

      $("article",this).each(function(j){ // There's really only one :)
        sync.updateTimestampIfBigger( $(this).find("updated-at:first").text() );
        sync.updateTimestampIfBigger( $(this).find("created-at:first").text() );
      });

      // Escapes the edges-to array first, then loops edges-to -fields inside
      $("edges-to",$(this).find("edges-to:first")).each(function(k){
  
          sync.updateTimestampIfBigger( $(this).find("updated-at:first").text() );
          sync.updateTimestampIfBigger( $(this).find("created-at:first").text() );
       
      });
      // Escapes the edges-to array first, then loops edges-to -fields inside
      $("edges-from",$(this).find("edges-from:first")).each(function(l){
      
          sync.updateTimestampIfBigger( $(this).find("updated-at:first").text() );
          sync.updateTimestampIfBigger( $(this).find("created-at:first").text() );
       
      }); 
  });
}


/****************************************************************************
   Compare a timestamp to the current one, and keep the bigger one.
 ****************************************************************************/

Sync.prototype.updateTimestampIfBigger = function(s){
  this.timestamp = (this.timestamp < s) ? s : this.timestamp;
}


/****************************************************************************
  Update extents from the server. 
 ****************************************************************************/

Sync.prototype.updateExtents = function(){
  var thissync = this;
  var thisgraph = this.graph;

  // Gets extents of the graph and calculates the middle point, also.
  $.ajax({
    url: "/graphs/get_extents/" + thissync.graph.id,
    success: function(data){
      var changed = false;
      var val;
    
      $("extents",data).each(function(i){
          $("min_point",this).each(function(j){
	    if ((val = parseInt($(this).find("x:first").text())) != thisgraph.extents.min.x) {
              thisgraph.extents.min.x = val;
	      changed = true;
	    }
	    if ((val = parseInt($(this).find("y:first").text())) != thisgraph.extents.min.y) {
              thisgraph.extents.min.y = val;
	      changed = true;
	    }
          });
          $("max_point",this).each(function(j){
	    if ((val = parseInt($(this).find("x:first").text())) != thisgraph.extents.max.x) {
              thisgraph.extents.max.x = val;
	      changed = true;
	    }
	    if ((val = parseInt($(this).find("y:first").text())) != thisgraph.extents.max.y) {
              thisgraph.extents.max.y = val;
	      changed = true;
	    }
          });

          /* See checkServerForUpdates. This didn't work there so might not work here either. */
	  if (changed == true)
	    thisgraph.vp.setScale(thisgraph.vp.callerScale);
      });
      thisgraph.extents.mid.x = Math.round((thisgraph.extents.min.x+thisgraph.extents.max.x)/2);
      thisgraph.extents.mid.y = Math.round((thisgraph.extents.min.y+thisgraph.extents.max.y)/2);
      /*thisgraph.ch.setPriorityText("Extents " + thisgraph.extents.min.x + " " + thisgraph.extents.min.y +
      " " + thisgraph.extents.max.x + " " + thisgraph.extents.max.y, 100);*/
    }
  });
}

/****************************************************************************
  Get graph information (color & extents) from the server. 
 ****************************************************************************/

Sync.prototype.initGraph = function(){
  // TODO: Have just one ajax-call to handle all graph initialization
  var thissync = this;
  var thisgraph = this.graph;
  $.ajax({
    url: "/graphs/get_color/" + thissync.graph.id,
    success: function(data){ 
      thissync.graph.color = data;
      $("#mindwiki_world").css({"backgroundColor" : data});
    }
  });
  this.updateExtents();

  // TEMPORARY for performance testing:
  // How long does it take for an empty ajax request to come back from the server?
  // On my local testing desktop, it takes about 0.8 seconds, which sounds pretty slow.
  $.ajax({ url: "/graphs/request_empty/" + thissync.graph.id });
}


/****************************************************************************
  Inform the server about a NOTE COLOR change.
 ****************************************************************************/

Sync.prototype.setNoteColor = function(noteId, newColor){
  $.ajax({
    url: "/notes/update/"+noteId,
    data: { "note[color]" : newColor },
    dataType: "html"
  });
}


/****************************************************************************
  Inform the server about a NOTE Z-ORDER change.
 ****************************************************************************/

Sync.prototype.setNoteZorder = function(noteId, newZ){
  $.ajax({
    url: "/notes/update/"+noteId,
    data: { "note[zorder]" : newZ },
    dataType: "html"
  });
}


/****************************************************************************
  Inform the server about a NOTE POSITION change.
 ****************************************************************************/

Sync.prototype.setNotePosition = function(noteId, newx, newy){
  $.ajax({
    url: "/notes/update/"+noteId,
    dataType: "html",
    data: {
      "note[x]" : newx,
      "note[y]" : newy
    }
  });
}


/****************************************************************************
  Inform the server about a NOTE SIZE change.
 ****************************************************************************/

Sync.prototype.setNoteSize = function(noteId, neww, newh){
  $.ajax({
    url: "/notes/update/"+noteId,
    dataType: "html",
    data: {
      "note[width]" : neww,
      "note[height]" : newh
    }
  });
}


/****************************************************************************
  Inform the server about a NOTE NAME change.
 ****************************************************************************/

Sync.prototype.setNoteName = function(note, newName){
  var n = note;
  $.ajax({
    url: "/notes/update/"+n.id,
    dataType: "html",
    data: { "note[name]" : newName },
    success: function(data){
      n.name=newName;
      n.update();
    }
  });
}


/****************************************************************************
  Inform the server about a NOTE CONTENT change.
 ****************************************************************************/

Sync.prototype.setNoteContent = function(note, newContent){
  var n = note;
  $.ajax({
    url: "/notes/update_content/"+n.id,
    data: { "newContent" : newContent },
    dataType: "html",
    success: function(data){
      n.content=data;
      n.update();
    }
  });
}


/****************************************************************************
  Inform the server about a NOTE DELETION.
 ****************************************************************************/

Sync.prototype.deleteNote = function(noteId){
  $.ajax({ url: "/notes/destroy/"+noteId });
}


/****************************************************************************
  Inform the server about a NEW NOTE.
  Gives the note a server assigned id number.
 ****************************************************************************/

Sync.prototype.createNote = function(note){
  var thisgraph = this.graph;
  var n = note;
  $.ajax({
    url: "/notes/create",
    type: "POST",
    data: {
      "graph_id" : thisgraph.id,
      "note[name]" : n.name,
      "note[color]" : n.color,
      "note[x]" : n.x,
      "note[y]" : n.y,
      "note[width]" : n.width,
      "note[height]" : n.height,
      "note[zorder]" : n.zorder,
      "article_content" : n.content
    },
    dataType: "xml",
    success: function(data){
      $("note", data).each(function(i) {
        n.id = parseInt($(this).find("id:first").text());
      });
    },   
    error: function(a,b,c){
      alert("Cannot create new note to db: "+a+b+c);
    }
  });
}


/****************************************************************************
  Get all the notes associated with the current viewport position and size.
  Also gets the directly associated notes, so we do not have to worry about 
  edges suddenly appearing while scrolling.

  TODO: Get only the notes that we already do not have in the client, or notes
        that have changed since the last update.
 ****************************************************************************/

Sync.prototype.getViewportNotesOld = function(){
  var thisgraph = this.graph;
  this.getViewportNotes(thisgraph.vp.worldLeft(), thisgraph.vp.worldTop(),
                        thisgraph.vp.worldWidth(), thisgraph.vp.worldHeight());
}

Sync.prototype.getViewportNotes = function(x, y, w, h){
  var thissync = this;
  var thisgraph = this.graph;
  $.ajax({
    url: "/graphs/get_notes_in_vport/" + thisgraph.id,
    dataType: "xml",
    data: {
      "vport_x": x,
      "vport_y": y,
      "vport_width": w,
      "vport_height": h
    },
    success: function(data){
      thissync.updateTimestamp(data);
      $("note",data).each(function(i){
          var tmp = new Note(thisgraph);
          tmp.id = parseInt($(this).find("id:first").text());
          tmp.name = $(this).find("name:first").text();
          tmp.x = parseInt($(this).find("x:first").text());
          tmp.y = parseInt($(this).find("y:first").text());
          tmp.width = parseInt($(this).find("width:first").text());  
          tmp.height = parseInt($(this).find("height:first").text());
          tmp.color = $(this).find("color:first").text();
          tmp.zorder = parseInt($(this).find("zorder:first").text());

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
            thisgraph.runningZ = thisgraph.runningZ < tmp.zorder ? tmp.zorder : thisgraph.runningZ;
          }

          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-to",$(this).find("edges-to:first")).each(function(k){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(), 
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text()),
              // booleans are read as strings, which need to be converted properly
              $(this).find("directed:first").text() == "true"
            );
          });
          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-from",$(this).find("edges-from:first")).each(function(l){
            thisgraph.updateEdge(
              parseInt($(this).find("id:first").text()),
              $(this).find("name:first").text(),
              $(this).find("color:first").text(),
              parseInt($(this).find("source-id").text()),
              parseInt($(this).find("target-id").text()),
              $(this).find("directed:first").text() == "true"
            );
          }); 
      });

      /* Must process these as well. expandWorld calls this multiple times. */
      if (thisgraph.scaleChanged != null)
        thisgraph.scaleChanged();
    },
    error: function(a,b,c){
      //alert("Cannot load notes: "+a+" "+b+" "+c);
    }
  });
}

/* Finds note by name. This call is synchronous. */
Sync.prototype.findNoteByName = function(name){
  var thisgraph = this.graph;
  var tmp = null;
  
  $.ajax({
    url: "/graphs/get_notes_by_name/" + thisgraph.id,
    type: "POST",
    data: {
      "name" : name
    },
    async: false,
    dataType: "xml",
    success: function(data){
      $("note", data).each(function(i) {
      tmp = new Note(thisgraph);
          tmp.x = parseInt($(this).find("x:first").text());
          tmp.y = parseInt($(this).find("y:first").text());
          tmp.width = parseInt($(this).find("width:first").text());  
          tmp.height = parseInt($(this).find("height:first").text());
      });
    },
    error: function(a,b,c){
      alert(a + b + c);
    }
  });
  return tmp;
}

/****************************************************************************
  Inform the server about a NEW EDGE.
  Gives the edge a server assigned id number.
 ****************************************************************************/

Sync.prototype.createEdge = function(edge){
  var e = edge;
  $.ajax({
    url: "/edges/create",
    type: "POST",
    data: {
      "edge[name]" : e.title,            
      "edge[color]" : e.color,           
      "edge[source_id]" : e.startNote.id,
      "edge[target_id]" : e.endNote.id,
      "edge[directed]" : e.directed
    },
    dataType: "xml",
    success: function(data){
      $("edge", data).each(function(i) {
        e.id = parseInt($(this).find("id:first").text());
      });
    },
    error: function(a,b,c){
      alert("Cannot create a new edge: "+a+b+c);
    }
  });
}

/****************************************************************************
  Inform the server about a EDGE DELETION.
 ****************************************************************************/

Sync.prototype.deleteEdge = function(edgeId){
  $.ajax({ url: "/edges/destroy/"+edgeId });
}


/****************************************************************************
  Inform the server about a EDGE NAME change.
 ****************************************************************************/

Sync.prototype.setEdgeName = function(edge, newName){
  var e = edge;
  $.ajax({
    url: "/edges/update/"+e.id,
    dataType: "html",
    data: { "edge[name]" : newName },
    success: function(data){
      e.name=newName;
      e.redraw();
    }
  });
}

/****************************************************************************
  Inform the server about a EDGE COLOR change.
 ****************************************************************************/

Sync.prototype.setEdgeColor = function(edge){
  $.ajax({
    url: "/edges/update/"+edge.id,
    data: { "edge[color]" : edge.color },
    dataType: "html"
  });
}

/****************************************************************************
  Inform the server about a EDGE DIRECTION change.
 ****************************************************************************/

Sync.prototype.setEdgeDirection = function(edge){
  $.ajax({
    url: "/edges/update/"+edge.id,
    data: { "edge[directed]" : edge.directed },
    dataType: "html"
  });
}


