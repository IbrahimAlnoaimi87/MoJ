(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.CheckMenu = {
        _create: function(){
            this.defaultTags = [];
            this.inclusions = [];
            this.userChosenInclusions = [];
            this.contextmenu = null;
            this.itemsDictionary = {};
            this.paneWidth = 0; //please see init, for the real initialized value.
            
            this._createContextMenu();
            this._initClickHandler();
        },

        _init: function ()
        {
            //LG: If the paneWidth prop isn't set, then the hyperlink will always be "...", 
            //    as it thinks there is no space to list the checked items (see html() method)
            //	  So, if the <A> tag is already block/inline-block, we may as well initialize 
            //    with its width instead of 0, so at least in those cases, there will be no need to call SetPaneWidth externally. 
            this.setPaneWidth(null, false); //this.element is not available in _create().
        },
    

        _destroy: function () 
        {
            if (checkExists(this.contextmenu) && checkExists(this.contextmenu.element))
            {
                // Cleanup the menu element in the root of the body element.
                var elementToRemove = this.contextmenu.element;
                elementToRemove.remove();
            }
        },

        _createContextMenu: function ()
        {
            $this = this;
            if ($this.contextmenu === null){
                $this.contextmenu = new CheckBoxContextMenu({
                    dropshadow: false,
                    close: $this._closing.bind($this)
                });
            }
        },

        _closing: function ()
        { //triggers when the check menu is closing
            this._trigger("closing");
        },
        
        _checkedChanged: function ()
        { //triggers when a sigle selection is changed in the check menu
            this._trigger("checkedChanged");
        },

        _initClickHandler: function ()
        {
            var $checkmenu = this;

            $checkmenu.element.on("click", function (ev)
            {
                $checkmenu._trigger("click", ev);
            })
        },

        showContextMenu: function (ev)
        {
            this.contextmenu.showContextMenu(ev);
        },

        addSeperator: function ()
        {
            this.contextmenu.addSeperator();
        },

        getInclusions: function ()
        {
            return this.inclusions.slice(0);
        },

        getExclusions: function ()
        {
            var exclusions = [];
            for (var x = 0; x < this.defaultTags.length; x++)
            {
                if (this.inclusions.indexOf(this.defaultTags[x]) === -1)
                {
                    exclusions.push(this.defaultTags[x]);
                }
            }
            return exclusions;
        },

        addItem: function ()
        {
            var o = arguments[0];
            var item = this.contextmenu.addItem(o);			
            
            //FIX: ensure that the checkbox widget has been initialized on the new item.
            var cb = item.element.find("input[type=checkbox]");
            if (!cb.data("ui-checkbox")) cb.checkbox();
            
            

            var _this = this;
            item.element.on("click", function (ev)
            {
                _this._checkcontextmenuclick(o.id, item.element);
            });

            if (this.defaultTags.indexOf(o.id) === -1)
            {
                this.defaultTags.push(o.id);
                this.itemsDictionary[o.id] = o;
            }
            if (o.checked && this.inclusions.indexOf(o.id) === -1)
            {
                this.inclusions.push(o.id);
            }
        },

        countItems: function ()
        {
            return this.contextmenu.items.length;
        },

        setPaneWidth: function (value, update)
        {
            var newvalue = value;
            this.paneWidth = (checkExists(newvalue) && newvalue!==0 && newvalue!=="0")? newvalue: this.element.width();
            //rewrite the html contents based on the width of the panel
            if (update === true)
            {
                this.html(this.inclusions.join("|"));
            }
        },

        disableItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            cb.checkbox("disable");
            cb.closest("a.checkmenu-item").prop("disabled", true);
            cb.closest("li").addClass("disabled");
        },

        enableItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            cb.checkbox("enable");
            cb.closest("a.checkmenu-item").prop("disabled", false);
            cb.closest("li").removeClass("disabled");
        },

        //check the relevant checkbox and add to list of inclusions
        checkItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            if (checkExists(cb) && checkExists(this.itemsDictionary[itemName]))
            {
                cb.checkbox("check");
                this._includeItem(itemName);
                this.itemsDictionary[itemName].checked = true;
            }
        },

        //uncheck the relevant checkbox and remove from list of inclusions
        unCheckItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            if (checkExists(cb) && checkExists(this.itemsDictionary[itemName]))
            {
                cb.checkbox("uncheck");
                this._excludeItem(itemName);
                this.itemsDictionary[itemName].checked = false;
            }
        },

        checkItems: function (itemsToCheck)
        {
            this.inclusions = itemsToCheck;
            for (var y = 0; y < itemsToCheck.length; y++)
            {
                this.checkItem(itemsToCheck[y]);
            }
            var itemsToUncheck = this.getExclusions();
            for (var y = 0; y < itemsToUncheck.length; y++)
            {
                this.unCheckItem(itemsToUncheck[y]);
            }

            this._trigger("checkedChanged");
        },

        //Add item to list of inclusions
        _includeItem: function (id)
        {
            if (this.inclusions.indexOf(id) === -1)
            {
                //include item
                this.inclusions.push(id);
            }
        },

        //Remove item from list of inclusions
        _excludeItem: function (id)
        {
            this._removeItemFromArray(this.inclusions, id);
        },


        html: function (text)
        {
            var items = text.split('|');
            var allItems = this.defaultTags.slice(0);

            //ignore systemobjects
            this._removeItemFromArray(items, "systemobject");
            this._removeItemFromArray(allItems, "systemobject");

            //ignore "all" as item
            this._removeItemFromArray(items, "all");

            //ensure category is always the last item
            var cIndex = items.indexOf("category");
            if (cIndex > -1)
            {
                items.splice(cIndex, 1);
                items.push("category");
            }

            var newString = "";
            var firstPass = true;
            var cutOff = false;
            var title = "";
            var itemCounter = 0;

            if (allItems.length === items.length)
            {
                //All items included (ALL must display regardless of whether systemobjects are included or excluded)
                newString = title = Resources.AppStudio.SearchContextAllText;
            }
            else if (items.length === 1 && items[0] === "category")
            {
                //No items except categories included
                newString = title = Resources.ObjectNames.CategoryPlural;
            }
            else
            {
                while (!cutOff && itemCounter < items.length)
                {
                    var menuItem = this.itemsDictionary[items[itemCounter]];
                    if (checkExists(menuItem))
                    {
                        var itemName = menuItem.text;
                        var currentWidth = (((newString + itemName).length * 6) + 75);
                        //if text fits in container, add itemName - else ellipsis
                        if (currentWidth < this.paneWidth)
                        {
                            if (firstPass)
                            {
                                newString += itemName;
                                title = itemName;
                                firstPass = false;
                            }
                            else
                            {
                                newString += ", " + itemName;
                                title += ", " + itemName;
                            }
                        }
                        else
                        {
                            newString += "...";
                            title += ", " + itemName;
                            cutOff = true;
                        }
                    }
                    itemCounter++;
                }
            }

            if (newString.length === 0)
            {
                newString = title = Resources.AppStudio.SearchContextNoneText;
            }

            this.element.html(newString);
            this.element[0].title = title;
        },

        _checkcontextmenuclick: function ()
        {
            var id = arguments[0];
            var el = arguments[1];

            if (checkExists(id) && checkExists(el))
            {
                //checkboxes are already checked/unchecked, maintain list of inclusions
                if (this.contextmenu.element.find("label[id=FilterSearchScope_" + id + "]").hasClass("checked"))
                {
                    this._includeItem(id);
                }
                else
                {
                    this._excludeItem(id);
                }
                //save the user chosen inclusions:
                this.userChosenInclusions = this.inclusions.slice(0);
                this._checkedChanged();
            }
            else
            {
                //no arguments passed, check or uncheck items according to inclusions
                //this.checkItems fires checkedChanged
                this.checkItems(this.inclusions);
            }

            //update the labels:
            this.html(this.inclusions.join("|"));
        },

        userFilterDifferentFromDefault: function (defaultFilter)
        {
            var userfilter = this.userChosenInclusions.slice(0);
            var defaultToAll = false;
            var aIndex = defaultFilter.indexOf("all");
            if (aIndex > -1 && defaultFilter.length === 1)
            {
                defaultToAll = true;
            }
            //remove 'all', 'category' and 'systemobject', not for comparison
            //remove systemobjects
            this._removeItemFromArray(defaultFilter, "systemobject");
            this._removeItemFromArray(userfilter, "systemobject");
            //remove category
            this._removeItemFromArray(defaultFilter, "category");
            this._removeItemFromArray(userfilter, "category");
            //remove "all"
            var aIndex = defaultFilter.indexOf("all");
            this._removeItemFromArray(defaultFilter, "all");
            this._removeItemFromArray(userfilter, "all");

            if (defaultToAll)
            {
                for (var d = 0; d < this.defaultTags.length; d++)
                {
                    if (["all", "category", "systemobject"].indexOf(this.defaultTags[d]) === -1)
                    {
                        defaultFilter.push(this.defaultTags[d]);
                    }
                }
            }
            if (userfilter.length === defaultFilter.length)
            {
                return false;
            }
            return true;
        },

        //To reset the menu to user chosen configuration
        //If user hasn't made any selections, use default inclusions
        refresh: function ()
        {
            if (this.userChosenInclusions.length === 0)
            {
                //first time, no user selections have been made
                this.userChosenInclusions = this.inclusions.slice(0);
            }
            else
            {
                this.inclusions = this.userChosenInclusions.slice(0);
            }
            this._checkcontextmenuclick();
        },

        _removeItemFromArray: function (arr, itemToRemove)
        {
            var itemIndex = arr.indexOf(itemToRemove);
            if (itemIndex > -1)
            {
                arr.splice(itemIndex, 1);
            }
        }


    }

    if (typeof SCCheckMenu === "undefined") SCCheckMenu = SourceCode.Forms.Controls.CheckMenu;

    $.widget("ui.checkmenu", SourceCode.Forms.Controls.CheckMenu);

    $.extend($.ui.checkmenu, {
        getter: "addItem showContextMenu countItems addSeperator tag html checkItem setPaneWidth"
    });

})(jQuery);
