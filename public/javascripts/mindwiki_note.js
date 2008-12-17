// This file defines the MindWiki note objects

// Note is the "class" for all notes.
function Note() {
	this.id;
	this.name = "New note";
	this.x;
	this.y;
	this.width;
	this.height;
	this.color = "silver";
	this.content = "New content."; // currently already rendered.. -> change for editing.

	this.div;
}

// Save to DB.
// Use after editing.
Note.prototype.save = function() {
	//
}

// Delete note.
Note.prototype.delete = function() {
	var thisnote = this;
	document.getElementById("vport").removeChild(this.div);
	$.ajax({
		url: "/notes/destroy/"+thisnote.id+"?graph_id="+graph_id, // fetches too much data -> FIX CONTROLLER
		success: function(data){
			// maybe do something? :D
		},
		error: function(a,b,c){
			alert("Cannot delete note id "+thisnote.id+" from database: "+a+b+c);
		}
	});
	delete this;
}

// Get new ID from DB.
// Use after creating a new note.
Note.prototype.newID = function() {
	var thisnote = this;
	$.ajax({
		url: "/notes/create",
		type: "POST",
		data: {
	                "graph_id" : graph_id,
        	        "note[name]" : "New note",    
	                "note[color]" : "silver",             
	                "note[x]" : thisnote.x,                        
	                "note[y]" : thisnote.y,        
	                "note[width]" : 200,         
	                "note[height]" : 300,        
	                "article_content" : "New content."
 		},
		dataType: "xml",
		success: function(data){
			$("note", data).each(function(i) {
				thisnote.id = $(this).find("id").text();
			});
		},
		error: function(a,b,c){
			alert("Cannot create new note to db: "+a+b+c);
		}
	});
}

// This function (re)constructs the whole div!
// Use after loading a Note with data.
Note.prototype.redraw = function() {
	var thisnote = this; // To be used in submethods, e.g. click-handlers.
	this.div = document.createElement("div");

	$(this.div).addClass("note").css({
		"backgroundColor" : this.color, // User def color for content column
		"top" : this.y+"px",
		"left" : this.x+"px",
		"width" : this.width+"px",
		"height" : this.height+"px"
	});

	// Behaviour
	$(this.div)
	.resizable(
	{
    minWidth: 100,
    minHeight: 60,
    maxWidth: 400,
    maxHeight: 400,
    handles:  'se' // defines the resize handle location i.e. south east corner
	})
	.draggable(
	{
		zIndex: this.id, // BAD!!! the active note should be on top
		containment: "parent"
	});

	// Content

	// Creating note elements
  var noteTable = document.createElement("table");
  var titleTD = document.createElement("td");
  var articleTD = document.createElement("td");
  var buttonRow = document.createElement("tr");
  var titleRow = document.createElement("tr");
  var articleRow = document.createElement("tr");
  var article = document.createElement("div");
  var deleteButtonTD = document.createElement("td");
  var colorButtonTD = document.createElement("td");
  var arrowButtonTD = document.createElement("td");
  var deleteButton = document.createElement("a");
  var colorButton = document.createElement("a");
  var arrowButton = document.createElement("a");

	// arrow button
 	$(arrowButton).addClass("noteButton").append("Arrow");
	$(arrowButton).click(function () { /* TODO */ });
	$(arrowButtonTD).addClass("noteButtonTD").append(arrowButton);
	
	// color button
 	$(colorButton).addClass("noteButton").append("Color");
	$(colorButton).click(function () { /* TODO */ });
	$(colorButtonTD).addClass("noteButtonTD").append(colorButton);
	
	// delete button
 	$(deleteButton).addClass("noteButton").append("Delete");
	$(deleteButton).click(function () { thisnote.delete(); });
	$(deleteButtonTD).addClass("noteButtonTD").append(deleteButton);

  // button row
	//$(buttonRow).append(arrowButtonTD);
	//$(buttonRow).append(colorButtonTD);
  $(buttonRow).addClass("noteTableRow").append(arrowButtonTD).append(colorButtonTD).append(deleteButtonTD);

	// titleTD
	$(titleTD).addClass("noteTitleTD").attr("colspan",3).append(this.name);
	// title row
	$(titleRow).addClass("noteTableRow").append(titleTD);

	// article (div)
	$(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.content.toString());
	// articleTD
	$(articleTD).addClass("noteArticleTD").css({"backgroundColor": this.color}).attr("colspan",3).append(article);
	// article row
	$(articleRow).addClass("noteArticleRow").append(articleTD);
 	
	// table
	$(noteTable).addClass("noteTable").append(buttonRow).append(titleRow).append(articleRow);
	$(this.div).append(noteTable);

	$("#vport").append(this.div);
}

