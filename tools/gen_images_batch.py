#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
grsai nano-banana 批量生图驱动（严格并发 <= 3 / 失败重绘 / 断点续跑）

用法:
  python tools/gen_images_batch.py --jobs tools/image-jobs.json --outdir java-learning-app/assets/img
"""
import argparse, json, os, re, ssl, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://grsai.dakka.com.cn"
SKILL_PY = os.path.expanduser("~/.workbuddy/skills/grsai-nano-banana/grsai_generate.py")
MAX_WORKERS = 3  # 硬上限，禁止上调


def get_api_key():
    if os.environ.get("GRSAI_API_KEY"):
        return os.environ["GRSAI_API_KEY"].strip()
    src = open(SKILL_PY, encoding="utf-8").read()
    m = re.search(r'DEFAULT_API_KEY\s*=\s*["\']([^"\']+)["\']', src)
    return m.group(1).strip() if m else ""


CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def http_post(path, payload, api_key, timeout=60):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + api_key,
                 "User-Agent": "Mozilla/5.0"},
        method="POST")
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return json.loads(r.read().decode("utf-8"))


def download(url, dest, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r, open(dest, "wb") as f:
        f.write(r.read())


def generate_one(job, outdir, api_key, tries=6):
    name, prompt = job["name"], job["prompt"]
    ext = ".png" if name in ("logo", "android-icon-foreground") else ".jpg"
    dest = os.path.join(outdir, name + ext)
    # 断点续跑：已存在且 >10KB 视为成功
    if os.path.exists(dest) and os.path.getsize(dest) > 10 * 1024:
        print(f"[skip] {name} 已存在")
        return name, True, "cached"
    last = ""
    for i in range(1, tries + 1):
        try:
            res = http_post("/v1/draw/nano-banana", {
                "model": "nano-banana-fast", "prompt": prompt,
                "aspectRatio": job.get("aspect", "16:9"), "imageSize": "1K", "webHook": "-1"
            }, api_key)
            if res.get("code") != 0:
                raise RuntimeError(f"submit code={res.get('code')} msg={res.get('msg')}")
            task_id = res["data"]["id"]
            deadline, urls = time.time() + 300, None
            while time.time() < deadline:
                time.sleep(4)
                p = http_post("/v1/draw/result", {"id": task_id}, api_key)
                d = p.get("data") or {}
                status = d.get("status")
                if status == "succeeded":
                    urls = [(x.get("url") or "") for x in (d.get("results") or []) if x.get("url")]
                    break
                if status in ("failed", "error"):
                    raise RuntimeError(f"task {status}: {d.get('failure_reason') or ''}")
            if not urls:
                raise RuntimeError("轮询超时/无结果")
            tmp = dest + ".tmp"
            download(urls[0], tmp)
            sz = os.path.getsize(tmp) if os.path.exists(tmp) else 0
            if sz < 10 * 1024:
                raise RuntimeError(f"下载文件过小 {sz}B")
            os.replace(tmp, dest)
            print(f"[ OK ] {name} -> {dest} ({sz//1024}KB)")
            return name, True, "generated"
        except Exception as e:
            last = str(e)[:180]
            print(f"[retry {i}/{tries}] {name}: {last}")
            time.sleep(5 * i)
    print(f"[FAIL] {name}: {last}")
    return name, False, last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default="tools/image-jobs.json")
    ap.add_argument("--outdir", default="java-learning-app/assets/img")
    ap.add_argument("--passes", type=int, default=5)
    a = ap.parse_args()
    api_key = get_api_key()
    if not api_key:
        print("错误：未取到 API KEY", file=sys.stderr); sys.exit(2)
    os.makedirs(a.outdir, exist_ok=True)
    jobs = json.load(open(a.jobs, encoding="utf-8"))
    print(f"待生成 {len(jobs)} 张 -> {os.path.abspath(a.outdir)} (并发 {MAX_WORKERS})")

    pending, all_ok = list(jobs), {}
    for p in range(1, a.passes + 1):
        if not pending:
            break
        print(f"\n=== 第 {p} 轮：{len(pending)} 张 ===")
        failed = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futs = {ex.submit(generate_one, j, a.outdir, api_key): j for j in pending}
            for f in as_completed(futs):
                try:
                    name, ok, info = f.result()
                except Exception as e:          # 主循环异常防御：不能中断整批
                    name, ok, info = futs[f]["name"], False, f"exception: {e}"
                all_ok[name] = ok
                if not ok:
                    failed.append(next(j for j in pending if j["name"] == name))
        pending = failed
        time.sleep(3)

    bad = [n for n, ok in all_ok.items() if not ok]
    print("\n===== 汇总 =====")
    for n in [j["name"] for j in jobs]:
        print(f"  {n}: {'OK' if all_ok.get(n) else 'FAILED'}")
    print(f"成功 {len(jobs)-len(bad)}/{len(jobs)}" + (f"，失败：{bad}" if bad else "，全部完成"))


if __name__ == "__main__":
    main()
