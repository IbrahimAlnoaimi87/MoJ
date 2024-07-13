<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="no" omit-xml-declaration="yes"/>

	<xsl:param name="ParentID" select="''"/>
	<xsl:param name="ParentType" select="''"/>
	<xsl:param name="ViewID" select="''"/>
	<xsl:param name="InstanceID" select="''"/>
	<xsl:param name="ControlID" select="''"/>
	<xsl:param name="State" select="'Unchanged'"/>
	<xsl:param name="Join" select="''"/>
	<xsl:param name="ContextID" select="''"/>
	<xsl:param name="ContextType" select="''"/>

	<xsl:template match="/">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="collection">
		<xsl:element name="collection">
			<!-- Iterate through existing object elements -->
			<xsl:apply-templates select="object" mode="existing">
				<xsl:sort select="position()" data-type="number" order="ascending" />
			</xsl:apply-templates>

			<!-- Iterate through new object elements -->
			<xsl:apply-templates select="merge/collection/object" mode="merge">
				<xsl:sort select="position()" data-type="number" order="descending" />
			</xsl:apply-templates>

			<!-- Copy any other elements  -->
			<xsl:apply-templates select="*[(name() != 'object') and (name() != 'merge')]" mode="copy"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="object" mode="existing">
		<xsl:variable name="existingState" select="@state"/>
		<xsl:variable name="existingObject" select="."/>
		<xsl:variable name="newObject" select="
		../merge/collection/object
		[(@counter = current()/@counter) or (not(@counter) and not(current()/@counter))]
		[not(@parentid) or (@parentid = current()/@parentid)]
		[not(@parenttype) or (@parenttype = current()/@parenttype)]
		[not(@contextid) or (@contextid = current()/@contextid)]
		[not(@contexttype) or (@contexttype = current()/@contexttype)]
		[not(@viewid) or (@viewid = current()/@viewid)]
		[not(@instanceid) or (@instanceid = current()/@instanceid)]
		[(not(controlid) and not(current()/@controlid)) or ((@controlid) and (current()/@controlid))]
		[(@method = current()/@method) or (not(@method) and not(current()/@method))]
		[(@pagenumber = current()/@pagenumber) or (not(@pagenumber) and not(current()/@pagenumber))]
		[(@join = current()/@join) or ((current()/@join = 'false') and not(@join))]
		"/>

		<xsl:call-template name="object">
			<xsl:with-param name="existingState" select="$existingState"/>
			<xsl:with-param name="existingObject" select="$existingObject"/>
			<xsl:with-param name="newObject" select="$newObject"/>
		</xsl:call-template>

		<!--<xsl:choose>
			<xsl:when test="$newObject">
				-->
		<!--<xsl:comment>existing-when-mergeOther</xsl:comment>-->
		<!--
				<xsl:for-each select="$newObject">
					<xsl:call-template name="object">
						<xsl:with-param name="existingState" select="$existingState"/>
						<xsl:with-param name="existingObject" select="$existingObject"/>
						<xsl:with-param name="newObject" select="."/>
					</xsl:call-template>
				</xsl:for-each>
			</xsl:when>
			<xsl:otherwise>
				-->
		<!--<xsl:comment>existing-otherwise-mergeCurrent</xsl:comment>-->
		<!--
				<xsl:call-template name="object">
					<xsl:with-param name="existingState" select="$existingState"/>
					<xsl:with-param name="existingObject" select="$existingObject"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>-->

	</xsl:template>

	<xsl:template match="object" mode="merge">
		<xsl:variable name="existingObject" select="
		../../../object
		[(@counter = current()/@counter) or (not(@counter) and not(current()/@counter))]
		[not(current()/@parentid) or (@parentid = current()/@parentid)]
		[not(current()/@parenttype) or (@parenttype = current()/@parenttype)]
		[not(current()/@contextid) or (@contextid = current()/@contextid)]
		[not(current()/@contexttype) or (@contexttype = current()/@contexttype)]
		[not(current()/@viewid) or (@viewid = current()/@viewid)]
		[not(current()/@instanceid) or (@instanceid = current()/@instanceid)]
		[(not(controlid) and not(current()/@controlid)) or ((@controlid) and (current()/@controlid))]
		[(@method = current()/@method) or (not(@method) and not(current()/@method))]
		[(@pagenumber = current()/@pagenumber) or (not(@pagenumber) and not(current()/@pagenumber))]
		[(@join = current()/@join) or (not(current()/@join) and (@join = 'false'))]
		"/>
		<xsl:variable name="newObject" select="."/>
		<xsl:choose>
			<xsl:when test="$existingObject">
				<!--<xsl:comment>merge-when-skip</xsl:comment>-->
			</xsl:when>
			<xsl:otherwise>
				<!--<xsl:comment>merge-otherwise-mergeCurrent</xsl:comment>-->
				<xsl:call-template name="object">
					<xsl:with-param name="existingState">
						<xsl:choose>
							<xsl:when test="(@state) and (@state != 'Changed')">
								<xsl:value-of select="@state"/>
							</xsl:when>
							<xsl:otherwise>Added</xsl:otherwise>
						</xsl:choose>
					</xsl:with-param>
					<xsl:with-param name="existingObject" select="$existingObject"/>
					<xsl:with-param name="newObject" select="$newObject"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="object">
		<xsl:param name="existingState"/>
		<xsl:param name="existingObject"/>
		<xsl:param name="newObject" select="."/>
		<!--<xsl:comment>object (existingState = '<xsl:value-of select="$existingState"/>', state = '<xsl:value-of select="@state"/>')</xsl:comment>-->

		<xsl:if test="not(($existingState='Added' and @state='Removed') or ($existingState='Removed' and @state='Unchanged'))">
			<xsl:element name="object">

				<xsl:choose>
					<xsl:when test="$newObject">
						<xsl:apply-templates select="$newObject" mode="attributes">
							<xsl:with-param name="existingState" select="$existingState"/>
						</xsl:apply-templates>
					</xsl:when>
					<xsl:otherwise>
						<!--
						<xsl:apply-templates select="$existingObject" mode="attributes">
							<xsl:with-param name="existingState" select="$existingState"/>
						</xsl:apply-templates>
						-->
						<xsl:apply-templates select="$existingObject/@*" mode="copy"/>
					</xsl:otherwise>
				</xsl:choose>

				<!-- Fields -->
				<xsl:choose>
					<!-- Special Case : Remove existing fields : not sure why -->
					<xsl:when test="(count($newObject/fields/field) = 0) and (count($existingObject/fields/field) > 0) and ($newObject/@state = 'Unchanged')"></xsl:when>

					<!-- Special Case : No new object : copy existing fields -->
					<xsl:when test="not($newObject)">
						<xsl:apply-templates select="$existingObject/*" mode="copy"/>
					</xsl:when>

					<!-- Normal Case : Merge fields -->
					<xsl:otherwise>
						<xsl:element name="fields">
							<xsl:for-each select="$existingObject/fields/field">
								<xsl:call-template name="field">
									<xsl:with-param name="existingField" select="."/>
									<xsl:with-param name="newField" select="$newObject/fields/field[(@name = current()/@name) and (@type = current()/@type)]"/>
									<xsl:with-param name="mode">existing</xsl:with-param>
								</xsl:call-template>
							</xsl:for-each>
							<xsl:for-each select="$newObject/fields/field">
								<xsl:sort select="position()" data-type="number" order="descending"/>
								<xsl:call-template name="field">
									<xsl:with-param name="existingField" select="$existingObject/fields/field[(@name = current()/@name) and (@type = current()/@type)]"/>
									<xsl:with-param name="newField" select="."/>
									<xsl:with-param name="mode">new</xsl:with-param>
								</xsl:call-template>
							</xsl:for-each>
						</xsl:element>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:element>
		</xsl:if>
	</xsl:template>

	<xsl:template match="object" mode="attributes">
		<xsl:param name="existingState"/>
		<xsl:attribute name="parentid">
			<xsl:choose>
				<xsl:when test="@parentid">
					<xsl:value-of select="@parentid"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$ParentID"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
		<xsl:attribute name="parenttype">
			<xsl:choose>
				<xsl:when test="@parenttype">
					<xsl:value-of select="@parenttype"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$ParentType"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
		<xsl:if test="(@viewid) or (string-length($ViewID) > 0)">
			<xsl:attribute name="viewid">
				<xsl:choose>
					<xsl:when test="@viewid">
						<xsl:value-of select="@viewid"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$ViewID"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
		</xsl:if>
		<xsl:if test="@counter">
			<xsl:attribute name="counter">
				<xsl:value-of select="@counter"/>
			</xsl:attribute>
		</xsl:if>
		<xsl:if test="(@controlid) or (string-length($ControlID) > 0)">
			<xsl:attribute name="controlid">
				<xsl:choose>
					<xsl:when test="@controlid">
						<xsl:value-of select="@controlid"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$ControlID"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
		</xsl:if>
		<xsl:if test="(@instanceid) or (string-length($InstanceID) > 0)">
			<xsl:attribute name="instanceid">
				<xsl:choose>
					<xsl:when test="@instanceid">
						<xsl:value-of select="@instanceid"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$InstanceID"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
		</xsl:if>
		<xsl:if test="(@join) or (string-length($Join) > 0)">
			<xsl:attribute name="join">
				<xsl:choose>
					<xsl:when test="@join">
						<xsl:value-of select="@join"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$Join"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
		</xsl:if>
		<xsl:attribute name="contextid">
			<xsl:choose>
				<xsl:when test="@contextid">
					<xsl:value-of select="@contextid"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$ContextID"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
		<xsl:attribute name="contexttype">
			<xsl:choose>
				<xsl:when test="@contexttype">
					<xsl:value-of select="@contexttype"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$ContextType"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
		<xsl:attribute name="state">
			<xsl:choose>
				<xsl:when test="@state">
					<xsl:choose>
						<xsl:when test="$existingState = 'Added' and @state = 'Changed'">Added</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="@state"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$State"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="field">
		<xsl:param name="existingField" />
		<xsl:param name="newField" />
		<xsl:param name="mode" />
		<!--<xsl:comment>field (mode : <xsl:value-of select="$mode"/>)</xsl:comment>-->

		<xsl:choose>
			<!-- Not existing or new field : skip -->
			<xsl:when test="not($newField) and not($existingField)">
				<!--<xsl:comment>Not existing or new field : skip</xsl:comment>-->
			</xsl:when>

			<!-- No new field : copy existing field -->
			<xsl:when test="not($newField)">
				<!--<xsl:comment>No new field : copy existing field</xsl:comment>-->
				<xsl:apply-templates select="$existingField" mode="copy"/>
			</xsl:when>

			<!-- No existing field : copy new field -->
			<xsl:when test="not($existingField)">
				<!--<xsl:comment>No existing field : copy new field</xsl:comment>-->
				<xsl:apply-templates select="$newField" mode="copy"/>
			</xsl:when>

			<!-- Both exist : merge with mode 'new' : skip - already merged -->
			<xsl:when test="$mode = 'new'">
				<!--<xsl:comment>Both exist : merge with mode 'new'</xsl:comment>-->
			</xsl:when>

			<!-- Both exist : merge with mode 'existing' -->
			<xsl:otherwise>
				<!--<xsl:comment>Both exist : merge with mode 'existing'</xsl:comment>-->
				<xsl:apply-templates select="$newField" mode="copy"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="@* | node()" mode="copy">
		<xsl:copy>
			<xsl:apply-templates select="@* | node()" mode="copy"/>
		</xsl:copy>
	</xsl:template>

</xsl:stylesheet>
