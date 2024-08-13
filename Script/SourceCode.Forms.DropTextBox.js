//DropTextBox
function DropTextBox(options)
{
	this.initialize(this.options = jQuery.extend({
		allowMultipleItems: false,
		allowTextInput: true,
		defaultMultipleDropDivider: ',',
		dropObject: null,
		element: null,
		existingElement: null,
		id: "",
		onChangedDelegate: null,
		onEnterPressDelegate: null,
		onFocusDelegate: null,
		required: false, //Does the required style need to be applied
		targetId: "",
		text: "",
		textType: "Text",
		validateDelegate: null,
		watermarkText: ''
	}, options));
}

DropTextBox.prototype = {
	$dropItem: null,
	$textBox: null,

	containsText: false,
	dropObject: null,
	dropObjects: null,
	element: null,
	text: null,

	//_addTextBoxEvents
	_addTextBoxEvents: function ($textBox)
	{
		var _this = this;

		$textBox.on({
			focus: function ()
			{
				_this._internalFocusText.apply(_this, [true]);
			},
			change: function ()
			{
				_this.changeText.call(_this);
			},
			keypress: function ()
			{
				_this.keyPressText.apply(_this, arguments);
			},
			keydown: function ()
			{
				_this.keyDownText.apply(_this, arguments);
			},
			blur: function ()
			{
				_this._internalBlurText.apply(_this, [true]);
			}
		});

		if (SourceCode.Forms.Browser.msie)
			$textBox.focusout();
	},

	//_build
	_build: function ()
	{
		var _existingElement = this.options.existingElement;

		if (!_existingElement)
			this.element.empty().append(jQuery(SCTextbox.html({
				rows: 4
			})));
		else
			this.element = jQuery(_existingElement);

		var _this = this;

		var $inputControlWrapper = this.element.on('dropDragElement', function ()
		{
			_this.dropEvent.apply(_this, arguments);
		}).find('.input-control-wrapper').empty().on({
			click: function (e)
			{
				if (e.target === this)
					_this.focusText();
			},
			keydown: function (e)
			{
				switch (e.which)
				{
					case 35: //End
						e.preventDefault();
						jQuery(this).find('.drop-object.drop-text').last().trigger('focus').caret('end');

						break;

					case 36: //Home
						e.preventDefault();
						jQuery(this).find('.drop-object.drop-text').first().trigger('focus').caret('start');

						break;
				}
			}
		});

		var $dropTextBox = jQuery("<div></div>").addClass('drop-textbox').appendTo($inputControlWrapper);

		this.$dropItem = jQuery("<span></span>").attr('id', String.generateGuid()).addClass('drop-item').css("display", "inline-block").appendTo($dropTextBox).on('click', this, this.dropItemClick);

		this._addTextBoxEvents(this.$dropText = jQuery(document.createElement('input')).addClass('drop-text').appendTo($dropTextBox));
		this._changeDisplay();

		if (this.options.allowMultipleItems)
		{
			var _multipleItemDropTextBox = document.getElementById('multipleItemDropTextBox');

			if (!_multipleItemDropTextBox)
				jQuery(document.createElement('span')).attr('id', 'multipleItemDropTextBox').css({
					visibility: 'hidden',
					position: 'absolute',
					left: 0,
					top: 300
				}).prependTo(document.body);
		}
	},

	_getTextBoxNextValue: function (textbox, nextCharCode)
	{
		var nextChar = "";
		var textBoxNextValue = textbox.val();
		if (nextCharCode !== null && this.options.allowTextInput)
		{
			nextChar = String.fromCharCode(nextCharCode)
			var start, end;
			start = textbox.caret().start;
			end = textbox.caret().end;
			if (start > end)
			{
				end = textbox.caret().start;
				start = textbox.caret().end;
			}
			if (nextCharCode !== null && nextCharCode === 8 || nextCharCode === 46)
			{

				if (start === end)
				{
					if (nextCharCode === 46)
					{
						textBoxNextValue = textBoxNextValue.substring(0, start) + textBoxNextValue.substring(start + 1, textBoxNextValue.length);
					}
					else
					{
						textBoxNextValue = textBoxNextValue.substring(0, start - 1) + textBoxNextValue.substring(start, textBoxNextValue.length);

					}
				}
				else
				{
					textBoxNextValue = textBoxNextValue = textBoxNextValue.substring(0, start) + textBoxNextValue.substring(end, textBoxNextValue.length - 1)
				}


			}
			else
			{
				if (start === end)
				{
					textBoxNextValue += nextChar;
				}
				else
				{
					textBoxNextValue = textBoxNextValue.substring(0, start) + nextChar + textBoxNextValue.substring(end, textBoxNextValue.length);
				}
			}
		}
		return textBoxNextValue;
	},
	//_calculateTextBoxValueWidth
	_calculateTextBoxValueWidth: function (textbox, nextCharCode)
	{

		var nextChar = "";
		var textBoxNextValue = this._getTextBoxNextValue(textbox, nextCharCode);

		var invisibleTextBox = jQuery("#multipleItemDropTextBox");
		invisibleTextBox[0].innerHTML = textBoxNextValue.htmlEncode().replace(stringRegularExpressions.spacesReplacementRegex, "&nbsp;");
		textbox.width(invisibleTextBox.innerWidth() + 5);
	},

	//_calculateTextBoxWidth
	_calculateTextBoxWidth: function (textbox)
	{
		textbox.css("width", "0px");
		var innerDiv = this.element.find('.drop-textbox');
		var innerChildren = innerDiv.children();
		var controlsWidth = 0;

		for (var j = innerChildren.length - 2; j >= 0; j--)
			if (innerChildren[j].style.display !== "none")
				controlsWidth += jQuery(innerChildren[j]).outerWidth(true);

		var textboxWidth = innerDiv.innerWidth() - controlsWidth - 29; //Margin and padding

		if (textboxWidth > 0)
			textbox[0].style.width = textboxWidth + "px";
		else if (textboxWidth > -4)
			textbox[0].style.width = "1px";
		else
		{
			var wi = jQuery(innerChildren[innerChildren.length - 2]).outerWidth();

			if (wi > 15)
				textbox[0].style.width = (wi - 22) + "px";
			else
				textbox[0].style.width = "";
		}
	},

	//_change
	_change: function (text, obj, absolutePosition)
	{
		this.$dropItem.empty().hide();
		this.$dropText.width('100%');

		if (this.options.allowMultipleItems)
		{

			if (!!obj)
			{
				var items = this.element.find('.drop-object');
				var $watermark = this.element.find('.watermark');

				if (!!$watermark.length)
					$watermark.removeClass('watermark').val('');

				var foundPos = -1;
				var foundInStringPos = -1;

				for (var l = 0; l < items.length; l++)
				{
					var item = jQuery(items[l]);
					var pos = item.offset();
					//var right = item.outerWidth(true) + pos.left;

					var invisibleTextBox = jQuery("#multipleItemDropTextBox");
					invisibleTextBox[0].innerHTML = item.val().replace(/ /g, "&nbsp;");
					var right = invisibleTextBox.innerWidth() + 5 + pos.left;


					if (!!absolutePosition && absolutePosition.left <= right && absolutePosition.left >= pos.left)
					{
						var bottom = item.outerHeight(true) + pos.top + 5;

						pos.top = pos.top - 5;

						if (absolutePosition.top >= pos.top && absolutePosition.top <= bottom)
						{
							foundPos = l;

							if ($type(this.dropObjects[foundPos]) === "string")
							{
								var leftPixels = absolutePosition.left - pos.left; //Get the amount of pixels inside the textbox
								var invisibleTextBox = jQuery("#multipleItemDropTextBox");
								var literalValue = item.val();
								var prevLeftPos = 0;

								invisibleTextBox[0].innerHTML = "";

								for (var t = 0; t < literalValue.length; t++)
								{
									invisibleTextBox[0].innerHTML += literalValue.charAt(t).replace(' ', "&nbsp;");

									var pos = invisibleTextBox.innerWidth();

									if (leftPixels >= prevLeftPos && leftPixels <= pos)
									{
										foundInStringPos = t;

										break;
									}
									else
										prevLeftPos = pos;
								}
							}

							break;
						}
					}
				}

				if (foundPos === -1)
				{
					this.dropObjects.push(obj);

					this._changeDisplay(true);
				}
				else
				{
					if ($type(this.dropObjects[foundPos]) === "string")
					{
						var text = this.dropObjects[foundPos];
						var firstText = text.substr(0, foundInStringPos);
						var secondText = text.substr(foundInStringPos);

						if (firstText && secondText)
						{
							if (foundPos + 1 !== this.dropObjects.length)
							{
								this.dropObjects[foundPos] = firstText;
								this.dropObjects = this.dropObjects.insert(secondText, foundPos + 1);
								this.dropObjects = this.dropObjects.insert(obj, foundPos + 1);
							}
							else
							{
								this.dropObjects[foundPos] = firstText;
								this.dropObjects.push(obj);
								this.dropObjects.push(secondText);
							}
						}
						else if (foundPos === 0)
						{
							this.dropObjects = this.dropObjects.insert(this.options.defaultMultipleDropDivider, foundPos + 1);
							this.dropObjects = this.dropObjects.insert(obj, foundPos + 1);
						}
						else
						{
							this.dropObjects = this.dropObjects.insert(this.options.defaultMultipleDropDivider, foundPos);
							this.dropObjects = this.dropObjects.insert(obj, foundPos);
						}
					}
					else
					{
						this.dropObjects = this.dropObjects.insert(this.options.defaultMultipleDropDivider, foundPos);
						this.dropObjects = this.dropObjects.insert(obj, foundPos);
					}

					this._setEmptyText();
					this._changeDisplay();
				}
			}
			else if (!!text)
			{
				this.dropObjects.push(text);

				this._changeDisplay(true);
			}
			else
			{
				this._setEmptyText();
				this._changeDisplay();
			}
		}
		else
		{

			var $watermark = this.element.find('.watermark');
			if (!!obj || !!text)
			{

				if ($watermark && $watermark.length > 0)
				{
					$watermark.removeClass('watermark').val('');
				}
			}
			else
			{
				this.clear();
			}
			this._calculateTextBoxWidth(this.$dropText);
			this.dropObject = obj;
			this.containsText = !!text;
			this.text = text;
			this._changeDisplay();
		}
	},

	//_changeDisplay
	_changeDisplay: function (updateOnlyLast)
	{
		if (this.isEnabled())
		{
			this.element.show();

			if (this.options.allowMultipleItems)
			{
				var _dropObjectsCount = this.dropObjects.length;

				if (!_dropObjectsCount)
					this._setEmptyText();
				else
				{
					this.$dropText.hide();
					this.$dropItem.hide();

					var innerDiv = this.element.find('.drop-textbox');
					var lastTextbox;

					for (var k = 0; k < _dropObjectsCount; k++)
					{
						if (updateOnlyLast)
							k = _dropObjectsCount - 1;

						var obj = this.dropObjects[k];

						if ($type(obj) === "string")
						{
							if (!lastTextbox)
							{
								lastTextbox = jQuery(document.createElement('input')).addClass('drop-object drop-text').width(5).val(obj).appendTo(innerDiv);

								this._addTextBoxEvents(lastTextbox);
							}
							else
								lastTextbox.val(lastTextbox.val() + obj);

							if (obj !== '' && obj !== ' ')
								this._calculateTextBoxValueWidth(lastTextbox);
						}
						else if ($chk(obj) && $chk(obj.display) && $chk(obj.value))
						{
							var prevTextbox = this.element.find('.drop-object.drop-text').last();

							if (prevTextbox.length > 0)
							{
								prevTextbox.width(5);

								if (!!prevTextbox.prevAll('.drop-object.drop-text').length && prevTextbox.val() === '')
								{
									prevTextbox.val(this.options.defaultMultipleDropDivider);

									this._calculateTextBoxValueWidth(prevTextbox);

									this.dropObjects[k - 1] = this.options.defaultMultipleDropDivider;
								}
								else if (prevTextbox.val() !== '')
									this._calculateTextBoxValueWidth(prevTextbox);
							}

							var $dropItem = jQuery("<span></span>")
											.addClass('drop-object drop-item')
											.css("display", "inline-block")
											.html(obj.display.htmlEncode())
											.attr("title", (obj.tooltip) ? obj.tooltip : "")
											.appendTo(innerDiv)
											.data("dropobject", obj);

							if (!!obj.icon)
								$dropItem.attr('icon', obj.icon).addClass(obj.icon);

							$dropItem.on('click', this, this.dropItemClick);

							lastTextbox = jQuery(document.createElement('input')).addClass('drop-object drop-text').width(5).appendTo(innerDiv);

							this._addTextBoxEvents(lastTextbox);
						}


						if (k === _dropObjectsCount - 1)
						{
							if (($type(obj) !== "string") && (updateOnlyLast || _dropObjectsCount === 2))
							{
								lastTextbox.val('');

								this.dropObjects.push("");

								k++;
							}

							this._calculateTextBoxWidth(lastTextbox);

							if (updateOnlyLast)
								lastTextbox.parent().textbox();
							else
								innerDiv.textbox();
						}
					}
				}

				if (_dropObjectsCount === 1 && typeof this.dropObjects[0] === 'string' && !this.dropObjects[0])
					lastTextbox.addClass('watermark').val(this.options.watermarkText);
			}
			else if (this.containsText || (!this.dropObject && !this.text))
			{
				if (typeof this.text === "undefined" || this.text === null || this.text === "")
				{
					this._setEmptyText();
				}
			}
			else
			{
				this.$dropText.val('');

				var $dropItem = this.$dropItem;
				var _icon = $dropItem.attr('icon');

				if (!!_icon)
					$dropItem.removeAttr(_icon).removeClass(_icon);

				var _dropObject = this.dropObject;
				if (Array.isArray(this.dropObject))
				{
					_dropObject = this.dropObject[0];
				} 

				if (!!_dropObject)
				{
					var _display = _dropObject.display;

					if (!!_display && !!_dropObject.value)
					{
						var _tooltip = _dropObject.tooltip;

						$dropItem.attr('title', !_tooltip ? _display : _tooltip).html(_display.htmlEncode()).show();

						_icon = _dropObject.icon;

						if (!!_icon)
							$dropItem.attr('icon', _icon).addClass(_icon);

						// A quick store of the dropobject for easy retrieval
						$dropItem.data("dropobject", _dropObject);
					}
				}
				if (this.element.width() < 50)//It has not loaded fully
					setTimeout(function () { this._calculateTextBoxWidth(this.getLastVisibleInput()); }.bind(this), 40);
				else
					this._calculateTextBoxWidth(this.getLastVisibleInput());
				this.element.find('.watermark').each(function ()
				{
					if ($(this).text() === "")
						$(this).removeClass("watermark");
				});

			}
		}
	},

	//_setEmptyText
	_setEmptyText: function ()
	{
		if (this.options.allowMultipleItems)
		{
			this.$dropText.hide();
			this.$dropItem.empty().hide();
			this.element.find('.drop-object').remove();

			var _dropObjectsCount = this.dropObjects.length;

			if (!_dropObjectsCount)
			{
				var watermark = jQuery(document.createElement('input')).addClass('drop-object drop-text watermark').appendTo(this.element.find('.drop-textbox'));

				this._addTextBoxEvents(watermark);

				this.dropObjects.push('');

				this._calculateTextBoxWidth(watermark);
			}
		}
		else
		{
			if (!this.text)
				this.$dropText.addClass('watermark');
			else
				this.$dropText.removeClass('watermark').val(this.text);
			this.$dropText.prop("readonly", false);
			this.$dropText.width('100%');
			this.$dropItem.empty().hide();
		}
		this.element.find("input.watermark").val(this.options.watermarkText);
	},
	//blurText
	blurText: function ()
	{
		var textBox = jQuery("");
		if (!this.options.allowMultipleItems)
		{
			textBox = this.$dropText;
		}
		else
		{
			textBox = this.element.find('input.drop-object.drop-text').last();
		}
		textBox.trigger('blur');
	},
	_internalBlurText: function ()
	{
		if (this.containsText && this.$dropText.val() === "")
		{
			this.$dropText.addClass('watermark').val(this.options.watermarkText);

			if (this.dropObjects.length === 1 && typeof this.dropObjects[0] === 'string' && !this.dropObjects[0])
				this.element.find('.drop-object.drop-text').last().addClass('watermark').val(this.options.watermarkText);
		}
		else if (!this.containsText && this.dropObjects.length === 0 && !this.dropObject)
		{
			var txt = this.element.find('.drop-object.drop-text').first();
			if (txt.length === 0)
				txt = this.$dropText;
			txt.addClass("watermark");
			txt.val(this.options.watermarkText);
			txt.width("100%");
		}
		this.element.find(".input-control").removeClass("active");
	},

	//changeText
	changeText: function ()
	{
		var _options = this.options;
		var _validateDelegate = _options.validateDelegate;

		if (!_validateDelegate || _validateDelegate(this.$dropText.val()))
		{ //External validation
			var $dropTextBox = this.$dropText;

			if (!_options.allowMultipleItems)
			{
				if (!$dropTextBox.is(".watermark"))
				{
					var _dropText = this.text = $dropTextBox.val();

					if (!this.containsText)
						this._change(_dropText);
				}
			}
			else
			{
				var $dropObjects = this.element.find('.drop-object');

				for (var i = $dropObjects.length - 1; i >= 0; i--)
				{
					var $dropObject = $dropObjects.eq(i);

					if ($dropObject.is('.drop-text'))
						this.dropObjects[i] = $dropObject.val();
				}

				this._change();
			}

			if (this.text || this.dropObject || this.dropObjects.length > 0)
				$dropTextBox.removeClass('watermark');

			if (!!_options.onChangedDelegate)
				_options.onChangedDelegate(this);
		}
	},

	getLastVisibleInput: function ()
	{
		return this.element.find('input').filter(function () { return jQuery(this).css("display") !== "none"; }).last()
	},

	//clear: Clears the drop objects to ensure correct functioning and show the watermark text as expected
	clear: function ()
	{
		this.dropObjects.length = 0;
		this.dropObject = null;
		this.text = null;
		this.dropObjects = [];
		this.$dropText.get(0).readOnly = false;
		this._setEmptyText();
	},

	//disable
	disable: function ()
	{
		this.$dropText.addClass('watermark').prop('readonly', true)
		this.$dropText.siblings("input").prop('readonly', true)
		this.$dropText.first().closest(".input-control.text-input").addClass("disabled")
	},

	//dropEvent
	dropEvent: function (event, dropObject, absolutePosition)
	{
		if (this.$dropText.get(0).readOnly)
			return;

		if (!($chk(dropObject) && $chk(dropObject.display) && $chk(dropObject.value)))
		{ //Internal validation
			//Validation failed
			var array = [];

			array[0] = "OK:ClosePopup";
			array[1] = "Close:ClosePopup";

			var messageBox = $.popupManager.showError({
				headerText: "Runtime Error",
				message: "The object dropped onto the DropTextBox is not supported",
				type: "error",
				buttonArray: array
			});
		}

		if (!this.options.validateDelegate || this.options.validateDelegate(dropObject))
		{ //External validation
			this._change(null, dropObject, absolutePosition);

			if (!!this.options.onChangedDelegate)
				this.options.onChangedDelegate(this);
		}
	},

	//dropItemClick
	dropItemClick: function (e)
	{
		var $target = jQuery(e.target);

		if (e.clientX < $target.offset().left + Math.floor($target.outerWidth() / 2))
			$target.prev().trigger('focus').caret('end');
		else
			$target.next().trigger('focus').caret('start');
	},

	//enable
	enable: function ()
	{
		this.$dropText.prop("readonly", false);
		this.$dropText.siblings("input").prop("readonly", false);
		this.$dropText.first().closest(".input-control.text-input").removeClass("disabled")
		//this._changeDisplay();
	},


	_internalFocusText: function ()
	{
		if (!this.$dropText.get(0).readOnly && this.options.allowTextInput)
		{

			if (this.containsText && !this.text || (!this.options.allowMultipleItems && !this.text && !this.dropObject))
				this.$dropText.removeClass('watermark').val('');
			if (this.dropObjects.length > 0)
			{
				var watermarkTxt = this.element.find('.watermark');
				if (watermarkTxt.length > 0)
				{
					watermarkTxt.removeClass('watermark').val("");
				}
			}
		}
		this.element.find(".input-control").addClass("active");
		if (!!this.options.onFocusDelegate)
			this.options.onFocusDelegate(this);
	},
	//focusText
	focusText: function ()
	{
		var textBox = jQuery("");
		if (!this.options.allowMultipleItems)
		{
			textBox = this.$dropText;
		}
		else
		{
			textBox = this.element.find('input.drop-object.drop-text').last();
		}
		if (checkExists(SourceCode.Forms.Browser.msie) && SourceCode.Forms.Browser.version === 9)
			textBox[0].style.width = "1px";
		textBox.trigger('focus').caret('end');
		if (checkExists(SourceCode.Forms.Browser.msie) && SourceCode.Forms.Browser.version === 9)
			this._calculateTextBoxWidth(textBox);
	},

	//hide
	hide: function ()
	{
		this.element.hide();
	},

	//initialize
	initialize: function (options)
	{
		this.element = ($chk(options.element)) ? jQuery(options.element) : null;
		this.id = options.id;
		this.dropObject = options.dropObject;
		this.text = options.text;
		this.targetId = options.targetId;
		this.multipleValues = false; //Used for multiple drops
		this.dropObjects = [];

		if (!options.allowMultipleItems)
		{
			if (this.dropObject)
			{
				this.containsText = false;
				this.text = null;
			}
			else
			{
				this.containsText = true;
				this.dropObject = null;
			}
		}
		else
		{
			this.multipleValues = true;
			this.containsText = true;
			this.text = null;
			this.dropObject = null;
		}

		this._build();
	},

	//isEnabled
	isEnabled: function ()
	{
		return !this.$dropText.get(0).readOnly;
	},

	//keyDownText
	keyPressText: function (e)
	{
		var target = jQuery(e.target);
		var _keyCode = e.which;
		var keyIsSpecial = _keyCode === 0;
		var droppedItemsAfter = !!target.nextAll('.drop-object.drop-text').length;
		if (!this.containsText && !this.options.allowMultipleItems && !this.text && this.options.allowTextInput)
		{
			this.$dropText.width('100%');
			this.$dropItem.empty().hide();
		}

		//resize for new text values (gets correct casing with keypressed)
		if (droppedItemsAfter && !(keyIsSpecial))
		{
			this._calculateTextBoxValueWidth(target, e.which);
			//update dropObjects with the change
		}
		else if (!(keyIsSpecial))
		{
			if (this.dropObjects.length > 0)
			{
				var items = this.element.find('.drop-object');
				var curObjPos = items.index(target);
				this.dropObjects[curObjPos] = this._getTextBoxNextValue(target, e.which);
			}
		}
		var lastTextBox = this.element.find('.drop-object.drop-text').last();

		if (lastTextBox.length > 0)
			this._calculateTextBoxWidth(lastTextBox);

	},
	//keyDownText
	keyDownText: function (e)
	{
		var _keyCode = e.which;
		var keyIsBackspace = _keyCode === 8;
		var keyIsDelete = _keyCode === 46;
		var keyIsLeft = _keyCode === 37;
		var keyIsRight = _keyCode === 39;
		var keyIsEnter = _keyCode === 13;
		var isSpecialCase = false;
		var droppedItemsAfter = false;

		if (!this.containsText && (keyIsBackspace || keyIsDelete))
		{
			this._change();

			//this.$dropText.removeClass('watermark').val('');

			if (!!this.options.onChangedDelegate)
				this.options.onChangedDelegate(this);
		}

		if (keyIsEnter)
		{
			this.changeText(e);

			if (!!this.options.onEnterPressDelegate)
				this.options.onEnterPressDelegate(this);
		}

		if (this.options.allowMultipleItems)
		{
			var target = jQuery(e.target);
			var droppedItemsBefore = !!target.prevAll('.drop-object.drop-text').length;
			droppedItemsAfter = !!target.nextAll('.drop-object.drop-text').length;

			var atBeginningOfTextBox = target.caret().start === 0;
			var atEndOfTextBox = target.caret().start === target[0].value.length;
			var selectionExists = target.caret().start !== target.caret().end;

			//Handle special cases at boundaries between controls within the droptextbox
			//like navigationa and deletion of previous or next drops
			if (droppedItemsBefore && keyIsBackspace && atBeginningOfTextBox && !selectionExists)
			{
				var items = this.element.find('.drop-object');
				var curObjPos = items.index(target) - 1;

				this.dropObjects = this.dropObjects.removeAt(curObjPos + 1);
				this.dropObjects = this.dropObjects.removeAt(curObjPos);

				//If there is anything in the current textbox, merge it with the previous one and delete it
				var textVal = target.val();

				this.dropObjects[curObjPos - 1] = this.dropObjects[curObjPos - 1] + textVal;


				target.remove();
				items.eq(curObjPos).remove();
				items[curObjPos - 1].value += textVal;
				items.eq(curObjPos - 1).trigger('focus').caret('end');
				//if (!droppedItemsAfter)
				this._calculateTextBoxValueWidth(jQuery(items[curObjPos - 1]));
				isSpecialCase = true;
				this.changeText();
			}
			else if (droppedItemsAfter && keyIsDelete && atEndOfTextBox && !selectionExists)
			{
				var items = this.element.find('.drop-object');
				var curObjPos = items.index(target) + 1;

				this.dropObjects = this.dropObjects.removeAt(curObjPos);
				this.dropObjects = this.dropObjects.removeAt(curObjPos - 1);

				//If there is anything in the current textbox, merge it with the previous one and delete it
				var textVal = target.val();

				this.dropObjects[curObjPos - 1] = textVal + this.dropObjects[curObjPos - 1];
				var remTextbox = items[curObjPos + 1];

				target.remove();
				jQuery(items[curObjPos]).remove();

				remTextbox.value = textVal + remTextbox.value;
				remTextbox.focus();

				this._calculateTextBoxValueWidth(jQuery(remTextbox));
				isSpecialCase = true;
				this.changeText();
			}
			else if (droppedItemsBefore && keyIsLeft && atBeginningOfTextBox && !selectionExists)
			{

				var items = this.element.find('.drop-object');
				var curObjPos = items.index(target) - 2;

				if (curObjPos > -1)
					items.eq(curObjPos).trigger('focus').caret('end');
				isSpecialCase = true;
			}
			else if (droppedItemsAfter && keyIsRight && atEndOfTextBox && !selectionExists)
			{
				var items = this.element.find('.drop-object');
				var curObjPos = items.index(target) + 2;

				if (curObjPos < items.length)
					items[curObjPos].focus();
				isSpecialCase = true;
			}
		}
		if (isSpecialCase)
		{
			e.preventDefault();
		}
		else if (droppedItemsAfter && (keyIsDelete || keyIsBackspace))
		{
			this._calculateTextBoxValueWidth(target, e.which);
			//update dropObjects with the change

			var items = this.element.find('.drop-object');
			var curObjPos = items.index(target);
			this.dropObjects[curObjPos] = this._getTextBoxNextValue(target, e.which);
		}

		var lastTextBox = this.element.find('.drop-object.drop-text').last();
		if (lastTextBox.length > 0)
			this._calculateTextBoxWidth(lastTextBox);

		//prevent the character from actually being inserted if Text Input is disallowed
		if (!this.options.allowTextInput)
		{
			e.preventDefault();
		}
	},

	//reset
	reset: function ()
	{
		this.clear();
		this.blurText();
	},

	//setTextType
	setTextType: function (type)
	{
		this.options.textType = type;
	},

	//setValue
	setValue: function (data)
	{
		if (this.options.allowMultipleItems)
		{
			this.containsText = true;
			this.text = null;
			this.dropObject = null;

			if (data instanceof Array)
			{
				var _dropObjects = [];
				for (var i = 0; i < data.length; i++)
				{
					var _dataItem = data[i];
					var _objCount = _dropObjects.length;
					var isAnObject = _dataItem instanceof Object;
					var isTheFirstItem = !_objCount;
					var isTheLastItem = (i === data.length - 1);
					var thePreviousItemWasAnObject = _dropObjects[_objCount - 1] instanceof Object;
					var concatinateThePreviousString = !isAnObject && !isTheFirstItem && !thePreviousItemWasAnObject;
					var addSeparatorBefore = isAnObject && (thePreviousItemWasAnObject || isTheFirstItem);
					var addSeparatorAfter = isAnObject && isTheLastItem;

					if (concatinateThePreviousString)
						_dropObjects[--_objCount] = _dropObjects[_objCount].concat(_dataItem);
					else if (addSeparatorBefore)
					{
						_dropObjects.push("");
						_dropObjects.push(_dataItem);
					}
					else if (addSeparatorAfter)
					{
						_dropObjects.push(_dataItem);
						_dropObjects.push("");
					}
					else
						_dropObjects.push(_dataItem);

				}

				this.dropObjects = _dropObjects;
			}
			else if (!!data)
			{
				var previousObject = this.dropObjects[this.dropObjects.length - 1];

				if ($type(data) === "string" && $type(previousObject) === "string")
					this.dropObjects[this.dropObjects.length - 1] = previousObject + data;
				else
					this.dropObjects.push(data);
			}
		}
		else if ($type(data) === "string")
		{
			this.text = data;
			this.dropObject = null;
			this.containsText = true;
		}
		else if (data.allowUserEdit)
		{
			this.text = data.display;
			this.dropObject = data;
			this.containsText = true;
		}
		else
		{
			this.text = null;
			this.dropObject = data;
			this.containsText = false;
		}
		if (!this.options.allowTextInput)
		{
			this.element.find(".drop-object.drop-text.watermark").hide();
			this.$dropText.show();
			this._calculateTextBoxWidth(this.$dropText);
		}
		this._setEmptyText();
		this._changeDisplay();
	},

	//show
	show: function ()
	{
		this.element.show();
	}
}

//DroppedObject
function DroppedObject(options)
{
	jQuery.extend(this, {
		display: null,
		value: null, //XML data of the dropped object
		allowUserEdit: false //If set to true, makes it look like DropTextBox text, but contains a display and value property
	}, options);
}
