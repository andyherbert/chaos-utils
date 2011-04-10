/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, ChaosCanvas: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
ChaosCanvas = (function () {
  function get_range(range) {
    range = Math.floor(range / 2);
    if (range > 9) {
      return 20;
    } else {
      return range;
    }
  }
  
  function delete_spell(wizard, spell_index) {
    wizard.spellbook.splice(spell_index, 1);
    if (wizard.id === SpellDisplay.get_wizard_id()) {
      SpellDisplay.rehash();
    }
  }
  
  function attribute_spell(object, func, callback, fast) {
    var wizard, spell;
    wizard = Wizard.get_wizard(object.wizard_index);
    spell = Storage.spell(wizard.spellbook[object.spell_index]);
    Board.cast_text(wizard.name, spell.name, get_range(spell.doubled_cast_range), function () {
      if (object.success) {
        Board.draw_text(Storage.text(Storage.in_game_message(85), RGB.b_white, Board.get_scale()));
      } else {
        Board.draw_text(Storage.text(Storage.in_game_message(84), RGB.b_purple, Board.get_scale()));
      }
      func();
      delete_spell(wizard, object.spell_index);
      setTimeout(function () {
        Board.clear_text();
        callback();
      }, fast ? 0 : 1000);
    }, fast);
  }
  
  function kill(x, y, leave_corpse, callback) {
    var slice = World.get_slice(x, y);
    if (slice.blob) {
      World.remove_blob(x, y);
    } else if (slice.object) {
      if (slice.object.illusion || !leave_corpse) {
        World.remove_object(x, y);
      } else {
        World.kill_object(x, y);
      }
      callback();
    } else if (slice.wizard) {
      Board.wizard_death(x, y, function () {
        World.remove_wizard(x, y);
        callback();
      });
    } else {
      callback();
    }
  }
  
  function start() {
    Board.draw_arena();
  }
  
  return {
    'init': function (board, board_scale, info, info_scale, spell_display, spell_display_scale, callback) {
      Storage.init(function (obj) {
        board.getContext('2d').drawImage(Storage.loading_screen(board_scale), 0, 0);
        setTimeout(function () {
          Board.init(board, board_scale);
          Info.init(info, info_scale);
          SpellDisplay.init(spell_display, spell_display_scale);
          start();
          callback();
        }, 2000);
      }, function (status) {
        alert('Could not obtain resource file: (' + status + ')');
      });
    },
    
    'create_wizard': function (object, callback) {
      Wizard.create(object.name, object.level, object.character, object.ink, object.spellbook);
      callback();
    },
    
    'remove_wizard': function (object, callback) {
      var wizard = Wizard.get_wizard(object.wizard_index);
      World.remove_wizard(wizard.x, wizard.y);
      callback();
    },
    
    'move_wizard': function (object, callback) {
      var wizard = Wizard.get_wizard(object.wizard_index);
      World.move_wizard(wizard.x, wizard.y, object.x, object.y);
      callback();
    },
    
    'use_wizard': function (object, callback) {
      SpellDisplay.use_wizard(object.wizard_index);
      callback();
    },
    
    'creature_cast': function (object, callback, fast) {
      var wizard, spell;
      wizard = Wizard.get_wizard(object.wizard_index);
      spell = Storage.spell(wizard.spellbook[object.spell_index]);
      Board.cast_text(wizard.name, spell.name, spell.doubled_cast_range, function () {
        Board.spell_beam(wizard.x, wizard.y, object.x, object.y, function () {
          Board.twirl_effect(object.x, object.y, function () {
            if (object.success === true) {
              World.add_object(Storage.create_object(spell.id, object.illusion, object.wizard_index, Board.get_scale()), object.x, object.y);
              Board.draw_text(Storage.text(Storage.in_game_message(85), RGB.b_white, Board.get_scale()));
            } else {
              Board.draw_text(Storage.text(Storage.in_game_message(84), RGB.b_purple, Board.get_scale()));
            }
            delete_spell(wizard, object.spell_index);
            setTimeout(function () {
              Board.clear_text();
              callback();
            }, fast ? 0 : 2000);
          });
        });
      }, fast);
    },
    
    'move': function (object, callback, fast) {
      var source, dest;
      source = World.get_slice(object.sx, object.sy);
      dest = World.get_slice(object.dx, object.dy);
      if (source.blob) {
        World.move_blob(object.sx, object.sy, object.dx, object.dy);
      } else {
        if (source.object) {
          World.move_object(object.sx, object.sy, object.dx, object.dy);
          if (World.engaged(object.dx, object.dy)) {
            Board.draw_text(Storage.text(Storage.in_game_message(52), RGB.b_yellow, Board.get_scale()));
          }
        }
        if (source.wizard) {
          World.move_wizard(object.sx, object.sy, object.dx, object.dy);
          if (World.engaged(object.dx, object.dy)) {
            Board.draw_text(Storage.text(Storage.in_game_message(52), RGB.b_yellow, Board.get_scale()));
          }
        }
      }
      Board.clear_text();
      callback();
    },
    
    'attack': function (object, callback, fast) {
      Board.attack_effect(object.dx, object.dy, function () {
        if (object.success) {
          kill(object.dx, object.dy, true, callback);
        }
      });
    },
    
    'ranged_attack': function (object, callback, fast) {
      var source, dest;
      source = World.get_slice(object.sx, object.sy);
      dest = World.get_slice(object.dx, object.dy);
      Board.ranged_attack(source.object.range);
      if (source.object && (source.object.id >= 23) && (source.object.id <= 25)) {
        Board.burn_beam(object.sx, object.sy, object.dx, object.dy, function () {
          Board.blue_border();
          Board.dragon_burn_effect(object.dx, object.dy, function () {
            if (object.success) {
              kill(object.dx, object.dy, true, callback);
            }
          });
        });
      } else {
        Board.line_beam(object.sx, object.sy, object.dx, object.dy, function () {
          Board.blue_border();
          Board.exploding_circle_effect(object.dx, object.dy, function () {
            if (object.success) {
              kill(object.dx, object.dy, true, callback);
            } else {
              callback();
            }
          });
        });
      }
    },
    
    'disbelieve': function (object, callback, fast) {
      var wizard, slice, spell;
      wizard = Wizard.get_wizard(object.wizard_id);
      slice = World.get_slice(object.x, object.y);
      if (slice.object && slice.object.illusion) {
        spell = Storage.spell(0);
        Board.cast_text(wizard.name, spell.name, get_range(spell.doubled_cast_range), function () {
          Board.spell_beam(wizard.x, wizard.y, object.x, object.y, function () {
            Board.twirl_effect(object.x, object.y, function () {
              if (slice.object.illusion) {
                Board.draw_text(Storage.text(Storage.in_game_message(85), RGB.b_white, Board.get_scale()));
                Board.explosion_effect(object.x, object.y, function () {
                  World.remove_object(object.x, object.y);
                  callback();
                });
              } else {
                Board.draw_text(Storage.text(Storage.in_game_message(84), RGB.b_purple, Board.get_scale()));
                setTimeout(function () {
                  Board.clear_text();
                  callback();
                }, fast ? 0 : 1000);
              }
            });
          });
        }, fast);
      } else {
        callback();
      }
    },
    
    'magic_knife': function (object, callback, fast) {
      attribute_spell(object, function () {
        Wizard.equip_knife(Wizard.get_wizard(object.wizard_index).id);
      }, callback, fast);
    },
    
    'magic_sword': function (object, callback, fast) {
      attribute_spell(object, function () {
        Wizard.equip_sword(Wizard.get_wizard(object.wizard_index).id);
      }, callback, fast);
    },
    
    'magic_shield': function (object, callback, fast) {
      attribute_spell(object, function () {
        Wizard.equip_shield(Wizard.get_wizard(object.wizard_index).id);
      }, callback, fast);
    },
    
    'magic_armour': function (object, callback, fast) {
      attribute_spell(object, function () {
        Wizard.equip_armour(Wizard.get_wizard(object.wizard_index).id);
      }, callback, fast);
    },
    
    'shadow_form': function (object, callback, fast) {
      attribute_spell(object, function () {
        Wizard.shadow_form(Wizard.get_wizard(object.wizard_index).id);
      }, callback, fast);
    },
    
    'world_alignment': function (object, callback, fast) {
      var wizard, spell;
      wizard = Wizard.get_wizard(object.wizard_index);
      spell = Storage.spell(wizard.spellbook[object.spell_index]);
      attribute_spell(object, function () {
        // do world alignment stuff here
      }, callback, fast);
    },
    
    'magic': function (object, callback, fast) {
      var wizard, spell, slice;
      wizard = Wizard.get_wizard(object.wizard_index);
      spell = Storage.spell(wizard.spellbook[object.spell_index]);
      slice = World.get_slice(object.x, object.y);
      Board.cast_text(wizard.name, spell.name, get_range(spell.doubled_cast_range), function () {
        Board.flash_cell(object.x, object.y, function () {
          if (object.success) {
            // destroy stuff
            callback();
          } else {
            callback();
          }
        });
      }, fast);
    },
    
    "lightning": function (object, callback, fast) {
      var wizard, spell, slice;
      wizard = Wizard.get_wizard(object.wizard_index);
      spell = Storage.spell(wizard.spellbook[object.spell_index]);
      slice = World.get_slice(object.x, object.y);
      Board.cast_text(wizard.name, spell.name, get_range(spell.doubled_cast_range), function () {
        Board.lightning(wizard.x, wizard.y, object.x, object.y, function () {
          Board.exploding_circle_effect(object.x, object.y, function () {
            if (object.success) {
              Board.explosion_effect(object.x, object.y, function () {
                kill(object.x, object.y, false, callback);
              });
            } else {
              callback();
            }
          });
        });
      }, fast);
    }
  };
}());