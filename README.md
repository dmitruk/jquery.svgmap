# jQuery SVG-map plugin

## Usage and default values
```javascript
$("#map").svgmap({
    data: null,
    width: null,
    height: null,
    offset: {
        x: 0,
        y: 0
    },
    rotation: 0,
    scale: "auto",
    style: {
        stroke: {
            default: "#555",
            hover:   "#555",
            click:   "#555"
        },
        strokeWidth: {
            default: 1.5,
            hover:   1.5,
            click:   1.5
        },
        fill: {
            default: "#e7e7e7",
            hover:   "#999",
            click:   "#555"
        }
    },
    callback: {
        init:  $.noop,
        hover: [$.noop, $.noop],
        click: $.noop
    }
});
```
