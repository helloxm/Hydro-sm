import { exec } from 'child_process';
import { inspect } from 'util';
import * as yaml from 'js-yaml';
import { omit } from 'lodash';
import Schema from 'schemastery';
import {
    CannotEditSuperAdminError, NotLaunchedByPM2Error, UserNotFoundError, ValidationError,
} from '../error';
import { Logger } from '../logger';
import { PRIV, STATUS } from '../model/builtin';
import domain from '../model/domain';
import record from '../model/record';
import * as setting from '../model/setting';
import * as system from '../model/system';
import user from '../model/user';
import { check } from '../service/check';
import {
    ConnectionHandler, Handler, param, requireSudo, Types,
} from '../service/server';
import { configSource, saveConfig, SystemSettings } from '../settings';
import * as judge from './judge';

const logger = new Logger('manage');

function set(key: string, value: any) {
    if (setting.SYSTEM_SETTINGS_BY_KEY[key]) {
        const s = setting.SYSTEM_SETTINGS_BY_KEY[key];
        if (s.flag & setting.FLAG_DISABLED) return undefined;
        if ((s.flag & setting.FLAG_SECRET) && !value) return undefined;
        if (s.type === 'boolean') {
            if (value === 'on') return true;
            return false;
        }
        if (s.type === 'number') {
            if (!Number.isSafeInteger(+value)) throw new ValidationError(key);
            return +value;
        }
        if (s.subType === 'yaml') {
            try {
                yaml.load(value);
            } catch (e) {
                throw new ValidationError(key);
            }
        }
        return value;
    }
    return undefined;
}

class SystemHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
}

class SystemMainHandler extends SystemHandler {
    async get() {
        this.response.redirect = '/manage/dashboard';
    }
}

class SystemCheckConnHandler extends ConnectionHandler {
    id: string;

    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        await this.check();
    }

    async check() {
        const log = (payload: any) => this.send({ type: 'log', payload });
        const warn = (payload: any) => this.send({ type: 'warn', payload });
        const error = (payload: any) => this.send({ type: 'error', payload });
        await check.run(this, log, warn, error, (id) => { this.id = id; });
    }

    async cleanup() {
        check.cancel(this.id);
    }
}

class SystemDashboardHandler extends SystemHandler {
    async get() {
        this.response.template = 'manage_dashboard.html';
    }

    async postRestart() {
        if (!process.env.pm_cwd) throw new NotLaunchedByPM2Error();
        exec(`pm2 reload "${process.env.name}"`);
        this.back();
    }
}

class SystemScriptHandler extends SystemHandler {
    async get() {
        this.response.template = 'manage_script.html';
        this.response.body.scripts = global.Hydro.script;
    }

    @param('id', Types.Name)
    @param('args', Types.Content, true)
    async post(domainId: string, id: string, raw = '{}') {
        if (!global.Hydro.script[id]) throw new ValidationError('id');
        let args = JSON.parse(raw);
        if (typeof global.Hydro.script[id].validate === 'function') {
            args = global.Hydro.script[id].validate(args);
        }
        const rid = await record.add(domainId, -1, this.user._id, '-', id, false, { input: raw, type: 'pretest' });
        const report = (data) => judge.next({ domainId, rid, ...data });
        report({ message: `Running script: ${id} `, status: STATUS.STATUS_JUDGING });
        const start = Date.now();
        // Maybe async?
        global.Hydro.script[id].run(args, report)
            .then((ret: any) => {
                const time = new Date().getTime() - start;
                judge.end({
                    domainId,
                    rid,
                    status: STATUS.STATUS_ACCEPTED,
                    message: inspect(ret, false, 10, true),
                    judger: 1,
                    time,
                    memory: 0,
                });
            })
            .catch((err: Error) => {
                const time = new Date().getTime() - start;
                logger.error(err);
                judge.end({
                    domainId,
                    rid,
                    status: STATUS.STATUS_SYSTEM_ERROR,
                    message: `${err.message} \n${(err as any).params || []} \n${err.stack} `,
                    judger: 1,
                    time,
                    memory: 0,
                });
            });
        this.response.body = { rid };
        this.response.redirect = this.url('record_detail', { rid });
    }
}

class SystemSettingHandler extends SystemHandler {
    @requireSudo
    async get() {
        this.response.template = 'manage_setting.html';
        this.response.body.current = {};
        this.response.body.settings = setting.SYSTEM_SETTINGS;
        for (const s of this.response.body.settings) {
            this.response.body.current[s.key] = system.get(s.key);
        }
    }

    @requireSudo
    async post(args: any) {
        const tasks = [];
        const booleanKeys = args.booleanKeys || {};
        delete args.booleanKeys;
        for (const key in args) {
            if (typeof args[key] === 'object') {
                for (const subkey in args[key]) {
                    const val = set(`${key}.${subkey}`, args[key][subkey]);
                    if (val !== undefined) {
                        tasks.push(system.set(`${key}.${subkey}`, val));
                    }
                }
            }
        }
        for (const key in booleanKeys) {
            if (typeof booleanKeys[key] === 'object') {
                for (const subkey in booleanKeys[key]) {
                    if (!args[key]?.[subkey]) tasks.push(system.set(`${key}.${subkey}`, false));
                }
            }
        }
        await Promise.all(tasks);
        this.ctx.broadcast('system/setting', args);
        this.back();
    }
}

class SystemConfigHandler extends SystemHandler {
    @requireSudo
    async get() {
        this.response.template = 'manage_config.html';
        let value = configSource;
        try {
            value = yaml.dump(Schema.intersect(SystemSettings)(yaml.load(configSource)));
        } catch (e) { }
        this.response.body = {
            schema: Schema.intersect(SystemSettings).toJSON(),
            value,
        };
    }

    @requireSudo
    @param('value', Types.String)
    async post(domainId: string, value: string) {
        let config;
        try {
            config = yaml.load(value);
            Schema.intersect(SystemSettings)(config);
        } catch (e) {
            throw new ValidationError('value');
        }
        await saveConfig(config);
    }
}

/* eslint-disable no-await-in-loop */
class SystemUserImportHandler extends SystemHandler {
    async get() {
        this.response.body.users = [];
        this.response.template = 'manage_user_import.html';
    }

    @param('users', Types.Content)
    @param('draft', Types.Boolean)
    async post(domainId: string, _users: string, draft: boolean) {
        const users = _users.split('\n');
        const udocs: { email: string, username: string, password: string, displayName?: string, [key: string]: any; }[] = [];
        const messages = [];
        const mapping = Object.create(null);
        const groups: Record<string, string[]> = Object.create(null);
        for (const i in users) {
            const u = users[i];
            if (!u.trim()) continue;
            let [email, username, password, displayName, extra] = u.split('\t').map((t) => t.trim());
            if (!email || !username || !password) {
                const data = u.split(',').map((t) => t.trim());
                [email, username, password, displayName, extra] = data;
                if (data.length > 5) extra = data.slice(4).join(',');
            }
            if (email && username && password) {
                if (!Types.Email[1](email)) messages.push(`Line ${+i + 1}: Invalid email.`);
                else if (!Types.Username[1](username)) messages.push(`Line ${+i + 1}: Invalid username`);
                else if (!Types.Password[1](password)) messages.push(`Line ${+i + 1}: Invalid password`);
                else if (udocs.find((t) => t.email === email) || await user.getByEmail('system', email)) {
                    messages.push(`Line ${+i + 1}: Email ${email} already exists.`);
                } else if (udocs.find((t) => t.username === username) || await user.getByUname('system', username)) {
                    messages.push(`Line ${+i + 1}: Username ${username} already exists.`);
                } else {
                    const payload: any = {};
                    try {
                        const data = JSON.parse(extra);
                        if (data.group) {
                            groups[data.group] ||= [];
                            groups[data.group].push(email);
                        }
                        Object.assign(payload, data);
                    } catch (e) { }
                    Object.assign(payload, {
                        email, username, password, displayName,
                    });
                    await this.ctx.serial('user/import/parse', payload);
                    udocs.push(payload);
                }
            } else messages.push(`Line ${+i + 1}: Input invalid.`);
        }
        messages.push(`${udocs.length} users found.`);
        if (!draft) {
            for (const udoc of udocs) {
                try {
                    const uid = await user.create(udoc.email, udoc.username, udoc.password);
                    // add to default course 'system
                    await domain.setUserRole('system', uid, 'Free');
                    await user.setById(uid, {
                        pinnedDomains: ['system'],
                    }),
                    mapping[udoc.email] = uid;
                    if (udoc.displayName) await domain.setUserInDomain(domainId, uid, { displayName: udoc.displayName });
                    if (udoc.school) await user.setById(uid, { school: udoc.school });
                    if (udoc.studentId) await user.setById(uid, { studentId: udoc.studentId });
                    await this.ctx.serial('user/import/create', uid, udoc);
                } catch (e) {
                    messages.push(e.message);
                }
            }
            const existing = await user.listGroup(domainId);
            for (const name in groups) {
                const uids = groups[name].map((i) => mapping[i]).filter((i) => i);
                const current = existing.find((i) => i.name === name)?.uids || [];
                if (uids.length) await user.updateGroup(domainId, name, Array.from(new Set([...current, ...uids])));
            }
        }
        this.response.body.users = udocs;
        this.response.body.messages = messages;
    }
}
/* eslint-enable no-await-in-loop */

const Priv = omit(PRIV, ['PRIV_DEFAULT', 'PRIV_NEVER', 'PRIV_NONE', 'PRIV_ALL']);
const allPriv = Math.sum(Object.values(Priv));

class SystemUserPrivHandler extends SystemHandler {
    @requireSudo
    async get() {
        const defaultPriv = system.get('default.priv');
        const udocs = await user.getMulti({ _id: { $gte: -1000, $ne: 1 }, priv: { $nin: [0, defaultPriv] } }).limit(1000).sort({ _id: 1 }).toArray();
        const banudocs = await user.getMulti({ _id: { $gte: -1000, $ne: 1 }, priv: 0 }).limit(1000).sort({ _id: 1 }).toArray();
        this.response.body = {
            udocs: [...udocs, ...banudocs],
            defaultPriv,
            Priv,
        };
        this.response.pjax = 'partials/manage_user_priv.html';
        this.response.template = 'manage_user_priv.html';
    }

    @requireSudo
    @param('uid', Types.Int)
    @param('priv', Types.UnsignedInt)
    @param('system', Types.Boolean)
    async post(domainId: string, uid: number, priv: number, editSystem: boolean) {
        if (!editSystem) {
            const udoc = await user.getById(domainId, uid);
            if (!udoc) throw new UserNotFoundError(uid);
            if (udoc.priv === -1 || priv === -1 || priv === allPriv) throw new CannotEditSuperAdminError();
            await user.setPriv(uid, priv);
        } else {
            const defaultPriv = system.get('default.priv');
            await user.coll.updateMany({ priv: defaultPriv }, { $set: { priv } });
            await system.set('default.priv', priv);
            this.ctx.broadcast('user/delcache', true);
        }
        this.back();
    }
}

class SystemUserListHandler extends SystemHandler {
    @requireSudo
    async get() {
        const defaultPriv = system.get('default.list');
        const udocs = await user.getMulti({ _id: { $gte: -1000, $ne: 1 } }).limit(1000).sort({ _id: 1 }).toArray();
        // const banudocs = await user.getMulti({ _id: { $gte: -1000, $ne: 1 }, priv: 0 }).limit(1000).sort({ _id: 1 }).toArray();
        this.response.body = {
            udocs: [...udocs],
            defaultPriv,
            Priv,
        };
        this.response.pjax = 'partials/manage_user_list.html';
        this.response.template = 'manage_user_list.html';
    }

    @requireSudo
    @param('uid', Types.Int)
    async postSetBan(domainId: string, uid: number) {
        const udoc = await user.getById(domainId, uid);
        if (udoc.priv === -1) throw new CannotEditSuperAdminError();

        await user.setPriv(uid, PRIV.PRIV_NONE); // 0: NONE
        this.ctx.broadcast('user/delcache', true);

        this.response.redirect = this.url('manage_user_list', {
            query: { notification: '禁用成功' },
        });
    }

    @requireSudo
    @param('uid', Types.Int)
    async postSetOpen(domainId: string, uid: number) {
        const udoc = await user.getById(domainId, uid);
        if (udoc.priv === -1) throw new CannotEditSuperAdminError();

        await user.setPriv(uid, PRIV.PRIV_USER_PROFILE | PRIV.PRIV_SEND_MESSAGE | PRIV.PRIV_REGISTER_USER);
        this.ctx.broadcast('user/delcache', true);
        this.response.redirect = this.url('manage_user_list', {
            query: { notification: '已放行' },
        });
    }

    @requireSudo
    @param('uid', Types.Int)
    async postSetDel(domainId: string, uid: number) {
        const udoc = await user.getById(domainId, uid);
        if (udoc.priv === -1) throw new CannotEditSuperAdminError();

        const tid = await ScheduleModel.add({
            executeAfter: moment().add(7, 'days').toDate(),
            type: 'script',
            id: 'deleteUser',
            args: { uid },
        });
        await user.setById(uid, { del: tid });
        this.response.redirect = this.url('manage_user_list', {
            query: { notification: '删除成功' },
        });
    }

    @requireSudo
    @param('uid', Types.Int)
    async postResetPassword(domainId: string, uid: number) {
        const udoc = await user.getById(domainId, uid);
        if (udoc.priv === -1) throw new CannotEditSuperAdminError();

        const password:string = '123456';
        await user.setPassword(uid, password);

        this.response.redirect = this.url('manage_user_list', {
            query: { notification: `reset passowrd: ${password}` },
        });
    }
}

export async function apply(ctx) {
    ctx.Route('manage', '/manage', SystemMainHandler);
    ctx.Route('manage_dashboard', '/manage/dashboard', SystemDashboardHandler);
    ctx.Route('manage_script', '/manage/script', SystemScriptHandler);
    ctx.Route('manage_setting', '/manage/setting', SystemSettingHandler);
    ctx.Route('manage_config', '/manage/config', SystemConfigHandler);
    ctx.Route('manage_user_import', '/manage/userimport', SystemUserImportHandler);
    ctx.Route('manage_user_priv', '/manage/userpriv', SystemUserPrivHandler);
    ctx.Route('manage_user_list', '/manage/userlist', SystemUserListHandler);
    ctx.Connection('manage_check', '/manage/check-conn', SystemCheckConnHandler);
}
