(function ($)
{
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	// "function", followed by 1+ whitespace chars, followed by 1+ any char, followed by 0+ whitespace chars, followed by "(".
	var funcNameRegex = /function\s{1,}(.{1,})\s{0,}\(/;

	var defaultReplacer = function (key, value) { return value; };

	// Gets the type of an object, this includes primivites and custom types.
	var getType = function (o)
	{
		if (o === null)
			return null;
		var type = typeof o;
		if (type === 'object')
		{
			var results = funcNameRegex.exec(o.constructor.toString());
			return (results && results.length > 1) ? results[1] : "";
		}
		else
			return type;
	};

	// Escapes a string.
	var escapedString = function (o)
	{
		var result = '"';
		for (var i = 0; i < o.length; i++)
		{
			var c = o.charAt(i);
			switch (c)
			{
				case '"': result += '\\"'; break;
				case '\\': result += '\\\\'; break;
				// case '/': result += '\\/'; break;                                                                                    
				case '\b': result += '\\b'; break;
				case '\f': result += '\\f'; break;
				case '\n': result += '\\n'; break;
				case '\r': result += '\\r'; break;
				case '\t': result += '\\t'; break;
				default:
					var cc = c.charCodeAt(0);
					if (
					// U+0000–U+001F and U+007F come from ASCII
									(cc >= 0x0000 && cc <= 0x001F) || cc === 0x007F ||
					// U+0080–U+009F were used in conjunction with ISO 8859
									(cc >= 0x0080 && cc <= 0x009F) ||
					// provide support for interlinear annotation (U+FFF9, U+FFFA, U+FFFB)
									cc === 0xFFF9 || c === 0xFFFA || c === 0xFFFB ||
					// bidirectional text control
									cc === 0x200E || cc === 0x200F || cc === 0x202A || cc === 0x202B || cc === 0x202C || cc === 0x202D || cc === 0x202E)
					{
						// Can't use bit shifts because they won't mean the same thing across
						// platforms (e.g. mobile phones).
						result += '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
					}
					else
					{
						result += c;
					}
					break;
			}
		}
		return result + '"';
	};

	$.toJSON = typeof JSON === 'object' && typeof JSON.stringify === 'function' && JSON.stringify ? JSON.stringify
	: function (o, replacer, space)
	{
		/// <summary> Serializes a JScript value into JavaScript Object Notation (JSON) text. </summary>
		/// <param name='o' type='mixed'> Required. A JScript value, usually an object or array, to be serialized. </param>
		/// <param name='replacer' type='mixed'> Optional. A function or array that filters and transforms the results. </param>
		/// <param name='space' type='mixed'> Currently unused. </param>
		/// <returns> A string that contains the serialized JSON text. </returns>
		/// <remarks>
		/// <para>The serialized JSON will be safe and will contain no executable code; only string and number
		/// keys are supported. As per the JSON.stringify specification objects can optionally provide a 
		/// toJSON implementation that should return a value containing the wire representation of the object.</para>
		/// <para>The native browser implementation is used, if available.</para>
		/// </remarks>
		if (typeof replacer === 'undefined' || replacer === null)
			replacer = defaultReplacer;
		if (getType(replacer) === 'Array')
		{
			var replacerCopy = replacer;
			replacer = function (key, value)
			{
				return (key === '' || $.inArray(key, replacerCopy) >= 0) ? value : undefined;
			};
		}

		o = replacer('', o);

		if (o === null)
			return 'null';
		else if (typeof o === 'undefined')
			return '';

		switch (getType(o))
		{
			case 'undefined': return undefined;
			case 'number': return '' + o;
			case 'string': return escapedString(o);
			case 'boolean': return o ? '"true"' : '"false"';
			case 'Date':
				var month = o.getMonth() + 1,
						day = o.getDate(),
						year = o.getFullYear(),
						hours = o.getHours(),
						minutes = o.getMinutes(),
						seconds = o.getSeconds(),
						milli = o.getMilliseconds(),
						tz = o.getTimezoneOffset();

				var tzMin = tz % 60;
				var tzHr = Math.floor((tz - tzMin) / 60);
				var tzNeg = tzHr < 0;

				tzMin = Math.abs(tzMin);
				tzHr = Math.abs(tzHr);

				if (month < 10)
					month = '0' + month;
				if (day < 10)
					day = '0' + day;
				if (hours < 10)
					hours = '0' + hours;
				if (minutes < 10)
					minutes = '0' + minutes;
				if (seconds < 10)
					seconds = '0' + seconds;
				if (milli < 100)
					milli = '0' + milli;
				if (milli < 10)
					milli = '0' + milli;
				if (tzMin < 10)
					tzMin = '0' + tzMin;
				if (tzHr < 10)
					tzHr = '0' + tzHr;
				if (tzHr < 0)
					tz = '-' + tzHr + ':' + tzMin;
				else
					tz = '+' + tzHr + ':' + tzMin;
				return '"' +
						year + '-' + month + '-' + day + 'T' +
						hours + ':' + minutes + ':' + seconds + '.' + milli + tz + '"';
			case 'Array':
				var result = '[';
				for (var i = 0; i < o.length; i++)
				{
					if (i > 0)
						result += ',';
					result += $.toJSON(o[i]);
				}
				return result + ']';
			default:
				// toJSON to provide custom JSON serialization.
				if (typeof o.toJSON === 'function')
					return $.toJSON(o.toJSON());
				else
				{
					var rest = false;
					var result = '{';
					for (var k in o)
					{
						if (!hasOwnProperty.call(o, k))
							continue;

						var key = k;
						var keyType = typeof key;
						var val = o[key];
						var valType = typeof val;

						if (keyType === 'number')
							key = '"' + key + '"';
						else if (keyType === 'string')
							key = escapedString(key);
						else
							continue;

						if (valType === 'function' || valType === 'undefined')
							continue;
						val = replacer(key, val);
						if (valType === 'function' || valType === 'undefined')
							continue;

						val = $.toJSON(val);

						if (rest)
							result += ',';
						rest = true;
						result += key + ':' + val;
					}
					return result + '}';
				}
				break;
		}
	};

})(jQuery);
