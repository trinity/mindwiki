class Edge < ActiveRecord::Base
  belongs_to :source_note, :class_name => "Note", :foreign_key => :source_id
  belongs_to :target_note, :class_name => "Note", :foreign_key => :target_id
end
