/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
firefox = (navigator.userAgent.indexOf('Firefox') !== -1);

function $(element_id) {
  return document.getElementById(element_id);
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

Object.prototype.insert_rgb = function (x, y, rgb) {
  var i, index = (y * this.width + x) * 4;
  for (i = 0; i < 3; i += 1) {
    this.data[index + i] = rgb[i];
  }
  this.data[index + 3] = 255;
};

Object.prototype.save_buffer = function () {
  this.buffered_image = Canvas.create(this.width, this.height);
  this.buffered_image.getContext('2d').drawImage(this, 0, 0);
};

Object.prototype.restore_buffer = function () {
  this.getContext('2d').drawImage(this.buffered_image, 0, 0);
};