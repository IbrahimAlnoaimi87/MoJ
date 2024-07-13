(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.Tree = {

        regex:
        {
            quote: /\"/g
        },

        treedragoptions:
        {
            cursorAt: { left: -5, top: -5 },
            helper: "clone",
            appendTo: "body",
            distance: 20
        },

        applyDragHandlers: function (entry)
        {
            this._applyDragHandlers(entry);
        },

        _applyDragHandlers: function (entry)
        {
            if (this.options.draggable !== false && typeof this.options.draggable === "string")
            {
                if (!checkExists(entry))
                {
                    entry = this.element;
                }

                if (this.options.refreshDraggingPositions === true)
                {
                    this.treedragoptions.start = function (event, ui) // Fix for 538294 
                    {
                        $(document).on('mousewheel.treescroll MozMousePixelScroll.treescroll', function ()
                        {
                            // refreshPositions have a huge performance impact, so only set the option when we scroll
                            $(event.target)[this.draggableWidgetName]("option", "refreshPositions", true);
                        });
                    };

                    this.treedragoptions.stop = function (event, ui)
                    {
                        $(document).off('mousewheel.treescroll MozMousePixelScroll.treescroll');
                        $(event.target)[this.draggableWidgetName]("option", "refreshPositions", false);
                    }
                }
                var combinedOptions = this.treedragoptions;
                if (checkExists(this.options.treedragoptions))
                {
                    combinedOptions = $.extend({}, combinedOptions, this.options.treedragoptions)
                }

                this.draggableWidgetName = "draggable";

                if (checkExists(combinedOptions.draggableWidgetName))
                {
                    this.draggableWidgetName = combinedOptions.draggableWidgetName;
                }

                var anchors = entry.find("a")[this.draggableWidgetName](combinedOptions);

                var draggableOptions = this.options.draggable;

                anchors.on("dragstart", function (ev)
                {
                    var jQueryElement = $(this);
                    if (!jQueryElement.is(draggableOptions))
                    {
                        return false;
                    }
                    return true;
                });
            }
        },

        _objModel: null,

        _create: function ()
        {
            this._initClickHandler();
            this._applyDragHandlers();
            this._initKeyboardNavigation();

            this.rtl = document.documentElement.getAttribute("dir") === "rtl" || false;

            this.options.enabled = true;
        },

        _destroy: function ()
        {
            this._removeDragHandlers();
            this.element.off(".tree");
            this.element.off(".tree");
        },

        _setOption: function (key, value)
        {
            if (key === "draggable")
            {
                if (value !== false && value !== "")
                {
                    if (this.options.draggable !== value)
                    {
                        // The draggable option has changed
                        this._removeDragHandlers();
                    }

                    this.options.draggable = value;
                    this._applyDragHandlers();
                }
                else
                {
                    this.options.draggable = false;
                    this._removeDragHandlers();
                }
            }
            else if (key === "enabled")
            {
                this.options.enabled = value;

                if (value !== false)
                {
                    this._applyDragHandlers();
                }
                else
                {
                    this._removeDragHandlers();
                }
            }

            $.Widget.prototype._setOption.apply(this, arguments);
        },

        _initClickHandler: function ()
        {
            var $tree = this;

            this.element.on("click.tree", function (ev)
            {
                return $tree._itemSelect(ev);

            }).on("dblclick.tree", function (ev)
            {
                return $tree._itemChosen(ev);

            }).on("contextmenu.tree", function (ev)
            {

                if (!$tree.options.enabled)
                    return false;

                var t = $(ev.target);

                if (t.is("a"))
                {
                    $tree._trigger("contextmenu", ev, { node: t.closest("li") });
                    return false;
                }

            });
        },

        _initKeyboardNavigation: function ()
        {
            var $this = this;

            this.element.on("keyup.tree", "a", function (event)
            {
                if (!$this.options.enabled)
                    return false;

                var n = $(this).closest("li");

                switch (event.keyCode)
                {
                    case 13: //Enter	
                        $this._itemSelect(event);
                        $this._itemChosen(event);
                        break;
                    case 32: //space
                        $this._itemSelect(event);
                        break;
                    case 37: //left arrow
                        if (n.is(".children.open"))
                        {
                            $this.collapse(n);
                        }
                        else
                        {
                            n.parent().closest("li").children("a")[0].focus();
                        }
                        break;
                    case 38:  //up arrow
                        if (n.prev("li").length > 0)
                        {
                            var d = n.prev("li");

                            if (d.is(".children.open"))
                            {

                                while (d.is(".children.open"))
                                {
                                    d = d.children("ul").children("li:last-child");
                                }

                                d.children("a")[0].focus();

                            } else
                            {
                                d.children("a")[0].focus();
                            }
                        }
                        else
                        {
                            if (n.parent().is(":not(.tree)")) n.parent().closest("li").children("a")[0].focus();
                        }
                        break;
                    case 39: //right arrow
                        if (n.is(".children"))
                        {
                            if (n.is(".open"))
                            {
                                n.children("ul").children("li:first-child").children("a")[0].focus();
                            }
                            else
                            {
                                $this.expand(n);
                            }
                        }
                        else
                        {
                            if (n.next("li").length > 0)
                            {
                                n.next("li").children("a")[0].focus();
                            }
                        }
                        break;
                    case 40: //down arrow
                        if (n.is(".children.open"))
                        {
                            n.children("ul").children("li:first-child").children("a")[0].focus();
                        }
                        else if (n.next("li").length > 0)
                        {
                            n.next("li").children("a")[0].focus();
                        }
                        else
                        {
                            var p = n.parent().closest("li");

                            while (p.length === 0 || p.next("li").length === 0)
                            {
                                if (p.parent().is(".tree")) break;
                                p = p.parent().closest("li");
                            }

                            if (p.length > 0 && p.next("li").length > 0) p.next("li").children("a")[0].focus();
                        }
                        break;
                }

            });

        },

        _itemSelect: function (ev)
        {
            var $tree = this;

            if (!$tree.options.enabled) return false;

            var that = this;

            var fn = function ()
            {
                var magicnumber = 18; //Not sure what this is for, but it's being used in this method a lot.
                var doubleAsInt = parseInt($(that).data("double"), 10);
                if (doubleAsInt > 0) 
                {
                    $(that).data("double", doubleAsInt - 1);
                    return false;
                }
                else
                {
                    var t = $(ev.target), o = t.offset(), w = t.outerWidth();

                    if (t[0].tagName.toUpperCase() === "LI")
                    {
                        var bounds = { horizontal: {}, vertical: { top: o.top, bottom: (o.top + magicnumber) } };

                        if ($tree.rtl)
                        {
                            bounds.horizontal = {
                                left: o.left + w - magicnumber,
                                right: o.left + w
                            };
                        }
                        else
                        {
                            bounds.horizontal = {
                                left: o.left,
                                right: o.left + magicnumber
                            };
                        }

                        if ((ev.pageX >= bounds.horizontal.left && ev.pageX <= bounds.horizontal.right)
                            && (ev.pageY >= bounds.vertical.top && ev.pageY <= bounds.vertical.bottom))
                        {
                            if (t.is(".children") || t.children("ul").children("li").length > 0) $tree.toggle(t);
                        }
                    }
                    else if (t[0].tagName.toUpperCase() === "A" || t[0].parentNode.tagName.toUpperCase() === "A")
                    {
                        if (!$tree.options.multiselect || ($tree.options.multiselect && !ev.ctrlKey))
                        {
                            $tree.deselect(t.closest(".tree").find(".selected"));
                            $tree.select(t.closest("li"));
                        }
                        else
                        {
                            $tree._toggleSelect(t.closest("li"));
                        }

                        $tree._trigger("click", ev, { node: t.closest("li") });

                    }
                }
            };

            //if there is a doubleclick handler wait for a potential double click event,
            //otherwise immediately trigger the event (better experience)
            if (typeof this.options.dblclick === "function")
            {
                setTimeout(fn, 300);
            }
            else
            {
                fn();
            }

            return false;
        },

        _itemChosen: function (ev)
        {
            var $tree = this;

            if (!$tree.options.enabled)
                return false;

            $(this).data("double", 2);
            ev.stopPropagation();

            var t = $(ev.target);

            if (t.is("a"))
            {
                $tree._trigger("dblclick", ev, { node: t.closest("li") });
                return false;
            }
        },

        _removeDragHandlers: function (entry)
        {
            if ((this.options.draggable === false || (typeof this.options.draggable === "string" && this.options.draggable === "")) && checkExists(this.draggableWidgetName))
            {
                if (!checkExists(entry)) entry = this.element;

                entry.find(this.options.draggable)[this.draggableWidgetName]("destroy");
            }
        },

        //used by the categorylookup
        singleSelect: function ()
        {
            var t = arguments[0];
            this.deselect(t.closest(".tree").find(".selected"));
            this.select(t.closest("li"));
        },

        select: function ()
        {
            arguments[0].addClass("selected");
            this.selectedValue = $($(arguments[0])[0]);
            this._trigger("select", null, { node: arguments[0], tree: this.element });
        },

        deselect: function ()
        {
            arguments[0].removeClass("selected");
            this._trigger("deselect", null, { node: arguments[0], tree: this.element });
        },

        _toggleSelect: function ()
        {
            if (arguments[0].is(".selected"))
            {
                this.deselect(arguments[0]);
            }
            else
            {
                this.select(arguments[0]);
            }
        },

        _correctObjectInfoData: function (infoObj)
        {
            if (checkExists(infoObj.data))
            {
                for (prop in infoObj.data)
                {
                    infoObj[prop] = infoObj.data[prop];
                }
                delete infoObj.data;
            }
        },

        add: function (parentElement, infoObj, i, applyDragHandlers, buildTooltip)
        {
            var iconclass = this.element.attr("data-treeiconclass");

            if (!checkExists(applyDragHandlers))
            {
                applyDragHandlers = true;
            }
            this._correctObjectInfoData(infoObj);
            var checkedOut = "";
            if (parentElement.children("ul").length === 0) parentElement.append("<ul></ul>");

            if (checkExists(infoObj["checkout"]))
            {
                checkedOut = infoObj["checkout"] === "self" ? "checked-out" : "checked-out-user";
            }

            var jqLi = $('<li><a href="javascript:;"></a></li>');

            if (checkExistsNotEmpty(infoObj.nodeId))
            {
                jqLi.attr("id", infoObj.nodeId);
            }

            jqLi.data("metadata", infoObj);

            var n = null;
            //TODO: TD 0001
            if (checkExists(i))
            {
                if (i === -1)
                {
                    n = jqLi.insertBefore(parentElement.children("ul").children("li").eq(0));
                }
                else
                {
                    n = jqLi.insertAfter(parentElement.children("ul").children("li").eq(i));
                }
            }
            else
            {
                n = jqLi.appendTo(parentElement.children("ul"));
            }

            $this = this;


            $.each(infoObj, function (key, value)
            {

                switch (key.toLowerCase())
                {
                    case "id":
                    case "target":
                        if (checkExistsNotEmpty(value))
                        {
                            n.attr(key, value);
                        }
                        break;
                    case "text":
                        n.children("a").text(value);
                        //n.children("a").find(".name").text(value);
                        break;
                    case "icon":
                        n.addClass(value).children("a").addClass(value).addClass(iconclass).addClass("icon");
                        break;
                    case "children":
                    case "selected":
                        if (value) n.addClass(key);
                        break;
                    case "location":
                        n.attr("href", value);
                        break;
                    case "open":
                        n.addClass(value ? "open" : "closed");
                        break;
                }
            });

            if (this.options.renderObjectModel === false && buildTooltip === true)
            {
                infoObj.tooltip = infoObj.text;
                if (checkExists(parentElement) && !parentElement.hasClass("root"))
                {
                    var parentMetaData = $(parentElement[0]).metadata();
                    if (checkExists(parentMetaData))
                    {
                        var parentTooltip = parentMetaData.tooltip;
                        if (checkExists(parentTooltip))
                        {
                            infoObj.tooltip = parentTooltip + " - " + infoObj.tooltip;
                        }
                    }
                }
            }
            if (!checkExists(infoObj.tooltip))
            {
                infoObj.tooltip = checkExists(infoObj.title) ? infoObj.title : infoObj.description;
            }


            if (checkExists(infoObj.tooltip) && checkExists(n[0]))
            {
                n[0].childNodes[0].setAttribute("title", infoObj.tooltip);
                $(n[0].childNodes[0]).data("draggingNode", { tooltip: infoObj.tooltip });
            }

            if (checkedOut !== "")
            {
                n.addClass(checkedOut).children("a").addClass(checkedOut);
            }

            if (!parentElement.is(".children")) parentElement.addClass("children");

            if (typeof arguments[2] === "boolean" && arguments[2] && parentElement.is(":not(.open)"))
            {
                parentElement.addClass("open").removeClass("closed");
            }
            else if (parentElement.is(":not(.closed, .open)"))
            {
                parentElement.addClass("closed");
            }

            if (n.is(".children:not(.closed, .open)"))
            {
                n.addClass("closed");
            }

            if (applyDragHandlers)
            {
                this._applyDragHandlers(n);
            }

            return n;

        },

        remove: function ()
        {

            var n = arguments[0];
            var p = n.parent().closest("li");

            this._removeDragHandlers(n);
            n.remove();

            if (p.children("ul").children("li").length === 0) p.removeClass("children").removeClass("open").removeClass("closed");

        },

        update: function ()
        {

            var n = arguments[0], o = arguments[1], m = n.metadata(), c = n[0].className;

            if (c.indexOf("{") > -1)
            {
                c = (c.substring(0, c.indexOf("{") - 1) + " " + c.substring(c.lastIndexOf("}") + 1, c.length)).trim();
            }

            if (typeof o.data !== "undefined" && (typeof arguments[2] === "undefined" || (typeof arguments[2] !== "undefined" && arguments[2] === false)))
            {
                $.extend(m, o.data);
            }

            var ms = {};

            $.each(m, function (key, value)
            {
                switch (typeof value)
                {
                    case "boolean":
                    case "number":
                        ms[key] = value;
                        break;
                    case "string":
                        ms[key] = value;
                }
            });
            //TODO: TD 0001
            n[0].className = c;
            n.attr("data-options", jQuery.toJSON(ms));

            if (typeof o.description === "undefined") n.children("a").removeAttr("title");

            $.each(o, function (key, value)
            {
                switch (key.toLowerCase())
                {
                    case "id":
                    case "target":
                        n.attr(key, value);
                        break;
                    case "text":
                        n.children("a").text(value);
                        break;
                    case "icon":
                        n.children("a")[0].className = value;
                        break;
                    case "children":
                        if (value)
                        {
                            n.addClass("children");
                            if (typeof o.open === "undefined") n.removeClass("open").addClass("closed");
                        } else
                        {
                            n.removeClass("children").removeClass("open").removeClass("closed");
                            n.find("ul").remove();
                        }
                        break;
                    case "location":
                        n.attr("href", value);
                        break;
                    case "open":
                        n.removeClass(value ? "closed" : "open").addClass(value ? "open" : "closed");
                        break;
                    case "title":
                    case "description":
                        if (key.toUpperCase() === "TITLE" || (key.toUpperCase() === "DESCRIPTION" && (!checkExists(o.title) || o.title === "")))
                        {
                            n.children("a").attr("title", value);
                        }
                        break;
                    case "selected":
                        if ((value) && (!(n.hasClass("selected"))))
                        {
                            n.addClass("selected");
                        }
                        else
                        {
                            n.removeClass("selected");
                        }
                        break;
                }
            });

        },

        collapse: function ()
        {
            arguments[0].removeClass("open").addClass("closed");
            this._trigger("collapse", null, { node: arguments[0], tree: this.element });
        },

        expand: function (node, refresh)
        {
            arguments[0].removeClass("closed").addClass("open");
            var nodes = node.data("dynamicLoadNodes");
            if (checkExists(nodes))
            {
                this._treeload(nodes, node, $.extend(node.metadata(), { open: true }));
                this._applyDragHandlers(node);
                node.data("dynamicLoadNodes", null);
            }

            //check to see if this is a "refesh" action
            if (typeof arguments[1] !== "undefined")
            {
                this._trigger("expand", null, { node: arguments[0], tree: this.element, refresh: arguments[1] });
            }
            else
                this._trigger("expand", null, { node: arguments[0], tree: this.element });

            if (this.options.autoExpand)
            {
                if (node.hasClass("children"))
                {
                    var _this = this;
                    var children = node.find("> ul > li");
                    var expandableChildren = node.find("> ul > li.children");
                    if (expandableChildren.length === 0 || children.length === 1)
                        _this.expand(children.eq(0), refresh);
                }
            }
        },

        clear: function ()
        {
            var n = arguments[0] || this.element.children("li").eq(0);

            n.children("ul").remove();
            n.removeClass("children").removeClass("open").removeClass("closed");

        },

        toggle: function ()
        {
            if (arguments[0].is(".open"))
            {
                $('#__designerStatus').text('tree collapse initializing');
                this.collapse(arguments[0]);
                $('#__designerStatus').text('tree collapse initialized');
            }
            else
            {
                $('#__designerStatus').text('tree expand initializing');
                this.expand(arguments[0]);
                $('#__designerStatus').text('tree expand initialized');
            }
        },

        find: function ()
        {

            var result, search;
            search = null;

            switch (arguments[0])
            {
                case "selected":
                    search = this.element.find(".selected");
                    break;
                case "id":
                    search = this.element.find("#" + arguments[1] + "]");
                    break;
                case "text":
                    search = $([]);
                    var criteria = arguments[2];
                    this.element.find("a").each(function ()
                    {
                        if ($(this).text() === criteria) search.pushStack(this);
                    });
                    break;
                case "metadata":
                    if (typeof arguments[2] === typeof "")
                    {
                        var key = arguments[2], value = arguments[3];
                        search = this.element.find("li").filter(function ()
                        {
                            return ($(this).metadata()[key] !== undefined && $(this).metadata()[key] === value);
                        });
                    }
                    else
                    {
                        //arguments are a Array of objects {someProp:true,someProp:'sdsd'},{someOtherProp:sdas}
                        //the objective of this particular search is to find the first item in the list that matches the the objects in the array in priority of order
                        var metaDataObjects = arguments[2];
                        if (!(metaDataObjects instanceof Array))
                        {
                            metaDataObjects = [metaDataObjects];
                        }
                        var results = [];
                        results.length = metaDataObjects.length;
                        this.element.find("li").each(function ()
                        {
                            for (var i = 0; i < metaDataObjects.length; i++)
                            {
                                var searchObject = metaDataObjects[i];
                                var isMatch = true;
                                for (var prop in searchObject)
                                {
                                    if (searchObject.hasOwnProperty(prop))
                                    {
                                        if (checkExists(searchObject[prop]))
                                        {
                                            if ($(this).metadata()[prop] === undefined)
                                            {
                                                isMatch = false;
                                            }
                                            else
                                            {
                                                var searchProperty = searchObject[prop].toLowerCase();
                                                //try find if the property is a comma delimited property if any of the values satisfy the search criteria
                                                var propertyParts = $(this).metadata()[prop].toLowerCase().split(",");
                                                var partMatched = false;
                                                for (var j = 0; j < propertyParts.length; j++)
                                                {
                                                    if (propertyParts[j] === searchProperty)
                                                        partMatched = true;
                                                }
                                                //only if none of the propertyparts match set the match to false
                                                //setting isMatch to true would invalidate the previous iterations through the search object properties collection
                                                if (!partMatched)
                                                    isMatch = false;
                                            }

                                        }
                                    }
                                }
                                if (isMatch)
                                {
                                    results[i] = jQuery(this);
                                    //break loop optimization for if the first priority item was found
                                    if (i === 0)
                                        return false;
                                }
                            }
                        });
                        for (var i = 0; i < results.length; i++)
                        {
                            //find the first non null result 
                            if (results[i])
                            {
                                search = results[i];
                                break;
                            }
                        }

                    }
                    break;
                case "root":
                    search = this.element.children("li");
                    break;
            }

            switch (arguments[1])
            {
                case "objects":
                    result = [];
                    search.each(function ()
                    {
                        var o = {}, $this = $(this);
                        o.text = $this.children("a").text();
                        o.id = $this.attr("id");
                        o.children = $this.is(".children");
                        o.open = $this.is(".open");
                        o.target = $this.attr("target");
                        o.location = ($this.attr("href") !== "javascript:;") ? $this.attr("href") : "";
                        o.icon = $this.children("a")[0].className;
                        result.push(o);
                    });
                    break;
                default:
                    result = search;
            }

            return result;
        },

        partialLoadXmlIntoModel: function (options)
        {
            var nodes = options.nodes;
            var model = options.modelObj || {};

            this._treeload(nodes, null, model);
        },

        findModelObject: function (searchObj)
        {
            var result = null;

            if (Array.isArray(searchObj))
            {
                var searchLength = searchObj.length;
                var searchCounter = 0;
                while (checkExists(result) !== true && searchCounter < searchLength)
                {
                    result = findObjectInArrayMatchingAll({
                        queryObject: searchObj[searchCounter],
                        targetObject: this._objModel,
                        targetPropertiesContainMultipleValues: true
                    });

                    searchCounter++;
                }
            }
            else
            {
                result = findObjectInArrayMatchingAll({
                    queryObject: searchObj,
                    targetObject: this._objModel,
                    targetPropertiesContainMultipleValues: true
                });
            }

            // return null, otherwise jQuery UI will return the instance
            if (typeof result === "undefined")
            {
                return null;
            }
            else
            {
                return result;
            }
        },

        sort: function (n, datatype)
        {
            var mylist = n.children("ul");
            var listitems = mylist.children('li').get();
            listitems.sort(function (a, b)
            {

                var aMetaData = $(a).metadata();
                var bMetaData = $(b).metadata();

                if (datatype !== "category")
                {
                    if ((aMetaData.datatype !== "all" && bMetaData.datatype !== "all") && (aMetaData.datatype === bMetaData.datatype))
                    {
                        var compA = $(a).text().toUpperCase();
                        var compB = $(b).text().toUpperCase();
                        return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                    }
                    else
                    {
                        return 0;
                    }
                }
                else if (datatype === "category")
                {
                    if (aMetaData.datatype === "all" && bMetaData.datatype === "all")
                    {
                        var compA = $(a).text().toUpperCase();
                        var compB = $(b).text().toUpperCase();
                        return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                    }
                    else
                    {
                        return 0;
                    }
                }
            });
            $.each(listitems, function (idx, itm)
            {
                mylist.append(itm);
            });
        },

        loadXML: function (xml, node, applyDragHandlers, objModel)
        {
            if (!checkExists(applyDragHandlers))
            {
                applyDragHandlers = true;
            }
            if (xml.ownerDocument)
                xml = xml.ownerDocument;
            var nodes = $("nodes > node", xml);

            if (!checkExists(node))
            {
                node = this.element.children("li:first-child").addClass("loading");
            }

            if (!checkExists(objModel))
            {
                objModel = node.metadata();
                if (!checkExists(objModel))
                {
                    objModel = {};
                }
                if (jQuery.isEmptyObject(objModel))
                {
                    objModel.root = true;
                }
            }

            var resultObject = this._treeload(nodes, node, objModel);
            if (!checkExists(this._objModel))
            {
                this._objModel = resultObject;
            }

            if (applyDragHandlers)
            {
                this._applyDragHandlers(node);
            }
        },

        _addMetadataProperties: function (node, obj, parentTooltip)
        {
            var attributes = node.attributes;

            for (var j = 0; j < attributes.length; j++)
            {
                var key = attributes[j].nodeName;
                var value = attributes[j].nodeValue;

                //handle bool values
                if (value.toString().toLowerCase() === "true")
                {
                    value = true;
                }

                if (value.toString().toLowerCase() === "false")
                {
                    value = false;
                }

                switch (key.toLowerCase())
                {
                    case "text":
                    case "open":
                        obj[key] = value;
                        break;
                    case "children":
                    case "haschildren":
                        obj.children = value;
                        break;
                    case "description":
                        obj.description = value;
                        break;
                    case "icon":
                        obj[key] = value;
                        break;
                    case "title":
                        obj[key] = value.replaceAll("\\n", "\n");
                        break;
                    default:
                        obj[key] = value;
                        break;
                }

                obj.nodeId = new String().generateGuid();

                if (this.options.renderObjectModel === true && this.options.buildTooltip)
                {
                    obj.tooltip = obj.text;
                    if (checkExists(parentTooltip))
                    {
                        obj.tooltip = parentTooltip + " - " + obj.tooltip;
                    }
                }
                else if (!checkExists(obj.tooltip))
                {
                    obj.tooltip = checkExists(obj.title) ? obj.title : obj.description;
                }
            }
        },

        _treeload: function (nodes, entry, objModel)
        {
            var $this = this;

            if (this.options.renderObjectModel === true && !checkExists(objModel))
            {
                objModel = {};
            }

            if (this.options.renderObjectModel === true && !checkExists(objModel.childItems))
            {
                objModel.childItems = [];
            }

            if (nodes.length > 0)
            {
                if (this.options.renderObjectModel && objModel.open !== true && objModel.root !== true && checkExists(entry))
                {
                    entry.data("dynamicLoadNodes", nodes);
                    entry.addClass("children closed")
                }
                for (var i = 0; i < nodes.length; i++)
                {
                    var node = nodes[i];
                    var o = {};

                    this._addMetadataProperties(node, o, objModel.tooltip)

                    var n = null;
                    if (checkExists(entry) && (!this.options.renderObjectModel || objModel.root === true || objModel.open === true))
                    {
                        n = $this.add(entry, o, undefined, false, $this.options.buildTooltip);
                    }

                    if (this.options.renderObjectModel === true)
                    {
                        objModel.childItems[objModel.childItems.length] = o;

                        if (objModel.dynamic === true && objModel.open === true)
                        {
                            objModel.dynamicloaded = true;
                        }
                    }

                    var childNodes = $(node).children("node");
                    if (childNodes.length > 0)
                    {
                        $this._treeload(childNodes, n, o);
                    }
                }
            }
            else
            {
                // If the node was expanded but no children exists, the node will be collapsed automatically after two seconds
                if (checkExists(entry) && entry.is(".children.open"))
                {
                    window.setTimeout(function () { this.collapse(entry); }.bind(this), 2000);
                }
            }

            if (checkExists(entry))
            {
                entry.removeClass("loading");
            }

            return objModel;
        },
        selectedValue: null,
        getValueData: function ()
        {
            var output = null;

            if (checkExists(this.selectedValue))
            {
                output = this.selectedValue.metadata();
            }
            return output;
        }

    };

    if (typeof SCTree === "undefined") SCTree = SourceCode.Forms.Controls.Tree;

    $.widget("ui.tree", SourceCode.Forms.Controls.Tree);

    $.extend($.ui.tree.prototype, {
        getter: "add find sort loadXML expand getValueData",
        options: {
            multiselect: false,
            draggable: false,
            renderObjectModel: false
        }
    });

})(jQuery);
