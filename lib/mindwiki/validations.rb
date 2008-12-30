# Custom validations for Mindwiki
module Mindwiki::Validations

  def validate_color(*attributes)
    error_message = 'Only six digit hexes allowed, e.g. #123456, #abba10.'
    attributes.each do |attribute|
      self.errors.add(attribute, error_message) unless valid_color?(self.send(attribute))
    end
  end
  
  def valid_color?(color)
    # W3C HTML & CSS standards only accept 16 color names
    return (color =~ /\A(#(\d|a|b|c|d|e|f){6,6})|(aqua)|(black)|(blue)|(fuchsia)|(gray)|(green)|(lime)|(maroon)|(navy)|(olive)|(purple)|(red)|(silver)|(teal)|(white)|(yellow)\Z/i)
  end
  
end

class ActiveRecord::Base
  include Mindwiki::Validations
end
