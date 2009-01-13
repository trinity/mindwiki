// This file defines the MindWiki graph viewing and editing client

// Global baaad?
var graph_id;
var last_selected_note = null;
var rc; // raphael canvas

// Maybe more sophisticated containers?!
var notes = [];
var edges = [];

function getNoteById(id){
  l = notes.length;
  for(var i=0;i<l;i++){
    if(notes[i].id == id)
      return notes[i];
  }
  return null;
}

function getEdgeById(id){
  l = edges.length;
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
    url: "/graphs/get_color/"+graph_id,        
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
		
  $("#vport").hover( function()
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
  );

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

// MAYBE MAKE A FUNCTION TO DRAW THE EDGES?!
// Some other day...
// Here is the old simple code from .html.erb for reference:
//  var raphael_canvas = Raphael(1,100,1000,1000);
//  <% n.edges_from.each do |e| %>
//    <script>
//      // MOVE REMAINING JAVASCRIPT
//      var edge_<%= e.source_id %>_<%= e.target_id %> = raphael_canvas.path({stroke: "<%= e.color %>"}).
//          absolutely().
//          moveTo(<%= e.source_note.x+e.source_note.width/2 %>,<%= e.source_note.y+e.source_note.height/2-100 %>).
//          lineTo(<%= e.target_note.x+e.target_note.width/2 %>,<%= e.target_note.y+e.target_note.height/2-100 %>);
//    </script>
//  <% end %>
//
// This can be used to update an edge after a note has been moved:
//
//update example. updates the edge from note1 to note2 to end up in 10,10
//edge_1_2.path[1].arg = [10,10];
//edge_1_2.redraw();
 

// Loads all notes from the database
function loadAllNotes() {

  // get ids
  $.ajax({
    url: "/graphs/get_note_ids/"+graph_id,
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


/*  // All notes in one chunk
    $.ajax({
    url: "/graphs/render_notes_xml/"+graph_id,
    dataType: "xml",
    success: function(data){
      $("note",data).each(function(i) {
        var tmp = new Note();
        tmp.id = parseInt($(this).find("id").text());
        tmp.name = $(this).find("name").text();
        tmp.x = parseInt($(this).find("x").text());
        tmp.y = parseInt($(this).find("y").text());
        tmp.width = parseInt($(this).find("width").text());
        tmp.height = parseInt($(this).find("height").text());
        tmp.color = $(this).find("color").text();
        tmp.content = $(this).find("content").text();
        tmp.editableContent = $(this).find("editableContent").text();
        //tmp.div = null; // redraw creates div
        tmp.redraw();
      });
    },
    error: function(a,b,c){
      alert("Cannot load all notes: "+a+" "+b+" "+c);
    }
  });
*/

};

function loadNote(noteId) {
  $.ajax({
    url: "/notes/show/"+noteId,
    dataType: "xml",
    success: function(data){
      if(data != null && data != "" && data != "\n" && data != "E" && data != "E\n") {

        // notes

        $("note",data).each(function(i) {
          var tmp = new Note();
          tmp.id = parseInt($(this).find("id").text());
          tmp.name = $(this).find("name").text();
          tmp.x = parseInt($(this).find("x").text());
          tmp.y = parseInt($(this).find("y").text());
          tmp.width = parseInt($(this).find("width").text());
          tmp.height = parseInt($(this).find("height").text());
          tmp.color = $(this).find("color").text();
          tmp.content = $(this).find("content").text();
          tmp.editableContent = $(this).find("editableContent").text();
          //tmp.div = null; // redraw creates div
          notes.push(tmp);
          tmp.redraw();
        });

        // edges ids

        var edgeIds = [];
        $("edge",data).each(function(i){
          var id = parseInt($(this).find("edgeid").text());
          if(edgeIds.indexOf(id) == -1){
            edgeIds.push(id);
          }
        });

        // load the edges
        jQuery.each(edgeIds, function(){
          loadEdge(this);
        });
      }
    },
    error: function(a,b,c){
      alert("Cannot load note: "+a+" "+b+" "+c);
    }
  });
};



function loadEdge(edgeId) {

  var tmp = null;
/*  if(edges[edgeId] != null)
    tmp = edges[edgeId];
  else
*/
    tmp = new Edge();

  $.ajax({
    url: "/edges/show/"+edgeId,
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
