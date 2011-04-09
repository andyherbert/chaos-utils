/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Board = (function () {
  var cursor, scale_factor, canvas, ctx;
  
  function draw_image(image, x, y) {
    var size = 16 * scale_factor;
    x = (8 + x * 16) * scale_factor;
    y = (8 + y * 16) * scale_factor;
    ctx.clearRect(x, y, size, size);
    ctx.drawImage(image, x, y);
  }
  
  function draw_text(image, x) {
    var y = 176 * scale_factor, height = 16 * scale_factor;
    x = (x === undefined) ? 0 : x;
    ctx.clearRect(x, y, canvas.width - x, height);
    if (image !== undefined) {
      ctx.drawImage(image, x, y);
    }
  }
  
  function draw_info(x, y) {
    var text = Info.get_info(x, y);
    if (text) {
      draw_text(text);
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
  
  function update_cell(x, y, info_updated) {
    erase(x, y);
    World.get_slice(x, y).each_pair(function (layer_name, object) {
      if (object !== undefined) {
        draw_image(object.dead ? object.corpse : object.anim[object.frame_index], object.x, object.y);
      }
    });
    if ((cursor.x === x) && (cursor.y === y) && !cursor.hidden && !cursor.out_of_bounds) {
      ctx.drawImage(Storage.cursor(cursor.image, cursor.colour), (8 + x * 16) * scale_factor, (8 + y * 16) * scale_factor);
      if (info_updated) {
        draw_info(x, y);
      }
    }
  }
  
  function do_effect_tic(frames, x, y, repeat, callback, frame_counter) {
    if ((frames.length * repeat) !== frame_counter) {
      draw_image(frames[frame_counter % frames.length], x, y);
      setTimeout(function () {
        do_effect_tic(frames, x, y, repeat, callback, frame_counter + 1);
      }, 30);
    } else {
      callback();
    }
  }
  
  function set_hidden_cursor(bool) {
    cursor.hidden = bool;
    if (!cursor.out_of_bounds) {
      update_cell(cursor.x, cursor.y);
    }
  }
  
  function freeze() {
    World.freeze();
    set_hidden_cursor(true);
  }
  
  function set_interactive() {
    World.unfreeze();
    set_hidden_cursor(false);
    if (!cursor.out_of_bounds) {
      draw_info(cursor.x, cursor.y);
    }
  }
  
  function start_effect(frames, x, y, callback, repeat) {
    freeze();
    do_effect_tic(frames, x, y, repeat, function () {
      update_cell(x, y);
      set_interactive();
      callback();
    }, 0);
  }
  
  function mouse_out(mouse_event) {
    var old_cursor = cursor.clone();
    if (!cursor.out_of_bounds) {
      cursor.out_of_bounds = true;
      update_cell(old_cursor.x, old_cursor.y);
    }
  }
  
  function mouse_move(mouse_event) {
    var size = 16 * scale_factor, x, y, array_index, old_cursor = cursor.clone();
    x = Math.floor((mouse_event.universal_offsetX() - 8 * scale_factor) / size);
    y = Math.floor((mouse_event.universal_offsetY() - 8 * scale_factor) / size);
    if ((x >= 0) && (x < 15) && (y >= 0) && (y < 10)) {
      if ((x !== cursor.x) || (y !== cursor.y) || old_cursor.out_of_bounds) {
        array_index = y * 15 + x;
        cursor.set_xy(x, y);
        cursor.out_of_bounds = false;
        if (!cursor.hidden) {
          draw_info(x, y);
          update_cell(cursor.x, cursor.y);
          if (!old_cursor.out_of_bounds) {
            update_cell(old_cursor.x, old_cursor.y);
          }
        }
      }
    } else if (!cursor.out_of_bounds) {
      cursor.out_of_bounds = true;
      update_cell(old_cursor.x, old_cursor.y);
      Info.wipe();
    }
  }
  
  function do_beam_effect(beam_image, cleanup_image, length, pixels, step, callback, count) {
    var x_offset = beam_image.width / 2, y_offset = beam_image.width / 2;
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
        do_beam_effect(beam_image, cleanup_image, length, pixels, step, callback, count + 1);
      }, 10);
    } else {
      callback();
    }
  }
  
  function start_beam(image, cleanup_image, length, pixels, step, callback) {
    freeze();
    canvas.save_buffer();
    do_beam_effect(image, cleanup_image, length, pixels, step, function () {
      canvas.restore_buffer();
      set_interactive();
      callback();
    }, 0);
  }
  
  return {
    'init': function (element, callback) {
      cursor = {
        'x': undefined,
        'y': undefined,
        'hidden': true,
        'out_of_bounds': true,
        'image': 'box',
        'colour': RGB.b_cyan
      };
      scale_factor = Storage.scale_factor();
      canvas = element;
      ctx = canvas.getContext('2d');
      canvas.addEventListener('mousemove', mouse_move, true);
      canvas.addEventListener('mouseout', mouse_out, true);
    },
    
    'line_beam': function (sx, sy, dx, dy, callback) {
      start_beam(Storage.line_beam(RGB.b_white), Storage.line_beam(RGB.black), 20, Canvas.line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 1, callback);
    },
    
    'spell_beam': function (sx, sy, dx, dy, callback) {
      start_beam(Storage.spell_beam(RGB.b_cyan), Storage.spell_beam(RGB.black), 30, Canvas.line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 1, callback);
    },
    
    'burn_beam': function (sx, sy, dx, dy, callback) {
      start_beam(Storage.burn_beam(RGB.b_yellow), Storage.burn_beam(RGB.black), 44, Canvas.line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 4, callback);
    },
    
    'lightning': function (sx, sy, dx, dy, callback) {
      start_beam(Storage.burn_beam(RGB.b_white), Storage.burn_beam(RGB.black), 44, Canvas.line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 4, callback);
    },
    
    'magic_bolt': function (sx, sy, dx, dy, callback) {
      start_beam(Storage.burn_beam(RGB.b_yellow), Storage.burn_beam(RGB.black), 1, Canvas.line(sx * 16 + 16, sy * 16 + 16, dx * 16 + 16, dy * 16 + 16, scale_factor), 1, callback);
    },
    
    'flash_cell': function (x, y, callback) {
      var visible = World.visible(x, y), frames;
      if (visible) {
        if (!visible.wizard && !visible.dead) {
          frames = Storage.flash_object(visible.id).sub_array(visible.frame_index);
          start_effect(frames, x, y, function () {
            callback();
          }, 3);
        }
      }
    },
    
    'dragon_burn_effect': function (x, y, callback) {
      start_effect(Storage.effect('dragon_burn', RGB.b_yellow), x, y, function () {
        callback();
      }, 1);
    },
    
    'attack_effect': function (x, y, callback) {
      start_effect(Storage.effect('attack', RGB.b_yellow), x, y, function () {
        callback();
      }, 1);
    },
    
    'exploding_circle_effect': function (x, y, callback) {
      start_effect(Storage.effect('exploding_circle', RGB.b_white), x, y, function () {
        callback();
      }, 1);
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
    
    'draw_text': function (image) {
      draw_text(image);
    },
    
    'clear_text': function () {
      draw_text();
    },
    
    'cast_text': function (wizard_name, spell_name, range, callback) {
      wizard_name = Storage.text(wizard_name + ' ', RGB.b_yellow);
      spell_name = Storage.text(spell_name + '  ', RGB.b_green);
      range = Storage.text(String(range), RGB.b_white);
      freeze();
      draw_text(wizard_name);
      setTimeout(function () {
        draw_text(Canvas.tile_horizontal([wizard_name, spell_name]));
        setTimeout(function () {
          draw_text(Canvas.tile_horizontal([wizard_name, spell_name, range]));
          setTimeout(function () {
            set_interactive();
            callback();
          }, 300);
        }, 300);
      }, 300);
    },
    
    'draw_arena': function () {
      erase();
      ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, RGB.blue, RGB.black), 0, 0);
      set_interactive();
    },
    
    'update_cell': function (x, y, info_update) {
      update_cell(x, y, info_update);
    }
  };
}());