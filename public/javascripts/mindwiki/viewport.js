function Viewport() {
    this.x1 = this.y1 = 0;
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

  this.x1 = jQuery.url.setUrl(anchor).param("left");
  this.y1 = jQuery.url.setUrl(anchor).param("top");
}

Viewport.prototype.updateURL = function() {
  window.location.href = "#left=" + this.x1 + "&top=" + this.y1;
}

Viewport.prototype.setView = function(left, top) {
  this.x1 = left;
  this.y1 = top;
  
  this.addNewNotes();
  this.graph.UpdateAllNotesCSS();
  if (this.graph.selectedNote != null)
    this.graph.dragControls(graph.selectedNote);
  this.updateURL();
}

Viewport.prototype.setViewXScrolled = function(left) {
  this.x1 = left;

  this.addNewNotes();
  this.graph.UpdateAllNotesCSS();
  if (this.graph.selectedNote != null)
    this.graph.dragControls(graph.selectedNote);
  this.updateURL();
}

Viewport.prototype.setViewYScrolled = function(top) {
  this.y1 = top;

  this.addNewNotes();
  this.graph.UpdateAllNotesCSS();
  if (this.graph.selectedNote != null)
    this.graph.dragControls(graph.selectedNote);
  this.updateURL();
}

Viewport.prototype.setViewX = function(left) {
  /* TODO: update scrollbar position */
  /*$(graph.hScrollbar).slider("value", 500);*/
  if (this.graph.newViewport == true)
    this.setViewXScrolled(left);
}

Viewport.prototype.setViewY = function(top) {
  /* TODO: update scrollbar position */
  /*$(graph.vScrollbar).slider("value", 500);*/
  if (this.graph.newViewport == true)
    this.setViewYScrolled(top);
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

Viewport.prototype.toLocalX = function(x) {
  if (this.graph.newViewport == true)
    return x - this.viewLeft();
  else
    return x;
    
}

Viewport.prototype.toLocalY = function(y) {
  if (this.graph.newViewport == true)
    return y - this.viewTop();
  else
    return y;
}

Viewport.prototype.toWorldX = function(x) {
  if (this.graph.newViewport == true)
    return this.viewLeft() + x;
  else
    return x;
}

Viewport.prototype.toWorldY = function(y) {
  if (this.graph.newViewport == true)
    return this.viewTop() + y;
  else
    return y;
}


  // Load more notes after window has been resized enough
Viewport.prototype.addNewNotes = function() {
  // Load notes after scrolled
  if (this.graph.newViewport == true) {
    var vpX = this.viewLeft();
    var vpY = this.viewTop();
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
