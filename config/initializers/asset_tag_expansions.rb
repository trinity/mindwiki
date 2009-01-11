# In dependency order (?)

# Javascript-files required by the MindWiki application (not all of the site, just the application)
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mindwiki_graph => [
 "jquery-1.2.6.min", "jquery.livequery", "ui/ui.core", "ui/ui.draggable", "ui/ui.selectable", "ui/ui.resizable", "ui/ui.dialog", "raphael", "farbtastic",
 "mindwiki_note", "mindwiki_graph", "mindwiki_edge"]

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :graph_color_picker => ["jquery-1.2.6.min", "farbtastic", "graph_color_init"]
 
# Stylesheet
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mindwiki_graph => ["mindwiki_graph", "farbtastic"]

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :graph_color_picker => ["farbtastic"]