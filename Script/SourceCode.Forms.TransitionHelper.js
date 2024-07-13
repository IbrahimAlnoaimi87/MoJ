(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.TransitionHelper === "undefined" || SourceCode.Forms.TransitionHelper === null)
    {
        SourceCode.Forms.TransitionHelper = function (options)
        {
            this.initialize(options);
        };

        SourceCode.Forms.TransitionHelper.prototype = {

            initialize: function (options)
            {
                var defaultSelectorToWaitFor = ".animation-timer";

                var options = checkExists(options) ? options : {};

                this.parentToHandleOn = checkExists(options.parentToHandleOn) ? options.parentToHandleOn : null;
                this.onEndCallback = (typeof options.onEndCallback === "function") ? options.onEndCallback : null;
                this.addClassToStart = (typeof options.addClassToStart === "string") ? options.addClassToStart : "";
                this.removeClassToStart = (typeof options.removeClassToStart === "string") ? options.removeClassToStart : "";
                this.selectorToWaitFor = checkExistsNotEmpty(options.selectorToWaitFor) ? options.selectorToWaitFor : defaultSelectorToWaitFor;

                this.transitionsCount = 0;
            },

            onTransitionStart: function (e)
            {
                this.transitionsCount++;
            },

            onTransitionEnd: function (e)
            {
                this.transitionsCount--;

                if ((this.transitionsCount === 0) || ((e.target !== null) && $(e.target).is(this.selectorToWaitFor)))
                {
                    this.parentToHandleOn.off("transitionstart.transitionhelper");
                    this.parentToHandleOn.off("transitionend.transitionhelper");
                    this.onEndCallback();
                }
            },

            handleTransition: function ()
            {
                if ((this.parentToHandleOn === null) || (this.onEndCallback === null))
                {
                    return;
                }

                this.parentToHandleOn.on("transitionstart.transitionhelper", this.onTransitionStart.bind(this));
                this.parentToHandleOn.on("transitionend.transitionhelper", this.onTransitionEnd.bind(this));

                var elementsToWaitFor = this.parentToHandleOn.find(this.selectorToWaitFor).addBack(this.selectorToWaitFor);

                if (this.addClassToStart !== "")
                {
                    this.parentToHandleOn.addClass(this.addClassToStart);
                }

                if (this.removeClassToStart !== "")
                {
                    this.parentToHandleOn.removeClass(this.removeClassToStart);
                }

                if (!SourceCode.Forms.Layout.useAnimations() || this.parentToHandleOn.css("display") === "none")
                {
                    this.parentToHandleOn.off("transitionstart.transitionhelper");
                    this.parentToHandleOn.off("transitionend.transitionhelper");
                    this.onEndCallback();
                    return;
                }

                var foundTransitions = false;

                if (elementsToWaitFor.length > 0)
                {
                    for (var i = 0; i < elementsToWaitFor.length; i++)
                    {
                        var currentJqElement = $(elementsToWaitFor[0]);

                        var transitionDuration = currentJqElement.css("transition-duration");

                        if (checkExistsNotEmpty(transitionDuration) && (transitionDuration !== "0s"))
                        {
                            foundTransitions = true;
                            break;
                        }
                    }

                    if (foundTransitions === false)
                    {
                        this.parentToHandleOn.off("transitionstart.transitionhelper");
                        this.parentToHandleOn.off("transitionend.transitionhelper");
                        this.onEndCallback();
                    }
                }
            }
        };
    }
})(jQuery);
