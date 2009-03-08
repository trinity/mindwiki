class SyncLogsController < ApplicationController

  def time_now
    t = Time.now
    return t.gmtime # Rails timestamps are in GMT
  end

  def check_for_updates
    respond_to do |format|
      if params[:id].nil? || params[:timestamp].nil?
        format.js { render :json => { :err => 1 }.to_json, :status => :unprocessable_entity }
      else
        @now = time_now()
        if !params[:timestamp].empty?
          @updates = SyncLog.find(:all, :order => "created_at ASC", :conditions => [ "created_at >= ? AND created_at < ? AND graph_id = ?", params[:timestamp], @now, params[:id]])
          @graph = Graph.find(params[:id])
          if !@graph.nil? and @updates.count > 0
            @exts = @graph.get_extents
          end
        else
          @exts = ""
          @updates = ""
          # With an OK timestamp but no updates, the response is "exts: null and updates: []"
        end
        format.js { 
          # Give the client the timestamp we used as an upper bound, and also the results
          @updates_and_timestamp = "{\"time\": "+@now.to_json+", \"extents\": "+@exts.to_json+", \"updates\": "+@updates.to_json+"}"
          render :json => @updates_and_timestamp 
        }
      end
    end
  end

end
