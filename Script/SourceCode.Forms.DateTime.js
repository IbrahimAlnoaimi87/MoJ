(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null)
    {
        SourceCode = {};
    }

    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null)
    {
        SourceCode.Forms = {};
    }

    var DateHelper;
    SourceCode.Forms.DateHelper = DateHelper =
    {
        units:
        {
            millisecond: 1,
            second: 1000,
            minute: 60000,
            hour: 3600000,
            day: 86400000,
            week: 608400000,
            month: 2678400000,
            year: 31536000000
        },
        getShortResolutionIdentifier: function (resolution)
        {
            return Resources.RuntimeMessages["ShortResolutionIdentifier_" + this.getResolutionIdentifier(resolution)];
        },
        getMediumResolutionIdentifier: function (resolution)
        {
            return Resources.RuntimeMessages["MediumResolutionIdentifier_" + this.getResolutionIdentifier(resolution)];
        },
        getMediumSingularResolutionIdentifier: function (resolution)
        {
            return Resources.RuntimeMessages["MediumResolutionIdentifierSingular_" + this.getResolutionIdentifier(resolution)];
        },
        getLongResolutionIdentifier: function (resolution)
        {
            return Resources.RuntimeMessages["LongResolutionIdentifier_" + this.getResolutionIdentifier(resolution)];
        },
        getLongSingularResolutionIdentifier: function (resolution)
        {
            return Resources.RuntimeMessages["LongResolutionIdentifierSingular_" + this.getResolutionIdentifier(resolution)];
        },
        getResolutionIdentifier: function (resolution)
        {
            var result = "millisecond";
            if (checkExists(resolution))
            {
                var upperRes = resolution.toUpperCase();
                switch (upperRes)
                {
                    case "MS":
                    case "MILLISECOND":
                    case "MILLISECONDS":
                        result = "millisecond";
                        break;
                    case "S":
                    case "SS":
                    case "SEC":
                    case "SECOND":
                    case "SECONDS":
                        result = "second";
                        break;
                    case "N":
                    case "MI":
                    case "MIN":
                    case "MINUTE":
                    case "MINUTES":
                        result = "minute";
                        break;
                    case "H":
                    case "HH":
                    case "HOUR":
                    case "HOURS":
                        result = "hour";
                        break;
                    case "D":
                    case "DD":
                    case "DAY":
                    case "DAYS":
                        result = "day";
                        break;
                    case "WW":
                    case "WK":
                    case "WEEK":
                    case "WEEKS":
                        result = "week";
                        break;
                    case "M":
                    case "MM":
                    case "MONTH":
                    case "MONTHS":
                        result = "month";
                        break;
                    case "Y":
                    case "YY":
                    case "YYYY":
                    case "YEAR":
                    case "YEARS":
                        result = "year";
                        break;
                }
            }
            return result;
        },
        getUnitMultiplier: function (resolution)
        {
            return DateHelper.units[DateHelper.getResolutionIdentifier(resolution)];
        },
        /**
         * Returns the number of days between two dates.
         *
         * @param {Date} d1 A javascript native Date object.
         * @param {Date} d2 A javascript native Date object.
         * @return {int} day difference between two dates.
         */
        getDayDifferenceBetweenTwoDates: function (d1, d2)
        {
            var bigDate = null;
            var smallDate = null;
            var multiplier = 1;

            if (d1 < d2)
            {
                bigDate = new SFDate(d2.getFullYear(), d2.getMonth() + 1, d2.getDate());
                smallDate = new SFDate(d1.getFullYear(), d1.getMonth() + 1, d1.getDate());
                multiplier = -1;
            }
            else
            {
                bigDate = new SFDate(d1.getFullYear(), d1.getMonth() + 1, d1.getDate());
                smallDate = new SFDate(d2.getFullYear(), d2.getMonth() + 1, d2.getDate());
            }


            var years = bigDate.getFullYear() - smallDate.getFullYear();
            var difference = 0;

            if (years > 1)
            {
                // the date difference is calucated as the number of days left for year that the small date is in then
                // plus the number of days passed for the year that the big date is in,
                // plus the number of days between the years of the small date and big date. (excluding the years that the small date and big date are in)

                difference += SourceCode.Forms.DateHelper.getNumberOfDaysLeftForTheYear(smallDate) + SourceCode.Forms.DateHelper.getNumberOfDaysPassedForTheYear(bigDate);

                var currentYear = smallDate.getFullYear() + 1;
                while (currentYear < bigDate.getFullYear())
                {
                    difference += (Date.isLeapYear(currentYear) ? 366 : 365);
                    currentYear += 1;
                }
            }
            else
            {
                // increment the difference until small date reaches the big date
                var sfDateBig = new SFDate(bigDate.getFullYear(), bigDate.getMonth() + 1, bigDate.getDate());
                var sfDateSmall = new SFDate(smallDate.getFullYear(), smallDate.getMonth() + 1, smallDate.getDate());
                while (sfDateBig > sfDateSmall)
                {
                    sfDateSmall.increment(1);
                    difference++;
                }
            }

            return difference * multiplier;
        },
        /**
         * Returns the number of days left for the year (till 31 Dec) for a date.
         * if the date is on the 31 Dec, the number of day left should be 0.
         *
         * @param {SFDate} sfDate SmartForm Date object.
         * @return {int}
         */
        getNumberOfDaysLeftForTheYear: function (sfDate)
        {
            //create a copy of the date and remove the time
            var d = new SFDate(sfDate.getFullYear(), sfDate.getMonth() + 1, sfDate.getDate());

            var days = 0;
            var nextYear = d.getFullYear() + 1;
            while (d.getFullYear() < nextYear)
            {
                //increment days until next year 
                d.increment(1);
                days++;
            }

            //Minus one day to exclude last day, for example if the date is on the 31 Dec, the number of day left should be 0.
            days--;

            return days;
        },
        /**
         * Returns the number of days that has passed for the year for a date.
         * if the date is on the 1 Jan, the number of day passed should be 1.
         *
         * @param {SFDate} sfDate A javascript native Date object.
         * @return {int}
         */
        getNumberOfDaysPassedForTheYear: function (sfDate)
        {
            //create a copy of the date and remove the time
            var d = new SFDate(sfDate.getFullYear(), sfDate.getMonth() + 1, sfDate.getDate());

            var days = 0;
            var previousYear = d.getFullYear() - 1;
            while (d.getFullYear() > previousYear)
            {
                d.decrement(1);
                days++;
            }
            return days;
        },
        compareTo: function (keys, firstObject, secondObject)
        {
            var comparisonResult = 0;
            var currentKeyIndex = 0;
            var keyLength = keys.length;
            while (comparisonResult === 0 && currentKeyIndex < keyLength)
            {
                var currentKey = keys[currentKeyIndex];
                if (firstObject[currentKey] > secondObject[currentKey])
                {
                    comparisonResult = 1;
                }
                else if (firstObject[currentKey] === secondObject[currentKey])
                {
                    currentKeyIndex++;
                }
                else
                {
                    comparisonResult = -1;
                }
            }
            return comparisonResult;
        }
    };

    var SFBaseDateTimePrototype =
    {
        getFullYear: function ()
        {
            return 0;
        },

        getMonth: function ()
        {
            return 0;
        },

        getWeek: function ()
        {
            return 0;
        },

        getDate: function ()
        {
            return 0;
        },

        getDay: function ()
        {
            return 0;
        },

        getHours: function ()
        {
            return 0;
        },

        getMinutes: function ()
        {
            return 0;
        },

        getSeconds: function ()
        {
            return 0;
        },

        getMilliseconds: function ()
        {
            return 0;
        },

        getUTCFullYear: function ()
        {
            return 0;
        },

        getUTCMonth: function ()
        {
            return 0;
        },

        getUTCWeek: function ()
        {
            return 0;
        },

        getUTCDate: function ()
        {
            return 0;
        },

        getUTCDay: function ()
        {
            return 0;
        },

        getUTCHours: function ()
        {
            return 0;
        },

        getUTCMinutes: function ()
        {
            return 0;
        },

        getUTCSeconds: function ()
        {
            return 0;
        },

        getUTCMilliseconds: function ()
        {
            return 0;
        },

        getTimeZoneOffset: function ()
        {
            return 0;
        },

        setFullYear: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setFullYear", this._type);
        },

        setMonth: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setMonth", this._type);
        },

        setDate: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setDate", this._type);
        },

        setHours: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setHours", this._type);
        },

        setMinutes: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setMinutes", this._type);
        },

        setSeconds: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setSeconds", this._type);
        },

        setMilliseconds: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setMilliseconds", this._type);
        },

        setUTCFullYear: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCFullYear", this._type);
        },

        setUTCMonth: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCMonth", this._type);
        },

        setUTCDate: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCDate", this._type);
        },

        setUTCHours: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCHours", this._type);
        },

        setUTCMinutes: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCMinutes", this._type);
        },

        setUTCSeconds: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCSeconds", this._type);
        },

        setUTCMilliseconds: function ()
        {
            throw Resources.RuntimeMessages.DateTimeInvalidOperation.format("setUTCMilliseconds", this._type);
        },

        convertTime: function ()
        {
            return this;
        },

        clearUTCTime: function ()
        {
            return this;
        },

        clearTime: function ()
        {
            return this;
        },

        toLocalString: function ()
        {
            return this.toString();
        },

        getLocalTime: function ()
        {
            return this.getTime();
        }
    };

    var SFDate;

    SourceCode.Forms.Date = SFDate = function ()
    {
        this._create.apply(this, arguments);
    };

    $.extend(SFDate,
        {
            keys: ["_year", "_month", "_day"],
            stringFormat: "{0}-{1}-{2}",
            leapYearCache: {},
            _zeroDate: null,

            now: function ()
            {
                return new SFDate();
            },

            expressions:
            {
                isodate: /^\s*(\d{1,4})-(\d{1,2})-(\d{1,2})\s*$/
            },

            isLeapYear: function (year)
            {
                if (!checkExists(SFDate.leapYearCache[year]))
                {
                    //A year will be a leap year if it is divisible by 4 but not by 100. 
                    //If a year is divisible by 4 and by 100, it is not a leap year unless it is also divisible by 400.
                    var modFour = year % 4;
                    var modHundred = year % 100;
                    SFDate.leapYearCache[year] = ((modFour === 0 && modHundred !== 0) || (modFour === 0 && modHundred === 0 && year % 400 === 0));
                }
                return SFDate.leapYearCache[year];
            },

            daysInMonth: function (year, month)
            {
                //30 days hath September,
                //  April, June and November,
                //All the rest have 31,
                //  Excepting February alone
                //(And that has 28 days clear,
                //  With 29 in each leap year).
                var daysInMonth = 31;
                if (month === 9 || month === 4 || month === 6 || month === 11)
                {
                    daysInMonth = 30;
                }
                else if (month === 2)
                {
                    daysInMonth = SFDate.isLeapYear(year) ? 29 : 28;
                }
                return daysInMonth;
            },

            correctDateValue: function (dateObject)
            {
                if (dateObject._day < 1)
                {
                    dateObject._month = dateObject._month - 1;
                }
                if (dateObject._month < 1)
                {
                    dateObject._year = dateObject._year - 1;
                    dateObject._month = 12 + dateObject._month;
                }
                if (dateObject._day < 1)
                {
                    dateObject._day = SFDate.daysInMonth(dateObject._year, dateObject._month) + dateObject._day;
                }

                var daysInMonth = SFDate.daysInMonth(dateObject._year, dateObject._month);
                var difference = dateObject._day - daysInMonth;
                if (difference > 0)
                {
                    dateObject._day = daysInMonth;
                }
                else
                {
                    difference = 0;
                }
                return difference;
            },

            addYears: function (originalDate, units, clone)
            {
                var calculatedDate;
                if (!checkExists(clone) || clone === true)
                {
                    calculatedDate = originalDate.clone();
                }
                else
                {
                    calculatedDate = originalDate;
                }

                if (checkExists(units.toFloat))
                {
                    units = units.toFloat();
                }

                var year = calculatedDate.year();
                calculatedDate._year = year + units;
                SFDate.correctDateValue(calculatedDate);
                return calculatedDate;
            },

            addMonths: function (originalDate, units, clone)
            {
                var calculatedDate;
                if (!checkExists(clone) || clone === true)
                {
                    calculatedDate = originalDate.clone();
                }
                else
                {
                    calculatedDate = originalDate;
                }

                if (checkExists(units.toFloat))
                {
                    units = units.toFloat();
                }

                var totalUnits = calculatedDate._month + units;
                var datePartValue = totalUnits % 12;
                if (datePartValue >= 0)
                {
                    calculatedDate._month = Math.abs(datePartValue);
                }
                else
                {
                    calculatedDate._month = 12 + datePartValue;
                }
                units = Math.floor(totalUnits / 12);
                var year = calculatedDate.year();
                calculatedDate._year = year + units;
                SFDate.correctDateValue(calculatedDate);
                return calculatedDate;
            },

            addDays: function (originalDate, units, clone)
            {
                var calculatedDate, currentYear, days, i;
                if (!checkExists(clone) || clone === true)
                {
                    calculatedDate = originalDate.clone();
                }
                else
                {
                    calculatedDate = originalDate;
                }

                if (checkExists(units.toFloat))
                {
                    units = units.toFloat();
                }

                //years
                var possibleYears = units / 365;
                var isPositive = (possibleYears > 0);
                possibleYears = (isPositive) ? Math.floor(possibleYears) : Math.ceil(possibleYears);
                if (possibleYears !== 0)
                {
                    currentYear = calculatedDate._year;
                    if (isPositive)
                    {

                        //iterates one extra
                        for (i = 0; i <= possibleYears; i++)
                        {
                            days = (calculatedDate._month < 2 && SFDate.isLeapYear(currentYear) || calculatedDate._month > 2 && SFDate.isLeapYear(currentYear + 1) || calculatedDate._month === 2 && calculatedDate._day < 29 && SFDate.isLeapYear(currentYear)) ? 366 : 365;
                            if (days > units)
                            {
                                break;
                            }
                            units = units - days;
                            currentYear++;
                            calculatedDate._year = currentYear;
                            SFDate.correctDateValue(calculatedDate);
                        }
                    }
                    else
                    {
                        for (i = possibleYears; i <= 0; i--)
                        {
                            days = (calculatedDate._month > 2 && SFDate.isLeapYear(currentYear) || calculatedDate._month < 2 && SFDate.isLeapYear(currentYear - 1) || calculatedDate._month === 2 && (calculatedDate._day === 29 || SFDate.isLeapYear(currentYear - 1))) ? 366 : 365;
                            if (days > -units)
                            {
                                break;
                            }
                            units = units + days;
                            currentYear--;
                            calculatedDate._year = currentYear;
                            SFDate.correctDateValue(calculatedDate);
                        }
                    }
                }

                //months
                var possibleMonths = units / 28;
                isPositive = (possibleMonths > 0);
                possibleMonths = (isPositive) ? Math.floor(possibleMonths) : Math.ceil(possibleMonths);
                if (possibleMonths !== 0)
                {
                    currentYear = calculatedDate._year;
                    var currentMonth = calculatedDate._month;
                    //iterates one extra
                    if (isPositive)
                    {
                        //iterates one extra
                        for (i = 0; i <= possibleMonths; i++)
                        {
                            days = SFDate.daysInMonth(currentYear, currentMonth);
                            if (days > units)
                            {
                                break;
                            }
                            units = units - days;
                            if (currentMonth === 12)
                            {
                                currentMonth = 1;
                                currentYear++;
                            }
                            else
                            {
                                currentMonth++;
                            }
                            calculatedDate._month = currentMonth;
                            calculatedDate._year = currentYear;
                            units = units + SFDate.correctDateValue(calculatedDate);
                        }
                    }
                    else
                    {
                        //iterates one extra
                        for (i = possibleMonths; i <= 0; i--)
                        {
                            var tempMonth = currentMonth;
                            var tempYear = currentYear;
                            if (tempMonth === 1)
                            {
                                tempMonth = 12;
                                tempYear--;
                            }
                            else
                            {
                                tempMonth--;
                            }
                            days = SFDate.daysInMonth(tempYear, tempMonth);
                            if (days > -units)
                            {
                                break;
                            }
                            units = units + days;
                            currentMonth = tempMonth;
                            currentYear = tempYear;
                            calculatedDate._month = currentMonth;
                            calculatedDate._year = currentYear;
                            units = units + SFDate.correctDateValue(calculatedDate);
                        }
                    }
                }

                //days
                var currentDay = calculatedDate._day + units;
                var overflow = currentDay - SFDate.daysInMonth(calculatedDate._year, calculatedDate._month);
                while (overflow > 0)
                {
                    currentDay = overflow;
                    if (calculatedDate._month === 12)
                    {
                        calculatedDate._month = 1;
                        calculatedDate._year = calculatedDate._year + 1;
                    }
                    else
                    {
                        calculatedDate._month = calculatedDate._month + 1;
                    }
                    overflow = currentDay - SFDate.daysInMonth(calculatedDate._year, calculatedDate._month);
                }
                calculatedDate._day = currentDay;
                SFDate.correctDateValue(calculatedDate);
                return calculatedDate;
            },

            parseImpl: function (input, formatObject)
            {
                var parseResult = null;
                if (input instanceof Date || input._type === "datetime")
                {
                    return new SFDate(input.getFullYear(), input.getMonth() + 1, input.getDate());
                }
                else if (input._type === "date")
                {
                    return input;
                }
                else if (input._type === "time")
                {
                    throw Resources.RuntimeMessages.TimeCouldNotParseMessage;
                }

                var match = SFDate.expressions.isodate.exec(input);
                if (checkExists(match))
                {
                    parseResult = new SFDate(match[1], match[2], match[3]);
                }
                else
                {
                    var time = SourceCode.Forms.Time.parseImpl(input, formatObject, false);
                    if (checkExists(time))
                    {
                        throw Resources.RuntimeMessages.TimeCouldNotParseMessage;
                    }

                    var dateObject = SCCultureHelper.Current()._checkDateIsZuluDate(input);
                    if (dateObject)
                    {
                        return new SFDate(dateObject.getFullYear(), dateObject.getMonth() + 1, dateObject.getDate());
                    }
                }
                return parseResult;
            },

            parse: function (input, formatObject)
            {
                var parseResult = null;
                parseResult = SFDate.parseImpl(input, formatObject);
                if (!checkExists(parseResult))
                {
                    if (SCCultureHelper && SCCultureHelper.Current() && SCCultureHelper.Current().currentCultureName)
                    {
                        var cultureName = SCCultureHelper.Current().currentCultureName;
                        if (checkExists(formatObject))
                        {
                            cultureName = formatObject.cultureObject.Name;
                        }
                        parseResult = SCCultureHelper.Current().parseDateOnServer(input, cultureName, "yyyy-MM-dd", false);
                        if (parseResult !== null)
                        {
                            parseResult = SFDate.parseImpl(parseResult, formatObject);
                        }
                    }
                }

                if (parseResult === null)
                {
                    throw Resources.RuntimeMessages.DateCouldNotParseMessage;
                }
                return parseResult;
            },

            zeroDate: function ()
            {
                if (SFDate._zeroDate === null)
                {
                    SFDate._zeroDate = new SFDate(1970, 1, 1);
                }
                return SFDate._zeroDate;
            }
        });

    var SFDatePrototype =
    {
        _year: 0,
        _month: 1,
        _day: 1,
        _type: "date",

        _create: function (y, M, d)
        {
            if (arguments.length === 0)
            {
                var date = new Date();
                // correct to the standard date result
                y = date.getFullYear();
                M = date.getMonth() + 1;
                d = date.getDate();
            }
            this.year(y, true);
            this.month(M, true);
            this.day(d, true);
            this.validateDate();
        },

        year: function (year, skipValidation)
        {
            if (checkExists(year))
            {
                //set
                var pYear = parseInt(year);
                if (isNaN(pYear))
                {
                    throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("year", year);
                }
                this._year = pYear;
                if (!skipValidation)
                {
                    this.validateDate();
                }
            }
            else
            {
                //get
                return this._year;
            }
        },

        month: function (month, skipValidation)
        {
            if (checkExists(month))
            {
                //set
                var pMonth = parseInt(month);
                if (isNaN(pMonth) || pMonth < 1 || pMonth > 12)
                {
                    throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("month", month);
                }
                this._month = pMonth;
                if (!skipValidation)
                {
                    this.validateDate();
                }
            }
            else
            {
                //get
                return this._month;
            }
        },

        day: function (day, skipValidation)
        {
            if (checkExists(day))
            {
                //set
                var pDay = parseInt(day);
                if (isNaN(pDay) || pDay < 0 || pDay > 31)
                {
                    throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("day", day);
                }
                this._day = pDay;
                if (!skipValidation)
                {
                    this.validateDate();
                }
            }
            else
            {
                //get
                return this._day;
            }
        },

        validateDate: function ()
        {
            if (isNaN(this._year))
            {
                throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("year", this._year);
            }

            if (isNaN(this._month) || this._month < 1 || this._month > 12)
            {
                throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("month", this._month);
            }

            if (isNaN(this._day) || this._day < 0 || this._day > SFDate.daysInMonth(this._year, this._month))
            {
                throw Resources.RuntimeMessages.DateInvalidPropertyMessage.format("day", this._day);
            }
        },

        getUTCFullYear: function ()
        {
            return this.year();
        },

        getUTCMonth: function ()
        {
            // correct to the standard date result
            return this.month() - 1;
        },

        getUTCDate: function ()
        {
            return this.day();
        },

        getFullYear: function ()
        {
            return this.year();
        },

        getMonth: function ()
        {
            return this.getUTCMonth();
        },

        getDate: function ()
        {
            return this.day();
        },

        getDayOfYear: function ()
        {
            var day = 0;
            for (var i = 1; i < this._month; i++)
            {
                day = day + SFDate.daysInMonth(this._year, i);
            }
            day = day + this._day;
            return day;
        },

        getDay: function ()
        {
            var d = this.getDayOfYear();
            var A = this._year - 1;
            var B = Math.floor(A / 4);
            var C = Math.floor(A / 100);
            var D = Math.floor(B / 100);
            return (A + B - C + D + d) % 7;
        },

        getWeek: function ()
        {
            if (checkExists(SourceCode.Forms.Settings)
                && checkExists(SourceCode.Forms.Settings.Compatibility)
                && checkExists(SourceCode.Forms.Settings.Compatibility.DateWeekNumberLegacyLogic)
                && SourceCode.Forms.Settings.Compatibility.DateWeekNumberLegacyLogic)
            {
                return Math.floor(this.getDayOfYear() / 7) + 1;
            }
            else
            {
                return this.getWeekNumber(0);
            }
        },

        getWeekNumber: function (weekStart)
        {
            weekStart = weekStart || 0;
            return Math.ceil((this.getDayOfYear() + (new SFDate(this.getFullYear(), 1, 1)).getDay() - weekStart) / 7);
        },

        isLeapYear: function ()
        {
            return SFDate.isLeapYear(this._year);
        },

        setSafeUTCFullYear: function (year, month, day)
        {
            year = parseInt(year);
            var monthToSet = checkExists(month) ? parseInt(month) + 1 : this._month;
            var daysInProposedMonth = SFDateTime.daysInMonth(year, monthToSet);
            var dayToSet = checkExists(day) ? parseInt(day) : this._day;
            if (dayToSet > daysInProposedMonth)
            {
                dayToSet = daysInProposedMonth;
            }
            this.year(year);
            this.month(monthToSet);
            this.day(dayToSet);
            return this;
        },

        setUTCFullYear: function (year, month, day)
        {
            this.year(year, true);
            this.month(month + 1, true);
            this.day(day, true);
            this.validateDate();
        },

        setSafeUTCMonth: function (month, day)
        {
            month = parseInt(month) + 1;
            var daysInProposedMonth = SFDate.daysInMonth(this._year, month);
            var dayToSet = checkExists(day) ? parseInt(day) : this._day;
            if (dayToSet > daysInProposedMonth)
            {
                dayToSet = daysInProposedMonth;
            }
            this.month(month);
            this.day(dayToSet);
        },

        setUTCMonth: function (n)
        {
            // correct to the standard date result
            return this.month(n + 1);
        },

        setUTCDate: function (n)
        {
            return this.day(n);
        },

        setFullYear: function (year, month, day)
        {
            this.setSafeFullYear(year, month, day);
        },

        setSafeFullYear: function (year, month, day)
        {
            return this.setSafeUTCFullYear(year, month, day);
        },

        setMonth: function (n)
        {
            // correct to the standard date result
            return this.month(n - 1);
        },

        setSafeMonth: function (month, day)
        {
            return this.setSafeUTCMonth(month, day);
        },

        setDate: function (n)
        {
            return this.day(n);
        },

        increment: function (days)
        {
            SFDate.addDays(this, days, false);
            return this;
        },

        decrement: function (days)
        {
            SFDate.addDays(this, -days, false);
            return this;
        },

        add: function (unitOfTime, units)
        {
            var lowerUnit = DateHelper.getResolutionIdentifier(unitOfTime);
            var fn = null;
            switch (lowerUnit)
            {
                case "year":
                    fn = this.addYears;
                    break;
                case "month":
                    fn = this.addMonths;
                    break;
                case "day":
                    fn = this.addDays;
                    break;
            }
            if (!checkExists(fn))
            {
                throw Resources.RuntimeMessages.DateUnitNotSupportForAddition.format(unitOfTime);
            }
            return fn.apply(this, [units]);
        },

        addYears: function (units)
        {
            return SFDate.addYears(this, units);
        },

        addMonths: function (units)
        {
            return SFDate.addMonths(this, units);
        },

        addDays: function (units)
        {
            return SFDate.addDays(this, units);
        },

        compareTo: function (t)
        {
            var _this = this;
            return DateHelper.compareTo(SFDate.keys, _this, t);
        },

        equals: function (t)
        {
            return this.compareTo(t) === 0;
        },

        clone: function ()
        {
            return new SFDate(this._year, this._month, this._day);
        },

        getTime: function ()
        {
            return this.difference(SFDate.zeroDate(), "day") * DateHelper.units.day;
        },

        fractionalDifference: function (otherDate, resolution)
        {
            resolution = DateHelper.getResolutionIdentifier(resolution);
            var dayDifference = 0, fractionalDiff = 0;
            otherDate = SFDate.parse(otherDate);
            if (!checkExists(resolution))
            {
                resolution = "day";
            }
            if (resolution === "year" || resolution === "month")
            {
                //US 30/360 http://en.wikipedia.org/wiki/Day_count_convention#30.2F360_methods
                //this is the default in excel
                var y1 = new Big(otherDate._year);
                var y2 = new Big(this._year);

                var m1 = new Big(otherDate._month);
                var m2 = new Big(this._month);
                var d1 = (m1.eq(2) && otherDate._day === SFDate.daysInMonth(y1, m1)) ? new Big(30) : new Big(otherDate._day);
                var d2 = (m2.eq(2) && this._day === SFDate.daysInMonth(y2, m2)) ? new Big(30) : new Big(this._day);

                if (d2.eq(31) && d1.lt(29))
                {
                    d2 = new Big(30);
                }
                if (d1.eq(31))
                {
                    d1 = new Big(30);
                }
                dayDifference = y2.minus(y1).times(360).plus(m2.minus(m1).times(30)).plus(d2.minus(d1));
                if (resolution === "year")
                {
                    fractionalDiff = dayDifference.div(360);
                }
                else
                {
                    fractionalDiff = dayDifference.div(30);
                }
            }
            else
            {
                dayDifference = this.difference(otherDate, "day");
                if (resolution === "day")
                {
                    fractionalDiff = dayDifference;
                }
                else
                {
                    fractionalDiff = (new Big(dayDifference)).times(DateHelper.units.day).div(DateHelper.units[resolution]);
                }

            }
            return fractionalDiff;
        },

        difference: function (otherDate, resolution)
        {
            resolution = DateHelper.getResolutionIdentifier(resolution);
            otherDate = SFDate.parse(otherDate);

            var years = this._year - otherDate._year;
            var months = this._month - otherDate._month;
            var difference = 0;
            switch (resolution)
            {
                case "year":
                    difference = years;
                    break;
                case "month":
                    difference = years * 12 + months;
                    break;
                case "day":
                    difference = SourceCode.Forms.DateHelper.getDayDifferenceBetweenTwoDates(this, otherDate);
                    break;
            }
            return difference;

        },

        toString: function ()
        {
            return SFDate.stringFormat.format(this._year.toString().zeroise(4),
                this._month.toString().zeroise(2),
                this._day.toString().zeroise(2));
        }
    };

    jQuery.extend(SFDate.prototype, SFBaseDateTimePrototype, SFDatePrototype);

    var SFTime;

    SourceCode.Forms.Time = SFTime = function ()
    {
        this._create.apply(this, arguments);
    };

    $.extend(SFTime,
        {
            keys: ["_hours", "_minutes", "_seconds", "_milliseconds"],
            range: [24, 60, 60, 1000],
            stringFormatSeconds: "{0}:{1}:{2}",
            stringFormatMilliseconds: "{0}:{1}:{2}.{3}",

            now: function ()
            {
                return new SFTime();
            },

            expressions:
            {
                isoTime: /^\s*(\d{1,2}):(\d{1,2})(:(\d{1,2})(.(\d+\s*))?)?\s*$/
            },

            add: function (originalDate, index, units)
            {
                if (checkExists(units.toFloat))
                {
                    units = units.toFloat();
                }
                var calculatedDate = originalDate.clone();
                while (index > -1 && units !== 0)
                {
                    var totalUnits = (calculatedDate[SFTime.keys[index]] + units);
                    var datePartValue = totalUnits % SFTime.range[index];
                    if (datePartValue >= 0)
                    {
                        calculatedDate[SFTime.keys[index]] = Math.abs(datePartValue);
                    }
                    else
                    {
                        calculatedDate[SFTime.keys[index]] = SFTime.range[index] + datePartValue;
                    }

                    units = Math.floor(totalUnits / SFTime.range[index]);
                    index--;
                }

                return calculatedDate;
            },

            parseImpl: function (input, formatObject, acceptZuluDate)
            {
                acceptZuluDate = !checkExists(acceptZuluDate) ? true : acceptZuluDate;
                if (input instanceof Date)
                {
                    return new SFTime(input.getHours(), input.getMinutes(), input.getSeconds(), input.getMilliseconds());
                }
                else if (input._type === "time")
                {
                    return input;
                }
                else if (input._type === "date")
                {
                    return new SourceCode.Forms.Time(0, 0, 0, 0);
                }
                var parseResult = null, isPMTime = false, isAMTime = false;
                if (formatObject)
                {
                    if (checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.AMDesignator) &&
                        input.contains(formatObject.cultureObject.DateTimeSettings.AMDesignator))
                    {
                        isAMTime = true;
                        input = input.replace(formatObject.cultureObject.DateTimeSettings.AMDesignator, "");
                    }

                    if (checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.PMDesignator) &&
                        input.contains(formatObject.cultureObject.DateTimeSettings.PMDesignator))
                    {
                        isPMTime = true;
                        input = input.replace(formatObject.cultureObject.DateTimeSettings.PMDesignator, "");
                    }

                }
                var match = SFTime.expressions.isoTime.exec(input);
                if (checkExists(match))
                {
                    var milliseconds = match[6];
                    if (checkExists(milliseconds))
                    {
                        if (milliseconds.length < 2)
                        {
                            milliseconds = milliseconds + "00";
                        }
                        else if (milliseconds.length < 3)
                        {
                            milliseconds = milliseconds + "0";
                        }
                        else if (milliseconds.length > 3)
                        {
                            milliseconds = milliseconds.substring(0, 3) + "." + milliseconds.substring(3);
                        }
                    }
                    var hours = match[1];
                    if (isPMTime)
                    {
                        hours = parseInt(hours, 10);
                        if (hours < 12)
                        {
                            hours = hours + 12;
                        }
                    }
                    if (isAMTime && hours == 12) //to set time to 00 for 24 hours format, otherwise It gets read as 12 pm.
                    {
                        hours = hours - 12;
                    }
                    parseResult = new SFTime(hours, match[2], match[4], milliseconds);
                }
                else if (acceptZuluDate === true)
                {
                    var dateObject = SCCultureHelper.Current()._checkDateIsZuluDate(input);
                    if (dateObject)
                    {
                        return new SFTime(dateObject.getHours(), dateObject.getMinutes(), dateObject.getSeconds(), dateObject.getMilliseconds());
                    }
                }
                return parseResult;
            },

            parse: function (input, formatObject)
            {
                var parseResult = null;
                parseResult = SFTime.parseImpl(input, formatObject);
                if (!checkExists(parseResult))
                {
                    if (SCCultureHelper && SCCultureHelper.Current() && SCCultureHelper.Current().currentCultureName)
                    {
                        var cultureName = SCCultureHelper.Current().currentCultureName;
                        if (checkExists(formatObject))
                        {
                            cultureName = formatObject.cultureObject.Name;
                        }
                        parseResult = SCCultureHelper.Current().parseDateOnServer(input, cultureName, "HH:mm:ss.FFFFFFF", false);
                        if (parseResult !== null)
                        {
                            parseResult = SFTime.parseImpl(parseResult);
                        }
                    }
                }

                if (parseResult === null)
                {
                    throw Resources.RuntimeMessages.TimeCouldNotParseMessage;
                }
                return parseResult;
            }
        });
    var SFTimePrototype =
    {
        _hours: 0,
        _minutes: 0,
        _seconds: 0,
        _milliseconds: 0,
        _type: "time",

        _create: function (h, m, s, mm)
        {
            if (arguments.length === 0)
            {
                var date = new Date();
                h = date.getHours();
                m = date.getMinutes();
                s = date.getSeconds();
                mm = date.getMilliseconds();
            }
            this.hours(h);
            this.minutes(m);
            this.seconds(s);
            this.milliseconds(mm);
        },

        hours: function (hours)
        {
            if (checkExists(hours))
            {
                //set
                var pHours = parseInt(hours);
                if (isNaN(pHours) || pHours < 0 || pHours > 23)
                {
                    throw Resources.RuntimeMessages.TimeInvalidPropertyMessage.format("hours", hours);
                }
                this._hours = pHours;
            }
            else
            {
                //get
                return this._hours;
            }
        },

        minutes: function (minutes)
        {
            if (checkExists(minutes))
            {
                //set
                var pMinutes = parseInt(minutes);
                if (isNaN(pMinutes) || pMinutes < 0 || pMinutes > 59)
                {
                    throw Resources.RuntimeMessages.TimeInvalidPropertyMessage.format("minutes", minutes);
                }
                this._minutes = pMinutes;
            }
            else
            {
                //get
                return this._minutes;
            }
        },

        seconds: function (seconds)
        {
            if (checkExists(seconds))
            {
                //set
                var pSeconds = parseInt(seconds);
                if (isNaN(pSeconds) || pSeconds < 0 || pSeconds > 59)
                {
                    throw Resources.RuntimeMessages.TimeInvalidPropertyMessage.format("seconds", seconds);
                }
                this._seconds = pSeconds;
            }
            else
            {
                //get
                return this._seconds;
            }
        },

        milliseconds: function (milliseconds)
        {
            if (checkExists(milliseconds))
            {
                //set
                var pMilliseconds = parseInt(milliseconds);
                if (isNaN(pMilliseconds) || pMilliseconds < 0 || pMilliseconds > 999)
                {
                    throw Resources.RuntimeMessages.TimeInvalidPropertyMessage.format("milliseconds", milliseconds);
                }
                this._milliseconds = pMilliseconds;
            }
            else
            {
                //get
                return this._milliseconds;
            }
        },

        getUTCHours: function ()
        {
            return this.hours();
        },

        getUTCMinutes: function ()
        {
            return this.minutes();
        },

        getUTCSeconds: function ()
        {
            return this.seconds();
        },

        getUTCMilliseconds: function ()
        {
            return this.milliseconds();
        },

        getHours: function ()
        {
            return this.hours();
        },

        getMinutes: function ()
        {
            return this.minutes();
        },

        getSeconds: function ()
        {
            return this.seconds();
        },

        getMilliseconds: function ()
        {
            return this.milliseconds();
        },

        setUTCHours: function (n)
        {
            return this.hours(n);
        },

        setUTCMinutes: function (n)
        {
            return this.minutes(n);
        },

        setUTCSeconds: function (n)
        {
            return this.seconds(n);
        },

        setUTCMilliseconds: function (n)
        {
            return this.milliseconds(n);
        },

        setHours: function (n)
        {
            return this.hours(n);
        },

        setMinutes: function (n)
        {
            return this.minutes(n);
        },

        setSeconds: function (n)
        {
            return this.seconds(n);
        },

        setMilliseconds: function (n)
        {
            return this.milliseconds(n);
        },

        clearUTCTime: function ()
        {
            this._hours = 0;
            this._minutes = 0;
            this._seconds = 0;
            this._milliseconds = 0;
            return this;
        },

        clearTime: function ()
        {
            this._hours = 0;
            this._minutes = 0;
            this._seconds = 0;
            this._milliseconds = 0;
            return this;
        },

        compareTo: function (t)
        {
            var _this = this;
            return DateHelper.compareTo(SFTime.keys, _this, t);
        },

        equals: function (t)
        {
            return this.compareTo(t) === 0;
        },

        toMilliseconds: function ()
        {
            return this._hours * DateHelper.units.hour +
                this._minutes * DateHelper.units.minute +
                this._seconds * DateHelper.units.second +
                this._milliseconds;
        },

        getTime: function ()
        {
            return this.toMilliseconds();
        },

        add: function (unitOfTime, units)
        {
            var lowerUnit = DateHelper.getResolutionIdentifier(unitOfTime);
            var fn = null;
            switch (lowerUnit)
            {
                case "hour":
                    fn = this.addHours;
                    break;
                case "minute":
                    fn = this.addMinutes;
                    break;
                case "second":
                    fn = this.addSeconds;
                    break;
                case "millisecond":
                    fn = this.addMilliseconds;
                    break;
            }
            if (!checkExists(fn))
            {
                throw Resources.RuntimeMessages.TimeUnitNotSupportForAddition.format(lowerUnit);
            }
            return fn.apply(this, [units]);
        },

        addTime: function (time)
        {
            return SFTime.add(this, 3, time.toMilliseconds());
        },

        addHours: function (units)
        {
            return SFTime.add(this, 0, units);
        },

        addMinutes: function (units)
        {
            return SFTime.add(this, 1, units);
        },

        addSeconds: function (units)
        {
            return SFTime.add(this, 2, units);
        },

        addMilliseconds: function (units)
        {
            return SFTime.add(this, 3, units);
        },

        fractionalDifference: function (otherDate, resolution)
        {
            resolution = DateHelper.getResolutionIdentifier(resolution);
            return (new Big(this.toMilliseconds() - otherDate.toMilliseconds())).div(DateHelper.units[resolution]);
        },

        difference: function (otherDate, resolution)
        {
            resolution = DateHelper.getResolutionIdentifier(resolution);
            var result = (this.toMilliseconds() - otherDate.toMilliseconds()) / DateHelper.units[resolution];
            if (result < 0)
            {
                result = Math.ceil(result);
            }
            else
            {
                result = Math.floor(result);
            }
            return result;
        },

        clone: function ()
        {
            return new SFTime(this._hours, this._minutes, this._seconds, this._milliseconds);
        },

        toString: function ()
        {
            var formatArray = [this._hours.toString().zeroise(2),
            this._minutes.toString().zeroise(2),
            this._seconds.toString().zeroise(2),
            this._milliseconds.toString().zeroise(3)];
            var formatString = SFTime.stringFormatSeconds;
            if (this._milliseconds > 0)
            {
                formatString = SFTime.stringFormatMilliseconds;
            }

            return formatString.format(formatArray);
        }
    };

    jQuery.extend(SFTime.prototype, SFBaseDateTimePrototype, SFTimePrototype);

    var SFDateTime;

    SourceCode.Forms.DateTime = SFDateTime = function ()
    {
        this._create.apply(this, arguments);
    };

    $.extend(SFDateTime, SFDate,
        {
            keys: ["_year", "_month", "_day", "_hours", "_minutes", "_seconds", "_milliseconds"],
            range: [9999, 12, 31, 24, 60, 60, 1000],
            stringFormat: "{0}-{1}-{2} {3}:{4}:{5}Z",
            localFormat: "{0}-{1}-{2}T{3}:{4}:{5}",
            _zeroDate: null,

            now: function (timeZone)
            {
                var date = new SFDateTime();
                if (checkExists(timeZone))
                {
                    date._timeZone = timeZone;
                }
                return date;
            },

            addTime: function (originalDate, index, units, clone)
            {
                var calculatedDate;
                if (checkExists(units.toFloat))
                {
                    units = units.toFloat();
                }
                if (!checkExists(clone) || clone === true)
                {
                    calculatedDate = originalDate.clone();
                }
                else
                {
                    calculatedDate = originalDate;
                }

                while (index > 2 && units !== 0)
                {
                    var totalUnits = (calculatedDate[SFDateTime.keys[index]] + units);
                    var datePartValue = totalUnits % SFDateTime.range[index];
                    if (datePartValue >= 0)
                    {
                        calculatedDate[SFDateTime.keys[index]] = Math.abs(datePartValue);
                    }
                    else
                    {
                        calculatedDate[SFDateTime.keys[index]] = SFDateTime.range[index] + datePartValue;
                    }

                    units = Math.floor(totalUnits / SFDateTime.range[index]);
                    index--;
                }
                if (units !== 0)
                {
                    calculatedDate = SFDateTime.addDays(calculatedDate, units, clone);
                }
                return calculatedDate;
            },

            convertTime: function (localDate, timeZone)
            {
                localDate.timeZone(timeZone);
                var offSetBefore = localDate.getTimeZoneOffset();
                SFDateTime.addTime(localDate, 4, offSetBefore, false);
                var offSetDifference = localDate.getTimeZoneOffset() - offSetBefore;
                if (offSetDifference !== 0)
                {
                    SFDateTime.addTime(localDate, 4, offSetDifference, false);
                }
            },

            parseImpl: function (input, formatObject)
            {
                var timeZone = (checkExists(formatObject) && checkExists(formatObject.timeZone)) ? formatObject.timeZone : null;
                if (input instanceof Date)
                {
                    return new SFDateTime(input.getUTCFullYear(), input.getUTCMonth() + 1, input.getUTCDate(), input.getUTCHours(), input.getUTCMinutes(), input.getSeconds(), input.getMilliseconds(), timeZone);
                }
                else if (input._type === "datetime")
                {
                    return input;
                }

                //support parsing time locally where the user only types the time and expects the current date plus that local time
                var time = (input._type === "time") ? input : SourceCode.Forms.Time.parseImpl(input, formatObject, false);
                if (checkExists(time))
                {
                    return SourceCode.Forms.DateTime.fromCurrentDateWithSFTime(time, timeZone);
                }

                if (!checkExistsNotEmpty(input))
                {
                    return null;
                }

                if (input.length !== 20)
                {
                    return null;
                }
                if (input.charAt(19) !== "Z")
                {
                    return null;
                }

                var dateTimeParts = input.removeNBSpace().split(' ');
                if (dateTimeParts.length !== 2 || dateTimeParts[0].length !== 10 || dateTimeParts[1].length !== 9)
                {
                    return null;
                }

                var typedDateParts = dateTimeParts[0].split('-');
                if (typedDateParts.length !== 3 || typedDateParts[0].length !== 4 || typedDateParts[1].length !== 2 || typedDateParts[2].length !== 2)
                {
                    return null;
                }
                if (!typedDateParts[0].isNumeric() || !typedDateParts[1].isNumeric() || !typedDateParts[2].isNumeric())
                {
                    return null;
                }
                var year = typedDateParts[0].toInt();
                var month = typedDateParts[1].toInt();
                var day = typedDateParts[2].toInt();

                var typedTimeParts = dateTimeParts[1].substr(0, 8).split(':');
                if (typedTimeParts.length !== 3 || typedTimeParts[0].length !== 2 || typedTimeParts[1].length !== 2 || typedTimeParts[2].length !== 2)
                {
                    return null;
                }
                if (!typedTimeParts[0].isNumeric() || !typedTimeParts[1].isNumeric() || !typedTimeParts[2].isNumeric())
                {
                    return null;
                }
                var hour = typedTimeParts[0].toInt();
                var minute = typedTimeParts[1].toInt();
                var second = typedTimeParts[2].toInt();

                return new SFDateTime(year, month, day, hour, minute, second, 0, timeZone);
            },

            parse: function (input, formatObject)
            {
                var parseResult = null;
                parseResult = SFDateTime.parseImpl(input, formatObject);
                if (!checkExists(parseResult))
                {

                    if (SCCultureHelper && SCCultureHelper.Current() && SCCultureHelper.Current().currentCultureName)
                    {
                        var cultureName = SCCultureHelper.Current().currentCultureName;
                        if (checkExists(formatObject) && checkExists(formatObject.cultureObject))
                        {
                            cultureName = formatObject.cultureObject.Name;
                        }
                        parseResult = SCCultureHelper.Current().parseDateOnServer(input, cultureName, "u", false);
                        if (parseResult !== null)
                        {
                            parseResult = SFDateTime.parseImpl(parseResult, formatObject);
                            if (checkExists(formatObject) && checkExists(formatObject.timeZone))
                            {
                                SFDateTime.addTime(parseResult, 4, parseResult.getTimeZoneOffset(), false);
                            }
                        }
                    }
                }

                if (parseResult === null)
                {
                    throw Resources.RuntimeMessages.DateTimeCouldNotParseMessage;
                }
                return parseResult;
            },

            fromCurrentDateWithSFTime: function (timePart, timeZone)
            {
                var datePart = new SFDateTime();
                var result = new SFDateTime(datePart._year, datePart._month, datePart._day, timePart.getUTCHours(), timePart.getUTCMinutes(), timePart.getSeconds(), timePart.getMilliseconds(), timeZone);
                if (checkExists(timeZone))
                {
                    SFDateTime.addTime(result, 4, result.getTimeZoneOffset(), false);
                }
                return result;
            },

            zeroDate: function ()
            {
                if (SFDateTime._zeroDate === null)
                {
                    SFDateTime._zeroDate = new SFDateTime(1970, 1, 1, 0, 0, 0, 0);
                }
                return SFDateTime._zeroDate;
            }
        });

    var SFDateTimePrototype =
    {
        _timeZone: "",
        _type: "datetime",

        _create: function (y, M, d, h, m, s, mm, timeZone)
        {
            if (arguments.length === 0)
            {
                var date = new Date();
                // correct to the standard date result
                y = date.getUTCFullYear();
                M = date.getUTCMonth() + 1;
                d = date.getUTCDate();
                h = date.getUTCHours();
                m = date.getUTCMinutes();
                s = date.getSeconds();
                mm = date.getMilliseconds();
            }
            this.year(y, true);
            this.month(M, true);
            this.day(d, true);
            this.hours(h);
            this.minutes(m);
            this.seconds(s);
            this.milliseconds(mm);
            this.timeZone(timeZone);
            this.validateDate();
        },

        timeZone: function (timeZone)
        {
            if (checkExists(timeZone))
            {
                //set
                this._timeZone = timeZone;
            }
            else
            {
                //get
                return this._timeZone;
            }
        },

        localDate: function ()
        {
            var returnDate = this;
            var timeZoneOffset = this.getTimeZoneOffset();
            if (timeZoneOffset !== 0)
            {
                returnDate = this.clone();
                returnDate._timeZone = null;
                returnDate = returnDate.addMinutes(0 - timeZoneOffset);
                return returnDate;
            }
            return returnDate;
        },

        getTimeZoneOffset: function ()
        {
            if (checkExistsNotEmpty(this._timeZone))
            {
                return SCCultureHelper.Current().getTimeZoneOffset(this, this._timeZone);
            }
            else
            {
                return 0;
            }
        },

        getFullYear: function ()
        {
            return this.localDate().year();
        },

        getMonth: function ()
        {
            // correct to the standard date result
            return this.localDate().getUTCMonth();
        },

        getDate: function ()
        {
            return this.localDate().getUTCDate();
        },

        getHours: function ()
        {
            return this.localDate().getUTCHours();
        },

        getMinutes: function ()
        {
            return this.localDate().getUTCMinutes();
        },

        getDayOfYear: function ()
        {
            var localDate = this.localDate();
            return SFDatePrototype.getDayOfYear.apply(localDate, arguments);
        },

        getDay: function ()
        {
            var localDate = this.localDate();
            return SFDatePrototype.getDay.apply(localDate, arguments);
        },

        setSafeFullYear: function (year, month, day)
        {
            var offSetBefore = this.getTimeZoneOffset();
            year = checkExists(year) ? parseInt(year, 10) : this._year;
            month = checkExists(month) ? parseInt(month, 10) : this._month;
            day = checkExists(day) ? parseInt(day, 10) : this._day;

            var localDate = this.localDate();
            SFDateTime.addYears(this, year - localDate._year, false);
            SFDateTime.addMonths(this, month + 1 - localDate._month, false);
            SFDateTime.addDays(this, day - localDate._day, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        setMonth: function (n)
        {
            if (!checkExists(n))
            {
                return this;
            }
            var offSetBefore = this.getTimeZoneOffset();
            n = parseInt(n, 10);
            SFDateTime.addMonths(this, n + 1 - this.localDate()._month, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        setSafeMonth: function (month, day)
        {
            var offSetBefore = this.getTimeZoneOffset();
            this.setSafeUTCFullYear(month, day);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        setDate: function (n)
        {
            if (!checkExists(n))
            {
                return this;
            }
            var offSetBefore = this.getTimeZoneOffset();
            n = parseInt(n, 10);
            var localDate = this.localDate();
            SFDateTime.addDays(this, n - localDate._day, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }

            return this;
        },

        setHours: function (n)
        {
            if (!checkExists(n))
            {
                return this;
            }
            var offSetBefore = this.getTimeZoneOffset();
            n = parseInt(n, 10);
            var localDate = this.localDate();
            SFDateTime.addTime(this, 3, n - localDate._hours, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        setMinutes: function (n)
        {
            if (!checkExists(n))
            {
                return this;
            }
            var offSetBefore = this.getTimeZoneOffset();
            n = parseInt(n, 10);
            SFDateTime.addTime(this, 4, n - this.localDate()._minutes, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        clearTime: function ()
        {
            var localDate = this.localDate();
            if (localDate === this)
            {
                return this.clearUTCTime();
            }
            else
            {
                var offSetBefore = this.getTimeZoneOffset();
                SFDateTime.addTime(this, 6, 0 - (localDate._hours * DateHelper.units.hour +
                    localDate._minutes * DateHelper.units.minute +
                    localDate._seconds * DateHelper.units.second +
                    localDate._milliseconds), false);
                var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
                if (offSetDifference !== 0)
                {
                    SFDateTime.addTime(this, 4, offSetDifference, false);
                }
            }
            return this;
        },

        convertTime: function (timeZone)
        {
            if (checkExistsNotEmpty(timeZone))
            {
                SFDateTime.convertTime(this, timeZone);
            }
        },

        increment: function (days)
        {
            var offSetBefore = this.getTimeZoneOffset();
            //TFS #742631, #760788 - Need to explicitly call .clone() because .localDate() only calls .clone() if timezoneoffset > 0
            var dtOld = this.localDate().clone();
            SFDateTime.addDays(this, days, false);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                var dtNew = this.localDate();
                var sameDay = (dtOld.year() == dtNew.year() && dtOld.month() == dtNew.month() && dtOld.day() === dtNew.day());
                //TFS #754053
                //When DLS transition occurs at midnight and there is some confusion when adding 1 day which results in a repeated day.
                //This check takes care of that
                if (sameDay)
                {
                    SFDateTime.addTime(this, 4, offSetDifference, false);
                }
            }

            return this;
        },

        decrement: function (days)
        {
            var offSetBefore = this.getTimeZoneOffset();

            SFDateTime.addDays(this, 0 - days, false);

            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                SFDateTime.addTime(this, 4, offSetDifference, false);
            }
            return this;
        },

        add: function (unitOfTime, units)
        {
            var lowerUnit = DateHelper.getResolutionIdentifier(unitOfTime);
            var fn = null;
            switch (lowerUnit)
            {
                case "year":
                    fn = this.addYears;
                    break;
                case "month":
                    fn = this.addMonths;
                    break;
                case "day":
                    fn = this.addDays;
                    break;
                case "hour":
                    fn = this.addHours;
                    break;
                case "minute":
                    fn = this.addMinutes;
                    break;
                case "second":
                    fn = this.addSeconds;
                    break;
                case "millisecond":
                    fn = this.addMilliseconds;
                    break;
            }
            if (!checkExists(fn))
            {
                throw Resources.RuntimeMessages.DateTimeUnitNotSupportForAddition.format(lowerUnit);
            }
            return fn.apply(this, [units]);
        },

        addHours: function (units)
        {
            return SFDateTime.addTime(this, 3, units);
        },

        addMinutes: function (units)
        {
            return SFDateTime.addTime(this, 4, units);
        },

        addSeconds: function (units)
        {
            return SFDateTime.addTime(this, 5, units);
        },

        addMilliseconds: function (units)
        {
            return SFDateTime.addTime(this, 6, units);
        },

        compareTo: function (t)
        {
            var _this = this;
            return DateHelper.compareTo(SFDateTime.keys, _this, t);
        },

        clone: function ()
        {
            return new SFDateTime(this._year, this._month, this._day, this._hours, this._minutes, this._seconds, this._milliseconds, this._timeZone);
        },

        getTime: function ()
        {
            return this.difference(SFDateTime.zeroDate(), "millisecond");
        },

        getLocalTime: function ()
        {
            return this.localDate().getTime();
        },

        fractionalDifference: function (otherDate, resolution)
        {
            resolution = DateHelper.getResolutionIdentifier(resolution);
            if (resolution !== "year" && resolution !== "month" && resolution !== "day")
            {
                var difference = SFDatePrototype.fractionalDifference.apply(this, [otherDate, "day"]);
                var timeDifference = SFTimePrototype.fractionalDifference.apply(this, arguments);
                difference = (new Big(timeDifference)).plus((difference * DateHelper.units.day) / DateHelper.units[resolution]);
                return difference;
            }
            return SFDatePrototype.fractionalDifference.apply(this, arguments);
        },

        difference: function (otherDate, resolution)
        {
            var difference = 0;
            resolution = DateHelper.getResolutionIdentifier(resolution);
            if (resolution !== "year" && resolution !== "month" && resolution !== "day")
            {
                difference = SFDatePrototype.difference.apply(this, [otherDate, "day"]);
                var timeDifference = SFTimePrototype.difference.apply(this, arguments);
                difference = (new Big(timeDifference)).plus((difference * DateHelper.units.day) / DateHelper.units[resolution]);
            }
            else
            {
                difference = SFDatePrototype.difference.apply(this, arguments);
            }
            return difference;
        },

        toString: function (formatString)
        {
            if (!checkExists(formatString))
            {
                formatString = SFDateTime.stringFormat;
            }
            return formatString.format(this._year.toString().zeroise(4),
                this._month.toString().zeroise(2),
                this._day.toString().zeroise(2),
                this._hours.toString().zeroise(2),
                this._minutes.toString().zeroise(2),
                this._seconds.toString().zeroise(2),
                this._milliseconds.toString().zeroise(3));
        },

        toLocalString: function ()
        {
            var localDate = this.localDate();
            return localDate.toString(SFDateTime.localFormat);
        }
    };

    jQuery.extend(SFDateTime.prototype, SFBaseDateTimePrototype, SFTimePrototype, SFDatePrototype, SFDateTimePrototype);

    var SFDuration;

    SourceCode.Forms.Duration = SFDuration = function ()
    {
        this._create.apply(this, arguments);
    };

    var SFDurationPrototype =
    {
        _years: 0,
        _months: 0,
        _weeks: 0,
        _days: 0,
        _hours: 0,
        _minutes: 0,
        _seconds: 0,
        _milliseconds: 0,
        _orginalMilliseconds: 0,
        _sign: "",

        _create: function (ms)
        {
            var years = 0,
                quarters = 0,
                months = 0,
                weeks = 0,
                days = 0,
                hours = 0,
                minutes = 0,
                seconds = 0,
                milliseconds = Math.abs(ms), monthsFromDays;

            if (ms < 0)
            {
                this._sign = "-";
            }

            this._orginalMilliseconds = milliseconds;

            this._milliseconds = +milliseconds +
                seconds * DateHelper.units.second +
                minutes * DateHelper.units.minute +
                hours * DateHelper.units.hour;

            this._days = +days +
                weeks * 7;

            this._months = +months +
                quarters * 3 +
                years * 12;

            // The following code propagates values
            this._milliseconds = milliseconds % 1000;

            seconds = Math.floor(milliseconds / 1000);
            this._seconds = seconds % 60;

            minutes = Math.floor(seconds / 60);
            this._minutes = minutes % 60;

            hours = Math.floor(minutes / 60);
            this._hours = hours % 24;
            DateHelper.units.day

            days += Math.floor(hours / 24);

            monthsFromDays = Math.floor(this._daysToMonths(days));
            months += monthsFromDays;
            days -= Math.ceil(this._monthsToDays(monthsFromDays));

            years = Math.floor(months / 12);
            months %= 12;

            this._days = days;
            this._months = months;
            this._years = years;
        },
        _daysToMonths: function (days)
        {
            return days * 4800 / 146097;
        },
        _monthsToDays: function (months)
        {
            return months * 146097 / 4800;
        },
        toString: function (formatString, cultureObject)
        {
            if (!checkExists(formatString))
            {
                formatString = "FriendlyShortUnits";
            }

            if (!checkExists(cultureObject))
            {
                cultureObject = SCCultureHelper.current.getCultureObject(SCCultureHelper.current.currentCultureName);
            }

            var sign = this._sign;

            if (sign === "-")
            {
                sign = cultureObject.NegativeSign;
            }

            if (formatString === "TimeSpan")
            {
                var hours = Math.floor(this._orginalMilliseconds / 3600000);

                return sign + hours.toString().zeroise(2) + ":" + this._minutes.toString().zeroise(2) + ":" + this._seconds.toString().zeroise(2);
            }
            else //the default which caters for 2 levels of short resolutions.
            {
                //the default format we'll return
                var _space = " ";
                var _yearString;
                var _monthString;
                var _dayString;
                var _hourString;
                var _minuteString;
                var _secondString;
                var _millisecondsString;
                var _coTimeUnits = cultureObject.DateTimeSettings.ShortTimeUnitNames;

                function _getUnitString(coTimeUnits, unitName)
                {
                    for (var i = 0; i < coTimeUnits.length; i++)
                    {
                        if (coTimeUnits[i].Name === unitName)
                        {
                            return coTimeUnits[i].Text;
                        }
                    }
                }

                switch (formatString)
                {
                    case "FriendlyLongUnits":
                        _coTimeUnits = cultureObject.DateTimeSettings.LongTimeUnitNames;
                        _yearString = _space + (this._years == 1 ? _getUnitString(_coTimeUnits, "Years_Singular") : _getUnitString(_coTimeUnits, "Years"));
                        _monthString = _space + (this._months == 1 ? _getUnitString(_coTimeUnits, "Months_Singular") : _getUnitString(_coTimeUnits, "Months"));
                        _dayString = _space + (this._days == 1 ? _getUnitString(_coTimeUnits, "Days_Singular") : _getUnitString(_coTimeUnits, "Days"));
                        _hourString = _space + (this._hours == 1 ? _getUnitString(_coTimeUnits, "Hours_Singular") : _getUnitString(_coTimeUnits, "Hours"));
                        _minuteString = _space + (this._minutes == 1 ? _getUnitString(_coTimeUnits, "Minutes_Singular") : _getUnitString(_coTimeUnits, "Minutes"));
                        _secondString = _space + (this._seconds == 1 ? _getUnitString(_coTimeUnits, "Seconds_Singular") : _getUnitString(_coTimeUnits, "Seconds"));
                        _millisecondsString = _space + (this._milliseconds == 1 ? _getUnitString(_coTimeUnits, "Milliseconds_Singular") : _getUnitString(_coTimeUnits, "Milliseconds"));
                        break;
                    case "FriendlyMediumUnits":
                        _coTimeUnits = cultureObject.DateTimeSettings.MediumTimeUnitNames;
                        _yearString = (this._years == 1 ? _getUnitString(_coTimeUnits, "Years_Singular") : _getUnitString(_coTimeUnits, "Years"));
                        _monthString = (this._months == 1 ? _getUnitString(_coTimeUnits, "Months_Singular") : _getUnitString(_coTimeUnits, "Months"));
                        _dayString = (this._days == 1 ? _getUnitString(_coTimeUnits, "Days_Singular") : _getUnitString(_coTimeUnits, "Days"));
                        _hourString = (this._hours == 1 ? _getUnitString(_coTimeUnits, "Hours_Singular") : _getUnitString(_coTimeUnits, "Hours"));
                        _minuteString = (this._minutes == 1 ? _getUnitString(_coTimeUnits, "Minutes_Singular") : _getUnitString(_coTimeUnits, "Minutes"));
                        _secondString = (this._seconds == 1 ? _getUnitString(_coTimeUnits, "Seconds_Singular") : _getUnitString(_coTimeUnits, "Seconds"));
                        _millisecondsString = (this._milliseconds == 1 ? _getUnitString(_coTimeUnits, "Milliseconds_Singular") : _getUnitString(_coTimeUnits, "Milliseconds"));
                        break;
                    case "FriendlyShortUnits":
                    default:
                        _coTimeUnits = cultureObject.DateTimeSettings.ShortTimeUnitNames;
                        _yearString = _getUnitString(_coTimeUnits, "Years");
                        _monthString = _getUnitString(_coTimeUnits, "Months");
                        _dayString = _getUnitString(_coTimeUnits, "Days");
                        _hourString = _getUnitString(_coTimeUnits, "Hours");
                        _minuteString = _getUnitString(_coTimeUnits, "Minutes");
                        _secondString = _getUnitString(_coTimeUnits, "Seconds");
                        _millisecondsString = _getUnitString(_coTimeUnits, "Milliseconds");
                        break;
                }

                function getDurationString(unit, unitLabel, o)
                {
                    if (unit > 0 && o.remainingDisplayCount > 0)
                    {
                        o.durationString += unit + unitLabel + _space;
                    }

                    if (o.durationString !== "")
                    {
                        o.remainingDisplayCount--;
                    }
                }

                var options =
                {
                    durationString: "",
                    remainingDisplayCount: 2 //This is used to control how many levels of detail will be displayed.
                }

                getDurationString(this._years, _yearString, options);
                getDurationString(this._months, _monthString, options);
                getDurationString(this._days, _dayString, options);
                getDurationString(this._hours, _hourString, options);
                getDurationString(this._minutes, _minuteString, options);
                getDurationString(this._seconds, _secondString, options);
                getDurationString(this._milliseconds, _millisecondsString, options);

                return sign + options.durationString.trim();
            }
        },
        formatDuration: function (formatObject)
        {
            if (formatObject === undefined)
                formatObject = "ymmdhmis";

            var _space = " ";
            var returnString = "";

            if (this._years > 0 && formatObject.contains("y")) //ensure y specified in format string
            {
                returnString += this._years + DateHelper.getShortResolutionIdentifier("y") + _space;
            }
            else
            {
                this._months += Math.floor(this._years * 12); //0 + 0 still equals 0
            }
            if (this._months > 0 && formatObject.contains("mm"))
            {
                returnString += this._months + DateHelper.getShortResolutionIdentifier("m") + _space;
            }
            else
            {
                this._days += Math.floor(this._monthsToDays(this._months));
            }

            if (this._days > 0 && formatObject.contains("d"))
            {
                returnString += this._days + DateHelper.getShortResolutionIdentifier("d") + _space;
            }
            else
            {
                this._hours += this._days * 24;
            }

            if (this._hours > 0 && formatObject.contains("h"))
            {
                returnString += this._hours + DateHelper.getShortResolutionIdentifier("h") + _space;
            }
            else
            {
                this._minutes += this._days * 3600;
            }

            if (this._minutes > 0 && formatObject.contains("mi"))
            {
                returnString += this._minutes + DateHelper.getShortResolutionIdentifier("mi") + _space;
            }
            else
            {
                this._seconds += this._minutes * 60;
            }

            if (this._seconds > 0 && formatObject.contains("s"))
            {
                returnString += this._seconds + DateHelper.getShortResolutionIdentifier("s") + _space;
            }
            else
            {
                this._milliseconds = this._seconds * 1000;
            }
            if (this._milliseconds > 0 && formatObject.contains("f"))
            {
                returnString += this._seconds + DateHelper.getShortResolutionIdentifier("ms") + _space;
            }
            return returnString;
        }
    };

    jQuery.extend(SFDuration.prototype, SFDurationPrototype);

})(jQuery);
