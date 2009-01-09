class Article < ActiveRecord::Base
  has_many :notes
  
  validates_numericality_of :content_type, :only_integer => true
  
  def validate
    validate_text('content')
  end
end
