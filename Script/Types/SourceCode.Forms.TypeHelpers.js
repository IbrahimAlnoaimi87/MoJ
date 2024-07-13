var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.TypeHelper = SourceCode.Forms.TypeHelper || {};

(function ()
{
	var TypeHelpers = SourceCode.Forms.TypeHelper;

	TypeHelpers.handlePropertyError = function (options)
	{
		throw options.message;
	};

	TypeHelpers.addToCollection = function (collectionName, data, obj)
	{
		if (checkExists(data) && checkExists(data[collectionName]))
		{
			if (Array.isArray(data[collectionName]))
			{
				obj[collectionName].addArray(data[collectionName]);
			}
			else
			{
				obj[collectionName].addCollection(data[collectionName]);
			}

			delete data[collectionName];
		}
	};

	TypeHelpers.setObjProperties = function (obj, typeDefinition, values)
	{
		values = values || {};
		if (checkExists(obj) && checkExists(typeDefinition))
		{
			var properties = Object.getOwnPropertyNames(typeDefinition);
			for (var i = 0; i < properties.length; i++)
			{
				var property = properties[i];
				setProperty(obj, typeDefinition[property], values[property], property);
			}
		}
	};

	TypeHelpers.extend = function (type)
	{
		return {
			// we will use arguments, so we can use it easily with $.extend. The argument names are just for demonstration
			with: function (baseclass1, baseclass2, baseclass3, baseclass4, baseclass5, baseclass6, baseclass7, baseclass8)
			{
				// put the udt, child, class first in the arguments array-like object. That's what we want to extend
				[].unshift.call(arguments, type.prototype);
				$.extend.apply(null, arguments); // extend using jquery.extend, and just pass the args through
			}
		}
	};

	var setProperty = function (obj, defaultValue, val, property)
	{
		// Only set options that exist on the control
		if (typeof (defaultValue) !== 'undefined') // null is also a valid default value
		{
			if (typeof (val) !== 'undefined')
			{
				obj[property] = val;
			}
			else
			{
				obj[property] = defaultValue;
			}
		}
		else
		{
			TypeError.handlePropertyError({
				message: property + " is not a valid property for " + obj.caller,
			});
		}
	};

})();