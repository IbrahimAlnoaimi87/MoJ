var rulesWizardTree;

function RulesWizardTreeSelector()
{

}

RulesWizardTreeSelector.prototype =
{
    getItemsFromPlugIn: function ()
    {
        if (this.forcedClick === false)
        {
            jQuery("#ruleWizardPopup").modalize(true).showBusy(true);
            if (this.isHidden || this.forcedClick) this.showPopup = false;
            this.pluginReturnedId = "".generateGuid() + ".pluginReturned";

            this.boundPluginReturn = this.pluginReturn.bind(this);
            jQuery(document.body).on(this.pluginReturnedId, null, this, this.boundPluginReturn);

            var pluginType = eval(this.pluginName);
            var plugin = new pluginType();
            plugin.dataType = 'target';
            plugin.Settings = this; //TODO it would be better if this could be settings or parameters.
            plugin.pluginReturnedId = this.pluginReturnedId
            with (plugin)
            {
                var pluginMethod = eval(this.pluginMethod).bind(plugin);
                pluginMethod();
            }
        }
    },

    pluginReturn: function (e)
    {
        var _this = e.data;
        var returnedXml = e.detail.xml;
        var items = returnedXml.selectNodes("Items/Item");
        jQuery("#ruleWizardPopup").modalize(false).showBusy(false);

        if (items.length > 0)
        {
            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
            //each time a plugin returns it calls this function.
            if ((typeof _this.pluginReturnedId !== "undefined") && (_this.pluginReturnedId !== null) && (_this.pluginReturnedId !== ""))
            {
                jQuery(document.body).off(_this.pluginReturnedId, null, _this.boundPluginReturn);
            }

            var jq_processTree = jQuery("<div id=\"processTree\" class=\"scroll-wrapper\"><ul class=\"tree collapsed-root\"><li class=\"root\"><a href=\"javascript:;\">Root</a></li></ul></div>");
            var jq_formprocessDiv = jQuery("<div id='formProcessDiv'></div>");
            jq_processTree.appendTo(jq_formprocessDiv);

            var transformer = new XslTransform();
            transformer.importStylesheet(applicationRoot + "Rules/XSLT/TreeSelectorWidget.xslt");
            transformer.addParameter("WorkflowsResourceName", ContextTree_Workflows);
            var transformedXML = parseXML(transformer.transformToText(returnedXml.xml));

            rulesWizardTree = jq_processTree.find(".tree").tree();

            var root = rulesWizardTree.tree("find", "root");

            rulesWizardTree.tree("loadXML", transformedXML, root); // Load Process tree with xml data
            var expanded = false;
            if (checkExists(_this.value))
            {
                var nodeToSelect = rulesWizardTree.tree("find", "metadata", "", "name", _this.value);
                if (nodeToSelect.length > 0)
                {
                    var closestLi = nodeToSelect.closest("ul").closest("li");
                    while (closestLi.length > 0)
                    {
                        rulesWizardTree.tree("expand", closestLi);
                        if (closestLi.is(".root"))
                            break;
                        closestLi = closestLi.closest("ul").closest("li");
                    }
                    expanded = true;
                    rulesWizardTree.tree("select", nodeToSelect);
                }


            }

            rulesWizardTree.tree("option", "select", function () { _this.contextMenuOKEnable(rulesWizardTree.tree("find", "selected"), _this); });

            var buttonArray = [];
            buttonArray[0] = { type: "help", click: function () { HelpHelper.runHelp(7021); } };
            buttonArray[1] = { id: "OKButton", text: "OK", click: function () { _this.contextMenuItemSelected(_this); }.bind(_this), disabled: true };
            buttonArray[2] = { text: "Cancel", click: function () { popupManager.closeLast(); } };

            var doc = jQuery("body");
            var percentageSize = 0.6;
            var popupHeight = Math.max(Math.floor(doc.height() * percentageSize), 350);
            var popuplWidth = Math.max(Math.floor(doc.width() * percentageSize), 250);

            popupManager.showPopup({
                buttons: buttonArray,
                draggable: true,
                headerText: e.data.heading,
                modalize: true,
                content: jq_formprocessDiv[0],
                width: popuplWidth,
                height: popupHeight
            });

            if (!expanded)
            {
                rulesWizardTree.tree("expand", root);
                rulesWizardTree.tree("expand", root.find(">ul>li")); // Expanding Process tree
                if ($chk(_this.selectable) && _this.selectable !== "")
                {
                    $("#OKButton").addClass("disabled");
                }
            }
        }
        else
        {
            popupManager.showNotification(Resources.CommonPhrases.NoItemsToDisplay);
        }
    },

    setValues: function (selectedItem)
    {
        if (!$("#OKButton").hasClass("disabled"))
        {
            this.display = selectedItem.text();
            this.data = selectedItem.metadata().name
            this.value = selectedItem.metadata().name//.replace(/\\/g,"\\\\");

            SourceCode.Forms.Designers.Rule.onWidgetCompleted(this);

            popupManager.closeLast();
        }
    },

    contextMenuItemSelected: function (_this)
    {
        _this.setValues(rulesWizardTree.tree("find", "selected"));
    },

    contextMenuOKEnable: function (selected, _this)
    {
        if ($chk(_this.selectable) && _this.selectable !== "")
        {
            if (selected.metadata().ItemType === _this.selectable)
            {
                $("#OKButton").removeClass("disabled");
            }
            else
            {
                $("#OKButton").addClass("disabled");
            }
        }
    }
}
