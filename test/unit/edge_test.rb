require 'test_helper'

class EdgeTest < ActiveSupport::TestCase
  fixtures :edges, :notes, :graphs

  test "Creation" do
    assert_difference "Edge.count" do
      edge = Edge.new({:name => "Test edge", :color => "#000000"})
      
      # Lacking target and source notes
      assert_equal false, edge.save
      # ..fixing
      edge.source_note = Note.find(notes(:ruby_note).id)
      edge.target_note = Note.find(notes(:redcloth_example_note).id)
      
      # Target and source in different graphs, shouldn't work
      assert_equal false, edge.save
      # ..fixing
      edge.target_note = Note.find(notes(:matsumoto_yt_note).id)
      
      assert edge.save
    end
  end
  
  test "Name change test" do
    e = Edge.find(edges(:ruby_oo_edge).id)
    
    assert e.update_attributes(:name => "New name")
    
    assert_equal false, e.update_attributes(:name => '<script>alert("asdf");</script>Muhuhuhuu')
  end
  
  test "Target changing test" do
    e = Edge.find(edges(:ruby_oo_edge).id)
    e.target_note = Note.find(notes(:matsumoto_yt_note).id)
    assert e.save
    
    e.target_note = Note.find(notes(:redcloth_example_note).id)
    assert_equal false, e.save

    e.target_note = nil
    assert_equal false, e.save
  end

  test "Source changing test" do
    e = Edge.find(edges(:ruby_oo_edge).id)
    e.source_note = Note.find(notes(:matsumoto_yt_note).id)
    assert e.save
    
    e.source_note = Note.find(notes(:redcloth_example_note).id)
    assert_equal false, e.save

    e.source_note = nil
    assert_equal false, e.save
  end

end
