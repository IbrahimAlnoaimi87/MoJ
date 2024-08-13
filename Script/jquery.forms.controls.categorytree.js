(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.CategoryTree = {

		_create: function ()
		{
			if (this.element.children("li").length === 0)
			{
				this.element.append("<li class=\"root\"><a href=\"javascript:;\" class=\"loading\">" + Resources.CommonPhrases.LoadingText + "</a></li>");
			}

			this.element.tree({
				expand: this._treeexpand.bind(this),
				dblclick: this._treeDblClick.bind(this)
			});

			var self = this, o = { action: "initcatbrowsertree" };

			if (self.options !== undefined)
			{
				if (self.options.objecttypes !== undefined) o.datatypes = self.options.objecttypes;
				if (self.options.selected !== undefined && self.options.selected.catid !== undefined && self.options.selected.catid > 0) o.catid = self.options.selected.catid;
				if (self.options.selected !== undefined && self.options.selected.objectid !== undefined && self.options.selected.objectid !== "")
				{
					o.guid = self.options.selected.objectid;
					o.objecttype = self.options.selected.objecttype;
					delete o.catid;
				}
			}

			self._url = applicationRoot + "AppStudio/AJAXCall.ashx";

			if (checkExists(self.options.url) && self.options.url !== "")
			{
				self._url = self.options.url;
			}

			$.ajax({
				cache: false,
				data: $.param(o),
				dataType: "xml",
				url: self._url,
				success: self._initTreeData.bind(self),
				type: "POST"
			});

		},

		_initTreeData: function (data, status, xhr)
		{
			if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);
				return;
			}

			var self = this, entry = this.element.children("li:first-child");

			// Applying the details of the root node
			var node = $("nodes > node", data).eq(0);
			entry.children("a").text(node.attr("text")).addClass(node.attr("icon"));

			var clsNms = [node.attr("icon")];
			if (node.attr("haschildren") !== undefined && node.attr("haschildren") === "true") clsNms.push("children");
			if (node.attr("open") !== undefined && node.attr("open") === "true") clsNms.push("open");
			if (node.attr("selected") !== undefined && node.attr("selected") === "true") clsNms.push("selected");

			var mtdt = {};
			var metaDataLength = 0;
			if (node.attr("catid") !== undefined)
			{
				mtdt["catid"] = node.attr("catid");
				metaDataLength++;
			}
			if (node.attr("datatype") !== undefined)
			{
				mtdt["datatype"] = node.attr("datatype");
				metaDataLength++;
			}
			if (node.attr("datatypes") !== undefined)
			{
				mtdt["datatypes"] = node.attr("datatypes");
				metaDataLength++;
			}
			if (node.attr("type") !== undefined)
			{
				mtdt["type"] = node.attr("type");
				metaDataLength++;
			}
			if (node.attr("subtype") !== undefined)
			{
				mtdt["subtype"] = node.attr("subtype");
				metaDataLength++;
			}

			if (metaDataLength > 0)
			{
				entry.attr("data-options", jQuery.toJSON(mtdt));
			}

			entry[0].className = clsNms.join(" ");

			self._treeLoad(node.children("node"), entry);

		},

		_treeLoad: function (nodes, entry)
		{

			var self = this;
			var tree = entry.closest("ul.tree");

			if (nodes.length > 0)
			{

				nodes.each(function ()
				{

					var node = $(this);
					var o = { data: {} };
					o.text = node.attr("text");
					o.icon = node.attr("icon");

					if (node.attr("haschildren") !== undefined) o.children = (node.attr("haschildren") === "true") ? true : false;
					if (node.attr("open") !== undefined) o.open = (o.children && node.attr("open") === "true") ? true : false;
					if (node.attr("selected") !== undefined) o.selected = (node.attr("selected") === "true") ? true : false;
					if (node.attr("visible") !== undefined) o.visible = node.attr("visible");

					if (node.attr("id") !== undefined) o.data.guid = node.attr("id");
					if (node.attr("name") !== undefined) o.data.name = o.name = node.attr("name");
					if (node.attr("description") !== undefined) o.data.description = o.description = node.attr("description");
					if (node.attr("title") !== undefined) o.title = node.attr("title");
					if (node.attr("catid") !== undefined) o.data.catid = node.attr("catid");
					if (node.attr("datatype") !== undefined) o.data.datatype = node.attr("datatype");
					if (node.attr("datatypes") !== undefined) o.data.datatypes = node.attr("datatypes");
					if (node.attr("type") !== undefined) o.data.type = node.attr("type");
					if (node.attr("subtype") !== undefined) o.data.subtype = node.attr("subtype");

					var n = tree.tree("add", entry, o);

					if (node.children("node").length > 0) self._treeLoad(node.children("node"), n);

				});
			}
			else
			{
				if (entry.is("li") && entry.is(".children.open")) entry.removeClass("open").addClass("closed").removeClass("children");
			}

			if (entry.is("li")) entry.removeClass("loading");

		},

		_treeDblClick: function (e, ui)
		{
			var n = ui.node;
			n.children("a").trigger("click");
			if (n.is(".category.children"))
			{
				this.element.tree("toggle", n);
			}		
		},

		_treeexpand: function (e, ui)
		{
			var n = ui.node, m = n.metadata(), $this = this;

			if (n.children("ul").children("li").length === 0)
			{
				var o = { action: "gettreedata" };

				if (typeof m.datatype !== "undefined") o.datatype = m.datatype;
				if (typeof m.datatypes !== "undefined") o.datatypes = m.datatypes;

				if (typeof m.catid !== "undefined") o.catid = m.catid;

				n.addClass("loading");

				$.ajax({
					cache: false,
					data: $.param(o),
					dataType: "xml",
					url: $this._url,
					success: function (data, status, xhr)
					{
						if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
						{
							SourceCode.Forms.ExceptionHandler.handleException(data);
							return;
						}

						$this._treeLoad($("nodes > node", data), n);
					},
					type: "POST"
				});
			}
		},

		value: function ()
		{
			var result = {};

			if (this.element.find(".selected").length > 0)
			{
				var node = this.element.find(".selected"), m = node.metadata();

				if (m.type !== undefined && m.type !== "category")
				{
					result.catid = node.parent("ul").parent("li").metadata().catid;
					result.catname = node.parent("ul").parent("li").children("a").text();
					result.objectname = m.text;
					result.objectSystemName = m.name;
				}
				else
				{
					result.catid = m.catid;
					result.catname = node.children("a").text();
				}

				var delimeter = "\\";

				var path = [];

				while (node.parent().is(":not(.tree)"))
				{
					path.push(node.children("a").text());
					node = node.parent("ul").parent("li");
				}

				path.push(node.children("a").text());

				path = path.reverse();

				if (m.type !== undefined && m.type !== "category") result.objecttype = m.type;
				if (m.guid !== undefined) result.objectid = m.guid;

				result.fullpath = path.join(delimeter);

				if (m.type !== undefined && m.type !== "category")
				{
					path.pop();
					path = path.reverse();
					path.pop();
					path = path.reverse();
					result.path = path.join(delimeter);
				}
				else
				{
					path = path.reverse();
					path.pop();
					path = path.reverse();
					result.path = path.join(delimeter);
				}

			}

			return result;
		}

	};

	if (typeof SCCategoryTree === "undefined") SCCategoryTree = SourceCode.Forms.Controls.CategoryTree;

	$.widget("ui.categorytree", SourceCode.Forms.Controls.CategoryTree);

})(jQuery);
