/* jQuery.fn.whenOnScreen 1.0  (https://github.com/maranomynet/whenonscreen/)   @license MIT/GPL */

// ----------------------------------------------------------------------------------
// jQuery.fn.whenOnScreen v 1.0
// ----------------------------------------------------------------------------------
// (c) 2010-2014 Hugsmiðjan ehf  -- http://www.hugsmidjan.is
//  written by:
//   * Már Örlygsson        -- http://mar.anomy.net
//
// Dual licensed under a MIT licence (http://en.wikipedia.org/wiki/MIT_License)
// and GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
// More info: https://github.com/maranomynet/whenonscreen/
// ----------------------------------------------------------------------------------

/** /

  // jQuery.fn.whenOnScreen() v. 1.0 -- monitors if elements are positioned within page's scroll window
  // and triggers a 'whenonscreen' and 'whenoffscreen' events for each element as it crosses a set distance
  // (or one of several distances) from the viewport boundry


  // Optional dependency:
  //   * $.throttleFn() -- https://gist.github.com/maranomynet/7090772



  // Usage:

    var sections = $('div.section');

    sections
        .on('whenonscreen whenoffscreen', function (event) {
            // do stuff to .section when it moves on/off screen
            // ...or more precisely - when it moves in/out of each
            // of its configured "range" objects (see below).
          });

    // The `event` object has the following properties:
    //   * type        String - 'when(on|off)screen',
    //   * range       A normalized version of the 'range' object that triggered this event,
    //                 Examples:
    //                  a) { top:-100, bottom:-300, left:0, right:40,   customVal:'foo' },
    //                  b) { top:-100, bottom:-300, left:0, right:40,   customElm:[Object] },
    //                  c) { radius:50, top:50, bottom:50, left:50, right:50  },
    //   * scrTop      Number - Current window/viewport boundries in pixels
    //     srcHeight   ...
    //     scrBottom   ...
    //     scrLeft     ... (if leftright is enabled)
    //     srcWidth    ... (if leftright is enabled)
    //     scrRight    ... (if leftright is enabled)
    //   * elmTop      Number -  Current element boundries in pixels
    //     elmHeight   ...
    //     elmBottom   ...
    //     elmLeft     ... (if leftright is enabled)
    //     elmWidth    ... (if leftright is enabled)
    //     elmRight    ... (if leftright is enabled)
    //   * isElmBelow  Boolean - is the element outside (below|above|right of|left of) the viewport
    //     isElmAbove  ...
    //     isElmRight  ...
    //     isElmLeft   ...
    //   * leftright   Boolean - is horizontal boundry checking enabled for this element
    //   * recalc      Boolean - was element position + size recalculated this time?



    // Global Configuration:  ================================================

    // Set custom throttle time (time between recalculations on scroll/resize) (default: 50ms)
    $.whenOnScreen.throttle = 200;
    // Indicate that left/right boundries should also be checked by default (default: false)
    $.whenOnScreen.leftright = true;
    // Set the list of default range objects (default: `{ visible:{ radius:50 } }` )
    $.whenOnScreen.ranges = { visible:{ radius:100, top: -50 } };
    // Disable clever caching of element offsets and dimensions.
    $.whenOnScreen.live = true;
    // Turns on namespace events - instead . (default: false)
    $.whenOnScreen.nsEvents = true;


    // Configuration:  =======================================================

    // default options: single 'range' with radius of 50px (offscreen)
    sections.whenOnScreen();

    // Indicate that for this set of elements left/right boundries should also be checked
    sections.whenOnScreen({ leftright:true });

    // Ask that size/position for these elements should be measured
    // on every scroll/window.resize event (default: false)
    sections.whenOnScreen({ live:true });

    // single 'range' with radius of 100px (offscreen)
    sections.whenOnScreen({ ranges:100 });

    // single 'range' with radius of 100px (offscreen)
    sections.whenOnScreen({ ranges:{ visible:{radius:100} } });

    // single 'range' with radius of 25% af viewport size
    // (counts as onscreen when edge of the element has entered 25% of screen dimension)
    sections.whenOnScreen({ ranges: '-25%s' });

    // single 'range' with radius of 25% af element size
    // (counts as onscreen when more than 25% of the element is visible)
    sections.whenOnScreen({ ranges: '-25%e' });

    // single 'range' calculated per element by a dynamic function.
    // (The function's return value is cached unless "live" flag is true)
    sections.whenOnScreen({
        ranges: function(sizes, side){
            // same as the shorthand '-25%e' above
            var dimension = /Top|Bottom/.test(side) ? 'Height' : 'Width';
            // var $elm = sizes.$elm; // jQuery collection containing the target element
            return: -.25 * sizes['elm'+dimension];
          }
    });

    // single 'range' with varying radii
    sections.whenOnScreen({ ranges:{ visible:{ top:100, bottom:-100, left:50, right:-50 } } });

    // multiple named 'ranges' with some custom data included
    $.whenOnScreen.nsEvents = true;  // <-- required to bind event-handlers for individual range-names
    sections.whenOnScreen({
          leftright: true,
          ranges: {
              lazyload: { radius:100,   customData:{foo:1} },
              animate:  { top:-100, bottom:-300, left:0, right:40 },
              foo:      { radius:50, bottom:-75 },
            }
        });


    // Stop monitoring one or more of the elements
    sections.eq(3).whenOnScreen( 'stop' );

    // For elements that are not "live" measured - you can
    // request 'recalc'ulation of their size/position
    // triggering on-/off-screen events when neccessary
    sections.eq(3).whenOnScreen( 'recalc' );

    // Update the data/config object (takes effect on next 'recalc'/scroll/resize)
    var config = sections.eq(3).whenOnScreen( 'data' );
    config.ranges[0].top = 100;

    // Running the plugin again with new options will
    // update (i.e. overwrite) the options for each element and instantly
    // revaluate their status on-/off-screen - firing events when neccessary
    sections.whenOnScreen( myNewOptionsObj );

/**/

(function($){
    var
        $win = $(window),
        scrollEvSet,
        globalCfg = $.whenOnScreen = {
            nsEvents:   false,
            recalcOnResize: true,
            live:       false,
            leftright:  false,
            range:      { visible: { radius:50 } },
            throttle:   50
          },

        _percStrToFunc = function (rangeStr, side) {
            var m = /^(-?\d+(?:\.\d+)?)%(s|e)$/.exec(rangeStr);
            var perc = m  &&  parseFloat(m[1]) / 100;
            var refDim = m  &&  (m[2]==='s' ? 'scr' : 'elm') + (/^[TB]/.test(side) ? 'Height' : 'Width');
            return m ?
                      function (sizes/*, side*/) { return perc * sizes[refDim]; }:
                      parseInt(rangeStr, 10) || 0;
          },

        _getRangeValue = function (range, rangeFn, recalc, sizes, side) {
            var cacheKey = '_'+side;
            return !recalc && (range[cacheKey]!=null) ?
                      range[cacheKey]: // return cached value
                      (range[cacheKey] = rangeFn(sizes, side)); // set cache to calculated value
          },

        elements = [],
        elementDatas = [],
        lastScrTop,
        lastScrLeft,

        checkElements = function (e) {
            var scrTop = $win.scrollTop(),
                scrHeight = $win.height(),
                scrBottom = scrTop + scrHeight,
                scrLeft,  // undefined until at least one element requires it.
                scrWidth,
                scrRight, // undefined until at least one element requires it.
                directInvocation = !e.type,
                doRecalculate =  directInvocation || (globalCfg.recalcOnResize && e.type === 'resize'),
                elmDatasToCheck = directInvocation ? // sometimes checkElements() is invoked directly for a subset of all elements.
                                  e:
                                  elementDatas;
            for (var i=0, data; (data = elmDatasToCheck[i]); i++)
            {
              var elm = data.elm,
                  recalcThis = doRecalculate || data.live,
                  offs = recalcThis && elm.offset(),
                  elmTop =    recalcThis ? (data.elmTop = offs.top) : data.elmTop,
                  elmHeight = recalcThis ? (data.elmHeight = elm.outerHeight()) : data.elmHeight,
                  elmBottom = recalcThis ? (data.elmBottom = elmTop + elmHeight) : data.elmBottom,
                  elmLeft,
                  elmWidth,
                  elmRight;

              if ( data.leftright )
              {
                if ( !i )
                {
                  scrLeft  = $win.scrollLeft();
                  scrWidth  = $win.width();
                  scrRight = scrLeft + scrWidth;
                }
                elmLeft  = recalcThis ? (data.elmLeft = offs.left) : data.elmLeft;
                elmWidth = recalcThis ? (data.elmWidth = elm.outerWidth()) : data.elmWidth;
                elmRight = recalcThis ? (data.elmRight = elmLeft + elmWidth) : data.elmRight;
              }

              var ev = {
                      scrTop:      scrTop,
                      scrHeight:   scrHeight,
                      scrBottom:   scrBottom,
                      scrLeft:     scrLeft,   // undefined unless data.leftright
                      scrWidth:    scrWidth,  // undefined unless data.leftright
                      scrRight:    scrRight,  // undefined unless data.leftright

                      $elm:        elm,
                      elmTop:      elmTop,
                      elmHeight:   elmHeight,
                      elmBottom:   elmBottom,
                      elmLeft:     elmLeft,   // undefined unless data.leftright
                      elmWidth:    elmWidth,  // undefined unless data.leftright
                      elmRight:    elmRight,  // undefined unless data.leftright

                      //isElmBelow:  Boolean    // set below
                      //isElmAbove:  Boolean    // set below
                      //isElmRight:  Boolean    // set below
                      //isElmLeft:   Boolean    // set below

                      lastScrTop:  lastScrTop,  // undefined during first run
                      lastScrLeft: lastScrLeft, // undefined during first run

                      leftright:   data.leftright
                    };

              $.each(data.ranges, function (rangeName, range) {
                  var onScreen,
                      rTop = range.top,
                      rBottom = range.bottom;

                  rTop.call && (rTop = _getRangeValue(range, rTop, recalcThis, ev, 'top'));
                  rBottom.call && (rBottom = _getRangeValue(range, rBottom, recalcThis, ev,'bottom'));

                  var isBelow = elmTop-rTop >= scrBottom;
                  var isAbove = scrTop >= elmBottom+rBottom;
                  if ( isBelow  && isAbove )
                  {
                    isBelow = isAbove = false;
                  }
                  elm.isElmBelow = isBelow;
                  elm.isElmAbove = isAbove;

                  onScreen =  !isBelow && !isAbove;

                  if ( data.leftright )
                  {
                    var rLeft = range.left,
                        rRight = range.right;

                    rLeft.call && (rLeft = _getRangeValue(range, rLeft, recalcThis, ev, 'left'));
                    rRight.call && (rRight = _getRangeValue(range, rRight, recalcThis, ev,'right'));

                    var isRight = elmLeft-rLeft >= scrRight;
                    var isLeft =  scrLeft >= elmRight+rRight;
                    if ( isRight && isLeft )
                    {
                      isRight = isLeft = false;
                    }
                    elm.isElmRight = isRight;
                    elm.isElmLeft =  isLeft;

                    onScreen =  onScreen && !isRight && !isLeft;
                  }

                  if ( onScreen !== range.onscreen )
                  {
                    range.onscreen = onScreen;
                    // trigger wheno[n|ff]screen event
                    ev.type = (onScreen ? 'whenon' : 'whenoff') + 'screen' + (globalCfg.nsEvents ? '.'+rangeName : '');
                    ev.range = range;
                    elm.trigger(ev);
                  }
                });

              lastScrTop = scrTop;
              lastScrLeft = scrLeft;
           }

          };

        // _reUnit = /\d(%|vw|wh)$/;


    $.fn.whenOnScreen = function (opts, arg2) {
          var method = 'run', // run
              ranges;

          if ( typeof opts === 'string' )
          {
            method = opts;
            opts = arg2;
          }
          opts = $.extend({}, opts);

          if ( method === 'run' )
          {
            // Normalize the options and apply defaults.
            // We can safely skip this if method is 'stop' or 'recalc'
            ranges =  opts.ranges!=null ?
                          opts.ranges:
                          globalCfg.ranges;

            // convert old-school range Arrays to Object
            if ( $.isArray( ranges ) ) {
              var rangesArr = ranges;
              ranges = {};
              $.each(rangesArr,function (i, range) { ranges['r'+i] = range; });
            }
            // handle Number/String shorthand radius values
            ranges =  $.isPlainObject( ranges ) ? ranges : { visible:{ radius: ranges } };

            // Normalize top, bottom, left, right values. (i.e. expand radius to handle undefined values)
            $.each(ranges, function (i, range) {
                var radius = range.radius || 0;
                delete range.radius;
                if ( range.top==null )    { range.top =    radius; }
                if ( range.bottom==null ) { range.bottom = radius; }
                if ( range.left==null )   { range.left =   radius; }
                if ( range.right==null )  { range.right =  radius; }
              });
          }

          var retValue = this;
          this.each(function () {
              var elm = this,
                  idx = $.inArray(elm, elements),
                  alreadyMonitored = idx > -1;

              if ( method === 'stop' )
              {
                // remove the current element data from the list of monitored objects
                // and do nothing else
                if ( alreadyMonitored )
                {
                  elements.splice(idx,1);
                  elementDatas.splice(idx,1);
                }
              }
              else if ( method === 'data' )
              {
                retValue = elementDatas[idx]; // make the plugin return the data of the first item
                return false;    // immediately exit this.each() loop
              }
              else // /^(run|recalc)$/.test(method)
              {
                var data = alreadyMonitored ? elementDatas[idx] : {};

                if ( method === 'run' )
                {
                  // Initialize and normalize (or simply update!) the data object for the current element
                  // (No need to do this if we're just recalculating the dimenstions and posision)
                  if ( !alreadyMonitored )
                  {
                    elements.push(elm);
                    elementDatas.push(data);
                    data.elm = $(elm);
                  }
                  data.leftright = opts.leftright!=null ?
                                      !!opts.leftright:
                                      !!globalCfg.leftright;
                  data.live = opts.live!=null ?
                                  !!opts.live:
                                  !!globalCfg.live;
                  data.ranges = {};
                  $.each(ranges, function (name, range) {
                      data.ranges[name] = $.extend({},range);
                    });
                }
                // check to see if ranges contain (String) percentage tokens
                // that need to be converted into a function...
                // (also check during 'recalc' as the ranges might have been updated)
                $.each(data.ranges, function (i, range) {
                    $.each(['Top','Bottom','Left','Right'], function (i, side) {
                        var sideLC = side.toLowerCase(),
                            rangeVal = range[sideLC];
                        range[sideLC] = rangeVal.charAt ? _percStrToFunc(rangeVal, side): rangeVal;
                        // purge cached values
                        delete range['_'+sideLC];
                      });
                  });
                setTimeout(checkElements, 0, [ data ]);
              }
            });

          if ( !elements.length )
          {
            // Monitoring of all elements has been `stopp`ed.  Unbind scroll/resize events.
            $win.off('.whenOnScreen');
            scrollEvSet = false;
          }
          else if ( !scrollEvSet )
          {
            scrollEvSet = true;
            $win.on('scroll.whenOnScreen resize.whenOnScreen',
                $.throttleFn && globalCfg.throttle ?
                    $.throttleFn(checkElements, true, globalCfg.throttle):
                    checkElements
              );
          }

          return retValue;
      };


})(jQuery);
