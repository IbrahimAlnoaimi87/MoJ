
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function ViewSettingsFilterWidget()
{
}

var ViewSettingsFilterWidgetProtoType =
{
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
		if (filterCriteria)
		{
			$("#FilterName").val(filterCriteria.childNodes[0].getAttribute("name"));
			var filterNode = filterCriteria.selectSingleNode("Filter");
			if (filterNode && filterNode.xml)
			{
				this.filterXml = mappingsTransformation.format("Filter", filterNode.xml);
			}
		}
	},

	getConfigurationXML: function ()
	{
		var isConfigurationValid = this.filterConfigWidget.save();
		var filterXml = "";

		if (!checkExists(this.filterXml.documentElement))
		{
			isConfigurationValid = false;
		}

		if (isConfigurationValid)
		{
			var node = this.filterXml.selectSingleNode("Mappings/Mapping/Filter");
			if (node && node.xml)
			{
				filterXml = node.xml;
			}
			return filterXml;
		}

		//onWidgetCompleted was not called, this.filterXml was not parsed
		return false;
	},

	_transformXml: function ()
	{
	},

	dispose: function ()
	{
	},

	_buildUI: function (parentElement)
	{
		this._createFilterContent();

		//		var data =
		//		{
		//		}

		//		var options =
		//		{
		//			url: applicationRoot + "Views/ViewSettingsWidgetContent.aspx",
		//			type: 'GET',
		//			cache: false,
		//			data: data,
		//			async: false,
		//			success: this._partialPageLoaded.bind(this)
		//		}

		//		jQuery.ajax(options);
	},

	_partialPageLoaded: function (responseText, textStatus, XMLHttpRequest)
	{
		var newParent = $(responseText);
		this.parentElement.replaceWith(newParent);
		this.parentElement = newParent;
		this.parentElement.find(".pane-container").panecontainer();
		this._createFilterContent();
	},

	initCallBack: function ()
	{

	},

	update: function ()
	{
		this.parentElement.find(".grid").grid("syncWidths");
	},

	_createFilterContent: function ()
	{
		//instantiate widget objects and send through the data
		var configWidget = new ViewSettingsConfigurationFilterWidget();

		if ($chk(this.filterXml))
		{
			configWidget.value = this.filterXml;
		}
		else
		{
			configWidget.value = null;
		}

		configWidget["container"] = $("#FilterContainer");
		configWidget["ContextHeading"] = Resources.Filtering.FilterWidgetContextHeading; //"Context Browser"
		configWidget["TargetHeading"] = "Filter";

		var Parameters = {};

		Parameters["includeFields"] = "True";
		Parameters["pluginName"] = "ViewContextPlugIn";
		Parameters["pluginMethod"] = "initialize";
		Parameters["viewID"] = this.viewId;
		Parameters["isCurrent"] = "True";

		configWidget["Parameters"] = Parameters;

		var settingsContext = {};
		var settingsContextParameters = {};
		settingsContextParameters["includeAll"] = "True";

		settingsContext["Parameters"] = settingsContextParameters;
		settingsContext["PlugIn"] = "SystemVariablesContextPlugIn";
		settingsContext["Method"] = "initialize";
		var settingsContextsArray = [];
		settingsContextsArray.push(settingsContext);

		var environmentContext = {};
		var environmentContextParameters = {};
		environmentContext["PlugIn"] = "EnvironmentFieldsContextPlugIn";
		environmentContext["Method"] = "initialize";
		environmentContext["Parameters"] = environmentContextParameters;
		settingsContextsArray.push(environmentContext);

		var viewContext = {};
		viewContext["PlugIn"] = "ViewContextPlugIn";
		viewContext["Method"] = "initialize";
		var viewContextParameters = {};
		viewContextParameters["viewID"] = this.viewId;
		viewContextParameters["isCurrent"] = "True";
		viewContextParameters["includeFields"] = "True";
		viewContextParameters["includeInputControls"] = "True";
		viewContextParameters["includeControls"] = "True";
		viewContextParameters["includeListingControls"] = "True";
		viewContextParameters["includeDisplayControls"] = "True";
		viewContextParameters["includeActionControls"] = "True";
		viewContextParameters["includeExecutionControls"] = "True";
		viewContextParameters["includeParameters"] = "True";
		viewContextParameters["includeControlProperties"] = "True";
		viewContextParameters["filterTypes"] = "Control";

		viewContext["Parameters"] = viewContextParameters;
		settingsContextsArray.push(viewContext);

		var targetParameters = {};
		targetParameters["viewID"] = this.viewId;
		targetParameters["includeFields"] = "True";
		targetParameters["pluginName"] = "ViewContextPlugIn";
		targetParameters["pluginMethod"] = "initialize";
		targetParameters["isCurrent"] = "True";
		targetParameters["includeFields"] = "True";
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
	}
}
jQuery.extend(ViewSettingsFilterWidget.prototype, ViewSettingsFilterWidgetProtoType);



function ViewSettingsConfigurationFilterWidget()
{
}

var ViewSettingsConfigurationFilterWidgetPrototype =
 {
	onWidgetCompleted: function (widget)
	{
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
	}
 }
 jQuery.extend(ViewSettingsConfigurationFilterWidget.prototype, ConfigurationWidget.prototype, ViewSettingsConfigurationFilterWidgetPrototype);
