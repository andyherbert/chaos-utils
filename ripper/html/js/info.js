/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, create_canvas: true, tile_horizontal: true, tile_vertical: true, http_get: true, Board: true, RGB: true, World: true */
var Info = (function () {
  var canvas, ctx, scale_factor, current_object;
  
  function stats(object) {
    var name, alignment, attributes = [], combat, ranged_and_range, defence, movement_allowance, manoeuvre_rating, magic_resistance;
    name = Storage.text(object.name + ' ', RGB.b_yellow);
    if (object.chaos_law_value !== 0) {
      if (object.chaos_law_value > 0) {
        alignment = Storage.text(Storage.in_game_message(71) + ' ' + object.chaos_law_value + ')', RGB.b_cyan);
      } else if (object.chaos_law_value < 0) {
        alignment = Storage.text(Storage.in_game_message(70) + ' ' + Math.abs(object.chaos_law_value) + ')', RGB.b_purple);
      }
      name = tile_horizontal([name, alignment]);
    }
    if (object.mount) {
      attributes[attributes.length] = Storage.in_game_message(68);
    }
    if (object.flying) {
      attributes[attributes.length] = Storage.in_game_message(66);
    }
    if (object.undead) {
      attributes[attributes.length] = Storage.in_game_message(69);
    }
    attributes = Storage.text((attributes.length > 0) ? attributes.join(',') : ' ', RGB.b_green);
    combat = tile_horizontal([Storage.text(Storage.in_game_message(72), RGB.b_cyan), Storage.text(String(object.combat), RGB.b_white)]);
    ranged_and_range = tile_horizontal([Storage.text(Storage.in_game_message(73), RGB.b_cyan), Storage.text(String(object.ranged_combat), RGB.b_white), Storage.text(' ' + Storage.in_game_message(74), RGB.b_cyan), Storage.text(String(object.range), RGB.b_white)]);
    defence = tile_horizontal([Storage.text(Storage.in_game_message(75), RGB.b_cyan), Storage.text(String(object.defence), RGB.b_white)]);
    movement_allowance = tile_horizontal([Storage.text(Storage.in_game_message(76), RGB.b_cyan), Storage.text(String(object.movement_allowance), RGB.b_white)]);
    manoeuvre_rating = tile_horizontal([Storage.text(Storage.in_game_message(77), RGB.b_cyan), Storage.text(String(object.manoeuvre_rating), RGB.b_white)]);
    magic_resistance = tile_horizontal([Storage.text(Storage.in_game_message(78), RGB.b_cyan), Storage.text(String(object.magic_resistance), RGB.b_white)]);
    return tile_vertical([name, attributes, combat, ranged_and_range, defence, movement_allowance, manoeuvre_rating, magic_resistance]);
  }
  
  function get_short_info(slice) {
    var text = [];
    if (slice.blob) {
      text[text.length] = Storage.text(slice.blob.name, RGB.b_cyan);
      if (slice.object) {
        text[text.length] = Storage.text('#', RGB.b_white);
      } else if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple);
      }
      text[text.length] = Storage.text('(' + slice.blob.creator + ')', RGB.b_yellow);
    } else if (slice.object) {
      text[text.length] = Storage.text(slice.object.name, RGB.b_cyan);
      if (slice.wizard) {
        text[text.length] = Storage.text('#', RGB.b_white);
      } else if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple);
      }
      text[text.length] = Storage.text('(' + slice.object.creator + ')', RGB.b_yellow);
    } else if (slice.wizard) {
      text[text.length] = Storage.text(slice.wizard.name, RGB.b_cyan);
      if (slice.corpse) {
        text[text.length] = Storage.text('#', RGB.b_purple);
      }
    } else if (slice.corpse) {
      text[text.length] = Storage.text(slice.corpse.name + ' ', RGB.b_cyan);
      text[text.length] = Storage.text(Storage.in_game_message(50), RGB.b_green);
    }
    if (text.length > 0) {
      return tile_horizontal(text);
    } else {
      return undefined;
    }
  }
  
  function show_full_info(slice) {
    var new_object = (slice.blob || slice.object || slice.wizard || slice.corpse), stats_ctx;
    if (new_object) {
      if (new_object !== current_object) {
        current_object = new_object;
        if (current_object.stats_canvas === undefined) {
          current_object.stats_canvas = create_canvas(canvas.width, canvas.height);
          stats_ctx = current_object.stats_canvas.getContext('2d');
          stats_ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, RGB.b_green, 0), 0, 0);
          stats_ctx.drawImage(stats(current_object), 32 * scale_factor, 16 * scale_factor);
        }
        ctx.drawImage(current_object.stats_canvas, 0, 0);
      }
    } else {
      current_object = undefined;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      Board.clear_text();
    }
  }
  
  return {
    'init': function (element) {
      canvas = element;
      ctx = canvas.getContext('2d');
      scale_factor = Storage.scale_factor();
    },
    
    'get_info': function (x, y) {
      var slice = World.get_slice(x, y);
      show_full_info(slice);
      return get_short_info(slice);
    },
    
    'wipe': function () {
      current_object = undefined;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}());