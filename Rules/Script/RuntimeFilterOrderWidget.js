
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function RuntimeFilterOrderWidget()
{
}
var RuntimeFilterOrderWidgetProtoType =
{
	editFunction: "new",
	itemsLoaded: 0,
	initialize: function (parentElement)
	{
		if (!parentElement)
			parentElement = $("body").append("<div></div>");
		this.parentElement = parentElement;
		this._buildUI(parentElement);
	},

	setConfigurationXml: function (configurationXml, targetContextContainer)
	{
		var mappingsTransformation = "<Mappings><Mapping Type=\"{0}\">{1}</Mapping></Mappings>";
		var filterCriteria = parseXML(configurationXml);

		var filterXml = "";
		var orderXml = "";
		if (filterCriteria)
		{
			$("#FilterName").val(filterCriteria.childNodes[0].getAttribute("name")).triggerHandler("focus");
			var filterNode = filterCriteria.selectSingleNode("FilterCriteria/Filter");
			if (filterNode && filterNode.xml)
			{
				this.filterXml = mappingsTransformation.format("Filter", filterNode.xml);
			}
			var orderNode = filterCriteria.selectSingleNode("FilterCriteria/Sorters");
			if (orderNode && orderNode.xml)
			{
				this.orderXml = mappingsTransformation.format("Order", orderNode.xml);
			}
		}
	},

	getFilterName: function ()
	{
		return $("#FilterName").val();
	},

	getConfigurationXML: function ()
	{
		this.filterConfigWidget.save();
		this.orderConfigWidget.save();
		var filterName = $("#FilterName").val();
		var filterXml = "";
		var orderXml = "";
		if (this.filterXml)
		{
			var node = this.filterXml.selectSingleNode("Mappings/Mapping/Filter");
			if (node && node.xml)
			{
				filterXml = node.xml;
			}
		}
		if (this.orderXml)
		{
			var node = this.orderXml.selectSingleNode("Mappings/Mapping/Sorters");
			if (node && node.xml)
			{
				orderXml = node.xml;
			}
		}
		//combine results 
		return "<FilterCriteria name=\"{0}\">{1}{2}</FilterCriteria>".format(filterName.htmlEncode(), filterXml, orderXml);
	},

	_buildUI: function (parentElement)
	{
		var data = { editFunction: this.editFunction };
		var options =
		{
			url: applicationRoot + "Rules/RuntimeFilterOrder.aspx",
			type: 'GET',
			cache: false,
			data: data,
			dataType: "text",
			async: false,
			success: this._partialPageLoaded.bind(this)
		};
		jQuery.ajax(options);
	},

	_partialPageLoaded: function (responseText, textStatus, XMLHttpRequest)
	{
		var newParent = $(responseText);
		this.parentElement.replaceWith(newParent);
		this.parentElement = newParent;
		this.parentElement.showBusyModal(true);
		this.parentElement.find(".pane-container").panecontainer();
		this.parentElement.find(".panel").panel();
		var tabbox = this.parentElement.find("#FilterTabBox")
		this.Tabs = tabbox.children("ul").children("li").find("a.tab");
		this.Tabs.on("click", this.TabClick.bind(this));
		jQuery("#FilterName").textbox().trigger("focus");
		this.initCallBack();
		this._createFilterTabContent();
		this._createOrderTabContent();

		// Set the ID of the Dialog for runtime styling/theming purposes
		this.parentElement.closest(".popup").attr("id", "RuntimeFilterOrderWidgetDialog"); // deprecated
		this.parentElement.closest(".popup").addClass("id-filter-order-widget");
	},

	initCallBack: function ()
	{
		//This method should be overrided (at runtime)
	},

	checkAllLoaded: function ()
	{
		if (this.itemsLoaded !== 0)
		{
			this.parentElement.showBusyModal(false);
		}
		this.itemsLoaded++;
	},

	_createFilterTabContent: function ()
	{
		//instantiate widget objects and send through the data
		var configWidget = new RuntimeConfigurationWidget();
		configWidget.value = this.filterXml;
		configWidget["container"] = $("#FilterTab_Content");
		configWidget["ContextHeading"] = Resources.Filtering.FilterWidgetContextHeading; //"Context Browser"
		configWidget["TargetHeading"] = "Filter";

		var Parameters = {};

		Parameters["includeFields"] = "True";
		if (checkExists(runtimeFilterFields))
		{
			Parameters["useRuntimeSearchableFields"] = "True";
			Parameters["runtimeFilterFields"] = runtimeFilterFields[this.viewId];
		}
		Parameters["pluginName"] = "ViewContextPlugIn";
		Parameters["pluginMethod"] = "initialize";
		Parameters["viewID"] = this.viewId;
		Parameters["isCurrent"] = "False";

		configWidget["Parameters"] = Parameters;

		var settingsContext = {};
		var settingsContextParameters = {};
		settingsContextParameters["includeAll"] = "True";

		settingsContext["Parameters"] = settingsContextParameters;
		settingsContext["PlugIn"] = "SystemVariablesContextPlugIn";
		settingsContext["Method"] = "initialize";
		var settingsContextsArray = [];
		settingsContextsArray.push(settingsContext);

		if (SourceCode.Forms.Settings.AllowEnvironmentFields === true)
		{
		    var environmentContext = {};
		    var environmentContextParameters = {};
		    environmentContext["PlugIn"] = "EnvironmentFieldsContextPlugIn";
		    environmentContext["Method"] = "initialize";
		    environmentContext["Parameters"] = environmentContextParameters;
		    settingsContextsArray.push(environmentContext);
		}

		var viewContext = {};
		viewContext["PlugIn"] = "ViewContextPlugIn";
		viewContext["Method"] = "initialize";
		var viewContextParameters = {};
		viewContextParameters["viewID"] = this.viewId;
		viewContextParameters["isCurrent"] = "False";
		viewContextParameters["includeFields"] = "True";
		if (checkExists(runtimeFilterFields))
		{
			viewContextParameters["useRuntimeSearchableFields"] = "True";
			viewContextParameters["runtimeFilterFields"] = runtimeFilterFields[this.viewId];
		}
		viewContextParameters["includeInputControls"] = "True";
		viewContextParameters["includeControls"] = "True";
		viewContextParameters["includeListingControls"] = "True";
		viewContextParameters["includeDisplayControls"] = "True";
		viewContextParameters["includeActionControls"] = "True";
		viewContextParameters["includeExecutionControls"] = "True";
		viewContextParameters["includeParameters"] = "True";

		viewContext["Parameters"] = viewContextParameters;
		settingsContextsArray.push(viewContext);

		var targetParameters = {};
		targetParameters["viewID"] = this.viewId;
		targetParameters["pluginName"] = "ViewContextPlugIn";
		targetParameters["pluginMethod"] = "initialize";
		targetParameters["isCurrent"] = "False";
		targetParameters["includeFields"] = "True";
		if (checkExists(runtimeFilterFields))
		{
			targetParameters["useRuntimeSearchableFields"] = "True";
			targetParameters["runtimeFilterFields"] = runtimeFilterFields[this.viewId];
		}
		targetParameters["includeMethods"] = "True";
		targetParameters["includeViewMethods"] = "True";
		targetParameters["includeObjectDetails"] = "True";
		targetParameters["includeResultProperties"] = "True";
		targetParameters["includeControls"] = "True";
		targetParameters["includeControlTypeEvents"] = "True";
		targetParameters["FilterTypes"] = "MethodReturnedProperty|ViewField";
		targetParameters["HelpID"] = "7048";

		var target = {};
		target["Parameters"] = targetParameters;
		target["Widget"] = "FilterWidget"
		target["Method"] = "initialize";

		var SettingsObj = {};
		SettingsObj["Contexts"] = settingsContextsArray;
		SettingsObj["Target"] = target;
		SettingsObj["ResultName"] = "Filter";

		configWidget["Settings"] = [SettingsObj];
		configWidget.initialize();
		this.filterConfigWidget = configWidget;
		this.filterConfigWidget.parentWidget = this;
		this.filterConfigWidget.initCallBack = this.checkAllLoaded.bind(this);
	},

	_createOrderTabContent: function ()
	{
		//instantiate widget objects and send through the data
		var configWidget = new RuntimeConfigurationWidget();
		configWidget.value = this.orderXml;
		configWidget["container"] = $("#OrderTab_Content");
		configWidget["ContextHeading"] = Resources.Filtering.FilterWidgetContextHeading; //"Context Browser"
		configWidget["TargetHeading"] = "Order";

		var Parameters = {};

		Parameters["includeFields"] = "True";
		if (checkExists(runtimeFilterFields))
		{
			Parameters["useRuntimeSearchableFields"] = "True";
			Parameters["runtimeFilterFields"] = runtimeFilterFields[this.viewId];
		}
		Parameters["pluginName"] = "ViewContextPlugIn";
		Parameters["pluginMethod"] = "initialize";
		Parameters["viewID"] = this.viewId;
		Parameters["isCurrent"] = "False";

		configWidget["Parameters"] = Parameters;

		var settingsContextsArray = [];

		var targetParameters = {};
		targetParameters["viewID"] = this.viewId;
		targetParameters["pluginName"] = "ViewContextPlugIn";
		targetParameters["pluginMethod"] = "initialize";
		targetParameters["isCurrent"] = "False";
		targetParameters["includeFields"] = "True";
		if (checkExists(runtimeFilterFields))
		{
			targetParameters["useRuntimeSearchableFields"] = "True";
			targetParameters["runtimeFilterFields"] = runtimeFilterFields[this.viewId];
		}
		targetParameters["includeMethods"] = "True";
		targetParameters["includeViewMethods"] = "True";
		targetParameters["includeObjectDetails"] = "True";
		targetParameters["includeResultProperties"] = "True";
		targetParameters["includeControls"] = "True";
		targetParameters["includeControlTypeEvents"] = "True";
		targetParameters["FilterTypes"] = "MethodReturnedProperty|ViewField";
		targetParameters["showContext"] = "False";
		targetParameters["HelpID"] = "7048";

		var target = {};
		target["Parameters"] = targetParameters;
		target["Widget"] = "OrderWidget"
		target["Method"] = "initialize";


		var SettingsObj = {};
		SettingsObj["Contexts"] = settingsContextsArray;
		SettingsObj["Target"] = target;
		SettingsObj["ResultName"] = "Order";

		configWidget["Settings"] = [SettingsObj];
		configWidget.initialize();
		this.orderConfigWidget = configWidget;
		this.orderConfigWidget.parentWidget = this;
		this.orderConfigWidget.initCallBack = this.checkAllLoaded.bind(this);
	},

	TabClick: function ()
	{
		var ev = (typeof arguments[0] !== "undefined" && arguments[0] !== null) ? arguments[0] : null;
		var clickedTab = jQuery(ev.target).closest(".tab");
		var currentSelectedTab = this.Tabs.filter(".selected");
		if (clickedTab[0] !== currentSelectedTab[0])
		{
			//Hide old tab
			var currentSelectedTabContent = jQuery("#" + currentSelectedTab[0].id + "_Content");
			currentSelectedTabContent.hide();
			currentSelectedTab.removeClass('selected');

			//Show new tab
			var currentTabContent = jQuery("#" + clickedTab[0].id + "_Content");
			currentTabContent.show();
			clickedTab.addClass('selected');

			currentTabContent.find(".pane-container").panecontainer("destroy").panecontainer();

			this.orderConfigWidget.updated();
			this.filterConfigWidget.updated();
		}
		ev.preventDefault();
	}
}

jQuery.extend(RuntimeFilterOrderWidget.prototype, RuntimeFilterOrderWidgetProtoType);

function RuntimeConfigurationWidget()
{
}

var RuntimeConfigurationWidgetPrototype =
 {
	onWidgetCompleted: function (widget)
	{
		//#region
		var display = widget.display;
		var value = widget.value;
		var data = widget.data;

		var parentWidget = widget.parentWidget;
		if (widget.Settings[0].Target.Widget === "FilterWidget")
		{
			parentWidget.filterXml = $xml(value);
		}
		else
		{
			parentWidget.orderXml = $xml(value);
		}

		//#endregion
	},

	afterPluginInit: function ()
	{
		ConfigurationWidget.prototype.afterPluginInit.apply(this, arguments);
		if (checkExists(this.initCallBack))
		{
			this.initCallBack();
		}
	}
 }
jQuery.extend(RuntimeConfigurationWidget.prototype, ConfigurationWidget.prototype, RuntimeConfigurationWidgetPrototype);
