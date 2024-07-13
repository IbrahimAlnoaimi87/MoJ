

    if (!SourceCode) SourceCode = {};
    if (!SourceCode.Forms) SourceCode.Forms = {};
    if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

    var Category = SourceCode.Forms.Designer.Category = class extends SourceCode.Forms.Designer.EventTarget
    {
        //#region private fields
        #catid;
        #resolved = false;
        #isResolving = false;
        #catname;
        #path;
        #objectname;
        #fullpath;
        //#endregion

        //#region public properties

        get id()
        {
            return this.#catid;
        }

        get name()
        {
            return this.#catname;
        }

        //deprecated - kept as old code was using this.
        get catid()
        {
            return this.#catid;
        }

        //deprecated - kept as old code was using this.
        get catname()
        {
            return this.#catname;
        }
        get path()
        {
            return this.#path;
        }
        get fullpath()
        {
            return this.#fullpath;
        }
        get objectname()
        {
            return this.#objectname;
        }

        get isResolved()
        {
            return this.#resolved;
        }

        get isResolving()
        {
            return this.#isResolving;
        }

        //#endregion public properties

        //#region Constructor

        constructor(catid)
        {
            super();
            if (!!catid)
            {
                this.#catid = catid;
                this._resolve();
            }
        }

        //#endregion Constructor

        //#region AJAX methods

        _resolve()
        {
            this.#isResolving = true;
            var catid = this.#catid;
            $.ajax({
                cache: false,
                data: $.param({ catid: catid, action: "categorypath" }),
                dataType: "xml",
                url: "AppStudio/AJAXCall.ashx",
                success: function (data, status, xhr) { this._resolveCategory_success(data, status, xhr); }.bind(this),
                error: function (data, status, xhr) { this._resolveCategory_error(data, status, xhr); }.bind(this),
                type: "POST"
            });
        }

        _resolveCategory_success(data, status, xhr)
        {
            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                this._resolveCategory_error(data, status, xhr);
                return;
            }

            //hydrate the object
            this.resolveFromXml(data);
            this.#isResolving = false;
        }

        _resolveCategory_error(data, status, xhr)
        {
            SourceCode.Forms.ExceptionHandler.handleException(data);
            this.#isResolving = false;
            throw "Category could not resolve - id:" + this.#catid;

        }


        //#endregion AJAX methods

        //#region Xml methods

        resolveFromXml(xmlNode)
        {
            this._populateFromXml(xmlNode);
            //notify subscribers
            this.#resolved = true;
            this.#isResolving = false;
            this.dispatchEvent(new Event("Resolved"));
        }


        _populateFromXml(xmlNode)
        {
            this.#fullpath = $("fullpath", xmlNode).text();
            this.#catid = $("fullpath", xmlNode).attr("catid");
            this.#catname = $("fullpath", xmlNode).attr("catname");
            this.#path = $("fullpath", xmlNode).attr("path");
            this.#objectname = $("fullpath", xmlNode).attr("objectname");
        }


        static fromXml(xmlNode)
        {
            var cat = new SourceCode.Forms.Designer.Category();
            cat.resolveFromXml(xmlNode);
            return cat;
        }

        //#endregion

        //#region Json methods

        resolveFromJson(json)
        {
            this._populateFromJson(json);
            //notify subscribers
            this.#resolved = true;
            this.#isResolving = false;
            this.dispatchEvent(new Event("Resolved"));
        }


        _populateFromJson(json)
        {
            this.#fullpath = json.FullPath;
            this.#catid = json.Id;
            this.#catname = json.Name;
            this.#path = json.Path;
        }


        static fromJson(json)
        {
            var cat = new SourceCode.Forms.Designer.Category();
            cat.resolveFromJson(json);
            return cat;
        }

        //#endregion
    };


