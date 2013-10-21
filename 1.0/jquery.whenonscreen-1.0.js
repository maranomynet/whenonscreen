// ----------------------------------------------------------------------------------
// jQuery.fn.whenOnScreen v 1.0
// ----------------------------------------------------------------------------------
// (c) 2010-2013 Hugsmiðjan ehf  -- http://www.hugsmidjan.is
//  written by:
//   * Már Örlygsson        -- http://mar.anomy.net
//
// Dual licensed under a MIT licence (http://en.wikipedia.org/wiki/MIT_License)
// and GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
// More info: https://github.com/maranomynet/whenonscreen/
// ----------------------------------------------------------------------------------
//
// jQuery.fn.whenOnScreen() v. 1.0 -- monitors if elements are positioned within page's scroll window
// and triggers a 'whenonscreen' and 'whenoffscreen' events for each element as it crosses a set distance
// (or one of several distances) from the viewport boundry
//
//
// Optional dependency:
//    * $.throttleFn() -- https://gist.github.com/maranomynet/7090772
//
//
//
//  Usage:
//
//    var sections = $('div.section');
//
//    sections
//        .on('whenonscreen whenoffscreen', function (event) {
//            // do stuff to .section when it moves on/off screen
//            // ...or more precisely - when it moves in/out of each
//            // of its configured "range" objects (see below).
//          });
//
//    The `event` object has the following properties:
//      * type        String - 'when(on|off)screen',
//      * range       A normalized version of the 'range' object that triggered this event,
//                    Examples:
//                     a) { top:-100, bottom:-300, left:0, right:40,   customVal:'foo' },
//                     b) { top:-100, bottom:-300, left:0, right:40,   customElm:[Object] },
//                     c) { radius:50, top:50, bottom:50, left:50, right:50  },
//      * scrTop      Number - Current window/viewport boundries in pixels
//        scrBottom   ...
//        scrLeft     ...
//        scrRight    ...
//      * elmTop      Number -  Current element boundries in pixels
//        elmBottom   ...
//        elmLeft     ...
//        elmRight    ...
//      * leftright   Boolean - is horizontal boundry checking enabled for this element
//      * live        Boolean - is element position + size recalculated every time?
//
//
//
//    // Global Configuration:  ================================================
//
//    // Set custom throttle time (time between recalculations on scroll/resize) (default: 50ms)
//    $.whenOnScreen.throttle = 200;
//    // Indicate that left/right boundries should also be checked by default (default: false)
//    $.whenOnScreen.leftright = true;
//    // Set a default range (default: 50 --> [{ radius:50 }] )
//    $.whenOnScreen.ranges = [{ radius:100 }];
//
//
//    // Configuration:  =======================================================
//
//    // default options: single 'range' with radius of 50px (offscreen)
//    sections.whenOnScreen();
//
//    // Indicate that for this set of elements left/right boundries should also be checked
//    sections.whenOnScreen({ leftright:true });
//
//    // Ask that size/position for these elements should be measured on every scroll/window.resize event (default: false)
//    sections.whenOnScreen({ live:true });
//
//    // single 'range' with radius of 100px (offscreen)
//    sections.whenOnScreen( 100 );
//
//    // single 'range' with radius of 100px (offscreen)
//    sections.whenOnScreen({ ranges:[{ radius:100 }] });
//
//    // single 'range' with varying radii
//    sections.whenOnScreen({ ranges:[{ top:100, bottom:-100, left:50, right:-50 }] });
//
//    // multiple named 'ranges' with some custom data included
//    sections.whenOnScreen({
//          leftright: true,
//          ranges: [
//              { name:'lazyload',  radius:100,   customData:{foo:1} },
//              { name:'animate',   top:-100, bottom:-300, left:0, right:40 },
//              { name:'foo',       radius:50, bottom:-75 },
//            ]
//        });
//
//
//    // Stop monitoring one or more of the elements
//    sections.eq(3).whenOnScreen( 'stop' );
//
//    // For elements that are not "live" measured - you can
//    // request 'recalc'ulation of their size/position
//    // triggering on-/off-screen events when neccessary
//    sections.eq(3).whenOnScreen( 'recalc' );
//
//    // Update the data/config object (takes effect on next 'recalc'/scroll/resize)
//    var config = sections.eq(3).whenOnScreen( 'data' );
//    config.ranges[0].top = 100;
//
//    // Running the plugin again with new options will
//    // update (i.e. overwrite) the options for each element and instantly
//    // revaluate their status on-/off-screen - firing events when neccessary
//    sections.whenOnScreen( myNewOptionsObj );
//
//
//
(function($){
    var
        $win = $(window),
        scrollEvSet,
        defaultRanges =   50,// px
        defaultThrottle = 50,// ms
        globalCfg = $.whenOnScreen = {
            // leftright:  false,
            range:      defaultRanges,
            throttle:   defaultThrottle
          },

        elements = [],
        elementDatas = [],
        checkElements = function (elmsToCheckDatas) {
            var scrTop = $win.scrollTop(),
                scrBottom = scrTop + $win.height(),
                scrLeft,  // undefined until at least one element requires it.
                scrRight; // undefined until at least one element requires it.
            elmsToCheckDatas = elmsToCheckDatas.push ? elmsToCheckDatas : elementDatas;
            for (var i=0, data; (data = elmsToCheckDatas[i]); i++)
            {
              var elm = data.elm,
                  offs = data.live ? elm.offset() : null,
                  elmTop = offs ? offs.top : data.elmTop,
                  elmBottom = offs ? elmTop+elm.outerHeight() : data.elmBottom,
                  elmLeft,
                  elmRight;
              if ( data.leftright )
              {
                scrLeft  = scrRight ? scrLeft : $win.scrollLeft();
                scrRight = scrRight || (scrLeft + $win.width());
                elmLeft  = offs ? offs.left : data.elmLeft;
                elmRight = offs ? elmLeft+elm.outerWidth() : data.elmRight;
              }
              for (var j=0, range; (range = data.ranges[j]); j++)
              {
                var onScreen = elmTop-range.top < scrBottom  &&  scrTop < elmBottom+range.bottom;
                if ( onScreen !== range.onscreen )
                {
                  range.onscreen = onScreen;
                  // trigger wheno[n|ff]screen event
                  elm.trigger({
                      type:      onScreen ? 'whenonscreen' : 'whenoffscreen',
                      range:     range,

                      scrTop:    scrTop,
                      scrBottom: scrBottom,
                      scrLeft:   scrLeft,   // undefined if !data.leftright
                      scrRight:  scrRight,  // undefined if !data.leftright

                      elmTop:    elmTop,
                      elmBottom: elmBottom,
                      elmLeft:   elmLeft,   // undefined if !data.leftright
                      elmRight:  elmRight,  // undefined if !data.leftright

                      leftright: data.leftright,
                      live:      data.live
                    });
                }
              }
            }

          };

    $.fn.whenOnScreen = function (opts) {
          var method = 'run', // run
              ranges;

          if ( typeof opts === 'string' )
          {
            method = opts;
            opts = arguments[1];
          }
          opts = $.extend({
                    // live:   false,
                    // ranges: $.whenOnScreen.range
                  }, opts);

          if ( method === 'run')
          {
            // Normalize the options and apply defaults.
            // We can safely skip this if method is 'stop' or 'recalc'
            ranges =  opts.ranges!=null ?
                          opts.ranges:
                      globalCfg.ranges!=null ?
                          globalCfg.ranges:
                          defaultRanges;

            ranges =  (typeof ranges === 'number') ?
                          [{ radius: ranges }]:
                          ranges;

            for (var i=0, range; (range = ranges[i]); i++)
            {
              var radius = range.radius || 0;
              range.top =    range.top!=null ?    range.top    : radius;
              range.bottom = range.bottom!=null ? range.bottom : radius;
              range.left =   range.left!=null ?   range.left   : radius;
              range.right =  range.right!=null ?  range.right  : radius;
            }
          }

          var retValue = this;
          this.each(function () {
              var elm = this,
                  idx = $.inArray(elm, elements),
                  elmExisted = idx > -1;

              if ( method === 'stop' )
              {
                // remove the current element data from the list of monitored objects
                // and do nothing else
                if ( elmExisted )
                {
                  elements.splice(idx,1);
                  elementDatas.splice(idx,1);
                }
              }
              else
              {

                var data = {};
                if ( elmExisted )
                {
                  data = elementDatas[idx];
                }
                if ( method === 'data' )
                {
                  retValue = elmExisted ? data : undefined; // make the plugin return the data of the first item
                  return false;    // immediately exit this.each() loop
                }
                if ( method !== 'recalc' )
                {
                  // Initialize and normalize (or simply update!) the data object for the current element
                  // (No need to do this if we're just recalculating the dimenstions and posision)
                  if ( !elmExisted ) {
                    elements.push(elm);
                    elementDatas.push(data);
                    data.elm = $(elm);
                  }
                  data.leftright = !!opts.leftright || !!globalCfg.leftright;
                  data.live =      !!opts.live;
                  data.ranges = [];
                  $.each(ranges, function () {
                     data.ranges.push( $.extend({}, this) );
                    });
                }
                if ( !opts.live && (!elmExisted || method==='recalc') )
                {
                  // Measure the element's current dimensions and position
                  // Skip this if opts.live (because then it happens inside checkElements())
                  // Skip this if element already existed -- unless we've explicitly asked for 'recalc'
                  var dataElm = data.elm,
                      offs = dataElm.offset();
                  data.elmTop =    offs.top;
                  data.elmBottom = offs.top + dataElm.outerHeight();
                  if ( data.leftright )
                  {
                    data.elmLeft =  offs.left;
                    data.elmRight = offs.left + dataElm.outerWidth();
                  }
                }
                if ( method === 'run' || !data.live )
                {
                  // skip this for live elements when method is 'recalc'
                  // as the live elements may be considered up to date and correct
                  checkElements([ data ]);
                }
                // WARNING: Early return above!
              }
            });

          if ( !elements.length )
          {
            $win.off('.whenOnScreen');
            scrollEvSet = false;
          }
          else if ( !scrollEvSet )
          {
            $win.on('scroll.whenOnScreen resize.whenOnScreen',
                $.throttleFn && globalCfg.throttle ?
                    $.throttleFn(checkElements, true, globalCfg.throttle):
                    checkElements
              );
            scrollEvSet = true;
          }

          return retValue;
      };


})(jQuery);
