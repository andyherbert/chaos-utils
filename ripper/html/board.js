/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global World: true, RGB: true, $: true, create_canvas: true, tile_horizontal: true, http_get: true, Info: true, Storage: true, line: true */

var Board = (function () {
  var info_x, info_y, hidden_cursor, scale_factor, canvas, ctx;
  
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
    ctx.fillStyle = 'black';
    if ((x !== undefined) && (y !== undefined)) {
      ctx.fillRect((8 + x * 16) * scale_factor, (8 + y * 16) * scale_factor, 16 * scale_factor, 16 * scale_factor);
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  function update_cell(x, y) {
    erase(x, y);
    World.get_slice(x, y).each_pair(function (layer_name, object) {
      if (object !== undefined) {
        if (layer_name === 'corpse') {
          draw_image(object.corpse, object.x, object.y);
        } else {
          draw_image(object.anim[object.frame_index], object.x, object.y);
        }
      }
    });
    if ((info_x === x) && (info_y === y) && !hidden_cursor) {
      draw_cursor('box', x, y, RGB.b_cyan);
    }
  }
  
  function do_effect_tic(frames, x, y, repeat, callback, frame_counter) {
    if (frame_counter === undefined) {
      frame_counter = 0;
    }
    if ((frames.length * repeat) !== frame_counter) {
      draw_image(frames[frame_counter % frames.length], x, y);
      setTimeout(function () {
        do_effect_tic(frames, x, y, repeat, callback, frame_counter + 1);
      }, 75);
    } else {
      callback();
    }
  }
  
  function set_hidden_cursor(bool) {
    hidden_cursor = bool;
    if ((info_x !== undefined) && (info_y !== undefined)) {
      update_cell(info_x, info_y);
    }
  }
  
  function freeze() {
    World.freeze();
    set_hidden_cursor(true);
  }
  
  function set_interactive() {
    World.unfreeze();
    set_hidden_cursor(false);
  }
  
  function start_effect(frames, x, y, callback, repeat) {
    freeze();
    do_effect_tic(frames, x, y, repeat, function () {
      update_cell(x, y);
      set_interactive();
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
  
  function draw_info(x, y) {
    var text = Info.get_info(x, y);
    if (text) {
      draw_text(text);
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
        if (!hidden_cursor) {
          draw_info(x, y);
          update_cell(info_x, info_y);
          if ((temp_x !== undefined) && (temp_y !== undefined)) {
            update_cell(temp_x, temp_y);
          }
        }
      }
    } else if ((info_x !== undefined) && (info_y !== undefined)) {
      info_x = undefined;
      info_y = undefined;
      update_cell(temp_x, temp_y);
      Info.wipe();
    }
  }
  
  function do_line_effect(beam_image, cleanup_image, length, pixels, step, callback, count) {
    var x_offset = beam_image.width / 2, y_offset = beam_image.width / 2;
    if (count === undefined) {
      count = 0;
    }
    if (count < (pixels.length + length)) {
      if (count % step === 0) {
        if (count < pixels.length) {
          ctx.drawImage(beam_image, pixels[count][0] - x_offset, pixels[count][1] - y_offset);
        }
        if (count >= length) {
          ctx.drawImage(cleanup_image, pixels[count - length][0] - x_offset, pixels[count - length][1] - y_offset);
        }
      }
      setTimeout(function () {
        do_line_effect(beam_image, cleanup_image, length, pixels, step, callback, count + 1);
      }, 5);
    } else {
      callback();
    }
  }
  return {
    'init': function (element, callback) {
      scale_factor = Storage.scale_factor();
      canvas = element;
      ctx = canvas.getContext('2d');
      canvas.addEventListener('mousemove', mouse_move, true);
      canvas.addEventListener('mouseout', mouse_out, true);
    },
    
    'simple_beam': function (sx, sy, dx, dy, callback) {
      freeze();
      canvas.save_buffer();
      do_line_effect(Storage.simple_beam(RGB.b_white), Storage.simple_beam(RGB.black), 20, line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 1, function () {
        canvas.restore_buffer();
        set_interactive();
        callback();
      });
    },
    
    'spell_beam': function (sx, sy, dx, dy, callback) {
      freeze();
      canvas.save_buffer();
      do_line_effect(Storage.spell_beam(RGB.b_cyan), Storage.spell_beam(RGB.black), 30, line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 1, function () {
        canvas.restore_buffer();
        set_interactive();
        callback();
      });
    },
    
    'burn_beam': function (sx, sy, dx, dy, callback) {
      freeze();
      canvas.save_buffer();
      do_line_effect(Storage.burn_beam(RGB.b_yellow), Storage.burn_beam(RGB.black), 45, line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 3, function () {
        canvas.restore_buffer();
        set_interactive();
        callback();
      });
    },
    
    'dragon_burn_effect': function (x, y, callback) {
      start_effect(Storage.effect('dragon_burn', RGB.b_yellow), x, y, function () { callback(); }, 1);
    },
    
    'attack_effect': function (x, y, callback) {
      start_effect(Storage.effect('attack', RGB.b_yellow), x, y, function () { callback(); }, 1);
    },
    
    'exploding_circle_effect': function (x, y, callback) {
      start_effect(Storage.effect('exploding_circle', RGB.b_white), x, y, function () { callback(); }, 1);
    },
    
    'twirl_effect': function (x, y, callback) {
      start_effect(Storage.effect('twirl', RGB.b_cyan), x, y, function () { callback(); }, 1);
    },
    
    'explosion_effect': function (x, y, callback) {
      start_effect(Storage.effect('explosion', RGB.b_yellow), x, y, function () { callback(); }, 1);
    },
    
    'footer': function (image) {
      draw_text(image);
    },
    
    'clear_text': function (image) {
      draw_text(image);
    },
    
    'cast_text': function (wizard_name, spell_name, range, callback) {
      wizard_name = Storage.text(wizard_name + ' ', RGB.b_yellow);
      spell_name = Storage.text(spell_name + '  ', RGB.b_green);
      range = Storage.text(String(range), RGB.b_white);
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
    
    'draw_arena': function () {
      erase();
      ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, RGB.blue, 0), 0, 0);
      set_interactive();
    },
    
    'update_cell': function (x, y) {
      update_cell(x, y);
    }
  };
}());