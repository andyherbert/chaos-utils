/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Canvas = (function () {
  function create(width, height) {
    var canvas = document.createElement('CANVAS');
    canvas.setAttribute('WIDTH', width);
    canvas.setAttribute('HEIGHT', height);
    return canvas;
  }
  
  return {
    'create': function (width, height) {
      return create(width, height);
    },
    
    'scale': function (canvas, factor) {
      var image_data, dest, dest_ctx, dest_image_data, source_y, source_x, source_index, i, colour = [], x, y, target_index;
      image_data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      dest = create(canvas.width * factor, canvas.height * factor);
      dest_ctx = dest.getContext('2d');
      dest_image_data = dest_ctx.getImageData(0, 0, dest.width, dest.height);
      for (source_y = 0; source_y < canvas.height; source_y += 1) {
        for (source_x = 0; source_x < canvas.width; source_x += 1) {
          source_index = (source_y * canvas.width + source_x) * 4;
          for (i = 0; i < 4; i += 1) { colour[i] = image_data.data[source_index + i]; }
          for (y = 0; y < factor; y += 1) {
            for (x = 0; x < factor; x += 1) {
              target_index = ((source_y * factor + y) * dest.width + source_x * factor + x) * 4;
              for (i = 0; i < 4; i += 1) { dest_image_data.data[target_index + i] = colour[i]; }
            }
          }
        }
      }
      dest_ctx.putImageData(dest_image_data, 0, 0);
      return dest;
    },
    
    'tile_horizontal': function (array_of_items) {
      var width = 0, height = 0, x = 0, output, ctx;
      array_of_items.each(function (canvas) {
        if (canvas !== undefined) {
          width += canvas.width;
          height = Math.max(height, canvas.height);
        }
      });
      output = create(width, height);
      ctx = output.getContext('2d');
      array_of_items.each(function (canvas) {
        if (canvas !== undefined) {
          ctx.drawImage(canvas, x, 0);
          x += canvas.width;
        }
      });
      return output;
    },
    
    'tile_vertical': function (array_of_items) {
      var width = 0, height = 0, y = 0, output, ctx;
      array_of_items.each(function (canvas) {
        if (canvas !== undefined) {
          width = Math.max(width, canvas.width);
          height += canvas.height;
        }
      });
      output = create(width, height);
      ctx = output.getContext('2d');
      array_of_items.each(function (canvas) {
        if (canvas !== undefined) {
          ctx.drawImage(canvas, 0, y);
          y += canvas.height;
        }
      });
      return output;
    },
    
    'line': function (sx, sy, dx, dy, scale) {
      var output = [], delta_x, delta_y, step_x, step_y, err, err2;
      delta_x = Math.abs(dx - sx);
      delta_y = Math.abs(dy - sy);
      step_x = (sx < dx) ? 1 : -1;
      step_y = (sy < dy) ? 1 : -1;
      err = delta_x - delta_y;
      scale = (scale === undefined) ? 1 : scale;
      while (true) {
        output[output.length] = [sx * scale, sy * scale];
        if ((sx === dx) && (sy === dy)) {
          return output;
        }
        err2 = 2 * err;
        if (err2 > -delta_y) {
          err = err - delta_y;
          sx = sx + step_x;
        }
        if (err2 <  delta_x) {
          err = err + delta_x;
          sy = sy + step_y;
        }
      }
    }
  };
}());