import { Handler, Types, param, PRIV, DomainModel, UserModel, PERM, ForbiddenError, PermissionError } from "hydrooj";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// 静态站点根目录（根据实际路径调整）
const STATIC_ROOT = resolve(__dirname, "./smdocs");

export class StaticSiteHandler extends Handler {
  noCheckPermView = true; // 允许匿名访问（按需调整）

  @param("path", Types.String, "") // 匹配子路径（如 /static-site/path/to/file）
  async get({ domainId, path }) {

    if (!this.user.hasPriv(PRIV.PRIV_USER_PROFILE)) {
      this.response.redirect = '/login';
      return;
    }

    const domainUser = await DomainModel.getDomainUser(
        domainId, // 当前请求的域ID（如 ctx.domainId）
        { _id: this.user._id } // 用户全局信息（_id=用户ID，priv=全局权限位）
    );
    if(!domainUser.join && !(this.user.priv & PRIV.PRIV_VIEW_ALL_DOMAIN)) {
      this.response.status = 403;
      this.response.body = "Forbidden: 请联系牛老师（微信：Quinus100),加入本课程后才能访问。";
      return;
    }

    // /d/domainId/slidevsite/*path => ./slidevsite/domainId/*path
    const rootDir = join(STATIC_ROOT, domainId);

    //拼接完整文件路径，默认返回 index.html
    const filePath = path
      ? join(rootDir, path)
      : join(rootDir, "index.html");

    // ✅ 校验2：终极路径安全防护（双重保险），防止任何路径穿越
    if (!filePath.startsWith(STATIC_ROOT)) {
      this.response.status = 403;
      this.response.body = "Forbidden: 非法路径访问";
      return;
    }

    // ✅ 校验3：文件是否存在
    if (!existsSync(filePath)) {
      this.response.status = 404;
      this.response.body = "File not found by fangjt, path: "+filePath;
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
  ctx.Route("smdocs_site", "/smdocs/*path", StaticSiteHandler);
}
