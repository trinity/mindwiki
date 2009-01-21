class Graph < ActiveRecord::Base
  has_many :notes, :dependent => :destroy
  belongs_to :user
  validates_presence_of :user
  
  validates_presence_of :name

  def validate
    validate_text('name')
    validate_color('color')
  end

  # Returns notes within a certain viewport. Viewport is a rectangular area, through which the
  # whole big graph can be looked at.
  #
  # (x,y) are the coordinates of the upper left corner
  # Important to notice:
  # This method also returns notes which are directly connected to notes within the viewport,
  # So we can draw all the edges within the viewport correctly.
  def notes_within(ivp_x, ivp_y, ivp_width, ivp_height)
    vp_x = ivp_x.to_i
    vp_y = ivp_y.to_i
    vp_width = ivp_width.to_i
    vp_height = ivp_height.to_i

    # Get appropriate notes:
    vp_notes_strict = self.notes.find(:all, :readonly => true, :conditions => 
      ["(x+width) >= ? AND x <= ? AND (y+height) >= ? AND y <= ?",
                     vp_x,      vp_x+vp_width,      vp_y,      vp_y+vp_height
      ]
    )

    # Add notes with direct links to viewport notes
    vp_notes = vp_notes_strict.clone
    vp_notes_strict.each do |n|

      # See if the note has any unadded sources
      n.edges_to.each do |e|
        # .. by checking the original
        testnote = Note.find(e.source_note.id)
        if !vp_notes_strict.include?(testnote)
          # Add the source note
          vp_notes.push(testnote)
        end
      end

      # Same for outgoing edges
      n.edges_from.each do |e|
        testnote = Note.find(e.target_note.id)
        if !vp_notes_strict.include?(testnote)
          vp_notes.push(testnote)
        end
      end
    end



    return vp_notes
  end
  
end
