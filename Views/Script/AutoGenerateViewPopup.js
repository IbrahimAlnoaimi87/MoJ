AutoGenerateViewPopup =
{
    //
    // Fields
    //
    _viewType: null,
    _itemViewContent: null,
    _listViewContent: null,

    _viewFieldsContent: null,

    _content: null,

    //
    // Private Methods
    //

    _initializeViewFieldsContent: function ()
    {
        if (!checkExists(this._viewFieldsContent))
        {
            this._viewFieldsContent = jQuery("<div></div>");
            var layoutExpander = jQuery("#LayoutExpander");
            layoutExpander.appendTo(this._viewFieldsContent);
        }
    },

    _setSelectedOptions: function ()
    {
        var view = SourceCode.Forms.Designers.View;

        if (jQuery("#vdrbEditSingleRows").parent().hasClass("checked"))
        {
            view.selectedOptions.EditAllRows = false;
        }
        else
        {
            view.selectedOptions.EditAllRows = true;
        }

        if (jQuery("#vdallowUserAddRowsELChk").parent().hasClass("checked"))
        {
            view.selectedOptions.UserAddRows = true;
        }
        else
        {
            view.selectedOptions.UserAddRows = false;
        }

        if (jQuery("#vdallowUserEditELChk").parent().hasClass("checked"))
        {
            view.selectedOptions.UserEditRows = true;
        }
        else
        {
            view.selectedOptions.UserEditRows = false;
        }

        if (jQuery("#vdallowUserRemoveELChk").parent().hasClass("checked"))
        {
            view.selectedOptions.UserRemoveRows = true;
        }
        else
        {
            view.selectedOptions.UserRemoveRows = false;
        }

        if (jQuery("#vdchkEnableListEditing").parent().hasClass("checked"))
        {
            view.selectedOptions.EnableListEditing = true;
            view.selectedOptions.EnablePaging = false;
        }
        else
        {
            view.selectedOptions.EnableListEditing = false;
        }

        if (jQuery("#vdrbLabelType")[0].options[jQuery("#vdrbLabelType")[0].selectedIndex].value === "vdrbLabelLeft")
        {
            view.selectedOptions.LablePlacementLeft = true;
        }
        else
        {
            view.selectedOptions.LablePlacementLeft = false;
        }

        if (jQuery("#vdAllowUserReload").parent().hasClass("checked"))
        {
            view.selectedOptions.AllowUserRefresh = true;
        }
        else
        {
            view.selectedOptions.AllowUserRefresh = false;
        }

        if (jQuery("#vdchkShowAddRow").is(":checked"))
        {
            view.selectedOptions.EnableAddRowLink = true;
        }
        else
        {
            view.selectedOptions.EnableAddRowLink = false;
        }

        var columnCount = parseInt(jQuery("#vdcolumnGeneration").val());
        if (isNaN(columnCount))
        {
            columnCount = 2;
        }
        view.selectedOptions.ColumnCount = columnCount;
    },

    //
    // Item View
    //
    _initializeControlsForItemView: function ()
    {
        // Forms View
        // Labels Expander
        jQuery("#vdrbLabelType").dropdown();
        jQuery("#vdaddColonSuffixChk").checkbox().checkbox();

        // Buttons Expander
        jQuery("#vdrbButtonTypeStandard").radiobutton();
        jQuery("#vdrbButtonTypeToolbar").radiobutton();
        jQuery("#vdchkGenerateAllMethods").checkbox();

        jQuery("#vdchkGenerateAllFieldsInclude").checkbox();
        jQuery("#vdchkGenerateAllFieldsReadOnly").checkbox();

        jQuery("#vdchkAllMethodsStandardButtons").checkbox();
        jQuery("#vdchkAllMethodsToolbarButtons").checkbox();

        jQuery("#vdcolumnGeneration").textbox().textbox();

        jQuery(".autogen-dialog-contents").find(".expander-control").expander();

        var view = SourceCode.Forms.Designers.View;
        jQuery('#vdchkGenerateAllFieldsInclude').on("click", function ()
        {
            if (view.CheckOut._checkViewStatus())
            {
                var checkState = jQuery('#vdchkGenerateAllFieldsInclude').is(":checked");
                var checkboxes = jQuery("#autogenFieldsTable").find(".autogen-field.include");

                var readOnlyCheckBoxes = jQuery("#autogenFieldsTable").find(".autogen-field.readonly");

                if (checkState === false)
                {
                    jQuery('#vdchkGenerateAllFieldsReadOnly').checkbox().checkbox("uncheck");
                }

                for (var i = 0; i < checkboxes.length; i++)
                {
                    if (checkState === true)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("check");
                    }
                    else if (checkState === false)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("uncheck");

                        if (i < readOnlyCheckBoxes.length)
                        {
                            jQuery(readOnlyCheckBoxes[i]).checkbox().checkbox("uncheck");
                        }
                    }
                }
            }
        });

        jQuery('#vdchkGenerateAllFieldsReadOnly').on("click", function ()
        {
            if (view.CheckOut._checkViewStatus())
            {
                var checkState = jQuery('#vdchkGenerateAllFieldsReadOnly').is(":checked");
                if (checkState === true)
                {
                    jQuery('#vdchkGenerateAllFieldsInclude').checkbox().checkbox("check");
                }

                var checkboxes = jQuery("#autogenFieldsTable").find(".autogen-field.readonly");
                var includeCheckBoxes = jQuery("#autogenFieldsTable").find(".autogen-field.include");

                for (var i = 0; i < checkboxes.length; i++)
                {
                    if (checkState === true)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("check");
                        jQuery(includeCheckBoxes[i]).checkbox().checkbox("check");
                    }
                    else if (checkState === false)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("uncheck");
                    }
                }
            }
        });

        jQuery('#vdchkAllMethodsStandardButtons').on("click", function ()
        {
            if (view.CheckOut._checkViewStatus())
            {
                var checkState = jQuery('#vdchkAllMethodsStandardButtons').is(":checked");
                var checkboxes = jQuery("#MethodButtonsTable").find(".autogen-method-standard");

                for (var i = 0; i < checkboxes.length; i++)
                {
                    if (checkState === true)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("check");
                    }
                    else if (checkState === false)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("uncheck");
                    }
                }
            }
        });

        jQuery('#vdchkAllMethodsToolbarButtons').on("click", function ()
        {
            if (view.CheckOut._checkViewStatus())
            {
                var checkState = jQuery('#vdchkAllMethodsToolbarButtons').is(":checked");
                var checkboxes = jQuery("#MethodButtonsTable").find(".autogen-method-toolbar");

                for (var i = 0; i < checkboxes.length; i++)
                {
                    if (checkState === true)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("check");
                    }
                    else if (checkState === false)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("uncheck");
                    }
                }
            }
        });

        // validates input from the keyboard
        jQuery("#vdcolumnGeneration").on("keypress", function (ev)
        {
            var keyCode = ev.which;
            var jq_this = jQuery(this);
            var currentValue = parseInt(jq_this.val());

            if ((keyCode > 47 && keyCode < 58) || (keyCode === 8 || keyCode === 46))
            {
                if (view.CheckOut._checkViewStatus())
                {
                    view.ViewDesigner._configureOptionsStep(2);
                }
            }
            else
            {
                return false;
            };
        });

        // clear checked states
        jQuery("#vdchkGenerateAllFieldsInclude").checkbox("uncheck");
        jQuery("#vdchkGenerateAllFieldsReadOnly").checkbox("uncheck");
        jQuery('#vdchkAllMethodsStandardButtons').checkbox("uncheck");
        jQuery('#vdchkAllMethodsToolbarButtons').checkbox("uncheck");
        jQuery('#MethodButtonsTable .autogen-method-standard').checkbox("uncheck");
        jQuery('#MethodButtonsTable .autogen-method-toolbar').checkbox("uncheck");
        jQuery('#vdaddColonSuffixChk').checkbox("uncheck");
        jQuery("#vdrbLabelType").dropdown("select", "vdrbLabelTop");

        this._toggleReadOnlyFields(true);
    },

    _initializeContentForItemView: function ()
    {
        if (!checkExists(this._itemViewContent))
        {
            this._itemViewContent = jQuery("<div class=\"autogen-dialog-contents\"><div id=\"fields\"></div><div id=\"content\"></div></div>");

            var settings = jQuery("#FormsViewSettings");
            settings.appendTo(this._itemViewContent.find("#content"));
            jQuery("#TableExpander").prependTo(this._itemViewContent.find("#fields"));
        }

        this._viewFieldsContent.appendTo(this._itemViewContent.find("#fields"));
    },

    _toggleReadOnlyFields: function (show)
    {
        if (show === true)
        {
            jQuery("#lblReadOnlyFields").show();
            jQuery("#vdchkGenerateAllFieldsReadOnly").parent().show();
        }
        else
        {
            jQuery("#lblReadOnlyFields").hide();
            jQuery("#vdchkGenerateAllFieldsReadOnly").parent().hide();
        }
    },

    //
    // List View
    //
    _initializeControlsForListView: function ()
    {
        jQuery(".autogen-dialog-contents").find(".expander-control").expander();

        jQuery('#vdchkGenerateAllFieldsInclude').checkbox();

        jQuery("#vdchkEnableListEditing").checkbox();
        jQuery("#vdrbEditSingleRows").radiobutton();
        jQuery("#vdrbEditAllRows").radiobutton();

        jQuery("#vdallowUserAddRowsELChk").checkbox();
        jQuery("#vdlistEditAddMethod").dropdown();

        jQuery("#vdallowUserEditELChk").checkbox();
        jQuery("#vdlistEditEditMethod").dropdown();

        jQuery("#vdallowUserRemoveELChk").checkbox();
        jQuery("#vdlistEditDeleteMethod").dropdown();

        jQuery("#vdallowUserSaveElChk").checkbox();

        jQuery("#vdchkShowAddRow").checkbox();
        jQuery("#vdchkShowAddRow").checkbox("check");

        jQuery("#vdAllowUserReload").checkbox();

        this._resetControlStates();

        this._toggleEditableSectionControls();

        var view = SourceCode.Forms.Designers.View;
        jQuery('#vdchkGenerateAllFieldsInclude').on("click", function ()
        {
            if (view.CheckOut._checkViewStatus())
            {
                var checkState = jQuery('#vdchkGenerateAllFieldsInclude').is(":checked");
                var checkboxes = jQuery("#autogenFieldsTable").find(".autogen-field.include");

                for (var i = 0; i < checkboxes.length; i++)
                {
                    if (checkState === true)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("check");
                    }
                    else if (checkState === false)
                    {
                        jQuery(checkboxes[i]).checkbox().checkbox("uncheck");
                    }
                }
            }
        });

        jQuery("#vdrbEditSingleRows").on("click", function (e)
        {
            if (view.CheckOut._checkViewStatus())
            {
                if (view.layoutExists && view.hasEditSingleAllRowsChanged === false)
                {
                    popupManager.showConfirmation({
                        message: Resources.ViewDesigner.ToggleSingleAllRowsPrompt,
                        iconClass: "warning",
                        onAccept: function ()
                        {
                            view.ViewDesigner._configureOptionsStep(2);
                            view.hasEditSingleAllRowsChanged = true;
                            popupManager.closeLast();
                        },
                        onDecline: function ()
                        {
                            if (jQuery("#vdrbEditSingleRows").is(":checked"))
                            {
                                jQuery("#vdrbEditSingleRows").radiobutton("uncheck");
                                jQuery("#vdrbEditAllRows").radiobutton("check");
                            }
                            popupManager.closeLast();
                        }
                    });
                }
                else
                {
                    view.hasEditSingleAllRowsChanged = true;
                    view.ViewDesigner._configureOptionsStep(2);
                }
            }
        }.bind());

        jQuery("#vdrbEditAllRows").on("click", function (e)
        {
            if (view.CheckOut._checkViewStatus())
            {
                if (view.layoutExists() && view.hasEditSingleAllRowsChanged === false)
                {
                    popupManager.showConfirmation({
                        message: Resources.ViewDesigner.ToggleSingleAllRowsPrompt,
                        iconClass: "warning",
                        onAccept: function ()
                        {
                            view.hasEditSingleAllRowsChanged = true;
                            popupManager.closeLast();
                        },
                        onDecline: function ()
                        {
                            if (jQuery("#vdrbEditAllRows").is(":checked"))
                            {
                                jQuery("#vdrbEditAllRows").radiobutton("uncheck");
                                jQuery("#vdrbEditSingleRows").radiobutton("check");
                            }

                            popupManager.closeLast();
                        }
                    });
                }
                else
                {
                    view.hasEditSingleAllRowsChanged = true;
                }
            }
        }.bind());

        jQuery("#vdallowUserAddRowsELChk").on("click", function (e)
        {
            AutoGenerateViewPopup._toggleEditMethods();
        });

        jQuery("#vdallowUserEditELChk").on("click", function (e)
        {
            AutoGenerateViewPopup._toggleEditMethods();
        });

        jQuery("#vdallowUserRemoveELChk").on("click", function (e)
        {
            AutoGenerateViewPopup._toggleEditMethods();
        });

        jQuery("#vdchkEnableListEditing").on("click", function ()
        {
            AutoGenerateViewPopup._toggleEditableSectionControls();
        });

        AutoGenerateViewPopup._toggleEditableSectionControls();
        this._toggleReadOnlyFields(false);
    },

    _toggleEditMethods: function ()
    {
        if (jQuery("#vdallowUserAddRowsELChk").is(":checked"))
        {
            jQuery("#vdlistEditAddMethod").dropdown("enable");
            jQuery("#AddMethodLabel").removeClass("disable");
        }
        else
        {
            jQuery("#vdlistEditAddMethod").dropdown("disable");
            jQuery("#AddMethodLabel").addClass("disable");
        }

        if (jQuery("#vdallowUserEditELChk").is(":checked"))
        {
            jQuery("#vdlistEditEditMethod").dropdown("enable");
            jQuery("#EditMethodLabel").removeClass("disable");
        }
        else
        {
            jQuery("#vdlistEditEditMethod").dropdown("disable");
            jQuery("#EditMethodLabel").addClass("disable");
        }

        if (jQuery("#vdallowUserRemoveELChk").is(":checked"))
        {
            jQuery("#vdlistEditDeleteMethod").dropdown("enable");
            jQuery("#DeleteMethodLabel").removeClass("disable");
        }
        else
        {
            jQuery("#vdlistEditDeleteMethod").dropdown("disable");
            jQuery("#DeleteMethodLabel").addClass("disable");
        }
    },

    _initializeContentForListView: function ()
    {
        if (!checkExists(this._listViewContent))
        {
            this._listViewContent = jQuery("<div class=\"autogen-dialog-contents\"><div id=\"fields\"></div><div id=\"content\"></div></div>");

            var editOptions = jQuery("#ListViewEditOptions");
            editOptions.appendTo(this._listViewContent.find("#content"));
        }

        this._viewFieldsContent.appendTo(this._listViewContent.find("#fields"));
    },

    _toggleEditableSectionControls: function ()
    {
        if (jQuery("#vdchkEnableListEditing").is(":checked"))
        {
            jQuery("#vdrbEditSingleRows").radiobutton("enable");
            jQuery("#vdrbEditAllRows").radiobutton("enable");

            jQuery("#vdallowUserAddRowsELChk").checkbox("enable");
            jQuery("#vdallowUserEditELChk").checkbox("enable");
            jQuery("#vdallowUserRemoveELChk").checkbox("enable");

            jQuery("#vdlistEditAddMethod").dropdown("enable");
            jQuery("#vdlistEditEditMethod").dropdown("enable");
            jQuery("#vdlistEditDeleteMethod").dropdown("enable");

            jQuery("#AddMethodLabel").removeClass("disabled");
            jQuery("#EditMethodLabel").removeClass("disabled");
            jQuery("#DeleteMethodLabel").removeClass("disabled");

            jQuery("#vdchkShowAddRow").checkbox("enable");
        }
        else
        {
            jQuery("#vdrbEditSingleRows").radiobutton("disable");
            jQuery("#vdrbEditAllRows").radiobutton("disable");

            jQuery("#vdallowUserAddRowsELChk").checkbox("disable");
            jQuery("#vdallowUserEditELChk").checkbox("disable");
            jQuery("#vdallowUserRemoveELChk").checkbox("disable");

            jQuery("#AddMethodLabel").addClass("disabled");
            jQuery("#EditMethodLabel").addClass("disabled");
            jQuery("#DeleteMethodLabel").addClass("disabled");

            jQuery("#vdlistEditAddMethod").dropdown("disable");
            jQuery("#vdlistEditEditMethod").dropdown("disable");
            jQuery("#vdlistEditDeleteMethod").dropdown("disable");

            jQuery("#vdchkShowAddRow").checkbox("disable");
        }

        this._toggleEditMethods();

        // check if any methods are loaded, if not, disable
        if (jQuery("#vdlistEditAddMethod").dropdown("OptionsCount") === 0)
        {
            jQuery("#vdallowUserAddRowsELChk").checkbox("disable");
            jQuery("#vdlistEditAddMethod").dropdown("disable");
        }

        if (jQuery("#vdlistEditEditMethod").dropdown("OptionsCount") === 0)
        {
            jQuery("#vdallowUserEditELChk").checkbox("disable");
            jQuery("#vdlistEditEditMethod").dropdown("disable");
        }

        if (jQuery("#vdlistEditDeleteMethod").dropdown("OptionsCount") === 0)
        {
            jQuery("#vdallowUserRemoveELChk").checkbox("disable");
            jQuery("#vdlistEditDeleteMethod").dropdown("disable");
        }
    },

    _resetControlStates: function ()
    {
        jQuery("#vdchkEnableListEditing").checkbox("uncheck");
        jQuery("#vdrbEditSingleRows").radiobutton("uncheck");
        jQuery("#vdrbEditAllRows").radiobutton("check");

        jQuery("#vdallowUserAddRowsELChk").checkbox("uncheck");
        jQuery("#vdlistEditAddMethod").dropdown().dropdown();

        jQuery("#vdallowUserEditELChk").checkbox("uncheck");
        jQuery("#vdlistEditEditMethod").dropdown().dropdown();

        jQuery("#vdallowUserRemoveELChk").checkbox("uncheck");
        jQuery("#vdlistEditDeleteMethod").dropdown().dropdown();

        jQuery("#vdallowUserSaveElChk").checkbox("uncheck");

        jQuery("#vdAllowUserReload").checkbox("uncheck");
    },

    //
    // Public Methods
    //

    // initializes and shows the popup
    show: function (viewType)
    {
        this._viewType = viewType;
        var view = SourceCode.Forms.Designers.View;
        var dialogPopupId = "ViewAutoGenLayoutDialog";

        modalizer.show(true);

        this._initializeViewFieldsContent();

        var content = null;
        if (viewType === SourceCode.Forms.Designers.ViewType.ItemView)
        {
            this._initializeContentForItemView();
            content = this._itemViewContent;
        }
        else if (viewType === SourceCode.Forms.Designers.ViewType.ListView)
        {
            this._initializeContentForListView();
            content = this._listViewContent;
        }

        this._content = content;

        modalizer.hide();

        var _this = this;

        var buttons =
        [
        {
            type: "help",
            click: function ()
            {
                if (viewType === SourceCode.Forms.Designers.ViewType.ListView)
                {
                    HelpHelper.runHelp(7069);
                }
                else
                {
                    HelpHelper.runHelp(7070);
                }
            }
        },
        {
            text: Resources.WizardButtons.OKButtonText,
            click: function ()
            {
                var checkboxes = jQuery("#autogenFieldsTable").find(".autogen-field.include");
                if (!checkboxes.is(":checked"))
                {
                    var popup = popupManager.showWarning(Resources.ViewDesigner.WarningSelectOneField);
                    return;
                }

                if (_this._viewType === SourceCode.Forms.Designers.ViewType.ItemView)
                {
                    var columnCount = parseInt(jQuery("#vdcolumnGeneration").val());
                    if (isNaN(columnCount) || columnCount < 1 || columnCount > 20)
                    {
                        popupManager.showError(Resources.ViewDesigner.ColumnAndRowLimitWarning);
                        return;
                    }
                    SourceCode.Forms.Designers.View.selectedOptions.ColumnCount = columnCount;
                }

                if (SourceCode.Forms.Designers.View.layoutExists())
                {
                    popupManager.showConfirmation({
                        message: Resources.ViewDesigner.RegenerateConfirmation,
                        onAccept: function ()
                        {
                            // When user accepts, need to close parent popup as well
                            popupManager.closeLast();
                            popupManager.closeLast();
                            AutoGenerateViewPopup._generateLayout();

                            SourceCode.Forms.Designers.Common.refreshBadges();
                        },
                        onCancel: function ()
                        {
                            popupManager.closeLast();
                            return;
                        },

                        iconClass: "warning"
                    });
                    return;
                }

                AutoGenerateViewPopup._generateLayout();
                popupManager.closeLast();
            }
        },
        {
            text: Resources.WizardButtons.CancelButtonText,
            click: function ()
            {
                view.ViewDesigner._configureOptionsStep(view.wizard.wizard("getStep", view.layoutStep));
                popupManager.closeLast();
            }
        }];

        var options =
        {
            id: dialogPopupId,
            headerText: Resources.ViewDesigner.ActionsTabActionsAutoGenerateView,
            modalize: true,
            maximizable: false,
            draggable: true,
            content: content,
            width: 820,
            height: 560,
            buttons: buttons,
            tag: this,
            onShow: function (popup)
            {
                if (viewType === SourceCode.Forms.Designers.ViewType.ItemView)
                {
                    popup.options.tag._initializeControlsForItemView();
                    jQuery("#DisplayOnlyHeader")[0].style.visibility = "visible";
                }
                else
                {
                    popup.options.tag._initializeControlsForListView();
                    jQuery("#DisplayOnlyHeader")[0].style.visibility = "collapse";
                    $("#autogenFieldsTable", content).find("input[type=checkbox]").checkbox().checkbox("uncheck");
                }
                jQuery("#autogenFieldsTable").find(".input-control.checkbox input[type=checkbox]").checkbox().checkbox("uncheck");
            },
            onClose: function (popup, options)
            {
                popup.options.tag.cleanUp();

            }
        };

        popupManager.showPopup(options);
        if (viewType === SourceCode.Forms.Designers.ViewType.ItemView)
        {
            $("#vdcolumnGeneration").trigger("focus");
        }
    },

	_generateLayout: function ()
    {
        SourceCode.Forms.Designers.View.clearView();

        AutoGenerateViewPopup._setSelectedOptions();

        jQuery("#btnBlankLayout").off();
        jQuery("#btnAutoGenerate").off();
        jQuery("#divAutoGenerateOption").off();
        jQuery("#divInsertTableOption").off();

        jQuery("#tableLayoutOptions").remove();

		SourceCode.Forms.Designers.View.DesignerTable._autoGenerateView();

        jQuery("#vdeditorToolboxPane").removeClass("disabled");

        SourceCode.Forms.Designers.View.AJAXCall._saveUserSettings();

        var layoutStep = SourceCode.Forms.Designers.View.wizard.wizard("getStep", SourceCode.Forms.Designers.View.layoutStep);
        SourceCode.Forms.Designers.View.ViewDesigner._configureOptionsStep(layoutStep);

        SourceCode.Forms.Designers.View._setCanvasFilled();

    },

    cleanUp: function ()
    {
        var editSingleRowRadioElem = jQuery("#vdrbEditSingleRows");
        var editAllRowsRadioElem = jQuery("#vdrbEditAllRows");
        var allowUserAddRowsCheckElem = jQuery("#vdallowUserAddRowsELChk");
        var allowUserRemoveCheckElem = jQuery("#vdallowUserRemoveELChk");
        var enableListEditCheckElem = jQuery("#vdchkEnableListEditing");
        var allMethodsStandardButtonsCheckElem = jQuery('#vdchkAllMethodsStandardButtons');
        var allMethodsToolbarButtonsCheckElem = jQuery('#vdchkAllMethodsToolbarButtons');
        var colGenTextboxElem = jQuery("#vdcolumnGeneration");

        jQuery('#vdchkGenerateAllFieldsInclude').off();
        jQuery('#vdchkGenerateAllFieldsReadOnly').off();

        allMethodsStandardButtonsCheckElem.off();
        allMethodsToolbarButtonsCheckElem.off();
        editSingleRowRadioElem.off();
        editAllRowsRadioElem.off();
        allowUserAddRowsCheckElem.off();
        allowUserRemoveCheckElem.off();
        enableListEditCheckElem.off();
        colGenTextboxElem.off();

        jQuery('#vdchkGenerateAllFieldsInclude').checkbox("destroy");
        jQuery('#vdchkGenerateAllFieldsReadOnly').checkbox("destroy");

        if (allMethodsStandardButtonsCheckElem.isWidget("checkbox"))
        {
            allMethodsStandardButtonsCheckElem.checkbox("destroy");
        }

        if (allMethodsToolbarButtonsCheckElem.isWidget("checkbox"))
        {
            allMethodsToolbarButtonsCheckElem.checkbox("destroy");
        }

        if (editSingleRowRadioElem.isWidget("radiobutton"))
        {
            editSingleRowRadioElem.radiobutton("destroy");
        }

        if (editAllRowsRadioElem.isWidget("radiobutton"))
        {
            editAllRowsRadioElem.radiobutton("destroy");
        }

        if (allowUserAddRowsCheckElem.isWidget("checkbox"))
        {
            allowUserAddRowsCheckElem.checkbox("destroy");
        }

        if (allowUserRemoveCheckElem.isWidget("checkbox"))
        {
            allowUserRemoveCheckElem.checkbox("destroy");
        }

        if (enableListEditCheckElem.isWidget("checkbox"))
        {
            enableListEditCheckElem.checkbox("destroy");
        }

        if (colGenTextboxElem.isWidget("textbox"))
        {
            colGenTextboxElem.textbox("destroy");
        }

        var divSettings = jQuery("#divSettings");

        if (AutoGenerateViewPopup._itemViewContent !== null)
        {
            AutoGenerateViewPopup._itemViewContent.appendTo(divSettings);
        }

        if (AutoGenerateViewPopup._listViewContent !== null)
        {
            AutoGenerateViewPopup._listViewContent.appendTo(divSettings);
        }

        if (AutoGenerateViewPopup._viewFieldsContent !== null)
        {
            AutoGenerateViewPopup._viewFieldsContent.appendTo(divSettings);
        }

        AutoGenerateViewPopup._itemViewContent = null;
        AutoGenerateViewPopup._listViewContent = null;
        AutoGenerateViewPopup._viewFieldsContent = null;
        AutoGenerateViewPopup._viewType = null;
    }
}
