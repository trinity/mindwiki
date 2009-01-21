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

  // SELECTION.
  // Multiselection is not implemented, yet!
  if(this.selected){
    // last note exists and isn't this one -> deselect it
    if(graph.last_selected_note != null && graph.last_selected_note != this){
      graph.last_selected_note.selected = false;
      graph.last_selected_note.update();
      graph.last_selected_note = this;
    }

    graph.last_selected_note = this;

    // Update this to have seleced appearance
    $(this.div).addClass("noteSelected").find(".noteButtonRow").show();
    graph.runningZ++;
    $(this.div).css({"zIndex":graph.runningZ}); // Bring selected to front. This is a temporary solution.

  } else {
    $(this.div).removeClass("noteSelected").find(".noteButtonRow").hide();
  }

  // Content rendering after edit
  if(this.articleDiv != null) 
    $(this.articleDiv).html(this.content);

  // Color change
  $(this.articleDiv).css({"backgroundColor": this.color});

  // Title change DOES NOT WORK! When did this break? :D
  $(this.titleTD).html(this.name);
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

  // First hide/delete edges and the note from client viewing:
  if(this.edgesTo != null){
    for(var i=0;i<this.edgesTo.length;i++){
      // Disassociate from the other note
      this.edgesTo[i].startNote.disconnectEdgeFromById(this.edgesTo[i].id);
      // Hide the edge
      this.edgesTo[i].undraw();
    }
  }
  if(this.edgesFrom != null){
    for(var i=0;i<this.edgesFrom.length;i++){
      // Disassociate from the other note
      this.edgesFrom[i].endNote.disconnectEdgeToById(this.edgesFrom[i].id);
      // Hide the edge
      this.edgesFrom[i].undraw();
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

// Just remove the div of the note from the DOM-tree. 
// Basically just hides the note from the UI.
// Used in note deletion and before redraw.
Note.prototype.deleteDivFromDom = function() {
  document.getElementById("vport").removeChild(this.div);
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
 

  // Content

  // Creating note elements
  var noteTable = document.createElement("table");
  var titleTD = document.createElement("td");
  var articleTD = document.createElement("td");
  var buttonRow = document.createElement("tr");
  var titleRow = document.createElement("tr");
  var articleRow = document.createElement("tr");
  var article = document.createElement("div");

  var buttonsTD = document.createElement("td");
  var buttonsDiv = document.createElement("div");
  
  /* These should probably have alttexts. */
  var deleteButton = document.createElement("div");
  var colorButton = document.createElement("div");
  var arrowButton = document.createElement("div");

  $(buttonsDiv).addClass("noteButtonTD");

  // arrow button
  $(arrowButton).addClass("noteArrowButton");
  $(arrowButton).click(function () {
    graph.globalStartNote = thisnote;
  });
  $(buttonsDiv).append(arrowButton);
	
  // color button
  $(colorButton).addClass("noteColorButton");
  $(colorButton).ColorPicker({
    color: thisnote.color,
    onShow: function(picker){
      $(picker).fadeIn(100);
      return false;
    },
    onHide: function(picker){
      $(picker).fadeOut(100);
      return false;
    },
    onSubmit: function(hsb, hex, rgb){
      thisnote.color = "#"+hex;
      thisnote.update();
      $.ajax({
        url: "/notes/update/"+thisnote.id,
        data: { "note[color]" : "#"+hex },
        dataType: "html",
        success: function(data){
          // :)
        }
      });
    }
  });
  $(".colorpicker").css({"zIndex": 9999999});
  $(buttonsDiv).append(colorButton);

  // delete button
  $(deleteButton).addClass("noteDeleteButton");
  $(deleteButton).click(function () { thisnote.remove(); });
  $(buttonsDiv).append(deleteButton);
  


  $(buttonsTD).append(buttonsDiv);
  // button row
  $(buttonRow).addClass("noteButtonRow").append(buttonsTD);

	
  // titleTD
  $(titleTD).addClass("noteTitleTD").attr("colspan",3).append(this.name);
  thisnote.titleTD = titleTD;
  // title row
  $(titleRow).addClass("noteTitleRow").append(titleTD);

  // article (div)
  $(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.content);
  thisnote.articleDiv = article; // for easier updating :)

  // launch editing:
  $(this.div).dblclick(function(ev) {
    // This code might be a bit flakey, still. Using the same textbox-id for all notes absolutely requires
    // the calling of dialog("destroy").remove() to not cause some really annoyingly strange behaviour..
    // Maybe FIX someday?

    $("#vport").append('<div id="editWindow" class="flora"></div>');
    $("#editWindow").append('<p>Title<br /><input type="text" size="30" id="titleInputField" value="'+thisnote.name+'"/></p><p>Content<br /><textarea rows="15" cols="75" id="editableContentBox">'+thisnote.editableContent+'</textarea></p>');
    $("#editableContentBox").markItUp(mySettings);
    $("#editWindow").css({"zIndex": "9999999"}); // isn't there a 'top' option? :)
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
  $(articleTD).addClass("noteArticleTD").css({"backgroundColor": this.color}).attr("colspan",3).append(article);
  // article row
  $(articleRow).addClass("noteArticleRow").append(articleTD);
 	

  // table
  $(noteTable).addClass("noteTable").append(titleRow).append(buttonRow).append(articleRow);
  $(this.div).append(noteTable);

  $(buttonRow).hide();

  $("#vport").append(this.div);
}
