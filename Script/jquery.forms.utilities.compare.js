(function ($)
{

	$.compare = function (a, b)
	{

		var c, d;

		for (key in a)
		{
			if (a.hasOwnProperty(key) && b.hasOwnProperty(key))
			{
				c = a[key];
				d = b[key];
				if (c && typeof c === "object" && d && typeof d === "object")
				{
					if (!$.compare(c, d)) return false;
				} 
				else
				{
					if (c !== d) return false;
				}
			} 
			else
			{
				return false;
			}
		}

		for (key in b)
		{
			if (a.hasOwnProperty(key) && b.hasOwnProperty(key))
			{
				c = a[key];
				d = b[key];
				if (c && typeof c === "object" && d && typeof d === "object")
				{
					if (!$.compare(d, c)) return false;
				} 
				else
				{
					if (c !== d) return false;
				}
			} 
			else
			{
				return false;
			}
		}

		return true;

	}

})(jQuery);
