class GraphsController < ApplicationController
  # GET /graphs
  # GET /graphs.xml
  def index
    @graphs = Graph.find(:all)

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
        flash[:notice] = 'Graph was successfully created.'
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
        flash[:notice] = 'Graph was successfully updated.'
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
    @graph = Graph.find(params[:id])
    @graph.destroy

    respond_to do |format|
      format.html { redirect_to(graphs_url) }
      format.xml  { head :ok }
    end
  end
  
  def sync_from_db
    @graph = Graph.find(params[:id])
    @graphnotes = @graph.notes;
  end

  # Renders note IDs in xml
  # Maybe use standard respond_to -style?
  def get_note_ids
    sync_from_db()
    xml = REXML::Document.new
    xml.add_element("notes")
    @graphnotes.each do |n|
      tmp = REXML::Element.new("note")
      ["id"].each do |s|
        tmp.add_element(s)
      end
      # Again unflexible code
      tmp.elements["id"].text = n.id
      xml.root.elements << tmp
    end
    render :xml => xml
  end
  
  # Returns the color for the graph
  def get_color
    if @graph = Graph.find(params[:id])
      render :text => @graph.color
    else
      render :text => "#dddddd"
    end
  end


  # Render all graph notes in xml
  # DEPRECATED: ONLY USED WITH ALL-IN-ONE NOTE-LOADING
  def render_notes_xml
    sync_from_db()
   
    # Works nicely, except excludes article content
    #xmlnotes = @graphnotes.to_xml
    #render :xml => xmlnotes

    # Includes article content, but adds weird extra tags(?!)
    #@xml = Builder::XmlMarkup.new
    #@xml.instruct! :xml
    #@xml.notes{
    #  for note in @graphnotes
    #    @xml.note do
    #      @xml.id(note.id)
    #      @xml.name(note.name)
    #      @xml.content((RedCloth.new note.article.content).to_html)
    #      #etc...
    #    end
    #  end
    #}
    #render :xml => @xml

    # ... So we use REXML :(
    xml = REXML::Document.new
    xml.add_element("notes")
    @graphnotes.each do |n|
      tmp = REXML::Element.new("note")
      ["id","name","x","y","width","height","color","content","editableContent"].each do |s|
        tmp.add_element(s)
      end
      # Again unflexible code
      tmp.elements["id"].text = n.id
      tmp.elements["name"].text = n.name
      tmp.elements["x"].text = n.x
      tmp.elements["y"].text = n.y
      tmp.elements["width"].text = n.width
      tmp.elements["height"].text = n.height
      tmp.elements["color"].text = n.color
      tmp.elements["content"].text = RedCloth.new(white_list(n.article.content),[:filter_styles]).to_html(:textile, :youtube)
      tmp.elements["editableContent"].text = n.article.content
      xml.root.elements << tmp
    end
    render :xml => xml

  end
  
end
