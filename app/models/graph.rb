class Graph < ActiveRecord::Base
  has_many :notes
  belongs_to :user
  validates_presence_of :user
  
  validates_presence_of :name

  def validate
    validate_text('name')
    validate_color('color')
  end
  
end
