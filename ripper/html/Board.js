/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, create_canvas: true, http_get: true, Storage: true */

var Board = (function () {
  var scale_factor, canvas, ctx, anim_timer, objects = [];
  
  function draw_object(object) {
    ctx.drawImage(object.anim[object.frame_index], (8 + object.x * 16) * scale_factor, (8 + object.y * 16) * scale_factor);
  }
  
  function erase(x, y) {
    if ((x !== undefined) && (y !== undefined)) {
      ctx.clearRect((8 + x * 16) * scale_factor, (8 + y * 16) * scale_factor, 16 * scale_factor, 16 * scale_factor);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  function draw_border(ink, paper) {
    ctx.drawImage(Storage.border(256 * scale_factor, 176 * scale_factor, ink, (paper === undefined) ? 0 : paper), 0, 0);
  }
  
  function do_tic() {
    objects.each(function (object) {
      object.frame_tic += 1;
      if (object.frame_tic === object.anim_timing) {
        object.frame_tic = 0;
        object.frame_index = (object.frame_index === 3) ? 0 : (object.frame_index + 1);
        draw_object(object);
      }
    });
  }
  
  return {
    "init": function (element, func) {
      scale_factor = Storage.scale_factor();
      canvas = element;
      ctx = canvas.getContext('2d');
      ctx.drawImage(Storage.loading_screen(), 0, 0);
      setTimeout(function () {
        func();
      }, 3000);
    },
    
    "add_object": function (object_id, x, y) {
      var object = Storage.new_object(object_id);
      object.x = x;
      object.y = y;
      object.frame_index = 0;
      object.frame_tic = 0;
      objects[y * 15 + x] = object;
      draw_object(object);
    },
    
    "draw_arena": function () {
      erase();
      draw_border(1);
      anim_timer = setInterval(do_tic, 20);
    },
    
    "text": function (text, ink) {
      ctx.drawImage(Storage.text(text, (ink === undefined) ? 15 : ink, 0), 0, 176 * scale_factor);
    }
  };
}());