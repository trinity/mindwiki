# In dependency order (?)

# Javascript-files required by the MindWiki application (not all of the site, just the application)
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mindwiki_graph => [
 "jquery-1.2.6.min", "jquery.livequery", "ui/ui.core", "ui/ui.draggable", "ui/ui.selectable", "ui/ui.resizable", "ui/ui.dialog", "raphael", "colorpicker",
 "markitup/jquery.markitup", "markitup/sets/textile/set", "jquery.scrollTo", "mindwiki/misc", "mindwiki/context_help", "mindwiki/note", "mindwiki/edge", 
 "mindwiki/graph"]

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :graph_color_picker => ["jquery-1.2.6.min", "colorpicker", "graph_color_init"]
 
# Stylesheet
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mindwiki_graph => ["/javascripts/markitup/skins/markitup/style",
 "/javascripts/markitup/sets/textile/style", "mindwiki_graph", "colorpicker"]

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :graph_color_picker => ["colorpicker"]
