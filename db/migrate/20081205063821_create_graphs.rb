class CreateGraphs < ActiveRecord::Migration
  def self.up
    create_table :graphs do |t|
      t.string :name

      t.timestamps
    end
  end

  def self.down
    drop_table :graphs
  end
end
