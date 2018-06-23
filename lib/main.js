'use babel';

import {CompositeDisposable, Range} from 'atom';

// If the selection is reversed, normalize it
function normalizeSelection(selection, editor) {
  if (!selection.isReversed()) {
    return;
  }

  const {start, end} = selection.getScreenRange();
  selection.clear();
  editor.addSelectionForScreenRange(new Range(end, start));
}

class SimpleKillRing {
  _subscriptions = null;
  _data = {
    ringList: [], // Support multiple cursors
  };

  activate = (previousData) => {
    this._subscriptions = new CompositeDisposable();
    this._subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'atom-simple-kill-ring:kill': this.kill,
        'atom-simple-kill-ring:yank': this.yank,
        'atom-simple-kill-ring:cut': this.cut,
      }),
    );
    if (previousData) {
      this._data = JSON.parse(previousData);
    }
  };

  deactivate = () => {
    this._subscriptions.dispose();
  };

  kill = () => {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    editor.transact(() => {
      editor.getSelections().forEach(selection => normalizeSelection(selection, editor));
      editor.selectToEndOfLine();

      if (editor.hasMultipleCursors()) {
        const textList = editor.getSelections().map(selection => selection.getText());
        if (textList.join('') !== '') {
          this._data.ringList = textList;
        }
      } else {
        const selectedText = editor.getSelectedText();
        if (selectedText !== '') {
          this._data.ringList = [selectedText];
        }
      }

      editor.deleteToEndOfLine();
    });
  };

  cut = () => {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    if (editor.hasMultipleCursors()) {
      const selectionList = editor.getSelections();
      const newRingList = [];
      editor.transact(() => {
        selectionList.forEach((selection, i) => {
          const text = selection.getText();
          newRingList.push(text);
          if (text !== '') {
            selection.delete();
          }
        });
      });
      this._data.ringList = newRingList;
    } else {
      const selectedText = editor.getSelectedText();
      if (selectedText !== '') {
        this._data.ringList = [selectedText];
        editor.delete();
      }
    }
  };

  yank = () => {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    const {ringList} = this._data;

    if (ringList.length === 0) {
      return;
    }

    if (ringList.length === 1) {
      const ring = ringList[0];
      if (ring === '') {
        return;
      }
      editor.insertText(ring);
    } else if (editor.hasMultipleCursors()) {
      const currentCursorList = editor.getCursors();
      if (currentCursorList.length !== ringList.length) {
        // TODO: not sure if there's still value in yanking here
        return;
      }

      const selectionList = editor.getSelections();
      editor.transact(() => {
        selectionList.forEach((selection, i) => {
          selection.insertText(ringList[i]);
        });
      });
    } else {
      // Single cursor, multiple ring contents
      const rangeList = [];
      editor.transact(() => {
        ringList.forEach((text, i) => {
          editor.insertText(text);
          const newPoint = editor.getCursorScreenPosition();

          rangeList.push(new Range(newPoint, newPoint));
          if (i !== ringList.length - 1) {
            editor.insertText('\n');
          }
        });
        // This moves the cursor to the end of all selections
        rangeList.forEach(range => editor.addSelectionForScreenRange(range));
      });
    }
  };

  serialize = () => {
    return JSON.stringify(this._data);
  };
}

export default new SimpleKillRing();
