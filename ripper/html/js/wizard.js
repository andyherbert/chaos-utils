/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global World: true */
var Wizard = (function () {
  var wizards = [];
  
  function dice(divisor) {
    return Math.round(Math.round(Math.random() * 9) / ((divisor === undefined) ? 1 : divisor));
  }
  
  function generate_spells(number_of_spells) {
    var i, spells = [Storage.spell(0)];
    for (i = 0; i < number_of_spells; i += 1) {
      spells[spells.length] = Storage.spell(Math.round(Math.random() * (Storage.number_of_spells() - 3)));
    }
    return spells;
  }
  
  function create(name, level, character, ink) {
    var spellbook = generate_spells(Math.min(20, 11 + dice(2) + level));
    return {
      'combat': 1 + dice(2) + Math.round(level / 2),
      'ranged_combat': 0,
      'range': 0,
      'defence': 1 + dice(2) + Math.round(level / 2),
      'movement_allowance': 1,
      'manoeuvre_rating': 3 + dice(2) + Math.round(level / 4),
      'magic_resistance': 6 + dice(4),
      'spells': (spellbook.length - 1),
      'ability': (dice() >= 5 - level / 2) ? Math.round(level / 4) : 0,
      'knife': false,
      'sword': false,
      'armour': false,
      'shield': false,
      'flying': false,
      'shadow': false,
      'spellbook': spellbook,
      'name': name,
      'level': level,
      'anim_timing': Storage.wizard_timing(),
      'anim': [Storage.wizard(character, ink), Storage.wizard(character, ink), Storage.wizard(character, ink), Storage.wizard(character, ink)],
      'id': wizards.length
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
      World.add_wizard(xy[i].x, xy[i].y, wizards[i]);
    }
  }
  
  return {
    'create': function (name, level, character, ink) {
      wizards[wizards.length] = create(name, level, character, ink);
      reposition_wizards();
    }
  };
}());