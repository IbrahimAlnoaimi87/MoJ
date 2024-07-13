//for the currect operation of the calendar an initialized  SCCultureHelper.Current() must be available as a global
Calendar = function (useValidation)
{
    this.lastDateOnScreen = null;
    this.firstDateOnScreen = null;
    this.selectedDay = null;
    this.selectedHours = null;
    this.selectedMinutes = null;
    this.selectedSeconds = null;
    this.calendarContentType = null;
    this.currentDate = null;

    this.element = null;
    this.calendarPopup = null;
    this.popupOverCalendar = false;
    this.contentElement = null;
    this.titleElement = null;
    this.selectedElement = null;

    this.clickButtonCount = 0;
    this.calendarUpdateObjects = [];
    this.currentCalendarUpdateObject = null;
    this.useValidation = (checkExists(useValidation)) ? useValidation : true; //Default is true

    this.allowAnimation = true;
    this.keyPressEventAdded = false;
    this._initialize();
};

Calendar.prototype = {

    _initialize: function ()
    {
        this.selectedDay = null;
        this.selectedHours = null;
        this.selectedMinutes = null;
        this.selectedSeconds = null;
        this._drawBasicCalendarOutline();
        this.mode = "day";
        this.leftKey = 37;
        this.upKey = 38;
        this.rightKey = 39;
        this.downKey = 40;
        this.enterKey = 13;
        this.escKey = 27;
        this.spaceKey = 32;
        this.tabKey = 9;
        this.previousSelectedDay = this.selectedDay;
    },




    addCalendarUpdateObject: function (textbox, button, calendarPickerOptions)
    {
        if (!this.hasCalendarUpdateObject(textbox, button))
        {
            var calObj = this.getCalendarUpdateObject(textbox, button);

            var existingCalObj = checkExists(calObj);

            if (!existingCalObj)
            {
                calObj = new CalendarUpdateObject(textbox, button, calendarPickerOptions, this);
            }

            calObj.button.off(".calupdateobjectevents");
            calObj.textbox.off(".calupdateobjectevents");

            calObj.button.on("click.calupdateobjectevents", [this, calObj], this._popupCalendarOnClick);
            calObj.button.on("keydown.calupdateobjectevents", [this, calObj], this._popupCalendarOnKeyPress);

            calObj.textbox.on("change.calupdateobjectevents", [this, calObj], this._changeTextBox);
            
            // Applying the onchange event when the enter key is pressed
            if (SourceCode.Forms.Browser.msie)
            {
                // Saves the before value
                calObj.textbox.on("focus.msie-change.calupdateobjectevents", function ()
                {
                    $(this).data("before", $(this).val());
                });

                calObj.textbox.on("keydown.msie-change.calupdateobjectevents", function (e)
                {
                    if (e.which === 13 && $(this).val() !== $(this).data("before"))
                    {
                        $(this).trigger("change");
                        $(this).removeData("before");
                    }
                });

                calObj.textbox.on("blur.msie-change.calupdateobjectevents", function ()
                {
                    $(this).removeData("before");
                });
            }

            if (!this.keyPressEventAdded)
            {
                var topMiddelEl = calObj.topCalendarEl.find(".today-title");
                if (topMiddelEl.length > 0)
                {
                    topMiddelEl.off(".calupdateobjectevents");
                    topMiddelEl.on("focus.calupdateobjectevents", { currentCalendar: calObj }, this._onTopCalendarItemFocus);
                    topMiddelEl.on("blur.calupdateobjectevents", { currentCalendar: calObj }, this._onTopCalendarItemBlur);
                }
                this.element.off(".calupdateobjectevents");
                this.element.on("keydown.calupdateobjectevents", { context: this }, this._onKeyPressGeneral);
                this.keyPressEventAdded = true;
            }

            if (!existingCalObj)
            {
                this.calendarUpdateObjects.push(calObj);
            }
        }
    },

    _setWithoutChange: function (_calObj, value)
    {
        if (_calObj.textbox.val() !== value)
        {
            _calObj.textbox.off("change");
            _calObj.textbox.val(value);
            setTimeout(function ()
            {
                _calObj.textbox.on("change", [this, _calObj], this._changeTextBox);
            }.bind(this), 40);
        }
    },

    updateDisplayValue: function (_calObj, typedDate, dontFocus)
    {
        this._formatObject = null;
        var control = _calObj.textbox;
        var value = checkExists(typedDate) ? typedDate : control.data("calendarDate");
        if (checkExistsNotEmpty(value))
        {
            var styleOptions =
            {
                formatXmlString: control.data("format"),
                elementToStyle: control,
                value: value,
                formattingError: false,
                dataType: control.data("dataType")
            };
            value = SCCultureHelper.Current().applyFormatToControlValue(styleOptions);
            control.data("calendarDate", styleOptions.value);
            this.isValidDate(control, !styleOptions.formattingError);
            this._setWithoutChange(_calObj, value);
            if (!checkExistsNotEmpty(dontFocus) || dontFocus === false)
            {
                _calObj.textbox.trigger("focus");
            }
        }
        else if (checkExists(value))
        {
            //if the value is blank allow the watermark to show and reset the control value
            //This fixs the persistant date issue
            this.setCurrentDate(control, "");
        }
    },

    getCalendarUpdateObject: function (textbox, button)
    {
        //Robust check to handle either normal html elements or a jQuery wrapped objects during the final comparisons
        var paramTextbox = null;

        if (checkExistsNotEmpty(textbox))
        {
            if (textbox instanceof jQuery)
            {
                if (textbox.length > 0)
                {
                    paramTextbox = textbox[0];
                }
            }
            else
            {
                paramTextbox = textbox;
            }
        }

        var paramButton = null;

        if (checkExistsNotEmpty(button))
        {
            if (button instanceof jQuery)
            {
                if (button.length > 0)
                {
                    paramButton = button[0];
                }
            }
            else
            {
                paramButton = button;
            }
        }

        for (var j = 0; j < this.calendarUpdateObjects.length; j++)
        {
            var calUpdateObjTextbox = null;

            if (checkExistsNotEmpty(this.calendarUpdateObjects[j].textbox))
            {
                if (this.calendarUpdateObjects[j].textbox instanceof jQuery)
                {
                    if (this.calendarUpdateObjects[j].textbox.length > 0)
                    {
                        calUpdateObjTextbox = this.calendarUpdateObjects[j].textbox[0];
                    }
                }
                else
                {
                    calUpdateObjTextbox = this.calendarUpdateObjects[j].textbox;
                }
            }

            var calUpdateObjButton = null;

            if (checkExistsNotEmpty(this.calendarUpdateObjects[j].button))
            {
                if (this.calendarUpdateObjects[j].button instanceof jQuery)
                {
                    if (this.calendarUpdateObjects[j].button.length > 0)
                    {
                        calUpdateObjButton = this.calendarUpdateObjects[j].button[0];
                    }
                }
                else
                {
                    calUpdateObjButton = this.calendarUpdateObjects[j].button;
                }
            }

            if ((paramTextbox !== null && calUpdateObjTextbox === paramTextbox) || (paramButton !== null && calUpdateObjButton === paramButton))
            {
                return this.calendarUpdateObjects[j];
            }
        }
        return null;
    },

    hasCalendarUpdateObject: function (textbox, button)
    {
        for (var j = 0; j < this.calendarUpdateObjects.length; j++)
        {
            if ((textbox !== null && this.calendarUpdateObjects[j].textbox === textbox) || (button !== null && this.calendarUpdateObjects[j].button === button))
            {
                return true;
            }
        }
        return false;
    },

    removeCalendarUpdateObject: function (textbox, button)
    {
        for (var j = this.calendarUpdateObjects.length - 1; j >= 0; j--)
        {
            if ((textbox !== null && this.calendarUpdateObjects[j].textbox === textbox) || (button !== null && this.calendarUpdateObjects[j].button === button))
            {
                this.calendarUpdateObjects[j].button.off();

                this.calendarUpdateObjects[j].textbox.off("change", this._changeTextBox);

                this.calendarUpdateObjects = this.calendarUpdateObjects.removeAt(j);
                break;
            }
        }
    },

    findCalendarUpdateObject: function (textbox, button)
    {
        for (var j = 0; j < this.calendarUpdateObjects.length; j++)
        {
            if ((textbox !== null && this.calendarUpdateObjects[j].textbox.attr("id") === textbox.attr("id")) || (button !== null && this.calendarUpdateObjects[j].button.attr("id") === button.attr("id")))
            {
                return this.calendarUpdateObjects[j];
            }
        }
        return null;
    },

    getCurrentDate: function (textbox)
    {
        var jqTextbox = jQuery(textbox);
        var returnvalue = jqTextbox.data("calendarDate");

        var backupOfPreviousCalendarUpdateObject = this.currentCalendarUpdateObject;
        var calObj = this.getCalendarUpdateObject(jqTextbox, null);
        this.currentCalendarUpdateObject = calObj;

        if (calObj !== null && checkExists(calObj.selectedDate) && calObj.calendarPickerOptions.type === "timePicker" &&
            (!checkExists(jqTextbox.data("dataType")) || jqTextbox.data("dataType").toLowerCase() !== "time"))
        {
            var timevalue = this._convertDateStringToObject(returnvalue);
            calObj.selectedDate.setHours(timevalue.getHours());
            calObj.selectedDate.setMinutes(timevalue.getMinutes());
            calObj.selectedDate.setSeconds(timevalue.getSeconds());
            calObj.selectedDate.setMilliseconds(timevalue.getMilliseconds());
            returnvalue = this._convertDateObjToString(calObj.selectedDate);
        }
        this.currentCalendarUpdateObject = backupOfPreviousCalendarUpdateObject;

        return returnvalue;
    },
    isValidDate: function (textbox, boolValue)
    {
        var jqTextbox = jQuery(textbox);
        if (typeof boolValue !== "undefined" && boolValue !== null)
        {
            //set
            jqTextbox.data("isValidDate", boolValue);
            //TFS 182451 && TFS 181760
            //Set the validation style
            if (this.useValidation)
            {
                if (typeof UtilitiesBehaviour !== "undefined" && typeof Resources.RuntimeMessages !== "undefined")
                {
                    var objInfo =
                    {
                        CurrentControlId: jqTextbox.attr("id").replace("_TextBox", ""),
                        Error: !boolValue,
                        Pattern: Resources.RuntimeMessages.InvalidDate
                    }
                    UtilitiesBehaviour.validateControl(objInfo);
                }
            }
        }
        else
        {
            //get
            var validDate = jqTextbox.data("isValidDate");
            if (typeof validDate === "undefined" || validDate === null)
            {
                return true;
            }
            else
                return validDate;
        }
    },
    setCurrentDate: function (textbox, dateValue)
    {
        var jqTextbox = jQuery(textbox);
        var currentDate = jqTextbox.data("calendarDate");
        if (!currentDate || currentDate !== dateValue || !this.isValidDate(textbox))
        {
            if (dateValue !== "" && dateValue !== null)
            {
                jqTextbox.siblings(".input-control-watermark").hide();
                var styleOptions =
                {
                    formatXmlString: jqTextbox.data("format"),
                    elementToStyle: textbox,
                    value: dateValue,
                    formattingError: false,
                    dataType: jqTextbox.data("dataType")
                };
                jqTextbox.val(SCCultureHelper.Current().applyFormatToControlValue(styleOptions));
                this.isValidDate(textbox, !styleOptions.formattingError);

                if (currentDate !== styleOptions.value)
                {
                    var calObj = this.getCalendarUpdateObject(jqTextbox, null);
                    var backupOfPreviousCalendarUpdateObject = this.currentCalendarUpdateObject;
                    this.currentCalendarUpdateObject = calObj;

                        //check for timepicker 
                    if (calObj !== null && calObj.calendarPickerOptions.type === "timePicker" &&
                        (!checkExists(jqTextbox.data("dataType")) || jqTextbox.data("dataType").toLowerCase() !== "time"))
                        {
                            calObj.selectedDate = this._convertDateStringToObject(dateValue).clearTime();
                        }

                    jqTextbox.data("calendarDate", styleOptions.value);
                    this.currentCalendarUpdateObject = backupOfPreviousCalendarUpdateObject;
                    return true;
                }
            }
            else
            {
                jqTextbox.data("calendarDate", "");
                jqTextbox.val("");
                jqTextbox.siblings(".input-control-watermark").show();
                this.isValidDate(textbox, true);

                var areEqualMatchingNullAndEmpty = (!checkExists(currentDate) && dateValue === "");
                if (currentDate !== dateValue && !areEqualMatchingNullAndEmpty)
                {
                    return true; //necessary to ensure the relevant onchange event fires that will allow the previously set date value to be cleared when updating editable list views
                }
            }

        }
        return false;

    },

    _drawBasicCalendarOutline: function ()
    {
        this.element = jQuery("<div></div>");

        this.element[0].style.display = "none";

        this.element.on("click", this, this._onClick);

        var titleBorderDiv = jQuery("<div class='top-calendar'></div>");
        this.element.append(titleBorderDiv);
        this.element.addClass("calendar-outline");

        var titleLeftDiv = jQuery("<a class='top-calendar-left' href='javascript:void(0)'>&nbsp;</a>");
        titleBorderDiv.append(titleLeftDiv);
        this.titleElement = jQuery("<a class='today-title'  href='javascript:void(0)'></a>");
        titleBorderDiv.append(this.titleElement);
        var titleRightDiv = jQuery("<a class='top-calendar-right' href='javascript:void(0)'>&nbsp;</a>");
        titleBorderDiv.append(titleRightDiv);

        this.contentElement = jQuery("<div class='calendar-content-outside'></div>");
        this.contentPartsElement = jQuery("<div class='calendar-content'></div>");
        this.element.append(this.contentElement);
        this.contentElement.append(this.contentPartsElement);

        this.selectedElement = jQuery("<div class=\"today-text\"><span class=\"today-text-label\">" + Resources.CommonLabels.CommonFormLabel.format(Resources.CommonLabels.SelectedDateLabelText)
            + "</span><br /><span class=\"today-text-value\"></span></div>");

        this.element.append(this.selectedElement);
    },

    _drawDayCalendar: function (calendarWriteDate, updateSelectedDay)
    {
        //this function was reworked most of the logic is now in _drawDayCalendarInternal
        //it is now split to function using js calculation for the GregorianCalendar and an ajax call for the rest
        if (!checkExists(calendarWriteDate) || (!checkExists(calendarWriteDate._type) && isNaN(calendarWriteDate)))
        {
            calendarWriteDate = new Date();
        }
        var originalWriteDate = calendarWriteDate.clone();

        calendarWriteDate.clearTime();
        var drawingDate = calendarWriteDate.clone();
        this.currentDate = calendarWriteDate.clone();

        var formatObject = this.formatObject();
        var cultureObject = formatObject.cultureObject;

        //Optional TODO : Add support for more calendar types without requiring an ajax call

        switch (cultureObject.CalendarType)
        {
            case "GregorianCalendar":

                var dateString = null;
                if (updateSelectedDay)
                {
                    dateString = this._getParticularFormatForDate("D", this.selectedDay);
                    this.selectedElement.children(".today-text-value").text(dateString);
                }

                //set the calendar up to start in the beginning of the month
                drawingDate.setDate(1);

                //recalculate to fit other calendar types
                //this was replaced by an ajax call since the calendars can be so different

                var dayPattern = "dd";
                var currentDay = parseInt(this._getParticularFormatForDate(dayPattern, drawingDate), 10);
                if (currentDay !== 1)
                    drawingDate.decrement(currentDay);

                var newFirstDayOfWeek = checkExists(cultureObject.DateTimeSettings.FirstDayOfWeek) ? parseInt(cultureObject.DateTimeSettings.FirstDayOfWeek, 10) : 0;

                if ((checkExists(this.currentCalendarUpdateObject.calendarPickerOptions)) && (this.currentCalendarUpdateObject.calendarPickerOptions.firstDayOfWeek !== "7")) //0-6 = Sunday-Saturday; 7 = "User Settings"
                {
                    newFirstDayOfWeek = parseInt(this.currentCalendarUpdateObject.calendarPickerOptions.firstDayOfWeek, 10);
                }

                if ((newFirstDayOfWeek < 0) || (newFirstDayOfWeek > 6))
                {
                    newFirstDayOfWeek = 0;
                }

                //in the beginning of that week
                var currentDayNumber = drawingDate.getDay() - newFirstDayOfWeek;
                if (currentDayNumber < 0)
                {
                    currentDayNumber = currentDayNumber + 7;
                }
                //if the 1st of the month is a sunday then get the entire previous week
                if (currentDayNumber === 0)
                    currentDayNumber = 7;
                drawingDate.decrement(currentDayNumber);
                this.firstDateOnScreen = drawingDate.clone();

                this.contentPartsElement.empty();
                var monthYearPattern = "MMM yyyy";
                this.titleElement[0].innerHTML = this._getParticularFormatForDate(monthYearPattern, calendarWriteDate);

                this._drawDayCalendarInternal(cultureObject, drawingDate, null, newFirstDayOfWeek);
                break;
            default:
                this._drawDayCalendarAjax(cultureObject, originalWriteDate, updateSelectedDay, this.currentCalendarUpdateObject.calendarPickerOptions.firstDayOfWeek);
                break;
        }
    },
    _drawDayCalendarAjax: function (cultureObject, drawingDate, updateSelectedDay, configuredFirstDayOfWeek)
    {

        var _drawDayCalendarAjax = function (text)
        {
            var resultsObject = eval(text);
            if (updateSelectedDay)
            {
                this.selectedElement.children(".today-text-value").text(resultsObject.dateString);
            }
            this.titleElement.html(resultsObject.heading);

            var newDrawingDate = this._convertDateStringToObject(resultsObject.drawingDate);
            if (checkExistsNotEmpty(this.formatObject().timeZone))
            {
                newDrawingDate.convertTime(this.formatObject().timeZone);
            }

            this.firstDateOnScreen = newDrawingDate.clone();

            this._drawDayCalendarInternal(cultureObject, newDrawingDate, resultsObject.days);
        }.bind(this);

        var dateString = SCCultureHelper.Current()._convertDateObjToLocalString(drawingDate.clearTime(), true);
        var data =
        {
            method: "getCalendar",
            value: dateString,
            dataType: (this.dataType) ? this.dataType : this.currentCalendarUpdateObject.textbox.data("dataType"),
            formatCultureName: cultureObject.Name,
            configuredFirstDayOfWeek: configuredFirstDayOfWeek
        };

        var options =
        {
            url: applicationRoot + "Runtime/CalendarAJAXCall.ashx",
            type: 'GET',
            data: data,
            async: false,
            dataType: 'text',
            cache: true
        };
        var ajax = jQuery.ajax(options);

        return _drawDayCalendarAjax(ajax.responseText);
    },

    _startFixBoxShadow: function ()
    {
        if (!checkExists(this.outline))
        {
            if (SourceCode.Forms.Browser.msie && parseInt(SourceCode.Forms.Browser.version, 10) < parseInt(11, 10))
            {
                this.outline = $(".calendar-outline");
                if (this.outline.length === 0)
                {
                    this.outline = null;
                }
            }
        }
        if (checkExists(this.outline))
        {
            this.outline[0].style.boxShadow = "0px 0px";
        }
    },

    _endFixBoxShadow: function ()
    {
        if (checkExists(this.outline))
        {
            this.outline[0].style.boxShadow = "";
        }
    },

    _endFixBoxShadowTimeout: function ()
    {
        if (checkExists(this.outline))
        {
            setTimeout(this._endFixBoxShadow.bind(this), 0)
        }
    },

    _drawDayCalendarInternal: function (cultureObject, drawingDate, results, newFirstDayOfWeek)
    {
        this._cleanUpParts();
        this.contentPartsElement.empty();
        //Cause a reflow on IE 10 or lower - 457096
        this._startFixBoxShadow();

        var dayPattern = "dd";
        var counter = 0;
        var arrayIndex = 0;
        var gridLocationString = "xy_{0}_{1}";
        var today = this.today(drawingDate._type);
        var selectedDate = this.selectedDay.clone().clearTime();
        for (var d = 0; d < 7; d++)
        {
            var row = jQuery("<div class='calendar-row week'></div>");
            this.contentPartsElement.append(row);
            for (var w = 0; w < 7; w++)
            {
                var day = jQuery("<a></a>");
                day.attr("href", "javascript:void(0)");

                if (d === 0)
                {
                    var dayName = jQuery("<span></span>");
                    row.append(dayName);
                    dayName.addClass("dayname");
                    var newW = w;
                    if (checkExists(newFirstDayOfWeek))
                    {
                        newW = w + newFirstDayOfWeek;
                        if (newW > 6)
                        {
                            newW = newW - 7;
                        }
                    }
                    if (checkExists(results))
                    {
                        dayName.html(results[arrayIndex]);
                    }
                    else
                    {
                        dayName.html(cultureObject.DateTimeSettings.ShortestDayNames[newW]);
                    }
                }
                else
                {
                    row.append(day);
                    var utcDateString = this._convertDateObjToString(drawingDate);
                    var currentDay = checkExists(results) ? results[arrayIndex] : this._getParticularFormatForDate(dayPattern, drawingDate);

                    day.html(currentDay);
                    day.attr("calendarDate", utcDateString);
                    day.data("calendarDate", utcDateString);
                    day.addClass("day").addClass(gridLocationString.format(w, d - 1));
                    if (currentDay > counter)
                    {
                        day.addClass("not-of-current-month");
                        //reset counter
                        counter = 0;
                    }
                    else if (currentDay < counter)
                    {
                        day.addClass("not-of-current-month");
                    }

                    if (selectedDate && selectedDate.equals(drawingDate))
                    {
                        day.addClass("selected");
                    }

                    if (today && today.equals(drawingDate))
                    {
                        day.addClass("today");
                    }

                    if (d !== 6 || w !== 6)
                    {
                        //TFS #754053
                        drawingDate.increment(1).clearTime();
                    }

                    counter++;
                }
                arrayIndex++;
            }
        }
        this.lastDateOnScreen = drawingDate.clone();


        //Cause a reflow on IE 10 or lower - 457096
        this._endFixBoxShadowTimeout();
    },

    _drawMonthCalendar: function ()
    {
        this._cleanUpParts();

        //the real year differs in not gregorian calendars so it must be retrieved
        var yearString = this._getParticularFormatForDate("yyyy", this.currentDate);
        this.titleElement[0].innerHTML = yearString;
        var contentPartElement = this.contentPartsElement;
        if (this.allowAnimation)
        {
            this.contentPartsElementNew = jQuery("<div class='calendar-content' style='display:none;'></div>");
            this.contentElement.append(this.contentPartsElementNew);
            contentPartElement = this.contentPartsElementNew;
        }
        else
        {
            this.contentPartsElement.empty();
        }


        var count = 0;
        var formatObject = this.formatObject();
        var gridLocationString = "xy_{0}_{1}";
        var currentYear = this.currentDate.getUTCFullYear();
        for (var d = 0; d < 3; d++)
        {
            var row = jQuery("<div class='week calendar-row months'></div>");
            contentPartElement.append(row);
            for (var w = 0; w < 4; w++)
            {
                var day = jQuery("<a></a>");
                row.append(day);
                day.html(formatObject.cultureObject.DateTimeSettings.ShortMonthNames[count]);
                day.attr("month", count);
                day.attr("year", currentYear);
                day.attr("href", "javascript:void(0)");
                day.addClass("month").addClass(gridLocationString.format(w, d));
                count++;
            }
        }
        if (this.allowAnimation)
        {
            jQuery([this.contentPartsElementNew[0], this.contentPartsElement[0]]).toggle(100, this._afterAnimation.bind(this));

        }
        this.currentCalendarUpdateObject.calendarContent = this.contentPartsElementNew;
    },
    _cleanUpParts: function ()
    {
        // This fucntion prevents mulitple calendar parts from showing at the same time after an animation failure
        var parts = this.contentElement.find(".calendar-content");
        if (parts.length > 1)
        {
            parts.remove();
            this.contentPartsElement = jQuery("<div class='calendar-content' style='display:none;'></div>");
            this.contentElement.append(this.contentPartsElement);
        }
    },
    _afterAnimation: function (e, ui)
    {
        if (this.contentPartsElementNew)
        {
            var otherPart = jQuery(this.contentPartsElementNew[0]);
            this.contentPartsElement.remove();
            this.contentPartsElement = null;
            this.contentPartsElementNew = null;
            this.contentPartsElement = otherPart;

        }
    },

    _drawYearCalendar: function ()
    {
        this._cleanUpParts();
        //the real year differs in not gregorian calendars so it must be retrieved
        var yearString = this._getParticularFormatForDate("yyyy", this.currentDate);


        //set the year to the zero decade year (3454->3450)
        var year = parseInt((yearString + "").substring(0, 3) + "0", 10) - 1;
        var difference = parseInt(yearString, 10) - year;

        //set the invariant year match the above (2038->2034)
        var invariantYear = this.currentDate.getUTCFullYear() - difference;

        this.titleElement[0].innerHTML = year + 1 + " - " + (year + 10);
        var contentPartElement = this.contentPartsElement;
        if (this.allowAnimation)
        {
            this.contentPartsElementNew = jQuery("<div class='calendar-content' style='display:none;'></div>");
            this.contentElement.append(this.contentPartsElementNew);
            contentPartElement = this.contentPartsElementNew;
        } else
        {
            this.contentPartsElement.empty();
        }

        var gridLocationString = "xy_{0}_{1}";
        for (var d = 0; d < 3; d++)
        {
            var row = jQuery("<div class='week calendar-row years'></div>");
            contentPartElement.append(row);
            for (var w = 0; w < 4; w++)
            {
                var day = jQuery("<a></a>");
                row.append(day);
                day[0].innerHTML = year;
                day[0].setAttribute("name", invariantYear);
                day[0].setAttribute("href", "javascript:void(0)");
                year++;
                invariantYear++;
                day.addClass("year").addClass(gridLocationString.format(w, d));
            }
        }
        if (this.allowAnimation)
        {
            jQuery([this.contentPartsElementNew[0], this.contentPartsElement[0]]).toggle(100, this._afterAnimation.bind(this));
        }
        this.currentCalendarUpdateObject.calendarContent = this.contentPartsElementNew;
    },

    _drawTimePicker: function (selectedHours, selectedMinutes, selectedSeconds, calendarPickerOptions)
    {
        var intMinInterval = 0;
        var intSecInterval = 0;
        var timeFormat = "";

        var timeSpinnerHtml = {
            inputsLength: 0,
            inputsInfo: []
        };

        var timeSpinnerOptions = {
            inputs: []
        };

        var initialTime = [];

        if (checkExists(calendarPickerOptions))
        {
            var format = this.currentCalendarUpdateObject.textbox.data("format");
            var formatObject = this.formatObject();

            //Cater for legacy values to avoid upgrade issues
            if (calendarPickerOptions.timeFormat === "hh:mm:ss")
            {
                timeFormat = "longtime";
            }
            else if (calendarPickerOptions.timeFormat === "hh:mm")
            {
                timeFormat = "shorttime";
            }
            else if (calendarPickerOptions.timeFormat === "hh")
            {
                timeFormat = "HH";
            }
            else
            {
                timeFormat = calendarPickerOptions.timeFormat;
            }

            if ((timeFormat === "longtime") || (timeFormat === "shorttime"))
            {
                var curCultureDateTimePatterns = formatObject.cultureObject.DateTimePatterns;

                for (var i = 0; i < curCultureDateTimePatterns.length; i++)
                {
                    if (((timeFormat === "longtime") && (curCultureDateTimePatterns[i].Symbol === "T")) || ((timeFormat === "shorttime") && (curCultureDateTimePatterns[i].Symbol === "t")))
                    {
                        timeFormat = curCultureDateTimePatterns[i].Value;
                        break;
                    }
                }

                if (timeFormat === "longtime")
                {
                    timeFormat = "HH:mm:ss";
                }
                else if (timeFormat === "shorttime")
                {
                    timeFormat = "HH:mm";
                }
            }

            var isPM = false;

            if (timeFormat.contains("hh"))
            {
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 11, step: 1 },
                    displays: { "0": "12", "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09" },
                    defaultValue: "12",
                    selectOnFocus: true
                });

                if (selectedHours === 0)
                {
                    initialTime.push("12");
                }
                else if (selectedHours === 12)
                {
                    initialTime.push("12");
                    isPM = true;
                }
                else if (selectedHours > 12)
                {
                    var adjustedHours = selectedHours - 12;
                    initialTime.push(adjustedHours.toString());
                    isPM = true;
                }
                else
                {
                    initialTime.push(selectedHours.toString());
                }
            }
            else if (timeFormat.contains("HH"))
            {
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 23, step: 1 },
                    displays: { "0": "00", "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09" },
                    defaultValue: "00",
                    selectOnFocus: true
                });
                initialTime.push(selectedHours.toString());
            }
            else if (timeFormat.contains("h"))
            {
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 11, step: 1 },
                    displays: { "0": "12" },
                    defaultValue: "12",
                    selectOnFocus: true
                });

                if (selectedHours === 0)
                {
                    initialTime.push("12");
                }
                else if (selectedHours === 12)
                {
                    initialTime.push("12");
                    isPM = true;
                }
                else if (selectedHours > 12)
                {
                    var adjustedHours = selectedHours - 12;
                    initialTime.push(adjustedHours.toString());
                    isPM = true;
                }
                else
                {
                    initialTime.push(selectedHours.toString());
                }
            }
            else if (timeFormat.contains("H"))
            {
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 23, step: 1 },
                    defaultValue: "0",
                    selectOnFocus: true
                });
                initialTime.push(selectedHours.toString());
            }

            if (timeFormat.contains("mm"))
            {
                intMinInterval = parseInt(calendarPickerOptions.minInterval);
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    delimiterBeforeInput: ":",
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 59, step: intMinInterval },
                    displays: { "0": "00", "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09" },
                    defaultValue: "00",
                    selectOnFocus: true
                });
                initialTime.push(selectedMinutes.toString());
            }

            if (timeFormat.contains("ss"))
            {
                intSecInterval = parseInt(calendarPickerOptions.secInterval, 10);
                timeSpinnerHtml.inputsLength++;
                timeSpinnerHtml.inputsInfo.push({
                    delimiterBeforeInput: ":",
                    maxInputLength: 2,
                    rightAlign: true
                });
                timeSpinnerOptions.inputs.push({
                    range: { min: 0, max: 59, step: intSecInterval },
                    displays: { "0": "00", "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09" },
                    defaultValue: "00",
                    selectOnFocus: true
                });
                initialTime.push(selectedSeconds.toString());
            }

            if (timeFormat.contains("tt"))
            {
                var AMdisplay = "AM";
                var PMdisplay = "PM";

                if ((checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.AMDesignator)) && (checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.PMDesignator)))
                {
                    AMdisplay = formatObject.cultureObject.DateTimeSettings.AMDesignator;
                    PMdisplay = formatObject.cultureObject.DateTimeSettings.PMDesignator;
                }

                timeSpinnerHtml.inputsLength++;
                timeSpinnerOptions.inputs.push({
                    values: [AMdisplay, PMdisplay],
                    defaultValue: AMdisplay,
                    selectOnFocus: true
                });

                if (isPM)
                {
                    initialTime.push(PMdisplay);
                }
                else
                {
                    initialTime.push(AMdisplay);
                }
            }
        }

        var timePicker = this.element.find(".timepicker-content");

        var timeSpinner = null;

        if (timePicker.length === 0)
        {
            timePicker = jQuery("<div class='timepicker-content'></div>");

            this.element.append(timePicker);

            var timeSpinnerWrapper = jQuery("<div class='timepicker-spinner-wrapper'></div>");

            timeSpinnerWrapper.append("<span class='timepicker-spinner-label'>" + Resources.CommonLabels.TimeText + "</span>");

            timeSpinner = jQuery(SCSpinner.html(timeSpinnerHtml));

            timeSpinner.spinner(timeSpinnerOptions);

            timeSpinnerWrapper.append(timeSpinner);

            timePicker.append(timeSpinnerWrapper);

            var buttonsDiv = jQuery("<div class='timepicker-buttons'></div>");

            var okButton = jQuery("<a class='SFC SourceCode-Forms-Controls-Web-Button button timepicker-ok-button' href='javascript:'>" + Resources.WizardButtons.OKButtonText + "</a>").SFCButton();
            var cancelButton = jQuery("<a class='SFC SourceCode-Forms-Controls-Web-Button button timepicker-cancel-button' href='javascript:'>" + Resources.WizardButtons.CancelButtonText + "</a>").SFCButton();

            okButton.on("click", this._onOkClick.bind(this));
            cancelButton.on("click", this._onCancelClick.bind(this));

            buttonsDiv.append(okButton);
            buttonsDiv.append(cancelButton);

            timePicker.append(buttonsDiv);
        }
        else
        {
            timeSpinner = timePicker.find(".spinner");

            SCSpinner.editInputsHtml(timeSpinner, timeSpinnerHtml);

            timeSpinner.spinner("option", "inputs", timeSpinnerOptions.inputs);

            timeSpinner.spinner("reset");
        }

        timeSpinner.spinner("value", initialTime);
    },

    _popupCalendarOnKeyPress: function (e)
    {
        var _this = e.data[0];
        if (e.which === _this.enterKey || e.which === _this.spaceKey)
        {
            e.preventDefault();
            e.stopPropagation();
            _this._popupCalendar(_this, e.data[1]);
        }
    },

    _popupCalendarOnClick: function (e)
    {
        e.preventDefault();
        var _this = e.data[0];
        if (document.activeElement !== e.data[1].button[0])
        {
            $(e.data[1].button[0]).trigger("focus");
        }
        _this._popupCalendar(_this, e.data[1]);
    },

    _popupCalendar: function (_this, _calObj)
    {
        if ((_this.element[0].style.display === "none") || (_this.currentCalendarUpdateObject !== _calObj))
        {
            //reset the format object
            this._formatObject = null;
            if (checkExists(_this.calendarPopup))
            {
                _this.calendarPopup.popupwindow("close");
                _this.calendarPopup = null;
            }

            _this._cleanUpParts();
            _this.currentCalendarUpdateObject = _calObj;
            var containerHeight = 0;
            _this.clickButtonCount = 0;

            var calendarPopupCssClass = "id-calendar-control-popup";

            //Begin set position to prevent rendering at bottom of page (if not set already)
            if (_this.element[0].style.top === "")
                _this.element[0].style.top = "0px";
            if (_this.element[0].style.left === "")
                _this.element[0].style.left = "0px";
            //End set position to prevent rendering at bottom of page (if not set already)

            containerHeight = jQuery(document).height();
            jQuery(document).off('click.calendar', _this.clickOnPage);
            jQuery(document).on('click.calendar', _this, _this.clickOnPage);
            _this.dataType = _calObj.textbox.data("dataType");
            _this.selectedDay = _this.now();

            _this.mode = 'day';
            if (_calObj)
            {
                var dateString = _calObj.textbox.data("calendarDate");
                if (dateString)
                {
                    //this is my saved date
                    var attemptToConvert = _this._convertDateStringToObject(dateString);
                    if (attemptToConvert)
                    {
                        _this.selectedDay = attemptToConvert;
                    }
                }
            }

            _this.selectedHours = _this.selectedDay.getHours();
            _this.selectedMinutes = _this.selectedDay.getMinutes();
            _this.selectedSeconds = _this.selectedDay.getSeconds();

            _this.calendarContentType = "date";

            if ((checkExists(_calObj.calendarPickerOptions)) && (checkExists(_calObj.calendarPickerOptions.type)))
            {
                switch (_calObj.calendarPickerOptions.type)
                {
                    case "datePicker":
                        {
                            _this.calendarContentType = "date";
                            calendarPopupCssClass += " type-date-only";
                            break;
                        }
                    case "timePicker":
                        {
                            _this.calendarContentType = "time";
                            calendarPopupCssClass += " type-time-only";
                            break;
                        }
                    case "dateTimePicker":
                        {
                            _this.calendarContentType = "dateTime";
                            calendarPopupCssClass += " type-date-time";
                            _this.element.off("dblclick.closeCalendar").on("dblclick.closeCalendar", this, this._onDblClick);
                            _calObj.isTimeFocused = false;
                            break;
                        }
                }
            }

            if (_this.calendarContentType !== "time")
            {
                _this._drawDayCalendar(_this.selectedDay.clone(), true);
            }

            _this.element[0].style.display = 'block';
            _this.element.find('.top-calendar')[0].style.display = 'block';
            _this.element.find('.calendar-content-outside')[0].style.display = 'block';
            _this.element.find('.today-text')[0].style.display = 'block';

            if (this.formatObject().cultureObject.CalendarType === "UmAlQuraCalendar")
            {
                _this.element.find('.today-title').addClass('disabled');
            }

            if (_this.calendarContentType !== "date")
            {
                _this._drawTimePicker(_this.selectedHours, _this.selectedMinutes, _this.selectedSeconds, _calObj.calendarPickerOptions);
                _this.element.find('.timepicker-content')[0].style.display = 'block';
            }

            if (_this.calendarContentType === "date")
            {
                var timePickerContent = _this.element.find('.timepicker-content');

                if (timePickerContent.length > 0)
                {
                    timePickerContent[0].style.display = 'none';
                }
            }
            else if (_this.calendarContentType === "time")
            {
                _this.element.find('.top-calendar')[0].style.display = 'none';
                _this.element.find('.calendar-content-outside')[0].style.display = 'none';
                _this.element.find('.today-text')[0].style.display = 'none';
            }

            _this.calendarPopup = popupManager.showPopup({
                centered: false,
                content: _this.element,
                draggable: false,
                modal: false,
                removeContent: false,
                showContentOnly: true,
                cssClass: calendarPopupCssClass
            });

            // Remove dialog behaviour (Technical Debt to be addressed)
            _this.calendarPopup.removeClass("dialog");

            _this.calendarPopup.popupwindow("resize", _this.element.outerWidth(true), _this.element.outerHeight(true));

            var options =
            {
                popupContent: _this.element,
                element: _this.currentCalendarUpdateObject.button
            }

            var getElemTop = parseInt(SourceCode.Forms.MenuHelper.getTopValue(options));
            var getElemLeft = parseInt(SourceCode.Forms.MenuHelper.getLeftValue(options));

            if (getElemLeft < 0)
            {
                getElemLeft = 2;
            }

            _this.calendarPopup.popupwindow("move", getElemLeft, getElemTop);
            if (_this.calendarContentType === "dateTime" || _this.calendarContentType === "time")
            {
                _calObj.timeContent = _this.element.find(".timepicker-content");
                _calObj.spinnerWrapper = _this.element.find(".spinner");
            }
            _this.currentCalendarUpdateObject = _calObj;
            if (_this.calendarContentType !== "time")
            {
                var selectedDay = _this.element.find(".day.selected");
                _this._focusCalendarItem(selectedDay, _calObj.calendarContent);
            }
            else
            {
                _this._focusTimeControls();
            }
        }
        _this.previousSelectedDay = _this.selectedDay;
    },

    _changeTextBox: function (e)
    {
        var _this = e.data[0];
        var _calObj = e.data[1];
        var typedDate = null;

        typedDate = _calObj.textbox[0].value;
        _this.updateDisplayValue(_calObj, typedDate, true);
        if (_this.isValidDate(_calObj.textbox))
            _calObj.button.trigger("calendarChanged", [e, _this, _calObj]);
    },

    now: function (dataType)
    {
        var today = null;
        if (!checkExists(this.dataType))
        {
            var dataObject = this.currentCalendarUpdateObject.textbox.data();
            if (!checkExists(this.dataType))
            {
                this.dataType = dataObject.dataType;
            }
        }
        if (this.dataType === "date")
        {
            today = SourceCode.Forms.Date.now();
        }
        else if (this.dataType === "time")
        {
            today = SourceCode.Forms.Time.now();
        }
        else if (this.formatObject() && checkExistsNotEmpty(this.formatObject().timeZone))
        {
            today = SourceCode.Forms.DateTime.now(this.formatObject().timeZone);
        }
        else
        {
            today = new Date();
        }
        return today;
    },

    today: function ()
    {
        return this.now().clone().clearTime();
    },

    formatObject: function ()
    {
        if (!checkExists(this._formatObject))
        {
            var dataObject = this.currentCalendarUpdateObject.textbox.data();
            if (checkExistsNotEmpty(dataObject.format))
            {
                this._formatObject = SCCultureHelper.Current().getFormatObject(dataObject.format);
            }
        }
        return this._formatObject;
    },

    _convertDateStringToObject: function (value)
    {
        if (checkExists(value) && (value instanceof Date || value._type === "datetime" || value._type === "date" || value._type === "time"))
        {
            return value;
        }
        if (!checkExists(this.dataType))
        {
            var dataObject = this.currentCalendarUpdateObject.textbox.data();
            if (!checkExists(this.dataType))
            {
                this.dataType = dataObject.dataType;
            }
        }
        return SCCultureHelper.Current()._convertDateStringToObj({ dataType: this.dataType, value: value, formatObject: this.formatObject() })
    },

    _convertDateObjToString: function (value)
    {
        return SCCultureHelper.Current()._convertDateObjToString(value);
    },

    _getParticularFormatForDate: function (pattern, dateString)
    {
        return SCCultureHelper.Current().getParticularFormatForDate(this.formatObject(), pattern, dateString);
    },

    _onClick: function (e)
    {
        var target = jQuery(e.target);
        var _this = e.data;
        var format = _this.currentCalendarUpdateObject.textbox.data("format");
        if (target.length > 0)
        {
            if (target.hasClass("day"))
            {
                _this.element.find(".selected").removeClass('selected');
                target.addClass("selected");
                //my own date
                var dateString = target.data("calendarDate");
                _this.selectedDay = _this._convertDateStringToObject(dateString);

                _this.selectedHours = _this.selectedDay.getHours();
                _this.selectedMinutes = _this.selectedDay.getMinutes();
                _this.selectedSeconds = _this.selectedDay.getSeconds();

                if (_this.calendarContentType === "date")
                {
                    _this.currentCalendarUpdateObject.textbox.data("calendarDate", dateString);
                    _this.updateDisplayValue(_this.currentCalendarUpdateObject);

                    if (_this.currentCalendarUpdateObject.textbox[0].value === "")
                    {
                        _this.currentCalendarUpdateObject.textbox.siblings(".input-control-watermark").show();
                    }
                    else
                    {
                        _this.currentCalendarUpdateObject.textbox.siblings(".input-control-watermark").hide();
                    }

                    // Closing the popup first
                    _this.element[0].style.display = "none";
                    _this.calendarPopup.popupwindow("close");
                    _this.calendarPopup = null;
                    jQuery(document).off('click.calendar', _this.clickOnPage);

                    // Triggering the change event last
                    _this.currentCalendarUpdateObject.button.trigger("calendarChanged", [e, _this, _this.currentCalendarUpdateObject]);
                    _this.currentCalendarUpdateObject = null;
                    return;

                }
                else
                {
                    dateString = _this._getParticularFormatForDate("D", _this.selectedDay);
                    _this.selectedElement.children(".today-text-value").text(dateString);
                    _this.currentCalendarUpdateObject.calendarContent.find(".selected").removeClass("selected");
                    var selectedDayEl = $(target);
                    _this.selectedDay = selectedDayEl.attr("calendardate");
                    if (checkExistsNotEmpty(_this.selectedDay))
                    {
                        _this.selectedDay = _this._convertDateStringToObject(_this.selectedDay);
                    }
                    selectedDayEl.addClass("selected");
                    _this._focusCalendarItem(selectedDayEl);
                }
            }
            else if (target.hasClass("month"))
            {
                _this.mode = 'day';
                _this.currentDate.setSafeFullYear(target[0].getAttribute("year"), target[0].getAttribute("month"), _this.selectedDay.getDate());
                var targetDateUTC = _this._convertDateObjToString(_this.currentDate);
                _this._drawDayCalendar(_this.currentDate);
                _this.currentCalendarUpdateObject.calendarContent = _this.element.find(".calendar-content");
                var itemToFocus = _this.currentCalendarUpdateObject.calendarContent.find(".day[calendardate='" + targetDateUTC + "']");
                _this._focusCalendarItem(itemToFocus);
            }
            else if (target.hasClass("year"))
            {
                _this.mode = 'month';
                _this.currentDate.setSafeUTCFullYear(target[0].getAttribute("name"));
                _this._drawMonthCalendar();
                var monthToFocus = _this.currentCalendarUpdateObject.calendarContent.find("a[month=" + _this.currentDate.getMonth() + "]");
                _this._focusCalendarItem(monthToFocus);
            }
            else if (target.hasClass("today-title") && _this.mode === 'day' && _this.formatObject().cultureObject.CalendarType !== "UmAlQuraCalendar")
            {
                _this.mode = 'month';
                _this._drawMonthCalendar();
                var monthToFocus = _this.currentCalendarUpdateObject.calendarContent.find("a[month=" + _this.currentDate.getMonth() + "]");
                _this._focusCalendarItem(monthToFocus);
            }
            else if (target.hasClass("today-title") && _this.mode === 'month')
            {
                _this.mode = 'year';
                _this._drawYearCalendar();
                var yearToFocus = _this.currentCalendarUpdateObject.calendarContent.find("a[name=" + _this.currentDate.getUTCFullYear() + "]");
                _this._focusCalendarItem(yearToFocus);
            }
            else if (target.hasClass("top-calendar-left") && _this.mode === 'day')
            {
                _this._drawDayCalendar(_this.firstDateOnScreen.clone());
            }
            else if (target.hasClass("top-calendar-right") && _this.mode === 'day')
            {
                _this._drawDayCalendar(_this.lastDateOnScreen.clone());
            }
            else if (target.hasClass("top-calendar-left") && _this.mode === 'month')
            {
                _this.currentDate.setFullYear(_this.currentDate.getFullYear() - 1);
                _this._drawMonthCalendar();
            }
            else if (target.hasClass("top-calendar-right") && _this.mode === 'month')
            {
                _this.currentDate.setFullYear(_this.currentDate.getFullYear() + 1);
                _this._drawMonthCalendar();
            }
            else if (target.hasClass("top-calendar-left") && _this.mode === 'year')
            {
                _this.currentDate.setFullYear(_this.currentDate.getFullYear() - 10);
                _this._drawYearCalendar();
            }
            else if (target.hasClass("top-calendar-right") && _this.mode === 'year')
            {
                _this.currentDate.setFullYear(_this.currentDate.getFullYear() + 10);
                _this._drawYearCalendar();
            }
            _this.currentCalendarUpdateObject.isTimeFocused = false;

            // Mode CSS classes for theme-ability
            switch (_this.mode)
            {
                case "day":
                    _this.calendarPopup.addClass("mode-day").removeClass("mode-month mode-year");
                    break;
                case "month":
                    _this.calendarPopup.addClass("mode-month").removeClass("mode-day mode-year");
                    break;
                case "year":
                    _this.calendarPopup.addClass("mode-year").removeClass("mode-day mode-month");
                    break;
            }
        }
        e.stopPropagation()
    },

    _onDblClick: function (e)
    {
        if (jQuery(e.target).hasClass("day"))
        {
            e.stopPropagation();
            e.data.element.find(".timepicker-ok-button").trigger("click");
        }
    },

    _onOkClick: function (e)
    {
        var _this = this;

        var format = _this.currentCalendarUpdateObject.textbox.data("format");
        var formatObject = this.formatObject();

        var selectedDayElem = _this.element.find(".day.selected");
        var dateString = "";
        if (selectedDayElem.length > 0)
        {
            dateString = selectedDayElem.data("calendarDate");
            _this.selectedDay = _this._convertDateStringToObject(dateString);
        }

        if (checkExistsNotEmpty(_this.selectedDay))
        {
            _this.selectedHours = 0;
            _this.selectedMinutes = 0;
            _this.selectedSeconds = 0;

            var selectedTime = _this.element.find(".spinner").spinner("value");

            var AMdisplay = "AM";
            var PMdisplay = "PM";

            if ((checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.AMDesignator)) && (checkExistsNotEmpty(formatObject.cultureObject.DateTimeSettings.AMDesignator)))
            {
                AMdisplay = formatObject.cultureObject.DateTimeSettings.AMDesignator;
                PMdisplay = formatObject.cultureObject.DateTimeSettings.PMDesignator;
            }

            if (selectedTime[selectedTime.length - 1] === AMdisplay)
            {
                if (selectedTime[0] === "12")
                {
                    _this.selectedHours = 0;
                }
                else
                {
                    _this.selectedHours = parseInt(selectedTime[0]);
                }
            }
            else if (selectedTime[selectedTime.length - 1] === PMdisplay)
            {
                if (selectedTime[0] === "12")
                {
                    _this.selectedHours = parseInt(selectedTime[0]);
                }
                else
                {
                    _this.selectedHours = parseInt(selectedTime[0]) + 12;
                }
            }
            else
            {
                _this.selectedHours = parseInt(selectedTime[0]);
            }

            if ((checkExists(selectedTime[1])) && (selectedTime[1] !== AMdisplay) && (selectedTime[1] !== PMdisplay))
            {
                _this.selectedMinutes = parseInt(selectedTime[1]);
            }

            if ((checkExists(selectedTime[2])) && (selectedTime[2] !== AMdisplay) && (selectedTime[2] !== PMdisplay))
            {
                _this.selectedSeconds = parseInt(selectedTime[2]);
            }

            _this.selectedDay.setHours(_this.selectedHours);
            _this.selectedDay.setMinutes(_this.selectedMinutes);
            _this.selectedDay.setSeconds(_this.selectedSeconds);

            dateString = _this._convertDateObjToString(_this.selectedDay);

            _this.currentCalendarUpdateObject.textbox.data("calendarDate", dateString);
            _this.updateDisplayValue(_this.currentCalendarUpdateObject);

            if (_this.currentCalendarUpdateObject.textbox[0].value === "")
            {
                _this.currentCalendarUpdateObject.textbox.siblings(".input-control-watermark").show();
            }
            else
            {
                _this.currentCalendarUpdateObject.textbox.siblings(".input-control-watermark").hide();
            }

            // Closing the popup first
            _this.element[0].style.display = "none";
            _this.calendarPopup.popupwindow("close");
            _this.calendarPopup = null;
            jQuery(document).off('click.calendar', _this.clickOnPage);

            // Triggering the chnage event last
            _this.currentCalendarUpdateObject.button.trigger("calendarChanged", [e, _this, _this.currentCalendarUpdateObject]);
            _this.currentCalendarUpdateObject = null;
        }
        e.stopPropagation()
    },

    _onCancelClick: function (e)
    {
        this.element[0].style.display = "none";
        this.calendarPopup.popupwindow("close");
        this.calendarPopup = null;
        this.currentCalendarUpdateObject = null;
        jQuery(document).off('click.calendar', this.clickOnPage);
        e.stopPropagation()
    },

    clickOnPage: function (e)
    {
        var _this = e.data;

        var popupBeforeClick = _this.popupOverCalendar;

        if (checkExists(_this.calendarPopup))
        {
            var nextPopupElement = _this.calendarPopup.next();
            _this.popupOverCalendar = nextPopupElement.hasClass("popup");

            while ((nextPopupElement.length > 0) && (!_this.popupOverCalendar))
            {
                nextPopupElement = nextPopupElement.next();
                _this.popupOverCalendar = nextPopupElement.hasClass("popup");
            }
        }

        var popupAfterClick = _this.popupOverCalendar;

        if ((!popupAfterClick) && (!popupBeforeClick))
        {
            var target = jQuery(e.target);
            if (!target.hasClass('calender-control-button'))
            {
                target = target.closest('.calender-control-button');
            }
            if ((target[0] === _this.currentCalendarUpdateObject.button[0] && _this.clickButtonCount >= 1) || target[0] !== _this.currentCalendarUpdateObject.button[0])
            {
                if (_this.element[0].style.display !== "none")
                {
                    _this.element[0].style.display = "none";
                    _this.calendarPopup.popupwindow("close");
                    _this.calendarPopup = null;
                }
            } else
            {
                _this.clickButtonCount++;
            }
        }

    },

    _onKeyPressGeneral: function (e)
    {
        var _this = e.data.context;
        switch (e.which)
        {
            case _this.downKey:
            case _this.upKey:
            case _this.leftKey:
            case _this.rightKey:
            case _this.escKey:
            case _this.spaceKey:
            case _this.tabKey:
            case _this.enterKey:
                if (_this.currentCalendarUpdateObject.isTime)
                {
                    _this._onKeyPressTime(e, _this);
                }
                else
                {
                    _this._onKeyPress(e, _this);
                }
                e.stopPropagation();
                return false;
            default:
                return true;
        }
    },

    _onKeyPress: function (e, _this)
    {
        var _calObj = _this.currentCalendarUpdateObject;
        var calendarControl = _this.element;

        //frequently used elements:
        _calObj.calendarOutsideEl = (jQuery(e.target)).closest(".calendar-outline");
        var calendarOutsideEl = _calObj.calendarOutsideEl;
        _calObj.calendarContent = _calObj.calendarOutsideEl.find(".calendar-content");
        var calendarContent = _calObj.calendarContent;
        _calObj.topCalendarEl = _calObj.calendarOutsideEl.find(".top-calendar");
        _calObj.timeContent = _calObj.calendarOutsideEl.find(".timepicker-content");
        _calObj.spinnerWrapper = _calObj.timeContent.find(".spinner");

        //Cause a reflow on IE 10 or lower - 457096
        _this._startFixBoxShadow();

        var selectedItem = null;
        var activeItem = null;
        var isTopItemSelected = null;
        var selectedTopItem = null;
        var dayItems = null;
        var dayMode = false;
        var monthOrYearMode = false;
        var documentActiveElement = $(document.activeElement);
        if (!_calObj.isTime)
        {
            selectedItem = calendarContent.find(".selected");
            activeItem = calendarContent.find(".active");
            if (activeItem.length === 0)
            {
                activeItem = selectedItem;
            }
            isTopItemSelected = _calObj.topCalendarEl.find(".today-title").hasClass("active");
            if (isTopItemSelected)
            {
                selectedTopItem = _calObj.topCalendarEl.find(".today-title");
            }
            dayItems = calendarContent.find(".day");
            dayMode = dayItems.length > 0;
            if (_calObj.isDateTime && (documentActiveElement.hasClass("input-control") || documentActiveElement.hasClass("spinner-text-input")))
            {
                _calObj.isTimeFocused = true;
            }
        }

        if (!_calObj.isTime && !isTopItemSelected && dayMode && !checkExists(selectedItem))
        {
            //if no items selected, set focus on first calendar item:
            _this._focusFirstCalendarItem();
        }

        switch (e.which)
        {
            case _this.enterKey:
            case _this.spaceKey:
                if (!isTopItemSelected)
                {
                    if (_calObj.isDateTime)
                    {
                        if (_calObj.isTimeFocused)
                        {
                            _calObj.isTimeFocused = false;
                            if (documentActiveElement.hasClass("timepicker-ok-button"))
                            {
                                documentActiveElement.trigger("click");
                            }
                            else if (documentActiveElement.hasClass("timepicker-cancel-button"))
                            {
                                calendarControl[0].style.display = "none";
                                _this.calendarPopup.popupwindow("close");
                                _this.calendarPopup = null;
                            }
                        }
                        else
                        {
                            if (e.which === _this.enterKey)
                            {
                                _this._selectCalendarItem(calendarControl, true);
                            }
                            else
                            {
                                _this._selectCalendarItem(calendarControl, false);
                            }
                        }
                    }
                    else
                    {
                        _this._selectCalendarItem(calendarControl, true);
                    }
                }
                else
                {
                    _calObj.topCalendarEl.find(".today-title").trigger("click");
                }
                break;
            case _this.escKey:
                if (!isTopItemSelected && _this.mode === "day")
                {
                    //close picker
                    calendarControl[0].style.display = "none";
                    _this.calendarPopup.popupwindow("close");
                    _calObj.isTimeFocused = false;
                    _this.calendarPopup = null;
                }
                else
                {
                    //focus active or current item
                    switch (_this.mode)
                    {
                        case "day":
                            calendarControl[0].style.display = "none";
                            _this.calendarPopup.popupwindow("close");
                            _calObj.isTimeFocused = false;
                            _this.calendarPopup = null;
                            break;
                        case "month":
                        case "year":
                            if (activeItem.length > 0)
                            {
                                _this._selectCalendarItem(calendarControl, false);
                            }
                            else
                            {
                                e.preventDefault();
                                var attrSelector = "[month=" + _this.selectedDay.getMonth() + "]";
                                if (_this.mode === "year")
                                {
                                    attrSelector = "[year=" + _this.selectedDay.getUTCFullYear() + "]";
                                }
                                _this._focusCalendarItem(_calObj.calendarContent.find(attrSelector));
                                _this._selectCalendarItem(calendarControl, false);
                                return false;
                            }
                            break;
                    }
                }
                break;
            case _this.upKey:
            case _this.downKey:
            case _this.leftKey:
            case _this.rightKey:
                if (!isTopItemSelected)
                {
                    if (!_calObj.isDateTime || !_calObj.isTimeFocused)
                    {
                        var itemToFocus = _this._getElementForDirection(activeItem, e.keyCode, calendarContent);
                        if (checkExists(itemToFocus))
                        {
                            _this._focusCalendarItem(itemToFocus, calendarContent);
                        }
                    }
                    else if (_calObj.isTimeFocused)
                    {
                        _this._moveBetweenTimeElements(_calObj.timeContent, e.keyCode)
                    }
                }
                else
                {
                    if (e.keyCode === _this.downKey)
                    {
                        _this._focusActiveCalendarItem();
                    }
                    else if (e.keyCode === _this.leftKey || e.keyCode === _this.rightKey)
                    {
                        _this._pageTopItems(e.keyCode);
                    }
                }
                break;
            case _this.tabKey:
                if (e.shiftKey)
                {
                    _this._tabBackBetweenControls(isTopItemSelected, _calObj, selectedTopItem);
                }
                else
                {
                    _this._tabForwardBetweenControls(isTopItemSelected, _calObj, selectedTopItem, activeItem);
                }
                break;
        }

        //Cause a reflow on IE 10 or lower - 457096
        _this._endFixBoxShadow();
        //prevent default key events from firing:
        return false;
    },

    _onKeyPressTime: function (e, _this)
    {
        var calendarControl = _this.element;
        var _calObj = _this.currentCalendarUpdateObject;
        var activeElement = $(document.activeElement);
        switch (e.which)
        {
            case _this.spaceKey:
                if (activeElement.hasClass("timepicker-ok-button"))
                {
                    _calObj.timeContent.find(".timepicker-ok-button").trigger("click");
                }
                else if (activeElement.hasClass("timepicker-cancel-button"))
                {
                    _calObj.timeContent.find(".timepicker-cancel-button").trigger("click");
                }
                break;
            case _this.enterKey:
                if (activeElement.hasClass("timepicker-cancel-button"))
                {
                    _calObj.timeContent.find(".timepicker-cancel-button").trigger("click");
                }
                else
                {
                    //always submit
                    _calObj.timeContent.find(".timepicker-ok-button").trigger("click");
                }
                break;
            case _this.escKey:
                //close picker
                calendarControl[0].style.display = "none";
                _this.calendarPopup.popupwindow("close");
                _this.calendarPopup = null;
                break;
            case _this.upKey:
            case _this.downKey:
            case _this.leftKey:
            case _this.rightKey:
                //focus left, right, up, down:
                _this._moveBetweenTimeElements(_calObj.timeContent, e.keyCode);
                break;
            case _this.tabKey:
                if (e.shiftKey)
                {
                    _this._tabBackBetweenControls(false, _calObj, null);
                }
                else
                {
                    _this._tabForwardBetweenControls(false, _calObj, null, null);
                }
                break;
        }
        //prevent default key events from firing:
        return false;
    },

    _onTopCalendarItemFocus: function (e)
    {
        e.data.currentCalendar.topCalendarEl.find(".today-title").addClass("hide-browser-highlight").addClass("active");
        e.data.currentCalendar.isTopItemSelected = true;
    },

    _onTopCalendarItemBlur: function (e)
    {
        e.data.currentCalendar.topCalendarEl.find(".today-title").removeClass("hide-browser-highlight").removeClass("active");
        e.data.currentCalendar.isTopItemSelected = false;
    },

    _focusCalendarItem: function (itemToFocus)
    {
        if (itemToFocus.hasClass("day"))
        {
            var calendarDate = itemToFocus.attr("calendarDate");
            var dateObject = this._convertDateStringToObject(calendarDate);
            var dateString = this._getParticularFormatForDate("D", dateObject);
            this.currentCalendarUpdateObject.calendarContent.closest(".calendar-outline").find(".today-text-value").text(dateString);
            if (itemToFocus.hasClass("not-of-current-month"))
            {
                //page month before focusing
                var currentClasses = itemToFocus[0].className.split(' ');
                for (var i = 0; i < currentClasses.length; i++)
                {
                    if (currentClasses[i].indexOf("xy_") === 0)
                    {
                        if (currentClasses[i].length === 6 && currentClasses[i][5] === '0')
                        {
                            //previous month
                            this._drawDayCalendar(this.firstDateOnScreen.clone());
                        }
                        else
                        {
                            //next month
                            this._drawDayCalendar(this.lastDateOnScreen.clone());
                        }
                    }
                }
                itemToFocus = this.currentCalendarUpdateObject.calendarContent.find("[calendarDate='" + calendarDate + "']");
            }
        }
        this.currentCalendarUpdateObject.calendarContent.find(".active").removeClass("active");
        if (checkExists(itemToFocus))
        {
            itemToFocus.addClass("active");
            itemToFocus.trigger("focus");
        }
        else
        {
            _this._focusFirstCalendarItem();
        }
    },

    _focusFirstCalendarItem: function ()
    {
        var _calObj = this.currentCalendarUpdateObject;
        var itemContainer = _calObj.calendarContent;
        if (itemContainer.length > 0)
        {
            var firstItem = null;
            if (this.mode === "day")
            {
                firstItem = itemContainer.find(".day:not(.not-of-current-month)").first();
            }
            else
            {
                firstItem = itemContainer.find(".xy_0_0");
            }
            if (checkExists(firstItem))
            {
                this._focusCalendarItem(firstItem);
            }
        }
    },

    _focusActiveCalendarItem: function ()
    {
        var activeItem = this.currentCalendarUpdateObject.calendarContent.find(".active").first();
        if (activeItem.length > 0)
        {
            this._focusCalendarItem(activeItem);
        }
        else
        {
            this._focusFirstCalendarItem();
        }
    },

    _selectCalendarItem: function (calendarControl, closeCalendar)
    {
        var _calObj = this.currentCalendarUpdateObject;
        itemContainer = _calObj.calendarContent;
        if (this.mode === 'day')
        {
            var selectedDay = itemContainer.find(".day.active");
            selectedDay.trigger("click");
            if (_calObj.isDateTime && closeCalendar)
            {
                _calObj.timeContent.find(".timepicker-ok-button").trigger("click");
            }
        }
        else
        {
            var itemToSelect = itemContainer.find(".active");
            var format = _calObj.textbox.data("format");
            if (this.mode === 'month' || this.mode === "year")
            {
                itemToSelect.trigger("click");
            }
        }

        return true;
    },

    _focusTimeControls: function ()
    {
        var firstSpinnerText = $(this.currentCalendarUpdateObject.spinnerWrapper.find(".spinner-text-input")[0]);
        firstSpinnerText.trigger("focus").trigger("select");

        this.currentCalendarUpdateObject.isTimeFocused = true;
    },

    _getElementForDirection: function (currentElement, direction, calendarContent)
    {
        var currentClasses = currentElement[0].className.split(' ');
        var currentCoordinates = null;
        var isDayMode = false;
        for (var i = 0; i < currentClasses.length; i++)
        {
            if (currentClasses[i].indexOf("xy_") === 0)
            {
                currentCoordinates = currentClasses[i].replace("xy_", "").split('_');
            }
            else if (currentClasses[i] === "day")
            {
                isDayMode = true;
            }
        }
        if (currentCoordinates.length === 2)
        {
            var calendarItems = calendarContent.find("[class*='xy_']");
            var nrOfRows = calendarContent.find("[class*='xy_0_']").length;
            var nrOfColumns = 0;
            if (calendarItems.length > 0 && nrOfRows > 0)
            {
                nrOfColumns = calendarItems.length / nrOfRows;
            }
            var x = parseInt(currentCoordinates[0]);
            var y = parseInt(currentCoordinates[1]);
            switch (direction)
            {
                case this.leftKey:
                    x--;
                    break;
                case this.upKey:
                    y--;
                    break;
                case this.rightKey:
                    x++;
                    break;
                case this.downKey:
                    y++;
                    break;
            }
            if (x < 0)
            {
                x = nrOfColumns - 1;
                y--;
            }
            else if (x >= nrOfColumns)
            {
                x = 0;
                y++;
            }
            if (y < 0)
            {
                //focus day in previous month above this day
                this._pageTopItems(this.leftKey);
                var nrOfDayRows = parseInt(this.currentCalendarUpdateObject.calendarContent.find(".week").length, 10);
                if (checkExists(nrOfDayRows))
                {
                    if (isDayMode)
                    {
                        y = nrOfDayRows - 2;
                        while (calendarContent.find(".xy_" + x + "_" + y).hasClass("not-of-current-month"))
                        {
                            y--;
                        }
                    }
                    else
                    {
                        y = nrOfDayRows - 1;
                    }
                }
                else
                {
                    y = 0;
                }
            }
            else if (y >= nrOfRows)
            {
                //focus day in next month below this day
                this._pageTopItems(this.rightKey);
                y = 0;
                while (calendarContent.find(".xy_" + x + "_" + y).hasClass("not-of-current-month"))
                {
                    y++;
                }
            }

            var movedDateElement = this.currentCalendarUpdateObject.calendarContent.find(".xy_" + x + "_" + y);
            if (movedDateElement.length > 0)
            {
                return movedDateElement;
            }
            return null;
        }
        return null;
    },

    _pageTopItems: function (direction)
    {
        var _calObj = this.currentCalendarUpdateObject;
        var activeElement = _calObj.calendarContent.find(".active");
        if (direction === this.leftKey)
        {
            _calObj.topCalendarEl.find(".top-calendar-left").trigger("click");
        }
        else if (direction === this.rightKey)
        {
            _calObj.topCalendarEl.find(".top-calendar-right").trigger("click");
        }
        _calObj = this.currentCalendarUpdateObject;
        if (this.mode === 'day')
        {
            var currentSelectedDate = new Date(_calObj.calendarOutsideEl.find(".today-text-value").text());

            var firstDateOnNewMonth = this._convertDateStringToObject(_calObj.calendarContent.find(".day:not(.not-of-current-month)")[0].getAttribute("calendardate"));
            var newMonth = firstDateOnNewMonth.getMonth();
            var newYear = firstDateOnNewMonth.getFullYear();
            var newDay = currentSelectedDate.getDate();
            var newDate = currentSelectedDate;
            var daysInProposedMonth = Date.daysInMonth(newMonth, newYear);
            if (newDay > daysInProposedMonth)
            {
                newDay = daysInProposedMonth;
            }
            newDate.setDate(1);
            newDate.setFullYear(newYear);
            newDate.setMonth(newMonth);
            newDate.setDate(newDay);
            var activeDate = this._convertDateObjToString(newDate);
            _calObj.calendarContent.find(".selected").removeClass("selected");
            _calObj.calendarContent.find("[calendarDate='" + activeDate + "']").addClass("active");
        }
        else if (this.mode === 'month')
        {
            var activeMonth = _calObj.calendarContent.find("a[month=" + activeElement[0].getAttribute("month") + "]");
            activeMonth.addClass("active");
        }
    },


    _tabBackBetweenControls: function (isTopItemSelected, _calObj, selectedTopItem)
    {
        if (_calObj.isTime)
        {
            this._tabBackBetweenTimeControls(_calObj);
        }
        else
        {
            if (!isTopItemSelected)
            {
                if (!_calObj.isTimeFocused)
                {
                    _calObj.topCalendarEl.find(".today-title").trigger("focus");
                }
                else if (_calObj.isDateTime)
                {
                    var currentFocusedEl = $(document.activeElement);
                    if (currentFocusedEl.attr("type") === "radio")
                    {
                        _calObj.isTimeFocused = false;
                        this._focusActiveCalendarItem();
                    }
                    else
                    {
                        this._tabBackBetweenTimeControls(_calObj);
                    }
                }
            }
            else
            {
                //circular tabbing back to last selectable item
                if (_calObj.isDateTime)
                {
                    _calObj.isTimeFocused = true;
                    _calObj.timeContent.find(".timepicker-cancel-button").trigger("focus");
                }
                else
                {
                    this._focusActiveCalendarItem();
                }
            }
        }
    },

    _tabBackBetweenTimeControls: function (_calObj)
    {
        var currentFocusedEl = $(document.activeElement);
        if (currentFocusedEl.attr("type") === "text")
        {
            var textBoxes = _calObj.timeContent.find(".spinner-text-input");
            var currentTextBoxIndex = textBoxes.index(currentFocusedEl);
            if (currentTextBoxIndex === 0)
            {
                _calObj.isTimeFocused = false;
                this._focusActiveCalendarItem();
            }
            else
            {
                textBoxes[currentTextBoxIndex - 1].focus();
                textBoxes[currentTextBoxIndex - 1].select();
            }
            return false;
        }
        else if (currentFocusedEl.hasClass("timepicker-ok-button"))
        {
            var textBoxes = _calObj.timeContent.find(".spinner-text-input");
            var lastTimeTextBox = textBoxes[textBoxes.length - 1];
            lastTimeTextBox.focus();
            lastTimeTextBox.select();
        }
        else if (currentFocusedEl.hasClass("timepicker-cancel-button"))
        {
            _calObj.timeContent.find(".timepicker-ok-button").trigger("focus");
        }
    },

    _tabForwardBetweenControls: function (isTopItemSelected, _calObj, selectedTopItem, selectedItem)
    {
        if (isTopItemSelected)
        {
            _calObj.topCalendarEl.find(".today-title").trigger("blur");
            if (selectedItem.length > 0)
            {
                this._focusActiveCalendarItem();
            }
            else
            {
                this._focusFirstCalendarItem();
            }
        }
        else
        {
            if (_calObj.isDateTime && !_calObj.isTimeFocused && selectedItem.length > 0)
            {
                this._focusTimeControls();
            }
            else
            {
                if (_calObj.isDateTime || _calObj.isTime)
                {
                    this._tabForwardBetweenTimeControls(_calObj);
                }
                else
                {
                    _calObj.topCalendarEl.find(".today-title").trigger("focus");
                }
            }
        }
    },

    _tabForwardBetweenTimeControls: function (_calObj)
    {
        var currentFocusedEl = $(document.activeElement);
        if (currentFocusedEl.attr("type") === "radio")
        {
            var firstTimeTextBox = _calObj.spinnerWrapper.find(".spinner-text-input[inputindex='0']");
            firstTimeTextBox.trigger("focus").trigger("select");
        }
        else if (currentFocusedEl.attr("type") === "text")
        {
            var textBoxes = _calObj.timeContent.find(".spinner-text-input");
            var currentTextBoxIndex = textBoxes.index(currentFocusedEl);
            if (currentTextBoxIndex === textBoxes.length - 1)
            {
                var firstTimeButton = _calObj.timeContent.find(".timepicker-ok-button");
                currentFocusedEl.removeClass("active");
                //IE does not remove the selection of the last spinner automatically
                if (SourceCode.Forms.Browser.msie)
                {
                    if (document.selection)
                    {
                        document.selection.empty();
                    }
                    else if (window.getSelection)
                    {
                        window.getSelection().removeAllRanges();
                    }
                }
                firstTimeButton.trigger("focus");
            }
            else
            {
                textBoxes[currentTextBoxIndex + 1].focus();
                textBoxes[currentTextBoxIndex + 1].select();
            }
        }
        else if (currentFocusedEl.hasClass("timepicker-ok-button"))
        {
            _calObj.timeContent.find(".timepicker-cancel-button").trigger("focus");
        }
        else if (currentFocusedEl.hasClass("timepicker-cancel-button"))
        {
            _calObj.isTimeFocused = false;
            _calObj.topCalendarEl.find(".today-title").trigger("focus");
        }
    },

    _moveBetweenTimeElements: function (timeContent, direction)
    {
        var currentFocusedEl = $(document.activeElement);
        if (currentFocusedEl.attr("type") === "radio")
        {
            if (direction === this.rightKey || direction === this.leftKey)
            {
                var radioLabels = timeContent.find(".input-control-group.radio").find("label");
                if (radioLabels.length > 1)
                {
                    var rb1 = $(radioLabels[0]);
                    var rb2 = $(radioLabels[1]);
                    var checked = rb1.hasClass("checked");
                    rb1.toggleClass("checked", !checked);
                    rb2.toggleClass("checked", checked);
                }
            }
        }
    }
}


CalendarUpdateObject = function (textbox, button, calendarPickerOptions, calendarObject)
{
    this.textbox = (textbox) ? jQuery(textbox) : null;
    this.button = jQuery(button);
    this.button.addClass('calender-control-button');
    this.calendarPickerOptions = calendarPickerOptions;

    var calObj = $(calendarObject.element);
    this.timeContent = null;
    this.spinnerWrapper = null;
    this.calendarOutsideEl = null;
    this.calendarContent = null;
    this.topCalendarEl = null;
    this.isDateTime = false;
    this.isTime = false;
    if (calObj.length > 0)
    {
        this.calendarOutsideEl = calObj.find(".calendar-content-outside");
        this.calendarContent = (checkExists(this.calendarOutsideEl)) ? this.calendarOutsideEl.find(".calendar-content") : null;
        this.topCalendarEl = calObj.find(".top-calendar");

        if (checkExists(calendarPickerOptions))
        {
            this.isDateTime = calendarPickerOptions.type === "dateTimePicker";
            this.isTime = calendarPickerOptions.type === "timePicker";
        }
        if (this.isDateTime || this.isTime)
        {
            this.timeContent = (calObj) ? calObj.find(".timepicker-content") : null;
            this.spinnerWrapper = (this.timeContent) ? this.timeContent.find(".spinner") : null;
        }
    }
    this.isTimeFocused = false;
    this.selectedDate = null;
}
