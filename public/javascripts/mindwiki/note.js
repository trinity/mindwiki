// This file defines the MindWiki note objects

// Note is the "class" for all notes.
function Note() {
  this.id = -1;
  this.name = "New note";
  this.x = 1;
  this.y = 1;
  this.width = 300;
  this.height = 200;
  this.color = "#dddddd";
  this.content = "<p>Default content.</p>"; // <p> -tag bumps the layout ~10px down. What?-o
  this.editableContent = "Default content."; // RedCloth-syntax. What the user edits.

  this.edgesTo = [];
  this.edgesFrom = [];

  this.selected = false;

  // These make updating easier
  this.div = null;
  this.articleDiv = null; 
  this.titleTD = null;
}

// Update the note on the screen to reflect the note object.
Note.prototype.update = function() {
  // Maybe split into smaller functions?

  graph.dragControls(this);
  // SELECTION.
  // Multiselection is not implemented, yet!
  if(this.selected){
    // last note exists and isn't this one -> deselect it
    if(graph.last_selected_note != null && graph.last_selected_note != this){
      graph.last_selected_note.selected = false;
      graph.last_selected_note.update();
    }

    graph.last_selected_note = this;

    $(this.titleTD).addClass("noteTitleTD").css({"backgroundColor": lightenColor(this.color)});
    $(this.div).addClass("note").css({
      "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
      "position" : "absolute",
      "top" : this.y +"px",
      "left" : this.x+"px",
      "width" : this.width+"px"});

    $(this.div).addClass("noteSelected");
    graph.attachControls(this);
    
    graph.runningZ++;
    $(this.div).css({"zIndex":graph.runningZ}); // Bring selected to front. This is a temporary solution.

  } else {
    $(this.div).removeClass("noteSelected");
    /* graph.detachControls(thisnote); */
  }

  // Content rendering after edit
  if(this.articleDiv != null) 
    $(this.articleDiv).html(this.content);

  // Color change
  $(this.articleDiv).css({"backgroundColor": this.color});

  // Title change DOES NOT WORK! When did this break? :D
  $(this.titleTD).html(this.name);
}

Note.prototype.getEdgeToById = function(id){
  var l = this.edgesTo.length;
  for(var i=0;i<l;i++){
    if(this.edgesTo[i].id == id)
      return this.edgesTo[i];   
  }
  return null;
}

Note.prototype.getEdgeFromById = function(id){
  var l = this.edgesFrom.length;
  for(var i=0;i<l;i++){
    if(this.edgesFrom[i].id == id)
      return this.edgesFrom[i];   
  }
  return null;
}


// Notifies the controller of updated coordinates

// Warning: jQuery does not validate empty page with OK status as 
// success without (for example) dataType: "html"

Note.prototype.updatePosition = function() {
  var thisnote = this;
  $.ajax({
    url: "/notes/update/"+thisnote.id,
    dataType: "html",
    data: {
      "note[x]" : thisnote.x,
      "note[y]" : thisnote.y
    },
    success: function(data){
      // ...
    },
    error: function(a,b,c){
      // ...
    }
  });
}

// Notifies the controller of updated size
Note.prototype.updateSize = function() {
  var thisnote = this;
  $.ajax({
    url: "/notes/update/"+thisnote.id,
    dataType: "html",
    data: {
      "note[width]" : thisnote.width,
      "note[height]" : thisnote.height
    },
    success: function(data){
      // ...
    },
    error: function(a,b,c){
      // ...
    }
  });
}

// Delete note.
Note.prototype.remove = function() {
  var thisnote = this;

  // Make sure controls are not visible on this one
  graph.detachControls(thisnote);

  // First hide/delete edges and the note from client viewing:
  if(this.edgesTo != null){
    for(var i=0;i<this.edgesTo.length;i++){
      // Disassociate from the other note
      this.edgesTo[i].startNote.disconnectEdgeFromById(this.edgesTo[i].id);
      // Erase the edge from the display
      this.edgesTo[i].erase();
      graph.disconnectEdge(this.edgesFrom[i].id);
    }
  }
  if(this.edgesFrom != null){
    for(var i=0;i<this.edgesFrom.length;i++){
      // Disassociate from the other note
      this.edgesFrom[i].endNote.disconnectEdgeToById(this.edgesFrom[i].id);
      // Erase the edge from the display
      this.edgesFrom[i].erase();
      graph.disconnectEdge(this.edgesFrom[i].id);

    }
  }
  this.deleteDivFromDom();

  // Notify the graph object
  graph.disconnectNote(this.id);

  // Notify the server
  $.ajax({
    url: "/notes/destroy/"+thisnote.id,
    error: function(a,b,c){
      alert("Cannot delete note id "+thisnote.id+" from database: "+a+b+c);
    }
  });
  delete this;
}

// Removes an edge from container.
// Used by disconnectEdge[From|To]ById
Note.prototype.removeEdge = function(container, edgeId){
  var l = container.length;
  var delIndex = -1;
  for(var i=0;i<l;i++){
    if(container[i].id == edgeId){
      delIndex = i;
      break;
    }
  }
  if(delIndex >= 0){
    container.splice(delIndex,1);
  }
}

Note.prototype.disconnectEdgeFromById = function(edgeId){
  this.removeEdge(this.edgesFrom, edgeId);
}

Note.prototype.disconnectEdgeToById = function(edgeId){
  this.removeEdge(this.edgesTo, edgeId);
}


// Moves the viewpoint to center on this note
Note.prototype.center = function(){
  var thisnote = this;
  // scrollTo scrolls the upper left corner to the coordinates it is given. 
  // To center the note, we need to calculate offsets according to the size of the viewport.
  var vpWidth = $("#vport").width();
  var vpHeight = $("#vport").height();
  var xOffset = Math.floor(vpWidth/2)-Math.floor(thisnote.width/2);
  var yOffset = Math.floor(vpHeight/2)-Math.floor(thisnote.height/2);
  var moveToX = thisnote.x - xOffset;
  var moveToY = thisnote.y - yOffset;
  if(moveToX<0)moveToX=0;
  if(moveToY<0)moveToY=0;
  $("#vport").scrollTo({left:moveToX, top:moveToY},100,{axis:"xy"}); // 100 is the scroll time
}

// Just remove the div of the note from the DOM-tree. 
// Basically just hides the note from the UI.
// Used in note deletion and before redraw.
Note.prototype.deleteDivFromDom = function() {
  document.getElementById("mindwiki_world").removeChild(this.div);
}

// Get new ID from DB.
// Use after creating a new note.
Note.prototype.newID = function() {
  var thisnote = this;
  $.ajax({
    url: "/notes/create",
    type: "POST",
    data: {
      "graph_id" : graph.id,
      "note[name]" : thisnote.name,    
      "note[color]" : thisnote.color,             
      "note[x]" : thisnote.x,                        
      "note[y]" : thisnote.y,        
      "note[width]" : thisnote.width,         
      "note[height]" : thisnote.height,        
      "article_content" : thisnote.content
    },
    dataType: "xml",
    success: function(data){
      $("note", data).each(function(i) {
        thisnote.id = parseInt($(this).find("id").text());
      });
    },
    error: function(a,b,c){
      alert("Cannot create new note to db: "+a+b+c);
    }
  });
}

// This function (re)constructs the whole div!
// Use after loading a Note with data.
Note.prototype.redraw = function() {
  var thisnote = this; // To be used in submethods, e.g. click-handlers.

  if(this.div != null){
    thisnote.deleteDivFromDom();
  }
  this.div = document.createElement("div");

  $(this.div).addClass("note").css({
    "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
    "position" : "absolute",
    "top" : this.y+"px",
    "left" : this.x+"px",
    "width" : this.width+"px",
    "height" : this.height+"px"
  });

  // Behaviour
  $(this.div)
  .resizable(
  {
    minWidth: 120,
    minHeight: 80,
    maxWidth: 800,
    maxHeight: 800,
    handles:  'se', // defines the resize handle location i.e. south east corner
    // Update note size after dragging.
    stop: function(event, ui){
      thisnote.width = ui.size.width;
      thisnote.height = ui.size.height;
      thisnote.updateSize();
    },
    resize: function(event, ui){
      thisnote.width = ui.size.width;
      thisnote.height = ui.size.height;
      // let's update the related edges:
      var l = thisnote.edgesTo.length;
      for(var i=0;i<l;i++){
        thisnote.edgesTo[i].redraw();
      }
      l = thisnote.edgesFrom.length;
      for(var i=0;i<l;i++){
        thisnote.edgesFrom[i].redraw();
      }
      graph.dragControls(thisnote);
    }
  })
  .draggable(
  {
    zIndex: 10000,
    containment: "parent",
    // Update note position after dragging.
    stop: function(event, ui){
      thisnote.x = ui.position.left;
      thisnote.y = ui.position.top;
      thisnote.updatePosition();
    },
    drag: function(event, ui){
      thisnote.x = ui.position.left;
      thisnote.y = ui.position.top;
      // let's update the related edges:
      var l = thisnote.edgesTo.length;
      for(var i=0;i<l;i++){
        thisnote.edgesTo[i].redraw();
      }
      l = thisnote.edgesFrom.length;
      for(var i=0;i<l;i++){
        thisnote.edgesFrom[i].redraw();
      }
      graph.dragControls(thisnote);
    }
  });

  // Selection
  $(this.div).mousedown( function(ev)
  {
    // Checks whether it is a single or dblclick. 
    if (ev.detail == 1) {
	
		// Are we in the edge creation mode?
		if (graph.globalStartNote != null) {
			// Create edge. No selection.
			var tmpEdge = new Edge();
			tmpEdge.rCanvas = graph.rc;
			tmpEdge.setStartNote(graph.globalStartNote);
			tmpEdge.setEndNote(thisnote);
			tmpEdge.newID(); // notifies server
			//add the edge to notes for updating
			graph.globalStartNote.edgesFrom.push(tmpEdge);
			thisnote.edgesTo.push(tmpEdge);
      tmpEdge.update();
			tmpEdge.draw(); // draws clientside
			graph.globalStartNote = null; // ready for a new edge to be created
			graph.edges.push(tmpEdge);
		}
		// Normal note selection (not in the edge creation mode)
		else {
        		thisnote.selected = true;
 			thisnote.update();
		}
	}
  });

  // Center the selected note on the viewport, if the user prefers so.
  // FIXME: Clicking the content stops bubbling into this event.
  $(this.div).mouseup( function(e){
    if(e.detail == 1 && graph.globalStartNote == null && graph.scrollToSelected)
      thisnote.center();
  });
 

  // Content

  // Creating note elements
  var titleTD = document.createElement("div");
  var article = document.createElement("div");

	
  // titleTD
  $(titleTD).addClass("noteTitleTD").css({"backgroundColor": lightenColor(this.color)}).append(this.name);
  thisnote.titleTD = titleTD;

  // article (div)
  $(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.content);
  thisnote.articleDiv = article; // for easier updating :)

  // launch editing:
  $(this.div).dblclick(function(ev) {
    // This code might be a bit flakey, still. Using the same textbox-id for all notes absolutely requires
    // the calling of dialog("destroy").remove() to not cause some really annoyingly strange behaviour..
    // Maybe FIX someday?

    $("#mindwiki_world").append('<div id="editWindow" class="flora"></div>');
    $("#editWindow").append('<p>Title<br /><input type="text" size="30" id="titleInputField" value="'+thisnote.name+'"/></p><p>Content<br /><textarea rows="15" cols="75" id="editableContentBox">'+thisnote.editableContent+'</textarea></p>');
    $("#editableContentBox").markItUp(mySettings);
    $("#editWindow").css({"zIndex": "9999999", "overflow": "auto"}); // isn't there a 'top' option? :)
    $("#editWindow").dialog({
      width: 750,
      height: 550,
      modal: true,
      title: thisnote.name+" (Editing)",
      buttons: {
        "Cancel": function(){
          $(this).dialog("destroy").remove();
        },
        "Save": function(){
           
          // Yes, it would be faster to have only one ajax-call...

          // Updating the title
          var newTitle = $("#titleInputField").val();
          if(thisnote.name != newTitle){
            $.ajax({
              url: "/notes/update/"+thisnote.id,
              dataType: "html",
              data: { "note[name]" : newTitle },
              success: function(data){
                // yay!
                thisnote.name = newTitle;
                thisnote.update();
              },
              error: function(a,b,c){
                //alert("Cannot update title: "+a+b+c);
              }
            });
          }

          // Updating the content
          var boxContents = $("#editableContentBox").val();
          thisnote.editableContent = boxContents;
          thisnote.content = "Rendering edited content, please wait..."; // Javascript isn't actually threaded, so user never sees this :(
          $.ajax({
            url: "/notes/update_content/"+thisnote.id,
            data: { "newContent" : boxContents },
            dataType: "html",
            success: function(data){
              thisnote.content=data;
              thisnote.update();
            },
            error: function(a,b,c){
              alert("Cannot update content: "+a+b+c);
            }
          });
          $(this).dialog("destroy").remove(); // Don't edit lightly :)
        }
      }
    });
  });

  // articleTD
  //$(articleTD).addClass("noteArticleTD").css({"backgroundColor": this.color}).attr("colspan",3).append(article);
  // article row
  $(this.div).append(article);

  // table
  $(this.div).append(titleTD);

  $("#mindwiki_world").append(this.div);
}

function lightenColor (color) {
  mult = 1.3;
  color = color.substring(1,7);
  color = parseInt(color, 16);
  r = (color >> 16) & 255;
  g = (color >> 8) & 255;
  b = (color >> 0) & 255;
  
  maxx = 0;
  maxx = r * mult > maxx ? maxx = r * mult : maxx;
  maxx = g * mult > maxx ? maxx = g * mult : maxx;
  maxx = b * mult > maxx ? maxx = b * mult : maxx;
  if (maxx > 255)
    mult = 1 - (mult - 1);
  r *= mult;
  g *= mult;
  b *= mult;
  if (mult < 1.0) {
    r = r < 0 ? 0 : r;
    g = g < 0 ? 0 : g;
    b = b < 0 ? 0 : b;
  }
  /*
  r = r > 255 ? 255 : r;
  g = g > 255 ? 255 : g;
  b = b > 255 ? 255 : b;*/
  
  color = (r << 16) | (g << 8) | b;
  color = color.toString(16);
  while(color.length < 6)
  	color = "0" + color;
  return "#" + color;
}
