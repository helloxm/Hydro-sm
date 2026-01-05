import { Handler, Types, param, PRIV } from "hydrooj";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// 静态站点根目录（根据实际路径调整）
const STATIC_ROOT = resolve(__dirname, "./slidevsite");

export class StaticSiteHandler extends Handler {
  noCheckPermView = true; // 允许匿名访问（按需调整）

  @param("path", Types.String, "") // 匹配子路径（如 /static-site/path/to/file）
  async get({ path }) {
    if (!this.user.hasPriv(PRIV.PRIV_USER_PROFILE)) {
      this.response.status = 401; // 未授权
      this.response.body = "Unauthorized: Please login first";
      return;
    }

    //拼接完整文件路径，默认返回 index.html
    const filePath = path
      ? join(STATIC_ROOT, path)
      : join(STATIC_ROOT, "index.html");

    // ✅ 校验2：终极路径安全防护（双重保险），防止任何路径穿越
    if (!filePath.startsWith(STATIC_ROOT)) {
      this.response.status = 403;
      this.response.body = "Forbidden: 非法路径访问";
      return;
    }

    // ✅ 校验3：文件是否存在
    if (!existsSync(filePath)) {
      this.response.status = 404;
      this.response.body = "File not found by fangjt";
      return;
    }

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      this.response.status = 404;
      this.response.body = "File not found";
      return;
    }

    // 根据文件后缀设置 Content-Type
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypeMap = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      png: "image/png",
      jpg: "image/jpeg",
      svg: "image/svg+xml",
      json: "application/json",
    };
    this.response.type = contentTypeMap[ext] || "application/octet-stream";

    // 读取并返回文件内容
    this.response.body = readFileSync(filePath);
  }
}

export async function apply(ctx: Context) {
  // 配置静态子站根路径（如 /slidevsite 对应外部静态包）
  ctx.Route("static_site", "/slidevsite/*path", StaticSiteHandler);
}
