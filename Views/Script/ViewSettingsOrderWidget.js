
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function ViewSettingsOrderWidget()
{
}

var ViewSettingsOrderWidgetProtoType =
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

		var orderXml = "";
		if (filterCriteria)
		{
			var orderNode = filterCriteria.selectSingleNode("Sorters");
			if (orderNode && orderNode.xml)
			{
				this.orderXml = mappingsTransformation.format("Order", orderNode.xml);
			}
		}
	},

	getConfigurationXML: function ()
	{
		this.orderConfigWidget.save();
		var orderXml = "";

		if (this.orderXml)
		{
			var node = this.orderXml.selectSingleNode("Mappings/Mapping/Sorters");
			if (node && node.xml)
			{
				orderXml = node.xml;
			}
		}

		return orderXml;
	},

	_transformXml: function ()
	{
	},

	dispose: function ()
	{
	},

	update: function ()
	{
		this.parentElement.find(".grid").grid("syncWidths");
	},

	_buildUI: function (parentElement)
	{
		this._createOrderContent();
	},

	_partialPageLoaded: function (responseText, textStatus, XMLHttpRequest)
	{
		var newParent = $(responseText);
		this.parentElement.replaceWith(newParent);
		this.parentElement = newParent;
		this.parentElement.find(".pane-container").panecontainer();
		this.parentElement.find(".panel").panel();
		this.initCallBack();

	},

	initCallBack: function ()
	{
		//This method should be overrided (at runtime)
	},

	_createOrderContent: function ()
	{
		//instantiate widget objects and send through the data
		var configWidget = new ViewSettingsConfigurationOrderWidget();
		configWidget.value = this.orderXml;
		configWidget["container"] = $("#OrderContainer");
		configWidget["ContextHeading"] = Resources.Filtering.FilterWidgetContextHeading; //"Context Browser"
		configWidget["TargetHeading"] = "Order";

		var Parameters = {};

		Parameters["includeFields"] = "True";
		Parameters["pluginName"] = "ViewContextPlugIn";
		Parameters["pluginMethod"] = "initialize";
		Parameters["viewID"] = this.viewId;
		Parameters["isCurrent"] = "True";

		configWidget["Parameters"] = Parameters;

		var settingsContextsArray = [];

		var targetParameters = {};
		targetParameters["viewID"] = this.viewId;
		targetParameters["pluginName"] = "ViewContextPlugIn";
		targetParameters["pluginMethod"] = "initialize";
		targetParameters["isCurrent"] = "True";
		targetParameters["includeMethods"] = "True";
		targetParameters["includeViewMethods"] = "True";
		targetParameters["includeObjectDetails"] = "True";
		targetParameters["includeResultProperties"] = "True";
		targetParameters["showContext"] = "False";
		targetParameters["FilterTypes"] = "MethodReturnedProperty|ViewField";

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
	}

}
jQuery.extend(ViewSettingsOrderWidget.prototype, ViewSettingsOrderWidgetProtoType);


function ViewSettingsConfigurationOrderWidget()
{

}

var ViewSettingsConfigurationOrderWidgetPrototype =
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
 jQuery.extend(ViewSettingsConfigurationOrderWidget.prototype, ConfigurationWidget.prototype, ViewSettingsConfigurationOrderWidgetPrototype);
