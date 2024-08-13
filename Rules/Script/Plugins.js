//to see proper commenting add the javascript region expander and collapser to visualstudio
//general function used by popups
function comparePluginSetting(setting1, setting2)
{
    var s1 = (checkExists(setting1)) ? setting1 : "False";
    var s2 = (checkExists(setting2)) ? setting2 : "False";
    return s1 === s2;
}

//cached plugins
//#region
var cachedPlugins = [];
var numberOfItemsToCache = 20;
function cachedPluginIndex(plugin)
{
    for (var j = 0; j < cachedPlugins.length; j++)
    {
        if (cachedPlugins[j].equals(plugin, false))
        {
            return j;
        }
    }
    return -1;
}

function getCachedPluginResult(position)
{
    return cachedPlugins[position].cachedResult;
}

function addPlugInToCache(plugin)
{
    var pos = cachedPluginIndex(plugin);
    if (pos === -1)
    {
        if (cachedPlugins.length >= numberOfItemsToCache)
        {
            cachedPlugins.splice(0, 1);
        }
        cachedPlugins.push(plugin);
    }
}

function GetContextTreeTransformer()
{
    var transformer = new XslTransform();
    transformer.importStylesheet(applicationRoot + "Rules/XSLT/ContextTree.xslt");
    transformer.addParameter("Fields", ContextTree_TreeExtraHeading_Fields);
    transformer.addParameter("Controls", ContextTree_TreeExtraHeading_Controls);
    transformer.addParameter("Expressions", ContextTree_TreeExtraHeading_Expressions);
    transformer.addParameter("Methods", ContextTree_TreeExtraHeading_Methods);
    transformer.addParameter("Parameters", ContextTree_TreeExtraHeading_Parameters);
    transformer.addParameter("InputProperties", ContextTree_TreeExtraHeading_InputProperties);
    transformer.addParameter("ReturnProperties", ContextTree_TreeExtraHeading_ReturnProperties);
    transformer.addParameter("NoItemsToDisplay", ContextTree_NoItemsToDisplay);
    transformer.addParameter("Display", ContextTree_ListDisplay);
    transformer.addParameter("Edit", ContextTree_ListEdit);
    transformer.addParameter("Header", ContextTree_ListHeader);
    transformer.addParameter("Footer", ContextTree_ListFooter);
    transformer.addParameter("ControlMethodProperties", ContextTree_TreeExtraHeading_ControlMethodProperties);
    transformer.addParameter("ControlMethodResult", ContextTree_TreeExtraHeading_ControlMethodResult);
    transformer.addParameter("TitleSystemName", ContextTree_TitleSystemNameLabel);
    transformer.addParameter("TitleDescription", ContextTree_TitleDescriptionLabel);
    return transformer;
}

//#endregion

//the object field/properties plugin - this is used in the viewcontextplugin and in the smartobject context plugin
// -- This plugin can not be called directly but only through a view or object or form plugin--
//#region
//Include Settings :
//#region
//if none of the types is set all of them will be returned
//if one or more is set only those that were set to true will be returned (default value = false)

//includeTextFields 
//includeMemoFields
//includeFileFields
//includeImageFields
//includeNumberFields
//includeDecimalFields
//includeXmlFields
//includeHyperlinkFields
//includeMultiValueFields
//includeAutonumberFields
//includeAutoGuidFields
//includeGuidFields
//includeYesNoFields
//#endregion

function ObjectFieldsContextPlugIn()
{
    this.dataType = "context";
}

ObjectFieldsContextPlugIn.prototype = {


    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region

        //if no field settings were specified return everything
        if (!this.Settings.includeTextFields && !this.Settings.includeMemoFields && !this.Settings.includeFileFields
            && !this.Settings.includeImageFields && !this.Settings.includeNumberFields && !this.Settings.includeMultiValueFields
            && !this.Settings.includeDecimalFields && !this.Settings.includeXmlFields && !this.Settings.includeHyperlinkFields
            && !this.Settings.includeYesNoFields
            && !this.Settings.includeAutonumberFields && !this.Settings.includeAutoGuidFields && !this.Settings.includeGuidFields)
        {
            return;
        }
        //else if the setting is not specified use the default value false
        var removeCategoryTypeXpath = "";
        if (!this.Settings.includeTextFields || this.Settings.includeTextFields === "False")
        {
            removeCategoryTypeXpath += "@SubType = 'Text'";
        }

        if (!this.Settings.includeMemoFields || this.Settings.includeMemoFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Memo'";
        }

        if (!this.Settings.includeDecimalFields || this.Settings.includeDecimalFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Decimal'";
        }

        if (!this.Settings.includeFileFields || this.Settings.includeFileFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'File'";
        }

        if (!this.Settings.includeImageFields || this.Settings.includeImageFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Image'";
        }

        if (!this.Settings.includeNumberFields || this.Settings.includeNumberFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Number'";
        }

        if (!this.Settings.includeMultiValueFields || this.Settings.includeMultiValueFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'MultiValue'";
        }

        if (!this.Settings.includeXmlFields || this.Settings.includeXmlFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Xml'";
        }

        if (!this.Settings.includeHyperlinkFields || this.Settings.includeHyperlinkFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'HyperLink' or @SubType = 'Hyperlink'";
        }

        if (!this.Settings.includeAutonumberFields || this.Settings.includeAutonumberFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Autonumber' or @SubType = 'AutoNumber'";
        }

        if (!this.Settings.includeAutoGuidFields || this.Settings.includeAutoGuidFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'AutoGuid'";
        }

        if (!this.Settings.includeGuidFields || this.Settings.includeGuidFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'Guid'";
        }

        if (!this.Settings.includeYesNoFields || this.Settings.includeYesNoFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'YesNo'";
        }

        if (!this.Settings.includeDateTimeFields || this.Settings.includeDateTimeFields === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "@SubType = 'DateTime'";
        }

        if (removeCategoryTypeXpath.length > 0)
        {
            removeXmlNodes(xmlDoc, "//Item[" + removeCategoryTypeXpath + "]");
        }
    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        //compare all valid values, if one is not the same return false
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeTextFields, plugin.Settings.includeTextFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeMemoFields, plugin.Settings.includeMemoFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeNumberFields, plugin.Settings.includeNumberFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeDecimalFields, plugin.Settings.includeDecimalFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeFileFields, plugin.Settings.includeFileFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeImageFields, plugin.Settings.includeImageFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeHyperlinkFields, plugin.Settings.includeHyperlinkFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeXmlFields, plugin.Settings.includeXmlFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeMultivalueFields, plugin.Settings.includeMultivalueFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeAutonumberFields, plugin.Settings.includeAutonumberFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeAutoGuidFields, plugin.Settings.includeAutoGuidFields))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeGuidFields, plugin.Settings.includeGuidFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck))
        {
            return false;
        }

        return true;

    }
    //#endregion

}

//#endregion

//the ViewControls plugin returns all controls for a view - from the view designer or utils.
// -- This plugin can not be called directly but only through a view or form plugin--
//#region

//Include Settings:
//#region
//if none of the types is set all of them will be returned
//if one or more is set only those that were set to true will be returned (default value = false)

//includeInputControls
//includeListingControls
//includeDisplayControls
//includeActionControls
//includeLayoutControls
//#endregion


function ControlsContextPlugIn()
{
    this.dataType = "context";
}

ControlsContextPlugIn.prototype = {

    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region

        //if no control settings were specified return everything
        if (!this.Settings.includeInputControls && !this.Settings.includeListingControls && !this.Settings.includeDisplayControls
            && !this.Settings.includeActionControls && !this.Settings.includeLayoutControls && !this.Settings.includeCanvasControls && !this.Settings.includeExecutionControls)
        {
            return;
        }
        //else if the setting is not specified use the default value false
        var removeCategoryTypeXpath = "";
        var removeControlTypeCategoryXpath = "";
        if (!this.Settings.includeInputControls || this.Settings.includeInputControls === "False")
        {
            removeCategoryTypeXpath += "text() = 'Input' or text() = 0";

        }
        if (!this.Settings.includeListingControls || this.Settings.includeListingControls === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "text() = 'Listing' or text() = 1";
        }
        if (!this.Settings.includeActionControls || this.Settings.includeActionControls === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "text() = 'Action' or text() = 3";
        }
        if (!this.Settings.includeDisplayControls || this.Settings.includeDisplayControls === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "text() = 'Display' or text() = 2";
        }
        if (!this.Settings.includeLayoutControls || this.Settings.includeLayoutControls === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "text() = 'Layout' or text() = 4";
        }
        if (!this.Settings.includeCanvasControls || this.Settings.includeCanvasControls === "False")
        {
            if (removeControlTypeCategoryXpath.length > 0)
            {
                removeControlTypeCategoryXpath += " or ";
            }
            removeControlTypeCategoryXpath += "((Category = 'Canvas' or Category = 6)";

            if (!this.Settings.includeAreaItemProperties || this.Settings.includeAreaItemProperties === "False")
            {
                removeControlTypeCategoryXpath += " or (@SubType='AreaItem'))";
            }
            else
            {
                removeControlTypeCategoryXpath += " and (@SubType!='AreaItem'))";
            }
        } else
        {
            if (removeControlTypeCategoryXpath.length > 0)
            {
                removeControlTypeCategoryXpath += " or ";
            }
            removeControlTypeCategoryXpath += "((Category = 'Canvas' or Category = 6) and (@SubType!='Column') and (@SubType!='Panel')";

            if (!this.Settings.includeAreaItemProperties || this.Settings.includeAreaItemProperties === "False")
            {
                removeControlTypeCategoryXpath += " or (@SubType='AreaItem'))"; // areaItems in the root don't have categories. 
            }
            else
            {
                removeControlTypeCategoryXpath += " and (@SubType!='AreaItem'))";
            }
        }
        if (this.Settings.filterSubTypes && this.Settings.filterSubTypes != "")
        {
            var subTypeArray = this.Settings.filterSubTypes.split("|");
            var subTypeXPath = "";
            for (var s = 0; s < subTypeArray.length; s++)
            {
                if (s > 0)
                {
                    subTypeXPath += " and ";
                }

                subTypeXPath += "@SubType != '" + subTypeArray[s] + "'";
            }

            removeXmlNodes(xmlDoc, "//Item[(@ItemType = 'Control') and ({0})]".format(subTypeXPath));
        }

        if (!this.Settings.includeExecutionControls || this.Settings.includeExecutionControls === "False")
        {
            if (removeCategoryTypeXpath.length > 0)
            {
                removeCategoryTypeXpath += " or ";
            }
            removeCategoryTypeXpath += "text() = 'Execution' or text() = 7";
        }

        if (removeCategoryTypeXpath.length > 0)
        {
            removeXmlNodes(xmlDoc, "//Item[Category[" + removeCategoryTypeXpath + "] and @ItemType = 'Control']");
        }

        if (removeControlTypeCategoryXpath.length > 0)
        {
            removeXmlNodes(xmlDoc, "//Item[" + removeControlTypeCategoryXpath + " and @ItemType = 'Control']");
        }

        removeXmlNodes(xmlDoc, "//Item[@ItemType='Control' and (@SubType='ListTable' or @SubType='ToolbarTable')]");

    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        //compare all valid values, if one is not the same return false
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.viewID, plugin.Settings.viewID))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeInputControls, plugin.Settings.includeInputControls))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeListingControls, plugin.Settings.includeListingControls))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeDisplayControls, plugin.Settings.includeDisplayControls))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeActionControls, plugin.Settings.includeActionControls))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeLayoutControls, plugin.Settings.includeLayoutControls))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeExecutionControls, plugin.Settings.includeExecutionControls))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeExpressions, plugin.Settings.includeExpressions))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeCanvasControls, plugin.Settings.includeCanvasControls))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlMethods, plugin.Settings.includeControlMethods))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlMethodParameters, plugin.Settings.includeControlMethodParameters))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeAreaItemProperties, plugin.Settings.includeAreaItemProperties))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck))
        {
            return false;
        }

        return true;

    }
    //#endregion

}
//#endregion


//the View plugin returns all data for a view - from the form designer or utils.
//#region

//Include Settings
//#region
//isCurrent - current view being edited/created
//viewID - view's id (only used when it is not the current view)
//method - the smartobject method that should be filtered (this is passed to the object plugin)
//viewControlID - the control ID that has to be filtered on, sometimes this filters on smartobject below it too

//includeControls
//IncludeFields

//includeObjectDetails - this setting has to be set if method required properties etc should be read from the smartobject itself

//includeMethods = this setting includes all the primary smartobject methods
//includeViewMethods - this setting includes the view methods initialize and cleared

//includeControlTypeEvents - this setting also gets the events for the specific control type from utils

//all the includes from the following plugins:
//  ViewControlContextPlugIn
//  ObjectContectPlugIn
//      ObjectFieldContextPlugIn


//includeListViews - filters on the view node
//includeCaptureViews
//includeCaptureListViews

//This is the most complex plugin.
//if none of the settings is set only the view itself is returned
//Then the settings fall in different levels.
//Controls and fields are on the same level - so if one of the two is set the other one will assume it's default value false.
//Settings of control types (action/listing/display/input etc) and of field types (number,text,decimal etc) fall on the next level 
//- so if fields is included but none of the field type settings is specified all the fieldtypes will be returned
//, however if one of them is set the others will assume their default value of false. The same for the controls
//The Object Details setting fall on the same level as control and field - all objectContextPlugin settings apply
//Control type Events fall under the controls.    

//#endregion

function ViewContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "context";
}

ViewContextPlugIn.prototype = {

    initialize: function ()
    {
        //#region
        var _this = this;

        this.initializeSubObjects();

        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        //read value
        if (this.Settings.isCurrent === 'True')
        {
            if (!SourceCode.Forms.Designers.View.ViewDesigner._getViewMethods)
            {
                popupManager.showWarning("Invalid Configuration: Cannot find Current View");
                return;
            }

            //if this is the current view and only methods and no details is required call other method on view
            if ((!this.Settings.includeObjectDetails || this.Settings.includeObjectDetails === 'False')
                && (!this.Settings.includeFields || this.Settings.includeFields === 'False')
                && (!this.Settings.includeControls || this.Settings.includeControls === 'False')
                && (!this.Settings.includeExpressions || this.Settings.includeExpressions === 'False')
                && (!this.Settings.includeMethodParameters || this.Settings.includeMethodParameters === 'False')
                && (!this.Settings.includeRequiredProperties || this.Settings.includeRequiredProperties === 'False')
                && (!this.Settings.includeOptionalProperties || this.Settings.includeOptionalProperties === 'False')
                && (!this.Settings.includeResultProperties || this.Settings.includeResultProperties === 'False')
                && ((this.Settings.includeMethods && this.Settings.includeMethods === 'True')
                    || (this.Settings.includeViewMethods && this.Settings.includeViewMethods === 'True')))
            {
                var viewMethods = SourceCode.Forms.Designers.View.ViewDesigner._getViewMethods();

                if (!this.Settings.includeViewMethods || this.Settings.includeViewMethods === 'False')
                {
                    var methodsXml = parseXML(viewMethods);
                    removeXmlNodes(methodsXml, "//Item[@ItemType = 'ViewMethod']");
                    viewMethods = methodsXml.xml;
                }
                else if (!this.Settings.includeMethods || this.Settings.includeMethods === 'False')
                {
                    var methodsXml = parseXML(viewMethods);
                    removeXmlNodes(methodsXml, "//Item[@ItemType = 'Method']");
                    viewMethods = methodsXml.xml;
                }
                this.dataReturned(viewMethods);
            }
            else
            {
                var tmpViewDefinition;
                if (checkExists(SourceCode.Forms.Designers.Rule.tmpContextDefinition) && SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectSingleNode("//Views/View") !== null)
                {
                    tmpViewDefinition = SourceCode.Forms.Designers.Rule.tmpContextDefinition;
                }

                var viewUtilsXml = parseXML(SourceCode.Forms.Designers.View.ViewDesigner._getViewObjects(this.Settings.includeControlProperties === "True" || this.Settings.includeControlFields === "True", tmpViewDefinition));

                //remove settings not wanted

                if (!this.Settings.includeParameters || this.Settings.includeParameters === "False")
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='ViewParameter']");
                }
                else
                {
                    if (_this.Settings.includeViewParameterEvents && _this.Settings.includeViewParameterEvents.toUpperCase() === "TRUE")
                    {
                        var result = parseXML(jQuery.ajax({
                            data: {
                                method: "getItems",
                                resultTypes: "ViewParameterEvents"
                            },
                            url: applicationRoot + "Utilities/AJAXcall.ashx",
                            type: "POST",
                            async: false,
                            error: function (httpRequest, status, error)
                            {
                                popupManager.showError(httpRequest + ", " + status);
                            },
                            dataType: "text"
                        }).responseText);


                        var viewParameters = viewUtilsXml.selectNodes("Items/Item/Items/Item[@ItemType='ViewParameter']");
                        var viewParametersLength = viewParameters.length;

                        for (var v = 0; v < viewParametersLength; v++)
                        {
                            var viewParameterEvents = result.selectSingleNode("Items").cloneNode(true);
                            var currentViewParameter = viewParameters[v];
                            currentViewParameter.appendChild(viewParameterEvents);
                        }
                    }
                }

                if (!this.Settings.includeFields || this.Settings.includeFields === "False")
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='FieldContext']");
                }

                if (!this.Settings.includeControls || this.Settings.includeControls === "False")
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='Control']");
                }

                if (!this.Settings.includeControlProperties || this.Settings.includeControlProperties === "False")
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='Control']/Items/Item[@ItemType='ControlProperty']");
                }
                else
                {
                    if (checkExists(_this.Settings.includeControlProperties) && _this.Settings.includeControlProperties.toLowerCase() === "true")
                    {
                        var settingsControlID = null;

                        if (checkExistsNotEmpty(_this.Settings.viewControlID))
                        {
                            settingsControlID = _this.Settings.viewControlID;
                        }

                        if (checkExistsNotEmpty(_this.Settings.formControlID))
                        {
                            settingsControlID = _this.Settings.formControlID;
                        }

                        if (settingsControlID !== null)
                        {
                            var currentControlNodes = viewUtilsXml.selectNodes("//Items/Item[(@ItemType='Control') and (@Guid='{0}')]".format(settingsControlID));
                            var currentControlNodesLength = currentControlNodes.length;

                            for (var c = 0; c < currentControlNodesLength; c++)
                            {
                                var currentControlNode = currentControlNodes[c];
                                var currentControlID = currentControlNode.getAttribute("Guid");
                                var currentControlType = currentControlNode.getAttribute("SubType");

                                SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: currentControlNode, controlID: currentControlID, controlType: currentControlType });
                            }
                        }
                    }
                }

                if (!this.Settings.includeControlFields || this.Settings.includeControlFields === "False")
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='Control']/Items/Item[@ItemType='ControlField']");
                }
                else if (!this.Settings.includeControlProperties || this.Settings.includeControlProperties === "False")
                {
                    //this should olny execute if includeControlProperties == undefined|null|false, otherwise it will duplicate work done above and cause problems
                    if (checkExists(_this.Settings.includeControlFields) && _this.Settings.includeControlFields.toLowerCase() === "true")
                    {
                        var settingsControlID = null;

                        if (checkExistsNotEmpty(_this.Settings.viewControlID))
                        {
                            settingsControlID = _this.Settings.viewControlID;
                        }

                        if (checkExistsNotEmpty(_this.Settings.formControlID))
                        {
                            settingsControlID = _this.Settings.formControlID;
                        }

                        if (settingsControlID !== null)
                        {
                            var currentControlNodes = viewUtilsXml.selectNodes("//Items/Item[(@ItemType='Control') and (@Guid='{0}')]".format(settingsControlID));
                            var currentControlNodesLength = currentControlNodes.length;

                            for (var c = 0; c < currentControlNodesLength; c++)
                            {
                                var currentControlNode = currentControlNodes[c];
                                var currentControlID = currentControlNode.getAttribute("Guid");
                                var currentControlType = currentControlNode.getAttribute("SubType");

                                SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: currentControlNode, controlID: currentControlID, controlType: currentControlType });

                            }
                        }
                    }
                }


                if (this.Settings.includeFields && this.Settings.includeFields !== "False")
                {
                    //populate control field mappings
                    if (this.Settings.includeControls)
                    {
                        var controlXP = "/Items/Item/Items/Item[@ItemType='Control']";
                        if (this.Settings.viewControlID)
                            controlXP += "[ContextID='" + this.Settings.viewControlID + "']";
                        var controls = viewUtilsXml.selectNodes(controlXP);
                        for (var i = 0; i < controls.length; i++)
                        {
                            var controlId = controls[i].getAttribute("Guid");
                            var controlField = SourceCode.Forms.Designers.View.controlPropertiesXML.selectSingleNode("Control[@ID='{0}']".format(controlId)).getAttribute("FieldID");
                            if (controlField)
                            {
                                var field = viewUtilsXml.selectSingleNode("/Items/Item/Items/Item[@ItemType='FieldContext']/Items/Item[@Guid='{0}']".format(controlField));
                                if (field)
                                {
                                    //Changed this to be Source.SourceID and Field.FieldName, to be the same as in FormsHelper.cs and to do automappings correctly
                                    var fullObjectName = field.selectSingleNode("ObjectGuid").text + "_" + field.selectSingleNode("PropertyName").text;
                                    if (field.getAttribute("FieldControl") !== null)
                                    {
                                        controlId = field.getAttribute("FieldControl") + "," + controlId;
                                    }
                                    field.setAttribute("FieldControl", controlId);
                                    field.setAttribute("FieldObject", fullObjectName);
                                    controls[i].setAttribute("ControlField", fullObjectName);
                                }
                            }
                        }
                    }
                }

                if (!this.Settings.includeExpressions || this.Settings.includeExpressions === 'False')
                {
                    removeXmlNodes(viewUtilsXml, "/Items/Item/Items/Item[@ItemType='Expression']");
                }

                if (this.Settings.includeObjectDetails && this.Settings.includeObjectDetails === "True")
                {
                    var temp = this.objectPlugIn.setResultTypes();
                    var localViewMethods = SourceCode.Forms.Designers.View.ViewDesigner._getViewMethods();
                    var localMethodsIncluded = false;
                    var localViewMethodItemsElement;
                    // Begin Methods added for the error method
                    if (checkExistsNotEmpty(localViewMethods))
                    {
                        var localViewMethodsDocument = parseXML(localViewMethods);
                        localViewMethodItemsElement = localViewMethodsDocument.selectSingleNode("Items");
                        if (this.Settings.includeViewMethods && this.Settings.includeViewMethods === "True")
                        {
                            var methodXP = "";
                            if (this.Settings.method)
                            {
                                methodXP = "[Name='{0}']".format(this.Settings.method);
                            }
                            var viewMethodNodes = localViewMethodItemsElement.selectNodes("Item[@ItemType='ViewMethod']{0}".format(methodXP));
                            var viewUtilsXmlParentItems = viewUtilsXml.selectSingleNode("Items/Item[@ItemType='View']/Items");
                            for (var z = 0, zl = viewMethodNodes.length; z < zl; z++)
                            {
                                viewUtilsXmlParentItems.appendChild(viewMethodNodes[z].cloneNode(true));
                            }
                            localMethodsIncluded = true;
                        }
                    }
                    // End Methods added for the error method
                    if (!this.Settings.viewControlID && checkExists(localViewMethodItemsElement)) //then this is the primary so
                    {
                        var objectID = localViewMethodItemsElement.selectSingleNode("Item[@ItemType='Object']").getAttribute("Guid");

                        if ($chk(objectID))
                        {
                            jQuery.ajax({
                                data: {
                                    method: "getItems",
                                    targetType: 'Object',
                                    targetID: objectID,
                                    resultTypes: temp
                                },

                                global: false,
                                url: applicationRoot + "Utilities/AJAXcall.ashx",
                                dataType: "text",
                                type: "POST",
                                async: true,
                                error: function (httpRequest, status, error)
                                {
                                    popupManager.showError(httpRequest + ", " + status);
                                },
                                success: function (httpResponse)
                                {
                                    if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                                    {
                                        SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                        return;
                                    }
                                    else
                                    {

                                        with (_this)
                                        {
                                            var objectClonedNode = parseXML(httpResponse).selectSingleNode("/Items/Item[@ItemType='Object']").cloneNode(true);
                                            viewUtilsXml.selectSingleNode("/Items/Item[@ItemType='View']/Items").appendChild(objectClonedNode);
                                            var contextTypeEl = viewUtilsXml.createElement("ContextType");
                                            contextTypeEl.appendChild(viewUtilsXml.createTextNode("Primary"));
                                            viewUtilsXml.selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']").appendChild(contextTypeEl);
                                            viewUtilsXml.selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']").appendChild(viewUtilsXml.selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']/Items"));
                                            if (!localMethodsIncluded && _this.Settings.includeViewMethods && _this.Settings.includeViewMethods === 'True')
                                            {
                                                var viewMethods = parseXML(SourceCode.Forms.Designers.View.ViewDesigner._getViewMethods());
                                                var nodeToAppendTo = viewUtilsXml.selectSingleNode("/Items/Item[@ItemType='View']/Items")
                                                cloneNodes(nodeToAppendTo, viewMethods, "//Item[@ItemType='ViewMethod']");
                                            }
                                            _this.dataReturned(viewUtilsXml.xml);

                                        }

                                    }
                                }
                            });
                        } else
                        {
                            _this.dataReturned(viewUtilsXml.xml);
                        }
                    }
                    else if (this.Settings.viewControlID)
                    {
                        var objectAssocNode = parseXML(SourceCode.Forms.Designers.View.ViewDesigner._getViewListControls()).selectSingleNode("/Items/Item[@ItemType='Control' and @Guid='" + this.Settings.viewControlID + "']");

                        var soIdToUse = null;
                        if (checkExists(objectAssocNode))
                        {
                            soIdToUse = objectAssocNode.selectSingleNode('AssociationSO');

                            // Composite Checkbox Lists - DisplaySO for populate and the rest AssociatedSO.
                            var isComposite = objectAssocNode.selectSingleNode("IsComposite");
                            if (checkExists(isComposite) && isComposite.text.toUpperCase() === "TRUE" && checkExists(this.Settings.compositeObjToUse) && this.Settings.compositeObjToUse.toUpperCase() === "DISPLAY")
                            {
                                var displaySO = objectAssocNode.selectSingleNode('DisplaySO');
                                if (checkExistsNotEmpty(displaySO))
                                {
                                    soIdToUse = displaySO;
                                }
                            }
                        }

                        //then there is no associated smartobject
                        if (!checkExists(soIdToUse))
                        {
                            this.dataReturned("<Items/>");
                            return;
                        }

                        var objectID = soIdToUse.text;

                        jQuery.ajax({
                            data: {
                                method: "getItems",
                                targetType: 'Object',
                                targetID: objectID,
                                resultTypes: temp
                            },
                            url: applicationRoot + "Utilities/AJAXcall.ashx",
                            dataType: "text",
                            type: "POST",
                            async: true,
                            error: function (httpRequest, status, error)
                            {
                                popupManager.showError(httpRequest + ", " + status);
                            },
                            global: false,
                            success: function (httpResponse)
                            {
                                if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                                {
                                    SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                    return;
                                } else
                                {
                                    viewUtilsXml = _this.updateViewXmlWithGetItemsResponse(httpResponse, _this.Settings.viewControlID, viewUtilsXml);

                                    _this.dataReturned(viewUtilsXml.xml);
                                }
                            }
                        });
                    }

                }
                else if (this.Settings.includeControlTypeEvents && this.Settings.includeControlTypeEvents === "True")
                {
                    jQuery.ajax({
                        data: {
                            method: "getItems",
                            resultTypes: "ControlTypeEvents"
                        },
                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                        type: "POST",
                        async: true,
                        error: function (httpRequest, status, error)
                        {
                            popupManager.showError(httpRequest + ", " + status);
                        },
                        dataType: "text",
                        global: false,
                        success: function (httpResponse)
                        {
                            if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                            {
                                SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                return;
                            } else
                            {
                                with (_this, viewUtilsXml)
                                {
                                    var controlsXml = parseXML(httpResponse);
                                    var controls = viewUtilsXml.selectNodes("/Items/Item/Items/Item[@ItemType='Control']");
                                    for (var m = 0; m < controls.length; m++)
                                    {
                                        var controlItemsNode = controlsXml.selectSingleNode("/Items/Item[Name='" + controls[m].getAttribute("SubType") + "']/Items");
                                        if (controlItemsNode)
                                        {
                                            controls[m].appendChild(controlItemsNode.cloneNode(true));
                                        }
                                    }
                                    _this.dataReturned(viewUtilsXml.xml);
                                }

                            }
                        }
                    });

                }
                else if (checkExists(this.Settings.includeControlMethods) && this.Settings.includeControlMethods === "True")
                {
                    var resultTypes = "ControlMethods";

                    if (this.Settings.includeControlMethodParameters && this.Settings.includeControlMethodParameters === "True")
                    {
                        resultTypes += "|ControlMethodParameters"
                    }

                    jQuery.ajax({
                        data: {
                            method: "getItems",
                            resultTypes: resultTypes
                        },
                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                        type: "POST",
                        async: true,
                        error: function (httpRequest, status, error)
                        {
                            popupManager.showError(httpRequest + ", " + status);
                        },
                        dataType: "text",
                        global: false,
                        success: function (httpResponse)
                        {
                            if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                            {
                                SourceCode.Forms.ExceptionHandler.handleException(httpResponse);
                                return;
                            }
                            else
                            {
                                var controlsXml = parseXML(httpResponse);
                                var xpath = "/Items/Item/Items/Item[@ItemType='Control'"
                                if (checkExists(_this.Settings.viewControlID))
                                    xpath += " and @Guid='{0}']".format(_this.Settings.viewControlID);
                                else
                                    xpath += "]";
                                var controls = viewUtilsXml.selectNodes(xpath);
                                for (var m = 0; m < controls.length; m++)
                                {
                                    var itemsNode = controls[m].selectSingleNode("Items");
                                    if (!checkExists(itemsNode))
                                    {
                                        itemsNode = viewUtilsXml.createElement("Items");
                                        controls[m].appendChild(itemsNode);
                                    }

                                    var controlmethodsXpath = "/Items/Item[Name='{0}']/Items/Item".format(controls[m].getAttribute("SubType"));
                                    if (checkExists(_this.Settings.controlMethodName))
                                        controlmethodsXpath += "[Name='{0}']".format(_this.Settings.controlMethodName);

                                    var methods = controlsXml.selectNodes(controlmethodsXpath);
                                    for (var z = 0, ml = methods.length; z < ml; z++)
                                    {
                                        itemsNode.appendChild(methods[z].cloneNode(true));
                                    }
                                }
                                _this.dataReturned(viewUtilsXml.xml);
                            }
                        }
                    });

                }
                else
                {
                    this.dataReturned(viewUtilsXml.xml);
                }
            }
        }
        else
        {
            if (this.Settings.viewControlID && this.Settings.includeObjectDetails && this.Settings.includeObjectDetails === "True")
            {
                var resultTypes = this.setResultTypes();

                // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                var includeHidden = this.Settings.skipViewRightsCheck;
                if (includeHidden === undefined)
                {
                    includeHidden = true;
                }

                jQuery.ajax({
                    data: {
                        method: "getItems",
                        targetType: 'View',
                        targetID: this.Settings.viewID,
                        resultTypes: resultTypes,
                        includeHidden: includeHidden
                    },
                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                    dataType: "text",
                    type: "POST",
                    async: true,
                    error: function (httpRequest, status, error)
                    {
                        popupManager.showError(httpRequest + ", " + status);
                    },
                    global: false,
                    success: function (httpResponse)
                    {
                        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                            return;
                        }
                        else
                        {
                            with (_this)
                            {
                                var temp = _this.objectPlugIn.setResultTypes();

                                var tmpXmlDoc = parseXML(httpResponse);
                                var viewElem = tmpXmlDoc.selectSingleNode("Items/Item[(@ItemType='View')]")
                                var associationSONode = viewElem.selectSingleNode("Items/Item[(@ItemType='Control') and (@Guid='" + _this.Settings.viewControlID + "')]");

                                var soIdToUse = null;
                                if (checkExists(associationSONode))
                                {
                                    soIdToUse = associationSONode.selectSingleNode('AssociationSO');
                                    // Composite Checkbox Lists - DisplaySO for populate and the rest AssociatedSO.
                                    var isComposite = associationSONode.selectSingleNode("IsComposite");
                                    if (checkExists(isComposite) && isComposite.text.toUpperCase() === "TRUE" && checkExists(_this.Settings.compositeObjToUse) && _this.Settings.compositeObjToUse.toUpperCase() === "DISPLAY")
                                    {
                                        var displaySO = associationSONode.selectSingleNode('DisplaySO');
                                        if (checkExistsNotEmpty(displaySO))
                                        {
                                            soIdToUse = displaySO;
                                        }
                                    }
                                }
                                else
                                {
                                    // Filter out the correct composite SMO.
                                    if (checkExists(_this.Settings.compositeObjToUse))
                                    {
                                        if (_this.Settings.compositeObjToUse.toUpperCase() === "DISPLAY")
                                        {
                                            var nodeToRemove = viewElem.selectSingleNode('Items[Item[@SubType="Composite"] and count(Item[@ItemType="Object"])=2]/Item[@ItemType="Object" and @SubType="Composite"]');
                                            if (checkExists(nodeToRemove))
                                            {
                                                nodeToRemove.parentNode.removeChild(nodeToRemove);
                                            }
                                        }
                                        else if (_this.Settings.compositeObjToUse.toUpperCase() === "VALUE")
                                        {
                                            var nodeToRemove = viewElem.selectSingleNode('Items[Item[@SubType="Composite"] and count(Item[@ItemType="Object"])=2]/Item[@ItemType="Object" and @SubType="User"]');
                                            if (checkExists(nodeToRemove))
                                            {
                                                nodeToRemove.parentNode.removeChild(nodeToRemove);
                                            }
                                        }
                                    }
                                }

                                if (checkExists(soIdToUse) && soIdToUse.text !== "")
                                {
                                    var controlSOID = soIdToUse.text;

                                    jQuery.ajax({
                                        data: {
                                            method: "getItems",
                                            targetType: 'Object',
                                            targetID: controlSOID,
                                            resultTypes: temp
                                        },
                                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                                        dataType: "text",
                                        type: "POST",
                                        async: true,
                                        error: function (httpRequest, status, error)
                                        {
                                            popupManager.showError(httpRequest + ", " + status);
                                        },
                                        global: false,
                                        success: function (httpResponse)
                                        {
                                            if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                                            {
                                                SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                                return;
                                            }
                                            else
                                            {
                                                with (_this)
                                                {
                                                    var fieldNode = tmpXmlDoc.selectSingleNode("/Items/Item[@ItemType='View']/Items");
                                                    var fieldNodeChildren = fieldNode.selectNodes("Item[not(@ItemType='FieldContext' and not(@SubType))]");
                                                    var controlNode;

                                                    for (var f = 0; f < fieldNodeChildren.length; f++)
                                                    {
                                                        fieldNode.removeChild(fieldNodeChildren[f]);
                                                    }

                                                    var soNode = parseXML(httpResponse).selectSingleNode("/Items/Item[@ItemType='Object']");
                                                    if (soNode !== null)
                                                    {
                                                        var clonedItemNode = soNode.cloneNode(true);
                                                        fieldNode.appendChild(clonedItemNode);
                                                        var contextTypeEl = tmpXmlDoc.createElement("ContextType");
                                                        contextTypeEl.appendChild(tmpXmlDoc.createTextNode("Association"));
                                                        var controlEl = tmpXmlDoc.createElement("ControlID");
                                                        controlEl.appendChild(tmpXmlDoc.createTextNode(_this.Settings.viewControlID));
                                                        var newSONode = tmpXmlDoc.selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']");
                                                        newSONode.appendChild(contextTypeEl);
                                                        newSONode.appendChild(controlEl);
                                                        newSONode.appendChild(newSONode.selectSingleNode("Items"));
                                                    }
                                                    _this.dataReturned(tmpXmlDoc.xml);
                                                }
                                            }
                                        }
                                    });
                                }
                                else
                                {
                                    _this.dataReturned(tmpXmlDoc.xml);
                                }

                            }
                        }
                    }
                });
            }
            else
            {
                var resultTypes = this.setResultTypes();

                if (!this.Settings.viewID)
                {
                    jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                    if (popupManager.popUps.length < 2)
                    {
                        popupManager.showWarning("ViewContextPlugin Error: The required parameter viewID was not specified.");
                    }

                    return;
                }

                // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                var includeHidden = this.Settings.skipViewRightsCheck;
                if (includeHidden === undefined)
                {
                    includeHidden = true;
                }

                jQuery.ajax({
                    data: {
                        method: "getItems",
                        targetType: 'View',
                        targetID: this.Settings.viewID,
                        resultTypes: resultTypes,
                        includeHidden: includeHidden
                    },
                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                    type: "POST",
                    async: true,
                    error: function (httpRequest, status, error)
                    {
                        popupManager.showError(httpRequest + ", " + status);
                    },
                    dataType: "text",
                    global: false,
                    success: function (httpResponse)
                    {
                        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                            return;
                        }
                        else
                        {
                            var xmlDoc = parseXML(httpResponse);
                            with (_this)
                            {
                                if (checkExists(_this.Settings.includeControlProperties) && _this.Settings.includeControlProperties.toLowerCase() === "true")
                                {
                                    var controlsForProperties = xmlDoc.selectNodes("//Items/Item[@ItemType='Control']");
                                    var controlsForPropertiesLength = controlsForProperties.length;
                                    var settingsControlID = null;

                                    if (checkExists(_this.Settings.viewControlID) && _this.Settings.viewControlID !== "")
                                    {
                                        settingsControlID = _this.Settings.viewControlID;
                                    }

                                    if (checkExists(_this.Settings.formControlID) && _this.Settings.formControlID !== "")
                                    {
                                        settingsControlID = _this.Settings.formControlID;
                                    }


                                    if (settingsControlID !== null)
                                    {
                                        var currentControlNodes = xmlDoc.selectNodes("//Items/Item[(@ItemType='Control') and (@Guid='{0}')]".format(settingsControlID));
                                        var currentControlNodesLength = currentControlNodes.length;

                                        for (var c = 0; c < currentControlNodesLength; c++)
                                        {
                                            var currentControlNode = currentControlNodes[c];
                                            var currentControlID = currentControlNode.getAttribute("Guid");
                                            var currentControlType = currentControlNode.getAttribute("SubType");

                                            SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: currentControlNode, controlID: currentControlID, controlType: currentControlType });
                                        }
                                    }
                                    else
                                    {
                                        for (var c = 0; c < controlsForPropertiesLength; c++)
                                        {
                                            var currentControlNode = controlsForProperties[c];
                                            //var currentControlID = currentControlNode.getAttribute("Guid");
                                            //var currentControlType = currentControlNode.getAttribute("SubType");
                                            currentControlNode.setAttribute("HasProperties", "True");
                                            //SourceCode.Forms.Designers.Common.getControlTypeProperties(currentControlNode, currentControlID, currentControlType);
                                        }
                                    }
                                }

                                _this.dataReturned(xmlDoc.xml);
                            }
                        }
                    }
                });
            }
        }
    },
    //#endregion

    initializeSubObjects: function ()
    {
        //#region

        if (this.controlsPlugIn === undefined)
        {
            this.controlsPlugIn = new ControlsContextPlugIn();
            this.controlsPlugIn.Settings =
                {
                    includeInputControls: this.Settings.includeInputControls,
                    includeListingControls: this.Settings.includeListingControls,
                    includeActionControls: this.Settings.includeActionControls,
                    includeDisplayControls: this.Settings.includeDisplayControls,
                    includeLayoutControls: this.Settings.includeLayoutControls,
                    includeCanvasControls: this.Settings.includeCanvasControls,
                    includeExecutionControls: this.Settings.includeExecutionControls,
                    includeControlMethods: this.Settings.includeControlMethods,
                    includeControlMethodParameters: this.Settings.includeControlMethodParameters,
                    includeExpressions: this.Settings.includeExpressions,
                    includeAreaItemProperties: this.Settings.includeAreaItemProperties,
                    filterSubTypes: this.Settings.filterSubTypes,
                    skipViewRightsCheck: this.Settings.skipViewRightsCheck
                }

            if (this.resultName)
            {
                this.controlsPlugIn.resultName = this.resultName;
            }
        }

        if (this.objectPlugIn === undefined)
        {
            this.objectPlugIn = new ObjectContextPlugIn();
            this.objectPlugIn.Settings = {
                objectID: this.Settings.objectID,
                method: this.Settings.method,
                includeProperties: this.Settings.includeProperties,
                includeMethods: this.Settings.includeMethods,
                includeListMethods: this.Settings.includeListMethods,
                includeSingleMethods: this.Settings.includeSingleMethods,
                includeLoadMethods: this.Settings.includeLoadMethods,
                includeCreateMethods: this.Settings.includeCreateMethods,
                includeUpdateMethods: this.Settings.includeUpdateMethods,
                includeDeleteMethods: this.Settings.includeDeleteMethods,
                includeExecuteMethods: this.Settings.includeExecuteMethods,
                includeMethodParameters: this.Settings.includeMethodParameters,
                includeRequiredProperties: this.Settings.includeRequiredProperties,
                includeOptionalProperties: this.Settings.includeOptionalProperties,
                includeResultProperties: this.Settings.includeResultProperties,
                includeTextFields: this.Settings.includeTextFields,
                includeMemoFields: this.Settings.includeMemoFields,
                includeNumberFields: this.Settings.includeNumberFields,
                includeDecimalFields: this.Settings.includeDecimalFields,
                includeImageFields: this.Settings.includeImageFields,
                includeFileFields: this.Settings.includeFileFields,
                includeHyperlinkFields: this.Settings.includeHyperlinkFields,
                includeMultivalueFields: this.Settings.includeMultivalueFields,
                includeXmlFields: this.Settings.includeXmlFields,
                skipViewRightsCheck: this.Settings.skipViewRightsCheck
            }

            if (this.resultName)
            {
                this.objectPlugIn.resultName = this.resultName;
            }
            this.objectPlugIn.initializeSubObjects();
        }
    },
    //#endregion

    setResultTypes: function ()
    {
        //#region
        this.initializeSubObjects();
        var resultTypes = "";

        if (this.Settings.includeFields && this.Settings.includeFields === "True")
        {
            resultTypes += "ViewFields"
        }

        if (this.Settings.includeControls && this.Settings.includeControls === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewControls"
        }

        if (this.Settings.includeObjectDetails && this.Settings.includeObjectDetails === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            if (this.Settings.viewControlID)
            {
                resultTypes += "ControlObjects"
            } else
            {
                resultTypes += "Objects"
            }
        }

        if (this.Settings.includeViewMethods && this.Settings.includeViewMethods === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewMethods"
        }

        if (this.Settings.includeViewEvents && this.Settings.includeViewEvents === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewEvents"
        }

        if (this.Settings.includeMethods && this.Settings.includeMethods === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ObjectMethods"
        }

        if (this.Settings.includeParameters && this.Settings.includeParameters === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewParameters"
        }

        if (this.Settings.includeViewParameterEvents && this.Settings.includeViewParameterEvents === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewParameterEvents"
        }

        if (this.Settings.includeControlTypeEvents && this.Settings.includeControlTypeEvents === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ControlTypeEvents"
        }

        if (this.Settings.includeExpressions && this.Settings.includeExpressions === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ViewExpressions"
        }

        if (this.Settings.includeControlMethods && this.Settings.includeControlMethods === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ControlMethods"
        }

        if (this.Settings.includeControlMethodParameters && this.Settings.includeControlMethodParameters === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ControlMethodParameters"
        }

        //		if (this.Settings.includeControlProperties && this.Settings.includeControlProperties === "True")
        //		{
        //			if (resultTypes.length > 0)
        //			{
        //				resultTypes += "|";
        //			}
        //			resultTypes += "ControlProperties"
        //		}

        if (this.Settings.includeControlFields && this.Settings.includeControlFields === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ControlFields";
        }

        var temp = this.objectPlugIn.setResultTypes();
        if (temp) resultTypes += "|" + temp;
        return resultTypes;
    },
    //#endregion

    updateViewXmlWithGetItemsResponse: function (httpResponse, viewControlId, viewUtilsXmlDoc)
    {
        if (!checkExists(viewUtilsXmlDoc))
        {
            return null;
        }

        //#region
        var fieldNode = viewUtilsXmlDoc.selectSingleNode("/Items/Item[@ItemType='View']/Items");

        var itemNode = parseXML(httpResponse).selectSingleNode("/Items/Item[@ItemType='Object']");
        if (checkExists(fieldNode) && checkExists(itemNode))
        {
            fieldNode.appendChild(itemNode.cloneNode(true));
        }

        var contextTypeEl = viewUtilsXmlDoc.createElement("ContextType");
        contextTypeEl.appendChild(viewUtilsXmlDoc.createTextNode("Association"));
        var controlEl = viewUtilsXmlDoc.createElement("ControlID");
        controlEl.appendChild(viewUtilsXmlDoc.createTextNode(viewControlId));

        var newSONode = viewUtilsXmlDoc.selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']");
        if (checkExists(newSONode))
        {
            newSONode.appendChild(contextTypeEl);
            newSONode.appendChild(controlEl);
            newSONode.appendChild(newSONode.selectSingleNode("Items"));
        }

        return viewUtilsXmlDoc;
    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        }
        else
        {
            var xmlResponse = parseXML(httpResponse)
            this.filterXmlUsingSettings(xmlResponse);

            if (this.Settings.cachePlugin && this.Settings.cachePlugin === 'True')
            {
                this.cachedResult = xmlResponse.xml;
                addPlugInToCache(this);
            }
            if (this.dataType === "target|context") //if both the target and the context data has been returned
            {
                //target jquery trigger configuration plugin returned
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: "target", resultName: this.resultName };
                jQuery(document.body).trigger(event);

                //context jquery trigger configuration plugin returned
                var transformer = GetContextTreeTransformer();
                if (this.Settings.subformID)
                {
                    transformer.addParameter("SubFormID", this.Settings.subformID);
                    this.updateSubFormInstanceName(xmlResponse);
                }

                if (this.Settings.objectDraggable)
                {
                    transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                }

                if (this.Settings.instanceID)
                {
                    transformer.addParameter("InstanceID", this.Settings.instanceID);
                }

                if (this.Settings.subformInstanceID)
                {
                    transformer.addParameter("SubFormInstanceID", this.Settings.subformInstanceID);
                }

                xmlResponse = tryParseXML(transformer.transformToText(xmlResponse.xml));
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: "context", resultName: this.resultName };
                jQuery(document.body).trigger(event);
            }
            else
            {
                if (this.dataType === "context")
                {
                    var transformer = GetContextTreeTransformer();
                    if (this.Settings.subformID)
                    {
                        transformer.addParameter("SubFormID", this.Settings.subformID);
                        this.updateSubFormInstanceName(xmlResponse);
                    }

                    if (this.Settings.objectDraggable)
                    {
                        transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                    }

                    if (this.Settings.instanceID)
                    {
                        transformer.addParameter("InstanceID", this.Settings.instanceID);
                    }

                    if (this.Settings.subformInstanceID)
                    {
                        transformer.addParameter("SubFormInstanceID", this.Settings.subformInstanceID);
                    }

                    xmlResponse = tryParseXML(transformer.transformToText(xmlResponse.xml));
                }
                else
                {
                    if (this.Settings.subformID)
                    {
                        this.updateSubFormInstanceName(xmlResponse);
                    }
                }

                //jquery trigger configuration plugin returned
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
                jQuery(document.body).trigger(event);
            }
        }
        if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
    },
    //#endregion

    updateSubFormInstanceName: function (xmlResponse)
    {
        var _currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
        var _subformXMLXPath;
        var _stateID = SourceCode.Forms.WizardContainer.stateID;
        var instanceName;

        var subformsXmlDoc = SourceCode.Forms.Designers.Rule.tmpContextDefinition;

        if (_currentContext === "form")
        {
            _subformXMLXPath = "/SourceCode.Forms/Forms/Form/States/State";

            if (_stateID)
            {
                _subformXMLXPath += "[@ID='" + _stateID + "']";
            } else
            {
                _subformXMLXPath += "[@IsBase='True']";
            }
        } else
        {
            _subformXMLXPath = "/SourceCode.Forms/Views/View";
        }

        var subformsXML = subformsXmlDoc.selectSingleNode(_subformXMLXPath + "/Events/Event[Handlers/Handler/Actions/Action[(@Type='Popup') and (@SubFormID='" + this.Settings.subformID + "')]]");

        if (subformsXML)
        {
            instanceName = subformsXML.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value").text;
            var viewNode = xmlResponse.selectSingleNode("Items/Item[(@ItemType='View') and (@Guid='" + this.Settings.viewID + "')]");
            var viewSubFormNode = viewNode.selectSingleNode("DisplayName");
            var viewSubFormName = viewSubFormNode.text + " - (" + instanceName + ")";
            viewNode.setAttribute("SubFormID", this.Settings.subformID);

            if (viewSubFormNode.firstChild)
                viewSubFormNode.removeChild(viewSubFormNode.firstChild);
            viewSubFormNode.appendChild(viewSubFormNode.ownerDocument.createTextNode(viewSubFormName));
        }
    },

    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region


        this.initializeSubObjects();

        if (this.Settings.viewControlID)
        {
            if (this.Settings.includeObjectDetails && this.Settings.includeObjectDetails === 'True')
            {
                removeXmlNodes(xmlDoc, "//Item[(ControlID != '" + this.Settings.viewControlID + "' or @ItemType='Control' or not(ControlID)) and @ItemType = 'Object']");
            }
            else
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'Control' and @Guid != '" + this.Settings.viewControlID + "']");
            }
            if (this.Settings.includeFields && this.Settings.viewControlID)
            {
                removeXmlNodes(xmlDoc, "/Items/Item/Items/Item[@ItemType='FieldContext']/Items/Item[(not(ContextID) or  ContextID!='{0}') and (not(@ContextID) or @ContextID!='{0}')]".format(this.Settings.viewControlID));
            }
        }

        if (checkExists(this.Settings.includeControlMethods) && this.Settings.includeControlMethods === 'True')
        {
            removeXmlNodes(xmlDoc, "//Item[not(Items/Item[@ItemType = 'ControlMethod']) and @ItemType = 'Control']");
            if (checkExists(this.Settings.controlMethodName))
                removeXmlNodes(xmlDoc, "//Item[Name != '" + this.Settings.controlMethodName + "' and @ItemType = 'ControlMethod']");
        }

        if (checkExists(this.Settings.includeViewParameterEvents) && this.Settings.includeViewParameterEvents === 'True')
        {
            if (checkExists(this.Settings.viewParameterID))
            {
                removeXmlNodes(xmlDoc, "//Item[Name != '" + this.Settings.viewParameterID + "' and @ItemType = 'ViewParameter']");
            }
        }

        if (this.Settings.includeListViews || this.Settings.includeCaptureViews || this.Settings.includeCaptureListViews)
        {
            var removeSubTypeXpath = "";
            if (!this.Settings.includeListViews || this.Settings.includeListViews === "False")
            {
                removeSubTypeXpath += "@SubType = 'List'";

            }

            if (!this.Settings.includeCaptureViews || this.Settings.includeCaptureViews === "False")
            {
                if (removeSubTypeXpath.length > 0)
                {
                    removeSubTypeXpath += " or ";
                }
                removeSubTypeXpath += "@SubType = 'Capture'";
            }

            if (!this.Settings.includeCaptureListViews || this.Settings.includeCaptureListViews === "False")
            {
                if (removeSubTypeXpath.length > 0)
                {
                    removeSubTypeXpath += " or ";
                }
                removeSubTypeXpath += "@SubType = 'CaptureList'";
            }

            if (removeSubTypeXpath.length > 0)
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'View' and (" + removeSubTypeXpath + ")]");
            }

        }

        //used from runtime's filter widget - remove all unsearchable fields 
        if (checkExists(this.Settings.useRuntimeSearchableFields) && this.Settings.useRuntimeSearchableFields.toLowerCase() === "true" && checkExists(this.Settings.runtimeFilterFields))
        {
            //#region
            var removalXP = "";
            var fieldsForFiltering = this.Settings.runtimeFilterFields;
            var f = fieldsForFiltering.length;
            while (f--)
            {
                var field = fieldsForFiltering[f];
                removalXP += " and @Guid != '" + field.getAttribute("ID") + "'";
            }
            if (removalXP.length > 0)
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'ViewField'" + removalXP + "]");
            }
            //#endregion
        }
        this.controlsPlugIn.filterXmlUsingSettings(xmlDoc);
        this.objectPlugIn.filterXmlUsingSettings(xmlDoc);
    },
    //#endregion

    equals: function (plugin, ignoreExtraIDs, isSubObject)
    {
        //#region 
        if (!(plugin instanceof ViewContextPlugIn) && !(ignoreExtraIDs || isSubObject))
        {
            return false;
        }

        this.initializeSubObjects();
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.isCurrent, plugin.Settings.isCurrent) && (!ignoreExtraIDs || (plugin instanceof ViewContextPlugIn)))
        {
            return false;
        }

        if ((!this.Settings.isCurrent || this.Settings.isCurrent === 'False') && (!plugin.Settings.isCurrent || plugin.Settings.isCurrent === 'False'))
        {
            if (plugin instanceof ViewContextPlugIn)
            {
                //compare all valid values, if one is not the same return false
                if (this.Settings.viewID !== plugin.Settings.viewID)
                {
                    return false;
                }
            }
        }

        if ((!this.Settings.formID && plugin.Settings.formID) || (this.Settings.formID && !plugin.Settings.formID) || (this.Settings.formID !== plugin.Settings.formID))
        {
            return false;
        }

        if (this.Settings.viewControlID !== plugin.Settings.viewControlID)
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControls, plugin.Settings.includeControls))
        {
            return false;
        }
        if (!comparePluginSetting(this.Settings.includeFields, plugin.Settings.includeFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeParameters, plugin.Settings.includeParameters))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeViewParameterEvents, plugin.Settings.includeViewParameterEvents) || !comparePluginSetting(this.Settings.viewParameterID, plugin.Settings.viewParameterID))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeExpressions, plugin.Settings.includeExpressions))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlProperties, plugin.Settings.includeControlProperties))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeObjectDetails, plugin.Settings.includeObjectDetails))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlMethods, plugin.Settings.includeControlMethods))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlMethodParameters, plugin.Settings.includeControlMethodParameters))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlTypeEvents, plugin.Settings.includeControlTypeEvents))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeViewMethods, plugin.Settings.includeViewMethods))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeViewEvents, plugin.Settings.includeViewEvents))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeListViews, plugin.Settings.includeListViews))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeCaptureViews, plugin.Settings.includeCaptureViews))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeCaptureListViews, plugin.Settings.includeCaptureListViews))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeControlFields, plugin.Settings.includeControlFields))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.objectDraggable, plugin.Settings.objectDraggable))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck))
        {
            return false;
        }

        if (this.Settings.controlMethodName !== plugin.Settings.controlMethodName)
        {
            return false;
        }

        if (this.Settings.method !== plugin.Settings.method)
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.useRuntimeSearchableFields, plugin.Settings.useRuntimeSearchableFields))
        {
            return false;
        }

        if (this.Settings.runtimeFilterFields !== plugin.Settings.runtimeFilterFields)
        {
            return false;
        }

        if (!this.controlsPlugIn.equals(plugin.controlsPlugIn, ignoreExtraIDs, isSubObject))
        {
            return false;
        }

        if (!this.objectPlugIn.equals(plugin.objectPlugIn, ignoreExtraIDs, isSubObject))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeAreaItemProperties, plugin.Settings.includeAreaItemProperties))
        {
            return false;
        }

        return true;

    }
    //#endregion

}
//#endregion

//the Object plugin returns all data for a smartobject - from the utils.
//#region

//Include Settings:
//#region

//objectID - the id of the object to be retrieved
//method - the name of the method that should be filtered on

//includeMethods
//includeProperties

//includeRequiredProperties
//includeOptionalProperties
//includeResultProperties
//includeMethodParameters

//includeSingleMethods
//includeListMethods
//includeLoadMethods
//includeUpdateMethods
//includeCreateMethods
//includeDeleteMethods
//includeExecuteMethods

//ObjectFieldContextPlugin settings is included whereever plugins is returned


//if none of the settings is set only the object itself is returned
//Then the settings fall in different levels.
//smartobject methods and properties fall on the first level
//If smartobject methods are set then the required, optional, result properties and method parameters can also be returned
//methods of only a specific type can be returned single is all types except list and the rest is as the name suggests.
//If one of the method types is specified all the other types are assumed to be false
//property types can also be specified as per the objectFieldContextPlugin
//#endregion

//include all field settings (this might be removed later when fields can be something other than smartobject properties
function ObjectContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "context";
}

ObjectContextPlugIn.prototype = {

    initialize: function ()
    {
        //#region

        //set child plugin settings
        this.initializeSubObjects();

        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        var _this = this;

        var targetType = "Object";
        var targetID = this.Settings.objectID;

        if (!this.Settings.objectID)
        {
            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
            if (popupManager.popUps.length < 2)
            {
                popupManager.showWarning("The required parameter objectID was not specified");
            }

            return;
        }

        jQuery.ajax({
            data: {
                method: "getItems",
                targetType: targetType,
                targetID: targetID,
                resultTypes: this.setResultTypes()
            },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            type: "POST",
            async: true,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            },
            dataType: "text",
            global: false,
            success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
        });



    },
    //#endregion

    setResultTypes: function ()
    {
        //#region

        var resultTypes = "";
        if (this.Settings.includeProperties && this.Settings.includeProperties === "True")
        {
            resultTypes = "ObjectProperties";
        }
        if (this.Settings.includeMethods && this.Settings.includeMethods === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "ObjectMethods";
        }
        if (this.Settings.includeMethodParameters && this.Settings.includeMethodParameters === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "MethodParameters";
        }
        if (this.Settings.includeRequiredProperties && this.Settings.includeRequiredProperties === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "MethodRequiredProperties";
        }
        if (this.Settings.includeOptionalProperties && this.Settings.includeOptionalProperties === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "MethodOptionalProperties";
        }
        if (this.Settings.includeResultProperties && this.Settings.includeResultProperties === "True")
        {
            if (resultTypes.length > 0)
            {
                resultTypes += "|";
            }
            resultTypes += "MethodResultProperties";
        }
        return resultTypes;
    },
    //#endregion

    initializeSubObjects: function ()
    {
        //#region
        if (this.objectFieldsPlugIn === undefined)
        {
            this.objectFieldsPlugIn = new ObjectFieldsContextPlugIn();
            this.objectFieldsPlugIn.Settings = {
                includeTextFields: this.Settings.includeTextFields,
                includeMemoFields: this.Settings.includeMemoFields,
                includeNumberFields: this.Settings.includeNumberFields,
                includeDecimalFields: this.Settings.includeDecimalFields,
                includeImageFields: this.Settings.includeImageFields,
                includeFileFields: this.Settings.includeFileFields,
                includeHyperlinkFields: this.Settings.includeHyperlinkFields,
                includeMultivalueFields: this.Settings.includeMultivalueFields,
                includeXmlFields: this.Settings.includeXmlFields,
                skipViewRightsCheck: this.Settings.skipViewRightsCheck
            }

            if (this.resultName)
            {
                this.objectFieldsPlugIn.resultName = this.resultName;
            }
        }
    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region

        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {

            var xmlResponse = parseXML(httpResponse);
            this.filterXmlUsingSettings(xmlResponse);

            if (this.Settings.cachePlugin && this.Settings.cachePlugin === 'True')
            {
                this.cachedResult = xmlResponse.xml;
                addPlugInToCache(this);
            }

            if (this.dataType === "target|context") //if both the target and the context data has been returned
            {
                //target jquery trigger configuration plugin returned
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: "target", resultName: this.resultName };
                jQuery(document.body).trigger(event);

                //context jquery trigger configuration plugin returned
                var transformer = GetContextTreeTransformer();

                if (this.Settings.objectDraggable)
                {
                    transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                }

                xmlResponse = parseXML(transformer.transformToText(xmlResponse.xml));
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: "context", resultName: this.resultName };
                jQuery(document.body).trigger(event);
            } else
            {

                if (this.dataType === "context")
                {
                    var transformer = GetContextTreeTransformer();

                    if (this.Settings.objectDraggable)
                    {
                        transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                    }

                    xmlResponse = parseXML(transformer.transformToText(xmlResponse.xml));
                }
                //jquery trigger configuration plugin returned
                var event = jQuery.Event();
                event.type = this.pluginReturnedId;
                event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
                jQuery(document.body).trigger(event);
            }

            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }
    },
    //#endregion

    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region
        this.initializeSubObjects();

        //if a view method is specified remove all the other methods
        if (this.Settings.method)
        {
            removeXmlNodesParentNode(xmlDoc, "//Item[@ItemType ='Method' or @ItemType='ViewMethod']/Name[. != '" + this.Settings.method + "']");
        }

        if (!this.Settings.includeMethods || this.Settings.includeMethods === 'False')
        {
            removeXmlNodes(xmlDoc, "//Item[@ItemType='Method']");
        }

        //if no method settings were specified return everything
        var shouldSkipMethodFilters = false;
        if (!this.Settings.includeSingleMethods && !this.Settings.includeListMethods && !this.Settings.includeLoadMethods
            && !this.Settings.includeUpdateMethods && !this.Settings.includeCreateMethods && !this.Settings.includeDeleteMethods && !this.Settings.includeExecuteMethods)
        {
            shouldSkipMethodFilters = true;
        }
        var removeCategoryTypeXpath = "";
        if (!shouldSkipMethodFilters)
        {
            //else if the setting is not specified use the default value false

            if (!this.Settings.includeListMethods || this.Settings.includeListMethods === "False")
            {
                removeCategoryTypeXpath += "@SubType = 'list'";
            }

            if (!this.Settings.includeSingleMethods || this.Settings.includeSingleMethods === "False")
            {
                if (removeCategoryTypeXpath.length > 0)
                {
                    removeCategoryTypeXpath += " or ";
                }
                var singleMethodsNotExplicitlyIncluded = "";
                if (!this.Settings.includeLoadMethods || this.Settings.includeLoadMethods === "False")
                {
                    singleMethodsNotExplicitlyIncluded += "@SubType = 'read'";
                }
                if (!this.Settings.includeUpdateMethods || this.Settings.includeUpdateMethods === "False")
                {
                    if (singleMethodsNotExplicitlyIncluded.length > 0)
                    {
                        singleMethodsNotExplicitlyIncluded += " or ";
                    }
                    singleMethodsNotExplicitlyIncluded += "@SubType = 'update'";
                }
                if (!this.Settings.includeCreateMethods || this.Settings.includeCreateMethods === "False")
                {
                    if (singleMethodsNotExplicitlyIncluded.length > 0)
                    {
                        singleMethodsNotExplicitlyIncluded += " or ";
                    }
                    singleMethodsNotExplicitlyIncluded += "@SubType = 'create'";
                }
                if (!this.Settings.includeDeleteMethods || this.Settings.includeDeleteMethods === "False")
                {
                    if (singleMethodsNotExplicitlyIncluded.length > 0)
                    {
                        singleMethodsNotExplicitlyIncluded += " or ";
                    }
                    singleMethodsNotExplicitlyIncluded += "@SubType = 'delete'";
                }
                if (!this.Settings.includeExecuteMethods || this.Settings.includeExecuteMethods === "False")
                {
                    if (singleMethodsNotExplicitlyIncluded.length > 0)
                    {
                        singleMethodsNotExplicitlyIncluded += " or ";
                    }
                    singleMethodsNotExplicitlyIncluded += "@SubType = 'execute'";
                }
                removeCategoryTypeXpath += singleMethodsNotExplicitlyIncluded;

            }

        }

        if (removeCategoryTypeXpath.length > 0)
        {
            removeXmlNodes(xmlDoc, "//Item[" + removeCategoryTypeXpath + "]");
        }
    },
    //#endregion

    equals: function (plugin, ignoreExtraIDs, isSubObject)
    {
        //#region

        if (!(plugin instanceof ObjectContextPlugIn) && !(ignoreExtraIDs || isSubObject))
        {
            return false;
        }
        this.initializeSubObjects();
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!ignoreExtraIDs && !comparePluginSetting(this.Settings.method, plugin.Settings.method))
        {
            return false;
        }

        if (plugin instanceof ObjectContextPlugIn)
        {
            //compare all valid values, if one is not the same return false
            if (this.Settings.objectID !== plugin.Settings.objectID)
            {
                return false;
            }
            else if (this.Settings.method !== plugin.Settings.method)
            {
                return false;
            }
        }
        //compare all valid values, if one is not the same return false
        if (!ignoreExtraIDs && this.Settings.viewControlID !== plugin.Settings.viewControlID)
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeProperties, plugin.Settings.includeProperties))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeMethods, plugin.Settings.includeMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeMethodParameters, plugin.Settings.includeMethodParameters))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeRequiredProperties, plugin.Settings.includeRequiredProperties))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeOptionalProperties, plugin.Settings.includeOptionalProperties))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeResultProperties, plugin.Settings.includeResultProperties))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeSingleMethods, plugin.Settings.includeSingleMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeListMethods, plugin.Settings.includeListMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeLoadMethods, plugin.Settings.includeLoadMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeCreateMethods, plugin.Settings.includeCreateMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeUpdateMethods, plugin.Settings.includeUpdateMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeDeleteMethods, plugin.Settings.includeDeleteMethods))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeExecuteMethods, plugin.Settings.includeExecuteMethods))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck))
        {
            return false;
        }

        return this.objectFieldsPlugIn.equals(plugin.objectFieldsPlugIn, true, true);
    }
    //#endregion

}
//#endregion

//the Form plugin returns all data for a form - from the form designer or utils.
//#region


//Include Settings:
//#region
//isCurrent - this is if it is the current form and will use the form designer to get the data.
//formID - the id of the form, only used if not current form
//viewID - the id of the view it should be filtered on
//method - the id of the method data should be filtered on 
//viewControlID - the id of the control that should be filtered on

//includeParameters
//includeViews
//includeFormPanels
//includeFormEvents

//includeListViews
//includeCaptureViews
//includeCaptureListViews

//The settings for this plugin that is on the first level and has to be specified are parameters,views,panels,form events.
//if views are returned then the type of view returned can also be specified

//#endregion

function FormContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "context";
}

FormContextPlugIn.prototype =
    {

        initialize: function ()
        {
            //#region
            var _this = this;
            //set child plugin settings
            this.initializeSubObjects();

            var pos = cachedPluginIndex(this);
            if (pos !== -1)
            {
                this.dataReturned(getCachedPluginResult(pos));
                return;
            }

            //read value
            if (this.Settings.isCurrent === 'True')
            {
                if (!SourceCode.Forms.Designers.Form._getViews)
                {
                    popupManager.showWarning("Invalid Configuration: Cannot find Current Form");
                    return;
                }
                //Form controls and parameters must come before views _getFormXml must use false
                var includeViews = (this.Settings.includeViews && this.Settings.includeViews === 'True')
                var formXml = parseXML(SourceCode.Forms.Designers.Form._getFormXml(includeViews));
                var formItemsNode = formXml.selectSingleNode("/Items/Item[@ItemType='Form']/Items");

                if (this.Settings.includeFormControls && this.Settings.includeFormControls === 'True')
                {
                    var controlsXml = parseXML(SourceCode.Forms.Designers.Form._getControls(this.Settings.includeControlProperties && this.Settings.includeControlProperties === 'True'), true);
                    cloneItemTypeNodes(formItemsNode, controlsXml, "Control", true);
                }

                if (this.Settings.includeFormProperties && this.Settings.includeFormProperties == 'True')
                {
                    var formNode = formXml.selectSingleNode("Items/Item[@ItemType='Form']");
                    var setPropertiesFormID = formNode.getAttribute("Guid");
                    SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: formNode, controlID: setPropertiesFormID, controlType: "Form" });
                }

                if (this.Settings.includeAreaItemProperties && this.Settings.includeAreaItemProperties == 'True')
                {
                    var viewNodes = null;
                    viewNodes = formXml.selectNodes("Items/Item[@ItemType='Form']/Items/Item[@ItemType='Control' and @SubType='AreaItem']");

                    for (var z = 0; z < viewNodes.length; z++)
                    {
                        var viewNode = viewNodes[z];
                        var setPropertiesViewID = viewNode.getAttribute("Guid");
                        SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: viewNode, controlID: setPropertiesViewID, controlType: "AreaItem" });
                    }
                }

                if (this.Settings.includeParameters && this.Settings.includeParameters === 'True')
                {
                    var paramsXml = SourceCode.Forms.Designers.Form._getParameters();
                    cloneItemTypeNodes(formItemsNode, paramsXml, "FormParameter", true);

                    if (this.Settings.includeFormParameterEvents && this.Settings.includeFormParameterEvents.toUpperCase() === 'TRUE')
                    {
                        var result = parseXML(jQuery.ajax({
                            data: {
                                method: "getItems",
                                resultTypes: "FormParameterEvents"
                            },
                            url: applicationRoot + "Utilities/AJAXcall.ashx",
                            type: "POST",
                            async: false,
                            error: function (httpRequest, status, error)
                            {
                                popupManager.showError(httpRequest + ", " + status);
                            },
                            dataType: "text"
                        }).responseText);


                        var formParameters = formItemsNode.selectNodes("//Item[@ItemType='FormParameter']");
                        var formParametersLength = formParameters.length;

                        for (var f = 0; f < formParametersLength; f++)
                        {
                            var formParameterEvents = result.selectSingleNode("Items").cloneNode(true);
                            var currentFormParameter = formParameters[f];
                            currentFormParameter.appendChild(formParameterEvents);
                        }
                    }
                }
                if (this.Settings.includeFormPanels && this.Settings.includeFormPanels === 'True')
                {
                    var panelsXml = parseXML(SourceCode.Forms.Designers.Form._getPanels());
                    cloneItemTypeNodes(formItemsNode, panelsXml, "Panel", true);
                }
                if (this.Settings.includeExpressions && this.Settings.includeExpressions === 'True')
                {
                    var tmpFormNode;
                    if (checkExists(SourceCode.Forms.Designers.Rule.tmpContextDefinition) && SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectSingleNode("//Forms/Form") !== null)
                    {
                        tmpFormNode = SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectSingleNode("//Forms/Form");
                    }
                    var expressionsXml = SourceCode.Forms.Designers.Form._getExpressions({ getSimpleExpression: true }, tmpFormNode);
                    cloneItemTypeNodes(formItemsNode, expressionsXml, "Expression", true);
                }

                if (this.Settings.includeControlTypeEvents && this.Settings.includeControlTypeEvents === "True")
                {
                    var result = jQuery.ajax({
                        data: {
                            method: "getItems",
                            resultTypes: "ControlTypeEvents"
                        },
                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                        type: "POST",
                        async: false,
                        error: function (httpRequest, status, error)
                        {
                            popupManager.showError(httpRequest + ", " + status);
                        },
                        dataType: "text"
                    }).responseText;

                    if (SourceCode.Forms.ExceptionHandler.isException(result))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(result);

                        return;
                    }

                    var controlsXml = parseXML(result);
                    var controls = formXml.selectNodes("/Items/Item/Items/Item[@ItemType='Control']");
                    for (var m = 0; m < controls.length; m++)
                    {
                        var controlItemsNode = controlsXml.selectSingleNode("/Items/Item[Name='" + controls[m].getAttribute("SubType") + "']/Items");
                        if (controlItemsNode)
                        {
                            controls[m].appendChild(controlItemsNode.cloneNode(true));
                        }
                    }
                }

                if (this.Settings.includeFormEvents && this.Settings.includeFormEvents === 'True')
                {
                    var result = jQuery.ajax({
                        data: {
                            method: "getItems",
                            resultTypes: "FormEvents"
                        },
                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                        type: "POST",
                        error: function (httpRequest, status, error)
                        {
                            popupManager.showError(httpRequest + ", " + status);
                        },
                        dataType: "text",
                        async: false
                    }).responseText;

                    if (SourceCode.Forms.ExceptionHandler.isException(result))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(result);

                        return;
                    }

                    var panels = parseXML(result);
                    cloneItemTypeNodes(formItemsNode, panels, "FormEvent");
                }

                if ((this.Settings.includeFields && this.Settings.includeFields === 'True')
                    || (this.Settings.includeObjects && this.Settings.includeObjects === 'True')
                    || (this.Settings.includeControls && this.Settings.includeControls === 'True')
                    || (this.Settings.includeExpressions && this.Settings.includeExpressions === 'True')
                    || (this.Settings.includeControlFields && this.Settings.includeControlFields === 'True')
                    || (this.Settings.includeParameters && this.Settings.includeParameters === 'True'))
                {

                    var resultTypes = this.viewPlugIn.setResultTypes();

                    var viewGuids = "";
                    var viewNodes = formXml.selectNodes("/Items/Item[@ItemType='Form']/Items/Item[@ItemType = 'View']");
                    for (var k = 0; k < viewNodes.length; k++)
                    {
                        viewGuids += viewNodes[k].getAttribute("Guid");
                        if (k < viewNodes.length - 1)
                        {
                            viewGuids += ","
                        }
                    }

                    if (viewGuids.length > 0)
                    {
                        // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                        var includeHidden = this.Settings.skipViewRightsCheck;
                        if (includeHidden === undefined)
                        {
                            includeHidden = true;
                        }

                        jQuery.ajax({
                            data: {
                                method: "getItems",
                                targetType: 'View',
                                targetID: viewGuids,
                                resultTypes: resultTypes,
                                includeHidden: includeHidden
                            },
                            url: applicationRoot + "Utilities/AJAXcall.ashx",
                            type: "POST",
                            async: false,
                            error: function (httpRequest, status, error)
                            {
                                popupManager.showError(httpRequest + ", " + status);
                            },
                            dataType: "text",
                            global: false,
                            success: function (httpResponse)
                            {
                                if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                                {
                                    SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                    return;
                                }
                                else
                                {
                                    with (_this, formXml)
                                    {
                                        if (_this.Settings.viewControlID && _this.Settings.includeObjectDetails && _this.Settings.includeObjectDetails.toLowerCase() === "true")
                                        {
                                            var viewItemsXml = parseXML(httpResponse).selectSingleNode("Items/Item[@Guid='" + _this.Settings.viewID + "']/Items");
                                            if (viewItemsXml !== null)
                                            {
                                                var viewItemsNode = viewItemsXml.cloneNode(true);
                                                var existingViewNode = formXml.selectSingleNode("Items/Item/Items/Item[(@ItemType='View') and (@Guid='" + _this.Settings.viewID + "')]");
                                                existingViewNode.appendChild(viewItemsNode);

                                                //check for association so otherwise check for static values
                                                var objectAssocNode = parseXML(httpResponse).selectSingleNode("//Items/Item[@ItemType='Control' and @Guid='" + _this.Settings.viewControlID + "']");

                                                var soIdToUse = null;
                                                if (checkExists(objectAssocNode))
                                                {
                                                    var soIdToUse = objectAssocNode.selectSingleNode('AssociationSO');
                                                    // Composite Checkbox Lists - DisplaySO for populate and the rest AssociatedSO.
                                                    var isComposite = objectAssocNode.selectSingleNode("IsComposite");
                                                    if (checkExists(isComposite) && isComposite.text.toUpperCase() === "TRUE" && checkExists(_this.Settings.compositeObjToUse) && _this.Settings.compositeObjToUse.toUpperCase() === "DISPLAY")
                                                    {
                                                        var displaySO = objectAssocNode.selectSingleNode('DisplaySO');
                                                        if (checkExistsNotEmpty(displaySO))
                                                        {
                                                            soIdToUse = displaySO;
                                                        }
                                                    }
                                                }

                                                //then there is no associated smartobject
                                                if (!soIdToUse)
                                                {
                                                    _this.dataReturned("<Items/>");
                                                    return;
                                                }

                                                var objectID = soIdToUse.text;

                                                jQuery.ajax({
                                                    data: {
                                                        method: "getItems",
                                                        targetType: 'Object',
                                                        targetID: objectID,
                                                        resultTypes: resultTypes
                                                    },
                                                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                                                    dataType: "text",
                                                    type: "POST",
                                                    async: false,
                                                    error: function (httpRequest, status, error)
                                                    {
                                                        popupManager.showError(httpRequest + ", " + status);
                                                    },
                                                    global: false,
                                                    success: function (httpResponse)
                                                    {
                                                        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                                                        {
                                                            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                                                            return;
                                                        }
                                                        else
                                                        {
                                                            with (_this)
                                                            {
                                                                // remove object not supported
                                                                var objectsToRemove = formXml.selectNodes("//Items/Item[(@ItemType='Object')]")
                                                                for (var o = 0; o < objectsToRemove.length; o++)
                                                                {
                                                                    objectsToRemove[o].parentNode.removeChild(objectsToRemove[o]);
                                                                }

                                                                var fieldNode = formXml.selectSingleNode("//Items/Item[@ItemType='View' and (@Guid='" + _this.Settings.viewID + "')]/Items");
                                                                var soNode = parseXML(httpResponse).selectSingleNode("/Items/Item[@ItemType='Object']");

                                                                if (soNode !== null)
                                                                {
                                                                    var clonedItemNode = soNode.cloneNode(true);
                                                                    fieldNode.appendChild(clonedItemNode);
                                                                    var contextTypeEl = formXml.createElement("ContextType");
                                                                    contextTypeEl.appendChild(formXml.createTextNode("Association"));
                                                                    var controlEl = formXml.createElement("ControlID");
                                                                    controlEl.appendChild(formXml.createTextNode(_this.Settings.viewControlID));
                                                                    var newSONode = formXml.selectSingleNode("Items/Item/Items/Item[@ItemType='View']/Items/Item[@ItemType = 'Object']");
                                                                    newSONode.appendChild(contextTypeEl);
                                                                    newSONode.appendChild(controlEl);
                                                                    newSONode.appendChild(newSONode.selectSingleNode("Items"));
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                formXml = parseXML("<Items />");
                                            }
                                        }
                                        else
                                        {
                                            var viewDoc = parseXML(httpResponse);
                                            var viewNodes = formXml.selectNodes("/Items/Item[@ItemType ='Form']/Items/Item[@ItemType = 'View']");
                                            for (var f = viewNodes.length - 1; f >= 0; f--)
                                            {
                                                var currentViewNode = viewNodes[f];
                                                var currentViewGuid = currentViewNode.getAttribute('Guid');
                                                var currentViewChildNodes = currentViewNode.childNodes;
                                                var currentViewInstanceNode = currentViewNode.selectSingleNode("InstanceID").cloneNode(true);
                                                var currentViewDisplayNameNode = currentViewNode.selectSingleNode("DisplayName").cloneNode(true);

                                                while (currentViewNode.childNodes.length > 0)
                                                {
                                                    currentViewNode.removeChild(currentViewNode.childNodes[0]);
                                                }

                                                var newViewNode = viewDoc.selectSingleNode("/Items/Item[(@ItemType = 'View') and (@Guid = '" + currentViewGuid + "')]");
                                                // newViewNode can be null if user doesn't have rights to view the item
                                                if (newViewNode !== null)
                                                {
                                                    var newViewChildNodes = newViewNode.childNodes;

                                                    for (var n = 0; n < newViewChildNodes.length; n++)
                                                    {
                                                        if (newViewChildNodes[n].tagName !== "DisplayName")
                                                        {
                                                            var clonedNode = newViewChildNodes[n].cloneNode(true);
                                                            viewNodes[f].appendChild(currentViewDisplayNameNode);
                                                            viewNodes[f].appendChild(currentViewInstanceNode);
                                                            viewNodes[f].appendChild(clonedNode);
                                                        }
                                                    }
                                                }
                                                else
                                                {
                                                    currentViewNode.parentNode.removeChild(currentViewNode);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
                if (checkExists(this.Settings.includeControlMethods) && this.Settings.includeControlMethods === "True")
                {
                    var resultTypes = "ControlMethods";

                    if (this.Settings.includeControlMethodParameters && this.Settings.includeControlMethodParameters === "True")
                    {
                        resultTypes += "|ControlMethodParameters"
                    }

                    jQuery.ajax({
                        data: {
                            method: "getItems",
                            resultTypes: resultTypes
                        },
                        url: applicationRoot + "Utilities/AJAXcall.ashx",
                        type: "POST",
                        async: false,
                        error: function (httpRequest, status, error)
                        {
                            popupManager.showError(httpRequest + ", " + status);
                        },
                        dataType: "text",
                        global: false,
                        success: function (httpResponse)
                        {
                            if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                            {
                                SourceCode.Forms.ExceptionHandler.handleException(httpResponse);
                                return;
                            }
                            else
                            {
                                var controlsXml = parseXML(httpResponse);
                                var xpath = "//Item[@ItemType='Control'"
                                if (checkExists(_this.Settings.viewControlID))
                                    xpath += " and @Guid='{0}']".format(_this.Settings.viewControlID);
                                else if (checkExists(_this.Settings.formControlID))
                                    xpath += " and @Guid='{0}']".format(_this.Settings.formControlID);
                                else
                                    xpath += "]";
                                var controls = formItemsNode.selectNodes(xpath);
                                for (var m = 0; m < controls.length; m++)
                                {
                                    var itemsNode = controls[m].selectSingleNode("Items");
                                    if (!checkExists(itemsNode))
                                    {
                                        itemsNode = formXml.createElement("Items");
                                        controls[m].appendChild(itemsNode);
                                    }

                                    var controlmethodsXpath = "/Items/Item[Name='{0}']/Items/Item".format(controls[m].getAttribute("SubType"));
                                    if (checkExists(_this.Settings.controlMethodName))
                                        controlmethodsXpath += "[Name='{0}']".format(_this.Settings.controlMethodName);

                                    var methods = controlsXml.selectNodes(controlmethodsXpath);
                                    for (var z = 0, ml = methods.length; z < ml; z++)
                                    {
                                        var methodName = methods[z].selectSingleNode("Name").text;
                                        var existingMethod = itemsNode.selectSingleNode("Item[Name = '{0}' ]".format(methodName));
                                        if (!checkExists(existingMethod))
                                            itemsNode.appendChild(methods[z].cloneNode(true));
                                    }
                                }
                            }
                        }
                    });
                }

                if ((checkExists(this.Settings.includeControlProperties) && this.Settings.includeControlProperties.toLowerCase() === "true")
                    || (checkExists(this.Settings.includeControlFields) && this.Settings.includeControlFields.toLowerCase() === "true"))
                {
                    var controlsForProperties = formXml.selectNodes("//Items/Item[@ItemType='Control']");
                    var controlsForPropertiesLength = controlsForProperties.length;
                    var settingsControlID = null;

                    if (checkExists(this.Settings.viewControlID) && this.Settings.viewControlID !== "")
                    {
                        settingsControlID = this.Settings.viewControlID;
                    }

                    if (checkExists(this.Settings.formControlID) && this.Settings.formControlID !== "")
                    {
                        settingsControlID = this.Settings.formControlID;
                    }


                    if (settingsControlID !== null)
                    {
                        var currentControlNodes = formXml.selectNodes("//Items/Item[(@ItemType='Control') and (@Guid='{0}')]".format(settingsControlID));
                        var currentControlNodesLength = currentControlNodes.length;

                        for (var c = 0; c < currentControlNodesLength; c++)
                        {
                            var currentControlNode = currentControlNodes[c];
                            var currentControlID = currentControlNode.getAttribute("Guid");
                            var currentControlType = currentControlNode.getAttribute("SubType");

                            SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: currentControlNode, controlID: currentControlID, controlType: currentControlType });
                        }
                    }
                    else
                    {
                        for (var c = 0; c < controlsForPropertiesLength; c++)
                        {
                            var currentControlNode = controlsForProperties[c];
                            currentControlNode.setAttribute("HasProperties", "True");
                        }
                    }
                }

                this.dataReturned(formXml.xml);

            }
            else
            {
                var resultTypes = this.setResultTypes();

                if (!this.Settings.formID)
                {
                    jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                    if (popupManager.popUps.length < 2)
                    {
                        popupManager.showWarning("The required parameter formID was not specified");
                    }

                    return;
                }

                // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                var includeHidden = this.Settings.skipViewRightsCheck;
                if (includeHidden === undefined)
                {
                    includeHidden = true;
                }

                jQuery.ajax({
                    data: {
                        method: "getItems",
                        targetType: 'Form',
                        targetID: this.Settings.formID,
                        resultTypes: resultTypes,
                        includeHidden: includeHidden
                    },
                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                    type: "POST",
                    async: true,
                    error: function (httpRequest, status, error)
                    {
                        popupManager.showError(httpRequest + ", " + status);
                    },
                    dataType: "text",
                    global: false,
                    success: function (httpResponse)
                    {
                        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                            return;
                        }
                        else
                        {
                            var xmlDoc = parseXML(httpResponse);
                            with (_this)
                            {
                                if (checkExists(_this.Settings.includeControlProperties) && _this.Settings.includeControlProperties.toLowerCase() === "true")
                                {
                                    var controlsForProperties = xmlDoc.selectNodes("//Items/Item[@ItemType='Control']");
                                    var controlsForPropertiesLength = controlsForProperties.length;
                                    var settingsControlID = null;

                                    if (checkExists(_this.Settings.viewControlID) && _this.Settings.viewControlID !== "")
                                    {
                                        settingsControlID = _this.Settings.viewControlID;
                                    }

                                    if (checkExists(_this.Settings.formControlID) && _this.Settings.formControlID !== "")
                                    {
                                        settingsControlID = _this.Settings.formControlID;
                                    }


                                    if (settingsControlID !== null)
                                    {
                                        var currentControlNodes = xmlDoc.selectNodes("//Items/Item[(@ItemType='Control') and (@Guid='{0}')]".format(settingsControlID));
                                        var currentControlNodesLength = currentControlNodes.length;

                                        for (var c = 0; c < currentControlNodesLength; c++)
                                        {
                                            var currentControlNode = currentControlNodes[c];
                                            var currentControlID = currentControlNode.getAttribute("Guid");
                                            var currentControlType = currentControlNode.getAttribute("SubType");

                                            SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: currentControlNode, controlID: currentControlID, controlType: currentControlType });
                                        }
                                    }
                                    else
                                    {
                                        for (var c = 0; c < controlsForPropertiesLength; c++)
                                        {
                                            var currentControlNode = controlsForProperties[c];
                                            currentControlNode.setAttribute("HasProperties", "True");
                                        }
                                    }
                                }

                                if (_this.Settings.includeFormProperties && _this.Settings.includeFormProperties == 'True')
                                {
                                    var formNode = xmlDoc.selectSingleNode("Items/Item[@ItemType='Form']");
                                    var setPropertiesFormID = formNode.getAttribute("Guid");
                                    SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: formNode, controlID: setPropertiesFormID, controlType: "Form" });
                                }

                                if (_this.Settings.includeAreaItemProperties && _this.Settings.includeAreaItemProperties === 'True')
                                {
                                    var viewItems = xmlDoc.selectNodes("Items/Item[@ItemType='Form']/Items/Item[@ItemType='View']/InstanceID");
                                    var areaItemXPath = "Items/Item[@ItemType='Form']/Items/Item[(@ItemType='Control') and (@SubType='AreaItem')";
                                    var areaItemsToRemoveXpath = areaItemXPath;
                                    for (var areaIndex = 0; areaIndex < viewItems.length; areaIndex++)
                                    {
                                        if (areaIndex === 0)
                                        {
                                            areaItemXPath += " and";
                                        }
                                        else
                                        {
                                            areaItemXPath += " or";
                                        }

                                        areaItemXPath += " (@Guid='" + viewItems[areaIndex].text + "')";
                                        areaItemsToRemoveXpath += " and (@Guid!='" + viewItems[areaIndex].text + "')";
                                    }

                                    areaItemXPath += "]";
                                    areaItemsToRemoveXpath += "]";

                                    var areaItemItems = xmlDoc.selectNodes(areaItemXPath);
                                    var areaItemItemsLength = areaItemItems.length;

                                    for (var z = 0; z < areaItemItemsLength; z++)
                                    {
                                        var areaItemNode = areaItemItems[z];
                                        var setPropertiesAreaItemID = areaItemNode.getAttribute("Guid");
                                        var viewItemForArea = xmlDoc.selectSingleNode("Items/Item[@ItemType='Form']/Items/Item[InstanceID='" + setPropertiesAreaItemID + "' and @ItemType='View']");

                                        var viewItemForAreaNameText;
                                        var viewItemForAreaDisplayNameText;

                                        if (checkExists(viewItemForArea))
                                        {
                                            viewItemForAreaNameText = viewItemForArea.selectSingleNode("Name").text;
                                            viewItemForAreaDisplayNameText = viewItemForArea.selectSingleNode("DisplayName").text;
                                        }

                                        var areaItemNameNode = areaItemNode.selectSingleNode("Name");
                                        var areaItemDisplayNameNode = areaItemNode.selectSingleNode("DisplayName");

                                        areaItemNameNode.removeChild(areaItemNameNode.firstChild);
                                        areaItemDisplayNameNode.removeChild(areaItemDisplayNameNode.firstChild);

                                        areaItemNameNode.appendChild(xmlDoc.createTextNode(viewItemForAreaNameText));
                                        areaItemDisplayNameNode.appendChild(xmlDoc.createTextNode(viewItemForAreaDisplayNameText));

                                        SourceCode.Forms.Designers.Common.getControlTypeProperties({ node: areaItemNode, controlID: setPropertiesAreaItemID, controlType: "AreaItem" });
                                    }

                                    removeXmlNodes(xmlDoc, areaItemsToRemoveXpath);
                                }

                                _this.dataReturned(xmlDoc.xml);
                            }
                        }
                    }
                });
            }
        },
        //#endregion

        setResultTypes: function ()
        {
            var resultTypes = "";
            if (this.Settings.includeParameters && this.Settings.includeParameters === "True")
            {
                resultTypes += "FormParameters"
            }
            if (this.Settings.includeFormParameterEvents && this.Settings.includeFormParameterEvents.toUpperCase() === "TRUE")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormParameterEvents"
            }
            if (this.Settings.includeFormPanels && this.Settings.includeFormPanels === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormPanels"
            }
            if (this.Settings.includeViews && this.Settings.includeViews === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormViews";
            }

            if (this.Settings.includeFormEvents && this.Settings.includeFormEvents === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormEvents";
            }

            if (this.Settings.includeFormControls === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormControls";
            }

            if (this.Settings.includeControlTypeEvents && this.Settings.includeControlTypeEvents === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "ControlTypeEvents";
            }

            if (this.Settings.includeExpressions && this.Settings.includeExpressions === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "FormExpressions";
                resultTypes += "|ViewExpressions";
            }

            //		if (this.Settings.includeControlProperties && this.Settings.includeControlProperties === "True")
            //		{
            //			if (resultTypes.length > 0)
            //			{
            //				resultTypes += "|";
            //			}
            //			resultTypes += "ControlProperties";
            //		}

            if (this.Settings.includeControlMethods && this.Settings.includeControlMethods === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "ControlMethods";
            }

            if (this.Settings.includeControlMethodParameters && this.Settings.includeControlMethodParameters === "True")
            {
                if (resultTypes.length > 0)
                {
                    resultTypes += "|";
                }
                resultTypes += "ControlMethodParameters";
            }

            if ((this.Settings.includeFields && this.Settings.includeFields === "True")
                || (this.Settings.includeControls && this.Settings.includeControls === "True")
                || (this.Settings.includeObjects && this.Settings.includeObjects === "True")
                || (this.Settings.includeParameters && this.Settings.includeParameters === "True"))
            {

                var temp = this.viewPlugIn.setResultTypes();
                if (temp) resultTypes += "|" + temp;
            }
            return resultTypes;
        },

        initializeSubObjects: function ()
        {
            //#region
            if (this.controlsPlugIn === undefined)
            {
                this.controlsPlugIn = new ControlsContextPlugIn();
                this.controlsPlugIn.Settings =
                    {
                        includeInputControls: this.Settings.includeInputControls,
                        includeListingControls: this.Settings.includeListingControls,
                        includeActionControls: this.Settings.includeActionControls,
                        includeDisplayControls: this.Settings.includeDisplayControls,
                        includeLayoutControls: this.Settings.includeLayoutControls,
                        includeCanvasControls: this.Settings.includeCanvasControls,
                        includeExecutionControls: this.Settings.includeExecutionControls,
                        includeControlMethods: this.Settings.includeControlMethods,
                        includeControlMethodParameters: this.Settings.includeControlMethodParameters,
                        includeExpressions: this.Settings.includeExpressions,
                        includeAreaItemProperties: this.Settings.includeAreaItemProperties,
                        filterSubTypes: this.Settings.filterSubTypes,
                        skipViewRightsCheck: this.Settings.skipViewRightsCheck
                    }
            }
            if (this.viewPlugIn === undefined)
            {
                this.viewPlugIn = new ViewContextPlugIn();
                this.viewPlugIn.Settings = {
                    includeParameters: this.Settings.includeParameters,
                    viewControlID: this.Settings.viewControlID,
                    method: this.Settings.method,
                    objectID: this.Settings.objectID,
                    includeFields: this.Settings.includeFields,
                    includeControls: this.Settings.includeControls,
                    includeInputControls: this.Settings.includeInputControls,
                    includeListingControls: this.Settings.includeListingControls,
                    includeActionControls: this.Settings.includeActionControls,
                    includeDisplayControls: this.Settings.includeDisplayControls,
                    includeLayoutControls: this.Settings.includeLayoutControls,
                    includeCanvasControls: this.Settings.includeCanvasControls,
                    includeExecutionControls: this.Settings.includeExecutionControls,
                    includeTextFields: this.Settings.includeTextFields,
                    includeMemoFields: this.Settings.includeMemoFields,
                    includeNumberFields: this.Settings.includeNumberFields,
                    includeDecimalFields: this.Settings.includeDecimalFields,
                    includeImageFields: this.Settings.includeImageFields,
                    includeFileFields: this.Settings.includeFileFields,
                    includeHyperlinkFields: this.Settings.includeHyperlinkFields,
                    includeMultivalueFields: this.Settings.includeMultivalueFields,
                    includeXmlFields: this.Settings.includeXmlFields,
                    includeControlTypeEvents: this.Settings.includeControlTypeEvents,
                    includeViewMethods: this.Settings.includeViewMethods,
                    includeViewEvents: this.Settings.includeViewEvents,
                    includeMethods: this.Settings.includeMethods,
                    includeListViews: this.Settings.includeListViews,
                    includeCaptureViews: this.Settings.includeCaptureViews,
                    includeCaptureListViews: this.Settings.includeCaptureListViews,
                    includeObjectDetails: this.Settings.includeObjectDetails,
                    includeMethodParameters: this.Settings.includeMethodParameters,
                    includeRequiredProperties: this.Settings.includeRequiredProperties,
                    includeOptionalProperties: this.Settings.includeOptionalProperties,
                    includeResultProperties: this.Settings.includeResultProperties,
                    includeExpressions: this.Settings.includeExpressions,
                    includeControlMethods: this.Settings.includeControlMethods,
                    includeControlMethodParameters: this.Settings.includeControlMethodParameters,
                    includeControlProperties: this.Settings.includeControlProperties,
                    useRuntimeSearchableFields: this.Settings.useRuntimeSearchableFields,
                    runtimeFilterFields: this.Settings.runtimeFilterFields,
                    includeViewParameterEvents: this.Settings.includeViewParameterEvents,
                    includeAreaItemProperties: this.Settings.includeAreaItemProperties,
                    includeControlFields: this.Settings.includeControlFields,
                    skipViewRightsCheck: this.Settings.skipViewRightsCheck
                }
                this.viewPlugIn.initializeSubObjects();
            }
        },
        //#endregion

        dataReturned: function (httpResponse)
        {
            //#region

            if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
            {
                SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

                return;
            }
            else
            {
                var xmlResponse = parseXML(httpResponse);
                this.filterXmlUsingSettings(xmlResponse);

                if (this.Settings.cachePlugin && this.Settings.cachePlugin === 'True')
                {
                    this.cachedResult = xmlResponse.xml;
                    addPlugInToCache(this);
                }

                if (this.dataType === "target|context") //if both the target and the context data has been returned
                {

                    //target jquery trigger configuration plugin returned
                    var event = jQuery.Event();
                    event.type = this.pluginReturnedId;
                    event.detail = { xml: xmlResponse, type: "target", resultName: this.resultName };
                    jQuery(document.body).trigger(event);

                    //context jquery trigger configuration plugin returned
                    var transformer = GetContextTreeTransformer();
                    if (this.Settings.subformID)
                    {
                        transformer.addParameter("SubFormID", this.Settings.subformID);
                        this.updateSubFormInstanceName(xmlResponse);
                    }

                    if (this.Settings.objectDraggable)
                    {
                        transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                    }

                    if (this.Settings.instanceID)
                    {
                        transformer.addParameter("InstanceID", this.Settings.instanceID);
                        this.updateSubFormInstanceName(xmlResponse);
                    }

                    if (this.Settings.subformInstanceID)
                    {
                        transformer.addParameter("SubFormInstanceID", this.Settings.subformInstanceID);
                        this.updateSubFormInstanceName(xmlResponse);
                    }

                    xmlResponse = parseXML(transformer.transformToText(xmlResponse.xml));
                    var event = jQuery.Event();
                    event.type = this.pluginReturnedId;
                    event.detail = { xml: xmlResponse, type: "context", resultName: this.resultName };
                    jQuery(document.body).trigger(event);
                }
                else
                {
                    if (this.dataType === "context")
                    {
                        var transformer = GetContextTreeTransformer();
                        if (this.Settings.subformID)
                        {
                            transformer.addParameter("SubFormID", this.Settings.subformID);
                            this.updateSubFormInstanceName(xmlResponse);
                        }

                        if (this.Settings.objectDraggable)
                        {
                            transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                        }

                        if (this.Settings.instanceID)
                        {
                            transformer.addParameter("InstanceID", this.Settings.instanceID);
                            this.updateSubFormInstanceName(xmlResponse);
                        }

                        if (this.Settings.subformInstanceID)
                        {
                            transformer.addParameter("SubFormInstanceID", this.Settings.subformInstanceID);
                            this.updateSubFormInstanceName(xmlResponse);
                        }

                        xmlResponse = parseXML(transformer.transformToText(xmlResponse.xml));
                    }
                    else
                    {
                        if (this.Settings.subformID)
                        {
                            this.updateSubFormInstanceName(xmlResponse);
                        }
                    }

                    //jquery trigger configuration plugin returned
                    var event = jQuery.Event();
                    event.type = this.pluginReturnedId;

                    event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
                    jQuery(document.body).trigger(event);
                }
                if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
            }
        },
        //#endregion

        updateSubFormInstanceName: function (xmlResponse)
        {
            var _currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
            var _subformXMLXPath;
            var _stateID = SourceCode.Forms.WizardContainer.stateID;
            var instanceName;

            var subformsXmlDoc = SourceCode.Forms.Designers.Rule.tmpContextDefinition;

            if (_currentContext === "form")
            {
                _subformXMLXPath = "/SourceCode.Forms/Forms/Form/States/State";

                if (_stateID)
                {
                    _subformXMLXPath += "[@ID='" + _stateID + "']";
                } else
                {
                    _subformXMLXPath += "[@IsBase='True']";
                }
            } else
            {
                _subformXMLXPath = "/SourceCode.Forms/Views/View";
            }

            var subformsXML = subformsXmlDoc.selectSingleNode(_subformXMLXPath + "/Events/Event[Handlers/Handler/Actions/Action[(@Type='Open') and (@SubFormID='" + this.Settings.subformID + "')]]");

            if (subformsXML)
            {
                instanceName = subformsXML.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value").text;
                var formNode = xmlResponse.selectSingleNode("Items/Item[(@ItemType='Form') and (@Guid='" + this.Settings.formID + "')]");
                var formSubFormNode = formNode.selectSingleNode("DisplayName");
                var formSubFormName = formSubFormNode.text + " - (" + instanceName + ")";
                formNode.setAttribute("SubFormID", this.Settings.subformID)

                if (formSubFormNode.firstChild)
                    formSubFormNode.removeChild(formSubFormNode.firstChild);
                formSubFormNode.appendChild(formSubFormNode.ownerDocument.createTextNode(formSubFormName));
            }
        },

        equals: function (plugin, ignoreExtraIDs, isSubObject)
        {
            //#region

            if (!(plugin instanceof FormContextPlugIn))
            {
                return false;
            }
            this.initializeSubObjects();

            if (this.resultName !== plugin.resultName)
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.isCurrent, plugin.Settings.isCurrent))
            {
                return false;
            }

            if ((!this.Settings.isCurrent || this.Settings.isCurrent === 'False') && (!plugin.Settings.isCurrent || plugin.Settings.isCurrent === 'False'))
            {
                //compare all valid values, if one is not the same return false
                if (this.Settings.formID !== plugin.Settings.formID)
                {
                    return false;
                }
            }
            else
            {
                if (this.Settings.viewID !== plugin.Settings.viewID)
                {
                    return false;
                }
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeParameters, plugin.Settings.includeParameters))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeFormParameterEvents, plugin.Settings.includeFormParameterEvents) || this.Settings.formParameterID !== plugin.Settings.formParameterID)
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeViews, plugin.Settings.includeViews))
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeListViews, plugin.Settings.includeListViews))
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeCaptureViews, plugin.Settings.includeCaptureViews))
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (this.Settings.instanceID !== plugin.Settings.instanceID)
            {
                return false;
            }

            if (this.Settings.subformInstanceID !== plugin.Settings.subformInstanceID)
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeFormEvents, plugin.Settings.includeFormEvents))
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (!comparePluginSetting(this.Settings.includeFormPanels, plugin.Settings.includeFormPanels))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeControlProperties, plugin.Settings.includeControlProperties))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeFormProperties, plugin.Settings.includeFormProperties))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeAreaItemProperties, plugin.Settings.includeAreaItemProperties))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeExpressions, plugin.Settings.includeExpressions))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeControlMethods, plugin.Settings.includeControlMethods))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeControlMethodParameters, plugin.Settings.includeControlMethodParameters))
            {
                return false;
            }

            //compare all valid values, if one is not the same return false
            if (this.Settings.formControlID !== plugin.Settings.formControlID)
            {
                return false;
            }

            if (this.Settings.controlMethodName !== plugin.Settings.controlMethodName)
            {
                return false;
            }

            if (this.Settings.method !== plugin.Settings.method)
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck))
            {
                return false;
            }

            if (!comparePluginSetting(this.Settings.includeAreaItemProperties, plugin.Settings.includeAreaItemProperties))
            {
                return false;
            }

            if (checkExists(this.viewPlugIn) && checkExists(plugin.viewPlugIn))
            {
                return this.viewPlugIn.equals(plugin.viewPlugIn, true, true);
            }
            else
            {
                return true;
            }
        },
        //#endregion

        filterXmlUsingSettings: function (xmlDoc)
        {
            //#region
            var controlID = this.Settings.formControlID;
            if (!checkExists(controlID))
                controlID = this.Settings.viewControlID;

            if (checkExists(controlID))
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'Control' and @Guid != '" + controlID + "']");
            }
            if (checkExists(this.Settings.includeControlMethods) && this.Settings.includeControlMethods === "True")
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'Control' and not(Items/Item[@ItemType = 'ControlMethod']) ]");
                if (checkExists(this.Settings.controlMethodName))
                    removeXmlNodes(xmlDoc, "//Item[Name != '" + this.Settings.controlMethodName + "' and @ItemType = 'ControlMethod']");
            }

            if (this.Settings.viewID)
            {
                removeXmlNodes(xmlDoc, "//Item[@ItemType = 'View' and @Guid != '" + this.Settings.viewID + "']");
            }

            if (this.Settings.method)
            {
                removeXmlNodes(xmlDoc, "//Item[Name != '" + this.Settings.method + "' and @ItemType = 'FormEvent']");
            }

            if (checkExistsNotEmptyGuid(this.Settings.instanceID) && this.Settings.viewID)
            {
                removeXmlNodes(xmlDoc, "//Item[(@ItemType = 'View') and (InstanceID/text() != '" + this.Settings.instanceID + "' or not(InstanceID))]");
            }

            if (checkExistsNotEmptyGuid(this.Settings.subformInstanceID) && this.Settings.viewID)
            {
                removeXmlNodes(xmlDoc, "//Item[(@ItemType = 'View') and (InstanceID/text() != '" + this.Settings.subformInstanceID + "' or not(InstanceID))]");
            }

            if (checkExists(this.Settings.includeFormParameterEvents) && this.Settings.includeFormParameterEvents.toUpperCase() === 'TRUE')
            {
                if (checkExists(this.Settings.formParameterID))
                {
                    removeXmlNodes(xmlDoc, "//Item[Name != '" + this.Settings.formParameterID + "' and @ItemType = 'FormParameter']");
                }
            }

            if (this.Settings.includeViews && this.Settings.includeViews === 'True')
            {
                this.viewPlugIn.filterXmlUsingSettings(xmlDoc);
            }

            this.controlsPlugIn.filterXmlUsingSettings(xmlDoc);
        }
        //#endregion

    }
//#endregion


// The systemvariablesitemsplugin returns all system variables - from the utils.
// Data will be returned in Items xml colection
// #region
function SystemVariablesItemsPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

SystemVariablesItemsPlugIn.prototype = {

    initialize: function ()
    {
        var _this = this;
        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            _this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        var resultTypes = _this.setResultTypes();
        jQuery.ajax({
            data: {
                method: "getItems",
                resultTypes: resultTypes
            },
            dataType: "text",
            global: false,
            success: function (httpResponse)
            {
                with (_this)
                {
                    _this.dataReturned(httpResponse);
                }
            },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            type: "POST",
            async: false,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            }
        });

    },

    dataReturned: function (httpResponse)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);
            return;
        }
        else
        {
            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod)
            {
                this.unitTestReturnMethod(event);
            }
        }
    },

    equals: function (plugin)
    {
        if (!(plugin instanceof SystemVariablesItemsPlugIn))
        {
            return false;
        }

        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeRenderModeVars, plugin.Settings.includeRenderModeVars))
        {
            return false;
        }

        return true;
    },

    setResultTypes: function ()
    {
        var resultTypes = "";
        if (this.Settings.includeRenderModeVars && this.Settings.includeRenderModeVars === "True")
        {
            resultTypes += "RenderModes"
        }

        return resultTypes;
    },
}
// #endregion

//the system variables context plugin returns all system variables - from the utils.
//only context tree xml can be returned for this
//#region
//Include Settings:
//#region
//includeCurrentUser
//includeCurrentDate

//#endregion
function SystemVariablesContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "context";
}

SystemVariablesContextPlugIn.prototype = {

    initialize: function ()
    {
        var includeAll = (this.Settings.includeAll) ? "True" : 'False';

        //#region
        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        //read value
        var includeCurrentUser = (this.Settings.includeCurrentUser) ? this.Settings.includeCurrentUser : includeAll;
        var includeCurrentDate = (this.Settings.includeCurrentDate) ? this.Settings.includeCurrentDate : includeAll;
        var includeCurrentDateOnly = (this.Settings.includeCurrentDateOnly) ? this.Settings.includeCurrentDateOnly : includeAll;
        var includeCurrentTime = (this.Settings.includeCurrentTime) ? this.Settings.includeCurrentTime : includeAll;
        var includeCurrentUserFQN = (this.Settings.includeCurrentUserFQN) ? this.Settings.includeCurrentUserFQN : includeAll;
        var includeCurrentDisplayName = (this.Settings.includeCurrentDisplayName) ? this.Settings.includeCurrentDisplayName : includeAll;
        var includeCurrentDescription = (this.Settings.includeCurrentDescription) ? this.Settings.includeCurrentDescription : includeAll;
        var includeEmail = (this.Settings.includeEmail) ? this.Settings.includeEmail : includeAll;
        var includeManagerFQN = (this.Settings.includeManagerFQN) ? this.Settings.includeManagerFQN : includeAll;
        var includeCurrentUserName = (this.Settings.includeCurrentUserName) ? this.Settings.includeCurrentUserName : includeAll;
        var includeScreenHeight = (this.Settings.includeScreenHeight) ? this.Settings.includeScreenHeight : includeAll;
        var includeScreenWidth = (this.Settings.includeScreenWidth) ? this.Settings.includeScreenWidth : includeAll;
        var includeBrowserPlatform = (this.Settings.includeBrowserPlatform) ? this.Settings.includeBrowserPlatform : includeAll;
        var includeBrowserUsersAgent = (this.Settings.includeBrowserUsersAgent) ? this.Settings.includeBrowserUsersAgent : includeAll;
        var includeBrowserCulture = (this.Settings.includeBrowserCulture) ? this.Settings.includeBrowserCulture : includeAll;
        var includeErrorVars = (this.Settings.includeErrorVars) ? this.Settings.includeErrorVars : includeAll;
        var includeRenderModeVars = (this.Settings.includeRenderModeVars) ? this.Settings.includeRenderModeVars : includeAll;
        var includeWorkflowVars = (this.Settings.includeWorkflowVars) ? this.Settings.includeWorkflowVars : includeAll;

        var _this = this;
        jQuery.ajax({
            data: {
                method: "getSystemVariables",
                showUserName: includeCurrentUser,
                showDate: includeCurrentDate,
                showDateOnly: includeCurrentDateOnly,
                showTime: includeCurrentTime,
                showFQN: includeCurrentUserFQN,
                showDisplayName: includeCurrentDisplayName,
                showDescription: includeCurrentDescription,
                showEmail: includeEmail,
                showManagerFQN: includeManagerFQN,
                showCurrentUserName: includeCurrentUserName,
                showScreenHeight: includeScreenHeight,
                showScreenWidth: includeScreenWidth,
                showBrowserPlatform: includeBrowserPlatform,
                showBrowserUsersAgent: includeBrowserUsersAgent,
                showBrowserCulture: includeBrowserCulture,
                showErrorVars: includeErrorVars,
                showRenderModeVars: includeRenderModeVars,
                showWorkflowVars: includeWorkflowVars
            },
            dataType: "text",
            global: false,
            success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            type: "POST",
            async: true,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            }
        });

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);
            return;
        }
        else
        {
            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof SystemVariablesContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        if (!comparePluginSetting(this.Settings.includeWorkflowVars, plugin.Settings.includeWorkflowVars)) return false;

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.includeAll, plugin.Settings.includeAll))
        {
            return false;
        }
        else
        {
            return true;
        }
        if (!comparePluginSetting(this.Settings.includeCurrentUser, plugin.Settings.includeCurrentUser)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentDate, plugin.Settings.includeCurrentDate)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentDateOnly, plugin.Settings.includeCurrentDateOnly)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentTime, plugin.Settings.includeCurrentTime)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentUserFQN, plugin.Settings.includeCurrentUserFQN)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentDisplayName, plugin.Settings.includeCurrentDisplayName)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentDescription, plugin.Settings.includeCurrentDescription)) return false;
        if (!comparePluginSetting(this.Settings.includeEmail, plugin.Settings.includeEmail)) return false;
        if (!comparePluginSetting(this.Settings.includeManagerFQN, plugin.Settings.includeManagerFQN)) return false;
        if (!comparePluginSetting(this.Settings.includeCurrentUserName, plugin.Settings.includeCurrentUserName)) return false;
        if (!comparePluginSetting(this.Settings.includeScreenHeight, plugin.Settings.includeScreenHeight)) return false;
        if (!comparePluginSetting(this.Settings.includeScreenWidth, plugin.Settings.includeScreenWidth)) return false;
        if (!comparePluginSetting(this.Settings.includeBrowserPlatform, plugin.Settings.includeBrowserPlatform)) return false;
        if (!comparePluginSetting(this.Settings.includeBrowserUsersAgent, plugin.Settings.includeBrowserUsersAgent)) return false;
        if (!comparePluginSetting(this.Settings.includeBrowserCulture, plugin.Settings.includeBrowserCulture)) return false;
        if (!comparePluginSetting(this.Settings.includeRenderModeVars, plugin.Settings.includeRenderModeVars)) return false;
        if (!comparePluginSetting(this.Settings.skipViewRightsCheck, plugin.Settings.skipViewRightsCheck)) return false;

        return true;
    }
    //#endregion
}
//#endregion


//
// EnvironmentFieldsContextPlugIn
// ------------------------------
//
// This plugin returns all the current environment's environment fields
//
function EnvironmentFieldsContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "context";
}

EnvironmentFieldsContextPlugIn.prototype = {

    initialize: function ()
    {
        var _this = this;

        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        jQuery.ajax({
            data: {
                method: "getEnvironmentFields"
            },
            dataType: "text",
            global: false,
            success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            type: "POST",
            async: false,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            }
        });

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);
            return;
        }
        else
        {
            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof EnvironmentFieldsContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        return true;
    }
    //#endregion
}


//the control type event plugin returns all events for the type of control - from the utils.
//#region

//Include Settings:
//#region

//includeControlTypeEvents

//no id is specified for the plugin
//all control types are returned and if specified their events is also returned
//#endregion

function ControlTypeEventPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

ControlTypeEventPlugIn.prototype = {

    initialize: function ()
    {
        //#region

        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        //read value
        if (this.Settings.includeControlTypeEvents && this.Settings.includeControlTypeEvents === 'True')
        {
            var controlType = this.Settings.controlType
            if (this.Settings.viewControlID && this.Settings.isCurrent)
            {
                controlType = parseXML(SourceCode.Forms.Designers.View.ViewDesigner._getViewObjects()).selectSingleNode("/Items/Item[@ItemType='View']/Items/Item[@ItemType='Control' Guid = '" + this.Settings.viewControlID + "']").getAttribute("SubType");
            }
            var _this = this;
            jQuery.ajax({
                data: {
                    method: "getItems",
                    targetType: 'ControlType',
                    targetID: controlType,
                    resultTypes: "ControlTypeEvents"
                },
                url: applicationRoot + "Utilities/AJAXcall.ashx",

                type: "POST",
                async: true,
                error: function (httpRequest, status, error)
                {
                    popupManager.showError(httpRequest + ", " + status);
                },
                dataType: "text",
                global: false,
                success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
            });
        }

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region

        if (SourceCode.Forms.ExceptionHandler.handleException(httpResponse))
        {
            return;
        } else
        {

            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof ControlTypeEventPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        //compare all valid values, if one is not the same return false
        if (!comparePluginSetting(this.Settings.controlType, plugin.Settings.controlType))
        {
            return false;
        }

        return true;
    }
    //#endregion

}
//#endregion

//the sub form plugin returns all the subforms found in the rulesxml - must be used in rules wizard.
//#region

//Include Settings:
//#region
//isCurrent - the current view's subforms
//viewID - another view's ID

//no settings need be specified for the plugin and only view names will be returned.
// all the views specified as subforms on the current view or current rule will be found and returned
//#endregion

function SubViewContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

SubViewContextPlugIn.prototype = $.extend({}, ViewContextPlugIn.prototype, {

    initialize: function ()
    {
        //#region

        if (this.Settings.isCurrent && this.Settings.isCurrent === 'True')
        {
            var _currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
            var _subformXMLXPath;
            var _stateID = SourceCode.Forms.WizardContainer.stateID;

            SourceCode.Forms.Designers.Common.Context.ensureDefinitionIsReadyForDependancyChecks(SourceCode.Forms.Designers.Rule.tmpContextDefinition);
            var subformsXmlDoc = SourceCode.Forms.Designers.Rule.tmpContextDefinition;

            if (_currentContext === "form")
            {
                _subformXMLXPath = "/SourceCode.Forms/Forms/Form/States/State";

                if (_stateID)
                {
                    _subformXMLXPath += "[@ID='" + _stateID + "']";
                } else
                {
                    _subformXMLXPath += "[@IsBase='True']";
                }
            } else
            {
                _subformXMLXPath = "/SourceCode.Forms/Views/View";
            }

            var subformsXML = subformsXmlDoc.selectNodes(_subformXMLXPath + "/Events/Event[not(@SubFormID)]/Handlers/Handler/Actions/Action[@Type='Popup']");
            var items = parseXML("<Items />");
            var jq_control = jQuery("#" + this.Settings.controlID);
            var viewIDs = [];
            var subFormIDs = [];
            var instanceIDs = [];
            var notSavedViewIDs = [];
            var jq_thisLi = jq_control.closest("li.action");
            var thisLiID = jq_thisLi.attr("id");

            for (var s = 0; s < subformsXML.length; s++)
            {
                var currentViewID = subformsXML[s].selectSingleNode("Properties/Property[Name='ViewID']/Value").text;
                viewIDs.push(currentViewID);

                var subFormID = subformsXML[s].getAttribute('SubFormID');
                subFormIDs.push(subFormID);

                var instanceID = subformsXML[s].getAttribute('InstanceID');
                instanceIDs.push(instanceID);
            }

            if (!this.Settings.controlID)
            {
                popupManager.showWarning("Invalid Configuration: No controlID supplied")
            }

            if (this.Settings.controlID)
            {
                if (jq_control.closest("ul.rulesUl.handler:not(.rulesImageWrapper)") !== "ruleDefinitionRulesArea")
                {
                    var actions = jQuery("ul.rulesUl.handler:not(.rulesImageWrapper)").find("li.action:not([id=" + thisLiID + "])");
                    for (var l = 0; l < actions.length; l++)
                    {
                        var jq_Node = actions.eq(l);

                        if ($chk(jq_Node.data("xml")))
                        {
                            var nodeType = jq_Node.data("xml").getAttribute("Type");

                            if (nodeType === "Popup")
                            {
                                if (jq_control[0].parentNode.parentNode.parentNode.id !== jq_Node.attr("id"))
                                {
                                    var parts = jQuery(jq_Node.find("div.rule-item-wrapper>div")[0]).children("a");

                                    for (var p = 0; p < parts.length; p++)
                                    {
                                        var jq_Part = jQuery(parts[p]);
                                        if (jq_Part.data("xml").getAttribute("Name") === "View")
                                        {
                                            var viewID = jq_Part.data("value")
                                            if (viewID)
                                            {
                                                if (viewIDs.indexOf(viewID) === -1)
                                                {
                                                    viewIDs.push(viewID);
                                                    notSavedViewIDs.push(viewID);

                                                    var viewName = jq_Part.text();

                                                    if (!items) { items = parseXML("<Items />"); };
                                                    var item = items.createElement("Item");
                                                    var displayName = items.createElement("DisplayName");
                                                    var name = items.createElement("Name");

                                                    var displaySection = items.createTextNode(viewName.xmlEncode());
                                                    subformID = jq_Part.data("data").getAttribute("SubFormID");

                                                    item.setAttribute("ItemType", "View");
                                                    item.setAttribute("Guid", viewID);
                                                    item.setAttribute("SubFormID", subformID);

                                                    name.appendChild(displaySection);
                                                    displayName.appendChild(displaySection);

                                                    item.appendChild(name);
                                                    item.appendChild(displayName);
                                                    items.selectSingleNode("Items").appendChild(item);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (viewIDs.length > 0)
            {
                // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                var includeHidden = this.Settings.skipViewRightsCheck;
                if (includeHidden === undefined)
                {
                    includeHidden = true;
                }

                var result = jQuery.ajax({
                    data: {
                        method: "getItems",
                        targetType: 'View',
                        targetID: viewIDs.join(","),
                        resultTypes: "Views",
                        includeHidden: includeHidden
                    },
                    dataType: "text",
                    global: false,
                    async: false,
                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                    type: "POST",
                    error: function (httpRequest, status, error)
                    {
                        popupManager.showError(httpRequest + ", " + status);
                    }
                });

                if (SourceCode.Forms.ExceptionHandler.isException(result.responseText))
                {
                    SourceCode.Forms.ExceptionHandler.handleException(result.responseText);

                    return;
                }

                result = result.responseText;
                var viewsDoc = parseXML(result);
                this.filterXmlUsingSettings(viewsDoc);
                //var usedInstances = [];
                //var instanceIDArray = [];

                for (var s = 0; s < viewIDs.length; s++)
                {
                    var currentViewID = viewIDs[s];
                    var currentSubFormID = subFormIDs[s];
                    var currentInstanceID = instanceIDs[s];
                    var currentView = viewsDoc.selectSingleNode("/Items/Item[@ItemType='View' and @Guid='" + currentViewID + "']/DisplayName");

                    // if not found view was removed
                    if (currentView === null)
                    {
                        var viewNotAuthed = items.selectSingleNode("/Items/Item[@ItemType='View' and @Guid='" + currentViewID + "']/DisplayName");

                        if (checkExists(viewNotAuthed))
                        {
                            viewNotAuthed.parentNode.removeChild(viewNotAuthed);
                        }

                        continue;
                    }
                    else if (currentView !== null && notSavedViewIDs.indexOf(currentViewID) != -1)
                    {
                        continue;
                    }
                    else if (currentView !== null)
                    {
                        var viewName = viewsDoc.selectSingleNode("/Items/Item[@ItemType='View' and @Guid='" + currentViewID + "']/DisplayName").text;
                        var viewExists = items.selectSingleNode("/Items/Item[(@ItemType='View') and (@Guid='" + currentViewID + "')]");
                        //var instanceEventXPath = _subformXMLXPath + "/Events/Event[Handlers/Handler/Actions/Action[@Type='Popup']/Properties/Property[Name='ViewID']/Value='" + currentViewID + "'";
                        var instanceEventXPath = _subformXMLXPath + "/Events/Event[Handlers/Handler/Actions/Action[@Type='Popup'";
                        //var p = 0;
                        //var i = 0;
                        //while (p < usedInstances.length)
                        //{
                        //	instanceEventXPath += "and (not(@SubFormID='" + usedInstances[p] + "')";
                        //	if (instanceIDArray.length > 0)
                        //	{
                        //		instanceEventXPath += "or(";
                        //		while (i < instanceIDArray.length)
                        //		{
                        //			if (i > 0)
                        //			{
                        //				instanceEventXPath += " and ";
                        //			}

                        //			instanceEventXPath += "not(@InstanceID='" + instanceIDArray[i] + "')";
                        //			i++;
                        //		}
                        //		instanceEventXPath += ")";
                        //	}
                        //	instanceEventXPath += ")"
                        //	i = 0;
                        //	p++;
                        //}

                        instanceEventXPath += " and (@SubFormID='" + currentSubFormID + "')";
                        if (checkExists(currentInstanceID))
                        {
                            instanceEventXPath += " and (@InstanceID='" + currentInstanceID + "')";
                        }

                        instanceEventXPath += "]/Properties/Property[(Name='ViewID')]/Value='" + currentViewID + "']";

                        var instanceEvent = subformsXmlDoc.selectSingleNode(instanceEventXPath);
                        // Part of bigger fix that might need to be implemented
                        //var instanceID = instanceEvent.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Popup')and(@ViewID='" + currentViewID + "')]").getAttribute('InstanceID');
                        //var instanceID = instanceEvent.getAttribute("InstanceID");
                        //var subformID = instanceEvent.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Popup') and (@SubFormID) and (Properties/Property[Name='ViewID']/Value='" + currentViewID + "')]").getAttribute("SubFormID");
                        var ruleName = " - (" + instanceEvent.selectSingleNode("Properties/Property[Name/text()='RuleFriendlyName']/Value").text + ")";

                        var item = items.createElement("Item");
                        var displayName = items.createElement("DisplayName");
                        var name = items.createElement("Name");

                        var idCDataSection = items.createCDATASection(viewIDs[s]);
                        var displayCDATASection = items.createCDATASection(viewName + ruleName);

                        item.setAttribute("ItemType", "View");
                        item.setAttribute("Guid", currentViewID);
                        item.setAttribute("SubFormID", currentSubFormID);

                        name.appendChild(idCDataSection);
                        displayName.appendChild(displayCDATASection);

                        item.appendChild(name);
                        item.appendChild(displayName);
                        items.selectSingleNode("Items").appendChild(item);

                        if (currentInstanceID !== null)
                        {
                            var instanceIDElement = items.createElement("InstanceID");
                            var instanceIDCData = items.createCDATASection(currentInstanceID);
                            instanceIDElement.appendChild(instanceIDCData);
                            item.appendChild(instanceIDElement)

                            //instanceIDArray.push(instanceID);
                        }

                        //usedInstances.push(subformID);
                    }
                }
            }

            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: items, type: this.dataType };
            jQuery("body").trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }
        else
        {
            if (!this.Settings.viewID)
            {
                popupManager.showWarning("No view ID was specified");
                return;
            }
            var _this = this;

            // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
            var includeHidden = this.Settings.skipViewRightsCheck;
            if (includeHidden === undefined)
            {
                includeHidden = true;
            }

            jQuery.ajax({
                data: {
                    method: "getItems",
                    targetType: 'View',
                    targetID: this.Settings.viewID,
                    resultTypes: "SubViews",
                    includeHidden: includeHidden
                },
                dataType: "text",
                global: false,
                url: applicationRoot + "Utilities/AJAXcall.ashx",
                type: "POST",
                async: true,
                error: function (httpRequest, status, error)
                {
                    popupManager.showError(httpRequest + ", " + status);
                },
                success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
            });
        }

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region

        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            var xmlResponse = parseXML(httpResponse);
            this.filterXmlUsingSettings(xmlResponse);
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion


    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof SubViewContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }


        return true;
    }
    //#endregion  
});
//#endregion










//the subform plugin returns all the subforms found in the rulesxml - must be used in rules wizard.
//#region

//Include Settings:
//#region
//isCurrent - the current view's subforms
//formID - another forms ID

//no settings need be specified for the plugin and only form names will be returned.
// all the forms specified as subforms on the current form or current rule will be found and returned
//#endregion
function SubFormContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

SubFormContextPlugIn.prototype = {

    initialize: function ()
    {
        //#region

        if (this.Settings.isCurrent && this.Settings.isCurrent === 'True')
        {
            var _currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
            var _subformXMLXPath;
            var _stateID = SourceCode.Forms.WizardContainer.stateID;

            SourceCode.Forms.Designers.Common.Context.ensureDefinitionIsReadyForDependancyChecks(SourceCode.Forms.Designers.Rule.tmpContextDefinition);
            var subformsXmlDoc = SourceCode.Forms.Designers.Rule.tmpContextDefinition;

            if (_currentContext === "form")
            {
                _subformXMLXPath = "/SourceCode.Forms/Forms/Form/States/State";

                if (_stateID)
                {
                    _subformXMLXPath += "[@ID='" + _stateID + "']";
                }
                else
                {
                    _subformXMLXPath += "[@IsBase='True']";
                }
            }
            else
            {
                _subformXMLXPath = "/SourceCode.Forms/Views/View";
            }

            var subFormXml = subformsXmlDoc.selectNodes(_subformXMLXPath + "/Events/Event[not(@SubFormID)]/Handlers/Handler/Actions/Action[@Type='Open']");

            var items = parseXML("<Items />");
            var jq_control = jQuery("#" + this.Settings.controlID);
            var formIDs = [];
            var formNotSavedIDs = [];
            var subFormIDs = [];
            var instanceIDs = [];
            var jq_thisLi = jq_control.closest("li.action");
            var thisLiID = jq_thisLi.attr("id");

            for (var s = 0; s < subFormXml.length; s++)
            {
                var currentFormID = subFormXml[s].selectSingleNode("Properties/Property[Name='FormID']/Value").text;
                formIDs.push(currentFormID);

                var subFormID = subFormXml[s].getAttribute('SubFormID');
                subFormIDs.push(subFormID);

                var instanceID = subFormXml[s].getAttribute('InstanceID');
                instanceIDs.push(instanceID);
            }

            if (!this.Settings.controlID)
            {
                popupManager.showWarning("Invalid Configuration: No controlID supplied")
            }

            if (this.Settings.controlID)
            {
                if (jq_control.closest("ul.rulesUl.handler:not(.rulesImageWrapper)") !== "ruleDefinitionRulesArea")
                {
                    var actions = jQuery("ul.rulesUl.handler:not(.rulesImageWrapper)").find("li.action:not([id=" + thisLiID + "])");

                    for (var l = 0; l < actions.length; l++)
                    {
                        var jq_Node = actions.eq(l);

                        if ($chk(jq_Node.data("xml")))
                        {
                            var nodeType = jq_Node.data("xml").getAttribute("Type");

                            if (nodeType === "Open")
                            {
                                if (jq_control[0].parentNode.parentNode.parentNode.id !== jq_Node.attr("id"))
                                {
                                    var parts = jQuery(jq_Node.find("div.rule-item-wrapper>div")[0]).children("a");

                                    for (var p = 0; p < parts.length; p++)
                                    {
                                        var jq_Part = jQuery(parts[p]);
                                        if (jq_Part.data("xml").getAttribute("Name") === "Form")
                                        {
                                            var formID = jq_Part.data("value")
                                            if (formID)
                                            {
                                                if (formIDs.indexOf(formID) === -1)
                                                {
                                                    formIDs.push(formID);
                                                    formNotSavedIDs.push(formID);

                                                    var formName = jq_Part.text();

                                                    if (!items) { items = parseXML("<Items />"); };
                                                    var item = items.createElement("Item");
                                                    var displayName = items.createElement("DisplayName");
                                                    var name = items.createElement("Name");

                                                    var displaySection = items.createTextNode(formName.xmlEncode());
                                                    subformID = jq_Part.data("data").getAttribute("SubFormID");

                                                    item.setAttribute("ItemType", "Form");
                                                    item.setAttribute("Guid", formID);
                                                    item.setAttribute("SubFormID", subformID);

                                                    name.appendChild(displaySection);
                                                    displayName.appendChild(displaySection);

                                                    item.appendChild(name);
                                                    item.appendChild(displayName);
                                                    items.selectSingleNode("Items").appendChild(item);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (formIDs.length > 0)
            {
                // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
                var includeHidden = this.Settings.skipViewRightsCheck;
                if (includeHidden === undefined)
                {
                    includeHidden = true;
                }

                var result = jQuery.ajax({
                    data: {
                        method: "getItems",
                        targetType: 'Form',
                        targetID: formIDs.join(","),
                        resultTypes: "Forms",
                        includeHidden: includeHidden
                    },
                    url: applicationRoot + "Utilities/AJAXcall.ashx",
                    type: "POST",
                    async: true,
                    error: function (httpRequest, status, error)
                    {
                        popupManager.showError(httpRequest + ", " + status);
                    },
                    dataType: "text",
                    global: false,
                    async: false
                }
                ).responseText;

                if (SourceCode.Forms.ExceptionHandler.isException(result))
                {
                    SourceCode.Forms.ExceptionHandler.handleException(result);

                    return;
                }
                else
                {
                    var formsDoc = parseXML(result);
                    //var usedInstances = [];
                    var formNames = formsDoc.selectNodes("/Items/Item[@ItemType='Form']");
                    //var instanceIDArray = [];

                    for (var s = 0; s < formIDs.length; s++)
                    {
                        var currentFormID = formIDs[s];
                        var currentForm = formsDoc.selectSingleNode("/Items/Item[@ItemType='Form' and @Guid='" + currentFormID + "']");
                        var currentSubFormID = subFormIDs[s];
                        var currentInstanceID = instanceIDs[s];

                        if (currentForm === null)
                        {
                            var formNotAuthed = items.selectSingleNode("/Items/Item[@ItemType='Form' and @Guid='" + currentFormID + "']");

                            if (checkExists(formNotAuthed))
                            {
                                formNotAuthed.parentNode.removeChild(formNotAuthed);
                            }

                            continue;
                        }
                        else if (currentForm !== null && formNotSavedIDs.indexOf(currentFormID) != -1)
                        {
                            continue;
                        }
                        // If not found form was deleted
                        if (currentForm !== null)
                        {
                            var formName = formsDoc.selectSingleNode("/Items/Item[@ItemType='Form' and @Guid='" + currentFormID + "']/DisplayName").text;
                            var formSystemName = formsDoc.selectSingleNode("/Items/Item[@ItemType='Form' and @Guid='" + currentFormID + "']/Name").text;
                            var formExists = items.selectSingleNode("/Items/Item[(@ItemType='Form') and (@Guid='" + formIDs[s] + "')]");
                            var instanceEventXPath = _subformXMLXPath + "/Events/Event[Handlers/Handler/Actions/Action[(@Type='Open')";
                            //var p = 0;
                            //var i = 0;
                            //while (p < usedInstances.length)
                            //{
                            //	instanceEventXPath += "and (not(@SubFormID='" + usedInstances[p] + "')";

                            //	if (instanceIDArray.length > 0)
                            //	{
                            //		instanceEventXPath += "or(";
                            //		while (i < instanceIDArray.length)
                            //		{
                            //			if (i > 0)
                            //			{
                            //				instanceEventXPath += " and ";
                            //			}

                            //			instanceEventXPath += "not(@InstanceID='" + instanceIDArray[i] + "')";
                            //			i++;
                            //		}
                            //		instanceEventXPath += ")";
                            //	}
                            //	instanceEventXPath += ")"
                            //	i = 0;
                            //	p++;
                            //}
                            instanceEventXPath += " and (@SubFormID='" + currentSubFormID + "')";
                            if (checkExists(currentInstanceID))
                            {
                                instanceEventXPath += " and (@InstanceID='" + currentInstanceID + "')";
                            }
                            instanceEventXPath += "]/Properties/Property[Name='FormID']/Value='" + currentFormID + "']";

                            var instanceEvent = subformsXmlDoc.selectSingleNode(instanceEventXPath);

                            if (instanceEvent !== null)
                            {
                                //var instanceID = instanceEvent.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Open')and(@FormID='" + currentFormID + "')]").getAttribute('InstanceID');
                                //var subformID = instanceEvent.selectSingleNode("Handlers/Handler/Actions/Action[(@Type='Open') and (@SubFormID) and (Properties/Property[Name='FormID']/Value='" + currentFormID + "')]").getAttribute("SubFormID");
                                var ruleName = " - (" + instanceEvent.selectSingleNode("Properties/Property[Name/text()='RuleFriendlyName']/Value").text + ")";
                                //var instanceID = instanceEvent.getAttribute("InstanceID");

                                var item = items.createElement("Item");
                                var displayName = items.createElement("DisplayName");
                                var name = items.createElement("Name");
                                var systemName = items.createElement("SystemName");

                                var idCDataSection = items.createCDATASection(currentFormID);
                                var displayCDATASection = items.createCDATASection(formName + ruleName);

                                item.setAttribute("ItemType", "Form");
                                item.setAttribute("Guid", currentFormID);
                                item.setAttribute("SubFormID", currentSubFormID);

                                name.appendChild(idCDataSection);
                                displayName.appendChild(displayCDATASection);
                                systemName.appendChild(items.createTextNode(formSystemName));

                                item.appendChild(name);
                                item.appendChild(displayName);
                                item.appendChild(systemName);
                                items.selectSingleNode("Items").appendChild(item);

                                if (currentInstanceID !== null)
                                {
                                    var instanceIDElement = items.createElement("InstanceID");
                                    var instanceIDCData = items.createCDATASection(currentInstanceID);
                                    instanceIDElement.appendChild(instanceIDCData);
                                    item.appendChild(instanceIDElement)

                                    //instanceIDArray.push(instanceID);
                                }

                                //usedInstances.push(subformID);
                            }
                        }
                    }
                }
            }

            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: items, type: this.dataType };
            jQuery("body").trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }
        else
        {
            if (!this.Settings.formID)
            {
                popupManager.showWarning("No form ID was specified");
                return;
            }
            var _this = this;

            // skipViewRightsCheck specifies if view rights should be honoured or not when items are loaded
            var includeHidden = this.Settings.skipViewRightsCheck;
            if (includeHidden === undefined)
            {
                includeHidden = true;
            }

            jQuery.ajax({
                data: {
                    method: "getItems",
                    targetType: 'Form',
                    targetID: this.Settings.formID,
                    resultTypes: "SubForms",
                    includeHidden: includeHidden
                },
                url: applicationRoot + "Utilities/AJAXcall.ashx",
                type: "POST",
                async: true,
                error: function (httpRequest, status, error)
                {
                    popupManager.showError(httpRequest + ", " + status);
                },
                dataType: "text",
                global: false,
                success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
            });
        }

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region

        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion


    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof SubFormContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }


        return true;
    }
    //#endregion  

}
//#endregion


//the item states plugin returns all the item states found in utils
//#region

//Include Settings:
//#region

//includeUnchangeStates
//includeAddRemoveChangeStates 
//includeSelectionStates
//includeCheckedStates
//includeAllState
//includeCustomState
//viewType -> List, CapureList, Capture
//itemStateContext -> Control, View
//#endregion
function ItemStatesContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

ItemStatesContextPlugIn.prototype = {

    initialize: function ()
    {
        //#region
        var _this = this;

        var fetchItemStates = function ()
        {
            var pos = cachedPluginIndex(_this);
            if (pos !== -1)
            {
                _this.dataReturned(getCachedPluginResult(pos));
                return;
            }

            jQuery.ajax({
                data: {
                    method: "getItems",
                    resultTypes: "ActionItemStates"
                },
                url: applicationRoot + "Utilities/AJAXcall.ashx",
                dataType: "text",
                type: "POST",
                async: true,
                error: function (httpRequest, status, error)
                {
                    popupManager.showError(httpRequest + ", " + status);
                },
                global: false,
                success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
            });
        };

        if (typeof _this.Settings.viewType !== "undefined")
        {
            var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            if ((context === "View" || context === "Control")
                && (_this.Settings.viewType === "List" || _this.Settings.viewType === "CaptureList"))
            {
                fetchItemStates();
            }
            else
            {
                popupManager.showNotification(Resources.CommonPhrases.NoItemsToDisplay);
            }
        }
        else
        {
            fetchItemStates();
        }

    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region

        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        }
        else
        {
            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            var xmlResponse = parseXML(httpResponse);
            this.filterXmlUsingSettings(xmlResponse);
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof ItemStatesContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        return true;
    },

    //#endregion
    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region
        if ((!this.Settings.includeChangeStates || this.Settings.includeChangeStates === 'False')
            && (!this.Settings.includeAddRemoveStates || this.Settings.includeAddRemoveStates === 'False')
            && (!this.Settings.includeSelectionStates || this.Settings.includeSelectionStates === 'False')
            && (!this.Settings.includeAllState || this.Settings.includeAllState === 'False')
            && (!this.Settings.includeCustomState || this.Settings.includeCustomState === 'False')
            && (!this.Settings.includeCheckedStates || this.Settings.includeCheckedStates === 'False'))
        {
            return xmlDoc;
        }

        var itemStatesXml = "";
        if (!this.Settings.includeUnchangeStates || this.Settings.includeUnchangeStates === 'False')
        {
            itemStatesXml += "Name = 'Unchanged'"
        }

        if (!this.Settings.includeAllState || this.Settings.includeAllState === 'False')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'All'"
        }

        if (!this.Settings.includeCustomState || this.Settings.includeCustomState === 'False')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Custom'"
        }
        if (!this.Settings.includeAddRemoveChangeStates || this.Settings.includeAddRemoveChangeStates === 'False')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Added' or Name = 'Removed' or Name = 'Changed'";
        }

        if (!this.Settings.includeSelectionStates || this.Settings.includeSelectionStates === 'False')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Selected' or Name = 'Unselected'";
        }

        if (!this.Settings.includeCheckedStates || this.Settings.includeCheckedStates === 'False')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Checked' or Name = 'Unchecked'";
        }

        if (this.Settings.viewType && this.Settings.viewType === 'Capture')
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Added' or Name = 'Removed' or Name = 'Changed' or Name = 'Unchanged' or Name = 'Selected' or Name = 'Unselected'";
        }
        else if (this.Settings.viewType && (this.Settings.viewType === 'CaptureList' || this.Settings.viewType === 'List'))
        {
            if (itemStatesXml.length > 0)
            {
                itemStatesXml += " or ";
            }
            itemStatesXml += "Name = 'Checked' or Name = 'Unchecked'";
        }

        if (itemStatesXml.length > 0)
        {
            removeXmlNodes(xmlDoc, "/Items/Item[" + itemStatesXml + "]");
        }
    }
    //#endregion

}
//#endregion






//the process plugin returns all the processes found in utils by the workflow manager
//#region

//Include Settings:
//#region

//includeUnchangeStates
//includeAddRemoveChangeStates 
//includeSelectionStates
//includeCheckedStates
//includeAllState
//includeCustomState
//viewType
//#endregion
function ProcessContextPlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
}

ProcessContextPlugIn.prototype = {
    initialize: function ()
    {
        //#region
        if (this.Settings.dataType)
            this.dataType = this.Settings.dataType;
        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        var _this = this;
        jQuery.ajax({
            data: {
                method: "getItems",
                resultTypes: this.Settings.resultTypes,
                targetId: this.Settings.workflowPath
            },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            dataType: "text",
            type: "POST",
            async: true,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            },
            global: false,
            success: function (httpResponse) { with (_this) { _this.dataReturned(httpResponse); } }
        });


    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            this.cachedResult = httpResponse;
            addPlugInToCache(this);
            if (this.dataType && this.dataType === "context")
            {
                var transformer = GetContextTreeTransformer();

                if (this.Settings.objectDraggable)
                {
                    transformer.addParameter("objectDraggable", this.Settings.objectDraggable);
                }

                httpResponse = transformer.transformToText(httpResponse);
            }

            var event = jQuery.Event();
            event.type = this.pluginReturnedId;

            try // Added for Chrome not being able to return empty string from xslttransform
            {
                httpResponse = parseXML(httpResponse);

                if (this.dataType && this.dataType === "context" && httpResponse.documentElement.childNodes.length === 0)
                {
                    throw new DOMException;
                }
            }
            catch (e)
            {
                jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                popupManager.showNotification(Resources.RuleDesigner.NoItemsToDisplayNoRightsRemoved);
                return false;
            }

            event.detail = { xml: httpResponse, type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }
    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof ItemStatesContextPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        return true;
    },

    //#endregion
    filterXmlUsingSettings: function (xmlDoc)
    {
        //#region
        var nameParts = this.Settings.workflowPath.toString().split("\\");

        if (nameParts.length === 2)
        {
            //folder level
            removeXmlNodes(xmlDoc, "//Item[(@ItemType='ProcessFolder')and not(Name/text()='" + nameParts[0] + "')]");
            //process level
            removeXmlNodes(xmlDoc, "//Item[(@ItemType='ProcessSet')and not(Name/text()='" + nameParts[0] + "\\\\" + nameParts[1] + "')]");
        }
        else if (nameParts.length === 3)
        {
            var nameParts = this.Settings.activityFullName.toString().split("\\");
            //folder level
            removeXmlNodes(xmlDoc, "//Item[(@ItemType='ProcessFolder')and not(Name/text()='" + nameParts[0] + "')]");
            //process level
            removeXmlNodes(xmlDoc, "//Item[(@ItemType='ProcessSet')and not(Name/text()='" + nameParts[0] + "\\\\" + nameParts[1] + "')]");
            //activty level
            removeXmlNodes(xmlDoc, "//Item[(@ItemType='Activity')and not(Name/text()='" + nameParts[2] + "')]");
        }
    }
}
//#endregion


//Rule Plugin
//This plugin is used by the Rules Wizard to return a list of available rules(event) that have been configured
//#region
function RulePlugIn()
{
    this.dataType = "text";
}

RulePlugIn.prototype = {
    initialize: function ()
    {
        this.dataReturned(this.getData());
    },
    getData: function ()
    {
        //var stateID = this.Settings.stateID;
        var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
        var rulesDoc = parseXML("<Items />");
        var currentRuleID = $chk(SourceCode.Forms.WizardContainer.ruleID) ? SourceCode.Forms.WizardContainer.ruleID : "";
        var stateID = SourceCode.Forms.WizardContainer.stateID;
        var xPath = "SourceCode.Forms";

        if (context === "View" || context === "Control")
        {
            xPath += "/Views/View/";
        }
        else
        {
            xPath += "/Forms/Form/States/State";
            if ($chk(stateID))
            {
                xPath += "[@ID='" + stateID + "']";
            }
            else
            {
                xPath += "[@IsBase='True']";
            }
        }

        xPath += "/Events/Event[(@ID!='" + currentRuleID + "') and (@Type='User')]";

        var events = SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectNodes(xPath);

        for (var e = 0; e < events.length; e++)
        {
            var currentEvent = events[e];
            var ruleFriendlyNameNode = currentEvent.selectSingleNode("Properties/Property[Name = 'RuleFriendlyName']/Value");
            var ruleFriendlyName = (ruleFriendlyNameNode === null) ? null : ruleFriendlyNameNode.text;
            if (ruleFriendlyName === null)
            {
                continue;
            }
            var eventGuid = currentEvent.getAttribute("ID");
            var definitionGuid = currentEvent.getAttribute("DefinitionID") ? currentEvent.getAttribute("DefinitionID") : eventGuid;
            var subFormGuid = currentEvent.getAttribute("SubFormID") ? currentEvent.getAttribute("SubFormID") : "";
            var instanceGuid = currentEvent.getAttribute("InstanceID") ? currentEvent.getAttribute("InstanceID") : "";
            var subFormInstanceGuid = currentEvent.getAttribute("SubFormInstanceID") ? currentEvent.getAttribute("SubFormInstanceID") : "";
            var systemName = currentEvent.selectSingleNode("Name") ? currentEvent.selectSingleNode("Name").text : "";

            // SFIID TODO: replace temp code added to not break Execute Another Rule Action whilst Events have not been done.
            // This should end up with an approximation of how runtime determines the instance... its not perfect though.

            // If it has a SubFormID, check whether an InstanceID exists and whether the InstanceID should actually be the SubFormInstanceID
            // This will interfere with Seans work, but hopefully this will be removed before, or very shortly after Sean is done
            if (checkExistsNotEmptyGuid(subFormGuid))
            {
                // Get OpenAction, 
                var openActionXPath = ".//Action[(@Type='Open' or @Type='Popup') and @SubFormID='" + subFormGuid + "']";
                var openAction = SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectSingleNode(openActionXPath);
                // if OpenAction has InstanceID and != to current InstanceID, switch InstanceID to SubFormInstanceID and use OpenAction.InstanceID as the new InstanceID
                var openActionInstanceGuid = openAction.getAttribute("InstanceID") ? openAction.getAttribute("InstanceID") : "";
                if (openActionInstanceGuid !== instanceGuid)
                {
                    subFormInstanceGuid = instanceGuid;
                    instanceGuid = openActionInstanceGuid;
                }
            }

            // -- END SFIID TODO ------------------

            var itemType = "Rule";

            var itemEl = rulesDoc.createElement("Item");
            var itemNameEl = rulesDoc.createElement("Name");
            var itemSystemNameEl = rulesDoc.createElement("SystemName");
            var itemValueEl = rulesDoc.createElement("Value");
            var itemDisplayEl = rulesDoc.createElement("DisplayName");
            var itemDataEl = rulesDoc.createElement("Data");
            var itemDataItemEl = rulesDoc.createElement("Item");
            var itemDataItemNameEl = rulesDoc.createElement("Name");

            itemEl.setAttribute("ItemType", itemType);
            itemEl.setAttribute("Guid", eventGuid);
            itemEl.setAttribute("InstanceID", instanceGuid);
            itemEl.setAttribute("SubFormID", subFormGuid);
            itemEl.setAttribute("SubFormInstanceID", subFormInstanceGuid);

            itemNameEl.appendChild(rulesDoc.createCDATASection(ruleFriendlyName));
            itemSystemNameEl.appendChild(rulesDoc.createCDATASection(systemName));
            itemDisplayEl.appendChild(rulesDoc.createCDATASection(ruleFriendlyName));
            itemValueEl.appendChild(rulesDoc.createCDATASection(definitionGuid));

            itemDataItemNameEl.appendChild(rulesDoc.createCDATASection(ruleFriendlyName));

            itemDataItemEl.setAttribute("ItemType", itemType);
            itemDataItemEl.setAttribute("Guid", eventGuid);
            itemDataItemEl.setAttribute("InstanceID", instanceGuid);
            itemDataItemEl.setAttribute("SubFormID", subFormGuid);
            itemDataItemEl.setAttribute("SubFormInstanceID", subFormInstanceGuid);

            itemDataEl.appendChild(itemDataItemEl)
            itemDataItemEl.appendChild(itemDataItemNameEl);

            itemEl.appendChild(itemNameEl);
            itemEl.appendChild(itemSystemNameEl);
            itemEl.appendChild(itemDisplayEl);
            itemEl.appendChild(itemValueEl);
            itemEl.appendChild(itemDataEl);
            rulesDoc.documentElement.appendChild(itemEl);
        }
        return rulesDoc.xml;
    },

    dataReturned: function (httpResponse)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            var xmlResponse = parseXML(httpResponse)
            this.filterXmlUsingSettings(xmlResponse);

            //#region
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: xmlResponse, type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
        }
    },

    filterXmlUsingSettings: function (xmlDoc)
    {
        if (checkExistsNotEmpty(this.Settings) && checkExistsNotEmpty(this.Settings.eventName))
        {
            removeXmlNodes(xmlDoc, "//Item[SystemName!='" + this.Settings.eventName + "']");
        }
    },

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof RulePlugIn))
        {
            return false;
        }

        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }

        return true;
    }
}
//#endregion

//the WorkflowStripLocationPlugIn plugin returns top or bottom
//#region

//Include Settings:
//#region

//#endregion
function WorkflowStripLocationPlugIn()
{
    this.dataType = "text";
}

WorkflowStripLocationPlugIn.prototype = {

    initialize: function ()
    {
        var items = parseXML("<Items />");
        var locations = ["none", "top", "bottom"];
        var locationsResources = [this.Settings.noneResourceName, this.Settings.topResourceName, this.Settings.bottomResourceName];
        for (var s = 0; s < locations.length; s++)
        {
            var item = items.createElement("Item");
            var name = items.createElement("Name");
            var displayName = items.createElement("DisplayName");
            var value = items.createElement("Value");

            var nameCDATASection = items.createCDATASection(locations[s]);
            var displayCDATASection = items.createCDATASection(locationsResources[s]);
            var valueCDATASection = items.createCDATASection(locations[s]);

            item.setAttribute("ItemType", "WorkflowStripLocationType");
            name.appendChild(nameCDATASection);
            displayName.appendChild(displayCDATASection);
            value.appendChild(valueCDATASection)

            item.appendChild(name);
            item.appendChild(displayName);
            item.appendChild(value);

            items.selectSingleNode("Items").appendChild(item);
        }
        this.dataReturned(items.xml);
    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            //#region
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
        }
    },
    //#endregion


    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof WorkflowStripLocationPlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }
        return true;
    }
    //#endregion  

}
//#endregion

//the executionType plugin returns all the executionTypes - must be used in rules wizard.
//#region

//Include Settings:
//#region

//no settings need be specified for the plugin and onlyexecutionTypes will be returned.

//#endregion
function ExecutionTypePlugIn(unitTestReturnMethod)
{
    this.unitTestReturnMethod = unitTestReturnMethod;
    this.dataType = "text";
}

ExecutionTypePlugIn.prototype = {

    initialize: function ()
    {
        var pos = cachedPluginIndex(this);
        if (pos !== -1)
        {
            this.dataReturned(getCachedPluginResult(pos));
            return;
        }

        var items = parseXML("<Items />");

        var result = jQuery.ajax({
            data: {
                method: "getItems",
                resultTypes: "ActionExecutionTypes"
            },
            url: applicationRoot + "Utilities/AJAXcall.ashx",
            type: "POST",
            async: true,
            error: function (httpRequest, status, error)
            {
                popupManager.showError(httpRequest + ", " + status);
            },
            dataType: "text",
            global: false,
            async: false
        }
        ).responseText;

        if (SourceCode.Forms.ExceptionHandler.isException(result))
        {
            SourceCode.Forms.ExceptionHandler.handleException(result);

            return;
        } else
        {
            var executionDoc = parseXML(result);
            var executionTypeName = executionDoc.selectNodes("/Items/Item[@ItemType='ActionExecutionType']");
            for (var s = 0; s < executionTypeName.length; s++)
            {

                var item = items.createElement("Item");

                var name = items.createElement("Name");
                var displayName = items.createElement("DisplayName");
                var value = items.createElement("Value");

                var nameCDATASection = items.createCDATASection(executionTypeName[s].selectSingleNode("Name").text);
                var displayCDATASection = items.createCDATASection(executionTypeName[s].selectSingleNode("DisplayName").text);
                var valueCDATASection = items.createCDATASection(executionTypeName[s].selectSingleNode("Value").text);

                item.appendChild(name);
                item.appendChild(displayName);
                item.appendChild(value);

                item.setAttribute("ItemType", "ActionExecutionType");
                name.appendChild(nameCDATASection);
                displayName.appendChild(displayCDATASection);
                value.appendChild(valueCDATASection)

                items.selectSingleNode("Items").appendChild(item);
            }

            this.dataReturned(items.xml);
        }
    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        //#region
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        } else
        {
            //jquery trigger configuration plugin returned

            this.cachedResult = httpResponse;
            addPlugInToCache(this);

            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
            if (this.unitTestReturnMethod) this.unitTestReturnMethod(event);
        }

    },
    //#endregion


    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof ExecutionTypePlugIn))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }
        return true;
    }
    //#endregion  

}
//#endregion


//the SubFormSettingsnPlugIn plugin returns settings for subforms
//#region

function SubformSettingsPlugin()
{
    this.dataType = "text";
}

SubformSettingsPlugin.prototype = {

    initialize: function ()
    {
        var itemXml = parseXML("<Items></Items>");
        var settings =
            [
                {
                    Name: "Heading",
                    Icon: "text",
                    DisplayName: this.Settings.headingResourceName
                },
                {
                    Name: "SubformWidth",
                    Icon: "width",
                    DisplayName: this.Settings.widthResourceName
                },
                {
                    Name: "SubformHeight",
                    Icon: "height",
                    DisplayName: this.Settings.heightResourceName
                },
                {
                    Name: "SubformVerticalAlign",
                    Icon: "vertical-align",
                    DisplayName: this.Settings.verticalAlignResourceName
                }
            ];
        var items = itemXml.selectSingleNode("Items")
        for (var s = 0; s < settings.length; s++)
        {
            var item = itemXml.createElement("Item");
            var name = itemXml.createElement("Name");
            var displayName = itemXml.createElement("DisplayName");

            var nameCDATASection = itemXml.createCDATASection(settings[s].Name);
            var displayCDATASection = itemXml.createCDATASection(settings[s].DisplayName);

            item.setAttribute("ItemType", "Setting");
            item.setAttribute("ActionPropertyCollection", "Properties");
            item.setAttribute("Icon", settings[s].Icon);

            name.appendChild(nameCDATASection);
            displayName.appendChild(displayCDATASection);

            item.appendChild(name);
            item.appendChild(displayName);

            items.appendChild(item);
        }
        this.dataReturned(items.xml);
    },
    //#endregion

    dataReturned: function (httpResponse)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(httpResponse))
        {
            SourceCode.Forms.ExceptionHandler.handleException(httpResponse);

            return;
        }
        else
        {
            //#region
            //jquery trigger configuration plugin returned
            var event = jQuery.Event();
            event.type = this.pluginReturnedId;
            event.detail = { xml: parseXML(httpResponse), type: this.dataType, resultName: this.resultName };
            jQuery(document.body).trigger(event);
        }
    },
    //#endregion

    equals: function (plugin)
    {
        //#region

        if (!(plugin instanceof SubformSettingsPlugin))
        {
            return false;
        }
        if (!(this.resultName === plugin.resultName))
        {
            return false;
        }
        return true;
    }
    //#endregion  

}
//#endregion
