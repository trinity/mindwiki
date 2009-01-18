// This file defines the MindWiki graph viewing and editing client

$(document).ready(function(){
  var graphs = /\/graphs\/\d+/; // regexp to identify pathnames that should have mindwiki graphs
  if(graphs.exec(document.location.pathname)){
    graph = new Graph(); // graph is now global.
  }
});

function Graph() {
  this.id = -1;
  this.last_selected_note = null;
  this.rc = Raphael("vport", 9999, 9999);; // Raphael canvas, FIXME: static size
  this.color = "#dddddd";

  this.globalStartNote = null; // Used when creating new edges
  this.runningZ = 10; // Used for z-index = "top". Will be replaced with specific z-order handling soon.

  // Maybe more sophisticated containers?!
  this.notes = [];
  this.edges = [];

  var thisgraph = this; // To be used in submethods

  // Load graph ID from the path variable.
  // Is ID the only numerical data in the path? Currently, yeah. Maybe sharpen up the regexp, still.
  var id_from_pathname = new RegExp(/\d+/).exec(location.pathname);
  this.id = parseInt(id_from_pathname[0]); // RegExp.exec puts matches into an array
  $.ajax({
    url: "/graphs/get_color/" + thisgraph.id,        
    success: function(data){
      thisgraph.color = data;
      $("#vport").css({"backgroundColor" : data});
    }
  });

  // NEW NOTE creation by double clicking in the viewport
  $("#vport").dblclick( function(event){
    var tmp = new Note();
    tmp.x = event.pageX - $(this).offset().left;
    tmp.y = event.pageY - $(this).offset().top;
    tmp.newID();
    tmp.redraw();
    // Let's select the new note right away, too.
    tmp.selected = true;
    tmp.update();		
  });
		
  $(".note").livequery("dblclick", function(event){
    // this event should never fire...
    event.stopPropagation();
  });
		
  /*$("#vport").hover( function()
  {
    $("#context_help").empty().append("Create new notes by double clicking");
  }
  );

  $(".note").livequery(function()
  {
    $(this).hover(function()
    {
      $("#context_help").empty().append("Double click to edit content");
    }
    );
  }
  );*/

  // Does not work for some reason
  /*$(".arrowButton").livequery(function()
  {
    $(this).hover(function()
    {
      $("#context_help").empty().append("Create connected note");
    }
    );
  }
  );*/
		
  $(".noteTitleTD").livequery("dblclick", function(event){
    // this event is not used. we just prevent the dblclick
    // to bubble to parents.
    event.stopPropagation();
  });

  this.loadAllNotes();

  // Stop events in class stop_propagation
  // Used for youtube-videos, for instance..
  $(".stop_propagation").livequery("mousedown", function(e){
    e.stopPropagation();
  });
}

Graph.prototype.getNoteById = function(id){
  var l = this.notes.length;
  for(var i=0;i<l;i++){
    if(this.notes[i].id == id)
      return this.notes[i];
  }
  return null;
}

Graph.prototype.getEdgeById = function(id){
  var l = this.edges.length;
  for(var i=0;i<l;i++){
    if(this.edges[i].id == id)
      return this.edges[i];
  }
  return null;
}


// Loads all notes from the database
Graph.prototype.loadAllNotes = function() {
  var thisgraph = this; // To be used in submethods
  // get ids
  $.ajax({
    url: "/graphs/get_note_ids/" + thisgraph.id,
    dataType: "xml",
    success: function(data){
      $("note",data).each(function(i) {
        thisgraph.loadNote(parseInt($(this).find("id").text()));
      });
    },
    error: function(a,b,c){
      alert("Cannot load note IDs: "+a+" "+b+" "+c);
    }
  });
};

Graph.prototype.loadNote = function(noteId) {
  var thisgraph = this; // To be used in submethods
  $.ajax({
    url: "/notes/show/" + noteId,
    dataType: "xml",
    success: function(data){
        var edgeIds = [];

        // notes

        $("note",data).each(function(i) {
          var tmp = new Note();
          tmp.id = parseInt($(this).find("id:first").text());
          tmp.name = $(this).find("name:first").text();
          tmp.x = parseInt($(this).find("x:first").text());
          tmp.y = parseInt($(this).find("y:first").text());
          tmp.width = parseInt($(this).find("width:first").text());
          tmp.height = parseInt($(this).find("height:first").text());
          tmp.color = $(this).find("color:first").text();
          //tmp.div = null; // redraw creates div

          $("article",this).each(function(j){ // There's really only one :)
            tmp.content = $(this).find("content_rendered:first").text();
            var contentType = parseInt($(this).find("content_type:first").text());
            if(contentType == 1) // RedCloth-parse included
              tmp.editableContent = $(this).find("content:first").text();
          });
          
          // Escapes the edges-to array first, then loops edges-to -fields inside
          $("edges-to",$(this).find("edges-to:first")).each(function(k){
            var id = parseInt($(this).find("id:first").text());
            if(edgeIds.indexOf(id) == -1){ // doesn't work
              edgeIds.push(id);
            }
          });

          thisgraph.notes.push(tmp);
          tmp.redraw();
        });

        // load the edges
        jQuery.each(edgeIds, function(){
          thisgraph.loadEdge(this);
        });
    },
    error: function(a,b,c){
      alert("Cannot load note: "+a+" "+b+" "+c);
    }
  });
};



Graph.prototype.loadEdge = function(edgeId) {
  var thisgraph = this; // To be used in submethods

  var tmp = null;
  tmp = new Edge();

  $.ajax({
    url: "/edges/show/" + edgeId,
    dataType: "xml",
    success: function(data){
      if(data != null && data != "" && data != "\n" && data != "E" && data != "E\n") {
        $("edge",data).each(function(i) {
          tmp.rCanvas = thisgraph.rc; // maybe somewhere else
          tmp.id = parseInt($(this).find("id").text());
          tmp.title = $(this).find("name").text();
          tmp.color = $(this).find("color").text();
          tmp.directed = true; // TODO!! $(this).find("content").text();

          var startNote = thisgraph.getNoteById(parseInt($(this).find("source-id").text()));
          var endNote = thisgraph.getNoteById(parseInt($(this).find("target-id").text()));
          tmp.setStartNote(startNote); // Yikes for not checking!
          tmp.setEndNote(endNote);

          // Give notes the reference to this edge, also:
          startNote.edgesFrom.push(tmp);
          endNote.edgesTo.push(tmp);

          tmp.update();
          thisgraph.edges.push(tmp);
        });
      }
    },
    error: function(a,b,c){
      alert("Cannot load edge: "+a+" "+b+" "+c);
    }

  });
}
