const CHECKIN_URL = "https://glados.one/api/user/checkin";

export async function checkIn(env) {
  if (!env.GLADOS_COOKIE) throw new Error("Missing GLADOS_COOKIE secret");

  const response = await fetch(CHECKIN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: env.GLADOS_COOKIE,
      referer: "https://glados.one/console/checkin",
    },
    body: JSON.stringify({ token: "glados.one" }),
  });

  const text = await response.text();
  let message = text;
  try { message = JSON.parse(text).message ?? text; } catch {}
  message = String(message).replace(/[\r\n]+/g, " ").slice(0, 200);

  if (!response.ok) throw new Error(`GLaDOS returned HTTP ${response.status}: ${message}`);
  if (/login|unauthori[sz]ed|cookie.*(?:expired|invalid)|请.*登录|未登录/i.test(message)) {
    throw new Error(`GLaDOS login expired: ${message}`);
  }
  console.log(`GLaDOS check-in response: ${message}`);
  return { status: response.status, message };
}

function serverChanUrl(sendKey) {
  if (sendKey.startsWith("SCT")) return `https://sctapi.ftqq.com/${sendKey}.send`;
  const match = /^sctp(\d+)t/.exec(sendKey);
  if (match) return `https://${match[1]}.push.ft07.com/send/${sendKey}.send`;
  throw new Error("Unsupported ServerChan SendKey format");
}

export async function notify(env, title, description) {
  if (!env.SERVERCHAN_SENDKEY) {
    console.warn("SERVERCHAN_SENDKEY is not configured; notification skipped");
    return;
  }
  const response = await fetch(serverChanUrl(env.SERVERCHAN_SENDKEY), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ title, desp: description }),
  });
  const data = await response.json();
  if (!response.ok || data.code !== 0) {
    throw new Error(`ServerChan notification failed: HTTP ${response.status}, code ${data.code}`);
  }
  console.log(`ServerChan notification accepted: HTTP ${response.status}, code ${data.code}`);
}

export async function run(env) {
  let result;
  try {
    result = await checkIn(env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await notify(env, "GLaDOS 签到失败", `${message}\n\n请重新登录 GLaDOS 并更新 GLADOS_COOKIE。`);
    } catch (notifyError) { console.error(notifyError); }
    throw error;
  }

  const repeated = /repeat|already|已签到|重复/i.test(result.message);
  await notify(env, repeated ? "GLaDOS 今日已签到" : "GLaDOS 签到成功", result.message);
}

export default {
  async scheduled(_event, env) {
    try { await run(env); }
    catch (error) {
      console.error(`Scheduled run failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
};
