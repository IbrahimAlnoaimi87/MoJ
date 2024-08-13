(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	var appleMobileRegex = /(iPad|iPhone|iPod touch)/i;

	/**
	 * Dropdowwn widget
	 * @class Creates a dropdown widget
	 */
	SourceCode.Forms.Controls.DropDown =
	{
		popupVerticalOffsetFromControl: "3",

		options:
		{
			isModalized: false,
			initialDisplayValue: null,
			defaultRightBorder: 1,
			additionalModalSpacing: 2
		},

		uniqueNameSpacePrefix: "",
		mousedownNameSpaceEvent: "mousedown.dropdown-{0}",
		dragNameSpaceEvent: "drag.dropdown-{0}",
		scrollNameSpaceEvent: "scroll.dropdown-{0}",

		_create: function ()
		{
			var appliedWidth = null;

			if (typeof this.options.width !== "undefined" && this.options.width === "inherit")
			{
				appliedWidth = (this.element.width() + 26) + "px";
			}
			else if (typeof this.options.width === "undefined" && typeof this.element[0].style.width !== "undefined")
			{
				appliedWidth = this.element[0].style.width;
			}

			var optionElements = $(this.element).children("OPTION");
			if (optionElements.length == 0 && checkExists(this.options.items) && this.options.items.length == 0)
			{
				this.options.items = [];
			}

			this.element[0].style.display = "none";
			var controlId = "";
			var controlListId = "";

			if (this.element[0].id !== null)
			{
				var controlSeparatorIndex = this.element[0].id.lastIndexOf("_");
				if (controlSeparatorIndex > 0)
				{
					controlId = " id=\"" + this.element[0].id.substring(0, controlSeparatorIndex);
					controlListId = controlId + "_droplist\"";
					controlId = controlId + "\"";
				}
				this.uniqueNameSpacePrefix = this.element[0].id;
			}
			else
			{
				this.uniqueNameSpacePrefix = "".generateGuid();
			}
			this.mousedownNameSpaceEvent = this.mousedownNameSpaceEvent.format(this.uniqueNameSpacePrefix);
			this.dragNameSpaceEvent = this.dragNameSpaceEvent.format(this.uniqueNameSpacePrefix);
			this.scrollNameSpaceEvent = this.scrollNameSpaceEvent.format(this.uniqueNameSpacePrefix);

			var iconControlClass = (this.element.hasClass("icon-control")) ? " icon-control" : "";
			
			this.control = $("<div" + controlId + " class=\"input-control select-box dropdown-box" + iconControlClass + "\"" + (appliedWidth !== null ? " style=\"width:" + appliedWidth + ";\"" : "") + ">"
				+ "<div class=\"styling-outer-wrapper\">"
				+ "<div class=\"input-control-body  styling-left styling-inner-wrapper\">"
				+ "<div class=\"input-control-t\"><div class=\"input-control-t-l\"></div>"
				+ "<div class=\"input-control-t-c\"></div><div class=\"input-control-t-r\"></div>"
				+ "</div><div class=\"input-control-m\"><div class=\"input-control-m-l\"></div>"
				+ "<div class=\"input-control-m-c\"><div class=\"input-control-wrapper\">"
                + "<a href=\"javascript:;\" tabindex=\"" + this.element[0].tabIndex + "\" class=\"input-control  styling-font\"><span class=\"styling-font\"></span></a>"
				+ "</div></div><div class=\"input-control-m-r\"></div></div>"
				+ "<div class=\"input-control-b\"><div class=\"input-control-b-l\"></div>"
				+ "<div class=\"input-control-b-c\"></div><div class=\"input-control-b-r\"></div>"
				+ "</div></div><div class=\"input-control-buttons styling-right styling-inner-wrapper\">"
				+ "<a href=\"javascript:;\" tabIndex=\"-1\" class=\"dropdown border-left-only\"><span><span>...</span></span></a>"
				+ "</div></div></div>").insertAfter(this.element);

			this.dropdown = $("<div" + controlListId + " class=\"drop-menu" + iconControlClass + "\" style=\"display:none\"><div class=\"drop-menu-t\"><div class=\"drop-menu-t-l\"></div>"
				+ "<div class=\"drop-menu-t-c\"></div><div class=\"drop-menu-t-r\"></div></div>"
				+ "<div class=\"drop-menu-m\"><div class=\"drop-menu-m-l\"></div><div class=\"drop-menu-m-c\">"
				+ "<div class=\"drop-menu-wrapper\"><ul class=\"drop-menu\"></ul></div></div>"
				+ "<div class=\"drop-menu-m-r\"></div></div><div class=\"drop-menu-b\"><div class=\"drop-menu-b-l\"></div>"
				+ "<div class=\"drop-menu-b-c\"></div><div class=\"drop-menu-b-r\"></div></div>"
				+ "</div>").appendTo($("body"));

			this.element[0].tabIndex = "-1";

			this.icon = "";
			if (this.element.hasClass("icon-control"))
			{
				this.control.addClass("icon-control");
				this.dropdown.addClass("icon-control");

				if (this.control.find(".input-control-icon").length === 0)
				{
					this.control.children(".input-control-l").html("<div class=\"input-control-icon\"></div>");
				}
			}

			var title = this.element.attr("title");
			if (title !== undefined && title !== null && title !== "") this.control.attr("title", title);

			if (this.element.hasClass("small")) this.control.addClass("small");

			this.overflown = false;
			this.selected = null;
			this.menu = $(this.dropdown.find("ul.drop-menu")[0]);
			this.menuWrapper = this.menu.parent();

			this.changetimer = null;

			this._loadOptions();

			this._applyOptionEventHandlers();

			this.previouslySelected = 0;

			this.userSearchString = [];
			this.searchStartTime = null;

			this.searchCounter = 0;
			if (!this.options.disableHideScrollable && SourceCode.Forms.Layout.isRuntime())
			{
				this.options.disableHideScrollable = true;
			}
			if (!this.options.disableHideScrollable)
			{
				this.element.parents(":scrollable").on("scroll", this._hideDropdown.bind(this));
			}
			var nativeElement = this.element[0];
			if (this.element.prop("disabled"))
			{
				this.disable();
			}

			if (checkExists(nativeElement.getAttribute("data-readonly")))
			{
				this.readonly();
			}

			if (nativeElement.getAttribute("data-isvisible") === "false")
			{
				this.hide();
			}

			this.options.defaultHasBeenApplied = false;
			this.options.defaultIndex = 0;

			this.canOpenDropdown = true;
			this.openDropdownDelay = 2000;
			this.canOpenDropdownTimeoutHandle = null;
		},

		_destroy: function ()
		{
			// Unbind events so we dont have circular references for removing DOM object
			$(window).off("scroll.dropdown");
			$("body", document).off("scroll.dropdown");
			$(document).off("mousedown.dropdown");
			this.element.show();
			this.control.remove();

			this.dropdown.remove();
			if (!this.options.disableHideScrollable)
				this.element.parents(":scrollable").off("scroll");
		},

		disable: function ()
		{
			this.control.addClass("disabled");
			$.Widget.prototype.disable.apply(this, arguments);

		},

		readonly: function ()
		{
			this.control.addClass("read-only");
			$.Widget.prototype.disable.apply(this, arguments);
		},

		editable: function ()
		{
			this.control.removeClass("read-only");
			if (!this.control.hasClass('disabled'))
			{
				$.Widget.prototype.enable.apply(this, arguments);
			}
		},

		enable: function ()
		{

			this.control.removeClass("disabled");
			if (!this.control.hasClass("read-only"))
			{
				$.Widget.prototype.enable.apply(this, arguments);
			}

		},

		refresh: function ()
		{
			//if the dropmenu was orginally shown when the data was not loaded yet we need to highlight the correct item when the data is loaded
			var wasMenuOpen = false;
			if (this.dropdown[0].style.display !== "none")
			{
				//hide the menu
				this.dropdown[0].style.display = "none";
				wasMenuOpen = true;
			}
			//empty the menu
			this.menu.empty();
			this._loadOptions();

			//show the menu if it was open
			if (wasMenuOpen)
			{
				var self = this;
				setTimeout( function ()
				{
					self._handleKeyPressOpen();
				}, 0);
			}
		},

		SpecifyDefaultIndex: function (index)
		{
			if (checkExists(index))
			{
				var indexNumber = parseInt(index);

				if (!isNaN(indexNumber))
				{
					this.options.defaultIndex = indexNumber;
				}
				else
				{
					SFLog({ type: 3, source: "specifyDefaultIndex", category: "Dropdown functions", message: "Attempted to set the default index to a non-numeric value" });
				}
			}
		},

		SelectDefaultValue: function ()
		{
			if (checkExists(this.options.defaultIndex) && typeof this.options.defaultIndex === "number")
			{
				this._selectValue(this.options.defaultIndex, !this.options.defaultHasBeenApplied);
				this.options.defaultHasBeenApplied = true;
				return true;
			}
			else
			{
				SFLog({ type: 3, source: "selectDefaultValue", category: "Dropdown functions", message: "Default index is not a number" });
				return false;
			}
		},

		//public method for _refreshValue
		refreshDisplay: function ()
		{
			this._refreshValue();
		},

		hide: function ()
		{
			this.control[0].style.display = "none";
			this.dropdown[0].style.display = "none";
		},

		show: function ()
		{
			this.control[0].style.display = "";
			this.dropdown[0].style.display = "none";
		},

		//measures the right border of the left textbox content and returns true if the size changed from the last measurement
		measureRightBorder: function ()
		{
			if (!checkExists(this.stylingLeftWrapper))
			{
				this.stylingLeftWrapper = this.control.find(".styling-left.styling-inner-wrapper")
			}
			if (!checkExists(this.stylingRightWrapper))
			{
				this.stylingRightWrapper = this.control.find(".styling-right.styling-inner-wrapper")
			}
			var rightWidth = parseInt(this.stylingLeftWrapper.css("border-right-width").replace(stringRegularExpressions.unitDimention, ""), 10);
			rightWidth += parseInt(this.stylingRightWrapper.css("border-left-width").replace(stringRegularExpressions.unitDimention, ""), 10);
			this.options.defaultRightBorder = rightWidth;
			if (rightWidth !== this.options.defaultRightBorder)
			{
				this.options.defaultRightBorder = rightWidth;
				return true;
			}
			return false;
		},

		//modalizes the control with a spinner to the left of the drop button
		//will check for the initialdisplay which is used as alternative to the spinner
		// if it exists it will show and the spinner will not and the control will not be modalized
		// if the user clicks on the drop button and the content has not loaded a spinner will show there
		toggleModal: function (isModalized)
		{
			if (!checkExists(this.options.initialDisplayValue))
			{
				this.measureRightBorder();
				this.control.find(".styling-right").showControlModal(isModalized);
				this.control.find(".styling-left").showControlBusyModal(isModalized, { innerPositions: [{ right: (this.options.defaultRightBorder + this.options.additionalModalSpacing) + "px" }] });
				this.dropdown.removeClass("modalized");
			}
			else
			{
				this.control.find(".styling-right").showControlModal(false);
				this.control.find(".styling-left").showControlBusyModal(false);
				this.dropdown.toggleClass("modalized", isModalized);
			}
			this.options.isModalized = isModalized;
		},

		//Fire this method when the control border is changed dynamically it will only update modals that are shown
		updateModalPosition: function ()
		{
			if (this.options.isModalized)
			{
				if (this.measureRightBorder())
				{
					this.control.find(".styling-right").updateControlModal({ innerPositions: [{ right: (this.options.defaultRightBorder + this.options.additionalModalSpacing) + "px" }] });
				}
			}
		},

		//this function resets the state of the control without firing a change event
		prepareForRefresh: function ()
		{
			this.menu.empty();
			this.clearOptions();
			this.options.items = [];
			this._setTextboxContent(null);
		},

		clearOptions: function ()
		{
			if (checkExists(this.options.items) && this.options.items.length > 0)
			{
				this.options.items = [];
			}
			else
			{
				this.element.find("option").remove();
			}
			this.SelectedIndex(-1);
		},

		_loadOptions: function ()
		{
			this.options.initialDisplayValue = null;
			var options = null;
			if (checkExists(this.options.items))
			{
				//optimised adding no dom access required
				options = this.options.items;
			}
			else
			{
				//add via options collection in dom
				var opts = this.element.find("option");
				var optsi = this.SelectedIndex();
				options = [];
				for (var i = 0, l = opts.length; i < l; i++)
				{
					var currentOption = opts.eq(i);
					var selected = (currentOption.selected === true || optsi === i) ? true : false;
					var disabled = (currentOption.disabled === true) ? true : false;
					var option =
					{
						index: i,
						text: currentOption.text(),
						value: currentOption.val(),
						className: currentOption[0].className,
						selected: selected,
						disabled: disabled,
						title: currentOption.attr("title"),
						metadata: currentOption.metadata()
					};
					options.push(option);
				}
			}

			//Check if its not allowed to be empty
			if (checkExists(this.options.allowEmptyFirstItem) && !this.options.allowEmptyFirstItem && this.Items().length > 0)
			{
				var selectedItems = options.filter(function (item, index, array)
				{
					if (item.selected)
					{
						return true;
					}
				});
				if (selectedItems.length === 0)
				{
					options[0].selected = true;
				}
			}

			this.menuDataOptions = options;

			// Render menu html
			this.selected = null;
			this._selectedIndex = -1;

			var menuHtml = "";
			for (var i = 0, l = options.length; i < l; i++)
			{
				var o = options[i];

				if (!checkExists(o.text))
				{
					o.text = "";
				}

				if (!checkExists(o.index))
				{
					o.index = i;
				}

				if (!checkExists(o.className))
				{
					o.className = "";
				}
				var encodedText = o.text.htmlEncode();
				var encodedTitle = (o.title) ? o.title.htmlEncode() : encodedText;
				menuHtml += this._generateMenuOptionHtml(o);

				if (o.selected)
				{
					this._selectedIndex = i;
				}
			}

			this.menu.html(menuHtml);
			this.selected = this._findByIndex(this._selectedIndex);

			this._refreshValue();
		},

		_generateMenuOptionHtml: function (o)
		{
			var encodedText = o.text.htmlEncode();
			var encodedTitle = (o.title) ? o.title.htmlEncode() : encodedText;
			var opt = "<li data-index=" + o.index + " title=\"" + encodedTitle + "\" class=\"" + o.className + (o.selected ? " selected" : "") + "\"";

			var oMetadatLength = 0;

			if (checkExists(o.metadata))
			{
				for (var key in o.metadata)
				{
					oMetadatLength++;
					break;
				}
			}

			if (oMetadatLength > 0)
			{
				opt += " data-options=\"" + jQuery.toJSON(o.metadata).htmlEncode() + "\"";
			}

			opt += "><a href=\"javascript:;\" class=\"" + o.className + (o.disabled ? " disabled" : "") + "\"";

			if (oMetadatLength > 0)
			{
				opt += " data-options=\"" + jQuery.toJSON(o.metadata).htmlEncode() + "\"";
			}

			opt += "><span>" + encodedText + "</span></a></li>";

			return opt;
		},

		_refreshValue: function ()
		{
			var icon = null;
			var selectedValue = null;
			if (!checkExists(this.options.items))
			{
				if (this.SelectedIndex() === 0 && this.options.allowEmptyFirstItem !== true && this.element[0].options[this.SelectedIndex()].value === "")
				{
					selectedValue = null;
				}
				else
				{
					var foundIndex = -1;
					//try find the selected item
					this.element.find("option").each(function (index)
					{
						if (jQuery(this).is(":selected"))
						{
							foundIndex = index;
							return false;
						}
					});
					//nothing found assume this.SelectedIndex() is selected
					if (foundIndex !== -1)
					{
						this.selected = this._findByIndex(this.SelectedIndex());
						selectedValue = this.selected.text();
						var option = this.element[0].options[this.SelectedIndex()];
						if (option
							&& option.className !== undefined
							&& option.className !== null
							&& option.className !== "")
						{
							icon = option.className;
						}
					}
				}
			}
			else
			{
				//do not try find the value or icon if the list of options is empty
				if (this.options.items.length > 0)
				{
					var foundIndex = this.SelectedIndex();

					if (foundIndex === null || foundIndex === -1)
					{
						for (var i = 0; i < this.options.items.length && (foundIndex === null || foundIndex === -1) ; i++)
						{
							if (this.options.items[i].selected)
							{
								foundIndex = i;
							}
						}
					}
					if (foundIndex !== null && foundIndex !== -1)
					{
						this.SelectedIndex(foundIndex);
						if (checkExists(this.options.items[foundIndex]))
						{
							icon = this.options.items[foundIndex].className;
						}
						if (checkExists(this.selected) && this.selected.length > 0)
						{
							selectedValue = this.selected.text();
						}

						if (selectedValue === "")
						{
							selectedValue = null;
						}
					}
				}
			}

			this._setTextboxContent(selectedValue, icon);
		},

		_getIcon: function (index)
		{
			if (!checkExists(index))
			{
				index = this._findHighlightedIndex();
			}

			if (checkExistsNotEmpty(index))
			{
				if (!checkExists(this.options.items))
				{
					return this.element[0].options[index].className;
				}
				else
				{
					return this.options.items[index].className;
				}
			}
		},

		_setTextboxContent: function (selectedValue, icon)
		{
			if (!checkExists(this.controlTextElement))
			{
				this.controlTextElement = this.control.find("a.input-control > span");
			}
			if (checkExistsNotEmpty(selectedValue))
			{
				// CASE 1: Has selected value
				this.controlTextElement.text(selectedValue)
				this.controlTextElement[0].setAttribute("title", selectedValue);
				this.control.removeClass("watermark");
			}
			else
			{
				if (checkExists(this.options.initialDisplayValue))
				{
					// CASE 2: No value but has an initialize display value
					this.controlTextElement.text(this.options.initialDisplayValue)
					this.controlTextElement[0].setAttribute("title", this.options.initialDisplayValue);
					this.control.removeClass("watermark");
					this.toggleModal(this.options.isModalized);
				}
				else
				{
					if (checkExistsNotEmpty(this.options.watermark))
					{
						// CASE 3: No value and no initial display value but has a watermark value
						this.controlTextElement.text(this.options.watermark)
						this.controlTextElement[0].setAttribute("title", this.options.watermark);
						this.control.addClass("watermark");
					}
					else
					{
						// CASE 4: No value and no initial display value or watermark
						this.controlTextElement.text("")
						this.controlTextElement.removeAttr("title");
					}
				}
			}

			if (icon)
			{
				if (this.icon != "")
				{
					this.control.removeClass(this.icon);
				}

				this.icon = icon;
				this.control.addClass(this.icon);
			}
		},

		_selectValue: function (index, suppressChangeEvent)
		{
			// make sure we always work with an int, not a string
			index = parseInt(index);

			if (!checkExists(suppressChangeEvent))
			{
				suppressChangeEvent = false;
			}

			var selectedIndex = this.SelectedIndex();
			if (selectedIndex !== index || (selectedIndex === 0 && !checkExists(this.options.items)))
			{
				this.ClearSelection();
				this.SelectedIndex(index);

				if (!checkExists(this.options.items))
				{
					this.element.children("option").eq(index).addClass("selected");
				}
				else
				{
					if (index != -1 && index < this.options.items.length)
					{
						this.options.items[index].selected = true;
					}
				}

				this.selected = this._findByIndex(index);
				//if the dropmenu is not shown yet then we do not need to highlight the item
				if (this.dropdown[0].style.display !== "none")
				{
					this._highlight(this.selected);
				}
				this._refreshValue();

				var self = this;

				//since we do not rely on the native control no timeout is needed
				if (!checkExists(this.options.items))
				{
					if (this.changetimer !== null)
					{
						window.clearTimeout(this.changetimer);
						this.changetimer = null;
					}

					this.changetimer = window.setTimeout(function () { self._triggerChange(); }, 50);
				}
				else if (suppressChangeEvent !== true)
				{
					this._triggerChange();
				}
				if (this.dropdown[0].style.display !== "none")
				{
					this._adjustItemVisibility(this.selected);
				}
			}
		},

		SelectValueAtIndex: function (index)
		{
			if (checkExists(index))
			{
				if (checkExists(this.options.items))
				{
					this._selectValue(index);
				}
				else
				{
					this.element.get(0).selectedIndex = index;
				}
			}
		},

		SelectedIndex: function (index)
		{
			//set
			if (checkExists(index))
			{
				if (checkExists(this.options.items))
				{
					this._selectedIndex = index;
				}
				else
				{
					this.element.get(0).selectedIndex = index;
				}
			}
				//get
			else
			{
				if (checkExists(this.options.items))
				{
					if (checkExists(this._selectedIndex))
						return this._selectedIndex;
					else
						return -1;
				}
				else
				{
					return this.element.get(0).selectedIndex;
				}
			}
		},

		SelectedDisplay: function ()
		{
			//get
			return this.control.find("a.input-control > span").text();
		},

		SelectedValue: function (value)
		{
			if (typeof value !== "undefined" && value !== null)
			{
				switch (typeof value)
				{
					case "number":
						this._selectValue(value);
						break;
					case "string":
						var foundIndex = -1;
						if (checkExists(this.options.items))
						{
							for (var i = 0; i < this.options.items.length && (foundIndex === null || foundIndex === -1) ; i++)
							{
								if (this.options.items[i].value.toUpperCase() === value.toUpperCase())
								{
									foundIndex = i;
								}
							}
						}
						else
						{
							this.element.find("option").each(function (index)
							{
								if (this.value.toUpperCase() === value.toUpperCase())
								{
									foundIndex = index;
									return false;
								}
							});
						}
						if (foundIndex !== -1)
							this._selectValue(foundIndex);
						break;
				}
			}
			else
			{
				if (checkExists(this.options.items))
				{
					if (this.options.items.length > 0)
					{
						var option = this.options.items[this.SelectedIndex()];
						if (checkExists(option))
							return option.value;
					}
					return null;
				}
				else
				{
					if (checkExists(this.element[0].options) && this.element[0].options.length > 0)
					{
						var option = this.element[0].options[this.SelectedIndex()];
						if (checkExists(option))
							return option.value;
					}
					return null;
				}
			}
		},

		OptionsCount: function ()
		{
			if (checkExists(this.options.items))
			{
				return this.options.items.length;
			}
			else
			{
				return this.element.get(0).options.length;
			}
		},

		select: function ()
		{
			this.SelectedValue(arguments[0]);
		},

		_applyOptionEventHandlers: function ()
		{

			var self = this;

			this.control.find(".input-control-buttons a.dropdown, a.input-control").on("focus.dropdown", function (event)
			{
				return self._activateControl(event);
			}).on("blur.dropdown", function (event)
			{
				return self._deactivateControl(event);
			}).on("keypress.dropdown", function (event)
			{
				return self._onKeyPress(event);
			}).on("keydown.dropdown", function (event)
			{
				return self._controlKeyDown(event);
			}).parent().on("click", function (event)
			{
				if (!navigator.userAgent.match(appleMobileRegex))
				{
					self.focus(event);
				}

				if (self.dropdown[0].style.display !== "none")
				{
					self._refreshValue();
				}
				else
				{
					self._handleKeyPressOpen(event);
				}
			});

			this.menu.on("mousedown.dropdown", function (event)
			{
				self.menuMousedown = true;
			});
			this.menu.on("click.dropdown", function (event)
			{
				return self._optionClick(event);
			});
			this.dropdown.on("keydown.dropdown", function (event) { return self._optionKeyDown(event); });

		},

		_handleDocumentClick: function (event)
		{
			var $target = $(event.target);

			// handle clicking on the scrollbar.
			if ($target.hasClass("drop-menu-wrapper"))
			{
				return true;
			}

			// handle clicking on the menu
			if (this.menuMousedown === true)
			{
				this.menuMousedown = false;
				return true;
			}

			if (!this.options.disabled)
			{
				if ($target.closest("div.input-control").get(0) !== this.control.get(0))
				{
					if (this.dropdown[0].style.display !== "none")
					{
						this._blurDropdown(event);
						this._hideDropdown(event);
					}
				}
				else
				{
					if (this.dropdown[0].style.display !== "none")
					{
						this.canOpenDropdown = false;

						// set timeout is a fallback in case canOpenDropdown is not reset in the click handler.
						var self = this;
						this.canOpenDropdownTimeoutHandle = setTimeout(function ()
						{
							self.canOpenDropdown = true;
						}, this.openDropdownDelay);

						this._hideDropdown(event);
					}
				}
			}
		},

		_handleDocumentScroll: function (event)
		{
			this._blurDropdown(event);
			return this._hideDropdown(event);
		},

		_findByIndex: function (index)
		{
			return $(this.menu[0].getElementsByTagName("li")[index]);
		},

		_highlight: function (item)
		{
			if (checkExists(item) && typeof item === 'object' && item.length > 0)
			{
				this._clearHighlighted();
				item.addClass("selected");
				this._setTextboxContent(item.text(), this._getIcon());
				return item;

			}
			else if (!isNaN(item)) // we got an index
			{
				this._clearHighlighted();
				item = this._findByIndex(item).addClass("selected");
			}

			this._setTextboxContent(item.text(), this._getIcon());
			return item;
		},

		_highlightPrevious: function ()
		{
			var currentItem = this._findHighlighted();

			var numberOfItems = this.OptionsCount();
			if (currentItem.length === 0)
			{
				var prevItem = this._findByIndex(numberOfItems - 1);
			}
			else if (currentItem.attr("data-index") > 0)
			{
				this._clearHighlighted(currentItem);
				var prevItem = currentItem.prev();
			}

			if (!checkExists(prevItem))
			{
				prevItem = currentItem;
			}

			this._highlight(prevItem);
			this._adjustItemVisibility(prevItem);
		},

		_highlightNext: function ()
		{
			var currentItem = this._findHighlighted();

			if (currentItem.length === 0)
			{
				var nextItem = this._findByIndex(0);
			}
			else if (currentItem.attr("data-index") < this.OptionsCount() - 1)
			{
				this._clearHighlighted(currentItem);
				var nextItem = currentItem.next();
			}

			if (!checkExists(nextItem))
			{
				nextItem = currentItem;
			}

			this._highlight(nextItem);
			this._adjustItemVisibility(nextItem);
		},

		_findHighlighted: function ()
		{
			var highlighted = this.menu.children(".selected");

			if (highlighted.length === 0)
			{
				highlighted = this._findByIndex(this.SelectedIndex());
			}

			return highlighted;
		},

		_findHighlightedIndex: function ()
		{
			return this.menu.children(".selected").attr("data-index");
		},

		_clearHighlighted: function (item)
		{
			var highlightedItem = (checkExists(item)) ? item : this._findHighlighted();

			highlightedItem.find(".selected").removeClass("selected");

			return highlightedItem.removeClass("selected");
		},

		_adjustItemVisibility: function (item)
		{
			if (!checkExists(item))
			{
				var item = this._findHighlighted();
			}

			if (checkExists(item) && item.length !== 0)
			{
				if (item.position().top < this.menuWrapper.scrollTop()
					|| item.position().top >= (this.menuWrapper.scrollTop() + this.menuWrapper.height()))
				{

					var sScroll = item.position().top - this.menuWrapper.parent().height() + item.height();
					this.menuWrapper.scrollTop(sScroll);

				}
			}
		},

		_controlKeyDown: function (event)
		{
			if (!this.options.disabled)
			{
				switch (event.keyCode)
				{
					// Page Up Key
					case 33:
						event.preventDefault();
						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}

						var item = this._findHighlighted();
						if (item.length === 0)
						{
							item = this._findByIndex(0);
						}
						var menuHeight = this.menuWrapper.parent().height();

						var sScroll = item.position().top - menuHeight + item.height();
						this.menuWrapper.scrollTop(sScroll);

						var index = parseInt(item.attr("data-index"));

						var itemHeight = item.height();

						var indexDifference = parseInt(menuHeight / itemHeight);
						var newIndex = index - indexDifference;

						if (newIndex >= 0)
						{
							this._highlight(newIndex);
						}
						else
						{
							this._highlight(0);
						}

						break;
						// page down
					case 34:
						event.preventDefault();
						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}
						var item = this._findHighlighted();

						if (item.length === 0)
						{
							item = this._findByIndex(0);
						}

						var sScroll = item.position().top;
						this.menuWrapper.scrollTop(sScroll);

						var index = parseInt(item.attr("data-index"));

						var menuHeight = this.menuWrapper.parent().height();
						var itemHeight = item.height();

						var indexDifference = parseInt(menuHeight / itemHeight);
						var newIndex = index + indexDifference;

						var maxValue = this.OptionsCount() - 1;

						if (newIndex <= maxValue)
						{
							this._highlight(newIndex);
						}
						else
						{
							this._highlight(maxValue);
						}

						break;
						// End Key
					case 35:
						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}
						this._highlight(this.OptionsCount() - 1);
						event.preventDefault();
						break;
						// Home Key
					case 36:
						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}
						this._highlight(0);
						event.preventDefault();
						break;

						// Up Arrow Key
					case 38:
						event.stopPropagation();
						event.stopImmediatePropagation();
						event.preventDefault();

						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}
						this._highlightPrevious();

						break;

						// Down Arrow Key
					case 40:
						event.stopPropagation();
						event.stopImmediatePropagation();
						event.preventDefault();

						if (this.dropdown[0].style.display === "none")
						{
							this._handleKeyPressOpen(event);
						}
						this._highlightNext();
						break;

						// escape
					case 27:
						event.preventDefault();

						if (this.dropdown[0].style.display !== "none")
						{
							this._selectValue(this.previouslySelected);
							this._refreshValue();
							return this._hideDropdown(event);
						}
						break;
						// enter
					case 13:
						if (this.dropdown[0].style.display !== "none")
						{
							this._handleKeyPressSelect(event);
							event.stopPropagation();
						}
						event.preventDefault();
						break;
						// space
					case 32:
						if (this.dropdown[0].style.display !== "none")
						{
							this._handleKeyPressSelect(event);
						}
						else
						{
							this._handleKeyPressOpen(event);
						}
						event.preventDefault();
						break;
						// tab
					case 9:
						if (this.dropdown[0].style.display !== "none")
						{
							this._handleKeyPressSelect(event);
						}
						break;
				}
			}
		},

		_handleKeyPressOpen: function (event)
		{
			if ((this.OptionsCount() !== 0 || this.options.isModalized === true) && !this.options.disabled)
			{
				this._showDropdown(event);
				this.searchStartTime = null;
				if (this.OptionsCount() !== 0)
				{
					this._highlight(this.SelectedIndex());
				}
				if (typeof event !== "undefined")
				{
					event.preventDefault();
					event.stopPropagation();
				}
				return false;
			}
		},

		_handleKeyPressSelect: function (event)
		{

			var index = this._findHighlightedIndex();
			this._selectValue(index);
			this.previouslySelected = index;

			this._blurDropdown(event);
			this._hideDropdown(event);

			return false;
		},

		_onKeyPress: function (event)
		{
			// firefox assigns most control keys a keycode of 0 and processes them on keypress, other than othe browsers.
			// This prevents the button press from rendering in the dropdown.
			if (!this.options.disabled && event.which !== 0 && event.which !== 13 && event.which !== 8 && event.which !== 32)
			{
				if (this.dropdown[0].style.display === "none")
				{
					this._showDropdown(event);
				}

				//if no key pressed in 700ms, start a fresh search
				var keyPressTime = new Date();
				if (!checkExists(this.searchStartTime) || keyPressTime - this.searchStartTime > 700)
				{
					this.userSearchString.length = 0;
				}
				this.searchStartTime = new Date();
				this.userSearchString.push(String.fromCharCode(event.which));
				this._findItemBySearchString();
			}
		},

		_findItemBySearchString: function ()
		{
			var self = this;

			var searchValue = self.userSearchString.join("").trim().escapeRegExp();

			var strRegex = new RegExp("^" + searchValue, "i");
			var matches = [];
			var currentHighlightIndex = this._findHighlightedIndex();
			if (!checkExists(currentHighlightIndex))
			{
				currentHighlightIndex = -1;
			}
			else
			{
				currentHighlightIndex = parseInt(currentHighlightIndex);
			}
			self.searchCounter = 0;

			for (var i = 0; i < self.menuDataOptions.length; i++)
			{
				if (self.menuDataOptions[i].text.match(strRegex) !== null)
				{
					matches.push(self.menuDataOptions[i]);
					if (currentHighlightIndex === i)
					{
						self.searchCounter = matches.length; //the next item after this one
					}
				}
			}

			if (matches.length > 0)
			{
				if (self.searchCounter >= matches.length)
				{
					self.searchCounter = 0;
				}

				var item = self._highlight(matches[self.searchCounter].index);
				self._adjustItemVisibility(item);

				var icon = self._getIcon(item.attr("data-index"));
			}
		},

		focus: function ()
		{
			this.control.find(".input-control-buttons a.dropdown, a.input-control")[0].focus();
		},

		_activateControl: function (event)
		{
			if (!this.options.disabled && !this.options.readonly) this.control.addClass("active");
		},

		_deactivateControl: function (event)
		{
			this.control.removeClass("active");
		},

		_optionClick: function (event)
		{
			if (!$(event.target).closest("a").is(".disabled") && !this.options.disabled)
			{
				this.control.find("a.input-control").trigger("focus");
				var currentLi = $(event.target).closest("li");
				var index = currentLi.parent().find("li").index(currentLi);
				this._selectValue(index);
				this._hideDropdown(event);
				this.previouslySelected = index;
			}
		},

		_optionKeyDown: function (event)
		{
			if (event.keyCode === 32)
			{
				var currentLi = $(event.target).closest("li");
				var index = currentLi.parent().find("li").index(currentLi);
				this._selectValue(index);
				this._refreshValue();
			}
		},

		_showDropdown: function (event)
		{
			if (this.canOpenDropdown === false)
			{
				this.canOpenDropdown = true;
				clearTimeout(this.canOpenDropdownTimeoutHandle);
				return true;
			}

			$(document).on(this.mousedownNameSpaceEvent, this._handleDocumentClick.bind(this));
			$(document).on(this.dragNameSpaceEvent, this._handleDocumentClick.bind(this));
			$(window, "body", document).on(this.scrollNameSpaceEvent, this._handleDocumentScroll.bind(this));

			var pos = this._calculateAvailableHeight();

			this.dropdown.appendTo($("body"));

			// Resettting the dimensions
			this.dropdown.css({
				"top": "0px",
				"left": "",
				"width": "auto",
				"height": "auto",
				"position": "absolute",
				"max-height": pos.height + 1
			}).removeClass("overflown");
			var sizingControl = this.control.find(".styling-outer-wrapper");
			//fallback
			if (sizingControl.length === 0)
				sizingControl = this.control;
			var innerWidth = sizingControl.innerWidth();
			var leftAddition = (this.control.outerWidth(true) - innerWidth) / 2;
			var cssOpt = {
				"position": "absolute",
				"width": (innerWidth - 2) + "px",
				"min-width": (innerWidth - 2) + "px",
				"left": (sizingControl.offset().left + leftAddition) + "px",
				"z-index": 1
			};

			var drpdwnh = this.dropdown.show().height();

			var overflows = (pos.height < drpdwnh);

			if (overflows)
			{
				// The dropdown menu will overflow
				this.dropdown.addClass("overflown");

				var itemHeight = this.menu.children("li:first-child").height();
				var bordersHeight = this.dropdown.children(".drop-menu-t").height() + this.dropdown.children(".drop-menu-b").height();

				var initHeight = pos.height - bordersHeight;
				initHeight = (parseInt(initHeight / itemHeight) * itemHeight) + bordersHeight;

				$.extend(cssOpt, { "height": initHeight });
			}
			else
			{
				this.dropdown.removeClass("overflown").css({ "height": "auto", "position": "absolute" });
			}

			this.dropdown.css(cssOpt);
			this.control.addClass("active");

			if (pos.position === "below")
			{
				this.dropdown.position({
					my: "left top+" + this.popupVerticalOffsetFromControl,
					at: "left bottom",
					of: sizingControl,
					collision: "none fit"
				});
			}
			else
			{
				this.dropdown.position({
					my: "left bottom-" + this.popupVerticalOffsetFromControl,
					at: "left top",
					of: sizingControl,
					collision: "none fit"
				});
			}

			//set the alignment
			var textAlignPart = this.control.find(".styling-font");
			if (textAlignPart.length > 0)
			{
				var textAlign = textAlignPart[0].style.textAlign;
				if (checkExists(textAlign) && textAlign !== "")
				{
					this.dropdown.find("ul.drop-menu").each(function ()
					{
						this.style.textAlign = textAlign;
					});
				}
			}
			this._adjustItemVisibility();

			// IE fix for ActiveX objects and z-index
			SourceCode.Forms.Widget.createUnderlay(this.dropdown);
		},

		_calculateAvailableHeight: function ()
		{
			var heightAbove = this.control.offset().top - $(document).scrollTop();
			var shadow = SourceCode.Forms.Widget.getBoxShadow(this.dropdown);
			var heightBelow = $(window).height() - heightAbove - this.control.height() - shadow.vShadow - shadow.spread;
			if (heightAbove > heightBelow)
			{
				return { position: "above", height: parseInt(heightAbove) - this.popupVerticalOffsetFromControl };
			} else
			{
				return { position: "below", height: parseInt(heightBelow) - this.popupVerticalOffsetFromControl };
			}

		},

		hidedropdown: function ()
		{
			this._hideDropdown();
		},

		_hideDropdown: function (event)
		{
			$(document).off(this.mousedownNameSpaceEvent).off(this.dragNameSpaceEvent);
			$(window, "body", document).off(this.scrollNameSpaceEvent);

			this._refreshValue(); // called to reset any value set by keyboard navigation
			this._clearHighlighted(); //clear keyboard navigation

			this.dropdown.hide();

			// IE fix for ActiveX objects and z-index
			SourceCode.Forms.Widget.destroyUnderlay(this.dropdown);
		},

		_blurDropdown: function (event)
		{
			if ($(event.target).closest(".input-control.select-box, .menu").length === 0)
			{
				this.control.removeClass("active");
				this._hideDropdown(event);
			}
		},

		_triggerChange: function ()
		{
			this.changetimer = null;
			this.element.trigger("change");
		},

		fetch: function ()
		{
			if (arguments[0] === "control" && this.control !== null)
			{
				return this.control;
			}
		},
		/**
		 * Items Method is used to retrieve the widget item models
		 * @function
		 * @returns {Array} of dropdown item object 
		 */
		Items: function ()
		{
			var optionItems = [];
			if (checkExists(this.options.items))
			{
				optionItems = this.options.items;
			}
			return optionItems;
		},
		/**
		 * AppendItem is used to add a dropdown item model to the widget
		 * @function
		 * @param {Object} item, this is the dropdown item model 
		 * @returns {Boolean} true, if the element was appended or item exists
		 */
		AppendItem: function (item)
		{
			var appendedItem = false;

			//Throw error if using option tags with allowEmptyFirstItem property.
            if (this.element[0].options && this.element[0].options.length > 0 &&
				(checkExists(this.options.allowEmptyFirstItem) && (this.options.allowEmptyFirstItem === true)))
			{
				throw new Error("allowEmptyFirstItem property incorrectly used.");
			}

			var items = this.Items();
			var itemIndex = items.indexOf(item);

			if (itemIndex == -1)
			{
				//Does not exist
				appendedItem = true;

				//Create the options.items array if it hasnt been initialised
				if (!checkExists(this.options.items))
				{
					this.options.items = [];
				}

				items = this.Items();

				//Always set the new item to be the item length.
				item.index = items.length;
				items.push(item);

				if ( (items.length > 0 && this.SelectedIndex() == -1) &&
					(checkExists(this.options.allowEmptyFirstItem) && !this.options.allowEmptyFirstItem) )
				{
					//If there are items and nothing is selected set the first item as default
					var firstItem = items[0];
					firstItem.selected = true;
				}
			}
			return appendedItem;
		},
		/**
		 * RemoveItemByValue is used to remove a dropdown item model by its value property
		 * @function
		 * @param {String} itemValue, this is the dropdown item model's value property that is evaluated to remove
		 * @returns {Boolean} true or false if the item was removed from the dropdown widget items
		 */
		RemoveItemByValue: function (itemValue)
		{
			var removedItem = false;
			var items = this.Items();

			var filteredItems = items.filter(function (optionItem, index, array)
			{
				if (optionItem.value === itemValue)
				{
					return true;
				}
			});

			if (filteredItems.length > 0)
			{
				removedItem = true;
			}

			filteredItems.forEach(function (optionItem, index, array)
			{
				var deletingIndex = items.indexOf(optionItem);

				items.splice(deletingIndex, 1);
			});
			return removedItem;
		},
		/**
		 * ClearSelection is used to put the widget into nothing being chosen.
		 * @function
		 * @returns {Boolean} true/false to indicated if it deselected anything
		 */
		ClearSelection: function ()
		{
			var items = null;
			var hasDeselected = false;

			if (checkExists(this.options.items))
			{
				this.Items().forEach(function (item, index, array)
				{
					if (item.selected)
					{
						hasDeselected = true;
						item.selected = false;
					}
				});

			}
			else
			{
				items = $(this.element).children("OPTION[selected], OPTION.selected")
                                        .prop("selected", false)
										.removeClass("selected");

				hasDeselected = (items.length > 0) ? true :false;

			}
			return hasDeselected;
		}

	};

	if (typeof SCDropDown === "undefined") SCDropDown = SourceCode.Forms.Controls.DropDown;

	$.widget("ui.dropdown", SourceCode.Forms.Controls.DropDown);

	$(function ()
	{
		$("select.input-control:not(.runtime)").dropdown();
	});

})(jQuery);
