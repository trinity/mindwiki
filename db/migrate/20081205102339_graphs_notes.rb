class GraphsNotes < ActiveRecord::Migration
  def self.up
    create_table :graphs_notes, :id => false do |t|
      t.references :graph
      t.references :note
    end
  end

  def self.down
    drop_table :graphs_notes
  end
end
