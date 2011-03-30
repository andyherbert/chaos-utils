/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
var chaos, output;

function $(element_id) {
  return document.getElementById(element_id);
}

function http_get(url, success, failure) {
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200 || req.status === 0) {
        if (success !== undefined) {
          success(JSON.parse(req.responseText));
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
  this.each_pair(function (key, value) {
    func(key);
  });
};

Object.prototype.each = function (func) {
  this.each_pair(function (key, value) {
    func(value);
  });
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

function create_canvas(width, height) {
  var canvas = document.createElement('CANVAS');
  canvas.setAttribute('WIDTH', width);
  canvas.setAttribute('HEIGHT', height);
  return canvas;
}

function get_bits(bytes) {
  var image_width = bytes.length / 32, output = [], i, x, y, bits;
  for (i = 0; i < bytes.length; i += 2 * image_width) {
    y = i / (2 * image_width);
    output[y] = '';
    for (x = 0; x < image_width; x += 1) {
      bits = parseInt(bytes.substr(i + x * 2, 2), 16).toString(2);
      while (bits.length < 8) { bits = '0' + bits; }
      output[y] += bits;
    }
  }
  return output;
}

function insert_rgb(image_data, x, y, target_array) {
  var i, index = (y * image_data.width + x) * 4;
  for (i = 0; i < 3; i += 1) {
    image_data.data[index + i] = target_array[i];
  }
  image_data.data[index + 3] = 255;
  return image_data;
}

function render_sprite(bytes, ink, paper) {
  var bits, canvas, ctx, image_data;
  
  bits = get_bits(bytes);
  canvas = create_canvas(bits[0].length, bits.length);
  ctx = canvas.getContext('2d');
  image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  bits.each_pair(function (y, line) {
    line.each_char_with_index(function (character, x) {
      if (line.substr(x, 1) === '1') {
        image_data = insert_rgb(image_data, x, y, chaos.palette[ink]);
      } else if (paper !== undefined) {
        image_data = insert_rgb(image_data, x, y, chaos.palette[paper]);
      }
    });
  });
  ctx.putImageData(image_data, 0, 0);
  return canvas;
}

function render_text(text, ink, paper) {
  var canvas = create_canvas(text.length * 8, 16), ctx = canvas.getContext('2d');
  text.each_char_with_index(function (character, index) {
    ctx.drawImage(render_sprite(chaos.character_set[character], ink, paper), index * 8, 0);
  });
  return canvas;
}

function expand_palette(palette) {
  var output = [];
  palette.each(function (colour) {
    output[output.length] = [parseInt(colour.substr(0, 2), 16), parseInt(colour.substr(2, 2), 16), parseInt(colour.substr(4, 2), 16)];
  });
  return output;
}

function dump_gfx() {
  var pen;
  for (pen = 1; pen < 16; pen += 1) {
    if (pen !== 8) {
      $('output').appendChild(render_text(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_£abcdefghijklmnopqrstuvwxyz{|}~©", pen));
    }
  }
  $('output').appendChild(document.createElement('BR'));
  chaos.cursors.each(function (cursor) {
    for (pen = 1; pen < 16; pen += 1) {
      if (pen !== 8) {
        $('output').appendChild(render_sprite(cursor, pen));
      }
    }
    $('output').appendChild(document.createElement('BR'));
  });
  chaos.wizards.characters.each(function (character) {
    for (pen = 1; pen < 16; pen += 1) {
      if (pen !== 8) {
        $('output').appendChild(render_sprite(character, pen));
      }
    }
    $('output').appendChild(document.createElement('BR'));
  });
  chaos.wizards.weapons.each(function (weapon) {
    weapon.each(function (frame) {
      for (pen = 1; pen < 16; pen += 1) {
        if (pen !== 8) {
          $('output').appendChild(render_sprite(frame, pen));
        }
      }
    });
    $('output').appendChild(document.createElement('BR'));
  });
  chaos.objects.each(function (object) {
    object.anim.each(function (frame) {
      $('output').appendChild(render_sprite(frame.bytes, frame.ink, frame.paper));
    });
  });
}

function init() {
  http_get('chaos.json', function (obj) {
    chaos = obj;
    chaos.palette = expand_palette(chaos.palette);
    dump_gfx();
  });
}
