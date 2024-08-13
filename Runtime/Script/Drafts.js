(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) { SourceCode = {}; }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) { SourceCode.Forms = {}; }
    if (typeof SourceCode.Forms.Runtime === "undefined" || SourceCode.Forms.Runtime === null) { SourceCode.Forms.Runtime = {}; }
    if (typeof SourceCode.Forms.Runtime.Drafts === "undefined" || SourceCode.Forms.Runtime.Drafts === null) { SourceCode.Forms.Runtime.Drafts = {}; }

    // #region DraftSaveException
    var draftSaveExceptionObj = function (draftSaveException, messages)
    {
        this.type = draftSaveException;

        if (Array.isArray(messages))
        {
            this.messages = messages;
        }
        else
        {
            this.messages = [];
        }
    };
    SourceCode.Forms.Runtime.Drafts.DraftSaveException = draftSaveExceptionObj;

    // Enum for exceptions.
    SourceCode.Forms.Runtime.Drafts.DraftSaveExceptions =
        {
            AttachmentTooLarge: "AttachmentTooLarge",
            AttachmentNotSupported: "AttachmentNotSupported"
        };

    // #endregion DraftSaveException


})(jQuery);
