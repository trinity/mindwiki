class Note < ActiveRecord::Base
  belongs_to :article
  has_and_belongs_to_many :graphs
  
  has_many :edges_to, :foreign_key => "source_id", :class_name => "Edge"
  has_many :edges_from, :foreign_key => "target_id", :class_name => "Edge"
                                                     
end
