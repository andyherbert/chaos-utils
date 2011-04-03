/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, create_canvas: true, tile_horizontal: true, tile_vertical: true, http_get: true, Board: true, COLOURS: true */
var Info = (function () {
  var canvas, ctx, scale_factor, current_object;
  
  function stats(object) {
    var name, alignment, attributes = [], combat, ranged_and_range, defence, movement_allowance, manoevre, magic_resistance, wizard_stats;
    name = Storage.text(object.name + ' ', COLOURS.bright_yellow);
    if (object.mount) {
      attributes[attributes.length] = Storage.in_game_message(68);
    }
    if (object.flying) {
      attributes[attributes.length] = Storage.in_game_message(66);
    }
    if (object.undead) {
      attributes[attributes.length] = Storage.in_game_message(69);
    }
    attributes = Storage.text((attributes.length > 0) ? attributes.join(',') : ' ', COLOURS.bright_green);
    combat = tile_horizontal([Storage.text(Storage.in_game_message(72), COLOURS.bright_cyan), Storage.text(String(object.combat), COLOURS.bright_white)])
    ranged_and_range = tile_horizontal([Storage.text(Storage.in_game_message(73), COLOURS.bright_cyan), Storage.text(String(object.ranged_combat), COLOURS.bright_white), Storage.text(' ' + Storage.in_game_message(74), COLOURS.bright_cyan), Storage.text(String(object.range), COLOURS.bright_white)])
    defence = tile_horizontal([Storage.text(Storage.in_game_message(75), COLOURS.bright_cyan), Storage.text(String(object.defence), COLOURS.bright_white)])
    movement_allowance = tile_horizontal([Storage.text(Storage.in_game_message(76), COLOURS.bright_cyan), Storage.text(String(object.movement_allowance), COLOURS.bright_white)])
    magic_resistance = tile_horizontal([Storage.text(Storage.in_game_message(78), COLOURS.bright_cyan), Storage.text(String(object.magic_resistance), COLOURS.bright_white)])
    return tile_vertical([name, attributes, combat, ranged_and_range, defence, movement_allowance, magic_resistance]);
  }
  
  return {
    'init': function (element) {
      canvas = element;
      ctx = canvas.getContext('2d');
      scale_factor = Storage.scale_factor();
    },
    
    'show_cell': function (board_slice) {
      var new_object = (board_slice[0] || board_slice[1] || board_slice[2] || board_slice[3]);
      if (new_object) {
        if (new_object !== current_object) {
          current_object = new_object;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, COLOURS.bright_green, 0), 0, 0);
          ctx.drawImage(stats(current_object), 32 * scale_factor, 16 * scale_factor);
        }
      } else {
        current_object = undefined;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    
    'short_info': function (board_slice) {
      var corpse = board_slice[0], wizard = board_slice[1], object = board_slice[2], blob = board_slice[3], text = [];
      if (blob) {
        text[text.length] = Storage.text(blob.name, COLOURS.bright_cyan);
        if (object) {
          text[text.length] = Storage.text('#', COLOURS.bright_white);
        } else if (corpse) {
          text[text.length] = Storage.text('#', COLOURS.bright_purple);
        }
        text[text.length] = Storage.text('(' + blob.creator + ')', COLOURS.bright_yellow);
      } else if (object) {
        text[text.length] = Storage.text(object.name, COLOURS.bright_cyan);
        if (wizard) {
          text[text.length] = Storage.text('#', COLOURS.bright_white);
        } else if (corpse) {
          text[text.length] = Storage.text('#', COLOURS.bright_purple);
        }
        text[text.length] = Storage.text('(' + object.creator + ')', COLOURS.bright_yellow);
      } else if (wizard) {
        text[text.length] = Storage.text(wizard.name, COLOURS.bright_cyan);
        if (corpse) {
          text[text.length] = Storage.text('#', COLOURS.bright_purple);
        }
      } else if (corpse) {
        text[text.length] = Storage.text(corpse.name + ' ', COLOURS.bright_cyan);
        text[text.length] = Storage.text(Storage.in_game_message(50), COLOURS.bright_green);
      }
      if (text.length > 0) {
        return tile_horizontal(text);
      } else {
        return undefined;
      }
    },
    
    'wipe': function () {
      current_object = undefined;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}());