(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};


	SourceCode.Forms.Controls.ConditionalFormatting =
	{
		_addChained: false,
		_isEdit: true,
		DesignRenderHelper: null,

		_create: function ()
		{

		},

		load: function (options)
		{
			//#region
			this.viewControl = options.viewControl;
			this.controltype = options.viewControl.controltype;
			this.onWidgetReturned = options.onWidgetReturned;
			this.modalizedControl = options.modalizedControl;
			if (options.conditionsPlugin)
				this.conditionsPlugin = options.conditionsPlugin;
			else
				this.conditionsPlugin = "ViewContextPlugIn";

			this.availableStylesCollection = options.availableStylesCollection;
			this.availableStylesNode = options.availableStylesNode;
			this.defaultStyleNode = options.defaultStyleNode;
			this.defaultStylesCollection = options.defaultStylesCollection;

			this.conditionalStylesNode = options.conditionalStylesNode;

			this._viewId = options.viewId;

			//#endregion
		},

		showDialog: function ()
		{

			//#region
			if (jQuery("#ConditionalFormattingDialog") === null || jQuery("#ConditionalFormattingDialog").length === 0)
			{
				jQuery("body").append("<div id=\"ConditionalFormattingDialog\" style=\"height:100%\"></div>");
			}
			this.ConditionalFormattingDialog = jQuery("#ConditionalFormattingDialog");
			if (!this.dialogHtml)
			{
				var StylesAlreadyLoaded = (SCCultureHelper.current) ? true : false;
				jQuery.ajax({
					url: "StyleBuilder/ConditionalFormattingDialog.aspx",
					data: {
						StylesAlreadyLoaded: StylesAlreadyLoaded
					},
					type: "POST",
					async: true,
					success: this.htmlLoaded.bind(this),
					dataType: "text",
					global: false
				});
			}
			else
			{
				this.htmlLoaded(this.dialogHtml);
			}
			//#endregion
		},

		htmlLoaded: function (data, textStatus)
		{
			if (this.modalizedControl)
				this.modalizedControl.showBusyModal(false);
			this.ConditionalFormattingDialog.empty().html(data);
			this.setupCultureXml();

			var $this = this;

			this.ConditionalFormattingDialog.find("#conditionalFormattingGrid .grid-body-content").addClass("theme-entry");

			var ConditionalFormattingDialogPopup = popupManager.showPopup({
				headerText: "Conditional Formatting", //TO DO LOCALISE
				modalize: true,
				content: this.ConditionalFormattingDialog,
				width: 623,
				height: 350,
				buttons: [
					{
						type: "help",
						click: function () { HelpHelper.runHelp(7017); }
					},
					{
						text: WizardButtons_OKButtonText,
						click: function ()
						{
							if (this.onWidgetReturned)
							{
								var success = this.onWidgetReturned(true, this._getNewXml());
							}

							if (success !== false)
							{
								if (checkExists($this._destroy) && typeof $this._destroy === "function")
								{
									$this._destroy();
								}
							}
						}.bind(this)
					},
					{
						text: WizardButtons_CancelButtonText,
						click: function ()
						{
							if (this.onWidgetReturned)
								this.onWidgetReturned(false, null);
							popupManager.closeLast({ cancelOnClose: true });

							if (checkExists($this._destroy) && typeof $this._destroy === "function")
							{
								$this._destroy();
							}
						}
					}
				]
			});

			this._populateConditionsGrid();
			var tb = this.grid.grid("fetch", "toolbars").eq(0);
			var toolbarItems = tb.find(".toolbar").toolbar("fetch", "buttons");

			jQuery(toolbarItems[0]).on("click", this._add.bind(this));
			jQuery(toolbarItems[1]).on("click", this._editCondition.bind(this));
			jQuery(toolbarItems[2]).on("click", this._editStyle.bind(this));
			jQuery(toolbarItems[3]).on("click", this._delete.bind(this));
			jQuery(toolbarItems[4]).on("click", this._moveUp.bind(this));
			jQuery(toolbarItems[5]).on("click", this._moveDown.bind(this));
			this._rowDeSelected();
		},

		setupCultureXml: function ()
		{
			if (!this.dialogHtml)
			{
				if (!checkExists(SCCultureHelper.current))
				{
					this.currentCulture = jQuery("#ConditionalFormattingCurrentCulture").val();
					var stringXmlValueList = "";
					var cultures = jQuery("#ConditionalFormattingCulturesXml").val();
					jQuery("#ConditionalFormattingCulturesXml").val("");

					var data = parseXML(cultures);
					var currentCulture = data.selectSingleNode("Results/CurrentCulture").text,
						culturesXmlString = data.selectSingleNode("Results/Cultures").xml,
						timeZones = data.selectSingleNode('Results/Timezones').text;

					SCCultureHelper.current = new SourceCode.Forms.CultureHelper(culturesXmlString, this.currentCulture, timeZones);
				}
				else
				{
					this.currentCulture = SCCultureHelper.current.currentCultureName;
				}
				//cache html with out the culture lists
				this.dialogHtml = this.ConditionalFormattingDialog.html();

			}
		},

		_populateConditionsGrid: function (selectedItemName)
		{
			var gridBehaviour =
			{
				rowselect: this._rowSelected.bind(this)
			};
			this.grid = this.ConditionalFormattingDialog.find(".grid").grid(gridBehaviour);
			this.grid.grid("clear");
			var foundIndex = -1;
			var conditionalStyles = this.conditionalStylesNode.selectNodes("ConditionalStyle[Name='']");

			for (var t = 0; t < conditionalStyles.length; t++)
			{
				var name = conditionalStyles[t].selectSingleNode("Name").text;
				name = this._addGridRow(conditionalStyles[t], name);
				if (name === selectedItemName)
					foundIndex = t;
			}
			conditionalStyles = this.conditionalStylesNode.selectNodes("ConditionalStyle[Name!='']");
			for (var t = 0; t < conditionalStyles.length; t++)
			{
				var name = this._addGridRow(conditionalStyles[t], name);
				if (name === selectedItemName)
					foundIndex = t;
			}
			if (foundIndex > -1)
				this.grid.grid("select", [foundIndex]);

		},

		_addGridRow: function (conditionalStyles)
		{
			var name = conditionalStyles.selectSingleNode("Name").text;
			var nameValue = conditionalStyles.selectSingleNode("Name").text;
			var conditionInvalid = conditionalStyles.selectSingleNode(".//Condition[@Resolved]");
			var _icon = "conditional-style";

			if (checkExists(conditionInvalid))
			{
				_icon += "-error";
			}
			else if (SourceCode.Forms.DependencyHelper.hasValidationStatusError(conditionalStyles))
			{
				_icon += "-error";
			}

			if (name === "")
			{
				name = Resources.Filtering.DefaultStyleName;
				nameValue = "";
			}

			this.grid.grid("add", "row", [{ html: name.htmlEncode(), value: nameValue.htmlEncode(), icon: _icon }, { html: "<div class='condtional-format-preview' controltype='" + this.controltype + "'>format preview</div>", value: conditionalStyles.xml }]);
			var addedRow = this.grid.grid("fetch", "rows");
			addedRow = addedRow[addedRow.length - 1];
			this._updateGridRowPreview(addedRow, conditionalStyles);


			return name;
		},

		_updateGridRowPreview: function (row, conditionalStyles)
		{
			var style = conditionalStyles.selectSingleNode("Styles");
			var previewWrapper = jQuery(row).children("td").eq(1).find(".condtional-format-preview");
			if (this.viewControl.isFormControl)
				previewWrapper.addClass("form-control");
			previewWrapper.data("controlid", this.viewControl.controlid);
			previewWrapper.attr("controltype", this.viewControl.controltype);
			var options =
			{
				controlToPopulate: previewWrapper,
				modalizeControl: previewWrapper
			};
			this.getDesignRenderHelper(options);
			this.DesignRenderHelper.renderControl(style);
		},

		_updateGridRow: function (conditionalStyles)
		{
			var selectedRow = this.grid.grid("fetch", "selected-rows");
			var conditionalStyle = conditionalStyles.selectSingleNode("ConditionalStyle");
			var name = conditionalStyle.selectSingleNode("Name").text;
			var conditionInvalid = conditionalStyles.selectSingleNode(".//Condition[@Resolved]");
			var _icon = "conditional-style";

			if (checkExists(conditionInvalid))
			{
				_icon += "-error";
			}
			if (name === "")
			{
				name = Resources.Filtering.DefaultStyleName;
			}
			name = name.htmlEncode();
			if (selectedRow && selectedRow.length > 0)
			{
				selectedRow.children("td").eq(0).metadata().value = name;
				selectedRow.children("td").eq(0).metadata().icon = _icon;
				selectedRow.children("td").eq(0).find(".grid-content-cell").removeClass("expression-error").addClass(_icon);
				selectedRow.children("td").eq(0).find(".grid-content-cell-wrapper").html(name);
				selectedRow.children("td").eq(1).metadata().value = conditionalStyles.xml;
			}
			this._updateGridRowPreview(selectedRow, conditionalStyle);
		},

		_getNewXml: function ()
		{
			var newXML = "<ConditionalStyles>{0}</ConditionalStyles>";
			var xmlContents = "";
			var selectedRows = this.grid.grid("fetch", "rows");
			for (var i = 0; i < selectedRows.length; i++)
			{
				xmlContents += jQuery(selectedRows[i]).children("td").eq(1).metadata().value;
			}
			return parseXML(newXML.format(xmlContents));
		},

		_getSelectedRowXml: function ()
		{
			var grid = this.ConditionalFormattingDialog.find(".grid");
			var selectedRow = grid.grid("fetch", "selected-rows", "objects");
			if (selectedRow && selectedRow[0] && selectedRow[0][1])
			{
				return parseXML(selectedRow[0][1].value);
			}
			else
				return null;
		},

		_getSelectedRowControl: function ()
		{
			var selectedRow = this.grid.grid("fetch", "selected-rows");
			return jQuery(selectedRow.eq(0)).children("td").eq(1).find(".condtional-format-preview");
		},

		_getSelectedRowName: function ()
		{
			var name = null;
			var rowXml = this._getSelectedRowXml();
			if (rowXml)
				name = rowXml.selectSingleNode("ConditionalStyle/Name").text;
			return name;
		},

		_rowSelected: function (selectedRow)
		{
			var name = this._getSelectedRowName();
			if (name === "" || name === Resources.Filtering.DefaultStyleName)
			{
				jQuery("#conditionalFormattingEditCondition,#conditionalFormattingDelete").addClass("disabled");
				jQuery("#conditionalFormattingEditStyle").removeClass("disabled");
			}
			else
			{
				jQuery("#conditionalFormattingEditCondition,#conditionalFormattingDelete,#conditionalFormattingEditStyle").removeClass("disabled");
			}
			this._updateUpDown(selectedRow, name);
		},

		_rowDeSelected: function ()
		{
			jQuery("#conditionalFormattingEditCondition,#conditionalFormattingEditStyle,#conditionalFormattingDelete,#conditionalFormattingMoveUp,#conditionalFormattingMoveDown").addClass("disabled");
		},

		_add: function (event)
		{
			this._isEdit = false;
			this._addChained = true;
			this._editCondition();
			this._isEdit = true;
		},

		_editCondition: function (event)
		{
			if (event)
			{
				var jqTarget = jQuery(event.target);
				if (jqTarget.closest("a.toolbar-button").hasClass("disabled"))
					return;
			}
			var conditionsXml = null;
			var name = "";
			var _this = this;
			if (!this._addChained)
			{
				var rowXml = this._getSelectedRowXml();
				if (rowXml)
				{
					var conditionalStyle = rowXml.selectSingleNode("ConditionalStyle");
					if (conditionalStyle)
					{
						var conditionalStyleName = conditionalStyle.selectSingleNode("Name");
						if (conditionalStyleName)
							name = conditionalStyleName.text;
						conditionsXml = conditionalStyle.selectSingleNode("Condition");
					}
				}
				if (conditionsXml)
					conditionsXml = conditionsXml.xml;
			}
			var wrapper = jQuery("#conditionsContainer");
			wrapper.empty();

			var headingText = this._isEdit ? Resources.Designers.EditConditionalFormatting : Resources.Designers.AddConditionalFormatting;
			var configWidget = new ConfigurationWidget();
			configWidget.onWidgetCompleted = this._editConditionReturned.bind(this);
			configWidget.value = conditionsXml;
			configWidget["container"] = wrapper;
			configWidget["openPopup"] = false;
			configWidget["PopupHeading"] = headingText;
			configWidget["ContextHeading"] = Resources.Designers.AvailableOptions;
			configWidget["TargetHeading"] = Resources.Designers.ConditionalStyle;
			configWidget["TargetWidget"] = "ConditionWidget";
			configWidget["TargetWidgetMethod"] = "initialize";
            configWidget["TargetWidgetOptions"] = '{ "allowMultipleItems": true,"addName":true }';

			var settingsContext = {};
			var settingsContextParameters = {};
			settingsContextParameters["includeAll"] = "True";
			settingsContext["Parameters"] = settingsContextParameters;
			settingsContext["PlugIn"] = "SystemVariablesContextPlugIn";
			settingsContext["Method"] = "initialize";
			var settingsContextsArray = [];
			settingsContextsArray.push(settingsContext);

			var environmentContext = {};
			environmentContext["PlugIn"] = "EnvironmentFieldsContextPlugIn";
			environmentContext["Method"] = "initialize";
			settingsContextsArray.push(environmentContext);

			var viewContext = {};
			viewContext["PlugIn"] = this.conditionsPlugin;
			viewContext["Method"] = "initialize";
			var viewContextParameters = {};
			viewContextParameters["isCurrent"] = "True";
			viewContextParameters["includeFields"] = "True";
			viewContextParameters["includeControlFields"] = "False";
			viewContextParameters["includeControls"] = "True";
			viewContextParameters["includeExpressions"] = "True";
			viewContextParameters["includeViews"] = "True";
			viewContextParameters["includeFormControls"] = "True";
			viewContextParameters["includeInputControls"] = "True";
			viewContextParameters["includeListingControls"] = "True";
			viewContextParameters["includeDisplayControls"] = "True";
			viewContextParameters["includeActionControls"] = "True";
			viewContextParameters["includeExecutionControls"] = "True";
			viewContextParameters["includeControlProperties"] = "True";
			viewContextParameters["filterTypes"] = "Control|ViewField";

			viewContext["Parameters"] = viewContextParameters;
			settingsContextsArray.push(viewContext);

			var SettingsObj = {};
			SettingsObj["ResultName"] = "Filter";
			SettingsObj["Contexts"] = settingsContextsArray;

			configWidget["Settings"] = SettingsObj;

			var conditionsContent = jQuery("#StyleBuilderConditionsPaneContainer");
			var _scalePercentage = 0.8;
			var StyleBuilderConditionsPaneContainerPopup = popupManager.showPopup({
				headerText: headingText,
				modalize: true,
				content: conditionsContent,
				width: Math.floor(jQuery(window).width() * _scalePercentage),
				height: Math.floor(jQuery(window).height() * _scalePercentage),
				cancelClose: true,
				closeWith: 'ConditionStylesCancelButton',
				buttons: [
					{
						type: "help",
						click: function () { HelpHelper.runHelp(7017); }
					},
					{
						text: WizardButtons_OKButtonText,
						click: function ()
						{
							var canClose = configWidget.popupOkClick();
							if (canClose)
							{
								StyleBuilderConditionsPaneContainerPopup.popupwindow('option', 'cancelClose', false);
								StyleBuilderConditionsPaneContainerPopup.popupwindow("close");
							}
						}.bind(configWidget)
					},
					{
						text: WizardButtons_CancelButtonText,
						id: 'ConditionStylesCancelButton'
					}
				],
				onClose: function ()
				{
					if (StyleBuilderConditionsPaneContainerPopup.popupwindow('option', 'cancelClose'))
					{
						configWidget.popupCancelClick();
						_this._addChained = false;
						StyleBuilderConditionsPaneContainerPopup.popupwindow('option', 'cancelClose', false);
						StyleBuilderConditionsPaneContainerPopup.popupwindow('option', 'cancelOnClose', true);
						StyleBuilderConditionsPaneContainerPopup.popupwindow("close");
					}
				}.bind(configWidget)
			});
			conditionsContent.showBusyModal(true);

			//use name and conditionsNode to popup conditions screen

			//hack to remove the top panel in conditions (better workaround?)
			var conditionsContainer = jQuery("#conditionsContainer"), pane;
			if (conditionsContainer.length > 0)
				pane = conditionsContainer.find(">.pane-container>.pane");
			if (pane.length && pane.length > 0)
			{
				pane[0].className = "pane";

				var metaArray = {};
				metaArray["height"] = "1px";

				pane[0].setAttribute("data-options", jQuery.toJSON(metaArray));
			}

			if (conditionsContent.isWidget("panecontainer"))
			{
				conditionsContent.panecontainer("destroy");
			}

			conditionsContent.panecontainer();

			configWidget.initialize();

			jQuery("#conditionalStyleName").textbox().trigger("focus");

			jQuery("#conditionalStyleName").val(name);

			conditionsContent.showBusyModal(false);


		},

		_editStyle: function (event)
		{
			if (event)
			{
				var jqTarget = jQuery(event.target);
				if (jqTarget.closest("a.toolbar-button").hasClass("disabled"))
					return;
			}
			this.ConditionalFormattingDialog.showBusyModal(true);
			var defaultStyle = null;
			var conditionalStyles = null;
			var conditionalStylesNode = null;
			if (!this._addChained)
			{
				var styleNode = null;
				var rowXml = this._getSelectedRowXml();
				if (rowXml)
					conditionalStyles = rowXml.selectSingleNode("ConditionalStyle/Styles");
				if (conditionalStyles)
					conditionalStylesNode = SCStyleHelper.getPrimaryStyleNode(conditionalStyles);
			}
			else
			{
				conditionalStyles = this.defaultStylesCollection.cloneNode(true);
				conditionalStylesNode = SCStyleHelper.getPrimaryStyleNode(conditionalStyles);
			}

			this.viewControl.control = this._getSelectedRowControl();

			var options =
			{
				viewControl: this.viewControl,
				availableStylesNode: this.availableStylesNode,
				defaultStyleNode: this.defaultStyleNode,
				customStylesXml: conditionalStyles,
				customStyleNode: conditionalStylesNode,
				onWidgetReturned: this._styleBuilderReturned.bind(this),
				modalizedControl: this.ConditionalFormattingDialog
			};

			SCStyleBuilder.load(options);
			SCStyleBuilder.showDialog();
		},

		_delete: function (event)
		{
			if (event)
			{
				var jqTarget = jQuery(event.target);
				if (jqTarget.closest("a.toolbar-button").hasClass("disabled"))
					return;
			}
			//update xml
			var selectedRow = this.grid.grid("fetch", "selected-rows");
			selectedRow.remove();
			this._rowDeSelected();
		},

		//this is used for when the conditions screen closes 
		_editConditionReturned: function (widget, error)
		{
			var outcome = true;
			var display = widget.display;
			var value = widget.value;
			var data = widget.data;

			if (!display)
			{
				display = value.display;
				data = value.data;
				value = value.value;
			}

			var valueXml = $xml(value);
			var firstChild = valueXml.firstChild;
			var resultContainsExpression = (firstChild) ? firstChild.firstChild : null;

			if (resultContainsExpression)
			{
				this.condition = value;
				this.conditonalStyleName = jQuery("#conditionalStyleName").val();
			}
			else
			{
				this.condition = null;
			}
			if (this._addChained && this.condition && this.conditonalStyleName !== "")
			{
				this._editStyle();
			}
			else if (this.condition && this.conditonalStyleName !== "")
			{
				this._addChained = false;

				//update condition
				var rowXml = this._getSelectedRowXml();
				var condtionsNode;
				var conditionalStyle = rowXml.selectSingleNode("ConditionalStyle");
				var conditionalStyleName = conditionalStyle.selectSingleNode("Name");
				conditionalStyle.removeChild(conditionalStyleName);
				conditionalStyleName = rowXml.createElement("Name");
				conditionalStyleName.appendChild(rowXml.createTextNode(this.conditonalStyleName));
				conditionalStyle.appendChild(conditionalStyleName);
				if (rowXml)
					condtionsNode = conditionalStyle.selectSingleNode("Condition");
				if (condtionsNode)
					conditionalStyle.removeChild(condtionsNode);

				var newConditionNode = rowXml.createElement("Condition");
				newConditionNode.appendChild(parseXML(this.condition).selectSingleNode("Conditions").firstChild.cloneNode(true));
				conditionalStyle.appendChild(newConditionNode);
				this._updateGridRow(rowXml);

			}
			else if (!this.condition)
			{
				var options = {
					headerText: Resources.Filtering.ConditionsValidationEmptyTitle,
					message: Resources.Filtering.ConditionsValidationEmptyMessage
				};
				popupManager.showNotification(options);
				outcome = false;
			}
			else if (this.conditonalStyleName === "")
			{
				var options = {
					headerText: Resources.Filtering.ConditionalFormattingValidationNameEmptyTitle,
					message: Resources.Filtering.ConditionalFormattingValidationNameEmptyMessage
				};
				popupManager.showNotification(options);
				outcome = false;
			}
			return outcome;
		},

		_styleBuilderReturned: function (notCancelled, xml)
		{
			if (notCancelled)
			{
				if (this._addChained)
				{
					this._addChained = false;
					var tempXml = SCStyleHelper.tempXml();

					var conditionalStyle = tempXml.createElement("ConditionalStyle");

					var conditionalStyleName = tempXml.createElement("Name");
					conditionalStyleName.appendChild(tempXml.createTextNode(this.conditonalStyleName));
					conditionalStyle.appendChild(conditionalStyleName);

					var newConditionNode = tempXml.createElement("Condition");
					newConditionNode.appendChild(parseXML(this.condition).selectSingleNode("Conditions").firstChild.cloneNode(true));
					conditionalStyle.appendChild(newConditionNode);

					conditionalStyle.appendChild(xml.parentNode.cloneNode(true));

					this._addGridRow(conditionalStyle);

				}
				else
				{
					var rowXml = this._getSelectedRowXml();
					var conditionalStyle = rowXml.selectSingleNode("ConditionalStyle");
					if (rowXml)
						stylesNode = conditionalStyle.selectSingleNode("Styles");
					if (stylesNode)
						conditionalStyle.removeChild(stylesNode);
					conditionalStyle.appendChild(xml.parentNode.cloneNode(true));
					this._updateGridRow(rowXml);
				}
			}
			this.ConditionalFormattingDialog.showBusyModal(false);
		},

		_updateUpDown: function (selectedRow, rowValue)
		{
			if (rowValue === "")
			{
				jQuery("#conditionalFormattingMoveUp,#conditionalFormattingMoveDown").addClass("disabled");
			}
			else
			{
				if ($(selectedRow).prevAll("tr").length > 1)
					$("#conditionalFormattingMoveUp").removeClass("disabled");
				else
					$("#conditionalFormattingMoveUp").addClass("disabled");

				if ($(selectedRow).next("tr").length > 0)
					$("#conditionalFormattingMoveDown").removeClass("disabled");
				else
					$("#conditionalFormattingMoveDown").addClass("disabled");
			}
		},

		_moveUp: function (event)
		{
			if (event)
			{
				var jqTarget = jQuery(event.target);
				if (jqTarget.closest("a.toolbar-button").hasClass("disabled"))
					return;
			}
			var selectedRows = this.grid.grid('fetch', 'selected-rows');
			var prev = selectedRows.prev();
			selectedRows.after(prev);
			if (selectedRows.length > 0)
				this._updateUpDown(selectedRows[0]);
		},

		_moveDown: function (event)
		{
			if (event)
			{
				var jqTarget = jQuery(event.target);
				if (jqTarget.closest("a.toolbar-button").hasClass("disabled"))
					return;
			}
			var selectedRows = this.grid.grid('fetch', 'selected-rows');
			var next = selectedRows.next();
			selectedRows.before(next);
			if (selectedRows.length > 0)
				this._updateUpDown(selectedRows[0]);
		},

		getDesignRenderHelper: function (options)
		{
			if (!this.DesignRenderHelper)
			{
				var designOptions =
				{
					viewControl: this.viewControl,
					cultureHelper: SCCultureHelper.current,
					overRideControlText: true
				};
				this.DesignRenderHelper = new SCDesignRenderHelper(designOptions);
			}
			if (options)
			{
				if (options.controlToPopulate)
					this.DesignRenderHelper.controlToPopulate = options.controlToPopulate;
				if (options.modalizeControl)
					this.DesignRenderHelper.modalizeControl = options.modalizeControl;
			}
			return this.DesignRenderHelper;
		},

		_destroy: function ()
		{
			//#region
			this.DesignRenderHelper = null;
			this.ConditionalFormattingDialog.find("*").off();
			//#endregion
		}
	};

	if (typeof SCConditionalFormatting === "undefined") SCConditionalFormatting = SourceCode.Forms.Controls.ConditionalFormatting;
	$.widget("ConditionalFormatting", SourceCode.Forms.Controls.ConditionalFormatting);
})(jQuery);

