if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue, shared) {
  "use strict";
  const UNI_SSR = "__uniSSR";
  const UNI_SSR_DATA = "data";
  const UNI_SSR_GLOBAL_DATA = "globalData";
  function getSSRDataType() {
    return vue.getCurrentInstance() ? UNI_SSR_DATA : UNI_SSR_GLOBAL_DATA;
  }
  function assertKey(key, shallow = false) {
    if (!key) {
      throw new Error(`${shallow ? "shallowSsrRef" : "ssrRef"}: You must provide a key.`);
    }
  }
  const ssrClientRef = (value, key, shallow = false) => {
    const valRef = shallow ? vue.shallowRef(value) : vue.ref(value);
    if (typeof window === "undefined") {
      return valRef;
    }
    const __uniSSR = window[UNI_SSR];
    if (!__uniSSR) {
      return valRef;
    }
    const type = getSSRDataType();
    assertKey(key, shallow);
    if (shared.hasOwn(__uniSSR[type], key)) {
      valRef.value = __uniSSR[type][key];
      if (type === UNI_SSR_DATA) {
        delete __uniSSR[type][key];
      }
    }
    return valRef;
  };
  const ssrRef = (value, key) => {
    return ssrClientRef(value, key);
  };
  const shallowSsrRef = (value, key) => {
    return ssrClientRef(value, key, true);
  };
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return shared.isString(component) ? easycom : component;
  }
  const isObject$2 = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = /* @__PURE__ */ Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse$1(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse$1(format2, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format2.length) {
      let char = format2[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format2[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format2[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index = 0;
    const mode = Array.isArray(values) ? "list" : isObject$2(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty$2 = Object.prototype.hasOwnProperty;
  const hasOwn$2 = (val, key) => hasOwnProperty$2.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages2) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages2 && messages2[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    const lang = startsWith(locale, [LOCALE_EN, LOCALE_FR, LOCALE_ES]);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages: messages2, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages2 || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn$2(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn$2(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n2) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n2.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n2.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages2 = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages2] = [
        messages2,
        locale
      ];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n2 = new I18n({
      locale,
      fallbackLocale,
      messages: messages2,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n2.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n2);
            }
          }
          return i18n2.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n: i18n2,
      f(message, values, delimiters) {
        return i18n2.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n2.add(locale2, message, override);
      },
      watch(fn) {
        return i18n2.watchLocale(fn);
      },
      getLocale() {
        return i18n2.getLocale();
      },
      setLocale(newLocale) {
        return i18n2.setLocale(newLocale);
      }
    };
  }
  const pages = [
    {
      path: "pages/list/list",
      style: {
        navigationStyle: "custom"
      }
    },
    {
      path: "pages/grid/grid",
      style: {
        navigationStyle: "custom"
      }
    },
    {
      path: "pages/list/search/search",
      style: {
        navigationBarTitleText: "搜索"
      }
    },
    {
      path: "pages/list/detail",
      style: {
        "app-plus": {
          titleNView: {
            buttons: [
              {
                type: "share"
              }
            ],
            type: "transparent"
          }
        },
        h5: {
          titleNView: {
            type: "transparent"
          }
        },
        navigationBarTitleText: "文章详情"
      }
    },
    {
      path: "pages/ucenter/ucenter",
      style: {
        navigationStyle: "custom"
      }
    },
    {
      path: "pages/uni-agree/uni-agree",
      style: {
        navigationStyle: "custom",
        "app-plus": {
          popGesture: "none"
        }
      }
    },
    {
      path: "pages/ucenter/settings/settings",
      style: {
        navigationBarTitleText: "设置"
      }
    },
    {
      path: "pages/ucenter/read-news-log/read-news-log",
      style: {
        navigationBarTitleText: "阅读记录",
        enablePullDownRefresh: true
      }
    },
    {
      path: "pages/ucenter/about/about",
      style: {
        navigationBarTitleText: "关于",
        "app-plus": {
          titleNView: {
            buttons: [
              {
                type: "share"
              }
            ]
          }
        }
      }
    },
    {
      path: "uni_modules/uni-upgrade-center-app/pages/upgrade-popup",
      style: {
        disableScroll: true,
        "app-plus": {
          backgroundColorTop: "transparent",
          background: "transparent",
          titleNView: false,
          scrollIndicator: false,
          popGesture: "none",
          animationType: "fade-in",
          animationDuration: 200
        }
      }
    },
    {
      path: "pages/ucenter/invite/invite",
      style: {
        navigationStyle: "custom",
        enablePullDownRefresh: false
      }
    }
  ];
  const subPackages = [
    {
      root: "uni_modules/uni-feedback",
      pages: [
        {
          path: "pages/opendb-feedback/opendb-feedback",
          style: {
            navigationBarTitleText: "意见反馈",
            enablePullDownRefresh: false
          }
        }
      ]
    },
    {
      root: "uni_modules/uni-id-pages/pages",
      pages: [
        {
          path: "userinfo/userinfo",
          style: {
            navigationBarTitleText: "个人资料"
          }
        },
        {
          path: "login/login-withpwd"
        },
        {
          path: "login/login-withoutpwd"
        },
        {
          path: "userinfo/deactivate/deactivate",
          style: {
            navigationBarTitleText: "注销账号"
          }
        },
        {
          path: "userinfo/bind-mobile/bind-mobile",
          style: {
            navigationBarTitleText: "绑定手机号码"
          }
        },
        {
          path: "login/login-smscode",
          style: {
            navigationBarTitleText: "手机验证码登录"
          }
        },
        {
          path: "register/register",
          style: {
            navigationBarTitleText: "注册"
          }
        },
        {
          path: "retrieve/retrieve",
          style: {
            navigationBarTitleText: "重置密码"
          }
        },
        {
          path: "common/webview/webview",
          style: {
            enablePullDownRefresh: false,
            navigationBarTitleText: ""
          }
        },
        {
          path: "userinfo/change_pwd/change_pwd",
          style: {
            enablePullDownRefresh: false,
            navigationBarTitleText: "修改密码"
          }
        },
        {
          path: "register/register-by-email",
          style: {
            navigationBarTitleText: "邮箱验证码注册"
          }
        },
        {
          path: "retrieve/retrieve-by-email",
          style: {
            navigationBarTitleText: "通过邮箱重置密码"
          }
        },
        {
          path: "userinfo/set-pwd/set-pwd",
          style: {
            enablePullDownRefresh: false,
            navigationBarTitleText: "设置密码"
          }
        }
      ]
    }
  ];
  const globalStyle = {
    navigationBarTextStyle: "black",
    navigationBarTitleText: "uni-starter",
    navigationBarBackgroundColor: "#FFFFFF",
    backgroundColor: "#F8F8F8",
    enablePullDownRefresh: false,
    rpxCalcMaxDeviceWidth: 375,
    rpxCalcBaseDeviceWidth: 375
  };
  const condition = {
    list: [
      {
        path: "pages/list/detail"
      },
      {
        path: "pages/list/list"
      },
      {
        path: "pages/ucenter/settings/settings"
      }
    ],
    current: 1
  };
  const tabBar = {
    color: "#7A7E83",
    selectedColor: "#007AFF",
    borderStyle: "black",
    backgroundColor: "#FFFFFF",
    list: [
      {
        pagePath: "pages/list/list",
        iconPath: "static/tabbar/list.png",
        selectedIconPath: "static/tabbar/list_active.png",
        text: "列表"
      },
      {
        pagePath: "pages/grid/grid",
        iconPath: "static/tabbar/grid.png",
        selectedIconPath: "static/tabbar/grid_active.png",
        text: "发现"
      },
      {
        pagePath: "pages/ucenter/ucenter",
        iconPath: "static/tabbar/me.png",
        selectedIconPath: "static/tabbar/me_active.png",
        text: "我的"
      }
    ]
  };
  const uniIdRouter = {
    loginPage: "uni_modules/uni-id-pages/pages/login/login-withoutpwd",
    needLogin: [
      "/uni_modules/uni-id-pages/pages/userinfo/userinfo"
    ],
    resToLogin: true
  };
  const pagesJson = {
    pages,
    subPackages,
    globalStyle,
    condition,
    tabBar,
    uniIdRouter
  };
  function n$1(e2) {
    return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
  }
  function s$1(e2, t2, n2) {
    return e2(n2 = { path: t2, exports: {}, require: function(e3, t3) {
      return function() {
        throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
      }(null == t3 && n2.path);
    } }, n2.exports), n2.exports;
  }
  var r$1 = s$1(function(e2, t2) {
    var n2;
    e2.exports = (n2 = n2 || function(e3, t3) {
      var n3 = Object.create || function() {
        function e4() {
        }
        return function(t4) {
          var n4;
          return e4.prototype = t4, n4 = new e4(), e4.prototype = null, n4;
        };
      }(), s2 = {}, r2 = s2.lib = {}, i2 = r2.Base = { extend: function(e4) {
        var t4 = n3(this);
        return e4 && t4.mixIn(e4), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
          t4.$super.init.apply(this, arguments);
        }), t4.init.prototype = t4, t4.$super = this, t4;
      }, create: function() {
        var e4 = this.extend();
        return e4.init.apply(e4, arguments), e4;
      }, init: function() {
      }, mixIn: function(e4) {
        for (var t4 in e4)
          e4.hasOwnProperty(t4) && (this[t4] = e4[t4]);
        e4.hasOwnProperty("toString") && (this.toString = e4.toString);
      }, clone: function() {
        return this.init.prototype.extend(this);
      } }, o2 = r2.WordArray = i2.extend({ init: function(e4, n4) {
        e4 = this.words = e4 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e4.length;
      }, toString: function(e4) {
        return (e4 || c2).stringify(this);
      }, concat: function(e4) {
        var t4 = this.words, n4 = e4.words, s3 = this.sigBytes, r3 = e4.sigBytes;
        if (this.clamp(), s3 % 4)
          for (var i3 = 0; i3 < r3; i3++) {
            var o3 = n4[i3 >>> 2] >>> 24 - i3 % 4 * 8 & 255;
            t4[s3 + i3 >>> 2] |= o3 << 24 - (s3 + i3) % 4 * 8;
          }
        else
          for (i3 = 0; i3 < r3; i3 += 4)
            t4[s3 + i3 >>> 2] = n4[i3 >>> 2];
        return this.sigBytes += r3, this;
      }, clamp: function() {
        var t4 = this.words, n4 = this.sigBytes;
        t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e3.ceil(n4 / 4);
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4.words = this.words.slice(0), e4;
      }, random: function(t4) {
        for (var n4, s3 = [], r3 = function(t5) {
          t5 = t5;
          var n5 = 987654321, s4 = 4294967295;
          return function() {
            var r4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
            return r4 /= 4294967296, (r4 += 0.5) * (e3.random() > 0.5 ? 1 : -1);
          };
        }, i3 = 0; i3 < t4; i3 += 4) {
          var a3 = r3(4294967296 * (n4 || e3.random()));
          n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
        }
        return new o2.init(s3, t4);
      } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e4) {
        for (var t4 = e4.words, n4 = e4.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push((i3 >>> 4).toString(16)), s3.push((15 & i3).toString(16));
        }
        return s3.join("");
      }, parse: function(e4) {
        for (var t4 = e4.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
          n4[s3 >>> 3] |= parseInt(e4.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
        return new o2.init(n4, t4 / 2);
      } }, u2 = a2.Latin1 = { stringify: function(e4) {
        for (var t4 = e4.words, n4 = e4.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push(String.fromCharCode(i3));
        }
        return s3.join("");
      }, parse: function(e4) {
        for (var t4 = e4.length, n4 = [], s3 = 0; s3 < t4; s3++)
          n4[s3 >>> 2] |= (255 & e4.charCodeAt(s3)) << 24 - s3 % 4 * 8;
        return new o2.init(n4, t4);
      } }, h2 = a2.Utf8 = { stringify: function(e4) {
        try {
          return decodeURIComponent(escape(u2.stringify(e4)));
        } catch (e5) {
          throw new Error("Malformed UTF-8 data");
        }
      }, parse: function(e4) {
        return u2.parse(unescape(encodeURIComponent(e4)));
      } }, l2 = r2.BufferedBlockAlgorithm = i2.extend({ reset: function() {
        this._data = new o2.init(), this._nDataBytes = 0;
      }, _append: function(e4) {
        "string" == typeof e4 && (e4 = h2.parse(e4)), this._data.concat(e4), this._nDataBytes += e4.sigBytes;
      }, _process: function(t4) {
        var n4 = this._data, s3 = n4.words, r3 = n4.sigBytes, i3 = this.blockSize, a3 = r3 / (4 * i3), c3 = (a3 = t4 ? e3.ceil(a3) : e3.max((0 | a3) - this._minBufferSize, 0)) * i3, u3 = e3.min(4 * c3, r3);
        if (c3) {
          for (var h3 = 0; h3 < c3; h3 += i3)
            this._doProcessBlock(s3, h3);
          var l3 = s3.splice(0, c3);
          n4.sigBytes -= u3;
        }
        return new o2.init(l3, u3);
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4._data = this._data.clone(), e4;
      }, _minBufferSize: 0 });
      r2.Hasher = l2.extend({ cfg: i2.extend(), init: function(e4) {
        this.cfg = this.cfg.extend(e4), this.reset();
      }, reset: function() {
        l2.reset.call(this), this._doReset();
      }, update: function(e4) {
        return this._append(e4), this._process(), this;
      }, finalize: function(e4) {
        return e4 && this._append(e4), this._doFinalize();
      }, blockSize: 16, _createHelper: function(e4) {
        return function(t4, n4) {
          return new e4.init(n4).finalize(t4);
        };
      }, _createHmacHelper: function(e4) {
        return function(t4, n4) {
          return new d2.HMAC.init(e4, n4).finalize(t4);
        };
      } });
      var d2 = s2.algo = {};
      return s2;
    }(Math), n2);
  }), i$1 = r$1, o$1 = (s$1(function(e2, t2) {
    var n2;
    e2.exports = (n2 = i$1, function(e3) {
      var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [];
      !function() {
        for (var t4 = 0; t4 < 64; t4++)
          a2[t4] = 4294967296 * e3.abs(e3.sin(t4 + 1)) | 0;
      }();
      var c2 = o2.MD5 = i2.extend({ _doReset: function() {
        this._hash = new r2.init([1732584193, 4023233417, 2562383102, 271733878]);
      }, _doProcessBlock: function(e4, t4) {
        for (var n3 = 0; n3 < 16; n3++) {
          var s3 = t4 + n3, r3 = e4[s3];
          e4[s3] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8);
        }
        var i3 = this._hash.words, o3 = e4[t4 + 0], c3 = e4[t4 + 1], p2 = e4[t4 + 2], f2 = e4[t4 + 3], g2 = e4[t4 + 4], m2 = e4[t4 + 5], y2 = e4[t4 + 6], _2 = e4[t4 + 7], w2 = e4[t4 + 8], v2 = e4[t4 + 9], I2 = e4[t4 + 10], S2 = e4[t4 + 11], b2 = e4[t4 + 12], k2 = e4[t4 + 13], C2 = e4[t4 + 14], T2 = e4[t4 + 15], P2 = i3[0], A2 = i3[1], E2 = i3[2], O = i3[3];
        P2 = u2(P2, A2, E2, O, o3, 7, a2[0]), O = u2(O, P2, A2, E2, c3, 12, a2[1]), E2 = u2(E2, O, P2, A2, p2, 17, a2[2]), A2 = u2(A2, E2, O, P2, f2, 22, a2[3]), P2 = u2(P2, A2, E2, O, g2, 7, a2[4]), O = u2(O, P2, A2, E2, m2, 12, a2[5]), E2 = u2(E2, O, P2, A2, y2, 17, a2[6]), A2 = u2(A2, E2, O, P2, _2, 22, a2[7]), P2 = u2(P2, A2, E2, O, w2, 7, a2[8]), O = u2(O, P2, A2, E2, v2, 12, a2[9]), E2 = u2(E2, O, P2, A2, I2, 17, a2[10]), A2 = u2(A2, E2, O, P2, S2, 22, a2[11]), P2 = u2(P2, A2, E2, O, b2, 7, a2[12]), O = u2(O, P2, A2, E2, k2, 12, a2[13]), E2 = u2(E2, O, P2, A2, C2, 17, a2[14]), P2 = h2(P2, A2 = u2(A2, E2, O, P2, T2, 22, a2[15]), E2, O, c3, 5, a2[16]), O = h2(O, P2, A2, E2, y2, 9, a2[17]), E2 = h2(E2, O, P2, A2, S2, 14, a2[18]), A2 = h2(A2, E2, O, P2, o3, 20, a2[19]), P2 = h2(P2, A2, E2, O, m2, 5, a2[20]), O = h2(O, P2, A2, E2, I2, 9, a2[21]), E2 = h2(E2, O, P2, A2, T2, 14, a2[22]), A2 = h2(A2, E2, O, P2, g2, 20, a2[23]), P2 = h2(P2, A2, E2, O, v2, 5, a2[24]), O = h2(O, P2, A2, E2, C2, 9, a2[25]), E2 = h2(E2, O, P2, A2, f2, 14, a2[26]), A2 = h2(A2, E2, O, P2, w2, 20, a2[27]), P2 = h2(P2, A2, E2, O, k2, 5, a2[28]), O = h2(O, P2, A2, E2, p2, 9, a2[29]), E2 = h2(E2, O, P2, A2, _2, 14, a2[30]), P2 = l2(P2, A2 = h2(A2, E2, O, P2, b2, 20, a2[31]), E2, O, m2, 4, a2[32]), O = l2(O, P2, A2, E2, w2, 11, a2[33]), E2 = l2(E2, O, P2, A2, S2, 16, a2[34]), A2 = l2(A2, E2, O, P2, C2, 23, a2[35]), P2 = l2(P2, A2, E2, O, c3, 4, a2[36]), O = l2(O, P2, A2, E2, g2, 11, a2[37]), E2 = l2(E2, O, P2, A2, _2, 16, a2[38]), A2 = l2(A2, E2, O, P2, I2, 23, a2[39]), P2 = l2(P2, A2, E2, O, k2, 4, a2[40]), O = l2(O, P2, A2, E2, o3, 11, a2[41]), E2 = l2(E2, O, P2, A2, f2, 16, a2[42]), A2 = l2(A2, E2, O, P2, y2, 23, a2[43]), P2 = l2(P2, A2, E2, O, v2, 4, a2[44]), O = l2(O, P2, A2, E2, b2, 11, a2[45]), E2 = l2(E2, O, P2, A2, T2, 16, a2[46]), P2 = d2(P2, A2 = l2(A2, E2, O, P2, p2, 23, a2[47]), E2, O, o3, 6, a2[48]), O = d2(O, P2, A2, E2, _2, 10, a2[49]), E2 = d2(E2, O, P2, A2, C2, 15, a2[50]), A2 = d2(A2, E2, O, P2, m2, 21, a2[51]), P2 = d2(P2, A2, E2, O, b2, 6, a2[52]), O = d2(O, P2, A2, E2, f2, 10, a2[53]), E2 = d2(E2, O, P2, A2, I2, 15, a2[54]), A2 = d2(A2, E2, O, P2, c3, 21, a2[55]), P2 = d2(P2, A2, E2, O, w2, 6, a2[56]), O = d2(O, P2, A2, E2, T2, 10, a2[57]), E2 = d2(E2, O, P2, A2, y2, 15, a2[58]), A2 = d2(A2, E2, O, P2, k2, 21, a2[59]), P2 = d2(P2, A2, E2, O, g2, 6, a2[60]), O = d2(O, P2, A2, E2, S2, 10, a2[61]), E2 = d2(E2, O, P2, A2, p2, 15, a2[62]), A2 = d2(A2, E2, O, P2, v2, 21, a2[63]), i3[0] = i3[0] + P2 | 0, i3[1] = i3[1] + A2 | 0, i3[2] = i3[2] + E2 | 0, i3[3] = i3[3] + O | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
        n3[r3 >>> 5] |= 128 << 24 - r3 % 32;
        var i3 = e3.floor(s3 / 4294967296), o3 = s3;
        n3[15 + (r3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), n3[14 + (r3 + 64 >>> 9 << 4)] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
        for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
          var h3 = c3[u3];
          c3[u3] = 16711935 & (h3 << 8 | h3 >>> 24) | 4278255360 & (h3 << 24 | h3 >>> 8);
        }
        return a3;
      }, clone: function() {
        var e4 = i2.clone.call(this);
        return e4._hash = this._hash.clone(), e4;
      } });
      function u2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 & n3 | ~t4 & s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function h2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 & s3 | n3 & ~s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function l2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (t4 ^ n3 ^ s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function d2(e4, t4, n3, s3, r3, i3, o3) {
        var a3 = e4 + (n3 ^ (t4 | ~s3)) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      t3.MD5 = i2._createHelper(c2), t3.HmacMD5 = i2._createHmacHelper(c2);
    }(Math), n2.MD5);
  }), s$1(function(e2, t2) {
    var n2;
    e2.exports = (n2 = i$1, void function() {
      var e3 = n2, t3 = e3.lib.Base, s2 = e3.enc.Utf8;
      e3.algo.HMAC = t3.extend({ init: function(e4, t4) {
        e4 = this._hasher = new e4.init(), "string" == typeof t4 && (t4 = s2.parse(t4));
        var n3 = e4.blockSize, r2 = 4 * n3;
        t4.sigBytes > r2 && (t4 = e4.finalize(t4)), t4.clamp();
        for (var i2 = this._oKey = t4.clone(), o2 = this._iKey = t4.clone(), a2 = i2.words, c2 = o2.words, u2 = 0; u2 < n3; u2++)
          a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
        i2.sigBytes = o2.sigBytes = r2, this.reset();
      }, reset: function() {
        var e4 = this._hasher;
        e4.reset(), e4.update(this._iKey);
      }, update: function(e4) {
        return this._hasher.update(e4), this;
      }, finalize: function(e4) {
        var t4 = this._hasher, n3 = t4.finalize(e4);
        return t4.reset(), t4.finalize(this._oKey.clone().concat(n3));
      } });
    }());
  }), s$1(function(e2, t2) {
    e2.exports = i$1.HmacMD5;
  })), a$1 = s$1(function(e2, t2) {
    e2.exports = i$1.enc.Utf8;
  }), c$1 = s$1(function(e2, t2) {
    var n2;
    e2.exports = (n2 = i$1, function() {
      var e3 = n2, t3 = e3.lib.WordArray;
      function s2(e4, n3, s3) {
        for (var r2 = [], i2 = 0, o2 = 0; o2 < n3; o2++)
          if (o2 % 4) {
            var a2 = s3[e4.charCodeAt(o2 - 1)] << o2 % 4 * 2, c2 = s3[e4.charCodeAt(o2)] >>> 6 - o2 % 4 * 2;
            r2[i2 >>> 2] |= (a2 | c2) << 24 - i2 % 4 * 8, i2++;
          }
        return t3.create(r2, i2);
      }
      e3.enc.Base64 = { stringify: function(e4) {
        var t4 = e4.words, n3 = e4.sigBytes, s3 = this._map;
        e4.clamp();
        for (var r2 = [], i2 = 0; i2 < n3; i2 += 3)
          for (var o2 = (t4[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) << 16 | (t4[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255) << 8 | t4[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && i2 + 0.75 * a2 < n3; a2++)
            r2.push(s3.charAt(o2 >>> 6 * (3 - a2) & 63));
        var c2 = s3.charAt(64);
        if (c2)
          for (; r2.length % 4; )
            r2.push(c2);
        return r2.join("");
      }, parse: function(e4) {
        var t4 = e4.length, n3 = this._map, r2 = this._reverseMap;
        if (!r2) {
          r2 = this._reverseMap = [];
          for (var i2 = 0; i2 < n3.length; i2++)
            r2[n3.charCodeAt(i2)] = i2;
        }
        var o2 = n3.charAt(64);
        if (o2) {
          var a2 = e4.indexOf(o2);
          -1 !== a2 && (t4 = a2);
        }
        return s2(e4, t4, r2);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
    }(), n2.enc.Base64);
  });
  const u$1 = "FUNCTION", h$1 = "OBJECT", l$1 = "CLIENT_DB", d$1 = "pending", p$1 = "fullfilled", f$1 = "rejected";
  function g$1(e2) {
    return Object.prototype.toString.call(e2).slice(8, -1).toLowerCase();
  }
  function m$1(e2) {
    return "object" === g$1(e2);
  }
  function y(e2) {
    return "function" == typeof e2;
  }
  function _(e2) {
    return function() {
      try {
        return e2.apply(e2, arguments);
      } catch (e3) {
        console.error(e3);
      }
    };
  }
  const w = "REJECTED", v$1 = "NOT_PENDING";
  class I {
    constructor({ createPromise: e2, retryRule: t2 = w } = {}) {
      this.createPromise = e2, this.status = null, this.promise = null, this.retryRule = t2;
    }
    get needRetry() {
      if (!this.status)
        return true;
      switch (this.retryRule) {
        case w:
          return this.status === f$1;
        case v$1:
          return this.status !== d$1;
      }
    }
    exec() {
      return this.needRetry ? (this.status = d$1, this.promise = this.createPromise().then((e2) => (this.status = p$1, Promise.resolve(e2)), (e2) => (this.status = f$1, Promise.reject(e2))), this.promise) : this.promise;
    }
  }
  function S(e2) {
    return e2 && "string" == typeof e2 ? JSON.parse(e2) : e2;
  }
  const b$1 = true, k = "app", T = S([]), P = k, A = S('{\n    "address": [\n        "127.0.0.1",\n        "192.168.137.1",\n        "192.168.255.1",\n        "192.168.57.1",\n        "10.4.56.111"\n    ],\n    "debugPort": 9000,\n    "initialLaunchType": "local",\n    "servePort": 7000,\n    "skipFiles": [\n        "<node_internals>/**",\n        "G:/HBuilderX.3.7.11.20230427/HBuilderX/plugins/unicloud/**/*.js"\n    ]\n}\n'), E = S('[{"provider":"aliyun","spaceName":"homework","spaceId":"mp-16a0b2b2-8a81-4498-80ba-b02fdd4738ed","clientSecret":"CjoB+XvZ3EIkdHwPZ9j8NA==","endpoint":"https://api.next.bspapp.com"}]') || [];
  let x = "";
  try {
    x = "__UNI__441C0EA";
  } catch (e2) {
  }
  let R = {};
  function U(e2, t2 = {}) {
    var n2, s2;
    return n2 = R, s2 = e2, Object.prototype.hasOwnProperty.call(n2, s2) || (R[e2] = t2), R[e2];
  }
  R = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {};
  const L = ["invoke", "success", "fail", "complete"], N = U("_globalUniCloudInterceptor");
  function D(e2, t2) {
    N[e2] || (N[e2] = {}), m$1(t2) && Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e3, t3, n3) {
        let s2 = N[e3][t3];
        s2 || (s2 = N[e3][t3] = []), -1 === s2.indexOf(n3) && y(n3) && s2.push(n3);
      }(e2, n2, t2[n2]);
    });
  }
  function F(e2, t2) {
    N[e2] || (N[e2] = {}), m$1(t2) ? Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e3, t3, n3) {
        const s2 = N[e3][t3];
        if (!s2)
          return;
        const r2 = s2.indexOf(n3);
        r2 > -1 && s2.splice(r2, 1);
      }(e2, n2, t2[n2]);
    }) : delete N[e2];
  }
  function q(e2, t2) {
    return e2 && 0 !== e2.length ? e2.reduce((e3, n2) => e3.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
  }
  function M(e2, t2) {
    return N[e2] && N[e2][t2] || [];
  }
  function K(e2) {
    D("callObject", e2);
  }
  const j = U("_globalUniCloudListener"), B = "response", $ = "needLogin", W = "refreshToken", z = "clientdb", J = "cloudfunction", H = "cloudobject";
  function G(e2) {
    return j[e2] || (j[e2] = []), j[e2];
  }
  function V(e2, t2) {
    const n2 = G(e2);
    n2.includes(t2) || n2.push(t2);
  }
  function Q(e2, t2) {
    const n2 = G(e2), s2 = n2.indexOf(t2);
    -1 !== s2 && n2.splice(s2, 1);
  }
  function Y(e2, t2) {
    const n2 = G(e2);
    for (let e3 = 0; e3 < n2.length; e3++) {
      (0, n2[e3])(t2);
    }
  }
  let X, Z = false;
  function ee() {
    return X || (X = new Promise((e2) => {
      Z && e2(), function t2() {
        if ("function" == typeof getCurrentPages) {
          const t3 = getCurrentPages();
          t3 && t3[0] && (Z = true, e2());
        }
        Z || setTimeout(() => {
          t2();
        }, 30);
      }();
    }), X);
  }
  function te(e2) {
    const t2 = {};
    for (const n2 in e2) {
      const s2 = e2[n2];
      y(s2) && (t2[n2] = _(s2));
    }
    return t2;
  }
  class ne extends Error {
    constructor(e2) {
      super(e2.message), this.errMsg = e2.message || e2.errMsg || "unknown system error", this.code = this.errCode = e2.code || e2.errCode || "SYSTEM_ERROR", this.errSubject = this.subject = e2.subject || e2.errSubject, this.cause = e2.cause, this.requestId = e2.requestId;
    }
    toJson(e2 = 0) {
      if (!(e2 >= 10))
        return e2++, { errCode: this.errCode, errMsg: this.errMsg, errSubject: this.errSubject, cause: this.cause && this.cause.toJson ? this.cause.toJson(e2) : this.cause };
    }
  }
  var se = { request: (e2) => uni.request(e2), uploadFile: (e2) => uni.uploadFile(e2), setStorageSync: (e2, t2) => uni.setStorageSync(e2, t2), getStorageSync: (e2) => uni.getStorageSync(e2), removeStorageSync: (e2) => uni.removeStorageSync(e2), clearStorageSync: () => uni.clearStorageSync() };
  function re(e2) {
    return e2 && re(e2.__v_raw) || e2;
  }
  function ie() {
    return { token: se.getStorageSync("uni_id_token") || se.getStorageSync("uniIdToken"), tokenExpired: se.getStorageSync("uni_id_token_expired") };
  }
  function oe({ token: e2, tokenExpired: t2 } = {}) {
    e2 && se.setStorageSync("uni_id_token", e2), t2 && se.setStorageSync("uni_id_token_expired", t2);
  }
  let ae, ce;
  function ue() {
    return ae || (ae = uni.getSystemInfoSync()), ae;
  }
  function he() {
    let e2, t2;
    try {
      if (uni.getLaunchOptionsSync) {
        if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
          return;
        const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
        e2 = s2, t2 = n2;
      }
    } catch (e3) {
    }
    return { channel: e2, scene: t2 };
  }
  function le() {
    const e2 = uni.getLocale && uni.getLocale() || "en";
    if (ce)
      return { ...ce, locale: e2, LOCALE: e2 };
    const t2 = ue(), { deviceId: n2, osName: s2, uniPlatform: r2, appId: i2 } = t2, o2 = ["pixelRatio", "brand", "model", "system", "language", "version", "platform", "host", "SDKVersion", "swanNativeVersion", "app", "AppPlatform", "fontSizeSetting"];
    for (let e3 = 0; e3 < o2.length; e3++) {
      delete t2[o2[e3]];
    }
    return ce = { PLATFORM: r2, OS: s2, APPID: i2, DEVICEID: n2, ...he(), ...t2 }, { ...ce, locale: e2, LOCALE: e2 };
  }
  var de = { sign: function(e2, t2) {
    let n2 = "";
    return Object.keys(e2).sort().forEach(function(t3) {
      e2[t3] && (n2 = n2 + "&" + t3 + "=" + e2[t3]);
    }), n2 = n2.slice(1), o$1(n2, t2).toString();
  }, wrappedRequest: function(e2, t2) {
    return new Promise((n2, s2) => {
      t2(Object.assign(e2, { complete(e3) {
        e3 || (e3 = {});
        const t3 = e3.data && e3.data.header && e3.data.header["x-serverless-request-id"] || e3.header && e3.header["request-id"];
        if (!e3.statusCode || e3.statusCode >= 400)
          return s2(new ne({ code: "SYS_ERR", message: e3.errMsg || "request:fail", requestId: t3 }));
        const r2 = e3.data;
        if (r2.error)
          return s2(new ne({ code: r2.error.code, message: r2.error.message, requestId: t3 }));
        r2.result = r2.data, r2.requestId = t3, delete r2.data, n2(r2);
      } }));
    });
  }, toBase64: function(e2) {
    return c$1.stringify(a$1.parse(e2));
  } }, pe = { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" };
  const { t: fe } = initVueI18n({ "zh-Hans": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, "zh-Hant": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, en: pe, fr: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, es: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, ja: pe }, "zh-Hans");
  var ge = class {
    constructor(e2) {
      ["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e2, t2))
          throw new Error(fe("uniCloud.init.paramRequired", { param: t2 }));
      }), this.config = Object.assign({}, { endpoint: 0 === e2.spaceId.indexOf("mp-") ? "https://api.next.bspapp.com" : "https://api.bspapp.com" }, e2), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = se, this._getAccessTokenPromiseHub = new I({ createPromise: () => this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e3) => {
        if (!e3.result || !e3.result.accessToken)
          throw new ne({ code: "AUTH_FAILED", message: "获取accessToken失败" });
        this.setAccessToken(e3.result.accessToken);
      }), retryRule: v$1 });
    }
    get hasAccessToken() {
      return !!this.accessToken;
    }
    setAccessToken(e2) {
      this.accessToken = e2;
    }
    requestWrapped(e2) {
      return de.wrappedRequest(e2, this.adapter.request);
    }
    requestAuth(e2) {
      return this.requestWrapped(e2);
    }
    request(e2, t2) {
      return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e2) : this.requestWrapped(e2).catch((t3) => new Promise((e3, n2) => {
        !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e3();
      }).then(() => this.getAccessToken()).then(() => {
        const t4 = this.rebuildRequest(e2);
        return this.request(t4, true);
      })) : this.getAccessToken().then(() => {
        const t3 = this.rebuildRequest(e2);
        return this.request(t3, true);
      }));
    }
    rebuildRequest(e2) {
      const t2 = Object.assign({}, e2);
      return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = de.sign(t2.data, this.config.clientSecret), t2;
    }
    setupRequest(e2, t2) {
      const n2 = Object.assign({}, e2, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
    }
    getAccessToken() {
      return this._getAccessTokenPromiseHub.exec();
    }
    async authorize() {
      await this.getAccessToken();
    }
    callFunction(e2) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e2.name, functionArgs: e2.data || {} }) };
      return this.request(this.setupRequest(t2));
    }
    getOSSUploadOptionsFromPath(e2) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e2) };
      return this.request(this.setupRequest(t2));
    }
    uploadFileToOSS({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e3) {
          e3 && e3.statusCode < 400 ? o2(e3) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e3) {
          a2(new ne({ code: e3.code || "UPLOAD_FAILED", message: e3.message || e3.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e3) => {
          i2({ loaded: e3.totalBytesSent, total: e3.totalBytesExpectedToSend });
        });
      });
    }
    reportOSSUpload(e2) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e2) };
      return this.request(this.setupRequest(t2));
    }
    async uploadFile({ filePath: e2, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2, config: r2 }) {
      if ("string" !== g$1(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
      if (!(t2 = t2.trim()))
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      if (/:\/\//.test(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath不合法" });
      const i2 = r2 && r2.envType || this.config.envType, o2 = (await this.getOSSUploadOptionsFromPath({ env: i2, filename: t2 })).result, a2 = "https://" + o2.cdnDomain + "/" + o2.ossPath, { securityToken: c2, accessKeyId: u2, signature: h2, host: l2, ossPath: d2, id: p2, policy: f2, ossCallbackUrl: m2 } = o2, y2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: u2, Signature: h2, host: l2, id: p2, key: d2, policy: f2, success_action_status: 200 };
      if (c2 && (y2["x-oss-security-token"] = c2), m2) {
        const e3 = JSON.stringify({ callbackUrl: m2, callbackBody: JSON.stringify({ fileId: p2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
        y2.callback = de.toBase64(e3);
      }
      const _2 = { url: "https://" + o2.host, formData: y2, fileName: "file", name: "file", filePath: e2, fileType: n2 };
      if (await this.uploadFileToOSS(Object.assign({}, _2, { onUploadProgress: s2 })), m2)
        return { success: true, filePath: e2, fileID: a2 };
      if ((await this.reportOSSUpload({ id: p2 })).success)
        return { success: true, filePath: e2, fileID: a2 };
      throw new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" });
    }
    getTempFileURL({ fileList: e2 } = {}) {
      return new Promise((t2, n2) => {
        Array.isArray(e2) && 0 !== e2.length || n2(new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" })), t2({ fileList: e2.map((e3) => ({ fileID: e3, tempFileURL: e3 })) });
      });
    }
    async getFileInfo({ fileList: e2 } = {}) {
      if (!Array.isArray(e2) || 0 === e2.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e2.map((e3) => e3.split("?")[0]).join(",") }) };
      return { fileList: (await this.request(this.setupRequest(t2))).result };
    }
  };
  var me = { init(e2) {
    const t2 = new ge(e2), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  const ye = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
  var _e;
  !function(e2) {
    e2.local = "local", e2.none = "none", e2.session = "session";
  }(_e || (_e = {}));
  var we = function() {
  };
  const ve = () => {
    let e2;
    if (!Promise) {
      e2 = () => {
      }, e2.promise = {};
      const t3 = () => {
        throw new ne({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
      };
      return Object.defineProperty(e2.promise, "then", { get: t3 }), Object.defineProperty(e2.promise, "catch", { get: t3 }), e2;
    }
    const t2 = new Promise((t3, n2) => {
      e2 = (e3, s2) => e3 ? n2(e3) : t3(s2);
    });
    return e2.promise = t2, e2;
  };
  function Ie(e2) {
    return void 0 === e2;
  }
  function Se(e2) {
    return "[object Null]" === Object.prototype.toString.call(e2);
  }
  var be;
  function ke(e2) {
    const t2 = (n2 = e2, "[object Array]" === Object.prototype.toString.call(n2) ? e2 : [e2]);
    var n2;
    for (const e3 of t2) {
      const { isMatch: t3, genAdapter: n3, runtime: s2 } = e3;
      if (t3())
        return { adapter: n3(), runtime: s2 };
    }
  }
  !function(e2) {
    e2.WEB = "web", e2.WX_MP = "wx_mp";
  }(be || (be = {}));
  const Ce = { adapter: null, runtime: void 0 }, Te = ["anonymousUuidKey"];
  class Pe extends we {
    constructor() {
      super(), Ce.adapter.root.tcbObject || (Ce.adapter.root.tcbObject = {});
    }
    setItem(e2, t2) {
      Ce.adapter.root.tcbObject[e2] = t2;
    }
    getItem(e2) {
      return Ce.adapter.root.tcbObject[e2];
    }
    removeItem(e2) {
      delete Ce.adapter.root.tcbObject[e2];
    }
    clear() {
      delete Ce.adapter.root.tcbObject;
    }
  }
  function Ae(e2, t2) {
    switch (e2) {
      case "local":
        return t2.localStorage || new Pe();
      case "none":
        return new Pe();
      default:
        return t2.sessionStorage || new Pe();
    }
  }
  class Ee {
    constructor(e2) {
      if (!this._storage) {
        this._persistence = Ce.adapter.primaryStorage || e2.persistence, this._storage = Ae(this._persistence, Ce.adapter);
        const t2 = `access_token_${e2.env}`, n2 = `access_token_expire_${e2.env}`, s2 = `refresh_token_${e2.env}`, r2 = `anonymous_uuid_${e2.env}`, i2 = `login_type_${e2.env}`, o2 = `user_info_${e2.env}`;
        this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: r2, loginTypeKey: i2, userInfoKey: o2 };
      }
    }
    updatePersistence(e2) {
      if (e2 === this._persistence)
        return;
      const t2 = "local" === this._persistence;
      this._persistence = e2;
      const n2 = Ae(e2, Ce.adapter);
      for (const e3 in this.keys) {
        const s2 = this.keys[e3];
        if (t2 && Te.includes(e3))
          continue;
        const r2 = this._storage.getItem(s2);
        Ie(r2) || Se(r2) || (n2.setItem(s2, r2), this._storage.removeItem(s2));
      }
      this._storage = n2;
    }
    setStore(e2, t2, n2) {
      if (!this._storage)
        return;
      const s2 = { version: n2 || "localCachev1", content: t2 }, r2 = JSON.stringify(s2);
      try {
        this._storage.setItem(e2, r2);
      } catch (e3) {
        throw e3;
      }
    }
    getStore(e2, t2) {
      try {
        if (!this._storage)
          return;
      } catch (e3) {
        return "";
      }
      t2 = t2 || "localCachev1";
      const n2 = this._storage.getItem(e2);
      if (!n2)
        return "";
      if (n2.indexOf(t2) >= 0) {
        return JSON.parse(n2).content;
      }
      return "";
    }
    removeStore(e2) {
      this._storage.removeItem(e2);
    }
  }
  const Oe = {}, xe = {};
  function Re(e2) {
    return Oe[e2];
  }
  class Ue {
    constructor(e2, t2) {
      this.data = t2 || null, this.name = e2;
    }
  }
  class Le extends Ue {
    constructor(e2, t2) {
      super("error", { error: e2, data: t2 }), this.error = e2;
    }
  }
  const Ne = new class {
    constructor() {
      this._listeners = {};
    }
    on(e2, t2) {
      return function(e3, t3, n2) {
        n2[e3] = n2[e3] || [], n2[e3].push(t3);
      }(e2, t2, this._listeners), this;
    }
    off(e2, t2) {
      return function(e3, t3, n2) {
        if (n2 && n2[e3]) {
          const s2 = n2[e3].indexOf(t3);
          -1 !== s2 && n2[e3].splice(s2, 1);
        }
      }(e2, t2, this._listeners), this;
    }
    fire(e2, t2) {
      if (e2 instanceof Le)
        return console.error(e2.error), this;
      const n2 = "string" == typeof e2 ? new Ue(e2, t2 || {}) : e2;
      const s2 = n2.name;
      if (this._listens(s2)) {
        n2.target = this;
        const e3 = this._listeners[s2] ? [...this._listeners[s2]] : [];
        for (const t3 of e3)
          t3.call(this, n2);
      }
      return this;
    }
    _listens(e2) {
      return this._listeners[e2] && this._listeners[e2].length > 0;
    }
  }();
  function De(e2, t2) {
    Ne.on(e2, t2);
  }
  function Fe(e2, t2 = {}) {
    Ne.fire(e2, t2);
  }
  function qe(e2, t2) {
    Ne.off(e2, t2);
  }
  const Me = "loginStateChanged", Ke = "loginStateExpire", je = "loginTypeChanged", Be = "anonymousConverted", $e = "refreshAccessToken";
  var We;
  !function(e2) {
    e2.ANONYMOUS = "ANONYMOUS", e2.WECHAT = "WECHAT", e2.WECHAT_PUBLIC = "WECHAT-PUBLIC", e2.WECHAT_OPEN = "WECHAT-OPEN", e2.CUSTOM = "CUSTOM", e2.EMAIL = "EMAIL", e2.USERNAME = "USERNAME", e2.NULL = "NULL";
  }(We || (We = {}));
  const ze = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Je = { "X-SDK-Version": "1.3.5" };
  function He(e2, t2, n2) {
    const s2 = e2[t2];
    e2[t2] = function(t3) {
      const r2 = {}, i2 = {};
      n2.forEach((n3) => {
        const { data: s3, headers: o3 } = n3.call(e2, t3);
        Object.assign(r2, s3), Object.assign(i2, o3);
      });
      const o2 = t3.data;
      return o2 && (() => {
        var e3;
        if (e3 = o2, "[object FormData]" !== Object.prototype.toString.call(e3))
          t3.data = { ...o2, ...r2 };
        else
          for (const e4 in r2)
            o2.append(e4, r2[e4]);
      })(), t3.headers = { ...t3.headers || {}, ...i2 }, s2.call(e2, t3);
    };
  }
  function Ge() {
    const e2 = Math.random().toString(16).slice(2);
    return { data: { seqId: e2 }, headers: { ...Je, "x-seqid": e2 } };
  }
  class Ve {
    constructor(e2 = {}) {
      var t2;
      this.config = e2, this._reqClass = new Ce.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `请求在${this.config.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] }), this._cache = Re(this.config.env), this._localCache = (t2 = this.config.env, xe[t2]), He(this._reqClass, "post", [Ge]), He(this._reqClass, "upload", [Ge]), He(this._reqClass, "download", [Ge]);
    }
    async post(e2) {
      return await this._reqClass.post(e2);
    }
    async upload(e2) {
      return await this._reqClass.upload(e2);
    }
    async download(e2) {
      return await this._reqClass.download(e2);
    }
    async refreshAccessToken() {
      let e2, t2;
      this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
      try {
        e2 = await this._refreshAccessTokenPromise;
      } catch (e3) {
        t2 = e3;
      }
      if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
        throw t2;
      return e2;
    }
    async _refreshAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: r2 } = this._cache.keys;
      this._cache.removeStore(e2), this._cache.removeStore(t2);
      let i2 = this._cache.getStore(n2);
      if (!i2)
        throw new ne({ message: "未登录CloudBase" });
      const o2 = { refresh_token: i2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", o2);
      if (a2.data.code) {
        const { code: e3 } = a2.data;
        if ("SIGN_PARAM_INVALID" === e3 || "REFRESH_TOKEN_EXPIRED" === e3 || "INVALID_REFRESH_TOKEN" === e3) {
          if (this._cache.getStore(s2) === We.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e3) {
            const e4 = this._cache.getStore(r2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e4, refresh_token: t3 });
            return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
          }
          Fe(Ke), this._cache.removeStore(n2);
        }
        throw new ne({ code: a2.data.code, message: `刷新access token失败：${a2.data.code}` });
      }
      if (a2.data.access_token)
        return Fe($e), this._cache.setStore(e2, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
      a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
    }
    async getAccessToken() {
      const { accessTokenKey: e2, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
      if (!this._cache.getStore(n2))
        throw new ne({ message: "refresh token不存在，登录状态异常" });
      let s2 = this._cache.getStore(e2), r2 = this._cache.getStore(t2), i2 = true;
      return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, r2) && (i2 = false), (!s2 || !r2 || r2 < Date.now()) && i2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: r2 };
    }
    async request(e2, t2, n2) {
      const s2 = `x-tcb-trace_${this.config.env}`;
      let r2 = "application/x-www-form-urlencoded";
      const i2 = { action: e2, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
      if (-1 === ze.indexOf(e2)) {
        const { refreshTokenKey: e3 } = this._cache.keys;
        this._cache.getStore(e3) && (i2.access_token = (await this.getAccessToken()).accessToken);
      }
      let o2;
      if ("storage.uploadFile" === e2) {
        o2 = new FormData();
        for (let e3 in o2)
          o2.hasOwnProperty(e3) && void 0 !== o2[e3] && o2.append(e3, i2[e3]);
        r2 = "multipart/form-data";
      } else {
        r2 = "application/json", o2 = {};
        for (let e3 in i2)
          void 0 !== i2[e3] && (o2[e3] = i2[e3]);
      }
      let a2 = { headers: { "content-type": r2 } };
      n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
      const c2 = this._localCache.getStore(s2);
      c2 && (a2.headers["X-TCB-Trace"] = c2);
      const { parse: u2, inQuery: h2, search: l2 } = t2;
      let d2 = { env: this.config.env };
      u2 && (d2.parse = true), h2 && (d2 = { ...h2, ...d2 });
      let p2 = function(e3, t3, n3 = {}) {
        const s3 = /\?/.test(t3);
        let r3 = "";
        for (let e4 in n3)
          "" === r3 ? !s3 && (t3 += "?") : r3 += "&", r3 += `${e4}=${encodeURIComponent(n3[e4])}`;
        return /^http(s)?\:\/\//.test(t3 += r3) ? t3 : `${e3}${t3}`;
      }(ye, "//tcb-api.tencentcloudapi.com/web", d2);
      l2 && (p2 += l2);
      const f2 = await this.post({ url: p2, data: o2, ...a2 }), g2 = f2.header && f2.header["x-tcb-trace"];
      if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(f2.status) && 200 !== Number(f2.statusCode) || !f2.data)
        throw new ne({ code: "NETWORK_ERROR", message: "network request error" });
      return f2;
    }
    async send(e2, t2 = {}) {
      const n2 = await this.request(e2, t2, { onUploadProgress: t2.onUploadProgress });
      if ("ACCESS_TOKEN_EXPIRED" === n2.data.code && -1 === ze.indexOf(e2)) {
        await this.refreshAccessToken();
        const n3 = await this.request(e2, t2, { onUploadProgress: t2.onUploadProgress });
        if (n3.data.code)
          throw new ne({ code: n3.data.code, message: n3.data.message });
        return n3.data;
      }
      if (n2.data.code)
        throw new ne({ code: n2.data.code, message: n2.data.message });
      return n2.data;
    }
    setRefreshToken(e2) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e2);
    }
  }
  const Qe = {};
  function Ye(e2) {
    return Qe[e2];
  }
  class Xe {
    constructor(e2) {
      this.config = e2, this._cache = Re(e2.env), this._request = Ye(e2.env);
    }
    setRefreshToken(e2) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e2);
    }
    setAccessToken(e2, t2) {
      const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
      this._cache.setStore(n2, e2), this._cache.setStore(s2, t2);
    }
    async refreshUserInfo() {
      const { data: e2 } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e2), e2;
    }
    setLocalUserInfo(e2) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e2);
    }
  }
  class Ze {
    constructor(e2) {
      if (!e2)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._envId = e2, this._cache = Re(this._envId), this._request = Ye(this._envId), this.setUserInfo();
    }
    linkWithTicket(e2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be string" });
      return this._request.send("auth.linkWithTicket", { ticket: e2 });
    }
    linkWithRedirect(e2) {
      e2.signInWithRedirect();
    }
    updatePassword(e2, t2) {
      return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e2 });
    }
    updateEmail(e2) {
      return this._request.send("auth.updateEmail", { newEmail: e2 });
    }
    updateUsername(e2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      return this._request.send("auth.updateUsername", { username: e2 });
    }
    async getLinkedUidList() {
      const { data: e2 } = await this._request.send("auth.getLinkedUidList", {});
      let t2 = false;
      const { users: n2 } = e2;
      return n2.forEach((e3) => {
        e3.wxOpenId && e3.wxPublicId && (t2 = true);
      }), { users: n2, hasPrimaryUid: t2 };
    }
    setPrimaryUid(e2) {
      return this._request.send("auth.setPrimaryUid", { uid: e2 });
    }
    unlink(e2) {
      return this._request.send("auth.unlink", { platform: e2 });
    }
    async update(e2) {
      const { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 } = e2, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 });
      this.setLocalUserInfo(a2);
    }
    async refresh() {
      const { data: e2 } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e2), e2;
    }
    setUserInfo() {
      const { userInfoKey: e2 } = this._cache.keys, t2 = this._cache.getStore(e2);
      ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e3) => {
        this[e3] = t2[e3];
      }), this.location = { country: t2.country, province: t2.province, city: t2.city };
    }
    setLocalUserInfo(e2) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e2), this.setUserInfo();
    }
  }
  class et {
    constructor(e2) {
      if (!e2)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._cache = Re(e2);
      const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, r2 = this._cache.getStore(t2), i2 = this._cache.getStore(n2), o2 = this._cache.getStore(s2);
      this.credential = { refreshToken: r2, accessToken: i2, accessTokenExpire: o2 }, this.user = new Ze(e2);
    }
    get isAnonymousAuth() {
      return this.loginType === We.ANONYMOUS;
    }
    get isCustomAuth() {
      return this.loginType === We.CUSTOM;
    }
    get isWeixinAuth() {
      return this.loginType === We.WECHAT || this.loginType === We.WECHAT_OPEN || this.loginType === We.WECHAT_PUBLIC;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
  }
  class tt extends Xe {
    async signIn() {
      this._cache.updatePersistence("local");
      const { anonymousUuidKey: e2, refreshTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e2) || void 0, s2 = this._cache.getStore(t2) || void 0, r2 = await this._request.send("auth.signInAnonymously", { anonymous_uuid: n2, refresh_token: s2 });
      if (r2.uuid && r2.refresh_token) {
        this._setAnonymousUUID(r2.uuid), this.setRefreshToken(r2.refresh_token), await this._request.refreshAccessToken(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.ANONYMOUS, persistence: "local" });
        const e3 = new et(this.config.env);
        return await e3.user.refresh(), e3;
      }
      throw new ne({ message: "匿名登录失败" });
    }
    async linkAndRetrieveDataWithTicket(e2) {
      const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: r2, ticket: e2 });
      if (i2.refresh_token)
        return this._clearAnonymousUUID(), this.setRefreshToken(i2.refresh_token), await this._request.refreshAccessToken(), Fe(Be, { env: this.config.env }), Fe(je, { loginType: We.CUSTOM, persistence: "local" }), { credential: { refreshToken: i2.refresh_token } };
      throw new ne({ message: "匿名转化失败" });
    }
    _setAnonymousUUID(e2) {
      const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.setStore(t2, e2), this._cache.setStore(n2, We.ANONYMOUS);
    }
    _clearAnonymousUUID() {
      this._cache.removeStore(this._cache.keys.anonymousUuidKey);
    }
  }
  class nt extends Xe {
    async signIn(e2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be a string" });
      const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e2, refresh_token: this._cache.getStore(t2) || "" });
      if (n2.refresh_token)
        return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new et(this.config.env);
      throw new ne({ message: "自定义登录失败" });
    }
  }
  class st extends Xe {
    async signIn(e2, t2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "email must be a string" });
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e2, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token: i2, access_token_expire: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), i2 && o2 ? this.setAccessToken(i2, o2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.EMAIL, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `邮箱登录失败: ${s2.message}` }) : new ne({ message: "邮箱登录失败" });
    }
    async activate(e2) {
      return this._request.send("auth.activateEndUserMail", { token: e2 });
    }
    async resetPasswordWithToken(e2, t2) {
      return this._request.send("auth.resetPasswordWithToken", { token: e2, newPassword: t2 });
    }
  }
  class rt extends Xe {
    async signIn(e2, t2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: We.USERNAME, username: e2, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token_expire: i2, access_token: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), o2 && i2 ? this.setAccessToken(o2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.USERNAME, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `用户名密码登录失败: ${s2.message}` }) : new ne({ message: "用户名密码登录失败" });
    }
  }
  class it {
    constructor(e2) {
      this.config = e2, this._cache = Re(e2.env), this._request = Ye(e2.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), De(je, this._onLoginTypeChanged);
    }
    get currentUser() {
      const e2 = this.hasLoginState();
      return e2 && e2.user || null;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
    anonymousAuthProvider() {
      return new tt(this.config);
    }
    customAuthProvider() {
      return new nt(this.config);
    }
    emailAuthProvider() {
      return new st(this.config);
    }
    usernameAuthProvider() {
      return new rt(this.config);
    }
    async signInAnonymously() {
      return new tt(this.config).signIn();
    }
    async signInWithEmailAndPassword(e2, t2) {
      return new st(this.config).signIn(e2, t2);
    }
    signInWithUsernameAndPassword(e2, t2) {
      return new rt(this.config).signIn(e2, t2);
    }
    async linkAndRetrieveDataWithTicket(e2) {
      this._anonymousAuthProvider || (this._anonymousAuthProvider = new tt(this.config)), De(Be, this._onAnonymousConverted);
      return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e2);
    }
    async signOut() {
      if (this.loginType === We.ANONYMOUS)
        throw new ne({ message: "匿名用户不支持登出操作" });
      const { refreshTokenKey: e2, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e2);
      if (!s2)
        return;
      const r2 = await this._request.send("auth.logout", { refresh_token: s2 });
      return this._cache.removeStore(e2), this._cache.removeStore(t2), this._cache.removeStore(n2), Fe(Me), Fe(je, { env: this.config.env, loginType: We.NULL, persistence: this.config.persistence }), r2;
    }
    async signUpWithEmailAndPassword(e2, t2) {
      return this._request.send("auth.signUpWithEmailAndPassword", { email: e2, password: t2 });
    }
    async sendPasswordResetEmail(e2) {
      return this._request.send("auth.sendPasswordResetEmail", { email: e2 });
    }
    onLoginStateChanged(e2) {
      De(Me, () => {
        const t3 = this.hasLoginState();
        e2.call(this, t3);
      });
      const t2 = this.hasLoginState();
      e2.call(this, t2);
    }
    onLoginStateExpired(e2) {
      De(Ke, e2.bind(this));
    }
    onAccessTokenRefreshed(e2) {
      De($e, e2.bind(this));
    }
    onAnonymousConverted(e2) {
      De(Be, e2.bind(this));
    }
    onLoginTypeChanged(e2) {
      De(je, () => {
        const t2 = this.hasLoginState();
        e2.call(this, t2);
      });
    }
    async getAccessToken() {
      return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
    }
    hasLoginState() {
      const { refreshTokenKey: e2 } = this._cache.keys;
      return this._cache.getStore(e2) ? new et(this.config.env) : null;
    }
    async isUsernameRegistered(e2) {
      if ("string" != typeof e2)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e2 });
      return t2 && t2.isRegistered;
    }
    getLoginState() {
      return Promise.resolve(this.hasLoginState());
    }
    async signInWithTicket(e2) {
      return new nt(this.config).signIn(e2);
    }
    shouldRefreshAccessToken(e2) {
      this._request._shouldRefreshAccessTokenHook = e2.bind(this);
    }
    getUserInfo() {
      return this._request.send("auth.getUserInfo", {}).then((e2) => e2.code ? e2 : { ...e2.data, requestId: e2.seqId });
    }
    getAuthHeader() {
      const { refreshTokenKey: e2, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e2);
      return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
    }
    _onAnonymousConverted(e2) {
      const { env: t2 } = e2.data;
      t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
    }
    _onLoginTypeChanged(e2) {
      const { loginType: t2, persistence: n2, env: s2 } = e2.data;
      s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
    }
  }
  const ot = function(e2, t2) {
    t2 = t2 || ve();
    const n2 = Ye(this.config.env), { cloudPath: s2, filePath: r2, onUploadProgress: i2, fileType: o2 = "image" } = e2;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e3) => {
      const { data: { url: a2, authorization: c2, token: u2, fileId: h2, cosFileId: l2 }, requestId: d2 } = e3, p2 = { key: s2, signature: c2, "x-cos-meta-fileid": l2, success_action_status: "201", "x-cos-security-token": u2 };
      n2.upload({ url: a2, data: p2, file: r2, name: s2, fileType: o2, onUploadProgress: i2 }).then((e4) => {
        201 === e4.statusCode ? t2(null, { fileID: h2, requestId: d2 }) : t2(new ne({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e4.data}` }));
      }).catch((e4) => {
        t2(e4);
      });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, at = function(e2, t2) {
    t2 = t2 || ve();
    const n2 = Ye(this.config.env), { cloudPath: s2 } = e2;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e3) => {
      t2(null, e3);
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, ct = function({ fileList: e2 }, t2) {
    if (t2 = t2 || ve(), !e2 || !Array.isArray(e2))
      return { code: "INVALID_PARAM", message: "fileList必须是非空的数组" };
    for (let t3 of e2)
      if (!t3 || "string" != typeof t3)
        return { code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" };
    const n2 = { fileid_list: e2 };
    return Ye(this.config.env).send("storage.batchDeleteFile", n2).then((e3) => {
      e3.code ? t2(null, e3) : t2(null, { fileList: e3.data.delete_list, requestId: e3.requestId });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, ut = function({ fileList: e2 }, t2) {
    t2 = t2 || ve(), e2 && Array.isArray(e2) || t2(null, { code: "INVALID_PARAM", message: "fileList必须是非空的数组" });
    let n2 = [];
    for (let s3 of e2)
      "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是包含fileID和maxAge的对象" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是字符串" });
    const s2 = { file_list: n2 };
    return Ye(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e3) => {
      e3.code ? t2(null, e3) : t2(null, { fileList: e3.data.download_list, requestId: e3.requestId });
    }).catch((e3) => {
      t2(e3);
    }), t2.promise;
  }, ht = async function({ fileID: e2 }, t2) {
    const n2 = (await ut.call(this, { fileList: [{ fileID: e2, maxAge: 600 }] })).fileList[0];
    if ("SUCCESS" !== n2.code)
      return t2 ? t2(n2) : new Promise((e3) => {
        e3(n2);
      });
    const s2 = Ye(this.config.env);
    let r2 = n2.download_url;
    if (r2 = encodeURI(r2), !t2)
      return s2.download({ url: r2 });
    t2(await s2.download({ url: r2 }));
  }, lt = function({ name: e2, data: t2, query: n2, parse: s2, search: r2 }, i2) {
    const o2 = i2 || ve();
    let a2;
    try {
      a2 = t2 ? JSON.stringify(t2) : "";
    } catch (e3) {
      return Promise.reject(e3);
    }
    if (!e2)
      return Promise.reject(new ne({ code: "PARAM_ERROR", message: "函数名不能为空" }));
    const c2 = { inQuery: n2, parse: s2, search: r2, function_name: e2, request_data: a2 };
    return Ye(this.config.env).send("functions.invokeFunction", c2).then((e3) => {
      if (e3.code)
        o2(null, e3);
      else {
        let t3 = e3.data.response_data;
        if (s2)
          o2(null, { result: t3, requestId: e3.requestId });
        else
          try {
            t3 = JSON.parse(e3.data.response_data), o2(null, { result: t3, requestId: e3.requestId });
          } catch (e4) {
            o2(new ne({ message: "response data must be json" }));
          }
      }
      return o2.promise;
    }).catch((e3) => {
      o2(e3);
    }), o2.promise;
  }, dt = { timeout: 15e3, persistence: "session" }, pt = {};
  class ft {
    constructor(e2) {
      this.config = e2 || this.config, this.authObj = void 0;
    }
    init(e2) {
      switch (Ce.adapter || (this.requestClient = new Ce.adapter.reqClass({ timeout: e2.timeout || 5e3, timeoutMsg: `请求在${(e2.timeout || 5e3) / 1e3}s内未完成，已中断` })), this.config = { ...dt, ...e2 }, true) {
        case this.config.timeout > 6e5:
          console.warn("timeout大于可配置上限[10分钟]，已重置为上限数值"), this.config.timeout = 6e5;
          break;
        case this.config.timeout < 100:
          console.warn("timeout小于可配置下限[100ms]，已重置为下限数值"), this.config.timeout = 100;
      }
      return new ft(this.config);
    }
    auth({ persistence: e2 } = {}) {
      if (this.authObj)
        return this.authObj;
      const t2 = e2 || Ce.adapter.primaryStorage || dt.persistence;
      var n2;
      return t2 !== this.config.persistence && (this.config.persistence = t2), function(e3) {
        const { env: t3 } = e3;
        Oe[t3] = new Ee(e3), xe[t3] = new Ee({ ...e3, persistence: "local" });
      }(this.config), n2 = this.config, Qe[n2.env] = new Ve(n2), this.authObj = new it(this.config), this.authObj;
    }
    on(e2, t2) {
      return De.apply(this, [e2, t2]);
    }
    off(e2, t2) {
      return qe.apply(this, [e2, t2]);
    }
    callFunction(e2, t2) {
      return lt.apply(this, [e2, t2]);
    }
    deleteFile(e2, t2) {
      return ct.apply(this, [e2, t2]);
    }
    getTempFileURL(e2, t2) {
      return ut.apply(this, [e2, t2]);
    }
    downloadFile(e2, t2) {
      return ht.apply(this, [e2, t2]);
    }
    uploadFile(e2, t2) {
      return ot.apply(this, [e2, t2]);
    }
    getUploadMetadata(e2, t2) {
      return at.apply(this, [e2, t2]);
    }
    registerExtension(e2) {
      pt[e2.name] = e2;
    }
    async invokeExtension(e2, t2) {
      const n2 = pt[e2];
      if (!n2)
        throw new ne({ message: `扩展${e2} 必须先注册` });
      return await n2.invoke(t2, this);
    }
    useAdapters(e2) {
      const { adapter: t2, runtime: n2 } = ke(e2) || {};
      t2 && (Ce.adapter = t2), n2 && (Ce.runtime = n2);
    }
  }
  var gt = new ft();
  function mt(e2, t2, n2) {
    void 0 === n2 && (n2 = {});
    var s2 = /\?/.test(t2), r2 = "";
    for (var i2 in n2)
      "" === r2 ? !s2 && (t2 += "?") : r2 += "&", r2 += i2 + "=" + encodeURIComponent(n2[i2]);
    return /^http(s)?:\/\//.test(t2 += r2) ? t2 : "" + e2 + t2;
  }
  class yt {
    post(e2) {
      const { url: t2, data: n2, headers: s2 } = e2;
      return new Promise((e3, r2) => {
        se.request({ url: mt("https:", t2), data: n2, method: "POST", header: s2, success(t3) {
          e3(t3);
        }, fail(e4) {
          r2(e4);
        } });
      });
    }
    upload(e2) {
      return new Promise((t2, n2) => {
        const { url: s2, file: r2, data: i2, headers: o2, fileType: a2 } = e2, c2 = se.uploadFile({ url: mt("https:", s2), name: "file", formData: Object.assign({}, i2), filePath: r2, fileType: a2, header: o2, success(e3) {
          const n3 = { statusCode: e3.statusCode, data: e3.data || {} };
          200 === e3.statusCode && i2.success_action_status && (n3.statusCode = parseInt(i2.success_action_status, 10)), t2(n3);
        }, fail(e3) {
          n2(new Error(e3.errMsg || "uploadFile:fail"));
        } });
        "function" == typeof e2.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
          e2.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
        });
      });
    }
  }
  const _t = { setItem(e2, t2) {
    se.setStorageSync(e2, t2);
  }, getItem: (e2) => se.getStorageSync(e2), removeItem(e2) {
    se.removeStorageSync(e2);
  }, clear() {
    se.clearStorageSync();
  } };
  var wt = { genAdapter: function() {
    return { root: {}, reqClass: yt, localStorage: _t, primaryStorage: "local" };
  }, isMatch: function() {
    return true;
  }, runtime: "uni_app" };
  gt.useAdapters(wt);
  const vt = gt, It = vt.init;
  vt.init = function(e2) {
    e2.env = e2.spaceId;
    const t2 = It.call(this, e2);
    t2.config.provider = "tencent", t2.config.spaceId = e2.spaceId;
    const n2 = t2.auth;
    return t2.auth = function(e3) {
      const t3 = n2.call(this, e3);
      return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e4) => {
        var n3;
        t3[e4] = (n3 = t3[e4], function(e5) {
          e5 = e5 || {};
          const { success: t4, fail: s2, complete: r2 } = te(e5);
          if (!(t4 || s2 || r2))
            return n3.call(this, e5);
          n3.call(this, e5).then((e6) => {
            t4 && t4(e6), r2 && r2(e6);
          }, (e6) => {
            s2 && s2(e6), r2 && r2(e6);
          });
        }).bind(t3);
      }), t3;
    }, t2.customAuth = t2.auth, t2;
  };
  var St = vt;
  var bt = class extends ge {
    getAccessToken() {
      return new Promise((e2, t2) => {
        const n2 = "Anonymous_Access_token";
        this.setAccessToken(n2), e2(n2);
      });
    }
    setupRequest(e2, t2) {
      const n2 = Object.assign({}, e2, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret);
      const r2 = le();
      s2["x-client-info"] = encodeURIComponent(JSON.stringify(r2));
      const { token: i2 } = ie();
      return s2["x-client-token"] = i2, { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: JSON.parse(JSON.stringify(s2)) };
    }
    uploadFileToOSS({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e2, formData: t2, name: n2, filePath: s2, fileType: r2, success(e3) {
          e3 && e3.statusCode < 400 ? o2(e3) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e3) {
          a2(new ne({ code: e3.code || "UPLOAD_FAILED", message: e3.message || e3.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e3) => {
          i2({ loaded: e3.totalBytesSent, total: e3.totalBytesExpectedToSend });
        });
      });
    }
    uploadFile({ filePath: e2, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
      if (!t2)
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      let r2;
      return this.getOSSUploadOptionsFromPath({ cloudPath: t2 }).then((t3) => {
        const { url: i2, formData: o2, name: a2 } = t3.result;
        r2 = t3.result.fileUrl;
        const c2 = { url: i2, formData: o2, name: a2, filePath: e2, fileType: n2 };
        return this.uploadFileToOSS(Object.assign({}, c2, { onUploadProgress: s2 }));
      }).then(() => this.reportOSSUpload({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
        t3.success ? n3({ success: true, filePath: e2, fileID: r2 }) : s3(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }));
    }
    deleteFile({ fileList: e2 }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e2 }) };
      return this.request(this.setupRequest(t2)).then((e3) => {
        if (e3.success)
          return e3.result;
        throw new ne({ code: "DELETE_FILE_FAILED", message: "删除文件失败" });
      });
    }
    getTempFileURL({ fileList: e2 } = {}) {
      if (!Array.isArray(e2) || 0 === e2.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e2 }) };
      return this.request(this.setupRequest(t2)).then((e3) => {
        if (e3.success)
          return { fileList: e3.result.fileList.map((e4) => ({ fileID: e4.fileID, tempFileURL: e4.tempFileURL })) };
        throw new ne({ code: "GET_TEMP_FILE_URL_FAILED", message: "获取临时文件链接失败" });
      });
    }
  };
  var kt = { init(e2) {
    const t2 = new bt(e2), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  function Ct({ data: e2 }) {
    let t2;
    t2 = le();
    const n2 = JSON.parse(JSON.stringify(e2 || {}));
    if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
      const { token: e3 } = ie();
      e3 && (n2.uniIdToken = e3);
    }
    return n2;
  }
  async function Tt({ name: e2, data: t2 } = {}) {
    await this.__dev__.initLocalNetwork();
    const { localAddress: n2, localPort: s2 } = this.__dev__, r2 = { aliyun: "aliyun", tencent: "tcb" }[this.config.provider], i2 = this.config.spaceId, o2 = `http://${n2}:${s2}/system/check-function`, a2 = `http://${n2}:${s2}/cloudfunctions/${e2}`;
    return new Promise((t3, n3) => {
      se.request({ method: "POST", url: o2, data: { name: e2, platform: P, provider: r2, spaceId: i2 }, timeout: 3e3, success(e3) {
        t3(e3);
      }, fail() {
        t3({ data: { code: "NETWORK_ERROR", message: "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下，自动切换为已部署的云函数。" } });
      } });
    }).then(({ data: e3 } = {}) => {
      const { code: t3, message: n3 } = e3 || {};
      return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
    }).then(({ code: n3, message: s3 }) => {
      if (0 !== n3) {
        switch (n3) {
          case "MODULE_ENCRYPTED":
            console.error(`此云函数（${e2}）依赖加密公共模块不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "FUNCTION_ENCRYPTED":
            console.error(`此云函数（${e2}）已加密不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "ACTION_ENCRYPTED":
            console.error(s3 || "需要访问加密的uni-clientDB-action，自动切换为云端环境");
            break;
          case "NETWORK_ERROR": {
            const e3 = "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下";
            throw console.error(e3), new Error(e3);
          }
          case "SWITCH_TO_CLOUD":
            break;
          default: {
            const e3 = `检测本地调试服务出现错误：${s3}，请检查网络环境或重启客户端再试`;
            throw console.error(e3), new Error(e3);
          }
        }
        return this._callCloudFunction({ name: e2, data: t2 });
      }
      return new Promise((e3, n4) => {
        const s4 = Ct.call(this, { data: t2 });
        se.request({ method: "POST", url: a2, data: { provider: r2, platform: P, param: s4 }, success: ({ statusCode: t3, data: s5 } = {}) => !t3 || t3 >= 400 ? n4(new ne({ code: s5.code || "SYS_ERR", message: s5.message || "request:fail" })) : e3({ result: s5 }), fail(e4) {
          n4(new ne({ code: e4.code || e4.errCode || "SYS_ERR", message: e4.message || e4.errMsg || "request:fail" }));
        } });
      });
    });
  }
  const Pt = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "，云函数[{functionName}]在云端不存在，请检查此云函数名称是否正确以及该云函数是否已上传到服务空间", mode: "append" }];
  var At = /[\\^$.*+?()[\]{}|]/g, Et = RegExp(At.source);
  function Ot(e2, t2, n2) {
    return e2.replace(new RegExp((s2 = t2) && Et.test(s2) ? s2.replace(At, "\\$&") : s2, "g"), n2);
    var s2;
  }
  const Rt = "request", Ut = "response", Lt = "both";
  const yn = { code: 2e4, message: "System error" }, _n = { code: 20101, message: "Invalid client" };
  function In(e2) {
    const { errSubject: t2, subject: n2, errCode: s2, errMsg: r2, code: i2, message: o2, cause: a2 } = e2 || {};
    return new ne({ subject: t2 || n2 || "uni-secure-network", code: s2 || i2 || yn.code, message: r2 || o2, cause: a2 });
  }
  let bn;
  function An({ secretType: e2 } = {}) {
    return e2 === Rt || e2 === Ut || e2 === Lt;
  }
  function En({ name: e2, data: t2 = {} } = {}) {
    return "DCloud-clientDB" === e2 && "encryption" === t2.redirectTo && "getAppClientKey" === t2.action;
  }
  function On({ provider: e2, spaceId: t2, functionName: n2 } = {}) {
    const { appId: s2, uniPlatform: r2, osName: i2 } = ue();
    let o2 = r2;
    "app" === r2 && (o2 = i2);
    const a2 = function({ provider: e3, spaceId: t3 } = {}) {
      const n3 = T;
      if (!n3)
        return {};
      e3 = function(e4) {
        return "tencent" === e4 ? "tcb" : e4;
      }(e3);
      const s3 = n3.find((n4) => n4.provider === e3 && n4.spaceId === t3);
      return s3 && s3.config;
    }({ provider: e2, spaceId: t2 });
    if (!a2 || !a2.accessControl || !a2.accessControl.enable)
      return false;
    const c2 = a2.accessControl.function || {}, u2 = Object.keys(c2);
    if (0 === u2.length)
      return true;
    const h2 = function(e3, t3) {
      let n3, s3, r3;
      for (let i3 = 0; i3 < e3.length; i3++) {
        const o3 = e3[i3];
        o3 !== t3 ? "*" !== o3 ? o3.split(",").map((e4) => e4.trim()).indexOf(t3) > -1 && (s3 = o3) : r3 = o3 : n3 = o3;
      }
      return n3 || s3 || r3;
    }(u2, n2);
    if (!h2)
      return false;
    if ((c2[h2] || []).find((e3 = {}) => e3.appId === s2 && (e3.platform || "").toLowerCase() === o2.toLowerCase()))
      return true;
    throw console.error(`此应用[appId: ${s2}, platform: ${o2}]不在云端配置的允许访问的应用列表内，参考：https://uniapp.dcloud.net.cn/uniCloud/secure-network.html#verify-client`), In(_n);
  }
  function xn({ functionName: e2, result: t2, logPvd: n2 }) {
    if (this.__dev__.debugLog && t2 && t2.requestId) {
      const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e2, requestId: t2.requestId });
      console.log(`[${n2}-request]${s2}[/${n2}-request]`);
    }
  }
  function Rn(e2) {
    const t2 = e2.callFunction, n2 = function(n3) {
      const s2 = n3.name;
      n3.data = Ct.call(e2, { data: n3.data });
      const r2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb" }[this.config.provider], i2 = An(n3), o2 = En(n3), a2 = i2 || o2;
      return t2.call(this, n3).then((e3) => (e3.errCode = 0, !a2 && xn.call(this, { functionName: s2, result: e3, logPvd: r2 }), Promise.resolve(e3)), (e3) => (!a2 && xn.call(this, { functionName: s2, result: e3, logPvd: r2 }), e3 && e3.message && (e3.message = function({ message: e4 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
        for (let s3 = 0; s3 < n4.length; s3++) {
          const { rule: r3, content: i3, mode: o3 } = n4[s3], a3 = e4.match(r3);
          if (!a3)
            continue;
          let c2 = i3;
          for (let e5 = 1; e5 < a3.length; e5++)
            c2 = Ot(c2, `{$${e5}}`, a3[e5]);
          for (const e5 in t3)
            c2 = Ot(c2, `{${e5}}`, t3[e5]);
          return "replace" === o3 ? c2 : e4 + c2;
        }
        return e4;
      }({ message: `[${n3.name}]: ${e3.message}`, formatter: Pt, extraInfo: { functionName: s2 } })), Promise.reject(e3)));
    };
    e2.callFunction = function(t3) {
      const { provider: s2, spaceId: r2 } = e2.config, i2 = t3.name;
      let o2, a2;
      if (t3.data = t3.data || {}, e2.__dev__.debugInfo && !e2.__dev__.debugInfo.forceRemote && E ? (e2._callCloudFunction || (e2._callCloudFunction = n2, e2._callLocalFunction = Tt), o2 = Tt) : o2 = n2, o2 = o2.bind(e2), En(t3))
        a2 = n2.call(e2, t3);
      else if (An(t3)) {
        a2 = new bn({ secretType: t3.secretType, uniCloudIns: e2 }).wrapEncryptDataCallFunction(n2.bind(e2))(t3);
      } else if (On({ provider: s2, spaceId: r2, functionName: i2 })) {
        a2 = new bn({ secretType: t3.secretType, uniCloudIns: e2 }).wrapVerifyClientCallFunction(n2.bind(e2))(t3);
      } else
        a2 = o2(t3);
      return Object.defineProperty(a2, "result", { get: () => (console.warn("当前返回结果为Promise类型，不可直接访问其result属性，详情请参考：https://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), a2;
    };
  }
  bn = class {
    constructor() {
      throw In({ message: `Platform ${P} is not enabled, please check whether secure network module is enabled in your manifest.json` });
    }
  };
  const Un = Symbol("CLIENT_DB_INTERNAL");
  function Ln(e2, t2) {
    return e2.then = "DoNotReturnProxyWithAFunctionNamedThen", e2._internalType = Un, e2.inspect = null, e2.__v_raw = void 0, new Proxy(e2, { get(e3, n2, s2) {
      if ("_uniClient" === n2)
        return null;
      if ("symbol" == typeof n2)
        return e3[n2];
      if (n2 in e3 || "string" != typeof n2) {
        const t3 = e3[n2];
        return "function" == typeof t3 ? t3.bind(e3) : t3;
      }
      return t2.get(e3, n2, s2);
    } });
  }
  function Nn(e2) {
    return { on: (t2, n2) => {
      e2[t2] = e2[t2] || [], e2[t2].indexOf(n2) > -1 || e2[t2].push(n2);
    }, off: (t2, n2) => {
      e2[t2] = e2[t2] || [];
      const s2 = e2[t2].indexOf(n2);
      -1 !== s2 && e2[t2].splice(s2, 1);
    } };
  }
  const Dn = ["db.Geo", "db.command", "command.aggregate"];
  function Fn(e2, t2) {
    return Dn.indexOf(`${e2}.${t2}`) > -1;
  }
  function qn(e2) {
    switch (g$1(e2 = re(e2))) {
      case "array":
        return e2.map((e3) => qn(e3));
      case "object":
        return e2._internalType === Un || Object.keys(e2).forEach((t2) => {
          e2[t2] = qn(e2[t2]);
        }), e2;
      case "regexp":
        return { $regexp: { source: e2.source, flags: e2.flags } };
      case "date":
        return { $date: e2.toISOString() };
      default:
        return e2;
    }
  }
  function Mn(e2) {
    return e2 && e2.content && e2.content.$method;
  }
  class Kn {
    constructor(e2, t2, n2) {
      this.content = e2, this.prevStage = t2 || null, this.udb = null, this._database = n2;
    }
    toJSON() {
      let e2 = this;
      const t2 = [e2.content];
      for (; e2.prevStage; )
        e2 = e2.prevStage, t2.push(e2.content);
      return { $db: t2.reverse().map((e3) => ({ $method: e3.$method, $param: qn(e3.$param) })) };
    }
    toString() {
      return JSON.stringify(this.toJSON());
    }
    getAction() {
      const e2 = this.toJSON().$db.find((e3) => "action" === e3.$method);
      return e2 && e2.$param && e2.$param[0];
    }
    getCommand() {
      return { $db: this.toJSON().$db.filter((e2) => "action" !== e2.$method) };
    }
    get isAggregate() {
      let e2 = this;
      for (; e2; ) {
        const t2 = Mn(e2), n2 = Mn(e2.prevStage);
        if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    get isCommand() {
      let e2 = this;
      for (; e2; ) {
        if ("command" === Mn(e2))
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    get isAggregateCommand() {
      let e2 = this;
      for (; e2; ) {
        const t2 = Mn(e2), n2 = Mn(e2.prevStage);
        if ("aggregate" === t2 && "command" === n2)
          return true;
        e2 = e2.prevStage;
      }
      return false;
    }
    getNextStageFn(e2) {
      const t2 = this;
      return function() {
        return jn({ $method: e2, $param: qn(Array.from(arguments)) }, t2, t2._database);
      };
    }
    get count() {
      return this.isAggregate ? this.getNextStageFn("count") : function() {
        return this._send("count", Array.from(arguments));
      };
    }
    get remove() {
      return this.isCommand ? this.getNextStageFn("remove") : function() {
        return this._send("remove", Array.from(arguments));
      };
    }
    get() {
      return this._send("get", Array.from(arguments));
    }
    get add() {
      return this.isCommand ? this.getNextStageFn("add") : function() {
        return this._send("add", Array.from(arguments));
      };
    }
    update() {
      return this._send("update", Array.from(arguments));
    }
    end() {
      return this._send("end", Array.from(arguments));
    }
    get set() {
      return this.isCommand ? this.getNextStageFn("set") : function() {
        throw new Error("JQL禁止使用set方法");
      };
    }
    _send(e2, t2) {
      const n2 = this.getAction(), s2 = this.getCommand();
      if (s2.$db.push({ $method: e2, $param: qn(t2) }), b$1) {
        const e3 = s2.$db.find((e4) => "collection" === e4.$method), t3 = e3 && e3.$param;
        t3 && 1 === t3.length && "string" == typeof e3.$param[0] && e3.$param[0].indexOf(",") > -1 && console.warn("检测到使用JQL语法联表查询时，未使用getTemp先过滤主表数据，在主表数据量大的情况下可能会查询缓慢。\n- 如何优化请参考此文档：https://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- 如果主表数据量很小请忽略此信息，项目发行时不会出现此提示。");
      }
      return this._database._callCloudFunction({ action: n2, command: s2 });
    }
  }
  function jn(e2, t2, n2) {
    return Ln(new Kn(e2, t2, n2), { get(e3, t3) {
      let s2 = "db";
      return e3 && e3.content && (s2 = e3.content.$method), Fn(s2, t3) ? jn({ $method: t3 }, e3, n2) : function() {
        return jn({ $method: t3, $param: qn(Array.from(arguments)) }, e3, n2);
      };
    } });
  }
  function Bn({ path: e2, method: t2 }) {
    return class {
      constructor() {
        this.param = Array.from(arguments);
      }
      toJSON() {
        return { $newDb: [...e2.map((e3) => ({ $method: e3 })), { $method: t2, $param: this.param }] };
      }
      toString() {
        return JSON.stringify(this.toJSON());
      }
    };
  }
  function $n(e2, t2 = {}) {
    return Ln(new e2(t2), { get: (e3, t3) => Fn("db", t3) ? jn({ $method: t3 }, null, e3) : function() {
      return jn({ $method: t3, $param: qn(Array.from(arguments)) }, null, e3);
    } });
  }
  class Wn extends class {
    constructor({ uniClient: e2 = {}, isJQL: t2 = false } = {}) {
      this._uniClient = e2, this._authCallBacks = {}, this._dbCallBacks = {}, e2._isDefault && (this._dbCallBacks = U("_globalUniCloudDatabaseCallback")), t2 || (this.auth = Nn(this._authCallBacks)), this._isJQL = t2, Object.assign(this, Nn(this._dbCallBacks)), this.env = Ln({}, { get: (e3, t3) => ({ $env: t3 }) }), this.Geo = Ln({}, { get: (e3, t3) => Bn({ path: ["Geo"], method: t3 }) }), this.serverDate = Bn({ path: [], method: "serverDate" }), this.RegExp = Bn({ path: [], method: "RegExp" });
    }
    getCloudEnv(e2) {
      if ("string" != typeof e2 || !e2.trim())
        throw new Error("getCloudEnv参数错误");
      return { $env: e2.replace("$cloudEnv_", "") };
    }
    _callback(e2, t2) {
      const n2 = this._dbCallBacks;
      n2[e2] && n2[e2].forEach((e3) => {
        e3(...t2);
      });
    }
    _callbackAuth(e2, t2) {
      const n2 = this._authCallBacks;
      n2[e2] && n2[e2].forEach((e3) => {
        e3(...t2);
      });
    }
    multiSend() {
      const e2 = Array.from(arguments), t2 = e2.map((e3) => {
        const t3 = e3.getAction(), n2 = e3.getCommand();
        if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
          throw new Error("multiSend只支持子命令内使用getTemp");
        return { action: t3, command: n2 };
      });
      return this._callCloudFunction({ multiCommand: t2, queryList: e2 });
    }
  } {
    _parseResult(e2) {
      return this._isJQL ? e2.result : e2;
    }
    _callCloudFunction({ action: e2, command: t2, multiCommand: n2, queryList: s2 }) {
      function r2(e3, t3) {
        if (n2 && s2)
          for (let n3 = 0; n3 < s2.length; n3++) {
            const r3 = s2[n3];
            r3.udb && "function" == typeof r3.udb.setResult && (t3 ? r3.udb.setResult(t3) : r3.udb.setResult(e3.result.dataList[n3]));
          }
      }
      const i2 = this, o2 = this._isJQL ? "databaseForJQL" : "database";
      function a2(e3) {
        return i2._callback("error", [e3]), q(M(o2, "fail"), e3).then(() => q(M(o2, "complete"), e3)).then(() => (r2(null, e3), Y(B, { type: z, content: e3 }), Promise.reject(e3)));
      }
      const c2 = q(M(o2, "invoke")), u2 = this._uniClient;
      return c2.then(() => u2.callFunction({ name: "DCloud-clientDB", type: l$1, data: { action: e2, command: t2, multiCommand: n2 } })).then((e3) => {
        const { code: t3, message: n3, token: s3, tokenExpired: c3, systemInfo: u3 = [] } = e3.result;
        if (u3)
          for (let e4 = 0; e4 < u3.length; e4++) {
            const { level: t4, message: n4, detail: s4 } = u3[e4], r3 = console["warn" === t4 ? "error" : t4] || console.log;
            let i3 = "[System Info]" + n4;
            s4 && (i3 = `${i3}
详细信息：${s4}`), r3(i3);
          }
        if (t3) {
          return a2(new ne({ code: t3, message: n3, requestId: e3.requestId }));
        }
        e3.result.errCode = e3.result.errCode || e3.result.code, e3.result.errMsg = e3.result.errMsg || e3.result.message, s3 && c3 && (oe({ token: s3, tokenExpired: c3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: c3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: c3 }]), Y(W, { token: s3, tokenExpired: c3 }));
        const h2 = [{ prop: "affectedDocs", tips: "affectedDocs不再推荐使用，请使用inserted/deleted/updated/data.length替代" }, { prop: "code", tips: "code不再推荐使用，请使用errCode替代" }, { prop: "message", tips: "message不再推荐使用，请使用errMsg替代" }];
        for (let t4 = 0; t4 < h2.length; t4++) {
          const { prop: n4, tips: s4 } = h2[t4];
          if (n4 in e3.result) {
            const t5 = e3.result[n4];
            Object.defineProperty(e3.result, n4, { get: () => (console.warn(s4), t5) });
          }
        }
        return function(e4) {
          return q(M(o2, "success"), e4).then(() => q(M(o2, "complete"), e4)).then(() => {
            r2(e4, null);
            const t4 = i2._parseResult(e4);
            return Y(B, { type: z, content: t4 }), Promise.resolve(t4);
          });
        }(e3);
      }, (e3) => {
        /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e3.message) && console.warn("clientDB未初始化，请在web控制台保存一次schema以开启clientDB");
        return a2(new ne({ code: e3.code || "SYSTEM_ERROR", message: e3.message, requestId: e3.requestId }));
      });
    }
  }
  const zn = "token无效，跳转登录页面", Jn = "token过期，跳转登录页面", Hn = { TOKEN_INVALID_TOKEN_EXPIRED: Jn, TOKEN_INVALID_INVALID_CLIENTID: zn, TOKEN_INVALID: zn, TOKEN_INVALID_WRONG_TOKEN: zn, TOKEN_INVALID_ANONYMOUS_USER: zn }, Gn = { "uni-id-token-expired": Jn, "uni-id-check-token-failed": zn, "uni-id-token-not-exist": zn, "uni-id-check-device-feature-failed": zn };
  function Vn(e2, t2) {
    let n2 = "";
    return n2 = e2 ? `${e2}/${t2}` : t2, n2.replace(/^\//, "");
  }
  function Qn(e2 = [], t2 = "") {
    const n2 = [], s2 = [];
    return e2.forEach((e3) => {
      true === e3.needLogin ? n2.push(Vn(t2, e3.path)) : false === e3.needLogin && s2.push(Vn(t2, e3.path));
    }), { needLoginPage: n2, notNeedLoginPage: s2 };
  }
  function Yn(e2) {
    return e2.split("?")[0].replace(/^\//, "");
  }
  function Xn() {
    return function(e2) {
      let t2 = e2 && e2.$page && e2.$page.fullPath || "";
      return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : t2;
    }(function() {
      const e2 = getCurrentPages();
      return e2[e2.length - 1];
    }());
  }
  function Zn() {
    return Yn(Xn());
  }
  function es$1(e2 = "", t2 = {}) {
    if (!e2)
      return false;
    if (!(t2 && t2.list && t2.list.length))
      return false;
    const n2 = t2.list, s2 = Yn(e2);
    return n2.some((e3) => e3.pagePath === s2);
  }
  const ts = !!pagesJson.uniIdRouter;
  const { loginPage: ns, routerNeedLogin: ss, resToLogin: rs, needLoginPage: is, notNeedLoginPage: os, loginPageInTabBar: as } = function({ pages: e2 = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: r2 = {} } = pagesJson) {
    const { loginPage: i2, needLogin: o2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = Qn(e2), { needLoginPage: h2, notNeedLoginPage: l2 } = function(e3 = []) {
      const t2 = [], n3 = [];
      return e3.forEach((e4) => {
        const { root: s3, pages: r3 = [] } = e4, { needLoginPage: i3, notNeedLoginPage: o3 } = Qn(r3, s3);
        t2.push(...i3), n3.push(...o3);
      }), { needLoginPage: t2, notNeedLoginPage: n3 };
    }(n2);
    return { loginPage: i2, routerNeedLogin: o2, resToLogin: a2, needLoginPage: [...c2, ...h2], notNeedLoginPage: [...u2, ...l2], loginPageInTabBar: es$1(i2, r2) };
  }();
  if (is.indexOf(ns) > -1)
    throw new Error(`Login page [${ns}] should not be "needLogin", please check your pages.json`);
  function cs(e2) {
    const t2 = Zn();
    if ("/" === e2.charAt(0))
      return e2;
    const [n2, s2] = e2.split("?"), r2 = n2.replace(/^\//, "").split("/"), i2 = t2.split("/");
    i2.pop();
    for (let e3 = 0; e3 < r2.length; e3++) {
      const t3 = r2[e3];
      ".." === t3 ? i2.pop() : "." !== t3 && i2.push(t3);
    }
    return "" === i2[0] && i2.shift(), "/" + i2.join("/") + (s2 ? "?" + s2 : "");
  }
  function us(e2) {
    const t2 = Yn(cs(e2));
    return !(os.indexOf(t2) > -1) && (is.indexOf(t2) > -1 || ss.some((t3) => function(e3, t4) {
      return new RegExp(t4).test(e3);
    }(e2, t3)));
  }
  function hs({ redirect: e2 }) {
    const t2 = Yn(e2), n2 = Yn(ns);
    return Zn() !== n2 && t2 !== n2;
  }
  function ls({ api: e2, redirect: t2 } = {}) {
    if (!t2 || !hs({ redirect: t2 }))
      return;
    const n2 = function(e3, t3) {
      return "/" !== e3.charAt(0) && (e3 = "/" + e3), t3 ? e3.indexOf("?") > -1 ? e3 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e3 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e3;
    }(ns, t2);
    as ? "navigateTo" !== e2 && "redirectTo" !== e2 || (e2 = "switchTab") : "switchTab" === e2 && (e2 = "navigateTo");
    const s2 = { navigateTo: uni.navigateTo, redirectTo: uni.redirectTo, switchTab: uni.switchTab, reLaunch: uni.reLaunch };
    setTimeout(() => {
      s2[e2]({ url: n2 });
    });
  }
  function ds({ url: e2 } = {}) {
    const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
      const { token: e3, tokenExpired: t3 } = ie();
      let n3;
      if (e3) {
        if (t3 < Date.now()) {
          const e4 = "uni-id-token-expired";
          n3 = { errCode: e4, errMsg: Gn[e4] };
        }
      } else {
        const e4 = "uni-id-check-token-failed";
        n3 = { errCode: e4, errMsg: Gn[e4] };
      }
      return n3;
    }();
    if (us(e2) && n2) {
      n2.uniIdRedirectUrl = e2;
      if (G($).length > 0)
        return setTimeout(() => {
          Y($, n2);
        }, 0), t2.abortLoginPageJump = true, t2;
      t2.autoToLoginPage = true;
    }
    return t2;
  }
  function ps() {
    !function() {
      const e3 = Xn(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = ds({ url: e3 });
      t2 || n2 && ls({ api: "redirectTo", redirect: e3 });
    }();
    const e2 = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    for (let t2 = 0; t2 < e2.length; t2++) {
      const n2 = e2[t2];
      uni.addInterceptor(n2, { invoke(e3) {
        const { abortLoginPageJump: t3, autoToLoginPage: s2 } = ds({ url: e3.url });
        return t3 ? e3 : s2 ? (ls({ api: n2, redirect: cs(e3.url) }), false) : e3;
      } });
    }
  }
  function fs() {
    this.onResponse((e2) => {
      const { type: t2, content: n2 } = e2;
      let s2 = false;
      switch (t2) {
        case "cloudobject":
          s2 = function(e3) {
            if ("object" != typeof e3)
              return false;
            const { errCode: t3 } = e3 || {};
            return t3 in Gn;
          }(n2);
          break;
        case "clientdb":
          s2 = function(e3) {
            if ("object" != typeof e3)
              return false;
            const { errCode: t3 } = e3 || {};
            return t3 in Hn;
          }(n2);
      }
      s2 && function(e3 = {}) {
        const t3 = G($);
        ee().then(() => {
          const n3 = Xn();
          if (n3 && hs({ redirect: n3 }))
            return t3.length > 0 ? Y($, Object.assign({ uniIdRedirectUrl: n3 }, e3)) : void (ns && ls({ api: "navigateTo", redirect: n3 }));
        });
      }(n2);
    });
  }
  function gs(e2) {
    !function(e3) {
      e3.onResponse = function(e4) {
        V(B, e4);
      }, e3.offResponse = function(e4) {
        Q(B, e4);
      };
    }(e2), function(e3) {
      e3.onNeedLogin = function(e4) {
        V($, e4);
      }, e3.offNeedLogin = function(e4) {
        Q($, e4);
      }, ts && (U("_globalUniCloudStatus").needLoginInit || (U("_globalUniCloudStatus").needLoginInit = true, ee().then(() => {
        ps.call(e3);
      }), rs && fs.call(e3)));
    }(e2), function(e3) {
      e3.onRefreshToken = function(e4) {
        V(W, e4);
      }, e3.offRefreshToken = function(e4) {
        Q(W, e4);
      };
    }(e2);
  }
  let ms;
  const ys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _s = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
  function ws() {
    const e2 = ie().token || "", t2 = e2.split(".");
    if (!e2 || 3 !== t2.length)
      return { uid: null, role: [], permission: [], tokenExpired: 0 };
    let n2;
    try {
      n2 = JSON.parse((s2 = t2[1], decodeURIComponent(ms(s2).split("").map(function(e3) {
        return "%" + ("00" + e3.charCodeAt(0).toString(16)).slice(-2);
      }).join(""))));
    } catch (e3) {
      throw new Error("获取当前用户信息出错，详细错误信息为：" + e3.message);
    }
    var s2;
    return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
  }
  ms = "function" != typeof atob ? function(e2) {
    if (e2 = String(e2).replace(/[\t\n\f\r ]+/g, ""), !_s.test(e2))
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    var t2;
    e2 += "==".slice(2 - (3 & e2.length));
    for (var n2, s2, r2 = "", i2 = 0; i2 < e2.length; )
      t2 = ys.indexOf(e2.charAt(i2++)) << 18 | ys.indexOf(e2.charAt(i2++)) << 12 | (n2 = ys.indexOf(e2.charAt(i2++))) << 6 | (s2 = ys.indexOf(e2.charAt(i2++))), r2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
    return r2;
  } : atob;
  var vs = s$1(function(e2, t2) {
    Object.defineProperty(t2, "__esModule", { value: true });
    const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
    function r2(e3, t3) {
      return e3.tempFiles.forEach((e4, n3) => {
        e4.name || (e4.name = e4.path.substring(e4.path.lastIndexOf("/") + 1)), t3 && (e4.fileType = t3), e4.cloudPath = Date.now() + "_" + n3 + e4.name.substring(e4.name.lastIndexOf("."));
      }), e3.tempFilePaths || (e3.tempFilePaths = e3.tempFiles.map((e4) => e4.path)), e3;
    }
    function i2(e3, t3, { onChooseFile: s3, onUploadProgress: r3 }) {
      return t3.then((e4) => {
        if (s3) {
          const t4 = s3(e4);
          if (void 0 !== t4)
            return Promise.resolve(t4).then((t5) => void 0 === t5 ? e4 : t5);
        }
        return e4;
      }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e4, t5, s4 = 5, r4) {
        (t5 = Object.assign({}, t5)).errMsg = n2;
        const i3 = t5.tempFiles, o2 = i3.length;
        let a2 = 0;
        return new Promise((n3) => {
          for (; a2 < s4; )
            c2();
          function c2() {
            const s5 = a2++;
            if (s5 >= o2)
              return void (!i3.find((e5) => !e5.url && !e5.errMsg) && n3(t5));
            const u2 = i3[s5];
            e4.uploadFile({ filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, onUploadProgress(e5) {
              e5.index = s5, e5.tempFile = u2, e5.tempFilePath = u2.path, r4 && r4(e5);
            } }).then((e5) => {
              u2.url = e5.fileID, s5 < o2 && c2();
            }).catch((e5) => {
              u2.errMsg = e5.errMsg || e5.message, s5 < o2 && c2();
            });
          }
        });
      }(e3, t4, 5, r3));
    }
    t2.initChooseAndUploadFile = function(e3) {
      return function(t3 = { type: "all" }) {
        return "image" === t3.type ? i2(e3, function(e4) {
          const { count: t4, sizeType: n3, sourceType: i3 = ["album", "camera"], extension: o2 } = e4;
          return new Promise((e5, a2) => {
            uni.chooseImage({ count: t4, sizeType: n3, sourceType: i3, extension: o2, success(t5) {
              e5(r2(t5, "image"));
            }, fail(e6) {
              a2({ errMsg: e6.errMsg.replace("chooseImage:fail", s2) });
            } });
          });
        }(t3), t3) : "video" === t3.type ? i2(e3, function(e4) {
          const { camera: t4, compressed: n3, maxDuration: i3, sourceType: o2 = ["album", "camera"], extension: a2 } = e4;
          return new Promise((e5, c2) => {
            uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: i3, sourceType: o2, extension: a2, success(t5) {
              const { tempFilePath: n4, duration: s3, size: i4, height: o3, width: a3 } = t5;
              e5(r2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: i4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: o3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
            }, fail(e6) {
              c2({ errMsg: e6.errMsg.replace("chooseVideo:fail", s2) });
            } });
          });
        }(t3), t3) : i2(e3, function(e4) {
          const { count: t4, extension: n3 } = e4;
          return new Promise((e5, i3) => {
            let o2 = uni.chooseFile;
            if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (o2 = wx.chooseMessageFile), "function" != typeof o2)
              return i3({ errMsg: s2 + " 请指定 type 类型，该平台仅支持选择 image 或 video。" });
            o2({ type: "all", count: t4, extension: n3, success(t5) {
              e5(r2(t5));
            }, fail(e6) {
              i3({ errMsg: e6.errMsg.replace("chooseFile:fail", s2) });
            } });
          });
        }(t3), t3);
      };
    };
  }), Is = n$1(vs);
  const Ss = "manual";
  function bs(e2) {
    return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {} }), created() {
      this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
        var e3 = [];
        return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
          e3.push(this[t2]);
        }), e3;
      }, (e3, t2) => {
        if (this.loadtime === Ss)
          return;
        let n2 = false;
        const s2 = [];
        for (let r2 = 2; r2 < e3.length; r2++)
          e3[r2] !== t2[r2] && (s2.push(e3[r2]), n2 = true);
        e3[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
      });
    }, methods: { onMixinDatacomPropsChange(e3, t2) {
    }, mixinDatacomEasyGet({ getone: e3 = false, success: t2, fail: n2 } = {}) {
      this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomGet().then((n3) => {
        this.mixinDatacomLoading = false;
        const { data: s2, count: r2 } = n3.result;
        this.getcount && (this.mixinDatacomPage.count = r2), this.mixinDatacomHasMore = s2.length < this.pageSize;
        const i2 = e3 ? s2.length ? s2[0] : void 0 : s2;
        this.mixinDatacomResData = i2, t2 && t2(i2);
      }).catch((e4) => {
        this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e4, n2 && n2(e4);
      }));
    }, mixinDatacomGet(t2 = {}) {
      let n2 = e2.database(this.spaceInfo);
      const s2 = t2.action || this.action;
      s2 && (n2 = n2.action(s2));
      const r2 = t2.collection || this.collection;
      n2 = Array.isArray(r2) ? n2.collection(...r2) : n2.collection(r2);
      const i2 = t2.where || this.where;
      i2 && Object.keys(i2).length && (n2 = n2.where(i2));
      const o2 = t2.field || this.field;
      o2 && (n2 = n2.field(o2));
      const a2 = t2.foreignKey || this.foreignKey;
      a2 && (n2 = n2.foreignKey(a2));
      const c2 = t2.groupby || this.groupby;
      c2 && (n2 = n2.groupBy(c2));
      const u2 = t2.groupField || this.groupField;
      u2 && (n2 = n2.groupField(u2));
      true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
      const h2 = t2.orderby || this.orderby;
      h2 && (n2 = n2.orderBy(h2));
      const l2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, p2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, f2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: p2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
      return f2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (l2 - 1)).limit(d2).get(m2), n2;
    } } };
  }
  function ks(e2) {
    return function(t2, n2 = {}) {
      n2 = function(e3, t3 = {}) {
        return e3.customUI = t3.customUI || e3.customUI, e3.parseSystemError = t3.parseSystemError || e3.parseSystemError, Object.assign(e3.loadingOptions, t3.loadingOptions), Object.assign(e3.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e3.secretMethods = t3.secretMethods), e3;
      }({ customUI: false, loadingOptions: { title: "加载中...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
      const { customUI: s2, loadingOptions: r2, errorOptions: i2, parseSystemError: o2 } = n2, a2 = !s2;
      return new Proxy({}, { get: (s3, c2) => function({ fn: e3, interceptorName: t3, getCallbackArgs: n3 } = {}) {
        return async function(...s4) {
          const r3 = n3 ? n3({ params: s4 }) : {};
          let i3, o3;
          try {
            return await q(M(t3, "invoke"), { ...r3 }), i3 = await e3(...s4), await q(M(t3, "success"), { ...r3, result: i3 }), i3;
          } catch (e4) {
            throw o3 = e4, await q(M(t3, "fail"), { ...r3, error: o3 }), o3;
          } finally {
            await q(M(t3, "complete"), o3 ? { ...r3, error: o3 } : { ...r3, result: i3 });
          }
        };
      }({ fn: async function s4(...u2) {
        let l2;
        a2 && uni.showLoading({ title: r2.title, mask: r2.mask });
        const d2 = { name: t2, type: h$1, data: { method: c2, params: u2 } };
        "object" == typeof n2.secretMethods && function(e3, t3) {
          const n3 = t3.data.method, s5 = e3.secretMethods || {}, r3 = s5[n3] || s5["*"];
          r3 && (t3.secretType = r3);
        }(n2, d2);
        let p2 = false;
        try {
          l2 = await e2.callFunction(d2);
        } catch (e3) {
          p2 = true, l2 = { result: new ne(e3) };
        }
        const { errSubject: f2, errCode: g2, errMsg: m2, newToken: y2 } = l2.result || {};
        if (a2 && uni.hideLoading(), y2 && y2.token && y2.tokenExpired && (oe(y2), Y(W, { ...y2 })), g2) {
          let e3 = m2;
          if (p2 && o2) {
            e3 = (await o2({ objectName: t2, methodName: c2, params: u2, errSubject: f2, errCode: g2, errMsg: m2 })).errMsg || m2;
          }
          if (a2)
            if ("toast" === i2.type)
              uni.showToast({ title: e3, icon: "none" });
            else {
              if ("modal" !== i2.type)
                throw new Error(`Invalid errorOptions.type: ${i2.type}`);
              {
                const { confirm: t3 } = await async function({ title: e4, content: t4, showCancel: n4, cancelText: s5, confirmText: r3 } = {}) {
                  return new Promise((i3, o3) => {
                    uni.showModal({ title: e4, content: t4, showCancel: n4, cancelText: s5, confirmText: r3, success(e5) {
                      i3(e5);
                    }, fail() {
                      i3({ confirm: false, cancel: true });
                    } });
                  });
                }({ title: "提示", content: e3, showCancel: i2.retry, cancelText: "取消", confirmText: i2.retry ? "重试" : "确定" });
                if (i2.retry && t3)
                  return s4(...u2);
              }
            }
          const n3 = new ne({ subject: f2, code: g2, message: m2, requestId: l2.requestId });
          throw n3.detail = l2.result, Y(B, { type: H, content: n3 }), n3;
        }
        return Y(B, { type: H, content: l2.result }), l2.result;
      }, interceptorName: "callObject", getCallbackArgs: function({ params: e3 } = {}) {
        return { objectName: t2, methodName: c2, params: e3 };
      } }) });
    };
  }
  function Cs(e2) {
    return U("_globalUniCloudSecureNetworkCache__{spaceId}".replace("{spaceId}", e2.config.spaceId));
  }
  async function Ts({ openid: e2, callLoginByWeixin: t2 = false } = {}) {
    Cs(this);
    throw new Error(`[SecureNetwork] API \`initSecureNetworkByWeixin\` is not supported on platform \`${P}\``);
  }
  async function Ps(e2) {
    const t2 = Cs(this);
    return t2.initPromise || (t2.initPromise = Ts.call(this, e2)), t2.initPromise;
  }
  function As(e2) {
    return function({ openid: t2, callLoginByWeixin: n2 = false } = {}) {
      return Ps.call(e2, { openid: t2, callLoginByWeixin: n2 });
    };
  }
  function Es(e2) {
    const t2 = { getSystemInfo: uni.getSystemInfo, getPushClientId: uni.getPushClientId };
    return function(n2) {
      return new Promise((s2, r2) => {
        t2[e2]({ ...n2, success(e3) {
          s2(e3);
        }, fail(e3) {
          r2(e3);
        } });
      });
    };
  }
  class Os extends class {
    constructor() {
      this._callback = {};
    }
    addListener(e2, t2) {
      this._callback[e2] || (this._callback[e2] = []), this._callback[e2].push(t2);
    }
    on(e2, t2) {
      return this.addListener(e2, t2);
    }
    removeListener(e2, t2) {
      if (!t2)
        throw new Error('The "listener" argument must be of type function. Received undefined');
      const n2 = this._callback[e2];
      if (!n2)
        return;
      const s2 = function(e3, t3) {
        for (let n3 = e3.length - 1; n3 >= 0; n3--)
          if (e3[n3] === t3)
            return n3;
        return -1;
      }(n2, t2);
      n2.splice(s2, 1);
    }
    off(e2, t2) {
      return this.removeListener(e2, t2);
    }
    removeAllListener(e2) {
      delete this._callback[e2];
    }
    emit(e2, ...t2) {
      const n2 = this._callback[e2];
      if (n2)
        for (let e3 = 0; e3 < n2.length; e3++)
          n2[e3](...t2);
    }
  } {
    constructor() {
      super(), this._uniPushMessageCallback = this._receivePushMessage.bind(this), this._currentMessageId = -1, this._payloadQueue = [];
    }
    init() {
      return Promise.all([Es("getSystemInfo")(), Es("getPushClientId")()]).then(([{ appId: e2 } = {}, { cid: t2 } = {}] = []) => {
        if (!e2)
          throw new Error("Invalid appId, please check the manifest.json file");
        if (!t2)
          throw new Error("Invalid push client id");
        this._appId = e2, this._pushClientId = t2, this._seqId = Date.now() + "-" + Math.floor(9e5 * Math.random() + 1e5), this.emit("open"), this._initMessageListener();
      }, (e2) => {
        throw this.emit("error", e2), this.close(), e2;
      });
    }
    async open() {
      return this.init();
    }
    _isUniCloudSSE(e2) {
      if ("receive" !== e2.type)
        return false;
      const t2 = e2 && e2.data && e2.data.payload;
      return !(!t2 || "UNI_CLOUD_SSE" !== t2.channel || t2.seqId !== this._seqId);
    }
    _receivePushMessage(e2) {
      if (!this._isUniCloudSSE(e2))
        return;
      const t2 = e2 && e2.data && e2.data.payload, { action: n2, messageId: s2, message: r2 } = t2;
      this._payloadQueue.push({ action: n2, messageId: s2, message: r2 }), this._consumMessage();
    }
    _consumMessage() {
      for (; ; ) {
        const e2 = this._payloadQueue.find((e3) => e3.messageId === this._currentMessageId + 1);
        if (!e2)
          break;
        this._currentMessageId++, this._parseMessagePayload(e2);
      }
    }
    _parseMessagePayload(e2) {
      const { action: t2, messageId: n2, message: s2 } = e2;
      "end" === t2 ? this._end({ messageId: n2, message: s2 }) : "message" === t2 && this._appendMessage({ messageId: n2, message: s2 });
    }
    _appendMessage({ messageId: e2, message: t2 } = {}) {
      this.emit("message", t2);
    }
    _end({ messageId: e2, message: t2 } = {}) {
      this.emit("end", t2), this.close();
    }
    _initMessageListener() {
      uni.onPushMessage(this._uniPushMessageCallback);
    }
    _destroy() {
      uni.offPushMessage(this._uniPushMessageCallback);
    }
    toJSON() {
      return { appId: this._appId, pushClientId: this._pushClientId, seqId: this._seqId };
    }
    close() {
      this._destroy(), this.emit("close");
    }
  }
  async function xs(e2, t2) {
    const n2 = `http://${e2}:${t2}/system/ping`;
    try {
      const e3 = await (s2 = { url: n2, timeout: 500 }, new Promise((e4, t3) => {
        se.request({ ...s2, success(t4) {
          e4(t4);
        }, fail(e5) {
          t3(e5);
        } });
      }));
      return !(!e3.data || 0 !== e3.data.code);
    } catch (e3) {
      return false;
    }
    var s2;
  }
  async function Rs(e2) {
    {
      const { osName: e3, osVersion: t3 } = ue();
      "ios" === e3 && function(e4) {
        if (!e4 || "string" != typeof e4)
          return 0;
        const t4 = e4.match(/^(\d+)./);
        return t4 && t4[1] ? parseInt(t4[1]) : 0;
      }(t3) >= 14 && console.warn("iOS 14及以上版本连接uniCloud本地调试服务需要允许客户端查找并连接到本地网络上的设备（仅开发模式生效，发行模式会连接uniCloud云端服务）");
    }
    const t2 = e2.__dev__;
    if (!t2.debugInfo)
      return;
    const { address: n2, servePort: s2 } = t2.debugInfo, { address: r2 } = await async function(e3, t3) {
      let n3;
      for (let s3 = 0; s3 < e3.length; s3++) {
        const r3 = e3[s3];
        if (await xs(r3, t3)) {
          n3 = r3;
          break;
        }
      }
      return { address: n3, port: t3 };
    }(n2, s2);
    if (r2)
      return t2.localAddress = r2, void (t2.localPort = s2);
    const i2 = console["error"];
    let o2 = "";
    if ("remote" === t2.debugInfo.initialLaunchType ? (t2.debugInfo.forceRemote = true, o2 = "当前客户端和HBuilderX不在同一局域网下（或其他网络原因无法连接HBuilderX），uniCloud本地调试服务不对当前客户端生效。\n- 如果不使用uniCloud本地调试服务，请直接忽略此信息。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。") : o2 = "无法连接uniCloud本地调试服务，请检查当前客户端是否与主机在同一局域网下。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。", o2 += "\n- 如果在HBuilderX开启的状态下切换过网络环境，请重启HBuilderX后再试\n- 检查系统防火墙是否拦截了HBuilderX自带的nodejs\n- 检查是否错误的使用拦截器修改uni.request方法的参数", 0 === P.indexOf("mp-") && (o2 += "\n- 小程序中如何使用uniCloud，请参考：https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), !t2.debugInfo.forceRemote)
      throw new Error(o2);
    i2(o2);
  }
  function Us(e2) {
    e2._initPromiseHub || (e2._initPromiseHub = new I({ createPromise: function() {
      let t2 = Promise.resolve();
      var n2;
      n2 = 1, t2 = new Promise((e3) => {
        setTimeout(() => {
          e3();
        }, n2);
      });
      const s2 = e2.auth();
      return t2.then(() => s2.getLoginState()).then((e3) => e3 ? Promise.resolve() : s2.signInAnonymously());
    } }));
  }
  const Ls = { tcb: St, tencent: St, aliyun: me, private: kt };
  let Ns = new class {
    init(e2) {
      let t2 = {};
      const n2 = Ls[e2.provider];
      if (!n2)
        throw new Error("未提供正确的provider参数");
      t2 = n2.init(e2), function(e3) {
        const t3 = {};
        e3.__dev__ = t3, t3.debugLog = "app" === P;
        const n3 = A;
        n3 && !n3.code && (t3.debugInfo = n3);
        const s2 = new I({ createPromise: function() {
          return Rs(e3);
        } });
        t3.initLocalNetwork = function() {
          return s2.exec();
        };
      }(t2), Us(t2), Rn(t2), function(e3) {
        const t3 = e3.uploadFile;
        e3.uploadFile = function(e4) {
          return t3.call(this, e4);
        };
      }(t2), function(e3) {
        e3.database = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e3.init(t3).database();
          if (this._database)
            return this._database;
          const n3 = $n(Wn, { uniClient: e3 });
          return this._database = n3, n3;
        }, e3.databaseForJQL = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e3.init(t3).databaseForJQL();
          if (this._databaseForJQL)
            return this._databaseForJQL;
          const n3 = $n(Wn, { uniClient: e3, isJQL: true });
          return this._databaseForJQL = n3, n3;
        };
      }(t2), function(e3) {
        e3.getCurrentUserInfo = ws, e3.chooseAndUploadFile = Is.initChooseAndUploadFile(e3), Object.assign(e3, { get mixinDatacom() {
          return bs(e3);
        } }), e3.SSEChannel = Os, e3.initSecureNetworkByWeixin = As(e3), e3.importObject = ks(e3);
      }(t2);
      return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e3) => {
        if (!t2[e3])
          return;
        const n3 = t2[e3];
        t2[e3] = function() {
          return n3.apply(t2, Array.from(arguments));
        }, t2[e3] = function(e4, t3) {
          return function(n4) {
            let s2 = false;
            if ("callFunction" === t3) {
              const e5 = n4 && n4.type || u$1;
              s2 = e5 !== u$1;
            }
            const r2 = "callFunction" === t3 && !s2, i2 = this._initPromiseHub.exec();
            n4 = n4 || {};
            const { success: o2, fail: a2, complete: c2 } = te(n4), h2 = i2.then(() => s2 ? Promise.resolve() : q(M(t3, "invoke"), n4)).then(() => e4.call(this, n4)).then((e5) => s2 ? Promise.resolve(e5) : q(M(t3, "success"), e5).then(() => q(M(t3, "complete"), e5)).then(() => (r2 && Y(B, { type: J, content: e5 }), Promise.resolve(e5))), (e5) => s2 ? Promise.reject(e5) : q(M(t3, "fail"), e5).then(() => q(M(t3, "complete"), e5)).then(() => (Y(B, { type: J, content: e5 }), Promise.reject(e5))));
            if (!(o2 || a2 || c2))
              return h2;
            h2.then((e5) => {
              o2 && o2(e5), c2 && c2(e5), r2 && Y(B, { type: J, content: e5 });
            }, (e5) => {
              a2 && a2(e5), c2 && c2(e5), r2 && Y(B, { type: J, content: e5 });
            });
          };
        }(t2[e3], e3).bind(t2);
      }), t2.init = this.init, t2;
    }
  }();
  (() => {
    const e2 = E;
    let t2 = {};
    if (e2 && 1 === e2.length)
      t2 = e2[0], Ns = Ns.init(t2), Ns._isDefault = true;
    else {
      const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "database", "getCurrentUSerInfo", "importObject"];
      let n2;
      n2 = e2 && e2.length > 0 ? "应用有多个服务空间，请通过uniCloud.init方法指定要使用的服务空间" : "应用未关联服务空间，请在uniCloud目录右键关联服务空间", t3.forEach((e3) => {
        Ns[e3] = function() {
          return console.error(n2), Promise.reject(new ne({ code: "SYS_ERR", message: n2 }));
        };
      });
    }
    Object.assign(Ns, { get mixinDatacom() {
      return bs(Ns);
    } }), gs(Ns), Ns.addInterceptor = D, Ns.removeInterceptor = F, Ns.interceptObject = K;
  })();
  var Ds = Ns;
  const en$3 = {
    "uniCloud.component.add.success": "Success",
    "uniCloud.component.update.success": "Success",
    "uniCloud.component.remove.showModal.title": "Tips",
    "uniCloud.component.remove.showModal.content": "是否删除该数据"
  };
  const es = {
    "uniCloud.component.add.success": "新增成功",
    "uniCloud.component.update.success": "修改成功",
    "uniCloud.component.remove.showModal.title": "提示",
    "uniCloud.component.remove.showModal.content": "是否删除该数据"
  };
  const fr = {
    "uniCloud.component.add.success": "新增成功",
    "uniCloud.component.update.success": "修改成功",
    "uniCloud.component.remove.showModal.title": "提示",
    "uniCloud.component.remove.showModal.content": "是否删除该数据"
  };
  const zhHans$4 = {
    "uniCloud.component.add.success": "新增成功",
    "uniCloud.component.update.success": "修改成功",
    "uniCloud.component.remove.showModal.title": "提示",
    "uniCloud.component.remove.showModal.content": "是否删除该数据"
  };
  const zhHant$2 = {
    "uniCloud.component.add.success": "新增成功",
    "uniCloud.component.update.success": "修改成功",
    "uniCloud.component.remove.showModal.title": "提示",
    "uniCloud.component.remove.showModal.content": "是否刪除數據"
  };
  const messages$4 = {
    en: en$3,
    es,
    fr,
    "zh-Hans": zhHans$4,
    "zh-Hant": zhHant$2
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const isArray$1 = Array.isArray;
  const { t: t$4 } = initVueI18n(messages$4);
  const events = {
    load: "load",
    error: "error"
  };
  const pageMode = {
    add: "add",
    replace: "replace"
  };
  const loadMode = {
    auto: "auto",
    onready: "onready",
    manual: "manual"
  };
  const attrs = [
    "pageCurrent",
    "pageSize",
    "collection",
    "action",
    "field",
    "getcount",
    "orderby",
    "where",
    "groupby",
    "groupField",
    "distinct"
  ];
  const _sfc_main$U = {
    name: "UniClouddb",
    setup(props) {
      const dataListRef = props.ssrKey ? props.getone ? shallowSsrRef(void 0, props.ssrKey) : ssrRef([], props.ssrKey) : props.getone ? shallowSsrRef(void 0, "5u5guXfbccylRkAeOQb6CQ==") : ssrRef([], "ShLstodBGZ8WG/zIJWOIqg==");
      const instance2 = vue.getCurrentInstance();
      vue.onMounted(() => {
        if ((!dataListRef.value || dataListRef.value.length === 0) && !props.manual && props.loadtime === loadMode.auto) {
          instance2.proxy.loadData();
        }
      });
      return { dataList: dataListRef };
    },
    // 服务端serverPrefetch生命周期，用于服务端加载数据，等将来全端支持Suspense时，可以采用 Suspense + async setup 来实现一版
    async serverPrefetch() {
      if (!this.manual && this.loadtime === loadMode.auto) {
        return this.loadData();
      }
    },
    props: {
      options: {
        type: [Object, Array],
        default() {
          return {};
        }
      },
      spaceInfo: {
        type: Object,
        default() {
          return {};
        }
      },
      collection: {
        type: [String, Array],
        default: ""
      },
      action: {
        type: String,
        default: ""
      },
      field: {
        type: String,
        default: ""
      },
      orderby: {
        type: String,
        default: ""
      },
      where: {
        type: [String, Object],
        default: ""
      },
      pageData: {
        type: String,
        default: "add"
      },
      pageCurrent: {
        type: Number,
        default: 1
      },
      pageSize: {
        type: Number,
        default: 20
      },
      getcount: {
        type: [Boolean, String],
        default: false
      },
      getone: {
        type: [Boolean, String],
        default: false
      },
      gettree: {
        type: [Boolean, String, Object],
        default: false
      },
      gettreepath: {
        type: [Boolean, String],
        default: false
      },
      startwith: {
        type: String,
        default: ""
      },
      limitlevel: {
        type: Number,
        default: 10
      },
      groupby: {
        type: String,
        default: ""
      },
      groupField: {
        type: String,
        default: ""
      },
      distinct: {
        type: [Boolean, String],
        default: false
      },
      pageIndistinct: {
        type: [Boolean, String],
        default: false
      },
      foreignKey: {
        type: String,
        default: ""
      },
      loadtime: {
        type: String,
        default: "auto"
      },
      manual: {
        type: Boolean,
        default: false
      },
      ssrKey: {
        type: [String, Number],
        default: ""
      }
    },
    data() {
      return {
        loading: false,
        hasMore: false,
        paginationInternal: {},
        errorMessage: ""
      };
    },
    computed: {
      collectionArgs() {
        return isArray$1(this.collection) ? this.collection : [this.collection];
      },
      isLookup() {
        return isArray$1(this.collection) && this.collection.length > 1 || typeof this.collection === "string" && this.collection.indexOf(",") > -1;
      },
      mainCollection() {
        if (typeof this.collection === "string") {
          return this.collection.split(",")[0];
        }
        const mainQuery = JSON.parse(JSON.stringify(this.collection[0]));
        return mainQuery.$db[0].$param[0];
      }
    },
    created() {
      this._isEnded = false;
      this.paginationInternal = {
        current: this.pageCurrent,
        size: this.pageSize,
        count: 0
      };
      this.$watch(() => {
        var al = [];
        attrs.forEach((key) => {
          al.push(this[key]);
        });
        return al;
      }, (newValue, oldValue) => {
        this.paginationInternal.size = this.pageSize;
        if (newValue[0] !== oldValue[0]) {
          this.paginationInternal.current = this.pageCurrent;
        }
        if (this.loadtime === loadMode.manual) {
          return;
        }
        let needReset = false;
        for (let i2 = 2; i2 < newValue.length; i2++) {
          if (newValue[i2] !== oldValue[i2]) {
            needReset = true;
            break;
          }
        }
        if (needReset) {
          this.clear();
          this.reset();
        }
        this._execLoadData();
      });
    },
    methods: {
      loadData(args1, args2) {
        let callback = null;
        let clear = false;
        if (typeof args1 === "object") {
          if (args1.clear) {
            if (this.pageData === pageMode.replace) {
              this.clear();
            } else {
              clear = args1.clear;
            }
            this.reset();
          }
          if (args1.current !== void 0) {
            this.paginationInternal.current = args1.current;
          }
          if (typeof args2 === "function") {
            callback = args2;
          }
        } else if (typeof args1 === "function") {
          callback = args1;
        }
        return this._execLoadData(callback, clear);
      },
      loadMore() {
        if (this._isEnded || this.loading) {
          return;
        }
        if (this.pageData === pageMode.add) {
          this.paginationInternal.current++;
        }
        this._execLoadData();
      },
      refresh() {
        this.clear();
        this._execLoadData();
      },
      clear() {
        this._isEnded = false;
        this.dataList = [];
      },
      reset() {
        this.paginationInternal.current = 1;
      },
      add(value, {
        action,
        showToast = true,
        toastTitle,
        success,
        fail,
        complete,
        needConfirm = true,
        needLoading = true,
        loadingTitle = ""
      } = {}) {
        if (needLoading) {
          uni.showLoading({
            title: loadingTitle
          });
        }
        let db2 = Ds.database(this.spaceInfo);
        if (action) {
          db2 = db2.action(action);
        }
        db2.collection(this.mainCollection).add(value).then((res) => {
          success && success(res);
          if (showToast) {
            uni.showToast({
              title: toastTitle || t$4("uniCloud.component.add.success")
            });
          }
        }).catch((err) => {
          fail && fail(err);
          if (needConfirm) {
            uni.showModal({
              content: err.message,
              showCancel: false
            });
          }
        }).finally(() => {
          if (needLoading) {
            uni.hideLoading();
          }
          complete && complete();
        });
      },
      remove(id, {
        action,
        success,
        fail,
        complete,
        confirmTitle,
        confirmContent,
        needConfirm = true,
        needLoading = true,
        loadingTitle = ""
      } = {}) {
        if (!id || !id.length) {
          return;
        }
        if (!needConfirm) {
          this._execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle);
          return;
        }
        uni.showModal({
          title: confirmTitle || t$4("uniCloud.component.remove.showModal.title"),
          content: confirmContent || t$4("uniCloud.component.remove.showModal.content"),
          showCancel: true,
          success: (res) => {
            if (!res.confirm) {
              return;
            }
            this._execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle);
          }
        });
      },
      update(id, value, {
        action,
        showToast = true,
        toastTitle,
        success,
        fail,
        complete,
        needConfirm = true,
        needLoading = true,
        loadingTitle = ""
      } = {}) {
        if (needLoading) {
          uni.showLoading({
            title: loadingTitle
          });
        }
        let db2 = Ds.database(this.spaceInfo);
        if (action) {
          db2 = db2.action(action);
        }
        return db2.collection(this.mainCollection).doc(id).update(value).then((res) => {
          success && success(res);
          if (showToast) {
            uni.showToast({
              title: toastTitle || t$4("uniCloud.component.update.success")
            });
          }
        }).catch((err) => {
          fail && fail(err);
          if (needConfirm) {
            uni.showModal({
              content: err.message,
              showCancel: false
            });
          }
        }).finally(() => {
          if (needLoading) {
            uni.hideLoading();
          }
          complete && complete();
        });
      },
      getTemp(isTemp = true) {
        let db2 = Ds.database(this.spaceInfo);
        if (this.action) {
          db2 = db2.action(this.action);
        }
        db2 = db2.collection(...this.collectionArgs);
        if (this.foreignKey) {
          db2 = db2.foreignKey(this.foreignKey);
        }
        if (!(!this.where || !Object.keys(this.where).length)) {
          db2 = db2.where(this.where);
        }
        if (this.field) {
          db2 = db2.field(this.field);
        }
        if (this.groupby) {
          db2 = db2.groupBy(this.groupby);
        }
        if (this.groupField) {
          db2 = db2.groupField(this.groupField);
        }
        if (this.distinct === true) {
          db2 = db2.distinct();
        }
        if (this.orderby) {
          db2 = db2.orderBy(this.orderby);
        }
        const {
          current,
          size
        } = this.paginationInternal;
        const getOptions = {};
        if (this.getcount) {
          getOptions.getCount = this.getcount;
        }
        const treeOptions = {
          limitLevel: this.limitlevel,
          startWith: this.startwith
        };
        if (this.gettree) {
          getOptions.getTree = treeOptions;
        }
        if (this.gettreepath) {
          getOptions.getTreePath = treeOptions;
        }
        db2 = db2.skip(size * (current - 1)).limit(size);
        if (isTemp) {
          db2 = db2.getTemp(getOptions);
          db2.udb = this;
        } else {
          db2 = db2.get(getOptions);
        }
        return db2;
      },
      setResult(result) {
        if (result.code === 0) {
          this._execLoadDataSuccess(result);
        } else {
          this._execLoadDataFail(new Error(result.message));
        }
      },
      _execLoadData(callback, clear) {
        if (this.loading) {
          return;
        }
        this.loading = true;
        this.errorMessage = "";
        return this._getExec().then((res) => {
          this.loading = false;
          this._execLoadDataSuccess(res.result, callback, clear);
        }).catch((err) => {
          this.loading = false;
          this._execLoadDataFail(err, callback);
        });
      },
      _execLoadDataSuccess(result, callback, clear) {
        const {
          data: data2,
          count
        } = result;
        this._isEnded = count !== void 0 ? this.paginationInternal.current * this.paginationInternal.size >= count : data2.length < this.pageSize;
        this.hasMore = !this._isEnded;
        const data22 = this.getone ? data2.length ? data2[0] : void 0 : data2;
        if (this.getcount) {
          this.paginationInternal.count = count;
        }
        callback && callback(data22, this._isEnded, this.paginationInternal);
        this._dispatchEvent(events.load, data22);
        if (this.getone || this.pageData === pageMode.replace) {
          this.dataList = data22;
        } else {
          if (clear) {
            this.dataList = data22;
          } else {
            this.dataList.push(...data22);
          }
        }
      },
      _execLoadDataFail(err, callback) {
        this.errorMessage = err;
        callback && callback();
        this.$emit(events.error, err);
        {
          console.error(err);
        }
      },
      _getExec() {
        return this.getTemp(false);
      },
      _execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle) {
        if (!this.collection || !id) {
          return;
        }
        const ids = isArray$1(id) ? id : [id];
        if (!ids.length) {
          return;
        }
        if (needLoading) {
          uni.showLoading({
            mask: true,
            title: loadingTitle
          });
        }
        const db2 = Ds.database(this.spaceInfo);
        const dbCmd = db2.command;
        let exec = db2;
        if (action) {
          exec = exec.action(action);
        }
        exec.collection(this.mainCollection).where({
          _id: dbCmd.in(ids)
        }).remove().then((res) => {
          success && success(res.result);
          if (this.pageData === pageMode.replace) {
            this.refresh();
          } else {
            this.removeData(ids);
          }
        }).catch((err) => {
          fail && fail(err);
          if (needConfirm) {
            uni.showModal({
              content: err.message,
              showCancel: false
            });
          }
        }).finally(() => {
          if (needLoading) {
            uni.hideLoading();
          }
          complete && complete();
        });
      },
      removeData(ids) {
        const il = ids.slice(0);
        const dl = this.dataList;
        for (let i2 = dl.length - 1; i2 >= 0; i2--) {
          const index = il.indexOf(dl[i2]._id);
          if (index >= 0) {
            dl.splice(i2, 1);
            il.splice(index, 1);
          }
        }
      },
      _dispatchEvent(type, data2) {
        if (this._changeDataFunction) {
          this._changeDataFunction(data2, this._isEnded, this.paginationInternal);
        } else {
          this.$emit(type, data2, this._isEnded, this.paginationInternal);
        }
      }
    }
  };
  function _sfc_render$T(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.renderSlot(_ctx.$slots, "default", {
        options: $props.options,
        data: $setup.dataList,
        pagination: $data.paginationInternal,
        loading: $data.loading,
        hasMore: $data.hasMore,
        error: $data.errorMessage
      })
    ]);
  }
  const __easycom_4$3 = /* @__PURE__ */ _export_sfc(_sfc_main$U, [["render", _sfc_render$T], ["__file", "G:/HBuilderX.3.7.11.20230427/HBuilderX/plugins/uniapp-cli-vite/node_modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.vue"]]);
  const _sfc_main$T = {
    name: "UniGridItem",
    inject: ["grid"],
    props: {
      index: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        column: 0,
        showBorder: true,
        square: true,
        highlight: true,
        left: 0,
        top: 0,
        openNum: 2,
        width: 0,
        borderColor: "#e5e5e5"
      };
    },
    created() {
      this.column = this.grid.column;
      this.showBorder = this.grid.showBorder;
      this.square = this.grid.square;
      this.highlight = this.grid.highlight;
      this.top = this.hor === 0 ? this.grid.hor : this.hor;
      this.left = this.ver === 0 ? this.grid.ver : this.ver;
      this.borderColor = this.grid.borderColor;
      this.grid.children.push(this);
      this.width = this.grid.width;
    },
    beforeDestroy() {
      this.grid.children.forEach((item, index) => {
        if (item === this) {
          this.grid.children.splice(index, 1);
        }
      });
    },
    methods: {
      _onClick() {
        this.grid.change({
          detail: {
            index: this.index
          }
        });
      }
    }
  };
  function _sfc_render$S(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.width ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        style: vue.normalizeStyle("width:" + $data.width + ";" + ($data.square ? "height:" + $data.width : "")),
        class: "uni-grid-item"
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass([{ "uni-grid-item--border": $data.showBorder, "uni-grid-item--border-top": $data.showBorder && $props.index < $data.column, "uni-highlight": $data.highlight }, "uni-grid-item__box"]),
            style: vue.normalizeStyle({ "border-right-color": $data.borderColor, "border-bottom-color": $data.borderColor, "border-top-color": $data.borderColor }),
            onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
          },
          [
            vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
          ],
          6
          /* CLASS, STYLE */
        )
      ],
      4
      /* STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_3$3 = /* @__PURE__ */ _export_sfc(_sfc_main$T, [["render", _sfc_render$S], ["__scopeId", "data-v-7a807eb7"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.vue"]]);
  const _sfc_main$S = {
    name: "UniGrid",
    emits: ["change"],
    props: {
      // 每列显示个数
      column: {
        type: Number,
        default: 3
      },
      // 是否显示边框
      showBorder: {
        type: Boolean,
        default: true
      },
      // 边框颜色
      borderColor: {
        type: String,
        default: "#D2D2D2"
      },
      // 是否正方形显示,默认为 true
      square: {
        type: Boolean,
        default: true
      },
      highlight: {
        type: Boolean,
        default: true
      }
    },
    provide() {
      return {
        grid: this
      };
    },
    data() {
      const elId = `Uni_${Math.ceil(Math.random() * 1e6).toString(36)}`;
      return {
        elId,
        width: 0
      };
    },
    created() {
      this.children = [];
    },
    mounted() {
      this.$nextTick(() => {
        this.init();
      });
    },
    methods: {
      init() {
        setTimeout(() => {
          this._getSize((width) => {
            this.children.forEach((item, index) => {
              item.width = width;
            });
          });
        }, 50);
      },
      change(e2) {
        this.$emit("change", e2);
      },
      _getSize(fn) {
        uni.createSelectorQuery().in(this).select(`#${this.elId}`).boundingClientRect().exec((ret) => {
          this.width = parseInt((ret[0].width - 1) / this.column) + "px";
          fn(this.width);
        });
      }
    }
  };
  function _sfc_render$R(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-grid-wrap" }, [
      vue.createElementVNode("view", {
        id: $data.elId,
        ref: "uni-grid",
        class: vue.normalizeClass(["uni-grid", { "uni-grid--border": $props.showBorder }]),
        style: vue.normalizeStyle({ "border-left-color": $props.borderColor })
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ], 14, ["id"])
    ]);
  }
  const __easycom_4$2 = /* @__PURE__ */ _export_sfc(_sfc_main$S, [["render", _sfc_render$R], ["__scopeId", "data-v-07acefee"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-grid/components/uni-grid/uni-grid.vue"]]);
  const _sfc_main$R = {
    name: "UniStatusBar",
    data() {
      return {
        statusBarHeight: 20
      };
    },
    mounted() {
      this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight + "px";
    }
  };
  function _sfc_render$Q(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        style: vue.normalizeStyle({ height: $data.statusBarHeight }),
        class: "uni-status-bar"
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      4
      /* STYLE */
    );
  }
  const statusBar = /* @__PURE__ */ _export_sfc(_sfc_main$R, [["render", _sfc_render$Q], ["__scopeId", "data-v-7920e3e0"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar.vue"]]);
  const _sfc_main$Q = {
    components: {
      statusBar
    },
    data() {
      return {
        gridList: [],
        current: 0,
        hasLogin: false
      };
    },
    onShow() {
      this.hasLogin = Ds.getCurrentUserInfo().tokenExpired > Date.now();
    },
    onLoad() {
      let gridList = [];
      for (var i2 = 0; i2 < 3; i2++) {
        gridList.push(this.$t("grid.visibleToAll"));
      }
      for (var i2 = 0; i2 < 3; i2++) {
        gridList.push(this.$t("grid.invisibleToTourists"));
      }
      for (var i2 = 0; i2 < 3; i2++) {
        gridList.push(this.$t("grid.adminVisible"));
      }
      this.gridList = gridList;
    },
    methods: {
      change(e2) {
        uni.showToast({
          title: this.$t("grid.clickTip") + ` ${e2.detail.index + 1} ` + this.$t("grid.clickTipGrid"),
          icon: "none"
        });
      },
      /**
       * banner加载后触发的回调
       */
      onqueryload(data2) {
      },
      changeSwiper(e2) {
        this.current = e2.detail.current;
      },
      /**
       * 点击banner的处理
       */
      clickBannerItem(item) {
        if (item.open_url) {
          uni.navigateTo({
            url: "/uni_modules/uni-id-pages/pages/common/webview/webview?url=" + item.open_url + "&title=" + item.title,
            success: (res) => {
            },
            fail: () => {
            },
            complete: () => {
            }
          });
        }
      }
    }
  };
  function _sfc_render$P(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_statusBar = vue.resolveComponent("statusBar");
    const _component_unicloud_db = resolveEasycom(vue.resolveDynamicComponent("unicloud-db"), __easycom_4$3);
    const _component_uni_grid_item = resolveEasycom(vue.resolveDynamicComponent("uni-grid-item"), __easycom_3$3);
    const _component_uni_grid = resolveEasycom(vue.resolveDynamicComponent("uni-grid"), __easycom_4$2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "warp" }, [
      vue.createVNode(_component_statusBar),
      vue.createCommentVNode(" banner "),
      vue.createVNode(_component_unicloud_db, {
        ref: "bannerdb",
        collection: "opendb-banner",
        field: "_id,bannerfile,open_url,title",
        onLoad: $options.onqueryload
      }, {
        default: vue.withCtx(({ data: data2, loading, error: error2, options }) => [
          vue.createCommentVNode(" 当无banner数据时显示占位图 "),
          !(loading || data2.length) ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 0,
            class: "banner-image",
            src: "/static/uni-center/headers.png",
            mode: "aspectFill",
            draggable: false
          })) : (vue.openBlock(), vue.createElementBlock("swiper", {
            key: 1,
            class: "swiper-box",
            onChange: _cache[0] || (_cache[0] = (...args) => $options.changeSwiper && $options.changeSwiper(...args)),
            current: $data.current,
            "indicator-dots": ""
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(data2, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("swiper-item", {
                  key: item._id
                }, [
                  vue.createElementVNode("view", {
                    class: "swiper-item",
                    onClick: ($event) => $options.clickBannerItem(item)
                  }, [
                    vue.createElementVNode("image", {
                      class: "banner-image",
                      src: item.bannerfile.url,
                      mode: "aspectFill",
                      draggable: false
                    }, null, 8, ["src"])
                  ], 8, ["onClick"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ], 40, ["current"]))
        ]),
        _: 1
        /* STABLE */
      }, 8, ["onLoad"]),
      vue.createCommentVNode(" 宫格 "),
      vue.createElementVNode("view", { class: "section-box" }, [
        vue.createElementVNode("text", { class: "decoration" }),
        vue.createElementVNode(
          "text",
          { class: "section-text" },
          vue.toDisplayString(_ctx.$t("grid.grid")),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "example-body" }, [
        vue.createVNode(_component_uni_grid, {
          column: 3,
          highlight: true,
          onChange: $options.change
        }, {
          default: vue.withCtx(() => [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.gridList, (item, i2) => {
                return vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  [
                    i2 < 3 || i2 > 2 && i2 < 6 && $data.hasLogin || i2 > 5 && _ctx.uniIDHasRole("admin") ? (vue.openBlock(), vue.createBlock(_component_uni_grid_item, {
                      index: i2,
                      key: i2
                    }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", {
                          class: "grid-item-box",
                          style: { "background-color": "#fff" }
                        }, [
                          vue.createCommentVNode(` <image :src="'/static/grid/c'+(i+1)+'.png'" class="image" mode="aspectFill" /> `),
                          vue.createElementVNode(
                            "text",
                            { class: "big-number" },
                            vue.toDisplayString(i2 + 1),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "text" },
                            vue.toDisplayString(item),
                            1
                            /* TEXT */
                          )
                        ])
                      ]),
                      _: 2
                      /* DYNAMIC */
                    }, 1032, ["index"])) : vue.createCommentVNode("v-if", true)
                  ],
                  64
                  /* STABLE_FRAGMENT */
                );
              }),
              256
              /* UNKEYED_FRAGMENT */
            ))
          ]),
          _: 1
          /* STABLE */
        }, 8, ["onChange"])
      ])
    ]);
  }
  const PagesGridGrid = /* @__PURE__ */ _export_sfc(_sfc_main$Q, [["render", _sfc_render$P], ["__file", "G:/HBuilderProjects/Toby/pages/grid/grid.vue"]]);
  const icons = {
    "id": "2852637",
    "name": "uniui图标库",
    "font_family": "uniicons",
    "css_prefix_text": "uniui-",
    "description": "",
    "glyphs": [
      {
        "icon_id": "25027049",
        "name": "yanse",
        "font_class": "color",
        "unicode": "e6cf",
        "unicode_decimal": 59087
      },
      {
        "icon_id": "25027048",
        "name": "wallet",
        "font_class": "wallet",
        "unicode": "e6b1",
        "unicode_decimal": 59057
      },
      {
        "icon_id": "25015720",
        "name": "settings-filled",
        "font_class": "settings-filled",
        "unicode": "e6ce",
        "unicode_decimal": 59086
      },
      {
        "icon_id": "25015434",
        "name": "shimingrenzheng-filled",
        "font_class": "auth-filled",
        "unicode": "e6cc",
        "unicode_decimal": 59084
      },
      {
        "icon_id": "24934246",
        "name": "shop-filled",
        "font_class": "shop-filled",
        "unicode": "e6cd",
        "unicode_decimal": 59085
      },
      {
        "icon_id": "24934159",
        "name": "staff-filled-01",
        "font_class": "staff-filled",
        "unicode": "e6cb",
        "unicode_decimal": 59083
      },
      {
        "icon_id": "24932461",
        "name": "VIP-filled",
        "font_class": "vip-filled",
        "unicode": "e6c6",
        "unicode_decimal": 59078
      },
      {
        "icon_id": "24932462",
        "name": "plus_circle_fill",
        "font_class": "plus-filled",
        "unicode": "e6c7",
        "unicode_decimal": 59079
      },
      {
        "icon_id": "24932463",
        "name": "folder_add-filled",
        "font_class": "folder-add-filled",
        "unicode": "e6c8",
        "unicode_decimal": 59080
      },
      {
        "icon_id": "24932464",
        "name": "yanse-filled",
        "font_class": "color-filled",
        "unicode": "e6c9",
        "unicode_decimal": 59081
      },
      {
        "icon_id": "24932465",
        "name": "tune-filled",
        "font_class": "tune-filled",
        "unicode": "e6ca",
        "unicode_decimal": 59082
      },
      {
        "icon_id": "24932455",
        "name": "a-rilidaka-filled",
        "font_class": "calendar-filled",
        "unicode": "e6c0",
        "unicode_decimal": 59072
      },
      {
        "icon_id": "24932456",
        "name": "notification-filled",
        "font_class": "notification-filled",
        "unicode": "e6c1",
        "unicode_decimal": 59073
      },
      {
        "icon_id": "24932457",
        "name": "wallet-filled",
        "font_class": "wallet-filled",
        "unicode": "e6c2",
        "unicode_decimal": 59074
      },
      {
        "icon_id": "24932458",
        "name": "paihangbang-filled",
        "font_class": "medal-filled",
        "unicode": "e6c3",
        "unicode_decimal": 59075
      },
      {
        "icon_id": "24932459",
        "name": "gift-filled",
        "font_class": "gift-filled",
        "unicode": "e6c4",
        "unicode_decimal": 59076
      },
      {
        "icon_id": "24932460",
        "name": "fire-filled",
        "font_class": "fire-filled",
        "unicode": "e6c5",
        "unicode_decimal": 59077
      },
      {
        "icon_id": "24928001",
        "name": "refreshempty",
        "font_class": "refreshempty",
        "unicode": "e6bf",
        "unicode_decimal": 59071
      },
      {
        "icon_id": "24926853",
        "name": "location-ellipse",
        "font_class": "location-filled",
        "unicode": "e6af",
        "unicode_decimal": 59055
      },
      {
        "icon_id": "24926735",
        "name": "person-filled",
        "font_class": "person-filled",
        "unicode": "e69d",
        "unicode_decimal": 59037
      },
      {
        "icon_id": "24926703",
        "name": "personadd-filled",
        "font_class": "personadd-filled",
        "unicode": "e698",
        "unicode_decimal": 59032
      },
      {
        "icon_id": "24923351",
        "name": "back",
        "font_class": "back",
        "unicode": "e6b9",
        "unicode_decimal": 59065
      },
      {
        "icon_id": "24923352",
        "name": "forward",
        "font_class": "forward",
        "unicode": "e6ba",
        "unicode_decimal": 59066
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrow-right",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrowthinright",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrow-left",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrowthinleft",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrow-up",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrowthinup",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrow-down",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrowthindown",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "bottom",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "arrowdown",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "right",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "arrowright",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "top",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "arrowup",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "left",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "arrowleft",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923334",
        "name": "eye",
        "font_class": "eye",
        "unicode": "e651",
        "unicode_decimal": 58961
      },
      {
        "icon_id": "24923335",
        "name": "eye-filled",
        "font_class": "eye-filled",
        "unicode": "e66a",
        "unicode_decimal": 58986
      },
      {
        "icon_id": "24923336",
        "name": "eye-slash",
        "font_class": "eye-slash",
        "unicode": "e6b3",
        "unicode_decimal": 59059
      },
      {
        "icon_id": "24923337",
        "name": "eye-slash-filled",
        "font_class": "eye-slash-filled",
        "unicode": "e6b4",
        "unicode_decimal": 59060
      },
      {
        "icon_id": "24923305",
        "name": "info-filled",
        "font_class": "info-filled",
        "unicode": "e649",
        "unicode_decimal": 58953
      },
      {
        "icon_id": "24923299",
        "name": "reload-01",
        "font_class": "reload",
        "unicode": "e6b2",
        "unicode_decimal": 59058
      },
      {
        "icon_id": "24923195",
        "name": "mic_slash_fill",
        "font_class": "micoff-filled",
        "unicode": "e6b0",
        "unicode_decimal": 59056
      },
      {
        "icon_id": "24923165",
        "name": "map-pin-ellipse",
        "font_class": "map-pin-ellipse",
        "unicode": "e6ac",
        "unicode_decimal": 59052
      },
      {
        "icon_id": "24923166",
        "name": "map-pin",
        "font_class": "map-pin",
        "unicode": "e6ad",
        "unicode_decimal": 59053
      },
      {
        "icon_id": "24923167",
        "name": "location",
        "font_class": "location",
        "unicode": "e6ae",
        "unicode_decimal": 59054
      },
      {
        "icon_id": "24923064",
        "name": "starhalf",
        "font_class": "starhalf",
        "unicode": "e683",
        "unicode_decimal": 59011
      },
      {
        "icon_id": "24923065",
        "name": "star",
        "font_class": "star",
        "unicode": "e688",
        "unicode_decimal": 59016
      },
      {
        "icon_id": "24923066",
        "name": "star-filled",
        "font_class": "star-filled",
        "unicode": "e68f",
        "unicode_decimal": 59023
      },
      {
        "icon_id": "24899646",
        "name": "a-rilidaka",
        "font_class": "calendar",
        "unicode": "e6a0",
        "unicode_decimal": 59040
      },
      {
        "icon_id": "24899647",
        "name": "fire",
        "font_class": "fire",
        "unicode": "e6a1",
        "unicode_decimal": 59041
      },
      {
        "icon_id": "24899648",
        "name": "paihangbang",
        "font_class": "medal",
        "unicode": "e6a2",
        "unicode_decimal": 59042
      },
      {
        "icon_id": "24899649",
        "name": "font",
        "font_class": "font",
        "unicode": "e6a3",
        "unicode_decimal": 59043
      },
      {
        "icon_id": "24899650",
        "name": "gift",
        "font_class": "gift",
        "unicode": "e6a4",
        "unicode_decimal": 59044
      },
      {
        "icon_id": "24899651",
        "name": "link",
        "font_class": "link",
        "unicode": "e6a5",
        "unicode_decimal": 59045
      },
      {
        "icon_id": "24899652",
        "name": "notification",
        "font_class": "notification",
        "unicode": "e6a6",
        "unicode_decimal": 59046
      },
      {
        "icon_id": "24899653",
        "name": "staff",
        "font_class": "staff",
        "unicode": "e6a7",
        "unicode_decimal": 59047
      },
      {
        "icon_id": "24899654",
        "name": "VIP",
        "font_class": "vip",
        "unicode": "e6a8",
        "unicode_decimal": 59048
      },
      {
        "icon_id": "24899655",
        "name": "folder_add",
        "font_class": "folder-add",
        "unicode": "e6a9",
        "unicode_decimal": 59049
      },
      {
        "icon_id": "24899656",
        "name": "tune",
        "font_class": "tune",
        "unicode": "e6aa",
        "unicode_decimal": 59050
      },
      {
        "icon_id": "24899657",
        "name": "shimingrenzheng",
        "font_class": "auth",
        "unicode": "e6ab",
        "unicode_decimal": 59051
      },
      {
        "icon_id": "24899565",
        "name": "person",
        "font_class": "person",
        "unicode": "e699",
        "unicode_decimal": 59033
      },
      {
        "icon_id": "24899566",
        "name": "email-filled",
        "font_class": "email-filled",
        "unicode": "e69a",
        "unicode_decimal": 59034
      },
      {
        "icon_id": "24899567",
        "name": "phone-filled",
        "font_class": "phone-filled",
        "unicode": "e69b",
        "unicode_decimal": 59035
      },
      {
        "icon_id": "24899568",
        "name": "phone",
        "font_class": "phone",
        "unicode": "e69c",
        "unicode_decimal": 59036
      },
      {
        "icon_id": "24899570",
        "name": "email",
        "font_class": "email",
        "unicode": "e69e",
        "unicode_decimal": 59038
      },
      {
        "icon_id": "24899571",
        "name": "personadd",
        "font_class": "personadd",
        "unicode": "e69f",
        "unicode_decimal": 59039
      },
      {
        "icon_id": "24899558",
        "name": "chatboxes-filled",
        "font_class": "chatboxes-filled",
        "unicode": "e692",
        "unicode_decimal": 59026
      },
      {
        "icon_id": "24899559",
        "name": "contact",
        "font_class": "contact",
        "unicode": "e693",
        "unicode_decimal": 59027
      },
      {
        "icon_id": "24899560",
        "name": "chatbubble-filled",
        "font_class": "chatbubble-filled",
        "unicode": "e694",
        "unicode_decimal": 59028
      },
      {
        "icon_id": "24899561",
        "name": "contact-filled",
        "font_class": "contact-filled",
        "unicode": "e695",
        "unicode_decimal": 59029
      },
      {
        "icon_id": "24899562",
        "name": "chatboxes",
        "font_class": "chatboxes",
        "unicode": "e696",
        "unicode_decimal": 59030
      },
      {
        "icon_id": "24899563",
        "name": "chatbubble",
        "font_class": "chatbubble",
        "unicode": "e697",
        "unicode_decimal": 59031
      },
      {
        "icon_id": "24881290",
        "name": "upload-filled",
        "font_class": "upload-filled",
        "unicode": "e68e",
        "unicode_decimal": 59022
      },
      {
        "icon_id": "24881292",
        "name": "upload",
        "font_class": "upload",
        "unicode": "e690",
        "unicode_decimal": 59024
      },
      {
        "icon_id": "24881293",
        "name": "weixin",
        "font_class": "weixin",
        "unicode": "e691",
        "unicode_decimal": 59025
      },
      {
        "icon_id": "24881274",
        "name": "compose",
        "font_class": "compose",
        "unicode": "e67f",
        "unicode_decimal": 59007
      },
      {
        "icon_id": "24881275",
        "name": "qq",
        "font_class": "qq",
        "unicode": "e680",
        "unicode_decimal": 59008
      },
      {
        "icon_id": "24881276",
        "name": "download-filled",
        "font_class": "download-filled",
        "unicode": "e681",
        "unicode_decimal": 59009
      },
      {
        "icon_id": "24881277",
        "name": "pengyouquan",
        "font_class": "pyq",
        "unicode": "e682",
        "unicode_decimal": 59010
      },
      {
        "icon_id": "24881279",
        "name": "sound",
        "font_class": "sound",
        "unicode": "e684",
        "unicode_decimal": 59012
      },
      {
        "icon_id": "24881280",
        "name": "trash-filled",
        "font_class": "trash-filled",
        "unicode": "e685",
        "unicode_decimal": 59013
      },
      {
        "icon_id": "24881281",
        "name": "sound-filled",
        "font_class": "sound-filled",
        "unicode": "e686",
        "unicode_decimal": 59014
      },
      {
        "icon_id": "24881282",
        "name": "trash",
        "font_class": "trash",
        "unicode": "e687",
        "unicode_decimal": 59015
      },
      {
        "icon_id": "24881284",
        "name": "videocam-filled",
        "font_class": "videocam-filled",
        "unicode": "e689",
        "unicode_decimal": 59017
      },
      {
        "icon_id": "24881285",
        "name": "spinner-cycle",
        "font_class": "spinner-cycle",
        "unicode": "e68a",
        "unicode_decimal": 59018
      },
      {
        "icon_id": "24881286",
        "name": "weibo",
        "font_class": "weibo",
        "unicode": "e68b",
        "unicode_decimal": 59019
      },
      {
        "icon_id": "24881288",
        "name": "videocam",
        "font_class": "videocam",
        "unicode": "e68c",
        "unicode_decimal": 59020
      },
      {
        "icon_id": "24881289",
        "name": "download",
        "font_class": "download",
        "unicode": "e68d",
        "unicode_decimal": 59021
      },
      {
        "icon_id": "24879601",
        "name": "help",
        "font_class": "help",
        "unicode": "e679",
        "unicode_decimal": 59001
      },
      {
        "icon_id": "24879602",
        "name": "navigate-filled",
        "font_class": "navigate-filled",
        "unicode": "e67a",
        "unicode_decimal": 59002
      },
      {
        "icon_id": "24879603",
        "name": "plusempty",
        "font_class": "plusempty",
        "unicode": "e67b",
        "unicode_decimal": 59003
      },
      {
        "icon_id": "24879604",
        "name": "smallcircle",
        "font_class": "smallcircle",
        "unicode": "e67c",
        "unicode_decimal": 59004
      },
      {
        "icon_id": "24879605",
        "name": "minus-filled",
        "font_class": "minus-filled",
        "unicode": "e67d",
        "unicode_decimal": 59005
      },
      {
        "icon_id": "24879606",
        "name": "micoff",
        "font_class": "micoff",
        "unicode": "e67e",
        "unicode_decimal": 59006
      },
      {
        "icon_id": "24879588",
        "name": "closeempty",
        "font_class": "closeempty",
        "unicode": "e66c",
        "unicode_decimal": 58988
      },
      {
        "icon_id": "24879589",
        "name": "clear",
        "font_class": "clear",
        "unicode": "e66d",
        "unicode_decimal": 58989
      },
      {
        "icon_id": "24879590",
        "name": "navigate",
        "font_class": "navigate",
        "unicode": "e66e",
        "unicode_decimal": 58990
      },
      {
        "icon_id": "24879591",
        "name": "minus",
        "font_class": "minus",
        "unicode": "e66f",
        "unicode_decimal": 58991
      },
      {
        "icon_id": "24879592",
        "name": "image",
        "font_class": "image",
        "unicode": "e670",
        "unicode_decimal": 58992
      },
      {
        "icon_id": "24879593",
        "name": "mic",
        "font_class": "mic",
        "unicode": "e671",
        "unicode_decimal": 58993
      },
      {
        "icon_id": "24879594",
        "name": "paperplane",
        "font_class": "paperplane",
        "unicode": "e672",
        "unicode_decimal": 58994
      },
      {
        "icon_id": "24879595",
        "name": "close",
        "font_class": "close",
        "unicode": "e673",
        "unicode_decimal": 58995
      },
      {
        "icon_id": "24879596",
        "name": "help-filled",
        "font_class": "help-filled",
        "unicode": "e674",
        "unicode_decimal": 58996
      },
      {
        "icon_id": "24879597",
        "name": "plus-filled",
        "font_class": "paperplane-filled",
        "unicode": "e675",
        "unicode_decimal": 58997
      },
      {
        "icon_id": "24879598",
        "name": "plus",
        "font_class": "plus",
        "unicode": "e676",
        "unicode_decimal": 58998
      },
      {
        "icon_id": "24879599",
        "name": "mic-filled",
        "font_class": "mic-filled",
        "unicode": "e677",
        "unicode_decimal": 58999
      },
      {
        "icon_id": "24879600",
        "name": "image-filled",
        "font_class": "image-filled",
        "unicode": "e678",
        "unicode_decimal": 59e3
      },
      {
        "icon_id": "24855900",
        "name": "locked-filled",
        "font_class": "locked-filled",
        "unicode": "e668",
        "unicode_decimal": 58984
      },
      {
        "icon_id": "24855901",
        "name": "info",
        "font_class": "info",
        "unicode": "e669",
        "unicode_decimal": 58985
      },
      {
        "icon_id": "24855903",
        "name": "locked",
        "font_class": "locked",
        "unicode": "e66b",
        "unicode_decimal": 58987
      },
      {
        "icon_id": "24855884",
        "name": "camera-filled",
        "font_class": "camera-filled",
        "unicode": "e658",
        "unicode_decimal": 58968
      },
      {
        "icon_id": "24855885",
        "name": "chat-filled",
        "font_class": "chat-filled",
        "unicode": "e659",
        "unicode_decimal": 58969
      },
      {
        "icon_id": "24855886",
        "name": "camera",
        "font_class": "camera",
        "unicode": "e65a",
        "unicode_decimal": 58970
      },
      {
        "icon_id": "24855887",
        "name": "circle",
        "font_class": "circle",
        "unicode": "e65b",
        "unicode_decimal": 58971
      },
      {
        "icon_id": "24855888",
        "name": "checkmarkempty",
        "font_class": "checkmarkempty",
        "unicode": "e65c",
        "unicode_decimal": 58972
      },
      {
        "icon_id": "24855889",
        "name": "chat",
        "font_class": "chat",
        "unicode": "e65d",
        "unicode_decimal": 58973
      },
      {
        "icon_id": "24855890",
        "name": "circle-filled",
        "font_class": "circle-filled",
        "unicode": "e65e",
        "unicode_decimal": 58974
      },
      {
        "icon_id": "24855891",
        "name": "flag",
        "font_class": "flag",
        "unicode": "e65f",
        "unicode_decimal": 58975
      },
      {
        "icon_id": "24855892",
        "name": "flag-filled",
        "font_class": "flag-filled",
        "unicode": "e660",
        "unicode_decimal": 58976
      },
      {
        "icon_id": "24855893",
        "name": "gear-filled",
        "font_class": "gear-filled",
        "unicode": "e661",
        "unicode_decimal": 58977
      },
      {
        "icon_id": "24855894",
        "name": "home",
        "font_class": "home",
        "unicode": "e662",
        "unicode_decimal": 58978
      },
      {
        "icon_id": "24855895",
        "name": "home-filled",
        "font_class": "home-filled",
        "unicode": "e663",
        "unicode_decimal": 58979
      },
      {
        "icon_id": "24855896",
        "name": "gear",
        "font_class": "gear",
        "unicode": "e664",
        "unicode_decimal": 58980
      },
      {
        "icon_id": "24855897",
        "name": "smallcircle-filled",
        "font_class": "smallcircle-filled",
        "unicode": "e665",
        "unicode_decimal": 58981
      },
      {
        "icon_id": "24855898",
        "name": "map-filled",
        "font_class": "map-filled",
        "unicode": "e666",
        "unicode_decimal": 58982
      },
      {
        "icon_id": "24855899",
        "name": "map",
        "font_class": "map",
        "unicode": "e667",
        "unicode_decimal": 58983
      },
      {
        "icon_id": "24855825",
        "name": "refresh-filled",
        "font_class": "refresh-filled",
        "unicode": "e656",
        "unicode_decimal": 58966
      },
      {
        "icon_id": "24855826",
        "name": "refresh",
        "font_class": "refresh",
        "unicode": "e657",
        "unicode_decimal": 58967
      },
      {
        "icon_id": "24855808",
        "name": "cloud-upload",
        "font_class": "cloud-upload",
        "unicode": "e645",
        "unicode_decimal": 58949
      },
      {
        "icon_id": "24855809",
        "name": "cloud-download-filled",
        "font_class": "cloud-download-filled",
        "unicode": "e646",
        "unicode_decimal": 58950
      },
      {
        "icon_id": "24855810",
        "name": "cloud-download",
        "font_class": "cloud-download",
        "unicode": "e647",
        "unicode_decimal": 58951
      },
      {
        "icon_id": "24855811",
        "name": "cloud-upload-filled",
        "font_class": "cloud-upload-filled",
        "unicode": "e648",
        "unicode_decimal": 58952
      },
      {
        "icon_id": "24855813",
        "name": "redo",
        "font_class": "redo",
        "unicode": "e64a",
        "unicode_decimal": 58954
      },
      {
        "icon_id": "24855814",
        "name": "images-filled",
        "font_class": "images-filled",
        "unicode": "e64b",
        "unicode_decimal": 58955
      },
      {
        "icon_id": "24855815",
        "name": "undo-filled",
        "font_class": "undo-filled",
        "unicode": "e64c",
        "unicode_decimal": 58956
      },
      {
        "icon_id": "24855816",
        "name": "more",
        "font_class": "more",
        "unicode": "e64d",
        "unicode_decimal": 58957
      },
      {
        "icon_id": "24855817",
        "name": "more-filled",
        "font_class": "more-filled",
        "unicode": "e64e",
        "unicode_decimal": 58958
      },
      {
        "icon_id": "24855818",
        "name": "undo",
        "font_class": "undo",
        "unicode": "e64f",
        "unicode_decimal": 58959
      },
      {
        "icon_id": "24855819",
        "name": "images",
        "font_class": "images",
        "unicode": "e650",
        "unicode_decimal": 58960
      },
      {
        "icon_id": "24855821",
        "name": "paperclip",
        "font_class": "paperclip",
        "unicode": "e652",
        "unicode_decimal": 58962
      },
      {
        "icon_id": "24855822",
        "name": "settings",
        "font_class": "settings",
        "unicode": "e653",
        "unicode_decimal": 58963
      },
      {
        "icon_id": "24855823",
        "name": "search",
        "font_class": "search",
        "unicode": "e654",
        "unicode_decimal": 58964
      },
      {
        "icon_id": "24855824",
        "name": "redo-filled",
        "font_class": "redo-filled",
        "unicode": "e655",
        "unicode_decimal": 58965
      },
      {
        "icon_id": "24841702",
        "name": "list",
        "font_class": "list",
        "unicode": "e644",
        "unicode_decimal": 58948
      },
      {
        "icon_id": "24841489",
        "name": "mail-open-filled",
        "font_class": "mail-open-filled",
        "unicode": "e63a",
        "unicode_decimal": 58938
      },
      {
        "icon_id": "24841491",
        "name": "hand-thumbsdown-filled",
        "font_class": "hand-down-filled",
        "unicode": "e63c",
        "unicode_decimal": 58940
      },
      {
        "icon_id": "24841492",
        "name": "hand-thumbsdown",
        "font_class": "hand-down",
        "unicode": "e63d",
        "unicode_decimal": 58941
      },
      {
        "icon_id": "24841493",
        "name": "hand-thumbsup-filled",
        "font_class": "hand-up-filled",
        "unicode": "e63e",
        "unicode_decimal": 58942
      },
      {
        "icon_id": "24841494",
        "name": "hand-thumbsup",
        "font_class": "hand-up",
        "unicode": "e63f",
        "unicode_decimal": 58943
      },
      {
        "icon_id": "24841496",
        "name": "heart-filled",
        "font_class": "heart-filled",
        "unicode": "e641",
        "unicode_decimal": 58945
      },
      {
        "icon_id": "24841498",
        "name": "mail-open",
        "font_class": "mail-open",
        "unicode": "e643",
        "unicode_decimal": 58947
      },
      {
        "icon_id": "24841488",
        "name": "heart",
        "font_class": "heart",
        "unicode": "e639",
        "unicode_decimal": 58937
      },
      {
        "icon_id": "24839963",
        "name": "loop",
        "font_class": "loop",
        "unicode": "e633",
        "unicode_decimal": 58931
      },
      {
        "icon_id": "24839866",
        "name": "pulldown",
        "font_class": "pulldown",
        "unicode": "e632",
        "unicode_decimal": 58930
      },
      {
        "icon_id": "24813798",
        "name": "scan",
        "font_class": "scan",
        "unicode": "e62a",
        "unicode_decimal": 58922
      },
      {
        "icon_id": "24813786",
        "name": "bars",
        "font_class": "bars",
        "unicode": "e627",
        "unicode_decimal": 58919
      },
      {
        "icon_id": "24813788",
        "name": "cart-filled",
        "font_class": "cart-filled",
        "unicode": "e629",
        "unicode_decimal": 58921
      },
      {
        "icon_id": "24813790",
        "name": "checkbox",
        "font_class": "checkbox",
        "unicode": "e62b",
        "unicode_decimal": 58923
      },
      {
        "icon_id": "24813791",
        "name": "checkbox-filled",
        "font_class": "checkbox-filled",
        "unicode": "e62c",
        "unicode_decimal": 58924
      },
      {
        "icon_id": "24813794",
        "name": "shop",
        "font_class": "shop",
        "unicode": "e62f",
        "unicode_decimal": 58927
      },
      {
        "icon_id": "24813795",
        "name": "headphones",
        "font_class": "headphones",
        "unicode": "e630",
        "unicode_decimal": 58928
      },
      {
        "icon_id": "24813796",
        "name": "cart",
        "font_class": "cart",
        "unicode": "e631",
        "unicode_decimal": 58929
      }
    ]
  };
  const getVal$1 = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  const _sfc_main$P = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: icons.glyphs
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v2) => v2.font_class === this.type);
        if (code) {
          return unescape(`%u${code.unicode}`);
        }
        return "";
      },
      iconSize() {
        return getVal$1(this.size);
      }
    },
    methods: {
      _onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$O(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "text",
      {
        style: vue.normalizeStyle({ color: $props.color, "font-size": $options.iconSize }),
        class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
      },
      null,
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$a = /* @__PURE__ */ _export_sfc(_sfc_main$P, [["render", _sfc_render$O], ["__scopeId", "data-v-d31e1c47"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const getVal = (val) => typeof val === "number" ? val + "px" : val;
  const _sfc_main$O = {
    name: "UniNavBar",
    components: {
      statusBar
    },
    emits: ["clickLeft", "clickRight", "clickTitle"],
    props: {
      dark: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        default: ""
      },
      leftText: {
        type: String,
        default: ""
      },
      rightText: {
        type: String,
        default: ""
      },
      leftIcon: {
        type: String,
        default: ""
      },
      rightIcon: {
        type: String,
        default: ""
      },
      fixed: {
        type: [Boolean, String],
        default: false
      },
      color: {
        type: String,
        default: ""
      },
      backgroundColor: {
        type: String,
        default: ""
      },
      statusBar: {
        type: [Boolean, String],
        default: false
      },
      shadow: {
        type: [Boolean, String],
        default: false
      },
      border: {
        type: [Boolean, String],
        default: true
      },
      height: {
        type: [Number, String],
        default: 44
      },
      leftWidth: {
        type: [Number, String],
        default: 60
      },
      rightWidth: {
        type: [Number, String],
        default: 60
      },
      stat: {
        type: [Boolean, String],
        default: ""
      }
    },
    computed: {
      themeBgColor() {
        if (this.dark) {
          if (this.backgroundColor) {
            return this.backgroundColor;
          } else {
            return this.dark ? "#333" : "#FFF";
          }
        }
        return this.backgroundColor || "#FFF";
      },
      themeColor() {
        if (this.dark) {
          if (this.color) {
            return this.color;
          } else {
            return this.dark ? "#fff" : "#333";
          }
        }
        return this.color || "#333";
      },
      navbarHeight() {
        return getVal(this.height);
      },
      leftIconWidth() {
        return getVal(this.leftWidth);
      },
      rightIconWidth() {
        return getVal(this.rightWidth);
      }
    },
    mounted() {
      if (uni.report && this.stat && this.title !== "") {
        uni.report("title", this.title);
      }
    },
    methods: {
      onClickLeft() {
        this.$emit("clickLeft");
      },
      onClickRight() {
        this.$emit("clickRight");
      },
      onClickTitle() {
        this.$emit("clickTitle");
      }
    }
  };
  function _sfc_render$N(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_status_bar = vue.resolveComponent("status-bar");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["uni-navbar", { "uni-dark": $props.dark, "uni-nvue-fixed": $props.fixed }])
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["uni-navbar__content", { "uni-navbar--fixed": $props.fixed, "uni-navbar--shadow": $props.shadow, "uni-navbar--border": $props.border }]),
            style: vue.normalizeStyle({ "background-color": $options.themeBgColor })
          },
          [
            $props.statusBar ? (vue.openBlock(), vue.createBlock(_component_status_bar, { key: 0 })) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode(
              "view",
              {
                style: vue.normalizeStyle({ color: $options.themeColor, backgroundColor: $options.themeBgColor, height: $options.navbarHeight }),
                class: "uni-navbar__header"
              },
              [
                vue.createElementVNode(
                  "view",
                  {
                    onClick: _cache[0] || (_cache[0] = (...args) => $options.onClickLeft && $options.onClickLeft(...args)),
                    class: "uni-navbar__header-btns uni-navbar__header-btns-left",
                    style: vue.normalizeStyle({ width: $options.leftIconWidth })
                  },
                  [
                    vue.renderSlot(_ctx.$slots, "left", {}, () => [
                      $props.leftIcon.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "uni-navbar__content_view"
                      }, [
                        vue.createVNode(_component_uni_icons, {
                          color: $options.themeColor,
                          type: $props.leftIcon,
                          size: "20"
                        }, null, 8, ["color", "type"])
                      ])) : vue.createCommentVNode("v-if", true),
                      $props.leftText.length ? (vue.openBlock(), vue.createElementBlock(
                        "view",
                        {
                          key: 1,
                          class: vue.normalizeClass([{ "uni-navbar-btn-icon-left": !$props.leftIcon.length > 0 }, "uni-navbar-btn-text"])
                        },
                        [
                          vue.createElementVNode(
                            "text",
                            {
                              style: vue.normalizeStyle({ color: $options.themeColor, fontSize: "12px" })
                            },
                            vue.toDisplayString($props.leftText),
                            5
                            /* TEXT, STYLE */
                          )
                        ],
                        2
                        /* CLASS */
                      )) : vue.createCommentVNode("v-if", true)
                    ], true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode("view", {
                  class: "uni-navbar__header-container",
                  onClick: _cache[1] || (_cache[1] = (...args) => $options.onClickTitle && $options.onClickTitle(...args))
                }, [
                  vue.renderSlot(_ctx.$slots, "default", {}, () => [
                    $props.title.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "uni-navbar__header-container-inner"
                    }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: "uni-nav-bar-text uni-ellipsis-1",
                          style: vue.normalizeStyle({ color: $options.themeColor })
                        },
                        vue.toDisplayString($props.title),
                        5
                        /* TEXT, STYLE */
                      )
                    ])) : vue.createCommentVNode("v-if", true)
                  ], true)
                ]),
                vue.createElementVNode(
                  "view",
                  {
                    onClick: _cache[2] || (_cache[2] = (...args) => $options.onClickRight && $options.onClickRight(...args)),
                    class: "uni-navbar__header-btns uni-navbar__header-btns-right",
                    style: vue.normalizeStyle({ width: $options.rightIconWidth })
                  },
                  [
                    vue.renderSlot(_ctx.$slots, "right", {}, () => [
                      $props.rightIcon.length ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
                        vue.createVNode(_component_uni_icons, {
                          color: $options.themeColor,
                          type: $props.rightIcon,
                          size: "22"
                        }, null, 8, ["color", "type"])
                      ])) : vue.createCommentVNode("v-if", true),
                      $props.rightText.length && !$props.rightIcon.length ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 1,
                        class: "uni-navbar-btn-text"
                      }, [
                        vue.createElementVNode(
                          "text",
                          {
                            class: "uni-nav-bar-right-text",
                            style: vue.normalizeStyle({ color: $options.themeColor })
                          },
                          vue.toDisplayString($props.rightText),
                          5
                          /* TEXT, STYLE */
                        )
                      ])) : vue.createCommentVNode("v-if", true)
                    ], true)
                  ],
                  4
                  /* STYLE */
                )
              ],
              4
              /* STYLE */
            )
          ],
          6
          /* CLASS, STYLE */
        ),
        $props.fixed ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-navbar__placeholder"
        }, [
          $props.statusBar ? (vue.openBlock(), vue.createBlock(_component_status_bar, { key: 0 })) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode(
            "view",
            {
              class: "uni-navbar__placeholder-view",
              style: vue.normalizeStyle({ height: $options.navbarHeight })
            },
            null,
            4
            /* STYLE */
          )
        ])) : vue.createCommentVNode("v-if", true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_0$9 = /* @__PURE__ */ _export_sfc(_sfc_main$O, [["render", _sfc_render$N], ["__scopeId", "data-v-26544265"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue"]]);
  function pad(str, length = 2) {
    str += "";
    while (str.length < length) {
      str = "0" + str;
    }
    return str.slice(-length);
  }
  const parser = {
    yyyy: (dateObj) => {
      return pad(dateObj.year, 4);
    },
    yy: (dateObj) => {
      return pad(dateObj.year);
    },
    MM: (dateObj) => {
      return pad(dateObj.month);
    },
    M: (dateObj) => {
      return dateObj.month;
    },
    dd: (dateObj) => {
      return pad(dateObj.day);
    },
    d: (dateObj) => {
      return dateObj.day;
    },
    hh: (dateObj) => {
      return pad(dateObj.hour);
    },
    h: (dateObj) => {
      return dateObj.hour;
    },
    mm: (dateObj) => {
      return pad(dateObj.minute);
    },
    m: (dateObj) => {
      return dateObj.minute;
    },
    ss: (dateObj) => {
      return pad(dateObj.second);
    },
    s: (dateObj) => {
      return dateObj.second;
    },
    SSS: (dateObj) => {
      return pad(dateObj.millisecond, 3);
    },
    S: (dateObj) => {
      return dateObj.millisecond;
    }
  };
  function getDate(time) {
    if (time instanceof Date) {
      return time;
    }
    switch (typeof time) {
      case "string": {
        if (time.indexOf("T") > -1) {
          return new Date(time);
        }
        return new Date(time.replace(/-/g, "/"));
      }
      default:
        return new Date(time);
    }
  }
  function formatDate(date, format2 = "yyyy/MM/dd hh:mm:ss") {
    if (!date && date !== 0) {
      return "";
    }
    date = getDate(date);
    const dateObj = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      millisecond: date.getMilliseconds()
    };
    const tokenRegExp = /yyyy|yy|MM|M|dd|d|hh|h|mm|m|ss|s|SSS|SS|S/;
    let flag = true;
    let result = format2;
    while (flag) {
      flag = false;
      result = result.replace(tokenRegExp, function(matched) {
        flag = true;
        return parser[matched](dateObj);
      });
    }
    return result;
  }
  function friendlyDate(time, {
    locale = "zh",
    threshold = [6e4, 36e5],
    format: format2 = "yyyy/MM/dd hh:mm:ss"
  }) {
    if (time === "-") {
      return time;
    }
    if (!time && time !== 0) {
      return "";
    }
    const localeText = {
      zh: {
        year: "年",
        month: "月",
        day: "天",
        hour: "小时",
        minute: "分钟",
        second: "秒",
        ago: "前",
        later: "后",
        justNow: "刚刚",
        soon: "马上",
        template: "{num}{unit}{suffix}"
      },
      en: {
        year: "year",
        month: "month",
        day: "day",
        hour: "hour",
        minute: "minute",
        second: "second",
        ago: "ago",
        later: "later",
        justNow: "just now",
        soon: "soon",
        template: "{num} {unit} {suffix}"
      }
    };
    const text = localeText[locale] || localeText.zh;
    let date = getDate(time);
    let ms2 = date.getTime() - Date.now();
    let absMs = Math.abs(ms2);
    if (absMs < threshold[0]) {
      return ms2 < 0 ? text.justNow : text.soon;
    }
    if (absMs >= threshold[1]) {
      return formatDate(date, format2);
    }
    let num;
    let unit;
    let suffix = text.later;
    if (ms2 < 0) {
      suffix = text.ago;
      ms2 = -ms2;
    }
    const seconds = Math.floor(ms2 / 1e3);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    switch (true) {
      case years > 0:
        num = years;
        unit = text.year;
        break;
      case months > 0:
        num = months;
        unit = text.month;
        break;
      case days > 0:
        num = days;
        unit = text.day;
        break;
      case hours > 0:
        num = hours;
        unit = text.hour;
        break;
      case minutes > 0:
        num = minutes;
        unit = text.minute;
        break;
      default:
        num = seconds;
        unit = text.second;
        break;
    }
    if (locale === "en") {
      if (num === 1) {
        num = "a";
      } else {
        unit += "s";
      }
    }
    return text.template.replace(/{\s*num\s*}/g, num + "").replace(/{\s*unit\s*}/g, unit).replace(
      /{\s*suffix\s*}/g,
      suffix
    );
  }
  const _sfc_main$N = {
    name: "uniDateformat",
    props: {
      date: {
        type: [Object, String, Number],
        default() {
          return "-";
        }
      },
      locale: {
        type: String,
        default: "zh"
      },
      threshold: {
        type: Array,
        default() {
          return [0, 0];
        }
      },
      format: {
        type: String,
        default: "yyyy/MM/dd hh:mm:ss"
      },
      // refreshRate使用不当可能导致性能问题，谨慎使用
      refreshRate: {
        type: [Number, String],
        default: 0
      }
    },
    data() {
      return {
        refreshMark: 0
      };
    },
    computed: {
      dateShow() {
        this.refreshMark;
        return friendlyDate(this.date, {
          locale: this.locale,
          threshold: this.threshold,
          format: this.format
        });
      }
    },
    watch: {
      refreshRate: {
        handler() {
          this.setAutoRefresh();
        },
        immediate: true
      }
    },
    methods: {
      refresh() {
        this.refreshMark++;
      },
      setAutoRefresh() {
        clearInterval(this.refreshInterval);
        if (this.refreshRate) {
          this.refreshInterval = setInterval(() => {
            this.refresh();
          }, parseInt(this.refreshRate));
        }
      }
    }
  };
  function _sfc_render$M(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "text",
      null,
      vue.toDisplayString($options.dateShow),
      1
      /* TEXT */
    );
  }
  const __easycom_0$8 = /* @__PURE__ */ _export_sfc(_sfc_main$N, [["render", _sfc_render$M], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-dateformat/components/uni-dateformat/uni-dateformat.vue"]]);
  const _sfc_main$M = {
    name: "UniBadge",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: "error"
      },
      inverted: {
        type: Boolean,
        default: false
      },
      isDot: {
        type: Boolean,
        default: false
      },
      maxNum: {
        type: Number,
        default: 99
      },
      absolute: {
        type: String,
        default: ""
      },
      offset: {
        type: Array,
        default() {
          return [0, 0];
        }
      },
      text: {
        type: [String, Number],
        default: ""
      },
      size: {
        type: String,
        default: "small"
      },
      customStyle: {
        type: Object,
        default() {
          return {};
        }
      }
    },
    data() {
      return {};
    },
    computed: {
      width() {
        return String(this.text).length * 8 + 12;
      },
      classNames() {
        const {
          inverted,
          type,
          size,
          absolute
        } = this;
        return [
          inverted ? "uni-badge--" + type + "-inverted" : "",
          "uni-badge--" + type,
          "uni-badge--" + size,
          absolute ? "uni-badge--absolute" : ""
        ].join(" ");
      },
      positionStyle() {
        if (!this.absolute)
          return {};
        let w2 = this.width / 2, h2 = 10;
        if (this.isDot) {
          w2 = 5;
          h2 = 5;
        }
        const x2 = `${-w2 + this.offset[0]}px`;
        const y2 = `${-h2 + this.offset[1]}px`;
        const whiteList = {
          rightTop: {
            right: x2,
            top: y2
          },
          rightBottom: {
            right: x2,
            bottom: y2
          },
          leftBottom: {
            left: x2,
            bottom: y2
          },
          leftTop: {
            left: x2,
            top: y2
          }
        };
        const match = whiteList[this.absolute];
        return match ? match : whiteList["rightTop"];
      },
      dotStyle() {
        if (!this.isDot)
          return {};
        return {
          width: "10px",
          minWidth: "0",
          height: "10px",
          padding: "0",
          borderRadius: "10px"
        };
      },
      displayValue() {
        const {
          isDot,
          text,
          maxNum
        } = this;
        return isDot ? "" : Number(text) > maxNum ? `${maxNum}+` : text;
      }
    },
    methods: {
      onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$L(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-badge--x" }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
      $props.text ? (vue.openBlock(), vue.createElementBlock(
        "text",
        {
          key: 0,
          class: vue.normalizeClass([$options.classNames, "uni-badge"]),
          style: vue.normalizeStyle([$options.positionStyle, $props.customStyle, $options.dotStyle]),
          onClick: _cache[0] || (_cache[0] = ($event) => $options.onClick())
        },
        vue.toDisplayString($options.displayValue),
        7
        /* TEXT, CLASS, STYLE */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_1$5 = /* @__PURE__ */ _export_sfc(_sfc_main$M, [["render", _sfc_render$L], ["__scopeId", "data-v-c97cb896"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-badge/components/uni-badge/uni-badge.vue"]]);
  const _sfc_main$L = {
    name: "UniListItem",
    emits: ["click", "switchChange"],
    props: {
      direction: {
        type: String,
        default: "row"
      },
      title: {
        type: String,
        default: ""
      },
      note: {
        type: String,
        default: ""
      },
      ellipsis: {
        type: [Number, String],
        default: 0
      },
      disabled: {
        type: [Boolean, String],
        default: false
      },
      clickable: {
        type: Boolean,
        default: false
      },
      showArrow: {
        type: [Boolean, String],
        default: false
      },
      link: {
        type: [Boolean, String],
        default: false
      },
      to: {
        type: String,
        default: ""
      },
      showBadge: {
        type: [Boolean, String],
        default: false
      },
      showSwitch: {
        type: [Boolean, String],
        default: false
      },
      switchChecked: {
        type: [Boolean, String],
        default: false
      },
      badgeText: {
        type: String,
        default: ""
      },
      badgeType: {
        type: String,
        default: "success"
      },
      badgeStyle: {
        type: Object,
        default() {
          return {};
        }
      },
      rightText: {
        type: String,
        default: ""
      },
      thumb: {
        type: String,
        default: ""
      },
      thumbSize: {
        type: String,
        default: "base"
      },
      showExtraIcon: {
        type: [Boolean, String],
        default: false
      },
      extraIcon: {
        type: Object,
        default() {
          return {
            type: "",
            color: "#000000",
            size: 20,
            customPrefix: ""
          };
        }
      },
      border: {
        type: Boolean,
        default: true
      },
      customStyle: {
        type: Object,
        default() {
          return {
            padding: "",
            backgroundColor: "#FFFFFF"
          };
        }
      },
      keepScrollPosition: {
        type: Boolean,
        default: false
      }
    },
    watch: {
      "customStyle.padding": {
        handler(padding) {
          if (typeof padding == "number") {
            padding += "";
          }
          let paddingArr = padding.split(" ");
          if (paddingArr.length === 1) {
            const allPadding = paddingArr[0];
            this.padding = {
              "top": allPadding,
              "right": allPadding,
              "bottom": allPadding,
              "left": allPadding
            };
          } else if (paddingArr.length === 2) {
            const [verticalPadding, horizontalPadding] = paddingArr;
            this.padding = {
              "top": verticalPadding,
              "right": horizontalPadding,
              "bottom": verticalPadding,
              "left": horizontalPadding
            };
          } else if (paddingArr.length === 4) {
            const [topPadding, rightPadding, bottomPadding, leftPadding] = paddingArr;
            this.padding = {
              "top": topPadding,
              "right": rightPadding,
              "bottom": bottomPadding,
              "left": leftPadding
            };
          }
        },
        immediate: true
      }
    },
    // inject: ['list'],
    data() {
      return {
        isFirstChild: false,
        padding: {
          top: "",
          right: "",
          bottom: "",
          left: ""
        }
      };
    },
    mounted() {
      this.list = this.getForm();
      if (this.list) {
        if (!this.list.firstChildAppend) {
          this.list.firstChildAppend = true;
          this.isFirstChild = true;
        }
      }
    },
    methods: {
      /**
       * 获取父元素实例
       */
      getForm(name = "uniList") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      },
      onClick() {
        if (this.to !== "") {
          this.openPage();
          return;
        }
        if (this.clickable || this.link) {
          this.$emit("click", {
            data: {}
          });
        }
      },
      onSwitchChange(e2) {
        this.$emit("switchChange", e2.detail);
      },
      openPage() {
        if (["navigateTo", "redirectTo", "reLaunch", "switchTab"].indexOf(this.link) !== -1) {
          this.pageApi(this.link);
        } else {
          this.pageApi("navigateTo");
        }
      },
      pageApi(api) {
        let callback = {
          url: this.to,
          success: (res) => {
            this.$emit("click", {
              data: res
            });
          },
          fail: (err) => {
            this.$emit("click", {
              data: err
            });
          }
        };
        switch (api) {
          case "navigateTo":
            uni.navigateTo(callback);
            break;
          case "redirectTo":
            uni.redirectTo(callback);
            break;
          case "reLaunch":
            uni.reLaunch(callback);
            break;
          case "switchTab":
            uni.switchTab(callback);
            break;
          default:
            uni.navigateTo(callback);
        }
      }
    }
  };
  function _sfc_render$K(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    const _component_uni_badge = resolveEasycom(vue.resolveDynamicComponent("uni-badge"), __easycom_1$5);
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass([{ "uni-list-item--disabled": $props.disabled }, "uni-list-item"]),
      style: vue.normalizeStyle({ "background-color": $props.customStyle.backgroundColor }),
      "hover-class": !$props.clickable && !$props.link || $props.disabled || $props.showSwitch ? "" : "uni-list-item--hover",
      onClick: _cache[1] || (_cache[1] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      !$data.isFirstChild ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: vue.normalizeClass(["border--left", { "uni-list--border": $props.border }])
        },
        null,
        2
        /* CLASS */
      )) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["uni-list-item__container", { "container--right": $props.showArrow || $props.link, "flex--direction": $props.direction === "column" }]),
          style: vue.normalizeStyle({ paddingTop: $data.padding.top, paddingLeft: $data.padding.left, paddingRight: $data.padding.right, paddingBottom: $data.padding.bottom })
        },
        [
          vue.renderSlot(_ctx.$slots, "header", {}, () => [
            vue.createElementVNode("view", { class: "uni-list-item__header" }, [
              $props.thumb ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "uni-list-item__icon"
              }, [
                vue.createElementVNode("image", {
                  src: $props.thumb,
                  class: vue.normalizeClass(["uni-list-item__icon-img", ["uni-list--" + $props.thumbSize]])
                }, null, 10, ["src"])
              ])) : $props.showExtraIcon ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "uni-list-item__icon"
              }, [
                vue.createVNode(_component_uni_icons, {
                  customPrefix: $props.extraIcon.customPrefix,
                  color: $props.extraIcon.color,
                  size: $props.extraIcon.size,
                  type: $props.extraIcon.type
                }, null, 8, ["customPrefix", "color", "size", "type"])
              ])) : vue.createCommentVNode("v-if", true)
            ])
          ], true),
          vue.renderSlot(_ctx.$slots, "body", {}, () => [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["uni-list-item__content", { "uni-list-item__content--center": $props.thumb || $props.showExtraIcon || $props.showBadge || $props.showSwitch }])
              },
              [
                $props.title ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: 0,
                    class: vue.normalizeClass(["uni-list-item__content-title", [$props.ellipsis !== 0 && $props.ellipsis <= 2 ? "uni-ellipsis-" + $props.ellipsis : ""]])
                  },
                  vue.toDisplayString($props.title),
                  3
                  /* TEXT, CLASS */
                )) : vue.createCommentVNode("v-if", true),
                $props.note ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: 1,
                    class: "uni-list-item__content-note"
                  },
                  vue.toDisplayString($props.note),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true)
              ],
              2
              /* CLASS */
            )
          ], true),
          vue.renderSlot(_ctx.$slots, "footer", {}, () => [
            $props.rightText || $props.showBadge || $props.showSwitch ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 0,
                class: vue.normalizeClass(["uni-list-item__extra", { "flex--justify": $props.direction === "column" }])
              },
              [
                $props.rightText ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: 0,
                    class: "uni-list-item__extra-text"
                  },
                  vue.toDisplayString($props.rightText),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                $props.showBadge ? (vue.openBlock(), vue.createBlock(_component_uni_badge, {
                  key: 1,
                  type: $props.badgeType,
                  text: $props.badgeText,
                  "custom-style": $props.badgeStyle
                }, null, 8, ["type", "text", "custom-style"])) : vue.createCommentVNode("v-if", true),
                $props.showSwitch ? (vue.openBlock(), vue.createElementBlock("switch", {
                  key: 2,
                  disabled: $props.disabled,
                  checked: $props.switchChecked,
                  onChange: _cache[0] || (_cache[0] = (...args) => $options.onSwitchChange && $options.onSwitchChange(...args))
                }, null, 40, ["disabled", "checked"])) : vue.createCommentVNode("v-if", true)
              ],
              2
              /* CLASS */
            )) : vue.createCommentVNode("v-if", true)
          ], true)
        ],
        6
        /* CLASS, STYLE */
      ),
      $props.showArrow || $props.link ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
        key: 1,
        size: 16,
        class: "uni-icon-wrapper",
        color: "#bbb",
        type: "arrowright"
      })) : vue.createCommentVNode("v-if", true)
    ], 14, ["hover-class"]);
  }
  const __easycom_1$4 = /* @__PURE__ */ _export_sfc(_sfc_main$L, [["render", _sfc_render$K], ["__scopeId", "data-v-c7524739"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-list/components/uni-list-item/uni-list-item.vue"]]);
  const _sfc_main$K = {
    name: "uniList",
    "mp-weixin": {
      options: {
        multipleSlots: false
      }
    },
    props: {
      stackFromEnd: {
        type: Boolean,
        default: false
      },
      enableBackToTop: {
        type: [Boolean, String],
        default: false
      },
      scrollY: {
        type: [Boolean, String],
        default: false
      },
      border: {
        type: Boolean,
        default: true
      },
      renderReverse: {
        type: Boolean,
        default: false
      }
    },
    // provide() {
    // 	return {
    // 		list: this
    // 	};
    // },
    created() {
      this.firstChildAppend = false;
    },
    methods: {
      loadMore(e2) {
        this.$emit("scrolltolower");
      },
      scroll(e2) {
        this.$emit("scroll", e2);
      }
    }
  };
  function _sfc_render$J(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-list uni-border-top-bottom" }, [
      $props.border ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-list--border-top"
      })) : vue.createCommentVNode("v-if", true),
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
      $props.border ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "uni-list--border-bottom"
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_2$2 = /* @__PURE__ */ _export_sfc(_sfc_main$K, [["render", _sfc_render$J], ["__scopeId", "data-v-c2f1266a"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-list/components/uni-list/uni-list.vue"]]);
  const _sfc_main$J = {
    name: "cloud-image",
    emits: ["click"],
    props: {
      mode: {
        type: String,
        default() {
          return "widthFix";
        }
      },
      src: {
        // type:String,
        default() {
          return "";
        }
      },
      width: {
        type: String,
        default() {
          return "100rpx";
        }
      },
      height: {
        type: String,
        default() {
          return "100rpx";
        }
      }
    },
    watch: {
      src: {
        handler(src) {
          if (src && src.substring(0, 8) == "cloud://") {
            Ds.getTempFileURL({
              fileList: [src]
            }).then((res) => {
              this.cSrc = res.fileList[0].tempFileURL;
            });
          } else {
            this.cSrc = src;
          }
        },
        immediate: true
      }
    },
    methods: {
      onClick() {
        this.$emit("click");
      }
    },
    data() {
      return {
        cSrc: false
      };
    }
  };
  function _sfc_render$I(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args)),
        style: vue.normalizeStyle([{ width: $props.width, height: $props.height }, { "justify-content": "center" }])
      },
      [
        $data.cSrc ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          style: vue.normalizeStyle({ width: $props.width, height: $props.height }),
          src: $data.cSrc,
          mode: $props.mode
        }, null, 12, ["src", "mode"])) : vue.createCommentVNode("v-if", true)
      ],
      4
      /* STYLE */
    );
  }
  const __easycom_1$3 = /* @__PURE__ */ _export_sfc(_sfc_main$J, [["render", _sfc_render$I], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/cloud-image/cloud-image.vue"]]);
  const config = {
    //调试模式
    "debug": false,
    /*
    	登录类型 未列举到的或运行环境不支持的，将被自动隐藏。
    	如果需要在不同平台有不同的配置，直接用条件编译即可
    */
    "isAdmin": false,
    // 区分管理端与用户端
    "loginTypes": [
      // "qq",
      // "xiaomi",
      // "sinaweibo",
      // "taobao",
      // "facebook",
      // "google",
      // "alipay",
      // "douyin",
      "username",
      //"univerify",
      "username",
      //"weixin",
      "apple",
      "username"
      //"smsCode"
    ],
    //政策协议
    "agreements": {
      "serviceUrl": "https://xxx",
      //用户服务协议链接
      "privacyUrl": "https://xxx",
      //隐私政策条款链接
      // 哪些场景下显示，1.注册（包括登录并注册，如：微信登录、苹果登录、短信验证码登录）、2.登录（如：用户名密码登录）
      "scope": [
        "login",
        "register"
      ]
    },
    // 提供各类服务接入（如微信登录服务）的应用id
    "appid": {
      "weixin": {
        // 微信公众号的appid，来源:登录微信公众号（https://mp.weixin.qq.com）-> 设置与开发 -> 基本配置 -> 公众号开发信息 -> AppID
        "h5": "xxxxxx",
        // 微信开放平台的appid，来源:登录微信开放平台（https://open.weixin.qq.com） -> 管理中心 -> 网站应用 -> 选择对应的应用名称，点击查看 -> AppID
        "web": "xxxxxx"
      }
    },
    /**
     * 密码强度
     * super（超强：密码必须包含大小写字母、数字和特殊符号，长度范围：8-16位之间）
     * strong（强: 密密码必须包含字母、数字和特殊符号，长度范围：8-16位之间）
     * medium (中：密码必须为字母、数字和特殊符号任意两种的组合，长度范围：8-16位之间)
     * weak（弱：密码必须包含字母和数字，长度范围：6-16位之间）
     * 为空或false则不验证密码强度
     */
    "passwordStrength": "medium",
    /**
     * 登录后允许用户设置密码（只针对未设置密码得用户）
     * 开启此功能将 setPasswordAfterLogin 设置为 true 即可
     * "setPasswordAfterLogin": false
     *
     * 如果允许用户跳过设置密码 将 allowSkip 设置为 true
     * "setPasswordAfterLogin": {
     *   "allowSkip": true
     * }
     * */
    "setPasswordAfterLogin": false
  };
  const uniIdCo$a = Ds.importObject("uni-id-co");
  const db$6 = Ds.database();
  const usersTable = db$6.collection("uni-id-users");
  let hostUserInfo = uni.getStorageSync("uni-id-pages-userInfo") || {};
  const data = {
    userInfo: hostUserInfo,
    hasLogin: Object.keys(hostUserInfo).length != 0
  };
  const mutations = {
    // data不为空，表示传递要更新的值(注意不是覆盖是合并),什么也不传时，直接查库获取更新
    async updateUserInfo(data2 = false) {
      if (data2) {
        usersTable.where("_id==$env.uid").update(data2).then((e2) => {
          if (e2.result.updated) {
            uni.showToast({
              title: "更新成功",
              icon: "none",
              duration: 3e3
            });
            this.setUserInfo(data2);
          } else {
            uni.showToast({
              title: "没有改变",
              icon: "none",
              duration: 3e3
            });
          }
        });
      } else {
        try {
          let res = await usersTable.where("'_id' == $cloudEnv_uid").field("mobile,nickname,username,email,avatar_file").get();
          this.setUserInfo(res.result.data[0]);
        } catch (e2) {
          this.setUserInfo({}, { cover: true });
          formatAppLog("error", "at uni_modules/uni-id-pages/common/store.js:48", e2.message, e2.errCode);
        }
      }
    },
    async setUserInfo(data2, { cover } = { cover: false }) {
      let userInfo = cover ? data2 : Object.assign(store.userInfo, data2);
      store.userInfo = Object.assign({}, userInfo);
      store.hasLogin = Object.keys(store.userInfo).length != 0;
      uni.setStorage({
        key: "uni-id-pages-userInfo",
        data: store.userInfo
      });
      return data2;
    },
    async logout() {
      var _a;
      if (Ds.getCurrentUserInfo().tokenExpired > Date.now()) {
        try {
          await uniIdCo$a.logout();
        } catch (e2) {
          formatAppLog("error", "at uni_modules/uni-id-pages/common/store.js:70", e2);
        }
      }
      uni.removeStorageSync("uni_id_token");
      uni.setStorageSync("uni_id_token_expired", 0);
      uni.redirectTo({
        url: `/${((_a = pagesJson.uniIdRouter) == null ? void 0 : _a.loginPage) ?? "uni_modules/uni-id-pages/pages/login/login-withoutpwd"}`
      });
      uni.$emit("uni-id-pages-logout");
      this.setUserInfo({}, { cover: true });
    },
    loginBack(e2 = {}) {
      const { uniIdRedirectUrl = "" } = e2;
      let delta = 0;
      let pages2 = getCurrentPages();
      pages2.forEach((page, index) => {
        if (pages2[pages2.length - index - 1].route.split("/")[3] == "login") {
          delta++;
        }
      });
      if (uniIdRedirectUrl) {
        return uni.reLaunch({
          url: uniIdRedirectUrl
        });
      }
      if (delta) {
        const page = pagesJson.pages[0];
        return uni.reLaunch({
          url: `/${page.path}`
        });
      }
      uni.navigateBack({
        delta
      });
    },
    loginSuccess(e2 = {}) {
      const {
        showToast = true,
        toastText = "登录成功",
        autoBack = true,
        uniIdRedirectUrl = "",
        passwordConfirmed
      } = e2;
      if (showToast) {
        uni.showToast({
          title: toastText,
          icon: "none",
          duration: 3e3
        });
      }
      this.updateUserInfo();
      uni.$emit("uni-id-pages-login-success");
      if (config.setPasswordAfterLogin && !passwordConfirmed) {
        return uni.redirectTo({
          url: uniIdRedirectUrl ? `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?uniIdRedirectUrl=${uniIdRedirectUrl}&loginType=${e2.loginType}` : `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?loginType=${e2.loginType}`,
          fail: (err) => {
            formatAppLog("log", "at uni_modules/uni-id-pages/common/store.js:136", err);
          }
        });
      }
      if (autoBack) {
        this.loginBack(uniIdRedirectUrl);
      }
    }
  };
  const store = vue.reactive(data);
  const _sfc_main$I = {
    data() {
      return {
        isPC: false
      };
    },
    props: {
      //头像图片宽
      width: {
        type: String,
        default() {
          return "50px";
        }
      },
      //头像图片高
      height: {
        type: String,
        default() {
          return "50px";
        }
      },
      border: {
        type: Boolean,
        default() {
          return false;
        }
      }
    },
    async mounted() {
    },
    computed: {
      hasLogin() {
        return store.hasLogin;
      },
      userInfo() {
        return store.userInfo;
      },
      avatar_file() {
        return store.userInfo.avatar_file;
      }
    },
    methods: {
      setAvatarFile(avatar_file) {
        mutations.updateUserInfo({ avatar_file });
      },
      async bindchooseavatar(res) {
        let avatarUrl = res.detail.avatarUrl;
        let avatar_file = {
          extname: avatarUrl.split(".")[avatarUrl.split(".").length - 1],
          name: "",
          url: avatarUrl
        };
        let filePath = await new Promise((callback) => {
          wx.cropImage({
            src: avatarUrl,
            cropScale: "1:1",
            success: (res2) => {
              callback(res2.tempFilePath);
            },
            fail(e2) {
              formatAppLog("error", "at uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue:86", e2);
              uni.showModal({
                content: "wx.cropImage " + e2.errMsg,
                showCancel: false,
                confirmText: "跳过裁剪",
                complete() {
                  callback(avatarUrl);
                }
              });
            }
          });
        });
        let cloudPath = this.userInfo._id + "" + Date.now();
        avatar_file.name = cloudPath;
        try {
          uni.showLoading({
            title: "更新中",
            mask: true
          });
          let {
            fileID
          } = await Ds.uploadFile({
            filePath,
            cloudPath,
            fileType: "image"
          });
          avatar_file.url = fileID;
          uni.hideLoading();
        } catch (e2) {
          formatAppLog("error", "at uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue:117", e2);
        }
        this.setAvatarFile(avatar_file);
      },
      uploadAvatarImg(res) {
        if (!this.hasLogin) {
          return uni.navigateTo({
            url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
          });
        }
        const crop = {
          quality: 100,
          width: 600,
          height: 600,
          resize: true
        };
        uni.chooseImage({
          count: 1,
          crop,
          success: async (res2) => {
            let tempFile = res2.tempFiles[0], avatar_file = {
              extname: tempFile.path.split(".")[tempFile.path.split(".").length - 1]
            }, filePath = res2.tempFilePaths[0];
            let cloudPath = this.userInfo._id + "" + Date.now();
            avatar_file.name = cloudPath;
            uni.showLoading({
              title: "更新中",
              mask: true
            });
            let {
              fileID
            } = await Ds.uploadFile({
              filePath,
              cloudPath,
              fileType: "image"
            });
            avatar_file.url = fileID;
            uni.hideLoading();
            this.setAvatarFile(avatar_file);
          }
        });
      }
    }
  };
  function _sfc_render$H(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_cloud_image = resolveEasycom(vue.resolveDynamicComponent("cloud-image"), __easycom_1$3);
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    return vue.openBlock(), vue.createElementBlock(
      "button",
      {
        "open-type": "chooseAvatar",
        onChooseavatar: _cache[0] || (_cache[0] = (...args) => $options.bindchooseavatar && $options.bindchooseavatar(...args)),
        onClick: _cache[1] || (_cache[1] = (...args) => $options.uploadAvatarImg && $options.uploadAvatarImg(...args)),
        class: vue.normalizeClass(["box", { "showBorder": $props.border }]),
        style: vue.normalizeStyle({ width: $props.width, height: $props.height, lineHeight: $props.height })
      },
      [
        $options.avatar_file ? (vue.openBlock(), vue.createBlock(_component_cloud_image, {
          key: 0,
          src: $options.avatar_file.url,
          width: $props.width,
          height: $props.height
        }, null, 8, ["src", "width", "height"])) : (vue.openBlock(), vue.createBlock(_component_uni_icons, {
          key: 1,
          style: vue.normalizeStyle({ width: $props.width, height: $props.height, lineHeight: $props.height }),
          class: "chooseAvatar",
          type: "plusempty",
          size: "30",
          color: "#dddddd"
        }, null, 8, ["style"]))
      ],
      38
      /* CLASS, STYLE, HYDRATE_EVENTS */
    );
  }
  const __easycom_0$7 = /* @__PURE__ */ _export_sfc(_sfc_main$I, [["render", _sfc_render$H], ["__scopeId", "data-v-a428f129"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue"]]);
  Ds.database();
  Ds.importObject("utilsObj", {
    customUI: true
  });
  const _sfc_main$H = {
    name: "comment-item",
    props: {
      item: {
        type: Object,
        default() {
          return {};
        }
      }
    },
    data() {
      return {};
    }
  };
  function _sfc_render$G(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_id_pages_avatar = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-avatar"), __easycom_0$7);
    const _component_uni_dateformat = resolveEasycom(vue.resolveDynamicComponent("uni-dateformat"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode("view", { class: "comment-item" }, [
        vue.createElementVNode("view", { class: "avatar" }, [
          vue.createVNode(_component_uni_id_pages_avatar, {
            src: "@/static/images/user.png",
            size: "26"
          })
        ]),
        vue.createElementVNode("view", { class: "wrap" }, [
          vue.createElementVNode(
            "view",
            { class: "username" },
            vue.toDisplayString($props.item.user_id[0].nickname),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "view",
            { class: "comment-content" },
            vue.toDisplayString($props.item.comment_content),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "info" }, [
            vue.createElementVNode("view", null, [
              vue.createVNode(_component_uni_dateformat, {
                date: $props.item.comment_date,
                threshold: [6e4, 36e5 * 24 * 30]
              }, null, 8, ["date"])
            ])
          ])
        ])
      ])
    ]);
  }
  const __easycom_5$2 = /* @__PURE__ */ _export_sfc(_sfc_main$H, [["render", _sfc_render$G], ["__scopeId", "data-v-c7df51b2"], ["__file", "G:/HBuilderProjects/Toby/components/comment-item/comment-item.vue"]]);
  function obj2strClass(obj) {
    let classess = "";
    for (let key in obj) {
      const val = obj[key];
      if (val) {
        classess += `${key} `;
      }
    }
    return classess;
  }
  function obj2strStyle(obj) {
    let style = "";
    for (let key in obj) {
      const val = obj[key];
      style += `${key}:${val};`;
    }
    return style;
  }
  const _sfc_main$G = {
    name: "uni-easyinput",
    emits: ["click", "iconClick", "update:modelValue", "input", "focus", "blur", "confirm", "clear", "eyes", "change"],
    model: {
      prop: "modelValue",
      event: "update:modelValue"
    },
    options: {
      virtualHost: true
    },
    inject: {
      form: {
        from: "uniForm",
        default: null
      },
      formItem: {
        from: "uniFormItem",
        default: null
      }
    },
    props: {
      name: String,
      value: [Number, String],
      modelValue: [Number, String],
      type: {
        type: String,
        default: "text"
      },
      clearable: {
        type: Boolean,
        default: true
      },
      autoHeight: {
        type: Boolean,
        default: false
      },
      placeholder: {
        type: String,
        default: " "
      },
      placeholderStyle: String,
      focus: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      maxlength: {
        type: [Number, String],
        default: 140
      },
      confirmType: {
        type: String,
        default: "done"
      },
      clearSize: {
        type: [Number, String],
        default: 24
      },
      inputBorder: {
        type: Boolean,
        default: true
      },
      prefixIcon: {
        type: String,
        default: ""
      },
      suffixIcon: {
        type: String,
        default: ""
      },
      trim: {
        type: [Boolean, String],
        default: true
      },
      passwordIcon: {
        type: Boolean,
        default: true
      },
      primaryColor: {
        type: String,
        default: "#2979ff"
      },
      styles: {
        type: Object,
        default() {
          return {
            color: "#333",
            backgroundColor: "#fff",
            disableColor: "#F7F6F6",
            borderColor: "#e5e5e5"
          };
        }
      },
      errorMessage: {
        type: [String, Boolean],
        default: ""
      }
    },
    data() {
      return {
        focused: false,
        val: "",
        showMsg: "",
        border: false,
        isFirstBorder: false,
        showClearIcon: false,
        showPassword: false,
        focusShow: false,
        localMsg: "",
        isEnter: false
        // 用于判断当前是否是使用回车操作
      };
    },
    computed: {
      // 输入框内是否有值
      isVal() {
        const val = this.val;
        if (val || val === 0) {
          return true;
        }
        return false;
      },
      msg() {
        return this.localMsg || this.errorMessage;
      },
      // 因为uniapp的input组件的maxlength组件必须要数值，这里转为数值，用户可以传入字符串数值
      inputMaxlength() {
        return Number(this.maxlength);
      },
      // 处理外层样式的style
      boxStyle() {
        return `color:${this.inputBorder && this.msg ? "#e43d33" : this.styles.color};`;
      },
      // input 内容的类和样式处理
      inputContentClass() {
        return obj2strClass({
          "is-input-border": this.inputBorder,
          "is-input-error-border": this.inputBorder && this.msg,
          "is-textarea": this.type === "textarea",
          "is-disabled": this.disabled,
          "is-focused": this.focusShow
        });
      },
      inputContentStyle() {
        const focusColor = this.focusShow ? this.primaryColor : this.styles.borderColor;
        const borderColor = this.inputBorder && this.msg ? "#dd524d" : focusColor;
        return obj2strStyle({
          "border-color": borderColor || "#e5e5e5",
          "background-color": this.disabled ? this.styles.disableColor : this.styles.backgroundColor
        });
      },
      // input右侧样式
      inputStyle() {
        const paddingRight = this.type === "password" || this.clearable || this.prefixIcon ? "" : "10px";
        return obj2strStyle({
          "padding-right": paddingRight,
          "padding-left": this.prefixIcon ? "" : "10px"
        });
      }
    },
    watch: {
      value(newVal) {
        this.val = newVal;
      },
      modelValue(newVal) {
        this.val = newVal;
      },
      focus(newVal) {
        this.$nextTick(() => {
          this.focused = this.focus;
          this.focusShow = this.focus;
        });
      }
    },
    created() {
      this.init();
      if (this.form && this.formItem) {
        this.$watch("formItem.errMsg", (newVal) => {
          this.localMsg = newVal;
        });
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.focused = this.focus;
        this.focusShow = this.focus;
      });
    },
    methods: {
      /**
       * 初始化变量值
       */
      init() {
        if (this.value || this.value === 0) {
          this.val = this.value;
        } else if (this.modelValue || this.modelValue === 0 || this.modelValue === "") {
          this.val = this.modelValue;
        } else {
          this.val = null;
        }
      },
      /**
       * 点击图标时触发
       * @param {Object} type
       */
      onClickIcon(type) {
        this.$emit("iconClick", type);
      },
      /**
       * 显示隐藏内容，密码框时生效
       */
      onEyes() {
        this.showPassword = !this.showPassword;
        this.$emit("eyes", this.showPassword);
      },
      /**
       * 输入时触发
       * @param {Object} event
       */
      onInput(event) {
        let value = event.detail.value;
        if (this.trim) {
          if (typeof this.trim === "boolean" && this.trim) {
            value = this.trimStr(value);
          }
          if (typeof this.trim === "string") {
            value = this.trimStr(value, this.trim);
          }
        }
        if (this.errMsg)
          this.errMsg = "";
        this.val = value;
        this.$emit("input", value);
        this.$emit("update:modelValue", value);
      },
      /**
       * 外部调用方法
       * 获取焦点时触发
       * @param {Object} event
       */
      onFocus() {
        this.$nextTick(() => {
          this.focused = true;
        });
        this.$emit("focus", null);
      },
      _Focus(event) {
        this.focusShow = true;
        this.$emit("focus", event);
      },
      /**
       * 外部调用方法
       * 失去焦点时触发
       * @param {Object} event
       */
      onBlur() {
        this.focused = false;
        this.$emit("focus", null);
      },
      _Blur(event) {
        event.detail.value;
        this.focusShow = false;
        this.$emit("blur", event);
        if (this.isEnter === false) {
          this.$emit("change", this.val);
        }
        if (this.form && this.formItem) {
          const { validateTrigger } = this.form;
          if (validateTrigger === "blur") {
            this.formItem.onFieldChange();
          }
        }
      },
      /**
       * 按下键盘的发送键
       * @param {Object} e
       */
      onConfirm(e2) {
        this.$emit("confirm", this.val);
        this.isEnter = true;
        this.$emit("change", this.val);
        this.$nextTick(() => {
          this.isEnter = false;
        });
      },
      /**
       * 清理内容
       * @param {Object} event
       */
      onClear(event) {
        this.val = "";
        this.$emit("input", "");
        this.$emit("update:modelValue", "");
        this.$emit("clear");
      },
      /**
       * 键盘高度发生变化的时候触发此事件
       * 兼容性：微信小程序2.7.0+、App 3.1.0+
       * @param {Object} event
       */
      onkeyboardheightchange(event) {
        this.$emit("keyboardheightchange", event);
      },
      /**
       * 去除空格
       */
      trimStr(str, pos = "both") {
        if (pos === "both") {
          return str.trim();
        } else if (pos === "left") {
          return str.trimLeft();
        } else if (pos === "right") {
          return str.trimRight();
        } else if (pos === "start") {
          return str.trimStart();
        } else if (pos === "end") {
          return str.trimEnd();
        } else if (pos === "all") {
          return str.replace(/\s+/g, "");
        } else if (pos === "none") {
          return str;
        }
        return str;
      }
    }
  };
  function _sfc_render$F(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["uni-easyinput", { "uni-easyinput-error": $options.msg }]),
        style: vue.normalizeStyle($options.boxStyle)
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["uni-easyinput__content", $options.inputContentClass]),
            style: vue.normalizeStyle($options.inputContentStyle)
          },
          [
            $props.prefixIcon ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
              key: 0,
              class: "content-clear-icon",
              type: $props.prefixIcon,
              color: "#c0c4cc",
              onClick: _cache[0] || (_cache[0] = ($event) => $options.onClickIcon("prefix")),
              size: "22"
            }, null, 8, ["type"])) : vue.createCommentVNode("v-if", true),
            $props.type === "textarea" ? (vue.openBlock(), vue.createElementBlock("textarea", {
              key: 1,
              class: vue.normalizeClass(["uni-easyinput__content-textarea", { "input-padding": $props.inputBorder }]),
              name: $props.name,
              value: $data.val,
              placeholder: $props.placeholder,
              placeholderStyle: $props.placeholderStyle,
              disabled: $props.disabled,
              "placeholder-class": "uni-easyinput__placeholder-class",
              maxlength: $options.inputMaxlength,
              focus: $data.focused,
              autoHeight: $props.autoHeight,
              onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args)),
              onBlur: _cache[2] || (_cache[2] = (...args) => $options._Blur && $options._Blur(...args)),
              onFocus: _cache[3] || (_cache[3] = (...args) => $options._Focus && $options._Focus(...args)),
              onConfirm: _cache[4] || (_cache[4] = (...args) => $options.onConfirm && $options.onConfirm(...args)),
              onKeyboardheightchange: _cache[5] || (_cache[5] = (...args) => $options.onkeyboardheightchange && $options.onkeyboardheightchange(...args))
            }, null, 42, ["name", "value", "placeholder", "placeholderStyle", "disabled", "maxlength", "focus", "autoHeight"])) : (vue.openBlock(), vue.createElementBlock("input", {
              key: 2,
              type: $props.type === "password" ? "text" : $props.type,
              class: "uni-easyinput__content-input",
              style: vue.normalizeStyle($options.inputStyle),
              name: $props.name,
              value: $data.val,
              password: !$data.showPassword && $props.type === "password",
              placeholder: $props.placeholder,
              placeholderStyle: $props.placeholderStyle,
              "placeholder-class": "uni-easyinput__placeholder-class",
              disabled: $props.disabled,
              maxlength: $options.inputMaxlength,
              focus: $data.focused,
              confirmType: $props.confirmType,
              onFocus: _cache[6] || (_cache[6] = (...args) => $options._Focus && $options._Focus(...args)),
              onBlur: _cache[7] || (_cache[7] = (...args) => $options._Blur && $options._Blur(...args)),
              onInput: _cache[8] || (_cache[8] = (...args) => $options.onInput && $options.onInput(...args)),
              onConfirm: _cache[9] || (_cache[9] = (...args) => $options.onConfirm && $options.onConfirm(...args)),
              onKeyboardheightchange: _cache[10] || (_cache[10] = (...args) => $options.onkeyboardheightchange && $options.onkeyboardheightchange(...args))
            }, null, 44, ["type", "name", "value", "password", "placeholder", "placeholderStyle", "disabled", "maxlength", "focus", "confirmType"])),
            $props.type === "password" && $props.passwordIcon ? (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 3 },
              [
                vue.createCommentVNode(" 开启密码时显示小眼睛 "),
                $options.isVal ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                  key: 0,
                  class: vue.normalizeClass(["content-clear-icon", { "is-textarea-icon": $props.type === "textarea" }]),
                  type: $data.showPassword ? "eye-slash-filled" : "eye-filled",
                  size: 22,
                  color: $data.focusShow ? $props.primaryColor : "#c0c4cc",
                  onClick: $options.onEyes
                }, null, 8, ["class", "type", "color", "onClick"])) : vue.createCommentVNode("v-if", true)
              ],
              64
              /* STABLE_FRAGMENT */
            )) : $props.suffixIcon ? (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 4 },
              [
                $props.suffixIcon ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                  key: 0,
                  class: "content-clear-icon",
                  type: $props.suffixIcon,
                  color: "#c0c4cc",
                  onClick: _cache[11] || (_cache[11] = ($event) => $options.onClickIcon("suffix")),
                  size: "22"
                }, null, 8, ["type"])) : vue.createCommentVNode("v-if", true)
              ],
              64
              /* STABLE_FRAGMENT */
            )) : (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 5 },
              [
                $props.clearable && $options.isVal && !$props.disabled && $props.type !== "textarea" ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                  key: 0,
                  class: vue.normalizeClass(["content-clear-icon", { "is-textarea-icon": $props.type === "textarea" }]),
                  type: "clear",
                  size: $props.clearSize,
                  color: $options.msg ? "#dd524d" : $data.focusShow ? $props.primaryColor : "#c0c4cc",
                  onClick: $options.onClear
                }, null, 8, ["class", "size", "color", "onClick"])) : vue.createCommentVNode("v-if", true)
              ],
              64
              /* STABLE_FRAGMENT */
            )),
            vue.renderSlot(_ctx.$slots, "right", {}, void 0, true)
          ],
          6
          /* CLASS, STYLE */
        )
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$G, [["render", _sfc_render$F], ["__scopeId", "data-v-09fd5285"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.vue"]]);
  var nvMask, nvImageMenu;
  class NvImageMenu {
    constructor(arg) {
      this.isShow = false;
    }
    show({
      list,
      cancelText
    }, callback) {
      if (!list) {
        list = [{
          "img": "/static/sharemenu/wechatfriend.png",
          "text": "图标文字"
        }];
      }
      var screenWidth = plus.screen.resolutionWidth;
      var margin = 20, iconWidth = 60, icontextSpace = 5, textHeight = 12;
      var left1 = margin / 360 * screenWidth;
      var iconSpace = (screenWidth - left1 * 2 - iconWidth * 4) / 3;
      if (iconSpace <= 5) {
        margin = 15;
        iconWidth = 40;
        left1 = margin / 360 * screenWidth;
        iconSpace = (screenWidth - left1 * 2 - iconWidth * 4) / 3;
      }
      var left2 = left1 + iconWidth + iconSpace;
      var left3 = left1 + (iconWidth + iconSpace) * 2;
      var left4 = left1 + (iconWidth + iconSpace) * 3;
      var top1 = left1;
      var top2 = top1 + iconWidth + icontextSpace + textHeight + left1;
      const TOP = {
        top1,
        top2
      }, LEFT = {
        left1,
        left2,
        left3,
        left4
      };
      nvMask = new plus.nativeObj.View("nvMask", {
        //先创建遮罩层
        top: "0px",
        left: "0px",
        height: "100%",
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.2)"
      });
      nvImageMenu = new plus.nativeObj.View("nvImageMenu", {
        //创建底部图标菜单
        bottom: "0px",
        left: "0px",
        height: (iconWidth + textHeight + 2 * margin) * Math.ceil(list.length / 4) + 44 + "px",
        //'264px',
        width: "100%",
        backgroundColor: "rgb(255,255,255)"
      });
      nvMask.addEventListener("click", () => {
        this.hide();
        callback({
          event: "clickMask"
        });
      });
      let myList = [];
      list.forEach((item, i2) => {
        myList.push({
          tag: "img",
          src: item.img,
          position: {
            top: TOP["top" + (parseInt(i2 / 4) + 1)],
            left: LEFT["left" + (1 + i2 % 4)],
            width: iconWidth,
            height: iconWidth
          }
        });
        myList.push({
          tag: "font",
          text: item.text,
          textStyles: {
            size: textHeight
          },
          position: {
            top: TOP["top" + (parseInt(i2 / 4) + 1)] + iconWidth + icontextSpace,
            left: LEFT["left" + (1 + i2 % 4)],
            width: iconWidth,
            height: textHeight
          }
        });
      });
      nvImageMenu.draw([
        {
          tag: "rect",
          //菜单顶部的分割灰线
          color: "#e7e7e7",
          position: {
            top: "0px",
            height: "1px"
          }
        },
        {
          tag: "font",
          text: cancelText,
          //底部取消按钮的文字
          textStyles: {
            size: "14px"
          },
          position: {
            bottom: "0px",
            height: "44px"
          }
        },
        {
          tag: "rect",
          //底部取消按钮的顶部边线
          color: "#e7e7e7",
          position: {
            bottom: "45px",
            height: "1px"
          }
        },
        ...myList
      ]);
      nvMask.show();
      nvImageMenu.show();
      this.isShow = true;
      nvImageMenu.addEventListener("click", (e2) => {
        if (e2.screenY > plus.screen.resolutionHeight - 44) {
          this.hide();
        } else if (e2.clientX < 5 || e2.clientX > screenWidth - 5 || e2.clientY < 5)
          ;
        else {
          var iClickIndex = -1;
          var iRow = e2.clientY < top2 - left1 / 2 ? 0 : 1;
          var iCol = -1;
          if (e2.clientX < left2 - iconSpace / 2) {
            iCol = 0;
          } else if (e2.clientX < left3 - iconSpace / 2) {
            iCol = 1;
          } else if (e2.clientX < left4 - iconSpace / 2) {
            iCol = 2;
          } else {
            iCol = 3;
          }
          if (iRow == 0) {
            iClickIndex = iCol;
          } else {
            iClickIndex = iCol + 4;
          }
          callback({
            event: "clickMenu",
            index: iClickIndex
          });
        }
      });
    }
    hide() {
      if (this.isShow) {
        nvMask.hide();
        nvImageMenu.hide();
        this.isShow = false;
      }
    }
  }
  class UniShare extends NvImageMenu {
    constructor(arg) {
      super();
      this.isShow = super.isShow;
    }
    async show(param, callback) {
      var menus = [];
      plus.share.getServices((services) => {
        services = services.filter((item) => item.nativeClient);
        let servicesList = services.map((e2) => e2.id);
        param.menus.forEach((item) => {
          if (servicesList.includes(item.share.provider) || typeof item.share == "string") {
            menus.push(item);
          }
        });
        super.show({
          list: menus,
          cancelText: param.cancelText
        }, (e2) => {
          callback(e2);
          if (e2.event == "clickMenu") {
            if (typeof menus[e2.index]["share"] == "string") {
              this[menus[e2.index]["share"]](param);
            } else {
              uni.share({
                ...param.content,
                ...menus[e2.index].share,
                success: (res) => {
                  formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:30", "success:" + JSON.stringify(res));
                  super.hide();
                },
                fail: function(err) {
                  formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:34", "fail:" + JSON.stringify(err));
                  uni.showModal({
                    content: JSON.stringify(err),
                    showCancel: false,
                    confirmText: "知道了"
                  });
                }
              });
            }
          }
        });
      }, (err) => {
        uni.showModal({
          title: "获取服务供应商失败：" + JSON.stringify(err),
          showCancel: false,
          confirmText: "知道了"
        });
        formatAppLog("error", "at uni_modules/uni-share/js_sdk/uni-share.js:51", "获取服务供应商失败：" + JSON.stringify(err));
      });
    }
    hide() {
      super.hide();
    }
    copyurl(param) {
      formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:58", "copyurl", param);
      uni.setClipboardData({
        data: param.content.href,
        success: () => {
          formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:62", "success");
          uni.hideToast();
          uni.showToast({
            title: "复制成功",
            icon: "none"
          });
          super.hide();
        },
        fail: (err) => {
          uni.showModal({
            content: JSON.stringify(err),
            showCancel: false
          });
        }
      });
    }
    // 使用系统分享发送分享消息 
    shareSystem(param) {
      formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:80", "shareSystem", param);
      plus.share.sendWithSystem({
        type: "text",
        content: param.content.title + param.content.summary || "",
        href: param.content.href
      }, (e2) => {
        formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:86", "分享成功");
        super.hide();
      }, (err) => {
        formatAppLog("log", "at uni_modules/uni-share/js_sdk/uni-share.js:89", "分享失败：" + JSON.stringify(err));
        uni.showModal({
          title: "获取服务供应商失败：" + JSON.stringify(err),
          showCancel: false,
          confirmText: "知道了"
        });
      });
    }
  }
  const _imports_0$4 = "/static/images/zan.png";
  const _imports_1$2 = "/static/images/zaned.png";
  const uniShare$2 = new UniShare();
  const db$5 = Ds.database();
  const readNewsLog = db$5.collection("read-news-log");
  Ds.importObject("utilsObj", {
    customUI: true
  });
  const _sfc_main$F = {
    components: {
      "uni-nav-bar": __easycom_0$9
    },
    computed: {},
    onBackPress({ from }) {
      if (from == "backbutton") {
        if (uniShare$2.isShow) {
          this.$nextTick(function() {
            formatAppLog("log", "at pages/list/detail.vue:126", uniShare$2);
            uniShare$2.hide();
          });
        }
        return uniShare$2.isShow;
      }
    },
    data() {
      return {
        // 当前显示 _id
        id: "",
        title: "title",
        // 数据表名
        // 查询字段，多个字段用 , 分割
        field: "user_id.nickname,user_id._id,img_url,excerpt,last_modify_date,comment_count,like_count,title,description,department,dated,web_url,medium,comments,country",
        formData: {
          noData: '<p style="text-align:center;color:#666">详情加载中...</p>'
        },
        placeholder: "请评论点什么吧...",
        commentList: [],
        zan_url: "@/static/images/zan.png",
        colList: [
          db$5.collection("quanzi_comment").getTemp(),
          db$5.collection("uni-id-users").field("_id,nickname,avatar_file").getTemp()
        ],
        hadzan: "false"
      };
    },
    computed: {
      uniStarterConfig() {
        return getApp().globalData.config;
      },
      where() {
        return `_id =="${this.id}"`;
      }
    },
    onLoad(event) {
      if (event.id) {
        this.id = event.id;
      }
      if (event.title) {
        this.title = event.title;
        uni.setNavigationBarTitle({
          title: event.title
        });
      }
    },
    onReady() {
      if (this.id) {
        this.$refs.detail.loadData();
      } else {
        uni.showToast({
          icon: "none",
          title: this.$t("listDetail.newsErr")
        });
      }
      this.getComment();
    },
    onNavigationBarButtonTap(event) {
      if (event.type == "share") {
        this.shareClick();
      }
    },
    methods: {
      $log(...args) {
        formatAppLog("log", "at pages/list/detail.vue:198", "args", ...args, this.id);
      },
      setReadNewsLog() {
        let item = {
          "article_id": this.id,
          "last_time": Date.now()
        }, readNewsLog2 = uni.getStorageSync("readNewsLog") || [], index = -1;
        readNewsLog2.forEach(({ article_id: article_id2 }, i2) => {
          if (article_id2 == item.article_id) {
            index = i2;
          }
        });
        if (index === -1) {
          readNewsLog2.push(item);
        } else {
          readNewsLog2.splice(index, 1, item);
        }
        uni.setStorageSync("readNewsLog", readNewsLog2);
        formatAppLog("log", "at pages/list/detail.vue:218", readNewsLog2);
      },
      setFavorite() {
        if (Ds.getCurrentUserInfo().tokenExpired < Date.now()) {
          return formatAppLog("log", "at pages/list/detail.vue:222", "未登录用户");
        }
        last_time = Date.now();
        formatAppLog("log", "at pages/list/detail.vue:226", { article_id, last_time });
        readNewsLog.where(`"article_id" == "${this.article_id}" && "user_id"==$env.uid`).update({ last_time }).then(({ result: { updated } }) => {
          formatAppLog("log", "at pages/list/detail.vue:230", "updated", updated);
          if (!updated) {
            readNewsLog.add({ article_id }).then((e2) => {
              formatAppLog("log", "at pages/list/detail.vue:233", e2);
            }).catch((err) => {
              formatAppLog("log", "at pages/list/detail.vue:235", err);
            });
          }
        }).catch((err) => {
          formatAppLog("log", "at pages/list/detail.vue:239", err);
        });
      },
      loadData(data2) {
        if (this.title == "" && data2[0].title) {
          this.title = data2[0].title;
          uni.setNavigationBarTitle({
            title: data2[0].title
          });
        }
        this.setReadNewsLog();
      },
      /**
       * followClick
       * 点击关注
       */
      followClick() {
        uni.showToast({
          title: this.$t("listDetail.follow"),
          icon: "none"
        });
      },
      clicklike() {
        if (this.hadzan == "true") {
          this.hadzan = "false";
          uni.showToast({
            title: "取消点赞"
          });
        } else {
          this.hadzan = "true";
          uni.showToast({
            title: "点赞成功"
          });
        }
      },
      //评论
      goComment() {
        if (!this.replyContent) {
          uni.showToast({
            title: "评论不能为空",
            icon: "none"
          });
          return;
        }
        db$5.collection("quanzi_comment").add({
          "article_id": this.id,
          "comment_type": 0,
          "comment_content": this.replyContent
          //"province": province,
          //...this.commentObj
        }).then((res) => {
          uni.showToast({
            title: "评论成功"
          });
          formatAppLog("log", "at pages/list/detail.vue:300", res);
        });
      },
      /**
       * 分享该文章
       */
      //获得评论
      async getComment() {
        formatAppLog("log", "at pages/list/detail.vue:310", article_id);
        let commentTemp = db$5.collection("quanzi_comment").where(`article_id == "${this.id}"`).orderBy("comment_date desc").limit(20).getTemp();
        let userTemp = db$5.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp();
        let res = await db$5.collection(commentTemp, userTemp).get();
        this.commentList = res.result.data;
      },
      shareClick() {
        let {
          _id,
          title,
          excerpt,
          img_url
        } = this.$refs.detail.dataList;
        formatAppLog("log", "at pages/list/detail.vue:328", JSON.stringify({
          _id,
          title,
          excerpt,
          img_url
        }));
        uniShare$2.show({
          content: {
            //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
            type: 0,
            href: this.uniStarterConfig.h5.url + `/#/pages/list/detail?id=${_id}&title=${title}`,
            title: this.title,
            summary: excerpt,
            imageUrl: img_url + "?x-oss-process=image/resize,m_fill,h_100,w_100"
            //压缩图片解决，在ios端分享图过大导致的图片失效问题
          },
          menus: [
            {
              "img": "/static/app-plus/sharemenu/wechatfriend.png",
              "text": this.$t("common.wechatFriends"),
              "share": {
                "provider": "weixin",
                "scene": "WXSceneSession"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/wechatmoments.png",
              "text": this.$t("common.wechatBbs"),
              "share": {
                "provider": "weixin",
                "scene": "WXSceneTimeline"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/mp_weixin.png",
              "text": this.$t("common.wechatApplet"),
              "share": {
                provider: "weixin",
                scene: "WXSceneSession",
                type: 5,
                miniProgram: {
                  id: this.uniStarterConfig.mp.weixin.id,
                  path: `/pages/list/detail?id=${_id}&title=${title}`,
                  webUrl: this.uniStarterConfig.h5.url + `/#/pages/list/detail?id=${_id}&title=${title}`,
                  type: 0
                }
              }
            },
            {
              "img": "/static/app-plus/sharemenu/weibo.png",
              "text": this.$t("common.weibo"),
              "share": {
                "provider": "sinaweibo"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/qq.png",
              "text": "QQ",
              "share": {
                "provider": "qq"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/copyurl.png",
              "text": this.$t("common.copy"),
              "share": "copyurl"
            },
            {
              "img": "/static/app-plus/sharemenu/more.png",
              "text": this.$t("common.more"),
              "share": "shareSystem"
            }
          ],
          cancelText: this.$t("common.cancelShare")
        }, (e2) => {
          formatAppLog("log", "at pages/list/detail.vue:401", e2);
        });
      }
    }
  };
  function _sfc_render$E(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_nav_bar = resolveEasycom(vue.resolveDynamicComponent("uni-nav-bar"), __easycom_0$9);
    const _component_uni_dateformat = resolveEasycom(vue.resolveDynamicComponent("uni-dateformat"), __easycom_0$8);
    const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$4);
    const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
    const _component_unicloud_db = resolveEasycom(vue.resolveDynamicComponent("unicloud-db"), __easycom_4$3);
    const _component_comment_item = resolveEasycom(vue.resolveDynamicComponent("comment-item"), __easycom_5$2);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock(
      vue.Fragment,
      null,
      [
        vue.createCommentVNode("\r\n	 本页面模板教程：https://ext.dcloud.net.cn/plugin?id=2717\r\n	 uni-list 文档：https://ext.dcloud.net.cn/plugin?id=24\r\n	 uniCloud 文档：https://uniapp.dcloud.io/uniCloud/README\r\n	 unicloud-db 组件文档：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db-component\r\n	 DB Schema 规范：https://uniapp.dcloud.net.cn/uniCloud/schema\r\n	 "),
        vue.createElementVNode("view", { class: "article" }, [
          vue.createVNode(_component_uni_nav_bar, {
            statusBar: true,
            border: false
          }),
          vue.createElementVNode(
            "view",
            { class: "article-title" },
            vue.toDisplayString($data.title),
            1
            /* TEXT */
          ),
          vue.createVNode(_component_unicloud_db, {
            options: $data.formData,
            collection: "opendb-news-articles,uni-id-users",
            field: $data.field,
            getone: true,
            where: $options.where,
            manual: true,
            ref: "detail",
            foreignKey: "opendb-news-articles.user_id",
            onLoad: $options.loadData
          }, {
            default: vue.withCtx(({ data: data2, loading, error: error2, options }) => [
              !loading && data2 ? (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                { key: 0 },
                [
                  vue.createVNode(
                    _component_uni_list,
                    { border: false },
                    {
                      default: vue.withCtx(() => [
                        vue.createVNode(_component_uni_list_item, {
                          thumbSize: "lg",
                          thumb: data2.image
                        }, {
                          body: vue.withCtx(() => [
                            vue.createElementVNode("view", { class: "header-content" }, [
                              vue.createElementVNode(
                                "view",
                                { class: "uni-title" },
                                vue.toDisplayString(data2.user_id && data2.user_id[0] && data2.user_id[0].nickname || data2.country),
                                1
                                /* TEXT */
                              )
                            ])
                          ]),
                          footer: vue.withCtx(() => [
                            vue.createElementVNode("view", { class: "footer" }, [
                              vue.createElementVNode("view", { class: "uni-note" }, [
                                vue.createVNode(_component_uni_dateformat, {
                                  date: data2.last_modify_date,
                                  format: "yyyy-MM-dd hh:mm",
                                  threshold: [6e4, 2592e6]
                                }, null, 8, ["date"])
                              ])
                            ])
                          ]),
                          _: 2
                          /* DYNAMIC */
                        }, 1032, ["thumb"])
                      ]),
                      _: 2
                      /* DYNAMIC */
                    },
                    1024
                    /* DYNAMIC_SLOTS */
                  ),
                  vue.createCommentVNode(" 文章开头，缩略图 "),
                  vue.createElementVNode("image", {
                    class: "banner-img",
                    src: data2.img_url,
                    mode: "widthFix"
                  }, null, 8, ["src"]),
                  vue.createCommentVNode(" 文章摘要 "),
                  vue.createElementVNode("view", { class: "article-content" }, [
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Descripton:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.description
                      }, null, 8, ["nodes"])
                    ]),
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Department:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.department
                      }, null, 8, ["nodes"])
                    ]),
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Medium:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.medium
                      }, null, 8, ["nodes"])
                    ]),
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Dated:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.dated
                      }, null, 8, ["nodes"])
                    ]),
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Web:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.web_url
                      }, null, 8, ["nodes"])
                    ]),
                    vue.createElementVNode("div", { class: "Bbox" }, [
                      vue.createElementVNode("view", { class: "des" }, "Comments:"),
                      vue.createElementVNode("rich-text", {
                        nodes: data2.comments
                      }, null, 8, ["nodes"])
                    ])
                  ])
                ],
                64
                /* STABLE_FRAGMENT */
              )) : vue.createCommentVNode("v-if", true)
            ]),
            _: 1
            /* STABLE */
          }, 8, ["options", "field", "where", "onLoad"])
        ]),
        vue.createCommentVNode("点赞"),
        vue.createElementVNode("view", { class: "zan" }, [
          vue.createElementVNode("view", {
            class: "zan_box",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.clicklike && $options.clicklike(...args))
          }, [
            $data.hadzan == "false" ? (vue.openBlock(), vue.createElementBlock("image", {
              key: 0,
              class: "zan_img",
              src: _imports_0$4
            })) : (vue.openBlock(), vue.createElementBlock("image", {
              key: 1,
              class: "zan_img",
              src: _imports_1$2
            }))
          ])
        ]),
        vue.createCommentVNode(" 评论内容子组件 "),
        vue.createVNode(_component_unicloud_db, { collection: $data.colList }, {
          default: vue.withCtx(({ data: data2, loading, error: error2, options }) => [
            vue.createElementVNode("view", { class: "content" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(data2, (item) => {
                  return vue.openBlock(), vue.createElementBlock("view", { class: "item" }, [
                    vue.createVNode(_component_comment_item, { item }, null, 8, ["item"])
                  ]);
                }),
                256
                /* UNKEYED_FRAGMENT */
              ))
            ])
          ]),
          _: 1
          /* STABLE */
        }, 8, ["collection"]),
        vue.createCommentVNode(" 评论回复子组件 "),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "commentFrame" }, [
            vue.createVNode(_component_uni_easyinput, {
              ref: "uipt",
              onConfirm: $options.goComment,
              suffixIcon: "paperplane",
              modelValue: _ctx.replyContent,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => _ctx.replyContent = $event),
              placeholder: $data.placeholder,
              onIconClick: $options.goComment
            }, null, 8, ["onConfirm", "modelValue", "placeholder", "onIconClick"])
          ])
        ])
      ],
      64
      /* STABLE_FRAGMENT */
    );
  }
  const PagesListDetail = /* @__PURE__ */ _export_sfc(_sfc_main$F, [["render", _sfc_render$E], ["__scopeId", "data-v-495067d4"], ["__file", "G:/HBuilderProjects/Toby/pages/list/detail.vue"]]);
  class MPAnimation {
    constructor(options, _this) {
      this.options = options;
      this.animation = uni.createAnimation(options);
      this.currentStepAnimates = {};
      this.next = 0;
      this.$ = _this;
    }
    _nvuePushAnimates(type, args) {
      let aniObj = this.currentStepAnimates[this.next];
      let styles = {};
      if (!aniObj) {
        styles = {
          styles: {},
          config: {}
        };
      } else {
        styles = aniObj;
      }
      if (animateTypes1.includes(type)) {
        if (!styles.styles.transform) {
          styles.styles.transform = "";
        }
        let unit = "";
        if (type === "rotate") {
          unit = "deg";
        }
        styles.styles.transform += `${type}(${args + unit}) `;
      } else {
        styles.styles[type] = `${args}`;
      }
      this.currentStepAnimates[this.next] = styles;
    }
    _animateRun(styles = {}, config2 = {}) {
      let ref = this.$.$refs["ani"].ref;
      if (!ref)
        return;
      return new Promise((resolve, reject) => {
        nvueAnimation.transition(ref, {
          styles,
          ...config2
        }, (res) => {
          resolve();
        });
      });
    }
    _nvueNextAnimate(animates, step = 0, fn) {
      let obj = animates[step];
      if (obj) {
        let {
          styles,
          config: config2
        } = obj;
        this._animateRun(styles, config2).then(() => {
          step += 1;
          this._nvueNextAnimate(animates, step, fn);
        });
      } else {
        this.currentStepAnimates = {};
        typeof fn === "function" && fn();
        this.isEnd = true;
      }
    }
    step(config2 = {}) {
      this.animation.step(config2);
      return this;
    }
    run(fn) {
      this.$.animationData = this.animation.export();
      this.$.timer = setTimeout(() => {
        typeof fn === "function" && fn();
      }, this.$.durationTime);
    }
  }
  const animateTypes1 = [
    "matrix",
    "matrix3d",
    "rotate",
    "rotate3d",
    "rotateX",
    "rotateY",
    "rotateZ",
    "scale",
    "scale3d",
    "scaleX",
    "scaleY",
    "scaleZ",
    "skew",
    "skewX",
    "skewY",
    "translate",
    "translate3d",
    "translateX",
    "translateY",
    "translateZ"
  ];
  const animateTypes2 = ["opacity", "backgroundColor"];
  const animateTypes3 = ["width", "height", "left", "right", "top", "bottom"];
  animateTypes1.concat(animateTypes2, animateTypes3).forEach((type) => {
    MPAnimation.prototype[type] = function(...args) {
      this.animation[type](...args);
      return this;
    };
  });
  function createAnimation(option, _this) {
    if (!_this)
      return;
    clearTimeout(_this.timer);
    return new MPAnimation(option, _this);
  }
  const _sfc_main$E = {
    name: "uniTransition",
    emits: ["click", "change"],
    props: {
      show: {
        type: Boolean,
        default: false
      },
      modeClass: {
        type: [Array, String],
        default() {
          return "fade";
        }
      },
      duration: {
        type: Number,
        default: 300
      },
      styles: {
        type: Object,
        default() {
          return {};
        }
      },
      customClass: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        isShow: false,
        transform: "",
        opacity: 1,
        animationData: {},
        durationTime: 300,
        config: {}
      };
    },
    watch: {
      show: {
        handler(newVal) {
          if (newVal) {
            this.open();
          } else {
            if (this.isShow) {
              this.close();
            }
          }
        },
        immediate: true
      }
    },
    computed: {
      // 生成样式数据
      stylesObject() {
        let styles = {
          ...this.styles,
          "transition-duration": this.duration / 1e3 + "s"
        };
        let transform = "";
        for (let i2 in styles) {
          let line = this.toLine(i2);
          transform += line + ":" + styles[i2] + ";";
        }
        return transform;
      },
      // 初始化动画条件
      transformStyles() {
        return "transform:" + this.transform + ";opacity:" + this.opacity + ";" + this.stylesObject;
      }
    },
    created() {
      this.config = {
        duration: this.duration,
        timingFunction: "ease",
        transformOrigin: "50% 50%",
        delay: 0
      };
      this.durationTime = this.duration;
    },
    methods: {
      /**
       *  ref 触发 初始化动画
       */
      init(obj = {}) {
        if (obj.duration) {
          this.durationTime = obj.duration;
        }
        this.animation = createAnimation(Object.assign(this.config, obj), this);
      },
      /**
       * 点击组件触发回调
       */
      onClick() {
        this.$emit("click", {
          detail: this.isShow
        });
      },
      /**
       * ref 触发 动画分组
       * @param {Object} obj
       */
      step(obj, config2 = {}) {
        if (!this.animation)
          return;
        for (let i2 in obj) {
          try {
            if (typeof obj[i2] === "object") {
              this.animation[i2](...obj[i2]);
            } else {
              this.animation[i2](obj[i2]);
            }
          } catch (e2) {
            formatAppLog("error", "at uni_modules/uni-transition/components/uni-transition/uni-transition.vue:139", `方法 ${i2} 不存在`);
          }
        }
        this.animation.step(config2);
        return this;
      },
      /**
       *  ref 触发 执行动画
       */
      run(fn) {
        if (!this.animation)
          return;
        this.animation.run(fn);
      },
      // 开始过度动画
      open() {
        clearTimeout(this.timer);
        this.transform = "";
        this.isShow = true;
        let { opacity, transform } = this.styleInit(false);
        if (typeof opacity !== "undefined") {
          this.opacity = opacity;
        }
        this.transform = transform;
        this.$nextTick(() => {
          this.timer = setTimeout(() => {
            this.animation = createAnimation(this.config, this);
            this.tranfromInit(false).step();
            this.animation.run();
            this.$emit("change", {
              detail: this.isShow
            });
          }, 20);
        });
      },
      // 关闭过度动画
      close(type) {
        if (!this.animation)
          return;
        this.tranfromInit(true).step().run(() => {
          this.isShow = false;
          this.animationData = null;
          this.animation = null;
          let { opacity, transform } = this.styleInit(false);
          this.opacity = opacity || 1;
          this.transform = transform;
          this.$emit("change", {
            detail: this.isShow
          });
        });
      },
      // 处理动画开始前的默认样式
      styleInit(type) {
        let styles = {
          transform: ""
        };
        let buildStyle = (type2, mode) => {
          if (mode === "fade") {
            styles.opacity = this.animationType(type2)[mode];
          } else {
            styles.transform += this.animationType(type2)[mode] + " ";
          }
        };
        if (typeof this.modeClass === "string") {
          buildStyle(type, this.modeClass);
        } else {
          this.modeClass.forEach((mode) => {
            buildStyle(type, mode);
          });
        }
        return styles;
      },
      // 处理内置组合动画
      tranfromInit(type) {
        let buildTranfrom = (type2, mode) => {
          let aniNum = null;
          if (mode === "fade") {
            aniNum = type2 ? 0 : 1;
          } else {
            aniNum = type2 ? "-100%" : "0";
            if (mode === "zoom-in") {
              aniNum = type2 ? 0.8 : 1;
            }
            if (mode === "zoom-out") {
              aniNum = type2 ? 1.2 : 1;
            }
            if (mode === "slide-right") {
              aniNum = type2 ? "100%" : "0";
            }
            if (mode === "slide-bottom") {
              aniNum = type2 ? "100%" : "0";
            }
          }
          this.animation[this.animationMode()[mode]](aniNum);
        };
        if (typeof this.modeClass === "string") {
          buildTranfrom(type, this.modeClass);
        } else {
          this.modeClass.forEach((mode) => {
            buildTranfrom(type, mode);
          });
        }
        return this.animation;
      },
      animationType(type) {
        return {
          fade: type ? 1 : 0,
          "slide-top": `translateY(${type ? "0" : "-100%"})`,
          "slide-right": `translateX(${type ? "0" : "100%"})`,
          "slide-bottom": `translateY(${type ? "0" : "100%"})`,
          "slide-left": `translateX(${type ? "0" : "-100%"})`,
          "zoom-in": `scaleX(${type ? 1 : 0.8}) scaleY(${type ? 1 : 0.8})`,
          "zoom-out": `scaleX(${type ? 1 : 1.2}) scaleY(${type ? 1 : 1.2})`
        };
      },
      // 内置动画类型与实际动画对应字典
      animationMode() {
        return {
          fade: "opacity",
          "slide-top": "translateY",
          "slide-right": "translateX",
          "slide-bottom": "translateY",
          "slide-left": "translateX",
          "zoom-in": "scale",
          "zoom-out": "scale"
        };
      },
      // 驼峰转中横线
      toLine(name) {
        return name.replace(/([A-Z])/g, "-$1").toLowerCase();
      }
    }
  };
  function _sfc_render$D(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.isShow ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      ref: "ani",
      animation: $data.animationData,
      class: vue.normalizeClass($props.customClass),
      style: vue.normalizeStyle($options.transformStyles),
      onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      vue.renderSlot(_ctx.$slots, "default")
    ], 14, ["animation"])) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0$6 = /* @__PURE__ */ _export_sfc(_sfc_main$E, [["render", _sfc_render$D], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-transition/components/uni-transition/uni-transition.vue"]]);
  const _sfc_main$D = {
    name: "uniPopup",
    components: {},
    emits: ["change", "maskClick"],
    props: {
      // 开启动画
      animation: {
        type: Boolean,
        default: true
      },
      // 弹出层类型，可选值，top: 顶部弹出层；bottom：底部弹出层；center：全屏弹出层
      // message: 消息提示 ; dialog : 对话框
      type: {
        type: String,
        default: "center"
      },
      // maskClick
      isMaskClick: {
        type: Boolean,
        default: null
      },
      // TODO 2 个版本后废弃属性 ，使用 isMaskClick
      maskClick: {
        type: Boolean,
        default: null
      },
      backgroundColor: {
        type: String,
        default: "none"
      },
      safeArea: {
        type: Boolean,
        default: true
      },
      maskBackgroundColor: {
        type: String,
        default: "rgba(0, 0, 0, 0.4)"
      }
    },
    watch: {
      /**
       * 监听type类型
       */
      type: {
        handler: function(type) {
          if (!this.config[type])
            return;
          this[this.config[type]](true);
        },
        immediate: true
      },
      isDesktop: {
        handler: function(newVal) {
          if (!this.config[newVal])
            return;
          this[this.config[this.type]](true);
        },
        immediate: true
      },
      /**
       * 监听遮罩是否可点击
       * @param {Object} val
       */
      maskClick: {
        handler: function(val) {
          this.mkclick = val;
        },
        immediate: true
      },
      isMaskClick: {
        handler: function(val) {
          this.mkclick = val;
        },
        immediate: true
      },
      // H5 下禁止底部滚动
      showPopup(show) {
      }
    },
    data() {
      return {
        duration: 300,
        ani: [],
        showPopup: false,
        showTrans: false,
        popupWidth: 0,
        popupHeight: 0,
        config: {
          top: "top",
          bottom: "bottom",
          center: "center",
          left: "left",
          right: "right",
          message: "top",
          dialog: "center",
          share: "bottom"
        },
        maskClass: {
          position: "fixed",
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)"
        },
        transClass: {
          position: "fixed",
          left: 0,
          right: 0
        },
        maskShow: true,
        mkclick: true,
        popupstyle: this.isDesktop ? "fixforpc-top" : "top"
      };
    },
    computed: {
      isDesktop() {
        return this.popupWidth >= 500 && this.popupHeight >= 500;
      },
      bg() {
        if (this.backgroundColor === "" || this.backgroundColor === "none") {
          return "transparent";
        }
        return this.backgroundColor;
      }
    },
    mounted() {
      const fixSize = () => {
        const {
          windowWidth,
          windowHeight,
          windowTop,
          safeArea,
          screenHeight,
          safeAreaInsets
        } = uni.getSystemInfoSync();
        this.popupWidth = windowWidth;
        this.popupHeight = windowHeight + (windowTop || 0);
        if (safeArea && this.safeArea) {
          this.safeAreaInsets = safeAreaInsets.bottom;
        } else {
          this.safeAreaInsets = 0;
        }
      };
      fixSize();
    },
    // TODO vue3
    unmounted() {
      this.setH5Visible();
    },
    created() {
      if (this.isMaskClick === null && this.maskClick === null) {
        this.mkclick = true;
      } else {
        this.mkclick = this.isMaskClick !== null ? this.isMaskClick : this.maskClick;
      }
      if (this.animation) {
        this.duration = 300;
      } else {
        this.duration = 0;
      }
      this.messageChild = null;
      this.clearPropagation = false;
      this.maskClass.backgroundColor = this.maskBackgroundColor;
    },
    methods: {
      setH5Visible() {
      },
      /**
       * 公用方法，不显示遮罩层
       */
      closeMask() {
        this.maskShow = false;
      },
      /**
       * 公用方法，遮罩层禁止点击
       */
      disableMask() {
        this.mkclick = false;
      },
      // TODO nvue 取消冒泡
      clear(e2) {
        e2.stopPropagation();
        this.clearPropagation = true;
      },
      open(direction) {
        if (this.showPopup) {
          clearTimeout(this.timer);
          this.showPopup = false;
        }
        let innerType = ["top", "center", "bottom", "left", "right", "message", "dialog", "share"];
        if (!(direction && innerType.indexOf(direction) !== -1)) {
          direction = this.type;
        }
        if (!this.config[direction]) {
          formatAppLog("error", "at uni_modules/uni-popup/components/uni-popup/uni-popup.vue:280", "缺少类型：", direction);
          return;
        }
        this[this.config[direction]]();
        this.$emit("change", {
          show: true,
          type: direction
        });
      },
      close(type) {
        this.showTrans = false;
        this.$emit("change", {
          show: false,
          type: this.type
        });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.showPopup = false;
        }, 300);
      },
      // TODO 处理冒泡事件，头条的冒泡事件有问题 ，先这样兼容
      touchstart() {
        this.clearPropagation = false;
      },
      onTap() {
        if (this.clearPropagation) {
          this.clearPropagation = false;
          return;
        }
        this.$emit("maskClick");
        if (!this.mkclick)
          return;
        this.close();
      },
      /**
       * 顶部弹出样式处理
       */
      top(type) {
        this.popupstyle = this.isDesktop ? "fixforpc-top" : "top";
        this.ani = ["slide-top"];
        this.transClass = {
          position: "fixed",
          left: 0,
          right: 0,
          backgroundColor: this.bg
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
        this.$nextTick(() => {
          if (this.messageChild && this.type === "message") {
            this.messageChild.timerClose();
          }
        });
      },
      /**
       * 底部弹出样式处理
       */
      bottom(type) {
        this.popupstyle = "bottom";
        this.ani = ["slide-bottom"];
        this.transClass = {
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: this.safeAreaInsets + "px",
          backgroundColor: this.bg
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
      },
      /**
       * 中间弹出样式处理
       */
      center(type) {
        this.popupstyle = "center";
        this.ani = ["zoom-out", "fade"];
        this.transClass = {
          position: "fixed",
          display: "flex",
          flexDirection: "column",
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          justifyContent: "center",
          alignItems: "center"
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
      },
      left(type) {
        this.popupstyle = "left";
        this.ani = ["slide-left"];
        this.transClass = {
          position: "fixed",
          left: 0,
          bottom: 0,
          top: 0,
          backgroundColor: this.bg,
          display: "flex",
          flexDirection: "column"
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
      },
      right(type) {
        this.popupstyle = "right";
        this.ani = ["slide-right"];
        this.transClass = {
          position: "fixed",
          bottom: 0,
          right: 0,
          top: 0,
          backgroundColor: this.bg,
          display: "flex",
          flexDirection: "column"
        };
        if (type)
          return;
        this.showPopup = true;
        this.showTrans = true;
      }
    }
  };
  function _sfc_render$C(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_transition = resolveEasycom(vue.resolveDynamicComponent("uni-transition"), __easycom_0$6);
    return $data.showPopup ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["uni-popup", [$data.popupstyle, $options.isDesktop ? "fixforpc-z-index" : ""]])
      },
      [
        vue.createElementVNode(
          "view",
          {
            onTouchstart: _cache[1] || (_cache[1] = (...args) => $options.touchstart && $options.touchstart(...args))
          },
          [
            $data.maskShow ? (vue.openBlock(), vue.createBlock(_component_uni_transition, {
              key: "1",
              name: "mask",
              "mode-class": "fade",
              styles: $data.maskClass,
              duration: $data.duration,
              show: $data.showTrans,
              onClick: $options.onTap
            }, null, 8, ["styles", "duration", "show", "onClick"])) : vue.createCommentVNode("v-if", true),
            vue.createVNode(_component_uni_transition, {
              key: "2",
              "mode-class": $data.ani,
              name: "content",
              styles: $data.transClass,
              duration: $data.duration,
              show: $data.showTrans,
              onClick: $options.onTap
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["uni-popup__wrapper", [$data.popupstyle]]),
                    style: vue.normalizeStyle({ backgroundColor: $options.bg }),
                    onClick: _cache[0] || (_cache[0] = (...args) => $options.clear && $options.clear(...args))
                  },
                  [
                    vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
                  ],
                  6
                  /* CLASS, STYLE */
                )
              ]),
              _: 3
              /* FORWARDED */
            }, 8, ["mode-class", "styles", "duration", "show", "onClick"])
          ],
          32
          /* HYDRATE_EVENTS */
        )
      ],
      2
      /* CLASS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$D, [["render", _sfc_render$C], ["__scopeId", "data-v-4dd3c44b"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-popup/components/uni-popup/uni-popup.vue"]]);
  const ADType = {
    RewardedVideo: "RewardedVideo",
    FullScreenVideo: "FullScreenVideo"
  };
  class AdHelper {
    constructor() {
      this._ads = {};
    }
    load(options, onload, onerror) {
      let ops = this._fixOldOptions(options);
      let {
        adpid
      } = ops;
      if (!adpid || this.isBusy(adpid)) {
        return;
      }
      this.get(ops).load(onload, onerror);
    }
    show(options, onsuccess, onfail) {
      let ops = this._fixOldOptions(options);
      let {
        adpid
      } = ops;
      if (!adpid) {
        return;
      }
      uni.showLoading({
        mask: true
      });
      var ad = this.get(ops);
      ad.load(() => {
        uni.hideLoading();
        ad.show((e2) => {
          onsuccess && onsuccess(e2);
        });
      }, (err) => {
        uni.hideLoading();
        onfail && onfail(err);
      });
    }
    isBusy(adpid) {
      return this._ads[adpid] && this._ads[adpid].isLoading;
    }
    get(options) {
      const {
        adpid,
        singleton = true
      } = options;
      if (singleton === false) {
        if (this._ads[adpid]) {
          this._ads[adpid].destroy();
          delete this._ads[adpid];
        }
      }
      delete options.singleton;
      if (!this._ads[adpid]) {
        this._ads[adpid] = this._createAdInstance(options);
      }
      return this._ads[adpid];
    }
    _createAdInstance(options) {
      const adType = options.adType || ADType.RewardedVideo;
      delete options.adType;
      let ad = null;
      if (adType === ADType.RewardedVideo) {
        ad = new RewardedVideo(options);
      } else if (adType === ADType.FullScreenVideo) {
        ad = new FullScreenVideo(options);
      }
      return ad;
    }
    _fixOldOptions(options) {
      return typeof options === "string" ? {
        adpid: options
      } : options;
    }
  }
  const EXPIRED_TIME = 1e3 * 60 * 30;
  const ProviderType = {
    CSJ: "csj",
    GDT: "gdt"
  };
  const RETRY_COUNT = 1;
  class AdBase {
    constructor(adInstance, options = {}) {
      this._isLoad = false;
      this._isLoading = false;
      this._lastLoadTime = 0;
      this._lastError = null;
      this._retryCount = 0;
      this._loadCallback = null;
      this._closeCallback = null;
      this._errorCallback = null;
      const ad = this._ad = adInstance;
      ad.onLoad((e2) => {
        this._isLoading = false;
        this._isLoad = true;
        this._lastLoadTime = Date.now();
        this.onLoad();
      });
      ad.onClose((e2) => {
        this._isLoad = false;
        this.onClose(e2);
      });
      ad.onVerify && ad.onVerify((e2) => {
      });
      ad.onError(({
        code,
        message
      }) => {
        this._isLoading = false;
        const data2 = {
          code,
          errMsg: message
        };
        if (code === -5008) {
          this._loadAd();
          return;
        }
        if (this._retryCount < RETRY_COUNT) {
          this._retryCount += 1;
          this._loadAd();
          return;
        }
        this._lastError = data2;
        this.onError(data2);
      });
    }
    get isExpired() {
      return this._lastLoadTime !== 0 && Math.abs(Date.now() - this._lastLoadTime) > EXPIRED_TIME;
    }
    get isLoading() {
      return this._isLoading;
    }
    getProvider() {
      return this._ad.getProvider();
    }
    load(onload, onerror) {
      this._loadCallback = onload;
      this._errorCallback = onerror;
      if (this._isLoading) {
        return;
      }
      if (this._isLoad) {
        this.onLoad();
        return;
      }
      this._retryCount = 0;
      this._loadAd();
    }
    show(onclose) {
      this._closeCallback = onclose;
      if (this._isLoading || !this._isLoad) {
        return;
      }
      if (this._lastError !== null) {
        this.onError(this._lastError);
        return;
      }
      const provider = this.getProvider();
      if (provider === ProviderType.CSJ && this.isExpired) {
        this._loadAd();
        return;
      }
      this._ad.show();
    }
    onLoad(e2) {
      if (this._loadCallback != null) {
        this._loadCallback();
      }
    }
    onClose(e2) {
      if (this._closeCallback != null) {
        this._closeCallback({
          isEnded: e2.isEnded
        });
      }
    }
    onError(e2) {
      if (this._errorCallback != null) {
        this._errorCallback(e2);
      }
    }
    destroy() {
      this._ad.destroy();
    }
    _loadAd() {
      this._isLoad = false;
      this._isLoading = true;
      this._lastError = null;
      this._ad.load();
    }
  }
  class RewardedVideo extends AdBase {
    constructor(options = {}) {
      super(plus.ad.createRewardedVideoAd(options), options);
    }
  }
  class FullScreenVideo extends AdBase {
    constructor(options = {}) {
      super(plus.ad.createFullScreenVideoAd(options), options);
    }
  }
  const AD = new AdHelper();
  const _imports_0$3 = "/uni_modules/uni-sign-in/static/background.png";
  const db$4 = Ds.database();
  const signInTable = db$4.action("signIn").collection("opendb-sign-in");
  new Date(new Date().toLocaleDateString()).getTime();
  const _sfc_main$C = {
    name: "uni-signIn",
    data() {
      return {
        total: 0,
        scores: 0,
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        signInRes: {
          days: [],
          n: 0
        }
      };
    },
    mounted() {
    },
    methods: {
      async getSignedInInfo(ToastText = "今日已签过") {
        const date = new Date(new Date().toLocaleDateString()).getTime();
        let res = await signInTable.where(`'user_id' == $env.uid && 'date' == ${date} && 'isDelete' == false`).get();
        if (res.result.data.length) {
          this.signInRes = res.result;
          this.$refs.popup.open();
          uni.showToast({
            title: ToastText,
            duration: 3e3,
            icon: "none"
          });
        }
        return res.result.data;
      },
      //看激励视频广告签到
      async showRewardedVideoAd() {
        let res = await this.getSignedInInfo();
        formatAppLog("log", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:83", res);
        if (res && res.length == 0) {
          let userId = Ds.getCurrentUserInfo().uid;
          if (!userId) {
            return uni.navigateTo({
              url: "/pages/ucenter/login-page/index/index"
            });
          }
          AD.show({
            adpid: 1733738477,
            // HBuilder 基座测试广告位
            adType: "RewardedVideo",
            urlCallback: {
              userId,
              extra: "uniSignIn"
            }
          }, (res2) => {
            if (res2 && res2.isEnded) {
              formatAppLog("log", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:103", "onClose " + res2.isEnded);
              let i2 = 0;
              uni.showLoading({
                mask: true
              });
              let myIntive = setInterval(async (e2) => {
                i2++;
                res2 = await this.getSignedInInfo("签到成功");
                if (i2 > 2 || res2.length) {
                  if (!res2.length) {
                    uni.showToast({
                      title: "签到失败！",
                      icon: "error",
                      duration: 6e3
                    });
                  }
                  clearInterval(myIntive);
                  uni.hideLoading();
                }
              }, 2e3);
            } else {
              formatAppLog("log", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:127", "onClose " + res2.isEnded);
              uni.showToast({
                title: "播放中途退出,签到失败！",
                icon: "error",
                duration: 5e3
              });
            }
          }, (err) => {
            formatAppLog("log", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:137", err);
            uni.showToast({
              title: err.errMsg,
              icon: "none"
            });
          });
        }
      },
      //普通点击签到
      async open() {
        uni.showLoading({
          mask: true
        });
        try {
          let res = await this.getSignedInInfo();
          if (res && res.length == 0) {
            let res2 = await signInTable.add({});
            formatAppLog("log", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:154", res2);
            uni.hideLoading();
            this.signInRes = res2.result;
            this.$refs.popup.open();
            if (this.signInRes.days.length == 7) {
              uni.showToast({
                title: "你已完成7日连续签到，获得60积分！",
                icon: "none",
                duration: 5e3
              });
            } else {
              uni.showToast({
                title: "签到成功,获得10积分！",
                icon: "none",
                duration: 5e3
              });
            }
          }
        } catch (e2) {
          uni.hideLoading();
          formatAppLog("error", "at uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue:174", e2);
        }
      },
      closeMe(e2) {
        this.$refs.popup.close();
      }
    }
  };
  function _sfc_render$B(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1$1);
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "popup",
          type: "center"
        },
        {
          default: vue.withCtx(() => [
            vue.createElementVNode("image", {
              class: "background-img",
              src: _imports_0$3,
              mode: "width"
            }),
            vue.createElementVNode("view", { class: "content" }, [
              vue.createElementVNode("view", { class: "main" }, [
                vue.createElementVNode("text", { class: "title" }, "今日签到成功"),
                vue.createElementVNode(
                  "text",
                  { class: "total" },
                  "本轮已签到" + vue.toDisplayString($data.signInRes.days.length) + "天",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "scores" },
                  "当前积分：" + vue.toDisplayString($data.signInRes.score),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", { class: "days-box" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($data.weekdays, (item, index) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        class: "days",
                        key: index
                      }, [
                        $data.signInRes.days.includes(item - 1) ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                          key: 0,
                          class: "icon active",
                          color: "#FFFFFF",
                          type: "checkmarkempty"
                        })) : (vue.openBlock(), vue.createElementBlock(
                          vue.Fragment,
                          { key: 1 },
                          [
                            item < $data.signInRes.n ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                              key: 0,
                              class: "icon active",
                              color: "#FFFFFF",
                              type: "closeempty"
                            })) : (vue.openBlock(), vue.createBlock(_component_uni_icons, {
                              key: 1,
                              class: "icon",
                              type: "checkmarkempty",
                              color: "#FFFFFF"
                            }))
                          ],
                          64
                          /* STABLE_FRAGMENT */
                        )),
                        $data.signInRes.days.includes(item - 1) || item > $data.signInRes.n ? (vue.openBlock(), vue.createElementBlock(
                          "text",
                          {
                            key: 2,
                            class: vue.normalizeClass(["day", { grey: item > $data.signInRes.n }])
                          },
                          "第" + vue.toDisplayString(item) + "天",
                          3
                          /* TEXT, CLASS */
                        )) : (vue.openBlock(), vue.createElementBlock("text", {
                          key: 3,
                          class: "day"
                        }, "缺卡"))
                      ]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ]),
                vue.createElementVNode("view", { class: "tip-box" }, [
                  vue.createElementVNode("text", { class: "tip" }, "签到一次得10积分"),
                  vue.createElementVNode("view", { class: "row" }, [
                    vue.createElementVNode("text", { class: "tip" }, "连续签到7天可多得"),
                    vue.createElementVNode("text", { class: "red" }, "50"),
                    vue.createElementVNode("text", { class: "tip" }, "积分")
                  ])
                ])
              ]),
              vue.createVNode(_component_uni_icons, {
                onClick: $options.closeMe,
                class: "close-icon",
                type: "closeempty",
                size: "20",
                color: "#AAAAAA"
              }, null, 8, ["onClick"])
            ])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const __easycom_0$5 = /* @__PURE__ */ _export_sfc(_sfc_main$C, [["render", _sfc_render$B], ["__scopeId", "data-v-dc1d9ace"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue"]]);
  function callCheckVersion() {
    return new Promise((resolve, reject) => {
      plus.runtime.getProperty(plus.runtime.appid, function(widgetInfo) {
        const data2 = {
          action: "checkVersion",
          appid: plus.runtime.appid,
          appVersion: plus.runtime.version,
          wgtVersion: widgetInfo.version
        };
        formatAppLog("log", "at uni_modules/uni-upgrade-center-app/utils/call-check-version.js:11", "data: ", data2);
        Ds.callFunction({
          name: "uni-upgrade-center",
          data: data2,
          success: (e2) => {
            formatAppLog("log", "at uni_modules/uni-upgrade-center-app/utils/call-check-version.js:16", "e: ", e2);
            resolve(e2);
          },
          fail: (error2) => {
            reject(error2);
          }
        });
      });
    });
  }
  const PACKAGE_INFO_KEY = "__package_info__";
  function checkUpdate() {
    return new Promise((resolve, reject) => {
      callCheckVersion().then(async (e2) => {
        if (!e2.result)
          return;
        const {
          code,
          message,
          is_silently,
          // 是否静默更新
          url,
          // 安装包下载地址
          platform: platform2,
          // 安装包平台
          type
          // 安装包类型
        } = e2.result;
        if (code > 0) {
          const {
            fileList
          } = await Ds.getTempFileURL({
            fileList: [url]
          });
          if (fileList[0].tempFileURL)
            e2.result.url = fileList[0].tempFileURL;
          resolve(e2);
          if (is_silently) {
            uni.downloadFile({
              url: e2.result.url,
              success: (res) => {
                if (res.statusCode == 200) {
                  plus.runtime.install(res.tempFilePath, {
                    force: false
                  });
                }
              }
            });
            return;
          }
          uni.setStorageSync(PACKAGE_INFO_KEY, e2.result);
          uni.navigateTo({
            url: `/uni_modules/uni-upgrade-center-app/pages/upgrade-popup?local_storage_key=${PACKAGE_INFO_KEY}`,
            fail: (err) => {
              formatAppLog("error", "at uni_modules/uni-upgrade-center-app/utils/check-update.js:63", "更新弹框跳转失败", err);
              uni.removeStorageSync(PACKAGE_INFO_KEY);
            }
          });
          return;
        } else if (code < 0) {
          formatAppLog("error", "at uni_modules/uni-upgrade-center-app/utils/check-update.js:71", message);
          return reject(e2);
        }
        return resolve(e2);
      }).catch((err) => {
        formatAppLog("error", "at uni_modules/uni-upgrade-center-app/utils/check-update.js:77", err.message);
        reject(err);
      });
    });
  }
  const uniShare$1 = new UniShare();
  const db$3 = Ds.database();
  const _sfc_main$B = {
    onBackPress({ from }) {
      if (from == "backbutton") {
        this.$nextTick(function() {
          uniShare$1.hide();
        });
        return uniShare$1.isShow;
      }
    },
    data() {
      return {
        gridList: [
          {
            "text": this.$t("mine.showText"),
            "icon": "chat"
          },
          {
            "text": this.$t("mine.showText"),
            "icon": "cloud-upload"
          },
          {
            "text": this.$t("mine.showText"),
            "icon": "contact"
          },
          {
            "text": this.$t("mine.showText"),
            "icon": "download"
          }
        ],
        ucenterList: [
          [
            /*
            
                						{
                							"title": this.$t('mine.toEvaluate'),
                							"event": 'gotoMarket',
                							"icon": "star"
                						},
            
                            */
            {
              "title": this.$t("mine.readArticles"),
              "to": "/pages/ucenter/read-news-log/read-news-log",
              "icon": "flag"
            }
          ],
          [{
            "title": this.$t("mine.feedback"),
            "to": "/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback",
            "icon": "help"
          }, {
            "title": this.$t("mine.settings"),
            "to": "/pages/ucenter/settings/settings",
            "icon": "gear"
          }],
          [{
            "title": this.$t("mine.about"),
            "to": "/pages/ucenter/about/about",
            "icon": "info"
          }]
        ],
        listStyles: {
          "height": "150rpx",
          // 边框高度
          "width": "150rpx",
          // 边框宽度
          "border": {
            // 如果为 Boolean 值，可以控制边框显示与否
            "color": "#eee",
            // 边框颜色
            "width": "1px",
            // 边框宽度
            "style": "solid",
            // 边框样式
            "radius": "100%"
            // 边框圆角，支持百分比
          }
        }
      };
    },
    onLoad() {
      this.ucenterList[this.ucenterList.length - 2].unshift({
        title: this.$t("mine.checkUpdate"),
        // this.this.$t('mine.checkUpdate')"检查更新"
        rightText: this.appVersion.version + "-" + this.appVersion.versionCode,
        event: "checkVersion",
        icon: "loop",
        showBadge: this.appVersion.hasNew
      });
    },
    onShow() {
    },
    computed: {
      userInfo() {
        return store.userInfo;
      },
      hasLogin() {
        return store.hasLogin;
      },
      appVersion() {
        return getApp().appVersion;
      },
      appConfig() {
        return getApp().globalData.config;
      }
    },
    methods: {
      toSettings() {
        uni.navigateTo({
          url: "/pages/ucenter/settings/settings"
        });
      },
      signIn() {
        this.$refs.signIn.open();
      },
      signInByAd() {
        this.$refs.signIn.showRewardedVideoAd();
      },
      /**
       * 个人中心项目列表点击事件
       */
      ucenterListClick(item) {
        if (!item.to && item.event) {
          this[item.event]();
        }
      },
      async checkVersion() {
        let res = await callCheckVersion();
        formatAppLog("log", "at pages/ucenter/ucenter.vue:176", res);
        if (res.result.code > 0) {
          checkUpdate();
        } else {
          uni.showToast({
            title: res.result.message,
            icon: "none"
          });
        }
      },
      toUserInfo() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/userinfo/userinfo"
        });
      },
      tapGrid(index) {
        uni.showToast({
          // title: '你点击了，第' + (index + 1) + '个',
          title: this.$t("mine.clicked") + " " + (index + 1),
          icon: "none"
        });
      },
      /**
       * 去应用市场评分
       */
      gotoMarket() {
        if (uni.getSystemInfoSync().platform == "ios") {
          let appstoreid = this.appConfig.marketId.ios;
          formatAppLog("log", "at pages/ucenter/ucenter.vue:206", { appstoreid });
          plus.runtime.openURL("itms-apps://itunes.apple.com/cn/app/wechat/" + appstoreid + "?mt=8", (err) => {
            formatAppLog("log", "at pages/ucenter/ucenter.vue:208", "plus.runtime.openURL err:" + JSON.stringify(err));
          });
        }
        if (uni.getSystemInfoSync().platform == "android") {
          var Uri = plus.android.importClass("android.net.Uri");
          var uri = Uri.parse("market://details?id=" + this.appConfig.marketId.android);
          var Intent = plus.android.importClass("android.content.Intent");
          var intent = new Intent(Intent.ACTION_VIEW, uri);
          var main = plus.android.runtimeMainActivity();
          main.startActivity(intent);
        }
      },
      /**
       * 获取积分信息
       */
      getScore() {
        if (!this.userInfo)
          return uni.showToast({
            title: this.$t("mine.checkScore"),
            icon: "none"
          });
        uni.showLoading({
          mask: true
        });
        db$3.collection("uni-id-scores").where('"user_id" == $env.uid').field("score,balance").orderBy("create_date", "desc").limit(1).get().then((res) => {
          formatAppLog("log", "at pages/ucenter/ucenter.vue:239", res);
          const data2 = res.result.data[0];
          let msg = "";
          msg = data2 ? this.$t("mine.currentScore") + data2.balance : this.$t("mine.noScore");
          uni.showToast({
            title: msg,
            icon: "none"
          });
        }).finally(() => {
          uni.hideLoading();
        });
      },
      async share() {
        let { result } = await db$3.collection("uni-id-users").where("'_id' == $cloudEnv_uid").field("my_invite_code").get();
        let myInviteCode = result.data[0].my_invite_code;
        if (!myInviteCode) {
          return uni.showToast({
            title: "请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode",
            icon: "none"
          });
        }
        formatAppLog("log", "at pages/ucenter/ucenter.vue:260", { myInviteCode });
        let {
          appName,
          logo,
          company,
          slogan
        } = this.appConfig.about;
        uniShare$1.show({
          content: {
            //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
            type: 0,
            href: this.appConfig.h5.url + `/#/pages/ucenter/invite/invite?code=uniInvitationCode:${myInviteCode}`,
            title: appName,
            summary: slogan,
            imageUrl: logo + "?x-oss-process=image/resize,m_fill,h_100,w_100"
            //压缩图片解决，在ios端分享图过大导致的图片失效问题
          },
          menus: [
            {
              "img": "/static/app-plus/sharemenu/wechatfriend.png",
              "text": this.$t("common.wechatFriends"),
              "share": {
                "provider": "weixin",
                "scene": "WXSceneSession"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/wechatmoments.png",
              "text": this.$t("common.wechatBbs"),
              "share": {
                "provider": "weixin",
                "scene": "WXSceneTimeline"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/weibo.png",
              "text": this.$t("common.weibo"),
              "share": {
                "provider": "sinaweibo"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/qq.png",
              "text": "QQ",
              "share": {
                "provider": "qq"
              }
            },
            {
              "img": "/static/app-plus/sharemenu/copyurl.png",
              "text": this.$t("common.copy"),
              "share": "copyurl"
            },
            {
              "img": "/static/app-plus/sharemenu/more.png",
              "text": this.$t("common.more"),
              "share": "shareSystem"
            }
          ],
          cancelText: this.$t("common.cancelShare")
        }, (e2) => {
          formatAppLog("log", "at pages/ucenter/ucenter.vue:321", e2);
        });
      }
    }
  };
  function _sfc_render$A(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_sign_in = resolveEasycom(vue.resolveDynamicComponent("uni-sign-in"), __easycom_0$5);
    const _component_cloud_image = resolveEasycom(vue.resolveDynamicComponent("cloud-image"), __easycom_1$3);
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    const _component_uni_grid_item = resolveEasycom(vue.resolveDynamicComponent("uni-grid-item"), __easycom_3$3);
    const _component_uni_grid = resolveEasycom(vue.resolveDynamicComponent("uni-grid"), __easycom_4$2);
    const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$4);
    const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "center" }, [
      vue.createVNode(
        _component_uni_sign_in,
        { ref: "signIn" },
        null,
        512
        /* NEED_PATCH */
      ),
      vue.createElementVNode(
        "view",
        {
          class: "userInfo",
          onClickCapture: _cache[0] || (_cache[0] = (...args) => $options.toUserInfo && $options.toUserInfo(...args))
        },
        [
          $options.hasLogin && $options.userInfo.avatar_file && $options.userInfo.avatar_file.url ? (vue.openBlock(), vue.createBlock(_component_cloud_image, {
            key: 0,
            width: "150rpx",
            height: "150rpx",
            src: $options.userInfo.avatar_file.url
          }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "defaultAvatarUrl"
          }, [
            vue.createVNode(_component_uni_icons, {
              color: "#ffffff",
              size: "50",
              type: "person-filled"
            })
          ])),
          vue.createElementVNode("view", { class: "logo-title" }, [
            $options.hasLogin ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 0,
                class: "uer-name"
              },
              vue.toDisplayString($options.userInfo.nickname || $options.userInfo.username || $options.userInfo.mobile),
              1
              /* TEXT */
            )) : (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 1,
                class: "uer-name"
              },
              vue.toDisplayString(_ctx.$t("mine.notLogged")),
              1
              /* TEXT */
            ))
          ])
        ],
        32
        /* HYDRATE_EVENTS */
      ),
      vue.createVNode(_component_uni_grid, {
        class: "grid",
        column: 4,
        showBorder: false,
        square: true
      }, {
        default: vue.withCtx(() => [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.gridList, (item, index) => {
              return vue.openBlock(), vue.createBlock(_component_uni_grid_item, {
                class: "item",
                onClick: ($event) => $options.tapGrid(index),
                key: index
              }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_icons, {
                    class: "icon",
                    color: "#007AFF",
                    type: item.icon,
                    size: "26"
                  }, null, 8, ["type"]),
                  vue.createElementVNode(
                    "text",
                    { class: "text" },
                    vue.toDisplayString(item.text),
                    1
                    /* TEXT */
                  )
                ]),
                _: 2
                /* DYNAMIC */
              }, 1032, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        _: 1
        /* STABLE */
      }),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($data.ucenterList, (sublist, index) => {
          return vue.openBlock(), vue.createBlock(
            _component_uni_list,
            {
              class: "center-list",
              key: index
            },
            {
              default: vue.withCtx(() => [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(sublist, (item, i2) => {
                    return vue.openBlock(), vue.createBlock(_component_uni_list_item, {
                      title: item.title,
                      link: "",
                      rightText: item.rightText,
                      key: i2,
                      clickable: true,
                      to: item.to,
                      onClick: ($event) => $options.ucenterListClick(item),
                      "show-extra-icon": true,
                      extraIcon: { type: item.icon, color: "#999" }
                    }, {
                      footer: vue.withCtx(() => [
                        item.showBadge ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          class: "item-footer"
                        }, [
                          vue.createElementVNode(
                            "text",
                            { class: "item-footer-text" },
                            vue.toDisplayString(item.rightText),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode("view", { class: "item-footer-badge" })
                        ])) : vue.createCommentVNode("v-if", true)
                      ]),
                      _: 2
                      /* DYNAMIC */
                    }, 1032, ["title", "rightText", "to", "onClick", "extraIcon"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              _: 2
              /* DYNAMIC */
            },
            1024
            /* DYNAMIC_SLOTS */
          );
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const PagesUcenterUcenter = /* @__PURE__ */ _export_sfc(_sfc_main$B, [["render", _sfc_render$A], ["__scopeId", "data-v-b6546e32"], ["__file", "G:/HBuilderProjects/Toby/pages/ucenter/ucenter.vue"]]);
  function isTurnedOnPush() {
    var isOn = void 0;
    try {
      if ("iOS" == plus.os.name) {
        var types2 = 0;
        var app = plus.ios.invoke("UIApplication", "sharedApplication");
        var settings = plus.ios.invoke(app, "currentUserNotificationSettings");
        if (settings) {
          types2 = settings.plusGetAttribute("types");
          plus.ios.deleteObject(settings);
        } else {
          types2 = plus.ios.invoke(app, "enabledRemoteNotificationTypes");
        }
        plus.ios.deleteObject(app);
        isOn = 0 != types2;
      } else {
        var main = plus.android.runtimeMainActivity();
        var manager = plus.android.invoke("com.igexin.sdk.PushManager", "getInstance");
        isOn = plus.android.invoke(manager, "isPushTurnedOn", main);
      }
    } catch (e2) {
      formatAppLog("error", "at pages/ucenter/settings/dc-push/push.js:25", "exception in isTurnedOnPush@dc-push!!");
    }
    return isOn;
  }
  function turnOnPush() {
    try {
      if ("iOS" == plus.os.name) {
        if (!isTurnedOnPush()) {
          settingInIos();
        }
      } else {
        var main = plus.android.runtimeMainActivity();
        var manager = plus.android.invoke("com.igexin.sdk.PushManager", "getInstance");
        plus.android.invoke(manager, "turnOnPush", main);
      }
    } catch (e2) {
      formatAppLog("error", "at pages/ucenter/settings/dc-push/push.js:48", "exception in turnOnPush@dc-push!!");
    }
  }
  function trunOffPush() {
    try {
      if ("iOS" == plus.os.name) {
      } else {
        var main = plus.android.runtimeMainActivity();
        var manager = plus.android.invoke("com.igexin.sdk.PushManager", "getInstance");
        plus.android.invoke(manager, "turnOffPush", main);
      }
    } catch (e2) {
      formatAppLog("error", "at pages/ucenter/settings/dc-push/push.js:67", "exception in trunOffPush@dc-push!!");
    }
  }
  function settingInIos() {
    try {
      if ("iOS" == plus.os.name) {
        var app = plus.ios.invoke("UIApplication", "sharedApplication");
        var setting2 = plus.ios.invoke("NSURL", "URLWithString:", "app-settings:");
        plus.ios.invoke(app, "openURL:", setting2);
        plus.ios.deleteObject(setting2);
        plus.ios.deleteObject(app);
      }
    } catch (e2) {
      formatAppLog("error", "at pages/ucenter/settings/dc-push/push.js:84", "exception in settingInIos@dc-push!!");
    }
  }
  function settingInAndroid() {
    if (uni.getSystemInfoSync().platform == "android") {
      var main = plus.android.runtimeMainActivity();
      var Intent = plus.android.importClass("android.content.Intent");
      var Settings = plus.android.importClass("android.provider.Settings");
      var intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
      main.startActivity(intent);
    }
  }
  function setting() {
    if (uni.getSystemInfoSync().platform == "ios") {
      settingInIos();
    }
    if (uni.getSystemInfoSync().platform == "android") {
      settingInAndroid();
    }
  }
  const pushServer = {
    isOn: isTurnedOnPush,
    iosSetting: settingInIos,
    on: turnOnPush,
    off: trunOffPush,
    setting
  };
  const _sfc_main$A = {
    data() {
      return {
        pushServer,
        supportMode: [],
        pushIsOn: "wait",
        currentLanguage: "",
        userInfo: {}
      };
    },
    computed: {
      hasLogin() {
        return store.hasLogin;
      },
      i18nEnable() {
        return getApp().globalData.config.i18n.enable;
      }
    },
    onLoad() {
      this.currentLanguage = uni.getStorageSync("CURRENT_LANG") == "en" ? "English" : "简体中文";
      uni.setNavigationBarTitle({
        title: this.$t("settings.navigationBarTitle")
      });
      uni.checkIsSupportSoterAuthentication({
        success: (res) => {
          this.supportMode = res.supportMode;
        },
        fail: (err) => {
          formatAppLog("log", "at pages/ucenter/settings/settings.vue:65", err);
        }
      });
    },
    onShow() {
      setTimeout(() => {
        this.pushIsOn = pushServer.isOn();
      }, 300);
    },
    methods: {
      async changeLoginState() {
        if (this.hasLogin) {
          await mutations.logout();
        } else {
          uni.redirectTo({
            url: "/uni_modules/uni-id-pages/pages/login/login-withoutpwd"
          });
        }
      },
      /**
       * 开始生物认证
       */
      startSoterAuthentication(checkAuthMode) {
        formatAppLog("log", "at pages/ucenter/settings/settings.vue:92", checkAuthMode);
        let title = { "fingerPrint": this.$t("settings.fingerPrint"), "facial": this.$t("settings.facial") }[checkAuthMode];
        this.checkIsSoterEnrolledInDevice({ checkAuthMode, title }).then(() => {
          formatAppLog("log", "at pages/ucenter/settings/settings.vue:97", checkAuthMode, title);
          uni.startSoterAuthentication({
            requestAuthModes: [checkAuthMode],
            challenge: "123456",
            // 微信端挑战因子
            authContent: this.$t("settings.please") + ` ${title}`,
            complete: (res) => {
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:104", res);
            },
            success: (res) => {
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:107", res);
              if (res.errCode == 0) {
                return uni.showToast({
                  title: `${title}` + this.$t("settings.successText"),
                  icon: "none"
                });
              }
              uni.showToast({
                title: this.$t("settings.failTip"),
                icon: "none"
              });
            },
            fail: (err) => {
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:127", err);
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:128", `认证失败:${err.errCode}`);
              uni.showToast({
                title: this.$t("settings.authFailed"),
                // title: `认证失败`,
                icon: "none"
              });
            }
          });
        });
      },
      checkIsSoterEnrolledInDevice({ checkAuthMode, title }) {
        return new Promise((resolve, reject) => {
          uni.checkIsSoterEnrolledInDevice({
            checkAuthMode,
            success: (res) => {
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:143", res);
              if (res.isEnrolled) {
                return resolve(res);
              }
              uni.showToast({
                title: this.$t("settings.deviceNoOpen") + `${title}`,
                icon: "none"
              });
              reject(res);
            },
            fail: (err) => {
              formatAppLog("log", "at pages/ucenter/settings/settings.vue:154", err);
              uni.showToast({
                title: `${title}` + this.$t("settings.fail"),
                icon: "none"
              });
              reject(err);
            }
          });
        });
      },
      clearTmp() {
        uni.showLoading({
          title: this.$t("settings.clearing"),
          mask: true
        });
        uni.getSavedFileList({
          success: (res) => {
            if (res.fileList.length > 0) {
              uni.removeSavedFile({
                filePath: res.fileList[0].filePath,
                complete: (res2) => {
                  formatAppLog("log", "at pages/ucenter/settings/settings.vue:186", res2);
                  uni.hideLoading();
                  uni.showToast({
                    title: this.$t("settings.clearedSuccessed"),
                    icon: "none"
                  });
                }
              });
            } else {
              uni.hideLoading();
              uni.showToast({
                title: this.$t("settings.clearedSuccessed"),
                icon: "none"
              });
            }
          },
          complete: (e2) => {
            formatAppLog("log", "at pages/ucenter/settings/settings.vue:203", e2);
          }
        });
      },
      changeLanguage() {
        formatAppLog("log", "at pages/ucenter/settings/settings.vue:208", "语言切换");
        uni.showActionSheet({
          itemList: ["English", "简体中文"],
          success: (res) => {
            formatAppLog("log", "at pages/ucenter/settings/settings.vue:212", res.tapIndex);
            let language = uni.getStorageSync("CURRENT_LANG");
            if (!res.tapIndex && language == "zh-Hans" || res.tapIndex && language == "en") {
              const globalData = getApp().globalData;
              if (language === "en") {
                language = globalData.locale = "zh-Hans";
              } else {
                language = globalData.locale = "en";
              }
              uni.setStorageSync("CURRENT_LANG", language);
              getApp().globalData.$i18n.locale = language;
              this.currentLanguage = res.tapIndex ? "简体中文" : "English";
              if (uni.setLocale) {
                uni.setLocale(language);
              }
              uni.reLaunch({
                url: "/pages/list/list",
                complete: () => {
                  uni.$emit("changeLanguage", language);
                }
              });
            }
          },
          fail: () => {
          },
          complete: () => {
          }
        });
      }
    }
  };
  function _sfc_render$z(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$4);
    const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "content" }, [
      vue.createCommentVNode(" 功能列表 "),
      vue.createVNode(_component_uni_list, {
        class: "mt10",
        border: false
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_list_item, {
            title: _ctx.$t("settings.userInfo"),
            to: "/uni_modules/uni-id-pages/pages/userinfo/userinfo",
            link: "navigateTo"
          }, null, 8, ["title"]),
          $data.userInfo.mobile ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 0,
            title: _ctx.$t("settings.changePassword"),
            to: "/pages/ucenter/login-page/pwd-retrieve/pwd-retrieve?phoneNumber=" + $data.userInfo.mobile,
            link: "navigateTo"
          }, null, 8, ["title", "to"])) : vue.createCommentVNode("v-if", true)
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_list, {
        class: "mt10",
        border: false
      }, {
        default: vue.withCtx(() => [
          vue.createCommentVNode(" 检查push过程未结束不显示，push设置项 "),
          vue.createVNode(_component_uni_list_item, {
            title: _ctx.$t("settings.clearTmp"),
            onClick: $options.clearTmp,
            link: ""
          }, null, 8, ["title", "onClick"]),
          vue.withDirectives(vue.createVNode(_component_uni_list_item, {
            title: _ctx.$t("settings.pushServer"),
            onClick: _cache[0] || (_cache[0] = ($event) => $data.pushIsOn ? $data.pushServer.off() : $data.pushServer.on()),
            showSwitch: "",
            switchChecked: $data.pushIsOn
          }, null, 8, ["title", "switchChecked"]), [
            [vue.vShow, $data.pushIsOn != "wait"]
          ]),
          $data.supportMode.includes("fingerPrint") ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 0,
            title: _ctx.$t("settings.fingerPrint"),
            onClick: _cache[1] || (_cache[1] = ($event) => $options.startSoterAuthentication("fingerPrint")),
            link: ""
          }, null, 8, ["title"])) : vue.createCommentVNode("v-if", true),
          $data.supportMode.includes("facial") ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 1,
            title: _ctx.$t("settings.facial"),
            onClick: _cache[2] || (_cache[2] = ($event) => $options.startSoterAuthentication("facial")),
            link: ""
          }, null, 8, ["title"])) : vue.createCommentVNode("v-if", true),
          $options.i18nEnable ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 2,
            title: _ctx.$t("settings.changeLanguage"),
            onClick: $options.changeLanguage,
            rightText: $data.currentLanguage,
            link: ""
          }, null, 8, ["title", "onClick", "rightText"])) : vue.createCommentVNode("v-if", true)
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createCommentVNode(" 退出/登录 按钮 "),
      vue.createElementVNode("view", {
        class: "bottom-back",
        onClick: _cache[3] || (_cache[3] = (...args) => $options.changeLoginState && $options.changeLoginState(...args))
      }, [
        $options.hasLogin ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 0,
            class: "bottom-back-text"
          },
          vue.toDisplayString(_ctx.$t("settings.logOut")),
          1
          /* TEXT */
        )) : (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 1,
            class: "bottom-back-text"
          },
          vue.toDisplayString(_ctx.$t("settings.login")),
          1
          /* TEXT */
        ))
      ])
    ]);
  }
  const PagesUcenterSettingsSettings = /* @__PURE__ */ _export_sfc(_sfc_main$A, [["render", _sfc_render$z], ["__file", "G:/HBuilderProjects/Toby/pages/ucenter/settings/settings.vue"]]);
  const en$2 = {
    "uni-load-more.contentdown": "Pull up to show more",
    "uni-load-more.contentrefresh": "loading...",
    "uni-load-more.contentnomore": "No more data"
  };
  const zhHans$3 = {
    "uni-load-more.contentdown": "上拉显示更多",
    "uni-load-more.contentrefresh": "正在加载...",
    "uni-load-more.contentnomore": "没有更多数据了"
  };
  const zhHant$1 = {
    "uni-load-more.contentdown": "上拉顯示更多",
    "uni-load-more.contentrefresh": "正在加載...",
    "uni-load-more.contentnomore": "沒有更多數據了"
  };
  const messages$3 = {
    en: en$2,
    "zh-Hans": zhHans$3,
    "zh-Hant": zhHant$1
  };
  let platform;
  setTimeout(() => {
    platform = uni.getSystemInfoSync().platform;
  }, 16);
  const {
    t: t$3
  } = initVueI18n(messages$3);
  const _sfc_main$z = {
    name: "UniLoadMore",
    emits: ["clickLoadMore"],
    props: {
      status: {
        // 上拉的状态：more-loading前；loading-loading中；noMore-没有更多了
        type: String,
        default: "more"
      },
      showIcon: {
        type: Boolean,
        default: true
      },
      iconType: {
        type: String,
        default: "auto"
      },
      iconSize: {
        type: Number,
        default: 24
      },
      color: {
        type: String,
        default: "#777777"
      },
      contentText: {
        type: Object,
        default() {
          return {
            contentdown: "",
            contentrefresh: "",
            contentnomore: ""
          };
        }
      },
      showText: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        webviewHide: false,
        platform,
        imgBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzlBMzU3OTlEOUM0MTFFOUI0NTZDNERBQURBQzI4RkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzlBMzU3OUFEOUM0MTFFOUI0NTZDNERBQURBQzI4RkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDOUEzNTc5N0Q5QzQxMUU5QjQ1NkM0REFBREFDMjhGRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDOUEzNTc5OEQ5QzQxMUU5QjQ1NkM0REFBREFDMjhGRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pt+ALSwAAA6CSURBVHja1FsLkFZVHb98LM+F5bHL8khA1iSeiyQBCRM+YGqKUnnJTDLGI0BGZlKDIU2MMglUiDApEZvSsZnQtBRJtKwQNKQMFYeRDR10WOLd8ljYXdh+v8v5fR3Od+797t1dnOnO/Ofce77z+J//+b/P+ZqtXbs2sJ9MJhNUV1cHJ06cCJo3bx7EPc2aNcvpy7pWrVoF+/fvDyoqKoI2bdoE9fX1F7TjN8a+EXBn/fkfvw942Tf+wYMHg9mzZwfjxo0LDhw4EPa1x2MbFw/fOGfPng1qa2tzcCkILsLDydq2bRsunpOTMM7TD/W/tZDZhPdeKD+yGxHhdu3aBV27dg3OnDlzMVANMheLAO3btw8KCwuDmpoaX5OxbgUIMEq7K8IcPnw4KCsrC/r37x8cP378/4cAXAB3vqSkJMuiDhTkw+XcuXNhOWbMmKBly5YhUT8xArhyFvP0BfwRsAuwxJZJsm/nzp2DTp06he/OU+cZ64K6o0ePBkOHDg2GDx8e6gEbJ5Q/NHNuAJQ1hgBeHUDlR7nVTkY8rQAvAi4z34vR/mPs1FoRsaCgIJThI0eOBC1atEiFGGV+5MiRoS45efJkqFjJFXV1dQuA012m2WcwTw98fy6CqBdsaiIO4CScrGPHjvk4odhavPquRtFWXEC25VgkREKOCh/qDSq+vn37htzD/mZTOmOc5U7zKzBPEedygWshcDyWvs30igAbU+6oyMgJBCFhwQE0fccxN60Ay9iebbjoDh06hMowjQxT4fXq1SskArmHZpkArvixp/kWzHdMeArExSJEaiXIjjRjRJ4DaAGWpibLzXN3Fm1vA5teBgh3j1Rv3bp1YgKwPdmf2p9zcyNYYgPKMfY0T5f5nNYdw158nJ8QawW4CLKwiOBSEgO/hok2eBydR+3dYH+PLxA5J8Vv0KBBwenTp0P2JWAx6+yFEBfs8lMY+y0SWMBNI9E4ThKi58VKTg3FQZS1RQF1cz27eC0QHMu+3E0SkUowjhVt5VdaWhp07949ZHv2Qd1EjDXM2cla1M0nl3GxAs3J9yREzyTdFVKVFOaE9qRA8GM0WebRuo9JGZKA7Mv2SeS/Z8+eoQ9BArMfFrLGo6jvxbhHbJZnKX2Rzz1O7QhJJ9Cs2ZMaWIyq/zhdeqPNfIoHd58clIQD+JSXl4dKlyIAuBdVXZwFVWKspSSoxE++h8x4k3uCnEhE4I5KwRiFWGOU0QWKiCYLbdoRMRKAu2kQ9vkfLU6dOhX06NEjlH+yMRZSinnuyWnYosVcji8CEA/6Cg2JF+IIUBqnGKUTCNwtwBN4f89RiK1R96DEgO2o0NDmtEdvVFdVVYV+P3UAPUEs6GFwV3PHmXkD4vh74iDFJysVI/MlaQhwKeBNTLYX5VuA8T4/gZxA4MRGFxDB6R7OmYPfyykGRJbyie+XnGYnQIC/coH9+vULiYrxrkL9ZA9+0ykaHIfEpM7ge8TiJ2CsHYwyMfafAF1yCGBHYIbCVDjDjKt7BeB51D+LgQa6OkG7IDYEEtvQ7lnXLKLtLdLuJBpE4gPUXcW2+PkZwOex+4cGDhwYDBkyRL7/HFcEwUGPo/8uWRUpYnfxGHco8HkewLHLyYmAawAPuIFZxhOpDfJQ8gbUv41yORAptMWBNr6oqMhWird5+u+iHmBb2nhjDV7HWBNQTgK8y11l5NetWzc5ULscAtSj7nbNI0skhWeUZCc0W4nyH/jO4Vz0u1IeYhbk4AiwM6tjxIWByHsoZ9qcIBPJd/y+DwPfBESOmCa/QF3WiZHucLlEDpNxcNhmheEOPgdQNx6/VZFQzFZ5TN08AHXQt2Ii3EdyFuUsPtTcGPhW5iMiCNELvz+Gdn9huG4HUJaW/w3g0wxV0XaG7arG2WeKiUWYM4Y7GO5ezshTARbbWGw/DvXkpp/ivVvE0JVoMxN4rpGzJMhE5Pl+xlATsDIqikP9F9D2z3h9nOksEUFhK+qO4rcPkoalMQ/HqJLIyb3F3JdjrCcw1yZ8joyJLR5gCo54etlag7qIoeNh1N1BRYj3DTFJ0elotxPlVzkGuYAmL0VSJVGAJA41c4Z6A3BzTLfn0HYwYKEI6CUAMzZEWvLsIcQOo1AmmyyM72nHJCfYsogflGV6jEk9vyQZXSuq6w4c16NsGcGZbwOPr+H1RkOk2LEzjNepxQkihHSCQ4ynAYNRx2zMKV92CQMWqj8J0BRE8EShxRFN6YrfCRhC0x3r/Zm4IbQCcmJoV0kMamllccR6FjHqUC5F2R/wS2dcymOlfAKOS4KmzQb5cpNC2MC7JhVn5wjXoJ44rYhLh8n0eXOCorJxa7POjbSlCGVczr34/RsAmrcvo9s+wGp3tzVhntxiXiJ4nvEYb4FJkf0O8HocAePmLvCxnL0AORraVekJk6TYjDabRVXfRE2lCN1h6ZQRN1+InUbsCpKwoBZHh0dODN9JBCUffItXxEavTQkUtnfTVAplCWL3JISz29h4NjotnuSsQKJCk8dF+kJR6RARjrqFVmfPnj3ZbK8cIJ0msd6jgHPGtfVTQ8VLmlvh4mct9sobRmPic0DyDQQnx/NlfYUgyz59+oScsH379pAwXABD32nTpoUHIToESeI5mnbE/UqDdyLcafEBf2MCqgC7NwxIbMREJQ0g4D4sfJwnD+AmRrII05cfMWJE+L1169bQr+fip06dGp4oJ83lmYd5wj/EmMa4TaHivo4EeCguYZBnkB5g2aWA69OIEnUHOaGysjIYMGBAMGnSpODYsWPZwCpFmm4lNq+4gSLQA7jcX8DwtjEyRC8wjabnXEx9kfWnTJkSJkAo90xpJVV+FmcVNeYAF5zWngS4C4O91MBxmAv8blLEpbjI5sz9MTdAhcgkCT1RO8mZkAjfiYpTEvStAS53Uw1vAiUGgZ3GpuQEYvoiBqlIan7kSDHnTwJQFNiPu0+5VxCVYhcZIjNrdXUDdp+Eq5AZ3Gkg8QAyVZRZIk4Tl4QAbF9cXJxNYZMAtAokgs4BrNxEpCtteXg7DDTMDKYNSuQdKsnJBek7HxewvxaosWxLYXtw+cJp18217wql4aKCfBNoEu0O5VU+PhctJ0YeXD4C6JQpyrlpSLTojpGGGN5YwNziChdIZLk4lvLcFJ9jMX3QdiImY9bmGQU+TRUL5CHITTRlgF8D9ouD1MfmLoEPl5xokIumZ2cfgMpHt47IW9N64Hsh7wQYYjyIugWuF5fCqYncXRd5vPMWyizzvhi/32+nvG0dZc9vR6fZOu0md5e+uC408FvKSIOZwXlGvxPv95izA2Vtvg1xKFWARI+vMX66HUhpQQb643uW1bSjuTWyw2SBvDrBvjFic1eGGlz5esq3ko9uSIlBRqPuFcCv8F4WIcN12nVaBd0SaYwI6PDDImR11JkqgHcPmQssjxIn6bUshygDFJUTxPMpHk+jfjPgupgdnYV2R/g7xSjtpah8RJBewhwf0gGK6XI92u4wXFEU40afJ4DN4h5LcAd+40HI3JgJecuT0c062W0i2hQJUTcxan3/CMW1PF2K6bbA+Daz4xRs1D3Br1Cm0OihKCqizW78/nXAF/G5TXrEcVzaNMH6CyMswqsAHqDyDLEyou8lwOXnKF8DjI6KjV3KzMBiXkDH8ij/H214J5A596ekrZ3F0zXlWeL7+P5eUrNo3/QwC15uxthuzidy7DzKRwEDaAViiDgKbTbz7CJnzo0bN7pIfIiid8SuPwn25o3QCmpnyjlZkyxPP8EomCJzrGb7GJMx7tNsq4MT2xMUYaiErZOluTzKsnz3gwCeCZyVRZJfYplNEokEjwrPtxlxjeYAk+F1F74VAzPxQRNYYdtpOUvWs8J1sGhBJMNsb7igN8plJs1eSmLIhLKE4rvaCX27gOhLpLOsIzJ7qn/i+wZzcvSOZ23/du8TZjwV8zHIXoP4R3ifBxiFz1dcVpa3aPntPE+c6TmIWE9EtcMmAcPdWAhYhAXxcLOQi9L1WhD1Sc8p1d2oL7XGiRKp8F4A2i8K/nfI+y/gsTDJ/YC/8+AD5Uh04KHiGl+cIFPnBDDrPMjwRGkLXyxO4VGbfQWnDH2v0bVWE3C9QOXlepbgjEfIJQI6XDG3z5ahD9cw2pS78ipB85wyScNTvsVzlzzhL8/jRrnmVjfFJK/m3m4nj9vbgQTguT8XZTjsm672R5uJKEaQmBI/c58gyus8ZDagLpEVSJBIyHp4jn++xqPV71OgQgJYEWOtZ/haxRtKmWOBu8xdBLftWltsY84zE6WIEy/eIOWL+BaayMx+KHtL7EAkqdNDLiEXmEMUHniedtJqg9HmZtfvt26vNi0BdG3Ft3g8ZOf7PAu59TxtzivLNIekyi+wD1i8CuUiD9FXAa8C+/xS3JPmZnomyc7H+fb4/Se0bk41Fel621r4cgVxbq91V4jVqwB7HTe2M7jgB+QWHavZkDRPmZcASoZEmBx6i75bGjPcMdL4/VKGFAGWZkGzPG0XAbdL9A81G5LOmUnC9hHKJeO7dcUMjblSl12867ElFTtaGl20xvvLGPdVz/8TVuU7y0x1PG7vtNg24oz9Uo/Z412++VFWI7Fcog9tu9Lm6gvRmIPv9x1xmQAu6RDkXtbOtlGEmpgD5Nvnyc0dcv0EE6cfdi1HmhMf9wDF3k3gtRvEedhxjpgfqPb9PU9iEJHnyOUA7bQUXh6kq/D7l2iTjWv7XOD530BDr8jIrus+srXjt4MzumJMHuTsBa63YKE1+RR5lBjEikCCnWKWiHdzOgKO+nRIBAF88za/IFmJ3eMZov4CYxGBabcpGL8EYx+SeMXJeRwHNsV/h+vdxeuhEpN3ZyNY78Gm2fknJxVGhyjixPiQvVkNzT1elD9Py/aTAL64Hb9vcYmC9zfdXdT/C1LeGbg4rnBaAihDFJH12W5ulfNCNe/xTsP3bp8ikzJs5BF+5PNfAQYAPaseTdsEcaYAAAAASUVORK5CYII="
      };
    },
    computed: {
      iconSnowWidth() {
        return (Math.floor(this.iconSize / 24) || 1) * 2;
      },
      contentdownText() {
        return this.contentText.contentdown || t$3("uni-load-more.contentdown");
      },
      contentrefreshText() {
        return this.contentText.contentrefresh || t$3("uni-load-more.contentrefresh");
      },
      contentnomoreText() {
        return this.contentText.contentnomore || t$3("uni-load-more.contentnomore");
      }
    },
    mounted() {
      var pages2 = getCurrentPages();
      var page = pages2[pages2.length - 1];
      var currentWebview2 = page.$getAppWebview();
      currentWebview2.addEventListener("hide", () => {
        this.webviewHide = true;
      });
      currentWebview2.addEventListener("show", () => {
        this.webviewHide = false;
      });
    },
    methods: {
      onClick() {
        this.$emit("clickLoadMore", {
          detail: {
            status: this.status
          }
        });
      }
    }
  };
  function _sfc_render$y(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "uni-load-more",
      onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      !$data.webviewHide && ($props.iconType === "circle" || $props.iconType === "auto" && $data.platform === "android") && $props.status === "loading" && $props.showIcon ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          style: vue.normalizeStyle({ width: $props.iconSize + "px", height: $props.iconSize + "px" }),
          class: "uni-load-more__img uni-load-more__img--android-MP"
        },
        [
          vue.createElementVNode(
            "view",
            {
              class: "uni-load-more__img-icon",
              style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
            },
            null,
            4
            /* STYLE */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "uni-load-more__img-icon",
              style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
            },
            null,
            4
            /* STYLE */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "uni-load-more__img-icon",
              style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
            },
            null,
            4
            /* STYLE */
          )
        ],
        4
        /* STYLE */
      )) : !$data.webviewHide && $props.status === "loading" && $props.showIcon ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 1,
          style: vue.normalizeStyle({ width: $props.iconSize + "px", height: $props.iconSize + "px" }),
          class: "uni-load-more__img uni-load-more__img--ios-H5"
        },
        [
          vue.createElementVNode("image", {
            src: $data.imgBase64,
            mode: "widthFix"
          }, null, 8, ["src"])
        ],
        4
        /* STYLE */
      )) : vue.createCommentVNode("v-if", true),
      $props.showText ? (vue.openBlock(), vue.createElementBlock(
        "text",
        {
          key: 2,
          class: "uni-load-more__text",
          style: vue.normalizeStyle({ color: $props.color })
        },
        vue.toDisplayString($props.status === "more" ? $options.contentdownText : $props.status === "loading" ? $options.contentrefreshText : $options.contentnomoreText),
        5
        /* TEXT, STYLE */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_0$4 = /* @__PURE__ */ _export_sfc(_sfc_main$z, [["render", _sfc_render$y], ["__scopeId", "data-v-9245e42c"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue"]]);
  const noData$1 = "No Data";
  const noNetwork$1 = "Network error";
  const toSet$1 = "Go to settings";
  const error$1 = "error";
  const en$1 = {
    noData: noData$1,
    noNetwork: noNetwork$1,
    toSet: toSet$1,
    error: error$1
  };
  const noData = "暂无数据";
  const noNetwork = "网络异常";
  const toSet = "前往设置";
  const error = "错误";
  const zhHans$2 = {
    noData,
    noNetwork,
    toSet,
    error
  };
  const messages$2 = {
    en: en$1,
    "zh-Hans": zhHans$2
  };
  const _imports_0$2 = "/static/uni-load-state/disconnection.png";
  const {
    t: t$2
  } = initVueI18n(messages$2);
  const _sfc_main$y = {
    name: "uni-load-state",
    computed: {
      noData() {
        return t$2("noData");
      },
      noNetwork() {
        return t$2("noNetwork");
      },
      toSet() {
        return t$2("toSet");
      },
      error() {
        return t$2("error");
      }
    },
    data() {
      return {
        "networkType": ""
      };
    },
    props: {
      state: {
        type: Object,
        default() {
          return {
            "loading": true,
            "hasMore": false,
            "pagination": {
              "pages": 0
            },
            "data": [],
            "error": {}
          };
        }
      }
    },
    mounted() {
      uni.onNetworkStatusChange(({
        networkType
      }) => {
        if (this.networkType == "none" && networkType != "none") {
          this.$emit("networkResume");
        }
        this.networkType = networkType;
      });
      uni.getNetworkType({
        success: ({
          networkType
        }) => {
          this.networkType = networkType;
        }
      });
    },
    methods: {
      appear() {
        if (!this.state.loading && this.state.hasMore) {
          this.$emit("loadMore");
        }
      },
      openSettings() {
        if (uni.getSystemInfoSync().platform == "ios") {
          var UIApplication = plus.ios.import("UIApplication");
          var application2 = UIApplication.sharedApplication();
          var NSURL2 = plus.ios.import("NSURL");
          var setting2 = NSURL2.URLWithString("App-prefs:root=General");
          application2.openURL(setting2);
          plus.ios.deleteObject(setting2);
          plus.ios.deleteObject(NSURL2);
          plus.ios.deleteObject(application2);
        } else {
          var Intent = plus.android.importClass("android.content.Intent");
          var Settings = plus.android.importClass("android.provider.Settings");
          var mainActivity = plus.android.runtimeMainActivity();
          var intent = new Intent(Settings.ACTION_SETTINGS);
          mainActivity.startActivity(intent);
        }
      }
    }
  };
  function _sfc_render$x(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_load_more = resolveEasycom(vue.resolveDynamicComponent("uni-load-more"), __easycom_0$4);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        onAppear: _cache[1] || (_cache[1] = (...args) => $options.appear && $options.appear(...args))
      },
      [
        $props.state.error ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
          $data.networkType == "none" ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "box"
          }, [
            vue.createElementVNode("image", {
              class: "icon-image",
              src: _imports_0$2,
              mode: "widthFix"
            }),
            vue.createElementVNode(
              "text",
              { class: "tip-text" },
              vue.toDisplayString($options.noNetwork),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", {
              class: "btn btn-default",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.openSettings && $options.openSettings(...args))
            }, [
              vue.createElementVNode(
                "text",
                { class: "btn-text" },
                vue.toDisplayString($options.toSet),
                1
                /* TEXT */
              )
            ])
          ])) : (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 1,
              class: "error"
            },
            vue.toDisplayString($options.error) + "：" + vue.toDisplayString(JSON.stringify($props.state.error)),
            1
            /* TEXT */
          ))
        ])) : (vue.openBlock(), vue.createBlock(_component_uni_load_more, {
          key: 1,
          class: "uni-load-more",
          status: $props.state.loading ? "loading" : $props.state.hasMore ? "hasMore" : "noMore"
        }, null, 8, ["status"]))
      ],
      32
      /* HYDRATE_EVENTS */
    );
  }
  const __easycom_3$2 = /* @__PURE__ */ _export_sfc(_sfc_main$y, [["render", _sfc_render$x], ["__scopeId", "data-v-740c4771"], ["__file", "G:/HBuilderProjects/Toby/components/uni-load-state/uni-load-state.vue"]]);
  const _sfc_main$x = {
    data() {
      return {
        isLoading: true,
        loadMore: {
          contentdown: "",
          contentrefresh: "",
          contentnomore: ""
        },
        readNewsLog: [],
        udbWhere: ""
      };
    },
    onLoad() {
      this.readNewsLog = uni.getStorageSync("readNewsLog") || [];
      let readNewsLogIds = this.readNewsLog.map(({ article_id: article_id2 }) => article_id2);
      formatAppLog("log", "at pages/ucenter/read-news-log/read-news-log.vue:40", typeof readNewsLogIds, readNewsLogIds);
      this.udbWhere = `"_id" in ${JSON.stringify(readNewsLogIds)}`;
      uni.setNavigationBarTitle({
        title: this.$t("newsLog.navigationBarTitle")
      });
    },
    onPullDownRefresh() {
      this.refreshData();
    },
    onReachBottom() {
      this.$refs.udb.loadMore();
    },
    methods: {
      refreshData() {
        this.$refs.udb.loadData({
          clear: true
        }, (res) => {
          uni.stopPullDownRefresh();
        });
      },
      handleItemClick(item) {
        uni.navigateTo({
          url: "/pages/list/detail?id=" + item._id + "&title=" + item.title
        });
      }
    }
  };
  function _sfc_render$w(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_dateformat = resolveEasycom(vue.resolveDynamicComponent("uni-dateformat"), __easycom_0$8);
    const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$4);
    const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
    const _component_uni_load_state = resolveEasycom(vue.resolveDynamicComponent("uni-load-state"), __easycom_3$2);
    const _component_unicloud_db = resolveEasycom(vue.resolveDynamicComponent("unicloud-db"), __easycom_4$3);
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createVNode(_component_unicloud_db, {
        ref: "udb",
        where: $data.udbWhere,
        collection: "opendb-news-articles",
        onLoad: _cache[0] || (_cache[0] = ($event) => $data.isLoading == false),
        onError: _cache[1] || (_cache[1] = ($event) => $data.isLoading == false),
        field: "title,_id",
        "page-size": 10
      }, {
        default: vue.withCtx(({ data: data2, pagination, loading, hasMore, error: error2 }) => [
          vue.createVNode(
            _component_uni_list,
            null,
            {
              default: vue.withCtx(() => [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(data2, (item, index) => {
                    return vue.openBlock(), vue.createBlock(_component_uni_list_item, {
                      key: index,
                      clickable: true,
                      onClick: ($event) => $options.handleItemClick(item)
                    }, {
                      body: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "item" }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(item.title),
                            1
                            /* TEXT */
                          ),
                          vue.createVNode(_component_uni_dateformat, {
                            class: "article-date",
                            date: $data.readNewsLog[index].last_time,
                            format: "yyyy-MM-dd hh:mm",
                            threshold: [0, 0]
                          }, null, 8, ["date"])
                        ])
                      ]),
                      _: 2
                      /* DYNAMIC */
                    }, 1032, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              _: 2
              /* DYNAMIC */
            },
            1024
            /* DYNAMIC_SLOTS */
          ),
          vue.createVNode(_component_uni_load_state, {
            onNetworkResume: $options.refreshData,
            state: { data: data2, pagination, hasMore, loading, error: error2 }
          }, null, 8, ["onNetworkResume", "state"])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["where"])
    ]);
  }
  const PagesUcenterReadNewsLogReadNewsLog = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["render", _sfc_render$w], ["__file", "G:/HBuilderProjects/Toby/pages/ucenter/read-news-log/read-news-log.vue"]]);
  function o(o2) {
    this.mode = r.MODE_8BIT_BYTE, this.data = o2;
  }
  function e(o2, e2) {
    this.typeNumber = o2, this.errorCorrectLevel = e2, this.modules = null, this.moduleCount = 0, this.dataCache = null, this.dataList = new Array();
  }
  o.prototype = { getLength: function(o2) {
    return this.data.length;
  }, write: function(o2) {
    for (var e2 = 0; e2 < this.data.length; e2++)
      o2.put(this.data.charCodeAt(e2), 8);
  } }, e.prototype = { addData: function(e2) {
    var r2 = new o(e2);
    this.dataList.push(r2), this.dataCache = null;
  }, isDark: function(o2, e2) {
    if (o2 < 0 || this.moduleCount <= o2 || e2 < 0 || this.moduleCount <= e2)
      throw new Error(o2 + "," + e2);
    return this.modules[o2][e2];
  }, getModuleCount: function() {
    return this.moduleCount;
  }, make: function() {
    if (this.typeNumber < 1) {
      var o2 = 1;
      for (o2 = 1; o2 < 40; o2++) {
        for (var e2 = v.getRSBlocks(o2, this.errorCorrectLevel), r2 = new p(), t2 = 0, i2 = 0; i2 < e2.length; i2++)
          t2 += e2[i2].dataCount;
        for (i2 = 0; i2 < this.dataList.length; i2++) {
          var n2 = this.dataList[i2];
          r2.put(n2.mode, 4), r2.put(n2.getLength(), h.getLengthInBits(n2.mode, o2)), n2.write(r2);
        }
        if (r2.getLengthInBits() <= 8 * t2)
          break;
      }
      this.typeNumber = o2;
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }, makeImpl: function(o2, r2) {
    this.moduleCount = 4 * this.typeNumber + 17, this.modules = new Array(this.moduleCount);
    for (var t2 = 0; t2 < this.moduleCount; t2++) {
      this.modules[t2] = new Array(this.moduleCount);
      for (var i2 = 0; i2 < this.moduleCount; i2++)
        this.modules[t2][i2] = null;
    }
    this.setupPositionProbePattern(0, 0), this.setupPositionProbePattern(this.moduleCount - 7, 0), this.setupPositionProbePattern(0, this.moduleCount - 7), this.setupPositionAdjustPattern(), this.setupTimingPattern(), this.setupTypeInfo(o2, r2), this.typeNumber >= 7 && this.setupTypeNumber(o2), null == this.dataCache && (this.dataCache = e.createData(this.typeNumber, this.errorCorrectLevel, this.dataList)), this.mapData(this.dataCache, r2);
  }, setupPositionProbePattern: function(o2, e2) {
    for (var r2 = -1; r2 <= 7; r2++)
      if (!(o2 + r2 <= -1 || this.moduleCount <= o2 + r2))
        for (var t2 = -1; t2 <= 7; t2++)
          e2 + t2 <= -1 || this.moduleCount <= e2 + t2 || (this.modules[o2 + r2][e2 + t2] = 0 <= r2 && r2 <= 6 && (0 == t2 || 6 == t2) || 0 <= t2 && t2 <= 6 && (0 == r2 || 6 == r2) || 2 <= r2 && r2 <= 4 && 2 <= t2 && t2 <= 4);
  }, getBestMaskPattern: function() {
    for (var o2 = 0, e2 = 0, r2 = 0; r2 < 8; r2++) {
      this.makeImpl(true, r2);
      var t2 = h.getLostPoint(this);
      (0 == r2 || o2 > t2) && (o2 = t2, e2 = r2);
    }
    return e2;
  }, createMovieClip: function(o2, e2, r2) {
    var t2 = o2.createEmptyMovieClip(e2, r2);
    this.make();
    for (var i2 = 0; i2 < this.modules.length; i2++)
      for (var n2 = 1 * i2, a2 = 0; a2 < this.modules[i2].length; a2++) {
        var d2 = 1 * a2;
        this.modules[i2][a2] && (t2.beginFill(0, 100), t2.moveTo(d2, n2), t2.lineTo(d2 + 1, n2), t2.lineTo(d2 + 1, n2 + 1), t2.lineTo(d2, n2 + 1), t2.endFill());
      }
    return t2;
  }, setupTimingPattern: function() {
    for (var o2 = 8; o2 < this.moduleCount - 8; o2++)
      null == this.modules[o2][6] && (this.modules[o2][6] = o2 % 2 == 0);
    for (var e2 = 8; e2 < this.moduleCount - 8; e2++)
      null == this.modules[6][e2] && (this.modules[6][e2] = e2 % 2 == 0);
  }, setupPositionAdjustPattern: function() {
    for (var o2 = h.getPatternPosition(this.typeNumber), e2 = 0; e2 < o2.length; e2++)
      for (var r2 = 0; r2 < o2.length; r2++) {
        var t2 = o2[e2], i2 = o2[r2];
        if (null == this.modules[t2][i2])
          for (var n2 = -2; n2 <= 2; n2++)
            for (var a2 = -2; a2 <= 2; a2++)
              this.modules[t2 + n2][i2 + a2] = -2 == n2 || 2 == n2 || -2 == a2 || 2 == a2 || 0 == n2 && 0 == a2;
      }
  }, setupTypeNumber: function(o2) {
    for (var e2 = h.getBCHTypeNumber(this.typeNumber), r2 = 0; r2 < 18; r2++) {
      var t2 = !o2 && 1 == (e2 >> r2 & 1);
      this.modules[Math.floor(r2 / 3)][r2 % 3 + this.moduleCount - 8 - 3] = t2;
    }
    for (r2 = 0; r2 < 18; r2++) {
      t2 = !o2 && 1 == (e2 >> r2 & 1);
      this.modules[r2 % 3 + this.moduleCount - 8 - 3][Math.floor(r2 / 3)] = t2;
    }
  }, setupTypeInfo: function(o2, e2) {
    for (var r2 = this.errorCorrectLevel << 3 | e2, t2 = h.getBCHTypeInfo(r2), i2 = 0; i2 < 15; i2++) {
      var n2 = !o2 && 1 == (t2 >> i2 & 1);
      i2 < 6 ? this.modules[i2][8] = n2 : i2 < 8 ? this.modules[i2 + 1][8] = n2 : this.modules[this.moduleCount - 15 + i2][8] = n2;
    }
    for (i2 = 0; i2 < 15; i2++) {
      n2 = !o2 && 1 == (t2 >> i2 & 1);
      i2 < 8 ? this.modules[8][this.moduleCount - i2 - 1] = n2 : i2 < 9 ? this.modules[8][15 - i2 - 1 + 1] = n2 : this.modules[8][15 - i2 - 1] = n2;
    }
    this.modules[this.moduleCount - 8][8] = !o2;
  }, mapData: function(o2, e2) {
    for (var r2 = -1, t2 = this.moduleCount - 1, i2 = 7, n2 = 0, a2 = this.moduleCount - 1; a2 > 0; a2 -= 2)
      for (6 == a2 && a2--; ; ) {
        for (var d2 = 0; d2 < 2; d2++)
          if (null == this.modules[t2][a2 - d2]) {
            var u2 = false;
            n2 < o2.length && (u2 = 1 == (o2[n2] >>> i2 & 1)), h.getMask(e2, t2, a2 - d2) && (u2 = !u2), this.modules[t2][a2 - d2] = u2, -1 == --i2 && (n2++, i2 = 7);
          }
        if ((t2 += r2) < 0 || this.moduleCount <= t2) {
          t2 -= r2, r2 = -r2;
          break;
        }
      }
  } }, e.PAD0 = 236, e.PAD1 = 17, e.createData = function(o2, r2, t2) {
    for (var i2 = v.getRSBlocks(o2, r2), n2 = new p(), a2 = 0; a2 < t2.length; a2++) {
      var d2 = t2[a2];
      n2.put(d2.mode, 4), n2.put(d2.getLength(), h.getLengthInBits(d2.mode, o2)), d2.write(n2);
    }
    var u2 = 0;
    for (a2 = 0; a2 < i2.length; a2++)
      u2 += i2[a2].dataCount;
    if (n2.getLengthInBits() > 8 * u2)
      throw new Error("code length overflow. (" + n2.getLengthInBits() + ">" + 8 * u2 + ")");
    for (n2.getLengthInBits() + 4 <= 8 * u2 && n2.put(0, 4); n2.getLengthInBits() % 8 != 0; )
      n2.putBit(false);
    for (; !(n2.getLengthInBits() >= 8 * u2 || (n2.put(e.PAD0, 8), n2.getLengthInBits() >= 8 * u2)); )
      n2.put(e.PAD1, 8);
    return e.createBytes(n2, i2);
  }, e.createBytes = function(o2, e2) {
    for (var r2 = 0, t2 = 0, i2 = 0, n2 = new Array(e2.length), a2 = new Array(e2.length), d2 = 0; d2 < e2.length; d2++) {
      var u2 = e2[d2].dataCount, s2 = e2[d2].totalCount - u2;
      t2 = Math.max(t2, u2), i2 = Math.max(i2, s2), n2[d2] = new Array(u2);
      for (var g2 = 0; g2 < n2[d2].length; g2++)
        n2[d2][g2] = 255 & o2.buffer[g2 + r2];
      r2 += u2;
      var l2 = h.getErrorCorrectPolynomial(s2), c2 = new f(n2[d2], l2.getLength() - 1).mod(l2);
      a2[d2] = new Array(l2.getLength() - 1);
      for (g2 = 0; g2 < a2[d2].length; g2++) {
        var m2 = g2 + c2.getLength() - a2[d2].length;
        a2[d2][g2] = m2 >= 0 ? c2.get(m2) : 0;
      }
    }
    var v2 = 0;
    for (g2 = 0; g2 < e2.length; g2++)
      v2 += e2[g2].totalCount;
    var p2 = new Array(v2), C2 = 0;
    for (g2 = 0; g2 < t2; g2++)
      for (d2 = 0; d2 < e2.length; d2++)
        g2 < n2[d2].length && (p2[C2++] = n2[d2][g2]);
    for (g2 = 0; g2 < i2; g2++)
      for (d2 = 0; d2 < e2.length; d2++)
        g2 < a2[d2].length && (p2[C2++] = a2[d2][g2]);
    return p2;
  };
  for (var r = { MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4, MODE_KANJI: 8 }, t$1 = { L: 1, M: 0, Q: 3, H: 2 }, i = 0, n = 1, a = 2, d = 3, u = 4, s = 5, g = 6, l = 7, h = { PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]], G15: 1335, G18: 7973, G15_MASK: 21522, getBCHTypeInfo: function(o2) {
    for (var e2 = o2 << 10; h.getBCHDigit(e2) - h.getBCHDigit(h.G15) >= 0; )
      e2 ^= h.G15 << h.getBCHDigit(e2) - h.getBCHDigit(h.G15);
    return (o2 << 10 | e2) ^ h.G15_MASK;
  }, getBCHTypeNumber: function(o2) {
    for (var e2 = o2 << 12; h.getBCHDigit(e2) - h.getBCHDigit(h.G18) >= 0; )
      e2 ^= h.G18 << h.getBCHDigit(e2) - h.getBCHDigit(h.G18);
    return o2 << 12 | e2;
  }, getBCHDigit: function(o2) {
    for (var e2 = 0; 0 != o2; )
      e2++, o2 >>>= 1;
    return e2;
  }, getPatternPosition: function(o2) {
    return h.PATTERN_POSITION_TABLE[o2 - 1];
  }, getMask: function(o2, e2, r2) {
    switch (o2) {
      case i:
        return (e2 + r2) % 2 == 0;
      case n:
        return e2 % 2 == 0;
      case a:
        return r2 % 3 == 0;
      case d:
        return (e2 + r2) % 3 == 0;
      case u:
        return (Math.floor(e2 / 2) + Math.floor(r2 / 3)) % 2 == 0;
      case s:
        return e2 * r2 % 2 + e2 * r2 % 3 == 0;
      case g:
        return (e2 * r2 % 2 + e2 * r2 % 3) % 2 == 0;
      case l:
        return (e2 * r2 % 3 + (e2 + r2) % 2) % 2 == 0;
      default:
        throw new Error("bad maskPattern:" + o2);
    }
  }, getErrorCorrectPolynomial: function(o2) {
    for (var e2 = new f([1], 0), r2 = 0; r2 < o2; r2++)
      e2 = e2.multiply(new f([1, c.gexp(r2)], 0));
    return e2;
  }, getLengthInBits: function(o2, e2) {
    if (1 <= e2 && e2 < 10)
      switch (o2) {
        case r.MODE_NUMBER:
          return 10;
        case r.MODE_ALPHA_NUM:
          return 9;
        case r.MODE_8BIT_BYTE:
        case r.MODE_KANJI:
          return 8;
        default:
          throw new Error("mode:" + o2);
      }
    else if (e2 < 27)
      switch (o2) {
        case r.MODE_NUMBER:
          return 12;
        case r.MODE_ALPHA_NUM:
          return 11;
        case r.MODE_8BIT_BYTE:
          return 16;
        case r.MODE_KANJI:
          return 10;
        default:
          throw new Error("mode:" + o2);
      }
    else {
      if (!(e2 < 41))
        throw new Error("type:" + e2);
      switch (o2) {
        case r.MODE_NUMBER:
          return 14;
        case r.MODE_ALPHA_NUM:
          return 13;
        case r.MODE_8BIT_BYTE:
          return 16;
        case r.MODE_KANJI:
          return 12;
        default:
          throw new Error("mode:" + o2);
      }
    }
  }, getLostPoint: function(o2) {
    for (var e2 = o2.getModuleCount(), r2 = 0, t2 = 0; t2 < e2; t2++)
      for (var i2 = 0; i2 < e2; i2++) {
        for (var n2 = 0, a2 = o2.isDark(t2, i2), d2 = -1; d2 <= 1; d2++)
          if (!(t2 + d2 < 0 || e2 <= t2 + d2))
            for (var u2 = -1; u2 <= 1; u2++)
              i2 + u2 < 0 || e2 <= i2 + u2 || 0 == d2 && 0 == u2 || a2 == o2.isDark(t2 + d2, i2 + u2) && n2++;
        n2 > 5 && (r2 += 3 + n2 - 5);
      }
    for (t2 = 0; t2 < e2 - 1; t2++)
      for (i2 = 0; i2 < e2 - 1; i2++) {
        var s2 = 0;
        o2.isDark(t2, i2) && s2++, o2.isDark(t2 + 1, i2) && s2++, o2.isDark(t2, i2 + 1) && s2++, o2.isDark(t2 + 1, i2 + 1) && s2++, 0 != s2 && 4 != s2 || (r2 += 3);
      }
    for (t2 = 0; t2 < e2; t2++)
      for (i2 = 0; i2 < e2 - 6; i2++)
        o2.isDark(t2, i2) && !o2.isDark(t2, i2 + 1) && o2.isDark(t2, i2 + 2) && o2.isDark(t2, i2 + 3) && o2.isDark(t2, i2 + 4) && !o2.isDark(t2, i2 + 5) && o2.isDark(t2, i2 + 6) && (r2 += 40);
    for (i2 = 0; i2 < e2; i2++)
      for (t2 = 0; t2 < e2 - 6; t2++)
        o2.isDark(t2, i2) && !o2.isDark(t2 + 1, i2) && o2.isDark(t2 + 2, i2) && o2.isDark(t2 + 3, i2) && o2.isDark(t2 + 4, i2) && !o2.isDark(t2 + 5, i2) && o2.isDark(t2 + 6, i2) && (r2 += 40);
    var g2 = 0;
    for (i2 = 0; i2 < e2; i2++)
      for (t2 = 0; t2 < e2; t2++)
        o2.isDark(t2, i2) && g2++;
    return r2 += 10 * (Math.abs(100 * g2 / e2 / e2 - 50) / 5);
  } }, c = { glog: function(o2) {
    if (o2 < 1)
      throw new Error("glog(" + o2 + ")");
    return c.LOG_TABLE[o2];
  }, gexp: function(o2) {
    for (; o2 < 0; )
      o2 += 255;
    for (; o2 >= 256; )
      o2 -= 255;
    return c.EXP_TABLE[o2];
  }, EXP_TABLE: new Array(256), LOG_TABLE: new Array(256) }, m = 0; m < 8; m++)
    c.EXP_TABLE[m] = 1 << m;
  for (m = 8; m < 256; m++)
    c.EXP_TABLE[m] = c.EXP_TABLE[m - 4] ^ c.EXP_TABLE[m - 5] ^ c.EXP_TABLE[m - 6] ^ c.EXP_TABLE[m - 8];
  for (m = 0; m < 255; m++)
    c.LOG_TABLE[c.EXP_TABLE[m]] = m;
  function f(o2, e2) {
    if (null == o2.length)
      throw new Error(o2.length + "/" + e2);
    for (var r2 = 0; r2 < o2.length && 0 == o2[r2]; )
      r2++;
    this.num = new Array(o2.length - r2 + e2);
    for (var t2 = 0; t2 < o2.length - r2; t2++)
      this.num[t2] = o2[t2 + r2];
  }
  function v(o2, e2) {
    this.totalCount = o2, this.dataCount = e2;
  }
  function p() {
    this.buffer = new Array(), this.length = 0;
  }
  function C(o2) {
    return o2.setFillStyle = o2.setFillStyle || function(e2) {
      o2.fillStyle = e2;
    }, o2.setFontSize = o2.setFontSize || function(e2) {
      o2.font = `${e2}px`;
    }, o2.setTextAlign = o2.setTextAlign || function(e2) {
      o2.textAlign = e2;
    }, o2.setTextBaseline = o2.setTextBaseline || function(e2) {
      o2.textBaseline = e2;
    }, o2.setGlobalAlpha = o2.setGlobalAlpha || function(e2) {
      o2.globalAlpha = e2;
    }, o2.setStrokeStyle = o2.setStrokeStyle || function(e2) {
      o2.strokeStyle = e2;
    }, o2.setShadow = o2.setShadow || function(e2, r2, t2, i2) {
      o2.shadowOffsetX = e2, o2.shadowOffsetY = r2, o2.shadowBlur = t2, o2.shadowColor = i2;
    }, o2.draw = o2.draw || function(o3, e2) {
      e2 && e2();
    }, o2.clearRect = o2.clearRect || function(e2, r2, t2, i2) {
      o2.draw(false);
    }, o2;
  }
  function b(o2, e2) {
    var r2 = this.data = "", t2 = this.size = 200;
    this.useDynamicSize = false, this.dynamicSize = t2;
    var i2 = this.typeNumber = -1;
    this.errorCorrectLevel = b.errorCorrectLevel.H;
    var n2 = this.margin = 0;
    this.areaColor = "#FFFFFF", this.backgroundColor = "rgba(255,255,255,0)", this.backgroundImageSrc = void 0;
    var a2 = this.backgroundImageWidth = void 0, d2 = this.backgroundImageHeight = void 0, u2 = this.backgroundImageX = void 0, s2 = this.backgroundImageY = void 0;
    this.backgroundImageAlpha = 1, this.backgroundImageBorderRadius = 0;
    var g2 = this.backgroundPadding = 0;
    this.foregroundColor = "#000000", this.foregroundImageSrc = void 0;
    var l2 = this.foregroundImageWidth = void 0, h2 = this.foregroundImageHeight = void 0, c2 = this.foregroundImageX = void 0, m2 = this.foregroundImageY = void 0, f2 = this.foregroundImagePadding = 0;
    this.foregroundImageBackgroundColor = "#FFFFFF";
    var v2 = this.foregroundImageBorderRadius = 0, p2 = this.foregroundImageShadowOffsetX = 0, k2 = this.foregroundImageShadowOffsetY = 0, y2 = this.foregroundImageShadowBlur = 0;
    this.foregroundImageShadowColor = "#808080";
    var w2 = this.foregroundPadding = 0, I2 = this.positionProbeBackgroundColor = void 0, B2 = this.positionProbeForegroundColor = void 0, S2 = this.separatorColor = void 0, P2 = this.positionAdjustBackgroundColor = void 0, L2 = this.positionAdjustForegroundColor = void 0, D2 = this.timingBackgroundColor = void 0, A2 = this.timingForegroundColor = void 0, E2 = this.typeNumberBackgroundColor = void 0, T2 = this.typeNumberForegroundColor = void 0, N2 = this.darkBlockColor = void 0;
    this.base = void 0, this.modules = [], this.moduleCount = 0, this.drawModules = [];
    var M2 = this.canvasContext = void 0;
    this.loadImage, this.drawReserve = false, this.isMaked = false, Object.defineProperties(this, { data: { get() {
      if ("" === r2 || void 0 === r2)
        throw formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", "[uQRCode]: data must be set!"), new b.Error("data must be set!");
      return r2;
    }, set(o3) {
      r2 = String(o3);
    } }, size: { get: () => t2, set(o3) {
      t2 = Number(o3);
    } }, typeNumber: { get: () => i2, set(o3) {
      i2 = Number(o3);
    } }, margin: { get: () => n2, set(o3) {
      n2 = Number(o3);
    } }, backgroundImageWidth: { get() {
      return void 0 === a2 ? this.dynamicSize : this.useDynamicSize ? this.dynamicSize / this.size * a2 : a2;
    }, set(o3) {
      a2 = Number(o3);
    } }, backgroundImageHeight: { get() {
      return void 0 === d2 ? this.dynamicSize : this.useDynamicSize ? this.dynamicSize / this.size * d2 : d2;
    }, set(o3) {
      d2 = Number(o3);
    } }, backgroundImageX: { get() {
      return void 0 === u2 ? 0 : this.useDynamicSize ? this.dynamicSize / this.size * u2 : u2;
    }, set(o3) {
      u2 = Number(o3);
    } }, backgroundImageY: { get() {
      return void 0 === s2 ? 0 : this.useDynamicSize ? this.dynamicSize / this.size * s2 : s2;
    }, set(o3) {
      s2 = Number(o3);
    } }, backgroundPadding: { get: () => g2, set(o3) {
      g2 = o3 > 1 ? 1 : o3 < 0 ? 0 : o3;
    } }, foregroundImageWidth: { get() {
      return void 0 === l2 ? (this.dynamicSize - 2 * this.margin) / 4 : this.useDynamicSize ? this.dynamicSize / this.size * l2 : l2;
    }, set(o3) {
      l2 = Number(o3);
    } }, foregroundImageHeight: { get() {
      return void 0 === h2 ? (this.dynamicSize - 2 * this.margin) / 4 : this.useDynamicSize ? this.dynamicSize / this.size * h2 : h2;
    }, set(o3) {
      h2 = Number(o3);
    } }, foregroundImageX: { get() {
      return void 0 === c2 ? this.dynamicSize / 2 - this.foregroundImageWidth / 2 : this.useDynamicSize ? this.dynamicSize / this.size * c2 : c2;
    }, set(o3) {
      c2 = Number(o3);
    } }, foregroundImageY: { get() {
      return void 0 === m2 ? this.dynamicSize / 2 - this.foregroundImageHeight / 2 : this.useDynamicSize ? this.dynamicSize / this.size * m2 : m2;
    }, set(o3) {
      m2 = Number(o3);
    } }, foregroundImagePadding: { get() {
      return this.useDynamicSize ? this.dynamicSize / this.size * f2 : f2;
    }, set(o3) {
      f2 = Number(o3);
    } }, foregroundImageBorderRadius: { get() {
      return this.useDynamicSize ? this.dynamicSize / this.size * v2 : v2;
    }, set(o3) {
      v2 = Number(o3);
    } }, foregroundImageShadowOffsetX: { get() {
      return this.useDynamicSize ? this.dynamicSize / this.size * p2 : p2;
    }, set(o3) {
      p2 = Number(o3);
    } }, foregroundImageShadowOffsetY: { get() {
      return this.useDynamicSize ? this.dynamicSize / this.size * k2 : k2;
    }, set(o3) {
      k2 = Number(o3);
    } }, foregroundImageShadowBlur: { get() {
      return this.useDynamicSize ? this.dynamicSize / this.size * y2 : y2;
    }, set(o3) {
      y2 = Number(o3);
    } }, foregroundPadding: { get: () => w2, set(o3) {
      w2 = o3 > 1 ? 1 : o3 < 0 ? 0 : o3;
    } }, positionProbeBackgroundColor: { get() {
      return I2 || this.backgroundColor;
    }, set(o3) {
      I2 = o3;
    } }, positionProbeForegroundColor: { get() {
      return B2 || this.foregroundColor;
    }, set(o3) {
      B2 = o3;
    } }, separatorColor: { get() {
      return S2 || this.backgroundColor;
    }, set(o3) {
      S2 = o3;
    } }, positionAdjustBackgroundColor: { get() {
      return P2 || this.backgroundColor;
    }, set(o3) {
      P2 = o3;
    } }, positionAdjustForegroundColor: { get() {
      return L2 || this.foregroundColor;
    }, set(o3) {
      L2 = o3;
    } }, timingBackgroundColor: { get() {
      return D2 || this.backgroundColor;
    }, set(o3) {
      D2 = o3;
    } }, timingForegroundColor: { get() {
      return A2 || this.foregroundColor;
    }, set(o3) {
      A2 = o3;
    } }, typeNumberBackgroundColor: { get() {
      return E2 || this.backgroundColor;
    }, set(o3) {
      E2 = o3;
    } }, typeNumberForegroundColor: { get() {
      return T2 || this.foregroundColor;
    }, set(o3) {
      T2 = o3;
    } }, darkBlockColor: { get() {
      return N2 || this.foregroundColor;
    }, set(o3) {
      N2 = o3;
    } }, canvasContext: { get() {
      if (void 0 === M2)
        throw formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", "[uQRCode]: use drawCanvas, you need to set the canvasContext!"), new b.Error("use drawCanvas, you need to set the canvasContext!");
      return M2;
    }, set(o3) {
      M2 = C(o3);
    } } }), b.plugins.forEach((o3) => o3(b, this, false)), o2 && this.setOptions(o2), e2 && (this.canvasContext = C(e2));
  }
  f.prototype = { get: function(o2) {
    return this.num[o2];
  }, getLength: function() {
    return this.num.length;
  }, multiply: function(o2) {
    for (var e2 = new Array(this.getLength() + o2.getLength() - 1), r2 = 0; r2 < this.getLength(); r2++)
      for (var t2 = 0; t2 < o2.getLength(); t2++)
        e2[r2 + t2] ^= c.gexp(c.glog(this.get(r2)) + c.glog(o2.get(t2)));
    return new f(e2, 0);
  }, mod: function(o2) {
    if (this.getLength() - o2.getLength() < 0)
      return this;
    for (var e2 = c.glog(this.get(0)) - c.glog(o2.get(0)), r2 = new Array(this.getLength()), t2 = 0; t2 < this.getLength(); t2++)
      r2[t2] = this.get(t2);
    for (t2 = 0; t2 < o2.getLength(); t2++)
      r2[t2] ^= c.gexp(c.glog(o2.get(t2)) + e2);
    return new f(r2, 0).mod(o2);
  } }, v.RS_BLOCK_TABLE = [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]], v.getRSBlocks = function(o2, e2) {
    var r2 = v.getRsBlockTable(o2, e2);
    if (null == r2)
      throw new Error("bad rs block @ typeNumber:" + o2 + "/errorCorrectLevel:" + e2);
    for (var t2 = r2.length / 3, i2 = new Array(), n2 = 0; n2 < t2; n2++)
      for (var a2 = r2[3 * n2 + 0], d2 = r2[3 * n2 + 1], u2 = r2[3 * n2 + 2], s2 = 0; s2 < a2; s2++)
        i2.push(new v(d2, u2));
    return i2;
  }, v.getRsBlockTable = function(o2, e2) {
    switch (e2) {
      case t$1.L:
        return v.RS_BLOCK_TABLE[4 * (o2 - 1) + 0];
      case t$1.M:
        return v.RS_BLOCK_TABLE[4 * (o2 - 1) + 1];
      case t$1.Q:
        return v.RS_BLOCK_TABLE[4 * (o2 - 1) + 2];
      case t$1.H:
        return v.RS_BLOCK_TABLE[4 * (o2 - 1) + 3];
      default:
        return;
    }
  }, p.prototype = { get: function(o2) {
    var e2 = Math.floor(o2 / 8);
    return 1 == (this.buffer[e2] >>> 7 - o2 % 8 & 1);
  }, put: function(o2, e2) {
    for (var r2 = 0; r2 < e2; r2++)
      this.putBit(1 == (o2 >>> e2 - r2 - 1 & 1));
  }, getLengthInBits: function() {
    return this.length;
  }, putBit: function(o2) {
    var e2 = Math.floor(this.length / 8);
    this.buffer.length <= e2 && this.buffer.push(0), o2 && (this.buffer[e2] |= 128 >>> this.length % 8), this.length++;
  } }, e.errorCorrectLevel = t$1, b.errorCorrectLevel = e.errorCorrectLevel, b.Error = function(o2) {
    this.errMsg = "[uQRCode]: " + o2;
  }, b.plugins = [], b.use = function(o2) {
    "function" == typeof o2 && b.plugins.push(o2);
  }, b.prototype.loadImage = function(o2) {
    return Promise.resolve(o2);
  }, b.prototype.setOptions = function(o2) {
    var e2, r2, t2, i2, n2, a2, d2, u2, s2, g2, l2, h2, c2, m2, f2, v2, p2, C2, b2, k2, y2, w2, I2, B2, S2, P2, L2, D2, A2, E2, T2, N2, M2, z2, R2, _2, O, F2, x2, H2, X2, Y2, j2, W2, G2, K2, Q2, U2, $2, J2, q2, V2, Z2, oo, eo, ro;
    o2 && (Object.keys(o2).forEach((e3) => {
      this[e3] = o2[e3];
    }), function(o3 = {}, e3 = {}, r3 = false) {
      let t3;
      t3 = r3 ? o3 : { ...o3 };
      for (let o4 in e3) {
        var i3 = e3[o4];
        null != i3 && (i3.constructor == Object ? t3[o4] = this.deepReplace(t3[o4], i3) : i3.constructor != String || i3 ? t3[o4] = i3 : t3[o4] = t3[o4]);
      }
    }(this, { data: o2.data || o2.text, size: o2.size, useDynamicSize: o2.useDynamicSize, typeNumber: o2.typeNumber, errorCorrectLevel: o2.errorCorrectLevel, margin: o2.margin, areaColor: o2.areaColor, backgroundColor: o2.backgroundColor || (null === (e2 = o2.background) || void 0 === e2 ? void 0 : e2.color), backgroundImageSrc: o2.backgroundImageSrc || (null === (r2 = o2.background) || void 0 === r2 || null === (t2 = r2.image) || void 0 === t2 ? void 0 : t2.src), backgroundImageWidth: o2.backgroundImageWidth || (null === (i2 = o2.background) || void 0 === i2 || null === (n2 = i2.image) || void 0 === n2 ? void 0 : n2.width), backgroundImageHeight: o2.backgroundImageHeight || (null === (a2 = o2.background) || void 0 === a2 || null === (d2 = a2.image) || void 0 === d2 ? void 0 : d2.height), backgroundImageX: o2.backgroundImageX || (null === (u2 = o2.background) || void 0 === u2 || null === (s2 = u2.image) || void 0 === s2 ? void 0 : s2.x), backgroundImageY: o2.backgroundImageY || (null === (g2 = o2.background) || void 0 === g2 || null === (l2 = g2.image) || void 0 === l2 ? void 0 : l2.y), backgroundImageAlpha: o2.backgroundImageAlpha || (null === (h2 = o2.background) || void 0 === h2 || null === (c2 = h2.image) || void 0 === c2 ? void 0 : c2.alpha), backgroundImageBorderRadius: o2.backgroundImageBorderRadius || (null === (m2 = o2.background) || void 0 === m2 || null === (f2 = m2.image) || void 0 === f2 ? void 0 : f2.borderRadius), backgroundPadding: o2.backgroundPadding, foregroundColor: o2.foregroundColor || (null === (v2 = o2.foreground) || void 0 === v2 ? void 0 : v2.color), foregroundImageSrc: o2.foregroundImageSrc || (null === (p2 = o2.foreground) || void 0 === p2 || null === (C2 = p2.image) || void 0 === C2 ? void 0 : C2.src), foregroundImageWidth: o2.foregroundImageWidth || (null === (b2 = o2.foreground) || void 0 === b2 || null === (k2 = b2.image) || void 0 === k2 ? void 0 : k2.width), foregroundImageHeight: o2.foregroundImageHeight || (null === (y2 = o2.foreground) || void 0 === y2 || null === (w2 = y2.image) || void 0 === w2 ? void 0 : w2.height), foregroundImageX: o2.foregroundImageX || (null === (I2 = o2.foreground) || void 0 === I2 || null === (B2 = I2.image) || void 0 === B2 ? void 0 : B2.x), foregroundImageY: o2.foregroundImageY || (null === (S2 = o2.foreground) || void 0 === S2 || null === (P2 = S2.image) || void 0 === P2 ? void 0 : P2.y), foregroundImagePadding: o2.foregroundImagePadding || (null === (L2 = o2.foreground) || void 0 === L2 || null === (D2 = L2.image) || void 0 === D2 ? void 0 : D2.padding), foregroundImageBackgroundColor: o2.foregroundImageBackgroundColor || (null === (A2 = o2.foreground) || void 0 === A2 || null === (E2 = A2.image) || void 0 === E2 ? void 0 : E2.backgroundColor), foregroundImageBorderRadius: o2.foregroundImageBorderRadius || (null === (T2 = o2.foreground) || void 0 === T2 || null === (N2 = T2.image) || void 0 === N2 ? void 0 : N2.borderRadius), foregroundImageShadowOffsetX: o2.foregroundImageShadowOffsetX || (null === (M2 = o2.foreground) || void 0 === M2 || null === (z2 = M2.image) || void 0 === z2 ? void 0 : z2.shadowOffsetX), foregroundImageShadowOffsetY: o2.foregroundImageShadowOffsetY || (null === (R2 = o2.foreground) || void 0 === R2 || null === (_2 = R2.image) || void 0 === _2 ? void 0 : _2.shadowOffsetY), foregroundImageShadowBlur: o2.foregroundImageShadowBlur || (null === (O = o2.foreground) || void 0 === O || null === (F2 = O.image) || void 0 === F2 ? void 0 : F2.shadowBlur), foregroundImageShadowColor: o2.foregroundImageShadowColor || (null === (x2 = o2.foreground) || void 0 === x2 || null === (H2 = x2.image) || void 0 === H2 ? void 0 : H2.shadowColor), foregroundPadding: o2.foregroundPadding, positionProbeBackgroundColor: o2.positionProbeBackgroundColor || (null === (X2 = o2.positionProbe) || void 0 === X2 ? void 0 : X2.backgroundColor) || (null === (Y2 = o2.positionDetection) || void 0 === Y2 ? void 0 : Y2.backgroundColor), positionProbeForegroundColor: o2.positionProbeForegroundColor || (null === (j2 = o2.positionProbe) || void 0 === j2 ? void 0 : j2.foregroundColor) || (null === (W2 = o2.positionDetection) || void 0 === W2 ? void 0 : W2.foregroundColor), separatorColor: o2.separatorColor || (null === (G2 = o2.separator) || void 0 === G2 ? void 0 : G2.color), positionAdjustBackgroundColor: o2.positionAdjustBackgroundColor || (null === (K2 = o2.positionAdjust) || void 0 === K2 ? void 0 : K2.backgroundColor) || (null === (Q2 = o2.alignment) || void 0 === Q2 ? void 0 : Q2.backgroundColor), positionAdjustForegroundColor: o2.positionAdjustForegroundColor || (null === (U2 = o2.positionAdjust) || void 0 === U2 ? void 0 : U2.foregroundColor) || (null === ($2 = o2.alignment) || void 0 === $2 ? void 0 : $2.foregroundColor), timingBackgroundColor: o2.timingBackgroundColor || (null === (J2 = o2.timing) || void 0 === J2 ? void 0 : J2.backgroundColor), timingForegroundColor: o2.timingForegroundColor || (null === (q2 = o2.timing) || void 0 === q2 ? void 0 : q2.foregroundColor), typeNumberBackgroundColor: o2.typeNumberBackgroundColor || (null === (V2 = o2.typeNumber) || void 0 === V2 ? void 0 : V2.backgroundColor) || (null === (Z2 = o2.versionInformation) || void 0 === Z2 ? void 0 : Z2.backgroundColor), typeNumberForegroundColor: o2.typeNumberForegroundColor || (null === (oo = o2.typeNumber) || void 0 === oo ? void 0 : oo.foregroundColor) || (null === (eo = o2.versionInformation) || void 0 === eo ? void 0 : eo.foregroundColor), darkBlockColor: o2.darkBlockColor || (null === (ro = o2.darkBlock) || void 0 === ro ? void 0 : ro.color) }, true));
  }, b.prototype.make = function() {
    let { foregroundColor: o2, backgroundColor: r2, typeNumber: t2, errorCorrectLevel: i2, data: n2, size: a2, margin: d2, useDynamicSize: u2 } = this;
    if (o2 === r2)
      throw formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", "[uQRCode]: foregroundColor and backgroundColor cannot be the same!"), new b.Error("foregroundColor and backgroundColor cannot be the same!");
    var s2 = new e(t2, i2);
    s2.addData(function(o3) {
      o3 = o3.toString();
      for (var e2, r3 = "", t3 = 0; t3 < o3.length; t3++)
        (e2 = o3.charCodeAt(t3)) >= 1 && e2 <= 127 ? r3 += o3.charAt(t3) : e2 > 2047 ? (r3 += String.fromCharCode(224 | e2 >> 12 & 15), r3 += String.fromCharCode(128 | e2 >> 6 & 63), r3 += String.fromCharCode(128 | e2 >> 0 & 63)) : (r3 += String.fromCharCode(192 | e2 >> 6 & 31), r3 += String.fromCharCode(128 | e2 >> 0 & 63));
      return r3;
    }(n2)), s2.make(), this.base = s2, this.typeNumber = s2.typeNumber, this.modules = s2.modules, this.moduleCount = s2.moduleCount, this.dynamicSize = u2 ? Math.ceil((a2 - 2 * d2) / s2.moduleCount) * s2.moduleCount + 2 * d2 : a2, function(o3) {
      let { dynamicSize: e2, margin: r3, backgroundColor: t3, backgroundPadding: i3, foregroundColor: n3, foregroundPadding: a3, modules: d3, moduleCount: u3 } = o3, s3 = (e2 - 2 * r3) / u3, g2 = s3, l2 = 0;
      i3 > 0 && (l2 = g2 * i3 / 2, g2 -= 2 * l2);
      let h2 = s3, c2 = 0;
      a3 > 0 && (c2 = h2 * a3 / 2, h2 -= 2 * c2);
      for (var m2 = 0; m2 < u3; m2++)
        for (var f2 = 0; f2 < u3; f2++) {
          var v2 = f2 * s3 + r3, p2 = m2 * s3 + r3;
          if (d3[m2][f2]) {
            var C2 = c2, b2 = v2 + c2, k2 = p2 + c2, y2 = h2, w2 = h2;
            d3[m2][f2] = { type: ["foreground"], color: n3, isBlack: true, isDrawn: false, destX: v2, destY: p2, destWidth: s3, destHeight: s3, x: b2, y: k2, width: y2, height: w2, paddingTop: C2, paddingRight: C2, paddingBottom: C2, paddingLeft: C2 };
          } else
            C2 = l2, b2 = v2 + l2, k2 = p2 + l2, y2 = g2, w2 = g2, d3[m2][f2] = { type: ["background"], color: t3, isBlack: false, isDrawn: false, destX: v2, destY: p2, destWidth: s3, destHeight: s3, x: b2, y: k2, width: y2, height: w2, paddingTop: C2, paddingRight: C2, paddingBottom: C2, paddingLeft: C2 };
        }
    }(this), function(o3) {
      let { modules: e2, moduleCount: r3, positionProbeBackgroundColor: t3, positionProbeForegroundColor: i3 } = o3, n3 = r3 - 7;
      [[0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], [5, 0, 1], [6, 0, 1], [0, 1, 1], [1, 1, 0], [2, 1, 0], [3, 1, 0], [4, 1, 0], [5, 1, 0], [6, 1, 1], [0, 2, 1], [1, 2, 0], [2, 2, 1], [3, 2, 1], [4, 2, 1], [5, 2, 0], [6, 2, 1], [0, 3, 1], [1, 3, 0], [2, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 0], [6, 3, 1], [0, 4, 1], [1, 4, 0], [2, 4, 1], [3, 4, 1], [4, 4, 1], [5, 4, 0], [6, 4, 1], [0, 5, 1], [1, 5, 0], [2, 5, 0], [3, 5, 0], [4, 5, 0], [5, 5, 0], [6, 5, 1], [0, 6, 1], [1, 6, 1], [2, 6, 1], [3, 6, 1], [4, 6, 1], [5, 6, 1], [6, 6, 1]].forEach((o4) => {
        var r4 = e2[o4[0]][o4[1]], a3 = e2[o4[0] + n3][o4[1]], d3 = e2[o4[0]][o4[1] + n3];
        d3.type.push("positionProbe"), a3.type.push("positionProbe"), r4.type.push("positionProbe"), r4.color = 1 == o4[2] ? i3 : t3, a3.color = 1 == o4[2] ? i3 : t3, d3.color = 1 == o4[2] ? i3 : t3;
      });
    }(this), function(o3) {
      let { modules: e2, moduleCount: r3, separatorColor: t3 } = o3;
      [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]].forEach((o4) => {
        var i3 = e2[o4[0]][o4[1]], n3 = e2[r3 - o4[0] - 1][o4[1]], a3 = e2[o4[0]][r3 - o4[1] - 1];
        a3.type.push("separator"), n3.type.push("separator"), i3.type.push("separator"), i3.color = t3, n3.color = t3, a3.color = t3;
      });
    }(this), function(o3) {
      let { typeNumber: e2, modules: r3, moduleCount: t3, foregroundColor: i3, backgroundColor: n3, positionAdjustForegroundColor: a3, positionAdjustBackgroundColor: d3, timingForegroundColor: u3, timingBackgroundColor: s3 } = o3;
      const g2 = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]][e2 - 1];
      if (g2) {
        const o4 = [[-2, -2, 1], [-1, -2, 1], [0, -2, 1], [1, -2, 1], [2, -2, 1], [-2, -1, 1], [-1, -1, 0], [0, -1, 0], [1, -1, 0], [2, -1, 1], [-2, 0, 1], [-1, 0, 0], [0, 0, 1], [1, 0, 0], [2, 0, 1], [-2, 1, 1], [-1, 1, 0], [0, 1, 0], [1, 1, 0], [2, 1, 1], [-2, 2, 1], [-1, 2, 1], [0, 2, 1], [1, 2, 1], [2, 2, 1]], e3 = g2.length;
        for (let l2 = 0; l2 < e3; l2++)
          for (let h2 = 0; h2 < e3; h2++) {
            let { x: e4, y: c2 } = { x: g2[l2], y: g2[h2] };
            e4 < 9 && c2 < 9 || e4 > t3 - 9 - 1 && c2 < 9 || c2 > t3 - 9 - 1 && e4 < 9 || o4.forEach((o5) => {
              var t4 = r3[e4 + o5[0]][c2 + o5[1]];
              t4.type.push("positionAdjust"), t4.type.includes("timing") ? 1 == o5[2] ? t4.color = a3 == i3 ? u3 : a3 : t4.color = a3 == i3 && d3 == n3 ? s3 : d3 : t4.color = 1 == o5[2] ? a3 : d3;
            });
          }
      }
    }(this), function(o3) {
      let { modules: e2, moduleCount: r3, timingForegroundColor: t3, timingBackgroundColor: i3 } = o3, n3 = r3 - 16;
      for (let o4 = 0; o4 < n3; o4++) {
        var a3 = e2[6][8 + o4], d3 = e2[8 + o4][6];
        a3.type.push("timing"), d3.type.push("timing"), a3.color = 1 & o4 ^ 1 ? t3 : i3, d3.color = 1 & o4 ^ 1 ? t3 : i3;
      }
    }(this), function(o3) {
      let { modules: e2, moduleCount: r3, darkBlockColor: t3 } = o3;
      var i3 = e2[r3 - 7 - 1][8];
      i3.type.push("darkBlock"), i3.color = t3;
    }(this), function(o3) {
      let { typeNumber: e2, modules: r3, moduleCount: t3, typeNumberBackgroundColor: i3, typeNumberForegroundColor: n3 } = o3;
      if (e2 < 7)
        return r3;
      const a3 = [0, 0, 0, 0, 0, 0, 0, "000111110010010100", "001000010110111100", "001001101010011001", "001010010011010011", "001011101111110110", "001100011101100010", "001101100001000111", "001110011000001101", "001111100100101000", "010000101101111000", "010001010001011101", "010010101000010111", "010011010100110010", "010100100110100110", "010101011010000011", "010110100011001001", "010111011111101100", "011000111011000100", "011001000111100001", "011010111110101011", "011011000010001110", "011100110000011010", "011101001100111111", "011110110101110101", "011111001001010000", "100000100111010101", "100001011011110000", "100010100010111010", "100011011110011111", "100100101100001011", "100101010000101110", "100110101001100100", "100111010101000001", "101000110001101001"];
      let d3 = a3[e2] + a3[e2], u3 = [t3 - 11, t3 - 10, t3 - 9];
      [[5, u3[2]], [5, u3[1]], [5, u3[0]], [4, u3[2]], [4, u3[1]], [4, u3[0]], [3, u3[2]], [3, u3[1]], [3, u3[0]], [2, u3[2]], [2, u3[1]], [2, u3[0]], [1, u3[2]], [1, u3[1]], [1, u3[0]], [0, u3[2]], [0, u3[1]], [0, u3[0]], [u3[2], 5], [u3[1], 5], [u3[0], 5], [u3[2], 4], [u3[1], 4], [u3[0], 4], [u3[2], 3], [u3[1], 3], [u3[0], 3], [u3[2], 2], [u3[1], 2], [u3[0], 2], [u3[2], 1], [u3[1], 1], [u3[0], 1], [u3[2], 0], [u3[1], 0], [u3[0], 0]].forEach((o4, e3) => {
        var t4 = r3[o4[0]][o4[1]];
        t4.type.push("typeNumber"), t4.color = "1" == d3[e3] ? n3 : i3;
      });
    }(this), this.isMaked = true, this.drawModules = [];
  }, b.prototype.getDrawModules = function() {
    if (this.drawModules && this.drawModules.length > 0)
      return this.drawModules;
    let o2 = this.drawModules = [], { modules: e2, moduleCount: r2, dynamicSize: t2, areaColor: i2, backgroundImageSrc: n2, backgroundImageX: a2, backgroundImageY: d2, backgroundImageWidth: u2, backgroundImageHeight: s2, backgroundImageAlpha: g2, backgroundImageBorderRadius: l2, foregroundImageSrc: h2, foregroundImageX: c2, foregroundImageY: m2, foregroundImageWidth: f2, foregroundImageHeight: v2, foregroundImagePadding: p2, foregroundImageBackgroundColor: C2, foregroundImageBorderRadius: b2, foregroundImageShadowOffsetX: k2, foregroundImageShadowOffsetY: y2, foregroundImageShadowBlur: w2, foregroundImageShadowColor: I2 } = this;
    i2 && o2.push({ name: "area", type: "area", color: i2, x: 0, y: 0, width: t2, height: t2 }), n2 && o2.push({ name: "backgroundImage", type: "image", imageSrc: n2, mappingName: "backgroundImageSrc", x: a2, y: d2, width: u2, height: s2, alpha: g2, borderRadius: l2 });
    for (var B2 = 0; B2 < r2; B2++)
      for (var S2 = 0; S2 < r2; S2++) {
        var P2 = e2[B2][S2];
        P2.isDrawn || (P2.type.includes("foreground") ? o2.push({ name: "foreground", type: "tile", color: P2.color, destX: P2.destX, destY: P2.destY, destWidth: P2.destWidth, destHeight: P2.destHeight, x: P2.x, y: P2.y, width: P2.width, height: P2.height, paddingTop: P2.paddingTop, paddingRight: P2.paddingRight, paddingBottom: P2.paddingBottom, paddingLeft: P2.paddingLeft, rowIndex: B2, colIndex: S2 }) : o2.push({ name: "background", type: "tile", color: P2.color, destX: P2.destX, destY: P2.destY, destWidth: P2.destWidth, destHeight: P2.destHeight, x: P2.x, y: P2.y, width: P2.width, height: P2.height, paddingTop: P2.paddingTop, paddingRight: P2.paddingRight, paddingBottom: P2.paddingBottom, paddingLeft: P2.paddingLeft, rowIndex: B2, colIndex: S2 }), P2.isDrawn = true);
      }
    return h2 && o2.push({ name: "foregroundImage", type: "image", imageSrc: h2, mappingName: "foregroundImageSrc", x: c2, y: m2, width: f2, height: v2, padding: p2, backgroundColor: C2, borderRadius: b2, shadowOffsetX: k2, shadowOffsetY: y2, shadowBlur: w2, shadowColor: I2 }), o2;
  }, b.prototype.isBlack = function(o2, e2) {
    var r2 = this.moduleCount;
    return !(0 > o2 || 0 > e2 || o2 >= r2 || e2 >= r2) && this.modules[o2][e2].isBlack;
  }, b.prototype.drawCanvas = function() {
    let { isMaked: o2, canvasContext: e2, useDynamicSize: r2, dynamicSize: t2, foregroundColor: i2, foregroundPadding: n2, backgroundColor: a2, backgroundPadding: d2, drawReserve: u2, margin: s2 } = this;
    if (!o2)
      return formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", "[uQRCode]: please execute the make method first!"), Promise.reject(new b.Error("please execute the make method first!"));
    let g2 = this.getDrawModules(), l2 = async (o3, r3) => {
      try {
        e2.clearRect(0, 0, t2, t2), e2.draw(false);
        for (var i3 = 0; i3 < g2.length; i3++) {
          var n3 = g2[i3];
          switch (e2.save(), n3.type) {
            case "area":
              e2.setFillStyle(n3.color), e2.fillRect(n3.x, n3.y, n3.width, n3.height);
              break;
            case "tile":
              var a3 = n3.x, d3 = n3.y, s3 = n3.width, l3 = n3.height;
              e2.setFillStyle(n3.color), e2.fillRect(a3, d3, s3, l3);
              break;
            case "image":
              if ("backgroundImage" === n3.name) {
                a3 = Math.round(n3.x), d3 = Math.round(n3.y), s3 = Math.round(n3.width), l3 = Math.round(n3.height);
                s3 < 2 * (c2 = Math.round(n3.borderRadius)) && (c2 = s3 / 2), l3 < 2 * c2 && (c2 = l3 / 2), e2.setGlobalAlpha(n3.alpha), c2 > 0 && (e2.beginPath(), e2.moveTo(a3 + c2, d3), e2.arcTo(a3 + s3, d3, a3 + s3, d3 + l3, c2), e2.arcTo(a3 + s3, d3 + l3, a3, d3 + l3, c2), e2.arcTo(a3, d3 + l3, a3, d3, c2), e2.arcTo(a3, d3, a3 + s3, d3, c2), e2.closePath(), e2.setStrokeStyle("rgba(0,0,0,0)"), e2.stroke(), e2.clip());
                try {
                  var h2 = await this.loadImage(n3.imageSrc);
                  e2.drawImage(h2, a3, d3, s3, l3);
                } catch (o4) {
                  throw formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", `[uQRCode]: ${n3.mappingName} invalid!`), new b.Error(`${n3.mappingName} invalid!`);
                }
              } else if ("foregroundImage" === n3.name) {
                a3 = Math.round(n3.x), d3 = Math.round(n3.y), s3 = Math.round(n3.width), l3 = Math.round(n3.height);
                var c2, m2 = Math.round(n3.padding);
                s3 < 2 * (c2 = Math.round(n3.borderRadius)) && (c2 = s3 / 2), l3 < 2 * c2 && (c2 = l3 / 2);
                var f2 = a3 - m2, v2 = d3 - m2, p2 = s3 + 2 * m2, C2 = l3 + 2 * m2, k2 = Math.round(p2 / s3 * c2);
                p2 < 2 * k2 && (k2 = p2 / 2), C2 < 2 * k2 && (k2 = C2 / 2), e2.save(), e2.setShadow(n3.shadowOffsetX, n3.shadowOffsetY, n3.shadowBlur, n3.shadowColor), k2 > 0 ? (e2.beginPath(), e2.moveTo(f2 + k2, v2), e2.arcTo(f2 + p2, v2, f2 + p2, v2 + C2, k2), e2.arcTo(f2 + p2, v2 + C2, f2, v2 + C2, k2), e2.arcTo(f2, v2 + C2, f2, v2, k2), e2.arcTo(f2, v2, f2 + p2, v2, k2), e2.closePath(), e2.setFillStyle(n3.backgroundColor), e2.fill()) : (e2.setFillStyle(n3.backgroundColor), e2.fillRect(f2, v2, p2, C2)), e2.restore(), e2.save(), k2 > 0 ? (e2.beginPath(), e2.moveTo(f2 + k2, v2), e2.arcTo(f2 + p2, v2, f2 + p2, v2 + C2, k2), e2.arcTo(f2 + p2, v2 + C2, f2, v2 + C2, k2), e2.arcTo(f2, v2 + C2, f2, v2, k2), e2.arcTo(f2, v2, f2 + p2, v2, k2), e2.closePath(), e2.setFillStyle(m2 > 0 ? n3.backgroundColor : "rgba(0,0,0,0)"), e2.fill()) : (e2.setFillStyle(m2 > 0 ? n3.backgroundColor : "rgba(0,0,0,0)"), e2.fillRect(f2, v2, p2, C2)), e2.restore(), c2 > 0 && (e2.beginPath(), e2.moveTo(a3 + c2, d3), e2.arcTo(a3 + s3, d3, a3 + s3, d3 + l3, c2), e2.arcTo(a3 + s3, d3 + l3, a3, d3 + l3, c2), e2.arcTo(a3, d3 + l3, a3, d3, c2), e2.arcTo(a3, d3, a3 + s3, d3, c2), e2.closePath(), e2.setStrokeStyle("rgba(0,0,0,0)"), e2.stroke(), e2.clip());
                try {
                  h2 = await this.loadImage(n3.imageSrc);
                  e2.drawImage(h2, a3, d3, s3, l3);
                } catch (o4) {
                  throw formatAppLog("error", "at uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js:34", `[uQRCode]: ${n3.mappingName} invalid!`), new b.Error(`${n3.mappingName} invalid!`);
                }
              }
          }
          u2 && e2.draw(true), e2.restore();
        }
        e2.draw(true), setTimeout(o3, 150);
      } catch (o4) {
        if (!(o4 instanceof b.Error))
          throw o4;
        r3(o4);
      }
    };
    return new Promise((o3, e3) => {
      l2(o3, e3);
    });
  }, b.prototype.draw = function() {
    return this.drawCanvas();
  }, b.prototype.register = function(o2) {
    o2 && o2(b, this, true);
  };
  function Queue() {
    let waitingQueue = this.waitingQueue = [];
    let isRunning = this.isRunning = false;
    function execute(task, resolve, reject) {
      task().then((data2) => {
        resolve(data2);
      }).catch((e2) => {
        reject(e2);
      }).finally(() => {
        if (waitingQueue.length) {
          const next = waitingQueue.shift();
          execute(next.task, next.resolve, next.reject);
        } else {
          isRunning = false;
        }
      });
    }
    this.exec = function(task) {
      return new Promise((resolve, reject) => {
        if (isRunning) {
          waitingQueue.push({
            task,
            resolve,
            reject
          });
        } else {
          isRunning = true;
          execute(task, resolve, reject);
        }
      });
    };
  }
  const queueDraw = new Queue();
  const queueLoadImage = new Queue();
  const cacheImageList = [];
  let instance = null;
  const _sfc_main$w = {
    name: "uqrcode",
    props: {
      /**
       * canvas组件id
       */
      canvasId: {
        type: String,
        required: true
        // canvasId在微信小程序初始值不能为空，created中赋值也不行，必须给一个值，否则挂载组件后无法绘制。不考虑用随机id，uuid
      },
      /**
       * 二维码内容
       */
      value: {
        type: [String, Number]
      },
      /**
       * 选项
       */
      options: {
        type: Object,
        default: () => {
          return {};
        }
      },
      /**
       * 二维码大小
       */
      size: {
        type: [String, Number],
        default: 200
      },
      /**
       * 二维码尺寸单位
       */
      sizeUnit: {
        type: String,
        default: "px"
      },
      /**
       * 导出的文件类型
       */
      fileType: {
        type: String,
        default: "png"
      },
      /**
       * 是否初始化组件后就开始生成
       */
      start: {
        type: Boolean,
        default: true
      },
      /**
       * 是否数据发生改变自动重绘
       */
      auto: {
        type: Boolean,
        default: true
      },
      /**
       * 隐藏组件
       */
      hide: {
        type: Boolean,
        default: false
      },
      /**
       * canvas 类型，微信小程序默认使用2d，非2d微信官方已放弃维护，问题比较多
       * 注意：微信小程序type2d手机上正常，PC上微信内打开小程序toDataURL报错，看后期微信官方团队会不会做兼容，不兼容的话只能在自行判断在PC使用非2d，或者直接提示用户请在手机上操作，微信团队的海报中心小程序就是这么做的
       */
      type: {
        type: String,
        default: () => {
          return "normal";
        }
      },
      /**
       * 队列绘制，主要针对NVue端
       */
      queue: {
        type: Boolean,
        default: false
      },
      /**
       * 是否队列加载图片，可减少canvas发起的网络资源请求，节省服务器资源
       */
      isQueueLoadImage: {
        type: Boolean,
        default: false
      },
      /**
       * loading态
       */
      loading: {
        type: Boolean,
        default: void 0
      },
      /**
       * H5保存即自动下载（在支持的环境下），默认false为仅弹层提示用户需要长按图片保存，不会自动下载
       */
      h5SaveIsDownload: {
        type: Boolean,
        default: false
      },
      /**
       * H5下载名称
       */
      h5DownloadName: {
        type: String,
        default: "uQRCode"
      }
    },
    data() {
      return {
        canvas: void 0,
        canvasType: void 0,
        canvasContext: void 0,
        makeDelegate: void 0,
        drawDelegate: void 0,
        toTempFilePathDelegate: void 0,
        makeExecuted: false,
        makeing: false,
        drawing: false,
        isError: false,
        error: void 0,
        isH5Save: false,
        tempFilePath: "",
        templateOptions: {
          size: 0,
          width: 0,
          // 组件宽度
          height: 0,
          canvasWidth: 0,
          // canvas宽度
          canvasHeight: 0,
          canvasTransform: "",
          canvasDisplay: false
        },
        uqrcodeOptions: {
          data: ""
        },
        plugins: [],
        makeingPattern: [
          [
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true]
          ],
          [
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, false, false, false],
            [true, true, true, true, true, true, false, true, true, true],
            [true, true, true, true, true, true, false, true, true, true],
            [true, true, true, true, true, true, false, true, true, true]
          ],
          [
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, true, true, true, true, false, false, false],
            [true, true, true, true, true, true, true, false, false, false],
            [true, true, true, true, true, true, true, false, false, false],
            [true, true, true, false, false, false, false, true, true, true],
            [true, true, true, false, false, false, false, true, true, true]
          ],
          [
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, false, false, false, false, false, false, false],
            [true, true, true, false, false, false, false, false, false, false],
            [true, true, true, false, false, false, false, false, false, false],
            [true, true, true, false, false, false, false, false, false, false],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true],
            [true, true, true, true, true, true, true, true, true, true]
          ]
        ]
      };
    },
    watch: {
      type: {
        handler(val) {
          const types2 = ["2d"];
          if (types2.includes(val)) {
            this.canvasType = val;
          } else {
            this.canvasType = void 0;
          }
        },
        immediate: true
      },
      value: {
        handler() {
          if (this.auto) {
            this.remake();
          }
        }
      },
      size: {
        handler() {
          if (this.auto) {
            this.remake();
          }
        }
      },
      options: {
        handler() {
          if (this.auto) {
            this.remake();
          }
        },
        deep: true
      },
      makeing: {
        handler(val) {
          if (!val) {
            if (typeof this.toTempFilePathDelegate === "function") {
              this.toTempFilePathDelegate();
            }
          }
        }
      }
    },
    mounted() {
      this.templateOptions.size = this.sizeUnit == "rpx" ? uni.upx2px(this.size) : this.size;
      this.templateOptions.width = this.templateOptions.size;
      this.templateOptions.height = this.templateOptions.size;
      this.templateOptions.canvasWidth = this.templateOptions.size;
      this.templateOptions.canvasHeight = this.templateOptions.size;
      if (this.canvasType == "2d") {
        this.templateOptions.canvasTransform = `scale(${this.templateOptions.size / this.templateOptions.canvasWidth}, ${this.templateOptions.size / this.templateOptions.canvasHeight})`;
      } else {
        this.templateOptions.canvasTransform = `scale(${this.templateOptions.size / this.templateOptions.canvasWidth}, ${this.templateOptions.size / this.templateOptions.canvasHeight})`;
      }
      if (this.start) {
        this.make();
      }
    },
    methods: {
      /**
       * 获取模板选项
       */
      getTemplateOptions() {
        var size = this.sizeUnit == "rpx" ? uni.upx2px(this.size) : this.size;
        return deepReplace(this.templateOptions, {
          size,
          width: size,
          height: size
        });
      },
      /**
       * 获取插件选项
       */
      getUqrcodeOptions() {
        return deepReplace(this.options, {
          data: String(this.value),
          size: Number(this.templateOptions.size)
        });
      },
      /**
       * 重置画布
       */
      resetCanvas(callback) {
        this.templateOptions.canvasDisplay = false;
        this.$nextTick(() => {
          this.templateOptions.canvasDisplay = true;
          this.$nextTick(() => {
            callback && callback();
          });
        });
      },
      /**
       * 绘制二维码
       */
      async draw(callback = {}, isDrawDelegate = false) {
        if (typeof callback.success != "function") {
          callback.success = () => {
          };
        }
        if (typeof callback.fail != "function") {
          callback.fail = () => {
          };
        }
        if (typeof callback.complete != "function") {
          callback.complete = () => {
          };
        }
        if (this.drawing) {
          if (!isDrawDelegate) {
            this.drawDelegate = () => {
              this.draw(callback, true);
            };
            return;
          }
        } else {
          this.drawing = true;
        }
        if (!this.canvasId) {
          formatAppLog("error", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:405", "[uQRCode]: canvasId must be set!");
          this.isError = true;
          this.drawing = false;
          callback.fail({
            errMsg: "[uQRCode]: canvasId must be set!"
          });
          callback.complete({
            errMsg: "[uQRCode]: canvasId must be set!"
          });
          return;
        }
        if (!this.value) {
          formatAppLog("error", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:417", "[uQRCode]: value must be set!");
          this.isError = true;
          this.drawing = false;
          callback.fail({
            errMsg: "[uQRCode]: value must be set!"
          });
          callback.complete({
            errMsg: "[uQRCode]: value must be set!"
          });
          return;
        }
        this.templateOptions = this.getTemplateOptions();
        this.uqrcodeOptions = this.getUqrcodeOptions();
        if (typeof this.uqrcodeOptions.errorCorrectLevel === "string") {
          this.uqrcodeOptions.errorCorrectLevel = b.errorCorrectLevel[this.uqrcodeOptions.errorCorrectLevel];
        }
        if (typeof this.options.useDynamicSize === "undefined") {
          this.uqrcodeOptions.useDynamicSize = true;
        }
        const qr = instance = new b();
        this.plugins.forEach((p2) => qr.register(p2.plugin));
        qr.setOptions(this.uqrcodeOptions);
        qr.make();
        let canvasContext = null;
        if (this.canvasType === "2d") {
          canvasContext = this.canvasContext = uni.createCanvasContext(this.canvasId, this);
          this.templateOptions.canvasWidth = qr.dynamicSize;
          this.templateOptions.canvasHeight = qr.dynamicSize;
          this.templateOptions.canvasTransform = `scale(${this.templateOptions.size / this.templateOptions.canvasWidth}, ${this.templateOptions.size / this.templateOptions.canvasHeight})`;
          qr.loadImage = this.getLoadImage(function(src) {
            return new Promise((resolve, reject) => {
              if (src.startsWith("http")) {
                uni.getImageInfo({
                  src,
                  success: (res) => {
                    resolve(res.path);
                  },
                  fail: (err) => {
                    reject(err);
                  }
                });
              } else {
                if (src.startsWith(".")) {
                  formatAppLog("error", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:528", "[uQRCode]: 本地图片路径仅支持绝对路径！");
                  throw new Error("[uQRCode]: local image path only supports absolute path!");
                } else {
                  resolve(src);
                }
              }
            });
          });
        } else {
          canvasContext = this.canvasContext = uni.createCanvasContext(this.canvasId, this);
          this.templateOptions.canvasWidth = qr.dynamicSize;
          this.templateOptions.canvasHeight = qr.dynamicSize;
          this.templateOptions.canvasTransform = `scale(${this.templateOptions.size / this.templateOptions.canvasWidth}, ${this.templateOptions.size / this.templateOptions.canvasHeight})`;
          qr.loadImage = this.getLoadImage(function(src) {
            return new Promise((resolve, reject) => {
              if (src.startsWith("http")) {
                uni.getImageInfo({
                  src,
                  success: (res) => {
                    resolve(res.path);
                  },
                  fail: (err) => {
                    reject(err);
                  }
                });
              } else {
                if (src.startsWith(".")) {
                  formatAppLog("error", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:561", "[uQRCode]: 本地图片路径仅支持绝对路径！");
                  throw new Error("[uQRCode]: local image path only supports absolute path!");
                } else {
                  resolve(src);
                }
              }
            });
          });
        }
        qr.canvasContext = canvasContext;
        setTimeout(() => {
          var plugin = this.plugins.find((p2) => p2.name == qr.style);
          var drawCanvasName = plugin ? plugin.drawCanvas : "drawCanvas";
          var drawCanvas;
          if (this.queue) {
            drawCanvas = () => queueDraw.exec(() => qr[drawCanvasName]());
          } else {
            drawCanvas = () => qr[drawCanvasName]();
          }
          drawCanvas().then(() => {
            if (this.drawDelegate) {
              let delegate = this.drawDelegate;
              this.drawDelegate = void 0;
              delegate();
            } else {
              this.drawing = false;
              callback.success();
            }
          }).catch((err) => {
            formatAppLog("log", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:633", err);
            if (this.drawDelegate) {
              let delegate = this.drawDelegate;
              this.drawDelegate = void 0;
              delegate();
            } else {
              this.drawing = false;
              this.isError = true;
              callback.fail(err);
            }
          }).finally(() => {
            callback.complete();
          });
        }, 300);
      },
      /**
       * 生成二维码
       */
      make(callback = {}) {
        this.makeExecuted = true;
        this.makeing = true;
        this.isError = false;
        if (typeof callback.success != "function") {
          callback.success = () => {
          };
        }
        if (typeof callback.fail != "function") {
          callback.fail = () => {
          };
        }
        if (typeof callback.complete != "function") {
          callback.complete = () => {
          };
        }
        this.resetCanvas(() => {
          clearTimeout(this.makeDelegate);
          this.makeDelegate = setTimeout(() => {
            this.draw({
              success: () => {
                setTimeout(() => {
                  callback.success();
                  this.complete(true);
                }, 300);
              },
              fail: (err) => {
                callback.fail(err);
                this.error = err;
                this.complete(false, err.errMsg);
              },
              complete: () => {
                callback.complete();
                this.makeing = false;
              }
            });
          }, 300);
        });
      },
      /**
       * 重新生成
       */
      remake(callback) {
        this.$emit("change");
        this.make(callback);
      },
      /**
       * 生成完成
       */
      complete(success = true, errMsg = "") {
        if (success) {
          this.$emit("complete", {
            success
          });
        } else {
          this.$emit("complete", {
            success,
            errMsg
          });
        }
      },
      /**
       * 导出临时路径
       */
      toTempFilePath(callback = {}) {
        if (typeof callback.success != "function") {
          callback.success = () => {
          };
        }
        if (typeof callback.fail != "function") {
          callback.fail = () => {
          };
        }
        if (typeof callback.complete != "function") {
          callback.complete = () => {
          };
        }
        if (!this.makeExecuted) {
          formatAppLog("error", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:728", "[uQRCode]: make() 方法从未调用！请先成功调用 make() 后再进行操作。");
          var err = {
            errMsg: "[uQRCode]: make() method has never been executed! please execute make() successfully before operating."
          };
          callback.fail(err);
          callback.complete(err);
          return;
        }
        if (this.isError) {
          callback.fail(this.error);
          callback.complete(this.error);
          return;
        }
        if (this.makeing) {
          this.toTempFilePathDelegate = () => {
            this.toTempFilePath(callback);
          };
          return;
        } else {
          this.toTempFilePathDelegate = null;
        }
        if (this.canvasType === "2d")
          ;
        else {
          uni.canvasToTempFilePath(
            {
              canvasId: this.canvasId,
              fileType: this.fileType,
              width: Number(this.templateOptions.canvasWidth),
              height: Number(this.templateOptions.canvasHeight),
              destWidth: Number(this.templateOptions.size),
              destHeight: Number(this.templateOptions.size),
              success: (res) => {
                callback.success(res);
              },
              fail: (err2) => {
                callback.fail(err2);
              },
              complete: () => {
                callback.complete();
              }
            },
            this
          );
        }
      },
      /**
       * 保存
       */
      save(callback = {}) {
        if (typeof callback.success != "function") {
          callback.success = () => {
          };
        }
        if (typeof callback.fail != "function") {
          callback.fail = () => {
          };
        }
        if (typeof callback.complete != "function") {
          callback.complete = () => {
          };
        }
        this.toTempFilePath({
          success: (res) => {
            if (this.canvasType === "2d")
              ;
            else {
              uni.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: (res1) => {
                  callback.success(res1);
                },
                fail: (err1) => {
                  callback.fail(err1);
                },
                complete: () => {
                  callback.complete();
                }
              });
            }
          },
          fail: (err) => {
            callback.fail(err);
            callback.complete(err);
          }
        });
      },
      /**
       * 注册click事件
       */
      onClick(e2) {
        this.$emit("click", e2);
      },
      /**
       * 获取实例
       */
      getInstance() {
        return instance;
      },
      /**
       * 注册扩展，组件仅支持注册type为style的drawCanvas扩展
       * @param {Object} plugin
       */
      registerStyle(plugin) {
        if (plugin.Type != "style") {
          formatAppLog("warn", "at uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue:930", "[uQRCode]: registerStyle 仅支持注册 style 类型的扩展！");
          return {
            errMsg: "registerStyle 仅支持注册 style 类型的扩展！"
          };
        }
        if (typeof plugin === "function") {
          this.plugins.push({
            plugin,
            name: plugin.Name,
            drawCanvas: plugin.DrawCanvas
          });
        }
      },
      getLoadImage(loadImage) {
        var that = this;
        if (typeof loadImage == "function") {
          return function(src) {
            if (that.isQueueLoadImage) {
              return queueLoadImage.exec(() => {
                return new Promise((resolve, reject) => {
                  setTimeout(() => {
                    const cache2 = cacheImageList.find((x2) => x2.src == src);
                    if (cache2) {
                      resolve(cache2.img);
                    } else {
                      loadImage(src).then((img) => {
                        cacheImageList.push({
                          src,
                          img
                        });
                        resolve(img);
                      }).catch((err) => {
                        reject(err);
                      });
                    }
                  }, 10);
                });
              });
            } else {
              return loadImage(src);
            }
          };
        } else {
          return function(src) {
            return Promise.resolve(src);
          };
        }
      }
    }
  };
  function deepReplace(o2 = {}, r2 = {}, c2 = false) {
    let obj;
    if (c2) {
      obj = o2;
    } else {
      obj = {
        ...o2
      };
    }
    for (let k2 in r2) {
      var vr = r2[k2];
      if (vr != void 0) {
        if (vr.constructor == Object) {
          obj[k2] = this.deepReplace(obj[k2], vr);
        } else if (vr.constructor == String && !vr) {
          obj[k2] = obj[k2];
        } else {
          obj[k2] = vr;
        }
      }
    }
    return obj;
  }
  function _sfc_render$v(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["uqrcode", { "uqrcode-hide": $props.hide }]),
        style: vue.normalizeStyle({ width: `${$data.templateOptions.width}px`, height: `${$data.templateOptions.height}px` })
      },
      [
        vue.createElementVNode("view", { class: "uqrcode-canvas-wrapper" }, [
          vue.createCommentVNode(" 画布 "),
          $data.templateOptions.canvasDisplay ? (vue.openBlock(), vue.createElementBlock("canvas", {
            key: 0,
            class: "uqrcode-canvas",
            id: $props.canvasId,
            "canvas-id": $props.canvasId,
            type: $data.canvasType,
            style: vue.normalizeStyle({
              width: `${$data.templateOptions.canvasWidth}px`,
              height: `${$data.templateOptions.canvasHeight}px`,
              transform: $data.templateOptions.canvasTransform
            }),
            onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
          }, null, 12, ["id", "canvas-id", "type"])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" nvue用gcanvas ")
        ]),
        vue.createCommentVNode(" 加载效果 "),
        ($props.loading === void 0 ? $data.makeing : $props.loading) ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uqrcode-makeing"
        }, [
          vue.renderSlot(_ctx.$slots, "loading", {}, () => [
            vue.createElementVNode(
              "image",
              {
                class: "uqrcode-makeing-image",
                style: vue.normalizeStyle({ width: `${$data.templateOptions.size / 4}px`, height: `${$data.templateOptions.size / 4}px` }),
                src: "data:image/gif;base64,R0lGODlhAAEAAfIEAOHh4SSsWuDg4N3d3f///wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDAyIDc5LjE2NDQ4OCwgMjAyMC8wNy8xMC0yMjowNjo1MyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAyODhGMzM4RDEwMTExRUM4MDhCRkVBQkE2QUZDQzkwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjAyODhGMzM5RDEwMTExRUM4MDhCRkVBQkE2QUZDQzkwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4OEYzMzZEMTAxMTFFQzgwOEJGRUFCQTZBRkNDOTAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDI4OEYzMzdEMTAxMTFFQzgwOEJGRUFCQTZBRkNDOTAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQFFAAEACwAAAAAAAEAAQAD/0i63P4wykmrvTjrzbv/YCiOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2Kx2y+16v+CweEwum8/otHrNbrvf8Lh8Tq/b7/i8fs/v+/+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanigCqq6ytrieusbISAbW2t7i5uru8vb66bLLCrLDDw7S/ycrLzLXBxsLF0LHIzdbXzc/Trybb1BHY4eK92t6r0uaq1ePs4+Xp6PDg7fTh7+bx+PP1/Mz33vkA7utH0Ne/bQERDizIMNfBaQkhLmxIMcBDaBExTqzI8P+isYwfN3Ik6PFYt3TnRI7kVzLaSZQA1q0s2HLWS5QyZ/ar+a0ETHUqdbLjyc3nz5xC6RFtBdIkhKQ01/yMeVPeU6g7pR6tqu8q1npLiXEV6PVru7ApjcJEquyEPa1rxyosm83EWzVTm7qk688uNrRA1eIMatDvNcBUBVt9cJdEYzR55Urku8ztX7iDFXdlfLnE4zORNZPlfNiwNcR6bVJua7ou3q2i55I+3brv67ixJ8927bhzmtAkgDv4HIJ4GeEikDMw/oH5GOUgoCtw3oF6GOkesFvfsP0L9g7afY/o7uU7h/ClPYsHDTt4++Hri8c//j55/eXzm+d/fj96/+n/+1UX4HX/ZVcgeRggyIV5G6BHmycMauAgb5xEmMGEtnViIQYYVvbJhhd0yBqEBYJ34ICUgGiBiMmAomIFLP7iYonnnZiehjQ2aOODOE7l449MERbVai1iBuSRO67EVpG3IenkYvDptKSMRj5pZUhENjRlYU1e6aVqu420JTlVfmlmYGFyNCYviJ2ZWZoVrblLm25uFuVMcgJTZp1X5gmWkGzuyeeTfioF6JyCDopkoWcdqmeXilrJ6FCOOpRopD9O6k6luNCJ6V5wUqSpRZd+mqSYnN7iqalFhaplqrasyqpYWXYEqzOlzmpnA0mNKquuiblqa61kQgrsqWreSqqx/8e+eaeSyqIi7bTUVmvttdhmq+223Hbr7bejCCDuuOSWa+656Kar7rrnSjDAu/DGK++89NZr77340vsru/z2224E+QYs8MAEw7uvvwj3627BDDfM8MEJR5zuwg5XbHG9EEusMbkUX+zxxRlvvHHHH5f8cK4ip+wvySa3HHDIKifMsss0Y4xyzDijO3PNPBt8c85Aj7tzzzzDHPS6QxNNs9FHTwyw0lAPwHTT/0IQNdRTU11u0ld/nLXWQj/dddE/g50y12Nb/LXZaKft8Npgt+32ycyafbTccxMMt9Z45y3w3lT37Xe+qEnGruDxzihxalU/ULHiETNuLuI+k7i44f9Ii013j5Fjri7l70Ius+dOW/32hxpLvrXmBYuOsOocs6436pfndrjsA7u+Muk64/437Z3bnrnpDeuuMO+NO/A48KML/7nvLzP/OvKTQ0+49Ls7X7rjp1sevHu1c1889sdr3zvxm1eYOvWro986+fzCHrb7s3vfPPjfK9895/ePMLL1+DKe3c6Hv/fZb4DPM5++4IfA9hWwfvxrIAH9tz/1STCBD8wdAy8oNfYlboMXlF/oQChBEXbwgByMnQLnJcAUmrCFHDTh4FhYNrZ5cIY2q5sLb4hDGuowhjzs4Qd/GMIgCnGERCyhEY8IOAxS8IgVZE8Kk2cfKI4viQ2UIRPAaxi3JQqxiXcDoBXtVbgVOlB/YzTgb9ZnRhWKL40axCIVQ/A/+sExgFwU1wvFeMchrjF8T8xfA/oYxz8Kko5sfCMh71XGDJZPkYvMoSH7V8VDLiCS15Nj9do4P0hiUl6NDCQlGfBJRoLrlKhMpSpXycpWuvKVsIylLGdJy1ra8pa4zKUud8nLXvryl8AMpjCHScxiGvOYyEymMpfJzGY685nQjKY0p0nNalrzmtjMpja3yc1uevOb4AynOMdJhwQAACH5BAUUAAQALDIAMgCcAJwAAAP/KLrcTjDKSWt0OFsIuv9gKI5kaZ6Ztq1s6iorKs90/apsTt1pbP/AIA+mK16Gj41wyWwan8ikpUmtRp/GaMNn7Xq3WJ2Wwf2arWHxmDg9u6np3JpdeduX8da8fO8j83xXSn6EQ4CDa4GFi2CHO3uIjJJkjo+JkZOTlZZjipmFmxNzAp6ffqESo6Wmd6hHl22sjK4ckLGyoLSqmLh9tAS7t72+urZ1QL+LycacNcuEz528M9HErsHHP9WtxbDZNtt24YbTMuNu5zerJulm7S7rJe9e8zjfzt2n+VrxJPVo+wQJo/GvSsFG9wgGFLeQ3EBqDdFFVFcOxUEnE1/0G3GR/0lHOs0UXss10ltIiCX1peRX8cRHIS83iniJLVRNUcgyfonZkp1Oej/tnTT3K87NSkdfgSuaJukhp8ByMsUCNQ/UIFPDVDXKDKe2rFC6IhWrFB/YIlubkq319awak5uuSnWrB+5Yu2VF0pUpBZXctnt7jhqMl63KhMMIU3z4hm9ixY4xMn6sGENkj4IpVyaVuctlzdImn/kMWiDixp1L/z08VPVm0lhTuw59WqLo2YNhz22NO7dsOL9789ANmLfwwlGhBT8Obzke58wtQ499O/qf6bu9WvddHWj37RqxF9cOHrky8ZvTs/wOkH2IwPDjy59Pv779+/jz69/Pv7////8ABijggAQWaOCBCCao4FQDNOjggxBGKOGEFFZooYQrBKDhhhx26OGHIIYo4ogfXmjiiSim6GCGJLbo4oswaqjijDTSyGKMOOYYY4089ljhjToGKWSJPhZpJJBDJimkkUz2iKSSUO7Y5JQqPhnllSRSqeWJVmLpJZFbhjlhl1+WKaOYaEJIpplfpulmg2uyieWbbsYpZ5R0pmnnnUrmieaefA7pp5iABhrkoGEWamiOiG6p6KJSNjrlo5C+KCmVlFba4qWTbqCpl5w2memnIvLIkwVB6mdqUBh6qqOqNZ5aQar5rbpSiqMGAKuNrEaY664zykoBrfjZ6lesruYIbJX/vaqZLI7L4trsg7/WiuytKFZb7LXH8orqq9Z6222wz8YYbbbTrlgujOdymS6c677YronCTkDsfcbaxO2w4G4rrr7/2tsvvvvGVbAE99qXr8EBIzywwgc7srDDyoZLLrbufluxv6EOUFTC9XWsLi0g0ycyvCQ/HPLJH6tsMsu/lDzfyR7H7PLMMKe8McEit7wzxD3b/PPKQesMrcWh+kxqnzm7sjSeTaPyNJQ0Kz31oVGHcnWSVQu9tY5dG/01jmE7PTbYWW9yNtpFm712pDQ3HMHbZEf8lN0E0A03sxjTG6/eIU4sMd6AW4q3VYQXvunhXMkNgeKLOw6I4I9DPiLlGZMnbnngjKsl+ealdq6V5qB7iDnin5f+YQIAIfkEBRQABAAsMgAyAJwAnAAAA/84utxOMMpJa3Q4Wyi6/2AojmRpnpm2rWzqKisqz3T9qmxO3Wls/8AgD6YrXoaPjXDJbBqfyKSlSa1Gn8Zow2fterdYnZbB/ZqtYfGYOD27qencml1525fx1rx87yPzfFdKfoRDgINrgYWLYIc7e4iMkmSOj4mRk5OVlmOKmYWbE3MDnp9+oRKjpaZ3qEeXbayMrhyQsbKgtKqYuH20BLu3vb66tnVAv4vJxpw1y4TPnbwz0cSuwcc/1a3FsNk223bhhtMy427nN6sm6WbtLusl717zON/O3af5WvEk9Wj7BAmj8a9KwUb3CAYUt5DcQGoN0UVUVw7FQScTX/QbcZH/SUc6zRReyzXSW0iIJfWl5FfxxEchLzeKeIktVE1RyDJ+idmSnU56P+2dNPcrzs1KR1+BK5om6SGnwHIyxQI1D9QgU8NUNcoMp7asULoiFasUH9giW5uSrfX1rBqTm65KdasH7li7ZUXSlSkFldy2e3uOGoyXrcqEwwhTfPiGb2LFjjEyfqwYQ2SPgilXJpW5y2XN0iaf+QxaIOLGnUv/PTxU9WbSWFO7Dn1aoujZg2HPbY07t2w4v3vz0A2Yt/DCUaEFPw5vOR7nzC1Dj307+p/pu71a910daPftGrEX1w4euTLxm9Oz/A6QfYjA8OPLn0+/vv37+PPr38+/v////wAGKOCABBZo4IEIJqjgVAE06OCDEEYo4YQUVmihhMQBoOGGHHbo4YcghsjhhSSWaOKJDmYo4oostqghijDGGKOKLtZo44sy5qgjhTTe6OOKOwYpZAA9/mikh0MmKWORRzYJgJJQnsikk0ZGaeWFU1Lp45VcTpilljZ2KeaDX4Lp4pholmkmi2iOqeaaIrYp5ptwgihnl3TWieSdV+ap54h8WunnnzgGCuWghBoaJaJ/KnooeoTW6KiSjOo5aZKV1pnjL5tCp1+nroBaG4ufLkmLqMaJWOqMp5rqXoerwsipq6OuGCuKs7L6Koe3StmqrrWqmh+qmxCbipG9mpirrP+eDktrKMbmVWOyJS6La7P4RXuItsn5SC2J1vq664bfYvkrs+NqWK6F4SqL7X3c5sHtketW2G6179oXbxzzIusssNA+S56N9fJ47rXpAlCwlweLG2yIC7fJU7aXkhnUhxGnebGHGbu5Maz/Vkzkx7yGXPHE8IrcIMr6qjzySgSbfCnL9bn8sl/+UqwyTZHeaDPPPUvqMtBBt/gzyUVvOTTSSYe5NMxNr3k01FGDOTXOVWv6NNZZS721TV3DaXO/YZu5bxpkl63l2WGkrbaTbGPh9ttHxv3E3HT/aLcReOfts8CV9O230AAXC7i0gxOOLiqCJ87m4dtC3q3jThceuOQElP+YAAAh+QQFFAAEACwyADIAnACcAAAD/xi63E4wyklrdDhbOLr/YCiOZGmKWcpsbEuoMHvOdG17sOruVJ7Kt6Aw6NPwjq/iYzNsOkvKJXIXbQCfWGx1NaVuFdesWPgFd13lQHjMpqXP6PK6TSe94ay7pc6HyvEbehV9hCGCgBOHE4WMHYqIEI8RjYySiJYElIWYeJiahJxwnp98oWejpHSmXaipbKtTra5isEiys1p/kIm6g7hjtUe3v03BPMM0uxTFvcpJX3M1zhLM0NORzYtD1xxDxl7We9vc1Vvcz+ZM49flVefIM+ftUe/Z1OvT80r14b5C8t7sQYJ3AiAZgZcQZsLnTF8RfunE/SMXsJ8zgiYMElHYSf9hE403vsWxqG0iu4oRp2EsAdKGyBYrSbSs8TKPR4bKHPqA6E6dyXwoe16LOWKmG46ibv5sGJQeN6IijM6oGUhpkHMdSe6CGgJrUq0Drd7wegppWbDdlpIFl/KiWBtrY5ll9VZaXGFz5aJdqPZu1b1Z25a86petUJV1kxUeKXhr4niLYaaZTFmKP03RjlbePDkzIc8nOIt+3Ae0idGonUrE7HNj6tc6WlMy7Qe2bcvLSNG2c7v3gt1tgKPw7Vv4GOMgiBeX3Qj5B+W9nWOR7gi6bepOsFu/zpyR9u2vsX/srhn8aPE47x00f578Z/eh2bdfPRv+afmi0fed1BQ/VzH/3/lXmX6E0eeSgAPaV0eACP6XBXaRRSjhhBRWaOGFGGao4YYcdujhhyCGKOKIJJZo4okopqjiimQB4OKLMMYo44w01mjjjTMSKMCOPPbo449ABinkkDgWaeSROOpI5JJMNonkk1BGqaSTVFYZ5ZVY3jillVx2meWXSG7p5Zhkgmmmi2KWqeaZbBqZ5ppwtilnjG/GaeecbNZ55554Yqknn4D2eeSfgRYqaI2EGqrooS8muiijkDr6KKSCSjoppXNaeimmeSq46aec2qgpqKH66SmpqJYKwKipqjroqa3yKVWSsP64oaknSVmrj7deOauWu/bYq665QgmhhrgCRexl/1UOayxFy+bGpbNP/ipqsDxSGya0zxropLavFlsttjuC6ya343rbpLlFWosouQKwS6u426rLpLzA0hsus1Tie62+59q7pL/vAtwuvATT6K7CCCPrK7r18vutw9Hm9LDARCacI8T7SmulxjIuvDHGQ4JMJ8cBS7wuxa6GjPK9LLcMo8i2xiwzmi8PbPPNNPO6s8w9C/tzy0FnO7SrRZd7tKpJx7t0qU2bzGjUT4fadKxYn2xw1lwfvHXXYDP8ddhkN5pz2WhfjTbQZ68dttpuM9123De7PDbddZvJatZUk4x3xbsk6/Hfa/atMuGCWww4f4gXPrfYhzferbKTDy554hmBXxz55R0rXvlgnGvO1OJphS665+luTncCADs="
              },
              null,
              4
              /* STYLE */
            )
          ], true)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 错误处理 "),
        $data.isError ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "uqrcode-error",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.onClick && $options.onClick(...args))
        }, [
          vue.renderSlot(_ctx.$slots, "error", { error: $data.error }, () => [
            vue.createElementVNode(
              "text",
              { class: "uqrcode-error-message" },
              vue.toDisplayString($data.error.errMsg),
              1
              /* TEXT */
            )
          ], true)
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" H5保存提示 ")
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$3 = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["render", _sfc_render$v], ["__scopeId", "data-v-42fcb7aa"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode.vue"]]);
  const uniShare = new UniShare();
  const _sfc_main$v = {
    components: {
      uqrcode: __easycom_0$3
    },
    onBackPress({ from }) {
      if (from == "backbutton") {
        this.$nextTick(function() {
          uniShare.hide();
        });
        return uniShare.isShow;
      }
    },
    onLoad() {
      this.version = plus.runtime.version;
    },
    computed: {
      uniStarterConfig() {
        return getApp().globalData.config;
      },
      agreements() {
        if (!config.agreements) {
          return [];
        }
        let { serviceUrl, privacyUrl } = config.agreements;
        return [
          {
            url: serviceUrl,
            title: "用户服务协议"
          },
          {
            url: privacyUrl,
            title: "隐私政策条款"
          }
        ];
      }
    },
    data() {
      return {
        version: "V1.0.0",
        year: "2020",
        about: {}
      };
    },
    created() {
      this.about = this.uniStarterConfig.about;
      uni.setNavigationBarTitle({
        title: this.$t("about.about") + " " + this.about.appName
      });
      this.year = new Date().getFullYear();
    },
    onNavigationBarButtonTap() {
      let {
        download,
        appName,
        slogan,
        logo
      } = this.about;
      uniShare.show({
        content: {
          //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
          type: 0,
          href: download,
          title: appName,
          summary: slogan,
          imageUrl: logo + "?x-oss-process=image/resize,m_fill,h_100,w_100"
          //压缩图片解决，在ios端分享图过大导致的图片失效问题
        },
        menus: [
          {
            "img": "/static/app-plus/sharemenu/wechatfriend.png",
            "text": this.$t("common.wechatFriends"),
            "share": {
              "provider": "weixin",
              "scene": "WXSceneSession"
            }
          },
          {
            "img": "/static/app-plus/sharemenu/wechatmoments.png",
            "text": this.$t("common.wechatBbs"),
            "share": {
              "provider": "weixin",
              "scene": "WXSceneTimeline"
            }
          },
          {
            "img": "/static/app-plus/sharemenu/weibo.png",
            "text": this.$t("common.weibo"),
            "share": {
              "provider": "sinaweibo"
            }
          },
          {
            "img": "/static/app-plus/sharemenu/qq.png",
            "text": "QQ",
            "share": {
              "provider": "qq"
            }
          },
          {
            "img": "/static/app-plus/sharemenu/copyurl.png",
            "text": this.$t("common.copy"),
            "share": "copyurl"
          },
          {
            "img": "/static/app-plus/sharemenu/more.png",
            "text": this.$t("common.more"),
            "share": "shareSystem"
          }
        ],
        cancelText: this.$t("common.cancelShare")
      }, (e2) => {
        formatAppLog("log", "at pages/ucenter/about/about.vue:143", e2);
      });
    },
    methods: {
      navigateTo({
        url,
        title
      }) {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/common/webview/webview?url=" + url + "&title=" + title,
          success: (res) => {
          },
          fail: () => {
          },
          complete: () => {
          }
        });
      }
    }
  };
  function _sfc_render$u(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uqrcode = resolveEasycom(vue.resolveDynamicComponent("uqrcode"), __easycom_0$3);
    return vue.openBlock(), vue.createElementBlock("view", { class: "about" }, [
      vue.createElementVNode("view", { class: "box" }, [
        vue.createElementVNode("image", {
          class: "logoImg",
          src: $data.about.logo
        }, null, 8, ["src"]),
        vue.createElementVNode(
          "text",
          { class: "tip appName" },
          vue.toDisplayString($data.about.appName),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "tip" },
          "Version " + vue.toDisplayString($data.version),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "qrcode" }, [
          vue.createCommentVNode("uqrcode 组件来源，插件Sansnn-uQRCode 链接地址：https://ext.dcloud.net.cn/plugin?id=1287"),
          vue.createVNode(_component_uqrcode, {
            size: 100,
            "canvas-id": "qrcode",
            value: $data.about.download
          }, null, 8, ["value"])
        ]),
        vue.createElementVNode(
          "text",
          { class: "tip" },
          vue.toDisplayString(_ctx.$t("about.sacnQR")) + " " + vue.toDisplayString($data.about.appName) + " " + vue.toDisplayString(_ctx.$t("about.client")),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "copyright" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($options.agreements, (agreement, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "agreement-box",
              key: index
            }, [
              vue.createElementVNode("text", {
                class: "agreement",
                onClick: ($event) => $options.navigateTo(agreement)
              }, "《" + vue.toDisplayString(agreement.title) + "》", 9, ["onClick"]),
              $options.agreements.length - 1 > index ? (vue.openBlock(), vue.createElementBlock(
                "text",
                {
                  key: 0,
                  class: "hint"
                },
                vue.toDisplayString(_ctx.$t("about.and")),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true)
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        vue.createElementVNode(
          "text",
          { class: "hint" },
          "Copyright © " + vue.toDisplayString($data.year),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "hint" },
          vue.toDisplayString($data.about.company),
          1
          /* TEXT */
        )
      ])
    ]);
  }
  const PagesUcenterAboutAbout = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["render", _sfc_render$u], ["__scopeId", "data-v-aa205f0f"], ["__file", "G:/HBuilderProjects/Toby/pages/ucenter/about/about.vue"]]);
  const _imports_0$1 = "/assets/bg_top.84172c45.png";
  const _imports_1$1 = "/assets/app_update_close.91137466.png";
  const localFilePathKey = "UNI_ADMIN_UPGRADE_CENTER_LOCAL_FILE_PATH";
  const platform_iOS = "iOS";
  let downloadTask = null;
  let openSchemePromise;
  function compare(v1 = "0", v2 = "0") {
    v1 = String(v1).split(".");
    v2 = String(v2).split(".");
    const minVersionLens = Math.min(v1.length, v2.length);
    let result = 0;
    for (let i2 = 0; i2 < minVersionLens; i2++) {
      const curV1 = Number(v1[i2]);
      const curV2 = Number(v2[i2]);
      if (curV1 > curV2) {
        result = 1;
        break;
      } else if (curV1 < curV2) {
        result = -1;
        break;
      }
    }
    if (result === 0 && v1.length !== v2.length) {
      const v1BiggerThenv2 = v1.length > v2.length;
      const maxLensVersion = v1BiggerThenv2 ? v1 : v2;
      for (let i2 = minVersionLens; i2 < maxLensVersion.length; i2++) {
        const curVersion = Number(maxLensVersion[i2]);
        if (curVersion > 0) {
          v1BiggerThenv2 ? result = 1 : result = -1;
          break;
        }
      }
    }
    return result;
  }
  const _sfc_main$u = {
    data() {
      return {
        // 从之前下载安装
        installForBeforeFilePath: "",
        // 安装
        installed: false,
        installing: false,
        // 下载
        downloadSuccess: false,
        downloading: false,
        downLoadPercent: 0,
        downloadedSize: 0,
        packageFileSize: 0,
        tempFilePath: "",
        // 要安装的本地包地址
        // 默认安装包信息
        title: "更新日志",
        contents: "",
        is_mandatory: false,
        // 可自定义属性
        subTitle: "发现新版本",
        downLoadBtnTextiOS: "立即跳转更新",
        downLoadBtnText: "立即下载更新",
        downLoadingText: "安装包下载中，请稍后"
      };
    },
    onLoad({
      local_storage_key
    }) {
      if (!local_storage_key) {
        formatAppLog("error", "at uni_modules/uni-upgrade-center-app/pages/upgrade-popup.vue:149", "local_storage_key为空，请检查后重试");
        uni.navigateBack();
        return;
      }
      const localPackageInfo = uni.getStorageSync(local_storage_key);
      if (!localPackageInfo) {
        formatAppLog("error", "at uni_modules/uni-upgrade-center-app/pages/upgrade-popup.vue:156", "安装包信息为空，请检查后重试");
        uni.navigateBack();
        return;
      }
      const requiredKey = ["version", "url", "type"];
      for (let key in localPackageInfo) {
        if (requiredKey.indexOf(key) !== -1 && !localPackageInfo[key]) {
          formatAppLog("error", "at uni_modules/uni-upgrade-center-app/pages/upgrade-popup.vue:164", `参数 ${key} 必填，请检查后重试`);
          uni.navigateBack();
          return;
        }
      }
      Object.assign(this, localPackageInfo);
      this.checkLocalStoragePackage();
    },
    onBackPress() {
      if (this.is_mandatory) {
        return true;
      }
      downloadTask && downloadTask.abort();
    },
    onHide() {
      openSchemePromise = null;
    },
    computed: {
      isWGT() {
        return this.type === "wgt";
      },
      isiOS() {
        return !this.isWGT ? this.platform.includes(platform_iOS) : false;
      },
      isAppStore() {
        return this.isiOS || !this.isiOS && !this.isWGT && this.url.indexOf(".apk") === -1;
      }
    },
    methods: {
      checkLocalStoragePackage() {
        const localFilePathRecord = uni.getStorageSync(localFilePathKey);
        if (localFilePathRecord) {
          const {
            version,
            savedFilePath,
            installed
          } = localFilePathRecord;
          if (!installed && compare(version, this.version) === 0) {
            this.downloadSuccess = true;
            this.installForBeforeFilePath = savedFilePath;
            this.tempFilePath = savedFilePath;
          } else {
            this.deleteSavedFile(savedFilePath);
          }
        }
      },
      async closeUpdate() {
        if (this.downloading) {
          if (this.is_mandatory) {
            return uni.showToast({
              title: "下载中，请稍后……",
              icon: "none",
              duration: 500
            });
          }
          uni.showModal({
            title: "是否取消下载？",
            cancelText: "否",
            confirmText: "是",
            success: (res) => {
              if (res.confirm) {
                downloadTask && downloadTask.abort();
                uni.navigateBack();
              }
            }
          });
          return;
        }
        if (this.downloadSuccess && this.tempFilePath) {
          await this.saveFile(this.tempFilePath, this.version);
          uni.navigateBack();
          return;
        }
        uni.navigateBack();
      },
      updateApp() {
        this.checkStoreScheme().catch(() => {
          this.downloadPackage();
        });
      },
      // 跳转应用商店
      checkStoreScheme() {
        const storeList = (this.store_list || []).filter((item) => item.enable);
        if (storeList && storeList.length) {
          storeList.sort((cur, next) => next.priority - cur.priority).map((item) => item.scheme).reduce((promise, cur, curIndex) => {
            openSchemePromise = (promise || (promise = Promise.reject())).catch(() => {
              return new Promise((resolve, reject) => {
                plus.runtime.openURL(cur, (err) => {
                  reject(err);
                });
              });
            });
            return openSchemePromise;
          }, openSchemePromise);
          return openSchemePromise;
        }
        return Promise.reject();
      },
      downloadPackage() {
        this.downloading = true;
        downloadTask = uni.downloadFile({
          url: this.url,
          success: (res) => {
            if (res.statusCode == 200) {
              this.downloadSuccess = true;
              this.tempFilePath = res.tempFilePath;
              if (this.is_mandatory) {
                this.installPackage();
              }
            }
          },
          complete: () => {
            this.downloading = false;
            this.downLoadPercent = 0;
            this.downloadedSize = 0;
            this.packageFileSize = 0;
            downloadTask = null;
          }
        });
        downloadTask.onProgressUpdate((res) => {
          this.downLoadPercent = res.progress;
          this.downloadedSize = (res.totalBytesWritten / Math.pow(1024, 2)).toFixed(2);
          this.packageFileSize = (res.totalBytesExpectedToWrite / Math.pow(1024, 2)).toFixed(2);
        });
      },
      installPackage() {
        if (this.isWGT) {
          this.installing = true;
        }
        plus.runtime.install(this.tempFilePath, {
          force: false
        }, async (res) => {
          this.installing = false;
          this.installed = true;
          if (this.isWGT) {
            if (this.is_mandatory) {
              uni.showLoading({
                icon: "none",
                title: "安装成功，正在重启……"
              });
              setTimeout(() => {
                uni.hideLoading();
                this.restart();
              }, 1e3);
            }
          } else {
            const localFilePathRecord = uni.getStorageSync(localFilePathKey);
            uni.setStorageSync(localFilePathKey, {
              ...localFilePathRecord,
              installed: true
            });
          }
        }, async (err) => {
          if (this.installForBeforeFilePath) {
            await this.deleteSavedFile(this.installForBeforeFilePath);
            this.installForBeforeFilePath = "";
          }
          this.installing = false;
          this.installed = false;
          uni.showModal({
            title: "更新失败，请重新下载",
            content: err.message,
            showCancel: false
          });
        });
        if (!this.isWGT && !this.is_mandatory) {
          uni.navigateBack();
        }
      },
      restart() {
        this.installed = false;
        plus.runtime.restart();
      },
      saveFile(tempFilePath, version) {
        return new Promise((resolve, reject) => {
          uni.saveFile({
            tempFilePath,
            success({
              savedFilePath
            }) {
              uni.setStorageSync(localFilePathKey, {
                version,
                savedFilePath
              });
            },
            complete() {
              resolve();
            }
          });
        });
      },
      deleteSavedFile(filePath) {
        uni.removeStorageSync(localFilePathKey);
        return uni.removeSavedFile({
          filePath
        });
      },
      jumpToAppStore() {
        plus.runtime.openURL(this.url);
      }
    }
  };
  function _sfc_render$t(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "mask flex-center" }, [
      vue.createElementVNode("view", { class: "content botton-radius" }, [
        vue.createElementVNode("view", { class: "content-top" }, [
          vue.createElementVNode(
            "text",
            { class: "content-top-text" },
            vue.toDisplayString($data.title),
            1
            /* TEXT */
          ),
          vue.createElementVNode("image", {
            class: "content-top",
            style: { "top": "0" },
            width: "100%",
            height: "100%",
            src: _imports_0$1
          })
        ]),
        vue.createElementVNode("view", { class: "content-header" }),
        vue.createElementVNode("view", { class: "content-body" }, [
          vue.createElementVNode("view", { class: "title" }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.subTitle),
              1
              /* TEXT */
            ),
            vue.createCommentVNode(' <text style="padding-left:20rpx;font-size: 0.5em;color: #666;">v.{{version}}</text> ')
          ]),
          vue.createElementVNode("view", { class: "body" }, [
            vue.createElementVNode("scroll-view", {
              class: "box-des-scroll",
              "scroll-y": "true"
            }, [
              vue.createElementVNode(
                "text",
                { class: "box-des" },
                vue.toDisplayString($data.contents),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "footer flex-center" }, [
            $options.isAppStore ? (vue.openBlock(), vue.createElementBlock(
              "button",
              {
                key: 0,
                class: "content-button",
                style: { "border": "none", "color": "#fff" },
                plain: "",
                onClick: _cache[0] || (_cache[0] = (...args) => $options.jumpToAppStore && $options.jumpToAppStore(...args))
              },
              vue.toDisplayString($data.downLoadBtnTextiOS),
              1
              /* TEXT */
            )) : (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 1 },
              [
                !$data.downloadSuccess ? (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  { key: 0 },
                  [
                    $data.downloading ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "progress-box flex-column"
                    }, [
                      vue.createElementVNode("progress", {
                        class: "progress",
                        "border-radius": "35",
                        percent: $data.downLoadPercent,
                        activeColor: "#3DA7FF",
                        "show-info": "",
                        "stroke-width": "10"
                      }, null, 8, ["percent"]),
                      vue.createElementVNode("view", { style: { "width": "100%", "font-size": "28rpx", "display": "flex", "justify-content": "space-around" } }, [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString($data.downLoadingText),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          null,
                          "(" + vue.toDisplayString($data.downloadedSize) + "/" + vue.toDisplayString($data.packageFileSize) + "M)",
                          1
                          /* TEXT */
                        )
                      ])
                    ])) : (vue.openBlock(), vue.createElementBlock(
                      "button",
                      {
                        key: 1,
                        class: "content-button",
                        style: { "border": "none", "color": "#fff" },
                        plain: "",
                        onClick: _cache[1] || (_cache[1] = (...args) => $options.updateApp && $options.updateApp(...args))
                      },
                      vue.toDisplayString($data.downLoadBtnText),
                      1
                      /* TEXT */
                    ))
                  ],
                  64
                  /* STABLE_FRAGMENT */
                )) : $data.downloadSuccess && !$data.installed ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 1,
                  class: "content-button",
                  style: { "border": "none", "color": "#fff" },
                  plain: "",
                  loading: $data.installing,
                  disabled: $data.installing,
                  onClick: _cache[2] || (_cache[2] = (...args) => $options.installPackage && $options.installPackage(...args))
                }, vue.toDisplayString($data.installing ? "正在安装……" : "下载完成，立即安装"), 9, ["loading", "disabled"])) : vue.createCommentVNode("v-if", true),
                $data.installed && $options.isWGT ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 2,
                  class: "content-button",
                  style: { "border": "none", "color": "#fff" },
                  plain: "",
                  onClick: _cache[3] || (_cache[3] = (...args) => $options.restart && $options.restart(...args))
                }, " 安装完毕，点击重启 ")) : vue.createCommentVNode("v-if", true)
              ],
              64
              /* STABLE_FRAGMENT */
            ))
          ])
        ]),
        !$data.is_mandatory ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          class: "close-img",
          src: _imports_1$1,
          onClick: _cache[4] || (_cache[4] = vue.withModifiers((...args) => $options.closeUpdate && $options.closeUpdate(...args), ["stop"]))
        })) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const Uni_modulesUniUpgradeCenterAppPagesUpgradePopup = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["render", _sfc_render$t], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-upgrade-center-app/pages/upgrade-popup.vue"]]);
  const _imports_0 = "/static/h5/download-app/ios.png";
  const _imports_1 = "/static/h5/download-app/android.png";
  const _sfc_main$t = {
    computed: {
      uniStarterConfig() {
        return getApp().globalData.config;
      }
    },
    data() {
      return {
        about: {},
        code: "",
        isIos: "",
        showMask: false,
        downloadUrl: {
          "ios": "",
          "android": ""
        }
      };
    },
    created() {
      this.about = this.uniStarterConfig.about;
      this.downloadUrl = this.uniStarterConfig.download;
      this.year = new Date().getFullYear();
      var userAgent = navigator.userAgent;
      var ua = userAgent.toLowerCase();
      this.isWeixin = ua.indexOf("micromessenger") != -1;
      this.isIos = !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    },
    onLoad({
      code
    }) {
      this.code = code;
      document.getElementById("openApp").style.display = "none";
      document.getElementsByTagName("body")[0].style = "";
    },
    methods: {
      download() {
        if (this.code) {
          uni.setClipboardData({
            data: this.code,
            complete: (e2) => {
              formatAppLog("log", "at pages/ucenter/invite/invite.vue:66", e2);
              uni.hideToast();
              document.getElementById("#clipboard").style.top = "-999px";
              uni.hideKeyboard();
            }
          });
        }
        if (this.isIos) {
          window.location.href = this.downloadUrl.ios;
        } else {
          if (this.isWeixin) {
            this.showMask = true;
          } else {
            window.location.href = this.downloadUrl.android;
          }
        }
      }
    }
  };
  function _sfc_render$s(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "about" }, [
      vue.createElementVNode("view", { class: "box" }, [
        vue.createElementVNode("image", {
          class: "logoImg",
          src: $data.about.logo
        }, null, 8, ["src"]),
        vue.createElementVNode(
          "text",
          { class: "tip appName" },
          vue.toDisplayString($data.about.appName),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "tip" },
          vue.toDisplayString($data.about.slogan),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", {
          onClick: _cache[0] || (_cache[0] = (...args) => $options.download && $options.download(...args)),
          id: "download"
        }, [
          $data.isIos ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 0,
            class: "icon",
            src: _imports_0,
            mode: "widthFix"
          })) : (vue.openBlock(), vue.createElementBlock("image", {
            key: 1,
            class: "icon",
            src: _imports_1,
            mode: "widthFix"
          })),
          vue.createElementVNode(
            "text",
            { class: "download-text" },
            vue.toDisplayString(_ctx.$t("invite.download")),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode(
          "text",
          { class: "tip" },
          "version " + vue.toDisplayString($data.about.version),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "copyright" }, [
        vue.createElementVNode(
          "text",
          { class: "hint" },
          vue.toDisplayString($data.about.company),
          1
          /* TEXT */
        )
      ]),
      $data.showMask ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "mask"
      }, [
        vue.createElementVNode("image", {
          src: "/static/h5/download-app/openImg.png",
          mode: "widthFix"
        })
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesUcenterInviteInvite = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$s], ["__file", "G:/HBuilderProjects/Toby/pages/ucenter/invite/invite.vue"]]);
  const _sfc_main$s = {
    name: "uniFormsItem",
    options: {
      virtualHost: true
    },
    provide() {
      return {
        uniFormItem: this
      };
    },
    inject: {
      form: {
        from: "uniForm",
        default: null
      }
    },
    props: {
      // 表单校验规则
      rules: {
        type: Array,
        default() {
          return null;
        }
      },
      // 表单域的属性名，在使用校验规则时必填
      name: {
        type: [String, Array],
        default: ""
      },
      required: {
        type: Boolean,
        default: false
      },
      label: {
        type: String,
        default: ""
      },
      // label的宽度 ，默认 80
      labelWidth: {
        type: [String, Number],
        default: ""
      },
      // label 居中方式，默认 left 取值 left/center/right
      labelAlign: {
        type: String,
        default: ""
      },
      // 强制显示错误信息
      errorMessage: {
        type: [String, Boolean],
        default: ""
      },
      // 1.4.0 弃用，统一使用 form 的校验时机
      // validateTrigger: {
      // 	type: String,
      // 	default: ''
      // },
      // 1.4.0 弃用，统一使用 form 的label 位置
      // labelPosition: {
      // 	type: String,
      // 	default: ''
      // },
      // 1.4.0 以下属性已经废弃，请使用  #label 插槽代替
      leftIcon: String,
      iconColor: {
        type: String,
        default: "#606266"
      }
    },
    data() {
      return {
        errMsg: "",
        userRules: null,
        localLabelAlign: "left",
        localLabelWidth: "65px",
        localLabelPos: "left",
        border: false,
        isFirstBorder: false
      };
    },
    computed: {
      // 处理错误信息
      msg() {
        return this.errorMessage || this.errMsg;
      }
    },
    watch: {
      // 规则发生变化通知子组件更新
      "form.formRules"(val) {
        this.init();
      },
      "form.labelWidth"(val) {
        this.localLabelWidth = this._labelWidthUnit(val);
      },
      "form.labelPosition"(val) {
        this.localLabelPos = this._labelPosition();
      },
      "form.labelAlign"(val) {
      }
    },
    created() {
      this.init(true);
      if (this.name && this.form) {
        this.$watch(
          () => {
            const val = this.form._getDataValue(this.name, this.form.localData);
            return val;
          },
          (value, oldVal) => {
            const isEqual2 = this.form._isEqual(value, oldVal);
            if (!isEqual2) {
              const val = this.itemSetValue(value);
              this.onFieldChange(val, false);
            }
          },
          {
            immediate: false
          }
        );
      }
    },
    unmounted() {
      this.__isUnmounted = true;
      this.unInit();
    },
    methods: {
      /**
       * 外部调用方法
       * 设置规则 ，主要用于小程序自定义检验规则
       * @param {Array} rules 规则源数据
       */
      setRules(rules2 = null) {
        this.userRules = rules2;
        this.init(false);
      },
      // 兼容老版本表单组件
      setValue() {
      },
      /**
       * 外部调用方法
       * 校验数据
       * @param {any} value 需要校验的数据
       * @param {boolean} 是否立即校验
       * @return {Array|null} 校验内容
       */
      async onFieldChange(value, formtrigger = true) {
        const {
          formData,
          localData,
          errShowType,
          validateCheck,
          validateTrigger,
          _isRequiredField,
          _realName
        } = this.form;
        const name = _realName(this.name);
        if (!value) {
          value = this.form.formData[name];
        }
        const ruleLen = this.itemRules.rules && this.itemRules.rules.length;
        if (!this.validator || !ruleLen || ruleLen === 0)
          return;
        const isRequiredField2 = _isRequiredField(this.itemRules.rules || []);
        let result = null;
        if (validateTrigger === "bind" || formtrigger) {
          result = await this.validator.validateUpdate(
            {
              [name]: value
            },
            formData
          );
          if (!isRequiredField2 && (value === void 0 || value === "")) {
            result = null;
          }
          if (result && result.errorMessage) {
            if (errShowType === "undertext") {
              this.errMsg = !result ? "" : result.errorMessage;
            }
            if (errShowType === "toast") {
              uni.showToast({
                title: result.errorMessage || "校验错误",
                icon: "none"
              });
            }
            if (errShowType === "modal") {
              uni.showModal({
                title: "提示",
                content: result.errorMessage || "校验错误"
              });
            }
          } else {
            this.errMsg = "";
          }
          validateCheck(result ? result : null);
        } else {
          this.errMsg = "";
        }
        return result ? result : null;
      },
      /**
       * 初始组件数据
       */
      init(type = false) {
        const {
          validator: validator2,
          formRules,
          childrens,
          formData,
          localData,
          _realName,
          labelWidth,
          _getDataValue,
          _setDataValue
        } = this.form || {};
        this.localLabelAlign = this._justifyContent();
        this.localLabelWidth = this._labelWidthUnit(labelWidth);
        this.localLabelPos = this._labelPosition();
        this.form && type && childrens.push(this);
        if (!validator2 || !formRules)
          return;
        if (!this.form.isFirstBorder) {
          this.form.isFirstBorder = true;
          this.isFirstBorder = true;
        }
        if (this.group) {
          if (!this.group.isFirstBorder) {
            this.group.isFirstBorder = true;
            this.isFirstBorder = true;
          }
        }
        this.border = this.form.border;
        const name = _realName(this.name);
        const itemRule = this.userRules || this.rules;
        if (typeof formRules === "object" && itemRule) {
          formRules[name] = {
            rules: itemRule
          };
          validator2.updateSchema(formRules);
        }
        const itemRules = formRules[name] || {};
        this.itemRules = itemRules;
        this.validator = validator2;
        this.itemSetValue(_getDataValue(this.name, localData));
      },
      unInit() {
        if (this.form) {
          const {
            childrens,
            formData,
            _realName
          } = this.form;
          childrens.forEach((item, index) => {
            if (item === this) {
              this.form.childrens.splice(index, 1);
              delete formData[_realName(item.name)];
            }
          });
        }
      },
      // 设置item 的值
      itemSetValue(value) {
        const name = this.form._realName(this.name);
        const rules2 = this.itemRules.rules || [];
        const val = this.form._getValue(name, value, rules2);
        this.form._setDataValue(name, this.form.formData, val);
        return val;
      },
      /**
       * 移除该表单项的校验结果
       */
      clearValidate() {
        this.errMsg = "";
      },
      // 是否显示星号
      _isRequired() {
        return this.required;
      },
      // 处理对齐方式
      _justifyContent() {
        if (this.form) {
          const {
            labelAlign
          } = this.form;
          let labelAli = this.labelAlign ? this.labelAlign : labelAlign;
          if (labelAli === "left")
            return "flex-start";
          if (labelAli === "center")
            return "center";
          if (labelAli === "right")
            return "flex-end";
        }
        return "flex-start";
      },
      // 处理 label宽度单位 ,继承父元素的值
      _labelWidthUnit(labelWidth) {
        return this.num2px(this.labelWidth ? this.labelWidth : labelWidth || (this.label ? 65 : "auto"));
      },
      // 处理 label 位置
      _labelPosition() {
        if (this.form)
          return this.form.labelPosition || "left";
        return "left";
      },
      /**
       * 触发时机
       * @param {Object} rule 当前规则内时机
       * @param {Object} itemRlue 当前组件时机
       * @param {Object} parentRule 父组件时机
       */
      isTrigger(rule, itemRlue, parentRule) {
        if (rule === "submit" || !rule) {
          if (rule === void 0) {
            if (itemRlue !== "bind") {
              if (!itemRlue) {
                return parentRule === "" ? "bind" : "submit";
              }
              return "submit";
            }
            return "bind";
          }
          return "submit";
        }
        return "bind";
      },
      num2px(num) {
        if (typeof num === "number") {
          return `${num}px`;
        }
        return num;
      }
    }
  };
  function _sfc_render$r(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["uni-forms-item", ["is-direction-" + $data.localLabelPos, $data.border ? "uni-forms-item--border" : "", $data.border && $data.isFirstBorder ? "is-first-border" : ""]])
      },
      [
        vue.renderSlot(_ctx.$slots, "label", {}, () => [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["uni-forms-item__label", { "no-label": !$props.label && !$props.required }]),
              style: vue.normalizeStyle({ width: $data.localLabelWidth, justifyContent: $data.localLabelAlign })
            },
            [
              $props.required ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                class: "is-required"
              }, "*")) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($props.label),
                1
                /* TEXT */
              )
            ],
            6
            /* CLASS, STYLE */
          )
        ], true),
        vue.createElementVNode("view", { class: "uni-forms-item__content" }, [
          vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["uni-forms-item__error", { "msg--active": $options.msg }])
            },
            [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($options.msg),
                1
                /* TEXT */
              )
            ],
            2
            /* CLASS */
          )
        ])
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$r], ["__scopeId", "data-v-462874dd"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.vue"]]);
  const ERR_MSG_OK = "chooseAndUploadFile:ok";
  const ERR_MSG_FAIL = "chooseAndUploadFile:fail";
  function chooseImage(opts) {
    const {
      count,
      sizeType = ["original", "compressed"],
      sourceType,
      extension
    } = opts;
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count,
        sizeType,
        sourceType,
        extension,
        success(res) {
          resolve(normalizeChooseAndUploadFileRes(res, "image"));
        },
        fail(res) {
          reject({
            errMsg: res.errMsg.replace("chooseImage:fail", ERR_MSG_FAIL)
          });
        }
      });
    });
  }
  function chooseVideo(opts) {
    const {
      camera,
      compressed,
      maxDuration,
      sourceType,
      extension
    } = opts;
    return new Promise((resolve, reject) => {
      uni.chooseVideo({
        camera,
        compressed,
        maxDuration,
        sourceType,
        extension,
        success(res) {
          const {
            tempFilePath,
            duration,
            size,
            height,
            width
          } = res;
          resolve(normalizeChooseAndUploadFileRes({
            errMsg: "chooseVideo:ok",
            tempFilePaths: [tempFilePath],
            tempFiles: [
              {
                name: res.tempFile && res.tempFile.name || "",
                path: tempFilePath,
                size,
                type: res.tempFile && res.tempFile.type || "",
                width,
                height,
                duration,
                fileType: "video",
                cloudPath: ""
              }
            ]
          }, "video"));
        },
        fail(res) {
          reject({
            errMsg: res.errMsg.replace("chooseVideo:fail", ERR_MSG_FAIL)
          });
        }
      });
    });
  }
  function chooseAll(opts) {
    const {
      count,
      extension
    } = opts;
    return new Promise((resolve, reject) => {
      let chooseFile = uni.chooseFile;
      if (typeof wx !== "undefined" && typeof wx.chooseMessageFile === "function") {
        chooseFile = wx.chooseMessageFile;
      }
      if (typeof chooseFile !== "function") {
        return reject({
          errMsg: ERR_MSG_FAIL + " 请指定 type 类型，该平台仅支持选择 image 或 video。"
        });
      }
      chooseFile({
        type: "all",
        count,
        extension,
        success(res) {
          resolve(normalizeChooseAndUploadFileRes(res));
        },
        fail(res) {
          reject({
            errMsg: res.errMsg.replace("chooseFile:fail", ERR_MSG_FAIL)
          });
        }
      });
    });
  }
  function normalizeChooseAndUploadFileRes(res, fileType) {
    res.tempFiles.forEach((item, index) => {
      if (!item.name) {
        item.name = item.path.substring(item.path.lastIndexOf("/") + 1);
      }
      if (fileType) {
        item.fileType = fileType;
      }
      item.cloudPath = Date.now() + "_" + index + item.name.substring(item.name.lastIndexOf("."));
    });
    if (!res.tempFilePaths) {
      res.tempFilePaths = res.tempFiles.map((file) => file.path);
    }
    return res;
  }
  function uploadCloudFiles(files, max = 5, onUploadProgress) {
    files = JSON.parse(JSON.stringify(files));
    const len = files.length;
    let count = 0;
    let self2 = this;
    return new Promise((resolve) => {
      while (count < max) {
        next();
      }
      function next() {
        let cur = count++;
        if (cur >= len) {
          !files.find((item) => !item.url && !item.errMsg) && resolve(files);
          return;
        }
        const fileItem = files[cur];
        const index = self2.files.findIndex((v2) => v2.uuid === fileItem.uuid);
        fileItem.url = "";
        delete fileItem.errMsg;
        Ds.uploadFile({
          filePath: fileItem.path,
          cloudPath: fileItem.cloudPath,
          fileType: fileItem.fileType,
          onUploadProgress: (res) => {
            res.index = index;
            onUploadProgress && onUploadProgress(res);
          }
        }).then((res) => {
          fileItem.url = res.fileID;
          fileItem.index = index;
          if (cur < len) {
            next();
          }
        }).catch((res) => {
          fileItem.errMsg = res.errMsg || res.message;
          fileItem.index = index;
          if (cur < len) {
            next();
          }
        });
      }
    });
  }
  function uploadFiles(choosePromise, {
    onChooseFile,
    onUploadProgress
  }) {
    return choosePromise.then((res) => {
      if (onChooseFile) {
        const customChooseRes = onChooseFile(res);
        if (typeof customChooseRes !== "undefined") {
          return Promise.resolve(customChooseRes).then((chooseRes) => typeof chooseRes === "undefined" ? res : chooseRes);
        }
      }
      return res;
    }).then((res) => {
      if (res === false) {
        return {
          errMsg: ERR_MSG_OK,
          tempFilePaths: [],
          tempFiles: []
        };
      }
      return res;
    });
  }
  function chooseAndUploadFile(opts = {
    type: "all"
  }) {
    if (opts.type === "image") {
      return uploadFiles(chooseImage(opts), opts);
    } else if (opts.type === "video") {
      return uploadFiles(chooseVideo(opts), opts);
    }
    return uploadFiles(chooseAll(opts), opts);
  }
  const get_file_ext = (name) => {
    const last_len = name.lastIndexOf(".");
    const len = name.length;
    return {
      name: name.substring(0, last_len),
      ext: name.substring(last_len + 1, len)
    };
  };
  const get_extname = (fileExtname) => {
    if (!Array.isArray(fileExtname)) {
      let extname = fileExtname.replace(/(\[|\])/g, "");
      return extname.split(",");
    } else {
      return fileExtname;
    }
  };
  const get_files_and_is_max = (res, _extname) => {
    let filePaths = [];
    let files = [];
    if (!_extname || _extname.length === 0) {
      return {
        filePaths,
        files
      };
    }
    res.tempFiles.forEach((v2) => {
      let fileFullName = get_file_ext(v2.name);
      const extname = fileFullName.ext.toLowerCase();
      if (_extname.indexOf(extname) !== -1) {
        files.push(v2);
        filePaths.push(v2.path);
      }
    });
    if (files.length !== res.tempFiles.length) {
      uni.showToast({
        title: `当前选择了${res.tempFiles.length}个文件 ，${res.tempFiles.length - files.length} 个文件格式不正确`,
        icon: "none",
        duration: 5e3
      });
    }
    return {
      filePaths,
      files
    };
  };
  const get_file_info = (filepath) => {
    return new Promise((resolve, reject) => {
      uni.getImageInfo({
        src: filepath,
        success(res) {
          resolve(res);
        },
        fail(err) {
          reject(err);
        }
      });
    });
  };
  const get_file_data = async (files, type = "image") => {
    let fileFullName = get_file_ext(files.name);
    const extname = fileFullName.ext.toLowerCase();
    let filedata = {
      name: files.name,
      uuid: files.uuid,
      extname: extname || "",
      cloudPath: files.cloudPath,
      fileType: files.fileType,
      url: files.path || files.path,
      size: files.size,
      //单位是字节
      image: {},
      path: files.path,
      video: {}
    };
    if (type === "image") {
      const imageinfo = await get_file_info(files.path);
      delete filedata.video;
      filedata.image.width = imageinfo.width;
      filedata.image.height = imageinfo.height;
      filedata.image.location = imageinfo.path;
    } else {
      delete filedata.image;
    }
    return filedata;
  };
  const _sfc_main$r = {
    name: "uploadImage",
    emits: ["uploadFiles", "choose", "delFile"],
    props: {
      filesList: {
        type: Array,
        default() {
          return [];
        }
      },
      disabled: {
        type: Boolean,
        default: false
      },
      disablePreview: {
        type: Boolean,
        default: false
      },
      limit: {
        type: [Number, String],
        default: 9
      },
      imageStyles: {
        type: Object,
        default() {
          return {
            width: "auto",
            height: "auto",
            border: {}
          };
        }
      },
      delIcon: {
        type: Boolean,
        default: true
      },
      readonly: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      styles() {
        let styles = {
          width: "auto",
          height: "auto",
          border: {}
        };
        return Object.assign(styles, this.imageStyles);
      },
      boxStyle() {
        const {
          width = "auto",
          height = "auto"
        } = this.styles;
        let obj = {};
        if (height === "auto") {
          if (width !== "auto") {
            obj.height = this.value2px(width);
            obj["padding-top"] = 0;
          } else {
            obj.height = 0;
          }
        } else {
          obj.height = this.value2px(height);
          obj["padding-top"] = 0;
        }
        if (width === "auto") {
          if (height !== "auto") {
            obj.width = this.value2px(height);
          } else {
            obj.width = "33.3%";
          }
        } else {
          obj.width = this.value2px(width);
        }
        let classles = "";
        for (let i2 in obj) {
          classles += `${i2}:${obj[i2]};`;
        }
        return classles;
      },
      borderStyle() {
        let {
          border
        } = this.styles;
        let obj = {};
        const widthDefaultValue = 1;
        const radiusDefaultValue = 3;
        if (typeof border === "boolean") {
          obj.border = border ? "1px #eee solid" : "none";
        } else {
          let width = border && border.width || widthDefaultValue;
          width = this.value2px(width);
          let radius = border && border.radius || radiusDefaultValue;
          radius = this.value2px(radius);
          obj = {
            "border-width": width,
            "border-style": border && border.style || "solid",
            "border-color": border && border.color || "#eee",
            "border-radius": radius
          };
        }
        let classles = "";
        for (let i2 in obj) {
          classles += `${i2}:${obj[i2]};`;
        }
        return classles;
      }
    },
    methods: {
      uploadFiles(item, index) {
        this.$emit("uploadFiles", item);
      },
      choose() {
        this.$emit("choose");
      },
      delFile(index) {
        this.$emit("delFile", index);
      },
      prviewImage(img, index) {
        let urls = [];
        if (Number(this.limit) === 1 && this.disablePreview && !this.disabled) {
          this.$emit("choose");
        }
        if (this.disablePreview)
          return;
        this.filesList.forEach((i2) => {
          urls.push(i2.url);
        });
        uni.previewImage({
          urls,
          current: index
        });
      },
      value2px(value) {
        if (typeof value === "number") {
          value += "px";
        } else {
          if (value.indexOf("%") === -1) {
            value = value.indexOf("px") !== -1 ? value : value + "px";
          }
        }
        return value;
      }
    }
  };
  function _sfc_render$q(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-file-picker__container" }, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($props.filesList, (item, index) => {
          return vue.openBlock(), vue.createElementBlock(
            "view",
            {
              class: "file-picker__box",
              key: index,
              style: vue.normalizeStyle($options.boxStyle)
            },
            [
              vue.createElementVNode(
                "view",
                {
                  class: "file-picker__box-content",
                  style: vue.normalizeStyle($options.borderStyle)
                },
                [
                  vue.createElementVNode("image", {
                    class: "file-image",
                    src: item.url,
                    mode: "aspectFill",
                    onClick: vue.withModifiers(($event) => $options.prviewImage(item, index), ["stop"])
                  }, null, 8, ["src", "onClick"]),
                  $props.delIcon && !$props.readonly ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "icon-del-box",
                    onClick: vue.withModifiers(($event) => $options.delFile(index), ["stop"])
                  }, [
                    vue.createElementVNode("view", { class: "icon-del" }),
                    vue.createElementVNode("view", { class: "icon-del rotate" })
                  ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                  item.progress && item.progress !== 100 || item.progress === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "file-picker__progress"
                  }, [
                    vue.createElementVNode("progress", {
                      class: "file-picker__progress-item",
                      percent: item.progress === -1 ? 0 : item.progress,
                      "stroke-width": "4",
                      backgroundColor: item.errMsg ? "#ff5a5f" : "#EBEBEB"
                    }, null, 8, ["percent", "backgroundColor"])
                  ])) : vue.createCommentVNode("v-if", true),
                  item.errMsg ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 2,
                    class: "file-picker__mask",
                    onClick: vue.withModifiers(($event) => $options.uploadFiles(item, index), ["stop"])
                  }, " 点击重试 ", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                ],
                4
                /* STYLE */
              )
            ],
            4
            /* STYLE */
          );
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      $props.filesList.length < $props.limit && !$props.readonly ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: "file-picker__box",
          style: vue.normalizeStyle($options.boxStyle)
        },
        [
          vue.createElementVNode(
            "view",
            {
              class: "file-picker__box-content is-add",
              style: vue.normalizeStyle($options.borderStyle),
              onClick: _cache[0] || (_cache[0] = (...args) => $options.choose && $options.choose(...args))
            },
            [
              vue.renderSlot(_ctx.$slots, "default", {}, () => [
                vue.createElementVNode("view", { class: "icon-add" }),
                vue.createElementVNode("view", { class: "icon-add rotate" })
              ], true)
            ],
            4
            /* STYLE */
          )
        ],
        4
        /* STYLE */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const uploadImage = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$q], ["__scopeId", "data-v-bdfc07e0"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-file-picker/components/uni-file-picker/upload-image.vue"]]);
  const _sfc_main$q = {
    name: "uploadFile",
    emits: ["uploadFiles", "choose", "delFile"],
    props: {
      filesList: {
        type: Array,
        default() {
          return [];
        }
      },
      delIcon: {
        type: Boolean,
        default: true
      },
      limit: {
        type: [Number, String],
        default: 9
      },
      showType: {
        type: String,
        default: ""
      },
      listStyles: {
        type: Object,
        default() {
          return {
            // 是否显示边框
            border: true,
            // 是否显示分隔线
            dividline: true,
            // 线条样式
            borderStyle: {}
          };
        }
      },
      readonly: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      list() {
        let files = [];
        this.filesList.forEach((v2) => {
          files.push(v2);
        });
        return files;
      },
      styles() {
        let styles = {
          border: true,
          dividline: true,
          "border-style": {}
        };
        return Object.assign(styles, this.listStyles);
      },
      borderStyle() {
        let {
          borderStyle,
          border
        } = this.styles;
        let obj = {};
        if (!border) {
          obj.border = "none";
        } else {
          let width = borderStyle && borderStyle.width || 1;
          width = this.value2px(width);
          let radius = borderStyle && borderStyle.radius || 5;
          radius = this.value2px(radius);
          obj = {
            "border-width": width,
            "border-style": borderStyle && borderStyle.style || "solid",
            "border-color": borderStyle && borderStyle.color || "#eee",
            "border-radius": radius
          };
        }
        let classles = "";
        for (let i2 in obj) {
          classles += `${i2}:${obj[i2]};`;
        }
        return classles;
      },
      borderLineStyle() {
        let obj = {};
        let {
          borderStyle
        } = this.styles;
        if (borderStyle && borderStyle.color) {
          obj["border-color"] = borderStyle.color;
        }
        if (borderStyle && borderStyle.width) {
          let width = borderStyle && borderStyle.width || 1;
          let style = borderStyle && borderStyle.style || 0;
          if (typeof width === "number") {
            width += "px";
          } else {
            width = width.indexOf("px") ? width : width + "px";
          }
          obj["border-width"] = width;
          if (typeof style === "number") {
            style += "px";
          } else {
            style = style.indexOf("px") ? style : style + "px";
          }
          obj["border-top-style"] = style;
        }
        let classles = "";
        for (let i2 in obj) {
          classles += `${i2}:${obj[i2]};`;
        }
        return classles;
      }
    },
    methods: {
      uploadFiles(item, index) {
        this.$emit("uploadFiles", {
          item,
          index
        });
      },
      choose() {
        this.$emit("choose");
      },
      delFile(index) {
        this.$emit("delFile", index);
      },
      value2px(value) {
        if (typeof value === "number") {
          value += "px";
        } else {
          value = value.indexOf("px") !== -1 ? value : value + "px";
        }
        return value;
      }
    }
  };
  function _sfc_render$p(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-file-picker__files" }, [
      !$props.readonly ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "files-button",
        onClick: _cache[0] || (_cache[0] = (...args) => $options.choose && $options.choose(...args))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(` :class="{'is-text-box':showType === 'list'}" `),
      $options.list.length > 0 ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 1,
          class: "uni-file-picker__lists is-text-box",
          style: vue.normalizeStyle($options.borderStyle)
        },
        [
          vue.createCommentVNode(" ,'is-list-card':showType === 'list-card' "),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($options.list, (item, index) => {
              return vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  class: vue.normalizeClass(["uni-file-picker__lists-box", {
                    "files-border": index !== 0 && $options.styles.dividline
                  }]),
                  key: index,
                  style: vue.normalizeStyle(index !== 0 && $options.styles.dividline && $options.borderLineStyle)
                },
                [
                  vue.createElementVNode("view", { class: "uni-file-picker__item" }, [
                    vue.createCommentVNode(` :class="{'is-text-image':showType === 'list'}" `),
                    vue.createCommentVNode(' 	<view class="files__image is-text-image">\r\n						<image class="header-image" :src="item.logo" mode="aspectFit"></image>\r\n					</view> '),
                    vue.createElementVNode(
                      "view",
                      { class: "files__name" },
                      vue.toDisplayString(item.name),
                      1
                      /* TEXT */
                    ),
                    $props.delIcon && !$props.readonly ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "icon-del-box icon-files",
                      onClick: ($event) => $options.delFile(index)
                    }, [
                      vue.createElementVNode("view", { class: "icon-del icon-files" }),
                      vue.createElementVNode("view", { class: "icon-del rotate" })
                    ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                  ]),
                  item.progress && item.progress !== 100 || item.progress === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "file-picker__progress"
                  }, [
                    vue.createElementVNode("progress", {
                      class: "file-picker__progress-item",
                      percent: item.progress === -1 ? 0 : item.progress,
                      "stroke-width": "4",
                      backgroundColor: item.errMsg ? "#ff5a5f" : "#EBEBEB"
                    }, null, 8, ["percent", "backgroundColor"])
                  ])) : vue.createCommentVNode("v-if", true),
                  item.status === "error" ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "file-picker__mask",
                    onClick: vue.withModifiers(($event) => $options.uploadFiles(item, index), ["stop"])
                  }, " 点击重试 ", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                ],
                6
                /* CLASS, STYLE */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ],
        4
        /* STYLE */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const uploadFile = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$p], ["__scopeId", "data-v-a54939c6"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-file-picker/components/uni-file-picker/upload-file.vue"]]);
  const _sfc_main$p = {
    name: "uniFilePicker",
    components: {
      uploadImage,
      uploadFile
    },
    options: {
      virtualHost: true
    },
    emits: ["select", "success", "fail", "progress", "delete", "update:modelValue", "input"],
    props: {
      modelValue: {
        type: [Array, Object],
        default() {
          return [];
        }
      },
      disabled: {
        type: Boolean,
        default: false
      },
      disablePreview: {
        type: Boolean,
        default: false
      },
      delIcon: {
        type: Boolean,
        default: true
      },
      // 自动上传
      autoUpload: {
        type: Boolean,
        default: true
      },
      // 最大选择个数 ，h5只能限制单选或是多选
      limit: {
        type: [Number, String],
        default: 9
      },
      // 列表样式 grid | list | list-card
      mode: {
        type: String,
        default: "grid"
      },
      // 选择文件类型  image/video/all
      fileMediatype: {
        type: String,
        default: "image"
      },
      // 文件类型筛选
      fileExtname: {
        type: [Array, String],
        default() {
          return [];
        }
      },
      title: {
        type: String,
        default: ""
      },
      listStyles: {
        type: Object,
        default() {
          return {
            // 是否显示边框
            border: true,
            // 是否显示分隔线
            dividline: true,
            // 线条样式
            borderStyle: {}
          };
        }
      },
      imageStyles: {
        type: Object,
        default() {
          return {
            width: "auto",
            height: "auto"
          };
        }
      },
      readonly: {
        type: Boolean,
        default: false
      },
      returnType: {
        type: String,
        default: "array"
      },
      sizeType: {
        type: Array,
        default() {
          return ["original", "compressed"];
        }
      },
      sourceType: {
        type: Array,
        default() {
          return ["album", "camera"];
        }
      }
    },
    data() {
      return {
        files: [],
        localValue: []
      };
    },
    watch: {
      modelValue: {
        handler(newVal, oldVal) {
          this.setValue(newVal, oldVal);
        },
        immediate: true
      }
    },
    computed: {
      filesList() {
        let files = [];
        this.files.forEach((v2) => {
          files.push(v2);
        });
        return files;
      },
      showType() {
        if (this.fileMediatype === "image") {
          return this.mode;
        }
        return "list";
      },
      limitLength() {
        if (this.returnType === "object") {
          return 1;
        }
        if (!this.limit) {
          return 1;
        }
        if (this.limit >= 9) {
          return 9;
        }
        return this.limit;
      }
    },
    created() {
      if (!(Ds.config && Ds.config.provider)) {
        this.noSpace = true;
        Ds.chooseAndUploadFile = chooseAndUploadFile;
      }
      this.form = this.getForm("uniForms");
      this.formItem = this.getForm("uniFormsItem");
      if (this.form && this.formItem) {
        if (this.formItem.name) {
          this.rename = this.formItem.name;
          this.form.inputChildrens.push(this);
        }
      }
    },
    methods: {
      /**
       * 公开用户使用，清空文件
       * @param {Object} index
       */
      clearFiles(index) {
        if (index !== 0 && !index) {
          this.files = [];
          this.$nextTick(() => {
            this.setEmit();
          });
        } else {
          this.files.splice(index, 1);
        }
        this.$nextTick(() => {
          this.setEmit();
        });
      },
      /**
       * 公开用户使用，继续上传
       */
      upload() {
        let files = [];
        this.files.forEach((v2, index) => {
          if (v2.status === "ready" || v2.status === "error") {
            files.push(Object.assign({}, v2));
          }
        });
        return this.uploadFiles(files);
      },
      async setValue(newVal, oldVal) {
        const newData = async (v2) => {
          const reg = /cloud:\/\/([\w.]+\/?)\S*/;
          let url = "";
          if (v2.fileID) {
            url = v2.fileID;
          } else {
            url = v2.url;
          }
          if (reg.test(url)) {
            v2.fileID = url;
            v2.url = await this.getTempFileURL(url);
          }
          if (v2.url)
            v2.path = v2.url;
          return v2;
        };
        if (this.returnType === "object") {
          if (newVal) {
            await newData(newVal);
          } else {
            newVal = {};
          }
        } else {
          if (!newVal)
            newVal = [];
          for (let i2 = 0; i2 < newVal.length; i2++) {
            let v2 = newVal[i2];
            await newData(v2);
          }
        }
        this.localValue = newVal;
        if (this.form && this.formItem && !this.is_reset) {
          this.is_reset = false;
          this.formItem.setValue(this.localValue);
        }
        let filesData = Object.keys(newVal).length > 0 ? newVal : [];
        this.files = [].concat(filesData);
      },
      /**
       * 选择文件
       */
      choose() {
        if (this.disabled)
          return;
        if (this.files.length >= Number(this.limitLength) && this.showType !== "grid" && this.returnType === "array") {
          uni.showToast({
            title: `您最多选择 ${this.limitLength} 个文件`,
            icon: "none"
          });
          return;
        }
        this.chooseFiles();
      },
      /**
       * 选择文件并上传
       */
      chooseFiles() {
        const _extname = get_extname(this.fileExtname);
        Ds.chooseAndUploadFile({
          type: this.fileMediatype,
          compressed: false,
          sizeType: this.sizeType,
          sourceType: this.sourceType,
          // TODO 如果为空，video 有问题
          extension: _extname.length > 0 ? _extname : void 0,
          count: this.limitLength - this.files.length,
          //默认9
          onChooseFile: this.chooseFileCallback,
          onUploadProgress: (progressEvent) => {
            this.setProgress(progressEvent, progressEvent.index);
          }
        }).then((result) => {
          this.setSuccessAndError(result.tempFiles);
        }).catch((err) => {
          formatAppLog("log", "at uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.vue:371", "选择失败", err);
        });
      },
      /**
       * 选择文件回调
       * @param {Object} res
       */
      async chooseFileCallback(res) {
        const _extname = get_extname(this.fileExtname);
        const is_one = Number(this.limitLength) === 1 && this.disablePreview && !this.disabled || this.returnType === "object";
        if (is_one) {
          this.files = [];
        }
        let {
          filePaths,
          files
        } = get_files_and_is_max(res, _extname);
        if (!(_extname && _extname.length > 0)) {
          filePaths = res.tempFilePaths;
          files = res.tempFiles;
        }
        let currentData = [];
        for (let i2 = 0; i2 < files.length; i2++) {
          if (this.limitLength - this.files.length <= 0)
            break;
          files[i2].uuid = Date.now();
          let filedata = await get_file_data(files[i2], this.fileMediatype);
          filedata.progress = 0;
          filedata.status = "ready";
          this.files.push(filedata);
          currentData.push({
            ...filedata,
            file: files[i2]
          });
        }
        this.$emit("select", {
          tempFiles: currentData,
          tempFilePaths: filePaths
        });
        res.tempFiles = files;
        if (!this.autoUpload || this.noSpace) {
          res.tempFiles = [];
        }
      },
      /**
       * 批传
       * @param {Object} e
       */
      uploadFiles(files) {
        files = [].concat(files);
        return uploadCloudFiles.call(this, files, 5, (res) => {
          this.setProgress(res, res.index, true);
        }).then((result) => {
          this.setSuccessAndError(result);
          return result;
        }).catch((err) => {
          formatAppLog("log", "at uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.vue:437", err);
        });
      },
      /**
       * 成功或失败
       */
      async setSuccessAndError(res, fn) {
        let successData = [];
        let errorData = [];
        let tempFilePath = [];
        let errorTempFilePath = [];
        for (let i2 = 0; i2 < res.length; i2++) {
          const item = res[i2];
          const index = item.uuid ? this.files.findIndex((p2) => p2.uuid === item.uuid) : item.index;
          if (index === -1 || !this.files)
            break;
          if (item.errMsg === "request:fail") {
            this.files[index].url = item.path;
            this.files[index].status = "error";
            this.files[index].errMsg = item.errMsg;
            errorData.push(this.files[index]);
            errorTempFilePath.push(this.files[index].url);
          } else {
            this.files[index].errMsg = "";
            this.files[index].fileID = item.url;
            const reg = /cloud:\/\/([\w.]+\/?)\S*/;
            if (reg.test(item.url)) {
              this.files[index].url = await this.getTempFileURL(item.url);
            } else {
              this.files[index].url = item.url;
            }
            this.files[index].status = "success";
            this.files[index].progress += 1;
            successData.push(this.files[index]);
            tempFilePath.push(this.files[index].fileID);
          }
        }
        if (successData.length > 0) {
          this.setEmit();
          this.$emit("success", {
            tempFiles: this.backObject(successData),
            tempFilePaths: tempFilePath
          });
        }
        if (errorData.length > 0) {
          this.$emit("fail", {
            tempFiles: this.backObject(errorData),
            tempFilePaths: errorTempFilePath
          });
        }
      },
      /**
       * 获取进度
       * @param {Object} progressEvent
       * @param {Object} index
       * @param {Object} type
       */
      setProgress(progressEvent, index, type) {
        this.files.length;
        const percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
        let idx = index;
        if (!type) {
          idx = this.files.findIndex((p2) => p2.uuid === progressEvent.tempFile.uuid);
        }
        if (idx === -1 || !this.files[idx])
          return;
        this.files[idx].progress = percentCompleted - 1;
        this.$emit("progress", {
          index: idx,
          progress: parseInt(percentCompleted),
          tempFile: this.files[idx]
        });
      },
      /**
       * 删除文件
       * @param {Object} index
       */
      delFile(index) {
        this.$emit("delete", {
          tempFile: this.files[index],
          tempFilePath: this.files[index].url
        });
        this.files.splice(index, 1);
        this.$nextTick(() => {
          this.setEmit();
        });
      },
      /**
       * 获取文件名和后缀
       * @param {Object} name
       */
      getFileExt(name) {
        const last_len = name.lastIndexOf(".");
        const len = name.length;
        return {
          name: name.substring(0, last_len),
          ext: name.substring(last_len + 1, len)
        };
      },
      /**
       * 处理返回事件
       */
      setEmit() {
        let data2 = [];
        if (this.returnType === "object") {
          data2 = this.backObject(this.files)[0];
          this.localValue = data2 ? data2 : null;
        } else {
          data2 = this.backObject(this.files);
          if (!this.localValue) {
            this.localValue = [];
          }
          this.localValue = [...data2];
        }
        this.$emit("update:modelValue", this.localValue);
      },
      /**
       * 处理返回参数
       * @param {Object} files
       */
      backObject(files) {
        let newFilesData = [];
        files.forEach((v2) => {
          newFilesData.push({
            extname: v2.extname,
            fileType: v2.fileType,
            image: v2.image,
            name: v2.name,
            path: v2.path,
            size: v2.size,
            fileID: v2.fileID,
            url: v2.url
          });
        });
        return newFilesData;
      },
      async getTempFileURL(fileList) {
        fileList = {
          fileList: [].concat(fileList)
        };
        const urls = await Ds.getTempFileURL(fileList);
        return urls.fileList[0].tempFileURL || "";
      },
      /**
       * 获取父元素实例
       */
      getForm(name = "uniForms") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  function _sfc_render$o(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_upload_image = vue.resolveComponent("upload-image");
    const _component_upload_file = vue.resolveComponent("upload-file");
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-file-picker" }, [
      $props.title ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-file-picker__header"
      }, [
        vue.createElementVNode(
          "text",
          { class: "file-title" },
          vue.toDisplayString($props.title),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "file-count" },
          vue.toDisplayString($options.filesList.length) + "/" + vue.toDisplayString($options.limitLength),
          1
          /* TEXT */
        )
      ])) : vue.createCommentVNode("v-if", true),
      $props.fileMediatype === "image" && $options.showType === "grid" ? (vue.openBlock(), vue.createBlock(_component_upload_image, {
        key: 1,
        readonly: $props.readonly,
        "image-styles": $props.imageStyles,
        "files-list": $options.filesList,
        limit: $options.limitLength,
        disablePreview: $props.disablePreview,
        delIcon: $props.delIcon,
        onUploadFiles: $options.uploadFiles,
        onChoose: $options.choose,
        onDelFile: $options.delFile
      }, {
        default: vue.withCtx(() => [
          vue.renderSlot(_ctx.$slots, "default", {}, () => [
            vue.createElementVNode("view", { class: "is-add" }, [
              vue.createElementVNode("view", { class: "icon-add" }),
              vue.createElementVNode("view", { class: "icon-add rotate" })
            ])
          ], true)
        ]),
        _: 3
        /* FORWARDED */
      }, 8, ["readonly", "image-styles", "files-list", "limit", "disablePreview", "delIcon", "onUploadFiles", "onChoose", "onDelFile"])) : vue.createCommentVNode("v-if", true),
      $props.fileMediatype !== "image" || $options.showType !== "grid" ? (vue.openBlock(), vue.createBlock(_component_upload_file, {
        key: 2,
        readonly: $props.readonly,
        "list-styles": $props.listStyles,
        "files-list": $options.filesList,
        showType: $options.showType,
        delIcon: $props.delIcon,
        onUploadFiles: $options.uploadFiles,
        onChoose: $options.choose,
        onDelFile: $options.delFile
      }, {
        default: vue.withCtx(() => [
          vue.renderSlot(_ctx.$slots, "default", {}, () => [
            vue.createElementVNode("button", {
              type: "primary",
              size: "mini"
            }, "选择文件")
          ], true)
        ]),
        _: 3
        /* FORWARDED */
      }, 8, ["readonly", "list-styles", "files-list", "showType", "delIcon", "onUploadFiles", "onChoose", "onDelFile"])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$o], ["__scopeId", "data-v-6223573f"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.vue"]]);
  var pattern = {
    email: /^\S+?@\S+?\.\S+?$/,
    idcard: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    url: new RegExp(
      "^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$",
      "i"
    )
  };
  const FORMAT_MAPPING = {
    "int": "integer",
    "bool": "boolean",
    "double": "number",
    "long": "number",
    "password": "string"
    // "fileurls": 'array'
  };
  function formatMessage(args, resources = "") {
    var defaultMessage = ["label"];
    defaultMessage.forEach((item) => {
      if (args[item] === void 0) {
        args[item] = "";
      }
    });
    let str = resources;
    for (let key in args) {
      let reg = new RegExp("{" + key + "}");
      str = str.replace(reg, args[key]);
    }
    return str;
  }
  function isEmptyValue(value, type) {
    if (value === void 0 || value === null) {
      return true;
    }
    if (typeof value === "string" && !value) {
      return true;
    }
    if (Array.isArray(value) && !value.length) {
      return true;
    }
    if (type === "object" && !Object.keys(value).length) {
      return true;
    }
    return false;
  }
  const types = {
    integer(value) {
      return types.number(value) && parseInt(value, 10) === value;
    },
    string(value) {
      return typeof value === "string";
    },
    number(value) {
      if (isNaN(value)) {
        return false;
      }
      return typeof value === "number";
    },
    "boolean": function(value) {
      return typeof value === "boolean";
    },
    "float": function(value) {
      return types.number(value) && !types.integer(value);
    },
    array(value) {
      return Array.isArray(value);
    },
    object(value) {
      return typeof value === "object" && !types.array(value);
    },
    date(value) {
      return value instanceof Date;
    },
    timestamp(value) {
      if (!this.integer(value) || Math.abs(value).toString().length > 16) {
        return false;
      }
      return true;
    },
    file(value) {
      return typeof value.url === "string";
    },
    email(value) {
      return typeof value === "string" && !!value.match(pattern.email) && value.length < 255;
    },
    url(value) {
      return typeof value === "string" && !!value.match(pattern.url);
    },
    pattern(reg, value) {
      try {
        return new RegExp(reg).test(value);
      } catch (e2) {
        return false;
      }
    },
    method(value) {
      return typeof value === "function";
    },
    idcard(value) {
      return typeof value === "string" && !!value.match(pattern.idcard);
    },
    "url-https"(value) {
      return this.url(value) && value.startsWith("https://");
    },
    "url-scheme"(value) {
      return value.startsWith("://");
    },
    "url-web"(value) {
      return false;
    }
  };
  class RuleValidator {
    constructor(message) {
      this._message = message;
    }
    async validateRule(fieldKey, fieldValue, value, data2, allData) {
      var result = null;
      let rules2 = fieldValue.rules;
      let hasRequired = rules2.findIndex((item) => {
        return item.required;
      });
      if (hasRequired < 0) {
        if (value === null || value === void 0) {
          return result;
        }
        if (typeof value === "string" && !value.length) {
          return result;
        }
      }
      var message = this._message;
      if (rules2 === void 0) {
        return message["default"];
      }
      for (var i2 = 0; i2 < rules2.length; i2++) {
        let rule = rules2[i2];
        let vt2 = this._getValidateType(rule);
        Object.assign(rule, {
          label: fieldValue.label || `["${fieldKey}"]`
        });
        if (RuleValidatorHelper[vt2]) {
          result = RuleValidatorHelper[vt2](rule, value, message);
          if (result != null) {
            break;
          }
        }
        if (rule.validateExpr) {
          let now = Date.now();
          let resultExpr = rule.validateExpr(value, allData, now);
          if (resultExpr === false) {
            result = this._getMessage(rule, rule.errorMessage || this._message["default"]);
            break;
          }
        }
        if (rule.validateFunction) {
          result = await this.validateFunction(rule, value, data2, allData, vt2);
          if (result !== null) {
            break;
          }
        }
      }
      if (result !== null) {
        result = message.TAG + result;
      }
      return result;
    }
    async validateFunction(rule, value, data2, allData, vt2) {
      let result = null;
      try {
        let callbackMessage = null;
        const res = await rule.validateFunction(rule, value, allData || data2, (message) => {
          callbackMessage = message;
        });
        if (callbackMessage || typeof res === "string" && res || res === false) {
          result = this._getMessage(rule, callbackMessage || res, vt2);
        }
      } catch (e2) {
        result = this._getMessage(rule, e2.message, vt2);
      }
      return result;
    }
    _getMessage(rule, message, vt2) {
      return formatMessage(rule, message || rule.errorMessage || this._message[vt2] || message["default"]);
    }
    _getValidateType(rule) {
      var result = "";
      if (rule.required) {
        result = "required";
      } else if (rule.format) {
        result = "format";
      } else if (rule.arrayType) {
        result = "arrayTypeFormat";
      } else if (rule.range) {
        result = "range";
      } else if (rule.maximum !== void 0 || rule.minimum !== void 0) {
        result = "rangeNumber";
      } else if (rule.maxLength !== void 0 || rule.minLength !== void 0) {
        result = "rangeLength";
      } else if (rule.pattern) {
        result = "pattern";
      } else if (rule.validateFunction) {
        result = "validateFunction";
      }
      return result;
    }
  }
  const RuleValidatorHelper = {
    required(rule, value, message) {
      if (rule.required && isEmptyValue(value, rule.format || typeof value)) {
        return formatMessage(rule, rule.errorMessage || message.required);
      }
      return null;
    },
    range(rule, value, message) {
      const {
        range,
        errorMessage
      } = rule;
      let list = new Array(range.length);
      for (let i2 = 0; i2 < range.length; i2++) {
        const item = range[i2];
        if (types.object(item) && item.value !== void 0) {
          list[i2] = item.value;
        } else {
          list[i2] = item;
        }
      }
      let result = false;
      if (Array.isArray(value)) {
        result = new Set(value.concat(list)).size === list.length;
      } else {
        if (list.indexOf(value) > -1) {
          result = true;
        }
      }
      if (!result) {
        return formatMessage(rule, errorMessage || message["enum"]);
      }
      return null;
    },
    rangeNumber(rule, value, message) {
      if (!types.number(value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      let {
        minimum,
        maximum,
        exclusiveMinimum,
        exclusiveMaximum
      } = rule;
      let min = exclusiveMinimum ? value <= minimum : value < minimum;
      let max = exclusiveMaximum ? value >= maximum : value > maximum;
      if (minimum !== void 0 && min) {
        return formatMessage(rule, rule.errorMessage || message["number"][exclusiveMinimum ? "exclusiveMinimum" : "minimum"]);
      } else if (maximum !== void 0 && max) {
        return formatMessage(rule, rule.errorMessage || message["number"][exclusiveMaximum ? "exclusiveMaximum" : "maximum"]);
      } else if (minimum !== void 0 && maximum !== void 0 && (min || max)) {
        return formatMessage(rule, rule.errorMessage || message["number"].range);
      }
      return null;
    },
    rangeLength(rule, value, message) {
      if (!types.string(value) && !types.array(value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      let min = rule.minLength;
      let max = rule.maxLength;
      let val = value.length;
      if (min !== void 0 && val < min) {
        return formatMessage(rule, rule.errorMessage || message["length"].minLength);
      } else if (max !== void 0 && val > max) {
        return formatMessage(rule, rule.errorMessage || message["length"].maxLength);
      } else if (min !== void 0 && max !== void 0 && (val < min || val > max)) {
        return formatMessage(rule, rule.errorMessage || message["length"].range);
      }
      return null;
    },
    pattern(rule, value, message) {
      if (!types["pattern"](rule.pattern, value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      return null;
    },
    format(rule, value, message) {
      var customTypes = Object.keys(types);
      var format2 = FORMAT_MAPPING[rule.format] ? FORMAT_MAPPING[rule.format] : rule.format || rule.arrayType;
      if (customTypes.indexOf(format2) > -1) {
        if (!types[format2](value)) {
          return formatMessage(rule, rule.errorMessage || message.typeError);
        }
      }
      return null;
    },
    arrayTypeFormat(rule, value, message) {
      if (!Array.isArray(value)) {
        return formatMessage(rule, rule.errorMessage || message.typeError);
      }
      for (let i2 = 0; i2 < value.length; i2++) {
        const element = value[i2];
        let formatResult = this.format(rule, element, message);
        if (formatResult !== null) {
          return formatResult;
        }
      }
      return null;
    }
  };
  class SchemaValidator extends RuleValidator {
    constructor(schema, options) {
      super(SchemaValidator.message);
      this._schema = schema;
      this._options = options || null;
    }
    updateSchema(schema) {
      this._schema = schema;
    }
    async validate(data2, allData) {
      let result = this._checkFieldInSchema(data2);
      if (!result) {
        result = await this.invokeValidate(data2, false, allData);
      }
      return result.length ? result[0] : null;
    }
    async validateAll(data2, allData) {
      let result = this._checkFieldInSchema(data2);
      if (!result) {
        result = await this.invokeValidate(data2, true, allData);
      }
      return result;
    }
    async validateUpdate(data2, allData) {
      let result = this._checkFieldInSchema(data2);
      if (!result) {
        result = await this.invokeValidateUpdate(data2, false, allData);
      }
      return result.length ? result[0] : null;
    }
    async invokeValidate(data2, all, allData) {
      let result = [];
      let schema = this._schema;
      for (let key in schema) {
        let value = schema[key];
        let errorMessage = await this.validateRule(key, value, data2[key], data2, allData);
        if (errorMessage != null) {
          result.push({
            key,
            errorMessage
          });
          if (!all)
            break;
        }
      }
      return result;
    }
    async invokeValidateUpdate(data2, all, allData) {
      let result = [];
      for (let key in data2) {
        let errorMessage = await this.validateRule(key, this._schema[key], data2[key], data2, allData);
        if (errorMessage != null) {
          result.push({
            key,
            errorMessage
          });
          if (!all)
            break;
        }
      }
      return result;
    }
    _checkFieldInSchema(data2) {
      var keys = Object.keys(data2);
      var keys2 = Object.keys(this._schema);
      if (new Set(keys.concat(keys2)).size === keys2.length) {
        return "";
      }
      var noExistFields = keys.filter((key) => {
        return keys2.indexOf(key) < 0;
      });
      var errorMessage = formatMessage({
        field: JSON.stringify(noExistFields)
      }, SchemaValidator.message.TAG + SchemaValidator.message["defaultInvalid"]);
      return [{
        key: "invalid",
        errorMessage
      }];
    }
  }
  function Message() {
    return {
      TAG: "",
      default: "验证错误",
      defaultInvalid: "提交的字段{field}在数据库中并不存在",
      validateFunction: "验证无效",
      required: "{label}必填",
      "enum": "{label}超出范围",
      timestamp: "{label}格式无效",
      whitespace: "{label}不能为空",
      typeError: "{label}类型无效",
      date: {
        format: "{label}日期{value}格式无效",
        parse: "{label}日期无法解析,{value}无效",
        invalid: "{label}日期{value}无效"
      },
      length: {
        minLength: "{label}长度不能少于{minLength}",
        maxLength: "{label}长度不能超过{maxLength}",
        range: "{label}必须介于{minLength}和{maxLength}之间"
      },
      number: {
        minimum: "{label}不能小于{minimum}",
        maximum: "{label}不能大于{maximum}",
        exclusiveMinimum: "{label}不能小于等于{minimum}",
        exclusiveMaximum: "{label}不能大于等于{maximum}",
        range: "{label}必须介于{minimum}and{maximum}之间"
      },
      pattern: {
        mismatch: "{label}格式不匹配"
      }
    };
  }
  SchemaValidator.message = new Message();
  const deepCopy$1 = (val) => {
    return JSON.parse(JSON.stringify(val));
  };
  const typeFilter = (format2) => {
    return format2 === "int" || format2 === "double" || format2 === "number" || format2 === "timestamp";
  };
  const getValue = (key, value, rules2) => {
    const isRuleNumType = rules2.find((val) => val.format && typeFilter(val.format));
    const isRuleBoolType = rules2.find((val) => val.format && val.format === "boolean" || val.format === "bool");
    if (!!isRuleNumType) {
      if (!value && value !== 0) {
        value = null;
      } else {
        value = isNumber$1(Number(value)) ? Number(value) : value;
      }
    }
    if (!!isRuleBoolType) {
      value = isBoolean$1(value) ? value : false;
    }
    return value;
  };
  const setDataValue = (field, formdata, value) => {
    formdata[field] = value;
    return value || "";
  };
  const getDataValue = (field, data2) => {
    return objGet(data2, field);
  };
  const realName = (name, data2 = {}) => {
    const base_name = _basePath(name);
    if (typeof base_name === "object" && Array.isArray(base_name) && base_name.length > 1) {
      const realname = base_name.reduce((a2, b2) => a2 += `#${b2}`, "_formdata_");
      return realname;
    }
    return base_name[0] || name;
  };
  const isRealName = (name) => {
    const reg = /^_formdata_#*/;
    return reg.test(name);
  };
  const rawData = (object = {}, name) => {
    let newData = JSON.parse(JSON.stringify(object));
    let formData = {};
    for (let i2 in newData) {
      let path = name2arr(i2);
      objSet(formData, path, newData[i2]);
    }
    return formData;
  };
  const name2arr = (name) => {
    let field = name.replace("_formdata_#", "");
    field = field.split("#").map((v2) => isNumber$1(v2) ? Number(v2) : v2);
    return field;
  };
  const objSet = (object, path, value) => {
    if (typeof object !== "object")
      return object;
    _basePath(path).reduce((o2, k2, i2, _2) => {
      if (i2 === _2.length - 1) {
        o2[k2] = value;
        return null;
      } else if (k2 in o2) {
        return o2[k2];
      } else {
        o2[k2] = /^[0-9]{1,}$/.test(_2[i2 + 1]) ? [] : {};
        return o2[k2];
      }
    }, object);
    return object;
  };
  function _basePath(path) {
    if (Array.isArray(path))
      return path;
    return path.replace(/\[/g, ".").replace(/\]/g, "").split(".");
  }
  const objGet = (object, path, defaultVal = "undefined") => {
    let newPath = _basePath(path);
    let val = newPath.reduce((o2, k2) => {
      return (o2 || {})[k2];
    }, object);
    return !val || val !== void 0 ? val : defaultVal;
  };
  const isNumber$1 = (num) => {
    return !isNaN(Number(num));
  };
  const isBoolean$1 = (bool) => {
    return typeof bool === "boolean";
  };
  const isRequiredField = (rules2) => {
    let isNoField = false;
    for (let i2 = 0; i2 < rules2.length; i2++) {
      const ruleData = rules2[i2];
      if (ruleData.required) {
        isNoField = true;
        break;
      }
    }
    return isNoField;
  };
  const isEqual = (a2, b2) => {
    if (a2 === b2) {
      return a2 !== 0 || 1 / a2 === 1 / b2;
    }
    if (a2 == null || b2 == null) {
      return a2 === b2;
    }
    var classNameA = toString.call(a2), classNameB = toString.call(b2);
    if (classNameA !== classNameB) {
      return false;
    }
    switch (classNameA) {
      case "[object RegExp]":
      case "[object String]":
        return "" + a2 === "" + b2;
      case "[object Number]":
        if (+a2 !== +a2) {
          return +b2 !== +b2;
        }
        return +a2 === 0 ? 1 / +a2 === 1 / b2 : +a2 === +b2;
      case "[object Date]":
      case "[object Boolean]":
        return +a2 === +b2;
    }
    if (classNameA == "[object Object]") {
      var propsA = Object.getOwnPropertyNames(a2), propsB = Object.getOwnPropertyNames(b2);
      if (propsA.length != propsB.length) {
        return false;
      }
      for (var i2 = 0; i2 < propsA.length; i2++) {
        var propName = propsA[i2];
        if (a2[propName] !== b2[propName]) {
          return false;
        }
      }
      return true;
    }
    if (classNameA == "[object Array]") {
      if (a2.toString() == b2.toString()) {
        return true;
      }
      return false;
    }
  };
  const _sfc_main$o = {
    name: "uniForms",
    emits: ["validate", "submit"],
    options: {
      virtualHost: true
    },
    props: {
      // 即将弃用
      value: {
        type: Object,
        default() {
          return null;
        }
      },
      // vue3 替换 value 属性
      modelValue: {
        type: Object,
        default() {
          return null;
        }
      },
      // 1.4.0 开始将不支持 v-model ，且废弃 value 和 modelValue
      model: {
        type: Object,
        default() {
          return null;
        }
      },
      // 表单校验规则
      rules: {
        type: Object,
        default() {
          return {};
        }
      },
      //校验错误信息提示方式 默认 undertext 取值 [undertext|toast|modal]
      errShowType: {
        type: String,
        default: "undertext"
      },
      // 校验触发器方式 默认 bind 取值 [bind|submit]
      validateTrigger: {
        type: String,
        default: "submit"
      },
      // label 位置，默认 left 取值  top/left
      labelPosition: {
        type: String,
        default: "left"
      },
      // label 宽度
      labelWidth: {
        type: [String, Number],
        default: ""
      },
      // label 居中方式，默认 left 取值 left/center/right
      labelAlign: {
        type: String,
        default: "left"
      },
      border: {
        type: Boolean,
        default: false
      }
    },
    provide() {
      return {
        uniForm: this
      };
    },
    data() {
      return {
        // 表单本地值的记录，不应该与传如的值进行关联
        formData: {},
        formRules: {}
      };
    },
    computed: {
      // 计算数据源变化的
      localData() {
        const localVal = this.model || this.modelValue || this.value;
        if (localVal) {
          return deepCopy$1(localVal);
        }
        return {};
      }
    },
    watch: {
      // 监听数据变化 ,暂时不使用，需要单独赋值
      // localData: {},
      // 监听规则变化
      rules: {
        handler: function(val, oldVal) {
          this.setRules(val);
        },
        deep: true,
        immediate: true
      }
    },
    created() {
      let getbinddata = getApp().$vm.$.appContext.config.globalProperties.binddata;
      if (!getbinddata) {
        getApp().$vm.$.appContext.config.globalProperties.binddata = function(name, value, formName) {
          if (formName) {
            this.$refs[formName].setValue(name, value);
          } else {
            let formVm;
            for (let i2 in this.$refs) {
              const vm = this.$refs[i2];
              if (vm && vm.$options && vm.$options.name === "uniForms") {
                formVm = vm;
                break;
              }
            }
            if (!formVm)
              return formatAppLog("error", "at uni_modules/uni-forms/components/uni-forms/uni-forms.vue:182", "当前 uni-froms 组件缺少 ref 属性");
            formVm.setValue(name, value);
          }
        };
      }
      this.childrens = [];
      this.inputChildrens = [];
      this.setRules(this.rules);
    },
    methods: {
      /**
       * 外部调用方法
       * 设置规则 ，主要用于小程序自定义检验规则
       * @param {Array} rules 规则源数据
       */
      setRules(rules2) {
        this.formRules = Object.assign({}, this.formRules, rules2);
        this.validator = new SchemaValidator(rules2);
      },
      /**
       * 外部调用方法
       * 设置数据，用于设置表单数据，公开给用户使用 ， 不支持在动态表单中使用
       * @param {Object} key
       * @param {Object} value
       */
      setValue(key, value) {
        let example = this.childrens.find((child) => child.name === key);
        if (!example)
          return null;
        this.formData[key] = getValue(key, value, this.formRules[key] && this.formRules[key].rules || []);
        return example.onFieldChange(this.formData[key]);
      },
      /**
       * 外部调用方法
       * 手动提交校验表单
       * 对整个表单进行校验的方法，参数为一个回调函数。
       * @param {Array} keepitem 保留不参与校验的字段
       * @param {type} callback 方法回调
       */
      validate(keepitem, callback) {
        return this.checkAll(this.formData, keepitem, callback);
      },
      /**
       * 外部调用方法
       * 部分表单校验
       * @param {Array|String} props 需要校验的字段
       * @param {Function} 回调函数
       */
      validateField(props = [], callback) {
        props = [].concat(props);
        let invalidFields = {};
        this.childrens.forEach((item) => {
          const name = realName(item.name);
          if (props.indexOf(name) !== -1) {
            invalidFields = Object.assign({}, invalidFields, {
              [name]: this.formData[name]
            });
          }
        });
        return this.checkAll(invalidFields, [], callback);
      },
      /**
       * 外部调用方法
       * 移除表单项的校验结果。传入待移除的表单项的 prop 属性或者 prop 组成的数组，如不传则移除整个表单的校验结果
       * @param {Array|String} props 需要移除校验的字段 ，不填为所有
       */
      clearValidate(props = []) {
        props = [].concat(props);
        this.childrens.forEach((item) => {
          if (props.length === 0) {
            item.errMsg = "";
          } else {
            const name = realName(item.name);
            if (props.indexOf(name) !== -1) {
              item.errMsg = "";
            }
          }
        });
      },
      /**
       * 外部调用方法 ，即将废弃
       * 手动提交校验表单
       * 对整个表单进行校验的方法，参数为一个回调函数。
       * @param {Array} keepitem 保留不参与校验的字段
       * @param {type} callback 方法回调
       */
      submit(keepitem, callback, type) {
        for (let i2 in this.dataValue) {
          const itemData = this.childrens.find((v2) => v2.name === i2);
          if (itemData) {
            if (this.formData[i2] === void 0) {
              this.formData[i2] = this._getValue(i2, this.dataValue[i2]);
            }
          }
        }
        if (!type) {
          formatAppLog("warn", "at uni_modules/uni-forms/components/uni-forms/uni-forms.vue:289", "submit 方法即将废弃，请使用validate方法代替！");
        }
        return this.checkAll(this.formData, keepitem, callback, "submit");
      },
      // 校验所有
      async checkAll(invalidFields, keepitem, callback, type) {
        if (!this.validator)
          return;
        let childrens = [];
        for (let i2 in invalidFields) {
          const item = this.childrens.find((v2) => realName(v2.name) === i2);
          if (item) {
            childrens.push(item);
          }
        }
        if (!callback && typeof keepitem === "function") {
          callback = keepitem;
        }
        let promise;
        if (!callback && typeof callback !== "function" && Promise) {
          promise = new Promise((resolve, reject) => {
            callback = function(valid, invalidFields2) {
              !valid ? resolve(invalidFields2) : reject(valid);
            };
          });
        }
        let results = [];
        let tempFormData = JSON.parse(JSON.stringify(invalidFields));
        for (let i2 in childrens) {
          const child = childrens[i2];
          let name = realName(child.name);
          const result = await child.onFieldChange(tempFormData[name]);
          if (result) {
            results.push(result);
            if (this.errShowType === "toast" || this.errShowType === "modal")
              break;
          }
        }
        if (Array.isArray(results)) {
          if (results.length === 0)
            results = null;
        }
        if (Array.isArray(keepitem)) {
          keepitem.forEach((v2) => {
            let vName = realName(v2);
            let value = getDataValue(v2, this.localData);
            if (value !== void 0) {
              tempFormData[vName] = value;
            }
          });
        }
        if (type === "submit") {
          this.$emit("submit", {
            detail: {
              value: tempFormData,
              errors: results
            }
          });
        } else {
          this.$emit("validate", results);
        }
        let resetFormData = {};
        resetFormData = rawData(tempFormData, this.name);
        callback && typeof callback === "function" && callback(results, resetFormData);
        if (promise && callback) {
          return promise;
        } else {
          return null;
        }
      },
      /**
       * 返回validate事件
       * @param {Object} result
       */
      validateCheck(result) {
        this.$emit("validate", result);
      },
      _getValue: getValue,
      _isRequiredField: isRequiredField,
      _setDataValue: setDataValue,
      _getDataValue: getDataValue,
      _realName: realName,
      _isRealName: isRealName,
      _isEqual: isEqual
    }
  };
  function _sfc_render$n(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-forms" }, [
      vue.createElementVNode("form", null, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ])
    ]);
  }
  const __easycom_4$1 = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$n], ["__scopeId", "data-v-9a1e3c32"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-forms/components/uni-forms/uni-forms.vue"]]);
  const validator = {
    "content": {
      "rules": [
        {
          "required": true
        },
        {
          "format": "string"
        }
      ],
      "label": "留言内容/回复内容"
    },
    "imgs": {
      "rules": [
        {
          "format": "array"
        },
        {
          "arrayType": "file"
        },
        {
          "maxLength": 6
        }
      ],
      "label": "图片列表"
    },
    "contact": {
      "rules": [
        {
          "format": "string"
        }
      ],
      "label": "联系人"
    },
    "mobile": {
      "rules": [
        {
          "format": "string"
        },
        {
          "pattern": "^\\+?[0-9-]{3,20}$"
        }
      ],
      "label": "联系电话"
    }
  };
  formatAppLog("log", "at uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback.vue:29", validator);
  const db$2 = Ds.database();
  const dbCollectionName = "opendb-feedback";
  function getValidator(fields) {
    let result = {};
    for (let key in validator) {
      if (fields.indexOf(key) > -1) {
        result[key] = validator[key];
      }
    }
    return result;
  }
  const _sfc_main$n = {
    data() {
      let formData = {
        "content": "",
        "imgs": [],
        "contact": "",
        "mobile": ""
      };
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      };
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    methods: {
      /**
       * 触发表单提交
       */
      submit() {
        uni.showLoading({
          mask: true
        });
        this.$refs.form.validate().then((res) => {
          this.submitForm(res);
        }).catch(() => {
          uni.hideLoading();
        });
      },
      submitForm(value) {
        db$2.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            icon: "none",
            title: "提交成功"
          });
          this.getOpenerEventChannel().emit("refreshData");
          setTimeout(() => uni.navigateBack(), 500);
        }).catch((err) => {
          uni.showModal({
            content: err.message || "请求服务失败",
            showCancel: false
          });
        }).finally(() => {
          uni.hideLoading();
        });
      }
    }
  };
  function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_file_picker = resolveEasycom(vue.resolveDynamicComponent("uni-file-picker"), __easycom_1);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-container" }, [
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        "validate-trigger": "submit",
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, {
            name: "content",
            label: "留言内容/回复内容",
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  onInput: _cache[0] || (_cache[0] = ($event) => _ctx.binddata("content", $event.detail.value)),
                  class: "uni-textarea-border",
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.content = $event),
                  trim: "right"
                },
                null,
                544
                /* HYDRATE_EVENTS, NEED_PATCH */
              ), [
                [vue.vModelText, $data.formData.content]
              ])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, {
            name: "imgs",
            label: "图片列表"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_file_picker, {
                "file-mediatype": "image",
                limit: 6,
                "return-type": "array",
                modelValue: $data.formData.imgs,
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.formData.imgs = $event)
              }, null, 8, ["modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, {
            name: "contact",
            label: "联系人"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                modelValue: $data.formData.contact,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.contact = $event),
                trim: "both"
              }, null, 8, ["modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, {
            name: "mobile",
            label: "联系电话"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                modelValue: $data.formData.mobile,
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.mobile = $event),
                trim: "both"
              }, null, 8, ["modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createElementVNode("view", { class: "uni-button-group" }, [
            vue.createElementVNode("button", {
              type: "primary",
              class: "uni-button",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.submit && $options.submit(...args))
            }, "提交")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value"])
    ]);
  }
  const Uni_modulesUniFeedbackPagesOpendbFeedbackOpendbFeedback = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$m], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback.vue"]]);
  const popup = {
    data() {
      return {};
    },
    created() {
      this.popup = this.getParent();
    },
    methods: {
      /**
       * 获取父元素实例
       */
      getParent(name = "uniPopup") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  const en = {
    "uni-popup.cancel": "cancel",
    "uni-popup.ok": "ok",
    "uni-popup.placeholder": "pleace enter",
    "uni-popup.title": "Hint",
    "uni-popup.shareTitle": "Share to"
  };
  const zhHans$1 = {
    "uni-popup.cancel": "取消",
    "uni-popup.ok": "确定",
    "uni-popup.placeholder": "请输入",
    "uni-popup.title": "提示",
    "uni-popup.shareTitle": "分享到"
  };
  const zhHant = {
    "uni-popup.cancel": "取消",
    "uni-popup.ok": "確定",
    "uni-popup.placeholder": "請輸入",
    "uni-popup.title": "提示",
    "uni-popup.shareTitle": "分享到"
  };
  const messages$1 = {
    en,
    "zh-Hans": zhHans$1,
    "zh-Hant": zhHant
  };
  const { t } = initVueI18n(messages$1);
  const _sfc_main$m = {
    name: "uniPopupDialog",
    mixins: [popup],
    emits: ["confirm", "close"],
    props: {
      inputType: {
        type: String,
        default: "text"
      },
      value: {
        type: [String, Number],
        default: ""
      },
      placeholder: {
        type: [String, Number],
        default: ""
      },
      type: {
        type: String,
        default: "error"
      },
      mode: {
        type: String,
        default: "base"
      },
      title: {
        type: String,
        default: ""
      },
      content: {
        type: String,
        default: ""
      },
      beforeClose: {
        type: Boolean,
        default: false
      },
      cancelText: {
        type: String,
        default: ""
      },
      confirmText: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        dialogType: "error",
        focus: false,
        val: ""
      };
    },
    computed: {
      okText() {
        return this.confirmText || t("uni-popup.ok");
      },
      closeText() {
        return this.cancelText || t("uni-popup.cancel");
      },
      placeholderText() {
        return this.placeholder || t("uni-popup.placeholder");
      },
      titleText() {
        return this.title || t("uni-popup.title");
      }
    },
    watch: {
      type(val) {
        this.dialogType = val;
      },
      mode(val) {
        if (val === "input") {
          this.dialogType = "info";
        }
      },
      value(val) {
        this.val = val;
      }
    },
    created() {
      this.popup.disableMask();
      if (this.mode === "input") {
        this.dialogType = "info";
        this.val = this.value;
      } else {
        this.dialogType = this.type;
      }
    },
    mounted() {
      this.focus = true;
    },
    methods: {
      /**
       * 点击确认按钮
       */
      onOk() {
        if (this.mode === "input") {
          this.$emit("confirm", this.val);
        } else {
          this.$emit("confirm");
        }
        if (this.beforeClose)
          return;
        this.popup.close();
      },
      /**
       * 点击取消按钮
       */
      closeDialog() {
        this.$emit("close");
        if (this.beforeClose)
          return;
        this.popup.close();
      },
      close() {
        this.popup.close();
      }
    }
  };
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-popup-dialog" }, [
      vue.createElementVNode("view", { class: "uni-dialog-title" }, [
        vue.createElementVNode(
          "text",
          {
            class: vue.normalizeClass(["uni-dialog-title-text", ["uni-popup__" + $data.dialogType]])
          },
          vue.toDisplayString($options.titleText),
          3
          /* TEXT, CLASS */
        )
      ]),
      $props.mode === "base" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-dialog-content"
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.createElementVNode(
            "text",
            { class: "uni-dialog-content-text" },
            vue.toDisplayString($props.content),
            1
            /* TEXT */
          )
        ], true)
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "uni-dialog-content"
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.withDirectives(vue.createElementVNode("input", {
            class: "uni-dialog-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.val = $event),
            type: $props.inputType,
            placeholder: $options.placeholderText,
            focus: $data.focus
          }, null, 8, ["type", "placeholder", "focus"]), [
            [vue.vModelDynamic, $data.val]
          ])
        ], true)
      ])),
      vue.createElementVNode("view", { class: "uni-dialog-button-group" }, [
        vue.createElementVNode("view", {
          class: "uni-dialog-button",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.closeDialog && $options.closeDialog(...args))
        }, [
          vue.createElementVNode(
            "text",
            { class: "uni-dialog-button-text" },
            vue.toDisplayString($options.closeText),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", {
          class: "uni-dialog-button uni-border-left",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.onOk && $options.onOk(...args))
        }, [
          vue.createElementVNode(
            "text",
            { class: "uni-dialog-button-text uni-button-color" },
            vue.toDisplayString($options.okText),
            1
            /* TEXT */
          )
        ])
      ])
    ]);
  }
  const __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$l], ["__scopeId", "data-v-d78c88b7"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue"]]);
  const db$1 = Ds.database();
  db$1.collection("uni-id-users");
  const uniIdCo$9 = Ds.importObject("uni-id-co");
  const _sfc_main$l = {
    emits: ["success"],
    computed: {},
    data() {
      return {};
    },
    methods: {
      async beforeGetphonenumber() {
        return await new Promise((resolve, reject) => {
          uni.showLoading({ mask: true });
          wx.checkSession({
            success() {
              resolve();
              uni.hideLoading();
            },
            fail() {
              wx.login({
                success({
                  code
                }) {
                  Ds.importObject("uni-id-co", {
                    customUI: true
                  }).loginByWeixin({ code }).then((e2) => {
                    resolve();
                  }).catch((e2) => {
                    formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile.vue:46", e2);
                    reject();
                  }).finally((e2) => {
                    uni.hideLoading();
                  });
                },
                fail: (err) => {
                  formatAppLog("error", "at uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile.vue:53", err);
                  reject();
                }
              });
            }
          });
        });
      },
      async bindMobileByMpWeixin(e2) {
        if (e2.detail.errMsg == "getPhoneNumber:ok") {
          await this.beforeGetphonenumber();
          uniIdCo$9.bindMobileByMpWeixin(e2.detail).then((e3) => {
            this.$emit("success");
          }).finally((e3) => {
            this.closeMe();
          });
        } else {
          this.closeMe();
        }
      },
      async open() {
        this.$refs.popup.open();
      },
      closeMe(e2) {
        this.$refs.popup.close();
      }
    }
  };
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1$1);
    return vue.openBlock(), vue.createBlock(
      _component_uni_popup,
      {
        ref: "popup",
        type: "bottom"
      },
      {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "box" }, [
            vue.createElementVNode("text", { class: "headBox" }, "绑定资料"),
            vue.createElementVNode("text", { class: "tip" }, "将一键获取你的手机号码绑定你的个人资料"),
            vue.createElementVNode("view", { class: "btnBox" }, [
              vue.createElementVNode("text", {
                onClick: _cache[0] || (_cache[0] = (...args) => $options.closeMe && $options.closeMe(...args)),
                class: "close"
              }, "关闭"),
              vue.createElementVNode(
                "button",
                {
                  class: "agree uni-btn",
                  type: "primary",
                  "open-type": "getPhoneNumber",
                  onGetphonenumber: _cache[1] || (_cache[1] = (...args) => $options.bindMobileByMpWeixin && $options.bindMobileByMpWeixin(...args))
                },
                "获取",
                32
                /* HYDRATE_EVENTS */
              )
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      },
      512
      /* NEED_PATCH */
    );
  }
  const __easycom_5$1 = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$k], ["__scopeId", "data-v-e0127e04"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile.vue"]]);
  const uniIdCo$8 = Ds.importObject("uni-id-co");
  const _sfc_main$k = {
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    data() {
      return {
        univerifyStyle: {
          authButton: {
            "title": "本机号码一键绑定"
            // 授权按钮文案
          },
          otherLoginButton: {
            "title": "其他号码绑定"
          }
        },
        // userInfo: {
        // 	mobile:'',
        // 	nickname:''
        // },
        hasPwd: false,
        showLoginManage: false,
        //通过页面传参隐藏登录&退出登录按钮
        setNicknameIng: false
      };
    },
    async onShow() {
      this.univerifyStyle.authButton.title = "本机号码一键绑定";
      this.univerifyStyle.otherLoginButton.title = "其他号码绑定";
    },
    async onLoad(e2) {
      if (e2.showLoginManage) {
        this.showLoginManage = true;
      }
      let res = await uniIdCo$8.getAccountInfo();
      this.hasPwd = res.isPasswordSet;
    },
    methods: {
      login() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd",
          complete: (e2) => {
          }
        });
      },
      logout() {
        mutations.logout();
      },
      bindMobileSuccess() {
        mutations.updateUserInfo();
      },
      changePassword() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd",
          complete: (e2) => {
          }
        });
      },
      bindMobile() {
        uni.preLogin({
          provider: "univerify",
          success: this.univerify(),
          //预登录成功
          fail: (res) => {
            formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/userinfo.vue:107", res);
            this.bindMobileBySmsCode();
          }
        });
      },
      univerify() {
        uni.login({
          "provider": "univerify",
          "univerifyStyle": this.univerifyStyle,
          success: async (e2) => {
            uniIdCo$8.bindMobileByUniverify(e2.authResult).then((res) => {
              mutations.updateUserInfo();
            }).catch((e3) => {
              formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/userinfo.vue:130", e3);
            }).finally((e3) => {
              uni.closeAuthView();
            });
          },
          fail: (err) => {
            formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/userinfo.vue:137", err);
            if (err.code == "30002" || err.code == "30001") {
              this.bindMobileBySmsCode();
            }
          }
        });
      },
      bindMobileBySmsCode() {
        uni.navigateTo({
          url: "./bind-mobile/bind-mobile"
        });
      },
      setNickname(nickname) {
        if (nickname) {
          mutations.updateUserInfo({
            nickname
          });
          this.setNicknameIng = false;
          this.$refs.dialog.close();
        } else {
          this.setNicknameIng = true;
          this.$refs.dialog.open();
        }
      },
      deactivate() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate"
        });
      },
      async bindThirdAccount(provider) {
        const uniIdCo2 = Ds.importObject("uni-id-co");
        const bindField = {
          weixin: "wx_openid",
          alipay: "ali_openid",
          apple: "apple_openid",
          qq: "qq_openid"
        }[provider.toLowerCase()];
        if (this.userInfo[bindField]) {
          await uniIdCo2["unbind" + provider]();
          await mutations.updateUserInfo();
        } else {
          uni.login({
            provider: provider.toLowerCase(),
            onlyAuthorize: true,
            success: async (e2) => {
              const res = await uniIdCo2["bind" + provider]({
                code: e2.code
              });
              if (res.errCode) {
                uni.showToast({
                  title: res.errMsg || "绑定失败",
                  duration: 3e3
                });
              }
              await mutations.updateUserInfo();
            },
            fail: async (err) => {
              formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/userinfo.vue:195", err);
              uni.hideLoading();
            }
          });
        }
      }
    }
  };
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_id_pages_avatar = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-avatar"), __easycom_0$7);
    const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$4);
    const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
    const _component_uni_popup_dialog = resolveEasycom(vue.resolveDynamicComponent("uni-popup-dialog"), __easycom_0$2);
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1$1);
    const _component_uni_id_pages_bind_mobile = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-bind-mobile"), __easycom_5$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createElementVNode("view", { class: "avatar" }, [
        vue.createVNode(_component_uni_id_pages_avatar, {
          width: "260rpx",
          height: "260rpx"
        })
      ]),
      vue.createVNode(_component_uni_list, null, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_list_item, {
            class: "item",
            onClick: _cache[0] || (_cache[0] = ($event) => $options.setNickname("")),
            title: "昵称",
            rightText: $options.userInfo.nickname || "未设置",
            link: ""
          }, null, 8, ["rightText"]),
          vue.createVNode(_component_uni_list_item, {
            class: "item",
            onClick: $options.bindMobile,
            title: "手机号",
            rightText: $options.userInfo.mobile || "未绑定",
            link: ""
          }, null, 8, ["onClick", "rightText"]),
          $options.userInfo.email ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 0,
            class: "item",
            title: "电子邮箱",
            rightText: $options.userInfo.email
          }, null, 8, ["rightText"])) : vue.createCommentVNode("v-if", true),
          $data.hasPwd ? (vue.openBlock(), vue.createBlock(_component_uni_list_item, {
            key: 1,
            class: "item",
            onClick: $options.changePassword,
            title: "修改密码",
            link: ""
          }, null, 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_list, { class: "mt10" }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_list_item, {
            onClick: $options.deactivate,
            title: "注销账号",
            link: "navigateTo"
          }, null, 8, ["onClick"])
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "dialog",
          type: "dialog"
        },
        {
          default: vue.withCtx(() => [
            vue.createVNode(_component_uni_popup_dialog, {
              mode: "input",
              value: $options.userInfo.nickname,
              onConfirm: $options.setNickname,
              inputType: $data.setNicknameIng ? "nickname" : "text",
              title: "设置昵称",
              placeholder: "请输入要设置的昵称"
            }, null, 8, ["value", "onConfirm", "inputType"])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      ),
      vue.createVNode(_component_uni_id_pages_bind_mobile, {
        ref: "bind-mobile-by-sms",
        onSuccess: $options.bindMobileSuccess
      }, null, 8, ["onSuccess"]),
      $data.showLoginManage ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 0 },
        [
          $options.userInfo._id ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            onClick: _cache[1] || (_cache[1] = (...args) => $options.logout && $options.logout(...args))
          }, "退出登录")) : (vue.openBlock(), vue.createElementBlock("button", {
            key: 1,
            onClick: _cache[2] || (_cache[2] = (...args) => $options.login && $options.login(...args))
          }, "去登录"))
        ],
        64
        /* STABLE_FRAGMENT */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Uni_modulesUniIdPagesPagesUserinfoUserinfo = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$j], ["__scopeId", "data-v-0be2f605"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/userinfo/userinfo.vue"]]);
  const _sfc_main$j = {
    props: {
      modelValue: String,
      value: String,
      scene: {
        type: String,
        default() {
          return "";
        }
      },
      focus: {
        type: Boolean,
        default() {
          return false;
        }
      }
    },
    computed: {
      val: {
        get() {
          return this.value || this.modelValue;
        },
        set(value) {
          this.$emit("update:modelValue", value);
        }
      }
    },
    data() {
      return {
        focusCaptchaInput: false,
        captchaBase64: "",
        loging: false
      };
    },
    watch: {
      scene: {
        handler(scene) {
          if (scene) {
            this.getImageCaptcha(this.focus);
          } else {
            uni.showToast({
              title: "scene不能为空",
              icon: "none"
            });
          }
        },
        immediate: true
      }
    },
    methods: {
      getImageCaptcha(focus = true) {
        this.loging = true;
        if (focus) {
          this.val = "";
          this.focusCaptchaInput = true;
        }
        const uniIdCo2 = Ds.importObject("uni-captcha-co", {
          customUI: true
        });
        uniIdCo2.getImageCaptcha({
          scene: this.scene
        }).then((result) => {
          this.captchaBase64 = result.captchaBase64;
        }).catch((e2) => {
          uni.showToast({
            title: e2.message,
            icon: "none"
          });
        }).finally((e2) => {
          this.loging = false;
        });
      }
    }
  };
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$a);
    return vue.openBlock(), vue.createElementBlock("view", { class: "captcha-box" }, [
      vue.createElementVNode("view", { class: "captcha-img-box" }, [
        $data.loging ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
          key: 0,
          class: "loding",
          size: "20px",
          color: "#BBB",
          type: "spinner-cycle"
        })) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("image", {
          class: vue.normalizeClass(["captcha-img", { opacity: $data.loging }]),
          onClick: _cache[0] || (_cache[0] = (...args) => $options.getImageCaptcha && $options.getImageCaptcha(...args)),
          src: $data.captchaBase64,
          mode: "widthFix"
        }, null, 10, ["src"])
      ]),
      vue.withDirectives(vue.createElementVNode("input", {
        onBlur: _cache[1] || (_cache[1] = ($event) => $data.focusCaptchaInput = false),
        focus: $data.focusCaptchaInput,
        type: "text",
        class: "captcha",
        inputBorder: false,
        maxlength: "4",
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $options.val = $event),
        placeholder: "请输入验证码"
      }, null, 40, ["focus"]), [
        [vue.vModelText, $options.val]
      ])
    ]);
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$i], ["__scopeId", "data-v-a00179ae"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-captcha/components/uni-captcha/uni-captcha.vue"]]);
  let retryFun = () => formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-agreements/uni-id-pages-agreements.vue:34", "为定义");
  const _sfc_main$i = {
    name: "uni-agreements",
    computed: {
      agreements() {
        if (!config.agreements) {
          return [];
        }
        let { serviceUrl, privacyUrl } = config.agreements;
        return [
          {
            url: serviceUrl,
            title: "用户服务协议"
          },
          {
            url: privacyUrl,
            title: "隐私政策条款"
          }
        ];
      }
    },
    props: {
      scope: {
        type: String,
        default() {
          return "register";
        }
      }
    },
    methods: {
      popupConfirm() {
        this.isAgree = true;
        retryFun();
      },
      popup(Fun) {
        this.needPopupAgreements = true;
        this.$nextTick(() => {
          if (Fun) {
            retryFun = Fun;
          }
          this.$refs.popupAgreement.open();
        });
      },
      navigateTo({
        url,
        title
      }) {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/common/webview/webview?url=" + url + "&title=" + title,
          success: (res) => {
          },
          fail: () => {
          },
          complete: () => {
          }
        });
      },
      hasAnd(agreements, index) {
        return agreements.length - 1 > index;
      },
      setAgree(e2) {
        this.isAgree = !this.isAgree;
        this.$emit("setAgree", this.isAgree);
      }
    },
    created() {
      var _a;
      this.needAgreements = (((_a = config == null ? void 0 : config.agreements) == null ? void 0 : _a.scope) || []).includes(this.scope);
    },
    data() {
      return {
        isAgree: false,
        needAgreements: true,
        needPopupAgreements: false
      };
    }
  };
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup_dialog = resolveEasycom(vue.resolveDynamicComponent("uni-popup-dialog"), __easycom_0$2);
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1$1);
    return $options.agreements.length ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "root"
    }, [
      $data.needAgreements ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 0 },
        [
          vue.createElementVNode(
            "checkbox-group",
            {
              onChange: _cache[0] || (_cache[0] = (...args) => $options.setAgree && $options.setAgree(...args))
            },
            [
              vue.createElementVNode("label", { class: "checkbox-box" }, [
                vue.createElementVNode("checkbox", {
                  checked: $data.isAgree,
                  style: { "transform": "scale(0.5)", "margin-right": "-6px" }
                }, null, 8, ["checked"]),
                vue.createElementVNode("text", { class: "text" }, "同意")
              ])
            ],
            32
            /* HYDRATE_EVENTS */
          ),
          vue.createElementVNode("view", { class: "content" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.agreements, (agreement, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "item",
                  key: index
                }, [
                  vue.createElementVNode("text", {
                    class: "agreement text",
                    onClick: ($event) => $options.navigateTo(agreement)
                  }, vue.toDisplayString(agreement.title), 9, ["onClick"]),
                  $options.hasAnd($options.agreements, index) ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    class: "text and",
                    space: "nbsp"
                  }, " 和 ")) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ],
        64
        /* STABLE_FRAGMENT */
      )) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 弹出式 "),
      $data.needAgreements || $data.needPopupAgreements ? (vue.openBlock(), vue.createBlock(
        _component_uni_popup,
        {
          key: 1,
          ref: "popupAgreement",
          type: "center"
        },
        {
          default: vue.withCtx(() => [
            vue.createVNode(_component_uni_popup_dialog, {
              confirmText: "同意",
              onConfirm: $options.popupConfirm
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { class: "content" }, [
                  vue.createElementVNode("text", { class: "text" }, "请先阅读并同意"),
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($options.agreements, (agreement, index) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        class: "item",
                        key: index
                      }, [
                        vue.createElementVNode("text", {
                          class: "agreement text",
                          onClick: ($event) => $options.navigateTo(agreement)
                        }, vue.toDisplayString(agreement.title), 9, ["onClick"]),
                        $options.hasAnd($options.agreements, index) ? (vue.openBlock(), vue.createElementBlock("text", {
                          key: 0,
                          class: "text and",
                          space: "nbsp"
                        }, " 和 ")) : vue.createCommentVNode("v-if", true)
                      ]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ]),
              _: 1
              /* STABLE */
            }, 8, ["onConfirm"])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )) : vue.createCommentVNode("v-if", true)
    ])) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$h], ["__scopeId", "data-v-40b82fe9"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-agreements/uni-id-pages-agreements.vue"]]);
  const _sfc_main$h = {
    computed: {
      agreements() {
        if (!config.agreements) {
          return [];
        }
        let {
          serviceUrl,
          privacyUrl
        } = config.agreements;
        return [
          {
            url: serviceUrl,
            title: "用户服务协议"
          },
          {
            url: privacyUrl,
            title: "隐私政策条款"
          }
        ];
      },
      agree: {
        get() {
          return this.getParentComponent().agree;
        },
        set(agree) {
          return this.getParentComponent().agree = agree;
        }
      }
    },
    data() {
      return {
        servicesList: [
          {
            "id": "username",
            "text": "账号登录",
            "logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/user.png",
            "path": "/uni_modules/uni-id-pages/pages/login/login-withpwd"
          },
          {
            "id": "smsCode",
            "text": "短信验证码",
            "logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/sms.png",
            "path": "/uni_modules/uni-id-pages/pages/login/login-withoutpwd?type=smsCode"
          },
          {
            "id": "weixin",
            "text": "微信登录",
            "logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/weixin.png"
          },
          {
            "id": "apple",
            "text": "苹果登录",
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/apple.png"
          },
          {
            "id": "univerify",
            "text": "一键登录",
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/univerify.png"
          },
          {
            "id": "taobao",
            "text": "淘宝登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/taobao.png"
          },
          {
            "id": "facebook",
            "text": "脸书登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/facebook.png"
          },
          {
            "id": "alipay",
            "text": "支付宝登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/alipay.png"
          },
          {
            "id": "qq",
            "text": "QQ登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/qq.png"
          },
          {
            "id": "google",
            "text": "谷歌登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/google.png"
          },
          {
            "id": "douyin",
            "text": "抖音登录",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/douyin.png"
          },
          {
            "id": "sinaweibo",
            "text": "新浪微博",
            //暂未提供该登录方式的接口示例
            "logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/sinaweibo.png"
          }
        ],
        univerifyStyle: {
          //一键登录弹出窗的样式配置参数
          "fullScreen": true,
          // 是否全屏显示，true表示全屏模式，false表示非全屏模式，默认值为false。
          "backgroundColor": "#ffffff",
          // 授权页面背景颜色，默认值：#ffffff
          "buttons": {
            // 自定义登录按钮
            "iconWidth": "45px",
            // 图标宽度（高度等比例缩放） 默认值：45px
            "list": []
          },
          "privacyTerms": {
            "defaultCheckBoxState": false,
            // 条款勾选框初始状态 默认值： true
            "textColor": "#BBBBBB",
            // 文字颜色 默认值：#BBBBBB
            "termsColor": "#5496E3",
            //  协议文字颜色 默认值： #5496E3
            "prefix": "我已阅读并同意",
            // 条款前的文案 默认值：“我已阅读并同意”
            "suffix": "并使用本机号码登录",
            // 条款后的文案 默认值：“并使用本机号码登录”
            "privacyItems": []
          }
        }
      };
    },
    watch: {
      agree(agree) {
        this.univerifyStyle.privacyTerms.defaultCheckBoxState = agree;
      }
    },
    async created() {
      let servicesList = this.servicesList;
      let loginTypes2 = config.loginTypes;
      servicesList = servicesList.filter((item) => {
        if (item.id == "apple" && uni.getSystemInfoSync().osName != "ios") {
          return false;
        }
        return loginTypes2.includes(item.id);
      });
      if (loginTypes2.includes("univerify")) {
        this.univerifyStyle.privacyTerms.privacyItems = this.agreements;
        servicesList.forEach(({
          id,
          logo,
          path
        }) => {
          if (id != "univerify") {
            this.univerifyStyle.buttons.list.push({
              "iconPath": logo,
              "provider": id,
              path
              //路径用于点击快捷按钮时判断是跳转页面
            });
          }
        });
      }
      this.servicesList = servicesList.filter((item) => {
        let path = item.path ? item.path.split("?")[0] : "";
        return path != this.getRoute(1);
      });
    },
    methods: {
      getParentComponent() {
        return this.$parent;
      },
      setUserInfo(e2) {
        formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:195", "setUserInfo", e2);
      },
      getRoute(n2 = 0) {
        let pages2 = getCurrentPages();
        if (n2 > pages2.length) {
          return "";
        }
        return "/" + pages2[pages2.length - n2].route;
      },
      toPage(path, index = 0) {
        let type = ["navigateTo", "redirectTo"][index];
        if (this.getRoute(1) == path.split("?")[0] && this.getRoute(1) == "/uni_modules/uni-id-pages/pages/login/login-withoutpwd") {
          let loginType = path.split("?")[1].split("=")[1];
          uni.$emit("uni-id-pages-setLoginType", loginType);
        } else if (this.getRoute(2) == path) {
          uni.navigateBack();
        } else if (this.getRoute(1) != path) {
          uni[type]({
            url: path,
            animationType: "slide-in-left",
            complete(e2) {
            }
          });
        } else {
          formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:223", "出乎意料的情况,path：" + path);
        }
      },
      async login_before(type, navigateBack = true, options = {}) {
        var _a;
        formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:227", type);
        if ([
          "qq",
          "xiaomi",
          "sinaweibo",
          "taobao",
          "facebook",
          "google",
          "alipay",
          "douyin"
        ].includes(type)) {
          return uni.showToast({
            title: "该登录方式暂未实现，欢迎提交pr",
            icon: "none",
            duration: 3e3
          });
        }
        let isAppExist = true;
        await new Promise((callback) => {
          plus.oauth.getServices((oauthServices) => {
            let index = oauthServices.findIndex((e2) => e2.id == type);
            if (index != -1) {
              isAppExist = oauthServices[index].nativeClient;
              callback();
            } else {
              return uni.showToast({
                title: "当前设备不支持此登录，请选择其他登录方式",
                icon: "none",
                duration: 3e3
              });
            }
          }, (err) => {
            throw new Error("获取服务供应商失败：" + JSON.stringify(err));
          });
        });
        if (!isAppExist) {
          return uni.showToast({
            title: "当前设备不支持此登录，请选择其他登录方式",
            icon: "none",
            duration: 3e3
          });
        }
        let needAgreements = (((_a = config == null ? void 0 : config.agreements) == null ? void 0 : _a.scope) || []).includes("register");
        if (type != "univerify" && needAgreements && !this.agree) {
          let agreementsRef = this.getParentComponent().$refs.agreements;
          return agreementsRef.popup(() => {
            this.login_before(type, navigateBack, options);
          });
        }
        uni.showLoading({
          mask: true
        });
        if (type == "univerify") {
          let closeUniverify = function() {
            uni.hideLoading();
            univerifyManager.close();
            univerifyManager.offButtonsClick(onButtonsClickFn);
          };
          let univerifyManager = uni.getUniverifyManager();
          let clickAnotherButtons = false;
          let onButtonsClickFn = async (res) => {
            formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:328", "点击了第三方登录，provider：", res, res.provider, this.univerifyStyle.buttons.list);
            clickAnotherButtons = true;
            let checkBoxState = await uni.getCheckBoxState();
            this.agree = checkBoxState.state;
            let {
              path
            } = this.univerifyStyle.buttons.list[res.index];
            if (path) {
              if (this.getRoute(1).includes("login-withoutpwd") && path.includes("login-withoutpwd")) {
                this.getParentComponent().showCurrentWebview();
              }
              this.toPage(path, 1);
              closeUniverify();
            } else {
              if (this.agree) {
                closeUniverify();
                setTimeout(() => {
                  this.login_before(res.provider);
                }, 500);
              } else {
                uni.showToast({
                  title: "你未同意隐私政策协议",
                  icon: "none",
                  duration: 3e3
                });
              }
            }
          };
          univerifyManager.onButtonsClick(onButtonsClickFn);
          return univerifyManager.login({
            "univerifyStyle": this.univerifyStyle,
            success: (res) => {
              this.login(res.authResult, "univerify");
            },
            fail(err) {
              formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:378", err);
              if (!clickAnotherButtons) {
                uni.navigateBack();
              }
            },
            complete: async (e2) => {
              uni.hideLoading();
              univerifyManager.offButtonsClick(onButtonsClickFn);
            }
          });
        }
        if (type === "weixinMobile") {
          return this.login({
            phoneCode: options.phoneNumberCode
          }, type);
        }
        uni.login({
          "provider": type,
          "onlyAuthorize": true,
          "univerifyStyle": this.univerifyStyle,
          success: async (e2) => {
            if (type == "apple") {
              let res = await this.getUserInfo({
                provider: "apple"
              });
              Object.assign(e2.authResult, res.userInfo);
              uni.hideLoading();
            }
            this.login(type == "weixin" ? {
              code: e2.code
            } : e2.authResult, type);
          },
          fail: async (err) => {
            formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:423", err);
            uni.hideLoading();
          }
        });
      },
      login(params, type) {
        formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue:430", { params, type });
        let action = "loginBy" + type.trim().replace(type[0], type[0].toUpperCase());
        const uniIdCo2 = Ds.importObject("uni-id-co", {
          customUI: true
        });
        uniIdCo2[action](params).then((result) => {
          uni.showToast({
            title: "登录成功",
            icon: "none",
            duration: 2e3
          });
          mutations.loginSuccess(result);
        }).catch((e2) => {
          uni.showModal({
            content: e2.message,
            confirmText: "知道了",
            showCancel: false
          });
        }).finally((e2) => {
          if (type == "univerify") {
            uni.closeAuthView();
          }
          uni.hideLoading();
        });
      },
      async getUserInfo(e2) {
        return new Promise((resolve, reject) => {
          uni.getUserInfo({
            ...e2,
            success: (res) => {
              resolve(res);
            },
            fail: (err) => {
              uni.showModal({
                content: JSON.stringify(err),
                showCancel: false
              });
              reject(err);
            }
          });
        });
      }
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode("view", { class: "fab-login-box" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.servicesList, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "item",
              key: index,
              onClick: ($event) => item.path ? $options.toPage(item.path) : $options.login_before(item.id, false)
            }, [
              vue.createElementVNode("image", {
                class: "logo",
                src: item.logo,
                mode: "scaleToFill"
              }, null, 8, ["src"]),
              vue.createElementVNode(
                "text",
                { class: "login-title" },
                vue.toDisplayString(item.text),
                1
                /* TEXT */
              )
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])
    ]);
  }
  const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$g], ["__scopeId", "data-v-c5c7cfa0"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue"]]);
  let mixin = {
    data() {
      return {
        config,
        uniIdRedirectUrl: "",
        isMounted: false
      };
    },
    onUnload() {
    },
    mounted() {
      this.isMounted = true;
    },
    onLoad(e2) {
      if (e2.is_weixin_redirect) {
        uni.showLoading({
          mask: true
        });
        if (window.location.href.includes("#")) {
          let paramsArr = window.location.href.split("?")[1].split("&");
          paramsArr.forEach((item) => {
            let arr = item.split("=");
            if (arr[0] == "code") {
              e2.code = arr[1];
            }
          });
        }
        this.$nextTick((n2) => {
          this.$refs.uniFabLogin.login({
            code: e2.code
          }, "weixin");
        });
      }
      if (e2.uniIdRedirectUrl) {
        this.uniIdRedirectUrl = decodeURIComponent(e2.uniIdRedirectUrl);
      }
      if (getCurrentPages().length === 1) {
        uni.hideHomeButton();
        formatAppLog("log", "at uni_modules/uni-id-pages/common/login-page.mixin.js:52", "已隐藏：返回首页按钮");
      }
    },
    computed: {
      needAgreements() {
        if (this.isMounted) {
          if (this.$refs.agreements) {
            return this.$refs.agreements.needAgreements;
          } else {
            return false;
          }
        }
      },
      agree: {
        get() {
          if (this.isMounted) {
            if (this.$refs.agreements) {
              return this.$refs.agreements.isAgree;
            } else {
              return true;
            }
          }
        },
        set(agree) {
          if (this.$refs.agreements) {
            this.$refs.agreements.isAgree = agree;
          } else {
            formatAppLog("log", "at uni_modules/uni-id-pages/common/login-page.mixin.js:79", "不存在 隐私政策协议组件");
          }
        }
      }
    },
    methods: {
      loginSuccess(e2) {
        mutations.loginSuccess({
          ...e2,
          uniIdRedirectUrl: this.uniIdRedirectUrl
        });
      }
    }
  };
  const uniIdCo$7 = Ds.importObject("uni-id-co", {
    errorOptions: {
      type: "toast"
    }
  });
  const _sfc_main$g = {
    mixins: [mixin],
    data() {
      return {
        "password": "",
        "username": "",
        "captcha": "",
        "needCaptcha": false,
        "focusUsername": false,
        "focusPassword": false,
        "logo": "/static/logo.png"
      };
    },
    onShow() {
    },
    methods: {
      // 页面跳转，找回密码
      toRetrievePwd() {
        let url = "/uni_modules/uni-id-pages/pages/retrieve/retrieve";
        if (/^1\d{10}$/.test(this.username)) {
          url += `?phoneNumber=${this.username}`;
        }
        uni.navigateTo({
          url
        });
      },
      /**
       * 密码登录
       */
      pwdLogin() {
        if (!this.password.length) {
          this.focusPassword = true;
          return uni.showToast({
            title: "请输入密码",
            icon: "none",
            duration: 3e3
          });
        }
        if (!this.username.length) {
          this.focusUsername = true;
          return uni.showToast({
            title: "请输入手机号/用户名/邮箱",
            icon: "none",
            duration: 3e3
          });
        }
        if (this.needCaptcha && this.captcha.length != 4) {
          this.$refs.captcha.getImageCaptcha();
          return uni.showToast({
            title: "请输入验证码",
            icon: "none",
            duration: 3e3
          });
        }
        if (this.needAgreements && !this.agree) {
          return this.$refs.agreements.popup(this.pwdLogin);
        }
        let data2 = {
          "password": this.password,
          "captcha": this.captcha
        };
        if (/^1\d{10}$/.test(this.username)) {
          data2.mobile = this.username;
        } else if (/@/.test(this.username)) {
          data2.email = this.username;
        } else {
          data2.username = this.username;
        }
        uniIdCo$7.login(data2).then((e2) => {
          this.loginSuccess(e2);
        }).catch((e2) => {
          if (e2.errCode == "uni-id-captcha-required") {
            this.needCaptcha = true;
          } else if (this.needCaptcha) {
            this.$refs.captcha.getImageCaptcha();
          }
        });
      },
      /* 前往注册 */
      toRegister() {
        uni.navigateTo({
          url: this.config.isAdmin ? "/uni_modules/uni-id-pages/pages/register/register-admin" : "/uni_modules/uni-id-pages/pages/register/register",
          fail(e2) {
            formatAppLog("error", "at uni_modules/uni-id-pages/pages/login/login-withpwd.vue:142", e2);
          }
        });
      }
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    const _component_uni_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-captcha"), __easycom_0$1);
    const _component_uni_id_pages_agreements = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-agreements"), __easycom_4);
    const _component_uni_id_pages_fab_login = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-fab-login"), __easycom_2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createElementVNode("view", { class: "login-logo" }, [
        vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
      ]),
      vue.createCommentVNode(" 顶部文字 "),
      vue.createElementVNode("text", { class: "title title-box" }, "账号密码登录"),
      vue.createVNode(_component_uni_forms, null, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, { name: "username" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusUsername,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusUsername = false),
                class: "input-box",
                inputBorder: false,
                modelValue: $data.username,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.username = $event),
                placeholder: "请输入手机号/用户名/邮箱"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "password" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPassword,
                onBlur: _cache[2] || (_cache[2] = ($event) => $data.focusPassword = false),
                class: "input-box",
                clearable: "",
                type: "password",
                inputBorder: false,
                modelValue: $data.password,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.password = $event),
                placeholder: "请输入密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          })
        ]),
        _: 1
        /* STABLE */
      }),
      $data.needCaptcha ? (vue.openBlock(), vue.createBlock(_component_uni_captcha, {
        key: 0,
        focus: "",
        ref: "captcha",
        scene: "login-by-pwd",
        modelValue: $data.captcha,
        "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.captcha = $event)
      }, null, 8, ["modelValue"])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 带选择框的隐私政策协议组件 "),
      vue.createVNode(
        _component_uni_id_pages_agreements,
        {
          scope: "login",
          ref: "agreements"
        },
        null,
        512
        /* NEED_PATCH */
      ),
      vue.createElementVNode("button", {
        class: "uni-btn",
        type: "primary",
        onClick: _cache[5] || (_cache[5] = (...args) => $options.pwdLogin && $options.pwdLogin(...args))
      }, "登录"),
      vue.createCommentVNode(" 忘记密码 "),
      vue.createElementVNode("view", { class: "link-box" }, [
        !_ctx.config.isAdmin ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
          vue.createElementVNode("text", { class: "forget" }, "忘记了？"),
          vue.createElementVNode("text", {
            class: "link",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.toRetrievePwd && $options.toRetrievePwd(...args))
          }, "找回密码")
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode(
          "text",
          {
            class: "link",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.toRegister && $options.toRegister(...args))
          },
          vue.toDisplayString(_ctx.config.isAdmin ? "注册管理员账号" : "注册账号"),
          1
          /* TEXT */
        ),
        vue.createCommentVNode(' <text class="link" @click="toRegister" v-if="!config.isAdmin">注册账号</text> ')
      ]),
      vue.createCommentVNode(" 悬浮登录方式组件 "),
      vue.createVNode(
        _component_uni_id_pages_fab_login,
        { ref: "uniFabLogin" },
        null,
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const Uni_modulesUniIdPagesPagesLoginLoginWithpwd = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$f], ["__scopeId", "data-v-58ed63b0"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/login/login-withpwd.vue"]]);
  let currentWebview;
  const _sfc_main$f = {
    mixins: [mixin],
    data() {
      return {
        type: "",
        //快捷登录方式
        phone: "",
        //手机号码
        focusPhone: false,
        logo: "/static/logo.png"
      };
    },
    computed: {
      async loginTypes() {
        return config.loginTypes;
      },
      isPhone() {
        return /^1\d{10}$/.test(this.phone);
      },
      imgSrc() {
        return this.type == "weixin" ? "/uni_modules/uni-id-pages/static/login/weixin.png" : "/uni_modules/uni-id-pages/static/app-plus/apple.png";
      }
    },
    async onLoad(e2) {
      let type = e2.type || config.loginTypes[0];
      this.type = type;
      if (type != "univerify") {
        this.focusPhone = true;
      }
      this.$nextTick(() => {
        if (["weixin", "apple"].includes(type)) {
          this.$refs.uniFabLogin.servicesList = this.$refs.uniFabLogin.servicesList.filter((item) => item.id != type);
        }
      });
      uni.$on("uni-id-pages-setLoginType", (type2) => {
        this.type = type2;
      });
    },
    onShow() {
    },
    onUnload() {
      uni.$off("uni-id-pages-setLoginType");
    },
    onReady() {
      if (this.type == "univerify") {
        const pages2 = getCurrentPages();
        currentWebview = pages2[pages2.length - 1].$getAppWebview();
        currentWebview.setStyle({
          "top": "2000px"
          // 隐藏当前页面窗体
        });
        this.type == this.loginTypes[1];
        this.$refs.uniFabLogin.login_before("univerify");
      }
    },
    methods: {
      showCurrentWebview() {
        currentWebview.setStyle({
          "top": 0
        });
      },
      quickLogin(e2) {
        var _a, _b;
        let options = {};
        if ((_a = e2.detail) == null ? void 0 : _a.code) {
          options.phoneNumberCode = e2.detail.code;
        }
        if (this.type === "weixinMobile" && !((_b = e2.detail) == null ? void 0 : _b.code))
          return;
        this.$refs.uniFabLogin.login_before(this.type, true, options);
      },
      toSmsPage() {
        if (!this.isPhone) {
          this.focusPhone = true;
          return uni.showToast({
            title: "手机号码格式不正确",
            icon: "none",
            duration: 3e3
          });
        }
        if (this.needAgreements && !this.agree) {
          return this.$refs.agreements.popup(this.toSmsPage);
        }
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-smscode?phoneNumber=" + this.phone
        });
      },
      //去密码登录页
      toPwdLogin() {
        uni.navigateTo({
          url: "../login/password"
        });
      },
      chooseArea() {
        uni.showToast({
          title: "暂不支持其他国家",
          icon: "none",
          duration: 3e3
        });
      }
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_id_pages_agreements = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-agreements"), __easycom_4);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_id_pages_fab_login = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-fab-login"), __easycom_2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createElementVNode("view", { class: "login-logo" }, [
        vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
      ]),
      vue.createCommentVNode(" 顶部文字 "),
      vue.createElementVNode("text", { class: "title" }, "请选择登录方式"),
      vue.createCommentVNode(" 快捷登录框 当url带参数时有效 "),
      ["apple", "weixin", "weixinMobile"].includes($data.type) ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 0 },
        [
          vue.createElementVNode("text", { class: "tip" }, "将根据第三方账号服务平台的授权范围获取你的信息"),
          vue.createElementVNode("view", { class: "quickLogin" }, [
            $data.type !== "weixinMobile" ? (vue.openBlock(), vue.createElementBlock("image", {
              key: 0,
              onClick: _cache[0] || (_cache[0] = (...args) => $options.quickLogin && $options.quickLogin(...args)),
              src: $options.imgSrc,
              mode: "widthFix",
              class: "quickLoginBtn"
            }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
              "button",
              {
                key: 1,
                type: "primary",
                "open-type": "getPhoneNumber",
                onGetphonenumber: _cache[1] || (_cache[1] = (...args) => $options.quickLogin && $options.quickLogin(...args)),
                class: "uni-btn"
              },
              "微信授权手机号登录",
              32
              /* HYDRATE_EVENTS */
            )),
            vue.createVNode(
              _component_uni_id_pages_agreements,
              {
                scope: "register",
                ref: "agreements"
              },
              null,
              512
              /* NEED_PATCH */
            )
          ])
        ],
        64
        /* STABLE_FRAGMENT */
      )) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createElementVNode("text", { class: "tip" }, "未注册的账号验证通过后将自动注册"),
          vue.createElementVNode("view", { class: "phone-box" }, [
            vue.createElementVNode("view", {
              onClick: _cache[2] || (_cache[2] = (...args) => $options.chooseArea && $options.chooseArea(...args)),
              class: "area"
            }, "+86"),
            vue.createVNode(_component_uni_easyinput, {
              focus: $data.focusPhone,
              onBlur: _cache[3] || (_cache[3] = ($event) => $data.focusPhone = false),
              class: "input-box",
              type: "number",
              inputBorder: false,
              modelValue: $data.phone,
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.phone = $event),
              maxlength: "11",
              placeholder: "请输入手机号"
            }, null, 8, ["focus", "modelValue"])
          ]),
          vue.createVNode(
            _component_uni_id_pages_agreements,
            {
              scope: "register",
              ref: "agreements"
            },
            null,
            512
            /* NEED_PATCH */
          ),
          vue.createElementVNode("button", {
            class: "uni-btn",
            type: "primary",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.toSmsPage && $options.toSmsPage(...args))
          }, "获取验证码")
        ],
        64
        /* STABLE_FRAGMENT */
      )),
      vue.createCommentVNode(" 固定定位的快捷登录按钮 "),
      vue.createVNode(
        _component_uni_id_pages_fab_login,
        { ref: "uniFabLogin" },
        null,
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const Uni_modulesUniIdPagesPagesLoginLoginWithoutpwd = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$e], ["__scopeId", "data-v-f1f87fcd"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/login/login-withoutpwd.vue"]]);
  const _sfc_main$e = {
    data() {
      return {};
    },
    onLoad() {
    },
    methods: {
      cancel() {
        uni.navigateBack();
      },
      nextStep() {
        uni.showModal({
          content: "已经仔细阅读注销提示，知晓可能带来的后果，并确认要注销",
          complete: (e2) => {
            if (e2.confirm) {
              const uniIdco = Ds.importObject("uni-id-co");
              uniIdco.closeAccount().then((e3) => {
                uni.showToast({
                  title: "注销成功",
                  duration: 3e3
                });
                uni.removeStorageSync("uni_id_token");
                uni.setStorageSync("uni_id_token_expired", 0);
                uni.navigateTo({
                  url: "/uni_modules/uni-id-pages/pages/login/login-withoutpwd"
                });
              });
            } else {
              uni.navigateBack();
            }
          }
        });
      }
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createElementVNode("text", {
        class: "words",
        space: "emsp"
      }, " 一、注销是不可逆操作，注销后:\\n 1.帐号将无法登录、无法找回。\\n 2.帐号所有信息都会清除(个人身份信息、粉丝数等;发布的作品、评论、点赞等;交易信息等)，你 的朋友将无法通过本应用帐号联系你，请自行备份相关 信息和数据。\\n 二、重要提示\\n 1.封禁帐号(永久封禁、社交封禁、直播权限封禁)不能申请注销。\\n 2.注销后，你的身份证、三方帐号(微信、QQ、微博、支付宝)、手机号等绑定关系将解除，解除后可以绑定到其他帐号。\\n 3.注销后，手机号可以注册新的帐号，新帐号不会存在之前帐号的任何信息(作品、粉丝、评论、个人信息等)。\\n 4.注销本应用帐号前，需尽快处理帐号下的资金问题。\\n 5.视具体帐号情况而定，注销最多需要7天。\\n "),
      vue.createElementVNode("view", { class: "button-group" }, [
        vue.createElementVNode("button", {
          onClick: _cache[0] || (_cache[0] = (...args) => $options.nextStep && $options.nextStep(...args)),
          class: "next",
          type: "default"
        }, "下一步"),
        vue.createElementVNode("button", {
          onClick: _cache[1] || (_cache[1] = (...args) => $options.cancel && $options.cancel(...args)),
          type: "warn"
        }, "取消")
      ])
    ]);
  }
  const Uni_modulesUniIdPagesPagesUserinfoDeactivateDeactivate = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$d], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate.vue"]]);
  let mediaQueryObserver;
  const _sfc_main$d = {
    name: "UniMatchMedia",
    props: {
      width: {
        type: [Number, String],
        default: ""
      },
      minWidth: {
        type: [Number, String],
        default: ""
      },
      maxWidth: {
        type: [Number, String],
        default: ""
      },
      height: {
        type: [Number, String],
        default: ""
      },
      minHeight: {
        type: [Number, String],
        default: ""
      },
      maxHeight: {
        type: [Number, String],
        default: ""
      },
      orientation: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        matches: true
      };
    },
    mounted() {
      mediaQueryObserver = uni.createMediaQueryObserver(this);
      mediaQueryObserver.observe({
        width: this.width,
        maxWidth: this.maxWidth,
        minWidth: this.minWidth,
        height: this.height,
        minHeight: this.minHeight,
        maxHeight: this.maxHeight,
        orientation: this.orientation
      }, (matches) => {
        this.matches = matches;
      });
    },
    destroyed() {
      mediaQueryObserver.disconnect();
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.withDirectives((vue.openBlock(), vue.createElementBlock(
      "view",
      null,
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      512
      /* NEED_PATCH */
    )), [
      [vue.vShow, $data.matches]
    ]);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$c], ["__scopeId", "data-v-4f53b81d"], ["__file", "G:/HBuilderX.3.7.11.20230427/HBuilderX/plugins/uniapp-cli-vite/node_modules/@dcloudio/uni-components/lib/uni-match-media/uni-match-media.vue"]]);
  function debounce$1(func, wait) {
    let timer;
    wait = wait || 500;
    return function() {
      let context = this;
      let args = arguments;
      if (timer)
        clearTimeout(timer);
      let callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      if (callNow)
        func.apply(context, args);
    };
  }
  const _sfc_main$c = {
    name: "uni-sms-form",
    model: {
      prop: "modelValue",
      event: "update:modelValue"
    },
    props: {
      event: ["update:modelValue"],
      /**
       * 倒计时时长 s
       */
      count: {
        type: [String, Number],
        default: 60
      },
      /**
       * 手机号码
       */
      phone: {
        type: [String, Number],
        default: ""
      },
      /*
      	验证码类型，用于防止不同功能的验证码混用，目前支持的类型login登录、register注册、bind绑定手机、unbind解绑手机
      */
      type: {
        type: String,
        default() {
          return "login";
        }
      },
      /*
      	验证码输入框是否默认获取焦点
      */
      focusCaptchaInput: {
        type: Boolean,
        default() {
          return false;
        }
      }
    },
    data() {
      return {
        captcha: "",
        reverseNumber: 0,
        reverseTimer: null,
        modelValue: "",
        focusSmsCodeInput: false
      };
    },
    watch: {
      captcha(value, oldValue) {
        if (value.length == 4 && oldValue.length != 4) {
          this.start();
        }
      },
      modelValue(value) {
        this.$emit("input", value);
        this.$emit("update:modelValue", value);
      }
    },
    computed: {
      innerText() {
        if (this.reverseNumber == 0)
          return "获取短信验证码";
        return "重新发送(" + this.reverseNumber + "s)";
      }
    },
    created() {
      this.initClick();
    },
    methods: {
      getImageCaptcha(focus) {
        this.$refs.captcha.getImageCaptcha(focus);
      },
      initClick() {
        this.start = debounce$1(() => {
          if (this.reverseNumber != 0)
            return;
          this.sendMsg();
        });
      },
      sendMsg() {
        if (this.captcha.length != 4) {
          this.$refs.captcha.focusCaptchaInput = true;
          return uni.showToast({
            title: "请先输入图形验证码",
            icon: "none",
            duration: 3e3
          });
        }
        let reg_phone = /^1\d{10}$/;
        if (!reg_phone.test(this.phone))
          return uni.showToast({
            title: "手机号格式错误",
            icon: "none",
            duration: 3e3
          });
        const uniIdCo2 = Ds.importObject("uni-id-co", {
          customUI: true
        });
        formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-sms-form/uni-id-pages-sms-form.vue:139", "sendSmsCode", {
          "mobile": this.phone,
          "scene": this.type,
          "captcha": this.captcha
        });
        uniIdCo2.sendSmsCode({
          "mobile": this.phone,
          "scene": this.type,
          "captcha": this.captcha
        }).then((result) => {
          uni.showToast({
            title: "短信验证码发送成功",
            icon: "none",
            duration: 3e3
          });
          this.reverseNumber = Number(this.count);
          this.getCode();
        }).catch((e2) => {
          if (e2.code == "uni-id-invalid-sms-template-id") {
            this.modelValue = "123456";
            uni.showToast({
              title: "已启动测试模式,详情【控制台信息】",
              icon: "none",
              duration: 3e3
            });
            formatAppLog("warn", "at uni_modules/uni-id-pages/components/uni-id-pages-sms-form/uni-id-pages-sms-form.vue:164", e2.message);
          } else {
            this.getImageCaptcha();
            this.captcha = "";
            uni.showToast({
              title: e2.message,
              icon: "none",
              duration: 3e3
            });
          }
        });
      },
      getCode() {
        if (this.reverseNumber == 0) {
          clearTimeout(this.reverseTimer);
          this.reverseTimer = null;
          return;
        }
        this.reverseNumber--;
        this.reverseTimer = setTimeout(() => {
          this.getCode();
        }, 1e3);
      }
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-captcha"), __easycom_0$1);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createVNode(_component_uni_captcha, {
        focus: $props.focusCaptchaInput,
        ref: "captcha",
        scene: "send-sms-code",
        modelValue: $data.captcha,
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.captcha = $event)
      }, null, 8, ["focus", "modelValue"]),
      vue.createElementVNode("view", { class: "box" }, [
        vue.createVNode(_component_uni_easyinput, {
          focus: $data.focusSmsCodeInput,
          onBlur: _cache[1] || (_cache[1] = ($event) => $data.focusSmsCodeInput = false),
          type: "number",
          class: "input-box",
          inputBorder: false,
          modelValue: $data.modelValue,
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.modelValue = $event),
          maxlength: "6",
          clearable: false,
          placeholder: "请输入短信验证码"
        }, null, 8, ["focus", "modelValue"]),
        vue.createElementVNode("view", {
          class: "short-code-btn",
          "hover-class": "hover",
          onClick: _cache[3] || (_cache[3] = (...args) => _ctx.start && _ctx.start(...args))
        }, [
          vue.createElementVNode(
            "text",
            {
              class: vue.normalizeClass(["inner-text", $data.reverseNumber == 0 ? "inner-text-active" : ""])
            },
            vue.toDisplayString($options.innerText),
            3
            /* TEXT, CLASS */
          )
        ])
      ])
    ]);
  }
  const __easycom_3$1 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-4b649130"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-sms-form/uni-id-pages-sms-form.vue"]]);
  const _sfc_main$b = {
    data() {
      return {
        focus: false
      };
    },
    props: {
      modelValue: String,
      value: String,
      scene: {
        type: String,
        default() {
          return "";
        }
      },
      title: {
        type: String,
        default() {
          return "";
        }
      }
    },
    computed: {
      val: {
        get() {
          return this.value || this.modelValue;
        },
        set(value) {
          this.$emit("update:modelValue", value);
        }
      }
    },
    methods: {
      open() {
        this.focus = true;
        this.val = "";
        this.$refs.popup.open();
      },
      close() {
        this.focus = false;
        this.$refs.popup.close();
      },
      confirm() {
        if (!this.val) {
          return uni.showToast({
            title: "请填写验证码",
            icon: "none"
          });
        }
        this.close();
        this.$emit("confirm");
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-captcha"), __easycom_0$1);
    const _component_uni_popup = resolveEasycom(vue.resolveDynamicComponent("uni-popup"), __easycom_1$1);
    return vue.openBlock(), vue.createBlock(
      _component_uni_popup,
      {
        ref: "popup",
        type: "center"
      },
      {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "popup-captcha" }, [
            vue.createElementVNode("view", { class: "content" }, [
              vue.createElementVNode(
                "text",
                { class: "title" },
                vue.toDisplayString($props.title),
                1
                /* TEXT */
              ),
              vue.createVNode(_component_uni_captcha, {
                focus: $data.focus,
                scene: $props.scene,
                modelValue: $options.val,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $options.val = $event)
              }, null, 8, ["focus", "scene", "modelValue"])
            ]),
            vue.createElementVNode("view", { class: "button-box" }, [
              vue.createElementVNode("view", {
                onClick: _cache[1] || (_cache[1] = (...args) => $options.close && $options.close(...args)),
                class: "btn"
              }, "取消"),
              vue.createElementVNode("view", {
                onClick: _cache[2] || (_cache[2] = (...args) => $options.confirm && $options.confirm(...args)),
                class: "btn confirm"
              }, "确认")
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      },
      512
      /* NEED_PATCH */
    );
  }
  const __easycom_5 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__scopeId", "data-v-d021b99b"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-captcha/components/uni-popup-captcha/uni-popup-captcha.vue"]]);
  const _sfc_main$a = {
    data() {
      return {
        formData: {
          mobile: "",
          code: "",
          captcha: ""
        },
        focusMobile: true,
        logo: "/static/logo.png"
      };
    },
    computed: {
      tipText() {
        return `验证码已通过短信发送至 ${this.formData.mobile}。密码为6 - 20位`;
      }
    },
    onLoad(event) {
    },
    onReady() {
    },
    methods: {
      /**
       * 完成并提交
       */
      submit() {
        if (!/^1\d{10}$/.test(this.formData.mobile)) {
          this.focusMobile = true;
          return uni.showToast({
            title: "手机号码格式不正确",
            icon: "none",
            duration: 3e3
          });
        }
        if (!/^\d{6}$/.test(this.formData.code)) {
          this.$refs.smsForm.focusSmsCodeInput = true;
          return uni.showToast({
            title: "验证码格式不正确",
            icon: "none",
            duration: 3e3
          });
        }
        const uniIdCo2 = Ds.importObject("uni-id-co");
        uniIdCo2.bindMobileBySms(this.formData).then((e2) => {
          uni.showToast({
            title: e2.errMsg,
            icon: "none",
            duration: 3e3
          });
          this.getOpenerEventChannel();
          mutations.setUserInfo(this.formData);
          uni.navigateBack();
        }).catch((e2) => {
          formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/bind-mobile/bind-mobile.vue:84", e2);
          if (e2.errCode == "uni-id-captcha-required") {
            this.$refs.popup.open();
          }
        }).finally((e2) => {
          this.formData.captcha = "";
        });
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_id_pages_sms_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-sms-form"), __easycom_3$1);
    const _component_uni_popup_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-popup-captcha"), __easycom_5);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "绑定手机号")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createCommentVNode(" 登录框 (选择手机号所属国家和地区需要另行实现) "),
      vue.createVNode(_component_uni_easyinput, {
        clearable: "",
        focus: $data.focusMobile,
        onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusMobile = false),
        type: "number",
        class: "input-box",
        inputBorder: false,
        modelValue: $data.formData.mobile,
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.mobile = $event),
        maxlength: "11",
        placeholder: "请输入手机号"
      }, null, 8, ["focus", "modelValue"]),
      vue.createVNode(_component_uni_id_pages_sms_form, {
        ref: "smsForm",
        type: "bind-mobile-by-sms",
        modelValue: $data.formData.code,
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.formData.code = $event),
        phone: $data.formData.mobile
      }, null, 8, ["modelValue", "phone"]),
      vue.createElementVNode("button", {
        class: "uni-btn send-btn-box",
        type: "primary",
        onClick: _cache[3] || (_cache[3] = (...args) => $options.submit && $options.submit(...args))
      }, "提交"),
      vue.createVNode(_component_uni_popup_captcha, {
        onConfirm: $options.submit,
        modelValue: $data.formData.captcha,
        "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.captcha = $event),
        scene: "bind-mobile-by-sms",
        ref: "popup"
      }, null, 8, ["onConfirm", "modelValue"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesUserinfoBindMobileBindMobile = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/userinfo/bind-mobile/bind-mobile.vue"]]);
  const _sfc_main$9 = {
    mixins: [mixin],
    data() {
      return {
        "code": "",
        "phone": "",
        "captcha": "",
        "logo": "/static/logo.png"
      };
    },
    computed: {
      tipText() {
        return "验证码已通过短信发送至" + this.phone;
      }
    },
    onLoad({
      phoneNumber
    }) {
      this.phone = phoneNumber;
    },
    onShow() {
    },
    methods: {
      submit() {
        const uniIdCo2 = Ds.importObject("uni-id-co", {
          errorOptions: {
            type: "toast"
          }
        });
        if (this.code.length != 6) {
          this.$refs.smsCode.focusSmsCodeInput = true;
          return uni.showToast({
            title: "验证码不能为空",
            icon: "none",
            duration: 3e3
          });
        }
        uniIdCo2.loginBySms({
          "mobile": this.phone,
          "code": this.code,
          "captcha": this.captcha
        }).then((e2) => {
          this.loginSuccess(e2);
        }).catch((e2) => {
          if (e2.errCode == "uni-id-captcha-required") {
            this.$refs.popup.open();
          } else {
            formatAppLog("log", "at uni_modules/uni-id-pages/pages/login/login-smscode.vue:75", e2.errMsg);
          }
        }).finally((e2) => {
          this.captcha = "";
        });
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_id_pages_sms_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-sms-form"), __easycom_3$1);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    const _component_uni_popup_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-popup-captcha"), __easycom_5);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createElementVNode("view", { class: "login-logo" }, [
        vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
      ]),
      vue.createCommentVNode(" 顶部文字 "),
      vue.createElementVNode("text", { class: "title" }, "请输入验证码"),
      vue.createElementVNode("text", { class: "tip" }, "先输入图形验证码，再获取短信验证码"),
      vue.createVNode(_component_uni_forms, null, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_id_pages_sms_form, {
            focusCaptchaInput: "",
            modelValue: $data.code,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.code = $event),
            type: "login-by-sms",
            ref: "smsCode",
            phone: $data.phone
          }, null, 8, ["modelValue", "phone"]),
          vue.createElementVNode("button", {
            class: "uni-btn send-btn",
            type: "primary",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.submit && $options.submit(...args))
          }, "登录")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_popup_captcha, {
        onConfirm: $options.submit,
        modelValue: $data.captcha,
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.captcha = $event),
        scene: "login-by-sms",
        ref: "popup"
      }, null, 8, ["onConfirm", "modelValue"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesLoginLoginSmscode = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-661d78f6"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/login/login-smscode.vue"]]);
  const { passwordStrength } = config;
  const passwordRules = {
    // 密码必须包含大小写字母、数字和特殊符号
    super: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
    // 密码必须包含字母、数字和特殊符号
    strong: /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
    // 密码必须为字母、数字和特殊符号任意两种的组合
    medium: /^(?![0-9]+$)(?![a-zA-Z]+$)(?![~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]+$)[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
    // 密码必须包含字母和数字
    weak: /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{6,16}$/
  };
  const ERROR = {
    normal: {
      noPwd: "请输入密码",
      noRePwd: "再次输入密码",
      rePwdErr: "两次输入密码不一致"
    },
    passwordStrengthError: {
      super: "密码必须包含大小写字母、数字和特殊符号，密码长度必须在8-16位之间",
      strong: "密码必须包含字母、数字和特殊符号，密码长度必须在8-16位之间",
      medium: "密码必须为字母、数字和特殊符号任意两种的组合，密码长度必须在8-16位之间",
      weak: "密码必须包含字母，密码长度必须在6-16位之间"
    }
  };
  function validPwd(password) {
    if (passwordStrength && passwordRules[passwordStrength]) {
      if (!new RegExp(passwordRules[passwordStrength]).test(password)) {
        return ERROR.passwordStrengthError[passwordStrength];
      }
    }
    return true;
  }
  function getPwdRules(pwdName = "password", rePwdName = "password2") {
    const rules2 = {};
    rules2[pwdName] = {
      rules: [
        {
          required: true,
          errorMessage: ERROR.normal.noPwd
        },
        {
          validateFunction: function(rule, value, data2, callback) {
            const checkRes = validPwd(value);
            if (checkRes !== true) {
              callback(checkRes);
            }
            return true;
          }
        }
      ]
    };
    if (rePwdName) {
      rules2[rePwdName] = {
        rules: [
          {
            required: true,
            errorMessage: ERROR.normal.noRePwd
          },
          {
            validateFunction: function(rule, value, data2, callback) {
              if (value != data2[pwdName]) {
                callback(ERROR.normal.rePwdErr);
              }
              return true;
            }
          }
        ]
      };
    }
    return rules2;
  }
  const passwordMod = {
    ERROR,
    validPwd,
    getPwdRules
  };
  const rules = {
    "username": {
      "rules": [
        {
          required: true,
          errorMessage: "请输入用户名"
        },
        {
          minLength: 3,
          maxLength: 32,
          errorMessage: "用户名长度在 {minLength} 到 {maxLength} 个字符"
        },
        {
          validateFunction: function(rule, value, data2, callback) {
            if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
              callback("用户名不能是：手机号或邮箱");
            }
            if (/^\d+$/.test(value)) {
              callback("用户名不能为纯数字");
            }
            if (/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)) {
              callback("用户名不能包含中文");
            }
            return true;
          }
        }
      ],
      "label": "用户名"
    },
    "nickname": {
      "rules": [
        {
          minLength: 3,
          maxLength: 32,
          errorMessage: "昵称长度在 {minLength} 到 {maxLength} 个字符"
        },
        {
          validateFunction: function(rule, value, data2, callback) {
            if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
              callback("昵称不能是：手机号或邮箱");
            }
            if (/^\d+$/.test(value)) {
              callback("昵称不能为纯数字");
            }
            if (/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)) {
              callback("昵称不能包含中文");
            }
            return true;
          }
        }
      ],
      "label": "昵称"
    },
    ...passwordMod.getPwdRules()
  };
  const uniIdCo$6 = Ds.importObject("uni-id-co");
  const _sfc_main$8 = {
    mixins: [mixin],
    data() {
      return {
        formData: {
          username: "",
          nickname: "",
          password: "",
          password2: "",
          captcha: ""
        },
        rules,
        focusUsername: false,
        focusNickname: false,
        focusPassword: false,
        focusPassword2: false,
        logo: "/static/logo.png"
      };
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    onShow() {
    },
    methods: {
      /**
       * 触发表单提交
       */
      submit() {
        this.$refs.form.validate().then((res) => {
          if (this.formData.captcha.length != 4) {
            this.$refs.captcha.focusCaptchaInput = true;
            return uni.showToast({
              title: "请输入验证码",
              icon: "none",
              duration: 3e3
            });
          }
          if (this.needAgreements && !this.agree) {
            return this.$refs.agreements.popup(() => {
              this.submitForm(res);
            });
          }
          this.submitForm(res);
        }).catch((errors) => {
          let key = errors[0].key;
          key = key.replace(key[0], key[0].toUpperCase());
          this["focus" + key] = true;
        });
      },
      submitForm(params) {
        uniIdCo$6.registerUser(this.formData).then((e2) => {
          this.loginSuccess(e2);
        }).catch((e2) => {
          formatAppLog("log", "at uni_modules/uni-id-pages/pages/register/register.vue:120", e2.message);
          this.$refs.captcha.getImageCaptcha();
        });
      },
      navigateBack() {
        uni.navigateBack();
      },
      toLogin() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
      },
      registerByEmail() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/register/register-by-email"
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-captcha"), __easycom_0$1);
    const _component_uni_id_pages_agreements = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-agreements"), __easycom_4);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "用户名密码注册")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        rules: $data.rules,
        "validate-trigger": "submit",
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, {
            name: "username",
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusUsername,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusUsername = false),
                class: "input-box",
                placeholder: "请输入用户名",
                modelValue: $data.formData.username,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.username = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "nickname" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusNickname,
                onBlur: _cache[2] || (_cache[2] = ($event) => $data.focusNickname = false),
                class: "input-box",
                placeholder: "请输入用户昵称",
                modelValue: $data.formData.nickname,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.nickname = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, {
            name: "password",
            modelValue: $data.formData.password,
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.formData.password = $event),
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusPassword,
                onBlur: _cache[4] || (_cache[4] = ($event) => $data.focusPassword = false),
                class: "input-box",
                maxlength: "20",
                placeholder: "请输入" + (_ctx.config.passwordStrength == "weak" ? "6" : "8") + "-16位密码",
                type: "password",
                modelValue: $data.formData.password,
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.formData.password = $event),
                trim: "both"
              }, null, 8, ["focus", "placeholder", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["modelValue"]),
          vue.createVNode(_component_uni_forms_item, {
            name: "password2",
            modelValue: $data.formData.password2,
            "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $data.formData.password2 = $event),
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusPassword2,
                onBlur: _cache[7] || (_cache[7] = ($event) => $data.focusPassword2 = false),
                class: "input-box",
                placeholder: "再次输入密码",
                maxlength: "20",
                type: "password",
                modelValue: $data.formData.password2,
                "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.formData.password2 = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["modelValue"]),
          vue.createVNode(_component_uni_forms_item, null, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_captcha, {
                ref: "captcha",
                scene: "register",
                modelValue: $data.formData.captcha,
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.formData.captcha = $event)
              }, null, 8, ["modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(
            _component_uni_id_pages_agreements,
            {
              scope: "register",
              ref: "agreements"
            },
            null,
            512
            /* NEED_PATCH */
          ),
          vue.createElementVNode("button", {
            class: "uni-btn",
            type: "primary",
            onClick: _cache[11] || (_cache[11] = (...args) => $options.submit && $options.submit(...args))
          }, "注册"),
          vue.createElementVNode("button", {
            onClick: _cache[12] || (_cache[12] = (...args) => $options.navigateBack && $options.navigateBack(...args)),
            class: "register-back"
          }, "返回"),
          vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "link-box" }, [
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[13] || (_cache[13] = (...args) => $options.registerByEmail && $options.registerByEmail(...args))
                }, "邮箱验证码注册"),
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[14] || (_cache[14] = (...args) => $options.toLogin && $options.toLogin(...args))
                }, "已有账号？点此登录")
              ])
            ]),
            _: 1
            /* STABLE */
          })
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value", "rules"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesRegisterRegister = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/register/register.vue"]]);
  const uniIdCo$5 = Ds.importObject("uni-id-co", {
    errorOptions: {
      type: "toast"
    }
  });
  const _sfc_main$7 = {
    mixins: [mixin],
    data() {
      return {
        lock: false,
        focusPhone: true,
        focusPassword: false,
        focusPassword2: false,
        formData: {
          "phone": "",
          "code": "",
          "password": "",
          "password2": "",
          "captcha": ""
        },
        rules: {
          phone: {
            rules: [
              {
                required: true,
                errorMessage: "请输入手机号"
              },
              {
                pattern: /^1\d{10}$/,
                errorMessage: "手机号码格式不正确"
              }
            ]
          },
          code: {
            rules: [
              {
                required: true,
                errorMessage: "请输入短信验证码"
              },
              {
                pattern: /^.{6}$/,
                errorMessage: "请输入6位验证码"
              }
            ]
          },
          password: {
            rules: [
              {
                required: true,
                errorMessage: "请输入新密码"
              },
              {
                pattern: /^.{6,20}$/,
                errorMessage: "密码为6 - 20位"
              }
            ]
          },
          password2: {
            rules: [
              {
                required: true,
                errorMessage: "请确认密码"
              },
              {
                pattern: /^.{6,20}$/,
                errorMessage: "密码为6 - 20位"
              },
              {
                validateFunction: function(rule, value, data2, callback) {
                  if (value != data2.password) {
                    callback("两次输入密码不一致");
                  }
                  return true;
                }
              }
            ]
          }
        },
        logo: "/static/logo.png"
      };
    },
    computed: {
      isPhone() {
        let reg_phone = /^1\d{10}$/;
        let isPhone = reg_phone.test(this.formData.phone);
        return isPhone;
      },
      isPwd() {
        let reg_pwd = /^.{6,20}$/;
        let isPwd = reg_pwd.test(this.formData.password);
        return isPwd;
      },
      isCode() {
        let reg_code = /^\d{6}$/;
        let isCode = reg_code.test(this.formData.code);
        return isCode;
      }
    },
    onLoad(event) {
      if (event && event.phoneNumber) {
        this.formData.phone = event.phoneNumber;
        if (event.lock) {
          this.lock = event.lock;
          this.focusPhone = true;
        }
      }
    },
    onReady() {
      if (this.formData.phone) {
        this.$refs.shortCode.start();
      }
      this.$refs.form.setRules(this.rules);
    },
    onShow() {
    },
    methods: {
      /**
       * 完成并提交
       */
      submit() {
        this.$refs.form.validate().then((res) => {
          let {
            "phone": mobile,
            "password": password,
            captcha,
            code
          } = this.formData;
          uniIdCo$5.resetPwdBySms({
            mobile,
            code,
            password,
            captcha
          }).then((e2) => {
            uni.navigateBack();
          }).catch((e2) => {
            if (e2.errCode == "uni-id-captcha-required") {
              this.$refs.popup.open();
            }
          }).finally((e2) => {
            this.formData.captcha = "";
          });
        }).catch((errors) => {
          let key = errors[0].key;
          if (key == "code") {
            return this.$refs.shortCode.focusSmsCodeInput = true;
          }
          key = key.replace(key[0], key[0].toUpperCase());
          this["focus" + key] = true;
        });
      },
      retrieveByEmail() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/retrieve/retrieve-by-email"
        });
      },
      backLogin() {
        uni.redirectTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_id_pages_sms_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-sms-form"), __easycom_3$1);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    const _component_uni_popup_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-popup-captcha"), __easycom_5);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "通过手机验证码找回密码")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, { name: "phone" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPhone,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusPhone = false),
                class: "input-box",
                disabled: $data.lock,
                type: "number",
                inputBorder: false,
                modelValue: $data.formData.phone,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.phone = $event),
                maxlength: "11",
                placeholder: "请输入手机号"
              }, null, 8, ["focus", "disabled", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "code" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_id_pages_sms_form, {
                ref: "shortCode",
                phone: $data.formData.phone,
                type: "reset-pwd-by-sms",
                modelValue: $data.formData.code,
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.formData.code = $event)
              }, null, 8, ["phone", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "password" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPassword,
                onBlur: _cache[3] || (_cache[3] = ($event) => $data.focusPassword = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.password,
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.password = $event),
                placeholder: "请输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "password2" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPassword2,
                onBlur: _cache[5] || (_cache[5] = ($event) => $data.focusPassword2 = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.password2,
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.formData.password2 = $event),
                placeholder: "请再次输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createElementVNode("button", {
            class: "uni-btn send-btn-box",
            type: "primary",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.submit && $options.submit(...args))
          }, "提交"),
          vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "link-box" }, [
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[8] || (_cache[8] = (...args) => $options.retrieveByEmail && $options.retrieveByEmail(...args))
                }, "通过邮箱验证码找回密码"),
                vue.createElementVNode("view"),
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[9] || (_cache[9] = (...args) => $options.backLogin && $options.backLogin(...args))
                }, "返回登录")
              ])
            ]),
            _: 1
            /* STABLE */
          })
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value"]),
      vue.createVNode(_component_uni_popup_captcha, {
        onConfirm: $options.submit,
        modelValue: $data.formData.captcha,
        "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.formData.captcha = $event),
        scene: "reset-pwd-by-sms",
        ref: "popup"
      }, null, 8, ["onConfirm", "modelValue"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesRetrieveRetrieve = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/retrieve/retrieve.vue"]]);
  const _sfc_main$6 = {
    onLoad({ url, title }) {
      if (url.substring(0, 4) != "http") {
        uni.showModal({
          title: "错误",
          content: '不是一个有效的网站链接,"' + url + '"',
          showCancel: false,
          confirmText: "知道了",
          complete: () => {
            uni.navigateBack();
          }
        });
        title = "页面路径错误";
      } else {
        this.url = url;
      }
      if (title) {
        uni.setNavigationBarTitle({ title });
      }
    },
    data() {
      return {
        url: null
      };
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      $data.url ? (vue.openBlock(), vue.createElementBlock("web-view", {
        key: 0,
        src: $data.url
      }, null, 8, ["src"])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Uni_modulesUniIdPagesPagesCommonWebviewWebview = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/common/webview/webview.vue"]]);
  const uniIdCo$4 = Ds.importObject("uni-id-co", {
    customUI: true
  });
  const _sfc_main$5 = {
    mixins: [mixin],
    data() {
      return {
        focusOldPassword: false,
        focusNewPassword: false,
        focusNewPassword2: false,
        formData: {
          "oldPassword": "",
          "newPassword": "",
          "newPassword2": ""
        },
        rules: {
          oldPassword: {
            rules: [
              {
                required: true,
                errorMessage: "请输入新密码"
              },
              {
                pattern: /^.{6,20}$/,
                errorMessage: "密码为6 - 20位"
              }
            ]
          },
          ...passwordMod.getPwdRules("newPassword", "newPassword2")
        },
        logo: "/static/logo.png"
      };
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    onShow() {
    },
    methods: {
      /**
       * 完成并提交
       */
      submit() {
        this.$refs.form.validate().then((res) => {
          let {
            oldPassword,
            newPassword
          } = this.formData;
          uniIdCo$4.updatePwd({
            oldPassword,
            newPassword
          }).then((e2) => {
            uni.removeStorageSync("uni_id_token");
            uni.setStorageSync("uni_id_token_expired", 0);
            uni.redirectTo({
              url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
            });
          }).catch((e2) => {
            uni.showModal({
              content: e2.message,
              showCancel: false
            });
          });
        }).catch((errors) => {
          let key = errors[0].key;
          key = key.replace(key[0], key[0].toUpperCase());
          this["focus" + key] = true;
        });
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "修改密码")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, { name: "oldPassword" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusOldPassword,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusOldPassword = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.oldPassword,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.oldPassword = $event),
                placeholder: "请输入旧密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "newPassword" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusNewPassword,
                onBlur: _cache[2] || (_cache[2] = ($event) => $data.focusNewPassword = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.newPassword,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.newPassword = $event),
                placeholder: "请输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "newPassword2" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusNewPassword2,
                onBlur: _cache[4] || (_cache[4] = ($event) => $data.focusNewPassword2 = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.newPassword2,
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.formData.newPassword2 = $event),
                placeholder: "请再次输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createElementVNode("button", {
            class: "uni-btn send-btn-box",
            type: "primary",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.submit && $options.submit(...args))
          }, "提交")
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesUserinfoChange_pwdChange_pwd = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd.vue"]]);
  function debounce(func, wait) {
    let timer;
    wait = wait || 500;
    return function() {
      let context = this;
      let args = arguments;
      if (timer)
        clearTimeout(timer);
      let callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      if (callNow)
        func.apply(context, args);
    };
  }
  const _sfc_main$4 = {
    name: "uni-email-code-form",
    model: {
      prop: "modelValue",
      event: "update:modelValue"
    },
    props: {
      event: ["update:modelValue"],
      /**
       * 倒计时时长 s
       */
      count: {
        type: [String, Number],
        default: 60
      },
      /**
       * 邮箱
       */
      email: {
        type: [String],
        default: ""
      },
      /*
      	验证码类型，用于防止不同功能的验证码混用，目前支持的类型login登录、register注册、bind绑定邮箱、unbind解绑邮箱
      */
      type: {
        type: String,
        default() {
          return "register";
        }
      },
      /*
      	验证码输入框是否默认获取焦点
      */
      focusCaptchaInput: {
        type: Boolean,
        default() {
          return false;
        }
      }
    },
    data() {
      return {
        captcha: "",
        reverseNumber: 0,
        reverseTimer: null,
        modelValue: "",
        focusEmailCodeInput: false
      };
    },
    watch: {
      captcha(value, oldValue) {
        if (value.length == 4 && oldValue.length != 4) {
          this.start();
        }
      },
      modelValue(value) {
        this.$emit("input", value);
        this.$emit("update:modelValue", value);
      }
    },
    computed: {
      innerText() {
        if (this.reverseNumber == 0)
          return "获取邮箱验证码";
        return "重新发送(" + this.reverseNumber + "s)";
      }
    },
    created() {
      this.initClick();
    },
    methods: {
      getImageCaptcha(focus) {
        this.$refs.captcha.getImageCaptcha(focus);
      },
      initClick() {
        this.start = debounce(() => {
          if (this.reverseNumber != 0)
            return;
          this.sendMsg();
        });
      },
      sendMsg() {
        if (this.captcha.length != 4) {
          this.$refs.captcha.focusCaptchaInput = true;
          return uni.showToast({
            title: "请先输入图形验证码",
            icon: "none",
            duration: 3e3
          });
        }
        if (!this.email)
          return uni.showToast({
            title: "请输入邮箱",
            icon: "none",
            duration: 3e3
          });
        let reg_email = /@/;
        if (!reg_email.test(this.email))
          return uni.showToast({
            title: "邮箱格式错误",
            icon: "none",
            duration: 3e3
          });
        const uniIdCo2 = Ds.importObject("uni-id-co", {
          customUI: true
        });
        formatAppLog("log", "at uni_modules/uni-id-pages/components/uni-id-pages-email-form/uni-id-pages-email-form.vue:144", "sendEmailCode", {
          "email": this.email,
          "scene": this.type,
          "captcha": this.captcha
        });
        uniIdCo2.sendEmailCode({
          "email": this.email,
          "scene": this.type,
          "captcha": this.captcha
        }).then((result) => {
          uni.showToast({
            title: "邮箱验证码发送成功",
            icon: "none",
            duration: 3e3
          });
          this.reverseNumber = Number(this.count);
          this.getCode();
        }).catch((e2) => {
          if (e2.code == "uni-id-invalid-mail-template") {
            this.modelValue = "123456";
            uni.showToast({
              title: "已启动测试模式,详情【控制台信息】",
              icon: "none",
              duration: 3e3
            });
            formatAppLog("warn", "at uni_modules/uni-id-pages/components/uni-id-pages-email-form/uni-id-pages-email-form.vue:169", e2.message);
          } else {
            this.getImageCaptcha();
            this.captcha = "";
            uni.showToast({
              title: e2.message,
              icon: "none",
              duration: 3e3
            });
          }
        });
      },
      getCode() {
        if (this.reverseNumber == 0) {
          clearTimeout(this.reverseTimer);
          this.reverseTimer = null;
          return;
        }
        this.reverseNumber--;
        this.reverseTimer = setTimeout(() => {
          this.getCode();
        }, 1e3);
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-captcha"), __easycom_0$1);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createVNode(_component_uni_captcha, {
        focus: $props.focusCaptchaInput,
        ref: "captcha",
        scene: "send-email-code",
        modelValue: $data.captcha,
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.captcha = $event)
      }, null, 8, ["focus", "modelValue"]),
      vue.createElementVNode("view", { class: "box" }, [
        vue.createVNode(_component_uni_easyinput, {
          focus: $data.focusEmailCodeInput,
          onBlur: _cache[1] || (_cache[1] = ($event) => $data.focusEmailCodeInput = false),
          type: "number",
          class: "input-box",
          inputBorder: false,
          modelValue: $data.modelValue,
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.modelValue = $event),
          maxlength: "6",
          placeholder: "请输入邮箱验证码"
        }, null, 8, ["focus", "modelValue"]),
        vue.createElementVNode("view", {
          class: "short-code-btn",
          "hover-class": "hover",
          onClick: _cache[3] || (_cache[3] = (...args) => _ctx.start && _ctx.start(...args))
        }, [
          vue.createElementVNode(
            "text",
            {
              class: vue.normalizeClass(["inner-text", $data.reverseNumber == 0 ? "inner-text-active" : ""])
            },
            vue.toDisplayString($options.innerText),
            3
            /* TEXT, CLASS */
          )
        ])
      ])
    ]);
  }
  const __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-bcd6b47b"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/components/uni-id-pages-email-form/uni-id-pages-email-form.vue"]]);
  const uniIdCo$3 = Ds.importObject("uni-id-co");
  const _sfc_main$3 = {
    mixins: [mixin],
    data() {
      return {
        formData: {
          email: "",
          nickname: "",
          password: "",
          password2: "",
          code: ""
        },
        rules: {
          email: {
            rules: [
              {
                required: true,
                errorMessage: "请输入邮箱"
              },
              {
                format: "email",
                errorMessage: "邮箱格式不正确"
              }
            ]
          },
          nickname: {
            rules: [
              {
                minLength: 3,
                maxLength: 32,
                errorMessage: "昵称长度在 {minLength} 到 {maxLength} 个字符"
              },
              {
                validateFunction: function(rule, value, data2, callback) {
                  if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
                    callback("昵称不能是：手机号或邮箱");
                  }
                  if (/^\d+$/.test(value)) {
                    callback("昵称不能为纯数字");
                  }
                  if (/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)) {
                    callback("昵称不能包含中文");
                  }
                  return true;
                }
              }
            ],
            label: "昵称"
          },
          ...passwordMod.getPwdRules(),
          code: {
            rules: [
              {
                required: true,
                errorMessage: "请输入邮箱验证码"
              },
              {
                pattern: /^.{6}$/,
                errorMessage: "邮箱验证码不正确"
              }
            ]
          }
        },
        focusEmail: false,
        focusNickname: false,
        focusPassword: false,
        focusPassword2: false,
        logo: "/static/logo.png"
      };
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    onShow() {
    },
    methods: {
      /**
       * 触发表单提交
       */
      submit() {
        this.$refs.form.validate().then((res) => {
          if (this.needAgreements && !this.agree) {
            return this.$refs.agreements.popup(() => {
              this.submitForm(res);
            });
          }
          this.submitForm(res);
        }).catch((errors) => {
          let key = errors[0].key;
          key = key.replace(key[0], key[0].toUpperCase());
          this["focus" + key] = true;
        });
      },
      submitForm(params) {
        uniIdCo$3.registerUserByEmail(this.formData).then((e2) => {
          uni.navigateTo({
            url: "/uni_modules/uni-id-pages/pages/login/login-withpwd",
            complete: (e3) => {
            }
          });
        }).catch((e2) => {
          formatAppLog("log", "at uni_modules/uni-id-pages/pages/register/register-by-email.vue:163", e2.message);
        });
      },
      navigateBack() {
        uni.navigateBack();
      },
      toLogin() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
      },
      registerByUserName() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/register/register"
        });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_id_pages_email_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-email-form"), __easycom_3);
    const _component_uni_id_pages_agreements = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-agreements"), __easycom_4);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "邮箱验证码注册")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        rules: $data.rules,
        "validate-trigger": "submit",
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, {
            name: "email",
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusEmail,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusEmail = false),
                class: "input-box",
                placeholder: "请输入邮箱",
                modelValue: $data.formData.email,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.email = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "nickname" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusNickname,
                onBlur: _cache[2] || (_cache[2] = ($event) => $data.focusNickname = false),
                class: "input-box",
                placeholder: "请输入用户昵称",
                modelValue: $data.formData.nickname,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.nickname = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, {
            name: "password",
            modelValue: $data.formData.password,
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.formData.password = $event),
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusPassword,
                onBlur: _cache[4] || (_cache[4] = ($event) => $data.focusPassword = false),
                class: "input-box",
                maxlength: "20",
                placeholder: "请输入" + (_ctx.config.passwordStrength == "weak" ? "6" : "8") + "-16位密码",
                type: "password",
                modelValue: $data.formData.password,
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.formData.password = $event),
                trim: "both"
              }, null, 8, ["focus", "placeholder", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["modelValue"]),
          vue.createVNode(_component_uni_forms_item, {
            name: "password2",
            modelValue: $data.formData.password2,
            "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $data.formData.password2 = $event),
            required: ""
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                inputBorder: false,
                focus: $data.focusPassword2,
                onBlur: _cache[7] || (_cache[7] = ($event) => $data.focusPassword2 = false),
                class: "input-box",
                placeholder: "再次输入密码",
                maxlength: "20",
                type: "password",
                modelValue: $data.formData.password2,
                "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.formData.password2 = $event),
                trim: "both"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["modelValue"]),
          vue.createVNode(_component_uni_forms_item, { name: "code" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_id_pages_email_form, {
                ref: "shortCode",
                email: $data.formData.email,
                type: "register",
                modelValue: $data.formData.code,
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.formData.code = $event)
              }, null, 8, ["email", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(
            _component_uni_id_pages_agreements,
            {
              scope: "register",
              ref: "agreements"
            },
            null,
            512
            /* NEED_PATCH */
          ),
          vue.createElementVNode("button", {
            class: "uni-btn",
            type: "primary",
            onClick: _cache[11] || (_cache[11] = (...args) => $options.submit && $options.submit(...args))
          }, "注册"),
          vue.createElementVNode("button", {
            onClick: _cache[12] || (_cache[12] = (...args) => $options.navigateBack && $options.navigateBack(...args)),
            class: "register-back"
          }, "返回"),
          vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "link-box" }, [
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[13] || (_cache[13] = (...args) => $options.registerByUserName && $options.registerByUserName(...args))
                }, "用户名密码注册"),
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[14] || (_cache[14] = (...args) => $options.toLogin && $options.toLogin(...args))
                }, "已有账号？点此登录")
              ])
            ]),
            _: 1
            /* STABLE */
          })
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value", "rules"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesRegisterRegisterByEmail = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/register/register-by-email.vue"]]);
  const uniIdCo$2 = Ds.importObject("uni-id-co", {
    errorOptions: {
      type: "toast"
    }
  });
  const _sfc_main$2 = {
    mixins: [mixin],
    data() {
      return {
        lock: false,
        focusEmail: true,
        focusPassword: false,
        focusPassword2: false,
        formData: {
          "email": "",
          "code": "",
          "password": "",
          "password2": "",
          "captcha": ""
        },
        rules: {
          email: {
            rules: [
              {
                required: true,
                errorMessage: "请输入邮箱"
              },
              {
                format: "email",
                errorMessage: "邮箱格式不正确"
              }
            ]
          },
          code: {
            rules: [
              {
                required: true,
                errorMessage: "请输入邮箱验证码"
              },
              {
                pattern: /^.{6}$/,
                errorMessage: "请输入6位验证码"
              }
            ]
          },
          ...passwordMod.getPwdRules()
        },
        logo: "/static/logo.png"
      };
    },
    computed: {
      isEmail() {
        let reg_email = /@/;
        let isEmail = reg_email.test(this.formData.email);
        return isEmail;
      },
      isPwd() {
        let reg_pwd = /^.{6,20}$/;
        let isPwd = reg_pwd.test(this.formData.password);
        return isPwd;
      },
      isCode() {
        let reg_code = /^\d{6}$/;
        let isCode = reg_code.test(this.formData.code);
        return isCode;
      }
    },
    onLoad(event) {
      if (event && event.emailNumber) {
        this.formData.email = event.emailNumber;
        if (event.lock) {
          this.lock = event.lock;
          this.focusEmail = true;
        }
      }
    },
    onReady() {
      if (this.formData.email) {
        this.$refs.shortCode.start();
      }
      this.$refs.form.setRules(this.rules);
    },
    onShow() {
    },
    methods: {
      /**
       * 完成并提交
       */
      submit() {
        this.$refs.form.validate().then((res) => {
          let {
            email,
            password,
            captcha,
            code
          } = this.formData;
          uniIdCo$2.resetPwdByEmail({
            email,
            code,
            password,
            captcha
          }).then((e2) => {
            uni.navigateTo({
              url: "/uni_modules/uni-id-pages/pages/login/login-withpwd",
              complete: (e3) => {
              }
            });
          }).catch((e2) => {
            if (e2.errCode == "uni-id-captcha-required") {
              this.$refs.popup.open();
            }
          }).finally((e2) => {
            this.formData.captcha = "";
          });
        }).catch((errors) => {
          let key = errors[0].key;
          if (key == "code") {
            return this.$refs.shortCode.focusSmsCodeInput = true;
          }
          key = key.replace(key[0], key[0].toUpperCase());
          this["focus" + key] = true;
        });
      },
      retrieveByPhone() {
        uni.navigateTo({
          url: "/uni_modules/uni-id-pages/pages/retrieve/retrieve"
        });
      },
      backLogin() {
        uni.redirectTo({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_id_pages_email_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-email-form"), __easycom_3);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    const _component_uni_popup_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-popup-captcha"), __easycom_5);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "通过邮箱验证码找回密码")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        ref: "form",
        value: $data.formData,
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_uni_forms_item, { name: "email" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusEmail,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusEmail = false),
                class: "input-box",
                disabled: $data.lock,
                inputBorder: false,
                modelValue: $data.formData.email,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.email = $event),
                placeholder: "请输入邮箱"
              }, null, 8, ["focus", "disabled", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "code" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_id_pages_email_form, {
                ref: "shortCode",
                email: $data.formData.email,
                type: "reset-pwd-by-email",
                modelValue: $data.formData.code,
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.formData.code = $event)
              }, null, 8, ["email", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "password" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPassword,
                onBlur: _cache[3] || (_cache[3] = ($event) => $data.focusPassword = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.password,
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.password = $event),
                placeholder: "请输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_forms_item, { name: "password2" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusPassword2,
                onBlur: _cache[5] || (_cache[5] = ($event) => $data.focusPassword2 = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.password2,
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.formData.password2 = $event),
                placeholder: "请再次输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createElementVNode("button", {
            class: "uni-btn send-btn-box",
            type: "primary",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.submit && $options.submit(...args))
          }, "提交"),
          vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "link-box" }, [
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[8] || (_cache[8] = (...args) => $options.retrieveByPhone && $options.retrieveByPhone(...args))
                }, "通过手机验证码找回密码"),
                vue.createElementVNode("view"),
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[9] || (_cache[9] = (...args) => $options.backLogin && $options.backLogin(...args))
                }, "返回登录")
              ])
            ]),
            _: 1
            /* STABLE */
          })
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value"]),
      vue.createVNode(_component_uni_popup_captcha, {
        onConfirm: $options.submit,
        modelValue: $data.formData.captcha,
        "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.formData.captcha = $event),
        scene: "reset-pwd-by-sms",
        ref: "popup"
      }, null, 8, ["onConfirm", "modelValue"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesRetrieveRetrieveByEmail = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/retrieve/retrieve-by-email.vue"]]);
  const uniIdCo$1 = Ds.importObject("uni-id-co", {
    customUI: true
  });
  const _sfc_main$1 = {
    name: "set-pwd.vue",
    data() {
      return {
        uniIdRedirectUrl: "",
        loginType: "",
        logo: "/static/logo.png",
        focusNewPassword: false,
        focusNewPassword2: false,
        allowSkip: false,
        formData: {
          code: "",
          captcha: "",
          newPassword: "",
          newPassword2: ""
        },
        rules: passwordMod.getPwdRules("newPassword", "newPassword2")
      };
    },
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules);
    },
    onLoad(e2) {
      var _a;
      this.uniIdRedirectUrl = e2.uniIdRedirectUrl;
      this.loginType = e2.loginType;
      if (config.setPasswordAfterLogin && ((_a = config.setPasswordAfterLogin) == null ? void 0 : _a.allowSkip)) {
        this.allowSkip = true;
      }
    },
    methods: {
      submit() {
        if (!/^\d{6}$/.test(this.formData.code)) {
          this.$refs.smsCode.focusSmsCodeInput = true;
          return uni.showToast({
            title: "验证码格式不正确",
            icon: "none"
          });
        }
        this.$refs.form.validate().then((res) => {
          uniIdCo$1.setPwd({
            password: this.formData.newPassword,
            code: this.formData.code,
            captcha: this.formData.captcha
          }).then((e2) => {
            uni.showModal({
              content: "密码设置成功",
              showCancel: false,
              success: () => {
                mutations.loginBack({
                  uniIdRedirectUrl: this.uniIdRedirectUrl,
                  loginType: this.loginType
                });
              }
            });
          }).catch((e2) => {
            uni.showModal({
              content: e2.message,
              showCancel: false
            });
          });
        }).catch((e2) => {
          if (e2.errCode == "uni-id-captcha-required") {
            this.$refs.popup.open();
          } else {
            formatAppLog("log", "at uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd.vue:117", e2.errMsg);
          }
        }).finally((e2) => {
          this.formData.captcha = "";
        });
      },
      skip() {
        mutations.loginBack(this.uniIdRedirectUrl);
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_match_media = resolveEasycom(vue.resolveDynamicComponent("uni-match-media"), __easycom_0);
    const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_1$2);
    const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_2$1);
    const _component_uni_id_pages_sms_form = resolveEasycom(vue.resolveDynamicComponent("uni-id-pages-sms-form"), __easycom_3$1);
    const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4$1);
    const _component_uni_popup_captcha = resolveEasycom(vue.resolveDynamicComponent("uni-popup-captcha"), __easycom_5);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-content" }, [
      vue.createVNode(_component_uni_match_media, { "min-width": 690 }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "login-logo" }, [
            vue.createElementVNode("image", { src: $data.logo }, null, 8, ["src"])
          ]),
          vue.createCommentVNode(" 顶部文字 "),
          vue.createElementVNode("text", { class: "title title-box" }, "设置密码")
        ]),
        _: 1
        /* STABLE */
      }),
      vue.createVNode(_component_uni_forms, {
        class: "set-password-form",
        ref: "form",
        value: $data.formData,
        "err-show-type": "toast"
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("text", { class: "tip" }, "输入密码"),
          vue.createVNode(_component_uni_forms_item, { name: "newPassword" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusNewPassword,
                onBlur: _cache[0] || (_cache[0] = ($event) => $data.focusNewPassword = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.newPassword,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.formData.newPassword = $event),
                placeholder: "请输入密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createElementVNode("text", { class: "tip" }, "再次输入密码"),
          vue.createVNode(_component_uni_forms_item, { name: "newPassword2" }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_easyinput, {
                focus: $data.focusNewPassword2,
                onBlur: _cache[2] || (_cache[2] = ($event) => $data.focusNewPassword2 = false),
                class: "input-box",
                type: "password",
                inputBorder: false,
                modelValue: $data.formData.newPassword2,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.newPassword2 = $event),
                placeholder: "请再次输入新密码"
              }, null, 8, ["focus", "modelValue"])
            ]),
            _: 1
            /* STABLE */
          }),
          vue.createVNode(_component_uni_id_pages_sms_form, {
            modelValue: $data.formData.code,
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.code = $event),
            type: "set-pwd-by-sms",
            ref: "smsCode",
            phone: $options.userInfo.mobile
          }, null, 8, ["modelValue", "phone"]),
          vue.createElementVNode("view", { class: "link-box" }, [
            vue.createElementVNode("button", {
              class: "uni-btn send-btn",
              type: "primary",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.submit && $options.submit(...args))
            }, "确认"),
            $data.allowSkip ? (vue.openBlock(), vue.createElementBlock("button", {
              key: 0,
              class: "uni-btn send-btn",
              type: "default",
              onClick: _cache[6] || (_cache[6] = (...args) => $options.skip && $options.skip(...args))
            }, "跳过")) : vue.createCommentVNode("v-if", true)
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["value"]),
      vue.createVNode(_component_uni_popup_captcha, {
        onConfirm: $options.submit,
        modelValue: $data.formData.captcha,
        "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.formData.captcha = $event),
        scene: "set-pwd-by-sms",
        ref: "popup"
      }, null, 8, ["onConfirm", "modelValue"])
    ]);
  }
  const Uni_modulesUniIdPagesPagesUserinfoSetPwdSetPwd = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-e5e1f63f"], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd.vue"]]);
  __definePage("pages/grid/grid", PagesGridGrid);
  __definePage("pages/list/detail", PagesListDetail);
  __definePage("pages/ucenter/ucenter", PagesUcenterUcenter);
  __definePage("pages/ucenter/settings/settings", PagesUcenterSettingsSettings);
  __definePage("pages/ucenter/read-news-log/read-news-log", PagesUcenterReadNewsLogReadNewsLog);
  __definePage("pages/ucenter/about/about", PagesUcenterAboutAbout);
  __definePage("uni_modules/uni-upgrade-center-app/pages/upgrade-popup", Uni_modulesUniUpgradeCenterAppPagesUpgradePopup);
  __definePage("pages/ucenter/invite/invite", PagesUcenterInviteInvite);
  __definePage("uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback", Uni_modulesUniFeedbackPagesOpendbFeedbackOpendbFeedback);
  __definePage("uni_modules/uni-id-pages/pages/userinfo/userinfo", Uni_modulesUniIdPagesPagesUserinfoUserinfo);
  __definePage("uni_modules/uni-id-pages/pages/login/login-withpwd", Uni_modulesUniIdPagesPagesLoginLoginWithpwd);
  __definePage("uni_modules/uni-id-pages/pages/login/login-withoutpwd", Uni_modulesUniIdPagesPagesLoginLoginWithoutpwd);
  __definePage("uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate", Uni_modulesUniIdPagesPagesUserinfoDeactivateDeactivate);
  __definePage("uni_modules/uni-id-pages/pages/userinfo/bind-mobile/bind-mobile", Uni_modulesUniIdPagesPagesUserinfoBindMobileBindMobile);
  __definePage("uni_modules/uni-id-pages/pages/login/login-smscode", Uni_modulesUniIdPagesPagesLoginLoginSmscode);
  __definePage("uni_modules/uni-id-pages/pages/register/register", Uni_modulesUniIdPagesPagesRegisterRegister);
  __definePage("uni_modules/uni-id-pages/pages/retrieve/retrieve", Uni_modulesUniIdPagesPagesRetrieveRetrieve);
  __definePage("uni_modules/uni-id-pages/pages/common/webview/webview", Uni_modulesUniIdPagesPagesCommonWebviewWebview);
  __definePage("uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd", Uni_modulesUniIdPagesPagesUserinfoChange_pwdChange_pwd);
  __definePage("uni_modules/uni-id-pages/pages/register/register-by-email", Uni_modulesUniIdPagesPagesRegisterRegisterByEmail);
  __definePage("uni_modules/uni-id-pages/pages/retrieve/retrieve-by-email", Uni_modulesUniIdPagesPagesRetrieveRetrieveByEmail);
  __definePage("uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd", Uni_modulesUniIdPagesPagesUserinfoSetPwdSetPwd);
  function initPushNotification() {
    if (typeof plus !== "undefined" && plus.push) {
      plus.globalEvent.addEventListener("newPath", ({ path }) => {
        if (!path) {
          return;
        }
        const pages2 = getCurrentPages();
        const currentPage = pages2[pages2.length - 1];
        if (currentPage && currentPage.$page && currentPage.$page.fullPath === path) {
          return;
        }
        uni.navigateTo({
          url: path,
          fail(res) {
            if (res.errMsg.indexOf("tabbar") > -1) {
              uni.switchTab({
                url: path,
                fail(res2) {
                  console.error(res2.errMsg);
                }
              });
            } else {
              console.error(res.errMsg);
            }
          }
        });
      });
    }
  }
  uni.invokePushCallback({
    type: "enabled",
    offline: true
  });
  Promise.resolve().then(() => {
    initPushNotification();
    plus.push.setAutoNotification && plus.push.setAutoNotification(false);
  });
  const uniStarterConfig = {
    "h5": {
      "url": "https://uni-starter.dcloud.net.cn",
      //	前端网页托管的域名	
      // 在h5端全局悬浮引导用户下载app的功能 更多自定义要求在/common/openApp.js中修改	
      "openApp": {
        //如不需要本功能直接移除本节点即可	
        // //点击悬浮下载栏后打开的网页链接
        // "openUrl": '/#/pages/ucenter/invite/invite',
        // //左侧显示的应用名称	
        // "appname": 'uni-starter',
        // //应用的图标	
        // "logo": './static/logo.png',
      }
    },
    "mp": {
      "weixin": {
        //微信小程序原始id，微信小程序分享时
        "id": ""
      }
    },
    //关于应用
    "about": {
      //应用名称
      "appName": "uni-starter",
      //应用logo
      "logo": "/static/logo.png",
      //公司名称
      "company": "北京xx网络技术有限公司",
      //口号
      "slogan": "云端一体应用快速开发模版",
      //应用的链接，用于分享到第三方平台和生成关于我们页的二维码
      "download": "https://itunes.apple.com/cn/app/hello-uni-app/id1417078253?mt=8",
      //version
      "version": "1.0.0"
      //用于非app端显示，app端自动获取
    },
    "download": {
      //用于生成二合一下载页面
      "ios": "https://itunes.apple.com/cn/app/hello-uni-app/id1417078253?mt=8",
      "android": "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-97fca9f2-41f6-449f-a35e-3f135d4c3875/6d754387-a6c3-48ed-8ad2-e8f39b40fc01.apk"
    },
    //用于打开应用市场评分界面
    "marketId": {
      "ios": "",
      "android": ""
    },
    //配置多语言国际化。i18n为英文单词 internationalization的首末字符i和n，18为中间的字符数 是“国际化”的简称
    "i18n": {
      "enable": false
      //默认关闭，国际化。如果你想使用国际化相关功能，请改为true
    }
  };
  function interceptorChooseImage() {
    uni.addInterceptor("chooseImage", {
      fail(e2) {
        formatAppLog("log", "at uni_modules/json-interceptor-chooseImage/js_sdk/main.js:5", e2);
        if (uni.getSystemInfoSync().platform == "android" && e2.errMsg == "chooseImage:fail No Permission") {
          if (e2.code === 11) {
            uni.showModal({
              title: "无法访问摄像头",
              content: "当前无摄像头访问权限，建议前往设置",
              confirmText: "前往设置",
              success(e3) {
                if (e3.confirm) {
                  gotoAppPermissionSetting();
                }
              }
            });
          } else {
            uni.showModal({
              title: "无法访问相册",
              content: "当前无系统相册访问权限，建议前往设置",
              confirmText: "前往设置",
              success(e3) {
                if (e3.confirm) {
                  gotoAppPermissionSetting();
                }
              }
            });
          }
        } else if (e2.errCode === 2 && e2.errMsg == "chooseImage:fail No filming permission") {
          formatAppLog("log", "at uni_modules/json-interceptor-chooseImage/js_sdk/main.js:31", "e.errMsg === 2  ios无法拍照权限 ");
          uni.showModal({
            title: "无法访问摄像头",
            content: "当前无摄像头访问权限，建议前往设置",
            confirmText: "前往设置",
            success(e3) {
              if (e3.confirm) {
                gotoAppPermissionSetting();
              }
            }
          });
        }
      }
    });
    function gotoAppPermissionSetting() {
      if (uni.getSystemInfoSync().platform == "ios") {
        var UIApplication = plus.ios.import("UIApplication");
        var application2 = UIApplication.sharedApplication();
        var NSURL2 = plus.ios.import("NSURL");
        var setting2 = NSURL2.URLWithString("app-settings:");
        application2.openURL(setting2);
        plus.ios.deleteObject(setting2);
        plus.ios.deleteObject(NSURL2);
        plus.ios.deleteObject(application2);
      } else {
        var Intent = plus.android.importClass("android.content.Intent");
        var Settings = plus.android.importClass("android.provider.Settings");
        var Uri = plus.android.importClass("android.net.Uri");
        var mainActivity = plus.android.runtimeMainActivity();
        var intent = new Intent();
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        var uri = Uri.fromParts("package", mainActivity.getPackageName(), null);
        intent.setData(uri);
        mainActivity.startActivity(intent);
      }
    }
  }
  interceptorChooseImage();
  const db = Ds.database();
  async function initApp() {
    uniStarterConfig.debug;
    setTimeout(() => {
      getApp({
        allowDefault: true
      }).globalData.config = uniStarterConfig;
    }, 1);
    initAppVersion();
    function onDBError({
      code,
      // 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
      message
    }) {
      formatAppLog("log", "at common/appInit.js:32", "onDBError", {
        code,
        message
      });
      formatAppLog("error", "at common/appInit.js:37", code, message);
    }
    db.on("error", onDBError);
    Ds.interceptObject({
      async invoke({
        objectName,
        // 云对象名称
        methodName,
        // 云对象的方法名称
        params
        // 参数列表
      }) {
        if (objectName == "uni-id-co" && (methodName.includes("loginBy") || ["login", "registerUser"].includes(methodName))) {
          formatAppLog("log", "at common/appInit.js:56", "执行登录相关云对象");
          params[0].inviteCode = await new Promise((callBack) => {
            uni.getClipboardData({
              success: function(res) {
                formatAppLog("log", "at common/appInit.js:60", "剪切板内容：" + res.data);
                if (res.data.slice(0, 18) == "uniInvitationCode:") {
                  let uniInvitationCode = res.data.slice(18, 38);
                  formatAppLog("log", "at common/appInit.js:63", "当前用户是其他用户推荐下载的,推荐者的code是：" + uniInvitationCode);
                  callBack(uniInvitationCode);
                } else {
                  callBack();
                }
              },
              fail() {
                formatAppLog("log", "at common/appInit.js:75", "error--");
                callBack();
              },
              complete() {
              }
            });
          });
        }
      },
      success(e2) {
        formatAppLog("log", "at common/appInit.js:90", e2);
      },
      complete() {
      },
      fail(e2) {
        formatAppLog("error", "at common/appInit.js:96", e2);
      }
    });
    uni.onNetworkStatusChange((res) => {
      formatAppLog("log", "at common/appInit.js:115", res.isConnected);
      formatAppLog("log", "at common/appInit.js:116", res.networkType);
      if (res.networkType != "none") {
        uni.showToast({
          title: "当前网络类型：" + res.networkType,
          icon: "none",
          duration: 3e3
        });
      } else {
        uni.showToast({
          title: "网络类型：" + res.networkType,
          icon: "none",
          duration: 3e3
        });
      }
    });
  }
  function initAppVersion() {
    let appid = plus.runtime.appid;
    plus.runtime.getProperty(appid, (wgtInfo) => {
      let appVersion = plus.runtime;
      let currentVersion = appVersion.versionCode > wgtInfo.versionCode ? appVersion : wgtInfo;
      getApp({
        allowDefault: true
      }).appVersion = {
        ...currentVersion,
        appid,
        hasNew: false
      };
      callCheckVersion().then((res) => {
        if (res.result.code > 0) {
          getApp({
            allowDefault: true
          }).appVersion.hasNew = true;
          formatAppLog("log", "at common/appInit.js:158", checkUpdate());
        }
      });
    });
  }
  uniStarterConfig.h5.openApp || {};
  const uniIdCo = Ds.importObject("uni-id-co", {
    customUI: true
  });
  const {
    loginTypes,
    debug
  } = config;
  async function uniIdPageInit() {
    if (debug) {
      let {
        supportedLoginType
      } = await uniIdCo.getSupportedLoginType();
      formatAppLog("log", "at uni_modules/uni-id-pages/init.js:22", "supportedLoginType: " + JSON.stringify(supportedLoginType));
      let data2 = {
        smsCode: "mobile-code",
        univerify: "univerify",
        username: "username-password",
        weixin: "weixin",
        qq: "qq",
        xiaomi: "xiaomi",
        sinaweibo: "sinaweibo",
        taobao: "taobao",
        facebook: "facebook",
        google: "google",
        alipay: "alipay",
        apple: "apple"
      };
      let list = loginTypes.filter((type) => !supportedLoginType.includes(data2[type]));
      if (list.length) {
        formatAppLog(
          "error",
          "at uni_modules/uni-id-pages/init.js:41",
          `错误：前端启用的登录方式:${list.join("，")};没有在服务端完成配置。配置文件路径："/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json"`
        );
      }
    }
    if (loginTypes.includes("univerify")) {
      uni.preLogin({
        provider: "univerify",
        complete: (e2) => {
        }
      });
    }
    const db2 = Ds.database();
    db2.on("error", onDBError);
    function onDBError({
      code,
      // 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
      message
    }) {
    }
    if (Ds.onRefreshToken) {
      Ds.onRefreshToken(() => {
        if (uni.getPushClientId) {
          uni.getPushClientId({
            success: async function(e2) {
              let pushClientId = e2.cid;
              await uniIdCo.setPushCid({
                pushClientId
              });
            },
            fail(e2) {
              formatAppLog("log", "at uni_modules/uni-id-pages/init.js:90", e2);
            }
          });
        }
      });
    }
  }
  const _sfc_main = {
    globalData: {
      searchText: "",
      appVersion: {},
      config: {},
      $i18n: {},
      $t: {}
    },
    onLaunch: function() {
      formatAppLog("log", "at App.vue:18", "App Launch");
      this.globalData.$i18n = this.$i18n;
      this.globalData.$t = (str) => this.$t(str);
      initApp();
      uniIdPageInit();
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:46", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:49", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "G:/HBuilderProjects/Toby/App.vue"]]);
  const langEn = {
    tabbar: "List,Grid,contacts,Mine",
    agreementsTitle: "User service agreement,Privacy policy",
    common: {
      wechatFriends: "friends",
      wechatBbs: "bbs",
      weibo: "weibo",
      more: "more",
      agree: "agree",
      copy: "copy",
      wechatApplet: "applet",
      cancelShare: "cancel sharing",
      updateSucceeded: "update succeeded",
      phonePlaceholder: "Please enter your mobile phone number",
      verifyCodePlaceholder: "Please enter the verification code",
      newPasswordPlaceholder: "Please enter a new password",
      confirmNewPasswordPlaceholder: "Please confirm the new password",
      confirmPassword: "Please confirm the password",
      verifyCodeSend: "Verification code has been sent to via SMS",
      passwordDigits: "The password is 6 - 20 digits",
      getVerifyCode: "Get Code",
      noAgree: "You have not agreed to the privacy policy agreement",
      gotIt: "got it",
      login: "sign in",
      error: "error",
      complete: "complete",
      submit: "Submit",
      formatErr: "Incorrect mobile phone number format",
      sixDigitCode: "Please enter a 6-digit verification code",
      resetNavTitle: "Reset password"
    },
    list: {
      inputPlaceholder: "Please enter the search content"
    },
    search: {
      cancelText: "cancel",
      searchHistory: "search history",
      searchDiscovery: "search discovery",
      deleteAll: "delete all",
      delete: "delete",
      deleteTip: "Are you sure to clear the search history ?",
      complete: "complete",
      searchHiddenTip: "Current search found hidden"
    },
    grid: {
      grid: "Grid Assembly",
      visibleToAll: "Visible to all",
      invisibleToTourists: "Invisible to tourists",
      adminVisible: "Admin visible",
      clickTip: "Click the",
      clickTipGrid: "grid"
    },
    mine: {
      showText: "Text",
      signIn: "Check In Reward",
      signInByAd: "Check In Reward By AD",
      toEvaluate: "To Evaluate",
      readArticles: "Read Articles",
      myScore: "My Score",
      invite: "Invite Friends",
      feedback: "Problems And Feedback",
      settings: "Settings",
      about: "About",
      checkUpdate: "Check for Updates",
      clicked: "You Clicked",
      checkScore: "Please check your points after logging in",
      currentScore: "The current score is ",
      noScore: "There are currently no points",
      notLogged: "not logged in"
    },
    userinfo: {
      navigationBarTitle: "My Profile",
      ProfilePhoto: "Profile Photo",
      nickname: "Nickname",
      notSet: "not set",
      phoneNumber: "Phone Number",
      notSpecified: "Not Specified",
      setNickname: "Set Nickname ",
      setNicknamePlaceholder: "Please enter a nickname to set",
      bindPhoneNumber: "One click binding of local number",
      bindOtherLogin: "Other number binding",
      noChange: "No change",
      uploading: "uploading",
      requestFail: "Request for service failed",
      setting: "setting",
      deleteSucceeded: "Delete succeeded",
      setSucceeded: "Set successfully"
    },
    smsCode: {
      resendVerifyCode: "resend",
      phoneErrTip: "Mobile phone number format error",
      sendSuccessTip: "SMS verification code sent successfully"
    },
    loadMore: {
      noData: "No Data",
      noNetwork: "Network error",
      toSet: "Go to settings",
      error: "error"
    },
    uniFeedback: {
      navigationBarTitle: "Problems and feedback",
      msgTitle: "Message content",
      imgTitle: "Picture list",
      contacts: "contacts",
      phone: "contact number",
      submit: "submit"
    },
    settings: {
      navigationBarTitle: "Settings",
      userInfo: "Personal Data",
      changePassword: "change password",
      clearTmp: "clean cache",
      pushServer: "push function",
      fingerPrint: "fingerprint unlock",
      facial: "face unlock",
      deactivate: "Deactivate",
      logOut: "Logout",
      login: "Login",
      changeLanguage: "Language",
      please: "please",
      successText: "success",
      failTip: "Authentication failed. Please try again",
      authFailed: "authentication failed",
      deviceNoOpen: "The device is not turned on",
      fail: "fail",
      tips: "tips",
      exitLogin: "Do you want to log out？",
      cancelText: "cancel",
      confirmText: "confirm",
      clearing: "clearing",
      clearedSuccessed: "Cleared successfully"
    },
    deactivate: {
      cancelText: "cancel",
      nextStep: "next step",
      navigationBarTitle: "Logout prompt"
    },
    about: {
      sacnQR: "Scan the QR Code and your friends can also download it",
      client: "applCantion",
      and: "And",
      about: "About"
    },
    invite: {
      download: "Download"
    },
    login: {
      phoneLogin: "After logging in, you can show yourself",
      phoneLoginTip: "Unregistered mobile phone numbers will be automatically registered after verification",
      getVerifyCode: "Get Code"
    },
    uniQuickLogin: {
      accountLogin: "Account",
      SMSLogin: "SMS",
      wechatLogin: "wechat",
      appleLogin: "Apple",
      oneClickLogin: "One click login",
      QQLogin: "QQ",
      xiaomiLogin: "Xiaomi",
      getProviderFail: "Failed to get service provider",
      loginErr: "Login service initialization error",
      chooseOtherLogin: "Click the third-party login"
    },
    pwdLogin: {
      pwdLogin: "User name password login",
      placeholder: "Please enter mobile number / user name",
      passwordPlaceholder: "Please input a password",
      verifyCodePlaceholder: "Please enter the verification code",
      login: "sign in",
      forgetPassword: "Forget password",
      register: "Registered account"
    },
    register: {
      navigationBarTitle: "register",
      usernamePlaceholder: "Please enter user name",
      nicknamePlaceholder: "Please enter user nickname",
      passwordDigitsPlaceholder: "Please enter a 6-20 digit password",
      passwordAgain: "Enter the password again",
      registerAndLogin: "Register and log in"
    },
    listDetail: {
      follow: "Click follow",
      newsErr: "Error, news ID is empty"
    },
    newsLog: {
      navigationBarTitle: "Reading Log"
    },
    bindMobile: {
      navigationBarTitle: "Bind Mobile"
    }
  };
  const zhHans = {
    tabbar: "列表,宫格,通讯录,我的",
    agreementsTitle: "用户服务协议,隐私政策",
    common: {
      wechatFriends: "微信好友",
      wechatBbs: "微信朋友圈",
      weibo: "微博",
      more: "更多",
      agree: "同意",
      copy: "复制",
      wechatApplet: "微信小程序",
      cancelShare: "取消分享",
      updateSucceeded: "更新成功",
      phonePlaceholder: "请输入手机号",
      verifyCodePlaceholder: "请输入验证码",
      newPasswordPlaceholder: "请输入新密码",
      confirmNewPasswordPlaceholder: "请确认新密码",
      confirmPassword: "请确认密码",
      verifyCodeSend: "验证码已通过短信发送至",
      passwordDigits: "密码为6 - 20位",
      getVerifyCode: "获取验证码",
      noAgree: "你未同意隐私政策协议",
      gotIt: "知道了",
      login: "登录",
      error: "错误",
      complete: "完成",
      submit: "提交",
      formatErr: "手机号码格式不正确",
      sixDigitCode: "请输入6位验证码",
      resetNavTitle: "重置密码"
    },
    list: {
      inputPlaceholder: "请输入搜索内容"
    },
    search: {
      cancelText: "取消",
      searchHistory: "搜索历史",
      searchDiscovery: "搜索发现",
      deleteAll: "全部删除",
      delete: "删除",
      deleteTip: "确认清空搜索历史吗？",
      complete: "完成",
      searchHiddenTip: "当前搜索发现已隐藏"
    },
    grid: {
      grid: "宫格组件",
      visibleToAll: "所有人可见",
      invisibleToTourists: "游客不可见",
      adminVisible: "管理员可见",
      clickTip: "点击第",
      clickTipGrid: "个宫格"
    },
    mine: {
      showText: "文字",
      signIn: "普通签到",
      signInByAd: "看广告签到",
      toEvaluate: "去评分",
      readArticles: "阅读过的文章",
      myScore: "我的积分",
      invite: "分销推荐",
      feedback: "问题与反馈",
      settings: "设置",
      checkUpdate: "检查更新",
      about: "关于",
      clicked: "你点击了",
      checkScore: "请登录后查看积分",
      currentScore: "当前积分为",
      noScore: "当前无积分",
      notLogged: "未登录"
    },
    userinfo: {
      navigationBarTitle: "个人资料",
      ProfilePhoto: "头像",
      nickname: "昵称",
      notSet: "未设置",
      phoneNumber: "手机号",
      notSpecified: "未绑定",
      setNickname: "设置昵称",
      setNicknamePlaceholder: "请输入要设置的昵称",
      bindPhoneNumber: "本机号码一键绑定",
      bindOtherLogin: "其他号码绑定",
      noChange: "没有变化",
      uploading: "正在上传",
      requestFail: "请求服务失败",
      setting: "设置中",
      deleteSucceeded: "删除成功",
      setSucceeded: "设置成功"
    },
    smsCode: {
      resendVerifyCode: "重新发送",
      phoneErrTip: "手机号格式错误",
      sendSuccessTip: "短信验证码发送成功"
    },
    loadMore: {
      noData: "暂无数据",
      noNetwork: "网络异常",
      toSet: "前往设置",
      error: "错误"
    },
    uniFeedback: {
      navigationBarTitle: "问题与反馈",
      msgTitle: "留言内容",
      imgTitle: "图片列表",
      contacts: "联系人",
      phone: "联系电话",
      submit: "提交"
    },
    settings: {
      navigationBarTitle: "设置",
      userInfo: "账号资料",
      changePassword: "修改密码",
      clearTmp: "清理缓存",
      pushServer: "推送功能",
      fingerPrint: "指纹解锁",
      facial: "人脸解锁",
      deactivate: "注销账号",
      logOut: "退出登录",
      login: "登录",
      failTip: "认证失败请重试",
      authFailed: "认证失败",
      changeLanguage: "切换语言",
      please: "请用",
      successText: "成功",
      deviceNoOpen: "设备未开启",
      fail: "失败",
      tips: "提示",
      exitLogin: "是否退出登录?",
      clearing: "清除中",
      clearedSuccessed: "清除成功",
      confirmText: "确定",
      cancelText: "取消"
    },
    deactivate: {
      cancelText: "取消",
      nextStep: "下一步",
      navigationBarTitle: "注销提示"
    },
    about: {
      sacnQR: "扫描二维码，您的朋友也可以下载",
      client: "客户端",
      and: "和",
      about: "关于"
    },
    invite: {
      download: "下载"
    },
    login: {
      phoneLogin: "登录后即可展示自己",
      phoneLoginTip: "未注册的手机号验证通过后将自动注册",
      getVerifyCode: "获取验证码"
    },
    uniQuickLogin: {
      accountLogin: "账号登录",
      SMSLogin: "短信验证码",
      wechatLogin: "微信登录",
      appleLogin: "苹果登录",
      oneClickLogin: "一键登录",
      QQLogin: "QQ登录",
      xiaomiLogin: "小米登录",
      getProviderFail: "获取服务供应商失败",
      loginErr: "登录服务初始化错误",
      chooseOtherLogin: "点击了第三方登录"
    },
    pwdLogin: {
      pwdLogin: "用户名密码登录",
      placeholder: "请输入手机号/用户名",
      passwordPlaceholder: "请输入密码",
      verifyCodePlaceholder: "请输入验证码",
      login: "登录",
      forgetPassword: "忘记密码",
      register: "注册账号"
    },
    register: {
      navigationBarTitle: "注册",
      usernamePlaceholder: "请输入用户名",
      nicknamePlaceholder: "请输入用户昵称",
      registerAndLogin: "注册并登录",
      passwordDigitsPlaceholder: "请输入6-20位密码",
      passwordAgain: "再次输入密码"
    },
    listDetail: {
      follow: "点击关注",
      newsErr: "出错了，新闻ID为空"
    },
    newsLog: {
      navigationBarTitle: "阅读记录"
    },
    bindMobile: {
      navigationBarTitle: "绑定手机号码"
    }
  };
  /*!
    * @intlify/shared v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const inBrowser = typeof window !== "undefined";
  let mark;
  let measure;
  {
    const perf = inBrowser && window.performance;
    if (perf && perf.mark && perf.measure && perf.clearMarks && perf.clearMeasures) {
      mark = (tag) => perf.mark(tag);
      measure = (name, startTag, endTag) => {
        perf.measure(name, startTag, endTag);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
      };
    }
  }
  const RE_ARGS = /\{([0-9a-zA-Z]+)\}/g;
  function format(message, ...args) {
    if (args.length === 1 && isObject$1(args[0])) {
      args = args[0];
    }
    if (!args || !args.hasOwnProperty) {
      args = {};
    }
    return message.replace(RE_ARGS, (match, identifier) => {
      return args.hasOwnProperty(identifier) ? args[identifier] : "";
    });
  }
  const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const makeSymbol = (name) => hasSymbol ? Symbol(name) : name;
  const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
  const friendlyJSONstringify = (json) => JSON.stringify(json).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
  const isNumber = (val) => typeof val === "number" && isFinite(val);
  const isDate = (val) => toTypeString(val) === "[object Date]";
  const isRegExp = (val) => toTypeString(val) === "[object RegExp]";
  const isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
  function warn(msg, err) {
    if (typeof console !== "undefined") {
      console.warn(`[intlify] ` + msg);
      if (err) {
        console.warn(err.stack);
      }
    }
  }
  const assign = Object.assign;
  let _globalThis;
  const getGlobalThis = () => {
    return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
  };
  function escapeHtml(rawText) {
    return rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  function hasOwn$1(obj, key) {
    return hasOwnProperty$1.call(obj, key);
  }
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === "function";
  const isString = (val) => typeof val === "string";
  const isBoolean = (val) => typeof val === "boolean";
  const isObject$1 = (val) => (
    // eslint-disable-line
    val !== null && typeof val === "object"
  );
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const isPlainObject = (val) => toTypeString(val) === "[object Object]";
  const toDisplayString = (val) => {
    return val == null ? "" : isArray(val) || isPlainObject(val) && val.toString === objectToString ? JSON.stringify(val, null, 2) : String(val);
  };
  const RANGE = 2;
  function generateCodeFrame(source, start = 0, end = source.length) {
    const lines = source.split(/\r?\n/);
    let count = 0;
    const res = [];
    for (let i2 = 0; i2 < lines.length; i2++) {
      count += lines[i2].length + 1;
      if (count >= start) {
        for (let j2 = i2 - RANGE; j2 <= i2 + RANGE || end > count; j2++) {
          if (j2 < 0 || j2 >= lines.length)
            continue;
          const line = j2 + 1;
          res.push(`${line}${" ".repeat(3 - String(line).length)}|  ${lines[j2]}`);
          const lineLength = lines[j2].length;
          if (j2 === i2) {
            const pad2 = start - (count - lineLength) + 1;
            const length = Math.max(1, end > count ? lineLength - pad2 : end - start);
            res.push(`   |  ` + " ".repeat(pad2) + "^".repeat(length));
          } else if (j2 > i2) {
            if (end > count) {
              const length = Math.max(Math.min(end - count, lineLength), 1);
              res.push(`   |  ` + "^".repeat(length));
            }
            count += lineLength + 1;
          }
        }
        break;
      }
    }
    return res.join("\n");
  }
  function createEmitter() {
    const events2 = /* @__PURE__ */ new Map();
    const emitter = {
      events: events2,
      on(event, handler) {
        const handlers = events2.get(event);
        const added = handlers && handlers.push(handler);
        if (!added) {
          events2.set(event, [handler]);
        }
      },
      off(event, handler) {
        const handlers = events2.get(event);
        if (handlers) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        }
      },
      emit(event, payload) {
        (events2.get(event) || []).slice().map((handler) => handler(payload));
        (events2.get("*") || []).slice().map((handler) => handler(event, payload));
      }
    };
    return emitter;
  }
  /*!
    * @intlify/message-resolver v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
  }
  const isObject = (val) => (
    // eslint-disable-line
    val !== null && typeof val === "object"
  );
  const pathStateMachine = [];
  pathStateMachine[
    0
    /* BEFORE_PATH */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      0
      /* BEFORE_PATH */
    ],
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4
      /* IN_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7
      /* AFTER_PATH */
    ]
  };
  pathStateMachine[
    1
    /* IN_PATH */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      1
      /* IN_PATH */
    ],
    [
      "."
      /* DOT */
    ]: [
      2
      /* BEFORE_IDENT */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4
      /* IN_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7
      /* AFTER_PATH */
    ]
  };
  pathStateMachine[
    2
    /* BEFORE_IDENT */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      2
      /* BEFORE_IDENT */
    ],
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "0"
      /* ZERO */
    ]: [
      3,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    3
    /* IN_IDENT */
  ] = {
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "0"
      /* ZERO */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "w"
      /* WORKSPACE */
    ]: [
      1,
      1
      /* PUSH */
    ],
    [
      "."
      /* DOT */
    ]: [
      2,
      1
      /* PUSH */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4,
      1
      /* PUSH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7,
      1
      /* PUSH */
    ]
  };
  pathStateMachine[
    4
    /* IN_SUB_PATH */
  ] = {
    [
      "'"
      /* SINGLE_QUOTE */
    ]: [
      5,
      0
      /* APPEND */
    ],
    [
      '"'
      /* DOUBLE_QUOTE */
    ]: [
      6,
      0
      /* APPEND */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4,
      2
      /* INC_SUB_PATH_DEPTH */
    ],
    [
      "]"
      /* RIGHT_BRACKET */
    ]: [
      1,
      3
      /* PUSH_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      4,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    5
    /* IN_SINGLE_QUOTE */
  ] = {
    [
      "'"
      /* SINGLE_QUOTE */
    ]: [
      4,
      0
      /* APPEND */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      5,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    6
    /* IN_DOUBLE_QUOTE */
  ] = {
    [
      '"'
      /* DOUBLE_QUOTE */
    ]: [
      4,
      0
      /* APPEND */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      6,
      0
      /* APPEND */
    ]
  };
  const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
  function isLiteral(exp) {
    return literalValueRE.test(exp);
  }
  function stripQuotes(str) {
    const a2 = str.charCodeAt(0);
    const b2 = str.charCodeAt(str.length - 1);
    return a2 === b2 && (a2 === 34 || a2 === 39) ? str.slice(1, -1) : str;
  }
  function getPathCharType(ch) {
    if (ch === void 0 || ch === null) {
      return "o";
    }
    const code = ch.charCodeAt(0);
    switch (code) {
      case 91:
      case 93:
      case 46:
      case 34:
      case 39:
        return ch;
      case 95:
      case 36:
      case 45:
        return "i";
      case 9:
      case 10:
      case 13:
      case 160:
      case 65279:
      case 8232:
      case 8233:
        return "w";
    }
    return "i";
  }
  function formatSubPath(path) {
    const trimmed = path.trim();
    if (path.charAt(0) === "0" && isNaN(parseInt(path))) {
      return false;
    }
    return isLiteral(trimmed) ? stripQuotes(trimmed) : "*" + trimmed;
  }
  function parse(path) {
    const keys = [];
    let index = -1;
    let mode = 0;
    let subPathDepth = 0;
    let c2;
    let key;
    let newChar;
    let type;
    let transition;
    let action;
    let typeMap;
    const actions = [];
    actions[
      0
      /* APPEND */
    ] = () => {
      if (key === void 0) {
        key = newChar;
      } else {
        key += newChar;
      }
    };
    actions[
      1
      /* PUSH */
    ] = () => {
      if (key !== void 0) {
        keys.push(key);
        key = void 0;
      }
    };
    actions[
      2
      /* INC_SUB_PATH_DEPTH */
    ] = () => {
      actions[
        0
        /* APPEND */
      ]();
      subPathDepth++;
    };
    actions[
      3
      /* PUSH_SUB_PATH */
    ] = () => {
      if (subPathDepth > 0) {
        subPathDepth--;
        mode = 4;
        actions[
          0
          /* APPEND */
        ]();
      } else {
        subPathDepth = 0;
        if (key === void 0) {
          return false;
        }
        key = formatSubPath(key);
        if (key === false) {
          return false;
        } else {
          actions[
            1
            /* PUSH */
          ]();
        }
      }
    };
    function maybeUnescapeQuote() {
      const nextChar = path[index + 1];
      if (mode === 5 && nextChar === "'" || mode === 6 && nextChar === '"') {
        index++;
        newChar = "\\" + nextChar;
        actions[
          0
          /* APPEND */
        ]();
        return true;
      }
    }
    while (mode !== null) {
      index++;
      c2 = path[index];
      if (c2 === "\\" && maybeUnescapeQuote()) {
        continue;
      }
      type = getPathCharType(c2);
      typeMap = pathStateMachine[mode];
      transition = typeMap[type] || typeMap[
        "l"
        /* ELSE */
      ] || 8;
      if (transition === 8) {
        return;
      }
      mode = transition[0];
      if (transition[1] !== void 0) {
        action = actions[transition[1]];
        if (action) {
          newChar = c2;
          if (action() === false) {
            return;
          }
        }
      }
      if (mode === 7) {
        return keys;
      }
    }
  }
  const cache = /* @__PURE__ */ new Map();
  function resolveValue(obj, path) {
    if (!isObject(obj)) {
      return null;
    }
    let hit = cache.get(path);
    if (!hit) {
      hit = parse(path);
      if (hit) {
        cache.set(path, hit);
      }
    }
    if (!hit) {
      return null;
    }
    const len = hit.length;
    let last = obj;
    let i2 = 0;
    while (i2 < len) {
      const val = last[hit[i2]];
      if (val === void 0) {
        return null;
      }
      last = val;
      i2++;
    }
    return last;
  }
  function handleFlatJson(obj) {
    if (!isObject(obj)) {
      return obj;
    }
    for (const key in obj) {
      if (!hasOwn(obj, key)) {
        continue;
      }
      if (!key.includes(
        "."
        /* DOT */
      )) {
        if (isObject(obj[key])) {
          handleFlatJson(obj[key]);
        }
      } else {
        const subKeys = key.split(
          "."
          /* DOT */
        );
        const lastIndex = subKeys.length - 1;
        let currentObj = obj;
        for (let i2 = 0; i2 < lastIndex; i2++) {
          if (!(subKeys[i2] in currentObj)) {
            currentObj[subKeys[i2]] = {};
          }
          currentObj = currentObj[subKeys[i2]];
        }
        currentObj[subKeys[lastIndex]] = obj[key];
        delete obj[key];
        if (isObject(currentObj[subKeys[lastIndex]])) {
          handleFlatJson(currentObj[subKeys[lastIndex]]);
        }
      }
    }
    return obj;
  }
  /*!
    * @intlify/runtime v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const DEFAULT_MODIFIER = (str) => str;
  const DEFAULT_MESSAGE = (ctx) => "";
  const DEFAULT_MESSAGE_DATA_TYPE = "text";
  const DEFAULT_NORMALIZE = (values) => values.length === 0 ? "" : values.join("");
  const DEFAULT_INTERPOLATE = toDisplayString;
  function pluralDefault(choice, choicesLength) {
    choice = Math.abs(choice);
    if (choicesLength === 2) {
      return choice ? choice > 1 ? 1 : 0 : 1;
    }
    return choice ? Math.min(choice, 2) : 0;
  }
  function getPluralIndex(options) {
    const index = isNumber(options.pluralIndex) ? options.pluralIndex : -1;
    return options.named && (isNumber(options.named.count) || isNumber(options.named.n)) ? isNumber(options.named.count) ? options.named.count : isNumber(options.named.n) ? options.named.n : index : index;
  }
  function normalizeNamed(pluralIndex, props) {
    if (!props.count) {
      props.count = pluralIndex;
    }
    if (!props.n) {
      props.n = pluralIndex;
    }
  }
  function createMessageContext(options = {}) {
    const locale = options.locale;
    const pluralIndex = getPluralIndex(options);
    const pluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? options.pluralRules[locale] : pluralDefault;
    const orgPluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? pluralDefault : void 0;
    const plural = (messages2) => messages2[pluralRule(pluralIndex, messages2.length, orgPluralRule)];
    const _list = options.list || [];
    const list = (index) => _list[index];
    const _named = options.named || {};
    isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named);
    const named = (key) => _named[key];
    function message(key) {
      const msg = isFunction(options.messages) ? options.messages(key) : isObject$1(options.messages) ? options.messages[key] : false;
      return !msg ? options.parent ? options.parent.message(key) : DEFAULT_MESSAGE : msg;
    }
    const _modifier = (name) => options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER;
    const normalize = isPlainObject(options.processor) && isFunction(options.processor.normalize) ? options.processor.normalize : DEFAULT_NORMALIZE;
    const interpolate = isPlainObject(options.processor) && isFunction(options.processor.interpolate) ? options.processor.interpolate : DEFAULT_INTERPOLATE;
    const type = isPlainObject(options.processor) && isString(options.processor.type) ? options.processor.type : DEFAULT_MESSAGE_DATA_TYPE;
    const ctx = {
      [
        "list"
        /* LIST */
      ]: list,
      [
        "named"
        /* NAMED */
      ]: named,
      [
        "plural"
        /* PLURAL */
      ]: plural,
      [
        "linked"
        /* LINKED */
      ]: (key, modifier) => {
        const msg = message(key)(ctx);
        return isString(modifier) ? _modifier(modifier)(msg) : msg;
      },
      [
        "message"
        /* MESSAGE */
      ]: message,
      [
        "type"
        /* TYPE */
      ]: type,
      [
        "interpolate"
        /* INTERPOLATE */
      ]: interpolate,
      [
        "normalize"
        /* NORMALIZE */
      ]: normalize
    };
    return ctx;
  }
  /*!
    * @intlify/message-compiler v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const errorMessages$2 = {
    // tokenizer error messages
    [
      0
      /* EXPECTED_TOKEN */
    ]: `Expected token: '{0}'`,
    [
      1
      /* INVALID_TOKEN_IN_PLACEHOLDER */
    ]: `Invalid token in placeholder: '{0}'`,
    [
      2
      /* UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER */
    ]: `Unterminated single quote in placeholder`,
    [
      3
      /* UNKNOWN_ESCAPE_SEQUENCE */
    ]: `Unknown escape sequence: \\{0}`,
    [
      4
      /* INVALID_UNICODE_ESCAPE_SEQUENCE */
    ]: `Invalid unicode escape sequence: {0}`,
    [
      5
      /* UNBALANCED_CLOSING_BRACE */
    ]: `Unbalanced closing brace`,
    [
      6
      /* UNTERMINATED_CLOSING_BRACE */
    ]: `Unterminated closing brace`,
    [
      7
      /* EMPTY_PLACEHOLDER */
    ]: `Empty placeholder`,
    [
      8
      /* NOT_ALLOW_NEST_PLACEHOLDER */
    ]: `Not allowed nest placeholder`,
    [
      9
      /* INVALID_LINKED_FORMAT */
    ]: `Invalid linked format`,
    // parser error messages
    [
      10
      /* MUST_HAVE_MESSAGES_IN_PLURAL */
    ]: `Plural must have messages`,
    [
      11
      /* UNEXPECTED_EMPTY_LINKED_MODIFIER */
    ]: `Unexpected empty linked modifier`,
    [
      12
      /* UNEXPECTED_EMPTY_LINKED_KEY */
    ]: `Unexpected empty linked key`,
    [
      13
      /* UNEXPECTED_LEXICAL_ANALYSIS */
    ]: `Unexpected lexical analysis in token: '{0}'`
  };
  function createCompileError(code, loc, options = {}) {
    const { domain, messages: messages2, args } = options;
    const msg = format((messages2 || errorMessages$2)[code] || "", ...args || []);
    const error2 = new SyntaxError(String(msg));
    error2.code = code;
    if (loc) {
      error2.location = loc;
    }
    error2.domain = domain;
    return error2;
  }
  /*!
    * @intlify/devtools-if v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const IntlifyDevToolsHooks = {
    I18nInit: "i18n:init",
    FunctionTranslate: "function:translate"
  };
  /*!
    * @intlify/core-base v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  let devtools = null;
  function setDevToolsHook(hook) {
    devtools = hook;
  }
  function initI18nDevTools(i18n2, version, meta) {
    devtools && devtools.emit(IntlifyDevToolsHooks.I18nInit, {
      timestamp: Date.now(),
      i18n: i18n2,
      version,
      meta
    });
  }
  const translateDevTools = /* @__PURE__ */ createDevToolsHook(IntlifyDevToolsHooks.FunctionTranslate);
  function createDevToolsHook(hook) {
    return (payloads) => devtools && devtools.emit(hook, payloads);
  }
  const warnMessages$1 = {
    [
      0
      /* NOT_FOUND_KEY */
    ]: `Not found '{key}' key in '{locale}' locale messages.`,
    [
      1
      /* FALLBACK_TO_TRANSLATE */
    ]: `Fall back to translate '{key}' key with '{target}' locale.`,
    [
      2
      /* CANNOT_FORMAT_NUMBER */
    ]: `Cannot format a number value due to not supported Intl.NumberFormat.`,
    [
      3
      /* FALLBACK_TO_NUMBER_FORMAT */
    ]: `Fall back to number format '{key}' key with '{target}' locale.`,
    [
      4
      /* CANNOT_FORMAT_DATE */
    ]: `Cannot format a date value due to not supported Intl.DateTimeFormat.`,
    [
      5
      /* FALLBACK_TO_DATE_FORMAT */
    ]: `Fall back to datetime format '{key}' key with '{target}' locale.`
  };
  function getWarnMessage$1(code, ...args) {
    return format(warnMessages$1[code], ...args);
  }
  const VERSION$1 = "9.1.9";
  const NOT_REOSLVED = -1;
  const MISSING_RESOLVE_VALUE = "";
  function getDefaultLinkedModifiers() {
    return {
      upper: (val) => isString(val) ? val.toUpperCase() : val,
      lower: (val) => isString(val) ? val.toLowerCase() : val,
      // prettier-ignore
      capitalize: (val) => isString(val) ? `${val.charAt(0).toLocaleUpperCase()}${val.substr(1)}` : val
    };
  }
  let _compiler;
  let _additionalMeta = null;
  const setAdditionalMeta = (meta) => {
    _additionalMeta = meta;
  };
  const getAdditionalMeta = () => _additionalMeta;
  let _cid = 0;
  function createCoreContext(options = {}) {
    const version = isString(options.version) ? options.version : VERSION$1;
    const locale = isString(options.locale) ? options.locale : "en-US";
    const fallbackLocale = isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || isString(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
    const messages2 = isPlainObject(options.messages) ? options.messages : { [locale]: {} };
    const datetimeFormats = isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [locale]: {} };
    const numberFormats = isPlainObject(options.numberFormats) ? options.numberFormats : { [locale]: {} };
    const modifiers = assign({}, options.modifiers || {}, getDefaultLinkedModifiers());
    const pluralRules = options.pluralRules || {};
    const missing = isFunction(options.missing) ? options.missing : null;
    const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
    const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
    const fallbackFormat = !!options.fallbackFormat;
    const unresolving = !!options.unresolving;
    const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
    const processor = isPlainObject(options.processor) ? options.processor : null;
    const warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
    const escapeParameter = !!options.escapeParameter;
    const messageCompiler = isFunction(options.messageCompiler) ? options.messageCompiler : _compiler;
    const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
    const internalOptions = options;
    const __datetimeFormatters = isObject$1(internalOptions.__datetimeFormatters) ? internalOptions.__datetimeFormatters : /* @__PURE__ */ new Map();
    const __numberFormatters = isObject$1(internalOptions.__numberFormatters) ? internalOptions.__numberFormatters : /* @__PURE__ */ new Map();
    const __meta = isObject$1(internalOptions.__meta) ? internalOptions.__meta : {};
    _cid++;
    const context = {
      version,
      cid: _cid,
      locale,
      fallbackLocale,
      messages: messages2,
      datetimeFormats,
      numberFormats,
      modifiers,
      pluralRules,
      missing,
      missingWarn,
      fallbackWarn,
      fallbackFormat,
      unresolving,
      postTranslation,
      processor,
      warnHtmlMessage,
      escapeParameter,
      messageCompiler,
      onWarn,
      __datetimeFormatters,
      __numberFormatters,
      __meta
    };
    {
      context.__v_emitter = internalOptions.__v_emitter != null ? internalOptions.__v_emitter : void 0;
    }
    {
      initI18nDevTools(context, version, __meta);
    }
    return context;
  }
  function isTranslateFallbackWarn(fallback, key) {
    return fallback instanceof RegExp ? fallback.test(key) : fallback;
  }
  function isTranslateMissingWarn(missing, key) {
    return missing instanceof RegExp ? missing.test(key) : missing;
  }
  function handleMissing(context, key, locale, missingWarn, type) {
    const { missing, onWarn } = context;
    {
      const emitter = context.__v_emitter;
      if (emitter) {
        emitter.emit("missing", {
          locale,
          key,
          type,
          groupId: `${type}:${key}`
        });
      }
    }
    if (missing !== null) {
      const ret = missing(context, locale, key, type);
      return isString(ret) ? ret : key;
    } else {
      if (isTranslateMissingWarn(missingWarn, key)) {
        onWarn(getWarnMessage$1(0, { key, locale }));
      }
      return key;
    }
  }
  function getLocaleChain(ctx, fallback, start) {
    const context = ctx;
    if (!context.__localeChainCache) {
      context.__localeChainCache = /* @__PURE__ */ new Map();
    }
    let chain = context.__localeChainCache.get(start);
    if (!chain) {
      chain = [];
      let block = [start];
      while (isArray(block)) {
        block = appendBlockToChain(chain, block, fallback);
      }
      const defaults = isArray(fallback) ? fallback : isPlainObject(fallback) ? fallback["default"] ? fallback["default"] : null : fallback;
      block = isString(defaults) ? [defaults] : defaults;
      if (isArray(block)) {
        appendBlockToChain(chain, block, false);
      }
      context.__localeChainCache.set(start, chain);
    }
    return chain;
  }
  function appendBlockToChain(chain, block, blocks) {
    let follow = true;
    for (let i2 = 0; i2 < block.length && isBoolean(follow); i2++) {
      const locale = block[i2];
      if (isString(locale)) {
        follow = appendLocaleToChain(chain, block[i2], blocks);
      }
    }
    return follow;
  }
  function appendLocaleToChain(chain, locale, blocks) {
    let follow;
    const tokens = locale.split("-");
    do {
      const target = tokens.join("-");
      follow = appendItemToChain(chain, target, blocks);
      tokens.splice(-1, 1);
    } while (tokens.length && follow === true);
    return follow;
  }
  function appendItemToChain(chain, target, blocks) {
    let follow = false;
    if (!chain.includes(target)) {
      follow = true;
      if (target) {
        follow = target[target.length - 1] !== "!";
        const locale = target.replace(/!/g, "");
        chain.push(locale);
        if ((isArray(blocks) || isPlainObject(blocks)) && blocks[locale]) {
          follow = blocks[locale];
        }
      }
    }
    return follow;
  }
  function updateFallbackLocale(ctx, locale, fallback) {
    const context = ctx;
    context.__localeChainCache = /* @__PURE__ */ new Map();
    getLocaleChain(ctx, fallback, locale);
  }
  function createCoreError(code) {
    return createCompileError(code, null, { messages: errorMessages$1 });
  }
  const errorMessages$1 = {
    [
      14
      /* INVALID_ARGUMENT */
    ]: "Invalid arguments",
    [
      15
      /* INVALID_DATE_ARGUMENT */
    ]: "The date provided is an invalid Date object.Make sure your Date represents a valid date.",
    [
      16
      /* INVALID_ISO_DATE_ARGUMENT */
    ]: "The argument provided is not a valid ISO date string"
  };
  const NOOP_MESSAGE_FUNCTION = () => "";
  const isMessageFunction = (val) => isFunction(val);
  function translate(context, ...args) {
    const { fallbackFormat, postTranslation, unresolving, fallbackLocale, messages: messages2 } = context;
    const [key, options] = parseTranslateArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const escapeParameter = isBoolean(options.escapeParameter) ? options.escapeParameter : context.escapeParameter;
    const resolvedMessage = !!options.resolvedMessage;
    const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) ? !isBoolean(options.default) ? options.default : key : fallbackFormat ? key : "";
    const enableDefaultMsg = fallbackFormat || defaultMsgOrKey !== "";
    const locale = isString(options.locale) ? options.locale : context.locale;
    escapeParameter && escapeParams(options);
    let [format2, targetLocale, message] = !resolvedMessage ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) : [
      key,
      locale,
      messages2[locale] || {}
    ];
    let cacheBaseKey = key;
    if (!resolvedMessage && !(isString(format2) || isMessageFunction(format2))) {
      if (enableDefaultMsg) {
        format2 = defaultMsgOrKey;
        cacheBaseKey = format2;
      }
    }
    if (!resolvedMessage && (!(isString(format2) || isMessageFunction(format2)) || !isString(targetLocale))) {
      return unresolving ? NOT_REOSLVED : key;
    }
    if (isString(format2) && context.messageCompiler == null) {
      warn(`The message format compilation is not supported in this build. Because message compiler isn't included. You need to pre-compilation all message format. So translate function return '${key}'.`);
      return key;
    }
    let occurred = false;
    const errorDetector = () => {
      occurred = true;
    };
    const msg = !isMessageFunction(format2) ? compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) : format2;
    if (occurred) {
      return format2;
    }
    const ctxOptions = getMessageContextOptions(context, targetLocale, message, options);
    const msgContext = createMessageContext(ctxOptions);
    const messaged = evaluateMessage(context, msg, msgContext);
    const ret = postTranslation ? postTranslation(messaged) : messaged;
    {
      const payloads = {
        timestamp: Date.now(),
        key: isString(key) ? key : isMessageFunction(format2) ? format2.key : "",
        locale: targetLocale || (isMessageFunction(format2) ? format2.locale : ""),
        format: isString(format2) ? format2 : isMessageFunction(format2) ? format2.source : "",
        message: ret
      };
      payloads.meta = assign({}, context.__meta, getAdditionalMeta() || {});
      translateDevTools(payloads);
    }
    return ret;
  }
  function escapeParams(options) {
    if (isArray(options.list)) {
      options.list = options.list.map((item) => isString(item) ? escapeHtml(item) : item);
    } else if (isObject$1(options.named)) {
      Object.keys(options.named).forEach((key) => {
        if (isString(options.named[key])) {
          options.named[key] = escapeHtml(options.named[key]);
        }
      });
    }
  }
  function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
    const { messages: messages2, onWarn } = context;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    let message = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "translate";
    for (let i2 = 0; i2 < locales.length; i2++) {
      targetLocale = to = locales[i2];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(1, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      message = messages2[targetLocale] || {};
      let start = null;
      let startTag;
      let endTag;
      if (inBrowser) {
        start = window.performance.now();
        startTag = "intlify-message-resolve-start";
        endTag = "intlify-message-resolve-end";
        mark && mark(startTag);
      }
      if ((format2 = resolveValue(message, key)) === null) {
        format2 = message[key];
      }
      if (inBrowser) {
        const end = window.performance.now();
        const emitter = context.__v_emitter;
        if (emitter && start && format2) {
          emitter.emit("message-resolve", {
            type: "message-resolve",
            key,
            message: format2,
            time: end - start,
            groupId: `${type}:${key}`
          });
        }
        if (startTag && endTag && mark && measure) {
          mark(endTag);
          measure("intlify message resolve", startTag, endTag);
        }
      }
      if (isString(format2) || isFunction(format2))
        break;
      const missingRet = handleMissing(context, key, targetLocale, missingWarn, type);
      if (missingRet !== key) {
        format2 = missingRet;
      }
      from = to;
    }
    return [format2, targetLocale, message];
  }
  function compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) {
    const { messageCompiler, warnHtmlMessage } = context;
    if (isMessageFunction(format2)) {
      const msg2 = format2;
      msg2.locale = msg2.locale || targetLocale;
      msg2.key = msg2.key || key;
      return msg2;
    }
    let start = null;
    let startTag;
    let endTag;
    if (inBrowser) {
      start = window.performance.now();
      startTag = "intlify-message-compilation-start";
      endTag = "intlify-message-compilation-end";
      mark && mark(startTag);
    }
    const msg = messageCompiler(format2, getCompileOptions(context, targetLocale, cacheBaseKey, format2, warnHtmlMessage, errorDetector));
    if (inBrowser) {
      const end = window.performance.now();
      const emitter = context.__v_emitter;
      if (emitter && start) {
        emitter.emit("message-compilation", {
          type: "message-compilation",
          message: format2,
          time: end - start,
          groupId: `${"translate"}:${key}`
        });
      }
      if (startTag && endTag && mark && measure) {
        mark(endTag);
        measure("intlify message compilation", startTag, endTag);
      }
    }
    msg.locale = targetLocale;
    msg.key = key;
    msg.source = format2;
    return msg;
  }
  function evaluateMessage(context, msg, msgCtx) {
    let start = null;
    let startTag;
    let endTag;
    if (inBrowser) {
      start = window.performance.now();
      startTag = "intlify-message-evaluation-start";
      endTag = "intlify-message-evaluation-end";
      mark && mark(startTag);
    }
    const messaged = msg(msgCtx);
    if (inBrowser) {
      const end = window.performance.now();
      const emitter = context.__v_emitter;
      if (emitter && start) {
        emitter.emit("message-evaluation", {
          type: "message-evaluation",
          value: messaged,
          time: end - start,
          groupId: `${"translate"}:${msg.key}`
        });
      }
      if (startTag && endTag && mark && measure) {
        mark(endTag);
        measure("intlify message evaluation", startTag, endTag);
      }
    }
    return messaged;
  }
  function parseTranslateArgs(...args) {
    const [arg1, arg2, arg3] = args;
    const options = {};
    if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1)) {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    const key = isNumber(arg1) ? String(arg1) : isMessageFunction(arg1) ? arg1 : arg1;
    if (isNumber(arg2)) {
      options.plural = arg2;
    } else if (isString(arg2)) {
      options.default = arg2;
    } else if (isPlainObject(arg2) && !isEmptyObject(arg2)) {
      options.named = arg2;
    } else if (isArray(arg2)) {
      options.list = arg2;
    }
    if (isNumber(arg3)) {
      options.plural = arg3;
    } else if (isString(arg3)) {
      options.default = arg3;
    } else if (isPlainObject(arg3)) {
      assign(options, arg3);
    }
    return [key, options];
  }
  function getCompileOptions(context, locale, key, source, warnHtmlMessage, errorDetector) {
    return {
      warnHtmlMessage,
      onError: (err) => {
        errorDetector && errorDetector(err);
        {
          const message = `Message compilation error: ${err.message}`;
          const codeFrame = err.location && generateCodeFrame(source, err.location.start.offset, err.location.end.offset);
          const emitter = context.__v_emitter;
          if (emitter) {
            emitter.emit("compile-error", {
              message: source,
              error: err.message,
              start: err.location && err.location.start.offset,
              end: err.location && err.location.end.offset,
              groupId: `${"translate"}:${key}`
            });
          }
          console.error(codeFrame ? `${message}
${codeFrame}` : message);
        }
      },
      onCacheKey: (source2) => generateFormatCacheKey(locale, key, source2)
    };
  }
  function getMessageContextOptions(context, locale, message, options) {
    const { modifiers, pluralRules } = context;
    const resolveMessage = (key) => {
      const val = resolveValue(message, key);
      if (isString(val)) {
        let occurred = false;
        const errorDetector = () => {
          occurred = true;
        };
        const msg = compileMessageFormat(context, key, locale, val, key, errorDetector);
        return !occurred ? msg : NOOP_MESSAGE_FUNCTION;
      } else if (isMessageFunction(val)) {
        return val;
      } else {
        return NOOP_MESSAGE_FUNCTION;
      }
    };
    const ctxOptions = {
      locale,
      modifiers,
      pluralRules,
      messages: resolveMessage
    };
    if (context.processor) {
      ctxOptions.processor = context.processor;
    }
    if (options.list) {
      ctxOptions.list = options.list;
    }
    if (options.named) {
      ctxOptions.named = options.named;
    }
    if (isNumber(options.plural)) {
      ctxOptions.pluralIndex = options.plural;
    }
    return ctxOptions;
  }
  const intlDefined = typeof Intl !== "undefined";
  const Availabilities = {
    dateTimeFormat: intlDefined && typeof Intl.DateTimeFormat !== "undefined",
    numberFormat: intlDefined && typeof Intl.NumberFormat !== "undefined"
  };
  function datetime(context, ...args) {
    const { datetimeFormats, unresolving, fallbackLocale, onWarn } = context;
    const { __datetimeFormatters } = context;
    if (!Availabilities.dateTimeFormat) {
      onWarn(getWarnMessage$1(
        4
        /* CANNOT_FORMAT_DATE */
      ));
      return MISSING_RESOLVE_VALUE;
    }
    const [key, value, options, overrides] = parseDateTimeArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const part = !!options.part;
    const locale = isString(options.locale) ? options.locale : context.locale;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    if (!isString(key) || key === "") {
      return new Intl.DateTimeFormat(locale).format(value);
    }
    let datetimeFormat = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "datetime format";
    for (let i2 = 0; i2 < locales.length; i2++) {
      targetLocale = to = locales[i2];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(5, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      datetimeFormat = datetimeFormats[targetLocale] || {};
      format2 = datetimeFormat[key];
      if (isPlainObject(format2))
        break;
      handleMissing(context, key, targetLocale, missingWarn, type);
      from = to;
    }
    if (!isPlainObject(format2) || !isString(targetLocale)) {
      return unresolving ? NOT_REOSLVED : key;
    }
    let id = `${targetLocale}__${key}`;
    if (!isEmptyObject(overrides)) {
      id = `${id}__${JSON.stringify(overrides)}`;
    }
    let formatter = __datetimeFormatters.get(id);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(targetLocale, assign({}, format2, overrides));
      __datetimeFormatters.set(id, formatter);
    }
    return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  function parseDateTimeArgs(...args) {
    const [arg1, arg2, arg3, arg4] = args;
    let options = {};
    let overrides = {};
    let value;
    if (isString(arg1)) {
      if (!/\d{4}-\d{2}-\d{2}(T.*)?/.test(arg1)) {
        throw createCoreError(
          16
          /* INVALID_ISO_DATE_ARGUMENT */
        );
      }
      value = new Date(arg1);
      try {
        value.toISOString();
      } catch (e2) {
        throw createCoreError(
          16
          /* INVALID_ISO_DATE_ARGUMENT */
        );
      }
    } else if (isDate(arg1)) {
      if (isNaN(arg1.getTime())) {
        throw createCoreError(
          15
          /* INVALID_DATE_ARGUMENT */
        );
      }
      value = arg1;
    } else if (isNumber(arg1)) {
      value = arg1;
    } else {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    if (isString(arg2)) {
      options.key = arg2;
    } else if (isPlainObject(arg2)) {
      options = arg2;
    }
    if (isString(arg3)) {
      options.locale = arg3;
    } else if (isPlainObject(arg3)) {
      overrides = arg3;
    }
    if (isPlainObject(arg4)) {
      overrides = arg4;
    }
    return [options.key || "", value, options, overrides];
  }
  function clearDateTimeFormat(ctx, locale, format2) {
    const context = ctx;
    for (const key in format2) {
      const id = `${locale}__${key}`;
      if (!context.__datetimeFormatters.has(id)) {
        continue;
      }
      context.__datetimeFormatters.delete(id);
    }
  }
  function number(context, ...args) {
    const { numberFormats, unresolving, fallbackLocale, onWarn } = context;
    const { __numberFormatters } = context;
    if (!Availabilities.numberFormat) {
      onWarn(getWarnMessage$1(
        2
        /* CANNOT_FORMAT_NUMBER */
      ));
      return MISSING_RESOLVE_VALUE;
    }
    const [key, value, options, overrides] = parseNumberArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const part = !!options.part;
    const locale = isString(options.locale) ? options.locale : context.locale;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    if (!isString(key) || key === "") {
      return new Intl.NumberFormat(locale).format(value);
    }
    let numberFormat = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "number format";
    for (let i2 = 0; i2 < locales.length; i2++) {
      targetLocale = to = locales[i2];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(3, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      numberFormat = numberFormats[targetLocale] || {};
      format2 = numberFormat[key];
      if (isPlainObject(format2))
        break;
      handleMissing(context, key, targetLocale, missingWarn, type);
      from = to;
    }
    if (!isPlainObject(format2) || !isString(targetLocale)) {
      return unresolving ? NOT_REOSLVED : key;
    }
    let id = `${targetLocale}__${key}`;
    if (!isEmptyObject(overrides)) {
      id = `${id}__${JSON.stringify(overrides)}`;
    }
    let formatter = __numberFormatters.get(id);
    if (!formatter) {
      formatter = new Intl.NumberFormat(targetLocale, assign({}, format2, overrides));
      __numberFormatters.set(id, formatter);
    }
    return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  function parseNumberArgs(...args) {
    const [arg1, arg2, arg3, arg4] = args;
    let options = {};
    let overrides = {};
    if (!isNumber(arg1)) {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    const value = arg1;
    if (isString(arg2)) {
      options.key = arg2;
    } else if (isPlainObject(arg2)) {
      options = arg2;
    }
    if (isString(arg3)) {
      options.locale = arg3;
    } else if (isPlainObject(arg3)) {
      overrides = arg3;
    }
    if (isPlainObject(arg4)) {
      overrides = arg4;
    }
    return [options.key || "", value, options, overrides];
  }
  function clearNumberFormat(ctx, locale, format2) {
    const context = ctx;
    for (const key in format2) {
      const id = `${locale}__${key}`;
      if (!context.__numberFormatters.has(id)) {
        continue;
      }
      context.__numberFormatters.delete(id);
    }
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data2 = JSON.parse(raw);
        Object.assign(currentSettings, data2);
      } catch (e2) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e2) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
    * @intlify/vue-devtools v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const VueDevToolsLabels = {
    [
      "vue-devtools-plugin-vue-i18n"
      /* PLUGIN */
    ]: "Vue I18n devtools",
    [
      "vue-i18n-resource-inspector"
      /* CUSTOM_INSPECTOR */
    ]: "I18n Resources",
    [
      "vue-i18n-timeline"
      /* TIMELINE */
    ]: "Vue I18n"
  };
  const VueDevToolsPlaceholders = {
    [
      "vue-i18n-resource-inspector"
      /* CUSTOM_INSPECTOR */
    ]: "Search for scopes ..."
  };
  const VueDevToolsTimelineColors = {
    [
      "vue-i18n-timeline"
      /* TIMELINE */
    ]: 16764185
  };
  /*!
    * vue-i18n v9.1.9
    * (c) 2022 kazuya kawaguchi
    * Released under the MIT License.
    */
  const VERSION = "9.1.9";
  function initFeatureFlags() {
    let needWarn = false;
    {
      needWarn = true;
    }
    if (needWarn) {
      console.warn(`You are running the esm-bundler build of vue-i18n. It is recommended to configure your bundler to explicitly replace feature flag globals with boolean literals to get proper tree-shaking in the final bundle.`);
    }
  }
  const warnMessages = {
    [
      6
      /* FALLBACK_TO_ROOT */
    ]: `Fall back to {type} '{key}' with root locale.`,
    [
      7
      /* NOT_SUPPORTED_PRESERVE */
    ]: `Not supported 'preserve'.`,
    [
      8
      /* NOT_SUPPORTED_FORMATTER */
    ]: `Not supported 'formatter'.`,
    [
      9
      /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
    ]: `Not supported 'preserveDirectiveContent'.`,
    [
      10
      /* NOT_SUPPORTED_GET_CHOICE_INDEX */
    ]: `Not supported 'getChoiceIndex'.`,
    [
      11
      /* COMPONENT_NAME_LEGACY_COMPATIBLE */
    ]: `Component name legacy compatible: '{name}' -> 'i18n'`,
    [
      12
      /* NOT_FOUND_PARENT_SCOPE */
    ]: `Not found parent scope. use the global scope.`
  };
  function getWarnMessage(code, ...args) {
    return format(warnMessages[code], ...args);
  }
  function createI18nError(code, ...args) {
    return createCompileError(code, null, { messages: errorMessages, args });
  }
  const errorMessages = {
    [
      14
      /* UNEXPECTED_RETURN_TYPE */
    ]: "Unexpected return type in composer",
    [
      15
      /* INVALID_ARGUMENT */
    ]: "Invalid argument",
    [
      16
      /* MUST_BE_CALL_SETUP_TOP */
    ]: "Must be called at the top of a `setup` function",
    [
      17
      /* NOT_INSLALLED */
    ]: "Need to install with `app.use` function",
    [
      22
      /* UNEXPECTED_ERROR */
    ]: "Unexpected error",
    [
      18
      /* NOT_AVAILABLE_IN_LEGACY_MODE */
    ]: "Not available in legacy mode",
    [
      19
      /* REQUIRED_VALUE */
    ]: `Required in value: {0}`,
    [
      20
      /* INVALID_VALUE */
    ]: `Invalid value`,
    [
      21
      /* CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN */
    ]: `Cannot setup vue-devtools plugin`
  };
  const DEVTOOLS_META = "__INTLIFY_META__";
  const TransrateVNodeSymbol = makeSymbol("__transrateVNode");
  const DatetimePartsSymbol = makeSymbol("__datetimeParts");
  const NumberPartsSymbol = makeSymbol("__numberParts");
  const EnableEmitter = makeSymbol("__enableEmitter");
  const DisableEmitter = makeSymbol("__disableEmitter");
  const SetPluralRulesSymbol = makeSymbol("__setPluralRules");
  makeSymbol("__intlifyMeta");
  const InejctWithOption = makeSymbol("__injectWithOption");
  let composerID = 0;
  function defineCoreMissingHandler(missing) {
    return (ctx, locale, key, type) => {
      return missing(locale, key, vue.getCurrentInstance() || void 0, type);
    };
  }
  function getLocaleMessages(locale, options) {
    const { messages: messages2, __i18n } = options;
    const ret = isPlainObject(messages2) ? messages2 : isArray(__i18n) ? {} : { [locale]: {} };
    if (isArray(__i18n)) {
      __i18n.forEach(({ locale: locale2, resource }) => {
        if (locale2) {
          ret[locale2] = ret[locale2] || {};
          deepCopy(resource, ret[locale2]);
        } else {
          deepCopy(resource, ret);
        }
      });
    }
    if (options.flatJson) {
      for (const key in ret) {
        if (hasOwn$1(ret, key)) {
          handleFlatJson(ret[key]);
        }
      }
    }
    return ret;
  }
  const isNotObjectOrIsArray = (val) => !isObject$1(val) || isArray(val);
  function deepCopy(src, des) {
    if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
      throw createI18nError(
        20
        /* INVALID_VALUE */
      );
    }
    for (const key in src) {
      if (hasOwn$1(src, key)) {
        if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
          des[key] = src[key];
        } else {
          deepCopy(src[key], des[key]);
        }
      }
    }
  }
  const getMetaInfo = () => {
    const instance2 = vue.getCurrentInstance();
    return instance2 && instance2.type[DEVTOOLS_META] ? { [DEVTOOLS_META]: instance2.type[DEVTOOLS_META] } : null;
  };
  function createComposer(options = {}) {
    const { __root } = options;
    const _isGlobal = __root === void 0;
    let _inheritLocale = isBoolean(options.inheritLocale) ? options.inheritLocale : true;
    const _locale = vue.ref(
      // prettier-ignore
      __root && _inheritLocale ? __root.locale.value : isString(options.locale) ? options.locale : "en-US"
    );
    const _fallbackLocale = vue.ref(
      // prettier-ignore
      __root && _inheritLocale ? __root.fallbackLocale.value : isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale.value
    );
    const _messages = vue.ref(getLocaleMessages(_locale.value, options));
    const _datetimeFormats = vue.ref(isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [_locale.value]: {} });
    const _numberFormats = vue.ref(isPlainObject(options.numberFormats) ? options.numberFormats : { [_locale.value]: {} });
    let _missingWarn = __root ? __root.missingWarn : isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
    let _fallbackWarn = __root ? __root.fallbackWarn : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
    let _fallbackRoot = __root ? __root.fallbackRoot : isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
    let _fallbackFormat = !!options.fallbackFormat;
    let _missing = isFunction(options.missing) ? options.missing : null;
    let _runtimeMissing = isFunction(options.missing) ? defineCoreMissingHandler(options.missing) : null;
    let _postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
    let _warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
    let _escapeParameter = !!options.escapeParameter;
    const _modifiers = __root ? __root.modifiers : isPlainObject(options.modifiers) ? options.modifiers : {};
    let _pluralRules = options.pluralRules || __root && __root.pluralRules;
    let _context;
    function getCoreContext() {
      return createCoreContext({
        version: VERSION,
        locale: _locale.value,
        fallbackLocale: _fallbackLocale.value,
        messages: _messages.value,
        messageCompiler: function compileToFunction(source) {
          return (ctx) => {
            return ctx.normalize([source]);
          };
        },
        datetimeFormats: _datetimeFormats.value,
        numberFormats: _numberFormats.value,
        modifiers: _modifiers,
        pluralRules: _pluralRules,
        missing: _runtimeMissing === null ? void 0 : _runtimeMissing,
        missingWarn: _missingWarn,
        fallbackWarn: _fallbackWarn,
        fallbackFormat: _fallbackFormat,
        unresolving: true,
        postTranslation: _postTranslation === null ? void 0 : _postTranslation,
        warnHtmlMessage: _warnHtmlMessage,
        escapeParameter: _escapeParameter,
        __datetimeFormatters: isPlainObject(_context) ? _context.__datetimeFormatters : void 0,
        __numberFormatters: isPlainObject(_context) ? _context.__numberFormatters : void 0,
        __v_emitter: isPlainObject(_context) ? _context.__v_emitter : void 0,
        __meta: { framework: "vue" }
      });
    }
    _context = getCoreContext();
    updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
    function trackReactivityValues() {
      return [
        _locale.value,
        _fallbackLocale.value,
        _messages.value,
        _datetimeFormats.value,
        _numberFormats.value
      ];
    }
    const locale = vue.computed({
      get: () => _locale.value,
      set: (val) => {
        _locale.value = val;
        _context.locale = _locale.value;
      }
    });
    const fallbackLocale = vue.computed({
      get: () => _fallbackLocale.value,
      set: (val) => {
        _fallbackLocale.value = val;
        _context.fallbackLocale = _fallbackLocale.value;
        updateFallbackLocale(_context, _locale.value, val);
      }
    });
    const messages2 = vue.computed(() => _messages.value);
    const datetimeFormats = vue.computed(() => _datetimeFormats.value);
    const numberFormats = vue.computed(() => _numberFormats.value);
    function getPostTranslationHandler() {
      return isFunction(_postTranslation) ? _postTranslation : null;
    }
    function setPostTranslationHandler(handler) {
      _postTranslation = handler;
      _context.postTranslation = handler;
    }
    function getMissingHandler() {
      return _missing;
    }
    function setMissingHandler(handler) {
      if (handler !== null) {
        _runtimeMissing = defineCoreMissingHandler(handler);
      }
      _missing = handler;
      _context.missing = _runtimeMissing;
    }
    function isResolvedTranslateMessage(type, arg) {
      return type !== "translate" || !!arg.resolvedMessage === false;
    }
    function wrapWithDeps(fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) {
      trackReactivityValues();
      let ret;
      {
        try {
          setAdditionalMeta(getMetaInfo());
          ret = fn(_context);
        } finally {
          setAdditionalMeta(null);
        }
      }
      if (isNumber(ret) && ret === NOT_REOSLVED) {
        const [key, arg2] = argumentParser();
        if (__root && isString(key) && isResolvedTranslateMessage(warnType, arg2)) {
          if (_fallbackRoot && (isTranslateFallbackWarn(_fallbackWarn, key) || isTranslateMissingWarn(_missingWarn, key))) {
            warn(getWarnMessage(6, {
              key,
              type: warnType
            }));
          }
          {
            const { __v_emitter: emitter } = _context;
            if (emitter && _fallbackRoot) {
              emitter.emit("fallback", {
                type: warnType,
                key,
                to: "global",
                groupId: `${warnType}:${key}`
              });
            }
          }
        }
        return __root && _fallbackRoot ? fallbackSuccess(__root) : fallbackFail(key);
      } else if (successCondition(ret)) {
        return ret;
      } else {
        throw createI18nError(
          14
          /* UNEXPECTED_RETURN_TYPE */
        );
      }
    }
    function t2(...args) {
      return wrapWithDeps((context) => translate(context, ...args), () => parseTranslateArgs(...args), "translate", (root) => root.t(...args), (key) => key, (val) => isString(val));
    }
    function rt2(...args) {
      const [arg1, arg2, arg3] = args;
      if (arg3 && !isObject$1(arg3)) {
        throw createI18nError(
          15
          /* INVALID_ARGUMENT */
        );
      }
      return t2(...[arg1, arg2, assign({ resolvedMessage: true }, arg3 || {})]);
    }
    function d2(...args) {
      return wrapWithDeps((context) => datetime(context, ...args), () => parseDateTimeArgs(...args), "datetime format", (root) => root.d(...args), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
    }
    function n2(...args) {
      return wrapWithDeps((context) => number(context, ...args), () => parseNumberArgs(...args), "number format", (root) => root.n(...args), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
    }
    function normalize(values) {
      return values.map((val) => isString(val) ? vue.createVNode(vue.Text, null, val, 0) : val);
    }
    const interpolate = (val) => val;
    const processor = {
      normalize,
      interpolate,
      type: "vnode"
    };
    function transrateVNode(...args) {
      return wrapWithDeps(
        (context) => {
          let ret;
          const _context2 = context;
          try {
            _context2.processor = processor;
            ret = translate(_context2, ...args);
          } finally {
            _context2.processor = null;
          }
          return ret;
        },
        () => parseTranslateArgs(...args),
        "translate",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[TransrateVNodeSymbol](...args),
        (key) => [vue.createVNode(vue.Text, null, key, 0)],
        (val) => isArray(val)
      );
    }
    function numberParts(...args) {
      return wrapWithDeps(
        (context) => number(context, ...args),
        () => parseNumberArgs(...args),
        "number format",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[NumberPartsSymbol](...args),
        () => [],
        (val) => isString(val) || isArray(val)
      );
    }
    function datetimeParts(...args) {
      return wrapWithDeps(
        (context) => datetime(context, ...args),
        () => parseDateTimeArgs(...args),
        "datetime format",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[DatetimePartsSymbol](...args),
        () => [],
        (val) => isString(val) || isArray(val)
      );
    }
    function setPluralRules(rules2) {
      _pluralRules = rules2;
      _context.pluralRules = _pluralRules;
    }
    function te2(key, locale2) {
      const targetLocale = isString(locale2) ? locale2 : _locale.value;
      const message = getLocaleMessage(targetLocale);
      return resolveValue(message, key) !== null;
    }
    function resolveMessages(key) {
      let messages3 = null;
      const locales = getLocaleChain(_context, _fallbackLocale.value, _locale.value);
      for (let i2 = 0; i2 < locales.length; i2++) {
        const targetLocaleMessages = _messages.value[locales[i2]] || {};
        const messageValue = resolveValue(targetLocaleMessages, key);
        if (messageValue != null) {
          messages3 = messageValue;
          break;
        }
      }
      return messages3;
    }
    function tm(key) {
      const messages3 = resolveMessages(key);
      return messages3 != null ? messages3 : __root ? __root.tm(key) || {} : {};
    }
    function getLocaleMessage(locale2) {
      return _messages.value[locale2] || {};
    }
    function setLocaleMessage(locale2, message) {
      _messages.value[locale2] = message;
      _context.messages = _messages.value;
    }
    function mergeLocaleMessage(locale2, message) {
      _messages.value[locale2] = _messages.value[locale2] || {};
      deepCopy(message, _messages.value[locale2]);
      _context.messages = _messages.value;
    }
    function getDateTimeFormat(locale2) {
      return _datetimeFormats.value[locale2] || {};
    }
    function setDateTimeFormat(locale2, format2) {
      _datetimeFormats.value[locale2] = format2;
      _context.datetimeFormats = _datetimeFormats.value;
      clearDateTimeFormat(_context, locale2, format2);
    }
    function mergeDateTimeFormat(locale2, format2) {
      _datetimeFormats.value[locale2] = assign(_datetimeFormats.value[locale2] || {}, format2);
      _context.datetimeFormats = _datetimeFormats.value;
      clearDateTimeFormat(_context, locale2, format2);
    }
    function getNumberFormat(locale2) {
      return _numberFormats.value[locale2] || {};
    }
    function setNumberFormat(locale2, format2) {
      _numberFormats.value[locale2] = format2;
      _context.numberFormats = _numberFormats.value;
      clearNumberFormat(_context, locale2, format2);
    }
    function mergeNumberFormat(locale2, format2) {
      _numberFormats.value[locale2] = assign(_numberFormats.value[locale2] || {}, format2);
      _context.numberFormats = _numberFormats.value;
      clearNumberFormat(_context, locale2, format2);
    }
    composerID++;
    if (__root) {
      vue.watch(__root.locale, (val) => {
        if (_inheritLocale) {
          _locale.value = val;
          _context.locale = val;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      });
      vue.watch(__root.fallbackLocale, (val) => {
        if (_inheritLocale) {
          _fallbackLocale.value = val;
          _context.fallbackLocale = val;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      });
    }
    const composer = {
      id: composerID,
      locale,
      fallbackLocale,
      get inheritLocale() {
        return _inheritLocale;
      },
      set inheritLocale(val) {
        _inheritLocale = val;
        if (val && __root) {
          _locale.value = __root.locale.value;
          _fallbackLocale.value = __root.fallbackLocale.value;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      },
      get availableLocales() {
        return Object.keys(_messages.value).sort();
      },
      messages: messages2,
      datetimeFormats,
      numberFormats,
      get modifiers() {
        return _modifiers;
      },
      get pluralRules() {
        return _pluralRules || {};
      },
      get isGlobal() {
        return _isGlobal;
      },
      get missingWarn() {
        return _missingWarn;
      },
      set missingWarn(val) {
        _missingWarn = val;
        _context.missingWarn = _missingWarn;
      },
      get fallbackWarn() {
        return _fallbackWarn;
      },
      set fallbackWarn(val) {
        _fallbackWarn = val;
        _context.fallbackWarn = _fallbackWarn;
      },
      get fallbackRoot() {
        return _fallbackRoot;
      },
      set fallbackRoot(val) {
        _fallbackRoot = val;
      },
      get fallbackFormat() {
        return _fallbackFormat;
      },
      set fallbackFormat(val) {
        _fallbackFormat = val;
        _context.fallbackFormat = _fallbackFormat;
      },
      get warnHtmlMessage() {
        return _warnHtmlMessage;
      },
      set warnHtmlMessage(val) {
        _warnHtmlMessage = val;
        _context.warnHtmlMessage = val;
      },
      get escapeParameter() {
        return _escapeParameter;
      },
      set escapeParameter(val) {
        _escapeParameter = val;
        _context.escapeParameter = val;
      },
      t: t2,
      rt: rt2,
      d: d2,
      n: n2,
      te: te2,
      tm,
      getLocaleMessage,
      setLocaleMessage,
      mergeLocaleMessage,
      getDateTimeFormat,
      setDateTimeFormat,
      mergeDateTimeFormat,
      getNumberFormat,
      setNumberFormat,
      mergeNumberFormat,
      getPostTranslationHandler,
      setPostTranslationHandler,
      getMissingHandler,
      setMissingHandler,
      [TransrateVNodeSymbol]: transrateVNode,
      [NumberPartsSymbol]: numberParts,
      [DatetimePartsSymbol]: datetimeParts,
      [SetPluralRulesSymbol]: setPluralRules,
      [InejctWithOption]: options.__injectWithOption
      // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    {
      composer[EnableEmitter] = (emitter) => {
        _context.__v_emitter = emitter;
      };
      composer[DisableEmitter] = () => {
        _context.__v_emitter = void 0;
      };
    }
    return composer;
  }
  function convertComposerOptions(options) {
    const locale = isString(options.locale) ? options.locale : "en-US";
    const fallbackLocale = isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
    const missing = isFunction(options.missing) ? options.missing : void 0;
    const missingWarn = isBoolean(options.silentTranslationWarn) || isRegExp(options.silentTranslationWarn) ? !options.silentTranslationWarn : true;
    const fallbackWarn = isBoolean(options.silentFallbackWarn) || isRegExp(options.silentFallbackWarn) ? !options.silentFallbackWarn : true;
    const fallbackRoot = isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
    const fallbackFormat = !!options.formatFallbackMessages;
    const modifiers = isPlainObject(options.modifiers) ? options.modifiers : {};
    const pluralizationRules = options.pluralizationRules;
    const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : void 0;
    const warnHtmlMessage = isString(options.warnHtmlInMessage) ? options.warnHtmlInMessage !== "off" : true;
    const escapeParameter = !!options.escapeParameterHtml;
    const inheritLocale = isBoolean(options.sync) ? options.sync : true;
    if (options.formatter) {
      warn(getWarnMessage(
        8
        /* NOT_SUPPORTED_FORMATTER */
      ));
    }
    if (options.preserveDirectiveContent) {
      warn(getWarnMessage(
        9
        /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
      ));
    }
    let messages2 = options.messages;
    if (isPlainObject(options.sharedMessages)) {
      const sharedMessages = options.sharedMessages;
      const locales = Object.keys(sharedMessages);
      messages2 = locales.reduce((messages3, locale2) => {
        const message = messages3[locale2] || (messages3[locale2] = {});
        assign(message, sharedMessages[locale2]);
        return messages3;
      }, messages2 || {});
    }
    const { __i18n, __root, __injectWithOption } = options;
    const datetimeFormats = options.datetimeFormats;
    const numberFormats = options.numberFormats;
    const flatJson = options.flatJson;
    return {
      locale,
      fallbackLocale,
      messages: messages2,
      flatJson,
      datetimeFormats,
      numberFormats,
      missing,
      missingWarn,
      fallbackWarn,
      fallbackRoot,
      fallbackFormat,
      modifiers,
      pluralRules: pluralizationRules,
      postTranslation,
      warnHtmlMessage,
      escapeParameter,
      inheritLocale,
      __i18n,
      __root,
      __injectWithOption
    };
  }
  function createVueI18n(options = {}) {
    const composer = createComposer(convertComposerOptions(options));
    const vueI18n = {
      // id
      id: composer.id,
      // locale
      get locale() {
        return composer.locale.value;
      },
      set locale(val) {
        composer.locale.value = val;
      },
      // fallbackLocale
      get fallbackLocale() {
        return composer.fallbackLocale.value;
      },
      set fallbackLocale(val) {
        composer.fallbackLocale.value = val;
      },
      // messages
      get messages() {
        return composer.messages.value;
      },
      // datetimeFormats
      get datetimeFormats() {
        return composer.datetimeFormats.value;
      },
      // numberFormats
      get numberFormats() {
        return composer.numberFormats.value;
      },
      // availableLocales
      get availableLocales() {
        return composer.availableLocales;
      },
      // formatter
      get formatter() {
        warn(getWarnMessage(
          8
          /* NOT_SUPPORTED_FORMATTER */
        ));
        return {
          interpolate() {
            return [];
          }
        };
      },
      set formatter(val) {
        warn(getWarnMessage(
          8
          /* NOT_SUPPORTED_FORMATTER */
        ));
      },
      // missing
      get missing() {
        return composer.getMissingHandler();
      },
      set missing(handler) {
        composer.setMissingHandler(handler);
      },
      // silentTranslationWarn
      get silentTranslationWarn() {
        return isBoolean(composer.missingWarn) ? !composer.missingWarn : composer.missingWarn;
      },
      set silentTranslationWarn(val) {
        composer.missingWarn = isBoolean(val) ? !val : val;
      },
      // silentFallbackWarn
      get silentFallbackWarn() {
        return isBoolean(composer.fallbackWarn) ? !composer.fallbackWarn : composer.fallbackWarn;
      },
      set silentFallbackWarn(val) {
        composer.fallbackWarn = isBoolean(val) ? !val : val;
      },
      // modifiers
      get modifiers() {
        return composer.modifiers;
      },
      // formatFallbackMessages
      get formatFallbackMessages() {
        return composer.fallbackFormat;
      },
      set formatFallbackMessages(val) {
        composer.fallbackFormat = val;
      },
      // postTranslation
      get postTranslation() {
        return composer.getPostTranslationHandler();
      },
      set postTranslation(handler) {
        composer.setPostTranslationHandler(handler);
      },
      // sync
      get sync() {
        return composer.inheritLocale;
      },
      set sync(val) {
        composer.inheritLocale = val;
      },
      // warnInHtmlMessage
      get warnHtmlInMessage() {
        return composer.warnHtmlMessage ? "warn" : "off";
      },
      set warnHtmlInMessage(val) {
        composer.warnHtmlMessage = val !== "off";
      },
      // escapeParameterHtml
      get escapeParameterHtml() {
        return composer.escapeParameter;
      },
      set escapeParameterHtml(val) {
        composer.escapeParameter = val;
      },
      // preserveDirectiveContent
      get preserveDirectiveContent() {
        warn(getWarnMessage(
          9
          /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
        ));
        return true;
      },
      set preserveDirectiveContent(val) {
        warn(getWarnMessage(
          9
          /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
        ));
      },
      // pluralizationRules
      get pluralizationRules() {
        return composer.pluralRules || {};
      },
      // for internal
      __composer: composer,
      // t
      t(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = {};
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(
            15
            /* INVALID_ARGUMENT */
          );
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject(arg2)) {
          named = arg2;
        }
        if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject(arg3)) {
          named = arg3;
        }
        return composer.t(key, list || named || {}, options2);
      },
      rt(...args) {
        return composer.rt(...args);
      },
      // tc
      tc(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = { plural: 1 };
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(
            15
            /* INVALID_ARGUMENT */
          );
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isNumber(arg2)) {
          options2.plural = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject(arg2)) {
          named = arg2;
        }
        if (isString(arg3)) {
          options2.locale = arg3;
        } else if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject(arg3)) {
          named = arg3;
        }
        return composer.t(key, list || named || {}, options2);
      },
      // te
      te(key, locale) {
        return composer.te(key, locale);
      },
      // tm
      tm(key) {
        return composer.tm(key);
      },
      // getLocaleMessage
      getLocaleMessage(locale) {
        return composer.getLocaleMessage(locale);
      },
      // setLocaleMessage
      setLocaleMessage(locale, message) {
        composer.setLocaleMessage(locale, message);
      },
      // mergeLocaleMessage
      mergeLocaleMessage(locale, message) {
        composer.mergeLocaleMessage(locale, message);
      },
      // d
      d(...args) {
        return composer.d(...args);
      },
      // getDateTimeFormat
      getDateTimeFormat(locale) {
        return composer.getDateTimeFormat(locale);
      },
      // setDateTimeFormat
      setDateTimeFormat(locale, format2) {
        composer.setDateTimeFormat(locale, format2);
      },
      // mergeDateTimeFormat
      mergeDateTimeFormat(locale, format2) {
        composer.mergeDateTimeFormat(locale, format2);
      },
      // n
      n(...args) {
        return composer.n(...args);
      },
      // getNumberFormat
      getNumberFormat(locale) {
        return composer.getNumberFormat(locale);
      },
      // setNumberFormat
      setNumberFormat(locale, format2) {
        composer.setNumberFormat(locale, format2);
      },
      // mergeNumberFormat
      mergeNumberFormat(locale, format2) {
        composer.mergeNumberFormat(locale, format2);
      },
      // getChoiceIndex
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getChoiceIndex(choice, choicesLength) {
        warn(getWarnMessage(
          10
          /* NOT_SUPPORTED_GET_CHOICE_INDEX */
        ));
        return -1;
      },
      // for internal
      __onComponentInstanceCreated(target) {
        const { componentInstanceCreatedListener } = options;
        if (componentInstanceCreatedListener) {
          componentInstanceCreatedListener(target, vueI18n);
        }
      }
    };
    {
      vueI18n.__enableEmitter = (emitter) => {
        const __composer = composer;
        __composer[EnableEmitter] && __composer[EnableEmitter](emitter);
      };
      vueI18n.__disableEmitter = () => {
        const __composer = composer;
        __composer[DisableEmitter] && __composer[DisableEmitter]();
      };
    }
    return vueI18n;
  }
  const baseFormatProps = {
    tag: {
      type: [String, Object]
    },
    locale: {
      type: String
    },
    scope: {
      type: String,
      validator: (val) => val === "parent" || val === "global",
      default: "parent"
    },
    i18n: {
      type: Object
    }
  };
  const Translation = {
    /* eslint-disable */
    name: "i18n-t",
    props: assign({
      keypath: {
        type: String,
        required: true
      },
      plural: {
        type: [Number, String],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: (val) => isNumber(val) || !isNaN(val)
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const { slots, attrs: attrs2 } = context;
      const i18n2 = props.i18n || useI18n({
        useScope: props.scope,
        __useComponent: true
      });
      const keys = Object.keys(slots).filter((key) => key !== "_");
      return () => {
        const options = {};
        if (props.locale) {
          options.locale = props.locale;
        }
        if (props.plural !== void 0) {
          options.plural = isString(props.plural) ? +props.plural : props.plural;
        }
        const arg = getInterpolateArg(context, keys);
        const children = i18n2[TransrateVNodeSymbol](props.keypath, arg, options);
        const assignedAttrs = assign({}, attrs2);
        return isString(props.tag) ? vue.h(props.tag, assignedAttrs, children) : isObject$1(props.tag) ? vue.h(props.tag, assignedAttrs, children) : vue.h(vue.Fragment, assignedAttrs, children);
      };
    }
  };
  function getInterpolateArg({ slots }, keys) {
    if (keys.length === 1 && keys[0] === "default") {
      return slots.default ? slots.default() : [];
    } else {
      return keys.reduce((arg, key) => {
        const slot = slots[key];
        if (slot) {
          arg[key] = slot();
        }
        return arg;
      }, {});
    }
  }
  function renderFormatter(props, context, slotKeys, partFormatter) {
    const { slots, attrs: attrs2 } = context;
    return () => {
      const options = { part: true };
      let overrides = {};
      if (props.locale) {
        options.locale = props.locale;
      }
      if (isString(props.format)) {
        options.key = props.format;
      } else if (isObject$1(props.format)) {
        if (isString(props.format.key)) {
          options.key = props.format.key;
        }
        overrides = Object.keys(props.format).reduce((options2, prop) => {
          return slotKeys.includes(prop) ? assign({}, options2, { [prop]: props.format[prop] }) : options2;
        }, {});
      }
      const parts = partFormatter(...[props.value, options, overrides]);
      let children = [options.key];
      if (isArray(parts)) {
        children = parts.map((part, index) => {
          const slot = slots[part.type];
          return slot ? slot({ [part.type]: part.value, index, parts }) : [part.value];
        });
      } else if (isString(parts)) {
        children = [parts];
      }
      const assignedAttrs = assign({}, attrs2);
      return isString(props.tag) ? vue.h(props.tag, assignedAttrs, children) : isObject$1(props.tag) ? vue.h(props.tag, assignedAttrs, children) : vue.h(vue.Fragment, assignedAttrs, children);
    };
  }
  const NUMBER_FORMAT_KEYS = [
    "localeMatcher",
    "style",
    "unit",
    "unitDisplay",
    "currency",
    "currencyDisplay",
    "useGrouping",
    "numberingSystem",
    "minimumIntegerDigits",
    "minimumFractionDigits",
    "maximumFractionDigits",
    "minimumSignificantDigits",
    "maximumSignificantDigits",
    "notation",
    "formatMatcher"
  ];
  const NumberFormat = {
    /* eslint-disable */
    name: "i18n-n",
    props: assign({
      value: {
        type: Number,
        required: true
      },
      format: {
        type: [String, Object]
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const i18n2 = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
      return renderFormatter(props, context, NUMBER_FORMAT_KEYS, (...args) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        i18n2[NumberPartsSymbol](...args)
      ));
    }
  };
  const DATETIME_FORMAT_KEYS = [
    "dateStyle",
    "timeStyle",
    "fractionalSecondDigits",
    "calendar",
    "dayPeriod",
    "numberingSystem",
    "localeMatcher",
    "timeZone",
    "hour12",
    "hourCycle",
    "formatMatcher",
    "weekday",
    "era",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "timeZoneName"
  ];
  const DatetimeFormat = {
    /* eslint-disable */
    name: "i18n-d",
    props: assign({
      value: {
        type: [Number, Date],
        required: true
      },
      format: {
        type: [String, Object]
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const i18n2 = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
      return renderFormatter(props, context, DATETIME_FORMAT_KEYS, (...args) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        i18n2[DatetimePartsSymbol](...args)
      ));
    }
  };
  function getComposer$2(i18n2, instance2) {
    const i18nInternal = i18n2;
    if (i18n2.mode === "composition") {
      return i18nInternal.__getInstance(instance2) || i18n2.global;
    } else {
      const vueI18n = i18nInternal.__getInstance(instance2);
      return vueI18n != null ? vueI18n.__composer : i18n2.global.__composer;
    }
  }
  function vTDirective(i18n2) {
    const bind = (el, { instance: instance2, value, modifiers }) => {
      if (!instance2 || !instance2.$) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      const composer = getComposer$2(i18n2, instance2.$);
      if (modifiers.preserve) {
        warn(getWarnMessage(
          7
          /* NOT_SUPPORTED_PRESERVE */
        ));
      }
      const parsedValue = parseValue(value);
      el.textContent = composer.t(...makeParams(parsedValue));
    };
    return {
      beforeMount: bind,
      beforeUpdate: bind
    };
  }
  function parseValue(value) {
    if (isString(value)) {
      return { path: value };
    } else if (isPlainObject(value)) {
      if (!("path" in value)) {
        throw createI18nError(19, "path");
      }
      return value;
    } else {
      throw createI18nError(
        20
        /* INVALID_VALUE */
      );
    }
  }
  function makeParams(value) {
    const { path, locale, args, choice, plural } = value;
    const options = {};
    const named = args || {};
    if (isString(locale)) {
      options.locale = locale;
    }
    if (isNumber(choice)) {
      options.plural = choice;
    }
    if (isNumber(plural)) {
      options.plural = plural;
    }
    return [path, named, options];
  }
  function apply(app, i18n2, ...options) {
    const pluginOptions = isPlainObject(options[0]) ? options[0] : {};
    const useI18nComponentName = !!pluginOptions.useI18nComponentName;
    const globalInstall = isBoolean(pluginOptions.globalInstall) ? pluginOptions.globalInstall : true;
    if (globalInstall && useI18nComponentName) {
      warn(getWarnMessage(11, {
        name: Translation.name
      }));
    }
    if (globalInstall) {
      app.component(!useI18nComponentName ? Translation.name : "i18n", Translation);
      app.component(NumberFormat.name, NumberFormat);
      app.component(DatetimeFormat.name, DatetimeFormat);
    }
    app.directive("t", vTDirective(i18n2));
  }
  const VUE_I18N_COMPONENT_TYPES = "vue-i18n: composer properties";
  let devtoolsApi;
  async function enableDevTools(app, i18n2) {
    return new Promise((resolve, reject) => {
      try {
        setupDevtoolsPlugin({
          id: "vue-devtools-plugin-vue-i18n",
          label: VueDevToolsLabels[
            "vue-devtools-plugin-vue-i18n"
            /* PLUGIN */
          ],
          packageName: "vue-i18n",
          homepage: "https://vue-i18n.intlify.dev",
          logo: "https://vue-i18n.intlify.dev/vue-i18n-devtools-logo.png",
          componentStateTypes: [VUE_I18N_COMPONENT_TYPES],
          app
        }, (api) => {
          devtoolsApi = api;
          api.on.visitComponentTree(({ componentInstance, treeNode }) => {
            updateComponentTreeTags(componentInstance, treeNode, i18n2);
          });
          api.on.inspectComponent(({ componentInstance, instanceData }) => {
            if (componentInstance.vnode.el.__VUE_I18N__ && instanceData) {
              if (i18n2.mode === "legacy") {
                if (componentInstance.vnode.el.__VUE_I18N__ !== i18n2.global.__composer) {
                  inspectComposer(instanceData, componentInstance.vnode.el.__VUE_I18N__);
                }
              } else {
                inspectComposer(instanceData, componentInstance.vnode.el.__VUE_I18N__);
              }
            }
          });
          api.addInspector({
            id: "vue-i18n-resource-inspector",
            label: VueDevToolsLabels[
              "vue-i18n-resource-inspector"
              /* CUSTOM_INSPECTOR */
            ],
            icon: "language",
            treeFilterPlaceholder: VueDevToolsPlaceholders[
              "vue-i18n-resource-inspector"
              /* CUSTOM_INSPECTOR */
            ]
          });
          api.on.getInspectorTree((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              registerScope(payload, i18n2);
            }
          });
          api.on.getInspectorState((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              inspectScope(payload, i18n2);
            }
          });
          api.on.editInspectorState((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              editScope(payload, i18n2);
            }
          });
          api.addTimelineLayer({
            id: "vue-i18n-timeline",
            label: VueDevToolsLabels[
              "vue-i18n-timeline"
              /* TIMELINE */
            ],
            color: VueDevToolsTimelineColors[
              "vue-i18n-timeline"
              /* TIMELINE */
            ]
          });
          resolve(true);
        });
      } catch (e2) {
        console.error(e2);
        reject(false);
      }
    });
  }
  function updateComponentTreeTags(instance2, treeNode, i18n2) {
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    if (instance2 && instance2.vnode.el.__VUE_I18N__) {
      if (instance2.vnode.el.__VUE_I18N__ !== global2) {
        const label = instance2.type.name || instance2.type.displayName || instance2.type.__file;
        const tag = {
          label: `i18n (${label} Scope)`,
          textColor: 0,
          backgroundColor: 16764185
        };
        treeNode.tags.push(tag);
      }
    }
  }
  function inspectComposer(instanceData, composer) {
    const type = VUE_I18N_COMPONENT_TYPES;
    instanceData.state.push({
      type,
      key: "locale",
      editable: true,
      value: composer.locale.value
    });
    instanceData.state.push({
      type,
      key: "availableLocales",
      editable: false,
      value: composer.availableLocales
    });
    instanceData.state.push({
      type,
      key: "fallbackLocale",
      editable: true,
      value: composer.fallbackLocale.value
    });
    instanceData.state.push({
      type,
      key: "inheritLocale",
      editable: true,
      value: composer.inheritLocale
    });
    instanceData.state.push({
      type,
      key: "messages",
      editable: false,
      value: getLocaleMessageValue(composer.messages.value)
    });
    instanceData.state.push({
      type,
      key: "datetimeFormats",
      editable: false,
      value: composer.datetimeFormats.value
    });
    instanceData.state.push({
      type,
      key: "numberFormats",
      editable: false,
      value: composer.numberFormats.value
    });
  }
  function getLocaleMessageValue(messages2) {
    const value = {};
    Object.keys(messages2).forEach((key) => {
      const v2 = messages2[key];
      if (isFunction(v2) && "source" in v2) {
        value[key] = getMessageFunctionDetails(v2);
      } else if (isObject$1(v2)) {
        value[key] = getLocaleMessageValue(v2);
      } else {
        value[key] = v2;
      }
    });
    return value;
  }
  const ESC = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "&": "&amp;"
  };
  function escape$1(s2) {
    return s2.replace(/[<>"&]/g, escapeChar);
  }
  function escapeChar(a2) {
    return ESC[a2] || a2;
  }
  function getMessageFunctionDetails(func) {
    const argString = func.source ? `("${escape$1(func.source)}")` : `(?)`;
    return {
      _custom: {
        type: "function",
        display: `<span>ƒ</span> ${argString}`
      }
    };
  }
  function registerScope(payload, i18n2) {
    payload.rootNodes.push({
      id: "global",
      label: "Global Scope"
    });
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    for (const [keyInstance, instance2] of i18n2.__instances) {
      const composer = i18n2.mode === "composition" ? instance2 : instance2.__composer;
      if (global2 === composer) {
        continue;
      }
      const label = keyInstance.type.name || keyInstance.type.displayName || keyInstance.type.__file;
      payload.rootNodes.push({
        id: composer.id.toString(),
        label: `${label} Scope`
      });
    }
  }
  function getComposer$1(nodeId, i18n2) {
    if (nodeId === "global") {
      return i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    } else {
      const instance2 = Array.from(i18n2.__instances.values()).find((item) => item.id.toString() === nodeId);
      if (instance2) {
        return i18n2.mode === "composition" ? instance2 : instance2.__composer;
      } else {
        return null;
      }
    }
  }
  function inspectScope(payload, i18n2) {
    const composer = getComposer$1(payload.nodeId, i18n2);
    if (composer) {
      payload.state = makeScopeInspectState(composer);
    }
  }
  function makeScopeInspectState(composer) {
    const state = {};
    const localeType = "Locale related info";
    const localeStates = [
      {
        type: localeType,
        key: "locale",
        editable: true,
        value: composer.locale.value
      },
      {
        type: localeType,
        key: "fallbackLocale",
        editable: true,
        value: composer.fallbackLocale.value
      },
      {
        type: localeType,
        key: "availableLocales",
        editable: false,
        value: composer.availableLocales
      },
      {
        type: localeType,
        key: "inheritLocale",
        editable: true,
        value: composer.inheritLocale
      }
    ];
    state[localeType] = localeStates;
    const localeMessagesType = "Locale messages info";
    const localeMessagesStates = [
      {
        type: localeMessagesType,
        key: "messages",
        editable: false,
        value: getLocaleMessageValue(composer.messages.value)
      }
    ];
    state[localeMessagesType] = localeMessagesStates;
    const datetimeFormatsType = "Datetime formats info";
    const datetimeFormatsStates = [
      {
        type: datetimeFormatsType,
        key: "datetimeFormats",
        editable: false,
        value: composer.datetimeFormats.value
      }
    ];
    state[datetimeFormatsType] = datetimeFormatsStates;
    const numberFormatsType = "Datetime formats info";
    const numberFormatsStates = [
      {
        type: numberFormatsType,
        key: "numberFormats",
        editable: false,
        value: composer.numberFormats.value
      }
    ];
    state[numberFormatsType] = numberFormatsStates;
    return state;
  }
  function addTimelineEvent(event, payload) {
    if (devtoolsApi) {
      let groupId;
      if (payload && "groupId" in payload) {
        groupId = payload.groupId;
        delete payload.groupId;
      }
      devtoolsApi.addTimelineEvent({
        layerId: "vue-i18n-timeline",
        event: {
          title: event,
          groupId,
          time: Date.now(),
          meta: {},
          data: payload || {},
          logType: event === "compile-error" ? "error" : event === "fallback" || event === "missing" ? "warning" : "default"
        }
      });
    }
  }
  function editScope(payload, i18n2) {
    const composer = getComposer$1(payload.nodeId, i18n2);
    if (composer) {
      const [field] = payload.path;
      if (field === "locale" && isString(payload.state.value)) {
        composer.locale.value = payload.state.value;
      } else if (field === "fallbackLocale" && (isString(payload.state.value) || isArray(payload.state.value) || isObject$1(payload.state.value))) {
        composer.fallbackLocale.value = payload.state.value;
      } else if (field === "inheritLocale" && isBoolean(payload.state.value)) {
        composer.inheritLocale = payload.state.value;
      }
    }
  }
  function defineMixin(vuei18n, composer, i18n2) {
    return {
      beforeCreate() {
        const instance2 = vue.getCurrentInstance();
        if (!instance2) {
          throw createI18nError(
            22
            /* UNEXPECTED_ERROR */
          );
        }
        const options = this.$options;
        if (options.i18n) {
          const optionsI18n = options.i18n;
          if (options.__i18n) {
            optionsI18n.__i18n = options.__i18n;
          }
          optionsI18n.__root = composer;
          if (this === this.$root) {
            this.$i18n = mergeToRoot(vuei18n, optionsI18n);
          } else {
            optionsI18n.__injectWithOption = true;
            this.$i18n = createVueI18n(optionsI18n);
          }
        } else if (options.__i18n) {
          if (this === this.$root) {
            this.$i18n = mergeToRoot(vuei18n, options);
          } else {
            this.$i18n = createVueI18n({
              __i18n: options.__i18n,
              __injectWithOption: true,
              __root: composer
            });
          }
        } else {
          this.$i18n = vuei18n;
        }
        vuei18n.__onComponentInstanceCreated(this.$i18n);
        i18n2.__setInstance(instance2, this.$i18n);
        this.$t = (...args) => this.$i18n.t(...args);
        this.$rt = (...args) => this.$i18n.rt(...args);
        this.$tc = (...args) => this.$i18n.tc(...args);
        this.$te = (key, locale) => this.$i18n.te(key, locale);
        this.$d = (...args) => this.$i18n.d(...args);
        this.$n = (...args) => this.$i18n.n(...args);
        this.$tm = (key) => this.$i18n.tm(key);
      },
      mounted() {
        {
          this.$el.__VUE_I18N__ = this.$i18n.__composer;
          const emitter = this.__v_emitter = createEmitter();
          const _vueI18n = this.$i18n;
          _vueI18n.__enableEmitter && _vueI18n.__enableEmitter(emitter);
          emitter.on("*", addTimelineEvent);
        }
      },
      beforeUnmount() {
        const instance2 = vue.getCurrentInstance();
        if (!instance2) {
          throw createI18nError(
            22
            /* UNEXPECTED_ERROR */
          );
        }
        {
          if (this.__v_emitter) {
            this.__v_emitter.off("*", addTimelineEvent);
            delete this.__v_emitter;
          }
          const _vueI18n = this.$i18n;
          _vueI18n.__disableEmitter && _vueI18n.__disableEmitter();
          delete this.$el.__VUE_I18N__;
        }
        delete this.$t;
        delete this.$rt;
        delete this.$tc;
        delete this.$te;
        delete this.$d;
        delete this.$n;
        delete this.$tm;
        i18n2.__deleteInstance(instance2);
        delete this.$i18n;
      }
    };
  }
  function mergeToRoot(root, options) {
    root.locale = options.locale || root.locale;
    root.fallbackLocale = options.fallbackLocale || root.fallbackLocale;
    root.missing = options.missing || root.missing;
    root.silentTranslationWarn = options.silentTranslationWarn || root.silentFallbackWarn;
    root.silentFallbackWarn = options.silentFallbackWarn || root.silentFallbackWarn;
    root.formatFallbackMessages = options.formatFallbackMessages || root.formatFallbackMessages;
    root.postTranslation = options.postTranslation || root.postTranslation;
    root.warnHtmlInMessage = options.warnHtmlInMessage || root.warnHtmlInMessage;
    root.escapeParameterHtml = options.escapeParameterHtml || root.escapeParameterHtml;
    root.sync = options.sync || root.sync;
    root.__composer[SetPluralRulesSymbol](options.pluralizationRules || root.pluralizationRules);
    const messages2 = getLocaleMessages(root.locale, {
      messages: options.messages,
      __i18n: options.__i18n
    });
    Object.keys(messages2).forEach((locale) => root.mergeLocaleMessage(locale, messages2[locale]));
    if (options.datetimeFormats) {
      Object.keys(options.datetimeFormats).forEach((locale) => root.mergeDateTimeFormat(locale, options.datetimeFormats[locale]));
    }
    if (options.numberFormats) {
      Object.keys(options.numberFormats).forEach((locale) => root.mergeNumberFormat(locale, options.numberFormats[locale]));
    }
    return root;
  }
  function createI18n(options = {}) {
    const __legacyMode = isBoolean(options.legacy) ? options.legacy : true;
    const __globalInjection = !!options.globalInjection;
    const __instances = /* @__PURE__ */ new Map();
    const __global = __legacyMode ? createVueI18n(options) : createComposer(options);
    const symbol = makeSymbol("vue-i18n");
    const i18n2 = {
      // mode
      get mode() {
        return __legacyMode ? "legacy" : "composition";
      },
      // install plugin
      async install(app, ...options2) {
        {
          app.__VUE_I18N__ = i18n2;
        }
        app.__VUE_I18N_SYMBOL__ = symbol;
        app.provide(app.__VUE_I18N_SYMBOL__, i18n2);
        if (!__legacyMode && __globalInjection) {
          injectGlobalFields(app, i18n2.global);
        }
        {
          apply(app, i18n2, ...options2);
        }
        if (__legacyMode) {
          app.mixin(defineMixin(__global, __global.__composer, i18n2));
        }
        {
          const ret = await enableDevTools(app, i18n2);
          if (!ret) {
            throw createI18nError(
              21
              /* CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN */
            );
          }
          const emitter = createEmitter();
          if (__legacyMode) {
            const _vueI18n = __global;
            _vueI18n.__enableEmitter && _vueI18n.__enableEmitter(emitter);
          } else {
            const _composer = __global;
            _composer[EnableEmitter] && _composer[EnableEmitter](emitter);
          }
          emitter.on("*", addTimelineEvent);
        }
      },
      // global accessor
      get global() {
        return __global;
      },
      // @internal
      __instances,
      // @internal
      __getInstance(component) {
        return __instances.get(component) || null;
      },
      // @internal
      __setInstance(component, instance2) {
        __instances.set(component, instance2);
      },
      // @internal
      __deleteInstance(component) {
        __instances.delete(component);
      }
    };
    return i18n2;
  }
  function useI18n(options = {}) {
    const instance2 = vue.getCurrentInstance();
    if (instance2 == null) {
      throw createI18nError(
        16
        /* MUST_BE_CALL_SETUP_TOP */
      );
    }
    if (!instance2.appContext.app.__VUE_I18N_SYMBOL__) {
      throw createI18nError(
        17
        /* NOT_INSLALLED */
      );
    }
    const i18n2 = vue.inject(instance2.appContext.app.__VUE_I18N_SYMBOL__);
    if (!i18n2) {
      throw createI18nError(
        22
        /* UNEXPECTED_ERROR */
      );
    }
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    const scope = isEmptyObject(options) ? "__i18n" in instance2.type ? "local" : "global" : !options.useScope ? "local" : options.useScope;
    if (scope === "global") {
      let messages2 = isObject$1(options.messages) ? options.messages : {};
      if ("__i18nGlobal" in instance2.type) {
        messages2 = getLocaleMessages(global2.locale.value, {
          messages: messages2,
          __i18n: instance2.type.__i18nGlobal
        });
      }
      const locales = Object.keys(messages2);
      if (locales.length) {
        locales.forEach((locale) => {
          global2.mergeLocaleMessage(locale, messages2[locale]);
        });
      }
      if (isObject$1(options.datetimeFormats)) {
        const locales2 = Object.keys(options.datetimeFormats);
        if (locales2.length) {
          locales2.forEach((locale) => {
            global2.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
          });
        }
      }
      if (isObject$1(options.numberFormats)) {
        const locales2 = Object.keys(options.numberFormats);
        if (locales2.length) {
          locales2.forEach((locale) => {
            global2.mergeNumberFormat(locale, options.numberFormats[locale]);
          });
        }
      }
      return global2;
    }
    if (scope === "parent") {
      let composer2 = getComposer(i18n2, instance2, options.__useComponent);
      if (composer2 == null) {
        {
          warn(getWarnMessage(
            12
            /* NOT_FOUND_PARENT_SCOPE */
          ));
        }
        composer2 = global2;
      }
      return composer2;
    }
    if (i18n2.mode === "legacy") {
      throw createI18nError(
        18
        /* NOT_AVAILABLE_IN_LEGACY_MODE */
      );
    }
    const i18nInternal = i18n2;
    let composer = i18nInternal.__getInstance(instance2);
    if (composer == null) {
      const type = instance2.type;
      const composerOptions = assign({}, options);
      if (type.__i18n) {
        composerOptions.__i18n = type.__i18n;
      }
      if (global2) {
        composerOptions.__root = global2;
      }
      composer = createComposer(composerOptions);
      setupLifeCycle(i18nInternal, instance2, composer);
      i18nInternal.__setInstance(instance2, composer);
    }
    return composer;
  }
  function getComposer(i18n2, target, useComponent = false) {
    let composer = null;
    const root = target.root;
    let current = target.parent;
    while (current != null) {
      const i18nInternal = i18n2;
      if (i18n2.mode === "composition") {
        composer = i18nInternal.__getInstance(current);
      } else {
        const vueI18n = i18nInternal.__getInstance(current);
        if (vueI18n != null) {
          composer = vueI18n.__composer;
        }
        if (useComponent && composer && !composer[InejctWithOption]) {
          composer = null;
        }
      }
      if (composer != null) {
        break;
      }
      if (root === current) {
        break;
      }
      current = current.parent;
    }
    return composer;
  }
  function setupLifeCycle(i18n2, target, composer) {
    let emitter = null;
    vue.onMounted(() => {
      if (target.vnode.el) {
        target.vnode.el.__VUE_I18N__ = composer;
        emitter = createEmitter();
        const _composer = composer;
        _composer[EnableEmitter] && _composer[EnableEmitter](emitter);
        emitter.on("*", addTimelineEvent);
      }
    }, target);
    vue.onUnmounted(() => {
      if (target.vnode.el && target.vnode.el.__VUE_I18N__) {
        emitter && emitter.off("*", addTimelineEvent);
        const _composer = composer;
        _composer[DisableEmitter] && _composer[DisableEmitter]();
        delete target.vnode.el.__VUE_I18N__;
      }
      i18n2.__deleteInstance(target);
    }, target);
  }
  const globalExportProps = [
    "locale",
    "fallbackLocale",
    "availableLocales"
  ];
  const globalExportMethods = ["t", "rt", "d", "n", "tm"];
  function injectGlobalFields(app, composer) {
    const i18n2 = /* @__PURE__ */ Object.create(null);
    globalExportProps.forEach((prop) => {
      const desc = Object.getOwnPropertyDescriptor(composer, prop);
      if (!desc) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      const wrap = vue.isRef(desc.value) ? {
        get() {
          return desc.value.value;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(val) {
          desc.value.value = val;
        }
      } : {
        get() {
          return desc.get && desc.get();
        }
      };
      Object.defineProperty(i18n2, prop, wrap);
    });
    app.config.globalProperties.$i18n = i18n2;
    globalExportMethods.forEach((method) => {
      const desc = Object.getOwnPropertyDescriptor(composer, method);
      if (!desc || !desc.value) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      Object.defineProperty(app.config.globalProperties, `$${method}`, desc);
    });
  }
  {
    initFeatureFlags();
  }
  {
    const target = getGlobalThis();
    target.__INTLIFY__ = true;
    setDevToolsHook(target.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
  }
  const { i18n: { enable: i18nEnable } } = uniStarterConfig;
  const messages = {
    "en": langEn,
    "zh-Hans": zhHans
  };
  let currentLang;
  if (i18nEnable) {
    currentLang = uni.getStorageSync("CURRENT_LANG");
  } else {
    currentLang = "zh-Hans";
  }
  if (!currentLang) {
    if (uni.getLocale) {
      formatAppLog("log", "at lang/i18n.js:18", "获取应用语言:", uni.getLocale());
      let language = "en";
      if (uni.getLocale() != "en") {
        language = "zh-Hans";
      }
      uni.setStorageSync("CURRENT_LANG", language);
      currentLang = language;
    } else {
      uni.getSystemInfo({
        success: function(res) {
          formatAppLog("log", "at lang/i18n.js:28", "获取设备信息:", res);
          let language = "zh-Hans";
          if (res.language == "en") {
            language = "en";
          }
          uni.setStorageSync("CURRENT_LANG", language);
          currentLang = language;
        },
        fail: (err) => {
          formatAppLog("error", "at lang/i18n.js:37", err);
        }
      });
    }
  }
  let i18nConfig = {
    locale: currentLang,
    // set locale
    messages
    // set locale messages
  };
  const i18n = createI18n(i18nConfig);
  if (i18nEnable) {
    formatAppLog("log", "at lang/i18n.js:65", `
	你已开启多语言国际化，将自动根据语言获取【lang/en.js】或【lang/en.js】文件中配置的tabbar的值，
	覆盖你在pages.json中的tabbar的值
	如果你不需要多语言国际化，请打开配置文件uni-starter.config.js找到 -> i18n -> enable把值设置为false
`);
    let initLanguageAfter = () => {
      function $i18n(e2) {
        return i18n.global.messages[i18n.global.locale][e2];
      }
      setTimeout(function() {
        $i18n("tabbar").split(",").forEach((text, index) => {
          uni.setTabBarItem({
            index,
            text,
            complete: (e2) => {
            }
          });
        });
      }, 1);
    };
    initLanguageAfter();
    uni.$on("changeLanguage", (e2) => {
      formatAppLog("log", "at lang/i18n.js:93", "changeLanguage", e2);
      initLanguageAfter();
    });
  }
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(i18n);
    return { app };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue, uni.VueShared);
