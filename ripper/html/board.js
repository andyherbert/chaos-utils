/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global COLOURS: true, $: true, create_canvas: true, tile_horizontal: true, http_get: true, Info: true, Storage: true */

var Board = (function () {
  var info_x, info_y, scale_factor, canvas, ctx, anim_timer, arena = [[], [], [], []];
  
  function draw_image(image, x, y) {
    var size = 16 * scale_factor;
    x = (8 + x * 16) * scale_factor;
    y = (8 + y * 16) * scale_factor;
    ctx.clearRect(x, y, size, size);
    ctx.drawImage(image, x, y);
  }
  
  function draw_cursor(name, x, y, ink) {
    x = (8 + x * 16) * scale_factor;
    y = (8 + y * 16) * scale_factor;
    ctx.drawImage(Storage.cursor(name, ink), x, y);
  }
  
  function draw_text(image, x) {
    var y = 176 * scale_factor, height = 16 * scale_factor;
    x = (x === undefined) ? 0 : x;
    ctx.clearRect(x, y, canvas.width - x, height);
    if (image !== undefined) {
      ctx.drawImage(image, x, y);
    }
  }
  
  function erase(x, y) {
    if ((x !== undefined) && (y !== undefined)) {
      ctx.clearRect((8 + x * 16) * scale_factor, (8 + y * 16) * scale_factor, 16 * scale_factor, 16 * scale_factor);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  function update_cell(x, y) {
    var array_index = y * 15 + x, object;
    erase(x, y);
    arena.each_pair(function (arena_index, objects) {
      object = objects[array_index];
      if (object) {
        if (arena_index === '0') {
          draw_image(object.corpse, object.x, object.y);
        } else {
          draw_image(object.anim[object.frame_index], object.x, object.y);
        }
      }
    });
    if (info_x === x && info_y === y) {
      draw_cursor('box', x, y, COLOURS.bright_cyan);
    }
  }
  
  function draw_border(ink, paper) {
    ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, ink, (paper === undefined) ? 0 : paper), 0, 0);
  }
  
  function do_tic() {
    arena.each_pair(function (arena_index, objects) {
      objects.each(function (object) {
        if (arena_index !== '0' && object) {
          object.tic_count += 1;
          if (object.tic_count === object.anim_timing) {
            object.tic_count = 0;
            object.frame_index = (object.frame_index === 3) ? 0 : (object.frame_index + 1);
            update_cell(object.x, object.y);
          }
        }
      });
    });
  }
  
  function do_animation(bool) {
    if (bool) {
      anim_timer = setInterval(do_tic, 20);
    } else {
      clearInterval(anim_timer);
    }
  }
  
  function do_effect(frames, x, y, repeat, callback, frame_counter) {
    if (frame_counter === undefined) {
      frame_counter = 0;
    }
    if ((frames.length * repeat) !== frame_counter) {
      draw_image(frames[frame_counter % frames.length], x, y);
      setTimeout(function () {
        do_effect(frames, x, y, repeat, callback, frame_counter + 1);
      }, 75);
    } else {
      callback();
    }
  }
  
  function start_effect(frames, x, y, callback, repeat) {
    do_animation(false);
    do_effect(frames, x, y, repeat, function () {
      update_cell(x, y);
      callback();
    });
  }
  
  function mouse_out(mouse_event) {
    var temp_x = info_x, temp_y = info_y;
    if ((info_x !== undefined) && (info_y !== undefined)) {
      info_x = undefined;
      info_y = undefined;
      update_cell(temp_x, temp_y);
    }
  }
  
  function get_slice(x, y) {
    var array_index = y * 15 + x;
    return [arena[0][array_index], arena[1][array_index], arena[2][array_index], arena[3][array_index]];
  }
  
  function draw_info(x, y) {
    var short_info = Info.short_info(get_slice(x, y));
    if (short_info) {
      draw_text(short_info);
    } else {
      draw_text();
    }
  }
  
  function mouse_move(mouse_event) {
    var size = 16 * scale_factor, x, y, array_index, temp_x = info_x, temp_y = info_y;
    x = Math.floor((mouse_event.universal_offsetX() - 8 * scale_factor) / size);
    y = Math.floor((mouse_event.universal_offsetY() - 8 * scale_factor) / size);
    if ((x >= 0) && (x < 15) && (y >= 0) && (y < 10)) {
      if ((x !== info_x) || (y !== info_y)) {
        array_index = y * 15 + x;
        info_x = x;
        info_y = y;
        Info.show_cell(get_slice(x, y));
        if ((temp_x !== undefined) && (temp_y !== undefined)) {
          update_cell(temp_x, temp_y);
        }
        update_cell(info_x, info_y);
        draw_info(x, y);
      }
    } else if ((info_x !== undefined) && (info_y !== undefined)) {
      info_x = undefined;
      info_y = undefined;
      update_cell(temp_x, temp_y);
      Info.wipe();
    }
  }
  
  function add_object(layer, x, y, object) {
    object.x = x;
    object.y = y;
    object.tic_count = 0;
    object.frame_index = 0;
    arena[layer][y * 15 + x] = object;
    update_cell(x, y);
    if ((x === info_x) && (y === info_y)) {
      draw_info(x, y);
      Info.show_cell(get_slice(x, y));
    }
  }
  
  function remove_object(layer, x, y) {
    delete (arena[layer][y * 15 + x]);
    update_cell(x, y);
    if ((x === info_x) && (y === info_y)) {
      draw_info(x, y);
      Info.show_cell(get_slice(x, y));
    }
  }
  
  return {
    'init': function (element, callback) {
      scale_factor = Storage.scale_factor();
      canvas = element;
      canvas.addEventListener('mousemove', mouse_move, true);
      canvas.addEventListener('mouseout', mouse_out, true);
      ctx = canvas.getContext('2d');
      ctx.drawImage(Storage.loading_screen(), 0, 0);
    },
    
    'add_corpse': function (x, y, object) {
      add_object(0, x, y, object);
    },
    
    'remove_corpse': function (x, y) {
      remove_object(0, x, y);
    },
    
    'add_wizard': function (x, y, object) {
      add_object(1, x, y, object);
    },
    
    'remove_wizard': function (x, y) {
      remove_object(1, x, y);
    },
    
    'add_object': function (x, y, object) {
      add_object(2, x, y, object);
    },
    
    'remove_object': function (x, y) {
      remove_object(2, x, y);
    },
    
    'kill_object': function (x, y) {
      add_object(0, x, y, arena[2][y * 15 + x]);
      remove_object(2, x, y);
    },
    
    'move_object': function (sx, sy, dx, dy) {
      add_object(2, dx, dy, arena[2][sy * 15 + sx]);
      remove_object(2, sx, sy);
    },
    
    'add_blob': function (x, y, object) {
      add_object(3, x, y, object);
    },
    
    'remove_blob': function (x, y) {
      remove_object(3, x, y);
    },
    
    'dragon_burn_effect': function (x, y, callback) {
      start_effect(Storage.effect('dragon_burn', COLOURS.bright_yellow), x, y, function () { callback(); }, 1);
    },
    
    'attack_effect': function (x, y, callback) {
      start_effect(Storage.effect('attack', COLOURS.bright_yellow), x, y, function () { callback(); }, 1);
    },
    
    'exploding_circle_effect': function (x, y, callback) {
      start_effect(Storage.effect('exploding_circle', COLOURS.bright_white), x, y, function () { callback(); }, 1);
    },
    
    'twirl_effect': function (x, y, callback) {
      start_effect(Storage.effect('twirl', COLOURS.bright_cyan), x, y, function () { callback(); }, 1);
    },
    
    'explosion_effect': function (x, y, callback) {
      start_effect(Storage.effect('explosion', COLOURS.bright_yellow), x, y, function () { callback(); }, 1);
    },
    
    'text': function (text, ink) {
      draw_text(Storage.text(text, ink));
    },
    
    'clear_text': function () {
      draw_text();
    },
    
    'cast_text': function (wizard_name, spell_name, range, callback) {
      wizard_name = Storage.text(wizard_name + ' ', COLOURS.bright_yellow);
      spell_name = Storage.text(spell_name + '  ', COLOURS.bright_green);
      range = Storage.text(String(range), COLOURS.bright_white);
      draw_text(wizard_name);
      setTimeout(function () {
        draw_text(tile_horizontal([wizard_name, spell_name]));
        setTimeout(function () {
          draw_text(tile_horizontal([wizard_name, spell_name, range]));
          setTimeout(function () {
            callback();
          }, 300);
        }, 300);
      }, 300);
    },
    
    'draw_info': function (x, y) {
      draw_info(x, y);
    },
    
    'stop_animation': function () {
      do_animation(false);
    },
    
    'start_animation': function () {
      do_animation(true);
    },
    
    'draw_arena': function () {
      erase();
      draw_border(COLOURS.blue);
      do_animation(true);
    }
  };
}());