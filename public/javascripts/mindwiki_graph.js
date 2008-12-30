// This file defines the MindWiki graph viewing and editing client

// Global baaad?
var graph_id;
var last_selected_note = null;

window.onload = function(){

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
  $("#vport").dblclick( function(event)
  {
    var tmp = new Note();
    tmp.x = event.pageX - $(this).offset().left;
    tmp.y = event.pageY - $(this).offset().top;
    tmp.newID();
    tmp.redraw();
    // Let's select the new note right away, too.
    tmp.selected = true;
    tmp.update();		
  }
);
		
/* Moved to mindwiki_note.js
	$(".note").livequery("click", function(event)
	{
		// select:
		// - unselect previously selected if any
		// - show buttons
		// - highlight borders
		
		var clickedNote = this;
		
		// hide all
		$(".note").removeClass("noteSelected").find(".noteButtonRow").hide();
		
		// show the one which was clicked
		$(clickedNote).addClass("noteSelected").find(".noteButtonRow").show();
		
		event.stopPropagation();
		}
	);
*/		
	$(".note").livequery("dblclick", function(event)
	{
		// this event should never fire...
		event.stopPropagation();
	}
	);
		
/* Move to mindwiki_note.js
	$(".noteArticle").livequery("dblclick", function(event)
	{
		// launch edit...
		
		this.style.backgroundColor = "#aa7777"; //debug action
		event.stopPropagation();
	}
	);
*/
		
	$(".noteTitleTD").livequery("dblclick", function(event)
	{
		// this event is not used. we just prevent the dblclick
		// to bubble to parents.
		event.stopPropagation();
	}
	);

	loadAllNotes();

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
// FIX TO LOAD ONE AT A TIME!
function loadAllNotes() {
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
	alert("errordata: "+a+" "+b+" "+c);
    }
  });
};

