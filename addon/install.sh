

cp /root/Hydro/packages/common/permission.ts /usr/local/share/.config/yarn/global/node_modules/@hydrooj/common/permission.ts -rf
cp /root/Hydro/packages/hydrooj/src/lib/ui.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/lib/ui.ts -rf
cp /root/Hydro/packages/hydrooj/src/interface.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/interface.ts -rf
cp /root/Hydro/packages/hydrooj/src/model/domain.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/domain.ts -rf 
cp /root/Hydro/packages/hydrooj/src/model/contest.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/contest.ts -rf 
cp /root/Hydro/packages/hydrooj/src/model/setting.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/setting.ts -rf 
cp /root/Hydro/packages/hydrooj/src/model/builtin.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/model/builtin.ts -rf 
cp /root/Hydro/packages/common/permission.ts /usr/local/share/.config/yarn/global/node_modules/@hydrooj/common/permission.ts -rf
cp /root/Hydro/packages/hydrooj/src/handler/domain.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/domain.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/home.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/home.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/user.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/user.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/manage.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/manage.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/homework.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/homework.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/contest.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/contest.ts -rf 
cp /root/Hydro/packages/hydrooj/src/handler/problem.ts /usr/local/share/.config/yarn/global/node_modules/hydrooj/src/handler/problem.ts -rf 
cp /root/Hydro/packages/hydrooj/setting.yaml /usr/local/share/.config/yarn/global/node_modules/hydrooj/setting.yaml -rf
cp /root/Hydro/framework/framework/decorators.ts /usr/local/share/.config/yarn/global/node_modules/@hydrooj/framework/ -rf
cp /root/Hydro-sm/addon/SmNotebook.tsx /root/Hydro/packages/ui-default/components/scratchpad/ -rf 
# cp templates/* /root/addon/templates/ -rf
# cp locales/* /root/addon/locales/ -rf 
# cp public/* /root/addon/public/ -rf 

pm2 restart hydrooj --update-env
