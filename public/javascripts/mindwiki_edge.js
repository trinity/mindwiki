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
  this.selected = false;
  this.rCanvas = null;  // Raphael canvas
}

Edge.prototype.setStartNote = function (note) 
{
  this.startNote = note;
}

Edge.prototype.setEndNote = function (note) 
{
  this.endNote = note;
}

Edge.prototype.update = function () 
{
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
  
  this.draw();

};

Edge.prototype.draw = function () 
{
  this.rCanvas.path({stroke: this.color}).absolutely().moveTo(this.x1,this.y1).lineTo(this.x2,this.y2);
	
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
	
  this.rCanvas.path({stroke: this.color, fill: this.color}).absolutely().moveTo(this.x2,this.y2).lineTo(xLeft,yLeft).lineTo(xRight,yRight).andClose();
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
