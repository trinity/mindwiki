// This file defines the MindWiki graph viewing and editing client

// Global baaad?
var graph_id;
// TEMP! We should implement an actual data model for the graph.
var notes = new Array();

window.onload = function(){

  // Load graph ID from the path variable.
  // Is ID the only numerical data in the path? Currently, yeah. Maybe sharpen up the regexp, still.
  var id_from_pathname = new RegExp(/\d+/).exec(location.pathname);
  graph_id = parseInt(id_from_pathname[0]); // RegExp.exec puts matches into an array

  // Note creation by double clicking in the window
  $("div.mindwiki_window").dblclick(function () {
    createNote();
  });

  loadAllNotes();

};

function deleteNote(id) {
  $.ajax({
    url: "/notes/destroy/"+id+"?graph_id="+graph_id, // fetches a "bit" too much data -> fix controller
    success: function(data){
      $("#note_id_"+id).hide(); // Maybe make remove work instead? :)
      $("#note_id_"+id).empty();
      // DOES NOT WORK: $("div.mindwiki_window").remove("#note_id_"+id);
    },
    error: function(a,b,c){
      alert(a+" "+b+" "+c);
    }
  });
};

// Maybe have a clean html for the structure?
function loadNote(id, name,x,y,width,height,color,content) {
  var newNote = document.createElement("div");
  newNote.setAttribute("id","note_id_"+id);
  newNote.className = "note"; // default style
//  $(newNote).css("color",color);
  var co = {
    "backgroundColor" : color, 
    "top" : y+"px", 
    "left" : x+"px", 
    "width" : width+"px", 
    "height" : height+"px"}
  $(newNote).css(co);
//  $(newNote).css("top",y);
  $(newNote).append("<h2>"+name+"</h2>");
  $(newNote).append(content);
  // Messy :(
  $(newNote).append("<p><table><td>Edit note</td><td><a href=\"#\" onclick=\"deleteNote("+id+")\"> Delete note</a></td></table></p>");
  $(newNote).resizable().draggable({containment: "parent"});
  // Adding to all mindwiki_windows-classes. Maybe a bit over the top, as an ID would be fine.
  notes[id] = newNote;
  $("div.mindwiki_window").append(newNote);
};
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
  $.ajax({
    url: "/graphs/render_notes_xml/"+graph_id,
    dataType: "xml",
    success: function(data){
      $("note",data).each(function(i) {
        loadNote(
          // FRAGILE AS H#"¤!
          $(this).find("id").text(),
          $(this).find("name").text(),
          $(this).find("x").text(),
          $(this).find("y").text(),
          $(this).find("width").text(),
          $(this).find("height").text(),
          $(this).find("color").text(),
          $(this).find("content").text()
        );
      });
    },
    error: function(a,b,c){
      alert("errordata: "+a+" "+b+" "+c);
    }
  });
};

// TEMPORARY note creation -> no db insert
function createNote() {
  var newNote = document.createElement("div");
  newNote.className = "note";
  $(newNote).append("<h2>A new note</h2><p>This doesn't save to db, yet. Refresh to delete.</p>");
  $(newNote).append("<p><table><td>Edit note</td><td> Delete note</td></table></p>");
  $(newNote).resizable().draggable({containment: "parent"});
  // Adding to all mindwiki_windowses within the class. Maybe a bit over the top, as an ID would be fine.
  $("div.mindwiki_window").append(newNote);
};

// TEST: Does this now call asdf-function every 5 secs?
// IT DOES! YAY! :)
// Maybe use jQuery $.ajax instead, though...
// new PeriodicalExecuter(function() {new Ajax.Request("/graphs/asdf")}, 5);
