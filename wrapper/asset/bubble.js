function createBubbleThumb(fontId) {
    const theme = ThemeManager.instance.userTheme;

    const bubbleThumb = new BubbleThumb();

    const fontModel = FontManager
        .getFontManager()
        .getFontModelByFontId(fontId);

    bubbleThumb.id = fontModel.value;
    bubbleThumb.aid = fontModel.id;
    bubbleThumb.encAssetId = fontModel.encAssetId;
    bubbleThumb.tags = fontModel.tags;
    bubbleThumb.name = fontModel.label;
    bubbleThumb.enable = true;
    bubbleThumb.editable = this.isAssetEditable;

    bubbleThumb.setFileName(fontModel.id + ".swf");
    bubbleThumb.imageData = bubbleThumb.getDefaultBubbleBody(fontModel.value);

    bubbleThumb.type = "BLANK";
    bubbleThumb.theme = theme;

    theme.addThumb(bubbleThumb);

    return bubbleThumb;
}