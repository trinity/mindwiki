/*
 * Context help
 */

function ContextHelp() {
  this.priority = 0;
}


ContextHelp.prototype.set = function(text) {
  this.setPriorityText(text, 0);
}

/* In some cases, such as when we are creating new edges,
 * we want to discard less important help texts. Such texts should be set with
 * higher priority and resetPriority called afterwards to restore showing old less
 * important ones.
 */
ContextHelp.prototype.setPriorityText = function(text, p) {
  if (p < this.priority)
    return;
  
  this.priority = p;
  $("#context_help").empty().append(text);
}

ContextHelp.prototype.resetPriority = function(p) {
  this.priority = p;
}

