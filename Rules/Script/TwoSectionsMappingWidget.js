//this is the basic mapping widget
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function TwoSectionsMappingWidget()
{
}

var TwoSectionsMappingWidgetProtoType =
{
    initialize: function (contentElement)
    {
        this.analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
        this.container = contentElement;
        this.instanceid = String.generateGuid();
        this.staticMappingWidget = null;
        this.staticTargetXml = null;
        this.dynamicMappingWidget = null;
        this.dynamicTargetXml = null;
        if (checkExists(this.targetXml))
        {
            this._transformXml();
            this._buildUI(contentElement);
        }
    },

    _transformXml: function ()
    {
        SourceCode.Forms.Designers.Rule.MappingWidgetBase.prototype._transformXml.apply(this, arguments);
    },

    _buildUI: function (parentElement)
    {
        var pcOptions =
        {
            id: "pcDetails_" + this.instanceid,
            orientation: "vertical",
            resizable: false,
            showDividers: false,
            panes: [
                { id: "Top_" + this.instanceid },
                { id: "Bottom_" + this.instanceid }
            ]
        };

        switch (this.Settings.actionName)
        {
            case "ProcessAction":
                pcOptions.panes[0].height = "265px";
                break;
            case "ProcessStart":
                pcOptions.panes[0].height = "150px";
                break;
            case "ProcessLoad":
                pcOptions.panes[1].height = "0px";
                break;
            default:
                pcOptions.panes[0].height = "136px";
                break;
        }

        jQuery(SourceCode.Forms.Controls.PaneContainer.html(pcOptions)).appendTo(parentElement).panecontainer();

        // Top
        var topPane = jQuery(document.getElementById("Top_" + this.instanceid));
        var panelOptions =
        {
            fullsize: true,
            header: Resources.RuleDesigner["HeaderWorkFlowItemMappings" + this.Settings.actionName],
            content: '<div class="WorkFlowItemMappings" style="overflow-y: auto;height: 100%;"></div>',
            id: this.Settings.actionName + "TopPanel"
        };
        topPane.append(SourceCode.Forms.Controls.Panel.html(panelOptions));

        // Bottom
        var bottomPane = jQuery(document.getElementById("Bottom_" + this.instanceid));
        panelOptions.header = Resources.RuleDesigner["HeaderWorkFlowDataMappings" + this.Settings.actionName];
        panelOptions.content = '<div class="WorkFlowDataMappings" style="overflow-y: auto;height: 100%;"></div>';
        panelOptions.id = this.Settings.actionName + "BottomPanel";
        bottomPane.append(SourceCode.Forms.Controls.Panel.html(panelOptions));

        // Create Toolbar
        this._populateToolbar(this.container);

        // Generate static mappings tree
        this.staticTargetXml = parseXML("<Items/>");
        if (checkExistsNotEmpty(this.Settings.topPath))
        {
            var targetNodes = this.targetXml.selectNodes(this.Settings.topPath);
            var cloneNode = null;

            for (var i = 0; i < targetNodes.length; i++)
            {
                cloneNode = targetNodes[i].cloneNode(true);

                if (cloneNode.getAttribute("ItemType") === "ActivityProperty")
                {
                    cloneNode.setAttribute("ItemType", "ProcessProperty");
                }

                this.staticTargetXml.documentElement.appendChild(cloneNode);
            }
        }

        // Prepend a readonly item to the target XML to display the Workflow FQN
        var workflowPartItem = this.targetXml.selectSingleNode(this.Settings.namePath);
        if (checkExists(workflowPartItem))
        {
            workflowPartItem = workflowPartItem.cloneNode(true);
            workflowPartItem.removeChild(workflowPartItem.selectSingleNode("./Items"));
            workflowPartItem.selectSingleNode("DisplayName").firstChild.nodeValue = this.Settings.nameDisplay;
            workflowPartItem.selectSingleNode("Name").firstChild.nodeValue = this.Settings.nameDisplay;
            workflowPartItem.setAttribute("Readonly", "true");
            workflowPartItem.setAttribute("RenderInputAs", "textbox");
            this.staticTargetXml.documentElement.insertBefore(workflowPartItem, this.staticTargetXml.documentElement.firstChild);
        }

        this.staticMappingWidget = new SourceCode.Forms.Designers.Rule.MappingWidgetBase({ renderPanel: false, renderToolbar: false });

        // Set the widget to render labels as text only
        var targetItems = this.staticTargetXml.selectNodes('//Item');
        for (var i = 0; i < targetItems.length; i++)
        {
            targetItems[i].setAttribute("RenderLabelAs", "text");
        }

        this.staticMappingWidget.ResultName = this.ResultName;
        this.staticMappingWidget.Settings = this.Settings;
        this.staticMappingWidget.filterTypes = this.filterTypes;
        this.staticMappingWidget.excludeTypes = this.excludeTypes;
        this.staticMappingWidget.contextsXml = this.contextsXml;
        this.staticMappingWidget.initialize(parentElement.find(".WorkFlowItemMappings"));
        this.staticMappingWidget.targetXml = this.staticTargetXml;
        this.staticMappingWidget._buildUI();

        // Generate dynamic mappings tree
        this.dynamicTargetXml = parseXML("<Items/>");

        if (checkExistsNotEmpty(this.Settings.bottomPath))
        {
            var targetNodes = this.targetXml.selectNodes(this.Settings.bottomPath);
            for (var i = 0; i < targetNodes.length; i++)
            {
                this.dynamicTargetXml.documentElement.appendChild(targetNodes[i].cloneNode(true));
            }
        }

        this.dynamicMappingWidget = new SourceCode.Forms.Designers.Rule.MappingWidgetBase({ renderPanel: false, renderToolbar: false });

        this.dynamicMappingWidget.ResultName = this.ResultName;
        this.dynamicMappingWidget.Settings = this.Settings;
        this.dynamicMappingWidget.filterTypes = this.filterTypes;
        this.dynamicMappingWidget.excludeTypes = checkExists(this.Settings.bottomExcludeTypes) ? JSON.parse(this.Settings.bottomExcludeTypes) : this.excludeTypes;
        this.dynamicMappingWidget.contextsXml = this.contextsXml;
        this.dynamicMappingWidget.initialize(parentElement.find(".WorkFlowDataMappings"));
        this.dynamicMappingWidget.targetXml = this.dynamicTargetXml;
        this.dynamicMappingWidget._buildUI();

        this.initCallBack();
    },

    _populateToolbar: function (parentElement)
    {
        var tb = parentElement.closest(".wizard-step-content").find(".toolbar");

        if (tb.length === 0)
        {
            var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>");
            tb = jQuery(SourceCode.Forms.Controls.Toolbar.html());
            toolbarWrapper.append(tb);
            parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);
        }

        tb.toolbar();
        tb.toolbar("add", "button", { id: "autoMapButton_BasicMappingWidget", icon: "auto-map", text: ContextTree_AutoMap_Values, description: ContextTree_AutoMap_Values, disabled: false });
        tb.toolbar("add", "button", { id: "clearAllButton_BasicMappingWidget", icon: "delete-all", text: ContextTree_Clear_AllValues, description: ContextTree_Clear_AllValuesDesc, disabled: false });
        tb.toolbar("add", "button", { id: "clearSelectedButton_BasicMappingWidget", icon: "delete", text: ContextTree_Clear_SelectedValue, description: ContextTree_Clear_SelectedValueDesc, disabled: true });

        var toolbarItems = tb.toolbar("fetch", "buttons");
        jQuery(toolbarItems[0]).on("click", this.automapValues.bind(this));
        jQuery(toolbarItems[1]).on("click", this.clearAllValues.bind(this));
        jQuery(toolbarItems[2]).on("click", this.clearSelectedValue.bind(this));
    },

    dispose: function ()
    {
        this.container.empty();
    },

    initCallBack: function ()
    {
        //This method should be overrided by the configuration wizard (at runtime)
    },

    automapValues: function ()
    {
        this.staticMappingWidget.automapValues();
        this.dynamicMappingWidget.automapValues();
    },

    clearAllValues: function ()
    {
        this.staticMappingWidget.clearAllValues();
        this.dynamicMappingWidget.clearAllValues();
    },

    clearSelectedValue: function ()
    {
        this.staticMappingWidget.clearSelectedValue();
        this.dynamicMappingWidget.clearSelectedValue();
    },

    getConfigurationXML: function ()
    {
        //Build Configuration XML
        var MappingsXML = "<Mappings>";

        var mappingWidgetXML = this.staticMappingWidget.getConfigurationXML();
        if (mappingWidgetXML === false)
        {
            return false;
        }

        var mappingNodes = parseXML(mappingWidgetXML).selectNodes("Mappings/Mapping");
        var mappingNode;
        for (var i = 0; i < mappingNodes.length; i++)
        {
            mappingNode = mappingNodes[i];
            mappingNode.setAttribute("ActionPropertyCollection", "Parameters");
            MappingsXML += mappingNode.xml;
        }

        mappingWidgetXML = this.dynamicMappingWidget.getConfigurationXML();
        if (mappingWidgetXML === false)
        {
            return false;
        }

        mappingNodes = parseXML(mappingWidgetXML).selectNodes("Mappings/Mapping");
        for (var i = 0; i < mappingNodes.length; i++)
        {
            mappingNode = mappingNodes[i];
            mappingNode.setAttribute("ActionPropertyCollection", "Parameters");
            MappingsXML += mappingNode.xml;
        }

        MappingsXML += "</Mappings>";

        return MappingsXML;
    },

    setConfigurationXml: function (mappings, targetContextContainer)
    {
        if (checkExistsNotEmpty(mappings))
        {
            var mappingsDoc = parseXML(mappings);
            var mappingNodes = mappingsDoc.selectNodes("Mappings/Mapping");

            var mappingNodes = mappingsDoc.selectNodes("//Mapping[./Item[@ItemType='ProcessProperty']]");
            var staticTargetsMappingWidgetDoc = parseXML("<Mappings/>");
            for (var i = 0; i < mappingNodes.length; i++)
            {
                staticTargetsMappingWidgetDoc.documentElement.appendChild(mappingNodes[i].cloneNode(true));
            }
            this.staticMappingWidget.setConfigurationXml(staticTargetsMappingWidgetDoc.xml, targetContextContainer);

            mappingNodes = mappingsDoc.selectNodes("//Mapping[not(./Item[@ItemType='ProcessProperty'])]");
            var dynamicTargetsMappingWidgetDoc = parseXML("<Mappings/>");
            for (var i = 0; i < mappingNodes.length; i++)
            {
                dynamicTargetsMappingWidgetDoc.documentElement.appendChild(mappingNodes[i].cloneNode(true));
            }
            this.dynamicMappingWidget.setConfigurationXml(dynamicTargetsMappingWidgetDoc.xml, targetContextContainer);
        }
    }
};

jQuery.extend(TwoSectionsMappingWidget.prototype, TwoSectionsMappingWidgetProtoType);
