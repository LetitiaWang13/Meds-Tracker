export default function LoginPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mm-h2">登录</h2>
        <div className="mt-1 text-sm text-zinc-600">用于识别患者、跨设备同步（后续接入云端时）。</div>
      </div>

      <div className="mm-card">
        <div className="space-y-3">
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">手机号 / 邮箱</div>
            <input className="mt-2 mm-input" placeholder="例如 138****8888 / name@example.com" />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">验证码 / 密码</div>
            <input className="mt-2 mm-input" placeholder="先占位，后续接入鉴权" />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="mm-btn-primary" type="button">
              登录
            </button>
            <button className="mm-btn-secondary" type="button">
              获取验证码
            </button>
          </div>
          <div className="pt-2 text-sm text-zinc-600">
            还没有账号？{" "}
            <a className="mm-link" href="/register">
              去注册
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

