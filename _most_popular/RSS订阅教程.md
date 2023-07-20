---
title: RSS订阅教程
excerpt: "因为目前网站并不支持国内用户的关注和订阅，许多用户抱怨很不方便。这里就为大家介绍一下使用Calibre通过RSS订阅并制作成电子书阅读的方法。"
header:
  teaser: /assets/img/page-header-image-rss-teaser.jpg
  overlay_image: /assets/img/page-header-image-rss.jpg # Add image post (optional)
  overlay_filter: 0.4
categories:
  - 教程
tags: 
  - RSS
  - FEED
  - Calibre
  - 订阅源
  - Inoreader
  - 阅读
comments: true
toc: true
share: true
last_modified_at: 2022-08-17T19:25:52-05:00
---

目前网站并没有在平台发布，所以很多使用手机的小伙伴阅读每次都需要网站，这里就为大家介绍一下两种订阅RSS的方法

## 第一种 使用Inoreader订阅

Inoreader是非常方便的RSS阅读工具，直接点击左上角==设置==，点击==Feeds==右侧的“+”号。

打开后，在搜索栏输入：https://facereader.witbacon.com

就可以直接添加了。

## 第二种 使用Calibre（支持国内用户）

通过RSS订阅并制作成电子书阅读的方法。

### 一、获取工具和资源

#### 1、下载并安装Calibre电子书管理软件

Calibre是目前最受欢迎的电子书管理软件，其完善的功能和易用性使其广受欢迎，网上相关的使用教程也有很多，想使用更多功能，可以搜索查询，这里就不再赘述。

打开Calibre官网的下载页面：https://calibre-ebook.com/download

![Calibre-download](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-download.png)

目前Calibre支持Windows、MacOS、Linux等主流平台，不过目前并没有Android和iOS客户端，但有很多工具支持Calibre的电子书，并且也可以通过服务器自己架设平台，支持Android和iOS端。

安装软件，各平台正常安装即可。

#### 2、获取RSS源

打开FaceReader博客首页：https://facereader.witbacon.com/

![FaceReader-RSS](https://kewtgh.github.io/PicSunflowers/img/2022/FaceReader-RSS.png)

滑动页面到页脚，可以看到**FEED**图标，点击打开。

最上方的地址栏中可看到源网址：https://facereader.witbacon.com/feed.xml

![Feed-link](https://kewtgh.github.io/PicSunflowers/img/2022/Feed-link.png)

### 二、使用Calibre电子书管理软件

#### 1、打开Calibre电子书管理软件

![Calibre-open](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-open.png)

点击**抓取新闻**右侧的**下拉箭头**，选择下拉列表中的**添加自定义新闻来源**。

#### 2、添加自定义新闻来源

![Calibre-add-custom](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-add-custom.png)

打开**添加自定义新闻来源**后，点击**新建订阅清单**。

![Calibre-custom-source](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-custom-source.png)

打开后，可以编辑**订阅清单标题**、**最老文章**的天数，以及**每个源最多的文章数**。

最老文章天数，因为并非新闻，我设置的天数是**365天**。

然后，添加**源名称**：*Facereader-企业观察*和**源网址**：https://facereader.witbacon.com/feed.xml

之后点击**添加源**，可看到如下页面：

![Calibre-added](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-added.png)

然后，点击**下载这个订阅清单**，然后点击**保存**。

![Calibre-close](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-close.png)

#### 3、设置计划任务

拖动到Calibre电子书页面的第一行，即可看到新添加的新闻源，**双击**即可打开。

![Calibre-opened](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-opened.png)

设置**定期新闻下载**，同样点击**抓取新闻**右侧的下拉小三角。

打开**定期新闻下载**的设置页面，点击**自定义**下的**我的新闻源**，即可看到设置页面。

![Calibre-plan](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-plan.png)

勾选**计划下载**，选择计划下载的时间，也可以设置删除多久前的新闻，最后点击**确定**。

### 三、推送与阅读

Calibre可以直接设置邮件推送到kindle阅读器或者Kindle Reader App上。

![Calibre-open-share](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-open-share.png)

点击**连接/共享**的下拉列表，选择**设置基于电子邮件的书籍共享**，打开邮件设置页面。

![Calibre-set-email](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-set-email.png)

点击**添加邮件地址**，并且输入**发信人地址**【注：发信人地址是Amazon电子书中设置的，并非任何发信人都可以。】

![Calibre-finish-email](https://kewtgh.github.io/PicSunflowers/img/2022/Calibre-finish-email.png)

在**新邮件地址**填入收件地址，在格式方面，删除Mobi，保留**EPUB**。

邮件服务器，可以设置，也可以不设置。

如需设置，可以搜索相应的服务器发件地址，以下列出部分服务器设置。用户名和密码请填入自己的设置。

|         服务商         |        主机名         | 加密类型 |   端口   |
| :--------------------: | :-------------------: | :------: | :------: |
|         Google         |    smtp.gmail.com     |   TLS    |   587    |
| Hotmail，Outlook，Live | smtp-mail.outlook.com |   TLS    |   587    |
|         yahoo          |  smtp.mail.yahoo.com  |   SSL    | 465或587 |
|          163           |     smtp.163.com      |   SSL    | 465或587 |
|          126           |     smtp.126.com      |   SSL    | 465或587 |
|        新浪邮箱        |     smtp.sina.com     |   SSL    | 465或587 |
|         QQ邮箱         |      smtp.qq.com      |   SSL    | 465或587 |

设置完成后点击**应用**，稍后就可以在Kindle或阅读APP中看到电子书了。



下面是一些RSS相关的其他工具推荐，有兴趣的小伙伴可以自己研究。

## 三、其他工具推荐：

### 1、浏览器插件：Chrome，Firefox，Edge

- RSS Feed Reader

### 2、windows桌面：

- irreade

- FeedDemon

- RSS追踪

### 3、Android：

- Feedly

- Digg Reader

- InoReader

- FeedMe

- Newsfold

- News Blur

- Palabre Feedly RSS Reader News

### 4、iOS：

- Reeder 4

- RSSOwl

- News Blur

- lire: RSS Reader

- feedbin

- Fiery Feeds

- InoReader

- Feedly

### 5、macOS：

- ReadKit

- Reeder 4

- Fiery Feeds

- lire: RSS Reader

- leaf

---

全文完。
