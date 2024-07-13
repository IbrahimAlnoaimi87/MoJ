var _stringPrototype =
{

    /*
    Property: test
    Tests a string with a regular expression.

    Arguments:
    regex - a string or regular expression object, the regular expression you want to match the string with
    params - optional, if first parameter is a string, any parameters you want to pass to the regex ('g' has no effect)

    Returns:
    true if a match for the regular expression is found in the string, false if not.
    See <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:RegExp:test>

    Example:
    >"I like cookies".test("cookie"); // returns true
    >"I like cookies".test("COOKIE", "i") // ignore case, returns true
    >"I like cookies".test("cake"); // returns false
    */

    test: function (regex, params)
    {
        var regExObject = regex;
        if ($type(regex) === 'string')
        {
            regExObject = this._getTestRegex(regex, params)
        }
        return regExObject.test(this);
    },

    _getTestRegex: function (pattern, params)
    {
        if (!checkExists(stringRegularExpressions.testPatterns[pattern]))
        {
            stringRegularExpressions.testPatterns[pattern] = new RegExp(pattern, params)
        }
        else
        {
            stringRegularExpressions.testPatterns[pattern].lastIndex = 0;
        }
        return stringRegularExpressions.testPatterns[pattern];
    },

    /*
    Property: toInt
    parses a string to an integer.

    Returns:
    either an int or "NaN" if the string is not a number.

    Example:
    >var value = "10px".toInt(); // value is 10
    */

    toInt: function ()
    {
        return parseInt(this, 10);
    },

    /*
    Property: toFloat
    parses a string to an float.

    Returns:
    either a float or "NaN" if the string is not a number.

    Example:
    >var value = "10.848".toFloat(); // value is 10.848
    */

    toFloat: function ()
    {
        return parseFloat(this);
    },

    /*
    Property: camelCase
    Converts a hiphenated string to a camelcase string.

    Example:
    >"I-like-cookies".camelCase(); //"ILikeCookies"

    Returns:
    the camel cased string
    */

    camelCase: function ()
    {
        return this.replace(stringRegularExpressions.camelCase, function (match)
        {
            return match.charAt(1).toUpperCase();
        });
    },

    /*
    Property: hyphenate
    Converts a camelCased string to a hyphen-ated string.

    Example:
    >"ILikeCookies".hyphenate(); //"I-like-cookies"
    */

    hyphenate: function ()
    {
        return this.replace(stringRegularExpressions.hyphenate, function (match)
        {
            return (match.charAt(0) + '-' + match.charAt(1).toLowerCase());
        });
    },

    /**
    * Capitalizes the first letter of the string
    */
    capitalizeFirstLetter: function ()
    {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },

    /*
    Property: capitalize
    Converts the first letter in each word of a string to Uppercase.

    Example:
    >"i like cookies".capitalize(); //"I Like Cookies"

    Returns:
    the capitalized string
    */

    capitalize: function ()
    {
        return this.replace(stringRegularExpressions.capitalise, function (match)
        {
            return match.toUpperCase();
        });
    },

    /*
    Property: trim
    Trims the leading and trailing spaces off a string.

    Example:
    >"    i like cookies     ".trim() //"i like cookies"

    Returns:
    the trimmed string
    */

    trim: function ()
    {
        return this.replace(stringRegularExpressions.trimLeft, "").replace(stringRegularExpressions.trimRight, "");
    },

    properCase: function (header)
    {
        var newHead = "";
        var propCase = ["A", "An", "And", "As", "On", "Or", "The", "For", "That", "Have", "Been", "In", "With", "Go", "To", "Are", "Was", "From", "All", "From", "Made", "Its"];
        var change = header.capitalize();

        change = change.split(/\s+/g);

        for (var i = 0, l = change.length; i < l; i++)
        {
            if (propCase.contains(change[i]))
            {
                if (i === 0)
                {
                    newHead = newHead + change[i] + " ";
                }
                else
                {
                    newHead = newHead + change[i].toLowerCase() + " ";
                }
            }
            else
            {
                newHead = newHead + change[i] + " ";
            }
        }
        newHead.trim();
        return newHead;
    },

    properObjectName: function (message)
    {
        for (key in stringRegularExpressions.properObjectName)
        {
            message = message.replace(stringRegularExpressions.properObjectName[key], key);
        }
        return message;
    },

    /*
    Property: clean
    trims (<String.trim>) a string AND removes all the double spaces in a string.

    Returns:
    the cleaned string

    Example:
    >" i      like     cookies      \n\n".clean() //"i like cookies"
    */

    clean: function ()
    {
        return this.replace(stringRegularExpressions.clean, ' ').trim();
    },

    /*
    Property: strip
    Strips all white-space characters from a String object.

    Returns:
    The string with all white-space characters removed.

    Example:
    >" Hello   World! ".strip(); // Returns "HelloWorld!"
    */
    strip: function ()
    {
        return (this.replace(stringRegularExpressions.strip, ''));
    },

    /*
    Property: rgbToHex
    Converts an RGB value to hexidecimal. The string must be in the format of "rgb(255,255,255)" or "rgba(255,255,255,1)";

    Arguments:
    array - boolean value, defaults to false. Use true if you want the array ['FF','33','00'] as output instead of "#FF3300"

    Returns:
    hex string or array. returns "transparent" if the output is set as string and the fourth value of rgba in input string is 0.

    Example:
    >"rgb(17,34,51)".rgbToHex(); //"#112233"
    >"rgba(17,34,51,0)".rgbToHex(); //"transparent"
    >"rgb(17,34,51)".rgbToHex(true); //['11','22','33']
    */

    rgbToHex: function (array)
    {
        var rgb = this.match(stringRegularExpressions.rgbToHex);
        return (rgb) ? rgb.rgbToHex(array) : false;
    },

    /*
    Property: hexToRgb
    Converts a hexidecimal color value to RGB. Input string must be the hex color value (with or without the hash). Also accepts triplets ('333');

    Arguments:
    array - boolean value, defaults to false. Use true if you want the array [255,255,255] as output instead of "rgb(255,255,255)";

    Returns:
    rgb string or array.

    Example:
    >"#112233".hexToRgb(); //"rgb(17,34,51)"
    >"#112233".hexToRgb(true); //[17,34,51]
    */

    hexToRgb: function (array)
    {
        var hex = this.match(stringRegularExpressions.hexToRgb);
        return (hex) ? hex.slice(1).hexToRgb(array) : false;
    },

    randomColor: function ()
    {
        var randomColor = "#";
        for (var i = 0; i < 6; i++)
        {
            var hexNumber = Math.floor(Math.random() * 16);
            switch (hexNumber)
            {
                case 10:
                    hexNumber = "A";
                    break;
                case 11:
                    hexNumber = "B";
                    break;
                case 12:
                    hexNumber = "C";
                    break;
                case 13:
                    hexNumber = "D";
                    break;
                case 14:
                    hexNumber = "E";
                    break;
                case 15:
                    hexNumber = "F";
                    break;
            }
            randomColor += hexNumber;
        }
        return randomColor;
    },

    /*
    Property: contains
    checks if the passed in string is contained in the String. also accepts an optional second parameter, to check if the string is contained in a list of separated values.

    Example:
    >'a b c'.contains('c', ' '); //true
    >'a bc'.contains('bc'); //true
    >'a bc'.contains('b', ' '); //false
    */

    contains: function (string, s)
    {
        return (s) ? (s + this + s).indexOf(s + string + s) > -1 : this.indexOf(string) > -1;
    },

    /*
    Property: escapeRegExp
    Returns string with escaped regular expression characters

    Example:
    >var search = 'animals.sheeps[1]'.escapeRegExp(); // search is now 'animals\.sheeps\[1\]'

    Returns:
    Escaped string
    */

    escapeRegExp: function ()
    {
        return this.replace(stringRegularExpressions.escapeRegExp, '\\$1');
    },
    /*    Property: stripTags
    Remove all html tags from a string.    */
    stripTags: function ()
    {
        return this.replace(stringRegularExpressions.stripTags, '');
    },

    /*    Property: stripScripts
    Removes all script tags from an HTML string.
    */
    stripScripts: function ()
    {
        return this.replace(stringRegularExpressions.stripScripts, '');
    },

    stripStyles: function ()
    {
        return this.replace(stringRegularExpressions.stripStyles, '');
    },

    /*    Property: replaceAll
    Replaces all instances of a string with the specified value.
        
    Arguments:
    searchValue - the string you want to replace
    replaceValue - the string you want to insert in the searchValue's place
    regExOptions - defaults to "ig" but you can pass in your preference
        
    Example:
    >"I like cheese".replaceAll("cheese", "cookies");
    > > I like cookies
    */
    replaceAll: function (searchValue, replaceValue, regExOptions)
    {
        var regexChars = ["^", "$", ".", "|", "?", "*", "+", "(", ")", "{", "}", "\\", "]", "["];
        for (var i = 0; i < searchValue.length; i++)
        {
            for (var j = 0; j < regexChars.length; j++)
            {
                if (searchValue.charAt(i) === regexChars[j])
                {
                    searchValue = searchValue.substr(0, i) + "\\" + searchValue.substr(i);
                    i++;
                    break;
                }
            }
        }
        return this.replace(new RegExp(searchValue, checkExists(regExOptions) ? regExOptions : 'gi'), replaceValue);
    },

    /* Property: escapeQuotes
    Escape all apostrophes and quotation marks in a string
    */
    escapeQuotes: function ()
    {
        return this.replaceAll("'", "\\'").replaceAll('"', '\\"');
    },

    /* encodeSeparator 
        Encode all specified separators in the string.
    */
    encodeSeparator: function (separator)
    {
        return this.replaceAll(separator, "◕_◕");
    },

    /* decodeSeparator
        Decode all specified separators in the string.
    */
    decodeSeparator: function (separator)
    {
        return this.replaceAll("◕_◕", separator);
    },

    /*    Property: parseQuery
    Turns a query string into an associative array of key/value pairs.
        
    Example:
    (start code)
    "this=that&what=something".parseQuery()
    > { this: "that", what: "something" }

    var values = "this=that&what=something".parseQuery();
    > values.this > "that"
    (end)
    */

    parseQuery: function ()
    {
        var vars = this.split(/[&;]/);
        var rs = {};
        if (vars.length)
        {
            jQuery.each(vars, function (i, val)
            {
                var keys = val.split('=');
                if (keys.length && keys.length === 2) rs[encodeURIComponent(keys[0])] = encodeURIComponent(keys[1]);
            });
        }
        return rs;
    },

    /*    Property: tidy
    Replaces common special characters with their ASCII counterparts (smart quotes, elipse characters, stuff from MS Word, etc.).
    */
    tidy: function ()
    {
        var txt = this.toString();
        var tidy = stringRegularExpressions.tidy;
        var stuff = [
            { replaceText: tidy.spaces, withText: " " },
            { replaceText: tidy.star, withText: "*" },
            { replaceText: tidy.invertedcomma1, withText: "'" },
            { replaceText: tidy.invertedcomma2, withText: "'" },
            { replaceText: tidy.ellipsis, withText: "..." },
            { replaceText: tidy.hyphen, withText: "-" },
            { replaceText: tidy.doublehyphen, withText: "--" }
        ];
        jQuery.each(stuff,
            function (index, obj)
            {
                txt = txt.replace(obj.replaceText, obj.withText);
            }
            );
        return txt;
    },

    /*    Property: generateGuid
    Replaces string with Random generated GUID
    */
    generateGuidPart: function ()
    {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    },

    generateGuid: function ()
    {
        return (this.generateGuidPart() + this.generateGuidPart() + "-"
                + this.generateGuidPart() + "-" + this.generateGuidPart() + "-"
                + this.generateGuidPart() + "-" + this.generateGuidPart()
                + this.generateGuidPart() + this.generateGuidPart());
    },

    /*    Property: equals
    Compares two string values, and optionaly ignores the case
    */
    equals: function(value, ignoreCase)
    {
        var val;

        if (checkExists(value) && typeof value === "string")
        {
            val = value;
        }
        else
        {
            return false;
        }

        if (ignoreCase)
        {
            return this.toUpperCase() === val.toUpperCase();
        }
        else
        {
            return this.toString() === val;
        }
    },

    /*    Property: isNumeric
    Tests a string to check if all characters are numerical
            
    Returns:
    (boolean) The result of the test
    */
    isNumeric: function ()
    {
        return (this.match(stringRegularExpressions.isNumeric) !== null) ? true : false;
    },

    /*    Property: isFloat
    Tests a string to check if characters represents a float/decimal numerical value
            
    Returns:
    (boolean) The result of the test
    */
    isFloat: function ()
    {
        return (this.match(stringRegularExpressions.isFloat) !== null) ? true : false;
    },

    trimZeros: function ()
    {
        var result = this + "";
        var symbol = ""
        if (result.length > 0 && (result.charAt(0) === "-" || result.charAt(0) === "+"))
        {
            symbol = result.charAt(0);
            result = result.substr(1);
        }
        //trim beggining
        while (result.length !== 0 && result.charAt(0) === "0" && result.length !== 1 && result.charAt(1) !== ".")
        {
            result = result.substr(1);
        }
        //trim end
        if (result.indexOf(".") >= 0)
        {
            while (result.length !== 0 && result.charAt(result.length - 1) === "0" && result.length !== 1)
            {
                result = result.substr(0, result.length - 1);
            }
        }
        //remove end full stop
        if (result.indexOf(".") === result.length - 1)
            result = result.substr(0, result.length - 1);

        return symbol + result;
    },

    format: function ()
    {
        var startIndex = 0;
        var tempstring = this;
        var isStaticCall = (this === String)
        if (isStaticCall)
        {
            startIndex = 1;
            tempstring = arguments[0];
        }

        if (arguments[startIndex] instanceof Array)
        {
            var array = arguments[startIndex];
            for (var i = 0; i < array.length; i++)
            {
                var regEx = this._getFormatRegex(i);
                var replaceVal = typeof array[i] === "string" ? array[i].split("$").join("$$") : array[i];

                tempstring = tempstring.replace(regEx, replaceVal);
            }
        }
        else
        {
            for (var i = startIndex; i < arguments.length; i++)
            {
                var formatRegexIndex = i;
                if (isStaticCall)
                {
                    formatRegexIndex--;
                }
                var regEx = this._getFormatRegex(formatRegexIndex);
                var replaceVal = typeof arguments[i] === "string" ? arguments[i].split("$").join("$$") : arguments[i];

                tempstring = tempstring.replace(regEx, replaceVal);
            }
        }
        return tempstring;
    },

    _getFormatRegex: function (index)
    {
        if (!checkExists(stringRegularExpressions.format[index]))
        {
            stringRegularExpressions.format[index] = new RegExp("\\{" + index + "\\}", "g")
        }
        else
        {
            stringRegularExpressions.format[index].lastIndex = 0;
        }
        return stringRegularExpressions.format[index];
    },

    containsGuid: function (text)
    {
        return (this.match(stringRegularExpressions.containsGuid) !== null) ? true : false;
    },

    isValidGuid: function (guid)
    {
        return (this.match(stringRegularExpressions.isValidGuid) !== null) ? true : false;
    },

    toArray: function ()
    {

        var result = [];

        for (var i = 0; i < this.length; i++) result.push(this.substr(i, 1));

        return result;

    },

    repeat: function (times)
    {
        var ret = [];
        for (var i = 0; i < times; i++) ret.push(this);
        return ret.join('');
    },

    zeroise: function (length)
    {
        return '0'.repeat(length - this.length) + this;
    },

    removeNBSpace: function ()
    {
        return this.replace(stringRegularExpressions.spacesReplacementRegex, " ")
    },

    insertNBSpace: function ()
    {
        return this.replace(stringRegularExpressions.spacesReplacementRegex, String.fromCharCode(160))
    },

    // Replaces all non-word special characters with an underscore
    smartObjectEncoding: function ()
    {
        return this.replace(stringRegularExpressions.smartObjectCharacterReplacement, "_");
    },

    replaceSpacesBetweenTags: function ()
    {
        return this.replace(stringRegularExpressions.spacesBetweenTags, "><");
    },

    stripHtml: function ()
    {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = this.stripScripts().stripStyles();
        var returnText = tmp.textContent || tmp.innerText || "";

        return returnText.replaceAll("\"", "");
    },

    htmlEncode: function ()
    {
        stringRegularExpressions.htmlSpecial.lastIndex = 0;
        if (!stringRegularExpressions.htmlSpecial.test(this))
        {
            return this.toString();
        }
        else
        {
            return this
                .replace(stringRegularExpressions.isAmpersand, '&amp;')
                .replace(stringRegularExpressions.isQuote, '&quot;')
                .replace(stringRegularExpressions.isApostrophe, '&#39;')
                .replace(stringRegularExpressions.isLessThan, '&lt;')
                .replace(stringRegularExpressions.isGreaterThan, '&gt;').toString();
        }
    },

    htmlEncodeWithExclusionList: function (exclusionList)
    {
        var i = 0;
        var encodedString = this.htmlEncode();

        var defaultExclusions =
        [
            "<br/>",
            "<br>",
            "<wbr/>",
            "<wbr>",
            "<i>",
            "</i>",
            "<b>",
            "</b>",
            "<em>",
            "</em>"
        ];

        if (checkExists(exclusionList) && Object.prototype.toString.call(exclusionList) === '[object Array]')
        {
            for (i = 0; i < exclusionList.length; i++)
            {
                defaultExclusions.push(exclusionList[i]);
            }
        }

        for (i = 0; i < defaultExclusions.length; i++)
        {
            encodedString = encodedString.replaceAll(defaultExclusions[i].htmlEncode(), defaultExclusions[i]);
        }

        return encodedString;
    },

    xmlEncode: function ()
    {
        stringRegularExpressions.xmlSpecial.lastIndex = 0;
        if (!stringRegularExpressions.xmlSpecial.test(this))
        {
            return this.toString();
        }
        else
        {
            return this
                .replace(stringRegularExpressions.isAmpersand, '&amp;')
                .replace(stringRegularExpressions.isQuote, '&quot;')
                .replace(stringRegularExpressions.isApostrophe, '&apos;')
                .replace(stringRegularExpressions.isLessThan, '&lt;')
                .replace(stringRegularExpressions.isGreaterThan, '&gt;').toString();
        }
    },

    htmlDecode: function ()
    {
        stringRegularExpressions.hasEncodedEntities.lastIndex = 0;
        if (!stringRegularExpressions.hasEncodedEntities.test(this))
        {
            return this.toString();
        }
        else
        {
            // TODO: Decode &#DD; entities
            return this
                .replace(stringRegularExpressions.isEncodedQuote, '"')
                .replace(stringRegularExpressions.isEncodedApostrophe, '\'')
                .replace(stringRegularExpressions.isEncodedLessThan, '<')
                .replace(stringRegularExpressions.isEncodedGreaterThan, '>')
                .replace(stringRegularExpressions.isEncodedAmpersand, '&').toString();
        }
    },

    xmlDecode: function ()
    {
        stringRegularExpressions.hasEncodedEntities.lastIndex = 0;
        if (!stringRegularExpressions.hasEncodedEntities.test(this))
        {
            return this.toString();
        }
        else
        {
            // TODO: Decode &#DD; entities
            return this
                .replace(stringRegularExpressions.isEncodedQuote, '"')
                .replace(stringRegularExpressions.isEncodedApostrophe, '\'')
                .replace(stringRegularExpressions.isEncodedLessThan, '<')
                .replace(stringRegularExpressions.isEncodedGreaterThan, '>')
                .replace(stringRegularExpressions.isEncodedAmpersand, '&').toString();
        }
    },

    xpathValueEncode: function ()
    {
        // Example: </"'&\>
        // Become: concat('</"', string("'"), '&\\>')

        stringRegularExpressions.xpathSpecial.lastIndex = 0;
        if (!stringRegularExpressions.xpathSpecial.test(this))
        {
            return '\'' + this + '\'';
        }
        else
        {
            return 'concat(\'' + this
                .replace(stringRegularExpressions.isApostrophe, '\', string("\'"), \'')
                + '\')';
        }
    },

    xpathEncodeBackslash: function ()
    {
        //no need to test for ocurrance as it is just as expensive as just performing the operation.
        return this.replace(stringRegularExpressions.isBackslash, '\\\\');
    },

    selectorEncode: function ()
    {
        stringRegularExpressions.selectorSpecial.lastIndex = 0;
        if (!stringRegularExpressions.selectorSpecial.test(this))
        {
            return this.toString();
        }
        else
        {
            return this
                .replace(stringRegularExpressions.selectorSpecial, '\\$1');
        }
    },

    selectorDecode: function ()
    {
        stringRegularExpressions.isDoubleBackslash.lastIndex = 0;
        if (!stringRegularExpressions.isDoubleBackslash.test(this))
        {
            return this.toString();
        }
        else
        {
            return this
                .replace(stringRegularExpressions.isDoubleBackslash, '');
        }
    }
};

var stringRegularExpressions =
{
    spacesReplacementRegex: /[\u0020\u00a0\uFEFF]/g,
    isValidGuid: /^[a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12}$/g,
    isValidURL: /^((mailto:|(news|(ht|f)tp(s?)):\/\/){1}.+)?$/i,
    isValidWebURLScheme: /^http(s?):\/\/.+$/i,
    containsGuid: /([a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12})+/,
    findGuids: /([a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12}_[a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12}|([a-fA-F0-9]{8}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{4}\-[a-fA-F0-9]{12}))+/gm,
    format: [], //this array is populated with a cache as the app runs
    testPatterns: {}, //this object is populated with a cache as the app runs
    isNumeric: /^[-+]?[0-9]+$/g,
    isFloat: /^[-+]?[0-9]+(\.{1}[0-9]*)?$/g,
    camelCase: /-\D/g,
    hyphenate: /\w[A-Z]/g,
    capitalise: /\b[a-z]/g,
    clean: /\s{2,}/g,
    strip: /\s/g,
    rgbToHex: /\d{1,3}/g,
    hexToRgb: /^#?(\w{1,2})(\w{1,2})(\w{1,2})$/,
    escapeRegExp: /([.*+?^${}()|[\]\/\\])/g,
    trimLeft: /^\s+/,
    trimRight: /\s+$/,
    stripTags: /<\/?[^>]+>/gi,
    stripScripts: /<script[^>]*?>.*?<\/script>/img,
    stripScriptsFirst: /^<script[^>]*?>/,
    stripScriptsSecond: /<\/script>$/,
    stripStyles: /<style[^>]*?>.*?<\/style>/img,
    smartObjectCharacterReplacement: /\W/g,
    isAmpersand: /&/g,
    isQuote: /"/g,
    isApostrophe: /'/g,
    isLessThan: /</g,
    isGreaterThan: />/g,
    isEncodedAmpersand: /&amp;/g,
    isEncodedQuote: /&quot;/g,
    isEncodedApostrophe: /&(apos|#39);/g,
    isEncodedLessThan: /&lt;/g,
    isEncodedGreaterThan: /&gt;/g,
    isBackslash: /\\/g,
    isDoubleBackslash: /\\\\/g,
    htmlSpecial: /[&"'<>]/g,
    xmlSpecial: /[&"'<>]/g,
    xpathSpecial: /'/g,
    selectorSpecial: /([!"#$%&'()*+,\./:;<=>?@\[\\\]^`{|}~ ])/g,
    hasApostrophe: /'/g,
    hasEncodedEntities: /&(amp|quot|lt|gt|#[0-9]+|apos);/g,
    spacesBetweenTags: />[ \t\r\n\v\f]*</g,
    tidy:
    {
        spaces: /[\xa0\u2002\u2003\u2009]/g,
        star: /\xb7/g,
        invertedcomma1: /[\u2018\u2019]/g,
        invertedcomma2: /[\u201c\u201d]/g,
        ellipsis: /\u2026/g,
        hyphen: /\u2013/g,
        doublehyphen: /\u2013/g
    },
    unitDimention: /%|px/gi,
    properObjectName:
    {
        View: /\bview\b/gi,
        Form: /\bform\b/gi,
        SmartObject: /\bsmartobject\b/gi,
        Workflow: /\bworkflow\b/gi,
        Views: /\bviews\b/gi,
        Forms: /\bforms\b/gi,
        SmartObjects: /\bsmartobjects\b/gi,
        Workflows: /\bworkflows\b/gi
    },
    init: function ()
    {
        isAmpersand.compile();
        isQuote.compile();
        isApostrophe.compile();
        isLessThan.compile();
        isGreaterThan.compile();
        isEncodedAmpersand.compile();
        isEncodedQuote.compile();
        isEncodedApostrophe.compile();
        isEncodedLessThan.compile();
        isEncodedGreaterThan.compile();
        htmlSpecial.compile();
        xmlSpecial.compile();
        hasEncodedEntities.compile();
        spacesBetweenTags.compile();
    }
}

jQuery.extend(String.prototype, _stringPrototype);
jQuery.extend(String, _stringPrototype);
