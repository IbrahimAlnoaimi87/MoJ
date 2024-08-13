(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.CultureHelper = function (cultureXmlString, currentCultureName, timeZoneXml, formatXsltPath)
    {
        this._create(cultureXmlString, currentCultureName, timeZoneXml, formatXsltPath);
    }

    var cultureHelperPrototype =
    {
        customDateRegex: /^[dDtTF]{1}$/,
        customNumberRegex: /^.*(#|[0])+.*$/,  ///^[DdFfGgMmOoRrsTtUuYy]{1}$/;
        numberRegex: /^[FfNnEeCcGgPpRrXx]{1}[0-9]*$/,

        cultureXml: parseXML("<Cultures/>"),
        cultureObject: null,

        _formatObjectNodeCache: {},

        _create: function (cultureXmlString, currentCultureName, timeZoneXml, formatXsltPath)
        {
            this.cultureXml = parseXML(cultureXmlString);
            this.currentCultureName = currentCultureName;
            this.timeZones = JSON.parse(timeZoneXml);
            this.timeZones.lookup = {};
            var i = this.timeZones.length;
            while (i--)
            {
                this.timeZones.lookup[this.timeZones[i].Id] = this.timeZones[i];
            }
            if (formatXsltPath)
            {
                this.formatXsltPath = formatXsltPath;
            }
            else
            {
                this.formatXsltPath = applicationRoot + "Runtime/XSLT/Formatting.xslt";
            }
        },

        //retrieves the culture then executes the second argument as a call back
        //If the result is in the xml and no ajax call is required then return the result
        getCultureObject: function (cultureName, functionToExecute)
        {
            //check cache
            if (this.cultureObject && this.cultureObject.Name === cultureName)
            {
                if (functionToExecute)
                    functionToExecute(this.cultureObject);
                return this.cultureObject
            }

            this._getCultureNode(cultureName, functionToExecute);
            //check result
            return this.cultureObject;
        },

        _getCultureNode: function (cultureName, functionToExecute)
        {
            var node = null;
            if (checkExists(this.cultureXml))
                node = this.cultureXml.selectSingleNode("Cultures/Culture[Name='{0}']".format(cultureName));
            if (!checkExists(node) || !node.selectSingleNode("PercentSymbol"))
            {
                $.ajax({
                    data:
                    {
                        filterIdentifiers: cultureName,
                        method: "getDetailCultures"
                    },
                    async: (functionToExecute !== "undefined" && functionToExecute !== null),
                    dataType: 'xml',
                    url: applicationRoot + 'Runtime/AJAXCall.ashx',
                    error: function (xmlHttpRequest, textStatus, errorThrown)
                    {
                        popupManager.showError('<p>'.concat(Resources.RuntimeMessages.CulutureInformationFailedToLoad, '</p><p>[', xmlHttpRequest.status, '] ', xmlHttpRequest.statusText, ' (', textStatus, ')</p>'));
                        //error
                    }.bind(this),
                    success: function (data, textStatus, xmlHttpRequest)
                    {
                        if (SourceCode.Forms.ExceptionHandler.handleException(data))
                            return;
                        this.replaceListCultureNodeWithDetailedCultureNode(cultureName, data);
                        this._getCultureNode(cultureName, functionToExecute);

                    }.bind(this)
                });
            }
            else
            {
                this._cultureNodeRetrieved(node, functionToExecute);
            }
        },

        _cultureNodeRetrieved: function (cultureNode, functionToExecute)
        {
            var co = this._transformToCultureObject(cultureNode);
            if (functionToExecute)
                functionToExecute(co);
        },

        _transformToCultureObject: function (cultureNode)
        {
            var cultureObject = {};
            cultureObject.Name = cultureNode.selectSingleNode("Name");
            cultureObject.Name = (cultureObject.Name) ? cultureObject.Name.text : "";

            cultureObject.DisplayName = cultureNode.selectSingleNode("DisplayName");
            cultureObject.DisplayName = (cultureObject.DisplayName) ? cultureObject.DisplayName.text : "";

            cultureObject.LCID = cultureNode.selectSingleNode("LCID");
            cultureObject.LCID = (cultureObject.LCID) ? parseInt(cultureObject.LCID.text) : "";

            cultureObject.CurrencySymbol = cultureNode.selectSingleNode("CurrencySymbol");
            cultureObject.CurrencySymbol = (cultureObject.CurrencySymbol) ? cultureObject.CurrencySymbol.text : "";

            cultureObject.PercentSymbol = cultureNode.selectSingleNode("PercentSymbol");
            cultureObject.PercentSymbol = (cultureObject.PercentSymbol) ? cultureObject.PercentSymbol.text : "";

            cultureObject.NaNSymbol = cultureNode.selectSingleNode("NaNSymbol");
            cultureObject.NaNSymbol = (cultureObject.NaNSymbol) ? cultureObject.NaNSymbol.text : "";

            cultureObject.NegativeInfinitySymbol = cultureNode.selectSingleNode("NegativeInfinitySymbol");
            cultureObject.NegativeInfinitySymbol = (cultureObject.NegativeInfinitySymbol) ? cultureObject.NegativeInfinitySymbol.text : "";

            cultureObject.PositiveInfinitySymbol = cultureNode.selectSingleNode("PositiveInfinitySymbol");
            cultureObject.PositiveInfinitySymbol = (cultureObject.PositiveInfinitySymbol) ? cultureObject.PositiveInfinitySymbol.text : "";

            cultureObject.PositiveSign = cultureNode.selectSingleNode("PositiveSign");
            cultureObject.PositiveSign = (cultureObject.PositiveSign) ? cultureObject.PositiveSign.text : "";

            cultureObject.NegativeSign = cultureNode.selectSingleNode("NegativeSign");
            cultureObject.NegativeSign = (cultureObject.NegativeSign) ? cultureObject.NegativeSign.text : "";

            var currencyDetails = {};
            var currencyNode = cultureNode.selectSingleNode("CurrencyDetails");
            currencyDetails.PositivePattern = currencyNode.selectSingleNode("PositivePattern");
            currencyDetails.PositivePattern = (currencyDetails.PositivePattern) ? currencyDetails.PositivePattern.text : "";

            currencyDetails.NegativePattern = currencyNode.selectSingleNode("NegativePattern");
            currencyDetails.NegativePattern = (currencyDetails.NegativePattern) ? currencyDetails.NegativePattern.text : "";

            currencyDetails.DecimalDigits = currencyNode.selectSingleNode("DecimalDigits");
            currencyDetails.DecimalDigits = (currencyDetails.DecimalDigits) ? currencyDetails.DecimalDigits.text.toInt() : "";

            currencyDetails.DecimalSeparator = currencyNode.selectSingleNode("DecimalSeparator");
            currencyDetails.DecimalSeparator = (currencyDetails.DecimalSeparator) ? currencyDetails.DecimalSeparator.text : "";

            currencyDetails.GroupSeparator = currencyNode.selectSingleNode("GroupSeparator");
            currencyDetails.GroupSeparator = (currencyDetails.GroupSeparator) ? currencyDetails.GroupSeparator.text : "";


            var currencyGroupSizeNodes = currencyNode.selectNodes("GroupSizes/GroupSize");
            currencyDetails.GroupSizes = [];
            for (var i = 0; i < currencyGroupSizeNodes.length; i++)
            {
                currencyDetails.GroupSizes[i] = currencyGroupSizeNodes[i].text.toInt();
            }
            cultureObject.CurrencyDetails = currencyDetails;

            var numberDetails = {};
            var numberNode = cultureNode.selectSingleNode("NumberDetails");
            numberDetails.PositivePattern = numberNode.selectSingleNode("PositivePattern");
            numberDetails.PositivePattern = (numberDetails.PositivePattern) ? numberDetails.PositivePattern.text : "";

            numberDetails.NegativePattern = numberNode.selectSingleNode("NegativePattern");
            numberDetails.NegativePattern = (numberDetails.NegativePattern) ? numberDetails.NegativePattern.text : "";

            numberDetails.DecimalDigits = numberNode.selectSingleNode("DecimalDigits");
            numberDetails.DecimalDigits = (numberDetails.DecimalDigits) ? numberDetails.DecimalDigits.text.toInt() : "";

            numberDetails.DecimalSeparator = numberNode.selectSingleNode("DecimalSeparator");
            numberDetails.DecimalSeparator = (numberDetails.DecimalSeparator) ? numberDetails.DecimalSeparator.text : "";

            numberDetails.GroupSeparator = numberNode.selectSingleNode("GroupSeparator");
            numberDetails.GroupSeparator = (numberDetails.GroupSeparator) ? numberDetails.GroupSeparator.text : "";

            var numberGroupSizeNodes = numberNode.selectNodes("GroupSizes/GroupSize");
            numberDetails.GroupSizes = [];
            for (var i = 0; i < numberGroupSizeNodes.length; i++)
            {
                numberDetails.GroupSizes[i] = numberGroupSizeNodes[i].text.toInt();
            }
            cultureObject.NumberDetails = numberDetails;

            var specialDetails = {};
            var specialNode = cultureNode.selectSingleNode("SpecialDetails");

            if (specialNode !== null)
            {
                var specialPatternNodes = specialNode.selectNodes("Pattern");
                specialDetails.Patterns = [];
                for (var i = 0; i < specialPatternNodes.length; i++)
                {
                    var specialPatternNode = specialPatternNodes[i];
                    var patternObj = {};
                    patternObj["Name"] = specialPatternNode.selectSingleNode("Name").text;
                    patternObj["Display"] = specialPatternNode.selectSingleNode("Display").text;
                    patternObj["Value"] = specialPatternNode.selectSingleNode("Value").text;
                    patternObj["PreviewText"] = specialPatternNode.selectSingleNode("PreviewText").text;
                    specialDetails.Patterns[i] = patternObj;
                }
                cultureObject.SpecialDetails = specialDetails;
            }

            var percentDetails = {};
            var percentNode = cultureNode.selectSingleNode("PercentDetails");
            percentDetails.PositivePattern = percentNode.selectSingleNode("PositivePattern");
            percentDetails.PositivePattern = (percentDetails.PositivePattern) ? percentDetails.PositivePattern.text : "";

            percentDetails.NegativePattern = percentNode.selectSingleNode("NegativePattern");
            percentDetails.NegativePattern = (percentDetails.NegativePattern) ? percentDetails.NegativePattern.text : "";

            percentDetails.DecimalDigits = percentNode.selectSingleNode("DecimalDigits");
            percentDetails.DecimalDigits = (percentDetails.DecimalDigits) ? percentDetails.DecimalDigits.text.toInt() : "";

            percentDetails.DecimalSeparator = percentNode.selectSingleNode("DecimalSeparator");
            percentDetails.DecimalSeparator = (percentDetails.DecimalSeparator) ? percentDetails.DecimalSeparator.text : "";

            percentDetails.GroupSeparator = percentNode.selectSingleNode("GroupSeparator");
            percentDetails.GroupSeparator = (percentDetails.GroupSeparator) ? percentDetails.GroupSeparator.text : "";


            var percentGroupSizeNodes = percentNode.selectNodes("GroupSizes/GroupSize");
            percentDetails.GroupSizes = [];
            for (var i = 0; i < percentGroupSizeNodes.length; i++)
            {
                percentDetails.GroupSizes[i] = percentGroupSizeNodes[i].text.toInt();
            }
            cultureObject.PercentDetails = percentDetails;


            var dateTimePatternsNodes = cultureNode.selectNodes("DateTimePatterns/DateTimePattern");
            var dateTimePatterns = [];
            for (var i = 0; i < dateTimePatternsNodes.length; i++)
            {
                var dateTimePattern = {};

                dateTimePattern.Symbol = dateTimePatternsNodes[i].selectSingleNode("Symbol");
                dateTimePattern.Symbol = (dateTimePattern.Symbol) ? dateTimePattern.Symbol.text : "";

                dateTimePattern.DisplayName = dateTimePatternsNodes[i].selectSingleNode("DisplayName");
                dateTimePattern.DisplayName = (dateTimePattern.DisplayName) ? dateTimePattern.DisplayName.text : "";

                dateTimePattern.Value = dateTimePatternsNodes[i].selectSingleNode("Value");
                dateTimePattern.Value = (dateTimePattern.Value) ? dateTimePattern.Value.text : "";

                dateTimePatterns[i] = dateTimePattern;
            }
            cultureObject.DateTimePatterns = dateTimePatterns;

            cultureObject.DateTimeSettings = {};

            cultureObject.DateTimeSettings.AMDesignator = cultureNode.selectSingleNode("DateTimeSettings/AMDesignator");
            cultureObject.DateTimeSettings.AMDesignator = (cultureObject.DateTimeSettings.AMDesignator) ? cultureObject.DateTimeSettings.AMDesignator.text : "";

            cultureObject.DateTimeSettings.PMDesignator = cultureNode.selectSingleNode("DateTimeSettings/PMDesignator");
            cultureObject.DateTimeSettings.PMDesignator = (cultureObject.DateTimeSettings.PMDesignator) ? cultureObject.DateTimeSettings.PMDesignator.text : "";

            cultureObject.DateTimeSettings.FirstDayOfWeek = cultureNode.selectSingleNode("DateTimeSettings/FirstDayOfWeek");
            cultureObject.DateTimeSettings.FirstDayOfWeek = (cultureObject.DateTimeSettings.FirstDayOfWeek) ? cultureObject.DateTimeSettings.FirstDayOfWeek.text : "";

            cultureObject.DateTimeSettings.Today = cultureNode.selectSingleNode("DateTimeSettings/Today");
            cultureObject.DateTimeSettings.Today = (cultureObject.DateTimeSettings.Today) ? cultureObject.DateTimeSettings.Today.text : "";

            cultureObject.DateTimeSettings.Tomorrow = cultureNode.selectSingleNode("DateTimeSettings/Tomorrow");
            cultureObject.DateTimeSettings.Tomorrow = (cultureObject.DateTimeSettings.Tomorrow) ? cultureObject.DateTimeSettings.Tomorrow.text : "";

            cultureObject.DateTimeSettings.Yesterday = cultureNode.selectSingleNode("DateTimeSettings/Yesterday");
            cultureObject.DateTimeSettings.Yesterday = (cultureObject.DateTimeSettings.Yesterday) ? cultureObject.DateTimeSettings.Yesterday.text : "";

            cultureObject.DateTimeSettings.NextWeek = cultureNode.selectSingleNode("DateTimeSettings/NextWeek");
            cultureObject.DateTimeSettings.NextWeek = (cultureObject.DateTimeSettings.NextWeek) ? cultureObject.DateTimeSettings.NextWeek.text : "";

            cultureObject.DateTimeSettings.LastWeek = cultureNode.selectSingleNode("DateTimeSettings/LastWeek");
            cultureObject.DateTimeSettings.LastWeek = (cultureObject.DateTimeSettings.LastWeek) ? cultureObject.DateTimeSettings.LastWeek.text : "";

            cultureObject.DateTimeSettings.FriendlyDateTimeFormatString = cultureNode.selectSingleNode("DateTimeSettings/FriendlyDateTimeFormatString");
            cultureObject.DateTimeSettings.FriendlyDateTimeFormatString = (cultureObject.DateTimeSettings.FriendlyDateTimeFormatString) ? cultureObject.DateTimeSettings.FriendlyDateTimeFormatString.text : "";

            cultureObject.DateTimeSettings.FriendlyDateTimeNextLastWeekFormatString = cultureNode.selectSingleNode("DateTimeSettings/FriendlyDateTimeNextLastWeekFormatString");
            cultureObject.DateTimeSettings.FriendlyDateTimeNextLastWeekFormatString = (cultureObject.DateTimeSettings.FriendlyDateTimeNextLastWeekFormatString) ? cultureObject.DateTimeSettings.FriendlyDateTimeNextLastWeekFormatString.text : "";

            var shortDayNamesNodes = cultureNode.selectNodes("DateTimeSettings/ShortDayNames/ShortDayName");
            var shortDayNames = [];
            for (var i = 0; i < shortDayNamesNodes.length; i++)
            {
                shortDayNames[i] = shortDayNamesNodes[i].text;
            }
            cultureObject.DateTimeSettings.ShortDayNames = shortDayNames;

            var shortestDayNamesNodes = cultureNode.selectNodes("DateTimeSettings/ShortestDayNames/ShortestDayName");
            var shortestDayNames = [];
            for (var i = 0; i < shortestDayNamesNodes.length; i++)
            {
                shortestDayNames[i] = shortestDayNamesNodes[i].text;
            }
            cultureObject.DateTimeSettings.ShortestDayNames = shortestDayNames;

            var dayNamesNodes = cultureNode.selectNodes("DateTimeSettings/DayNames/DayName");
            var dayNames = [];
            for (var i = 0; i < dayNamesNodes.length; i++)
            {
                dayNames[i] = dayNamesNodes[i].text;
            }
            cultureObject.DateTimeSettings.DayNames = dayNames;

            var shortMonthNamesNodes = cultureNode.selectNodes("DateTimeSettings/ShortMonthNames/ShortMonthName");
            var shortMonthNames = [];
            for (var i = 0; i < shortMonthNamesNodes.length; i++)
            {
                shortMonthNames[i] = shortMonthNamesNodes[i].text;
            }
            cultureObject.DateTimeSettings.ShortMonthNames = shortMonthNames;


            var monthNamesNodes = cultureNode.selectNodes("DateTimeSettings/MonthNames/MonthName");
            var monthNames = [];
            for (var i = 0; i < monthNamesNodes.length; i++)
            {
                monthNames[i] = monthNamesNodes[i].text;
            }
            cultureObject.DateTimeSettings.MonthNames = monthNames;

            if (checkExists(cultureNode.selectNodes("DateTimeSettings/ShortTimeUnitNames")[0]))
            {
                var shortTimeUnitNamesNodes = cultureNode.selectNodes("DateTimeSettings/ShortTimeUnitNames")[0].childNodes;
                var shortTimeUnitNames = [];
                for (var i = 0; i < shortTimeUnitNamesNodes.length; i++)
                {
                    var shortTimeUnitName = {};

                    shortTimeUnitName.Name = shortTimeUnitNamesNodes[i].tagName;
                    shortTimeUnitName.Text = shortTimeUnitNamesNodes[i].text;

                    shortTimeUnitNames[i] = shortTimeUnitName
                }
                cultureObject.DateTimeSettings.ShortTimeUnitNames = shortTimeUnitNames;
            }

            if (checkExists(cultureNode.selectNodes("DateTimeSettings/MediumTimeUnitNames")[0]))
            {
                var mediumTimeUnitNamesNodes = cultureNode.selectNodes("DateTimeSettings/MediumTimeUnitNames")[0].childNodes;
                var mediumTimeUnitNames = [];
                for (var i = 0; i < mediumTimeUnitNamesNodes.length; i++)
                {
                    var mediumTimeUnitName = {};

                    mediumTimeUnitName.Name = mediumTimeUnitNamesNodes[i].tagName;
                    mediumTimeUnitName.Text = mediumTimeUnitNamesNodes[i].text;

                    mediumTimeUnitNames[i] = mediumTimeUnitName;
                }
                cultureObject.DateTimeSettings.MediumTimeUnitNames = mediumTimeUnitNames;
            }

            if (checkExists(cultureNode.selectNodes("DateTimeSettings/LongTimeUnitNames")[0]))
            {
                var longTimeUnitNamesNodes = cultureNode.selectNodes("DateTimeSettings/LongTimeUnitNames")[0].childNodes;
                var longTimeUnitNames = [];
                for (var i = 0; i < longTimeUnitNamesNodes.length; i++)
                {
                    var longTimeUnitName = {};

                    longTimeUnitName.Name = longTimeUnitNamesNodes[i].tagName;
                    longTimeUnitName.Text = longTimeUnitNamesNodes[i].text;

                    longTimeUnitNames[i] = longTimeUnitName;
                }
                cultureObject.DateTimeSettings.LongTimeUnitNames = longTimeUnitNames;
            }

            cultureObject.CalendarType = cultureNode.selectSingleNode("CalendarType");
            cultureObject.CalendarType = (cultureObject.CalendarType) ? cultureObject.CalendarType.text : "";

            //cache
            this.cultureObject = cultureObject;

            return cultureObject;
        },

        replaceListCultureNodeWithDetailedCultureNode: function (cultureName, detailXml)
        {
            if (!checkExists(this.cultureXml))
                this.cultureXml = parseXML("<Cultures></Cultures>");

            var currentCultureSub = this.cultureXml.selectSingleNode("Cultures/Culture[Name='{0}']".format(cultureName));
            var detailNode = detailXml.selectSingleNode("Cultures/Culture[Name='{0}']".format(cultureName));
            if (checkExists(currentCultureSub))
            {
                var parent = currentCultureSub.parentNode;
                parent.replaceChild(detailNode.cloneNode(true), currentCultureSub);
            }
            else
            {
                var cultures = this.cultureXml.selectSingleNode("Cultures");
                if (!checkExists(cultures))
                {
                    this.cultureXml = parseXML("<Cultures></Cultures>");
                    cultures = this.cultureXml.selectSingleNode("Cultures");
                }
                cultures.appendChild(detailNode.cloneNode(true));
            }
        },

        getDefaultFormatObject: function (dataType)
        {
            if (!checkExists(SCCultureHelper.defaultFormatObjects))
            {
                SCCultureHelper.defaultFormatObjects = {};
            }
            if (!checkExists(SCCultureHelper.defaultFormatObjects[dataType]))
            {
                var formatObject = {};
                formatObject.type = "date";
                formatObject.cultureObject = this.getCultureObject(this.currentCultureName, null);
                formatObject.cultureObject.type = "date";

                switch (dataType)
                {
                    case "date":
                        formatObject.pattern = formatObject.cultureObject.pattern = "yyyy-MM-dd";
                        break;
                    case "time":
                        formatObject.pattern = formatObject.cultureObject.pattern = "HH:mm:ss.FFF";
                        break;
                    case "datetime":
                        formatObject.pattern = formatObject.cultureObject.pattern = "yyyy-MM-dd HH:mm:ssZ";
                        break;
                }
                SCCultureHelper.defaultFormatObjects[dataType] = formatObject;
            }
            return SCCultureHelper.defaultFormatObjects[dataType];
        },

        getFormatObject: function (formatXmlString)
        {
            var formatObject = null;
            if (formatXmlString && formatXmlString !== "")
            {

                formatObject = {};
                var formatNode = this._formatObjectNodeCache[formatXmlString];
                if (!checkExists(formatNode))
                {
                    var formatXml = parseXML(formatXmlString);
                    formatNode = formatXml.selectSingleNode("Format");
                    this._formatObjectNodeCache[formatXmlString] = formatNode;
                }
                var cultureName = formatNode.getAttribute("Culture");
                var type = formatNode.getAttribute("Type");
                var currencySymbol = formatNode.getAttribute("CurrencySymbol");
                var negativePattern = formatNode.getAttribute("NegativePattern");
                var timeZone = formatNode.getAttribute("TimeZone");

                var pattern = formatNode.text;
                formatObject.type = type;
                formatObject.pattern = pattern;
                formatObject.timeZone = timeZone;

                if (!cultureName || cultureName === "")
                    cultureName = this.currentCultureName;

                var cultureObject = this.getCultureObject(cultureName, null);
                var co = jQuery.extend({}, cultureObject); //ensure a new object
                if (currencySymbol !== "")
                    co.OverrideCurrencySymbol = currencySymbol;
                if (negativePattern !== "")
                    co.OverrideNegativePattern = negativePattern;
                //extra details
                co.type = type;
                co.pattern = pattern;


                formatObject.cultureObject = co;
            }
            return formatObject;
        },

        testForDateFormat: function (formatObject)
        {
            if (checkExists(formatObject) && typeof formatObject !== "object")
            {
                formatObject = this.getFormatObject(formatObject);
            }
            var returnResult = false;
            if (checkExists(formatObject))
            {
                var pattern = formatObject.pattern;
                var type = formatObject.type;

                //if the type is a date
                if (type === "Date")
                {
                    returnResult = true;
                }
                //if the type is custom empty or doesn't exit but the pattern does and is not empty
                else if ((type === "Custom" || !checkExistsNotEmpty(type)) && checkExistsNotEmpty(pattern))
                {
                    //if the pattern looks like a date pattern or it does not match the number patterns
                    if (this.customDateRegex.test(pattern) || (!this.numberRegex.test(pattern) && !this.customNumberRegex.test(pattern)))
                    {
                        returnResult = true;
                    }
                }
            }
            return returnResult;
        },

        applyFormatToValueAndStyleXml: function (formatXmlString, stylesXml, value)
        {
            var result = value;
            //to prevent issues when user data causes this to go side ways
            try
            {
                var formatObject = this.getFormatObject(formatXmlString);
                if (formatObject && value && value !== "")
                {
                    var formatOptions =
                    {
                        formatObject: formatObject,
                        value: value
                    }
                    result = this.applyFormatToString(formatOptions);

                    if (checkExists(formatOptions.negativePattern) && formatOptions.negativePattern.contains("[Red]"))
                    {
                        if (checkExists(result))
                        {
                            if (result.contains("[Red]"))
                            {
                                result = result.replace(/\[Red\]/, "");
                                if (!checkExists(stylesXml))
                                {
                                    stylesXml = parseXML("<Style IsDefault='True'><Font></Font></Style>");
                                }
                                var styleNode = stylesXml.selectSingleNode("Style");
                                if (!styleNode)
                                {
                                    //create style
                                    styleNode = stylesXml.createElement("Style");
                                    styleNode.setAttribute("IsDefault", "True");
                                    stylesXml.root.appendChild(styleNode);
                                }
                                var fontNode = styleNode.selectSingleNode("Font");
                                if (!fontNode)
                                {
                                    //create font
                                    fontNode = stylesXml.createElement("Font");
                                    styleNode.appendChild(fontNode);
                                }
                                var colorNode = fontNode.selectSingleNode("Color");
                                if (colorNode)
                                {
                                    if (colorNode.firstChild)
                                        colorNode.removeChild(colorNode.firstChild);
                                }
                                else
                                {
                                    colorNode = stylesXml.createElement("Color");
                                    fontNode.appendChild(colorNode);

                                }
                                colorNode.appendChild(stylesXml.createTextNode("red"));
                            }
                            else
                            {
                                //remove the style if it existed
                                if (checkExists(stylesXml))
                                {
                                    var fontNode = stylesXml.selectSingleNode("Style/Font[Color='red']");
                                    if (checkExists(fontNode))
                                    {
                                        var colorNode = fontNode.selectSingleNode("Color");
                                        if (checkExists(colorNode))
                                        {
                                            fontNode.removeChild(colorNode);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (err)
            {
                //dont do anything just display the orginal value
                if (typeof console !== "undefined" && typeof console.log !== "undefined" && console && console.log)
                {
                    console.log("Format not applied");
                    console.log("format: " + formatXmlString);
                    console.log("value: " + value);
                }
            }
            return result;
        },

        applyFormatToControlValue: function (styleOptions)
        {
            var result = styleOptions.value;
            //to prevent issues when user data causes this to go side ways
            try
            {
                if (!checkExists(styleOptions.formatObject))
                {
                    styleOptions.formatObject = this.getFormatObject(styleOptions.formatXmlString);
                }
                if (checkExists(styleOptions.formatObject))
                {
                    result = this.applyFormatToString(styleOptions);

                    if (checkExists(styleOptions.negativePattern) && styleOptions.negativePattern.contains("[Red]"))
                    {
                        var nativeElementToStyle = null;
                        if (checkExists(styleOptions.elementToStyle))
                        {
                            if (!checkExists(styleOptions.elementToStyle.length))
                            {
                                styleOptions.elementToStyle = jQuery(styleOptions.elementToStyle);
                            }
                            if (styleOptions.elementToStyle.length > 0)
                            {
                                nativeElementToStyle = styleOptions.elementToStyle[0];
                            }
                        }
                        if (checkExists(result) && checkExists(nativeElementToStyle))
                        {
                            if (result.contains("[Red]"))
                            {
                                result = result.replace(/\[Red\]/, "");
                                if (styleOptions.elementToStyle)
                                {
                                    if (checkExists(nativeElementToStyle.style))
                                    {
                                        nativeElementToStyle.style.color = "red";
                                    }
                                }
                            }
                            else
                            {
                                if (styleOptions.elementToStyle)
                                {
                                    if (checkExists(nativeElementToStyle.style) && checkExists(nativeElementToStyle.style.color))
                                    {
                                        if (nativeElementToStyle.style.color = "red")
                                        {
                                            nativeElementToStyle.style.color = "";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (err)
            {
                //dont do anything just display the orginal value
                if (typeof console !== "undefined" && typeof console.log !== "undefined" && console && console.log)
                {
                    console.log("Format not applied");
                    console.log("styleOptions: " + styleOptions);
                    console.log("result: " + result);
                }
            }
            return result;
        },

        applyFormatToSmartObjectValue: function (cultureName, fieldType, fieldPattern, fieldValue, DoNotHandleInvariantPointAsGroupSeparator)
        {
            var result = fieldValue;
            var formatOptions = null;
            if (cultureName == null && fieldType == null)
            {
                var formatObject = this.getFormatObject(fieldPattern);
                if (formatObject && fieldValue && fieldValue !== "")
                {
                    var editableOptions =
                    {
                        formatObject: formatOject,
                        value: fieldValue,
                        doSimpleReplace: true
                    }
                    var editableText = SCCultureHelper.current.getEditableValue(editableOptions);

                    formatOptions =
                        {
                            formatObject: formatObject,
                            value: editableText,
                            valueIsEditableValue: getEditableValue,
                            DoNotHandleInvariantPointAsGroupSeparator: DoNotHandleInvariantPointAsGroupSeparator
                        }
                    result = this.applyFormatToString(formatOptions);
                }
            }
            else
            {
                var cultureObject = this.getCultureObject(cultureName, null);
                if (cultureObject !== null)
                {
                    var format = SCCultureHelper._getFormatForSmartObjectField(fieldType);
                    if (fieldPattern && fieldPattern !== "")
                        format.pattern = fieldPattern;
                    formatOptions =
                        {
                            formatObject:
                            {
                                pattern: format.pattern,
                                type: format.type,
                                cultureObject: cultureObject
                            },
                            value: fieldValue,
                            DoNotHandleInvariantPointAsGroupSeparator: DoNotHandleInvariantPointAsGroupSeparator
                        }
                    result = this.applyFormatToString(formatOptions);
                }
            }

            if (checkExists(formatOptions) && checkExists(formatOptions.negativePattern) && formatOptions.negativePattern.contains("[Red]"))
            {
                if (checkExists(result))
                {
                    if (result.contains("[Red]"))
                    {
                        result = result.replace(/\[Red\]/, "");
                        result = "<span style='color:red;'>{0}</span>".format(result);
                    }
                }
            }

            return result;
        },

        getUnformattedNumber: function (cultureObject, detailsObject, value, DoNotHandleInvariantPointAsGroupSeparator)
        {
            if (typeof value !== "string")
            {
                value = value.toString();
            }
            value = value.replace(/\s/g, "");
            value = this.replaceCultureValue(value, cultureObject.PercentSymbol, "");
            value = this.replaceCultureValue(value, cultureObject.CurrencySymbol, "");
            var performGroupSeparatorReplace = true;
            if (checkExists(DoNotHandleInvariantPointAsGroupSeparator))
                performGroupSeparatorReplace = !(DoNotHandleInvariantPointAsGroupSeparator && detailsObject.GroupSeparator == "." && detailsObject.DecimalSeparator == "," && value.contains(".") && !value.contains(","));

            if (performGroupSeparatorReplace)
                value = this.replaceCultureValue(value, detailsObject.GroupSeparator, "");
            if (detailsObject.DecimalSeparator !== ".")
                value = this.replaceCultureValue(value, detailsObject.DecimalSeparator, ".");
            if (cultureObject.NegativeSign !== "-")
                value = this.replaceCultureValue(value, cultureObject.NegativeSign, "-");
            value = this.replaceCultureValue(value, cultureObject.PositiveSign, "");
            value = value.replace(new RegExp("(|)", "g"), "");
            value = value.replace(new RegExp("&nbsp;", "g"), "");
            if (value.indexOf("e") < 0)
                value = value.trimZeros();
            return value;
        },

        replaceCultureValue: function (stringValue, valueToReplace, newValue)
        {
            var regexChars = ["^", "$", ".", "|", "?", "*", "+", "(", ")", "{", "}"];
            for (var i = 0; i < valueToReplace.length; i++)
            {
                for (var j = 0; j < regexChars.length; j++)
                {
                    if (valueToReplace.charAt(i) === regexChars[j])
                    {
                        valueToReplace = valueToReplace.substr(0, i) + "\\" + valueToReplace.substr(i);
                        i++;
                        break;
                    }
                }
            }
            return stringValue.replace(new RegExp(valueToReplace, "g"), newValue);
        },

        //returns the value that can be edited (with the correct decimal)
        getEditableValue: function (formatOptions)
        {
            if (!formatOptions.formatObject)
            {
                formatOptions.formatObject = this.getFormatObject(formatOptions.formatXmlString);
            }
            if (!$chk(formatOptions) || !$chk(formatOptions.formatObject) || !$chk(formatOptions.value))
            {
                if ($chk(formatOptions.value))
                    return formatOptions.value;
            }
            if (formatOptions.value === "")
                return formatOptions.value;

            var pattern = formatOptions.formatObject.pattern;
            var type = formatOptions.formatObject.type;
            var co = formatOptions.formatObject.cultureObject;

            //handle standard formats
            var result = formatOptions.value;
            var originalValue = formatOptions.value;
            if (result === null || result === "")
            {
                return result;
            }

            if (this.numberRegex.test(pattern) && type !== "Date")
            {
                var decimalPlaces = null;
                var firstChar = pattern.charAt(0).toUpperCase();
                var detailsObject = null;

                //check for backward compatibily override or controls override
                var doSimpleReplace = SourceCode.Forms.Settings.Formatting.UnformattedEditState || formatOptions.doSimpleReplace;

                switch (firstChar)
                {
                    case "F"://Fixed-point
                    case "E"://Scientific
                        detailsObject = co.NumberDetails;
                        //keep fixed-point (no thousands separator) and scientific previous behaviour of an unformatted number)
                        doSimpleReplace = true;
                        break;
                    case "N"://Number
                        detailsObject = co.NumberDetails;
                        break;
                    case "C"://Currency
                        detailsObject = co.CurrencyDetails;
                        break
                    case "P"://Percent
                        detailsObject = co.PercentDetails;
                        break
                }
                if (doSimpleReplace === true)
                {
                    if ("." !== detailsObject.DecimalSeparator)
                    {
                        if (formatOptions.value.contains(detailsObject.DecimalSeparator))
                        {
                            //if the number contains the culture separators then assume the cultureDecimal is correct and remove the invariant if it exists
                            result = this.replaceCultureValue(formatOptions.value, ".", "");
                        }
                        else
                        {
                            //otherwise replace the invariant with a culture specific value
                            result = this.replaceCultureValue(formatOptions.value, ".", detailsObject.DecimalSeparator);
                        }

                    }
                    else
                    {
                        // if the decimalseparator is invariant the value is used as is
                        result = formatOptions.value;
                    }
                }
                else
                {
                    var oldValue = formatOptions.value;
                    if (firstChar === "P")
                    {
                        formatOptions.value = this.replaceCultureValue(formatOptions.value, ".", detailsObject.DecimalSeparator);
                        result = this._formatPercentage(formatOptions, co, -1, false);
                    }
                    else
                    {
                        formatOptions.value = this.replaceCultureValue(formatOptions.value, detailsObject.DecimalSeparator, ".");
                        result = this._formatNumber(formatOptions, co, detailsObject, true, -1, false, false);
                    }
                    formatOptions.value = oldValue;
                }
            }
            else if ((this.customDateRegex.test(pattern) || type === "Date") && !formatOptions.ignoreDates)
            {
                //Return formatted value

                //THIS CODE MUST SYNC WITH (***1***)

                //find the date pattern from the symbol (F=full d=short D=Long t=short time T=Long time) from the culture
                var foundIndex = -1;
                for (var i = 0; i < co.DateTimePatterns.length && (foundIndex < 0); i++)
                {
                    foundIndex = (co.DateTimePatterns[i].Symbol === pattern) ? i : -1;
                }
                if (foundIndex >= 0)
                {
                    pattern = co.DateTimePatterns[foundIndex].Value
                }
                //convert the string to a UTC date
                var dateValue = this._convertDateStringToObj(formatOptions);
                if (dateValue == null)
                {
                    formatOptions.value = originalValue;
                    result = originalValue;
                    if (typeof formatOptions.formattingError !== "undefined")
                        formatOptions.formattingError = true;
                    return result;
                }
                else
                {
                    formatOptions.value = this._convertDateObjToString(dateValue);
                    result = this._formatDate(dateValue, formatOptions.value, co, pattern, formatOptions.formatObject);
                }
            }
            else if (this.customNumberRegex.test(pattern))
            {
                result = this.replaceCultureValue(formatOptions.value, ".", co.NumberDetails.DecimalSeparator);
            }
            else if (pattern !== "" && !formatOptions.ignoreDates)
            {
                //Return formatted value

                //THIS CODE MUST SYNC WITH (***2***)

                //try date
                //convert the string to a UTC date
                var dateValue = this._convertDateStringToObj(formatOptions);
                if (dateValue == null)
                {
                    formatOptions.value = originalValue;
                    result = originalValue;
                    if (typeof formatOptions.formattingError !== "undefined")
                        formatOptions.formattingError = true;
                    return result;
                }
                else
                {
                    formatOptions.value = this._convertDateObjToString(dateValue);
                    result = this._formatDate(dateValue, formatOptions.value, co, pattern, formatOptions.formatObject);
                }
            }

            return result;
        },

        getFormatPatternByName: function (formatOptions)
        {
            var co = formatOptions.formatObject.cultureObject;
            var configuredPattern = formatOptions.formatObject.pattern;
            var patterns = co.SpecialDetails.Patterns;
            var patternsLength = patterns.length;
            var value;

            for (var p = 0; p < patternsLength; p++)
            {
                var pattern = patterns[p];
                var patternName = pattern.Name;

                if (patternName === configuredPattern)
                {
                    value = pattern.Value;
                    break;
                }
            }

            return value;
        },

        applyFormatToString: function (formatOptions)//cultureObject, pattern, type, value)
        {
            if (!$chk(formatOptions) || !$chk(formatOptions.formatObject) || !$chk(formatOptions.value))
            {
                if ($chk(formatOptions.value))
                    return formatOptions.value;
            }
            if (formatOptions.value === "")
                return formatOptions.value;

            var pattern = formatOptions.formatObject.pattern;
            var type = formatOptions.formatObject.type;
            var co = formatOptions.formatObject.cultureObject;

            //handle standard formats
            var result = formatOptions.value;
            var originalValue = formatOptions.value;

            if (result === null)
            {
                if (typeof formatOptions.formattingError !== "undefined")
                {
                    formatOptions.formattingError = true
                    return result;
                }
            }
            else if (result = "")
            {
                return result;
            }

            if (type === "Special" && checkExistsNotEmpty(originalValue) && checkExistsNotEmpty(pattern))
            {
                // Hack to get correct value as controls do not currently support the way the special formatting has been implemented
                if (checkExistsNotEmpty(formatOptions.formatXmlString))
                {
                    var formatContainsCulture = formatOptions.formatXmlString.contains("Culture");
                    if (!formatContainsCulture)
                    {
                        pattern = this.getFormatPatternByName(formatOptions);
                    }
                }

                if (checkExistsNotEmpty(pattern))
                {
                    result = this.formatNumberPattern(originalValue, pattern);
                }
                else
                {
                    result = originalValue;
                }
            }
            else
            {
                if (this.numberRegex.test(pattern) && type !== "Date")
                {
                    var decimalPlaces = null;
                    if (pattern.length > 1)
                    {
                        decimalPlaces = pattern.replace(pattern.charAt(0), "");
                    }
                    var firstChar = pattern.charAt(0).toUpperCase();
                    switch (firstChar)
                    {
                        case "F"://Fixed-point
                            formatOptions.value = this.getUnformattedNumber(co, co.NumberDetails, formatOptions.value, formatOptions.DoNotHandleInvariantPointAsGroupSeparator);
                            result = this._formatNumber(formatOptions, co, co.NumberDetails, false, decimalPlaces);
                            break;
                        case "N"://Number
                            formatOptions.value = this.getUnformattedNumber(co, co.NumberDetails, formatOptions.value, formatOptions.DoNotHandleInvariantPointAsGroupSeparator);
                            result = this._formatNumber(formatOptions, co, co.NumberDetails, true, decimalPlaces);
                            break;
                        case "E"://Scientific
                            formatOptions.value = this.getUnformattedNumber(co, co.NumberDetails, formatOptions.value, formatOptions.DoNotHandleInvariantPointAsGroupSeparator);
                            if (formatOptions.value === "")
                            {
                                formatOptions.value = originalValue;
                                result = originalValue;
                                if (typeof formatOptions.formattingError !== "undefined")
                                    formatOptions.formattingError = true;
                                return result;
                            }
                            //find orginal exponent formatOptions.value
                            var orgininalExponent = 0;
                            var scientificValue = formatOptions.value;
                            var scientificParts = scientificValue.toLowerCase().split("e");
                            if (scientificParts.length > 1)
                            {
                                var scientificPart = scientificParts[1];
                                if (scientificPart === "")
                                {
                                    //if its cleared it was removed by the trimZeros function or was left out
                                    //either way we handle this as 0
                                    orgininalExponent = 0;
                                    //remove the e
                                    formatOptions.value = formatOptions.value.substr(0, formatOptions.value.length - 1);
                                }
                                else
                                {
                                    orgininalExponent = scientificPart.toInt();
                                    if (orgininalExponent === NaN || !scientificPart.isNumeric())
                                    {
                                        formatOptions.value = originalValue;
                                        result = originalValue;
                                        if (typeof formatOptions.formattingError !== "undefined")
                                            formatOptions.formattingError = true;
                                        return result;
                                    }
                                }
                            }
                            scientificValue = scientificParts[0]
                            var isNegative = scientificValue.indexOf("-") >= 0;
                            if (isNegative)
                                scientificValue = scientificValue.replace(/-/, "");

                            //calculate exponent from non scientific number
                            var parts = scientificValue.split(".");
                            var exponentValue = "";
                            var wholePortion = "";
                            var rationalPortion = "";
                            if (parts.length === 1)
                            {
                                //was a whole number 1234
                                wholePortion = parts[0].substr(0, 1);
                                rationalPortion = parts[0].substr(1);
                                exponentValue = rationalPortion.length;
                            }
                            else if (parts.length === 2)
                            {
                                //was rational 123.45
                                if (parts[0] !== "0")
                                {
                                    // 123.45
                                    wholePortion = parts[0].substr(0, 1);
                                    rationalPortion = parts[0].substr(1) + parts[1];
                                    exponentValue = rationalPortion.length - parts[1].length;
                                }
                                else
                                {
                                    // 0.00012345
                                    rationalPortion = parts[1];
                                    var firstCharacter = rationalPortion.substr(0, 1);
                                    rationalPortion = rationalPortion.substr(1);
                                    exponentValue--;
                                    while (firstCharacter === "0")
                                    {
                                        firstCharacter = rationalPortion.substr(0, 1);
                                        rationalPortion = rationalPortion.substr(1);
                                        exponentValue--;
                                    }
                                    wholePortion = firstCharacter;
                                }
                            }
                            else
                            {
                                formatOptions.value = originalValue;
                                result = originalValue;
                                if (typeof formatOptions.formattingError !== "undefined")
                                    formatOptions.formattingError = true;
                                return result;
                            }
                            //use the orginal formatOptions.value and divide by exponent exponent
                            scientificValue = wholePortion + "." + rationalPortion;
                            if (isNegative)
                                scientificValue = "-" + scientificValue;
                            result = this._formatNumber(formatOptions, co, co.NumberDetails, true, decimalPlaces, scientificValue);
                            var resultingExponent = (orgininalExponent + exponentValue.toInt());
                            if (resultingExponent !== 0)
                                result += "E" + resultingExponent;
                            break;
                        case "C"://Currency
                            formatOptions.value = this.getUnformattedNumber(co, co.CurrencyDetails, formatOptions.value, formatOptions.DoNotHandleInvariantPointAsGroupSeparator);
                            result = this._formatNumber(formatOptions, co, co.CurrencyDetails, true, decimalPlaces);
                            break;
                        case "P"://Percent
                            result = this._formatPercentage(formatOptions, co, decimalPlaces);
                            break;
                    }

                }
                else if (this.customDateRegex.test(pattern) || type === "Date")
                {
                    //convert the string to a UTC date
                    var dateValue = this._convertDateStringToObj(formatOptions);
                    if (dateValue == null)
                    {
                        formatOptions.value = originalValue;
                        result = originalValue;
                        if (typeof formatOptions.formattingError !== "undefined")
                            formatOptions.formattingError = true;
                        return result;
                    }
                    else
                    {
                        //find the date pattern from the symbol (F=full d=short D=Long t=short time T=Long time) from the culture
                        //THIS CODE MUST SYNC WITH (***1***)
                        for (var i = 0; i < co.DateTimePatterns.length; i++)
                        {
                            if (co.DateTimePatterns[i].Symbol === pattern)
                            {
                                pattern = co.DateTimePatterns[i].Value;
                                break;
                            }
                        }

                        formatOptions.value = this._convertDateObjToString(dateValue);
                        result = this._formatDate(dateValue, formatOptions.value, co, pattern, formatOptions.formatObject);
                    }
                }
                else if (this.customNumberRegex.test(pattern))
                {
                    //pattern = xslt transformation
                    //#region
                    formatOptions.value = this.getUnformattedNumber(co, co.NumberDetails, formatOptions.value);

                    var emptyXmlDoc = $xml("<xml/>");
                    xslFormatter = new XslTransform();
                    xslFormatter.importStylesheet(this.formatXsltPath);

                    xslFormatter.addParameter("value", formatOptions.value);
                    xslFormatter.addParameter("format", pattern);
                    xslFormatter.addParameter("type", type);
                    result = xslFormatter.transformToText(emptyXmlDoc, null);
                    result = parseXML(result).selectSingleNode("Result").text;
                    if (result === "NaN")
                    {
                        formatOptions.value = originalValue;
                        result = originalValue;
                        if (typeof formatOptions.formattingError !== "undefined")
                            formatOptions.formattingError = true;
                        return result;
                    }
                    //#endregion
                }
                else if (type === "Duration")
                {
                    var format = pattern.split(':')[0];
                    var convert = pattern.split(':')[1];

                    if (format === "" || convert === "")
                    {
                        return result;
                    }

                    if (!originalValue.toInt())
                    {
                        result = originalValue;
                    }
                    else
                    {
                        var milliseconds = originalValue.toInt();

                        //All duration formatting is done from a millisecond value so convert to millisenconds here
                        switch (convert.toLowerCase())
                        {
                            case "seconds":
                                milliseconds = milliseconds * 1000;
                                break;
                            case "minutes":
                                milliseconds = milliseconds * 60000;
                                break;
                            case "hours":
                                milliseconds = milliseconds * 3600000;
                                break;
                        }

                        result = new SourceCode.Forms.Duration(milliseconds).toString(format, co);
                    }
                }
                else if (pattern !== "")
                {
                    //THIS CODE MUST SYNC WITH (***2***)
                    //try date
                    //convert the string to a UTC date
                    var dateValue = this._convertDateStringToObj(formatOptions);
                    if (dateValue === null)
                    {
                        formatOptions.value = originalValue;
                        result = formatOptions.value;
                        if (typeof formatOptions.formattingError !== "undefined")
                            formatOptions.formattingError = true;
                        return result;
                    }
                    else
                    {
                        formatOptions.value = this._convertDateObjToString(dateValue);
                        result = this._formatDate(dateValue, formatOptions.value, co, pattern, formatOptions.formatObject);
                    }
                }
            }

            if (typeof formatOptions.formattingError !== "undefined" && formatOptions.formattingError === true)
            {
                formatOptions.value = originalValue;
                result = originalValue;
            }

            return result;
        },

        formatNumberPattern: function (originalValue, pattern)
        {
            var valueCharArray = [];
            var patternArray = [];
            var tmpResult = [];

            valueCharArray = originalValue.split("").reverse();
            patternCharArray = pattern.split("").reverse();

            while (patternCharArray.length > 0)
            {
                var patternChar = patternCharArray[0];
                var tmpChar;

                if (patternChar === "#" || patternChar === "0")
                {
                    // set replaced value
                    while (valueCharArray.length > 0)
                    {
                        tmpChar = valueCharArray[0];

                        if (isNaN(tmpChar) || tmpChar === " ")
                        {
                            tmpChar = "";
                            valueCharArray.shift();
                            continue;
                        }
                        else
                        {
                            break;
                        }
                    }

                    if (!checkExistsNotEmpty(tmpChar) && patternChar === "0")
                    {
                        tmpChar = "0";
                    }

                    valueCharArray.shift();
                }
                else
                {
                    //set the actual value without replacement
                    tmpChar = patternChar;
                }

                patternCharArray.shift();
                tmpResult.push(tmpChar);

                //Clear tmpChar after it has been added to the array
                tmpChar = "";

                // if the pattern is empty but there are still values, reverse, join and add the values to the array
                if (valueCharArray.length > 0 && !patternCharArray.contains("#") && !patternCharArray.contains("0"))
                {
                    while (valueCharArray.length > 0)
                    {
                        tmpChar = valueCharArray[0];

                        if (isNaN(tmpChar) || tmpChar === " ")
                        {
                            tmpChar = "";
                            valueCharArray.shift();
                            continue;
                        }
                        else
                        {
                            valueCharArray.shift();
                            tmpResult.push(tmpChar);

                            //Clear tmpChar after it has been added to the array
                            tmpChar = "";
                        }
                    }

                    valueCharArray = [];
                }
            }

            return tmpResult.reverse().join("");
        },

        _convertDateObjToString: function (dateObject, localTime)
        {
            var result = null;
            var dataType = (dateObject._type) ? dateObject._type.toLowerCase() : "";
            switch (dataType)
            {
                case "time":
                case "date":
                    result = dateObject.toString();
                    break;
                default:
                    if (localTime === true)
                    {
                        result = this._convertDateObjToLocalString(dateObject);
                    }
                    else
                    {
                        result = this._convertDateObjToUTCString(dateObject);
                    }

                    break;
            }
            return result;
        },

        //returns null if its not or the date object if it is
        _checkDateIsZuluDate: function (dateString, calculateOffset, invertOffset)
        {
            if (!$chk(dateString))
                return null;
            if (dateString.length !== 20)
                return null;
            if (dateString.charAt(19) !== "Z")
                return null;

            var dateTimeParts = dateString.removeNBSpace().split(' ');
            if (dateTimeParts.length !== 2 || dateTimeParts[0].length !== 10 || dateTimeParts[1].length !== 9)
                return null;

            var typedDateParts = dateTimeParts[0].split('-');
            if (typedDateParts.length !== 3 || typedDateParts[0].length !== 4 || typedDateParts[1].length !== 2 || typedDateParts[2].length !== 2)
                return null;
            if (!typedDateParts[0].isNumeric() || !typedDateParts[1].isNumeric() || !typedDateParts[2].isNumeric())
                return null;
            var year = typedDateParts[0].toInt();
            var month = typedDateParts[1].toInt() - 1;
            var day = typedDateParts[2].toInt();;

            var typedTimeParts = dateTimeParts[1].substr(0, 8).split(':');
            if (typedTimeParts.length !== 3 || typedTimeParts[0].length !== 2 || typedTimeParts[1].length !== 2 || typedTimeParts[2].length !== 2)
                return null;
            if (!typedTimeParts[0].isNumeric() || !typedTimeParts[1].isNumeric() || !typedTimeParts[2].isNumeric())
                return null;
            var hour = typedTimeParts[0].toInt();
            var minute = typedTimeParts[1].toInt();
            var second = typedTimeParts[2].toInt();

            var dateObj = new Date();
            var utcTime = Date.UTC(year, month, day, hour, minute, second, 0);
            dateObj.setTime(utcTime);

            if (calculateOffset)
            {
                var offsetBefore = dateObj.getTimeZoneOffset();
                var offset = dateObj.getTimeZoneOffset() * 1000 * 60;
                dateObj.setTime(utcTime + offset);

                var offsetAfter = dateObj.getTimezoneOffset();
                if (offsetAfter !== offsetBefore)
                {
                    var isNegative = (Math.abs(offsetBefore) !== offsetBefore);
                    var difference = Math.abs(offsetAfter) - Math.abs(offsetBefore);
                    var differenceInSeconds = difference * 1000 * 60;
                    if (isNegative)
                        dateObj.setTime(utcTime + offset - differenceInSeconds);
                    if (!isNegative)
                        dateObj.setTime(utcTime + offset + differenceInSeconds);
                }
            }
            return dateObj;
        },

        _convertDateObjToUTCString: function (date)
        {
            var monthString = date.getUTCMonth() + 1;
            if (monthString < 10) monthString = "0" + monthString;
            var dayString = date.getUTCDate();
            if (dayString < 10) dayString = "0" + dayString;
            var hourString = date.getUTCHours();
            if (hourString < 10) hourString = "0" + hourString;

            var minuteString = date.getUTCMinutes();
            if (minuteString < 10) minuteString = "0" + minuteString;
            var secString = date.getUTCSeconds();
            if (secString < 10) secString = "0" + secString;

            var dateString = date.getUTCFullYear() + "-" + monthString + "-" + dayString + " " + hourString + ":" + minuteString + ":" + secString + "Z";

            return dateString;
        },

        _convertDateStringToObj: function (formatOptions)
        {
            var result = null;
            try
            {
                var dataType;
                if (!checkExists(formatOptions.dataType))
                {
                    //skip conversion if no data type was specified the object should remain the same type
                    if (formatOptions.value instanceof Date || formatOptions.value._type === "date" || formatOptions.value._type === "time" || formatOptions.value._type === "datetime")
                    {
                        return formatOptions.value;
                    }
                    dataType = "datetime";
                }
                else
                {
                    dataType = formatOptions.dataType.toLowerCase();
                }
                formatOptions.formatObject = (formatOptions.formatObject) ? formatOptions.formatObject : this.getDefaultFormatObject(dataType);

                switch (dataType)
                {
                    case "date":
                        result = SourceCode.Forms.Date.parse(formatOptions.value, formatOptions.formatObject);
                        break;
                    case "time":
                        result = SourceCode.Forms.Time.parse(formatOptions.value, formatOptions.formatObject)
                        break;
                    //we need a date time out
                    default:
                        if (formatOptions.value instanceof Date || formatOptions.value._type === "datetime")
                        {
                            result = formatOptions.value
                        }
                        else if (formatOptions.value._type === "date")
                        {
                            result = Date.fromSFDate(formatOptions.value);
                        }
                        else if (formatOptions.value._type === "time")
                        {
                            result = Date.fromSFTime(formatOptions.value);
                        }
                        else if (checkExists(formatOptions.formatObject) && checkExistsNotEmpty(formatOptions.formatObject.timeZone))
                        {
                            result = SourceCode.Forms.DateTime.parse(formatOptions.value, formatOptions.formatObject);
                        }
                        else
                        {
                            //support parsing time locally where the user only types the time and expects the current date plus that local time
                            var time = SourceCode.Forms.Time.parseImpl(formatOptions.value, formatOptions.formatObject, false);
                            if (checkExists(time))
                            {
                                result = Date.fromCurrentDateWithSFTime(time);
                            }

                            //normal date parsing 
                            if (result === null)
                            {
                                result = this._convertUTCDateToObj(formatOptions.value, formatOptions.formatObject.cultureObject.Name, formatOptions.formatObject);
                            }
                        }

                        break;
                }
            }
            catch (ex)
            {
                SFLog({ type: 5, source: "Formatting", category: "Events", message: ex, data: formatOptions });
            }
            return result;
        },

        _convertDateObjToLocalString: function (date)
        {
            if (typeof date.toLocalString === "function")
            {
                return date.toLocalString();
            }
            var monthString = date.getMonth() + 1;
            if (monthString < 10) monthString = "0" + monthString;
            var dayString = date.getDate();
            if (dayString < 10) dayString = "0" + dayString;
            var hourString = date.getHours();
            if (hourString < 10) hourString = "0" + hourString;

            var minuteString = date.getMinutes();
            if (minuteString < 10) minuteString = "0" + minuteString;
            var secString = date.getSeconds();
            if (secString < 10) secString = "0" + secString;

            var dateString = date.getFullYear() + "-" + monthString + "-" + dayString + "T" + hourString + ":" + minuteString + ":" + secString;

            return dateString;
        },

        //supports
        //Z
        //+-00:00
        //+-00 or +-0000 or +-00:00 at the end of the following
        ////yyyy-mm-dd hh
        ////yyyy-mm-dd hhmm
        ////yyyy-mm-dd hhmmss
        ////yyyy-mm-dd hh
        ////yyyy-mm-dd hh:mm
        ////yyyy-mm-dd hh:mm:ss
        ////yyyy-mm-dd hh:mm:ss.nnnnnnn
        ////yyyy-mm-ddThh
        ////yyyy-mm-ddThhmm
        ////yyyy-mm-ddThhmmss
        ////yyyy-mm-ddThh
        ////yyyy-mm-ddThh:mm
        ////yyyy-mm-ddThh:mm:ss
        ////yyyy-mm-ddThh:mm:ss.nnnnnnn
        _isISODateFormat: /([Z]$)|([+-]{1}\d{2}:\d{2})|\d{4}-\d{2}-\d{2}(T|\s){1}\d{2}(:?\d{2}){1,2}(\.\d{1,7})?\s?[+-]{1}(\d{2}:\d{2}$|\d{2}$|\d{4}$)/i,

        _convertUTCDateToObj: function (dateString, cultureName, formatObject)
        {
            //handles only normal JS native date parsing
            var dateObject = null;
            if (dateString instanceof Date || dateString._type === "date" || dateString._type === "time" || dateString._type === "datetime")
            {
                return dateString;
            }

            var dateObject = this._checkDateIsZuluDate(dateString)
            if (!$chk(dateObject))
            {
                this._isISODateFormat.lastIndex = 0; // Reset regex
                var calculateOffset = !this._isISODateFormat.test(dateString);

                dateObject = this._checkDateIsZuluDate(this.parseDateOnServer(dateString, cultureName, "u", true), calculateOffset);
            }

            return dateObject;
        },

        _getMonthNumber: function (cultureObject, monthName)
        {
            var length = cultureObject.DateTimeSettings.ShortMonthNames.length;
            var foundIndex = -1;
            for (var i = 0; i < length && foundIndex < 0; i++)
            {
                if (cultureObject.DateTimeSettings.ShortMonthNames.toLowerCase() == monthName.toLowerCase() ||
                    cultureObject.DateTimeSettings.MonthNames.toLowerCase() == monthName.toLowerCase())
                {
                    foundIndex = i;
                }
            }
        },

        getParticularFormatForDate: function (formatObject, pattern, date)
        {
            if (typeof formatXmlString === "string")
            {
                formatObject = this.getFormatObject(formatXmlString);
            }
            var foundIndex = -1;
            for (var i = 0; i < formatObject.cultureObject.DateTimePatterns.length && (foundIndex < 0); i++)
            {
                foundIndex = (formatObject.cultureObject.DateTimePatterns[i].Symbol === pattern) ? i : -1;
            }
            if (foundIndex >= 0)
            {
                pattern = formatObject.cultureObject.DateTimePatterns[foundIndex].Value
            }
            return this._formatDate(date, null, formatObject.cultureObject, pattern, formatObject);
        },

        getParticularFormat: function (formatXmlString, pattern, value)
        {
            var result = value;
            //to prevent issues when user data causes this to go side ways
            try
            {
                var formatObject = this.getFormatObject(formatXmlString);
                formatObject.pattern = pattern;
                if (formatObject && value && value !== "")
                {
                    var formatOptions =
                    {
                        formatObject: formatObject,
                        value: value
                    }
                    result = this.applyFormatToString(formatOptions);
                    if ($chk(result) && result.contains("[Red]"))
                    {
                        result = result.replace(/\[Red\]/, "");
                    }
                }
            }
            catch (err)
            {
                //dont do anything just display the orginal value
                if (typeof console !== "undefined" && typeof console.log !== "undefined" && console && console.log)
                {
                    console.log("Format not applied");
                    console.log("format: " + formatXmlString);
                    console.log("value: " + value);
                }
            }
            return result;
        },

        _formatPercentage: function (formatOptions, co, decimalPlaces, applyNegativeFormat)
        {
            if (!checkExists(applyNegativeFormat))
            {
                applyNegativeFormat = true;
            }
            //Percent
            originalFormatValue = formatOptions.value;
            formatOptions.value = this.getUnformattedNumber(co, co.PercentDetails, formatOptions.value, formatOptions.DoNotHandleInvariantPointAsGroupSeparator);

            if (formatOptions.value === "")
            {
                formatOptions.value = originalValue;
                result = originalValue;
                if (typeof formatOptions.formattingError !== "undefined")
                {
                    formatOptions.formattingError = true;
                }
                return result;
            }
            var testParts = formatOptions.value.split(".");
            if (testParts.length > 2) //343.343.34
            {
                formatOptions.value = originalValue;
                result = originalValue;
                if (typeof formatOptions.formattingError !== "undefined")
                {
                    formatOptions.formattingError = true;
                }
                return result;
            }
            var percentValue = null;
            var isNegative = formatOptions.value.indexOf("-") >= 0;

            if (typeof originalFormatValue !== "string")
            {
                originalFormatValue = originalFormatValue.toString();
            }

            if (originalFormatValue.contains(co.PercentSymbol) || (formatOptions.valueIsEditableValue === false && !SourceCode.Forms.Settings.Formatting.UnformattedEditState))
            {
                //treat as percentage
                //123%
                percentValue = formatOptions.value;
                if (isNegative)
                {
                    percentValue = percentValue.replace(/-/, "");
                }
                var parts = percentValue.split(".");

                //divide by 100

                while (parts[0].length < 3)
                {
                    //12 or //1 or //
                    parts[0] = "0" + parts[0];
                }
                formatOptions.value = parts[0].substr(0, parts[0].length - 2) + "." + parts[0].substr(parts[0].length - 2)
                if (parts.length > 1)
                {
                    formatOptions.value += parts[1];
                }
                formatOptions.value = ((isNegative) ? "-" : "") + formatOptions.value.trimZeros();
            }
            else
            {
                percentValue = formatOptions.value;
                if (isNegative)
                {
                    percentValue = percentValue.replace(/-/, "");
                }
                var parts = percentValue.split(".");

                percentValue = parts[0];

                if (parts.length === 1)
                {
                    //multiply by 100
                    percentValue += "00";
                }
                else if (parts.length === 2)
                {
                    percentValue = parts[0];
                    if (parts[1].length === 0)
                    {
                        percentValue += "00";
                    }
                    else if (parts[1].length === 1)
                    {
                        percentValue += parts[1] + "0";
                    }
                    else
                    {
                        var additionalWholeValue = parts[1].substr(0, 2);
                        var rationalValue = "";
                        if (parts[1].length > 2)
                        {
                            rationalValue = parts[1].substr(2);
                        }
                        percentValue += additionalWholeValue

                        if (rationalValue !== "")
                        {
                            percentValue += "." + rationalValue;
                        }
                    }
                }
                else
                {
                    formatOptions.value = originalValue;
                    result = originalValue;
                    if (typeof formatOptions.formattingError !== "undefined")
                    {
                        formatOptions.formattingError = true;
                    }
                    return result;
                }
            }
            percentValue = percentValue.trimZeros();
            if (isNegative)
            {
                percentValue = "-" + percentValue;
            }
            result = this._formatNumber(formatOptions, co, co.PercentDetails, true, decimalPlaces, percentValue, applyNegativeFormat);
            return result;
        },

        _formatNumber: function (formatOptions, cultureObject, detailsObject, useThousandsSeparator, decimalPlaces, overrideValue, applyNegativeFormat)
        {
            if (!checkExists(applyNegativeFormat))
            {
                applyNegativeFormat = true;
            }

            var value = ($chk(overrideValue)) ? overrideValue : formatOptions.value;
            if (decimalPlaces === undefined || decimalPlaces === null || decimalPlaces === "")
            {
                decimalPlaces = detailsObject.DecimalDigits;
            }
            if (typeof decimalPlaces === "string")
                decimalPlaces = parseInt(decimalPlaces);

            var bigValue, pattern = "";

            try
            {
                bigValue = new Big(value);
            }
            catch (NaN)
            {
                bigValue = NaN;
            }

            if (isNaN(bigValue))
            {
                // Return unchanged value & indicate formatting error
                if (typeof formatOptions.formattingError !== "undefined")
                    formatOptions.formattingError = true;
                return formatOptions.value;
            }
            else
            {
                var isNegative = bigValue.lt(0);
                if (isNegative)
                {
                    //make the number positive for formatting
                    //the negative pattern will determine how it should be displayed
                    bigValue = bigValue.negate();
                }
                var parts = [];
                if (decimalPlaces > 0)
                {
                    // Getting the absolute value after rounding & splitting to get various parts
                    bigValue = bigValue.round(decimalPlaces);
                    parts = bigValue.toFixed(decimalPlaces).split(".");
                }
                else
                {
                    parts = bigValue.toFixed().split("."); //for values with more than 20 digits, scientific notation will be used, e.g. 4.079999999999999974796e+21 - this leads to an inaccurate result when splitting at . if number isn't converted using toFixed.
                }
                var wholePortion = parts[0];


                var rationalPortion = (decimalPlaces !== 0 && parts.length > 1) ? parts[1] : "";

                var resultingWholeNumber = "", resultingRationalPortion = rationalPortion;

                // Formatting the thousands seperator
                if (useThousandsSeparator && wholePortion !== "0")
                {
                    var wholePortionString = wholePortion + "";
                    for (var i = wholePortionString.length; i > 0; i = i - 3)
                    {
                        var start = i - 3;
                        if (start < 0)
                            start = 0;
                        resultingWholeNumber = wholePortionString.substring(start, i) + resultingWholeNumber;
                        if (start !== 0)
                            resultingWholeNumber = detailsObject.GroupSeparator + resultingWholeNumber;
                    }
                }
                else if (!useThousandsSeparator || wholePortion === "0")
                {
                    resultingWholeNumber = wholePortion;
                }

                // Combining the whole portion with the rational
                var resultBeforePatterns = resultingWholeNumber;
                if (resultingRationalPortion !== "")
                    resultBeforePatterns += detailsObject.DecimalSeparator + resultingRationalPortion;

                //find the negative pattern add it to the object so it can be used later to check for red formatting that needs to be undone
                if (checkExistsNotEmpty(cultureObject.OverrideNegativePattern))
                {
                    formatOptions.negativePattern = cultureObject.OverrideNegativePattern;
                }
                else
                {
                    formatOptions.negativePattern = detailsObject.NegativePattern;
                }

                // Applying the sign of the number
                if (isNegative && applyNegativeFormat)
                {
                    pattern = formatOptions.negativePattern;
                }
                else
                {
                    pattern = detailsObject.PositivePattern;
                }

                // Applying any currency symbols
                var currencySymbol = cultureObject.CurrencySymbol;
                if (cultureObject.OverrideCurrencySymbol)
                    currencySymbol = cultureObject.OverrideCurrencySymbol;

                // Final formatting
                if (isNegative)
                {
                    if (applyNegativeFormat)
                    {
                        pattern = pattern.replace(/-/g, cultureObject.NegativeSign);
                    }
                    else
                    {
                        pattern = "-" + pattern;
                    }
                }
                pattern = pattern.replace(/\%/g, cultureObject.PercentSymbol);
                pattern = pattern.replace(/\$/g, currencySymbol);
                pattern = pattern.replace(/n/g, resultBeforePatterns);

                // If pattern is not a number, give localised message
                if (pattern === Number.NaN)
                    pattern = cultureObject.NaNSymbol;
            }

            return pattern;
        },

        _getCalendarMonth: function (startDate, formatXmlString)
        {
            var resultSet = [];
            this.getFormatObject(formatXmlString);
            var formatObject = this.getFormatObject(formatXmlString);
            var co = formatObject.cultureObject;


        },

        _formatDate: function (date, utcDateString, cultureObject, formatString, formatObject)
        {
            if (checkExists(date))
            {
                var formattedDate = null;
                switch (cultureObject.CalendarType)
                {
                    case "GregorianCalendar":
                        formattedDate = this._formatGregorianDate(date, cultureObject, formatString);
                        break;
                    default:
                        var newDateString = this._convertDateObjToLocalString(date);
                        formattedDate = this.parseDateOnServer(newDateString, "", formatString, false, cultureObject.Name);
                        break;
                }
            }
            return formattedDate;
        },

        df:
            [
                { p: /YYYY/i, v: "{0}" },
                { p: /YY/i, v: "{1}" },
                { p: /y/i, v: "{2}" },
                { p: /MMMM/, v: "{3}" },
                { p: /MMM/, v: "{4}" },
                { p: /MM/, v: "{5}" },
                { p: /M/, v: "{6}" },
                { p: /DDDD/i, v: "{7}" },
                { p: /DDD/i, v: "{8}" },
                { p: /DD/i, v: "{9}" },
                { p: /D/i, v: "{10}" },
                { p: /#th#/, v: "{11}" },
                { p: /hhh/, v: "{12}" },
                { p: /hh/, v: "{13}" },
                { p: /h/, v: "{12}" },
                { p: /mm/, v: "{14}" },
                { p: /m/, v: "{15}" },
                { p: /ss/, v: "{16}" },
                { p: /s/, v: "{17}" },
                { p: /ampm/, v: "{18}" },
                { p: /tt/, v: "{18}" },
                { p: /t/, v: "{19}" },
                { p: /HH/, v: "{20}" },
                { p: /H/, v: "{21}" },
                { p: /FFFFFFF/, v: "{22}" },
                { p: /FFFFFF/, v: "{23}" },
                { p: /FFFFF/, v: "{24}" },
                { p: /FFFF/, v: "{25}" },
                { p: /FFF/, v: "{26}" },
                { p: /FF/, v: "{27}" },
                { p: /F/, v: "{28}" },
                { p: /'|#/g, v: "" }
            ],

        _quotes: /'(.*?)'/,

        _formatGregorianDate: function (date, cultureObject, formatString)
        {
            if (date._type === "datetime")
            {
                date = date.localDate();
            }
            var YYYY, YY, MMMM, MMM, MM, M, DDDD, DDD, DD, D, hhh, hh, h, mm, m, ss, s, ampm, dMod, th;
            //date
            YYYY = date.getFullYear() + "";
            YY = YYYY.substr(2, 2);
            Y = parseInt(YY, 10) + "";
            MM = (M = date.getMonth() + 1) < 10 ? ('0' + M) : M;
            MMMM = cultureObject.DateTimeSettings.MonthNames[date.getMonth()];
            MMM = cultureObject.DateTimeSettings.ShortMonthNames[date.getMonth()];
            DD = (D = date.getDate()) < 10 ? ('0' + D) : D;
            DDDD = cultureObject.DateTimeSettings.DayNames[date.getDay()];
            DDD = cultureObject.DateTimeSettings.ShortDayNames[date.getDay()];
            th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) === 1) ? 'st' : (dMod === 2) ? 'nd' : (dMod === 3) ? 'rd' : 'th';

            //time
            h = (hhh = date.getHours());
            var H = h;
            var HH = h < 10 ? ('0' + h) : h;
            if (h === 0) h = 24;
            if (h > 12) h -= 12;
            hh = h < 10 ? ('0' + h) : h;
            ampm = hhh < 12 ? cultureObject.DateTimeSettings.AMDesignator : cultureObject.DateTimeSettings.PMDesignator;
            mm = (m = date.getMinutes()) < 10 ? ('0' + m) : m;
            ss = (s = date.getSeconds()) < 10 ? ('0' + s) : s;
            FFF = date.getMilliseconds();
            if (FFF < 100)
            {
                FFF = "0" + FFF;
            }
            FF = Math.round(FFF / 10);
            F = Math.round(FFF / 100);
            FFFF = FFF + "0";
            FFFFF = FFFF + "0";
            FFFFFF = FFFFF + "0";
            FFFFFFF = FFFFFF + "0";

            var formatArray = [];
            formatArray[0] = YYYY;
            formatArray[1] = YY;
            formatArray[2] = Y;
            formatArray[3] = MMMM;
            formatArray[4] = MMM;
            formatArray[5] = MM;
            formatArray[6] = M;
            formatArray[7] = DDDD;
            formatArray[8] = DDD;
            formatArray[9] = DD;
            formatArray[10] = D;
            formatArray[11] = th;
            formatArray[12] = h;
            formatArray[13] = hh;
            formatArray[14] = mm;
            formatArray[15] = m;
            formatArray[16] = ss;
            formatArray[17] = s;
            formatArray[18] = ampm;
            formatArray[19] = ampm[0];
            formatArray[20] = HH;
            formatArray[21] = H;
            formatArray[22] = FFFFFFF;
            formatArray[23] = FFFFFF;
            formatArray[24] = FFFFF;
            formatArray[25] = FFFF;
            formatArray[26] = FFF;
            formatArray[27] = FF;
            formatArray[28] = F;

            var dfl = this.df.length;
            var partsIndex = dfl;
            //first remove escaped character parts enclosed in quotations
            var result = '';
            var matches = this._quotes.exec(formatString);
            while (checkExists(matches))
            {
                formatArray[partsIndex] = matches[1];
                formatString = formatString.replace(this._quotes, "{{0}}".format(partsIndex));
                partsIndex = partsIndex + 1;
                matches = this._quotes.exec(formatString);
            }

            //then replace the parts with with the format {0}

            for (var i = 0; i < dfl; i++)
            {
                formatString = formatString.replace(this.df[i].p, this.df[i].v);
            }

            //then replace the {} with the values

            return formatString.format(formatArray);
        },

        getSampleValue: function (type, pattern, patternName)
        {
            var value = "";
            switch (type)
            {
                case "Number":
                    value = "-6789.1234";
                case "Currency":
                    value = "-6789.1234";
                    break;
                case "Percentage":
                    value = "-6789.1234";
                    break;
                case "Scientific":
                    value = "-6789.1234";
                    break;
                case "Special":
                    if (checkExistsNotEmpty(patternName))
                    {
                        value = this.getPreviewText(patternName);
                    }
                    break;
                case "Date":
                    value = this._convertDateObjToString(new Date());
                    break;
                case "Custom":
                    if (pattern.test(this.customNumberRegex) || pattern.test(this.numberRegex))
                    {
                        value = "-6789.1234";
                    }
                    else
                    {
                        value = this._convertDateObjToString(new Date());
                    }
                    break;
                case "Duration":
                    value = "6789";
                    break;
                default:
                    value = "AaYy";
                    break;
            }
            return value;
        },

        getPreviewText: function (patternName)
        {
            var patternsLength = SCCultureHelper.current.cultureObject.SpecialDetails.Patterns.length;
            var value;

            for (p = 0; p < patternsLength; p++)
            {
                var thisPattern = SCCultureHelper.current.cultureObject.SpecialDetails.Patterns[p];

                if (thisPattern.Name === patternName)
                {
                    value = thisPattern.PreviewText;
                    break;
                }
            }

            return value;
        },

        parseDateOnServer: function (typedDate, cultureName, pattern, toUniversalTime, formatCultureName, timeZone)
        {
            //console.log("parseDateOnServer");
            var data =
            {
                method: "parseDate",
                value: encodeURIComponent(typedDate),
                pattern: pattern,
                toUniversalTime: toUniversalTime,
                cultureName: checkExists(cultureName) ? cultureName : "",
                formatCultureName: checkExists(formatCultureName) ? formatCultureName : "",
                timeZone: checkExists(timeZone) ? timeZone : "",
            };

            var options =
            {
                url: applicationRoot + "Runtime/CalendarAJAXCall.ashx",
                type: 'GET',
                data: data,
                async: false,
                dataType: 'text',
                cache: true
            }
            var ajax = jQuery.ajax(options);

            return this.parseDateOnServerSuccess(ajax.responseText);
        },

        parseDateOnServerSuccess: function (data)
        {
            if (SourceCode.Forms.ExceptionHandler.isException(data))
            {
                return null;
            }
            else
            {
                return data;
            }
        },

        parseDateOnServerError: function (XMLHttpRequest, textStatus, errorThrown)
        {
            //blah
        },

        getTimeZoneOffset: function (dateObject, timeZoneInfoIdentifier)
        {
            if (!checkExistsNotEmpty(timeZoneInfoIdentifier) || !checkExists(dateObject))
            {
                return 0;
            }
            // Get timeZone from ID
            var timeZone = this.timeZones.lookup[timeZoneInfoIdentifier];
            if (!checkExists(timeZone))
            {
                var timeZones = this.queryTimeZones(function (timeZone)
                {
                    return timeZone.Id.toUpperCase() === timeZoneInfoIdentifier.toUpperCase();
                });
                if (!timeZones || timeZones.length === 0)
                {
                    throw new Error('Timezone "{0}" could not be found'.format(timeZoneInfoIdentifier));
                }
                timeZone = timeZones[0];
            }
            var source = dateObject;
            var offset = timeZone.BaseUtcOffset;
            var sourceOffset = dateObject;

            if (!timeZone.SupportsDaylightSavingTime)
            {
                return 0 - offset;
            }

            // Get daylight savings rule
            var adjustmentRules = timeZone.AdjustmentRules;
            for (var i = 0, rule; rule = adjustmentRules[i]; ++i)
            {
                rule.DateStart = SourceCode.Forms.DateTime.parse(rule.DateStart)
                rule.DateEnd = SourceCode.Forms.DateTime.parse(rule.DateEnd)

                if (rule.DateStart.compareTo(sourceOffset) <= 0 && rule.DateEnd.compareTo(sourceOffset) >= 0)
                {
                    if (rule.IsFixedDateRule)
                    {
                        offset += this.getFixedDaylightAdjustment(rule, source);
                    }
                    else
                    {
                        offset += this.getFloatingDaylightAdjustment(rule, source, offset);
                    }
                    break;
                }
            }

            return 0 - offset;
        },

        getFixedDaylightAdjustment: function (rule, source)
        {
            var daylightAdjustment = 0;
            var start = rule.DaylightTransitionStart.FixedDate = SourceCode.Forms.DateTime.parse(rule.DaylightTransitionStart.FixedDate),
                end = rule.DaylightTransitionEnd.FixedDate = SourceCode.Forms.DateTime.parse(rule.DaylightTransitionEnd.FixedDate)


            start.setFullYear(source.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
            end.setFullYear(source.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
            if (start < end)
            {
                daylightAdjustment = (start.compareTo(source) <= 0 && end.compareTo(source) > 0) ? rule.DaylightDelta : 0;
            }
            else
            {
                daylightAdjustment = (source.compareTo(end) >= 0 && source.compareTo(start) < 0) ? 0 : rule.DaylightDelta;
            }
            return daylightAdjustment;
        },

        getFloatingDate: function (daylightTransition, source, offSet)
        {
            daylightTransition.TimeOfDay = SourceCode.Forms.DateTime.parse(daylightTransition.TimeOfDay);
            var floatingDate = daylightTransition.TimeOfDay.clone();
            floatingDate.year(source.year());
            floatingDate.month(daylightTransition.Month);

            if (daylightTransition.Week > 4)
            {
                floatingDate.day(SourceCode.Forms.DateTime.daysInMonth(source.year(), daylightTransition.Month));
                var dayOfWeek = floatingDate.getDay() - daylightTransition.DayOfWeek;
                if (dayOfWeek < 0)
                {
                    dayOfWeek = dayOfWeek + 7;
                }
                if (dayOfWeek > 0)
                {
                    SourceCode.Forms.DateTime.addDays(floatingDate, 0 - dayOfWeek, false);
                }
            }
            else
            {
                floatingDate.day(1);
                var dayOfWeek = floatingDate.getDay();
                var week = daylightTransition.DayOfWeek - dayOfWeek;
                if (week < 0)
                {
                    week = week + 7;
                }
                week = week + 7 * (daylightTransition.Week - 1);
                if (week > 0)
                {
                    SourceCode.Forms.DateTime.addDays(floatingDate, week, false);
                }
            }
            SourceCode.Forms.DateTime.addTime(floatingDate, 4, 0 - offSet, false);
            return floatingDate;
        },

        getFloatingDaylightAdjustment: function (rule, source, offset)
        {
            //   timeOfDay:
            //     The time at which the time change occurs.
            //
            //   month:
            //     The month in which the time change occurs.
            //
            //   week:
            //     The week of the month in which the time change occurs.
            //
            //   dayOfWeek:
            //     The day of the week on which the time change occurs.
            var daylightAdjustment = 0;
            var start = this.getFloatingDate(rule.DaylightTransitionStart, source, offset),
                end = this.getFloatingDate(rule.DaylightTransitionEnd, source, offset + rule.DaylightDelta);

            var year = start.year();
            var num = end.year();
            if (year != num)
            {
                SourceCode.Forms.DateTime.addYears(end, year - num, false);
            }
            var year1 = source.year();
            if (year != year1)
            {
                source = SourceCode.Forms.DateTime.addYears(source, year - year1);
            }
            var flag = false;
            if (start <= end)
            {
                flag = (source.compareTo(start)) < 0 ? false : source.compareTo(end) < 0;
            }
            else
            {
                flag = (source.compareTo(end)) < 0 ? true : source.compareTo(start) >= 0;
            }
            return (flag) ? rule.DaylightDelta : 0;//daylightAdjustment;
        },

        queryTimeZones: function (predicate)
        {
            if (!checkExists(this.timeZones))
            {
                throw Resources.RuntimeMessages.TimeZonesUnresolved;
            }
            if (typeof predicate !== 'function')
            {
                throw Resources.RuntimeMessages.TimeZonesQueryNotAFunction;
            }

            return this.timeZones.filter(predicate);
        }

    }

    jQuery.extend(SourceCode.Forms.CultureHelper.prototype, cultureHelperPrototype);

    //Static methods

    SourceCode.Forms.CultureHelper._getFormatForSmartObjectField =
        function (fieldType)
        {
            var format = {};
            switch (fieldType)
            {
                case "number":
                    format.type = "Number";
                    format.pattern = "N0";
                    break;
                case "decimal":
                    format.type = "Number";
                    format.pattern = "N2";
                    break;
                case "autonumber":
                    format.type = "Number";
                    format.pattern = "N0";
                    break;
                case "datetime":
                    format.type = "Date";
                    format.pattern = "F";
                    break;
            }
            return format;
        };
    SourceCode.Forms.CultureHelper.getFormatXmlForSmartObjectField =
        function (fieldType)
        {
            var format = SCCultureHelper._getFormatForSmartObjectField(fieldType);
            if (typeof format.type !== "undefined" && format.pattern !== "undefined")
                return "<Format Type='{0}'>{1}</Format>".format(format.type, format.pattern);
            else
                return "";
        };
    SourceCode.Forms.CultureHelper.setupCultureXml =
        function (currentCulture, culturesListXmlString, currentCultureXmlString, timeZoneXml)
        {
            if (!SCCultureHelper.current)
            {
                SCCultureHelper.current = new SourceCode.Forms.CultureHelper(culturesListXmlString, currentCulture, timeZoneXml);
                var currentCultureXml = parseXML(currentCultureXmlString);
                SCCultureHelper.current.replaceListCultureNodeWithDetailedCultureNode(currentCulture, currentCultureXml);
            }
        };
    SourceCode.Forms.CultureHelper.setupCultureXmlAjax =
        function (functionToExecute)
        {
            if (!SCCultureHelper.current)
            {
                $.ajax(
                    {
                        data:
                        {
                            method: "getCulturesListAndCurrentCultureDetailsAndTimezones"
                        },
                        async: false,
                        dataType: 'xml',
                        url: applicationRoot + 'Runtime/AJAXCall.ashx',
                        error: function (xmlHttpRequest, textStatus, errorThrown)
                        {
                            popupManager.showError('<p>'.concat(Resources.RuntimeMessages.CulutureInformationFailedToLoad, '</p><p>[', xmlHttpRequest.status, '] ', xmlHttpRequest.statusText, ' (', textStatus, ')</p>'));
                        }.bind(this),
                        success: function (data, textStatus, xmlHttpRequest)
                        {
                            if (SourceCode.Forms.ExceptionHandler.handleException(data))
                            {
                                return;
                            }

                            var currentCulture = data.selectSingleNode("Results/CurrentCulture").text,
                                culturesXmlString = data.selectSingleNode("Results/Cultures").xml,
                                timeZones = data.selectSingleNode('Results/Timezones').text;

                            SCCultureHelper.current = new SourceCode.Forms.CultureHelper(culturesXmlString, currentCulture, timeZones);
                        }.bind(this)
                    });
            }
        };

    SourceCode.Forms.CultureHelper.Current = function ()
    {
        SourceCode.Forms.CultureHelper.setupCultureXmlAjax();
        return SourceCode.Forms.CultureHelper.current;
    }

    SourceCode.Forms.CultureHelper.addPendingCall = function (functionToAdd)
    {
        if (!checkExists(SourceCode.Forms.CultureHelper.current))
        {
            if (!checkExists(SourceCode.Forms.CultureHelper.pendingCalls))
                SourceCode.Forms.CultureHelper.pendingCalls = [];
            SourceCode.Forms.CultureHelper.pendingCalls.push(functionToAdd);
        }
        else
        {
            functionToAdd();
        }
    }
    SourceCode.Forms.CultureHelper.createCurrent = function (cultures, currentCulture, timeZones, xsltPath)
    {
        SCCultureHelper.current = new SourceCode.Forms.CultureHelper(cultures, currentCulture, timeZones, xsltPath);
        if (checkExists(SourceCode.Forms.CultureHelper.pendingCalls))
        {
            for (var i = 0; i < SourceCode.Forms.CultureHelper.pendingCalls.length; i++)
            {
                SourceCode.Forms.CultureHelper.pendingCalls[i]();
            }
            SourceCode.Forms.CultureHelper.pendingCalls = [];
        }
    }
    SCCultureHelper = SourceCode.Forms.CultureHelper;
    SCCultureHelper.current = null;

    /**
    * Parses a string value. Dates are left as strings.
    * @method parseText
    * 
    * @param {String} value The value to parse
    * 
    * @returns {Boolean|Float|String} A typed value.
    */
    function parseText(value)
    {
        if (/^\s*$/.test(value)) { return null; }
        if (/^(?:true|false)$/i.test(value)) { return value.toLowerCase() === 'true'; }
        if (isFinite(value)) { return parseFloat(value); }

        return value;
    }

})(jQuery);
