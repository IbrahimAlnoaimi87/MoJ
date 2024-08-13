<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
>
	<xsl:output method="xml" indent="no"/>

	<xsl:output omit-xml-declaration="yes"/>

	<xsl:param name="WorkflowsResourceName"/>

	<xsl:template match="/">
		<xsl:element name="nodes">
			<xsl:element name="node">
				<xsl:attribute name="text">
					<xsl:value-of select="$WorkflowsResourceName"/>
				</xsl:attribute>
				<xsl:attribute name="open">
					<xsl:text>false</xsl:text>
				</xsl:attribute>
				<xsl:apply-templates select="Items/Item">
				</xsl:apply-templates>
			</xsl:element>
		</xsl:element>
	</xsl:template>
	<xsl:template match="Item[@ItemType='ProcessSet']">
					<xsl:apply-templates select="Items/Item"/>
	</xsl:template>
	<xsl:template match="Item[@ItemType!='ProcessSet']">
		<xsl:element name="node">
			<xsl:call-template name="AddWIIcon">
			</xsl:call-template>
			<xsl:attribute name="ItemType">
				<xsl:value-of select="@ItemType"/>
			</xsl:attribute>
			<xsl:attribute name="text">
				<xsl:value-of select="DisplayName"/>
			</xsl:attribute>
			<xsl:attribute name="name">
				<xsl:value-of select="Name"/>
			</xsl:attribute>
			<xsl:attribute name="open">
				<xsl:text>false</xsl:text>
			</xsl:attribute>
			<xsl:apply-templates select="Items/Item"/>
		</xsl:element>
	</xsl:template>
	<xsl:template name="AddWIIcon">
		<xsl:attribute name="icon">
			<xsl:if test="@ItemType='ProcessFolder'">
				<xsl:text>workflows</xsl:text>
			</xsl:if>
			<xsl:if test="@ItemType='Process'">
				<xsl:text>workflow</xsl:text>
			</xsl:if>
			<xsl:if test="Name='Folio' or Name='DisplayName' or Name='Description' or Name='Instructions' or Name='Data'">
				<xsl:text>text</xsl:text>
			</xsl:if>
			<xsl:if test="Name='Priority' or Name='ID'">
				<xsl:text>number</xsl:text>
			</xsl:if>
			<xsl:if test="Name='ExpectedDuration'">
				<xsl:text>number</xsl:text>
			</xsl:if>
			<xsl:if test="Name='ActionName'">
				<xsl:text>workflow-action-name</xsl:text>
			</xsl:if>
			<xsl:if test="Name='getworkflowactions' ">
				<xsl:text>workflow-actions</xsl:text>
			</xsl:if>
			<xsl:if test="Name='SerialNumber'">
				<xsl:text>text</xsl:text>
			</xsl:if>
			<xsl:if test="@ItemType='ProcessDataField' or @ItemType='ActivityDataField'">
				<xsl:text>data-field</xsl:text>
			</xsl:if>
			<xsl:if test="@ItemType='ProcessXmlField' or @ItemType='ActivityXmlField'">
				<xsl:text>xml-field</xsl:text>
			</xsl:if>
			<xsl:if test="@ItemType='Activity'">
				<xsl:text>process-activity</xsl:text>
			</xsl:if>
		</xsl:attribute>
	</xsl:template>
</xsl:stylesheet>
