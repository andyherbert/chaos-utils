/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
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
