//获取富文本内的图片url地址
export function getImgSrc(richtext, num = 3) {
  let imgList = [];
  richtext.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/g, (match, capture) => {
    imgList.push(capture);
  });
  imgList = imgList.slice(0, num)
  return imgList;
}

//向外导出省份
export function getProvince() {
  return new Promise((resolve, reject) => {
    let historyProvince = uni.getStorageSync("historyProvince");
    //判读是否在本地缓存中有地址
    if (historyProvince) {
      //判断超过1天时间 ，重新发起网络请求
      if ((Date.now() - historyProvince.time) > 1000 * 10) {
        getIp().then(res => {
          console.log("重新网络请求")
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      } else {
        console.log("直接从本地缓存中读取")
        resolve(historyProvince.province);
      }
    } else { //缓存中没存地址 调用发送网络请求的方法（返回的一个promise对象）
      getIp().then(res => {
        console.log("第一次网络请求")
        console.log(res)
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    }
  })
}

//获取高德地图ip的api接口，通过ip获取所在地址省市
function getIp() {
  return new Promise((resolve, reject) => {
    uni.request({
      url: "https://restapi.amap.com/v3/ip?key=2eae11112968b53f162a109960d4efd1",
      success: res => {
        console.log("向高德地图发送网络请求，通过ip获取所在地址省市")
        console.log(res)
        let str = ""
        //处理ip不是国内ip时，返回的地址为自定义的火星地址
        typeof(res.data.province) == "string" ? str = res.data.province: str = "火星"
        resolve(str)
        let obj = {
          province: str,
          time: Date.now()
        }
        uni.setStorageSync("historyProvince", obj);
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

//获取昵称
export function giveName(item) {
  return item.user_id[0].nickname || item.user_id[0].username || item.user_id[0].mobile || "请设置昵称"
}

//获取默认头像
export function giveAvatar(item) {
  return item.user_id[0]?.avatar_file?.url ?? '../../static/images/user-default.png'
}


const db = uniCloud.database();
const utilsObj = uniCloud.importObject("utilsObj", {
  customUI: true
});

//点赞操作数据库的方法
export async function likeFun(artid) {
  let count = await db.collection("quanzi_like")
    .where(`article_id=="${artid}" && user_id==$cloudEnv_uid`).count()
  if (count.result.total) {
    db.collection("quanzi_like").where(`article_id=="${artid}" && user_id==$cloudEnv_uid`)
      .remove();
    utilsObj.operation("quanzi_article", "like_count", artid, -1)

  } else {
    db.collection("quanzi_like").add({
      article_id: artid
    })
    utilsObj.operation("quanzi_article", "like_count", artid, 1)
  }
}


export async function getComment(artid){
  let commentTemp = db.collection("quanzi_comment")
    .where(`article_id == "${artid}"`).orderBy("comment_date desc")
    .limit(20).getTemp();
  let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()
  let res = await db.collection(commentTemp, userTemp).get()
  return res.result.data
}