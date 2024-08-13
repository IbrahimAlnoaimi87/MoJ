<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Form.aspx.cs" Async="true" Inherits="SourceCode.Forms.Web.Runtime.Form" %>

<!DOCTYPE html>
<!-- Generated on <%=DateTime.UtcNow.ToString("o") %> -->
<html dir="rtl" class="<%=IsMobile(Request.UserAgent.ToLower()) ? "mobile touch" : "desktop" %>">
<head runat="server">
    <title>Form Runtime</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html" charset="utf-8"/>

    <link href="../Content/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
    <link href="../Content/assets/css/main.css" rel="stylesheet">
    <link rel="stylesheet" href="../Content/assets/css/bootstrap.rtl.min.css" integrity="sha384-gXt9imSW0VcJVHezoNQsP+TNrjYXoGcrqBZJpry9zJt8PCQjobwmhMGaDHTASo9N" crossorigin="anonymous">

    <style>
        body {
            direction: rtl;
            font-family: 'Arial', 'Tahoma', 'Sans-serif';
        }
        input, textarea, select {
            text-align: right;
            direction: rtl;
        }
    </style>
</head>
<body style="overflow-y: <%=HttpUtility.HtmlAttributeEncode(overFlowY.Replace(";",""))%>; background-color: <%=HttpUtility.HtmlAttributeEncode(backgroundColor.Replace(";",""))%>; background-image: <%=HttpUtility.HtmlAttributeEncode(backgroundImage.Replace(";",""))%>; background-repeat: <%=HttpUtility.HtmlAttributeEncode(backgroundRepeat.Replace(";",""))%>; background-size: <%=HttpUtility.HtmlAttributeEncode(backgroundSize.Replace(";",""))%>; background-position: <%=HttpUtility.HtmlAttributeEncode(backgroundPosition.Replace(";",""))%>;" class="theme-entry <%=cssClass%>">
<!-- <header id="header" class="header fixed-top"> -->
<header id="header" class="header">
    <div class="topbar d-flex align-items-center">
      <div class="container d-flex justify-content-center justify-content-md-between">
        <div class="contact-info d-flex align-items-center">
          <i class="bi bi-envelope d-flex align-items-center"><a href="mailto:contact@example.com">contact@example.com</a></i>
          <i class="bi bi-phone d-flex align-items-center ms-4"><span>009744044004</span></i>
        </div>
        <div class="social-links d-none d-md-flex align-items-center">
          <a href="#" class="twitter"><i class="bi bi-twitter-x"></i></a>
          <a href="#" class="facebook"><i class="bi bi-facebook"></i></a>
          <a href="#" class="instagram"><i class="bi bi-instagram"></i></a>
          <a href="#" class="lang"><i class="bi bi-globe2"></i> Arabic</a>
        </div>
      </div>
    </div><!-- End Top Bar -->

    <div class="branding d-flex align-items-cente">

      <div class="container position-relative d-flex align-items-center justify-content-between">
        <a href="index.html" class="logo d-flex align-items-center">
           <img src="../../../Content/assets/img/logo.png" alt="">
        </a>

        <nav id="navmenu" class="navmenu">
          <ul>
            <li><a href="#hero" class="active">Home<br></a></li>
            
            <li><a href="#contact">Contact</a></li>
          </ul>
          <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
        </nav>

      </div>

    </div>

  </header> 
<section class="section register min-vh-80 d-flex flex-column py-4">  
   <span id="__runtimeStatus" style="display: none">loading</span>
    <span id="__runtimeWhoAmI" style="display: none; background: lime; font-size: 24pt">unknown</span>
    <div id="__initialModalizer" class="base2 base1 modalizer<%=(!RenderedShowOverLay) ? " invisible-modalizer" : ""  %>" 
        style="z-index: 1; <%=(InitialOverlayOpacity != "-1") ? string.Format("opacity: {0};", InitialOverlayOpacity) : ""  %>">
        <div class="base0 base1 ajaxLoader" style="<%=(!RenderedShowBusy) ? "display:none;" : ""%>"></div>
    </div>
    <form id="form1" runat="server">
        <iframe id="HiddenFileFrame" name="HiddenFileFrame"></iframe>
    </form>
    <% if (!_hasServerEvents) { %>
    <asp:Substitution ID="OutputCacheSubstitution"
        MethodName="PerformOutputSubstitutions"
        runat="Server"></asp:Substitution>
    <% } else { %>
    <asp:Literal ID="CustomOutputCacheSubstitution" runat="server"></asp:Literal>
    <%}%>
    <script type="text/javascript">
        $(function () {
            try {
                try
                {
                    parent.postMessage("sfrtFormReady", "*");
                }
                catch (e) {
                    window.postMessage("sfrtFormReady", "*");
                };
            }
            catch (e) {
            }
        });
    </script>
    <%      if (acceptsPostMessages) { %>
    <script type="text/javascript">
        $(function ()
        {
            let knownAllowedMessages = ["sfrtViewReady", "sfrtFormReady", "sfErrorReady"];

            var mostRecentStyleProfileData = {};

            window.addEventListener("message", function (evt)
            {
                if (evt.origin === window.location.origin)
                {
                    if (evt.data.type === "apply-style-profile")
                    {
                        // Merge style profile data
                        $.extend(mostRecentStyleProfileData, evt.data);
                        applyStyleProfile(evt.data.variables, evt.data.cssFiles, evt.data.jsFiles);

                        // find subforms
                        applySubformStyleProfile(
                            $(".runtime-popup").toArray().map(x => x.contentWindow),
                            evt.data.variables,
                            evt.data.cssFiles,
                            evt.data.jsFiles
                        );
                    }
                    // The event when a subform form has loaded
                    else if (evt.data === "sfrtFormReady" && evt.currentTarget)
                    {
                        applySubformStyleProfile(
                            evt.currentTarget,
                            mostRecentStyleProfileData.variables,
                            mostRecentStyleProfileData.cssFiles,
                            mostRecentStyleProfileData.jsFiles
                        );
                    }
                    // The event when a subview has loaded
                    else if (evt.data === "sfrtViewReady" && evt.currentTarget) {
                        applySubviewStyleProfile(
                            evt.currentTarget,
                            mostRecentStyleProfileData.variables,
                            mostRecentStyleProfileData.cssFiles,
                            mostRecentStyleProfileData.jsFiles
                        );
                    }
                    else if (knownAllowedMessages.indexOf(evt.data) === -1)
                    {
                        console.warn("Unknown message type received: " + evt.data);
                        console.log(evt); // console.error doesn't log nice objects
                    }
                }
            });
        });
    </script>
    <%} %>
    </section>
  <footer id="footer" class="footer accent-background">

    <div class="container copyright text-center mt-4">
<p> <a href="https://www.moj.gov.qa/ar/" target="_blank">Ministry of Justice </a>
  |  <a href="https://www.moj.gov.qa/ar/Pages/ContactUs.aspx" target="_blank">Contact Us</a></p>
      <p> All rights reserved | Information Systems Department © 2024 </p>
    </div>

  </footer>
</body>

</html>
