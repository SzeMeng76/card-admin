# 💳 Card Admin

> 轻量级虚拟卡管理系统，支持多用户权限、交易记录追踪，以及 Telegram Bot 集成。

---

## 功能一览

### 管理员
| 功能 | 说明 |
|------|------|
| 卡片管理 | 创建、编辑卡片信息（持卡人、CVC、有效期、货币）、封卡/解封、删除 |
| 交易记录 | 充值、扣款、编辑金额、删除记录，余额自动重算；支持自定义交易时间（补录历史记录） |
| 用户管理 | 创建用户、重置密码、删除用户、绑定 Telegram |
| 系统统计 | 卡片总数、活跃卡数、总余额、今日交易笔数 |

### 普通用户（Portal）
- 查看名下卡片余额及详情
- 查看本人交易记录

### Telegram Bot
| 指令 | 权限 | 说明 |
|------|------|------|
| `/cards` | 所有人 | 查看我的卡片 |
| `/balance` | 所有人 | 余额汇总 |
| `/txn` | 所有人 | 最近 10 笔交易 |
| `/allcards` | 管理员 | 查看所有卡片 |
| `/stats` | 管理员 | 系统统计 |
| `/card 卡号` | 管理员 | 查特定卡片及最近交易 |
| `/user 用户名` | 管理员 | 查用户名下所有卡片 |
| `/topup 卡号 金额 备注` | 管理员 | 充值 |
| `/deduct 卡号 金额 备注` | 管理员 | 扣款 |
| `/block 卡号` | 管理员 | 封卡 |
| `/unblock 卡号` | 管理员 | 解封 |

**实时推送通知**：每笔新交易创建后，自动推送通知给持卡人（若已绑定 TG）及所有管理员（若已绑定 TG），通知内容包含卡号、类型、金额、余额、备注及交易时间。

---

## 快速部署

### 前置要求
- Docker + Docker Compose
- 有公网 HTTPS 域名（Telegram Webhook 必须）

### 1. 准备配置

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# 必填
JWT_SECRET=换成一个随机长字符串
ADMIN_PASSWORD=管理员初始密码
DATABASE_PATH=/app/data/cards.db

# Telegram Bot（可选）
TELEGRAM_BOT_TOKEN=从 @BotFather 获取
TELEGRAM_BOT_USERNAME=你的bot用户名（不含@）
TELEGRAM_WEBHOOK_SECRET=随机字符串，越复杂越好
APP_URL=https://你的域名.com
TELEGRAM_BOT_MODE=webhook
```

> 生成随机密钥：`openssl rand -hex 32`

### 2. 启动

```bash
docker compose up -d
```

访问 `https://你的域名.com`，默认账号 `admin`，密码为 `ADMIN_PASSWORD` 的值。

### 3. Telegram Bot 配置

1. 去 [@BotFather](https://t.me/BotFather) 发送 `/newbot` 创建 Bot，获取 Token
2. 填入 `.env` 对应变量
3. 启动容器后**自动注册 Webhook**，无需手动操作

---

## 绑定 Telegram 账号

**用户自助绑定**
1. 登录网站
2. 右上角点击 `TG` 按钮
3. 点击生成的链接跳转到 Telegram
4. Bot 自动完成绑定

**管理员直接绑定**
1. 进入用户管理页面
2. 点击对应用户的 `TG` 按钮
3. 填入用户的 Telegram 数字 ID（可在 [@userinfobot](https://t.me/userinfobot) 查询）
4. 保存即可

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `ADMIN_PASSWORD` | ✅ | 初始管理员密码 |
| `DATABASE_PATH` | ✅ | SQLite 数据库文件路径 |
| `TELEGRAM_BOT_TOKEN` | ❌ | BotFather 提供的 Token |
| `TELEGRAM_BOT_USERNAME` | ❌ | Bot 用户名（不含 @） |
| `TELEGRAM_WEBHOOK_SECRET` | ❌ | Webhook 校验密钥 |
| `APP_URL` | ❌ | 网站 HTTPS 域名，用于自动注册 Webhook |
| `TELEGRAM_BOT_MODE` | ❌ | `webhook`（默认）或 `polling`（无 HTTPS 时用） |

---

## 技术栈

- **框架**：Next.js 16 + React 19
- **数据库**：SQLite（better-sqlite3）
- **样式**：Tailwind CSS + Radix UI
- **认证**：JWT（jose）+ HTTP-only Cookie
- **Bot**：grammY
- **部署**：Docker（standalone 模式）
- **国际化**：next-intl（中文 / English）
