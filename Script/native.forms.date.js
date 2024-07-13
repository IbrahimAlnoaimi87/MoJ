/*
Script: SourceCode.Forms.Date.js
Contains Date prototypes, and date utility functions
	
Credit:
Originally by Nicholas Barthelemy for Jester <https://svn.nbarthelemy.com/date-js/>

*/
(function ($)
{
    if (!Date.prototype.clone)
    {
		/*
		Method: clone
		Creates a copy of this date object

		Syntax:
		>myDate.clone();

		Returns:
		(object) A copy of this date object

		Example:
		(start code)
		var myDate = Date.parse("May 3, 2006");
		var newDate = myDate.clone(); // newDate = 'May 3, 2006'
		(end)
		*/

        Date.prototype.clone = function ()
        {
            return new Date(this.getTime());
        }
        //Date.clone = Date.prototype.clone;
    }
    if (!Date.prototype.clearTime)
    {
		/*
		Method: clearTime
		Clears the time from the value of the date object

		Syntax:
		>myDate.clearTime();
		
		Returns:
		(object) This object with the time values cleared

		Example:
		(start code)
		var myDate = Date.parse("2007-06-08 16:34:52"); // 'June 8, 2007 16:34:52'
		myDate.clearTime(); // 'June 8, 2007 00:00:00'
		(end)
		*/

        Date.prototype.clearTime = function ()
        {
            this.setHours(0);
            this.setMinutes(0);
            this.setSeconds(0);
            this.setMilliseconds(0);
            return this;
        }
        //Date.clearTime = Date.prototype.clearTime;
    }

    if (!Date.prototype.fractionalDifference)
    {
        Date.prototype.fractionalDifference = function (otherDate, resolution)
        {
            if ($type(otherDate) == 'string')
            {
                otherDate = Date.parse(otherDate);
            }
            if (!checkExists(resolution))
            {
                resolution = "day";
            }
            resolution = SourceCode.Forms.DateHelper.getResolutionIdentifier(resolution);
            var dayDifference = 0, fractionalDiff = 0;
            if (resolution === "year" || resolution === "month")
            {
                //US 30/360 http://en.wikipedia.org/wiki/Day_count_convention#30.2F360_methods
                //this is the defualt in excel
                var y1 = new Big(otherDate.getFullYear());
                var y2 = new Big(this.getFullYear());

                var m1 = new Big(otherDate.getMonth());
                var m2 = new Big(this.getMonth());
                var d1, d2;
                var d1 = (m1.eq(1) && otherDate.getDate() === Date.daysInMonth(m1, y1)) ? new Big(30) : new Big(otherDate.getDate());
                var d2 = (m2.eq(1) && this.getDate() === Date.daysInMonth(m2, y2)) ? new Big(30) : new Big(this.getDate());

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
                dayDifference = new Big(this.difference(otherDate, "day"));
                //time part
                //t-sql does not calulate time diff for >day
                var t1 = otherDate.getHours() * SourceCode.Forms.DateHelper.units.hour + otherDate.getMinutes() * SourceCode.Forms.DateHelper.units.minute + otherDate.getSeconds() * SourceCode.Forms.DateHelper.units.second + otherDate.getMilliseconds();
                var t2 = this.getHours() * SourceCode.Forms.DateHelper.units.hour + this.getMinutes() * SourceCode.Forms.DateHelper.units.minute + this.getSeconds() * SourceCode.Forms.DateHelper.units.second + this.getMilliseconds();

                if (resolution === "day")
                {
                    var timeDifference = (new Big(t2 - t1)).div(SourceCode.Forms.DateHelper.units.day);
                    fractionalDiff = timeDifference.plus(dayDifference);
                }
                else
                {
                    fractionalDiff = (dayDifference.times(SourceCode.Forms.DateHelper.units.day).plus(new Big(t2 - t1))).div(SourceCode.Forms.DateHelper.units[resolution]);
                }
            }
            return fractionalDiff;
        }
    }

    if (!Date.prototype.difference)
    {
        Date.prototype.difference = function (d, resolution)
        {
            if ($type(d) == 'string')
            {
                d = Date.parse(d);
            }

            var years = this.getFullYear() - d.getFullYear();
            var months = this.getMonth() - d.getMonth();
            var difference = 0;
            resolution = SourceCode.Forms.DateHelper.getResolutionIdentifier(resolution);
            switch (resolution)
            {
                case "year":
                    difference = years;
                    break;
                case "month":
                    difference = years * 12 + months;
                    break;
                case "day":
                    difference = SourceCode.Forms.DateHelper.getDayDifferenceBetweenTwoDates(this, d);
                    break;
            }
            return difference;
        }
    }

    if (!Date.prototype.getOrdinal)
    {
        Date.prototype.getOrdinal = function ()
        {
            var str = this.toString();
            var test = str.substr(-(Math.min(str.length, 2)));
            return (test > 3 && test < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(this % 10, 4)];
        }
    }
    if (!Date.prototype.getDayOfYear)
    {
		/*
		Method: getDayOfYear
		Gets the day of the year for this date object

		Syntax:
		>myDate.getDayOfYear();
		
		Returns:
		(number) The number representation of the day of the year

		Example:
		(start code)
		var myDate = Date.parse("2007-06-08 16:34:52"); // 'June 8, 2007 16:34:52'
		myDate.getDayOfYear(); // returns 159
		(end)
		*/

        Date.prototype.getDayOfYear = function ()
        {
            return ((Date.UTC(this.getFullYear(), this.getMonth(), this.getDate() + 1, 0, 0, 0)
                - Date.UTC(this.getFullYear(), 0, 1, 0, 0, 0)) / SourceCode.Forms.DateHelper.units.day);
        }
    }
    if (!Date.prototype.lastDayofMonth)
    {
		/*
		Method: lastDayofMonth
		Gets the last day of the month for this date object

		Syntax:
		>myDate.lastDayofMonth();
		
		Returns:
		(number) The last of the day of the month of this date object

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.lastDayofMonth(); // returns 28
		(end)
		*/

        Date.prototype.lastDayofMonth = function ()
        {
            var ret = this.clone();
            ret.setMonth(ret.getMonth() + 1, 0);
            return ret.getDate();
        }
    }
    if (!Date.prototype.getWeek)
    {
		/*
		Method: getWeek
		Gets the week of the month for this date object

		Syntax:
		>myDate.getWeek();
		
		Returns:
		(number) The number representation of the week of the year

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.getWeek(); // returns 6
		(end)
		*/

        Date.prototype.getWeek = function (weekStart)
        {
            if (checkExists(SourceCode.Forms.Settings)
                && checkExists(SourceCode.Forms.Settings.Compatibility)
                && checkExists(SourceCode.Forms.Settings.Compatibility.DateWeekNumberLegacyLogic)
                && SourceCode.Forms.Settings.Compatibility.DateWeekNumberLegacyLogic)
            {
                var day = (new Date(this.getFullYear(), 0, 1)).getDate();
                return Math.round((this.getDayOfYear() + (day > 3 ? day - 4 : day + 3)) / 7);
            }
            else
            {
                weekStart = weekStart || 0;
                return Math.ceil((this.getDayOfYear() + (new Date(this.getFullYear(), 0, 1)).getDay() - weekStart) / 7);
            }
        }
    }
    if (!Date.prototype.getTimezone)
    {
		/*
		DEPRECATED. This should no longer be used
		Method: getTimezone
		Gets the timezone for this date object

		Syntax:
		>myDate.getTimezone();
		
		Returns:
		(string) The timezone of the date object

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.getTimezone(); // returns 'GMT' in Firefox & 'UTC' in IE
		(end)
		*/

        Date.prototype.getTimezone = function ()
        {
            console.warn("getTimezone has been deprecated");
            return this.toString()
                .replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
                .replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
        }
    }
    if (!Date.prototype.getGMTOffset)
    {
		/*
		DEPRECATED. This should no longer be used
		Method: getGMTOffset
		Gets the GMT Offset for this date object

		Syntax:
		>myDate.getGMTOffset();
		
		Returns:
		(string) The GMT offset of the date object

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.getGMTOffset(); // returns '+0200'
		(end)
		*/

        Date.prototype.getGMTOffset = function ()
        {
            console.warn("getGMTOffset has been deprecated");
            var off = this.getTimezoneOffset();
            return ((off > 0) ? '-' : '+')
                + Math.floor(Math.abs(off) / 60).zeroise(2)
                + (off % 60).zeroise(2);
        }
    }
    if (!Date.prototype.isLeapYear)
    {
		/*
		Method: isLeapYear
		Checks to see if the date is in a leap year

		Syntax:
		>myDate.isLeapYear();
		
		Returns:
		(string) The GMT offset of the date object

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.isLeapYear(); // returns false
		(end)
		*/

        Date.prototype.isLeapYear = function ()
        {
            return Date.isLeapYear(this.getYear());
        }
    }
    if (!Date.prototype.daysInMonth)
    {
		/*
		Method: daysInMonth
		Gets the number of days in the month of the date object

		Syntax:
		>myDate.daysInMonth();
		
		Returns:
		(number) The number of days in the month of the date object

		Example:
		(start code)
		var myDate = Date.parse("2007-02-08 16:34:52");
		myDate.daysInMonth(); // returns 28
		(end)
		*/

        Date.prototype.daysInMonth = function ()
        {
            return Date.daysInMonth(this.getMonth(), this.getYear());
        }
    }

	/*
	Method: setSafeMonth
	Will attempt to set a month 
	If the day is passed through this will be used provided the month has that number of days
	If the day of the date or the day passed through is greater than the number of days in the proposed month 
	the last possible day of that month will be selected
	The year of the month will account for leap years


	Syntax:
	>myDate.setSafeMonth(month,day(optional));
		
	Arguments:
	month - (int) 0-11 
	day -(int) 1-31 [this is optional]
		


	Example:
	*/
    if (!Date.prototype.setSafeUTCMonth)
    {
        Date.prototype.setSafeUTCMonth = function (month, day)
        {
            var year = this.getUTCFullYear();
            month = parseInt(month);
            var daysInProposedMonth = Date.daysInMonth(month, year);
            var dayToSet = checkExists(day) ? parseInt(day) : this.getUTCDate();
            if (dayToSet > daysInProposedMonth - 1)
            {
                dayToSet = daysInProposedMonth - 1;
            }
            var utcValue = Date.UTC(year, month, dayToSet, this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds(), this.getUTCMilliseconds());
            this.setTime(utcValue);
        }
    }
	/*
	Method: setSafeUTCFullYear
	Will attempt to set a year 
	If the day is passed through this will be used provided the month has that number of days
	If the day of the date or the day passed through is greater than the number of days in the proposed month 
	the last possible day of that month will be selected
	The year of the month will account for leap years


	Syntax:
	>myDate.setSafeUTCFullYear(month,day(optional));
		
	Arguments:
	year - 4 digit full year
	month - (int) 0-11 
	day -(int) 1-31 [this is optional]
		


	Example:
	*/
    if (!Date.prototype.setSafeUTCFullYear)
    {
        Date.prototype.setSafeUTCFullYear = function (year, month, day)
        {
            year = parseInt(year);
            var monthToSet = checkExists(month) ? parseInt(month) : this.getUTCMonth();
            var daysInProposedMonth = Date.daysInMonth(monthToSet, year);
            var dayToSet = checkExists(day) ? parseInt(day) : this.getUTCDate();
            if (dayToSet > daysInProposedMonth - 1)
            {
                dayToSet = daysInProposedMonth - 1;
            }
            var utcValue = Date.UTC(year, monthToSet, dayToSet, this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds(), this.getUTCMilliseconds());
            this.setTime(utcValue);
        }
    }

	/*
	Method: setSafeMonth
	Will attempt to set a month 
	If the day is passed through this will be used provided the month has that number of days
	If the day of the date or the day passed through is greater than the number of days in the proposed month 
	the last possible day of that month will be selected
	The year of the month will account for leap years


	Syntax:
	>myDate.setSafeMonth(month,day(optional));
		
	Arguments:
	month - (int) 0-11 
	day -(int) 1-31 [this is optional]
		


	Example:
	*/
    if (!Date.prototype.setSafeMonth)
    {
        Date.prototype.setSafeMonth = function (month, day)
        {
            var offSetBefore = this.getTimeZoneOffset();
            var year = this.getFullYear();
            month = parseInt(month);
            var daysInProposedMonth = Date.daysInMonth(month, year);
            var dayToSet = checkExists(day) ? parseInt(day) : this.getDate();
            if (dayToSet > daysInProposedMonth)
            {
                dayToSet = daysInProposedMonth;
            }
            this.setDate(1);
            this.setMonth(month);
            this.setDate(dayToSet);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                this.setTime(this.getTime() + offSetDifference * 1000 * 60);
            }
            return this;
        }
    }
	/*
	Method: setSafeFullYear
	Will attempt to set a year 
	If the day is passed through this will be used provided the month has that number of days
	If the day of the date or the day passed through is greater than the number of days in the proposed month 
	the last possible day of that month will be selected
	The year of the month will account for leap years


	Syntax:
	>myDate.setSafeUTCFullYear(month,day(optional));
		
	Arguments:
	year - 4 digit full year
	month - (int) 0-11 
	day -(int) 1-31 [this is optional]
		


	Example:
	*/
    if (!Date.prototype.setSafeFullYear)
    {
        Date.prototype.setSafeFullYear = function (year, month, day)
        {
            var offSetBefore = this.getTimeZoneOffset();
            year = parseInt(year);
            var monthToSet = checkExists(month) ? parseInt(month) : this.getMonth();
            var daysInProposedMonth = Date.daysInMonth(monthToSet, year);
            var dayToSet = checkExists(day) ? parseInt(day) : this.getDate();
            if (dayToSet > daysInProposedMonth)
            {
                dayToSet = daysInProposedMonth;
            }
            this.setDate(1);
            this.setFullYear(year);
            this.setMonth(month);
            this.setDate(dayToSet);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                this.setTime(this.getTime() + offSetDifference * 1000 * 60);
            }
            return this;
        }
    }
    if (!Date.prototype.parse)
    {
		/*
		Method: parse
		Parses a string representation of a date and sets it as the value of the date object

		Syntax:
		>myDate.parse(str);
		
		Arguments:
		str - (string) The string representation of a date
		
		Returns:
		(object) The date object set to the value of the date string parsed

		Example:
		(start code)
		var myDate = new Date();
		myDate.parse("10/12/1982");
		myDate.parse("2007-02-08 16:34:52");
		myDate.parse("2007-06-08T16:34:52+0200");
		myDate.parse("today");
		myDate.parse("tomorrow");
		myDate.parse("yesterday");
		myDate.parse("next monday");
		myDate.parse("1st");
		myDate.parse("14th October");
		myDate.parse("24th May, 2007");
		myDate.parse("May 3rd 2006");
		(end)
		*/

        Date.prototype.parse = function (str)
        {
            this.setTime(Date.parse(str));
            return this;
        }
    }
    if (!Date.prototype.clone)
    {
        Date.prototype.clone = function ()
        {
            return new Date(this.getTime());
        }
    }
    if (!Date.prototype.increment)
    {
        Date.prototype.increment = function (days)
        {
            var timeZoneOffsetBefore = this.getTimezoneOffset();
            var dtOld = this.clone();
            var dayInMilliseconds = 86400000;
            var numberOfDays = checkExists(days) ? days : 1;
            var newTime = this.getTime() + (dayInMilliseconds * numberOfDays);
            this.setTime(newTime);
            var timeZoneOffsetAfter = this.getTimezoneOffset();
            if (timeZoneOffsetBefore != timeZoneOffsetAfter)
            {
                var dtNew = this.clone();
                var sameDay = (dtOld.getFullYear() == dtNew.getFullYear() && dtOld.getMonth() == dtNew.getMonth() && dtOld.getDate() === dtNew.getDate());
                //TFS #754053
                //When DLS transition occurs at midnight and there is some confusion when adding 1 day which results in a repeated day.
                //This check takes care of that
                if (sameDay)
                {
                    var hoursInMilliseconds = 60000;
                    newTime = this.getTime() + ((timeZoneOffsetAfter - timeZoneOffsetBefore) * hoursInMilliseconds);
                    this.setTime(newTime);
                }
            }
            return this;
        }
    }
    if (!Date.prototype.decrement)
    {
        Date.prototype.decrement = function (days)
        {
            var timeZoneOffsetBefore = this.getTimezoneOffset();
            var dayInMilliseconds = 86400000;

            var numberOfDays = checkExists(days) ? days : 1;
            var newTime = this.getTime() - (dayInMilliseconds * numberOfDays);
            this.setTime(newTime);
            var timeZoneOffsetAfter = this.getTimezoneOffset();
            if (timeZoneOffsetBefore != timeZoneOffsetAfter)
            {
                var hoursInMilliseconds = 60000;
                newTime = this.getTime() + ((timeZoneOffsetAfter - timeZoneOffsetBefore) * hoursInMilliseconds);
                this.setTime(newTime);
            }
            return this;
        }
    }

    if (!Date.prototype.compare)
        Date.prototype.compare = Date.prototype.diff;
    if (!Date.prototype.strftime)
        Date.prototype.strftime = Date.prototype.format;

    if (!Date.prototype.compareTo)
    {
        Date.prototype.compareTo = function (date)
        {
            comparison = this.getTime() > date.getTime();
            if (comparison === true)
            {
                comparison = 1;
            }
            else
            {
                var equal = this.getTime() === date.getTime();
                if (equal)
                {
                    comparison = 0;
                }
                else
                {
                    comparison = -1;
                }
            }
            return comparison;
        }
    }

    if (!Date.prototype.equals)
    {
        Date.prototype.equals = function (date)
        {
            return this.getTime() === date.getTime();
        }
    }

    if (!Date.prototype.getTimeZoneOffset)
    {
        Date.prototype.getTimeZoneOffset = function (date)
        {
            return this.getTimezoneOffset();
        }
    }

    if (!Date.prototype.convertTime)
    {
        Date.prototype.convertTime = function ()
        {
            var offSetBefore = this.getTimeZoneOffset();
            this.setTime(this.getTime() + offSetBefore * 1000 * 60);
            var offSetDifference = this.getTimeZoneOffset() - offSetBefore;
            if (offSetDifference !== 0)
            {
                this.setTime(this.getTime() + offSetDifference * 1000 * 60);
            }
        }
    }

    if (!Date.prototype.getLocalTime)
    {
        Date.prototype.getLocalTime = function ()
        {
            return this.getTime() - this.getTimeZoneOffset() * SourceCode.Forms.DateHelper.units.minute;
        }
    }

    // Todo: implement some way to you cultureInfo Hash Objects
    Date.$months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    Date.$days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    Date.$daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    Date.$epoch = -1;
    Date.$era = -2;
    Date.$formats =
    {
        db: '%Y-%m-%d %H:%M:%S',
        iso8601: '%Y-%m-%dT%H:%M:%S%T',
        rfc822: '%a, %d %b %Y %H:%M:%S %Z',
        'short': '%d %b %H:%M',
        'long': '%B %d, %Y %H:%M'
    };
    Date.isLeapYear = function (year)
    {

        if ((year % 400) === 0)
        {
            return true;
        } else if ((year % 100) === 0)
        {
            return false;
        } else if ((year % 4) === 0)
        {
            return true;
        }
        return false;

    };
    Date.daysInMonth = function (month, year)
    {
        month = (month + 12) % 12;
        if (month === 1 && Date.isLeapYear(year)) return 29;
        return Date.$daysInMonth[month];
    };
    Date.parseMonth = function (month, num)
    {
        var ret = -1;
        switch ($type(month))
        {
            case 'object':
                ret = Date.$months[month.getMonth()];
                break;
            case 'number':
                ret = Date.$months[month - 1] || false;
                if (!ret) throw new Error('Invalid month index value must be between 1 and 12:' + index);
                break;
            case 'string':
                var match = Date.$months.filter(function (name)
                {
                    return this.test(name);
                }, new RegExp('^' + month, 'i'));
                if (!match.length) throw new Error('Invalid month string');
                if (match.length > 1) throw new Error('Ambiguous month');
                ret = match[0];
        }
        return (num) ? Date.$months.indexOf(ret) : ret;
    };
    Date.parseDay = function (day, num)
    {
        var ret = -1;
        switch ($type(day))
        {
            case 'number':
                ret = Date.$days[day - 1] || false;
                if (!ret) throw new Error('Invalid day index value must be between 1 and 7');
                break;
            case 'string':
                var match = Date.$days.filter(function (name)
                {
                    return this.test(name);
                }, new RegExp('^' + day, 'i'));
                if (!match.length) throw new Error('Invalid day string');
                if (match.length > 1) throw new Error('Ambiguous day');
                ret = match[0];
        }
        return (num) ? Date.$days.indexOf(ret) : ret;
    };
    Date.$parsePatterns =
        [
            //Removed faulty bad pattern
            //        {
            //            // mm/dd/yyyy (American style)
            //            re: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
            //            handler: function (bits)
            //            {
            //                var d = new Date();
            //                d.setYear(bits[3]);
            //                d.setMonth(bits[1].toInt() - 1, bits[2].toInt());
            //                return d;
            //            }
            //        },
            {
                // yyyy-mm-ddTHH:MM:SS-0500 (ISO8601) i.e.2007-04-17T23:15:22Z
                // inspired by <http://delete.me.uk/2005/03/iso8601.html>
                re: /^(\d{4})(?:-?(\d{2})(?:-?(\d{2})(?:[T ](\d{2})(?::?(\d{2})(?::?(\d{2})(?:\.(\d+))?)?)?(?:Z|(?:([-+])(\d{2})(?::?(\d{2}))?)?)?)?)?)?$/,
                handler: function (bits)
                {
                    var offset = 0;
                    var d = new Date(bits[1], 0, 1);
                    if (bits[2]) d.setMonth(bits[2] - 1);
                    if (bits[3]) d.setDate(bits[3]);
                    if (bits[4]) d.setHours(bits[4]);
                    if (bits[5]) d.setMinutes(bits[5]);
                    if (bits[6]) d.setSeconds(bits[6]);
                    if (bits[7]) d.setMilliseconds(('0.' + bits[7]).toInt() * 1000);
                    if (bits[9])
                    {
                        offset = (bits[9].toInt() * 60) + bits[10].toInt();
                        offset *= ((bits[8] == '-') ? 1 : -1);
                    }
                    offset -= d.getTimezoneOffset();
                    d.setTime((d * 1) + (offset * 60 * 1000).toInt())
                    return d;
                }
            },
            {
                // Today
                re: /^tod/i,
                handler: function ()
                {
                    return new Date();
                }
            },
            {
                // Tomorrow
                re: /^tom/i,
                handler: function ()
                {
                    var d = new Date();
                    d.setDate(d.getDate() + 1);
                    return d;
                }
            },
            {
                // Yesterday
                re: /^yes/i,
                handler: function ()
                {
                    var d = new Date();
                    d.setDate(d.getDate() - 1);
                    return d;
                }
            },
            {
                // 4th
                re: /^(\d{1,2})(st|nd|rd|th)?$/i,
                handler: function (bits)
                {
                    var d = new Date();
                    d.setDate(bits[1].toInt());
                    return d;
                }
            },
            {
                // 4th Jan
                re: /^(\d{1,2})(?:st|nd|rd|th)? (\w+)$/i,
                handler: function (bits)
                {
                    var d = new Date();
                    d.setMonth(Date.parseMonth(bits[2], true), bits[1].toInt());
                    return d;
                }
            },
            {
                // 4th Jan 2003
                re: /^(\d{1,2})(?:st|nd|rd|th)? (\w+),? (\d{4})$/i,
                handler: function (bits)
                {
                    var d = new Date();
                    d.setMonth(Date.parseMonth(bits[2], true), bits[1].toInt());
                    d.setYear(bits[3]);
                    return d;
                }
            },
            {
                // Jan 4th 2003
                re: /^(\w+) (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/i,
                handler: function (bits)
                {
                    var d = new Date();
                    d.setMonth(Date.parseMonth(bits[1], true), bits[2].toInt());
                    d.setYear(bits[3]);
                    return d;
                }
            },
            {
                // next Tuesday - this is suspect due to weird meaning of "next"
                re: /^next (\w+)$/i,
                handler: function (bits)
                {
                    var d = new Date();
                    var day = d.getDay();
                    var newDay = Date.parseDay(bits[1], true);
                    var addDays = newDay - day;
                    if (newDay <= day)
                    {
                        addDays += 7;
                    }
                    d.setDate(d.getDate() + addDays);
                    return d;
                }
            },
            {
                // last Tuesday
                re: /^last (\w+)$/i,
                handler: function (bits)
                {
                    throw new Error('Not yet implemented');
                }
            }
        ];

    Date.fromSFDateAndSFTime = function (datePart, timePart)
    {
        return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds());
    };

    Date.fromSFDateAndSFTimeUTC = function (datePart, timePart)
    {
        return new Date(Date.UTC(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds()));
    };

    Date.fromSFDate = function (datePart)
    {
        return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
    };

    Date.fromSFDateUTC = function (datePart)
    {
        return new Date(Date.UTC(datePart.getFullYear(), datePart.getMonth(), datePart.getDate()));
    };

    Date.fromSFTime = function (timePart)
    {
        return new Date(0, 0, 0, timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds());
    };

    Date.fromCurrentDateWithSFTime = function (timePart)
    {
        var now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds());
    };

    Date.fromSFTimeUTC = function (timePart)
    {
        return new Date(Date.UTC(0, 0, 0, timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds()));
    };

    if (typeof Date.$nativeParse === "undefined")
    {
        Date.$nativeParse = Date.parse;
    }
    Date.parse = function (from)
    {
        var type = $type(from);
        if (type == 'number') return new Date(str);
        if (type != 'string') return from;
        if (!from.length) return null;
        for (var i = 0, j = Date.$parsePatterns.length; i < j; i++)
        {
            var r = Date.$parsePatterns[i].re.exec(from);
            if (r) return Date.$parsePatterns[i].handler(r);
        }
        return new Date(Date.$nativeParse(from));
    };

})(jQuery);
