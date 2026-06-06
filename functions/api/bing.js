/**
 * @file GET /api/bing — server-side proxy for Bing wallpaper API.
 * Bing blocks CORS for browser fetches, so we proxy + cache here.
 * Returns up to 8 recent wallpapers.
 */

const BING_URL = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN'

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400',
}

export async function onRequestGet() {
  try {
    const res = await fetch(BING_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 mao-nav-bing-proxy' },
    })
    if (!res.ok) throw new Error(`Bing HTTP ${res.status}`)
    const data = await res.json()
    const images = (data.images || []).map((img) => ({
      url: 'https://www.bing.com' + (img.url || ''),
      thumb: 'https://www.bing.com' + (img.url || '').replace(/_\d+x\d+\./, '_400x240.'),
      title: img.title || '',
      copyright: img.copyright || '',
      date: img.startdate || '',
    }))
    return new Response(JSON.stringify({ success: true, data: images }), {
      status: 200, headers,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Bing 代理失败', data: [] }),
      { status: 500, headers },
    )
  }
}
