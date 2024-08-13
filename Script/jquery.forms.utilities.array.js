(function($) {

	$.extend({
		
		every: function(elems, callback, thisObject) {
			
			if (typeof callback !== "function") throw new TypeError();
			
			var thisp = arguments[2];
			
			for (var i = 0, l = elems.length; i < l; i++) {
				if (i in elems && !callback.call(thisp, elems[i], i, elems)) return false;
			}
			
			return true;

        },

        some: function(elems, callback, thisObject) {

            if (typeof callback !== "function") throw new TypeError();

            var thisp = arguments[2];

            for (var i = 0, l = elems.length; i < l; i++) {
                if (i in elems && callback.call(thisp, elems[i], i, elems)) return true;
            }

            return false;
        }
		
	});

})(jQuery);
