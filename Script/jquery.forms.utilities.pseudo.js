(function ($)
{

    $.expr.pseudos.overflown = function (el)
	{
		return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
	}

    $.expr.pseudos.scrollable = function (el)
	{
		return ["auto", "scroll"].indexOf($(el).css("overflow")) !== -1 || ["auto", "scroll"].indexOf($(el).css("overflowX")) !== -1 || ["auto", "scroll"].indexOf($(el).css("overflowY")) !== -1;
	}

    $.expr.pseudos.metadata = function (el, idx, args, coll)
	{
		var qry = args[3], opts, m = $(el).metadata(), key, value;

		if ($.isEmptyObject(m)) return false;

		if (opts = qry.split("^=").length > 1)
		{
			key = opts[0];
			value = opts[1].match("^\'(.*)?\'$")[1];
			return m[key].search("^" + value) !== -1;
		}
		else if (opts = qry.split("$=").length > 1)
		{
			key = opts[0];
			value = opts[1].match("^\'(.*)?\'$")[1];
			return m[key].search(value + "$") !== -1;
		}
		else if (opts = qry.split("~=").length > 1)
		{
			key = opts[0];
			value = opts[1].match("^\'(.*)?\'$")[1];
			return m[key].search(value) !== -1;
		}
		else if (opts = qry.split("!=").length > 1)
		{
			if (typeof m[opts[0]] !== "undefined")
			{
				key = opts[0];
				if (opts[1].search("^\'(.*)?\'$") !== -1)
				{
					// String comparison
					value = opts[1].match("^\'(.*)?\'$")[1];
				}
				else
				{
					value = parseInt(opts[1]);
					if (isNaN(value))
					{
						if (opts[1].toLowerCase() === "true") value = true;
						if (opts[1].toLowerCase() === "false") value = false;
						if (opts[1].toLowerCase() === "null") value = null;
					}
				}
				return m[key] !== value;
			}
		}
		else if (opts = qry.split("=").length > 1)
		{
			if (typeof m[opts[0]] !== "undefined")
			{
				key = opts[0];
				if (opts[1].search("^\'(.*)?\'$") !== -1)
				{
					// String comparison
					value = opts[1].match("^\'(.*)?\'$")[1];
				}
				else
				{
					value = parseInt(opts[1]);
					if (isNaN(value))
					{
						if (opts[1].toLowerCase() === "true") value = true;
						if (opts[1].toLowerCase() === "false") value = false;
						if (opts[1].toLowerCase() === "null") value = null;
					}
				}
				return m[key] === value;
			}
		}

		return false;
	}

})(jQuery);
