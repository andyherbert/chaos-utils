/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, devel: true, maxerr: 50, indent: 2 */
/*global Ajax: true, Board: true, Canvas: true, Info: true, RGB: true, SpellDisplay: true, Storage: true, Wizard: true, World: true, firefox: true*/
SpellDisplay = (function () {
  var canvas, ctx;
  return {
    'init': function (element) {
      canvas = element;
      ctx = canvas.getContext('2d');
    },
    
    'use_wizard': function (creator_id) {
      console.log(Wizard.get_wizard(creator_id).spellbook)
    }
  };
}());