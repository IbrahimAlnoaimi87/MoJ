(function ($)
{
    //Namespacing the designer
    if (!SourceCode) SourceCode = {};
    if (!SourceCode.Forms) SourceCode.Forms = {};
    if (!SourceCode.Forms.Designers) SourceCode.Forms.Designers = {};

    SourceCode.Forms.Designers.Workflow = {
        name: null,
        catid: null,
        guid: null,

        _active: false,
        _container: null,

        _initCallback: null,
        _nameChangeCallbacks: null,
        _closeCallbacks: null,

        //Lifecycle event (managed by sourcecoce.forms.interfaces.appstudio.js)
        //Happens anytime this designer is opened with a file.
        init: function (id, categoryId, contextId, callback, config, container)
        {
            //initialize context values (which tell us which workflow/folder we're interested in)
            this.wizard = null;
            this.guid = id;
            this.catid = categoryId;
            this.iframe = null;
            this._container = container;

            this.share = checkExistsNotEmpty(config.share) ? config.share : null;

            this._initCallback = callback;
            this._nameChangeCallbacks = [];
            this._closeCallbacks = [];

            //cleanup params
            if (checkExists(id)) this.guid = id;
            if (checkExists(categoryId)) this.catid = categoryId;

            var src = "K2Workflow/k2Designer.aspx";
            var q = { env: "smartforms", hosted: true };

            //make sure the iframe exists for the workflow designer
            if (!checkExists(this.iframe))
            {
                this.iframe = $("<iframe class=\"intro\" id=\"DesignerIframe\" frameborder=\"0\" style=\"width:100%;height:100%;position:relative;\"></iframe>").appendTo(this._container);
            }

            // Depending on browser & security level, origin is not always defined
            if (!window.location.origin)
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

            // make sure the exiturl querystring  of the iframe is added.
            if (checkExists(config))
            {
                config.exiturl = window.location.origin + window.location.pathname.replace(/default.aspx/gi, "") + "K2DesignerExitToForms.aspx";
            }

            if (checkExists(config) && !$.isEmptyObject(config))
            {
                if (!$.isEmptyObject(q))
                {
                    q = $.extend({}, q, config);
                }
                else
                {
                    q = config;
                }
            }

            if (checkExists(id)) q.id = id;

            if (checkExists(categoryId)) q.categoryid = categoryId;

            if (checkExists(contextId)) q.objectid = contextId;

            if (!$.isEmptyObject(q)) src += "?" + paramWithEncodeURIComponent(q);

            //Start loading the iframe.
            var _this = this;
            this.iframe[0].src = src;
            this.iframe.on('load', function ()
            {
                _this.notifyPageLoaded(src);
            });

            this.iframe.show().siblings().hide();

            this.getContainerContent().overlay({ modal: true, icon: "loading", classes: "designer-loader" });

            //LG: Load any additional scripts needed for this designer:
            //_addscripts(callback);
            this.getAdditonalWFInfo(config);
        },

        getAdditonalWFInfo: function (config)
        {
            var ob = { action: "getworkflowdetails", id: this.guid };

            if (config && config.systemname)
            {
                ob.systemname = config.systemname;
            }

            $.ajax({
                cache: false,
                data: $.param(ob),
                dataType: "json",
                url: "AppStudio/AJAXCall.ashx",
                success: function (data)
                {
                    if (data && checkExistsNotEmpty(data.Name))
                    {
                        if (data.Name.indexOf("\\"));
                        {
                            data.Name = data.Name.substr(data.Name.indexOf("\\")).replace("\\", "");
                        }
                        this.notifyWorkflowNameChanged(null, null, data.Name);
                    }
                }.bind(this),
                type: "POST",
                timeout: 120000,
                error: function (xhr, status, error)
                {
                }
            });
        },

        getContainerContent: function ()
        {
            return SourceCode.Forms.Interfaces.Forms.panes.content;
        },

        //Lifecycle event (managed by sourcecoce.forms.interfaces.appstudio.js)
        //Happens when the user attempts to close the Designer from Appstudio.
        onExit: function (navigateCallback)
        {
            if (Array.isArray(this._closeCallbacks) && this._closeCallbacks.length > 0)
            {
                for (var i = 0; i < this._closeCallbacks.length; i++)
                {
                    if (typeof this._closeCallbacks[i] === "function")
                    {
                        // Pass the navigateCallback along if the Designer does not want to handle the Exit itself.
                        // It's completely optional, ideally the loaded Designer should handle it's own exit strategy.
                        this._closeCallbacks[i](navigateCallback);
                    }
                }
            }
            else
            {
                // From here on we are aborting the Designer and attempting to unlock the workflow first.
                if (!checkExists(this.iframe))
                {
                    this.iframe = $("#DesignerIframe");
                }
                if (this.iframe.length === 1)
                {
                    // Wait for the iframe to load K2DesignerExitToForms.aspx
                    this.iframe[0].onload = function ()
                    {
                        // Give the K2DesignerExitToForms.aspx time to run it's JS to unlock the WF before navigating again.
                        setTimeout(function ()
                        {
                            // Don't prompt, just navigate because we already navigated on the iframe to unlock the WF first so no Designer is visible anymore.
                            navigateCallback(true);
                        }, 1000);
                    }
                    this.iframe[0].contentWindow.location = "K2DesignerExitToForms.aspx?is=1";
                }
            }
        },

        onDesignerExit: function (catid, guid, wfDeleted)
        {
            var info = this._getFileInfo();

            //Override catid and guid with info received from calling url
            if (checkExistsNotEmpty(catid))
            {
                info.catid = catid;
            }

            if (checkExistsNotEmpty(guid))
            {
                info.guid = guid;
            }

            if (wfDeleted === true)
            {
                this.notifyWorkflowDeleted(info.catid, info.guid);
            }
            else
            {
                $.event.trigger({ type: "appstudio.designer.finish", fileInfo: info }, null, document);
            }
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowClose: function ()
        {
            this._nameChangeCallbacks = null;
            this._closeCallbacks = null;
            SourceCode.Forms.Interfaces.AppStudio.CloseDesigner(this.catid, this.guid);
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowDeleted: function (catid, id)
        {
            SourceCode.Forms.Interfaces.AppStudio.RemoveObjects([[id, "workflow"]], catid);
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowDeployed: function (catid, id)
        {
            SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("workflow", catid, id);
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowSaved: function (catid, id)
        {
            SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("workflow", catid, id);
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowUpdated: function (catid, id)
        {
            SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("workflow", catid, id);
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyPageLoaded: function (success)
        {
            // If no argument provided, assume success
            if (!checkExists(success))
            {
                success = true;
            }

            var hideFileTab = false;

            if (!success)
            {
                hideFileTab = true;

                $("body").addClass("collapsed-header");
            }

            //remove the overlay we added in init().
            this.getContainerContent().removeOverlay();

            //starts the animation to show the iframe.
            $.event.trigger({ type: "appstudio.designer.loaded", fileInfo: this._getFileInfo(), hideFileTab: hideFileTab, designer: this.iframe }, null, document);
            this.iframe.removeClass("intro");

            //Call the callback that was passed into this.init() earlier.
            if (typeof this._initCallback === "function")
            {
                this._initCallback();
            }

            this._active = true;
            $('#__designerStatus').text($('#__designerStatus').text().replace('initializing', 'initialized'));
        },

        // Notify Functions are called from within the Workflow Designer iframe.
        // via window.top.Sourcecode.Forms.Designers.Workflow.Notifyxxxx();
        notifyWorkflowNameChanged: function (catid, id, name)
        {
            var info = this._getFileInfo();
            info.name = name;
            $.event.trigger({ type: "appstudio.designer.namechanged", fileInfo: info }, null, document);
        },

        _getFileInfo: function ()
        {
            return {
                datatype: "workflow",
                name: this.name,
                catid: this.catid,
                guid: this.guid,
                share: this.share,
                systemname: null
            }
        },

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // Called when the user tries to update the name of this file from outside (context menu, filetab, etc)
        updateName: function (name)
        {
            if (Array.isArray(this._nameChangeCallbacks))
            {
                for (var i = 0; i < this._nameChangeCallbacks.length; i++)
                {
                    if (typeof this._nameChangeCallbacks[i] === "function")
                    {
                        this._nameChangeCallbacks[i](name);
                    }
                }
            }
        },

        // lifecycle event managed by sourcecode.forms.interfaces.appstudio.js
        // Called to determine if this designer active, and so needs to be closed before anpther can be opened
        isShowing: function ()
        {
            return this._active === true;
        },

        //Lifecycle event (managed by sourcecoce.forms.interfaces.appstudio.js)
        //Happens before cleanup
        close: function (callback)
        {
            if (typeof callback === "function") callback();
        },

        //Lifecycle event (managed by sourcecoce.forms.interfaces.appstudio.js)
        //Happens when the chooses to close out of this designer.
        cleanup: function ()
        {
            if (checkExists(this.iframe)) this.iframe.remove();
            this.iframe = null;
            this._active = false;
        },

        //Lifecycle event (managed by sourcecoce.forms.interfaces.appstudio.js)
        //Happens when the user clicks somewhere that would close this designer, so this designer has an option to prevent that.
        //return true, if you want to stop this designer from being closed.
        stopCancelEvent: function ()
        {
            return false;
        },

        // Called from within the Workflow Designer iframe to register name change callbacks to be notified when the name changes in AppStudio.
        registerNameChangeCallback: function (callback)
        {
            if (typeof callback === "function")
            {
                if (!Array.isArray(this._nameChangeCallbacks))
                    this._nameChangeCallbacks = [];

                this._nameChangeCallbacks.push(callback);
            }
        },

        // Called from within the Workflow Designer iframe to clear name change callbacks to no longer be notified when the name changes in AppStudio.
        clearNameChangeCallbacks: function ()
        {
            this._nameChangeCallbacks = [];
        },

        // Called from within the Workflow Designer iframe to register close callbacks to be notified when the User wants to close the Designer from AppStudio.
        registerCloseCallback: function (callback)
        {
            if (typeof callback === "function")
            {
                if (!Array.isArray(this._closeCallbacks))
                    this._closeCallbacks = [];

                this._closeCallbacks.push(callback);
            }
        },

        // Called from within the Workflow Designer iframe to clear close callbacks to no longer be notified when the User wants to close the Designer from AppStudio.
        clearCloseCallbacks: function ()
        {
            this._closeCallbacks = [];
        }
    }

    $(function ()
    {
        if (typeof SourceCode.Forms.Interfaces.AppStudio !== "undefined")
        {
            SourceCode.Forms.Interfaces.AppStudio.register("designer", "workflow", SourceCode.Forms.Designers.Workflow);
        }
    });
})(jQuery);
