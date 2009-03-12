class Article < ActiveRecord::Base
  has_many :notes, :dependent => :destroy
  
  default_value_for :content_type, 1
  validates_numericality_of :content_type, :only_integer => true
  
  def validate
    validate_text('content')
  end
  
  # Custom xml serialization (to include RedCloth rendering on content-type 1)
  def to_xml(options = {})
    options[:indent] ||= 2
    xml = options[:builder] ||= Builder::XmlMarkup.new(:indent => options[:indent])
    xml.instruct! unless options[:skip_instruct]
    xml.article do
      # TODO: Include datatypes
      xml.tag!(:id, id.to_s) 
      xml.tag!(:content, content)
      if content_type == 1
        xml.tag!(:content_rendered, RedCloth.new(white_list(content),[:filter_styles]).to_html(:textile, :youtube, :note))
      end
      xml.tag!(:content_type, content_type.to_s)
      xml.tag!(:updated_at, updated_at.to_s)
      xml.tag!(:created_at, created_at.to_s)
    end
  end
end
