export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
export function assume(condition, message) {
  if (!condition) {
    console.warn(message);
  }
  return condition;
}
export function getCaseInsensitiveFile(zip, filePath) {
  const normalized = filePath.replace(/[\/\\]/g, `[/\\\\]`);
  const files = zip.file(new RegExp(normalized, "i"));
  if (files && files.length > 1) {
    const requestName = filePath.split("/").pop().toLowerCase();
    for (let i = 0; i < files.length; i++) {
      const responseName = files[i].name.split("/").pop().toLowerCase();
      if (responseName == requestName) {
        return files[i];
      }
    }
    return zip.file(new RegExp(`^${normalized}$`, "i"))[0] ?? null;
  }
  return files[0] ?? null;
}
export function num(str) {
  return str == null ? null : Number(str);
}
export function px(size) {
  return `${size}px`;
}
export function relative(size) {
  if (size === 0)
    return "100%";
  return `calc(100% + ${size}px)`;
}
export function toBool(str) {
  str = str.toLowerCase();
  assume(str === "0" || str === "1" || str === "false" || str === "true", `Expected bool value to be "0" or "1", but it was "${str}".`);
  if (!isNaN(parseInt(str))) {
    return parseInt(str) > 0;
  }
  return str === "1" || str === "true";
}
let id = 0;
export function getId() {
  return id++;
}
export function ensureVmInt(num2) {
  return Math.floor(num2);
}
export function clamp(num2, min, max) {
  return Math.max(min, Math.min(num2, max));
}
export function circular(num2, min, max) {
  assert(min < max, "illegal circular parameter.");
  while (num2 < min) {
    num2 = max + num2;
  }
  while (num2 > max) {
    num2 = num2 - max;
  }
  assert(num2 >= min && num2 <= max, "stupid in math, boss?");
  return num2;
}
export function normalizeDomId(id2) {
  return id2.replace(/[^a-zA-Z0-9]/g, "-");
}
export function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
export function integerToTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(Math.abs(Math.floor(seconds % 60))).padStart(2, "0");
  return `${mins}:${secs}`;
}
export function findLast(arr, predicate) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const value = arr[i];
    if (predicate(value)) {
      return value;
    }
  }
}
export function getUrlQuery(location, variable) {
  return new URL(location.href).searchParams.get(variable);
}
export function debounce(func, timeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}
export const throttle = (fn, wait = 300) => {
  let inThrottle, lastFn, lastTime;
  return function() {
    const context = this, args = arguments;
    if (!inThrottle) {
      inThrottle = true;
      fn.apply(context, args);
      lastTime = Date.now();
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
};
export function unimplemented(value) {
  return value;
}
export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}
export class Emitter {
  constructor() {
    this._cbs = {};
  }
  on(event, cb) {
    if (this._cbs[event] == null) {
      this._cbs[event] = [];
    }
    this._cbs[event].push(cb);
    return () => {
      this._cbs[event] = this._cbs[event].filter((c) => c !== cb);
    };
  }
  off(event, cb) {
    if (this._cbs[event] == null) {
      return;
    }
    const cbs = this._cbs[event];
    const index = cbs.indexOf(cb, 0);
    if (index > -1) {
      cbs.splice(index, 1);
    }
  }
  trigger(event, ...args) {
    const subscriptions = this._cbs[event];
    if (subscriptions == null) {
      return;
    }
    for (const cb of subscriptions) {
      cb(...args);
    }
  }
}
