// This file defines the MindWiki graph viewing and editing client

// Global baaad?
var graph_id;
var last_selected_note = null;
var rc; // raphael canvas

// Maybe more sophisticated containers?!
var notes = [];
var edges = [];

function getNoteById(id){
  var l = notes.length;
  for(var i=0;i<l;i++){
    if(notes[i].id == id)
      return notes[i];
  }
  return null;
}

function getEdgeById(id){
  var l = edges.length;
  for(var i=0;i<l;i++){
    if(edges[i].id == id)
      return edges[i];
  }
  return null;
}

$(document).ready(function(){

  // Load graph ID from the path variable.
  // Is ID the only numerical data in the path? Currently, yeah. Maybe sharpen up the regexp, still.
  var id_from_pathname = new RegExp(/\d+/).exec(location.pathname);
  graph_id = parseInt(id_from_pathname[0]); // RegExp.exec puts matches into an array
  $.ajax({
    url: "/graphs/get_color/" + graph_id,        
    success: function(data){
      $("#vport").css({"backgroundColor" : data});
    }
    // Fail silently, backgroundcolor isn't important :)
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

  loadAllNotes();

  // Stop events in class stop_propagation
  // Used for youtube-videos, for instance..
  $(".stop_propagation").livequery("mousedown", function(e){
    e.stopPropagation();
  });

  // global canvas used for all drawing
  rc = Raphael("vport", 9999, 9999);  

});

// Loads all notes from the database
function loadAllNotes() {

  // get ids
  $.ajax({
    url: "/graphs/get_note_ids/" + graph_id + ".xml",
    dataType: "xml",
    success: function(data){
      $("note",data).each(function(i) {
        // JAVASCRIPT IS NOT THREADED?! WTF?! SLOOOOW!
        loadNote(parseInt($(this).find("id").text()));
      });
    },
    error: function(a,b,c){
      alert("Cannot load note IDs: "+a+" "+b+" "+c);
    }
  });
};

function loadNote(noteId) {
  $.ajax({
    url: "/notes/show/" + noteId + ".xml",
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

          notes.push(tmp);
          tmp.redraw();
        });

        // load the edges
        jQuery.each(edgeIds, function(){
          loadEdge(this);
        });
    },
    error: function(a,b,c){
      alert("Cannot load note: "+a+" "+b+" "+c);
    }
  });
};



function loadEdge(edgeId) {

  var tmp = null;
  tmp = new Edge();

  $.ajax({
    url: "/edges/show/" + edgeId + ".xml",
    dataType: "xml",
    success: function(data){
      if(data != null && data != "" && data != "\n" && data != "E" && data != "E\n") {
        $("edge",data).each(function(i) {
          tmp.rCanvas = rc; // maybe somewhere else
          tmp.id = parseInt($(this).find("id").text());
          tmp.title = $(this).find("name").text();
          tmp.color = $(this).find("color").text();
          tmp.directed = true; // TODO!! $(this).find("content").text();

          var startNote = getNoteById(parseInt($(this).find("source-id").text()));
          var endNote = getNoteById(parseInt($(this).find("target-id").text()));
          tmp.setStartNote(startNote); // Yikes for not checking!
          tmp.setEndNote(endNote);

          // Give notes the reference to this edge, also:
          startNote.edgesFrom.push(tmp);
          endNote.edgesTo.push(tmp);

          tmp.update();
          edges.push(tmp);
        });
      }
    },
    error: function(a,b,c){
      alert("Cannot load edge: "+a+" "+b+" "+c);
    }

  });
}
