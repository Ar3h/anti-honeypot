'use strict'
const manifest = chrome.runtime.getManifest();
const {
    version
} = manifest;

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        //根据url返回域名和对应的path
        function GetHostAndPath(url) {
            var arrUrl = url.split("//"); //  http://www.baidu.com/aaaa.php?aaa
            var start = arrUrl[1].indexOf("/");
            var host = arrUrl[1].substring(0, start);
            var path = arrUrl[1].substring(start); //stop省略，截取从start开始到结尾的所有字符

            var result = new Array(host, path);
            return result
        }

        //获取主域名
        function GetMainDomain(host) {
            var arrHost = host.split("."); //  a.b.c.baidu.com
            var mainDomain = arrHost[arrHost.length - 2] + '.' + arrHost[arrHost.length - 1];
            return mainDomain;
        }

        //判断host是否在黑名单内
        function inBlackList(host) {
            // 长亭D-sensor、墨安幻阵提供的溯源api，共83个host
            const BlackList = ["account.itpub.net", "accounts.ctrip.com", "ajax.58pic.com", "api.csdn.net", "api.ip.sb", "api.m.jd.com", "api.passport.pptv.com", "api.weibo.com", "assets.growingio.com", "baike.baidu.com", "bbs.zhibo8.cc", "bit.ly", "blog.csdn.net", "blog.itpub.net", "c.cnzz.com", "c.v.qq.com", "chinaunix.net", "clients4.google.com", "cmstool.youku.com", "comment.api.163.com", "databack.dangdang.com", "datax.baidu.com", "dimg01.c-ctrip.com", "down2.uc.cn", "flux.faloo.com", "g.alicdn.com", "github.comgithub.com", "hd.huya.com", "hm.baidu.com", "home.51cto.com", "home.ctfile.com", "home.zhibo8.cc", "hudong.vip.youku.com", "hzs14.cnzz.com", "i.jrj.com.cn", "i.qr.weibo.cn", "iask.sina.com.cn", "itunes.apple.com", "js.cndns.com", "ka.sina.com.cn", "log.mmstat.com", "login.sina.com.cn", "m.ctrip.com", "m.game.weibo.cn", "map.baidu.com", "mapp.jrj.com.cn", "morn.cndns.com", "mozilla.github.io", "msg.qy.net", "mths.be", "musicapi.taihe.com", "my.zol.com.cn", "p.qiao.baidu.com", "passport.ctrip.com", "passport.game.renren.com", "passport.iqiyi.com", "pcw-api.iqiyi.com", "playbill.api.mgtv.com", "renren.com", "s.faloo.com", "s14.cnzz.com", "sb.scorecardresearch.com", "search.video.iqiyi.com", "skylink.io", "static.iqiyi.com", "stc.iqiyipic.com", "tie.163.com", "u.faloo.com", "ucenter.51cto.com", "v.huya.com", "v2.sohu.com", "validity.thatscaptaintoyou.com", "vote2.pptv.com", "wap.sogou.com", "webapi.ctfile.com", "weibo.com", "www.58pic.com", "www.cndns.com", "www.gnu.org", "www.iqiyi.com", "www.iteye.com", "www.zbj.com", "wz.cnblogs.com"];
            for (const BlackSite of BlackList) {
                if (host == BlackSite) {
                    return true
                }
            }
            return false
        }

        //判断host是否在白名单内
        function inWhiteList(host) {
            const WhiteList = ['baidu.com', 'qq.com', 'csdn.net', 'weibo.com', 'cnblogs.com', 'aliyun.com', 'ctrip.com', 'weibo.cn', 'iqiyi.com', '163.com', '126.com', '51cto.com', 'taobao.com', 'sogou.com', 'iteye.com', '58.com'] //白名单
            for (const WhiteSite of WhiteList) {
                if (host == WhiteSite) {
                    return true;
                }
            }
            return false
        }

        //url:当前的url；initiator：浏览器状态栏里的domain
        let {
            url,
            initiator
        } = details;

        //如果发起者为空，直接赋值url
        if (typeof (initiator) == "undefined") {
            initiator = url;
        }

        const protocal = url.split("://")[0];
        const mainDomain = GetMainDomain(initiator); //浏览器状态栏的主域名，baidu.com
        const targetHost = GetHostAndPath(url)[0]; //跨域或本域访问的目标主机
        const targetPath = GetHostAndPath(url)[1]; //跨域或本域访问的目标路径
        const targetDomain = GetMainDomain(targetHost) //目标主域名 xxx.com

        let redirectUrl;
        let cancel;

        //目标域名在主域名下，或者在白名单，不拦截
        if (targetDomain.includes(mainDomain) || inWhiteList(mainDomain)) {
            console.log(targetDomain);
            return;
        }

        //如果不相等，可能是跨域访问，需要继续判断
        const blockQueryStringList = ['callback', 'jsonp', 'javascript'];
        for (const q of blockQueryStringList) {
            if (protocal == 'http' || protocal == 'https') {
                if (q && targetPath.includes(q)) {
                    redirectUrl = 'data:text/javascript;charset=UTF-8;base64,' + btoa(`;`);
                    if (inBlackList(targetHost)) {
                        // 黑名单拦截
                        new Notification('拦截黑名单溯源请求：' + targetHost);
                    } else {
                        // 拦截其他跨域请求
                        new Notification('拦截可疑溯源请求：' + targetHost);
                    }
                }
            }
        }

        if (cancel) return {
            cancel
        };
        else if (redirectUrl) return {
            redirectUrl
        }
        else return {};
    }, {
        urls: ["<all_urls>"]
    },
    ["blocking"]
);