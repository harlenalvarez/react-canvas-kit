export const SpecialKeys = {
  Control: 1 << 0,
  Alt: 1 << 1,
  Shift: 1 << 2,
  Space: 1 << 3,
  Tab: 1 << 4,
}

class KeyboardEventContext {
  keys = 0;

  get Space() {
    return Boolean(this.keys & SpecialKeys.Space);
  }

  /**
   * 
   * @param kv on keydown add the key, only special keys will be registered
   */
  addKey = (kv: KeyboardEvent) => {
    if (!(kv.key in SpecialKeys) && !(kv.code in SpecialKeys)) return;
    const key = kv.code === 'Space' ? kv.code : kv.key as keyof typeof SpecialKeys
    if (this.keys & SpecialKeys[key]) return;
    this.keys |= SpecialKeys[key];
  }

  /**
   * 
   * @param kv on keyup remove the key, only special keys will be removed
   */
  removeKey = (kv: KeyboardEvent) => {
    if (!(kv.key in SpecialKeys) && !(kv.code in SpecialKeys)) return;
    const key = kv.code === 'Space' ? kv.code : kv.key as keyof typeof SpecialKeys
    if (!(this.keys & SpecialKeys[key])) return;
    this.keys ^= SpecialKeys[key];
  }
}

const keyboardEventContext = new KeyboardEventContext();
export { keyboardEventContext };
