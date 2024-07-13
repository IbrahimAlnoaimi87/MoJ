var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.ObjectUtils = SourceCode.Forms.ObjectUtils || {};

(function ()
{
	var ou = SourceCode.Forms.ObjectUtils;

	/**
	* Deep compares two objects and arrays to determine if they are equal.
	* Ignores functions
	*/
	SourceCode.Forms.ObjectUtils.isEqual = function(object1, object2)
	{
		// Object.keys is apparently just as slow as a for loop, but at least it won't enter child objects.
		// browser optimisations should also speed it up.
		if (Object.keys(object1).length !== Object.keys(object2).length)
		{
			return false;
		}

		for (prop in object1)
		{
			if (typeof object1[prop] === "function")
			{
				continue;
			}

			if (typeof object1[prop] !== "object")
			{
				if (object2[prop] !== object1[prop])
				{
					return false;
				}
			}
			else
			{
				var result = ou.isEqual(object1[prop], object2[prop]);

				if (result === false)
				{
					return false;
				}
			}
		}

		return true;
	}
})();