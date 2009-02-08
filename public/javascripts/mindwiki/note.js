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
  this.origColor = "#dddddd";
  this.content = ""; // <p> -tag bumps the layout ~10px down. What?-o
  this.editableContent = ""; // RedCloth-syntax. What the user edits.

  this.edgesTo = [];
  this.edgesFrom = [];

  this.selected = false;
  this.enabled = true;

  // These make updating easier
  this.div = null;
  this.articleDiv = null; 
  this.titleTD = null;
}

Note.prototype.updateCSS = function() {
  $(this.titleTD).css({"backgroundColor": lightenColor(this.color)});
  $(this.div).css({
    "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
    "position" : "absolute",
    "top" : graph.vp.toLocalY(this.y) + "px",
    "left" : graph.vp.toLocalX(this.x) + "px",
    "width" : this.width+"px"
  });

  // Color change
  $(this.articleDiv).css({"backgroundColor": this.color});
}

// Update the note on the screen to reflect the note object.
Note.prototype.update = function() {
  // Maybe split into smaller functions?
  // -position and width changes
  // -color changes
  // -selection changes ... ?
  
  // SELECTION.
  // Multiselection is not implemented, yet!
  if(this.selected){
    // last note exists and isn't this one -> deselect it
    if(graph.selectedNote != null && graph.selectedNote != this){
      graph.selectedNote.selected = false;
      graph.selectedNote.update();
    }

    graph.selectedNote = this;

    this.updateCSS();
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

Note.prototype.enable = function() 
{
  $(this.div).removeClass("noteDisabled");
  this.color = this.origColor;
  this.updateCSS();
  // TODO: make real css classes for these, if these are accepted?
  $(this.titleTD).css({"cursor": "default", "color" : "black", "opacity" : "1.0"});
  $(this.articleDiv).css({"cursor": "default", "color" : "black", "opacity" : "1.0"});
  this.enabled = true;
}

Note.prototype.disable = function() 
{
  if (!this.enabled)
  {
    // already disabled
    return;
  }
  this.origColor = this.color;
  this.color = deColorize ("#ffffff", 0.4);
  this.updateCSS();
  // FIXME: "not-allowed" is not supported in all browsers. find better one...
  // TODO: make real css classes for these, if these are accepted?
  $(this.titleTD).css({"cursor": "not-allowed", "color" : "gray", "opacity" : "0.3"}); 
  $(this.articleDiv).css({"cursor": "not-allowed", "color" : "gray", "opacity" : "0.3"});
  $(this.div).addClass("noteDisabled");
  this.enabled = false;
}

Note.prototype.enableTargetNotes = function() {
  for(var i=0;i<this.edgesFrom.length;i++){
    this.edgesFrom[i].endNote.enable();
  }
}

Note.prototype.disableTargetNotes = function() {
  for(var i=0;i<this.edgesFrom.length;i++){
    this.edgesFrom[i].endNote.disable();
  }
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
      graph.disconnectEdge(this.edgesTo[i].id);
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

  // TODO: Have graph object call the sync/delete also.
  // Notify the graph object
  graph.disconnectNote(this.id);
  // Notify the server
  graph.sync.deleteNote(thisnote.id);

  // Delete the object
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
  
  if (graph.newViewport == true) /* Does not currently work perfectly. */
    ;//graph.vp.setViewFastMove(moveToX, moveToY);
    //graph.vp.setView(moveToX, moveToY);
  else {
    if(moveToX<0)moveToX=0;
    if(moveToY<0)moveToY=0;
    $("#vport").scrollTo({left:moveToX, top:moveToY},100,{axis:"xy"}); // 100 is the scroll time
  }
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
  graph.sync.createNote(this);
  graph.notes.push(this);
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
    "top" : graph.vp.toLocalY(this.y) + "px",
    "left" : graph.vp.toLocalX(this.x) + "px",
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
    // Update note size after resizing.
    stop: function(event, ui){
      thisnote.width = ui.size.width;
      thisnote.height = ui.size.height;
      graph.sync.setNoteSize(thisnote.id, thisnote.width, thisnote.height);
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
    zIndex: 10000, // Enough? Maybe not always.
    containment: "parent",
    // Update note position after dragging.
    start: function(event, ui){
      if (graph.controlsAfterDrag == true)
        graph.detachControls(thisnote);
    },
    stop: function(event, ui){
      thisnote.x = graph.vp.toWorldX(ui.position.left);
      thisnote.y = graph.vp.toWorldY(ui.position.top);
      graph.sync.setNotePosition(thisnote.id, thisnote.x, thisnote.y);
      if (graph.controlsAfterDrag == true)
        graph.attachControls(thisnote);
    },
    drag: function(event, ui){
      thisnote.x = graph.vp.toWorldX(ui.position.left);
      thisnote.y = graph.vp.toWorldY(ui.position.top);
      // let's update the related edges:
      var l = thisnote.edgesTo.length;
      for(var i=0;i<l;i++){
        thisnote.edgesTo[i].redraw();
      }
      l = thisnote.edgesFrom.length;
      for(var i=0;i<l;i++){
        thisnote.edgesFrom[i].redraw();
      }
      if (graph.controlsAfterDrag == false)
        graph.dragControls(thisnote);

      // Safari 3.2 redraw workaround.
      if ($.browser.safari && $.browser.version <= 3)
        graph.rc.circle(0, 0, 10).remove();
    }
    //cancel: ":input,.noteArticle" // Cannot drag from article content
  });
  $(this.div).mouseover( function()
  {
    /* Do not attempt to highlight note which we are creating edge from. */
    if (graph.globalStartNote != null || graph.globalStartNote != thisnote) {
      /* Guessing adding context help here is not necessary. */
      $(thisnote.div).addClass("noteTargeted");
      graph.lastTargetNote = thisnote;
    }
  });
  
  $(this.div).mouseout( function()
  {
    if (graph.lastTargetNote != null) {
      $(thisnote.div).removeClass("noteTargeted");
      graph.lastTargetNote = null;
    }
  });
  
  // Selection
  $(this.div).mousedown( function(ev)
  {
    ev.stopPropagation();
    
    if (!thisnote.enabled) {
      return;
    }
    
    // Checks whether it is a single or dblclick. 
    if (ev.detail == 1 || ev.detail == null) { // null makes things work in IE
    	/* End edge creation mode if user clicks on same note. */
      if (graph.globalStartNote == thisnote) {
        /* Restore color. */
        thisnote.enable();
        thisnote.enableTargetNotes();
        graph.globalStartNote = null; // ready for a new edge to be created
        graph.ch.resetPriority(0);
        graph.ch.set("");
        return;
      }
      // Are we in the edge creation mode?
      if (graph.globalStartNote != null) {
        graph.globalStartNote.enable();
        graph.globalStartNote.enableTargetNotes();
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
        graph.addEdge(tmpEdge);
        graph.ch.resetPriority(0);
        graph.ch.set("");
      }
      // Normal note selection (not in the edge creation mode)
      else {
        graph.unselectEdge();
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
  $(titleTD).addClass("noteTitle").css({"backgroundColor": lightenColor(this.color)}).append(this.name);
  thisnote.titleTD = titleTD;

  // article (div)
  $(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.content);
  thisnote.articleDiv = article; // for easier updating :)

  // launch editing:
  $(this.div).dblclick(function(ev) {
    // This code might be a bit flakey, still. Using the same textbox-id for all notes absolutely requires
    // the calling of dialog("destroy").remove() to not cause some really annoyingly strange behaviour..
    // Maybe FIX someday?

    if (!thisnote.enabled)
    {
      return;
    }

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

          // Updating the title
          var newTitle = $("#titleInputField").val();
          if(thisnote.name != newTitle){
            graph.sync.setNoteName(thisnote, newTitle);
          }

          // Updating the content
          var boxContents = $("#editableContentBox").val();
          thisnote.editableContent = boxContents;
          thisnote.content = "Rendering edited content, please wait...";
          graph.sync.setNoteContent(thisnote, boxContents);
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

