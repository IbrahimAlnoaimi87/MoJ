
//it gets its targetXml data from the specified plugin in the utils item xml format.
//it then displays the xml and saves a result.
function OrderWidget()
{
}
var OrderWidgetProtoType =
{
    initialize: function (parentElement)
    {
        this._parentElement = parentElement;

        if (this.targetXml)
        {
            this._transformXml();
            var returnItems = this.targetXml.selectNodes("Items/Item[@ItemType='MethodReturnedProperty']");
            if (returnItems.length > 0)
            {
                this._populateToolbar();
                this._buildUI();
            }
            else if (this.wizard && this.wizardStep)
            {
                this.wizard.wizard("hide", "step", this.wizardStep);
            }
        }
    },

    _transformXml: function ()
    {
        var transformer = new XslTransform();
        transformer.importStylesheet(applicationRoot + "Rules/XSLT/FilterOrder.xslt");
        if ($chk(this.ResultName))
        {
            transformer.addParameter("ResultName", this.ResultName);
        }
        this.targetXml = parseXML(transformer.transformToText(this.targetXml));
    },

    _buildUI: function ()
    {
        var _this = this;
        var data =
        {
        }
        var options =
        {
            url: applicationRoot + "Rules/Order.aspx",
            type: 'GET',
            cache: false,
            data: data,
            dataType: "text",
            async: false,
            success: function (responseText, textStatus, XMLHttpRequest)
            {
                _this._buildUIAjaxSuccess.call(_this, responseText, textStatus, XMLHttpRequest);
            }
        }
        jQuery.ajax(options);
    },

    _buildUIAjaxSuccess: function (responseText, textStatus, XMLHttpRequest)
    {
        var response = responseText;
        this._parentElement.append(response);

        this._parentElement.find(".pane-container").panecontainer();
        this._parentElement.find(".panel").panel();
        var gridBehaviour =
        {
            rowselect: this._rowSelected.bind(this)
        }
        this._parentElement.find(".grid").grid().grid("option", gridBehaviour);

        this._populateDropDowns();

        var tb = this.toolbar;
        tb.toolbar();
        var toolbarItems = tb.toolbar("fetch", "buttons");
        jQuery(toolbarItems[0]).on("click", this._addOrderRow.bind(this));
        jQuery(toolbarItems[1]).on("click", this._removeOrderRow.bind(this));
        jQuery(toolbarItems[2]).on("click", this._removeAllOrderRows.bind(this));
        jQuery(toolbarItems[3]).on("click", this._moveUp.bind(this));
        jQuery(toolbarItems[4]).on("click", this._moveDown.bind(this));

        this.initCallBack();
    },

    updated: function ()
    {
        this._parentElement.find(".grid").grid("syncWidths");
    },

    dispose: function ()
    {
    },

    _populateToolbar: function ()
    {
        this.toolbar = this._parentElement.closest(".wrapper.target-context-canvas").find(".toolbar")

        if (this.toolbar.length === 0)
        {
            var toolbarWrapper = jQuery("<div class=\"toolbars single\"></div>")
            this.toolbar = jQuery(SourceCode.Forms.Controls.Toolbar.html());
            this.toolbar.toolbar();
            this.toolbar.toolbar("add", "button", { id: "addButton_OrderWidget", icon: "add", text: Resources.CommonActions.AddText, description: Resources.Filtering.AddOrderText, disabled: false });
            this.toolbar.toolbar("add", "button", { id: "clearButton_OrderWidget", icon: "delete", text: Resources.CommonActions.RemoveText, description: Resources.Filtering.RemoveOrderText, disabled: true });
            this.toolbar.toolbar("add", "button", { id: "clearAllButton_OrderWidget", icon: "delete-all", text: Resources.CommonActions.RemoveAllText, description: Resources.Filtering.RemoveAllOrderText, disabled: true });
            this.toolbar.toolbar("add", "button", { id: "upButton_OrderWidget", icon: "move-up", text: Resources.CommonActions.MoveUpText, description: Resources.Filtering.MoveUpOrderText, disabled: true });
            this.toolbar.toolbar("add", "button", { id: "downButton_OrderWidget", icon: "move-down", text: Resources.CommonActions.MoveDownText, description: Resources.Filtering.MoveDownOrderText, disabled: true });

            this.toolbar.find('.toolbar-button').each(function (i) {

                switch ($(this).attr('id')) {
                    case 'addButton_OrderWidget':
                        $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-add" /></svg>');
                        break;
                    case 'clearButton_OrderWidget':
                        $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete" /></svg>');
                        break;
                    case 'clearAllButton_OrderWidget':
                        $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete-all" /></svg>');
                        break;
                    case 'upButton_OrderWidget':
                        $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-move-up" /></svg>');
                        break;
                    case 'downButton_OrderWidget':
                        $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-move-down" /></svg>');
                        break;
                }

                $(this).addClass('style-aware');

            });

            toolbarWrapper.append(this.toolbar);
            this._parentElement.closest(".pane-container").children(".pane:first-child").append(toolbarWrapper);
        }

        this.toolbar.toolbar();
    },

    initCallBack: function ()
    {
        //This method should be overrided by the configuration wizard (at runtime)
    },

    setConfigurationXml: function (configurationXml, targetContextContainer)
    {
        if (configurationXml)
        {
            var savedXmlDoc = parseXML(configurationXml);
            var savedMapping = savedXmlDoc.selectSingleNode("/Mappings/Mapping/Sorters");
            if (savedMapping)
            {
                var grid = this._parentElement.find(".grid").grid();
                var parentNode = savedMapping;
                var nodes = parentNode.childNodes;
                for (var i = 0; i < nodes.length; i++)
                {
                    var column = nodes[i].getAttribute("SourceID");
                    var order = nodes[i].getAttribute("Direction");
                    grid.grid("add", "edit-template", [column, order]);
                }
                if (nodes.length > 0)
                {
                    $("#clearAllButton_OrderWidget").removeClass("disabled");
                }

                //hack for chrome and ie
                if (SourceCode.Forms.Browser.webkit || SourceCode.Forms.Browser.msie)
                {
                    setTimeout(
                        function ()
                        {
                            this._parentElement.find(".grid").grid("synccolumns");
                            if (SourceCode.Forms.Browser.msie)
                            {
                                this._parentElement.find(".grid").hide();
                                setTimeout(
                                    function ()
                                    {
                                        this._parentElement.find(".grid").show();
                                    }.bind(this), 0)
                            }
                        }.bind(this), 0);
                }
                //end hack for chrome and ie
            }
        }
    },

    getConfigurationXML: function ()
    {
        var configurationXML = "<Mappings><Mapping Type=\"{0}\" ActionPropertyCollection=\"Properties\">{1}</Mapping></Mappings>";
        var mappingXml = "<Sorters>{0}</Sorters>";
        var grid = this._parentElement.find(".grid").grid();
        var gridRows = grid.grid('fetch', 'rows');

        var rowLength = gridRows.length;
        var fitlerRowsXML = "";
        for (var i = 0; i < rowLength; i++)
        {
            var currentRow = $(gridRows[i]);
            var fieldOption = currentRow.find(".input-control.sort-column option:selected");
            var column = currentRow.find(".input-control.sort-column").val();
            var order = currentRow.find(".input-control.sort-order").val();
            fitlerRowsXML += "<Sorter SourceType=\"{0}\" SourceID=\"{1}\" SourceName=\"{1}\" SourceDisplayName=\"{3}\" Direction=\"{2}\" />".format(fieldOption.data("SourceType"), column.xmlEncode(), order, fieldOption.data("DisplayName").xmlEncode());
        }

        if (rowLength === 0)
        {
            mappingXml = "";
        }
        else
        {
            mappingXml = mappingXml.format(fitlerRowsXML);
            if (checkExists(SourceCode) &&
                checkExists(SourceCode.Forms) &&
                checkExists(SourceCode.Forms.Designers) &&
                checkExists(SourceCode.Forms.Designers.Rule) &&
                checkExists(SourceCode.Forms.Designers.Rule.EventHelper) &&
                checkExists(SourceCode.Forms.Designers.Rule.EventHelper.checkIfControlFilterIsValid))
            {

                var mappingsXml = parseXML(mappingXml);
                var validationResult = mappingsXml.selectNodes("//Sorter[@SourceType='undefined' or @SourceID='null']").length === 0;
                if (validationResult === true && checkExists(this.Settings.viewControlID))
                {
                    validationResult = SourceCode.Forms.Designers.Rule.EventHelper.checkIfControlOrderIsValid(mappingsXml.documentElement, this.Settings.viewControlID);
                }

                if (validationResult === false)
                {
                    popupManager.showError(Resources.Filtering.InvalidOrder, Resources.Filtering.InvalidOrder);
                    return false;
                }
            }
        }

        configurationXML = configurationXML.format(this.ResultName, mappingXml);

        return configurationXML;
    },

    _populateDropDowns: function ()
    {
        var returnItems = this.targetXml.selectNodes("Items/Item[@ItemType='MethodReturnedProperty']");
        //if there are no return properties then the method is not a list method and filter and order doesn't apply
        if (returnItems.length === 0)
        {
            if (this.wizard && this.wizardStep)
                this.wizard.wizard("hide", "step", this.wizardStep);

            return;
        }
        var items = this.targetXml.selectNodes("Items/Item[@ItemType='ViewField']");

        //if there are no fields use the return properties
        if (items.length === 0)
        {
            items = returnItems;
        }

        var dropdown = $("#sortColumnDropDown");

        for (var i = 0; i < items.length; i++)
        {
            var val = (items[i].getAttribute("Guid")) ? items[i].getAttribute("Guid") : items[i].selectSingleNode("Name").text;
            var text = items[i].selectSingleNode("DisplayName").text;
            var toolTip = items[i].selectSingleNode("ToolTip").text;
            var icon = items[i].getAttribute("Icon");
            var option = $('<option></option>').val(val).html(text.htmlEncode()).addClass(icon).attr("title", toolTip);
            dropdown.append(option);

            var sourceType = items[i].getAttribute("ItemType");
            if (sourceType)
            {
                switch (sourceType.toLowerCase())
                {
                    case "methodreturnedproperty":
                        sourceType = "ObjectProperty"
                        break;
                }
            }

            option.data("SourceType", sourceType);
            option.data("DisplayName", text);
            option.data("SourceID", val);

            var datatype = "text";
            var subType = items[i].getAttribute("SubType");
            if (subType)
            {
                switch (subType.toLowerCase())
                {
                    case "autonumber":
                    case "number":
                    case "decimal":
                        datatype = "number";
                        break;
                    case "datetime":
                        datatype = "datetime";
                        break;
                    case "yesno":
                    case "boolean":
                        datatype = "boolean";
                        break;
                    case "guid":
                    case "autoguid":
                        datatype = "guid";
                        break;
                }
            }

            option.data("DataType", datatype);
        }
        if (dropdown.isWidget("dropdown"))
        {
            dropdown.dropdown("refresh");
        }
    },

    _addOrderRow: function ()
    {
        var grid = this._parentElement.find(".grid");
        grid.grid("add", "edit-template");
        $("#clearAllButton_OrderWidget").removeClass("disabled");
        var selectedRows = this._parentElement.find(".grid").grid('fetch', 'selected-rows');
        if (selectedRows.length > 0)
            this._rowSelected(selectedRows[0]);
    },

    _rowSelected: function (selectedRow)
    {
        $("#clearButton_OrderWidget").removeClass("disabled");
        $("#clearAllButton_OrderWidget").removeClass("disabled");

        if ($(selectedRow).prev("tr").length > 0)
            $("#upButton_OrderWidget").removeClass("disabled");
        else
            $("#upButton_OrderWidget").addClass("disabled");

        if ($(selectedRow).next("tr").length > 0)
            $("#downButton_OrderWidget").removeClass("disabled");
        else
            $("#downButton_OrderWidget").addClass("disabled");
    },

    _rowDeSelected: function ()
    {
        $("#clearButton_OrderWidget").addClass("disabled");
        $("#upButton_OrderWidget").addClass("disabled");
        $("#downButton_OrderWidget").addClass("disabled");
    },

    _removeOrderRow: function ()
    {
        this._parentElement.find(".grid").grid('remove', 'selected-rows');
        this._rowDeSelected();
    },

    _removeAllOrderRows: function ()
    {
        this._parentElement.find(".grid").grid("clear");
        this._rowDeSelected();
        $("#clearAllButton_OrderWidget").addClass("disabled");
    },

    _moveUp: function ()
    {
        var selectedRows = this._parentElement.find(".grid").grid('fetch', 'selected-rows');
        var prev = selectedRows.prev();
        selectedRows.after(prev);
        if (selectedRows.length > 0)
            this._rowSelected(selectedRows[0]);
    },

    _moveDown: function ()
    {
        var selectedRows = this._parentElement.find(".grid").grid('fetch', 'selected-rows');
        var next = selectedRows.next();
        selectedRows.before(next);
        if (selectedRows.length > 0)
            this._rowSelected(selectedRows[0]);
    }

}

jQuery.extend(OrderWidget.prototype, OrderWidgetProtoType);
