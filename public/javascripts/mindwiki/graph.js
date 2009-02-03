// This file defines the MindWiki graph viewing and editing client

$(document).ready(function(){
  var graphs = /\/graphs\/\d+/; // regexp to identify pathnames that should have mindwiki graphs
  if(graphs.exec(document.location.pathname)){
    // Please note the sad global nature of these variables.
    graph = new Graph();
  }
});

function Graph() {

  this.id = -1;
  this.last_selected_note = null;
  this.selectedEdge = null;

  // Viewport is a small window into the world.
  this.world = document.createElement("div");
  $(this.world).attr("id","mindwiki_world");
  $("#vport").append(this.world);

  // Creating and attaching the server-syncer
  this.sync = new Sync();
  this.sync.graph = this;

  // To use in the scroll-event, so we are not loading stuff too aggressively
  this.vpLastUpdatedX = 0;
  this.vpLastUpdatedY = 0;
  this.vpLastUpdatedWidth = 0;
  this.vpLastUpdatedHeight = 0;
  // Reloads data via ajax every x pixels scrolled.
  this.reloadDistance = 500; 

  this.rc = Raphael("mindwiki_world", 9999, 9999); // Raphael canvas, FIXME: static size
  this.color = "#dddddd";

  this.globalStartNote = null; // Used when creating new edges
  this.runningZ = 10; // Used for z-index = "top". Will be replaced with specific z-order handling soon.

  // Maybe more sophisticated containers?!
  this.notes = [];
  this.edges = [];

  // Do we want to center the selected note? TODO: Move to user preferences.
  this.scrollToSelected = true;

  // Use new viewport?
  this.newViewport = false;

  var thisgraph = this; // To be used in submethods

  // Load graph ID from the path variable.
  // Is ID the only numerical data in the path? Currently, yeah. Maybe sharpen up the regexp, still.
  var id_from_pathname = new RegExp(/\d+/).exec(location.pathname);
  this.id = parseInt(id_from_pathname[0]); // RegExp.exec puts matches into an array

  this.sync.getGraphColor();

  // NEW NOTE creation by double clicking in the viewport
  $("#mindwiki_world").dblclick( function(event){
    var tmp = new Note();
    tmp.x = graph.vp.toWorldX(event.pageX - $(this).offset().left);
    tmp.y = graph.vp.toWorldY(event.pageY - $(this).offset().top);
    tmp.newID();
    tmp.redraw();
    tmp.center(); // Center on create regardless of user preferences
    // Let's select the new note right away, too.
    tmp.selected = true;
    graph.notes.push(tmp);
    this.last_selected_note = tmp;
    tmp.update();
  });
		
  $("#mindwiki_world").click( function(event){
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;
    
    var margin = 10;

    /* edges are in local coordinates. */
    thisgraph.edgeClick(x,y,margin);
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

  // Stop events in class stop_propagation
  // Used for youtube-videos, for instance..
  $(".stop_propagation").livequery("mousedown", function(e){
    e.stopPropagation();
  });

  
  
  // Initialize controls 
  this.buttonsDiv = document.createElement("div");
  this.edgeButtonsDiv = document.createElement("div");
  
  // Buttons
  this.deleteButton = document.createElement("div");
  this.colorButton = document.createElement("div");
  this.arrowButton = document.createElement("div");
  this.deleteEdgeButton = document.createElement("div");

  $(this.buttonsDiv).addClass("noteButtonTD").hide();
  $(this.edgeButtonsDiv).addClass("noteButtonTD").hide();

  // arrow button
  $(this.arrowButton).addClass("noteArrowButton");
  $(this.buttonsDiv).append(this.arrowButton);
	
  // color button
  $(this.colorButton).addClass("noteColorButton");
  $(this.buttonsDiv).append(this.colorButton);

  // delete button
  $(this.deleteButton).addClass("noteDeleteButton");
  $(this.buttonsDiv).append(this.deleteButton);

  $(this.deleteEdgeButton).addClass("noteDeleteButton");
  $(this.edgeButtonsDiv).append(this.deleteEdgeButton);

  $(this.arrowButton).mousedown(function () {
    $(graph.arrowButton).removeClass().addClass("noteArrowButtonPressed");
  });
  $(this.arrowButton).mouseout(function () {
    $(graph.arrowButton).removeClass().addClass("noteArrowButton");
  });

  $(this.deleteButton).mousedown(function () {
    $(graph.deleteButton).removeClass().addClass("noteDeleteButtonPressed");
  });
  $(this.deleteButton).mouseout(function () {
    $(graph.deleteButton).removeClass().addClass("noteDeleteButton");
  });

  $(this.colorButton).mousedown(function () {
    $(graph.colorButton).removeClass().addClass("noteColorButtonPressed");
  });
  $(this.colorButton).mouseout(function () {
    $(graph.colorButton).removeClass().addClass("noteColorButton");
  });

  /* Controls */
  $(this.arrowButton).click(function () {
    thisnote = graph.selectedNote;
    graph.globalStartNote = thisnote;
    graph.ch.setPriorityText("<b>Select target note</b> or click on active note to cancel.", 1);
    thisnote.origColor = thisnote.color;
    thisnote.color = deColorize (thisnote.color, 0.4);
    thisnote.updateCSS();
    $("div").css({"cursor": "pointer"});
  });
  $(this.colorButton).ColorPicker({
    onBeforeShow: function () {
      /* Need to fetch it. */
      $(this).ColorPickerSetColor(graph.selectedNote.color);
    },
    onShow: function(picker){
      $(picker).fadeIn(100);
      return false;
    },
    onHide: function(picker){
      $(picker).fadeOut(100);
      return false;
    },
    onSubmit: function(hsb, hex, rgb){
      graph.selectedNote.color = "#"+hex;
      graph.selectedNote.update();
      thisgraph.sync.setNoteColor(thisgraph.selectedNote.id, "#"+hex);
    }
  });
  $(".colorpicker").css({"zIndex": 9999999});
  
  $(this.deleteButton).click(function () {
    // FIXME: when you create a new note and an edge and delete the note right away graph.selectedNote points to null.
    // this if clause is just a quick-fix for the problem.
    if (graph.selectedNote != null)
    {
      graph.selectedNote.remove();
      graph.selectedNote = null; /* some strange behaviour without this... */
    }
  });

  $(this.deleteEdgeButton).click(function () {
    if (graph.selectedEdge != null)
    {
      graph.selectedEdge.remove();
      graph.selectedEdge = null;
    }
  });
  
  //$("#vport").append(this.buttonsDiv);
  $("#mindwiki_world").append(this.buttonsDiv);
  $("#mindwiki_world").append(this.edgeButtonsDiv);
  
  this.vp = new Viewport();
  this.vp.graph = this;
  this.vp.x1 = this.vp.y1 = 0;
  this.vp.x2 = this.vp.y2 = 9999;
  this.vp.windowW = $("#vport").width();
  this.vp.windowH = $("#vport").height();
  this.vp.scrollableY = this.vp.y2-this.vp.y1-this.vp.windowH;
  this.vp.scrollableX = this.vp.x2-this.vp.x1-this.vp.windowW;
  
  vScrollbar = document.createElement("div");
  $(vScrollbar).addClass("vScrollbar");

  vScrollbarIndicator = document.createElement("div");
  $(vScrollbarIndicator).addClass("vScrollbarIndicator");
  $(vScrollbar).append(vScrollbarIndicator);
  
  $(vScrollbarIndicator).css("height", this.vp.windowH / this.vp.scrollableY *640 /*scrollbarSize.y*/);
  $(vScrollbar).slider({
    //accept: ".vScrollbarIndicator",
    handle: ".vScrollbarIndicator",
    /*min: 0,
    max: 1,*/
    max: 1000,
    step: 1,
    axis: "vertical",
    slide: function(ev, ui) {
      var y = (ui.value/1000.0 * graph.vp.scrollableY);
      y = Math.floor(y);
      
      if (graph.newViewport == true)
        graph.vp.setViewYScrolled(y);
      else
        $("#mindwiki_world").css('top', -y + "px");
    }
  });
  $("#vport").append(vScrollbar);


  hScrollbar = document.createElement("div");
  $(hScrollbar).addClass("hScrollbar");

  hScrollbarIndicator = document.createElement("div");
  $(hScrollbarIndicator).addClass("hScrollbarIndicator");
  $(hScrollbar).append(hScrollbarIndicator);
  
  $(hScrollbarIndicator).css("width", this.vp.windowW / this.vp.scrollableX *640 /*scrollbarSize.x*/);
  $(hScrollbar).slider({
    //accept: ".vScrollbarIndicator",
    handle: ".hScrollbarIndicator",
    /*min: 0,
    max: 1,*/
    max: 1000,
    step: 1,
    axis: "horizontal",
    slide: function(ev, ui) {
      var x = (ui.value/1000.0 * graph.vp.scrollableX);
      x = Math.floor(x);
      
      if (graph.newViewport == true)
        graph.vp.setViewXScrolled(x);
      else
        $("#mindwiki_world").css('left', -x + "px");
    }
  });
  
  $("#vport").append(hScrollbar);


  /* HIDE since they do not really work right... */
  if (this.newViewport == false) {
    $(vScrollbar).hide();
    $(hScrollbar).hide();
  }

  // Load notes after scrolled
  $("#vport").scroll(this.vp.addNewNotes);


  /*
   * Context help (Might be better inside context_help.js)
   */
  this.ch = new ContextHelp();

  $("#mindwiki_world").mouseover( function(){
    graph.ch.set("Create new notes by double clicking the background.");
    // The final event, no need to stop propagation
  });

  $(".note").livequery("mouseover", function(e){
    graph.ch.set("<b>Edit content</b> by double clicking the content area.");
    e.stopPropagation();
  });

  $(this.arrowButton).mouseover(function()
  {
    graph.ch.set("<b>Create a connection</b> by clicking the arrow button of the first note, and then clicking the second note.");
  }, function() {}
  );

  $(this.colorButton).mouseover(function()
  {
    graph.ch.set("<b>Change color.</b>");
  }, function() {}
  );
  
  $(this.deleteButton).mouseover(function()
  {
    graph.ch.set("<b>Delete note.</b>");
  }, function() {}
  );

  /*
   * End Context help
   */
  if (this.newViewport == true) {
    this.vp.initFromURL();
  
    this.vp.setView(this.vp.x1, this.vp.y1);
  } else {
    this.sync.getViewportNotes(); // viewport scroll action goes right away atm
  }
  this.reloadDistance = 100;
  this.config = new Config();
  //this.config.newOption("text", "example", function(value) { alert("text is " + value); });
  this.config.newOption("checkbox", "scrollToSelected", function(value) { graph.scrollToSelected = value; });

  this.config.newOption("checkbox", "newViewport", function(value) { 
    graph.newViewport = value;
    if (graph.newViewport == false) {
      $(vScrollbar).hide();
      $(hScrollbar).hide();
    } else {
      $(vScrollbar).show();
      $(hScrollbar).show();
    this.vp.initFromURL();
    this.vp.setView(this.vp.x1, this.vp.y1);
    }
   });
   
  this.config.newOption("button", "Hide", function() { $(graph.config.div).hide("slow"); });

  $("#vport").append(this.config.getHandle());
} // end constructor


// Loads more notes and edges after viewport size or scrolling has been changed.
// They could be in different methods to increase performance somewhat.
Graph.prototype.viewportChanged = function()
{

}

// Show the user that we are loading...
Graph.prototype.loading = function(isLoading){
  if(isLoading){
    $(".loadingDiv").show();
  } else {
    $(".loadingDiv").hide(400);
  }
}

Graph.prototype.attachControls = function(thisnote){

  $(this.buttonsDiv).show();
  
  this.selectedNote = thisnote;
  this.dragControls(thisnote);
}

Graph.prototype.dragControls = function(thisnote){
  $(this.buttonsDiv).addClass("noteButtonTD").css({
    "position" : "absolute",
    "top" : (graph.vp.toLocalY(thisnote.y)-26) +"px", /* FIXME: -26 */
    "left" : graph.vp.toLocalX(thisnote.x)+"px",
    "width" : thisnote.width+"px",
    "height" : "28px"
  });
}

Graph.prototype.detachControls = function(thisnote){
  if (this.selectedNote == null || thisnote.id == this.selectedNote.id)
    $(this.buttonsDiv).hide();
}


Graph.prototype.attachControlsToEdge = function(thisedge,x,y){

  $(this.edgeButtonsDiv).show();
  $(this.edgeButtonsDiv).addClass("noteButtonTD").css({
    "position" : "absolute",
    "top" : y-26 +"px",
    "left" : x-15 +"px",
    "width" : 32+"px",
    "height" : "28px"
  });
}

Graph.prototype.detachControlsFromEdge = function(thisedge){
  $(this.edgeButtonsDiv).hide();
}


Graph.prototype.getNoteById = function(id){
  var l = this.notes.length;
  for(var i=0;i<l;i++){
    if(this.notes[i].id == id)
      return this.notes[i];
  }
  return null;
}

Graph.prototype.getEdgeById = function(id){
  var l = this.edges.length;
  for(var i=0;i<l;i++){
    if(this.edges[i].id == id)
      return this.edges[i];
  }
  return null;
}

// Updates edge. This is for tiled note loading.
// (When we load the edge for the first time, the second note may not be read yet)
Graph.prototype.updateEdge = function(id,title,color,sourceId, targetId){
  var thisgraph = this;
  var edge = null;

  // The edge already exists (second hit)
  if(thisgraph.getEdgeById(id) != null){
    edge = thisgraph.getEdgeById(id);

    // Is the edge already okay?
    if(edge.startNote && edge.endNote)
      return;

    edge.title = title;
    edge.color = color;

    if(!edge.startNote)
      edge.startNote = thisgraph.getNoteById(sourceId);
    if(!edge.endNote)
      edge.endNote = thisgraph.getNoteById(targetId);

    // References to this edge:
    // Startnote
    if(edge.startNote){
      if(!edge.startNote.getEdgeFromById(edge.id)) {
        edge.startNote.edgesFrom.push(edge);
      }
    }
    // Endnote
    if(edge.endNote){
      if(!edge.endNote.getEdgeToById(edge.id)) {
        edge.endNote.edgesTo.push(edge);
      }
    }
    // If we have both references, the edge can be drawn
    if(edge.startNote && edge.endNote){
      edge.update();
      edge.draw();
    }
    
  // New edge (first hit)
  } else {
    edge = new Edge();
    edge.id = id;
    // In new edge it is okay to just assign straight away, since the methods just return null on "not found"
    if(sourceId) edge.startNote = thisgraph.getNoteById(sourceId);
    if(targetId) edge.endNote = thisgraph.getNoteById(targetId);
    thisgraph.edges.push(edge);
  }
}

// Helper function to remove objects from arrays (notes and edges).
Graph.prototype.removeFromArray = function(arr, objId){
  var l = arr.length;
  var delIndex = -1;   
  for(var i=0;i<l;i++){
    if(arr[i].id == objId){
      delIndex = i;
      break;
    }
  }
  if(delIndex >= 0){
    arr.splice(delIndex,1);
  }
}

Graph.prototype.disconnectEdge = function(edgeId){
  this.removeFromArray(this.edges,edgeId);
}

Graph.prototype.disconnectNote = function(noteId){
  this.removeFromArray(this.notes,noteId);
}


Graph.prototype.edgeClick = function(x,y,margin)
{
    var l = this.edges.length;
    for (var i=0;i<l;i++) 
    {
      if (this.edges[i].isHit(x,y,margin))
      {
        if (this.selectedEdge == null)
        {
          this.selectedEdge = this.edges[i];
          this.selectedEdge.select(x,y);
          return;
        }
        
        if (this.selectedEdge != this.edges[i])
        {
          this.selectedEdge.unselect();
          this.selectedEdge = this.edges[i];
          this.selectedEdge.select(x,y);
          return;
        }
      }
    }
    // if we missed all edges, then unselect possible selected edge.
    if (this.selectedEdge != null)
    {
      this.selectedEdge.unselect();
      this.selectedEdge = null;
    }
}    

Graph.prototype.UpdateAllNotesCSS = function() {
  for (var i = 0; i < this.notes.length; i++) {
    this.notes[i].updateCSS();
    
    for (var ii = 0; ii < this.notes[i].edgesTo.length; ii++)
      this.notes[i].edgesTo[ii].redraw();
  }
}

