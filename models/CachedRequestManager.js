import * as utilities from "../utilities.js";
import * as HttpContext from "../httpContext.js";
import * as serverVariables from "../serverVariables.js";

let repositoryCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

global.requestCaches = [];
global.cacheCleanerStarted = false;
export default class CachedRequestManager {
    static get(HttpContext) {
        if (HttpContext != undefined) {
            if(HttpContext.req.method=="GET"){
                console.log("url: "+HttpContext.req.url);

                let cache = CachedRequestManager.find(HttpContext.req.url);
                if (cache != false) {
                    console.log(FgRed,"Utilisation de la cache de CachedRequestManager");
                    
                    HttpContext.response.JSON(cache.content, cache.ETag, true)
                    return true;
                }
            }
            return false;
           
        }
    }

    static add(url, content, ETag = "") {
        if (!cacheCleanerStarted) {
            cacheCleanerStarted = true;
            this.startCachedRequestCleaner();

        }
        if(url != ""){
            console.log(FgRed,"Ajout dans la cache de CachedRequestManager");
            this.clear(url);
            requestCaches.push({
                url, content,
                expire_time: utilities.nowInSeconds() + repositoryCachesExpirationTime,
                ETag
            });
        }
    }
    static find(url) {
        if (url != "") {
            for (let cache of requestCaches) {
                if (cache.url == url) {
                    console.log(FgRed,"Extraction d'une ressource de la cache de CachedRequestManager");
                    cache.expire_time = utilities.nowInSeconds() + repositoryCachesExpirationTime;
                    return cache;
                }
            }
        }
        return false;
    }
    static clear(url) {
        if (url != "") {
            let index = 0;
            let indexToDelete = [];
            for (let cache of requestCaches) {
                if (cache.url == url) {
                    indexToDelete.push(index);
                }
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }
    static clearByETag(ETag){
        requestCaches= requestCaches.filter(cache=>cache.ETag != ETag);
    }
    static startCachedRequestCleaner() {
        cacheCleanerStarted = true;
        setInterval(this.flushExpired, repositoryCachesExpirationTime * 1000);
        console.log(FgRed,'CachedRequestManager Cache Cleaner has started');

    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (now > cache.expire_time) {
                console.log(FgRed,"Cached file data of " + cache.url + ".json expired");
            }
        }
        requestCaches = requestCaches.filter(cache => cache.expire_time > now);
    }
}