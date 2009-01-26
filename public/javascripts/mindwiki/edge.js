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

Edge.prototype.setStartNote = function (note) 
{
  this.startNote = note;
}

Edge.prototype.setEndNote = function (note) 
{
  if (note == this.startNote) {
    graph.globalStartNote = null;
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

  var sx = this.startNote.x + this.startNote.width / 2;
  var sy = this.startNote.y + this.startNote.height / 2;
  var ex = this.endNote.x + this.endNote.width / 2;
  var ey = this.endNote.y + this.endNote.height / 2;

  // viewport doesn't have standard coordinate system. that's why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negsy = -sy;
  var negey = -ey;
  var a = this.getAngle(sx, negsy, ex, negey);
  this.angle = a;
  
  var result = new Array();
  
  this.rectangleIntersection(sx, negsy, this.startNote.width, this.startNote.height, a, result);
  this.x1 = result[0];
  this.y1 = -result[1];

  // change direction. 
  a += Math.PI;
  if (a > 2 * Math.PI)
  {
    a -= 2 * Math.PI;
  }

  this.rectangleIntersection(ex, negey, this.endNote.width, this.endNote.height, a, result);
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

Edge.prototype.select = function () 
{
  if (!this.selected)
  {
    this.erase();
    this.selected = true;
    this.draw();
  }
}

Edge.prototype.unselect = function () 
{
  if (this.selected)
  {
    this.erase();
    this.selected = false;
    this.draw();
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
  
  var edgeLength = this.distance(this.x1, this.y1, this.x2, this.y2);
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
  
  if (this.distance(x,y,cx,cy) > margin)
  {
    return false;
  }
  
  return true;
}

// Sends a newly created edge to server, and gets a database id in return.
Edge.prototype.newID = function() {
  var thisedge = this;
  $.ajax({
    url: "/edges/create",
    type: "POST",
    data: {
      "edge[name]" : thisedge.title,    
      "edge[color]" : thisedge.color,             
      "edge[source_id]" : thisedge.startNote.id,
      "edge[target_id]" : thisedge.endNote.id,        
      "edge[directed]" : thisedge.directed,
    },
    dataType: "xml",
    success: function(data){
      $("edge", data).each(function(i) {
        thisedge.id = parseInt($(this).find("id").text());
      });
    },
    error: function(a,b,c){
      alert("Cannot create a new edge: "+a+b+c);
    }
  });
}

Edge.prototype.getAngle = function(x1, y1, x2, y2)
{
  // returns the angle (0 <= angle < 2*pi) from point (x1,y1) to (x2,y2).
  // assumes standrad coordinate system
	
  // let's handle main axis first
  if (x2 == x1)
  {
    if (y1 < y2)
    {
      return Math.PI / 2;
    }
    return 1.5 * Math.PI;
  }
  else if (y2 == y1)
  {
    if (x1 > x2)
    {
      return Math.PI;
    }
    return 0;
  }

  if (x1 > x2)
  {
    return Math.PI + Math.atan((y2-y1)/(x2-x1));
  }
  
  if (y1 > y2)
  {
    return 2 * Math.PI + Math.atan((y2-y1)/(x2-x1));
  }
  return Math.atan((y2-y1)/(x2-x1));
}

// returns the intersection point of a given rectangle and a line, which starts
// from the center point of the rectangle and goes to ang direction.
Edge.prototype.rectangleIntersection = function(cx,cy,width,height,ang,result)
{
  // assumes standard coordinate system!

  var aLimit = Math.atan(height/width);
  var padding = 2;
  
  if (ang <= aLimit || ang >= 2 * Math.PI - aLimit)
  {
    result[0] = cx + width/2 + 3*padding;
    result[1] = cy + Math.tan(ang) * width / 2;
  }
  else if (ang > aLimit && ang < Math.PI - aLimit)
  {
    // note: sin(a) > 0. no need to check division by zero.
    result[0] = cx + (Math.cos(ang) / Math.sin(ang)) * height / 2
    result[1] = cy + height / 2 + padding;
  }
  else if (ang >= Math.PI - aLimit && ang <= Math.PI + aLimit)
  {
    result[0] = cx - width/2 - padding;
    result[1] = cy - Math.tan(ang) * width / 2;
  }
  else if (ang > Math.PI + aLimit && ang < 2 * Math.PI - aLimit)
  {
    // note: sin(a) < 0. no need to check division by zero.
    result[0] = cx - (Math.cos(ang) / Math.sin(ang)) * height / 2
    result[1] = cy - height / 2 - 3*padding;
  }
}

// calculates the euclidean distance between points (x1,y1) and (x2,y2).
Edge.prototype.distance = function(x1,y1,x2,y2)
{
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx*dx + dy*dy);
}
