(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};
	/*
	Script: SourceCode.Forms.GenericMapping.js
	Contains the GenericMappings class

	Dependancies:
	- <SourceCode.Forms.Core.js>
	- <SourceCode.Forms.Array.js>
	- <SourceCode.Forms.String.js>
	- <SourceCode.Forms.Function.js>
	- <native.Forms.number.js>
	- <SourceCode.Forms.Class.js>
	- <SourceCode.Forms.Class.Extras.js>
	- <SourceCode.Forms.Element.js>
	- <SourceCode.Forms.Element.Dimensions.js>
	- <SourceCode.Forms.XML.js>
	*/

	/*
	Class: GenericMapping
  
	
	Syntax:

	
	Arguments:
	options - an object with options names as keys. See options below.
	  
	Options:      
	container         - (string/Element) the div container to which the generic mapping ui will be added. 
	It has to be on the HTML page                       
	contentId         - (string) the id that should be applied to the content div - this div may not exist on the page
	contextXml        - (string/xml)the xml that will be rendered in the context tree.        
	buttonArray       - (array) the buttons that will be displayed on the popup 	    
	*/
	SourceCode.Forms.Widget.GenericMappings = function (options)
	{
		this.initialize(options);
	}
	SourceCode.Forms.Widget.GenericMappingsPrototype = {

		options: {
			container: "",
			contentTitle: "",
			contentId: "",
			contextXml: "",
			contextAjaxXml: "",
			droppables: [],
			contextTreeTitle: "",
			isTreeRightAligned: false
		},

		initialize: function (options)
		{
			this.options = $.extend(
			{}, this.options, options);
			//TODO add all the divs to the content div and load the category and other tree
			this.container = ($type(this.options.container) === 'string') ? jQuery("#" + this.options.container) : (this.options.container.jquery) ? this.options.container : jQuery("#" + this.options.container.id);
			this.contentId = (this.options.contentId !== "") ? this.options.contentId : this.container[0].id + "_contentContainer";
			this.contentBorder = null;
			this.contextAjaxXml = (this.options.contextAjaxXml) ? parseXML(this.options.contextAjaxXml) : null;
			this.catTree = null;
			this.contextTree = null;
			this.contentContainer = null;
			this.dragItem = null;
			this.dropItem = null;
			this.overflown = [];
			//Check if empty string nodes
			if (typeof (this.options.contextXml) == "string" && this.options.contextXml.length == 0)
			{
				this.options.contextXml = "<nodes/>";
			}
			this.options.contextXml = ($type(this.options.contextXml) === 'string') ? parseXML(this.options.contextXml) : this.options.contextXml;
			if (!this.options.contextTreeTitle)
			{
				this.options.contextTreeTitle = Resources.Filtering.FilterWidgetContextHeading;
			}
			this._load();
		},

		_load: function ()
		{
			this.treeBorder = jQuery("<div id='tabControl_" + this.container[0].id + "' class='mapping-tree-section'></div>");
			this.contentBorder = jQuery("<div class='mapping-content-section'></div>");

			if (this.options.isTreeRightAligned)
			{
				this.treeBorder.addClass("rightAlign");
				this.contentBorder.addClass("rightAlign");
			}
			this.container.append(this.treeBorder);
			this.container.append(this.contentBorder);

			var tabContentClass = "mapping-notab-content-section";
			var contextTreeContainer = jQuery("<div id=\"" + this.container[0].id + "_contextTreeContainer\"><ul class=\"tree collapsed-root\"><li class='root open'><a></a></li></ul></div>");
			var catTreeContainer = jQuery("<div id='" + this.container[0].id + "_catTreeContainer' class='mapping-tab-other-tree-section'></div>");
			var tabContent = jQuery("<div id='" + this.container[0].id + "_contextTreePanel" + "'></div>");;
			this.treeBorder.append(tabContent);
			tabContent.panel(
			{
				"fullsize": true,
				"header": this.options.contextTreeTitle,
				"scrolling": true
			})
			this.treeBorder.addClass("notab");
			contextTreeContainer.addClass("notab");

			tabContent.append(contextTreeContainer);
			tabContent.append(catTreeContainer)
			catTreeContainer[0].style.display = "none";
			
			this.contextTree = contextTreeContainer.children(".tree").tree();
			var nodes = $("nodes > node", this.options.contextXml);
			nodes.each(function ()
			{
				this.setAttribute("open", true);
			});

			if (this.options.contextXml.xml)
			{
				this.contextTree.tree("loadXML", this.options.contextXml);
			}

			var contentEl = jQuery("<div id='" + this.contentId + "'></div>");
			this.contentBorder.append(contentEl);
			contentEl.panel(
			{
				"fullsize": true,
				"header": this.options.contentTitle,
				"scrolling": true
			});
			this.overflown[0] = contentEl;
			this.contentContainer = contentEl;
			this.dropItem = new SourceCode.Forms.Widget.GenericMappingsDropItem(
			{
				droppables: this.options.droppables
			}) // element: this.dragItem
			this._setupDraggable();
		},

		popup: function (popupId, buttonArray, title, onClose, closeWith, width, height)
		{
			popupManager.showPopup(
			{
				id: popupId,
				buttons: buttonArray,
				headerText: title,
				info: "",
				content: this.container[0],
				width: width,
				height: height,
				onClose: onClose,
				closeWith: closeWith
			});
		},

		addDroppables: function (droppables)
		{
			this.dropItem.addDroppables(droppables);
		},

		//called when dragging starts
		_setupDraggable: function (e)
		{
			this.dropItem.setupDraggable(this.contextTree);
		},

		remove: function ()
		{
			this.contentBorder.remove();
			this.treeBorder.remove();
		},

		setContextXml: function (contextXml)
		{
			this.options.contextXml = contextXml;
			this.contextTree.root.clear();
			this.contextTree.load(
			{
				xml: this.options.contextXml
			});
		}
	};
	$.extend(SourceCode.Forms.Widget.GenericMappings.prototype, SourceCode.Forms.Widget.GenericMappingsPrototype);

	SourceCode.Forms.Widget.GenericMappingsDropItem = function (options)
	{
		this.initialize(options);
	};
	SourceCode.Forms.Widget.GenericMappingsDropItemPrototype = {

		options: {
			droppables: []
		},

		initialize: function (options)
		{
			this.options = $.extend(
			{}, this.options, options);
			if (this.options.droppables && this.options.droppables.length > 0)
			{
				this.addDroppables(this.options.droppables);
			}
			this.tree = null;
			this.value = null;
			this.display = null;
			this.tooltip = null;
			this.id = null;
			this.icon = null;
			this.nodeText = null;
		},

		addDroppables: function (droppables)
		{
			this.droppables = droppables;
			jQuery(this.droppables).droppable(
			{
				accept: '.ui-draggable',
				drop: this.dropElement.bind(this)
			});
		},

		setNode: function (ui)
		{

			var n = ui;
			if (ui.node) n = ui.node;
			var m = n.metadata(),
				c = n.children("a").eq(0);
			this.id = m.id;

			this.value = (m.name !== null && m.name !== "") ? m.name : m.id;

			var currentNode = n;
			var displayText = "";
			while (!currentNode.hasClass("tree"))
			{
				var p = currentNode.parent()
				if (!(currentNode.parent().parent().hasClass("tree") && currentNode.parent().parent().children().length === 1))
				{
					var newText = currentNode.children("a").text();
					if (newText !== "")
					{
						if (displayText === "")
						{
							displayText = newText;
						}
						else
						{
							displayText = newText + " - " + displayText;
						}
					}
				}
				currentNode = p;
			}
			if (displayText === "") displayText = c.text();
			this.display = c.text();
			this.tooltip = displayText;
			this.icon = c[0].className;
			this.nodeText = c.text();

		},

		setupDraggable: function (treeControl)
		{
			this.tree = jQuery(treeControl);
			jQuery(this.droppables).droppable(
			{
				accept: '.ui-draggable:not(not-draggable)',
				drop: this.dropElement.bind(this)
			});

			var draggableOptions =
			{
				appendTo: jQuery(document.body),
				cursorAt: { left: -5, top: -5 },
				delay: 0,
				distance: 2,
				helper: this.getDragElement.bind(this)
			}

			this.tree.find("li").each(function (index)
			{
				var jqThis = jQuery(this);
				if (jqThis.find("ul").length === 0)
				{
					jqThis.children("a").draggable(draggableOptions);
				}
			});
		},

		dropElement: function (e, ui)
		{
			this.tree.draggable("disable");
			jQuery(e.target).trigger("dropDragElement", [this.clone(), {
				left: e.clientX,
				top: e.clientY
			}]);
		},

		getDragElement: function (e)
		{
			this.setNode(jQuery(e.target).parent());
			return jQuery("<div class='tree'><li class='" + this.icon + " mapping-tab-drag-item'><a class='mapping-tab-drag-item-a'>" + this.nodeText + "</a></li></div>");
		},

		clone: function ()
		{
			var newDragItem = new SourceCode.Forms.Widget.GenericMappingsDropItem(
			{});
			newDragItem.tree = this.tree;
			newDragItem.value = this.value;
			newDragItem.display = this.display;
			newDragItem.tooltip = this.tooltip;
			newDragItem.id = this.id;
			newDragItem.icon = this.icon;
			return newDragItem;
		}
	}

	$.extend(SourceCode.Forms.Widget.GenericMappingsDropItem.prototype, SourceCode.Forms.Widget.GenericMappingsDropItemPrototype);

})(jQuery);
