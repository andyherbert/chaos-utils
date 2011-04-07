/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global $: true, Canvas: true, Ajax: true */
var Storage = (function () {
  var scale_factor, json, palette, objects = [], character_set = [], borders = [], cursors = [], wizards = [], weapons = [], effect = [], rainbow_object = [], rainbow_wizard = [], rainbow_weapon = [], loading_screen, beam = {};
  
  function expand_palette(palette) {
    var output = [];
    palette.each_pair(function (num, colour) {
      output[num] = [parseInt(colour.substr(0, 2), 16), parseInt(colour.substr(2, 2), 16), parseInt(colour.substr(4, 2), 16)];
    });
    return output;
  }
  
  function get_bits(bytes) {
    var image_width = bytes.length / 32, output = [], i, x, y;
    for (i = 0; i < bytes.length; i += 2 * image_width) {
      y = i / (2 * image_width);
      output[y] = '';
      for (x = 0; x < image_width; x += 1) {
        output[y] += bytes.substr(i + x * 2, 2).hex_to_binary();
      }
    }
    return output;
  }
  
  function render_sprite(bytes, ink, paper) {
    var bits, canvas, ctx, image_data;
    bits = get_bits(bytes);
    canvas = Canvas.create(bits[0].length, bits.length);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    bits.each_pair(function (y, line) {
      line.each_char_with_index(function (character, x) {
        if (line.substr(x, 1) === '1') {
          image_data.insert_rgb(x, y, palette[ink]);
        } else if (paper !== undefined) {
          image_data.insert_rgb(x, y, palette[paper]);
        }
      });
    });
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale_factor);
  }
  
  function render_object(anim, ink, paper) {
    var output = [];
    anim.each_pair(function (num, frame) {
      output[num] = render_sprite(frame.bytes, (ink === undefined) ? frame.ink : ink, (paper === undefined) ? frame.paper : paper);
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
      json.wizards.weapons[key].each_pair(function (num, frame) {
        weapons[ink][key][num] = render_sprite(frame, ink);
      });
    }
    return weapons[ink][key];
  }
  
  function get_attribute(attribute) {
    return {
      'flash': (attribute.substr(0, 1) === '1'),
      'bright': (attribute.substr(1, 1) === '1'),
      'paper': parseInt(attribute.substr(2, 3), 2),
      'ink': parseInt(attribute.substr(5, 3), 2)
    };
  }
  
  function parse_screen(raw_screen) {
    var output = {'pixels': [], 'attributes': []}, x;
    raw_screen.pixels.each_pair(function (y, line) {
      output.pixels[y] = '';
      for (x = 0; x < line.length; x += 2) {
        output.pixels[y] += line.substr(x, 2).hex_to_binary();
      }
    });
    raw_screen.attributes.each_pair(function (y, attribute) {
      output.attributes[y] = [];
      for (x = 0; x < attribute.length; x += 2) {
        output.attributes[y][x / 2] = get_attribute(attribute.substr(x, 2).hex_to_binary());
      }
    });
    return output;
  }
  
  function render_screen(raw_screen) {
    var parsed_screen = parse_screen(raw_screen), canvas, ctx, image_data, x, y, attrib_y, attribute, ink, paper;
    canvas = Canvas.create(parsed_screen.pixels[0].length, parsed_screen.pixels.length);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (y = 0; y < canvas.height; y += 1) {
      attrib_y = Math.floor(y / 8);
      for (x = 0; x < canvas.width; x += 1) {
        attribute = parsed_screen.attributes[attrib_y][Math.floor(x / 8)];
        if (attribute.bright) {
          ink = attribute.ink + 8;
          paper = attribute.paper + 8;
        } else {
          ink = attribute.ink;
          paper = attribute.paper;
        }
        image_data.insert_rgb(x, y, (parsed_screen.pixels[y].substr(x, 1) === '1') ? palette[ink] : palette[paper]);
      }
    }
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale_factor);
  }
  
  function create_line_beam(ink) {
    var canvas, ctx, image_data;
    canvas = Canvas.create(1, 1);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    image_data.insert_rgb(0, 0, palette[ink]);
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale_factor);
  }
  
  function create_spell_beam(ink) {
    var canvas, ctx, image_data;
    canvas = Canvas.create(3, 3);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    image_data.insert_rgb(1, 0, palette[ink]);
    image_data.insert_rgb(0, 1, palette[ink]);
    image_data.insert_rgb(1, 1, palette[ink]);
    image_data.insert_rgb(2, 1, palette[ink]);
    image_data.insert_rgb(1, 2, palette[ink]);
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale_factor);
  }
  
  function create_burn_beam(ink) {
    var canvas, ctx, image_data;
    canvas = Canvas.create(7, 7);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    image_data.insert_rgb(3, 2, palette[ink]);
    image_data.insert_rgb(2, 3, palette[ink]);
    image_data.insert_rgb(3, 3, palette[ink]);
    image_data.insert_rgb(4, 3, palette[ink]);
    image_data.insert_rgb(3, 4, palette[ink]);
    image_data.insert_rgb(3, 0, palette[ink]);
    image_data.insert_rgb(1, 1, palette[ink]);
    image_data.insert_rgb(5, 1, palette[ink]);
    image_data.insert_rgb(0, 3, palette[ink]);
    image_data.insert_rgb(6, 3, palette[ink]);
    image_data.insert_rgb(1, 5, palette[ink]);
    image_data.insert_rgb(5, 5, palette[ink]);
    image_data.insert_rgb(3, 6, palette[ink]);
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale_factor);
  }
  
  return {
    'init': function (factor, success, failure) {
      Ajax.get('json/chaos.json', function (response_text) {
        scale_factor = factor;
        json = JSON.parse(response_text);
        palette = expand_palette(json.palette);
        success(json);
      }, function (status) {
        failure(status);
      });
    },
    
    'scale_factor': function () {
      return scale_factor;
    },
    
    'new_object': function (object_id, creator) {
      var output = json.objects[object_id].clone();
      if (objects[object_id] === undefined) {
        objects[object_id] = json.objects[object_id].clone();
        objects[object_id].anim = render_object(json.objects[object_id].anim);
        if (objects[object_id].corpse) {
          objects[object_id].corpse = render_sprite(json.objects[object_id].corpse.bytes, json.objects[object_id].corpse.ink, json.objects[object_id].corpse.paper);
        }
      }
      output.anim = objects[object_id].anim;
      output.corpse = objects[object_id].corpse;
      output.creator = creator;
      return output;
    },
    
    'flash_object': function (object_id) {
      var ink;
      if (rainbow_object[object_id] === undefined) {
        rainbow_object[object_id] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_object[object_id][ink] = render_object(json.objects[object_id].anim, 15 - ink, 0);
        }
      }
      return rainbow_object[object_id];
    },
    
    'text': function (text, ink, paper) {
      var canvas, ctx, letters = [], width = 0, height = 0;
      text.each_char_with_index(function (character, index) {
        canvas = fetch_character(character, ink, paper);
        width += canvas.width;
        height = Math.max(height, canvas.height);
        letters[letters.length] = canvas;
      });
      canvas = Canvas.create(width, height);
      ctx = canvas.getContext('2d');
      width = 0;
      letters.each(function (character) {
        ctx.drawImage(character, width, 0);
        width += character.width;
      });
      return canvas;
    },
    
    'border': function (width, height, ink, paper) {
      var canvas, ctx, border = fetch_border(ink, paper), size = border[0].width / 2, i;
      canvas = Canvas.create(width, height);
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
    
    'cursor': function (name, ink) {
      if (cursors[ink] === undefined) {
        cursors[ink] = {};
      }
      if (cursors[ink][name] === undefined) {
        cursors[ink][name] = render_sprite(json.cursors[name], ink);
      }
      return cursors[ink][name];
    },
    
    'wizard': function (wizard_index, ink) {
      return fetch_wizard(wizard_index, ink);
    },
    
    'wizard_timing': function () {
      return json.wizards.timing;
    },
    
    'effect': function (name, ink) {
      if (effect[ink] === undefined) {
        effect[ink] = {};
      }
      if (effect[ink][name] === undefined) {
        effect[ink][name] = [];
        json.effects[name].each_pair(function (num, bytes) {
          effect[ink][name][num] = render_sprite(bytes, ink);
        });
      }
      return effect[ink][name];
    },
    
    'flash_wizard': function (wizard_index) {
      var ink;
      if (rainbow_wizard[wizard_index] === undefined) {
        rainbow_wizard[wizard_index] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_wizard[wizard_index][ink] = fetch_wizard(wizard_index, 15 - ink);
        }
      }
      return rainbow_wizard[wizard_index];
    },
    
    'weapon': function (name, ink) {
      return fetch_weapon(name, ink);
    },
    
    'flash_weapon': function (name) {
      var ink;
      if (rainbow_weapon[name] === undefined) {
        rainbow_weapon[name] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_weapon[name][ink] = fetch_weapon(name, 15 - ink);
        }
      }
      return rainbow_weapon[name];
    },
    
    'spell': function (index) {
      return json.spells[index];
    },
    
    'number_of_spells': function () {
      return json.spells.length;
    },
    
    'interface_message': function (index) {
      return json.messages['interface'][index];
    },
    
    'in_game_message': function (index) {
      return json.messages.in_game[index];
    },
    
    'constant': function (key) {
      return json.constants[key];
    },
    
    'initial_positions': function (number_of_wizards) {
      return (number_of_wizards === 1) ? [json.initial_positions[0][0]] : json.initial_positions[number_of_wizards - 2];
    },
    
    'line_beam': function (ink) {
      if (beam.line === undefined) {
        beam.line = [];
      }
      if (beam.line[ink] === undefined) {
        beam.line[ink] = create_line_beam(ink);
      }
      return beam.line[ink];
    },
    
    'spell_beam': function (ink) {
      if (beam.spell === undefined) {
        beam.spell = [];
      }
      if (beam.spell[ink] === undefined) {
        beam.spell[ink] = create_spell_beam(ink);
      }
      return beam.spell[ink];
    },
    
    'burn_beam': function (ink) {
      if (beam.burn === undefined) {
        beam.burn = [];
      }
      if (beam.burn[ink] === undefined) {
        beam.burn[ink] = create_burn_beam(ink);
      }
      return beam.burn[ink];
    },
    
    'loading_screen': function () {
      if (json.loading_screen !== null) {
        if (loading_screen === undefined) {
          loading_screen = render_screen(json.loading_screen);
        }
        return loading_screen;
      } else {
        return undefined;
      }
    }
  };
}());