<img src="https://github.com/ozgurgunes/Sketch-Smart-Truncate/blob/master/assets/icon.png?raw=true" alt="Sketch Smart Truncate" width="192" align="right" />

# Smart Truncate  [![Download Latest][image]][link]

[image]: https://img.shields.io/github/release/ozgurgunes/Sketch-Smart-Truncate.svg?label=Download
[link]: https://github.com/ozgurgunes/Sketch-Smart-Truncate/releases/latest/download/smart-truncate.sketchplugin.zip

Smart Truncate plugin for Sketch, truncates text in selected layers, symbol overrides or even all overrides of all instances of selected symbol master to given length.

## Installation

[Download][link] the latest release, unzip and double click on the .sketchplugin file.

#### Alternatively

Search for Smart Truncate in [Sketchrunner](http://sketchrunner.com/) or [Sketchpacks](https://sketchpacks.com/).

## Selection

All plugin commands have 4 scopes depend on your selection.

### Text Layers

If your selection have any text layers; command will be applied on all text layers in your selection.

### Overrides

If you select overrides directly; all text overrides in your selection will be truncated.

### Symbol Instances

If you select instances of same symbol; like symbol master, first you will be asked to choose which text overrides will be truncated, then all chosen overrides of selected symbols will be truncated.

### Symbol Master

If you select a symbol master; first you will be asked to choose which text overrides will be truncated, then all chosen overrides of all instances of the symbol will be truncated.

## Commands

Plugin have several truncate methods and text parts.

### Truncate Last Characters

Keeps starting part of text in given length including suffix. Removes any punctation and space character before suffix.

### Truncate Last Words

Keeps starting words of text in given length. Removes any punctation and space character before suffix.

### TLC (Truncate Last Characters) Without Cutting Words

Keeps starting words in given character length at maximum. Keeps first word whole if it is londer than given character length. Removes any punctation and space character before suffix.

### Truncate First Characters

Keeps ending part of text in given length including suffix. Removes any punctation and space character after suffix.

### Truncate First Words

Keeps ending words of text in given length. Removes any punctation and space character afer suffix.

### TFC (Truncate First Characters) Without Cutting Words

Keeps ending words in given character length at maximum. Keeps last word whole if it is londer than given character length. Removes any punctation and space character after suffix.

### Truncate Middle Characters

Keeps starting and ending parts of text in given length including suffix. Removes any punctation and space character before and after suffix.

### Truncate Middle Words

Keeps starting and ending words of text in given length. Removes any punctation and space character before and afer suffix.

### TMC (Truncate Middle Characters) Without Cutting Words

Keeps starting and ending words in given character length at maximum. Keeps first and last words whole if they are londer than half of the given character length. Removes any punctation and space character before and after suffix.

## Settings

Plugin lets you define a custom suffix to place in truncated part.
