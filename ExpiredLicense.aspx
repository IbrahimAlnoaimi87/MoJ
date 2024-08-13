<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ExpiredLicense.aspx.cs" Inherits="SourceCode.Forms.ExpiredLicense" %>

<!DOCTYPE html>

<html>
<head runat="server">
    <title><%= GetResource("ExpLicenseTitle").ToString()%></title>
    <style type="text/css">

        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        .expiredlicense-body {
            border: 1px solid black;
            margin: 0;
        }
        
        .expiredlicense-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translateX(-50%) translateY(-50%);
        }

        .expiredlicense-icon {
            position: relative;
            left: 50%;
            transform: translateX(-50%);
            height: 64px;
            width: 64px;
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAPjSURBVHgB7Zmtc9RAGMaf61UgC4oZzGlUa6C44OoAwyDBF6b8BZdTSAYGgaNIpgJQgGorwbQSwQyHQLc4FGHfZHeb5PKxu3l3m0zvN/N2e5tcdp/n9iu7wJIlS5YYkDzBlALnw1TG+ZCKf4wkjfAmUHmJjPAmFMSHNyEv3osJ46aLqdAEccWlKN4EZl9xCH+Q0LgiP5IpS9m1BjSI1xXxaEKdeF22TDuXXWmAgXhdEQ8mtInXZcu0U9kLBliI1xVhNMFUvC5bps5lFwxwEK8rwmCCrXhdtkydytYGdBCvK9LBBFfxumyZWpedGsAgXlfEwYSu4nXZMrUyYcwoXlfEwgQu8bpsmRqbsIJ/GIEbYajBYolbvMJKT3pzsi0qMvKwuhshHr3ErOKKL/Ez2+dqtwKa0BvxRKG5BDChV+KJhf7iy4T7n3Cw90MPUpw4iycqBwxuE8SMgPgbfNBJPFE7YnKZ0GfxROOU0dWEvosnWudMVxOGIJ4wWjTYmjAU8YTxqsnUhCGJJ6yWjW0mDE08Yf0eUGfCEMU7Qybkd4njGws7t1wRo68oEy6keMXeFvbhR/w+AjGGI/S+f/0KHtIocvgb3Exk6mPLvYCTAfldpOga4MmESKZeTbA2oGoLbcgmrNjc3LR/KAZDTG/CBzGazwMjEc9F/MTZGHIk4g3OulItxi3AZPM0cEtYE/FMxGsRm/Kz4qqIdRE7Ml+sUvC36sFGBtjsHHs24ZeIY2SiaKa4a/A9MmdLxDtUmNBqgMu2uUcTnoo4RfbLm4hXUIu4JOJL+ULjGNDlzMDDmLArYo6sX++UrlH+bRGXkS3v78m8PPSdqPzQLsfjrTC3BHon+I5swFvP5c9FbMhrqonT/29FPEBxbPgj4nP+oZUtgPO0iLElHMl0vZSvukUZyntUyrtTvmlxV5j/qCyFYVdY1TWpya+Cfv2TpvsLLcCXePHMmRBPfXSGsJy23aAN8Cl+9Eo/l9LQJjSySn8CiVeoz1OYQb/ii9xn202cxvvHgcUrDpBVLEIzcxG3RHyAJ3wdjzeJV9D1tu5A48Yc2dxPK78T8Ow3vJfP9HA8biY+D91bVfYusmlsgmwKXAMv1LU2eI/H7cUrYiyaQIsbWvfTr2Wz7LXhgO943F28IkbRhLp5n5NTnuPx7uIVMc5MCGHA4lI4FZJYzNV84okYgdcJq1WZJEi0BLS2BF7xihgBcT8e9yO+uiSPNO4H1HaHcOL7QeEobDu48MRn2B2PQ7aKsHjtAvzLYH7Obwy4CCwNQP9p3dXpwhAMOIY/PmIATMC3D5CPExicHfaFCbLXYi7h+/KZ+A/UjDBFPbwk4gAAAABJRU5ErkJggg==')
		}
        .expiredlicense-title {
            margin: 7px;
            text-align: center;
            font-size: 1.5rem;
            font-family: "Open-Sans Bold", "Segoe UI Bold", "Helvetica", Helvetica, sans-serif;
            color: #36474f;
			padding-top:20px
        }
        .expiredlicense-text {
            text-align: center;
            font-size: 1.2rem;
            font-family: "Open-Sans Normal", "Segoe UI Normal", "Helvetica", Helvetica, sans-serif;
            color: #36474f;
        }
        .expiredlicense-support-link {
            margin: 7px;
            text-align: center;
            font-size: 1.2rem;
            font-family: "Open-Sans Normal", "Segoe UI Normal", "Helvetica", Helvetica, sans-serif;
            color: #003870;
        }
    </style>
</head>
<body class="expiredlicense-body">
    <form id="form1" runat="server">
        <div>
            <div class="expiredlicense-k2-logo">
            </div>
            <div class="expiredlicense-content">
                    <div class="expiredlicense-icon">
                    </div>
                    <div class="expiredlicense-title">
                        <%= GetResource("ExpLicenseTitle").ToString()%>
                    </div>
                    <div class="expiredlicense-text">
                        <%=GetResource("ExpLicenseTxtLine1").ToString()%>
                    </div>
                    <div class="expiredlicense-text">
                        <%=GetResource("ExpLicenseTxtLine2").ToString()%>
                    </div>
                    <div class="expiredlicense-support-link">
                        <a style="color:#003870;" href="https://community.nintex.com/automation-on-prem-29/how-to-obtain-and-manage-k2-license-keys-27696"><%=GetResource("ExpLicenseSupportLink").ToString()%></a>
                    </div>
            </div>
        </div>
    </form>
</body>
</html>
