require 'RedCloth'

# Youtube-tags, as in: [[youtube|nr0X46bgFY4]]
module RedClothYoutubeExtension
  def youtube(text)
    # Do youtube-video-codes only have [a-zA-Z0-9] and "-" "_"?
    text.gsub!(/\[\[(y|Y)(o|O)(u|U)(t|T)(u|U)(b|B)(e|E)\|([a-zA-Z0-9]|-|_)+\]\]/) do |tag|    
      video_code = "oEkJvvGEtB4" # default at Matsumoto speech :)
      video_code = tag.gsub(/\[|\]|((y|Y)(o|O)(u|U)(t|T)(u|U)(b|B)(e|E))\|/,"")
      # The parameters may be quite wrong for many youtube-videos..
      # Maybe add additional size-attributes to the custom tag.
      "<object width=\"425\" height=\"350\"><param name=\"movie\" value=\"http://www.youtube.com/v/#{video_code}&hl=en&fs=1\"></param><param name=\"allowFullScreen\" value=\"true\"></param><param name=\"allowscriptaccess\" value=\"always\"></param><embed src=\"http://www.youtube.com/v/#{video_code}&hl=en&fs=1\" type=\"application/x-shockwave-flash\" allowscriptaccess=\"always\" allowfullscreen=\"true\" width=\"425\" height=\"344\"></embed></object>"
    end
  end
end
RedCloth.send(:include, RedClothYoutubeExtension)

