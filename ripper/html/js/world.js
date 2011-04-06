/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Board: true */

var World = (function () {
  var layer = {'corpse': [], 'wizard': [], 'object': [], 'blob': []}, anim_timer;
  
  function get(layer, x, y) {
    return layer[y * 15 + x];
  }
  
  function add_object(layer, x, y, object, dead) {
    object.x = x;
    object.y = y;
    object.tic_count = 0;
    object.frame_index = 0;
    object.dead = dead;
    layer[y * 15 + x] = object;
    Board.update_cell(x, y);
  }
  
  function remove_object(layer, x, y) {
    delete (layer[y * 15 + x]);
    Board.update_cell(x, y);
  }
  
  function do_tic() {
    layer.each_pair(function (layer_name, objects) {
      objects.each(function (object) {
        if ((object !== undefined) && (layer_name !== 'corpse')) {
          object.tic_count += 1;
          if (object.tic_count === object.anim_timing) {
            object.tic_count = 0;
            object.frame_index = (object.frame_index === 3) ? 0 : (object.frame_index + 1);
            Board.update_cell(object.x, object.y);
          }
        }
      });
    });
  }
  
  return {
    'add_corpse': function (x, y, object) {
      add_object(layer.corpse, x, y, object, true);
    },
    
    'remove_corpse': function (x, y) {
      remove_object(layer.corpse, x, y);
    },
    
    'add_wizard': function (x, y, object) {
      add_object(layer.wizard, x, y, object, false);
    },
    
    'remove_wizard': function (x, y) {
      remove_object(layer.wizard, x, y);
    },
    
    'add_object': function (x, y, object) {
      add_object(layer.object, x, y, object, false);
    },
    
    'kill_object': function (x, y) {
      add_object(layer.corpse, x, y, get(layer.object, x, y), true);
      remove_object(layer.object, x, y);
    },
    
    'remove_object': function (x, y) {
      remove_object(layer.object, x, y);
    },
    
    'move_object': function (sx, sy, dx, dy) {
      add_object(layer.object, dx, dy, get(layer.object, sx, sy));
      remove_object(layer.object, sx, sy);
    },
    
    'add_blob': function (x, y, object) {
      add_object(layer.blob, x, y, object);
    },
    
    'remove_blob': function (x, y) {
      remove_object(layer.blob, x, y);
    },
    
    'get_corpse': function (x, y) {
      return get(layer.corpse, x, y);
    },
    
    'get_wizard': function (x, y) {
      return get(layer.wizard, x, y);
    },
    
    'get_object': function (x, y) {
      return get(layer.object, x, y);
    },
    
    'get_blob': function (x, y) {
      return get(layer.blob, x, y);
    },
    
    'freeze': function () {
      clearInterval(anim_timer);
    },
    
    'unfreeze': function () {
      anim_timer = setInterval(do_tic, 20);
    },
    
    'get_slice': function (x, y) {
      var i = y * 15 + x;
      return {'corpse': layer.corpse[i], 'wizard': layer.wizard[i], 'object': layer.object[i], 'blob': layer.blob[i]};
    },
    
    'visible': function (x, y) {
      var i = y * 15 + x;
      return (layer.blob[i] || layer.object[i] || layer.wizard[i] || layer.corpse[i]);
    }
  };
}());
