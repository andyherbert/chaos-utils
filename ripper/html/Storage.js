/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, create_canvas: true, http_get: true */
var Storage = (function () {
  var json, objects = [], character_set = [], borders = [], cursors = [], wizards = [], weapons = [], rainbow_object = [], rainbow_wizard = [], rainbow_weapon = [];
  
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
  
  function render_object(anim, ink, paper) {
    var output = [];
    anim.each_pair(function (key, frame) {
      output[output.length] = render_sprite(frame.bytes, (ink === undefined) ? frame.ink : ink, (paper === undefined) ? frame.paper : paper);
    });
    return output;
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
    if (borders[ink] === undefined) {
      borders[ink] = [];
    }
    if (borders[ink][paper] === undefined) {
      borders[ink][paper] = [render_sprite(json.border[0], ink, paper), render_sprite(json.border[1], ink, paper)];
    }
    return borders[ink][paper];
  }
  
  function fetch_wizard(wizard_index, ink) {
    if (wizards[ink] === undefined) {
      wizards[ink] = [];
    }
    if (wizards[ink][wizard_index] === undefined) {
      wizards[ink][wizard_index] = render_sprite(json.wizards.characters[wizard_index], ink, 0);
    }
    return wizards[ink][wizard_index];
  }
  
  function fetch_weapon(key, ink) {
    if (weapons[ink] === undefined) {
      weapons[ink] = {};
    }
    if (weapons[ink][key] === undefined) {
      weapons[ink][key] = [];
      json.wizards.weapons[key].each(function (frame) {
        weapons[ink][key][weapons[ink][key].length] = render_sprite(frame, ink);
      });
    }
    return weapons[ink][key];
  }
  
  function init(response_text) {
    json = JSON.parse(response_text);
    json.palette = expand_palette(json.palette);
  }
  
  return {
    "init": function (success, failure) {
      http_get('chaos.json', function (response_text) {
        init(response_text);
        success(json);
      }, function (status) {
        failure(status);
      });
    },
    
    "object": function (object_id) {
      if (objects[object_id] === undefined) {
        objects[object_id] = json.objects[object_id].clone();
        objects[object_id].anim = render_object(json.objects[object_id].anim);
        objects[object_id].corpse = render_sprite(json.objects[object_id].corpse.bytes, json.objects[object_id].corpse.ink, json.objects[object_id].corpse.paper);
      }
      return objects[object_id];
    },
    
    "flash_object": function (object_id) {
      var ink;
      if (rainbow_object[object_id] === undefined) {
        rainbow_object[object_id] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_object[object_id][ink] = render_object(json.objects[object_id].anim, 15 - ink, 0);
        }
      }
      return rainbow_object[object_id];
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
    },
    
    "cursor": function (name, ink) {
      if (cursors[ink] === undefined) {
        cursors[ink] = {};
      }
      if (cursors[ink][name] === undefined) {
        cursors[ink][name] = render_sprite(json.cursors[name], ink);
      }
      return cursors[ink][name];
    },
    
    "wizard": function (wizard_index, ink) {
      return fetch_wizard(wizard_index, ink);
    },
    
    "flash_wizard": function (wizard_index) {
      var ink;
      if (rainbow_wizard[wizard_index] === undefined) {
        rainbow_wizard[wizard_index] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_wizard[wizard_index][ink] = fetch_wizard(wizard_index, 15 - ink);
        }
      }
      return rainbow_wizard[wizard_index];
    },
    
    "weapon": function (name, ink) {
      return fetch_weapon(name, ink);
    },
    
    "flash_weapon": function (name) {
      var ink;
      if (rainbow_weapon[name] === undefined) {
        rainbow_weapon[name] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_weapon[name][ink] = fetch_weapon(name, 15 - ink);
        }
      }
      return rainbow_weapon[name];
    },
    
    "spell": function (index) {
      return json.spells[index];
    },
    
    "number_of_spells": function () {
      return json.spells.length;
    },
    
    "interface_message": function (index) {
      return json.messages['interface'][index];
    },
    
    "in_game_message": function (index) {
      return json.messages.in_game[index];
    },
    
    "constant": function (key) {
      return json.constants[key];
    },
    
    "initial_positions": function (number_of_wizards) {
      return json.initial_positions[number_of_wizards - 2];
    }
  };
}());