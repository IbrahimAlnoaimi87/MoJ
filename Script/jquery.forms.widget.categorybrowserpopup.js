(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};
	SourceCode.Forms.Widget.CategoryBrowserPopup =
	{

		options: {
			width: 256,
			height: 384,
			tree: { dataType: "" },
			onSelect: null,
			draggable: true,
			resizable: true
		},

		_create: function (options)
		{
			if (typeof this.options.headerText === "undefined" || this.options.headerText === "")
			{
				if (this.options.tree.dataType === "")
				{
					this.options.headerText = Resources.Categories.SelectCategoryText;
				}
				else
				{
					var objName = this.options.tree.dataType;

					switch (this.options.tree.dataType.toUpperCase())
					{
						case "SMARTOBJECT":
							objName = Resources.ObjectNames.SmartObjectIndefiniteSingular;
							break;
						case "VIEW":
							objName = Resources.ObjectNames.SmartViewIndefiniteSingular;
							break;
						case "FORM":
							objName = Resources.ObjectNames.SmartFormIndefiniteSingular;
							break;
						case "WORKFLOW":
							objName = Resources.ObjectNames.WorkflowProcessIndefiniteSingular;
							break;
					}

					this.options.headerText = Resources.Categories.SelectSpecificItem.format(objName);
				}
			}
			if (this.options.buttons === undefined || this.options.buttons.length === 0)
			{
				this.options.buttons =
				[
					{ type: "help", click: function () { HelpHelper.runHelp(7001); } },
					{ text: Resources.WizardButtons.OKButtonText, click: this.getSelectedTreeObject.bind(this) },
					{ id: "CatPopupCloseBtn", text: Resources.WizardButtons.CancelButtonText }
				];
				this.options.closeWith = "CatPopupCloseBtn";
			}

			// HTML content for the popup
			this.options.content = "<div class=\"panel full without-header without-toolbar without-footer\"><div class=\"panel-body\">"
				+ "<div class=\"panel-body-t\"><div class=\"panel-body-t-l\"></div><div class=\"panel-body-t-c\"></div>"
				+ "<div class=\"panel-body-t-r\"></div></div><div class=\"panel-body-m\"><div class=\"panel-body-m-l\">"
				+ "</div><div class=\"panel-body-m-c\"><div class=\"scroll-wrapper\">"
				+ "<ul class=\"tree\"><li class=\"root children category\"><a href=\"javascript:;\">"
				+ Resources.CommonPhrases.LoadingWaitText.htmlEncode() + "</a></li></ul>"
				+ "</div></div><div class=\"panel-body-m-r\"></div></div><div class=\"panel-body-b\">"
				+ "<div class=\"panel-body-b-l\"></div><div class=\"panel-body-b-c\">"
				+ "</div><div class=\"panel-body-b-r\"></div></div></div></div>";

			$.ui.popupwindow.prototype._create.apply(this, arguments);

			var treeOptions = {};

			if (this.options.tree.dataType !== undefined) treeOptions.objecttypes = this.options.tree.dataType.toLowerCase();
			if (this.options.tree.persistance !== undefined && this.options.tree.persistance.enabled)
			{
				treeOptions.selected = {};
				if (parseInt(this.options.tree.persistance.vcategory) > 0) treeOptions.selected.catid = this.options.tree.persistance.vcategory;
				if (this.options.tree.persistance.object !== undefined && this.options.tree.persistance.object !== "")
				{
					treeOptions.selected.objectid = this.options.tree.persistance.object;
					treeOptions.selected.objecttype = treeOptions.objecttypes.split(",")[0];
				}
			}

			if (checkExists(this.options.tree.url) && this.options.tree.url !== "")
			{
				treeOptions.url = this.options.tree.url;
			}

			this.categorytree = $(this.controls.body).find(".tree").categorytree(treeOptions);
		},

		getSelectedTreeObject: function ()
		{
			var selectedNode = this.categorytree.categorytree("value");

			if (!$.isEmptyObject(selectedNode))
			{
				/*
				var obj = {
				id: selectedNode.objectid,
				name: selectedNode.objectname,
				displayName: selectedNode.objectname,
				type: selectedNode.objecttype,
				dataType: selectedNode.objecttype,
				path: selectedNode.path,
				displayPath: selectedNode.fullpath
				}
				*/

				if (this.options.onSelect)
					this.options.onSelect(selectedNode);
				//this.fireEvent("onSelect", [obj]);

				if ((selectedNode.objecttype !== undefined && this.options.tree.dataType !== undefined) && selectedNode.objecttype.toLowerCase() === this.options.tree.dataType.toLowerCase())
					this.close();
			}
		}
	}

	$.widget("ui.categorybrowserpopup", $.ui.popupwindow, SourceCode.Forms.Widget.CategoryBrowserPopup);

})(jQuery);
