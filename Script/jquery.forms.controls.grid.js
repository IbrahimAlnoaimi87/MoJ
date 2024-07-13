/* Sample implementation:

$("selector").grid({
    
id: "mygrid", // optional
header: "My Grid Header", // optional
toolbars: 2, // optional
footer: true, //optional
        
dragcolumns: true, // optional
customcolumns: true, // optional - TODO
clientsorting: false, // optional - defaults to true
disablemodulus: false, // optional
showrownumbers: false, // optional - TODO
        
multiline: true, // optional - defaults to true
multiselect: false, // optional - defaults to false
singleEventOnMultiSelect: false // optional -  Only triggers one rowselect/rowdeselect when multiple selections are made  
                //- defaults to false
    
actionrow: false, // optional - defaults to false
actionrowclick: null, // optional - function to call when the action row is clicked
commitrowwithkey: null, // optional - function to call when the row is commited with keyboard
    
resources: {
emptygrid: "No items to display",
page: "Page ",
pagecount: " of {0}",
actionrow: "Add"
},
        
columns: [
{ display: "First Column", name: "col1", width: 80, sortable: true, align: "center", datatype: "text" },
{ display: "Second Column", name: "col2", width: "auto", sortable: false, align: "left", datatype: "text", hidden: true },
{ display: "Third Column", name: "col3", width: 180, sortable: true, align: "right", datatype: "number", modulus: true }
], // optional, options can be read from AJAX response
        
url: "AJAXCall.ashx", // optional
urldata: {}, // optional
datatype: "xml", // optional, defaults to xml, accepted values xml/json/table
paging: true, // optional, will generate paging controls at the bottom of the grid, options can be read from AJAX response
page: 1, // optional, options can be read from AJAX response
pagerows: 20, // optional, options can be read from AJAX response
overrideserver: false, // optional
autopopulate: true, // optional - defaults to true
        
rowselect: null, // optional - function to call when a row has been selected
rowunselect: null, // optional - function to call when a row has been unselected
rowclick: null, // optional - function to call when a row is clicked
rowcontextmenu: null, // optional - function to call when the user right-clicks on a row
rowdblclick: null, optional - function to call when a row is double clicked
changesort: null, // optional - function to call when a column has been sorted
colresize: null, // optional - function to call when a column has been resized
rowedit: null, // optional - function to call when a row is being edited
rowcommit: null, // optional - function to call when a row is being committed
    
cellclick: null, // optional - TODO
celldblclick: null, // optional - TODO
cellcontextmenu: null, //optional - TODO
    
pageforward: null, // optional - function to call when the grid is paged forward - TODO
pagebackward: null, // optional - function to call when the grid is paged backward - TODO
pagefirst: null, // optional - function to call when the grid is paged to the first page - TODO
pagelast: null // optional - function to call when the grid is paged to the last page - TODO
    
});

*/
(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    GridResources = {
        emptygrid: Resources.CommonPhrases.EmptyGridMessageText,
        page: Resources.CommonLabels.PagingPageText,
        pagecount: Resources.CommonLabels.PagingTotalPagesText,
        gofirst: Resources.CommonLabels.PagingFirstPageText,
        golast: Resources.CommonLabels.PagingLastPageText,
        goprevious: Resources.CommonLabels.PagingPreviousPageText,
        gonext: Resources.CommonLabels.PagingNextPageText,
        actionrow: Resources.CommonActions.AddText
    };

    SourceCode.Forms.Controls.Grid = {

        _create: function ()
        {
            var o = this.options;
            this.resources = $.extend(o.resources, GridResources);

            this.multiline = o.multiline;
            this.dragcolumns = o.dragcolumns;
            this.multiselect = o.multiselect;
            this.cellcontentselect = o.cellcontentselect;
            this.initialGroupSelectedRow = null;
            this.groupSelectedRows = [];
            this.previouslySelectedIndexes = [];

            this.disablemodulus = o.disablemodulus;

            // changed to null to see if it exists before calculating.
            // That way we don't need to calcualte on page load. 
            this.sortedItemsArray = null;

            this.zebraStripes = o.zebraStripes;

            this.header = null;
            this.toolbars = null;
            this.columntable = null;
            this.contenttable = null;
            this.footer = null;
            this.summary = null;

            this.sortColumn = null;
            this.reverseSort = null;
            this.sortState = null;
            this.singleToDoubleClickTimer = null;
            this.lastClickTime = null;
            this.lastClickTarget = null;
            this.touchDragged = false;
            this.useTouchEvents = o.useTouchEvents;
            this.isMobileIOS = o.isMobileIOS;
            this.isMobileIOSApp = o.isMobileIOSApp;
            this.maxDoubleDoubleClickDelay = 500;

            this.actionrow = o.actionrow;

            this.page = 1;
            this.totalpages = 1;
            this.hasmorepages = null;

            this.tabableElements = [];

            this.editableRowTabIndexCounter = 0;
            this.itemsHaveTabIndices = false;
            this.captureInputs = ['textarea', 'input', 'select', 'a'];

            // AJAX Options
            this.autopopulate = o.autopopulate;

            this.columns = [];

            var _element = this.element;
            var _children = _element.children();

            if (_children.filter(".grid-header").length > 0) this.header = _children.filter(".grid-header").find(".grid-header-text").eq(0);
            if (_children.filter(".grid-toolbars").length > 0) this.toolbars = _children.filter(".grid-toolbars").children(".toolbars").toolbargroup();
            if (_children.filter(".grid-footer").length > 0) this.footer = _children.filter(".grid-footer").children(".toolbars").toolbargroup();
            if (_children.filter(".grid-body").find(".grid-summary").length > 0) this.summary = _children.filter(".grid-body").find(".grid-summary");

            this.rownumbering = _element.is('.with-rownumbering');

            var _gridAggregation = _children.filter('.grid-aggregation');

            if (_gridAggregation.length !== 0)
            {
                this.aggregationContentTableBody = _gridAggregation.find('tbody');

                this._applyAggregationHeaderClickHandler(_gridAggregation);
            }

            if (checkExists(this.summary) && this.summary.length > 0 && this.element.is(".full.with-summary"))
            {
                _children.filter(".grid-body").css("bottom", this.summary.outerHeight());
            }

            this.columnsheadertable = _children.filter(".grid-body").children(".grid-column-headers").find("table.grid-column-header-table");
            this.contentscrollwrapper = _children.filter(".grid-body").find(".grid-body-content .grid-body-content-wrapper > .scroll-wrapper");
            this.contenttable = this.contentscrollwrapper.children("table.grid-content-table");
            this.contenttabletbody = this.contenttable.children("tbody").filter(function () { return $(this).closest('table').not('.control-table'); });

            this.tabIndex = this.contenttable[0].getAttribute("tabindex");

            // If no column options have been supplied, attempt to read it from the content table's embedded metadata
            if (!checkExists(o.columns) || !o.columns.length || o.columns.length === 0)
            {
                var cols = this.contenttable.children("colgroup").children("col");
                for (var i = 0, l = cols.length; i < l; i++)
                {
                    var colops = {};

                    var opts = ["name", "display", "sortable", "align", "datatype", "hidden", "modulus", "width", "resizable"];

                    for (var j = 0, k = opts.length; j < k; j++)
                    {
                        var m = checkExists(cols.eq(i)) ? cols.eq(i).metadata() : {};
                        if (checkExists(m[opts[j]]))
                        {
                            colops[opts[j]] = m[opts[j]];
                        }
                    }

                    this.columns.push(colops);
                }
            }

            if (this.multiselect && (this.cellcontentselect !== true))
            {
                this.contenttabletbody.on("selectstart", function ()
                {
                    var eventTarget = event.target;
                    if (!checkExists(eventTarget)) // cater for IE9
                    {
                        eventTarget = event.srcElement;

                        if (!checkExists(eventTarget)) // this should never happen, but maybe someone is using a strange browser which doesn't have either element
                        {
                            return true;
                        }
                    }

                    if (eventTarget.nodeType === 3) // if it's a text node, get the parent which will be a proper element
                    {
                        eventTarget = eventTarget.parentElement;
                    }

                    if (typeof eventTarget.tagName === "false") // This should never happen, but just select if it for some reason does
                    {
                        return true;
                    }

                    var tagName = eventTarget.tagName.toLowerCase();
                    if (tagName === "input" || tagName === "textarea") // text in text nodes and text areas should always be selectable
                    {
                        return true;
                    }

                    var inContentEditableDiv = false;
                    if (eventTarget.getAttribute("contenteditable") === "true")
                    {
                        inContentEditableDiv = true;
                    }
                    else // get all the parents till either a contenteditable attr, or the grid content table table is found. 
                    // If the content editable attr is found, then we are in an editable div and stuff should be selectable.
                    // this will allow us to select text no matter what the html structure is that the user put it in.
                    {
                        inContentEditableDiv = !$(eventTarget).closest(".grid-content-table, [contenteditable=true]").hasClass("grid-content-table");
                    }

                    if (inContentEditableDiv)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                });
            }

            if (this.cellcontentselect === true)
            {
                this.element.addClass("allow-cell-content-selection");
            }

            // Detecting & saving empty-grid message
            if (this.contenttabletbody.children("tr.empty-grid").length > 0) this.resources.emptygrid = this.contenttabletbody.children("tr.empty-grid").text();

            // Detecting & applying action row & click event handler
            if (this.contenttabletbody.children("tr.action-row").length > 0) this.actionrow = true;
            if (this.actionrow) this._applyActionRow();

            if ($(this.contenttable.parents(".grid")[0]).hasClass("enter-commits-behaviour"))
            {
                this.enterCommitsRow = true;
            }

            // Applying the collapse / expand functionality
            var self = this;

            if (!SourceCode.Forms.Layout.isRuntime())
            {
                $(".grid-header a", this.element).on("click", function ()
                {
                    if ($(this).hasClass("collapse-vertical"))
                    {
                        self.collapse();
                    }
                    else if ($(this).hasClass("expand-vertical"))
                    {
                        self.expand();
                    }
                });
            }


            this.isRuntime = SourceCode.Forms.Layout.isRuntime();

            if (!checkExists(this.isMobileIOS) || !checkExists(this.isMobileIOSApp))
            {
                this._checkMobileDevice(this);
            }

            if (!checkExists(this.useTouchEvents))
            {
                //note the mobile drafts simulator should not be affected
                this.useTouchEvents = this.isMobileIOSApp;
            }

            this._syncWidths(this.zebraStripes, true);

            this._applyScrollEventHandlers();

            this._applyColumnHeaderClickHandlers();
            this._applyColumnHeaderResizeHandlers();
            this._resizeColumnHeaderCells();

            this._applyContentClickHandlers();

            this._applyWindowResizeHandler();

            if (this.isRuntime)
            {
                this.contenttable.on("keydown", this, this._onKeyDown);
            }

            this.contenttable.on("click", function (event)
            {
                // if the user clicks to capture something, we don't want to move focus away.
                // We also don't want to override the focus has already been moved to where the user can capture stuff, like when using the keyboard to edit an item.
                var eventTarget = event.target.tagName.toLowerCase();
                var currentActiveElement = "";
                if (checkExists(document.activeElement) && checkExists(document.activeElement.tagName))
                {
                    currentActiveElement = document.activeElement.tagName.toLocaleLowerCase();
                }
                var hasClassOfEditable = false;
                if (checkExists(event.target.className) && typeof (event.target.className) === "string")
                {
                    var eventClass = event.target.className.toLowerCase();
                    hasClassOfEditable = eventClass.indexOf("editable-area") > -1 || eventClass.indexOf("input-control-watermark") > -1;
                }
                if (jQuery.inArray(eventTarget, self.captureInputs) === -1 &&
                    jQuery.inArray(currentActiveElement, self.captureInputs) === -1 &&
                    hasClassOfEditable && self.contenttable.has(document.activeElement).length === 0)
                {
                    self.contenttable.trigger("focus");
                }
            }).on("focusin", function (event)
            {
                if (self.isRuntime && self._getHighlighted().length === 0)
                {
                    var editRow = self.contenttable.find(".edit-template-row");
                    if (editRow.length > 0)
                    {
                        self._highlight(editRow);
                    }
                    else if (checkExists(event) && checkExists(event.target))
                    {
                        if (!$(event.target).is("a.action-row") && !self._isFocussedOnEditableItem() && editRow.has(document.activeElement).length === 0)
                        {
                            self._highlightSelectedOrFirst();
                        }
                    }
                    else
                    {
                        self._highlightSelectedOrFirst();
                    }
                }
            }).on("focusout", function (event)
            {
                setTimeout(function ()
                { // during focus out, but before focus, the active element is the body. Wait for focus to be effected

                    try // sometimes getting the active element will throw an exception
                    {
                        var activeElement = document.activeElement;

                        if (checkExists(activeElement))
                        {
                            if (self.contenttable.has(document.activeElement).length === 0 && !self.contenttable.is(document.activeElement))
                            {
                                self._findHighlightedAndClear();
                            }
                        }
                        else
                        {
                            self._findHighlightedAndClear();
                        }
                    }
                    catch (e)
                    {
                        self._findHighlightedAndClear();
                    }
                }, 50);
            });

            // the most reliable way to determine if it was a tab or a click that set focus to the headers is the mouse enter and mouse leave events.
            this.headerMouseEvent = false;

            this.columnsheadertable.on("mouseenter", function ()
            {
                this.headerMouseEvent = true;
            });

            this.columnsheadertable.on("mouseleave", function ()
            {
                this.headerMouseEvent = false;
            });

            this.columnsheadertable.on("focus", function ()
            {
                if (!this.headerMouseEvent)
                {

                    var index = 0;
                    while (index < self.columns.length && (!self.columns[index].sortable || self.columns[index].hidden))
                    {
                        index++;
                    }

                    var targetItem = $($(this).find("td")[index]);

                    if (targetItem.length !== 0)
                    {
                        targetItem.addClass("focus");
                    }
                }
            });

            this.columnsheadertable.on("focusout", function ()
            {
                $(this).find(".focus").removeClass("focus");
            });

            this.columnsheadertable.on("click", "td", function ()
            {
                $(this).addClass("focus");
                $(this).siblings(".focus").removeClass("focus");
            });

            if (checkExists(this.toolbars))
            {
                this.toolbars.on("keydown", "a", function (event)
                {
                    // treat space as a click as well.
                    if (event.which === 32)
                    {
                        $(this).find(".button-text").trigger("click");
                        event.preventDefault();
                    }
                });

                this.toolbars.on("click", "a", function (event)
                {
                    // if the user clicks to capture something, we don't want to move focus away.
                    // We also don't want to override the focus has already been moved to where the user can capture stuff, like when using the keyboard to edit an item.
                    var eventTarget = event.target.tagName.toLowerCase();
                    var currentActiveElement = "";
                    if (checkExists(document.activeElement) && checkExists(document.activeElement.tagName))
                    {
                        currentActiveElement = document.activeElement.tagName.toLocaleLowerCase();
                    }
                    if (jQuery.inArray(eventTarget, self.captureInputs) === -1 &&
                        jQuery.inArray(currentActiveElement, self.captureInputs) === -1)
                    {
                        $(this).trigger("focus");
                    }
                });
            }

            if (this.options.autopopulate && this.options.url !== undefined && this.options.url !== "") this.populate();

            if (this.options.paging) this._buildPagingControls();

            this.lrCounter = -1;
            this.previousFocussedItemColumn = -1;
            this.rowCountModifier = this.actionrow === true ? 0 : 1;
        },

        _bindContentEvents: function ()
        {
            this.contenttabletbody.find(".runtime-list-item .hyperlink").on("keydown", this._onListviewItemKeyDown).on("click", this._onListviewItemClick);
            this.contenttabletbody.find(".grid-content-cell-wrapper .fileImage").on("keydown", this._onListviewItemKeyDown).on("click", this._onListviewItemClick);
            this.contenttabletbody.find(".runtime-list-item .image").on("keydown", this._onListviewItemKeyDown).on("click", this._onListviewItemClick);
        },

        _onListviewItemClick: function (event)
        {
            // prevent it from propagating through to the table
            event.stopPropagation();
        },

        _onListviewItemKeyDown: function (event)
        {

            if (event.keyCode === 32)
            {
                // space
                if (!event.ctrlKey && !event.metaKey)
                {

                    if (checkExists(event.target.click))
                    {
                        event.target.click();
                    }
                    else // safari 5 and other browser that doesn't support .trigger("click")
                    {
                        var evObj = document.createEvent('MouseEvents');
                        var target = checkExists(event.target) ? event.target.getAttribute("target") : "";
                        evObj.initMouseEvent('click', true, true, target);
                        event.target.dispatchEvent(evObj);
                    }
                }
                event.stopPropagation();
                event.preventDefault();
            }
        },

        collapse: function (raiseEvent)
        {
            if (!this.element.hasClass("collapsed"))
            {
                this.element.addClass("collapsed");
                this.element.children(".grid-header").find(".collapse-vertical").removeClass("collapse-vertical").addClass("expand-vertical");
                SourceCode.Forms.Layout.checkAndFixView(this.element);

                if (raiseEvent !== false)
                {
                    this._trigger("collapse");
                }
            }
        },

        _destroy: function ()
        {
            $(window).off("resize");
        },

        expand: function (raiseEvent)
        {
            if (this.element.hasClass("collapsed"))
            {
                this.element.removeClass("collapsed");
                this.element.children(".grid-header").find(".expand-vertical").removeClass("expand-vertical").addClass("collapse-vertical");
                this._syncWidths(false);
                SourceCode.Forms.Layout.checkAndFixView(this.element);

                if (raiseEvent !== false)
                {
                    this._trigger("expand");
                }

                this.synccolumns();
            }
        },

        html: function (options)
        {

            if (!checkExists(options)) options = { resources: {} };

            $.extend(options.resources, GridResources);
            var html = "<div";

            if (checkExists(options.id) && options.id !== "") html += " id=\"" + options.id + "\"";

            html += " class=\"grid";

            html += (checkExists(options.header) && options.header !== "") ? " with-header" : " without-header";
            html += (checkExists(options.footer) && options.footer) ? " with-footer" : " without-footer";

            html += ' without-aggregation with';

            if (options.rownumbering !== true)
                html += 'out';

            html += '-rownumbering';

            if (!checkExists(options.toolbars)) options.toolbars = 0;

            switch (options.toolbars)
            {
                case 3:
                    html += " with-triple-toolbar";
                    break;
                case 2:
                    html += " with-double-toolbar";
                    break;
                case 1:
                    html += " with-toolbar";
                    break;
                default:
                    html += " without-toolbar";
            }

            html += (checkExists(options.fullsize) && options.fullsize) ? " full" : "";

            html += "\">";

            // Header section
            if (checkExists(options.header) && options.header !== "")
            {
                html += this._generateHeaderHTML(options.header);
            }
            // End of header section

            // Toolbars section
            if (options.toolbars > 0)
            {
                html += "<div class=\"grid-toolbars\">";

                html += SourceCode.Forms.Controls.ToolbarGroup.html({ toolbars: options.toolbars });

                html += "</div>";
            }
            // End of toolbars section

            // Body section
            html += "<div class=\"grid-body\">";

            // Column headers section
            html += this._generateColumnsHeaderHTML(options);
            // End of column headers section

            // Content section
            html += "<div class=\"grid-body-content\"><div class=\"grid-body-content-wrapper\"><div class=\"scroll-wrapper\">";

            html += "<table class=\"grid-content-table\" tabindex=\"0\">";
            html += this._generateColGroupHTML(options);
            html += "<tbody>";

            // Action Row
            if (options.actionrow)
            {
                html += this._generateActionRowHTML(options);
            }
            else
            {
                html += this._generateEmptyGridHTML(options);
            }

            html += "</tbody></table>";

            html += "</div></div></div>";
            // End content section

            // Drag handles section
            html += "<div class=\"grid-drag-elements\"></div>";
            // End of drag handles section

            html += "</div>";
            // End of body section

            // Footer section
            if (checkExists(options.footer) && options.footer)
            {
                html += this._generateFooterHTML();
            }
            // End of footer section

            // Edit Templates Section
            if (checkExists(options.templates) && checkExists(options.templates.edit) && options.templates.edit)
            {
                html += this._generateEditTemplateHTML();
            }
            // End of Edit Templates Section

            // Display Templates Section
            if (checkExists(options.templates) && checkExists(options.templates.display) && options.templates.display)
            {
                html += this._generateDisplayTemplateHTML();
            }
            // End of Edit Templates Section

            html += "</div>";

            return html;

        },

        _generateColGroupHTML: function (options)
        {
            var html = "";

            if (checkExists(options.columns) && options.columns.length && options.columns.length > 0)
            {
                html += "<colgroup>";

                for (var i = 0, l = options.columns.length; i < l; i++)
                {
                    var metadata = {};
                    var metaDataLength = 0;
                    var initstyle = [];
                    var classes = [];

                    if (checkExists(options.columns[i].name) && options.columns[i].name !== "")
                    {
                        metadata["name"] = options.columns[i].name;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].modulus) && Boolean(options.columns[i].modulus))
                    {
                        metadata["modulus"] = Boolean(options.columns[i].modulus);
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].datatype) && options.columns[i].datatype !== "")
                    {
                        metadata["datatype"] = options.columns[i].datatype;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].control) && options.columns[i].control !== "")
                    {
                        metadata["control"] = options.columns[i].control;
                        metaDataLength++;
                    }

                    if (checkExists(options.columns[i].hidden) && Boolean(options.columns[i].hidden))
                    {
                        metadata["hidden"] = Boolean(options.columns[i].hidden);
                        metaDataLength++;
                        classes.push("hidden");
                    }
                    else
                    {
                        if (checkExists(options.columns[i].width) && options.columns[i].width !== "")
                        {
                            metadata["width"] = options.columns[i].width;
                            metaDataLength++;
                            if (checkExists(options.columns[i].modulus) && Boolean(options.columns[i].modulus))
                            {
                                initstyle.push("min-width:" + options.columns[i].width);
                            }
                            else
                            {
                                initstyle.push("width:" + options.columns[i].width);
                            }
                        }
                    }

                    if (checkExists(options.columns[i].align) && options.columns[i].align !== "")
                    {
                        metadata["align"] = options.columns[i].align;
                        metaDataLength++;
                        initstyle.push("text-align:" + options.columns[i].align);
                    }

                    if (checkExists(options.columns[i].sortable) && Boolean(options.columns[i].sortable))
                    {
                        metadata["sortable"] = Boolean(options.columns[i].sortable);
                        metaDataLength++;
                    }
                    else
                    {
                        metadata["sortable"] = true;
                        metaDataLength++;
                    }

                    html += "<col";

                    if (classes.length > 0)
                    {
                        html += " class=\"" + classes.join(" ") + "\"";
                    }

                    if (metaDataLength > 0)
                    {
                        html += " data-options=\"" + jQuery.toJSON(metadata).htmlEncode() + "\"";
                    }

                    html += " style=\"" + initstyle.join("; ") + "\" />";
                }

                html += "</colgroup>";
            }

            return html;
        },

        _generateHeaderHTML: function (headertext)
        {
            var html = "<div class=\"grid-header\"><div class=\"grid-header-wrapper\"><div class=\"grid-header-text\">"
                + headertext + "</div></div></div>";
            return html;
        },

        _generateColumnsHeaderHTML: function (options)
        {
            if (options.rownumbering === true)
                options.columns.unshift({
                    display: '#',
                    width: 66
                });

            var html = "<div class=\"grid-column-headers\"><div class=\"grid-column-headers-wrapper\">";
            html += "<table  tabindex=\"0\" class=\"grid-column-header-table\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">";
            html += "<tbody>" + this._generateColumnsHeaderCellsHTML(options) + "</tbody></table></div></div>";
            return html;
        },

        _generateColumnsHeaderCellsHTML: function (options)
        {
            var html = "";

            if (checkExists(options.columns) && options.columns.length && options.columns.length > 0)
            {
                html += "<tr>";

                for (var i = 0, l = options.columns.length; i < l; i++)
                {
                    /* CSS Classes */
                    var classes = [];

                    /* Metadata */
                    var metadata = {};
                    var metaDataLength = 0;

                    if (checkExists(options.columns[i].name) && options.columns[i].name !== "")
                    {
                        metadata["name"] = options.columns[i].name;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].hidden) && Boolean(options.columns[i].hidden))
                    {
                        metadata["hidden"] = Boolean(options.columns[i].hidden);
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].modulus) && Boolean(options.columns[i].modulus))
                    {
                        metadata["modulus"] = Boolean(options.columns[i].modulus);
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].align) && options.columns[i].align !== "")
                    {
                        metadata["align"] = options.columns[i].align;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].datatype) && options.columns[i].datatype !== "")
                    {
                        metadata["datatype"] = options.columns[i].datatype;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].width) && options.columns[i].width !== "")
                    {
                        metadata["width"] = options.columns[i].width;
                        metaDataLength++;
                    }
                    if (checkExists(options.columns[i].control) && options.columns[i].control !== "")
                    {
                        metadata["control"] = options.columns[i].control;
                        metaDataLength++;
                    }

                    if (checkExists(options.columns[i].sortable))
                    {
                        metadata["sortable"] = Boolean(options.columns[i].sortable);
                        metaDataLength++;
                        if (options.columns[i].sortable === false) classes.push("not-sortable");
                    }
                    else
                    {
                        metadata["sortable"] = true; // Defaults to true
                        metaDataLength++;
                    }

                    if (checkExists(options.columns[i].resizable))
                    {
                        metadata["resizable"] = Boolean(options.columns[i].resizable);
                        metaDataLength++;
                        if (options.columns[i].resizable === false) classes.push("not-resizable");
                    }
                    else
                    {
                        metadata["resizable"] = true; // Defaults to true
                        metaDataLength++;
                    }

                    if (checkExists(options.columns[i].hidden) && options.columns[i].hidden) classes.push("hidden");
                    html += "<td class=\"";
                    html += classes.join(" ");

                    if (metaDataLength > 0)
                    {
                        html += "\" data-options=\"" + jQuery.toJSON(metadata).htmlEncode();
                    }

                    html += "\" style=\"";

                    if (!checkExists(options.columns[i].hidden) || !options.columns[i].hidden)
                    {
                        if (checkExists(options.columns[i].width) && options.columns[i].width !== "auto" && parseInt(options.columns[i].width) > 0)
                        {
                            html += "width: " + options.columns[i].width;
                        }
                    }

                    html += "\"><div class=\"grid-column-header-cell\"><div class=\"grid-column-header-cell-wrapper\">"
                        + "<div class=\"grid-column-header-cell-content\"><div class=\"grid-column-header-text\" title=\""
                        + options.columns[i].display + "\">";

                    html += (checkExists(options.columns[i].display)) ? options.columns[i].display : "";

                    html += "</div>";

                    if (checkExists(options.customcolumns) && options.customcolumns)
                    {
                        html += "<a href=\"javascript:;\" class=\"grid-column-header-button\" title=\"Hide/Show Columns\"><span></span></a>";
                    }

                    html += "</div></div><div class=\"grid-column-header-divider\"></div></div></td>";

                }

                html += "</tr>";
            }

            return html;

        },

        _generateActionRowHTML: function (options)
        {

            var html = "<tr class=\"action-row\">"
                + "<td class=\"action-row\"" + ((checkExists(options.columns) && options.columns.length > 0) ? " colspan=\"" + options.columns.length + "\"" : "") + ">"
                + "<div class=\"grid-content-cell\"><div class=\"grid-content-cell-wrapper\">"
                + "<a href=\"javascript:;\" class=\"action-row\" tabindex=\"" + this.tabindex + "\">" + ((checkExists(options.resources) && checkExists(options.resources.actionrow)) ? options.resources.actionrow : SCGridDefaults.options.resources.actionrow) + "</a></div></div></td></tr>";

            return html;

        },

        _generateEmptyGridHTML: function (options)
        {

            var html = "<tr class=\"empty-grid\">"
                + "<td class=\"empty-grid\"" + ((checkExists(options.columns) && options.columns.length > 0) ? " colspan=\"" + options.columns.length + "\"" : "") + ">"
                + "<div class=\"grid-content-cell\"><div class=\"grid-content-cell-wrapper\">" + ((checkExists(options.resources) && checkExists(options.resources.emptygrid)) ? options.resources.emptygrid : SCGridDefaults.options.resources.emptygrid) + "</div></div></td></tr>";

            return html;

        },

        _generateFooterHTML: function ()
        {

            var html = "<div class=\"grid-footer\">" + SourceCode.Forms.Controls.ToolbarGroup.html({ toolbars: 1 }) + "</div>";

            return html;

        },

        _generateDisplayTemplateHTML: function ()
        {

            var html = "<div class=\"grid-display-templates\"><table class=\"grid-display-templates-table\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                + "<tbody></tbody></table></div>";

            return html;

        },

        _generateEditTemplateHTML: function ()
        {

            var html = "<div class=\"grid-edit-templates\"><table class=\"grid-edit-templates-table\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                + "<tbody></tbody></table></div>";

            return html;

        },

        _getColumnIndex: function (name)
        {
            var idx = -1;

            for (var i = 0, l = this.columns.length; i < l; i++)
            {
                if (checkExists(this.columns[i].name) && this.columns[i].name === name)
                {
                    idx = i;
                    break;
                }
            }

            return idx;
        },

        _applyAggregationHeaderClickHandler: function (jqGridAggregation)
        {
            var _options = this.options;

            jqGridAggregation.find('.grid-aggregation-header-link').on("click", function ()
            {
                if (jqGridAggregation.is('.collapsed'))
                {
                    var _canExpand = _options.canexpand;

                    if (_canExpand === undefined)
                        _canExpand = true;
                    else if (typeof _canExpand === 'function')
                        _canExpand = _canExpand();

                    if (_canExpand === true)
                        jqGridAggregation.removeClass('collapsed').addClass('expanded');
                }
                else
                    jqGridAggregation.removeClass('expanded').addClass('collapsed');
            });
        },

        _applyScrollEventHandlers: function ()
        {

            var self = this;

            this.contentscrollwrapper.on("scroll", function (event)
            {
                self.columnsheadertable.css(document.documentElement.getAttribute("dir") === "rtl" ? "right" : "left", "-" + (Math.abs($(event.target).scrollLeft())) + "px");
            });

        },

        _applyColumnHeaderClickHandlers: function ()
        {
            var self = this;

            if (self.options.sorting)
            {
                self.columnsheadertable.on("click", "td", function (e)
                {
                    if (!$(this).is(".not-sortable"))
                    {
                        var index = $(this).parent().children().index(this);
                        if (self.columns[index].sortable)
                        {
                            //Commit current row being edited before sorting.
                            //Reason: Incorrect row gets updated / overridden if editing and then sorting.
                            var editedRow = self.contenttabletbody.children("tr.edit-template-row");
                            if (editedRow.length > 0)
                            {
                                self._trigger('commitrowwithkey', e, editedRow);
                            }
                            self.sort(index, false);
                        }
                    }
                });

                if (self.isRuntime)
                {
                    self.columnsheadertable.on("keydown", function (event)
                    {
                        switch (event.which)
                        {
                            // enter
                            case 13:
                            // space
                            case 32:
                                var currentItem = $(this).find(".focus");
                                var index = $(this).find("td").index(currentItem);
                                if (self.columns[index].sortable)
                                {
                                    self.sort(index, false);
                                }
                                event.preventDefault();
                                break;

                            // right arrow
                            case 39:
                                var currentItem = $(this).find(".focus").removeClass("focus");
                                var items = $(this).find("td");
                                var index = items.index(currentItem);
                                index++;
                                while (index < self.columns.length && (!self.columns[index].sortable || self.columns[index].hidden))
                                {
                                    index++;
                                }

                                var nextItem = $(items[index]);

                                if (nextItem.length === 0)
                                {
                                    currentItem.addClass("focus");
                                }
                                else
                                {
                                    nextItem.addClass("focus");
                                }
                                break;

                            // left arrow
                            case 37:
                                var currentItem = $(this).find(".focus").removeClass("focus");
                                var items = $(this).find("td");
                                var index = items.index(currentItem);

                                index--;
                                while (index >= 0 && (!self.columns[index].sortable || self.columns[index].hidden))
                                {
                                    index--;
                                }

                                var prevItem = $(items[index]);

                                if (prevItem.length === 0)
                                {
                                    currentItem.addClass("focus");
                                }
                                else
                                {
                                    prevItem.addClass("focus");
                                }
                                break;
                        }
                    });
                }
            }
        },

        _resizeColumnHeaderCells: function ()
        {
            //var table = this.columnsheadertable;

            //var tdArray = table.find("tr:first-child td");
            ////remove old heights
            //for (var i = 0; i < tdArray.length; i++)
            //{
            //	tdArray[i].style.height = null;
            //}

            //if (this.element.is(":visible")) //TODO: TD0006
            //{
            //	var tableHeight = table.outerHeight() + "px";

            //	for (var i = 0; i < tdArray.length; i++)
            //	{
            //		tdArray[i].style.height = tableHeight;
            //	}
            //}
        },

        _columnsHeaderDividerDragStart: function (e, ui, divider, self, htmlElement, percentage, explicit)
        {
            var cell = $(divider).closest("td"),
                cellindex = cell.parent().children("td").index(cell),
                celloffset = cell.offset(),
                colheaderoffset = self.columnsheadertable.offset(),
                colheaderwidth = self.columnsheadertable.width();

            var x1,
                y1 = celloffset.top,
                x2,
                y2 = y1 + cell.height();

            if (htmlElement.attr("dir") === "rtl")
            {
                x1 = colheaderoffset.left;
                x2 = (colheaderoffset.left + colheaderwidth) - 50;

                if (percentage)
                {
                    x1 = cell.nextAll("td:visible").first().offset().left + 50;  //TODO: TD0006
                    x2 = celloffset.left + cell.width() - 50;
                }
                else
                {
                    x1 -= 10;
                }
            }
            else
            {
                x1 = celloffset.left + 50;
                x2 = (colheaderoffset.left + colheaderwidth);

                if (percentage)
                {
                    x2 = (x1 + cell.width() + cell.nextAll("td:visible").first().width() - 100);  //TODO: TD0006
                }
                else if (explicit)
                {
                    x2 += 10;
                }
            }
            var draggableElement = $(divider);
            //hack the current containment in
            var uiDraggable = draggableElement.data("ui-draggable");
            uiDraggable.containment = [x1, y1, x2, y2];
            uiDraggable.options.containment = [x1, y1, x2, y2];
            draggableElement.closest(".grid-column-header-table").overlay();
        },

        _columnsHeaderDividerDragStop: function (e, ui, divider, self)
        {
            $(divider).closest(".grid-column-header-table").removeOverlay();

            var diff = ($(document.documentElement).attr("dir") === "rtl") ? ui.originalPosition.left - ui.position.left : ui.position.left - ui.originalPosition.left;

            var cell = $(divider).closest("td"), cellindex = cell.parent().children("td").index(cell);

            var os = cell.width(); // orginal size (calculated)

            if (diff !== 0)
            {
                var percentageWidthValue = self._percentageWidth(self.columns[cellindex]);
                var checkNextColumnExists = checkExists(self.columns[cellindex + 1]);
                var nextColumnPercentageWidthValue = self._percentageWidth(self.columns[cellindex + 1]);
                var checkColumnHidden = Boolean(self.columns[cellindex].hidden);
                var checkNextColumnHidden = Boolean(self.columns[cellindex + 1].hidden);
                var checkExplicitWidth = self._explicitWidth(self.columns[cellindex]);
                if (checkExplicitWidth)
                {
                    // Explicit width
                    var r = parseInt(checkExists(self.columns[cellindex].modulus) && self.columns[cellindex].modulus ? cell.width() : self.columns[cellindex].width) + diff;
                    self.columns[cellindex].width = (r > 0 ? r : 0) + "px";
                    self._setColumnWidth(cellindex);
                }
                else if (percentageWidthValue && checkNextColumnExists)
                {
                    // Percentage width

                    var p = parseInt(self.columns[cellindex].width);
                    var n = parseInt(self.columns[cellindex + 1].width);
                    var r = Math.floor(p * ((os + diff) / os));

                    if (nextColumnPercentageWidthValue)
                    {
                        self.columns[cellindex].width = r + "%";
                        if (checkNextColumnHidden)
                        {
                            self._setColumnWidth(cellindex);
                            var widthToDistribute = (p > r) ? (p - r) : -(r - p);
                            self._updateColumnWidths(widthToDistribute);
                        }
                        else
                        {
                            var nextColNewWidth = (p > r) ? (n + (p - r)) : (n - (r - p));
                            if (nextColNewWidth > 0)
                            {
                                self.columns[cellindex + 1].width = nextColNewWidth + "%";
                                self._setColumnWidth(cellindex);
                                self._setColumnWidth(cellindex + 1);
                            }
                            else
                            {
                                self._setColumnWidth(cellindex);
                                var widthToDistribute = (p > r) ? (p - r) : -(r - p);
                                self._updateColumnWidths(widthToDistribute);
                            }

                        }
                    }
                }

                self._trigger("colresize", e, { grid: self.element, columns: self.columns });
                self._syncWidths(null, true);
                self._resizeColumnHeaderCells();
            }
        },

        _applyColumnHeaderResizeHandlers: function ()
        {
            var htmlElement = $(document.documentElement);
            if (htmlElement.hasClass("mobile"))
            {
                return;
            }
            var viscolumns = this.columns.filter(this._visibleColumn.bind(this));
            var explicit = viscolumns.every(this._explicitWidth.bind(this));
            var percentage = viscolumns.every(this._percentageWidth.bind(this));
            var self = this;
            this.columnsheadertable.find("td:not(.not-resizable) .grid-column-header-divider").each(function ()
            {
                $(this).draggable(
                    {
                        appendTo: self.columnsheadertable.parent()[0],
                        axis: "x",
                        helper: "clone",
                        start: function (e, ui)
                        {
                            self._columnsHeaderDividerDragStart(e, ui, e.target, self, htmlElement, percentage, explicit);
                        },
                        stop: function (e, ui)
                        {
                            self._columnsHeaderDividerDragStop(e, ui, e.target, self);
                        },
                        zIndex: 1000
                    });
            });
        },

        _checkMobileDevice: function (self)
        {
            var isIOSMobileRegex = /(iPhone|iPad|iPod)/i;
            self.isMobileIOS = isIOSMobileRegex.test(navigator.userAgent);
            self.isMobileIOSApp = self.isMobileIOS && SourceCode.Forms.Runtime.MobileBridge.inMobileAppContext();
        },

        //this is for the K2App on an ios device
        _handleTouchStart: function (event, self)
        {
			if (!checkExists(self) || !(self instanceof $.Widget))
            {
                self = event.data.self;
            }
			self.touchDragged = false;
		},
		
		_handleTouchMove: function (event, self)
        {
			if (!checkExists(self) || !(self instanceof $.Widget))
            {
                self = event.data.self;
            }
			self.touchDragged = true;
        },

        _handleTouchEnd: function (event, self, target, ctrlKey, shiftKey, enterKey)
        {
            if (!checkExists(self) || !(self instanceof $.Widget))
            {
                self = event.data.self;
            }
            if (self.touchDragged)
			{
				return;
			}
            if (!checkExists(target))
            {
                target = event.target;
            }

            clearTimeout(self.singleToDoubleClickTimer);

            if (checkExists(self.lastClickTarget) && self.lastClickTarget === target) 
            {
                event.preventDefault();
                self._handleClick(event, self, target, ctrlKey, shiftKey, enterKey, false);
                self._handleDblClick(event, self, target);
                self.lastClickTarget = null;
            }
            else
            {
                if (checkExists(self.lastClickTarget) && self.lastClickTarget !== target)
                {
                    self._handleClick(event, self, self.lastClickTarget, ctrlKey, shiftKey, enterKey, true);
                }
                self.singleToDoubleClickTimer = setTimeout(function ()
                {
                    clearTimeout(self.singleToDoubleClickTimer);
                    self.lastClickTarget = null;
					self._handleClick(event, self, target, ctrlKey, shiftKey, enterKey, true);
                }.bind(self), self.maxDoubleDoubleClickDelay); //set timer - trick to check if double tap occurred on mobile device

                self.lastClickTarget = target;
            }
        },

        _handleClick: function (event, self, target, ctrlKey, shiftKey, enterKey, triggerRowClick)
        {
            if (!checkExists(self) || !(self instanceof $.Widget))
            {
                self = event.data.self;
            }

            if (!checkExists(ctrlKey))
            {
                if (event.ctrlKey)
                {
                    ctrlKey = event.ctrlKey;
                }
                else if (event.metaKey)
                {
                    ctrlKey = event.metaKey;
                }
            }

            if (!checkExists(shiftKey))
            {
                shiftKey = event.shiftKey;
            }

            if (!checkExists(target))
            {
                target = event.target;
            }

            var tr = $(target).closest("tr");
            var rows = self.fetch("rows");
            var ri = rows.index(tr);

            if (ri !== -1)
            {

                if ((!checkExists(event.button) || event.button === 0) && !tr.hasClass("empty-grid") && !tr.hasClass("action-row"))
                {
                    var trSelected = tr.hasClass("selected") ? true : false;

                    if (self.multiselect && ctrlKey)
                    {
                        if (trSelected)
                        {
                            self.deselect([ri], event);
                        }
                        else
                        {
                            self.select([ri], event);
                        }
                    }
                    else if (self.multiselect && shiftKey)
                    {
                        var rowsToSelect = [];
                        var rowsToDeselect = [];

                        var initSelectedRowIndex = checkExists(self.initialGroupSelectedRow) ? rows.index(self.initialGroupSelectedRow) : -1;

                        if (initSelectedRowIndex !== -1)
                        {
                            if (initSelectedRowIndex <= ri)
                            {
                                for (var i = initSelectedRowIndex; i <= ri; i++)
                                {
                                    rowsToSelect.push(i);
                                }
                            }
                            else
                            {
                                for (var i = ri; i <= initSelectedRowIndex; i++)
                                {
                                    rowsToSelect.push(i);
                                }
                            }
                        }
                        else
                        {
                            rowsToSelect.push(ri);
                        }

                        for (var j = 0; j < self.groupSelectedRows.length; j++)
                        {
                            if (rowsToSelect.indexOf(self.groupSelectedRows[j]) === -1)
                            {
                                rowsToDeselect.push(self.groupSelectedRows[j]);
                            }
                        }

                        self.deselect(rowsToDeselect, event);
                        self.select(rowsToSelect, event);
                    }
                    else
                    {
                        var prev = self.fetch("selected-rows");
                        var previ = [];

                        for (var i = 0, l = prev.length; i < l; i++)
                        {
                            if (!trSelected || (trSelected && (tr.get(0) !== prev.get(i))))
                            {
                                previ.push(rows.index(prev.eq(i)));
                            }
                        }

                        self.deselect(previ, event);

                        self.select([ri], event);
                    }

                    if (!tr.hasClass("highlighted"))
                    {
                        self._findHighlightedAndClear();

                        if (self.isRuntime)
                        {
                            self._highlight(tr);
                        }
                    }
                }

                if (!enterKey && ((!self.multiselect || (!ctrlKey && !shiftKey)) && !tr.hasClass("edit-template-row")))
                {
                    if (checkExists(triggerRowClick) && (triggerRowClick === false))
                    {
                        //do nothing
                    }
                    else
                    {
                        self._trigger('rowclick', event, tr);
                    }
                }
            }

            // When the user clicks on a row, the row "has focus", so we need to reset the counters
            // only for an editable table and real clicks
            if (self.actionrow || event.type === "click")
            {
                self.lrCounter = -1;
                self.previousFocussedItemColumn = -1;
            }

        },

        _handleDblClick: function (event, self, target)
        {
            if (!checkExists(self))
            {
                self = event.data.self;
            }

            if (!checkExists(target))
            {
                target = event.target;
            }

            if (target.tagName !== undefined) // IE8 specific handle to avoid invalid event targets (disabled inputs)
            {
                var tr = $(target).closest("tr");
                var rows = self.fetch("rows");
                var ri = rows.index(tr);

                if (ri !== -1)
                {
                    self._trigger("rowdblclick", event, tr);
                }
            }
        },

        _applyContentClickHandlers: function ()
        {
            var self = this;

            if (this.useTouchEvents)
            {
                /* On IOS doubletap is used for zooming. However, K2 Smartforms has disabled the zooming effect in any case.
                 * This code was added to handle double-"click" on an editable list or a list in side the workspace mobile app */
                this.contenttabletbody.on("touchstart", { self: this }, this._handleTouchStart);
                this.contenttabletbody.on("touchmove", { self: this }, this._handleTouchMove);
                this.contenttabletbody.on("touchend", { self: this }, this._handleTouchEnd);
            }
            else
            {
                self.contenttabletbody.on("click", { self: this }, this._handleClick);
                self.contenttabletbody.on("dblclick", { self: this }, this._handleDblClick);
            }

            if (this.options.showcustomcontextmenu === null || this.options.showcustomcontextmenu === undefined)
            {
                self.contenttabletbody.on("contextmenu", function (event)
                {

                    var tr = $(event.target).closest("tr");
                    var rows = self.fetch("rows");
                    var ri = rows.index(tr);

                    if (ri !== -1)
                    {
                        if (!self.multiselect || (self.multiselect && !event.ctrlKey && !event.metaKey && event.button !== 2))
                        {
                            // Deselect previous selected rows
                            var prev = self.fetch("selected-rows");
                            var previ = [];

                            for (var i = 0, l = prev.length; i < l; i++)
                            {
                                if (prev[i] !== tr[0]) previ.push(rows.index(prev.eq(i)));
                            }

                            self.deselect(previ, event);
                        }

                        // Select the row if not already selected
                        if (!tr.is(".selected") && (!self.multiselect || (self.multiselect && !event.ctrlKey && !event.metaKey && event.button !== 2)))
                        {
                            self.select([ri], event);
                        }
                        else if (!tr.is(".selected") && (!self.multiselect || (self.multiselect && !event.ctrlKey && !event.metaKey && event.button === 2)))
                        {
                            // Deselect previous selected rows
                            var prev = self.fetch("selected-rows");
                            var previ = [];

                            for (var i = 0, l = prev.length; i < l; i++)
                            {
                                if (prev[i] !== tr[0]) previ.push(rows.index(prev.eq(i)));
                            }

                            self.deselect(previ, event);

                            //select new one
                            self.select([ri], event);
                        }

                        self._trigger('rowcontextmenu', event, tr);
                        event.preventDefault();
                    }

                });
            }
        },

        _applyEditTabbingBehaviour: function (templateRow)
        {
            var self = this;

            if (!self.editEventsAttached)
            {
                // used to tab in circles when editing a row.
                // This prevents you from tabbing out in some grid implementations, currently only in the designer.

                if (self.enterCommitsRow)
                {
                    var tabIndices = [];
                    if (!checkExists(templateRow))
                    {
                        templateRow = self.fetch("edit-template-row");
                    }
                    var editableItemsWithTabIndices = templateRow.find("td:not(.hidden) input[type='radio'][tabindex!='-1']:not(.disabled), td:not(.hidden) :not(div.HyperlinkPopupOuterWrapper) [tabindex][tabindex!='-1'][disabled!='disabled']:not(.disabled)");

                    if (editableItemsWithTabIndices.length > 0)
                    {
                        self.itemsHaveTabIndices = true;
                        var nonJqArray = [];

                        for (var n = 0; n < editableItemsWithTabIndices.length; n++)
                        {
                            if (typeof editableItemsWithTabIndices === 'object')
                            {
                                nonJqArray.push(editableItemsWithTabIndices[n]);
                            }
                        }

                        // we make a copy, since we need the position in the original array when sorting
                        self.sortedItemsArray = nonJqArray.slice();

                        self.sortedItemsArray.sort(function (a, b)
                        {
                            aTabIndex = parseInt(a.getAttribute("tabindex"));
                            bTabIndex = parseInt(b.getAttribute("tabindex"));
                            difference = aTabIndex - bTabIndex;
                            if (difference !== 0)
                            {
                                return difference;
                            }
                            else // when the tab indices are the same, return the original position.
                            {
                                return (nonJqArray.indexOf(a) - nonJqArray.indexOf(b));
                            }
                        });
                    }

                    templateRow.on("keydown.tabbing", function (event)
                    {
                        // tab
                        if (event.which === 9)
                        {
                            event.stopPropagation();
                            if (self.itemsHaveTabIndices)
                            {
                                var sortedItemsArray = self.sortedItemsArray;
                                var eventTarget = event.target;

                                var index = sortedItemsArray.indexOf(eventTarget);
                                var arrayLength = sortedItemsArray.length;

                                // Why am I implemeting tabbing when it already exists in the browser by default?
                                // Becuase the user should not be able to tab out of the edit row, even if the designer put the tab 
                                // index of another control right in the middle of the edit row tab index sequence
                                if (event.shiftKey)
                                {
                                    if (index === 0)
                                    {
                                        try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                        {
                                            $(sortedItemsArray[arrayLength - 1]).trigger("focus");
                                        }
                                        catch (e)
                                        { }
                                    }
                                    else
                                    {
                                        index--;
                                        try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                        {
                                            $(sortedItemsArray[index]).trigger("focus");
                                        }
                                        catch (e)
                                        { }
                                    }
                                }
                                else
                                {
                                    if (index === arrayLength - 1)
                                    {
                                        try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                        {
                                            $(sortedItemsArray[0]).trigger("focus");
                                        }
                                        catch (e)
                                        { }
                                    }
                                    else
                                    {
                                        index++;
                                        try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                        {
                                            $(sortedItemsArray[index]).trigger("focus");
                                        }
                                        catch (e)
                                        { }
                                    }
                                }
                                event.preventDefault();
                            }
                            else
                            {
                                var elements = $(this).find("input, a");
                                var elementCount = elements.length;
                                var index = elements.index(event.target);
                                if (event.shiftKey === false && index === elementCount - 1)
                                {
                                    try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                    {
                                        $(elements[0]).trigger("focus");
                                    }
                                    catch (e)
                                    { }
                                    event.preventDefault();
                                }
                                else if (event.shiftKey === true && index === 0)
                                {
                                    try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                                    {
                                        $(elements[elementCount - 1]).trigger("focus");
                                    }
                                    catch (e)
                                    { }
                                    event.preventDefault();
                                }
                            }
                        }
                    });
                }
                self.editEventsAttached = true;
            }
        },

        _applyWindowResizeHandler: function ()
        {

            var self = this;

            $(window).on("resize", function (event)
            {
                self._syncWidthsInternal(null, true);
                self._resizeColumnHeaderCells();
            });

        },

        clearsort: function ()
        {

            this.reverseSort = null;
            this.sortColumn = null;
            this.sortState = null;
            this.columnsheadertable.children("tbody").children("tr").children("td").children(".grid-column-header-cell").removeClass("asc").removeClass("desc");

        },

        sort: function (col, reverse)
        {
            if (checkExists(col))
            {
                if (this.reverseSort === null) this.reverseSort = [];

                if (this.reverseSort[col] === null) this.reverseSort[col] = reverse;

                if (col === this.sortColumn) this.reverseSort[col] = !this.reverseSort[col];

                this.sortColumn = col;
            }
            else if (checkExists(this.sortColumn))
            {
                col = this.sortColumn;
                reverse = this.reverseSort[col];
            }

            if (checkExists(col))
            {
                reverse = this.reverseSort[col];
                var currentSortColumn = this.columns[col];
                if (checkExists(this.options.customsort) && typeof this.options.customsort === "function")
                {
                    this.options.customsort(col, reverse, this.element);
                }
                else
                {
                    this.contenttabletbody[0].style.display = "none";
                    var rows = this.fetch("rows");

                    var colDataType = currentSortColumn.datatype;
                    var l = rows.length;

                    for (var i = 0; i < l - 1; i++)
                    {
                        var row = rows.eq(i);
                        var originalColumn = row.children().eq(col);

                        var minVal = this._getColumnValueForComparison(originalColumn, colDataType);
                        var comparisonRow = null;
                        for (var j = i + 1; j < l; j++)
                        {
                            var nextRow = rows.eq(j);
                            var comparisonColumn = nextRow.children().eq(col);
                            var testVal = this._getColumnValueForComparison(comparisonColumn, colDataType);
                            var cmp = this._compareValues(minVal, testVal, colDataType);

                            if (reverse) cmp = -cmp;

                            if (cmp > 0)
                            {
                                comparisonRow = nextRow;
                                minVal = testVal;
                            }
                        }

                        if (comparisonRow !== null)
                        {
                            comparisonRow.insertBefore(row);
                            rows = this.fetch("rows");
                        }
                    }

                    this._applyZebraStripes();
                    this.contenttabletbody[0].style.display = "";
                }

                var sortDirection = !reverse ? "asc" : "desc";
                this.sortState = { direction: sortDirection, columnName: currentSortColumn.name };

                var headerCells = this.columnsheadertable.children("tbody").children("tr").children();
                headerCells.children(".grid-column-header-cell").removeClass("asc").removeClass("desc");
                headerCells.eq(col).children(".grid-column-header-cell").addClass(sortDirection);
            }
        },

        _getColumnValueForComparison: function (c, dataType)
        {
            var columnValue = c.metadata().value;

            if (!checkExistsNotEmpty(columnValue) || dataType === "text")
            {
                columnValue = c.text();
            }

            if (dataType !== "date")
            {
                columnValue = this._normalizeString(columnValue.toLowerCase());
            }

            return columnValue;
        },

        _compareValues: function (a, b, t)
        {
            var f1, f2;
            switch (t)
            {
                case "number":
                    f1 = parseFloat(a);
                    f2 = parseFloat(b);
                    if (!isNaN(f1) && !isNaN(f2))
                    {
                        a = f1;
                        b = f2;
                    }
                    break;
                case "date":
                    if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Layout.isRuntime()) //IE does not allow new Date() on dates in the following format "2019-06-11 22:00:00Z". Hence an invalid date error occurs in IE at the point of comparison which prevents comparison from processing correctly.
                    {
                        f1 = Date.parse(a);
                        f2 = Date.parse(b);
                    }
                    else
                    {
                        f1 = new Date(a);
                        f2 = new Date(b);
                    }
                    a = f1;
                    b = f2;
                    break;
            }

            if (a > b)
            {
                return 1;
            }
            if (a < b)
            {
                return -1;
            }
            else
            {
                return 0;
            }

        },

        _normalizeString: function (s)
        {

            s = s.replace(new RegExp("\\s\\s+", "g"), " ");
            s = s.replace(new RegExp("^\\s*|\\s*$", "g"), "");
            return s;

        },

        _escapeMetadataString: function (s)
        {
            return s.htmlEncode();
        },

        synccolumns: function ()
        {
            this.options.triggersynccolumns = true;
            this._syncWidths(null, true);
            this._resizeColumnHeaderCells();
        },

        syncWidths: function (applyZebraStripes)
        {
            this._syncWidths(applyZebraStripes);
        },

        _regex: {
            repx: /^(\d{1,})(px)?(%{0})$/,
            repw: /^100(\.0{0,2})? *%$|^\d{1,2}(\.\d{1,2})? *%$/,
            pixelOrPercentage: /px|%/gi
        },

        // Array filter function to determine if a column is sized with an explicit pixel value
        _explicitWidth: function (element, index, array)
        {
            return (checkExists(element.width) && checkExists(element.width.toString().match(SCGrid._regex.repx)));
        },

        // Array filter function to determine if a column is sized with a percentage value
        _percentageWidth: function (element, index, array)
        {
            return (checkExists(element.width) && checkExists(element.width.toString().match(SCGrid._regex.repw)));
        },

        // Array filter function to determine if a column is visible
        _visibleColumn: function (element, index, array)
        {
            return (checkExists(element.hidden) && element.hidden === true) ? false : true;
        },

        // Calculates the explicit min width for the grid (explicit columns only)
        _getGridMinWidth: function ()
        {
            var viscolumns = this.columns.filter(this._visibleColumn.bind(this));

            var explicit = viscolumns.every(this._explicitWidth.bind(this));

            if (explicit)
            {
                var w = 0;
                for (var i = 0, l = viscolumns.length; i < l; i++) w += parseInt(viscolumns[i].width);
                return w;
            }
            else
            {
                return -1;
            }

        },

        // Sets the width of a specific column (usually on user resize)
        _setColumnWidth: function (index, width)
        {
            var tables = this.element.find("table.grid-column-header-table, table.grid-content-table, table.grid-edit-templates-table, table.grid-display-templates-table, table.grid-summary-content-table");
            var colgroup = this.contenttable.children("colgroup");

            if (width !== undefined) this.columns[index].width = width;

            var col = colgroup.find("> col:nth-child(" + (index + 1) + ")");
            var tds = tables.find("> tbody > tr > td:nth-child(" + (index + 1) + ")");

            // Clearing possible widths from applicable cells
            if (tds.length > 0) tds.each(function () { this.style.width = ""; });

            // New COL element to replace existing
            var metadata = {};
            var initstyle = [];
            var classes = [];
            var metaDataLength = 0;

            if (checkExists(this.columns[index].name) && this.columns[index].name !== "")
            {
                metadata["name"] = this.columns[index].name;
                metaDataLength++;
            }
            if (checkExists(this.columns[index].modulus) && Boolean(this.columns[index].modulus))
            {
                metadata["modulus"] = Boolean(this.columns[index].modulus);
                metaDataLength++;
            }
            if (checkExists(this.columns[index].datatype) && this.columns[index].datatype !== "")
            {
                metadata["datatype"] = this.columns[index].datatype;
                metaDataLength++;
            }
            if (checkExists(this.columns[index].control) && this.columns[index].control !== "")
            {
                metadata["control"] = this.columns[index].control;
                metaDataLength++;
            }

            if (checkExists(this.columns[index].hidden) && Boolean(this.columns[index].hidden))
            {
                metadata["hidden"] = Boolean(this.columns[index].hidden);
                metaDataLength++;
                classes.push("hidden");
            }
            else
            {
                if (checkExists(this.columns[index].width) && this.columns[index].width !== "")
                {
                    metadata["width"] = this.columns[index].width;
                    metaDataLength++;
                    if (checkExists(this.columns[index].modulus) && Boolean(this.columns[index].modulus))
                    {
                        initstyle.push("min-width:" + this.columns[index].width);
                    }
                    else
                    {
                        initstyle.push("width:" + this.columns[index].width);
                    }
                }
            }

            if (checkExists(this.columns[index].align) && this.columns[index].align !== "")
            {
                metadata["align"] = this.columns[index].align;
                metaDataLength++;
                initstyle.push("text-align:" + this.columns[index].align);
            }

            if (checkExists(this.columns[index].sortable) && Boolean(this.columns[index].sortable))
            {
                metadata["sortable"] = Boolean(this.columns[index].sortable);
                metaDataLength++;
            }
            else
            {
                metadata["sortable"] = true;
                metaDataLength++;
            }

            var colHtml = "<col";

            if (classes.length > 0)
            {
                colHtml += " class=\"" + classes.join(" ") + "\"";
            }

            if (metaDataLength > 0)
            {
                colHtml += " data-options=\"" + jQuery.toJSON(metadata).htmlEncode() + "\"";
            }

            colHtml += " style=\"" + initstyle.join("; ") + "\" />";

            col.replaceWith(colHtml);
        },

        runtimeSyncColumns: function ()
        {
            var tables = this.element.find("table.grid-column-header-table, table.grid-edit-templates-table, table.grid-display-templates-table, table.grid-summary-content-table");
            var colgroup = this.contenttable.children("colgroup");

            // Cloning the content table's colgroup definition to the other tables
            tables.each(function ()
            {
                $(this).children("colgroup").remove();
                $(this).prepend(colgroup.clone(true));

            });

            //width does not need to be set at runtime
            //overide any width set by the grid
            tables.each(function ()
            {
                this.style.width = "";
            });
        },

        // Synchronizes the colgroup definition of the grid body to that of the column headers
        _syncWidths: function (applyZebraStripes, forceSyncWidth)
        {
            if (forceSyncWidth || this.options.disableInternalWidthSync !== true)
            {
                SourceCode.Forms.Utilities.performance.debounce(this._syncWidthsInternal, { args: arguments, thisContext: this, delay: 100 });
            }
        },
        _syncWidthsInternal: function (applyZebraStripes, forceSyncWidth)
        {
            var _this = this;
            if (forceSyncWidth || this.options.disableInternalWidthSync !== true)
            {
                var tables = this.element.find("table.grid-column-header-table, table.grid-content-table, table.grid-edit-templates-table, table.grid-display-templates-table, table.grid-summary-content-table");
                var colgroup = this.contenttable.children("colgroup");

                var viscolumns = this.columns.filter(this._visibleColumn.bind(this));
                var explicit = viscolumns.every(this._explicitWidth.bind(this));

                var mi = -1, mmw, mw; // Modulus Index, Modulus Min Width & Modulus Width

                if (explicit && viscolumns.length > 0)
                {
                    var i = 0, l = this.columns.length;

                    for (; i < l; i++)
                    {
                        if (checkExists(this.columns[i].modulus) && this.columns[i].modulus) break;
                    }

                    if (i === l) i--; // Select the last column as the modulus if none is specified

                    var col = colgroup.find("> col:nth-child(" + (i + 1) + ")");
                    var tds = tables.find("> tbody > tr > td:nth-child(" + (i + 1) + ")");

                    mi = i;

                    // Clearing the current applied widths of tables, affected column & modulus cells
                    if (tables.length > 0) tables.each(function () { this.style.width = ""; });
                    if (col.length > 0) col[0].style.width = "";
                    if (tds.length > 0) tds.each(function () { this.style.width = ""; });

                    var gw = this.contenttable.width(), mgw = this._getGridMinWidth();

                    if (gw > mgw)
                    {
                        // Available width greater than the minimum required width, applying a modulus width
                        mw = parseInt(this.columns[i].width) + (gw - mgw);
                        mmw = parseInt(this.columns[i].width);
                    }
                    else
                    {
                        mw = mmw = parseInt(this.columns[i].width);
                    }

                    if (col.length > 0) col[0].style.width = mw + "px";
                    if (tds.length > 0) tds.each(function () { this.style.minWidth = mmw + "px"; this.style.width = mw + "px"; });
                }

                // Cloning the content table's colgroup definition to the other tables
                this.element.find("table.grid-column-header-table, table.grid-edit-templates-table, table.grid-display-templates-table, table.grid-summary-content-table").each(function ()
                {
                    $(this).children("colgroup").remove();
                    $(this).prepend(colgroup.clone(true));

                    if (explicit && mi > -1)
                    {
                        var tds = $(this).find("> tbody > tr > td:nth-child(" + (mi + 1) + ")");
                        if (tds.length > 0) tds.each(function () { this.style.minWidth = mmw + "px"; this.style.width = mw + "px"; });
                    }
                });

                var w = this.contenttable.width();

                if (!checkExists(_this.isMobileIOS) || !checkExists(_this.isMobileIOSApp))
                {
                    _this._checkMobileDevice(_this);
                }
                this.element.find("table.grid-column-header-table, table.grid-edit-templates-table, table.grid-display-templates-table").each(function ()
                {
                    this.style.width = w + "px";
                    if (_this.isMobileIOS)
                    {
                        this.style.width = "100%";
                    }
                });

                // Setting the column headers max-widths on elements to assist text-overflow, horizontal & vertical alignment
                var tbl = this.element.find("table.grid-column-header-table"), cols = tbl.find("> colgroup > col"), tds = tbl.find("> tbody > tr > td");
                tds.find(".grid-column-header-cell").each(function () { this.style.width = ""; });
                cols.each(function (i)
                {
                    var td = tds.eq(i), tdc = td.children().first(), w = tdc.width(),
                        tdcl = tdc.find(".grid-column-header-text.LabelWrap");
                    if (tdcl.length > 0) tdcl[0].style.maxWidth = "";

                    if (w > 0)
                    {
                        tdc[0].style.width = w + "px";
                        if (tdcl.length > 0) tdcl[0].style.maxWidth = w + "px";
                    }
                });
            }

            if (applyZebraStripes !== false)
                this._applyZebraStripes();

            if (this.options.triggersynccolumns === true)
            {
                this.options.triggersynccolumns = false;
                this._trigger("synccolumns", null, this.columns);
            }

        },

        fetch: function ()
        {

            switch (arguments[0])
            {
                case "header":
                    return this.header;
                    break;
                case "toolbars":
                    return this.toolbars;
                    break;
                case "columns":
                    for (var i = 0; i < this.columns.length; i++)
                    {
                        this.columns[i].display = this.columnsheadertable.find(">tbody>tr>td").eq(i).find(".grid-column-header-text").text().trim();
                    }
                    return this.columns;
                    break;
                case "footer":
                    if (checkExists(this.footer))
                    {
                        return this.footer;
                    }
                    break;
                case "rows":
                    var rows = this.contenttabletbody.children("tr:not(.action-row):not(.empty-grid):not(.edit-template-row, .display-template-row)");
                    switch (arguments[1])
                    {
                        case "objects":
                            return this._getSelectedValueObjects(rows);
                            break;
                        case "text":
                            return this._getSelectedText(rows);
                            break;
                        case "values":
                            return this._getSelectedValues(rows);
                            break;
                        default:
                            return rows;
                    }
                    break;
                case "selected-rows":
                    switch (arguments[1])
                    {
                        case "objects":
                            return this._getSelectedValueObjects(this.contenttabletbody.children("tr.selected"));
                            break;
                        case "text":
                            return this._getSelectedText(this.contenttabletbody.children("tr.selected"));
                            break;
                        case "values":
                            return this._getSelectedValues(this.contenttabletbody.children("tr.selected"));
                            break;
                        default:
                            return this.contenttabletbody.children("tr.selected");
                    }
                    break;
                case "unselected-rows":
                    return this.contenttabletbody.children("tr:not(.action-row):not(.empty-grid):not(.edit-template-row, .display-template-row):not(.selected)");
                    break;
                case "first-row":
                case "last-row":
                    var rows = this.fetch("rows");

                    var row = (arguments[0] === "first-row") ? rows.first() : rows.last();

                    switch (arguments[1])
                    {
                        case "objects":
                            return this._getSelectedValueObjects(row);
                            break;
                        case "text":
                            return this._getSelectedText(row);
                            break;
                        case "values":
                            return this._getSelectedValues(row);
                            break;
                        default:
                            return row;
                    }
                    break;
                case "first-selected-row":
                    var selectedRows = this.contenttabletbody.children("tr.selected");
                    return (selectedRows.length > 1) ? $(selectedRows[0]) : selectedRows;
                    break;
                case "edit-template-row":
                    return this.element.find(">.grid-edit-templates>table>tbody>tr");
                    break;
                case "display-template-row":
                    return this.element.find(">.grid-display-templates>table>tbody>tr");
                    break;
                case "subset-rows":
                    var allRows = this.contenttabletbody.children("tr:not(.action-row):not(.empty-grid):not(.edit-template-row, .display-template-row)");

                    var subsetRows = allRows;
                    var returnType = "";

                    if (checkExists(arguments[1]))
                    {
                        var subsetRowsOptions = arguments[1];

                        var startIndex = checkExistsNotEmpty(subsetRowsOptions.startIndex) ? parseInt(subsetRowsOptions.startIndex) : 0;
                        var endIndex = checkExistsNotEmpty(subsetRowsOptions.endIndex) ? parseInt(subsetRowsOptions.endIndex) : subsetRows.length;

                        returnType = checkExistsNotEmpty(subsetRowsOptions.returnType) ? subsetRowsOptions.returnType : "";

                        subsetRows = allRows.slice(startIndex, endIndex);
                    }

                    switch (returnType)
                    {
                        case "objects":
                            return this._getSelectedValueObjects(subsetRows);
                            break;
                        case "text":
                            return this._getSelectedText(subsetRows);
                            break;
                        case "values":
                            return this._getSelectedValues(subsetRows);
                            break;
                        default:
                            return subsetRows;
                    }
                    break;
            }

        },

        add: function ()
        {
            switch (arguments[0])
            {
                case "header":
                    this._addHeader(arguments[1]);
                    break;
                case "toolbar":
                    this._addToolbar();
                    break;
                case "footer":
                    this._buildFooter();
                    break;
                case "rows":
                    this._addRows(arguments[1]);
                    break;
                case "row":
                    this._addRow(arguments[1], arguments[2], arguments[3], arguments[4]);
                    SourceCode.Forms.Layout.checkAndFixView(this.element);
                    break;
                case "edit-template":
                    this._addRowTemplate("edit", arguments[1], arguments[2], arguments[3]);
                    break;
                case "display-template":
                    this._addRowTemplate("display", arguments[1], arguments[2], arguments[3]);
                    break;
                case "column":

                    break;
                case "paging-controls":
                    this._buildPagingControls();
                    break;
            }

        },

        _getSelectedValueObjects: function (rows)
        {

            var result = [];

            for (var i = 0, l = rows.length; i < l; i++)
            {

                var row = [], cells = rows.eq(i).children("td");

                for (var j = 0, k = cells.length; j < k; j++)
                {
                    var data = {}, cell = cells.eq(j), m = cell.metadata();

                    if (checkExists(m["icon"])) data.icon = m["icon"];
                    if (checkExists(m["value"])) data.value = m["value"];
                    if (checkExists(m["control"])) data.control = m["control"];
                    if (checkExists(m["fieldPropertyType"])) data.fieldPropertyType = m["fieldPropertyType"];

                    data.display = cell.text();

                    if (!checkExists(m["value"]) && cell.children(".grid-content-cell").is(".edit-mode"))
                    {
                        var cellinner = cell.children(".grid-content-cell").children(".grid-content-cell-wrapper");
                        if (cellinner.children().length === 1 && cellinner.children().is("label.checkbox, label.radio"))
                        {
                            data.value = cellinner.find("input[type=checkbox], input[type=radio]").is(":checked");
                        }
                    }

                    if (cell.hasClass("hidden"))
                    {
                        data.hidden = true;
                    }

                    row.push(data);
                }

                result.push(row);

            }

            return result;

        },

        _getSelectedText: function (rows)
        {

            var result = [];

            for (var i = 0, l = rows.length; i < l; i++)
            {
                var row = [], cells = rows.eq(i).children("td");
                for (var j = 0, k = cells.length; j < k; j++) row.push(cells.eq(j).text());
                result.push(row);
            }

            return result;

        },

        _getSelectedValues: function (rows)
        {

            var result = [];

            for (var i = 0, l = rows.length; i < l; i++)
            {
                var row = [], cells = rows.eq(i).children("td");
                for (var j = 0, k = cells.length; j < k; j++)
                {
                    var res, val, f, n, b, cell = cells.eq(j), m = cell.metadata();

                    val = (checkExists(m["value"])) ? m["value"] : cell.text();

                    var fre = /^[-+]?\d*\.?\d*$/;
                    var nre = /^[-+]?\d*$/;
                    var bre = /^([Ff]+(alse)?|[Tt]+(rue)?)$/;

                    if (fre.test(val))
                    {
                        res = parseFloat(val);
                    }
                    else if (nre.test(val))
                    {
                        res = parseInt(val);
                    }
                    else if (bre.test(val))
                    {
                        res = Boolean(val);
                    }
                    else
                    {
                        res = val;
                    }

                    row.push(res);

                }
                result.push(row);
            }

            return result;

        },

        setRowsClass: function ()
        {

            var result = [];

            for (var i = 0, l = arguments[0].length; i < l; i++)
            {
                var row = arguments[0][i];
                row.addClass(arguments[1]);
            }
        },

        removeRowsClass: function ()
        {

            var result = [];

            for (var i = 0, l = arguments[0].length; i < l; i++)
            {
                var row = arguments[0][i];
                row.removeClass(arguments[1]);
            }
        },

        _addRowTemplate: function ()
        {
            var templateRow = (arguments[0] === "edit") ? this.fetch("edit-template-row") : this.fetch("display-template-row");
            templateRow.find(".edit-mode").removeClass("edit-mode");
            var html = templateRow.clone(true);

            this.contenttabletbody.children("tr.empty-grid").remove();
            this.element.removeClass("empty");

            var newrow = null;

            if (checkExists(this.rows) && this.rows.length > 0)
            {
                //arguments[3] is the row index to insert at
                if (checkExists(arguments[3]) && parseInt(arguments[3]) !== NaN)
                {
                    if (parseInt(arguments[3]) <= this.rows.length)
                    {
                        newrow = $(html).insertBefore(this.contenttabletbody.children("tr").eq(parseInt(arguments[3])));
                    }
                }
            }
            if (newrow === null)//Not inserted yet
            {
                if (this.actionrow)//insert before actionrow
                {
                    newrow = $(html).insertBefore(this.contenttabletbody.children("tr.action-row").eq(0));
                }
                else//insert at end
                {
                    newrow = $(html).appendTo(this.contenttabletbody);
                }
            }

            var required = false;
            var multipleItems = true;
            var _this = this;
            html.find("input.token-input").tokenbox({ accept: ".ui-draggable" });

            var columns = html.find(".grid-content-cell-wrapper");
            var newrow = null;
            for (var i = 0; checkExists(arguments[1]) && i < columns.length && i < arguments[1].length; i++)
            {
                $(columns[i]).find("select").val(arguments[1][i]);
                var element = $(columns[i]).find("input.token-input");
                if (element.length > 0)
                {
                    element.tokenbox("value", arguments[1][i]);
                }
                else
                {
                    $(columns[i]).find("input").val(arguments[1][i]);
                }
            }
            html.find("select").dropdown();

            this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

            if (checkExists(newrow) && newrow.length > 0)
            {
                newrow.find("input.input-control[type=checkbox]").checkbox();
                newrow.find("input.input-control[type=radio]").radiobutton();
                newrow.find(".input-control.text-input").textbox();
                newrow.find("select.input-control").dropdown();
            }

            var _syncWidths = arguments[2];

            if (_syncWidths === undefined || _syncWidths === true)
                this._syncWidths();
            else
                this._applyZebraStripes();

        },

        _addRows: function (rowValues)
        {
            if (rowValues !== undefined && rowValues.length > 0)
            {
                var actionRow = this.contenttabletbody.children("tr.action-row");
                var actionRowFocussed = false;
                if (actionRow.length > 0 && checkExists(document.activeElement))
                {
                    if ($(document.activeElement).is("a.action-row"))
                    {
                        actionRowFocussed = true;
                    }
                }
                this.contenttabletbody[0].style.display = "none";
                var length = rowValues.length;
                this._calculateVisibleColumnIndex();

                var html = "";
                for (var index = 0; index < length; index++)
                {
                    var highlightRow = (this.previouslyHighlightedIndex === index);
                    var selectRow = (this.previouslySelectedIndexes.indexOf(index) !== -1);

                    var currentRowValuesObject = rowValues[index];
                    var currentRowValues = currentRowValuesObject;
                    var rowClasses = null;
                    if (!(currentRowValuesObject instanceof Array))
                    {
                        currentRowValues = currentRowValuesObject.values;
                        rowClasses = currentRowValuesObject.options.rowClasses;
                    }
                    html += this._buildRowHtml(currentRowValues, null, null, rowClasses, highlightRow, selectRow);

                } // for each row value


                this.contenttabletbody.empty();
                this.element.removeClass("empty");

                this.contenttabletbody.html(html);
                this.contenttabletbody[0].style.display = "";
                if (actionRow.length > 0)
                {
                    this.contenttabletbody.append(actionRow);
                    var self = this;
                    actionRow.on("click", function (event)
                    {
                        self._trigger('actionrowclick', event, $(this));
                    });
                    if (actionRowFocussed === true)
                    {
                        this._findHighlightedAndClear();
                        this.contenttabletbody.find("a.action-row").trigger("focus");
                    }
                }
                this._bindContentEvents();
            }
        },

        _addRow: function ()
        {
            this._calculateVisibleColumnIndex();
            var html = this._buildRowHtml(arguments[0], arguments[1], arguments[2] || null, arguments[3] || null);

            this.contenttabletbody.children("tr.empty-grid").remove();
            this.element.removeClass("empty");

            var newrow = null;

            this.rows = this.fetch("rows");
            if (checkExists(this.rows) && this.rows.length > 0)
            {
                //arguments[2] is the row index to insert at
                if (checkExists(arguments[2]) && parseInt(arguments[2]) !== NaN)
                {
                    if (parseInt(arguments[2]) <= this.rows.length)
                    {
                        newrow = $(html).insertBefore(this.contenttabletbody.children("tr").eq(parseInt(arguments[2])));
                    }
                }
            }
            if (newrow === null)//Not inserted yet
            {
                if (this.actionrow)//insert before actionrow
                {
                    newrow = $(html).insertBefore(this.contenttabletbody.children("tr.action-row").eq(0));
                }
                else//insert at end
                {
                    newrow = $(html).appendTo(this.contenttabletbody);
                }
            }

            if (checkExists(newrow) && newrow.length > 0)
            {
                newrow.find("input.input-control[type=checkbox]").checkbox();
                newrow.find("input.input-control[type=radio]").radiobutton();
                newrow.find(".input-control.text-input").textbox();
                newrow.find("select.input-control").dropdown();
            }

            var _syncWidths = arguments[1];

            if (_syncWidths === undefined || _syncWidths === true)
                this._syncWidths();

            newrow.find(".fileImage, .hyperlink, .image")
                .on("keydown", this._onListviewItemKeyDown)
                .on("click", this._onListviewItemClick)
                .on("focus", this._onListviewItemFocus)
                .on("blur", this._onListviewItemBlur);

            //Re-assign this.rows so that operations like Move Down work as expected
            this.rows = this.fetch("rows");

            return newrow; //_buildPagingControls
        },

        _calculateVisibleColumnIndex: function ()
        {
            if ((!checkExists(this.firstVisibleColumnIndex) || !checkExists(this.lastVisibleColumnIndex)) && checkExists(this.columns))
            {
                var firstColumnSet = false;
                for (var i = 0; i < this.columns.length; i++)
                {
                    if (!checkExists(this.columns[i].hidden) || !this.columns[i].hidden)
                    {
                        if (firstColumnSet === false)
                        {
                            this.firstVisibleColumnIndex = i;
                            firstColumnSet = true;
                        }
                        this.lastVisibleColumnIndex = i;
                    }
                }
            }
        },

        _buildRowHtml: function ()
        {
            var html = "<tr class=\"";

            // If there was an item highligted before the refresh, highlight it again.
            // The list is regenerated regularly, so this is needed
            if (!this.options.paging)
            {
                if (arguments[4])
                {
                    html += "highlighted ";
                }

                if (arguments[5])
                {
                    html += "selected ";
                }
            }

            if (this.multiline === false) html += "nowrap";
            if (checkExists(arguments[3]) && arguments[3] !== '') html += " {0}".format(arguments[3]);

            html += "\">";

            var numberOfColumns = this.columns.length;

            for (var i = 0, l = numberOfColumns; i < l; i++)
            {
                var data = {};
                var classes = [];

                if (i === this.firstVisibleColumnIndex)
                {
                    classes.push("first");
                }
                else if (i === this.lastVisibleColumnIndex)
                {
                    classes.push("last");
                }

                data.isLiteral = this.options.isLiteral; //cellRenderMode: passthrough (unescaped)

                var rowData = arguments[0][i];
                if (checkExists(rowData))
                {
                    if (typeof rowData === "string")
                        data.value = rowData;
                    if (checkExists(rowData.icon))
                        data.icon = rowData.icon;
                    if (checkExists(rowData.value))
                        data.value = rowData.value;
                    if (checkExists(rowData.display))
                        data.display = rowData.display;
                    if (checkExists(rowData.control))
                        data.control = rowData.control;
                    if (checkExists(rowData.html))
                        data.html = rowData.html;
                    if (checkExists(rowData.cellclass))
                        data.cellclass = rowData.cellclass;
                    if (checkExists(rowData.counter))
                        data.counter = rowData.counter;
                    if (checkExists(rowData.align))
                        data.align = rowData.align;
                    if (checkExists(rowData.isLiteral))
                        data.isLiteral = rowData.isLiteral;
                    if (checkExists(rowData.title))
                        data.title = rowData.title;
                    if (checkExists(rowData.fieldPropertyType))
                        data.fieldPropertyType = rowData.fieldPropertyType;
                }

                html += "<td";

                // Storing cell metadata
                var cellmetadata = {};
                var cellMetaDataLength = 0;
                if (checkExists(data.icon))
                {
                    cellmetadata["icon"] = data.icon;
                    cellMetaDataLength++;
                }
                if (checkExists(data.value))
                {
                    cellmetadata["value"] = data.value;
                    cellMetaDataLength++;
                }
                if (checkExists(data.control))
                {
                    cellmetadata["control"] = data.control;
                    cellMetaDataLength++;
                }
                if (checkExists(data.counter))
                {
                    cellmetadata["counter"] = data.counter;
                    cellMetaDataLength++;
                }
                if (checkExists(data.fieldPropertyType))
                {
                    cellmetadata["fieldPropertyType"] = data.fieldPropertyType;
                    cellMetaDataLength++;
                }

                var currentColumn = this.columns[i];
                if (checkExists(currentColumn.hidden) && currentColumn.hidden) classes.push("hidden");

                if (checkExists(data.align) && data.align !== "none")
                {
                    classes.push(data.align.toLowerCase() + "-align");
                }
                else if (checkExists(currentColumn.align) && currentColumn.align !== "none")
                {
                    classes.push(currentColumn.align.toLowerCase() + "-align");
                }
                if (classes.length > 0) html += " class=\"" + classes.join(" ") + "\"";

                if (cellMetaDataLength > 0)
                {
                    html += " data-options=\"" + jQuery.toJSON(cellmetadata).htmlEncode() + "\"";
                }

                html += "><div class=\"grid-content-cell";

                if (checkExists(data.icon) && data.icon !== "") html += " icon " + data.icon;
                if (checkExists(data.cellclass) && data.cellclass !== "") html += " " + data.cellclass;

                if (!checkExists(data.align))
                {
                    if (checkExists(currentColumn.datatype) && currentColumn.datatype === "number") html += " numeric";
                }
                if (checkExists(currentColumn.control) && currentColumn.control !== "") html += " checkradio-cell";

                var displayValue = null;
                if (checkExistsNotEmpty(data.title) && data.title !== "&nbsp;")
                {
                    displayValue = data.title;
                    if (typeof displayValue === "string")
                    {
                        displayValue = this._escapeMetadataString(displayValue);
                    }
                }
                else if (checkExistsNotEmpty(data.display) && data.display !== "&nbsp;") //&nbsp; used to overwrite value and result in a blank field
                {
                    displayValue = data.display;
                    if (typeof displayValue === "string")
                    {
                        displayValue = this._getTooltip(data);
                    }
                }

                if (checkExists(displayValue))
                {
                    html += "\"><div class=\"grid-content-cell-wrapper\" title=\"" + displayValue + "\">";
                }
                else
                {
                    html += "\"><div class=\"grid-content-cell-wrapper\">";
                }

                if (checkExistsNotEmpty(data.html))
                {
                    html += data.html;
                }
                else
                {
                    if (checkExists(currentColumn.control) && (currentColumn.control === "checkbox" || currentColumn.control === "radiobutton"))
                    {
                        switch (currentColumn.control)
                        {
                            case "checkbox":
                                html += SCCheckbox.html({ checked: (currentColumn.datatype === "boolean" && data.value) });
                                break;
                            case "radiobutton":
                                html += SCRadiobutton.html({});
                                break;
                        }
                    }
                    else
                    {
                        var val = checkExists(data.display) ? data.display : data.value;
                        if (!data.isLiteral && typeof val === "string")
                        {
                            val = this._escapeMetadataString(val);
                        }
                        html += val;
                    }
                }
                html += "</div></div></td>";
            }

            html += "</tr>";
            return html;
        },

        _highlight: function (target)
        {
            if (checkExists(target))
            {
                if (typeof target === 'object') //if an object that needs to be highlighted
                {
                    this._findHighlightedAndClear();

                    if (target.length > 1)
                    {
                        target = $(target[target.length - 1]); //did this to ensure that only one row is highlighted; for now only one row can be highlighted at a time (but multiple rows can be selected)
                    }

                    target.addClass("highlighted");
                    this.previouslyHighlightedIndex = this._getHighlightedIndex();
                    return target;
                }
                else if (!isNaN(target)) //if an index
                {
                    var item = this._highlight(this._findByIndex(target));
                    this.previouslyHighlightedIndex = target;

                    return item;
                }
            }
        },

        _setRowFirstAndLastVisibleColumnClasses: function ()
        {
            var rows = this.contenttabletbody.find("tr");

            if (rows.length > 0)
            {
                for (var k = 0; k < rows.length; k++)
                {
                    var row = $(rows[k]);

                    var visibleColumns = row.find("td:not(.hidden)").removeClass("first last");
                    if (visibleColumns.length > 0)
                    {
                        $(visibleColumns[0]).addClass("first");
                        $(visibleColumns[visibleColumns.length - 1]).addClass("last");
                    }
                }
            }
        },

        _findByIndex: function (target)
        {
            if (!isNaN(target))
            {
                return $(this.contenttabletbody.children()[target]);
            }

            return -1;
        },

        _highlightNext: function (excludeActionRow)
        {
            var currentItem = this._findHighlightedAndClear();
            var currentItemIndex = this.contenttabletbody.children().index(currentItem);

            if (currentItemIndex !== -1 && currentItemIndex < this._getItemCount() - this.rowCountModifier)
            {
                // if its the second last item and there's an action row, focus the action row anchor instead of highlighting the row
                if (this.actionrow === true && currentItemIndex === this._getItemCount() - this.rowCountModifier - 1) // assuming the action row is always the last row
                {
                    if ((checkExists(excludeActionRow)) && (excludeActionRow === true))
                    {
                        return this._highlight(currentItem);
                    }
                    else
                    {
                        this.contenttabletbody.find("a.action-row").trigger("focus");
                        return null;
                    }
                }
                else
                {
                    var nextItem = currentItem.next();
                    this._highlight(nextItem);
                    this.adjustItemVisibility(nextItem);
                    return nextItem;
                }
            }
            else //last item in the list. Just rehighlight
            {
                return this._highlight(currentItem);
            }
        },

        _highlightPrevious: function ()
        {
            var currentItem = this._findHighlightedAndClear();
            var currentItemIndex = this.contenttabletbody.children().index(currentItem);

            if (currentItemIndex === -1)
            {
                return this._highlight(this._getItemCount() - this.rowCountModifier - 1);
            }
            else if (currentItemIndex > 0)
            {
                var previousItem = currentItem.prev();
                this._highlight(previousItem);
                this.adjustItemVisibility(previousItem);
                return previousItem;
            }
            else // beginning of the list, just rehighlight the same item
            {
                return this._highlight(currentItem);
            }

        },

        _getHighlightedIndex: function (item)
        {
            var itemIndex = -1;

            if (!checkExists(item) || typeof item !== 'object')
            {
                item = this._getHighlighted();
            }

            var allRows = this.contenttabletbody.children();

            itemIndex = allRows.index(item);

            for (var i = 0; i < allRows.length; i++)
            {
                if ((allRows[i].style.display === "none") && (i < itemIndex))
                {
                    itemIndex--;
                }
            }

            return itemIndex;
        },

        _findHighlightedAndClear: function (obj)
        {
            if (checkExists(obj))
            {
                if (typeof obj === 'object')
                {
                    obj.removeClass("highlighted");
                    return obj;
                }
                else
                {
                    return -1;
                }
            }
            else
            {
                return this._findHighlightedAndClear(this._getHighlighted());
            }
        },

        _highlightSelectedOrFirst: function ()
        {
            var highlighted = this._getHighlighted();
            if (highlighted.length === 0)
            {
                var selectedRow = this.contenttabletbody.find(".selected");

                if (checkExists(selectedRow) && (selectedRow.length > 1))
                {
                    selectedRow = $(selectedRow[selectedRow.length - 1]); //did this to ensure that only one row is highlighted; for now only one row can be highlighted at a time (but multiple rows can be selected)
                }

                highlighted = this._highlight(selectedRow);

                if (highlighted.length === 0)
                {
                    if (this._getItemCount() === 0 && this.actionrow === true)
                    {
                        this.contenttabletbody.find("a.action-row").trigger("focus");
                    }
                    else
                    {
                        highlighted = this._highlight(0);
                    }
                }
            }
        },

        _getHighlighted: function ()
        {
            return this.contenttabletbody.find(".highlighted");
        },

        _getItemCount: function ()
        {
            var itemCount = this.contenttabletbody.children().length;

            if (this.actionrow === true) /* will this thing stay constant through the life of the control?*/
            {
                itemCount--;
            }

            return itemCount;
        },

        _getRowPosition: function (currentRow)
        {
            if (!checkExists(currentRow))
            {
                currentRow = this.contenttable.find("tr.highlighted");
            }
            return this.contenttabletbody.children().index(currentRow);
        },

        _onKeyDown: function (event)
        {
            var self = (checkExists(event) && checkExists(event.data)) ? event.data : this;
            
            var processKeyEvents = (event.target.tagName.toLowerCase() !== "textarea");

            var ctrlKey = event.ctrlKey;
            if (event.metaKey)
            {
                ctrlKey = event.metaKey;
            }

            switch (event.which)
            {
                // Tab
                case 9:
                    var isEditing = self._isFocussedOnEditableItem();
                    var currentItem = self._getHighlighted();
                    var isActionRow = self._isActionRowActive();

                    if (!isEditing)
                    {
                        var currentRow = self.contenttable.find("tr.highlighted");
                        var currentItemIndex = self._getRowPosition(currentRow);

                        var tabItems = self._buildTabIndexArray(currentRow);
                        var tabItemsLength = tabItems.length;

                        if (event.shiftKey)
                        {
                            if (currentItemIndex !== 0 || self.lrCounter >= 0)
                            {
                                self._focusPreviousItem();

                                event.stopPropagation();
                                event.preventDefault();
                            }
                        }
                        else if (self.lrCounter < tabItemsLength && !isActionRow && currentItem.length > 0)
                        {
                            if (currentItemIndex <= self._getItemCount() - 1 - self.rowCountModifier || self.lrCounter < tabItemsLength - 1)
                            {
                                self._focusNextItem();

                                event.stopPropagation();
                                event.preventDefault();
                            }
                        }
                        else if (!isActionRow)
                        {
                            self.contenttable.trigger("focus");

                            self._highlight(self._getItemCount());

                            self.lrCounter = -1;
                            self._focusPreviousItem();

                            event.stopPropagation();
                            event.preventDefault();
                        }
                    }
                    break;

                //left arrow
                case 37:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (!isEditing)
                    {
                        if (self._isActionRowActive())
                        {
                            self.contenttable.trigger("focus");

                            self._highlight(self._getItemCount());

                            self.lrCounter = -1;
                        }
                        self._focusPreviousItem();
                    }
                    break;

                // right arrow
                case 39:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (!isEditing)
                    {
                        if (!self._isActionRowActive())
                        {
                            self._focusNextItem();
                        }
                    }
                    break;

                // Up Arrow
                case 38:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (!isEditing)
                    {
                        var isOnActionRowAnchor = self._isActionRowActive();

                        if (isOnActionRowAnchor)
                        {
                            var actionRow = self.contenttable.find("tr.action-row");
                            isOnActionRowAnchor = true;
                            // if isOnActionRowAnchor is true, then we can assume that document.activeElement does not throw an exception.
                            document.activeElement.blur();
                            self.contenttable.trigger("focus");
                            self._highlight(actionRow);
                            self.adjustItemVisibility(actionRow);
                        }

                        if (processKeyEvents && (!self._isFocussedOnEditableItem() || isOnActionRowAnchor))
                        {

                            if (self.previousFocussedItemColumn >= 0)
                            {
                                var result = false;

                                while (!result)
                                {
                                    var highlightedRow = self._highlightPrevious();
                                    var element = self._focusItemInColumn(self.previousFocussedItemColumn);

                                    if (element.length > 0)
                                    {
                                        result = true;

                                        // now we have to set the lrCounter to the correct value for this row.
                                        var currentRow = self.contenttable.find("tr.highlighted");
                                        var tabItems = self._buildTabIndexArray(currentRow);
                                        for (var i = 0, length = tabItems.length; i < length; i++)
                                        {
                                            if ($(tabItems[i]).is(element))
                                            {
                                                self.lrCounter = i;
                                            }
                                        }
                                    }
                                    else if (!checkExists(highlightedRow) || highlightedRow.length === 0 || self._getRowPosition(highlightedRow) === 0)
                                    {
                                        // There are no more items in this column, nothing is highlighted and will result in an endless loop if we don't break.
                                        self.lrCounter = -1;
                                        self.previousFocussedItemColumn = -1;
                                        self.contenttable.trigger("focus");
                                        break;
                                    }
                                }
                            }
                            else
                            {
                                var prevRow = self._highlightPrevious();

                                if (self.multiselect && event.shiftKey)
                                {
                                    self._handleClick(event, self, prevRow);
                                }
                            }
                        }
                    }

                    //The user would want to navigate within the textarea, so dont preventDefault for textarea
                    if (event.target.tagName.toLowerCase() !== "textarea")
                    {
                        event.preventDefault();
                    }
                    break;
                // Down Arrow
                case 40:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (!isEditing && processKeyEvents)
                    {
                        if (self.previousFocussedItemColumn >= 0 && !self._isActionRowActive())
                        {
                            var result = false;
                            var numberOfItems = self._getItemCount();

                            while (!result)
                            {
                                var nextRow = self._highlightNext();

                                var element = self._focusItemInColumn(self.previousFocussedItemColumn);
                                var currentPosition = self._getRowPosition();

                                if (element.length > 0)
                                {
                                    result = true;
                                    var currentRow = self.contenttable.find("tr.highlighted");
                                    var tabItems = self._buildTabIndexArray(currentRow);

                                    for (var i = 0, length = tabItems.length; i < length; i++)
                                    {
                                        if ($(tabItems[i]).is(element))
                                        {
                                            self.lrCounter = i;
                                        }
                                    }
                                }
                                else
                                {
                                    if (!checkExists(nextRow) || nextRow.length === 0 || self._getRowPosition(nextRow) === self._getItemCount() - 1)
                                    {
                                        // something went wrong or there are no more items in this column, nothing is highlighted and will result in an endless loop if we don't break.
                                        self.lrCounter = -1;
                                        self.previousFocussedItemColumn = -1;
                                        self.contenttable.trigger("focus");
                                        break;
                                    }
                                }
                            }
                        }
                        else
                        {
                            if (self.multiselect && event.shiftKey)
                            {
                                var nextRow = self._highlightNext(true);
                                self._handleClick(event, self, nextRow);
                            }
                            else
                            {
                                self._highlightNext();
                            }
                        }
                        //The user would want to navigate within the textarea, so dont preventDefault for textarea
                    }

                    if (event.target.tagName.toLowerCase() !== "textarea")
                    {
                        event.preventDefault();
                    }
                    break;
                // enter
                case 13:
                    var hasClassOfAttachment = false;
                    var eventClass = event.target.className;
                    //attachment controls 
                    if (checkExists(eventClass) && typeof (eventClass) === "string")
                    {
                        hasClassOfAttachment = $(event.target).hasClass("file-wrapper");
                    }

                    if (event.target.tagName.toLowerCase() !== "textarea" && !hasClassOfAttachment && event.target.getAttribute("contentEditable") !== "true")
                    {
                        var currentItem = self._getHighlighted();

                        var editedRow = self.contenttabletbody.children("tr.edit-template-row");

                        if (document.activeElement === self.contenttable[0])
                        {
                            event.preventDefault();
                        }

                        if (self.enterCommitsRow && editedRow.length > 0)
                        {
                            event.preventDefault();
                            var editedColumn = editedRow.find(".focus");

                            if (editedColumn.length > 0)
                            {
                                editedColumn.trigger("blur"); // trigger blur so that the hidden xml is updated
                            }
                            else
                            {
                                try // sometimes getting the active element will throw an exception
                                {
                                    var activeElement = document.activeElement;
                                    if (checkExists(activeElement))
                                    {
                                        $(activeElement).trigger("blur");
                                    }
                                }
                                catch (e) //dont do anything, it just means that the last column edited will not be committed.
                                { }
                            }

                            var mainGrid = self.contenttable.parents(".grid");
                            var actionType = mainGrid[0].getAttribute("actionType");

                            //Do a row commit without triggering rowclick event
                            //Reason: rules based on rowclick events might fail, because there will be no selected row after comitting
                            self._trigger('commitrowwithkey', event, editedRow);

                            if (actionType === "add" && self.actionrow === true)
                            {
                                self._findHighlightedAndClear();
                                self.contenttabletbody.find("a.action-row").trigger("focus");

                                event.preventDefault();
                                event.stopPropagation();
                            }
                            else
                            {
                                self.contenttable.trigger("focus");
                                self.adjustItemVisibility(self._getHighlighted());
                            }
                        }
                        else
                        {
                            if (self.actionrow === true && event.target === self.contenttabletbody.find("a.action-row")[0])
                            {
                                self._findHighlightedAndClear();
                                self.deselect();
                                event.preventDefault();
                                self._trigger('actionrowclick', event, $(this));

                            }
                            else // for a normal row we need more info
                            {
                                self._handleClick(event, self, currentItem, ctrlKey, null, true);
                                event.preventDefault();
                                currentItem.trigger("dblclick", self);
                            }
                        }
                    }
                    break;

                // space
                case 32:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (document.activeElement === self.contenttable[0] || $(document.activeElement).hasClass("action-row"))
                    {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    if (!isEditing)
                    {
                        var currentItem = self._getHighlighted();

                        if (currentItem.hasClass("action-row") || $(document.activeElement).hasClass("action-row"))
                        {
                            self._findHighlightedAndClear();
                            self.deselect();
                            self._trigger('actionrowclick', event, $(this));
                        }
                        else // for a normal row we need more info
                        {
                            self._handleClick(event, self, currentItem, ctrlKey);      
                        }
                    }
                    break;
                // escape
                case 27:
                    if (!$(document.activeElement).is("a.action-row"))
                    {
                        self.lrCounter = -1;
                        self.previousFocussedItemColumn = -1;
                        self.contenttable.trigger("focus");
                    }
                    break;
                //CTRL + A - Select All OR COMMAND + A (Mac)
                case 65:
                    if (ctrlKey)
                    {
                        var isEditing = self._isFocussedOnEditableItem();
                        if (!isEditing && processKeyEvents)
                        {
                            if (self.multiselect)
                            {
                                var rows = self.fetch("unselected-rows");

                                for (var i = 0; i < rows.length; i++)
                                {
                                    var curRow = $(rows[i]);

                                    self._handleClick(event, self, curRow);
                                }
                            }

                            return false;
                        }
                    }
                    break;
                // CTRL + C - Copy OR COMMAND + C (Mac)
                case 67:
                    var isEditing = self._isFocussedOnEditableItem();
                    if (ctrlKey && !isEditing)
                    {
                        if (self.cellcontentselect !== true)
                        {
                            self._copySelectedRowsToClipboard.call(self, event);
                        }
                    }
                    break;
            }
        },

        _copySelectedRowsToClipboard: function (event)
        {
            event.preventDefault();

            var selectedRowsText = this.fetch("selected-rows", "text");

            var htmlData = "<html><table>";
            var textData = "";

            for (var i = 0; i < selectedRowsText.length; i++)
            {
                var rowText = selectedRowsText[i];
                htmlData += "<tr>";

                for (var y = 0; y < rowText.length; y++)
                {
                    var cellText = rowText[y];

                    htmlData += "<td>" + cellText + "</td>";
                    textData += cellText + "\t";
                }

                htmlData += "</tr>";
                textData += "\r\n";
            }

            htmlData += "</table></html>";

            var oldStyleCopy = function ()
            {
                var focusedElem = document.activeElement;
                var jqWindow = jQuery(window);

                var top = jqWindow.scrollTop();
                var left = jqWindow.scrollLeft();

                // Start with a reliable way of copying.
                var hiddenInput = jQuery('<textarea style="display:block;width:2px;height:2px;position:absolute;top:{0}px;left:{1}px;"></textarea>'.format(top, left));
                jQuery("body").append(hiddenInput);

                hiddenInput.val(textData);

                hiddenInput.trigger("focus");
                hiddenInput[0].setSelectionRange(0, hiddenInput[0].value.length);

                document.execCommand("copy");

                // Cleanup
                hiddenInput.remove();

                if (checkExists(focusedElem))
                {
                    focusedElem.focus();
                }
                jqWindow.scrollTop(top);
                jqWindow.scrollLeft(left);
            }

            // If the browser supports settingthe clipboard, enhance it with HTML data.
            var enhance = true;
            var enhanceClipboardF = function (evt)
            {
                if (enhance)
                {
                    // Enhanced copy must bind as a single shot event, it is rebound each time a copy occurs
                    document.removeEventListener('copy', enhanceClipboardF);
                    try
                    {
                        evt.clipboardData.setData('text/plain', textData);
                        evt.clipboardData.setData('text/html', htmlData);
                        evt.preventDefault();
                    }
                    catch (ex)
                    {
                        // The browser has denied access.  Remove the enhancement and retry.
                        enhance = false;
                        oldStyleCopy();
                    }
                }
            };

            if (SourceCode.Forms.Browser.edge)
            {
                oldStyleCopy();
            }
            else
            {
                document.addEventListener('copy', enhanceClipboardF);
                oldStyleCopy();
            }
        },

        _isActionRowActive: function ()
        {
            try // sometimes getting the active element will throw an exception
            {
                var activeElement = document.activeElement;
                if (checkExists(activeElement))
                {
                    return $(activeElement).hasClass("action-row");
                }
            }
            catch (e) // just return false. It should only mean some less than perfect tabbing. This should only happen if nothing has focus anyway.
            {
                return false;
            }
        },

        _focusNextItem: function ()
        {
            // The number of elements that are tabbable may change therefore the array of tab indices is repopulated on each function call.
            // For example when a hyperlink that didn't have a value is dynamically set with a value.
            var currentRow = this.contenttable.find("tr.highlighted");
            var tabItems = this._buildTabIndexArray(currentRow);
            var tabItemsLength = tabItems.length;

            if (tabItemsLength - 1 !== this.lrCounter || this._getRowPosition(currentRow) !== this._getItemCount() - 1 || this.actionrow)
            {
                this.lrCounter++;

                if (this.lrCounter >= tabItems.length)
                {
                    this.lrCounter = -1;
                    this.previousFocussedItemColumn = -1;

                    this.contenttable.trigger("focus");

                    this._highlightNext();
                }
                else if (this.lrCounter >= 0 && checkExists(tabItems[this.lrCounter]))
                {
                    try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                    {
                        $(tabItems[this.lrCounter]).trigger("focus");
                    }
                    catch (e)
                    { }
                    this.previousFocussedItemColumn = $(tabItems[this.lrCounter]).closest("td")[0].cellIndex;
                }
            }

        },

        _focusPreviousItem: function ()
        {
            this.lrCounter--;

            // we calculate the stuff every time, as the number of elements can change. 
            // For example if a hyperlink is empty or has a value
            var currentRow = this.contenttable.find("tr.highlighted");
            var tabItems = this._buildTabIndexArray(currentRow);
            var tabItemsLength = tabItems.length;

            if (this.lrCounter < -1)
            {
                this._highlightPrevious();

                currentRow = this.contenttable.find("tr.highlighted");
                tabItems = this._buildTabIndexArray(currentRow);
                tabItemsLength = tabItems.length;

                this.lrCounter = tabItemsLength - 1;

                if (checkExists(tabItems[this.lrCounter]))
                {
                    this.previousFocussedItemColumn = $(tabItems[this.lrCounter]).closest("td")[0].cellIndex;
                    try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                    {
                        $(tabItems[this.lrCounter]).trigger("focus");
                    }
                    catch (e)
                    { }
                }
                else
                {
                    this.previousFocussedItemColumn = -1;
                    this.contenttable.trigger("focus");
                }
            }
            else if (this.lrCounter === -1)
            {
                this.previousFocussedItemColumn = -1;
                this.contenttable.trigger("focus");
            }
            else if (tabItemsLength > 0 && this.lrCounter >= 0)
            {
                this.previousFocussedItemColumn = $(tabItems[this.lrCounter]).closest("td")[0].cellIndex;
                try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                {
                    $(tabItems[this.lrCounter]).trigger("focus");
                }
                catch (e)
                { }
            }
        },

        _focusItemInColumn: function (columnNumber)
        {
            var cells = this.contenttable.find("tr.highlighted > td");
            var result = false;

            try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
            {
                result = $(cells[columnNumber]).find("input[tabindex!=-1]:not(.disabled), a[tabindex!=-1], [tabindex][tabindex!='-1']:not(.disabled)").first().trigger("focus");
            }
            catch (e)
            { }

            return result;
        },

        _buildTabIndexArray: function ($row)
        {
            return $row.find("td:not(.hidden) input[type='radio'][tabindex!='-1']:not(.disabled), td:not(.hidden) :not(div.HyperlinkPopupOuterWrapper) [tabindex][tabindex!='-1'][disabled!='disabled']:not(.disabled)");
        },

        _isFocussedOnEditableItem: function ()
        {
            if (checkExists(document.activeElement))
            {
                return this.contenttable.find(".edit-template-row").has(document.activeElement).length > 0;
            }
            return false;
        },

        // This will only be called during runtime when keyboard accessibility is enabled
        adjustItemVisibility: function (item)
        {
            if (!checkExists(item))
            {
                item = this._getHighlighted();
            }

            if (!checkExists(this.scrollWrapper))
            {
                this.scrollWrapper = this._getScrollWrapper(item);
            }

            // No scroll wrappers found. Nothing to scroll
            if (this.scrollWrapper === -1)
            {
                return false;
            }

            var itemTop = item.offset().top;
            var itemHeight = item.height();
            var itemBottom = itemTop + itemHeight;

            // since we only allow keyboard commands from the command line, we will always use this method
            var $document = $(document);
            var windowHeight = $(window).height();
            var documentScrollTop = $document.scrollTop();

            if (itemBottom > documentScrollTop)
            {
                $document.scrollTop(itemBottom - windowHeight);
            }
            else if (itemTop < (documentScrollTop - windowHeight))
            {
                $document.scrollTop(itemTop);
            }
        },

        _getScrollWrapper: function (item)
        {
            var wrappers = item.parents(":scrollable(y)");
            var wrappersLength = wrappers.length;

            if (wrappersLength === 0)
            {
                return -1;
            }

            for (var i = 0; i < wrappersLength; i++)
            {
                if (wrappers[i].scrollHeight > $(wrappers[i]).height())
                {
                    return $(wrappers[i]);
                }
            }

            // else just return the last one. It should be the body.
            return $(wrappers[wrappersLength - 1]);
        },

        _buildPagingControls: function ()
        {
            var self = this;

            this.element.removeClass("without-footer").addClass("with-footer");

            if (this.element.children(".grid-footer").length === 0)
            {
                this.element.append("<div class=\"grid-footer\"></div>");
            }

            if (this.element.children(".grid-footer").children(".toolbars").length === 0)
            {
                var toolbarGroupOptions =
                {
                    toolbars: 1,
                    toolbarOptions:
                        [
                            {
                                buttons:
                                    [
                                        { icon: "paging-first", description: Resources.CommonLabels.PagingFirstPageText, tabIndex: this.tabIndex },
                                        { icon: "paging-left", description: Resources.CommonLabels.PagingPreviousPageText, tabIndex: this.tabIndex },
                                        { icon: "paging-right", description: Resources.CommonLabels.PagingNextPageText, tabIndex: this.tabIndex },
                                        { icon: "paging-last", description: Resources.CommonLabels.PagingLastPageText, tabIndex: this.tabIndex }
                                    ]
                            }
                        ]
                }
                this.element.children(".grid-footer").append(SourceCode.Forms.Controls.ToolbarGroup.html(toolbarGroupOptions));

                this.footer = this.element.children(".grid-footer").children(".toolbars").toolbargroup();

                var txtbxhtml = "<div class=\"toolbar-divider\"></div>";

                txtbxhtml += "<div class=\"grid-paging-control\"><div class=\"grid-paging-control-text current\">" + Resources.CommonLabels.PagingPageText
                    + "</div>" + SCTextbox.html({ id: (this.element.attr("id") + "_pagingtxtbox"), value: "1", tabIndex: this.tabIndex })
                    + "<div class=\"grid-paging-control-text total\">" + (Resources.CommonLabels.PagingTotalPagesText.replace("{0}", "1")) + "</div></div>";

                var injpnt = this.footer.find(".toolbar-button.paging-left");

                jQuery(txtbxhtml).insertAfter(injpnt);

                this.footer.find(".input-control.text-input").addClass("small").textbox();
                this.footer.find(".grid-paging-control-text.total")[0].style.display = "none";
                this.footer.find(".toolbar-button.paging-last")[0].style.display = "none";

                this.unhide("footer");

                this.footer.find(".toolbar-button.paging-first, .toolbar-button.paging-left, .toolbar-button.paging-right, .toolbar-button.paging-last").on("click", function (ev)
                {

                    if (!jQuery(this).hasClass("disabled"))
                    {
                        if (jQuery(this).hasClass("paging-first"))
                        {
                            self.gotopage("start", self.page, self.element);
                        } else if (jQuery(this).hasClass("paging-left"))
                        {
                            self.gotopage("previous", self.page, self.element);
                        } else if (jQuery(this).hasClass("paging-right"))
                        {
                            self.gotopage("next", self.page, self.element);
                        } else if (jQuery(this).hasClass("paging-last"))
                        {
                            self.gotopage("end", self.page, self.element);
                        }
                    }

                });

                this.footer.find(".input-control.text-input input[type=text]").on("blur", function ()
                {
                    self._changePage();
                }).on("keyup", function (ev)
                {
                    if (ev.keyCode === 13)
                    {
                        self._changePage();

                        jQuery(this).get(0).focus();
                    }
                }).on("keypress", function (ev)
                {

                    var kc = (ev.which !== 0) ? ev.which : ev.keyCode;
                    var p = self.options.page;
                    var tp = self.options.totalpages;
                    var gtp = parseInt(jQuery(this).val());

                    if (isNaN(gtp)) gtp = 0;

                    // 9 = tab
                    // 8 = backspace
                    // 46 - 57 = delete and numbers
                    // 33 - 40 = arrows and pgup/pgdown

                    if ((kc > 45 && kc < 58) || (kc > 32 && kc < 41) || kc === 8 || kc === 9)
                    {

                        if (kc !== 8 || kc !== 9)
                        {
                            if (gtp !== 0 && checkExists(tp) && tp === "-1" && gtp.toString().length >= tp.toString().length)
                            {
                                ev.preventDefault();
                                ev.stopPropagation();
                                return false;
                            }
                        }

                    }
                    else
                    {
                        ev.preventDefault();
                        ev.stopPropagation();
                        return false;
                    }

                });

            }

            if (SourceCode.Forms.Browser.msie)
            {
                var tbButtons = this.footer.find(".toolbar-button");
                var ltb = tbButtons.length;
                while (ltb--)
                {
                    tbButtons[ltb].setAttribute("onclick", "return false");
                }
            }
            self._updatePagingControls();

        },

        _addHeader: function ()
        {

            if (this.header === null)
            {
                this.header = $("<div class=\"grid-header\"><div class=\"grid-header-l\"></div><div class=\"grid-header-c\">"
                    + "<div class=\"grid-header-wrapper\"><div class=\"grid-header-text\"></div></div>"
                    + "</div><div class=\"grid-header-r\"></div></div>").insertBefore(this.element.children(":first-child")).find(".grid-header-text");

                this.element.removeClass("without-header").addClass("with-header");
            }
            //LG: Tweaked
            //TFS74331: Must be HTML Encoded
            this.header.html(arguments[0].htmlEncode());

        },

        _addToolbar: function ()
        {

            if (this.toolbars === null)
            {
                this.toolbars = $("<div class=\"grid-toolbars\"><div class=\"toolbars\"></div></div>").insertBefore(this.element.children(".grid-body")).find(".toolbars");
                this.toolbars.toolbargroup();
                this.element.removeClass("without-toolbar");
            }

            this.toolbars.toolbargroup("addtoolbar");

            switch (this.toolbars.toolbargroup("fetch", "toolbars").length)
            {
                case 1:
                    this.element.addClass("with-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
                    break;
                case 2:
                    this.element.addClass("with-double-toolbar").removeClass("with-toolbar").removeClass("with-triple-toolbar");
                    break;
                case 3:
                    this.element.addClass("with-triple-toolbar").removeClass("with-double-toolbar").removeClass("with-toolbar");
                    break;
            }

        },

        _buildColumns: function ()
        {
            var html = this._generateColumnsHeaderCellsHTML({ columns: this.columns, customcolumns: this.customcolumns });

            this.columnsheadertable.children("tbody").html(html);

            this.columnsheadertable.find("input.input-control[type=checkbox]").checkbox();

            if (this.actionrow) this.contenttabletbody.children("tr.action-row").attr("colspan", this.columns.length);
        },

        _buildFooter: function ()
        {

            if (this.footer === null)
            {
                var html = this._generateFooterHTML();

                this.element.append(html);

                this.element.removeClass("without-footer").addClass("with-footer");
            }

            this.footer = this.element.children(".grid-footer").children(".toolbars").toolbargroup();

        },

        zebra: function ()
        {
            this._applyZebraStripes();
        },

        _applyZebraStripes: function ()
        {
            if (this.options.zebraStripes)
            {

                if (SourceCode.Forms.Browser.msie && parseInt(SourceCode.Forms.Browser.version, 10) === 8)
                {
                    var odd = false, rows = this.contenttabletbody.children("tr");
                    for (var i = 0, l = rows.length; i < l; i++)
                    {
                        var row = $(rows[i]);
                        row.removeClass("even");
                        if (!row.hasClass("hidden"))
                        {
                            if (odd === false)
                            {
                                row.addClass("even");
                                odd = true;
                            }
                            else
                                odd = false;
                        }
                    }
                }
                else
                {
                    this.contenttable.addClass("zebra-stripes");
                }
            }
        },

        clear: function ()
        {
            var retainSort = arguments[0];
            if (this.contenttabletbody.children("tr.edit-template-row").length > 0) this.commit();

            if (!checkExists(this.options.customsort) && (!checkExists(retainSort) || retainSort === false))
            {
                this.clearsort();
            }

            var actionRowFocussed = false;

            if (checkExists(document.activeElement))
            {
                if ($(document.activeElement).is("a.action-row"))
                {
                    actionRowFocussed = true;
                }
            }

            //this.contenttabletbody.children("tr:not(.action-row)").remove();
            var actionRow = this.contenttabletbody.children("tr.action-row").clone(true);
            this.contenttabletbody.empty();	//empty is faster than removing all non-action rows		
            if (!this.actionrow)
            {
                this.contenttabletbody.html("<tr class=\"empty-grid\">"
                    + "<td class=\"empty-grid\"" + ((this.columns.length > 0) ? " colspan=\"" + this.columns.length + "\"" : "") + ">"
                    + "<div class=\"grid-content-cell\"><div class=\"grid-content-cell-wrapper\">" + this.resources.emptygrid + "</div></div></td></tr>");
            }
            else if (actionRow.length > 0)
            {
                this.contenttabletbody.append(actionRow);
                if (actionRowFocussed === true)
                {
                    this._findHighlightedAndClear();
                    this.contenttabletbody.find("a.action-row").trigger("focus");
                }
            }

            this.element.addClass("empty");

            if (!this.isRuntime)
            {
                this.previouslySelectedIndexes = [];
                this.previouslyHighlightedIndex = -1;
            }

            this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row)");
        },

        populate: function ()
        {

            var self = this;

            $.ajax({

                type: self.options.method,
                url: self.options.url,
                dataType: self.options.datatype,
                data: (checkExists(self.options.urldata)) ? self.options.urldata : {},

                success: function (xml)
                {

                    if ($(xml).find("header").length > 0) self._addHeader($(xml).find("header").text());

                    if ($(xml).find("columns").length > 0) self._importColumns($(xml).find("columns"));

                    if ($(xml).find("rows").length > 0) self._importData($(xml).find("rows"));

                },

                error: function (xml)
                {

                }

            });

        },

        _importColumns: function ()
        {

            var columns = $(arguments[0]).children("column");

            this.columns = [];

            for (var i = 0, l = columns.length; i < l; i++)
            {

                var colops = {};

                var opts = ["name", "sortable", "align", "datatype", "hidden", "control", "modulus"];

                for (var j = 0, k = opts.length; j < k; j++)
                {
                    if (checkExists(columns.eq(i).attr(opts[j])))
                    {
                        colops[opts[j]] = (columns.eq(i).attr(opts[j]) === "true" || columns.eq(i).attr(opts[j]) === "false") ? (columns.eq(i).attr(opts[j]) === "true" ? true : false) : columns.eq(i).attr(opts[j]);
                    }
                }

                if (checkExists(columns.eq(i).attr("width")))
                {
                    colops.width = columns.eq(i).attr("width");
                }

                if (!checkExists(colops.display)) colops.display = columns.eq(i).text();

                this.columns.push(colops);
            }

            this._buildColumns();

        },

        _importData: function ()
        {

            this.clear();

            var rows = $(arguments[0]).children("row");

            for (var i = 0, l = rows.length; i < l; i++)
            {

                var data = [];

                for (var j = 0, k = this.columns.length; j < k; j++)
                {

                    var item = {};

                    var cell = rows.eq(i).children("cell[column='" + this.columns[j].name + "']")

                    item.display = cell.text();

                    item.value = (cell.attr("value") !== undefined && cell.attr("value") !== "") ? cell.attr("value") : cell.text();

                    if (cell.attr("icon") !== "") item.icon = cell.attr("icon");

                    data.push(item);

                }

                this._addRow(data, false);

            }

            if (this.options.paging)
            {
                if ($(arguments[0]).attr("page") !== "") this.page = parseInt($(arguments[0]).attr("page")) + 1;

                var totalrows = ($(arguments[0]).attr("total") !== "") ? parseInt($(arguments[0]).attr("total")) : 0;
                var pagesize = ($(arguments[0]).attr("rows") !== "") ? parseInt($(arguments[0]).attr("rows")) : 0;
                this.page = ($(arguments[0]).attr("page") !== "") ? parseInt($(arguments[0]).attr("page")) + 1 : 1;
                this.totalpages = (pagesize > 0) ? Math.ceil(totalrows / pagesize) : 1;

                this._updatePagingControls();
            }

            this._syncWidths();

        },

        remove: function ()
        {
            switch (arguments[0])
            {
                case "header":
                    if (checkExists(this.header))
                    {
                        this.header.closest(".grid-header").remove();
                    }
                    this.header = null;
                    this.element.removeClass("with-header").addClass("without-header");
                    break;
                case "footer":
                    if (checkExists(this.footer))
                    {
                        this.footer.closest(".grid-footer").remove();
                    }
                    this.footer = null;
                    this.panel.removeClass("with-footer").addClass("without-footer");
                    break;
                case "toolbars":
                    if (checkExists(this.toolbars) || this.toolbars.length > 0)
                    {
                        this.element.children(".grid-toolbars").remove();
                    }
                    this.toolbars = null;
                    this.element.removeClass("with-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar").addClass("without-toolbar");
                    break;
                case "row":
                    this.contenttabletbody.children("tr:not(.action-row)").eq(parseInt(arguments[1])).remove();
                    this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

                    this.previouslySelectedIndexes = [];
                    this.previouslyHighlightedIndex = this._getHighlightedIndex();

                    if (this.rows.length < 1)
                    {
                        this.clear();
                    }
                    else
                    {
                        var selectedRows = this.fetch("selected-rows");

                        for (var i = 0; i < selectedRows.length; i++)
                        {
                            this.previouslySelectedIndexes.push(this.rows[0].indexOf(selectedRows[i]));
                        }
                    }

                    var _syncWidths = arguments[2];

                    if (_syncWidths === undefined || _syncWidths === true)
                        this._syncWidths();
                    else
                        this._applyZebraStripes();

                    break;
                case "selected-row":
                case "selected-rows":
                    this.fetch("selected-rows").remove();
                    this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");
                    this.previouslySelectedIndexes = [];
                    this.previouslyHighlightedIndex = this._getHighlightedIndex();
                    if (this.rows.length < 1) this.clear();
                    this._syncWidths();
                    break;
                case "first-selected-row":
                    this.fetch("first-selected-row").remove();
                    this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

                    this.previouslySelectedIndexes = [];
                    this.previouslyHighlightedIndex = this._getHighlightedIndex();

                    if (this.rows.length < 1)
                    {
                        this.clear();
                    }
                    else
                    {
                        var selectedRows = this.fetch("selected-rows");

                        for (var i = 0; i < selectedRows.length; i++)
                        {
                            this.previouslySelectedIndexes.push(this.rows.index(selectedRows[i]));
                        }
                    }

                    var _syncWidths = arguments[1];

                    if (_syncWidths === undefined || _syncWidths === true)
                        this._syncWidths();
                    else
                        this._applyZebraStripes();

                    break;
            }
        },

        _applyActionRow: function ()
        {
            function visibleColumnsOnly(element, index, array)
            {
                return (checkExists(element.hidden) && element.hidden === true) ? false : true;
            }

            var self = this;

            var actionlink = this.contenttabletbody.find("a.action-row");

            if (actionlink.length === 0)
            {

                var html = "<tr class=\"action-row\">"
                    + "<td class=\"action-row\"" + ((checkExists(this.columns) && this.columns.length > 0) ? " colspan=\"" + this.columns.filter(visibleColumnsOnly).length + "\"" : "") + ">"
                    + "<div class=\"grid-content-cell\"><div class=\"grid-content-cell-wrapper\">"
                    + "<a href=\"javascript:;\" class=\"action-row\" tabindex=\"" + this.tabindex + "\">" + this.resources.actionrow + "</a></div></div></td></tr>";

                this.contenttabletbody.append(html);

                actionlink = this.contenttabletbody.find("a.action-row");

            }

            actionlink.closest("tr.action-row").on("click", function (event)
            {
                self._findHighlightedAndClear();
                self.deselect();
                self._trigger('actionrowclick', event, $(this));
            });
        },

        getActionRow: function ()
        {
            return this.contenttabletbody.find("a.action-row");
        },

        getContentTable: function ()
        {
            return this.contenttable;
        },

        select: function (selectedIndexes, event)
        {
            var rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

            if (checkExists(selectedIndexes))
            {
                var indexes = selectedIndexes || [];

                var ev = checkExists(event) ? event : null;

                var currentRow = null;
                for (var i = 0, l = indexes.length; i < l; i++)
                {
                    currentRow = $(rows[indexes[i]]);

                    if (!currentRow.hasClass("highlighted"))
                    {
                        this._findHighlightedAndClear();

                        if (this.isRuntime)
                        {
                            this._highlight(currentRow);
                        }
                    }

                    if ((!checkExists(this.initialGroupSelectedRow)) || ((checkExists(ev)) && (ev.shiftKey === false)))
                    {
                        this.initialGroupSelectedRow = currentRow;
                        this.groupSelectedRows = [];
                    }

                    if (!currentRow.hasClass("selected"))
                    {
                        currentRow.addClass("selected");

                        this.groupSelectedRows.push(indexes[i]);
                        this.previouslySelectedIndexes.push(indexes[i]);
                        if (this.options.singleEventOnMultiSelect === false)
                        {
                            this._trigger('rowselect', ev, currentRow);
                        }
                    }
                }
                if (this.options.singleEventOnMultiSelect === true)
                {
                    this._trigger('rowselect', ev, currentRow, indexes);
                }
            }
            else
            {
                var ev = checkExists(event) ? event : null;
                var changedIndexes = [];
                var currentRow = null;
                for (var i = 0, l = rows.length; i < l; i++)
                {
                    currentRow = $(rows[i]);

                    if (!currentRow.hasClass("highlighted"))
                    {
                        this._findHighlightedAndClear();
                        if (this.isRuntime)
                        {
                            this._highlight(currentRow);
                        }
                    }

                    if ((!checkExists(this.initialGroupSelectedRow)) || ((checkExists(ev)) && (ev.shiftKey === false)))
                    {
                        this.initialGroupSelectedRow = currentRow;
                        this.groupSelectedRows = [];
                    }

                    if (!currentRow.hasClass("selected"))
                    {
                        changedIndexes.push(i);
                        currentRow.addClass("selected");

                        this.groupSelectedRows.push(i);
                        this.previouslySelectedIndexes.push(i);
                        if (this.options.singleEventOnMultiSelect === false)
                        {
                            this._trigger('rowselect', ev, currentRow);
                        }
                    }
                }
                if (this.options.singleEventOnMultiSelect === true)
                {
                    this._trigger('rowselect', ev, currentRow, changedIndexes);
                }
            }
        },

        deselect: function ()
        {
            var rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

            if (checkExists(arguments[0]))
            {
                var indexes = arguments[0] || [];

                var ev = checkExists(arguments[1]) ? arguments[1] : null;
                var currentRow = null;
                for (var i = 0, l = indexes.length; i < l; i++)
                {
                    currentRow = rows.eq(indexes[i]);
                    if (currentRow.hasClass("selected"))
                    {

                        currentRow.removeClass("selected");

                        var indexInGroupSelectedRows = this.groupSelectedRows.indexOf(indexes[i]);

                        if (indexInGroupSelectedRows !== -1)
                        {
                            this.groupSelectedRows.splice(indexInGroupSelectedRows, 1);
                        }

                        var indexInPrevSelectedIndexes = this.previouslySelectedIndexes.indexOf(indexes[i]);

                        if (indexInPrevSelectedIndexes !== -1)
                        {
                            this.previouslySelectedIndexes.splice(indexInPrevSelectedIndexes, 1);
                        }
                        if (this.options.singleEventOnMultiSelect === false)
                        {
                            this._trigger('rowunselect', ev, currentRow);
                        }
                    }
                }
                if (this.options.singleEventOnMultiSelect === true)
                {
                    this._trigger('rowunselect', ev, currentRow, indexes);
                }

            }
            else
            {
                var changedIndexes = [];
                var currentRow = null;
                for (var i = 0, l = rows.length; i < l; i++)
                {
                    currentRow = rows.eq(i);
                    if (currentRow.hasClass("selected"))
                    {
                        changedIndexes.push(i);
                        currentRow.removeClass("selected");

                        var indexInGroupSelectedRows = this.groupSelectedRows.indexOf(i);

                        if (indexInGroupSelectedRows !== -1)
                        {
                            this.groupSelectedRows.splice(indexInGroupSelectedRows, 1);
                        }

                        var indexInPrevSelectedIndexes = this.previouslySelectedIndexes.indexOf(i);

                        if (indexInPrevSelectedIndexes !== -1)
                        {
                            this.previouslySelectedIndexes.splice(indexInPrevSelectedIndexes, 1);
                        }
                        if (this.options.singleEventOnMultiSelect === false)
                        {
                            this._trigger('rowunselect', ev, currentRow);
                        }
                    }
                }
                if (this.options.singleEventOnMultiSelect === true)
                {
                    this._trigger('rowunselect', ev, currentRow, changedIndexes);
                }

            }

        },

        _trigger: function (type, event, data)
        {
            var callback = this.options[type],
                eventName = (type === this.widgetEventPrefix
                    ? type : this.widgetEventPrefix + type);

            event = $.Event(event);
            event.type = eventName;

            // copy original event properties over to the new event
            // this would happen if we could call $.event.fix instead of $.Event
            // but we don't have a way to force an event to be fixed multiple times
            if (event.originalEvent)
            {
                for (var i = $.event.props.length, prop; i;)
                {
                    prop = $.event.props[--i];
                    event[prop] = event.originalEvent[prop];
                }
            }

            this.element.trigger(event, data);

            return !(typeof callback === "function" && callback.call(this.element[0], data, event) === false
                || event.isDefaultPrevented());
        },

        moverowup: function (index)
        {
            if (index > 0) this.moverow(index, index - 1);
        },

        moverowdown: function (index)
        {
            if (index < (this.rows.length - 1)) this.moverow(index, index + 1);
        },

        moverow: function (from, to)
        {
            if (from === to)
                return;

            this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");
            if (to === (this.rows.length - 1))
            {
                this.rows.eq(from).insertAfter(this.rows.eq(to));
            } else
            {
                if (from < to)
                {
                    this.rows.eq(from).insertAfter(this.rows.eq(to));
                } else
                {
                    this.rows.eq(from).insertBefore(this.rows.eq(to));
                }
            }
            this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

            this._applyZebraStripes();
        },

        //function will update all column widths when a column is dynamically hidden or shown
        _toggleColumn: function (colindex, value)
        {
            var isHidden = !value;
            var editTemplateTable = this.element.find("table.grid-edit-templates-table");
            var displayTemplateTable = this.element.find("table.grid-display-templates-table");
            var summaryContentTable = this.element.find("table.grid-summary-content-table");
            var usesBucketWidth = this.element.hasClass("bw");

            this.columns[colindex].hidden = isHidden;

            var nthChild = (colindex + 1);
            var colSelector = "col:nth-child(" + nthChild + ")";
            var cellSelector = "td:nth-child(" + nthChild + ")";

            var col = this.contenttable.children("colgroup").children(colSelector).toggleClass("hidden", isHidden);
            this.columnsheadertable.children("colgroup").children(colSelector).toggleClass("hidden", isHidden);
            editTemplateTable.children("colgroup").children(colSelector).toggleClass("hidden", isHidden);
            displayTemplateTable.children("colgroup").children(colSelector).toggleClass("hidden", isHidden);
            summaryContentTable.children("colgroup").children(colSelector).toggleClass("hidden", isHidden);

            this.contenttable.find(cellSelector).toggleClass("hidden", isHidden);
            this.columnsheadertable.find(cellSelector).toggleClass("hidden", isHidden);
            editTemplateTable.find(cellSelector).toggleClass("hidden", isHidden);
            displayTemplateTable.find(cellSelector).toggleClass("hidden", isHidden);
            summaryContentTable.find(cellSelector).toggleClass("hidden", isHidden);

            if (!usesBucketWidth && !isHidden)
            {
                if (checkExists(this.columns[colindex].width) && this.columns[colindex].width !== "")
                {
                    if (this.columns[colindex].modulus)
                    {
                        col[0].style.minWidth = this.columns[colindex].width;
                    }
                    else
                    {
                        col[0].style.width = this.columns[colindex].width;
                    }
                }
            }

            //test for bucket width setting before applying the algorithm
            if (usesBucketWidth)
            {
                this._updateColumnWidths();
            }
        },

        //function will update all column widths when a column is dynamically hidden or shown
        _updateColumnWidths: function (widthToDistribute)
        {
            var colGroup = this.element.find("table.grid-content-table").children("colgroup");

            //find visible and invisible columns

            var hiddenColumns = colGroup.children(".hidden");
            var visibleColumns = colGroup.children(":not(.hidden)");
            var hiddenColumnLength = hiddenColumns.length;
            var visibleColumnsLength = visibleColumns.length;
            var visibleWidth = 0;

            var actionRow = this.contenttable.find("td.action-row");
            if (actionRow.length > 0)
            {
                actionRow.removeClass("hidden");
                actionRow.attr("colspan", visibleColumnsLength);
            }

            //calculate if there is any column width now hidden that needs to be distributed
            var totalWidthToDistribute = 0;
            while (hiddenColumnLength--)
            {
                var hiddenColumn = $(hiddenColumns[hiddenColumnLength]);
                var hiddenColumnMetaData = hiddenColumn.metadata();
                var width = "";
                if (checkExistsNotEmpty(hiddenColumnMetaData.width))
                {
                    width = hiddenColumnMetaData.width;
                    //hiddenColumns[hiddenColumnLength].style.width = "0%";
                    width = width.replace(SCGrid._regex.pixelOrPercentage, "");
                    totalWidthToDistribute += parseInt(width);
                }
            }

            while (visibleColumnsLength--)
            {
                var visibleColumn = $(visibleColumns[visibleColumnsLength]);
                var visibleColumnMetaData = visibleColumn.metadata();
                var width = "";
                if (checkExistsNotEmpty(visibleColumnMetaData.width))
                {
                    width = visibleColumnMetaData.width;
                    //hiddenColumns[hiddenColumnLength].style.width = "0%";
                    width = width.replace(SCGrid._regex.pixelOrPercentage, "");
                    visibleWidth += parseInt(width);
                }
            }
            visibleColumnsLength = visibleColumns.length;

            totalWidthToDistribute = 100 - visibleWidth;
            if (checkExistsNotEmpty(widthToDistribute))
            {
                totalWidthToDistribute += widthToDistribute;
            }

            if ((totalWidthToDistribute > 0) || (totalWidthToDistribute < 0)) // if the width distribution is not done for when width has to be reduced, it leads to inaccurate width values
            {
                //distribute miss width

                //find if we can distribute evenly via division
                var amountToAddPerColumn = totalWidthToDistribute / visibleColumnsLength;
                var intAmountToAddPerColumn = parseInt(amountToAddPerColumn);

                var fractionalAmount = amountToAddPerColumn - intAmountToAddPerColumn;
                if (fractionalAmount > 0)
                {
                    //we cannot distribute evenly so calculate the bucket size that will be added one by one from the left to the right
                    fractionalAmount = totalWidthToDistribute % visibleColumnsLength;
                }
                while (visibleColumnsLength--)
                {
                    var colWidth = "";
                    //get orginal width
                    var col = $(visibleColumns[visibleColumnsLength]);
                    var colMetaData = col.metadata();
                    if (checkExistsNotEmpty(colMetaData.width))
                    {
                        colWidth = colMetaData.width;
                        colWidth = parseInt(colWidth.replace(SCGrid._regex.pixelOrPercentage, ""));
                    }

                    //add distribution plus bucket amount if any left
                    colWidth += intAmountToAddPerColumn;
                    if (fractionalAmount)
                    {
                        colWidth += fractionalAmount;
                        fractionalAmount -= fractionalAmount;
                    }
                    //set calculated width
                    visibleColumns[visibleColumnsLength].style.width = colWidth + "%";
                }
            }
            else
            {
                //reset to to meta data width
                while (visibleColumnsLength--)
                {
                    //get orginal width
                    var colWidth = $(visibleColumns[visibleColumnsLength]).metadata().width;
                    colWidth = parseInt(colWidth.replace(SCGrid._regex.pixelOrPercentage, ""));
                    //set orginal width
                    visibleColumns[visibleColumnsLength].style.width = colWidth + "%";
                }
            }
        },

        hide: function ()
        {
            // Attempt to determine if syncwidths should be called after the intended operation
            var _syncWidths = (arguments.length === 3) ? arguments[2] : (typeof arguments[1] === "boolean" ? arguments[1] : true);

            switch (arguments[0])
            {
                case "column":
                case "column-header":
                    // If a string has been passed, lookup the column index of the column with the same name
                    var colindex = (typeof arguments[1] === "string") ? this._getColumnIndex(arguments[1]) : arguments[1];

                    if (colindex > -1)
                    {
                        if (arguments[0] === "column")
                        {
                            this._toggleColumn(colindex, false);
                        }
                        else
                        {
                            this.element.find("table.grid-column-header-table td:nth-child(" + (colindex + 1) + ")").children().first().hide();
                        }

                        this._setRowFirstAndLastVisibleColumnClasses();
                    }
                    else
                    {
                        _syncWidths = false; // No need to call syncwidths if nothing was hidden
                    }
                    break;
                case "column-headers":
                    this.element.addClass("hide-column-headers");
                    _syncWidths = false; // No need to call this if all headers are hidden
                    break;
                case "header":
                    this.element.removeClass("with-header").addClass("without-header");
                    _syncWidths = false; // No need to call this if header is hidden
                    break;
                case "toolbar":
                    this.toolbars.toolbargroup("hide", arguments[1]);

                    if (this.toolbars.hasClass("none"))
                    {
                        this.element.addClass("without-toolbar").removeClass("with-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("single"))
                    {
                        this.element.addClass("with-toolbar").removeClass("without-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("double"))
                    {
                        this.element.addClass("with-double-toolbar").removeClass("without-toolbar").removeClass("with-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("triple"))
                    {
                        this.element.addClass("with-triple-toolbar").removeClass("without-toolbar").removeClass("with-toolbar").removeClass("with-double-toolbar");
                    }

                    _syncWidths = false; // No need to call this if any toolbar is hidden

                    break;
                case "footer":
                    if (this.footer)
                    {
                        this.footer.toolbargroup("hide", 0);

                        if (this.footer.hasClass("none"))
                        {
                            this.element.addClass("without-footer").removeClass("with-footer");
                        }
                        else if (this.footer.hasClass("single"))
                        {
                            this.element.addClass("with-footer").removeClass("without-footer");
                        }
                    }

                    _syncWidths = false; // No need to call this if the footer is hidden

                    break;
                case "row":
                    this.rows.eq(arguments[1]).hide();

                    if (!_syncWidths) this._applyZebraStripes();

                    break;
            }

            if (_syncWidths)
            {
                this._syncWidths(null, true);
            }
        },

        unhide: function ()
        {
            // Attempt to determine if syncwidths should be called after the intended operation
            var _syncWidths = (arguments.length === 3) ? arguments[2] : (typeof arguments[1] === "boolean" ? arguments[1] : true);

            switch (arguments[0])
            {
                case "column":
                case "column-header":
                    // If a string has been passed, lookup the column index of the column with the same name
                    var colindex = (typeof arguments[1] === "string") ? this._getColumnIndex(arguments[1]) : arguments[1];

                    if (colindex > -1)
                    {
                        if (arguments[0] === "column")
                        {
                            this._toggleColumn(colindex, true);
                        }
                        else
                        {
                            this.element.find("table.grid-column-header-table td:nth-child(" + (colindex + 1) + ")").children().first().show();
                        }
                        this._setRowFirstAndLastVisibleColumnClasses();
                    }
                    else
                    {
                        _syncWidths = false; // No need to call syncwidths if nothing was made visible
                    }
                    break;
                case "column-headers":
                    this.element.removeClass("hide-column-headers");
                    _syncWidths = false; // No need to call syncwidths if all column headers were made visible
                    break;
                case "header":
                    this.element.removeClass("without-header").addClass("with-header");
                    _syncWidths = false; // No need to call syncwidths if the header was made visible
                    break;
                case "toolbar":
                    this.toolbars.toolbargroup("unhide", arguments[1]);

                    if (this.toolbars.hasClass("none"))
                    {
                        this.element.addClass("without-toolbar").removeClass("with-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("single"))
                    {
                        this.element.addClass("with-toolbar").removeClass("without-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("double"))
                    {
                        this.element.addClass("with-double-toolbar").removeClass("without-toolbar").removeClass("with-toolbar").removeClass("with-triple-toolbar");
                    }
                    else if (this.toolbars.hasClass("triple"))
                    {
                        this.element.addClass("with-triple-toolbar").removeClass("without-toolbar").removeClass("with-toolbar").removeClass("with-double-toolbar");
                    }

                    _syncWidths = false; // No need to call syncwidths if any toolbar was made visible
                    break;
                case "footer":
                    if (!checkExists(this.footer))
                    {
                        this._buildFooter();
                    }

                    this.footer.toolbargroup("unhide", 0);

                    if (this.footer.hasClass("none"))
                    {
                        this.element.addClass("without-footer").removeClass("with-footer");
                    } else if (this.footer.hasClass("single"))
                    {
                        this.element.addClass("with-footer").removeClass("without-footer");
                    }

                    _syncWidths = false; // No need to call syncwidths if the footer was made visible
                    break;
                case "row":
                    this.rows.eq(arguments[1]).show();

                    if (!_syncWidths) this._applyZebraStripes();

                    break;
            }

            if (_syncWidths)
            {
                this._syncWidths(null, true);
            }
        },

        _setOption: function (key, value)
        {
            switch (key)
            {
                case "page":
                    this.page = parseInt(value);
                    if (checkExists(this.footer))
                    {
                        this.footer.find(".input-control.text-input input[type=text]").val(this.page.toString());
                        this._updatePagingControls();
                    }
                    break;
                case "hasrowcount":
                    this.hasrowcount = value;
                    if (!this.hasrowcount)
                    {
                        this.totalpages = -1;
                        if (checkExists(this.footer))
                        {
                            this.footer.find(".grid-paging-control-text.total")[0].style.display = "none";
                            this.footer.find(".toolbar-button.paging-last")[0].style.display = "none";
                        }
                    }
                    else if (checkExists(this.footer))
                    {
                        this.footer.find(".grid-paging-control-text.total")[0].style.display = "inline";
                        this.footer.find(".toolbar-button.paging-last")[0].style.display = "inline";
                    }
                    break;
                case "hasmorepages":
                    this.hasmorepages = value;
                    if (checkExists(this.footer))
                    {
                        this._updatePagingControls();
                    }
                    break;
                case "totalpages":
                    this.totalpages = parseInt(value);
                    if (checkExists(this.footer))
                    {
                        if (this.totalpages !== -1)
                        {
                            this.footer.find(".grid-paging-control-text.total").text(Resources.CommonLabels.PagingTotalPagesText.replace("{0}", this.totalpages.toString()));
                        }
                        this._updatePagingControls();
                    }
                    break;
                case "paging":
                    if (value === false)
                    {
                        this.hide("footer");
                    }
                    else if (this.options.paging === false && value === true)
                    {
                        this.unhide("footer");
                        this._buildPagingControls();
                    }
                    break;
                case "sorting":
                    if (value === false)
                    {
                        this.columnsheadertable.addClass("not-sortable");
                    } else
                    {
                        this.columnsheadertable.removeClass("not-sortable");
                    }
                    break;
                case "columns":
                    if (checkExists(value))
                    {
                        for (var i = 0; i < value.length; i++)
                        {
                            var currentColumn = value[i];

                            var existingColIndex = this._getColumnIndex(currentColumn.name);

                            if (existingColIndex !== -1)
                            {
                                var currentColHidden = (currentColumn.hidden === true);
                                var existingColHidden = (this.columns[existingColIndex].hidden === true);

                                if (existingColHidden !== currentColHidden)
                                {
                                    if (currentColHidden)
                                    {
                                        this.hide("column", existingColIndex);
                                    }
                                    else
                                    {
                                        this.unhide("column", existingColIndex);
                                    }
                                }
                            }
                        }
                    }
                    break;
                case "sortState":
                    if (checkExists(value))
                    {
                        var existingColIndex = this._getColumnIndex(value.columnName);

                        if (existingColIndex !== -1)
                        {
                            this.clearsort();

                            this.sortState = value;
                            this.sortColumn = existingColIndex;
                            this.reverseSort = [];

                            var reverse = (value.direction === "desc");

                            this.reverseSort[existingColIndex] = reverse;

                            var columnHeaderTableTds = this.columnsheadertable.children("tbody").children("tr").children("td");

                            columnHeaderTableTds.children(".grid-column-header-cell").removeClass("asc").removeClass("desc");
                            columnHeaderTableTds.eq(existingColIndex).children(".grid-column-header-cell").addClass(value.direction);
                        }
                    }
                    break;
                case "canexpand":
                    this.canexpand = value;
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
        },

        _changePage: function ()
        {
            var self = this;
            var _footer = this.footer.toolbargroup("fetch", "toolbars").eq(0);
            var pagingTextBox = _footer.find(".input-control.text-input input[type=text]");


            var p = self.options.page || 1;
            var tp = self.options.totalpages;
            var gtp = pagingTextBox.val();

            if (!isNaN(gtp) && self.page !== gtp && gtp > 0 && (!checkExists(tp) || tp === -1 || gtp <= tp))
            {
                self.gotopage(gtp, p, self.element);
            }
            else
            {
                pagingTextBox.val(p.toString());
            }
        },

        _updatePagingControls: function ()
        {
            if (checkExists(this.footer))
            {
                var _footer = this.footer.toolbargroup("fetch", "toolbars").eq(0);

                var first = _footer.find(".toolbar-button.paging-first");
                var previous = _footer.find(".toolbar-button.paging-left");
                var next = _footer.find(".toolbar-button.paging-right");
                var last = _footer.find(".toolbar-button.paging-last");
                var input = _footer.find(".input-control.text-input input[type=text]");
                var total = _footer.find(".grid-paging-control-text.total");

                input.val(this.page.toString());
                if (!this.totalpages === -1)
                    total.text(Resources.CommonLabels.PagingTotalPagesText.replace("{0}", this.totalpages.toString()));

                if (this.page === 1)
                {
                    first.addClass("disabled");
                    previous.addClass("disabled");
                    first.addClass("hide-browser-highlight");

                    first[0].setAttribute("tabIndex", "-1");
                    previous[0].setAttribute("tabIndex", "-1");
                }
                else
                {
                    first.removeClass("disabled");
                    previous.removeClass("disabled");

                    first[0].setAttribute("tabIndex", this.tabIndex);
                    previous[0].setAttribute("tabIndex", this.tabIndex);
                }

                if (this.page === 1 && (this.hasmorepages === false || this.page === this.totalpages))
                {
                    input[0].setAttribute("disabled", "disabled");
                }
                else
                {
                    input[0].removeAttribute("disabled");
                }

                if (this.totalpages === 1 || this.hasmorepages === false || this.page === this.totalpages)
                {
                    next.addClass("disabled");
                    last.addClass("disabled");

                    next[0].setAttribute("tabIndex", "-1");
                    last[0].setAttribute("tabIndex", "-1");
                }
                else
                {
                    next.removeClass("disabled");
                    next[0].setAttribute("tabIndex", this.tabIndex);

                    if (this.hasmorepages === true && this.totalpages > 0)
                    {
                        last.removeClass("disabled");
                        last[0].setAttribute("tabIndex", this.tabIndex);
                    }
                    else
                    {
                        last.addClass("disabled");
                        last[0].setAttribute("tabIndex", "-1");
                    }
                }
            }
        },

        gotopage: function (page)
        {
            if (checkExists(this.options.custompaging) && typeof this.options.custompaging == "function")
            {
                this.options.custompaging(page, this.page, this.element);
            }
        },

        _updateAggregation: function (type, value, index)
        {
            if (index > 0)
                switch (type)
                {
                    case "count":
                        this.aggregationContentTableBody.children(".aggregation-count").children().eq(index).text(value);
                        break;
                    case "avg":
                        this.aggregationContentTableBody.children(".aggregation-average").children().eq(index).text(value);
                        break;
                    case "sum":
                        this.aggregationContentTableBody.children(".aggregation-summary").children().eq(index).text(value);
                        break;
                    case "min":
                        this.aggregationContentTableBody.children(".aggregation-minimum").children().eq(index).text(value);
                        break;
                    case "max":
                        this.aggregationContentTableBody.children(".aggregation-maximum").children().eq(index).text(value);
                        break;
                }
        },

        _updateRow: function ()
        {

            var rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row):not(.edit-template-row, .display-template-row)");

            var r = rows.eq(arguments[2]);

            var html = "";

            for (var i = 0, l = this.columns.length; i < l; i++)
            {
                var data = {};
                data.isLiteral = this.options.isLiteral;

                if (checkExists(arguments[0][i]))
                {
                    if (typeof arguments[0][i] === "string") data.value = arguments[0][i];
                    if (checkExists(arguments[0][i].icon)) data.icon = arguments[0][i].icon;
                    if (checkExists(arguments[0][i].value)) data.value = arguments[0][i].value;
                    if (checkExists(arguments[0][i].display)) data.display = arguments[0][i].display;
                    if (checkExists(arguments[0][i].control)) data.control = arguments[0][i].control;
                    if (checkExists(arguments[0][i].html)) data.html = arguments[0][i].html;
                    if (checkExists(arguments[0][i].cellclass)) data.cellclass = arguments[0][i].cellclass;
                    if (checkExists(arguments[0][i].counter)) data.counter = arguments[0][i].counter;
                    if (checkExists(arguments[0][i].align)) data.align = arguments[0][i].align;
                    if (checkExists(arguments[0][i].isLiteral)) data.isLiteral = arguments[0][i].isLiteral;
                    if (checkExists(arguments[0][i].fieldPropertyType)) data.fieldPropertyType = arguments[0][i].fieldPropertyType;
                }

                html += "<td style=\"";
                if (checkExists(data.align) && data.align !== "none")
                {
                    html += "text-align:" + data.align.toLowerCase() + ";";
                }
                else if (checkExists(this.columns[i].align) && this.columns[i].align !== "none")
                {
                    html += "text-align:" + this.columns[i].align + ";";
                }
                html += "\"";

                // Storing cell metadata
                var cellmetadata = {};
                var metaDataLength = 0;
                if (checkExists(data.icon))
                {
                    cellmetadata["icon"] = data.icon;
                    metaDataLength++;
                }
                if (checkExists(data.value))
                {
                    cellmetadata["value"] = data.value;
                    metaDataLength++;
                }
                if (checkExists(data.control))
                {
                    cellmetadata["control"] = data.control;
                    metaDataLength++;
                }
                if (checkExists(data.counter))
                {
                    cellmetadata["counter"] = data.counter;
                    metaDataLength++;
                }

                if (checkExists(data.fieldPropertyType))
                {
                    cellmetadata["fieldPropertyType"] = data.fieldPropertyType;
                    metaDataLength++;
                }

                if (checkExists(this.columns[i].hidden) && this.columns[i].hidden)
                {
                    html += " class=\"hidden\"";
                }

                if (metaDataLength > 0)
                {
                    html += " data-options=\"" + jQuery.toJSON(cellmetadata).htmlEncode() + "\"";
                }

                html += "><div class=\"grid-content-cell";

                if (checkExists(data.icon) && data.icon !== "") html += " icon " + data.icon;
                if (checkExists(data.cellclass) && data.cellclass !== "") html += " " + data.cellclass;

                if (!checkExists(data.align))
                {
                    if (checkExists(this.columns[i].datatype) && this.columns[i].datatype === "number") html += " numeric";
                }
                if (checkExists(this.columns[i].control) && this.columns[i].control !== "") html += " checkradio-cell";


                if ((checkExists(data.display)) && (data.display !== ""))
                {
                    if (typeof data.display === "string")
                    {
                        var escapedValue = this._getTooltip(data);
                        html += "\"><div class=\"grid-content-cell-wrapper\" title=\"" + escapedValue + "\">";
                    }
                    else
                    {
                        html += "\"><div class=\"grid-content-cell-wrapper\" title=\"" + data.display + "\">";
                    }
                }
                else
                {
                    html += "\"><div class=\"grid-content-cell-wrapper\">";
                }

                if (checkExists(data.html) && data.html !== "")
                {

                    html += data.html;

                }
                else
                {
                    if (checkExists(this.columns[i].control) && (this.columns[i].control === "checkbox" || this.columns[i].control === "radiobutton"))
                    {
                        switch (this.columns[i].control)
                        {
                            case "checkbox":
                                html += SCCheckbox.html({ checked: (this.columns[i].datatype === "boolean" && data.value) });
                                break;
                            case "radiobutton":
                                html += SCRadiobutton.html({});
                                break;
                        }
                    } else
                    {
                        var val = checkExists(data.display) ? data.display : data.value;
                        if (!data.isLiteral && typeof val === "string")
                        {
                            var escapedValue = this._escapeMetadataString(val);
                            html += escapedValue;
                        }
                        else
                        {
                            html += val;
                        }
                    }
                }

                html += "</div></div></td>";
            }

            r.html(html);

            r.find("input.input-control[type=checkbox]").checkbox();
            r.find("input.input-control[type=radio]").radiobutton();

            r.find(".input-control.text-input").textbox();
            r.find("select.input-control").dropdown();

            r.find(".fileImage, .hyperlink, .image")
                .on("keydown", this._onListviewItemKeyDown)
                .on("click", this._onListviewItemClick)
                .on("focus", this._onListviewItemFocus)
                .on("blur", this._onListviewItemBlur);

            var _syncWidths = arguments[1];

            if (_syncWidths === undefined || _syncWidths === true)
                this._syncWidths(false);
        },

        _getTooltip: function (data)
        {
            var escapedValue = "";

            if (data.isLiteral === true)
            {
                escapedValue = data.display.stripHtml();
            }
            else
            {
                escapedValue = this._escapeMetadataString(data.display);
            }

            return escapedValue;
        },

        _onListviewItemFocus: function ()
        {
            $(this).addClass("focus");
        },

        _onListviewItemBlur: function ()
        {
            $(this).removeClass("focus");
        },

        edit: function (row)
        {
            var t = this.fetch("edit-template-row");

            if (!t.hasClass("edit-template-row")) t.addClass("edit-template-row");

            if (t.length > 0)
            {
                this.rows = this.contenttabletbody.children("tr:not(.empty-grid):not(.action-row)");

                var r = (!isNaN(parseInt(row))) ? this.rows.eq(row) : null;

                var tc = t.children("td");

                for (var i = 0, l = this.columns.length; i < l; i++)
                {
                    if (this.columns[i].hidden) tc.eq(i).addClass(" hidden");
                }

                if (checkExists(r) && r.length > 0)
                {
                    r.addClass("edit-row");
                    r.after(t);
                    this.hide("row", row);
                }
                else
                {

                    if (this.contenttabletbody.children("tr.empty-grid").length > 0)
                    {
                        this.contenttabletbody.empty().append(t);
                    }
                    else if (this.contenttabletbody.children("tr.action-row").length > 0)
                    {
                        t.insertBefore(this.contenttabletbody.children("tr.action-row"));
                    }
                    else
                    {
                        this.contenttabletbody.append(t);
                    }
                }

                if (checkExists(SourceCode.Forms.Controls.Textbox))
                {
                    t.find(".input-control.text-input").textbox();
                }

                if (checkExists(SourceCode.Forms.Controls.Checkbox))
                {
                    t.find("input[type=checkbox]").checkbox();
                }

                if (checkExists(SourceCode.Forms.Controls.Radiobutton))
                {
                    t.find("input[type=radio]").radiobutton();
                }

                if (checkExists(SourceCode.Forms.Controls.DropDown))
                {
                    t.find("select").each
                        (
                            function (index, control)
                            {
                                var jqControl = jQuery(control);
                                if (!jqControl.is(".list-display"))
                                    jqControl.dropdown();
                            }
                        );
                }

                this._syncWidths();

                if (this.contenttabletbody.children("tr.empty-grid").length > 0)
                {
                    this.contenttabletbody.children("tr.empty-grid").remove();
                    this.element.removeClass("empty");
                }

                if (this.isRuntime)
                {
                    // Using the implied tab index order, select the first
                    if (this.sortedItemsArray === null || this.sortedItemsArray.length > 0)
                    {
                        if (this.sortedItemsArray === null)
                        {
                            this.sortedItemsArray = [];
                        }

                        if (this.sortedItemsArray.length !== t.find("td:not(.hidden) [tabindex][tabindex!='-1'][disabled!='disabled']:not(.disabled)").length)  //TODO: TD0006
                        {
                            this.editEventsAttached = false;
                            t.off("keydown.tabbing");
                            this._applyEditTabbingBehaviour(t);
                        }

                        if (this.sortedItemsArray.length > 0)
                        {
                            try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                            {
                                this.sortedItemsArray[0].focus();
                            }
                            catch (e)
                            { }
                        }
                        else
                        {
                            this.sortedItemsArray = null;
                        }
                    }
                    else
                    {
                        // Set focus in the first visible & enabled control
                        var inputs = t.find("a, input, textarea").filter(":not(.disabled), :visible");  //TODO: TD0006

                        if (inputs.length > 0)
                        {
                            try // IE8 breaks when trying to focus on an unfocussable control. The array will filter those out for known control types. The try catch is a safeguard for future control and custom controls
                            {
                                inputs[0].focus();
                            }
                            catch (e)
                            { }
                        }
                    }
                }
                this._trigger("rowedit", null, { row: row, template: t });
                SourceCode.Forms.Layout.checkAndFixView(this.element);
                this._highlight(t);
            }
        },

        commit: function ()
        {
            var t = this.contenttabletbody.children("tr.edit-template-row"), row;

            if (t.prev().hasClass("edit-row"))
            {
                row = t.prev().css("display", "").removeClass("edit-row");
            }

            this.element.children(".grid-edit-templates").eq(0).find("table tbody").append(t);

            if (this.contenttabletbody.children("tr").length === 0 && !this.actionrow)
            {
                this.contenttabletbody.html("<tr class=\"empty-grid\">"
                    + "<td class=\"empty-grid\"" + ((this.columns.length > 0) ? " colspan=\"" + this.columns.length + "\"" : "") + ">"
                    + "<div class=\"grid-content-cell\"><div class=\"grid-content-cell-wrapper\">" + this.resources.emptygrid + "</div></div></td></tr>");
            }

            this._syncWidths();

            this._trigger('rowcommit', null, { row: row, template: t });
        },

        update: function ()
        {
            var key = arguments[0];
            switch (key)
            {
                case "row":
                    this._updateRow(arguments[1], arguments[2], arguments[3]);
                    break;
                case "aggregation":
                    this._updateAggregation(arguments[1], arguments[2], arguments[3])
                    break;
                case "column":
                    if (arguments.length === 3)
                    {
                        var colindex = (typeof arguments[1] === "string") ? this._getColumnIndex(arguments[1]) : arguments[1];

                        if (colindex > -1)
                        {
                            this.columns[colindex] = $.extend({}, this.columns[colindex], arguments[2]);

                            // Update the column appropriately
                            var colgroup = this.contenttable.children("colgroup").replaceWith(this._generateColGroupHTML({ columns: this.columns }));
                            this._syncWidths();
                        }
                    }
                    break;
            }
        },

        saveState: function ()
        {
            var currentState = {};
            var propertyNames = this.getStateSupportedProperties();

            for (var i = 0; i < propertyNames.length; i++)
            {
                var propertyName = propertyNames[i];
                var propertyValue = this[propertyName];

                if (propertyName === "columns")
                {
                    propertyValue = this.fetch("columns");
                }

                if (typeof propertyValue !== "undefined")
                {
                    currentState[propertyName] = propertyValue;
                }
            }

            return currentState;
        },

        loadState: function (newState)
        {
            var propertyNames = this.getStateSupportedProperties();

            for (var i = 0; i < propertyNames.length; i++)
            {
                var propertyName = propertyNames[i];
                var propertyValue = newState[propertyName];

                if (typeof propertyValue !== "undefined")
                {
                    this._setOption(propertyName, propertyValue);
                }
            }
        },

        getStateSupportedProperties: function ()
        {
            var stateSupportedProperties = [
                "page",
                "hasrowcount",
                "hasmorepages",
                "totalpages",
                "sorting",
                "columns",
                "sortState",
                "canexpand"
            ];

            return stateSupportedProperties;
        }
    }

    if (typeof SCGrid === "undefined" || SCGrid === null) SCGrid = SourceCode.Forms.Controls.Grid;

    $.widget("ui.grid", SourceCode.Forms.Controls.Grid);

    SCGridDefaults = {
        getter: "fetch",
        options: {
            dragcolumns: false,
            multiline: true,
            multiselect: false,
            cellcontentselect: false,
            singleEventOnMultiSelect: false,
            disablemodulus: false,
            paging: false,
            method: "POST",
            datatype: "xml",
            autopopulate: true,
            actionrow: false,
            sorting: true,
            zebraStripes: true,
            resources: {},
            disableInternalWidthSync: false,
            isLiteral: true,
            useTouchEvents: null
        }
    };

    $.extend($.ui.grid.prototype, SCGridDefaults);

})(jQuery);
