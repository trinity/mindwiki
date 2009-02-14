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
  this.selectedNote = null;
  this.selectedEdge = null;

  // Graph extent-variables for Aapo:
  this.extents = new Object();
  this.extents.min = new Object();
  this.extents.max = new Object();
  this.extents.mid = new Object();
  this.extents.min.x = 0;
  this.extents.min.y = 0;
  this.extents.max.x = 0;
  this.extents.max.y = 0;
  this.extents.mid.x = 0;
  this.extents.mid.y = 0;

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
  this.runningZ = 10; // Used for z-index = "top" within the context of notes

  // Maybe more sophisticated containers?!
  this.notes = [];
  this.edges = [];

  // Do we want to center the selected note? TODO: Move to user preferences.
  this.scrollToSelected = true;

  // Use new viewport?
  this.newViewport = true;

  var thisgraph = this; // To be used in submethods

  // Load graph ID from the path variable.
  // Is ID the only numerical data in the path? Currently, yeah. Maybe sharpen up the regexp, still.
  var id_from_pathname = new RegExp(/\d+/).exec(location.pathname);
  this.id = parseInt(id_from_pathname[0]); // RegExp.exec puts matches into an array

  this.sync.initGraph();

  // NEW NOTE creation by double clicking in the viewport
  $("#mindwiki_world").dblclick( function(event){
    var tmp = new Note();
    tmp.x = graph.vp.toWorldX(event.pageX - $(this).offset().left);
    tmp.y = graph.vp.toWorldY(event.pageY - $(this).offset().top);
    tmp.newID();
    tmp.redraw();
    tmp.center(); // Center on create regardless of user preferences
    // Let's select the new note right away, too.
    graph.notes.push(tmp);
    tmp.select();
    tmp.update();
  });
		
  this.downX = -1; /* Set to -1 when no drag is in progress. */
  this.cursorChanged = false;
  $("#mindwiki_world").mousedown(function (event) {
    graph.downX = event.pageX;
    graph.downY = event.pageY;
    graph.cursorChanged = false;
  });
  
  $("#mindwiki_world").mousemove(function (event) {
    if (graph.downX == -1)
      return;
      
    if (graph.cursorChanged == false) {
      $("#mindwiki_world").css({"cursor": "move"});
      graph.cursorChanged = true;
    }
    var x = -(event.pageX - graph.downX);
    var y = -(event.pageY - graph.downY);

    if (graph.newViewport == true)
      graph.vp.setViewFastMove(graph.vp.viewLeft() + x, graph.vp.viewTop() + y);
      
    graph.downX = event.pageX;
    graph.downY = event.pageY;
  });
  
  $("#mindwiki_world").mouseup(function (event) {
    /* "Workaround". */
    if (graph.newViewport == true)
        graph.vp.setView(graph.vp.viewLeft(), graph.vp.viewTop());

    $("#mindwiki_world").css({"cursor": "default"});
    graph.downX = -1;
    graph.vp.updateURL();
  });

  $("#mindwiki_world").click( function(event){
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;
    
    var margin = 10;

    /* edges are in local coordinates. */
    thisgraph.edgeClick(x,y,margin);
    
    // if clicked empty space, note is unselected.
    if (thisgraph.selectedNote != null)
    {
      thisgraph.selectedNote.deselect();
      /* detachControls should be called in deselect but that seems little wasteful since
         in most cases we would be selecting another note. */
      thisgraph.detachControls(thisgraph.selectedNote);
      thisgraph.selectedNote = null;
    }
    thisgraph.endEdgeCreation();
  });

  $(".note").livequery("click", function(event){
    // note's click event is handled in the note class, but this is
    // needed here to prevent click event to bubble to background.
    event.stopPropagation();
  });
		
  $(".note").livequery("dblclick", function(event){
    // this event should never fire...
    event.stopPropagation();
  });
		
  $(".noteTitle").livequery("dblclick", function(event){
    // this event is not used. we just prevent the dblclick
    // to bubble to parents.
    event.stopPropagation();
  });

  // Stop events in class stop_propagation
  // Used for youtube-videos, for instance..
  $(".stop_propagation").livequery("mousedown", function(e){
    e.stopPropagation();
  });


  /* "Navigator" */
  this.viewAdd = function(x, y) {
    graph.vp.setView(graph.vp.viewLeft() + x, graph.vp.viewTop() + y);
    /*graph.vp.setViewFastMove(graph.vp.viewLeft() + x, graph.vp.viewTop() + y);*/
    graph.vp.updateURL();
  };
  
  this.navigatorDiv = document.createElement("div");
  this.navigatorLeft = document.createElement("div");
  this.navigatorRight = document.createElement("div");
  this.navigatorUp = document.createElement("div");
  this.navigatorDown = document.createElement("div");

  $(this.navigatorDiv).addClass("navigator");

  $(this.navigatorLeft).addClass("navigatorLeft");
  $(this.navigatorLeft).click(function (e) { graph.viewAdd(-150, 0); e.stopPropagation(); });
  /* TODO: find better way of doing this. Some selector perhaps? */
  $(this.navigatorLeft).dblclick(function (e) { e.stopPropagation(); });
  $(this.navigatorDiv).append(this.navigatorLeft);

  $(this.navigatorRight).addClass("navigatorRight");
  $(this.navigatorRight).click(function (e) { graph.viewAdd(150, 0); e.stopPropagation(); });
  $(this.navigatorRight).dblclick(function (e) { e.stopPropagation(); });
  $(this.navigatorDiv).append(this.navigatorRight);

  $(this.navigatorUp).addClass("navigatorUp");
  $(this.navigatorUp).click(function (e) { graph.viewAdd(0, -150); e.stopPropagation(); });
  $(this.navigatorUp).dblclick(function (e) { e.stopPropagation(); });
  $(this.navigatorDiv).append(this.navigatorUp);

  $(this.navigatorDown).addClass("navigatorDown");
  $(this.navigatorDown).click(function (e) { graph.viewAdd(0, 150); e.stopPropagation(); });
  $(this.navigatorDown).dblclick(function (e) { e.stopPropagation(); });
  $(this.navigatorDiv).append(this.navigatorDown);
  
  $("#mindwiki_world").append(this.navigatorDiv);

 // Initialize controls 
  this.buttonsDiv = document.createElement("div");
  this.edgeButtonsDiv = document.createElement("div");
  
  // Buttons

  // arrow button
  this.arrowButton = new ToggleButton("noteArrowButton", function(value) {
    if (value == true)
	thisgraph.beginEdgeCreation();
    else
	thisgraph.endEdgeCreation();
  });
  $(this.buttonsDiv).append(this.arrowButton.div);

  // color button
  this.colorButton = new ToggleButton("noteColorButton", function(value) {
    if (value == true)
      $(thisgraph.colorButton.div).ColorPicker("show");
    else
      $(thisgraph.colorButton.div).ColorPicker("hide");
  });
  $(this.buttonsDiv).append(this.colorButton.div);

  // delete button
  this.deleteButton = document.createElement("div");
  $(this.deleteButton).addClass("noteDeleteButton");
  $(this.buttonsDiv).append(this.deleteButton);
  
  // delete edge button
  this.deleteEdgeButton = document.createElement("div");
  $(this.deleteEdgeButton).addClass("noteDeleteButton");
  $(this.edgeButtonsDiv).append(this.deleteEdgeButton);

  $(this.buttonsDiv).addClass("noteButton").hide();
  $(this.edgeButtonsDiv).addClass("noteButton").hide();

  $(this.deleteButton).mousedown(function () {
    $(graph.deleteButton).removeClass().addClass("noteDeleteButtonPressed");
  });
  $(this.deleteButton).mouseout(function () {
    $(graph.deleteButton).removeClass().addClass("noteDeleteButton");
  });

  /* Controls */
  $(this.colorButton.div).ColorPicker({
    onBeforeShow: function () {
      /* Need to fetch it. */
      $(this).ColorPickerSetColor(graph.selectedNote.color);
    },
    onShow: function(picker){
      $(picker).fadeIn(100);
      return false;
    },
    onHide: function(picker){
      /* Reset button state. */
      graph.colorButton.setState(false); 
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
  this.vp.minX = this.maxX = this.extents.mid.x;
  this.vp.minY = this.maxY = this.extents.mid.y;
  
  /* Initialization is not complete enough to call setViewSize. */
  this.vp.viewW = $("#vport").width();
  this.vp.viewH = $("#vport").height();
  //this.vp.setViewSize($("#vport").width(), $("#vport").height());
  this.vp.scrollableY = this.vp.y2-this.vp.y1-this.vp.viewH;
  this.vp.scrollableX = this.vp.x2-this.vp.x1-this.vp.viewW;
  
  $(window).resize(function() {
    graph.vp.setViewSize($("#vport").width(), $("#vport").height());
  });
  vScrollbar = document.createElement("div");
  $(vScrollbar).addClass("vScrollbar");

  vScrollbarIndicator = document.createElement("div");
  $(vScrollbarIndicator).addClass("vScrollbarIndicator");
  $(vScrollbar).append(vScrollbarIndicator);
  
  $(vScrollbarIndicator).css("height", this.vp.viewH / this.vp.scrollableY *640 /*scrollbarSize.y*/);
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
  
  $(hScrollbarIndicator).css("width", this.vp.viewW / this.vp.scrollableX *640 /*scrollbarSize.x*/);
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


  /* Zoom scrollbar */
  zoomScrollbar = document.createElement("div");
  $(zoomScrollbar).addClass("zoomScrollbar");

  zoomScrollbarIndicator = document.createElement("div");
  $(zoomScrollbarIndicator).addClass("zoomScrollbarIndicator");
  $(zoomScrollbar).append(zoomScrollbarIndicator);
  
  $(zoomScrollbarIndicator).css("height", this.vp.viewH / this.vp.scrollableY *480 /*scrollbarSize.x*/);
  $(zoomScrollbar).slider({
    //accept: ".vScrollbarIndicator",
    handle: ".zoomScrollbarIndicator",
    /*min: 0,
    max: 1,*/
    max: 20,
    steps: 10,
    axis: "vertical",
    slide: function(ev, ui) {
      if (graph.newViewport == true)
        graph.vp.setScale(1 - (ui.value/20.0));
    }
  });
  
  $("#vport").append(zoomScrollbar);
  
  /* HIDE since they do not really work right... */
  if (this.newViewport == false) {
    $(zoomScrollbar).hide();
  } else {
    /* Currently not in use. */
    $(vScrollbar).hide();
    $(hScrollbar).hide();
    $(".mindwiki_viewport").css({"overflow": "hidden"});
  }

  // Load notes after scrolled
  $("#vport").scroll(function() { graph.vp.addNewNotes(); });


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
    this.sync.getViewportNotesOld(); // viewport scroll action goes right away atm
  }
  this.reloadDistance = 100;
  this.config = new Config();
  $(this.config.getHandle()).addClass("config");
  //this.config.newOption("text", "example", function(value) { alert("text is " + value); });
  this.config.newOption("checkbox", "scrollToSelected", function(value) { graph.scrollToSelected = value; });

  this.config.newOption("checkbox", "newViewport", function(value) { 
    graph.newViewport = value;
    if (graph.newViewport == false) {
      $(".mindwiki_viewport").css({"overflow": "auto"});
      $(vScrollbar).hide();
      $(hScrollbar).hide();
      $(zoomScrollbar).hide();
      graph.vp.setView(0, 0);
    } else {
      $(zoomScrollbar).show();
      graph.ch.setPriorityText("<h3>Warning: currently this feature might damage your graph.</>", 100);
      $(".mindwiki_viewport").css({"overflow": "hidden"});
      $("#vport").scrollTo({left:0, top:0},100,{axis:"xy"}); // 100 is the scroll time
      
      graph.vp.setViewSize($("#vport").width(), $("#vport").height());
      /*$(vScrollbar).show();
      $(hScrollbar).show();*/
      graph.vp.initFromURL();
      graph.vp.setView(graph.vp.x1, graph.vp.y1);
    }
   });
   
  this.controlsAfterDrag = false;
  this.config.newOption("checkbox", "controlsAfterDrag", function(value) { graph.controlsAfterDrag = value; });

  this.config.newOption("button", "Hide", function() { $(graph.config.div).hide("slow"); });
  //this.config.newOption("button", "setView", function() { graph.vp.setView(graph.vp.x1, graph.vp.y1); });

  $("#vport").append(this.config.getHandle());


  // Initialize the server updating timer
  checkServerForUpdates(this.sync);

} // end constructor


// Loads more notes and edges after viewport size or scrolling has been changed.
// They could be in different methods to increase performance somewhat.
Graph.prototype.viewportChanged = function()
{

}

Graph.prototype.beginEdgeCreation = function()
{
  this.globalStartNote = this.selectedNote;
  this.ch.setPriorityText("<b>Select target note</b> or click on active note to cancel.", 1);
  this.selectedNote.disable();
  this.selectedNote.disableTargetNotes();
}

Graph.prototype.endEdgeCreation = function()
{
  this.arrowButton.setState(false);
  if (this.globalStartNote == null)
    return;
  /* Restore color. */
  this.globalStartNote.enable();
  this.globalStartNote.enableTargetNotes();
  this.globalStartNote = null; // ready for a new edge to be created
  this.ch.resetPriority(0);
  this.ch.set("");
}

// Show the user that we are loading...
Graph.prototype.loading = function(isLoading){
  if(isLoading){
    $(".loadingDiv").show();
  } else {
    $(".loadingDiv").fadeOut(400);
  }
}

Graph.prototype.attachControls = function(thisnote){
  $(this.buttonsDiv).show(graph.controlsAfterDrag ? "fast" : "");
  this.dragControls(thisnote);
}

Graph.prototype.dragControls = function(thisnote){
  $(this.buttonsDiv).css({
    "top" : (graph.vp.toLocalY(thisnote.y)-26) +"px", /* FIXME: -26 */
    "left" : graph.vp.toLocalX(thisnote.x)+"px",
    "width" : graph.vp.scaleToView(thisnote.width) + "px"
  });
}

Graph.prototype.detachControls = function(thisnote){
  if (this.selectedNote == null || thisnote.id == this.selectedNote.id)
    $(this.buttonsDiv).hide(graph.controlsAfterDrag ? "fast" : "");
}


Graph.prototype.attachControlsToEdge = function(thisedge,x,y){

  $(this.edgeButtonsDiv).show();
  $(this.edgeButtonsDiv).css({
    "top" : y-26 +"px",
    "left" : x-15 +"px",
    "width" : 32+"px"
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
Graph.prototype.removeFromArray = function(arr, objId)
{
  var l = arr.length;
  for (var i=0;i<l;i++)
  {
    if(arr[i].id == objId)
    {
      arr.splice(i,1);
      return;
    }
  }
}

Graph.prototype.addEdge = function(edge)
{
  this.edges.push(edge);
}

Graph.prototype.disconnectEdge = function(edgeId)
{
  this.removeFromArray(this.edges,edgeId);
}

Graph.prototype.disconnectNote = function(noteId)
{
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
          return true;
        }
        
        if (this.selectedEdge != this.edges[i])
        {
          this.selectedEdge.unselect();
          this.selectedEdge = this.edges[i];
          this.selectedEdge.select(x,y);
          return true;
        }
      }
    }
    // if we missed all edges, then unselect possible selected edge.
    if (this.selectedEdge != null)
    {
      this.selectedEdge.unselect();
      this.selectedEdge = null;
    }
    return false;
}    

Graph.prototype.unselectEdge = function()
{
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

function ToggleButton(name, onChange) {
  this.div = document.createElement("div");
  this.state = false;
  this.onChange = onChange;
  this.name = name;
  
  var thisbutton = this;
  
  /* Use name as class and name + "Pressed" as pressed class. */
  $(this.div).addClass(name);
  
  /*
  // OS provided buttons perform the action when mouse button is released on top of button.
  // Getting it all work fine is slightly complicated so use click instead for now.
  $(this.div).mousedown(function (e) {
    //$(thisbutton.div).removeClass().addClass(name + "Pressed");
    //e.stopPropagation();
  });
  
  $(this.div).mouseup(function (e) {
    //thisbutton.setState(!thisbutton.pressed);
    //e.stopPropagation();
  });
  $(this.div).mouseout(function (e) {
    //thisbutton.setState(thisbutton.pressed);
    //e.stopPropagation();
  });
  */
  $(this.div).click(function (e) {
    thisbutton.setState(!thisbutton.state);
    e.stopPropagation();
  });
}

ToggleButton.prototype.setState = function(state) {
  if (state == this.state)
    return;
  
  this.state = state;
  this.onChange(this.state);

  if (this.state == true)
    $(this.div).removeClass().addClass(this.name + "Pressed");
  else
    $(this.div).removeClass().addClass(this.name);
}
