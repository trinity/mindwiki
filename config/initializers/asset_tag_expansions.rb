# Javascript-files required by the MindWiki application (not all of the site, just the application)
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mindwiki_graph => ["mindwiki_graph", "mindwiki_note",
 "jquery-1.2.6.min", "jquery.livequery", "ui/ui.core", "ui/ui.draggable", "ui/ui.selectable", "ui/ui.resizable", "ui/ui.dialog", "raphael"]
 
# Stylesheet
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mindwiki_graph => ["mindwiki_graph"]
