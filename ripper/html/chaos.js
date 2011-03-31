/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
var chaos;

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
  return scale(canvas, 2);
}

function render_text(text, ink, paper) {
  var canvas = create_canvas(text.length * 16, 32), ctx = canvas.getContext('2d');
  text.each_char_with_index(function (character, index) {
    ctx.drawImage(render_sprite(chaos.character_set[character], ink, paper), index * 16, 0);
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
  var ink, paper;
  for (ink = 1; ink < 16; ink += 1) {
    if (ink !== 8) {
      $('output').appendChild(render_text(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_£abcdefghijklmnopqrstuvwxyz{|}~©", ink));
    }
  }
  $('output').appendChild(document.createElement('BR'));
  chaos.cursors.each(function (cursor) {
    for (ink = 1; ink < 16; ink += 1) {
      if (ink !== 8) {
        $('output').appendChild(render_sprite(cursor, ink));
      }
    }
    $('output').appendChild(document.createElement('BR'));
  });
  chaos.wizards.characters.each(function (character) {
    for (ink = 1; ink < 16; ink += 1) {
      if (ink !== 8) {
        $('output').appendChild(render_sprite(character, ink));
      }
    }
    $('output').appendChild(document.createElement('BR'));
  });
  chaos.wizards.weapons.each(function (weapon) {
    weapon.each(function (frame) {
      for (ink = 1; ink < 16; ink += 1) {
        if (ink !== 8) {
          $('output').appendChild(render_sprite(frame, ink));
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
  $('output').appendChild(document.createElement('BR'));
  chaos.border.each(function (border) {
    for (paper = 0; paper < 7; paper += 1) {
      for (ink = 1; ink < 16; ink += 1) {
        if (ink !== paper) {
          $('output').appendChild(render_sprite(border, ink, paper));
        }
      }
    }
  });
}

function init() {
  http_get('chaos.json', function (obj) {
    chaos = obj;
    chaos.palette = expand_palette(chaos.palette);
    dump_gfx();
  });
}
