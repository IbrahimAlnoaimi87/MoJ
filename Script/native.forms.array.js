/*
Class: Array
A collection of The Array Object prototype methods.
*/
/*https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var array = [2, 5, 9];
var index = array.indexOf(2);
// index is 0
index = array.indexOf(7);
// index is -1
*/
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(searchElement /*, fromIndex */)
  {
	"use strict";

	if (this === void 0 || this === null)
	  throw new TypeError();

	var t = Object(this);
	var len = t.length >>> 0;
	if (len === 0)
	  return -1;

	var n = 0;
	if (arguments.length > 0)
	{
	  n = Number(arguments[1]);
	  if (n !== n) // shortcut for verifying if it's NaN
		n = 0;
	  else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
		n = (n > 0 || -1) * Math.floor(Math.abs(n));
	}

	if (n >= len)
	  return -1;

	var k = n >= 0
		  ? n
		  : Math.max(len - Math.abs(n), 0);

	for (; k < len; k++)
	{
	  if (k in t && t[k] === searchElement)
		return k;
	}
	return -1;
  };
}

/*https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
function isBigEnough(element, index, array) {
  return (element >= 10);
}
var filtered = [12, 5, 8, 130, 44].filter(isBigEnough);
// filtered is [12, 130, 44]
*/
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
	"use strict";

	if (this === void 0 || this === null)
	  throw new TypeError();

	var t = Object(this);
	var len = t.length >>> 0;
	if (typeof fun !== "function")
	  throw new TypeError();

	var res = [];
	var thisp = arguments[1];
	for (var i = 0; i < len; i++)
	{
	  if (i in t)
	  {
		var val = t[i]; // in case fun mutates this
		if (fun.call(thisp, val, i, t))
		  res.push(val);
	  }
	}

	return res;
  };
}
/*
	https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
	var total = [0, 1, 2, 3].reduce(function(a, b){ return a + b; });
	// total == 6
	var flattened = [[0,1], [2,3], [4,5]].reduce(function(a,b) {
	return a.concat(b);
	});
	// flattened is [0, 1, 2, 3, 4, 5]
*/
if (!Array.prototype.reduce)
{
	Array.prototype.reduce = function (fun /*, initialValue */)
	{
		"use strict";

		if (this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== "function")
			throw new TypeError();

		// no value to return if no initial value and an empty array
		if (len == 0 && arguments.length == 1)
			throw new TypeError();

		var k = 0;
		var accumulator;
		if (arguments.length >= 2)
		{
			accumulator = arguments[1];
		}
		else
		{
			do
			{
				if (k in t)
				{
					accumulator = t[k++];
					break;
				}

				// if array contains no values, no initial value to return
				if (++k >= len)
					throw new TypeError();
			}
			while (true);
		}

		while (k < len)
		{
			if (k in t)
				accumulator = fun.call(undefined, accumulator, t[k], k, t);
			k++;
		}

		return accumulator;
	};
}
/*
https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/ReduceRight
var total = [0, 1, 2, 3].reduceRight(function(a, b) { return a + b; });
// total == 6
var flattened = [[0, 1], [2, 3], [4, 5]].reduceRight(function(a, b) {
  return a.concat(b);
}, []);
// flattened is [4, 5, 2, 3, 0, 1]
*/
if (!Array.prototype.reduceRight)
{
	Array.prototype.reduceRight = function (callbackfn /*, initialValue */)
	{
		"use strict";

		if (this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof callbackfn !== "function")
			throw new TypeError();

		// no value to return if no initial value, empty array
		if (len === 0 && arguments.length === 1)
			throw new TypeError();

		var k = len - 1;
		var accumulator;
		if (arguments.length >= 2)
		{
			accumulator = arguments[1];
		}
		else
		{
			do
			{
				if (k in this)
				{
					accumulator = this[k--];
					break;
				}

				// if array contains no values, no initial value to return
				if (--k < 0)
					throw new TypeError();
			}
			while (true);
		}

		while (k >= 0)
		{
			if (k in t)
				accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
			k--;
		}

		return accumulator;
	};
}
/*
https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
var array = [2, 5, 9, 2];
var index = array.lastIndexOf(2);
// index is 3
index = array.lastIndexOf(7);
// index is -1
index = array.lastIndexOf(2, 3);
// index is 3
index = array.lastIndexOf(2, 2);
// index is 0
index = array.lastIndexOf(2, -2);
// index is 0
index = array.lastIndexOf(2, -1);
// index is 3


var indices = [];
var idx = array.lastIndexOf(element);
while (idx != -1)
{
  indices.push(idx);
  idx = (idx > 0 ? array.lastIndexOf(element, idx - 1) : -1);
}
*/
if (!Array.prototype.lastIndexOf)
{
	Array.prototype.lastIndexOf = function (searchElement /*, fromIndex*/)
	{
		"use strict";

		if (this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0)
			return -1;

		var n = len;
		if (arguments.length > 1)
		{
			n = Number(arguments[1]);
			if (n !== n)
				n = 0;
			else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}

		var k = n >= 0
		  ? Math.min(n, len - 1)
		  : len - Math.abs(n);

		for (; k >= 0; k--)
		{
			if (k in t && t[k] === searchElement)
				return k;
		}
		return -1;
	};
}
//custom methods
var _arrayPrototype =
{
	/*
	Property: remove
	Removes all occurrences of an item from the array.

	Arguments:
	item - the item to remove

	Returns:
	the Array with all occurrences of the item removed.

	Example:
	>["1","2","3","2"].remove("2") // ["1","3"];
	*/

	remove: function (item)
	{
		var i = 0;
		var len = this.length;
		while (i < len)
		{
			if (this[i] === item)
			{
				this.splice(i, 1);
				len--;
			} else
			{
				i++;
			}
		}
		return this;
	},


	/*
	Property: removeAt
	Removes the item at the specified position

	Arguments:
	the item position

	Returns:
	the Array with all occurrences of the item removed.

	Example:
	>["1","2","3","2"].remove(3) // ["1","2","3"];
	*/

	removeAt: function (itemPosition)
	{
		var i = 0;
		var len = this.length;
		while (i < len)
		{
			if (i === itemPosition)
			{
				this.splice(i, 1);
				len--;
				break;
			} else
			{
				i++;
			}
		}
		return this;
	},

	/*
	Property: contains
	Tests an array for the presence of an item.

	Arguments:
	item - the item to search for in the array.
	from - integer; optional; the index at which to begin the search, default is 0. If negative, it is taken as the offset from the end of the array.

	Returns:
	true - the item was found
	false - it wasn't

	Example:
	>["a","b","c"].contains("a"); // true
	>["a","b","c"].contains("d"); // false
	*/

	contains: function (item, from)
	{
		return this.indexOf(item, from) != -1;
	},

	/*
	Property: associate
	Creates an object with key-value pairs based on the array of keywords passed in
	and the current content of the array.

	Arguments:
	keys - the array of keywords.

	Example:
	(start code)
	var Animals = ['Cat', 'Dog', 'Coala', 'Lizard'];
	var Speech = ['Miao', 'Bau', 'Fruuu', 'Mute'];
	var Speeches = Animals.associate(Speech);
	//Speeches['Miao'] is now Cat.
	//Speeches['Bau'] is now Dog.
	//...
	(end)
	*/

	associate: function (keys)
	{
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	/*
	Property: extend
	Extends an array with another one.

	Arguments:
	array - the array to extend ours with

	Example:
	>var Animals = ['Cat', 'Dog', 'Coala'];
	>Animals.extend(['Lizard']);
	>//Animals is now: ['Cat', 'Dog', 'Coala', 'Lizard'];
	*/

	extend: function (array)
	{
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},

	/*
	Property: merge
	merges an array in another array, without duplicates. (case- and type-sensitive)

	Arguments:
	array - the array to merge from.

	Example:
	>['Cat','Dog'].merge(['Dog','Coala']); //returns ['Cat','Dog','Coala']
	*/

	merge: function (array)
	{
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	/*
	Property: include
	includes the passed in element in the array, only if its not already present. (case- and type-sensitive)

	Arguments:
	item - item to add to the array (if not present)

	Example:
	>['Cat','Dog'].include('Dog'); //returns ['Cat','Dog']
	>['Cat','Dog'].include('Coala'); //returns ['Cat','Dog','Coala']
	*/

	include: function (item)
	{
		if (!this.contains(item)) this.push(item);
		return this;
	},

	/*
	Property: getRandom
	returns a random item in the Array
	*/

	getRandom: function ()
	{
		return this[$random(0, this.length - 1)] || null;
	},

	/*
	Property: getLast
	returns the last item in the Array
	*/

	getLast: function ()
	{
		return this[this.length - 1] || null;
	},

	insert: function (item, position)
	{
		var newArray = new Array();
		for (var j = 0; j < this.length; j++)
		{
			if (j < position)
			{
				newArray[j] = this[j];
			} else if (j == position)
			{
				newArray[j] = item;
				newArray[j + 1] = this[j];
			} else
			{
				newArray[j + 1] = this[j];
			}
		}
		return newArray;
	},
	/*
	Property: rgbToHex
	see <String.rgbToHex>, but as an array method.
	*/

	rgbToHex: function (array)
	{
		if (this.length < 3) return false;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++)
		{
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return array ? hex : '#' + hex.join('');
	},

	/*
	Property: hexToRgb
	same as <String.hexToRgb>, but as an array method.
	*/

	hexToRgb: function (array)
	{
		if (this.length != 3) return false;
		var rgb = [];
		for (var i = 0; i < 3; i++)
		{
			rgb.push(parseInt((this[i].length == 1) ? this[i] + this[i] : this[i], 16));
		}
		return array ? rgb : 'rgb(' + rgb.join(',') + ')';
	}
};
jQuery.extend(Array.prototype, _arrayPrototype);

/*compatibility*/
Array.prototype.test = Array.prototype.contains;
/*end compatibility*/

/*
https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
function isBigEnough(element, index, array) {
  return (element >= 10);
}
var passed = [12, 5, 8, 130, 44].every(isBigEnough);
// passed is false
passed = [12, 54, 18, 130, 44].every(isBigEnough);
// passed is true
*/
if (!Array.prototype.every)
{
	Array.prototype.every = function (fun /*, thisp */)
	{
		"use strict";

		if (this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== "function")
			throw new TypeError();

		var thisp = arguments[1];
		for (var i = 0; i < len; i++)
		{
			if (i in t && !fun.call(thisp, t[i], i, t))
				return false;
		}

		return true;
	};
}

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
function isBiggerThan10(element, index, array) {
  return element > 10;
}
[2, 5, 8, 1, 4].some(isBiggerThan10);  // false
[12, 5, 8, 1, 4].some(isBiggerThan10); // true

Production steps of ECMA-262, Edition 5, 15.4.4.17
Reference: http://es5.github.io/#x15.4.4.17
*/
if (!Array.prototype.some)
{
	Array.prototype.some = function (fun/*, thisArg*/)
	{
		'use strict';

		if (this === null)
		{
			throw new TypeError('Array.prototype.some called on null or undefined');
		}

		if (typeof fun !== 'function')
		{
			throw new TypeError();
		}

		var t = Object(this);
		var len = t.length >>> 0;

		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		for (var i = 0; i < len; i++)
		{
			if (i in t && fun.call(thisArg, t[i], i, t))
			{
				return true;
			}
		}

		return false;
	};
}