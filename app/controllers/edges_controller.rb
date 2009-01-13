class EdgesController < ApplicationController
  # GET /edges/1
  # GET /edges/1.xml
  def show
    @edge = Edge.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @edge }
    end
  end

  # POST /edges
  # POST /edges.xml
  def create
    @edge = Edge.new(params[:edge])

    respond_to do |format|
      if @edge.save
        format.xml  { render :xml => @edge, :status => :created, :location => @edge }
      else
        format.xml  { render :xml => @edge.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /edges/1
  # PUT /edges/1.xml
  def update
    @edge = Edge.find(params[:id])

    respond_to do |format|
      if @edge.update_attributes(params[:edge])
        flash[:notice] = 'Edge was successfully updated.'
        format.html { redirect_to(@edge) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @edge.errors, :status => :unprocessable_entity }
      end
    end
  end
end
