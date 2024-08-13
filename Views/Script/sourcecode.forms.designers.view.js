/* global SourceCode: true */
/* global Resources: false */
/* global parseXML: false */
/* global checkExists: false */
/* global checkExistsNotEmpty: false */
/* global $chk: false */

(function ($)
{
    // NOTE: "CaptureList" is actually the "List" type.  
    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};

    var ViewType = SourceCode.Forms.Designers.ViewType =
        {
            ItemView: "Capture",
            ListView: "CaptureList"
        };

    var _view = SourceCode.Forms.Designers.View = {

        //Data Model
        selectedObject: null,
        viewDefinitionXML: null,
        controlPropertiesXML: null,
        viewActionsListTable: null,
        isOnFinishStep: false,
        SelectedViewType: null,
        isLayoutTableGenerated: false,
        isSmartObjectLoaded: false,
        SelectedControlTab: 0,
        isViewChanged: false,
        changeToControl: 'none',
        viewExpressionListTable: null,
        isControlEvent: true,
        SelectedEditorTab: 0,
        isViewEventsLoaded: false,
        isViewEventsLoading: false,
        controlsPerDataTypeXML: null,
        propertyGrid: null,
        categoryTree: null,
        smartObjectTree: null,
        //viewEventsTree: null,
        viewEventsGrid: null,
        OriginalViewName: null,
        OriginalViewDisplayName: null,
        OriginalViewCategoryId: null,
        isCellSizing: false,
        isControlSizing: false,
        AutoGenerateMethodsList: [],
        isReadOnlyView: 'false',
        SelectedSmartObjectGuid: null,
        SelectedFinishType: null,
        SelectedCategoryId: null,
        SelectedCategoryPath: null,
        IsViewEdit: false,
        hiddenAssociationXml: null,
        hiddenSmartObjectXml: null,
        popupConfirmation: null,
        container: null,
        viewSettingsXmlDoc: null,
        PreviousSelectedViewType: null,
        viewXPath: 'SourceCode.Forms/Views/View',
        hasEnableListEditingChanged: null,
        hasEditSingleAllRowsChanged: null,
        hasViewTypeChanged: false,
        validationPatternsCache: null,
        applyGetListMethod: false,
        skipInitEditableListViewEditEventBuilding: null,

        filterWidgetXml: null,
        orderWidgetXml: null,

        formPage: null,
        toPage: null,

        isConfiguringForEdit: null,

        //view details
        id: null,         //the view id
        categoryId: null, //the view's categoryId

        //Controls
        element: null, //the viewDesigner outermost element.
        editorpanelcontainer: null, //depricated: outer container for the toolbars and main canvas. Mostly used for adding a modalizer when loading.
        editorpanel: null, //container for the toolbars and main canvas.
        canvas: null, //the canvas element which directly contains the controls/table of the view, (ViewEditorCanvas)
        txtName: null, //on general step
        txtDescription: null, //on general step
        btnCreate: null, //on general step
        smoLookup: null,  //on general step
        catLookup: null,  //on general step
        ddlistmethod: null, //on general step
        chkrefreshlist: null, //on general step
        searchControl: null, //on rules step
        filterButton: null, //on rules step

        _active: false,

        filtercheckmenu: null,
        filterButton: null,
        currentFilter: null,
        currentGridObject: null,
        NameValuePropertiesCollection: ["ControlName", "Field", "AssociatedControl", "AssociationSO", "AssociationMethod", "OriginalProperty", "ValueProperty"],

        selectedOptions:
            {
                //** Details View settings */

                // Default Table Settings
                ColumnCount: 3, // the amount of columns the main table should be generated with
                RowCount: 3, // the amount of rows the main table should be generated with

                // Auto-Gen: Should the lables be placed left or top of the controls
                LablePlacementLeft: false,
                // Auto-Gen: Should a colon be added to the generated labels
                AddSuffix: false,

                //** List View settings */

                // Auto-Gen: Should the list view be editable
                EnableListEditing: false,

                // Auto-Gen: If true, the user can manipulate all rows at once, then persist.  Otherwise, editing happens on a per row bases
                EditAllRows: true,

                // Auto-Gen: Create a toolbar buttons and associated rule for each setting.
                UserAddRows: false,
                UserEditRows: false,
                UserRemoveRows: false,

                AddMethodName: null,
                EditMethodName: null,
                RemoveMethodName: null,

                // Specifies whether the "Add row..." link should be added at runtime
                EnableAddRowLink: true,

                // If true applies zebra stripes to the list view
                ShadeAlternatingRows: false,
                // If true, will bold all heading cells for each column
                BoldHeadings: false,

                // If true, adds a toolbar above the list view so that the user can filter results
                EnableFiltering: false,
                // If true, adds a toolbar beneath the list view so that the user can page through the results
                EnablePaging: false,
                PagingCount: 10,
                // Auto-Gen: Adds a button and associates the Get List method of the primary source
                AllowUserRefresh: false,
                // If true .... enables multiselect in runtime for views
                Multiselect: true,
                CellContentSelect: false
            },

        // this flag is used to disable the hover visual while we are dragging the column
        isDraggingHeaderColumn: null,

        smartObjectSingleMethodCount: null,

        wizardStep: null,

        // used for index counting when auto-generating controls
        controlTypeIndexes: null,

        // flag to indicate that the view is currently being generated
        isGeneratingView: null,

        // keeps an up to date list of designer table's column and row state for the Item View
        tableArrays: null,

        // keeps track of the last selected tab
        lastSelectedPropertyTab: null,
        config: {
            page: "Views/PartialPage.aspx"
        },

        scripts: [
            "Script/SourceCode.Forms.DropTextBox.js",
            "Script/SourceCode.Forms.GenericMapping.js",
            "Views/Script/sourcecode.forms.designers.view.parameters.js",
            "Views/Script/sourcecode.forms.designers.view.viewdesigner.js",
            "Views/Script/sourcecode.forms.designers.view.ajaxcall.js",
            "Views/Script/sourcecode.forms.designers.view.designertable.js",
            "Views/Script/sourcecode.forms.designers.view.dragdrop.js",
            "Views/Script/sourcecode.forms.designers.view.conditions.js",
            "Views/Script/sourcecode.forms.designers.view.propertygrid.js",
            "Views/Script/sourcecode.forms.designers.view.styles.js",
            "Views/Script/sourcecode.forms.designers.view.checkout.js",
            "Script/jquery.forms.controls.customdropdown.js",
            "Script/jquery.forms.controls.dynamicstyledropdown.js",
            "Script/jquery.forms.controls.expander.js",
            "Script/jquery.forms.widget.button.js",
            "Script/SourceCode.Forms.ServerTabControl.js",
            "Script/SourceCode.Forms.StyleBuilder.js",
            "Script/SourceCode.Forms.ConditionalFormatting.js",
            "Script/Sourcecode.Forms.DesignRenderHelper.js",
            "Script/jpicker-1.1.2.js",

            "Rules/Script/ConfigurationWidget.js",
            "Views/Script/ViewSettingsFilterWidget.js",
            "Views/Script/ViewSettingsOrderWidget.js",
            "Views/Script/AutoGenerateViewPopup.js",
            "Views/Script/ViewSettingsPopup.js",

            "Script/StackTrace.js"
        ],

        styles: [
            "Views/Styles/{0}/CSS/wizard.css",
            "Rules/Styles/{0}/CSS/wizardcontainer.css",
            "StyleBuilder/Styles/{0}/CSS/StyleBuilder.css",
            "StyleBuilder/Styles/{0}/CSS/jPicker.css",
            "StyleBuilder/Styles/{0}/CSS/jPicker-1.1.2.css"
        ],

        initialized: false,

        wizardStepMapping: [],

        // wizard step names
        introStep: "intro",
        generalStep: "general",
        layoutStep: "layout",
        parametersStep: "parameters",
        rulesStep: "rules",
        summaryStep: "summary",
        finishStep: "finished",

        INTRO_STEP_INDEX: -1,//not being used any more!
        GENERAL_STEP_INDEX: 0,
        LAYOUT_STEP_INDEX: 1,
        PARAMS_STEP_INDEX: 2,
        RULES_STEP_INDEX: 3,
        SUMMARY_STEP_INDEX: 4,
        FINISH_STEP_INDEX: 5,
        SETTINGS_STEP_INDEX: 100, //LG: This seems to be an old, deprecated step.

        // clone fragment to re-insert when layout is cleared
        tableLayoutOptions: null,

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // Called when the user tries to update the name of this file from outside (context menu, filetab, etc)
        updateName: function (name)
        {
            this.txtName.val(name);

            //Enabled or disable Create button
            this.ViewDesigner._doViewNameValidation();

            //This is to raise an onchange event to clear the watermark
            this.txtName.trigger("change");
        },

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // Called to determine if this designer active, and so needs to be closed before anpther can be opened
        isShowing: function ()
        {
            return this._active === true;
        },

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // Called before cleanup
        close: function (callback)
        {
            if (checkExists(this.element))
            {
                //LG: Reset the intro.
                $.event.trigger({ type: "appstudio.designer.unloading", fileInfo: this._getFileInfo() }, null, document);
                this.element.addClassTransition("intro", function ()
                {
                    if (typeof callback === "function") callback();
                }, "#ViewDesigner");
            }
            else
            {
                if (typeof callback === "function") callback();
            }
        },

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // cleanup
        cleanup: function ()
        {
            $(document).off('keydown.View');

            $(".editor-table").off();

            //LG: Reset the intro.
            _view.container.addClass("intro");

            _view._clearObject();

            var jq_autogenFieldsTable = $('#autogenFieldsTable');
            if (jq_autogenFieldsTable.length > 0)
            {
                var tableRows = jq_autogenFieldsTable.find(">tbody>tr");
                if (tableRows.length > 1)
                {
                    for (var t = 1; t < tableRows.length; t++)
                    {
                        $(tableRows[t]).remove();
                    }
                }
            }

            _view.AJAXCall._clearFormsMethodOptions();

            $(document.getElementById('ViewDesigner')).off().empty();

            if (checkExists(_view.wizard) && _view.wizard.isWidget("wizard"))
            {
                _view.wizard.wizard('destroy');
            }

            $(document.getElementById('hiddenViewDataXml')).add(document.getElementById('hiddenViewSettings')).add(document.getElementById('divPropertyGrid')).add(document.getElementById('divComplexProperty')).add(document.getElementById('divChangeControl')).add(document.getElementById('divCellProperties')).add(document.getElementById('divCanvasProperties')).add(document.getElementById('divConditionsMapping')).add(document.getElementById('divControlCalculation')).add(document.getElementById('viewExpressionListTable')).remove();

            // remove window object listener events
            $(window).off("resize.ViewDesigner");

            _view._active = false;
            _view.wizard = null;
            _view.wizardStep = null;

            AutoGenerateViewPopup.cleanUp();
            ViewSettingsPopup.cleanUp();
            _view.ParametersPage._cleanUp();
        },

        //_addStyles
        _addStyles: function ()
        {
            var _styleCount = this.styles.length;

            while (_styleCount-- > 0)
            {
                var style = this.styles.shift();
                style = style.replace("{0}", k2.stylePath);
                $.addStylesheet(style);
            }
        },

        _addscripts: function (callback)
        {
            var _designer = _view;

            var _scripts = this.scripts;
            if (!!_scripts.length)
            {
                $.addScript(applicationRoot.concat(_scripts.shift()), function (script)
                {
                    this._addscripts(callback);
                }.bind(this));

                return;
            }

            this.controlTypeIndexes = [];

            // store clone of the layout generation settings
            if (!checkExists(this.tableLayoutOptions))
            {
                this.tableLayoutOptions = $("#tableLayoutOptions").clone();
            }

            this._registerObjects();
            this._postload(callback);
        },

        init: function (id, categoryId, contextId, callback, container)
        {
            //setting context for shared functions
            SourceCode.Forms.Designers.Common.SetContext(SourceCode.Forms.Designers.Common.View);

            this._container = container;
            // Theming Core added
            $.addStylesheet("Styles/Themes/Core.css");

            // Add default platinum theme
            var defaultTheme = "Platinum";
            $.addStylesheet("Styles/Themes/Platinum.css", { id: defaultTheme });
            $.addStylesheet("Utilities/AJAXCall.ashx?method=GetThemeCssForControls&theme=" + defaultTheme, { id: defaultTheme + "/Controls" }, this._stylesheetLoaded);
            $.switchstyle(defaultTheme);

            id = id || "";
            categoryId = categoryId || "";
            contextId = contextId || "";

            SourceCode.Forms.Designers.View.ContructDateTypeSet = {};

            //ensure the ViewDesginer container is added to the DOM.
            if ($("#ViewDesigner").length === 0)
                this.element = this.container = $('<div id="ViewDesigner" class="wrapper intro"></div>').appendTo(this.getContainerContent());


            //build the url for the request of the view's html.
            var _url = 'Views/PartialPage.aspx';
            this.IsViewEdit = id !== "";
            this.id = id;
            this.categoryId = categoryId;

            //the data passed into the request is used in /Views/PartialPage.aspx.cs
            var data = {
                id: id,
                categoryid: categoryId,
                contextid: contextId
            };

            // Sharepoint origurl transfer when editing a view from the form designer.
            var hash = SourceCode.Forms.Interfaces.AppStudio._getDocumentLocationHashObject();
            var origUrlHash = hash["origurl"];

            if (checkExistsNotEmpty(origUrlHash) && origUrlHash.test(stringRegularExpressions.isValidWebURLScheme))
            {
                data.origurl = origUrlHash;
            }

            //show the overlay before loading.
            this.getContainerContent().overlay({ modal: true, icon: "loading", classes: "designer-loader" });

            this.element.siblings().hide();
            this.element.empty();
            this.element.load(_url + " .partial-page-container", data, function (responseText, textStatus, XMLHttpRequest)
            {
                this._mainContentLoaded(responseText, textStatus, XMLHttpRequest, callback);

            }.bind(this));

            SourceCode.Forms.Designers.init();
        },

        getContainerContent: function ()
        {
            return this._container;
        },

        //view html has loaded (could be in error)
        _mainContentLoaded: function (responseText, textStatus, XMLHttpRequest, callback)
        {
            if ($("#ViewWizard").length === 0) return this._mainContentLoaded_Error(responseText, textStatus, XMLHttpRequest, callback);

            //set up main controls
            this.editorpanelcontainer = this.element.find("#editorCanvasPane"); //Deprecated: holds the toolbars and main this.canvas
            this.editorpanel = this.element.find("#editorCanvasPane_EditorCanvas"); //holds the toolbars and main this.canvas
            this.canvas = this.element.find("#editorCanvasPane_ViewEditorCanvas"); //viewdesigner.js changes the overflow on this element.

            this._addStyles();

            this._addscripts(function ()
            {
                this.getContainerContent().removeOverlay();
                if (typeof callback === "function")
                {
                    callback();
                }

                var _common = SourceCode.Forms.Designers.Common;
                SourceCode.Forms.Utilities.performance.debounce(
                    function () { _common.triggerEvent("CanvasLoaded"); }.bind(_common), { thisContext: _common, delay: 100 }
                );
                this.initialized = true;                
            }.bind(this));

        },

        //if there is an error loading the view.
        _mainContentLoaded_Error: function (responseText, textStatus, XMLHttpRequest, callback)
        {
            var _viewDesigner = this.element;
            
            //make sure the error message has the id of the view.
            var objects = [];
            objects.push([this.id, "view"]);

            _viewDesigner.removeOverlay();
            _viewDesigner.find('.pane-container').panecontainer();
            SourceCode.Forms.Interfaces.AppStudio._showPropertyError(objects, this.categoryId);
            this.getContainerContent().removeOverlay();
            this.element.removeClass("intro");

            return;
        },

        //init the general step - any click handlers etc
        _initGeneral: function ()
        {
            this.txtName = this.element.find('#vdtxtViewName');
            this.btnCreate = this.element.find("#CreateForm").k2button();
            this.btnDiscard = this.element.find("#DiscardFile").k2button();
            this.btnCreate.on("click", this._btnCreate_Click.bind(this));
            this.btnDiscard.on("click", this._btnDiscard_Click.bind(this));

            if (this.IsViewEdit)
            {
                this.btnCreate.hide();
                this.btnDiscard.hide();
            }
            else
            {
                this.btnCreate.show();
                this.btnDiscard.show();
            }
        },

        //init the rules step - any click handlers etc
        _initRules: function ()
        {
            this.rulesSearchBar = this.element.find(".vdrw-search-wrapper");
            this.filterButton = this.rulesSearchBar.find("#vdrwRulesFilterBtn");
            this.searchControl = this.rulesSearchBar.find(".input-control.search-box").searchbox({
                onCancel: this._rulesSearch_onCancel.bind(this),
                onSearch: this._rulesSearch_onSearch.bind(this)
            }).data("ui-searchbox");
        },

        //delegate from the searchbox control to perform a search
        _rulesSearch_onSearch: function (e)
        {
            this._rulesSearch_onChange(e);
            this._searchButtonClicked(e);
        },

        //delegate from the searchbox control to cancel a search
        _rulesSearch_onCancel: function (e)
        {
            this._clearSearchButtonClicked(e);
        },

        _rulesSearch_onChange: function (e)
        {
            //originally from onkeypress event
            $('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
            $('#toolEditAction, #toolRemoveAction').addClass('disabled');
        },


        stopCancelEvent: function ()
        {
            if (!_view.selectedObject) { return false; } else return true;
        },

        _loadConfiguredListMethods: function ()
        {
            var viewId = _view.ViewDesigner._GetViewID();

            var eventCriteria = "[@Type='User' and @SourceType='View' and @SourceID='{0}' and Name='Init']".format(viewId);

            var propertyTemplate = "Properties/Property[Name='{0}']";
            var propertyValueTemplate = "Properties/Property[Name='{0}' and Value='{1}']";
            var notTemplate = "not({0})";

            var methodCriteria = propertyTemplate.format("Method");
            var controlCriteria = notTemplate.format(propertyTemplate.format("ControlID"));
            var objectCriteria = notTemplate.format(propertyTemplate.format("ObjectID"));
            var viewIdCriteria = propertyValueTemplate.format("ViewID", viewId);
            var locationCriteria = propertyValueTemplate.format("Location", "View");

            var actionCriteria = "[@Type='Execute' and ({0}) and ({1}) and ({2}) and ({3}) and ({4})]".format(methodCriteria, controlCriteria, objectCriteria, viewIdCriteria, locationCriteria);

            var xpath = "Views/View/Events/Event{0}/Handlers/Handler/Actions/Action{1}/Properties/Property[Name='Method']/Value".format(eventCriteria, actionCriteria);
            var nodes = _view.viewDefinitionXML.documentElement.selectNodes(xpath);
            var results = [];

            //filter to only find list methods not all view methods
            for (var i = 0; i < nodes.length; i++)
            {
                var currentNode = nodes[i];
                if (_view.ViewDesigner.listMethods[currentNode.text])
                {
                    results.push(nodes[i]);
                }
            }
            return results;
        },

        _setListMethodStateForDetailsStep: function (disabled)
        {
            var listViewGeneralStepMethodControlsDisabled = _view.element.find("#ListViewGeneralStepMethodControlsDisabled");
            var vdlbl_listViewGetListMethod = _view.element.find("#vdlbl_listViewGetListMethod");
            var vdlistViewGetListMethod = _view.ddlistmethod;
            var vdrefreshListChkbox = _view.element.find('#vdrefreshListChkbox');

            if (disabled)
            {
                _view.ddlistmethod.dropdown("disable");
                vdrefreshListChkbox.checkbox("disable");
                listViewGeneralStepMethodControlsDisabled.removeClass("hidden");
                vdlbl_listViewGetListMethod.addClass("hidden-label");
                _view.ViewDesigner.multipleListMethodsDetected = true;
            }
            else
            {
                _view.ddlistmethod.dropdown("enable");
                vdrefreshListChkbox.checkbox("enable");
                listViewGeneralStepMethodControlsDisabled.addClass("hidden");
                vdlbl_listViewGetListMethod.removeClass("hidden-label");
                _view.ViewDesigner.multipleListMethodsDetected = false;
            }
        },

        _loadConfiguredListMethodForDetailsStep: function (viewType)
        {
            if (viewType === SourceCode.Forms.Designers.ViewType.ListView && _view.layoutExists())
            {
                var indeterminateState = false;

                var methods = _view._loadConfiguredListMethods();

                var vdlistViewGetListMethod = _view.ddlistmethod;
                var vdrefreshListChkbox = _view.chkrefreshlist;

                if (methods.length > 0)
                {
                    var currentMethod = methods[0].text;
                    for (var i = 0; i < methods.length && !indeterminateState; i++)
                    {
                        if (currentMethod !== methods[i].text)
                        {
                            indeterminateState = true;
                        }
                    }

                    _view.ddlistmethod.dropdown("SelectedValue", currentMethod);

                    if (methods.length > 1)
                    {
                        if (indeterminateState)
                        {
                            _view.ddlistmethod.dropdown("SelectValueAtIndex", -1);
                            _view.ddlistmethod.dropdown("refreshDisplay");
                        }
                        _view._setListMethodStateForDetailsStep(true);
                        _view.chkrefreshlist.checkbox("uncheck");
                    }
                    else
                    {
                        // configure method and checkbox here
                        _view._setListMethodStateForDetailsStep(false);
                        _view.chkrefreshlist.checkbox("check");
                    }
                }
                else
                {
                    // no rules = not configured
                    _view._setListMethodStateForDetailsStep(false);
                    _view.chkrefreshlist.checkbox("uncheck");
                }
            }
        },

        //Wizard delegate: called when the wizard's next/prev or step is clicked in step tree.
        _navigate: function (ev, nav)
        {
            // selected view type
            var viewType = _view.ViewDesigner._getViewType();
            var fromStep = _view.wizard.wizard("getStepName", nav.from);
            var toStep = _view.wizard.wizard("getStepName", nav.to);

            if (_view.hasViewTypeChanged === true)
            {
                _view.ViewDesigner._ClearViewControlProperties();
                _view.ViewDesigner._clearViewEvents();
                _view.ViewDesigner._ClearViewFields();

                //LG: I've commented these, as they are just getters
                //but they don't do anything with the return value.
                //_view.ViewDesigner._getViewListControls();
                //_view.ViewDesigner._getViewMethods();
                //_view.ViewDesigner._GetViewName();
                //_view.ViewDesigner._getViewObjects();

                _view.element.find("#toolbarSection").empty();
                _view.element.find("#bodySection").empty();
                _view.element.find("#editableSection").empty();

                _view._initializeToolbarLayoutOptions(true);
                _view.hasViewTypeChanged = false;
            }

            // we need to call BuildViewXml here again to ensure that if the user
            // has enabled or changed the Get List method, the action must be regenerated
            if (_view.layoutExists() && fromStep === _view.generalStep)
            {
                _view.ViewDesigner._BuildViewXML();
            }

            if (arguments[1].to !== 7)
            {
                _view.wizardStep = nav.to;
                switch (nav.from)
                {
                    case _view.GENERAL_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ViewDesigner._hideDetails();

                                _view.ViewDesigner._setViewSmoIdAttribute();

                                if ($("#tableLayoutOptions").length === 0)
                                {
                                    _view._initializeToolbarLayoutOptions();
                                }

                                _view._toggleGenerateOption();

                                break;
                        }
                        break;
                    case _view.LAYOUT_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                if (viewType === 'CaptureList')
                                {
                                    _view.hasEnableListEditingChanged = false;
                                    _view.hasEditSingleAllRowsChanged = false;
                                }
                                _view.ViewDesigner._hideViewCanvas();

                                break;
                        }
                        break;
                    case _view.PARAMS_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ParametersPage.deactivate();
                                break;
                        }
                        break;
                    default:
                        break;
                }

                switch (nav.to)
                {
                    case _view.GENERAL_STEP_INDEX:
                        _view.ViewDesigner._showDetails();
                        break;

                    case _view.LAYOUT_STEP_INDEX:
                        var step = _view.GENERAL_STEP_INDEX;
                        if (arguments[1].from > arguments[1].to)
                            step = -1;

                        _view.PreviousSelectedViewType = viewType;
                        _view.DragDrop.isDropping = false;

                        if (!checkExistsNotEmpty($("#vdsmartObjectID").val()))
                        {
                            $("#rowAutoGenerate").hide();
                        }
                        else
                        {
                            $("#rowAutoGenerate").show();
                        }

                        if (!_view.layoutExists())
                        {
                            _view._setCanvasEmpty();
                        }

                        //[895427] This function should be called after _BuildViewXML() been called like above.
                        //Table Controls may have empty cells that are injected to the definition due dirty data issue (Not well-formed Table due to merge of cells), 
                        //however those empty cells won't have corresponding Control defintion yet as update script won't inject the Control definition for these empty cells.  
                        //Calling _BuildViewXML() will create the Control definition for these empty cells for the ViewDefinition object. 
                        _view._configureDesignerTables();

                        //Canvas Step
                        switch (viewType)
                        {
                            case 'Capture':
                                _view.ViewDesigner._showCaptureViewCanvas(step);
                                break;

                            case 'CaptureList':
                                _view.ViewDesigner._showCaptureListViewCanvas(step);
                                break;
                        }

                        if (checkExistsNotEmpty(_view.SelectedSmartObjectGuid))
                        {
                            $("#divAutoGenerateOption").show();
                        }
                        else
                        {
                            $("#divAutoGenerateOption").hide();
                        }

                        var canvas = _view.canvas.parent();
                        _view._initToolbar();
                        _view.ViewDesigner._updateViewName(_view.txtName.val());
                        _view.ViewDesigner._configurePropertiesTab(canvas);
                        _view.ViewDesigner._configSelectedControl(canvas.find("[controltype='View']"));
                        SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                        //TFS 720744 & 731081
                        SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdToolboxPane");

                        SourceCode.Forms.Designers.Common.triggerEvent("CanvasDisplayed");
                        break;
                    case _view.PARAMS_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ParametersPage.activate();
                                break;
                        }

                        break;
                    case _view.RULES_STEP_INDEX:
                        $("#pgRuleList").find(".grid-column-headers").remove();

                        var grid = _view._getTargetGrid();

                        _view.filterButton = _view.element.find("#vdrwRulesFilterBtn");

                        _view.filtercheckmenu = _view.filterButton.filtercheckmenu({
                            checkedChanged: _view._changeFilterCheckMenu.bind(_view)
                        });

                        var _filters = SourceCode.Forms.Designers.Common.Rules.getFilters();

                        _view._updateFilterMenu(true, _filters);

                        $("input[type=checkbox][name=RulesFilterSearchScope]").checkbox();

                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.orderWidgetXml = null;
                                _view.filterWidgetXml = null;

                                _view._validateEvents();
                                _view.ViewDesigner._showViewActions(grid);
                                _view.wizard.wizard("disable", "button", "forward");
                                break;
                        }

                        _view._addRuleActions(grid);

                        break;
                }

            }
            else if (nav.to === _view.FINISH_STEP_INDEX)
            {
                _view.wizard.wizard("hidesteptree", nav.to);
            }
            _view.ViewDesigner._configureOptionsStep(nav.to);
        },

        _clickFilterCheckMenu: function (ev)
        {
            $("input[type=checkbox][name=RulesFilterSearchScope]").checkbox();
            if (!_view.filterButton.hasClass("disabled") && !_view.filterButton.hasClass("menu-active"))
            {
                _view.filtercheckmenu.filtercheckmenu("setPaneWidth", $("#AppStudioPC").width(), false);
                _view.filtercheckmenu.filtercheckmenu("showContextMenu", ev);
                _view.filterButton.addClass("menu-active");
            }
        },

        _changeFilterCheckMenu: function (ev)
        {
            var grid = _view._getTargetGrid();
            _view.currentFilter = _view.filtercheckmenu.filtercheckmenu("tag");
            _view.currentGridObject.refresh(grid, _view.viewDefinitionXML, null, _view.searchControl.val(), _view.currentFilter);

            $('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
            $('#toolEditAction, #toolRemoveAction').addClass('disabled');
        },

        _showError: function (message, jqFocusElement)
        {
            if ($chk(jqFocusElement) && jqFocusElement.length > 0)
            {
                popupManager.showError({
                    message: message,
                    onClose: function () { jqFocusElement.trigger("focus"); }
                });
            }
            else
            {
                popupManager.showError(message);
            }
        },

        //Wizard Delegate: validate a single step (on finish, all steps will be validated) 
        _validate: function (stepIndex, callback)
        {
            var viewType = this.ViewDesigner._getViewType();
            var retVal = false;
            var popup;
            var ViewName = this.txtName.val();
            var viewSystemName = "";


            var step = this.wizard.wizard("getStepName", arguments[0]);
            switch (step)
            {
                case this.generalStep:
                    return this._validate_GeneralStep(ViewName, viewType, callback);
                case this.layoutStep:
                    return this._validate_LayoutStep(ViewName, viewType, callback);
                case this.parametersStep:
                    var parameterPageValidateResult = this.ParametersPage.validate(false, true);
                    var result = checkExists(parameterPageValidateResult) && (parameterPageValidateResult == true);
                    if (typeof callback === "function") callback(result);
                    return result;
                case this.rulesStep:
                    var result = !this._validateEvents();
                    if (result == false) this._showError(Resources.ViewDesigner.InvalidEventsMsg);
                    if (typeof callback === "function") callback(result);
                    return result;
                default:
                    if (typeof callback === "function") callback(result);
                    return true;
            }
        },


        _validate_GeneralStep: function (name, type, callback)
        {
            var ViewName = name;
            var ViewType = type;


            //check is the name is empty
            if (name.trim().length === 0)
            {
                this._showError(Resources.ViewDesigner.ValidationViewNameRequired, this.txtName);
                if (typeof callback === "function") callback(false);
                return false;
            }

            var category = _view.catLookup.categorylookup("value");
            var categoryName = category.path;
            var categoryPath = category.path;
            var categoryId = category.catid;

            //Returns Bool: A local function to call
            //Updates all of the view's details for the new name.
            var updateDetails = function ()
            {
                this.OriginalViewDisplayName = ViewName;

                //Verifies the Name is unique
                //LG: wow, is this a bool or a string? noone knows.
                if (this.IsViewEdit !== 'True' && this.IsViewEdit !== 'true' && this.IsViewEdit !== true)
                {
                    //do ajax call to get a unique name
                    viewSystemName = this.AJAXCall._getUniqueViewSystemName(ViewName);
                    this.element.find("#vdViewSystemName").val(viewSystemName);
                }

                if (categoryName || categoryId || categoryPath)
                {
                    this.SelectedCategoryId = parseInt(categoryId, 10);
                    this.SelectedCategoryPath = categoryPath;
                    this.OriginalViewCategoryId = categoryId;
                }

                if (!checkExists(this.SelectedCategoryId))
                {
                    this._showError(Resources.ViewDesigner.ValidationViewCategoryRequired);
                    return false;
                }

                // if smartobject is already selected, if list view designer type is selected, make sure
                // the smartobject has list methods
                if (this.SelectedViewType === "CaptureList" && checkExists(this.SelectedSmartObjectGuid) && checkExists(this.hiddenSmartObjectXml))
                {
                    var xpath = "/smartobject/smartobjectroot/methods/method[@type='list']";
                    var listMethodNodes = this.hiddenSmartObjectXml.selectNodes(xpath);
                    if (!checkExists(listMethodNodes) || listMethodNodes.length === 0)
                    {
                        this._showError(Resources.ViewDesigner.InvalidListDatasource);
                        return false;
                    }
                }

                if (ViewType === "CaptureList")
                {
                    this.applyGetListMethod = true;
                }

                if (this.SelectedViewType === SourceCode.Forms.Designers.ViewType.ListView)
                {
                    if (!checkExistsNotEmpty($("#vdsmartObjectID").val()))
                    {
                        this._showError(Resources.ViewDesigner.SelectDatasource);
                        return false;
                    }
                }

                //update the view's xml with the new name
                _view.ViewDesigner._updateViewName(ViewName);

                return true;
            }.bind(this);

            if (categoryId === undefined)
            {
                categoryId = "";
            }

            //check if name has changed, if its still unique
            if (ViewName !== _view.OriginalViewDisplayName || categoryId !== _view.OriginalViewCategoryId)
            {
                var o = {
                    dataType: "view",
                    method: "isDisplayNameUniqueInCategoryForDataType",
                    categoryId: categoryId,
                    displayNames: ViewName,
                    context: "create"
                };

                $("body").overlay({ modal: true, icon: "loading" });

                var options = {
                    cache: false,
                    data: $.param(o),
                    dataType: "text",
                    url: "Utilities/AJAXCall.ashx",
                    type: "POST",
                    success: function (data)
                    {
                        $("body").removeOverlay();
                        var data = parseXML(data);

                        if (checkExists(SourceCode.Forms.ExceptionHandler.isException) && SourceCode.Forms.ExceptionHandler.isException(data))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(data);
                            return;
                        }

                        if (!checkExists(data.selectSingleNode("result/success")))
                        {
                            var warningNodes = data.selectNodes("result/warning");
                            var warningMessage = (warningNodes.length > 0) ? warningNodes[0].text : "";

                            popupManager.showWarning({
                                headerText: Resources.MessageBox.Warning,
                                message: warningMessage,
                                onClose: function ()
                                {
                                    _view.wizard.wizard("step", _view.wizard.wizard("getStep", _view.generalStep));
                                    _view.txtName.trigger("focus");
                                    if (checkExists(callback) && typeof callback === "function")
                                    {
                                        callback(false);
                                    }
                                }
                            });
                        }
                        else
                        {
                            if (updateDetails())
                            {
                                if (checkExists(callback) && typeof callback === "function")
                                {
                                    callback(true);
                                }
                            }
                        }
                    },
                    error: function (data)
                    {
                        $("body").removeOverlay();
                        if (SourceCode.Forms.ExceptionHandler.handleException(data))
                        {
                            if (checkExists(callback) && typeof callback === "function")
                            {
                                callback(false);
                            }
                            return;
                        }
                    }
                };

                _view._checkViewName(options, false);
            }
            else
            {
                var updateResult = updateDetails();
                if (typeof callback === "function")
                {
                    callback(updateResult);
                }
                return updateResult;
            }

            //if all else fails, it must be valid :)
            return true;

        },

        //Called on Wizard finish
        _validate_LayoutStep: function (name, type, callback)
        {
            var ViewName = name;
            var ViewType = type;

            switch (ViewType)
            {
                case 'Capture':
                case 'CaptureList':
                    this.ViewDesigner._BuildViewXML();
                    break;
            }

            var FaultyExpressions = this.viewDefinitionXML.selectNodes("//Expressions/Expression[@Resolved]");

            if (FaultyExpressions.length > 0)
            {
                var FaultyExpressionID = FaultyExpressions[0].getAttribute("ID");
                var FaultyExpressionName = FaultyExpressions[0].selectSingleNode("Name").text;
                var BoundControlNameNode = this.viewDefinitionXML.selectSingleNode("//Controls/Control[@ExpressionID='" + FaultyExpressionID + "']/Name");
                var message = "";
                if (BoundControlNameNode)
                {
                    var BoundControlName = BoundControlNameNode.text;

                    message = Resources.ExpressionBuilder.ValidationExpressionUnresolvedEntity.replace("{0}", FaultyExpressionName).replace("{1}", BoundControlName);
                }
                else
                {
                    message = Resources.ExpressionBuilder.ValidationExpressionUnresolvedEntityNoBoundControl.replace("{0}", FaultyExpressionName);
                }

                this._showError(message);
                if (checkExists(callback) && typeof callback === "function")
                {
                    callback(false);
                }
                return false;
            }

            var BoundControls = this.viewDefinitionXML.selectNodes("//Controls/Control[@ExpressionID]");

            for (var i = 0, l = BoundControls.length; i < l; i++)
            {
                var ExpressionItems = this.viewDefinitionXML.selectNodes("//Expressions/Expression[@ID='" + BoundControls[i].getAttribute("ExpressionID") + "']//Item[@SourceType='Control'][@SourceID='" + BoundControls[i].getAttribute("ID") + "']");

                if (ExpressionItems.length > 0)
                {
                    var FaultyExpressionName = this.viewDefinitionXML.selectSingleNode("//Expressions/Expression[@ID='" + BoundControls[i].getAttribute("ExpressionID") + "']/Name").text;
                    var BoundControlName = BoundControls[i].selectSingleNode("Name").text;

                    this._showError(Resources.ExpressionBuilder.ValidationCircularReferenceFound.replace("{0}", FaultyExpressionName).replace("{1}", BoundControlName));
                    if (checkExists(callback) && typeof callback === "function")
                    {
                        callback(false);
                    }
                    return false;
                }
            }
            var invalidConditionalStylesControl = this._validateConditionalStyles();
            if (checkExists(invalidConditionalStylesControl))
            {
                var controlName = this.ViewDesigner._getControlPropertyValue(invalidConditionalStylesControl.attr("id"), "ControlName");
                this._showError(Resources.Designers.InvalidControlConditionalStyles.format(controlName));
                if (checkExists(callback) && typeof callback === "function")
                {
                    callback(false);
                }
                return false;
            }

            if (checkExists(callback) && typeof callback === "function")
            {
                callback(true);
            }

            return true;
        },


        _validateConditionalStyles: function ()
        {
            var FaultyConditionalStylesControl = _view.viewDefinitionXML.selectSingleNode("//Controls/Control[ConditionalStyles/ConditionalStyle/Condition[@Resolved]]");

            if (checkExists(FaultyConditionalStylesControl))
            {
                _view.wizard.wizard("step", _view.wizard.wizard("getStep", _view.layoutStep));

                var controlID = FaultyConditionalStylesControl.getAttribute("ID");
                return object = $("#" + controlID);
            }

            return null;
        },

        _checkViewName: function (options, isViewProp)
        {
            if (isViewProp)
            {
                var result = $.ajax(options).responseText;
                return result;
            }
            else
            {
                $.ajax(options);
            }
        },

        _validateEvents: function ()
        {
            var events = _view.viewDefinitionXML.selectNodes("//Events/Event");
            var eventsLength = events.length;
            var invalidEventingExists = false;

            for (var e = 0; e < eventsLength; e++)
            {
                var thisEvent = events[e];
                var eventType = thisEvent.getAttribute("Type");
                var conditions = thisEvent.selectNodes(".//Conditions/Condition");
                var conditionsLength = conditions.length;
                var actions = thisEvent.selectNodes(".//Actions/Action");
                var actionsLength = actions.length;
                var eventInvalid = false;

                for (var c = 0; c < conditionsLength; c++)
                {
                    var condition = conditions[c];
                    var thisConditionActionsLength = condition.selectNodes("../../Actions/Action").length;

                    if (thisConditionActionsLength === 0)
                    {
                        eventInvalid = true;
                        break;
                    }
                }

                if (actionsLength === 0)
                {
                    if (eventType === "User")
                    {
                        eventInvalid = true;
                    }
                    else
                    {
                        thisEvent.parentNode.removeChild(thisEvent);
                        eventInvalid = false;
                    }
                }

                if (eventInvalid === true)
                {
                    var eventDesignProperties = thisEvent.selectSingleNode("DesignProperties");
                    if (!checkExists(eventDesignProperties))
                    {
                        eventDesignProperties = thisEvent.ownerDocument.createElement("DesignProperties");
                        thisEvent.appendChild(eventDesignProperties);
                    }

                    var eventInvalidDesignProperty = eventDesignProperties.selectSingleNode("Property[Name/text()='Invalid']/Value");
                    if (checkExists(eventInvalidDesignProperty))
                    {
                        eventInvalidDesignProperty.parentNode.removeChild(eventInvalidDesignProperty);
                    }

                    eventDesignProperties.appendChild(_view.ViewDesigner._createEventingPropertyWithEncoding(thisEvent.ownerDocument, "Invalid", 'true'));
                }
            }

            invalidEventingExists = checkExists(_view.viewDefinitionXML.selectSingleNode("//Events/Event/DesignProperties/Property[Name ='Invalid' and Value = 'true']/Value"));

            // Check invalid conditions
            if (invalidEventingExists === false)
            {
                invalidEventingExists = checkExists(_view.viewDefinitionXML.selectSingleNode("//Conditions/Condition/DesignProperties/Property[Name ='Invalid' and Value = 'true']/Value"));
            }

            // Check invalid actions
            if (invalidEventingExists === false)
            {
                invalidEventingExists = checkExists(_view.viewDefinitionXML.selectSingleNode("//Actions/Action/DesignProperties/Property[Name ='Invalid' and Value = 'true']/Value"));
            }

            return invalidEventingExists;
        },

        _registerObjects: function ()
        {
            var _view = this;
            _view.ParametersPage.DragDrop = _view.DragDrop;
            _view.ParametersPage.AJAXCall = _view.AJAXCall;
            _view.ParametersPage.DesignerTable = _view.DesignerTable;
            _view.ParametersPage.Conditions = _view.Conditions;
            _view.ParametersPage.Styles = _view.Styles;
            _view.ParametersPage.CheckOut = _view.CheckOut;
            _view.ParametersPage.PropertyGrid = _view.PropertyGrid;
            _view.ParametersPage.View = _view;

            _view.ViewDesigner.DragDrop = _view.DragDrop;
            _view.ViewDesigner.AJAXCall = _view.AJAXCall;
            _view.ViewDesigner.DesignerTable = _view.DesignerTable;
            _view.ViewDesigner.Conditions = _view.Conditions;
            _view.ViewDesigner.Styles = _view.Styles;
            _view.ViewDesigner.CheckOut = _view.CheckOut;
            _view.ViewDesigner.PropertyGrid = _view.PropertyGrid;
            _view.ViewDesigner.ParametersPage = _view.ParametersPage;
            _view.ViewDesigner.View = _view;

            _view.AJAXCall.ViewDesigner = _view.ViewDesigner;
            _view.AJAXCall.DragDrop = _view.DragDrop;
            _view.AJAXCall.DesignerTable = _view.DesignerTable;
            _view.AJAXCall.Conditions = _view.Conditions;
            _view.AJAXCall.Styles = _view.Styles;
            _view.AJAXCall.CheckOut = _view.CheckOut;
            _view.AJAXCall.PropertyGrid = _view.PropertyGrid;
            _view.AJAXCall.ParametersPage = _view.ParametersPage;
            _view.AJAXCall.View = _view;

            _view.DesignerTable.ViewDesigner = _view.ViewDesigner;
            _view.DesignerTable.DragDrop = _view.DragDrop;
            _view.DesignerTable.AJAXCall = _view.AJAXCall;
            _view.DesignerTable.Conditions = _view.Conditions;
            _view.DesignerTable.Styles = _view.Styles;
            _view.DesignerTable.CheckOut = _view.CheckOut;
            _view.DesignerTable.PropertyGrid = _view.PropertyGrid;
            _view.DesignerTable.ParametersPage = _view.ParametersPage;
            _view.DesignerTable.View = _view;

            _view.DragDrop.ViewDesigner = _view.ViewDesigner;
            _view.DragDrop.AJAXCall = _view.AJAXCall;
            _view.DragDrop.DesignerTable = _view.DesignerTable;
            _view.DragDrop.Conditions = _view.Conditions;
            _view.DragDrop.Styles = _view.Styles;
            _view.DragDrop.CheckOut = _view.CheckOut;
            _view.DragDrop.PropertyGrid = _view.PropertyGrid;
            _view.DragDrop.ParametersPage = _view.ParametersPage;
            _view.DragDrop.View = _view;

            _view.Conditions.ViewDesigner = _view.ViewDesigner;
            _view.Conditions.DragDrop = _view.DragDrop;
            _view.Conditions.AJAXCall = _view.AJAXCall;
            _view.Conditions.DesignerTable = _view.DesignerTable;
            _view.Conditions.Styles = _view.Styles;
            _view.Conditions.CheckOut = _view.CheckOut;
            _view.Conditions.PropertyGrid = _view.PropertyGrid;
            _view.Conditions.ParametersPage = _view.ParametersPage;
            _view.Conditions.View = _view;

            _view.PropertyGrid.ViewDesigner = _view.ViewDesigner;
            _view.PropertyGrid.DragDrop = _view.DragDrop;
            _view.PropertyGrid.AJAXCall = _view.AJAXCall;
            _view.PropertyGrid.DesignerTable = _view.DesignerTable;
            _view.PropertyGrid.Conditions = _view.Conditions;
            _view.PropertyGrid.Styles = _view.Styles;
            _view.PropertyGrid.CheckOut = _view.CheckOut;
            _view.PropertyGrid.ParametersPage = _view.ParametersPage;
            _view.PropertyGrid.View = _view;

            _view.Styles.ViewDesigner = _view.ViewDesigner;
            _view.Styles.DragDrop = _view.DragDrop;
            _view.Styles.AJAXCall = _view.AJAXCall;
            _view.Styles.DesignerTable = _view.DesignerTable;
            _view.Styles.Conditions = _view.Conditions;
            _view.Styles.CheckOut = _view.CheckOut;
            _view.Styles.PropertyGrid = _view.PropertyGrid;
            _view.Styles.ParametersPage = _view.ParametersPage;
            _view.Styles.View = _view;

            _view.CheckOut.ViewDesigner = _view.ViewDesigner;
            _view.CheckOut.DragDrop = _view.DragDrop;
            _view.CheckOut.AJAXCall = _view.AJAXCall;
            _view.CheckOut.DesignerTable = _view.DesignerTable;
            _view.CheckOut.Conditions = _view.Conditions;
            _view.CheckOut.Styles = _view.Styles;
            _view.CheckOut.PropertyGrid = _view.PropertyGrid;
            _view.CheckOut.ParametersPage = _view.ParametersPage;
            _view.CheckOut.View = _view;
        },

        _clearObject: function ()
        {
            _view.selectedObject = null;
            _view.viewDefinitionXML = null;
            _view.controlPropertiesXML = null;
            _view.viewActionsListTable = null;
            _view.isOnFinishStep = false;
            _view.SelectedViewType = null;
            _view.isSmartObjectLoaded = false;
            _view.SelectedControlTab = 0;
            _view.isViewChanged = false;
            _view.viewExpressionListTable = null;
            _view.isControlEvent = true;
            _view.SelectedEditorTab = 0;
            _view.isViewEventsLoaded = false;
            _view.isViewEventsLoading = false;
            _view.controlsPerDataTypeXML = null;
            _view.propertyGrid = null;
            _view.categoryTree = null;
            _view.smartObjectTree = null;
            //_view.viewEventsTree = null;
            _view.OriginalViewName = null;
            _view.OriginalViewDisplayName = null;
            _view.OriginalViewCategoryId = null;
            _view.isCellSizing = false;
            _view.isControlSizing = false;
            _view.AutoGenerateMethodsList = [];
            _view.isReadOnlyView = 'false';
            _view.SelectedSmartObjectGuid = null;
            _view.SelectedFinishType = null;
            _view.SelectedCategoryId = null;
            _view.SelectedCategoryPath = null;
            _view.SelectedSMOCategoryId = null;
            _view.SelectedSMOCategoryPath = null;
            _view.IsViewEdit = false;
            _view.ControlStyles = null;
            _view.hiddenAssociationXml = null;
            _view.hiddenSmartObjectXml = null;
            _view.popupConfirmation = null;
            _view.viewSettingsXmlDoc = null;
            _view.lastSelectedPropertyTab = null;
            _view.validationPatternsCache = null;
            _view.ParametersPage._pendingValues = null;
            _view.tableLayoutOptions = null;

            _view.viewEventsGrid = null;
            _view.viewDefinitionXML = null;

            _view.ParametersPage.DragDrop = null;
            _view.ParametersPage.AJAXCall = null;
            _view.ParametersPage.DesignerTable = null;
            _view.ParametersPage.Conditions = null;
            _view.ParametersPage.Styles = null;
            _view.ParametersPage.CheckOut = null;
            _view.ParametersPage.PropertyGrid = null;
            _view.ParametersPage.View = null;
            _view.hasViewTypeChanged = false;
        },

        _initStep: function (ev, nav)
        {
            if (checkExists(nav.to))
            {
                switch (nav.to)
                {
                    case this.GENERAL_STEP_INDEX:
                        this.smoLookup.categorylookup({
                            change: this.changeDataSource.bind(this),
                            updatecategories: this.updateSMOLookup.bind(this)
                        });

                        this.catLookup.categorylookup({
                            change: this.changeCategory.bind(this),
                            updatecategories: this.updateCategoryLookup.bind(this)
                        });
                        break;

                    case this.SETTINGS_STEP_INDEX:
                        this.element.find("#DataSourcePaneContainer").panecontainer();
                        break;

                    case this.LAYOUT_STEP_INDEX:
                        var xmlDoc = this.viewDefinitionXML;
                        var ViewElem = xmlDoc.selectSingleNode(this.viewXPath);

                        this.element.find('#LayoutPaneContainer').panecontainer();

                        this.element.find("#LayoutPaneContainer").on("panecontainerresize", function (ev)
                        {
                            // Hide Enable/Disable Rule Toolbar buttons as none of them will be seleceted.
                            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");

                            SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                            //TFS 720744 & 731081
                            SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdToolboxPane");
                            this._savePaneSizePreference(ev);
                            this._updateOverlayComponents();
                        }.bind(this));


                        if (this.IsViewEdit === true || this.IsViewEdit === 'True' || this.IsViewEdit === 'true')
                        {
                            if (this.isViewChanged === false)
                            {
                                var CanvasElem = ViewElem.selectSingleNode('Canvas');
                                var ControlsElem = ViewElem.selectSingleNode('Controls');

                                if ($chk(ControlsElem) === true)
                                {
                                    this.skipInitEditableListViewEditEventBuilding = true; // 1.A Ensure that the default editable list rules are not added back again by the default settings
                                    this.ViewDesigner._BuildCanvasControls(ControlsElem);
                                    this.skipInitEditableListViewEditEventBuilding = null; // 1.B Ensure that the settings will be used to populate the rules back (1.A and 1.B work together and need to be kept insync)
                                }

                                //if toolbar Section does not exist build it
                                if (this.element.find('#toolbarSection').length === 0)
                                {
                                    this.DesignerTable._generateToolbarTable(this.SelectedViewType);
                                }
                                else
                                {
                                    var cell = this.element.find("#toolbarSection .editor-table.toolbar>tbody>tr>td:first-child");
                                    var cellWatermarkText = $('<div class="watermark-text">' + Resources.ViewDesigner.DragControlHereWatermark + '</div>');
                                    var firstChild = cell.children().first();
                                    if (firstChild.length > 0)
                                        cellWatermarkText.insertBefore(firstChild);
                                    else
                                        cell.append(cellWatermarkText);
                                    this.DragDrop._ToggleContextWaterMark(cell);
                                }

                                if (this.ViewDesigner._getViewType() === "CaptureList")
                                {
                                    var viewPropertiesNode = this.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@Type='View']/Properties");

                                    if (checkExists(viewPropertiesNode))
                                    {
                                        var pagingNode = viewPropertiesNode.selectSingleNode("Property[Name='PageSize']");
                                        if (checkExists(pagingNode))
                                        {
                                            this.ViewDesigner._toggleListViewPaging(true);
                                        }

                                        var filterNode = viewPropertiesNode.selectSingleNode("Property[Name='FilterDisplay']");
                                        if (checkExists(filterNode))
                                        {
                                            this.ViewDesigner._toggleListViewFilter(true);
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            var viewDiv = this.element.find("#ViewID");
                            var viewID = xmlDoc.selectSingleNode("SourceCode.Forms/Views/View/@ID").text;

                            viewDiv.css("height", "100%");
                            viewDiv.attr("id", viewID);
                            viewDiv.attr("controltype", "View");
                        }

                        $("#AuthenticatedPaneContainer").on("panecontainerresize.positionHandlers", function ()
                        {
                            this._updateOverlayComponents();
                        }.bind(this)); // resize

                        //Navigation panel is in AppStudio (global)
                        this.element.find("#NavigationPanel").on("navigationpanelcollapse.positionHandlers", function () { _view.DesignerTable._positionHandlers(); });
                        this.element.find("#NavigationPanel").on("navigationpanelexpand.positionHandlers", function () { _view.DesignerTable._positionHandlers(); });
                        break;
                    case this.PARAMS_STEP_INDEX:
                        break;
                    case this.RULES_STEP_INDEX:
                        this.viewActionsListTable.grid('synccolumns');
                        break;
                    case this.SUMMARY_STEP_INDEX:
                        // Initialize the summary step
                        this._initSummaryStep();
                        break;
                }
            }
        },

        _getViewID: function ()
        {
            return this.element.find("#ViewID").attr("id");
        },

        _configureCaptureListViewForEdit: function ()
        {
            _view.DesignerTable._addEditableListTableHoverStates($("#bodySection").find(".editor-table"));

            // if all list heading control are bold, check option on settings page
            var headerColumns = $("#bodySection").find(".editor-table").find("tbody>tr.header>td.header");
            if (headerColumns.length > 0)
            {
                for (var i = 0; i < headerColumns.length; i++)
                {
                    var col = $(headerColumns[i]);

                    // get list heading control
                    var listHeading = col.find("div.controlwrapper");

                    var controlXml = _view.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(listHeading.attr("ID")));
                    if (checkExists(controlXml))
                    {
                        var boldFontWeight = controlXml.selectSingleNode("Styles/Style[@IsDefault='True']/Font[Weight='Bold']");
                        if (checkExists(boldFontWeight))
                        {
                            $("#vdchkBoldHeadingRow").checkbox().checkbox("check");
                        }
                        else
                        {
                            $("#vdchkBoldHeadingRow").checkbox().checkbox("uncheck");
                        }
                    }
                }
            }

            _view._applyAlternateRows();
        },

        _applyAlternateRows: function ()
        {
            var alternateRowCells = $("td.editor-cell.alternate");
            if (_view.selectedOptions.ShadeAlternatingRows)
            {
                if (alternateRowCells.length === 0)
                {
                    var rows = $("#bodySection table.editor-table>tbody>tr");
                    for (var i = 0; i < rows.length; i++)
                    {
                        var row = $(rows[i]);
                        if (row.hasClass("footer"))
                        {
                            break;
                        }

                        if (i > 1)
                        {
                            var loop = (i - 1) % 2;

                            if (loop > 0)
                            {
                                row.children("td").addClass("alternate");
                            }
                        }
                    }
                }
            }
            else
            {
                alternateRowCells.removeClass("alternate");
            }
        },

        _initializeControls: function ()
        {
            // view intro
            this.element.find("#vdShowIntroCheckbox").checkbox();

            // view details
            this.txtName = this.element.find("#vdtxtViewName").textbox();
            this.txtDescription = this.element.find("#vdtxtViewDescription").textbox();
            this.smoLookup = this.element.find("#ViewDesignerSmartObjectLookup").categorylookup();
            this.catLookup = this.element.find("#ViewDesignerCategoryLookup").categorylookup();

            // view settings 

            // data source
            this.chkrefreshlist = this.element.find("#vdrefreshListChkbox").checkbox();
            this.ddlistmethod = this.element.find("#vdlistViewGetListMethod").dropdown();

            this.element.find("#vdcolumnGeneration").textbox();

            if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version > 8)
            {
                this.element.find("#divAutoGenerateFieldsSpacer").width("110px");
            }
        },

        _showSortConfigOptions: function ()
        {
            var orderWidget = new ViewSettingsOrderWidget();
            var parentElement = $("<div id='OrderContainer'></div>");
            $("body").append(parentElement);

            var orderData = _view.orderWidgetXml;

            var initEvent = _view.viewDefinitionXML.selectSingleNode("//Views/View/Events/Event[(Name='Init') and (@Type='User')]");
            var orderElement = null;
            if (checkExists(initEvent))
            {
                // check if any filter data exists
                orderElement = initEvent.selectSingleNode("Handlers/Handler/Actions/Action/Properties/Property[Name='Order']");
                if (checkExists(orderElement))
                {
                    orderData = orderElement.selectSingleNode("Value").text;
                }
            }

            var buttonArray = [];
            buttonArray[0] = {
                type: "help",
                click: function () { HelpHelper.runHelp(7048); }
            };
            buttonArray[1] =
                {
                    text: Resources.WizardButtons.OKButtonText,
                    click: function ()
                    {
                        this._setSortConfigSortOptions(orderWidget);

                        popupManager.closeLast();
                        this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
                    }.bind(this)
                };

            buttonArray[2] =
                {
                    text: Resources.WizardButtons.CancelButtonText,
                    click: function ()
                    {
                        popupManager.closeLast();
                    }
                };

            var options =
                {
                    headerText: Resources.ViewDesigner.SortWidgetTitle,
                    modalize: true,
                    maximizable: false,
                    draggable: true,
                    content: parentElement,
                    width: 900,
                    height: 420,
                    buttons: buttonArray
                };

            $.popupManager.showPopup(options);

            orderWidget.viewId = _view.viewDefinitionXML.selectSingleNode("/SourceCode.Forms/Views/View").getAttribute("ID");

            if (!checkExists(orderElement) && $chk(_view.orderWidgetXml))
            {
                orderWidget.setConfigurationXml(_view.orderWidgetXml);
            }
            else if ($chk(orderData))
            {
                orderWidget.setConfigurationXml(orderData);
            }

            if (!_view.layoutExists())
            {
                _view.ViewDesigner._BuildViewXML();
            }

            orderWidget.initialize(parentElement);
        },

        _setSortConfigSortOptions: function (orderWidget)
        {
            var valueSet = false;
            var viewID = _view.ViewDesigner._GetViewID();
            var listingMethod = _view.ViewDesigner._GetSmartObjectDefaultMethod();

            var eventCriteria = "[Name='Init' and @Type='User' and not(@SubFormID)]";
            var actionCriteria = "[@Type='Execute']";
            var propertyValueTemplate = "Property[Name='{0}' and Value='{1}']";
            var viewIdCriteria = propertyValueTemplate.format("ViewID", viewID);
            var methodCriteria = propertyValueTemplate.format("Method", listingMethod);
            var controlCriteria = "Property[(Name/text()='ControlID')]";

            var actionPropertiesCriteria = "({0}) and ({1}) and not ({2})".format(viewIdCriteria, methodCriteria, controlCriteria);

            var xPath = "//Views/View/Events/Event{0}/Handlers/Handler/Actions/Action{1}/Properties[{2}]"
                .format(eventCriteria, actionCriteria, actionPropertiesCriteria);
            var actionPropertiesNode = _view.viewDefinitionXML.selectSingleNode(xPath);

            var order = null;
            if (checkExists(actionPropertiesNode))
            {
                // check if any filter data exists
                order = actionPropertiesNode.selectSingleNode("Property[Name='Order']");
                if (!checkExists(order) && _view.IsViewEdit)
                {
                    var orderProperty = _view.viewDefinitionXML.createElement("Property");
                    var name = _view.viewDefinitionXML.createElement("Name");
                    name.appendChild(_view.viewDefinitionXML.createTextNode("Order"));
                    orderProperty.appendChild(name);
                    orderProperty.appendChild(_view.viewDefinitionXML.createElement("Value"));

                    actionPropertiesNode.appendChild(orderProperty);
                    order = orderProperty;
                }

                if (checkExists(order))
                {
                    var value = order.selectSingleNode("Value");
                    order.removeChild(value);
                    value = _view.viewDefinitionXML.createElement("Value");
                    value.appendChild(_view.viewDefinitionXML.createTextNode(orderWidget.getConfigurationXML()));
                    order.appendChild(value);
                    valueSet = true;
                }
            }

            if (!checkExists(order) && !valueSet)
            {
                _view.orderWidgetXml = orderWidget.getConfigurationXML();
            }
        },

        _showFilterConfigOptions: function ()
        {
            var filterWidget = new ViewSettingsFilterWidget();
            var parentElement = $("<div id='FilterContainer'></div>");
            $("body").append(parentElement);

            var filterData = _view.filterWidgetXml;

            var initEvent = _view.viewDefinitionXML.selectSingleNode("//Views/View/Events/Event[(Name='Init') and (@Type='User')]");
            var filterElement = null;
            if (checkExists(initEvent))
            {
                // check if any filter data exists
                filterElement = initEvent.selectSingleNode("Handlers/Handler/Actions/Action/Properties/Property[Name='Filter']");
                if (checkExists(filterElement))
                {
                    var filterValNode = filterElement.selectSingleNode("Value");
                    if (checkExists(filterValNode))
                    {
                        filterData = filterElement.selectSingleNode("Value").text;
                    }
                }
            }

            var buttonArray = [];
            buttonArray[0] = {
                type: "help",
                click: function () { HelpHelper.runHelp(7048); }
            };

            buttonArray[1] =
                {
                    text: Resources.WizardButtons.OKButtonText,
                    click: function ()
                    {
                        var valueSet = false;
                        var hasValidationError = false;

                        var eventXml = _view.viewDefinitionXML.selectSingleNode("//Views/View/Events/Event[(Name='Init') and (@Type='User')]");
                        var filter = null;
                        if (checkExists(eventXml))
                        {
                            // check if any filter data exists
                            filter = eventXml.selectSingleNode("Handlers/Handler/Actions/Action/Properties/Property[Name='Filter']");

                            if (!checkExists(filter) && _view.IsViewEdit)
                            {
                                var filterProperty = _view.viewDefinitionXML.createElement("Property");
                                var name = _view.viewDefinitionXML.createElement("Name");
                                name.appendChild(_view.viewDefinitionXML.createTextNode("Filter"));
                                filterProperty.appendChild(name);
                                filterProperty.appendChild(_view.viewDefinitionXML.createElement("Value"));

                                eventXml.selectSingleNode("Handlers/Handler/Actions/Action/Properties").appendChild(filterProperty);
                                filter = eventXml.selectSingleNode("Handlers/Handler/Actions/Action/Properties/Property[Name='Filter']");
                            }

                            if (checkExists(filter))
                            {
                                var filterValue = filterWidget.getConfigurationXML();
                                hasValidationError = (filterValue === false);

                                if (!hasValidationError)
                                {
                                    if (filterValue !== "")
                                    {
                                        var value = filter.selectSingleNode("Value");
                                        filter.removeChild(value);
                                        value = _view.viewDefinitionXML.createElement("Value");
                                        value.appendChild(_view.viewDefinitionXML.createTextNode(filterValue));
                                        filter.appendChild(value);
                                    }
                                    else
                                    {
                                        //No filter configured, remove filter property
                                        if (checkExists(filter.parentNode))
                                        {
                                            filter.parentNode.removeChild(filter);
                                        }
                                    }
                                    valueSet = true;
                                }
                            }
                        }

                        if (!checkExists(filter) && !valueSet)
                        {
                            _view.filterWidgetXml = filterWidget.getConfigurationXML();
                        }

                        if (!hasValidationError)
                        {
                            popupManager.closeLast();
                            _view.ViewDesigner._configureOptionsStep(_view.LAYOUT_STEP_INDEX);
                        }
                    }
                };

            buttonArray[2] =
                {
                    text: Resources.WizardButtons.CancelButtonText,
                    click: function ()
                    {
                        popupManager.closeLast();
                    }
                };

            var options =
                {
                    headerText: Resources.ViewDesigner.FilterWidgetTitle,
                    modalize: true,
                    maximizable: false,
                    draggable: true,
                    content: parentElement,
                    width: 900,
                    height: 420,
                    buttons: buttonArray
                };

            $.popupManager.showPopup(options);

            filterWidget.viewId = _view.viewDefinitionXML.selectSingleNode("/SourceCode.Forms/Views/View").getAttribute("ID");

            if (!checkExists(filterElement) && $chk(_view.filterWidgetXml))
            {
                filterWidget.setConfigurationXml(_view.filterWidgetXml);
            }
            else if ($chk(filterData))
            {
                filterWidget.setConfigurationXml(filterData);
            }

            if (!_view.layoutExists())
            {
                _view.ViewDesigner._BuildViewXML();
            }

            filterWidget.initialize(parentElement);
        },

        _updateOverlayComponents: function ()
        {
            // re-position drag-handlers
            _view.DesignerTable._positionHandlers();

            SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
        },

        _attachControlEvents: function ()
        {
            var jqScope = this.element;
            // certain elements need to be updated if the browser window is resized or if the panes in app studio is resized as well
            $(window).on("resize.ViewDesigner", function ()
            {
                if (arguments.length > 0
                    && $chk(arguments[0].originalEvent)
                    && arguments[0].originalEvent.type === "resize")
                {
                    this._updateOverlayComponents();
                }
            }.bind(this));

            //Intro Step: Show intro checkbox
            jqScope.find("#vdShowIntroCheckbox").on("change", function (e)
            {
                this.AJAXCall._introSettingChanged($(e.target).is(":checked"));
            }.bind(this));

            //General Step: View Type options
            jqScope.find('#label_aSelectType_Capture').on("mouseup", function ()
            {
                if (this.CheckOut._checkViewStatus()) this.ViewDesigner._selectViewTypePrompt('Capture');
            }.bind(this));
            jqScope.find('#label_aSelectType_CaptureList').on("mouseup", function ()
            {
                if (this.CheckOut._checkViewStatus()) this.ViewDesigner._selectViewTypePrompt('CaptureList');
            }.bind(this));


            //Layout Step: Tabs in properties panel
            jqScope.find('#ViewEditorControlTab').on("click", function ()
            {
                this.ViewDesigner._selectViewEditorTab(0, $('#ViewEditorControlTab'));
            }.bind(this));


            jqScope.find('#vdViewEditorFormsTab').on("click", function ()
            {
                this.ViewDesigner._selectViewEditorTab(2, $('#vdViewEditorFormsTab'));
            }.bind(this));

            jqScope.find('#ViewEditorControlFieldsTab').on("click", function () { this.ViewDesigner._selectViewEditorControlTab(0, $('#ViewEditorControlFieldsTab')); }.bind(this));
            jqScope.find('#ViewEditorControlMethodsTab').on("click", function () { this.ViewDesigner._selectViewEditorControlTab(1, $('#ViewEditorControlMethodsTab')); }.bind(this));
            jqScope.find('#ViewEditorControlToolboxTab').on("click", function () { this.ViewDesigner._selectViewEditorControlTab(2, $('#ViewEditorControlToolboxTab')); }.bind(this));
            jqScope.find('#vdControlTabPropertiesTab').on("click", function (e)
            {
                this.ViewDesigner._selectControlTab(0, $('#vdControlTabPropertiesTab'));
                this.lastSelectedPropertyTab = $('#vdControlTabPropertiesTab');

                SourceCode.Forms.Designers.Common.triggerEvent("PropertyTabChanged");
            }.bind(this));

            jqScope.find('#vdBodyTabPropertiesTab').on("click", function (e)
            {
                this.ViewDesigner._selectControlTab(0, $('#vdBodyTabPropertiesTab'));
                this.lastSelectedPropertyTab = $('#vdBodyTabPropertiesTab');

                SourceCode.Forms.Designers.Common.triggerEvent("PropertyTabChanged");
            }.bind(this));

            jqScope.find('#vdColumnTabPropertiesTab').on("click", function (e)
            {
                this.ViewDesigner._selectControlTab(0, $('#vdColumnTabPropertiesTab'));
                this.lastSelectedPropertyTab = $('#vdColumnTabPropertiesTab');

                SourceCode.Forms.Designers.Common.triggerEvent("PropertyTabChanged");
            }.bind(this));

            jqScope.find('#panecontainer').on("panecontainerresize", function ()
            {
                this.DesignerTable._positionHandlers();
            }.bind(this));

            $(document).on('keydown.View', function (event)
            {
                this.ViewDesigner._handleKeyDown(event);
            }.bind(this));


            jqScope.find("#vdcolumnsAmount, #vdrowsAmount, #vdcolumnGeneration").on("keydown", function (e)
            {
                var keyCode = e.which;
                var jq_this = $(e.target);
                var currentValue = parseInt(jq_this.val());

                switch (keyCode)
                {
                    case $.ui.keyCode.UP:
                        if (this.CheckOut._checkViewStatus())
                        {
                            if (currentValue < 99)
                            {
                                jq_this.val(++currentValue);
                            }
                        }
                        break;
                    case $.ui.keyCode.DOWN:

                        if (this.CheckOut._checkViewStatus())
                        {
                            if (currentValue > 1)
                            {
                                jq_this.val(--currentValue);
                            }
                        }
                        break;
                    case 8:
                    case 48:
                        if (this.CheckOut._checkViewStatus())
                        {
                            if (jq_this.val() === "")
                            {
                                return false;
                            }
                        }
                        break;
                    case $.ui.keyCode.PERIOD:
                        return false;
                    default:
                        break;
                }
            }.bind(this));
            // rows and columns input validation


            //General Step: Name Textbox
            this.txtName.on("keydown", function ()
            {
                return this.CheckOut._checkViewStatus();
            }.bind(this));

            this.txtName.on("keyup", function ()
            {
                this.ViewDesigner._doViewNameValidation();
                this.wizard.wizard("option", "contextobjectname", _view.txtName.val());

                var info = this._getFileInfo();
                info.name = this.txtName.val();

                $.event.trigger({ type: "appstudio.designer.namechanging", fileInfo: info }, null, document);

                return this.CheckOut._checkViewStatus();
            }.bind(this));

            //General Step: Description Textbox
            this.txtDescription.on("keydown", function () { return this.CheckOut._checkViewStatus(); }.bind(this));


            //Layout Step: Not totally sure!
            jqScope.find('#vdrbButtonTypeStandard').on("click", function (e)
            {
                this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
            }.bind(this));

            jqScope.find('#vdrbButtonTypeToolbar').on("click", function (e)
            {
                this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
            }.bind(this));

            jqScope.find('#txtColumnsCustom').on("keydown", function (e)
            {
                if (this.CheckOut._checkViewStatus())
                {
                    var keyCode = e.keyCode;

                    if ((keyCode < 48 || keyCode > 57) && (keyCode !== 8) && (keyCode !== 37) && (keyCode !== 39) && (keyCode !== 46) && (keyCode < 96 || keyCode > 105))
                    {
                        e = new Event(e).stop();
                    }
                }
            }.bind(this));

            jqScope.find('#txtColumnsCustom').on("keyup", function (e)
            {
                if (this.CheckOut._checkViewStatus())
                {
                    $('#vdcolumnsAmount').val($('#txtColumnsCustom').val());
                }
            }.bind(this));

            jqScope.find('#vdtxtListViewLinesPerPage').on("keydown", function (e)
            {
                if (this.CheckOut._checkViewStatus())
                {
                    var keyCode = e.keyCode;

                    if ((keyCode < 48 || keyCode > 57) && (keyCode !== 8) && (keyCode !== 37) && (keyCode !== 39) && (keyCode !== 46) && (keyCode < 96 || keyCode > 105))
                    {
                        //e = new Event(e).stop();
                        if (e && e.preventDefault)
                        {
                            e.preventDefault();
                        }
                        else
                        {
                            e.cancelBubble = true;
                        }
                    }
                }
            }.bind(this));

            jqScope.find('#vdtxtListViewLinesPerPage').on("keyup", function (e)
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var keyCode = e.keyCode;

                    if ((keyCode < 48 || keyCode > 57) && (keyCode !== 8) && (keyCode !== 37) && (keyCode !== 39) && (keyCode !== 46) && (keyCode < 96 || keyCode > 105))
                    {
                        //e = new Event(e).stop();
                        if (e && e.preventDefault)
                        {
                            e.preventDefault();
                        }
                        else
                        {
                            e.cancelBubble = true;
                        }
                    }
                    this.deltaSettingsChanged = true;
                    this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
                }
            }.bind(this));

            jqScope.find("#vdshowFilter").on("click", function (e)
            {
                if (this.CheckOut._checkViewStatus())
                {
                    this.deltaSettingsChanged = true;
                    this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
                }
            }.bind(this));

            jqScope.find("#vdrefreshListChkbox").on("click", function ()
            {
                if (this.CheckOut._checkViewStatus())
                {
                    this.ViewDesigner._configureOptionsStep(this.LAYOUT_STEP_INDEX);
                }
            }.bind(this));
        },

        _setLayoutOptionsResources: function ()
        {
            // localize options on layout step
            var element = $("#OptionGenerate");
            if (element.length > 0)
            {
                element[0].innerHTML = Resources.ViewDesigner.OptionAutoGenerate;
            }

            element = $("#OptionGenerateDescription");
            if (element.length > 0)
            {
                element[0].innerHTML = Resources.ViewDesigner.OptionAutoGenerateDescription;
            }

            element = $("#OptionInsertTable");
            if (element.length > 0)
            {
                element[0].innerHTML = Resources.ViewDesigner.OptionInsertTable;
            }

            element = $("#OptionInsertTableDescription");
            if (element.length > 0)
            {
                element[0].innerHTML = Resources.ViewDesigner.OptionInsertTableDescription;
            }
        },

        _toggleGenerateOption: function ()
        {
            if (!checkExistsNotEmpty($("#vdsmartObjectID").val()))
            {
                $("#divAutoGenerateOption").hide();
            }
            else
            {
                $("#divAutoGenerateOption").show();
            }
        },

        _initializeToolbarLayoutOptions: function (addToCanvas)
        {
            if (checkExists(addToCanvas) && addToCanvas === true)
            {
                _view._setCanvasEmpty();
                _view.tableLayoutOptions.appendTo($("#bodySection"));

                // hyperlink buttons on the layout page
                _view._attachLayoutGenerationEvents();
            }

            _view._setLayoutOptionsResources();

            _view._toggleGenerateOption();
        },

        _autoGenerateLayout: function ()
        {
            AutoGenerateViewPopup.show(_view.SelectedViewType);
        },

        _createBlankLayout: function ()
        {
            if (_view.SelectedViewType === SourceCode.Forms.Designers.ViewType.ListView)
            {
                var contentPanel = $("<div id=\"ListViewCreateNewOptions\"></div>");

                contentPanel.append(SCFormField.html(
                    {
                        boldlabel: true,
                        label: Resources.FormDesigner.TableSizeLabel
                    }));

                contentPanel.append("<hr/>");

                contentPanel.append(SCFormField.html(
                    {
                        forid: "pgTableColumnCount",
                        label: Resources.FormDesigner.TableColumnCountLabel,
                        required: true
                    }));

                contentPanel.append(SCFormField.html(
                    {
                        boldlabel: true,
                        label: Resources.Designers.EnableListViewEditingLabel
                    }));

                contentPanel.append("<hr/>");

                contentPanel.append(SCCheckbox.html({
                    id: "chkEnableEditing",
                    label: Resources.Designers.ListViewEditingOptionLabel
                }));

                var options =
                    {
                        buttons: [
                            {
                                type: "help",
                                click: function () { HelpHelper.runHelp(7072); }
                            },
                            {
                                text: Resources.WizardButtons.OKButtonText,
                                click: function ()
                                {
                                    var columnCount = parseInt($("#pgTableColumnCount").val());

                                    if (isNaN(columnCount) || !(columnCount >= 1 && columnCount <= 20))
                                    {
                                        popupManager.showError(Resources.FormDesigner.TableControlValueValidationMessage);
                                        return;
                                    }

                                    _view.selectedOptions.ColumnCount = columnCount;

                                    if (_view.layoutExists())
                                    {
                                        options = _view._clearViewCanvas("list", columnCount);
                                        popupManager.showConfirmation(options);
                                        return;
                                    }

                                    if (_view.selectedOptions.EnableListEditing === true)
                                    {
                                        _view.selectedOptions.EnablePaging = false;
                                    }

                                    _view._generateBlankListViewLayout(columnCount);
                                    popupManager.closeLast();
                                }
                            },
                            {
                                text: Resources.WizardButtons.CancelButtonText,
                                click: function ()
                                {
                                    _view.ViewDesigner._configureOptionsStep(_view.wizard.wizard("getStep", _view.layoutStep));
                                    popupManager.closeLast();
                                }
                            }],
                        content: contentPanel,
                        removeContent: true,
                        width: 350,
                        height: 225,
                        headerText: Resources.Designers.InsertLayoutTableText,
                        onShow: function ()
                        {
                            var wrappers = contentPanel.find('.form-field-element-wrapper');

                            wrappers.eq(1).html(SCTextbox.html({
                                id: 'pgTableColumnCount',
                                value: _view.selectedOptions.ColumnCount
                            }));

                            var chkEnableEditing = $("#ListViewCreateNewOptions").find("#chkEnableEditing_base");
                            chkEnableEditing.checkbox().checkbox();
                            _view.selectedOptions.EnableListEditing = false;
                            chkEnableEditing.on("click", function ()
                            {
                                if (chkEnableEditing.hasClass("checked"))
                                {
                                    _view.selectedOptions.EnableListEditing = true;
                                }
                                else
                                {
                                    _view.selectedOptions.EnableListEditing = false;
                                }
                            });

                            wrappers.find('input').textbox();

                            contentPanel.panel({
                                fullsize: true
                            });
                        },
                        id: "InsertListTableDialog"
                    };

                popupManager.showPopup(options);
                $("#pgTableColumnCount")[0].focus();
            }
            else
            {
                _view._updateTableSize();

                SourceCode.Forms.Controls.Web.TableBehavior.prototype._tablePopup(
                    function (columnCount, rowCount)
                    {
                        if (_view.layoutExists())
                        {
                            options = _view._clearViewCanvas("item", columnCount, rowCount);
                            popupManager.showConfirmation(options);
                            return false;
                        }

                        _view._generateBlankItemViewLayout(columnCount, rowCount);

                        _view.editorpanelcontainer.modalize(false);
                        _view.editorpanelcontainer.showBusy(false);
                    },
                    null, null, null, Resources.Designers.InsertLayoutTableText);
            }
        },

        _updateTableSize: function ()
        {
            var table = $("#bodySection table.editor-table:first-child");

            _view.selectedOptions.RowCount = table.find("tr").length === 0 ? _view.selectedOptions.RowCount : table.find(">tbody>tr").length;
            _view.selectedOptions.ColumnCount = table.find("tr:first-child td").length === 0 ? _view.selectedOptions.ColumnCount : table.find("tr:first-child .editor-cell:not(tr table .editor-cell)").length;
        },

        _clearViewCanvas: function (type, columnCount, rowCount)
        {
            return options = ({
                message: Resources.ViewDesigner.DefaultCanvasMsg,
                iconClass: "warning",
                onAccept: function ()
                {
                    popupManager.closeLast();
                    popupManager.closeLast();

                    _view.editorpanelcontainer.modalize(true);
                    _view.editorpanelcontainer.showBusy(true);

                    _view.clearView();

                    _view.editorpanelcontainer.modalize(false);
                    _view.editorpanelcontainer.showBusy(false);

                    if (type === "list")
                    {
                        _view._generateBlankListViewLayout(columnCount);
                    }
                    else if (type === "item")
                    {
                        _view._generateBlankItemViewLayout(columnCount, rowCount);
                    }
                }.bind(_view),
                onCancel: function ()
                {
                    _view.ViewDesigner._configureOptionsStep(_view.wizard.wizard("getStep", _view.layoutStep));
                    popupManager.closeLast();
                    return;
                }
            });
        },

        _generateBlankListViewLayout: function (columnCount)
        {
            _view.isGeneratingView = true;
            _view.applyGetListMethod = true;
            _view.controlTypeIndexes.length = 0;


            if (_view.selectedOptions.EnableListEditing === true)
            {
                _view.selectedOptions.EnablePaging = false;
            }

            _view.DesignerTable._generateLayoutTable(_view.SelectedViewType, 7, columnCount);
            _view.DesignerTable._generateToolbarTable(_view.SelectedViewType);

            // ensure footer row displays correctly
            var footerRow = $("tr.footer");
            if (footerRow.length > 0)
            {
                _view.DesignerTable._configurePlaceholderFooterRow(footerRow);
            }

            $("#btnBlankLayout").off();
            $("#btnAutoGenerate").off();
            _view.tableLayoutOptions.remove();
            $("#vdeditorToolboxPane").removeClass("disabled");

            _view.editorpanelcontainer.modalize(false);
            _view.editorpanelcontainer.showBusy(false);

            if (_view.selectedOptions.EnableListEditing === false)
            {
                $("#editableSection").hide();
            }
            else
            {
                $("#editableSection").show();
            }

            _view._setCanvasFilled();
            _view.isGeneratingView = false;
            _view.ViewDesigner._configureOptionsStep(_view.wizard.wizard("getStep", _view.layoutStep));
            _view.ViewDesigner._BuildViewXML();

            SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
        },

        _generateBlankItemViewLayout: function (columnCount, rowCount)
        {
            _view.isGeneratingView = true;
            _view.controlTypeIndexes.length = 0;

            _view.DesignerTable._generateLayoutTable(_view.SelectedViewType, rowCount, columnCount);
            _view.DesignerTable._generateToolbarTable(_view.SelectedViewType);

            _view.isGeneratingView = false;

            $("#btnBlankLayout").off();
            $("#btnAutoGenerate").off();
            _view.tableLayoutOptions.remove();

            _view.ViewDesigner._configureOptionsStep(_view.wizard.wizard("getStep", _view.layoutStep));

            $("#vdeditorToolboxPane").removeClass("disabled");

            SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
        },

        _repopulateDummyRenderData: function ()
        {
            var table = $("#bodySection table.editor-table:first-child");
            var rows = table.find(">tbody>tr");

            // check if dummy data already exists
            var dummyDataColumn = $("#bloomer1");
            if (dummyDataColumn.length > 0)
            {
                return;
            }

            if (rows.length > 1)
            {
                var columns = $(rows[1]).find(">td");

                for (var i = 0; i < columns.length; i++)
                {
                    var column = $(columns[i]);
                    var controlWrapper = column.find(".controlwrapper");

                    if (controlWrapper.length > 0)
                    {
                        _view._doControlPropertiesForDummyData(controlWrapper);
                    }
                }
            }
        },

        _doControlPropertiesForDummyData: function (controlWrapper)
        {
            var controlID = controlWrapper.attr("id");
            var controlType = controlWrapper.attr("controltype");
            var propertytype = controlWrapper.attr("propertytype");
            var controlProperties = _view.controlPropertiesXML.selectSingleNode("Control[@ID='" + controlID + "']/Properties");
            var defaultControlProperties = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]/DefaultProperties');
            var textProperty = _view.ViewDesigner._getControlProperty(controlID, 'Text');
            var defaultTextProperty = defaultControlProperties.selectSingleNode("Properties/Prop[@ID='Text']");
            var fieldProperty = _view.ViewDesigner._getControlProperty(controlID, 'Field');
            var styles = _view.Styles._getStyles(controlID, controlType);
            var controlTextValue = "";

            if (($("#editableSection").length === 0) || ($("#editableSection").find(controlWrapper).length === 0))
            {
                if ($chk(fieldProperty))
                {
                    if (!(textProperty) && defaultTextProperty)
                    {
                        controlTextValue = _view.DesignerTable._getDummyData(propertytype, controlWrapper.attr("friendlyname"));
                    }
                }
                else
                {
                    controlTextValue = controlType;
                }
            }

            if (defaultTextProperty && !(textProperty))
            {
                controlProperties.appendChild(_view.ViewDesigner._BuildPropertyElem(controlID, 'Text', controlTextValue, controlTextValue));

                _view.ViewDesigner._setControlPropertiesXML(controlID, controlProperties, styles);
                _view.AJAXCall._initControlProperties(controlID, controlType, controlProperties, styles, false);  //add capturelist ?when called?

                //Remove text property as it should not be saved, only be used to populate dummy data
                _view.ViewDesigner._removeControlPropertyValue(controlID, "Text");
            }
            else
            {
                _view.AJAXCall._initControlProperties(controlID, controlType, controlProperties, styles, false);  //add capturelist ?when called?
            }
        },

        _restoreSectionIDs: function ()
        {
            // restore section ids
            var controlsXML = _view.viewDefinitionXML.selectNodes(_view.viewXPath + "/Controls/Control");
            for (var i = 0; i < controlsXML.length; i++)
            {
                var control = controlsXML[i];
                var controlType = control.getAttribute('Type');
                var controlId = control.getAttribute('ID');

                if (controlType === "Section")
                {
                    var section = $("#" + controlId);
                    if (section.length > 0)
                    {
                        section.attr("uniqueID", controlId);
                        section.attr("id", section.attr("type").toLowerCase() + "Section");
                        section.removeAttr("type");
                    }
                }
            }
        },

        //used to get reference to step classes.
        INTRO_STEP_INDEX: -1,
        GENERAL_STEP_INDEX: 0,
        LAYOUT_STEP_INDEX: 1,
        PARAMS_STEP_INDEX: 2,
        RULES_STEP_INDEX: 3,
        SUMMARY_STEP_INDEX: 4,

        // happens after the view's html and scripts has been loaded (after init is successful)
        // load scripts calls this, as loadscripts is the last thing to finish loading.
        _postload: function (callback)
        {
            this.tableArrays = [];
            this.hiddenAssociationXml = parseXML("<associations></associations>");

            //check if the view html is loaded
            if ($('#hiddenViewDataXml').length === 0)
            {
                setTimeout(function ()
                {
                    this._postload(callback);
                }.bind(this), 40);
                return;
            }

            var tableOptions = this.element.find("#tableLayoutOptions");
            if (tableOptions.length > 0)
            {
                tableOptions.remove();
                _view.tableLayoutOptions = tableOptions;
            }

            this.element.show().siblings().hide();

            this.wizard = this.container.find(".wizard").wizard({
                validate: _view._validate.bind(this),
                backward: _view._navigate.bind(this),
                forward: _view._navigate.bind(this),
                initshow: _view._initStep.bind(this),
                cancel: _view._cancelViewDesigner.bind(this),
                help: _view._onWizardHelp.bind(this),
                save: _view._onWizardSave.bind(this),
                finish: _view._onWizardFinish.bind(this),
                useoverlay: false
            });

            //_view.wizard.wizard("setStepMapping", _view.introStep, _view.INTRO_STEP_INDEX);
            this.wizard.wizard("setStepMapping", _view.generalStep, _view.GENERAL_STEP_INDEX);
            this.wizard.wizard("setStepMapping", _view.layoutStep, _view.LAYOUT_STEP_INDEX);
            this.wizard.wizard("setStepMapping", _view.parametersStep, _view.PARAMS_STEP_INDEX);
            this.wizard.wizard("setStepMapping", _view.rulesStep, _view.RULES_STEP_INDEX);
            this.wizard.wizard("setStepMapping", _view.summaryStep, _view.SUMMARY_STEP_INDEX);
            //_view.wizard.wizard("setStepMapping", _view.finishStep, _view.INTRO_STEP_INDEX);

            // initialize temp vars for sort and filter ui
            this.filterWidgetXml = null;
            this.orderWidgetXml = null;


            // Initialize WizardContainer
            SourceCode.Forms.WizardContainer.initialize();

            this._initializeControls();
            this._attachControlEvents();

            // Set property values
            this.viewDataXml = parseXML($('#hiddenViewDataXml').val());
            this.viewSettingsXmlDoc = parseXML($("#hiddenViewSettings").val());
            this.viewDefinitionXML = parseXML(this.viewDataXml.selectSingleNode("SourceCode.Forms/ViewDefinition").text);
            this.EditorCanvasId = this.viewDataXml.selectSingleNode("SourceCode.Forms/EditorCanvasID").text;
            this.TypeDefaultControls = parseXML(this.viewDataXml.selectSingleNode("SourceCode.Forms/TypeDefaultControls").text);
            this.ViewCheckedOutStatus = parseInt(this.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCheckedOutStatus").text, 10);
            this.ViewCheckedOutBy = this.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCheckedOutBy").text;
            this.CurrentUser = this.viewDataXml.selectSingleNode("SourceCode.Forms/CurrentUser").text;

            if ($chk(this.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls")) === false)
            {
                this.controlPropertiesXML = this.viewDefinitionXML.createElement("Controls");
                this.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View").appendChild(_view.controlPropertiesXML);
            }
            else
            {
                this.controlPropertiesXML = this.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls");
            }

            this.Styles.prepareStylesForLoad();

            this.controlsPerDataTypeXML = parseXML("<ControlTypes/>");

            this._initializeViewActionsListTable();

            var ViewType = this.ViewDesigner._getViewType();

            var EditorCanvas = $('#' + _view.EditorCanvasId);

            var scrollWrapper = this.editorpanel.find(".canvas-container > .scroll-wrapper");

            scrollWrapper.on("click", function (ev)
            {
                ev.stopPropagation();
                $("#ControlTabsContent").find("select").filter(function ()
                {
                    return $(this).next(".dropdown-box.active").length > 0;
                }).dropdown("hidedropdown"); 

                if (!SourceCode.Forms.Designers.Common._moveWidget.isDragging())
                {                    
                    _view.ViewDesigner._handleMouseClick(ev);
                }
                else
                {
                    SourceCode.Forms.Designers.Common._moveWidget.setDragging(false);
                }                
            });

            _view.currentFilter = null;

            EditorCanvas.disableSelection();

            //Initialize everything.
            _view._initToolbar();
            _view._addToolbarEvents();
            _view._addActionToolbarEvents();
            _view._populateToolboxControls();
            _view._initializeRulesTabGrid();
            _view._initGeneral();
            _view._initRules();
            _view.ParametersPage.initialize();
            _view._checkDesignerOptions();            

            var isViewEdit = checkExists(_view.IsViewEdit) ? (_view.IsViewEdit.toString().toUpperCase() === "TRUE") : false;

            //If editing an existing File
            if (isViewEdit)
            {
                _view._setCategoryAndSmartobjectForExistingView();

                _view.isConfiguringForEdit = true;
                _view._setSelectedOptions();
                _view._initializeCategoryTree(); //relies on values set in _initExistingViewCat();

                _view.element.find("#vdeditorToolboxPane").removeClass("disabled");
                _view._setCanvasFilled();

                // NOTE: Discuss where the page size's default value should be stored
                // set control value based on stored value
                var pageSize = _view.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@Type='View']/Properties/Property[Name='PageSize']/Value");
                if (checkExists(pageSize))
                {
                    $("#vdtxtListViewLinesPerPage").val(pageSize.text);
                }

                // TODO: Remove, temporary work-around
                _view._restoreSectionIDs();

                if (ViewType === "CaptureList")
                {
                    _view._configureCaptureListViewForEdit();
                    var multi = _view.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@Type='View']/Properties/Property[Name='MultiSelectAllowed']");

                    if ($chk(multi))
                    {
                        var multiAllowed = multi.selectSingleNode("Value").text;
                        _view.selectedOptions.Multiselect = (multiAllowed === "true");
                    }
                    else
                    {
                        _view.selectedOptions.Multiselect = false;
                    }

                    var cellContentSelect = _view.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@Type='View']/Properties/Property[Name='CellContentSelectAllowed']");

                    if (checkExists(cellContentSelect))
                    {
                        var cellContentSelectAllowed = cellContentSelect.selectSingleNode("Value").text;

                        if (cellContentSelectAllowed === "true")
                        {
                            _view.selectedOptions.CellContentSelect = true;
                        }
                        else
                        {
                            _view.selectedOptions.CellContentSelect = false;
                        }
                    }
                    else
                    {
                        _view.selectedOptions.CellContentSelect = false;
                    }
                }

                //populates the view canvas.
                _view.ViewDesigner._populateView();
                //populate the rules list
                SourceCode.Forms.RuleList.refresh($("#pgRuleList"), _view.viewDefinitionXML);

                if (_view.element.find('#divFormsTabContent').is(':visible') && _view.isViewEventsLoaded === false && _view.isViewEventsLoading === false)
                {
                    _view.isViewEventsLoading = true;
                    setTimeout(function () { _view.ViewDesigner._LoadViewEvents(); }.bind(_view), 0);
                }

                if (_view.element.find("#vdFormEventsTabGrid").is(":visible"))
                {
                    var formEventsGrid = _view.element.find("#vdFormEventsTabGrid");
                    SourceCode.Forms.RuleGrid.refresh(formEventsGrid, _view.viewDefinitionXML);

                    if (formEventsGrid.grid("fetch", "selected-rows").length === 0)
                    {
                        formEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");
                    }

                    formEventsGrid.grid("synccolumns");
                }

                _view.DesignerTable._createControlTypeIndexes();

                var viewElement = $("#{0}".format(_view.viewDefinitionXML.selectSingleNode("//Views/View").getAttribute("ID")));
                if (viewElement.length > 0)
                {
                    viewElement[0].style.height = "100%";
                }

                _view._setCanvasFilled();
                _view._loadConfiguredListMethodForDetailsStep(ViewType);
                _view.ddlistmethod.dropdown("refresh");

                // set previous value to saved value
                // initial the selected view for proper data generation
                _view.PreviousSelectedViewType = ViewType;
                _view.ViewDesigner._setViewType(ViewType);

                //Set to layout step
                _view.wizard.wizard("step", _view.wizard.wizard("getStep", _view.layoutStep));

                SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdeditorToolboxPane");
                //TFS 720744 & 731081
                SourceCode.Forms.Designers.resizeToolboxPaneTabs("vdToolboxPane");
                _view._applyErrorBadges();
                _view.isConfiguringForEdit = false;
            }
            else
            {
                //these need to be done even if its a new view, becuase the "Create view from smartiobject"
                //feature will populate the viewXml with the smo/category in /views/PartialPage.aspx.cs
                _view._setCategoryAndSmartobjectForNewView();

                //Creating a new file.
                _view.tableLayoutOptions.appendTo($("#bodySection"));
                //Disables the wizard steps and puts focus on the name txtbox.

                //Set to general step
                _view.wizard.wizard("step", _view.GENERAL_STEP_INDEX);

                _view.ViewDesigner._showDetails(); //disables wizard steps and buttons.
                _view.ViewDesigner._setViewType(ViewType); //hides/shows the correct smo options.
            }

            // disable selection on toolbox
            _view.element.find("#vdToolboxList").disableSelection();
            _view.element.find("#vdFieldsList").disableSelection();
            _view.element.find("#vdMethodsList").disableSelection();
            _view.element.find("#vdLayoutList").disableSelection();


            if (_view.element.find("#tableLayoutOptions").length > 0)
            {
                _view._setLayoutOptionsResources();
                _view._attachLayoutGenerationEvents();
            }

            _view._toggleGenerateOption();

            // Initialize the dependency analyzer angular components
            _view._initSummaryStep();

            _view._detectAutomaticChanges();

            //remove the designer overlay (added in init)
            this.getContainerContent().removeOverlay();

            if (typeof callback === "function")
            {
                callback(); //this will Remove the app overlay, but not the designer overlay. SourceCode.Forms.Interfaces.Forms.panes.content.removeOverlay();
            }

            //Reset the intro animation and trigger an event that appstudio can listen to.
            $.event.trigger({ type: "appstudio.designer.loaded", fileInfo: _view._getFileInfo(), designer: this.element }, null, document);
            _view.container.removeClass("intro");

            this._active = true;
            $('#__designerStatus').text($('#__designerStatus').text().replace('initializing', 'initialized'));

            if (SourceCode.Forms.Designers.View && SourceCode.Forms.Designers.View.DesignerTable)
            {
                SourceCode.Forms.Designers.View.DesignerTable._positionHandlers();
            }

            //Once the view is loaded, select the View and it will fire the ControlSelected event to enable/disable the toolbar buttons.
            _view.ViewDesigner._configSelectedControl(EditorCanvas.find("[controlType = 'View']").first());

            SourceCode.Forms.Designers.Common.createColumnResizeWidget();
        },

        //sets the canvas to look empty (usually has options to quickly add a table etc)
        _setCanvasEmpty: function ()
        {
            _view.canvas.addClass("empty");
            _view.editorpanelcontainer.addClass("empty");
            _view.element.find("#bodySection").addClass("empty");

            SourceCode.Forms.Designers.Common.triggerEvent("CanvasCleared");
        },

        //sets the canvas to look filled - normally called after adding a control to the canvas.
        _setCanvasFilled: function ()
        {
            _view.canvas.removeClass("empty");
            _view.editorpanelcontainer.removeClass("empty");
            _view.element.find("#bodySection").removeClass("empty");
        },

        //Loads the category and smartobject on the General Page for an new view.
        _setCategoryAndSmartobjectForNewView: function ()
        {
            //If its a new View, the XML *might* already contain a category and a SMO, if the user selected to 
            // create a view within a specific cat, or design a view based on a smo. The Xml is populated in partialpage.aspx.
            var inSoID = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewSmartObjectGuid").text;
            var inSoPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewSmartObjectPath").text;
            var inCatID = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryID").text;
            var inCatPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryPath").text;
            var catDisplayPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryDisplayPath").text;

            if (($chk(inSoID)) && ($chk(inSoPath)))
            {
                _view.smoLookup.categorylookup("value", { objectid: inSoID, objecttype: "smartobject" });
                _view.ViewDesigner._loadSOMethods(true);
            }

            if (($chk(inCatID)) && ($chk(inCatPath)))
            {
                _view.catLookup.categorylookup("value", { catid: inCatID, path: _view.inCatPath });

                var category = _view.catLookup.categorylookup("value");

                _view.SelectedCategoryDisplayPath = category.fullpath;
                _view.SelectedCategoryPath = category.path;
                _view.SelectedCategoryId = category.catid;
            }

            // initial the selected view for proper data generation
            _view.PreviousSelectedViewType = "not-defined";

            // ensure the Events node
            var eventsNode = _view.viewDefinitionXML.selectSingleNode("//Views/View/Events");
            if (!checkExists(eventsNode))
            {
                var viewNode = _view.viewDefinitionXML.selectSingleNode("//Views/View");
                if (checkExists(viewNode))
                {
                    eventsNode = _view.viewDefinitionXML.createElement("Events");
                    viewNode.appendChild(eventsNode);
                }
            }
        },

        //Loads the category and smartobject on the General Page for an existing view.
        _setCategoryAndSmartobjectForExistingView: function ()
        {
            //TODO:Partial Pages ; Cleanup this code, not right
            _view.SelectedCategoryDisplayPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryDisplayPath").text;
            _view.SelectedCategoryPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryPath").text;
            _view.SelectedCategoryId = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewCategoryID").text;
            _view.SelectedCategoryIdOriginal = _view.SelectedCategoryId;
            _view.SelectedSmartObjectPath = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewSmartObjectPath").text;
            _view.SelectedSmartObjectGuid = _view.viewDataXml.selectSingleNode("SourceCode.Forms/ViewSmartObjectGuid").text;

            //Since this is existing view, we expect it to have a category id
            _view.catLookup.categorylookup("value", { catid: _view.SelectedCategoryId, path: _view.SelectedCategoryPath });

            if (_view.SelectedSmartObjectGuid !== "")
            {
                _view._loadDataSourceLookupValue(_view.SelectedSmartObjectGuid);
            }

            _view.OriginalViewCategoryId = _view.SelectedCategoryId;

            _view.element.find("#viewcategoryId").val(_view.SelectedCategoryId);
            _view.element.find("#viewcategoryPath").val(_view.SelectedCategoryPath);
        },

        //returns a basic json object, used for raising events to Appstudio, for filetabs to updae and others.
        _getFileInfo: function ()
        {
            return {
                datatype: "view",
                name: this.txtName.val(),
                catid: this.categoryId,
                guid: this._getViewID(),
                systemname: "fake system name - TODO",
                readonly: this.txtName.prop("disabled")
            }
        },

        _loadCategoryLookupValues: function (selectedSmartObjectGuid, selectedCategoryId, selectedCategoryPath)
        {
            _view._loadDataSourceLookupValue(selectedSmartObjectGuid);
            if (selectedCategoryId !== "")
            {
                _view.catLookup.categorylookup("value", { catid: selectedCategoryId, path: selectedCategoryPath });
            }
        },

        _loadDataSourceLookupValue: function (selectedSmartObjectGuid)
        {
            if (selectedSmartObjectGuid == "")
            {
                return;
            }

            var primarySourceNode = _view.viewDefinitionXML.selectSingleNode(
                'SourceCode.Forms/Views/View/Sources/Source[@SourceID="{0}"][@ContextType="Primary"]'.format(selectedSmartObjectGuid));

            if (!checkExists(primarySourceNode))
            {
                return;
            }

            var smoHasValidationError = SourceCode.Forms.DependencyHelper.hasValidationStatusError(primarySourceNode);

            var smoLookupValue =
                {
                    objectid: selectedSmartObjectGuid,
                    objecttype: "smartobject",
                    displayname: SourceCode.Forms.Designers.Common.getItemDisplayName(primarySourceNode)
                }

            if (smoHasValidationError)
            {
                smoLookupValue.isvalid = false;
            }

            _view.smoLookup.categorylookup("value", smoLookupValue);
        },

        _applyErrorBadges: function ()
        {
            SourceCode.Forms.Designers.Common.View.applyErrorBadgesToExpressionsWithValidationIssue();
            SourceCode.Forms.Designers.Common.View.applyErrorBadgesToControlsWithValidationIssue();
            SourceCode.Forms.Designers.Common.View.applyErrorBadgesToControlsWithStyleIssue();
            SourceCode.Forms.Designers.Common.View.applyErrorBadgesToControlsWithPropertyIssue();
            SourceCode.Forms.Designers.Common.View.applyDesignerWizardStepBadging();
            SourceCode.Forms.Designers.Common.View.refreshBadgesForViewDataSource();
        },

        _detectAutomaticChanges: function ()
        {
            var changes = parseInt($("#mustCommitChanges").val(), 10);

            if (!!changes)
            {
                popupManager.showMessage(
                    {
                        type: "warning",
                        id: "AutomaticChangesMustBeCommittedPopup",
                        headerText: Resources.DependencyHelper.RemoveOrphanRulesText,
                        message: Resources.DependencyHelper.PendingViewChangesMustBeCommittedText
                    });
            }
        },

        _refreshRuleGridTabBadging: function ()
        {
            if (!checkExists(this.selectedObject))
            {
                return;
            }

            var id = this.selectedObject.attr('id');
            var controltype = this.selectedObject.attr('controltype');
            var context = "ViewControl";

            if (controltype === 'View' || controltype === 'Cell')
            {
                context = "View";
            }

            SourceCode.Forms.Designers.Common.checkControlRuleDependencies(id, context);
        },

        _attachLayoutGenerationEvents: function ()
        {
            $("#btnBlankLayout").on("click", this._createBlankLayout);
            $("#btnAutoGenerate").on("click", this._autoGenerateLayout);

            $("#divAutoGenerateOption").on("mouseenter", function (e)
            {
                $("#AutoGenerateIcon").removeClass("inactive");
                $("#divAutoGenerateOption")[0].style.backgroundColor = "#E2EEC0";
            }).on("mouseleave", function (e)
                {
                    $("#AutoGenerateIcon").addClass("inactive");
                    $("#divAutoGenerateOption")[0].style.backgroundColor = "";
                });

            $("#divInsertTableOption").on("mouseenter", function (e)
            {
                $("#InsertTableIcon").removeClass("inactive");
                $("#divInsertTableOption")[0].style.backgroundColor = "#E2EEC0";
            }).on("mouseleave", function (e)
                {
                    $("#InsertTableIcon").addClass("inactive");
                    $("#divInsertTableOption")[0].style.backgroundColor = "";
                });
        },

        _searchButtonClicked: function ()
        {
            var grid = _view._getTargetGrid();
            var searchText = _view.searchControl.val();
            searchText = searchText.trim();

            if (!checkExistsNotEmpty(_view.currentFilter))
            {
                _view.currentFilter = "All";
            }
            _view.currentGridObject.refresh(grid, _view.viewDefinitionXML, null, searchText, _view.currentFilter);

            $('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
            $('#toolEditAction, #toolRemoveAction').addClass('disabled');
        },

        _clearSearchButtonClicked: function ()
        {
            var grid = _view._getTargetGrid();
            _view.searchControl.val("");
            _view.filtercheckmenu.filtercheckmenu("clearMenu");
            _view.filterButton.removeClass("active");
            _view.filterButton.attr("title", Resources.AppStudio.NoFiltersAppliedTooltip);

            _view.currentFilter = "All";

            _view.searchControl.trigger("focus");

            _view.currentGridObject.refresh(grid, _view.viewDefinitionXML, null, "", _view.currentFilter);

            $('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
            $('#toolEditAction, #toolRemoveAction').addClass('disabled');
        },

        _addRuleActions: function (grid)
        {
            var rulescontainer = grid.find(".grid-content-cell-wrapper");

            rulescontainer.off("click", "label.radiobox-button", _view.ViewDesigner._selectViewAction).on("click", "label.radiobox-button", _view.ViewDesigner._selectViewAction);
            rulescontainer.off("dblclick", "label.radiobox-button", _view.ViewDesigner._doEditViewAction).on("dblclick", "label.radiobox-button", _view.ViewDesigner._doEditViewAction);
            rulescontainer.off("click", "#rgAddRule").on("click", "#rgAddRule", _view.ViewDesigner._doAddViewAction);

        },

        _updateFilterMenu: function (clear, filters)
        {
            if (!checkExists(_view.filtercheckmenu) || _view.filtercheckmenu.filtercheckmenu("isCheckedChanging"))
            {
                return false;
            }
            var filterValues = "";
            var duplicates = {};
            var uniqueFilters = [];

            uniqueFilters = SourceCode.Forms.Designers.Common.Rules.getUniqueObjectArray(filters);

            var countFilters = uniqueFilters.length;

            for (var i = 0; i < countFilters; i++)
            {
                if (checkExistsNotEmpty(filterValues))
                {
                    filterValues = filterValues + "|" + uniqueFilters[i].value;
                }
                else
                {
                    filterValues = uniqueFilters[i].value;
                }
            }

            var selectedFilter;

            if (!checkExistsNotEmpty(_view.currentFilter))
            {
                if (checkExists(_view.filtercheckmenu))
                {
                    selectedFilters = _view.filtercheckmenu.filtercheckmenu("tag");
                }
                else
                {
                    selectedFilters = "All";
                }
            }
            else
            {
                selectedFilters = _view.currentFilter;
            }

            if (checkExists(_view.filtercheckmenu))
            {
                if (checkExists(clear) && clear === true)
                {
                    _view.filtercheckmenu.filtercheckmenu("removeMenuItems");
                }
                filterValues = SourceCode.Forms.Designers.Common.Rules.orderArray(filterValues);
                _view.filtercheckmenu.filtercheckmenu("html", filterValues);
                SourceCode.Forms.Designers.Common.Rules._loadFilterCheckContextMenu(_view, uniqueFilters, selectedFilters, _view.filtercheckmenu);
            }
        },

        // public method used by SourceCode.Forms.Designers.Common.Context
        resetRulesSearch: function ()
        {
            _view.searchControl.val("");
        },

        disableFilterControls: function (pRuleList, _contextNodeName)
        {
            _view.searchControl.disable();
            _view.filterButton.button();
            _view.filterButton.button("disable");
            _view.filterButton.addClass("disabled");
            _view.filterButton.off("click.ruleFilterShowHide");
        },

        enableFilterControls: function (pRuleList, _contextNodeName)
        {
            _view.searchControl.enable();
            _view.filterButton.button();
            _view.filterButton.button("enable");
            _view.filterButton.removeClass("disabled");
            _view.filterButton.off("click.ruleFilterShowHide").on("click.ruleFilterShowHide", _view._clickFilterCheckMenu.bind(_view));
        },

        _disableAllSteps: function ()
        {
            _view.wizard.wizard("disable", "step", _view.wizard.wizard("getStep", _view.layoutStep));
            _view.wizard.wizard("disable", "step", _view.wizard.wizard("getStep", _view.parametersStep));
            _view.wizard.wizard("disable", "step", _view.RULES_STEP_INDEX);
            _view.wizard.wizard("disable", "button", "save");
        },

        defaultButtonState: function ()
        {
            this.element.find('#toolEditAction, #toolRemoveAction').addClass('disabled');
            this.element.find('#toolEditAction, #toolRemoveAction').removeClass('hidden');
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').addClass("disabled");
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').addClass("hidden");
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').addClass("disabled");
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').addClass("hidden");
            this.element.find('#vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");
        },

        activateEnableButton: function (grid)
        {
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').addClass("hidden");
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').addClass("disabled");
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').removeClass("hidden");
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').removeClass("disabled");
            this.element.find('#toolEditAction').removeClass("hidden");
            this.element.find('#toolEditAction').addClass('disabled');
            grid.children(".grid-toolbars").find("a.toolbar-button.edit").addClass("disabled");
        },

        activateDisableButton: function (grid)
        {
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').removeClass("hidden");
            this.element.find('#vdToolDisableRule, #vdToolLayoutDisableRule').removeClass("disabled");
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').addClass("hidden");
            this.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule').addClass("disabled");
            this.element.find('#toolEditAction').removeClass('disabled');
            grid.children(".grid-toolbars").find("a.toolbar-button.edit").removeClass("disabled");
        },

        _closeRuleWizard: function (refresh, currentFilter)
        {
            //TD 0073 _closeRuleWizard should later be bound via this event and a common method in the rules scope fired each time it closes
            $(SourceCode.Forms.Designers.Common.Rules.Current).trigger("RuleDesignerClosing");
            SourceCode.Forms.WizardContainer.hide();
            var stepName = _view.wizard.wizard("getStepName", _view.wizardStep);
            var grid = _view._getTargetGrid();
            var gridType = SourceCode.Forms.Designers.Common.Rules.getGridType(grid);
            var selectedRuleId = SourceCode.Forms.WizardContainer.ruleID;

            if (refresh)
            {
                // when the rule wizard returns, it re-parses the view definition xml, which causes the following references to point to old xml documents
                // so we need to re-query in order to restore them
                _view.controlPropertiesXML = _view.viewDefinitionXML.selectSingleNode("//Views/View/Controls");

                // restore the SOID attribute for the View [TFS 878334]
                _view.ViewDesigner._setViewSmoIdAttribute();

                // We need to update the controlpropertiesxml to have display values as the view definition was changed when the Rules Wizard was closed
                var ControlElems = _view.controlPropertiesXML.selectNodes('Control');
                var ControlCount = ControlElems.length;
                for (var c = 0; c < ControlCount; c++)
                {
                    var ControlElem = ControlElems[c];
                    var PropertiesElem = ControlElem.selectSingleNode('Properties');
                    var ControlId = ControlElem.getAttribute('ID');

                    //Build control property xml
                    _view.ViewDesigner._BuildControlPropertiesXML(ControlId, PropertiesElem);
                }
                // Update

                if (gridType === "list")
                {
                    var searchText = "";
                    _view.searchControl.val("");

                    var _filters = SourceCode.Forms.Designers.Common.Rules.getFilters();

                    _view.currentGridObject.refresh(grid, _view.viewDefinitionXML, null, searchText, _view.currentFilter);

                    if (checkExistsNotEmpty(selectedRuleId))
                    {
                        var radioboxelement = $("#" + selectedRuleId).find("input[type=radio]");
                        radioboxelement.radioboxbutton().radioboxbutton("check");
                        var selectedEvent = _view.viewDefinitionXML.selectSingleNode("//Event[@ID='{0}']".format(selectedRuleId));
                        var selectedEventIsEnabled = selectedEvent !== null ? selectedEvent.getAttribute("IsEnabled") : "TRUE";

                        if (!$("#" + selectedRuleId).hasClass("extended"))
                        {
                            $('#toolRemoveAction').removeClass("disabled");
                        }
                        else
                        {
                            $('#toolRemoveAction').addClass("disabled");
                        }

                        $('#vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').removeClass("hidden");

                        if (!$chk(selectedEventIsEnabled) || selectedEventIsEnabled.toUpperCase() === "TRUE")
                        {
                            _view.activateDisableButton(grid);
                        }
                        else
                        {
                            _view.activateEnableButton(grid);
                        }
                    }

                    _view._updateFilterMenu(true, _filters);
                }
                else if (gridType === "grid")
                {
                    if (_view.isViewEventsLoading === false && stepName === _view.layoutStep)
                    {
                        var gridOptions = [];

                        _view.isViewEventsLoading = true;
                        //setTimeout(function () { _view.ViewDesigner._LoadViewEvents(); }, 0);
                        _view.ViewDesigner._LoadViewEvents();

                        var selectedControl = _view._findControlFromSelectedObject();
                        if (selectedControl !== null && selectedControl.hasClass("controlwrapper"))
                        {
                            gridOptions.controlID = selectedControl.attr("ID");
                        }
                    }

                    _view.currentGridObject.refresh(grid, _view.viewDefinitionXML, gridOptions);

                    if (grid.find("tr.selected").length === 0)
                    {
                        $('#toolEditAction, #toolRemoveAction').addClass('disabled');
                    }
                    else
                    {
                        $('#toolEditAction, #toolRemoveAction').removeClass('disabled');
                        grid.find("a.toolbar-button.edit, a.toolbar-button.delete").removeClass("disabled");
                    }
                }
                _view._loadConfiguredListMethodForDetailsStep(_view.ViewDesigner._getViewType());
            }
            else
            {
                if (gridType === "list")
                {
                    var rule = grid.find(".radiobox > ul > li > label.radiobox-button.checked");
                    var selectedRuleID;
                    var selectedEventIsEnabled;
                    if (rule.length !== 0)
                    {
                        var ruleID = _view.currentGridObject.getSelectedID(grid);

                        if (checkExists(ruleID) && ruleID !== "")
                        {
                            var selectedrule = _view.viewDefinitionXML.selectSingleNode("//Event[@ID='{0}']".format(ruleID));
                            if (checkExists(selectedrule))
                            {
                                selectedEventIsEnabled = selectedrule !== null ? selectedrule.getAttribute("IsEnabled") : "TRUE";
                            }
                        }

                        $('#toolEditAction, #toolRemoveAction').removeClass('disabled');
                        $('#vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').removeClass("hidden");
                        if (!$chk(selectedEventIsEnabled) || selectedEventIsEnabled.toUpperCase() === "TRUE")
                        {
                            _view.activateDisableButton(grid);
                        }
                        else
                        {
                            _view.activateEnableButton(grid);
                        }
                    }
                    else
                    {
                        _view.defaultButtonState(grid);
                    }

                }
                else if (gridType === "grid")
                {
                    if (grid.find("tr.selected").length === 0)
                    {
                        $('#toolEditAction, #toolRemoveAction').addClass('disabled');
                    }
                    else
                    {
                        $('#toolEditAction, #toolRemoveAction').removeClass('disabled');
                        grid.find("a.toolbar-button.edit, a.toolbar-button.delete").removeClass("disabled");
                    }
                }
            }

            SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
            $(SourceCode.Forms.Designers.Common.Rules.Current).trigger("RuleDesignerClosed");
        },

        getTargetGrid: function ()
        {
            return _view._getTargetGrid();
        },

        //Go to the next page :)
        _btnCreate_Click: function (e)
        {
            _view.wizard.wizard("step", _view.LAYOUT_STEP_INDEX);
        },

        //close out
        _btnDiscard_Click: function (e)
        {
            this._cancelViewDesigner();
        },

        _getTargetGrid: function ()
        {
            var grid = $("#vdFormEventsTabGrid");
            var stepIndex = _view.wizard.wizard("stepindex");
            var stepName = _view.wizard.wizard("getStepName", stepIndex);
            _view.currentGridObject = SourceCode.Forms.RuleGrid;

            if (stepName === _view.rulesStep)
            {
                grid = $("#pgRuleList");
                _view.currentGridObject = SourceCode.Forms.RuleList;
            }

            return grid;
        },

        //remove labels for creating forms or smartobjects
        _checkDesignerOptions: function ()
        {
            if ($chk(window._objectDesignerEnabled) === false)
            {
                $('#label_aCreateSmartObject').hide();
            }

            if ($chk(window._formDesignerEnabled) === false)
            {
                $('#label_aCreateForm').hide();
            }
        },

        _populateToolboxControls: function ()
        {
            var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;

            var findControlsXpath = "Control";

            if (SourceCode.Forms.Settings.Controls.ShowInternalControls !== true)
            {
                findControlsXpath += "[not(@flags) or not(contains(@flags,'IsInternal'))]";
            }
            var Controls = ControlsDoc.documentElement.selectNodes(findControlsXpath);
            var ToolboxContainer = $('#vdToolboxList');
            var LayoutContainer = $('#vdLayoutList');
            var ToolboxParent = $('<div></div>');
            var LayoutParent = $('<div></div>');

            ToolboxParent.attr('id', 'ToolboxParent');
            ToolboxParent.addClass('dataitemcontainer');
            ToolboxParent.addClass('controlToolboxGroup');

            LayoutParent.attr('id', 'LayoutParent');
            LayoutParent.addClass('dataitemcontainer');
            LayoutParent.addClass('controlToolboxGroup');

            ToolboxContainer.append(ToolboxParent);
            LayoutContainer.append(LayoutParent);

            for (var i = 0; i < Controls.length; i++)
            {
                var ControlElem = Controls[i];

                var friendlyname = ControlElem.selectSingleNode('FriendlyName').text;
                var name = ControlElem.selectSingleNode('Name').text;
                var iconPath = ControlElem.selectSingleNode('IconPath').text;
                var controltype = ControlElem.getAttribute("category");
                var defaultevent = ControlElem.selectSingleNode('DefaultEvent').text;
                var controlGroup = ControlElem.getAttribute("group");
                var counter = 0;
                if (checkExists(controlGroup) && controlGroup !== "")
                {
                    var options = {};
                    options.id = "controlToolboxGroup" + controlGroup;
                    options.name = controlGroup;

                    var category = $('#' + options.id.selectorEncode());
                    if (category.length === 0)
                    {
                        category = _view._addToolboxGroup(options);
                    }

                    var divControl = $('<div></div>');
                    divControl.addClass('draggable');

                    divControl.attr('friendlyname', friendlyname);
                    divControl.attr('name', name);
                    divControl.attr('controlicon', iconPath);
                    divControl.attr('controltype', controltype);
                    divControl.attr('defaultevent', defaultevent);
                    divControl.addClass('toolboxitem');
                    divControl.addClass(name.toLowerCase() + "-control");

                    divControl.append(document.createTextNode(friendlyname));
                    var categoryBody = $(category.find('.controlToolboxGroupCategoryBody'));

                    switch (controltype)
                    {
                        case '0':
                        case '1':
                        case '2':
                        case '3':
                        case '7':
                            divControl.attr('itemtype', 'control');
                            ToolboxParent.append(category);

                            if (categoryBody.length > 0)
                            {
                                categoryBody.append(divControl);
                            }
                            break;
                        case '4':
                            divControl.attr('itemtype', 'layoutcontainer');
                            ToolboxParent.append(category);

                            if (categoryBody.length > 0)
                            {
                                categoryBody.append(divControl);
                            }
                            break;
                    }
                }
            }

            //$('.propertyGridCategoryToggle')
            ToolboxContainer.find('.controlToolboxGroupCategoryToggle').on("click", function (e)
            {
                var src;

                if (e.srcElement)
                {
                    src = $(e.srcElement);
                }
                else
                {
                    src = $(e.target);
                }

                var categoryId = src.attr('category');
                var categoryItem = $('#' + categoryId.selectorEncode());

                if (categoryItem.length > 0)
                {
                    var categoryBody = categoryItem.find('.controlToolboxGroupCategoryBody');
                    if (categoryBody.length > 0)
                    {
                        if (categoryBody.hasClass('open'))
                        {
                            categoryBody.removeClass('open');
                            categoryBody.addClass('closed');
                            src.removeClass('open');
                            src.addClass('closed');
                        }
                        else if (categoryBody.hasClass('closed'))
                        {
                            categoryBody.addClass('open');
                            categoryBody.removeClass('closed');
                            src.addClass('open');
                            src.removeClass('closed');
                        }
                    }
                }
            });

            _view.ViewDesigner._makeChildElementsDragable(ToolboxParent);
            _view.ViewDesigner._makeChildElementsDragable(LayoutParent);
        },

        _addToolboxGroup: function (options)
        {
            var category = $('<div></div>');
            var catHeader = $('<div></div>');
            var catToggle = $('<span></span>');
            var catLabel = $('<div></div>');
            var catBody = $('<div></div>');

            category.attr('id', options.id);
            category.addClass('controlToolboxGroupCategory');

            catHeader.attr('category', options.id);
            catHeader.addClass('controlToolboxGroupCategoryHeader');

            catToggle.addClass('controlToolboxGroupCategoryToggle open');
            catToggle.attr('category', options.id);

            catLabel.addClass('controlToolboxGroupCategoryLabel');
            catLabel.text(options.name);

            catBody.attr('category', options.id);
            catBody.addClass('controlToolboxGroupCategoryBody open');

            catHeader.append(catToggle);
            catHeader.append(catLabel);
            category.append(catHeader);
            category.append(catBody);

            return category;

        },

        //Wizard Save Button is clicked
        _onWizardSave: function ()
        {
            if (_view.CheckOut._checkViewStatus(false))
            {

                var viewType = _view.ViewDesigner._getViewType();

                var stepIndex = _view.wizard.wizard("stepindex");
                var stepName = _view.wizard.wizard("getStepName", stepIndex);

                switch (stepName)
                {
                    case _view.generalStep:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ViewDesigner._hideDetails();
                                break;
                        }
                        break;

                    case _view.layoutStep:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ViewDesigner._BuildViewXML();
                                break;
                        }
                        break;
                    case _view.rulesStep:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                _view.ViewDesigner._hideViewCanvas();
                                var succeeded = !_view._validateEvents();
                                if (!succeeded)
                                {
                                    _view.wizard.wizard("step", _view.RULES_STEP_INDEX);
                                    popupManager.showWarning(Resources.ViewDesigner.InvalidEventsMsg);
                                    return false;
                                }

                                break;
                        }
                }

                if (_view.IsViewEdit !== 'True')
                {
                    _view.AJAXCall._saveView(false, false, _view._onSaveComplete.bind(_view));
                }
            }
            else
            {
                _view.wizard.wizard("savingComplete");
            }
        },

        _onSaveComplete: function (noError, datatype, guid, catid)
        {
            this.wizard.wizard("savingComplete");
            if (noError === true)
            {
                if (datatype !== undefined && guid !== undefined)
                {
                    var fileInfo = {
                        datatype: datatype,
                        catid: catid,
                        guid: guid
                    }
                    //notify the appstudio, and other subscribers - so they can update their UI
                    $.event.trigger({ type: "appstudio.designer.save", fileInfo: fileInfo }, null, document);
                }
            }
        },

        _onWizardFinish: function (e, options)
        {
            //AuthenticatedPaneContainer is in AppStudio (global)
            $("#AuthenticatedPaneContainer").off("panecontainerresize.positionHandlers");

            //Navigation panel is in AppStudio (global)
            this.element.find("#NavigationPanel").off("navigationpanelcollapse.positionHandlers");
            this.element.find("#NavigationPanel").off("navigationpanelexpand.positionHandlers");

            if (this.CheckOut._checkViewStatus(true))
            {
                this.ViewDesigner._BuildViewXML();
                var viewType = this.ViewDesigner._getViewType();

                var stepIndex = this.wizard.wizard("stepindex");

                switch (stepIndex)
                {
                    case this.GENERAL_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                this.ViewDesigner._hideDetails();
                                break;
                        }
                        break;
                    case this.RULES_STEP_INDEX:
                        switch (viewType)
                        {
                            case 'Capture':
                            case 'CaptureList':
                                this.ViewDesigner._hideViewCanvas();
                                var invalidEventsExist = this._validateEvents();
                                if (invalidEventsExist)
                                {
                                    this._onFinishComplete(false);
                                    this.wizard.wizard("step", this.RULES_STEP_INDEX);
                                    popupManager.showWarning(Resources.ViewDesigner.InvalidEventsMsg);
                                    return false;
                                }

                                break;
                        }
                        break;
                }

                //Save the View (if in edit mode)
                if (this.IsViewEdit !== 'True')
                {
                    var result = this.SelectedFinishType === 1;
                    this.AJAXCall._saveView(result, result, this._onFinishComplete.bind(this));
                }
                else
                {
                    this.wizard.wizard("finishComplete");
                }
            }
        },

        //if the save+finish was successful - called by view.ajaxcall.js (saveView)
        _onFinishComplete: function (noError, datatype, guid, catid)
        {


            if (noError === true)
            {
                //go to the last step - without validation.
                // this.wizard.wizard("gotoLastStep");
                // this.wizard.wizard("disableWizard");
                this.wizard.wizard("finishComplete", function ()
                {
                    if (datatype !== undefined && guid !== undefined)
                    {
                        var fileInfo = {
                            datatype: datatype,
                            catid: catid,
                            guid: guid
                        }
                        //make sure the appstudio knows that we've finished and can navigate to the next place.
                        $.event.trigger({ type: "appstudio.designer.finish", fileInfo: fileInfo }, null, document);
                    }
                });

            }
            else
            {
                this.wizard.wizard("finishCancel");
            }
        },


        _onWizardHelp: function ()
        {
            var $wizard = this.wizard.data("ui-wizard");

            var currentStep = $wizard.steps.filter(".active")[0].attributes.id.value.replace("ViewWizard_", "").replace("Step", "");
            var stepIndex = $wizard.steps.index($wizard.steps.filter(".active")[0]);
            var helpID = 7012;

            switch (stepIndex)
            {
                case 4: helpID = 7065; break;
            }

            if (currentStep === "Rules")
                helpID = 7022;

            if (this._getViewType() === "CaptureList")
            {
                if (stepIndex === 2)
                {
                    helpID = 7048;
                }
                else if (stepIndex === 3)
                {
                    if (this.element.find("#vdchkEnableListEditing").is(":checked"))
                    {
                        helpID = 7050;
                    }
                    else
                    {
                        helpID = 7012;
                    }
                }
            }
            HelpHelper.runHelp(helpID);
        },

        _cancelViewDesigner: function ()
        {
            var catId = _view.SelectedCategoryIdOriginal;
            if (!checkExists(catId))
            {
                catId = _view.SelectedCategoryId;
            }
            SourceCode.Forms.Interfaces.AppStudio.CancelDesigner(catId);
        },

        _addActionToolbarEvents: function ()
        {
            var jqScope = this.element;
            var toolAddAction = jqScope.find('#toolAddAction');
            var toolEditAction = jqScope.find('#toolEditAction');
            var toolRemoveAction = jqScope.find('#toolRemoveAction');
            var toolEnableRule = jqScope.find('#vdToolEnableRule, #vdToolLayoutEnableRule');
            var toolDisableRule = jqScope.find('#vdToolDisableRule, #vdToolLayoutDisableRule');

            toolAddAction.on("click", function ()
            {
                _view.ViewDesigner._doAddViewAction(toolAddAction);
            });

            toolEditAction.on("click", function ()
            {
                _view.ViewDesigner._doEditViewAction(toolEditAction);
            });

            toolRemoveAction.on("click", function ()
            {
                _view.ViewDesigner._doRemoveViewAction(toolRemoveAction);
            });

            toolEnableRule.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var gridOptions = [];
                    var grid = _view._getTargetGrid();
                    var selectedRuleID;

                    selectedRuleID = _view.currentGridObject.getSelectedID(grid);


                    if (checkExists(selectedRuleID) && selectedRuleID !== "")
                    {
                        _view.currentGridObject.setRuleState(grid, _view.viewDefinitionXML, "True");
                        if (grid.is("#pgRuleList"))
                        {
                            var element = grid.find(".radiobox > ul > li > label.radiobox-button.checked");
                            element.removeClass("disabled-rule");
                            element.closest("li").find(".radiobox-button-icon").removeClass("disabled-rule");
                        }

                        if (_view.element.find('#vdViewEditorFormsTab').hasClass('selected') && _view.isViewEventsLoading === false && _view.wizard.wizard("stepindex") === _view.RULES_STEP_INDEX)
                        {
                            _view.isViewEventsLoading = true;
                            setTimeout(function () { _view.ViewDesigner._LoadViewEvents(false); }, 0);

                            if (_view._findControlFromSelectedObject().hasClass("controlwrapper"))
                            {
                                gridOptions.controlID = _view._findControlFromSelectedObject().attr("ID");
                            }
                        }

                        // Set toolbar states
                        _view.activateDisableButton(grid);

                        SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
                    }
                }
            });

            toolDisableRule.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var gridOptions = [];
                    var grid = _view._getTargetGrid();
                    var selectedRuleID;

                    selectedRuleID = _view.currentGridObject.getSelectedID(grid);

                    if (checkExists(selectedRuleID) && selectedRuleID !== "")
                    {
                        _view.currentGridObject.setRuleState(grid, _view.viewDefinitionXML, "False");
                        if (grid.is("#pgRuleList"))
                        {
                            var element = grid.find(".radiobox > ul > li > label.radiobox-button.checked");
                            element.addClass("disabled-rule");
                            element.closest("li").find(".radiobox-button-icon").addClass("disabled-rule");
                        }

                        if (_view.element.find('#vdViewEditorFormsTab').hasClass('selected') && _view.isViewEventsLoading === false && _view.wizard.wizard("stepindex") === _view.RULES_STEP_INDEX)
                        {
                            _view.isViewEventsLoading = true;
                            setTimeout(function () { _view.ViewDesigner._LoadViewEvents(false); }, 0);

                            if (_view._findControlFromSelectedObject().hasClass("controlwrapper"))
                            {
                                gridOptions.controlID = _view._findControlFromSelectedObject().attr("ID");
                            }
                        }

                        // Set toolbar states
                        _view.activateEnableButton(grid);

                        SourceCode.Forms.Designers.resizeToolBarButtons("vdFormEventsTabGrid");
                    }
                }
            });

            var toolFormEventsTabAdd = _view.element.find('#vdtoolFormEventsTabAdd');
            var toolFormEventsTabEdit = _view.element.find('#vdtoolFormEventsTabEdit');
            var toolFormEventsTabDelete = _view.element.find('#vdtoolFormEventsTabDelete');

            var tabGrid = _view.element.find("#vdFormEventsTabGrid");

            tabGrid.children(".grid-toolbars").find(".toolbar-button.add").on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    if (checkExists(_view.selectedObject) && _view.selectedObject.hasClass('controlwrapper'))
                    {
                        _view.ViewDesigner._doAddControlAction(this);
                    }
                    else
                    {
                        _view.ViewDesigner._doAddViewAction(this);
                    }
                }
            });

            tabGrid.children(".grid-toolbars").find(".toolbar-button.edit").on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var jq_this = $(this);
                    if (!jq_this.hasClass("disabled") && _view.viewEventsGrid.grid("fetch", "selected-rows").length > 0)
                    {
                        var rule = _view.viewEventsGrid.grid("fetch", "selected-rows", "objects")[0];
                        var ev = _view.viewDefinitionXML.selectSingleNode("//Events/Event[@ID='" + rule[0].value + "']");
                        var selectedObjectID = _view._findControlFromSelectedObject().attr("id");

                        if (checkExists(ev) && ev.getAttribute("SourceType") === "Control" && ev.getAttribute("SourceID") === selectedObjectID)
                        {
                            _view.ViewDesigner._doEditControlAction(this);
                        }
                        else
                        {
                            _view.ViewDesigner._doEditViewAction(this);
                        }
                    }
                }
            });

            tabGrid.children(".grid-toolbars").find(".toolbar-button.delete").on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var jq_this = $(this);
                    arguments[0].stopPropagation();
                    if (!jq_this.hasClass("disabled") && _view.viewEventsGrid.grid("fetch", "selected-rows").length > 0)
                    {
                        var rule = _view.viewEventsGrid.grid("fetch", "selected-rows", "objects")[0];
                        var ev = _view.viewDefinitionXML.selectSingleNode("//Events/Event[@ID='" + rule[0].value + "']");

                        if (checkExists(ev) && ev.getAttribute("SourceType") === "Control")
                        {
                            _view.ViewDesigner._doRemoveControlAction(this);
                        }
                        else
                        {
                            _view.ViewDesigner._doRemoveViewAction(this);
                        }
                    }
                }
            });
        },

        _addToolbarEvents: function ()
        {
            var jqScope = this.element;
            var toolInsertRowAbove = jqScope.find('#toolInsertRowAbove');
            var toolInsertRowBelow = jqScope.find('#toolInsertRowBelow');
            var toolInsertColLeft = jqScope.find('#toolInsertColLeft');
            var toolInsertColRight = jqScope.find('#toolInsertColRight');
            var toolMergeCellRight = jqScope.find('#toolMergeCellRight');
            var toolMergeCellBelow = jqScope.find('#toolMergeCellBelow');
            var toolClearCell = jqScope.find('#toolClearCell');
            var toolClearRow = jqScope.find('#toolClearRow');
            var toolRemoveCol = jqScope.find('#toolRemoveCol');
            var toolRemoveRow = jqScope.find('#toolRemoveRow');

            var toolCellLeftAlign = jqScope.find('#toolCellLeftAlign');
            var toolCellCenterAlign = jqScope.find('#toolCellCenterAlign');
            var toolCellRightAlign = jqScope.find('#toolCellRightAlign');

            var toolCellTopAlign = jqScope.find('#toolCellTopAlign');
            var toolCellMiddleAlign = jqScope.find('#toolCellMiddleAlign');
            var toolCellBottomAlign = jqScope.find('#toolCellBottomAlign');

            var toolEditCellProp = jqScope.find('#toolEditCellProp');
            var toolEditTableProp = jqScope.find('#toolEditTableProp');
            var toolAutoGenerate = jqScope.find('#toolAutoGenerate');

            var toolDefaultCanvas = jqScope.find('#toolDefaultCanvas');

            var toolUnbindControl = jqScope.find('#toolUnbindControl');            

            var _tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
            toolInsertRowAbove.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _tableBehavior._addRow({ position: 'before', contextobject: _view.selectedObject }, SourceCode.Forms.Designers.View);

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolInsertRowBelow.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _tableBehavior._addRow({ position: 'after', contextobject: _view.selectedObject }, SourceCode.Forms.Designers.View);

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolInsertColLeft.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _view._insertColumn("left");

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolInsertColRight.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _view._insertColumn("right");

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolMergeCellRight.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _tableBehavior._mergeRight(_view.selectedObject, SourceCode.Forms.Designers.View);

                    _view.propertyGrid.refresh();

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolMergeCellBelow.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._mergeBottom(_view.selectedObject, SourceCode.Forms.Designers.View); });
            toolClearCell.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.ViewDesigner.DesignerTable._delegateClearCell(_view.selectedObject); });
            toolClearRow.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._clearRow(_view.selectedObject, SourceCode.Forms.Designers.View); });
            toolRemoveCol.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _tableBehavior._removeColumn(_view.selectedObject, SourceCode.Forms.Designers.View);

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolRemoveRow.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _tableBehavior._removeRow(_view.selectedObject, SourceCode.Forms.Designers.View);

                    SourceCode.Forms.Designers.Common.triggerEvent("TableColumnSizeChanged");
                }
            });
            toolCellLeftAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setAlignment('Left', _view.selectedObject, SourceCode.Forms.Designers.View); });
            toolCellCenterAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setAlignment('Center', _view.selectedObject, SourceCode.Forms.Designers.View); });
            toolCellRightAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setAlignment('Right', _view.selectedObject, SourceCode.Forms.Designers.View); });

            toolCellTopAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setVerticalAlignment('Top', _view.selectedObject, SourceCode.Forms.Designers.View); });
            toolCellMiddleAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setVerticalAlignment('Middle', _view.selectedObject, SourceCode.Forms.Designers.View); });
            toolCellBottomAlign.on("click", function () { if (_view.CheckOut._checkViewStatus()) _tableBehavior._setVerticalAlignment('Bottom', _view.selectedObject, SourceCode.Forms.Designers.View); });

            toolEditCellProp.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.View._showCellProperties(); });
            toolEditTableProp.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.View._showCanvasProperties(); });
            toolAutoGenerate.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    AutoGenerateViewPopup.show(_view.SelectedViewType);
                }
            });

            jqScope.find("#toolInsertTable").on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    _view._createBlankLayout();
                }
            });

            toolDefaultCanvas.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var options = ({
                        message: Resources.ViewDesigner.DefaultCanvasMsg,
                        iconClass: "warning",
                        onAccept: function ()
                        {
                            _view._toolDefaultCanvasClearAcceptHandler();
                        }.bind(_view)
                    });
                    popupManager.showConfirmation(options);
                }
            }.bind(_view));

            toolUnbindControl.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus()) _view.ViewDesigner._showUnbindConfirmation();
            });

            jqScope.find("#toolViewSettings").on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    if (_view.layoutExists())
                    {
                        _view.ViewDesigner._BuildViewXML();
                    }
                    ViewSettingsPopup.show("CaptureList");
                }
            });

            var toolExpressions = jqScope.find("#toolExpressions");
            var toolItalic = jqScope.find('#toolItalic');
            var toolUnderline = jqScope.find('#toolUnderline');
            var toolBold = jqScope.find('#toolBold');
            var toolTextColor = jqScope.find('#toolTextColor');
            var toolHightlightColor = jqScope.find('#toolHightlightColor');
            var toolLeftAlign = jqScope.find('#toolLeftAlign');
            var toolCenterAlign = jqScope.find('#toolCenterAlign');
            var toolRightAlign = jqScope.find('#toolRightAlign');
            var toolJustify = jqScope.find('#toolJustify');
            var toolInsertImage = jqScope.find('#toolInsertImage');
            var toolControlCalculation = jqScope.find('#toolControlCalculation');
            //var toolProperties = jqScope.find('#toolProperties');
            var toolEditStyle = jqScope.find('#toolEditStyle');
            var toolChangeControl = jqScope.find('#toolChangeControl');
            var toolFitToCell = jqScope.find('#toolFitToCell');

            toolItalic.on("click", function () { });
            toolUnderline.on("click", function () { });
            toolBold.on("click", function () { });
            toolTextColor.on("click", function () { });
            toolHightlightColor.on("click", function () { });
            toolLeftAlign.on("click", function () { });
            toolCenterAlign.on("click", function () { });
            toolRightAlign.on("click", function () { });
            toolJustify.on("click", function () { });
            toolInsertImage.on("click", function () { });
            toolControlCalculation.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.Conditions._showControlCalculation(); });
            toolExpressions.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.Conditions._showExpressions(); });
            //toolProperties.click', function() { if (_view.CheckOut._checkViewStatus()) _view.ViewDesigner._showControlProperties(); });
            toolEditStyle.on("click", function ()
            {
                if (_view.CheckOut._checkViewStatus())
                {
                    var options =
                        {
                            propertySelector: "#ControlTabsContent .{0}-property{1}"
                        };
                    _view.Styles._showEditStyles(options);
                }
            });
            toolChangeControl.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.ViewDesigner._showChangeControl(); });
            toolFitToCell.on("click", function () { if (_view.CheckOut._checkViewStatus()) _view.ViewDesigner._controlFitToCell(); });
        },

        _insertColumn: function (insertPosition)
        {
            var _tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
            var rtl = document.documentElement.getAttribute("dir") === "rtl" || false;
            var position;

            if (insertPosition == "left")
            {
                position = rtl ? "after" : "before";
            }
            else
            {
                position = rtl ? "before" : "after";
            }

            _tableBehavior._addColumn({ position: position, contextobject: _view.selectedObject }, SourceCode.Forms.Designers.View);
        },

        _toolDefaultCanvasClearAcceptHandler: function ()
        {
            _view._updateTableSize();

            popupManager.closeLast();

            _view.clearView();

            _view.controlTypeIndexes.length = 0;

            _view.element.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");

            _view.ViewDesigner._configSelectedControl(_view.canvas.find("[controlType = 'View']"));
            _view.ViewDesigner.controlSelected = true;
        },

        //initialize the tree inside the category picker (general tab)
        _initializeCategoryTree: function ()
        {
            if ($chk(_view.SelectedSmartObjectGuid) === true)
            {
                _view.element.find("#vdsmartObjectID").val(_view.SelectedSmartObjectGuid);
            }


            //initialize old events tree (deprecated)
            //BUG 720782: ViewEventsTree is NULL.
            // var vthtml = "<ul class=\"tree collapsed-root\"><li class=\"root open children\"><a href=\"javascript:;\">" + Resources.ViewDesigner.FormEvents + "</a></li></ul>";
            // var eventsCategoryTree = _view.element.find("#vdcontrolFormEventsActionsTree");
            // _view.viewEventsTree = $(vthtml).appendTo(eventsCategoryTree).tree({
            // 	select: _view.ViewDesigner._selectViewEventTreeNode
            // });
        },

        _rulesActionRowClick: function ()
        {
            if (_view.CheckOut._checkViewStatus())
            {
                if (checkExists(_view.selectedObject) && _view.selectedObject.hasClass('controlwrapper'))
                {
                    _view.ViewDesigner._doAddControlAction(this);
                }
                else
                {
                    _view.ViewDesigner._doAddViewAction(this);
                }
            }
        },

        _initializeRulesTabGrid: function ()
        {
            var viewEventsGridEventOptions = {
                multiselect: false,
                autopopulate: false,
                rowselect: _view.ViewDesigner._selectViewAction,
                rowunselect: _view.ViewDesigner._unselectViewAction,
                rowdblclick: _view.ViewDesigner._doEditViewAction,
                actionrowclick: _view._rulesActionRowClick,
                zebraStripes: false
            };

            _view.viewEventsGrid = _view.element.find("#vdFormEventsTabGrid").grid(viewEventsGridEventOptions);

            _view.viewEventsGrid.find(".grid-body").disableSelection();

            SourceCode.Forms.RuleGrid.refresh(_view.viewEventsGrid, _view.viewDefinitionXML);

            _view.viewEventsGrid.children(".grid-toolbars").find(".toolbar-button.edit, .toolbar-button.delete").addClass("disabled");

            if (_view.viewEventsGrid.is(":visible")) _view.viewEventsGrid.grid("synccolumns");
        },

        _initToolbar: function ()
        {
            var jqScope = _view.element;
            jqScope.find("#vdViewEditorToolbarGroup").toolbargroup();
            jqScope.find("#vdViewEditorToolbarGroup").toolbargroup("hideAllButtons"); //Added to make this simpler.
        },

        _initializeViewActionsListTable: function ()
        {
            _view.viewActionsListTable = _view.element.find("#pgRuleList").grid();
            _view.viewActionsListTable.find(".grid-body").disableSelection();
        },

        _savePaneSizePreference: function (ev)
        {
            ev.stopPropagation();

            //TFS 720744 & 731081
            $.ajax({
                cache: false,
                data: {
                    action: "settings",
                    settings: [
                        {
                            name: "ViewDesignerToolboxPaneWidth",
                            value: $("#vdeditorToolboxPane").width() + "px"
                        },
                        {
                            name: "ViewDesignerLeftToolboxPaneWidth",
                            value: $("#vdToolboxPane").width() + "px"
                        }
                    ]
                },
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST"
            });
        },

        _findControlFromSelectedObject: function ()
        {
            var control = null;
            if (checkExists(_view.selectedObject))
            {
                control = $(_view.selectedObject);
                if (_view.selectedObject.hasClass("header") && _view.SelectedViewType === 'CaptureList')
                {
                    if (_view.element.find('#vdColumnTabPropertiesTab').is('.selected'))
                    {
                        control = _view.selectedObject;
                    }
                    else if (_view.element.find('#vdControlTabPropertiesTab').is('.selected'))
                    {
                        control = _view.selectedObject.find("div.controlwrapper");
                    }
                    else if (_view.element.find('#vdBodyTabPropertiesTab').is('.selected'))
                    {
                        control = _view.getSelectedBodyControl();
                    }
                }
            }
            return control;
        },

        getSelectedBodyControl: function ()
        {
            var cellIndex = _view.selectedObject[0].cellIndex;
            var editableColumn = $("#bodySection table.editor-table>tbody>tr.editor-row:nth-child(2)>td:nth-child(" + (cellIndex + 1) + ")");
            return editableColumn.find("div.controlwrapper");
        },

        _clearControlBindings: function (options)
        {
            if (!checkExists(options))
            {
                options = {};
            }

            var controlNodes = _view.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@FieldID or Properties/Property[Name='DisplayField']]");
            for (var i = 0; i < controlNodes.length; i++)
            {
                var controlNode = controlNodes[i];
                var controlHtml = $("#{0}".format(controlNode.getAttribute("ID")));

                options.control = controlHtml;
                _view.ViewDesigner._unbindControl(options);
            }
        },

        //removes a control and any children from the UI and from the Xml (data).
        //Public Method - Used by Designers.Common.
        removeControl: function (jqControl)
        {
            var $controls = jqControl.find('.form-control');
            if (jqControl.is(".form-control")) $controls.add(jqControl);
            //TODO: implement removing the control and its children.

            var $this = this;
            $controls.each(function ()
            {
                $this.ViewDesigner._removeControl($(this));
            });
        },

        updateSMOLookup: function (e, val)
        {
            var catValue = this.catLookup.categorylookup("value");
            var smoValue = this.smoLookup.categorylookup("value");
            var catLookupVal = catValue.path;
            var smoLookupVal = smoValue.path;
            var cname = smoValue.catname;
            var cid = smoValue.catid;
            var cobjecttype = smoValue.objecttype;
            var cobjectid = smoValue.objectid;

            if ((checkExists(smoLookupVal)) && (checkExists(catLookupVal)))
            {
                this.smoLookup.categorylookup("value", { catid: cid, catname: cname, objectid: cobjectid, objecttype: cobjecttype });
            }
        },

        updateCategoryLookup: function (e, val)
        {
            var smoLookupVal = this.smoLookup.categorylookup("value").path;
            var catLookupVal = this.smoLookup.categorylookup("value").path;
            var cname = this.smoLookup.categorylookup("value").catname;
            var cid = this.smoLookup.categorylookup("value").catid;

            if ((checkExists(smoLookupVal)) && (checkExists(catLookupVal)))
            {
                this.catLookup.categorylookup("value", { catid: cid, catname: cname });
            }
        },

        //when category picker (on general step) is changed.
        //"this" will refer to the category picker here.
        changeCategory: function (e, val)
        {
            var existingCategoryValue = this.element.find("#viewcategoryId").val();
            var catid = $.isEmptyObject(val) ? "" : val.catid;
            var catpath = $.isEmptyObject(val) ? "" : val.path;

            //hidden input fields in general tab.
            this.element.find("#viewcategoryId").val(catid);
            this.element.find("#viewcategoryPath").val(catpath);

            //update which buttons/wizard steps are enablked.
            this.ViewDesigner._doViewNameValidation();

            //store info in the view.
            this.SelectedCategoryId = catid;
            this.SelectedCategoryPath = catpath;
        },

        //When the smo picker on the general Step is changed
        //"this" will refer to the category picker control
        changeDataSource: function (e, val)
        {
            var existingValue = this.element.find("#vdsmartObjectID").val();
            var newSourceId = !$.isEmptyObject(val) ? val.objectid : "";
            var sourceDataCollection = [];
            if (existingValue !== "" && this.layoutExists() && existingValue !== newSourceId)
            {
                sourceDataCollection = SourceCode.Forms.Designers.getDependencyDataCollectionForPrimarySource(existingValue, newSourceId);
            }

            if (newSourceId !== "")
            {
                this.element.find("#smocategoryId").val(val.catid);
                this.element.find("#smocategoryPath").val(val.path);

                if (existingValue !== newSourceId)
                {
                    this.element.find("#smocategoryId").val(val.catid);
                    this.element.find("#smocategoryPath").val(val.path);
                    if (existingValue === "")
                    {
                        //Add new datasource, no previous datasource was defined
                        this.element.find("#vdsmartObjectID").val(newSourceId);
                        this.ViewDesigner._clickSoTree(false);
                    }
                    else if (this.layoutExists())
                    {
                        //Update existing datasource
                        popupManager.showConfirmation({
                            message: Resources.ViewDesigner.WarningChangingDataSourceText,
                            iconClass: "warning",
                            onAccept: function ()
                            {
                                this._updateViewPrimaryDataSource(newSourceId, sourceDataCollection);
                            }.bind(this),
                            onDecline: function ()
                            {
                                this._loadDataSourceLookupValue(existingValue);
                                popupManager.closeLast();
                            }.bind(this),
                        });
                    }
                    else
                    {
                        this.element.find("#vdsmartObjectID").val(newSourceId);
                        this.ViewDesigner._clickSoTree(false);
                    }
                }
            }
            else
            {
                //Primary source has been removed
                if (existingValue !== "" && this.layoutExists())
                {
                    popupManager.showConfirmation({
                        message: Resources.ViewDesigner.WarningClearingDataSourceText,
                        iconClass: "warning",
                        onAccept: function ()
                        {
                            this._removeViewPrimaryDataSource(sourceDataCollection);
                        }.bind(this),
                        onDecline: function ()
                        {
                            this._loadDataSourceLookupValue(existingValue);
                            popupManager.closeLast();
                        }.bind(this)
                    });
                }
                else
                {
                    this.element.find("#vdsmartObjectID").val("");
                    this.AJAXCall._clearDataSource();
                    this.ViewDesigner._clearSelectedFields();
                }
            }
            this.SelectedSMOCategoryId = this.element.find("#smocategoryId").val();
            this.SelectedSMOCategoryPath = this.element.find("#smocategoryPath").val();

            //update the wizard steps and button states.
            this.ViewDesigner._configureOptionsStep();
        },

        _removeViewPrimaryDataSource: function (oldSourceDependencies)
        {
            popupManager.closeLast();
            _view.element.find("#vdsmartObjectID").val("");
            _view.AJAXCall._clearDataSource();
            _view.ViewDesigner._clearSelectedFields();
            //Annotate and badge dependencies to removed data source
            _view._annotateAndBadgeDataSourceDependencies(oldSourceDependencies);
        },

        _updateViewPrimaryDataSource: function (newSourceId, sourceDataCollection)
        {
            _view.element.find("#vdsmartObjectID").val(newSourceId);
            popupManager.closeLast();

            //_clickSoTree() unbinds the fields from the control and annotation should happen only after the fields unbind.
            _view.ViewDesigner._clickSoTree(true);

            //Annotate and badge dependencies to old data source
            _view._annotateAndBadgeDataSourceDependencies(sourceDataCollection);
        },

        _annotateAndBadgeDataSourceDependencies: function (sourceDataCollection)
        {
            if (sourceDataCollection.length > 0)
            {
                var dataSourceDependencies = SourceCode.Forms.Designers.getDependencies(sourceDataCollection);

                if (dataSourceDependencies.length > 0)
                {
                    //Annotate dependent items
                    SourceCode.Forms.Designers.annotateDependentItems(dataSourceDependencies);
                }
            }
            //Badge designer elements
            SourceCode.Forms.Designers.Common.refreshBadges();
        },

        layoutExists: function ()
        {
            return $("#bodySection").find(".editor-table").length > 0;
        },

        editableTableExists: function ()
        {
            return $("#editableSection").find("table.capturelist-editor-table").length > 0;
        },

        clearView: function (fakeDrop)
        {
            _view.editorpanelcontainer.modalize(true);
            _view.editorpanelcontainer.showBusy(true);

            // clear UI
            _view.ViewDesigner._setDefaultSelectedObject();
            _view.ViewDesigner._ClearViewControls();
            _view.ViewDesigner._ClearViewControlProperties();

            _view.controlTypeIndexes.length = 0;

            var eventNodes = _view.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event");

            if (!$('#bodySection').hasClass("empty") && eventNodes.length > 0 && !fakeDrop)
            {
                if (eventNodes.length > 0)
                {
                    var len = eventNodes.length;
                    for (var i = 0; i < len; i++)
                    {
                        eventNodes[i].parentNode.removeChild(eventNodes[i]);
                    }
                }
            }

            var sourceNodes = _view.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Sources/Source");
            if (!$('#bodySection').hasClass("empty") && sourceNodes.length > 0 && !fakeDrop)
            {
                if (sourceNodes.length > 0)
                {
                    var len = sourceNodes.length;
                    var viewSmo = _view.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View").getAttribute("SOID");
                    for (var i = 0; i < len; i++)
                    {
                        //Remove all Sources except the one referenced by the view
                        if (viewSmo != sourceNodes[i].getAttribute("SourceID"))
                        {
                            sourceNodes[i].parentNode.removeChild(sourceNodes[i]);
                        }
                    }
                }
            }

            SourceCode.Forms.Designers.Common.refreshBadges();

            // clear html
            var jqScope = _view.element;
            jqScope.find("#toolbarSection").empty();
            jqScope.find("#bodySection").empty();
            jqScope.find("#editableSection").empty();
            jqScope.find('#vdToolEnableRule, #vdToolLayoutEnableRule, #vdToolDisableRule, #vdToolLayoutDisableRule, #vdRuleEnabledDivider, #vdRuleLayoutEnabledDivider').addClass("hidden");

            _view._initializeToolbarLayoutOptions(true);
            _view.ViewDesigner._configureOptionsStep(_view.wizard.wizard("getStep", _view.layoutStep));

            _view.editorpanelcontainer.modalize(false);
            _view.editorpanelcontainer.showBusy(false);

            SourceCode.Forms.Designers.Common.triggerEvent("CanvasCleared");
        },

        _setSelectedOptions: function ()
        {
            var xpath = "SourceCode.Forms/Views/View/Controls/Control[@Type='View']/Properties/Property[Name='{0}']";

            var node = _view.viewDefinitionXML.selectSingleNode(xpath.format("ListEditable"));
            if (checkExists(node))
            {
                _view.selectedOptions.EnableListEditing = true;
                var value = node.childNodes[1].text;
                if (value.toLowerCase() === "all")
                {
                    _view.selectedOptions.EditAllRows = true;
                }
                else
                {
                    _view.selectedOptions.EditAllRows = false;
                }
            }
            else
            {
                _view.selectedOptions.EnableListEditing = false;
            }

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("AlternateRows"));
            if (checkExists(node))
            {
                _view.selectedOptions.ShadeAlternatingRows = true;
            }
            else
            {
                _view.selectedOptions.ShadeAlternatingRows = false;
            }

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("BoldHeadings"));
            if (checkExists(node))
            {
                _view.selectedOptions.BoldHeadings = true;
            }
            else
            {
                _view.selectedOptions.BoldHeadings = false;
            }

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("FilterDisplay"));
            if (checkExists(node))
            {
                _view.selectedOptions.EnableFiltering = true;
            }
            else
            {
                _view.selectedOptions.EnableFiltering = false;
            }

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("PageSize"));
            if (checkExists(node))
            {
                _view.selectedOptions.EnablePaging = true;
                var pageCount = parseInt(node.childNodes[1].text);
                if (!isNaN(pageCount))
                {
                    _view.selectedOptions.PagingCount = pageCount;
                }
                else
                {
                    _view.selectedOptions.PagingCount = 10;
                }
            }
            else
            {
                _view.selectedOptions.EnablePaging = false;
            }

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("ShowAddRow"));
            if (checkExists(node))
            {
                _view.selectedOptions.EnableAddRowLink = true;
            }
            else
            {
                _view.selectedOptions.EnableAddRowLink = false;
            }

            _view.selectedOptions.Multiselect = true;
            _view.selectedOptions.CellContentSelect = false;

            node = _view.viewDefinitionXML.selectSingleNode(xpath.format("CellContentSelectAllowed"));
            if (checkExists(node))
            {
                var valueNode = node.selectSingleNode("Value");

                if (checkExists(valueNode) && checkExistsNotEmpty(valueNode.text))
                {
                    _view.selectedOptions.CellContentSelect = (valueNode.text.toString().toUpperCase() === "TRUE");
                }
            }
        },

        _configureDesignerTables: function ()
        {
            var jq_tables = this.element.find('.editor-table:not(div[layout="ToolbarTable"] > .editor-table)');
            var tablesLength = jq_tables.length;

            //Add drag handlers for each columns for each .editor-tables
            for (var t = 0; t < tablesLength; t++)
            {
                var jq_table = $(jq_tables[t]);
                var tableID = jq_table.attr("id");

                //[895427] Table Controls may have empty cells that are injected to the definition due dirty data issue (Not well-formed Table due to merge of cells),
                //however those empty cells won't have corresponding Control defintion yet as update script won't inject the Control definition for these empty cells.  
                //Ensure ViewDefinition is up to date when calling _attachColumnGroupColumns().
                this.DesignerTable._attachColumnGroupColumns(tableID);
            }

            //Add hover states
            this.DesignerTable._addTableControlHoverStates($('.editor-table'));

            //For columns that are configured less than 40px we need to display those columns as 40px in design time
            this.DesignerTable.normalizeTables();
        },

        _initSummaryStep: function ()
        {
        }
    };

    $(document).ready(function ()
    {
        if (typeof SourceCode.Forms.Interfaces.AppStudio !== "undefined")
        {
            SourceCode.Forms.Interfaces.AppStudio.register("designer", "view", SourceCode.Forms.Designers.View);
        }
    });

})(jQuery);
