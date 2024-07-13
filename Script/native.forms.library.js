/*
Function: $defined
Returns true if the passed in value/object is defined, that means is not null or undefined.

Arguments:
obj - object to inspect
*/
function $defined(obj)
{
    return (obj !== undefined);
}

function checkExists(obj)
{
    return (obj !== undefined && obj !== null);
}

function checkExistsNotEmpty(obj)
{
    return obj !== undefined && obj !== null && obj !== "";
}

function checkExistsNotEmptyGuid(obj)
{
    return obj !== undefined && obj !== null && obj !== "" && obj !== "00000000-0000-0000-0000-000000000000";
}

function checkExistsNotGuid(obj)
{
    return obj !== undefined && obj !== null && obj !== "" && !obj.toString().containsGuid();
}

var _evalFunctionCache = {};
var _evalStringCache = {};

function _evalCommon(checkString)
{
    var returnValue = null;

    if (typeof checkString === "string")
    {
        var partsArray = checkString.split(".");

        returnValue = window;

        var index = 0;

        for (var i = 0; i < partsArray.length; i++)
        {
            index = i;
            returnValue = returnValue[partsArray[i]];

            if ((typeof returnValue === "undefined") || (returnValue === null))
            {
                break;
            }
        }

        if (index < (partsArray.length - 1))
        {
            returnValue = null;
        }
    }


    return returnValue;
}

//Public function wrapper for _evalCommon function; possibility to implement future caching of _evalCommon objects
function evalCommon(checkString)
{
    var returnObj = _evalCommon(checkString);

    //Back up safety to ensure that null is returned instead of undefined; makes validation when calling this function easier
    if (typeof returnObj === "undefined")
    {
        returnObj = null;
    }

    return returnObj;
}

function evalString(checkString)
{
    var returnString = null;

    if ((typeof _evalFunctionCache[checkString] !== "undefined") && (_evalFunctionCache[checkString] !== null))
    {
        returnFunction = _evalFunctionCache[checkString];
    }
    else
    {
        returnString = _evalCommon(checkString);

        if (typeof returnString !== "string")
        {
            returnString = null;
        }
        else
        {
            _evalStringCache[checkString] = returnString;
        }
    }

    return returnString

}

function evalFunction(checkString)
{
    var returnFunction = null;

    if ((typeof _evalFunctionCache[checkString] !== "undefined") && (_evalFunctionCache[checkString] !== null))
    {
        returnFunction = _evalFunctionCache[checkString];
    }
    else
    {
        returnFunction = _evalCommon(checkString);
        if (typeof returnFunction !== "function")
        {
            returnFunction = null;
        }
        else
        {
            _evalFunctionCache[checkString] = returnFunction;
        }
    }

    return returnFunction

}

function getQueryStringFromUrl(url)
{
    if (!checkExistsNotEmpty(url))
    {
        return null;
    }

    var urlParts = url.split("?");

    if (urlParts.length < 2)
    {
        return null;
    }

    return "?" + urlParts[1];
}

//This function will return the value of a specified parameter from the current window's query string, as contained in window.location.search
function getQueryStringParameterValue(paramName, queryString)
{
    if (!checkExistsNotEmpty(paramName))
    {
        return null;
    }

    var queryStringObject = getQueryStringAsObject(queryString);

    var paramValue = queryStringObject[paramName.toUpperCase()];

    return paramValue;
}

//This function will return the current window's query string, as contained in window.location.search, as in object in the following format:
//{
//	PARAMETERNAME1: "parameter1value",
//	PARAMETERNAME2: "parameter2value"
//}
//NOTE: That all the parameter names are returned in uppercase for easy comparison
function getQueryStringAsObject(queryString)
{
    var returnObject = {};

    if (!checkExistsNotEmpty(queryString))
    {
        queryString = getQueryString();
    }

    if (checkExistsNotEmpty(queryString) && (queryString.substring(0, 1) === "?"))
    {
        //Remove initial "?" character from query string
        queryString = queryString.substring(1, queryString.length);

        var queryStringParams = queryString.split("&");

        for (var i = 0; i < queryStringParams.length; i++)
        {
            var queryStringParam = queryStringParams[i];

            var paramNameValuePair = queryStringParam.split("=");

            if (paramNameValuePair.length === 2)
            {
                var paramName = paramNameValuePair[0];
                var paramValue = paramNameValuePair[1];

                returnObject[paramName.toUpperCase()] = paramValue;
            }
        }
    }

    return returnObject;
}

//This function will return the current window's query string, as contained in window.location.search
function getQueryString()
{
    var returnQueryString = null;

    var windowLocation = window.location;

    if (checkExists(windowLocation))
    {
        returnQueryString = windowLocation.search;
    }

    return returnQueryString;
}

function paramWithEncodeURIComponent(o)
{
    var returnString = "";

    if (checkExists(o))
    {
        var objectKeys = Object.keys(o);

        if (objectKeys.length !== 0)
        {
            var tempString = "";

            for (var i = 0; i < objectKeys.length; i++)
            {
                var key = objectKeys[i];
                var value = o[key];

                if (!checkExists(value))
                {
                    value = "";
                }

                tempString += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
            }

            returnString = tempString.substring(0, tempString.length - 1);
        }
    }

    return returnString;
}

// data - array of arrays that will be sorted
// objectIndex - index of the object in the inner array to sort on
// property - the property of the array
// descending - sort descending, true or false
// getPropertyValue - (optional) allow you to specify a function to get the property value to compare
function sortArraysByObjectProperty(options)
{
    var data = options.data;
    var objectIndex = options.objectIndex || 0;
    var property = options.property || 0;
    var sortOrder = options.descending === true ? 1 : -1;
    var getPropertyValue = options.getPropertyValue;

    return data.sort(function (a, b)
    {
        var val1, val2;

        if (typeof getPropertyValue === "function")
        {
            val1 = getPropertyValue(a);
            val2 = getPropertyValue(b);
            if (val1 === val2)
            {
                val1 = getPropertyValue(a, true);
                val2 = getPropertyValue(b, true);
            }
        }
        else
        {
            val1 = a[objectIndex][property];
            val2 = b[objectIndex][property];
        }

        if (typeof val1 === "string" && typeof val2 === "string")
        {
            val1 = val1.toUpperCase();
            val2 = val2.toUpperCase();
        }

        var result = (val1 < val2) ? -1 : (val1 > val2) ? 1 : 0;
        return result * sortOrder;
    });
}

function sortObjectsByProperty(data, property, descending)
{
    return data.sort(dynamicSort(property, descending));
}

function dynamicSort(property, descending)
{
    var sortOrder = descending === true ? 1 : -1;

    return function (a, b)
    {
        var val1 = a[property];
        var val2 = b[property];

        if (typeof val1 === "string" && typeof val2 === "string")
        {
            val1 = val1.toUpperCase();
            val2 = val2.toUpperCase();
        }

        var result = (val1 < val2) ? -1 : (val1 > val2) ? 1 : 0;
        return result * sortOrder;
    }
}

// Iterates through an object, calling a callback with the key, value and object as parameters
// callback - the callback function for each of the key/value pairs. It can accept up to 3 parameters, key, value and object
// obj - the object whose properties to iterate through
// includeInherrited -	include the the inherrited/prototype properties, or only it's own properties?
// returnOnFirstValue - returns when something is found. Defaults to false
// includeChildren - iterate through arrays and object properties
// depth - how many levels deep to iterate. Not used if includeChildren isn't specified
// currentDepth - used by recursion. Do not specify.
// circularReferenceProtection - makes sure the same object is never traversed twice
// whitelist - only search the child objects in the whitelist if it is specified
// blacklist - don't search the child objects in the blacklist if it is specified
function eachPropertyInObjects(options, currentDepth)
{
    var callback = options.callback;
    var obj = options.obj;
    var includeInherrited = checkExists(options.includeInherrited) ? options.includeInherrited : false;
    var returnOnFirstValue = checkExists(options.returnOnFirstValue) ? options.returnOnFirstValue : false;
    var includeChildren = checkExists(options.includeChildren) ? options.includeChildren : false;
    var maxDepth = checkExists(options.maxDepth) ? options.maxDepth : 999999; // 999999 is pretty close to infinite for our purposes
    var whitelist = checkExists(options.whitelist) ? options.whitelist : null;
    var blacklist = checkExists(options.blacklist) ? options.blacklist : null;
    currentDepth = currentDepth || 0;

    if (currentDepth > maxDepth) return;

    for (var prop in obj)
    {
        if (obj[prop] instanceof jQuery														// don't search through jQuery objects
            || (typeof XMLDocument !== "undefined" && obj[prop] instanceof XMLDocument)		// or XML documents
            || obj[prop] instanceof HTMLElement												// or HTML elements
            || (checkExists(obj[prop]) && typeof obj[prop].nodeType !== "undefined"))		// or XML nodes
        {
            continue;
        }

        if (includeInherrited || obj.hasOwnProperty(prop))
        {
            var returnValue = null;

            // arrays are also objets, so arrays will also go in here
            if (includeChildren && typeof obj[prop] === "object"
                && (whitelist === null || whitelist.indexOf(prop) > 0)
                && (blacklist === null || blacklist.indexOf(prop) === -1))
            {
                // not supported in IE8. If we support IE8, use: if(Object.prototype.toString.call( obj[prop] ) === '[object Array]')
                if (Array.isArray(obj[prop]))
                {
                    for (var i = 0; i < obj[prop].length; i++)
                    {
                        currentDepth++;
                        var optionsWithChildObj = $.extend(options, { obj: obj[prop][i] });

                        returnValue = eachPropertyInObjects(optionsWithChildObj, currentDepth);
                        currentDepth--;

                        if (returnOnFirstValue && checkExists(returnValue))
                        {
                            return returnValue;
                        }
                    }
                }
                else
                {
                    currentDepth++
                    var optionsWithChildObj = $.extend(options, { obj: obj[prop] });
                    returnValue = eachPropertyInObjects(optionsWithChildObj, currentDepth);
                    currentDepth--;
                }
            }
            else
            {
                returnValue = callback(prop, obj[prop], obj);
            }

            if (returnOnFirstValue && checkExists(returnValue))
            {
                return returnValue;
            }
        }
    }
}

// Iterates through an object, calling a callback with the object as parameter
// callback - the callback function for each of the objects in the array. Should take the object as the property
// obj - the object whose properties to iterate through
// includeInherrited -	include the the inherrited/prototype properties, or only it's own properties?
// returnOnFirstValue - returns when something is found. Defaults to false
// includeChildren - iterate through arrays and object properties
// depth - how many levels deep to iterate. Not used if includeChildren isn't specified
// currentDepth - used by recursion. Do not specify.
// whitelist - only search the child objects in the whitelist if it is specified
// blacklist - don't search the child objects in the blacklist if it is specified
function eachObjectInArray(options, currentDepth)
{
    var callback = options.callback;
    var obj = options.obj;
    var returnOnFirstValue = checkExists(options.returnOnFirstValue) ? options.returnOnFirstValue : false;
    var includeInherrited = checkExists(options.includeInherrited) ? options.includeInherrited : false;
    var maxDepth = checkExists(options.maxDepth) ? options.maxDepth : 999999; // 999999 is pretty close to infinite for our purposes
    var whitelist = checkExists(options.whitelist) ? options.whitelist : null;
    var blacklist = checkExists(options.blacklist) ? options.blacklist : null;

    currentDepth = currentDepth || 0;

    if (currentDepth > maxDepth) return;

    for (var prop in obj)
    {
        if (includeInherrited || obj.hasOwnProperty(prop))
        {
            var returnValue = null;

            // arrays are also objets, so arrays will also go in here
            if (typeof obj[prop] === "object"
                && (whitelist === null || whitelist.indexOf(prop) > 0)
                && (blacklist === null || blacklist.indexOf(prop) === -1))
            {
                // not supported in IE8. If we support IE8, use: if(Object.prototype.toString.call( obj[prop] ) === '[object Array]')
                if (Array.isArray(obj[prop]))
                {
                    for (var i = 0; i < obj[prop].length; i++)
                    {
                        returnValue = callback(obj[prop][i]);

                        if (returnOnFirstValue && checkExists(returnValue))
                        {
                            return returnValue;
                        }

                        currentDepth++;

                        var optionsWithChildObj = $.extend(options, { obj: obj[prop][i] });
                        returnValue = eachObjectInArray(optionsWithChildObj, currentDepth);

                        currentDepth--;

                        if (returnOnFirstValue && checkExists(returnValue))
                        {
                            return returnValue;
                        }
                    }
                }
                else
                {
                    returnValue = callback(obj[prop]);

                    if (returnValue === false) // the flag to skip this property and just continue with the loop
                    {
                        continue;
                    }

                    if (returnOnFirstValue && checkExists(returnValue))
                    {
                        return returnValue;
                    }

                    currentDepth++

                    var optionsWithChildObj = $.extend(options, { obj: obj[prop] });
                    returnValue = eachObjectInArray(optionsWithChildObj, currentDepth);

                    currentDepth--;

                    if (returnOnFirstValue && checkExists(returnValue))
                    {
                        return returnValue;
                    }
                }
            }
        }
    }
}

// finds and returns an object in an array of objects
// queryObject - the object with the search criteria
// targetObject - the object the function will search through
// matchMultiple - if true, it will not stop when it finds the first result, and will instead return a flat array with all objects
// targetPropertiesContainMultipleValues - parses the value of the target object as a comma separated list. It will match any or all values specified
// searchDepth - how deep to search. Usefull for speeding up searches if you only want to search up to a certain level, and know there may be multiple levels of objects,
// circularReferenceProtection - makes sure the same object is never traversed twice
// whitelist - only search the child objects in the whitelist if it is specified
// blacklist - don't search the child objects in the blacklist if it is specified
function findObjectInArrayMatchingAny(options)
{
    var queryObject = options.queryObject;
    var targetObject = options.targetObject;
    var matchMultiple = checkExists(options.matchMultiple) ? options.matchMultiple : false;
    var targetPropertiesContainMultipleValues = checkExists(options.targetPropertiesContainMultipleValues) ? options.targetPropertiesContainMultipleValues : false;
    var circularReferenceProtection = checkExists(options.circularReferenceProtection) ? options.circularReferenceProtection : false;
    var whitelist = checkExists(options.whitelist) ? options.whitelist : null;
    var blacklist = checkExists(options.blacklist) ? options.blacklist : null;

    var resultArray = [];

    var alreadySearchedObjects = [];

    var result = eachPropertyInObjects({
        obj: targetObject,
        includeInherrited: false,
        returnOnFirstValue: !matchMultiple,
        maxDepth: options.searchDepth,
        includeChildren: true,
        whitelist: whitelist,
        blacklist: blacklist,

        callback: function (targetKey, targetVal, targetObj)
        {
            if (circularReferenceProtection === true)
            {
                if (alreadySearchedObjects.indexOf(targetObj) > -1)		// only search through objects once.
                {
                    return false;
                }
                else
                {
                    alreadySearchedObjects.push(targetObj);
                }
            }

            var res = eachPropertyInObjects({ // only one level supported for the query obj, so don't specify maxDepth
                obj: queryObject,
                includeInherrited: false,
                returnOnFirstValue: !matchMultiple,
                includeChildren: true,
                whitelist: whitelist,
                blacklist: blacklist,

                callback: function (queryKey, queryVal, queryObj)
                {
                    if (queryKey === targetKey)
                    {
                        if (targetPropertiesContainMultipleValues && targetVal !== null)
                        {
                            var targetValues = targetVal.split(",");

                            for (var i = 0; i < targetValues.length; i++)
                            {
                                if (targetValues[i] === queryVal)
                                {
                                    if (matchMultiple)
                                    {
                                        resultArray.push(targetObj);
                                        return; // already added this entry, no need to go through the rest of the properties
                                    }
                                    else
                                    {
                                        return targetObj;
                                    }
                                }
                            }
                        }
                        else
                        {
                            if (queryVal === targetObj[queryKey])
                            {
                                if (matchMultiple)
                                {
                                    resultArray.push(targetObj);
                                    return; // already added this entry, no need to go through the rest of the properties
                                }
                                else
                                {
                                    return targetObj;
                                }
                            }
                        }
                    }
                }
            });

            if (!matchMultiple)
            {
                return res;
            }
        }
    });

    var returnValue;

    if (matchMultiple)
    {
        returnValue = resultArray;
    }
    else
    {
        returnValue = result;
    }

    return returnValue;
}

// finds and returns an object in an array of objects
// queryObject - the object with the search criteria
// targetObject - the object the function will search through
// matchMultiple - if true, it will not stop when it finds the first result, and will instead return a flat array with all objects
// targetPropertiesContainMultipleValues - parses the value of the target object as a comma separated list. It will match any or all values specified
// sourcePropertiesContainMultipleValues - parses the value of the query object as a comma separated list. It will match any value specified.
// searchDepth - how deep to search. Usefull for speeding up searches if you only want to search up to a certain level, and know there may be multiple levels of objects
// circularReferenceProtection - makes sure the same object is never traversed twice
// whitelist - only search the child objects in the whitelist if it is specified
// blacklist - don't search the child objects in the blacklist if it is specified
function findObjectInArrayMatchingAll(options)
{
    var queryObject = options.queryObject;
    var targetObject = options.targetObject;
    var matchMultiple = checkExists(options.matchMultiple) ? options.matchMultiple : false;
    var targetPropertiesContainMultipleValues = checkExists(options.targetPropertiesContainMultipleValues) ? options.targetPropertiesContainMultipleValues : false;
    var sourcePropertiesContainMultipleValues = checkExists(options.sourcePropertiesContainMultipleValues) ? options.sourcePropertiesContainMultipleValues : false;
    var circularReferenceProtection = checkExists(options.circularReferenceProtection) ? options.circularReferenceProtection : false;
    var whitelist = checkExists(options.whitelist) ? options.whitelist : null;
    var blacklist = checkExists(options.blacklist) ? options.blacklist : null;

    var resultArray = [];

    var alreadySearchedObjects = [];

    // DEBUGGING TIP:
    // assume eachObjectInArray and eachPropertyInObjects works and that you never have to see that code.
    // Put your breakpoints on the first lines of the callbacks and next line after the eachObjectInArray and eachPropertyInObjects closing brackets
    // Press play or F8 to run through whenever you are done with an iteration to start the next one (whenever a return or last bracket is hit),
    // or just whenever you jumped out of this function.

    eachObjectInArray({												// Loop through each object in the array (or parent object) of possible matches.
        obj: targetObject,
        includeInherrited: false,
        returnOnFirstValue: !matchMultiple,
        maxDepth: options.searchDepth,
        includeChildren: true,
        whitelist: whitelist,
        blacklist: blacklist,

        callback: function isTheObjectAMatch(targetObj)
        {
            if (circularReferenceProtection === true)
            {
                if (alreadySearchedObjects.indexOf(targetObj) > -1)						// only search through objects once.
                {
                    return false;
                }
                else
                {
                    alreadySearchedObjects.push(targetObj);
                }
            }

            if (targetObj instanceof jQuery														// don't search through jQuery objects
                || (typeof XMLDocument !== "undefined" && targetObj instanceof XMLDocument)		// or XML documents
                || targetObj instanceof HTMLElement												// or HTML elements
                || (checkExists(targetObj) && typeof targetObj.nodeType !== "undefined"))		// or XML nodes
            {
                return false;
            }

            var isMatch = true;										// Assume a match until proven otherwise by one mismatch

            eachPropertyInObjects({									// Compare each property in the query object.
                obj: queryObject,
                includeInherrited: false,
                returnOnFirstValue: true,							// Always return on the first value, as we use this to stop the loop when a mismatch is found.
                maxDepth: options.searchDepth,
                includeChildren: true,

                callback: function isThePropertyAMatch(queryKey, queryVal, queryObject)
                {
                    // If the source or value of a query object property contains multiple allowed values, and check if its a string or else the indexOf will break
                    if (sourcePropertiesContainMultipleValues === true && typeof queryVal === "string" && queryVal.indexOf(",") !== -1)
                    {
                        var foundMatch = false;
                        var queryValueArray = queryVal.split(",");
                        var queryValueArrayLength = queryValueArray.length;

                        for (var i = 0; i < queryValueArrayLength && !foundMatch; i++)						// compare each the of the query values,
                        {																					// to the target object's property value or values
                            var currentQueryValue = queryValueArray[i];
                            var propertiesMatch = hasMatchingPropertyValue({
                                queryVal: currentQueryValue,
                                targetObj: targetObj,
                                propertyName: queryKey,
                                targetContainsMultipleOptions: targetPropertiesContainMultipleValues
                            });

                            if (propertiesMatch)			// If a match was found	set foundMatch to true to exit the loop.
                            {
                                foundMatch = true;
                            }
                        }

                        isMatch = foundMatch;				// If a match was found, then this object is still a possible valid match.

                        if (!isMatch)						// Else, if the property does not match
                        {									// stop iterating through the properties, since we already know it's not a match.
                            return false;
                        }
                    }
                    else
                    {
                        if (checkExistsNotEmpty(options.splitQueryObjectDelimiter) && typeof queryVal === "string")
                        {
                            queryVal = queryVal.decodeSeparator(options.splitQueryObjectDelimiter);
                        }

                        var propertiesMatch = hasMatchingPropertyValue({	// If only a single value just compare
                            queryVal: queryVal,								// the query object's, and the target object's property value
                            targetObj: targetObj,							// or multiple values.
                            propertyName: queryKey,
                            targetContainsMultipleOptions: targetPropertiesContainMultipleValues
                        });

                        if (!propertiesMatch)
                        {
                            isMatch = false;	// One property mismatch disqualifies the object
                            return false;		// stop iterating through the properties, since we already know it's not a match.
                        }
                    }
                }
            });

            if (isMatch === true)				// If a mismatch hasn't been found by now
            {
                resultArray.push(targetObj);	// add the now confirmed match object to the result set

                if (matchMultiple === false)	// return false to stop iterating through the array if we don't match multiple
                {
                    return true;
                }
            }
        }
    });

    if (matchMultiple === false)
    {
        return resultArray[0];
    }
    else
    {
        return resultArray;
    }
}

// Compares the property of an object (if it exists) to a value and return true if they match.
// This is a pretty useless function unless you specify targetContainsMultipleOptions as true.
// This comparison is case insensitive
// parameters:
// queryVal - the value to compare the property to.
// targetObj - the object to check
// propertyName - name of the property
// targetContainsMultipleOptions - Whether the target property has comma separated values, any of which will constitute a valid match
function hasMatchingPropertyValue(options)
{
    var queryVal = options.queryVal;
    var targetObj = options.targetObj;
    var key = options.propertyName;
    var targetContainsMultipleOptions = checkExists(options.targetContainsMultipleOptions) ? options.targetContainsMultipleOptions : false;

    if (checkExists(targetObj))
    {
        var targetVal = targetObj[key];

        if (typeof targetVal === "string" && typeof queryVal === "string")
        {
            targetVal = targetVal.toUpperCase();
            queryVal = queryVal.toUpperCase();
        }

        if (checkExists(queryVal) && checkExists(targetVal))
        {
            // If the source or value of a query object property contains multiple allowed values, and check if its a string or else the indexOf will break
            if (targetContainsMultipleOptions === true && typeof targetVal === "string" && targetVal.indexOf(",") !== -1)
            {
                var foundMatch = false;
                var targetValues = targetVal.split(",");
                var targetValueArrayLength = targetValues.length;

                for (var i = 0; i < targetValueArrayLength && !foundMatch; i++)
                {
                    var currentTargetValue = targetValues[i];

                    if (currentTargetValue === queryVal)
                    {
                        foundMatch = true;
                    }
                }

                return foundMatch;
            }
            else
            {
                return queryVal === targetVal;
            }
        }
        else if (!checkExists(queryVal) && checkExists(targetVal))
        {
            //do not search for queryvalues that are null or undefined
            return true;
        }
    }

    return false;
}

/**
* Replaces all tokens indicated by {{propertyName}}, with the object's property value.
*
* @function replaceTokensInTemplate
*
* @param {string} templateStr - Template string to replace tokens in
* @param {object} model - Object containing properties which values will be used as replacement values
* @param {boolean} doXmlEncoding - Default false. Indicates if property value should be xml encoded before replacing in template.
*
* @returns Template string with all tokens matched to object properties replaced.
*/
function replaceTokensInTemplate(templateStr, model, doXmlEncoding)
{
    if (!checkExists(model) || !checkExistsNotEmpty(templateStr))
    {
        return templateStr;
    }

    var templateReplacedText = templateStr.replace(/{{(.*?)}}/g, function (x)
    {
        var prop = x.replace("{{", "").replace("}}", "");
        var propVal = model.hasOwnProperty(prop) ? model[prop] : "";
        var valToReplaceWith = doXmlEncoding ? propVal.toString().xmlEncode() : propVal;

        return valToReplaceWith;
    });

    return templateReplacedText;
}

/**
* Replaces all tokens indicated by {{propertyName=model_propertyName}}, with the object's property value.
*
* @function mergeTokenizedStringWithModelPropertyValues
*
* @param {string} templateStr - Template string to replace tokens in
* @param {object} model - Object containing properties which values will be used as replacement values
* @param {boolean} doXmlEncoding - Default false. Indicates if property value should be xml encoded before replacing in template.
*
* @returns Template string with all tokens matched to object properties replaced.
*/
function mergeTokenizedStringWithModelPropertyValues(templateStr, model, doXmlEncoding)
{
    if (!checkExists(model) || !checkExistsNotEmpty(templateStr))
    {
        return templateStr;
    }

    var templateReplacedText = templateStr.replace(/{{(.*?)}}/g, function (x)
    {
        var result = "";

        var expression = x.replace("{{", "").replace("}}", "");
        var equalIndex = expression.indexOf("=");
        var prop = expression.substr(equalIndex + 1);
        var attr = expression.substr(0, equalIndex);

        if (checkExists(model[prop]))
        {
            result = '{0}="{1}"'.format(attr, model[prop]);
        }

        return result;
    });

    return templateReplacedText;
}


/*
Function: $type
Returns the type of object that matches the element passed in.

Arguments:
obj - the object to inspect.

Example:
>var myString = 'hello';
>$type(myString); //returns "string"

Returns:
'element' - if obj is a DOM element node
'textnode' - if obj is a DOM text node
'whitespace' - if obj is a DOM whitespace node
'arguments' - if obj is an arguments object
'object' - if obj is an object
'string' - if obj is a string
'number' - if obj is a number
'boolean' - if obj is a boolean
'function' - if obj is a function
'regexp' - if obj is a regular expression
'class' - if obj is a Class. (created with new Class, or the extend of another class).
'collection' - if obj is a native htmlelements collection, such as childNodes, getElementsByTagName .. etc.
false - (boolean) if the object is not defined or none of the above.
*/
//REPLACE WITH jQuery.type
function $type(obj)
{
    if (!$defined(obj))
    {
        return false;
    }
    if (obj.htmlElement)
    {
        return 'element';
    }
    var type = typeof obj;
    if (type === 'object' && obj.nodeName)
    {
        switch (obj.nodeType)
        {
            case 1: return 'element';
            case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
        }
    }
    if (type === 'object' || type === 'function')
    {
        switch (obj.constructor)
        {
            case Array: return 'array';
            case RegExp: return 'regexp';
            //case Class: return 'class';
        }
        if (typeof obj.length === 'number')
        {
            if (obj.item)
            {
                return 'collection';
            }
            if (obj.callee)
            {
                return 'arguments';
            }
        }
    }
    return type;
}

/*
Function: $merge
merges a number of objects recursively without referencing them or their sub-objects.

Arguments:
any number of objects.

Example:
>var mergedObj = $merge(obj1, obj2, obj3);
>//obj1, obj2, and obj3 are unaltered
*/

function $merge()
{
    var mix = {};
    for (var i = 0; i < arguments.length; i++)
    {
        for (var property in arguments[i])
        {
            var ap = arguments[i][property];
            var mp = mix[property];
            if (mp && $type(ap) === 'object' && $type(mp) === 'object')
            {
                mix[property] = $merge(mp, ap);
            }
            else
            {
                mix[property] = ap;
            }
        }
    }
    return mix;
}

/*
Function: $extend
Copies all the properties from the second passed object to the first passed Object.
If you do myWhatever.extend = $extend the first parameter will become myWhatever, and your extend function will only need one parameter.

Example:
(start code)
var firstOb = {
'name': 'John',
'lastName': 'Doe'
};
var secondOb = {
'age': '20',
'sex': 'male',
'lastName': 'Dorian'
};
$extend(firstOb, secondOb);
//firstOb will become:
{
'name': 'John',
'lastName': 'Dorian',
'age': '20',
'sex': 'male'
};
(end)

Returns:
The first object, extended.
*/

var $extend = function ()
{
    var args = arguments;
    if (!args[1])
    {
        args = [this, args[0]];
    }
    for (var property in args[1])
    {
        args[0][property] = args[1][property];
    }
    return args[0];
};

/*
Function: $chk
Returns true if the passed in value/object exists or is 0, otherwise returns false.
Useful to accept zeroes.

Arguments:
obj - object to inspect
*/

function $chk(obj)
{
    return !!(obj || obj === 0);
}

/*
Function: $pick
Returns the first object if defined, otherwise returns the second.

Arguments:
obj - object to test
picked - the default to return

Example:
(start code)
function say(msg){
alert($pick(msg, 'no meessage supplied'));
}
(end)
*/

function $pick(obj, picked)
{
    return $defined(obj) ? obj : picked;
}

/*
Function: $random
Returns a random integer number between the two passed in values.

Arguments:
min - integer, the minimum value (inclusive).
max - integer, the maximum value (inclusive).

Returns:
a random integer between min and max.
*/

function $random(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/*
Function: $time
Returns the current timestamp

Returns:
a timestamp integer.
*/

function $time()
{
    return new Date().getTime();
}

/*
Function: $clear
clears a timeout or an Interval.

Returns:
null

Arguments:
timer - the setInterval or setTimeout to clear.

Example:
>var myTimer = myFunction.delay(5000); //wait 5 seconds and execute my function.
>myTimer = $clear(myTimer); //nevermind

See also:
<Function.delay>, <Function.periodical>
*/

function $clear(timer)
{
    clearTimeout(timer);
    clearInterval(timer);
    return null;
}

function CalculatePerformance(message)
{
    if (typeof PerformanceStartTime === "undefined")
    {
        PerformanceStartTime = {};
        PerformanceTotals = {};
        if (typeof console === "undefined" || typeof console.log === "undefined")
        {
            PerformanceConsole = $("<input id='PerformanceConsole' type='text' value='' style='display:none'/>");
            PerformanceConsole.appendTo("body");
        }
    }
    if (PerformanceStartTime[message])
    {
        var endTime = new Date();
        var thisDuration = endTime.getTime() - PerformanceStartTime[message].getTime();
        if (checkExists(PerformanceTotals[message]))
        {
            PerformanceTotals[message] += thisDuration;
        }
        else
        {
            PerformanceTotals[message] = thisDuration;
        }
        if (typeof PerformanceConsole === "undefined")
        {

            var result = "Perf: ({0}): {1}  Total : {2}".format(message, thisDuration, PerformanceTotals[message]);
            console.log(result);
            if (typeof console.groupEnd !== "undefined")
            {
                console.groupEnd();
            }
        }
        else
        {
            PerformanceConsole.val(PerformanceConsole.val() + "<t>{1}</t></{0}>".format(message, thisDuration));
        }
        PerformanceStartTime[message] = null;
    }
    else
    {
        PerformanceStartTime[message] = new Date();
        if (typeof PerformanceConsole === "undefined")
        {
            if (typeof console.group !== "undefined")
            {
                console.group(message);
            }
        }
        else
        {
            PerformanceConsole.val(PerformanceConsole.val() + "<{0}>".format(message));
        }
    }
}

var LoggingConsole = null;
var LoggingGrid = null;
var LoggingDebugValues = null;

function translateDebugLevel(debugValue)
{
    if (checkExists(debugValue))
    {
        if (!isNaN(debugValue))
        {
            return parseInt(debugValue, 10);
        }
        else
        {
            return _debuggingTypes.indexOf(debugValue.toLowerCase()) + 1;
        }
    }
    else
    {
        return null;
    }
}
var _debugPreviousCategory = null;
var SFLogData = "";

function WriteExceptionXml(exception)
{
    var exceptionXmlString = "<Exception>{0}</Exception>";
    var rowTemplate = "<{0}>{1}</{0}>";
    var exceptionXmlStringParts = "";
    exceptionXmlStringParts += rowTemplate.format("Message", exception.message);

    var trace = printStackTrace({ e: exception, guess: true });
    var traceRows = "";
    for (var i = 0; i < trace.length; i++)
    {
        traceRows += rowTemplate.format("Item", trace[i].xmlEncode());
    }
    exceptionXmlStringParts += rowTemplate.format("Trace", traceRows);
    return exceptionXmlString.format(exceptionXmlStringParts);
}

//#region humanation
var _humateCollectionPopulated = false;
var _AssocDictionary = {};
function queryAssocDictionary(id, value)
{
    if (checkExists(id))
    {
        var dl = _AssocDictionary.length;
        var result = _AssocDictionary[id];
        if (checkExists(result))
        {
            return result;
        }
        if (checkExists(value))
        {
            _AssocDictionary[id + ""] = value;
            return value;
        }
        else
        {
            return null;
        }

    }
}

function _humanateFromDocument(text, document, pathToCollection, idLookup, nameLookup)
{
    var formatString = "(Name: '{0}', Id: '{1}')";
    idLookup = (checkExists(idLookup)) ? idLookup : "@ID";
    nameLookup = (checkExists(nameLookup)) ? nameLookup : "@Name";

    if (checkExists(document))
    {

        var items = document.selectNodes(pathToCollection);
        var itemsLen = items.length;
        for (var i = 0; i < itemsLen; i++)
        {
            var currentItem = items[i];
            var currentID = currentItem.selectSingleNode(idLookup);
            var currentName = currentItem.selectSingleNode(nameLookup);
            if (checkExists(currentID) && currentID !== "" && checkExists(currentName) && currentName !== "")
            {
                if (checkExists(currentID.text))
                {
                    currentID = currentID.text;
                }
                if (checkExists(currentName.text))
                {
                    currentName = currentName.text;
                }
                var replacement = formatString.format(currentName, currentID);
                queryAssocDictionary(currentID, replacement);
            }
        }
    }
    return text;
}
function HumanateLookup(text)
{
    var containsGuid = stringRegularExpressions.findGuids;
    containsGuid.lastIndex = 0;
    var resultingText = "";

    var lastLastIndex = 0;
    containsGuid.lastIndex = 0;
    var result = containsGuid.exec(text);

    while (result)
    {
        var startPos = containsGuid.lastIndex;
        if (startPos >= result[0].length)
        {
            startPos = startPos - result[0].length;
        }
        var guid = text.substr(startPos, result[0].length);
        var replacement = queryAssocDictionary(guid);
        if (checkExists(replacement))
        {
            resultingText += text.substr(lastLastIndex, startPos - lastLastIndex);
            resultingText += replacement;
        }
        else
        {
            resultingText += text.substr(lastLastIndex, startPos + result[0].length - lastLastIndex);
        }
        lastLastIndex = containsGuid.lastIndex;
        if (lastLastIndex === 0 || lastLastIndex === text.length)
        {
            break;
        }
        result = containsGuid.exec(text);
    }
    if (lastLastIndex !== 0 && lastLastIndex !== text.length)
    {
        resultingText += text.substr(lastLastIndex, text.length - lastLastIndex);
    }

    return (resultingText !== "") ? resultingText : text;
}

function Humanate(text)
{
    //sanity check should we skip replacements (humanate is only designed to replace guids)
    if (typeof text === "string" && checkExists(text) && text !== "" && text.containsGuid())
    {
        if (!_humateCollectionPopulated)
        {
            //build collection and replace values
            _humateCollectionPopulated = true;

            //views
            _humanateFromDocument(text, viewControllerDefinition, "Controllers/Controller", null, "ViewName");
            //fields
            _humanateFromDocument(text, viewControllerDefinition, "Controllers/Controller/Fields/Field", null, "PropertyName");
            //controls
            _humanateFromDocument(text, viewControllerDefinition, "Controllers/Controller/Controls/Control");
            //events
            _humanateFromDocument(text, formBindingXml, "Events/Event");
        }
        return HumanateLookup(text);
    }
    return text;
}
//end #region humanation

function buildSFLogRows()
{
    var _runtimeLogRows = [];
    var result, loggingRow;
    SFLogData = "<Logs>";
    for (var i = 0; i < _runtimeSFLogEntries.length; i++)
    {
        var logObject = _runtimeSFLogEntries[i];
        result = "<Log Time='" + logObject.logTime + "'";
        loggingRow = [];
        loggingRow.push({ display: logObject.logTime, value: logObject.logTime });

        if (checkExists(logObject.type))
        {
            result += " Type='" + logObject.type + "'";
            loggingRow.push({ display: logObject.type, value: logObject.type });
        }
        else
        {
            loggingRow.push({ display: '', value: '' });
        }
        if (checkExists(logObject.category))
        {
            result += " Category='" + logObject.category + "'";
            loggingRow.push({ display: logObject.category, value: logObject.category });
        }
        else
        {
            loggingRow.push({ display: '', value: '' });
        }
        if (checkExists(logObject.source))
        {
            result += " Source='" + logObject.source + "'";
            loggingRow.push({ display: logObject.source, value: logObject.source });
        }
        else
        {
            loggingRow.push({ display: '', value: '' });
        }

        if (checkExists(logObject.message))
        {
            var nonConsoleMessage = logObject.message.htmlEncode();
            result += " Message='" + nonConsoleMessage + "'";
            loggingRow.push({ display: nonConsoleMessage, value: nonConsoleMessage });
        }
        else
        {
            loggingRow.push({ display: '', value: '' });
        }

        result += ">";
        if (checkExists(logObject.data))
        {
            loggingRow.push({ display: "X", value: i });
            result += logObject.data.xml;
        }
        else
        {
            loggingRow.push({ display: '', value: -1 });
        }


        result += "</Log>";
        SFLogData += result;
        _runtimeLogRows.push(loggingRow);
    }
    SFLogData += "</Logs>";
    return _runtimeLogRows;
}
var _runtimeSFLogEntries = [];
var _runtimeCreateErrorControlsTimeout = null;
function SFLog(logobject)
{
    if (checkExists(_debug))
    {
        var typelevel = translateDebugLevel(logobject.type);
        if (typelevel >= _debug)
        {
            var type = logobject.type;
            var source = logobject.source;
            var category = logobject.category;
            var message = logobject.message;
            var parameters = logobject.parameters;
            var exception = checkExists(logobject.exception) ? WriteExceptionXml(logobject.exception) : null;
            var data = logobject.data;
            var dataExists = checkExists(data);
            var humanateData = checkExists(logobject.humanateData) ? logobject.humanateData : true;
            var logTime = new Date().format("yyyy-MM-ddTHH:mm:ss:fff");
            var JSONResult = null;

            if (dataExists)
            {
                dataString = data.xml;
                if (!checkExists(dataString))
                {
                    dataString = data;
                }
                if (humanateData === true)
                {
                    dataString = Humanate(dataString);
                }
                if (typeof data === "string")
                {

                    //Check if trimLeft Exists before using it. Modern Browsers will have it.
                    if (typeof ''.trimLeft !== "function")
                    {
                        String.prototype.trimLeft = function ()
                        {
                            return this.replace(/^\s+/, "")
                        };
                    }
                    //Check if this is XML
                    var xmlStart = data.trimLeft().indexOf('<');
                    if (xmlStart === -1 || xmlStart !== 0)
                    {
                        try
                        {
                            JSONResult = JSON.parse(data);
                        } catch (e)
                        {
                        }
                    }
                }
                else if (typeof data === "object" && !checkExists(data.xml))//If this is an object, that is not an XML object
                {
                    JSONResult = data;
                }
            }

            if (checkExists(JSONResult))//This will also be false if there is no data or it's not a JSON String that requires parsing
            {
                data = { data: JSONResult, isJSON: true };
                if (checkExists(exception))
                {
                    //merge exception into data
                    data.data.exception = exception;
                }
            }
            else
            {
                var dataWrapper = "<Data>{0}</Data>";
                if (dataExists && checkExists(exception))
                {
                    //merge exception into data
                    dataString = dataWrapper.format(exception + dataString);
                    data = parseXML(dataString).documentElement;
                }
                else if (checkExists(exception))
                {
                    dataString = dataWrapper.format(exception);
                    data = parseXML(dataString).documentElement;
                }
                else if (dataExists)
                {
                    dataString = dataWrapper.format(dataString);
                    data = parseXML(dataString).documentElement;
                }
            }
            logobject.data = data;

            if (checkExists(message))
            {
                if (checkExists(parameters) && parameters.length > 0)
                {
                    message = message.format(parameters);
                }
                logobject.message = Humanate(message);
            }

            logobject.logTime = logTime;
            type = _debuggingTypes[typelevel - 1];
            logobject.type = type;
            _runtimeSFLogEntries.push(logobject);

            if (!checkExists(LoggingGrid) && _runtimeCreateErrorControlsTimeout === null)
            {
                _runtimeCreateErrorControlsTimeout =
                    setTimeout(function ()
                    {
                        LoggingConsole = $("<textarea id='LoggingConsole' type='multiline' readonly='true' value='' style='display:none; height:99%; width:99%; border:0'></textarea>");
                        LoggingDebugValues = $("<textarea id='LoggingDebugValues' type='multiline' readonly='true' value='' style='display:none; height:99%; width:99%; border:0'></textarea>");
                        LoggingConsole.appendTo("body");
                        LoggingDebugValues.appendTo("body");

                        LoggingGrid = $(SCGrid.html({
                            id: "LoggingGrid",
                            header: "Logger",
                            toolbars: 1,

                            resources: {
                                emptygrid: Resources.CommonPhrases.EmptyGridMessageText,
                                page: Resources.CommonLabels.PagingPageText,
                                pagecount: Resources.CommonLabels.PagingTotalPagesText,
                                actionrow: Resources.CommonActions.AddText
                            },

                            columns: [
                                { display: "Time", name: "time", width: "160px", sortable: true, align: "left", datatype: "datetime" },
                                { display: "Type", name: "type", width: "60px", sortable: true, align: "left", datatype: "text" },
                                { display: "Category", name: "category", width: "60px", sortable: true, align: "left", datatype: "text" },
                                { display: "Source", name: "source", width: "140px", sortable: true, align: "left", datatype: "text" },
                                { display: "Message", name: "message", sortable: true, align: "left", datatype: "text", modulus: true },
                                { display: "Data", name: "data", width: "60px", sortable: true, align: "left", datatype: "text" }
                            ]
                        }));
                        LoggingGrid.appendTo("body");
                        LoggingGrid.grid({
                            rowdblclick: function ()
                            {
                                var dataValue = LoggingGrid.grid("fetch", "selected-rows").children("td").eq(5).metadata().value;
                                if (checkExists(dataValue) && dataValue > -1)
                                {
                                    dataValue = _runtimeSFLogEntries[dataValue].data;
                                    if (checkExists(dataValue))
                                    {
                                        if (dataValue.isJSON === true)
                                        {
                                            dataValue = JSON.stringify(dataValue.data);
                                        }
                                        else
                                        {
                                            dataValue = prettyFormatXml(dataValue);
                                        }
                                        LoggingDebugValues.val(dataValue);
                                        popupManager.showPopup({
                                            id: 'LoggingDebugValues_popUp',
                                            content: LoggingDebugValues,
                                            headerText: 'Debugging Data',
                                            height: controlHeight / 10 * 6,
                                            removeContent: false,
                                            showHeaderButtons: true,
                                            width: controlWidth / 10 * 6
                                        });
                                    }
                                }
                            }
                        });
                        var tb = LoggingGrid.grid("fetch", "toolbars").toolbargroup("fetch", "toolbars").eq(0).toolbar();
                        tb.toolbar("add", "button", { id: "clearLogger", icon: "delete", description: 'Clear log' });
                        tb.toolbar("add", "button", { id: "showXml", icon: "settings", description: 'Get log XML' });
                        var toolbarItems = tb.toolbar("fetch", "buttons").eq(0).on("click", function ()
                        {
                            LoggingConsole.val("");
                            SFLogData = "";
                            LoggingGrid.grid("clear");
                            _runtimeSFLogEntries = [];
                        });

                        toolbarItems = tb.toolbar("fetch", "buttons").eq(1).on("click", function ()
                        {
                            LoggingConsole.val(SFLogData);
                            popupManager.showPopup({
                                id: 'LoggingConsole_popUp',
                                content: LoggingConsole,
                                headerText: 'Logging XML',
                                height: controlHeight / 10 * 6,
                                removeContent: false,
                                showHeaderButtons: true,
                                width: controlWidth / 10 * 6
                            });
                        });

                        LoggingGrid[0].style.display = "none";

                        var showConsole = $("<input type='button' id='ShowLog' value='Show Log' />");
                        var showDiv = $("<div style='z-index: 1000; position: absolute; right: 0; top: 0; width:90px;'></div>");
                        showDiv.appendTo("body");
                        var percentageSize = 8;
                        var controlHeight = Math.floor(jQuery(window).height() / 10 * percentageSize);
                        var controlWidth = Math.floor(jQuery(window).width() / 10 * percentageSize);
                        showConsole.appendTo(showDiv);
                        showConsole.on("click", function ()
                        {
                            if (!LoggingGrid[0].style.display === "none")
                            {
                                LoggingGrid[0].style.display = "none";
                            }
                            else
                            {
                                LoggingGrid.grid("clear");
                                LoggingGrid.grid("add", "rows", buildSFLogRows());

                                LoggingGrid[0].style.display = "";
                                popupManager.showPopup(
                                    {
                                        id: 'LoggingGrid_popUp',
                                        content: LoggingGrid,
                                        headerText: 'Logging Information',
                                        height: controlHeight,
                                        removeContent: false,
                                        showHeaderButtons: true,
                                        width: controlWidth
                                    });

                                LoggingGrid.grid("synccolumns");
                            }
                        });
                    }, 0)
            }

            if (typeof console !== "undefined" && typeof console.log !== "undefined" && console && console.log)
            {
                setTimeout(function ()
                {
                    var consoleData = "";
                    if (checkExists(data))
                    {
                        consoleData = data;
                        if (consoleData.isJSON === true)
                        {
                            consoleData = JSON.stringify(consoleData.data);
                        }
                        else if (SourceCode.Forms.Browser.msie)
                        {
                            consoleData = consoleData.xml;
                        }
                    }
                    if (category !== _debugPreviousCategory && console.group)
                    {
                        if (checkExists(_debugPreviousCategory))
                        {
                            console.groupEnd();
                        }
                        console.group(category);
                        _debugPreviousCategory = category;

                        switch (typelevel)
                        {
                            case 1: //debug
                                console.debug(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                                break;
                            case 2: //message
                                console.log(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                                break;
                            case 3: //info
                                console.info(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                                break;
                            case 4: //warning
                                console.warn(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                                break;
                            case 5: //error
                                console.error(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                                break;
                        }

                    }
                    else
                    {
                        console.log(logTime, "[" + type + "]", message, "(" + category + ": " + source + ")", consoleData);
                    }
                }, 0);

            }
        }
    }
}

var PFInstances = {};

function PFStart(category, operation, instance)
{
    try
    {
        if (SourceCode.Forms.Settings.PerformanceMonitoringEnabled)
        {
            var startTime = new Date();
            PFInstances["{0}___{1}___{2}".format(category, operation, instance)] = startTime;
        }
    } catch (e) { }
}

var PFLogToAjax = false;
var PFLogToConsole = true;

function PFSuccess(category, operation, instance)
{
    PFEnd(category, operation, instance, true);
}

function PFFailed(category, operation, instance)
{
    PFEnd(category, operation, instance, false);
}

function PFEnd(category, operation, instance, success)
{
    try
    {
        if (SourceCode.Forms.Settings.PerformanceMonitoringEnabled)
        {
            var endTime = new Date();
            var startTime = PFInstances["{0}___{1}___{2}".format(category, operation, instance)];

            if (PFLogToConsole)
            {
                console.log("PF,{4},{5},{1},{2},{3},{6},{7}".format(
                    applicationRoot, category, operation, instance, (endTime.getTime() - startTime.getTime()).toString(), (!success).toString(), startTime.toISOString(), endTime.toISOString()));
            }

            if (PFLogToAjax)
            {
                jQuery.ajax(
                    {
                        url: '{0}Utilities/AjaxCall.ashx?method=LogPerformance&Category={1}&Operation={2}&Instance={3}&Duration={4}&Failed={5}&Start={6}&End={7}'.format(
                            applicationRoot, category, operation, instance, (endTime.getTime() - startTime.getTime()).toString(), (!success).toString(), startTime.toISOString(), endTime.toISOString()),
                        type: 'GET',
                        async: true,
                        cache: false,
                        dataType: 'xml'
                    });
            }
        }
    } catch (e) { }
}

PFStart('PF', 'Load', '');

function LogInternalErrorMessage(category, source, message)
{
    SFLog({ type: 4, source: source, category: category, message: message });
}

if (typeof SourceCode === "undefined" || SourceCode === null)
{
    SourceCode = {};
}
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null)
{
    SourceCode.Forms = {};
}

SourceCode.Forms.BorderBox =
{
    featureDetectionRun: false,
    supportsHorizontal: false,
    supportsVertical: false,
    nativeBorderBoxSupport: false,
    workingPaddingAndBorders: true,

    runFeatureDetection: function ()
    {
        var test = jQuery("<div class='test-container' style='position:absolute;left:100px;display:inline-block;padding:2px;border:2px solid red;'>"
            + "<div class='test-content' style='display:inline-block;box-sizing: border-box;-moz-box-sizing: border-box;-webkit-box-sizing: border-box;min-width:60px;min-height:50px;padding:2px;border:2px solid black;'></div></div>");
        jQuery("body").append(test);

        var measuredWidth = test.outerWidth();
        if (measuredWidth === 68)
        {
            SourceCode.Forms.BorderBox.supportsHorizontal = true;
        }
        var measuredHeight = test.outerHeight();
        if (measuredHeight === 58)
        {
            SourceCode.Forms.BorderBox.supportsVertical = true;
        }

        // Native Border Box Sizing Support
        SourceCode.Forms.BorderBox.nativeBorderBoxSupport = (test.children().first().outerWidth() === 60 && test.children().first().outerHeight() === 50);

        test.remove();

        //TODO 1.0.3 replace with feature detection
        if (checkExists(SourceCode.Forms.Browser.msie))
        {
            var browserVersion = SourceCode.Forms.Browser.version;
            browserVersion = browserVersion.slice(0, browserVersion.indexOf("."));

            if (browserVersion < 9 || document.documentMode < 9)
            {
                SourceCode.Forms.BorderBox.workingPaddingAndBorders = false;
            }
        }
        SourceCode.Forms.BorderBox.featureDetectionRun = true;
    },

    GetWorkingPaddingAndBorders: function ()
    {
        if (!SourceCode.Forms.BorderBox.featureDetectionRun)
        {
            SourceCode.Forms.BorderBox.runFeatureDetection();
        }
        return SourceCode.Forms.BorderBox.workingPaddingAndBorders;
    },

    checkIsBlockElement: function (wrapper)
    {
        return (checkExists(wrapper[0].style.width) && wrapper[0].style.width === "100%") ||
            wrapper.css("display") === "block" && wrapper.css("float") === "none" ||
            wrapper.css("position") === "absolute";
    },

    fixContainer: function (wrapper, controls, doHorizontal, doVertical, minWidth, minHeight)
    {
        if (!checkExists(wrapper) || wrapper.length === 0)
        {
            return;
        }
        if (SourceCode.Forms.BorderBox.checkIsBlockElement(wrapper))
        {
            return;
        }
        if (!SourceCode.Forms.BorderBox.featureDetectionRun)
        {
            SourceCode.Forms.BorderBox.runFeatureDetection();
        }
        var controlsCount = controls.length;
        if (!SourceCode.Forms.BorderBox.supportsHorizontal && doHorizontal === true)
        {
            //measure control width
            var actualControlWidth = controls.widthAll();
            if (!checkExists(minWidth) || actualControlWidth < (minWidth * controlsCount))
            {
                var actualControlOuterWidth = controls.outerWidthAll(true);
                if (wrapper.length > 0)
                {
                    wrapper[0].style.width = actualControlOuterWidth + "px";
                }
            }
        }

        if (!SourceCode.Forms.BorderBox.supportsVertical && doVertical === true)
        {
            //measure control height
            var maxControlHeight = 0;
            var maxOuterControlHeight = 0;
            var i = controlsCount;
            var currentHeight = 0;

            while (i--)
            {
                currentHeight = jQuery(controls[i]).height(true);
                if (currentHeight > maxControlHeight)
                {
                    maxControlHeight = currentHeight;
                }
                currentHeight = jQuery(controls[i]).outerHeight(true);
                if (currentHeight > maxOuterControlHeight)
                {
                    maxOuterControlHeight = currentHeight;
                }
            }
            if (!checkExists(minHeight) || maxControlHeight < minHeight)
            {
                if (wrapper.length > 0)
                {
                    wrapper[0].style.height = maxOuterControlHeight + "px";
                }
            }
        }
    }
};

function getWindowInnerHeight()
{
    return window.innerHeight;
}

function getWindowOuterHeight()
{
    return window.outerHeight;
}

// Fix rendering issues by forceing a reflow
// Currently checks only for IE < 9 before attempting to fix anything
// I have tested alternatives on a large form (performance is impacted and performance is directly proportional to form size)
// body hide show body ave 467ms
// body body.className = body.className ave 778ms
// body parent hide show = body.className ave 639ms
SourceCode.Forms.Layout =
{
    _useAnimations: null,

    useAnimations: function (setUseAnimations)
    {
        function toggleAnimations(useAnimations)
        {
            if (useAnimations)
            {
                $("html").removeClass("disableAnimations");
                $("#disableAnimationsCss").remove();
            }
            else
            {
                $("html").addClass("disableAnimations");
                var disableCss = "<style id='disableAnimationsCss'>html.disableAnimations *{-o-transition-property:none!important;-moz-transition-property:none!important;-ms-transition-property:none!important;-webkit-transition-property:none!important;transition-property:none!important;-o-transform:none!important;-moz-transform:none!important;-ms-transform:none!important;-webkit-transform:none!important;transform:none!important;-webkit-animation:none!important;-moz-animation:none!important;-o-animation:none!important;-ms-animation:none!important;animation:none!important}</style>";
                $("head").append(disableCss);
            }
        }
        if (!checkExists(setUseAnimations) || (setUseAnimations !== true && setUseAnimations !== false))
        {
            if (SourceCode.Forms.Layout._useAnimations === null)
            {
                //checkExists check incase the settings have not been loaded for example with the login page
                var animationSettingExists = checkExists(SourceCode.Forms.Settings) && checkExists(SourceCode.Forms.Settings.Compatibility) && checkExists(SourceCode.Forms.Settings.Compatibility.UseAnimations)
                var useAnimations = (animationSettingExists && !SourceCode.Forms.Layout.isRuntime()) ? SourceCode.Forms.Settings.Compatibility.UseAnimations : true;
                SourceCode.Forms.Layout._useAnimations = useAnimations;
                if (!SourceCode.Forms.Layout._useAnimations)
                {
                    toggleAnimations(SourceCode.Forms.Layout._useAnimations);
                }
            }
        }
        else
        {
            SourceCode.Forms.Layout._useAnimations = (setUseAnimations === true);
            toggleAnimations(SourceCode.Forms.Layout._useAnimations);
        }
        return SourceCode.Forms.Layout._useAnimations;

    },

    //Override all animations on popup closing, since it is causing too much issues at the moment
    //Might possibly add it back at some stage in the future, with a proper solution implemented
    _useAnimationsOnPopupClosing: false,

    useAnimationsOnPopupClosing: function ()
    {
        return SourceCode.Forms.Layout._useAnimationsOnPopupClosing;
    },

    isRuntime: function ()
    {
        return typeof initializeRuntimeForm === "function";
    },

    isLoginPage: function ()
    {
        return ($("#SignInPanel").length > 0)
    },

    //used with the main controls on the view
    checkAndFixView: function (element)
    {
        if (SourceCode.Forms.Layout.isRuntime() && checkExists(element) && element.length !== 0 && checkExists(SourceCode.Forms.Browser.msie) && SourceCode.Forms.Browser.version < 9)
        {
            var parent = element.parent();
            if (parent.length > 0)
            {
                parent = parent.parent();
                if (parent.hasClass("view"))
                {
                    var nativeElement = parent[0];
                    //force a document reflow to fix the layout incorrectly rendered
                    nativeElement.style.cssText += "";
                }
            }
        }
    },
    //can be used anywhere else make sure to parse through the element that has trouble which will usually be a parent
    checkAndFix: function (element)
    {
        if (checkExists(SourceCode.Forms.Browser.msie) && SourceCode.Forms.Browser.version < 9)
        {
            SourceCode.Forms.Layout.reflowIE(element);
        }
    },

    //can be used anywhere else make sure to parse through the element that has trouble which will usually be a parent
    reflowIE: function (element)
    {
        if (checkExists(element) && element.length !== 0)
        {
            var nativeElement = element[0];
            //force a document reflow to fix the layout incorrectly rendered
            nativeElement.style.cssText += "";
        }
    }
};

$(SourceCode.Forms.Layout.useAnimations);
// PERFORMANCE OPTIMIZATION: Replace accept data (only exceptions are object and embed tags but flashtags are supported - see noData)
// This bypassed validation logic but speeds up forms with 100s of controls
// Reasoning: The only times this function should return false is for embed and (non-silverlight) object tags (see jQuery.noData) which we don't use.
// If this causes issues this code should be commented out
jQuery.acceptData = function (element)
{
    return true; // Performance shortcut (B)
};

(function ($, undefined)
{
    // PERFORMANCE OPTIMIZATION: Skip create event as its has a hard hitting performance issue

    var widgetUuid = 0;

    $.Widget.prototype._createWidget = function (options, element)
    {
        element = $(element || this.defaultElement || this)[0];
        this.element = $(element);
        this.uuid = widgetUuid++;
        this.eventNamespace = "." + this.widgetName + this.uuid;

        this.bindings = $();
        this.hoverable = $();
        this.focusable = $();
        this.classesElementLookup = {};

        if (element !== this)
        {
            $.data(element, this.widgetFullName, this);
            this._on(true, this.element, {
                remove: function (event)
                {
                    if (event.target === element)
                    {
                        this.destroy();
                    }
                }
            });
            this.document = $(element.style ?

                // Element within the document
                element.ownerDocument :

                // Element is window or document
                element.document || element);
            this.window = $(this.document[0].defaultView || this.document[0].parentWindow);
        }

        this.options = $.widget.extend({},
            this.options,
            this._getCreateOptions(),
            options);

        this._create();

        if (this.options.disabled)
        {
            this._setOptionDisabled(this.options.disabled);
        }
        //skip this event for performance
        //this._trigger("create", null, this._getCreateEventData());
        this._init();
    };
})(jQuery);

jQuery.fn.isWidget = function (widgetType)
{
    if (checkExists(this.data("ui-" + widgetType)))
    {
        return true;
    }
    else if (checkExists(this.data("k2-" + widgetType)))
    {
        return true;
    }

    return false;
};

/// <summary>
///	A manager which determines whether or not to fire a single of double click event
///	</summary>
function ClickManager(options)
{
    $.extend(this, options || {});

    /**
`	* Need to be careful with this.
    * Too long a delay will decrease perceived performance.
    * Too short, and some users will not be able to double click.
    */
    this.timeout = 350;
    this.timer = null;	// Reference variable for the timeout
    this.source = null;	// The original element clicked
    this.clicks = 0;	// The current number of clicks

    /// <summary>
    ///	Handles a click event and determines whether or not to trigger a single or double click
    ///	</summary>
    /// <param name="ui">A jQuery wrapped instance of the source element</param>
    /// <param name="e">The event arguments</param>
    /// <param name="fn">A function to run in the event of a single click</param>
    this.click = function (ui, e, fn)
    {
        // Detect if it's a system event and fire the event immediately.
        if (checkExists(e.originalEvent) && (e.originalEvent instanceof MouseEvent || ((checkExists(e.originalEvent.originalEvent) && e.originalEvent.originalEvent instanceof MouseEvent))))
        {
            // Increment the number of clicks before checking the event state. Due to initial value of 0 clicks.
            this.clicks++;

            // If we have more than 1 click
            if (this.clicks > 1)
            {
                // On the same element
                if (this.source === e.target)
                {
                    // Clear the state.
                    this.reset();

                    // Return to prevent triggering a single click.
                    // The double click handler will catch this thus no need to trigger.
                    return;
                }
                // Otherwise, allow a single click on the last element.
                else if (this.timer)
                {
                    // Cancel current double click. The new source is set by the resulting single click.
                    this.reset();
                }
            }

            // Set the source element for comparison with subsequent clicks.
            this.source = e.target;

            // Set the timer reference to a new timeout utilizing the fn argument.
            var self = this;
            this.timer = setTimeout(function ()
            {
                self.reset();
                fn(ui, e);
            }, this.timeout);
        }
        else
        {
            fn(ui, e);
        }
    };

    /// <summary>
    ///	Handles a double click event and cancels any immediate click events after
    ///	</summary>
    /// <param name="ui">A jQuery wrapped instance of the source element</param>
    /// <param name="e">The event arguments</param>
    /// <param name="fn">A function to run in the event of a single click</param>
    this.dblClick = function (ui, e, fn)
    {
        // Detect if it's a system event
        if (this.source === e.target && (checkExists(e.originalEvent) && (e.originalEvent instanceof MouseEvent || ((checkExists(e.originalEvent.originalEvent) && e.originalEvent.originalEvent instanceof MouseEvent)))))
        {
            // Clear the pending click state.
            this.reset();
        }
        //Always call the double click function
        fn(ui, e);
    };

    /// <summary>
    ///	Resets the manager's members
    ///	</summary>
    this.reset = function ()
    {
        this.source = null;
        this.clicks = 0;
        clearTimeout(this.timer);
    };

    return this;
}

if (!checkExists(SourceCode.Forms.Utilities))
{
    SourceCode.Forms.Utilities = {};
}

SourceCode.Forms.Utilities.defineLazyLoadProperty = function (detail)
{
    try
    {
        var getterSetter = {}
        if (checkExists(detail.get))
        {
            getterSetter.get = detail.get;
        }
        if (checkExists(detail.set))
        {
            getterSetter.set = detail.set;
        }
        Object.defineProperty(detail.object, detail.propertyName, getterSetter);
    }
    catch (ex)
    {
        detail.object[detail.propertyName] = detail.get();
    }
}

SourceCode.Forms.BrowserDetection = function (userAgent)
{
    var ua = userAgent.toLowerCase();

    var match = /(edge)[ \/]([\w.]+)/.exec(ua) ||
        /(chrome)[ \/]([\w.]+)/.exec(ua) ||
        /(webkit)[ \/]([\w.]+)/.exec(ua) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
        /(msie) ([\w.]+)/.exec(ua) ||
        /(trident)(?:.*? rv:([\w.]+)|)/.exec(ua) || /* IE 11 detection */

        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
        [];
    var browser = {};

    if (checkExists(match[1]))
    {
        /* IE 11 detection */
        if (match[1] === "trident")
        {
            match[1] = "msie"
        }
        browser[match[1]] = true;

        if (browser.edge)
        {
            browser.edgeHTMLVersion = match[2] || "0";
            browser.version = determineEdgeVersionFromEdgeHTMLVersion(browser.edgeHTMLVersion);
        }
        else
        {
            browser.version = match[2] || "0";
        }
    }

    //chrome is webkit and webkit is safari
    if (browser.chrome)
    {
        browser.webkit = true;
    }
    else if (browser.webkit)
    {
        browser.safari = true;
    }

    if ($('html.safari.mobile').length > 0)
    {
        browser.safarimobile = true;
    }

    var isIPadRegex = /(iPad)/i;
    if (isIPadRegex.test(ua))
    {
        browser.ipad = true;
    }

    //store the actual variable for future usage
    SourceCode.Forms.Browser = browser;
};

function determineEdgeVersionFromEdgeHTMLVersion(edgeHTMLVersion)
{
    var edgeVersion = "unknown";

    if (checkExistsNotEmpty(edgeHTMLVersion))
    {
        var edgeHTMLVersionParts = edgeHTMLVersion.split(".");

        if (edgeHTMLVersionParts.length === 2)
        {
            var windowsBuild = edgeHTMLVersionParts[1];

            if (checkExistsNotEmpty(windowsBuild) && !isNaN(windowsBuild))
            {
                var windowsBuildInt = parseInt(windowsBuild, 10);

                if (windowsBuildInt > 15063)
                {
                    //Version newer than 40, which is the current latest version
                    //TODO: Add logic here to determine later versions than 40 when they are released
                    edgeVersion = "latest";
                }
                else if (windowsBuildInt === 15063)
                {
                    edgeVersion = "40";
                }
                else if ((windowsBuildInt >= 14901) && (windowsBuildInt <= 14986))
                {
                    edgeVersion = "39";
                }
                else if ((windowsBuildInt >= 14342) && (windowsBuildInt <= 14393))
                {
                    edgeVersion = "38";
                }
                else if ((windowsBuildInt >= 14316) && (windowsBuildInt <= 14327))
                {
                    edgeVersion = "37";
                }
                else if (windowsBuildInt === 14291)
                {
                    edgeVersion = "34";
                }
                else if ((windowsBuildInt >= 14267) && (windowsBuildInt <= 14279))
                {
                    edgeVersion = "31";
                }
                else if (windowsBuildInt === 11099)
                {
                    edgeVersion = "27";
                }
                else if (windowsBuildInt === 10586)
                {
                    edgeVersion = "25";
                }
                else if (windowsBuildInt === 10565)
                {
                    edgeVersion = "23";
                }
                else if (windowsBuildInt === 10547)
                {
                    edgeVersion = "21";
                }
                else if ((windowsBuildInt >= 10166) && (windowsBuildInt <= 10532))
                {
                    edgeVersion = "20";
                }
                if (windowsBuildInt === 10049)
                {
                    edgeVersion = "0.10";
                }

                if ((edgeVersion !== "unknown") && (edgeVersion !== "latest"))
                {
                    edgeVersion = edgeVersion + "." + windowsBuild;
                }
            }
        }
    }

    return edgeVersion;
}

SourceCode.Forms.InjectBrowserUserAgentToHtml = function ()
{
    var ua = navigator.userAgent.toLowerCase();

    // Applying client browser CSS class identifiers
    var htmlElement = $(document.documentElement);
    // Internet Explorer Detection
    var msie = parseInt((/msie (\d+)/.exec(ua) || [])[1]);
    if (isNaN(msie))
    {
        msie = parseInt((/trident\/.*; rv:(\d+)/.exec(ua) || [])[1]);
    }

    if (msie > 0)
    {
        htmlElement.addClass("msie"); // Indicates IE
        htmlElement.addClass("ie" + msie.toString()); // Indicates IE version
        if (!!document.documentMode)
        {
            htmlElement.addClass("ie-document-mode-" + parseInt(document.documentMode, 10).toString()); // Indicates document mode
        }
    }

    // Opera
    if (!!window.opera || ua.indexOf(' opr/') !== -1)
    {
        htmlElement.addClass("opera"); // Indicates Opera
        if (ua.indexOf('webkit'))
        {
            htmlElement.addClass("webkit"); // Indicates Opera 20+ using WebKit
        }
    }

    // Chrome & Edge
    if (!!window.chrome && ua.indexOf('chrome') !== -1 && ua.indexOf(' opr/') === -1) 
    {
        if (ua.indexOf('edge') >= 0)
        {
            htmlElement.addClass("edge");
        }
        else
        {
            htmlElement.addClass("webkit chrome");
        }
    }

    // FireFox 
    if (typeof InstallTrigger !== 'undefined' || ua.indexOf('firefox') !== -1)
    {
        htmlElement.addClass("mozilla firefox");
    }

    // Safari
    if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0)
    {
        htmlElement.addClass("webkit safari");
    }

    // Applying box-sizing support CSS class identifiers
    if (!SourceCode.Forms.BorderBox.featureDetectionRun)
    {
        SourceCode.Forms.BorderBox.runFeatureDetection();
    }
    if (!SourceCode.Forms.BorderBox.nativeBorderBoxSupport)
    {
        htmlElement.addClass("no-border-box-support");
    }
}

//run browser detection
SourceCode.Forms.BrowserDetection(navigator.userAgent);

//#region jquery overrides

//optimised draggable
$.widget('sfc.SFCdraggable', $.ui.draggable,
    {
        widgetEventPrefix: "drag",
        widgetName: "draggable",
        _getParentOffset: function ()
        {
            //skip offset calculations
            return { top: 0, left: 0 };
        },

        _cacheHelperProportions: function ()
        {
            //skip offset calculations that are used to set the bounds of the ui helper
            this.helperProportions =
            {
                width: 1,
                height: 1
            };
        },

        _cacheMargins: function ()
        {
            //skip margins calculations that are used to set the bounds of the ui helper
            this.margins =
            {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            }
        },

        _mouseStart: function (event)
        {
            var offsetFn = this.element.offset;
            var eventRef = event;

            //override offset for performance
            this.element.offset = function ()
            {
                return { top: eventRef.pageX - eventRef.offsetX, left: eventRef.pageY - eventRef.offsetY };
            };

            var generatePositionFn = this._generatePosition;

            //override _generatePosition for performance
            this._generatePosition = function ()
            {
                return this.element.offset();
            }

            //call the existing _mouseStart function as is
            var result = $.ui.draggable.prototype._mouseStart.apply(this, arguments);


            //revert overrides
            this._generatePosition = generatePositionFn;
            this.element.offset = offsetFn;

            return result;
        },

        _createHelper: function ()
        {
            //skip finding the correct parent and use the body and html elements


            //call the existing _mouseStart function as is
            var helper = $.ui.draggable.prototype._createHelper.apply(this, arguments);

            //override the functions for the helper used later
            helper.offsetParent = function ()
            {
                return $("body");
            }
            helper.scrollParent = function ()
            {
                return $("html");
            }
            return helper;
        }
    });

$.widget('sfc.SFCPopupdraggable', $.ui.draggable,
    {
        widgetEventPrefix: "drag",
        widgetName: "draggable",
        //Overidden JQUery UI Function to fix jumping Popup when dragged
        _mouseDrag: function (event, noPropagation)
        {
            // reset any necessary cached properties (see #5009)
            if (this.hasFixedAncestor)
            {
                this.offset.parent = this._getParentOffset();
            }

            //Compute the helpers position
            this.position = this._generatePosition(event, true);
            this.positionAbs = this._convertPositionTo("absolute");

            //Call plugins and callbacks and use the resulting position if something is returned
            if (!noPropagation)
            {
                var ui = this._uiHash();
                if (this._trigger("drag", event, ui) === false)
                {
                    this._mouseUp(new $.Event("mouseup", event));
                    return false;
                }
                this.position = ui.position;
            }

            this.helper[0].style.left = this.position.left + "px";

            //Added this if statement and positionAbs use, verses JQuery UI version of this function
            if (this.scrollParent.scrollTop() === 0)
            {
                this.helper[0].style.top = this.position.top + "px";
            }
            else
            {
                this.helper[0].style.top = this.positionAbs.top + "px";
            }

            if ($.ui.ddmanager)
            {
                $.ui.ddmanager.drag(this, event);
            }

            return false;
        }
    });


function _removeCursorPluginFromSFCdraggable()
{
    if (checkExists($.sfc.SFCdraggable.prototype.plugins))
    {
        var plugins = $.sfc.SFCdraggable.prototype.plugins
        if (checkExists(plugins.start))
        {
            if (plugins.start[1][0] === "cursor")
            {
                plugins.start.splice(1, 1);
            }
        }
        if (checkExists(plugins.stop))
        {
            if (plugins.stop[1][0] === "cursor")
            {
                plugins.stop.splice(1, 1);
            }
        }
    }
}
_removeCursorPluginFromSFCdraggable();

/// <summary>
/// Common function to be used to get document location hash.
/// <returns>
/// Part of url after hash.
/// e.g. if url is http://domain/Designer/#app=AppStudio&action=edit&datatype=form&guid=1421e67f-d9d5-4487-9fe3-364cd12a3def&catid=39
/// will return string: "app=AppStudio&action=edit&datatype=form&guid=1421e67f-d9d5-4487-9fe3-364cd12a3def&catid=39"
/// </returns>
/// </summary>
getDocumentLocationHash = function ()
{
    return document.location.hash.substr(1);
},

    /// <summary>
    /// Common function to be used to get object representing the document location hash.
    /// <returns>
    /// Object from dopcument location hash.
    /// e.g. if url is http://domain/Designer/#app=AppStudio&action=edit&datatype=form&guid=1421e67f-d9d5-4487-9fe3-364cd12a3def&catid=39
    /// will return object: { app: "AppStudio", action: "edit", datatype: "form", guid: "1421e67f-d9d5-4487-9fe3-364cd12a3def", catid: 39 }
    /// </returns>
    /// </summary>
    getDocumentLocationHashObject = function ()
    {
        return $.deparam(getDocumentLocationHash());
    }
_removeCursorPluginFromSFCdraggable();

/**
 * Returns method by name.
 * To be used instead of 'eval' for security purposes
 * (https://cwe.mitre.org/data/definitions/95.html)
 * */
getMethodByName = function (methodName, contextObj)
{
    if (!methodName || !methodName.length)
    {
        return null;
    }
    var ns = methodName.split('.');
    methodName = ns.pop();
    do
    {
        if (!ns[0])
        {
            if (typeof contextObj[methodName] === "function")
            {
                return contextObj[methodName];
            }
        }
    } while (contextObj = contextObj[ns.shift()]);
    return null;
}

/**
 * For unit testing purposes
 * */
getWindowObj = function ()
{
    return window;
}
//#endregion jquery overrides

