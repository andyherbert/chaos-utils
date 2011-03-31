/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, create_canvas: true, http_get: true */
var ChaosLibrary = (function () {
  var json, parsed_objects = [], character_set = [], border = [];
  
  function expand_palette(palette) {
    var output = [];
    palette.each(function (colour) {
      output[output.length] = [parseInt(colour.substr(0, 2), 16), parseInt(colour.substr(2, 2), 16), parseInt(colour.substr(4, 2), 16)];
    });
    return output;
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
          image_data = insert_rgb(image_data, x, y, json.palette[ink]);
        } else if (paper !== undefined) {
          image_data = insert_rgb(image_data, x, y, json.palette[paper]);
        }
      });
    });
    // console.log('rendered sprite');
    ctx.putImageData(image_data, 0, 0);
    return scale(canvas, 2);
  }
  
  function fetch_character(key, ink, paper) {
    if (character_set[ink] === undefined) {
      character_set[ink] = [];
    }
    if (character_set[ink][paper] === undefined) {
      character_set[ink][paper] = [];
    }
    if (character_set[ink][paper][key] === undefined) {
      character_set[ink][paper][key] = render_sprite(json.character_set[key], ink, paper);
    }
    return character_set[ink][paper][key];
  }
  
  function fetch_border(ink, paper) {
    if (border[ink] === undefined) {
      border[ink] = [];
    }
    if (border[ink][paper] === undefined) {
      border[ink][paper] = [render_sprite(json.border[0], ink, paper), render_sprite(json.border[1], ink, paper)];
    }
    return border[ink][paper];
  }
  
  function init(response_text) {
    json = JSON.parse(response_text);
    json.palette = expand_palette(json.palette);
  }
  
  return {
    "fetch": function (success, failure) {
      http_get('chaos.json', function (response_text) {
        init(response_text);
        success(json);
      }, function (status) {
        failure(status);
      });
    },
    
    "object": function (object_id) {
      if (parsed_objects[object_id] === undefined) {
        parsed_objects[object_id] = json.objects[object_id];
        parsed_objects[object_id].anim.each_pair(function (key, frame) {
          parsed_objects[object_id].anim[key] = render_sprite(frame.bytes, frame.ink, frame.paper);
        });
      }
      return parsed_objects[object_id];
    },
    
    "text": function (text, ink, paper) {
      var canvas, ctx, letters = [], width = 0, height = 0;
      text.each_char_with_index(function (character, index) {
        canvas = fetch_character(character, ink, paper);
        width += canvas.width;
        height = Math.max(height, canvas.height);
        letters[letters.length] = canvas;
      });
      canvas = create_canvas(width, height);
      ctx = canvas.getContext('2d');
      width = 0;
      letters.each(function (character) {
        ctx.drawImage(character, width, 0);
        width += character.width;
      });
      return canvas;
    },
    
    "border": function (width, height, ink, paper) {
      var canvas, ctx, border = fetch_border(ink, paper), size = border[0].width / 2, i;
      canvas = create_canvas(width, height);
      ctx = canvas.getContext('2d');
      for (i = size; i < height - size; i += size) {
        ctx.drawImage(border[0], 0, 0, size, size, 0, i, size, size);
        ctx.drawImage(border[0], size, 0, size, size, width - size, i, size, size);
      }
      for (i = size; i < width - size; i += size) {
        ctx.drawImage(border[0], 0, size, size, size, i, 0, size, size);
        ctx.drawImage(border[0], size, size, size, size, i, height - size, size, size);
      }
      ctx.drawImage(border[1], 0, 0, size, size, 0, 0, size, size);
      ctx.drawImage(border[1], size, 0, size, size, width - size, 0, size, size);
      ctx.drawImage(border[1], 0, size, size, size, 0, height - size, size, size);
      ctx.drawImage(border[1], size, size, size, size, width - size, height - size, size, size);
      return canvas;
    }
  };
}());

// function render_text(text, ink, paper) {
// }

// function dump_gfx() {
//   var ink, paper;
//   for (ink = 1; ink < 16; ink += 1) {
//     if (ink !== 8) {
//       $('output').appendChild(render_text(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_£abcdefghijklmnopqrstuvwxyz{|}~©", ink));
//     }
//   }
//   $('output').appendChild(document.createElement('BR'));
//   chaos.cursors.each(function (cursor) {
//     for (ink = 1; ink < 16; ink += 1) {
//       if (ink !== 8) {
//         $('output').appendChild(render_sprite(cursor, ink));
//       }
//     }
//     $('output').appendChild(document.createElement('BR'));
//   });
//   chaos.wizards.characters.each(function (character) {
//     for (ink = 1; ink < 16; ink += 1) {
//       if (ink !== 8) {
//         $('output').appendChild(render_sprite(character, ink));
//       }
//     }
//     $('output').appendChild(document.createElement('BR'));
//   });
//   chaos.wizards.weapons.each(function (weapon) {
//     weapon.each(function (frame) {
//       for (ink = 1; ink < 16; ink += 1) {
//         if (ink !== 8) {
//           $('output').appendChild(render_sprite(frame, ink));
//         }
//       }
//     });
//     $('output').appendChild(document.createElement('BR'));
//   });
//   chaos.objects.each(function (object) {
//     object.anim.each(function (frame) {
//       $('output').appendChild(render_sprite(frame.bytes, frame.ink, frame.paper));
//     });
//   });
//   $('output').appendChild(document.createElement('BR'));
//   chaos.border.each(function (border) {
//     for (paper = 0; paper < 7; paper += 1) {
//       for (ink = 1; ink < 16; ink += 1) {
//         if (ink !== paper) {
//           $('output').appendChild(render_sprite(border, ink, paper));
//         }
//       }
//     }
//   });
// }
