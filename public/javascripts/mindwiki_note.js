// This file defines the MindWiki note objects

// Note is the "class" for all notes.
function Note() {
  this.id;
  // default values for new notes
  this.name = "New note";
  this.x = 1;
  this.y = 1;
  this.width = 300;
  this.height = 200;
  this.color = "silver";
  this.content = "<p>Default content.</p>"; // <p> -tag bumps the layout ~10px down. What?-o
  this.editableContent = "Default content."; // RedCloth-syntax. What the user edits.

  this.selected = false;

  this.div;
  this.articleDiv; 
}

// Update the note on the screen to reflect the note object.
Note.prototype.update = function() {
  // SELECTION.
  // Multiselection is not implemented, yet!
  if(this.selected){
    // last note exists and isn't this one -> deselect it
    if(last_selected_note != null && last_selected_note != this){
      last_selected_note.selected = false;
      last_selected_note.update();
      last_selected_note = this;
    }

    last_selected_note = this;

    // Update this to have seleced appearance
    $(this.div).addClass("noteSelected").find(".noteButtonRow").show();
    //$(this.div). // Maybe put selected on top? as in zIndex == hiiigh

  } else {
    $(this.div).removeClass("noteSelected").find(".noteButtonRow").hide();
  }

  // Content rendering after edit
  if(this.articleDiv != null) 
    $(this.articleDiv).html(this.content);	

}


// Notifies the controller of updated coordinates
Note.prototype.updatePosition = function() {
  var thisnote = this;
  $.ajax({
    url: "/notes/update_position/"+thisnote.id,
    data: {
      "x" : thisnote.x,
      "y" : thisnote.y
    },
    success: function(data){
      // ...
    },
    error: function(a,b,c){
      // ...
    }
  });
}

// Notifies the controller of updated size
Note.prototype.updateSize = function() {
  var thisnote = this;
  $.ajax({
    url: "/notes/update_size/"+thisnote.id,
    data: {
      "width" : thisnote.width,
      "height" : thisnote.height
    },
    success: function(data){
      // ...
    },
    error: function(a,b,c){
      // ...
    }
  });
}


// Delete note.
Note.prototype.delete = function() {
  var thisnote = this;
  this.deleteDivFromDom();
  $.ajax({
    url: "/notes/destroy/"+thisnote.id+"?graph_id="+graph_id, // fetches too much data -> NEW METHOD INTO CONTROLLER?
    success: function(data){
      // maybe do something? :D
    },
    error: function(a,b,c){
      alert("Cannot delete note id "+thisnote.id+" from database: "+a+b+c);
    }
  });
  delete this;
}

// Just remove the div of the note from the DOM-tree. 
// Basically just hides the note from the UI.
// Used in note deletion and before redraw.
Note.prototype.deleteDivFromDom = function() {
  document.getElementById("vport").removeChild(this.div);
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
      "note[name]" : thisnote.name,    
      "note[color]" : thisnote.color,             
      "note[x]" : thisnote.x,                        
      "note[y]" : thisnote.y,        
      "note[width]" : thisnote.width,         
      "note[height]" : thisnote.height,        
      "article_content" : thisnote.content
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
  if(this.div != null){
    thisnote.deleteDivFromDom();
  }
  this.div = document.createElement("div");

  $(this.div).addClass("note").css({
    "backgroundColor" : this.color, // doesn't really show -> bars and content overwrite
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
    maxWidth: 800,
    maxHeight: 800,
    handles:  'se', // defines the resize handle location i.e. south east corner
    // Update note size after dragging.
    stop: function(event, ui){
      thisnote.width = ui.size.width;
      thisnote.height = ui.size.height;
      thisnote.updateSize();
    }
  })
  .draggable(
  {
    zIndex: 10000,
    containment: "parent",
    // Update note position after dragging.
    stop: function(event, ui){
      thisnote.x = ui.position.left;
      thisnote.y = ui.position.top;
      thisnote.updatePosition();
    }
  });

  // Selection
  $(this.div).mousedown( function()
  {
    thisnote.selected = true;
    thisnote.update();  
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
  $(buttonRow).addClass("noteButtonRow").append(arrowButtonTD).append(colorButtonTD).append(deleteButtonTD);
	
  // titleTD
  $(titleTD).addClass("noteTitleTD").attr("colspan",3).append(this.name);
  // title row
  $(titleRow).addClass("noteTitleRow").append(titleTD);

  // article (div)
  $(article).addClass("noteArticle").css({"backgroundColor": this.color}).append(this.content);
  thisnote.articleDiv = article; // for easier updating :)

  // launch editing:
  $(article).dblclick(function() {
    // This code might be a bit flakey, still. Using the same textbox-id for all notes absolutely requires
    // the calling of dialog("destroy").remove() to not cause some really annoyingly strange behaviour..
    // Maybe FIX someday?

    $("#vport").append('<div id="editWindow" class="flora"></div>');
    $("#editWindow").append('<p>Content<br /><textarea rows="15" cols="75" id="editableContentBox">'+thisnote.editableContent+'</textarea></p>');
    $("#editWindow").dialog({
      width: 600,
      height: 400,
      modal: true,
      title: thisnote.name+" (Editing)",
      buttons: {
        "Cancel": function(){
          $(this).dialog("destroy").remove();
        },
        "Save": function(){
          var boxContents = $("#editableContentBox").val();
          thisnote.editableContent = boxContents;
          thisnote.content = "Rendering edited content, please wait...";
          $.ajax({
            url: "/notes/update_content/"+thisnote.id,
            data: { "newContent" : boxContents },
            dataType: "html",
            success: function(data){
              thisnote.content=data;
              thisnote.update();
            },
            error: function(a,b,c){
              alert("Cannot update content: "+a+b+c);
            }
          });
          $(this).dialog("destroy").remove(); // Don't edit lighty :)
        }
      }
    });
  });

  // articleTD
  $(articleTD).addClass("noteArticleTD").css({"backgroundColor": this.color}).attr("colspan",3).append(article);
  // article row
  $(articleRow).addClass("noteArticleRow").append(articleTD);
 	

  // table
  $(noteTable).addClass("noteTable").append(titleRow).append(buttonRow).append(articleRow); // changed order, JP 19.12.2008 :). Change back plz.
  $(this.div).append(noteTable);

  $(buttonRow).hide();

  $("#vport").append(this.div);
}

