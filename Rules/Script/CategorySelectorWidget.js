var categoryTree;

function RulesWizardCategorySelector()
{

}

RulesWizardCategorySelector.prototype.load = function ()
{
	var _this = this;
	if (_this.forcedClick === false)
	{
		var treeOptions = {
			//element: jQuery('#categoryTree').get(0),
			relativePath: '',
			system: 1,
			dataType: this.dataType,
			loadObjects: true,
			rules: { create: false, rename: false, refresh: true }
		};

		if (checkExistsNotEmpty(this.value))
		{
			treeOptions = jQuery.extend(treeOptions, { persistance: { enabled: true, object: this.value} });
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

RulesWizardCategorySelector.prototype.itemSelected = function(_this,obj) {

	var selectedCategoryTreeNode = obj;

	if (checkExists(selectedCategoryTreeNode) && selectedCategoryTreeNode.objecttype !== '') {
		var dsName = selectedCategoryTreeNode.objectname;
		var val = selectedCategoryTreeNode.objectid;
		var xml = parseXML("<Item ID='" + val + "'><Name>'" + dsName.xmlEncode() + "'</Name></Item>");

		_this.display = dsName;
		_this.data = xml.selectSingleNode("./*")
		_this.value = val;

		SourceCode.Forms.Designers.Rule.onWidgetCompleted(_this);
		popupManager.closeLast();
	}
	else {
		popupManager.showWarning(Resources.CommonPhrases.ValidationSelectObject.format(_this.dataType));
		return;
	}
}


