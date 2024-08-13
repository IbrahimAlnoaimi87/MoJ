(function ($)
{
    if (typeof SourceCode === 'undefined' || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === 'undefined' || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === 'undefined' || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};
    if (typeof SourceCode.Forms.Controls.AreaItem === 'undefined' || SourceCode.Forms.Controls.AreaItem === null) SourceCode.Forms.Controls.AreaItem = {};
    function addReady(fn)
    {
        if (typeof addRuntimePendingCalls === "function")
        {
            addRuntimePendingCalls(fn);
        }
        else
        {
            $(document).ready(fn);
        }
    }

    addReady(function ()
    {
        if (!checkExists(SourceCode.Forms.Controls.Base) || !checkExists(SourceCode.Forms.Controls.Base.ControlType))
        {
            return;
        }

        var SFCAreaItem;
        SourceCode.Forms.Controls.AreaItem = SFCAreaItem = $.extend({}, SourceCode.Forms.Controls.Base.ControlType,
            {
                _getInstance: function (id)
                {
                    var idParts = id.split("_");
                    id = idParts[idParts.length - 1];
                    if (!checkExists(this._areaItemsHash))
                    {
                        this._areaItemsHash = new SFRuntimeHash();
                    }

                    var areaItem = this._areaItemsHash.get(id);

                    if (!checkExists(areaItem))
                    {
                        areaItem = $("[data-areaItemId='" + id + "']");

                        if (areaItem.length === 0)
                        {
                            return null; // Area Item notfound
                        }
                        this._areaItemsHash.add(id, areaItem);
                    }
                    return areaItem;
                },

                getProperty: function (objInfo)
                {
                    var instance = SFCAreaItem._getInstance(objInfo.CurrentControlId);
                    var value = instance.SFCAreaItem('option', objInfo.property);
                    //if the property was not found jQuery UI will return the instance for chaining
                    //override this and instead return undefined
                    if (value === instance)
                    {
                        return;
                    }
                    else
                    {
                        return value;
                    }
                },

                setProperty: function (objInfo)
                {
                    SFCAreaItem._getInstance(objInfo.CurrentControlId).SFCAreaItem('option', objInfo.property, objInfo.Value);
                },

                saveState: function (objInfo)
                {
                    var instance = SFCAreaItem._getInstance(objInfo.CurrentControlId);
                    var value = instance.SFCAreaItem('saveState');
                    //if the property was not found jQuery UI will return the instance for chaining
                    //override this and instead return undefined
                    if (value === instance)
                    {
                        return;
                    }
                    else
                    {
                        return value;
                    }
                },

                loadState: function (objInfo)
                {
                    SFCAreaItem._getInstance(objInfo.CurrentControlId).SFCAreaItem('loadState', objInfo.Value);
                }
            });

        $.widget("sfc.SFCAreaItem", $.sfc.baseWidget,
            {
                options:
                {
                    fullId: "",
                    previous: {},
                    isVisible: true,
                    isEnabled: true,
                    title: "",
                    id: "",
                    tabIndex: 0,
                    isCollapsible: true,
                    headerHtml: "",
                    viewType: "item",
                    headerSelector: "",
                    headerTextSelector: "",
                    controlName: "",
                    defaultCollapsed: false,
                    width: null,
                    height: null
                },

                _create: function ()
                {
                    this.options.fullId = this.element[0].getAttribute("id");
                    var idParts = this.options.fullId.split("_");

                    this.options.id = idParts[idParts.length - 2];
                    this.options.viewId = idParts[idParts.length - 1];

                    this.options.tabIndex = this.element[0].getAttribute("tabIndex");

                    if (this.options.tabIndex === null)
                    {
                        this.options.tabIndex = 0;
                    }

                    if (this.element.hasClass("panel"))
                    {
                        this.options.viewType = "item";
                        this.options.headerSelector = ".panel-header";
                        this.options.headerTextSelector = ".panel-header-text";
                        this.options.headerHtml = "<div class=\"panel-header\">\
									<div class=\"panel-header-l\">\
									</div><div class=\"panel-header-c\">\
										<div class=\"panel-header-wrapper\">\
											<div class=\"panel-header-text\"><span data-sf-title=\"{0}\">{1}</span>\
											</div><div class=\"panel-header-controls\"> \
												<a href=\"javascript:;\" class=\"collapse-vertical\" tabindex=\"" + this.options.tabIndex + "\"><span></span></a> \
											</div> \
										</div> \
									</div><div class=\"panel-header-r\"> \
									</div> \
								</div>";
                    }
                    else if (this.element.hasClass("grid"))
                    {
                        this.options.viewType = "list";
                        this.options.headerSelector = ".grid-header";
                        this.options.headerTextSelector = ".grid-header-text";
                        this.options.headerHtml = "<div class=\"grid-header\">\
													<div class=\"grid-header-wrapper\">\
														<div class=\"grid-header-text\"><span data-sf-title=\"{0}\">{1}</span>\
														</div><div class=\"grid-header-controls\">\
															<a href=\"javascript:;\" class=\"collapse-vertical\" tabindex=\"" + this.options.tabIndex + "\"><span></span></a>\
														</div>\
													</div>\
												</div>";
                    }
                    else
                    {
                        this.options.viewType = "unknown";
                    }

                    var collapsibleElement = this.element.find(".collapse-vertical, .collapse-horizontal, .expand-vertical, .expand-horizontal");

                    this.options.isCollapsible = collapsibleElement.length > 0 && collapsibleElement[0].style.display !== "none";

                    this.options.controlName = this.element[0].getAttribute("name");
                    this.options.defaultCollapsed = this.element.hasClass("collapsed");
                    this.options.isExpanded = !this.options.defaultCollapsed;

                    this.options.isVisible = !this.element.hasClass("hidden");
                    this.options.isEnabled = !this.element.hasClass("disabled");

                    var headerElements = this.element.find(".grid-header-text > span, .panel-header-text > span").eq(0);
                    var title = "";
                    if (checkExists(headerElements) && headerElements.length > 0)
                    {
                        title = headerElements[0].getAttribute("data-sf-title");
                    }

                    this.options.title = title;

                    this.options.previous = $.extend({}, this.options);
                    this.base._create.apply(this, arguments);
                    this._applyHeaderClickHandler();
                },

                //override the jQuery UI method to fire _applyChanges when the model is changed
                //also contains name and value converter logic and alignment with the jQuery disabled option
                _setOption: function (name, value)
                {
                    if (name.toLowerCase() === "display")
                    {
                        var lowercaseValue = value.toLowerCase();

                        switch (lowercaseValue)
                        {
                            case "show":
                                name = "isvisible";
                                value = true;
                                break;
                            case "hide":
                                name = "isvisible";
                                value = false;
                                break;
                            case "enable":
                                name = "isenabled";
                                value = true;
                                break;
                            case "disable":
                                name = "isenabled";
                                value = false;
                                break;
                            case "collapse":
                                name = "isexpanded";
                                value = false;
                                break;
                            case "expand":
                                name = "isexpanded";
                                value = true;
                                break;
                        }
                    }
                    return this.base._setOption.apply(this, [name, value]);
                },

                applyChanges: function ()
                {
                    var headerElement;
                    if (checkExists(this.options.filterdisplay) && this.options.filterdisplay !== this.options.previous.filterdisplay)
                    {
                        if (this.options.viewType === "list")
                        {
                            var toolbarIndex = $("#" + this.options.fullId).grid("fetch", "toolbars").length - 1;
                            if (toolbarIndex > -1)
                            {
                                var lastItemInToolbarGroup = $("#" + this.options.fullId).grid("fetch", "toolbars")[0].children.length - 1;
                                switch (this.options.filterdisplay.toLowerCase())
                                {
                                    case "show":
                                        $("#" + this.options.fullId).grid("unhide", "toolbar", lastItemInToolbarGroup);
                                        break;
                                    case "hide":
                                        $("#" + this.options.fullId).grid("hide", "toolbar", lastItemInToolbarGroup);
                                        break;
                                }
                            }
                        }
                    }

                    if (this.options.title !== this.options.previous.title)
                    {
                        headerElement = this.element.find(this.options.headerSelector).eq(0);
                        var headerTitleElement = "";

                        if (this.options.title !== "")
                        {
                            if (headerElement.length === 0)
                            {
                                headerElement = this.element.prepend(this.options.headerHtml.format(this.options.title, this.options.title));
                                this.element.removeClass("without-header").addClass("with-header");

                                if (this.options.isCollapsible === false) // by default the collapse controls will show
                                {
                                    this.element.find(".collapse-vertical, .collapse-horizontal").hide();
                                }
                            }
                            else
                            {
                                headerTitleElement = headerElement.find(".panel-header-text > span");
                                if (this.options.viewType === "list")
                                {
                                    headerTitleElement = headerElement.find(".grid-header-text > span");
                                }
                                if (checkExists(headerTitleElement) && headerTitleElement.length > 0)
                                {
                                    $(headerTitleElement[0]).text(this.options.title).show();
                                    $(headerTitleElement[0]).attr("data-sf-title", this.options.title);
                                }
                            }
                        }
                        else
                        {
                            headerTitleElement = headerElement.find(".panel-header-text > span");
                            if (this.options.viewType === "list")
                            {
                                headerTitleElement = headerElement.find(".grid-header-text > span");
                            }
                            if (checkExists(headerTitleElement) && headerTitleElement.length > 0)
                            {
                                $(headerTitleElement[0]).text(this.options.title);
                                $(headerTitleElement[0]).attr("data-sf-title", this.options.title);
                            }

                            if (this.options.isCollapsible === false)
                            {
                                this.element.find(this.options.headerSelector).eq(0).remove();
                                this.element.removeClass("with-header").addClass("without-header");
                            }
                        }
                    }

                    if (this.options.isEnabled !== this.options.previous.isEnabled || this.options.isParentEnabled !== this.options.previous.isParentEnabled)
                    {
                        var isEnabled = this.options.isEnabled === true && this.options.isParentEnabled === true;
                        this._setAllChildControlsProperties("isParentEnabled", isEnabled);

                        if (isEnabled)
                        {
                            this.element.find(".filterContainer").prop('disabled', false).find("*").prop('disabled', false).removeClass("disabled");
                        }
                        else
                        {
                            this.element.find(".filterContainer").prop('disabled', true).find("*").prop('disabled', true).addClass("disabled");
                        }
                        if (this.options.viewType === "list")
                        {
                            populateListFilterEvents(this.options.fullId, !isEnabled);
                        }

                    }

                    if (this.options.isCollapsible !== this.options.previous.isCollapsible)
                    {
                        if (this.options.isCollapsible === true)
                        {
                            headerElement = this.element.find(this.options.headerSelector).eq(0);

                            if (headerElement.length === 0)
                            {
                                headerElement = this.element.prepend(this.options.headerHtml.format(this.options.title, this.options.title));
                                this.element.removeClass("without-header").addClass("with-header");
                            }

                            var collapsibleElement = this.element.find(".collapse-vertical, .collapse-horizontal, .expand-vertical, .expand-horizontal").show();
                            // Now we need to verify if the View is already collapsed that we syncronise the Collapse/Expand button's initial state to the View's collapsed state.
                            // The intial state is expanded so we only need to handle collapsed state.
                            if (!this.options.isExpanded)
                            {
                                collapsibleElement.removeClass("collapse-vertical").addClass("expand-vertical");
                            }

                            // Reset the event handler.
                            this._applyHeaderClickHandler(headerElement);
                        }
                        else
                        {
                            if (this.options.title === "")
                            {
                                this.element.find(this.options.headerSelector).eq(0).remove();
                                this.element.removeClass("with-header").addClass("without-header");
                            }
                            this.element.find(".collapse-vertical, .collapse-horizontal, .expand-vertical, .expand-horizontal").hide();
                        }
                    }

                    if (this.options.isExpanded !== this.options.previous.isExpanded)
                    {
                        this.options.defaultCollapsed = this.options.previous.defaultCollapsed = !this.options.isExpanded;
                        this.options.previous.isExpanded = this.options.isExpanded;
                        if (this.options.isExpanded === true)
                        {
                            if (this.options.viewType === "list")
                            {
                                this.element.grid("expand");
                            }
                            else
                            {
                                this.element.panel("expand");
                            }

                        }
                        else
                        {
                            if (this.options.viewType === "list")
                            {
                                this.element.grid("collapse");
                            }
                            else
                            {
                                this.element.panel("collapse");
                            }
                        }

                    }

                    if (this.options.defaultCollapsed !== this.options.previous.defaultCollapsed)
                    {
                        this.options.isExpanded = this.options.previous.isExpanded = !this.options.defaultCollapsed;
                        this.options.previous.defaultCollapsed = this.options.defaultCollapsed;
                        if (this.options.defaultCollapsed === true)
                        {
                            if (this.options.viewType === "list")
                            {
                                this.element.grid("collapse", false);
                            }
                            else
                            {
                                this.element.panel("collapse", false);
                            }
                        }
                        else
                        {
                            if (this.options.viewType === "list")
                            {
                                this.element.grid("expand", false);
                            }
                            else
                            {
                                this.element.panel("expand", false);
                            }
                        }

                    }

                    this.base.applyChanges.apply(this, arguments);

                    if (this.options.isVisible !== this.options.previous.isVisible
                        || this.options.isParentVisible !== this.options.previous.isParentVisible
                        || this.options.defaultCollapsed !== this.options.previous.defaultCollapsed
                        || this.options.isExpanded !== this.options.previous.isExpanded)
                    {
                        refreshFormPadding({ panelID: this.options.fullId });
                        if (this.options.viewType === "list")
                        {
                            this.element.grid("runtimeSyncColumns");
                            this.element.grid("synccolumns"); //when list view area item is hidden, px widths cannot be calculated properly in grid for column headers. Have to call synccolumns to ensure syncWidths is called after view is visible again to correctly set column header widths
                        }

                        this._setAllChildControlsProperties("isParentVisible", this.options.isVisible && this.options.isParentVisible);
                    }
                },

                _applyHeaderClickHandler: function (headerElement)
                {
                    if (!checkExists(headerElement) || headerElement.length === 0)
                    {
                        headerElement = this.element.find(this.options.headerSelector).eq(0);

                        if (headerElement.length === 0)
                        {
                            return;
                        }
                    }

                    var self = this;

                    $("a", headerElement).off("click").on("click", function (event)
                    {
                        if (self.options.isExpanded === true)
                        {
                            self.options.isExpanded = false;
                        }
                        else if (self.options.isExpanded === false)
                        {
                            self.options.isExpanded = true;
                        }
                        event.stopPropagation();
                        self.applyChanges();
                    });
                },

                _optionValueConverter: function (key, value)
                {
                    key = key.toLowerCase();
                    switch (key)
                    {
                        case 'defaultcollapsed':
                        case 'iscollapsible':
                            value = this._booleanConverter(value);
                            break;
                        default:
                            value = this.base._optionValueConverter(key, value);
                            break;
                    }
                    return value;
                },

                _optionNameTransformer: function (key)
                {
                    var lowercaseKey = key.toLowerCase();
                    var returnValue = null;
                    switch (lowercaseKey)
                    {
                        case "title":
                            returnValue = "title";
                            break;
                        case "iscollapsible":
                            returnValue = "isCollapsible";
                            break;
                        case "defaultcollapsed":
                            returnValue = "defaultCollapsed";
                            break;
                        case "isexpanded":
                            returnValue = "isExpanded";
                            break;
                        case "controlname":
                            returnValue = "controlName";
                            break;
                        case "width":
                            if (checkExists(this.element))
                            {
                                this.options.width = this.element.width();
                            }
                            returnValue = "width";
                            break;
                        case "height":
                            if (checkExists(this.element))
                            {
                                this.options.height = this.element.height();
                            }
                            returnValue = "height";
                            break;
                        default:
                            returnValue = this.base._optionNameTransformer(lowercaseKey);
                            break;
                    }
                    return returnValue;
                },

                _setAllChildControlsProperties: function (property, value)
                {
                    var controls = this._getControls();
                    var i = controls.length;
                    while (i--)
                    {
                        var currentControl = controls[i];
                        var id = currentControl.getAttribute("ID");
                        var objInfo = new PopulateObject(null, value, id, property);
                        executeControlFunction(currentControl, "SetProperty", objInfo);
                    }
                },

                _getControls: function ()
                {
                    //TODO 500220 re-visit composite control properties TFS 
                    //add a attribute to the control properties ChildControlPropertyID
                    //use the layout type to identifiy composite controls
                    //move the settting of child properties to runtime 
                    //investigate removal of the isParent implementation
                    if (!checkExists(this.options.childControlNodes))
                    {
                        this.options.childControlNodes = [];
                        var viewNode = viewControllerDefinition.selectSingleNode("Controllers/Controller[@MainTable='{0}']".format(this.options.fullId));
                        var typeOfView = viewNode.getAttribute("TypeView").toUpperCase();
                        if (typeOfView === "LIST")
                        {
                            //this block will not work correctly with tables inside the toolbar table
                            this.options.childControlNodes = viewNode.selectNodes("Controls/Control");
                        }
                        else
                        {
                            //This is an item view and it has two main tables we need to provide logic to set
                            var tables = this.element.find("table");
                            var gridTableControlSelector = ".SourceCode-Forms-Controls-Web-Table";
                            var gridTables = this.element.find(gridTableControlSelector);
                            for (var i = 0; i < gridTables.length; i++)
                            {
                                tables.push(gridTables[i]);
                            }
                            var j = tables.length;
                            while (j--)
                            {
                                var currentTable = tables[j];
                                var jqCurrentTable = $(currentTable);
                                //if this table is directly under the view it has no parent tables
                                if (jqCurrentTable.parent().closest("table").length === 0 && jqCurrentTable.parent().closest(gridTableControlSelector).length === 0)
                                {
                                    var tableID = currentTable.id;
                                    //if _Table is not in the id its not the main table but a toolbar table
                                    if (tableID.indexOf("_Table") < 0) // this will only be possible for the html "table" option
                                    {
                                        //toolbar table controls (epic failure on this side)
                                        //We must fire the table's logic to find controls not inside subtables / inside control tables inside the toolbar table
                                        //This is because the toolbar table has no widget
                                        var controlsFullList = jqCurrentTable.find('*[id]');
                                        var foundControls = [];
                                        i = controlsFullList.length;
                                        while (i--)
                                        {
                                            var currentControl = controlsFullList[i];
                                            var jqCurrentControl = $(currentControl);
                                            var currentControlID = "";

                                            //Extract only usable ID from attribute and only populate currentId if the ID 
                                            //Adheres to the length of a controlID (eliminate cols, rows and cells)
                                            //Ignore table control parents within the toolbar area since they will be handled individually
                                            if (currentControl.id.length >= 73 && $(currentControl).parent().closest(gridTableControlSelector).length === 0)
                                            {
                                                currentControlID = currentControl.id.substring(0, 73);
                                                if (foundControls.indexOf(currentControlID) < 0 && currentControl.id.indexOf("rtSearchConfig") === -1 && currentControl.id.indexOf("ClientState") === -1)
                                                {
                                                    //only match controls corresponding this table level
                                                    var closestTable = jqCurrentControl.parent().closest("table");
                                                    while (closestTable.length > 0 && closestTable[0].id !== tableID && closestTable[0].id.indexOf("_Table") !== 73)
                                                    {
                                                        closestTable = closestTable.parent().closest("table");
                                                    }
                                                    if (closestTable.length > 0 && closestTable[0].id === tableID)
                                                    {
                                                        if (checkExistsNotEmpty(viewNode.selectSingleNode("Controls/Control[@ID='{0}']".format(currentControlID))))
                                                        {
                                                            this.options.childControlNodes.push(viewNode.selectSingleNode("Controls/Control[@ID='{0}']".format(currentControlID)));
                                                            foundControls.push(currentControlID);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        //main table control push it in its widget will handle its child controls correctly
                                        tableID = currentTable.id.replace("_Table", "");
                                        if (checkExistsNotEmpty(viewNode.selectSingleNode("Controls/Control[@ID='{0}']".format(tableID))))
                                        {
                                            this.options.childControlNodes.push(viewNode.selectSingleNode("Controls/Control[@ID='{0}']".format(tableID)));
                                        }

                                    }
                                }
                            }
                        }
                    }
                    return this.options.childControlNodes;
                },

                //used with loadState and saveState to provide a whitelist of options to load or save
                _isSerializableProperty: function (key, stateObject)
                {
                    var serializableOptions =
                    {
                        //all values must be true
                        title: true,
                        isCollapsible: true,
                        defaultCollapsed: true
                    };
                    return serializableOptions[key] === true || this.base._isSerializableProperty(key, stateObject);
                },

                _getFilterControlPrefixId: function ()
                {
                    return ((this.options.id !== "") ? this.options.id + "_" : _runtimeEmptyGuid + "_") + this.options.viewId;
                },

                _saveViewFilterToolbarStateData: function ()
                {
                    var returnData = {};

                    var filterControlPrefixId = this._getFilterControlPrefixId();

                    if (checkExists(this.options.viewId))
                    {
                        var filterDropdown = document.getElementById(filterControlPrefixId + "_selectedFilterDdl");
                        if (checkExists(filterDropdown))
                        {
                            var selectedFilter = $(filterDropdown).dropdown().dropdown("SelectedValue"); //initialization only for unit tests
                            if (checkExistsNotEmpty(selectedFilter))
                            {
                                returnData.selectedFilter = selectedFilter;
                            }
                        };
                        var currentTextBox = document.getElementById(filterControlPrefixId + "_quickSearchTxt");
                        if (checkExists(currentTextBox))
                        {
                            returnData.filterValue = currentTextBox.value;
                        }

                        var currentDropdown = document.getElementById(filterControlPrefixId + "_quickSearchDdl");
                        if (checkExists(currentDropdown))
                        {
                            var quickSearchFieldId = $(currentDropdown).dropdown().dropdown("SelectedValue"); //initialization only for unit tests
                            if (checkExistsNotEmpty(quickSearchFieldId))
                            {
                                returnData.fieldID = quickSearchFieldId;
                            }
                        }
                    }

                    if (Object.keys(returnData).length === 0)
                    {
                        returnData = null;
                    }

                    return returnData;
                },

                _loadViewFilterToolbarStateData: function (filterToolbarData)
                {
                    if (!checkExists(filterToolbarData))
                    {
                        return;
                    }
                    var filterControlPrefixId = this._getFilterControlPrefixId();

                    if (checkExists(filterToolbarData.selectedFilter))
                    {
                        var filterDropdown = document.getElementById(filterControlPrefixId + "_selectedFilterDdl");
                        if (checkExists(filterDropdown))
                        {
                            $(filterDropdown).dropdown().dropdown("SelectedValue", filterToolbarData.selectedFilter);//initialization only for unit tests
                        }
                    }

                    if (checkExists(filterToolbarData.filterValue))
                    {
                        var currentTextBox = document.getElementById(filterControlPrefixId + "_quickSearchTxt");
                        if (checkExists(currentTextBox))
                        {
                            currentTextBox.value = filterToolbarData.filterValue;
                        }
                    }

                    if (checkExists(filterToolbarData.fieldID))
                    {
                        var currentDropdown = document.getElementById(filterControlPrefixId + "_quickSearchDdl");
                        if (checkExists(currentDropdown))
                        {
                            $(currentDropdown).dropdown().dropdown("SelectedValue", filterToolbarData.fieldID);//initialization only for unit tests
                        }
                    }
                },

                // Loads the current control state from a JSON object
                // A generic implementation that can only be used when all values exist in options and load order does not cause issues
                loadState: function (stateObject)
                {
                    var validatedStateObject = {};
                    for (name in stateObject)
                    {
                        if (this._isSerializableProperty(name, stateObject))
                        {
                            validatedStateObject[name] = stateObject[name];
                        }
                    }
                    this.option(validatedStateObject);

                    if (this.options.viewType === "list" && stateObject.grid)
                    {
                        SFRGrid.execute({ element: this.element, fn: "loadState", params: [stateObject.grid.stateData] });
                        SFR._applyGridAttributesFromDraft({ windowToUse: window, gridElement: this.element, attributes: stateObject.grid.attributes });
                        SFR._applyGridRowsFromDraft({ windowToUse: window, gridId: this.options.fullId, viewId: this.options.viewId, instanceId: this.options.id });
                        this._loadViewFilterToolbarStateData(stateObject.grid.filterToolbarData);
                    }
                },

                // Returns a JSON object representing the control's state
                // A generic implementation that can only be used when all values exist in options and load order does not cause issues
                saveState: function ()
                {
                    var state = this._cloneSerializableOptions();
                    if (this.options.viewType === "list")
                    {
                        state.grid = {};
                        state.grid.attributes = SFR._getSerializedGridAttributes({ gridElement: this.element });
                        state.grid.stateData = SFRGrid.execute({ element: this.element, fn: "saveState" });
                        var filterToolbarData = this._saveViewFilterToolbarStateData();
                        if (checkExists(filterToolbarData))
                        {
                            state.grid.filterToolbarData = filterToolbarData;
                        }
                    }
                    return state;
                }
            });

        $.sfc.SFCAreaItem.prototype.base = $.sfc.baseWidget.prototype;

        $('.view>.innerpanel>.panel, .view>.innerpanel>.grid, .runtime-content>.panel, .runtime-content>.grid').each(function (i, element)
        {
            $(element).SFCAreaItem();
        });
    });
})($);
