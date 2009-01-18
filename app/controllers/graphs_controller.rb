class GraphsController < ApplicationController
  # GET /graphs
  # GET /graphs.xml
  def index
    @graphs = Graph.find(:all, :readonly => true)

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @graphs }
    end
  end

  # GET /graphs/1
  # GET /graphs/1.xml
  def show
    @graph = Graph.find(params[:id])
    @graphnotes = @graph.notes;

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @graph }
    end
  end

  # GET /graphs/new
  # GET /graphs/new.xml
  def new
    @graph = Graph.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @graph }
    end
  end

  # GET /graphs/1/edit
  def edit
    @graph = Graph.find(params[:id])
  end

  # POST /graphs
  # POST /graphs.xml
  def create
    @graph = Graph.new(params[:graph])
    @graph.user = current_user

    respond_to do |format|
      if @graph.save
        format.html { redirect_to(@graph) }
        format.xml  { render :xml => @graph, :status => :created, :location => @graph }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @graph.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /graphs/1
  # PUT /graphs/1.xml
  def update
    @graph = Graph.find(params[:id])

    respond_to do |format|
      if @graph.update_attributes(params[:graph])
        format.html { redirect_to(@graph) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @graph.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /graphs/1
  # DELETE /graphs/1.xml
  def destroy
    @graph = Graph.find(params[:id], :select => "id")
    @graph.destroy

    respond_to do |format|
      format.html { redirect_to(graphs_url) }
      format.xml  { head :ok }
    end
  end
  
  # Renders note IDs
  def get_note_ids
    @graph = Graph.find(params[:id],:select => "id")
    @graphnotes = @graph.notes; # FIXME: Fetches more than ids from the db

    respond_to do |format|
      format.xml { render :xml => @graphnotes.to_xml(:only => [:id]) }
    end
  end
  
  # Returns the color for the graph
  def get_color
    respond_to do |format|
      if params[:id].nil?
        format.text { render :text => "#dddddd" }
      end
      if @graph = Graph.find(params[:id], :select => "color", :readonly => true)
        format.text { render :text => @graph.color }
      else
        format.text { render :text => "#dddddd" }
      end
    end
  end  

end #EOF
