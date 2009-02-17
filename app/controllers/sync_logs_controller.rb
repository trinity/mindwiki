class SyncLogsController < ApplicationController

  def time_now
    return Time.now()
  end

  def check_for_updates
    respond_to do |format|
      if params[:id].nil? || params[:timestamp].nil?
        format.js { render :json => { :err => 1 }.to_json, :status => :unprocessable_entity }
      else
        @now = time_now()
        #@updates = SyncLog.find(:all, :conditions => [ "created_at > ? AND created_at <= ? AND graph_id = ?", params[:timestamp], @now, params[:id]])
        @updates = SyncLog.find(:all)
        @updates_and_timestamp = "{\"time\": "+@now.to_json+", \"updates\": "+@updates.to_json+"}"
        format.js { render :json => @updates_and_timestamp }
      end
    end
  end

end
