<template>
  <view>
    <view class="commentFrame">
      <uni-easyinput ref="uipt" @confirm="goComment" suffixIcon="paperplane" v-model="replyContent"
        :placeholder="placeholder" @iconClick="goComment">
      </uni-easyinput>
    </view>
  </view>
</template>

<script>
  //import {
   // getProvince
  //} from "@/utils/tools.js"
  const db = uniCloud.database();
  export default {
    name: "comment-frame",
    props: {
      commentObj: {
        type: Object,
        default: () => {
          return {

          }
        }
      },
      placeholder: {
        type: String,
        default: "评论点什么吧~"
      }
    },
    data() {
      return {
        replyContent: '',
      };
    },
    methods: {
      async goComment() {
        //let province = await getProvince();
        if (!this.replyContent) {
          uni.showToast({
            title: "评论不能为空",
            icon: "none"
          })
          return;
        }
        db.collection("quanzi_comment").add({
          "article_id":'6453e3313c4fd8e24007e9cd',
          "comment_type":0,
          "comment_content": this.replyContent,
          //"province": province,
          ...this.commentObj
        }).then(res => {

          uni.showToast({
            title: "评论成功"
          })
          console.log(res);
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
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
</style>
