class Note < ActiveRecord::Base

  belongs_to :article
  belongs_to :graph
  validates_presence_of :graph
  
  has_many :edges_to, :foreign_key => "source_id", :class_name => "Edge"
  has_many :edges_from, :foreign_key => "target_id", :class_name => "Edge"
  

  validates_presence_of :name
  # No checking of sane x/y values, cause after viewport integration these
  # virtual coordinates might even be negative.
  validates_numericality_of :x, :only_integer => true
  validates_numericality_of :y, :only_integer => true
  validates_numericality_of :width, :greater_than_or_equal_to => 20, :less_than => 9999, :only_integer => true
  validates_numericality_of :height, :greater_than_or_equal_to => 20, :less_than => 9999, :only_integer => true
  # W3C HTML & CSS standards only accept 16 color names
  #validates_format_of :color, :with => /\A(#(\d|a|b|c|d|e|f){6,6})|(aqua)|(black)|(blue)|(fuchsia)|(gray)|(green)|(lime)|(maroon)|(navy)|(olive)|(purple)|(red)|(silver)|(teal)|(white)|(yellow)\Z/i

  def validate
    validate_color('color')
    validate_text('name')
  end
                                                     
end
