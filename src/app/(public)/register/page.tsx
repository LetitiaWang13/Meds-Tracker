export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mm-h2">注册</h2>
        <div className="mt-1 text-sm text-zinc-600">创建患者账号，后续用于跨设备同步与长期保存。</div>
      </div>

      <div className="mm-card">
        <div className="space-y-3">
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">昵称</div>
            <input className="mt-2 mm-input" placeholder="例如：妈妈 / 我自己" />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">手机号 / 邮箱</div>
            <input className="mt-2 mm-input" placeholder="用于登录（后续接入）" />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">验证码</div>
            <input className="mt-2 mm-input" placeholder="先占位" />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="mm-btn-primary" type="button">
              注册
            </button>
            <button className="mm-btn-secondary" type="button">
              获取验证码
            </button>
          </div>
          <div className="pt-2 text-sm text-zinc-600">
            已有账号？{" "}
            <a className="mm-link" href="/login">
              去登录
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

