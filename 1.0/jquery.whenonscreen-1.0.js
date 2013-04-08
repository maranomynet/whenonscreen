// ----------------------------------------------------------------------------------
// jQuery.fn.whenOnScreen v 1.0
// ----------------------------------------------------------------------------------
// (c) 2010-2013 Hugsmiðjan ehf  -- http://www.hugsmidjan.is
//  written by:
//   * Már Örlygsson        -- http://mar.anomy.net
// ----------------------------------------------------------------------------------
//
// jQuery.fn.whenOnScreen() v. 1.0 -- monitors if elements are positioned within page's scroll window
// and triggers a 'whenonscreen' and 'whenoffscreen' events on each element when it crosses the window boundry
//
// Requires:
//    * eutil1.2+  ( $.throttleFn() )
//
(function($){
    var
        $win = $(window),
        scrollEvSet,
        defaultRanges =   50,// px
        defaultThrottle = 50,// ms
        cfg = $.whenOnScreen = {
            // leftright:  false,
            range:      defaultRanges,
            throttle:   defaultThrottle
          },

        elements = [],
        elementDatas = [],
        checkElements = function (elmsToCheck) {
            var scrTop = $win.scrollTop(),
                scrBottom = scrTop + $win.height(),
                scrLeft,  // undefined until at least one element requires it.
                scrRight; // undefined until at least one element requires it.
            elmsToCheck = elmsToCheck.push ? elmsToCheck : elementDatas;
            for (var i=0, data; (data = elmsToCheck[i]); i++)
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
          var method;
          if ( typeof opts === 'string' )
          {
            method = opts;
            opts = arguments[1];
          }
          opts = opts || {
              // live:   false,
              // ranges: $.whenOnScreen.range
            };
          if ( method !== 'stop' )
          {
            var ranges = opts.ranges!=null ? opts.ranges : cfg.ranges!=null ? cfg.ranges : defaultRanges;
            if ( typeof ranges === 'number' )
            {
              ranges = [{
                  radius: ranges
                }];
            }
            for (var i=0, range; (range = ranges[i]); i++)
            {
              var radius = range.radius;
              if ( radius!=null )
              {
                range.top =    radius;
                range.bottom = radius;
                range.left =   radius;
                range.right =  radius;
              }
            }
          }
          this.each(function () {
              var elm = this,
                  idx = $.inArray(elements, elm),
                  elmExisted = idx > 0;

              if ( method === 'stop' )
              {
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
                else {
                  elements.push(elm);
                  elementDatas.push(data);
                }
                data.elm = elm = $(elm);
                data.leftright = !!opts.leftright || !!cfg.leftright;
                data.live =      !!opts.live;
                data.ranges = [];
                $.each(ranges, function () {
                   data.ranges.push( $.extend({}, this) );
                  });

                if ( !opts.live && (!elmExisted || method==='update') )
                {
                  var offs = data.elm.offset();
                  data.elmTop =    offs.top;
                  data.elmBottom = offs.top + elm.outerHeight();
                  if ( data.leftright )
                  {
                    data.elmLeft =  offs.left;
                    data.elmRight = offs.left + elm.outerWidth();
                  }
                }
                checkElements([ data ]);
              }
            });
          if ( !elements.length )
          {
            $win.off('.whenOnScreen');
            scrollEvSet = false;
          }
          else if ( !scrollEvSet )
          {
            $win.on('scroll.whenOnScreen resize.whenOnScreen', $.throttleFn(checkElements, true, cfg.throttle) );
          }
          return this;
      };


})(jQuery);
