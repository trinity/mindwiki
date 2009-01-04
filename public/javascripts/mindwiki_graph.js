// This file defines the MindWiki graph viewing and editing client

// Global baaad?
var graph_id;
var last_selected_note = null;
var rc; // raphael canvas

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
		
		
  $(".noteTitleTD").livequery("dblclick", function(event){
    // this event is not used. we just prevent the dblclick
    // to bubble to parents.
    event.stopPropagation();
  });

  loadAllNotes();

  rc = Raphael("vport", 9999, 9999); // drawing coordinates relative to #vport

  // TEMP drawArrow test:
	/*
	drawArrow(100,100,100,50);
	drawArrow(100,100,150,50);
	drawArrow(100,100,150,100);
	drawArrow(100,100,150,150);
	drawArrow(100,100,100,150);
	drawArrow(100,100,50,150);
	drawArrow(100,100,50,100);
	drawArrow(100,100,50,50);
	*/
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
      }
    },
    error: function(a,b,c){
      alert("Cannot load note: "+a+" "+b+" "+c);
    }
  });
};

function drawArrow(x1, y1, x2, y2) 
{
  rc.path({stroke: "#000000"}).absolutely().moveTo(x1,y1).lineTo(x2,y2);
	
	var arrowSize = 10;
	
	// vievport doesn't have standard coordinate system. that's why we count each y-coordinate
	// as negative to use standard 2D algebra.
	var negy1 = -y1;
	var negy2 = -y2;
	
	var a1 = getAngle(x1, negy1, x2, negy2);
	var aLeft = a1 - 0.85 * Math.PI;
	var aRight = a1 + 0.85 * Math.PI;
	var xLeft = x2 + arrowSize * Math.cos(aLeft);
	var yLeft = -(negy2 + arrowSize * Math.sin(aLeft));
	var xRight = x2 + arrowSize * Math.cos(aRight);
	var yRight = -(negy2 + arrowSize * Math.sin(aRight));
	
  rc.path({stroke: "#000000", fill: "#000000"}).absolutely().moveTo(x2,y2).lineTo(xLeft,yLeft).lineTo(xRight,yRight).andClose();
};

function getAngle(x1, y1, x2, y2) 
{
	// returns the angle from point (x1,y1) to (x2,y2).
	// assumes standrad coordinate system
	
	// let's handle main axis first
	if (x2 == x1)
	{
		if (y1 < y2)
		{
			return Math.PI / 2;
		}
		return 1.5 * Math.PI;
	}
	else if (y2 == y1)
	{
		if (x1 > x2)
		{
			return Math.PI;
		}
		return 0;
	}

	// other angles
	if (x1 > x2)
	{
		return Math.PI + Math.atan((y2-y1)/(x2-x1));
	}
	return Math.atan((y2-y1)/(x2-x1));
}