import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from "uuid"
import { IsValidUUID, GenerateToken } from "./helpers"
import { defaultProviders, defaultProtocols, defaultALPNList, defaultPFList } from "./variables"
import { Env } from "./interfaces"

export async function GetPanel(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  try {
    const hash: string | null = await env.configs.get("Password")
    const token: string | null = await env.configs.get("Token")

    if (hash && url.searchParams.get("token") != token) {
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login`, 302)
    }
		
    const proxyIP: string = "IPPROXYHERE"
    const maxConfigs: number = parseInt(await env.configs.get("MaxConfigs") || "10")
    const protocols: Array<string> = (await env.configs.get("Protocols"))?.split("\n") || defaultProtocols
    const alpnList: Array<string> = (await env.configs.get("ALPNs"))?.split("\n") || defaultALPNList
    const fingerPrints: Array<string> = (await env.configs.get("FingerPrints"))?.split("\n") || defaultPFList
    const providers: Array<string> = (await env.configs.get("Providers"))?.split("\n") || defaultProviders
    const cleanDomainIPs: Array<string> = (await env.configs.get("CleanDomainIPs"))?.split("\n") || []
    const configs: Array<string> = (await env.configs.get("Configs"))?.split("\n") || []
    const includeOriginalConfigs: string = await env.configs.get("IncludeOriginalConfigs") || "yes"
    const includeMergedConfigs: string = await env.configs.get("IncludeMergedConfigs") || "yes"

    var uuid: string = await env.configs.get("UUID") || ""
    if (!IsValidUUID(uuid)) {
      uuid = uuidv4()
      await env.configs.put("UUID", uuid)
    }
		
    var htmlMessage = ""
    const message = url.searchParams.get("message")
    if (message == "success") {
      htmlMessage = `<div class="p-1 bg-success text-white fw-bold text-center">Pengaturan Berhasil Disimpan !!!</div>`
    } else if (message == "error") {
      htmlMessage = `<div class="p-1 bg-danger text-white fw-bold text-center">Pengaturan Gagal Disimpan !!!</div>`
    }

    var passwordSection = ""
    if (hash) {
      passwordSection = `
      <div class="mb-3 p-1">
        <button type="submit" name="reset_password" value="1" class="btn btn-danger">Hapus Password</button>
      </div>
      `
    } else {
      passwordSection = `
      <div class="mb-3 p-1">
        <label for="password" class="form-label fw-bold">
          Masukkan Password :
        </label>
        <input type="password" name="password" class="form-control" id="password" minlength="6"/>
        <p></p>
        <label for="password-confirmation" class="form-label fw-bold">
          Konfirmasi Password :
        </label>
        <input type="password" name="password_confirmation" class="form-control" id="password-confirmation" minlength="6"/>
      </div>
      `
    }

    var htmlContent  = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf8" />
      <title>BITS VPN - Cloudflare Workers</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
    </head>
    <body>
      <div class="p-3 bg-primary text-white">
        <div class="fs-4 fw-bold text-center">
          <h2>BITS VPN - Cloudflare Workers</h2>
        </div>
        <div class="fs-6 text-center">
          Simple Vless, Vmess & Trojan Agregator with Cloudflare Workers. Web Developed by <a href="https://bits.co.id" target="_blank" class="text-white">Nurul Imam</a> - <a href="https://bits.co.id" target="_blank" class="text-white">Banten IT Solutions</a>.
        </div>
      </div>
      ${htmlMessage}
      <div class="form-group col-md-6 mx-auto px-4 py-2">
        <label for="sub-link" class="form-label fw-bold">
          Link Subs v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox & Nekoray
        </label>
        <div class="input-group">
          <div class="input-group-prepend">
            <button class="btn btn-outline-secondary" type="button" onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)">Copy</button>
          </div>
          <input type="text" class="form-control" id="sub-link" readonly value="https://${url.hostname}/sub">
        </div>
      </div>
      <div class="form-group col-md-6 mx-auto px-4 pb-3">
        <label for="clash-link" class="form-label fw-bold">
          Link Subs Clash, ClashX & ClashMeta
        </label>
        <div class="input-group">
          <div class="input-group-prepend">
            <button class="btn btn-outline-secondary" type="button" onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)">Copy</button>
          </div>
          <input type="text" class="form-control" id="clash-link" readonly value="https://${url.hostname}/clash">
        </div>
      </div>
      <form class="form-group col-md-6 mx-auto px-4 py-4 border-top" method="post">
        <div class="mb-1 p-1">
          <label for="includes" class="form-label fw-bold">
            Pilih Konfigurasi :
          </label>
          <div id="includes">
            <div class="form-check">
              <input type="checkbox" name="merged" value="yes" class="form-check-input" id="merged-ckeck" ${includeMergedConfigs == "yes" ? "checked" : ""}>
              <label class="form-check-label" for="merged-ckeck">Cloudflare Workers</label>
            </div>
            <div class="form-check">
              <input type="checkbox" name="original" value="yes" class="form-check-input" id="original-ckeck" ${includeOriginalConfigs == "yes" ? "checked" : ""}>
              <label class="form-check-label" for="original-ckeck">Vless, Vmess & Trojan Agregator</label>
            </div>
          </div>
        </div>
        <!--div class="mb-1 p-1">
          <label for="proxy-ip" class="form-label fw-bold">
            IP Proxy :
          </label>
          <input type="text" name="proxy-ip" class="form-control" id="proxy-ip" value="${proxyIP}" />
          <div class="form-text"></div>
        </div-->
        <div class="mb-1 p-1">
          <label for="max-configs" class="form-label fw-bold">
            Jumlah Proxy :
          </label>
          <input type="number" name="max" class="form-control" id="max-configs" value="${maxConfigs}" min="5"/>
          <div class="form-text"></div>
        </div>
        <div class="mb-1 p-1">
          <label for="type" class="form-label fw-bold">
            Protokol Proxy :
          </label>
          <div id="type">
            <div class="form-check">
              <input type="checkbox" name="protocols" value="vmess" class="form-check-input" id="vmess-protocol-ckeck" ${protocols.includes('vmess') ? "checked" : ""} />
              <label class="form-check-label" for="vmess-protocol-ckeck">Vmess</label>
            </div>
            <div class="form-check">
              <input type="checkbox" name="protocols" value="vless" class="form-check-input" id="vless-protocol-ckeck" ${protocols.includes('vless') ? "checked" : ""} />
              <label class="form-check-label" for="vless-protocol-ckeck">Vless</label>
            </div>
            <div class="form-check">
              <input type="checkbox" name="protocols" value="trojan" class="form-check-input" id="trojan-protocol-ckeck" ${protocols.includes('trojan') ? "checked" : ""} />
              <label class="form-check-label" for="trojan-protocol-ckeck">Trojan</label>
            </div>
            <!--div class="form-check">
              <input type="checkbox" name="protocols" value="ss" class="form-check-input" id="ss-protocol-ckeck" ${protocols.includes('ss') ? "checked" : ""} />
              <label class="form-check-label" for="ss-protocol-ckeck">ShadowSocks</label>
            </div-->
          </div>
        </div>
        <!--div class="mb-1 p-1">
          <label for="clean-ip" class="form-label fw-bold">
            IP Bagus
          </label>
          <textarea rows="3" name="clean_ips" class="form-control" id="clean-ip">${cleanDomainIPs.join("\n")}</textarea>
          <div class="form-text">
            Masukkan 1 IP / Baris.
          </div>
          <div>
            <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#ip-scanner-modal">
              Cari
            </button>
            <div class="modal fade" id="ip-scanner-modal" tabindex="-1" aria-labelledby="ip-scanner-modal-label" aria-hidden="true">
              <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                  <div class="modal-header">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">
                      Close  
                    </button>
                  </div>
                  <div class="modal-body">
                    <iframe src="https://vfarid.github.io/cf-ip-scanner/" style="width: 100%; height: 100vh;"></iframe>
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div-->
        <div class="mb-1 p-1">
          <label for="alpn-list" class="form-label fw-bold">
            ALPN :
          </label>
          <textarea rows="3" name="alpn_list" class="form-control" id="alpn-list">${alpnList.join("\n")}</textarea>
          <div class="form-text">
            Masukkan 1 Item / Baris.
          </div>
        </div>
        <div class="mb-1 p-1">
          <label for="pf-list" class="form-label fw-bold">
            Fingerprint :
          </label>
          <textarea rows="3" name="fp_list" class="form-control" id="fp-list">${fingerPrints.join("\n")}</textarea>
          <div class="form-text">
            Masukkan 1 Item / Baris.
          </div>
        </div>
        <div class="mb-1 p-1">
          <label for="providers" class="form-label fw-bold">
            Agregator :
          </label>
          <textarea rows="7" name="providers" class="form-control" id="providers">${providers.join("\n")}</textarea>
          <div class="form-text">
            Masukkan 1 URL / Baris (Base64, Yaml, Raw)
          </div>
        </div>
        <div class="mb-1 p-1">
          <label for="configs" class="form-label fw-bold">
            Pribadi :
          </label>
          <textarea rows="3" name="configs" class="form-control" id="configs">${configs.join("\n")}</textarea>
          <div class="form-text"> 
            Masukkan 1 URL / Baris (Base64, Yaml, Raw)
          </div>
        </div>
        ${passwordSection}
        <button type="submit" name="save" value="save" class="btn btn-primary">Simpan</button>
        <button type="submit" name="reset" value="reset" class="btn btn-warning">Reset</button>
      </form>
    </body>
    <script>
      window.addEventListener('message', function (event) {
        document.getElementById('clean-ip').value = event.data;
      });
    </script>
    </html>
    `
    return new Response(htmlContent, {
      headers: {"Content-Type": "text/html"},
    })
  } catch (e) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf8" />
      <title>BITS VPN - Cloudflare Workers</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous" rel="stylesheet" />
    </head>
    <body>
      <div class="p-3 bg-primary text-white">
        <div class="fs-4 fw-bold text-center">
          <h2>BITS VPN - Cloudflare Workers</h2>
        </div>
        <div class="fs-6 text-center">
          Simple Vless, Vmess & Trojan Agregator with Cloudflare Workers. Web Developed by <a href="https://bits.co.id" target="_blank" class="text-white">Nurul Imam</a> - <a href="https://bits.co.id" target="_blank" class="text-white">Banten IT Solutions</a>.
        </div>
      </div>
      <div class="form-group col-md-6 mx-auto px-4 py-2">
        <label for="sub-link" class="form-label fw-bold">
          Link Subs v2rayN, v2rayNG, v2rayA, Matsuri, Nekobox & Nekoray
        </label>
        <div class="input-group">
          <div class="input-group-prepend">
            <button class="btn btn-outline-secondary" type="button" onclick="var tmp=document.getElementById('sub-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)">Copy</button>
          </div>
          <input type="text" class="form-control" id="sub-link" readonly value="https://${url.hostname}/sub">
        </div>
      </div>
      <div class="form-group col-md-6 mx-auto px-4 pb-3">
        <label for="clash-link" class="form-label fw-bold">
          Link Subs Clash, ClashX & ClashMeta
        </label>
        <div class="input-group">
          <div class="input-group-prepend">
            <button class="btn btn-outline-secondary" type="button" onclick="var tmp=document.getElementById('clash-link');tmp.select();tmp.setSelectionRange(0,99999);navigator.clipboard.writeText(tmp.value)">Copy</button>
          </div>
          <input type="text" class="form-control" id="clash-link" readonly value="https://${url.hostname}/clash">
        </div>
      </div>

      <div class="form-group col-md-6 mx-auto mx-5 my-2 p-1 border bg-danger text-center">
        <p>Variabel "configs" tidak ditemukan ! Silahkan buat namespace di Workers / KV ! Tambahkan variabel "configs" di pengaturan workers.</p>
      </div>
      <div class="form-group col-md-6 mx-auto mx-5 my-2 p-1 border bg-success text-white text-center">
        <p>Anda bisa menggunakan BITS VPN tanpa BITS VPN Dashboard.</p>
      </div>
  </body>
</html>
    `
    return new Response(htmlContent, {
      headers: {"Content-Type": "text/html"},
    })
  }
}

export async function PostPanel(request: Request, env: Env): Promise<Response> {
  const url: URL = new URL(request.url)
  var token: string | null = await env.configs.get("Token")
  try {
    const formData = await request.formData()
    var hashedPassword: string | null = await env.configs.get("Password")

    if (hashedPassword && url.searchParams.get("token") != token) {
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}/login`, 302)
    }

    if (formData.get("reset_password")) {
      await env.configs.delete("Password")
      await env.configs.delete("Token")
      return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=success`, 302)
    } else if (formData.get("save")) {
      const password: string | null = formData.get("password")
      if (password) {
        if (password.length < 6 || password !== formData.get("password_confirmation")) {
          return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=invalid-password`, 302)
        }
        hashedPassword = await bcrypt.hash(password, 10);
        token = GenerateToken(24)
        await env.configs.put("Password", hashedPassword)
        await env.configs.put("Token", token)
      }
      
      await env.configs.put("ProxyIP", "IPPROXYHERE")
      await env.configs.put("MaxConfigs", formData.get("max") || "200")
      await env.configs.put("Protocols", formData.getAll("protocols")?.join("\n").trim())
      await env.configs.put("ALPNs", formData.get("alpn_list")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.configs.put("FingerPrints", formData.get("fp_list")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.configs.put("Providers", formData.get("providers")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.configs.put("CleanDomainIPs", formData.get("clean_ips")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.configs.put("Configs", formData.get("configs")?.trim().split("\n").map(str => str.trim()).join("\n") || "")
      await env.configs.put("IncludeOriginalConfigs", formData.get("original") || "no")
      await env.configs.put("IncludeMergedConfigs", formData.get("merged") || "no")
    } else {
      await env.configs.delete("ProxyIP")
      await env.configs.delete("MaxConfigs")
      await env.configs.delete("Protocols")
      await env.configs.delete("ALPNs")
      await env.configs.delete("FingerPrints")
      await env.configs.delete("Providers")
      await env.configs.delete("CleanDomainIPs")
      await env.configs.delete("Configs")
      await env.configs.delete("IncludeOriginalConfigs")
      await env.configs.delete("IncludeMergedConfigs")
      await env.configs.delete("UUID")
      await env.configs.delete("Password")
      await env.configs.delete("Token")
    }

    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=success${token ? "&token=" + token : ""}`, 302)
  } catch (e) {
    return Response.redirect(`${url.protocol}//${url.hostname}${url.port != "443" ? ":" + url.port : ""}?message=error${token ? "&token=" + token : ""}`, 302)
  }
}
