/* 

  universe: entire graph in database
  world: part(bounding box) of universe that has been cached
  canvas: raphael canvas that user is looking at
  view: position of raphael canvas that user is looking at

  Universe and world use same coordinate system.
*/
function Viewport() {
    this.x1 = this.y1 = 0;
    this.scale = 1;
}

Viewport.prototype.worldLeft = function() {
}

Viewport.prototype.worldTop = function() {
}

Viewport.prototype.initFromURL = function() {
  var anchor = jQuery.url.attr("anchor");
  if (anchor == null)
    return ;
  
  /* Use url plugin to parse it. Cheap I know..*/
  anchor = "?" + anchor;

  this.x1 = parseInt(jQuery.url.setUrl(anchor).param("left"), 10);
  this.y1 = parseInt(jQuery.url.setUrl(anchor).param("top"), 10);
}

Viewport.prototype.updateURL = function() {
  window.location.href = "#left=" + this.x1 + "&top=" + this.y1;
}

Viewport.prototype.setViewFastMove = function(left, top) {
  var xMove = left - this.canvasX1;
  var yMove = top - this.canvasY1;
  
  /* Need to "reposition" canvas. */
  if (xMove < 0 || yMove < 0) {
    this.setView(left, top);
    return;
  }
  
  /* Need to "reposition" canvas. */
  if (left + this.viewW > this.canvasX2 || top + this.viewH > this.canvasY2) {
    this.setView(left, top);
    return;
  }
  
  this.x1 = left;
  this.y1 = top;
  
  $("#mindwiki_world").css('left', -xMove + "px");
  $("#mindwiki_world").css('top', -yMove + "px");
  this.graph.ch.setPriorityText("Canvas move " + xMove + " " + yMove, 10);
}

Viewport.prototype.setViewSize = function(w, h) {
  this.viewW = w;
  this.viewH = h;
}

Viewport.prototype.setView = function(left, top) {
  this.x1 = left;
  this.y1 = top;
  
  this.canvasX1 = left - 200; /* 200 for the scrollable area */
  this.canvasY1 = top - 200;
  this.canvasX2 = left + this.viewW + 200;
  this.canvasY2 = top + this.viewH + 200;
  
  /* And scroll our canvas. */
  this.setViewFastMove(left, top);
  
  this.addNewNotes();
  this.graph.UpdateAllNotesCSS();
  if (this.graph.selectedNote != null)
    this.graph.dragControls(graph.selectedNote);
  //this.updateURL();
}

Viewport.prototype.setViewXScrolled = function(left) {
  setViewFastMove(left, this.y1);
}

Viewport.prototype.setViewYScrolled = function(top) {
  setViewFastMove(this.x1, top);
}

Viewport.prototype.setViewX = function(left) {
  setView(left, this.y1);
}

Viewport.prototype.setViewY = function(top) {
  setView(this.x1, top);
}


Viewport.prototype.viewLeft = function() {
  if (this.graph.newViewport == true) {
    return this.x1;
  } else {
    return $("#vport").scrollLeft();
  }
}

Viewport.prototype.viewTop = function() {
  if (this.graph.newViewport == true) {
    return this.y1;
  } else {
    return $("#vport").scrollTop();
  }
}

Viewport.prototype.canvasLeft = function() {
  if (this.graph.newViewport == true) {
    return this.canvasX1;
  } else {
    return $("#vport").scrollLeft();
  }
}

Viewport.prototype.canvasTop = function() {
  if (this.graph.newViewport == true) {
    return this.canvasY1;
  } else {
    return $("#vport").scrollTop();
  }
}

Viewport.prototype.toLocalX = function(x) {
  var mid = this.canvasLeft() + (this.viewW + 400)/2; /* 400 for 2x scrollable area */
  if (this.graph.newViewport == true)
    //return x - this.canvasLeft();
    return Math.floor((x - mid) * this.scale + mid) - this.canvasLeft();
  else
    return x;
    
}

Viewport.prototype.toLocalY = function(y) {
  var mid = this.canvasTop() + (this.viewH + 400)/2;
  if (this.graph.newViewport == true)
    //return y - this.canvasTop();
    return Math.floor((y - mid) * this.scale + mid) - this.canvasTop();
  else
    return y;
}

Viewport.prototype.toWorldX = function(x) {
  var mid = (this.viewW + 400)/2;
  if (this.graph.newViewport == true)
    return Math.floor((x - mid) / this.scale + mid) + this.canvasLeft();
    //return this.canvasLeft() + x;
  else
    return x;
}

Viewport.prototype.toWorldY = function(y) {
  var mid = (this.viewH + 400)/2;
  if (this.graph.newViewport == true)
    return Math.floor((y - mid) / this.scale + mid) + this.canvasTop();
    //return this.canvasTop() + y;
  else
    return y;
}

Viewport.prototype.setScale = function(scale) {
  this.scale = scale;
  this.graph.ch.setPriorityText("Scale " + scale, 20);
  this.setView(this.x1, this.y1);
}

Viewport.prototype.scaleToView = function(x) {
  return x * this.scale;
}

Viewport.prototype.scaleToWorld = function(x) {
  return x / this.scale;
}

  // Load more notes after window has been resized enough
Viewport.prototype.addNewNotes = function() {
  // Load notes after scrolled
  if (this.graph.newViewport == true) {
    var vpX = this.canvasLeft();
    var vpY = this.canvasTop();
  } else {
    $("#vport").scrollLeft();
    $("#vport").scrollTop();
  }
  var rd = this.graph.reloadDistance;
  // Reload, if we have moved beyond the reload distance
  if(vpX>this.graph.vpLastUpdatedX+rd || vpX<this.graph.vpLastUpdatedX-rd ||
     vpY>this.graph.vpLastUpdatedY+rd || vpY<this.graph.vpLastUpdatedY-rd)
  {
    this.graph.sync.getViewportNotes();
    this.graph.vpLastUpdatedX = vpX;
    this.graph.vpLastUpdatedY = vpY;
  }
}
