
文档
https://hydro.js.org/docs/Hydro/dev

第一个Terminal
yarn hydrooj addon add @hydrooj/ui-default
yarn hydrooj addon add /root/addon
yarn debug --port=2333 --watch

第二个Terminal 
yarn build:ui:dev

打开浏览器访问
http://127.0.0.1:8000


---------------

数据库配置文件 
cat /root/.hydro/config.json
输出例如： {"uri":"mongodb://hydro:lrNRiuWvBw1HVL3GxUKfyQYyfXTOFHQe@127.0.0.1:27017/hydro"}

连接数据库： mongo


---
替换ui-default

第一步
yarn build:ui:production   编译生成的文件放在 ui-default/public下面

第二步
rm -rf /usr/local/share/.config/yarn/global/node_modules/@hydrooj/ui-default
cp Hydro/packages/ui-default /usr/local/share/.config/yarn/global/node_modules/@hydrooj/ -rf


