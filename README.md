# atom-simple-kill-ring
Emacs style `ctrl-k`, `ctrl-y`, and `ctrl-w` using a separate clipboard.

## Install
```
apm install atom-simple-kill-ring
```

## Default Keymap
```
{
  "atom-text-editor": {
    "ctrl-k": "atom-simple-kill-ring:kill",
    "ctrl-y": "atom-simple-kill-ring:yank",
    "ctrl-w": "atom-simple-kill-ring:cut"
  }
}
```
