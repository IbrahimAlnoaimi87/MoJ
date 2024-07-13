function ActivityMappingWidget()
{
}

var ActivityMappingWidgetProtoType =
{
	initialize: function (parentElement)
	{
		this.dropElements = [];
		var element = jQuery("<div class='tree'></div>");
		parentElement.append(element);

		var targetHeadingText = Resources.RuleDesigner.MappingTargetHeading;
		if (this.TargetHeading) targetHeadingText = this.TargetHeading;

		var mainPopupHeadingText = this._buildHeadingText(this.controlID);
		$("#ActivityMappingWidgetDialog").find(".popup-header-text").text(mainPopupHeadingText);

		element.panel({ header: targetHeadingText, fullsize: true, toolbars: 0, scrolling: true });

		var mainList = jQuery("<ul class='target-rule'></ul>");
		element.append(mainList);

		this.currentParentList = mainList;
		this._transformXml();
		if (checkExists(this.targetXml))
		{
			var dropNodes = this.targetXml.selectNodes(this.Settings.itemsPath);
			var dropNodesLength = dropNodes.length;
			if (dropNodesLength > 0)
			{
				for (var d = 0; d < dropNodesLength; d++) {
					var dropItem = dropNodes[d];
					this.addDropRow(dropItem, true);
				}

				this.currentParentList.find("li").last().addClass("dropLabelLast");
			}
			else
			{
				element.text(Resources.RuleDesigner.NoItemsToDisplayActivityNotFound);
				if (checkExists(this.wizard))
				{
					this.wizard.wizard("disable", "step", this.wizard.wizard("find", "step", "last").index());
				}
				else if (checkExists(this.basicTargetContextCanvas))
				{
					var dialog = this.basicTargetContextCanvas.closest(".popup");

					if (dialog.length > 0)
					{
                        dialog.find(".popup-footer .button.help + .button").addClass("disabled").off("click");
					}
				}
			}
		}
	},

	_buildHeadingText: function (controlID)
	{
		var $li = $("#" + controlID).closest("li");
		var $clonedLi = $li.clone(true);

		$clonedLi.find("#" + controlID).remove();
		return String.properCase($clonedLi.text());
	},

	initCallBack: null
};

jQuery.extend(ActivityMappingWidget.prototype, BasicMappingWidget.prototype, ActivityMappingWidgetProtoType);
