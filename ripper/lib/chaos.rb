class Chaos
  def initialize(filename)
    @memory = Array.new(16384 - 27, 0x00)
    File.open(filename, 'r') do |file|
      while !file.eof? do
        @memory << file.readbyte
      end
    end
  end
  
  def palette
    generate_palette(0xcd) + generate_palette(0xff)
  end
  
  def constants
    {
      :creatures_per_cast => @memory[0x9976],
      :trees_per_cast => @memory[0x9ade],
      :castles_per_cast => @memory[0x9aeb],
      :walls_per_cast => @memory[0x9b77],
      :decree_per_cast => @memory[0x9dfd],
      :vengeance_per_cast => @memory[0x9dfd],
      :justice_per_cast => @memory[0x9e07],
      :darkpower_per_cast => @memory[0x9e07]
    }
  end
  
  def initial_positions
    output = Array.new
    (0x909f..0x90CF).step(8) do |location|
      locations = Array.new
      ((location - 0x909f) / 8 + 2).times do |num|
        bin = @memory[location + num].chr.unpack('B8').first
        locations << [bin[4, 4].to_i(2), bin[0, 4].to_i(2)]
      end
      output << locations
    end
    output
  end
  
  def character_set
    lookup = " !\"\#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_£abcdefghijklmnopqrstuvwxyz{|}~©".split(//u)
    output = Hash.new
    (0xd908..0xDC00).step(8) do |location|
      output[lookup[(location - 0xd908) / 8]] = fetch_8x16(location)
    end
    output
  end
  
  def border
    [fetch_16x16(0xbb15), fetch_16x16(0xbb15 + 32)]
  end
  
  def objects
    output = Array.new
    (0xe3e2..0xe42e).step(2) do |location|
      object = lookup_data_table((location - 0xe3de) / 2, address(location))
      output[object[:id]] = object
    end
    output
  end
  
  def cursors
    {
      :spell => fetch_16x16(0x7f27),
      :box => fetch_16x16(0xc33d),
      :wings => fetch_16x16(0xc35d),
      :ranged => fetch_16x16(0xc37d)
    }
  end
  
  def wizards
    output = {
      :timing => @memory[address(0xe430) + 22],
      :characters => [],
      :weapons => {
        :'magic_sword' => [],
        :'magic_knife' => [],
        :'magic_armour' => [],
        :'magic_shield' => [],
        :'magic_wings' => [],
        :'magic_bow' => []
      }
    }
    (0xe430..0xe43e).step(2) do |location|
      output[:characters] << data_table_sprite(address(location) + 23)[:bytes]
    end
    (0x8290..0x8296).step(2) do |location|
      output[:weapons][:'magic_sword'] << fetch_16x16(address(location))
    end
    (0x8298..0x829e).step(2) do |location|
      output[:weapons][:'magic_knife'] << fetch_16x16(address(location))
    end
    (0x82A0..0x82a6).step(2) do |location|
      output[:weapons][:'magic_armour'] << fetch_16x16(address(location))
    end
    (0x82A8..0x82Ae).step(2) do |location|
      output[:weapons][:'magic_shield'] << fetch_16x16(address(location))
    end
    (0x82b0..0x82b6).step(2) do |location|
      output[:weapons][:'magic_wings'] << fetch_16x16(address(location))
    end
    (0x82b8..0x82Be).step(2) do |location|
      output[:weapons][:'magic_bow'] << fetch_16x16(address(location))
    end
    output
  end
  
  def effects
    output = {
      :timing => 1,
      :'exploding_circle' => [],
      :'twirl' => [],
      :'explosion' => [],
      :'dragon_burn' => [],
      :'attack' => []
    }
    (0xbfb7..0xc0b7).step(32) do |location|
      output[:'exploding_circle'] << fetch_16x16(location)
    end
    (0xa1e8..0xa20a).step(2) do |location|
      output[:'twirl'] << fetch_16x16(address(location))
    end
    (0xa345..0xa405).step(32) do |location|
      output[:'explosion'] << fetch_16x16(location)
    end
    (0xc123..0xc223).step(32) do |location|
      output[:'dragon_burn'] << fetch_16x16(location)
    end
    5.times do |num|
      (0xbf37..0xbf97).step(32) do |location|
        output[:'attack'] << fetch_16x16(location)
      end
    end
    output
  end
  
  def messages
    interface, in_game = Array.new, Array.new
    (0x8809..0x8855).step(4) do |location|
      interface << text(address(location), @memory[location + 2])
    end
    (0xcdd3..0xcfc7).step(4) do |location|
      in_game << text(address(location), @memory[location + 2])
    end
    {
      :interface => interface,
      :in_game => in_game
    }
  end
  
  def spells
    type = {
      '39409' => 'disbelieve',
      '39285' => 'creature',
      '39645' => 'shelter',
      '39798' => 'wall',
      '40025' => 'elemental',
      '40416' => 'magic',
      '33796' => 'magic_shield',
      '33642' => 'magic_armour',
      '33692' => 'magic_sword',
      '33744' => 'magic_knife',
      '33898' => 'magic_bow',
      '33848' => 'magic_wings',
      '33968' => 'world_alignment',
      '33984' => 'shadow_form',
      '34039' => 'subversion',
      '34294' => 'raise_dead',
      '34543' => 'turmoil'
    }
    output = Array.new
    lookup = messages[:in_game]
    (0x7d60..0x7f20).step(7) do |location|
      output << {
        :name => lookup[@memory[location]],
        :id => @memory[location],
        :cast_chance => @memory[location + 1],
        :doubled_cast_range => @memory[location + 2],
        :chaos_law_value => @memory[location + 3].chr.unpack('c').first,
        :cast_priority => @memory[location + 4],
        :type => type[address(location + 5).to_s]
      }
    end
    output
  end
  
  def dump
    {
      :palette => palette,
      :objects => objects,
      :wizards => wizards,
      :character_set => character_set,
      :cursors => cursors,
      :messages => messages,
      :spells => spells,
      :constants => constants,
      :initial_positions => initial_positions,
      :border => border
    }
  end
  
  private
  
  def address(location)
    (@memory[location + 1] << 8) + @memory[location]
  end
  
  def generate_palette(factor)
    [[0, 0, 0], [0, 0, 1], [1, 0, 0], [1, 0, 1], [0, 1, 0], [0, 1, 1], [1, 1, 0], [1, 1, 1]].collect do |colour|
      colour.collect { |rgb| (rgb * factor).chr.unpack('H2') }.join
    end
  end
  
  def fetch_16x16(location)
    raw = Array.new
    output = Array.new
    32.times do |num|
      raw << @memory[location + num].chr.unpack('H2').first
    end
    8.times do |num|
      output << raw[num] + raw[num + 8]
    end
    8.times do |num|
      output << raw[num + 16] + raw[num + 24]
    end
    output.join
  end
  
  def fetch_8x16(location)
    raw = Array.new
    output = Array.new
    8.times do |num|
      output << @memory[location + num].chr.unpack('H2').first
    end
    8.times do |num|
      output << @memory[location + 768 + num].chr.unpack('H2').first
    end
    output.join
  end
  
  def data_table_sprite(location)
    bin = @memory[location + 2].chr.unpack('B8').first
    bright, paper, ink = (bin[1, 1].to_i(2) == 1), bin[2, 3].to_i(2), bin[5, 3].to_i(2)
    {
      :bytes => fetch_16x16(address(location)),
      :paper => bright ? paper + 8 : paper,
      :ink => bright ? ink + 8 : ink
    }
  end
  
  def text(location, length)
    output = String.new
    length.times do |num|
      output += @memory[location + num].chr
    end
    output.strip
  end
  
  def lookup_data_table(id, table_address)
    {
      :name => text(table_address, 13),
      :id => id,
      :combat => @memory[table_address + 13],
      :ranged_combat => @memory[table_address + 14],
      :range => @memory[table_address + 15],
      :defence => @memory[table_address + 16],
      :movement_allowance => @memory[table_address + 17],
      :manoeuvre_rating => @memory[table_address + 18],
      :magic_resistance => @memory[table_address + 19],
      :casting_chance => @memory[table_address + 20],
      :chaos_law_value => @memory[table_address + 21].chr.unpack('c').first,
      :anim_timing => @memory[table_address + 22],
      :anim => [
        data_table_sprite(table_address + 23),
        data_table_sprite(table_address + 26),
        data_table_sprite(table_address + 29),
        data_table_sprite(table_address + 32)
      ],
      :corpse => id < 28 ? data_table_sprite(table_address + 35) : nil,
      :mount => id > 15 && id < 22,
      :flying => id > 18 && id < 30,
      :undead => id > 27 && id < 34,
      :transparent => id == 29 || id == 31 || id == 35,
      :subvertable => id < @memory[0x857B],
      :shelter =>  id  > 35 && id < 41
    }
  end
end