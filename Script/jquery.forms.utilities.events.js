(function ($)
{

	$.fn.extend({
		copyEvents: function (from)
		{
			$.event.copy($(from), this);
			return this;
		},

		copyEventsTo: function (to)
		{
			$.event.copy(this, $(to));
			return this;
		}
	});

	$.event.copy = function (from, to)
	{
		var events = $.data(from[0], 'events');
		if (!from.size() || !events || !to.size()) return;

		to.each(function ()
		{
			for (var type in events)
				for (var handler in events[type])
					$.event.add(this, type, events[type][handler], events[type][handler].data);
		});
	};

	$.fn.extend({

		disable: function ()
		{

			var clone = $(this).clone(true).hide();
			$(this).data("clone", clone);
			$(this).off();

		},

		enable: function ()
		{
			var clone = $(this).data("clone");
			if (checkExists(clone))
			{
				clone.copyEventsTo(this);
				clone.remove();
				$(this).removeData("clone");
			}

		}

	});

	/* 
	jQuery input special event v1.0
	http://whattheheadsaid.com/projects/input-special-event
	*/
	$.event.special.input = {
		setup: function (data, namespaces)
		{
			var timer,
			// Get a reference to the element
				elem = this,
			// Store the current state of the element
				state = elem.value,
			// Create a dummy element that we can use for testing event support
				tester = document.createElement(this.tagName),
			// Check for native oninput
				oninput = "oninput" in tester || checkEvent(tester),
			// Check for onpropertychange
				onprop = "onpropertychange" in tester;

			function checkState()
			{
				if (elem.value !== state)
					state = elem.value,
					$(elem).trigger("input");
			}

			// Set up a function to handle the different events that may fire
			function handler(e)
			{
				// If it's a propertychange event, just trigger the input event
				if (e.type === "propertychange" && window.event.propertyName === "value")
					$(this).trigger("input");

					// When focusing or mouseentering, set a timer that polls for changes to the value
				else if (e.type === "focus")
				{
					checkState();
					clearInterval(timer),
					timer = window.setInterval(checkState, 250);
				}

					// When blurring or mouseleaving, cancel the aforeset timer
				else if (e.type === "blur")
					window.clearInterval(timer);

					// For all other events, queue a timer to check state ASAP
				else
					window.setTimeout(checkState, 0);
			}

			// Bind to native event if available
			if (oninput)
				return false;

				// Else fall back to propertychange if available
			else if (onprop)
				$(this).on("propertychange", handler);

				// Else clutch at straws!
			else
				$(this).on("focus blur paste cut keydown drop", handler);

			$(this).data("inputEventHandler", handler);
		},
		teardown: function ()
		{
			$(this).off("focus blur propertychange paste cut keydown drop", $(this).data("inputEventHandler"));
		}
	};

	// Setup our jQuery shorthand method
	$.fn.input = function (handler)
	{
		return handler ? this.on("input", handler) : this.trigger("input");
	}

	/* 
	The following function tests an element for oninput support in Firefox.  Many thanks to
	http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
	*/
	function checkEvent(el)
	{
		// First check, for if Firefox fixes its issue with el.oninput = function
		el.setAttribute("oninput", "return");
		if (typeof el.oninput === "function")
			return true;

		// Second check, because Firefox doesn't map oninput attribute to oninput property
		try
		{
			var e = document.createEvent("KeyboardEvent"),
				ok = false,
				tester = function (e)
				{
					ok = true;
					e.preventDefault();
					e.stopPropagation();
				}
			e.initKeyEvent("keypress", true, true, window, false, false, false, false, 0, "e".charCodeAt(0));
			document.body.appendChild(el);
			el.addEventListener("input", tester, false);
			//el.focus(); //ToDo: Investigate why unremarking this line (original implementation) breaks tree functionality
			el.dispatchEvent(e);
			el.removeEventListener("input", tester, false);
			document.body.removeChild(el);
			return ok;
		} catch (e) { }
	}

})(jQuery);
