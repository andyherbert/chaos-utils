/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Wizard = (function () {
  var wizards = [];
  
  function dice(divisor) {
    return Math.floor(Math.round(Math.random() * 9) / ((divisor === undefined) ? 1 : divisor));
  }
  
  function generate_spells(number_of_spells) {
    var i, spells = [Storage.spell(0)];
    for (i = 0; i < number_of_spells; i += 1) {
      spells[spells.length] = Storage.spell(Math.floor(Math.random() * (Storage.number_of_spells() - 4)) + 1);
    }
    return spells;
  }
  
  function create(name, level, character, ink) {
    var spellbook = generate_spells(Math.min(20, 11 + dice(2) + level)), sprite = Storage.wizard(character, ink, Board.get_scale());
    return {
      'combat': 1 + dice(2) + Math.floor(level / 2),
      'ranged_combat': 0,
      'range': 0,
      'defence': 1 + dice(2) + Math.floor(level / 2),
      'movement_allowance': 1,
      'manoeuvre_rating': 3 + dice(2) + Math.floor(level / 4),
      'magic_resistance': 6 + dice(4),
      'spells': (spellbook.length - 1),
      'ability': (dice() >= 5 - level / 2) ? Math.floor(level / 4) : 0,
      'knife': false,
      'sword': false,
      'armour': false,
      'shield': false,
      'flying': false,
      'shadow_form': false,
      'spellbook': spellbook,
      'name': name,
      'character': character,
      'level': level,
      'anim_timing': Storage.wizard_timing(),
      'anim': [sprite, sprite, sprite, sprite],
      'flash': Storage.flash_wizard(character, Board.get_scale()),
      'black': Storage.wizard(character, RGB.black, Board.get_scale()),
      'ink': ink,
      'id': wizards.length,
      'wizard': true
    };
  }
  
  function reposition_wizards() {
    var xy, i;
    if (wizards.length > 2) {
      xy = Storage.initial_positions(wizards.length - 1);
      for (i = 0; i < wizards.length - 1; i += 1) {
        World.remove_wizard(xy[i].x, xy[i].y);
      }
    }
    xy = Storage.initial_positions(wizards.length);
    for (i = 0; i < wizards.length; i += 1) {
      World.add_wizard(wizards[i], xy[i].x, xy[i].y);
    }
  }
  
  function update_wizard(index, name) {
    var ink, scale = Board.get_scale();
    wizards[index].anim = Storage.weapon(name, wizards[index].ink, scale);
    for (ink = 0; ink < 7; ink += 1) {
      wizards[index].flash[ink] = Storage.weapon(name, 15 - ink, scale);
    }
    wizards[index].black = Storage.weapon(name, RGB.black, scale);
    delete (wizards[index].stats_canvas);
    Board.update_cell(wizards[index].x, wizards[index].y, true);
  }
  
  return {
    'create': function (name, level, character, ink) {
      wizards[wizards.length] = create(name, level, character, ink);
      reposition_wizards();
    },
    
    'equip_knife': function (index) {
      wizards[index].knife = true;
      wizards[index].sword = false;
      update_wizard(index, 'magic_knife');
    },
    
    'equip_sword': function (index) {
      wizards[index].knife = false;
      wizards[index].sword = true;
      update_wizard(index, 'magic_sword');
    },
    
    'equip_shield': function (index) {
      wizards[index].armour = false;
      wizards[index].shield = true;
      update_wizard(index, 'magic_shield');
    },
    
    'equip_armour': function (index) {
      wizards[index].armour = true;
      wizards[index].shield = false;
      update_wizard(index, 'magic_armour');
    },
    
    'equip_wings': function (index) {
      wizards[index].flying = true;
      update_wizard(index, 'magic_wings');
    },
    
    'shadow_form': function (index) {
      wizards[index].shadow_form = true;
      Board.update_cell(wizards[index].x, wizards[index].y, true);
    },
    
    'get_wizard': function (index) {
      return wizards[index];
    }
  };
}());