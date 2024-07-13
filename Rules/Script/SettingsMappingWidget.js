// Namespacing the Designer.
if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
if (typeof SourceCode.Forms.Designers.Rule === "undefined" || SourceCode.Forms.Designers.Rule === null) SourceCode.Forms.Designers.Rule = {};

(function ($)
{
	//this is the basic mapping widget
	//it gets its targetXml data from the specified plugin in the utils item xml format.
	//it then displays the xml and saves a result.

	SourceCode.Forms.Designers.Rule.SettingsMappingWidget = function (options)
	{
		SourceCode.Forms.Designers.Rule.MappingWidgetBase.apply(this, arguments);
	};
	
	var _settingsMappingWidgetProtoType =
	{
		dimentionUnitValidationRegex: /^$|^(100|[0-9]{1,2})%{1}$|^(3276[0-7]|327[0-5]\d|32[0-6]\d{2}|3[0-1]\d{3}|[1-2]\d{4}|[1-9]\d{3}|[1-9]\d{2}|[7-9]\d{1}){1}(px)?$/,

		_transformXml: function ()
		{
			var xmlDoc = parseXML("<Items></Items>");
			var items = this.targetXml.documentElement.selectNodes("Items[@ResultName='{0}']/Item".format(this.ResultName));

			for (var l = 0; l < items.length; l++)
			{
				var clonedNode = items[l].cloneNode(true);

				xmlDoc.documentElement.appendChild(clonedNode);
			}

			this.targetXml = xmlDoc;
		},

		_buildUI: function ()
		{
			this.setOption("targetHeadingText", this.Settings.TargetHeading);
			this.filterTypes = "Setting";
			
			SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._buildUI.apply(this, arguments);
		},

		// Prevent rendering of missing Targets.
		_renderInvalidInlineMapping: function (targetItem, collectionObjects, savedMapping) { },

		validate: function (propertyName, propertyDisplayName, isRequired, hasSource, hasSingleTextValue, textValue)
		{
			//required validation
			var requiredResult = SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype.validate.apply(this, arguments);
			if (requiredResult !== true)
				return requiredResult;
			switch (propertyName)
			{
				case "SubformWidth":
				case "SubformHeight":
					this.dimentionUnitValidationRegex.lastIndex = 0;
					if (hasSingleTextValue && textValue && !this.dimentionUnitValidationRegex.test(textValue))
						return Resources.RuleDesigner.ValidationUnitFailed.format(propertyDisplayName.toLowerCase());
					break;
                case "SubformVerticalAlign":
                    if (checkExists(textValue) && !(textValue.toLowerCase() === 'middle' || textValue.toLowerCase() === 'auto'))
                    {
                        return Resources.RuleDesigner.VerticalAlignValidationFailed;
                    }
                    break;
			}
			return true;
		},

		//override to remvoe the auto mat toolbar button
		_populateToolbar: function ()
		{
			var parentElement = this.getOption("parentElement");
			var tb = parentElement.closest(".wizard-step-content").find(".toolbar")

			if (tb.length === 0)
			{
				var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>")
				tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
				toolbarWrapper.append(tb);
				parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);
			}

			tb.toolbar();
			tb.toolbar("add", "button", { id: "clearAllButton_BasicMappingWidget", icon: "delete-all", text: ContextTree_Clear_AllValues, description: ContextTree_Clear_AllValuesDesc, disabled: false });
			tb.toolbar("add", "button", { id: "clearSelectedButton_BasicMappingWidget", icon: "delete", text: ContextTree_Clear_SelectedValue, description: ContextTree_Clear_SelectedValueDesc, disabled: true });

			var toolbarItems = tb.toolbar("fetch", "buttons");
			jQuery(toolbarItems[0]).on("click", this.clearAllValues.bind(this));
			jQuery(toolbarItems[1]).on("click", this.clearSelectedValue.bind(this));
		}
	}

	jQuery.extend(SourceCode.Forms.Designers.Rule.SettingsMappingWidget.prototype, SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype, _settingsMappingWidgetProtoType);

})(jQuery);
