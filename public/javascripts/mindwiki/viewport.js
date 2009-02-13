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
    this.canvasBoundry = 400; /* Same as reloadDistance really. */
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


Viewport.prototype.clipViewToUniverse = function(pos) {
  var newPos = pos;
  
  if (pos.x < this.graph.extents.min.x - this.viewW)
    newPos.x = this.graph.extents.min.x - this.viewW;

  if (pos.x > this.graph.extents.max.x)
    newPos.x = this.graph.extents.max.x;

  if (pos.y < this.graph.extents.min.y - this.viewH)
    newPos.y = this.graph.extents.min.y - this.viewH;

  if (pos.y > this.graph.extents.max.y)
    newPos.y = this.graph.extents.max.y;
  
  return newPos;
}

Viewport.prototype.setViewFastMove = function(left, top) {
  var newPos = this.clipViewToUniverse({x:left, y:top});
  left = newPos.x;
  top = newPos.y;

  var xMove = left - this.canvasX1;
  var yMove = top - this.canvasY1;
  
  /* Need to "reposition" canvas. */
  if (xMove < 0 || yMove < 0) {
    this.setView(left, top);
    return;
  }
  
  /* Need to "reposition" canvas. */
  //if (left + this.viewW > this.canvasX2 || top + this.viewH > this.canvasY2) {
  if (xMove > this.canvasBoundry * 2 || yMove > this.canvasBoundry * 2) {
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
  this.setScale(this.callerScale); /* Calls setView as well. */
}

Viewport.prototype.setView = function(left, top) {
  var newPos = this.clipViewToUniverse({x:left, y:top});
  left = newPos.x;
  top = newPos.y;

  this.x1 = left;
  this.y1 = top;
  
  this.canvasX1 = left - this.canvasBoundry;
  this.canvasY1 = top - this.canvasBoundry;
  this.canvasX2 = left + this.viewW + this.canvasBoundry;
  this.canvasY2 = top + this.viewH + this.canvasBoundry;
  
  this.expandWorld(this.canvasX1, this.canvasY1, this.canvasX2, this.canvasY2);
  
  /* And scroll our canvas. */
  this.setViewFastMove(left, top);
  
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
  var mid = this.canvasLeft() + this.viewW / 2 + this.canvasBoundry;
  if (this.graph.newViewport == true)
    //return x - this.canvasLeft();
    return Math.floor((x - mid) * this.scale + mid) - this.canvasLeft();
  else
    return x;
    
}

Viewport.prototype.toLocalY = function(y) {
  var mid = this.canvasTop() + this.viewH / 2 + this.canvasBoundry;
  if (this.graph.newViewport == true)
    //return y - this.canvasTop();
    return Math.floor((y - mid) * this.scale + mid) - this.canvasTop();
  else
    return y;
}

Viewport.prototype.toWorldX = function(x) {
  var mid = this.viewW / 2 + this.canvasBoundry;
  if (this.graph.newViewport == true)
    return Math.floor((x - mid) / this.scale + mid) + this.canvasLeft();
    //return this.canvasLeft() + x;
  else
    return x;
}

Viewport.prototype.toWorldY = function(y) {
  var mid = this.viewH / 2 + this.canvasBoundry;
  if (this.graph.newViewport == true)
    return Math.floor((y - mid) / this.scale + mid) + this.canvasTop();
    //return this.canvasTop() + y;
  else
    return y;
}

Viewport.prototype.setScale = function(scale) {
  /* 1.0 zoomed in.
     0.0 entire graph is shown(if it is centered). */

  var x = this.viewW * scale + (this.graph.extents.max.x - graph.extents.min.x) * (1 - scale);
  var y = this.viewH * scale + (this.graph.extents.max.y - graph.extents.min.y) * (1 - scale);
  var xScale = this.viewW / x;
  var yScale = this.viewH / y;
  
  this.callerScale = scale;
  
  /* Take minimum. */
  this.scale = xScale < yScale ? xScale : yScale;
  /* Graph extents could be smaller than view thus causing zooming in. Perhaps not
     something worth allowing. */
  if (this.scale > 1.0)
    this.scale = 1.0;

  /* No very sure about this... */
  this.expandWorld(this.scaleToWorld(this.toLocalX(this.minX)),
                   this.scaleToWorld(this.toLocalY(this.minY)),
		   this.scaleToWorld(this.toLocalX(this.maxX)),
		   this.scaleToWorld(this.toLocalY(this.maxY)));
  //this.graph.ch.setPriorityText("Scale " + scale, 20);
  /*this.graph.ch.setPriorityText("World minX" + this.minX + " maxX " + this.maxX +
                                " minY " + this.minY + " maxY " + this.maxY, 200);*/
  this.setView(this.x1, this.y1);
}

Viewport.prototype.scaleToView = function(x) {
  return Math.floor(x * this.scale);
}

Viewport.prototype.scaleToWorld = function(x) {
  return Math.floor(x / this.scale);
}

Viewport.prototype.expandWorld = function(minX, minY, maxX, maxY) {
  /* Fetch new slices. */
  if (minX < this.minX) {
    this.graph.sync.getViewportNotes(minX, this.minY/**/, this.minX - minX, this.maxY - this.minY/**/);
    this.minX = minX;
  }

  if (minY < this.minY) {
    this.graph.sync.getViewportNotes(this.minX/**/, minY, this.maxX - this.minX/**/, this.minY - minY);
    this.minY = minY;
  }

  if (maxX > this.maxX) {
    this.graph.sync.getViewportNotes(this.maxX, this.minY/**/, maxX - this.maxX, this.maxY - this.minY/**/);
    this.maxX = maxX;
  }

  if (maxY > this.maxY) {
    this.graph.sync.getViewportNotes(this.minX/**/, this.maxY, this.maxX - this.minX/**/, maxY - this.maxY);
    this.maxY = maxY;
  }
}

Viewport.prototype.worldLeft = function() {
  return this.minX;
}

Viewport.prototype.worldTop = function() {
  return this.minY;
}

Viewport.prototype.worldRight = function() {
  return this.maxX;
}

Viewport.prototype.worldBottom = function() {
  return this.maxY;
}

Viewport.prototype.worldWidth = function() {
  return this.maxX - this.minX;
}

Viewport.prototype.worldHeight = function() {
  return this.maxY - this.minY;
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
    this.graph.sync.getViewportNotesOld();
    this.graph.vpLastUpdatedX = vpX;
    this.graph.vpLastUpdatedY = vpY;
  }
}
