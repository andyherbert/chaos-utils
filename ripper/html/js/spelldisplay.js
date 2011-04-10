/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
SpellDisplay = (function () {
  var canvas, ctx, wizard, scale, spell_inks, current_spell, canvas_cache = [];
  
  spell_inks = [RGB.b_red, RGB.b_purple, RGB.b_purple, RGB.b_green, RGB.b_green, RGB.b_cyan, RGB.b_cyan, RGB.b_yellow, RGB.b_yellow, RGB.b_white];
  
  function spell_text(spell) {
    var alignment;
    if (spell.chaos_law_value < 0) {
      alignment = '*';
    } else if (spell.chaos_law_value > 0) {
      alignment = '^';
    } else {
      alignment = '-';
    }
    return Storage.text(' ' + alignment + spell.name, spell_inks[World.cast_chance(wizard, spell)], scale);
  }
  
  function redraw_spells() {
    if (wizard) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(Storage.text(wizard.name + Storage.in_game_message(83), RGB.b_yellow, scale), 0, 0);
      wizard.spellbook.each_with_index(function (spell_index, index) {
        var spell = Storage.spell(spell_index);
        if ((index % 2) === 0) {
          ctx.drawImage(spell_text(spell), 0, (16 + (index / 2) * 16) * scale);
        } else {
          ctx.drawImage(spell_text(spell), 128 * scale, (16 + Math.floor(index / 2) * 16) * scale);
        }
      });
    }
  }
  
  function fetch_spell_image(spell_number) {
    var canvas, ctx, cast_range, spell;
    if (canvas_cache[spell_number] === undefined) {
      spell = Storage.spell(spell_number);
      canvas = Canvas.create(512, 384);
      ctx = canvas.getContext('2d');
      if (spell.id <= 33) {
        ctx.drawImage(Storage.border(256 * scale, 192 * scale, RGB.b_green, RGB.black, scale), 0, 0);
        ctx.drawImage(Storage.text(Storage.in_game_message(79) + ((World.cast_chance(wizard, spell) + 1) * 10) + '%', RGB.b_cyan, scale), 32 * scale, 144 * scale);
        ctx.drawImage(Info.stats(Storage.create_object(spell.id)), 32 * scale, 16 * scale);
      } else {
        ctx.drawImage(Storage.border(256 * scale, 192 * scale, RGB.b_blue, RGB.b_cyan, scale), 0, 0);
        ctx.drawImage(Storage.text(spell.name, RGB.b_yellow, scale), 64 * scale, 40 * scale);
        if (spell.chaos_law_value > 0) {
          ctx.drawImage(Storage.text(Storage.in_game_message(71) + ' ' + spell.chaos_law_value + ')', RGB.b_cyan, scale), 64 * scale, 56 * scale);
        } else if (spell.chaos_law_value < 0) {
          ctx.drawImage(Storage.text(Storage.in_game_message(70) + ' ' + Math.abs(spell.chaos_law_value) + ')', RGB.b_purple, scale), 64 * scale, 56 * scale);
        }
        cast_range = Math.floor(spell.doubled_cast_range / 2);
        ctx.drawImage(Canvas.tile_horizontal([Storage.text(Storage.in_game_message(79), RGB.b_green, scale), Storage.text(((World.cast_chance(wizard, spell) + 1) * 10) + '%', RGB.b_yellow, scale)]), 64 * scale, 80 * scale);
        ctx.drawImage(Canvas.tile_horizontal([Storage.text(Storage.in_game_message(74), RGB.b_green, scale), Storage.text((cast_range > 9) ? String(20) : String(cast_range), RGB.b_yellow, scale)]), 64 * scale, 112 * scale);
      }
      canvas_cache[spell_number] = canvas;
    }
    return canvas_cache[spell_number];
  }
  
  function show_spell_info(spell_number) {
    ctx.clearRect(0, 192, 256, 192);
    if (spell_number !== undefined) {
      if (wizard.spellbook[spell_number] !== undefined) {
        ctx.drawImage(fetch_spell_image(wizard.spellbook[spell_number]), 0, 192);
      }
    }
  }
  
  function mouse_out(mouse_event) {
    current_spell = undefined;
    show_spell_info();
  }
  
  function mouse_move(mouse_event) {
    var x, y, new_spell;
    x = Math.floor(mouse_event.universal_offsetX() / 128);
    y = Math.floor((mouse_event.universal_offsetY() - 16) / 16);
    if (y >= 0 && y < 10) {
      new_spell = y * 2 + x;
      if (current_spell !== new_spell) {
        current_spell = new_spell;
        show_spell_info(current_spell);
      }
    } else {
      current_spell = undefined;
      show_spell_info();
    }
  }
  
  return {
    'init': function (element, use_scale) {
      canvas = element;
      ctx = canvas.getContext('2d');
      scale = use_scale;
    },
    
    'use_wizard': function (creator_id) {
      wizard = Wizard.get_wizard(creator_id);
      redraw_spells();
      canvas.addEventListener('mousemove', mouse_move, true);
      canvas.addEventListener('mouseout', mouse_out, true);
    },
    
    'rehash': function () {
      redraw_spells();
    },
    
    'get_wizard_id': function () {
      if (wizard !== undefined) {
        return wizard.id;
      } else {
        return undefined;
      }
    }
  };
}());