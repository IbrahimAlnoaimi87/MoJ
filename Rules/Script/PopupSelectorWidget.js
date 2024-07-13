var categoryTree;

function RulesWizardPopupSelector()
{

}

RulesWizardPopupSelector.prototype.load = function ()
{
    var _this = this;
    if (_this.forcedClick === false)
    {
        var treeOptions =
        {
            //element: jQuery('#categoryTree').get(0),
            relativePath: '',
            system: 1,
            dataType: this.dataType,
            loadObjects: true,
            rules: { create: false, rename: false, refresh: true }
        };

        if (this.value !== undefined && this.value !== '')
        {
            treeOptions = jQuery.extend(treeOptions, { persistance: { enabled: true, object: this.value } });
        }

        with (_this)
        {
            categoryTree = jQuery.popupManager.showCategoryBrowserPopup({
                onSelect: function (obj)
                {
                    _this.itemSelected(_this, obj);
                },
                tree: treeOptions
            });
        }
    }
}

RulesWizardPopupSelector.prototype.itemSelected = function (_this, obj)
{
    var selectedCategoryTreeNode = obj;

    if (selectedCategoryTreeNode !== null && checkExistsNotEmpty(selectedCategoryTreeNode.objecttype))
    {
        var dsName = selectedCategoryTreeNode.objectname;
        var systemName = selectedCategoryTreeNode.objectSystemName;
        var val = selectedCategoryTreeNode.objectid;
        var setValue = true;
        var jq_control = jQuery("#" + _this.controlID);

        if ((val !== _this.value) && (_this.value === null))
        {
            // New selection
            var subformID = String.generateGuid();
            //TODO: TD 0024 - rebuild with XML API
            var xml = parseXML("<Item ID='" + val + "' SubFormID='" + subformID + "'><Display>"
                + dsName.xmlEncode() + "</Display><Name>'" + systemName.xmlEncode() + "'</Name></Item>");

            _this.display = dsName;
            _this.data = xml.selectSingleNode("./*");
            _this.value = val;
        }
        else if ((val !== _this.value) && (_this.value !== null))
        {
            // Edit selection with new value
            var orgSubFormID;
            var subformID = String.generateGuid();
            var dependantsExists = false;
            var actionDependencies = null;
            var rulesUIDependancyDisplayDetails = null;
            var currentActionNotifierContent = null;
            var jq_li = jq_control.closest("li");

            if (jq_control.data('data'))
            {
                if (jq_control.data('data').getAttribute("SubFormID") !== "00000000-0000-0000-0000-000000000000")
                {
                    orgSubFormID = jq_control.data('data').getAttribute("SubFormID");

                    var dependencyData =
                    {
                        xmlDef: SourceCode.Forms.Designers.Rule.tmpContextDefinition
                    };
                    var ruleData =
                    {
                        itemId: jq_li.data("ID"),
                        itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                    };

                    rulesUIDependancyDisplayDetails = SourceCode.Forms.Designers.Rule.getRulesUIDependancyDisplayDetails(orgSubFormID, jq_li[0].getAttribute("ID"));

                    actionDependencies = SourceCode.Forms.Designers.getDependencies(ruleData, dependencyData);
                    dependantsExists = (actionDependencies.length > 0) || (rulesUIDependancyDisplayDetails.length > 0);
                }
            }

            if (dependantsExists)
            {
                setValue = false;
                //For subform/view dependencies, Keep or Remove options should not be available on notifier
                var notifierOptions =
                {
                    references: actionDependencies,
                    initialDisplayDetails: rulesUIDependancyDisplayDetails,
                    deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.Action,
                    removeObjFn: function (notifierContext)
                    {
                        SourceCode.Forms.Designers.Rule._removeDependentItems(orgSubFormID, jq_li);
                        //TODO: TD 0024 - rebuild with XML API
                        var xml = parseXML("<Item ID='" + val + "' SubFormID='" + subformID + "'><Display>"
                            + dsName.xmlEncode() + "</Display><Name>'" + systemName.xmlEncode() + "'</Name></Item>");

                        _this.display = dsName;
                        _this.data = xml.selectSingleNode("./*");
                        _this.value = val;

                        SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);
                    },
                    showSimpleNotifier: true,
                    removeConfirmationMessage: Resources.RuleDesigner.lrRemoveSubFormDependenciesMsg
                };
                SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
            }
            else
            {
                //TODO: TD 0024 - rebuild with XML API
                var xml = parseXML("<Item ID='" + val + "' SubFormID='" + subformID + "'><Display>"
                            + dsName.xmlEncode() + "</Display><Name>'" + systemName.xmlEncode() + "'</Name></Item>");

                _this.display = dsName;
                _this.data = xml.selectSingleNode("./*");
                _this.value = val;
            }
        }
        else
        {
            // Same selection
            setValue = false;
        }

        if (setValue === true)
        {
            SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);
        }
    }
    else
    {
        popupManager.showWarning(Resources.CommonPhrases.ValidationSelectObject.format(_this.dataType));
        return;
    }
}


