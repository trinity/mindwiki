class NotesController < ApplicationController
  # GET /notes/1
  # GET /notes/1.xml
  def show
    @note = Note.find(params[:id])
    render :xml => @note.to_xml(:include => [:article, :edges_to, :edges_from])
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

    if @note.save
      render :xml => @note.to_xml(:only => [:id]), :status => :created      
    else
      render :xml => @note.errors, :status => :unprocessable_entity
    end
  end

  # PUT /notes/1
  # PUT /notes/1.xml
  def update
    @note = Note.find(params[:id])

    respond_to do |format|
      if @note.update_attributes(params[:note])
        #flash[:notice] = 'Note was successfully updated.'
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
    @note = Note.find(params[:id])
    
    @note.edges_to.each do |e|
      e.destroy
    end
    @note.edges_from.each do |e|
      e.destroy
    end
    
    @note.destroy

    head :ok
  end
  
  # Updates note content and return a RedCloth rendering for javascript usage.
  def update_content
    @note = Note.find(params[:id])
    if @note.article.update_attribute(:content, params[:newContent])
      render :text => RedCloth.new(white_list(@note.article.content),[:filter_styles]).to_html(:textile, :youtube)
    else
      render :text => "<p>Content update error.</p>"
    end
  end
  
  # TODO: The following update functions should probably just be replaced by the default "update" a few methods above

  def update_position
    @note = Note.find(params[:id])
    if @note.update_attributes(:x => params[:x], :y => params[:y])
      head :ok
    else
      render :xml => @note.errors, :status => :unprocessable_entity
    end
  end
  
  def update_size
    @note = Note.find(params[:id])
    if @note.update_attributes(:width => params[:width], :height => params[:height])
      head :ok
    else
      render :xml => @note.errors, :status => :unprocessable_entity
    end
  end

  def update_color
    @note = Note.find(params[:id])
    if @note.update_attributes(:color => params[:newColor])
      head :ok
    else
      render :xml => @note.errors, :status => :unprocessable_entity
    end
  end
  
  def update_name
    @note = Note.find(params[:id])
    if @note.update_attributes(:name => params[:newName])
      head :ok
    else
      render :xml => @note.errors, :status => :unprocessable_entity
    end
  end
end
