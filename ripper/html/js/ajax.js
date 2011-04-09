/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
Ajax = (function () {
  function form_request(method, url, success, failure) {
    var req = new XMLHttpRequest();
    req.open(method, url, true);
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
    return req;
  }
  
  return {
    'get': function (url, success, failure) {
      form_request('GET', url, success, failure).send();
    },
    
    'post': function (url, post_data, success, failure) {
      form_request('POST', url, success, failure).send(JSON.stringify(post_data));
    }
  };
}());