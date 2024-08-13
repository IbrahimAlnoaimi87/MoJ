//Purpose: 
// * A self contained widget that allows searching and finding assets in the category system.
// * This should be used as a left nav, or potentially as the content of a popup modal.
// * Hide/Show functionality for the left nav bar
// * Resizing of the left nav bar also.

(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    var ExceptionHandler = SourceCode.Forms.ExceptionHandler;

    SourceCode.Forms.Controls.NavigationPanel = {
        options: {
            itemSelected: null, //callback option - when a treenode or search result is highlighted
            itemOpened: null, //callback option - when an item is dbl-clicked or "open" is clicked.
            filterChanged: null, //callback option - when the list of filters (smo, view, etc) are changed at the bottom of the nav
            dragStart: null, //callback option - will fire when something from the nav is starting to be dragged. return false to cancel the drag.
            treeLoaded: null, //Callback option - will fire when the tree has loaded all of its contents, the first time.
            itemMoved: null, //callback option - happens then an item is moved between folders (categories)
            typeFilter: null, //string - this should be the filter desired when the navpanel initiates, in the format "view|workflow|etc"
            contextMenu: true // boolean - Defaults to true, indicating if a context menu is enabled on the tree.
        },

        _create: function ()
        {
            this.searchGrid = null;
            this.checkmenu = null;
            this.currentFilter = "all|category|smartobject|form|view|workflow"; //string version of filter
            this.exclusionFilter = "systemobject";
            this.ctlSearchBox = null; //a complex control for searching.
            this.tree = null;
            this._showingSearchResults = false;
            this._cancelCatRefreshSelections = false;

            if (styleProfileEnabled)
            {
                this.currentFilter += "|styleprofile";
            }

            if (!!this.options.typeFilter && typeof (this.options.typeFilter) == "string")
            {
                this.currentFilter = this.options.typeFilter;
            }

            if (this.element.is(".full"))
            {
                this.header = this.element.children(".navigation-panel-header");
                this.body = this.element.children(".navigation-panel-body");
                this.divider = this.element.children(".navigation-panel-divider");
                this.buttoncontainer = this.element.children(".navigation-panel-buttons");
                this.footer = this.element.children(".navigation-panel-footer");

                this.buttons = { normal: null, overflown: null };
                this.buttons.normal = this.buttoncontainer.find("li");
                this.buttons.overflown = this.footer.find(".navigation-panel-footer-controls li");

                this.divider.css("bottom", (this.footer.outerHeight() + this.buttoncontainer.outerHeight()) + "px");
                this.body.css("bottom", (this.buttoncontainer.outerHeight() + this.divider.outerHeight() + this.footer.outerHeight()) + "px");

                this.footer.children(".navigation-panel-footer-c").appendTo(this.footer);
            }

            this.element.find(".pane-container").panecontainer();

            this._inittree();
            this._initCollapseExpandClick();
            this._initcheckmenu();

            this._initSearch();

            this.element.on("navpanel.removeobjects", function (event, objects, catid)
            {
                this.removeobjects(objects, catid);
            }.bind(this));
        },


        _destroy: function ()
        {
            this.tree = null; //should stop any logic from happening if the tree elements have been removed from the dom.

            this.element.off("navpanel.removeobjects");
        },

        //public method
        //updates the badging of an item found in the navigation panel
        updateItemStatus: function (guid, datatype, statusaction)
        {
            //Update the search grid if visible (just re-search again!)
            //TODO: make this more granular - i.e. just update the individual item.
            if (this.isSearchShowing())
            {
                this.search();
            }

            var isCheckingIn = statusaction == "checking-in";
            var isCheckingOut = statusaction == "checking-out";
            var isCancellingAction = statusaction == "cancel-loading";
            var isStartingAction = statusaction == "start-loading";

            // Build selector query to find the appplicable node
            var qry = "";
            switch (datatype)
            {
                case "form":
                    qry = "li.form";
                    if (isCheckingIn) qry += ".checked-out";
                    break;
                case "view":
                    qry = "li.view";
                    if (isCheckingIn) qry += ".checked-out";
                    qry += ", li.item-view";
                    if (isCheckingIn) qry += ".checked-out";
                    qry += ", li.list-view";
                    if (isCheckingIn) qry += ".checked-out";
                    qry += ", li.capturelist-view";
                    if (isCheckingIn) qry += ".checked-out";
                    break;
                case "styleprofile":
                    qry = "li.styleprofile";
                    if (isCheckingIn) qry += ".checked-out";
                    break;
            }

            // Find similar nodes
            var nodes = this.tree.find(qry);

            // Unable to find it, try the nodes that has a loading status
            if (nodes.length === 0)
            {
                nodes = this.tree.find("li.loading");
            }

            // Filter the nodes to find the exact nodes being looked for
            nodes = nodes.filter(function ()
            {
                return $(this).metadata().guid === guid;
            });

            // Update the statusses accordingly

            if (isCheckingIn)
            {
                nodes.children("a").addBack().removeClass("checked-out").removeClass("loading");
                nodes.each(function () { $(this).metadata().checkout = false; }).removeClass("loading");
            }
            else if (isCheckingOut)
            {
                nodes.children("a").addBack().addClass("checked-out").removeClass("loading");
                nodes.each(function () { $(this).metadata().checkout = "self"; }).removeClass("loading");
            }

            if (isStartingAction)
            {
                nodes.each(function () { $(this).addClass("loading"); });
            }

            if (isCancellingAction)
            {
                nodes.each(function () { $(this).removeClass("loading"); });
            }
        },

        //public method
        sortByName: function ()
        {
            this.searchGrid.grid("sort", 2, false); //2nd column is the Name column
            this._sortTree("name");
        },

        //public method
        sortByType: function ()
        {
            this.searchGrid.grid("sort", 4, false); //4th column is the type column (Hidden)
            this._sortTree("type");
        },


        _sortTree: function (sorttype)
        {
            var self = this;
            var entries = this.tree.children("ul").children("li:not(.recent)");
            var uls = entries.find("ul");

            uls.each(function ()
            {
                var lis = $(this).children("li.category");

                lis.sortElements(self._treesortbyname.bind(self));

                lis = $(this).children("li:not(.category)");

                if (sorttype === "name")
                {
                    lis.sortElements(self._treesortbyname.bind(self));
                }
                else
                {
                    lis.sortElements(self._treesortbytype.bind(self));
                }
            });

            $.ajax({
                cache: false,
                data: $.param({ action: "setting", name: "AppStudioTreeSortBy", value: "sort-by-" + sorttype }),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST"
            });
        },

        //public method
        isSearchShowing: function ()
        {
            return this.searchGrid.is(":visible");
        },

        //public method
        collapse: function (ev)
        {
            this.element.addClass("collapsed");
            this.header.find(".navigation-panel-header-controls a.collapse").removeClass("collapse").addClass("expand").attr("title", this.element.metadata().expandtext);
            this._trigger("collapse", ev);
        },

        //Public method
        expand: function (ev)
        {
            this.element.removeClass("collapsed");
            this.header.find(".navigation-panel-header-controls a.expand").removeClass("expand").addClass("collapse").attr("title", this.element.metadata().collapsetext);
            this._trigger("expand", ev);
        },

        expandRecents: function ()
        {
            this.refreshRecentFiles(); //this also expands the node (currently)
        },

        //public method
        showTreeView: function ()
        {
            this._showTreeView();
        },

        //public method: simply puts focus on the selected node, if its visble and loaded.
        //does not load additional nodes, or expand nodes.
        focusSelected: function ()
        {
            var entry = this.tree.find(".selected");
            entry.children("a").trigger("focus");
        },

        //public method: find the item in the all-items tree and select it.
        revealItem: function (guid, datatype, legacy, callback)
        {
            //Make sure the the TreeView in the navpanel is showing.
            this.showTreeView();

            //build ajax method params
            var o = {
                action: "refreshstudiocategorytree",
                datatype: datatype,
                typefilter: this.currentFilter
            };

            if (datatype !== "workflow" && datatype !== "category")
            {
                o.guid = guid;
            }
            else
            {
                o.id = guid;
            }

            if (checkExistsNotEmpty(legacy))
            {
                o.legacy = legacy;
            }

            //find the category for the item.
            $.ajax({
                url: "AppStudio/AJAXCall.ashx",
                data: $.param(o),
                cache: false,
                type: "POST",
                success: function (data)
                {
                    this._revealitem_success(data, guid, datatype, legacy, callback);
                }.bind(this)
            });
        },

        //public method - scrolls the currently selected item into view.
        scrollSelectedIntoView: function ()
        {
            //scroll the treeview to the correct location
            window.setTimeout(function ()
            {
                try
                {
                    //check for null rather than throw exceptions
                    if ($this.tree.length > 0 && $this.tree.find(".selected").length > 0)
                    {
                        $this.tree.find(".selected").scrollintoview();
                    }
                }
                catch (e) { }
            }, 250);
        },

        //select the category specified.
        //returns an object describing the selected category.
        selectCategory: function (catid)
        {
            var promise = jQuery.Deferred();
            var item = { systemobject: false };

            var allItemsCategory = this.tree.find("li.all-items");
            var filterFn = function ()
            {
                var allCategories = allItemsCategory.find(".category");
                return allCategories.filter(function ()
                {
                    var nodeMeta = $(this).metadata();
                    if (checkExists(nodeMeta) && nodeMeta.type === "category" && nodeMeta.catid === catid)
                    {
                        return true;
                    }
                });
            }

            if (catid === "1")
            {
                //select "All Items" category
                if (!allItemsCategory.hasClass("selected"))
                {
                    allItemsCategory.addClass("selected");
                }
                //deselect any other nodes
                this.tree.find("li:not(.all-items).selected").removeClass('selected');

                promise.resolve(item);
            }
            else
            {
                //Select a specific category.
                var selectedNode = filterFn();

                // The tree haven't been loaded.
                if (selectedNode.length === 0)
                {
                    // Load the tree.
                    this.revealItem(catid, "category", false, function ()
                    {
                        // Check again if we can find the category after the tree has been populated.
                        selectedNode = filterFn();

                        if (selectedNode.length > 0)
                        {
                            // Success.
                            item.systemobject = (selectedNode.hasClass("systemobject")); //bool
                            promise.resolve(item);
                        }
                        else
                        {
                            // Failed loading.
                            promise.reject(item);
                        }
                    }.bind(this));
                }
                else
                {
                    // Check if all parent nodes are expanded.
                    var parents = selectedNode.parentsUntil(this.tree, "li.children");
                    for (var i = 0; i < parents.length; i++)
                    {
                        var currentNode = parents.eq(i);
                        if (currentNode.hasClass("closed"))
                        {
                            this.tree.tree("expand", currentNode);
                        }
                    }

                    // Resolve immediately because the category is loaded.
                    item.systemobject = (selectedNode.hasClass("systemobject")); //bool
                    promise.resolve(item);
                }

                promise.done(function ()
                {
                    if (selectedNode.length > 0)
                    {
                        allItemsCategory.find(".selected").addBack().removeClass("selected");
                        selectedNode.addClass("selected");
                    }
                });
            }

            return promise;
        },

        // return an object (not an element) that represents the selected category system item.
        // only reflects the tree at the moment, will not return the selected search result.
        getSelectedItem: function ()
        {

            var el = this.tree.find(".selected");
            var meta = $(this).metadata();

            //fill a Object containing a description of the object selected.
            var item = {
                systemobject: (el.hasClass("systemobject")),
                selected: true,
                type: meta.type,
                catid: meta.catid
            };

            return item;
        },

        //public method - returns the sort order currently chosen
        getSortby: function ()
        {
            var sortBy = $("#AppStudioGridPC_AppStudioTreeSortBy").val();
            switch (sortBy) 
            {
                case "sort-by-type":
                case "type":
                    return "type";
                default:
                    return "name";
            }
        },

        setSortby: function (sortBy)
        {
            switch (sortBy)
            {
                case "sort-by-type":
                case "type":
                    $("#AppStudioGridPC_AppStudioTreeSortBy").val("type");
                    break;
                default:
                    $("#AppStudioGridPC_AppStudioTreeSortBy").val("name");
                    break;
            }
        },

        refreshUserFiles: function ()
        {
            // Refresh the User & Recent Nodes
            this._refreshFlatNode(this.tree.find("li.user"));
        },

        refreshRecentFiles: function ()
        {
            this._refreshFlatNode(this.tree.find("li.recent"));
        },

        //refresh a flat-list node, like the recents of user items.
        _refreshFlatNode: function (nodes)
        {
            var $this = this;
            nodes.each(function ()
            {
                var pn = $(this);
                var open = (pn.is(".open"));

                pn.addClass("children").addClass("closed");
                //lets refresh these node, since new nodes have been added
                if (open)
                {
                    $this.tree.tree("collapse", pn);
                    $this.tree.tree("clear", pn);
                    $this.tree.tree("expand", pn, true);
                }
            });
        },

        //public property
        typeFilter: function ()
        {
            return this.currentFilter;
        },

        //Parameters - either param can be a string or an array.
        updateFilters: function (inclusions, exclusions)
        {
            var include = [];
            var exclude = [];
            var allIncluded = false;
            var objectTypes = ["category", "smartobject", "form", "view", "workflow", "styleprofile"];

            // Derive inclusions
            if (typeof inclusions === "string")
            {
                if (inclusions === "all")
                {
                    allIncluded = true;
                    include = objectTypes;
                    exclude = [];
                }
                else if (inclusions === "")
                {
                    inclusions = [];
                }
                else
                {
                    include = inclusions.split("|");
                }
            }
            else //its an array
            {
                include = inclusions;
            }

            // Derive exclusions
            if (typeof exclusions !== "undefined")
            {
                exclude = (typeof exclusions === "string") ? exclusions.split("|") : exclusions;
            }
            else
            {
                exclude = this.checkmenu.getExclusions();

                for (var x = 0; x < include.length; x++)
                {
                    var xIndex = exclude.indexOf(include[x]);
                    if (xIndex > -1)
                    {
                        exclude.splice(xIndex, 1);
                    }
                }

            }

            // Ensure inclusion of categories
            if (!include.contains("category"))
            {
                include.push("category");
            }

            // Ensure inclusion/exclusion of system objects if user setting is set:
            var excludeSystemObject = exclude.indexOf("systemobject") >= 0;
            if (!include.contains("systemobject") && !excludeSystemObject)
            {
                include.push("systemobject");
            }
            else if (!excludeSystemObject)
            {
                exclude.push("systemobject");
            }

            // Setting filter values
            this.currentFilter = include.join("|");
            this.exclusionFilter = exclude.join("|");

            this._updateFilters(this.currentFilter, include);
        },

        _updateFilters: function (currentFilter, include)
        {
            //Update checkmenu labels and check correct items:
            this.checkmenu.html(currentFilter);
            this.checkmenu.checkItems(include);
        },

        //refreshes the user and recent nodes always!
        //refreshes a specific node/nodes specified by the datatype, catid, objguid, objsysname
        //LG: this was copied from appstudio verbatim.
        refreshItemsById: function (datatype, catid, objguid, objsysname, legacy, callback)
        {

            //if a specific node needs to be refreshed... (i.e. we passed in an id of some sort)
            if (!(checkExists(catid) || checkExists(objguid) || checkExists(objsysname))) return;

            var $this = this;
            var entry = $this.tree.find("li.all-items");

            // Reset the flag before seding the request so that user selections will be selected in the AJAX result unless cancelled by the user selecting another artefact.
            this._cancelCatRefreshSelections = false;

            // Checking to see if the category for the item has changed.
            // remove the node from the tree if its catid metadata doesn't match it's position in the tree (i.e. its been moved).
            if (checkExists(catid) && (checkExistsNotEmpty(objguid) || checkExistsNotEmpty(objsysname)))
            {
                var qry;

                //datatype = if there was a datatype passed into this method, filter by that.
                switch (datatype)
                {
                    case "smartobject":
                        qry = "li.smartobject";
                        break;
                    case "view":
                        qry = "li.view, li.item-view, li.list-view, li.capturelist-view, li.content-view";
                        break;
                    case "form":
                        qry = "li.form";
                        break;
                    case "workflow":
                        qry = "li.workflow";
                        break;
                    default:
                        qry = "li";
                }

                //Search inside all-items for items matching the guid or systemname
                //where the datatype matches also (datatype can just be "li", which means all items)
                var enodes = entry.find(qry).filter(function ()
                {
                    var thisMetadata = $(this).metadata();
                    if (datatype !== "workflow")
                    {
                        var metadataGuid = thisMetadata.guid;
                        return checkExists(metadataGuid) && metadataGuid.toLowerCase() === objguid.toLowerCase();
                    }
                    else
                    {
                        if (checkExists(objsysname))
                        {
                            var metadataSystemname = thisMetadata.systemname;
                            return checkExists(metadataSystemname) && metadataSystemname.toString() === objsysname;
                        }
                        else
                        {
                            var metadataId = thisMetadata.id;
                            return checkExists(metadataId) && metadataId.toString() === objguid;
                        }
                    }
                });

                // remove any nodes that have moved categories
                // i.e. their category meta data doesn't match their parent node in the tree.
                // LG: this is ugly - we're trying to work out what happened by looking at the data, but we should know when the user clicks what has happened!
                // LG: use of .parent.parent, is not great. 
                enodes.each(function ()
                {
                    if ($(this).parent().parent().is(".category") && $(this).parent().parent().metadata().catid.toString() !== catid.toString())
                    {
                        $this.tree.tree("remove", $(this));
                    }
                });
            }

            //expand the node
            entry.removeClass("closed").addClass("open");

            //Build up POST data for the ajax call.
            var o = { action: "refreshstudiocategorytree", datatype: datatype };
            if (checkExistsNotEmpty(objguid)) o.guid = objguid;
            if (checkExists(catid) && catid > 0) o.catid = catid;
            if (o.datatype === "workflow")
            {
                //Move the Workflow ID from the Guid to the ID Field in the Ajax call
                o.id = objguid;
                delete o.guid;

                if (checkExistsNotEmpty(legacy))
                {
                    o.legacy = legacy;
                }
            }

            //Refresh the specific item requested.
            $.ajax({
                cache: false,
                data: $.param(o),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST",
                success: function (data)
                {
                    this._refreshItemsById_success(data, entry, callback);
                    this._refreshLazyLoadedArtefacts(o);
                }.bind(this)
            });

        },

        _refreshLazyLoadedArtefacts: function (ajaxOptions)
        {
            ajaxOptions.action = "gettreedata";
            ajaxOptions.filter = "associations";

            $.ajax({
                cache: false,
                data: $.param(ajaxOptions),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST",
                success: function (data)
                {
                    this._refreshLazyLoadedArtefacts_success(ajaxOptions, data);
                }.bind(this)
            });
        },

        _refreshLazyLoadedArtefacts_success: function (ajaxOptions, data)
        {
            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }

            var mainQry = null;
            var mainIDProperty = null;
            var subQry = null;
            var subIDProperty = null;

            switch (ajaxOptions.datatype.toUpperCase())
            {
                case "WORKFLOW":
                    mainQry = "li.workflow";
                    mainIDProperty = "name";
                    subQry = "li.form";
                    subIDProperty = "guid";
                    break;
                case "FORM":
                    mainQry = "li.form";
                    mainIDProperty = "guid";
                    subQry = "li.workflow";
                    subIDProperty = "name";
                    break;
                case "VIEW":
                    mainQry = "li.view, li.item-view, li.list-view, li.capturelist-view, li.content-view";
                    mainIDProperty = "guid";
                    subQry = "li.smartobject";
                    subIDProperty = "guid";
                    break;
                default:
                    return;
            }

            var mainNode = data.selectSingleNode('nodes/node[@type = "' + ajaxOptions.datatype + '"]');
            if (checkExists(mainNode))
            {
                var mainID = mainNode.getAttribute(mainIDProperty);

                this.tree.find(mainQry).each(function (index, treeNode)
                {
                    treeNode = $(treeNode);
                    var metaData = treeNode.metadata();
                    if (checkExists(metaData) && metaData[mainIDProperty] === mainID)
                    {
                        if (treeNode.parent().parent().is(subQry))
                        {
                            // Remove matching node listed underneath it's accociated type.
                            this.tree.tree("remove", treeNode);
                        }
                        else
                        {
                            var isOpen = treeNode.is(".open");

                            // Remove children.
                            treeNode.find("li").each(function (index, childNode)
                            {
                                this.tree.tree("remove", $(childNode));
                            }.bind(this));

                            // Refresh the node's children
                            var nodeChildData = $("node", mainNode);
                            if (nodeChildData.length > 0)
                            {
                                this._treeload(nodeChildData, treeNode);
                                // Make sure this nodes children is showing the correct filter info.
                                this._treefilter(treeNode, this.currentFilter, this.exclusionFilter);
                            }
                            else
                            {
                                treeNode.removeClass("open").addClass("closed").removeClass("children");
                                isOpen = false;
                            }

                            if (isOpen)
                            {
                                treeNode.removeClass("closed").addClass("open");
                            }
                        }
                    }
                }.bind(this));

                // Replace the children of all associated sub types.
                this.tree.find(subQry).each(function (index, treeNode)
                {
                    treeNode = $(treeNode);
                    var metaData = treeNode.metadata();
                    if (checkExists(metaData) && checkExistsNotEmptyGuid(metaData[subIDProperty]))
                    {
                        // Make sure we don't find child nodes of the main category.
                        if (!treeNode.parent().parent().is(mainQry))
                        {
                            // Try and find this artefact's xml node if it is associated.
                            var associatedNode = data.selectSingleNode('nodes/node[@' + subIDProperty + ' = "' + metaData[subIDProperty] + '"]');
                            if (checkExists(associatedNode))
                            {
                                var isOpen = treeNode.is(".open");

                                // Remove children.
                                treeNode.find("li").each(function (index, childNode)
                                {
                                    this.tree.tree("remove", $(childNode));
                                }.bind(this));

                                // Refresh the accociated node's children.
                                var nodeChildData = $("node", associatedNode);
                                if (nodeChildData.length > 0)
                                {
                                    this._treeload(nodeChildData, treeNode);
                                    // Make sure this nodes children is showing the correct filter info.
                                    this._treefilter(treeNode, this.currentFilter, this.exclusionFilter);
                                }
                                else
                                {
                                    treeNode.removeClass("open").addClass("closed").removeClass("children");
                                    isOpen = false;
                                }

                                if (isOpen)
                                {
                                    treeNode.removeClass("closed").addClass("open");
                                }
                            }
                        }
                    }
                }.bind(this));
            }
        },

        //LG: this was copied from appstudio verbatim.
        _refreshItemsById_success: function (data, entry, callback)
        {

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }
            var $this = this;

            var selectedTreeNode = $this.tree.find(".selected");
            if (this._cancelCatRefreshSelections)
            {
                // Remove the selection from the xml data because the user made another selection before this AJAX call returned.
                var selectedNodes = data.selectNodes('//node[@selected = "true"]');
                for (var i = 0; i < selectedNodes.length; i++)
                {
                    selectedNodes[i].removeAttribute("selected");
                }
            }
            else
            {
                // Deselect any nodes that will be replaced by the selection contained in the xml data to be populated.
                selectedTreeNode.removeClass("selected");
            }


            $this._treerefresh($("nodes > node", data), entry);

            //Expand the node if it is not expanded already
            if (!entry.is(":visible"))
            {
                var n = entry;

                while (!n.is(":visible") && n.is("li") && n.parent("ul").is(":not(.tree)"))
                {
                    n.parent("ul").parent("li").removeClass("closed").addClass("open");
                    n = n.parent("ul").parent("li");
                }
            }

            // Sort the refresh data accordingly
            var sorttype = $this.getSortby();
            var entries = $this.tree.children("li").children("ul").children("li:not(.recent)");

            var uls = entries.find("ul");

            uls.each(function ()
            {
                var lis = $(this).children("li").toArray();

                for (var i = 0, l = lis.length; i < l; i++)
                {
                    if ($(lis[i]).is(":not(.category)"))
                        $(lis[i]).parent().append(lis[i]);
                }

                lis = $(this).children("li.category");

                lis.sortElements($this._treesortbyname.bind($this));

                lis = $(this).children("li:not(.category)");

                if (sorttype === "name")
                {
                    lis.sortElements($this._treesortbyname.bind($this));
                }
                else
                {
                    lis.sortElements($this._treesortbytype.bind($this));
                }
            });
            // End of sort

            if (this._cancelCatRefreshSelections)
            {
                // Reselect the user selected node post category refresh.
                $this.tree.find(".selected").removeClass("selected");
                selectedTreeNode.addClass("selected");
            }

            //Reset Filter			
            $this.scrollSelectedIntoView();

            if (typeof callback === "function") callback();
        },


        //TO BE FILLED FROM APPSTUDIO
        _showTreeView: function ()
        {

            this.treePanel.show()
            this.searchPanel.hide();

            this._showingSearchResults = false;
        },

        //expands the All Items node to the specific item (guid/datatype)
        _revealitem_success: function (data, guid, datatype, legacy, callback)
        {
            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                if (typeof callback === "function") callback();
                return;
            }

            //make sure "All Items" is expanded
            var entry = this.tree.find("li.all-items");
            entry.removeClass("closed").addClass("open");

            //Deselect the currently selected nodes
            this.tree.find(".selected").removeClass("selected");
            this._treerefresh($("nodes > node", data), entry);

            //Expand all of the Nodes down to the entry.
            if (!entry.is(":visible"))
            {
                var n = entry;
                while (!n.is(":visible") && n.is("li") && n.parent("ul").is(":not(.tree)"))
                {
                    n.parent("ul").parent("li").removeClass("closed").addClass("open");
                    n = n.parent("ul").parent("li");
                }
            }

            //Find the matching entry in the now-populated tree
            var allItems = this.tree.find("li");
            if (datatype !== "category")
            {
                if (datatype === "workflow" && checkExists(legacy))
                {
                    entry = allItems.filter(function (index)
                    {
                        return $(this).metadata().datatype === datatype
                            && $(this).metadata().guid === guid
                            && $(this).metadata().legacy === legacy;
                    });
                }
                else
                {
                    entry = allItems.filter(function (index)
                    {
                        return $(this).metadata().datatype === datatype
                            && $(this).metadata().guid === guid;
                    });
                }
            }
            else
            {
                var catId = guid.toString();
                entry = allItems.filter(function (index)
                {
                    if ($(this).metadata().type === datatype && $(this).metadata().catid === catId)
                    {
                        return true;
                    }

                    return false;
                });
            }

            //Select the found item
            entry.addClass("selected");

            //update the filters.
            this._treefilter("root", this.currentFilter, this.exclusionFilter);

            if (typeof callback === "function") callback();
        },

        //public method
        //will re-search based on the current keywords. keywords are optional.
        search: function (keywords)
        {
            if (typeof keywords == "string")
            {
                $this.ctlSearchBox.val(keywords);
            }
            this._search();
        },

        _search: function ()
        {
            var $this = this, o = { action: "search" }, scope = [];

            o.criteria = $this.ctlSearchBox.val();

            if (!checkExistsNotEmpty(o.criteria))
            {
                return false;
            }

            //cache the selected item if there is one.
            var selectedSearchItems = this.searchGrid.grid("fetch", "selected-rows");
            var selectedItems = [];
            selectedSearchItems.each(function ()
            {
                var item = SourceCode.Forms.Interfaces.AppStudio.getItemMetaDataFromGridRow($(this));
                selectedItems.push(item);
            });


            //make a comma delimited string for the scope parameter, passed to the ajax call.
            var strings = this.checkmenu.getInclusions();
            for (var x = 0; x < strings.length; x++)
            {
                var value = strings[x];
                if (value !== "all")
                    scope.push(value);
            }

            o.match = $this.ctlSearchBox.filter();
            o.scope = scope.join(",");
            if ($this.exclusionFilter.contains("systemobject")) o.systemobjects = false;

            this.checkmenu.enableItem("category");

            $this.searchPanel.siblings().hide();
            $this.searchPanel.show().overlay({ modal: true, icon: "loading" });

            if (ExceptionHandler.IsAjaxInProgress($this.searchAjax))
            {
                //abort the previous ajax request if there is any
                $this.searchAjax.abort();
            }

            //perform the search ajax call
            $this.searchAjax = $.ajax({
                url: "AppStudio/AJAXCall.ashx",
                data: $.param(o),
                cache: false,
                type: "POST",
                success: function (data, status, xhr)
                {
                    if (ExceptionHandler.AjaxUnsuccessful(xhr, status, data))
                    {
                        $this._searchError(data);
                        return;
                    }

                    $this._searchSuccess(data, selectedItems);
                },
                error: function (xhr, status, error)
                {
                    if (!ExceptionHandler.AjaxAborted(xhr))
                    {
                        $this._searchError(error);
                    }
                }
            });
        },


        //parse and display the search results.
        _searchSuccess: function (data, selectedItems)
        {
            var $this = this;

            // Clear the grid for new results
            $this.searchGrid.grid("clear");

            var items = $("item", data);

            // Load the results
            if (items.length > 0)
            {
                // Loading search results
                items.each(function ()
                {
                    var dataType = $(this).children("datatype").text();
                    var name = $(this).children("name").text();
                    var description = $(this).children("description").text();
                    var categoryPath = $(this).children("path").text();
                    var title = "";

                    var icon = $this._getIconClassForItem(
                        dataType.toLowerCase(),
                        $(this).children("status").text().toLowerCase(),
                        dataType === "workflow" ? ($(this).children("lockedby").attr("self") === "true" ? "true" : $(this).children("lockedby").text()) : $(this).children("status").attr("self"),
                        $(this).is("item[systemobject=true]")
                    );

                    switch (dataType)
                    {
                        case "category":
                            {
                                title = name;
                                break;
                            }
                        case "workflow":
                            {
                                var lockedby = $(this).children("lockedby").text();
                                title = SourceCode.Forms.Interfaces.AppStudio.formatTitleForWorkflowName(name, description, lockedby);

                                if ($(this).children("guid").text() === "0")
                                {
                                    icon += " workflow-deployed";
                                }

                                break;
                            }
                        default: //smartobject, view, form
                            {
                                var title = SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(name, description);
                                break;
                            }
                    }

                    if (checkExistsNotEmpty(categoryPath) && dataType !== "category")
                    {
                        if (checkExistsNotEmpty(title))
                        {
                            title += "\n";
                        }
                        title += Resources.AppStudio.CategoryPathTooltip.format(categoryPath);
                    }

                    var rowClasses = icon;
                    var row = [
                        { value: $(this).children("guid").text() },
                        { icon: icon, value: dataType, display: "&nbsp;" },
                        { value: name, display: $(this).children("displayname").text(), icon: icon, title: title, isLiteral: true },
                        { value: description, isLiteral: false },
                        { value: dataType },
                        { value: $(this).children("version").text() },
                        { value: $(this).children("datemodified").text() },
                        { value: $(this).children("author").text() },
                        { value: $(this).children("datecreated").text() },
                        { value: (dataType !== "workflow" ? $(this).children("status").text() : "") },
                        { value: (dataType === "workflow" ? $(this).children("legacy").text() : "") },
                        { value: (dataType === "workflow" ? $(this).children("sharetype").text() : "") },
                        { value: "" }
                    ];
                    $this.searchGrid.grid("add", "row", row, false, null, rowClasses);
                });

                // Apply drag handlers to search results.
                $this.searchGrid.find("table.grid-content-table > tbody > tr").draggable({
                    helper: function (ev)
                    {
                        var row = $(ev.currentTarget);
                        var html = "<a href=\"javascript:;\" class=\"ui-draggable " + row.children().eq(2).metadata().icon
                            + " { guid: '" + row.children().eq(0).text() + "', "
                            + "datatype: '" + row.children().eq(4).metadata().value + "' }"
                            + "\">" + row.children().eq(2).text() + "</a>";

                        return $(html).appendTo("body");
                    },
                    cursorAt: { left: -5, top: -5 },
                    appendTo: "body",
                    start: function (ev, ui)
                    {
                        //crude way to get the datamodel for the item being dragged;
                        var item = SourceCode.Forms.Interfaces.AppStudio.getItemMetaDataFromGridRow($(ev.target));

                        //call any event handlers (external controls), will decide whether to cancel the drag or not.
                        if (typeof $this.options.dragStart === "function")
                        {
                            return $this.options.dragStart(ev, ui, item);
                        }
                    }
                });

                //reselect any previously selected items before the search occured.
                if (!!selectedItems && selectedItems.length > 0)
                {

                    $(selectedItems).each(function ()
                    {
                        //reselect the items.
                        //TODO: find the item in the list  
                    });
                }
            }

            // Populate the Search Result status bar
            $this.element.find("#AppStudioStatusBarSearchCount").text(items.length === 0 ? Resources.AppStudio.ZeroItemCountText :
                (items.length === 1 ? Resources.AppStudio.SingleItemCountText :
                    Resources.AppStudio.MultipleItemCountText.format(items.length)));
            $this.element.find("#AppStudioStatusBarSearchSelectCount").text("");

            //make sure the search content is now displayed
            $this.searchPanel.show().siblings().hide();
            $this.searchPanel.removeOverlay();
            $this._showingSearchResults = true;
        },

        //an ajax error occured while loading the search results.
        _searchError: function (data)
        {
            SourceCode.Forms.ExceptionHandler.handleException(data);
            this.searchPanel.removeOverlay();
        },

        //TO BE FILLED FROM APPSTUDIO
        _clearsearch: function ()
        {
            // Clear search criteria & results grid
            this.ctlSearchBox.val("");
            this.searchGrid.grid("clear").hide().siblings().show();
            this._showingSearchResults = false;

            //because doing a search enables category as menu filter option, need to disable and autoselect it again
            this.checkmenu.disableItem("category");
            this.checkmenu.checkItem("category");
        },

        _getIconClassForItem: function (type, status, self, isSystem)
        {
            return SourceCode.Forms.Interfaces.AppStudio.getIconClassForItem(type, status, self, isSystem);
        },

        //TO BE FILLED FROM APPSTUDIO
        _toggleSearchBox: function ()
        {
            //deprecated, as match dropdown was moved into searchbox.js control.
        },

        //when the X is clicked in the search ctrl
        _ctlSearchBox_onCancel: function (ev)
        {
            //clear search text
            this._clearsearch();
            this.currentFilter = this.checkmenu.getInclusions().join("|");
            this.checkmenu.html(this.currentFilter);

            //rebuilds the tree:
            this.checkmenu.checkItems(this.currentFilter.split("|"));
            this._showTreeView();
        },

        _ctlSearchBox_onSearch: function (ev)
        {
            this._search();
        },

        _ctlSearchBox_onMatchChanged: function ()
        {
            var criteria = this.ctlSearchBox.val();
            if (checkExists(criteria) && criteria.trim().length > 0)
            {
                this._search();
            }
        },

        //LG:Navigation - this needs to be moved out into the grid?
        _inittree: function ()
        {
            if (!checkExists(this.tree))
            {

                var $this = this;
                var jqScope = this.element;

                $this.tree = jqScope.find("#AppStudioTree").tree({
                    click: $this._treeclick.bind($this),
                    dblclick: $this._treedblclick.bind($this),
                    expand: $this._treeexpand.bind($this),
                    contextmenu: $this.options.contextMenu ? $this._treecontextmenu.bind($this) : null,
                    draggable: "a.smartobject, a.view, a.item-view, a.list-view, a.content-view, a.capturelist-view, a.form, a.workflow, a.category"
                });

                //switch out these lines to get rid of the root node :)
                var entry = $this.tree;
                //var entry = $this.tree.children("li:first-child").addClass("loading");

                $.ajax({
                    cache: false,
                    data: "action=inittree&typefilter=" + this.currentFilter,
                    dataType: "xml",
                    url: "AppStudio/AJAXCall.ashx",
                    success: function (data)
                    {
                        this._treeloadSuccess(data, entry);
                    }.bind(this),
                    type: "POST"
                });

                // Dragging & Dropping from & onto AppStudio Tree
                var droppables = "a.category";
                var draggables = "a.smartobject, a.view, a.item-view, a.list-view, a.content-view, a.capturelist-view, a.form,a.workflow, a.category";

                $this.tree.on("dragstart.appstudio", draggables, function (ev, ui)
                {
                    //call any event handlers (external controls), will decide whether to cancel the drag or not.
                    if (typeof $this.options.dragStart === "function")
                    {
                        ui.node = $(ev.target).closest("li");
                        var item = $this._getItemMetaDataFromTreeNode(ui.node);
                        var cancel = !$this.options.dragStart(ev, ui, item);
                        if (cancel) return false;
                    }

                    //only bind the other drag events if the drag started. 
                    $this.tree.on("mouseover.appstudio", "a", function (e)
                    {
                        var anchor = $(e.target);
                        draggables = anchor.hasClass("all-items") ? "a.category" : draggables;

                        anchor.addClass("hover");
                        var uiHelperExists = checkExists(ui) && checkExists(ui.helper);

                        if (uiHelperExists)
                        {
                            if (ui.helper.is("a.category"))
                            {
                                droppables += ", a.all-items";
                            }
                        }

                        if (!anchor.is(droppables)) anchor.addClass("not-droppable");

                        if (anchor.is(droppables) && anchor.parent().is(".children.closed"))
                        {
                            var timer = window.setTimeout(function () { $this.tree.tree("expand", anchor.parent()); }, 2000);
                            anchor.data("timer", timer);
                            if (uiHelperExists)
                            {
                                ui.helper.addClass("valid");
                            }
                        }
                        else
                        {
                            if (uiHelperExists)
                            {
                                ui.helper.removeClass("valid");
                            }
                        }
                    });

                    //only bind the other drag events if the drag started. 
                    $this.tree.on("mouseout.appstudio", "a", function (e)
                    {
                        var anchor = $(e.target);

                        if (anchor.is(droppables) && anchor.data("timer") !== undefined)
                        {
                            window.clearTimeout(anchor.data("timer"));
                            anchor.removeData("timer");
                        }

                        anchor.removeClass("not-droppable").removeClass("hover");
                        if (checkExists(ui) && checkExists(ui.helper))
                        {
                            ui.helper.removeClass("valid");
                        }
                    });

                });

                $this.tree.on("dragstop.appstudio", draggables, function (ev, ui)
                {
                    $this.tree.find(".not-droppable").removeClass("not-droppable");
                    $this.tree.off("mouseover.appstudio", "a");
                    $this.tree.off("mouseout.appstudio", "a");
                    $this.tree.off("treeexpand.appstudio");

                    //Call any consuming handlers
                    if (typeof $this.options.dragStop === "function")
                    {
                        ui.node = $(ev.target).closest("li");
                        var item = $this._getItemMetaDataFromTreeNode(ui.node);
                        $this.options.dragStop(ev, ui, item);
                    }
                });

                //make the tree droppable, so that files can be dragged between folders.
                $this.tree.droppable({
                    accept: draggables,
                    tolerance: "pointer",
                    drop: $this._ondrop.bind($this)
                });

            }

        },

        //an item was dropped on the left nav
        //used when dragging things between folders in this navigation panel
        _ondrop: function (ev, ui)
        {
            var $this = this;
            var anchor = $(ev.originalEvent.target);

            if (anchor.is("a:not(.not-droppable)"))
            {
                if (checkExists(anchor.data("timer")))
                {
                    window.clearTimeout(anchor.data("timer"));
                    anchor.removeData("timer");
                }

                var catid;

                if (anchor.is(".all-items"))
                {
                    catid = 1;
                }
                else
                {
                    catid = anchor.parent().metadata().catid;
                }

                var m = ui.draggable.parent().metadata();
                var displayname = ui.draggable.text();

                var moveInfo = {};

                if (m.type === "category")
                {
                    //$this._moveTo([[m.catid, m.type, ui.draggable.text()]], null, catid);
                    moveInfo = {
                        id: m.catid,
                        name: displayname,
                        catid: m.catid,
                        datatype: m.type,
                        legacy: null,
                        tocatid: catid
                    };
                }
                else if (m.type === "workflow")
                {
                    //$this._moveTo([[m.guid, m.type, ui.draggable.text(), m.systemname, m.legacy]], null, catid);
                    moveInfo = {
                        id: m.guid,
                        name: displayname,
                        systemname: m.systemname,
                        catid: m.catid,
                        datatype: m.type,
                        legacy: m.legacy,
                        tocatid: catid
                    };
                }
                else
                {
                    //$this._moveTo([[m.guid, m.type, ui.draggable.text()]], null, catid);
                    moveInfo = {
                        id: m.guid,
                        name: displayname,
                        catid: m.catid,
                        datatype: m.type,
                        legacy: m.legacy,
                        tocatid: catid
                    };
                }

                if (typeof this.options.itemMoved === "function")
                {
                    this.options.itemMoved(moveInfo);
                }
            }
        },

        //public method
        //used by sourcecode.form.designers.form.js to decide whether to register drag events (ie. so only registered once)
        getNavEvents: function ()
        {
            var _tabContentEvents = this.panelContainer.data('events');
            return _tabContentEvents;
        },

        //public method
        //used by sourcecode.form.designers.form.js to decide whether to register drag events (ie. so only registered once)
        getPanelElement: function ()
        {
            return this.panelContainer;
        },

        _initSearch: function ()
        {
            var $this = this;

            //Get references to the UI Elements that this class uses.
            this.treePanel = this.element.find("#AppStudioNavigationPanel");
            this.searchPanel = this.element.find("#AppStudioSearchGrid");
            this.panelContainer = this.element.find("#AppStudioNavigationPane"); //is the container of the searchPanel and Tree Panel

            //integrated search box
            this.ctlSearchBox = this.element.find(".input-control.search-box").searchbox({
                onCancel: this._ctlSearchBox_onCancel.bind(this),
                onSearch: this._ctlSearchBox_onSearch.bind(this),
                onMatchChanged: this._ctlSearchBox_onMatchChanged.bind(this)
            }).data("ui-searchbox");

            // Hide the search panel, as otherwise it will display over the top of the tree :(
            this.searchPanel.hide();

            // Hiding the Tabbbox Header (only visible when on search tab
            this.element.find("#AppStudioTabbox").removeClass("with-header").find(".tab-box-header").hide();


            // Initialize the Search Results Grid
            if (!checkExists(this.searchGrid))
            {
                this.searchGrid = this.searchPanel.grid({
                    multiline: false,
                    rowcontextmenu: $this.options.contextMenu ? function (item, ev)
                    {
                        var meta = SourceCode.Forms.Interfaces.AppStudio.getGridRowMetaData($this.searchGrid, true);
                        var refreshCallback = function ()
                        {
                            $this.search();
                        }.bind($this);
                        SourceCode.Forms.Interfaces.AppStudio._contextmenu(ev, item, $this, $this.searchGrid, meta, refreshCallback);
                        ev.preventDefault();
                        return false;
                    } : null,
                    paging: false,
                    multiselect: true,
                    zebraStripes: false,
                    rowselect: this._searchRowSelect.bind(this),
                    //rowunselect: this._searchRowUnselect.bind(this),
                    rowdblclick: this._searchRow_dblclick.bind(this),
                    singleEventOnMultiSelect: true
                });

                this.searchGrid.grid("hide", "column-headers");
                //this.searchGrid.hide(); // Initially have it hidden

                //make sure context menus appear on empty search results, or the background of the grid.
                this.searchGrid.find(".grid-body-content .scroll-wrapper").on("contextmenu.appstudio", function (ev)
                {
                    if ($this.options.contextMenu)
                    {
                        var meta = SourceCode.Forms.Interfaces.AppStudio.getGridRowMetaData($this.searchGrid, true);

                        meta.objecttype = "search"; //returns refresh and sort context menu items only.

                        var refreshCallback = function ()
                        {
                            $this.search();
                        }.bind($this);
                        SourceCode.Forms.Interfaces.AppStudio._contextmenu(ev, null, null, null, meta, refreshCallback);
                    }
                }.bind(this));

                // Body whitespace click (deselect)
                this.searchGrid.find(".grid-body-content .scroll-wrapper").on("click.appstudio", SourceCode.Forms.Interfaces.AppStudio._gridWhitespaceClick.bind(this));
            }
        },

        //Init the filter menu items at the bottom of the navpanel
        _initcheckmenu: function ()
        {
            if (!checkExists(this.checkmenu))
            {

                var $this = this;
                var jqElement = this.element.find("#AppStudioFilterMenu");
                if (jqElement.length == 1 && !this.checkmenuElement)
                {
                    this.checkmenuElement = jqElement.checkmenu({
                        click: $this._clickCheckMenu.bind($this),
                        checkedChanged: $this._changeCheckMenuFilter.bind($this)
                    });
                    this.checkmenu = this.checkmenuElement.data("ui-checkmenu"); //get a reference to the instance.
                    this._loadCheckContextMenu();

                    //this.checkmenu.checkmenu("refresh"); //forces an init - otherwise there will be init errors later.
                    this.checkmenu.setPaneWidth(this.element.width(), false);
                }
            }
        },

        //public method - used by interrfaces.appstudio
        resizeFilterMenu: function ()
        {
            this.checkmenu.setPaneWidth(null, true);
        },

        _searchRowSelect: function (r, e)
        {
            var $this = this;
            var rows = this.searchGrid.grid("fetch", "selected-rows");

            //originally did the interfaces.appstudio._gridrowSelect
            if (rows.length == 1)
            {
                var item = SourceCode.Forms.Interfaces.AppStudio.getItemMetaDataFromGridRow(rows.eq(0));

                //call any event handlers (external controls)
                if (typeof this.options.itemSelected === "function")
                {
                    this.options.itemSelected(item, e);
                }
            }
        },

        //If its a category - list the category.
        //if its a file - edit the file
        _searchRow_dblclick: function (r, e)
        {
            var $this = this;
            var rows = this.searchGrid.grid("fetch", "selected-rows");

            if (rows.length == 1)
            {
                var item = SourceCode.Forms.Interfaces.AppStudio.getItemMetaDataFromGridRow(rows.eq(0));

                //call any event handlers (external controls)
                if (typeof this.options.itemOpened === "function")
                {
                    this.options.itemOpened(item);
                }
            }
        },

        //gets called when the tree is right-clicked - from treeinit.
        _treecontextmenu: function (ev, item)
        {
            var $this = this;
            ///////////////////////////////////////////////////////////////////////////////////////////
            // Bug 117109 - select the current item on right click and remove selection once the context menu closes if the item wasn't previously selected.
            // The inteded behavior according to 117109 is the emulate the current tree behavior of windows explorer.
            var el = item.node;
            var wasSelected = el.hasClass("selected");
            // Temporarily add selection the right-clicked node while it's context menu is open if it wasn't previously selected.
            if (!wasSelected)
            {
                el.addClass("selected");
            }
            // The context menu has closed restore selections to pre right-click state.
            var hideCallback = function ()
            {
                if (!wasSelected)
                {
                    el.removeClass("selected");
                }
            }.bind(this);
            ///////////////////////////////////////////////////////////////////////////////////////////
            var refreshCallback = function ()
            {
                $(ev.currentTarget).removeClass("error");
                $this.refreshSelectedNode();
            }.bind($this);


            var contextmeta = SourceCode.Forms.Interfaces.AppStudio.getTreeNodeMetaData(el);
            SourceCode.Forms.Interfaces.AppStudio._contextmenu(ev, item, null, null, contextmeta, refreshCallback, hideCallback); //send through the navpanel, but not the grid.

            ev.preventDefault();
            return false; //stop the browser right click from coming up.
        },

        //checks to see if a specific filter e.g. "view" is in the currentFilter.
        _filterContains: function (filter)
        {
            if (!!this.currentFilter && !!filter)
            {
                return (this.currentFilter.indexOf("all") > -1 || this.currentFilter.indexOf(filter) > -1);
            }
            return false;
        },

        //load the filter menu items.
        _loadCheckContextMenu: function ()
        {
            var $this = this;
            if ($this.checkmenu.countItems() === 0)
            {

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "smartobject",
                    text: Resources.ObjectNames.SmartObjectPlural,
                    id: "smartobject",
                    description: Resources.CommonActions.ShowHideObjectTextSmartObjectPlural,
                    checked: this._filterContains("smartobject")
                });

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "view",
                    text: Resources.ObjectNames.SmartViewPlural,
                    id: "view",
                    description: Resources.CommonActions.ShowHideObjectTextSmartViewPlural,
                    checked: this._filterContains("view")
                });

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "form",
                    text: Resources.ObjectNames.SmartFormPlural,
                    id: "form",
                    description: Resources.CommonActions.ShowHideObjectTextSmartFormPlural,
                    checked: this._filterContains("form")
                });

                //----------------------------------------------------------------------------
                if (styleProfileEnabled)
                {
                    this.checkmenu.addItem({
                        icon: "styleprofile",
                        text: Resources.ObjectNames.StyleProfilePlural,
                        id: "styleprofile",
                        description: Resources.CommonActions.ShowHideObjectTextStyleProfilePlural,
                        checked: this._filterContains("styleprofile")
                    });
                }

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "workflow",
                    text: Resources.ObjectNames.WorkflowProcessPlural,
                    id: "workflow",
                    description: Resources.CommonActions.ShowHideObjectTextWorkflowProcessPlural,
                    checked: this._filterContains("workflow")
                });
                //---------------------------------------------------------------------

                this.checkmenu.addSeperator();

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "category",
                    text: Resources.ObjectNames.CategoryPlural,
                    id: "category",
                    description: Resources.CommonActions.ShowHideObjectTextCategoryPlural,
                    checked: this._filterContains("category"),
                    enabled: false
                });

                //----------------------------------------------------------------------------
                this.checkmenu.addItem({
                    icon: "",
                    text: Resources.ObjectNames.SystemObjectPlural,
                    id: "systemobject",
                    description: Resources.CommonActions.ShowHideObjectTextSystemObjectPlural,
                    checked: systemCategoriesEnabled,
                    enabled: true,
                    onClick: function (ev, chk) { $this._saveSystemObjectPreference(chk); }
                });
                //----------------------------------------------------------------------------
            }
        },

        //filter menu (checkmenu) saves whether system objects are turned on/off
        _saveSystemObjectPreference: function (chk)
        {
            var showSystemObjectCategories = chk;

            $.ajax({
                cache: false,
                data: $.param({ action: "setting", name: "SystemObjectsEnabled", value: showSystemObjectCategories }),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                type: "POST"
            });
        },

        _clickCheckMenu: function (ev)
        {
            this.checkmenu.setPaneWidth(this.element.width(), false);
            this.checkmenu.showContextMenu(ev);
        },


        //happens when a checkbox in the filter menu it checked/unchecked.
        _changeCheckMenuFilter: function (ev)
        {
            var $this = this;

            $this.currentFilter = $this.checkmenu.getInclusions().join("|");
            $this.exclusionFilter = $this.checkmenu.getExclusions().join("|");

            //treeview filter
            $this._treefilter("root", $this.currentFilter, $this.exclusionFilter);


            //call any event handlers (external controls)
            if (typeof this.options.filterChanged === "function")
            {
                this.options.filterChanged($this.currentFilter);
            }

            //search results filter
            if ($this._showingSearchResults)
            {
                $this._search();
            }
        },

        //public method - chould return whether search results are currently being shown.
        showingSearchResults: function ()
        {
            return this._showingSearchResults;
        },

        _treeloadSuccess: function (data, entry)
        {

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                this._treeloadError(data, entry);
                return;
            }

            //Entry is the root node, already in the HTML from the aspx page.
            this._treeload($("nodes > node", data), entry);
            this.tree.tree("expand", entry);

            // Refresh the check menu triggering the filtering of the tree
            this.checkmenu.refresh();

            this._trigger("treeLoaded");
        },

        _treeloadError: function (data, entry)
        {
            SourceCode.Forms.ExceptionHandler.handleException(data);
            entry.removeClass("loading children").addClass("error");
        },

        _treeload: function (nodes, entry)
        {
            var $this = this;
            var metadata = entry.data("metadata");

            if (nodes.length > 0)
            {
                nodes.each(function ()
                {
                    var node = $(this);
                    $this._loadTreeNode(entry, node, false);
                });
            }
            else
            {
                if (entry.is(".children.open"))
                {
                    entry.removeClass("open").addClass("closed").removeClass("children");
                }
            }

            entry.removeClass("loading");
            if (entry.children("ul").children("li").length === 0)
            {
                entry.removeClass("open");
                if (checkExists(metadata))
                {
                    metadata.children = false;
                }
            }
            else
            {
                if (checkExists(metadata))
                {
                    metadata.children = true;
                }

                if (entry.is(":not(.root, .recent)") && entry.closest(".tree").length > 0)
                {
                    var sortby = $this.getSortby();

                    entry.children("ul").children("li.category").sortElements($this._treesortbyname.bind($this));
                    entry.children("ul").children("li:not(.category)").sortElements((sortby === "type") ? $this._treesortbytype.bind($this) : $this._treesortbyname.bind($this));
                }
            }
        },

        //entry is the parent node OR container element (with class ".tree").
        _loadTreeNode: function (entry, node, updateTree, options)
        {
            var o = { data: {} };
            o.text = node.attr("text");
            o.icon = node.attr("icon");
            o.title = o.text;
            o.open = false;
            o.selected = false;

            //var treeControlElement = (entry.is(".tree"))? entry : entry.closest(".tree");
            var treeControlElement = this.tree;

            var utility = SourceCode.Forms.Interfaces.AppStudio;
            var bob = node[0].outerHTML;

            // Building tree node options (used to generate tree node HTML)
            utility._mapBooleanAttribute(node, "haschildren", o, "children");

            utility._mapBooleanAttribute(node, "open", o, "open");
            utility._mapBooleanAttribute(node, "selected", o, "selected");
            utility._mapAttribute(node, "visible", o, "visible");
            utility._mapAttribute(node, "description", o, "description");
            utility._mapAttribute(node, "name", o, "name");

            utility._mapAttribute(node, "datatype", o.data, "datatype");
            utility._mapAttribute(node, "menuContext", o.data, "menuContext");
            utility._mapAttribute(node, "datatypes", o.data, "datatypes");
            utility._mapAttribute(node, "filter", o.data, "filter");
            utility._mapAttribute(node, "type", o.data, "type");
            utility._mapAttribute(node, "subtype", o.data, "subtype");
            utility._mapBooleanAttribute(node, "showintro", o.data, "showintro");
            utility._mapAttribute(node, "catid", o.data, "catid");
            utility._mapAttribute(node, "id", o.data, "guid");
            utility._mapAttribute(node, "sharetype", o.data, "sharetype");
            utility._mapAttribute(node, "childTypes", o.data, "childTypes");
            utility._mapAttribute(node, "sortby", o.data, "sortby");
            utility._mapAttribute(node, "sortorder", o.data, "sortorder");
            utility._mapAttribute(node, "systemname", o.data, "systemname");
            utility._mapAttribute(node, "checkout", o.data, "checkout");
            utility._mapAttribute(node, "lockedby", o.data, "lockedby");
            utility._mapAttribute(node, "legacy", o.data, "legacy");

            // To avoid the filter from applying expandibility on unbound views & forms
            // we will store this in the data
            if (checkExists(o.children))
            {
                o.data.children = o.children;
            }

            // System / Display Name Implementation
            if (o.data.datatype === "form" || o.data.datatype === "view" || o.data.datatype === "smartobject")
            {
                o.title = SourceCode.Forms.Interfaces.AppStudio.formatTitleForSystemName(o.name, o.description);
            }
            else if (o.data.datatype === "workflow")
            {
                o.title = SourceCode.Forms.Interfaces.AppStudio.formatTitleForWorkflowName(o.name, o.description, o.data.lockedby);
            }
            else if (checkExistsNotEmpty(o.description))
            {
                o.title = o.description;
            }
            var searchableIcon = o.icon;
            // Sandboxing - details
            if (checkExists(o.data.checkout))
            {
                if (o.data.checkout === "self")
                {
                    o.icon += " checked-out";
                }
                else
                {
                    o.icon += " checked-out-user";
                }
            }

            // Workflow - details
            if (o.data.datatype === "workflow")
            {
                if (checkExists(o.data.lockedby) && o.data.lockedby !== "" && o.data.lockedby !== "self")
                {
                    o.icon += " workflow-locked";
                }
                else if (checkExistsNotEmpty(o.data.sharetype) && o.data.sharetype !== "0" && o.data.sharetype.toLowerCase() !== "none")
                {
                    o.icon += " workflow-shared";
                }
                else if (!checkExistsNotEmpty(o.data.guid) || o.data.guid === "0")
                {
                    o.icon += " workflow-deployed";
                }
            }

            //update existing item or add new items
            if (checkExists(updateTree) && updateTree === true)
            {
                //update
                var liSelector = "li." + searchableIcon;
                if ((searchableIcon === "item-view") || (searchableIcon === "list-view"))
                {
                    liSelector = "li.item-view, li.list-view";
                }
                var an = entry.children("ul").children(liSelector);

                if (an.length)
                {
                    if (searchableIcon === "category")
                    {
                        an = an.filter(function ()
                        {
                            return $(this).metadata().catid === o.data.catid;
                        });
                    }
                    else if ((searchableIcon === "workflow") && (checkExists(o.data.systemname)))
                    {
                        an = an.filter(function () { return $(this).metadata().systemname.toUpperCase() === o.data.systemname.toUpperCase(); });
                    }
                    else
                    {
                        an = an.filter(function () { return $(this).metadata().guid === o.data.guid; });
                    }
                }
                if (an.length && an.length > 0)
                {
                    // Retain the node's display status (expanded/collapsed)
                    if (!o.open && checkExists(o.children) && o.children)
                    {
                        o.open = an.hasClass("open");
                    }

                    //get the current index that this node is positioned
                    options.index = an.index();
                    entry.closest(".tree").tree("update", an, o);

                    //remove icons if the a view changes type
                    if ((searchableIcon === "item-view") || (searchableIcon === "list-view"))
                    {
                        if ((an.hasClass("item-view")) && (an.children("a").hasClass("list-view")))
                        {
                            an.removeClass("item-view");
                            an.addClass(searchableIcon);

                        }
                        else if ((an.hasClass("list-view")) && (an.children("a").hasClass("item-view")))
                        {
                            an.removeClass("list-view");
                            an.addClass(searchableIcon);
                        }
                    }

                    // Update sandboxing icons
                    an.children("a").addBack().removeClass("checked-out checked-out-user");
                    an.children("a").addBack().removeClass("workflow-shared workflow-locked workflow-deployed");
                    if (checkExists(o.data.checkout))
                    {
                        an.children("a").addBack().addClass((o.data.checkout === "self") ? "checked-out" : "checked-out-user");
                    }

                    //update workflow shared icon
                    if (o.data.datatype === "workflow")
                    {
                        if (checkExistsNotEmpty(o.data.lockedby) && o.data.lockedby !== "self")
                        {
                            an.children("a").addBack().addClass("workflow-locked");
                        }
                        else if (checkExistsNotEmpty(o.data.sharetype) && o.data.sharetype !== "0" && o.data.sharetype.toLowerCase() !== "none")
                        {
                            an.children("a").addBack().addClass("workflow-shared");
                        }
                        else if (!checkExistsNotEmpty(o.data.guid) || o.data.guid === "0")
                        {
                            an.children("a").addBack().addClass("workflow-deployed");
                        }
                    }

                    // Retain tree node display state
                    if (node.children("node").length > 0)
                    {
                        this._treerefresh(node.children("node"), an);
                    }

                    // restore selection
                    if (o.selected)
                    {
                        an.addClass("selected");
                    }
                }
                else
                {
                    if (o.data.datatype === "workflow")
                    {
                        if (checkExistsNotEmpty(o.data.lockedby) && o.data.lockedby !== "self")
                        {
                            o.icon += " workflow-locked";
                        }
                        else if (checkExistsNotEmpty(o.data.sharetype) && o.data.sharetype !== "0" && o.data.sharetype.toLowerCase() !== "none")
                        {
                            o.icon += " workflow-shared";
                        }
                        else if (!checkExistsNotEmpty(o.data.guid) || o.data.guid === "0")
                        {
                            o.icon += " workflow-deployed";
                        }
                    }

                    //need to add this node after the last child index location
                    var n = null;
                    var hasItems = entry.children("ul").children("li");
                    if (hasItems.length > 0)
                    { //there are already some child items in this node
                        if (options.counter === 0)
                        { // then this must be placed as the top most item
                            n = treeControlElement.tree("add", entry, o, -1);
                        }
                        else
                        { //use the specified index to indicate the desired location
                            n = treeControlElement.tree("add", entry, o, options.index);
                        }
                    }
                    else
                    { // no child items: this is the first item to be added
                        n = treeControlElement.tree("add", entry, o);
                    }

                    // System - details
                    var systemObjectAttribute = node.attr("systemobject");
                    if (checkExists(systemObjectAttribute) && (systemObjectAttribute === "true"))
                    {
                        n.addClass("systemobject");
                    }

                    if (node.children("node").length > 0)
                    {
                        this._treeload(node.children("node"), n);
                    }

                    // restore selection
                    if (o.selected)
                    {
                        n.addClass("selected");
                    }
                }
            }
            else
            {
                //add
                var n = this.tree.tree("add", entry, o);

                // System - details
                var systemObjectAttribute = node.attr("systemobject");
                if (checkExists(systemObjectAttribute) && (systemObjectAttribute === "true"))
                {
                    n.addClass("systemobject");
                }

                // Recursively load child nodes
                if (node.children("node").length > 0)
                {
                    this._treeload(node.children("node"), n);
                }
            }
        },

        //node - is the jquery element that was clicked on - provided by the tree widget.
        _getItemMetaDataFromTreeNode: function (node)
        {
            var treeitem = node.metadata();
            treeitem.systemObject = node.hasClass("systemobject");
            treeitem.home = node.parent().is("ul.tree");
            if (node.closest(".recent").length > 0) treeitem.filter = "recent";
            if (node.closest(".user").length > 0) treeitem.filter = "user";
            return treeitem;
        },

        _treeclick: function (e, ui)
        {
            var treeitem = this._getItemMetaDataFromTreeNode(ui.node);
            ui.node.children("a").trigger("focus");

            // Cancel the category selections from any pending category refresh AJAX call because the user selected another artefact in the meantime.
            this._cancelCatRefreshSelections = true;

            //call any event handlers (external controls)
            if (typeof this.options.itemSelected === "function")
            {
                this.options.itemSelected(treeitem);
            }
        },

        _treedblclick: function (e, ui)
        {
            var n = ui.node;
            var treeitem = n.metadata();
            treeitem.systemObject = n.hasClass("systemobject");
            treeitem.home = n.parent().is("ul.tree");
            treeitem.typefilter = this.currentFilter;

            if (n.closest(".recent").length > 0)
            {
                treeitem.filter = "recent";
            }

            if (n.closest(".user").length > 0)
            {
                treeitem.filter = "user";
            }

            var workflowLocked = false;

            if ((treeitem.type === "workflow") && n.hasClass("workflow-locked"))
            {
                workflowLocked = true;
            }

            // trigger any dropdowns so that they can close
            // LG: Wow - this really needs to be done explicly here?!
            //div.drop-menu must be used, as there are also ul.drop-menu elements within the div.dropmenu.
            var dropdowns = $(document).find("div.drop-menu").hide();

            if (!(treeitem.type !== "folder" && treeitem.type !== "category")) // toggle category/folder state and select.
            {
                // A folder was double clicked
                this.tree.tree("toggle", n);
                n.children("a").trigger("click");
            }
            else if ((treeitem.systemObject === true) || workflowLocked)// prevent edit of system artifacts or locked workflows
            {
                n.children("a").trigger("click"); // redirect to single click for selection
            }
            else // edit anything else thats double clicked
            {
                var contextmeta = SourceCode.Forms.Interfaces.AppStudio.getTreeNodeMetaData(n);
                SourceCode.Forms.Interfaces.AppStudio._contextmenuclick_editfile(null, contextmeta);
            }

            //call any event handlers (external controls)
            if (typeof this.options.itemOpened === "function")
            {
                this.options.itemOpened(treeitem);
            }
        },

        _treeexpand: function (e, ui)
        {
            var n = ui.node, m = n.metadata();
            var $this = this;

            if (n.children("ul").children("li").length === 0)
            {
                var o = { action: "gettreedata" };

                if (checkExists(m.datatype))
                {
                    o.datatype = m.datatype;
                }

                if (m.type !== "folder" && m.type !== "category")
                {
                    switch (m.type)
                    {
                        case "smartobject":
                            o.filter = "objectviews";
                            o.guid = m.guid;
                            break;
                        case "view":
                            o.filter = "viewobjects";
                            o.guid = m.guid;
                            break;
                        case "form":
                            o.filter = "formprocsviews";
                            o.guid = m.guid;
                            break;
                        case "workflow":
                            o.filter = "processforms";
                            o.systemname = m.systemname;
                            o.id = m.guid;
                            break;
                    }
                }
                else if (m.type === "category")
                {
                    o.filter = "category";
                    o.catid = m.catid;
                    if (checkExists(m.datatypes))
                    {
                        o.datatypes = m.datatypes;
                        delete o.datatype;
                    }
                    else if (!checkExists(o.datatype))
                    {
                        o.datatypes = "all";
                    }
                }
                else
                {
                    if (checkExists(m.filter))
                    {
                        o.filter = m.filter; //for recents and user (filter=="recent")
                    }
                }

                o.typefilter = $this.currentFilter;
                n.removeClass("error").addClass("loading");
                $.ajax({
                    cache: false,
                    data: $.param(o),
                    dataType: "xml",
                    url: "AppStudio/AJAXCall.ashx",
                    success: function (data)
                    {
                        if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                        {

                            SourceCode.Forms.ExceptionHandler.handleException(data);
                            n.removeClass("loading children").addClass("error");
                            return;
                        }

                        $this._treeload($("nodes > node", data), n);
                        //make sure this nodes children is showing the correct filter info
                        $this._treefilter(n, $this.currentFilter, $this.exclusionFilter);
                    },
                    error: function (XMLHttpRequest, textStatus, responseText)
                    {

                        n.removeClass("loading").addClass("error");

                        if (textStatus === "timeout")
                        {
                            popupManager.showError(Resources.AppStudio.GenericTimeoutMessage);
                        }
                        else if (textStatus === "error" && [0, 12029].indexOf(XMLHttpRequest.status) !== -1)
                        {
                            popupManager.showError(Resources.ExceptionHandler.WebServerErrorSource);
                        }
                        else if (checkExistsNotEmpty(responseText))
                        {
                            popupManager.showError(responseText);
                        }
                        else
                        {
                            popupManager.showError(Resources.AppStudio.UnknownErrorMessage);
                        }
                    },
                    type: "POST"
                });
            }
            else if (checkExists(m.type) && !checkExists(m.showintro) && checkExists(ui.refresh))
            {

                //-----------------------------------------------------------------------------------
                // we need to ensure that we do not re-add existing children to this list
                // 1) Add new items
                // 2) Update any existing items
                //-----------------------------------------------------------------------------------
                var o = { action: "gettreedata" };

                if (checkExists(m.datatype))
                {
                    o.datatype = m.datatype;
                }

                if (m.type !== "folder" && m.type !== "category")
                {
                    switch (m.type)
                    {
                        case "smartobject":
                            o.filter = "objectviews";
                            break;
                        case "view":
                            o.filter = "viewobjects";
                            break;
                        case "form":
                            o.filter = "formviews";
                            break;
                    }

                    o.guid = m.guid;
                }
                else if (m.type === "category")
                {
                    o.filter = "category";
                    o.catid = m.catid;
                    if (checkExists(m.datatypes))
                    {
                        o.datatypes = m.datatypes;
                        delete o.datatype;
                    }
                }
                else
                {
                    if (checkExists(m.filter))
                    {
                        o.filter = m.filter;
                    }
                }

                o.typefilter = $this.currentFilter;

                n.addClass("loading");
                $.ajax({
                    cache: false,
                    data: $.param(o),
                    dataType: "xml",
                    url: "AppStudio/AJAXCall.ashx",
                    success: function (data)
                    {
                        if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                        {
                            SourceCode.Forms.ExceptionHandler.handleException(data);
                            return;
                        }

                        $this._treerefresh($("nodes > node", data), n);
                        $this._treefilter(n, $this.currentFilter, $this.exclusionFilter);
                    },
                    error: function (XMLHttpRequest, textStatus, responseText)
                    {
                        n.removeClass("loading").addClass("error");

                        if (textStatus === "timeout")
                        {
                            popupManager.showError(Resources.AppStudio.GenericTimeoutMessage);
                        }
                        else if (textStatus === "error" && [0, 12029].indexOf(XMLHttpRequest.status) !== -1)
                        {
                            popupManager.showError(Resources.ExceptionHandler.WebServerErrorSource);
                        }
                        else if (checkExistsNotEmpty(responseText))
                        {
                            popupManager.showError(responseText);
                        }
                        else
                        {
                            popupManager.showError(Resources.AppStudio.UnknownErrorMessage);
                        }
                    },
                    type: "POST"
                });
            }
        },

        _treefilter: function (node, include, exclude)
        {
            //set visibility depending on the Type Filter
            var $this = this;

            var included = include !== "" ? include.split("|") : [];
            var excluded = exclude !== "" ? exclude.split("|") : [];

            // View inclusion / exclusion extension
            if (included.contains("view"))
            {
                if (included.indexOf("item-view") === -1)
                {
                    included.push("item-view");
                }
                if (included.indexOf("list-view") === -1)
                {
                    included.push("list-view");
                }
            }
            if (excluded.contains("view"))
            {
                if (excluded.indexOf("item-view") === -1)
                {
                    excluded.push("item-view");
                }
                if (excluded.indexOf("list-view") === -1)
                {
                    excluded.push("list-view");
                }
            }

            // Setting the start node to root if missing or string argument passed
            if (!checkExists(node) || node === "root")
            {
                node = $this.tree.find("li.root");
                if (included.indexOf("user") === -1)
                {
                    included.push("user");
                }
                if (included.indexOf("all-items") === -1)
                {
                    included.push("all-items");
                }
                if (included.indexOf("recent") === -1)
                {
                    included.push("recent");
                }

            }

            if (!checkExists(node) || node.length == 0)
            {
                // If its on the AppStudio Category Tree, li.root has been removed. Use the tree (ul) as the root node instead.
                node = $this.tree;
            }

            // Collecting metadata to assist post filter rendering
            var metadata = node.metadata();

            // Creating CSS regular expressions to show/hide items
            var iRegExp = new RegExp("(" + included.join(")|(") + ")", "gi");
            var eRegExp = excluded.length > 0 ? new RegExp("(" + excluded.join(")|(") + ")", "gi") : null;

            // Child nodes filtering
            var nodes = node.find("> ul > li"), visibleChildren = false;

            for (var i = 0, l = nodes.length; i < l; i++)
            {
                var child = nodes[i], classNames = child.className, $child = $(child);

                if (classNames.match(iRegExp) && (eRegExp === null || (eRegExp !== null && !classNames.match(eRegExp))))
                {
                    // Should be visible
                    $child.removeClass("hidden");
                    visibleChildren = true;

                    // Filter any subnodes
                    $this._treefilter($child, include, exclude);
                }
                else
                {
                    // Should be hidden
                    $child.addClass("hidden");
                }
            }

            // Updating the expand/collapse based on post filter content
            if (!node.hasClass("hidden") && metadata.children || metadata.type === "folder" || metadata.type === "category")
            {
                var expandable = true;

                if (nodes.length > 0)
                {
                    // Child nodes exist (has been loaded) & none is visible
                    // A category with hidden children, which was open, should still be displayed as open
                    if (!visibleChildren && metadata.type !== "category")
                    {
                        expandable = false;
                    }
                }
                else
                {
                    // Node has children not yet loaded
                    switch (metadata.type)
                    {
                        case "smartobject":
                            if (!node.hasClass("children") || node.parent().parent().is(".list-view, .item-view") || !included.contains("view") || excluded.contains("view"))
                            {
                                expandable = false;
                            }
                            break;
                        case "view":
                            if (node.parent().parent().is(".smartobject") || !included.contains("smartobject") || excluded.contains("smartobject"))
                            {
                                expandable = false;
                            }
                            break;
                        case "form":
                            if (!included.contains("view") || excluded.contains("view"))
                            {
                                expandable = false;
                            }
                            break;
                        case "workflow":
                            if (node.parent().parent().is(".form") || !included.contains("form") || excluded.contains("form"))
                            {
                                expandable = false;
                            }
                            break;
                        case "category":

                            var childtypes = (metadata.childTypes !== undefined) ? metadata.childTypes.split("|") : [];
                            if (childtypes.length === 1 && childtypes[0] === "all")
                            {
                                expandable = true;
                            }
                            else if (childtypes.length > 0)
                            {
                                expandable = childtypes.some(function (e)
                                {
                                    return include.indexOf(e) !== -1;
                                });
                            }
                            else
                            {
                                expandable = metadata.children;
                            }
                            break;
                    }
                }

                if (expandable)
                {

                    node.addClass("children");
                }
                else
                {

                    node.removeClass("open").addClass("closed").removeClass("children");
                }
            }
        },

        _treerefresh: function (nodes, entry)
        {
            var $this = this;
            if (nodes.length > 0)
            {
                var index = 0;
                var counter = 0;

                // Removing tree nodes that are not within the nodes passed
                var cnodes = entry.children("ul").children("li");

                cnodes.each(function ()
                {
                    var cnode = $(this), tp = cnode.metadata().type, id, fnode, systemName;

                    if (tp === "category")
                    {
                        id = cnode.metadata().catid;
                    }
                    else if ((tp === "workflow") && (checkExists(cnode.metadata().systemname)))
                    {
                        systemName = cnode.metadata().systemname;
                    }
                    else
                    {
                        id = cnode.metadata().guid;
                    }

                    fnode = nodes.filter(function ()
                    {
                        if (tp === "category") return $(this).attr("type") === "category" && $(this).attr("catid") === id.toString();
                        if ((tp === "workflow") && (checkExists(systemName)))
                        {
                            return $(this).attr("type") === "workflow" && $(this).attr("systemname").toLowerCase() === systemName.toLowerCase();
                        }
                        if ((tp !== "category") && ((tp !== "workflow") || (!(checkExists(systemName))))) return $(this).attr("type") === tp && $(this).attr("id").toLowerCase() === id.toLowerCase();
                        return false;
                    });

                    if (fnode.length === 0) $(this).closest(".tree").tree("remove", $(this));
                });
                // End of redundant child nodes removal

                // Refreshing the rest
                nodes.each(function ()
                {
                    var node = $(this);

                    var options =
                    {
                        counter: counter,
                        index: index
                    };
                    $this._loadTreeNode(entry, node, true, options);
                    counter++;
                    index = options.index;

                });

            }

            entry.removeClass("loading");
            if (entry.children("ul").children("li").length === 0)
            {
                entry.removeClass("open");
            }
            else if (entry.is(":not(.root, .recent)") && entry.closest(".tree").length > 0)
            {
                var sortby = this.getSortby();

                entry.children("ul").children("li.category").sortElements($this._treesortbyname.bind($this));
                entry.children("ul").children("li:not(.category)").sortElements((sortby === "type") ? $this._treesortbytype.bind($this) : $this._treesortbyname.bind($this));
            }
        },

        //a function for comparison of tree nodes - used by sorting algorythm
        _treesortbyname: function (a, b)
        {
            var likeNames = -1;
            if ($(a).children("a").text().toUpperCase() === $(b).children("a").text().toUpperCase())
            {
                likeNames = $(a).metadata().datatype > $(b).metadata().datatype ? 1 : -1;
            }
            return likeNames === -1 ? ($(a).children("a").text().toUpperCase() > $(b).children("a").text().toUpperCase() ? 1 : -1) : 1;
        },

        //a function for comparison of tree nodes - used by sorting algorythm
        _treesortbytype: function (a, b)
        {
            var likeTypes = -1;
            if ($(a).metadata().datatype === $(b).metadata().datatype)
            {
                likeTypes = $(a).children("a").text().toUpperCase() > $(b).children("a").text().toUpperCase() ? 1 : -1;
            }
            return likeTypes === -1 ? ($(a).metadata().datatype > $(b).metadata().datatype ? 1 : -1) : 1;
        },

        //public method
        //should select the specified item, no promises.
        selecttreeobject: function (guid, datatype)
        {
            return this._selecttreeobject(guid, datatype);
        },

        //select all items in the tree with the given guid and datatype, including duplicates.
        _selecttreeobject: function (guid, datatype)
        {

            var qry;
            var isSelectedInTree = false;
            var $this = this;

            if (datatype === "view")
            {
                qry = "li.item-view, li.list-view, li.capturelist-view, li.content-view, li.view";
            }
            else
            {
                qry = "li." + datatype;
            }

            nodes = $this.tree.find(qry);

            filtered = nodes.filter(function ()
            {
                return ($(this).metadata().guid === guid &&
                    $(this).metadata().menuContext === "category");
            });

            // try to see if items is already in the tree
            filtered.each(function ()
            {
                var node = $(this);
                isSelectedInTree = true;

                var p = node.parent("ul").parent("li");
                while (p.length > 0 && !node.is(":visible") && !p.is(".root"))
                {
                    p.removeClass("closed").addClass("open");
                    p = p.parent("ul").parent("li");
                }

                $this.tree.find(".selected").removeClass("selected");
                node.addClass("selected");

                node.parents("li.category.closed").removeClass("closed");

                //scroll the treeview to the correct location
                window.setTimeout(function ()
                {
                    try
                    {
                        //check for null rather than throw exceptions
                        if ($this.tree.length > 0 && $this.tree.find(".selected").length > 0)
                        {
                            $this.tree.find(".selected").scrollintoview();
                        }
                    }
                    catch (e) { }
                }, 250);

            });

            return isSelectedInTree;
        },

        //attach the click event to the hide/show left nav button
        _initCollapseExpandClick: function ()
        {
            var $panel = this;

            //myele.on("mynamespacedmyevent",function(){});
            //myele.trigger("mynamespacedmyevent")

            this.header.find(".navigation-panel-header-controls a").on("click.SourceCode-Forms-Controls-NavigationPanel", function (ev)
            {
                if ($(this).is(".collapse"))
                {
                    $panel.collapse(ev);
                }
                else
                {
                    $panel.expand(ev);
                }
                return false;
            });
        },

        //public method
        refreshSelectedNode: function ()
        {
            //could be the users/recents that are being refreshed
            //var el = this.tree.find("li.all-items").find("li.selected");
            var el = this.tree.find("li.selected.children");
            if (el.length == 1) this.tree.tree("expand", el, true);
        },

        // Public property.
        isTreeNodeSelected: function () 
        {
            return (checkExists(this.tree) && this.tree.find("li.selected").length === 1);
        },

        //public method
        expandAllItemsNode: function ()
        {
            this.tree.tree("expand", this.tree.find("li.all-items"), true);
        },

        //public method
        removecategory: function (id)
        {
            return this._removecategory(id);
        },

        _removecategory: function (id)
        {
            var $this = this;
            var hash = SourceCode.Forms.Interfaces.AppStudio.getDocumentLocationHashObject();
            var current = SourceCode.Forms.Interfaces.AppStudio.getCurrentSettings();

            // If the category being removed is also displayed, select it's parent instead
            if (current.action === "list" && current.filter === "category" && hash.catid === id)
            {
                $this.tree.tree("select", $this.tree.find(".selected").parent().parent());
            }
            else if ((current.action === "edit" || current.action === "new") && current.datatype === "smartobject")
            {
                $("#CategorySelectorPanel_SmartObjectCategory").categorylookup("value", {});
            }

            var nodes = $this.tree.add("#AppStudioCategoryBrowserTree").find("li.category").filter(function ()
            {
                var m = $(this).metadata();
                return m.catid === id;
            });

            nodes.each(function ()
            {
                var node = $(this);
                var treenode = node.closest(".tree");
                treenode.tree("remove", node);
            });

        },

        //public method
        refreshcategory: function (id, expand)
        {
            return this._refreshcategory(id, expand);
        },

        _refreshcategory: function (id, expand)
        {
            var $this = this;
            var nodes;
            if ((id !== "1") && (id !== "undefined"))
            {
                //$("#AppStudioTree, #AppStudioCategoryBrowserTree") was replaced with $this.tree
                nodes = $this.tree.find("li.category").filter(function ()
                {
                    var m = $(this).metadata();
                    return m.catid === id;
                });
            }
            else
            {
                nodes = $this.tree.find("li.all-items");
            }

            nodes.each(function ()
            {
                var node = $(this), open = node.is(".open"), children = node.is(".children"), tree = node.closest(".tree");

                //lets not clear or collapse anymore 
                //if (open) tree.tree("collapse", node);                
                //tree.tree("clear", node);

                if (children) node.addClass("children").addClass("closed");

                if (open || expand) tree.tree("expand", node, true);

            });
        },

        //public method
        refreshCategories: function (idArray, expand)
        {
            return this._refreshCategories(idArray, expand);
        },

        _refreshCategories: function (idArray, expand)
        {
            var $this = this;
            var catnodes = this.tree.find("li.all-items li.category");
            // Refreshing the Categories
            catnodes = catnodes.filter(function ()
            {
                return idArray.indexOf($(this).metadata().catid.toString()) !== -1;
            });
            catnodes.each(function ()
            {
                if ($(this).is(".open"))
                {
                    $this.tree.tree("collapse", $(this));
                    $this.tree.tree("clear", $(this));
                    $this.tree.tree("expand", $(this));
                }
                else
                {
                    $this.tree.tree("clear", $(this));
                }
            });
        },

        //public method
        // Removes moved category nodes from the tree
        updatetreemovecategory: function (objects)
        {
            return this._updatetreemovecategory(objects);
        },

        // Removes moved category nodes from the tree
        _updatetreemovecategory: function (objects)
        {
            var $this = this;

            // Find all category nodes, if in the targeted list of categories,
            // remove it
            $this.tree.find("li.category").each(function ()
            {
                for (var x = 0; x < objects.length; x++)
                {
                    // a specific cat-id will only exists once, no need to continue searching
                    if ($(this).metadata().catid === objects[x][0])
                    {
                        $this.tree.tree("remove", $(this)); // Found the node, remove it
                        break;
                    }
                }
            });
        },

        //public method
        //Removes collection of artefacts from the tree
        removefromcategories: function (objects)
        {
            return this._removefromcategories(objects);
        },

        //Removes collection of artefacts from the tree
        _removefromcategories: function (objects)
        {
            var $this = this;

            var datatypes = ["smartobject", "view", "form", "workflow"];

            var tree = $this.tree.find("li.all-items > ul");

            $.each(datatypes, function (i, e)
            {
                var qry = (e === "view") ? "li.item-view, li.list-view, li.capturelist-view, li.content-view, li.view" : "li." + e;

                var subset = objects.filter(function (el, idx, arr)
                {
                    return el[1] === e;
                });

                if (subset.length > 0)
                {
                    $.each(subset, function ()
                    {
                        var item = this;
                        var nodes = tree.find(qry).filter(function ()
                        {
                            var metadata = $(this).metadata();
                            if (checkExists(item[3]))
                            {
                                return (metadata.systemname === item[3] || metadata.name === item[3]);
                            }
                            else
                            {
                                return (metadata.guid === item[0] || metadata.id === item[0]);
                            }
                        });

                        nodes.each(function ()
                        {
                            var node = $(this);
                            var p = node.parent().parent();

                            if (p.is(".category"))
                            {
                                // Only remove the item if the parent is a category
                                node.remove();

                                if (p.children("ul").length === 0 || (p.children("ul").length > 0 && p.children("ul").children("li").length === 0))
                                {

                                    p.removeClass("open").removeClass("children");
                                }

                            }
                        });
                    });
                }
            });
        },

        //public method - removes a series of items from the tree (not from the db)
        removeobjects: function (objects, catid)
        {
            return this._removeobjects(objects, catid);
        },

        _removeobjects: function (objects, catid)
        {
            var $this = this;

            var searchdts = [];

            for (var i = 0, l = objects.length; i < l; i++)
            {
                if (searchdts.indexOf(objects[i][1]) === -1) searchdts.push(objects[i][1]);
            }

            var entrypoints = $this.tree.find("li.user, li.recent");

            // If a category has been specified, limit the entrypoints to include only the applicable category
            if (checkExists(catid) && catid > 0)
            {
                var category = $this.tree.find("li.all-items > ul li.category").filter(function ()
                {
                    return $(this).metadata().catid === catid;
                });

                entrypoints = $([]).pushStack(entrypoints.toArray().concat(category.toArray()));
            }
            else
            {
                entrypoints = $([]).pushStack(entrypoints.toArray().concat($this.tree.find("li.all-items").toArray()));
            }

            for (var i = 0, l = searchdts.length; i < l; i++)
            {
                // Setting up the selector for the initial search
                var qry = (searchdts[i] === "view") ? "li.item-view, li.list-view, li.capturelist-view, li.content-view, li.view" : "li." + searchdts[i];

                var currentSearchdtsIsWorkflow = (searchdts[i].toUpperCase() === "WORKFLOW");

                // Getting a subset of ids of the objects passed all of the same type
                var subset = [];
                var subsetSystemnames = [];
                var subsetLegacy = {};
                var subsetSystemnamesLegacy = {};
                for (var j = 0, k = objects.length; j < k; j++)
                {
                    if (objects[j][1] === searchdts[i])
                    {
                        if (checkExists(objects[j][0]))
                        {
                            var objIdGuid = objects[j][0].toString();

                            subset.push(objIdGuid);

                            if (currentSearchdtsIsWorkflow)
                            {
                                var objLegacy = checkExistsNotEmpty(objects[j][3]) ? objects[j][3].toString().toLowerCase() : "";

                                if (checkExistsNotEmpty(subsetLegacy[objIdGuid]))
                                {
                                    if (subsetLegacy[objIdGuid] !== objLegacy)
                                    {
                                        //The legacy and html5 workflows with the same id are both in the subset you are trying to remove
                                        subsetLegacy[objIdGuid] = "both";
                                    }
                                    else
                                    {
                                        //Actually an error scenario, since you are then trying to delete the exact same workflow twice
                                    }
                                }
                                else
                                {
                                    subsetLegacy[objIdGuid] = objLegacy;
                                }
                            }
                        }
                        else if (checkExists(objects[j][2]))
                        {
                            var objSystemName = objects[j][2].toString();

                            subsetSystemnames.push(objSystemName);

                            if (currentSearchdtsIsWorkflow)
                            {
                                var objLegacy = checkExistsNotEmpty(objects[j][3]) ? objects[j][3].toString().toLowerCase() : "";

                                if (checkExistsNotEmpty(subsetSystemnamesLegacy[objSystemName]))
                                {
                                    if (subsetSystemnamesLegacy[objSystemName] !== objLegacy)
                                    {
                                        //The legacy and html5 workflows with the same system names are both in the subset you are trying to remove
                                        subsetSystemnamesLegacy[objSystemName] = "both";
                                    }
                                    else
                                    {
                                        //Actually an error scenario, since you are then trying to delete the exact same workflow twice
                                    }
                                }
                                else
                                {
                                    subsetSystemnamesLegacy[objSystemName] = objLegacy;
                                }
                            }
                        }
                    }
                }

                // Getting the initial search results
                var nodes = entrypoints.find(qry).toArray();

                // Now filtering them against the subset
                for (var j = 0, k = nodes.length; j < k; j++)
                {
                    var node = $(nodes[j]);

                    // If this node's identifier is in the subset, it should be removed
                    var nodeMetadata = node.metadata();

                    if ((checkExists(nodeMetadata.guid) && subset.indexOf(nodeMetadata.guid.toString()) !== -1) ||
                        (checkExists(nodeMetadata.id) && subset.indexOf(nodeMetadata.id.toString()) !== -1) ||
                        (checkExists(nodeMetadata.systemname) && subsetSystemnames.indexOf(nodeMetadata.systemname.toString()) !== -1) ||
                        (searchdts[i] === "category" && node.is(".category") && subset.indexOf(nodeMetadata.catid.toString()) !== -1))
                    {
                        if (checkExistsNotEmpty(nodeMetadata.datatype) && (nodeMetadata.datatype.toUpperCase() === "WORKFLOW"))
                        {
                            var subsetLegacyMatch = "";

                            var nodeMetadataLegacy = checkExistsNotEmpty(nodeMetadata.legacy) ? nodeMetadata.legacy.toString() : "";
                            var nodeMetadataIdGuid = checkExistsNotEmpty(nodeMetadata.guid) ? nodeMetadata.guid.toString() : (checkExistsNotEmpty(nodeMetadata.id) ? nodeMetadata.id.toString() : "");

                            if (nodeMetadataIdGuid !== "")
                            {
                                subsetLegacyMatch = subsetLegacy[nodeMetadataIdGuid];
                            }

                            if (!checkExistsNotEmpty(subsetLegacyMatch))
                            {
                                var nodeMetadataSystemname = checkExistsNotEmpty(nodeMetadata.systemname) ? nodeMetadata.systemname.toString() : "";

                                if (nodeMetadataSystemname !== "")
                                {
                                    subsetLegacyMatch = subsetSystemnamesLegacy[nodeMetadataSystemname];
                                }
                            }

                            if (checkExistsNotEmpty(subsetLegacyMatch) && (subsetLegacyMatch !== "both") && (subsetLegacyMatch.toUpperCase() !== nodeMetadataLegacy.toUpperCase()))
                            {
                                continue;
                            }
                        }

                        // Getting the parent
                        var p = node.parent().parent();

                        // Removing the node
                        node.remove();

                        // Update the parent node
                        if (p.children("ul").length === 0 || (p.children("ul").length > 0 && p.children("ul").children("li").length === 0))
                        {
                            if (p.is(".category, .view, .page, .smartobject, .workflow, .form-view, .list-view, .capturelist-view, .content-view"))
                            {

                                p.removeClass("open").removeClass("children");
                            } else
                            {
                                p.removeClass("open").addClass("closed");
                            }
                        }
                    }
                }
            }
        },

        //public method - rename an object:
        //finds the items in the tree and changes their names, and updates the db (via ajax)
        renameobject: function (objID, datatype, newName, callback)
        {
            return this._renameobject(objID, datatype, newName, callback);
        },

        //finds the items in the tree and changes their names.
        _renameobject: function (objID, datatype, newName, callback)
        {
            var $this = this;

            //prepare the parameters for the ajax call
            var o = {};
            o.action = "rename";
            o.datatype = datatype;
            o.name = newName;
            if (datatype === "category") o.catid = objID
            else if (datatype === "workflow") o.id = objID;
            else o.guid = objID;

            //call the renaming 
            $.ajax({
                url: "AppStudio/AJAXCall.ashx",
                data: $.param(o),
                cache: false,
                type: "POST",
                success: function (data)
                {
                    this._renameobject_success(data, objID, datatype, newName, callback);
                }.bind(this)
            });
        },

        _renameobject_success: function (data, objID, datatype, newName, callback)
        {
            var $this = this, nodes, qry;

            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                $("body").removeOverlay();

                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }

            if (checkExists(data.selectSingleNode("error")))
            {
                $("body").removeOverlay();
                popupManager.showWarning({ message: data.selectSingleNode("error").text.htmlEncode(), onClose: function () { $("#CategoryName").trigger("focus").caret("end"); } });
                return;
            }

            if (datatype === "view")
            {
                qry = "li.item-view, li.list-view, li.capturelist-view, li.content-view, li.view";
            }
            else
            {
                qry = "li." + datatype;
            }

            nodes = $this.tree.find(qry);

            var filtered = null;
            if (datatype === "category")
            {
                //just sort the category nodes -------------------------------------
                filtered = nodes.filter(function ()
                {
                    return ($(this).metadata().catid === objID);
                });

                filtered.each(function ()
                { //change the name of the updated node
                    var node = $(this);
                    var parentNode = node.parent().parent();
                    parentNode.addClass("loading");

                    var escapedNewName = newName.htmlEncode();
                    node[0].firstChild.innerHTML = escapedNewName;
                    node[0].setAttribute("title", newName);

                    if ((parentNode.is(".open")) ? true : false)
                    {
                        $this.tree.tree("sort", parentNode, datatype);
                    }
                    parentNode.removeClass("loading");

                });
                //just sort the category nodes -------------------------------------
            }
            else
            {
                //sort ---------------------------------------     
                filtered = nodes.filter(function ()
                {
                    return ($(this).metadata().guid === objID);
                });

                filtered.each(function ()
                { //change the name of the updated node
                    var node = $(this);
                    var parentNode = node.parent().parent();
                    parentNode.addClass("loading");

                    var escapedNewName = newName.htmlEncode();
                    node[0].firstChild.innerHTML = escapedNewName;

                    if ((parentNode.is(".open")) ? true : false)
                    {
                        $this.tree.tree("sort", parentNode, datatype);
                    }
                    parentNode.removeClass("loading");
                });
                //sort ---------------------------------------
            }

            if (typeof callback === "function") callback();
        }

    } //end of class

    //Register the class
    if (typeof SCNavPanel === "undefined") SCNavPanel = SourceCode.Forms.Controls.NavigationPanel;
    $.widget("ui.navigationpanel", SourceCode.Forms.Controls.NavigationPanel);

})(jQuery);
