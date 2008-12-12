// This file defines the MindWiki graph viewing and editing client


// TEMP function to externalize the "New Note by jQuery" onclick handling.
// Inspired by: http://www.alistapart.com/articles/behavioralseparation
function createNoteLink(){
  // Checking for browser support, I suppose
  if( document.getElementById &&
      document.getElementsByTagName ){
    if( document.getElementById( "new_note_link" ) ){
      // If we have a matching HTML-ID, we are safe to play with the object
      var jop = document.getElementById( "new_note_link" );
      jop.onclick = function(){
        return createNote();
      };
    }
  }
}

// Adds the function to be run at window.onload (see application.js)
addLoadEvent(createNoteLink);


// TEMPORARY note creation
function createNote() {
  var newNote = document.createElement("div");
  newNote.className = "note";
  $(newNote).append("<h2>A new note</h2><p>This doesn't save to db, yet. Refresh to delete.</p>");
  $(newNote).append("<p><table><td>Edit note</td><td> Delete note</td></table></p>");
  $(newNote).resizable().draggable();
  document.body.appendChild(newNote);
};



//update example. updates the edge from note1 to note2 to end up in 10,10
//edge_1_2.path[1].arg = [10,10];
//edge_1_2.redraw();
