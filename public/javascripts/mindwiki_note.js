// This file defines the MindWiki note objects

// Note is the "class" for all notes.
function Note() {
	this.id;
	this.name = "New note";
	this.x;
	this.y;
	this.width;
	this.height;
	this.color = "grey";
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
	                "note[color]" : "grey",             
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

	// Style
	this.div.className = "note"; // default style
	$(this.div).css({
		"backgroundColor" : "#ddd", // User def color for content column
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
                handles:  'se' // What's this
	})
	.draggable(
	{
		zIndex: this.id, // good? bad?
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

	// table
	$(this.div).append(noteTable);
	$(noteTable).addClass("noteContent").append(buttonRow).append(titleRow).append(articleRow);

        // button row
        $(buttonRow).append(deleteButtonTD);
	$(buttonRow).append(colorButtonTD);
	$(buttonRow).append(arrowButtonTD);

	// delete button
       	$(deleteButton).addClass("deleteButton").append("Delete");
	$(deleteButton).click(function () { thisnote.delete(); });
	$(deleteButtonTD).addClass("noteButtonTD").append(deleteButton);

	// title row
	$(titleRow).append(titleTD);
	// titleTD
	$(titleTD).addClass("noteTitle").append(this.name);

	// article row
	$(articleRow).append(articleTD);
	// articleTD
	$(articleTD).addClass("articleTD").css({"backgroundColor": this.color}).append(this.content);
 	
	$("#vport").append(this.div);
}

