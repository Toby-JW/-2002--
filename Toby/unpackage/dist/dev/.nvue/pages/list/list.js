import { i as initVueI18n, f as formatAppLog, D as Ds, r as resolveEasycom, _ as __easycom_1, a as __easycom_2$1, b as __easycom_3, c as __easycom_4$1 } from "../../uni-list.js";
import { openBlock, createElementBlock, toDisplayString, createElementVNode, normalizeStyle, renderSlot, resolveComponent, resolveDynamicComponent, createVNode, createCommentVNode, withCtx, createBlock, Fragment, renderList } from "vue";
import { _ as _export_sfc } from "../../_plugin-vue_export-helper.js";
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
function formatDate(date, format = "yyyy/MM/dd hh:mm:ss") {
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
  let result = format;
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
  format = "yyyy/MM/dd hh:mm:ss"
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
  let ms = date.getTime() - Date.now();
  let absMs = Math.abs(ms);
  if (absMs < threshold[0]) {
    return ms < 0 ? text.justNow : text.soon;
  }
  if (absMs >= threshold[1]) {
    return formatDate(date, format);
  }
  let num;
  let unit;
  let suffix = text.later;
  if (ms < 0) {
    suffix = text.ago;
    ms = -ms;
  }
  const seconds = Math.floor(ms / 1e3);
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
const _sfc_main$3 = {
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
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(
    "u-text",
    null,
    toDisplayString($options.dateShow),
    1
    /* TEXT */
  );
}
const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-dateformat/components/uni-dateformat/uni-dateformat.vue"]]);
const noData$1 = "No Data";
const noNetwork$1 = "Network error";
const toSet$1 = "Go to settings";
const error$1 = "error";
const en = {
  noData: noData$1,
  noNetwork: noNetwork$1,
  toSet: toSet$1,
  error: error$1
};
const noData = "暂无数据";
const noNetwork = "网络异常";
const toSet = "前往设置";
const error = "错误";
const zhHans = {
  noData,
  noNetwork,
  toSet,
  error
};
const messages = {
  en,
  "zh-Hans": zhHans
};
const _imports_0 = "/static/uni-load-state/disconnection.png";
const _style_0$2 = { "box": { "": { "flex": 1, "width": "700rpx", "flexDirection": "column", "alignItems": "center", "justifyContent": "center" } }, "uni-load-more": { "": { "alignItems": "center", "justifyContent": "center" } }, "state-text": { "": { "textAlign": "center", "fontSize": "26rpx", "width": "690rpx", "paddingTop": "10rpx", "paddingRight": "10rpx", "paddingBottom": "10rpx", "paddingLeft": "10rpx", "color": "#999999" } }, "icon-image": { "": { "width": "300rpx" } }, "tip-text": { "": { "color": "#999999", "fontSize": "32rpx", "marginBottom": "30rpx" } }, "btn": { "": { "paddingTop": 5, "paddingRight": 10, "paddingBottom": 5, "paddingLeft": 10, "width": 128, "flexDirection": "row", "alignItems": "center", "justifyContent": "center", "textAlign": "center" } }, "btn-text": { "": { "color": "#999999", "fontSize": 15 } }, "btn-default": { "": { "borderColor": "#999999", "borderStyle": "solid", "borderWidth": 1, "borderRadius": 3 } }, "error": { "": { "width": "690rpx", "color": "#DD524D" } } };
const {
  t
} = initVueI18n(messages);
const _sfc_main$2 = {
  name: "uni-load-state",
  computed: {
    noData() {
      return t("noData");
    },
    noNetwork() {
      return t("noNetwork");
    },
    toSet() {
      return t("toSet");
    },
    error() {
      return t("error");
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
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(
    "view",
    {
      onAppear: _cache[1] || (_cache[1] = (...args) => $options.appear && $options.appear(...args)),
      renderWhole: true
    },
    [
      $props.state.error ? (openBlock(), createElementBlock("view", { key: 0 }, [
        $data.networkType == "none" ? (openBlock(), createElementBlock("view", {
          key: 0,
          class: "box"
        }, [
          createElementVNode("u-image", {
            class: "icon-image",
            src: _imports_0,
            mode: "widthFix"
          }),
          createElementVNode(
            "u-text",
            { class: "tip-text" },
            toDisplayString($options.noNetwork),
            1
            /* TEXT */
          ),
          createElementVNode("view", {
            class: "btn btn-default",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.openSettings && $options.openSettings(...args))
          }, [
            createElementVNode(
              "u-text",
              { class: "btn-text" },
              toDisplayString($options.toSet),
              1
              /* TEXT */
            )
          ])
        ])) : (openBlock(), createElementBlock(
          "u-text",
          {
            key: 1,
            class: "error"
          },
          toDisplayString($options.error) + "：" + toDisplayString(JSON.stringify($props.state.error)),
          1
          /* TEXT */
        ))
      ])) : (openBlock(), createElementBlock(
        "u-text",
        {
          key: 1,
          class: "state-text"
        },
        toDisplayString($props.state.loading ? "加载中..." : $props.state.hasMore ? "上拉加载更多" : "没有更多数据了"),
        1
        /* TEXT */
      ))
    ],
    32
    /* HYDRATE_EVENTS */
  );
}
const __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["styles", [_style_0$2]], ["__file", "G:/HBuilderProjects/Toby/components/uni-load-state/uni-load-state.vue"]]);
const _style_0$1 = { "uni-status-bar": { "": { "height": 20 } } };
const _sfc_main$1 = {
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
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(
    "view",
    {
      style: normalizeStyle({ height: $data.statusBarHeight }),
      class: "uni-status-bar",
      renderWhole: true
    },
    [
      renderSlot(_ctx.$slots, "default")
    ],
    4
    /* STYLE */
  );
}
const statusBar = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["styles", [_style_0$1]], ["__file", "G:/HBuilderProjects/Toby/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar.vue"]]);
var isIos;
isIos = plus.os.name == "iOS";
function judgeIosPermissionPush() {
  var result = false;
  var UIApplication = plus.ios.import("UIApplication");
  var app = UIApplication.sharedApplication();
  var enabledTypes = 0;
  if (app.currentUserNotificationSettings) {
    var settings = app.currentUserNotificationSettings();
    enabledTypes = settings.plusGetAttribute("types");
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:19", "enabledTypes1:" + enabledTypes);
    if (enabledTypes == 0) {
      formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:21", "推送权限没有开启");
    } else {
      result = true;
      formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:24", "已经开启推送功能!");
    }
    plus.ios.deleteObject(settings);
  } else {
    enabledTypes = app.enabledRemoteNotificationTypes();
    if (enabledTypes == 0) {
      formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:30", "推送权限没有开启!");
    } else {
      result = true;
      formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:33", "已经开启推送功能!");
    }
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:35", "enabledTypes2:" + enabledTypes);
  }
  plus.ios.deleteObject(app);
  plus.ios.deleteObject(UIApplication);
  return result;
}
function judgeIosPermissionLocation() {
  var result = false;
  var cllocationManger = plus.ios.import("CLLocationManager");
  var status = cllocationManger.authorizationStatus();
  result = status != 2;
  plus.ios.deleteObject(cllocationManger);
  return result;
}
function judgeIosPermissionRecord() {
  var result = false;
  var avaudiosession = plus.ios.import("AVAudioSession");
  var avaudio = avaudiosession.sharedInstance();
  var permissionStatus = avaudio.recordPermission();
  formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:70", "permissionStatus:" + permissionStatus);
  if (permissionStatus == 1684369017 || permissionStatus == 1970168948) {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:72", "麦克风权限没有开启");
  } else {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:75", "麦克风权限已经开启");
  }
  plus.ios.deleteObject(avaudiosession);
  return result;
}
function judgeIosPermissionCamera() {
  var result = false;
  var AVCaptureDevice = plus.ios.import("AVCaptureDevice");
  var authStatus = AVCaptureDevice.authorizationStatusForMediaType("vide");
  formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:86", "authStatus:" + authStatus);
  if (authStatus == 3) {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:89", "相机权限已经开启");
  } else {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:91", "相机权限没有开启");
  }
  plus.ios.deleteObject(AVCaptureDevice);
  return result;
}
function judgeIosPermissionPhotoLibrary() {
  var result = false;
  var PHPhotoLibrary = plus.ios.import("PHPhotoLibrary");
  var authStatus = PHPhotoLibrary.authorizationStatus();
  formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:102", "authStatus:" + authStatus);
  if (authStatus == 3) {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:105", "相册权限已经开启");
  } else {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:107", "相册权限没有开启");
  }
  plus.ios.deleteObject(PHPhotoLibrary);
  return result;
}
function judgeIosPermissionContact() {
  var result = false;
  var CNContactStore = plus.ios.import("CNContactStore");
  var cnAuthStatus = CNContactStore.authorizationStatusForEntityType(0);
  if (cnAuthStatus == 3) {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:120", "通讯录权限已经开启");
  } else {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:122", "通讯录权限没有开启");
  }
  plus.ios.deleteObject(CNContactStore);
  return result;
}
function judgeIosPermissionCalendar() {
  var result = false;
  var EKEventStore = plus.ios.import("EKEventStore");
  var ekAuthStatus = EKEventStore.authorizationStatusForEntityType(0);
  if (ekAuthStatus == 3) {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:135", "日历权限已经开启");
  } else {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:137", "日历权限没有开启");
  }
  plus.ios.deleteObject(EKEventStore);
  return result;
}
function judgeIosPermissionMemo() {
  var result = false;
  var EKEventStore = plus.ios.import("EKEventStore");
  var ekAuthStatus = EKEventStore.authorizationStatusForEntityType(1);
  if (ekAuthStatus == 3) {
    result = true;
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:150", "备忘录权限已经开启");
  } else {
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:152", "备忘录权限没有开启");
  }
  plus.ios.deleteObject(EKEventStore);
  return result;
}
function requestAndroidPermission(permissionID) {
  return new Promise((resolve, reject) => {
    plus.android.requestPermissions(
      [permissionID],
      // 理论上支持多个权限同时查询，但实际上本函数封装只处理了一个权限的情况。有需要的可自行扩展封装
      function(resultObj) {
        var result = 0;
        for (var i = 0; i < resultObj.granted.length; i++) {
          var grantedPermission = resultObj.granted[i];
          formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:167", "已获取的权限：" + grantedPermission);
          result = 1;
        }
        for (var i = 0; i < resultObj.deniedPresent.length; i++) {
          var deniedPresentPermission = resultObj.deniedPresent[i];
          formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:172", "拒绝本次申请的权限：" + deniedPresentPermission);
          result = 0;
        }
        for (var i = 0; i < resultObj.deniedAlways.length; i++) {
          var deniedAlwaysPermission = resultObj.deniedAlways[i];
          formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:177", "永久拒绝申请的权限：" + deniedAlwaysPermission);
          result = -1;
        }
        resolve(result);
      },
      function(error2) {
        formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:187", "申请权限错误：" + error2.code + " = " + error2.message);
        resolve({
          code: error2.code,
          message: error2.message
        });
      }
    );
  });
}
function judgeIosPermission(permissionID) {
  if (permissionID == "location") {
    return judgeIosPermissionLocation();
  } else if (permissionID == "camera") {
    return judgeIosPermissionCamera();
  } else if (permissionID == "photoLibrary") {
    return judgeIosPermissionPhotoLibrary();
  } else if (permissionID == "record") {
    return judgeIosPermissionRecord();
  } else if (permissionID == "push") {
    return judgeIosPermissionPush();
  } else if (permissionID == "contact") {
    return judgeIosPermissionContact();
  } else if (permissionID == "calendar") {
    return judgeIosPermissionCalendar();
  } else if (permissionID == "memo") {
    return judgeIosPermissionMemo();
  }
  return false;
}
function gotoAppPermissionSetting() {
  if (isIos) {
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
function checkSystemEnableLocation() {
  if (isIos) {
    var result = false;
    var cllocationManger = plus.ios.import("CLLocationManager");
    var result = cllocationManger.locationServicesEnabled();
    plus.ios.deleteObject(cllocationManger);
    return result;
  } else {
    var context = plus.android.importClass("android.content.Context");
    var locationManager = plus.android.importClass("android.location.LocationManager");
    var main = plus.android.runtimeMainActivity();
    var mainSvr = main.getSystemService(context.LOCATION_SERVICE);
    var result = mainSvr.isProviderEnabled(locationManager.GPS_PROVIDER);
    formatAppLog("log", "at uni_modules/json-gps/js_sdk/wa-permission/permission.js:262", "系统定位开启:" + result);
    return result;
  }
}
const permision = {
  judgeIosPermission,
  requestAndroidPermission,
  checkSystemEnableLocation,
  gotoAppPermissionSetting
};
class Gps {
  constructor(arg) {
    this.lock = false;
  }
  async getLocation(param = {
    type: "wgs84"
  }) {
    return new Promise(async (callback2) => {
      if (this.lock) {
        callback2(false);
        return false;
      }
      this.lock = true;
      uni.getLocation({
        ...param,
        success: (res) => {
          this.lock = false;
          callback2(res);
        },
        fail: async (err) => {
          uni.showToast({
            title: "定位获取失败",
            icon: "none"
          });
          formatAppLog("error", "at uni_modules/json-gps/js_sdk/gps.js:30", err);
          callback2(false);
          await this.checkGpsIsOpen();
        }
      });
    });
  }
  async checkGpsIsOpen() {
    this.lock = true;
    if (!permision.checkSystemEnableLocation()) {
      plus.nativeUI.confirm("手机定位权限没有开启，是否去开启？", (e) => {
        this.lock = false;
        if (e.index == 0) {
          if (uni.getSystemInfoSync().platform == "ios") {
            plus.runtime.openURL("app-settings://");
          } else {
            var main = plus.android.runtimeMainActivity();
            var Intent = plus.android.importClass("android.content.Intent");
            var Settings = plus.android.importClass("android.provider.Settings");
            var intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            main.startActivity(intent);
          }
        } else {
          uni.showToast({
            title: "设备无定位权限",
            icon: "none"
          });
          callback(false);
        }
      }, {
        "buttons": ["去设置", "不开启"],
        "verticalAlign": "center"
      });
      return false;
    }
    let checkAppGpsRes = await this.checkAppGps();
    if (!checkAppGpsRes) {
      plus.nativeUI.confirm("应用定位权限没有开启，是否去开启？", (e) => {
        this.lock = false;
        if (e.index == 0) {
          permision.gotoAppPermissionSetting();
          callback(false);
        } else {
          uni.showToast({
            title: "应用无定位权限",
            icon: "none"
          });
          return false;
        }
      }, {
        "buttons": ["去设置", "不开启"],
        "verticalAlign": "center"
      });
    } else {
      this.lock = false;
    }
  }
  async checkAppGps() {
    if (uni.getSystemInfoSync().platform == "ios" && !permision.judgeIosPermission("location")) {
      return false;
    }
    if (uni.getSystemInfoSync().platform != "ios" && await permision.requestAndroidPermission(
      "android.permission.ACCESS_FINE_LOCATION"
    ) != 1) {
      return false;
    }
    return true;
  }
}
const _style_0 = { "pages": { "": { "backgroundColor": "#FFFFFF" } }, "img_url": { "": { "width": "200rpx", "height": "200rpx", "marginRight": "10rpx" } }, "main": { "": { "justifyContent": "space-between", "flex": 1 } }, "title": { "": { "fontSize": 16 } }, "info": { "": { "flexDirection": "row", "justifyContent": "space-between" } }, "author": { "": { "fontSize": 14, "color": "#999999" } }, "last_modify_date": { "": { "fontSize": 14, "color": "#999999" } }, "uni-search-box": { "": { "backgroundColor": "#FFFFFF", "position": "sticky", "height": 50, "top": 0, "left": 0 } }, "cover-search-bar": { "": { "height": 50, "position": "relative", "top": -50, "marginBottom": -50 } }, "swiper-box": { "": { "height": "400rpx" } }, "banner-image": { "": { "position": "relative", "width": "750rpx", "height": "400rpx" } } };
let cdbRef;
const gps = new Gps(), db = Ds.database();
const _sfc_main = {
  components: {
    statusBar
  },
  computed: {
    inputPlaceholder(e) {
      if (uni.getStorageSync("CURRENT_LANG") == "en") {
        return "Please enter the search content";
      } else {
        return "请输入搜索内容";
      }
    },
    colList() {
      return [
        db.collection("opendb-news-articles").where(this.where).field("img_url,title,last_modify_date,user_id").getTemp(),
        db.collection("uni-id-users").field("_id,nickname").getTemp()
      ];
    }
  },
  data() {
    return {
      where: '"article_status" == 1',
      keyword: "",
      showRefresh: false,
      listHight: 0
    };
  },
  watch: {
    keyword(keyword, oldValue) {
      let where = '"article_status" == 1 ';
      if (keyword) {
        this.where = where + `&& /${keyword}/.test(title)`;
      } else {
        this.where = where;
      }
    }
  },
  async onReady() {
    this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 + "px";
    cdbRef = this.$refs.udb;
  },
  async onShow() {
    this.keyword = getApp().globalData.searchText;
    getApp().globalData.searchText = "";
    await gps.getLocation({
      geocode: true
    });
  },
  methods: {
    searchClick(e) {
      uni.hideKeyboard();
      uni.navigateTo({
        url: "/pages/list/search/search",
        animationType: "fade-in"
      });
    },
    retry() {
      this.refresh();
    },
    refresh() {
      cdbRef.loadData({
        clear: true
      }, () => {
        uni.stopPullDownRefresh();
        this.showRefresh = false;
        formatAppLog("log", "at pages/list/list.nvue:171", "end");
      });
      formatAppLog("log", "at pages/list/list.nvue:173", "refresh");
    },
    loadMore() {
      cdbRef.loadMore();
    },
    onqueryerror(e) {
      formatAppLog("error", "at pages/list/list.nvue:179", e);
    },
    onpullingdown(e) {
      formatAppLog("log", "at pages/list/list.nvue:182", e);
      this.showRefresh = true;
      if (e.pullingDistance > 100) {
        this.refresh();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_statusBar = resolveComponent("statusBar");
  const _component_uni_search_bar = resolveEasycom(resolveDynamicComponent("uni-search-bar"), __easycom_1);
  const _component_swiper_item = resolveComponent("swiper-item");
  const _component_swiper = resolveComponent("swiper");
  const _component_unicloud_db = resolveEasycom(resolveDynamicComponent("unicloud-db"), __easycom_2$1);
  const _component_refreshBox = resolveComponent("refreshBox");
  const _component_uni_dateformat = resolveEasycom(resolveDynamicComponent("uni-dateformat"), __easycom_2);
  const _component_uni_list_item = resolveEasycom(resolveDynamicComponent("uni-list-item"), __easycom_3);
  const _component_uni_load_state = resolveEasycom(resolveDynamicComponent("uni-load-state"), __easycom_4);
  const _component_uni_list = resolveEasycom(resolveDynamicComponent("uni-list"), __easycom_4$1);
  return openBlock(), createElementBlock("scroll-view", {
    scrollY: true,
    showScrollbar: true,
    enableBackToTop: true,
    bubble: "true",
    style: { flexDirection: "column" }
  }, [
    createElementVNode("view", { class: "pages" }, [
      createVNode(_component_statusBar),
      createCommentVNode(" 搜索功能 "),
      createElementVNode("view", { class: "uni-search-box" }, [
        createVNode(_component_uni_search_bar, {
          modelValue: $data.keyword,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.keyword = $event),
          ref: "searchBar",
          radius: "100",
          cancelButton: "none",
          disabled: "",
          placeholder: $options.inputPlaceholder
        }, null, 8, ["modelValue", "placeholder"]),
        createElementVNode("view", {
          class: "cover-search-bar",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.searchClick && $options.searchClick(...args))
        })
      ]),
      createCommentVNode(" banner "),
      createVNode(_component_unicloud_db, {
        ref: "bannerdb",
        collection: "opendb-banner",
        field: "_id,bannerfile,open_url,title",
        onLoad: _ctx.onqueryload
      }, {
        default: withCtx(({ data, loading, error: error2, options }) => [
          createCommentVNode(" 当无banner数据时显示占位图 "),
          !(loading || data.length) ? (openBlock(), createElementBlock("u-image", {
            key: 0,
            class: "banner-image",
            src: "/static/uni-center/headers.png",
            mode: "aspectFill",
            draggable: false
          })) : (openBlock(), createBlock(_component_swiper, {
            key: 1,
            class: "swiper-box",
            onChange: _ctx.changeSwiper,
            current: _ctx.current,
            "indicator-dots": ""
          }, {
            default: withCtx(() => [
              (openBlock(true), createElementBlock(
                Fragment,
                null,
                renderList(data, (item, index) => {
                  return openBlock(), createBlock(
                    _component_swiper_item,
                    {
                      key: item._id
                    },
                    {
                      default: withCtx(() => [
                        createElementVNode("view", {
                          class: "swiper-item",
                          onClick: ($event) => _ctx.clickBannerItem(item)
                        }, [
                          createElementVNode("u-image", {
                            class: "banner-image",
                            src: item.bannerfile.url,
                            mode: "aspectFill",
                            draggable: false
                          }, null, 8, ["src"])
                        ], 8, ["onClick"])
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
            ]),
            _: 2
            /* DYNAMIC */
          }, 1032, ["onChange", "current"]))
        ]),
        _: 1
        /* STABLE */
      }, 8, ["onLoad"]),
      createVNode(_component_unicloud_db, {
        ref: "udb",
        onError: $options.onqueryerror,
        collection: $options.colList,
        "page-size": 50
      }, {
        default: withCtx(({ data, pagination, hasMore, loading, error: error2, options }) => [
          createCommentVNode(' 基于 uni-list 的页面布局 field="user_id.nickname"'),
          createVNode(
            _component_uni_list,
            {
              class: "uni-list",
              border: false
            },
            {
              default: withCtx(() => [
                createCommentVNode(" 作用于app端nvue页面的下拉加载 "),
                createVNode(_component_refreshBox, {
                  onRefresh: $options.refresh,
                  loading
                }, null, 8, ["onRefresh", "loading"]),
                createCommentVNode(" 列表渲染 "),
                (openBlock(true), createElementBlock(
                  Fragment,
                  null,
                  renderList(data, (item, index) => {
                    return openBlock(), createBlock(_component_uni_list_item, {
                      to: "/pages/list/detail?id=" + item._id + "&title=" + item.title,
                      key: index
                    }, {
                      header: withCtx(() => [
                        createElementVNode("u-image", {
                          class: "img_url",
                          src: item.img_url,
                          mode: "aspectFill"
                        }, null, 8, ["src"])
                      ]),
                      body: withCtx(() => [
                        createElementVNode("view", { class: "main" }, [
                          createElementVNode(
                            "u-text",
                            { class: "title" },
                            toDisplayString(item.title),
                            1
                            /* TEXT */
                          ),
                          createElementVNode("view", { class: "info" }, [
                            createElementVNode(
                              "u-text",
                              { class: "author" },
                              toDisplayString(item.user_id[0] ? item.user_id[0].nickname : ""),
                              1
                              /* TEXT */
                            ),
                            createVNode(_component_uni_dateformat, {
                              class: "last_modify_date",
                              date: item.last_modify_date,
                              format: "yyyy-MM-dd",
                              threshold: [6e4, 2592e6]
                            }, null, 8, ["date"])
                          ])
                        ])
                      ]),
                      _: 2
                      /* DYNAMIC */
                    }, 1032, ["to"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                createCommentVNode(" 加载状态：上拉加载更多，加载中，没有更多数据了，加载错误 "),
                createVNode(
                  _component_uni_list_item,
                  null,
                  {
                    body: withCtx(() => [
                      createVNode(_component_uni_load_state, {
                        onNetworkResume: $options.refresh,
                        state: { data, pagination, hasMore, loading, error: error2 },
                        onLoadMore: $options.loadMore
                      }, null, 8, ["onNetworkResume", "state", "onLoadMore"])
                    ]),
                    _: 2
                    /* DYNAMIC */
                  },
                  1024
                  /* DYNAMIC_SLOTS */
                )
              ]),
              _: 2
              /* DYNAMIC */
            },
            1024
            /* DYNAMIC_SLOTS */
          )
        ]),
        _: 1
        /* STABLE */
      }, 8, ["onError", "collection"])
    ])
  ]);
}
const list = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "G:/HBuilderProjects/Toby/pages/list/list.nvue"]]);
export {
  list as default
};
