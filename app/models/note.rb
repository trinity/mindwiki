class Note < ActiveRecord::Base

  belongs_to :article
  belongs_to :graph
  validates_presence_of :graph
  
  has_many :edges_to, :foreign_key => "source_id", :class_name => "Edge"
  has_many :edges_from, :foreign_key => "target_id", :class_name => "Edge"
  

  validates_presence_of :name
  # No checking of "traditionally sane" x/y values, cause after viewport integration these
  # virtual coordinates might very well be negative.
  validates_numericality_of :x, :only_integer => true
  validates_numericality_of :y, :only_integer => true
  validates_numericality_of :width, :greater_than_or_equal_to => 20, :less_than => 9999, :only_integer => true
  validates_numericality_of :height, :greater_than_or_equal_to => 20, :less_than => 9999, :only_integer => true

  def validate
    validate_color('color')
    validate_text('name')
  end
                                                     
end
