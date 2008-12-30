// Loads the color picker for the new and edit forms of graphs.

$(document).ready(function() {

  // Default color for empty pickers (DOES NOT WORK PROPERLY WITHOUT)
  if($("#graph_color").val() == "")
    $("#graph_color").val("#dddddd"); 

  $("#picker").farbtastic("#graph_color"); // launch picker

});
