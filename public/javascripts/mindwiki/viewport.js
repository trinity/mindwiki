/* 

  universe: entire graph in database
  world: part(bounding box) of universe that has been cached
  canvas: raphael canvas that user is looking at
  view: position of raphael canvas that user is looking at

  Universe and world use same coordinate system.
*/
function Viewport() {
    this.x = this.y = 0;
    this.scale = 1;
    this.callerScale = 1.0;
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

  this.x = parseInt(jQuery.url.setUrl(anchor).param("x"), 10);
  this.y = parseInt(jQuery.url.setUrl(anchor).param("y"), 10);
  this.callerScale = parseFloat(jQuery.url.setUrl(anchor).param("zoom"));
  
  /* These are not sane defaults but getting access to this.extents.mid. is not currently very easy. */
  if (isNaN(this.x) == true)
    this.x = 0;

  if (isNaN(this.y) == true)
    this.y = 0;

  if (isNaN(this.callerScale) == true)
    this.callerScale = 1.0;
}

Viewport.prototype.updateURL = function() {
  window.location.href = "#x=" + this.x + "&y=" + this.y + "&zoom=" + this.callerScale;
}


Viewport.prototype.clipViewToUniverse = function(pos) {
  var newPos = pos;
  
  if (pos.x < this.graph.extents.min.x - this.scaleToWorld(this.viewW / 2))
    newPos.x = Math.floor(this.graph.extents.min.x - this.scaleToWorld(this.viewW / 2));

  if (pos.x > this.graph.extents.max.x + this.scaleToWorld(this.viewW / 2))
    newPos.x = Math.floor(this.graph.extents.max.x + this.scaleToWorld(this.viewW / 2));

  if (pos.y < this.graph.extents.min.y - this.scaleToWorld(this.viewH / 2))
    newPos.y = Math.floor(this.graph.extents.min.y - this.scaleToWorld(this.viewH / 2));

  if (pos.y > this.graph.extents.max.y + this.scaleToWorld(this.viewH / 2))
    newPos.y = Math.floor(this.graph.extents.max.y + this.scaleToWorld(this.viewH / 2));
  
  return newPos;
}

Viewport.prototype.addViewFastMove = function(x, y) {
  var newPos = this.clipViewToUniverse({x:x, y:y});
  x = newPos.x;
  y = newPos.y;

  /* Same as scaleToView but with floating point precision.*/
  this.canvasMoveX += x * this.scale;
  this.canvasMoveY += y * this.scale;
  
  /* Need to "reposition" canvas. */
  if (this.canvasMoveX < 0 || this.canvasMoveY < 0) {
    this.setView(x + this.x, y + this.y);
    return;
  }
  
  /* Need to "reposition" canvas. */
  if (this.canvasMoveX > this.canvasBoundry * 2 || this.canvasMoveY > this.canvasBoundry * 2) {
    this.setView(x + this.x, y + this.y);
    return;
  }
  
  this.x = this.x + x;
  this.y = this.y + y;

  $("#mindwiki_world").css('left', -this.canvasMoveX + "px");
  $("#mindwiki_world").css('top', -this.canvasMoveY + "px");
  //this.graph.ch.setPriorityText("Canvas move " + this.canvasMoveX + " " + this.canvasMoveY, 10);
}

Viewport.prototype.setViewFastMove = function(x, y) {
}

Viewport.prototype.setViewSize = function(w, h) {
  this.viewW = w;
  this.viewH = h;
  this.setScale(this.callerScale); /* Calls setView as well. */
}

Viewport.prototype.setView = function(x, y) {
  var newPos = this.clipViewToUniverse({x:x, y:y});
  x = newPos.x;
  y = newPos.y;

  this.x = x;
  this.y = y;
  
  this.canvasX1 = x - this.viewW / 2 - this.canvasBoundry;
  this.canvasY1 = y - this.viewH / 2 - this.canvasBoundry;
  this.canvasX2 = x + this.viewW / 2 + this.canvasBoundry;
  this.canvasY2 = y + this.viewH / 2 + this.canvasBoundry;
  this.canvasMoveX = this.canvasBoundry;
  this.canvasMoveY = this.canvasBoundry;

  this.expandWorld(this.canvasX1, this.canvasY1, this.canvasX2, this.canvasY2);
  
  /* And scroll our canvas. */
  this.addViewFastMove(0, 0);
  
  this.graph.UpdateAllNotesCSS();
  if (this.graph.selectedNote != null)
    this.graph.dragControls(graph.selectedNote);
  //this.updateURL();
}

Viewport.prototype.setViewXScrolled = function(x) {
  setViewFastMove(x, this.y);
}

Viewport.prototype.setViewYScrolled = function(y) {
  setViewFastMove(this.x, y);
}

Viewport.prototype.setViewX = function(x) {
  setView(x, this.y);
}

Viewport.prototype.setViewY = function(y) {
  setView(this.x, y);
}


Viewport.prototype.viewX = function() {
  if (this.graph.newViewport == true) {
    return this.x;
  } else {
    return $("#vport").scrollLeft();
  }
}

Viewport.prototype.viewY = function() {
  if (this.graph.newViewport == true) {
    return this.y;
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
  var worldMid = (this.canvasX1 + this.canvasX2) / 2;
  var viewMid = (this.canvasX2 - this.canvasX1) / 2;

  if (this.graph.newViewport == true)
    return Math.floor((x - worldMid) * this.scale + viewMid);
  else
    return x;
  
}

Viewport.prototype.toLocalY = function(y) {
  var worldMid = (this.canvasY1 + this.canvasY2) / 2;
  var viewMid = (this.canvasY2 - this.canvasY1) / 2;

  if (this.graph.newViewport == true)
    return Math.floor((y - worldMid) * this.scale + viewMid);
  else
    return y;
}

Viewport.prototype.toWorldX = function(x) {
  var viewMid = (this.canvasX2 - this.canvasX1) / 2;
  var worldMid = (this.canvasX1 + this.canvasX2) / 2;
  
  if (this.graph.newViewport == true)
    return Math.floor((x - viewMid) / this.scale + worldMid);
  else
    return x;
}

Viewport.prototype.toWorldY = function(y) {
  var viewMid = (this.canvasY2 - this.canvasY1) / 2;
  var worldMid = (this.canvasY1 + this.canvasY2) / 2;

  if (this.graph.newViewport == true)
    return Math.floor((y - viewMid) / this.scale + worldMid);
  else
    return y;
}

Viewport.prototype.setScaleInt = function(scale) {
  /* 1.0 zoomed in.
     0.0 entire graph is shown(if it is centered). */

  var x = this.viewW * scale + (this.graph.extents.max.x - this.graph.extents.min.x) * (1 - scale);
  var y = this.viewH * scale + (this.graph.extents.max.y - this.graph.extents.min.y) * (1 - scale);
  var xScale = this.viewW / x;
  var yScale = this.viewH / y;
  
  this.callerScale = scale;
  
  /* Take minimum. */
  this.scale = xScale < yScale ? xScale : yScale;
  
  /* Graph extents could be smaller than view thus causing zooming in. Perhaps not
     something worth allowing. Limited by caller. */
 /* if (this.scale > 1.0)
    this.scale = 1.0;*/
  if (this.graph.scaleChanged != null)
    this.graph.scaleChanged();
}

Viewport.prototype.setScale = function(scale) {
  this.setScaleInt(scale);
  this.setView(this.x, this.y);
}

Viewport.prototype.scaleToView = function(x) {
  return Math.floor(x * this.scale);
}

Viewport.prototype.scaleToWorld = function(x) {
  return Math.floor(x / this.scale);
}

Viewport.prototype.scaleByOrigin = function(x, y, scale) {
  /* Quick and dirty. */
  var xMove = this.toWorldX(x) - this.x;
  var yMove = this.toWorldY(y) - this.y;

  this.setScaleInt(scale);

  var xMoveN = this.toWorldX(x) - this.x;
  var yMoveN = this.toWorldY(y) - this.y;

  var xOffset = xMove - xMoveN;
  var yOffset = yMove - yMoveN;
  
  this.setView(this.x + xOffset, this.y + yOffset);
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
