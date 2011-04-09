/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
SpellDisplay = (function () {
  var canvas, ctx, wizard, scale_factor, spell_inks, current_spell;
  
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
    return Storage.text(' ' + alignment + spell.name, spell_inks[World.cast_chance(wizard, spell)]);
  }
  
  function redraw_spells() {
    if (wizard) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(Storage.text(wizard.name + Storage.in_game_message(83), RGB.b_yellow), 0, 0);
      wizard.spellbook.each_with_index(function (spell, index) {
        if ((index % 2) === 0) {
          ctx.drawImage(spell_text(spell), 0, (16 + (index / 2) * 16) * scale_factor);
        } else {
          ctx.drawImage(spell_text(spell), 128 * scale_factor, (16 + Math.floor(index / 2) * 16) * scale_factor);
        }
      });
    }
  }
  
  function fetch_spell_image(spell) {
    var stats_ctx, cast_range;
    if (spell.stats_canvas === undefined) {
      spell.stats_canvas = Canvas.create(512, 384);
      stats_ctx = spell.stats_canvas.getContext('2d');
      if (spell.id <= 33) {
        stats_ctx.drawImage(Storage.border(512, 352, RGB.b_green, RGB.black), 0, 0);
        stats_ctx.drawImage(Storage.text(Storage.in_game_message(79) + ((World.cast_chance(wizard, spell) + 1) * 10) + '%', RGB.b_cyan), 64, 288);
        stats_ctx.drawImage(Info.stats(Storage.new_object(spell.id)), 64, 32);
      } else {
        stats_ctx.drawImage(Storage.border(512, 352, RGB.b_blue, RGB.b_cyan), 0, 0);
        stats_ctx.drawImage(Storage.text(spell.name, RGB.b_yellow), 128, 80);
        if (spell.chaos_law_value > 0) {
          stats_ctx.drawImage(Storage.text(Storage.in_game_message(71) + ' ' + spell.chaos_law_value + ')', RGB.b_cyan), 128, 112);
        } else if (spell.chaos_law_value < 0) {
          stats_ctx.drawImage(Storage.text(Storage.in_game_message(70) + ' ' + Math.abs(spell.chaos_law_value) + ')', RGB.b_purple), 128, 112);
        }
        cast_range = Math.floor(spell.doubled_cast_range / 2);
        stats_ctx.drawImage(Canvas.tile_horizontal([Storage.text(Storage.in_game_message(79), RGB.b_green), Storage.text(((World.cast_chance(wizard, spell) + 1) * 10) + '%', RGB.b_yellow)]), 128, 160);
        stats_ctx.drawImage(Canvas.tile_horizontal([Storage.text(Storage.in_game_message(74), RGB.b_green), Storage.text((cast_range > 9) ? String(20) : String(cast_range), RGB.b_yellow)]), 128, 224);
      }
    }
    return spell.stats_canvas;
  }
  
  function show_spell_info(spell_number) {
    var spell;
    ctx.clearRect(0, 384, 512, 384);
    if (spell_number !== undefined) {
      spell = wizard.spellbook[spell_number];
      if (spell) {
        ctx.drawImage(fetch_spell_image(spell), 0, 384);
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
    'init': function (element) {
      canvas = element;
      ctx = canvas.getContext('2d');
      scale_factor = Storage.scale_factor();
      canvas.addEventListener('mousemove', mouse_move, true);
      canvas.addEventListener('mouseout', mouse_out, true);
    },
    
    'use_wizard': function (creator_id) {
      wizard = Wizard.get_wizard(creator_id);
      redraw_spells();
    }
  };
}());