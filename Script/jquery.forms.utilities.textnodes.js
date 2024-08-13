(function ($)
{

	$.fn.textNodes = function ()
	{
		return $(this).contents().filter(function () { return this.nodeType === 3 || this.nodeName === "BR"; });
	};

	$.fn.removeTextNodes = function ()
	{
		var tns = $(this).textNodes();
		for (var i = 0, l = tns.length; i < l; i++)
		{
			tns[i].parentNode.removeChild(tns[i]);
		}
	};

	$.fn.highlightText = function ()
	{
		// handler first parameter
		// is the first parameter a regexp?
		var re, hClass, reStr, argType = $type(arguments[0]), defaultTagName = $.fn.highlightText.defaultTagName;

		if (argType === "regexp")
		{
			// first argument is a regular expression
			re = arguments[0];
		}
		// is the first parameter an array?
		else if (argType === "array")
		{
			// first argument is an array, generate
			// regular expression string for later use
			reStr = arguments[0].join("|");
		}
		// is the first parameter a string?
		else if (argType === "string")
		{
			// store string in regular expression string
			// for later use
			reStr = arguments[0];
		}
		// else, return out and do nothing because this
		// argument is required.
		else
		{
			return;
		}

		// the second parameter is optional, however,
		// it must be a string or boolean value. If it is 
		// a string, it will be used as the highlight class.
		// If it is a boolean value and equal to true, it 
		// will be used as the third parameter and the highlight
		// class will default to "highlight". If it is undefined,
		// the highlight class will default to "highlight" and 
		// the third parameter will default to false, allowing
		// the plugin to match partial matches.
		// ** The exception is if the first parameter is a regular
		// expression, the third parameter will be ignored.
		argType = $type(arguments[1]);
		if (argType === "string")
		{
			hClass = arguments[1];
		}
		else if (argType === "boolean")
		{
			hClass = "highlight-text";
			if (reStr) reStr = "\\b" + reStr + "\\b";
		}
		else
		{
			hClass = "highlight-text";
		}

		if (arguments[2] && reStr) reStr = "\\b" + reStr + "\\b";

		// if re is not defined ( which means either an array or
		// string was passed as the first parameter ) create the
		// regular expression.
		if (!re)
		{
			var regexChars = ["^", "$", ".", "|", "?", "*", "+", "(", ")", "{", "}", "\\", "[", "]"];
			for (var i = 0; i < reStr.length; i++)
			{
				for (var j = 0; j < regexChars.length; j++)
				{
					if (reStr.charAt(i) === regexChars[j])
					{
						reStr = reStr.substr(0, i) + "\\" + reStr.substr(i);
						i++;
						break;
					}
				}
			}

			re = new RegExp("(" + reStr.htmlEncode() + ")", "ig");
		}

		// iterate through each matched element
		return this.each(function ()
		{
			// select all contents of this element & filter to only text nodes that aren't already highlighted
			$(this).find("*").addBack().contents().filter(function ()
			{
				return this.nodeType === 3 && $(this).closest("." + hClass).length === 0;
			}).each(function ()
			{
				// loop through each text node
				var output;
				output = this.nodeValue.htmlEncode().replace(re, "<" + defaultTagName + " class='" + hClass + "'>$1</" + defaultTagName + ">");
				if (output !== this.nodeValue) $(this).wrap("<p></p>").parent().html(output).contents().unwrap();
			});
		});
	};

	$.fn.highlightText.defaultTagName = "span";

	$.fn.removeHighlight = function (hClass)
	{
		var argType = $type(arguments[0]), defaultTagName = $.fn.highlightText.defaultTagName;

		// if highlight classes have been specified use it else default to 'highlight'
		if (argType === "string")
		{
			hClass = arguments[0].replace(/\w/gi, ".");
		}
		else
		{
			hClass = "highlight-text";
		}

		// iterate through each matched element
		return this.each(function ()
		{
			$(this).find("." + hClass).each(function ()
			{
				var s = this.firstChild.nodeValue;

				if (this.previousSibling !== null && this.previousSibling.nodeType === 3)
				{
					s = this.previousSibling.nodeValue + s;
					this.parentNode.removeChild(this.previousSibling);
				}

				if (this.nextSibling !== null && this.nextSibling.nodeType === 3)
				{
					s = s + this.nextSibling.nodeValue;
					this.parentNode.removeChild(this.nextSibling);
				}

				this.parentNode.replaceChild(document.createTextNode(s), this);
			});
		});
	};

})(jQuery);
