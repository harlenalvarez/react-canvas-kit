import { fireEvent, render } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, test } from 'vitest';
import { SpecialKeys, keyboardEventContext } from '../../lib/utils';

const KeyListener = () => {
  useEffect(() => {
    document.addEventListener('keydown', keyboardEventContext.addKey);
    document.addEventListener('keyup', keyboardEventContext.removeKey);
    return () => {
      document.removeEventListener('keydown', keyboardEventContext.addKey);
      document.removeEventListener('keyup', keyboardEventContext.removeKey);
      keyboardEventContext.keys = 0;
    }
  }, [])

  return <div>Test</div>
}

describe('Keyboard events test', () => {
  test('Should record Ctrl Key', () => {
    render(<KeyListener />);
    fireEvent.keyDown(document, { key: 'Control' });
    expect(keyboardEventContext.keys & SpecialKeys.Control).toBeTruthy();
    fireEvent.keyUp(document, { key: 'Control' });
    expect(keyboardEventContext.keys & SpecialKeys.Control).toBeFalsy();
  })

  test('Should record Alt Key', () => {
    render(<KeyListener />);
    fireEvent.keyDown(document, { key: 'Alt' });
    expect(keyboardEventContext.keys & SpecialKeys.Alt).toBeTruthy();
    fireEvent.keyUp(document, { key: 'Alt' });
    expect(keyboardEventContext.keys & SpecialKeys.Alt).toBeFalsy();
  })

  test('Should record Space key', () => {
    render(<KeyListener />);
    fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    expect(keyboardEventContext.keys & SpecialKeys.Space).toBeTruthy();
    fireEvent.keyUp(document, { key: ' ', code: 'Space' });
    expect(keyboardEventContext.keys & SpecialKeys.Space).toBeFalsy();
  })

  test('Should record ctrl and alt key', () => {
    render(<KeyListener />);
    fireEvent.keyDown(document, { key: 'Control' });
    fireEvent.keyDown(document, { key: 'Alt' });
    expect(keyboardEventContext.keys & SpecialKeys.Control).toBeTruthy();
    expect(keyboardEventContext.keys & SpecialKeys.Alt).toBeTruthy();
    fireEvent.keyUp(document, { key: 'Control' });
    fireEvent.keyUp(document, { key: 'Alt' });
  })
})