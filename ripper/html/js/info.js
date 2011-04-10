/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Info = (function () {
  var canvas, ctx, scale;
  
  function stats(object) {
    var name, alignment, attributes = [], combat, ranged_and_range, defence, movement_allowance, manoeuvre_rating, magic_resistance, wizard_stats;
    name = Storage.text(object.name + ' ', RGB.b_yellow, scale);
    if (object.chaos_law_value !== 0) {
      if (object.chaos_law_value > 0) {
        alignment = Storage.text(Storage.in_game_message(71) + ' ' + object.chaos_law_value + ')', RGB.b_cyan, scale);
      } else if (object.chaos_law_value < 0) {
        alignment = Storage.text(Storage.in_game_message(70) + ' ' + Math.abs(object.chaos_law_value) + ')', RGB.b_purple, scale);
      }
      name = Canvas.tile_horizontal([name, alignment]);
    }
    if (object.sword) {
      attributes[attributes.length] = Storage.in_game_message(63);
    } else if (object.knife) {
      attributes[attributes.length] = Storage.in_game_message(62);
    }
    if (object.armour) {
      attributes[attributes.length] = Storage.in_game_message(64);
    } else if (object.shield) {
      attributes[attributes.length] = Storage.in_game_message(65);
    }
    if (object.mount) {
      attributes[attributes.length] = Storage.in_game_message(68);
    }
    if (object.flying) {
      attributes[attributes.length] = Storage.in_game_message(66);
    }
    if (object.shadow_form) {
      attributes[attributes.length] = Storage.in_game_message(67);
    }
    if (object.undead) {
      attributes[attributes.length] = Storage.in_game_message(69);
    }
    attributes = Storage.text((attributes.length > 0) ? attributes.join(',') : ' ', object.wizard ? RGB.b_yellow : RGB.b_green, scale);
    combat = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(72), RGB.b_cyan, scale), Storage.text(String(object.combat), RGB.b_white, scale)]);
    ranged_and_range = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(73), RGB.b_cyan, scale), Storage.text(String(object.ranged_combat), RGB.b_white, scale), Storage.text('  ' + Storage.in_game_message(74), RGB.b_cyan, scale), Storage.text(String(object.range), RGB.b_white, scale)]);
    defence = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(75), RGB.b_cyan, scale), Storage.text(String(object.defence), RGB.b_white, scale)]);
    movement_allowance = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(76), RGB.b_cyan, scale), Storage.text(String(object.movement_allowance), RGB.b_white, scale)]);
    manoeuvre_rating = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(77), RGB.b_cyan, scale), Storage.text(String(object.manoeuvre_rating), RGB.b_white, scale)]);
    magic_resistance = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(78), RGB.b_cyan, scale), Storage.text(String(object.magic_resistance), RGB.b_white, scale)]);
    if (object.spells !== undefined && object.ability !== undefined) {
      wizard_stats = Canvas.tile_horizontal([Storage.text(Storage.in_game_message(81) + object.spells + ' ' + Storage.in_game_message(82) + object.ability, RGB.b_yellow, scale)]);
    }
    return Canvas.tile_vertical([name, attributes, combat, ranged_and_range, defence, movement_allowance, manoeuvre_rating, magic_resistance, wizard_stats]);
  }
  
  function get_short_info(slice, scale) {
    var text = [];
    if (slice.blob) {
      text[text.length] = Storage.text(slice.blob.name, RGB.b_cyan, scale);
      if (slice.object) {
        text[text.length] = Storage.text('#', RGB.b_white, scale);
      } else if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple, scale);
      }
      text[text.length] = Storage.text('(' + Wizard.get_wizard(slice.blob.creator_id).name + ')', RGB.b_yellow, scale);
    } else if (slice.object) {
      text[text.length] = Storage.text(slice.object.name, RGB.b_cyan, scale);
      if (slice.wizard) {
        text[text.length] = Storage.text('#', RGB.b_white, scale);
      } else if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple, scale);
      }
      text[text.length] = Storage.text('(' + Wizard.get_wizard(slice.object.creator_id).name + ')', RGB.b_yellow, scale);
    } else if (slice.wizard) {
      text[text.length] = Storage.text(slice.wizard.name, RGB.b_cyan, scale);
      if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple, scale);
      }
    } else if (slice.corpse) {
      text[text.length] = Storage.text(slice.corpse.name + ' ', RGB.b_cyan, scale);
      text[text.length] = Storage.text(Storage.in_game_message(50), RGB.b_green, scale);
    }
    if (text.length > 0) {
      return Canvas.tile_horizontal(text);
    } else {
      return undefined;
    }
  }
  
  function fetch_stats(object) {
    var stats_ctx;
    if (object.stats_canvas === undefined) {
      object.stats_canvas = Canvas.create(canvas.width, canvas.height / 2);
      stats_ctx = object.stats_canvas.getContext('2d');
      stats_ctx.drawImage(Storage.border(256 * scale, 176 * scale, RGB.b_green, RGB.black, scale), 0, 0);
      stats_ctx.drawImage(stats(object), 32 * scale, 16 * scale);
    }
    return object.stats_canvas;
  }
  
  function add_hidden_name(name) {
    ctx.drawImage(Storage.text('(' + name + ')', RGB.b_green, scale), 32 * scale, 32 * scale);
  }
  
  function show_full_info(slice, force_update) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Board.clear_text();
    if (slice.blob) {
      ctx.drawImage(fetch_stats(slice.blob), 0, 0);
      if (slice.object) {
        ctx.drawImage(fetch_stats(slice.object), 0, 192 * scale);
        add_hidden_name(slice.object.name);
      }
    } else if (slice.object) {
      ctx.drawImage(fetch_stats(slice.object), 0, 0);
      if (slice.wizard) {
        ctx.drawImage(fetch_stats(slice.wizard), 0, 192 * scale);
        add_hidden_name(slice.wizard.name);
      }
    } else if (slice.wizard) {
      ctx.drawImage(fetch_stats(slice.wizard), 0, 0);
    } else if (slice.corpse) {
      ctx.drawImage(fetch_stats(slice.corpse), 0, 0);
    }
  }
  
  return {
    'init': function (element, use_scale) {
      canvas = element;
      ctx = canvas.getContext('2d');
      scale = use_scale;
    },
    
    'get_info': function (x, y, scale) {
      var slice = World.get_slice(x, y);
      show_full_info(slice);
      return get_short_info(slice, scale);
    },
    
    'stats': function (object) {
      return stats(object);
    },
    
    'wipe': function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      Board.clear_text();
    }
  };
}());