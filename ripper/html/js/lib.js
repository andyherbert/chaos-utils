/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
var firefox = (navigator.userAgent.indexOf('Firefox') !== -1);

function $(element_id) {
  return document.getElementById(element_id);
}

function http_get(url, success, failure) {
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200 || req.status === 0) {
        if (success !== undefined) {
          success(req.responseText);
        }
      } else {
        if (failure !== undefined) {
          failure(req.status);
        }
      }
    }
  };
  req.send();
}

Object.prototype.each_pair = function (func) {
  var key;
  for (key in this) {
    if (this.hasOwnProperty(key)) {
      func(key, this[key]);
    }
  }
};

Object.prototype.each_key = function (func) {
  var key;
  for (key in this) {
    if (this.hasOwnProperty(key)) {
      func(key);
    }
  }
};

Object.prototype.each = function (func) {
  var key;
  for (key in this) {
    if (this.hasOwnProperty(key)) {
      func(this[key]);
    }
  }
};

Object.prototype.each_with_index = function (func) {
  var i;
  for (i = 0; i < this.length; i += 1) {
    func(this[i], i);
  }
};

Object.prototype.each_char_with_index = function (func) {
  var i;
  for (i = 0; i < this.length; i += 1) {
    func(this.substr(i, 1), i);
  }
};

Object.prototype.each_char = function (func) {
  this.each_char_with_index(function (character, index) {
    func(character);
  });
};

Object.prototype.clone = function () {
  var i, obj = {};
  for (i in this) {
    if (this.hasOwnProperty(i)) {
      if ((typeof this[i] === 'object') && (this[i] !== null)) {
        obj[i] = this[i].clone();
      } else {
        obj[i] = this[i];
      }
    }
  }
  return obj;
};

Object.prototype.sub_array = function (sub_index) {
  var i, output = [];
  for (i = 0; i < this.length; i += 1) {
    output[output.length] = this[i][sub_index];
  }
  return output;
};

Object.prototype.hex_to_binary = function () {
  var output = parseInt(this, 16).toString(2);
  while (output.length < 8) {
    output = '0' + output;
  }
  return output;
};

Object.prototype.universal_offsetX = function () {
  return firefox ? (this.pageX - this.target.offsetLeft) : this.offsetX;
};

Object.prototype.universal_offsetY = function () {
  return firefox ? (this.pageY - this.target.offsetTop) : this.offsetY;
};

Object.prototype.set_xy = function (x, y) {
  this.x = x;
  this.y = y;
};

function create_canvas(width, height) {
  var canvas = document.createElement('CANVAS');
  canvas.setAttribute('WIDTH', width);
  canvas.setAttribute('HEIGHT', height);
  return canvas;
}

Object.prototype.insert_rgb = function (x, y, rgb) {
  var i, index = (y * this.width + x) * 4;
  for (i = 0; i < 3; i += 1) {
    this.data[index + i] = rgb[i];
  }
  this.data[index + 3] = 255;
};

Object.prototype.save_buffer = function () {
  this.buffered_image = create_canvas(this.width, this.height);
  this.buffered_image.getContext('2d').drawImage(this, 0, 0);
};

Object.prototype.restore_buffer = function () {
  this.getContext('2d').drawImage(this.buffered_image, 0, 0);
};

function tile_horizontal(array_of_items) {
  var width = 0, height = 0, x = 0, output, ctx;
  array_of_items.each(function (canvas) {
    width += canvas.width;
    height = Math.max(height, canvas.height);
  });
  output = create_canvas(width, height);
  ctx = output.getContext('2d');
  array_of_items.each(function (canvas) {
    ctx.drawImage(canvas, x, 0);
    x += canvas.width;
  });
  return output;
}

function tile_vertical(array_of_items) {
  var width = 0, height = 0, y = 0, output, ctx;
  array_of_items.each(function (canvas) {
    width = Math.max(width, canvas.width);
    height += canvas.height;
  });
  output = create_canvas(width, height);
  ctx = output.getContext('2d');
  array_of_items.each(function (canvas) {
    ctx.drawImage(canvas, 0, y);
    y += canvas.height;
  });
  return output;
}

function line(sx, sy, dx, dy, scale) {
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

function scale(canvas, factor) {
  var image_data, dest, dest_ctx, dest_image_data, source_y, source_x, source_index, i, colour = [], x, y, target_index;
  image_data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  dest = create_canvas(canvas.width * factor, canvas.height * factor);
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
}
