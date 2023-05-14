<template>
	<!--
	 本页面模板教程：https://ext.dcloud.net.cn/plugin?id=2717
	 uni-list 文档：https://ext.dcloud.net.cn/plugin?id=24
	 uniCloud 文档：https://uniapp.dcloud.io/uniCloud/README
	 unicloud-db 组件文档：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db-component
	 DB Schema 规范：https://uniapp.dcloud.net.cn/uniCloud/schema
	 -->
	<view class="article">
		<!-- #ifdef APP-PLUS -->
		<uni-nav-bar :statusBar="true" :border="false"></uni-nav-bar>
		<!-- #endif -->
		<view class="article-title">{{ title }}</view>
		<unicloud-db v-slot:default="{data, loading, error, options}" :options="formData" collection="opendb-news-articles,uni-id-users"
			:field="field" :getone="true" :where="where" :manual="true" ref="detail"
			foreignKey="opendb-news-articles.user_id" @load="loadData">
			<template v-if="!loading && data">
				<uni-list :border="false">
					<uni-list-item thumbSize="lg" :thumb="data.image">
						<!-- 通过body插槽定义作者信息内容 -->
						<template v-slot:body>
							<view class="header-content">
								<view class="uni-title">{{data.user_id && data.user_id[0] && data.user_id[0].nickname || data.country}}</view>
							</view>
						</template>
						<template v-slot:footer>
							<view class="footer">
								<view class="uni-note">
									<uni-dateformat :date="data.last_modify_date" format="yyyy-MM-dd hh:mm"
										:threshold="[60000, 2592000000]" />
								</view>
							</view>
						</template>
					</uni-list-item>
				</uni-list>

					<!-- 文章开头，缩略图 -->
					<image class="banner-img" :src="data.img_url" mode="widthFix"></image>
					<!-- 文章摘要 -->

				<view class="article-content">
          <div class="Bbox">
          <view class="des">Descripton:</view>
					<rich-text :nodes="data.description"></rich-text>
          </div>
          <div class="Bbox">
          <view class="des">Department:</view>
          <rich-text :nodes="data.department"></rich-text>
          </div>
          <div class="Bbox">
          <view class="des">Medium:</view>
          <rich-text :nodes="data.medium"></rich-text>
          </div>
          <div class="Bbox">
          <view class="des">Dated:</view>
          <rich-text :nodes="data.dated"></rich-text>
          </div>
          <div class="Bbox">
          <view class="des">Web:</view>
          <rich-text :nodes="data.web_url"></rich-text>
          </div>
          <div class="Bbox">
          <view class="des">Comments:</view>
          <rich-text :nodes="data.comments"></rich-text>
          </div>
        </view>
			</template>
		</unicloud-db>
	</view>
  
        <!--点赞-->
      <view class="zan" >
        <view class="zan_box" @click="clicklike">
          <image v-if="hadzan=='false'" class="zan_img" src="@/static/images/zan.png"></image>
          <image v-else class="zan_img" src="@/static/images/zaned.png"></image>
        </view>
      </view>
        <!-- 评论内容子组件 -->
      <unicloud-db v-slot:default="{data, loading, error, options}" :collection="colList">
       <view class="content" >
              <view class="item" v-for="item in data">
              <comment-item :item="item"></comment-item>
              </view>
            </view>
        </unicloud-db>
        <!-- 评论回复子组件 -->
      <view>
        <view class="commentFrame">
          <uni-easyinput ref="uipt" @confirm="goComment" suffixIcon="paperplane" v-model="replyContent"
            :placeholder="placeholder" @iconClick="goComment">
          </uni-easyinput>
        </view>
      </view>
      
</template>

<script>
  import {
      giveName,
      giveAvatar
      //getComment,
      //getComment,
    } from "../../utils/tools.js";
	// #ifdef APP
	import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
	import uniNavBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue';
	const uniShare = new UniShare()
	// #endif
	const db = uniCloud.database();
	const readNewsLog = db.collection('read-news-log')
  const utilsObj = uniCloud.importObject("utilsObj", {
      customUI: true
    });
	export default {
		// #ifdef APP
		components:{
			"uni-nav-bar":uniNavBar,
		},
    computed:{
      
    },
		onBackPress({from}) {
			if(from == 'backbutton'){
				if(uniShare.isShow){
					this.$nextTick(function(){
						console.log(uniShare);
						uniShare.hide()
					})
				}
				return uniShare.isShow;
			}
		},
		// #endif
		data() {
			return {
				// 当前显示 _id
				id: "",
				title: 'title',
				// 数据表名
				// 查询字段，多个字段用 , 分割
				field: 'user_id.nickname,user_id._id,img_url,excerpt,last_modify_date,comment_count,like_count,title,description,department,dated,web_url,medium,comments,country',
				formData: {
					noData: '<p style="text-align:center;color:#666">详情加载中...</p>'
				},
        placeholder:'请评论点什么吧...',
        commentList:[],
        zan_url:'@/static/images/zan.png',
        colList:[
        		db.collection('quanzi_comment').getTemp(),
        		db.collection('uni-id-users').field('_id,nickname,avatar_file').getTemp()
        	],
        hadzan:"false",
			}
		},
		computed: {
			uniStarterConfig() {
				return getApp().globalData.config
			},
			where(){
				//拼接where条件 查询条件 ,更多详见 ：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db?id=jsquery
				return `_id =="${this.id}"`
			}
		},
		onLoad(event) {
			//获取真实新闻id，通常 id 来自上一个页面
			if (event.id) {
				this.id = event.id
        //this.commentObj.article_id = this.id
			}
			//若上一页传递了标题过来，则设置导航栏标题
			if (event.title) {
				this.title = event.title
				uni.setNavigationBarTitle({
					title: event.title
				})
			}
      //this.getComment()
		},
		onReady() {
			// 开始加载数据，修改 where 条件后才开始去加载 clinetDB 的数据 ，需要等组件渲染完毕后才开始执行 loadData，所以不能再 onLoad 中执行
			if (this.id) { // ID 不为空，则发起查询
				this.$refs.detail.loadData()
			} else {
				uni.showToast({
					icon: 'none',
					title: this.$t('listDetail.newsErr')
				})
			}
      this.getComment()
		},
		onNavigationBarButtonTap(event) {
			if (event.type == 'share') {
				this.shareClick();
			}
		},
		methods: {
			$log(...args){
				console.log('args',...args,this.id)
			},
			setReadNewsLog(){
				let item = {
					"article_id":this.id,
					"last_time":Date.now()
				},
				readNewsLog = uni.getStorageSync('readNewsLog')||[],
				index = -1;
				readNewsLog.forEach(({article_id},i)=>{
					if(article_id == item.article_id){
						index = i
					}
				})
				if(index === -1){
					readNewsLog.push(item)
				}else{
					readNewsLog.splice(index,1,item)
				}
				uni.setStorageSync('readNewsLog',readNewsLog)
				console.log(readNewsLog);
			},
			setFavorite() {
				if ( uniCloud.getCurrentUserInfo().tokenExpired < Date.now() ){
					return console.log('未登录用户');
				}
				//let article_id = this.id,
					last_time = Date.now();
					console.log({article_id,last_time});
					readNewsLog.where(`"article_id" == "${this.article_id}" && "user_id"==$env.uid`)
						.update({last_time})
						.then(({result:{updated}}) => {
							console.log('updated',updated);
							if (!updated) {
								readNewsLog.add({article_id}).then(e=>{
									console.log(e);
								}).catch(err => {
									console.log(err);
								})
							}
						}).catch(err => {
							console.log(err);
						})
			},
			loadData(data) {
				//如果上一页未传递标题过来（如搜索直达详情），则从新闻详情中读取标题
				if (this.title == '' && data[0].title) {
					this.title = data[0].title
					uni.setNavigationBarTitle({
						title: data[0].title
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
					title:this.$t('listDetail.follow'),
					icon: 'none'
				});
			},
      clicklike(){
        if(this.hadzan=='true'){
          this.hadzan='false';
          uni.showToast({
            title:"取消点赞"
          })
          
        }
        else{
          this.hadzan='true';
          uni.showToast({
            title:"点赞成功"
          })
        }
        
      }, 
      //评论
      goComment() {
        //let province = await getProvince();
        if (!this.replyContent) {
          uni.showToast({
            title: "评论不能为空",
            icon: "none"
          })
          return;
        }
        db.collection("quanzi_comment").add({
          "article_id":this.id,
          "comment_type":0,
          "comment_content": this.replyContent,
          //"province": province,
          //...this.commentObj
        }).then(res => {
      
          uni.showToast({
            title: "评论成功"
          })
          console.log(res);
        })
     },
      
			/**
			 * 分享该文章
			 */
      //获得评论
      async getComment() {
              //let article_id=this.id
              console.log(article_id)
              let commentTemp = db.collection("quanzi_comment")
                .where(`article_id == "${this.id}"`).orderBy("comment_date desc")
                .limit(20).getTemp();
              let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()
              let res = await db.collection(commentTemp, userTemp).get()
              //console.log(res.result.data)
              this.commentList = res.result.data
            },
            
			// #ifdef APP
			shareClick() {
				let {
					_id,
					title,
					excerpt,
					img_url
				} = this.$refs.detail.dataList
				console.log( JSON.stringify({
					_id,
					title,
					excerpt,
					img_url
				}) );
				uniShare.show({
					content: { //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
						type: 0,
						href: this.uniStarterConfig.h5.url + `/#/pages/list/detail?id=${_id}&title=${title}`,
						title: this.title,
						summary: excerpt,
						imageUrl: img_url + '?x-oss-process=image/resize,m_fill,h_100,w_100' //压缩图片解决，在ios端分享图过大导致的图片失效问题
					},
					menus: [{
							"img": "/static/app-plus/sharemenu/wechatfriend.png",
							"text": this.$t('common.wechatFriends'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneSession"
							}
						},
						{
							"img": "/static/app-plus/sharemenu/wechatmoments.png",
							"text": this.$t('common.wechatBbs'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneTimeline"
							}
						},
						{
							"img": "/static/app-plus/sharemenu/mp_weixin.png",
							"text": this.$t('common.wechatApplet'),
							"share": {
								provider: "weixin",
								scene: "WXSceneSession",
								type: 5,
								miniProgram: {
									id: this.uniStarterConfig.mp.weixin.id,
									path: `/pages/list/detail?id=${_id}&title=${title}`,
									webUrl: this.uniStarterConfig.h5.url +
										`/#/pages/list/detail?id=${_id}&title=${title}`,
									type: 0
								},
							}
						},
						{
							"img": "/static/app-plus/sharemenu/weibo.png",
							"text": this.$t('common.weibo'),
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
							"text": this.$t('common.copy'),
							"share": "copyurl"
						},
						{
							"img": "/static/app-plus/sharemenu/more.png",
							"text": this.$t('common.more'),
							"share": "shareSystem"
						}
					],
					cancelText: this.$t('common.cancelShare'),
				}, e => { //callback
					console.log(e);
				})
			}
			// #endif
    }
	}
</script>

<style scoped>
	.header-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		font-size: 14px;
	}

	/* 标题 */
	.uni-title {
		display: flex;
		margin-bottom: 5px;
		font-size: 14px;
		font-weight: bold;
		color: #3b4144;
	}

	/* 描述 额外文本 */
	.uni-note {
		color: #999;
		font-size: 12px;

		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		align-items: center;
	}

	.footer {
		display: flex;
		align-items: center;
	}

	.footer-button {
		display: flex;
		align-items: center;
		font-size: 12px;
		height: 30px;
		color: #fff;
		background-color: #ff5a5f;
	}

	.banner {
		position: relative;
		margin: 0 15px;
		height: 200px;
		overflow: hidden;
	}

	.banner-img {
		position: relative;
		width: 100%;
    height: 100%;
	}

	.banner-title {
		display: flex;
		align-items: center;
		position: absolute;
		padding: 0 15px;
		width: 100%;
		bottom: 0;
		height: 30px;
		font-size: 14px;
		color: #fff;
		background: rgba(0, 0, 0, 0.4);
		overflow: hidden;
		box-sizing: border-box;
	}

	.uni-ellipsis {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.article-title {
		padding: 20px 15px;
		padding-bottom: 0;
	}

	.article-content {
    padding: 15px;
		font-size: 15px;
		overflow: hidden;
	}
  
  .comment {
    padding: 30rpx;
    padding-bottom: 120rpx;
  
    .item {
      padding: 10rpx 0;
    }
  }
  .commentFrame {
    width: 100%;
    background: #fff;
    padding: 20rpx 30rpx;
    box-sizing: border-box;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 100;
  }
  .content {
      padding: 30rpx;
      padding-bottom: 120rpx;

      .item {
        padding: 10rpx 0;
      }
    }
  .zan{
    display: flex;
  }  
  .zan_box{
    padding: 10rpx;
    height: rpx;
    width:100rpx;
    border-radius: 50rpx;
    margin-left:43%;
  }
  .zan_img{
    width: 100rpx;
    height: 100rpx;
  }
  .des{
    font-weight: bold;
    font-size: large;
  }
  .Bbox{
    border-bottom: 9rpx solid #ccc;
    border-right:  10rpx solid #ccc;
    border-top: 5rpx solid #ccc;
    border-left: 5rpx solid#ccc;
    margin-bottom: 20rpx;
    padding-bottom: 10rpx;
  }
</style>
