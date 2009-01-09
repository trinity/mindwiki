require 'test_helper'

class ArticleTest < ActiveSupport::TestCase
  fixtures :articles, :notes

  test "Creation" do
    assert_difference "Article.count" do
      art = Article.new({:content => "Hello!", :content_type => 1})
      assert art.save
    end
  end
  
  test "Content validation" do
    art = Article.find(articles(:ruby_art).id)

    # These loops might be a bit annoying when debugging, because the line number isn't
    # the failing input's line number. Maybe just copy-paste in other tests.
    
    # Should be valid content
    [
      'h1. RedCloth header',
      'Basic text',
      '<p>Paragraph</p>',
      '<ul><li>Unordered List Item 1</li></ul>',
      ''
    ].each do |v|
      assert art.update_attributes(:content => v)
    end

    # Should be invalid    
    [
      # There should be more invalid stuff. See white_list test-suite and maybe copy-paste here :)
      '<script>alert("Annoying. Potentially dangerous.");</script>'
    ].each do |inv|
      assert_equal false, art.update_attributes(:content => inv)
    end
  end

  test "Content type validation" do
    art = Article.find(articles(:ruby_art).id)
    
    # Should do
    [
      1,
      10,
      9999,
      -100,
    ].each do |v|
      assert art.update_attributes(:content_type => v)
    end
    
    # Should bounce
    [
      nil,
      '',
      'blah',
      4.5
    ].each do |inv|
      assert_equal false, art.update_attributes(:content_type => inv)
    end
  end
  
end
