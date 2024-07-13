ViewSettingsPopup =
    {
        //
        // Fields
        //
        _listViewSettingsContent: null,
        _removeListEditingDependencies: false,
        _isAllowEditable: false,

        //
        // Private Methods
        //
        _togglePagingOptions: function (enable)
        {
            if (enable === true)
            {
                jQuery("#vdallowListViewPaging").checkbox("enable");
                jQuery("#vdtxtItemsPerPage").removeClass("disabled");
                if (jQuery("#vdallowListViewPaging").is(":checked") === true)
                {
                    jQuery("#vdtxtListViewLinesPerPage").textbox("enable");
                }
            }
            else
            {
                jQuery("#vdallowListViewPaging").checkbox("disable");
                jQuery("#vdtxtListViewLinesPerPage").textbox("disable");
                jQuery("#vdtxtItemsPerPage").addClass("disabled");
            }
        },

        _toggleEditOptions: function ()
        {
            var view = SourceCode.Forms.Designers.View;
            if (view.editableTableExists() && jQuery("#editableSection").is(":visible"))
            {
                jQuery("#chkEditableListOption").checkbox("check");
                jQuery("#chkShowAddRowExt").checkbox("enable");
                ViewSettingsPopup._isAllowEditable = true;
            }
            else
            {
                jQuery("#chkEditableListOption").checkbox("uncheck");
                jQuery("#chkShowAddRowExt").checkbox("disable");
                ViewSettingsPopup._isAllowEditable = false;
            }
        },

        _initializeControlsForListView: function ()
        {
            jQuery("#ListViewSettings").find(".expander-control").expander();

            // Style Expander
            jQuery("#vdchkShadeAlternatingRows").checkbox();
            jQuery("#vdchkBoldHeadingRow").checkbox();

            // Sort Expander
            jQuery("#vdbtnSortOptions").button();

            // Filter Expander
            jQuery("#vdbtnFilterOptions").button();

            if (this._hasGetListMethod())
            {
                jQuery("#vdbtnSortOptions").button("enable");
                jQuery("#vdbtnFilterOptions").button("enable");
            }
            else
            {
                jQuery("#vdbtnSortOptions").button("disable");
                jQuery("#vdbtnFilterOptions").button("disable");
            }

            // User Settings Expander_configure
            jQuery("#vdshowFilter").checkbox();
            jQuery("#vdallowListViewPaging").checkbox();
            jQuery("#vdtxtListViewLinesPerPage").textbox();
            jQuery("#chkMultiSelect").checkbox();
            jQuery("#chkCellContentSelect").checkbox();

            jQuery("#chkEditableListOption").checkbox();
            jQuery("#chkEditableListOption").checkbox("disable");

            jQuery("#chkShowAddRowExt").checkbox();
            jQuery("#chkShowAddRowExt").checkbox("disable");

            var view = SourceCode.Forms.Designers.View;
            jQuery('#vdallowListViewPaging').on("click", function (e)
            {
                if (SourceCode.Forms.Designers.View.CheckOut._checkViewStatus())
                {
                    view.ViewDesigner._toggleViewPaging(e);
                }
            });

            // sort options
            jQuery("#vdbtnSortOptions").on("click", function ()
            {
                if (view.CheckOut._checkViewStatus())
                {
                    view._showSortConfigOptions();
                }
            });

            jQuery("#vdbtnFilterOptions").on("click", function ()
            {
                if (view.CheckOut._checkViewStatus())
                {
                    view._showFilterConfigOptions();
                }
            });

            jQuery("#chkEditableListOption").on("click", function ()
            {
                if (view.CheckOut._checkViewStatus())
                {
                    var checkedState = jQuery("#chkEditableListOption").is(":checked");
                    if (checkedState === true)
                    {
                        jQuery("#vdallowListViewPaging").checkbox("uncheck");
                        jQuery("#chkShowAddRowExt").checkbox("enable");

                        ViewSettingsPopup._togglePagingOptions(false);
                    }
                    else
                    {
                        jQuery("#chkShowAddRowExt").checkbox("disable");

                        ViewSettingsPopup._togglePagingOptions(true);

                        if (view.layoutExists() && view.editableTableExists())
                        {
                            popupManager.showConfirmation({
                                message: Resources.ViewDesigner.ToggleListEditPrompt,
                                iconClass: "info",
                                onAccept: function ()
                                {
                                    ViewSettingsPopup._removeListEditingDependencies = true;
                                    popupManager.closeLast();
                                },
                                onDecline: function ()
                                {
                                    ViewSettingsPopup._removeListEditingDependencies = false;
                                    popupManager.closeLast();
                                }
                            });
                        }
                    }
                }
            });

            jQuery("#chkMultiSelect").on("click", function ()
            {
                if (view.CheckOut._checkViewStatus())
                {
                    var checkedState = jQuery("#chkMultiSelect").is(":checked");

                    if (checkedState === true)
                    {
                        view.selectedOptions.Multiselect = true;
                    }
                    else
                    {
                        view.selectedOptions.Multiselect = false;
                    }
                }
            });

            jQuery("#chkCellContentSelect").on("click", function ()
            {
                if (view.CheckOut._checkViewStatus())
                {
                    var checkedState = jQuery("#chkCellContentSelect").is(":checked");

                    if (checkedState === true)
                    {
                        view.selectedOptions.CellContentSelect = true;
                    }
                    else
                    {
                        view.selectedOptions.CellContentSelect = false;
                    }
                }
            });
        },

        _generateEditableTable: function ()
        {
            var colCount = jQuery("#bodySection").find("table.editor-table:first-child").find("colgroup>col").length;
            SourceCode.Forms.Designers.View.DesignerTable._generateEditableTable(colCount, true);
        },

        _initializeContentForListView: function ()
        {
            if (!checkExists(this._listViewSettingsContent))
            {
                this._listViewSettingsContent = jQuery("<div></div>");

                var settings = jQuery("#ListViewSettings");
                settings.remove();
                settings.appendTo(this._listViewSettingsContent);
            }
        },

        _initializeSettings: function ()
        {
            jQuery("#chkEditableListOption").checkbox("uncheck");
            jQuery("#vdchkShadeAlternatingRows").checkbox("uncheck");
            jQuery("#vdchkBoldHeadingRow").checkbox("uncheck");
            jQuery("#vdshowFilter").checkbox("uncheck");

            var view = SourceCode.Forms.Designers.View;

            jQuery("#vdtxtListViewLinesPerPage").val(view.selectedOptions.PagingCount);
            if (view.selectedOptions.EnablePaging === true)
            {
                jQuery("#vdallowListViewPaging").checkbox("check");
                jQuery("#vdtxtListViewLinesPerPage").textbox("enable");
            }
            else
            {
                jQuery("#vdallowListViewPaging").checkbox("uncheck");
                jQuery("#vdtxtListViewLinesPerPage").textbox("disable");
            }

            if (view.selectedOptions.EnableListEditing === true)
            {
                jQuery("#chkEditableListOption").checkbox("check");
                jQuery("#vdallowListViewPaging").checkbox("uncheck");
            }
            else
            {
                jQuery("#chkShowAddRowExt").checkbox("uncheck");
            }

            if (view.selectedOptions.Multiselect === true)
            {
                jQuery("#chkMultiSelect").checkbox("check")
            }
            else
            {
                jQuery("#chkMultiSelect").checkbox("uncheck");
            }

            if (view.selectedOptions.CellContentSelect === true)
            {
                jQuery("#chkCellContentSelect").checkbox("check")
            }
            else
            {
                jQuery("#chkCellContentSelect").checkbox("uncheck");
            }

            if (view.layoutExists())
            {
                this._togglePagingOptions(!view.selectedOptions.EnableListEditing);
            }

            if (view.selectedOptions.ShadeAlternatingRows)
            {
                jQuery("#vdchkShadeAlternatingRows").checkbox("check");
            }
            if (view.selectedOptions.BoldHeadings)
            {
                jQuery("#vdchkBoldHeadingRow").checkbox("check");
            }
            if (view.selectedOptions.EnableFiltering)
            {
                jQuery("#vdshowFilter").checkbox("check");
            }

            if (view.selectedOptions.AllowUserRefresh)
            {
                jQuery("#vdAllowUserReload").checkbox().checkbox("check");
            }

            if (view.selectedOptions.EnableAddRowLink)
            {
                jQuery("#chkShowAddRowExt").checkbox("check");
            }
            else
            {
                jQuery("#chkShowAddRowExt").checkbox("uncheck");
            }

            if (view.layoutExists())
            {
                var addRowSetting = view.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@Type='View']/Properties/Property[Name='ShowAddRow']/Name");
                if (!checkExists(addRowSetting))
                {
                    jQuery("#chkShowAddRowExt").checkbox("uncheck");
                }
                else
                {
                    jQuery("#chkShowAddRowExt").checkbox("check");
                }
            }

            var view = SourceCode.Forms.Designers.View;
            if (view.layoutExists())
            {
                jQuery("#chkEditableListOption").checkbox("enable");
                this._toggleEditOptions();
            }
        },

        _hasGetListMethod: function ()
        {
            var hasListMethod = false;
            var defXml = SourceCode.Forms.Designers.View.viewDefinitionXML;
            var initializeEvent = defXml.selectSingleNode("SourceCode.Forms/Views/View/Events/Event[@Type='User' and @SourceType='View'][Name='Init']");

            if (checkExistsNotEmpty(initializeEvent))
            {
                var getlistAction = initializeEvent.selectSingleNode("Handlers/Handler/Actions/Action[@Type='Execute'][Properties/Property[Name='Method']]");

                if (checkExistsNotEmpty(getlistAction))
                {
                    hasListMethod = true;
                }
            }

            return hasListMethod;
        },

        _setOptions: function ()
        {
            var view = SourceCode.Forms.Designers.View;
            if (jQuery("#chkEditableListOption").is(":checked"))
            {
                view.selectedOptions.EnableListEditing = true;
            }
            else
            {
                view.selectedOptions.EnableListEditing = false;
            }

            if (jQuery("#vdchkShadeAlternatingRows").is(":checked"))
            {
                view.selectedOptions.ShadeAlternatingRows = true;
            }
            else
            {
                view.selectedOptions.ShadeAlternatingRows = false;
            }

            if (jQuery("#vdchkBoldHeadingRow").is(":checked"))
            {
                view.selectedOptions.BoldHeadings = true;
            }
            else
            {
                view.selectedOptions.BoldHeadings = false;
            }

            if (jQuery("#vdshowFilter").is(":checked"))
            {
                view.selectedOptions.EnableFiltering = true;
            }
            else
            {
                view.selectedOptions.EnableFiltering = false;
            }

            if (jQuery("#vdallowListViewPaging").is(":checked"))
            {
                view.selectedOptions.EnablePaging = true;
            }
            else
            {
                view.selectedOptions.EnablePaging = false;
            }

            if (jQuery("#chkShowAddRowExt").is(":checked"))
            {
                view.selectedOptions.EnableAddRowLink = true;
            }
            else
            {
                view.selectedOptions.EnableAddRowLink = false;
            }

            view.selectedOptions.PagingCount = parseInt(jQuery("#vdtxtListViewLinesPerPage").val());
        },

        _removeListEditableEvents: function ()
        {
            var itemsRemoved = [];

            var view = SourceCode.Forms.Designers.View;
            var viewId = view.viewDefinitionXML.selectSingleNode("//Views/View").getAttribute("ID");
            var doubleClickEvent = view.viewDefinitionXML.selectSingleNode('//Views/View/Events/Event[Name/text()="ListDoubleClick" and (@SourceType="View") and(@Type="User") and (@SourceID="' + viewId + '") and Handlers/Handler/Actions/Action[@Type="List"]]');
            if (checkExists(doubleClickEvent))
            {
                itemsRemoved.push(
                    {
                        definitionId: doubleClickEvent.getAttribute("DefinitionID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                    });

                doubleClickEvent.parentNode.removeChild(doubleClickEvent);
            }

            var eventsNode = view.viewDefinitionXML.selectSingleNode("//Views/View/Events");
            var event = eventsNode.selectSingleNode("Event[Name='ListItemAdded']");
            if (checkExists(event))
            {
                itemsRemoved.push(
                    {
                        definitionId: event.getAttribute("DefinitionID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                    });

                event.parentNode.removeChild(event);
            }

            event = eventsNode.selectSingleNode("Event[Name='ListItemChanged']");
            if (checkExists(event))
            {
                itemsRemoved.push(
                    {
                        definitionId: event.getAttribute("DefinitionID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                    });

                event.parentNode.removeChild(event);
            }

            event = eventsNode.selectSingleNode("Event[Name='ListItemRemoved']");
            if (checkExists(event))
            {
                itemsRemoved.push(
                    {
                        definitionId: event.getAttribute("DefinitionID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                    });

                event.parentNode.removeChild(event);
            }

            var xpath = "//Views/View/Events/Event[Name='OnClick']/Handlers/Handler/Actions/Action[Properties/Property[Name='Method' and Value='{0}']]";
            var action = view.viewDefinitionXML.selectSingleNode(xpath.format("AddItem"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            action = view.viewDefinitionXML.selectSingleNode(xpath.format("EditItem"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            action = view.viewDefinitionXML.selectSingleNode(xpath.format("RemoveItem"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            xpath = "//Views/View/Events/Event[Name='OnClick']/Handlers/Handler/Actions/Action[@ItemState='{0}']";
            action = view.viewDefinitionXML.selectSingleNode(xpath.format("Added"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            action = view.viewDefinitionXML.selectSingleNode(xpath.format("Changed"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            action = view.viewDefinitionXML.selectSingleNode(xpath.format("Removed"));
            if (checkExists(action))
            {
                itemsRemoved.push(
                    {
                        id: action.getAttribute("ID"),
                        type: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    });

                action.parentNode.removeChild(action);
            }

            //Clean up empty rules
            var eventNodes = view.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event");

            var len = eventNodes.length;
            for (var i = 0; i < len; i++)
            {
                var eventNode = eventNodes[i];

                var actions = eventNode.selectNodes("Handlers/Handler/Actions/Action");
                if (actions.length === 0)
                {
                    itemsRemoved.push(
                        {
                            definitionId: eventNode.getAttribute("DefinitionID"),
                            type: SourceCode.Forms.DependencyHelper.ReferenceType.Event
                        });

                    eventNode.parentNode.removeChild(eventNode);
                }
            }

            SourceCode.Forms.Designers.annotateItemsRemoved(itemsRemoved);

            return itemsRemoved;
        },

        _onViewSettingsDialogOkClicked: function ()
        {
            var _this = this;

            var view = SourceCode.Forms.Designers.View;

            _this._setOptions();

            view.AJAXCall._saveUserSettings();

            view._applyAlternateRows();
            view.ViewDesigner._toggleListViewHeadersBold(view.selectedOptions.BoldHeadings);

            view.ViewDesigner._toggleListViewFilter(view.selectedOptions.EnableFiltering);
            view.ViewDesigner._toggleListViewPaging(!view.selectedOptions.EnableListEditing && view.selectedOptions.EnablePaging);

            // check editable state
            //only do these changes if the editable state changed:
            var editableStateChanged = ViewSettingsPopup._isAllowEditable !== ($("#chkEditableListOption").is(":checked") === true);
            if (editableStateChanged)
            {
                if (view.selectedOptions.EnableListEditing)
                {
                    view.DesignerTable._ensureEditRow();
                    jQuery("#editableSection").show();

                    var value = null;
                    if (view.selectedOptions.EditAllRows)
                    {
                        value = "all";
                    }
                    else
                    {
                        value = "single";
                    }

                    view.ViewDesigner._buildEditableListEvent("ListItemAdded", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Added);
                    view.ViewDesigner._buildEditableListEvent("ListItemChanged", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Changed);
                    view.ViewDesigner._buildEditableListEvent("ListItemRemoved", value === "single" ? true : false, Resources.ViewDesigner.ViewEvent_Removed);
                    view.DesignerTable._buildDoubleClickEvent();
                }
                else if (view.layoutExists() && view.editableTableExists())
                {
                    var controls = $("#editableSection").find(".controlwrapper");
                    var controlData = {};
                    var references = [];

                    for (var i = 0; i < controls.length; i++)
                    {
                        controlData =
                            {
                                itemId: controls[i].getAttribute('id'),
                                itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Control
                            };

                        references = references.concat(SourceCode.Forms.Designers.getDependencies(controlData));
                    }

                    if (ViewSettingsPopup._removeListEditingDependencies === true)
                    {
                        //Remove dependent items
                        SourceCode.Forms.Designers.removeDependentItemsAndAnnotateDependencies(references);

                        ViewSettingsPopup._removeListEditableEvents();
                    }
                    else
                    {
                        //Keep dependent items
                        SourceCode.Forms.Designers.annotateDependentItems(references);
                    }

                    jQuery("#editableSection").remove();

                    SourceCode.Forms.Designers.Common.refreshBadges();
                }
            }

            jQuery.popupManager.closeLast();

            if (checkExists(view.selectedObject) && view.selectedObject.length > 0)
            {
                var object = $(view.selectedObject);
                if (object.length > 0)
                {
                    view.ViewDesigner._setDefaultSelectedObject();
                    view.ViewDesigner.DesignerTable._setupColumnOverlay(object);
                    view.ViewDesigner._configSelectedControl(object);

                    view._updateOverlayComponents();

                    if (object.hasClass("editor-cell") && object.hasClass("header") && object.hasClass("droptarget"))
                    {
                        view.ViewDesigner.DragDrop._makeColumnHeaderDraggable(object);
                    }

                    view.ViewDesigner.DesignerTable._positionHandlers(object[0].cellIndex);
                }
            }
        },

        //
        // Public Methods
        //
        show: function (viewType)
        {
            var content = null;
            if (!checkExists(this._listViewSettingsContent) && viewType === SourceCode.Forms.Designers.ViewType.ListView)
            {
                this._initializeContentForListView();
            }
            content = this._listViewSettingsContent.children();
            var editableStateChanged = false;

            var _this = this;

            var buttons =
                [
                    {
                        type: "help",
                        click: function () { HelpHelper.runHelp(7069); }
                    },
                    {
                        text: Resources.WizardButtons.OKButtonText,
                        click: function ()
                        {
                            _this._onViewSettingsDialogOkClicked();
                        }
                    },
                    {
                        text: Resources.WizardButtons.CancelButtonText,
                        click: function ()
                        {
                            jQuery.popupManager.closeLast();
                        }
                    }];

            var options =
                {
                    id: "ViewSettingsDialog",
                    headerText: Resources.ViewDesigner.ViewSettingsHeader,
                    modalize: true,
                    maximizable: false,
                    draggable: true,
                    content: content,
                    width: 800,
                    height: 515,
                    buttons: buttons,
                    tag: this,
                    onShow: function (popup)
                    {
                        popup.options.tag._initializeControlsForListView();
                        popup.options.tag._initializeSettings();
                    },
                    onClose: function (popup, options)
                    {
                        popup.options.tag.cleanUp();
                    }
                };

            this._popup = jQuery.popupManager.showPopup(options);
        },

        cleanUp: function ()
        {
            var i = 0;
            var jqObj = null;

            //Clean up for Checkboxes
            var listOfCheckboxNames =
                [
                    "vdchkShadeAlternatingRows",
                    "vdchkBoldHeadingRow",
                    "vdshowFilter",
                    "vdallowListViewPaging",
                    "chkEditableListOption"
                ];

            for (i = 0; i < listOfCheckboxNames.length; i++)
            {
                jqObj = $("#" + listOfCheckboxNames[i]);

                jqObj.off();

                if (checkExists(jqObj.data("ui-checkbox")))
                {
                    jqObj.checkbox("destroy");
                }
            }

            //Clean up for Textboxes
            var listOfTextBoxNames = ["vdtxtListViewLinesPerPage"];

            for (i = 0; i < listOfTextBoxNames.length; i++)
            {
                jqObj = $("#" + listOfTextBoxNames[i]);

                jqObj.off();

                if (checkExists(jqObj.data("ui-textbox")))
                {
                    jqObj.textbox("destroy");
                }
            }

            //Cleanup for buttons
            var listOfButtonNames =
                [
                    "vdbtnSortOptions",
                    "vdbtnFilterOptions"
                ];

            for (i = 0; i < listOfButtonNames.length; i++)
            {
                jqObj = $("#" + listOfButtonNames[i]);

                jqObj.off();

                if (checkExists(jqObj.data("ui-button")))
                {
                    jqObj.button("destroy");
                }
            }

            if (checkExists(ViewSettingsPopup._listViewSettingsContent))
            {
                var divSettings = jQuery("#divSettings");
                if (checkExists(divSettings))
                {
                    ViewSettingsPopup._listViewSettingsContent.remove();
                    ViewSettingsPopup._listViewSettingsContent.appendTo(divSettings);
                }
            }

            ViewSettingsPopup._listViewSettingsContent = null;
        }
    }
