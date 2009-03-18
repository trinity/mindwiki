// This file defines the MindWiki note objects

// Note is the "class" for all notes.
function Note(graph) {
  this.visited = false;
  this.graph = graph;
  this.id = -1;
  this.name = "New note";
  this.x = 1;
  this.y = 1;
  this.width = 300;
  this.height = 200;
  this.color = "#dddddd";
  this.zorder = 10;
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
  var thisgraph = this.graph;

  $(this.titleTD).css({"backgroundColor": lightenColor(this.color)});
  $(this.div).css({
    "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
    "position" : "absolute",
    "top" : thisgraph.vp.toLocalY(this.y) + "px",
    "left" : thisgraph.vp.toLocalX(this.x) + "px",
    "width" : thisgraph.vp.scaleToView(this.width) + "px",
    "height" : thisgraph.vp.scaleToView(this.height) + "px"
  });

  // Color change
  $(this.articleDiv).css({"backgroundColor": this.color});
}

Note.prototype.scaleChanged = function() {
  var thisgraph = this.graph;
  
  $(this.div).resizable('option', 'minWidth', thisgraph.vp.scaleToView(120));
  $(this.div).resizable('option', 'minHeight', thisgraph.vp.scaleToView(80));
  $(this.div).resizable('option', 'maxWidth', thisgraph.vp.scaleToView(thisgraph.vp.canvasBoundry));
  $(this.div).resizable('option', 'maxHeight', thisgraph.vp.scaleToView(thisgraph.vp.canvasBoundry));
}

// SELECTION.
// Multiselection is not implemented, yet!
Note.prototype.select = function() {
 var thisgraph = this.graph;
 var thisnote = this;

 if (this.selected == true)
   return;
 
 this.selected = true;
 
 $(this.div)
 .resizable(
  {
    minWidth: thisgraph.vp.scaleToView(120),
    minHeight: thisgraph.vp.scaleToView(80),
    maxWidth: thisgraph.vp.scaleToView(thisgraph.vp.canvasBoundry),
    maxHeight: thisgraph.vp.scaleToView(thisgraph.vp.canvasBoundry),
    handles:  'se', // defines the resize handle location i.e. south east corner
    start: function(event, ui){
      /* Ensure canvas is large enough so note can leave visible viewport.
       * This seems to cause problems with ff3. Call setView after drag ends instead. */
      //thisgraph.vp.setView(thisgraph.vp.x1, thisgraph.vp.y1);
    },
    // Update note size after resizing.
    stop: function(event, ui){
      thisnote.width = thisgraph.vp.scaleToWorld(ui.size.width);
      thisnote.height = thisgraph.vp.scaleToWorld(ui.size.height);
      graph.sync.setNoteSize(thisnote.id, thisnote.width, thisnote.height);
    },
    resize: function(event, ui){
      thisnote.width = thisgraph.vp.scaleToWorld(ui.size.width);
      thisnote.height = thisgraph.vp.scaleToWorld(ui.size.height);
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
  }).find('.ui-resizable-se').addClass('ui-icon-grip-diagonal-se'); // Default is too small.

  if (thisgraph.selectedNote != null)
    thisgraph.selectedNote.deselect();
  thisgraph.selectedNote = this;

  $(this.div).addClass("noteSelected");
  thisgraph.attachControls(this);
 
  // Bring selected to front. This is a temporary solution.
  thisgraph.runningZ++;
  this.zorder = thisgraph.runningZ;
  $(this.div).css({"zIndex":thisnote.zorder});
  if(this.id >= 0) thisgraph.sync.setNoteZorder(this.id, this.zorder); // inform the server
}

Note.prototype.deselect = function() {
  if (this.selected == false)
    return;
    
  this.selected = false;
  /* "disable" does not hide handle. */
  $(this.div).resizable("destroy");

  $(this.div).removeClass("noteSelected");
  /* graph.detachControls(thisnote); */
}

// Update the note on the screen to reflect the note object.
Note.prototype.update = function() {
  // Maybe split into smaller functions?
  // -position and width changes
  // -color changes
  // -selection changes ... ?
  
  this.updateCSS();

  // Content rendering after edit
  if(this.articleDiv != null) {
    if (this.name.search("http") == 0) {
      $(this.articleContainer).html("<iframe src='" + this.name + "' width=100% height=600px> </iframe>");
    } else
      $(this.articleContainer).html(this.content);
    this.updateScrollbars();
  }

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
  if (this.enabled)
  {
    // already enabled
    return;
  }
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

Note.prototype.enableLinkedNotes = function() {
  for(var i=0;i<this.edgesFrom.length;i++){
    this.edgesFrom[i].endNote.enable();
  }
  for(var i=0;i<this.edgesTo.length;i++){
    this.edgesTo[i].startNote.enable();
  }
}

Note.prototype.disableLinkedNotes = function() {
  for(var i=0;i<this.edgesFrom.length;i++){
    this.edgesFrom[i].endNote.disable();
  }
  for(var i=0;i<this.edgesTo.length;i++){
    this.edgesTo[i].startNote.disable();
  }
}

// Delete note.
Note.prototype.remove = function() {
  var thisnote = this;

  // Make sure controls are not visible on this one
  this.graph.detachControls(thisnote);

  // First hide/delete edges and the note from client viewing:
  if(this.edgesTo != null){
    for(var i=0;i<this.edgesTo.length;i++){
      // Disassociate from the other note
      this.edgesTo[i].startNote.disconnectEdgeFromById(this.edgesTo[i].id);
      // Erase the edge from the display
      this.edgesTo[i].erase();
      this.graph.disconnectEdge(this.edgesTo[i].id);
    }
  }
  if(this.edgesFrom != null){
    for(var i=0;i<this.edgesFrom.length;i++){
      // Disassociate from the other note
      this.edgesFrom[i].endNote.disconnectEdgeToById(this.edgesFrom[i].id);
      // Erase the edge from the display
      this.edgesFrom[i].erase();
      this.graph.disconnectEdge(this.edgesFrom[i].id);

    }
  }
  this.deleteDivFromDom();

  // TODO: Have graph object call the sync/delete also.
  // Notify the graph object
  this.graph.disconnectNote(this.id);
  // Notify the server
  this.graph.sync.deleteNote(this.id);

  // Delete the object
  delete thisnote;
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
  
  /* Moving as it was before.
     It was nice but currently there is no way mimic the behaviour with new viewport.*/
  /*
  if (this.graph.newViewport == true)
    ;//graph.vp.setViewFastMove(moveToX, moveToY);
    //graph.vp.setView(moveToX, moveToY);
  else {
    if(moveToX<0)moveToX=0;
    if(moveToY<0)moveToY=0;
    $("#vport").scrollTo({left:moveToX, top:moveToY},100,{axis:"xy"}); // 100 is the scroll time
  }
  */
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
  this.graph.sync.createNote(this);
  this.graph.notes.push(this);
}

getConnectedNotes = function(note) {
  var notes = [];

  for (var i = 0; i < note.edgesFrom.length; i++)
    if (note.edgesFrom[i].endNote)
      notes.push(note.edgesFrom[i].endNote);

  for (var i = 0; i < note.edgesTo.length; i++)
    if (note.edgesTo[i].startNote)
      notes.push(note.edgesTo[i].startNote);
  
  return notes;

}

getNoteWeight = function (note, maxWeight, visited) {
  var weight = 1;
  note.visited = visited;
  
  var notes = getConnectedNotes(note);
  for (var i = 0; i < notes.length; i++)
    if (notes[i].visited != visited) {
      weight += getNoteWeight(notes[i], maxWeight, visited);
    }

  if (weight > maxWeight) // TODO: do earlier
    weight = maxWeight;

  return weight;
}

// This function (re)constructs the whole div!
// Use after loading a Note with data.
Note.prototype.redraw = function() {
  var thisgraph = this.graph;
  var thisnote = this; // To be used in submethods, e.g. click-handlers.

  if(this.div != null){
    thisnote.deleteDivFromDom();
  }
  this.div = document.createElement("div");

  $(this.div).addClass("note").css({
    "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
    "position" : "absolute",
    "top" : thisgraph.vp.toLocalY(this.y) + "px",
    "left" : thisgraph.vp.toLocalX(this.x) + "px",
    "width" : thisgraph.vp.scaleToView(this.width) + "px",
    "height" : thisgraph.vp.scaleToView(this.height) + "px",
    "zIndex" : thisnote.zorder
  });

  // Behaviour
  $(this.div)
  .draggable(
  {
    zIndex: 2100000000, // Enough? Maybe not always.
    containment: "parent",
    start: function(event, ui){
      /* Ensure canvas is large enough so note can leave visible viewport.
       * This seems to cause problems with ff3. Call setView after drag ends instead. */
      //thisgraph.vp.setView(thisgraph.vp.x1, thisgraph.vp.y1);
      
      if (thisgraph.controlsAfterDrag == true)
        thisgraph.detachControls(thisnote);
      
      if (thisgraph.mMove == false)
        return;
	
	var weights = [];
        var notes = getConnectedNotes(thisnote);
	var avg = 0;
	
	for (var i = 0; i < notes.length; i++) {
	  /* To prevent recursion back to this note. */
	  thisnote.visited = true;
	  
	  var w = getNoteWeight(notes[i], 4, true);
	  
	  avg += w;
	  weights.push(w);
	  getNoteWeight(notes[i], 4, false); // reset visited flags
	}

	avg /= notes.length;

	/* To prevent recursion back to this note. */
	thisnote.visited = true;
	for (var i = 0; i < notes.length; i++) {
	  if (weights[i] < avg)
            getNoteWeight(notes[i], 4, true);
	}
	thisnote.visited = false;
	thisnote.lastX = this.x;
	thisnote.lastY = this.y;
    },
    // Update note position after dragging.
    stop: function(event, ui){
      thisnote.x = thisgraph.vp.toWorldX(ui.position.left);
      thisnote.y = thisgraph.vp.toWorldY(ui.position.top);
      graph.sync.setNotePosition(thisnote.id, thisnote.x, thisnote.y);
      if (thisgraph.controlsAfterDrag == true)
        thisgraph.attachControls(thisnote);
      
      if (thisgraph.mMove == false)
        return;
	
      for (var i = 0; i < thisgraph.notes.length; i++) {
        var note = thisgraph.notes[i];
        if (note.visited) {
	  note.visited = false;
	  note.updateCSS();
        }
      }
    },
    drag: function(event, ui){
      thisnote.x = thisgraph.vp.toWorldX(ui.position.left);
      thisnote.y = thisgraph.vp.toWorldY(ui.position.top);
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
        thisgraph.dragControls(thisnote);

      // Safari 3.2 redraw workaround.
      if ($.browser.safari && $.browser.version <= 3)
        thisgraph.rc.circle(0, 0, 10).remove();
	
      if (thisgraph.mMove == false)
        return;
	
    /* Why are these still undefined? */
    if (thisnote.lastX == undefined)
      thisnote.lastX = thisnote.x;

    if (thisnote.lastY == undefined)
      thisnote.lastY = thisnote.y;
      
      for (var i = 0; i < thisgraph.notes.length; i++) {
        var note = thisgraph.notes[i];
        if (note.visited) {
	  note.x += (thisnote.x - thisnote.lastX);
	  note.y += (thisnote.y - thisnote.lastY);
	  note.updateCSS();
        }
      }
      thisnote.lastX = thisnote.x;
      thisnote.lastY = thisnote.y;
	
    }
    //cancel: ":input,.noteArticle" // Cannot drag from article content
  });
  $(this.div).mouseover( function()
  {
    /* Do not attempt to highlight note which we are creating edge from. */
    if (graph.globalStartNote != null || thisgraph.globalStartNote != thisnote) {
      /* Guessing adding context help here is not necessary. */
      $(thisnote.div).addClass("noteTargeted");
      thisgraph.lastTargetNote = thisnote;
    }
  });
  
  $(this.div).mouseout( function()
  {
    if (thisgraph.lastTargetNote != null) {
      $(thisnote.div).removeClass("noteTargeted");
      thisgraph.lastTargetNote = null;
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
      if (thisgraph.globalStartNote == thisnote) {
        thisgraph.endEdgeCreation();
        return;
      }
      // Are we in the edge creation mode?
      if (graph.globalStartNote != null) {
        // Create edge. No selection.
        var tmpEdge = new Edge(thisgraph);
        tmpEdge.rCanvas = thisgraph.rc;
        tmpEdge.setStartNote(thisgraph.globalStartNote);
        tmpEdge.setEndNote(thisnote);
        tmpEdge.newID(); // notifies server
        //add the edge to notes for updating
        graph.globalStartNote.edgesFrom.push(tmpEdge);
        graph.addEdge(tmpEdge);
        thisnote.edgesTo.push(tmpEdge);
        tmpEdge.update();
        tmpEdge.draw(); // draws clientside
        thisgraph.endEdgeCreation();
      }
      // Normal note selection (not in the edge creation mode)
      else {
        thisgraph.unselectEdge();
        thisnote.select();
      }
    }
  });

  // Center the selected note on the viewport, if the user prefers so.
  // FIXME: Clicking the content stops bubbling into this event.
  $(this.div).mouseup( function(e){
    if(e.detail == 1 && thisgraph.globalStartNote == null && thisgraph.scrollToSelected)
      thisnote.center();
  });
 

  // Content

  // Creating note elements
  var titleTD = document.createElement("div");
  var article = document.createElement("div");

	
  // titleTD
  $(titleTD).addClass("noteTitle").css({"backgroundColor": lightenColor(this.color)}).append(this.name);
  thisnote.titleTD = titleTD;
  var settings = { 
     type: "text",
     event: "dblclick",
     cssclass : "noteEdit",
     placeholder: ''
  };
  // Editing the title. 
  $(titleTD).editable(function(value, settings) { 
     graph.sync.setNoteName(thisnote, value);  
     return(value);
  }, settings);

  /* Used to get width and height of content. */
  this.articleContainer = document.createElement("div");
  $(this.articleContainer).html(this.content);
  
  // article (div)
  $(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.articleContainer);
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
    $("#editWindow").css({"zIndex": "2100000001", "overflow": "auto"}); // isn't there a 'top' option? :)
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
  
  this.vScrollbar = document.createElement("div");
  $(this.vScrollbar).addClass("vScrollbarr");
  $(this.vScrollbar).slider({
    min: 0,
    max: 20,
    value: 20,
    slide: function(ev, ui) {
      /* Invert direction. */
      var move = $(thisnote.vScrollbar).slider('option', 'max') - ui.value;
      $(thisnote.articleContainer).css({"margin-top": -move});
      //$(thisnote.articleDiv).css({"top": -move}); // side-effects
    }
  });
  this.hScrollbar = document.createElement("div");
  $(this.hScrollbar).addClass("hScrollbarr");
  $(this.hScrollbar).slider({
    min: 0,
    max: 20,
    value: 0,
    orientation: 'horizontal',
    slide: function(ev, ui) {
      $(thisnote.articleContainer).css({"margin-left": -ui.value});
    }
  });

  this.updateScrollbars = function() {
    var vScrollable = $(thisnote.articleContainer).innerHeight() - $(thisnote.articleDiv).innerHeight();
    var hScrollable = $(thisnote.articleContainer).innerWidth() - $(thisnote.articleDiv).innerWidth();
    
    if (vScrollable > 0)
      $(thisnote.vScrollbar).show();
    else
      $(thisnote.vScrollbar).hide();

    if (hScrollable > 0)
      $(thisnote.hScrollbar).show();
    else
      $(thisnote.hScrollbar).hide();

    $(thisnote.vScrollbar).slider('option', 'max', vScrollable);
    $(thisnote.hScrollbar).slider('option', 'max', hScrollable);
    /* FIXME: indexes should also be updated accordingly. */
  };
  
  $(this.div).resize(this.updateScrollbars);
  //$(this.articleContainer).change(change); // Does not get called when content changes
  
  $(article).append(this.vScrollbar);
  $(article).append(this.hScrollbar);
  
  $(this.div).append(article);

  // table
  $(this.div).append(titleTD);

  $("#mindwiki_world").append(this.div);
  this.updateScrollbars();
}


