'use babel';

import {CompositeDisposable} from 'atom';

class SimpleKillRing {
  _subscriptions = null;
  _ring = ''; // This should actually be an array of strings, but I don't need that for now

  activate = (previousRing) => {
    this._subscriptions = new CompositeDisposable();
    this._subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'atom-simple-kill-ring:kill': () => this.kill(),
        'atom-simple-kill-ring:yank': () => this.yank(),
        'atom-simple-kill-ring:cut': () => this.cut(),
      }),
    );
    if (previousRing !== '') {
      this._ring = previousRing;
    }
  };

  deactivate = () => {
    this._subscriptions.dispose();
  };

  kill = () => {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor || editor.hasMultipleCursors()) {
      // TODO: Handle multiple cursors?
      return;
    }

    editor.selectToEndOfLine();
    const selection = editor.getSelectedText();
    if (selection !== '') {
      this._ring = selection;
    }
    editor.deleteToEndOfLine();
  };

  cut = () => {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor || editor.hasMultipleCursors()) {
      // TODO: Handle multiple cursors?
      return;
    }
    const selection = editor.getSelectedText();
    if (selection !== '') {
      this._ring = selection;
      editor.delete();
    }
  };

  yank = () => {
    if (this._ring === '') {
      return;
    }
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }
    editor.insertText(this._ring);
  };

  serialize = () => {
    return this._ring;
  };
}

export default new SimpleKillRing();
