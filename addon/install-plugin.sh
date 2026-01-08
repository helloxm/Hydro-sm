
rm -rf /root/.hydro/addons/buydomain && cp ../packages/buydomain  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/buydomain
rm -rf /root/.hydro/addons/smpaste && cp ../packages/smpaste  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/smpaste
rm -rf /root/.hydro/addons/smsuggestion && cp ../packages/smsuggestion  /root/.hydro/addons/ -rf add hydrooj addon add /root/.hydro/addons/smsuggestion
rm -rf /root/.hydro/addons/slidev && cp ../packages/slidev  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/slidev
rm -rf /root/.hydro/addons/smdocs && cp ../packages/smdocs  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/smdocs
rm -rf /root/.hydro/addons/wechat-md && cp ../packages/wechat-md  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/wechat-md
rm -rf /root/.hydro/addons/addon && cp ../addon  /root/.hydro/addons/ -rf && hydrooj addon add /root/.hydro/addons/addon

pm2 restart hydrooj --update-env
