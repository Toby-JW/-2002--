<template>
  <view>
      <view class="comment-item">
        <view class="avatar">
          <uni-id-pages-avatar src="@/static/images/user.png" size="26"></uni-id-pages-avatar>
        </view>
    
        <view class="wrap">
          <view class="username">{{item.user_id[0].nickname}}</view>
          <view class="comment-content">{{item.comment_content}}</view>
          <view class="info">
            <view>
              <uni-dateformat :date="item.comment_date" :threshold="[60000,3600000*24*30]">
              </uni-dateformat>
            </view>
          </view>
        </view>
      </view>
    </view>
</template>

<script>
  import {
      giveName,
      giveAvatar,
    } from "../../utils/tools.js"
  export default {
    name: "comment-item",
    props: {
          item: {
            type: Object,
            default () {
              return {}
            }
          }
        },
    data() {
      return {

      };
    }
  }
</script>

<style lang="scss" scoped>
  .comment-item {
    display: flex;

    .wrap {
      flex: 1;
      padding-left: 20rpx;
      padding-bottom: 20rpx;

      .username {
        font-size: 26rpx;
        color: #666;
        padding: 10rpx 0;
      }

      .comment-content {
        font-size: 34rpx;
        color: #111;
        line-height: 1.8em;
      }

      .info {
        font-size: 26rpx;
        color: #666;
        display: flex;
        padding: 10rpx 0;
        align-items: center;

        view {
          margin-right: 25rpx;
        }

        .reply-btn {
          padding: 6rpx 18rpx;
          background: #e4e4e4;
          border-radius: 30rpx;
        }
      }
    }
  }
  .image_avatar{
    
  }
</style>
