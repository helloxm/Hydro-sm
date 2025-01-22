

cp ../packages/hydrooj/src/lib/ui.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/lib/ui.ts -rf
cp ../packages/hydrooj/src/interface.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/interface.ts -rf
cp ../packages/hydrooj/src/model/domain.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/domain.ts -rf 
cp ../packages/hydrooj/src/model/contest.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/contest.ts -rf 
cp ../packages/hydrooj/src/model/setting.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/setting.ts -rf 
cp ../packages/hydrooj/src/model/builtin.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/builtin.ts -rf 
cp ../packages/hydrooj/src/handler/domain.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/domain.ts -rf 
cp ../packages/hydrooj/src/handler/home.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/home.ts -rf 
cp ../packages/hydrooj/src/handler/user.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/user.ts -rf 
cp ../packages/hydrooj/src/handler/manage.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/manage.ts -rf 
cp ../packages/hydrooj/src/handler/homework.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/homework.ts -rf 
cp ../packages/hydrooj/src/handler/contest.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/contest.ts -rf 
cp ../packages/hydrooj/src/handler/problem.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/problem.ts -rf 
cp ../packages/hydrooj/setting.yaml /usr/local/share/.config/yarn/global/node_modules/hydrooj/setting.yaml -rf
cp templates/* /root/addon/templates/ -rf
cp locales/* /root/addon/locales/ -rf 
# cp public/* /root/addon/public/ -rf 

pm2 restart hydrooj
