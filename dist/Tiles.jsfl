var originX = 0;
var originY = 0;
var tileWidth = 100;
var tileHeight = 100;

/**
 * @var {Document}
 */
var doc;
var tileItem;
var timeline;
var startPosition;
var endPosition;
var centerPoint = {x: 0, y: 0};

function configureTool() {
    var tool = fl.tools.activeTool;
    tool.setToolName("tiles");
    tool.setIcon("Tiles.png");
    tool.setMenuString("Tiles Tool");
    tool.setToolTip("Tiles Tool");
    tool.setOptionsFile("Tiles.xml");
    tool.setPI("shape");
    tool.enablePIControl("stroke", false);
    tool.enablePIControl("fill", false);
}

function notifySettingsChanged() {
    var tool = fl.tools.activeTool;
    originX = tool.originX;
    originY = tool.originY;
    tileWidth = tool.tileWidth;
    tileHeight = tool.tileHeight;
}

function setCursor() {
    fl.tools.setCursor(0);
}

function activate() {
}

function deactivate() {
}

function mouseDown(mousePosition) {
    doc = fl.getDocumentDOM();
    tileItem = doc.library.getSelectedItems()[0];
    timeline = doc.getTimeline();
    if (tileItem && (tileItem.itemType === "movie clip" || tileItem.itemType === "component")) {
        startPosition = {x: mousePosition.x, y: mousePosition.y};
        endPosition = {x: mousePosition.x, y: mousePosition.y};
        fl.drawingLayer.beginDraw();
    } else {
        startPosition = undefined;
        endPosition = undefined;
    }
}

function mouseMove(mousePosition) {
    if (startPosition && endPosition) {
        endPosition.x = mousePosition.x;
        endPosition.y = mousePosition.y;
        drawPreview();
    }
}

function mouseUp() {
    if (startPosition && endPosition) {
        fl.drawingLayer.endDraw();
        var newTilePositions = [];
        for (var x = mouseToTileX(Math.min(startPosition.x, endPosition.x)),
                 mx = mouseToTileX(Math.max(startPosition.x, endPosition.x)); x <= mx; x += tileWidth) {
            for (var y = mouseToTileY(Math.min(startPosition.y, endPosition.y)),
                     my = mouseToTileY(Math.max(startPosition.y, endPosition.y)); y <= my; y += tileHeight) {
                var tile = getTileAt(x + tileWidth * 0.5, y + tileHeight * 0.5);
                if (!tile) {
                    newTilePositions.push({x: x, y: y});
                } else if (tile.libraryItem !== tileItem) {
                    tile.libraryItem = tileItem;
                    tile.x = x;
                    tile.y = y;
                }
            }
        }
        if (newTilePositions.length > 0) {
            // Add item is very costly operation (up to 20ms), that's why the item is created once and then copied
            doc.addItem(centerPoint, tileItem);
            var tiles = [doc.selection[0]];
            while (tiles.length < newTilePositions.length * 0.5) {
                doc.selection = tiles;
                doc.duplicateSelection();
                tiles = tiles.concat(doc.selection);
                doc.selectNone();
            }
            if (tiles.length < newTilePositions.length) {
                doc.selection = tiles.slice(0, newTilePositions.length - tiles.length);
                doc.duplicateSelection();
                tiles = tiles.concat(doc.selection);
                doc.selectNone();
            }
            for (var i = 0; i < tiles.length; i++) {
                tiles[i].x = newTilePositions[i].x;
                tiles[i].y = newTilePositions[i].y;
            }
        }
        doc.selectAll();
        doc.selectNone();
        startPosition = undefined;
        endPosition = undefined;
    }
}

function mouseToTileX(mousePositionX) {
    return Math.floor((mousePositionX + originX) / tileWidth) * tileWidth;
}

function mouseToTileY(mousePositionY) {
    return Math.floor((mousePositionY + originY) / tileHeight) * tileHeight;
}

function getTileAt(x, y) {
    var layer = timeline.layers[timeline.currentLayer];
    var elements = layer.frames[timeline.currentFrame].elements;
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if (element.elementType === "instance" &&
            x > element.x && x < element.x + tileWidth &&
            y > element.y && y < element.y + tileHeight) {
            return element;
        }
    }
    return undefined;
}

function drawPreview() {
    var x = mouseToTileX(Math.min(startPosition.x, endPosition.x));
    var mx = mouseToTileX(Math.max(startPosition.x, endPosition.x)) + tileWidth;
    var y = mouseToTileY(Math.min(startPosition.y, endPosition.y));
    var my = mouseToTileY(Math.max(startPosition.y, endPosition.y)) + tileHeight;
    fl.drawingLayer.beginFrame();
    fl.drawingLayer.moveTo(x, y);
    fl.drawingLayer.lineTo(mx, y);
    fl.drawingLayer.lineTo(mx, my);
    fl.drawingLayer.lineTo(x, my);
    fl.drawingLayer.lineTo(x, y);
    fl.drawingLayer.endFrame();
}