// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

// Thanks to Simon Willison: http://simonwillison.net/2004/May/26/addLoadEvent/
function addLoadEvent(func) {        
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();  
      }
      func();
    }
  }  
}  