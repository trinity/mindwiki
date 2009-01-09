class Edge < ActiveRecord::Base
  belongs_to :source_note, :class_name => "Note", :foreign_key => :source_id
  belongs_to :target_note, :class_name => "Note", :foreign_key => :target_id

  validates_presence_of :source_note
  validates_presence_of :target_note

  def validate
    validate_color('color')
    validate_text('name')
    
    # Validate that the notes are in the same graph
    self.errors.add('target_note', ' needs to be in the same graph as the source note.') unless notes_in_the_same_graph?
  end

  # Are notes in the same graph?
  def notes_in_the_same_graph?
    if self.source_note.nil? 
      return false
    end
    if self.target_note.nil? 
      return false
    end
    return self.source_note.graph == self.target_note.graph
  end

end
