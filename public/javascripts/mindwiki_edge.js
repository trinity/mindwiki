// This file contains the Edge "class"

// Constructor
function Edge ()
{
  this.id;
  this.startNote = null;
  this.endNote = null;
  this.x1 = 0;
  this.y1 = 0;
  this.x2 = 0;
  this.y2 = 0;
  this.angle = 0; // direction from startnote to endnote in radians.
  this.color = "#000000";
  this.title = "";
  this.directed = true;
  this.selected = false;
  this.rCanvas = null;  // Raphael canvas
  this.canvasPath = null; // Raphael canvas.path
  this.canvasPath2 = null;
}

Edge.prototype.setStartNote = function (note) 
{
  this.startNote = note;
}

Edge.prototype.setEndNote = function (note) 
{
  if (note == this.startNote) {
  	globalStartNote = null;
  	globalEndNote = null;
  	this.startNote = null;
  }
  else 
  	this.endNote = note;
}

Edge.prototype.update = function (doNotRedraw)
{
  doNotRedraw = doNotRedraw || false; // defaults to false

  if (this.startNote == null || this.endNote == null)
  {
    alert("Trying to draw an edge, which has a null note!");
    return;
  }

  var sx = this.startNote.x + this.startNote.width / 2;
  var sy = this.startNote.y + this.startNote.height / 2;
  var ex = this.endNote.x + this.endNote.width / 2;
  var ey = this.endNote.y + this.endNote.height / 2;

  // vievport doesn't have standard coordinate system. that's why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negsy = -sy;
  var negey = -ey;
	var a = getAngle(sx, negsy, ex, negey);
  this.angle = a;
  
  var result = new Array();
  
  rectangleIntersection(sx, negsy, this.startNote.width, this.startNote.height, a, result);
  this.x1 = result[0];
  this.y1 = -result[1];
  

  // change direction. 
  a += Math.PI;
  if (a > 2 * Math.PI)
  {
    a -= 2 * Math.PI;
  }

  rectangleIntersection(ex, negey, this.endNote.width, this.endNote.height, a, result);
  this.x2 = result[0];
  this.y2 = -result[1];
  
  if(doNotRedraw)
    this.drawUpdateOnly();
  else
    this.draw();

};

Edge.prototype.draw = function () 
{
  this.canvasPath = this.rCanvas.path({stroke: this.color}).absolutely().moveTo(this.x1,this.y1).lineTo(this.x2,this.y2);
	
  var arrowSize = 10;
	
  // vievport doesn't have standard coordinate system. that's why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negy1 = -this.y1;
  var negy2 = -this.y2;
	
  // compute the other two points of the arrow tip
  var aLeft = this.angle - 0.85 * Math.PI;
  var aRight = this.angle + 0.85 * Math.PI;
  var xLeft = this.x2 + arrowSize * Math.cos(aLeft);
  var yLeft = -(negy2 + arrowSize * Math.sin(aLeft));
  var xRight = this.x2 + arrowSize * Math.cos(aRight);
  var yRight = -(negy2 + arrowSize * Math.sin(aRight));
	
  this.canvasPath2 = this.rCanvas.path({stroke: this.color, fill: this.color}).absolutely().moveTo(this.x2,this.y2).lineTo(xLeft,yLeft).lineTo(xRight,yRight).andClose();
};

// THIS IS COPYPASTED FROM draw(). SORRY!. FIX LATER!
Edge.prototype.drawUpdateOnly = function () 
{
  //this.canvasPath = this.rCanvas.path({stroke: this.color}).absolutely().moveTo(this.x1,this.y1).lineTo(this.x2,this.y2);
  this.canvasPath.path[0].arg = [this.x1,this.y1];
  this.canvasPath.path[1].arg = [this.x2,this.y2];
  this.canvasPath.redraw();
	
  var arrowSize = 10;
	
  // vievport doesn't have standard coordinate system. that's why we count each y-coordinate
  // as negative to use standard 2D algebra.
  var negy1 = -this.y1;
  var negy2 = -this.y2;
	
  // compute the other two points of the arrow tip
  var aLeft = this.angle - 0.85 * Math.PI;
  var aRight = this.angle + 0.85 * Math.PI;
  var xLeft = this.x2 + arrowSize * Math.cos(aLeft);
  var yLeft = -(negy2 + arrowSize * Math.sin(aLeft));
  var xRight = this.x2 + arrowSize * Math.cos(aRight);
  var yRight = -(negy2 + arrowSize * Math.sin(aRight));
	
  //this.canvasPath2 = this.rCanvas.path({stroke: this.color, fill: this.color}).absolutely().moveTo(this.x2,this.y2).lineTo(xLeft,yLeft).lineTo(xRight,yRight).andClose();
  this.canvasPath2.path[0].arg = [this.x2,this.y2];
  this.canvasPath2.path[1].arg = [xLeft,yLeft];
  this.canvasPath2.path[2].arg = [xRight,yRight];
  
  this.canvasPath2.redraw();
  
};

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
};

function getAngle(x1, y1, x2, y2) 
{
  // returns the angle from point (x1,y1) to (x2,y2).
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

  // other angles
  if (x1 > x2)
  {
    return Math.PI + Math.atan((y2-y1)/(x2-x1));
  }
  return Math.atan((y2-y1)/(x2-x1));
}

// returns the intersection point of a given rectangle and a line, which starts
// from the center point of the rectangle and goes to ang direction.
function rectangleIntersection(cx,cy,width,height,ang,result)
{
  // assumes standard coordinate system!

  var aLimit = Math.atan(height/width);
  
  if (ang <= aLimit || ang >= 2 * Math.PI - aLimit)
  {
    result[0] = cx + width/2;
    result[1] = cy + Math.tan(ang) * width / 2;
  }
  else if (ang > aLimit && ang < Math.PI - aLimit)
  {
    // note: sin(a) > 0. no need to check division by zero.
    result[0] = cx + (Math.cos(ang) / Math.sin(ang)) * height / 2
    result[1] = cy + height / 2;
  }
  else if (ang >= Math.PI - aLimit && ang <= Math.PI + aLimit)
  {
    result[0] = cx - width/2;
    result[1] = cy - Math.tan(ang) * width / 2;
  }
  else if (ang > Math.PI + aLimit && ang < 2 * Math.PI - aLimit)
  {
    // note: sin(a) < 0. no need to check division by zero.
    result[0] = cx - (Math.cos(ang) / Math.sin(ang)) * height / 2
    result[1] = cy - height / 2;
  }
}
