(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    //TD 0081 - We can take out initilizing for the Back and Forward buttons as they no longer been used in the UI
    SourceCode.Forms.Controls.Wizard =
        {
            // stores name value keys that map to the correct step number
            _stepMappings: [],

            _create: function ()
            {

                this.header = (this.options.header !== undefined && this.options.header.length > 0) ? this.options.header : this.element.children(".wizard-header").find(".wizard-header-wrapper > .wrapper");
                this.steps = this.element.children(".wizard-steps-container").children(".wizard-step-content");

                this.stepscontainer = this.element.children(".wizard-steps-container");
                this.buttonscontainer = this.element.children(".wizard-buttons");
                this.topbuttonscontainer = this.element.children(".wizard-steptree-bar").children(".wizard-steptree-buttons");

                this.steptree = this.element.children(".wizard-steptree-bar").find("ul.steptree");

                this.active = this.steps.filter(".active");

                if (this.options.buttons !== undefined && this.options.buttons.length > 0)
                {
                    this.buttons = this.options.buttons.k2button();
                }
                else
                {
                    this.buttons = this.buttonscontainer.add(this.topbuttonscontainer).find("a.button").k2button();
                }

                this._initStepTree();
                this._initButtons();

                this._updateHeader();

                if (this.active.length === 0)
                {
                    // Activating the first step
                    this.steps.eq(0).css("display", "").addClass("active");
                    this.steptree.children("li").eq(0).addClass("active");
                    this.active = this.steps.eq(0);
                }

                SourceCode.Forms.Utilities.performance.debounce(this._onWizardCreationCompleted, { args: arguments, thisContext: this, delay: 100 });
            },

            _onWizardCreationCompleted: function ()
            {
                //After wizard has been completed and if it hasn't show the active step yet, show it.
                if (!checkExists(this.active.data("wizardinit")) || this.active.data("wizardinit") === false)
                {
                    var from = this.steps.index(this.active[0]);

                    this.step(from, from);
                }
            },

            disable: function ()
            {

                if (arguments.length > 0)
                {
                    switch (arguments[0])
                    {
                        case "step":

                            var si = -1;

                            if (typeof arguments[1] === "string")
                            {
                                switch (arguments[1])
                                {
                                    case "next":
                                        if (this.stepindex() < (this.steps.length - 1)) si = this.stepindex() + 1;
                                        break;
                                    case "prev":
                                        if (this.stepindex() > 0) si = this.stepindex() - 1;
                                        break;
                                }
                            }
                            else if (typeof arguments[1] === "number")
                            {
                                si = arguments[1];
                            }

                            this.steps.eq(si).addClass("disabled");
                            this.steptree.children("li").eq(si).addClass("disabled");
                            this._updateButtons();

                            break;
                        case "button":
                            switch (arguments[1])
                            {
                                case "backward":
                                    this.buttons.filter(".backward").addClass("disabled");
                                    break;
                                case "forward":
                                    this.buttons.filter(".forward").addClass("disabled");
                                    break;
                                case "finish":
                                    this.buttons.filter(".finish, .save").addClass("disabled");
                                    break;
                                case "cancel":
                                    this.buttons.filter(".cancel").addClass("disabled");
                                    break;
                                case "help":
                                    this.buttons.filter(".help").addClass("disabled");
                                    break;
                                case "save":
                                    this.buttons.filter(".save").addClass("disabled");
                                    break;
                                case "all":
                                    this.buttons.addClass("disabled");
                                    break;
                            }
                            break;
                    }
                }
                else
                {
                    $.Widget.prototype.disable.apply(this, arguments);
                }

            },

            enable: function ()
            {

                if (arguments.length > 0)
                {
                    switch (arguments[0])
                    {
                        case "step":

                            var si = -1;

                            if (typeof arguments[1] === "string")
                            {
                                switch (arguments[1])
                                {
                                    case "next":
                                        if (this.stepindex() < (this.steps.length - 1)) si = this.stepindex() + 1;
                                        break;
                                    case "prev":
                                        if (this.stepindex() > 0) si = this.stepindex() - 1;
                                        break;
                                }
                            }
                            else if (typeof arguments[1] === "number")
                            {
                                si = arguments[1];
                            }

                            if (si > -1)
                            {
                                this.steps.eq(si).removeClass("disabled");
                                this.steptree.children("li").eq(si).removeClass("disabled");
                                this._updateButtons();
                            }

                            break;
                        case "button":
                            switch (arguments[1])
                            {
                                case "backward":
                                    this.buttons.filter(".backward").removeClass("disabled");
                                    break;
                                case "forward":
                                    this.buttons.filter(".forward").removeClass("disabled");
                                    break;
                                case "finish":
                                    this.buttons.filter(".finish, .save").removeClass("disabled");
                                    break;
                                case "cancel":
                                    this.buttons.filter(".cancel").removeClass("disabled");
                                    break;
                                case "help":
                                    this.buttons.filter(".help").removeClass("disabled");
                                    break;
                                case "save":
                                    this.buttons.filter(".save").removeClass("disabled");
                                    break;
                                case "all":
                                    this.buttons.addClass("disabled");
                                    break;
                            }
                            break;
                    }
                }
                else
                {
                    $.Widget.prototype.enable.apply(this, arguments);
                }

            },

            show: function ()
            {

                switch (arguments[0])
                {
                    case "step":
                        this.steps.eq(arguments[1]).removeClass("hidden");
                        this.steptree.children("li").eq(arguments[1]).show();
                        this._updateButtons();
                        break;
                }

            },

            hide: function ()
            {

                switch (arguments[0])
                {
                    case "step":
                        this.steps.eq(arguments[1]).addClass("hidden");
                        this.steptree.children("li").eq(arguments[1]).hide();
                        this._updateButtons();
                        break;
                }

            },

            _show: function ()
            {

                // 'De-activating' the current active step
                if (arguments[0] !== null)
                {
                    this.steps.eq(arguments[0]).css("display", "none").removeClass("active");
                    this.steptree.children("li.active").removeClass("active");
                    this._trigger("hide", null, { from: arguments[0], to: arguments[1] });
                }

                // Activating the targeted step
                this.steps.eq(arguments[1]).css("display", "").addClass("active");
                this.steptree.children("li").eq(arguments[1]).addClass("active");
                this.active = this.steps.eq(arguments[1]);

                // Initial Step Show Event Handling
                if (this.steps.eq(arguments[1]).data("wizardinit") === undefined || (this.steps.eq(arguments[1]).data("wizardinit") !== undefined && !this.steps.eq(arguments[1]).data("wizardinit")))
                {
                    this.steps.eq(arguments[1]).data("wizardinit", true);
                    this._trigger("initshow", null, { from: arguments[0], to: arguments[1] });
                }

                this._trigger("show", null, { from: arguments[0], to: arguments[1] });

                // Updating the buttons & header
                this._updateButtons();
                this._updateHeader();

            },

            forward: function ()
            {
                $('#__designerStatus').text('designwizard nextstep initializing');
                var n = this.active.nextAll(".wizard-step-content:not(.disabled, .hidden)");

                if (n.length > 0)
                {
                    var cur = this.active, nxt = n.eq(0), curidx = this.steps.index(cur);

                    this.validate(curidx, curidx, function ()
                    {
                        if (arguments[0]) this._forward(cur, nxt);
                    }.bind(this));
                }
                $('#__designerStatus').text('designwizard nextstep initialized');

            },

            _forward: function (cur, nxt)
            {
                this._show(this.steps.index(cur), this.steps.index(nxt));

                this._trigger("forward", null, { from: this.steps.index(cur), to: this.steps.index(nxt) });
            },

            backward: function ()
            {

                var p = this.active.prevAll(".wizard-step-content:not(.disabled, .hidden)");

                if (p.length > 0)
                {
                    var cur = this.active, prv = p.eq(0);

                    this._show(this.steps.index(cur), this.steps.index(prv));

                    this._trigger("backward", null, { from: this.steps.index(cur), to: this.steps.index(prv) });
                }
            },

            // Go to a particular step
            // public function, but also gets called when a steptree item is clicked.
            step: function ()
            {
                var from;
                var to = arguments[0];
                var validate = true;

                switch (typeof arguments[1])
                {
                    case "number":
                        from = arguments[0];
                        to = arguments[1];
                        break;
                    case "boolean":
                        from = this.steps.index(this.active[0]);
                        validate = arguments[1];
                        break;
                    case "undefined":
                        from = this.steps.index(this.active[0]);
                        break;
                }

                if (typeof arguments[2] === "boolean") validate = arguments[2];

                if ((from < to) && (validate && typeof this.options.validate === "function"))
                {
                    //validate all steps upto the step we are navigating to.
                    this.validate(from, to - 1, function (isvalid, step)
                    {
                        if (isvalid)
                        {
                            this._step(from, to);
                        }
                        else
                        {
                            this._step(from, step);
                        }
                    }.bind(this));
                }
                else
                {
                    this._step(from, to);
                }
            },

            _step: function (from, to)
            {
                this._show(from, to);

                var stepmeta = this.steps.eq(to).metadata();
                if (checkExists(stepmeta) && stepmeta.steptype === "done")
                {
                    this.finish(true); //this will _trigger "finish"
                }
                else if (from < to)
                {
                    this._trigger("forward", null, { from: from, to: to });
                }
                else
                {
                    if (from !== to)
                    {
                        this._trigger("backward", null, { from: from, to: to });
                    }
                }
            },


            //public method - used when clicking finish, to skip to the end.
            gotoLastStep: function ()
            {
                this.step(this.stepindex(), this.steps.length - 1, false);
            },

            //public method - disables all steps and buttons
            disableWizard: function ()
            {
                this._disableAllSteps();
                this.disable("button", "all");
            },

            _disableAllSteps: function ()
            {
                // Disable all steps except the 'Finished' step
                for (var i = 0; i < this.stepindex(); i++)
                {
                    this.disable("step", i);
                }
            },

            showOverlay: function ()
            {
                if (!this._isFinishing && !this._isSaving)
                {
                    this.element.overlay({ modal: true, icon: "loading" });
                }
            },

            removeOverlay: function ()
            {
                this.element.removeOverlay();
            },

            help: function ()
            {
                //Each designer handle their own help button clicks.
                this._trigger("help", null, {});
            },

            _initButtons: function ()
            {

                var $wizard = this;

                $wizard._updateButtons();

                $wizard.buttons.on("click", function (ev)
                {
                    var $this = $(this);

                    if (!$this.is(".disabled"))
                    {

                        if ($this.is(".backward"))
                        {
                            $wizard.backward();
                        }
                        else if ($this.is(".forward"))
                        {
                            $wizard.forward();
                        }
                        else if ($this.is(".finish"))
                        {
                            $wizard.finish();
                        }
                        else if ($this.is(".cancel"))
                        {
                            $wizard.cancel();
                        }
                        else if ($this.is(".help"))
                        {
                            $wizard.help();
                        }
                        else if ($this.is(".save"))
                        {
                            $wizard.saving();
                        }

                        return false;

                    }

                });

            },

            _initStepTree: function ()
            {

                var $wizard = this;

                $wizard.steptree.on("click", function (ev)
                {

                    var node = jQuery(ev.target).closest("li");

                    if (node.is(":not(.disabled, .active)"))
                    {

                        var from = $wizard.steptree.children("li").index($wizard.steptree.children("li.active"));
                        var to = $wizard.steptree.children("li").index(node);

                        $wizard.step(from, to);

                    }

                    ////LG: Removed - the last step might not be an empty finished step
                    // else if (node.is(":not(.disabled, .active)") && node.is(":last-child"))
                    // {

                    // 	$wizard.finish();

                    // }

                    return false;

                });

            },

            _updateButtons: function ()
            {

                var $wizard = this;

                // Update 'Previous' button
                if ($wizard.active.prevAll(".wizard-step-content:not(.disabled, .hidden)").length === 0)
                {
                    $wizard.buttons.filter(".backward").addClass("disabled");
                }
                else
                {
                    $wizard.buttons.filter(".backward").removeClass("disabled");
                }

                // Update 'Next' button
                var nextSteps = $wizard.active.nextAll(".wizard-step-content:not(.disabled, .hidden)");
                // If there are no steps to advance to (disabled because of validation)
                if (nextSteps.length === 0)
                {
                    $wizard.buttons.filter(".forward").addClass("disabled");
                }
                else
                {
                    // If on the second to last step (finish step)
                    if (nextSteps.length === 1 && $wizard.steps.index(nextSteps[0]) === ($wizard.steps.length - 1))
                    {
                        $wizard.buttons.filter(".forward").addClass("disabled");
                    }
                    else
                    {
                        $wizard.buttons.filter(".forward").removeClass("disabled");
                    }
                }

                // Update the 'Finish' button
                if ($wizard.steps.last().is(".disabled"))
                {
                    $wizard.buttons.filter(".finish").addClass("disabled");
                }
                else
                {
                    $wizard.buttons.filter(".finish").removeClass("disabled");
                }

            },

            _updateHeader: function ()
            {

                var result = "";

                if (typeof arguments[0] !== "undefined")
                {

                }
                else
                {
                    result = this.element.metadata().headerformat;

                    if (checkExists(result))
                    {
                        result = result.replace("{0}", (this.options.contextobjectname !== "") ? "(" + this.options.contextobjectname + ")" : "");
                        result = result.replace("{2}", (this.options.maincontextobjectname !== "") ? "(" + this.options.maincontextobjectname + ")" : "");
                        result = result.replace("{3}", (this.options.objectdescription !== "") ? this.options.objectdescription : "");
                        result = result.replace("{1}", this.steptree.children("li.active").find(".text").text());
                    }
                }

                this.header.text(result);

            },

            _getStates: function ()
            {
                var classes = "";
                eachPropertyInObjects({
                    obj: SourceCode.Forms.DependencyHelper.badgeClasses,
                    callback: function (state, cssClass)
                    {
                        classes += cssClass + " ";
                    }
                });

                return classes;
            },

            updateStepState: function (stepIndex, stepState, badgeSize)
            {
                var states = this._getStates();

                var step = this.steps.eq(stepIndex).removeClass(states);
                var stepTreeNode = this.steptree.children("li").eq(stepIndex).removeClass(states);

                var currentStateClass = SourceCode.Forms.DependencyHelper.badgeClasses[stepState];

                if (checkExists(currentStateClass))
                {
                    step.addClass(currentStateClass);
                    stepTreeNode.addClass(currentStateClass);

                    if (checkExistsNotEmpty(badgeSize))
                    {
                        stepTreeNode.addClass(badgeSize);
                    }
                }
            },

            update: function ()
            {
                switch (arguments[0])
                {
                    case "header":
                        this._updateHeader(arguments[1]);
                        break;
                }
            },

            stepindex: function ()
            {
                return this.steps.index(this.steps.filter(".active")[0]);
            },

            hidesteptree: function ()
            {
                this.buttonscontainer[0].style.display = "none";
                this.stepscontainer[0].style.top = "0px";
                this.stepscontainer[0].style.bottom = "0px";
                //var currentStep = this.steps.eq(arguments[0]);

            },

            find: function ()
            {

                switch (arguments[0])
                {
                    case "step":
                        if (typeof arguments[1] === "string")
                        {
                            switch (arguments[1])
                            {
                                case "active":
                                    return this.steps.filter(".active");

                                case "first":
                                    return this.steps.first();

                                case "prev":
                                    return this.steps.filter(".active").prev();

                                case "next":
                                    return this.steps.filter(".active").next();

                                case "last":
                                    return this.steps.last();

                            }
                        }
                        else if (typeof arguments[1] === "number")
                        {
                            return this.steps.eq(arguments[1]);
                        }
                        break;
                    case "steps":
                        return this.steps;

                }

            },

            saving: function (shouldValidate, step)
            {
                var validate = true;
                this.element.find(".wizard-step-content, .wizard-steps-container").addClass("saving");
                this.buttons.filter(".save").k2button("loading");

                if (typeof shouldValidate === "boolean") validate = shouldValidate;

                if (validate && typeof this.options.validate === "function")
                {
                    this.validate(0, this.steps.length - 1, this.savingValidationCallback.bind(this));
                }
                else
                {
                    this._trigger("save", null);
                }
            },

            savingValidationCallback: function (isvalid, step)
            {
                if (isvalid === true)
                {
                    this._trigger("save", null);
                }
                else
                {
                    this._step(this.stepindex(), step);

                    this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("saving");
                    this.buttons.filter(".save").k2button("complete");
                }
            },

            savingComplete: function ()
            {
                this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("saving");
                this.buttons.filter(".save").k2button("complete");

                this.removeOverlay();
            },

            save: function ()
            {
                this._isSaving = true;
                var validate = true;

                if (typeof arguments[0] === "boolean") validate = arguments[0];

                if (validate && typeof this.options.validate === "function")
                {
                    this.validate(0, this.steps.length - 1, function (isvalid, step)
                    {
                        if (isvalid === true)
                        {
                            //LG: I think the wizard shouldn't force an overlay in the case of save
                            // - the consumer of the wizard might not want one.
                            if (this.options.useoverlay == true) this.showOverlay();
                            this._trigger("save", null);
                            this._isSaving = false;
                        }
                        else
                        {
                            this._step(this.stepindex(), step);
                            this._isSaving = false;
                        }
                    }.bind(this));
                }
                else
                {
                    //LG: I think the wizard shouldn't force an overlay in the case of save
                    // - the consumer of the wizard might not want one.
                    if (this.options.useoverlay == true) this.showOverlay();
                    this._trigger("save", null);
                    this._isSaving = false;
                }
            },

            finish: function (validate)
            {
                var $this = this;
                this._isFinishing = true;
                this.buttons.filter(".save, .finish").k2button("loading");
                this.element.find(".wizard-step-content, .wizard-steps-container").addClass("finishing");

                var from = 0;   //This is finish step so we want to ensure all the steps are validated before saving. 
                var to = (this.steps.length - 1);
                if (typeof validate !== "boolean") validate = true;

                //LG: Allowed the last step to be validated (as it might not be an empty finish step)
                var args = { from: from, to: to };
                if (validate && typeof this.options.validate === "function")
                {
                    this.validate(from, to, function (isvalid, step)
                    {
                        if (isvalid == true)
                        {
                            //TODO: Don't show the overlay automatically, the consumer of the wizard should do this.
                            if (this.options.useoverlay == true) this.showOverlay();
                            this._trigger("finish", null, args);
                            this._isFinishing = false;
                        }
                        else
                        {
                            //cancel the finish operation - by going to the next step.
                            this._step(this.stepindex(), step);
                            this.buttons.filter(".finish").k2button("error", function ()
                            {
                                //Since user clicked on finish button, we can set the save button to "complete" instead of "error" so that it doesn't flick
                                $this.buttons.filter(".save").k2button("complete");
                                $this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("saving finishing");
                            });
                            this._isFinishing = false;
                        }
                    }.bind(this));
                }
                else
                {
                    //TODO: Don't show the overlay automatically, the consumer of the wizard should do this.
                    if (this.options.useoverlay == true) this.showOverlay();
                    this._trigger("finish", null, args);
                    // Reset canvas regardless of outcome.
                    var finishButton = this.buttons.filter(".finish");
                    // TFS 779911 - Cant call .k2button("complete") on an element that has already been removed from the DOM. 
                    // This is still used for when the configuration screen cannot close
                    if (finishButton.closest("body").length > 0) 
                    {
                        this.buttons.filter(".finish").k2button("complete");
                    }
                    this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("finishing");
                    this._isFinishing = false;
                }
            },

            finishComplete: function (callback)
            {
                var $this = this;
                //complete the wizard when the finish button has finished animating.
                // TFS 756346 - Do not use this.buttons.filter(".finish").k2button("complete", ...) here
                // it does the same thing, but also removes classes that we want to keep
                this.buttons.filter(".finish").addClassTransition("complete", function ()
                {
                    $this.buttons.filter(".save").k2button("complete");
                    $this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("saving finishing");
                    if (typeof callback === "function") callback();
                }, ".button");

                this._isFinishing = false;

                this.removeOverlay();
            },

            finishCancel: function ()
            {
                this.buttons.filter(".finish, .save").removeClass("loading");
                this.element.find(".wizard-step-content, .wizard-steps-container").removeClass("saving finishing");
                this._isFinishing = false;
                this.removeOverlay();
            },

            cancel: function ()
            {
                this._trigger("cancel", null, {});
            },

            // Maps the name value and integer step value
            setStepMapping: function (name, step)
            {
                if (this._stepMappings.length === 0)
                {
                    this._stepMappings.push({ name: name, step: step });
                }
                else
                {
                    // if key is found, overwrite, else add
                    for (var i = 0; i < this._stepMappings.length; i++)
                    {
                        var mapping = this._stepMappings[i];
                        if (mapping.name.toLowerCase() === name)
                        {
                            mapping.step = step;
                            return;
                        }
                    }
                    this._stepMappings.push({ name: name, step: step });
                }
            },

            // Retrieves step value via name key
            getStep: function (name)
            {
                for (var i = 0; i < this._stepMappings.length; i++)
                {
                    var mapping = this._stepMappings[i];
                    if (mapping.name.toLowerCase() === name.toLowerCase())
                    {
                        return mapping.step;
                    }
                }
                return -1;
            },

            // Retrieves the step name via the step number
            getStepName: function (step)
            {
                for (var i = 0; i < this._stepMappings.length; i++)
                {
                    var mapping = this._stepMappings[i];
                    if (mapping.step === step)
                    {
                        return mapping.name;
                    }
                }
                return null;
            },

            // Validate step range & perform callback on completion
            validate: function ()
            {
                var self = this;
                var from = 0;
                var to = self.steps.length - 1;
                var callback = $.noop;

                // Argument Options Handling
                // 1. Single argument - starting step
                // 2. Single argument - validation callback function
                // 3. Two arguments - starting step & validation callback function
                // 4. Three arguments - starting & stopping steps, & validation callback function
                if (arguments.length > 0)
                {
                    if (arguments.length === 1)
                    {
                        if (typeof arguments[0] === "number")
                        {
                            from = arguments[0];
                        }
                        else if (typeof arguments[0] === "function")
                        {
                            callback = arguments[0];
                        }
                    }
                    else if (arguments.length === 2)
                    {
                        from = arguments[0];
                        callback = arguments[1];
                    }
                    else if (arguments.length === 3)
                    {
                        from = arguments[0];
                        to = arguments[1];
                        callback = arguments[2];
                    }
                }

                // Only attempt to validate if a validation function exists
                if (typeof self.options.validate === "function")
                {
                    // Set the first step for validation
                    var step = from;

                    while (step < to && self.steps.eq(step).is(".hidden, .disabled"))
                    {
                        step++;
                    }

                    // Callback Handler - ensures each step is validated in turn
                    function _continueValidation(res)
                    {
                        if (!res)
                        {
                            // Validation failed, return the result to the handler
                            callback(false, step);
                        }
                        else
                        {
                            // Set  next step
                            step++;

                            // Keep advancing if current step is not available
                            while (step < to && self.steps.eq(step).is(".hidden, .disabled")) step++;

                            // Available step to be validated
                            if (step <= to && !self.steps.eq(step).is(".hidden, .disabled"))
                            {
                                self.options.validate(step, _continueValidation);
                            }
                            else
                            {
                                // Validation complete, return the result to the handler
                                callback(true);
                            }
                        }
                    }

                    // Kick-off the validation
                    self.options.validate(step, _continueValidation);
                }
                else
                {
                    // If no validation function was provided, assume success
                    callback(true);
                }
            }
        }

    if (typeof SCWizard === "undefined") SCWizard = SourceCode.Forms.Controls.Wizard;

    $.widget("ui.wizard", SourceCode.Forms.Controls.Wizard);

    $.extend($.ui.wizard.prototype, {
        getter: "stepindex find",
        options: {
            autoheader: true,
            contextobjectname: "",
            useoverlays: true
        }
    });

    $(function ()
    {
        $(".wizard").wizard();

        // Disable the dragging of the wizard buttons in Firefox & Chrome
        $(document).on("dragstart", function (e)
        {
            if ($(e.target).closest(".wizard-buttons").length > 0)
            {
                return false;
            }
        });
    });

})(jQuery);
