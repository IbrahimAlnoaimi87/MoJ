(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.CategoryLookup = {

        options:
        {
            showDialogOnInput: true
        },

        _create: function ()
        {
            // call the base jQuery UI create method
            $.Widget.prototype._create.apply(this, arguments);

            // Initializing the control
            if (this.element.find("input[type=text]").val() !== "") this.element.find(".input-control-watermark").hide();

            // Init the events
            this._initEvents();

            // Load the initial values
            this._initValues();

            this.selectNewCategory = null;
            this.selectNewCategoryParent = null;
            this.deleteCategoryID = null;
            this.actionCategory = null;
        },

        _setOption: function (key, value)
        {

            if (key === "value")
            {
                var m = this.element.metadata();
                m.selected = value;
                this._updateContol();
            }

            $.Widget.prototype._setOption.apply(this, arguments);
        },

        _initEvents: function ()
        {
            var $this = this;

            // Binding Focus & Blur Events to Input Element
            var textInput = this.element.find("input[type=text]");
            textInput.on("focus", function ()
            {
                $(this).parents(".input-control").eq(0).addClass("active");
                $(this).parents(".input-control").eq(0).find(".input-control-watermark").hide();
            });

            textInput.on("blur", function (ev)
            {
                // prevent firefox from bubbling this to the body and causes a backwards navigation event.
                ev.preventDefault();
                ev.stopPropagation();
                // end - prevent firefox from bubbling this to the body and causes a backwards navigation event.
                $(this).parents(".input-control").eq(0).removeClass("active");
                if ($(this).val() === "") $(this).parents(".input-control").eq(0).find(".input-control-watermark").show();
            });

            // Clicking on the watermark will place focus on the input element
            this.element.find(".input-control-watermark").on("click", function ()
            {
                $(this).siblings("input")[0].focus();
            }).css("cursor", "default");

            // Clicking the ellipsis button
            this.element.find("a.ellipsis").on("click", this._showBrowserDialog.bind(this));
            if (this.options.showDialogOnInput === true)
            {
                textInput.on("click", this._showBrowserDialog.bind(this));
            }

            // Keyboard keystrokes handling
            textInput.on("keypress", function (ev)
            {
                ev.preventDefault();
            });

            textInput.on("keyup", function (ev)
            {
                ev.preventDefault();
            });

            textInput.on("keydown", function (ev)
            {
                if ($this.element.hasClass("disabled"))
                {
                    return;
                }

                switch (ev.keyCode) {
                    case 8: //backspace
                    case 46: //delete
                        // Used to prevent FireFox from processing a browser back navigation event when backspace is pressed
                        setTimeout(function () {
                            $this._setOption("value", {});
                        }, 0);

                        return false;

                        break;
                    case 13: //enter
                    case 32: //space
                        $this._showBrowserDialog(ev);
                        break;
                }
    
                //allow tabs
                if (ev.keyCode!=9) ev.preventDefault();
            });

            // Init Droppable events if required
            if (this.element.metadata().droppable !== undefined && this.element.metadata().droppable)
            {
                this.element.droppable({
                    accept: "." + this.element.metadata().objecttypes.split(",").join(", ."),
                    activeClass: "active",
                    tolerance: "pointer",
                    over: function (event, ui) { ui.helper.addClass("valid"); },
                    out: function (event, ui) { ui.helper.removeClass("valid"); },
                    drop: function (event, ui)
                    {
                        if ($this.element.hasClass("disabled"))
                        {
                            return;
                        }

                        var val = {};

                        if (ui.draggable.is("tr"))
                        {
                            val.objecttype = ui.draggable.children("td").eq(1).metadata().value;
                            if (val.objecttype === "category")
                            {
                                val.catid = ui.draggable.children("td").eq(0).text();
                                val.catname = ui.draggable.children("td").eq(1).text();
                            }
                            else
                            {
                                val.objectid = ui.draggable.children("td").eq(0).text();
                            }
                        }
                        else
                        {
                            val.objecttype = ui.draggable.parent().metadata().type;

                            if (val.objecttype === "category")
                            {
                                val.catid = ui.draggable.parent().metadata().catid;
                                val.catname = ui.draggable.text();
                            }
                            else
                            {
                                val.objectid = ui.draggable.parent().metadata().guid;
                            }
                        }

                        $this._setOption("value", val);

                    }
                });

            }

            // ContextMenu document click handler
        },

        _destroyEvents: function ()
        {
            this.element.find("input[type=text]").off("focus blur keydown keyup keypress click");
            this.element.find(".input-control-watermark").off("click");
        },

        _browseDialog_Cancel: function(){
            this._initValues();
        },

        _initValues: function ()
        {
            
            var value = this.element.metadata();

            if (value.selected !== undefined && !$.isEmptyObject(value.selected))
            {
                if (value.selected.prePopulated === true)
                {
                    this._applyLocalInitvalues();
                    value.selected.prePopulated = false;
                }
                else
                {
                    var o = { action: "categorypath" };

                    if (value.selected.catid !== undefined && value.selected.catid > 0) o.catid = value.selected.catid;
                    if (value.selected.objectid !== undefined && value.selected.objectid !== "")
                    {
                        o.guid = value.selected.objectid;
                        o.objecttype = value.selected.objecttype;
                    }

                    if (value.selected.isvalid !== false)
                    {
                        this.element.addClass("loading");

                        var self = this;

                        $.ajax({
                            cache: false,
                            data: $.param(o),
                            dataType: "xml",
                            url: applicationRoot + "AppStudio/AJAXCall.ashx",
                            success: self._applyInitvalues.bind(self),
                            type: "POST"
                        });
                    }
                    else if ((this.dialog !== undefined) && (this.dialog.find("#CategoryLookupDialog")))
                    {
                        this._hideBrowserDialog();
                    }
                }
            }
            else
            {
                this.element.find("input[type=text]").val("");
                this._trigger("change", null, this._value());
                if ((this.dialog !== undefined) && (this.dialog.find("#CategoryLookupDialog")))
                {
                    this._hideBrowserDialog();
                }
            }

        },

        _applyLocalInitvalues: function ()
        {
            var selected = this.element.metadata().selected;

            var inputText = selected.path;

            if (selected.path === "" && !checkExistsNotEmpty(selected.catname))
            {
                inputText = Resources.Categories.AllItemsText;
            }
            else if (checkExists(selected.objectname))
            {
                inputText = selected.path + "\\" + selected.objectname
            }
            this.element.find("input[type=text]").val(inputText);

            this.element.removeClass("loading");
            if (this.element.find("input[type=text]").val() !== "")
            {
                this.element.find(".input-control-watermark").hide();
            }
            this._trigger("change", null, this._value());
        },

        _applyInitvalues: function (data, status, xhr)
        {

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }

            this.element.metadata().selected.fullpath = $("fullpath", data).text();
            this.element.metadata().selected.catid = $("fullpath", data).attr("catid");
            this.element.metadata().selected.catname = $("fullpath", data).attr("catname");
            this.element.metadata().selected.path = $("fullpath", data).attr("path");
            this.element.metadata().selected.objectname = $("fullpath", data).attr("objectname");

            this._applyLocalInitvalues();

            if (this.actionCategory === "rename")
            {
                this._trigger("updatecategories", null, this._value());
                this.actionCategory = "";
            }
            if ((this.dialog !== undefined) && (this.dialog.find("#CategoryLookupDialog")))
            {
                this._hideBrowserDialog();
            }
        },

        _showBrowserDialog: function (event)
        {
            var self = this;

            event.preventDefault();

            // Widget is disabled, exit
            if (this.element.hasClass("disabled"))
            {
                return;
            }

            this.element.addClass("active");

            var dialogContent = $("#CategoryLookupDialog");
            if (dialogContent.length === 0) dialogContent = $("<div id=\"CategoryLookupDialog\" class=\"wrapper\"></div>").appendTo("body");

            dialogContent.empty();

            //build up the dialog's content.
            dialogContent.html(SourceCode.Forms.Controls.Panel.html({ scrolling: true, fullsize: true }));
            dialogContent.find(".scroll-wrapper").html("<ul class=\"tree\"><li class=\"root loading\"><a href=\"javascript:;\" class=\"loading\">" + Resources.CommonPhrases.LoadingText + "</a></li></ul>");

            this._attachBrowserDialogEvents(dialogContent);

            var value = this.element.metadata();

            var hdr = "";

            if (value.dialogheader !== undefined && value.dialogheader !== "")
            {
                hdr = value.dialogheader;
            }
            else if (value.objecttypes !== undefined && value.objecttypes.toLowerCase() !== "category")
            {

                switch (value.objecttypes.split(",")[0].toLowerCase())
                {
                    case "smartobject":
                        hdr = Resources.Categories.SelectSpecificItem.replace("{0}", Resources.ObjectNames.SmartObjectIndefiniteSingular);
                        break;
                    case "view":
                        hdr = Resources.Categories.SelectSpecificItem.replace("{0}", Resources.ObjectNames.SmartViewIndefiniteSingular);
                        break;
                    case "form":
                        hdr = Resources.Categories.SelectSpecificItem.replace("{0}", Resources.ObjectNames.SmartFormIndefiniteSingular);
                        break;
                    case "workflow":
                    case "process":
                        hdr = Resources.Categories.SelectSpecificItem.replace("{0}", Resources.ObjectNames.WorkflowProcessIndefiniteSingular);
                        break;
                    case "styleprofile":
                        hdr = Resources.Categories.SelectSpecificItem.replace("{0}", Resources.ObjectNames.StyleProfileIndefiniteSingular);
                }

            }
            else
            {
                hdr = Resources.Categories.SelectCategoryText;
            }

            var o = { action: "initcatbrowsertree" };

            if (value.objecttypes !== undefined) o.datatypes = value.objecttypes;

            if (value.selected !== undefined && !$.isEmptyObject(value.selected))
            {
                if (value.selected.catid !== undefined && value.selected.catid > 0) o.catid = value.selected.catid;
                if (value.selected.objectid !== undefined && value.selected.objectid !== "")
                {
                    o.guid = value.selected.objectid;
                    o.objecttype = value.selected.objecttype;
                    delete o.catid;
                }
            }

            // Getting the initial tree data
            $.ajax({
                cache: false,
                data: $.param(o),
                dataType: "xml",
                url: applicationRoot + "AppStudio/AJAXCall.ashx",
                success: self._initDialogTree.bind(self),
                type: "POST"
            });

            this.dialog = jQuery.popupManager.showPopup({
                headerText: hdr,
                modalize: true,
                draggable: true,
                resizable: true,
                content: dialogContent,
                width: 256,
                height: 384,
                buttons: [
                    {
                        type: "help",
                        click: function () { HelpHelper.runHelp(7001); }
                    },
                    {
                        text: Resources.MessageBox.OKButtonText,
                        click: self._browseDialog_Ok.bind(self)
                    },
                    {
                        text: Resources.MessageBox.CancelButtonText,
                        click: self._browseDialog_Cancel.bind(self)
                    }
                ]
            });

            this.dialog.show();
            this.element.find(".ellipsis").trigger("blur");
        },

        _attachBrowserDialogEvents: function (dialogContent)
        {
            var self = this;
            dialogContent.find(".tree").find("li").on("keydown", function (e)
            {
                var node = $(e.target).closest("li");
                switch (e.keyCode)
                {
                    case 13: //enter
                        self.tree.tree("singleSelect", node);
                        $(".popup").last().find(".popup-footer .button").eq(1).trigger("click");
                        e.preventDefault();
                        break;
                    case 32: //space
                        self.tree.tree("singleSelect", node);
                        e.preventDefault();
                        break;
                    case 27: //esc
                        $(".popup").last().find(".popup-footer .button").eq(2).trigger("click");
                        e.preventDefault();
                        break;
                    case 46: //delete
                        if (self.deleteCategoryID !== null && self.deleteCategoryID !== 1)
                        {
                            SCCategoryLookup._deleteCategoryPrompt(self.deleteCategoryID);
                            self.deleteCategoryID = null;
                        }
                        break;
                }
            });
        },

        _browseDialog_Ok: function(){
            this._applyValuesFromDialog();
        },

        _applyValuesFromDialog: function ()
        {
            var node = $("#CategoryLookupDialog").find(".tree .selected");

            if (node.length > 0)
            {
                var o = this.element.metadata();

                var m = (node !== undefined && node !== null) ? node.metadata() : null;

                if (node.length === 1 && (m !== null && o.objecttypes.split(",").indexOf(m.type) !== -1))
                {
                    if (o.selected === undefined) o.selected = {};

                    if (o.objecttypes === "category" && m.type === "category")
                    {
                        o.selected.catid = m.catid;
                        o.selected.catname = node.children("a").text();
                        o.selected.objecttype = m.type;
                        o.selected.objectname = node.children("a").text();
                        this.element.data("metadata", o);
                    }
                    else if (o.objecttypes.split(",").indexOf(m.type) !== -1)
                    {
                        o.selected.objectid = m.guid;
                        o.selected.objecttype = m.type;
                        o.selected.objectname = node.children("a").text();
                        o.selected.catid = node.parent().parent().metadata().catid;
                        o.selected.catname = node.parent().parent().children("a").text();

                        this.element.data("metadata", o);
                    }

                    this._updateContol("dialogvalue");

                    this.element.removeClass("error");

                    this._hideBrowserDialog();
                }
                else
                {
                    // No node has been selected, inform the user
                    if (o.validation === undefined || o.validation === "")
                    {
                        var errType = "";

                        switch (o.objecttypes.split(",")[0].toLowerCase())
                        {
                            case "category":
                                errType = Resources.ObjectNames.CategorySingular.toLowerCase();
                                break;
                            case "smartobject":
                                errType = Resources.ObjectNames.SmartObjectSingular;
                                break;
                            case "view":
                                errType = Resources.ObjectNames.SmartViewSingular;
                                break;
                            case "form":
                                errType = Resources.ObjectNames.SmartFormSingular;
                                break;
                            case "workflow":
                            case "process":
                                errType = Resources.ObjectNames.WorkflowProcessSingular;
                                break;
                            case "styleprofile":
                                errType = Resources.ObjectNames.StyleProfileSingular;
                                break;
                        }

                        popupManager.showWarning({
                            message: Resources.Categories.CategoryBrowserSelectionRequiredText.replace("{0}", errType),
                            onClose: function () { $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus"); }
                        });
                    }
                    else
                    {
                        popupManager.showWarning({
                            message: o.validation,
                            onClose: function () { $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus"); }
                        });
                    }
                }
            }
            else
            {
                var errType = "";

                switch (this.element.metadata().objecttypes.split(",")[0].toLowerCase())
                {
                    case "category":
                        errType = Resources.ObjectNames.CategorySingular.toLowerCase();
                        break;
                    case "smartobject":
                        errType = Resources.ObjectNames.SmartObjectSingular;
                        break;
                    case "view":
                        errType = Resources.ObjectNames.SmartViewSingular;
                        break;
                    case "form":
                        errType = Resources.ObjectNames.SmartFormSingular;
                        break;
                    case "workflow":
                    case "process":
                        errType = Resources.ObjectNames.WorkflowProcessSingular;
                        break;
                    case "styleprofile":
                        errType = Resources.ObjectNames.StyleProfileSingular;
                        break;
                }

                popupManager.showWarning({
                    message: Resources.Categories.CategoryBrowserSelectionRequiredText.replace("{0}", errType),
                    onClose: function () { setTimeout(function () { $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus"); }, 0); }
                });
            }
        },

        _updateContol: function (type)
        {

            var value = this.element.metadata();
            var self = this;
            if (value.selected !== undefined && !$.isEmptyObject(value.selected))
            {
                var o = { action: "categorypath" };

                if (value.selected.catid !== undefined && value.selected.catid > 0) o.catid = value.selected.catid;
                if (value.selected.objectid !== undefined && value.selected.objectid !== "")
                {
                    o.guid = value.selected.objectid;
                    o.objecttype = value.selected.objecttype;
                    delete o.catid;
                }

                if (type === "dialogvalue" || value.selected.isvalid !== false)
                {
                    this.element.addClass("loading");
                    this.element.removeClass("error");

                    $.ajax({
                        cache: false,
                        data: $.param(o),
                        dataType: "xml",
                        url: applicationRoot + "AppStudio/AJAXCall.ashx",
                        success: self._applyValues.bind(self),
                        type: "POST"
                    });
                }
                else
                {
                    self._applyValues();
                }
            }
            else
            {
                this.element.find("input[type=text]").val("");
                this._trigger("change", null, this._value());
                this.element.removeClass("error");
            }

        },

        _applyValues: function (data, status, xhr)
        {
            if (data)
            {
                if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                {
                    SourceCode.Forms.ExceptionHandler.handleException(data);
                    return;
                }

                this.element.find("input[type=text]").val($("fullpath", data).attr("path") === "" ? Resources.Categories.AllItemsText : $("fullpath", data).attr("objectname") === undefined ? $("fullpath", data).attr("path") : $("fullpath", data).attr("path") + "\\" + $("fullpath", data).attr("objectname"));
                this.element.metadata().selected.fullpath = $("fullpath", data).text();
                var categoryId = $("fullpath", data).attr("catid");
                this.element.metadata().selected.catid = categoryId;
                this.element.metadata().selected.catname = $("fullpath", data).attr("catname");
                var path = $("fullpath", data).attr("path");
                this.element.metadata().selected.path = path;
                this.element.removeClass("loading");
                if (this.element.find("input[type=text]").val() !== "") this.element.find(".input-control-watermark").hide();

                if (checkExistsNotEmpty(path) && checkExistsNotEmpty(parseInt(categoryId, 10)))
                {
                    if (checkExists(SourceCode.Forms.Designers.View) && checkExists(SourceCode.Forms.Designers.View.SelectedCategoryPath) && (this.element.metadata().selected.objecttype === "smartobject"))
                    {
                        SourceCode.Forms.Designers.View.SelectedSMOCategoryId = parseInt(categoryId, 10);
                        SourceCode.Forms.Designers.View.SelectedSMOCategoryPath = path;
                    }
                    else
                    {
                        SourceCode.Forms.Designers.View.SelectedCategoryId = parseInt(categoryId, 10);
                        SourceCode.Forms.Designers.View.SelectedCategoryPath = path;
                    }
                }

                this._trigger("change", null, this._value());
                if (this.actionCategory === "rename")
                {
                    this._trigger("updatecategories", null, this._value());
                    this.actionCategory = "";
                }
            }
            else
            {
                var value = this.element.metadata();
                var o = {};

                if (value.selected.catid !== undefined && value.selected.catid > 0) o.catid = value.selected.catid;

                if (value.selected.objectid !== undefined && value.selected.objectid !== "")
                {
                    o.guid = value.selected.objectid;
                    o.objecttype = value.selected.objecttype;
                    delete o.catid;
                }

                if (value.selected.displayname !== undefined && value.selected.displayname !== "")
                {
                    o.displayname = value.selected.displayname;
                }

                this.element.addClass("error");

                var self = this;
                self._applyValuesInvalid(o);
            }

        },

        _applyValuesInvalid: function (o)
        {
            this.element.find("input[type=text]").val(o.displayname);
            this.element.removeClass("loading");
            if (this.element.find("input[type=text]").val() !== "") this.element.find(".input-control-watermark").hide();
        },

        _hideBrowserDialog: function ()
        {
            popupManager.closeLast();
            this.element.find("input[type=text]")[0].focus();
        },

        _initDialogTree: function (data, status, xhr)
        {

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }

            var self = this;

            var tree = this.tree = $("#CategoryLookupDialog").find("ul.tree").tree({
                click: self._treeClick.bind(self),
                dblclick: self._treeDblClick.bind(self),
                expand: self._treeExpand.bind(self),
                contextmenu: self._treeContextMenu.bind(self)
            });

            var entry = tree.children("li:first-child");

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
            

            this.__treeloadRecursion = 0;
            self._treeLoad(node.children("node"), entry, function () {
                var selected = self.tree.find("li.selected");
                if (selected.length > 0) {
                    //put focus on the selected node.
                    selected.children("a").trigger("focus");
                }
                else {
                    //put focus on the the first tree node
                    self.tree.find("li").eq(0).children("a").trigger("focus");
                }
            });

            

        },

        //callback is optional
        _treeLoad: function (nodes, entry, callback)
        {
            var self = this;
            var tree = entry.closest("ul.tree");

            this.__treeloadRecursion++;

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
                    if (node.attr("catid") !== undefined) o.data.catid = node.attr("catid");
                    if (node.attr("datatype") !== undefined) o.data.datatype = node.attr("datatype");
                    if (node.attr("datatypes") !== undefined) o.data.datatypes = node.attr("datatypes");
                    if (node.attr("type") !== undefined) o.data.type = node.attr("type");
                    if (node.attr("subtype") !== undefined) o.data.subtype = node.attr("subtype");

                    var n = tree.tree("add", entry, o);

                    if (node.children("node").length > 0) self._treeLoad(node.children("node"), n, callback);

                });
            }
            else
            {
                if (entry.is("li") && entry.is(".children.open"))
                {
                    entry.removeClass("open").addClass("closed").removeClass("children");
                }
            }

            if (entry.is("li")) entry.removeClass("loading");

            if (self.selectNewCategory !== null)
            {

                var newnode = tree.find("li:not(.root)").filter(function ()
                {
                    return $(this).metadata().catid !== undefined && $(this).metadata().catid === self.selectNewCategoryParent;
                });

                if ((newnode.attr("selected") !== undefined) && (newnode.attr("selected") === "true"))
                {
                    if (newnode.find(".open").length !== 1)
                    {
                        newnode.removeClass("closed").addClass("open");
                    }
                }

                newnode = tree.find("li:not(.root)").filter(function ()
                {
                    return $(this).metadata().catid !== undefined && $(this).metadata().catid === self.selectNewCategory;
                });

                tree.find("li.selected").removeClass("selected");
                tree.tree("select", newnode);
                newnode.children("a").trigger("focus");
                self.setNewCategory = null;
            }
            

            //if this is the last node to have loaded.
            this.__treeloadRecursion--;
            if (this.__treeloadRecursion == 0 && typeof callback === "function") {
                callback();
            }

        },

        _treeClick: function (e, ui)
        {
            var self = this;
            var n = ui.node, m = n.metadata();
            m.catid = parseInt(m.catid, 10);
            if (m.catid !== 1)
            {
                n.children("a").trigger("focus");
                self.deleteCategoryID = m.catid;
            }
            else
            {
                n.closest(".tree").tree("deselect", n);
                n.children("a").trigger("blur");
            }
        },

        //an item has been chosen
        _treeDblClick: function (e, ui)
        {
            var n = ui.node;
            n.children("a").trigger("click");
            if (n.is(".category.children"))
            {
                n.closest(".tree").tree("toggle", n);
            }
        },

        _treeExpand: function (e, ui)
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
                    url: applicationRoot + "AppStudio/AJAXCall.ashx",
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

        _treeContextMenu: function (e, ui)
        {

            if (ui.node.is(".category"))
            {

                var html = "<li><a href=\"javascript:;\" class=\"menu-item new-category\" title=\"" + Resources.AppStudio.CreateNewObjectTooltipCategorySingular + "\">"
                    + "<span class=\"menu-item-icon\"></span><span class=\"menu-item-text\">" + Resources.CommonActions.NewText + "</span></a></li>";

                if (ui.node.metadata().catid !== undefined && ui.node.metadata().catid !== 1)
                {
                    // If this is not the root (public folder) node
                    html += "<li><a href=\"javascript:;\" class=\"menu-item rename\" title=\"" + Resources.AppStudio.RenameTooltipCategorySingular + "\">"
                        + "<span class=\"menu-item-icon\"></span><span class=\"menu-item-text\">" + Resources.CommonActions.RenameText + "</span></a></li>";

                    html += "<li><a href=\"javascript:;\" class=\"menu-item delete\" title=\"" + Resources.AppStudio.DeleteSelectedObjectsTooltipCategorySingular + "\">"
                        + "<span class=\"menu-item-icon\"></span><span class=\"menu-item-text\">" + Resources.CommonActions.DeleteText + "</span></a></li>";
                }

                html += "<li class=\"seperator\"><span></span></li>";

                html += "<li><a href=\"javascript:;\" class=\"menu-item refresh\" title=\"" + Resources.AppStudio.RefreshObjectTooltipCategorySingular + "\">"
                    + "<span class=\"menu-item-icon\"></span><span class=\"menu-item-text\">" + Resources.CommonActions.RefreshText + "</span></a></li>";

                if (this.menu !== undefined && this.menu.length > 0) this.menu.remove();

                this.menu = $("<div class=\"menu\"><ul>" + html + "</ul></div>").appendTo("body");

                this.menu.css({
                    "position": "absolute",
                    "top": e.clientY,
                    "left": e.clientX,
                    "visibility": "visible"
                });

                this.menu.on("click", "a", { node: ui.node }, this._contextMenuClick.bind(this));

                this.menu.on("mouseout", function ()
                {

                    $(this).data("timer", window.setTimeout(function () { $(this).remove(); }.bind(this), 2000));

                });

            }

        },

        _contextMenuClick: function (ev)
        {

            var item = $(ev.target).closest(".menu-item");
            var node = ev.data.node;

            if (item.is(".new-category"))
            {
                this._newCategoryDialog(node.metadata().catid);
            }
            else if (item.is(".rename"))
            {
                this._renameCategoryDialog(node.metadata().catid, node.children("a").text());
            }
            else if (item.is(".delete"))
            {
                this._deleteCategoryPrompt(node.metadata().catid);
            }
            else if (item.is(".refresh"))
            {
                this._refreshCategory(node.metadata().catid);
            }

            this.menu.remove();

        },

        _newCategoryDialog: function (catid)
        {
            var dialogid = this.element.attr("id") + "_NewCategoryDialog";

            if ($("#" + dialogid).length === 0) $("body").append("<div id=\"" + dialogid + "\"></div>");

            var self = this;
            $("#" + dialogid).empty().load("Categories/CategoryDialog.aspx?action=new&catid=" + catid, function ()
            {

                $("#CategoryName, #CategoryDescription").textbox();
                $("#CategoryName, #CategoryDescription").on("keydown", function (e)
                {
                    switch (e.keyCode)
                    {
                        case 13:
                            $(".popup").last().find(".popup-footer .button").eq(1).trigger("click");
                            e.preventDefault();
                            e.stopPropagation();
                            break;
                        case 27:
                            if ($(".popup").last().find("#CategoryLookupDialog").length === 0)
                            {
                                $(".popup").last().find(".popup-footer .button").eq(2).trigger("click");
                                $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus");
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            break;
                    }

                });
                var h = $("#" + dialogid).height();

                var dialogoptions = {
                    headerText: Resources.Categories.NewCategoryText,
                    modalize: true,
                    maximizable: false,
                    draggable: true,
                    content: $("#" + dialogid),
                    width: 480,
                    height: h + 100,
                    buttons: [
                        {
                            type: "help",
                            click: function () { HelpHelper.runHelp(7001); }
                        },
                        {
                            text: Resources.MessageBox.OKButtonText,
                            click: function ()
                            {
                                if ($("#CategoryName").val() !== "")
                                {
                                    self._createCategory(catid, $("#CategoryName").val(), $("#CategoryDescription").val());
                                }
                                else
                                {
                                    popupManager.showWarning({
                                        message: Resources.Categories.CategoryNameRequiredText,
                                        onClose: function () { $("#CategoryName").trigger("focus").caret("end"); }
                                    });
                                }
                            }
                        },
                        {
                            text: Resources.MessageBox.CancelButtonText,
                            click: function ()
                            {
                                popupManager.closeLast();
                                $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus");
                            }
                        }
                    ]
                };
                popupManager.showPopup(dialogoptions);
                $("#CategoryName").trigger("focus").caret("end");
            });
        },

        _createCategory: function (catid, catname, catdesc)
        {

            var o = {
                action: "new",
                datatype: "category",
                name: catname,
                desc: catdesc,
                catid: catid
            };

            var self = this;
            var newcatid = 0;
            $.ajax({
                url: applicationRoot + "AppStudio/AJAXCall.ashx",
                data: $.param(o),
                cache: false,
                type: "POST",
                success: function (data)
                {
                    if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(data);
                        return;
                    }

                    if (data.selectSingleNode("Error") !== null)
                    {
                        popupManager.showError({
                            message: data.selectSingleNode("Error").text,
                            onClose: function () { $("#CategoryName").trigger("focus").caret("end"); }
                        });
                        return;
                    }

                    self.selectNewCategory = data.lastChild.text;
                    self.selectNewCategoryParent = catid;
                    self.deleteCategoryID = self.selectNewCategory;
                    var tree = $("#CategoryLookupDialog .tree");
                    var parentNode = tree.find("li").filter(function ()
                    {
                        return $(this).metadata().catid !== undefined && $(this).metadata().catid === catid;
                    });
                    parentNode.addClass("children");
                    self._refreshCategory(catid);

                    SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree(o.datatype, catid);

                    popupManager.closeLast();
                }
            });
        },

        _renameCategoryDialog: function (catid, currentname)
        {

            var dialogid = this.element.attr("id") + "_RenameCategoryDialog";

            if ($("#" + dialogid).length === 0) $("body").append("<div id=\"" + dialogid + "\"></div>");

            var self = this;

            $("#" + dialogid).empty().load("AppStudio/RenameDialog.aspx?action=rename&datatype=category&catid=" + catid, function ()
            {

                var h = $("#" + dialogid).height();

                var dialogoptions = {
                    headerText: Resources.CommonActions.RenameObjectTextCategorySingular,
                    modalize: true,
                    maximizable: false,
                    draggable: true,
                    content: $("#" + dialogid),
                    width: 480,
                    height: h + 100,
                    buttons: [
                        {
                            type: "help",
                            click: function () { HelpHelper.runHelp(7001); }
                        },
                        {
                            text: Resources.MessageBox.OKButtonText,
                            click: function ()
                            {
                                self._onRenameSubmit(catid, currentname, self);
                            }
                        },
                        {
                            text: Resources.MessageBox.CancelButtonText,
                            click: function () { popupManager.closeLast(); }
                        }
                    ]
                };

                popupManager.showPopup(dialogoptions);

                $("#CategoryName").textbox().trigger("focus").caret("end");
                $("#CategoryName").on("keydown", function (e)
                {
                    switch (e.keyCode)
                    {
                        case 13:
                            $(".popup").last().find(".popup-footer .button").eq(1).trigger("click");
                            e.preventDefault();
                            e.stopPropagation();
                            break;
                        case 27:
                            if ($(".popup").last().find("#CategoryLookupDialog").length === 0)
                            {
                                $(".popup").last().find(".popup-footer .button").eq(2).trigger("click");
                                $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus");
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            break;
                    }
                });
            });
        },

        _onRenameSubmit: function (catid, currentname, self)
        {
            var categoryVal = $("#CategoryName").val().trim();
            if (categoryVal !== "")
            {
                if (categoryVal !== currentname.trim())
                {
                    self._renameCategory(catid, categoryVal);
                }
                else
                {
                    popupManager.closeLast();
                }
            }
            else
            {
                popupManager.showWarning({
                    message: Resources.Categories.CategoryNameRequiredText,
                    onClose: function () { $("#CategoryName").trigger("focus").caret("end"); }
                });
            }
        },

        _renameCategory: function (catid, newName)
        {

            var o = {
                action: "rename",
                datatype: "category",
                catid: catid,
                name: newName
            };

            var self = this;

            $.ajax({
                url: applicationRoot + "AppStudio/AJAXCall.ashx",
                data: $.param(o),
                cache: false,
                type: "POST",
                success: function (data)
                {
                    if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(data);
                        return;
                    }

                    if (data.selectSingleNode("error") !== null)
                    {
                        popupManager.showError({ message: data.selectSingleNode("error").text, onClose: function () { $("#CategoryName").trigger("focus").caret("end"); } });
                        return;
                    }

                    var tree = $("#CategoryLookupDialog .tree");

                    var node = tree.find("li:not(.root)").filter(function ()
                    {
                        return $(this).metadata().catid !== undefined && $(this).metadata().catid === catid;
                    });

                    node.children("a").text(newName);
                    tree.find("li.selected").removeClass("selected");
                    tree.tree("select", node);
                    self.deleteCategoryID = catid;
                    node.children("a").trigger("focus");
                    self.actionCategory = "rename";
                    SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree(o.datatype, catid);
                    popupManager.closeLast();
                }
            });
        },

        _deleteCategoryPrompt: function (catid)
        {

            if (this.context === undefined) this.context = {};
            this.context.catid = catid;

            var $this = this;
            var o = { action: "children", catid: catid };

            $.ajax({
                cache: false,
                data: $.param(o),
                dataType: "text",
                url: applicationRoot + "AppStudio/AJAXCall.ashx",
                type: "POST",
                success: function (hasChildItems)
                {
                    if (hasChildItems.toLowerCase() === "true")
                    {
                        popupManager.showWarning({ message: Resources.Categories.DeleteChildrenWarningText });
                    }
                    else
                    {
                        popupManager.showConfirmation({
                            headerText: Resources.MessageBox.Confirmation,
                            message: Resources.Categories.DeleteCategoryConfirmationText,
                            onAccept: function () { $this._deleteCategory(catid); },
                            onClose: function ()
                            {
                                setTimeout(function () { $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus"); }, 0);
                            }
                        });
                    }
                }
            });

        },

        _deleteCategory: function (catid)
        {

            if (catid !== undefined)
            {

                var o = {
                    action: "delete",
                    datatype: "category",
                    catid: catid
                };

                var self = this;

                $.ajax({
                    url: applicationRoot + "AppStudio/AJAXCall.ashx",
                    data: $.param(o),
                    cache: false,
                    type: "POST",
                    success: self._deleteCategorySuccess.bind(self)
                });

                popupManager.closeLast();
            }

        },

        _deleteCategorySuccess: function (data)
        {

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }
            var tree = $("#CategoryLookupDialog .tree");
            var catid = this.context.catid, node = tree.find("li").filter(function ()
            {
                return $(this).metadata().catid !== undefined && $(this).metadata().catid === catid;
            });
            var isSelected = node.hasClass("selected");
            var p, parentCatId;
            if (node.length > 0)
            {
                p = node.parent().parent();
                node.remove();
                if (p.children("ul").children("li").length === 0)
                {
                    p.removeClass("open").removeClass("haschildren");
                }
                parentCatId = p.metadata().catid;
            }

            if (isSelected)
            {
                tree.find("li.selected").removeClass("selected");
                tree.tree("select", p);
            }

            SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("category", parentCatId);

        },

        _refreshCategory: function (catid)
        {
            var tree = $("#CategoryLookupDialog .tree");
            var node = tree.find("li").filter(function ()
            {
                return $(this).metadata().catid !== undefined && $(this).metadata().catid === catid;
            });

            if (node.children("ul")) node.children("ul").empty();

            if (node.is(".children"))
            {
                node.removeClass("closed").addClass("open");
            }

            this._treeExpand(null, { node: node });

        },

        _value: function ()
        {

            var m = this.element.metadata();

            return (m.selected !== undefined) ? m.selected : {};

        },

        _destroy: function ()
        {
            // destorying the events
            this._destroyEvents();
        },

        disable: function ()
        {
            this.element.addClass("disabled");
            this._destroyEvents();
            $.Widget.prototype.disable.apply(this, arguments);
        },

        enable: function ()
        {
            this.element.removeClass("disabled");
            this._initEvents();
            $.Widget.prototype.enable.apply(this, arguments);
        },

        _equalsValue: function (compareToValue)
        {
            var currentValue = this._value();

            return (
                        currentValue === compareToValue || 
                        (
                            checkExists(currentValue) && checkExists(compareToValue) &&
                            (!checkExists(compareToValue.catid) || currentValue.catid === compareToValue.catid ) &&
                            (!checkExists(compareToValue.objectid) || currentValue.objectid === compareToValue.objectid) &&
                            (currentValue.isvalid === compareToValue.isvalid)
                        )
                    );
        },

        value: function (newValue)
        {

            if (newValue === undefined)
            {
                return this._value();
            }

            if (!this._equalsValue(newValue))
            {
                this._setOption("value", newValue);
            }

            return this;

        },

        html: function (options)
        {
            //TODO: TD 0001
            var html = "<div";
            if (options.id !== null && options.id !== undefined)
                html += " id=\"" + options.id + "_base\"";
            html += "class=\"input-control select-box lookup-box icon-control category-lookup";

            if (options.objType !== "" && options.objType !== undefined)
            {
                var metaArray = {};
                metaArray["objecttypes"] = options.objType;

                html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
            }

            html += "\"><div class=\"input-control-body\"><div class=\"input-control-m\"><div class=\"input-control-m-c\">"
                 + "<div class=\"input-control-wrapper\"><input";
            if (options.id !== null && options.id !== undefined)
                html += " id=\"" + options.id + "\"";
            html += " type=\"text\" readonly=\"readonly\" class=\"input-control\">"
                 + "<div class=\"input-control-watermark\"></div></div></div></div></div><div class=\"input-control-buttons\">"
                 + "<a class=\"ellipsis\" href=\"javascript:;\"><span><span>...</span></span></a></div></div>";
            return html;

        }

    };

    if (typeof SCCategoryLookup === "undefined") SCCategoryLookup = SourceCode.Forms.Controls.CategoryLookup;

    $.widget("ui.categorylookup", SourceCode.Forms.Controls.CategoryLookup);

})(jQuery);
