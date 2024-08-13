(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.Spinner = {

		options: {
			inputs: [{
				range: {
					min: null,
					max: null,
					step: 1
				},
				values: [],
				displays: {},
				specials: {},
				defaultValue: "",
				validationHandling: "none",
				errorMessage: null,
				selectOnFocus: false
			}],
			increment: 100
		},

		_create: function ()
		{
			var _this = this;

			this.lastFocusedIndex = 0;

			this.spinnerDiv = this.element;
			this.spinnerInputs = this.element.find(".spinner-text-input");
			this.spinnerUpButton = this.element.find(".spinner-up-button");
			this.spinnerDownButton = this.element.find(".spinner-down-button");

            this.spinnerDiv.on("focus", ".spinner-text-input:not(.disabled)", _this._onFocus.bind(_this));
            this.spinnerDiv.on("blur", ".spinner-text-input:not(.disabled)", _this._onBlur.bind(_this));
            this.spinnerDiv.on("click", ".spinner-text-input:not(.disabled)", _this._onClick.bind(_this));
            this.spinnerDiv.on("keydown", ".spinner-text-input:not(.disabled)", _this._onKeyDown.bind(_this));
            this.spinnerDiv.on("keypress", ".spinner-text-input:not(.disabled)", _this._onKeyPress.bind(_this));
            this.spinnerDiv.on("keyup", ".spinner-text-input:not(.disabled)", _this._onKeyUp.bind(_this));

            this.spinnerDiv.on("mousedown", ".spinner-up-button:not(.disabled)", _this._startIncrease.bind(_this));
            this.spinnerDiv.on("mouseup", ".spinner-up-button:not(.disabled)", _this._stopIncrease.bind(_this));
            this.spinnerDiv.on("mousemove", ".spinner-up-button:not(.disabled)", _this._stopIncrease.bind(_this));

            this.spinnerDiv.on("mousedown", ".spinner-down-button:not(.disabled)", _this._startDecrease.bind(_this));
            this.spinnerDiv.on("mouseup", ".spinner-down-button:not(.disabled)", _this._stopDecrease.bind(_this));
            this.spinnerDiv.on("mousemove", ".spinner-down-button:not(.disabled)", _this._stopDecrease.bind(_this));

			this.currentValue = [];

			for (var i = 0; i < this.options.inputs.length; i++)
			{
				this._setSingleValue(i, this.options.inputs[i].defaultValue);
			}
		},

		_decrease: function ()
		{
			var inputIndex = this.lastFocusedIndex;

			var curInput = $(this.spinnerInputs[inputIndex]);

			this.spinnerInputs.removeClass("active");
			curInput.addClass("active");

			var curInputValue = this._getSingleValue(inputIndex);

			var testValue = curInputValue.display;

			var displayValidationResult = this._validateSingleValue(inputIndex, testValue);

			if (checkExistsNotEmpty(displayValidationResult))
			{
				testValue = curInputValue.value;
			}
			else
			{
				testValue = this._getValueFromDisplayValue(inputIndex, testValue);
			}

			var valueToSet = null;

			if (this._valueInRange(inputIndex, testValue, false))
			{
				var curInputFloat = parseFloat(testValue);

				var inputModStep = ((curInputFloat - this.options.inputs[inputIndex].range.min) % this.options.inputs[inputIndex].range.step);

				if (inputModStep !== 0)
				{
					valueToSet = curInputFloat - inputModStep;
				}
				else
				{
					valueToSet = curInputFloat - this.options.inputs[inputIndex].range.step;
				}

				if (valueToSet < this.options.inputs[inputIndex].range.min)
				{
					if (this._hasSpecials(inputIndex))
					{
						var specialsValueArray = [];

						for (var specialValue in this.options.inputs[inputIndex].specials)
						{
							specialsValueArray.push(specialValue);
						}

						valueToSet = specialsValueArray[specialsValueArray.length - 1];
					}
					else
					{
						var maxModStep = ((this.options.inputs[inputIndex].range.max - this.options.inputs[inputIndex].range.min) % this.options.inputs[inputIndex].range.step);

						if (maxModStep !== 0)
						{
							valueToSet = this.options.inputs[inputIndex].range.max - maxModStep;
						}
						else
						{
							valueToSet = this.options.inputs[inputIndex].range.max;
						}
					}
				}
			}
			else if (this._valueInValues(inputIndex, testValue, false))
			{
				var curIndexOfValueInValues = this.options.inputs[inputIndex].values.indexOf(testValue);

				var lastValuesIndex = this.options.inputs[inputIndex].values.length - 1;

				if (curIndexOfValueInValues > 0)
				{
					valueToSet = this.options.inputs[inputIndex].values[curIndexOfValueInValues - 1];
				}
				else if (curIndexOfValueInValues === 0)
				{
					if (this._hasSpecials(inputIndex))
					{
						var specialsValueArray = [];

						for (var specialValue in this.options.inputs[inputIndex].specials)
						{
							specialsValueArray.push(specialValue);
						}

						valueToSet = specialsValueArray[specialsValueArray.length - 1];
					}
					else
					{
						valueToSet = this.options.inputs[inputIndex].values[lastValuesIndex];
					}
				}
			}
			else if (this._valueInSpecials(inputIndex, testValue, false))
			{
				var specialsValueArray = [];
				var curIndexOfValueInSpecials = 0;
				var indexCounter = 0;

				for (var specialValue in this.options.inputs[inputIndex].specials)
				{
					specialsValueArray.push(specialValue);

					if (testValue === specialValue)
					{
						curIndexOfValueInSpecials = indexCounter;
					}

					indexCounter++;
				}

				var lastSpecialsIndex = specialsValueArray.length - 1;

				if (curIndexOfValueInSpecials > 0)
				{
					valueToSet = specialsValueArray[curIndexOfValueInSpecials - 1];
				}
				else if (curIndexOfValueInSpecials === 0)
				{
					if (this._hasRange(inputIndex))
					{
						var maxModStep = ((this.options.inputs[inputIndex].range.max - this.options.inputs[inputIndex].range.min) % this.options.inputs[inputIndex].range.step);

						if (maxModStep !== 0)
						{
							valueToSet = this.options.inputs[inputIndex].range.max - maxModStep;
						}
						else
						{
							valueToSet = this.options.inputs[inputIndex].range.max;
						}
					}
					else if (this._hasValues(inputIndex))
					{
						var lastValuesIndex = this.options.inputs[inputIndex].values.length - 1;

						valueToSet = this.options.inputs[inputIndex].values[lastValuesIndex];
					}
				}
			}

			this._setSingleValue(inputIndex, valueToSet);

			if (this.options.inputs[inputIndex].selectOnFocus)
			{
				this.spinnerInputs[inputIndex].select();
			}
		},

		_focusInputLeft: function (index)
		{
			var inputIndex = parseInt(index) - 1;
			if (inputIndex >= 0)
			{
				var prevInput = this.spinnerInputs[inputIndex];
				var jqPrevInput = $(prevInput);

				jqPrevInput.trigger("focus");

				if (this.options.inputs[inputIndex].selectOnFocus)
				{
					prevInput.select();
				}
				else
				{
					jqPrevInput.caret("end");
				}
			}
		},

		_focusInputRight: function (index)
		{
			var inputIndex = parseInt(index) + 1;
			if (inputIndex < this.spinnerInputs.length)
			{
				var nextInput = this.spinnerInputs[inputIndex];
				var jqNextInput = $(nextInput);

				jqNextInput.trigger("focus");

				if (this.options.inputs[inputIndex].selectOnFocus)
				{
					nextInput.select();
				}
				else
				{
					jqNextInput.caret("start");
				}
			}
		},

		_focusInputRightWithVal: function (index, valueOverFlow)
		{
			var inputIndex = parseInt(index) + 1;
			if (inputIndex < this.spinnerInputs.length)
			{
				var nextInput = this.spinnerInputs[inputIndex];
				var jqNextInput = $(nextInput);

				jqNextInput.trigger("focus");

				var newVal = valueOverFlow;
				jqNextInput.val(newVal);

				jqNextInput.caret("end");
			}
		},

		_getDisplayValueFromValue: function (inputIndex, checkValue)
		{
			if (checkExists(checkValue))
			{
				checkValue = checkValue.toString();
			}
			else
			{
				return null;
			}

			var displayValue = checkValue;

			if (checkExists(this.options.inputs[inputIndex].values))
			{
				for (var i = 0; i < this.options.inputs[inputIndex].values.length; i++)
				{
					if (this.options.inputs[inputIndex].values[i].toLowerCase() === checkValue.toLowerCase())
					{
						displayValue = this.options.inputs[inputIndex].values[i].toString();
						break;
					}
				}
			}

			if (checkExists(this.options.inputs[inputIndex].specials))
			{
				if (checkExists(this.options.inputs[inputIndex].specials[checkValue]))
				{
					displayValue = this.options.inputs[inputIndex].specials[checkValue].toString();
				}
				else if (checkExists(this.options.inputs[inputIndex].specials[displayValue]))
				{
					displayValue = this.options.inputs[inputIndex].specials[displayValue].toString();
				}
			}

			if (checkExists(this.options.inputs[inputIndex].displays))
			{
				if (checkExists(this.options.inputs[inputIndex].displays[checkValue]))
				{
					displayValue = this.options.inputs[inputIndex].displays[checkValue].toString();
				}
				else if (checkExists(this.options.inputs[inputIndex].displays[displayValue]))
				{
					displayValue = this.options.inputs[inputIndex].displays[displayValue].toString();
				}
			}

			return displayValue;
		},

		_getValueFromDisplayValue: function (inputIndex, checkValue)
		{
			if (checkExists(checkValue))
			{
				checkValue = checkValue.toString();
			}
			else
			{
				return null;
			}

			checkValue = checkValue.toLowerCase();

			var realValue = checkValue;

			if (checkExists(this.options.inputs[inputIndex].values))
			{
				for (var i = 0; i < this.options.inputs[inputIndex].values.length; i++)
				{
					if (this.options.inputs[inputIndex].values[i].toLowerCase() === checkValue)
					{
						realValue = this.options.inputs[inputIndex].values[i].toString();
						break;
					}
				}
			}

			if (checkExists(this.options.inputs[inputIndex].specials))
			{
				for (var value in this.options.inputs[inputIndex].specials)
				{
					if ((this.options.inputs[inputIndex].specials[value].toLowerCase() === checkValue) || (this.options.inputs[inputIndex].specials[value].toLowerCase() === realValue))
					{
						realValue = value.toString();
						break;
					}
				}
			}

			if (checkExists(this.options.inputs[inputIndex].displays))
			{
				for (var value in this.options.inputs[inputIndex].displays)
				{
					if ((this.options.inputs[inputIndex].displays[value].toLowerCase() === checkValue) || (this.options.inputs[inputIndex].displays[value].toLowerCase() === realValue.toLowerCase()))
					{
						realValue = value.toString();
						break;
					}
				}
			}

			return realValue;
		},

		_getSingleValue: function (inputIndex)
		{
			return {
				value: this.currentValue[inputIndex],
				display: $(this.spinnerInputs[inputIndex]).val()
			};
		},

		_hasDisplays: function (inputIndex)
		{
			if (checkExists(this.options.inputs[inputIndex].displays))
			{
				var keyCount = 0;

				for (var key in this.options.inputs[inputIndex].displays)
				{
					keyCount++;
				}

				if (keyCount > 0)
				{
					return true;
				}
			}

			return false;
		},

		_hasRange: function (inputIndex)
		{
			if ((checkExists(this.options.inputs[inputIndex].range)) && (checkExists(this.options.inputs[inputIndex].range.min)) && (checkExists(this.options.inputs[inputIndex].range.max)) && (checkExists(this.options.inputs[inputIndex].range.step)))
			{
				return true;
			}

			return false;
		},

		_hasSpecials: function (inputIndex)
		{
			if (checkExists(this.options.inputs[inputIndex].specials))
			{
				var keyCount = 0;

				for (var key in this.options.inputs[inputIndex].specials)
				{
					keyCount++;
				}

				if (keyCount > 0)
				{
					return true;
				}
			}

			return false;
		},

		_hasValues: function (inputIndex)
		{
			if ((checkExists(this.options.inputs[inputIndex].values)) && (this.options.inputs[inputIndex].values.length > 0))
			{
				return true;
			}

			return false;
		},

		_increase: function ()
		{
			var inputIndex = this.lastFocusedIndex;

			var curInput = $(this.spinnerInputs[inputIndex]);

			this.spinnerInputs.removeClass("active");
			curInput.addClass("active");

			var curInputValue = this._getSingleValue(inputIndex);

			var testValue = curInputValue.display;

			var displayValidationResult = this._validateSingleValue(inputIndex, testValue);

			if (checkExistsNotEmpty(displayValidationResult))
			{
				testValue = curInputValue.value;
			}
			else
			{
				testValue = this._getValueFromDisplayValue(inputIndex, testValue);
			}

			var valueToSet = null;

			if (this._valueInRange(inputIndex, testValue, false))
			{
				var curInputFloat = parseFloat(testValue);

				var inputModStep = ((curInputFloat - this.options.inputs[inputIndex].range.min) % this.options.inputs[inputIndex].range.step);

				if (inputModStep !== 0)
				{
					valueToSet = curInputFloat - inputModStep + this.options.inputs[inputIndex].range.step;
				}
				else
				{
					valueToSet = curInputFloat + this.options.inputs[inputIndex].range.step;
				}

				if (valueToSet > this.options.inputs[inputIndex].range.max)
				{
					if (this._hasSpecials(inputIndex))
					{
						for (var specialValue in this.options.inputs[inputIndex].specials)
						{
							valueToSet = specialValue;
							break;
						}
					}
					else
					{
						valueToSet = this.options.inputs[inputIndex].range.min;
					}
				}
			}
			else if (this._valueInValues(inputIndex, testValue, false))
			{
				var curIndexOfValueInValues = this.options.inputs[inputIndex].values.indexOf(testValue);

				var lastValuesIndex = this.options.inputs[inputIndex].values.length - 1;

				if (curIndexOfValueInValues < lastValuesIndex)
				{
					valueToSet = this.options.inputs[inputIndex].values[curIndexOfValueInValues + 1];
				}
				else if (curIndexOfValueInValues === lastValuesIndex)
				{
					if (this._hasSpecials(inputIndex))
					{
						for (var specialValue in this.options.inputs[inputIndex].specials)
						{
							valueToSet = specialValue;
							break;
						}
					}
					else
					{
						valueToSet = this.options.inputs[inputIndex].values[0];
					}
				}
			}
			else if (this._valueInSpecials(inputIndex, testValue, false))
			{
				var specialsValueArray = [];
				var curIndexOfValueInSpecials = 0;
				var indexCounter = 0;

				for (var specialValue in this.options.inputs[inputIndex].specials)
				{
					specialsValueArray.push(specialValue);

					if (testValue === specialValue)
					{
						curIndexOfValueInSpecials = indexCounter;
					}

					indexCounter++;
				}

				var lastSpecialsIndex = specialsValueArray.length - 1;

				if (curIndexOfValueInSpecials < lastSpecialsIndex)
				{
					valueToSet = specialsValueArray[curIndexOfValueInSpecials + 1];
				}
				else if (curIndexOfValueInSpecials === lastSpecialsIndex)
				{
					if (this._hasRange(inputIndex))
					{
						valueToSet = this.options.inputs[inputIndex].range.min;
					}
					else if (this._hasValues(inputIndex))
					{
						valueToSet = this.options.inputs[inputIndex].values[0];
					}
				}
			}

			this._setSingleValue(inputIndex, valueToSet);

			if (this.options.inputs[inputIndex].selectOnFocus)
			{
				this.spinnerInputs[inputIndex].select();
			}
		},

		_isTextSelected: function (inputEl)
		{
			var jTargetCaret = inputEl.caret();
			var targetValue = inputEl.val();
			return (jTargetCaret.end - jTargetCaret.start) === targetValue.length;
		},

		_onBlur: function (e)
		{
			var targetIndexStr = e.target.getAttribute("inputindex");
			var targetIndex = parseInt(targetIndexStr);

			if (checkExists(targetIndex))
			{
				var inputValue = this._getSingleValue(targetIndex);

				var validationFailedIn = this._validateSingleValue(targetIndex, inputValue.display);

				if (checkExistsNotEmpty(validationFailedIn))
				{
					if (checkExistsNotEmpty(this.options.inputs[targetIndex].validationHandling))
					{
						if (this.options.inputs[targetIndex].validationHandling === "internal")
						{
							if (checkExistsNotEmpty(this.options.inputs[targetIndex].errorMessage))
							{
								popupManager.showError(this.options.inputs[targetIndex].errorMessage);
							}
							else
							{
								if (validationFailedIn === "range")
								{
									popupManager.showError(Resources.MessageBox.SpinnerValueNotInRange.format(this.options.inputs[targetIndex].range.min, this.options.inputs[targetIndex].range.max));
								}
								else if (validationFailedIn === "rangespecials")
								{
									popupManager.showError(Resources.MessageBox.SpinnerValueNotInRangeOrSpecials.format(this.options.inputs[targetIndex].range.min, this.options.inputs[targetIndex].range.max, this._specialsErrorString(targetIndex)));
								}
								else if (validationFailedIn === "values")
								{
									popupManager.showError(Resources.MessageBox.SpinnerValueNotInValues.format(this._valuesErrorString(targetIndex)));
								}
								else if (validationFailedIn === "valuesspecials")
								{
									popupManager.showError(Resources.MessageBox.SpinnerValueNotInValuesOrSpecials.format(this._valuesErrorString(targetIndex), this._specialssErrorString(targetIndex)));
								}
							}
						}
						else if (this.options.inputs[targetIndex].validationHandling === "external")
						{
							this._trigger("spinnervalidationfailed", null, {});
						}
					}

					this._setSingleValue(targetIndex, inputValue.value);
				}
				else
				{
					this._setSingleValue(targetIndex, inputValue.display);
				}
			}

			this.spinnerDiv.removeClass("active");
		},

		_onClick: function (e)
		{
			this.spinnerDiv.addClass("active");

			var targetIndex = e.target.getAttribute("inputindex");

			if (checkExists(targetIndex))
			{
				if (this.options.inputs[targetIndex].selectOnFocus)
				{
					e.target.select();
				}

				this.lastFocusedIndex = parseInt(targetIndex, 10);
			}
		},

		_onFocus: function (e)
		{
			this.spinnerDiv.addClass("active");

			this.spinnerInputs.removeClass("active");
			jQuery(e.target).addClass("active");

			var targetIndex = e.target.getAttribute("inputindex");

			if (checkExists(targetIndex))
			{
				this.lastFocusedIndex = parseInt(targetIndex);
			}
		},

		_onKeyDown: function (e)
		{
			var targetInputIndex = e.target.getAttribute("inputindex");

			switch (e.which)
			{
				case 37:
					this._focusInputLeft(targetInputIndex);
					return false;
					break;
				case 38:
					this._increase();
					return false;
					break;
				case 39:
					this._focusInputRight(targetInputIndex);
					return false;
					break;
				case 40:
					this._decrease();
					return false;
					break;
				case 8:
					var t = $(e.target);
					if ((t.val().length === 1 && targetInputIndex > 0) || this._isTextSelected(t))
					{
						if (checkExistsNotEmpty(this.options.inputs[targetInputIndex].defaultValue))
						{
							this._setSingleValue(targetInputIndex, this.options.inputs[targetInputIndex].defaultValue);
						}
						else
						{
							this._setSingleValue(targetInputIndex, "");
						}

						var prevInput = this.spinnerInputs[targetInputIndex - 1];
						var jqPrevInput = $(prevInput);

						jqPrevInput.trigger("focus");
						jqPrevInput.caret("end");

						return false;
					}
					break;
			}
		},

		_onKeyPress: function (e)
		{
			var targetInputIndex = e.target.getAttribute("inputindex");

			if (e.which === 58)
			{
				this._focusInputRight(targetInputIndex);
				return false;
			}
			else if (e.charCode !== 0)
			{
				var jTargetCaret = $(e.target).caret();
				var targetValue = this._getSingleValue(targetInputIndex).display;
				var targetCaretStart = jTargetCaret.start;
				var targetCaretEnd = jTargetCaret.end;

				var stringValOfChar = String.fromCharCode(e.charCode);

				var maxInputLength = e.target.getAttribute("maxlength");

				var nextInputIndex = parseInt(targetInputIndex) + 1;

				if ((checkExistsNotEmpty(maxInputLength)) && (targetCaretStart === targetCaretEnd && targetCaretStart.toString() === maxInputLength))
				{
					if ((checkExists(this.options.inputs[nextInputIndex])) && (!this._partialValidateSingleValue(nextInputIndex, stringValOfChar)))
					{
						this._focusInputRightWithVal(targetInputIndex, stringValOfChar);
						return false;
					}
				}
				else
				{
					var testValue = "";

					var targetValStart = targetValue.substring(0, targetCaretStart);
					var targetValEnd = targetValue.substring(targetCaretEnd, targetValue.length);

					testValue = targetValStart + stringValOfChar + targetValEnd;

					return !this._partialValidateSingleValue(targetInputIndex, testValue);
				}
			}
			else if (((e.which !== 0) && (e.which !== 8)) || ((e.keyCode >= 37) && (e.keyCode <= 40)))
			{
				return false;
			}
		},

		_onKeyUp: function (e)
		{
			var targetInputIndex = e.target.getAttribute("inputindex");
			var targetValue = this._getSingleValue(targetInputIndex);

			if (!checkExistsNotEmpty(targetValue))
			{
				if (checkExistsNotEmpty(this.options.inputs[targetInputIndex].defaultValue))
				{
					this._setSingleValue(targetInputIndex, this.options.inputs[targetInputIndex].defaultValue);
				}
				else
				{
					this._setSingleValue(targetInputIndex, "");
				}

				e.target.select();
			}
		},

		_partialValidateSingleValue: function (inputIndex, testValue)
		{
			var inputFailedValidation = false;

			if (this._hasRange(inputIndex))
			{
				inputFailedValidation = !this._partialValueInRange(inputIndex, testValue, true);
			}
			else if (this._hasValues(inputIndex))
			{
				inputFailedValidation = !this._partialValueInValues(inputIndex, testValue, true);
			}

			if ((inputFailedValidation) && (this._hasSpecials(inputIndex)))
			{
				inputFailedValidation = !this._partialValueInSpecials(inputIndex, testValue, true);
			}

			if ((inputFailedValidation) && (this._hasDisplays(inputIndex)))
			{
				inputFailedValidation = !this._partialValueInDisplays(inputIndex, testValue, true);
			}

			return inputFailedValidation;
		},

		_partialValueInDisplays: function (inputIndex, testValue, skipDisplaysCheck)
		{
			if ((skipDisplaysCheck) || (this._hasDisplays(inputIndex)))
			{
				var curValueLength = testValue.length;
				var curValLower = testValue.toLowerCase();

				for (var displaysKey in this.options.inputs[inputIndex].displays)
				{
					var displaysValue = this.options.inputs[inputIndex].displays[displaysKey];
					var valLower = displaysValue.toLowerCase();

					if ((displaysValue.length >= curValueLength) && (valLower.substr(0, curValueLength) === curValLower))
					{
						return true;
					}
				}
			}

			return false;
		},

		_partialValueInRange: function (inputIndex, testValue, skipRangeCheck)
		{
			if ((skipRangeCheck) || (this._hasRange(inputIndex)))
			{
				if (!isNaN(testValue))
				{
					if (parseFloat(testValue) <= this.options.inputs[inputIndex].range.max)
					{
						return true;
					}
				}
			}

			return false;
		},

		_partialValueInSpecials: function (inputIndex, testValue, skipSpecialsCheck)
		{
			if ((skipSpecialsCheck) || (this._hasSpecials(inputIndex)))
			{
				var curValueLength = testValue.length;
				var curValLower = testValue.toLowerCase();

				for (var specialsKey in this.options.inputs[inputIndex].specials)
				{
					var specialsValue = this.options.inputs[inputIndex].specials[specialsKey];
					var keyLower = specialsKey.toLowerCase();
					var valLower = specialsValue.toLowerCase();

					if ((specialsKey.length >= curValueLength) && (keyLower.substr(0, curValueLength) === curValLower))
					{
						return true;
					}

					if ((specialsValue.length >= curValueLength) && (valLower.substr(0, curValueLength) === curValLower))
					{
						return true;
					}
				}
			}

			return false;
		},

		_partialValueInValues: function (inputIndex, testValue, skipValuesCheck)
		{
			if ((skipValuesCheck) || (this._hasValues(inputIndex)))
			{
				var curValueLength = testValue.length;
				var curValLower = testValue.toLowerCase();

				for (var i = 0; i < this.options.inputs[inputIndex].values.length; i++)
				{
					var curValInValues = this.options.inputs[inputIndex].values[i];
					var curValInValLower = curValInValues.toLowerCase();

					if ((curValInValues.length >= curValueLength) && (curValInValLower.substr(0, curValueLength) === curValLower))
					{
						return true;
					}
				}
			}

			return false;
		},

		_setSingleValue: function (inputIndex, setValue)
		{

			var valueToSet = this._getValueFromDisplayValue(inputIndex, setValue);
			var displayToSet = this._getDisplayValueFromValue(inputIndex, valueToSet);

			if ((valueToSet !== this._getSingleValue(inputIndex).value) || (displayToSet !== this._getSingleValue(inputIndex).display))
			{
				this.currentValue[inputIndex] = valueToSet;

				var jqInput = $(this.spinnerInputs[inputIndex]);

				jqInput.val(displayToSet);

				jqInput.trigger("change");
			}
		},

		_specialsErrorString: function (inputIndex)
		{
			var returnString = "";

			var specialsLength = 0;

			for (var specialsKey in this.options.inputs[inputIndex].specials)
			{
				specialsLength++;
			}

			var counter = 0;

			for (var specialsKey in this.options.inputs[inputIndex].specials)
			{
				returnString += specialsKey.toString();

				if (counter === (specialsLength - 1))
				{
					returnString += " " + Resources.MessageBox.OrText + " ";
				}
				else
				{
					returnString += ", ";
				}

				returnString += this.options.inputs[inputIndex].specials[specialsKey].toString();

				if (counter !== (specialsLength - 1))
				{
					returnString += ", ";
				}

				counter++;
			}

			return returnString;
		},

		_startDecrease: function ()
		{
			this.startDecreaseTimer = window.setTimeout(function ()
			{
				this.decreaseTimer = window.setInterval(this._decrease.bind(this), this.options.increment);
			}.bind(this), 500);

			this._decrease();
		},

		_startIncrease: function ()
		{
			this.startIncreaseTimer = window.setTimeout(function ()
			{
				this.increaseTimer = window.setInterval(this._increase.bind(this), this.options.increment);
			}.bind(this), 500);

			this._increase();
		},

		_stopDecrease: function ()
		{
			if (checkExists(this.startDecreaseTimer))
			{
				window.clearTimeout(this.startDecreaseTimer);
			}

			if (checkExists(this.decreaseTimer))
			{
				window.clearInterval(this.decreaseTimer);
			}
		},

		_stopIncrease: function ()
		{
			if (checkExists(this.startIncreaseTimer))
			{
				window.clearTimeout(this.startIncreaseTimer);
			}

			if (checkExists(this.increaseTimer))
			{
				window.clearInterval(this.increaseTimer);
			}
		},

		_validateSingleValue: function (inputIndex, singleValue)
		{
			var checkValue = this._getValueFromDisplayValue(inputIndex, singleValue);
			var valueShouldBeIn = "";
			var inputFailedValidation = false;

			if (this._hasRange(inputIndex))
			{
				valueShouldBeIn = "range";

				inputFailedValidation = !this._valueInRange(inputIndex, checkValue, true);
			}
			else if (this._hasValues(inputIndex))
			{
				valueShouldBeIn = "values";

				inputFailedValidation = !this._valueInValues(inputIndex, checkValue, true);
			}

			if ((inputFailedValidation) && (this._hasSpecials(inputIndex)))
			{
				if (valueShouldBeIn === "range")
				{
					valueShouldBeIn = "rangespecials";
				}
				else if (valueShouldBeIn === "values")
				{
					valueShouldBeIn = "valuesspecials";
				}

				inputFailedValidation = !this._valueInSpecials(inputIndex, checkValue, true);
			}

			if (inputFailedValidation)
			{
				return valueShouldBeIn;
			}
			else
			{
				return null;
			}
		},

		validateValue: function (value)
		{
			var validationResult = {
				failedValidation: false,
				validationInfo: []
			};

			for (var i = 0; i < this.options.inputs.length; i++)
			{
				var inputValidationResult = this._validateSingleValue(i, value[i]);

				if (checkExistsNotEmpty(inputValidationResult))
				{
					validationResult.failedValidation = true;
					validationResult.validationInfo.push({ failedIndex: i, failedIn: inputValidationResult });
				}

			}

			return validationResult;
		},

		_valueInRange: function (inputIndex, checkValue, skipRangeCheck)
		{
			if ((skipRangeCheck) || (this._hasRange(inputIndex)))
			{
				if ((!isNaN(checkValue)) && (parseFloat(checkValue) >= this.options.inputs[inputIndex].range.min) && (parseFloat(checkValue) <= this.options.inputs[inputIndex].range.max))
				{
					return true;
				}
			}

			return false;
		},

		_valueInSpecials: function (inputIndex, checkValue, skipSpecialsCheck)
		{
			if ((skipSpecialsCheck) || (this._hasSpecials(inputIndex)))
			{
				if (checkExists(this.options.inputs[inputIndex].specials[checkValue]))
				{
					return true;
				}
			}

			return false;
		},

		_valueInValues: function (inputIndex, checkValue, skipValuesCheck)
		{
			if ((skipValuesCheck) || (this._hasValues(inputIndex)))
			{
				for (var i = 0; i < this.options.inputs[inputIndex].values.length; i++)
				{
					if (this.options.inputs[inputIndex].values[i].toLowerCase() === checkValue.toLowerCase())
					{
						return true;
					}
				}
			}

			return false;
		},

		_valuesErrorString: function (inputIndex)
		{
			var returnString = "";

			for (var i = 0; i < this.options.inputs[inputIndex].values.length; i++)
			{
				returnString += this.options.inputs[inputIndex].values[i].toString();

				if (i === (this.options.inputs[inputIndex].values.length - 2))
				{
					returnString += " " + Resources.MessageBox.OrText + " ";
				}
				else if (i !== (this.options.inputs[inputIndex].values.length - 1))
				{
					returnString += ", ";
				}
			}

			return returnString;
		},

		disable: function ()
		{
			this.spinnerDiv.addClass("disabled");

			this.spinnerInputs.prop("disabled", true);
			this.spinnerInputs.addClass("disabled");

			this.spinnerUpButton.addClass("disabled");
			this.spinnerDownButton.addClass("disabled");
		},

		editInputsHtml: function (jqSpinnerDiv, htmlOptions)
		{
			var curInputs = jqSpinnerDiv.find(".spinner-text-input");

			if (curInputs.length < htmlOptions.inputsLength)
			{
				var jqSpinnerInputWrapper = jqSpinnerDiv.find(".spinner-input-wrapper");

				for (var i = curInputs.length; i < htmlOptions.inputsLength; i++)
				{
					var curInputInfo = null;

					if ((checkExists(htmlOptions.inputsInfo)) && (checkExists(htmlOptions.inputsInfo[i])))
					{
						curInputInfo = htmlOptions.inputsInfo[i];
					}

					jqSpinnerInputWrapper.append(this.inputHtml(i, curInputInfo));
				}
			}
			else if (curInputs.length > htmlOptions.inputsLength)
			{
				for (var i = (curInputs.length - 1) ; i >= htmlOptions.inputsLength; i--)
				{
					jqSpinnerDiv.find(".spinner-text-input").last().remove();

					jqSpinnerDiv.find(".spinner-delimiter").last().remove();
				}
			}

			for (var j = 0; j < htmlOptions.inputsLength; j++)
			{
				var curInput = $(jqSpinnerDiv.find(".spinner-text-input")[j]);

				if (j !== 0)
				{
					if ((checkExists(htmlOptions.inputsInfo)) && (checkExists(htmlOptions.inputsInfo[j])) && (checkExists(htmlOptions.inputsInfo[j].delimiterBeforeInput)))
					{
						$(jqSpinnerDiv.find(".spinner-delimiter")[j - 1]).text(htmlOptions.inputsInfo[j].delimiterBeforeInput);
					}
					else
					{
						$(jqSpinnerDiv.find(".spinner-delimiter")[j - 1]).text("");
					}
				}

				if ((checkExists(htmlOptions.inputsInfo)) && (checkExists(htmlOptions.inputsInfo[j])) && (checkExists(htmlOptions.inputsInfo[j].maxInputLength)))
				{
					curInput.attr("maxlength", htmlOptions.inputsInfo[j].maxInputLength);
				}
				else
				{
					curInput.removeAttr("maxlength");
				}

				if ((checkExists(htmlOptions.inputsInfo)) && (checkExists(htmlOptions.inputsInfo[j])) && (checkExists(htmlOptions.inputsInfo[j].rightAlign)))
				{
					curInput.addClass("right-align");
				}
				else
				{
					curInput.removeClass("right-align");
				}
			}
		},

		enable: function ()
		{
			this.spinnerDiv.removeClass("disabled");

			this.spinnerInputs.prop("disabled", false);
			this.spinnerInputs.removeClass("disabled");

			this.spinnerUpButton.removeClass("disabled");
			this.spinnerDownButton.removeClass("disabled");
		},

		html: function (htmlOptions)
		{
			var spinnerDivString = "<div ";

			if (checkExistsNotEmpty(htmlOptions.id))
			{
				spinnerDivString += "id='" + htmlOptions.id + "' ";
			}

			spinnerDivString += "class='spinner'><div class='spinner-inputs'><div class='spinner-input-wrapper'>";

			for (var i = 0; i < htmlOptions.inputsLength; i++)
			{
				var curInputInfo = null;

				if ((checkExists(htmlOptions.inputsInfo)) && (checkExists(htmlOptions.inputsInfo[i])))
				{
					curInputInfo = htmlOptions.inputsInfo[i];
				}

				spinnerDivString += this.inputHtml(i, curInputInfo);
			}

			spinnerDivString += "</div></div>";

			spinnerDivString += "<div class='spinner-buttons'><div class='spinner-up-button-wrapper'><button type='button' class='spinner-up-button' tabindex='-1'/></div>";
			spinnerDivString += "<div class='spinner-down-button-wrapper'><button type='button' class='spinner-down-button' tabindex='-1'/></div></div>";

			spinnerDivString += "</div>";

			return spinnerDivString;
		},

		inputHtml: function (inputIndex, inputInfo)
		{
			var returnString = "";

			if (inputIndex !== 0)
			{
				var delimiterText = "";

				if ((checkExistsNotEmpty(inputInfo)) && (checkExistsNotEmpty(inputInfo.delimiterBeforeInput)))
				{
					delimiterText = inputInfo.delimiterBeforeInput;
				}

				returnString += "<span class='spinner-delimiter'>" + delimiterText + "</span>";
			}

			returnString += "<input class='spinner-text-input";

			if ((checkExistsNotEmpty(inputInfo)) && (checkExistsNotEmpty(inputInfo.rightAlign)) && (inputInfo.rightAlign))
			{
				returnString += " right-align";
			}

			returnString += "' inputindex='" + inputIndex.toString();

			if ((checkExistsNotEmpty(inputInfo)) && (checkExistsNotEmpty(inputInfo.maxInputLength)))
			{
				returnString += "' maxlength='" + inputInfo.maxInputLength;
			}

			returnString += "' type='text'>";

			return returnString;
		},

		reset: function ()
		{
			var _this = this;

			this.lastFocusedIndex = 0;

			this.spinnerDiv = this.element;
			this.spinnerInputs = this.element.find(".spinner-text-input");
			this.spinnerUpButton = this.element.find(".spinner-up-button");
			this.spinnerDownButton = this.element.find(".spinner-down-button");

			this.currentValue = [];

			for (var i = 0; i < this.options.inputs.length; i++)
			{
				this._setSingleValue(i, this.options.inputs[i].defaultValue);
			}
		},

		value: function (setValue)
		{
			if (checkExists(setValue))
			{
				if (!this.validateValue(setValue).failedValidation)
				{
					for (var i = 0; i < this.options.inputs.length; i++)
					{
						this._setSingleValue(i, setValue[i]);
					}
				}
			}
			else
			{
				var returnArray = [];

				for (var i = 0; i < this.options.inputs.length; i++)
				{
					returnArray.push(this._getSingleValue(i).value);
				}

				return returnArray;
			}
		}
	}

	if (typeof SCSpinner === "undefined") SCSpinner = SourceCode.Forms.Controls.Spinner;

	$.widget("ui.spinner", SourceCode.Forms.Controls.Spinner);

	$.extend($.ui.spinner, {
		getter: "value",
		setter: "value"
	});
})(jQuery);
