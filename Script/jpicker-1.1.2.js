/*
 * jPicker 1.1.2
 *
 * jQuery Plugin for Photoshop style color picker
 *
 * Copyright (c) 2010 Christopher T. Tillman
 * Digital Magic Productions, Inc. (http://www.digitalmagicpro.com/)
 * MIT style license, FREE to use, alter, copy, sell, and especially ENHANCE
 *
 * Painstakingly ported from John Dyers' excellent work on his own color picker based on the Prototype framework.
 *
 * John Dyers' website: (http://johndyer.name)
 * Color Picker page:   (http://johndyer.name/post/2007/09/PhotoShop-like-JavaScript-Color-Picker.aspx)
 *
 */
 
(function ($, version)
{
    var Slider = // encapsulate slider functionality for the ColorMap and ColorBar - could be useful to use a jQuery UI draggable for this with certain extensions
      function (bar, options)
      {
        var $this = this, // private properties, methods, and events - keep these variables and classes invisible to outside code
          arrow = bar.find('img:first'), // the arrow image image to drag
          minX = 0,
          maxX = 100,
          rangeX = 100,
          minY = 0,
          maxY = 100,
          rangeY = 100,
          x = 0,
          y = 0,
          offset,
          timeout,
          changeEvents = new Array(),
          fireChangeEvents =
            function (context)
            {
                for (var i = 0; i < changeEvents.length; i++) changeEvents[i].call($this, $this, context);
            },
          mouseDown = // bind the mousedown to the bar not the arrow for quick snapping to the clicked location
            function (e)
            {

                var off = bar.offset();
                offset = { l: off.left | 0, t: off.top | 0 };
                clearTimeout(timeout);
                timeout = setTimeout( // using setTimeout for visual updates - once the style is updated the browser will re-render internally allowing the next Javascript to run
                function ()
                {
                    setValuesFromMousePosition.call($this, e);
                }, 0);
                // Bind mousemove and mouseup event to the document so it responds when dragged of of the bar - we will unbind these when on mouseup to save processing
                $(document).on('mousemove', mouseMove).on('mouseup', mouseUp);
                e.stopPropagation();
                e.preventDefault(); // don't try to select anything or drag the image to the desktop
                return false;

            },
          mouseMove = // set the values as the mouse moves
            function (e)
            {

                clearTimeout(timeout);
                timeout = setTimeout(
                function ()
                {
                    setValuesFromMousePosition.call($this, e);
                }, 0);
                e.stopPropagation();
                e.preventDefault();
                return false;

            },
          mouseUp = // unbind the document events - they aren't needed when not dragging
            function (e)
            {

                $(document).off('mouseup', mouseUp).off('mousemove', mouseMove);
                e.stopPropagation();
                e.preventDefault();
                return false;

            },
          setValuesFromMousePosition = // calculate mouse position and set value within the current range
            function (e)
            {

                var locX = e.pageX - offset.l,
                  locY = e.pageY - offset.t,
                  barW = bar.w, // local copies for YUI compressor
                  barH = bar.h;
                // keep the arrow within the bounds of the bar
                if (locX < 0) locX = 0;
                else if (locX > barW) locX = barW;
                if (locY < 0) locY = 0;
                else if (locY > barH) locY = barH;
                val.call($this, 'xy', { x: ((locX / barW) * rangeX) + minX, y: ((locY / barH) * rangeY) + minY });

            },
          draw =
            function ()
            {

                var arrowOffsetX = 0,
                arrowOffsetY = 0,
                barW = bar.w,
                barH = bar.h,
                arrowW = arrow.w,
                arrowH = arrow.h;
                setTimeout(
                function ()
                {
                    if (rangeX > 0) // range is greater than zero
                    {
                        // constrain to bounds
                        if (x == maxX) arrowOffsetX = barW;
                        else arrowOffsetX = ((x / rangeX) * barW) | 0;
                    }
                    if (rangeY > 0) // range is greater than zero
                    {
                        // constrain to bounds
                        if (y == maxY) arrowOffsetY = barH;
                        else arrowOffsetY = ((y / rangeY) * barH) | 0;
                    }
                    // if arrow width is greater than bar width, center arrow and prevent horizontal dragging
                    if (arrowW >= barW) arrowOffsetX = (barW >> 1) - (arrowW >> 1); // number >> 1 - superfast bitwise divide by two and truncate (move bits over one bit discarding lowest)
                    else arrowOffsetX -= arrowW >> 1;
                    // if arrow height is greater than bar height, center arrow and prevent vertical dragging
                    if (arrowH >= barH) arrowOffsetY = (barH >> 1) - (arrowH >> 1);
                    else arrowOffsetY -= arrowH >> 1;
                    // set the arrow position based on these offsets
                    arrow.css({ left: arrowOffsetX + 'px', top: arrowOffsetY + 'px' });
                }, 0);

            },
          val =
            function (name, value, context)
            {

                var set = value !== undefined;
                if (!set)
                {
                    if (name === undefined || name == null) name = 'xy';
                    switch (name.toLowerCase())
                    {
                        case 'x': return x;
                        case 'y': return y;
                        case 'xy':
                        default: return { x: x, y: y };
                    }
                }
                if (context != null && context == $this) return;
                var changed = false,
                  newX,
                  newY;
                if (name == null) name = 'xy';
                switch (name.toLowerCase())
                {
                    case 'x':
                        newX = value && (value.x && value.x | 0 || value | 0) || 0;
                        break;
                    case 'y':
                        newY = value && (value.y && value.y | 0 || value | 0) || 0;
                        break;
                    case 'xy':
                    default:
                        newX = value && value.x && value.x | 0 || 0;
                        newY = value && value.y && value.y | 0 || 0;
                        break;
                }
                if (newX != null)
                {
                    if (newX < minX) newX = minX;
                    else if (newX > maxX) newX = maxX;
                    if (x != newX)
                    {
                        x = newX;
                        changed = true;
                    }
                }
                if (newY != null)
                {
                    if (newY < minY) newY = minY;
                    else if (newY > maxY) newY = maxY;
                    if (y != newY)
                    {
                        y = newY;
                        changed = true;
                    }
                }
                changed && fireChangeEvents.call($this, context || $this);

            },
          range =
            function (name, value)
            {

                var set = value !== undefined;
                if (!set)
                {
                    if (name === undefined || name == null) name = 'all';
                    switch (name.toLowerCase())
                    {
                        case 'minx': return minX;
                        case 'maxx': return maxX;
                        case 'rangex': return { minX: minX, maxX: maxX, rangeX: rangeX };
                        case 'miny': return minY;
                        case 'maxy': return maxY;
                        case 'rangey': return { minY: minY, maxY: maxY, rangeY: rangeY };
                        case 'all':
                        default: return { minX: minX, maxX: maxX, rangeX: rangeX, minY: minY, maxY: maxY, rangeY: rangeY };
                    }
                }
                var changed = false,
                  newMinX,
                  newMaxX,
                  newMinY,
                  newMaxY;
                if (name == null) name = 'all';
                switch (name.toLowerCase())
                {
                    case 'minx':
                        newMinX = value && (value.minX && value.minX | 0 || value | 0) || 0;
                        break;
                    case 'maxx':
                        newMaxX = value && (value.maxX && value.maxX | 0 || value | 0) || 0;
                        break;
                    case 'rangex':
                        newMinX = value && value.minX && value.minX | 0 || 0;
                        newMaxX = value && value.maxX && value.maxX | 0 || 0;
                        break;
                    case 'miny':
                        newMinY = value && (value.minY && value.minY | 0 || value | 0) || 0;
                        break;
                    case 'maxy':
                        newMaxY = value && (value.maxY && value.maxY | 0 || value | 0) || 0;
                        break;
                    case 'rangey':
                        newMinY = value && value.minY && value.minY | 0 || 0;
                        newMaxY = value && value.maxY && value.maxY | 0 || 0;
                        break;
                    case 'all':
                    default:
                        newMinX = value && value.minX && value.minX | 0 || 0;
                        newMaxX = value && value.maxX && value.maxX | 0 || 0;
                        newMinY = value && value.minY && value.minY | 0 || 0;
                        newMaxY = value && value.maxY && value.maxY | 0 || 0;
                        break;
                }
                if (newMinX != null && minX != newMinX)
                {
                    minX = newMinX;
                    rangeX = maxX - minX;
                }
                if (newMaxX != null && maxX != newMaxX)
                {
                    maxX = newMaxX;
                    rangeX = maxX - minX;
                }
                if (newMinY != null && minY != newMinY)
                {
                    minY = newMinY;
                    rangeY = maxY - minY;
                }
                if (newMaxY != null && maxY != newMaxY)
                {
                    maxY = newMaxY;
                    rangeY = maxY - minY;
                }

            },
          bind =
            function (callback)
            {
                if (typeof callback === 'function') changeEvents.push(callback);
            },
          unbind =
            function (callback)
            {
                if (typeof callback !== 'function') return;
                var i;
                while ((i = $.inArray(callback, changeEvents)) != -1) changeEvents.splice(i, 1);
            },
          destroy =
            function ()
            {
                // unbind all possible events and null objects
                $(document).off('mouseup', mouseUp).off('mousemove', mouseMove);
                bar.off('mousedown', mouseDown);
                bar = null;
                arrow = null;
                changeEvents = null;
            };
        $.extend(true, $this, // public properties, methods, and event bindings - these we need to access from other controls
          {
          val: val,
          range: range,
          bind: bind,
          unbind: unbind,
          destroy: destroy
         });
        // initialize this control
        arrow.src = options.arrow && options.arrow.image;
        arrow.w = options.arrow && options.arrow.width || arrow.width();
        arrow.h = options.arrow && options.arrow.height || arrow.height();
        bar.w = options.map && options.map.width || bar.width();
        bar.h = options.map && options.map.height || bar.height();
        // bind mousedown event
        bar.on('mousedown', mouseDown);
        bind.call($this, draw);
      },
    ColorValuePicker = // controls for all the input elements for the typing in color values
      function (picker, color, bindedHex)
      {
        var $this = this, // private properties and methods
          inputs = picker.find('td.Text input'),
          red = inputs.eq(3),
          green = inputs.eq(4),
          blue = inputs.eq(5),
          alpha = inputs.length > 7 ? inputs.eq(6) : null,
          hue = inputs.eq(0),
          saturation = inputs.eq(1),
          value = inputs.eq(2),
          hex = inputs.eq(inputs.length > 7 ? 7 : 6),
          ahex = inputs.length > 7 ? inputs.eq(8) : null,
          keyUp = // hue, saturation, or value input box key up - validate value and set color
            function (e)
            {
                if (e.target.value == '' && e.target != hex.get(0) && (bindedHex != null && e.target != bindedHex.get(0) || bindedHex == null)) return;
                if (!validateKey(e)) return e;
                switch (e.target)
                {
                    case red.get(0):
                        red.val(setValueInRange.call($this, red.val(), 0, 255));
                        color.val('r', red.val(), e.target);
                        break;
                    case green.get(0):
                        green.val(setValueInRange.call($this, green.val(), 0, 255));
                        color.val('g', green.val(), e.target);
                        break;
                    case blue.get(0):
                        blue.val(setValueInRange.call($this, blue.val(), 0, 255));
                        color.val('b', blue.val(), e.target);
                        break;
                    case alpha && alpha.get(0):
                        alpha.val(setValueInRange.call($this, alpha.val(), 0, 100));
                        color.val('a', alpha.val(), e.target);
                        break;
                    case hue.get(0):
                        hue.val(setValueInRange.call($this, hue.val(), 0, 360));
                        color.val('h', hue.val(), e.target);
                        break;
                    case saturation.get(0):
                        saturation.val(setValueInRange.call($this, saturation.val(), 0, 100));
                        color.val('s', saturation.val(), e.target);
                        break;
                    case value.get(0):
                        value.val(setValueInRange.call($this, value.val(), 0, 100));
                        color.val('v', value.val(), e.target);
                        break;
                    case hex.get(0):
                        hex.val(hex.val().replace(/[^a-fA-F0-9]/g, '').toLowerCase().substring(0, 6));
                        bindedHex && bindedHex.val(hex.val());
                        color.val('hex', hex.val() != '' ? hex.val() : null, e.target);
                        break;
                    case bindedHex && bindedHex.get(0):
                        bindedHex.val(bindedHex.val().replace(/[^a-fA-F0-9]/g, '').toLowerCase().substring(0, 6));
                        hex.val(bindedHex.val());
                        color.val('hex', bindedHex.val() != '' ? bindedHex.val() : null, e.target);
                        break;
                    case ahex && ahex.get(0):
                        ahex.val(ahex.val().replace(/[^a-fA-F0-9]/g, '').toLowerCase().substring(0, 2));
                        color.val('a', ahex.val() != null ? ((parseInt(ahex.val(), 16) * 100) / 255) : null, e.target);
                        break;
                }
            },
          blur = // hue, saturation, or value input box blur - reset to original if value empty
            function (e)
            {
                if (color.val() != null)
                {
                    switch (e.target)
                    {
                        case red.get(0): red.val(color.val('r')); break;
                        case green.get(0): green.val(color.val('g')); break;
                        case blue.get(0): blue.val(color.val('b')); break;
                        case alpha && alpha.get(0): alpha.val(color.val('a')); break;
                        case hue.get(0): hue.val(color.val('h')); break;
                        case saturation.get(0): saturation.val(color.val('s')); break;
                        case value.get(0): value.val(color.val('v')); break;
                        case hex.get(0):
                        case bindedHex && bindedHex.get(0):
                            hex.val(color.val('hex'));
                            bindedHex && bindedHex.val(color.val('hex'));
                            break;
                        case ahex && ahex.get(0): ahex.val(color.val('ahex').substring(6)); break;
                    }
                }
            },
          validateKey = // validate key
            function (e)
            {
                switch (e.keyCode)
                {
                    case 9:
                    case 16:
                    case 29:
                    case 37:
                    case 38:
                    case 40:
                        return false;
                    case 'c'.charCodeAt():
                    case 'v'.charCodeAt():
                        if (e.ctrlKey) return false;
                }
                return true;
            },
          setValueInRange = // constrain value within range
            function (value, min, max)
            {
                if (value == '' || isNaN(value)) return min;
                if (value > max) return max;
                if (value < min) return min;
                return value;
            },
          colorChanged =
            function (ui, context)
            {
                var all = ui.val('all');
                if (context != red.get(0)) red.val(all != null ? all.r : '');
                if (context != green.get(0)) green.val(all != null ? all.g : '');
                if (context != blue.get(0)) blue.val(all != null ? all.b : '');
                if (alpha && context != alpha.get(0)) alpha.val(all != null ? all.a : '');
                if (context != hue.get(0)) hue.val(all != null ? all.h : '');
                if (context != saturation.get(0)) saturation.val(all != null ? all.s : '');
                if (context != value.get(0)) value.val(all != null ? all.v : '');
                if (context != hex.get(0) && (bindedHex && context != bindedHex.get(0) || !bindedHex)) hex.val(all != null ? all.hex : '');
                if (bindedHex && context != bindedHex.get(0) && context != hex.get(0)) bindedHex.val(all != null ? all.hex : '');
                if (ahex && context != ahex.get(0)) ahex.val(all != null ? all.ahex.substring(6) : '');
            },
          destroy =
            function ()
            {
                // unbind all events and null objects
                red.add(green).add(blue).add(alpha).add(hue).add(saturation).add(value).add(hex).add(bindedHex).add(ahex).off('keyup', keyUp).off('blur', blur);
                color.unbind(colorChanged);
                red = null;
                green = null;
                blue = null;
                alpha = null;
                hue = null;
                saturation = null;
                value = null;
                hex = null;
                ahex = null;
            };
        $.extend(true, $this, // public properties and methods
          {
          destroy: destroy
         });
        red.add(green).add(blue).add(alpha).add(hue).add(saturation).add(value).add(hex).add(bindedHex).add(ahex).on('keyup', keyUp).on('blur', blur);
        color.bind(colorChanged);
      };
    $.jPicker =
    {
        List: [], // array holding references to each active instance of the control
        Color: // color object - we will be able to assign by any color space type or retrieve any color space info
        // we want this public so we can optionally assign new color objects to initial values using inputs other than a string hex value (also supported)
        function (init)
        {
            var $this = this,
            r,
            g,
            b,
            a,
            h,
            s,
            v,
            changeEvents = new Array(),
            fireChangeEvents =
              function (context)
              {
                for (var i = 0; i < changeEvents.length; i++) changeEvents[i].call($this, $this, context);
              },
            val =
              function (name, value, context)
              {
                var set = value !== undefined;
                if (!set)
                {
                    if (name === undefined || name == null || name == '') name = 'all';
                    switch (name.toLowerCase())
                    {
                        case 'ahex': return r != null ? ColorMethods.rgbaToHex({ r: r, g: g, b: b, a: a }) : null;
                        case 'hex':
                            var ret = val('ahex');
                            return ret && ret.substring(0, 6) || null;
                        case 'all': return r != null ? { r: r, g: g, b: b, a: a, h: h, s: s, v: v, hex: val.call($this, 'hex'), ahex: val.call($this, 'ahex')} : null;
                        default:
                            var ret = {};
                            for (var i = 0; i < name.length; i++)
                            {
                                switch (name.charAt(i))
                                {
                                    case 'r':
                                        if (name.length == 1) ret = r;
                                        else ret.r = r;
                                        break;
                                    case 'g':
                                        if (name.length == 1) ret = g;
                                        else ret.g = g;
                                        break;
                                    case 'b':
                                        if (name.length == 1) ret = b;
                                        else ret.b = b;
                                        break;
                                    case 'a':
                                        if (name.length == 1) ret = a;
                                        else ret.a = a;
                                        break;
                                    case 'h':
                                        if (name.length == 1) ret = h;
                                        else ret.h = h;
                                        break;
                                    case 's':
                                        if (name.length == 1) ret = s;
                                        else ret.s = s;
                                        break;
                                    case 'v':
                                        if (name.length == 1) ret = v;
                                        else ret.v = v;
                                        break;
                                }
                            }
                            return ret == {} ? val.call($this, 'all') : ret;
                            break;
                    }
                }
                if (context != null && context == $this) return;
                var changed = false;
                if (name == null) name = '';
                if (value == null)
                {
                    if (r != null)
                    {
                        r = null;
                        changed = true;
                    }
                    if (g != null)
                    {
                        g = null;
                        changed = true;
                    }
                    if (b != null)
                    {
                        b = null;
                        changed = true;
                    }
                    if (a != null)
                    {
                        a = null;
                        changed = true;
                    }
                    if (h != null)
                    {
                        h = null;
                        changed = true;
                    }
                    if (s != null)
                    {
                        s = null;
                        changed = true;
                    }
                    if (v != null)
                    {
                        v = null;
                        changed = true;
                    }
                    changed && fireChangeEvents.call($this, context || $this);
                    return;
                }
                switch (name.toLowerCase())
                {
                    case 'ahex':
                    case 'hex':
                        var ret = ColorMethods.hexToRgba(value && (value.ahex || value.hex) || value || '00000000');
                        val.call($this, 'rgba', { r: ret.r, g: ret.g, b: ret.b, a: name == 'ahex' ? ret.a : a != null ? a : 100 }, context);
                        break;
                    default:
                        if (value && (value.ahex != null || value.hex != null))
                        {
                            val.call($this, 'ahex', value.ahex || value.hex || '00000000', context);
                            return;
                        }
                        var newV = {}, rgb = false, hsv = false;
                        if (value.r !== undefined && !name.indexOf('r') == -1) name += 'r';
                        if (value.g !== undefined && !name.indexOf('g') == -1) name += 'g';
                        if (value.b !== undefined && !name.indexOf('b') == -1) name += 'b';
                        if (value.a !== undefined && !name.indexOf('a') == -1) name += 'a';
                        if (value.h !== undefined && !name.indexOf('h') == -1) name += 'h';
                        if (value.s !== undefined && !name.indexOf('s') == -1) name += 's';
                        if (value.v !== undefined && !name.indexOf('v') == -1) name += 'v';
                        for (var i = 0; i < name.length; i++)
                        {
                            switch (name.charAt(i))
                            {
                                case 'r':
                                    if (hsv) continue;
                                    rgb = true;
                                    newV.r = value && value.r && value.r | 0 || value && value | 0 || 0;
                                    if (newV.r < 0) newV.r = 0;
                                    else if (newV.r > 255) newV.r = 255;
                                    if (r != newV.r)
                                    {
                                        r = newV.r;
                                        changed = true;
                                    }
                                    break;
                                case 'g':
                                    if (hsv) continue;
                                    rgb = true;
                                    newV.g = value && value.g && value.g | 0 || value && value | 0 || 0;
                                    if (newV.g < 0) newV.g = 0;
                                    else if (newV.g > 255) newV.g = 255;
                                    if (g != newV.g)
                                    {
                                        g = newV.g;
                                        changed = true;
                                    }
                                    break;
                                case 'b':
                                    if (hsv) continue;
                                    rgb = true;
                                    newV.b = value && value.b && value.b | 0 || value && value | 0 || 0;
                                    if (newV.b < 0) newV.b = 0;
                                    else if (newV.b > 255) newV.b = 255;
                                    if (b != newV.b)
                                    {
                                        b = newV.b;
                                        changed = true;
                                    }
                                    break;
                                case 'a':
                                    newV.a = value && value.a != null ? value.a | 0 : value != null ? value | 0 : 100;
                                    if (newV.a < 0) newV.a = 0;
                                    else if (newV.a > 100) newV.a = 100;
                                    if (a != newV.a)
                                    {
                                        a = newV.a;
                                        changed = true;
                                    }
                                    break;
                                case 'h':
                                    if (rgb) continue;
                                    hsv = true;
                                    newV.h = value && value.h && value.h | 0 || value && value | 0 || 0;
                                    if (newV.h < 0) newV.h = 0;
                                    else if (newV.h > 360) newV.h = 360;
                                    if (h != newV.h)
                                    {
                                        h = newV.h;
                                        changed = true;
                                    }
                                    break;
                                case 's':
                                    if (rgb) continue;
                                    hsv = true;
                                    newV.s = value && value.s != null ? value.s | 0 : value != null ? value | 0 : 100;
                                    if (newV.s < 0) newV.s = 0;
                                    else if (newV.s > 100) newV.s = 100;
                                    if (s != newV.s)
                                    {
                                        s = newV.s;
                                        changed = true;
                                    }
                                    break;
                                case 'v':
                                    if (rgb) continue;
                                    hsv = true;
                                    newV.v = value && value.v != null ? value.v | 0 : value != null ? value | 0 : 100;
                                    if (newV.v < 0) newV.v = 0;
                                    else if (newV.v > 100) newV.v = 100;
                                    if (v != newV.v)
                                    {
                                        v = newV.v;
                                        changed = true;
                                    }
                                    break;
                            }
                        }
                        if (changed)
                        {
                            if (rgb)
                            {
                                r = r || 0;
                                g = g || 0;
                                b = b || 0;
                                var ret = ColorMethods.rgbToHsv({ r: r, g: g, b: b });
                                h = ret.h;
                                s = ret.s;
                                v = ret.v;
                            }
                            else if (hsv)
                            {
                                h = h || 0;
                                s = s != null ? s : 100;
                                v = v != null ? v : 100;
                                var ret = ColorMethods.hsvToRgb({ h: h, s: s, v: v });
                                r = ret.r;
                                g = ret.g;
                                b = ret.b;
                            }
                            a = a != null ? a : 100;
                            fireChangeEvents.call($this, context || $this);
                        }
                        break;
                }
              },
            bind =
              function (callback)
              {
                if (typeof callback === 'function') changeEvents.push(callback);
              },
            unbind =
              function (callback)
              {
                if (!typeof callback === 'function') return;
                var i;
                while ((i = $.inArray(callback, changeEvents)) != -1) changeEvents.splice(i, 1);
              },
            destroy =
              function ()
              {
                changeEvents = null;
              }
            $.extend(true, $this, // public properties and methods
            {
            val: val,
            bind: bind,
            unbind: unbind,
            destroy: destroy
           });
            if (init)
            {
                if (init.hex != null) val('hex', init);
                else if (init.ahex != null) val('ahex', init);
                else if (init.r != null && init.g != null && init.b != null) val('rgb', init);
                else if (init.h != null && init.s != null && init.v != null) val('hsv', init);
            }
        },
        ColorMethods: // color conversion methods  - make public to give use to external scripts
        {
        hexToRgba:
            function (hex)
            {
                hex = this.validateHex(hex);
                if (hex == '') return { r: null, g: null, b: null, a: null };
                var r = '00', g = '00', b = '00', a = '100';
                if (hex.length == 6) hex += 'ff';
                if (hex.length > 6)
                {
                    r = hex.substring(0, 2);
                    g = hex.substring(2, 4);
                    b = hex.substring(4, 6);
                    a = hex.substring(6, hex.length);
                }
                else
                {
                    if (hex.length > 4)
                    {
                        r = hex.substring(4, hex.length);
                        hex = hex.substring(0, 4);
                    }
                    if (hex.length > 2)
                    {
                        g = hex.substring(2, hex.length);
                        hex = hex.substring(0, 2);
                    }
                    if (hex.length > 0) b = hex.substring(0, hex.length);
                }
                return { r: this.hexToInt(r), g: this.hexToInt(g), b: this.hexToInt(b), a: ((this.hexToInt(a) * 100) / 255) | 0 };
            },
        validateHex:
            function (hex)
            {
                hex = hex.toLowerCase().replace(/[^a-f0-9]/g, '');
                if (hex.length > 8) hex = hex.substring(0, 8);
                return hex;
            },
        rgbaToHex:
            function (rgba)
            {
                return this.intToHex(rgba.r) + this.intToHex(rgba.g) + this.intToHex(rgba.b) + this.intToHex(((rgba.a * 255) / 100) | 0);
            },
        intToHex:
            function (dec)
            {
                var result = (dec | 0).toString(16);
                if (result.length == 1) result = ('0' + result);
                return result.toLowerCase();
            },
        hexToInt:
            function (hex)
            {
                return parseInt(hex, 16);
            },
        rgbToHsv:
            function (rgb)
            {
                var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255, hsv = { h: 0, s: 0, v: 0 }, min = 0, max = 0, delta;
                if (r >= g && r >= b)
                {
                    max = r;
                    min = g > b ? b : g;
                }
                else if (g >= b && g >= r)
                {
                    max = g;
                    min = r > b ? b : r;
                }
                else
                {
                    max = b;
                    min = g > r ? r : g;
                }
                hsv.v = max;
                hsv.s = max ? (max - min) / max : 0;
                if (!hsv.s) hsv.h = 0;
                else
                {
                    delta = max - min;
                    if (r == max) hsv.h = (g - b) / delta;
                    else if (g == max) hsv.h = 2 + (b - r) / delta;
                    else hsv.h = 4 + (r - g) / delta;
                    hsv.h = parseInt(hsv.h * 60);
                    if (hsv.h < 0) hsv.h += 360;
                }
                hsv.s = (hsv.s * 100) | 0;
                hsv.v = (hsv.v * 100) | 0;
                return hsv;
            },
        hsvToRgb:
            function (hsv)
            {
                var rgb = { r: 0, g: 0, b: 0, a: 100 }, h = hsv.h, s = hsv.s, v = hsv.v;
                if (s == 0)
                {
                    if (v == 0) rgb.r = rgb.g = rgb.b = 0;
                    else rgb.r = rgb.g = rgb.b = (v * 255 / 100) | 0;
                }
                else
                {
                    if (h == 360) h = 0;
                    h /= 60;
                    s = s / 100;
                    v = v / 100;
                    var i = h | 0,
                    f = h - i,
                    p = v * (1 - s),
                    q = v * (1 - (s * f)),
                    t = v * (1 - (s * (1 - f)));
                    switch (i)
                    {
                        case 0:
                            rgb.r = v;
                            rgb.g = t;
                            rgb.b = p;
                            break;
                        case 1:
                            rgb.r = q;
                            rgb.g = v;
                            rgb.b = p;
                            break;
                        case 2:
                            rgb.r = p;
                            rgb.g = v;
                            rgb.b = t;
                            break;
                        case 3:
                            rgb.r = p;
                            rgb.g = q;
                            rgb.b = v;
                            break;
                        case 4:
                            rgb.r = t;
                            rgb.g = p;
                            rgb.b = v;
                            break;
                        case 5:
                            rgb.r = v;
                            rgb.g = p;
                            rgb.b = q;
                            break;
                    }
                    rgb.r = (rgb.r * 255) | 0;
                    rgb.g = (rgb.g * 255) | 0;
                    rgb.b = (rgb.b * 255) | 0;
                }
                return rgb;
            }
       }
    };
    var Color = $.jPicker.Color, List = $.jPicker.List, ColorMethods = $.jPicker.ColorMethods; // local copies for YUI compressor
    $.fn.jPicker =
    function (options)
    {
        var $arguments = arguments;
        return this.each(
        function ()
        {
            var $this = this, settings = $.extend(true, {}, $.fn.jPicker.defaults, options); // local copies for YUI compressor
            if ($($this).get(0).nodeName.toLowerCase() == 'input') // Add color picker icon if binding to an input element and bind the events to the input
            {
                $.extend(true, settings,
              {
                window:
                {
                    bindToInput: true,
                    expandable: true,
                    input: $($this)
                }
              });
                if (ColorMethods.validateHex($($this).val()))
                {
                    settings.color.active = new Color({ hex: $($this).val(), a: settings.color.active.val('a') });
                    settings.color.current = new Color({ hex: $($this).val(), a: settings.color.active.val('a') });
                }
            }
            if (settings.window.expandable)
                $($this).after('<span class="jPicker"><span class="Icon"><span class="Color">&nbsp;</span><span class="Alpha">&nbsp;</span><span class="Image">&nbsp;</span><span class="Container">&nbsp;</span></span></span>');
            else settings.window.liveUpdate = false; // Basic control binding for inline use - You will need to override the liveCallback or commitCallback function to retrieve results
            var isLessThanIE7 = parseFloat(navigator.appVersion.split('MSIE')[1]) < 7 && document.body.filters, // needed to run the AlphaImageLoader function for IE6
            container = null,
            colorMapDiv = null,
            colorBarDiv = null,
            colorMapL1 = null, // different layers of colorMap and colorBar
            colorMapL2 = null,
            colorMapL3 = null,
            colorBarL1 = null,
            colorBarL2 = null,
            colorBarL3 = null,
            colorBarL4 = null,
            colorBarL5 = null,
            colorBarL6 = null,
            colorMap = null, // color maps
            colorBar = null,
            colorPicker = null,
            elementStartX = null, // Used to record the starting css positions for dragging the control
            elementStartY = null,
            pageStartX = null, // Used to record the mousedown coordinates for dragging the control
            pageStartY = null,
            activePreview = null, // color boxes above the radio buttons
            currentPreview = null,
            okButton = null,
            cancelButton = null,
            grid = null, // preset colors grid
            iconColor = null, // iconColor for popup icon
            iconAlpha = null, // iconAlpha for popup icon
            iconImage = null, // iconImage popup icon
            moveBar = null, // drag bar
            setColorMode = // set color mode and update visuals for the new color mode
              function (colorMode)
              {
                var active = color.active, // local copies for YUI compressor
                  clientPath = images.clientPath,
                  hex = active.val('hex'),
                  rgbMap,
                  rgbBar;
                settings.color.mode = colorMode;
                switch (colorMode)
                {
                    case 'h':
                        setTimeout(
                      function ()
                      {
                        setBG.call($this, colorMapDiv, 'transparent');
                        setImgLoc.call($this, colorMapL1, 0);
                        setAlpha.call($this, colorMapL1, 100);
                        setImgLoc.call($this, colorMapL2, 260);
                        setAlpha.call($this, colorMapL2, 100);
                        setBG.call($this, colorBarDiv, 'transparent');
                        setImgLoc.call($this, colorBarL1, 0);
                        setAlpha.call($this, colorBarL1, 100);
                        setImgLoc.call($this, colorBarL2, 260);
                        setAlpha.call($this, colorBarL2, 100);
                        setImgLoc.call($this, colorBarL3, 260);
                        setAlpha.call($this, colorBarL3, 100);
                        setImgLoc.call($this, colorBarL4, 260);
                        setAlpha.call($this, colorBarL4, 100);
                        setImgLoc.call($this, colorBarL6, 260);
                        setAlpha.call($this, colorBarL6, 100);
                      }, 0);
                        colorMap.range('all', { minX: 0, maxX: 100, minY: 0, maxY: 100 });
                        colorBar.range('rangeY', { minY: 0, maxY: 360 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('s'), y: 100 - active.val('v') }, colorMap);
                        colorBar.val('y', 360 - active.val('h'), colorBar);
                        break;
                    case 's':
                        setTimeout(
                      function ()
                      {
                        setBG.call($this, colorMapDiv, 'transparent');
                        setImgLoc.call($this, colorMapL1, -260);
                        setImgLoc.call($this, colorMapL2, -520);
                        setImgLoc.call($this, colorBarL1, -260);
                        setImgLoc.call($this, colorBarL2, -520);
                        setImgLoc.call($this, colorBarL6, 260);
                        setAlpha.call($this, colorBarL6, 100);
                      }, 0);
                        colorMap.range('all', { minX: 0, maxX: 360, minY: 0, maxY: 100 });
                        colorBar.range('rangeY', { minY: 0, maxY: 100 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('h'), y: 100 - active.val('v') }, colorMap);
                        colorBar.val('y', 100 - active.val('s'), colorBar);
                        break;
                    case 'v':
                        setTimeout(
                      function ()
                      {
                        setBG.call($this, colorMapDiv, '000000');
                        setImgLoc.call($this, colorMapL1, -780);
                        setImgLoc.call($this, colorMapL2, 260);
                        setBG.call($this, colorBarDiv, hex);
                        setImgLoc.call($this, colorBarL1, -520);
                        setImgLoc.call($this, colorBarL2, 260);
                        setAlpha.call($this, colorBarL2, 100);
                        setImgLoc.call($this, colorBarL6, 260);
                        setAlpha.call($this, colorBarL6, 100);
                      }, 0);
                        colorMap.range('all', { minX: 0, maxX: 360, minY: 0, maxY: 100 });
                        colorBar.range('rangeY', { minY: 0, maxY: 100 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('h'), y: 100 - active.val('s') }, colorMap);
                        colorBar.val('y', 100 - active.val('v'), colorBar);
                        break;
                    case 'r':
                        rgbMap = -1040;
                        rgbBar = -780;
                        colorMap.range('all', { minX: 0, maxX: 255, minY: 0, maxY: 255 });
                        colorBar.range('rangeY', { minY: 0, maxY: 255 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('b'), y: 255 - active.val('g') }, colorMap);
                        colorBar.val('y', 255 - active.val('r'), colorBar);
                        break;
                    case 'g':
                        rgbMap = -1560;
                        rgbBar = -1820;
                        colorMap.range('all', { minX: 0, maxX: 255, minY: 0, maxY: 255 });
                        colorBar.range('rangeY', { minY: 0, maxY: 255 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('b'), y: 255 - active.val('r') }, colorMap);
                        colorBar.val('y', 255 - active.val('g'), colorBar);
                        break;
                    case 'b':
                        rgbMap = -2080;
                        rgbBar = -2860;
                        colorMap.range('all', { minX: 0, maxX: 255, minY: 0, maxY: 255 });
                        colorBar.range('rangeY', { minY: 0, maxY: 255 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('r'), y: 255 - active.val('g') }, colorMap);
                        colorBar.val('y', 255 - active.val('b'), colorBar);
                        break;
                    case 'a':
                        setTimeout(
                      function ()
                      {
                        setBG.call($this, colorMapDiv, 'transparent');
                        setImgLoc.call($this, colorMapL1, -260);
                        setImgLoc.call($this, colorMapL2, -520);
                        setImgLoc.call($this, colorBarL1, 260);
                        setImgLoc.call($this, colorBarL2, 260);
                        setAlpha.call($this, colorBarL2, 100);
                        setImgLoc.call($this, colorBarL6, 0);
                        setAlpha.call($this, colorBarL6, 100);
                      }, 0);
                        colorMap.range('all', { minX: 0, maxX: 360, minY: 0, maxY: 100 });
                        colorBar.range('rangeY', { minY: 0, maxY: 100 });
                        if (active.val('ahex') == null) break;
                        colorMap.val('xy', { x: active.val('h'), y: 100 - active.val('v') }, colorMap);
                        colorBar.val('y', 100 - active.val('a'), colorBar);
                        break;
                    default:
                        throw ('Invalid Mode');
                        break;
                }
                switch (colorMode)
                {
                    case 'h':
                        break;
                    case 's':
                    case 'v':
                    case 'a':
                        setTimeout(
                      function ()
                      {
                        setAlpha.call($this, colorMapL1, 100);
                        setAlpha.call($this, colorBarL1, 100);
                        setImgLoc.call($this, colorBarL3, 260);
                        setAlpha.call($this, colorBarL3, 100);
                        setImgLoc.call($this, colorBarL4, 260);
                        setAlpha.call($this, colorBarL4, 100);
                      }, 0);
                        break;
                    case 'r':
                    case 'g':
                    case 'b':
                        setTimeout(
                      function ()
                      {
                        setBG.call($this, colorMapDiv, 'transparent');
                        setBG.call($this, colorBarDiv, 'transparent');
                        setAlpha.call($this, colorBarL1, 100);
                        setAlpha.call($this, colorMapL1, 100);
                        setImgLoc.call($this, colorMapL1, rgbMap);
                        setImgLoc.call($this, colorMapL2, rgbMap - 260);
                        setImgLoc.call($this, colorBarL1, rgbBar - 780);
                        setImgLoc.call($this, colorBarL2, rgbBar - 520);
                        setImgLoc.call($this, colorBarL3, rgbBar);
                        setImgLoc.call($this, colorBarL4, rgbBar - 260);
                        setImgLoc.call($this, colorBarL6, 260);
                        setAlpha.call($this, colorBarL6, 100);
                      }, 0);
                        break;
                }
                if (active.val('ahex') == null) return;
                activeColorChanged.call($this, active);
              },
            activeColorChanged = // Update color when user changes text values
              function (ui, context)
              {
                if (context == null || (context != colorBar && context != colorMap)) positionMapAndBarArrows.call($this, ui, context);
                setTimeout(
                  function ()
                  {
                    updatePreview.call($this, ui);
                    updateMapVisuals.call($this, ui);
                    updateBarVisuals.call($this, ui);
                  }, 0);
              },
            mapValueChanged = // user has dragged the ColorMap pointer
              function (ui, context)
              {
                var active = color.active;
                if (context != colorMap && active.val() == null) return;
                var xy = ui.val('all');
                switch (settings.color.mode)
                {
                    case 'h':
                        active.val('sv', { s: xy.x, v: 100 - xy.y }, context);
                        break;
                    case 's':
                    case 'a':
                        active.val('hv', { h: xy.x, v: 100 - xy.y }, context);
                        break;
                    case 'v':
                        active.val('hs', { h: xy.x, s: 100 - xy.y }, context);
                        break;
                    case 'r':
                        active.val('gb', { g: 255 - xy.y, b: xy.x }, context);
                        break;
                    case 'g':
                        active.val('rb', { r: 255 - xy.y, b: xy.x }, context);
                        break;
                    case 'b':
                        active.val('rg', { r: xy.x, g: 255 - xy.y }, context);
                        break;
                }
              },
            colorBarValueChanged = // user has dragged the ColorBar slider
              function (ui, context)
              {
                var active = color.active;
                if (context != colorBar && active.val() == null) return;
                switch (settings.color.mode)
                {
                    case 'h':
                        active.val('h', { h: 360 - ui.val('y') }, context);
                        break;
                    case 's':
                        active.val('s', { s: 100 - ui.val('y') }, context);
                        break;
                    case 'v':
                        active.val('v', { v: 100 - ui.val('y') }, context);
                        break;
                    case 'r':
                        active.val('r', { r: 255 - ui.val('y') }, context);
                        break;
                    case 'g':
                        active.val('g', { g: 255 - ui.val('y') }, context);
                        break;
                    case 'b':
                        active.val('b', { b: 255 - ui.val('y') }, context);
                        break;
                    case 'a':
                        active.val('a', 100 - ui.val('y'), context);
                        break;
                }
              },
            positionMapAndBarArrows = // position map and bar arrows to match current color
              function (ui, context)
              {
                if (context != colorMap)
                {
                    switch (settings.color.mode)
                    {
                        case 'h':
                            var sv = ui.val('sv');
                            colorMap.val('xy', { x: sv != null ? sv.s : 100, y: 100 - (sv != null ? sv.v : 100) }, context);
                            break;
                        case 's':
                        case 'a':
                            var hv = ui.val('hv');
                            colorMap.val('xy', { x: hv && hv.h || 0, y: 100 - (hv != null ? hv.v : 100) }, context);
                            break;
                        case 'v':
                            var hs = ui.val('hs');
                            colorMap.val('xy', { x: hs && hs.h || 0, y: 100 - (hs != null ? hs.s : 100) }, context);
                            break;
                        case 'r':
                            var bg = ui.val('bg');
                            colorMap.val('xy', { x: bg && bg.b || 0, y: 255 - (bg && bg.g || 0) }, context);
                            break;
                        case 'g':
                            var br = ui.val('br');
                            colorMap.val('xy', { x: br && br.b || 0, y: 255 - (br && br.r || 0) }, context);
                            break;
                        case 'b':
                            var rg = ui.val('rg');
                            colorMap.val('xy', { x: rg && rg.r || 0, y: 255 - (rg && rg.g || 0) }, context);
                            break;
                    }
                }
                if (context != colorBar)
                {
                    switch (settings.color.mode)
                    {
                        case 'h':
                            colorBar.val('y', 360 - (ui.val('h') || 0), context);
                            break;
                        case 's':
                            var s = ui.val('s');
                            colorBar.val('y', 100 - (s != null ? s : 100), context);
                            break;
                        case 'v':
                            var v = ui.val('v');
                            colorBar.val('y', 100 - (v != null ? v : 100), context);
                            break;
                        case 'r':
                            colorBar.val('y', 255 - (ui.val('r') || 0), context);
                            break;
                        case 'g':
                            colorBar.val('y', 255 - (ui.val('g') || 0), context);
                            break;
                        case 'b':
                            colorBar.val('y', 255 - (ui.val('b') || 0), context);
                            break;
                        case 'a':
                            var a = ui.val('a');
                            colorBar.val('y', 100 - (a != null ? a : 100), context);
                            break;
                    }
                }
              },
            updatePreview =
              function (ui)
              {
                try
                {
                    var all = ui.val('all');
                    activePreview.css({ backgroundColor: all && '#' + all.hex || 'transparent' });
                    setAlpha.call($this, activePreview, all && all.a || 0);
                }
                catch (e) { }
              },
            updateMapVisuals =
              function (ui)
              {
                switch (settings.color.mode)
                {
                    case 'h':
                        setBG.call($this, colorMapDiv, new Color({ h: ui.val('h') || 0, s: 100, v: 100 }).val('hex'));
                        break;
                    case 's':
                    case 'a':
                        var s = ui.val('s');
                        setAlpha.call($this, colorMapL2, 100 - (s != null ? s : 100));
                        break;
                    case 'v':
                        var v = ui.val('v');
                        setAlpha.call($this, colorMapL1, v != null ? v : 100);
                        break;
                    case 'r':
                        setAlpha.call($this, colorMapL2, (ui.val('r') || 0) / 255 * 100);
                        break;
                    case 'g':
                        setAlpha.call($this, colorMapL2, (ui.val('g') || 0) / 255 * 100);
                        break;
                    case 'b':
                        setAlpha.call($this, colorMapL2, (ui.val('b') || 0) / 255 * 100);
                        break;
                }
                var a = ui.val('a');
                setAlpha.call($this, colorMapL3, 100 - (a || 0));
              },
            updateBarVisuals =
              function (ui)
              {
                switch (settings.color.mode)
                {
                    case 'h':
                        var a = ui.val('a');
                        setAlpha.call($this, colorBarL5, 100 - (a || 0));
                        break;
                    case 's':
                        var hva = ui.val('hva'),
                        saturatedColor = new Color({ h: hva && hva.h || 0, s: 100, v: hva != null ? hva.v : 100 });
                        setBG.call($this, colorBarDiv, saturatedColor.val('hex'));
                        setAlpha.call($this, colorBarL2, 100 - (hva != null ? hva.v : 100));
                        setAlpha.call($this, colorBarL5, 100 - (hva && hva.a || 0));
                        break;
                    case 'v':
                        var hsa = ui.val('hsa'),
                        valueColor = new Color({ h: hsa && hsa.h || 0, s: hsa != null ? hsa.s : 100, v: 100 });
                        setBG.call($this, colorBarDiv, valueColor.val('hex'));
                        setAlpha.call($this, colorBarL5, 100 - (hsa && hsa.a || 0));
                        break;
                    case 'r':
                    case 'g':
                    case 'b':
                        var hValue = 0, vValue = 0, rgba = ui.val('rgba');
                        if (settings.color.mode == 'r')
                        {
                            hValue = rgba && rgba.b || 0;
                            vValue = rgba && rgba.g || 0;
                        }
                        else if (settings.color.mode == 'g')
                        {
                            hValue = rgba && rgba.b || 0;
                            vValue = rgba && rgba.r || 0;
                        }
                        else if (settings.color.mode == 'b')
                        {
                            hValue = rgba && rgba.r || 0;
                            vValue = rgba && rgba.g || 0;
                        }
                        var middle = vValue > hValue ? hValue : vValue;
                        setAlpha.call($this, colorBarL2, hValue > vValue ? ((hValue - vValue) / (255 - vValue)) * 100 : 0);
                        setAlpha.call($this, colorBarL3, vValue > hValue ? ((vValue - hValue) / (255 - hValue)) * 100 : 0);
                        setAlpha.call($this, colorBarL4, middle / 255 * 100);
                        setAlpha.call($this, colorBarL5, 100 - (rgba && rgba.a || 0));
                        break;
                    case 'a':
                        var a = ui.val('a');
                        setBG.call($this, colorBarDiv, ui.val('hex') || '000000');
                        setAlpha.call($this, colorBarL5, a != null ? 0 : 100);
                        setAlpha.call($this, colorBarL6, a != null ? 100 : 0);
                        break;
                }
              },
            setBG =
              function (el, c)
              {
                el.css({ backgroundColor: c && c.length == 6 && '#' + c || 'transparent' });
              },
            setImg =
              function (img, src)
              {
                if (isLessThanIE7 && (src.indexOf('AlphaBar.png') != -1 || src.indexOf('Bars.png') != -1 || src.indexOf('Maps.png') != -1))
                {
                    img.attr('pngSrc', src);
                    img.css({ backgroundImage: 'none', filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + src + '\', sizingMethod=\'scale\')' });
                }
                else img.css({ backgroundImage: 'url(' + src + ')' });
              },
            setImgLoc =
              function (img, y)
              {
                img.css({ top: y + 'px' });
              },
            setAlpha =
              function (obj, alpha)
              {
                obj.css({ visibility: alpha > 0 ? 'visible' : 'hidden' });
                if (alpha > 0 && alpha < 100)
                {
                    if (isLessThanIE7)
                    {
                        var src = obj.attr('pngSrc');
                        if (src != null && (src.indexOf('AlphaBar.png') != -1 || src.indexOf('Bars.png') != -1 || src.indexOf('Maps.png') != -1))
                            obj.css({ filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + src + '\', sizingMethod=\'scale\') progid:DXImageTransform.Microsoft.Alpha(opacity=' + alpha + ')' });
                        else obj.css({ opacity: alpha / 100 });
                    }
                    else obj.css({ opacity: alpha / 100 });
                }
                else if (alpha == 0 || alpha == 100)
                {
                    if (isLessThanIE7)
                    {
                        var src = obj.attr('pngSrc');
                        if (src != null && (src.indexOf('AlphaBar.png') != -1 || src.indexOf('Bars.png') != -1 || src.indexOf('Maps.png') != -1))
                            obj.css({ filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + src + '\', sizingMethod=\'scale\')' });
                        else obj.css({ opacity: '' });
                    }
                    else obj.css({ opacity: '' });
                }
              },
            revertColor = // revert color to original color when opened
              function ()
              {
                color.active.val('ahex', color.current.val('ahex'));
              },
            commitColor = // commit the color changes
              function ()
              {
                color.current.val('ahex', color.active.val('ahex'));
              },
            radioClicked =
              function (e)
              {
                setColorMode.call($this, e.target.value);
              },
            currentClicked =
              function ()
              {
                revertColor.call($this);
              },
            cancelClicked =
              function ()
              {
                revertColor.call($this);
                settings.window.expandable && hide.call($this);
                typeof cancelCallback === 'function' && cancelCallback.call($this, color.active, cancelButton);
                popupManager.closeLast({ cancelOnClose: true });
              },
            okClicked =
              function ()
              {
                commitColor.call($this);
                settings.window.expandable && hide.call($this);
                typeof commitCallback === 'function' && commitCallback.call($this, color.active, okButton);
                popupManager.closeLast({ cancelOnClose: true });
                $($this).trigger("change");
              },
            iconImageClicked =
              function ()
              {
                showPicker.call($this);
              },
            currentColorChanged =
              function (ui, context)
              {
                var hex = ui.val('hex');
                currentPreview.css({ backgroundColor: hex && '#' + hex || 'transparent' });
                setAlpha.call($this, currentPreview, ui.val('a') || 0);
              },
            expandableColorChanged =
              function (ui, context)
              {
                var hex = ui.val('hex');
                var va = ui.val('va');
                iconColor.css({ backgroundColor: hex && '#' + hex || 'transparent' });
                setAlpha.call($this, iconAlpha, 100 - (va && va.a || 0));
                if (settings.window.bindToInput)
                    settings.window.input.css(
                    {
                        backgroundColor: hex && '#' + hex || 'transparent',
                        color: va && va.v > 75 ? '#000000' : '#ffffff'
                    });
              },
            moveBarMouseDown =
              function (e)
              {
                var element = settings.window.element, // local copies for YUI compressor
                  page = settings.window.page;
                elementStartX = parseInt(container.css('left'));
                elementStartY = parseInt(container.css('top'));
                pageStartX = e.pageX;
                pageStartY = e.pageY;
                // bind events to document to move window - we will unbind these on mouseup
                $(document).on('mousemove', documentMouseMove).on('mouseup', documentMouseUp);
                e.stopPropagation();
                e.preventDefault(); // prevent attempted dragging of the column
                return false;
              },
            documentMouseMove =
              function (e)
              {
                container.css({ left: elementStartX - (pageStartX - e.pageX) + 'px', top: elementStartY - (pageStartY - e.pageY) + 'px' });
                e.stopPropagation();
                e.preventDefault();
                return false;
              },
            documentMouseUp =
              function (e)
              {
                $(document).off('mousemove', documentMouseMove).off('mouseup', documentMouseUp);
                e.stopPropagation();
                e.preventDefault();
                return false;
              },
            quickPickClicked =
              function (e)
              {
                e.preventDefault();
                e.stopPropagation();
                color.active.val('ahex', $(this).attr('title') || null, e.target);
                return false;
              },
            commitCallback = typeof $arguments[1] === 'function' && $arguments[1] || null,
            liveCallback = typeof $arguments[2] === 'function' && $arguments[2] || null,
            cancelCallback = typeof $arguments[3] === 'function' && $arguments[3] || null,
            showPicker =
              function ()
              {
                if (document.all) // In IE, due to calculated z-index values, we need to hide all color picker icons that appear later in the source code than this one
                {
                    var foundthis = false;
                    for (i = 0; i < List.length; i++)
                    {
                        if (foundthis) List[i].icon.css({ display: 'none' });
                        if (List[i] == $this) foundthis = true;
                    }
                }
                color.current.val('ahex', color.active.val('ahex'));
                container.find("input[type=radio]").radiobutton();
                container.find("input[type=text]").addClass("input-control").textbox();
                var ColorPickerPopup = jQuery.popupManager.showPopup({
                    id: "ColorPickerDialog",
                    headerText: "Color Picker", //TO DO LOCALISE
                    modalize: true,
                    content: container,
                    width: 560,
                    height: 377,
                    buttons: [
                    {
                        type: "help",
                        click: function () { HelpHelper.runHelp(7016); }
                    },
                                {
                                    //TO DO CHAT WITH NEIL
                                    text: WizardButtons_OKButtonText, //MessageBox.OKButtonText,
                                    click: okClicked
                                },
                                {
                                    text: WizardButtons_CancelButtonText, //MessageBox.CancelButtonText,
                                    click: cancelClicked
                                    //						            {
                                    //						               // popupManager.closeLast({ cancelOnClose: true });
                                    //						            }
                                }
                            ]
                });
              },
            hide =
              function ()
              {
                if (document.all) // In IE, show the previously hidden color picker icons again
                {
                    var foundthis = false;
                    for (i = 0; i < List.length; i++)
                    {
                        if (foundthis) List[i].icon.css({ display: 'inline-block' });
                        if (List[i] == $this) foundthis = true;
                    }
                }
                switch (settings.window.effects.type)
                {
                    case 'fade':
                        container.fadeOut(settings.window.effects.speed.hide);
                        break;
                    case 'slide':
                        container.slideUp(settings.window.effects.speed.hide);
                        break;
                    case 'show':
                    default:
                        container.hide(settings.window.effects.speed.hide);
                        break;
                }
              },
            initialize =
              function ()
              {
                var win = settings.window;
                // if default colors are hex strings, change them to color objects
                if ((typeof (color.active)).toString().toLowerCase() == 'string') color.active = new Color({ ahex: color.active });
                // inject html source code - we are using a single table for this control - I know tables are considered bad, but it takes care of equal height columns and
                // this control really is tabular data, so I believe it is the right move
                var containerHtml = '<table class="jPicker" cellpadding="0" cellspacing="0"><tbody><tr><td rowspan="9"><div class="Map"><span class="Map1">&nbsp;</span><span class="Map2">&nbsp;</span><span class="Map3">&nbsp;</span><img src="' + images.clientPath + images.colorMap.arrow.file + '" class="Arrow"/></div></td><td rowspan="9"><div class="Bar"><span class="Map1">&nbsp;</span><span class="Map2">&nbsp;</span><span class="Map3">&nbsp;</span><span class="Map4">&nbsp;</span><span class="Map5">&nbsp;</span><span class="Map6">&nbsp;</span><img src="' + images.clientPath + images.colorBar.arrow.file + '" class="Arrow"/></div></td><td colspan="3" class="Preview">' + localization.text.newColor + '<div><span class="Active" title="' + localization.tooltips.colors.newColor + '">&nbsp;</span><span class="Current" title="' + localization.tooltips.colors.currentColor + '">&nbsp;</span></div>' + localization.text.currentColor + '</td><td rowspan="9" class="Button"><div class="Grid">&nbsp;</div></td></tr><tr class="Hue"><td class="Radio"><input type="radio" id="jPicker_Hue_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="h" title="' + localization.tooltips.hue.radio + '"' + (settings.color.mode == 'h' ? ' checked="checked"' : '') + '/></td><td class="Label"><label for="jPicker_Hue_' + List.length + '" title="' + localization.tooltips.hue.radio + '">H:</label></td><td class="Text">';

                var input = $(SCTextbox.html({ value: color.active.val('h') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.hue.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';
                //containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('h') + '" title="' + localization.tooltips.hue.textbox + '"/>';
                containerHtml += '<div style="float:left;margin-left:5px">&deg;</div></td></tr><tr class="Saturation"><td class="Radio"><input type="radio" id="jPicker_Saturation_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="s" title="' + localization.tooltips.saturation.radio + '"' + (settings.color.mode == 's' ? ' checked="checked"' : '') + '/></td><td class="Label"><label for="jPicker_Saturation_' + List.length + '" title="' + localization.tooltips.saturation.radio + '">S:</label></td><td class="Text">';

                input = $(SCTextbox.html({ value: color.active.val('s') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.saturation.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';

                //containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('s') + '" title="' + localization.tooltips.saturation.textbox + '"/>';
                containerHtml += '<div style="float:left;margin-left:5px">%</div></td></tr><tr class="Value"><td class="Radio"><input type="radio" id="jPicker_Value_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="v" title="' + localization.tooltips.value.radio + '"' + (settings.color.mode == 'v' ? ' checked="checked"' : '') + '/><br/><br/></td><td class="Label"><label for="jPicker_Value_' + List.length + '" title="' + localization.tooltips.value.radio + '">V:</label><br/><br/></td><td class="Text">';

                input = $(SCTextbox.html({ value: color.active.val('v') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.value.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';

                //containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('v') + '" title="' + localization.tooltips.value.textbox + '"/>';
                containerHtml += '<div style="float:left;margin-left:5px">%</div><br/><br/></td></tr><tr class="Red"><td class="Radio"><input type="radio" id="jPicker_Red_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="r" title="' + localization.tooltips.red.radio + '"' + (settings.color.mode == 'r' ? ' checked="checked"' : '') + '/></td><td class="Label"><label for="jPicker_Red_' + List.length + '" title="' + localization.tooltips.red.radio + '">R:</label></td><td class="Text">';

                input = $(SCTextbox.html({ value: color.active.val('r') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.red.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';

                // containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('r') + '" title="' + localization.tooltips.red.textbox + '"/>';
                containerHtml += '</td></tr><tr class="Green"><td class="Radio"><input type="radio" id="jPicker_Green_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="g" title="' + localization.tooltips.green.radio + '"' + (settings.color.mode == 'g' ? ' checked="checked"' : '') + '/></td><td class="Label"><label for="jPicker_Green_' + List.length + '" title="' + localization.tooltips.green.radio + '">G:</label></td><td class="Text">';

                input = $(SCTextbox.html({ value: color.active.val('g') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.green.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';

                //containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('g') + '" title="' + localization.tooltips.green.textbox + '"/>';
                containerHtml += '</td></tr><tr class="Blue"><td class="Radio"><input type="radio" id="jPicker_Blue_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="b" title="' + localization.tooltips.blue.radio + '"' + (settings.color.mode == 'b' ? ' checked="checked"' : '') + '/></td><td class="Label"><label for="jPicker_Blue_' + List.length + '" title="' + localization.tooltips.blue.radio + '">B:</label></td><td class="Text">';

                input = $(SCTextbox.html({ value: color.active.val('b') }));
                input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.blue.textbox)
                containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div>';


                //containerHtml += '<input type="text" maxlength="3" value="' + color.active.val('b') + '" title="' + localization.tooltips.blue.textbox + '"/>';
                containerHtml += '</td></tr><tr class="Alpha"><td class="Radio">' + (win.alphaSupport ? '<input type="radio" id="jPicker_Alpha_' + List.length + '" name="jPicker_Mode_' + List.length + '" value="a" title="' + localization.tooltips.alpha.radio + '"' + (settings.color.mode == 'a' ? ' checked="checked"' : '') + '/>' : '&nbsp;') + '</td><td class="Label">'
                containerHtml += (win.alphaSupport ? '<label for="jPicker_Alpha_' + List.length + '" title="' + localization.tooltips.alpha.radio + '">A:</label>' : '&nbsp;') + '</td><td class="Text">';

                if (win.alphaSupport)
                {
                    input = $(SCTextbox.html({ value: color.active.val('a') }));
                    input.find("input[type=text]").attr("maxLength", "3").attr("title", localization.tooltips.alpha.textbox);
                    containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div><div style="float:left;margin-left:5px">%</div>';
                }

                //containerHtml += (win.alphaSupport ? '<input type="text" maxlength="3" value="' + color.active.val('a') + '" title="' + localization.tooltips.alpha.textbox + '"/>&nbsp;%' : '&nbsp;');
                containerHtml += '</td></tr><tr class="Hex"><td colspan="3" class="Text"><label style="float:left;" for="jPicker_Hex_' + List.length + '" title="' + localization.tooltips.hex.textbox + '">#:</label>';



                input = $(SCTextbox.html({ id: 'jPicker_Hex_' + List.length, value: color.active.val('hex') }));
                input.find("input[type=text]").attr("maxLength", "6").attr("title", localization.tooltips.hex.textbox);
                containerHtml += '<div class="input-control">' + input.html() + '</div>';


                //containerHtml += '<input type="text" maxlength="6" class="Hex" id="jPicker_Hex_' + List.length + '" value="' + color.active.val('hex') + '" title="' + localization.tooltips.hex.textbox + '"/>';

                if (win.alphaSupport)
                {
                    input = $(SCTextbox.html({ value: color.active.val('ahex').substring(6) }));
                    input.find("input[type=text]").attr("maxLength", "2").attr("title", localization.tooltips.hex.alpha).addClass("AHex");
                    containerHtml += '<div class="input-control" style="width:40px;float:left;margin-left:5px">' + input.html() + '</div><div style="float:left;margin-left:5px">%</div>';
                }

                //containerHtml += (win.alphaSupport ? '<input type="text" maxlength="2" class="AHex" value="' + color.active.val('ahex').substring(6) + '" title="' + localization.tooltips.hex.alpha + '"/></td>' : '&nbsp;')
                containerHtml + '</tr></tbody></table>';
                container = $(containerHtml);
                // initialize the objects to the source code just injected
                var tbody = container.find('tbody:first');
                colorMapDiv = tbody.find('div.Map:first');
                colorBarDiv = tbody.find('div.Bar:first');
                var MapMaps = colorMapDiv.find('span'),
                    BarMaps = colorBarDiv.find('span');
                colorMapL1 = MapMaps.filter('.Map1:first');
                colorMapL2 = MapMaps.filter('.Map2:first');
                colorMapL3 = MapMaps.filter('.Map3:first');
                colorBarL1 = BarMaps.filter('.Map1:first');
                colorBarL2 = BarMaps.filter('.Map2:first');
                colorBarL3 = BarMaps.filter('.Map3:first');
                colorBarL4 = BarMaps.filter('.Map4:first');
                colorBarL5 = BarMaps.filter('.Map5:first');
                colorBarL6 = BarMaps.filter('.Map6:first');
                // create color pickers and maps
                colorMap = new Slider(colorMapDiv,
                  {
                    map:
                    {
                        width: images.colorMap.width,
                        height: images.colorMap.height
                    },
                    arrow:
                    {
                        image: images.clientPath + images.colorMap.arrow.file,
                        width: images.colorMap.arrow.width,
                        height: images.colorMap.arrow.height
                    }
                  });
                colorMap.bind(mapValueChanged);
                colorBar = new Slider(colorBarDiv,
                  {
                    map:
                    {
                        width: images.colorBar.width,
                        height: images.colorBar.height
                    },
                    arrow:
                    {
                        image: images.clientPath + images.colorBar.arrow.file,
                        width: images.colorBar.arrow.width,
                        height: images.colorBar.arrow.height
                    }
                  });
                colorBar.bind(colorBarValueChanged);
                colorPicker = new ColorValuePicker(tbody, color.active, win.expandable && win.bindToInput ? win.input : null);
                var hex = color.active.val('hex'),
                    preview = tbody.find('.Preview'),
                    button = tbody.find('.Button');
                activePreview = preview.find('.Active:first').css({ backgroundColor: hex && '#' + hex || 'transparent' });
                currentPreview = preview.find('.Current:first').css({ backgroundColor: hex && '#' + hex || 'transparent' }).on('click', currentClicked);

                grid = button.find('.Grid:first');
                setTimeout(
                  function ()
                  {
                    setImg.call($this, colorMapL1, images.clientPath + 'Maps.png');
                    setImg.call($this, colorMapL2, images.clientPath + 'Maps.png');
                    setImg.call($this, colorMapL3, images.clientPath + 'map-opacity.png');
                    setImg.call($this, colorBarL1, images.clientPath + 'Bars.png');
                    setImg.call($this, colorBarL2, images.clientPath + 'Bars.png');
                    setImg.call($this, colorBarL3, images.clientPath + 'Bars.png');
                    setImg.call($this, colorBarL4, images.clientPath + 'Bars.png');
                    setImg.call($this, colorBarL5, images.clientPath + 'bar-opacity.png');
                    setImg.call($this, colorBarL6, images.clientPath + 'AlphaBar.png');
                    setImg.call($this, preview.find('div:first'), images.clientPath + 'preview-opacity.png');
                  }, 0);
                tbody.find('td.Radio input').on('click', radioClicked);
                // initialize quick list
                if (color.quickList && color.quickList.length > 0)
                {
                    var html = '';
                    for (i = 0; i < color.quickList.length; i++)
                    {
                        /* if default colors are hex strings, change them to color objects */
                        if ((typeof (color.quickList[i])).toString().toLowerCase() == 'string') color.quickList[i] = new Color({ hex: color.quickList[i] });
                        var rgba = color.quickList[i].val('ahex');
                        var quickHex = color.quickList[i].val('hex');
                        html += '<span class="QuickColor" title="' + (rgba && '#' + rgba || '') + '" style="background-color: ' + (quickHex && '#' + quickHex || 'transparent') + ';' + (quickHex ? '' : ' background-image: url(' + images.clientPath + 'NoColor.png);') + '">&nbsp;</span>';
                    }
                    grid.html(html);
                    grid.find('.QuickColor').on('click', quickPickClicked);
                }
                setColorMode.call($this, settings.color.mode);
                color.active.bind(activeColorChanged);
                typeof liveCallback === 'function' && color.active.bind(liveCallback);
                color.current.bind(currentColorChanged);
                // bind to input
                if (win.expandable)
                {
                    $this.icon = $($this).next().find('.Icon:first');
                    iconColor = $this.icon.find('.Color:first').css({ backgroundColor: hex && '#' + hex || 'transparent' });
                    iconAlpha = $this.icon.find('.Alpha:first');
                    setImg.call($this, iconAlpha, images.clientPath + 'bar-opacity.png');
                    setAlpha.call($this, iconAlpha, 100 - color.active.val('a'));
                    iconImage = $this.icon.find('.Image:first').css(
                    {
                        backgroundImage: 'url(' + images.clientPath + images.picker.file + ')'
                    })
                    if (!$($this).attr("disabled"))
                    {
                        iconImage.on('click', iconImageClicked);
                    }
                    else
                    {
                        $this.icon.addClass("disabled");
                    }
                    if (win.bindToInput)
                        win.input.css(
                      {
                        backgroundColor: hex && '#' + hex || 'transparent',
                        color: color.active.val('v') > 75 ? '#000000' : '#ffffff'
                      });
                    moveBar = tbody.find('.Move:first').on('mousedown', moveBarMouseDown);
                    color.active.bind(expandableColorChanged);
                }
                else showPicker.call($this);
                $.jPicker.List.push($this);
              },
            destroy =
              function ()
              {
                container.find('td.Radio input').off('click', radioClicked);
                currentPreview.off('click', currentClicked);
                if (settings.window.expandable)
                {
                    iconImage.off('click', iconImageClicked);
                    moveBar.off('mousedown', moveBarMouseDown);
                    $this.icon = null;
                }
                container.find('.QuickColor').off('click', quickPickClicked);
                colorMapDiv = null;
                colorBarDiv = null;
                colorMapL1 = null;
                colorMapL2 = null;
                colorMapL3 = null;
                colorBarL1 = null;
                colorBarL2 = null;
                colorBarL3 = null;
                colorBarL4 = null;
                colorBarL5 = null;
                colorBarL6 = null;
                colorMap.destroy();
                colorMap = null;
                colorBar.destroy();
                colorBar = null;
                colorPicker.destroy();
                colorPicker = null;
                activePreview = null;
                currentPreview = null;
                okButton = null;
                cancelButton = null;
                grid = null;
                commitCallback = null;
                cancelCallback = null;
                liveCallback = null;
                container.html('');
                for (i = 0; i < List.length; i++) if (List[i] == $this) List.splice(i, 1);
              },
            images = settings.images, // local copies for YUI compressor
            localization = settings.localization,
            color =
              {
                active: (typeof (settings.color.active)).toString().toLowerCase() == 'string' ? new Color({ ahex: settings.color.active }) : new Color({ ahex: settings.color.active.val('ahex') }),
                current: (typeof (settings.color.active)).toString().toLowerCase() == 'string' ? new Color({ ahex: settings.color.active }) : new Color({ ahex: settings.color.active.val('ahex') }),
                quickList: settings.color.quickList
              };
            $.extend(true, $this, // public properties, methods, and callbacks
            {
            commitCallback: commitCallback, // commitCallback function can be overridden to return the selected color to a method you specify when the user clicks "OK"
            liveCallback: liveCallback, // liveCallback function can be overridden to return the selected color to a method you specify in live mode (continuous update)
            cancelCallback: cancelCallback, // cancelCallback function can be overridden to a method you specify when the user clicks "Cancel"
            color: color,
            showPicker: showPicker,
            hide: hide,
            destroy: destroy // destroys this control entirely, removing all events and objects, and removing itself from the List
           });
            setTimeout(jQuery.proxy(initialize, this), 40);
        });
    };
    $.fn.jPicker.defaults = /* jPicker defaults - you can change anything in this section (such as the clientPath to your images) without fear of breaking the program */
      {
      window:
        {
            effects:
          {
            type: 'slide', /* effect used to show/hide an expandable picker. Acceptable values "slide", "show", "fade" */
            speed:
            {
                show: 'slow', /* duration of "show" effect. Acceptable values are "fast", "slow", or time in ms */
                hide: 'fast' /* duration of "hide" effect. Acceptable values are "fast", "slow", or time in ms */
            }
          },
            position:
          {
            x: 'screenCenter', /* acceptable values "left", "center", "right", "screenCenter", or relative px value */
            y: 'top' /* acceptable values "top", "bottom", "center", or relative px value */
          },
            expandable: false, /* default to large static picker - set to true to make an expandable picker (small icon with popup) - set automatically when binded to input element */
            liveUpdate: true, /* set false if you want the user to have to click "OK" before the binded input box updates values */
            alphaSupport: false /* set to true to enable alpha picking */
        },
      color:
        {
            mode: 'h', /* acceptabled values "h" (hue), "s" (saturation), "v" (value), "r" (red), "g" (green), "b" (blue), "a" (alpha) */
            active: new Color({ ahex: '#ffcc00ff' }), /* acceptable values are any declared $.jPicker.Color object or string HEX value (e.g. #ffc000) WITH OR WITHOUT the "#" prefix */
            quickList: /* the quick pick color list */
            [
              new Color({ h: 360, s: 33, v: 100 }), /* acceptable values are any declared $.jPicker.Color object or string HEX value (e.g. #ffc000) WITH OR WITHOUT the "#" prefix */
              new Color({ h: 360, s: 66, v: 100 }),
              new Color({ h: 360, s: 100, v: 100 }),
              new Color({ h: 360, s: 100, v: 75 }),
              new Color({ h: 360, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 100 }),
              new Color({ h: 30, s: 33, v: 100 }),
              new Color({ h: 30, s: 66, v: 100 }),
              new Color({ h: 30, s: 100, v: 100 }),
              new Color({ h: 30, s: 100, v: 75 }),
              new Color({ h: 30, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 90 }),
              new Color({ h: 60, s: 33, v: 100 }),
              new Color({ h: 60, s: 66, v: 100 }),
              new Color({ h: 60, s: 100, v: 100 }),
              new Color({ h: 60, s: 100, v: 75 }),
              new Color({ h: 60, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 80 }),
              new Color({ h: 90, s: 33, v: 100 }),
              new Color({ h: 90, s: 66, v: 100 }),
              new Color({ h: 90, s: 100, v: 100 }),
              new Color({ h: 90, s: 100, v: 75 }),
              new Color({ h: 90, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 70 }),
              new Color({ h: 120, s: 33, v: 100 }),
              new Color({ h: 120, s: 66, v: 100 }),
              new Color({ h: 120, s: 100, v: 100 }),
              new Color({ h: 120, s: 100, v: 75 }),
              new Color({ h: 120, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 60 }),
              new Color({ h: 150, s: 33, v: 100 }),
              new Color({ h: 150, s: 66, v: 100 }),
              new Color({ h: 150, s: 100, v: 100 }),
              new Color({ h: 150, s: 100, v: 75 }),
              new Color({ h: 150, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 50 }),
              new Color({ h: 180, s: 33, v: 100 }),
              new Color({ h: 180, s: 66, v: 100 }),
              new Color({ h: 180, s: 100, v: 100 }),
              new Color({ h: 180, s: 100, v: 75 }),
              new Color({ h: 180, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 40 }),
              new Color({ h: 210, s: 33, v: 100 }),
              new Color({ h: 210, s: 66, v: 100 }),
              new Color({ h: 210, s: 100, v: 100 }),
              new Color({ h: 210, s: 100, v: 75 }),
              new Color({ h: 210, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 30 }),
              new Color({ h: 240, s: 33, v: 100 }),
              new Color({ h: 240, s: 66, v: 100 }),
              new Color({ h: 240, s: 100, v: 100 }),
              new Color({ h: 240, s: 100, v: 75 }),
              new Color({ h: 240, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 20 }),
              new Color({ h: 270, s: 33, v: 100 }),
              new Color({ h: 270, s: 66, v: 100 }),
              new Color({ h: 270, s: 100, v: 100 }),
              new Color({ h: 270, s: 100, v: 75 }),
              new Color({ h: 270, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 10 }),
              new Color({ h: 300, s: 33, v: 100 }),
              new Color({ h: 300, s: 66, v: 100 }),
              new Color({ h: 300, s: 100, v: 100 }),
              new Color({ h: 300, s: 100, v: 75 }),
              new Color({ h: 300, s: 100, v: 50 }),
              new Color({ h: 180, s: 0, v: 0 }),
              new Color({ h: 330, s: 33, v: 100 }),
              new Color({ h: 330, s: 66, v: 100 }),
              new Color({ h: 330, s: 100, v: 100 }),
              new Color({ h: 330, s: 100, v: 75 }),
              new Color({ h: 330, s: 100, v: 50 }),
              new Color()
            ]
        },
      images:
        {
            clientPath: 'StyleBuilder/Styles/Platinum/Images/', /* Path to image files */
            colorMap:
          {
            width: 256,
            height: 256,
            arrow:
            {
                file: 'mappoint.gif', /* ColorMap arrow icon */
                width: 15,
                height: 15
            }
          },
            colorBar:
          {
            width: 20,
            height: 256,
            arrow:
            {
                file: 'rangearrows.gif', /* ColorBar arrow icon */
                width: 20,
                height: 7
            }
          },
            picker:
          {
            file: 'picker.gif', /* Color Picker icon */
            width: 25,
            height: 24
          }
        },
      localization: /* alter these to change the text presented by the picker (e.g. different language) */
        {
        text:
          {
            newColor: 'new',
            currentColor: 'current',
            ok: 'OK',
            cancel: 'Cancel'
          },
        tooltips:
          {
            colors:
            {
                newColor: 'New Color - Press &ldquo;OK&rdquo; To Commit',
                currentColor: 'Click To Revert To Original Color'
            },
            buttons:
            {
                ok: 'Commit To This Color Selection',
                cancel: 'Cancel And Revert To Original Color'
            },
            hue:
            {
                radio: 'Set To &ldquo;Hue&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Hue&rdquo; Value (0-360&deg;)'
            },
            saturation:
            {
                radio: 'Set To &ldquo;Saturation&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Saturation&rdquo; Value (0-100%)'
            },
            value:
            {
                radio: 'Set To &ldquo;Value&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Value&rdquo; Value (0-100%)'
            },
            red:
            {
                radio: 'Set To &ldquo;Red&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Red&rdquo; Value (0-255)'
            },
            green:
            {
                radio: 'Set To &ldquo;Green&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Green&rdquo; Value (0-255)'
            },
            blue:
            {
                radio: 'Set To &ldquo;Blue&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Blue&rdquo; Value (0-255)'
            },
            alpha:
            {
                radio: 'Set To &ldquo;Alpha&rdquo; Color Mode',
                textbox: 'Enter A &ldquo;Alpha&rdquo; Value (0-100)'
            },
            hex:
            {
                textbox: 'Enter A &ldquo;Hex&rdquo; Color Value (#000000-#ffffff)',
                alpha: 'Enter A &ldquo;Alpha&rdquo; Value (#00-#ff)'
            }
          }
       }
     };
})(jQuery, '1.1.2');
