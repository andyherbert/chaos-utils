/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Storage = (function () {
  var json, palette, objects = [], character_set = [], borders = [], cursors = [], wizards = [], weapons = [], effect = [], rainbow_object = [], rainbow_wizard = [], rainbow_weapon = [], loading_screen = [], beam = [];
  
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
  
  function render_sprite(bytes, ink, paper, scale) {
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
    return Canvas.scale(canvas, scale);
  }
  
  function render_object(anim, ink, paper, scale) {
    var output = [];
    anim.each_pair(function (num, frame) {
      output[num] = render_sprite(frame.bytes, (ink === undefined) ? frame.ink : ink, (paper === undefined) ? frame.paper : paper, scale);
    });
    return output;
  }
  
  function fetch_character(key, ink, paper, scale) {
    if (character_set[scale] === undefined) {
      character_set[scale] = [];
    }
    if (character_set[scale][ink] === undefined) {
      character_set[scale][ink] = [];
    }
    if (character_set[scale][ink][paper] === undefined) {
      character_set[scale][ink][paper] = [];
    }
    if (character_set[scale][ink][paper][key] === undefined) {
      character_set[scale][ink][paper][key] = render_sprite(json.character_set[key], ink, paper, scale);
    }
    return character_set[scale][ink][paper][key];
  }
  
  function fetch_border(ink, paper, scale) {
    if (borders[scale] === undefined) {
      borders[scale] = [];
    }
    if (borders[scale][ink] === undefined) {
      borders[scale][ink] = [];
    }
    if (borders[scale][ink][paper] === undefined) {
      borders[scale][ink][paper] = [render_sprite(json.border[0], ink, paper, scale), render_sprite(json.border[1], ink, paper, scale)];
    }
    return borders[scale][ink][paper];
  }
  
  function fetch_wizard(wizard_index, ink, scale) {
    if (wizards[scale] === undefined) {
      wizards[scale] = [];
    }
    if (wizards[scale][ink] === undefined) {
      wizards[scale][ink] = [];
    }
    if (wizards[scale][ink][wizard_index] === undefined) {
      wizards[scale][ink][wizard_index] = render_sprite(json.wizards.characters[wizard_index], ink, RGB.black, scale);
    }
    return wizards[scale][ink][wizard_index];
  }
  
  function fetch_weapon(key, ink, scale) {
    if (weapons[scale] === undefined) {
      weapons[scale] = [];
    }
    if (weapons[scale][ink] === undefined) {
      weapons[scale][ink] = {};
    }
    if (weapons[scale][ink][key] === undefined) {
      weapons[scale][ink][key] = [];
      json.wizards.weapons[key].each_pair(function (num, frame) {
        weapons[scale][ink][key][num] = render_sprite(frame, ink, RGB.black, scale);
      });
    }
    return weapons[scale][ink][key];
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
  
  function render_screen(raw_screen, scale) {
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
    return Canvas.scale(canvas, scale);
  }
  
  function create_line_beam(ink, scale) {
    var canvas, ctx, image_data;
    canvas = Canvas.create(1, 1);
    ctx = canvas.getContext('2d');
    image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    image_data.insert_rgb(0, 0, palette[ink]);
    ctx.putImageData(image_data, 0, 0);
    return Canvas.scale(canvas, scale);
  }
  
  function create_spell_beam(ink, scale) {
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
    return Canvas.scale(canvas, scale);
  }
  
  function create_burn_beam(ink, scale) {
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
    return Canvas.scale(canvas, scale);
  }
  
  return {
    'init': function (success, failure) {
      Ajax.get('json/chaos.json', function (reply) {
        json = reply;
        palette = expand_palette(json.palette);
        success(json);
      }, function (status) {
        failure(status);
      });
    },
    
    'create_object': function (object_id, creator_id, scale) {
      var output = json.objects[object_id].clone();
      if (objects[scale] === undefined) {
        objects[scale] = [];
      }
      if (objects[scale][object_id] === undefined) {
        objects[scale][object_id] = json.objects[object_id].clone();
        objects[scale][object_id].anim = render_object(json.objects[object_id].anim, undefined, undefined, scale);
        if (json.objects[object_id].corpse) {
          objects[scale][object_id].corpse = render_sprite(json.objects[object_id].corpse.bytes, json.objects[object_id].corpse.ink, json.objects[object_id].corpse.paper, scale);
        }
      }
      output.anim = objects[scale][object_id].anim;
      output.corpse = objects[scale][object_id].corpse;
      if (creator_id !== undefined) {
        output.creator_id = creator_id;
      }
      return output;
    },
    
    'flash_object': function (object_id, scale) {
      var ink;
      if (rainbow_object[scale] === undefined) {
        rainbow_object[scale] = [];
      }
      if (rainbow_object[scale][object_id] === undefined) {
        rainbow_object[scale][object_id] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_object[scale][object_id][ink] = render_object(json.objects[object_id].anim, 15 - ink, RGB.black, scale);
        }
      }
      return rainbow_object[scale][object_id];
    },
    
    'text': function (text, ink, scale) {
      var letters = [];
      text.each_char_with_index(function (character, index) {
        letters[letters.length] = fetch_character(character, ink, RGB.black, scale);
      });
      return Canvas.tile_horizontal(letters);
    },
    
    'border': function (width, height, ink, paper, scale) {
      var canvas, ctx, border = fetch_border(ink, paper, scale), size = border[0].width / 2, i;
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
    
    'cursor': function (name, ink, scale) {
      if (cursors[scale] === undefined) {
        cursors[scale] = [];
      }
      if (cursors[scale][ink] === undefined) {
        cursors[scale][ink] = {};
      }
      if (cursors[scale][ink][name] === undefined) {
        cursors[scale][ink][name] = render_sprite(json.cursors[name], ink, undefined, scale);
      }
      return cursors[scale][ink][name];
    },
    
    'wizard': function (wizard_index, ink, scale) {
      return fetch_wizard(wizard_index, ink, scale);
    },
    
    'wizard_timing': function () {
      return json.wizards.timing;
    },
    
    'effect': function (name, ink, scale) {
      if (effect[scale] === undefined) {
        effect[scale] = [];
      }
      if (effect[scale][ink] === undefined) {
        effect[scale][ink] = {};
      }
      if (effect[scale][ink][name] === undefined) {
        effect[scale][ink][name] = [];
        json.effects[name].each_pair(function (num, bytes) {
          effect[scale][ink][name][num] = render_sprite(bytes, ink, undefined, scale);
        });
      }
      return effect[scale][ink][name];
    },
    
    'flash_wizard': function (wizard_index, scale) {
      var ink, sprite;
      if (rainbow_wizard[scale] === undefined) {
        rainbow_wizard[scale] = [];
      }
      if (rainbow_wizard[scale][wizard_index] === undefined) {
        rainbow_wizard[scale][wizard_index] = [];
        for (ink = 0; ink < 7; ink += 1) {
          sprite = fetch_wizard(wizard_index, 15 - ink, scale);
          rainbow_wizard[scale][wizard_index][ink] = [sprite, sprite, sprite, sprite];
        }
      }
      return rainbow_wizard[scale][wizard_index];
    },
    
    'weapon': function (name, ink, scale) {
      return fetch_weapon(name, ink, scale);
    },
    
    'flash_weapon': function (name, scale) {
      var ink;
      if (rainbow_weapon[scale] === undefined) {
        rainbow_weapon[scale] = [];
      }
      if (rainbow_weapon[scale][name] === undefined) {
        rainbow_weapon[scale][name] = [];
        for (ink = 0; ink < 7; ink += 1) {
          rainbow_weapon[scale][name][ink] = fetch_weapon(name, 15 - ink, scale);
        }
      }
      return rainbow_weapon[scale][name];
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
    
    'line_beam': function (ink, scale) {
      if (beam[scale] === undefined) {
        beam[scale] = [];
      }
      if (beam[scale].line === undefined) {
        beam[scale].line = [];
      }
      if (beam[scale].line[ink] === undefined) {
        beam[scale].line[ink] = create_line_beam(ink, scale);
      }
      return beam[scale].line[ink];
    },
    
    'spell_beam': function (ink, scale) {
      if (beam[scale] === undefined) {
        beam[scale] = {};
      }
      if (beam[scale].spell === undefined) {
        beam[scale].spell = [];
      }
      if (beam[scale].spell[ink] === undefined) {
        beam[scale].spell[ink] = create_spell_beam(ink, scale);
      }
      return beam[scale].spell[ink];
    },
    
    'burn_beam': function (ink, scale) {
      if (beam[scale] === undefined) {
        beam[scale] = [];
      }
      if (beam[scale].burn === undefined) {
        beam[scale].burn = [];
      }
      if (beam[scale].burn[ink] === undefined) {
        beam[scale].burn[ink] = create_burn_beam(ink, scale);
      }
      return beam[scale].burn[ink];
    },
    
    'loading_screen': function (scale) {
      if (json.loading_screen !== null) {
        if (loading_screen[scale] === undefined) {
          loading_screen[scale] = render_screen(json.loading_screen, scale);
        }
        return loading_screen[scale];
      } else {
        return undefined;
      }
    }
  };
}());