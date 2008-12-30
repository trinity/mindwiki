require 'test_helper'

class GraphTest < ActiveSupport::TestCase
  fixtures :graphs, :users

  test "Creation" do
    assert_difference "Graph.count" do
      graph = Graph.new({:name => ""})
      
      # name can not be blank
      assert_equal false, graph.save
      graph.name = "New Graph!"
      
      # user is needed
      assert_equal false, graph.save
      graph.user = User.find(users(:mwiki).id)
      
      # color is needed, too
      assert_equal false, graph.save
      graph.color = "#abba10"
      
      # no more requirements
      assert graph.save
    end
  end

  # Color acceptance (copy-pasted from note_test.rb)
  test "Color changing test" do
    note = Graph.find(graphs(:ruby_graph).id)
        
    # Normal six-figure hexes should work fine, three-figures shouldn't
    assert note.update_attributes(:color => "#b1b1b1")
    assert note.update_attributes(:color => "#aBcDeF")
    assert_equal false, note.update_attributes(:color => "#ccc")
    assert_equal false, note.update_attributes(:color => "b1b1b1")
                            
    # 16 W3C standard colors should work, e.g. yellow works, pink doesn't
    assert note.update_attributes(:color => "yellow")
    assert note.update_attributes(:color => "yElLoW")
    assert_equal false, note.update_attributes(:color => "pink")
  end
                                               

end
