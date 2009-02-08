// This file contains the Edge "class"

// Constructor
function Edge ()
{
  this.id = -1;
  this.startNote = null;
  this.endNote = null;
  this.x1 = 0;
  this.y1 = 0;
  this.x2 = 0;
  this.y2 = 0;
  this.xLeft = 0;
  this.yLeft = 0;
  this.xRight = 0;
  this.yRight = 0;
  this.angle = 0; // direction from startnote to endnote in radians.
  this.color = "#000000";
  this.title = "";
  this.directed = true;
  this.selected = false;
  this.rCanvas = graph.rc;  // Raphael canvas
  this.canvasPath = null; // Raphael canvas.path
  this.canvasPath2 = null;
  this.canvasPathSelected = null; // draw this when selected
  this.circle = null;
  this.arrowSize = 10;
  this.strokeWidth = 3;
}

Edge.prototype.remove = function() {

  this.erase();
  
  // Make sure controls are not visible on this one
  if (this.selected) {
    graph.detachControlsFromEdge(this);
  }
  
  this.startNote.disconnectEdgeFromById(this.id);
  this.endNote.disconnectEdgeToById(this.id);

  // Notify the graph object
  graph.disconnectEdge(this.id);
  // Notify the server
  graph.sync.deleteEdge(this.id);

  // Delete the object
  delete this;
}

Edge.prototype.setStartNote = function (note) 
{
  this.startNote = note;
}

Edge.prototype.setEndNote = function (note) 
{
  if (note == this.startNote) {
    alert("Internal error 126623");
    // Does not exist: graph.globalEndNote = null;
    this.startNote = null;
  }
  else 
    this.endNote = note;
}

// This updates edge position and angle based on values of the notes.
// Used before updating or drawing the edge with Raphael.
Edge.prototype.update = function(){

  // Hmm.
  if (this.startNote == null || this.endNote == null)
  {
    alert("Trying to draw an edge (id:"+this.id+"), which has a null note!");
    return;
  }

  // Less writing if we assume edges are in local coords all the way.
  var sx = graph.vp.toLocalX(this.startNote.x) + graph.vp.scaleToView(this.startNote.width / 2);
  var sy = graph.vp.toLocalY(this.startNote.y) + graph.vp.scaleToView(this.startNote.height / 2);
  var ex = graph.vp.toLocalX(this.endNote.x) + graph.vp.scaleToView(this.endNote.width / 2);
  var ey = graph.vp.toLocalY(this.endNote.y) + graph.vp.scaleToView(this.endNote.height / 2);

  // viewport doesn't have standard coordinate system. that's why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negsy = -sy;
  var negey = -ey;
  var a = getAngle(sx, negsy, ex, negey);
  this.angle = a;
  
  var result = new Array();
  
  rectangleIntersection(sx, negsy, graph.vp.scaleToView(this.startNote.width), graph.vp.scaleToView(this.startNote.height), a, result);
  this.x1 = result[0];
  this.y1 = -result[1];

  // change direction. 
  a += Math.PI;
  if (a > 2 * Math.PI)
  {
    a -= 2 * Math.PI;
  }

  rectangleIntersection(ex, negey, graph.vp.scaleToView(this.endNote.width), graph.vp.scaleToView(this.endNote.height), a, result);
  this.x2 = result[0];
  this.y2 = -result[1];

  // Viewport doesn't have standard coordinate system. That is why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negy1 = -this.y1;
  var negy2 = -this.y2;
	
  // compute the other two points of the arrow tip
  var aLeft = this.angle - 0.85 * Math.PI;
  var aRight = this.angle + 0.85 * Math.PI;
  this.xLeft = this.x2 + this.arrowSize * Math.cos(aLeft);
  this.yLeft = -(negy2 + this.arrowSize * Math.sin(aLeft));
  this.xRight = this.x2 + this.arrowSize * Math.cos(aRight);
  this.yRight = -(negy2 + this.arrowSize * Math.sin(aRight));
}

Edge.prototype.redraw = function()
{
  this.update();

  if (this.selected)
  {
    this.canvasPathSelected.path[0].arg = [this.x1,this.y1];
    this.canvasPathSelected.path[1].arg = [this.x2,this.y2];
    this.canvasPathSelected.redraw();
  }
  
  this.canvasPath.path[0].arg = [this.x1,this.y1];
  this.canvasPath.path[1].arg = [this.x2,this.y2];
  this.canvasPath.redraw();

  this.canvasPath2.path[0].arg = [this.x2,this.y2];
  this.canvasPath2.path[1].arg = [this.xLeft,this.yLeft];
  this.canvasPath2.path[2].arg = [this.xRight,this.yRight];
  this.canvasPath2.redraw();
  
  this.circle.attr({cx: this.x1, cy: this.y1});
}

// "Undraws" the edge.
Edge.prototype.erase = function()
{
  if (this.rCanvas == null)
  {
    alert("null canvas!");
  }
  if (this.selected)
  {
    this.canvasPathSelected.remove();
  }
  this.canvasPath.remove();
  this.canvasPath2.remove();
  this.circle.remove();
}

Edge.prototype.draw = function () 
{
  if (this.selected) 
  {
    this.canvasPathSelected = this.rCanvas.path({stroke: "#ffff00", "stroke-width": this.strokeWidth+4}).absolutely().moveTo(this.x1,this.y1).lineTo(this.x2,this.y2);
  }
  
  this.canvasPath = this.rCanvas.path({stroke: this.color, "stroke-width": this.strokeWidth}).absolutely().moveTo(this.x1,this.y1).lineTo(this.x2,this.y2);
  this.canvasPath2 = this.rCanvas.path({stroke: this.color, fill: this.color}).absolutely().moveTo(this.x2,this.y2).lineTo(this.xLeft,this.yLeft).lineTo(this.xRight,this.yRight).andClose();
  this.circle = this.rCanvas.circle(this.x1, this.y1, this.arrowSize / 2);
  this.circle.attr({stroke: this.color, fill: this.color});
}

Edge.prototype.select = function (x,y) 
{
  if (!this.selected)
  {
    this.erase();
    this.selected = true;
    this.draw();
    graph.attachControlsToEdge(this,x,y);
  }
}

Edge.prototype.unselect = function () 
{
  if (this.selected)
  {
    this.erase();
    this.selected = false;
    this.draw();
    graph.detachControlsFromEdge(this);
  }
}


// Checks if the given coordinates (x,y) are "close" to edge. The close means in
// this case that we draw a rectangle arourd the edge and then add the given margin
// to it. If (x,y) is inside the rectangle, then (x,y) is close to the edge.
Edge.prototype.isClose = function (x,y,margin) 
{
  // is x too far left from the edge
  if ((x+margin) < this.x1 && (x+margin) < this.x2)
  {
    return false;
  }
  // is x too far right from the edge
  if (x-margin > this.x1 && x-margin > this.x2)
  {
    return false;
  }
  // is y too far above the edge. note: raster oriented coordinates (origin at top left corner)
  if (y+margin < this.y1 && y+margin < this.y2)
  {
    return false;
  }
  // is y too far below the edge. note: raster oriented coordinates (origin at top left corner)
  if (y-margin > this.y1 && y-margin > this.y2)
  {
    return false;
  }
  // if we get here, then x,y is inside the rectangle
  return true;
}


Edge.prototype.isHit = function (x,y,margin) 
{
  // check first if we are even close
  if (!this.isClose(x,y,margin))
  {
    return false;
  }
  
  var edgeLength = distance(this.x1, this.y1, this.x2, this.y2);
  if (edgeLength < 1)
  {
    // the edge is actually a point.
    return true;
  }
  // algorithm from: http://local.wasp.uwa.edu.au/~pbourke/geometry/pointline/ (18.1.2009)
  var u = (x-this.x1)*(this.x2-this.x1) + (y-this.y1)*(this.y2-this.y1);
  u = u / (edgeLength*edgeLength); // note: edgeLength >= 1

  if (u < 0 || u > 1)
  {
    // closest point does not fall within the line segment
    return false;
  }
  
  var cx = this.x1 + u*(this.x2-this.x1);
  var cy = this.y1 + u*(this.y2-this.y1);
  
  if (distance(x,y,cx,cy) > margin)
  {
    return false;
  }
  
  return true;
}

// Sends a newly created edge to server, and gets a database id in return.
Edge.prototype.newID = function() {
  graph.sync.createEdge(this);
}

