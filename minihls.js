function hls_load(mime, playlist, element) {
    let xhr = new XMLHttpRequest()
    xhr.open("GET", playlist, true)
    xhr.onload = () => {
        let resp = xhr.response.split("\n")
        let parts = []
        for (let i = 0; i < resp.length; i++) {
            let l = resp[i]
            if (l.length === 0) {
                continue
            }

            if (l[0] === "#") {
                if (l.startsWith('#EXT-X-MAP:URI="')) {
                    parts.push(l.slice(16, -1))
                }

                continue
            }

            parts.push(l)
        }

        let ms = new MediaSource()
        ms.onsourceopen = () => {
            let downloaded = {}
            let sb = ms.addSourceBuffer(mime)
            let added = 0
            sb.onupdateend = function() {
                if (downloaded[added+1]) {
                    added++
                    sb.appendBuffer(downloaded[added])
                }

                if (added+1 === parts.length) {
                    ms.endOfStream()
                }
            }
            for (let i = 0; i < parts.length; i++) {
                let xhr = new XMLHttpRequest()
                xhr.open("GET", parts[i], true)
                xhr.responseType = "arraybuffer"
                xhr.onload = () => {
                    downloaded[i] = xhr.response
                    if (i == 0) {
                        sb.appendBuffer(xhr.response)
                    } else {
                        if (!sb.updating) {
                            sb.onupdateend()
                        }
                    }
                }
                xhr.send()
            }
        }
        element.src = URL.createObjectURL(ms)
    }
    xhr.send()
}