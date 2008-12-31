class NotesController < ApplicationController
  # GET /notes
  # GET /notes.xml
  def index
    @notes = Note.find(:all)

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @notes }
    end
  end

  # GET /notes/1
  # GET /notes/1.xml
  def show
    @note = Note.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      # format.xml  { render :xml => @note } #default
      format.xml {
        xml = REXML::Document.new
        xml.add_element("notes")
        tmp = REXML::Element.new("note")
        ["id","name","x","y","width","height","color","content","editableContent"].each do |s|
          tmp.add_element(s)
        end
        # Again unflexible code
        tmp.elements["id"].text = @note.id
        tmp.elements["name"].text = @note.name
        tmp.elements["x"].text = @note.x
        tmp.elements["y"].text = @note.y
        tmp.elements["width"].text = @note.width
        tmp.elements["height"].text = @note.height
        tmp.elements["color"].text = @note.color 
        tmp.elements["content"].text = RedCloth.new(white_list(@note.article.content),[:filter_styles]).to_html(:textile, :youtube)
        tmp.elements["editableContent"].text = @note.article.content
        xml.root.elements << tmp
  
        render :xml => xml

      }
    end
  end

  # GET /notes/new
  # GET /notes/new.xml
  def new
    @note = Note.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @note }
    end
  end

  # GET /notes/1/edit
  def edit
    @note = Note.find(params[:id])
  end


  # POST /notes
  # POST /notes.xml
  def create
    # This makes all new notes have the same article...
    #@article = Article.find_or_create_by_content(params[:article_content])
    @article = Article.create(:content => params[:article_content])
    @article.content_type = 1 # Lame, yeah.
    @graph = Graph.find(params[:graph_id])
    @note = Note.new(params[:note])
    @note.article = @article
    @note.graph = @graph

    @note.save
#    redirect_to(@graph)
    respond_to do |format|
      if @note.save
        flash[:notice] = 'Note was successfully created.'
        format.html { redirect_to(@note) }
        format.xml  { render :xml => @note, :status => :created, :location => @note }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @note.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /notes/1
  # PUT /notes/1.xml
  def update
    @note = Note.find(params[:id])

    respond_to do |format|
      if @note.update_attributes(params[:note])
        flash[:notice] = 'Note was successfully updated.'
        format.html { redirect_to(@note) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @note.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /notes/1
  # DELETE /notes/1.xml
  def destroy
    @graph = Graph.find(params[:graph_id])

    @note = Note.find(params[:id])
    
    @note.edges_to.each do |e|
      e.destroy
    end
    @note.edges_from.each do |e|
      e.destroy
    end
    
    @note.destroy

#    redirect_to(@graph)
    respond_to do |format|
      format.html { redirect_to(notes_url) }
      format.xml  { head :ok }
    end
  end
  
  # Updates note content and return a RedCloth rendering for javascript usage.
  def update_content
    @note = Note.find(params[:id])
    if @note.article.update_attribute(:content, params[:newContent])
      flash[:notice] = @note.name+' content successfully updated.'
      render :text => RedCloth.new(white_list(@note.article.content),[:filter_styles]).to_html(:textile, :youtube)
    else
      flash[:notice] = @note.name+' content update error.'
      render :text => "<p>Content update error.</p>"
    end
  end
  
  # Updates note position
  def update_position
    @note = Note.find(params[:id])
    if @note.update_attributes(:x => params[:x], :y => params[:y])
      flash[:notice] = @note.name+' coordinates successfully updated.'
      render :text => "OK"
    else
      flash[:notice] = @note.name+' coordinates updating error.'
      render :text => "ERROR"
    end
  end
  
  # Updates note size
  def update_size
    @note = Note.find(params[:id])
    if @note.update_attributes(:width => params[:width], :height => params[:height])
      flash[:notice] = @note.name+' size successfully updated.'
      render :text => "OK"
    else
      flash[:notice] = @note.name+' size updating error.'
      render :text => "ERROR"
    end
  end

  def update_color
    @note = Note.find(params[:id])
    if @note.update_attributes(:color => params[:newColor])
      flash[:notice] = @note.name+' color successfully updated.'
      render :text => "OK"
    else
      flash[:notice] = @note.name+' color updating error.'
      render :text => "ERROR"
    end
  end

end