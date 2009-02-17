class SyncLog < ActiveRecord::Base

  validates_presence_of :graph_id

  class << self # Class methods


    # GRAPH
    
    def graph_destroy(graph_id, user)
      params = {
        :act => "g_d"
      }
      # FIXME: user is never properly initialized
      if !user.nil?
        if !user.login.nil?
          params[:user] = user.login
        end
      end
      @l = SyncLog.new({:graph_id => graph_id, :params => params.to_json})
      @l.save
    end

    def graph_update(graph)
      @l = SyncLog.new({:graph_id => graph.id, :params => graph.to_json(:only => [:name, :color])})
      @l.save
    end
    
    
    # NOTE
    
    
    # EDGE
    

  end # End "class << self"
end
