(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};
	var filterCheckMenuInstance = null; // There is only one instance of the rules filter context menu
	SourceCode.Forms.Controls.FilterCheckMenu =
	{

		_tagSeparator: "|",
		_checkedChanging:false,

		_init: function ()
		{
			this.tags = "All|Form|View|Control|Unbound|Subform|Subview|StyleProfile";
			this.filtercontextmenu = null;
			this.paneWidth = 0;
			this._createContextMenu();
			this._initClickHandler();
		},

		_createContextMenu: function ()
		{
			$this = this;
			if (checkExists(filterCheckMenuInstance))
			{
				filterCheckMenuInstance.closeMenu();
				$("#RulesFilterContext").remove();
			}
			$this.filtercontextmenu = new FilterCheckBoxContextMenu({
				id: "RulesFilterContext",
				dropshadow: false,
				close: $this._closing.bind($this)
			});
			filterCheckMenuInstance = $this.filtercontextmenu;
		},

		_toggleFilterIsActive: function(filterIsActive)
		{
			if (filterIsActive === true)
			{
				this.element.addClass("active");
				this.element.attr("title", Resources.AppStudio.FiltersAppliedTooltip);
			}
			else
			{
				this.element.removeClass("active");
				this.element.attr("title", Resources.AppStudio.NoFiltersAppliedTooltip);
			}
		},

		_updateFilterActiveState: function()
		{
			var allItemsFilterApplied = (this.tags.indexOf("All") > -1);
			var extendedFilterApplied = (this.tags.indexOf("Extended") > -1);
			var filterActive = !allItemsFilterApplied || extendedFilterApplied;

			this._toggleFilterIsActive(filterActive);
		},

		_closing: function ()
		{
			//triggers went the check menu is closing
			if (this.element.hasClass("menu-active"))
			{
				this.element.removeClass("menu-active");
			}

			this._trigger("closing");
		},
		
		_checkedChanged: function ()
		{ //triggers when a sigle selection is changed in the check menu
			this._checkedChanging = true;
			this._trigger("checkedChanged");
			this._checkedChanging = false;
		},

		_initClickHandler: function ()
		{
			var $checkmenu = this;
				$checkmenu.element.on("click", function (ev)
				{
					$checkmenu._trigger("click", ev);
				});
		},

		isCheckedChanging: function ()
		{
			return this._checkedChanging;
		},

		showContextMenu: function (ev)
		{
			this.filtercontextmenu.showContextMenu(ev);
		},

		addSeperator: function ()
		{
			this.filtercontextmenu.addSeperator();
		},

		tag: function ()
		{
			return this.tags;
		},

		addItem: function ()
		{
			var $checkmenu = this;
			var o = arguments[0];
			this.filtercontextmenu.addItem(o);
			var item = this.filtercontextmenu.items[(this.filtercontextmenu.items.length - 1)];
			var checkbox = item.element.find(":checkbox");
			checkbox.checkbox();
			item.element.on("click", function ()
			{
				$checkmenu._checkcontextmenuclick(o.id, item.element);
			});
		},

		setPaneWidth: function ()
		{
			this.paneWidth = arguments[0];
			//rewrite the html contents based on the width of the panel
			if (arguments[1] === true)
			{
				this.html(this.tags);
			}
		},

		countItems: function ()
		{
			return this.filtercontextmenu.items.length;
		},

		clearMenu: function ()
		{
			this.filtercontextmenu.clearMenu();
		},

		removeMenuItems: function()
		{
			this.filtercontextmenu.removeMenuItems();
		},

		checkItem: function (itemName)
		{ // force an item to be checked
			
			for (var y = 0; y < this.filtercontextmenu.items.length; y++)
			{
				var item = this.filtercontextmenu.items[y];

				if (item.id === itemName)
				{
					this._toggleMenuItem(item, true);
					break;
				}
			}
		},

		html: function (text)
		{
			var $checkmenu = this;

			var items = text.split('|')
			var newString = "";
			var firstPass = true;
			var title = "";
			//all is a hidden item therefore start at 1
			var counter = 1;
			for (var y = 0; y < $checkmenu.filtercontextmenu.items.length; y++)
			{
				var node = $checkmenu.filtercontextmenu.items[y];
				for (var x = 0; x < items.length; x++)
				{
					if (items[x] !== "all")
					{
						if (node.id === items[x])
						{
							var currentWidth = (((newString + node.text).length * 6) + 75);

							if (firstPass)
							{
								//check to see if the test will fit in the current container
								if (currentWidth < this.paneWidth)
								{
									newString += node.text;
								}
								else
								{
									newString += "...";
								}
								//title = node.text;
								title = Resources.AppStudio.NoFiltersAppliedTooltip;
							}
							else
							{
								//check to see if the test will fit in the current container
								if (currentWidth < this.paneWidth)
								{
									if (!newString.contains("..."))
									{
										newString += ", " + node.text;
									}
								}
								else if (!newString.contains("..."))
								{
									newString += "...";
								}
								title = Resources.AppStudio.FiltersAppliedTooltip;
							}

							firstPass = false;
							counter++;
						}
					}
					else
					{
						if (node.id === items[x])
						{
							counter++;
						}
					}
				}
			}

			if (counter >= $checkmenu.filtercontextmenu.items.length)
			{
				newString = title = Resources.AppStudio.NoFiltersAppliedTooltip;
			}
			else if (items.length === 1 && items[0] === "category")
			{
				newString = Resources.ObjectNames.CategoryPlural;
			}

			if (newString.length === 0)
				newString = Resources.AppStudio.SearchContextNoneText;

			var tagitems = [];
			for (var i = 0, l = items.length; i < l; i++)
				if (items[i] !== "") tagitems.push(items[i]);

			$checkmenu.element[0].title = title;
			$checkmenu.element.attr("data-tag", tagitems.join("|"));
		},

		_getMenuItemElement: function (item)
		{
			var idPrefixSelector = "#RulesFilterSearchScope_";
			var node = $(idPrefixSelector + item.id);
			return node;
		},

		_toggleMenuItem: function (item , isChecked)
		{
			var node = this._getMenuItemElement(item);
			var checkbox = node.find(':checkbox');
			node.toggleClass("checked", isChecked);
			node.toggleClass("unchecked", !isChecked);
			checkbox.checkbox(isChecked ? "check" : "uncheck");
			item.checked = isChecked;
		},

		_updateChildParentRelations: function (menuItemLookup, forceParentState)
		{
			var menuItems = this.filtercontextmenu.items;
			//update children's parent (all items)
			var item = null;
			for (var x = 0; x < menuItems.length; x++)
			{
				item = menuItems[x];
				if (checkExists(item.options.children))
				{
					if (forceParentState === true && item.checked === true)
					{
						for (var y = 0; y < item.options.children.length; y++)
						{
							search = item.options.children[y];
							var childItem = menuItemLookup[search];
							this._toggleMenuItem(childItem, true);
						}
					}
					else
					{
						var allChildrenChecked = true;
						for (var y = 0; y < item.options.children.length && allChildrenChecked; y++)
						{
							search = item.options.children[y];
							var childItem = menuItemLookup[search];
							if (checkExists(childItem))
							{
								allChildrenChecked = childItem.checked;
							}
						}
						if (allChildrenChecked !== item.checked)
						{
							this._toggleMenuItem(item, allChildrenChecked);
						}
					}
				}
			}
		},
		
		_buildTags: function()
		{
			var menuItems = this.filtercontextmenu.items;
			var x, tag = "", item;
			//build tags
			for (x = 0; x < menuItems.length; x++)
			{
				item = menuItems[x];
				if (item.checked)
				{
					var list = item.text;
					var itemid = item.id;

					if (tag === "")
					{
						tag += itemid;
					}
					else
					{
						tag += this._tagSeparator + itemid;
					}
				}
			}

			if (tag === "")
			{
				tag = "None";
			}
			this.tags = tag;
		},

		_checkcontextmenuclick: function ()
		{
			var id = arguments[0];
			var firstLoop = true;

			var selectedItem, item, node, checkbox, x, search;
			var menuItems = this.filtercontextmenu.items;
			var menuItemLookup = {};
			
			//sync UI state and get selected item
			for (x = 0; x < menuItems.length; x++)
			{
				item = menuItems[x];
				node = this._getMenuItemElement(item);
				checkbox = node.find(':checkbox');
				item.checked = checkbox.is(':checked');

				if (item.id === id)
				{
					selectedItem = item;
				}
				menuItemLookup[item.id] = item;
			};

			this._toggleMenuItem(selectedItem, selectedItem.checked);

			//update a parent item's children (all items)
			if (checkExists(selectedItem.options.children))
			{
				for (x = 0; x < selectedItem.options.children.length; x++)
				{
					search = selectedItem.options.children[x];
					item = menuItemLookup[search];
					if (checkExists(item))
					{
						this._toggleMenuItem(item, selectedItem.checked);
					}
				}
			}

			this._updateChildParentRelations(menuItemLookup);
			
			this._buildTags();

			this._updateFilterActiveState();

			this.filtercontextmenu.hasChanged = true;
			this._checkedChanged();
		},

		loadStateFromTags: function (tags)
		{
			var menuItems = this.filtercontextmenu.items;
			var x, item;

			var tagsArray = tags.split(this._tagSeparator);
			var tagsLookup = {};
			var menuItemLookup = {};

			for (x = 0; x < tagsArray.length; x++)
			{
				tagsLookup[tagsArray[x]] = true;
			};

			for (x = 0; x < menuItems.length; x++)
			{
				item = menuItems[x];
				menuItemLookup[item.id] = item;

				var isChecked = (tagsLookup[item.id] === true);
				if (item.checked !== isChecked)
				{
					this._toggleMenuItem(item, tagsLookup[item.id]);
				}
			};

			this._updateChildParentRelations(menuItemLookup, true);

			this.tags = tags;
		}
	}

	if (typeof SCFilterCheckMenu === "undefined") SCFilterCheckMenu = SourceCode.Forms.Controls.FilterCheckMenu;

	$.widget("ui.filtercheckmenu", SourceCode.Forms.Controls.FilterCheckMenu);

	$.extend($.ui.filtercheckmenu, {
		getter: "addItem showContextMenu countItems addSeperator tag html checkItem setPaneWidth"
	});

})($);
